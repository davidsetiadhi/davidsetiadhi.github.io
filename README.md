# Davestia Lab website

Source of the research website of David Setiadhi (Davestia Lab), built with [Astro](https://astro.build) and published to GitHub Pages from the `gh-pages` branch.

## Where things live

| What | Where |
|---|---|
| Projects | `_projects/*.md` → `/projects/<name>/` |
| Blog posts | `_posts/YYYY-MM-DD-name.md` → `/posts/YYYY/name/` |
| News | `_news/*.md` → `/news/` and the home page |
| Talks, Bahasa Indonesia page | `_pages/talks.md`, `_pages/id.md` |
| Engineering tools | `_pages/tools/*.md` + `public/assets/js/tools.js` (figures: `bin/make_tool_figures.py`) |
| Publications | `_bibliography/papers.bib` (read by `src/lib/bib.ts`) |
| Metrics, CV, contact | `_data/metrics.yml`, `_data/cv.yml`, `_data/contact.yml` |
| Images, PDFs | `public/assets/` |
| Logo | `public/brand/` |
| Pages, layout, styles | `src/pages/`, `src/layouts/Base.astro`, `src/styles/global.css` |

## Automation

- `update-publications.yml` (Mondays) runs `bin/update_publications.py`: new DOIs from ORCID and OpenAlex are appended to `papers.bib`, a news item is written, `metrics.yml` is refreshed, and the site is redeployed.
- `deploy.yml` builds the CV PDF with RenderCV (`bin/build_cv.py`), builds the site and publishes `dist/`.

## Local commands

```bash
npm ci
npm run dev       # http://localhost:4321
npm run build     # output in dist/
```

The canonical host is `https://davidsetiadhi.github.io` unless the `SITE_URL` environment variable (a repository variable in CI) is set, for example to `https://davestia.com`.
