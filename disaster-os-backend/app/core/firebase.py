"""
Firebase Admin SDK initialization.

Why the backend needs its own Firebase setup, separate from the frontend's
client SDK (lib/firebase/client.ts):

1. Auth verification - the frontend attaches a Firebase ID token to every
   authenticated request (Authorization: Bearer <token>). Only the Admin
   SDK, using the service account credential, can cryptographically verify
   that token actually came from Firebase and hasn't expired/been
   tampered with. This is what app/core/security.py's get_current_user
   dependency uses.

2. Firestore writes - per our architecture decision (backend proxies
   everything that needs validation), the backend uses the Admin SDK to
   write to Firestore for things like creating an SOS request, since the
   Admin SDK bypasses Firestore Security Rules entirely (it's trusted
   server-side access) and lets us enforce business logic in Python
   before anything hits the database. The frontend's client SDK, by
   contrast, is restricted by Security Rules and is used only for
   realtime READS (onSnapshot), never these validated writes.
"""

from functools import lru_cache
from typing import Any

import firebase_admin  # type: ignore[import-untyped]
import structlog
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials, firestore
from google.cloud.firestore import Client as FirestoreClient

from app.core.config import settings
from app.core.exceptions import UnauthorizedError

logger = structlog.get_logger(__name__)


@lru_cache
def get_firebase_app() -> firebase_admin.App:
    """Initializes the Firebase Admin app exactly once per process.

    lru_cache (rather than a module-level global + manual guard) gives us
    the same "only initialize once" behavior as the frontend's getApps()
    check, but idiomatically for Python - and it's trivially overridable
    in tests by clearing the cache.
    """
    try:
        return firebase_admin.get_app()
    except ValueError:
        import os
        import json
        
        # In Render, we can't upload files easily, so we allow pasting the JSON directly into an env var
        env_json = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")
        if env_json:
            cred_dict = json.loads(env_json)
            cred = credentials.Certificate(cred_dict)
        else:
            cred = credentials.Certificate(settings.FIREBASE_SERVICE_ACCOUNT_PATH)
            
        return firebase_admin.initialize_app(cred, {"projectId": settings.FIREBASE_PROJECT_ID})


@lru_cache
def get_firestore_client() -> FirestoreClient:
    """Firestore client for backend-side writes (e.g. creating SOS
    requests, after our own validation has run)."""
    get_firebase_app()  # Ensure the app is initialized first.
    return firestore.client()  # type: ignore[no-any-return]


def verify_id_token(id_token: str) -> dict[str, Any]:
    """Verifies a Firebase ID token and returns its decoded claims.

    Raises UnauthorizedError (our own exception type, not Firebase's) on
    any failure - expired token, malformed token, revoked token - so the
    rest of the app only ever has to handle ONE auth failure type,
    regardless of which specific way Firebase rejected the token.
    """
    get_firebase_app()
    try:
        return firebase_auth.verify_id_token(id_token, check_revoked=True)  # type: ignore[no-any-return]
    except firebase_auth.ExpiredIdTokenError as exc:
        raise UnauthorizedError("Your session has expired. Please sign in again.") from exc
    except firebase_auth.RevokedIdTokenError as exc:
        raise UnauthorizedError("Your session has been revoked. Please sign in again.") from exc
    except firebase_auth.InvalidIdTokenError as exc:
        raise UnauthorizedError("Invalid authentication token.") from exc
    except Exception as exc:  # noqa: BLE001 - intentionally broad, see docstring
        # Any other Firebase Admin SDK error (network issue reaching
        # Firebase, malformed input, etc.) - log the real cause for us,
        # but the client only ever sees a generic, safe message.
        logger.error("firebase_token_verification_failed", exc_info=exc)
        raise UnauthorizedError("Could not verify authentication token.") from exc
