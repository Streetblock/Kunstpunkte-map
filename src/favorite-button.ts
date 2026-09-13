import { element } from './dom.ts';
import type { Kunstpunkt } from './model.ts';

export function updateFavoriteButton(button: HTMLButtonElement, saved: boolean) {
  button.setAttribute('aria-pressed', String(saved));
  button.title = saved ? 'Aus Favoriten entfernen' : 'Als Favorit speichern';
  const star = element('span', '', saved ? '★' : '☆');
  star.setAttribute('aria-hidden', 'true');
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
