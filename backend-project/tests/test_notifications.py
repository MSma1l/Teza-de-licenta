"""Teste pentru endpoint-uri notificări."""

from app.models.notification import Notification, NotificationType


class TestNotifications:
    def _create_notif(self, db, user_id, title="Test Notif", is_read=False):
        notif = Notification(
            user_id=user_id,
            title=title,
            message="Test message",
            notification_type=NotificationType.INFO,
            is_read=is_read,
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif

    def test_list_notifications(self, client, db, test_user, auth_headers):
        self._create_notif(db, test_user.id, "Notif 1")
        self._create_notif(db, test_user.id, "Notif 2")

        resp = client.get("/api/v1/ac/notifications/", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["total"] == 2

    def test_list_only_own_notifications(self, client, db, test_user, test_contabil, auth_headers):
        self._create_notif(db, test_user.id, "Mine")
        self._create_notif(db, test_contabil.id, "Not mine")

        resp = client.get("/api/v1/ac/notifications/", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["total"] == 1

    def test_mark_read(self, client, db, test_user, auth_headers):
        notif = self._create_notif(db, test_user.id)
        assert notif.is_read is False

        resp = client.put(f"/api/v1/ac/notifications/{notif.id}/read", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["is_read"] is True

    def test_mark_all_read(self, client, db, test_user, auth_headers):
        self._create_notif(db, test_user.id, "N1")
        self._create_notif(db, test_user.id, "N2")

        resp = client.put("/api/v1/ac/notifications/read-all", headers=auth_headers)
        assert resp.status_code == 200

    def test_delete_notification(self, client, db, test_user, auth_headers):
        notif = self._create_notif(db, test_user.id)
        resp = client.delete(f"/api/v1/ac/notifications/{notif.id}", headers=auth_headers)
        assert resp.status_code == 204

    def test_delete_other_user_notification_404(self, client, db, test_user, test_contabil, auth_headers):
        notif = self._create_notif(db, test_contabil.id)
        resp = client.delete(f"/api/v1/ac/notifications/{notif.id}", headers=auth_headers)
        assert resp.status_code == 404
