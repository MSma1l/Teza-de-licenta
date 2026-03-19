"""
Schemas Pydantic pentru training și modele.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from uuid import UUID

from pydantic import BaseModel


class TrainingStats(BaseModel):
    total_examples: int
    unused_examples: int
    type_corrections: int
    entity_corrections: int
    min_required: int
    can_retrain_classifier: bool
    can_retrain_ner: bool


class TrainingTriggerResponse(BaseModel):
    task_id: str
    model_name: str
    status: str
    message: str


class ModelVersionResponse(BaseModel):
    id: UUID
    model_name: str
    version: str
    training_date: datetime
    dataset_size: int
    accuracy_metrics: Optional[Dict[str, Any]]
    model_path: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class SystemHealth(BaseModel):
    status: str
    database: str
    redis: str
    ocr_engine: str
    classifier_model: str
    ner_model: str
    urgency_model: str
    faiss_index: str
    celery_workers: int
