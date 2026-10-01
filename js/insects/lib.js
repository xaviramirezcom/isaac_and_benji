// Toolkit for the procedural insects.  Convention: the insect faces +X, up is +Y, +Z is its right-hand side.
import * as THREE from '../../vendor/three.module.min.js';

export const V = (x, y, z) => new THREE.Vector3(x, y, z);
export const rad = THREE.MathUtils.degToRad;
export const smooth = THREE.MathUtils.smoothstep;
export const lerp = THREE.MathUtils.lerp;

// deterministic random numbers so every load looks the same
export function rng(seed = 1) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export function mat(color, o = {}) { return new THREE.MeshPhysicalMaterial({ color, roughness: 0.45, metalness: 0, ...o }); }

// ---------------------------------------------------------------- geometry helpers
export function weld(geometry) {
  geometry.computeVertexNormals();
  const p = geometry.attributes.position, n = geometry.attributes.normal, map = new Map();
  const key = (i) => `${Math.round(p.getX(i) * 2e3)}_${Math.round(p.getY(i) * 2e3)}_${Math.round(p.getZ(i) * 2e3)}`;
  for (let i = 0; i < p.count; i++) { const k = key(i), a = map.get(k) ?? [0, 0, 0, []]; a[0] += n.getX(i); a[1] += n.getY(i); a[2] += n.getZ(i); a[3].push(i); map.set(k, a); }
  for (const [x, y, z, ids] of map.values()) { const l = Math.hypot(x, y, z) || 1; for (const i of ids) n.setXYZ(i, x / l, y / l, z / l); }
  return geometry;
}

// Piecewise-cubic curve through [x, value] control points (Catmull-Rom tangents).
export function profile(pts) {
  const xs = pts.map((p) => p[0]), vs = pts.map((p) => p[1]), n = xs.length;
  const tan = (k) => (k === 0 ? (vs[1] - vs[0]) / (xs[1] - xs[0]) : k === n - 1 ? (vs[k] - vs[k - 1]) / (xs[k] - xs[k - 1]) : (vs[k + 1] - vs[k - 1]) / (xs[k + 1] - xs[k - 1]));
  return (x) => {
    if (x <= xs[0]) return vs[0]; if (x >= xs[n - 1]) return vs[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * vs[i] + (t3 - 2 * t2 + t) * h * tan(i) + (-2 * t3 + 3 * t2) * vs[i + 1] + (t3 - t2) * h * tan(i + 1);
  };
}
const fn = (p) => (typeof p === 'function' ? p : Array.isArray(p) ? profile(p) : () => p);

// A body shaped by cross-sections along X. Each section is a superellipse (n=2 ellipse, bigger = boxier).
// w: half width, top/bot: heights above/below the centre line yc, zc: sideways offset. Any of them can be [[x,value],...].
export function loft({ x0, x1, w, top, bot, n = 2.2, yc = 0, zc = 0, segX = 96, segR = 56, round = 0.1, mod = null, material }) {
  const W = fn(w), T = fn(top), B = fn(bot ?? top), N = fn(n), YC = fn(yc), ZC = fn(zc);
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= segX; i++) {
    const s = i / segX, x = x0 + (x1 - x0) * s, e = Math.min(s, 1 - s);
    const cap = e < round ? Math.sqrt(Math.max(0, 1 - Math.pow(1 - e / round, 2))) : 1;
    const w_ = Math.max(0, W(x)) * cap, t_ = Math.max(0, T(x)) * cap, b_ = Math.max(0, B(x)) * cap, nn = N(x), yc_ = YC(x), zc_ = ZC(x);
    for (let j = 0; j < segR; j++) {
      const th = (j / segR) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
      let z = w_ * Math.sign(c) * Math.pow(Math.abs(c), 2 / nn), y = (sn > 0 ? t_ : b_) * Math.sign(sn) * Math.pow(Math.abs(sn), 2 / nn);
      if (mod) { const m = mod(x, th, s); z *= m; y *= m; }
      pos.push(x, yc_ + y, zc_ + z); uv.push(s, j / segR);
    }
  }
  for (let i = 0; i < segX; i++) for (let j = 0; j < segR; j++) {
    const a = i * segR + j, b = i * segR + ((j + 1) % segR), c = (i + 1) * segR + j, d = (i + 1) * segR + ((j + 1) % segR);
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  weld(g);
  return new THREE.Mesh(g, material);
}

// One half (side = +1 right / -1 left) of a dome-shaped body that is symmetric about z=0: the halves meet in a seam on top.
export function halfLoft(side, opts) {
  const m = loft({ ...opts, zc: 0 });
  const p = m.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) { const z = p.getZ(i); p.setZ(i, side > 0 ? Math.max(z, 0) : Math.min(z, 0)); }
  weld(m.geometry);
  return m;
}

