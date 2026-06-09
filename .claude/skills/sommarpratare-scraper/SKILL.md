---
name: sommarpratare-scraper
description: >-
  Collect the year's "Sommar i P1" summer hosts (sommarpratare) — broadcast
  date, name, and a short "known for" line — and save them as Markdown content
  for sommarpratet. Use when the user asks to scrape, collect, fetch, update, or
  refresh the sommarpratare list, or to add summer hosts to the site. Triggers:
  "scrape sommarpratare", "update the list", "fetch summer hosts", "add this
  year's sommarpratare", "refresh sommarpratet".
allowed-tools: WebFetch, WebSearch, Read, Write, Glob, Bash
---

# Sommarpratare Scraper

Fetch the year's Sommar i P1 line-up and write each host as a validated,
frontmatter-only Markdown file into `src/content/sommarpratare/`. A deterministic
helper (`scripts/add-sommarpratare.mjs`) handles slugging, frontmatter
formatting, date normalisation, and deduplication — your job is to **fetch and
extract structured data**, then hand it to the script.

## Target project

```
/Users/urbansanden/projects/Current/sommarpratet/src/content/sommarpratare/
```

This is the helper script's default `--content-dir`. Override with
`--content-dir <path>` if the project lives elsewhere.

## Sources

| # | Source | URL | Notes |
|---|--------|-----|-------|
| 1 | Sveriges Radio (official) | https://www.sverigesradio.se/artikel/sommarpratare-<year>-hela-listan | Canonical list + dates. Often returns **HTTP 403** to plain fetches — fall back to WebSearch + the mirrors below. |
| 2 | Expressen | https://www.expressen.se/noje/arets-sommarpratare-<year>--hela-listan-/ | The list the site was first built from. **Blocked for WebFetch** — use as a human-verifiable reference only. |
| 3 | Nyheter24 | https://nyheter24.se/noje/kultur/...arets-sommarpratare-<year>-lista-med-datum... | Usually fetchable; carries the full dated list. Good primary fetch target. |
| 4 | SVT / GP | svt.se, gp.se | Announcement coverage; useful to cross-check names and roles. |

Sommar i P1 runs daily from midsummer (≈ 20 June) to mid-August (≈ 16 August),
so a full season is ~58 hosts, one per day.

## Workflow

### 1. Fetch the list

Use **WebFetch** against a fetchable mirror (Nyheter24 is reliable; Sveriges
Radio and Expressen frequently 403/block). Prompt for *every* entry:

> "Extract the complete list of Sommar i P1 <year> sommarpratare. For each
> person return the broadcast date, full name, and a short description of who
> they are (profession/role). Return ALL entries — there should be ~58."

If the primary source blocks or returns a partial list, use **WebSearch** for
`sommarpratare <year> hela listan datum` and reconcile across sources. **Never
invent names, dates, or descriptions** — if a host's role is unknown, leave the
description empty rather than guessing.

### 2. Build the JSON array

One object per host. Required: `name`, `date`. Optional: `description`,
`instagram`, `x`, `wikipedia`, `image`.

```json
[
  {
    "name": "Helena Bergström",
    "date": "2026-06-20",
    "description": "Skådespelare"
  }
]
```

Normalisation rules:
- **Date** → `YYYY-MM-DD`. Swedish months: jan, feb, mar(s), apr, maj, jun(i),
  jul(i), aug, sep, okt, nov, dec. The season is the current/next summer.
- **Description** → a short Swedish "known for" line (e.g. `Skådespelare`,
  `Författare`, `Komiker`). Translate role labels to Swedish for UI consistency.
- **instagram / x / wikipedia** → only set these if you have a *verified* canonical
  profile/article URL. Otherwise omit them — the site auto-generates search links
  from the name (see `src/lib/links.ts`), so leaving them blank is the safe default.

### 3. Write the Markdown files

Save the array to a temp file, then pipe it to the helper. Run from the repo root:

```bash
node .claude/skills/sommarpratare-scraper/scripts/add-sommarpratare.mjs --file /tmp/hosts.json
```

The script defaults to this repo's `src/content/sommarpratare/`. Other flags:
- `--dry-run` — preview without writing.
- `--update` — overwrite existing matching files (use when refreshing roles/links).
- `--content-dir <path>` — target a different location.
- stdin: `echo '[...]' | node .../add-sommarpratare.mjs`

It prints a JSON summary (`created`, `updated`, `skipped`, `errors`) to stdout
and a one-line tally to stderr.

### 4. Deduplication (automatic)

A host is skipped when a file with the same **name + date** already exists — the
script scans existing frontmatter, so duplicates are caught even if filenames
differ. Pass `--update` to refresh instead of skip.

### 5. Verify

```bash
cd /Users/urbansanden/projects/Current/sommarpratet && npm run build
```

## Schema reference

Files validate against `src/content.config.ts`:

| Field | Type | Required |
|-------|------|----------|
| name | string | ✅ |
| date | date (YYYY-MM-DD) | ✅ |
| description | string | optional |
| instagram | url | optional |
| instagramFollowers | number | optional |
| x | url | optional |
| wikipedia | url | optional |
| image | string | optional |

> ⚠️ `instagram`, `x`, and `wikipedia` are validated as URLs. Omit them rather
> than passing a non-URL placeholder, or the build will fail.

## Filename convention

`{date}-{name-slug}.md` — generated automatically (lowercase, Swedish characters
transliterated: å/ä→a, ö→o, é→e). Example: `2026-06-20-helena-bergstrom.md`.
Date-first so files sort chronologically on disk.

## Recommended cadence

Once per year, when the line-up is announced (early June). Re-running is safe —
existing hosts are skipped automatically; use `--update` to refresh descriptions.
