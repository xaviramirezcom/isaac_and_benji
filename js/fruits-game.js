// Benji's fruits — "feed the friend": pretend play with changing requests. A different animal (or the teddy) is hungry each round.
// The hungry friend and shows, in a thought bubble, the fruit it wants. A few fruits sit on the table; Benji drags the one in the bubble to Teddy.
// Teddy opens its mouth as it comes close, eats it (munch, munch, mmm) and the fruit's name is said. Then Teddy wants something DIFFERENT:
// every round the request changes, so he practises switching ("now it's the banana, now the pear"). A wrong fruit is never "wrong": Teddy
// shakes its head gently and the fruit goes back to the table. Nothing is said or eaten unless Benji touches something.
import { MOUTH } from './mouths.js';
import { audio, unlock, loadBuf, playUrl, munch, yum, nope, chime, setMuted, stop as stopSound } from './sound.js';
const $ = (s) => document.querySelector(s);
const root = $('#view-fruits'), stage = $('#fr-stage'), teddy = $('#fr-teddy'), want = $('#fr-want'), wantImg = $('#fr-want-img'), table = $('#fr-table'), itemsEl = $('#fr-items'), hearts = $('#fr-hearts'), prog = $('#fr-prog'), hand = $('#fr-hand');

const FRUITS = [
  { id: 'apple', c: 'red', en: 'Apple', es: 'Manzana' }, { id: 'greenapple', c: 'green', en: 'Green apple', es: 'Manzana verde' }, { id: 'banana', c: 'yellow', en: 'Banana', es: 'Plátano' }, { id: 'grapes', c: 'purple', en: 'Grapes', es: 'Uvas' },
  { id: 'strawberry', c: 'red', en: 'Strawberry', es: 'Fresa' }, { id: 'orange', c: 'orange', en: 'Orange', es: 'Naranja' }, { id: 'watermelon', c: 'red', en: 'Watermelon', es: 'Sandía' }, { id: 'pear', c: 'green', en: 'Pear', es: 'Pera' },
  { id: 'peach', c: 'orange', en: 'Peach', es: 'Durazno' }, { id: 'cherries', c: 'red', en: 'Cherries', es: 'Cerezas' }, { id: 'pineapple', c: 'yellow', en: 'Pineapple', es: 'Piña' }, { id: 'mango', c: 'orange', en: 'Mango', es: 'Mango' },
  { id: 'lemon', c: 'yellow', en: 'Lemon', es: 'Limón' }, { id: 'kiwi', c: 'green', en: 'Kiwi', es: 'Kiwi' }, { id: 'blueberries', c: 'blue', en: 'Blueberries', es: 'Arándanos' },
];
const PALETTES = [['#ffe9c7', '#e9c99c'], ['#d8efff', '#bcdca8'], ['#ffdfe8', '#e8c3a4'], ['#e6e0ff', '#c9d9a8']];   // the scene changes colour as Teddy fills up
const HINT_AFTER = 12000, FULL = 5;
let friends = [], friend = null, lastFriend = '';   // the animals from the animals game, plus the teddy

let lang = 'en', running = false, bound = false, soundOn = true, phase = 'idle', token = 0, timers = [];
let wanted = null, opts = [], items = [], lastWanted = '', eaten = 0, total = 0, wrong = 0, drag = null, pal = 0, handAnim = null;
let M = { w: 0, h: 0, T: 200, tx: 0, ty: 0, B: 100, bx: 0, by: 0, F: 140, fy: 0 };

const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; handAnim?.cancel(); handAnim = null; hand.classList.remove('on'); };
const voice = (f) => playUrl(`sounds/fruits/${lang}/${f.id}.mp3`, { gain: 1, stopPrev: true });
const setOpen = (v) => teddy.style.setProperty('--open', Math.max(0, Math.min(1, v)).toFixed(2));
const mouthPt = () => { const m = MOUTH[friend?.id] ?? MOUTH.teddy; return { x: M.tx + M.T * m[0] / 100, y: M.ty + M.T * m[1] / 100 }; };

