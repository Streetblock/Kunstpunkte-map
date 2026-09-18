import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM, VirtualConsole } from 'jsdom';
import { FAVORITES_KEY } from '../src/favorites.ts';

const files = readdirSync(new URL('../dist/assets/', import.meta.url));
const bundle = files.find((file) => /^index-.*\.js$/.test(file));
assert.ok(bundle, 'Build first: npm run build');
const script = readFileSync(new URL(`../dist/assets/${bundle}`, import.meta.url), 'utf8');
const dataset = JSON.parse(
  readFileSync(new URL('../public/data/kunstpunkte-2026.json', import.meta.url), 'utf8'),
);

async function start(
  url = 'https://streetblock.github.io/Kunstpunkte-map/',
  failFetch = false,
  favorites: { saved?: string; blocked?: boolean } = {},
  offline = false,
) {
  const errors: Error[] = [];
  const console = new VirtualConsole();
  console.on('jsdomError', (error) => errors.push(error));
  const dom = new JSDOM('<!doctype html><html><body><div id="app"></div></body></html>', {
    url,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
    virtualConsole: console,
  });
  const win = dom.window;
  Object.defineProperty(win.navigator, 'onLine', { value: !offline });
  // jsdom has no native dialog top layer; browser QA covers focus trapping/backdrop.
  win.HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '');
  };
  win.HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open');
  };
  if (favorites.saved) win.localStorage.setItem(FAVORITES_KEY, favorites.saved);
  if (favorites.blocked)
    Object.defineProperty(win, 'localStorage', {
      get() {
        throw new Error('Blocked storage');
      },
    });
  let locationQueries = 0;
  Object.defineProperty(win.navigator, 'geolocation', {
    value: {
      getCurrentPosition(_success: unknown, error: (value: { code: number }) => void) {
        locationQueries++;
        error({ code: 1 });
      },
    },
  });
  Object.assign(win, {
    matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
    ResizeObserver: class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
    fetch: async (url: string) => {
      assert.ok(url.endsWith('data/kunstpunkte-2026.json'));
      if (failFetch) throw new Error('Offline');
      return { ok: true, json: async () => dataset };
    },
  });
  try {
    win.eval(script);
    await new Promise((resolve) => setTimeout(resolve, 50));
    assert.deepEqual(errors, []);
    return { dom, errors, locationQueries: () => locationQueries };
  } catch (error) {
    dom.window.close();
    throw error;
  }
}

test('offline startup selects the list and explains offline support without hiding the app', async () => {
  const app = await start(undefined, false, {}, true);
  try {
    const document = app.dom.window.document;
    assert.equal(document.querySelector('#view-list')?.getAttribute('aria-pressed'), 'true');
    assert.equal(document.querySelectorAll('.point-card').length, 196);
    assert.equal(document.querySelector<HTMLElement>('#pwa-banner')?.hidden, false);
    assert.match(
      document.querySelector('#offline-state')!.textContent!,
      /keine Offline-Speicherung/,
    );
    assert.deepEqual(app.errors, []);
  } finally {
    app.dom.window.close();
  }
});

test('installation action appears only with a browser prompt and is consumed once', async () => {
  const app = await start();
  try {
    const win = app.dom.window;
    const install = win.document.querySelector<HTMLButtonElement>('#app-install')!;
    assert.equal(install.hidden, true);
    let prompts = 0;
    const event = new win.Event('beforeinstallprompt', { cancelable: true });
    Object.assign(event, {
      prompt: async () => {
        prompts++;
      },
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    });
    win.dispatchEvent(event);
    assert.equal(event.defaultPrevented, true);
    assert.equal(install.hidden, false);
    install.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(prompts, 1);
    assert.equal(install.hidden, true);
    assert.match(
      win.document.querySelector('.pwa-info')!.textContent!,
      /Als App geöffnet oder installiert/,
    );
    assert.deepEqual(app.errors, []);
  } finally {
    app.dom.window.close();
  }
});

