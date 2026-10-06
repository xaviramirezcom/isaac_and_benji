// Geometry toolkit for the procedural human body: noise, tubes swept along curves, bodies lofted from cross-sections, deformable blobs.
// Everything is built in metres (a person is about 1.8 m tall, origin at the middle of the body) and turned into scene units later.
import * as THREE from '../../vendor/three.module.min.js';

// ---------------------------------------------------------------- noise
const H = (i, j, k) => { const n = Math.sin(i * 127.1 + j * 311.7 + k * 74.7) * 43758.5453; return n - Math.floor(n); };
export function noise(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz), l = (a, b, t) => a + (b - a) * t;
  return l(l(l(H(ix, iy, iz), H(ix + 1, iy, iz), u), l(H(ix, iy + 1, iz), H(ix + 1, iy + 1, iz), u), v), l(l(H(ix, iy, iz + 1), H(ix + 1, iy, iz + 1), u), l(H(ix, iy + 1, iz + 1), H(ix + 1, iy + 1, iz + 1), u), v), w);
}
export const fbm = (x, y, z, o = 4) => { let a = 0.5, s = 0, f = 1; for (let i = 0; i < o; i++) { s += a * noise(x * f, y * f, z * f); f *= 2.03; a *= 0.5; } return s; };
export const ridged = (x, y, z, o = 3) => { let a = 0.5, s = 0, f = 1; for (let i = 0; i < o; i++) { s += a * (1 - Math.abs(2 * noise(x * f, y * f, z * f) - 1)); f *= 2.1; a *= 0.5; } return s; };
export const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const gauss = (x, s) => Math.exp(-(x * x) / (2 * s * s));
export const hex = (h) => [1, 3, 5].map((i) => (parseInt(h.slice(i, i + 2), 16) / 255) ** 2.2);   // vertex colours are linear, so convert from the usual sRGB hex
export const mix3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

// ---------------------------------------------------------------- geometry from rings of points (the ends are closed with a centre point)
export function fromRings(rings, colorFn = null, closeEnds = true) {
  const R = rings.length, M = rings[0].length, pos = [], col = [], idx = [];
  const push = (p, t, a) => { pos.push(p.x, p.y, p.z); if (colorFn) { const c = colorFn(p, t, a); col.push(c[0], c[1], c[2]); } };
  rings.forEach((ring, i) => ring.forEach((p, j) => push(p, i / (R - 1), j / M)));
  for (let i = 0; i < R - 1; i++) for (let j = 0; j < M; j++) { const a = i * M + j, b = i * M + (j + 1) % M, c = (i + 1) * M + j, d = (i + 1) * M + (j + 1) % M; idx.push(a, c, b, b, c, d); }
  if (closeEnds) for (const end of [0, R - 1]) {
    const c = new THREE.Vector3(); rings[end].forEach((p) => c.add(p)); c.multiplyScalar(1 / M); const ci = pos.length / 3; push(c, end ? 1 : 0, 0);
    for (let j = 0; j < M; j++) { const a = end * M + j, b = end * M + (j + 1) % M; if (end === 0) idx.push(ci, b, a); else idx.push(ci, a, b); }
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); if (colorFn) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}

// ---------------------------------------------------------------- a tube swept along a smooth curve through control points [[x,y,z],...]
// radius(t) -> number | [rx, rz]; mod(t, angle) multiplies the radius (rings, ridges…); colorFn(p, t, angle) -> [r,g,b]
export function sweep(ctrl, radius, { n = 80, ring = 14, mod = null, colorFn = null, closeEnds = true, tension = 0.5 } = {}) {
  const rf = typeof radius === 'function' ? radius : () => radius;
  const curve = new THREE.CatmullRomCurve3(ctrl.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'catmullrom', tension), P = curve.getSpacedPoints(n);
  const T = P.map((p, i) => P[Math.min(n, i + 1)].clone().sub(P[Math.max(0, i - 1)]).normalize());
  const axis = Math.abs(T[0].y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0), N = new THREE.Vector3().crossVectors(T[0], axis).normalize(), frames = [];
  for (let i = 0; i <= n; i++) {
    if (i > 0) {   // rotation-minimising frame
      const v1 = P[i].clone().sub(P[i - 1]), c1 = v1.dot(v1) || 1e-9, rL = N.clone().addScaledVector(v1, -2 / c1 * v1.dot(N)), tL = T[i - 1].clone().addScaledVector(v1, -2 / c1 * v1.dot(T[i - 1])), v2 = T[i].clone().sub(tL), c2 = v2.dot(v2) || 1e-9;
      N.copy(rL).addScaledVector(v2, -2 / c2 * v2.dot(rL)).normalize();
    }
    frames.push([N.clone(), new THREE.Vector3().crossVectors(T[i], N).normalize()]);
  }
  const rings = P.map((p, i) => {
    const t = i / n, r = rf(t), rx = Array.isArray(r) ? r[0] : r, rz = Array.isArray(r) ? r[1] : r, [Nn, B] = frames[i];
    return Array.from({ length: ring }, (_, j) => { const a = j / ring * Math.PI * 2, m = mod ? mod(t, a) : 1; return p.clone().addScaledVector(Nn, Math.cos(a) * rx * m).addScaledVector(B, Math.sin(a) * rz * m); });
  });
  return fromRings(rings, colorFn && ((p, t, a) => colorFn(p, t, a)), closeEnds);
}

