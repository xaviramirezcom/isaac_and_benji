// The 2D body: a child-shaped silhouette (viewBox 300×640) and the flat organs, each drawn around its own centre (0,0).
// `.st` = a stroke-only shape (tubes), `.d` = a detail that disappears in the empty "slot" outline. `slot` is where the organ lives in the body.
export const BODY_VB = [300, 640];
const lobe = (extra = '') => `<path d="M-10 -36C-30 -34-46 -12-48 14C-50 32-38 38-24 35C-12 33-9 22-9 8C-9 -6-8 -20-10 -36Z" fill="#ff9b9b" stroke="#e06a74" stroke-width="3" stroke-linejoin="round"${extra}/>`;
const bean = (extra = '') => `<path d="M4 -15C13 -12 14 4 8 13C4 18-2 15-1 9C0 4-4 3-5-2C-6-9-2-16 4-15Z" fill="#b24a45" stroke="#8a2f2f" stroke-width="2.5" stroke-linejoin="round"${extra}/>`;
const SI = 'M-34 -20q8.5 -8 17 0t17 0t17 0t17 0c10 0 10 13 0 13q-8.5 -8 -17 0t-17 0t-17 0t-17 0c-10 0 -10 13 0 13q8.5 -8 17 0t17 0t17 0t17 0c10 0 10 13 0 13q-8.5 -8 -17 0t-17 0t-17 0t-17 0';
const LI = 'M-40 36L-46 30V-26Q-46 -34 -38 -32Q0 -18 38 -32Q46 -34 46 -26V24C46 42 22 42 18 30C14 20 4 30 0 36';

