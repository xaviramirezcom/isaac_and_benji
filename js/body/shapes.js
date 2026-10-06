// The 2D body: a child-shaped silhouette (viewBox 300×640) and the flat organs, each drawn around its own centre (0,0).
// `.st` = a stroke-only shape (tubes), `.d` = a detail that disappears in the empty "slot" outline. `slot` is where the organ lives in the body.
export const BODY_VB = [300, 640];
const lobe = (extra = '') => `<path d="M-10 -36C-30 -34-46 -12-48 14C-50 32-38 38-24 35C-12 33-9 22-9 8C-9 -6-8 -20-10 -36Z" fill="#ff9b9b" stroke="#e06a74" stroke-width="3" stroke-linejoin="round"${extra}/>`;
const bean = (extra = '') => `<path d="M4 -15C13 -12 14 4 8 13C4 18-2 15-1 9C0 4-4 3-5-2C-6-9-2-16 4-15Z" fill="#b24a45" stroke="#8a2f2f" stroke-width="2.5" stroke-linejoin="round"${extra}/>`;
const SI = 'M-34 -20q8.5 -8 17 0t17 0t17 0t17 0c10 0 10 13 0 13q-8.5 -8 -17 0t-17 0t-17 0t-17 0c-10 0 -10 13 0 13q8.5 -8 17 0t17 0t17 0t17 0c10 0 10 13 0 13q-8.5 -8 -17 0t-17 0t-17 0t-17 0';
const LI = 'M-40 36L-46 30V-26Q-46 -34 -38 -32Q0 -18 38 -32Q46 -34 46 -26V24C46 42 22 42 18 30C14 20 4 30 0 36';


// ---- realistic paint: gradients (kept in their own always-rendered <svg> so the tray icons can use them too)
export const DEFS = `<defs>
 <linearGradient id="gSkin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6d6bd"/><stop offset="1" stop-color="#e2ab8c"/></linearGradient>
 <radialGradient id="gLung" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#d9a9a2"/><stop offset=".6" stop-color="#b98480"/><stop offset="1" stop-color="#8d605d"/></radialGradient>
 <radialGradient id="gHeart" cx=".35" cy=".28" r=".85"><stop offset="0" stop-color="#f2606a"/><stop offset=".55" stop-color="#c3222f"/><stop offset="1" stop-color="#7c0f1d"/></radialGradient>
 <linearGradient id="gLiver" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c25a43"/><stop offset=".6" stop-color="#963a2a"/><stop offset="1" stop-color="#6f2218"/></linearGradient>
 <radialGradient id="gStom" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="#f3ab9c"/><stop offset=".6" stop-color="#d8715f"/><stop offset="1" stop-color="#b24a3d"/></radialGradient>
 <radialGradient id="gKid" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="#cf5d54"/><stop offset="1" stop-color="#75211e"/></radialGradient>
 <radialGradient id="gBlad" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="#f8e6c0"/><stop offset="1" stop-color="#d49f66"/></radialGradient>
 <radialGradient id="gBrain" cx=".4" cy=".3" r=".9"><stop offset="0" stop-color="#f6c3bd"/><stop offset=".65" stop-color="#d9908b"/><stop offset="1" stop-color="#b86a68"/></radialGradient>
 <linearGradient id="gBone" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f8ecc6"/><stop offset="1" stop-color="#d6bf88"/></linearGradient>
</defs>`;
// the permanent bones: a spine and pelvis behind the organs, ribs and collarbones over them (faint, like an anatomy plate)
const ribPath = (k, sg) => { const y = 160 + k * 15, w = 46 - k * 1.2; return `M${150 + sg * 6} ${y}Q${150 + sg * (w + 10)} ${y - 6} ${150 + sg * w} ${y + 17}Q${150 + sg * (w - 8)} ${y + 33} ${150 + sg * 9} ${y + 24 + k * 2}`; };
export const BONES_BACK = `<g class="bones"><g fill="url(#gBone)" stroke="#b59a5c" stroke-width="1.2">${Array.from({ length: 15 }, (_, k) => `<rect x="${150 - 8 + (k > 11 ? 1 : 0)}" y="${140 + k * 16}" width="16" height="12" rx="5"/>`).join('')}</g>
  <path d="M150 378C132 370 108 372 100 386C96 398 108 406 122 402C134 398 144 392 150 394C156 392 166 398 178 402C192 406 204 398 200 386C192 372 168 370 150 378Z" fill="url(#gBone)" stroke="#b59a5c" stroke-width="1.2" opacity=".7"/></g>`;
