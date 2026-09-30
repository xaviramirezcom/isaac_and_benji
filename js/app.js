// Tiny hash router: #/ (home) · #/isaac · #/benji · #/isaac/map · #/benji/animals
const $ = (s) => document.querySelector(s);
const views = { home: $('#view-home'), isaac: $('#view-isaac'), benji: $('#view-benji'), map: $('#view-map'), grid: $('#view-grid'), animals: $('#view-animals') };
const ROUTES = { '': 'home', isaac: 'isaac', benji: 'benji', 'isaac/map': 'map', 'benji/animals': 'grid' };
const ANIMAL_PAGE = /^benji\/animals\/([a-z]+)$/;

let current = null;
let mapModule = null;
let animalsModule = null;

async function route() {
  const path = location.hash.replace(/^#\/?/, '');
  const animal = ANIMAL_PAGE.exec(path);
  const name = animal ? 'animals' : (ROUTES[path] ?? 'home');
  const inAnimals = (n) => n === 'animals' || n === 'grid';
  if (current === 'map' && name !== 'map') mapModule?.leave();
  if (inAnimals(current) && !inAnimals(name)) animalsModule?.leave();
  if (current === 'animals' && name === 'grid') animalsModule?.leave();
  current = name;
  for (const [key, el] of Object.entries(views)) el.hidden = key !== name;

  if (name === 'map') {
    mapModule ??= await import('./map-game.js');
    if (current === 'map') mapModule.enter();
  }
  if (inAnimals(name)) {
    animalsModule ??= await import('./animals-game.js');
    if (current === name) animalsModule.enter(name, animal?.[1]);
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
