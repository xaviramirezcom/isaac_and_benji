// Isaac's Balsa F-16: a realistic F-16 at 1:40 (375 mm long, 236 mm span), built in code from lofted cross-sections, and the balsa kit derived from that same shape
// the way real kits are built: a side keel, cross-section formers at ~30 mm stations (split above/below the wing in the wing bay) egg-crated onto the keel, a tabbed fin,
// a sheet wing with the strakes, sheet stabilators and ventral fins, plus a carved nose block and canopy block. Views: Jet (the painted model, it can fly), Frame (the balsa
// skeleton inside the ghosted skin) and Sheets (every piece nested on 100 × 915 × 3 mm balsa sheets with its size). Tap a piece or its chip to read about it. Sizes in mm.
import * as THREE from '../vendor/three.module.min.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { profile } from './insects/lib.js';

const $ = (s) => document.querySelector(s);
const view = $('#view-jet'), canvas = $('#jet-canvas');
const ui = { title: $('#jet-title'), card: $('#jet-card'), name: $('#jet-name'), kid: $('#jet-kid'), adult: $('#jet-adult'), chips: $('#jet-chips'), modes: [...view.querySelectorAll('[data-mode]')], fly: $('#btn-jfly'), flyL: $('#lbl-jfly') };
const T = {
  en: { title: 'Balsa F-16', jet: 'Jet', frame: 'Frame', sheets: 'Sheets', fly: 'Fly', intro: { n: 'F-16 Fighting Falcon · 1:40', k: 'A real fighter jet, 375 mm long. Frame shows the balsa skeleton inside it, Sheets lays every piece flat so you can trace and cut it.', a: 'The model is lofted from cross-sections of the real F-16 (single engine, chin intake, bubble canopy, strakes blending into a cropped-delta wing, all-moving tailplanes, one tall fin, two ventral fins). The kit: a 3 mm keel, 11 formers cut from the sections (the three in the wing bay are split above and below the wing), a tabbed fin, a one-piece sheet wing, sheet tailplanes and ventral fins, a carved nose block and canopy block. Build on a flat board over the plan, egg-crate the formers onto the keel, slide the wing through, plug the fin in, then cover with tissue or thin paper. Balance point: a third of the way back along the wing root.' } },
  es: { title: 'F-16 de balsa', jet: 'Jet', frame: 'Esqueleto', sheets: 'Láminas', fly: 'Volar', intro: { n: 'F-16 Fighting Falcon · 1:40', k: 'Un caza de verdad, de 375 mm. Esqueleto muestra la estructura de balsa por dentro, Láminas pone cada pieza plana para calcarla y cortarla.', a: 'El modelo está construido con secciones del F-16 real (un motor, toma de aire bajo la nariz, cabina de burbuja, extensiones que se funden con un ala delta recortada, estabilizadores móviles, una cola alta y dos aletas ventrales). El kit: una quilla de 3 mm, 11 cuadernas cortadas de las secciones (las tres de la zona del ala van partidas arriba y abajo del ala), una cola con lengüeta, un ala de una pieza, estabilizadores y aletas de lámina, y un bloque de nariz y otro de cabina tallados. Monta sobre una tabla plana con el plano, encaja las cuadernas en la quilla como un cartón de huevos, pasa el ala, encaja la cola y forra con papel fino. Punto de equilibrio: a un tercio de la raíz del ala.' } },
};
let lang = 'en';
const L = (o) => o[lang] ?? o.en;

