"""
Asambleaza Capitolul 3 + Concluziile generale + Anexele intr-un fisier .docx
formatat conform ghidului UTM (TNR 12pt, 1.5 linii, headings numerotate).

Ruleaza din folderul teza/ cu: python combine_to_docx.py
Genereaza: Teza_Capitol_3_Final.docx
"""
import re
from pathlib import Path
from docx import Document
from docx.shared import Pt, Cm, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml.ns import qn
from docx.oxml import OxmlElement


HERE = Path(__file__).parent
SOURCES = [
    HERE / "Capitol_3_AI_Contabil.md",
    HERE / "Concluzii_Generale.md",
    HERE / "Anexe_Cap3.md",
]
OUTPUT = HERE / "Teza_Capitol_3_Final.docx"


# =====================================================================
#  Setup document cu stilurile UTM
# =====================================================================

def _setup_styles(doc: Document):
    """Aplica TNR 12pt, 1.5 linii pe stilul Normal + headings."""
    normal = doc.styles["Normal"]
    normal.font.name = "Times New Roman"
    normal.font.size = Pt(12)
    normal.paragraph_format.line_spacing = 1.5
    normal.paragraph_format.space_after = Pt(0)
    normal.paragraph_format.first_line_indent = Cm(1.25)
    normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

    # Heading 1: TNR 14pt bold, centrat, pagina noua
    h1 = doc.styles["Heading 1"]
    h1.font.name = "Times New Roman"
    h1.font.size = Pt(14)
    h1.font.bold = True
    h1.font.color.rgb = RGBColor(0, 0, 0)
    h1.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    h1.paragraph_format.line_spacing = 1.5
    h1.paragraph_format.space_before = Pt(12)
    h1.paragraph_format.space_after = Pt(12)
    h1.paragraph_format.first_line_indent = Cm(0)
    h1.paragraph_format.page_break_before = True

    # Heading 2: TNR 12pt bold, stanga
    h2 = doc.styles["Heading 2"]
    h2.font.name = "Times New Roman"
    h2.font.size = Pt(12)
    h2.font.bold = True
    h2.font.color.rgb = RGBColor(0, 0, 0)
    h2.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
    h2.paragraph_format.line_spacing = 1.5
    h2.paragraph_format.space_before = Pt(12)
    h2.paragraph_format.space_after = Pt(6)
    h2.paragraph_format.first_line_indent = Cm(0)

    # Heading 3: TNR 12pt bold italic, stanga
    h3 = doc.styles["Heading 3"]
    h3.font.name = "Times New Roman"
    h3.font.size = Pt(12)
    h3.font.bold = True
    h3.font.italic = True
    h3.font.color.rgb = RGBColor(0, 0, 0)
    h3.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
    h3.paragraph_format.line_spacing = 1.5
    h3.paragraph_format.space_before = Pt(6)
    h3.paragraph_format.space_after = Pt(6)
    h3.paragraph_format.first_line_indent = Cm(0)


def _add_code_style(doc: Document):
    """Stil pentru blocuri de cod: Consolas 10pt, fara alineat, fara justify."""
    if "CodeBlock" in [s.name for s in doc.styles]:
        return
    style = doc.styles.add_style("CodeBlock", 1)  # 1 = paragraph
    style.font.name = "Consolas"
    style.font.size = Pt(9)
    style.paragraph_format.line_spacing = 1.15
    style.paragraph_format.space_before = Pt(0)
    style.paragraph_format.space_after = Pt(0)
    style.paragraph_format.first_line_indent = Cm(0)
    style.paragraph_format.left_indent = Cm(0.5)
    style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT


def _add_figure_marker_style(doc: Document):
    """Stil pentru marcajele [FIGURA 3.X]: rosu bold, centrat, ca atentionare."""
    if "FigureMarker" in [s.name for s in doc.styles]:
        return
    style = doc.styles.add_style("FigureMarker", 1)
    style.font.name = "Times New Roman"
    style.font.size = Pt(11)
    style.font.bold = True
    style.font.italic = True
    style.font.color.rgb = RGBColor(192, 0, 0)
    style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style.paragraph_format.line_spacing = 1.15
    style.paragraph_format.space_before = Pt(6)
    style.paragraph_format.space_after = Pt(6)
    style.paragraph_format.first_line_indent = Cm(0)


