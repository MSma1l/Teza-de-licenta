"""
Two-Factor Authentication via Mobile App

Flux:
1. User pe Web vrea sa faca o actiune sensibila (cere raport, sterge document)
2. Web apeleaza /api/v1/ac/2fa/request -> primeste un cod random 10-99
3. Web afiseaza codul utilizatorului
4. Mobile app primeste notificare "esti tu cel care face X?"
5. Mobile cere user-ului codul de pe Web
6. User introduce codul in mobile -> Mobile apeleaza /api/v1/ac/2fa/verify
7. Daca match -> actiunea de pe Web se executa
"""
import uuid
from datetime import datetime, timezone, timedelta

from sqlalchemy import String, DateTime, ForeignKey, Integer, Boolean
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class TwoFactorChallenge(Base):
    """Provocare 2FA - cod random + token QR ce trebuie verificat din mobile."""
    __tablename__ = "two_factor_challenges"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    code: Mapped[int] = mapped_column(Integer, nullable=False)  # 10-99
    qr_token: Mapped[str] = mapped_column(String(64), nullable=False, unique=True, index=True)
    action_type: Mapped[str] = mapped_column(String(100), nullable=False)
    action_description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_expired: Mapped[bool] = mapped_column(Boolean, default=False)
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc) + timedelta(minutes=5),
    )
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