// ---------------------------------------------------------------- the F-16 at 1:40, in mm. Nose tip at x = 0, tail at x = 375. Up is +Y, +Z is the pilot's right.
// Fuselage cross-sections: top half = superellipse (half-width w, height t, exponent nt); bottom half = superellipse (half-width wb, depth b, exponent nb), both round centre line c.
const ST = {
  w:  profile([[0, 0.8], [20, 7], [60, 13.5], [90, 15.5], [120, 17], [150, 18.5], [200, 20], [260, 19.5], [310, 15.5], [350, 11.5], [352, 11]]),
  t:  profile([[0, 0.8], [20, 6.5], [60, 12], [90, 13], [120, 14], [150, 15], [200, 16], [260, 16], [310, 14], [350, 11], [352, 10.5]]),
  b:  profile([[0, 0.8], [20, 6], [60, 11], [90, 13], [115, 15], [125, 25], [150, 27], [200, 27], [260, 23], [310, 15.5], [350, 11], [352, 10.5]]),
  wb: profile([[0, 0.8], [20, 7], [60, 13], [90, 14.5], [115, 15], [125, 14], [150, 15], [200, 16.5], [260, 15], [310, 12.5], [350, 11], [352, 10.5]]),
  c:  profile([[0, 0], [60, 1], [120, 3], [200, 5], [352, 5]]),
  nt: profile([[0, 2], [120, 2.2], [200, 2.6], [310, 2.2], [352, 2]]),
  nb: profile([[0, 2], [115, 2], [125, 4.5], [260, 4], [310, 2.6], [352, 2]]),
};
const BODY0 = 0, BODY1 = 352, NOZ1 = 378;
const sec = (x) => ({ w: ST.w(x), t: ST.t(x), b: ST.b(x), wb: ST.wb(x), c: ST.c(x), nt: ST.nt(x), nb: ST.nb(x) });
const ring = (x, a) => { const s = sec(x), co = Math.cos(a), si = Math.sin(a); if (si >= 0) return [s.w * Math.sign(co) * Math.pow(Math.abs(co), 2 / s.nt), s.c + s.t * Math.pow(si, 2 / s.nt)]; return [s.wb * Math.sign(co) * Math.pow(Math.abs(co), 2 / s.nb), s.c - s.b * Math.pow(-si, 2 / s.nb)]; };   // [z, y]
const topY = (x) => sec(x).c + sec(x).t, botY = (x) => sec(x).c - sec(x).b;
// planforms (x, z) for the right half; the left is mirrored
const WING = { le: (z) => (z <= 18 ? 165 : z <= 36 ? 105 + (z - 18) / 18 * 60 : 165 + (z - 36) / 82 * 94), te: (z) => (z <= 18 ? 292 : 292 - (z - 18) / 100 * 5), span: 118, y: 1.5, thick: (ch) => Math.min(0.055 * ch, 6.5) };
const STAB = { le: (z) => 312 + Math.max(0, z - 9) / 57 * 46, te: (z) => 364 + Math.max(0, z - 9) / 57 * 14, z0: 9, span: 66, y: 4, thick: (ch) => Math.min(0.06 * ch, 2.8) };
const FIN = { base: [258, 352], tip: [318, 346], h: 72, y0: 20.5, thick: 3 };
const FINTAB = [270, 345, 6];                                                 // the fin's tab fills a gap in the keel's top edge between these stations, down to y = 6
const VFIN = [[300, 0], [338, 0], [330, -12], [312, -12]];                     // under the tail, hanging 12 mm, splayed outwards
const CANOPY = { x0: 86, x1: 168, h: 15.5 };
const FORMERS = [40, 70, 100, 130, 160, 190, 220, 250, 300, 325, 345];
const inWing = (x) => x > WING.le(0) && x < WING.te(0);
const TH = 3, SC = 0.01;                                                      // balsa thickness; mm → scene units

// ---------------------------------------------------------------- geometry helpers
function grid(nx, ny, f, closedY = false) {                                    // f(i, j) → [x, y, z]; builds an indexed surface
  const pos = [], idx = [], ny1 = closedY ? ny : ny + 1;
  for (let i = 0; i <= nx; i++) for (let j = 0; j < ny1; j++) pos.push(...f(i, j));
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const j2 = closedY ? (j + 1) % ny : j + 1, a = i * ny1 + j, b = i * ny1 + j2, c = (i + 1) * ny1 + j, d = (i + 1) * ny1 + j2; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
const naca = (s, t) => 5 * t * (0.2969 * Math.sqrt(s) - 0.126 * s - 0.3516 * s * s + 0.2843 * s ** 3 - 0.1015 * s ** 4);
function liftingSurface(pl, mirror) {                                          // a wing-like loft: airfoil sections from the root to the tip, closing at the tip
  const NZ = 26, NC = 28, z0 = pl.z0 ?? 0;
  return grid(NZ, NC, (i, j) => {
    const u = i / NZ, z = z0 + (pl.span - z0) * u, le = pl.le(z), te = pl.te(z), ch = Math.max(0.5, te - le), tt = pl.thick(ch) / ch * (u > 0.97 ? (1 - u) / 0.03 : 1);
    const k = j / NC, s = k < 0.5 ? 1 - k * 2 : (k - 0.5) * 2, up = k < 0.5 ? 1 : -1, x = le + ch * s, y = up * naca(Math.max(0, s), tt) * ch;
    return [x, pl.y + y, mirror ? -z : z];
  }, true);
}
function finLoft() {                                                           // the fin stands on the spine: sections stacked in y
  const NZ = 20, NC = 24;
  return grid(NZ, NC, (i, j) => { const u = i / NZ, y = FIN.y0 + FIN.h * u, le = FIN.base[0] + (FIN.tip[0] - FIN.base[0]) * u, te = FIN.base[1] + (FIN.tip[1] - FIN.base[1]) * u, ch = te - le, tt = (FIN.thick / ch) * (u > 0.95 ? (1 - u) / 0.05 : 1); const k = j / NC, s = k < 0.5 ? 1 - k * 2 : (k - 0.5) * 2, side = k < 0.5 ? 1 : -1; return [le + ch * s, y, side * naca(Math.max(0, s), tt) * ch]; }, true);
}
function fuselageLoft() {
  const NX = 120, NR = 48;
  const g = grid(NX, NR, (i, j) => { const x = BODY0 + (BODY1 - BODY0) * i / NX, [z, y] = ring(x, (j / NR) * Math.PI * 2); return [x, y, z]; }, true);
  const col = [], p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), x = p.getX(i), c = sec(x).c, k = THREE.MathUtils.smoothstep(y - c, -6, 8); col.push(0.78 - 0.3 * k, 0.8 - 0.3 * k, 0.82 - 0.28 * k); }   // darker grey on top, pale below
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return g;
}
function canopyLoft() {
  const NX = 30, NR = 20;
  return grid(NX, NR, (i, j) => { const u = i / NX, x = CANOPY.x0 + (CANOPY.x1 - CANOPY.x0) * u, bump = Math.pow(Math.sin(Math.PI * Math.pow(u, 0.75)), 1.2), h = CANOPY.h * bump, w = sec(x).w * 0.86 * Math.pow(bump, 0.5), base = topY(x) - 1.5, a = (j / NR) * Math.PI; return [x, base + h * Math.sin(a), w * Math.cos(a)]; });
}
function revolve(x0, x1, r, n = 24, m = 16) { return grid(n, m, (i, j) => { const x = x0 + (x1 - x0) * i / n, rr = r(x, i / n), a = (j / m) * Math.PI * 2; return [x, sec(BODY1).c + rr * Math.sin(a), rr * Math.cos(a)]; }, true); }

