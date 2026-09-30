// Benji's animals. Two screens:
//  - the matrix (#/benji/animals): all animals, tap one
//  - one animal (#/benji/animals/<id>): picture + three taps (say the name, play the real sound, next); swipe to move.
const $ = (s) => document.querySelector(s);
const root = $('#view-animals'), gridRoot = $('#view-grid');
const els = {
  stage: root.querySelector('.stage'), pic: $('#animal-pic'), img: $('#animal-img'), name: $('#animal-name'),
  lblName: $('#lbl-name'), lblSound: $('#lbl-sound'), lblNext: $('#lbl-next'),
  credits: $('#credits'), list: $('#credits-list'), grid: $('#animal-grid'),
};
const UI = {
  en: { name: 'Name', sound: 'Sound', next: 'Next', speech: 'en-US' },
  es: { name: 'Nombre', sound: 'Sonido', next: 'Siguiente', speech: 'es-ES' },
};
const BACKGROUNDS = ['#ffe9b8', '#d6f0ff', '#e3f6d5', '#ffdfe6', '#e9e0ff', '#ffe2c7'];
const SWIPE_MIN = 50;

let animals = [], index = 0, lang = 'en', audio = null, bound = false, loading = null, swipedAt = 0;

export async function enter(view, id) {
  loading ??= load();
  await loading;
  if (!bound) bind();
  setLang(lang);
  if (view === 'animals') {
    const i = animals.findIndex((a) => a.id === id);
    show(i < 0 ? 0 : i, 0);
  }
}

export function leave() { stopAudio(); speechSynthesis?.cancel(); els.credits.hidden = true; }

async function load() {
  animals = await fetch('data/animals.json', { cache: 'no-cache' }).then((r) => r.json());
  els.grid.innerHTML = animals.map((a, i) =>
    `<a class="animal-tile" href="#/benji/animals/${a.id}" style="--bg:${BACKGROUNDS[i % BACKGROUNDS.length]}"><img src="images/animals/${a.id}.png" alt=""><span data-id="${a.id}">${a.en}</span></a>`).join('');
  els.list.innerHTML = animals.map((a) => `<li>${a.en}: “${a.credit.title}”, ${a.credit.artist}, ${a.credit.license} — <a href="${a.credit.url}" target="_blank" rel="noopener">source</a></li>`).join('');
}

// direction: 1 = came from the right (next), -1 = from the left (previous), 0 = no slide
function show(i, direction = 0) {
  index = (i + animals.length) % animals.length;
  const a = animals[index];
  stopAudio(); speechSynthesis?.cancel();
  els.img.src = `images/animals/${a.id}.png`;
  els.img.alt = a[lang];
  els.name.textContent = a[lang];
  root.style.setProperty('--animal-bg', BACKGROUNDS[index % BACKGROUNDS.length]);
  audio = new Audio(a.sound); audio.preload = 'auto';
  // keep the URL in step, so "back" always returns to the matrix
  history.replaceState(null, '', `#/benji/animals/${a.id}`);
  els.stage.classList.remove('from-right', 'from-left'); void els.stage.offsetWidth;
  if (direction) els.stage.classList.add(direction > 0 ? 'from-right' : 'from-left');
}

const step = (d) => show(index + d, d);
function stopAudio() { if (audio) { audio.pause(); audio.currentTime = 0; } }
function bounce() { els.pic.classList.remove('tap'); void els.pic.offsetWidth; els.pic.classList.add('tap'); }

function playSound() {
  if (performance.now() - swipedAt < 350) return; // a swipe ending on the picture is not a tap
  speechSynthesis?.cancel(); bounce();
  if (!audio) return;
  audio.currentTime = 0;
  audio.play().catch(() => {});
}

function sayName() {
  if (!('speechSynthesis' in window)) return;
  stopAudio(); speechSynthesis.cancel(); bounce();
  const u = new SpeechSynthesisUtterance(animals[index][lang]);
  u.lang = UI[lang].speech; u.rate = 0.75;
  speechSynthesis.speak(u);
}

function setLang(l) {
  lang = l; // English is the default every time; the choice only lasts for this visit
  document.querySelectorAll('#view-animals .lang button, #view-grid .lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === l));
  els.lblName.textContent = UI[l].name; els.lblSound.textContent = UI[l].sound; els.lblNext.textContent = UI[l].next;
  els.grid.querySelectorAll('span[data-id]').forEach((sp) => { sp.textContent = animals.find((a) => a.id === sp.dataset.id)[l]; });
  if (animals.length) { const a = animals[index]; els.name.textContent = a[l]; els.img.alt = a[l]; }
  speechSynthesis?.cancel();
}

function bind() {
  bound = true;
  els.pic.addEventListener('click', playSound);
  $('#btn-sound').addEventListener('click', playSound);
  $('#btn-name').addEventListener('click', sayName);
  $('#btn-next').addEventListener('click', () => step(1));
  document.querySelectorAll('#view-animals .lang button, #view-grid .lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  $('#btn-credits').addEventListener('click', () => { els.credits.hidden = false; });
  $('#credits-close').addEventListener('click', () => { els.credits.hidden = true; });
  els.credits.addEventListener('click', (e) => { if (e.target === els.credits) els.credits.hidden = true; });

  // swipe left = next animal, swipe right = previous
  let start = null;
  els.stage.addEventListener('pointerdown', (e) => { start = { x: e.clientX, y: e.clientY }; });
  els.stage.addEventListener('pointerup', (e) => {
    if (!start) return;
    const dx = e.clientX - start.x, dy = e.clientY - start.y; start = null;
    if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy) * 1.5) { swipedAt = performance.now(); step(dx < 0 ? 1 : -1); }
  });
  els.stage.addEventListener('pointercancel', () => { start = null; });
}
