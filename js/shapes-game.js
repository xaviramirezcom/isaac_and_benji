// Benji's shapes — "Shape friends": matching games that quietly train FLEXIBLE THINKING.
// The rule keeps changing in a gentle, predictable rhythm, and the scene changes colour so he can SEE the switch:
//   blue scene  — match the SHAPE (drag the shape to the hole with the same shape)
//   orange scene — match the COLOUR (now the same kind of piece goes to the same colour, whatever its shape)
//   green scene — PATTERN train: what comes next? (patterns change too: ABAB, then AAB, then ABC; shapes vary, then colours vary)
// Switching between rules (and between kinds of patterns) is exactly what builds cognitive flexibility.
// Every right move is celebrated by a different animal that jumps in and makes its real sound. A wrong move is never "wrong": the piece just slides back
// (a ghost hand shows the way after a while). Nothing is said or played unless Benji touches something.
import { audio, unlock, loadBuf, playUrl, tone, nope, chime, setMuted, stop as stopSound } from './sound.js';
const $ = (s) => document.querySelector(s);
const root = $('#view-shapes'), stage = $('#sh-stage'), rule = $('#sh-rule'), field = $('#sh-field'), tray = $('#sh-tray'), burst = $('#sh-burst'), pet = $('#sh-pet'), prog = $('#sh-prog'), hand = $('#sh-hand');

const COLORS = { red: '#ff4d4d', blue: '#3b82f6', yellow: '#ffd23f', green: '#3fc66b', orange: '#ff9f43', purple: '#a66cff' };
const SHAPES = ['circle', 'square', 'triangle', 'star', 'heart'];
const NAMES = { en: { circle: 'Circle', square: 'Square', triangle: 'Triangle', star: 'Star', heart: 'Heart', red: 'Red', blue: 'Blue', yellow: 'Yellow', green: 'Green', orange: 'Orange', purple: 'Purple' }, es: { circle: 'Círculo', square: 'Cuadrado', triangle: 'Triángulo', star: 'Estrella', heart: 'Corazón', red: 'Rojo', blue: 'Azul', yellow: 'Amarillo', green: 'Verde', orange: 'Naranja', purple: 'Morado' } };
const RULE_TXT = { shape: { en: 'Same shape', es: 'Misma forma' }, color: { en: 'Same color', es: 'Mismo color' }, pattern: { en: 'What comes next?', es: '¿Qué sigue?' } };
const SCENE = { shape: '#d9eefe', color: '#ffe6cc', pattern: '#dcf6dc' };
const HINT_AFTER = 9000, TRAINS = { same: ['A'], easy: ['AB'], medium: ['AB', 'AB', 'AAB'], full: ['AB', 'AB', 'AAB', 'ABC', 'AAB', 'ABC'] };
// the grown-up settings (saved on this device): which games, how hard the train is, how long each rule lasts
const DEF = { games: { shape: true, color: true, pattern: false }, train: 'same', per: 3, shapes: 3 }, G = (shape, color, pattern) => ({ shape, color, pattern });
const PRESETS = { 1: { games: G(true, false, false), train: 'same', per: 4, shapes: 3 }, 2: { games: G(true, true, false), train: 'same', per: 3, shapes: 3 }, 3: { games: G(true, true, true), train: 'same', per: 3, shapes: 3 }, 4: { games: G(true, true, true), train: 'easy', per: 3, shapes: 3 }, 5: { games: G(true, true, true), train: 'full', per: 3, shapes: 4 } };
let cfg = (() => { try { return { ...DEF, ...JSON.parse(localStorage.getItem('shapesCfg')) }; } catch { return { ...DEF }; } })();
const saveCfg = () => { try { localStorage.setItem('shapesCfg', JSON.stringify(cfg)); } catch { /* private mode */ } };
const TX = { en: { title: 'For grown-ups', help: 'Choose what Benji plays. The scene changes colour when the rule changes.', games: 'Games', shape: 'Shape', color: 'Color', pattern: 'Train', train: 'Train difficulty', same: 'Easiest: same again', easy: 'A-B', medium: '+ A-A-B', full: '+ A-B-C', per: 'Rounds before the rule changes', sh: 'Shapes to choose from', pre: 'Quick levels (for a 2-year-old start at 1 or 2)', p1: '1 Shapes only', p2: '2 + Colors', p3: '3 + Train: same again', p4: '4 + Train: A-B', p5: '5 Everything', done: 'Done' },
  es: { title: 'Para adultos', help: 'Elige qué juega Benji. La escena cambia de color cuando cambia la regla.', games: 'Juegos', shape: 'Forma', color: 'Color', pattern: 'Tren', train: 'Dificultad del tren', same: 'Lo más fácil: igual otra vez', easy: 'A-B', medium: '+ A-A-B', full: '+ A-B-C', per: 'Rondas antes de cambiar la regla', sh: 'Formas para elegir', pre: 'Niveles rápidos (a los 2 años, empieza en 1 o 2)', p1: '1 Solo formas', p2: '2 + Colores', p3: '3 + Tren: igual otra vez', p4: '4 + Tren: A-B', p5: '5 Todo', done: 'Listo' } };

