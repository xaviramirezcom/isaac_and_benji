// The F-16 Fighting Falcon, lofted in code from cross-sections, in millimetres at 1:40 (375 mm long, 236 mm span). Shared by the Jet app (balsa kit) and the IQON city (play).
// Nose tip at x = 0, tail at x = 375. Up is +Y, +Z is the pilot's right. buildSkin() returns the painted meshes; scale the group to taste (× 0.04 → metres).
import * as THREE from '../vendor/three.module.min.js';
import { profile } from './insects/lib.js';

// ---------------------------------------------------------------- the F-16 at 1:40, in mm. Nose tip at x = 0, tail at x = 375. Up is +Y, +Z is the pilot's right.
// Fuselage cross-sections: top half = superellipse (half-width w, height t, exponent nt); bottom half = superellipse (half-width wb, depth b, exponent nb), both round centre line c.
export const ST = {
  w:  profile([[0, 0.8], [20, 7], [60, 13.5], [90, 15.5], [120, 17], [150, 18.5], [200, 20], [260, 19.5], [310, 15.5], [350, 11.5], [352, 11]]),
  t:  profile([[0, 0.8], [20, 6.5], [60, 12], [90, 13], [120, 14], [150, 15], [200, 16], [260, 16], [310, 14], [350, 11], [352, 10.5]]),
  b:  profile([[0, 0.8], [20, 6], [60, 11], [90, 13], [115, 15], [125, 25], [150, 27], [200, 27], [260, 23], [310, 15.5], [350, 11], [352, 10.5]]),
  wb: profile([[0, 0.8], [20, 7], [60, 13], [90, 14.5], [115, 15], [125, 14], [150, 15], [200, 16.5], [260, 15], [310, 12.5], [350, 11], [352, 10.5]]),
  c:  profile([[0, 0], [60, 1], [120, 3], [200, 5], [352, 5]]),
  nt: profile([[0, 2], [120, 2.2], [200, 2.6], [310, 2.2], [352, 2]]),
  nb: profile([[0, 2], [115, 2], [125, 4.5], [260, 4], [310, 2.6], [352, 2]]),
};
export const BODY0 = 0, BODY1 = 352, NOZ1 = 378;
export const sec = (x) => ({ w: ST.w(x), t: ST.t(x), b: ST.b(x), wb: ST.wb(x), c: ST.c(x), nt: ST.nt(x), nb: ST.nb(x) });
export const ring = (x, a) => { const s = sec(x), co = Math.cos(a), si = Math.sin(a); if (si >= 0) return [s.w * Math.sign(co) * Math.pow(Math.abs(co), 2 / s.nt), s.c + s.t * Math.pow(si, 2 / s.nt)]; return [s.wb * Math.sign(co) * Math.pow(Math.abs(co), 2 / s.nb), s.c - s.b * Math.pow(-si, 2 / s.nb)]; };   // [z, y]
export const topY = (x) => sec(x).c + sec(x).t, botY = (x) => sec(x).c - sec(x).b;
// planforms (x, z) for the right half; the left is mirrored
export const WING = { le: (z) => (z <= 18 ? 165 : z <= 36 ? 105 + (z - 18) / 18 * 60 : 165 + (z - 36) / 82 * 94), te: (z) => (z <= 18 ? 292 : 292 - (z - 18) / 100 * 5), span: 118, y: 1.5, thick: (ch) => Math.min(0.055 * ch, 6.5) };
export const STAB = { le: (z) => 312 + Math.max(0, z - 9) / 57 * 46, te: (z) => 364 + Math.max(0, z - 9) / 57 * 14, z0: 9, span: 66, y: 4, thick: (ch) => Math.min(0.06 * ch, 2.8) };
export const FIN = { base: [258, 352], tip: [318, 346], h: 72, y0: 20.5, thick: 3 };
export const FINTAB = [270, 345, 6];                                                 // the fin's tab fills a gap in the keel's top edge between these stations, down to y = 6
export const VFIN = [[300, 0], [338, 0], [330, -12], [312, -12]];                     // under the tail, hanging 12 mm, splayed outwards
export const CANOPY = { x0: 86, x1: 168, h: 15.5 };
export const FORMERS = [40, 70, 100, 130, 160, 190, 220, 250, 300, 325, 345];
export const inWing = (x) => x > WING.le(0) && x < WING.te(0);

