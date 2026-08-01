"""
Auth dependency for protected routes.

Why this is a FastAPI Dependency (not middleware): middleware runs on
EVERY request, which would force us to special-case public routes (health
check, docs). A Dependency is opt-in per-route - we add
`current_user: AuthenticatedUser = Depends(get_current_user)` to exactly
the routes that need auth, and nothing else is affected. FastAPI also
documents the dependency in the OpenAPI schema automatically, so
auto-generated API docs correctly show which endpoints require a Bearer
token.
"""

from dataclasses import dataclass

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.exceptions import UnauthorizedError
from app.core.firebase import verify_id_token

# auto_error=False so we control the exact error response ourselves (via
# AppError -> our JSON error shape) instead of FastAPI's default
# HTTPBearer 403 response, which doesn't match our { error: {...} }
# contract.
_bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class AuthenticatedUser:
    """The current user, as derived from a verified Firebase ID token.
    Frozen because route handlers should treat this as read-only context,
    never mutate it."""

    uid: str
    email: str | None
    email_verified: bool


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> AuthenticatedUser:
    """Primary auth dependency - requires a valid Bearer token.

    Usage in a route:
        @router.post("/sos")
        def create_sos(
            payload: SosCreateRequest,
            current_user: AuthenticatedUser = Depends(get_current_user),
        ):
            ...
    """
    if credentials is None:
        raise UnauthorizedError("Missing authentication token.")

    claims = verify_id_token(credentials.credentials)

    return AuthenticatedUser(
        uid=claims["uid"],
        email=claims.get("email"),
        email_verified=claims.get("email_verified", False),
    )


def get_optional_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
) -> AuthenticatedUser | None:
    """For routes that behave differently for logged-in vs anonymous
    users but don't strictly require auth (we don't currently have one,
    but e.g. a public disaster-alerts feed that personalizes by location
    if logged in would use this). Returns None instead of raising when no
    token is present; still raises UnauthorizedError for a present-but-
    invalid token, since a bad token is a real error, not absence of one.
    """
    if credentials is None:
        return None
    return get_current_user(credentials)
