# Sommarpratet – Claude Project Context

## Project Overview

Sommarpratet is an Astro site that presents the year's **Sommar i P1** summer
hosts (*sommarpratare*) as a single searchable, sortable, filterable table. Each
row shows a circular avatar, the broadcast date, the host's name, a short "known
for" description, and a cluster of quick links (Instagram, X, Google Trends,
Wikipedia, Expressen, Aftonbladet) plus an **add-to-calendar** control.

Data was originally sourced from Expressen's "Sommarpratet – hela listan";
the canonical line-up lives at Sveriges Radio. There is one Markdown file per
host in a content collection.

## Tech Stack

- **Framework**: Astro 6.x (Content Layer API, glob loader)
- **TypeScript**: strict mode
- **Content**: frontmatter-only Markdown files in `src/content/sommarpratare/`
- **Styling**: CSS Modules (`*.module.css`) + global design tokens in `src/styles/global.css`
- **Font**: self-hosted **Inter** (woff2 in `public/fonts/`)
- **SEO**: `@astrojs/sitemap`; JSON-LD (`WebSite` + `ItemList`/`Person`)
- **No UI framework / no islands** — interactivity is one small vanilla-TS `<script>` per component
- **Node**: v22.x

## Project Structure

```
sommarpratet/
├── src/
│   ├── components/
│   │   ├── SommarTable.astro        # The table: search + month filter + sortable columns (vanilla TS)
│   │   ├── SommarTable.module.css
│   │   ├── AddToCalendar.astro      # Google Calendar link + build-time .ics data URI (adapted from jazzkonserter)
│   │   ├── AddToCalendar.module.css
│   │   ├── Avatar.astro             # Circular initials avatar (or image), deterministic colour
│   │   └── Avatar.module.css
│   ├── content/
│   │   └── sommarpratare/           # One *.md per host ({date}-{name-slug}.md)
│   ├── content.config.ts            # Collection schema + glob loader
│   ├── layouts/
│   │   ├── Layout.astro             # <head>, theme (light/dark) toggle, footer, JSON-LD
│   │   └── Layout.module.css
│   ├── lib/
│   │   ├── sommarpratare.ts         # getHosts() + Swedish date formatting helpers
│   │   ├── links.ts                 # External link builders (search deep-links)
│   │   └── avatar.ts                # Initials + deterministic colour + contrast text colour
│   ├── pages/
│   │   ├── index.astro              # Hero + the table
│   │   └── index.module.css
│   └── styles/
│       └── global.css               # Design tokens, font-face, reset, dark theme
├── public/
│   ├── fonts/                       # Inter-Regular.woff2, Inter-Bold.woff2
│   └── favicon.svg
├── .claude/skills/sommarpratare-scraper/   # Skill that (re)builds the data — see below
└── astro.config.mjs
```

## Data Schema

Each host is a frontmatter-only `.md` file validated against
`src/content.config.ts`:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| name | string | ✅ | Full name as broadcast |
| date | date (YYYY-MM-DD) | ✅ | Broadcast date in Sommar i P1 |
| description | string | optional | Short Swedish "known for" line |
| instagram | url | optional | Explicit profile; otherwise a search link is generated |
| instagramFollowers | number | optional | Approximate follower count (mid-2026 snapshot); shown in the "Följare" column |
| x | url | optional | Explicit profile; otherwise a search link is generated |
| wikipedia | url | optional | Explicit article; otherwise a search link is generated |
| image | string | optional | Portrait; otherwise an initials avatar is shown |

> ⚠️ `instagram`, `x`, `wikipedia` are validated as **URLs**. Omit them rather
> than passing a non-URL placeholder, or the build fails.

**Filename**: `{date}-{name-slug}.md` (date-first so files sort chronologically;
Swedish characters transliterated å/ä→a, ö→o, é→e). E.g.
`2026-06-20-helena-bergstrom.md`.

## The Links

Most external links are **search deep-links** built from the name in
`src/lib/links.ts` — there is no canonical per-person profile URL in the source:

