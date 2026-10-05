// Benji's animals. Two screens:
//  - the matrix (#/benji/animals): all animals, tap one
//  - one animal (#/benji/animals/<id>): the picture, and two big arrows (previous / next). Arriving at an animal plays its real sound, then
//    half a second later says its name. Tapping the picture plays it again. No swiping: a stray touch never changes the animal.
import { audio, unlock, loadBuf, playUrl, stop as stopSound } from './sound.js';
const $ = (s) => document.querySelector(s);
const root = $('#view-animals'), gridRoot = $('#view-grid');
const els = {
  stage: root.querySelector('.stage'), pic: $('#animal-pic'), img: $('#animal-img'), name: $('#animal-name'),
  credits: $('#credits'), list: $('#credits-list'), grid: $('#animal-grid'),
};
const BACKGROUNDS = ['#ffe9b8', '#d6f0ff', '#e3f6d5', '#ffdfe6', '#e9e0ff', '#ffe2c7'];

let animals = [], index = 0, lang = 'en', bound = false, loading = null, token = 0, timers = [];
const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

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

export function leave() { token++; clearTimers(); stopSound(); els.credits.hidden = true; }

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
  token++; clearTimers(); stopSound();
  els.img.src = `images/animals/${a.id}.png`;
  els.img.alt = a[lang];
  els.name.textContent = a[lang];
  root.style.setProperty('--animal-bg', BACKGROUNDS[index % BACKGROUNDS.length]);
  for (const k of [index, index + 1, index - 1]) { const b = animals[(k + animals.length) % animals.length]; loadBuf(b.sound); loadBuf(`sounds/names/${lang}/${b.id}.mp3`); }
  // keep the URL in step, so "back" always returns to the matrix
  history.replaceState(null, '', `#/benji/animals/${a.id}`);
  els.stage.classList.remove('from-right', 'from-left'); void els.stage.offsetWidth;
  if (direction) els.stage.classList.add(direction > 0 ? 'from-right' : 'from-left');
  announce();
}

const step = (d) => show(index + d, d);
function bounce() { els.pic.classList.remove('tap'); void els.pic.offsetWidth; els.pic.classList.add('tap'); }

// the animal's real sound first, then half a second of quiet, then its name — all started by the child's own touch
async function announce() {
  const my = ++token, a = animals[index]; clearTimers(); stopSound(); bounce();
  await playUrl(a.sound, { gain: 0.8, stopPrev: true }); if (my !== token) return;
  const b = await loadBuf(a.sound), dur = Math.min(9, b?.duration ?? 2) * 1000;
  later(() => { if (my === token) { bounce(); playUrl(`sounds/names/${lang}/${a.id}.mp3`, { gain: 1, stopPrev: true }); } }, dur + 500);
}

function setLang(l) {
  lang = l; // English is the default every time; the choice only lasts for this visit
  document.querySelectorAll('#view-animals .lang button, #view-grid .lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === l));
  els.grid.querySelectorAll('span[data-id]').forEach((sp) => { sp.textContent = animals.find((a) => a.id === sp.dataset.id)[l]; });
  if (animals.length) { const a = animals[index]; els.name.textContent = a[l]; els.img.alt = a[l]; }
  loadBuf && animals.length && loadBuf(`sounds/names/${l}/${animals[index].id}.mp3`);
}

function bind() {
  bound = true;
  const unlockNow = () => unlock(); root.addEventListener('pointerdown', unlockNow, true); root.addEventListener('touchend', unlockNow, true); gridRoot.addEventListener('pointerdown', unlockNow, true);
  els.pic.addEventListener('click', announce);
  $('#btn-prev').addEventListener('click', () => step(-1));
  $('#btn-name').addEventListener('click', () => { const my = ++token; clearTimers(); stopSound(); bounce(); playUrl(`sounds/names/${lang}/${animals[index].id}.mp3`, { gain: 1, stopPrev: true }); void my; });   // just the name, now
  $('#btn-next').addEventListener('click', () => step(1));
  document.querySelectorAll('#view-animals .lang button, #view-grid .lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  $('#btn-credits').addEventListener('click', () => { els.credits.hidden = false; });
  $('#credits-close').addEventListener('click', () => { els.credits.hidden = true; });
  els.credits.addEventListener('click', (e) => { if (e.target === els.credits) els.credits.hidden = true; });

}
