"""
Chat service - the conversational counterpart to disaster_analysis_service.

Deliberately thin: unlike disaster analysis, there's no multi-step
orchestration here (no Places lookups, no schema merging) - just a system
prompt applied to streaming Gemini generation. Kept as its own service
file (rather than inlined in the router) so the system prompt and any
future chat-specific logic (e.g. rate limiting, content filtering) have
an obvious home that isn't HTTP-routing code.
"""

from collections.abc import AsyncIterator

from app.services import gemini_service

_SYSTEM_INSTRUCTION = """\
You are the AI assistant for Disaster OS, a disaster response and \
emergency preparedness app. You help people with questions about \
emergency procedures, disaster safety, first aid basics, and \
preparedness planning.

Guidelines:
- Be clear, calm, and direct. Use short sentences and concrete steps.
- If a question describes an active, life-threatening emergency, your \
first sentence should be the single most important immediate action, \
and you should clearly state that the person should contact local \
emergency services right away.
- You are not a replacement for professional medical, legal, or \
emergency services advice - say so when relevant, briefly, without \
being repetitive about it in every message.
- If you don't know something specific (e.g. local emergency numbers \
for a country you're not given), say so rather than guessing \
confidently.
- Keep responses focused and not overly long, unless the user asks for \
more detail.
"""


async def stream_chat_response(
    *,
    message: str,
    history: list[dict[str, str]],
) -> AsyncIterator[str]:
    """Thin pass-through to gemini_service.stream_text with our system
    prompt applied. Exists as its own function (rather than having the
    router call gemini_service directly) so the system prompt lives in
    one obvious place and isn't duplicated if we ever add a second
    chat-like feature."""
    async for chunk in gemini_service.stream_text(
        system_instruction=_SYSTEM_INSTRUCTION,
        history=history,
        message=message,
    ):
        yield chunk
