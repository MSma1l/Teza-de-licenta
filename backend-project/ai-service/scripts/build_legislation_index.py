"""
Construieste indexul FAISS pentru legislatia RM.

Input:
  - Toate fisierele .jsonl din /app/training_data/legislatie/ (sau din
    backend-project/training-data/legislatie daca rulezi local).
    Fiecare linie = { "source": "...", "text": "..." }

Output in /app/model_storage/legislatie_index/:
  - index.faiss        — indexul FAISS cosine (IndexFlatIP peste vectori normalizati)
  - mapping.json       — lista alignata cu indexul: [{source, text}, ...]

Run:
  # intern in container:
  docker exec -it ai_contabil_ai_service python scripts/build_legislation_index.py

Sau local (reproductibil):
  python scripts/build_legislation_index.py --input /path/la/legislatie --out /path/la/index
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path


def chunk_text(text: str, max_chars: int = 900, overlap: int = 120) -> list[str]:
    """Chunk pe caractere — suficient pentru textele legale scurte."""
    text = (text or "").strip()
    if len(text) <= max_chars:
        return [text] if text else []
    out = []
    start = 0
    n = len(text)
    while start < n:
        end = min(start + max_chars, n)
        # Incerca sa taie la sfarsit de propozitie
        bucata = text[start:end]
        ultim_punct = max(bucata.rfind(". "), bucata.rfind("! "), bucata.rfind("? "))
        if ultim_punct > max_chars * 0.6 and end < n:
            bucata = bucata[: ultim_punct + 1]
            end = start + len(bucata)
        out.append(bucata.strip())
        if end >= n:
            break
        start = end - overlap
    return out


def incarca_jsonl(folder: Path) -> list[dict]:
    """Citeste toate .jsonl-urile din folder → lista de {source, text}."""
    entries: list[dict] = []
    for fisier in sorted(folder.glob("*.jsonl")):
        with open(fisier, "r", encoding="utf-8") as f:
            for i, linie in enumerate(f, start=1):
                linie = linie.strip()
                if not linie:
                    continue
                try:
                    obj = json.loads(linie)
                except json.JSONDecodeError as e:
                    print(f"  ! {fisier.name} linia {i}: JSON invalid ({e}), sar peste")
                    continue
                src = (obj.get("source") or "").strip()
                text = (obj.get("text") or "").strip()
                if not text:
                    continue
                entries.append({"source": src or fisier.stem, "text": text})
    return entries


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--input", default=os.getenv("LEGISLATIE_INPUT", "/app/training_data/legislatie"))
    p.add_argument("--out", default=os.getenv("LEGISLATIE_INDEX_DIR", "/app/model_storage/legislatie_index"))
    p.add_argument("--model", default=os.getenv("EMBEDDER_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2"))
    args = p.parse_args()

    input_dir = Path(args.input)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    if not input_dir.exists():
        print(f"[!] Folder input nu exista: {input_dir}")
        sys.exit(1)

    print(f"[1/4] Citire intrari din {input_dir}...")
    entries = incarca_jsonl(input_dir)
    if not entries:
        print(f"[!] Nu am gasit nicio intrare in {input_dir}/*.jsonl — ies.")
        sys.exit(2)
    print(f"      {len(entries)} intrari brute.")

    print("[2/4] Chunking...")
    chunks: list[dict] = []
    for e in entries:
        for buc in chunk_text(e["text"]):
            chunks.append({"source": e["source"], "text": buc})
    print(f"      {len(chunks)} chunks rezultate.")

    print(f"[3/4] Generez embeddings cu {args.model}...")
    from sentence_transformers import SentenceTransformer
    import numpy as np

    embedder = SentenceTransformer(args.model)
    # Prepend source (titlu) la text pentru embed → retriever matcha mai bine
    # intrebari gen "Cum incarc factura" cand titlul chunk-ului e "Ghid client — Cum incarc...".
    textele = [f"{c['source']}\n\n{c['text']}" for c in chunks]
    emb = embedder.encode(
        textele,
        batch_size=32,
        show_progress_bar=True,
        normalize_embeddings=True,  # cos-sim via inner product
        convert_to_numpy=True,
    ).astype("float32")
    dim = emb.shape[1]
    print(f"      matrice embeddings: {emb.shape} (dim={dim})")

    print(f"[4/4] Construiesc index FAISS in {out_dir}...")
    import faiss
    index = faiss.IndexFlatIP(dim)
    index.add(emb)
    faiss.write_index(index, str(out_dir / "index.faiss"))

    with open(out_dir / "mapping.json", "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)

    print(f"GATA. {len(chunks)} chunks indexate → {out_dir}")


if __name__ == "__main__":
    main()
