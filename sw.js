// Service worker de Routine : permet d'ouvrir l'appli sans connexion (salle de sport en sous-sol…).
// - Fichiers de l'appli : réseau d'abord, copie locale si le réseau manque.
// - Bibliothèques Firebase et polices (adresses versionnées) : copie locale d'abord.
// - Données Firestore et connexion : jamais interceptées (Firestore gère lui-même le hors connexion).
// Penser à ajouter ici tout nouveau fichier js et à changer le nom du cache.
const CACHE = 'fitcoach-20261022110626';
const CORE = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/config.js',
  './js/i18n.js',
  './js/exercises.js',
  './js/util.js',
  './js/data.js',
  './js/charts.js',
  './js/pictos.js',
  './js/tips.js',
  './js/insights.js',
  './js/routines.js',
  './js/usage.js',
  './js/core.js',
  './js/session.js',
  './js/picker.js',
  './js/entry.js',
  './js/track.js',
  './js/account.js',
  './js/settings.js',
  './js/boot.js',
  './icon-192.png',
  './icon-32.png',
];
const LIBS = [
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js',
];
const STATIC_HOSTS = ['www.gstatic.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.all([...CORE, ...LIBS].map(url => cache.add(url).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    // La version de test (beta/) a ses propres copies : chacune ne supprime que les siennes
    const mine = k => (CACHE.startsWith('fitcoach-beta-') ? k.startsWith('fitcoach-beta-') : k.startsWith('fitcoach-') && !k.startsWith('fitcoach-beta-'));
    await Promise.all(keys.filter(k => k !== CACHE && mine(k)).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(req));
  } else if (STATIC_HOSTS.includes(url.hostname) && (url.hostname !== 'www.gstatic.com' || url.pathname.startsWith('/firebasejs/'))) {
    event.respondWith(cacheFirst(req));
  }
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const cached = await cache.match(req, { ignoreSearch: true })
      || (req.mode === 'navigate' ? await cache.match('./index.html') : null);
    if (cached) return cached;
    throw e;
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  const res = await fetch(req);
  if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
  return res;
}
