import uuid
from datetime import datetime, timezone

from sqlalchemy import String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class AccountantClient(Base):
    """Relația contabil-client: un contabil poate avea mai mulți clienți."""
    __tablename__ = "accountant_clients"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    accountant_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    client_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    assigned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    accountant: Mapped["User"] = relationship("User", back_populates="clients", foreign_keys=[accountant_id])
    client: Mapped["User"] = relationship("User", back_populates="accountants", foreign_keys=[client_id])
