import type { Kunstpunkt, Participant, Weekend } from './model.ts';

export interface Filters {
  query: string;
  weekend: Weekend | null;
  offspace: boolean;
  favoritesOnly?: boolean;
}

export function normalize(value: string): string {
  return value
    .toLocaleLowerCase('de-DE')
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function createSearchIndex(points: Kunstpunkt[]): Map<string, string> {
  return new Map(
    points.map((point) => [
      point.id,
      normalize(
        [
          point.properties.number,
          point.properties.address,
          ...point.properties.participants.map((person) => person.name),
        ].join(' '),
      ),
    ]),
  );
}

export function filterPoints(
  points: Kunstpunkt[],
  index: Map<string, string>,
  filters: Filters,
  favorites: ReadonlySet<string> = new Set(),
): Kunstpunkt[] {
  const terms = normalize(filters.query).split(' ').filter(Boolean);
  const numberQuery = /^\s*\d+\s*$/.test(filters.query) ? Number(filters.query.trim()) : null;
  return points.filter((point) => {
    const p = point.properties;
    if (filters.favoritesOnly && !favorites.has(point.id)) return false;
    if (filters.weekend !== null && p.weekend !== filters.weekend) return false;
    if (filters.offspace && !p.hasOffspace) return false;
    if (numberQuery !== null) return p.number === numberQuery;
    return terms.every((term) => index.get(point.id)?.includes(term));
  });
}

export function isCancelled(point: Kunstpunkt): boolean {
  return point.properties.participants.every((person) => person.cancelled);
}

export function participantMatches(person: Participant, query: string): boolean {
  const terms = normalize(query).split(' ').filter(Boolean);
  if (!terms.length || /^\d+$/.test(normalize(query))) return false;
  const name = normalize(person.name);
  return terms.some((term) => !/^\d+$/.test(term) && name.includes(term));
}

/** Only the presentation order changes; the source and location identity remain intact. */
export function participantsForQuery(point: Kunstpunkt, query: string): Participant[] {
  return [...point.properties.participants].sort(
    (a, b) => Number(participantMatches(b, query)) - Number(participantMatches(a, query)),
  );
}