// 2D outline helpers for the balsa pieces (u, v in mm)
function formerOutline(x) { const pts = [], N = 72; for (let j = 0; j < N; j++) { const [z, y] = ring(x, (j / N) * Math.PI * 2); pts.push([z, y]); } return pts; }   // the cross-section at x as a closed polygon (u = z, v = y)
function withNotch(poly, u, fromTop, yEnd) {                                   // a 3 mm wide notch cut into the polygon's top (or bottom) edge at u, reaching down (up) to yEnd
  let best = -1, bestY = fromTop ? -1e9 : 1e9;
  for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; if ((a[0] - u) * (b[0] - u) > 0 || a[0] === b[0]) continue; const t = (u - a[0]) / (b[0] - a[0]), y = a[1] + (b[1] - a[1]) * t; if (fromTop ? y > bestY : y < bestY) { bestY = y; best = i; } }
  if (best < 0) return poly;
  const dir = Math.sign(poly[(best + 1) % poly.length][0] - poly[best][0]), first = dir > 0 ? -1.5 : 1.5;
  return [...poly.slice(0, best + 1), [u + first, bestY], [u + first, yEnd], [u - first, yEnd], [u - first, bestY], ...poly.slice(best + 1)];
}
function clipY(poly, y, keepAbove) {                                           // Sutherland–Hodgman against a horizontal line
  const out = []; const inside = (p) => (keepAbove ? p[1] >= y : p[1] <= y);
  for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length], ia = inside(a), ib = inside(b); if (ia) out.push(a); if (ia !== ib) { const t = (y - a[1]) / (b[1] - a[1]); out.push([a[0] + (b[0] - a[0]) * t, y]); } }
  return out;
}
function keelOutline() {                                                       // side profile from x = 15 to 352: a gap on top for the fin's tab, top notches in the wing bay, bottom notches elsewhere
  const X0 = 15, X1 = BODY1, top = [], bot = [];
  for (let x = X0; x <= X1; x += 3) { const inTab = x >= FINTAB[0] && x <= FINTAB[1]; if (x === FINTAB[0]) top.push([x, topY(x)]); top.push([x, inTab ? FINTAB[2] : topY(x)]); if (x === FINTAB[1]) top.push([x, topY(x)]); }
  for (let x = X1; x >= X0; x -= 3) bot.push([x, botY(x)]);
  let poly = [...top, [X1, botY(X1)], ...bot, [X0, botY(X0)]];
  for (const f of FORMERS) poly = inWing(f) ? withNotch(withNotch(poly, f, true, 9), f, false, -6) : withNotch(poly, f, false, sec(f).c - 4);
  return poly;
}
const finOutline = () => [[FINTAB[0], FINTAB[2]], [FINTAB[1], FINTAB[2]], [FINTAB[1], topY(FINTAB[1])], [FIN.base[1], topY(FIN.base[1])], [FIN.tip[1], FIN.y0 + FIN.h], [FIN.tip[0], FIN.y0 + FIN.h], [FIN.base[0], FIN.y0], [FINTAB[0], topY(FINTAB[0])]];
const wingOutline = () => { const r = []; for (let z = 0; z <= 118; z += 4) r.push([WING.le(z), z]); const back = []; for (let z = 118; z >= 0; z -= 4) back.push([WING.te(z), z]); const half = [...r, [WING.le(118), 118], ...back]; return [...half, ...half.slice().reverse().map(([x, z]) => [x, -z])].filter((p, i, a) => i === 0 || Math.hypot(p[0] - a[i - 1][0], p[1] - a[i - 1][1]) > 0.5); };
const stabOutline = () => { const h = [[STAB.le(9), 9], [STAB.le(66), 66], [STAB.te(66), 66], [STAB.te(9), 9]]; return [...h, ...h.slice().reverse().map(([x, z]) => [x, -z])]; };
const bounds = (pts) => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 }; };

