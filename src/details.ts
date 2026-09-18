import type { Kunstpunkt } from './model.ts';
import { element, externalLink, required } from './dom.ts';
import { isCancelled, participantMatches, participantsForQuery } from './search.ts';
import { routeUrls } from './navigation.ts';
import { distanceMeters, formatDistance } from './location.ts';
import type { Position } from './location.ts';
import { favoriteButton } from './favorite-button.ts';

export function createDetails(
  onClose: () => void,
  onShare: (point: Kunstpunkt) => void,
  favorites?: { has: (id: string) => boolean; toggle: (point: Kunstpunkt) => void },
) {
  const sheet = required<HTMLElement>('#detail-sheet');
  const body = required<HTMLElement>('#detail-body');
  const close = required<HTMLButtonElement>('#detail-close');
  const summary = required<HTMLElement>('#detail-summary');
  const footer = required<HTMLElement>('#detail-footer');
  const sheetParent = sheet.parentElement!;
  const dialog = element('dialog', 'list-detail-dialog');
  dialog.setAttribute('aria-labelledby', 'detail-title');
  sheetParent.append(dialog);
  let returnFocus: HTMLElement | null = null;
  let selected: Kunstpunkt | null = null;

  const hide = (restoreFocus = true) => {
    sheet.hidden = true;
    selected = null;
    if (dialog.open) dialog.close();
    if (sheet.parentElement === dialog) sheetParent.append(sheet);
    if (restoreFocus) {
      if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
      else
        (
          document.querySelector<HTMLButtonElement>('#search-toggle') ??
          required<HTMLInputElement>('#search')
        ).focus({ preventScroll: true });
    }
    onClose();
  };
  close.addEventListener('click', () => hide());
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    hide();
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) hide();
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !sheet.hidden && !document.querySelector('dialog[open]')) {
      event.preventDefault();
      hide();
    }
  });

  return {
    get selected() {
      return selected;
    },
    hide,
    show(point: Kunstpunkt, position?: Position, query = '', inList = dialog.open) {
      if (sheet.hidden)
        returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      selected = point;
      const p = point.properties;
      sheet.dataset.weekend = String(p.weekend);
      summary.replaceChildren();
      const top = element('div', 'detail-topline');
      top.append(
        element('span', 'number-badge', String(p.number)),
        element(
          'span',
          'eyebrow',
          `${p.weekend === 1 ? '12./13.09. · Nord' : '19./20.09. · Süd'}${p.hasOffspace ? ' · Offraum' : ''}`,
        ),
      );
      const title = element('h2');
      title.id = 'detail-title';
      // Keep room for the complete, independently scrolling participant list below.
      title.textContent = participantsForQuery(point, query)[0]?.name ?? p.address;
      summary.append(top, title, element('p', 'detail-address', p.address));
      if (favorites)
        top.append(favoriteButton(point, favorites.has(point.id), () => favorites.toggle(point)));
      if (isCancelled(point)) summary.append(element('p', 'cancelled', 'Teilnahme abgesagt'));
      if (position)
        summary.append(element('p', 'distance', formatDistance(distanceMeters(position, point))));
      const actions = element('div', 'detail-actions');
      const urls = routeUrls(point);
      actions.append(
        externalLink('Route hierher ↗', urls.google, 'primary-button'),
        externalLink('Apple Karten ↗', urls.apple, 'secondary-button'),
      );
      const share = element('button', 'share-button', 'Link teilen');
      share.addEventListener('click', () => onShare(point));
      actions.append(share);
      body.replaceChildren();
      const heading = element('h3', '', `An diesem Kunstpunkt (${p.participants.length})`);
      const people = element('ul', 'participant-list');
      for (const person of participantsForQuery(point, query)) {
        const item = element('li');
        const link = externalLink(`${person.name} ↗`, person.url);
        if (participantMatches(person, query))
          link.replaceChildren(element('mark', '', person.name), document.createTextNode(' ↗'));
        item.append(link);
        if (person.cancelled) item.append(element('span', 'cancelled', 'Teilnahme abgesagt'));
        if (person.artwork && person.artwork.permission.trim()) {
          const artwork = person.artwork;
          if (/^https:\/\//.test(artwork.url)) {
            const figure = element('figure', 'artwork');
            const img = element('img');
            img.src = artwork.url;
            img.alt = artwork.alt;
            img.loading = 'lazy';
            img.addEventListener('error', () => figure.remove(), { once: true });
            const caption = element('figcaption', '', artwork.credit + ' · ');
            caption.append(externalLink('Bildquelle ↗', artwork.sourceUrl));
            figure.append(img, caption);
            item.append(figure);
          }
        }
        people.append(item);
      }
      body.append(
        heading,
        people,
        element(
          'p',
          'note',
          'Öffnungszeiten, Sparten und Zugang findest du auf den verlinkten Originalseiten.',
        ),
      );
      footer.replaceChildren(actions);
      body.scrollTop = 0;
      sheet.hidden = false;
      body.hidden = false;
      if (inList) {
        dialog.append(sheet);
        if (!dialog.open) dialog.showModal();
      } else if (dialog.open) {
        dialog.close();
        sheetParent.append(sheet);
      }
      close.focus({ preventScroll: true });
    },
  };
}
