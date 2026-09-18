import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { webcrypto } from 'node:crypto';

const scope = 'https://streetblock.github.io/Kunstpunkte-map/';
const source = readFileSync(new URL('../dist/sw.js', import.meta.url), 'utf8');
type Store = Map<string, Map<string, Response>>;

function worker(store: Store = new Map(), script = source) {
  const listeners = new Map<string, (event: Record<string, unknown>) => void>();
  let online = true;
  let corrupt = false;
  let requests = 0;
  const caches = {
    async open(name: string) {
      if (!store.has(name)) store.set(name, new Map());
      const cache = store.get(name)!;
      return {
        async put(url: string, response: Response) {
          cache.set(url, response.clone());
        },
        async match(url: string) {
          return cache.get(url)?.clone();
        },
      };
    },
    async keys() {
      return [...store.keys()];
    },
    async delete(name: string) {
      return store.delete(name);
    },
  };
  runInNewContext(script, {
    URL,
    Request,
    Response,
    Uint8Array,
    crypto: webcrypto,
    caches,
    self: {
      registration: { scope },
      clients: { async claim() {} },
      addEventListener(type: string, callback: (event: Record<string, unknown>) => void) {
        listeners.set(type, callback);
      },
    },
    async fetch(request: Request) {
      requests++;
      if (!online) throw new Error('Network unavailable');
      assert.ok(request.url.startsWith(scope));
      const path = request.url.slice(scope.length);
      return new Response(
        corrupt
          ? 'incomplete deployment'
          : readFileSync(new URL(`../dist/${path}`, import.meta.url)),
      );
    },
  });
  async function lifecycle(type: string) {
    let promise: Promise<unknown> | undefined;
    listeners.get(type)!({
      waitUntil(value: Promise<unknown>) {
        promise = value;
      },
    });
    await promise;
  }
  return {
    store,
    caches,
    lifecycle,
    setOnline(value: boolean) {
      online = value;
    },
    setCorrupt(value: boolean) {
      corrupt = value;
    },
    requests: () => requests,
    async fetch(url: string, mode = 'cors') {
      let response: Promise<Response> | undefined;
      listeners.get('fetch')!({
        request: { url, method: 'GET', mode },
        respondWith(value: Promise<Response>) {
          response = value;
        },
      });
      return response;
    },
    async status(repair = false) {
      let result: { ready: boolean; version: string } | undefined;
      let promise: Promise<unknown> | undefined;
      listeners.get('message')!({
        data: { type: 'OFFLINE_STATUS', repair },
        ports: [
          {
            postMessage(value: typeof result) {
              result = value;
            },
          },
        ],
        waitUntil(value: Promise<unknown>) {
          promise = value;
        },
      });
      await promise;
      return result!;
    },
  };
}

test('installable manifest resolves within the Pages project and includes valid sized icons', () => {
  const manifest = JSON.parse(
    readFileSync(new URL('../dist/manifest.webmanifest', import.meta.url), 'utf8'),
  );
  assert.equal(new URL(manifest.start_url, scope).href, scope);
  assert.equal(new URL(manifest.scope, scope).href, scope);
  assert.equal(manifest.display, 'standalone');
  for (const icon of manifest.icons) {
    const png = readFileSync(new URL(`../dist/${icon.src}`, import.meta.url));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
  assert.ok(manifest.icons.some((icon: { purpose: string }) => icon.purpose === 'maskable'));
});

test('complete production shell, deep links and metadata survive network loss; tiles stay outside cache', async () => {
  const app = worker();
  await app.lifecycle('install');
  await app.lifecycle('activate');
  assert.equal((await app.status()).ready, true);
  const requests = app.requests();
  app.setOnline(false);
  assert.match(
    await (await app.fetch(scope + '?punkt=157', 'navigate'))!.text(),
    /manifest.webmanifest/,
  );
  const data = await (await app.fetch(scope + 'data/kunstpunkte-2026.json'))!.json();
  assert.ok(data);
  for (const cache of app.store.values()) {
    for (const url of cache.keys()) assert.equal((await app.fetch(url))!.status, 200);
  }
  assert.equal(await app.fetch('https://tile.openstreetmap.org/12/2114/1353.png'), undefined);
  assert.equal(await app.fetch('https://streetblock.github.io/other/', 'navigate'), undefined);
  assert.equal(app.requests(), requests);
});

test('incomplete or interrupted updates preserve the previous complete cache', async () => {
  const old = worker();
  await old.lifecycle('install');
  const prior = [...old.store.keys()];
  const nextSource = source.replace(/const version = '[^']+'/, "const version = 'next-release'");
  assert.notEqual(nextSource, source);
  const next = worker(old.store, nextSource);
  next.setCorrupt(true);
  await assert.rejects(next.lifecycle('install'), /Inconsistent deployment/);
  assert.deepEqual([...old.store.keys()], prior);
  next.setCorrupt(false);
  next.setOnline(false);
  await assert.rejects(next.lifecycle('install'), /Network unavailable/);
  assert.deepEqual([...old.store.keys()], prior);
  assert.equal((await old.status()).ready, true);
});

test('activation clears only obsolete caches of this project', async () => {
  const app = worker();
  await app.caches.open('kunstpunkte:/Kunstpunkte-map/:old');
  await app.caches.open('kunstpunkte:/another-project/:old');
  await app.lifecycle('install');
  await app.lifecycle('activate');
  assert.equal(app.store.has('kunstpunkte:/Kunstpunkte-map/:old'), false);
  assert.equal(app.store.has('kunstpunkte:/another-project/:old'), true);
  assert.equal((await app.status()).ready, true);
});

test('evicted cache reports missing offline files and repairs them only with verified online content', async () => {
  const app = worker();
  await app.lifecycle('install');
  app.store.clear();
  app.setOnline(false);
  assert.equal((await app.status()).ready, false);
  assert.equal((await app.fetch(scope, 'navigate'))!.status, 503);
  app.setOnline(true);
  app.setCorrupt(true);
  assert.equal((await app.status(true)).ready, false);
  app.setCorrupt(false);
  assert.equal((await app.status(true)).ready, true);
});