// ---------------------------------------------------------------- geometry helpers
export function grid(nx, ny, f, closedY = false) {                                    // f(i, j) → [x, y, z]; builds an indexed surface
  const pos = [], idx = [], ny1 = closedY ? ny : ny + 1;
  for (let i = 0; i <= nx; i++) for (let j = 0; j < ny1; j++) pos.push(...f(i, j));
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const j2 = closedY ? (j + 1) % ny : j + 1, a = i * ny1 + j, b = i * ny1 + j2, c = (i + 1) * ny1 + j, d = (i + 1) * ny1 + j2; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
export const naca = (s, t) => 5 * t * (0.2969 * Math.sqrt(s) - 0.126 * s - 0.3516 * s * s + 0.2843 * s ** 3 - 0.1015 * s ** 4);
export function liftingSurface(pl, mirror) {                                          // a wing-like loft: airfoil sections from the root to the tip, closing at the tip
  const NZ = 26, NC = 28, z0 = pl.z0 ?? 0;
  return grid(NZ, NC, (i, j) => {
    const u = i / NZ, z = z0 + (pl.span - z0) * u, le = pl.le(z), te = pl.te(z), ch = Math.max(0.5, te - le), tt = pl.thick(ch) / ch * (u > 0.97 ? (1 - u) / 0.03 : 1);
    const k = j / NC, s = k < 0.5 ? 1 - k * 2 : (k - 0.5) * 2, up = k < 0.5 ? 1 : -1, x = le + ch * s, y = up * naca(Math.max(0, s), tt) * ch;
    return [x, pl.y + y, mirror ? -z : z];
  }, true);
}
export function finLoft() {                                                           // the fin stands on the spine: sections stacked in y
  const NZ = 20, NC = 24;
  return grid(NZ, NC, (i, j) => { const u = i / NZ, y = FIN.y0 + FIN.h * u, le = FIN.base[0] + (FIN.tip[0] - FIN.base[0]) * u, te = FIN.base[1] + (FIN.tip[1] - FIN.base[1]) * u, ch = te - le, tt = (FIN.thick / ch) * (u > 0.95 ? (1 - u) / 0.05 : 1); const k = j / NC, s = k < 0.5 ? 1 - k * 2 : (k - 0.5) * 2, side = k < 0.5 ? 1 : -1; return [le + ch * s, y, side * naca(Math.max(0, s), tt) * ch]; }, true);
}
export function fuselageLoft() {
  const NX = 120, NR = 48;
  const g = grid(NX, NR, (i, j) => { const x = BODY0 + (BODY1 - BODY0) * i / NX, [z, y] = ring(x, (j / NR) * Math.PI * 2); return [x, y, z]; }, true);
  const col = [], p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), x = p.getX(i), c = sec(x).c, k = THREE.MathUtils.smoothstep(y - c, -6, 8); col.push(0.78 - 0.3 * k, 0.8 - 0.3 * k, 0.82 - 0.28 * k); }   // darker grey on top, pale below
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return g;
}
export function canopyLoft() {
  const NX = 30, NR = 20;
  return grid(NX, NR, (i, j) => { const u = i / NX, x = CANOPY.x0 + (CANOPY.x1 - CANOPY.x0) * u, bump = Math.pow(Math.sin(Math.PI * Math.pow(u, 0.75)), 1.2), h = CANOPY.h * bump, w = sec(x).w * 0.86 * Math.pow(bump, 0.5), base = topY(x) - 1.5, a = (j / NR) * Math.PI; return [x, base + h * Math.sin(a), w * Math.cos(a)]; });
}
export function revolve(x0, x1, r, n = 24, m = 16) { return grid(n, m, (i, j) => { const x = x0 + (x1 - x0) * i / n, rr = r(x, i / n), a = (j / m) * Math.PI * 2; return [x, sec(BODY1).c + rr * Math.sin(a), rr * Math.cos(a)]; }, true); }


