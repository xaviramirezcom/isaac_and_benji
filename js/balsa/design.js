// Isaac's Balsa Jet: the design of a twin-tail fighter glider (inspired by the F-15 Eagle) made only from 3 mm balsa sheets, plus a lump of modelling clay.
// Everything is in millimetres. Plate shapes are (u, y): u = distance from the nose along the body, y = height above the belly line. Flat parts are (u, z): z = sideways.
// Pure data and little helpers (no three.js), so the numbers can be tested in node.

export const THICK = 3;                 // every sheet part is 3 mm balsa (the common 1/8 in sheet)
export const DENSITY = 0.15;            // g per cm3: medium balsa is about 100-200 kg/m3
export const SHEET = { w: 1000, h: 100, t: 3 };   // one sheet: 3 x 100 x 1000 mm (the grain runs along the 1000 mm)
export const LENGTH = 300;              // the jet is 300 mm long
export const NOSE_X = 150;              // in the 3D scene the nose points to +x: x = NOSE_X - u

const P = (...pts) => pts;
// the wing slot (a 3 mm tall hole through every plate) and the tail slot
export const WING_SLOT = P([118, 13], [208, 13], [208, 16], [118, 16]);
export const TAIL_SLOT = P([254, 16], [288, 16], [288, 19], [254, 19]);
export const WING_Y = [13, 16], TAIL_Y = [16, 19];

export const PARTS = [
  { id: 'spine', n: 'P1', qty: 1, kind: 'plate', color: '#9aa7b8', grain: 'u', layers: [0],
    outline: P([0, 14], [18, 18], [45, 25], [80, 31], [105, 34], [255, 34], [300, 30], [300, 16], [286, 5], [262, 0], [100, 0], [62, 3], [28, 8]), holes: [WING_SLOT, TAIL_SLOT],
    explode: [0, 0, 0], step: 1 },
  { id: 'inner', n: 'P2', qty: 2, kind: 'plate', color: '#7d8b9d', grain: 'u', layers: [-3, 3],
    outline: P([66, 10], [92, 34], [250, 34], [292, 29], [292, 15], [281, 4], [262, 0], [100, 0], [74, 3]), holes: [WING_SLOT, TAIL_SLOT],
    explode: [0, 0, 1], step: 1 },
  { id: 'cheek', n: 'P3', qty: 2, kind: 'plate', color: '#6a7a8f', grain: 'u', layers: [-6, 6],
    outline: P([110, 14], [124, 28], [215, 28], [248, 66], [270, 66], [286, 34], [292, 28], [292, 15], [281, 4], [262, 0], [124, 0], [112, 4]), holes: [WING_SLOT, TAIL_SLOT],
    explode: [0, 0, 2], step: 2 },
  { id: 'wing', n: 'P4', qty: 1, kind: 'flat', color: '#8f9db0', grain: 'v', y: WING_Y,
    outline: P([118, 0], [176, 100], [206, 100], [208, 0], [206, -100], [176, -100]), holes: [],
    explode: [0, 1, 0], step: 3 },
  { id: 'tail', n: 'P5', qty: 1, kind: 'flat', color: '#8f9db0', grain: 'v', y: TAIL_Y,
    outline: P([254, 0], [268, 54], [276, 54], [276, 9], [288, 9], [288, -9], [276, -9], [276, -54], [268, -54]), holes: [],
    explode: [0, 1, 0], step: 4 },
  { id: 'elev', n: 'P6', qty: 2, kind: 'elev', color: '#c0392b', grain: 'v', y: TAIL_Y, side: [-1, 1],
    outline: P([277.5, 10.5], [294, 10.5], [294, 54], [277.5, 54]), holes: [], hinge: 276.75,
    explode: [0, 0.2, 1], step: 5 },
  { id: 'canopy', n: 'P7', qty: 3, kind: 'plate', color: '#1c2b45', grain: 'u', layers: [-3, 0, 3],
    outlineFor: (z) => (z === 0 ? P([92, 34], [100, 40], [118, 50], [148, 52], [172, 46], [190, 34]) : P([98, 34], [108, 41], [124, 48], [148, 49], [166, 44], [180, 34])), holes: [],
    explode: [0, 1, 0], step: 6 },
];
// the nose weight: modelling clay (not balsa)
export const CLAY = { id: 'clay', n: 'P8', u: 16, y: 13, maxG: 12, step: 8 };

