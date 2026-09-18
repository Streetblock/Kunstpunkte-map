import './style.css';
import type { Dataset, Kunstpunkt, Weekend } from './model.ts';
import { element, externalLink, required } from './dom.ts';
import { createSearchIndex, filterPoints, isCancelled } from './search.ts';
import type { Filters } from './search.ts';
import { createDetails } from './details.ts';
import { createMap } from './map.ts';
import { distanceMeters, formatDistance, locate, sortByDistance } from './location.ts';
import type { Position } from './location.ts';
import { pointNumberFromUrl, pointUrl } from './navigation.ts';
import { participantPreview } from './participant-preview.ts';
import { createFavorites, FAVORITES_KEY } from './favorites.ts';
import { favoriteButton, updateFavoriteButton } from './favorite-button.ts';
import { createSearchPanel } from './search-panel.ts';
import { participantEntries } from './participants.ts';
import type { ParticipantEntry } from './participants.ts';
import { participantCards } from './participant-list.ts';

required('#app').innerHTML = `
  <main class="app-shell" aria-label="Kunstpunkte entdecken">
    <header class="search-panel">
      <div class="brand-row"><h1>Kunstpunkte<span class="sr-only"> Düsseldorf 2026</span></h1><div class="brand-actions"><button id="search-toggle" class="icon-button" aria-label="Suche öffnen oder einklappen" aria-controls="search-controls" aria-expanded="false">⌕</button><button id="favorites-view" class="favorites-view" aria-label="Favoriten anzeigen" aria-pressed="false"><span aria-hidden="true">☆</span><span id="favorites-count">0</span></button><button id="info-open" class="icon-button" aria-label="Über diese Karte">i</button></div></div>
      <div id="search-controls" class="search-controls" hidden><label class="search-box"><span class="sr-only">Kunstpunkt, Name oder Adresse suchen</span><input id="search" type="search" placeholder="Name, Raum, Nummer oder Straße" autocomplete="off" enterkeyhint="search"></label><button id="search-close" class="icon-button" aria-label="Suche übernehmen und einklappen" title="Suche übernehmen und einklappen">✓</button></div>
      <div id="active-search" class="active-search" hidden><button id="search-edit" class="text-button"></button><button id="search-clear" class="icon-button" aria-label="Suchfilter löschen">×</button></div>
      <div class="filters" aria-label="Kunstpunkte filtern"><div class="weekends" role="group" aria-label="Wochenende"><button class="chip active" data-weekend="all" aria-pressed="true">Alle</button><button class="chip" data-weekend="1" aria-pressed="false"><span class="dot north"></span>12./13.09. <span class="filter-area">Nord</span></button><button class="chip" data-weekend="2" aria-pressed="false"><span class="dot south"></span>19./20.09. <span class="filter-area">Süd</span></button></div><button id="offspace" class="chip" aria-pressed="false">◇ Offräume</button></div>
      <div id="participant-focus" class="active-search" hidden><span id="participant-focus-name"></span><button id="participant-focus-clear" class="icon-button" aria-label="Namensauswahl aufheben">×</button></div>
    </header>
    <div class="workspace">
    <section id="map-view" class="map-view" aria-label="Kunstpunkte auf der Karte"><div id="map"></div><button id="map-reset" class="map-reset" aria-label="Alle gefilterten Kunstpunkte auf der Karte anzeigen">↗ Übersicht</button><div class="map-legend"><span><i class="dot north"></i> Nord</span><span><i class="dot south"></i> Süd</span><span>◇ Offraum</span></div><p id="tile-status" class="tile-status" role="status" hidden></p></section>
    <section id="list-view" class="list-view" aria-label="Kunstpunkte als Liste">
      <div class="results-header"><div><p id="list-heading" class="eyebrow">Düsseldorf entdecken</p><h2 id="result-count" aria-live="polite">Kunstpunkte laden …</h2></div><button id="reset" class="text-button" hidden>Zurücksetzen</button></div>
      <div class="browse-switch" role="group" aria-label="Liste gliedern"><button id="browse-places" aria-pressed="true" class="active">Orte</button><button id="browse-participants" aria-pressed="false">Künstler &amp; Räume</button></div>
      <p id="participants-hint" class="browse-hint" hidden>Künstler, Räume und Kollektive mit ihren Orten. Der Stern merkt jeweils den Ort.</p>
      <p id="favorites-hint" class="favorites-hint" hidden>Gemerkte Orte auf diesem Gerät. Oben kannst du sie nach Wochenende filtern.</p>
      <div id="nearby-controls" class="nearby-controls" hidden><label for="sort">Sortieren</label><select id="sort"><option value="distance">Nähe (Luftlinie)</option><option value="number">Kunstpunktnummer</option></select><p id="nearby-count"></p></div>
      <p id="status" class="status" role="status"></p>
      <div id="results" class="results"></div>
    </section></div>
    <nav class="bottom-bar" aria-label="Ansicht und Standort"><div class="view-switch" role="group" aria-label="Darstellung"><button id="view-map" class="active" aria-pressed="true">◎ Karte</button><button id="view-list" aria-pressed="false">☷ Liste <span id="list-count"></span></button></div><button id="locate" class="locate-button" aria-label="Mein Standort ermitteln">⌖ <span>Standort</span></button><div class="footer-meta"><span class="prototype-label">Unabhängiger Prototyp</span><div id="map-attribution"></div></div></nav>
    <p id="notice" class="notice" role="status" hidden></p>
    <section id="detail-sheet" class="detail-sheet" aria-labelledby="detail-title" hidden>
      <div class="sheet-handle" aria-hidden="true"></div><button id="detail-close" class="icon-button close" aria-label="Standortdetails schließen">×</button>
      <div id="detail-summary"></div><div id="detail-body" tabindex="0" role="region" aria-label="Alle Teilnehmenden und Originalseiten"></div><div id="detail-footer"></div>
    </section>
    <dialog id="info-dialog"><div class="dialog-header"><h2>Über diese Karte</h2><button id="info-close" class="icon-button" aria-label="Information schließen">×</button></div><p>Ein unabhängiger Prototyp für die Kunstpunkte Düsseldorf 2026.</p><p id="data-date"></p><p>Verbindliche Informationen und kurzfristige Änderungen findest du beim Veranstalter.</p><p><a href="https://kunstpunkte.de" target="_blank" rel="noopener noreferrer">kunstpunkte.de ↗</a></p><p>Die Website wird über GitHub Pages bereitgestellt; der Kartenhintergrund kommt von OpenStreetMap. Diese Anbieter erhalten beim Aufruf technisch notwendige Verbindungsdaten. Externe Links öffnen den jeweiligen Anbieter.</p><p>Dein Standort wird nur auf Knopfdruck abgefragt und im Browser zur Berechnung der Luftlinie verwendet. Wir speichern keinen Standortverlauf. Beim Zentrieren der Karte werden die dafür benötigten Kartenkacheln angefragt.</p><p id="location-info">Noch kein Standort ermittelt.</p><p><a href="https://github.com/Streetblock/Kunstpunkte-map" target="_blank" rel="noopener noreferrer">Projekt und Fehler melden ↗</a></p></dialog>
  </main>`;