// ---------------------------------------------------------------- the kit: every balsa piece with its outline, where it sits in the model, and what to say about it
function kitPieces() {
  const P = [], name = (en, es) => ({ en, es });
  P.push({ id: 'keel', plane: 'xy', pts: keelOutline(), holes: [[WING.le(0), WING.y - 1.5, WING.te(0), WING.y + 1.5], [STAB.le(0) + 4, STAB.y - 1.5, 348, STAB.y + 1.5]], at: [0, 0, 0], name: name('Keel', 'Quilla'),
    kid: name('The backbone of the jet: one long piece down the middle. Every former clips onto it, the wing slides through it and the fin plugs into the gap on top.', 'La columna del jet: una pieza larga por el medio. Todas las cuadernas se enganchan a ella, el ala la atraviesa y la cola se encaja en el hueco de arriba.'),
    adult: name('Side profile from the nose block back to the nozzle, 3 mm balsa with the grain along the length. Notched from below at each former station (from above and below in the wing bay), a slot for the wing, one for the tailplane, and a gap on top for the fin tab. Everything is aligned off this piece, so cut it carefully.', 'Perfil lateral desde el bloque de nariz hasta la tobera, balsa de 3 mm con la veta a lo largo. Con muescas por abajo en cada cuaderna (por arriba y por abajo en la zona del ala), una ranura para el ala, otra para el estabilizador y un hueco arriba para la lengüeta de la cola. Todo se alinea con esta pieza: córtala con cuidado.') });
  P.push({ id: 'fin', plane: 'xy', pts: finOutline(), holes: [], at: [0, 0, 0], name: name('Fin', 'Cola'),
    kid: name('The tall tail fin. Its tab drops into the gap on top of the keel.', 'La cola alta. Su lengüeta entra en el hueco de arriba de la quilla.'),
    adult: name('3 mm sheet, grain running up the fin. The 75 mm tab fills the gap in the keel so the joint is long and strong. Sand the top edges thin.', 'Lámina de 3 mm, veta hacia arriba. La lengüeta de 75 mm rellena el hueco de la quilla, así la unión es larga y fuerte. Lija finos los bordes de arriba.') });
  FORMERS.forEach((x, i) => {
    const o = formerOutline(x), iw = inWing(x);
    const parts = iw ? [['t', withNotch(clipY(o, WING.y + 1.5, true), 0, false, 9)], ['b', withNotch(clipY(o, WING.y - 1.5, false), 0, true, -6)]] : [['', withNotch(o, 0, true, sec(x).c - 4)]];
    for (const [suf, pts] of parts) P.push({ id: `f${i + 1}${suf}`, plane: 'yz', pts, holes: [], at: [x, 0, 0], name: name(`Former ${i + 1}${suf === 't' ? ' top' : suf === 'b' ? ' bottom' : ''}`, `Cuaderna ${i + 1}${suf === 't' ? ' arriba' : suf === 'b' ? ' abajo' : ''}`),
      kid: name(`A slice of the body at ${x} mm from the nose. Stacked in order, the slices make the round shape.`, `Una rebanada del cuerpo a ${x} mm de la nariz. Puestas en orden, las rebanadas hacen la forma redonda.`),
      adult: name(`Cross-section at station ${x} mm, ${iw ? 'split above and below the wing so the wing can pass through; each half is notched to clip onto the keel' : 'notched from the top down to the centre line to clip onto the keel'}. Number the formers as you cut them; they look alike.`, `Sección en la estación ${x} mm, ${iw ? 'partida arriba y abajo del ala para que el ala pase; cada mitad lleva su muesca para encajar en la quilla' : 'con muesca de arriba hasta el centro para encajar en la quilla'}. Numera las cuadernas al cortarlas; se parecen.`) });
  });
  P.push({ id: 'wing', plane: 'xz', pts: wingOutline(), holes: [], at: [0, WING.y, 0], name: name('Wing', 'Ala'),
    kid: name('One big wing with the pointy strakes at the front, like the real F-16. It slides through the slot in the keel.', 'Un ala grande con las puntas afiladas delante, como el F-16 de verdad. Pasa por la ranura de la quilla.'),
    adult: name('236 mm span, one piece of 3 mm sheet, grain across the span. Sand the leading edge round and the trailing edge thin. The strakes are fragile: leave them for last.', '236 mm de envergadura, una pieza de lámina de 3 mm, veta a lo ancho. Lija redondo el borde delantero y fino el trasero. Las extensiones son frágiles: déjalas para el final.') });
  P.push({ id: 'stab', plane: 'xz', pts: stabOutline(), holes: [], at: [0, STAB.y, 0], name: name('Tailplanes', 'Estabilizadores'),
    kid: name('The two little wings at the back, cut as one piece. On the real jet they tilt to steer up and down.', 'Las dos alitas de atrás, cortadas en una pieza. En el jet real se inclinan para subir y bajar.'),
    adult: name('One piece through the tail slot, 3 mm, grain spanwise. If the glider dives, bend the trailing edges up a touch.', 'Una pieza por la ranura de la cola, 3 mm, veta a lo ancho. Si el planeador se clava, dobla un poco hacia arriba los bordes traseros.') });
  for (const s of [1, -1]) P.push({ id: s > 0 ? 'vfinR' : 'vfinL', plane: 'xy', pts: VFIN, holes: [], at: [0, botY(318) + 1, s * 8], tilt: s * 0.35, name: name(s > 0 ? 'Ventral fin (right)' : 'Ventral fin (left)', s > 0 ? 'Aleta ventral (derecha)' : 'Aleta ventral (izquierda)'),
    kid: name('A tiny fin under the tail. The F-16 has two, leaning outwards.', 'Una aletita bajo la cola. El F-16 tiene dos, inclinadas hacia afuera.'),
    adult: name('38 × 12 mm, glued under the tail, splayed about 20°. Decorative on the glider.', '38 × 12 mm, pegada bajo la cola, abierta unos 20°. Decorativa en el planeador.') });
  P.push({ id: 'nose', block: [0, 40], name: name('Nose block', 'Bloque de nariz'), size: '40 × 28 × 27', kid: name('The pointy nose is carved from a chunk of balsa and sanded smooth.', 'La nariz puntiaguda se talla de un trozo de balsa y se lija.'), adult: name('Carve from a 40 × 30 × 30 mm block, hollow the back a little and glue to the keel and former 1. This is where the balance weight goes.', 'Talla de un bloque de 40 × 30 × 30 mm, ahueca un poco la parte de atrás y pégalo a la quilla y a la cuaderna 1. Aquí va el peso para equilibrar.') });
  P.push({ id: 'canopy', block: [CANOPY.x0, CANOPY.x1], name: name('Canopy block', 'Bloque de cabina'), size: '82 × 30 × 16', kid: name('The bubble over the pilot is carved from a balsa block too.', 'La burbuja sobre el piloto también se talla de un bloque de balsa.'), adult: name('Carve from an 82 × 30 × 16 mm block to the side and top views, then paint it dark or cover it with gold-tinted film like the real one.', 'Talla de un bloque de 82 × 30 × 16 mm siguiendo las vistas lateral y superior; píntalo oscuro o fórralo con lámina dorada como el real.') });
  return P;
}

