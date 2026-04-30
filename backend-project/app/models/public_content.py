"""
PublicContent — continut afisat pe pagina publica (landing).

Doua tipuri:
  - 'lege'  → apare in sectiunea Legislatie din landing
  - 'stire' → apare in sectiunea Noutati din landing

Adaugat doar de admin / super_admin. Vizibil tuturor (inclusiv neautentificat).
"""
import uuid
import enum
from datetime import datetime, timezone

from sqlalchemy import String, Text, DateTime, ForeignKey, Enum as SAEnum, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class PublicContentType(str, enum.Enum):
    LEGE = "lege"
    STIRE = "stire"


class PublicContent(Base):
    __tablename__ = "public_content"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    type: Mapped[str] = mapped_column(SAEnum(PublicContentType), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(300), nullable=False)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tag: Mapped[str | None] = mapped_column(String(80), nullable=True)
    color: Mapped[str | None] = mapped_column(String(20), nullable=True)
    published_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), index=True
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
