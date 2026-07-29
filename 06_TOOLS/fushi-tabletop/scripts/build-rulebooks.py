#!/usr/bin/env python3
"""Build the FUSHI Player and Master rulebooks from the app's canonical JSON."""

from __future__ import annotations

import argparse
import html
import json
import math
import os
import random
import re
import unicodedata
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable, Sequence
from urllib.parse import unquote, urlparse

from PIL import Image as PillowImage
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    Flowable,
    HRFlowable,
    Image,
    ListFlowable,
    ListItem,
    LongTable,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents


ROOT = Path(__file__).resolve().parents[1]
RULEBOOK_DIR = ROOT / "src" / "data" / "rulebook"
OUTPUT_DIR = ROOT / "output" / "pdf"
PLAYER_PATH = RULEBOOK_DIR / "player-rulebook.json"
MASTER_PATH = RULEBOOK_DIR / "master-rulebook.json"
BIBLIOGRAPHY_PATH = RULEBOOK_DIR / "bibliography.json"

PAGE_WIDTH, PAGE_HEIGHT = A4
MARGIN_X = 18 * mm
MARGIN_TOP = 20 * mm
MARGIN_BOTTOM = 18 * mm
CONTENT_WIDTH = PAGE_WIDTH - 2 * MARGIN_X

NAVY = colors.HexColor("#07111D")
NAVY_2 = colors.HexColor("#0B1C2C")
INK = colors.HexColor("#152332")
MUTED = colors.HexColor("#526474")
PAPER = colors.HexColor("#F6F4EE")
PAPER_2 = colors.HexColor("#ECEFF0")
CYAN = colors.HexColor("#55D7F4")
CYAN_DARK = colors.HexColor("#187D9B")
GOLD = colors.HexColor("#D8B36A")
GOLD_DARK = colors.HexColor("#8A6223")
PURPLE = colors.HexColor("#7551C8")
PURPLE_DARK = colors.HexColor("#573493")
RED = colors.HexColor("#A83B47")
GREEN = colors.HexColor("#2E7D5A")
YELLOW = colors.HexColor("#B88424")
WHITE = colors.white
BLACK = colors.black

FONT_BODY = "FushiBody"
FONT_BODY_BOLD = "FushiBodyBold"
FONT_DISPLAY = "FushiDisplay"
FONT_DISPLAY_BOLD = "FushiDisplayBold"
FONT_ACCENT = "FushiAccent"
FONT_ACCENT_BOLD = "FushiAccentBold"

STATUS_LABELS = {
    "canon": "CÂNONE",
    "playtest": "EM TESTE",
    "construction": "EM CONSTRUÇÃO",
}

STATUS_COLORS = {
    "canon": GREEN,
    "playtest": YELLOW,
    "construction": RED,
}

TONE_COLORS = {
    "info": CYAN_DARK,
    "rule": GREEN,
    "warning": YELLOW,
    "danger": RED,
    "example": colors.HexColor("#6D55A3"),
    "secret": GOLD_DARK,
}

RULEBOOK_KEYWORD_PATTERN = re.compile(
    r"("
    r"0\s+Vida|0\s+FUSHI|0\s+Determina(?:ção|cao)|"
    r"\bAtaque de oportunidade\b|\bContra-ataque\b|"
    r"\bAção Principal\b|\bAção Curta\b|\bDesengajar\b|"
    r"\bReação\b|\bMovimento\b|\bBloqueio\b|\bEsquiva\b|"
    r"\bFortitude\b|\bCoreografia\b|\bCr[i\u00ed]tico\b|\bPontaria\b|\bLuta\b|"
    r"\bTank\b|\bAssassino\b|\bSuporte\b|\bLutador\b|\bAtirador\b|\bOcultista\b|\bCATACLISMA\b|"
    r"\bDeterminação\b|\bFUSHI\b|\bVida\b|"
    r"\bDT\s*\d+\b|\bCA\s*\d+\b|"
    r"[+-]\d+d20\b|[+-]\d+d\d+\b|\b\d+d\d+\b|[+-]\d+"
    r")",
    re.IGNORECASE,
)

KEYWORD_HEX = {
    "attack": "#573493",
    "check": "#285F8A",
    "danger": "#9B3047",
    "resource": "#147895",
    "timing": "#8A6223",
}

PLAYER_FORBIDDEN_TERMS = (
    "reencarnação",
    "reencarnacao",
    "transposição de consciência",
    "transposicao de consciencia",
    "progressão oculta",
    "progressao oculta",
    "alvo mais próximo",
    "alvo mais proximo",
    "disputa de posse",
    "esporos de fushi",
)


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def register_fonts() -> None:
    font_dir = ROOT / "src" / "assets" / "fonts" / "fushi"
    fonts = {
        FONT_BODY: font_dir / "Manrope-Regular.ttf",
        FONT_BODY_BOLD: font_dir / "Manrope-Bold.ttf",
        FONT_DISPLAY: font_dir / "Cinzel-SemiBold.ttf",
        FONT_DISPLAY_BOLD: font_dir / "Cinzel-Bold.ttf",
        FONT_ACCENT: font_dir / "Orbitron-SemiBold.ttf",
        FONT_ACCENT_BOLD: font_dir / "Orbitron-Bold.ttf",
    }
    missing = [str(path) for path in fonts.values() if not path.exists()]
    if missing:
        raise FileNotFoundError(f"Fontes obrigatórias ausentes: {', '.join(missing)}")
    for name, path in fonts.items():
        pdfmetrics.registerFont(TTFont(name, str(path)))


def normalized_search(value: str) -> str:
    return "".join(
        char
        for char in unicodedata.normalize("NFD", value.casefold())
        if unicodedata.category(char) != "Mn"
    )


def safe_text(value: Any) -> str:
    if value is None:
        return ""
    text = str(value).replace("\r\n", "\n").replace("\r", "\n")
    text = text.replace("→", "->").replace("×", "x").replace("•", "-")
    text = "".join(char for char in text if ord(char) <= 0xFFFF)
    return text.strip()


def paragraph_text(value: Any) -> str:
    text = html.escape(safe_text(value))
    return text.replace("\n", "<br/>")


def keyword_tone(value: str) -> str:
    normalized = normalized_search(value)
    if normalized.startswith("0 ") or re.search(r"critico|cataclisma", normalized):
        return "danger"
    if re.search(r"luta|pontaria|contra-ataque|ataque de oportunidade|coreografia", normalized):
        return "attack"
    if re.search(r"vida|fushi|determinacao", normalized):
        return "resource"
    if re.search(r"acao|reacao|movimento|desengajar|bloqueio|esquiva|fortitude", normalized):
        return "timing"
    return "check"