export function blob(rx, ry, rz, material, deform = null, seg = [64, 40]) {
  const g = new THREE.SphereGeometry(1, seg[0], seg[1]);
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); if (deform) deform(v); p.setXYZ(i, v.x * rx, v.y * ry, v.z * rz); }
  weld(g);
  return new THREE.Mesh(g, material);
}

// Tapered tube along a smooth curve (radius can change along the length).
export function tube(points, radiusAt, material, { segs = 36, radial = 10, caps = true } = {}) {
  const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5);
  const frames = curve.computeFrenetFrames(segs, false);
  const pos = [], idx = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, c = curve.getPointAt(t), r = radiusAt(t), N = frames.normals[i], B = frames.binormals[i];
    for (let j = 0; j < radial; j++) { const a = (j / radial) * Math.PI * 2, ca = Math.cos(a) * r, sa = Math.sin(a) * r; pos.push(c.x + N.x * ca + B.x * sa, c.y + N.y * ca + B.y * sa, c.z + N.z * ca + B.z * sa); }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) { const a = i * radial + j, b = i * radial + ((j + 1) % radial), c = (i + 1) * radial + j, d = (i + 1) * radial + ((j + 1) % radial); idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  const group = new THREE.Group(); group.add(new THREE.Mesh(g, material));
  if (caps) for (const t of [0, 1]) { const s = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), material); s.position.copy(curve.getPointAt(t)); s.scale.setScalar(radiusAt(t)); group.add(s); }
  group.userData.curve = curve;
  return group;
}

export function cone(at, dir, length, radius, material, radial = 6) {
  const m = new THREE.Mesh(new THREE.ConeGeometry(radius, length, radial), material);
  const d = dir.clone().normalize(); m.position.copy(at).addScaledVector(d, length / 2); m.quaternion.setFromUnitVectors(V(0, 1, 0), d);
  return m;
}
export function ball(at, r, material, sx = 1, sy = 1, sz = 1) { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 18, 12), material); m.position.copy(at); m.scale.set(r * sx, r * sy, r * sz); return m; }

// ---------------------------------------------------------------- textures
export function canvasTex(w, h, draw, { srgb = true, repeat = null } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); }
  return t;
}
function noise(ctx, w, h, amount, seed = 3, size = 1) {
  const r = rng(seed); const id = ctx.getImageData(0, 0, w, h), d = id.data;
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * amount; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  ctx.putImageData(id, 0, 0);
}
// Shell colour: vertical gradient (stops = [[0..1, '#hex'], ...]) plus speckle. v runs around the body.
export function shellColorTex(stops, { speckle = 14, seed = 2, streaks = 0 } = {}) {
  return canvasTex(512, 512, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); stops.forEach(([t, c]) => g.addColorStop(t, c)); x.fillStyle = g; x.fillRect(0, 0, w, h);
    const r = rng(seed); x.globalAlpha = 0.08; for (let i = 0; i < streaks; i++) { x.fillStyle = r() > 0.5 ? '#000' : '#fff'; x.fillRect(r() * w, 0, 2 + r() * 8, h); }
    x.globalAlpha = 1; noise(x, w, h, speckle, seed);
  });
}
// Punctate striae: rows of tiny pits and shallow grooves running along the body (for beetle wing covers).
export function pitBumpTex({ rows = 9, pit = 3.4, step = 20, groove = 3, seed = 5, base = 150 } = {}) {
  return canvasTex(1024, 512, (x, w, h) => {
    x.fillStyle = `rgb(${base},${base},${base})`; x.fillRect(0, 0, w, h);
    const r = rng(seed);
    for (let k = 0; k < rows; k++) {
      const y = ((k + 0.5) / rows) * h;
      x.strokeStyle = 'rgba(40,40,40,.55)'; x.lineWidth = groove; x.beginPath(); x.moveTo(0, y); x.lineTo(w, y); x.stroke();
      for (let px = (k % 2) * step * 0.5; px < w; px += step) {
        const g = x.createRadialGradient(px, y, 0, px, y, pit); g.addColorStop(0, 'rgba(0,0,0,.9)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        x.fillStyle = g; x.beginPath(); x.arc(px, y + (r() - 0.5) * 2, pit, 0, 7); x.fill();
      }
    }
    noise(x, w, h, 10, seed);
  }, { srgb: false });
}
// Fine micro-roughness (chitin / hairy skin)
export function microBumpTex(seed = 7, amount = 38, size = 256) {
  return canvasTex(size, size, (x, w, h) => { x.fillStyle = '#808080'; x.fillRect(0, 0, w, h); noise(x, w, h, amount, seed); }, { srgb: false, repeat: [6, 6] });
}
// Honeycomb of tiny domes: compound-eye facets
export function facetTex() {
  return canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#505050'; x.fillRect(0, 0, w, h);
    const s = 16, dy = s * 0.866;
    for (let row = 0; row * dy < h + s; row++) for (let col = 0; col * s < w + s; col++) {
      const cx = col * s + (row % 2 ? s / 2 : 0), cy = row * dy;
      const g = x.createRadialGradient(cx, cy, 0, cx, cy, s * 0.62); g.addColorStop(0, '#ffffff'); g.addColorStop(0.7, '#9a9a9a'); g.addColorStop(1, '#202020');
      x.fillStyle = g; x.beginPath(); x.arc(cx, cy, s * 0.6, 0, 7); x.fill();
    }
  }, { srgb: false, repeat: [3, 2] });
}

