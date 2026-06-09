# Sommarpratet

A small [Astro](https://astro.build) site that lists the year's **Sommar i P1**
summer hosts (*sommarpratare*) in one searchable, sortable table.

Each row shows a circular avatar, the broadcast date, the name, a short "known
for" line, and quick links — Instagram, X, Google Trends, Wikipedia, Expressen,
Aftonbladet — plus an **add-to-calendar** button (Google Calendar + `.ics`).

- 🔎 Quick search (name + description)
- ↕️ Sort by date or name
- 🗓️ Filter by month
- 📅 Add any broadcast to your calendar
- 🌗 Light/dark theme · self-hosted **Inter** font

## Develop

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static site → dist/
npm run preview
```

## Data

One Markdown file per host in `src/content/sommarpratare/`
(`{date}-{name-slug}.md`), validated by `src/content.config.ts`:

```markdown
---
name: "Helena Bergström"
date: 2026-06-20
description: "Skådespelare"
---
```

Optional: `instagram`, `x`, `wikipedia` (explicit URLs that override the
auto-generated search links) and `image` (portrait; otherwise an initials
avatar is shown).

## Updating the list

A project-local Claude skill, **`sommarpratare-scraper`**
(`.claude/skills/sommarpratare-scraper/`), fetches the year's line-up and writes
the content files. Ask Claude to "update the sommarpratare list", or run the
helper directly:

```bash
node .claude/skills/sommarpratare-scraper/scripts/add-sommarpratare.mjs --file /tmp/hosts.json
```

Deduplicates by name + date; `--update` refreshes, `--dry-run` previews.

## Sources

- [Expressen – Sommarpratet](https://www.expressen.se/noje/arets-sommarpratare-2026--hela-listan-/)
- [Sveriges Radio – Sommar i P1](https://sverigesradio.se/sommarprat)

See [CLAUDE.md](CLAUDE.md) for architecture and conventions.