def rich_rule_text(value: Any) -> str:
    text = safe_text(value)
    parts: list[str] = []
    cursor = 0
    for match in RULEBOOK_KEYWORD_PATTERN.finditer(text):
        if match.start() > cursor:
            parts.append(html.escape(text[cursor:match.start()]))
        matched = match.group(0)
        tone = keyword_tone(matched)
        parts.append(
            f'<font name="{FONT_ACCENT_BOLD}" color="{KEYWORD_HEX[tone]}">'
            f'{html.escape(matched.upper())}</font>'
        )
        cursor = match.end()
    if cursor < len(text):
        parts.append(html.escape(text[cursor:]))
    return "".join(parts).replace("\n", "<br/>")


def short(value: Any, fallback: str = "Não registrado") -> str:
    text = safe_text(value)
    return text if text else fallback


def load_workspace() -> tuple[Path | None, list[dict[str, Any]]]:
    candidates: list[Path] = []
    custom_root = os.environ.get("FUSHI_APPDATA_ROOT")
    if custom_root:
        candidates.append(Path(custom_root) / "workspace.json")
    appdata = os.environ.get("APPDATA")
    if appdata:
        candidates.append(Path(appdata) / "FUSHI" / "workspace.json")

    for path in candidates:
        if not path.exists():
            continue
        payload = load_json(path)
        characters = payload.get("characters", []) if isinstance(payload, dict) else []
        clean = [
            character
            for character in characters
            if isinstance(character, dict)
            and normalized_search(str(character.get("nome", ""))) != "teste"
            and "placeholder" not in normalized_search(str(character.get("nome", "")))
        ]
        return path, clean
    return None, []


def assert_player_secrecy(player: dict[str, Any]) -> None:
    serialized = normalized_search(json.dumps(player, ensure_ascii=False))
    leaks = [term for term in PLAYER_FORBIDDEN_TERMS if normalized_search(term) in serialized]
    if leaks:
        raise ValueError(
            "O Livro do Jogador contém termos confidenciais: " + ", ".join(leaks)
        )


def make_styles() -> dict[str, ParagraphStyle]:
    sample = getSampleStyleSheet()
    return {
        "Body": ParagraphStyle(
            "Body",
            parent=sample["BodyText"],
            fontName=FONT_BODY,
            fontSize=9.35,
            leading=13.8,
            textColor=INK,
            alignment=TA_LEFT,
            spaceAfter=3.5 * mm,
            allowWidows=0,
            allowOrphans=0,
        ),
        "BodySmall": ParagraphStyle(
            "BodySmall",
            parent=sample["BodyText"],
            fontName=FONT_BODY,
            fontSize=7.8,
            leading=10.7,
            textColor=INK,
            alignment=TA_LEFT,
        ),
        "BodySmallMuted": ParagraphStyle(
            "BodySmallMuted",
            parent=sample["BodyText"],
            fontName=FONT_BODY,
            fontSize=7.5,
            leading=10.2,
            textColor=MUTED,
            alignment=TA_LEFT,
        ),
        "ChapterTitle": ParagraphStyle(
            "ChapterTitle",
            parent=sample["Heading1"],
            fontName=FONT_DISPLAY_BOLD,
            fontSize=22,
            leading=26,
            textColor=NAVY,
            spaceBefore=4 * mm,
            spaceAfter=2.5 * mm,
            keepWithNext=True,
        ),
        "ChapterSummary": ParagraphStyle(
            "ChapterSummary",
            parent=sample["BodyText"],
            fontName=FONT_BODY,
            fontSize=10.3,
            leading=14.6,
            textColor=MUTED,
            spaceAfter=5 * mm,
        ),
        "BlockTitle": ParagraphStyle(
            "BlockTitle",
            parent=sample["Heading2"],
            fontName=FONT_DISPLAY_BOLD,
            fontSize=12.7,
            leading=15.7,
            textColor=NAVY,
            spaceBefore=3.5 * mm,
            spaceAfter=1.5 * mm,
            keepWithNext=True,
        ),
        "CalloutTitle": ParagraphStyle(
            "CalloutTitle",
            parent=sample["Heading3"],
            fontName=FONT_BODY_BOLD,
            fontSize=9.5,
            leading=12.5,
            textColor=WHITE,
            leftIndent=4 * mm,
            rightIndent=4 * mm,
            borderPadding=(2.5 * mm, 3 * mm, 1.5 * mm, 3 * mm),
            keepWithNext=True,
        ),
        "CalloutBody": ParagraphStyle(
            "CalloutBody",
            parent=sample["BodyText"],
            fontName=FONT_BODY,
            fontSize=8.8,
            leading=12.4,
            textColor=INK,
            backColor=PAPER_2,
            borderColor=colors.HexColor("#CAD2D8"),
            borderWidth=0.5,
            borderPadding=(2.5 * mm, 3.5 * mm, 2.5 * mm, 3.5 * mm),
            spaceAfter=2 * mm,
        ),
        "Formula": ParagraphStyle(
            "Formula",
            parent=sample["Code"],
            fontName=FONT_BODY_BOLD,
            fontSize=9,
            leading=13,
            textColor=CYAN_DARK,
            backColor=colors.HexColor("#E7F5F8"),
            borderColor=CYAN_DARK,
            borderWidth=0.7,
            borderPadding=3 * mm,
            alignment=TA_CENTER,
            spaceAfter=3 * mm,
        ),
        "Bullet": ParagraphStyle(
            "Bullet",
            parent=sample["BodyText"],
            fontName=FONT_BODY,
            fontSize=8.8,
            leading=12.4,
            textColor=INK,
            leftIndent=0,
            spaceAfter=1.2 * mm,
        ),
        "TOCHeading": ParagraphStyle(
            "TOCHeading",
            parent=sample["Heading1"],
            fontName=FONT_DISPLAY_BOLD,
            fontSize=22,
            leading=26,
            textColor=NAVY,
            spaceAfter=7 * mm,
        ),
        "TOCEntry": ParagraphStyle(
            "TOCEntry",
            parent=sample["BodyText"],
            fontName=FONT_BODY,
            fontSize=9.2,
            leading=13.5,
            textColor=INK,
            leftIndent=0,
            firstLineIndent=0,
            spaceBefore=1.1 * mm,
        ),
        "PartTitle": ParagraphStyle(
            "PartTitle",
            parent=sample["Heading1"],
            fontName=FONT_DISPLAY_BOLD,
            fontSize=28,
            leading=33,
            textColor=WHITE,
            alignment=TA_CENTER,
            spaceAfter=4 * mm,
        ),
        "PartSubtitle": ParagraphStyle(
            "PartSubtitle",
            parent=sample["BodyText"],
            fontName=FONT_BODY,
            fontSize=11,
            leading=16,
            textColor=colors.HexColor("#DCE9F0"),
            alignment=TA_CENTER,
        ),
        "CharacterTitle": ParagraphStyle(
            "CharacterTitle",
            parent=sample["Heading1"],
            fontName=FONT_DISPLAY_BOLD,
            fontSize=19,
            leading=23,
            textColor=NAVY,
            spaceAfter=2 * mm,
            keepWithNext=True,
        ),
        "Meta": ParagraphStyle(
            "Meta",
            parent=sample["BodyText"],
            fontName=FONT_ACCENT_BOLD,
            fontSize=7.6,
            leading=10.4,
            textColor=CYAN_DARK,
            spaceAfter=1.5 * mm,
        ),
        "TableHeader": ParagraphStyle(
            "TableHeader",
            parent=sample["BodyText"],
            fontName=FONT_ACCENT_BOLD,
            fontSize=7.1,
            leading=9.6,
            textColor=WHITE,
            alignment=TA_LEFT,
        ),
        "Bibliography": ParagraphStyle(
            "Bibliography",
            parent=sample["BodyText"],
            fontName=FONT_BODY,
            fontSize=8.3,
            leading=12.2,
            textColor=INK,
            leftIndent=6 * mm,
            firstLineIndent=-6 * mm,
            spaceAfter=2.5 * mm,
        ),
    }