def _add_figure_caption_style(doc: Document):
    """Stil pentru titlul figurii: TNR 11pt italic, centrat."""
    if "FigureCaption" in [s.name for s in doc.styles]:
        return
    style = doc.styles.add_style("FigureCaption", 1)
    style.font.name = "Times New Roman"
    style.font.size = Pt(11)
    style.font.italic = True
    style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style.paragraph_format.line_spacing = 1.15
    style.paragraph_format.space_before = Pt(0)
    style.paragraph_format.space_after = Pt(12)
    style.paragraph_format.first_line_indent = Cm(0)


def _add_table_caption_style(doc: Document):
    """Stil pentru titlul tabelului: TNR 11pt, aliniat dreapta."""
    if "TableCaption" in [s.name for s in doc.styles]:
        return
    style = doc.styles.add_style("TableCaption", 1)
    style.font.name = "Times New Roman"
    style.font.size = Pt(11)
    style.font.italic = True
    style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    style.paragraph_format.line_spacing = 1.15
    style.paragraph_format.space_before = Pt(6)
    style.paragraph_format.space_after = Pt(3)
    style.paragraph_format.first_line_indent = Cm(0)


# =====================================================================
#  Helpers
# =====================================================================

def _add_run_with_formatting(paragraph, text: str):
    """
    Parseaza inline formatting:
    - **bold** → bold
    - *italic* → italic
    - `code` → monospace
    - [text](url) → text simplu (urls in bibliografie deja scrise)
    """
    # Procesam tokenii in ordine
    tokens = re.split(r'(\*\*[^*]+\*\*|`[^`]+`)', text)
    for tok in tokens:
        if not tok:
            continue
        if tok.startswith("**") and tok.endswith("**"):
            run = paragraph.add_run(tok[2:-2])
            run.bold = True
            run.font.name = "Times New Roman"
            run.font.size = Pt(12)
        elif tok.startswith("`") and tok.endswith("`"):
            run = paragraph.add_run(tok[1:-1])
            run.font.name = "Consolas"
            run.font.size = Pt(11)
        else:
            run = paragraph.add_run(tok)
            run.font.name = "Times New Roman"
            run.font.size = Pt(12)


def _parse_md_table(lines: list[str], start_idx: int) -> tuple[list[list[str]], int]:
    """
    Parseaza un tabel markdown. Returneaza (data, idx_dupa_tabel).
    Format: | col1 | col2 | ... |
    """
    rows = []
    i = start_idx
    while i < len(lines) and lines[i].strip().startswith("|"):
        line = lines[i].strip()
        # Skip separator: | --- | --- |
        if re.match(r'^\|[\s\-:|]+\|$', line):
            i += 1
            continue
        cells = [c.strip() for c in line.strip("|").split("|")]
        rows.append(cells)
        i += 1
    return rows, i


# =====================================================================
#  Conversie MD → DOCX
# =====================================================================