// ---------------------------------------------------------------- hairs / bristles
export function hairs(meshes, { count = 2000, length = 0.12, radius = 0.01, color = 0xc79a45, light = 0.25, back = 0.5, spread = 0.35, seed = 1, region = null, lenVar = 0.5 } = {}) {
  const r = rng(seed), tris = [];
  let total = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), na = new THREE.Vector3(), nb = new THREE.Vector3(), nc = new THREE.Vector3();
  for (const m of meshes) {
    m.updateMatrix(); const g = m.geometry, p = g.attributes.position, n = g.attributes.normal, ix = g.index;
    const cnt = ix ? ix.count : p.count;
    for (let i = 0; i < cnt; i += 3) {
      const i0 = ix ? ix.getX(i) : i, i1 = ix ? ix.getX(i + 1) : i + 1, i2 = ix ? ix.getX(i + 2) : i + 2;
      a.fromBufferAttribute(p, i0).applyMatrix4(m.matrix); b.fromBufferAttribute(p, i1).applyMatrix4(m.matrix); c.fromBufferAttribute(p, i2).applyMatrix4(m.matrix);
      if (region && !region((a.x + b.x + c.x) / 3, (a.y + b.y + c.y) / 3, (a.z + b.z + c.z) / 3)) continue;
      const area = b.clone().sub(a).cross(c.clone().sub(a)).length() / 2;
      na.fromBufferAttribute(n, i0).transformDirection(m.matrix); nb.fromBufferAttribute(n, i1).transformDirection(m.matrix); nc.fromBufferAttribute(n, i2).transformDirection(m.matrix);
      tris.push([a.clone(), b.clone(), c.clone(), na.clone(), nb.clone(), nc.clone(), total += area]);
    }
  }
  const geo = new THREE.ConeGeometry(radius, 1, 4, 1); geo.translate(0, 0.5, 0);
  const material = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85 });
  const inst = new THREE.InstancedMesh(geo, material, count);
  const base = new THREE.Color(color), col = new THREE.Color(), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), dir = new THREE.Vector3(), sc = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const t = r() * total; let lo = 0, hi = tris.length - 1; while (lo < hi) { const mid = (lo + hi) >> 1; if (tris[mid][6] < t) lo = mid + 1; else hi = mid; }
    const [A, B, C, NA, NB, NC] = tris[lo]; let u = r(), v = r(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
    pos.copy(A).multiplyScalar(1 - u - v).addScaledVector(B, u).addScaledVector(C, v);
    dir.copy(NA).multiplyScalar(1 - u - v).addScaledVector(NB, u).addScaledVector(NC, v).normalize();
    dir.add(V(-back, 0, 0)).add(V((r() - 0.5) * spread * 2, (r() - 0.5) * spread * 2, (r() - 0.5) * spread * 2)).normalize();
    q.setFromUnitVectors(V(0, 1, 0), dir); const L = length * (1 - lenVar * r()); sc.set(1, L, 1);
    pos.addScaledVector(dir, -0.01);
    m4.compose(pos, q, sc); inst.setMatrixAt(i, m4);
    col.copy(base).lerp(new THREE.Color(0xffffff), light * r()).multiplyScalar(0.8 + 0.4 * r()); inst.setColorAt(i, col);
  }
  inst.instanceMatrix.needsUpdate = true; inst.instanceColor.needsUpdate = true;
  inst.raycast = () => {}; inst.userData.isHair = true; inst.frustumCulled = false;
  return inst;
}