let animals = [], lang = 'en', running = false, bound = false, soundOn = true, round = 0, plan = [], cur = null, lastAnimal = '', busy = false, timers = [], drag = null, misses = 0, handAnim = null, patNo = 0;
const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; handAnim?.cancel(); handAnim = null; hand.classList.remove('on'); };
const say = (id) => playUrl(`sounds/shapes/${lang}/${id}.mp3`, { gain: 1, stopPrev: true });

// ---------------------------------------------------------------- shapes drawn as clean SVG
const starPath = () => { const p = []; for (let i = 0; i < 10; i++) { const r = i % 2 ? 19 : 45, a = -Math.PI / 2 + i * Math.PI / 5; p.push(`${(50 + r * Math.cos(a)).toFixed(1)},${(54 + r * Math.sin(a)).toFixed(1)}`); } return `M${p.join('L')}Z`; };
const GEO = { circle: '<circle cx="50" cy="50" r="40"/>', square: '<rect x="14" y="14" width="72" height="72" rx="8"/>', triangle: '<path d="M50 14L87 82H13Z"/>', star: `<path d="${starPath()}"/>`, heart: '<path d="M50 86C14 60 12 30 31 23C42 19 50 27 50 33C50 27 58 19 69 23C88 30 86 60 50 86Z"/>' };
function svg(shape, color, mode = 'solid') {   // mode: solid piece, or home (a dashed outline waiting to be filled)
  const c = COLORS[color] ?? color;
  const st = mode === 'home' || mode === 'chome' ? `fill="${c}" fill-opacity="${mode === 'chome' ? .38 : .16}" stroke="${c}" stroke-opacity=".95" stroke-width="5" stroke-dasharray="9 8" stroke-linejoin="round"` : `fill="${c}" stroke="${c}" stroke-width="10" stroke-linejoin="round"`;
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><g ${st}>${GEO[shape]}</g>${mode === 'solid' ? `<g fill="#fff" opacity=".28" transform="translate(-2 -3) scale(.9)" style="transform-origin:50px 50px"><ellipse cx="38" cy="32" rx="14" ry="7" transform="rotate(-25 38 32)"/></g>` : ''}</svg>`;
}
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const shuffle = (a) => a.map((v) => [Math.random(), v]).sort((x, y) => x[0] - y[0]).map((x) => x[1]);

// ---------------------------------------------------------------- the plan: three rounds of each rule, then it comes round again a little harder
function buildPlan() {
  plan = []; const on = ['shape', 'color', 'pattern'].filter((m) => cfg.games[m]); if (!on.length) on.push('shape');
  for (let c = 0; c < 40; c++) { const n = Math.min(4, cfg.shapes); for (const m of on) for (let k = 0; k < (m === 'pattern' && cfg.train !== 'full' && cfg.train !== 'medium' ? Math.min(2, cfg.per) : cfg.per); k++) plan.push({ m, n }); }
}
function setScene(m) { stage.style.background = SCENE[m]; root.dataset.rule = m; rule.className = 'sh-rule ' + m; rule.querySelector('b').textContent = RULE_TXT[m][lang]; }
const ICON = { shape: svg('triangle', 'blue') + svg('circle', 'red') + svg('square', 'yellow'), color: ['red', 'blue', 'yellow'].map((c) => `<i style="background:${COLORS[c]}"></i>`).join(''), pattern: svg('circle', 'red') + svg('square', 'blue') + svg('circle', 'red') };
function setIcon(m) { rule.querySelector('.ico').innerHTML = ICON[m]; }

// ---------------------------------------------------------------- one round
function startRound() {
  if (!running || !animals.length) return; clearTimers(); busy = false; misses = 0; drag = null; const p = plan[round % plan.length], prev = plan[(round - 1 + plan.length) % plan.length];
  const switched = round > 0 && prev.m !== p.m; field.innerHTML = ''; tray.innerHTML = ''; cur = { m: p.m, targets: [], pieces: [], ans: null };
  setScene(p.m); setIcon(p.m); if (switched) { rule.classList.remove('flip'); void rule.offsetWidth; rule.classList.add('flip'); stage.classList.remove('swoosh'); void stage.offsetWidth; stage.classList.add('swoosh'); }
  if (p.m === 'shape') roundShape(p.n); else if (p.m === 'color') roundColor(p.n); else roundPattern(p.n);
  renderProg(); later(showHint, HINT_AFTER); [...field.querySelectorAll('.sh-home,.sh-slot')].forEach((el, i) => { el.style.animationDelay = `${i * 80}ms`; });
}
function roundShape(n) {
  const set = SHAPES.slice(0, n), want = pick(set), col = pick(Object.keys(COLORS).slice(0, 4)); field.className = 'sh-field homes';
  cur.targets = shuffle(set).map((s) => addTarget(svg(s, '#2f5d8a', 'home'), { shape: s }, 'sh-home')); cur.ans = cur.targets.find((t) => t.key.shape === want);
  addPiece({ shape: want, color: col }, want);
}
function roundColor(n) {
  const cols = shuffle(['red', 'blue', 'yellow', 'green']).slice(0, n - 0 > 4 ? 4 : n), want = pick(cols), shape = pick(SHAPES.slice(0, 4)); field.className = 'sh-field homes';
  cur.targets = cols.map((c) => addTarget(svg('circle', c, 'chome'), { color: c }, 'sh-home')); cur.ans = cur.targets.find((t) => t.key.color === want);
  addPiece({ shape, color: want }, want);
}
function roundPattern() {
  const type = TRAINS[cfg.train][patNo++ % TRAINS[cfg.train].length], byShape = patNo % 2 === 1, shapes = shuffle(SHAPES.slice(0, 4)), cols = shuffle(['red', 'blue', 'yellow', 'green']), baseShape = pick(shapes), baseCol = pick(cols);
  const el = (i) => (byShape ? { shape: shapes[i], color: baseCol } : { shape: baseShape, color: cols[i] });
  const unit = { A: [0], AB: [0, 1], AAB: [0, 0, 1], ABC: [0, 1, 2] }[type], shown = type === 'A' ? 3 : type === 'AB' ? (cfg.train === 'easy' ? 3 : 4) : 5, seq = Array.from({ length: shown + 1 }, (_, i) => unit[i % unit.length]);
  field.className = 'sh-field train'; field.innerHTML = '<div class="sh-engine">🚂</div>';
  seq.slice(0, shown).forEach((u) => { const c = document.createElement('div'); c.className = 'sh-car'; c.innerHTML = svg(el(u).shape, el(u).color); field.appendChild(c); });
  const want = el(seq[shown]), t = addTarget('<span class="q">?</span>', want, 'sh-slot', true); cur.targets = [t]; cur.ans = t;
  const other = el(unit.find((u) => u !== seq[shown]) ?? (seq[shown] + 1) % 3), opts = shuffle([want, other]); opts.forEach((o) => addPiece(o, byShape ? o.shape : o.color));
}
function addTarget(html, key, cls, inCar) { const d = document.createElement('div'); d.className = cls + (inCar ? ' sh-car' : ''); d.innerHTML = html; field.appendChild(d); return { el: d, key }; }
function addPiece(key, nameId) {
  const d = document.createElement('div'); d.className = 'sh-piece'; d.innerHTML = svg(key.shape, key.color); tray.appendChild(d); setTimeout(() => d.classList.add('settled'), 700); const pc = { el: d, key, nameId }; cur.pieces.push(pc);
  d.addEventListener('pointerdown', (e) => down(e, pc)); return pc;
}
const same = (a, b) => (b.shape === undefined || a.shape === b.shape) && (b.color === undefined || a.color === b.color);

// ---------------------------------------------------------------- touch
const ctr = (el) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: Math.min(r.width, r.height) / 2 }; };
function down(e, pc) {
  if (busy || drag) return; unlock(); e.preventDefault(); try { pc.el.setPointerCapture(e.pointerId); } catch { /* synthetic */ } clearTimers(); hand.classList.remove('on'); pc.el.classList.remove('wiggle');
  const c = ctr(pc.el); drag = { pc, id: e.pointerId, x0: e.clientX, y0: e.clientY, ox: c.x, oy: c.y }; pc.el.classList.add('drag'); say(pc.nameId);          // touching a piece says its name
}
function move(e) {
  if (!drag || e.pointerId !== drag.id) return; const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0; drag.pc.tx = dx; drag.pc.ty = dy; drag.pc.el.style.transform = `translate(${dx}px, ${dy}px) scale(1.12)`;
  const c = { x: drag.ox + dx, y: drag.oy + dy }, hit = nearest(c); cur.targets.forEach((t) => t.el.classList.toggle('hot', t === hit));
}
function nearest(c) { let best = null, bd = 1e9; for (const t of cur.targets) { if (t.done) continue; const m = ctr(t.el), d = Math.hypot(c.x - m.x, c.y - m.y); if (d < bd && d < m.r * 1.5) { bd = d; best = t; } } return best; }
function up(e) {
  if (!drag || e.pointerId !== drag.id) return; const { pc } = drag; drag = null; const c = ctr(pc.el), hit = nearest(c); pc.el.classList.remove('drag'); cur.targets.forEach((t) => t.el.classList.remove('hot'));
  if (hit && same(pc.key, hit.key)) win(pc, hit);
  else {
    if (hit) { nope(); misses++; }                                                                                                    // a gentle "uh-uh", never a penalty
    pc.tx = pc.ty = 0; pc.el.style.transition = 'transform .35s cubic-bezier(.3,1.4,.5,1)'; pc.el.style.transform = ''; setTimeout(() => { pc.el.style.transition = ''; }, 380);
    if (misses >= 2) pulse(); later(showHint, misses >= 2 ? 1200 : 6000);
  }
}
function pulse() { const t = cur.ans; t.el.classList.remove('hint'); void t.el.offsetWidth; t.el.classList.add('hint'); }
function showHint() {   // the ghost hand shows the move
  if (busy || drag || !cur) return; const pc = cur.pieces.find((p) => !p.gone && (cur.m !== 'pattern' || same(p.key, cur.ans.key))); if (!pc) return; const a = ctr(pc.el), b = ctr(cur.ans.el);
  pc.el.classList.add('wiggle'); hand.classList.add('on'); handAnim = hand.animate([{ transform: `translate(${a.x}px, ${a.y}px)`, opacity: 0 }, { transform: `translate(${a.x}px, ${a.y}px)`, opacity: 1, offset: 0.15 }, { transform: `translate(${b.x}px, ${b.y}px)`, opacity: 1, offset: 0.8 }, { transform: `translate(${b.x}px, ${b.y}px)`, opacity: 0 }], { duration: 2200, iterations: Infinity, easing: 'ease-in-out' });
}

// ---------------------------------------------------------------- right answer: it snaps in, then an animal jumps in and makes its sound
function win(pc, target) {
  busy = true; clearTimers(); target.done = true; pc.gone = true; const a = ctr(pc.el), b = ctr(target.el);
  pc.el.style.transition = 'transform .28s cubic-bezier(.3,1.5,.5,1)'; pc.el.style.transform = `translate(${(pc.tx || 0) + b.x - a.x}px, ${(pc.ty || 0) + b.y - a.y}px) scale(1)`;
  cur.pieces.forEach((o) => { if (o !== pc) o.el.style.opacity = 0.25; });
  setTimeout(() => { target.el.innerHTML = svg(pc.key.shape, pc.key.color); target.el.classList.add('filled'); pc.el.style.visibility = 'hidden'; tone(520, 0.16, 0.18, 'sine', 780); sparkle(b.x, b.y, pc.key.color); }, 250);
  later(() => celebrate(), 520);
}
function sparkle(x, y, color) {
  const r = stage.getBoundingClientRect();
  for (let i = 0; i < 14; i++) { const d = document.createElement('i'); d.className = 'sh-spark'; const a = Math.random() * 6.28, v = 70 + Math.random() * 110; d.style.left = `${x - r.left}px`; d.style.top = `${y - r.top}px`; d.style.setProperty('--dx', `${Math.cos(a) * v}px`); d.style.setProperty('--dy', `${Math.sin(a) * v - 30}px`); d.style.background = pick(Object.values(COLORS)); d.style.setProperty('--sz', `${10 + Math.random() * 14}px`); burst.appendChild(d); setTimeout(() => d.remove(), 900); }
}
function celebrate() {
  let a; do { a = pick(animals); } while (a.id === lastAnimal && animals.length > 1); lastAnimal = a.id;
  pet.innerHTML = `<img src="images/animals/${a.id}.png" alt="" draggable="false"><b>${a[lang]}</b>`; pet.classList.remove('show'); void pet.offsetWidth; pet.classList.add('show'); chime(0.1);
  playUrl(a.sound, { gain: 0.95, max: 3, stopPrev: true });                                                                          // the animal's real sound
  for (let i = 0; i < 4; i++) later(() => sparkle(stage.clientWidth * (0.2 + Math.random() * 0.6) + stage.getBoundingClientRect().left, stage.clientHeight * (0.25 + Math.random() * 0.4) + stage.getBoundingClientRect().top, 'x'), i * 250);
  round++; later(() => { pet.classList.remove('show'); }, 2700); later(startRound, 3000);
}
function renderProg() { const n = Math.min(plan.length, 9), k = round % n; prog.innerHTML = Array.from({ length: n }, (_, i) => `<i class="${i < k ? 'done' : i === k ? 'now' : ''}"></i>`).join(''); }

// ---------------------------------------------------------------- setup
function bind() {
  if (bound) return; bound = true; bindPanel(); root.addEventListener('pointerdown', () => unlock(), true); root.addEventListener('touchend', () => unlock(), true);
  document.addEventListener('pointermove', move); document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
  document.querySelectorAll('#view-shapes .lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  $('#btn-shsound').addEventListener('click', () => { soundOn = !soundOn; $('#btn-shsound').classList.toggle('on', soundOn); setMuted(!soundOn); if (soundOn) unlock(); });
  rule.addEventListener('pointerdown', () => { unlock(); if (cur) say('rule_' + cur.m); });                                       // tap the rule to hear it
}
function setLang(l) {
  lang = l; if (!panel.hidden) paintPanel(); document.querySelectorAll('#view-shapes .lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === l)); if (cur) rule.querySelector('b').textContent = RULE_TXT[cur.m][l];
  [...SHAPES, ...Object.keys(COLORS), 'rule_shape', 'rule_color', 'rule_pattern'].forEach((id) => loadBuf(`sounds/shapes/${l}/${id}.mp3`)); animals.slice(0, 4).forEach((a) => { loadBuf(a.sound); new Image().src = `images/animals/${a.id}.png`; });
}
// ---------------------------------------------------------------- the grown-up panel (press and hold the gear)
const panel = $('#sh-adult');
function paintPanel() {
  const t = TX[lang]; $('#sha-title').textContent = t.title; $('#sha-help').textContent = t.help; $('#sha-l-games').textContent = t.games; $('#sha-l-train').textContent = t.train; $('#sha-l-per').textContent = t.per; $('#sha-l-sh').textContent = t.sh; $('#sha-l-pre').textContent = t.pre; $('#sha-done-l').textContent = t.done;
  panel.querySelectorAll('#sha-games button').forEach((b) => { b.textContent = t[b.dataset.k]; b.classList.toggle('on', !!cfg.games[b.dataset.k]); });
  panel.querySelectorAll('#sha-train button').forEach((b) => { b.textContent = t[b.dataset.v]; b.classList.toggle('on', cfg.train === b.dataset.v); });
  panel.querySelectorAll('#sha-per button').forEach((b) => b.classList.toggle('on', +b.dataset.v === cfg.per));
  panel.querySelectorAll('#sha-shapes button').forEach((b) => b.classList.toggle('on', +b.dataset.v === cfg.shapes));
  panel.querySelectorAll('#sha-pre button').forEach((b) => { b.textContent = t['p' + b.dataset.p]; });
}
function applyCfg() { saveCfg(); paintPanel(); buildPlan(); round = 0; patNo = 0; startRound(); }
function bindPanel() {
  const gear = $('#btn-shgear'); let hold = 0, t0 = 0, opened = false;
  const open = () => { opened = true; clearTimeout(hold); gear.classList.remove('holding'); paintPanel(); panel.hidden = false; clearTimers(); };
  const start = (e) => { e.preventDefault(); unlock(); opened = false; t0 = performance.now(); gear.classList.add('holding'); clearTimeout(hold); hold = setTimeout(open, 800); };
  const end = () => { clearTimeout(hold); gear.classList.remove('holding'); if (!opened && performance.now() - t0 < 700) tip(); };   // a quick tap only shows how to open it
  gear.addEventListener('pointerdown', start); ['pointerup', 'pointercancel'].forEach((ev) => gear.addEventListener(ev, end)); gear.addEventListener('contextmenu', (e) => e.preventDefault());
  gear.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  const tipEl = document.createElement('div'); tipEl.className = 'sh-tip'; root.appendChild(tipEl);
  const tip = () => { tipEl.textContent = lang === 'es' ? 'Para adultos: mantén presionado el engranaje' : 'For grown-ups: press and HOLD the gear'; tipEl.classList.add('on'); clearTimeout(tip.t); tip.t = setTimeout(() => tipEl.classList.remove('on'), 2200); };
  panel.querySelectorAll('#sha-games button').forEach((b) => b.addEventListener('click', () => { const k = b.dataset.k, n = Object.values(cfg.games).filter(Boolean).length; if (cfg.games[k] && n === 1) return; cfg.games[k] = !cfg.games[k]; applyCfg(); }));
  panel.querySelectorAll('#sha-train button').forEach((b) => b.addEventListener('click', () => { cfg.train = b.dataset.v; applyCfg(); }));
  panel.querySelectorAll('#sha-per button').forEach((b) => b.addEventListener('click', () => { cfg.per = +b.dataset.v; applyCfg(); }));
  panel.querySelectorAll('#sha-shapes button').forEach((b) => b.addEventListener('click', () => { cfg.shapes = +b.dataset.v; applyCfg(); }));
  panel.querySelectorAll('#sha-pre button').forEach((b) => b.addEventListener('click', () => { cfg = JSON.parse(JSON.stringify(PRESETS[b.dataset.p])); applyCfg(); }));
  $('#sha-done').addEventListener('click', () => { panel.hidden = true; startRound(); });
}
export async function enter() {
  running = true; setMuted(!soundOn); audio(); bind(); if (!animals.length) animals = await fetch('data/animals.json').then((r) => r.json()).catch(() => []);
  if (!running) return; buildPlan(); round = 0; patNo = 0; lastAnimal = ''; panel.hidden = true; setLang('en'); startRound();
}
export function leave() { running = false; clearTimers(); stopSound(); busy = false; drag = null; pet.classList.remove('show'); }