class RulebookDocTemplate(BaseDocTemplate):
    def __init__(self, filename: str, *, title: str, audience: str, **kwargs: Any):
        super().__init__(filename, **kwargs)
        self.rulebook_title = title
        self.audience = audience
        self.current_section = ""
        self._bookmark_count = 0

    def beforeDocument(self) -> None:
        self.current_section = ""
        self._bookmark_count = 0
        super().beforeDocument()

    def afterFlowable(self, flowable: Any) -> None:
        if not isinstance(flowable, Paragraph):
            return
        if flowable.style.name not in {"ChapterTitle", "CharacterTitle"}:
            return
        text = flowable.getPlainText()
        level = 0 if flowable.style.name == "ChapterTitle" else 1
        self._bookmark_count += 1
        key = f"section-{self._bookmark_count}"
        self.canv.bookmarkPage(key)
        self.canv.addOutlineEntry(text, key, level=level, closed=level > 0)
        self.notify("TOCEntry", (level, text, self.page, key))
        self.current_section = text


def draw_space_background(canvas: Any, seed: int, master: bool = False) -> None:
    rng = random.Random(seed)
    canvas.saveState()
    canvas.setFillColor(NAVY)
    canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#10283A" if not master else "#241C1A"))
    canvas.circle(PAGE_WIDTH * 0.82, PAGE_HEIGHT * 0.18, 92 * mm, fill=1, stroke=0)
    for _ in range(175):
        x = rng.uniform(8 * mm, PAGE_WIDTH - 8 * mm)
        y = rng.uniform(8 * mm, PAGE_HEIGHT - 8 * mm)
        radius = rng.choice((0.18, 0.24, 0.34, 0.5)) * mm
        alpha = rng.uniform(0.24, 0.9)
        canvas.setFillAlpha(alpha)
        canvas.setFillColor(CYAN if rng.random() > 0.12 else GOLD)
        canvas.circle(x, y, radius, fill=1, stroke=0)
    canvas.setFillAlpha(1)
    canvas.setStrokeColor(GOLD if master else CYAN)
    canvas.setLineWidth(0.8)
    for offset in range(5):
        canvas.arc(
            12 * mm - offset * 8 * mm,
            30 * mm - offset * 4 * mm,
            PAGE_WIDTH - 14 * mm + offset * 8 * mm,
            PAGE_HEIGHT * 0.67 + offset * 5 * mm,
            startAng=8,
            extent=136,
        )
    canvas.restoreState()


def draw_sigil(canvas: Any, cx: float, cy: float, radius: float, accent: Any) -> None:
    canvas.saveState()
    canvas.setStrokeColor(accent)
    canvas.setLineWidth(1.3)
    canvas.circle(cx, cy, radius, fill=0, stroke=1)
    points = []
    for index in range(6):
        angle = math.radians(90 + index * 60)
        points.append((cx + math.cos(angle) * radius * 0.68, cy + math.sin(angle) * radius * 0.68))
    path = canvas.beginPath()
    path.moveTo(*points[0])
    for point in points[1:]:
        path.lineTo(*point)
    path.close()
    canvas.drawPath(path, fill=0, stroke=1)
    for x, y in points:
        canvas.line(cx, cy, x, y)
    canvas.setFillColor(accent)
    canvas.circle(cx, cy, radius * 0.08, fill=1, stroke=0)
    canvas.restoreState()


def cover_page(canvas: Any, doc: RulebookDocTemplate) -> None:
    master = doc.audience == "master"
    accent = GOLD if master else CYAN
    canvas.setTitle(doc.rulebook_title)
    canvas.setAuthor("Projeto RPG FUSHI")
    canvas.setSubject("Sistema e campanha RPG FUSHI")
    canvas.setCreator("FUSHI Tabletop Rulebook Builder")
    draw_space_background(canvas, 20260710 + (17 if master else 0), master=master)
    canvas.saveState()
    draw_sigil(canvas, PAGE_WIDTH / 2, PAGE_HEIGHT * 0.71, 26 * mm, accent)
    canvas.setFillColor(accent)
    canvas.setFont(FONT_BODY_BOLD, 8.5)
    canvas.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT * 0.61, "FUSHI · REGRAS OFICIAIS")
    canvas.setFillColor(WHITE)
    canvas.setFont(FONT_DISPLAY_BOLD, 29)
    canvas.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT * 0.52, "FUSHI")
    canvas.setFont(FONT_DISPLAY_BOLD, 22)
    canvas.drawCentredString(
        PAGE_WIDTH / 2,
        PAGE_HEIGHT * 0.47,
        "LIVRO DO MESTRE" if master else "LIVRO DO JOGADOR",
    )
    canvas.setFont(FONT_BODY, 10)
    canvas.setFillColor(colors.HexColor("#DCE9F0"))
    subtitle = (
        "Escudo de regras, segredos de campanha e condução mecânica"
        if master
        else "Regras públicas, combate tático e caminhos de evolução"
    )
    canvas.drawCentredString(PAGE_WIDTH / 2, PAGE_HEIGHT * 0.42, subtitle)
    canvas.setStrokeColor(accent)
    canvas.setLineWidth(1)
    canvas.line(42 * mm, PAGE_HEIGHT * 0.375, PAGE_WIDTH - 42 * mm, PAGE_HEIGHT * 0.375)
    canvas.setFont(FONT_BODY_BOLD, 8)
    canvas.setFillColor(accent)
    canvas.drawCentredString(PAGE_WIDTH / 2, 34 * mm, "EDIÇÃO ALPHA 0.1 · JULHO DE 2026")
    canvas.setFont(FONT_BODY, 7.2)
    canvas.setFillColor(colors.HexColor("#B8C7D0"))
    canvas.drawCentredString(PAGE_WIDTH / 2, 27 * mm, "PROJETO RPG FUSHI · TABLETOP")
    if master:
        canvas.setFillColor(colors.HexColor("#3A1A1D"))
        canvas.roundRect(45 * mm, 15 * mm, PAGE_WIDTH - 90 * mm, 8 * mm, 2 * mm, fill=1, stroke=0)
        canvas.setFillColor(colors.HexColor("#F2C6BD"))
        canvas.setFont(FONT_BODY_BOLD, 6.8)
        canvas.drawCentredString(PAGE_WIDTH / 2, 18 * mm, "CONFIDENCIAL · USO EXCLUSIVO DO MESTRE")
    canvas.restoreState()


