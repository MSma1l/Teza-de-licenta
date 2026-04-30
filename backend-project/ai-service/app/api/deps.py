"""
Dependențe API: autentificare JWT, RBAC, rate limiting.

Note: User.id in main backend este String(36), iar in ai-service e mapat ca UUID
(divergenta de schema). Pentru a evita type-mismatch la query, get_current_user
NU face fetch din DB — returneaza un obiect compact construit din JWT payload.
JWT-ul contine deja id-ul si rolul, deci nu pierdem nimic functional.
"""

from dataclasses import dataclass
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.security import verify_token

security_scheme = HTTPBearer()


@dataclass
class CurrentUser:
    """Vedere lightweight asupra user-ului curent — doar din JWT, fara DB hit."""
    id: str
    role: str
    company_id: Optional[str] = None


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
) -> CurrentUser:
    """Obține utilizatorul curent din JWT token (fara DB lookup)."""
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

    return CurrentUser(
        id=str(user_id),
        role=str(payload.get("role", "")),
        company_id=payload.get("company_id"),
    )


def require_role(*roles: str):
    """Dependency factory: restricționează accesul pe baza rolului."""
    # Acceptam si ADMIN si SUPER_ADMIN cand cineva cere "admin"
    expanded = set()
    for r in roles:
        rl = r.lower()
        expanded.add(rl)
        if rl == "admin":
            expanded.add("super_admin")

    async def role_checker(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if user.role.lower() not in expanded:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acces interzis. Roluri necesare: {', '.join(roles)}",
            )
        return user
    return role_checker


def get_company_filter(user: CurrentUser = Depends(get_current_user)) -> Optional[str]:
    """Returnează company_id pentru filtrarea multi-tenant."""
    return user.company_id