// ---------------------------------------------------------------- layout
function metrics() {
  const r = stage.getBoundingClientRect(), w = r.width, h = r.height, n = Math.max(2, opts.length);
  const T = Math.max(190, Math.min(w * 0.62, h * 0.4, 400)), tx = (w - T) / 2, ty = Math.max(84, h * 0.12), B = T * 0.5;
  let bx = tx + T * 0.76, by = ty - B * 0.12; bx = Math.min(bx, w - B - 10); by = Math.max(by, 64);
  const F = Math.max(112, Math.min(210, (w - 36) / (n + 0.3), h * 0.2)), fy = h - F - Math.max(36, h * 0.07);
  M = { w, h, T, tx, ty, B, bx, by, F, fy };
}
function place() {
  metrics();
  teddy.style.width = teddy.style.height = `${M.T}px`; teddy.style.transform = `translate(${M.tx}px, ${M.ty}px)`;
  want.style.width = want.style.height = `${M.B}px`; want.style.transform = `translate(${M.bx}px, ${M.by}px)`;
  table.style.top = `${M.fy - M.F * 0.18}px`; table.style.height = `${M.F * 1.5}px`;
  const n = items.length, gap = M.F * 0.22, x0 = (M.w - n * M.F - (n - 1) * gap) / 2;
  items.forEach((it, i) => { it.sx = x0 + i * (M.F + gap); it.sy = M.fy; it.el.style.width = it.el.style.height = `${M.F}px`; if (!it.el.classList.contains('away') && it !== drag?.it) setItem(it, it.sx, it.sy); });
}
const setItem = (it, x, y) => { it.x = x; it.y = y; it.el.style.transform = `translate(${x}px, ${y}px)`; };

