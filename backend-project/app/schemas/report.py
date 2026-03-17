from pydantic import BaseModel
from datetime import datetime


class ReportCreateRequest(BaseModel):
    client_id: str
    title: str
    description: str | None = None
    report_type: str
    period_start: str | None = None
    period_end: str | None = None
    content: str | None = None


class ReportUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    status: str | None = None
    content: str | None = None


class ReportResponse(BaseModel):
    id: str
    created_by: str
    client_id: str
    title: str
    description: str | None = None
    report_type: str
    status: str
    period_start: str | None = None
    period_end: str | None = None
    file_path: str | None = None
    content: str | None = None
    sent_at: datetime | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReportListResponse(BaseModel):
    reports: list[ReportResponse]
    total: int