export const SHAPES = {
  brain: {
    vb: '-44 -34 88 68', slot: { x: 150, y: 48, s: 0.92 }, w: 76,
    svg: `<path d="M-34 4C-42 -8-32 -22-18 -20C-14 -30 4 -30 8 -22C18 -28 34 -20 32 -8C42 -2 38 14 28 16C26 26 10 28 4 22C-4 28-20 26-22 18C-30 20-38 14-34 4Z" fill="#f4a6c8" stroke="#d0719c" stroke-width="3" stroke-linejoin="round"/>
      <path class="d" d="M2 -22C-2 -12 6 -6 0 4C-4 12 4 18 2 24M-24 -4C-16 -12-10 -2-6 -10M-26 10C-18 4-12 12-8 6M10 -6C16 -14 22 -6 28 -12M10 10C16 4 22 12 26 6" stroke="#d0719c" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
  },
  lungs: {
    vb: '-54 -50 108 94', slot: { x: 150, y: 204, s: 0.96 }, w: 100,
    svg: `<path class="d st" d="M0 -46V-14M0 -14C-4 -8-8 -4-14 2M0 -14C4 -8 8 -4 14 2" stroke="#f3b6bd" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>${lobe()}<g transform="scale(-1 1)">${lobe()}</g>
      <path class="d" d="M-24 -6C-30 4-30 14-26 22M24 -6C30 4 30 14 26 22" stroke="#e06a74" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>`,
    anim: 'breathe',
  },
  heart: {
    vb: '-30 -34 60 56', slot: { x: 160, y: 218, s: 1.2 }, w: 34,
    svg: `<g class="beat"><path class="d st" d="M-5 -18C-8 -28-4 -32 1 -32M6 -18C9 -28 14 -30 18 -26" stroke="#e94f5b" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M0 18C-32 -2-24 -24-9 -21C-3 -20 0 -15 0 -12C0 -15 3 -20 9 -21C24 -24 32 -2 0 18Z" fill="#e63946" stroke="#b21f2d" stroke-width="3" stroke-linejoin="round"/>
      <path class="d" d="M-15 -12C-19 -9-19 -3-17 0" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".55"/></g>`,
  },
  liver: {
    vb: '-40 -26 80 50', slot: { x: 133, y: 254, s: 0.9 }, w: 74,
    svg: `<path d="M-37 -8C-30 -20-4 -22 12 -16C28 -12 38 -4 36 6C34 16 20 20 6 18C-10 16-30 14-37 -8Z" fill="#b5683f" stroke="#7d4126" stroke-width="3" stroke-linejoin="round"/>
      <path class="d" d="M-6 -17C-4 -6-6 4-12 14" stroke="#7d4126" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>`,
  },
  stomach: {
    vb: '-28 -50 56 80', slot: { x: 171, y: 252, s: 0.92 }, w: 50,
    svg: `<path class="d st" d="M-10 -26C-12 -34-12 -40-14 -46" stroke="#f7c08a" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M-8 -24C8 -28 22 -18 24 -2C26 16 12 26 -4 24C-20 22-26 8-18 -2C-14 -8-14 -14-8 -24Z" fill="#f2a65a" stroke="#c4742b" stroke-width="3" stroke-linejoin="round"/>
      <path class="d" d="M2 -14C12 -12 16 -4 14 6" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".5"/>`,
  },
  kidneys: {
    vb: '-48 -22 96 44', slot: { x: 150, y: 288, s: 1.0 }, w: 80,
    svg: `<g transform="translate(-32 0)">${bean()}</g><g transform="translate(32 0) scale(-1 1)">${bean()}</g>`,
  },
  smallint: {
    vb: '-48 -32 96 76', slot: { x: 150, y: 324, s: 0.86 }, w: 80,
    svg: `<path class="st" d="${SI}" stroke="#f08f7e" stroke-width="12" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path class="d st" d="${SI}" stroke="#ffc2b6" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  largeint: {
    vb: '-58 -44 116 94', slot: { x: 150, y: 320, s: 0.84 }, w: 104,
    svg: `<path class="st" d="${LI}" stroke="#c97d4e" stroke-width="16" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path class="d st" d="${LI}" stroke="#e8ac80" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path class="d st" d="${LI}" stroke="#c97d4e" stroke-width="16" stroke-dasharray="2 10" fill="none"/>`,
  },
  bladder: {
    vb: '-18 -20 36 40', slot: { x: 150, y: 362, s: 1.0 }, w: 28,
    svg: `<path d="M0 -14C8 -14 14 -4 14 6C14 16 8 16 0 16C-8 16-14 16-14 6C-14 -4-8 -14 0 -14Z" fill="#f6d365" stroke="#cda12f" stroke-width="3" stroke-linejoin="round"/><path class="d" d="M-7 0C-7 -5-4 -8 -1 -9" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/>`,
  },
};
// the order they are drawn in (back to front)
export const LAYERS = ['kidneys', 'largeint', 'smallint', 'bladder', 'liver', 'stomach', 'lungs', 'heart', 'brain'];

// ---- the silhouette: a real human outline (right half, as offsets from the centre line; y runs down). Smoothed into curves; the 3D body is lofted from the same numbers.
export const OUT = [[16, 118], [16, 140], [34, 146], [62, 157], [56, 186], [50, 230], [44, 272], [50, 318], [58, 350], [60, 385], [56, 430], [51, 480], [51, 520], [48, 552], [38, 592], [40, 608]];   // neck → outer leg
const FOOT = [[56, 619], [57, 628], [16, 628]];
export const IN = [[12, 608], [14, 590], [13, 540], [11, 490], [8, 440], [4, 396], [0, 386]];                                                                                                      // inner leg → crotch
export const ARM_OUT = [[66, 156], [78, 172], [88, 205], [94, 245], [99, 285], [103, 325], [104, 346]];
export const ARM_IN = [[64, 160], [58, 192], [62, 224], [68, 262], [72, 300], [76, 336]];
const HAND = [[104, 352], [102, 368], [94, 384], [84, 382], [80, 366]];
const cr = (P, closed) => {   // a smooth closed curve through the points (Catmull-Rom → Béziers)
  const n = P.length, f = (v) => v.toFixed(1); let d = `M${f(P[0][0])} ${f(P[0][1])}`;
  for (let i = 0; i < n; i++) { const a = P[(i - 1 + n) % n], b = P[i], c = P[(i + 1) % n], e = P[(i + 2) % n]; d += `C${f(b[0] + (c[0] - a[0]) / 6)} ${f(b[1] + (c[1] - a[1]) / 6)} ${f(c[0] - (e[0] - b[0]) / 6)} ${f(c[1] - (e[1] - b[1]) / 6)} ${f(c[0])} ${f(c[1])}`; }
  return d + 'Z';
};
const right = (pts) => pts.map(([x, y]) => [150 + x, y]), left = (pts) => pts.map(([x, y]) => [150 - x, y]);
const half = [...OUT, ...FOOT, ...IN];
const trunk = [...right(half), ...left(half.slice(0, -1)).reverse()];                      // down the right side, back up the left (the crotch is shared)
const arm = [...ARM_OUT, ...HAND, ...ARM_IN.slice().reverse()];
export const BODY_PARTS = `<ellipse cx="150" cy="70" rx="44" ry="56"/><path d="${cr(trunk)}"/><path d="${cr(right(arm))}"/><path d="${cr(left(arm))}"/>`;

// is a point (in body coordinates) over the head or trunk? — where organs can go
export function insideBody(x, y) {
  const hx = (x - 150) / 52, hy = (y - 70) / 62;
  if (hx * hx + hy * hy <= 1) return true;
  return Math.abs(x - 150) < 64 && y > 120 && y < 400;
}
