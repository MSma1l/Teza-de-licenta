"""
Client async pentru Ollama (http://ai_contabil_ollama:11434).
Doar ce ne trebuie: generate streaming/non-streaming + check model existence.
"""
import os
from typing import AsyncIterator

import httpx
from loguru import logger


OLLAMA_URL = os.getenv("OLLAMA_URL", "http://ai_contabil_ollama:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b-instruct")
# generos — raspunsurile pot avea 30+ sec pe CPU
OLLAMA_TIMEOUT = float(os.getenv("OLLAMA_TIMEOUT", "120"))


async def model_disponibil(model: str = OLLAMA_MODEL) -> bool:
    """True daca modelul e deja pull-uit in Ollama."""
    try:
        async with httpx.AsyncClient(timeout=5) as c:
            r = await c.get(f"{OLLAMA_URL}/api/tags")
            r.raise_for_status()
            tags = [m["name"] for m in r.json().get("models", [])]
            return any(m == model or m.startswith(model + ":") or m.split(":")[0] == model.split(":")[0] for m in tags)
    except Exception as e:
        logger.warning(f"Ollama not reachable: {e}")
        return False


async def genereaza(
    system_prompt: str,
    user_prompt: str,
    model: str = OLLAMA_MODEL,
    temperatura: float = 0.25,
    max_tokens: int | None = 800,
) -> str:
    """
    Request non-streaming la Ollama. Intoarce textul complet.
    Foloseste /api/chat (format messages) — mai robust decat /api/generate.
    """
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "stream": False,
        "options": {
            "temperature": temperatura,
            "num_predict": max_tokens if max_tokens else -1,
        },
    }

    async with httpx.AsyncClient(timeout=OLLAMA_TIMEOUT) as c:
        r = await c.post(f"{OLLAMA_URL}/api/chat", json=payload)
        r.raise_for_status()
        data = r.json()
        return (data.get("message") or {}).get("content", "").strip()


async def genereaza_stream(
    system_prompt: str,
    user_prompt: str,
    model: str = OLLAMA_MODEL,
    temperatura: float = 0.25,
) -> AsyncIterator[str]:
    """Variant streaming pentru viitor (typing indicator in chat)."""
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "stream": True,
        "options": {"temperature": temperatura},
    }
    async with httpx.AsyncClient(timeout=None) as c:
        async with c.stream("POST", f"{OLLAMA_URL}/api/chat", json=payload) as r:
            async for line in r.aiter_lines():
                if not line:
                    continue
                try:
                    import json
                    obj = json.loads(line)
                    bucata = (obj.get("message") or {}).get("content", "")
                    if bucata:
                        yield bucata
                    if obj.get("done"):
                        break
                except Exception:
                    continue
