#!/usr/bin/env python3
"""Build the downloadable CV PDF from the same data the /cv/ page uses.

Inputs (all in this repository):
  _data/cv.yml              CV content in RenderCV format, plus a PDF-only `profile` paragraph
  _data/contact.yml         public email address (kept out of cv.yml so the web page never prints it)
  _bibliography/papers.bib  publication list, kept current by bin/update_publications.py

Output:
  assets/pdf/David_Setiadhi_CV.pdf

Requires: pip install "rendercv[full]" pyyaml
Usage:    python bin/build_cv.py
"""

from __future__ import annotations

import re
import subprocess
import sys
import tempfile
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
CV = ROOT / "_data" / "cv.yml"
CONTACT = ROOT / "_data" / "contact.yml"
BIB = ROOT / "_bibliography" / "papers.bib"
OUT = ROOT / "public" / "assets" / "pdf" / "David_Setiadhi_CV.pdf"

MONTHS = {m: i for i, m in enumerate("jan feb mar apr may jun jul aug sep oct nov dec".split(), start=1)}
JOURNAL_TYPES = {"article"}

DESIGN = {
    "theme": "classic",
    "colors": {
        "name": "rgb(15, 118, 110)",
        "connections": "rgb(15, 118, 110)",
        "section_titles": "rgb(15, 118, 110)",
        "links": "rgb(15, 118, 110)",
    },
    "page": {"size": "a4", "show_footer": False, "show_top_note": False},
}


def parse_bib(text: str) -> list[dict]:
    """Minimal BibTeX reader for this repository's papers.bib (one field per line)."""
    entries = []
    for block in re.split(r"\n(?=@)", text):
        head = re.match(r"@(\w+)\s*\{\s*([^,\s]+)\s*,", block)
        if not head:
            continue
        entry = {"_type": head.group(1).lower(), "_key": head.group(2)}
        for name, value in re.findall(r"^\s*(\w+)\s*=\s*\{(.*)\},?\s*$", block, flags=re.M):
            entry[name.lower()] = value.replace("{", "").replace("}", "").strip()
        for name, value in re.findall(r"^\s*(\w+)\s*=\s*([A-Za-z0-9]+),?\s*$", block, flags=re.M):
            entry.setdefault(name.lower(), value)
        entries.append(entry)
    return entries


def person(name: str) -> str:
    """'Last, First' -> 'First Last'."""
    if "," in name:
        last, first = [p.strip() for p in name.split(",", 1)]
        return f"{first} {last}".strip()
    return name.strip()


def publication(entry: dict) -> dict:
    pub = {
        "title": entry.get("title", ""),
        "authors": [person(a) for a in entry.get("author", "").split(" and ") if a.strip()],
    }
    venue = entry.get("journal") or entry.get("booktitle") or entry.get("institution")
    if venue:
        pub["journal"] = venue
    year = entry.get("year", "")
    month = MONTHS.get(entry.get("month", "")[:3].lower())
    if year:
        pub["date"] = f"{year}-{month:02d}" if month else year
    if entry.get("doi") and "annotation" not in entry:
        pub["doi"] = entry["doi"]
    return pub


def main() -> int:
    data = yaml.safe_load(CV.read_text(encoding="utf-8"))
    contact = yaml.safe_load(CONTACT.read_text(encoding="utf-8")) if CONTACT.exists() else {}
    profile = data.pop("profile", None)
    cv = data["cv"]
    if contact.get("email"):
        cv["email"] = contact["email"]

    entries = parse_bib(BIB.read_text(encoding="utf-8"))
    entries.sort(key=lambda e: e.get("year", "0"), reverse=True)
    journals = [publication(e) for e in entries if e["_type"] in JOURNAL_TYPES]
    others = [publication(e) for e in entries if e["_type"] not in JOURNAL_TYPES]

    sections = {}
    if profile:
        sections["Profile"] = [profile]
    for name, value in cv.get("sections", {}).items():
        sections[name] = value
        if name == "Experience":  # publications follow experience in the PDF
            if journals:
                sections["Journal articles"] = journals
            if others:
                sections["Conference papers and reports"] = others
    cv["sections"] = sections

    # RenderCV reads a bare "2018" string as January 2018; a year-only date must be an int.
    for entries_ in sections.values():
        for item in entries_:
            if isinstance(item, dict):
                for field in ("start_date", "end_date", "date"):
                    if re.fullmatch(r"\d{4}", str(item.get(field, ""))):
                        item[field] = int(item[field])

    data["design"] = DESIGN
    data["settings"] = {"bold_keywords": [cv["name"]]}

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        src = Path(tmp) / "cv.yaml"
        src.write_text(yaml.safe_dump(data, allow_unicode=True, sort_keys=False), encoding="utf-8")
        cmd = [
            sys.executable, "-m", "rendercv", "render", str(src),
            "--pdf-path", str(OUT),
            "--typst-path", str(Path(tmp) / "cv.typ"),
            "--dont-generate-markdown", "--dont-generate-html", "--dont-generate-png",
        ]
        result = subprocess.run(cmd)
    if result.returncode != 0 or not OUT.exists():
        print("RenderCV failed", file=sys.stderr)
        return 1
    print(f"wrote {OUT.relative_to(ROOT)} ({OUT.stat().st_size // 1024} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
