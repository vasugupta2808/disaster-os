"""
Chat router - HTTP layer only. All actual logic lives in
app/services/chat_service.py; this file's job is translating between
HTTP/SSE and that service's plain async generator of text chunks.

CRITICAL CONTRACT: the SSE event shape produced here
(`data: {"delta": "..."}\\n\\n`, then `data: {"done": true}\\n\\n`, or
`data: {"error": "..."}\\n\\n` on failure) must exactly match what the
frontend's lib/api/chat.ts streamChatMessage() parses. These two files
were designed together as one contract - if this shape ever changes,
that frontend file must change too.
"""

import json
from collections.abc import AsyncIterator

import structlog
from fastapi import APIRouter, Depends
from sse_starlette.sse import EventSourceResponse

from app.core.exceptions import ExternalServiceError
from app.core.security import AuthenticatedUser, get_current_user
from app.schemas.chat import ChatStreamRequest
from app.services import chat_service

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.post("/stream")
async def stream_chat(
    payload: ChatStreamRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> EventSourceResponse:
    """Streams a conversational AI response as Server-Sent Events.

    Why EventSourceResponse (sse-starlette) instead of a raw
    StreamingResponse: it handles the SSE wire format (event framing,
    keep-alives) correctly out of the box, rather than us hand-rolling
    `\\n\\n`-joined strings and getting subtle framing bugs that only show
    up over real network conditions, not localhost.
    """

    async def event_generator() -> AsyncIterator[dict[str, str]]:
        try:
            async for delta in chat_service.stream_chat_response(
                message=payload.message,
                history=[{"role": turn.role, "content": turn.content} for turn in payload.history],
            ):
                yield {"data": json.dumps({"delta": delta})}

            yield {"data": json.dumps({"done": True})}

        except ExternalServiceError as exc:
            # The stream has already started (HTTP 200 + SSE headers were
            # sent), so we can't change the status code at this point -
            # the only way to signal failure mid-stream is an SSE event
            # the frontend recognizes as an error, which
            # lib/api/chat.ts's streamChatMessage() specifically checks for.
            logger.error(
                "chat_stream_failed_mid_stream",
                user_id=current_user.uid,
                error=str(exc),
            )
            yield {"data": json.dumps({"error": exc.message})}
        except Exception as exc:  # noqa: BLE001 - last-resort guard for streaming context
            logger.error("chat_stream_unexpected_error", user_id=current_user.uid, exc_info=exc)
            yield {
                "data": json.dumps(
                    {"error": "Something went wrong while generating a response."}
                )
            }

    return EventSourceResponse(event_generator())