def body_page(canvas: Any, doc: RulebookDocTemplate) -> None:
    accent = GOLD_DARK if doc.audience == "master" else CYAN_DARK
    canvas.saveState()
    canvas.setFillColor(PAPER)
    canvas.rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, fill=1, stroke=0)
    canvas.setStrokeColor(colors.HexColor("#D5DBDE"))
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN_X, PAGE_HEIGHT - 13 * mm, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 13 * mm)
    canvas.line(MARGIN_X, 12 * mm, PAGE_WIDTH - MARGIN_X, 12 * mm)
    canvas.setFont(FONT_BODY_BOLD, 6.8)
    canvas.setFillColor(accent)
    canvas.drawString(MARGIN_X, PAGE_HEIGHT - 10 * mm, "FUSHI")
    canvas.setFont(FONT_BODY, 6.7)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(
        PAGE_WIDTH - MARGIN_X,
        PAGE_HEIGHT - 10 * mm,
        doc.rulebook_title[:82],
    )
    canvas.drawString(MARGIN_X, 7.2 * mm, "EDIÇÃO ALPHA 0.1")
    canvas.drawRightString(PAGE_WIDTH - MARGIN_X, 7.2 * mm, str(doc.page))
    canvas.restoreState()


def part_page(canvas: Any, doc: RulebookDocTemplate) -> None:
    draw_space_background(canvas, 1423 + doc.page, master=doc.audience == "master")


def make_document(path: Path, title: str, audience: str) -> RulebookDocTemplate:
    body_frame = Frame(
        MARGIN_X,
        MARGIN_BOTTOM,
        CONTENT_WIDTH,
        PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM,
        id="body-frame",
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
    )
    cover_frame = Frame(0, 0, PAGE_WIDTH, PAGE_HEIGHT, id="cover-frame", showBoundary=0)
    part_frame = Frame(
        24 * mm,
        80 * mm,
        PAGE_WIDTH - 48 * mm,
        PAGE_HEIGHT - 160 * mm,
        id="part-frame",
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
    )
    doc = RulebookDocTemplate(
        str(path),
        title=title,
        audience=audience,
        pagesize=A4,
        leftMargin=MARGIN_X,
        rightMargin=MARGIN_X,
        topMargin=MARGIN_TOP,
        bottomMargin=MARGIN_BOTTOM,
        allowSplitting=1,
        pageCompression=1,
        author="Projeto RPG FUSHI",
        subject="Sistema e campanha RPG FUSHI",
        creator="FUSHI Tabletop Rulebook Builder",
    )
    doc.addPageTemplates(
        [
            PageTemplate(id="cover", frames=[cover_frame], onPage=cover_page),
            PageTemplate(id="body", frames=[body_frame], onPage=body_page),
            PageTemplate(id="part", frames=[part_frame], onPage=part_page),
        ]
    )
    return doc


def toc_flowable(styles: dict[str, ParagraphStyle]) -> TableOfContents:
    toc = TableOfContents()
    toc.levelStyles = [
        styles["TOCEntry"],
        ParagraphStyle(
            "TOCSubEntry",
            parent=styles["TOCEntry"],
            fontSize=8,
            leading=11.5,
            leftIndent=7 * mm,
            textColor=MUTED,
        ),
    ]
    toc.dotsMinLevel = 0
    return toc


def editorial_pages(
    volume: dict[str, Any],
    styles: dict[str, ParagraphStyle],
    *,
    master: bool,
) -> list[Any]:
    accent = GOLD_DARK if master else CYAN_DARK
    confidentiality = safe_text(volume.get("confidentiality"))
    story: list[Any] = [NextPageTemplate("body"), PageBreak()]
    story.extend(
        [
            Paragraph("Sobre esta edição", styles["ChapterTitle"]),
            Paragraph(
                "Este livro é gerado da mesma fonte estruturada usada pelo FUSHI Tabletop. "
                "O objetivo é manter a consulta da mesa, o PDF e a manutenção das regras no mesmo estado.",
                styles["Body"],
            ),
            Paragraph("Escopo", styles["BlockTitle"]),
            Paragraph(paragraph_text(confidentiality), styles["CalloutBody"]),
            Paragraph("Estado editorial", styles["BlockTitle"]),
            Paragraph(
                "CÂNONE indica regra aprovada. EM TESTE indica regra pronta para uso, mas sujeita a ajuste após sessão. "
                "EM CONSTRUÇÃO indica estrutura oficial cujo catálogo ou balanceamento ainda não foi fechado.",
                styles["Body"],
            ),
            Paragraph("Princípio de precedência", styles["BlockTitle"]),
            Paragraph(
                "Decisão definitiva do Mestre e registro mais recente prevalecem sobre texto antigo. "
                "Nenhuma automação, ficha ou ferramenta transforma uma hipótese em Canon sozinha.",
                styles["Body"],
            ),
            Spacer(1, 5 * mm),
            HRFlowable(width="100%", thickness=1, color=accent),
            Spacer(1, 4 * mm),
            Paragraph(
                "Texto, sistema e direção criativa: Projeto RPG FUSHI.<br/>"
                "Diagramação automatizada e integração: FUSHI Tabletop.<br/>"
                "Edição de trabalho privada. Referências de design são creditadas na bibliografia; nenhum texto externo foi reproduzido.",
                styles["BodySmallMuted"],
            ),
            PageBreak(),
            Paragraph("Sumário", styles["TOCHeading"]),
            toc_flowable(styles),
        ]
    )
    return story


