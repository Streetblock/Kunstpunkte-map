import { element } from './dom.ts';
import { favoriteButton } from './favorite-button.ts';
import { distanceMeters, formatDistance } from './location.ts';
import type { Position } from './location.ts';
import type { Kunstpunkt } from './model.ts';
import type { ParticipantEntry } from './participants.ts';
import { participantMatches } from './search.ts';

export function participantCards(
  entries: ParticipantEntry[],
  query: string,
  callbacks: {
    select: (point: Kunstpunkt, name: string) => void;
    showOnMap: (entry: ParticipantEntry) => void;
    hasFavorite: (id: string) => boolean;
    toggleFavorite: (point: Kunstpunkt) => void;
  },
  position?: Position,
): DocumentFragment {
  const fragment = document.createDocumentFragment();
  for (const entry of entries) {
    const card = element('article', 'participant-card');
    card.dataset.participant = entry.slug;
    const title = element('h3');
    title.append(
      element(
        participantMatches(entry.appearances[0]!.participant, query) ? 'mark' : 'span',
        '',
        entry.name,
      ),
    );
    const mapButton = element(
      'button',
      'text-button participant-map',
      `${entry.appearances.length === 1 ? 'Ort' : 'Alle Orte'} auf Karte ↗`,
    );
    mapButton.setAttribute(
      'aria-label',
      `${entry.name}: ${entry.appearances.length} ${entry.appearances.length === 1 ? 'Ort' : 'Orte'} auf Karte anzeigen`,
    );
    mapButton.addEventListener('click', () => callbacks.showOnMap(entry));
    card.append(title, mapButton);
    for (const { point, participant } of entry.appearances) {
      const p = point.properties;
      const row = element('div', 'participant-appearance');
      row.dataset.weekend = String(p.weekend);
      const visit = element('button', 'appearance-details');
      visit.setAttribute(
        'aria-label',
        `${entry.name}, Kunstpunkt ${p.number}, ${p.address}, Details anzeigen`,
      );
      visit.append(element('span', 'number-badge', String(p.number)));
      const copy = element('span', 'card-copy');
      copy.append(
        element('span', 'card-address', p.address),
        element(
          'span',
          'card-meta',
          `${p.weekend === 1 ? '12./13. September · Nord' : '19./20. September · Süd'}${p.hasOffspace ? ' · ◇ Offraum' : ''}`,
        ),
      );
      if (participant.cancelled)
        copy.append(element('span', 'cancelled', 'Teilnahme hier abgesagt'));
      if (position)
        copy.append(element('span', 'distance', formatDistance(distanceMeters(position, point))));
      visit.append(copy);
      visit.addEventListener('click', () => callbacks.select(point, entry.name));
      const star = favoriteButton(point, callbacks.hasFavorite(point.id), () =>
        callbacks.toggleFavorite(point),
      );
      star.setAttribute('title', 'Diesen Ort merken');
      row.append(visit, star);
      card.append(row);
    }
    fragment.append(card);
  }
  return fragment;
}
