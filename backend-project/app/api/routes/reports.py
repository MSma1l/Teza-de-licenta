import io

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.report import Report, ReportStatus
from app.models.accountant_client import AccountantClient
from app.schemas.report import ReportCreateRequest, ReportUpdateRequest, ReportResponse, ReportListResponse
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/reports", tags=["Rapoarte"])


def _safe_filename(text: str) -> str:
    """Sanitizeaza un string pentru a fi folosit ca nume de fisier."""
    keep = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_"
    return "".join(c if c in keep else "_" for c in text)[:60]


def _build_report_pdf(report: Report, owner_name: str | None) -> io.BytesIO:
    """Genereaza un PDF profesional dintr-un raport."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
        title=report.title,
        author="AI-Contabil",
    )

    styles = getSampleStyleSheet()
    style_titlu = ParagraphStyle(
        "TitluRaport",
        parent=styles["Heading1"],
        fontSize=20,
        textColor=colors.HexColor("#4f46e5"),
        spaceAfter=12,
        alignment=1,  # center
    )
    style_subtitlu = ParagraphStyle(
        "SubtitluRaport",
        parent=styles["Normal"],
        fontSize=11,
        textColor=colors.HexColor("#64748b"),
        alignment=1,
        spaceAfter=20,
    )
    style_eticheta = ParagraphStyle(
        "Eticheta",
        parent=styles["Normal"],
        fontSize=10,
        textColor=colors.HexColor("#64748b"),
        fontName="Helvetica-Bold",
    )
    style_valoare = ParagraphStyle(
        "Valoare",
        parent=styles["Normal"],
        fontSize=11,
        textColor=colors.HexColor("#1e1b4b"),
    )
    style_continut = ParagraphStyle(
        "Continut",
        parent=styles["Normal"],
        fontSize=11,
        textColor=colors.HexColor("#1e293b"),
        leading=16,
        spaceAfter=10,
    )

    elements = []

    # Header
    elements.append(Paragraph("AI-CONTABIL", style_titlu))
    elements.append(Paragraph("Raport contabil", style_subtitlu))

    # Tabel cu metadate
    metadate = [
        ["Titlu:", report.title or "-"],
        ["Tip raport:", report.report_type or "-"],
        ["Status:", str(report.status) or "-"],
        ["Perioada:", f"{report.period_start or '-'}  ->  {report.period_end or '-'}"],
        ["Client ID:", report.client_id or "-"],
        ["Generat pentru:", owner_name or "-"],
        ["Data generarii:", datetime.now(timezone.utc).strftime("%d.%m.%Y %H:%M UTC")],
    ]
    tabel = Table(metadate, colWidths=[4.5 * cm, 12 * cm])
    tabel.setStyle(
        TableStyle(
            [
                ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
                ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
                ("FONTSIZE", (0, 0), (-1, -1), 10),
                ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#64748b")),
                ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#1e1b4b")),
                ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.whitesmoke, colors.white]),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LINEBELOW", (0, 0), (-1, -1), 0.3, colors.HexColor("#e2e8f0")),
            ]
        )
    )
    elements.append(tabel)
    elements.append(Spacer(1, 0.8 * cm))

    # Descriere
    if report.description:
        elements.append(Paragraph("Descriere", style_eticheta))
        elements.append(Spacer(1, 0.2 * cm))
        elements.append(Paragraph(report.description, style_valoare))
        elements.append(Spacer(1, 0.5 * cm))

    # Continut principal
    elements.append(Paragraph("Continut", style_eticheta))
    elements.append(Spacer(1, 0.2 * cm))
    continut = report.content or "Acest raport nu are continut text. Verificati anexele si datele atasate."
    # Inlocuieste \n cu <br/> pentru paragraf
    continut_html = continut.replace("\n", "<br/>")
    elements.append(Paragraph(continut_html, style_continut))

    # Footer
    elements.append(Spacer(1, 1 * cm))
    footer_style = ParagraphStyle(
        "Footer",
        parent=styles["Normal"],
        fontSize=8,
        textColor=colors.HexColor("#94a3b8"),
        alignment=1,
    )
    elements.append(
        Paragraph(
            "Document generat automat de AI-Contabil &middot; ai-contabil.md",
            footer_style,
        )
    )

    doc.build(elements)
    buf.seek(0)
    return buf


@router.post("/", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(
    data: ReportCreateRequest,
    current_user: User = Depends(require_role(UserRole.CONTABIL, UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    # Verifică că clientul există și este asignat contabilului
    if current_user.role == UserRole.CONTABIL:
        link = db.query(AccountantClient).filter(
            AccountantClient.accountant_id == current_user.id,
            AccountantClient.client_id == data.client_id,
            AccountantClient.is_active == True,
        ).first()
        if not link:
            raise HTTPException(status_code=403, detail="Clientul nu este asignat ție")

    report = Report(
        created_by=current_user.id,
        client_id=data.client_id,
        title=data.title,
        description=data.description,
        report_type=data.report_type,
        period_start=data.period_start,
        period_end=data.period_end,
        content=data.content,
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/", response_model=ReportListResponse)
def list_reports(
    report_type: str | None = None,
    report_status: str | None = None,
    client_id: str | None = None,
    skip: int = 0,
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Report)

    if current_user.role == UserRole.CLIENT:
        query = query.filter(Report.client_id == current_user.id)
    elif current_user.role == UserRole.CONTABIL:
        if client_id:
            query = query.filter(Report.client_id == client_id, Report.created_by == current_user.id)
        else:
            query = query.filter(Report.created_by == current_user.id)
    # Admin vede tot

    if report_type:
        query = query.filter(Report.report_type == report_type)
    if report_status:
        query = query.filter(Report.status == report_status)

    total = query.count()
    reports = query.order_by(Report.created_at.desc()).offset(skip).limit(limit).all()
    return ReportListResponse(reports=reports, total=total)


@router.get("/{report_id}", response_model=ReportResponse)
def get_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Raport negăsit")

    if current_user.role == UserRole.CLIENT and report.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Nu ai acces la acest raport")

    if current_user.role == UserRole.CONTABIL and report.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Nu ai acces la acest raport")

    return report


@router.put("/{report_id}", response_model=ReportResponse)
def update_report(
    report_id: str,
    data: ReportUpdateRequest,
    current_user: User = Depends(require_role(UserRole.CONTABIL, UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Raport negăsit")

    if current_user.role == UserRole.CONTABIL and report.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Nu ai acces la acest raport")

    if data.title is not None:
        report.title = data.title
    if data.description is not None:
        report.description = data.description
    if data.status is not None:
        report.status = data.status
        if data.status == ReportStatus.EXPEDIAT:
            report.sent_at = datetime.now(timezone.utc)
    if data.content is not None:
        report.content = data.content

    db.commit()
    db.refresh(report)
    return report


@router.get("/{report_id}/pdf")
def download_report_pdf(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Genereaza si returneaza raportul ca PDF."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Raport negasit")

    # Verificare permisiuni (acelasi cu get_report)
    if current_user.role == UserRole.CLIENT and report.client_id != current_user.id:
        raise HTTPException(status_code=403, detail="Nu ai acces la acest raport")
    if current_user.role == UserRole.CONTABIL and report.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Nu ai acces la acest raport")

    owner = db.query(User).filter(User.id == report.client_id).first()
    owner_name = (owner.full_name or owner.username) if owner else None

    pdf_buf = _build_report_pdf(report, owner_name)
    nume_fisier = f"raport_{_safe_filename(report.title)}_{report.id[:8]}.pdf"

    return StreamingResponse(
        pdf_buf,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{nume_fisier}"',
            "Cache-Control": "no-store",
        },
    )


@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    report_id: str,
    current_user: User = Depends(require_role(UserRole.CONTABIL, UserRole.ADMIN)),
    db: Session = Depends(get_db),
):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Raport negăsit")

    if current_user.role == UserRole.CONTABIL and report.created_by != current_user.id:
        raise HTTPException(status_code=403, detail="Nu ai acces la acest raport")

    db.delete(report)
    db.commit()