- **Instagram** → the host's official profile when known (44 of 58 set explicitly in frontmatter); the rest fall back to a Google search (`<name> instagram`).
- **X** → `x.com/search?q=<name>`
- **Google Trends** → `trends.google.com` scoped to Sweden (`geo=SE`)
- **Wikipedia** → Swedish Wikipedia "go" endpoint (jumps to the article on an exact title match, else search results)
- **Sveriges Radio** → the host's Sommar i P1 episode page (explicit per host in `sr`); falls back to an SR site search

To pin an exact profile/article, set `instagram` / `x` / `wikipedia` in the
host's frontmatter — the explicit URL overrides the generated search link.

## Add to Calendar

`AddToCalendar.astro` (adapted from jazzkonserter) is JS-free for the export
itself: a Google Calendar `TEMPLATE` link plus a build-time `.ics` data-URI
download (works with Apple Calendar, Outlook, any iCal app). The event is
modelled as **13:00–14:30 Europe/Stockholm** (the P1 broadcast slot), titled
`Sommar i P1: <name>`, located at `Sveriges Radio P1`. A single global script
closes the dropdown on outside-click.

## Updating the Data — the `sommarpratare-scraper` skill

A project-local Claude skill regenerates the content collection:
`.claude/skills/sommarpratare-scraper/`.

**To refresh the list**, say things like: "scrape this year's sommarpratare",
"update the list", "fetch the summer hosts". The skill:

1. Fetches the line-up (Sveriges Radio is canonical; Expressen is **blocked for
   WebFetch** and Sveriges Radio often **403s** — Nyheter24 is the reliable
   fetch target; cross-check with WebSearch).
2. Builds a JSON array (`name`, `date`, optional `description`/links).
3. Pipes it to the helper, which slugs, formats, validates, and **dedups by
   name + date**:

```bash
node .claude/skills/sommarpratare-scraper/scripts/add-sommarpratare.mjs --file /tmp/hosts.json
# flags: --dry-run | --update | --content-dir <path> | stdin
```

**Never fabricate** names, dates, or descriptions — leave a description empty if
the role is unknown. Descriptions are short Swedish role labels for UI
consistency.

## Development Commands

```bash
npm install
npm run dev        # http://localhost:4321
npm run build      # static output → dist/
npm run preview
npx astro check    # type-check
```

## Conventions

- **Language**: Swedish UI and content. Date formatting via the helpers in
  `lib/sommarpratare.ts` (formatted from the date's **UTC parts** so the day
  never drifts by timezone — frontmatter dates are UTC midnight).
- **Components**: PascalCase `.astro` + sibling `*.module.css`. Pages kebab-case.
- **Interactivity**: vanilla TS in a component `<script>`; state lives in
  `data-*` attributes on rows. No frameworks, no islands.
- **External links**: always `target="_blank" rel="noopener"`.
- **Avatars**: the official Sommar i P1 press portraits are downloaded into
  `public/avatars/<slug>.webp` and referenced via each host's `image` field; an
  initials + deterministic-colour avatar (`lib/avatar.ts`) remains the fallback
  when a photo is missing. The portraits are editorial press photos
  (credit: Sveriges Radio / Expressen) — fine for a fan/reference page, but
  verify rights before any commercial use.
- **Categories**: derived at render from the description by a keyword matcher
  (`lib/category.ts`) and used for the category filter. Not stored in frontmatter
  (edit a description → it re-categorises).
- **Theme**: follows the OS via `@media (prefers-color-scheme)` by default; the
  footer toggle sets an explicit `data-theme` on `<html>` (saved to
  localStorage) that overrides it. `[data-theme='light']` opts back out of the
  dark media query. Every component reads the same CSS variables.

## Notes / Future

- The table is a single page (58 rows) — no pagination needed. If the list grows
  a lot, add pagination to `SommarTable.astro` (see jazzkonserter's
  ConcertBrowser for the pattern).
- `image` portraits, an RSS feed, and per-host detail pages are easy adds if
  wanted.

---

*Sibling project / pattern source: `../jazzkonserter` (same calendar component,
content-collection + scraper-skill conventions).*
