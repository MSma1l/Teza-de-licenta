"""
Auto-completion Recommender - FAISS vector index.
Găsește documente similare procesate anterior.
"""

import json
from pathlib import Path
from typing import Dict, List, Optional, Any
from uuid import UUID

import numpy as np
from loguru import logger

from app.core.config import settings


class DocumentRecommender:
    """Recomandări bazate pe similaritate vectorială (FAISS)."""

    def __init__(self):
        self._model = None
        self._index = None
        self._doc_ids: List[str] = []
        self._loaded = False
        logger.info("DocumentRecommender inițializat (lazy loading)")

    def load(self) -> bool:
        """Încarcă modelul sentence-transformers și indexul FAISS."""
        try:
            self._load_embedding_model()
            self._load_faiss_index()
            self._loaded = True
            return True
        except Exception as e:
            logger.warning(f"DocumentRecommender: nu s-a putut încărca: {e}")
            return False

    def _load_embedding_model(self):
        """Încarcă sentence-transformers model."""
        model_path = settings.model_storage / "embeddings"
        if model_path.exists():
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(str(model_path))
        else:
            logger.info("Embedding model nu există local. Se va descărca la prima utilizare.")
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(settings.EMBEDDINGS_MODEL_NAME)
            model_path.parent.mkdir(parents=True, exist_ok=True)
            self._model.save(str(model_path))
            logger.info(f"Embedding model salvat la {model_path}")

    def _load_faiss_index(self):
        """Încarcă indexul FAISS de pe disc."""
        import faiss

        index_path = settings.model_storage / "faiss_index"
        index_file = index_path / "index.faiss"
        ids_file = index_path / "doc_ids.json"

        if index_file.exists() and ids_file.exists():
            self._index = faiss.read_index(str(index_file))
            with open(ids_file, "r") as f:
                self._doc_ids = json.load(f)
            logger.info(f"FAISS index încărcat: {self._index.ntotal} documente")
        else:
            # Creăm un index gol
            index_path.mkdir(parents=True, exist_ok=True)
            self._index = faiss.IndexFlatIP(384)  # all-MiniLM-L6-v2 = 384 dim
            self._doc_ids = []
            logger.info("FAISS index creat (gol)")

    def encode_text(self, text: str) -> np.ndarray:
        """Generează embedding pentru un text."""
        if self._model is None:
            self._load_embedding_model()
        return self._model.encode(text, normalize_embeddings=True)

    def add_document(self, document_id: str, text: str) -> bool:
        """Adaugă un document în index."""
        if self._index is None:
            logger.warning("FAISS index nu este inițializat")
            return False

        try:
            embedding = self.encode_text(text)
            embedding = embedding.reshape(1, -1).astype("float32")
            self._index.add(embedding)
            self._doc_ids.append(document_id)
            logger.debug(f"Document {document_id} adăugat în FAISS index")
            return True
        except Exception as e:
            logger.error(f"Eroare la adăugarea în FAISS: {e}")
            return False

    def find_similar(
        self,
        text: str,
        top_k: int = 5,
        exclude_id: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Găsește cele mai similare documente.

        Returns:
            [{"document_id": "...", "similarity": 0.95}, ...]
        """
        if self._index is None or self._index.ntotal == 0:
            return []

        try:
            embedding = self.encode_text(text)
            embedding = embedding.reshape(1, -1).astype("float32")

            # Căutăm mai multe pentru a acoperi excluderea
            k = min(top_k + 1, self._index.ntotal)
            scores, indices = self._index.search(embedding, k)

            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx < 0 or idx >= len(self._doc_ids):
                    continue
                doc_id = self._doc_ids[idx]
                if exclude_id and doc_id == exclude_id:
                    continue
                results.append({
                    "document_id": doc_id,
                    "similarity": round(float(score), 4),
                })
                if len(results) >= top_k:
                    break

            return results
        except Exception as e:
            logger.error(f"Eroare la căutare FAISS: {e}")
            return []

    def save_index(self):
        """Salvează indexul FAISS pe disc."""
        if self._index is None:
            return

        import faiss

        index_path = settings.model_storage / "faiss_index"
        index_path.mkdir(parents=True, exist_ok=True)

        faiss.write_index(self._index, str(index_path / "index.faiss"))
        with open(index_path / "doc_ids.json", "w") as f:
            json.dump(self._doc_ids, f)

        logger.info(f"FAISS index salvat: {self._index.ntotal} documente")

    def get_stats(self) -> Dict[str, Any]:
        """Statistici despre index."""
        return {
            "total_documents": self._index.ntotal if self._index else 0,
            "dimension": 384,
            "model_loaded": self._model is not None,
        }


# Singleton
document_recommender = DocumentRecommender()
