# Sommarpratet – Claude Project Context

## Project Overview

Sommarpratet is an Astro site that presents the **Sommar i P1** summer hosts
(*sommarpratare*) as a single searchable, sortable, filterable table. Each row
shows a circular avatar, the broadcast date and season, the host's name, a short
"known for" description, and a cluster of quick links (Sveriges Radio, Instagram,
share, ChatGPT, Wikipedia) plus an **add-to-calendar** control and — for
episodes that have aired — in-page playback.

It covers **three seasons: 2026, 2025 and 2024** (58 hosts each, 174 total).
This year owns the Kommande/Sänts split; each earlier season sits behind its own
tab. There is one Markdown file per host in a content collection.

Data was originally sourced from Expressen's "Sommarpratet – hela listan"; the
canonical line-up now comes from **Sveriges Radio's open API** (`api.sr.se`,
programid 2071) — see the scraper skill below.

## Tech Stack

- **Framework**: Astro 6.x (Content Layer API, glob loader)
- **TypeScript**: strict mode
- **Content**: frontmatter-only Markdown files in `src/content/sommarpratare/`
- **Styling**: CSS Modules (`*.module.css`) + global design tokens in `src/styles/global.css`
- **Font**: self-hosted **Geist** (variable woff2 in `public/fonts/Geist.woff2`)
- **SEO**: `@astrojs/sitemap`; JSON-LD (`WebSite` + `ItemList`/`Person`)
- **No UI framework / no islands** — interactivity is one small vanilla-TS `<script>` per component
- **Node**: v22.x

## Project Structure

