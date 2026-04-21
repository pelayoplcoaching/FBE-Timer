const CACHE = 'fbe-timer-v5';
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

// Network-first, solo same-origin (no interceptar llamadas al backend)
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(res => {
      if (!res || res.status !== 200 || res.type !== 'basic') return res;
      const resClone = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, resClone));
      return res;
    }).catch(() => caches.match(e.request).then(cached => cached || caches.match('./index.html')))
  );
});

// Push: siempre mostrar notificacion (iOS lo exige)
self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (_) {}
  const title = data.title || 'Descanso terminado';
  const options = {
    body: data.body || 'A por la siguiente serie',
    icon: data.icon || 'icon-192.png',
    badge: data.badge || 'icon-192.png',
    tag: data.tag || 'fbe-timer',
    renotify: true,
    requireInteraction: false,
    vibrate: data.vibrate || [200, 100, 200, 100, 400],
    data
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Click en la notificacion: abrir la PWA
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if ('focus' in c) return c.focus();
      }
      if (clients.openWindow) return clients.openWindow('./');
    })
  );
});
