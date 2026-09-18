/* Filled from the production output by scripts/build-sw.ts. */
const entries = '__PRECACHE__';
const version = '__VERSION__';
const scope = self.registration.scope;
const prefix = `kunstpunkte:${new URL(scope).pathname}:`;
const cacheName = prefix + version;
const resources = new Map(entries.map((entry) => [new URL(entry.path, scope).href, entry.sha256]));
const shell = new URL('index.html', scope).href;

async function verifiedResponse(url) {
  const response = await fetch(new Request(url, { cache: 'reload', credentials: 'same-origin' }));
  if (!response.ok || response.redirected) throw new Error('Offline file unavailable');
  const digest = await crypto.subtle.digest('SHA-256', await response.clone().arrayBuffer());
  const actual = [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
  if (actual !== resources.get(url)) throw new Error('Inconsistent deployment');
  return response;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(cacheName);
      try {
        // Sequential writes ensure no late request can recreate a rejected partial cache.
        for (const url of resources.keys()) await cache.put(url, await verifiedResponse(url));
      } catch (error) {
        await caches.delete(cacheName);
        throw error;
      }
      // No skipWaiting: old windows keep their complete app/data version until closed.
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys())
        if (name.startsWith(prefix) && name !== cacheName) await caches.delete(name);
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  // Only our exact precache allowlist is handled: never tiles, external pages, or other projects.
  const isAppNavigation =
    request.mode === 'navigate' &&
    (url.origin + url.pathname === scope || url.origin + url.pathname === shell);
  const key = isAppNavigation ? shell : url.href;
  if (!resources.has(key)) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(cacheName);
      const cached = await cache.match(key);
      if (cached) return cached;
      try {
        const response = await verifiedResponse(key);
        await cache.put(key, response.clone());
        return response;
      } catch {
        return new Response(
          'Diese Offline-Datei fehlt. Bitte online erneut öffnen und gegebenenfalls alle App-Fenster schließen, damit ein Update aktiviert werden kann.',
          {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          },
        );
      }
    })(),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'OFFLINE_STATUS' || !event.ports[0]) return;
  event.waitUntil(
    (async () => {
      let ready = false;
      try {
        const cache = await caches.open(cacheName);
        if (event.data.repair) {
          for (const url of resources.keys()) {
            if (!(await cache.match(url))) await cache.put(url, await verifiedResponse(url));
          }
        }
        ready = (await Promise.all([...resources.keys()].map((url) => cache.match(url)))).every(
          Boolean,
        );
      } catch {
        /* Storage may be blocked or evicted. */
      }
      event.ports[0].postMessage({ type: 'OFFLINE_STATUS', ready, version });
    })(),
  );
});
