// Belege · Service Worker: nur die App-Hülle merken (Netz zuerst, bei Ausfall die gemerkte Fassung). Keine Anfragen an den Server, keine Belegdaten.
var CACHE = 'belege-2026-10-07.1';
var HUELLE = ['./', 'index.html', 'manifest.json', 'icon-180.png', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(HUELLE); }).catch(function () { /* Hülle ist nur ein Zusatz */ }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k.indexOf('belege-') === 0 && k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, url;
  if (req.method !== 'GET') return;
  try { url = new URL(req.url); } catch (x) { return; }
  if (url.origin !== self.location.origin) return;            // Server-Aufrufe und Schriften nicht anfassen
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok && res.status === 200) { var kopie = res.clone(); caches.open(CACHE).then(function (c) { return c.put(req, kopie); }).catch(function () { /* ignorieren */ }); }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (hit) {
        if (hit) return hit;
        if (req.mode === 'navigate') return caches.match('index.html').then(function (h) { return h || caches.match('./'); });
        return undefined;
      }).then(function (hit) { return hit || Response.error(); });
    })
  );
});
