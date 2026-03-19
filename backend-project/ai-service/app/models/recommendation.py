"""
Model Recommendation - Recomandări AI pentru documente.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Float, Boolean, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Recommendation(Base):
    __tablename__ = "recommendations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False, index=True
    )

    rec_type: Mapped[str] = mapped_column(
        String(30), nullable=False,
        comment="accounting_entry, similar_document, vendor_match, auto_classification"
    )
    content_encrypted: Mapped[str] = mapped_column(Text, nullable=False)
    confidence: Mapped[float] = mapped_column(Float, nullable=True)
    was_accepted: Mapped[bool] = mapped_column(Boolean, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relații
    document = relationship("Document", back_populates="recommendations")