const search = required<HTMLInputElement>('#search');
const reset = required<HTMLButtonElement>('#reset');
const offspace = required<HTMLButtonElement>('#offspace');
const results = required('#results');
const status = required('#status');
const count = required('#result-count');
const info = required<HTMLDialogElement>('#info-dialog');
info.append(
  element(
    'p',
    '',
    'Favoriten bleiben in diesem Browser auf diesem Gerät gespeichert. Sie werden nicht an einen Server übertragen. Beim Löschen der Websitedaten gehen sie verloren.',
  ),
);
required('#info-open').addEventListener('click', () => info.showModal());
required('#info-close').addEventListener('click', () => info.close());
const filters: Filters = { query: '', weekend: null, offspace: false, favoritesOnly: false };
const searchPanel = createSearchPanel(
  search,
  () => {
    search.value = '';
    filters.query = '';
    focusedParticipant = null;
    render();
    scheduleSearchFit();
  },
  fitSearchResults,
);
let dataset: Dataset;
let searchIndex = new Map<string, string>();
let position: Position | undefined;
let replayingHistory = false;
let noticeTimer: ReturnType<typeof setTimeout> | undefined;
const favorites = createFavorites(
  () => localStorage,
  (message) => notify(message, true),
);
const details = createDetails(
  () => {
    map.select(null);
    if (!replayingHistory) history.replaceState(null, '', pointUrl(new URL(location.href), null));
  },
  sharePoint,
  { has: (id) => favorites.has(id), toggle: toggleFavorite },
);
const map = createMap(
  required('#map'),
  (point) => selectPoint(point, true, undefined, false),
  (failed) => {
    const notice = required('#tile-status');
    notice.hidden = !failed;
    notice.textContent = 'Kartenhintergrund teilweise nicht verfügbar. Die Liste bleibt nutzbar.';
  },
);
const desktop = matchMedia('(min-width: 900px)');
let view: 'map' | 'list' = 'map';
let browse: 'places' | 'participants' = 'places';
let focusedParticipant: Pick<ParticipantEntry, 'slug' | 'name'> | null = null;
let searchFitTimer: ReturnType<typeof setTimeout> | undefined;
let pendingSearchFit = false;
function fitSearchResults() {
  clearTimeout(searchFitTimer);
  if (!dataset) return;
  if (view === 'map' || desktop.matches) {
    map.fit();
    pendingSearchFit = false;
  } else pendingSearchFit = true;
}
function scheduleSearchFit() {
  clearTimeout(searchFitTimer);
  pendingSearchFit = true;
  searchFitTimer = setTimeout(fitSearchResults, 250);
}