let renderer, scene, camera, controls, pmrem, raf = 0, running = false, lastT = 0, built = false;
let jet, skin = [], kit = [], sheets, labels = [], mode = 'jet', flying = false, flyT = 0, sel = null;
const camGoal = { pos: new THREE.Vector3(), target: new THREE.Vector3(), active: false };

function balsaTex(seed, along) {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d');
  x.fillStyle = '#ead9ae'; x.fillRect(0, 0, 512, 512);
  let a = seed; const r = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
  for (let i = 0; i < 240; i++) { x.strokeStyle = `rgba(${150 + r() * 40},${110 + r() * 40},${60 + r() * 30},${0.1 + r() * 0.2})`; x.lineWidth = 0.6 + r() * 2.2; x.beginPath(); const p = r() * 512, q = p + (r() - 0.5) * 14; if (along === 'x') { x.moveTo(0, p); x.bezierCurveTo(170, p + (r() - 0.5) * 8, 340, q, 512, q); } else { x.moveTo(p, 0); x.bezierCurveTo(p + (r() - 0.5) * 8, 170, q, 340, q, 512); } x.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1 / 180, 1 / 180); t.anisotropy = 8; return t;
}
let balsaX, balsaY;
const balsaMat = (along) => new THREE.MeshStandardMaterial({ map: along === 'x' ? balsaX : balsaY, roughness: 0.85, emissive: 0xffe27a, emissiveIntensity: 0 });

