"""
Admin access control dependency.

Why a separate dependency rather than inlining the check in each admin
route: if we later add more admin-only features (e.g. an alert broadcast
endpoint, a user management endpoint), each one just adds
`Depends(require_admin)` rather than duplicating the uid-in-set check
and its error message. One place to update the access-control logic,
one place to audit it.
"""

from fastapi import Depends

from app.core.config import settings
from app.core.exceptions import ForbiddenError
from app.core.security import AuthenticatedUser, get_current_user


def require_admin(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> AuthenticatedUser:
    """Dependency that requires the caller to be in the ADMIN_UIDS
    allowlist. Raises ForbiddenError (403) if not.

    Usage in a route:
        @router.get("/all")
        async def list_all_sos(
            admin: AuthenticatedUser = Depends(require_admin),
        ):
            ...
    """
    if not settings.admin_uids_set:
        raise ForbiddenError(
            "No admin UIDs are configured. Set ADMIN_UIDS in .env to enable admin access."
        )

    if current_user.uid not in settings.admin_uids_set:
        raise ForbiddenError("You do not have permission to perform this action.")

    return current_user
