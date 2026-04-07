from pydantic import BaseModel, Field
from datetime import datetime


class ReportCreateRequest(BaseModel):
    client_id: str = Field(max_length=36)
    title: str = Field(min_length=1, max_length=300)
    description: str | None = Field(default=None, max_length=2000)
    report_type: str = Field(max_length=50)
    period_start: str | None = Field(default=None, max_length=20)
    period_end: str | None = Field(default=None, max_length=20)
    content: str | None = Field(default=None, max_length=50000)


class ReportUpdateRequest(BaseModel):
    title: str | None = Field(default=None, max_length=300)
    description: str | None = Field(default=None, max_length=2000)
    status: str | None = Field(default=None, max_length=30)
    content: str | None = Field(default=None, max_length=50000)


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
