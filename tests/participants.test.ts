import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { Dataset, Kunstpunkt } from '../src/model.ts';
import { participantEntries } from '../src/participants.ts';

const data: Dataset = JSON.parse(
  readFileSync(new URL('../public/data/kunstpunkte-2026.json', import.meta.url), 'utf8'),
);

test('participant browsing exposes all names and finds names, rooms, addresses and exact point numbers', () => {
  assert.equal(participantEntries(data.features).length, 416);
  assert.deepEqual(
    participantEntries(data.features, 'wildf').map((entry) => entry.name),
    ['Dagmar Wildförster'],
  );
  const aura = participantEntries(data.features, 'aura kunstraum');
  assert.equal(aura.length, 1);
  assert.equal(aura[0]!.appearances[0]!.point.properties.address, 'Birkenstraße 67');
  assert.equal(participantEntries(data.features, '185').length, 4);
  assert.equal(participantEntries(data.features, 'Sonnenstraße 38').length, 4);
  assert.equal(participantEntries(data.features, 'Judith Sonnenstraße').length, 1);
  assert.equal(participantEntries(data.features, 'Judith Katrin').length, 0);
});

test('one source identity groups multiple appearances but same-name identities and cancellations stay distinct', () => {
  const first = structuredClone(data.features.find((point) => point.properties.number === 185)!);
  first.properties.participants = [first.properties.participants[0]!];
  const second: Kunstpunkt = structuredClone(first);
  second.id = '2026-999';
  second.properties.number = 999;
  second.properties.weekend = 1;
  second.properties.participants[0]!.cancelled = true;
  second.properties.participants.push({
    ...second.properties.participants[0]!,
    slug: 'different-person-with-same-name',
  });
  const entries = participantEntries([first, second]);
  assert.equal(entries.length, 2);
  const original = entries.find((entry) => entry.slug === first.properties.participants[0]!.slug)!;
  assert.equal(original.appearances.length, 2);
  assert.deepEqual(
    original.appearances.map(({ participant }) => participant.cancelled),
    [false, true],
  );
  assert.equal(participantEntries([second], '999').length, 2);
  assert.equal(participantEntries([first, second], '999')[0]!.appearances.length, 1);
});
