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
  // "författar" as a stem, so "författarduo" lands here too.
  { match: /författar|poet|illustratör|översättare/, cat: { key: 'forfattare', label: 'Författare', emoji: '📚' } },
  { match: /youtuber|influencer|sociala medier/, cat: { key: 'sociala-medier', label: 'Sociala medier', emoji: '📱' } },
  { match: /kock|matprofil|krögare|bagare/, cat: { key: 'mat', label: 'Mat', emoji: '🍳' } },
  // Not "sommarvärd" — that's the show's own title, and the descriptions that
  // use it carry the person's actual role ("brandman från Kalmar") alongside.
  { match: /programledare|poddare|radiopratare/, cat: { key: 'radio-tv', label: 'Radio & TV', emoji: '📻' } },
  {
    match: /\bdj\b|artist|sångerska|sångare|violinist|opera|musiker|pianist|rappare|songwriter|låtskrivare|basist|dirigent/,
    cat: { key: 'musik', label: 'Musik', emoji: '🎵' },
  },
  {
    match: /konstnär|koreograf|clown|smink|dramatiker|scenograf|dansare|regissör|cirkus/,
    cat: { key: 'konst-scen', label: 'Konst & scen', emoji: '🎨' },
  },
  {
    match: /fotboll|basket|friidrott|idrott|alpinist|simlärare|simskola|sjöjungfru|athlet|skidåkare|volleyboll|proffs|målvakt|domare/,
    cat: { key: 'idrott', label: 'Idrott', emoji: '🏅' },
  },
  {
    match: /\bvd\b|grundare|finansman|näringsliv|entreprenör|ekonom|företagare|designchef|riksbank/,
    cat: { key: 'naringsliv', label: 'Näringsliv', emoji: '💼' },
  },
  {
    match: /professor|doktor|fysiker|läkare|neurokirurg|forskare|expert|medicin|filosof|historiker|analytiker|olog\b|astronaut|rymd/,
    cat: { key: 'forskare', label: 'Forskare & expert', emoji: '🔬' },
  },
  {
    match: /advokat|biskop|fn:s|\bfn\b|eu:s|\beu\b|nobel|fredspris|socialarbetare|brandman|minister|ambassad|representant|talman|diplomat|polis|nato|soldat|löjtnant|militär|människorätt|predikant|rektor|sköterska|generaldirektör/,
    cat: { key: 'samhalle', label: 'Samhälle', emoji: '🏛️' },
  },
];

const OTHER: Category = { key: 'ovrigt', label: 'Övrigt', emoji: '📌' };

export function categorize(description?: string): Category {
  const d = (description ?? '').toLowerCase();
  for (const { match, cat } of RULES) if (match.test(d)) return cat;
  return OTHER;
}
