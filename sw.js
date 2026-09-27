const CACHE_NAME = 'rito-game-offline-v2';
const APP_SHELL = ['./', './index.html', './src/index.html', './src/multi-battle.js'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys
        .filter(key => key.startsWith('rito-game-offline-') && key !== CACHE_NAME)
        .map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function storeResponse(request, response) {
  if (!response || !response.ok) return response;
  caches.open(CACHE_NAME).then(cache => cache.put(request, response.clone()));
  return response;
}

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      const network = fetch(event.request)
        .then(response => storeResponse(event.request, response))
        .catch(() => cached);
      return cached || network;
    })
  );
});

self.addEventListener('message', event => {
  const data = event.data || {};
  if (data.type !== 'cache-game-assets' || !Array.isArray(data.assets)) return;

  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => Promise.allSettled(
      data.assets.map(asset => cache.add(new Request(asset, { cache: 'reload' })))
    ))
  );
});
