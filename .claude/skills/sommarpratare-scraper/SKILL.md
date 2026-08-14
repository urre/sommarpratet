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

**Use Sveriges Radio's open API first.** It is canonical, CORS-open, needs no
key, and returns names, dates, roles, episode ids *and* portrait URLs in one
call — far better than scraping any article. `sverigesradio.se` article pages
**403 every fetch** (WebFetch and curl alike); the news mirrors are fallbacks.

```bash
# programid 2071 = "Sommar & Vinter i P1"
curl -s "https://api.sr.se/api/v2/episodes/index?programid=2071\
&fromdate=<year>-06-01&todate=<year>-08-31&format=json&pagination=false"
```

Each episode gives:

| Field | Use |
|-------|-----|
| `title` | the host's name — **normalise NBSPs** (`Petra\xa0Malm`) to plain spaces |
| `description` | `"Komikern om romantik…"` → derive the short role (see below) |
| `publishdateutc` | `/Date(ms)/` → the broadcast date |
| `id` | → `sr: https://sverigesradio.se/play/avsnitt/<id>` (drives the player) |
| `imageurltemplate` | + `?preset=api-default-square` → a 512×512 press portrait |

Filter out the non-host episodes: `Sommarvärdarna <year> presenteras` and any
`Fråga Värden – …` follow-ups. A full season is 58 hosts, one per day from
midsummer (≈ 20 June) to mid-August (≈ 17 August).

| Fallback | URL | Notes |
|----------|-----|-------|
| Nyheter24 | https://nyheter24.se/noje/kultur/…sommarpratare-<year>-lista-med-datum… | Usually fetchable; full dated list. |
| Expressen | https://www.expressen.se/noje/arets-sommarpratare-<year>--hela-listan-/ | **Blocked for WebFetch** — human reference only. |
| SVT / GP | svt.se, gp.se | Cross-check names and roles. |

## Workflow

### 1. Fetch the list

Pull the API range above. If it's unavailable, WebFetch a mirror and prompt for
*every* entry:

> "Extract the complete list of Sommar i P1 <year> sommarpratare. For each
> person return the broadcast date, full name, and a short description of who
> they are (profession/role). Return ALL entries — there should be ~58."

**Never invent names, dates, or descriptions** — if a host's role is unknown,
leave the description empty rather than guessing.

Deriving the role from an SR description: take the leading noun phrase up to
` om `/` som `/` berättar ` and convert definite → indefinite (`Komikern` →
`Komiker`, `Skådespelaren` → `Skådespelare`, `Riksbankschefen` →
`Riksbankschef`). **Review every one by hand** — the transform mangles compounds
(`Förintelseöverlevanden`, `KAJ-medlemmen`) and some descriptions carry no role
at all.

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
| time | string (HH:MM) | optional |
| description | string | optional |
| instagram | url | optional |
| x | url | optional |
| wikipedia | url | optional |
| sr | url | optional |
| image | string | optional |

> ⚠️ `instagram`, `x`, and `wikipedia` are validated as URLs. Omit them rather
> than passing a non-URL placeholder, or the build will fail.

## Filename convention

`<year>/{date}-{name-slug}.md` — generated automatically. One folder per season;
the slug is lowercase with Swedish characters transliterated (å/ä→a, ö→o) and
every other diacritic stripped (é→e, ć→c, š→s). Example:
`2026/2026-06-20-helena-bergstrom.md`.

The season folder is **organisational only** — `src/content.config.ts` sets
`generateId` to strip it, so entry ids stay the bare filename slug. Favourites in
localStorage and calendar UIDs are keyed on those ids, so don't change this.

## Portraits

Optional but expected: download `imageurltemplate + '?preset=api-default-square'`
to `public/avatars/<same-slug>.webp` and set `image: "/avatars/<slug>.webp"`.

```bash
magick in.jpg -resize 512x512^ -gravity center -extent 512x512 -quality 82 out.webp
```

Hosts without a portrait fall back to an initials avatar (`src/lib/avatar.ts`).

## Recommended cadence

Once per year, when the line-up is announced (early June). Re-running is safe —
existing hosts are skipped automatically; use `--update` to refresh descriptions.
