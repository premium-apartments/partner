// Premium Apartments · Team-App · Service Worker
// Aufgabe: Mitteilungen anzeigen (neue Anweisungen, Lob von Gästen) und beim Antippen die App öffnen. Kein Offline-Zwischenspeicher.
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.clients.claim()); });

function eigeneUrl(u) { // nur Adressen der eigenen App erlauben
  try {
    var x = new URL(String(u || ''), self.registration.scope);
    if (x.origin === self.location.origin && x.pathname.indexOf(new URL(self.registration.scope).pathname) === 0) return x.href;
  } catch (e) { /* ignorieren */ }
  return self.registration.scope;
}
function anApp(n) { // offene App benachrichtigen → sie lädt die Daten gleich neu
  return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    list.forEach(function (c) { try { c.postMessage({ t: 'push', n: n }); } catch (z) { /* ignorieren */ } });
  });
}
self.addEventListener('push', function (e) {
  var m = {};
  try { m = e.data ? e.data.json() : {}; } catch (x) { try { m = { body: e.data.text() }; } catch (y) { m = {}; } }
  if (!m || typeof m !== 'object') m = {};
  var opt = { body: String(m.body || '').slice(0, 400), icon: 'icon-192.png', data: { url: eigeneUrl(m.url) } };
  if (m.tag) { opt.tag = String(m.tag).slice(0, 60); opt.renotify = true; }
  // Jede Push-Nachricht muss eine sichtbare Mitteilung auslösen (Vorgabe von Safari/iOS)
  e.waitUntil(Promise.all([
    self.registration.showNotification(String(m.title || 'Premium Apartments · Team').slice(0, 120), opt),
    anApp(m.n)
  ]));
});
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || self.registration.scope;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].focus) {
        var c = list[i];
        return c.focus().then(function (cl) { try { (cl || c).postMessage({ t: 'push' }); } catch (z) { /* ignorieren */ } return cl; });
      }
    }
    return self.clients.openWindow ? self.clients.openWindow(url) : null;
  }));
});
