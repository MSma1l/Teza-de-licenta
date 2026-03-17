from pydantic import BaseModel, EmailStr, field_validator
import re


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    phone: str | None = None
    full_name: str | None = None

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        if len(v) < 3:
            raise ValueError("Username-ul trebuie să aibă minim 3 caractere")
        if len(v) > 100:
            raise ValueError("Username-ul nu poate depăși 100 caractere")
        return v.strip()

    @field_validator("password")
    @classmethod
    def password_strong(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Parola trebuie să aibă minim 6 caractere")
        return v

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not re.match(r"^\+?[0-9]{7,15}$", v):
            raise ValueError("Numărul de telefon este invalid")
        return v


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str
