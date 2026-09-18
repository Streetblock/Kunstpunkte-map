import { required } from './dom.ts';

/** Collapsing search never silently clears an active filter. */
export function createSearchPanel(input: HTMLInputElement, onClear: () => void) {
  const panel = required('#search-controls');
  const toggle = required<HTMLButtonElement>('#search-toggle');
  const active = required('#active-search');
  const edit = required<HTMLButtonElement>('#search-edit');
  const close = required<HTMLButtonElement>('#search-close');
  function sync() {
    active.hidden = !panel.hidden || !input.value.trim();
    edit.textContent = `Suche: ${input.value.trim()}`;
    edit.setAttribute('aria-label', `Suche bearbeiten: ${input.value.trim()}`);
  }
  function open(expanded: boolean) {
    panel.hidden = !expanded;
    toggle.setAttribute('aria-expanded', String(expanded));
    sync();
    (expanded ? input : toggle).focus({ preventScroll: true });
  }
  toggle.addEventListener('click', () => open(!!panel.hidden));
  edit.addEventListener('click', () => open(true));
  close.addEventListener('click', () => open(false));
  required('#search-clear').addEventListener('click', () => {
    onClear();
    toggle.focus({ preventScroll: true });
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      open(false);
    }
    if (event.key === 'Enter') open(false);
  });
  return { sync };
}
