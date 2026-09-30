// Tiny hash router: #/ (home) · #/isaac · #/benji · #/isaac/map
const $ = (s) => document.querySelector(s);
const views = { home: $('#view-home'), isaac: $('#view-isaac'), benji: $('#view-benji'), map: $('#view-map') };
const ROUTES = { '': 'home', isaac: 'isaac', benji: 'benji', 'isaac/map': 'map' };

let current = null;
let mapModule = null;

async function route() {
  const name = ROUTES[location.hash.replace(/^#\/?/, '')] ?? 'home';
  if (current === 'map' && name !== 'map') mapModule?.leave();
  current = name;
  for (const [key, el] of Object.entries(views)) el.hidden = key !== name;

  if (name === 'map') {
    mapModule ??= await import('./map-game.js');
    if (current === 'map') mapModule.enter();
  }
}

// Stop iOS pinch-zooming / double-tap-zooming the whole page.
document.addEventListener('gesturestart', (e) => e.preventDefault());
document.addEventListener('contextmenu', (e) => e.preventDefault());

window.addEventListener('hashchange', route);
route();

if ('serviceWorker' in navigator && !['localhost', '127.0.0.1'].includes(location.hostname)) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}
