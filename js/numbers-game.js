// Benji's numbers 1–10 — "count the animals".
// A number bubble appears, and a group of that many animals (all the same kind, a different kind each round) stands on the other side of the screen.
// Benji drags the number to the animals; then the app counts them out loud, one by one, lighting each animal up with its own number
// ("one, two, three…") until the whole group is counted and the number is said once more. A few seconds later the next number comes.
// Nothing happens unless he drags the number; if he waits, a ghost hand shows how. Never a wrong answer.
import { audio, unlock, loadBuf, playUrl, tone, setMuted, stop as stopSound } from './sound.js';
const $ = (s) => document.querySelector(s);
const root = $('#view-numbers'), stage = $('#num-stage'), numEl = $('#num-bubble'), numVal = $('#num-val'), herd = $('#num-herd'), hand = $('#num-hand'), prog = $('#num-prog');

const COLORS = ['#ff6b6b', '#ff9f43', '#f7c531', '#5cc96b', '#2fb5b0', '#4a9df0', '#7a6cf0', '#c26bf0', '#f06ba8', '#8a9aa8'];
const HINT_AFTER = 9000, MAX = 10, STEP = 900;

let animals = [], kind = null, lastKind = '', lang = 'en', n = 1, phase = 'idle', running = false, bound = false, soundOn = true;
let timers = [], handAnim = null, drag = null, numAnim = null;
let pos = { nx: 0, ny: 0 }, sz = 150, ans = [], herdTop = true, L = { w: 0, h: 0, herd: { x: 0, y: 0, w: 0, h: 0 } };

const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; handAnim?.cancel(); handAnim = null; hand.classList.remove('on'); };
const pop = () => tone(420, 0.14, 0.18, 'sine', 900);
const say1 = (k) => playUrl(`sounds/numbers/${lang}/${k}.mp3`, { gain: 1, stopPrev: true });
const PENTA = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21];
const tick = (i) => tone(261.63 * 2 ** (PENTA[i] / 12), 0.2, 0.12);
const safeTop = () => parseFloat(getComputedStyle(root).paddingTop) || 0;

// ---------------------------------------------------------------- layout: the group on one side, the number on the other
function layout() {
  const r = stage.getBoundingClientRect(), w = r.width, h = r.height, top = safeTop() + 120, bot = 78, side = 16;
  sz = Math.max(120, Math.min(190, Math.min(w, h) * 0.28));
  const bandH = (h - top - bot) * 0.62, area = { x: side, y: herdTop ? top : h - bot - bandH, w: w - 2 * side, h: bandH };       // the group fills a band across the screen
  let best = { cell: 0, cols: 1 };                                                                                              // the grid that gives the biggest animals that still fit
  for (let cols = 1; cols <= n; cols++) { const rows = Math.ceil(n / cols), cell = Math.min(area.w / cols, area.h / rows); if (cell > best.cell) best = { cell, cols }; }
  const cell = Math.min(best.cell, 250 / (1 + 0.12 * (n - 1)));   // the more animals, the smaller each one
  const cols = best.cols, rows = Math.ceil(n / cols), gw = cols * cell, gh = rows * cell, gx = area.x + (area.w - gw) / 2, gy = area.y + (area.h - gh) / 2;
  ans.forEach((a, i) => { const row = Math.floor(i / cols), inRow = row === rows - 1 ? n - cols * (rows - 1) : cols, col = i - row * cols, off = (cols - inRow) * cell / 2; a.el.style.width = a.el.style.height = `${cell}px`; a.el.style.setProperty('--cell', `${cell}px`); a.el.style.transform = `translate(${gx + off + col * cell}px, ${gy + row * cell}px)`; });
  L = { w, h, herd: { x: gx, y: gy, w: gw, h: gh } };
  numEl.style.setProperty('--sz', `${sz}px`);
}
function placeNumber() {
  const g = L.herd, top = safeTop() + 120, bot = 78, lo = herdTop ? Math.max(g.y + g.h + 24, top) : top, hi = herdTop ? L.h - bot - sz : g.y - sz - 24;     // the number goes where the animals are not
  pos.nx = 16 + Math.random() * Math.max(0, L.w - 32 - sz); pos.ny = hi > lo ? lo + Math.random() * (hi - lo) : Math.max(top, Math.min(lo, L.h - bot - sz));
  setNum(pos.nx, pos.ny);
}
const setNum = (x, y) => { numEl.style.transform = `translate(${x}px, ${y}px)`; };
const numCenter = () => ({ x: pos.nx + sz / 2, y: pos.ny + sz / 2 });
const herdCenter = () => ({ x: L.herd.x + L.herd.w / 2, y: L.herd.y + L.herd.h / 2 });
const overHerd = (m = 0) => { const c = numCenter(), g = L.herd, mx = g.w * 0.12 + sz * 0.3 + m, my = g.h * 0.12 + sz * 0.3 + m; return c.x > g.x - mx && c.x < g.x + g.w + mx && c.y > g.y - my && c.y < g.y + g.h + my; };

