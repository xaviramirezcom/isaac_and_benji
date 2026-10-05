// Benji's numbers 1–20: a number appears somewhere on the screen and an animal (a different one each time, from the animals game) somewhere else. He drags the number to the frog;
// the frog gobbles it, says the number out loud, and the little dots count up with soft notes. A few seconds later, with no
// touching at all, the next number comes. Cause → effect, always the same, never a wrong answer. If he doesn't move the number,
// a ghost hand shows him how, and later the number flies to the frog by itself so the round still ends the same way.
const $ = (s) => document.querySelector(s);
const root = $('#view-numbers'), stage = $('#num-stage'), numEl = $('#num-bubble'), numVal = $('#num-val'), frog = $('#frog'), say = $('#frog-say'), sayVal = $('#say-val'), sayDots = $('#say-dots'), hand = $('#num-hand'), prog = $('#num-prog');

const tongue = $('#tongue');
// where each animal's mouth is (centre x, y and size w, h as % of its picture)
const MOUTH = { frog: [50, 69, 46, 27], dog: [14, 45, 13, 11], cat: [14, 47, 10, 9], cow: [12, 46, 12, 10], pig: [14, 49, 13, 10], sheep: [13, 56, 9, 8], horse: [11, 41, 9, 8], duck: [8, 34, 11, 9], rooster: [5, 33, 9, 8], chicken: [7, 60, 9, 9], goat: [8, 45, 9, 8], donkey: [6, 48, 8, 8], bird: [7, 34, 9, 8], bee: [10, 63, 9, 9], owl: [50, 60, 13, 12], lion: [50, 64, 22, 14], tiger: [6, 52, 9, 8] };
let animals = [], animal = null, lastAnimal = '', snd = null;
const WORDS = {
  en: ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'],
  es: ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte'],
};
const SPEECH = { en: 'en-US', es: 'es-ES' };
const COLORS = ['#ff6b6b', '#ff9f43', '#f7c531', '#5cc96b', '#2fb5b0', '#4a9df0', '#7a6cf0', '#c26bf0', '#f06ba8', '#8a9aa8'];
const HINT_AFTER = 9000, ASSIST_AFTER = 22000, PAUSE_AFTER_COUNT = 2800;

let lang = 'en', n = 1, phase = 'idle', running = false, bound = false, soundOn = true, ac = null;
let numAnim = null, timers = [], pos = { nx: 0, ny: 0, fx: 0, fy: 0 }, handAnim = null, drag = null, sizes = { n: 150, f: 200 };

const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; handAnim?.cancel(); handAnim = null; hand.classList.remove('on'); };

