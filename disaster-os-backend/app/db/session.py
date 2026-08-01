"""
Async database engine and session management.

Why async SQLAlchemy (AsyncSession, async engine) rather than sync:
FastAPI is built around async/await throughout, and this app makes
several concurrent external API calls per request in places (e.g. a
"nearby help" endpoint that might query shelters, hospitals, and weather
together). A sync DB call would block the event loop and stall every
other in-flight request during that time. Async SQLAlchemy lets DB I/O
yield control back to the event loop like every other I/O in this app.

Why DATABASE_URL drives both SQLite (dev) and Postgres (prod) through one
code path: see app/core/config.py and .env.example - switching databases
is a one-line env var change, not a code change.
"""

from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG and not settings.is_production,
    # pool_pre_ping avoids "MySQL/Postgres server has gone away" errors
    # from stale pooled connections - cheap insurance, especially on
    # platforms that idle/sleep database connections (common on free-tier
    # hosting, which a hackathon project is likely to use).
    pool_pre_ping=True,
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that yields a DB session for the lifetime of a
    single request, and guarantees it's closed afterward regardless of
    whether the request succeeded or raised.

    Usage in a route:
        @router.get("/kit-templates")
        async def list_templates(db: AsyncSession = Depends(get_db_session)):
            ...
    """
    async with AsyncSessionLocal() as session:
        yield session


async def init_db() -> None:
    """Creates all tables that don't yet exist. Called once at app
    startup (see app/main.py's lifespan handler).

    NOTE: this is the right approach for a hackathon's pace of iteration
    (no migration tooling overhead). For a longer-lived production
    system, this should be replaced with Alembic migrations so schema
    changes are versioned and reversible - flagging that explicitly so
    it's a deliberate, known tradeoff rather than an oversight.
    """
    from app.db.base import Base  # noqa: PLC0415 - deferred import avoids a
    # circular import: models (which we'll add in app/models/) need to
    # import Base, and Base.metadata needs to know about all models
    # before create_all runs. Importing here, at call time, rather than
    # at module load time, breaks that cycle.

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
