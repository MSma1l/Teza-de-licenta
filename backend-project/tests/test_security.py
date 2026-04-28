"""Teste pentru funcțiile de securitate: JWT, hashing, token validation."""

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
)


class TestPasswordHashing:
    def test_hash_and_verify(self):
        hashed = hash_password("mysecretpass")
        assert hashed != "mysecretpass"
        assert verify_password("mysecretpass", hashed) is True
        assert verify_password("wrongpass", hashed) is False

    def test_different_hashes(self):
        h1 = hash_password("same")
        h2 = hash_password("same")
        assert h1 != h2  # bcrypt uses random salt


class TestJWT:
    def test_access_token_roundtrip(self):
        token = create_access_token({"sub": "user-123", "role": "client"})
        payload = decode_access_token(token)
        assert payload is not None
        assert payload["sub"] == "user-123"
        assert payload["role"] == "client"
        assert payload["type"] == "access"

    def test_refresh_token_roundtrip(self):
        token = create_refresh_token({"sub": "user-123", "role": "client"})
        payload = decode_refresh_token(token)
        assert payload is not None
        assert payload["sub"] == "user-123"
        assert payload["type"] == "refresh"

    def test_access_token_cannot_decode_as_refresh(self):
        token = create_access_token({"sub": "user-123"})
        payload = decode_refresh_token(token)
        assert payload is None  # wrong key or type

    def test_refresh_token_cannot_decode_as_access(self):
        token = create_refresh_token({"sub": "user-123"})
        payload = decode_access_token(token)
        assert payload is None

    def test_invalid_token(self):
        assert decode_access_token("garbage.token.value") is None
        assert decode_refresh_token("garbage.token.value") is None

    def test_empty_token(self):
        assert decode_access_token("") is None


class TestHealthCheck:
    def test_health(self, client):
        resp = client.get("/api/v1/ac/health")
        assert resp.status_code == 200
        assert resp.json()["status"] == "ok"
