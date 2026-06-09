#!/usr/bin/env node
// Deterministic writer for sommarpratare entries. Reads a JSON array of host
// objects and writes one frontmatter-only Markdown file per host into the
// content collection, slugging names, normalising dates, and deduping by
// name + date. Mirrors jazzkonserter's add-concerts.mjs.
//
// Usage:
//   node add-sommarpratare.mjs --file /tmp/hosts.json
//   echo '[...]' | node add-sommarpratare.mjs
//   node add-sommarpratare.mjs --file hosts.json --dry-run
//   node add-sommarpratare.mjs --file hosts.json --update
//   node add-sommarpratare.mjs --file hosts.json --content-dir /path/to/sommarpratare

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
// scripts/ -> skill root -> .claude/skills -> .claude -> project root
const PROJECT_ROOT = resolve(__dirname, '..', '..', '..', '..');
const DEFAULT_CONTENT_DIR = join(PROJECT_ROOT, 'src', 'content', 'sommarpratare');

// ---- args -----------------------------------------------------------------
const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const opt = (name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};
const DRY_RUN = flag('--dry-run');
const UPDATE = flag('--update');
const CONTENT_DIR = opt('--content-dir') ?? DEFAULT_CONTENT_DIR;
const FILE = opt('--file');

// ---- helpers --------------------------------------------------------------
function slugify(s) {
  return String(s)
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/é|è|ê/g, 'e')
    .replace(/ü/g, 'u')
    .replace(/ø/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeDate(input) {
  // Accept "YYYY-MM-DD" directly; otherwise let Date parse it.
  const m = String(input).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

// Minimal YAML scalar quoting: wrap in double quotes, escape backslash + quote.
const yamlStr = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

function frontmatter(host) {
  const lines = ['---'];
  lines.push(`name: ${yamlStr(host.name)}`);
  lines.push(`date: ${host.date}`); // bare YYYY-MM-DD, coerced to Date by Astro
  if (host.description) lines.push(`description: ${yamlStr(host.description)}`);
  if (host.instagram) lines.push(`instagram: ${yamlStr(host.instagram)}`);
  if (host.instagramFollowers != null && host.instagramFollowers !== '')
    lines.push(`instagramFollowers: ${Number(host.instagramFollowers)}`);
  if (host.x) lines.push(`x: ${yamlStr(host.x)}`);
  if (host.wikipedia) lines.push(`wikipedia: ${yamlStr(host.wikipedia)}`);
  if (host.sr) lines.push(`sr: ${yamlStr(host.sr)}`);
  if (host.image) lines.push(`image: ${yamlStr(host.image)}`);
  lines.push('---');
  lines.push(''); // frontmatter-only: trailing newline, no body
  return lines.join('\n');
}

// Read existing files' name+date so we can dedup even if filenames differ.
function existingKeys(dir) {
  const keys = new Map(); // key -> filename
  if (!existsSync(dir)) return keys;
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.md')) continue;
    const raw = readFileSync(join(dir, f), 'utf8');
    const fm = raw.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) continue;
    const nameM = fm[1].match(/^name:\s*"?(.+?)"?\s*$/m);
    const dateM = fm[1].match(/^date:\s*"?(\d{4}-\d{2}-\d{2})"?\s*$/m);
    if (nameM && dateM) keys.set(`${nameM[1].toLowerCase()}|${dateM[1]}`, f);
  }
  return keys;
}

// ---- input ----------------------------------------------------------------
function readInput() {
  if (FILE) return readFileSync(FILE, 'utf8');
  // stdin fallback
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

const rawInput = readInput().trim();
if (!rawInput) {
  console.error('No input. Pass --file <path.json> or pipe JSON via stdin.');
  process.exit(1);
}

let hosts;
try {
  hosts = JSON.parse(rawInput);
} catch (e) {
  console.error('Input is not valid JSON:', e.message);
  process.exit(1);
}
if (!Array.isArray(hosts)) {
  console.error('Input JSON must be an array of host objects.');
  process.exit(1);
}

// ---- write ----------------------------------------------------------------
if (!DRY_RUN && !existsSync(CONTENT_DIR)) mkdirSync(CONTENT_DIR, { recursive: true });

const seen = existingKeys(CONTENT_DIR);
const summary = { created: [], updated: [], skipped: [], errors: [] };

for (const h of hosts) {
  if (!h || typeof h !== 'object') {
    summary.errors.push({ host: h, reason: 'not an object' });
    continue;
  }
  if (!h.name) {
    summary.errors.push({ host: h, reason: 'missing name' });
    continue;
  }
  const date = normalizeDate(h.date);
  if (!date) {
    summary.errors.push({ host: h, reason: `unparseable date: ${h.date}` });
    continue;
  }

  const host = { ...h, date };
  const key = `${host.name.toLowerCase()}|${date}`;
  const fileName = `${date}-${slugify(host.name)}.md`;
  const filePath = join(CONTENT_DIR, fileName);
  const existsForKey = seen.has(key) || existsSync(filePath);

  if (existsForKey && !UPDATE) {
    summary.skipped.push(fileName);
    continue;
  }

  const content = frontmatter(host);
  if (!DRY_RUN) writeFileSync(filePath, content, 'utf8');
  (existsForKey ? summary.updated : summary.created).push(fileName);
  seen.set(key, fileName);
}

// ---- report ---------------------------------------------------------------
process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
const tally =
  `${DRY_RUN ? '[dry-run] ' : ''}` +
  `created ${summary.created.length}, updated ${summary.updated.length}, ` +
  `skipped ${summary.skipped.length}, errors ${summary.errors.length} ` +
  `→ ${CONTENT_DIR}`;
process.stderr.write(tally + '\n');
