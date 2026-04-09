"""
Login attempt tracking pentru rate limiting si lockout.

Politica:
- Maxim 3 incercari consecutive eronate
- Lockout 2 minute dupa 3 incercari esuate
- Counter se reseteaza la o autentificare reusita
- Tracking pe (username, ip_address) pentru a nu bloca alti useri din aceeasi retea
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import String, Integer, DateTime, Boolean, Index
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class LoginAttempt(Base):
    """Inregistrare a incercarilor de logare pentru lockout."""
    __tablename__ = "login_attempts"
    __table_args__ = (
        Index("ix_login_attempts_username_ip", "username", "ip_address"),
    )

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False)  # IPv6 max 45 chars
    failed_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_attempt_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    is_locked: Mapped[bool] = mapped_column(Boolean, default=False)