for (const mode of ['places', 'participants'] as const) {
  required(`#browse-${mode}`).addEventListener('click', () => {
    browse = mode;
    render();
  });
}
required('#participant-focus-clear').addEventListener('click', () => {
  focusedParticipant = null;
  render();
});

function showParticipantOnMap(entry: ParticipantEntry) {
  focusedParticipant = entry;
  if (details.selected) details.hide(false);
  setView('map');
  render(true);
}

function selectPoint(
  point: Kunstpunkt,
  writeHistory = true,
  name = focusedParticipant?.name ?? filters.query,
  inList = view === 'list',
) {
  clearTimeout(searchFitTimer);
  pendingSearchFit = false;
  details.show(point, position, name, inList);
  map.select(point);
  if (writeHistory && pointNumberFromUrl(new URL(location.href)) !== point.properties.number) {
    history.pushState(null, '', pointUrl(new URL(location.href), point.properties.number));
  }
}

function toggleFavorite(point: Kunstpunkt) {
  if (!favorites.toggle(point.id)) return;
  const active = document.activeElement;
  const focusedFavorite =
    active instanceof HTMLButtonElement ? active.dataset.favoriteId : undefined;
  const inDetails = active instanceof HTMLElement && !!active.closest('#detail-sheet');
  const participantSlug =
    active instanceof HTMLElement
      ? active.closest<HTMLElement>('[data-participant]')?.dataset.participant
      : undefined;
  render(false);
  if (focusedFavorite) {
    const buttons = [...document.querySelectorAll<HTMLButtonElement>('[data-favorite-id]')];
    const target = buttons.find(
      (button) =>
        button.dataset.favoriteId === focusedFavorite &&
        button.closest<HTMLElement>('[data-participant]')?.dataset.participant ===
          participantSlug &&
        !!button.closest('#detail-sheet') === inDetails &&
        !button.closest('[hidden]'),
    );
    (target ?? required<HTMLButtonElement>('#favorites-view')).focus({ preventScroll: true });
  }
  notify(
    favorites.has(point.id)
      ? `Kunstpunkt ${point.properties.number} auf diesem Gerät gemerkt.`
      : `Kunstpunkt ${point.properties.number} aus den Favoriten entfernt.`,
  );
}

window.addEventListener('storage', (event) => {
  if (event.key === FAVORITES_KEY || event.key === null) {
    favorites.reload();
    render(false);
  }
});
required('#favorites-view').addEventListener('click', () => {
  filters.favoritesOnly = !filters.favoritesOnly;
  if (details.selected) details.hide(false);
  if (filters.favoritesOnly && !desktop.matches) setView('list');
  render();
});

