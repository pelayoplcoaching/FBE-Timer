const CACHE = 'fbe-timer-v2';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
         .then(() => self.clients.claim())
  );
});

// Estrategia network-first: intenta descargar la versión más reciente primero,
// y solo usa la caché si no hay conexión. Así las actualizaciones se reflejan al instante.
self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).then(res => {
      if (!res || res.status !== 200 || res.type !== 'basic') return res;
      const resClone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, resClone));
      return res;
    }).catch(() => caches.match(e.request).then(cached => cached || caches.match('./index.html')))
  );
});
