// Initials-based circular avatars with a deterministic colour per name.
// We don't ship portrait photos (no licensed source, broken-image risk), so the
// default avatar is the host's initials on a stable, summery hue. A real photo
// can still be supplied per host via the `image` frontmatter field.

// Warm, sun-bleached palette — deep enough that the contrast helper can pick a
// legible text colour on top.
const PALETTE = [
  '#e4572e', // tomato
  '#f3801f', // orange
  '#f6a700', // amber
  '#1fb6a6', // teal
  '#3b82f6', // sky
  '#7c5cff', // violet
  '#ef5da8', // pink
  '#34b27b', // green
  '#d98a3d', // ochre
  '#2a9d8f', // sea green
];

export function initials(name: string): string {
  const parts = name
    .replace(/[^\p{L}\s-]/gu, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function avatarColor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

/** Black or white text for legibility against the given colour (WCAG-ish). */
export function textColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#1d1b16' : '#ffffff';
}