// ---------------------------------------------------------------- one round
function pickKind() { let a; do { a = animals[Math.floor(Math.random() * animals.length)]; } while (a.id === lastKind && animals.length > 1); kind = a; lastKind = a.id; loadBuf(`sounds/numbers/${lang}/${n}.mp3`); if (n < MAX) loadBuf(`sounds/numbers/${lang}/${n + 1}.mp3`); new Image().src = `images/animals/${a.id}.png`; }
function startRound() {
  if (!running || !animals.length) return; clearTimers(); numAnim?.cancel(); numAnim = null; phase = 'wait'; drag = null; pickKind();
  numVal.textContent = n; numEl.style.setProperty('--c', COLORS[(n - 1) % COLORS.length]); numEl.style.visibility = ''; numEl.classList.remove('drag', 'in', 'wiggle', 'big', 'vanish'); numEl.style.setProperty('--ds', '1.12');
  prog.innerHTML = Array.from({ length: MAX }, (_, i) => `<i class="${i < n - 1 ? 'done' : i === n - 1 ? 'now' : ''}"></i>`).join('');
  herd.style.setProperty('--grow', '1'); herd.innerHTML = ''; herdTop = Math.random() < 0.5;
  ans = Array.from({ length: n }, () => { const el = document.createElement('div'); el.className = 'herd-an'; el.innerHTML = `<div class="hi"><img src="images/animals/${kind.id}.png" alt="" draggable="false"><b class="badge"></b></div>`; herd.appendChild(el); return { el, hi: el.firstChild, badge: el.querySelector('.badge') }; });
  layout(); placeNumber(); ans.forEach((a, i) => later(() => a.el.classList.add('in'), 100 + i * 90));
  later(() => { numEl.classList.add('in'); pop(); }, 350 + n * 40); later(showHint, HINT_AFTER);
}
function showHint() {   // a ghost hand shows the move — nothing is ever counted for him
  if (phase !== 'wait' || drag) return; const a = numCenter(), b = herdCenter(); hand.classList.add('on'); numEl.classList.add('wiggle');
  handAnim = hand.animate([{ transform: `translate(${a.x}px, ${a.y}px)`, opacity: 0 }, { transform: `translate(${a.x}px, ${a.y}px)`, opacity: 1, offset: 0.15 }, { transform: `translate(${b.x}px, ${b.y}px)`, opacity: 1, offset: 0.8 }, { transform: `translate(${b.x}px, ${b.y}px)`, opacity: 0 }], { duration: 2200, iterations: Infinity, easing: 'ease-in-out' });
}
function startCount() {
  phase = 'count'; clearTimers(); numEl.classList.remove('wiggle', 'in', 'drag'); numEl.classList.add('vanish'); pop();       // the number is "used up": it pops away, and the animals take over
  ans.forEach((a, i) => later(() => highlight(a, i + 1), 800 + i * STEP));                                                                         // count them, one by one
  const end = 800 + n * STEP;
  later(() => { phase = 'done'; ans.forEach((a, i) => later(() => { a.hi.classList.remove('jump'); void a.hi.offsetWidth; a.hi.classList.add('jump'); }, i * 50)); pop(); }, end);   // all together!
  later(() => say1(n), end + 350);                                                                                                                 // …and the number once more
  later(next, end + 350 + 3300);
}
function highlight(a, i) {
  ans.forEach((o) => o.el.classList.remove('hl')); a.el.classList.add('hl', 'counted'); a.badge.textContent = i; a.badge.style.background = COLORS[(i - 1) % COLORS.length];
  a.hi.classList.remove('jump'); void a.hi.offsetWidth; a.hi.classList.add('jump'); say1(i); tick(i - 1);
}
function next() { if (!running) return; phase = 'between'; herd.classList.add('away'); later(() => { herd.classList.remove('away'); n = n >= MAX ? 1 : n + 1; startRound(); }, 700); }

