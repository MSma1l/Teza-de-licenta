"""
Model AuditLog - Log append-only cu integritate blockchain-style.
Fiecare entry conține hash-ul entry-ului anterior.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, INET
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    action_type: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True,
        comment="document_upload, document_approve, document_reject, "
                "field_correction, model_training, model_activate, "
                "user_login, user_logout, config_change"
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=False, index=True
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), nullable=True
    )
    ip_address: Mapped[str] = mapped_column(String(45), nullable=True)
    user_agent: Mapped[str] = mapped_column(Text, nullable=True)

    # Detalii criptate
    details_encrypted: Mapped[str] = mapped_column(Text, nullable=True)

    # Blockchain-style integrity
    previous_hash: Mapped[str] = mapped_column(String(64), nullable=False, default="0" * 64)
    entry_hash: Mapped[str] = mapped_column(String(64), nullable=False, unique=True)

    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
