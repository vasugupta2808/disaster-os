"""
Schemas for conversational chat streaming.

Deliberately minimal - chat is free-form text in, streamed text out. No
structured output concerns here, unlike disaster_analysis.py.
"""

from pydantic import BaseModel, Field


class ChatHistoryTurn(BaseModel):
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class ChatStreamRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    history: list[ChatHistoryTurn] = Field(default_factory=list, max_length=50)
