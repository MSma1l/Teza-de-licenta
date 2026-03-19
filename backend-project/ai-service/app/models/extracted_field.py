"""
Model ExtractedField - Câmpuri extrase din documente prin NER.
Valorile sunt criptate. Corrections tracked for training.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Float, Boolean, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class ExtractedField(Base):
    __tablename__ = "extracted_fields"
    __table_args__ = (
        {"comment": "Câmpuri extrase din documente via NER model"},
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False, index=True
    )

    # Câmpul extras
    field_name: Mapped[str] = mapped_column(
        String(50), nullable=False,
        comment="invoice_num, date, vendor, cui, amount, vat, total, iban"
    )
    value_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)

    # Flagging
    is_flagged: Mapped[bool] = mapped_column(
        Boolean, default=False,
        comment="True dacă confidence < threshold"
    )

    # Corrections (pentru training)
    was_corrected: Mapped[bool] = mapped_column(Boolean, default=False)
    original_value_encrypted: Mapped[str] = mapped_column(Text, nullable=True)
    corrected_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=True
    )
    corrected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relații
    document = relationship("Document", back_populates="extracted_fields")
