from pydantic import BaseModel, Field
from datetime import datetime


class TwoFactorRequest(BaseModel):
    """Web cere o provocare 2FA pentru o actiune."""
    action_type: str = Field(min_length=1, max_length=100)
    action_description: str | None = Field(default=None, max_length=500)


class TwoFactorChallengeResponse(BaseModel):
    """Raspunsul cu codul + token QR ce trebuie afisat pe Web."""
    challenge_id: str
    code: int  # 10-99
    qr_token: str
    expires_at: datetime
    action_type: str
    action_description: str | None = None


class TwoFactorVerify(BaseModel):
    """Mobile trimite codul introdus de user."""
    challenge_id: str = Field(max_length=36)
    code: int = Field(ge=10, le=99)


class TwoFactorPendingChallenge(BaseModel):
    """Provocare in asteptare - vizibila pe mobile."""
    id: str
    action_type: str
    action_description: str | None = None
    created_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True


class TwoFactorVerifyResponse(BaseModel):
    success: bool
    message: str
