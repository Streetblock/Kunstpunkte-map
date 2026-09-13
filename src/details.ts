import type { Kunstpunkt } from './model.ts';
import { element, externalLink, required } from './dom.ts';
import { isCancelled } from './search.ts';

export function createDetails(onClose: () => void) {
  const sheet = required<HTMLElement>('#detail-sheet');
  const body = required<HTMLElement>('#detail-body');
  const toggle = required<HTMLButtonElement>('#detail-toggle');
  const close = required<HTMLButtonElement>('#detail-close');
  const summary = required<HTMLElement>('#detail-summary');
  let expanded = false;
  let returnFocus: HTMLElement | null = null;
  let selected: Kunstpunkt | null = null;

  const setExpanded = (value: boolean) => {
    expanded = value;
    sheet.classList.toggle('expanded', value);
    body.hidden = !value;
    toggle.setAttribute('aria-expanded', String(value));
    toggle.textContent = value ? 'Weniger anzeigen' : 'Alle Teilnehmenden';
  };
  const hide = () => {
    sheet.hidden = true;
    selected = null;
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    else required<HTMLInputElement>('#search').focus({ preventScroll: true });
    onClose();
  };
  close.addEventListener('click', hide);
  toggle.addEventListener('click', () => setExpanded(!expanded));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !sheet.hidden && !document.querySelector('dialog[open]')) {
      event.preventDefault(); hide();
    }
  });

  return {
    get selected() { return selected; },
    hide,
    show(point: Kunstpunkt) {
      if (sheet.hidden) returnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      selected = point;
      const p = point.properties;
      sheet.dataset.weekend = String(p.weekend);
      summary.replaceChildren();
      const top = element('div', 'detail-topline');
      top.append(element('span', 'number-badge', String(p.number)), element('span', 'eyebrow',
        `${p.weekend === 1 ? '12./13.09. · Nord' : '19./20.09. · Süd'}${p.hasOffspace ? ' · Offraum' : ''}`));
      const title = element('h2', '', p.address);
      title.id = 'detail-title';
      const names = p.participants.slice(0, 2).map(person => person.name).join(' · ');
      summary.append(top, title, element('p', 'detail-names', names + (p.participants.length > 2 ? ` und ${p.participants.length - 2} weitere` : '')));
      if (isCancelled(point)) summary.append(element('p', 'cancelled', 'Teilnahme abgesagt'));
      body.replaceChildren();
      const heading = element('h3', '', `An diesem Kunstpunkt (${p.participants.length})`);
      const people = element('ul', 'participant-list');
      for (const person of p.participants) {
        const item = element('li');
        item.append(externalLink(`${person.name} ↗`, person.url));
        if (person.cancelled) item.append(element('span', 'cancelled', 'Teilnahme abgesagt'));
        people.append(item);
      }
      body.append(heading, people, element('p', 'note', 'Öffnungszeiten, Sparten und Zugang findest du auf den verlinkten Originalseiten.'));
      sheet.hidden = false;
      setExpanded(false);
      close.focus({ preventScroll: true });
    },
  };
}