// ---------------------------------------------------------------- sound: the frog's voice, soft counting notes
function audio() { try { ac ??= new (window.AudioContext || window.webkitAudioContext)(); ac.resume?.(); } catch { ac = null; } return ac; }
function note(freq, dur = 0.16, vol = 0.16, type = 'sine') {
  if (!soundOn || !audio()) return; const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
}
const PENTA = [0, 2, 4, 7, 9];
const tick = (i) => note(261.63 * 2 ** ((PENTA[i % 5] + 12 * Math.floor(i / 5)) / 12), 0.18, 0.14);
function pop() { if (!soundOn || !audio()) return; const t = ac.currentTime, o = ac.createOscillator(), g = ac.createGain(); o.frequency.setValueAtTime(420, t); o.frequency.exponentialRampToValueAtTime(900, t + 0.09); g.gain.setValueAtTime(0.18, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14); o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 0.16); }
function ribbit() {     // the animal's own real sound, just a moment of it
  if (!soundOn || !animal) return;
  try { snd?.pause(); snd = new Audio(animal.sound); snd.volume = 0.85; snd.play().catch(() => {}); const me = snd; later(() => { let v = 0.85; const f = setInterval(() => { v -= 0.17; if (v <= 0 || me !== snd) { clearInterval(f); me.pause(); } else me.volume = v; }, 70); }, 1500); } catch { /* no sound */ }
}
function speak(text) {
  if (!soundOn || !('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = SPEECH[lang]; u.rate = 0.7; u.pitch = 1.25; u.volume = 1; speechSynthesis.speak(u);
}

// ---------------------------------------------------------------- one round
function metrics() { const r = stage.getBoundingClientRect(), m = Math.min(r.width, r.height); sizes = { n: Math.max(120, Math.min(210, m * 0.28)), f: Math.max(150, Math.min(250, m * 0.34)) }; numEl.style.setProperty('--sz', `${sizes.n}px`); frog.style.setProperty('--sz', `${sizes.f}px`); return r; }
function place() {
  const r = metrics(), top = 96, bot = 78, side = 16, rnd = (a, b) => a + Math.random() * (b - a);
  const rangeX = (s) => [side, r.width - side - s], rangeY = (s) => [top, r.height - bot - s];
  let tries = 0, ok = false;
  while (!ok && tries++ < 60) {
    pos.nx = rnd(...rangeX(sizes.n)); pos.ny = rnd(...rangeY(sizes.n)); pos.fx = rnd(...rangeX(sizes.f)); pos.fy = rnd(...rangeY(sizes.f));
    const d = Math.hypot(pos.nx + sizes.n / 2 - pos.fx - sizes.f / 2, pos.ny + sizes.n / 2 - pos.fy - sizes.f / 2);
    ok = d > Math.min(r.width, r.height) * 0.42 + sizes.f * 0.3;
  }
  setNum(pos.nx, pos.ny); frog.style.transform = `translate(${pos.fx}px, ${pos.fy}px)`;
}
const setNum = (x, y) => { numEl.style.transform = `translate(${x}px, ${y}px)`; };
const mouthPt = () => { const m = MOUTH[animal?.id] ?? MOUTH.frog; return { x: sizes.f * m[0] / 100, y: sizes.f * m[1] / 100 }; };
const frogCenter = () => { const m = mouthPt(); return { x: pos.fx + m.x, y: pos.fy + m.y }; };   // the mouth
const setOpen = (v) => frog.style.setProperty('--open', Math.max(0, Math.min(1, v)).toFixed(2));
const numCenter = () => ({ x: pos.nx + sizes.n / 2, y: pos.ny + sizes.n / 2 });

function pickAnimal() {
  if (!animals.length) return; let a; do { a = animals[Math.floor(Math.random() * animals.length)]; } while (a.id === lastAnimal && animals.length > 1);
  animal = a; lastAnimal = a.id; const img = frog.querySelector('img'), mo = frog.querySelector('.mouth'), m = MOUTH[a.id] ?? MOUTH.frog;
  img.src = `images/animals/${a.id}.png`; mo.style.left = `${m[0] - m[2] / 2}%`; mo.style.top = `${m[1] - m[3] * 0.4}%`; mo.style.width = `${m[2]}%`; mo.style.height = `${m[3]}%`;
  new Image().src = `images/animals/${a.id}.png`;
}
function startRound() {
  if (!running) return; clearTimers(); phase = 'wait';
  numVal.textContent = n; numEl.style.setProperty('--c', COLORS[(n - 1) % COLORS.length]);
  pickAnimal(); numAnim?.cancel(); numAnim = null; numEl.style.visibility = ''; tongue.style.opacity = 0;
  say.classList.remove('show'); frog.classList.remove('chomp', 'near', 'out'); setOpen(0); numEl.classList.remove('gone', 'drag', 'fly');
  prog.innerHTML = Array.from({ length: 20 }, (_, i) => `<i class="${i < n - 1 ? 'done' : i === n - 1 ? 'now' : ''}"></i>`).join('');
  place(); frog.classList.remove('in'); numEl.classList.remove('in'); void frog.offsetWidth; frog.classList.add('in'); later(() => { numEl.classList.add('in'); pop(); }, 350);
  later(showHint, HINT_AFTER); later(() => eat(true), ASSIST_AFTER);
}
function showHint() {
  if (phase !== 'wait' || drag) return; const a = numCenter(), b = frogCenter(); hand.classList.add('on'); numEl.classList.add('wiggle');
  handAnim = hand.animate([{ transform: `translate(${a.x}px, ${a.y}px)`, opacity: 0 }, { transform: `translate(${a.x}px, ${a.y}px)`, opacity: 1, offset: 0.15 }, { transform: `translate(${b.x}px, ${b.y}px)`, opacity: 1, offset: 0.8 }, { transform: `translate(${b.x}px, ${b.y}px)`, opacity: 0 }], { duration: 2200, iterations: Infinity, easing: 'ease-in-out' });
}
function eat(auto) {
  if (phase !== 'wait') return; phase = 'eat'; clearTimers(); numEl.classList.remove('wiggle', 'drag');
  const go = auto ? 650 : 140;                                   // the frog opens wide first…
  setOpen(1); frog.classList.add('near');
  later(() => {                                                  // …shoots its tongue out, sticks to the number and pulls it into its mouth
    const m = mouthPt(), nc = numCenter(), dx = nc.x - pos.fx - m.x, dy = nc.y - pos.fy - m.y;
    const L = Math.max(12, Math.hypot(dx, dy) - sizes.n * 0.3), ang = Math.atan2(dy, dx), th = tongue.offsetHeight || 16;
    tongue.style.width = `${L}px`; tongue.style.left = `${m.x}px`; tongue.style.top = `${m.y - th / 2}px`;
    tongue.animate([{ transform: `rotate(${ang}rad) scaleX(0)`, opacity: 1 }, { transform: `rotate(${ang}rad) scaleX(1)`, opacity: 1, offset: 0.42 }, { transform: `rotate(${ang}rad) scaleX(0.04)`, opacity: 1, offset: 0.97 }, { transform: `rotate(${ang}rad) scaleX(0)`, opacity: 0 }], { duration: 640, easing: 'ease-in-out' });
    const to = { x: pos.fx + m.x - sizes.n / 2, y: pos.fy + m.y - sizes.n / 2 };
    numAnim = numEl.animate([{ transform: `translate(${pos.nx}px, ${pos.ny}px) scale(1)`, opacity: 1 }, { transform: `translate(${to.x}px, ${to.y}px) scale(0.22)`, opacity: 1, offset: 0.92 }, { transform: `translate(${to.x}px, ${to.y}px) scale(0.1)`, opacity: 0 }], { duration: 460, delay: 260, easing: 'cubic-bezier(.45,0,.8,.5)', fill: 'forwards' });
  }, go);
  later(() => { numEl.style.visibility = 'hidden'; setOpen(0); frog.classList.remove('near'); frog.classList.add('chomp'); ribbit(); pop(); }, go + 760);   // …and swallows it
  later(speakAndCount, go + 1300);
}
function speakAndCount() {
  const word = WORDS[lang][n - 1]; sayVal.textContent = n; sayVal.style.color = COLORS[(n - 1) % COLORS.length];
  sayDots.innerHTML = Array.from({ length: n }, () => '<i></i>').join(''); say.classList.toggle('below', pos.fy < 210); say.classList.add('show'); speak(word);
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
function bind() {
  if (bound) return; bound = true;
  numEl.addEventListener('pointerdown', (e) => {
    if (phase !== 'wait') return; audio(); e.preventDefault(); try { numEl.setPointerCapture(e.pointerId); } catch { /* synthetic pointer */ } clearTimers(); numEl.classList.remove('wiggle'); numEl.classList.add('drag');
    const r = stage.getBoundingClientRect(); drag = { id: e.pointerId, dx: e.clientX - r.left - pos.nx, dy: e.clientY - r.top - pos.ny };
  });
  numEl.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return; const r = stage.getBoundingClientRect();
    pos.nx = Math.min(Math.max(e.clientX - r.left - drag.dx, -10), r.width - sizes.n + 10); pos.ny = Math.min(Math.max(e.clientY - r.top - drag.dy, -10), r.height - sizes.n + 10); setNum(pos.nx, pos.ny);
    const a = numCenter(), b = frogCenter(), d = Math.hypot(a.x - b.x, a.y - b.y), o = (sizes.f * 1.5 + sizes.n * 0.4 - d) / (sizes.f * 0.9); setOpen(o); frog.classList.toggle('near', o > 0.7);
  });
  const up = (e) => {
    if (!drag || e.pointerId !== drag.id) return; drag = null; numEl.classList.remove('drag'); const a = numCenter(), b = frogCenter();
    if (Math.hypot(a.x - b.x, a.y - b.y) < sizes.f * 0.62 + sizes.n * 0.3) { eat(false); }
    else { frog.classList.remove('near'); setOpen(0); later(showHint, 6000); later(() => eat(true), 16000); }   // dropped somewhere else: that's fine, try again
  };
  numEl.addEventListener('pointerup', up); numEl.addEventListener('pointercancel', up);
  frog.addEventListener('pointerdown', () => { audio(); if (phase === 'done' || phase === 'eat') { speak(WORDS[lang][n - 1]); ribbit(); } });   // tap the frog: hear it again
  document.querySelectorAll('#view-numbers .lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  $('#btn-nsound').addEventListener('click', () => { soundOn = !soundOn; $('#btn-nsound').classList.toggle('on', soundOn); if (!soundOn) speechSynthesis?.cancel(); });
  new ResizeObserver(() => { if (running && phase === 'wait' && !drag) { place(); } }).observe(stage);
}
function setLang(l) { lang = l; document.querySelectorAll('#view-numbers .lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === l)); }

export async function enter() { running = true; bind(); setLang('en'); n = 1; if (!animals.length) animals = await fetch('data/animals.json').then((r) => r.json()).catch(() => []); if (!running) return; startRound(); }   // English is always the default
export function leave() { running = false; clearTimers(); speechSynthesis?.cancel(); snd?.pause(); phase = 'idle'; }