// ---------------------------------------------------------------- one round
function pickFriend() {
  let f; do { f = friends[Math.floor(Math.random() * friends.length)]; } while (f.id === lastFriend && friends.length > 1);
  friend = f; lastFriend = f.id; const m = MOUTH[f.id] ?? MOUTH.teddy, img = teddy.querySelector('img'), mo = teddy.querySelector('.fr-mouth');
  img.src = f.img; mo.style.left = `${m[0]}%`; mo.style.top = `${m[1]}%`; mo.style.width = `${m[2]}%`; mo.style.height = `${m[4]}%`; mo.style.setProperty('--rot', `${m[3]}deg`); if (f.sound) loadBuf(f.sound);
}
function pickRound() {
  pickFriend();
  let f; do { f = FRUITS[Math.floor(Math.random() * FRUITS.length)]; } while (f.id === lastWanted);
  wanted = f; lastWanted = f.id;
  const n = total < 2 ? 2 : 3, others = [], seen = new Set([f.c]);   // the other fruits are a different colour from the one asked for (and from each other), so the picture is easy to match
  for (const x of FRUITS.filter((y) => y !== f).sort(() => Math.random() - 0.5)) { if (others.length >= n - 1) break; if (!seen.has(x.c)) { seen.add(x.c); others.push(x); } }
  opts = [f, ...others].sort(() => Math.random() - 0.5);
  for (const x of opts) { loadBuf(`sounds/fruits/${lang}/${x.id}.mp3`); new Image().src = `images/fruits/${x.id}.png`; }
}
function startRound() {
  if (!running) return; clearTimers(); token++; phase = 'ask'; wrong = 0; drag = null; pickRound();
  teddy.classList.remove('near', 'chew', 'no', 'dance'); setOpen(0); teddy.style.setProperty('--belly', (1 + 0.02 * eaten).toFixed(3));
  itemsEl.innerHTML = ''; items = opts.map((f) => { const el = document.createElement('div'); el.className = 'fr-item'; el.innerHTML = `<div class="fi"><img src="images/fruits/${f.id}.png" alt="" draggable="false"></div>`; itemsEl.appendChild(el); return { f, el }; });
  items.forEach((it) => bindItem(it)); wantImg.src = `images/fruits/${wanted.id}.png`; place();
  want.classList.remove('in', 'out'); void want.offsetWidth; later(() => want.classList.add('in'), 250);
  items.forEach((it, i) => later(() => it.el.classList.add('in'), 120 + i * 120)); teddy.classList.add('ask'); later(() => teddy.classList.remove('ask'), 1200);
  later(showHint, HINT_AFTER);
}
function showHint() {   // a ghost hand shows the move; nothing is ever done for him
  if (phase !== 'ask' || drag) return; const it = items.find((i) => i.f === wanted); if (!it) return; const a = { x: it.sx + M.F / 2, y: it.sy + M.F / 2 }, b = mouthPt();
  hand.classList.add('on'); it.el.classList.add('wiggle');
  handAnim = hand.animate([{ transform: `translate(${a.x}px, ${a.y}px)`, opacity: 0 }, { transform: `translate(${a.x}px, ${a.y}px)`, opacity: 1, offset: 0.15 }, { transform: `translate(${b.x}px, ${b.y}px)`, opacity: 1, offset: 0.8 }, { transform: `translate(${b.x}px, ${b.y}px)`, opacity: 0 }], { duration: 2200, iterations: Infinity, easing: 'ease-in-out' });
}
function bindItem(it) {
  const el = it.el;
  el.addEventListener('pointerdown', (e) => {
    if (phase !== 'ask') return; unlock(); e.preventDefault(); try { el.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ }
    clearTimers(); items.forEach((o) => o.el.classList.remove('wiggle')); voice(it.f);                // touching a fruit says its name
    const r = stage.getBoundingClientRect(); drag = { id: e.pointerId, it, dx: e.clientX - r.left - it.x, dy: e.clientY - r.top - it.y }; el.classList.add('drag');
  });
  el.addEventListener('pointermove', (e) => {
    if (!drag || drag.it !== it || e.pointerId !== drag.id) return; const r = stage.getBoundingClientRect();
    setItem(it, Math.min(Math.max(e.clientX - r.left - drag.dx, -20), M.w - M.F + 20), Math.min(Math.max(e.clientY - r.top - drag.dy, -20), M.h - M.F + 20));
    const c = { x: it.x + M.F / 2, y: it.y + M.F / 2 }, m = mouthPt(), d = Math.hypot(c.x - m.x, c.y - m.y);
    if (it.f === wanted) { const o = (M.T * 1 + M.F * 0.3 - d) / (M.T * 0.55); setOpen(o); teddy.classList.toggle('near', o > 0.7); }          // Teddy opens up for the fruit it asked for
    else teddy.classList.toggle('no', d < M.T * 0.62);                                                                                          // …and politely shakes its head for another
  });
  const up = (e) => {
    if (!drag || drag.it !== it || e.pointerId !== drag.id) return; drag = null; el.classList.remove('drag'); teddy.classList.remove('no');
    const c = { x: it.x + M.F / 2, y: it.y + M.F / 2 }, t = { x: M.tx + M.T / 2, y: M.ty + M.T / 2 }, onTeddy = Math.hypot(c.x - t.x, c.y - t.y) < M.T * 0.42 + M.F * 0.2;
    if (onTeddy && it.f === wanted) eat(it);
    else {
      setOpen(0); teddy.classList.remove('near'); if (onTeddy) { nope(); teddy.classList.remove('shake'); void teddy.offsetWidth; teddy.classList.add('shake'); wrong++; }
      sendBack(it); later(showHint, wrong >= 2 ? 1500 : 7000);
    }
  };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
}
function sendBack(it) {   // the fruit slides back to the table
  const from = `translate(${it.x}px, ${it.y}px)`, to = `translate(${it.sx}px, ${it.sy}px)`; it.x = it.sx; it.y = it.sy; it.el.style.transform = to;
  it.el.animate([{ transform: from }, { transform: to }], { duration: 320, easing: 'cubic-bezier(.3,1.3,.5,1)' });
}
function eat(it) {
  phase = 'eat'; clearTimers(); const my = ++token, m = mouthPt(), to = { x: m.x - M.F / 2, y: m.y - M.F / 2 }; setOpen(1); teddy.classList.add('near');
  later(() => { it.el.animate([{ transform: `translate(${it.x}px, ${it.y}px) scale(1)`, opacity: 1 }, { transform: `translate(${to.x}px, ${to.y}px) scale(.24)`, opacity: 1, offset: 0.9 }, { transform: `translate(${to.x}px, ${to.y}px) scale(.1)`, opacity: 0 }], { duration: 520, easing: 'cubic-bezier(.45,0,.8,.5)', fill: 'forwards' }); }, 100);
  later(() => { it.el.style.visibility = 'hidden'; setOpen(0); teddy.classList.remove('near'); }, 660);
  for (let i = 0; i < 3; i++) later(() => { teddy.classList.remove('chew'); void teddy.offsetWidth; teddy.classList.add('chew'); munch(); }, 760 + i * 300);         // munch, munch, munch
  later(() => { if (my !== token) return; yum(); burstHearts(); voice(it.f); eaten++; total++; fillUp(); }, 1750);
  if (friend?.sound) { const snd = friend.sound; later(() => { if (my === token) playUrl(snd, { gain: 0.7, max: 1.6, stopPrev: true }); }, 3000); }   // …and then thanks you in its own animal voice                                                  // mmm! and the fruit's name
  later(() => { phase = 'done'; }, 1800);
  const full = eaten + 1 >= FULL;
  later(() => nextRound(), 1750 + (full ? 4900 : 3500));
}
function nextRound() {
  if (!running) return; phase = 'between'; items.forEach((i) => i.el.classList.add('away')); want.classList.add('out'); later(startRound, 650);
}
function fillUp() {
  prog.innerHTML = Array.from({ length: FULL }, (_, i) => `<i class="${i < eaten ? 'on' : ''}"></i>`).join(''); teddy.style.setProperty('--belly', (1 + 0.02 * eaten).toFixed(3));
  if (eaten >= FULL) { teddy.classList.add('dance'); chime(); burstHearts(14); later(() => { eaten = 0; pal = (pal + 1) % PALETTES.length; applyPalette(); prog.innerHTML = Array.from({ length: FULL }, () => '<i></i>').join(''); teddy.classList.remove('dance'); }, 2600); }   // full! the day moves on
}
function applyPalette() { root.style.setProperty('--fbg', PALETTES[pal][0]); root.style.setProperty('--ftable', PALETTES[pal][1]); }
function burstHearts(n = 7) {
  const c = { x: M.tx + M.T * 0.5, y: M.ty + M.T * 0.3 };
  for (let i = 0; i < n; i++) { const h = document.createElement('i'); h.className = 'heart'; h.style.left = `${c.x + (Math.random() - 0.5) * M.T * 0.7}px`; h.style.top = `${c.y + (Math.random() - 0.3) * M.T * 0.3}px`; h.style.setProperty('--sz', `${22 + Math.random() * 20}px`); h.style.animationDelay = `${i * 70}ms`; hearts.appendChild(h); setTimeout(() => h.remove(), 1900); }
}

