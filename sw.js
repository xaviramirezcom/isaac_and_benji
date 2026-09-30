// Offline support: cache everything the app needs on first visit.
// App code (html/js/css) is network-first so updates show up immediately; big static files are cache-first.
const CACHE = 'isaac-benji-v2';
const CORE = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css', 'js/app.js', 'js/map-game.js',
  'vendor/three.module.min.js', 'vendor/OrbitControls.js', 'vendor/topojson-client.min.js',
  'data/world-50m.json', 'data/countries.json', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);
    try {
      const countries = await (await fetch('data/countries.json')).json();
      const codes = [...new Set(Object.values(countries).map((c) => c.cca2))];
      await cache.addAll(codes.map((c) => `flags/${c}.svg`));
    } catch (e) { /* flags will be cached as they are used */ }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  const isCode = req.mode === 'navigate' || /\.(html|js|css|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/');
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });
    const network = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
    if (isCode) return (await network) || cached || new Response('Offline', { status: 503 });
    return cached || (await network) || new Response('Offline', { status: 503 });
  })());
});