// ---- polygon helpers
export function area(poly) { let a = 0; for (let i = 0; i < poly.length; i++) { const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length]; a += x1 * y2 - x2 * y1; } return Math.abs(a) / 2; }
export function centroid(poly) {
  let a = 0, cx = 0, cy = 0;
  for (let i = 0; i < poly.length; i++) { const [x1, y1] = poly[i], [x2, y2] = poly[(i + 1) % poly.length], f = x1 * y2 - x2 * y1; a += f; cx += (x1 + x2) * f; cy += (y1 + y2) * f; }
  a /= 2; return [cx / (6 * a), cy / (6 * a)];
}
export function inside(poly, [x, y]) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; }
export const outlineOf = (p, z = 0) => (p.outlineFor ? p.outlineFor(z) : p.outline);
const net = (p, z = 0) => area(outlineOf(p, z)) - (p.holes ?? []).reduce((a, h) => a + area(h), 0);   // mm2 of wood in one piece
export const bbox = (poly) => { const xs = poly.map((q) => q[0]), ys = poly.map((q) => q[1]); return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) }; };

// ---- every physical piece (one per instance): its own shape, where it sits, its mass
let _inst = null;
export function instances() {                                  // always the same objects, so other code can find a piece again
  if (_inst) return _inst;
  const out = [];
  for (const p of PARTS) {
    if (p.kind === 'plate') p.layers.forEach((z) => out.push({ part: p, z, outline: outlineOf(p, z) }));
    else if (p.kind === 'elev') p.side.forEach((s) => out.push({ part: p, s, outline: p.outline }));
    else out.push({ part: p, outline: p.outline });
  }
  return (_inst = out);
}
export function massOf(inst) { return (net(inst.part, inst.z ?? 0) * THICK * DENSITY) / 1000; }   // grams
export function centreU(inst) {                                                                      // where the piece's own balance point is, along the body (u)
  const o = inst.outline; let [cx] = centroid(o); let m = area(o);
  for (const h of inst.part.holes ?? []) { const a = area(h), [hx] = centroid(h); cx = (cx * m - hx * a) / (m - a); m -= a; }
  return cx;
}

// ---- the wing: mean aerodynamic chord (MAC) and where the balance point should be
export const WING = (() => {
  const cr = 90, ct = 30, b = 200, lam = ct / cr, mac = (2 / 3) * cr * ((1 + lam + lam * lam) / (1 + lam)), yMac = (b / 6) * ((1 + 2 * lam) / (1 + lam)), leRoot = 118, leTip = 176;
  const le = leRoot + ((leTip - leRoot) * yMac) / (b / 2);
  return { cr, ct, b, mac, yMac, macLE: le, area: area(PARTS.find((p) => p.id === 'wing').outline) };
})();
export const cgPercent = (u) => ((u - WING.macLE) / WING.mac) * 100;
export const uFromPercent = (pc) => WING.macLE + (pc / 100) * WING.mac;
export const NEUTRAL_PERCENT = 40;       // where the "can't balance any more" point of this jet is (aerodynamic neutral point, % of the wing's mean chord)
export const GOOD = [20, 32];            // the balance zone, % of the wing's mean chord

export function weight(clayG = 0) {
  let m = 0, mu = 0;
  for (const i of instances()) { const g = massOf(i); m += g; mu += g * centreU(i); }
  const wood = { g: m, u: mu / m };
  const tot = m + clayG, u = (mu + clayG * CLAY.u) / tot;
  return { wood, g: tot, u, pc: cgPercent(u) };
}
export function clayForPercent(pc) { const w = weight(0).wood, u = uFromPercent(pc); return (w.g * (u - w.u)) / (CLAY.u - u); }     // grams of clay that move the balance point to pc

