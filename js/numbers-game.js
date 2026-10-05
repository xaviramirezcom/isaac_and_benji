// Benji's numbers 1–20: a number appears somewhere on the screen and an animal (a different one each time, from the animals game) somewhere else. He drags the number to the frog;
// the frog gobbles it, says the number out loud, and the little dots count up with soft notes. A few seconds later, with no
// touching at all, the next number comes. Cause → effect, always the same, never a wrong answer. If he doesn't move the number,
// a ghost hand shows him how, and later the number flies to the frog by itself so the round still ends the same way.
import { audio, unlock, loadBuf, playUrl, tone, setMuted, stop as stopSound } from './sound.js';
const $ = (s) => document.querySelector(s);
const root = $('#view-numbers'), stage = $('#num-stage'), numEl = $('#num-bubble'), numVal = $('#num-val'), frog = $('#frog'), say = $('#frog-say'), sayVal = $('#say-val'), sayDots = $('#say-dots'), hand = $('#num-hand'), prog = $('#num-prog');

// where each 3D animal's mouth is (marked by hand on the picture): centre x, y, width, angle (degrees), height when wide open — all as % of its picture
export const MOUTH = {
  frog: [50, 61, 48, 0, 15], dog: [12.2, 43.1, 7.2, 0, 6.3], cat: [12.9, 47.9, 10.3, 0, 8.9], cow: [13, 38.2, 5.2, 0, 4.5], pig: [13.8, 61.9, 7.7, 0, 6.7], sheep: [13.8, 34.8, 5.5, 0, 4.8],
  horse: [10.2, 27.2, 5.2, 0, 4.5], duck: [14.2, 29.4, 6.5, 0, 5.5], rooster: [13.5, 28.4, 5.5, 0, 4.8], chicken: [16.2, 64.7, 11, 0, 10], goat: [12.3, 38.7, 5.2, 0, 4.5],
  donkey: [25.1, 54.4, 5.5, 0, 4.8], bird: [13.4, 32.3, 7.6, 0, 6.6], bee: [15.4, 64.8, 8.5, 0, 7.4], owl: [50.5, 43.6, 9, 0, 9], lion: [50.9, 74.8, 18, 0, 14], tiger: [11.5, 51.4, 6.5, 0, 5.5],
};
let animals = [], animal = null, lastAnimal = '', animalMs = 1900;
const WORDS = {
  en: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'],
  es: ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'],
};
const SPEECH = { en: 'en-US', es: 'es-ES' };
const COLORS = ['#ff6b6b', '#ff9f43', '#f7c531', '#5cc96b', '#2fb5b0', '#4a9df0', '#7a6cf0', '#c26bf0', '#f06ba8', '#8a9aa8'];
const HINT_AFTER = 9000, PAUSE_AFTER_COUNT = 2800;

let lang = 'en', n = 1, phase = 'idle', running = false, bound = false, soundOn = true;
let numAnim = null, timers = [], pos = { nx: 0, ny: 0, fx: 0, fy: 0 }, handAnim = null, drag = null, sizes = { n: 150, f: 200 };

const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; handAnim?.cancel(); handAnim = null; hand.classList.remove('on'); };

// ---------------------------------------------------------------- sound (shared, phone-proof: see js/sound.js)
const PENTA = [0, 2, 4, 7, 9];
const tick = (i) => tone(261.63 * 2 ** ((PENTA[i % 5] + 12 * Math.floor(i / 5)) / 12), 0.18, 0.14);
const pop = () => tone(420, 0.14, 0.18, 'sine', 900);
function ribbit() { if (animal) playUrl(animal.sound, { gain: 0.8, max: 1.9, stopPrev: true }); }   // the animal's own real sound, just a moment of it
const say1 = (k) => playUrl(`sounds/numbers/${lang}/${k}.mp3`, { gain: 1, stopPrev: true });
function speak() { say1(n); }

