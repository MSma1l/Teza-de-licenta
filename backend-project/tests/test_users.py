"""Teste pentru endpoint-uri utilizatori: profil, parolă, avatar, admin routes."""


class TestProfile:
    def test_get_profile(self, client, test_user, auth_headers):
        resp = client.get("/api/v1/ac/users/me", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["username"] == "testuser"

    def test_update_profile(self, client, test_user, auth_headers):
        resp = client.put("/api/v1/ac/users/me", headers=auth_headers, json={
            "full_name": "Updated Name",
            "phone": "+37360000000",
        })
        assert resp.status_code == 200
        assert resp.json()["full_name"] == "Updated Name"
        assert resp.json()["phone"] == "+37360000000"

    def test_update_email_unique(self, client, test_user, test_contabil, auth_headers):
        resp = client.put("/api/v1/ac/users/me", headers=auth_headers, json={
            "email": "contabil@example.com",
        })
        assert resp.status_code == 400
        assert "Email" in resp.json()["detail"]


class TestChangePassword:
    def test_change_password_success(self, client, test_user, auth_headers):
        resp = client.post("/api/v1/ac/users/me/change-password", headers=auth_headers, json={
            "current_password": "password123",
            "new_password": "newpassword456",
            "confirm_password": "newpassword456",
        })
        assert resp.status_code == 200

        # Verificare login cu noua parolă
        login_resp = client.post("/api/v1/ac/auth/login", json={
            "username": "testuser",
            "password": "newpassword456",
        })
        assert login_resp.status_code == 200

    def test_change_password_wrong_current(self, client, test_user, auth_headers):
        resp = client.post("/api/v1/ac/users/me/change-password", headers=auth_headers, json={
            "current_password": "wrong",
            "new_password": "newpassword456",
            "confirm_password": "newpassword456",
        })
        assert resp.status_code == 400

    def test_change_password_mismatch(self, client, test_user, auth_headers):
        resp = client.post("/api/v1/ac/users/me/change-password", headers=auth_headers, json={
            "current_password": "password123",
            "new_password": "newpassword456",
            "confirm_password": "different789",
        })
        assert resp.status_code == 400

    def test_change_password_too_short(self, client, test_user, auth_headers):
        resp = client.post("/api/v1/ac/users/me/change-password", headers=auth_headers, json={
            "current_password": "password123",
            "new_password": "12345",
            "confirm_password": "12345",
        })
        assert resp.status_code == 400


class TestAdminRoutes:
    def test_list_users_as_admin(self, client, test_admin, admin_headers):
        resp = client.get("/api/v1/ac/users/", headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["total"] >= 1

    def test_list_users_as_client_forbidden(self, client, test_user, auth_headers):
        resp = client.get("/api/v1/ac/users/", headers=auth_headers)
        assert resp.status_code == 403

    def test_get_user_by_id(self, client, test_user, test_admin, admin_headers):
        resp = client.get(f"/api/v1/ac/users/{test_user.id}", headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["username"] == "testuser"

    def test_get_nonexistent_user(self, client, test_admin, admin_headers):
        resp = client.get("/api/v1/ac/users/nonexistent-id", headers=admin_headers)
        assert resp.status_code == 404


class TestAccountantClients:
    def test_assign_client(self, client, db, test_user, test_contabil, contabil_headers):
        resp = client.post(
            "/api/v1/ac/users/assign-client",
            headers=contabil_headers,
            params={"client_id": test_user.id},
        )
        assert resp.status_code == 200

    def test_get_my_clients(self, client, db, test_user, test_contabil, contabil_headers):
        from app.models.accountant_client import AccountantClient
        link = AccountantClient(
            accountant_id=test_contabil.id,
            client_id=test_user.id,
        )
        db.add(link)
        db.commit()

        resp = client.get("/api/v1/ac/users/my-clients", headers=contabil_headers)
        assert resp.status_code == 200
        assert resp.json()["total"] == 1
        assert resp.json()["users"][0]["username"] == "testuser"
