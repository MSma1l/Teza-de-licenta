import uuid
from datetime import datetime, timezone

from sqlalchemy import String, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Company(Base):
    """Companie - entitate multi-tenant."""
    __tablename__ = "companies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    cui: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    encryption_key_ref: Mapped[str] = mapped_column(
        String(100), nullable=False, default="ENCRYPTION_KEY_DEFAULT",
    )
    tier: Mapped[str] = mapped_column(String(20), nullable=False, default="standard")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    users: Mapped[list["User"]] = relationship("User", back_populates="company")
