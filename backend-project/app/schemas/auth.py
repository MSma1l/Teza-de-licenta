from pydantic import BaseModel, EmailStr, Field, field_validator
import re

COMMON_PASSWORDS = {
    "12345678", "123456789", "1234567890", "password", "password1",
    "qwerty123", "abcdefgh", "admin123", "letmein1", "welcome1",
    "iloveyou", "trustno1", "sunshine1", "princess1", "football1",
}


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: str | None = Field(default=None, max_length=20)
    full_name: str | None = Field(default=None, max_length=200)

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3:
            raise ValueError("Username-ul trebuie sa aiba minim 3 caractere")
        if len(v) > 100:
            raise ValueError("Username-ul nu poate depasi 100 caractere")
        return v

    @field_validator("password")
    @classmethod
    def password_strong(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Parola trebuie sa aiba minim 8 caractere")
        if len(v) > 128:
            raise ValueError("Parola nu poate depasi 128 caractere")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Parola trebuie sa contina cel putin o litera majuscula")
        if not re.search(r"[a-z]", v):
            raise ValueError("Parola trebuie sa contina cel putin o litera minuscula")
        if not re.search(r"\d", v):
            raise ValueError("Parola trebuie sa contina cel putin o cifra")
        if v.lower() in COMMON_PASSWORDS:
            raise ValueError("Parola este prea comuna. Alege una mai sigura.")
        return v

    @field_validator("phone")
    @classmethod
    def phone_valid(cls, v: str | None) -> str | None:
        if v is None:
            return v
        if not re.match(r"^\+?[0-9]{7,15}$", v):
            raise ValueError("Numarul de telefon este invalid")
        return v


class LoginRequest(BaseModel):
    username: str = Field(max_length=100)
    password: str = Field(max_length=128)


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str