function notify(message: string, persistent = false) {
  const notice = required('#notice');
  clearTimeout(noticeTimer);
  notice.textContent = message;
  notice.hidden = false;
  if (!persistent)
    noticeTimer = setTimeout(() => {
      notice.hidden = true;
    }, 7000);
}

async function sharePoint(point: Kunstpunkt) {
  const url = pointUrl(new URL(location.href), point.properties.number).href;
  try {
    if (navigator.share)
      await navigator.share({
        title: `Kunstpunkt ${point.properties.number} · ${point.properties.address}`,
        url,
      });
    else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      notify('Link kopiert.');
    } else notify('Der Link steht in der Adresszeile. Du kannst ihn dort kopieren.', true);
  } catch (error) {
    if (!(error instanceof Error && error.name === 'AbortError'))
      notify('Teilen nicht möglich. Kopiere den Link aus der Adresszeile.');
  }
}

function restoreUrl() {
  if (!dataset) return;
  const url = new URL(location.href);
  const number = pointNumberFromUrl(url);
  const point = dataset.features.find((item) => item.properties.number === number);
  replayingHistory = true;
  if (point) {
    if (
      focusedParticipant &&
      !point.properties.participants.some((person) => person.slug === focusedParticipant!.slug)
    ) {
      focusedParticipant = null;
      render();
    }
    if (
      !filterPoints(dataset.features, searchIndex, filters, favorites.ids).some(
        (item) => item.id === point.id,
      )
    )
      resetFilters();
    selectPoint(point, false);
  } else {
    if (details.selected) details.hide();
    if (url.searchParams.has('punkt'))
      notify(
        'Dieser Kunstpunkt wurde nicht gefunden. Alle Standorte bleiben über die Suche erreichbar.',
      );
  }
  replayingHistory = false;
}
window.addEventListener('popstate', restoreUrl);

function setView(next: 'map' | 'list') {
  view = next;
  required('#map-view').hidden = !desktop.matches && view !== 'map';
  required('#list-view').hidden = !desktop.matches && view !== 'list';
  for (const name of ['map', 'list'] as const) {
    const button = required(`#view-${name}`);
    button.setAttribute('aria-pressed', String(view === name));
    button.classList.toggle('active', view === name);
  }
  map.resize();
  if (pendingSearchFit && (view === 'map' || desktop.matches)) fitSearchResults();
}
required('#view-map').addEventListener('click', () => setView('map'));
required('#view-list').addEventListener('click', () => setView('list'));
required('#map-reset').addEventListener('click', () => map.fit());
desktop.addEventListener('change', () => setView(view));
setView(view);
required('#sort').addEventListener('change', () => render(false));
required<HTMLButtonElement>('#locate').addEventListener('click', async () => {
  const button = required<HTMLButtonElement>('#locate');
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  notify('Dein Standort wird ermittelt …', true);
  try {
    position = await locate(navigator.geolocation);
    const time = new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Berlin',
    }).format(position.timestamp);
    const locationInfo = `Standort von ${time} Uhr (Berlin), Genauigkeit ca. ${Math.round(position.accuracy)} m. Zum Aktualisieren erneut „Standort“ wählen.`;
    required('#location-info').textContent = locationInfo;
    notify(
      position.accuracy > 100
        ? `Dein Standort ist nur ungefähr bekannt. ${locationInfo}`
        : locationInfo,
    );
    required('#nearby-controls').hidden = false;
    required<HTMLSelectElement>('#sort').value = 'distance';
    render(false);
    map.showLocation(position);
    if (details.selected) details.show(details.selected, position, filters.query);
  } catch (error) {
    notify(
      error instanceof Error ? error.message : 'Der Standort konnte nicht ermittelt werden.',
      true,
    );
  } finally {
    button.disabled = false;
    button.removeAttribute('aria-busy');
  }
});

