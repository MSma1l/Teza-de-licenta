"""
Schemas Pydantic pentru documente.
"""

from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID

from pydantic import BaseModel


class DocumentUploadResponse(BaseModel):
    id: UUID
    status: str
    message: str
    task_id: Optional[str] = None


class ExtractedFieldResponse(BaseModel):
    id: UUID
    field_name: str
    value: str
    confidence: float
    is_flagged: bool
    was_corrected: bool


class DocumentResponse(BaseModel):
    id: UUID
    company_id: UUID
    original_filename: str
    document_type: Optional[str]
    document_type_confidence: Optional[float]
    status: str
    urgency_score: Optional[float]
    urgency_breakdown: Optional[Dict[str, Any]]
    avg_ocr_confidence: Optional[float]
    has_flagged_fields: bool
    duplicate_of_id: Optional[UUID]
    assigned_to: Optional[UUID]
    approved_by: Optional[UUID]
    approved_at: Optional[datetime]
    processed_at: Optional[datetime]
    created_at: datetime
    extracted_fields: Optional[List[ExtractedFieldResponse]] = None

    model_config = {"from_attributes": True}


class DocumentQueueItem(BaseModel):
    id: UUID
    original_filename: str
    document_type: Optional[str]
    status: str
    urgency_score: Optional[float]
    avg_ocr_confidence: Optional[float]
    has_flagged_fields: bool
    assigned_to: Optional[UUID]
    created_at: datetime


class DocumentCorrection(BaseModel):
    document_type: Optional[str] = None
    fields: Optional[Dict[str, str]] = None  # field_name -> corrected_value
    urgency_feedback: Optional[str] = None  # too_high, correct, too_low


class DocumentApproval(BaseModel):
    notes: Optional[str] = None


class DocumentRejection(BaseModel):
    reason: str


class QueueStats(BaseModel):
    total_pending: int
    total_in_review: int
    total_approved_today: int
    total_rejected_today: int
    avg_urgency: float
    avg_processing_time_seconds: Optional[float]


class RecommendationResponse(BaseModel):
    id: UUID
    rec_type: str
    content: str
    confidence: Optional[float]
    was_accepted: Optional[bool]
