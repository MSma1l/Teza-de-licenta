from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    phone: str | None = None
    full_name: str | None = None
    avatar_url: str | None = None
    role: str
    is_active: bool
    is_verified: bool
    two_factor_enabled: bool
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdateRequest(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    email: EmailStr | None = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str


class UserListResponse(BaseModel):
    users: list[UserResponse]
    total: int