def part_divider(title: str, subtitle: str, styles: dict[str, ParagraphStyle]) -> list[Any]:
    return [
        NextPageTemplate("part"),
        PageBreak(),
        Paragraph(paragraph_text(title), styles["PartTitle"]),
        Paragraph(paragraph_text(subtitle), styles["PartSubtitle"]),
        NextPageTemplate("body"),
        PageBreak(),
    ]


def list_flowable(items: Sequence[Any], styles: dict[str, ParagraphStyle], ordered: bool) -> ListFlowable:
    options: dict[str, Any] = {
        "bulletType": "1" if ordered else "bullet",
        "leftIndent": 6 * mm,
        "bulletFontName": FONT_BODY_BOLD,
        "bulletFontSize": 8,
        "bulletColor": CYAN_DARK,
        "spaceAfter": 2.5 * mm,
    }
    if ordered:
        options["start"] = "1"

    return ListFlowable(
        [
            ListItem(Paragraph(rich_rule_text(item), styles["Bullet"]), leftIndent=4 * mm)
            for item in items
        ],
        **options,
    )


def table_widths(columns: Sequence[str]) -> list[float]:
    count = max(1, len(columns))
    if count == 2:
        return [CONTENT_WIDTH * 0.31, CONTENT_WIDTH * 0.69]
    if count == 3:
        return [CONTENT_WIDTH * 0.22, CONTENT_WIDTH * 0.35, CONTENT_WIDTH * 0.43]
    if count == 4:
        return [CONTENT_WIDTH * 0.18, CONTENT_WIDTH * 0.24, CONTENT_WIDTH * 0.27, CONTENT_WIDTH * 0.31]
    return [CONTENT_WIDTH / count] * count


def rule_table(table_data: dict[str, Any], styles: dict[str, ParagraphStyle], master: bool) -> LongTable:
    columns = [safe_text(value) for value in table_data.get("columns", [])]
    rows = table_data.get("rows", [])
    data = [[Paragraph(paragraph_text(value), styles["TableHeader"]) for value in columns]]
    for row in rows:
        data.append([Paragraph(rich_rule_text(value), styles["BodySmall"]) for value in row])
    accent = GOLD_DARK if master else CYAN_DARK
    table = LongTable(data, colWidths=table_widths(columns), repeatRows=1, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), NAVY_2),
                ("TEXTCOLOR", (0, 0), (-1, 0), WHITE),
                ("FONTNAME", (0, 0), (-1, 0), FONT_BODY_BOLD),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#FBFAF6")),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#FBFAF6"), PAPER_2]),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#BDC8CE")),
                ("LINEBELOW", (0, 0), (-1, 0), 1.1, accent),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 2.4 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 2.4 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 2.1 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.1 * mm),
            ]
        )
    )
    return table


def example_visual_kind(block: dict[str, Any]) -> tuple[str, str]:
    source = normalized_search(f"{block.get('title', '')} {block.get('text', '')}")
    if re.search(r"0 vida|medicina|aliado caido", source):
        return "aid", "COBERTURA E SOCORRO"
    if re.search(r"manada|oportunidade|desengajar|defesa", source):
        return "threat", "ZONA DE AMEACA"
    if re.search(r"pontaria|atirador|linha de visao|distancia", source):
        return "ranged", "LINHA DE VISAO"
    if re.search(r"d20|dt |coreografia|acerto|ca ", source):
        return "precision", "RISCO E PRECISAO"
    return "terrain", "TERRENO E VANTAGEM"


class TacticalExampleDiagram(Flowable):
    def __init__(self, kind: str, label: str):
        super().__init__()
        self.kind = kind
        self.label = label
        self.width = CONTENT_WIDTH
        self.height = 27 * mm

    def draw_node(self, x: float, y: float, color: colors.Color, radius: float = 6.5) -> None:
        canvas = self.canv
        canvas.setFillColor(NAVY)
        canvas.setStrokeColor(color)
        canvas.setLineWidth(1.4)
        canvas.circle(x, y, radius, fill=1, stroke=1)
        canvas.setStrokeAlpha(0.18)
        canvas.circle(x, y, radius + 4, fill=0, stroke=1)
        canvas.setStrokeAlpha(1)

    def draw(self) -> None:
        canvas = self.canv
        width = self.width
        height = self.height
        canvas.saveState()
        canvas.setFillColor(colors.HexColor("#10192B"))
        canvas.setStrokeColor(colors.HexColor("#A889FF"))
        canvas.setLineWidth(0.55)
        canvas.roundRect(0, 0, width, height, 5, fill=1, stroke=1)

        canvas.setStrokeColor(colors.HexColor("#29435C"))
        canvas.setLineWidth(0.25)
        for x in range(12, int(width), 28):
            canvas.line(x, 0, x, height)
        for y in range(12, int(height), 24):
            canvas.line(0, y, width, y)

        randomizer = random.Random(f"fushi-example-{self.kind}")
        canvas.setFillColor(colors.HexColor("#BFDFF0"))
        for _ in range(26):
            canvas.circle(randomizer.uniform(6, width - 6), randomizer.uniform(6, height - 6), 0.45, fill=1, stroke=0)

        ax, ay = width * 0.2, height * 0.49
        bx, by = width * 0.68, height * 0.64
        cx, cy = width * 0.76, height * 0.27
        line_color = CYAN
        if self.kind == "threat":
            bx, by = width * 0.31, height * 0.72
            cx, cy = width * 0.34, height * 0.24
            canvas.setStrokeColor(colors.HexColor("#E26780"))
            canvas.setLineWidth(0.8)
            canvas.ellipse(width * 0.11, height * 0.08, width * 0.42, height * 0.9, fill=0, stroke=1)
        elif self.kind == "aid":
            line_color = colors.HexColor("#74D9B0")
        elif self.kind == "precision":
            canvas.setStrokeColor(PURPLE)
            canvas.setLineWidth(0.7)
            canvas.circle(bx, by, 22, fill=0, stroke=1)
            canvas.circle(bx, by, 13, fill=0, stroke=1)

        canvas.setStrokeColor(line_color)
        canvas.setLineWidth(1.6)
        if self.kind == "ranged":
            canvas.setDash(4, 2)
        canvas.line(ax + 7, ay, bx - 7, by)
        canvas.setDash()
        self.draw_node(ax, ay, CYAN)
        self.draw_node(bx, by, PURPLE)
        self.draw_node(cx, cy, GOLD, radius=5)

        canvas.setFont(FONT_ACCENT_BOLD, 6.8)
        canvas.setFillColor(colors.HexColor("#DCCFFF"))
        canvas.drawRightString(width - 10, 8, self.label)
        canvas.restoreState()