// ---------------------------------------------------------------- one round
function metrics() { const r = stage.getBoundingClientRect(), m = Math.min(r.width, r.height); sizes = { n: Math.max(120, Math.min(210, m * 0.28)), f: Math.max(170, Math.min(290, m * 0.4)) }; numEl.style.setProperty('--sz', `${sizes.n}px`); frog.style.setProperty('--sz', `${sizes.f}px`); return r; }
function place() {
  const r = metrics(), top = 96, bot = 78, side = 16, rnd = (a, b) => a + Math.random() * (b - a);
  const rangeX = (sz) => [side, Math.max(side, r.width - side - sz)], rangeY = (sz) => [top, Math.max(top, r.height - bot - sz)];
  const need = Math.min(r.width, r.height) * 0.45 + sizes.f * 0.25;         // we want them far apart, so the number has to be dragged
  let best = null, bestD = -1;
  for (let t = 0; t < 120; t++) {
    const c = { nx: rnd(...rangeX(sizes.n)), ny: rnd(...rangeY(sizes.n)), fx: rnd(...rangeX(sizes.f)), fy: rnd(...rangeY(sizes.f)) };
    const d = Math.hypot(c.nx + sizes.n / 2 - c.fx - sizes.f / 2, c.ny + sizes.n / 2 - c.fy - sizes.f / 2);
    if (d > bestD) { best = c; bestD = d; }
    if (d >= need) break;
  }
  pos = { ...best }; setNum(pos.nx, pos.ny); frog.style.transform = `translate(${pos.fx}px, ${pos.fy}px)`;
}
const setNum = (x, y) => { numEl.style.transform = `translate(${x}px, ${y}px)`; };
const mouthPt = () => { const m = MOUTH[animal?.id] ?? MOUTH.frog; return { x: sizes.f * m[0] / 100, y: sizes.f * m[1] / 100 }; };
const frogCenter = () => { const m = mouthPt(); return { x: pos.fx + m.x, y: pos.fy + m.y }; };   // the mouth
const setOpen = (v) => frog.style.setProperty('--open', Math.max(0, Math.min(1, v)).toFixed(2));   // (kept for the wiggle when the number is close)
const numCenter = () => ({ x: pos.nx + sizes.n / 2, y: pos.ny + sizes.n / 2 });

function pickAnimal() {
  if (!animals.length) return; let a; do { a = animals[Math.floor(Math.random() * animals.length)]; } while (a.id === lastAnimal && animals.length > 1);
  animal = a; lastAnimal = a.id; loadBuf(a.sound).then((b) => { if (b && animal === a) animalMs = Math.min(1900, b.duration * 1000); }); loadBuf(`sounds/numbers/${lang}/${n}.mp3`); if (n < 20) loadBuf(`sounds/numbers/${lang}/${n + 1}.mp3`); frog.querySelector('img').src = `images/animals/${a.id}.png`; new Image().src = `images/animals/${a.id}.png`;
  const m = MOUTH[a.id] ?? MOUTH.frog, mo = frog.querySelector('.mouth'); mo.style.left = `${m[0]}%`; mo.style.top = `${m[1]}%`; mo.style.width = `${m[2]}%`; mo.style.height = `${m[4]}%`; mo.style.setProperty('--rot', `${m[3]}deg`);
}
function startRound() {
  if (!running) return; clearTimers(); phase = 'wait';
  numVal.textContent = n; numEl.style.setProperty('--c', COLORS[(n - 1) % COLORS.length]);
  pickAnimal(); numAnim?.cancel(); numAnim = null; numEl.style.visibility = '';
  say.classList.remove('show'); frog.classList.remove('chomp', 'near', 'out'); setOpen(0); numEl.classList.remove('gone', 'drag', 'fly'); numEl.style.setProperty('--ds', '1.12');
  prog.innerHTML = Array.from({ length: 20 }, (_, i) => `<i class="${i < n - 1 ? 'done' : i === n - 1 ? 'now' : ''}"></i>`).join('');
  place(); frog.classList.remove('in'); numEl.classList.remove('in'); void frog.offsetWidth; frog.classList.add('in'); later(() => { numEl.classList.add('in'); pop(); }, 350);
  later(showHint, HINT_AFTER);                      // only a ghost hand shows the move — the number is never eaten unless the child drags it
}
function showHint() {
  if (phase !== 'wait' || drag) return; const a = numCenter(), b = frogCenter(); hand.classList.add('on'); numEl.classList.add('wiggle');
  handAnim = hand.animate([{ transform: `translate(${a.x}px, ${a.y}px)`, opacity: 0 }, { transform: `translate(${a.x}px, ${a.y}px)`, opacity: 1, offset: 0.15 }, { transform: `translate(${b.x}px, ${b.y}px)`, opacity: 1, offset: 0.8 }, { transform: `translate(${b.x}px, ${b.y}px)`, opacity: 0 }], { duration: 2200, iterations: Infinity, easing: 'ease-in-out' });
}
function eat(auto) {
  if (phase !== 'wait') return; phase = 'eat'; clearTimers(); numEl.classList.remove('wiggle');   // (keep the drag size so nothing jumps)
  const go = auto ? 650 : 140;                                                                   // the animal opens its mouth wide first…
  setOpen(1); frog.classList.add('near');
  later(() => {                                                                                  // …then the number goes into its mouth, getting smaller
    const m = mouthPt(), to = { x: pos.fx + m.x - sizes.n / 2, y: pos.fy + m.y - sizes.n / 2 };
    numAnim = numEl.animate([{ transform: `translate(${pos.nx}px, ${pos.ny}px) scale(1)`, opacity: 1 }, { transform: `translate(${to.x}px, ${to.y}px) scale(0.22)`, opacity: 1, offset: 0.92 }, { transform: `translate(${to.x}px, ${to.y}px) scale(0.1)`, opacity: 0 }], { duration: 480, easing: 'cubic-bezier(.45,0,.8,.5)', fill: 'forwards' });
  }, go);
  const done = go + 540;
  later(() => { numEl.style.visibility = 'hidden'; setOpen(0); frog.classList.remove('near'); frog.classList.add('chomp'); ribbit(); pop(); }, done);   // …and closes its mouth (gulp!)
  later(speakAndCount, done + (soundOn ? animalMs + 500 : 540));   // the animal's sound first, then half a second of quiet, then the number
}
function speakAndCount() {
  const word = WORDS[lang][n - 1]; sayVal.textContent = n; sayVal.style.color = COLORS[(n - 1) % COLORS.length];
  sayDots.innerHTML = Array.from({ length: n }, () => '<i></i>').join(''); say.classList.toggle('below', pos.fy < 210); say.classList.add('show'); speak();
  const gap = n > 10 ? 110 : 160, dots = sayDots.children;
  for (let i = 0; i < n; i++) later(() => { dots[i].classList.add('lit'); tick(i); }, 700 + i * gap);
  later(() => { phase = 'done'; }, 700 + n * gap);
  later(next, 700 + n * gap + PAUSE_AFTER_COUNT);
}
function next() {
  if (!running) return; frog.classList.add('out'); say.classList.remove('show');
  later(() => { n = n >= 20 ? 1 : n + 1; startRound(); }, 700);
}