test('production app starts, filters and visibly promotes Wildförster without asking for location', async () => {
  const app = await start();
  try {
    const { document } = app.dom.window;
    assert.equal(document.querySelectorAll('.point-card').length, 196);
    assert.equal(app.locationQueries(), 0);
    const search = document.querySelector<HTMLInputElement>('#search')!;
    search.value = 'wildf';
    search.dispatchEvent(new app.dom.window.Event('input'));
    assert.equal(document.querySelectorAll('.point-card').length, 1);
    assert.equal(document.querySelector('.point-card mark')?.textContent, 'Dagmar Wildförster');
    document.querySelector<HTMLButtonElement>('.point-card')!.click();
    assert.equal(document.querySelector('#detail-title')?.textContent, 'Dagmar Wildförster');
    assert.equal(new URL(app.dom.window.location.href).searchParams.get('punkt'), '2');
    assert.ok(document.querySelector('#map-attribution a')?.textContent?.includes('OpenStreetMap'));
    document.querySelector<HTMLButtonElement>('#detail-close')!.click();
    document.querySelector<HTMLButtonElement>('#reset')!.click();
    document.querySelector<HTMLButtonElement>('.chip[data-weekend="2"]')!.click();
    assert.equal(document.querySelectorAll('.point-card').length, 93);
    document.querySelector<HTMLButtonElement>('#offspace')!.click();
    assert.equal(document.querySelectorAll('.point-card').length, 10);
    document.querySelector<HTMLButtonElement>('#locate')!.click();
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(app.locationQueries(), 1);
    assert.match(document.querySelector('#notice')!.textContent!, /nicht erlaubt/);
    assert.equal(document.querySelector<HTMLButtonElement>('#locate')!.disabled, false);
    assert.deepEqual(app.errors, []);
  } finally {
    app.dom.window.close();
  }
});