export const BONES_FRONT = `<g class="bones" opacity=".34">${Array.from({ length: 9 }, (_, k) => [-1, 1].map((sg) => `<path d="${ribPath(k, sg)}" fill="none" stroke="#a88f52" stroke-width="5" stroke-linecap="round"/><path d="${ribPath(k, sg)}" fill="none" stroke="#f1e0aa" stroke-width="3.2" stroke-linecap="round"/>`).join('')).join('')}
  <rect x="145" y="152" width="10" height="66" rx="5" fill="url(#gBone)" stroke="#b59a5c" stroke-width="1.2"/><path d="M148 152C120 144 96 150 80 164M152 152C180 144 204 150 220 164" fill="none" stroke="#a88f52" stroke-width="7" stroke-linecap="round"/><path d="M148 152C120 144 96 150 80 164M152 152C180 144 204 150 220 164" fill="none" stroke="#f1e0aa" stroke-width="4.6" stroke-linecap="round"/></g>`;
// a few soft shadows so the skin looks like a body, not a sticker
export const SKIN_SHADE = `<g fill="none" stroke="#a96f55" stroke-width="1.6" stroke-linecap="round" opacity=".28"><path d="M112 150C130 146 140 150 148 154M188 150C170 146 160 150 152 154"/><path d="M118 236Q150 250 182 236"/><path d="M150 240V330M128 262Q150 270 172 262M130 292Q150 300 170 292"/><path d="M112 480C114 520 116 548 122 580M188 480C186 520 184 548 178 580"/><path d="M96 190C92 230 94 262 98 300M204 190C208 230 206 262 202 300"/></g>
 <ellipse cx="132" cy="190" rx="26" ry="20" fill="#fff" opacity=".13"/><ellipse cx="168" cy="190" rx="26" ry="20" fill="#fff" opacity=".13"/>`;
