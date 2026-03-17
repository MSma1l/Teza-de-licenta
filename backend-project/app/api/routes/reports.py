from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.database import get_db
from app.models.user import User, UserRole
from app.models.report import Report, ReportStatus
from app.models.accountant_client import AccountantClient
from app.schemas.report import ReportCreateRequest, ReportUpdateRequest, ReportResponse, ReportListResponse
from app.api.deps import get_current_user, require_role

router = APIRouter(prefix="/reports", tags=["Rapoarte"])


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
