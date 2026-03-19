"""
Model ModelVersion - Versionarea modelelor AI.
Păstrăm ultimele 5 versiuni pentru rollback.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Integer, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    model_name: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True,
        comment="classifier, ner_extractor, urgency_scorer, embeddings"
    )
    version: Mapped[str] = mapped_column(String(20), nullable=False)
    training_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    dataset_size: Mapped[int] = mapped_column(Integer, nullable=False)
    accuracy_metrics: Mapped[dict] = mapped_column(
        JSONB, nullable=True,
        comment="accuracy, f1, precision, recall per class"
    )
    model_path: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
