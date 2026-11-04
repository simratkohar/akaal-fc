/* Service worker : rend l'app installable et utilisable hors connexion.
   Stratégie « réseau d'abord » pour nos fichiers (les mises à jour arrivent
   tout de suite), cache en secours. Firebase n'est jamais mis en cache ici. */
const CACHE = 'akaal-v20';
const FICHIERS = ['./', 'index.html', 'manifest.json', 'css/app.css?v=20',
  'js/config.js?v=20', 'js/utils.js?v=20', 'js/store.js?v=20', 'js/calc.js?v=20', 'js/app.js?v=20', 'js/forms.js?v=20',
  'assets/logo-256.png', 'icons/icon-192.png', 'icons/icon-180.png', 'icons/icon-96.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET') return;
  const local = url.origin === location.origin;
  const polices = url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com';
  if (!local && !polices) return; // Firebase, Google… : pas touche
  if (polices) { // les polices changent rarement : cache d'abord
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => { const copie = res.clone(); caches.open(CACHE).then(c => c.put(req, copie)); return res; })));
    return;
  }
  e.respondWith(fetch(req).then(res => {
    if (res.ok) { const copie = res.clone(); caches.open(CACHE).then(c => c.put(req, copie)); }
    return res;
  }).catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
});
