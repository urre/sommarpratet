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

/** Opens ChatGPT with a prefilled question about the host. */
export function chatgptLink(name: string): string {
  return `https://chatgpt.com/?q=${enc('Vem är ' + name + '?')}`;
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

/** The numeric episode id in an SR episode URL (…/avsnitt/2815547), or null.
    Used to look the episode's podcast file up in SR's open API at play time. */
export function srEpisodeId(url?: string): string | null {
  return url?.match(/\/avsnitt\/(\d+)/)?.[1] ?? null;
}
