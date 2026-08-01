"""
Gemini API service - the only file that talks to the google-genai SDK
directly. Both chat_service.py and disaster_analysis_service.py build on
top of the two functions here, rather than calling the Gemini SDK
themselves.

Why centralize this:
1. One place configures the API key, model names, and retry behavior.
2. Two genuinely different calling patterns live here, cleanly separated:
   - stream_text(): conversational chat - yields text chunks as they
     arrive from Gemini, for our SSE endpoint to forward to the frontend.
   - generate_structured(): disaster analysis - asks Gemini for a single
     JSON response matching a Pydantic schema, using Gemini's native
     structured-output mode (response_mime_type="application/json" +
     response_schema) rather than asking it to "please return JSON" in
     the prompt and hoping - native structured output mode constrains
     the model's actual token generation to match the schema, which is
     far more reliable than prompt-only JSON requests.
3. Retries (tenacity) wrap both - Gemini API calls can fail transiently
   (rate limits, brief network issues), and a disaster-response tool
   failing a request because of one dropped connection is exactly the
   kind of fragility we don't want, especially live in a demo.
"""

from collections.abc import AsyncIterator
from typing import Any, TypeVar

import structlog
from google import genai
from google.genai import types
from pydantic import BaseModel
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.core.config import settings
from app.core.exceptions import ExternalServiceError

logger = structlog.get_logger(__name__)

_client = genai.Client(api_key=settings.GEMINI_API_KEY)

TSchema = TypeVar("TSchema", bound=BaseModel)

# Retryable errors are transient (rate limit, server overload, timeout).
# We resolve these defensively rather than assuming exact class names,
# since the google-genai SDK's error hierarchy has shifted across
# versions and we have no way to verify the installed version's exact
# surface in this environment. APIError is the most stable, broadly
# documented base class across recent SDK versions - if it's not present
# for any reason, we fall back to retrying on Exception broadly rather
# than letting an AttributeError crash the app at import time.
try:
    _RETRYABLE_EXCEPTIONS: tuple[type[Exception], ...] = (genai.errors.APIError,)
except AttributeError:
    logger.warning(
        "gemini_sdk_error_classes_unavailable",
        note="Falling back to broad Exception retry - verify google-genai version.",
    )
    _RETRYABLE_EXCEPTIONS = (Exception,)


def _retry_config() -> dict[str, Any]:
    return {
        "retry": retry_if_exception_type(_RETRYABLE_EXCEPTIONS),
        "stop": stop_after_attempt(3),
        "wait": wait_exponential(multiplier=0.5, min=0.5, max=4),
        "reraise": True,
    }


async def stream_text(
    *,
    system_instruction: str,
    history: list[dict[str, str]],
    message: str,
) -> AsyncIterator[str]:
    """Streams a conversational text response from Gemini.

    `history` is a list of {"role": "user"|"assistant", "content": str}
    dicts (matches app/schemas/chat.py's ChatHistoryTurn) - converted here
    into the SDK's expected Content/Part structure, and Gemini's "model"
    role naming (not "assistant") is handled at this boundary so the rest
    of our app can use the more conventional "assistant" everywhere else.
    """
    contents = [
        types.Content(
            role="model" if turn["role"] == "assistant" else "user",
            parts=[types.Part.from_text(text=turn["content"])],
        )
        for turn in history
    ]
    contents.append(types.Content(role="user", parts=[types.Part.from_text(text=message)]))

    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        temperature=0.6,
        max_output_tokens=2048,
    )

    try:
        stream = await _client.aio.models.generate_content_stream(
            model=settings.GEMINI_TEXT_MODEL,
            contents=contents,
            config=config,
        )
        async for chunk in stream:
            if chunk.text:
                yield chunk.text
    except _RETRYABLE_EXCEPTIONS as exc:
        # Streaming can't use the @retry decorator (you can't "retry" a
        # generator that's already yielded partial output to the caller
        # without the caller re-requesting). If the FIRST chunk fails,
        # this raises cleanly; if it fails mid-stream, we surface what we
        # can and raise rather than silently truncating the response.
        logger.error("gemini_stream_failed", exc_info=exc)
        raise ExternalServiceError(
            "The AI assistant is temporarily unavailable. Please try again."
        ) from exc
    except Exception as exc:  # noqa: BLE001 - genuinely unexpected SDK failure
        logger.error("gemini_stream_unexpected_error", exc_info=exc)
        raise ExternalServiceError(
            "Something went wrong while generating a response."
        ) from exc


@retry(**_retry_config())  # type: ignore[untyped-decorator]
async def _call_gemini_structured(
    *,
    system_instruction: str,
    prompt: str,
    response_schema: type[BaseModel],
) -> str:
    """Internal retrying call - separated from generate_structured() so
    the @retry decorator wraps only the actual network call, not the
    response parsing that follows it (we don't want to re-call Gemini
    just because OUR OWN parsing logic has a bug)."""
    response = await _client.aio.models.generate_content(
        model=settings.GEMINI_TEXT_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.3,  # Lower than chat - classification should be consistent, not creative.
            response_mime_type="application/json",
            response_schema=response_schema,
        ),
    )
    if not response.text:
        raise ExternalServiceError("The AI returned an empty analysis.")
    return response.text


async def generate_structured(
    *,
    system_instruction: str,
    prompt: str,
    response_schema: type[TSchema],
) -> TSchema:
    """Requests a structured JSON response from Gemini, validated against
    a Pydantic schema. Used by disaster_analysis_service.py to get a
    GeminiDisasterAnalysisOutput back from a free-text situation
    description.
    """
    try:
        raw_json = await _call_gemini_structured(
            system_instruction=system_instruction,
            prompt=prompt,
            response_schema=response_schema,
        )
    except _RETRYABLE_EXCEPTIONS as exc:
        logger.error("gemini_structured_call_failed", exc_info=exc)
        raise ExternalServiceError(
            "The AI analysis service is temporarily unavailable. Please try again."
        ) from exc

    try:
        return response_schema.model_validate_json(raw_json)
    except Exception as exc:  # noqa: BLE001 - Gemini's output didn't match our schema
        # This should be rare given response_schema constrains generation,
        # but if the model ever produces something that fails validation,
        # we treat it as an external service failure (not OUR bug) and
        # log the raw output for debugging.
        logger.error("gemini_structured_output_invalid", raw_output=raw_json, exc_info=exc)
        raise ExternalServiceError(
            "The AI returned an analysis we couldn't understand. Please try again."
        ) from exc