def render_block(block: dict[str, Any], styles: dict[str, ParagraphStyle], master: bool) -> list[Any]:
    kind = block.get("kind", "rule")
    title = safe_text(block.get("title", ""))
    text = safe_text(block.get("text", ""))
    items = block.get("items") or []
    table_data = block.get("table")
    formula = safe_text(block.get("formula", ""))
    tone = block.get("tone") or ("secret" if kind == "secret" else "info")
    accent = TONE_COLORS.get(str(tone), CYAN_DARK)
    result: list[Any] = []

    callout = kind in {"lead", "warning", "example", "secret"}
    if title:
        if callout:
            title_style = ParagraphStyle(
                f"CalloutTitle-{tone}",
                parent=styles["CalloutTitle"],
                backColor=accent,
                borderColor=accent,
                borderWidth=0.5,
            )
            result.append(Paragraph(paragraph_text(title), title_style))
        else:
            result.append(Paragraph(paragraph_text(title), styles["BlockTitle"]))
    if kind == "example":
        visual_kind, visual_label = example_visual_kind(block)
        result.append(TacticalExampleDiagram(visual_kind, visual_label))
        result.append(Spacer(1, 2 * mm))
    if text:
        result.append(Paragraph(rich_rule_text(text), styles["CalloutBody"] if callout else styles["Body"]))
    if formula:
        result.append(Paragraph(rich_rule_text(formula), styles["Formula"]))
    if items:
        result.append(list_flowable(items, styles, ordered=kind == "steps"))
    if table_data:
        result.append(rule_table(table_data, styles, master))
        result.append(Spacer(1, 3 * mm))
    return result


def chapter_story(
    sections: Sequence[dict[str, Any]],
    styles: dict[str, ParagraphStyle],
    *,
    master: bool,
) -> list[Any]:
    story: list[Any] = []
    accent = GOLD_DARK if master else CYAN_DARK
    for index, section in enumerate(sections):
        if index:
            story.append(PageBreak())
        number = safe_text(section.get("number", ""))
        label = safe_text(section.get("label", "Capítulo"))
        status = safe_text(section.get("status", "canon"))
        tags = " · ".join(safe_text(tag).upper() for tag in section.get("tags", []))
        meta = f"{number}  ·  {STATUS_LABELS.get(status, status.upper())}"
        if tags:
            meta += f"  ·  {tags}"
        story.append(Paragraph(paragraph_text(meta), styles["Meta"]))
        story.append(Paragraph(paragraph_text(f"{number} · {label}"), styles["ChapterTitle"]))
        story.append(Paragraph(paragraph_text(section.get("summary", "")), styles["ChapterSummary"]))
        story.append(HRFlowable(width="100%", thickness=1.1, color=accent, spaceAfter=3 * mm))
        for block in section.get("blocks", []):
            story.extend(render_block(block, styles, master))
    return story


def public_bibliography_entries(bibliography: Sequence[dict[str, Any]]) -> list[dict[str, Any]]:
    public = [entry for entry in bibliography if entry.get("type") == "design-reference"]
    return [
        {
            "title": "Documentação pública do Sistema FUSHI",
            "type": "internal",
            "note": "Fonte estruturada das regras públicas, exemplos táticos e estados editoriais desta edição.",
        },
        *public,
    ]


def bibliography_story(
    entries: Sequence[dict[str, Any]],
    styles: dict[str, ParagraphStyle],
    *,
    master: bool,
) -> list[Any]:
    story: list[Any] = [PageBreak()]
    story.append(Paragraph("Bibliografia e fontes", styles["ChapterTitle"]))
    intro = (
        "As fontes internas abaixo registram a origem operacional desta edição. "
        "Referências externas foram usadas apenas como direção de leitura e organização; nenhum texto protegido foi reproduzido."
        if master
        else "Referências editoriais e de design usadas para organizar a consulta pública. "
        "Segredos e documentos internos da campanha não são listados neste volume."
    )
    story.append(Paragraph(intro, styles["Body"]))
    for index, entry in enumerate(entries, start=1):
        path = safe_text(entry.get("path", ""))
        note = safe_text(entry.get("note", ""))
        parts = [f"<b>{index}. {html.escape(safe_text(entry.get('title', 'Fonte')))}</b>"]
        if path:
            parts.append(f"<br/><font color='#526474'>{html.escape(path)}</font>")
        if note:
            parts.append(f"<br/>{html.escape(note)}")
        story.append(Paragraph("".join(parts), styles["Bibliography"]))
    return story


def resolve_asset_url(url: str, workspace_path: Path | None) -> Path | None:
    if not url:
        return None
    if url.startswith("fushi-asset://campaign/") and workspace_path:
        suffix = url.removeprefix("fushi-asset://campaign/")
        campaign_id, _, relative = suffix.partition("/")
        candidate = workspace_path.parent / "campaigns" / campaign_id / "assets" / unquote(relative)
        return candidate if candidate.exists() else None
    if url.startswith("/assets/"):
        candidate = ROOT / "public" / url.lstrip("/")
        return candidate if candidate.exists() else None
    if url.startswith("file:"):
        parsed = urlparse(url)
        candidate = Path(unquote(parsed.path.lstrip("/")))
        return candidate if candidate.exists() else None
    candidate = Path(url)
    return candidate if candidate.is_absolute() and candidate.exists() else None


def fitted_image(path: Path, max_width: float, max_height: float) -> Image | None:
    try:
        with PillowImage.open(path) as image:
            width, height = image.size
        ratio = min(max_width / max(width, 1), max_height / max(height, 1))
        return Image(str(path), width=width * ratio, height=height * ratio)
    except Exception:
        return None


def key_value_table(
    rows: Sequence[tuple[str, Any]],
    styles: dict[str, ParagraphStyle],
    *,
    widths: tuple[float, float] | None = None,
) -> LongTable:
    data = [
        [
            Paragraph(f"<b>{paragraph_text(label)}</b>", styles["BodySmall"]),
            Paragraph(paragraph_text(short(value)), styles["BodySmall"]),
        ]
        for label, value in rows
    ]
    col_widths = list(widths or (CONTENT_WIDTH * 0.29, CONTENT_WIDTH * 0.71))
    table = LongTable(data, colWidths=col_widths, hAlign="LEFT")
    table.setStyle(
        TableStyle(
            [
                ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.HexColor("#FBFAF6"), PAPER_2]),
                ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#CBD3D7")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 2.2 * mm),
                ("RIGHTPADDING", (0, 0), (-1, -1), 2.2 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 1.7 * mm),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 1.7 * mm),
            ]
        )
    )
    return table


def compact_list(values: Iterable[Any]) -> str:
    result = [safe_text(value) for value in values if safe_text(value)]
    return " · ".join(result) if result else "Não registrado"


