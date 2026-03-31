"""Teste pentru endpoint-uri rapoarte."""

from app.models.accountant_client import AccountantClient
from app.models.report import Report, ReportType, ReportStatus


class TestReports:
    def _assign_client(self, db, contabil_id, client_id):
        link = AccountantClient(accountant_id=contabil_id, client_id=client_id)
        db.add(link)
        db.commit()

    def test_create_report(self, client, db, test_user, test_contabil, contabil_headers):
        self._assign_client(db, test_contabil.id, test_user.id)

        resp = client.post("/api/reports/", headers=contabil_headers, json={
            "client_id": test_user.id,
            "title": "Raport TVA Q1",
            "report_type": "raport_tva",
            "period_start": "2026-01",
            "period_end": "2026-03",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Raport TVA Q1"
        assert data["status"] == "draft"

    def test_create_report_client_forbidden(self, client, test_user, auth_headers):
        resp = client.post("/api/reports/", headers=auth_headers, json={
            "client_id": test_user.id,
            "title": "Unauthorized Report",
            "report_type": "altele",
        })
        assert resp.status_code == 403

    def test_create_report_unassigned_client(self, client, db, test_user, test_contabil, contabil_headers):
        # Nu asignăm clientul
        resp = client.post("/api/reports/", headers=contabil_headers, json={
            "client_id": test_user.id,
            "title": "Raport",
            "report_type": "altele",
        })
        assert resp.status_code == 403

    def test_list_reports_as_contabil(self, client, db, test_user, test_contabil, contabil_headers):
        report = Report(
            created_by=test_contabil.id,
            client_id=test_user.id,
            title="Raport Test",
            report_type=ReportType.ALTELE,
        )
        db.add(report)
        db.commit()

        resp = client.get("/api/reports/", headers=contabil_headers)
        assert resp.status_code == 200
        assert resp.json()["total"] == 1

    def test_client_sees_own_reports(self, client, db, test_user, test_contabil, auth_headers):
        report = Report(
            created_by=test_contabil.id,
            client_id=test_user.id,
            title="Client Report",
            report_type=ReportType.ALTELE,
        )
        db.add(report)
        db.commit()

        resp = client.get("/api/reports/", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["total"] == 1

    def test_update_report(self, client, db, test_contabil, test_user, contabil_headers):
        report = Report(
            id="report-001",
            created_by=test_contabil.id,
            client_id=test_user.id,
            title="Draft",
            report_type=ReportType.RAPORT_TVA,
        )
        db.add(report)
        db.commit()

        resp = client.put("/api/reports/report-001", headers=contabil_headers, json={
            "title": "Finalizat",
            "status": "expediat",
        })
        assert resp.status_code == 200
        assert resp.json()["status"] == "expediat"
        assert resp.json()["sent_at"] is not None

    def test_delete_report(self, client, db, test_contabil, test_user, contabil_headers):
        report = Report(
            id="report-del",
            created_by=test_contabil.id,
            client_id=test_user.id,
            title="To Delete",
            report_type=ReportType.ALTELE,
        )
        db.add(report)
        db.commit()

        resp = client.delete("/api/reports/report-del", headers=contabil_headers)
        assert resp.status_code == 204
