import type { Kunstpunkt } from './model.ts';
import { element } from './dom.ts';
import { participantMatches, participantsForQuery } from './search.ts';

export function participantPreview(
  point: Kunstpunkt,
  query: string,
  className: string,
  showRemainder = true,
): HTMLElement {
  const container = element('span', className);
  const ordered = participantsForQuery(point, query);
  // Small groups stay complete; every search match remains visible in larger groups too.
  const limit = Math.max(4, ordered.filter((person) => participantMatches(person, query)).length);
  ordered.slice(0, limit).forEach((person, index) => {
    if (index) container.append(document.createTextNode(' · '));
    container.append(element(participantMatches(person, query) ? 'mark' : 'span', '', person.name));
  });
  if (showRemainder && ordered.length > limit)
    container.append(
      element('span', 'more-participants', ` + ${ordered.length - limit} weitere · alle ansehen`),
    );
  return container;
}
