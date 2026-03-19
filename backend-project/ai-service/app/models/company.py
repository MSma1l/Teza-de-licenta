"""
Model Company - Multi-tenant isolation.
Fiecare companie are propria cheie de criptare.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Company(Base):
    __tablename__ = "companies"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    cui: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    encryption_key_ref: Mapped[str] = mapped_column(
        String(100), nullable=False,
        comment="Referință la cheia de criptare din env vars (nu cheia în sine)"
    )
    tier: Mapped[str] = mapped_column(
        String(20), nullable=False, default="standard",
        comment="standard, premium, enterprise"
    )
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relații
    users = relationship("User", back_populates="company", lazy="selectin")
    documents = relationship("Document", back_populates="company", lazy="selectin")
