import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Dataset } from '../src/model.ts';
import { distanceMeters, formatDistance, locate, sortByDistance } from '../src/location.ts';
import { pointUrl, pointNumberFromUrl, routeUrls } from '../src/navigation.ts';

const data: Dataset = JSON.parse(
  readFileSync(new URL('../public/data/kunstpunkte-2026.json', import.meta.url), 'utf8'),
);
const point = data.features.find((p) => p.properties.number === 163)!;
const position = {
  lat: point.geometry.coordinates[1],
  lng: point.geometry.coordinates[0],
  accuracy: 10,
  timestamp: Date.now(),
};

test('nearby ordering uses straight-line meters without mutating source order', () => {
  assert.equal(distanceMeters(position, point), 0);
  assert.equal(sortByDistance(data.features, position)[0]?.id, point.id);
  assert.equal(data.features[0]?.properties.number, 1);
  assert.equal(formatDistance(425), '430 m Luftlinie');
  assert.equal(formatDistance(1250), '1,3 km Luftlinie');
  const north = { ...position, lat: position.lat + 0.01 };
  assert.ok(distanceMeters(north, point) > 1100 && distanceMeters(north, point) < 1120);
});

test('navigation links preserve coordinate order and share links preserve the Pages project path', () => {
  const routes = routeUrls(point);
  assert.equal(new URL(routes.google).searchParams.get('destination'), '51.210735,6.82399');
  assert.equal(new URL(routes.apple).searchParams.get('daddr'), '51.210735,6.82399');
  const url = pointUrl(new URL('https://streetblock.github.io/Kunstpunkte-map/?test=1'), 163);
  assert.equal(url.pathname, '/Kunstpunkte-map/');
  assert.equal(url.searchParams.get('test'), '1');
  assert.equal(pointNumberFromUrl(url), 163);
  assert.equal(pointNumberFromUrl(pointUrl(url, null)), null);
  for (const invalid of ['-1', '1e2', '0', '163bad', '9007199254740993']) {
    assert.equal(pointNumberFromUrl(new URL(`https://example.test/?punkt=${invalid}`)), null);
  }
});

test('location uses one explicit query and handles denied, unavailable and timeout results', async () => {
  let calls = 0;
  const success: Pick<Geolocation, 'getCurrentPosition'> = {
    getCurrentPosition(onSuccess, _onError, options) {
      calls++;
      assert.equal(options?.timeout, 12000);
      onSuccess({
        coords: { latitude: position.lat, longitude: position.lng, accuracy: 10 },
        timestamp: position.timestamp,
      } as GeolocationPosition);
    },
  };
  assert.equal(calls, 0);
  assert.deepEqual(await locate(success), position);
  assert.equal(calls, 1);
  await assert.rejects(locate(undefined), /Browser/);
  for (const code of [1, 2, 3]) {
    await assert.rejects(
      locate({
        getCurrentPosition(_success, error) {
          error?.({ code } as GeolocationPositionError);
        },
      }),
    );
  }
  await assert.rejects(
    locate({
      getCurrentPosition(success) {
        success({
          coords: { latitude: NaN, longitude: 7, accuracy: -2 },
          timestamp: Date.now(),
        } as GeolocationPosition);
      },
    }),
    /gültige Position/,
  );
});