// ---------------------------------------------------------------- a body lofted from horizontal cross-sections: rows of [y, halfWidth, halfDepth, zCentre] (top to bottom)
function interpRows(rows, y) {
  let i = 0; while (i < rows.length - 2 && y < rows[i + 1][0]) i++;
  const a = rows[i], b = rows[i + 1], t = Math.min(1, Math.max(0, (a[0] - y) / (a[0] - b[0]))), s = t * t * (3 - 2 * t);
  const p = rows[Math.max(0, i - 1)], q = rows[Math.min(rows.length - 1, i + 2)];
  return [1, 2, 3].map((k) => { const m0 = (b[k] - p[k]) * 0.5, m1 = (q[k] - a[k]) * 0.5, t2 = t * t, t3 = t2 * t; return (2 * t3 - 3 * t2 + 1) * a[k] + (t3 - 2 * t2 + t) * m0 + (-2 * t3 + 3 * t2) * b[k] + (t3 - t2) * m1 + 0 * s; });
}
export function loftY(rows, { step = 0.008, ring = 56, power = 2.3, mod = null } = {}) {
  const top = rows[0][0], bottom = rows[rows.length - 1][0], rings = [];
  for (let y = top; y >= bottom - 1e-6; y -= step) {
    const [hw, hd, zc] = interpRows(rows, y);
    rings.push(Array.from({ length: ring }, (_, j) => {
      const a = j / ring * Math.PI * 2, c = Math.cos(a), s = Math.sin(a), e = 2 / power;
      let x = hw * Math.sign(c) * Math.abs(c) ** e, z = zc + hd * Math.sign(s) * Math.abs(s) ** e;
      if (mod) { const d = mod(y, x, z, a); x += d[0]; z += d[1]; }
      return new THREE.Vector3(x, y, z);
    }));
  }
  return fromRings(rings);
}

// ---------------------------------------------------------------- a deformable blob: unit sphere → p (metres) through fn(unitPoint, out) (out is a Vector3 to fill); colorFn(p, u)
export function blob(fn, colorFn = null, w = 72, h = 54) {
  const rings = [];
  for (let i = 1; i < h; i++) {
    const th = i / h * Math.PI, ring = [];
    for (let j = 0; j < w; j++) { const ph = j / w * Math.PI * 2, u = new THREE.Vector3(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)), out = new THREE.Vector3().copy(u); fn(u, out); ring.push({ out, u }); }
    rings.push(ring);
  }
  const unit = new Map(); rings.forEach((r) => r.forEach(({ out, u }) => unit.set(out, u)));
  return fromRings(rings.map((r) => r.map((e) => e.out)), colorFn && ((p) => colorFn(p, unit.get(p) ?? null)), true);
}
export const ellipsoid = (rx, ry, rz, c = [0, 0, 0]) => (u, out) => out.set(c[0] + u.x * rx, c[1] + u.y * ry, c[2] + u.z * rz);

// ---------------------------------------------------------------- merge geometries (position, normal, optional colour) into one
export function merge(geos, tint = null) {
  let pos = [], nor = [], col = [], idx = [], off = 0, hasCol = geos.every((g) => g.attributes.color) || !!tint;
  for (const g of geos) {
    const p = g.attributes.position, n = g.attributes.normal; for (let i = 0; i < p.count; i++) { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); }
    if (hasCol) { const c = g.attributes.color; for (let i = 0; i < p.count; i++) { if (c) col.push(c.getX(i), c.getY(i), c.getZ(i)); else col.push(...tint); } }
    const ix = g.index.array; for (let i = 0; i < ix.length; i++) idx.push(ix[i] + off); off += p.count;
  }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); if (hasCol) g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); return g;
}
export const solid = (g, c) => { const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) a.set(c, i * 3); g.setAttribute('color', new THREE.BufferAttribute(a, 3)); return g; };
export const moved = (g, x = 0, y = 0, z = 0) => { g.translate(x, y, z); return g; };
