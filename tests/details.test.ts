import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import type { Dataset } from '../src/model.ts';
import { createDetails } from '../src/details.ts';
import { participantPreview } from '../src/participant-preview.ts';

const data: Dataset = JSON.parse(readFileSync(new URL('../public/data/kunstpunkte-2026.json', import.meta.url), 'utf8'));

test('details expose a complete group studio, correct route links and keyboard close', () => {
  const dom = new JSDOM('<input id="search"><button id="origin">Open</button><section id="detail-sheet" hidden><button id="detail-close">Close</button><div id="detail-summary"></div><button id="detail-toggle"></button><div id="detail-body"></div></section>', { url: 'https://example.test' });
  const oldDocument = globalThis.document, oldHTMLElement = globalThis.HTMLElement;
  Object.assign(globalThis, { document: dom.window.document, HTMLElement: dom.window.HTMLElement });
  try {
    const document = dom.window.document;
    let closed = 0, shared = 0;
    const details = createDetails(() => { closed++; }, () => { shared++; });
    document.querySelector<HTMLButtonElement>('#origin')!.focus();
    details.show(data.features.find(p => p.properties.number === 194)!);
    assert.equal(document.querySelectorAll('.participant-list li').length, 22);
    assert.equal(document.querySelector('#detail-toggle')?.getAttribute('aria-expanded'), 'false');
    document.querySelector<HTMLButtonElement>('#detail-toggle')!.click();
    assert.equal(document.querySelector('#detail-toggle')?.getAttribute('aria-expanded'), 'true');
    assert.equal(document.querySelector<HTMLElement>('#detail-body')!.hidden, false);
    assert.ok(document.querySelector<HTMLAnchorElement>('.primary-button')!.href.includes('destination=51.178882%2C6.855469'));
    document.querySelector<HTMLButtonElement>('.share-button')!.click();
    assert.equal(shared, 1);
    details.show(data.features.find(p => p.properties.number === 163)!);
    assert.equal(document.querySelectorAll('.participant-list .cancelled').length, 1);
    assert.equal(document.querySelectorAll('#detail-summary .cancelled').length, 0);
    const wildfoerster = data.features.find(p => p.properties.number === 2)!;
    const preview = participantPreview(wildfoerster, 'wildf', 'card-names');
    assert.ok(preview.textContent?.startsWith('Dagmar Wildförster'));
    assert.equal(preview.querySelector('mark')?.textContent, 'Dagmar Wildförster');
    details.show(wildfoerster, undefined, 'wildf');
    assert.equal(document.querySelector('#detail-summary mark')?.textContent, 'Dagmar Wildförster');
    assert.equal(document.querySelector('.participant-list li mark')?.textContent, 'Dagmar Wildförster');
    document.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'Escape' }));
    assert.equal(closed, 1);
    assert.equal(document.querySelector<HTMLElement>('#detail-sheet')!.hidden, true);
    assert.equal(document.activeElement?.id, 'origin');
  } finally {
    Object.assign(globalThis, { document: oldDocument, HTMLElement: oldHTMLElement });
    dom.window.close();
  }
});
