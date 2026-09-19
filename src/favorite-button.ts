import { element } from './dom.ts';
import type { Kunstpunkt } from './model.ts';

export function updateFavoriteButton(button: HTMLButtonElement, saved: boolean) {
  button.setAttribute('aria-pressed', String(saved));
  button.title = saved ? 'Aus Favoriten entfernen' : 'Als Favorit speichern';
  const star = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  star.classList.add('favorite-icon');
  star.setAttribute('viewBox', '0 0 24 24');
  star.setAttribute('aria-hidden', 'true');
  star.setAttribute('focusable', 'false');
  const outline = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  // Symmetric visible bounds around (12, 12), independent of font baselines.
  outline.setAttribute(
    'd',
    'M12 2.5 15.09 8.76 22 9.77 17 14.64 18.18 21.5 12 18.26 5.82 21.5 7 14.64 2 9.77 8.91 8.76Z',
  );
  star.append(outline);
  button.replaceChildren(star);
  if (button.dataset.withText === 'true')
    button.append(element('span', '', saved ? 'Gemerkt' : 'Merken'));
}

export function favoriteButton(
  point: Kunstpunkt,
  saved: boolean,
  onToggle: () => void,
  withText = false,
): HTMLButtonElement {
  const button = element('button', 'favorite-button');
  button.dataset.favoriteId = point.id;
  button.dataset.withText = String(withText);
  button.setAttribute('aria-label', `Kunstpunkt ${point.properties.number} merken`);
  updateFavoriteButton(button, saved);
  button.addEventListener('click', onToggle);
  return button;
}