function buildSkin() {
  const grey = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.15, clearcoat: 0.25, clearcoatRoughness: 0.4 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x4d5256, roughness: 0.6 }), metal = new THREE.MeshStandardMaterial({ color: 0x5a5d60, roughness: 0.35, metalness: 0.8 });
  const surf = new THREE.MeshPhysicalMaterial({ color: 0xa9afb4, roughness: 0.55, metalness: 0.15, clearcoat: 0.25, clearcoatRoughness: 0.4 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x8c6b2e, roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.75, clearcoat: 1 });
  const list = [];
  const add = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; list.push(m); return m; };
  add(fuselageLoft(), grey);
  add(canopyLoft(), glass);
  for (const s of [false, true]) { add(liftingSurface(WING, s), surf); add(liftingSurface(STAB, s), surf); }
  add(finLoft(), surf);
  for (const s of [1, -1]) { const sh = new THREE.Shape(VFIN.map(([x, y]) => new THREE.Vector2(x, y))); const g = new THREE.ExtrudeGeometry(sh, { depth: 1.6, bevelEnabled: false }); g.translate(0, botY(318) + 1, -0.8); const m = add(g, surf); m.position.z = s * 8; m.rotation.x = s * 0.35; }
  add(revolve(BODY1 - 1, NOZ1, (x, u) => 10.5 - 3 * u), metal);                                              // the nozzle
  { const g = new THREE.CircleGeometry(7.5, 24); g.rotateY(Math.PI / 2); g.translate(NOZ1 - 0.2, sec(BODY1).c, 0); add(g, new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1 })); }
  { const g = new THREE.CylinderGeometry(0.6, 0.3, 22, 8); g.rotateZ(Math.PI / 2); g.translate(-10, 0, 0); add(g, dark); }       // the nose probe
  { const s = sec(122), g = new THREE.PlaneGeometry(s.wb * 1.6, s.b * 0.75); g.rotateY(-Math.PI / 2); g.translate(119.5, s.c - s.b * 0.55, 0); add(g, new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 1, side: THREE.DoubleSide })); }   // the intake mouth
  for (const s of [1, -1]) { const g = new THREE.CylinderGeometry(2.4, 2.4, 70, 12); g.rotateZ(Math.PI / 2); g.translate(255, WING.y + 0.5, s * 120); add(g, new THREE.MeshStandardMaterial({ color: 0xe6e6e6, roughness: 0.5 })); const n = new THREE.ConeGeometry(2.4, 7, 12); n.rotateZ(-Math.PI / 2); n.translate(216.5, WING.y + 0.5, s * 120); add(n, dark); for (const k of [0, 1]) { const f = new THREE.BoxGeometry(8, 0.6, 9); f.translate(k ? 232 : 282, WING.y + 0.5, s * 120); add(f, new THREE.MeshStandardMaterial({ color: 0xe6e6e6 })); } }   // wingtip Sidewinders
  return list;
}
function buildKit() {
  const list = [];
  const qX = (a) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), a), qY = (a) => new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), a);
  for (const p of kitPieces()) {
    let mesh;
    if (p.block) { const [x0, x1] = p.block; const g = p.id === 'nose' ? grid(16, 24, (i, j) => { const x = x0 + (x1 - x0) * i / 16, [z, y] = ring(x, (j / 24) * Math.PI * 2); return [x, y, z]; }, true) : canopyLoft(); mesh = new THREE.Mesh(g, balsaMat('x')); }
    else {
      const sh = new THREE.Shape(p.pts.map(([u, v]) => new THREE.Vector2(u, p.plane === 'xz' ? -v : v)));
      for (const [u0, v0, u1, v1] of p.holes) sh.holes.push(new THREE.Path([new THREE.Vector2(u0, v0), new THREE.Vector2(u0, v1), new THREE.Vector2(u1, v1), new THREE.Vector2(u1, v0)]));
      const g = new THREE.ExtrudeGeometry(sh, { depth: TH, bevelEnabled: false, curveSegments: 3 }); g.translate(0, 0, -TH / 2);
      mesh = new THREE.Mesh(g, balsaMat(p.plane === 'xz' ? 'y' : 'x'));
      mesh.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 25), new THREE.LineBasicMaterial({ color: 0x6b4a22, transparent: true, opacity: 0.5 })));
    }
    mesh.castShadow = mesh.receiveShadow = true;
    const holder = new THREE.Group(); holder.add(mesh);
    // where the flat piece sits in the model: an x-y piece stays as drawn; an x-z piece lies down; a former's (u, v) = (z, y) so its drawing turns to face along x
    let homeQ = new THREE.Quaternion(); if (p.plane === 'xz') homeQ = qX(-Math.PI / 2); if (p.plane === 'yz') homeQ = qY(Math.PI / 2); if (p.tilt) homeQ = qX(p.tilt);
    const rec = { p, obj: holder, mesh, home: { pos: new THREE.Vector3(...(p.at ?? [0, 0, 0])), q: homeQ }, sheet: null, size: p.size ?? '' };
    if (!p.block) { const b = bounds(p.pts); rec.size = `${Math.round(b.w)} × ${Math.round(b.h)}`; rec.b = b; }
    holder.position.copy(rec.home.pos); holder.quaternion.copy(rec.home.q);
    list.push(rec);
  }
  return list;
}
const Q_SHEETS = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);       // the sheets run along z, so they stand upright on a phone screen
function layoutSheets() {                                                      // shelf-pack the flat pieces onto 100 mm wide sheets; the carved blocks go on a row of their own
  const SL = 915, SW = 100, gap = 8; let sheet = 0, cx = -SL / 2 + gap;
  const qFlat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);                   // a drawing laid flat on the table: v → -z
  const rows = [];
  for (const r of kit) {
    if (r.p.block) continue;
    const b = r.b; let w = b.w, h = b.h, rot = false; if (h > SW - 6 && w <= SW - 6) { rot = true; [w, h] = [h, w]; }
    if (cx + w + gap > SL / 2) { sheet++; cx = -SL / 2 + gap; }
    const zc = -70 + sheet * 140, q = rot ? new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2).multiply(qFlat) : qFlat;
    const centre = new THREE.Vector3((b.x0 + b.x1) / 2, (b.y0 + b.y1) / 2, 0).applyQuaternion(q);
    r.sheet = { pos: new THREE.Vector3(cx + w / 2 - centre.x, TH + 0.4, zc - centre.z).applyQuaternion(Q_SHEETS), q: Q_SHEETS.clone().multiply(q) }; rows.push({ r, x: cx + w / 2, z: zc + 54 + 12 * (rows.length % 2) });
    cx += w + gap;
  }
  let bx = -SL / 2 + 40; const zb = -70 + (sheet + 1) * 140;
  for (const r of kit) if (r.p.block) { const [x0, x1] = r.p.block; r.sheet = { pos: new THREE.Vector3(bx - (x0 + x1) / 2, 14, zb).applyQuaternion(Q_SHEETS), q: Q_SHEETS.clone() }; rows.push({ r, x: bx, z: zb + 54 }); bx += 120; }
  return { count: sheet + 1, rows };
}
function labelSprite() { const s = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false })); s.scale.set(0.64, 0.12, 1); s.visible = false; return s; }
function paintLabel(sprite, text) { const c = document.createElement('canvas'); c.width = 512; c.height = 96; const g = c.getContext('2d'); g.font = '700 54px ui-rounded, system-ui, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(0,0,0,.55)'; g.fillText(text, 258, 52); g.fillStyle = '#fff'; g.fillText(text, 256, 48); sprite.material.map?.dispose(); sprite.material.map = new THREE.CanvasTexture(c); sprite.material.map.colorSpace = THREE.SRGBColorSpace; sprite.material.needsUpdate = true; }

