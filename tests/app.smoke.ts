import { readFileSync, readdirSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM, VirtualConsole } from 'jsdom';

const files = readdirSync(new URL('../dist/assets/', import.meta.url));
const bundle = files.find((file) => /^index-.*\.js$/.test(file));
assert.ok(bundle, 'Build first: npm run build');
const script = readFileSync(new URL(`../dist/assets/${bundle}`, import.meta.url), 'utf8');
const dataset = JSON.parse(
  readFileSync(new URL('../public/data/kunstpunkte-2026.json', import.meta.url), 'utf8'),
);

async function start(url = 'https://streetblock.github.io/Kunstpunkte-map/', failFetch = false) {
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
    assert.equal(document.querySelector('#detail-summary mark')?.textContent, 'Dagmar Wildförster');
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

test('direct Pages link opens the requested studio and invalid links remain recoverable', async () => {
  const app = await start('https://streetblock.github.io/Kunstpunkte-map/?punkt=163');
  try {
    const doc = app.dom.window.document;
    assert.equal(doc.querySelector<HTMLElement>('#detail-sheet')!.hidden, false);
    assert.equal(doc.querySelector('#detail-title')?.textContent, 'Lierenfelder Straße 39');
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
