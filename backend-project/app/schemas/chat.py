from pydantic import BaseModel, Field
from datetime import datetime


class ChatMessageRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    conversation_id: str | None = Field(default=None, max_length=36)


class ChatMessageResponse(BaseModel):
    id: str
    conversation_id: str
    sender_type: str  # 'client', 'ai', 'contabil'
    content: str
    confidence: float | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationResponse(BaseModel):
    id: str
    user_id: str
    is_escalated: bool
    is_resolved: bool
    created_at: datetime
    messages: list[ChatMessageResponse] = []

    class Config:
        from_attributes = True


class FaqEntryCreate(BaseModel):
    question: str = Field(min_length=1, max_length=1000)
    answer: str = Field(min_length=1, max_length=5000)
    category: str | None = Field(default=None, max_length=100)
    keywords: str | None = Field(default=None, max_length=500)


class FaqEntryResponse(BaseModel):
    id: str
    question: str
    answer: str
    category: str | None = None
    keywords: str | None = None
    is_active: bool
    usage_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class EscalationNotice(BaseModel):
    message: str
    conversation_id: str
    escalated: bool = True
