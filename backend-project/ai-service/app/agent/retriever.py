"""
Retriever RAG: embedding multilingual + FAISS index -> top-k chunks relevante.

Index-ul e precalculat offline prin `scripts/build_legislation_index.py`.
La runtime incarcam indexul + mapping-ul o singura data (singleton).
"""
from __future__ import annotations

import json
import os
from pathlib import Path
from typing import Optional

import numpy as np
from loguru import logger


INDEX_DIR = Path(os.getenv("LEGISLATIE_INDEX_DIR", "/app/model_storage/legislatie_index"))
EMBEDDER_NAME = os.getenv(
    "EMBEDDER_MODEL",
    "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2",
)


class LegisReteriever:
    """Singleton: embedder + FAISS index + mapping."""

    _instance: Optional["LegisReteriever"] = None

    def __init__(self):
        self._embedder = None
        self._faiss = None
        self._mapping: list[dict] = []  # aliniat cu index-ul
        self._incarcat = False

    @classmethod
    def get(cls) -> "LegisReteriever":
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def incarca(self) -> bool:
        """Incarca modelul + indexul. Returneaza False daca indexul nu exista inca."""
        if self._incarcat:
            return True

        index_path = INDEX_DIR / "index.faiss"
        map_path = INDEX_DIR / "mapping.json"

        if not index_path.exists() or not map_path.exists():
            logger.warning(
                f"Indexul legislatiei nu exista inca ({index_path}). "
                "Ruleaza `python scripts/build_legislation_index.py`."
            )
            return False

        try:
            import faiss
            from sentence_transformers import SentenceTransformer

            logger.info(f"Incarc embedder {EMBEDDER_NAME}...")
            self._embedder = SentenceTransformer(EMBEDDER_NAME)

            logger.info(f"Incarc index FAISS din {index_path}...")
            self._faiss = faiss.read_index(str(index_path))

            with open(map_path, "r", encoding="utf-8") as f:
                self._mapping = json.load(f)

            self._incarcat = True
            logger.info(f"Retriever gata: {len(self._mapping)} chunks indexate.")
            return True
        except Exception as e:
            logger.error(f"Eroare la incarcare retriever: {e}")
            return False

    def cauta(self, intrebare: str, k: int = 5) -> list[dict]:
        """
        Returneaza top-k chunks relevante: [{"source": ..., "text": ..., "score": ...}, ...]
        Lista GOALA daca indexul nu e pregatit.
        """
        if not self._incarcat and not self.incarca():
            return []

        vec = self._embedder.encode([intrebare], normalize_embeddings=True).astype("float32")
        # FAISS inner-product == cosine pe vectori normalizati
        D, I = self._faiss.search(vec, k)
        rezultate = []
        for score, idx in zip(D[0].tolist(), I[0].tolist()):
            if idx < 0 or idx >= len(self._mapping):
                continue
            entry = dict(self._mapping[idx])
            entry["score"] = float(score)
            rezultate.append(entry)
        return rezultate


def retriever() -> LegisReteriever:
    """Helper scurt pentru import usor in endpoint."""
    return LegisReteriever.get()
