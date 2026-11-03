#!/usr/bin/env python3
"""Build the public, text-selectable CV from content/public-cv.json.

Requires reportlab. Install it into a local environment with `uv pip install reportlab`.
Uses embedded Arial or DejaVu Sans fonts; pass --font-dir to select a portable font folder.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import KeepTogether, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

ROOT = Path(__file__).resolve().parents[1]
INK = colors.HexColor("#0b111b")
BODY = colors.HexColor("#273746")
MUTED = colors.HexColor("#526274")
ACCENT = colors.HexColor("#325f88")
RULE = colors.HexColor("#c4cfda")


def register_fonts(font_dir: Path | None) -> None:
    folders = [font_dir] if font_dir else [Path("/System/Library/Fonts/Supplemental"), Path("/usr/share/fonts/truetype/dejavu")]
    for folder in folders:
        for regular, bold in [("Arial.ttf", "Arial Bold.ttf"), ("DejaVuSans.ttf", "DejaVuSans-Bold.ttf")]:
            if (folder / regular).is_file() and (folder / bold).is_file():
                pdfmetrics.registerFont(TTFont("PublicCV", str(folder / regular)))
                pdfmetrics.registerFont(TTFont("PublicCVBold", str(folder / bold)))
                pdfmetrics.registerFontFamily("PublicCV", normal="PublicCV", bold="PublicCVBold", italic="PublicCV", boldItalic="PublicCVBold")
                return
    raise SystemExit("Embedded Arial or DejaVu Sans fonts not found. Use --font-dir.")


def build(output: Path, font_dir: Path | None = None) -> None:
    register_fonts(font_dir)
    data = json.loads((ROOT / "content/public-cv.json").read_text())
    page_width, page_height = A4
    margin = 39
    # SimpleDocTemplate's frame adds six points of padding on each side.
    width = page_width - 2 * margin - 12
    styles = {
        "name": ParagraphStyle("name", fontName="PublicCVBold", fontSize=25, leading=29, textColor=INK),
        "target": ParagraphStyle("target", fontName="PublicCVBold", fontSize=10.4, leading=14, textColor=ACCENT),
        "contact": ParagraphStyle("contact", fontName="PublicCV", fontSize=9.2, leading=13, textColor=MUTED),
        "body": ParagraphStyle("body", fontName="PublicCV", fontSize=10, leading=12.6, textColor=BODY),
        "role": ParagraphStyle("role", fontName="PublicCV", fontSize=9.3, leading=11.8, textColor=MUTED),
        "org": ParagraphStyle("org", fontName="PublicCVBold", fontSize=10, leading=12.5, textColor=INK),
        "date": ParagraphStyle("date", fontName="PublicCV", fontSize=8.6, leading=12.5, alignment=TA_RIGHT, textColor=MUTED),
        "section": ParagraphStyle("section", fontName="PublicCVBold", fontSize=9.4, leading=12, textColor=ACCENT, spaceBefore=7, spaceAfter=4),
        "bullet": ParagraphStyle("bullet", fontName="PublicCV", fontSize=10, leading=12.6, textColor=BODY, leftIndent=9, firstLineIndent=-9, spaceBefore=2),
    }
    para = lambda text, style="body": Paragraph(text, styles[style])
    link = lambda text, href: f'<link href="{escape(href)}" color="#325f88">{escape(text)}</link>'

    def heading(title: str):
        return para(title.upper(), "section")

    def dated_header(title: str, dates: str):
        table = Table([[para(escape(title), "org"), para(escape(dates), "date")]], colWidths=[width - 117, 117])
        table.setStyle(TableStyle([("LEFTPADDING", (0, 0), (-1, -1), 0), ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
        return table

    story = [para(escape(data["name"]), "name"), Spacer(1, 3)]
    story.append(para("Applied AI &amp; product development internships", "target"))
    story.append(para(f'{escape(data["location"])}  |  {escape(data["availability"])}', "contact"))
    story.append(para("  |  ".join([link("gappa.me", data["links"]["portfolio"]), link("LinkedIn", data["links"]["linkedin"]), link("GitHub / CH4RL3I", data["links"]["github"])]), "contact"))
    story.extend([Spacer(1, 5), para(escape(data["summary"])), heading("Experience")])
    for i, role in enumerate(data["experience"]):
        block = [dated_header(role["org"], role["dates"]), para(escape(role["role"]), "role")]
        block += [para("- " + escape(bullet), "bullet") for bullet in role["bullets"]]
        story.append(KeepTogether(block))
        if i < len(data["experience"]) - 1:
            story.append(Spacer(1, 3))

    story.append(heading("Selected products & research"))
    for project in data["projects"]:
        story.append(para(f'<b>{link(project["name"], project["href"])}</b> - {escape(project["summary"])}'))
        story.append(Spacer(1, 2))

    story.append(heading("Education"))
    for education in data["education"]:
        story.append(KeepTogether([dated_header(education["org"], education["dates"]), para(escape(education["degree"]), "role")]))
        story.append(Spacer(1, 2))

    story.append(heading("Skills & languages"))
    for group in data["skills"]:
        story.append(para(f'<b>{escape(group["label"])}</b> - {escape(", ".join(group["items"]))}'))
    story.append(para("<b>Languages</b> - " + escape("; ".join(data["languages"]))))

    def page(canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(RULE)
        canvas.setLineWidth(0.5)
        canvas.line(margin + 6, page_height - 111, page_width - margin - 6, page_height - 111)
        canvas.setFont("PublicCV", 7.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(margin, 21, "Public CV | Updated November 2026")
        canvas.drawRightString(page_width - margin, 21, str(doc.page))
        canvas.restoreState()

    output.parent.mkdir(parents=True, exist_ok=True)
    doc = SimpleDocTemplate(str(output), pagesize=A4, rightMargin=margin, leftMargin=margin, topMargin=29, bottomMargin=32, title="Emilio Gappa - Applied AI & Product CV", author=data["name"], subject="Public professional CV - available January 2027")
    doc.build(story, onFirstPage=page, onLaterPages=page)
    print(output)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=ROOT / "public/emilio-gappa-cv.pdf")
    parser.add_argument("--font-dir", type=Path)
    args = parser.parse_args()
    build(args.output.resolve(), args.font_dir)