// ---------------------------------------------------------------- touch: drag the number to the animals
function bind() {
  if (bound) return; bound = true;
  const unlockNow = () => unlock(); stage.addEventListener('pointerdown', unlockNow, true); root.addEventListener('pointerdown', unlockNow, true); root.addEventListener('touchend', unlockNow, true);
  numEl.addEventListener('pointerdown', (e) => {
    if (phase !== 'wait') return; unlock(); e.preventDefault(); try { numEl.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ } clearTimers(); numEl.classList.remove('wiggle'); numEl.classList.add('drag');
    const r = stage.getBoundingClientRect(); drag = { id: e.pointerId, dx: e.clientX - r.left - pos.nx, dy: e.clientY - r.top - pos.ny };
  });
  numEl.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return; const r = stage.getBoundingClientRect();
    pos.nx = Math.min(Math.max(e.clientX - r.left - drag.dx, -10), r.width - sz + 10); pos.ny = Math.min(Math.max(e.clientY - r.top - drag.dy, -10), r.height - sz + 10); setNum(pos.nx, pos.ny);
    const c = numCenter(), hc = herdCenter(), prox = Math.max(0, Math.min(1, 1 - Math.hypot(c.x - hc.x, c.y - hc.y) / (Math.max(L.w, L.h) * 0.55)));
    herd.style.setProperty('--grow', (1 + 0.3 * prox * prox).toFixed(3));                                                          // the closer the number, the bigger the animals get
  });
  const up = (e) => {
    if (!drag || e.pointerId !== drag.id) return; drag = null;
    if (overHerd()) startCount();
    else { numEl.classList.remove('drag'); herd.style.setProperty('--grow', '1'); later(showHint, 6000); }                                      // dropped somewhere else: that's fine, try again
  };
  numEl.addEventListener('pointerup', up); numEl.addEventListener('pointercancel', up);
  document.querySelectorAll('#view-numbers .lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  $('#btn-nsound').addEventListener('click', () => { soundOn = !soundOn; $('#btn-nsound').classList.toggle('on', soundOn); setMuted(!soundOn); if (soundOn) unlock(); });
  new ResizeObserver(() => { if (running && phase === 'wait' && !drag && ans.length) { layout(); placeNumber(); } }).observe(stage);
}
function setLang(l) { lang = l; document.querySelectorAll('#view-numbers .lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === l)); for (let i = 1; i <= MAX; i++) loadBuf(`sounds/numbers/${l}/${i}.mp3`); }

export async function enter() {
  running = true; setMuted(!soundOn); audio(); bind(); setLang('en'); n = 1;
  if (!animals.length) animals = await fetch('data/animals.json').then((r) => r.json()).catch(() => []);
  if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__numbers = { goto(k) { n = k; startRound(); } };   // dev helper
  if (!running) return; startRound();
}
export function leave() { running = false; clearTimers(); stopSound(); phase = 'idle'; }
