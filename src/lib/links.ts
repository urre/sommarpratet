// External link builders for each summer host.
//
// Most are *search* deep-links built from the host's name — there is no canonical
// per-person profile URL in the source data. When the content file provides an
// explicit URL (instagram / x / wikipedia / sr in frontmatter), that wins;
// otherwise we fall back to a search that lands the user on the right place.

const enc = (s: string) => encodeURIComponent(s);

/** Instagram has no stable public search URL, so route via a Google search. */
export function instagramLink(name: string, explicit?: string): string {
  return explicit ?? `https://www.google.com/search?q=${enc(`${name} instagram`)}`;
}

/** X (Twitter) has a real search endpoint. */
export function xLink(name: string, explicit?: string): string {
  return explicit ?? `https://x.com/search?q=${enc(name)}&src=typed_query`;
}

/** Google Trends, scoped to Sweden. */
export function trendsLink(name: string): string {
  return `https://trends.google.com/trends/explore?geo=SE&q=${enc(name)}`;
}

/** MediaWiki "go" endpoint: redirects straight to the article on an exact title
    match, otherwise shows Swedish Wikipedia search results. */
export function wikipediaLink(name: string, explicit?: string): string {
  return explicit ?? `https://sv.wikipedia.org/w/index.php?search=${enc(name)}&go=Go`;
}

/** Sveriges Radio episode page for the host's Sommar i P1 — explicit per host;
    falls back to an SR site search. */
export function srLink(name: string, explicit?: string): string {
  return explicit ?? `https://sverigesradio.se/sok?query=${enc(name)}`;
}