export const SHAPES = {
  brain: {
    vb: '-44 -34 88 68', slot: { x: 150, y: 48, s: 0.92 }, w: 76,
    svg: `<path d="M-30 12C-42 4-40 -14-28 -20C-26 -30-10 -32-4 -26C4 -33 22 -30 26 -20C38 -18 42 -2 34 8C32 20 20 22 14 18L10 26C6 28 0 26-2 22C-8 28-24 24-30 12Z" fill="url(#gBrain)" stroke="#8d5453" stroke-width="1.6" stroke-linejoin="round"/>
      <path class="d" d="M0 -26C-3 -14 4 -8 -1 2C-5 10 3 16 1 22M-24 -10C-18 -18-10 -8-5 -16M-30 2C-22 -4-14 6-8 -2M-26 14C-18 8-10 16-4 10M6 -14C12 -22 20 -12 26 -18M8 0C14 -6 22 4 30 -2M8 12C14 6 22 14 28 8" stroke="#a5605f" stroke-width="2" fill="none" stroke-linecap="round" opacity=".75"/>
      <path class="d" d="M-12 -22C-6 -26 4 -26 10 -22" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".4"/>
      <path d="M8 24C14 24 24 26 22 32C18 38 6 36 2 30Z" fill="url(#gBrain)" stroke="#8d5453" stroke-width="1.4"/><path class="d" d="M10 28H20M9 32H18" stroke="#a5605f" stroke-width="1.4" opacity=".7"/>
      <path d="M-2 26C-6 34-6 40-2 44L4 44C6 38 4 32 2 26Z" fill="#e5aaa5" stroke="#8d5453" stroke-width="1.2"/>`,
  },
  lungs: {
    vb: '-54 -50 108 94', slot: { x: 150, y: 204, s: 0.96 }, w: 100,
    svg: `<path class="d st" d="M0 -46V-14" stroke="#c9b4a6" stroke-width="8" fill="none" stroke-linecap="round"/><path class="d st" d="M0 -46V-14" stroke="#efe0d4" stroke-width="8" stroke-dasharray="1.6 3.2" fill="none"/>
      ${[-1, 1].map((sg) => `<g transform="scale(${sg} 1)"><path d="M-10 -36C-30 -34-46 -12-48 14C-50 32-38 38-24 35C-12 33-9 22-9 8C-9 -6-8 -20-10 -36Z" fill="url(#gLung)" stroke="#6f4643" stroke-width="1.8" stroke-linejoin="round"/>
        <path class="d" d="M-9 -12C-16 -8-22 -2-26 6M-14 -2C-20 4-24 12-26 20M-12 6C-16 14-18 22-18 28M-20 -2C-30 0-36 6-40 14M-24 8C-32 14-36 22-38 28" stroke="#e8c9c1" stroke-width="2" fill="none" stroke-linecap="round" opacity=".55"/>
        <path class="d" d="M-14 -28C-26 -24-34 -12-36 0" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".28"/></g>`).join('')}`,
    anim: 'breathe',
  },
  heart: {
    vb: '-32 -44 64 66', slot: { x: 160, y: 218, s: 1.2 }, w: 34,
    svg: `<g class="beat"><path class="d st" d="M-6 -14C-8 -26 -4 -32 4 -36C14 -38 24 -30 26 -20" stroke="#8d1522" stroke-width="9" fill="none" stroke-linecap="round"/><path class="d st" d="M-6 -14C-8 -26 -4 -32 4 -36C14 -38 24 -30 26 -20" stroke="#d4303e" stroke-width="6.4" fill="none" stroke-linecap="round"/>
      <path class="d st" d="M7 -15C6 -28 8 -40 8 -44" stroke="#27478f" stroke-width="8" fill="none" stroke-linecap="round"/><path class="d st" d="M7 -15C6 -28 8 -40 8 -44" stroke="#4a73c9" stroke-width="5.4" fill="none" stroke-linecap="round"/>
      <path d="M0 19C-30 0-26 -22-10 -22C-4 -22 0 -17 0 -14C0 -17 5 -22 11 -21C27 -20 32 -2 0 19Z" fill="url(#gHeart)" stroke="#5c0a14" stroke-width="1.8" stroke-linejoin="round"/>
      <path class="d" d="M-14 -14C-20 -10-20 -2-17 3M2 -12C6 -2 4 8 -2 14" stroke="#ff9aa0" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".45"/>
      <path class="d" d="M-12 -4C-6 4-2 10 2 12M10 -10C12 -4 10 4 6 9" stroke="#e8a04a" stroke-width="1.5" fill="none" stroke-linecap="round" opacity=".8"/></g>`,
  },
  liver: {
    vb: '-40 -26 80 56', slot: { x: 133, y: 254, s: 0.9 }, w: 74,
    svg: `<path d="M-37 -6C-32 -20-6 -24 12 -17C28 -12 40 -2 38 6C36 14 24 16 10 14C-4 12-12 18-22 16C-32 14-38 6-37 -6Z" fill="url(#gLiver)" stroke="#4e150d" stroke-width="1.8" stroke-linejoin="round"/>
      <path class="d" d="M-6 -18C-4 -8-6 4-12 14" stroke="#4e150d" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".6"/>
      <path class="d" d="M-28 -12C-14 -20 4 -20 18 -14" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".28"/>
      <ellipse cx="-4" cy="17" rx="6" ry="4" fill="#6f9c3c" stroke="#3f6720" stroke-width="1.2"/>`,
  },
  stomach: {
    vb: '-28 -50 58 82', slot: { x: 171, y: 252, s: 0.92 }, w: 50,
    svg: `<path class="d st" d="M-10 -26C-12 -34-12 -40-14 -48" stroke="#b9584c" stroke-width="8" fill="none" stroke-linecap="round"/><path class="d st" d="M-10 -26C-12 -34-12 -40-14 -48" stroke="#e08a7a" stroke-width="5.4" fill="none" stroke-linecap="round"/>
      <path d="M-8 -24C8 -30 24 -20 26 -2C28 16 14 28 -4 26C-22 24-28 8-20 -2C-16 -8-14 -14-8 -24Z" fill="url(#gStom)" stroke="#8c3228" stroke-width="1.8" stroke-linejoin="round"/>
      <path class="d" d="M-14 6C-6 12 6 14 16 8M-12 -2C-4 4 8 6 18 0M-8 -10C0 -4 10 -4 18 -8" stroke="#8c3228" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".4"/>
      <path class="d" d="M0 -20C10 -18 18 -10 20 0" stroke="#fff" stroke-width="3.4" fill="none" stroke-linecap="round" opacity=".35"/>
      <path d="M22 18C28 22 34 22 36 18" class="d" stroke="#d8715f" stroke-width="0" fill="none"/>`,
  },
  kidneys: {
    vb: '-48 -22 96 44', slot: { x: 150, y: 288, s: 1.0 }, w: 80,
    svg: [-1, 1].map((sg) => `<g transform="translate(${sg * 32} 0) scale(${-sg} 1)"><path d="M4 -16C14 -13 15 4 9 14C5 19-2 16-1 9C0 4-5 3-6 -2C-7 -10-2 -17 4 -16Z" fill="url(#gKid)" stroke="#4c1210" stroke-width="1.6" stroke-linejoin="round"/><path class="d" d="M-1 -4C-3 -2-3 2 0 5" stroke="#f0a09a" stroke-width="2" fill="none" stroke-linecap="round" opacity=".6"/><path class="d" d="M6 -10C10 -6 11 0 9 5" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".3"/></g>`).join(''),
  },
  smallint: {
    vb: '-48 -32 96 76', slot: { x: 150, y: 324, s: 0.86 }, w: 80,
    svg: `<path class="st" d="${SI}" stroke="#a4503f" stroke-width="14" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path class="st" d="${SI}" stroke="#e58d79" stroke-width="11" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path class="d st" d="${SI}" stroke="#f9c3b3" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 -2)"/>`,
  },
  largeint: {
    vb: '-58 -44 116 94', slot: { x: 150, y: 320, s: 0.84 }, w: 104,
    svg: `<path class="st" d="${LI}" stroke="#9a4a38" stroke-width="18" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path class="st" d="${LI}" stroke="#d6785f" stroke-width="14.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path class="d st" d="${LI}" stroke="#a24f3b" stroke-width="14.5" stroke-dasharray="1.6 11" fill="none"/><path class="d st" d="${LI}" stroke="#f0a58f" stroke-width="3.4" fill="none" stroke-linecap="round" stroke-linejoin="round" transform="translate(-2 -2)"/>`,
  },
  bladder: {
    vb: '-18 -22 36 42', slot: { x: 150, y: 362, s: 1.0 }, w: 28,
    svg: `<path d="M0 -14C8 -14 14 -4 14 6C14 16 8 16 0 16C-8 16-14 16-14 6C-14 -4-8 -14 0 -14Z" fill="url(#gBlad)" stroke="#8b5a2a" stroke-width="1.6" stroke-linejoin="round"/><path class="d" d="M-7 0C-7 -5-4 -8-1 -9" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".6"/><path class="d st" d="M0 -14V-20" stroke="#d49f66" stroke-width="4" stroke-linecap="round"/>`,
  },
};
// the order they are drawn in (back to front)
export const LAYERS = ['kidneys', 'largeint', 'smallint', 'bladder', 'liver', 'stomach', 'lungs', 'heart', 'brain'];

