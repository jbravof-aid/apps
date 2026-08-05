const CACHE_NAME = 'db-studio-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './index.css',
  './manifest.json',
  './icon-512.jpg',
  './database-master-single.html'
];

// External assets that can be cached dynamically on load
const DYNAMIC_CACHE_DOMAINS = [
  'esm.sh',
  'cdnjs.cloudflare.com',
  'code.jquery.com',
  'cdn.tailwindcss.com'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets');
      return cache.addAll(ASSETS_TO_CACHE).catch(err => {
        console.warn('[Service Worker] Pre-cache warning (some assets might not be available yet):', err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass for non-GET requests or dev server HMR/socket connections
  if (event.request.method !== 'GET' || url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // Network First with Cache Fallback strategy
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache valid HTTP status 200 responses
        if (response && response.status === 200) {
          const isDomainToCache = DYNAMIC_CACHE_DOMAINS.some(domain => url.hostname.includes(domain)) ||
                                  url.origin === self.location.origin;
          
          if (isDomainToCache) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
        }
        return response;
      })
      .catch(() => {
        // Serve from cache if offline
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Dynamic fallback for navigation mode if offline
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