test('compact search restores focus and keeps a collapsed query visible until explicitly cleared', async () => {
  const app = await start();
  try {
    const doc = app.dom.window.document;
    const toggle = doc.querySelector<HTMLButtonElement>('#search-toggle')!;
    const input = doc.querySelector<HTMLInputElement>('#search')!;
    assert.equal(doc.querySelector<HTMLElement>('#search-controls')!.hidden, true);
    toggle.click();
    assert.equal(doc.activeElement, input);
    assert.equal(toggle.getAttribute('aria-expanded'), 'true');
    input.value = 'wildf';
    input.dispatchEvent(new app.dom.window.Event('input'));
    input.dispatchEvent(
      new app.dom.window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    assert.equal(doc.activeElement, toggle);
    assert.equal(doc.querySelector<HTMLElement>('#search-controls')!.hidden, true);
    assert.equal(doc.querySelector<HTMLElement>('#active-search')!.hidden, false);
    assert.match(doc.querySelector('#search-edit')!.textContent!, /wildf/);
    assert.equal(doc.querySelectorAll('.point-card').length, 1);
    doc.querySelector<HTMLButtonElement>('#search-edit')!.click();
    assert.equal(doc.activeElement, input);
    doc.querySelector<HTMLButtonElement>('#search-close')!.click();
    doc.querySelector<HTMLButtonElement>('#search-clear')!.click();
    assert.equal(input.value, '');
    assert.equal(doc.querySelector<HTMLElement>('#active-search')!.hidden, true);
    assert.equal(doc.querySelectorAll('.point-card').length, 196);
  } finally {
    app.dom.window.close();
  }
});

test('direct Pages link opens the requested studio and invalid links remain recoverable', async () => {
  const app = await start('https://streetblock.github.io/Kunstpunkte-map/?punkt=163');
  try {
    const doc = app.dom.window.document;
    assert.equal(doc.querySelector<HTMLElement>('#detail-sheet')!.hidden, false);
    assert.match(
      doc.querySelector('#detail-title')!.textContent!,
      /Atelierhaus Lierenfelder Straße/,
    );
    assert.equal(doc.querySelector('.detail-address')?.textContent, 'Lierenfelder Straße 39');
    assert.equal(doc.querySelectorAll('.participant-list .cancelled').length, 1);
  } finally {
    app.dom.window.close();
  }
  const invalid = await start('https://streetblock.github.io/Kunstpunkte-map/?punkt=9999');
  try {
    assert.match(
      invalid.dom.window.document.querySelector('#notice')!.textContent!,
      /nicht gefunden/,
    );
    assert.equal(invalid.dom.window.document.querySelectorAll('.point-card').length, 196);
  } finally {
    invalid.dom.window.close();
  }
});

test('data load failure exposes a retry and original list without an inaccessible map-only error', async () => {
  const app = await start(undefined, true);
  try {
    const doc = app.dom.window.document;
    assert.equal(doc.querySelector<HTMLElement>('#list-view')!.hidden, false);
    assert.equal(doc.querySelector('#result-count')?.textContent, 'Daten nicht verfügbar');
    assert.equal(
      doc.querySelector<HTMLButtonElement>('#results button')?.textContent,
      'Erneut versuchen',
    );
    assert.equal(doc.querySelectorAll('.fallback-link').length, 1);
  } finally {
    app.dom.window.close();
  }
});

test('favorites from list and details survive restart and combine with weekend and search filters', async () => {
  const app = await start();
  let saved: string;
  try {
    const doc = app.dom.window.document;
    doc.querySelector<HTMLButtonElement>('#view-list')!.click();
    const star = doc.querySelector<HTMLButtonElement>('[data-favorite-id="2026-2"]')!;
    star.focus();
    star.click();
    assert.equal(
      doc.querySelector('[data-favorite-id="2026-2"]')?.getAttribute('aria-pressed'),
      'true',
    );
    assert.equal((doc.activeElement as HTMLElement).dataset.favoriteId, '2026-2');
    assert.equal(doc.querySelector<HTMLElement>('#detail-sheet')!.hidden, true);
    doc.querySelector<HTMLButtonElement>('.point-card[data-number="163"]')!.click();
    doc.querySelector<HTMLButtonElement>('#detail-summary .favorite-button')!.click();
    assert.equal(
      doc.querySelector('#detail-summary .favorite-button')?.getAttribute('aria-pressed'),
      'true',
    );
    assert.equal(doc.querySelector('#favorites-count')?.textContent, '2');
    saved = app.dom.window.localStorage.getItem(FAVORITES_KEY)!;
    assert.deepEqual(JSON.parse(saved).ids, ['2026-163', '2026-2']);
  } finally {
    app.dom.window.close();
  }
  const reloaded = await start(undefined, false, { saved });
  let afterRemoval: string;
  try {
    const doc = reloaded.dom.window.document;
    assert.equal(doc.querySelector('#favorites-count')?.textContent, '2');
    doc.querySelector<HTMLButtonElement>('#favorites-view')!.click();
    assert.equal(doc.querySelector<HTMLElement>('#list-view')!.hidden, false);
    assert.equal(doc.querySelectorAll('.point-card').length, 2);
    doc.querySelector<HTMLButtonElement>('.chip[data-weekend="1"]')!.click();
    assert.equal(doc.querySelectorAll('.point-card').length, 1);
    assert.equal(doc.querySelector<HTMLElement>('.point-card')?.dataset.number, '2');
    const search = doc.querySelector<HTMLInputElement>('#search')!;
    search.value = 'wildf';
    search.dispatchEvent(new reloaded.dom.window.Event('input'));
    assert.equal(doc.querySelector('.point-card mark')?.textContent, 'Dagmar Wildförster');
    search.value = '';
    search.dispatchEvent(new reloaded.dom.window.Event('input'));
    doc.querySelector<HTMLButtonElement>('.chip[data-weekend="2"]')!.click();
    assert.equal(doc.querySelector<HTMLElement>('.point-card')?.dataset.number, '163');
    doc.querySelector<HTMLButtonElement>('.point-card')!.click();
    doc.querySelector<HTMLButtonElement>('#detail-summary .favorite-button')!.click();
    assert.equal(doc.querySelectorAll('.point-card').length, 0);
    assert.equal(doc.querySelector<HTMLElement>('#detail-sheet')!.hidden, true);
    assert.match(doc.querySelector('.empty-state')!.textContent!, /Keine passenden Favoriten/);
    assert.equal(doc.querySelector('#favorites-count')?.textContent, '1');
    afterRemoval = reloaded.dom.window.localStorage.getItem(FAVORITES_KEY)!;
    assert.deepEqual(reloaded.errors, []);
  } finally {
    reloaded.dom.window.close();
  }
  const final = await start(undefined, false, { saved: afterRemoval });
  try {
    assert.equal(final.dom.window.document.querySelector('#favorites-count')?.textContent, '1');
    assert.equal(
      final.dom.window.document
        .querySelector('[data-favorite-id="2026-163"]')
        ?.getAttribute('aria-pressed'),
      'false',
    );
  } finally {
    final.dom.window.close();
  }
});

test('blocked favorites storage keeps the app usable and never reports a successful save', async () => {
  const app = await start(undefined, false, { blocked: true });
  try {
    const doc = app.dom.window.document;
    assert.equal(doc.querySelectorAll('.point-card').length, 196);
    doc.querySelector<HTMLButtonElement>('[data-favorite-id="2026-2"]')!.click();
    assert.equal(
      doc.querySelector('[data-favorite-id="2026-2"]')?.getAttribute('aria-pressed'),
      'false',
    );
    assert.match(doc.querySelector('#notice')!.textContent!, /nicht gespeichert/);
    assert.equal(doc.querySelector('#favorites-count')?.textContent, '0');
    assert.deepEqual(app.errors, []);
  } finally {
    app.dom.window.close();
  }
});

test('favorites follow changes in another tab without a page reload', async () => {
  const app = await start();
  try {
    const win = app.dom.window;
    win.document.querySelector<HTMLButtonElement>('#favorites-view')!.click();
    win.localStorage.setItem(FAVORITES_KEY, JSON.stringify({ version: 1, ids: ['2026-2'] }));
    win.dispatchEvent(new win.StorageEvent('storage', { key: FAVORITES_KEY }));
    assert.equal(win.document.querySelectorAll('.point-card').length, 1);
    assert.equal(win.document.querySelector('#favorites-count')?.textContent, '1');
    win.localStorage.removeItem(FAVORITES_KEY);
    win.dispatchEvent(new win.StorageEvent('storage', { key: FAVORITES_KEY }));
    assert.equal(win.document.querySelectorAll('.point-card').length, 0);
  } finally {
    app.dom.window.close();
  }
});

test('search preserves the selected map or list view, including confirmation', async () => {
  const app = await start();
  try {
    const doc = app.dom.window.document;
    const input = doc.querySelector<HTMLInputElement>('#search')!;
    doc.querySelector<HTMLButtonElement>('#search-toggle')!.click();
    input.value = 'aura';
    input.dispatchEvent(new app.dom.window.Event('input'));
    assert.equal(doc.querySelector<HTMLElement>('#map-view')!.hidden, false);
    assert.equal(doc.querySelectorAll('.point-card').length, 1);
    input.dispatchEvent(new app.dom.window.KeyboardEvent('keydown', { key: 'Enter' }));
    assert.equal(doc.querySelector<HTMLElement>('#map-view')!.hidden, false);
    doc.querySelector<HTMLButtonElement>('#view-list')!.click();
    input.value = 'wildf';
    input.dispatchEvent(new app.dom.window.Event('input'));
    doc.querySelector<HTMLButtonElement>('#search-close')!.click();
    assert.equal(doc.querySelector<HTMLElement>('#list-view')!.hidden, false);
    assert.equal(doc.querySelector('.card-names mark')!.textContent, 'Dagmar Wildförster');
  } finally {
    app.dom.window.close();
  }
});

test('artist browsing keeps names, addresses, map focus, weekends and location favorites connected', async () => {
  const app = await start();
  try {
    const doc = app.dom.window.document;
    doc.querySelector<HTMLButtonElement>('#view-list')!.click();
    doc.querySelector<HTMLButtonElement>('#browse-participants')!.click();
    assert.equal(doc.querySelectorAll('.participant-card').length, 416);
    const input = doc.querySelector<HTMLInputElement>('#search')!;
    input.value = 'aura';
    input.dispatchEvent(new app.dom.window.Event('input'));
    assert.equal(doc.querySelectorAll('.participant-card').length, 1);
    assert.equal(doc.querySelector('.participant-card h3')!.textContent, 'AURA Kunstraum');
    assert.equal(
      doc.querySelector('.participant-card .card-address')!.textContent,
      'Birkenstraße 67',
    );
    doc.querySelector<HTMLButtonElement>('.appearance-details')!.focus();
    doc.querySelector<HTMLButtonElement>('.appearance-details')!.click();
    assert.ok(doc.querySelector('.list-detail-dialog[open] #detail-sheet'));
    assert.equal(doc.querySelector('#detail-title')!.textContent, 'AURA Kunstraum');
    doc.querySelector<HTMLButtonElement>('#detail-close')!.click();
    assert.equal(doc.querySelector('.list-detail-dialog[open]'), null);
    assert.ok(doc.activeElement?.classList.contains('appearance-details'));
    doc.querySelector<HTMLButtonElement>('.participant-card .favorite-button')!.click();
    assert.equal(doc.querySelector('#favorites-count')!.textContent, '1');
    doc.querySelector<HTMLButtonElement>('.participant-map')!.click();
    assert.equal(doc.querySelector<HTMLElement>('#map-view')!.hidden, false);
    assert.match(doc.querySelector('#participant-focus-name')!.textContent!, /AURA/);
    doc.querySelector<HTMLButtonElement>('.chip[data-weekend="2"]')!.click();
    assert.equal(doc.querySelectorAll('.participant-card').length, 0);
    doc.querySelector<HTMLButtonElement>('#reset')!.click();
    assert.equal(doc.querySelectorAll('.participant-card').length, 416);
    doc.querySelector<HTMLButtonElement>('#favorites-view')!.click();
    assert.equal(doc.querySelectorAll('.participant-card').length, 1);
    assert.equal(doc.querySelector('.participant-card h3')!.textContent, 'AURA Kunstraum');
    assert.deepEqual(app.errors, []);
  } finally {
    app.dom.window.close();
  }
});