// ---- the silhouette: a real human outline (right half, as offsets from the centre line; y runs down). Smoothed into curves; the 3D body is lofted from the same numbers.
export const OUT = [[16, 118], [16, 140], [36, 146], [70, 158], [55, 188], [50, 230], [44, 272], [50, 318], [58, 350], [60, 385], [56, 430], [51, 480], [51, 520], [48, 552], [38, 592], [40, 608]];   // neck → outer leg
const FOOT = [[56, 619], [57, 628], [16, 628]];
export const IN = [[12, 608], [14, 590], [13, 540], [11, 490], [8, 440], [4, 396], [0, 386]];                                                                                                      // inner leg → crotch
export const ARM_OUT = [[74, 158], [85, 173], [93, 205], [98, 245], [102, 285], [105, 325], [106, 346]];
export const ARM_IN = [[70, 162], [60, 194], [63, 226], [69, 264], [73, 300], [77, 336]];
const HAND = [[106, 352], [104, 368], [96, 385], [86, 383], [82, 366]];
const cr = (P, closed) => {   // a smooth closed curve through the points (Catmull-Rom → Béziers)
  const n = P.length, f = (v) => v.toFixed(1); let d = `M${f(P[0][0])} ${f(P[0][1])}`;
  for (let i = 0; i < n; i++) { const a = P[(i - 1 + n) % n], b = P[i], c = P[(i + 1) % n], e = P[(i + 2) % n]; d += `C${f(b[0] + (c[0] - a[0]) / 6)} ${f(b[1] + (c[1] - a[1]) / 6)} ${f(c[0] - (e[0] - b[0]) / 6)} ${f(c[1] - (e[1] - b[1]) / 6)} ${f(c[0])} ${f(c[1])}`; }
  return d + 'Z';
};
const right = (pts) => pts.map(([x, y]) => [150 + x, y]), left = (pts) => pts.map(([x, y]) => [150 - x, y]);
const half = [...OUT, ...FOOT, ...IN];
const trunk = [...right(half), ...left(half.slice(0, -1)).reverse()];                      // down the right side, back up the left (the crotch is shared)
const arm = [...ARM_OUT, ...HAND, ...ARM_IN.slice().reverse()];
export const BODY_PARTS = `<path d="M150 14C176 14 192 34 192 66C192 98 176 124 150 126C124 124 108 98 108 66C108 34 124 14 150 14Z"/><path d="${cr(trunk)}"/><path d="${cr(right(arm))}"/><path d="${cr(left(arm))}"/>`;

// is a point (in body coordinates) over the head or trunk? — where organs can go
export function insideBody(x, y) {
  const hx = (x - 150) / 52, hy = (y - 70) / 62;
  if (hx * hx + hy * hy <= 1) return true;
  return Math.abs(x - 150) < 64 && y > 120 && y < 400;
}
