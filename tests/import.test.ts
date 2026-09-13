import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseSource } from '../scripts/parse-source.ts';

const source = readFileSync(new URL('../data/source/gm_daten-2026.js.txt', import.meta.url), 'utf8');
const timestamp = '2026-09-13T12:00:00Z';
const data = parseSource(source, timestamp);

test('2026 snapshot preserves all locations, participants and the actual weekend mapping', () => {
  assert.equal(data.features.length, 196);
  assert.equal(new Set(data.features.map(p => p.id)).size, 196);
  assert.equal(data.features.reduce((n, p) => n + p.properties.participants.length, 0), 416);
  assert.equal(data.features.filter(p => p.properties.weekend === 1).length, 103);
  assert.equal(data.features.filter(p => p.properties.weekend === 2).length, 93);
  assert.equal(data.features.filter(p => p.properties.hasOffspace).length, 28);
  assert.ok(Buffer.byteLength(JSON.stringify(data)) < 200_000);
  assert.deepEqual(data.features[0]?.geometry.coordinates, [6.799384, 51.237407]);
});

test('group studios, entities and participant cancellations retain their meaning', () => {
  const studio = data.features.find(p => p.properties.number === 194)!;
  assert.equal(studio.properties.participants.length, 22);
  assert.equal(studio.properties.address, 'Walzwerkstraße 14, Stephanstraße 10');
  assert.ok(data.features[0]!.properties.participants[0]!.name.includes('Obrez‑Schmidt'));
  assert.equal(data.features.find(p => p.properties.number === 152)!.properties.participants[0]!.cancelled, true);
  const group = data.features.find(p => p.properties.number === 163)!.properties.participants;
  assert.equal(group.find(p => p.slug === 'gudrun-kemsa')?.cancelled, true);
  assert.ok(group.some(p => !p.cancelled));
});

test('format changes and executable content fail instead of producing partial data', () => {
  for (const broken of [
    source + '; globalThis.executed = true;',
    source.replace('jahr:2026', 'jahr:2027'),
    source.replace(':ks:1:', ':xx:1:'),
    source.replace(':ks:2:', ':ks:1:'),
    source.replace('51.237407', '999.999'),
    source.replace(':ingeborg-obrez-schmidt:', ':../escape:'),
    source.replace('Ingeborg Obrez', '<script>alert(1)</script>Ingeborg Obrez'),
    source.replace(':ingeborg-obrez-schmidt:Ingeborg', ':Ingeborg'),
  ]) assert.throws(() => parseSource(broken, timestamp));
});
