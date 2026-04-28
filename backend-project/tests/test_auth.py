"""Teste pentru autentificare: register, login, refresh, /me."""


class TestRegister:
    def test_register_success(self, client):
        resp = client.post("/api/v1/ac/auth/register", json={
            "username": "newuser",
            "email": "new@example.com",
            "password": "securepass",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["username"] == "newuser"
        assert data["email"] == "new@example.com"
        assert data["role"] == "client"
        assert data["is_active"] is True

    def test_register_duplicate_username(self, client, test_user):
        resp = client.post("/api/v1/ac/auth/register", json={
            "username": "testuser",
            "email": "other@example.com",
            "password": "securepass",
        })
        assert resp.status_code == 400
        assert "Username" in resp.json()["detail"]

    def test_register_duplicate_email(self, client, test_user):
        resp = client.post("/api/v1/ac/auth/register", json={
            "username": "otheruser",
            "email": "test@example.com",
            "password": "securepass",
        })
        assert resp.status_code == 400
        assert "Email" in resp.json()["detail"]

    def test_register_short_username(self, client):
        resp = client.post("/api/v1/ac/auth/register", json={
            "username": "ab",
            "email": "short@example.com",
            "password": "securepass",
        })
        assert resp.status_code == 422  # validation error

    def test_register_short_password(self, client):
        resp = client.post("/api/v1/ac/auth/register", json={
            "username": "validuser",
            "email": "valid@example.com",
            "password": "12345",
        })
        assert resp.status_code == 422

    def test_register_invalid_email(self, client):
        resp = client.post("/api/v1/ac/auth/register", json={
            "username": "validuser",
            "email": "not-an-email",
            "password": "securepass",
        })
        assert resp.status_code == 422

    def test_register_with_phone(self, client):
        resp = client.post("/api/v1/ac/auth/register", json={
            "username": "phoneuser",
            "email": "phone@example.com",
            "password": "securepass",
            "phone": "+37360123456",
            "full_name": "Phone User",
        })
        assert resp.status_code == 201
        assert resp.json()["full_name"] == "Phone User"


class TestLogin:
    def test_login_success(self, client, test_user):
        resp = client.post("/api/v1/ac/auth/login", json={
            "username": "testuser",
            "password": "password123",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client, test_user):
        resp = client.post("/api/v1/ac/auth/login", json={
            "username": "testuser",
            "password": "wrongpassword",
        })
        assert resp.status_code == 401

    def test_login_nonexistent_user(self, client):
        resp = client.post("/api/v1/ac/auth/login", json={
            "username": "nobody",
            "password": "password123",
        })
        assert resp.status_code == 401

    def test_login_by_email(self, client, test_user):
        resp = client.post("/api/v1/ac/auth/login", json={
            "username": "test@example.com",
            "password": "password123",
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()


class TestRefreshToken:
    def test_refresh_success(self, client, test_user):
        # Login first
        login_resp = client.post("/api/v1/ac/auth/login", json={
            "username": "testuser",
            "password": "password123",
        })
        refresh_token = login_resp.json()["refresh_token"]

        # Refresh
        resp = client.post("/api/v1/ac/auth/refresh", json={
            "refresh_token": refresh_token,
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()

    def test_refresh_invalid_token(self, client):
        resp = client.post("/api/v1/ac/auth/refresh", json={
            "refresh_token": "invalid.token.here",
        })
        assert resp.status_code == 401


class TestMe:
    def test_get_me(self, client, test_user, auth_headers):
        resp = client.get("/api/v1/ac/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["username"] == "testuser"
        assert data["email"] == "test@example.com"

    def test_get_me_no_token(self, client):
        resp = client.get("/api/v1/ac/auth/me")
        assert resp.status_code == 401  # no credentials

    def test_get_me_invalid_token(self, client):
        resp = client.get("/api/v1/ac/auth/me", headers={
            "Authorization": "Bearer invalid.token"
        })
        assert resp.status_code == 401