// ---------------------------------------------------------------- legs (two-bone IK + jointed foot)
function limb(a, b, r0, r1, material, bulge = 0.0) {
  const mid = a.clone().lerp(b, 0.5);
  return tube([a, mid, b], (t) => r0 + (r1 - r0) * t + bulge * Math.sin(Math.PI * t), material, { segs: 12, radial: 12 });
}
function solveKnee(H, A, lf, lt, pole) {
  const d0 = A.clone().sub(H), d = Math.min(d0.length(), (lf + lt) * 0.999), dir = d0.clone().normalize();
  const a = (lf * lf - lt * lt + d * d) / (2 * d), h = Math.sqrt(Math.max(lf * lf - a * a, 0.0001));
  const p = pole.clone().sub(dir.clone().multiplyScalar(pole.dot(dir))).normalize();
  return H.clone().addScaledVector(dir, a).addScaledVector(p, h);
}
// hip -> femur -> knee -> tibia -> ankle -> tarsus (jointed) -> claws at the foot
export function leg({ hip, foot, pole = V(0, 1, 0.25), femur, tibia, tarsusDir, tarsusLen, rFem = 0.1, rTib = 0.05, rTar = 0.028, material, spineMat, spines = 0, spurs = 2, teeth = 0, tarsi = 5, coxa = 1.0, femurBulge = 0.03, hairy = false }) {
  const g = new THREE.Group(), sm = spineMat ?? material;
  const td = tarsusDir.clone().normalize(), A = foot.clone().addScaledVector(td, -tarsusLen);
  const K = solveKnee(hip, A, femur, tibia, pole);
  g.add(ball(hip, rFem * 0.75 * coxa, material));                                  // coxa (hip joint)
  g.add(limb(hip, K, rFem * 0.95, rFem * 0.75, material, femurBulge));            // femur
  g.add(ball(K, rFem * 0.62, material));                                           // knee
  g.add(limb(K, A, rTib * 1.25, rTib * 0.85, material, 0.0));                      // tibia
  const tdir = A.clone().sub(K).normalize(), outward = V(0, 0, Math.sign(foot.z || 1));
  const perp = tdir.clone().cross(V(1, 0, 0)).normalize(); if (perp.dot(outward) < 0) perp.negate();
  for (let i = 0; i < spines; i++) {                                               // spiny tibia
    const t = 0.25 + (0.7 * i) / Math.max(spines - 1, 1), p = K.clone().lerp(A, t), side = i % 2 ? 1 : -1;
    const d = perp.clone().multiplyScalar(0.8).addScaledVector(tdir, 0.5).addScaledVector(V(0, 1, 0), 0.25 * side); g.add(cone(p, d, 0.12, 0.014, sm, 5));
  }
  for (let i = 0; i < teeth; i++) {                                                // broad digging teeth
    const t = 0.45 + i * 0.2, p = K.clone().lerp(A, t), d = perp.clone().addScaledVector(tdir, 0.55); g.add(cone(p.addScaledVector(perp, rTib * 0.5), d, 0.2, rTib * 0.75, sm, 4));
  }
  for (let i = 0; i < spurs; i++) g.add(cone(A, tdir.clone().add(perp.clone().multiplyScalar(0.35 * (i ? -0.6 : 1))), 0.17, 0.02, sm, 5));
  g.add(ball(A, rTib * 0.72, material));                                           // ankle
  for (let i = 0; i < tarsi; i++) {                                                // jointed foot
    const t0 = i / tarsi, t1 = (i + 1) / tarsi, a = A.clone().lerp(foot, t0), b = A.clone().lerp(foot, t1), r = rTar * (1.25 - 0.45 * t0);
    g.add(limb(a, b, r, rTar * (1.25 - 0.45 * t1), material)); g.add(ball(b, r * 0.92, material));
  }
  for (const s of [-1, 1]) g.add(cone(foot, td.clone().addScaledVector(perp, 0.55 * s).addScaledVector(V(0, -0.4, 0), 1), 0.13, 0.017, sm, 5)); // claws
  g.userData.knee = K;
  return g;
}

