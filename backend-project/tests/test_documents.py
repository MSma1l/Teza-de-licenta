"""Teste pentru endpoint-uri documente: upload, list, get, update, delete."""

import io
from app.models.document import Document, DocumentStatus


class TestDocumentUpload:
    def test_upload_pdf(self, client, test_user, auth_headers):
        file_content = b"%PDF-1.4 fake pdf content"
        resp = client.post(
            "/api/v1/ac/documents/upload",
            headers=auth_headers,
            files={"file": ("test.pdf", io.BytesIO(file_content), "application/pdf")},
            data={"title": "Test Document", "description": "A test doc"},
        )
        assert resp.status_code == 201
        data = resp.json()
        assert data["title"] == "Test Document"
        assert data["status"] == "incarcat"
        assert data["file_name"] == "test.pdf"

    def test_upload_image(self, client, test_user, auth_headers):
        file_content = b"\xff\xd8\xff\xe0 fake jpeg"
        resp = client.post(
            "/api/v1/ac/documents/upload",
            headers=auth_headers,
            files={"file": ("photo.jpg", io.BytesIO(file_content), "image/jpeg")},
            data={"title": "Photo Document"},
        )
        assert resp.status_code == 201

    def test_upload_invalid_type(self, client, test_user, auth_headers):
        resp = client.post(
            "/api/v1/ac/documents/upload",
            headers=auth_headers,
            files={"file": ("malware.exe", io.BytesIO(b"bad"), "application/x-msdownload")},
            data={"title": "Bad File"},
        )
        assert resp.status_code == 400
        assert "nepermis" in resp.json()["detail"]

    def test_upload_no_auth(self, client):
        resp = client.post(
            "/api/v1/ac/documents/upload",
            files={"file": ("test.pdf", io.BytesIO(b"pdf"), "application/pdf")},
            data={"title": "No Auth"},
        )
        assert resp.status_code == 401


class TestDocumentList:
    def _create_doc(self, db, owner_id, title="Doc", status=DocumentStatus.INCARCAT):
        doc = Document(
            owner_id=owner_id,
            title=title,
            file_path="/fake/path",
            file_name="file.pdf",
            status=status,
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return doc

    def test_list_own_documents(self, client, db, test_user, auth_headers):
        self._create_doc(db, test_user.id, "Doc 1")
        self._create_doc(db, test_user.id, "Doc 2")

        resp = client.get("/api/v1/ac/documents/", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["total"] == 2

    def test_client_cannot_see_others_docs(self, client, db, test_user, test_contabil, auth_headers):
        self._create_doc(db, test_contabil.id, "Contabil Doc")

        resp = client.get("/api/v1/ac/documents/", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["total"] == 0

    def test_list_with_filter(self, client, db, test_user, auth_headers):
        self._create_doc(db, test_user.id, "Approved", DocumentStatus.APROBAT)
        self._create_doc(db, test_user.id, "Loaded", DocumentStatus.INCARCAT)

        resp = client.get("/api/v1/ac/documents/?doc_status=aprobat", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["total"] == 1


class TestDocumentOperations:
    def _create_doc(self, db, owner_id):
        doc = Document(
            owner_id=owner_id,
            title="Test Doc",
            file_path="/fake/path",
            file_name="file.pdf",
        )
        db.add(doc)
        db.commit()
        db.refresh(doc)
        return doc

    def test_get_document(self, client, db, test_user, auth_headers):
        doc = self._create_doc(db, test_user.id)
        resp = client.get(f"/api/v1/ac/documents/{doc.id}", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["title"] == "Test Doc"

    def test_get_nonexistent_document(self, client, test_user, auth_headers):
        resp = client.get("/api/v1/ac/documents/nonexistent", headers=auth_headers)
        assert resp.status_code == 404

    def test_get_other_users_document_forbidden(self, client, db, test_user, test_contabil, auth_headers):
        doc = self._create_doc(db, test_contabil.id)
        resp = client.get(f"/api/v1/ac/documents/{doc.id}", headers=auth_headers)
        assert resp.status_code == 403

    def test_update_document(self, client, db, test_user, auth_headers):
        doc = self._create_doc(db, test_user.id)
        resp = client.put(f"/api/v1/ac/documents/{doc.id}", headers=auth_headers, json={
            "title": "Updated Title",
            "description": "New desc",
        })
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated Title"

    def test_delete_document(self, client, db, test_user, auth_headers):
        doc = self._create_doc(db, test_user.id)
        resp = client.delete(f"/api/v1/ac/documents/{doc.id}", headers=auth_headers)
        assert resp.status_code == 204
