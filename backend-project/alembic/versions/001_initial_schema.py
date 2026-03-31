"""Initial schema - create all tables.

Revision ID: 546f3e6b4170
Revises:
Create Date: 2026-03-31
"""
from alembic import op
import sqlalchemy as sa

revision = "546f3e6b4170"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # === Companies ===
    op.create_table(
        "companies",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("cui", sa.String(20), nullable=False, unique=True),
        sa.Column("encryption_key_ref", sa.String(100), nullable=False, server_default="ENCRYPTION_KEY_DEFAULT"),
        sa.Column("tier", sa.String(20), nullable=False, server_default="standard"),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_companies_cui", "companies", ["cui"])

    # === Users ===
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id"), nullable=True),
        sa.Column("username", sa.String(100), nullable=False, unique=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("phone", sa.String(20), nullable=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(200), nullable=True),
        sa.Column("avatar_url", sa.String(500), nullable=True),
        sa.Column("role", sa.Enum("admin", "contabil", "client", name="userrole"), nullable=False, server_default="client"),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("is_verified", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("two_factor_enabled", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("two_factor_secret", sa.String(255), nullable=True),
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_company_id", "users", ["company_id"])
    op.create_index("ix_users_username", "users", ["username"])
    op.create_index("ix_users_email", "users", ["email"])

    # === Documents ===
    op.create_table(
        "documents",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("owner_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("company_id", sa.String(36), sa.ForeignKey("companies.id"), nullable=True),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("document_type", sa.Enum(
            "factura", "chitanta", "contract", "extras_bancar", "bon_fiscal",
            "declaratie", "act_constitutiv", "certificat", "proces_verbal",
            "stat_plata", "altele",
            name="documenttype",
        ), nullable=False, server_default="altele"),
        sa.Column("status", sa.Enum(
            "incarcat", "in_procesare", "ocr_complet", "clasificat", "extras",
            "pending_approval", "requires_manual", "duplicate_detected",
            "verificat", "aprobat", "respins", "escaladat", "arhivat",
            name="documentstatus",
        ), nullable=False, server_default="incarcat"),
        sa.Column("file_path", sa.String(500), nullable=False),
        sa.Column("file_name", sa.String(300), nullable=False),
        sa.Column("file_size", sa.Integer(), nullable=True),
        sa.Column("mime_type", sa.String(100), nullable=True),
        sa.Column("ocr_text", sa.Text(), nullable=True),
        sa.Column("ocr_text_encrypted", sa.Text(), nullable=True),
        sa.Column("ocr_data", sa.Text(), nullable=True),
        sa.Column("file_hash", sa.String(64), nullable=True),
        sa.Column("fingerprint", sa.String(64), nullable=True),
        sa.Column("document_type_confidence", sa.Float(), nullable=True),
        sa.Column("urgency_score", sa.Float(), nullable=True, server_default="0.0"),
        sa.Column("urgency_breakdown", sa.Text(), nullable=True),
        sa.Column("avg_ocr_confidence", sa.Float(), nullable=True),
        sa.Column("has_flagged_fields", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("duplicate_of_id", sa.String(36), sa.ForeignKey("documents.id"), nullable=True),
        sa.Column("assigned_to", sa.String(36), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("approved_by", sa.String(36), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("approved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column("uploaded_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("processed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_documents_owner_id", "documents", ["owner_id"])
    op.create_index("ix_documents_company_id", "documents", ["company_id"])
    op.create_index("ix_documents_file_hash", "documents", ["file_hash"])
    op.create_index("ix_documents_fingerprint", "documents", ["fingerprint"])

    # === Extracted Fields ===
    op.create_table(
        "extracted_fields",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("document_id", sa.String(36), sa.ForeignKey("documents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("field_name", sa.String(50), nullable=False),
        sa.Column("value_encrypted", sa.Text(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=False),
        sa.Column("is_flagged", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("was_corrected", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("original_value_encrypted", sa.Text(), nullable=True),
        sa.Column("corrected_by", sa.String(36), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("corrected_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_extracted_fields_document_id", "extracted_fields", ["document_id"])

    # === Recommendations ===
    op.create_table(
        "recommendations",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("document_id", sa.String(36), sa.ForeignKey("documents.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rec_type", sa.String(30), nullable=False),
        sa.Column("content_encrypted", sa.Text(), nullable=False),
        sa.Column("confidence", sa.Float(), nullable=True),
        sa.Column("was_accepted", sa.Boolean(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_recommendations_document_id", "recommendations", ["document_id"])

    # === Reports ===
    op.create_table(
        "reports",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("created_by", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("client_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("report_type", sa.Enum(
            "bilant_contabil", "balanta_verificare", "registru_jurnal", "registru_casa",
            "declaratie_fiscala", "factura_emisa", "situatie_profit_pierdere", "raport_tva",
            "fisa_cont", "jurnal_vanzari", "jurnal_cumparari", "decont_tva",
            "raport_salarii", "altele",
            name="reporttype",
        ), nullable=False, server_default="altele"),
        sa.Column("status", sa.Enum(
            "draft", "in_lucru", "finalizat", "expediat", "vizualizat", "arhivat",
            name="reportstatus",
        ), nullable=False, server_default="draft"),
        sa.Column("period_start", sa.String(20), nullable=True),
        sa.Column("period_end", sa.String(20), nullable=True),
        sa.Column("file_path", sa.String(500), nullable=True),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column("sent_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_reports_created_by", "reports", ["created_by"])
    op.create_index("ix_reports_client_id", "reports", ["client_id"])

    # === Notifications ===
    op.create_table(
        "notifications",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("title", sa.String(300), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("notification_type", sa.Enum("urgent", "info", "warning", name="notificationtype"), nullable=False, server_default="info"),
        sa.Column("is_read", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])

    # === Accountant Clients ===
    op.create_table(
        "accountant_clients",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("accountant_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("client_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("assigned_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_accountant_clients_accountant_id", "accountant_clients", ["accountant_id"])
    op.create_index("ix_accountant_clients_client_id", "accountant_clients", ["client_id"])

    # === Training Examples ===
    op.create_table(
        "training_examples",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("document_id", sa.String(36), sa.ForeignKey("documents.id"), nullable=False),
        sa.Column("document_type", sa.String(30), nullable=True),
        sa.Column("ocr_text_encrypted", sa.Text(), nullable=True),
        sa.Column("predicted_entities_encrypted", sa.Text(), nullable=True),
        sa.Column("corrected_entities_encrypted", sa.Text(), nullable=True),
        sa.Column("type_was_correct", sa.Boolean(), nullable=True),
        sa.Column("urgency_feedback", sa.String(20), nullable=True),
        sa.Column("accountant_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("used_in_training", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_training_examples_document_id", "training_examples", ["document_id"])

    # === Model Versions ===
    op.create_table(
        "model_versions",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("model_name", sa.String(50), nullable=False),
        sa.Column("version", sa.String(20), nullable=False),
        sa.Column("training_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("dataset_size", sa.Integer(), nullable=False),
        sa.Column("accuracy_metrics", sa.Text(), nullable=True),
        sa.Column("model_path", sa.Text(), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_model_versions_model_name", "model_versions", ["model_name"])
    op.create_index("ix_model_versions_is_active", "model_versions", ["is_active"])

    # === Audit Log ===
    op.create_table(
        "audit_log",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("action_type", sa.String(50), nullable=False),
        sa.Column("user_id", sa.String(36), nullable=False),
        sa.Column("document_id", sa.String(36), nullable=True),
        sa.Column("ip_address", sa.String(45), nullable=True),
        sa.Column("user_agent", sa.Text(), nullable=True),
        sa.Column("details_encrypted", sa.Text(), nullable=True),
        sa.Column("previous_hash", sa.String(64), nullable=False, server_default="0" * 64),
        sa.Column("entry_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_audit_log_action_type", "audit_log", ["action_type"])
    op.create_index("ix_audit_log_user_id", "audit_log", ["user_id"])
    op.create_index("ix_audit_log_timestamp", "audit_log", ["timestamp"])

    # === Document Embeddings ===
    op.create_table(
        "document_embeddings",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("document_id", sa.String(36), sa.ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("embedding_path", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table("document_embeddings")
    op.drop_table("audit_log")
    op.drop_table("model_versions")
    op.drop_table("training_examples")
    op.drop_table("accountant_clients")
    op.drop_table("notifications")
    op.drop_table("reports")
    op.drop_table("recommendations")
    op.drop_table("extracted_fields")
    op.drop_table("documents")
    op.drop_table("users")
    op.drop_table("companies")

    # Drop enums
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("DROP TYPE IF EXISTS documenttype")
    op.execute("DROP TYPE IF EXISTS documentstatus")
    op.execute("DROP TYPE IF EXISTS reporttype")
    op.execute("DROP TYPE IF EXISTS reportstatus")
    op.execute("DROP TYPE IF EXISTS notificationtype")
