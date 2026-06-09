// Categories are derived from each host's free-text description with a simple
// keyword matcher — no data duplication, so editing a description re-categorises
// automatically. First match wins, so the order encodes priority (a host's
// "primary" role). Each category carries an emoji icon used across the UI.

export interface Category {
  key: string;
  label: string;
  emoji: string;
}

const RULES: { match: RegExp; cat: Category }[] = [
  { match: /skådespelare/, cat: { key: 'skadespelare', label: 'Skådespelare', emoji: '🎭' } },
  { match: /komiker/, cat: { key: 'komiker', label: 'Komiker', emoji: '😄' } },
  { match: /journalist|korrespondent|kungaexpert/, cat: { key: 'journalist', label: 'Journalist', emoji: '📰' } },
  { match: /författare|poet|illustratör|översättare/, cat: { key: 'forfattare', label: 'Författare', emoji: '📚' } },
  { match: /youtuber|influencer|sociala medier/, cat: { key: 'sociala-medier', label: 'Sociala medier', emoji: '📱' } },
  { match: /\bdj\b|artist|sångerska|sångare|violinist|opera|musiker/, cat: { key: 'musik', label: 'Musik', emoji: '🎵' } },
  { match: /konstnär|koreograf|clown|smink|dramatiker|scenograf|dansare/, cat: { key: 'konst-scen', label: 'Konst & scen', emoji: '🎨' } },
  { match: /fotboll|basket|friidrott|idrott|alpinist|simlärare|simskola|sjöjungfru|athlet/, cat: { key: 'idrott', label: 'Idrott', emoji: '🏅' } },
  { match: /\bvd\b|grundare|finansman|näringsliv|entreprenör|ekonom/, cat: { key: 'naringsliv', label: 'Näringsliv', emoji: '💼' } },
  { match: /professor|doktor|fysiker|läkare|neurokirurg|forskare|expert|medicin/, cat: { key: 'forskare', label: 'Forskare & expert', emoji: '🔬' } },
  { match: /advokat|biskop|fn:s|\bfn\b|eu:s|\beu\b|nobel|fredspris|socialarbetare|brandman|minister|ambassad|representant/, cat: { key: 'samhalle', label: 'Samhälle', emoji: '🏛️' } },
];

const OTHER: Category = { key: 'ovrigt', label: 'Övrigt', emoji: '📌' };

export function categorize(description?: string): Category {
  const d = (description ?? '').toLowerCase();
  for (const { match, cat } of RULES) if (match.test(d)) return cat;
  return OTHER;
}
