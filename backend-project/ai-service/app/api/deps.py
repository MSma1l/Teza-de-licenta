"""
Dependențe API: autentificare JWT, RBAC, rate limiting.
"""

from typing import List
from uuid import UUID

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User

security_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Obține utilizatorul curent din JWT token."""
    try:
        payload = verify_token(credentials.credentials)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalid sau expirat",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token invalid")

    stmt = select(User).where(User.id == UUID(user_id))
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Utilizator inactiv sau inexistent")

    return user


def require_role(*roles: str):
    """Dependency factory: restricționează accesul pe baza rolului."""
    async def role_checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acces interzis. Roluri necesare: {', '.join(roles)}",
            )
        return user
    return role_checker


def get_company_filter(user: User = Depends(get_current_user)) -> UUID:
    """Returnează company_id pentru filtrarea multi-tenant."""
    return user.company_id
