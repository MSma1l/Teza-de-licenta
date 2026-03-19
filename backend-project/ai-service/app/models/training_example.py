"""
Model TrainingExample - Date colectate din corecțiile contabililor.
Folosite pentru re-antrenarea modelelor.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Float, Boolean, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TrainingExample(Base):
    __tablename__ = "training_examples"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id"), nullable=False, index=True
    )

    # Clasificare
    document_type: Mapped[str] = mapped_column(String(30), nullable=True)
    ocr_text_encrypted: Mapped[str] = mapped_column(Text, nullable=True)

    # Predicted vs corrected entities
    predicted_entities_encrypted: Mapped[str] = mapped_column(Text, nullable=True)
    corrected_entities_encrypted: Mapped[str] = mapped_column(Text, nullable=True)

    # Feedback
    type_was_correct: Mapped[bool] = mapped_column(Boolean, nullable=True)
    urgency_feedback: Mapped[str] = mapped_column(
        String(20), nullable=True,
        comment="too_high, correct, too_low"
    )

    # Metadata
    accountant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    used_in_training: Mapped[bool] = mapped_column(Boolean, default=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relații
    document = relationship("Document", back_populates="training_examples")
