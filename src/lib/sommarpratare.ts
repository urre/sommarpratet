import { getCollection, type CollectionEntry } from 'astro:content';

export type Host = CollectionEntry<'sommarpratare'>;

/** All hosts, sorted chronologically by broadcast date. */
export async function getHosts(): Promise<Host[]> {
  const hosts = await getCollection('sommarpratare');
  return hosts.sort((a, b) => a.data.date.getTime() - b.data.date.getTime());
}

// Frontmatter dates are parsed as UTC midnight. Format from the UTC parts so the
// displayed day never drifts by the build/render machine's timezone.
const WEEKDAYS = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör'];
const MONTHS_SHORT = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];
const MONTHS_LONG = [
  'Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni',
  'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December',
];

/** e.g. "lör 20 jun" */
export function formatDate(d: Date): string {
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]}`;
}

/** "YYYY-MM-DD" (UTC). */
export function isoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** 1-based month number → Swedish month name. */
export function monthName(month: number): string {
  return MONTHS_LONG[month - 1] ?? '';
}

/** Compact follower count, Swedish style: 1200000 → "1,2 mn", 45000 → "45 k". */
export function formatFollowers(n?: number | null): string {
  if (n == null) return '';
  if (n >= 1_000_000) {
    const m = Math.round((n / 1_000_000) * 10) / 10;
    return String(m).replace('.', ',') + ' mn';
  }
  if (n >= 1_000) return Math.round(n / 1000) + ' k';
  return String(n);
}
