// Minimal BibTeX reader for _bibliography/papers.bib.
// The file is written by bin/update_publications.py from doi.org (Crossref/DataCite BibTeX),
// plus hand-added fields (abbr, selected, preview, pdf). Existing entries are never rewritten
// by the script, so this parser only needs the well-formed subset that those sources produce.
import fs from 'node:fs';
import path from 'node:path';

export interface Pub {
  key: string;
  type: string;
  title: string;
  authors: string[];
  year: number;
  venue: string;
  doi?: string;
  url?: string;
  abbr?: string;
  selected: boolean;
  preview?: string;
  pdf?: string;
  volume?: string;
  pages?: string;
  bibtex: string;
}

const LATEX: Record<string, string> = {
  '\\"a': 'ä', '\\"o': 'ö', '\\"u': 'ü', '\\"A': 'Ä', '\\"O': 'Ö', '\\"U': 'Ü',
  "\\'a": 'á', "\\'e": 'é', "\\'i": 'í', "\\'o": 'ó', "\\'u": 'ú', '\\c{c}': 'ç', '\\c{s}': 'ş',
  '\\u{g}': 'ğ', '\\.I': 'İ', '\\i': 'ı', '\\&': '&', '\\%': '%', '\\_': '_', '--': '–',
};

function clean(value: string): string {
  let v = value;
  for (const [k, r] of Object.entries(LATEX)) v = v.split(k).join(r);
  return v
    .replace(/\\textendash\b\s*/g, '–')
    .replace(/\\[a-zA-Z]+\s*/g, '')
    .replace(/[{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Read a balanced {...} or "..." value starting at index i (pointing at the opener). */
function readValue(s: string, i: number): [string, number] {
  if (s[i] === '{') {
    let depth = 0;
    for (let j = i; j < s.length; j++) {
      if (s[j] === '{') depth++;
      else if (s[j] === '}' && --depth === 0) return [s.slice(i + 1, j), j + 1];
    }
    throw new Error('unbalanced braces in papers.bib');
  }
  if (s[i] === '"') {
    const j = s.indexOf('"', i + 1);
    return [s.slice(i + 1, j), j + 1];
  }
  const m = /^[^,}\s]+/.exec(s.slice(i));
  return [m ? m[0] : '', i + (m ? m[0].length : 0)];
}

function parseEntries(text: string) {
  const out: { type: string; key: string; fields: Record<string, string>; raw: string }[] = [];
  const re = /@(\w+)\s*\{\s*([^,\s]+)\s*,/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const start = m.index;
    const fields: Record<string, string> = {};
    let i = re.lastIndex;
    for (;;) {
      while (/[\s,]/.test(text[i] ?? '')) i++;
      if (text[i] === '}' || i >= text.length) break;
      const nm = /^([A-Za-z_-]+)\s*=\s*/.exec(text.slice(i));
      if (!nm) break;
      i += nm[0].length;
      const [val, next] = readValue(text, i);
      fields[nm[1].toLowerCase()] = val;
      i = next;
    }
    re.lastIndex = i + 1;
    out.push({ type: m[1].toLowerCase(), key: m[2], fields, raw: text.slice(start, i + 1) });
  }
  return out;
}

function authorName(a: string): string {
  const s = clean(a);
  if (s.includes(',')) {
    const [last, first] = s.split(',').map((x) => x.trim());
    return `${first} ${last}`.trim();
  }
  return s;
}

/** BibTeX shown to visitors: drop site-only fields. */
function publicBibtex(raw: string): string {
  return raw
    .split('\n')
    .filter((l) => !/^\s*(abbr|selected|preview|pdf|bibtex_show)\s*=/.test(l))
    .join('\n')
    .replace(/,\s*\n\}$/, '\n}');
}

let cache: Pub[] | null = null;

export function publications(): Pub[] {
  if (cache) return cache;
  const text = fs.readFileSync(path.resolve(process.env.SITE_ROOT ?? '.', '_bibliography/papers.bib'), 'utf8');
  cache = parseEntries(text)
    .map(({ type, key, fields: f, raw }) => {
      const doi = f.doi ? f.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '') : undefined;
      return {
        key,
        type,
        title: clean(f.title ?? ''),
        authors: (f.author ?? '').split(/\s+and\s+/).filter(Boolean).map(authorName),
        year: Number(f.year) || 0,
        venue: clean(f.journal ?? f.booktitle ?? f.publisher ?? ''),
        doi,
        url: f.url ? clean(f.url) : doi ? `https://doi.org/${doi}` : undefined,
        abbr: f.abbr ? clean(f.abbr) : undefined,
        selected: /true/i.test(f.selected ?? ''),
        preview: f.preview ? clean(f.preview) : undefined,
        pdf: f.pdf ? clean(f.pdf) : undefined,
        volume: f.volume,
        pages: f.pages ? clean(f.pages) : undefined,
        bibtex: publicBibtex(raw),
      } satisfies Pub;
    })
    .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
  return cache;
}

export function isOwnName(name: string): boolean {
  return /setiadhi/i.test(name);
}
