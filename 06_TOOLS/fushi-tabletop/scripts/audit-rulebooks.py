#!/usr/bin/env python3
"""Audit generated FUSHI rulebook PDFs and their 150 DPI page renders."""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import unicodedata
from pathlib import Path
from typing import Any

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageStat
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
PDF_DIR = ROOT / "output" / "pdf"
RENDER_ROOT = ROOT / "tmp" / "pdfs"
REPORT_PATH = PDF_DIR / "FUSHI_Rulebook_QA_Alpha84.json"
VOLUMES = {
    "player": PDF_DIR / "FUSHI_Livro_do_Jogador_Alpha84.pdf",
    "master": PDF_DIR / "FUSHI_Livro_do_Mestre_Alpha84.pdf",
}
FORBIDDEN_PLAYER_TERMS = (
    "reencarnação",
    "transposição de consciência",
    "progressão oculta",
    "disputa de posse",
    "esporos de fushi",
)


def normalized(value: str) -> str:
    return "".join(
        char
        for char in unicodedata.normalize("NFD", value.casefold())
        if unicodedata.category(char) != "Mn"
    )


def find_pdftoppm() -> Path:
    bundled = (
        Path.home()
        / ".cache"
        / "codex-runtimes"
        / "codex-primary-runtime"
        / "dependencies"
        / "native"
        / "poppler"
        / "Library"
        / "bin"
        / "pdftoppm.exe"
    )
    if bundled.exists():
        return bundled
    command = shutil.which("pdftoppm")
    if command:
        return Path(command)
    raise FileNotFoundError("pdftoppm não encontrado no PATH nem no runtime local.")


def page_files(directory: Path) -> list[Path]:
    def page_number(path: Path) -> int:
        try:
            return int(path.stem.rsplit("-", 1)[-1])
        except ValueError:
            return 0

    return sorted(directory.glob("page-*.png"), key=page_number)


def ensure_render(pdf: Path, directory: Path, expected_pages: int) -> list[Path]:
    directory.mkdir(parents=True, exist_ok=True)
    existing = page_files(directory)
    pdf_mtime = pdf.stat().st_mtime
    renders_are_current = existing and min(path.stat().st_mtime for path in existing) >= pdf_mtime
    if len(existing) == expected_pages and renders_are_current:
        return existing
    for path in existing:
        path.unlink()
    subprocess.run(
        [str(find_pdftoppm()), "-png", "-r", "150", str(pdf), str(directory / "page")],
        check=True,
    )
    rendered = page_files(directory)
    if len(rendered) != expected_pages:
        raise RuntimeError(
            f"Render incompleto para {pdf.name}: esperado {expected_pages}, obtido {len(rendered)}."
        )
    return rendered


def audit_render(path: Path, page_number: int) -> dict[str, Any]:
    with Image.open(path) as source:
        image = source.convert("RGB")
        gray = image.convert("L")
        stats = ImageStat.Stat(gray)
        width, height = image.size
        corner = image.getpixel((0, 0))
        corner_luma = sum(corner) / 3
        background = Image.new("RGB", image.size, corner)
        difference = ImageChops.difference(image, background).convert("L")
        mask = difference.point(lambda value: 255 if value > 12 else 0)
        bbox = mask.getbbox()
        body_page = corner_luma > 180
        edge_touch = False
        if body_page and bbox:
            left, top, right, bottom = bbox
            edge_touch = left <= 2 or top <= 2 or right >= width - 2 or bottom >= height - 2
        return {
            "page": page_number,
            "size": [width, height],
            "luma_mean": round(stats.mean[0], 2),
            "luma_stddev": round(stats.stddev[0], 2),
            "body_page": body_page,
            "edge_touch": edge_touch,
        }


