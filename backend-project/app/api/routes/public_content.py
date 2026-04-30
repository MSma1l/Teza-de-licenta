"""
Endpoint-uri pentru PublicContent — legi si stiri publicate de admin pe landing.

GET  /content         — public (fara auth), folosit de landing page
POST /admin/content   — admin / super_admin
DELETE /admin/content/{id} — admin / super_admin
"""
from datetime import datetime, timezone
from typing import Literal
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.public_content import PublicContent, PublicContentType
from app.models.user import User, UserRole
from app.api.deps import require_role


router = APIRouter(tags=["Public Content"])


# === Schemas ===

class PublicContentCreate(BaseModel):
    type: Literal["lege", "stire"]
    title: str = Field(min_length=2, max_length=300)
    body: str = Field(min_length=2)
    url: str | None = Field(default=None, max_length=500)
    tag: str | None = Field(default=None, max_length=80)
    color: str | None = Field(default=None, max_length=20)
    published_date: datetime | None = None


class PublicContentResponse(BaseModel):
    id: str
    type: str
    title: str
    body: str
    url: str | None
    tag: str | None
    color: str | None
    published_date: datetime
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# === Endpoints ===

@router.get("/content", response_model=list[PublicContentResponse])
def list_public_content(
    type: Literal["lege", "stire"] | None = None,
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """Public — folosit de landing page pentru sectiunile Legislatie / Noutati."""
    query = db.query(PublicContent).filter(PublicContent.is_active == True)
    if type:
        query = query.filter(PublicContent.type == type)
    items = query.order_by(PublicContent.published_date.desc()).limit(limit).all()
    return items


@router.post("/admin/content", response_model=PublicContentResponse, status_code=201)
def create_public_content(
    data: PublicContentCreate,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    """Admin / super_admin — adauga lege sau stire pe pagina publica."""
    item = PublicContent(
        type=PublicContentType(data.type),
        title=data.title,
        body=data.body,
        url=data.url,
        tag=data.tag,
        color=data.color,
        published_date=data.published_date or datetime.now(timezone.utc),
        is_active=True,
        created_by=current_user.id,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/admin/content/{content_id}", status_code=204)
def delete_public_content(
    content_id: str,
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.SUPER_ADMIN)),
    db: Session = Depends(get_db),
):
    """Admin / super_admin — sterge sau dezactiveaza un articol public."""
    item = db.query(PublicContent).filter(PublicContent.id == content_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Continut negasit")
    db.delete(item)
    db.commit()
    return None
