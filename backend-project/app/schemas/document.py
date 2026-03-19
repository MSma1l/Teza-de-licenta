from pydantic import BaseModel
from datetime import datetime


class DocumentResponse(BaseModel):
    id: str
    owner_id: str
    company_id: str | None = None
    title: str
    description: str | None = None
    document_type: str
    status: str
    file_name: str
    file_size: int | None = None
    mime_type: str | None = None
    ocr_text: str | None = None
    avg_ocr_confidence: float | None = None
    has_flagged_fields: bool = False
    document_type_confidence: float | None = None
    urgency_score: float | None = None
    uploaded_at: datetime
    processed_at: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    document_type: str | None = None
    status: str | None = None


class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int
