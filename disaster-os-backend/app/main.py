"""
FastAPI application entry point.

This is the file `uvicorn app.main:app` runs. Its only job is
construction and wiring: create the FastAPI instance, attach
middleware/exception handlers, run startup/shutdown tasks, and mount
routers. No business logic lives here - that's what
app/routers/*.py + app/services/*.py are for (added as we build each
feature in the next steps).
"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging
from app.db.session import init_db
from app.routers import alerts, chat, directions, disaster_analysis, places, sos, weather

configure_logging()
logger = structlog.get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup/shutdown hook.

    Why lifespan instead of @app.on_event("startup") (the older FastAPI
    pattern): on_event is deprecated and lifespan is the now-canonical
    way to run setup/teardown code exactly once around the app's actual
    running lifetime, with a single function instead of two separately
    registered callbacks that have to be kept in sync by hand.
    """
    logger.info("app_starting", env=settings.APP_ENV)
    await init_db()
    logger.info("app_ready")

    yield

    logger.info("app_shutting_down")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Disaster OS API",
        description="AI Disaster Response Assistant - backend API",
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"])
    app.include_router(
        disaster_analysis.router, prefix="/api/v1/disaster-analysis", tags=["disaster-analysis"]
    )
    app.include_router(weather.router, prefix="/api/v1/weather", tags=["weather"])
    app.include_router(alerts.router, prefix="/api/v1/alerts", tags=["alerts"])
    app.include_router(places.router, prefix="/api/v1/places", tags=["places"])
    app.include_router(directions.router, prefix="/api/v1", tags=["directions"])
    app.include_router(sos.router, prefix="/api/v1/sos", tags=["sos"])

    @app.get("/health", tags=["meta"])
    async def health_check() -> dict[str, str]:
        """Simple liveness check - used by deployment platforms and
        useful for confirming the backend is reachable at all before
        debugging anything more specific."""
        return {"status": "ok", "environment": settings.APP_ENV}

    return app


app = create_app()
