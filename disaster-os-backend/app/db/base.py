"""
SQLAlchemy declarative base.

Why SQLAlchemy at all, given Firestore exists: Firestore is great for
realtime, document-shaped data (SOS status, live alerts) but awkward for
genuinely relational, query-heavy data. Emergency kit checklist templates
and offline guide content are exactly that - structured, relational,
admin-curated content that benefits from real SQL queries, migrations,
and constraints, and never needs a realtime listener. We use the right
tool for each job rather than forcing everything into one database.

Why SQLAlchemy 2.0 style (Mapped[...] / mapped_column) rather than the
legacy Column(...) declarative style: it gives every model field a real
Python type that mypy can check, instead of Any. For a "build it right"
project, that type safety is worth the slightly newer API surface.
"""

from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Every ORM model (app/models/*.py) inherits from this."""

    pass
