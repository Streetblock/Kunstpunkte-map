import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Dataset } from '../src/model.ts';
import { createSearchIndex, filterPoints, normalize, isCancelled } from '../src/search.ts';

const data: Dataset = JSON.parse(readFileSync(new URL('../public/data/kunstpunkte-2026.json', import.meta.url), 'utf8'));
const index = createSearchIndex(data.features);
const find = (query: string, weekend: 1 | 2 | null = null, offspace = false) =>
  filterPoints(data.features, index, { query, weekend, offspace });

test('search matches a printed number exactly and names within group studios', () => {
  assert.deepEqual(find('163').map(p => p.properties.number), [163]);
  assert.deepEqual(find('Kemsa').map(p => p.properties.number), [163]);
  assert.deepEqual(find('1').map(p => p.properties.number), [1]);
  assert.ok(find('Muller').length > 0);
  assert.deepEqual(find('Muller'), find('Müller'));
  assert.equal(find('Walzwerkstrasse 14')[0]?.properties.number, 194);
  assert.equal(normalize('MÜLLER‑Schroll'), 'muller schroll');
});

test('weekend, offspace and text conditions intersect with no duplicated locations', () => {
  assert.equal(find('', 1).length, 103);
  assert.equal(find('', 2).length, 93);
  assert.equal(find('', null, true).length, 28);
  assert.equal(find('', 1, true).length, 18);
  assert.equal(find('', 2, true).length, 10);
  assert.equal(find('163', 1).length, 0);
  assert.equal(find('not-a-real-atelier').length, 0);
  assert.equal(new Set(find('Muller').map(p => p.id)).size, find('Muller').length);
});

test('a cancelled participant does not close a group studio', () => {
  assert.equal(isCancelled(find('152')[0]!), true);
  assert.equal(isCancelled(find('163')[0]!), false);
});