// ---------------------------------------------------------------- binding, language, enter / leave
function bind() {
  if (bound) return; bound = true; const unlockNow = () => unlock();
  root.addEventListener('pointerdown', unlockNow, true); root.addEventListener('touchend', unlockNow, true);
  want.addEventListener('pointerdown', () => { unlock(); if (phase === 'ask' && wanted) { voice(wanted); want.classList.remove('bounce'); void want.offsetWidth; want.classList.add('bounce'); } });   // tap the bubble to hear what Teddy wants
  teddy.addEventListener('pointerdown', () => { unlock(); if (phase === 'ask' && wanted) { teddy.classList.remove('shake'); void teddy.offsetWidth; teddy.classList.add('ask'); later(() => teddy.classList.remove('ask'), 900); } });
  document.querySelectorAll('#view-fruits .lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  $('#btn-fsound').addEventListener('click', () => { soundOn = !soundOn; $('#btn-fsound').classList.toggle('on', soundOn); setMuted(!soundOn); if (soundOn) unlock(); });
  new ResizeObserver(() => { if (running && (phase === 'ask' || phase === 'done')) place(); }).observe(stage);
}
function setLang(l) { lang = l; document.querySelectorAll('#view-fruits .lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === l)); wanted && opts.forEach((x) => loadBuf(`sounds/fruits/${l}/${x.id}.mp3`)); }
export async function enter() {
  running = true; if (!friends.length) { const an = await fetch('data/animals.json').then((r) => r.json()).catch(() => []); friends = [...an.map((a) => ({ id: a.id, img: `images/animals/${a.id}.png`, sound: a.sound })), { id: 'teddy', img: 'images/fruits/teddy.png', sound: null }]; } if (!running) return; setMuted(!soundOn); audio(); bind(); setLang('en'); eaten = 0; total = 0; lastWanted = ''; pal = 0; applyPalette();
  prog.innerHTML = Array.from({ length: FULL }, () => '<i></i>').join(''); startRound();
}
export function leave() { running = false; token++; clearTimers(); stopSound(); phase = 'idle'; }