// ---------------------------------------------------------------- touch: drag the number to the frog
const onAnimal = () => { const a = numCenter(), b = frogCenter(), c = { x: pos.fx + sizes.f / 2, y: pos.fy + sizes.f / 2 }; return Math.hypot(a.x - b.x, a.y - b.y) < sizes.f * 0.62 + sizes.n * 0.3 || Math.hypot(a.x - c.x, a.y - c.y) < sizes.f * 0.5 + sizes.n * 0.2; };
function bind() {
  if (bound) return; bound = true;
  const unlockNow = () => unlock(); stage.addEventListener('pointerdown', unlockNow, true); root.addEventListener('pointerdown', unlockNow, true); root.addEventListener('touchend', unlockNow, true);
  numEl.addEventListener('pointerdown', (e) => {
    if (phase !== 'wait') return; audio(); e.preventDefault(); try { numEl.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ } clearTimers(); numEl.classList.remove('wiggle'); numEl.classList.add('drag');
    const r = stage.getBoundingClientRect(); drag = { id: e.pointerId, dx: e.clientX - r.left - pos.nx, dy: e.clientY - r.top - pos.ny };
  });
  numEl.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return; const r = stage.getBoundingClientRect();
    pos.nx = Math.min(Math.max(e.clientX - r.left - drag.dx, -10), r.width - sizes.n + 10); pos.ny = Math.min(Math.max(e.clientY - r.top - drag.dy, -10), r.height - sizes.n + 10); setNum(pos.nx, pos.ny);
    const a = numCenter(), b = frogCenter(), d = Math.hypot(a.x - b.x, a.y - b.y), o = (sizes.f * 1.5 + sizes.n * 0.4 - d) / (sizes.f * 0.9); setOpen(o); frog.classList.toggle('near', o > 0.7); numEl.style.setProperty('--ds', (1.12 - 0.58 * Math.max(0, Math.min(1, o))).toFixed(2));   // the number shrinks as it nears the open mouth, so the face stays visible
  });
  const up = (e) => {
    if (!drag || e.pointerId !== drag.id) return; drag = null;
    if (onAnimal()) { eat(false); }
    else { numEl.classList.remove('drag'); numEl.style.setProperty('--ds', '1.12'); frog.classList.remove('near'); setOpen(0); later(showHint, 6000); }   // dropped somewhere else: that's fine, try again
  };
  numEl.addEventListener('pointerup', up); numEl.addEventListener('pointercancel', up);
  frog.addEventListener('pointerdown', () => { audio(); if (phase === 'done' || phase === 'eat') { ribbit(); later(speak, animalMs + 500); } });   // tap the frog: hear it again
  document.querySelectorAll('#view-numbers .lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  $('#btn-nsound').addEventListener('click', () => { soundOn = !soundOn; $('#btn-nsound').classList.toggle('on', soundOn); setMuted(!soundOn); if (soundOn) unlock(); });
  new ResizeObserver(() => { if (running && phase === 'wait' && !drag) { place(); } }).observe(stage);
}
function setLang(l) { lang = l; loadBuf(`sounds/numbers/${l}/${n}.mp3`); document.querySelectorAll('#view-numbers .lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === l)); }

export async function enter() { running = true; setMuted(!soundOn); audio(); bind(); setLang('en'); n = 1; if (!animals.length) animals = await fetch('data/animals.json').then((r) => r.json()).catch(() => []); if (!running) return; startRound(); }   // English is always the default
export function leave() { running = false; clearTimers(); stopSound(); phase = 'idle'; }