```
sommarpratet/
├── src/
│   ├── components/
│   │   ├── SommarTable.astro        # The table: tabs + search + filters + sortable columns (vanilla TS)
│   │   ├── SommarTable.module.css
│   │   ├── AddToCalendar.astro      # Google Calendar link + build-time .ics data URI (adapted from jazzkonserter)
│   │   ├── AddToCalendar.module.css
│   │   ├── Player.astro             # Sticky podcast player; resolves the mp3 from api.sr.se at play time
│   │   ├── Player.module.css
│   │   ├── Avatar.astro             # Circular initials avatar (or image), deterministic colour
│   │   └── Avatar.module.css
│   ├── content/
│   │   └── sommarpratare/           # One folder per season: 2024/ 2025/ 2026/
│   │       └── 2026/                #   {date}-{name-slug}.md
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
| time | string (HH:MM) | optional | Broadcast start (13:00); shown in the table, used for the .ics + live status |
| description | string | optional | Short Swedish "known for" line |
| instagram | url | optional | Explicit profile; otherwise a search link is generated |
| x | url | optional | Explicit profile; otherwise a search link is generated |
| wikipedia | url | optional | Explicit article; otherwise a search link is generated |
| sr | url | optional | Sveriges Radio episode page (shown as the headphones link) |
| image | string | optional | Portrait; otherwise an initials avatar is shown |

> ⚠️ `instagram`, `x`, `wikipedia` are validated as **URLs**. Omit them rather
> than passing a non-URL placeholder, or the build fails.

**Filename**: `<year>/{date}-{name-slug}.md` — one folder per season, date-first
so files sort chronologically (Swedish characters transliterated å/ä→a, ö→o;
every other diacritic stripped, so `Zećira Mušović` → `zecira-musovic`). E.g.
`2026/2026-06-20-helena-bergstrom.md`.

> The season folder is organisational only. `content.config.ts` passes a
> `generateId` that strips it, so entry ids stay the bare slug
> (`2026-06-20-helena-bergstrom`) — favourites in localStorage and calendar UIDs
> are keyed on those, so moving a file between folders must not change the id.

## The Links

Most external links are **search deep-links** built from the name in
`src/lib/links.ts` — there is no canonical per-person profile URL in the source:

- **Instagram** → the host's official profile when set explicitly in frontmatter (2026 only); the rest fall back to a Google search (`<name> instagram`).
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

1. Fetches the line-up from **Sveriges Radio's open API** — one call returns
   names, dates, roles, episode ids and portraits:
   `api.sr.se/api/v2/episodes/index?programid=2071&fromdate=…&todate=…`.
   (SR's *article* pages 403 every fetch and Expressen is blocked for WebFetch;
   Nyheter24 is the fallback mirror.)
2. Builds a JSON array (`name`, `date`, optional `description`/links).
3. Pipes it to the helper, which slugs, formats, validates, files each host
   under `<year>/`, and **dedups by name + date**:

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
  `public/avatars/<slug>.webp` and referenced via each host's `image` field. The
  initials + deterministic-colour avatar (`lib/avatar.ts`) is rendered *behind
  every photo*, not just when `image` is missing — portraits are `loading="lazy"`
  and a tab switch reveals ~58 rows at once, so without it you get a screenful of
  empty circles that reads as broken images. A photo that 404s is faded to
  `opacity: 0` (not removed) so its box, and the initials under it, keep their
  size. In card view the portrait must be `display: block` — as an inline box the
  descender gap exposes a sliver of the initials layer below it. Note the hover
  preview is a *second* `img[data-avatar-img]` in the same holder, so card-view
  sizing rules target `img:first-of-type`, never the attribute.
  The portraits are editorial press photos
  (credit: Sveriges Radio / Expressen) — fine for a fan/reference page, but
  verify rights before any commercial use.
- **Tabs**: one tablist holds the current season's `Kommande / Sänts / Favoriter`
  plus one tab per earlier season (`2025`, `2024`). Kommande/Sänts count the
  current season only; Favoriter spans every season. Rows carry `data-year` and
  are rendered with `hidden` already applied for the initial tab, so the first
  paint matches what the client computes (no CLS with 174 rows). When the season
  is over and `Kommande` is empty the table opens on `Sänts`.
  The strip scrolls horizontally when it doesn't fit (six tabs never fit a
  phone) — `min-width: 0` on the flex child is what makes `overflow-x` bite, and
  **don't add `scroll-snap`**: proximity snapping springs the strip back to 0 and
  undoes the "reveal the selected tab" scroll.
- **Tabs set the default view; search and filters go global.** As soon as a
  query, month or category is active, results span every season and the count
  reads "N träffar i alla säsonger". Favoriter is the exception — narrowing your
  own saved list shouldn't pull in people you didn't save.
- **URL state**: `?flik=` (`kommande|sants|favoriter|<year>`, omitted for the
  default tab so an untouched page shares as a bare `/`), plus `?sok=`,
  `?kategori=`, `?manad=`. `?ar=<year>` is still read as an alias for `flik`. The
  share button beside the tabs just shares `location.href`, titled after the
  active tab. It lives *outside* the tablist — a non-tab child of
  `role="tablist"` confuses screen readers.
- **Year**: a dedicated `År` column in the table; card view hides that cell
  (an unplaced cell would break `grid-template-areas`) and shows a `.yearLabel`
  pill next to the date instead.
- **Categories**: derived at render from the description by a keyword matcher
  (`lib/category.ts`) and used for the category filter. Not stored in frontmatter
  (edit a description → it re-categorises). The dropdown's counts are facet
  counts — recomputed client-side for the active tab, with empty categories
  disabled. First match wins, so rule order encodes priority; when adding a
  keyword, re-check it doesn't steal rows from a more specific rule.
- **Theme**: light/dark follows the OS via `@media (prefers-color-scheme)` only
  (no manual toggle, no JS). Every component reads the same CSS variables; two
  `theme-color` metas set the browser-chrome colour per scheme.
- **A11y/vitals**: semantic `<table>` with `<caption>` + `scope="col"`, `aria-sort`
  on sortable headers, `aria-label` on icon links (decorative SVGs `aria-hidden`),
  focus-visible tooltips, `prefers-reduced-motion` honoured. Lighthouse 100 a11y/
  best-practices/SEO; CWV all green (sized images → CLS 0, minimal JS).

## Notes / Future

- The table is a single page. All 174 rows ship in the HTML and the active tab
  never shows more than 58, so no pagination is needed. If more seasons are added
  the payload is what to watch — either paginate (see jazzkonserter's
  ConcertBrowser) or split the archive onto its own route.
- **JSON-LD covers the current season only.** The archive seasons are in the
  page but not in the `ItemList` — 174 `Person` nodes would be a big payload for
  little gain. Per-season pages (`/2025`) would fix that properly and give the
  archive real URLs; the `?ar=` deep link is the lightweight stand-in.
- **Instagram follower counts were removed** (all seasons): the field, the column,
  the sort options and the `formatFollowers` helper are all gone. They only ever
  existed for 2026, there is no free reliable source for the archive years, and a
  point-in-time snapshot goes stale on its own. If they ever come back they need a
  real source (Instagram Graph API token or a manual pass) — never estimate them.
- An RSS feed and per-host detail pages are easy adds if wanted.

---

*Sibling project / pattern source: `../jazzkonserter` (same calendar component,
content-collection + scraper-skill conventions).*
