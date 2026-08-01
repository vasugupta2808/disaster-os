"""
Structured logging setup.

Why structlog instead of print() or bare logging.Logger:
Every log call here produces a structured event with named fields
(e.g. logger.warning("sos_created", sos_id=..., user_id=...)) instead of
a free-text string. That matters a lot for a disaster-response backend
specifically - when something goes wrong with an SOS request at 3am
during a live demo, you want to grep logs for `sos_id=abc123`, not
visually scan paragraphs of interpolated strings.

In development we render colored, human-readable output (matches what
you'd see from print(), but structured). In production we render single-line
JSON, which is what every log aggregation tool (Datadog, CloudWatch, etc.)
expects.
"""

import logging
import sys

import structlog

from app.core.config import settings


def configure_logging() -> None:
    """Call once, at app startup (from app/main.py)."""

    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
    ]

    if settings.is_production:
        renderer: structlog.types.Processor = structlog.processors.JSONRenderer()
    else:
        renderer = structlog.dev.ConsoleRenderer(colors=True)

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.processors.format_exc_info,
            renderer,
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            logging.DEBUG if settings.DEBUG else logging.INFO
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(file=sys.stdout),
        cache_logger_on_first_use=True,
    )