def automation_text(automation: Any) -> str:
    if not isinstance(automation, dict):
        return ""
    fields: list[str] = []
    for key, label in (
        ("kind", "Tipo"),
        ("activation", "Ativação"),
        ("target", "Alvo"),
        ("range", "Alcance"),
        ("duration", "Duração"),
        ("limit", "Limite"),
    ):
        if automation.get(key):
            fields.append(f"{label}: {safe_text(automation[key])}")
    if automation.get("costs"):
        costs = []
        for cost in automation["costs"]:
            if isinstance(cost, dict):
                costs.append(f"{cost.get('amount', 0)} {safe_text(cost.get('resource'))}")
        if costs:
            fields.append("Custo: " + ", ".join(costs))
    roll = automation.get("roll")
    if isinstance(roll, dict):
        fields.append(
            "Rolagem: "
            f"{roll.get('quantidadeDados', 1)}d{roll.get('tipoDado', 20)}"
            f" + {roll.get('bonus', 0)} ({safe_text(roll.get('modo', 'highest'))})"
        )
    if automation.get("gmText"):
        fields.append("Mestre: " + safe_text(automation["gmText"]))
    if automation.get("publicText"):
        fields.append("Público: " + safe_text(automation["publicText"]))
    return "\n".join(fields)


def feature_story(
    title: str,
    features: Sequence[Any],
    legacy_names: Sequence[Any],
    styles: dict[str, ParagraphStyle],
) -> list[Any]:
    story: list[Any] = [Paragraph(paragraph_text(title), styles["BlockTitle"])]
    if features:
        for feature in features:
            if not isinstance(feature, dict):
                continue
            name = short(feature.get("nome"), "Recurso sem nome")
            description = short(feature.get("descricao"), "Sem descrição registrada.")
            automation = automation_text(feature.get("automation"))
            content = f"<b>{paragraph_text(name)}</b><br/>{paragraph_text(description)}"
            if automation:
                content += f"<br/><font color='#526474'>{paragraph_text(automation)}</font>"
            story.append(Paragraph(content, styles["CalloutBody"]))
    elif legacy_names:
        story.append(list_flowable(legacy_names, styles, ordered=False))
    else:
        story.append(Paragraph("Nenhum registro nesta edição.", styles["BodySmallMuted"]))
    return story


def character_story(
    character: dict[str, Any],
    styles: dict[str, ParagraphStyle],
    workspace_path: Path | None,
    index: int,
) -> list[Any]:
    name = short(character.get("nome"), "Sem nome")
    kind = short(character.get("tipo"), "npc").upper()
    story: list[Any] = [PageBreak()]
    story.append(Paragraph(paragraph_text(f"C{index:02d} · {name}"), styles["CharacterTitle"]))
    story.append(
        Paragraph(
            paragraph_text(
                f"{kind} · {short(character.get('faccao'))} · {short(character.get('localAtual'))} · "
                f"Nível {short(character.get('nivel'), 'não registrado')}"
            ),
            styles["Meta"],
        )
    )

    avatar_path = resolve_asset_url(safe_text(character.get("avatarUrl")), workspace_path)
    avatar = fitted_image(avatar_path, 32 * mm, 40 * mm) if avatar_path else None
    summary_rows = [
        ("ID", character.get("id")),
        ("Tipo", character.get("tipo")),
        ("Jogador", character.get("jogador")),
        ("Origem", character.get("origem")),
        ("Classe/rumo", character.get("classe")),
        ("Facção", character.get("faccao")),
        ("Local", character.get("localAtual")),
        ("Nível / tier", f"{short(character.get('nivel'), '-')} / {short(character.get('tier'), '-')}") ,
        ("Papel de combate", character.get("combatRole")),
    ]
    summary_table = key_value_table(
        summary_rows,
        styles,
        widths=(CONTENT_WIDTH * 0.21, CONTENT_WIDTH * (0.79 if avatar is None else 0.55)),
    )
    if avatar:
        header = Table([[avatar, summary_table]], colWidths=[CONTENT_WIDTH * 0.22, CONTENT_WIDTH * 0.78])
        header.setStyle(
            TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (-1, -1), 0),
                    ("RIGHTPADDING", (0, 0), (0, 0), 4 * mm),
                    ("RIGHTPADDING", (1, 0), (1, 0), 0),
                    ("TOPPADDING", (0, 0), (-1, -1), 0),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
                ]
            )
        )
        story.append(header)
    else:
        story.append(summary_table)

    attributes = character.get("atributos") if isinstance(character.get("atributos"), dict) else {}
    resources = character.get("recursos") if isinstance(character.get("recursos"), dict) else {}
    combat_rows = [
        ("Atributos", " · ".join(f"{key.upper()} {attributes.get(key, 0)}" for key in ("forca", "agilidade", "intelecto", "presenca", "vigor"))),
        ("Vida", f"{resources.get('vidaAtual', 0)}/{resources.get('vidaMaxima', 0)}"),
        ("FUSHI", f"{resources.get('fushiAtual', 0)}/{resources.get('fushiMaximo', 0)}"),
        ("Determinação", f"{resources.get('determinacaoAtual', 0)}/{resources.get('determinacaoMaxima', 0)}"),
        ("CA base", character.get("defesa")),
        ("Bloqueio / Esquiva", f"{short(character.get('bloqueio'), '-')} / {short(character.get('esquiva'), '-')}") ,
        ("Proteção / Resistência", f"{short(character.get('protecao'), '-')} / {short(character.get('resistencia'), '-')}") ,
        ("Deslocamento", character.get("deslocamento")),
        ("Rolagem base", character.get("rolagemBase")),
    ]
    story.append(Paragraph("Estatísticas de mesa", styles["BlockTitle"]))
    story.append(key_value_table(combat_rows, styles))

    trained_skills = [
        skill
        for skill in character.get("pericias", [])
        if isinstance(skill, dict) and int(skill.get("bonusPericia", 0) or 0) != 0
    ]
    story.append(Paragraph("Perícias treinadas", styles["BlockTitle"]))
    if trained_skills:
        skill_data = {
            "columns": ["Perícia", "Atributo", "Bônus", "Resumo"],
            "rows": [
                [
                    skill.get("nome"),
                    skill.get("atributoBase"),
                    f"+{skill.get('bonusPericia', 0)}",
                    skill.get("resumo") or "-",
                ]
                for skill in trained_skills
            ],
        }
        story.append(rule_table(skill_data, styles, master=True))
    else:
        story.append(Paragraph("Nenhuma Perícia acima de +0 registrada.", styles["BodySmallMuted"]))

    attacks = [attack for attack in character.get("ataques", []) if isinstance(attack, dict)]
    story.append(Paragraph("Ataques", styles["BlockTitle"]))
    if attacks:
        attack_data = {
            "columns": ["Ataque", "Teste", "Dano", "Alcance / regra"],
            "rows": [
                [
                    attack.get("nome"),
                    f"{safe_text(attack.get('atributoBase')).upper()} + {attack.get('bonusPericia', 0)}",
                    attack.get("dano") or "-",
                    "\n".join(
                        value
                        for value in (
                            safe_text(attack.get("alcance")),
                            safe_text(attack.get("resumo")),
                            automation_text(attack.get("automation")),
                        )
                        if value
                    ),
                ]
                for attack in attacks
            ],
        }
        story.append(rule_table(attack_data, styles, master=True))
    else:
        story.append(Paragraph("Nenhum ataque cadastrado.", styles["BodySmallMuted"]))

    story.extend(
        feature_story(
            "Habilidades",
            character.get("habilidadesDetalhadas") or [],
            character.get("habilidades") or [],
            styles,
        )
    )
    story.extend(feature_story("Rituais", character.get("rituais") or [], [], styles))

    description = character.get("descricao") if isinstance(character.get("descricao"), dict) else {}
    story.append(Paragraph("Lore e condução", styles["BlockTitle"]))
    lore_fields = [
        ("História", description.get("historia")),
        ("Objetivo", description.get("objetivo")),
        ("Aparência", description.get("aparencia")),
        ("Personalidade", description.get("personalidade")),
        ("Status", compact_list(character.get("status") or [])),
        ("Notas do Mestre", character.get("notas")),
        ("Inventário", compact_list(character.get("inventario") or [])),
        ("Proficiências", compact_list(character.get("proficiencias") or [])),
    ]
    for label, value in lore_fields:
        story.append(Paragraph(paragraph_text(label), styles["Meta"]))
        story.append(Paragraph(paragraph_text(short(value)), styles["Body"]))
    return story