function setup() {
  if (built) return; built = true;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene = new THREE.Scene();
  pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.7;
  const key = new THREE.DirectionalLight(0xfff4e6, 2.2); key.position.set(4, 8, 5); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = key.shadow.camera.bottom = -7; key.shadow.camera.right = key.shadow.camera.top = 7; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; scene.add(key);
  scene.add(new THREE.HemisphereLight(0xdfefff, 0x6a5538, 0.6));
  const table = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.3 })); table.rotation.x = -Math.PI / 2; table.receiveShadow = true; scene.add(table);
  balsaX = balsaTex(11, 'x'); balsaY = balsaTex(29, 'y');
  jet = new THREE.Group(); jet.scale.setScalar(SC); scene.add(jet);
  const centre = new THREE.Group(); centre.position.x = -(NOZ1 / 2); jet.add(centre);                           // the model is centred on its length
  skin = buildSkin(); skin.forEach((m) => centre.add(m));
  kit = buildKit(); kit.forEach((r) => centre.add(r.obj));
  const lay = layoutSheets();
  sheets = new THREE.Group(); const sm = new THREE.MeshStandardMaterial({ map: balsaTex(3, 'x'), roughness: 0.9, color: 0xf3e7c6 });
  for (let i = 0; i < lay.count; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(915, TH, 100), sm); s.position.set(0, TH / 2, -70 + i * 140).applyQuaternion(Q_SHEETS); s.quaternion.copy(Q_SHEETS); s.receiveShadow = s.castShadow = true; sheets.add(s); }
  sheets.visible = false; centre.add(sheets);
  for (const row of lay.rows) { const l = labelSprite(); const pw = new THREE.Vector3(row.x, 0, row.z).applyQuaternion(Q_SHEETS); l.position.set((pw.x - NOZ1 / 2) * SC, 0.16, pw.z * SC); l.userData.rec = row.r; labels.push(l); scene.add(l); }
  camera = new THREE.PerspectiveCamera(38, 1, 0.05, 100);
  controls = new OrbitControls(camera, canvas); controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.09; controls.minDistance = 1.0; controls.maxDistance = 22;
  controls.addEventListener('start', () => { camGoal.active = false; });
  bind();
  if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__jet = { get camera() { return camera; }, get controls() { return controls; }, setMode };
}
const shortName = (r) => (r.p.id[0] === 'f' && r.p.id !== 'fin' ? r.p.id.toUpperCase().replace('T', ' top').replace('B', ' bottom') : `${L(r.p.name)} ${r.size}`);
function relabel() { for (const l of labels) paintLabel(l, shortName(l.userData.rec)); }

const narrow = () => camera.aspect < 1;
function jetCam() { const d = narrow() ? 8.6 : 6.2; return new THREE.Vector3(0.55, 0.36, 0.75).normalize().multiplyScalar(d).add(new THREE.Vector3(0, 0.6, 0)); }
function goCamera(m) {
  if (m === 'sheets') { camGoal.pos.set(-1.9, narrow() ? 14 : 9.5, 0.6); camGoal.target.set(-1.9, 0, 0); }
  else { camGoal.pos.copy(jetCam()); camGoal.target.set(0, 0.6, 0); }
  camGoal.active = true;
}
function applyMode() {
  ui.modes.forEach((b) => b.classList.toggle('on', b.dataset.mode === mode));
  const ghost = mode === 'frame';
  skin.forEach((m) => { m.visible = mode !== 'sheets'; const mt = m.material; mt.userData.op ??= mt.opacity; mt.transparent = ghost || mt.userData.op < 1; mt.opacity = ghost ? 0.12 : mt.userData.op; mt.depthWrite = !ghost; m.castShadow = !ghost; });
  kit.forEach((r) => { r.obj.visible = mode !== 'jet'; });
  sheets.visible = mode === 'sheets'; labels.forEach((l) => { l.visible = mode === 'sheets'; });
}
function setMode(m) { mode = m; if (m !== 'jet') setFly(false); applyMode(); goCamera(m); }
function setFly(on) { flying = on; ui.fly.classList.toggle('on', on); if (on) { flyT = 0; mode = 'jet'; applyMode(); } else { jet.position.set(0, 0, 0); jet.quaternion.identity(); } }

