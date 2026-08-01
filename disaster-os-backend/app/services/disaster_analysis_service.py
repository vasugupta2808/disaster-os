"""
Disaster analysis service - orchestrates the full structured analysis
feature end to end:

  1. Send the user's situation description to Gemini with a system
     prompt instructing it to classify disaster type, assess urgency,
     write instructions, and suggest relevant emergency numbers - all
     constrained to GeminiDisasterAnalysisOutput's schema.
  2. If we have the user's location, separately query real nearby
     shelters via places_service (Gemini never invents these).
  3. Merge both into one DisasterAnalysisResult and return it.

This is the file app/routers/disaster_analysis.py calls - it contains
ALL the business logic for this feature, so the router itself stays a
thin HTTP-shape translation layer.
"""

import structlog

from app.schemas.disaster_analysis import (
    DisasterAnalysisRequest,
    DisasterAnalysisResult,
    GeminiDisasterAnalysisOutput,
)
from app.services import gemini_service, places_service

logger = structlog.get_logger(__name__)

_SYSTEM_INSTRUCTION = """\
You are a disaster classification and emergency guidance engine for \
Disaster OS, an AI disaster response assistant. You will be given a \
free-text description of a real or potential emergency situation, \
written by someone who may be frightened, in a hurry, or in physical \
danger.

Your job, for every input, is to:

1. Classify the situation into exactly one disaster_type from the \
provided enum. If the situation does not clearly match a specific type, \
use "other"; if there is not enough information to classify at all, use \
"unknown".

2. Assess urgency as one of: critical, high, medium, low, info.
   - critical: immediate threat to life, action needed in seconds/minutes
   - high: serious risk, action needed soon (minutes/hours)
   - medium: real risk but not immediately life-threatening
   - low: minor risk or precautionary
   - info: general question, no current danger described

3. Write a one-to-two sentence plain-language summary of the situation.

4. Write `instructions`: an ordered list of clear, specific, actionable \
steps, MOST URGENT STEP FIRST. Write for someone who may be panicked - \
short sentences, concrete actions, no jargon. Never tell the user to \
"stay calm" as a first instruction; lead with the actual protective \
action.

5. List `emergency_numbers` relevant to the SPECIFIC situation described \
(e.g. poison control for a chemical exposure, not just generic police/\
fire/ambulance for every case). If the user's location/country is not \
known, default to widely-recognized numbers (112 as a general \
international emergency number) and say so in reasoning_note.

6. Optionally provide a brief `reasoning_note` explaining the \
classification or urgency call, especially for ambiguous cases.

You are NOT being asked to recommend shelters - shelter recommendations \
are handled separately using real location data. Do not include shelter \
names or addresses in your response.

This guidance supplements, and never replaces, professional emergency \
services. If the situation is life-threatening, your instructions should \
make clear that contacting local emergency services is a priority \
action, not an afterthought.
"""


async def analyze_situation(request: DisasterAnalysisRequest) -> DisasterAnalysisResult:
    gemini_output = await gemini_service.generate_structured(
        system_instruction=_SYSTEM_INSTRUCTION,
        prompt=request.situation,
        response_schema=GeminiDisasterAnalysisOutput,
    )

    shelters = []
    if request.latitude is not None and request.longitude is not None:
        try:
            shelters = await places_service.find_nearby_shelters(
                latitude=request.latitude,
                longitude=request.longitude,
            )
        except Exception as exc:  # noqa: BLE001
            # Shelter lookup failing should NOT take down the whole
            # analysis - the classification/instructions/emergency
            # numbers are still valuable and safety-relevant on their
            # own. We log the failure and return an empty shelter list
            # rather than raising and losing everything else.
            logger.warning("shelter_lookup_failed_during_analysis", exc_info=exc)
            shelters = []

    return DisasterAnalysisResult(
        disaster_type=gemini_output.disaster_type,
        urgency=gemini_output.urgency,
        summary=gemini_output.summary,
        instructions=gemini_output.instructions,
        emergency_numbers=gemini_output.emergency_numbers,
        shelters=shelters,
        reasoning_note=gemini_output.reasoning_note,
    )