def contact_sheets(files: list[Path], directory: Path, prefix: str) -> list[Path]:
    output_dir = directory / "contacts"
    output_dir.mkdir(parents=True, exist_ok=True)
    font_path = Path(os.environ.get("WINDIR", "C:/Windows")) / "Fonts" / "arialbd.ttf"
    font = ImageFont.truetype(str(font_path), 18)
    columns = 4
    rows = 4
    thumb_width = 260
    label_height = 30
    padding = 14
    paths: list[Path] = []
    chunk_size = columns * rows
    for chunk_index in range(0, len(files), chunk_size):
        chunk = files[chunk_index : chunk_index + chunk_size]
        with Image.open(chunk[0]) as sample:
            ratio = thumb_width / sample.width
            thumb_height = round(sample.height * ratio)
        sheet_width = columns * (thumb_width + padding) + padding
        sheet_height = rows * (thumb_height + label_height + padding) + padding
        sheet = Image.new("RGB", (sheet_width, sheet_height), (28, 37, 47))
        draw = ImageDraw.Draw(sheet)
        for index, path in enumerate(chunk):
            with Image.open(path) as source:
                thumb = source.convert("RGB")
                thumb.thumbnail((thumb_width, thumb_height), Image.Resampling.LANCZOS)
            row, column = divmod(index, columns)
            x = padding + column * (thumb_width + padding)
            y = padding + row * (thumb_height + label_height + padding)
            sheet.paste(thumb, (x, y))
            page = chunk_index + index + 1
            draw.rectangle((x, y + thumb_height, x + thumb_width, y + thumb_height + label_height), fill=(10, 18, 27))
            draw.text((x + 8, y + thumb_height + 5), f"Página {page}", font=font, fill=(108, 220, 244))
        output = output_dir / f"{prefix}-{chunk_index // chunk_size + 1:02d}.jpg"
        sheet.save(output, "JPEG", quality=88, optimize=True)
        paths.append(output)
    return paths


def audit_volume(name: str, pdf: Path) -> dict[str, Any]:
    if not pdf.exists():
        raise FileNotFoundError(pdf)
    reader = PdfReader(str(pdf))
    texts = [(page.extract_text() or "") for page in reader.pages]
    renders = ensure_render(pdf, RENDER_ROOT / name, len(reader.pages))
    visual = [audit_render(path, index) for index, path in enumerate(renders, start=1)]
    sizes = sorted({tuple(page["size"]) for page in visual})
    blank_like = [index for index, text in enumerate(texts, start=1) if len(text.strip()) < 20]
    low_variance = [page["page"] for page in visual if page["luma_stddev"] < 2.0]
    edge_touch = [page["page"] for page in visual if page["edge_touch"]]
    all_text = "\n".join(texts)
    raw_editorial_labels = [
        label for label in ("DEVELOPMENT", "CONSTRUCTION") if label in all_text
    ]
    player_leaks = []
    if name == "player":
        searchable = normalized(all_text)
        player_leaks = [term for term in FORBIDDEN_PLAYER_TERMS if normalized(term) in searchable]
    sheets = contact_sheets(renders, RENDER_ROOT / name, name)
    metadata = reader.metadata or {}
    return {
        "pdf": str(pdf),
        "size_mib": round(pdf.stat().st_size / 1024 / 1024, 2),
        "pages": len(reader.pages),
        "characters_extracted": sum(len(text) for text in texts),
        "metadata_title": metadata.get("/Title"),
        "render_sizes": [list(size) for size in sizes],
        "blank_like_pages": blank_like,
        "low_variance_pages": low_variance,
        "body_edge_touch_pages": edge_touch,
        "player_secret_terms": player_leaks,
        "raw_editorial_labels": raw_editorial_labels,
        "contact_sheets": [str(path) for path in sheets],
        "passed": (
            not blank_like
            and not low_variance
            and not edge_touch
            and not player_leaks
            and not raw_editorial_labels
            and bool(metadata.get("/Title"))
        ),
    }


def main() -> int:
    PDF_DIR.mkdir(parents=True, exist_ok=True)
    report = {name: audit_volume(name, path) for name, path in VOLUMES.items()}
    report["passed"] = all(volume["passed"] for volume in report.values())
    REPORT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    for name in ("player", "master"):
        volume = report[name]
        print(
            f"{name}: pages={volume['pages']} blanks={volume['blank_like_pages']} "
            f"edges={volume['body_edge_touch_pages']} leaks={volume['player_secret_terms']} "
            f"labels={volume['raw_editorial_labels']} "
            f"title={volume['metadata_title']!r}"
        )
    print(f"QA {'OK' if report['passed'] else 'FALHOU'}: {REPORT_PATH}")
    return 0 if report["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