function renderList(points: Kunstpunkt[]) {
  const fragment = document.createDocumentFragment();
  for (const point of points) {
    const p = point.properties;
    const button = element('button', 'point-card');
    button.dataset.weekend = String(p.weekend);
    button.dataset.number = String(p.number);
    const copy = element('span', 'card-copy');
    copy.append(
      element(
        'span',
        'card-meta',
        `${p.weekend === 1 ? '12./13. September · Nord' : '19./20. September · Süd'}${p.hasOffspace ? ' · ◇ Offraum' : ''}`,
      ),
    );
    copy.append(participantPreview(point, filters.query, 'card-names'));
    copy.append(element('span', 'card-address', p.address));
    if (isCancelled(point)) copy.append(element('span', 'cancelled', 'Teilnahme abgesagt'));
    if (position)
      copy.append(element('span', 'distance', formatDistance(distanceMeters(position, point))));
    button.append(
      element('span', 'number-badge', String(p.number)),
      copy,
      element('span', 'card-arrow', '↗'),
    );
    button.addEventListener('click', () => selectPoint(point, true, undefined, true));
    const row = element('div', 'point-row');
    row.append(
      button,
      favoriteButton(point, favorites.has(point.id), () => toggleFavorite(point)),
    );
    fragment.append(row);
  }
  if (!points.length) {
    const empty = element('div', 'empty-state');
    empty.append(
      element(
        'h3',
        '',
        filters.favoritesOnly ? 'Keine passenden Favoriten' : 'Kein Kunstpunkt gefunden',
      ),
      element(
        'p',
        '',
        filters.favoritesOnly
          ? 'Merke Kunstpunkte mit dem Stern. Wenn du schon Favoriten hast, probiere ein anderes Wochenende oder setze die Filter zurück.'
          : 'Versuche einen anderen Namen oder setze die Filter zurück.',
      ),
    );
    const clear = element('button', 'primary-button', 'Alle Kunstpunkte anzeigen');
    clear.addEventListener('click', resetFilters);
    empty.append(clear);
    fragment.append(empty);
  }
  results.replaceChildren(fragment);
}

function render(fit = false) {
  searchPanel.sync();
  if (!dataset) return;
  let points = filterPoints(dataset.features, searchIndex, filters, favorites.ids);
  if (focusedParticipant)
    points = points.filter((point) =>
      point.properties.participants.some((person) => person.slug === focusedParticipant!.slug),
    );
  required('#participant-focus').hidden = !focusedParticipant;
  required('#participant-focus-name').textContent = focusedParticipant
    ? `Auf Karte: ${focusedParticipant.name}`
    : '';
  if (position) {
    if (required<HTMLSelectElement>('#sort').value === 'distance')
      points = sortByDistance(points, position);
    const nearby = points.filter((point) => distanceMeters(position!, point) <= 500).length;
    required('#nearby-count').textContent =
      `${nearby} Kunstpunkt${nearby === 1 ? '' : 'e'} innerhalb von 500 m Luftlinie`;
  }
  const entries = participantEntries(
    points,
    filters.query,
    !!position && required<HTMLSelectElement>('#sort').value === 'distance',
  ).filter((entry) => !focusedParticipant || entry.slug === focusedParticipant.slug);
  if (browse === 'participants') {
    const pointIds = new Set(
      entries.flatMap((entry) => entry.appearances.map(({ point }) => point.id)),
    );
    points = points.filter((point) => pointIds.has(point.id));
  }
  for (const mode of ['places', 'participants'] as const) {
    required(`#browse-${mode}`).setAttribute('aria-pressed', String(browse === mode));
    required(`#browse-${mode}`).classList.toggle('active', browse === mode);
  }
  required('#participants-hint').hidden = browse !== 'participants';
  count.textContent =
    browse === 'participants'
      ? `${entries.length} ${entries.length === 1 ? 'Eintrag' : 'Einträge'} an ${points.length} ${points.length === 1 ? 'Ort' : 'Orten'}`
      : filters.favoritesOnly
        ? `${points.length} Favorit${points.length === 1 ? '' : 'en'}`
        : `${points.length} Kunstpunkt${points.length === 1 ? '' : 'e'}`;
  required('#list-heading').textContent = filters.favoritesOnly
    ? 'Meine Favoriten'
    : 'Düsseldorf entdecken';
  required('#favorites-hint').hidden = !filters.favoritesOnly;
  const favoriteCount = dataset.features.filter((point) => favorites.has(point.id)).length;
  required('#favorites-count').textContent = String(favoriteCount);
  const favoriteView = required('#favorites-view');
  favoriteView.setAttribute('aria-pressed', String(filters.favoritesOnly));
  favoriteView.setAttribute('aria-label', `Favoriten anzeigen (${favoriteCount})`);
  favoriteView.classList.toggle('active', !!filters.favoritesOnly);
  required('#list-count').textContent = String(
    browse === 'participants' ? entries.length : points.length,
  );
  reset.hidden =
    !filters.query &&
    !filters.weekend &&
    !filters.offspace &&
    !filters.favoritesOnly &&
    !focusedParticipant;
  offspace.setAttribute('aria-pressed', String(filters.offspace));
  offspace.classList.toggle('active', filters.offspace);
  document.querySelectorAll<HTMLButtonElement>('[data-weekend].chip').forEach((button) => {
    const active =
      button.dataset.weekend === (filters.weekend === null ? 'all' : String(filters.weekend));
    button.setAttribute('aria-pressed', String(active));
    button.classList.toggle('active', active);
  });
  if (details.selected && !points.some((point) => point.id === details.selected?.id))
    details.hide(false);
  if (browse === 'participants' && entries.length) {
    results.replaceChildren(
      participantCards(
        entries,
        filters.query,
        {
          select: (point, name) => selectPoint(point, true, name, true),
          showOnMap: showParticipantOnMap,
          hasFavorite: (id) => favorites.has(id),
          toggleFavorite,
        },
        position,
      ),
    );
  } else renderList(points);
  document
    .querySelectorAll<HTMLButtonElement>('[data-favorite-id]')
    .forEach((button) => updateFavoriteButton(button, favorites.has(button.dataset.favoriteId!)));
  map.setPoints(points, fit);
}

