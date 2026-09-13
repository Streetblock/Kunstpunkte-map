import type { Kunstpunkt } from './model.ts';
import { element } from './dom.ts';
import { participantMatches, participantsForQuery } from './search.ts';

export function participantPreview(
  point: Kunstpunkt,
  query: string,
  className: string,
): HTMLElement {
  const container = element('span', className);
  const ordered = participantsForQuery(point, query);
  // Keep every matching person visible, even if more than two names match at a shared studio.
  const limit = Math.max(2, ordered.filter((person) => participantMatches(person, query)).length);
  ordered.slice(0, limit).forEach((person, index) => {
    if (index) container.append(document.createTextNode(' · '));
    container.append(element(participantMatches(person, query) ? 'mark' : 'span', '', person.name));
  });
  if (ordered.length > limit)
    container.append(document.createTextNode(` + ${ordered.length - limit} weitere`));
  return container;
}
