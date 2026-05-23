const CACHE_NAME = 'pdfminty-v3';
const DYNAMIC_CACHE = 'pdfminty-dynamic-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.js',
  '/src/styles/main.css',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
];

// Install: Precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }).catch((err) => {
      console.warn('[SW] Precache failed:', err);
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Helper: Check if request is for a static asset
function isStaticAsset(url) {
  return STATIC_ASSETS.includes(url.pathname) ||
    url.pathname.startsWith('/assets/') ||
    url.pathname.match(/\.(js|css|svg|png|jpg|jpeg|webp|woff2?)$/);
}

// Fetch: Smart caching strategies
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // 1. API requests: Network-only
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // 2. External CDN/Google Fonts: Cache-first
  if (url.origin === 'https://cdnjs.cloudflare.com' ||
      url.origin === 'https://unpkg.com' ||
      url.origin === 'https://fonts.googleapis.com' ||
      url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        return cached || fetch(event.request).then((response) => {
          if (response.ok) {
            const resClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => cache.put(event.request, resClone));
          }
          return response;
        }).catch(() => cached);
      })
    );
    return;
  }

  // 3. Static assets: Stale-while-revalidate
  if (url.origin === self.location.origin && isStaticAsset(url)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          if (networkResponse.ok) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse.clone());
            });
          }
          return networkResponse;
        }).catch(() => cachedResponse);
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 4. HTML navigation: Network-first with fallback
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).then((response) => {
        if (response.ok) {
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(event.request, response.clone());
          });
        }
        return response;
      }).catch(() => {
        return caches.match('/index.html') || caches.match('/');
      })
    );
    return;
  }

  // 5. Generic: Cache-first, then network
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const resClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(event.request, resClone));
        }
        return response;
      });
    })
  );
});

// Background sync for offline feedback
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-feedback') {
    event.waitUntil(syncFeedbackData());
  }
});

async function syncFeedbackData() {
  console.log('[SW] Background Sync: Processing feedback queue');
}

// Message handling from main thread
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