function resetFilters() {
  clearTimeout(searchFitTimer);
  pendingSearchFit = false;
  focusedParticipant = null;
  Object.assign(filters, { query: '', weekend: null, offspace: false, favoritesOnly: false });
  search.value = '';
  render();
}
search.addEventListener('input', () => {
  focusedParticipant = null;
  filters.query = search.value;
  if (details.selected) details.hide(false);
  render();
  scheduleSearchFit();
});
reset.addEventListener('click', resetFilters);
offspace.addEventListener('click', () => {
  filters.offspace = !filters.offspace;
  render();
});
document.querySelectorAll<HTMLButtonElement>('.chip[data-weekend]').forEach((button) => {
  button.addEventListener('click', () => {
    filters.weekend =
      button.dataset.weekend === 'all' ? null : (Number(button.dataset.weekend) as Weekend);
    render();
  });
});

async function loadData() {
  status.textContent = 'Ateliers und Offräume werden geladen.';
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/kunstpunkte-2026.json`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const candidate: Dataset = await response.json();
    if (
      candidate.type !== 'FeatureCollection' ||
      candidate.event?.year !== 2026 ||
      !Array.isArray(candidate.features) ||
      !candidate.features.length
    )
      throw new Error('Ungültiger Datensatz');
    dataset = candidate;
    searchIndex = createSearchIndex(dataset.features);
    required('#data-date').textContent =
      `Daten abgerufen am ${new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' }).format(new Date(dataset.source.retrievedAt))} Uhr (Berlin).`;
    status.textContent = '';
    render(true);
    restoreUrl();
  } catch {
    setView('list');
    count.textContent = 'Daten nicht verfügbar';
    status.textContent =
      'Die Kunstpunkte konnten nicht geladen werden. Bitte prüfe deine Verbindung.';
    const retry = element('button', 'primary-button', 'Erneut versuchen');
    retry.addEventListener('click', () => {
      results.replaceChildren();
      void loadData();
    });
    results.replaceChildren(
      retry,
      externalLink(
        'Zur offiziellen Teilnehmerliste ↗',
        'https://kunstpunkte.de/teilnehmer-innen.html',
        'fallback-link',
      ),
    );
  }
}
void loadData();
