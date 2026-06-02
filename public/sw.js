// GWS Platform V2 — Service Worker for PWA Offline Support
// Cache version — increment when deploying new versions to trigger cache refresh
const CACHE_VERSION = 'gws-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const API_CACHE = `${CACHE_VERSION}-api`;

// Pre-cache app shell resources
const APP_SHELL = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icons/favicon.svg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg',
];

// Static asset extensions — cache-first strategy
const STATIC_EXTENSIONS = [
  '.js', '.css', '.mjs', '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.avif',
  '.json', '.xml', '.txt',
];

// API paths — network-first strategy
const API_PATHS = ['/api/'];

// Non-critical resources — stale-while-revalidate
const STALE_WHILE_REVALIDATE_PATHS = [
  '/api/dashboard',
  '/api/dashboard/',
];

// ── Install Event ──
// Pre-cache the app shell and skip waiting
self.addEventListener('install', (event) => {
  console.log('[SW] Install — caching app shell');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        // Cache what we can, don't fail if some resources aren't available yet
        return Promise.allSettled(
          APP_SHELL.map((url) =>
            cache.add(url).catch((err) => {
              console.warn(`[SW] Failed to pre-cache ${url}:`, err.message);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ── Activate Event ──
// Clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  console.log('[SW] Activate — cleaning old caches');
  event.waitUntil(
    caches.keys()
      .then((keys) => {
        return Promise.all(
          keys
            .filter((key) => key.startsWith('gws-') && key !== STATIC_CACHE && key !== DYNAMIC_CACHE && key !== API_CACHE)
            .map((key) => {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// ── Fetch Event ──
// Route requests to appropriate caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // Skip non-GET requests for caching (POST/PUT/DELETE are handled by IndexedDB offline layer)
  if (request.method !== 'GET') {
    return;
  }

  // Skip Chrome extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Route to appropriate strategy
  if (isStaleWhileRevalidate(url)) {
    event.respondWith(staleWhileRevalidate(request));
  } else if (isApiRequest(url)) {
    event.respondWith(networkFirst(request));
  } else if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
  } else if (isNextStatic(url)) {
    event.respondWith(cacheFirst(request));
  } else {
    // Default: network-first for navigation, cache-first for others
    if (request.mode === 'navigate') {
      event.respondWith(navigationHandler(request));
    } else {
      event.respondWith(networkFirst(request));
    }
  }
});

// ── Strategy: Cache First ──
// For static assets that rarely change (JS, CSS, images, fonts)
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Return a basic offline response for images
    if (request.destination === 'image') {
      return new Response(
        '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect fill="#f0f0f0" width="100" height="100"/><text fill="#999" font-size="12" x="50" y="55" text-anchor="middle">Offline</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
  }
}

// ── Strategy: Network First ──
// For API calls — try network, fall back to cache
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    return new Response(JSON.stringify({ error: 'Offline', message: 'No cached data available' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// ── Strategy: Stale While Revalidate ──
// For non-critical resources — serve from cache, update in background
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

// ── Navigation Handler ──
// For page navigations — network first with offline fallback
async function navigationHandler(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    // Try cached version first
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }
    // Fall back to offline page
    const offlinePage = await caches.match('/offline.html');
    if (offlinePage) {
      return offlinePage;
    }
    // Ultimate fallback
    return new Response(
      '<html><body><h1>You are offline</h1><p>The GWS Platform cannot be reached. Please check your internet connection and try again.</p></body></html>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
}

// ── Helper Functions ──

function isApiRequest(url) {
  return API_PATHS.some((path) => url.pathname.startsWith(path));
}

function isStaticAsset(url) {
  return STATIC_EXTENSIONS.some((ext) => url.pathname.endsWith(ext));
}

function isNextStatic(url) {
  return url.pathname.startsWith('/_next/static/');
}

function isStaleWhileRevalidate(url) {
  return STALE_WHILE_REVALIDATE_PATHS.some((path) => url.pathname.startsWith(path));
}

// ── Background Sync ──
// Process queued operations when connectivity is restored
self.addEventListener('sync', (event) => {
  if (event.tag === 'gws-sync-queue') {
    console.log('[SW] Background sync triggered — processing queue');
    event.waitUntil(processBackgroundSync());
  }
});

async function processBackgroundSync() {
  // Notify all clients that a sync is happening
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_STARTED' });
  });

  // The actual sync is handled by the app's IndexedDB layer
  // We just trigger the event; the client-side code picks it up
  clients.forEach((client) => {
    client.postMessage({ type: 'TRIGGER_SYNC' });
  });
}

// ── Push Notification Support (future use) ──
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'GWS Platform';
    const options = {
      body: data.body || 'You have a new notification',
      icon: '/icons/icon-192.svg',
      badge: '/icons/favicon.svg',
      vibrate: [100, 50, 100],
      data: {
        url: data.url || '/',
      },
      actions: data.actions || [],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.error('[SW] Push notification error:', e);
  }
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open new window
        return self.clients.openWindow(urlToOpen);
      })
  );
});

// ── Message Handler ──
// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'GET_CACHE_SIZE') {
    getCacheStorageSize().then((size) => {
      event.ports[0].postMessage({ type: 'CACHE_SIZE', size });
    });
  }

  if (event.data && event.data.type === 'CLEAR_CACHES') {
    clearAllCaches().then(() => {
      event.ports[0].postMessage({ type: 'CACHES_CLEARED' });
    });
  }
});

// Calculate total cache storage size
async function getCacheStorageSize() {
  const keys = await caches.keys();
  let totalSize = 0;

  for (const key of keys) {
    const cache = await caches.open(key);
    const requests = await cache.keys();
    for (const request of requests) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.blob();
        totalSize += blob.size;
      }
    }
  }

  return totalSize;
}

// Clear all GWS caches
async function clearAllCaches() {
  const keys = await caches.keys();
  await Promise.all(
    keys
      .filter((key) => key.startsWith('gws-'))
      .map((key) => caches.delete(key))
  );
  console.log('[SW] All GWS caches cleared');
}
