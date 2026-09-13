import './style.css';
import type { Dataset, Kunstpunkt, Weekend } from './model.ts';
import { element, externalLink, required } from './dom.ts';
import { createSearchIndex, filterPoints, isCancelled } from './search.ts';
import type { Filters } from './search.ts';
import { createDetails } from './details.ts';

required('#app').innerHTML = `
  <main class="app-shell" aria-label="Kunstpunkte entdecken">
    <header class="search-panel">
      <div class="brand-row"><h1>Kunstpunkte<span>unterwegs / 2026</span></h1><button id="info-open" class="icon-button" aria-label="Über diese Karte">i</button></div>
      <label class="search-box"><span aria-hidden="true">⌕</span><span class="sr-only">Kunstpunkt, Name oder Adresse suchen</span><input id="search" type="search" placeholder="Nummer, Name oder Straße" autocomplete="off" enterkeyhint="search"></label>
      <div class="filters" aria-label="Kunstpunkte filtern"><div class="weekends" role="group" aria-label="Wochenende"><button class="chip active" data-weekend="all" aria-pressed="true">Alle</button><button class="chip" data-weekend="1" aria-pressed="false"><span class="dot north"></span>12./13.09. <span class="filter-area">Nord</span></button><button class="chip" data-weekend="2" aria-pressed="false"><span class="dot south"></span>19./20.09. <span class="filter-area">Süd</span></button></div><button id="offspace" class="chip" aria-pressed="false">◇ Offräume</button></div>
    </header>
    <section id="list-view" class="list-view" aria-label="Kunstpunkte als Liste">
      <div class="results-header"><div><p class="eyebrow">Düsseldorf entdecken</p><h2 id="result-count" aria-live="polite">Kunstpunkte laden …</h2></div><button id="reset" class="text-button" hidden>Zurücksetzen</button></div>
      <p id="status" class="status" role="status"></p>
      <div id="results" class="results"></div>
    </section>
    <section id="detail-sheet" class="detail-sheet" aria-labelledby="detail-title" hidden>
      <div class="sheet-handle" aria-hidden="true"></div><button id="detail-close" class="icon-button close" aria-label="Standortdetails schließen">×</button>
      <div id="detail-summary"></div><button id="detail-toggle" class="detail-toggle" aria-controls="detail-body" aria-expanded="false">Alle Teilnehmenden</button><div id="detail-body" hidden></div>
    </section>
    <dialog id="info-dialog"><div class="dialog-header"><h2>Über diese Karte</h2><button id="info-close" class="icon-button" aria-label="Information schließen">×</button></div><p>Ein unabhängiger Prototyp für die Kunstpunkte Düsseldorf 2026.</p><p id="data-date"></p><p>Verbindliche Informationen und kurzfristige Änderungen findest du beim Veranstalter.</p><p><a href="https://kunstpunkte.de" target="_blank" rel="noopener noreferrer">kunstpunkte.de ↗</a></p><p>Die Website wird über GitHub Pages bereitgestellt. Beim Aufruf erhält der Hostinganbieter technisch notwendige Verbindungsdaten. Externe Links öffnen den jeweiligen Anbieter.</p><p><a href="https://github.com/Streetblock/Kunstpunkte-map" target="_blank" rel="noopener noreferrer">Projekt und Fehler melden ↗</a></p></dialog>
  </main>`;

const search = required<HTMLInputElement>('#search');
const reset = required<HTMLButtonElement>('#reset');
const offspace = required<HTMLButtonElement>('#offspace');
const results = required('#results');
const status = required('#status');
const count = required('#result-count');
const info = required<HTMLDialogElement>('#info-dialog');
required('#info-open').addEventListener('click', () => info.showModal());
required('#info-close').addEventListener('click', () => info.close());
const filters: Filters = { query: '', weekend: null, offspace: false };
let dataset: Dataset;
let searchIndex = new Map<string, string>();
const details = createDetails(() => {});

