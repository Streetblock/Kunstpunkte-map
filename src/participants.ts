import type { Kunstpunkt, Participant } from './model.ts';
import { normalize } from './search.ts';

export interface ParticipantEntry {
  slug: string;
  name: string;
  appearances: { point: Kunstpunkt; participant: Participant }[];
}

/** Source identities are scoped to this edition, not assumed stable across years. */
export function participantEntries(
  points: Kunstpunkt[],
  query = '',
  byDistance = false,
): ParticipantEntry[] {
  const entries = new Map<string, ParticipantEntry>();
  const terms = normalize(query).split(' ').filter(Boolean);
  const number = /^\s*\d+\s*$/.test(query) ? Number(query.trim()) : null;
  for (const point of points) {
    for (const participant of point.properties.participants) {
      const text = normalize(
        `${participant.name} ${point.properties.address} ${point.properties.number}`,
      );
      if (
        number !== null
          ? point.properties.number !== number
          : !terms.every((term) => text.includes(term))
      )
        continue;
      let entry = entries.get(participant.slug);
      if (!entry) {
        entry = { slug: participant.slug, name: participant.name, appearances: [] };
        entries.set(participant.slug, entry);
      }
      if (!entry.appearances.some((appearance) => appearance.point.id === point.id))
        entry.appearances.push({ point, participant });
    }
  }
  // Distance-sorted points insert each entry at its nearest appearance.
  return byDistance
    ? [...entries.values()]
    : [...entries.values()].sort((a, b) => a.name.localeCompare(b.name, 'de'));
}
