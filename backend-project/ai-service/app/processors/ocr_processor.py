"""
OCR Pipeline - PaddleOCR cu preprocessing OpenCV.
Suportă: scanned PDF, TIFF, PNG (doar scanări, nu fotografii).
Compatibil cu PaddleOCR v2.x (.ocr()) și v3.4+ (.predict()).
"""

import io
import os
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple

import cv2
import numpy as np
from loguru import logger
from PIL import Image

from app.core.config import settings

# Dezactivare OneDNN bug pe Windows cu PaddlePaddle 3.x
os.environ.setdefault("FLAGS_enable_pir_api", "0")
os.environ.setdefault("FLAGS_enable_pir_in_executor", "0")
os.environ.setdefault("FLAGS_use_mkldnn", "0")
os.environ.setdefault("PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK", "True")


class OCRProcessor:
    """Pipeline OCR complet: preprocessing -> PaddleOCR -> postprocessing."""

    def __init__(self):
        self._ocr_engine = None
        self._api_version = None  # "v2" or "v3"
        logger.info("OCRProcessor initializat (lazy loading)")

    def _get_engine(self):
        """Lazy loading PaddleOCR - detecteaza versiunea automat."""
        if self._ocr_engine is None:
            from paddleocr import PaddleOCR
            import paddleocr

            version = getattr(paddleocr, "__version__", "2.0")
            major = int(version.split(".")[0])

            if major >= 3:
                # PaddleOCR v3.4+ API
                self._ocr_engine = PaddleOCR(
                    lang="en",
                    use_doc_orientation_classify=False,
                    use_textline_orientation=False,
                    use_doc_unwarping=False,
                )
                self._api_version = "v3"
                logger.info(f"PaddleOCR v{version} engine incarcat (predict API)")
            else:
                # PaddleOCR v2.x API
                self._ocr_engine = PaddleOCR(
                    lang="en",
                    use_angle_cls=settings.OCR_USE_ANGLE_CLS,
                    show_log=False,
                    use_gpu=False,
                )
                self._api_version = "v2"
                logger.info(f"PaddleOCR v{version} engine incarcat (ocr API)")

        return self._ocr_engine

    def _run_ocr(self, image: np.ndarray) -> list:
        """Ruleaza OCR pe imagine - compatibil v2 si v3."""
        engine = self._get_engine()

        if self._api_version == "v3":
            # PaddleOCR v3.4+: predict() returneaza generator de result objects
            results = list(engine.predict(image))
            if not results:
                return []
            # Convertim la formatul standard [[bbox, (text, conf)], ...]
            r = results[0]
            if hasattr(r, "rec_texts") and hasattr(r, "dt_polys"):
                standardized = []
                texts = r.rec_texts if r.rec_texts else []
                scores = r.rec_scores if r.rec_scores else []
                polys = r.dt_polys if r.dt_polys else []
                for i in range(len(texts)):
                    if i < len(polys):
                        poly = polys[i]
                        # Convertim polygon la 4 puncte
                        if len(poly) >= 4:
                            bbox = [poly[0].tolist(), poly[1].tolist(),
                                    poly[2].tolist(), poly[3].tolist()]
                        else:
                            bbox = [[0, 0], [100, 0], [100, 20], [0, 20]]
                    else:
                        bbox = [[0, 0], [100, 0], [100, 20], [0, 20]]
                    score = scores[i] if i < len(scores) else 0.5
                    standardized.append([bbox, (texts[i], float(score))])
                return standardized
            return []
        else:
            # PaddleOCR v2.x: ocr() returneaza lista de rezultate
            result = engine.ocr(image, cls=True)
            if result and result[0]:
                return result[0]
            return []

    # ==========================================
    #  Preprocessing OpenCV
    # ==========================================

    def check_dpi(self, image: Image.Image) -> int:
        """Verifica DPI-ul imaginii."""
        dpi_info = image.info.get("dpi", (72, 72))
        dpi = int(min(dpi_info[0], dpi_info[1]))
        return dpi

    def preprocess_image(self, image: np.ndarray) -> np.ndarray:
        """
        Preprocessing complet:
        1. Convertire la grayscale
        2. Deskew (corectie rotatie)
        3. Denoise (Gaussian blur)
        4. Contrast enhancement (CLAHE)
        5. Binarizare (Otsu thresholding)
        """
        # 1. Grayscale
        if len(image.shape) == 3:
            gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        else:
            gray = image.copy()

        # 2. Deskew
        gray = self._deskew(gray)

        # 3. Denoise
        denoised = cv2.GaussianBlur(gray, (3, 3), 0)

        # 4. CLAHE (Contrast Limited Adaptive Histogram Equalization)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(denoised)

        # 5. Binarizare Otsu
        _, binary = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

        return binary

    def _deskew(self, image: np.ndarray) -> np.ndarray:
        """Corecteaza rotatia documentului scanat."""
        # Cautam pixelii de text (negri, valoare < 128) nu fundalul alb
        coords = np.column_stack(np.where(image < 128))
        if len(coords) < 100:
            return image

        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle

        if abs(angle) < 0.5:
            return image

        (h, w) = image.shape[:2]
        center = (w // 2, h // 2)
        M = cv2.getRotationMatrix2D(center, angle, 1.0)
        rotated = cv2.warpAffine(
            image, M, (w, h),
            flags=cv2.INTER_CUBIC,
            borderMode=cv2.BORDER_REPLICATE,
        )
        logger.debug(f"Deskew aplicat: {angle:.2f} grade")
        return rotated

    # ==========================================
    #  Procesare principala
    # ==========================================

    def process_image(self, image_bytes: bytes, filename: str = "") -> Dict[str, Any]:
        """
        Proceseaza o imagine prin pipeline-ul OCR complet.

        Returns:
            {
                "text": str,
                "blocks": [...],
                "avg_confidence": float,
                "flagged_words": [...],
                "word_count": int,
            }
        """
        # Incarca imaginea
        pil_image = Image.open(io.BytesIO(image_bytes))

        # Verifica DPI
        dpi = self.check_dpi(pil_image)
        width, height = pil_image.size
        dpi_is_default = dpi == 72
        resolution_ok = width >= 500 and height >= 500

        if dpi < settings.OCR_MIN_DPI and not (dpi_is_default and resolution_ok):
            logger.warning(f"DPI prea mic: {dpi} < {settings.OCR_MIN_DPI}")
            return {
                "error": f"DPI prea mic ({dpi}). Rescanati la minimum 300 DPI.",
                "dpi": dpi,
                "text": "",
                "blocks": [],
                "avg_confidence": 0.0,
                "flagged_words": [],
                "word_count": 0,
            }

        # Convertire la numpy array
        image_np = np.array(pil_image)

        # Preprocessing
        preprocessed = self.preprocess_image(image_np)

        # Convertim inapoi la 3 canale pentru PaddleOCR
        if len(preprocessed.shape) == 2:
            preprocessed_rgb = cv2.cvtColor(preprocessed, cv2.COLOR_GRAY2RGB)
        else:
            preprocessed_rgb = preprocessed

        # OCR
        ocr_results = self._run_ocr(preprocessed_rgb)

        if not ocr_results:
            logger.warning(f"OCR nu a extras nimic din {filename}")
            return {
                "text": "",
                "blocks": [],
                "avg_confidence": 0.0,
                "flagged_words": [],
                "word_count": 0,
            }

        # Postprocessing
        return self._postprocess_results(ocr_results)

    def process_pdf(self, pdf_bytes: bytes, filename: str = "") -> Dict[str, Any]:
        """Proceseaza un PDF scanat (converteste paginile in imagini)."""
        try:
            import fitz  # PyMuPDF
        except ImportError:
            logger.error("PyMuPDF nu este instalat. pip install PyMuPDF")
            return {"error": "PyMuPDF nu este instalat", "text": "", "blocks": []}

        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        all_blocks = []
        all_text_parts = []
        all_flagged = []
        total_confidence = 0.0
        total_words = 0

        for page_num in range(len(doc)):
            page = doc[page_num]
            pix = page.get_pixmap(dpi=300)
            img_bytes = pix.tobytes("png")

            page_result = self.process_image(img_bytes, f"{filename}_p{page_num+1}")

            if "error" in page_result and page_result["error"]:
                continue

            for block in page_result["blocks"]:
                block["page"] = page_num + 1
            all_blocks.extend(page_result["blocks"])
            all_text_parts.append(page_result["text"])
            all_flagged.extend(page_result.get("flagged_words", []))
            total_confidence += page_result["avg_confidence"] * page_result["word_count"]
            total_words += page_result["word_count"]

        doc.close()
        avg_conf = total_confidence / total_words if total_words > 0 else 0.0

        return {
            "text": "\n\n--- PAGINA ---\n\n".join(all_text_parts),
            "blocks": all_blocks,
            "avg_confidence": round(avg_conf, 4),
            "flagged_words": all_flagged,
            "word_count": total_words,
            "page_count": len(doc),
        }

    # ==========================================
    #  Postprocessing
    # ==========================================

    def _postprocess_results(self, ocr_results: list) -> Dict[str, Any]:
        """Proceseaza rezultatele PaddleOCR."""
        blocks = []
        all_text_parts = []
        flagged_words = []
        confidences = []

        for item in ocr_results:
            bbox = item[0]  # [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
            text = item[1][0]
            confidence = item[1][1]

            block = {
                "text": text,
                "confidence": round(confidence, 4),
                "bbox": {
                    "x1": int(bbox[0][0]),
                    "y1": int(bbox[0][1]),
                    "x2": int(bbox[2][0]),
                    "y2": int(bbox[2][1]),
                },
            }
            blocks.append(block)
            all_text_parts.append(text)
            confidences.append(confidence)

            if confidence < settings.OCR_CONFIDENCE_THRESHOLD:
                flagged_words.append({
                    "text": text,
                    "confidence": round(confidence, 4),
                    "bbox": block["bbox"],
                })

        # Sortam blocurile pe verticala (y) apoi orizontala (x)
        blocks.sort(key=lambda b: (b["bbox"]["y1"], b["bbox"]["x1"]))

        # Grupam in sectiuni logice
        grouped = self._group_into_sections(blocks)

        avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

        return {
            "text": " ".join(all_text_parts),
            "blocks": blocks,
            "sections": grouped,
            "avg_confidence": round(avg_confidence, 4),
            "flagged_words": flagged_words,
            "word_count": len(blocks),
        }

    def _group_into_sections(self, blocks: List[Dict]) -> Dict[str, List[Dict]]:
        """Grupeaza blocurile text in sectiuni: header, body, footer."""
        if not blocks:
            return {"header": [], "body": [], "footer": []}

        all_y = [b["bbox"]["y1"] for b in blocks]
        min_y, max_y = min(all_y), max(all_y)
        height = max_y - min_y if max_y > min_y else 1

        header_threshold = min_y + height * 0.2
        footer_threshold = min_y + height * 0.8

        sections = {"header": [], "body": [], "footer": []}
        for block in blocks:
            y = block["bbox"]["y1"]
            if y < header_threshold:
                sections["header"].append(block)
            elif y > footer_threshold:
                sections["footer"].append(block)
            else:
                sections["body"].append(block)

        return sections


# Singleton
ocr_processor = OCRProcessor()