// ---------------------------------------------------------------- antennae
export function beadAntenna({ pts, beads = 10, r0 = 0.035, r1 = 0.02, material, scapeEnd = 0.3 }) {
  const g = new THREE.Group(), curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
  g.add(tube(curve.getPoints(24).filter((_, i, a) => i <= Math.floor(a.length * scapeEnd)), (t) => r0 * (1 - 0.2 * t), material, { segs: 8, radial: 10 }));
  for (let i = 0; i < beads; i++) { const t = scapeEnd + ((1 - scapeEnd) * (i + 0.5)) / beads, p = curve.getPointAt(t), r = lerp(r0 * 0.85, r1, i / beads); g.add(ball(p, r, material, 1.25, 1, 1)); }
  g.add(tube(curve.getPoints(40).filter((_, i, a) => i >= Math.floor(a.length * scapeEnd)), () => r1 * 0.45, material, { segs: 20, radial: 6 }));
  return g;
}

// ---------------------------------------------------------------- wing (veins + translucent membrane)
export function wing({ length, width, lateral = 0, veins = 8, tint = '#e8eef4', alpha = 0.55, veinColor = 'rgba(60,45,30,.8)', curve = 0.08, tip = 0.5, seed = 4 }) {
  const W = 1024, H = Math.max(64, Math.round((1024 * width) / length)), c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), r = rng(seed);
  const outline = () => { x.beginPath(); x.moveTo(6, H * 0.5); x.bezierCurveTo(W * 0.1, H * 0.02, W * 0.62, H * 0.0, W - 8, H * (0.3 + 0.3 * tip)); x.bezierCurveTo(W * 0.85, H * 0.97, W * 0.3, H * 1.02, 6, H * 0.5); x.closePath(); };
  outline(); const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, tint); g.addColorStop(1, '#ffffff'); x.fillStyle = g; x.fill();
  x.save(); outline(); x.clip(); x.lineCap = 'round'; x.strokeStyle = veinColor;
  x.lineWidth = 5; x.beginPath(); x.moveTo(6, H * 0.45); x.quadraticCurveTo(W * 0.5, H * 0.18, W * 0.97, H * 0.4); x.stroke();                     // costa
  for (let i = 0; i < veins; i++) { const t = (i + 1) / (veins + 1), sx = W * (0.08 + 0.78 * t), ey = H * (0.2 + 0.7 * r());
    x.lineWidth = 3 - 1.5 * t; x.beginPath(); x.moveTo(sx, H * (0.3 + 0.12 * t)); x.bezierCurveTo(sx + W * 0.05, H * 0.5, sx + W * 0.03, ey, sx + W * 0.14, H * (0.9 + 0.1 * r())); x.stroke(); }
  x.lineWidth = 1.5; for (let i = 0; i < 14; i++) { const sx = W * (0.15 + 0.75 * r()); x.beginPath(); x.moveTo(sx, H * (0.35 + 0.4 * r())); x.lineTo(sx + W * 0.06 * r(), H * (0.2 + 0.75 * r())); x.stroke(); }
  x.restore(); x.lineWidth = 4; x.strokeStyle = veinColor; outline(); x.stroke();
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const geo = new THREE.PlaneGeometry(length, width, 24, 6); geo.translate(length / 2, 0, 0); geo.rotateX(-Math.PI / 2); geo.translate(0, 0, lateral * width);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, Math.sin((p.getX(i) / length) * Math.PI) * curve * length - Math.abs(p.getZ(i) - lateral * width) * 0.12);
  geo.computeVertexNormals();
  const m = new THREE.MeshPhysicalMaterial({ map: tex, transparent: true, opacity: alpha, side: THREE.DoubleSide, roughness: 0.12, metalness: 0, depthWrite: false, iridescence: 0.5, iridescenceIOR: 1.3, iridescenceThicknessRange: [200, 500] });
  m.userData.baseOpacity = alpha;
  return new THREE.Mesh(geo, m);
}

// ---------------------------------------------------------------- parts
export function part(id, category, group, info) {
  group.name = id; group.userData.partId = id; group.userData.category = category; group.userData.info = info;
  group.traverse((o) => {
    if (o.isMesh) { o.material = o.material.clone(); o.userData.partId = id; if (!o.userData.isHair) { o.castShadow = true; o.receiveShadow = true; } }
  });
  return group;
}
