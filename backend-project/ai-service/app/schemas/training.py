"""
Schemas Pydantic pentru training și modele.
"""

from datetime import datetime
from typing import Optional, Dict, Any

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
    id: str  # varchar(36) in DB — accepta uuid-string fara cast forțat
    model_name: str
    version: str
    training_date: datetime
    dataset_size: int
    accuracy_metrics: Optional[Dict[str, Any]] = None
    model_path: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_model(cls, m) -> "ModelVersionResponse":
        """Adapter — accuracy_metrics e Text (JSON string) in DB, dar schema cere dict."""
        import json as _json
        am = m.accuracy_metrics
        if isinstance(am, str) and am:
            try:
                am = _json.loads(am)
            except (_json.JSONDecodeError, TypeError):
                am = None
        return cls(
            id=str(m.id),
            model_name=m.model_name,
            version=m.version,
            training_date=m.training_date,
            dataset_size=m.dataset_size,
            accuracy_metrics=am,
            model_path=m.model_path,
            is_active=m.is_active,
            created_at=m.created_at,
        )


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