function renderList(points: Kunstpunkt[]) {
  const fragment = document.createDocumentFragment();
  for (const point of points) {
    const p = point.properties;
    const button = element('button', 'point-card');
    button.dataset.weekend = String(p.weekend);
    button.dataset.number = String(p.number);
    button.setAttribute('aria-label', `Kunstpunkt ${p.number}, ${p.address}, Details anzeigen`);
    const copy = element('span', 'card-copy');
    copy.append(element('span', 'card-meta', `${p.weekend === 1 ? '12./13. September · Nord' : '19./20. September · Süd'}${p.hasOffspace ? ' · ◇ Offraum' : ''}`));
    copy.append(element('strong', 'card-address', p.address));
    const names = p.participants.slice(0, 2).map(person => person.name).join(' · ');
    copy.append(element('span', 'card-names', names + (p.participants.length > 2 ? ` + ${p.participants.length - 2} weitere` : '')));
    if (isCancelled(point)) copy.append(element('span', 'cancelled', 'Teilnahme abgesagt'));
    button.append(element('span', 'number-badge', String(p.number)), copy, element('span', 'card-arrow', '↗'));
    button.addEventListener('click', () => details.show(point));
    fragment.append(button);
  }
  if (!points.length) {
    const empty = element('div', 'empty-state');
    empty.append(element('h3', '', 'Kein Kunstpunkt gefunden'), element('p', '', 'Versuche einen anderen Namen oder setze die Filter zurück.'));
    const clear = element('button', 'primary-button', 'Alle Kunstpunkte anzeigen');
    clear.addEventListener('click', resetFilters);
    empty.append(clear); fragment.append(empty);
  }
  results.replaceChildren(fragment);
}

function render() {
  if (!dataset) return;
  const points = filterPoints(dataset.features, searchIndex, filters);
  count.textContent = `${points.length} Kunstpunkt${points.length === 1 ? '' : 'e'}`;
  reset.hidden = !filters.query && !filters.weekend && !filters.offspace;
  offspace.setAttribute('aria-pressed', String(filters.offspace));
  offspace.classList.toggle('active', filters.offspace);
  document.querySelectorAll<HTMLButtonElement>('[data-weekend].chip').forEach(button => {
    const active = button.dataset.weekend === (filters.weekend === null ? 'all' : String(filters.weekend));
    button.setAttribute('aria-pressed', String(active)); button.classList.toggle('active', active);
  });
  if (details.selected && !points.some(point => point.id === details.selected?.id)) details.hide();
  renderList(points);
}

function resetFilters() {
  Object.assign(filters, { query: '', weekend: null, offspace: false });
  search.value = ''; render();
}
search.addEventListener('input', () => { filters.query = search.value; render(); });
reset.addEventListener('click', resetFilters);
offspace.addEventListener('click', () => { filters.offspace = !filters.offspace; render(); });
document.querySelectorAll<HTMLButtonElement>('.chip[data-weekend]').forEach(button => {
  button.addEventListener('click', () => {
    filters.weekend = button.dataset.weekend === 'all' ? null : Number(button.dataset.weekend) as Weekend;
    render();
  });
});

async function loadData() {
  status.textContent = 'Ateliers und Offräume werden geladen.';
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/kunstpunkte-2026.json`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const candidate: Dataset = await response.json();
    if (candidate.type !== 'FeatureCollection' || candidate.event?.year !== 2026 || !Array.isArray(candidate.features) || !candidate.features.length) throw new Error('Ungültiger Datensatz');
    dataset = candidate;
    searchIndex = createSearchIndex(dataset.features);
    required('#data-date').textContent = `Daten abgerufen am ${new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' }).format(new Date(dataset.source.retrievedAt))} Uhr (Berlin).`;
    status.textContent = '';
    render();
  } catch {
    count.textContent = 'Daten nicht verfügbar';
    status.textContent = 'Die Kunstpunkte konnten nicht geladen werden. Bitte prüfe deine Verbindung.';
    const retry = element('button', 'primary-button', 'Erneut versuchen');
    retry.addEventListener('click', () => { results.replaceChildren(); void loadData(); });
    results.replaceChildren(retry, externalLink('Zur offiziellen Teilnehmerliste ↗', 'https://kunstpunkte.de/teilnehmer-innen.html', 'fallback-link'));
  }
}
void loadData();
