import uuid
from datetime import datetime, timezone

from sqlalchemy import String, ForeignKey, DateTime, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class TrainingExample(Base):
    """Date colectate din corecțiile contabililor, pentru re-antrenare."""
    __tablename__ = "training_examples"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    document_id: Mapped[str] = mapped_column(String(36), ForeignKey("documents.id"), nullable=False, index=True)
    document_type: Mapped[str | None] = mapped_column(String(30), nullable=True)
    ocr_text_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    predicted_entities_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    corrected_entities_encrypted: Mapped[str | None] = mapped_column(Text, nullable=True)
    type_was_correct: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    urgency_feedback: Mapped[str | None] = mapped_column(String(20), nullable=True)
    accountant_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    used_in_training: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    document: Mapped["Document"] = relationship("Document", back_populates="training_examples")