function select(rec) {
  sel = rec; kit.forEach((r) => { r.mesh.material.emissiveIntensity = r === rec ? 0.25 : 0; });
  ui.chips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', !!rec && c.dataset.id === rec.p.id));
  showCard(rec);
}
function showCard(rec) {
  const c = rec ? { n: `${L(rec.p.name)} · ${rec.size} mm`, k: L(rec.p.kid), a: L(rec.p.adult) } : T[lang].intro;
  ui.name.textContent = c.n; ui.kid.textContent = c.k; ui.adult.textContent = c.a; ui.card.classList.remove('adult'); ui.card.classList.add('open');
}
function buildChips() {
  ui.chips.innerHTML = kit.map((r) => `<button type="button" class="chip" data-id="${r.p.id}">${L(r.p.name)}</button>`).join('');
  ui.chips.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => { const r = kit.find((x) => x.p.id === b.dataset.id); if (mode === 'jet') { mode = 'frame'; applyMode(); } select(sel === r ? null : r); }));
}
function setLang(l) {
  lang = l; view.querySelectorAll('.lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === l));
  const t = T[l]; ui.title.textContent = t.title; ui.modes.forEach((b) => { b.textContent = t[b.dataset.mode]; }); ui.flyL.textContent = t.fly;
  buildChips(); if (sel) ui.chips.querySelector(`[data-id="${sel.p.id}"]`)?.classList.add('on');
  relabel(); if (ui.card.classList.contains('open')) showCard(sel);
}

const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
let bound = false;
function bind() {
  if (bound) return; bound = true;
  let down = null;
  canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  canvas.addEventListener('pointerup', (e) => {
    if (!down || performance.now() - down.t > 600 || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10) return;
    const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
    if (mode === 'jet') { const hit = ray.intersectObjects(skin, false)[0]; if (hit) showCard(null); else ui.card.classList.remove('open'); return; }
    const hit = ray.intersectObjects(kit.map((p) => p.mesh), false)[0];
    const rec = hit ? kit.find((p) => p.mesh === hit.object) : null; select(rec && sel === rec ? null : rec);
  });
  ui.modes.forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
  ui.fly.addEventListener('click', () => setFly(!flying));
  $('#jet-info').addEventListener('click', () => ui.card.classList.toggle('adult'));
  $('#jet-close').addEventListener('click', () => { ui.card.classList.remove('open'); sel = null; kit.forEach((r) => { r.mesh.material.emissiveIntensity = 0; }); ui.chips.querySelectorAll('.chip').forEach((c) => c.classList.remove('on')); });
  view.querySelectorAll('.lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  new ResizeObserver(resize).observe(view);
}
function resize() { if (!renderer) return; const w = view.clientWidth, h = view.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }

function frame(now) {
  if (!running) return; raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; const k = 1 - Math.exp(-dt * 6);
  for (const r of kit) { const g = mode === 'sheets' ? r.sheet : r.home; r.obj.position.lerp(g.pos, k); r.obj.quaternion.slerp(g.q, k); }
  const lift = mode === 'sheets' ? 0 : 0.55;
  if (flying) {
    flyT += dt; const a = flyT * 0.8, R = 2.3, p = new THREE.Vector3(Math.cos(a) * R, 1.3 + 0.35 * Math.sin(a * 2.1), -Math.sin(a) * R), n = new THREE.Vector3(Math.cos(a + 0.05) * R, 1.3 + 0.35 * Math.sin((a + 0.05) * 2.1), -Math.sin(a + 0.05) * R);
    jet.position.copy(p); const d = n.sub(p).normalize(), yaw = Math.atan2(-d.z, d.x), pitch = Math.asin(Math.max(-1, Math.min(1, d.y)));
    jet.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), pitch)).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.65));
  } else { jet.position.y += (lift - jet.position.y) * k; }
  if (camGoal.active) { const ka = 1 - Math.exp(-dt * 4); camera.position.lerp(camGoal.pos, ka); controls.target.lerp(camGoal.target, ka); if (camera.position.distanceTo(camGoal.pos) < 0.02) camGoal.active = false; }
  controls.update(); renderer.render(scene, camera);
}

export function enter() {
  setup(); setLang('en'); mode = 'jet'; setFly(false); applyMode(); sel = null; ui.card.classList.remove('open');
  resize(); camera.position.copy(jetCam()); controls.target.set(0, 0.6, 0); controls.update(); camGoal.active = false;
  running = true; lastT = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
}
export function leave() { running = false; cancelAnimationFrame(raf); setFly(false); }
