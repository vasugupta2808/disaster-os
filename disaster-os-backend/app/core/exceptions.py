"""
Custom exceptions and their FastAPI handlers.

Why this file exists:
By default, an unhandled exception in FastAPI either leaks a raw Python
traceback to the client (dangerous - exposes internals) or returns an opaque
500 with zero detail (useless for the frontend to handle gracefully).

This module defines a small hierarchy of *expected* application errors
(not found, unauthorized, external API failure, validation failure) that
every layer of the app raises deliberately. The registered handlers turn
them into a single consistent JSON shape:

    {
        "error": {
            "code": "SHELTER_NOT_FOUND",
            "message": "Human-readable message safe to show in UI",
            "details": { ... optional structured context ... }
        }
    }

The frontend's API client (lib/api/client.ts) is written to expect exactly
this shape, so error handling on the frontend is uniform regardless of
which endpoint failed.
"""

from __future__ import annotations

from typing import Any

import structlog
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

logger = structlog.get_logger(__name__)


class AppError(Exception):
    """Base class for all deliberate, expected application errors.

    Anything raised as AppError (or a subclass) is treated as a "known"
    failure mode - safe to describe to the client. Anything else (a raw
    exception bubbling up from a bug) is treated as unexpected and gets
    logged with full detail but only a generic message is sent to the client.
    """

    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR
    error_code: str = "INTERNAL_ERROR"

    def __init__(self, message: str, details: dict[str, Any] | None = None) -> None:
        self.message = message
        self.details = details or {}
        super().__init__(message)


class NotFoundError(AppError):
    status_code = status.HTTP_404_NOT_FOUND
    error_code = "NOT_FOUND"


class UnauthorizedError(AppError):
    """Raised when a request has no valid Firebase ID token at all."""

    status_code = status.HTTP_401_UNAUTHORIZED
    error_code = "UNAUTHORIZED"


class ForbiddenError(AppError):
    """Raised when a request has a valid token but lacks permission
    for the specific resource (e.g. trying to cancel someone else's SOS)."""

    status_code = status.HTTP_403_FORBIDDEN
    error_code = "FORBIDDEN"


class ValidationFailedError(AppError):
    """For business-rule validation that Pydantic schemas can't express
    on their own (e.g. "shelter capacity exceeded"), as opposed to
    malformed request shape, which FastAPI/Pydantic already handles."""

    # Using the literal 422 rather than status.HTTP_422_UNPROCESSABLE_ENTITY:
    # that constant was renamed to HTTP_422_UNPROCESSABLE_CONTENT in newer
    # Starlette versions, and we'd rather not depend on either exact name
    # existing across different installed versions. The status code itself
    # (422) is stable regardless of what Starlette calls it.
    status_code = 422
    error_code = "VALIDATION_FAILED"


class ExternalServiceError(AppError):
    """Raised when a third-party API (Gemini, OpenWeather, ReliefWeb, Maps,
    FIRMS) fails or times out after retries. Kept distinct from our own
    bugs so the frontend can show "service temporarily unavailable" instead
    of a generic error, and so we can alert on these differently in logs."""

    status_code = status.HTTP_502_BAD_GATEWAY
    error_code = "EXTERNAL_SERVICE_ERROR"


class RateLimitedError(AppError):
    status_code = status.HTTP_429_TOO_MANY_REQUESTS
    error_code = "RATE_LIMITED"


def _error_payload(
    code: str, message: str, details: dict[str, Any] | None = None,
) -> dict[str, Any]:
    return {"error": {"code": code, "message": message, "details": details or {}}}


def register_exception_handlers(app: FastAPI) -> None:
    """Wires up all exception handlers on the FastAPI app instance.
    Called once from app/main.py during app construction."""

    @app.exception_handler(AppError)
    async def handle_app_error(request: Request, exc: AppError) -> JSONResponse:
        logger.warning(
            "app_error",
            path=request.url.path,
            error_code=exc.error_code,
            message=exc.message,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=_error_payload(exc.error_code, exc.message, exc.details),
        )

    @app.exception_handler(Exception)
    async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
        # This catches genuine bugs - things we did NOT anticipate.
        # Full detail goes to logs (for us to debug); a safe generic
        # message goes to the client (never leak internals).
        logger.error(
            "unhandled_exception",
            path=request.url.path,
            exc_info=exc,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_error_payload(
                "INTERNAL_ERROR",
                "Something went wrong on our end. Please try again.",
            ),
        )
