import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createFavorites, FAVORITES_KEY } from '../src/favorites.ts';
import { createSearchIndex, filterPoints } from '../src/search.ts';
import type { Dataset } from '../src/model.ts';

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}

test('favorites survive a fresh store and removals are persisted without touching other data', () => {
  const storage = memoryStorage();
  storage.setItem('other-project', 'keep');
  const favorites = createFavorites(() => storage, assert.fail);
  assert.equal(favorites.toggle('2026-2'), true);
  assert.equal(favorites.toggle('2026-163'), true);
  const reloaded = createFavorites(() => storage, assert.fail);
  assert.deepEqual([...reloaded.ids], ['2026-163', '2026-2']);
  assert.equal(reloaded.has('2027-2'), false);
  assert.equal(reloaded.toggle('2026-2'), true);
  assert.equal(createFavorites(() => storage, assert.fail).has('2026-2'), false);
  assert.equal(storage.getItem('other-project'), 'keep');
});

test('favorites intersect with weekends, search and offspace filters', () => {
  const data: Dataset = JSON.parse(
    readFileSync(new URL('../public/data/kunstpunkte-2026.json', import.meta.url), 'utf8'),
  );
  const index = createSearchIndex(data.features);
  const ids = new Set(['2026-2', '2026-4', '2026-163', '2027-2']);
  const find = (weekend: 1 | 2 | null, query = '', offspace = false) =>
    filterPoints(data.features, index, { query, weekend, offspace, favoritesOnly: true }, ids);
  assert.deepEqual(
    find(null).map((p) => p.properties.number),
    [2, 4, 163],
  );
  assert.deepEqual(
    find(1).map((p) => p.properties.number),
    [2, 4],
  );
  assert.deepEqual(
    find(2).map((p) => p.properties.number),
    [163],
  );
  assert.deepEqual(
    find(1, 'wildf').map((p) => p.properties.number),
    [2],
  );
  assert.deepEqual(
    find(1, '', true).map((p) => p.properties.number),
    [4],
  );
  assert.equal(find(2, 'wildf').length, 0);
});

test('blocked storage and failed writes do not claim a favorite was saved', () => {
  const errors: string[] = [];
  const blocked = createFavorites(
    () => {
      throw new Error('Blocked');
    },
    (message) => errors.push(message),
  );
  assert.equal(blocked.toggle('2026-2'), false);
  assert.equal(blocked.has('2026-2'), false);
  const storage = memoryStorage();
  storage.setItem(FAVORITES_KEY, '{"version":1,"ids":["2026-2"]}');
  const full = createFavorites(
    () => ({
      getItem: storage.getItem,
      setItem() {
        throw new Error('Quota');
      },
    }),
    (message) => errors.push(message),
  );
  assert.equal(full.toggle('2026-2'), false);
  assert.equal(full.has('2026-2'), true);
  assert.ok(errors.some((message) => message.includes('nicht gespeichert')));
});

test('corrupt data does not crash and stale tabs preserve newly saved favorites', () => {
  const storage = memoryStorage();
  storage.setItem(FAVORITES_KEY, 'broken JSON');
  const errors: string[] = [];
  const first = createFavorites(
    () => storage,
    (message) => errors.push(message),
  );
  assert.equal(first.ids.size, 0);
  assert.equal(errors.length, 1);
  first.toggle('2026-2');
  const second = createFavorites(() => storage, assert.fail);
  first.toggle('2026-163');
  second.toggle('2026-4');
  first.reload();
  assert.deepEqual([...first.ids].sort(), ['2026-163', '2026-2', '2026-4']);
  assert.equal(first.toggle('invalid'), false);
});