def convert_md_to_docx(md_text: str, doc: Document):
    """Adauga continutul markdown la documentul Word existent."""
    lines = md_text.split("\n")
    i = 0
    in_code_block = False
    code_lang = ""

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # --- Cod block ```...``` ---
        if stripped.startswith("```"):
            if not in_code_block:
                in_code_block = True
                code_lang = stripped[3:].strip()
            else:
                in_code_block = False
            i += 1
            continue

        if in_code_block:
            p = doc.add_paragraph(line, style="CodeBlock")
            i += 1
            continue

        # --- Linie goala ---
        if not stripped:
            i += 1
            continue

        # --- Separator orizontal --- ---
        if stripped == "---":
            i += 1
            continue

        # --- Quote/Notes >  ---
        if stripped.startswith("> "):
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Cm(0.75)
            p.paragraph_format.first_line_indent = Cm(0)
            run = p.add_run(stripped[2:])
            run.italic = True
            run.font.name = "Times New Roman"
            run.font.size = Pt(11)
            i += 1
            continue

        # --- Headings ---
        if stripped.startswith("# "):
            doc.add_paragraph(stripped[2:], style="Heading 1")
            i += 1
            continue
        if stripped.startswith("## "):
            doc.add_paragraph(stripped[3:], style="Heading 2")
            i += 1
            continue
        if stripped.startswith("### "):
            doc.add_paragraph(stripped[4:], style="Heading 3")
            i += 1
            continue

        # --- Tabel markdown ---
        if stripped.startswith("|") and i + 1 < len(lines) and "---" in lines[i + 1]:
            rows, new_i = _parse_md_table(lines, i)
            if rows:
                # Adauga tabelul
                table = doc.add_table(rows=len(rows), cols=len(rows[0]))
                table.style = "Table Grid"
                table.alignment = WD_TABLE_ALIGNMENT.CENTER
                for r_idx, row_data in enumerate(rows):
                    for c_idx, cell_text in enumerate(row_data):
                        cell = table.rows[r_idx].cells[c_idx]
                        cell.text = ""
                        p = cell.paragraphs[0]
                        p.paragraph_format.first_line_indent = Cm(0)
                        p.paragraph_format.line_spacing = 1.15
                        run = p.add_run(cell_text)
                        run.font.name = "Times New Roman"
                        run.font.size = Pt(11)
                        if r_idx == 0:
                            run.bold = True
            i = new_i
            continue

        # --- Marcaj [FIGURA 3.X — ...] ---
        if stripped.startswith("**[FIGURA"):
            # Linie multipla cu **[FIGURA 3.X ... ]**
            text = stripped.replace("**[", "[").replace("]**", "]")
            doc.add_paragraph(text, style="FigureMarker")
            i += 1
            continue

        # --- Titlu de figura: "Figura 3.X. Titlu" ---
        if re.match(r'^Figura \d+\.\d+\.', stripped):
            doc.add_paragraph(stripped, style="FigureCaption")
            i += 1
            continue

        # --- Titlu de tabel: "Tabelul 3.X. Titlu" ---
        if re.match(r'^Tabelul \d+\.\d+\.', stripped):
            doc.add_paragraph(stripped, style="TableCaption")
            i += 1
            continue

        # --- Bullet (- sau *) ---
        if stripped.startswith("- ") or stripped.startswith("* "):
            p = doc.add_paragraph(style="List Bullet")
            p.paragraph_format.first_line_indent = Cm(0)
            _add_run_with_formatting(p, stripped[2:])
            i += 1
            continue

        # --- Numbered list ---
        if re.match(r'^\d+\.\s', stripped):
            p = doc.add_paragraph(style="List Number")
            p.paragraph_format.first_line_indent = Cm(0)
            _add_run_with_formatting(p, re.sub(r'^\d+\.\s', '', stripped))
            i += 1
            continue

        # --- Paragraf normal ---
        p = doc.add_paragraph()
        _add_run_with_formatting(p, stripped)
        i += 1


# =====================================================================
#  Main
# =====================================================================

def main():
    print(f"Generez: {OUTPUT.name}")

    doc = Document()

    # Setup pagina A4
    section = doc.sections[0]
    section.page_height = Cm(29.7)
    section.page_width = Cm(21.0)
    section.left_margin = Cm(2.5)
    section.right_margin = Cm(2.0)
    section.top_margin = Cm(2.0)
    section.bottom_margin = Cm(2.0)

    _setup_styles(doc)
    _add_code_style(doc)
    _add_figure_marker_style(doc)
    _add_figure_caption_style(doc)
    _add_table_caption_style(doc)

    for src in SOURCES:
        if not src.exists():
            print(f"  ! Lipseste: {src}")
            continue
        print(f"  + {src.name}")
        text = src.read_text(encoding="utf-8")
        convert_md_to_docx(text, doc)

    doc.save(OUTPUT)
    print(f"\nGata. Fisier generat: {OUTPUT}")
    print(f"Marime: {OUTPUT.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