// ---- cutting the sheets: a simple guillotine packer. Parts keep their grain along the sheet.
export function flatDims(inst) {                                         // the piece's size lying on a sheet: w along the grain (the 1000 mm side)
  const b = bbox(inst.outline), du = b.x1 - b.x0, dv = b.y1 - b.y0;
  return inst.part.grain === 'v' ? { w: dv, h: du } : { w: du, h: dv };
}
function packWith(items, gap, splitLong) {
  const sheets = [];
  const place = (it) => {
    for (const sh of sheets) {
      let best = null;
      for (const f of sh.free) if (it.w + gap <= f.w && it.h + gap <= f.h) { const left = Math.min(f.w - it.w, f.h - it.h); if (!best || left < best.left) best = { f, left }; }
      if (best) {
        const f = best.f; sh.items.push({ ...it, x: f.x, y: f.y }); sh.free.splice(sh.free.indexOf(f), 1);
        const rw = f.w - it.w - gap, rh = f.h - it.h - gap;
        if (splitLong ? rw > rh : rw <= rh) sh.free.push({ x: f.x + it.w + gap, y: f.y, w: rw, h: f.h }, { x: f.x, y: f.y + it.h + gap, w: it.w + gap, h: rh });
        else sh.free.push({ x: f.x + it.w + gap, y: f.y, w: rw, h: it.h + gap }, { x: f.x, y: f.y + it.h + gap, w: f.w, h: rh });
        sh.free = sh.free.filter((r) => r.w > 4 && r.h > 4); return true;
      }
    }
    return false;
  };
  for (const it of items) { if (!place(it)) { sheets.push({ items: [], free: [{ x: 0, y: 0, w: SHEET.w, h: SHEET.h }] }); place(it); } }
  return sheets;
}
export function packSheets(gap = 3) {
  const base = instances().map((inst, i) => ({ inst, i, ...flatDims(inst) }));
  const orders = [(a, b) => b.w * b.h - a.w * a.h, (a, b) => b.h - a.h || b.w - a.w, (a, b) => b.w - a.w, (a, b) => b.w + b.h - (a.w + a.h)];
  let best = null;
  for (const ord of orders) for (const sl of [true, false]) {
    const sheets = packWith([...base].sort(ord), gap, sl), score = sheets.length * 1e6 - sheets.slice(0, -1).reduce((a, s) => a + s.items.length, 0) * 100 + sheets.at(-1).items.length;
    if (!best || score < best.score) best = { sheets, score };
  }
  const used = base.reduce((a, it) => a + net(it.inst.part, it.inst.z ?? 0), 0), total = best.sheets.length * SHEET.w * SHEET.h;
  return { sheets: best.sheets, usedPct: (used / total) * 100, count: best.sheets.length };
}

// ---- paint jobs
export const PAINTS = [
  { id: 'wood', swatch: '#e6d0a4', en: 'Bare balsa', es: 'Balsa natural' },
  { id: 'grey', swatch: '#8d99aa', en: 'Eagle grey', es: 'Gris águila', body: '#8d99aa', mid: '#76849a', tail: '#5e6d83', wing: '#a2adbc', canopy: '#16233d', accent: '#c0392b' },
  { id: 'red', swatch: '#d63a2f', en: 'Red & white', es: 'Rojo y blanco', body: '#f1f1ef', mid: '#e3e3df', tail: '#d63a2f', wing: '#f6f6f3', canopy: '#17233b', accent: '#d63a2f' },
  { id: 'blue', swatch: '#2f6fd6', en: 'Blue & yellow', es: 'Azul y amarillo', body: '#2f6fd6', mid: '#2a62bf', tail: '#f2c230', wing: '#3b7be6', canopy: '#101c36', accent: '#f2c230' },
  { id: 'camo', swatch: '#5c7a3d', en: 'Jungle green', es: 'Verde selva', body: '#5c7a3d', mid: '#4f6a34', tail: '#3b4f28', wing: '#6d8a47', canopy: '#18241a', accent: '#c8a64a' },
  { id: 'black', swatch: '#2a2d33', en: 'Stealth black', es: 'Negro sigiloso', body: '#2a2d33', mid: '#22252a', tail: '#1b1d21', wing: '#33373e', canopy: '#0b0c0f', accent: '#7b8394' },
];