export function mirrorZ(geo) {                                                 // the other side of a wing: flip z and the triangle winding so the faces still point outwards
  const g = geo.clone(); g.scale(1, 1, -1); const ix = g.index.array; for (let i = 0; i < ix.length; i += 3) { const t = ix[i + 1]; ix[i + 1] = ix[i + 2]; ix[i + 2] = t; } g.computeVertexNormals(); return g;
}
export function buildSkin() {
  const grey = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.55, metalness: 0.15, clearcoat: 0.25, clearcoatRoughness: 0.4 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x4d5256, roughness: 0.6 }), metal = new THREE.MeshStandardMaterial({ color: 0x5a5d60, roughness: 0.35, metalness: 0.8 });
  const surf = new THREE.MeshPhysicalMaterial({ color: 0xa9afb4, roughness: 0.55, metalness: 0.15, clearcoat: 0.25, clearcoatRoughness: 0.4 });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x8c6b2e, roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.75, clearcoat: 1 });
  const list = [];
  const add = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; list.push(m); return m; };
  add(fuselageLoft(), grey);
  add(canopyLoft(), glass);
  { const w = liftingSurface(WING, false), st = liftingSurface(STAB, false); add(w, surf); add(mirrorZ(w), surf); add(st, surf); add(mirrorZ(st), surf); }
  add(finLoft(), surf);
  for (const s of [1, -1]) { const sh = new THREE.Shape(VFIN.map(([x, y]) => new THREE.Vector2(x, y))); const g = new THREE.ExtrudeGeometry(sh, { depth: 1.6, bevelEnabled: false }); g.translate(0, botY(318) + 1, -0.8); const m = add(g, surf); m.position.z = s * 8; m.rotation.x = s * 0.35; }
  add(revolve(BODY1 - 1, NOZ1, (x, u) => 10.5 - 3 * u), metal);                                              // the nozzle
  { const g = new THREE.CircleGeometry(7.5, 24); g.rotateY(Math.PI / 2); g.translate(NOZ1 - 0.2, sec(BODY1).c, 0); add(g, new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1 })); }
  { const g = new THREE.CylinderGeometry(0.6, 0.3, 22, 8); g.rotateZ(Math.PI / 2); g.translate(-10, 0, 0); add(g, dark); }       // the nose probe
  { const s = sec(122), g = new THREE.PlaneGeometry(s.wb * 1.6, s.b * 0.75); g.rotateY(-Math.PI / 2); g.translate(119.5, s.c - s.b * 0.55, 0); add(g, new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 1, side: THREE.DoubleSide })); }   // the intake mouth
  for (const s of [1, -1]) { const g = new THREE.CylinderGeometry(2.4, 2.4, 70, 12); g.rotateZ(Math.PI / 2); g.translate(255, WING.y + 0.5, s * 120); add(g, new THREE.MeshStandardMaterial({ color: 0xe6e6e6, roughness: 0.5 })); const n = new THREE.ConeGeometry(2.4, 7, 12); n.rotateZ(-Math.PI / 2); n.translate(216.5, WING.y + 0.5, s * 120); add(n, dark); for (const k of [0, 1]) { const f = new THREE.BoxGeometry(8, 0.6, 9); f.translate(k ? 232 : 282, WING.y + 0.5, s * 120); add(f, new THREE.MeshStandardMaterial({ color: 0xe6e6e6 })); } }   // wingtip Sidewinders
  return list;
}
