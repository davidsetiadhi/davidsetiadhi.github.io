#!/usr/bin/env python3
"""Keep the publication list and research metrics in sync with ORCID and OpenAlex.

What it does, in order:
  1. Collects every DOI listed on the ORCID record and on the matching OpenAlex author.
  2. For each DOI not yet in _bibliography/papers.bib, downloads its BibTeX from doi.org
     (Crossref/DataCite content negotiation) and appends it. Existing entries are never
     modified, so hand edits (abbr, preview, selected, pdf, ...) are safe.
  3. Writes a short news item for every newly added paper (skip with --no-news).
  4. Refreshes _data/metrics.yml (works, citations, h-index, i10-index) from OpenAlex.

Only the Python standard library is used. No API key is needed.

Usage:
  python bin/update_publications.py            # normal weekly run
  python bin/update_publications.py --seed     # first run: no news, mark 3 most-cited as selected
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sys
import unicodedata
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ORCID = "0000-0002-1765-1294"
ROOT = Path(__file__).resolve().parent.parent
BIB = ROOT / "_bibliography" / "papers.bib"
NEWS = ROOT / "_news"
METRICS = ROOT / "_data" / "metrics.yml"
UA = "davidsetiadhi.github.io publication updater (+https://davidsetiadhi.github.io)"
STOPWORDS = {"a", "an", "the", "of", "on", "in", "for", "and", "to", "with", "by", "at", "from"}


def fetch(url: str, accept: str = "application/json") -> str:
    req = urllib.request.Request(url, headers={"Accept": accept, "User-Agent": UA})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode("utf-8")


def norm_doi(doi: str) -> str:
    doi = doi.strip().lower()
    return re.sub(r"^(https?://(dx\.)?doi\.org/|doi:)", "", doi)


def orcid_dois() -> set[str]:
    data = json.loads(fetch(f"https://pub.orcid.org/v3.0/{ORCID}/works"))
    dois = set()
    for group in data.get("group", []):
        for ext in group.get("external-ids", {}).get("external-id", []):
            if ext.get("external-id-type") == "doi" and ext.get("external-id-value"):
                dois.add(norm_doi(ext["external-id-value"]))
    return dois


def openalex_author() -> dict:
    return json.loads(fetch(f"https://api.openalex.org/authors/orcid:{ORCID}"))


def openalex_works(author_id: str) -> dict[str, dict]:
    """Map DOI -> OpenAlex work (for citation counts and open-access PDF links)."""
    short = author_id.rsplit("/", 1)[-1]
    url = f"https://api.openalex.org/works?filter=author.id:{short}&per-page=200"
    works = {}
    for w in json.loads(fetch(url)).get("results", []):
        if w.get("doi"):
            works[norm_doi(w["doi"])] = w
    return works


def existing_dois(bib_text: str) -> set[str]:
    return {norm_doi(m) for m in re.findall(r"^\s*doi\s*=\s*[{\"]([^}\"]+)[}\"]", bib_text, flags=re.M | re.I)}


def existing_keys(bib_text: str) -> set[str]:
    return set(re.findall(r"^@\w+\s*\{\s*([^,\s]+)\s*,", bib_text, flags=re.M))


def ascii_slug(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]", "", text.lower())


def make_key(bibtex: str, taken: set[str]) -> str:
    author = re.search(r"author\s*=\s*\{([^}]*)", bibtex, flags=re.I)
    year = re.search(r"year\s*=\s*\{?(\d{4})", bibtex, flags=re.I)
    title = re.search(r"title\s*=\s*\{(.*?)\},?\s*\n?\s*\w+\s*=", bibtex, flags=re.I | re.S)
    last = ascii_slug(author.group(1).split(" and ")[0].split(",")[0]) if author else "anon"
    word = ""
    if title:
        for w in re.findall(r"[A-Za-z]+", title.group(1)):
            if w.lower() not in STOPWORDS:
                word = ascii_slug(w)
                break
    base = f"{last}{year.group(1) if year else ''}{word}" or "entry"
    key, n = base, 2
    while key in taken:
        key, n = f"{base}{n}", n + 1
    return key


def field(bibtex: str, name: str) -> str:
    m = re.search(rf"\b{name}\s*=\s*\{{(.*?)\}}\s*,?\s*(\n|$)", bibtex, flags=re.I | re.S)
    return re.sub(r"\s+", " ", m.group(1)).strip() if m else ""


def tidy(bibtex: str, key: str, extra: dict[str, str]) -> str:
    """Rename the citation key, put one field per line, and add al-folio display fields."""
    bibtex = bibtex.strip()
    bibtex = re.sub(r"^(@\w+\s*\{)\s*[^,]+,", rf"\g<1>{key},", bibtex, count=1)
    head, body = bibtex.split(",", 1)
    body = body.rstrip().rstrip("}").strip()
    # Crossref returns everything on one line: split on ", name=" boundaries.
    parts = re.split(r",\s*(?=[A-Za-z_]+\s*=)", body)
    lines = [p.strip() for p in parts if p.strip()]
    for name, value in extra.items():
        if value and not any(re.match(rf"{name}\s*=", line, flags=re.I) for line in lines):
            lines.append(f"{name}={{{value}}}")
    return head + ",\n  " + ",\n  ".join(lines) + "\n}\n"


def write_news(key: str, bibtex: str, doi: str, today: dt.date) -> None:
    title = field(bibtex, "title").replace("{", "").replace("}", "")
    venue = field(bibtex, "journal") or field(bibtex, "booktitle") or field(bibtex, "publisher")
    venue_md = f" in *{venue}*" if venue else ""
    path = NEWS / f"paper_{key}.md"
    if path.exists():
        return
    path.write_text(
        "---\n"
        f"layout: post\ndate: {today.isoformat()}\ninline: true\nrelated_posts: false\n"
        "---\n\n"
        f"New paper published{venue_md}: [{title}](https://doi.org/{doi})\n",
        encoding="utf-8",
    )


def write_metrics(author: dict, today: dt.date) -> None:
    stats = author.get("summary_stats") or {}
    METRICS.write_text(
        "# Generated by bin/update_publications.py from OpenAlex. Do not edit by hand.\n"
        f"works: {author.get('works_count', 0)}\n"
        f"citations: {author.get('cited_by_count', 0)}\n"
        f"h_index: {stats.get('h_index', 0)}\n"
        f"i10_index: {stats.get('i10_index', 0)}\n"
        f"openalex_url: {author.get('id', '')}\n"
        f"updated: {today.isoformat()}\n",
        encoding="utf-8",
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("--seed", action="store_true", help="first import: no news items, mark 3 most-cited papers as selected")
    parser.add_argument("--no-news", action="store_true", help="do not create news items for new papers")
    args = parser.parse_args()
    today = dt.date.today()

    author = openalex_author()
    works = openalex_works(author["id"])
    dois = orcid_dois() | set(works)

    bib_text = BIB.read_text(encoding="utf-8") if BIB.exists() else "---\n---\n"
    have = existing_dois(bib_text)
    taken = existing_keys(bib_text)
    new = sorted(dois - have)

    top_cited = set()
    if args.seed:
        ranked = sorted(works.items(), key=lambda kv: kv[1].get("cited_by_count", 0), reverse=True)
        top_cited = {doi for doi, _ in ranked[:3]}

    added = []
    for doi in new:
        try:
            raw = fetch(f"https://doi.org/{urllib.parse.quote(doi, safe='/')}", accept="application/x-bibtex; charset=utf-8")
        except urllib.error.HTTPError as err:
            print(f"skip {doi}: doi.org returned {err.code}", file=sys.stderr)
            continue
        if not raw.lstrip().startswith("@"):
            print(f"skip {doi}: no BibTeX returned", file=sys.stderr)
            continue
        work = works.get(doi, {})
        key = make_key(raw, taken)
        taken.add(key)
        extra = {
            "doi": doi,
            "bibtex_show": "true",
            "pdf": (work.get("best_oa_location") or {}).get("pdf_url") or "",
            "selected": "true" if doi in top_cited else "",
        }
        entry = tidy(raw, key, extra)
        bib_text = bib_text.rstrip() + "\n\n" + entry
        added.append(key)
        if not (args.seed or args.no_news):
            write_news(key, entry, doi, today)

    if added:
        BIB.write_text(bib_text, encoding="utf-8")
    write_metrics(author, today)
    print(f"{len(dois)} DOIs found, {len(added)} added: {', '.join(added) or '-'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