def compendium_story(
    characters: Sequence[dict[str, Any]],
    styles: dict[str, ParagraphStyle],
    workspace_path: Path | None,
) -> list[Any]:
    story: list[Any] = []
    order = {"player": 0, "npc": 1, "mob": 2}
    sorted_characters = sorted(
        characters,
        key=lambda character: (
            order.get(str(character.get("tipo")), 9),
            normalized_search(str(character.get("faccao", ""))),
            normalized_search(str(character.get("nome", ""))),
        ),
    )
    counts = {
        kind: sum(1 for character in sorted_characters if character.get("tipo") == kind)
        for kind in ("player", "npc", "mob")
    }
    story.append(Paragraph("Compêndio vivo da campanha", styles["ChapterTitle"]))
    story.append(
        Paragraph(
            paragraph_text(
                f"Snapshot de {len(sorted_characters)} fichas reais: {counts['player']} protagonistas, "
                f"{counts['npc']} NPCs e {counts['mob']} mobs. "
                f"Fonte: {workspace_path or 'workspace indisponível'}. "
                f"Gerado em {datetime.now().astimezone().strftime('%d/%m/%Y %H:%M %Z')}."
            ),
            styles["ChapterSummary"],
        )
    )
    story.append(
        Paragraph(
            "Este apêndice documenta o que estava persistido no momento da edição. "
            "Números antigos, campos vazios e fichas sem automação continuam marcados para revisão; "
            "a impressão não transforma esses dados automaticamente em balanceamento aprovado.",
            styles["CalloutBody"],
        )
    )
    for index, character in enumerate(sorted_characters, start=1):
        story.extend(character_story(character, styles, workspace_path, index))
    return story


def build_player_pdf(
    player: dict[str, Any],
    bibliography: Sequence[dict[str, Any]],
    styles: dict[str, ParagraphStyle],
) -> Path:
    output = OUTPUT_DIR / "FUSHI_Livro_do_Jogador_Alpha84.pdf"
    doc = make_document(output, player["title"], "player")
    story: list[Any] = []
    story.extend(editorial_pages(player, styles, master=False))
    story.extend(part_divider("REGRAS DO JOGADOR", "Combate, tática e caminhos de evolução sem segredos da campanha.", styles))
    story.extend(chapter_story(player["sections"], styles, master=False))
    story.extend(bibliography_story(public_bibliography_entries(bibliography), styles, master=False))
    doc.multiBuild(story)
    return output


def build_master_pdf(
    player: dict[str, Any],
    master: dict[str, Any],
    bibliography: Sequence[dict[str, Any]],
    styles: dict[str, ParagraphStyle],
    workspace_path: Path | None,
    characters: Sequence[dict[str, Any]],
) -> Path:
    output = OUTPUT_DIR / "FUSHI_Livro_do_Mestre_Alpha84.pdf"
    doc = make_document(output, master["title"], "master")
    story: list[Any] = []
    story.extend(editorial_pages(master, styles, master=True))
    story.extend(part_divider("PARTE I · REGRAS PÚBLICAS", "O mesmo contrato mecânico consultado pelos jogadores.", styles))
    story.extend(chapter_story(player["sections"], styles, master=False))
    story.extend(part_divider("PARTE II · ESCUDO DO MESTRE", "Fórmulas, segredos, progressão oculta e protocolos de campanha.", styles))
    story.extend(chapter_story(master["sections"], styles, master=True))
    story.extend(part_divider("PARTE III · COMPÊNDIO VIVO", "Snapshot das fichas persistidas para consulta e auditoria.", styles))
    story.extend(compendium_story(characters, styles, workspace_path))
    story.extend(bibliography_story(bibliography, styles, master=True))
    doc.multiBuild(story)
    return output


def main() -> int:
    parser = argparse.ArgumentParser(description="Gera os dois livros oficiais do FUSHI.")
    parser.add_argument("--player-only", action="store_true", help="Gera apenas o Livro do Jogador.")
    parser.add_argument("--master-only", action="store_true", help="Gera apenas o Livro do Mestre.")
    args = parser.parse_args()
    if args.player_only and args.master_only:
        parser.error("Use somente um filtro de volume por vez.")

    register_fonts()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    player = load_json(PLAYER_PATH)
    master = load_json(MASTER_PATH)
    bibliography = load_json(BIBLIOGRAPHY_PATH)
    assert_player_secrecy(player)
    workspace_path, characters = load_workspace()
    styles = make_styles()

    outputs: list[Path] = []
    if not args.master_only:
        outputs.append(build_player_pdf(player, bibliography, styles))
    if not args.player_only:
        outputs.append(
            build_master_pdf(
                player,
                master,
                bibliography,
                styles,
                workspace_path,
                characters,
            )
        )

    for output in outputs:
        print(f"OK {output} ({output.stat().st_size / 1024 / 1024:.2f} MiB)")
    print(f"Workspace: {workspace_path or 'não encontrado'} | fichas: {len(characters)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
