const CACHE_VERSION = 'v13';
const CACHE_NAME = `expense-tracker-${CACHE_VERSION}`;
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './css/style.css?v=3',
  './css/base/tokens.css?v=2',
  './css/base/reset.css?v=2',
  './css/layouts/header.css?v=2',
  './css/layouts/navigation.css?v=2',
  './css/components/buttons.css?v=2',
  './css/components/cards.css?v=2',
  './css/components/forms.css?v=2',
  './css/components/tables.css?v=2',
  './css/components/skeleton.css?v=2',
  './css/components/toast.css?v=2',
  './css/components/modal.css?v=2',
  './css/utilities/helpers.css?v=2',
  './css/views/dashboard.css?v=2',
  './css/views/history.css?v=2',
  './css/views/reports.css?v=2',
  './css/views/tools.css?v=2',
  './css/views/shared-ledgers.css?v=2',
  './css/utilities/responsive.css?v=3',
  './js/app.js',
  './js/modules/state.js',
  './js/modules/storage.js',
  './js/modules/validation.js',
  './js/modules/calculations.js',
  './js/modules/shared-ledgers.js',
  './js/modules/ocr.js',
  './js/ui.js',
  './assets/icon.svg',
  './assets/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
          return Promise.resolve();
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  var isHtmlNavigation =
    event.request.mode === 'navigate' || event.request.destination === 'document';

  if (isHtmlNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          var responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put('./index.html', responseClone);
          });
          return networkResponse;
        })
        .catch(() =>
          caches.match(event.request).then((cached) => cached || caches.match('./index.html'))
        )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((networkResponse) => {
        var copy = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return networkResponse;
      });
    })
  );
});
