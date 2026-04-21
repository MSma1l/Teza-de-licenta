"""
Seed automat al conturilor de test la pornirea backend-ului.

Creeaza (daca nu exista):
  - ADMIN: test@aicontabil.md / Test1234!
  - CONTABIL: contabil@aicontabil.md / Contabil1234!
  - CLIENT: client@aicontabil.md / Client1234!

Extra: asigneaza automat clientul la contabil pentru demo.

Ruleaza la fiecare start al backend-ului. Idempotent — daca exista deja, nu
modifica nimic.

ATENTIE: conturile astea sunt destinate demo/testare, nu productie. In deploy
real, parolele trebuie schimbate sau seed-ul dezactivat prin `SEED_TEST_ACCOUNTS=0`.
"""
from __future__ import annotations

import logging
import os

from sqlalchemy.orm import Session

from app.models.user import User, UserRole
from app.models.accountant_client import AccountantClient
from app.core.security import hash_password


log = logging.getLogger(__name__)


_SEED_USERS = [
    {
        "username": "test",
        "email": "test@aicontabil.md",
        "password": "Test1234!",
        "full_name": "Admin Demo",
        "role": UserRole.ADMIN,
    },
    {
        "username": "contabil",
        "email": "contabil@aicontabil.md",
        "password": "Contabil1234!",
        "full_name": "Contabil Demo",
        "role": UserRole.CONTABIL,
    },
    {
        "username": "client",
        "email": "client@aicontabil.md",
        "password": "Client1234!",
        "full_name": "Client Demo",
        "role": UserRole.CLIENT,
    },
]


def seed_test_accounts(db: Session) -> None:
    """Creeaza conturile test si link client↔contabil daca lipsesc. Idempotent."""
    if os.getenv("SEED_TEST_ACCOUNTS", "1") in ("0", "false", "False"):
        log.info("seed_test_accounts: dezactivat prin env (SEED_TEST_ACCOUNTS=0)")
        return

    creati = 0
    for spec in _SEED_USERS:
        existent = db.query(User).filter(User.email == spec["email"]).first()
        if existent:
            # Daca exista dar cu rol diferit, corectam (util dupa reset DB partial)
            if existent.role != spec["role"]:
                existent.role = spec["role"]
                db.flush()
            continue

        u = User(
            username=spec["username"],
            email=spec["email"],
            password_hash=hash_password(spec["password"]),
            full_name=spec["full_name"],
            role=spec["role"],
            is_active=True,
            is_verified=True,
            two_factor_enabled=False,
        )
        db.add(u)
        db.flush()
        creati += 1
        log.info(f"seed_test_accounts: creat {spec['role'].value} = {spec['email']}")

    # Link client -> contabil (demo asignare automata facuta de admin)
    contabil = db.query(User).filter(User.email == "contabil@aicontabil.md").first()
    client = db.query(User).filter(User.email == "client@aicontabil.md").first()
    if contabil and client:
        link = (
            db.query(AccountantClient)
            .filter(
                AccountantClient.accountant_id == contabil.id,
                AccountantClient.client_id == client.id,
            )
            .first()
        )
        if not link:
            db.add(AccountantClient(
                accountant_id=contabil.id,
                client_id=client.id,
                is_active=True,
            ))
            log.info("seed_test_accounts: client asignat la contabil")
        elif not link.is_active:
            link.is_active = True

    if creati > 0:
        db.commit()
        log.info(f"seed_test_accounts: {creati} conturi noi + asignare OK")
    else:
        db.commit()  # commit pt eventuale link-uri noi
        log.debug("seed_test_accounts: toate conturile exista deja (skip)")
