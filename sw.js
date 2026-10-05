// Offline support: cache everything the app needs on first visit.
// App code (html/js/css) is network-first so updates show up immediately; big static files are cache-first.
const CACHE = 'isaac-benji-v102';
const CORE = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css', 'js/app.js', 'js/map-game.js',
  'js/animals-game.js', 'js/insects-game.js', 'js/insects/lib.js', 'js/insects/beetle.js', 'js/insects/bee.js', 'js/insects/ant.js', 'js/insects/ladybug.js', 'js/insects/fly.js', 'js/insects/spider.js', 'js/insects/centipede.js', 'js/insects/rhino.js', 'js/insects/pillbug.js', 'js/space-game.js', 'js/storms-game.js', 'js/numbers-game.js', 'js/mouths.js', 'js/fruits-game.js', 'js/sound.js', 'js/mouth-place.js', 'js/storms/levels.js', 'js/storms/world.js', 'js/storms/vortex.js', 'js/storms/sky.js', 'js/storms/debris.js', 'js/space/bodies.js', 'vendor/RoomEnvironment.js', 'data/animals.json', 'vendor/three.module.min.js', 'vendor/OrbitControls.js', 'vendor/topojson-client.min.js',
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
      const animals = await (await fetch('data/animals.json')).json();
      await cache.addAll(animals.flatMap((a) => [a.sound, `images/animals/${a.id}.png`]));
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
  const isCode = req.mode === 'navigate' || /\.(html|js|css|json|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/');
  if (req.headers.has('range')) { event.respondWith(rangeResponse(req)); return; }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req, { ignoreSearch: true });
    const network = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res; }).catch(() => null);
    if (isCode) return (await network) || cached || new Response('Offline', { status: 503 });
    return cached || (await network) || new Response('Offline', { status: 503 });
  })());
});

// Safari asks audio files for byte ranges; a cached 200 response makes playback fail, so slice it ourselves.
async function rangeResponse(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req.url, { ignoreSearch: true });
  if (!cached) return fetch(req);
  const buf = await cached.arrayBuffer();
  const m = /bytes=(\d*)-(\d*)/.exec(req.headers.get('range')) || [];
  const start = m[1] ? +m[1] : 0, end = m[2] ? Math.min(+m[2], buf.byteLength - 1) : buf.byteLength - 1;
  return new Response(buf.slice(start, end + 1), { status: 206, headers: {
    'Content-Type': cached.headers.get('Content-Type') || 'audio/mpeg', 'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`, 'Content-Length': String(end - start + 1) } });
}
