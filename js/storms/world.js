// A small American neighbourhood built from "bodies": every wall, roof half, garage door, car, tree, fence… is one mesh
// (merged, vertex-coloured) that the physics in storms-game.js can rip loose and throw around.
import * as THREE from '../../vendor/three.module.min.js';

export function mulberry(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1).toNonIndexed(),
  cyl: new THREE.CylinderGeometry(1, 1, 1, 14, 1).toNonIndexed(),
  cone: new THREE.ConeGeometry(1, 1, 12, 1).toNonIndexed(),
  ico: new THREE.IcosahedronGeometry(1, 2).toNonIndexed(),
};
export const MATERIAL = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9, metalness: 0 });

const _e = new THREE.Euler(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _v = new THREE.Vector3(), _n = new THREE.Matrix3(), _c = new THREE.Color();
function mat(x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) { _e.set(rx, ry, rz, 'YXZ'); _q.setFromEuler(_e); return new THREE.Matrix4().compose(_p.set(x, y, z), _q, _s.set(sx, sy, sz)); }

class Merger {
  constructor(rnd) { this.p = []; this.n = []; this.c = []; this.rnd = rnd; this.parent = new THREE.Matrix4(); }
  put(g, m, color, j = 0.07) {
    const M = this.parent.clone().multiply(m), pos = g.attributes.position, nor = g.attributes.normal, f = 1 + (this.rnd() - 0.5) * 2 * j;
    _n.getNormalMatrix(M); _c.set(color);
    for (let i = 0; i < pos.count; i++) {
      _v.fromBufferAttribute(pos, i).applyMatrix4(M); this.p.push(_v.x, _v.y, _v.z);
      _v.fromBufferAttribute(nor, i).applyMatrix3(_n).normalize(); this.n.push(_v.x, _v.y, _v.z);
      this.c.push(_c.r * f, _c.g * f, _c.b * f);
    }
    return this;
  }
  box(color, x, y, z, sx, sy, sz, rx, ry, rz, j) { return this.put(GEO.box, mat(x, y, z, sx, sy, sz, rx, ry, rz), color, j); }
  cyl(color, x, y, z, r, h, rx, ry, rz, j) { return this.put(GEO.cyl, mat(x, y, z, r, h, r, rx, ry, rz), color, j); }
  cone(color, x, y, z, r, h, j) { return this.put(GEO.cone, mat(x, y, z, r, h, r), color, j); }
  ico(color, x, y, z, rx, ry, rz, j) { return this.put(GEO.ico, mat(x, y, z, rx, ry, rz), color, j); }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3));
    return g;
  }
}

// Turn merged world-space geometry into a body: a mesh centred on its own middle, with the info the physics needs.
function body(mg, o) {
  const g = mg.geometry(); g.computeBoundingBox(); const bb = g.boundingBox, c = bb.getCenter(new THREE.Vector3()), size = bb.getSize(new THREE.Vector3());
  g.translate(-c.x, -c.y, -c.z);
  const mesh = new THREE.Mesh(g, MATERIAL); mesh.position.copy(c); mesh.castShadow = true; mesh.receiveShadow = true; mesh.matrixAutoUpdate = true;
  const axis = size.x <= size.y && size.x <= size.z ? 0 : size.y <= size.z ? 1 : 2;
  return { mesh, pos0: c.clone(), q0: new THREE.Quaternion(), size, axis, rest: Math.max(0.08, size.getComponent(axis) / 2), vel: new THREE.Vector3(), ang: new THREE.Vector3(), loose: false, dead: false, age: 0, fail: 0, k: 0.01, shatter: [], ...o };
}

const SIDING = ['#f1ede4', '#e8dcc2', '#b9cfe0', '#c9d3c4', '#d9b9a8', '#e4e0d4', '#a9b8c4', '#efe3b5'];
const ROOFS = ['#3b3b40', '#4a3f3a', '#5a4038', '#2f3b46', '#55504a'];
const GLASS = '#2b3a4a', TRIM = '#f7f4ee', BRICK = '#9a4a3a', DOOR = ['#6a3d2a', '#2f4a63', '#7a2f2f', '#35563f'];
const CARS = ['#c0392b', '#2c5aa0', '#d8d8d8', '#1f1f23', '#8a8f96', '#3f7d4e', '#d9a21b', '#f2f2f2'];

export function buildWorld(scene, seed = 7) {
  const rnd = mulberry(seed), R = (a, b) => a + rnd() * (b - a), pick = (a) => a[Math.floor(rnd() * a.length)];
  const bodies = [], houses = [], blockers = [];
  const add = (b) => { bodies.push(b); scene.add(b.mesh); return b; };

  // ---- static ground furniture: asphalt, lane markings, sidewalks, driveways (one merged mesh)
  const st = new Merger(rnd);
  const EXT = 520, STREETS = [-150, 0, 150];
  for (const c of STREETS) {
    st.box('#3a3c40', 0, 0.04, c, EXT, 0.08, 12, 0, 0, 0, 0.02); st.box('#3a3c40', c, 0.04, 0, 12, 0.08, EXT, 0, 0, 0, 0.02);
    for (let i = -255; i <= 255; i += 8) { if (Math.abs(i - c) < 8) continue; st.box('#e8d36a', i, 0.09, c, 3.6, 0.02, 0.18); st.box('#e8d36a', c, 0.09, i, 0.18, 0.02, 3.6); }
  }
  for (const s of [-1, 1]) st.box('#b9b7b0', 0, 0.06, s * 7.4, 300, 0.12, 2.4, 0, 0, 0, 0.02), st.box('#b9b7b0', s * 7.4, 0.06, 0, 2.4, 0.12, 300, 0, 0, 0, 0.02);
  // ---- houses: 3 on each side of each of the 4 street arms
  const arms = [{ dx: 1, dz: 0 }, { dx: -1, dz: 0 }, { dx: 0, dz: 1 }, { dx: 0, dz: -1 }];
  for (const arm of arms) for (const side of [-1, 1]) for (const dist of [34, 64, 94, 124]) {
    const off = 20.5, x = arm.dx * dist + (arm.dz ? side * off : 0), z = arm.dz * dist + (arm.dx ? side * off : 0);
    // the front of the house faces the street
    const fx = arm.dz ? -side : 0, fz = arm.dx ? -side : 0, yaw = Math.atan2(fx, fz);
    buildHouse(x + R(-1.5, 1.5) * (arm.dx ? 1 : 0), z + R(-1.5, 1.5) * (arm.dz ? 1 : 0), yaw);
  }
  function buildHouse(x, z, yaw, o = {}) {
    const W = o.W ?? R(10.5, 13), D = o.D ?? R(8.2, 10), H = o.H ?? 3.0, fy = 0.35, rise = o.rise ?? 2.5, t = 0.3, robust = o.robust ?? R(0.9, 1.2);
    const siding = o.siding ?? pick(SIDING), roofC = o.roofC ?? pick(ROOFS), doorC = pick(DOOR), house = { x, z, robust, parts: [], damaged: false, roofGone: false, wallGone: false, W, D };
    const P = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), new THREE.Vector3(1, 1, 1));
    const mk = () => { const m = new Merger(rnd); m.parent = P; return m; };
    const mk2 = (mg, o) => { const b = add(body(mg, { house, ...o })); b.fail = (o.fail ?? 0) * robust * R(0.94, 1.08); house.parts.push(b); return b; };
    blockers.push({ x, z, r: Math.max(W, D) * 0.75 + 2 });
    // foundation + wooden floor
    mk2(mk().box('#a8a69f', 0, fy / 2, 0, W + 0.7, fy, D + 0.7).box('#a98d68', 0, fy + 0.03, 0, W - 0.5, 0.06, D - 0.5, 0, 0, 0, 0.1), { kind: 'slab', fail: 205, k: 0.0016, shatter: [[1, 8], [0, 4]] });
    // front wall (door + window), back wall (2 windows)
    const wy = fy + H / 2;
    mk2(mk().box(siding, 0, wy, D / 2 - t / 2, W, H, t).box(doorC, -W / 2 + 5.4, fy + 1.05, D / 2 + 0.06, 1.1, 2.1, 0.12).box(GLASS, W / 2 - 2.3, fy + 1.7, D / 2 + 0.04, 1.8, 1.25, 0.1).box(TRIM, W / 2 - 2.3, fy + 1.7, D / 2 + 0.02, 2.0, 1.45, 0.06).box(TRIM, -W / 2 + 5.4, fy + 2.2, D / 2 + 0.06, 1.5, 0.12, 0.14), { kind: 'wallF', fail: 130, k: 0.012, shatter: [[3, 8], [0, 3], [1, 3]] });
    mk2(mk().box(siding, 0, wy, -D / 2 + t / 2, W, H, t).box(GLASS, -W * 0.24, fy + 1.7, -D / 2 - 0.04, 1.5, 1.2, 0.1).box(GLASS, W * 0.24, fy + 1.7, -D / 2 - 0.04, 1.5, 1.2, 0.1), { kind: 'wallB', fail: 130, k: 0.012, shatter: [[3, 8], [0, 3], [1, 3]] });
    // side walls with their gable triangles
    for (const s of [-1, 1]) {
      const m = mk().box(siding, s * (W / 2 - t / 2), wy, 0, t, H, D - 2 * t).box(GLASS, s * (W / 2 + 0.04), fy + 1.7, 0, 0.1, 1.2, 1.5).box(TRIM, s * (W / 2 + 0.02), fy + 1.7, 0, 0.06, 1.4, 1.7);
      // gable: stack shrinking slabs to make a triangle
      for (let i = 0; i < 6; i++) { const w = (D - 2 * t) * (1 - (i + 0.5) / 6); m.box(siding, s * (W / 2 - t / 2), fy + H + (i + 0.5) * (rise / 6), 0, t, rise / 6 + 0.01, w); }
      mk2(m, { kind: 'wallS', fail: 138, k: 0.012, shatter: [[3, 8], [0, 3], [1, 2]] });
    }
    // garage door sits in front of the front wall
    if (!o.civic) mk2(mk().box('#ece9e2', -W / 2 + 2.25, fy + 1.15, D / 2 + 0.14, 3.5, 2.3, 0.12).box('#c9c6bd', -W / 2 + 2.25, fy + 1.15, D / 2 + 0.21, 3.2, 0.06, 0.04).box('#c9c6bd', -W / 2 + 2.25, fy + 1.6, D / 2 + 0.21, 3.2, 0.06, 0.04).box('#c9c6bd', -W / 2 + 2.25, fy + 0.7, D / 2 + 0.21, 3.2, 0.06, 0.04), { kind: 'garage', fail: 82, k: 0.02, shatter: [[1, 8], [3, 3]] });
    // roof: two sloped halves
    const run = D / 2 + 0.7, L = Math.hypot(run, rise), a = Math.atan2(rise, run);
    for (const s of [-1, 1]) {
      mk2(mk().box(roofC, 0, fy + H + rise / 2 - 0.05, s * run / 2, W + 1.1, 0.2, L, s * a, 0, 0, 0.1).box('#2c2c30', 0, fy + H + rise + 0.02, 0, W + 1.1, 0.25, 0.35, 0, 0, 0, 0.02), { kind: 'roof', fail: 100, k: 0.014, shatter: [[2, 14], [0, 4], [1, 3]] });
    }
    if (!o.civic) mk2(mk().box(BRICK, W * 0.28, fy + H + rise * 0.5 + 0.6, -D * 0.15, 0.95, rise + 1.7, 0.95, 0, 0, 0, 0.1).box('#6b5a50', W * 0.28, fy + H + rise + 1.5, -D * 0.15, 1.15, 0.18, 1.15), { kind: 'chimney', fail: 108, k: 0.004, shatter: [[6, 10]] });
    // furniture inside (shows once the walls are gone)
    if (!o.civic) mk2(mk().box('#6f4e3a', -W * 0.2, fy + 0.5, 0.5, 2.4, 0.9, 1.0).box('#6f4e3a', -W * 0.2, fy + 0.95, 0.15, 2.4, 0.6, 0.3), { kind: 'furn', fail: 160, k: 0.005, shatter: [[0, 4]] });
    if (!o.civic) mk2(mk().box('#8a6a46', W * 0.15, fy + 0.45, -1.2, 1.6, 0.08, 1.0).box('#8a6a46', W * 0.15 - 0.6, fy + 0.2, -1.5, 0.1, 0.4, 0.1).box('#8a6a46', W * 0.15 + 0.6, fy + 0.2, -0.9, 0.1, 0.4, 0.1), { kind: 'furn', fail: 160, k: 0.006, shatter: [[0, 3]] });
    houses.push(house); house.P = P; house.part = mk2; house.mk = mk;
    if (o.civic) return house;
    // driveway + path (static)
    st.parent = P; st.box('#9a9a96', -W / 2 + 2.25, 0.05, D / 2 + 7, 3.6, 0.1, 14.4, 0, 0, 0, 0.02); st.box('#b3b0a8', -W / 2 + 5.4, 0.05, D / 2 + 6, 1.2, 0.1, 12, 0, 0, 0, 0.02); st.parent = new THREE.Matrix4();
    // back fence
    const fm = mk(); for (let i = 0; i < 14; i++) fm.box('#8a6a44', -7 + i + 0.5, 0.85, -D / 2 - 7.5, 0.92, 1.7, 0.1, 0, 0, 0, 0.12); fm.box('#775a38', 0, 0.45, -D / 2 - 7.5, 14, 0.12, 0.14).box('#775a38', 0, 1.3, -D / 2 - 7.5, 14, 0.12, 0.14);
    const fb = add(body(fm, { house: null, kind: 'fence', fail: 75, k: 0.011, shatter: [[0, 8], [1, 3]] })); fb.fail = 75 * R(0.9, 1.15);
    // a car in the driveway for most houses
    if (rnd() < 0.7) {
      const cp = new THREE.Vector3(-W / 2 + 2.25, 0, D / 2 + 6.4).applyMatrix4(P); car(cp.x, cp.z, yaw + R(-0.05, 0.05));
    }
    if (rnd() < 0.2) { const tp = new THREE.Vector3(R(-3, 3), 0, -D / 2 - 4.2).applyMatrix4(P); trampoline(tp.x, tp.z); }
    if (rnd() < 0.5) { const bp = new THREE.Vector3(W / 2 - 1.8, 0, D / 2 + 9.5).applyMatrix4(P); bin(bp.x, bp.z); }
    return house;
  }
  function car(x, z, yaw, colOverride, bigOverride) {
    const col = colOverride ?? pick(CARS), P = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), new THREE.Vector3(1, 1, 1));
    const m = new Merger(rnd); m.parent = P; const big = bigOverride ?? rnd() < 0.3;
    const L = big ? 5.4 : 4.4, Hc = big ? 1.9 : 1.45;
    m.box(col, 0, 0.62, 0, 1.85, 0.62, L, 0, 0, 0, 0.02).box(col, 0, 1.12, -0.1, 1.7, big ? 0.9 : 0.55, L * 0.55, 0, 0, 0, 0.02).box(GLASS, 0, 1.15, -0.1, 1.72, big ? 0.7 : 0.38, L * 0.5, 0, 0, 0, 0)
      .box('#e8e8e0', 0.7, 0.7, L / 2 + 0.01, 0.4, 0.18, 0.05).box('#e8e8e0', -0.7, 0.7, L / 2 + 0.01, 0.4, 0.18, 0.05).box('#b02020', 0.7, 0.75, -L / 2 - 0.01, 0.4, 0.15, 0.05).box('#b02020', -0.7, 0.75, -L / 2 - 0.01, 0.4, 0.15, 0.05);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) m.cyl('#18181a', sx * 0.95, 0.34, sz * L * 0.32, 0.34, 0.26, 0, 0, Math.PI / 2, 0);
    const b = add(body(m, { house: null, kind: 'car', fail: 0, k: 0.0053, loose: true, friction: 0.62, shatter: [] })); b.slide = true; return b;
  }
  function trampoline(x, z) {
    const m = new Merger(rnd); m.cyl('#262b3c', x, 0.95, z, 2.1, 0.08, 0, 0, 0, 0.02).cyl('#4a4f5c', x, 0.9, z, 2.3, 0.06, 0, 0, 0, 0.02);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283; m.box('#6a6f7a', x + Math.cos(a) * 2.1, 0.45, z + Math.sin(a) * 2.1, 0.1, 0.9, 0.1); }
    add(body(m, { house: null, kind: 'tramp', fail: 48, k: 0.02, shatter: [] }));
  }
  function bin(x, z) { const m = new Merger(rnd); m.cyl(pick(['#2f5f9a', '#3a6a3f', '#555a60']), x, 0.55, z, 0.38, 1.1, 0, 0, 0, 0.05).cyl('#222', x, 1.13, z, 0.42, 0.08, 0, 0, 0, 0); add(body(m, { house: null, kind: 'bin', fail: 36, k: 0.03, shatter: [] })); }
  // ======================================================== the rest of the town
  const frameM = (x, z, yaw) => new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), new THREE.Vector3(1, 1, 1));
  const MG = (P) => { const m = new Merger(rnd); m.parent = P; return m; };
  const newStruct = (x, z, W, D, robust) => { const h = { x, z, robust, parts: [], damaged: false, roofGone: false, wallGone: false, W, D }; houses.push(h); return h; };
  const part = (h, mg, o) => { const b = add(body(mg, { house: h, ...o })); b.fail = (o.fail ?? 0) * h.robust * R(0.94, 1.08); h.parts.push(b); return b; };
  const stat = (P, fn) => { st.parent = P; fn(st); st.parent = new THREE.Matrix4(); };
  const rowsOfWindows = (m, glass, alongX, face, dir, center, span, floors, fy) => {
    const cols = Math.max(1, Math.round(span / 3.4));
    for (let r = 0; r < floors; r++) for (let c = 0; c < cols; c++) {
      const p = center - span / 2 + (c + 0.5) * span / cols, y = fy + 1.9 + r * 3.4;
      if (alongX) m.box(glass, p, y, face + dir * 0.03, 1.7, 1.6, 0.1); else m.box(glass, face + dir * 0.03, y, p, 0.1, 1.6, 1.7);
    }
  };
  // low and mid-rise buildings with flat roofs: shops, schools, apartments, warehouses
  function flatBuilding(x, z, yaw, W, D, floors, wallC, roofC, o = {}) {
    const P = frameM(x, z, yaw), H = o.H ?? floors * 3.4 + 0.6, fy = 0.35, rob = o.robust ?? R(0.9, 1.15), h = newStruct(x, z, W, D, rob), fw = o.fw ?? 128, fr = o.fr ?? 105, glass = o.glass ?? GLASS, fl = Math.max(1, Math.floor(floors));
    blockers.push({ x, z, r: Math.hypot(W, D) / 2 + 3 });
    part(h, MG(P).box('#a8a69f', 0, fy / 2, 0, W + 0.6, fy, D + 0.6), { kind: 'slab', fail: 205, k: 0.0016, shatter: [[1, 8], [0, 4]] });
    const nx = Math.max(1, Math.ceil(W / 16)), sw = W / nx;
    for (const s of [1, -1]) for (let i = 0; i < nx; i++) {
      const x0 = -W / 2 + sw * (i + 0.5), m = MG(P).box(wallC, x0, fy + H / 2, s * (D / 2 - 0.15), sw, H, 0.3);
      if (o.store && s === 1) m.box(glass, x0, fy + 1.9, D / 2 + 0.03, sw - 1.4, 2.5, 0.1).box('#d9d9d4', x0, fy + 3.6, D / 2 + 0.05, sw - 0.6, 0.5, 0.12);
      else if (!o.blank) rowsOfWindows(m, glass, true, s * D / 2, s, x0, sw, fl, fy);
      part(h, m, { kind: s === 1 ? 'wallF' : 'wallB', fail: fw, k: 0.012, shatter: [[3, 6], [1, 4], [9, 4]] });
    }
    const nz = Math.max(1, Math.ceil(D / 16)), sd = D / nz;
    for (const s of [1, -1]) for (let i = 0; i < nz; i++) {
      const z0 = -D / 2 + sd * (i + 0.5), m = MG(P).box(wallC, s * (W / 2 - 0.15), fy + H / 2, z0, 0.3, H, sd);
      if (!o.blank) rowsOfWindows(m, glass, false, s * W / 2, s, z0, sd, fl, fy);
      part(h, m, { kind: 'wallS', fail: fw + 8, k: 0.012, shatter: [[3, 6], [1, 4], [9, 3]] });
    }
    for (let i = 0; i < nx; i++) {
      const x0 = -W / 2 + sw * (i + 0.5), m = MG(P).box(roofC, x0, fy + H + 0.15, 0, sw + 0.1, 0.3, D + 0.5).box('#aeb2b6', x0 + R(-sw / 4, sw / 4), fy + H + 0.95, R(-D / 4, D / 4), 1.9, 1.0, 1.3);
      part(h, m, { kind: 'roof', fail: fr, k: 0.013, shatter: [[1, 8], [0, 3], [2, 6]] });
    }
    return { h, P, H, fy };
  }
  // glass-and-steel towers: a static core with facade panels that peel off, top floors first
  function tower(x, z, yaw, W, D, floors) {
    const P = frameM(x, z, yaw), fy = 0.35, fh = 3.6, H = floors * fh, rob = R(0.92, 1.12), h = newStruct(x, z, W, D, rob), tone = pick(['#7f8a96', '#8d98a0', '#6c7886', '#9aa4a8']);
    blockers.push({ x, z, r: Math.hypot(W, D) / 2 + 4 });
    stat(P, (m) => m.box('#6b7078', 0, fy + H / 2, 0, W - 0.5, H, D - 0.5).box('#555a60', 0, fy / 2, 0, W + 2, fy, D + 2));
    const per = Math.max(1, Math.round(floors / 3)), levels = [{ f0: 0, n: per, fail: 178 }, { f0: per, n: per, fail: 152 }, { f0: per * 2, n: floors - per * 2, fail: 128 }];
    for (const L of levels) {
      const y0 = fy + L.f0 * fh, segH = L.n * fh, yc = y0 + segH / 2;
      for (const [fx, fz, sx, sz] of [[0, D / 2 + 0.2, W, 0.5], [0, -D / 2 - 0.2, W, 0.5], [-W / 2 - 0.2, 0, 0.5, D], [W / 2 + 0.2, 0, 0.5, D]]) {
        const m = MG(P).box(tone, fx, yc, fz, sx, segH, sz);
        for (let r = 0; r < L.n; r++) {
          const y = y0 + r * fh + fh * 0.5;
          if (sz < 1) m.box('#26323f', fx, y, fz + Math.sign(fz) * 0.28, W - 1.6, fh - 1.2, 0.1); else m.box('#26323f', fx + Math.sign(fx) * 0.28, y, fz, 0.1, fh - 1.2, D - 1.6);
        }
        part(h, m, { kind: 'facade', fail: L.fail, k: 0.011, shatter: [[9, 10], [3, 3]] });
      }
    }
    part(h, MG(P).box('#6a6e72', 0, fy + H + 0.2, 0, W + 0.3, 0.4, D + 0.3).box('#aeb2b6', W * 0.2, fy + H + 1.2, D * 0.1, 3.2, 1.6, 2.4).box('#9aa0a6', -W * 0.2, fy + H + 0.9, -D * 0.15, 2.2, 1.0, 2.2), { kind: 'roof', fail: 140, k: 0.008, shatter: [[1, 8], [9, 6]] });
    return h;
  }
  const lot = (x, z, w, d, yaw = 0) => stat(frameM(x, z, yaw), (m) => { m.box('#3d3f43', 0, 0.045, 0, w, 0.09, d, 0, 0, 0, 0.02); for (let i = -Math.floor(w / 6); i <= Math.floor(w / 6); i++) m.box('#d8d8d0', i * 5.5, 0.1, 0, 0.14, 0.02, d - 2); });
  const lightPole = (x, z) => { const m = new Merger(rnd); m.cyl('#6b6f74', x, 5, z, 0.14, 10).box('#d6d6c8', x, 10.1, z, 1.4, 0.2, 0.5); const b = add(body(m, { house: null, kind: 'pole', fail: 112, k: 0.004, shatter: [[0, 2]] })); b.base = new THREE.Vector3(x, 0, z); b.fail *= R(0.92, 1.1); };
  const sign = (x, z, h, w, hh, col, yaw = 0) => { const m = new Merger(rnd); m.parent = frameM(x, z, yaw); m.cyl('#6b6f74', 0, h / 2, 0, 0.3, h).box(col, 0, h + hh / 2, 0, w, hh, 0.4).box('#f4f4ee', 0, h + hh / 2, 0.22, w - 0.8, hh - 0.8, 0.05); const b = add(body(m, { house: null, kind: 'pole', fail: 95, k: 0.006, shatter: [[1, 8], [0, 4]] })); b.base = new THREE.Vector3(x, 0, z); b.fail *= R(0.92, 1.1); };

  // ---------- NE: downtown
  tower(62, 62, 0, 22, 22, 14); tower(100, 58, 0, 20, 20, 9); tower(130, 66, 0, 24, 18, 11);
  flatBuilding(66, 100, 0, 30, 16, 5, '#b9a58e', '#6a6e72'); flatBuilding(104, 100, 0, 28, 18, 6, '#a9b2b8', '#6a6e72');
  { const a = flatBuilding(66, 128, 0, 34, 14, 3, '#c9b8a0', '#5c6064'); const b = flatBuilding(120, 130, 0, 40, 14, 1, '#d9d2c3', '#8a8d90', { store: true, H: 4.4 }); part(b.h, MG(b.P).cyl('#6b6f74', 0, 4.5, 0, 0.25, 9).box('#c0392b', 0, 9.2, 0, 7.5, 2.0, 0.35), { kind: 'roof', fail: 88, k: 0.012, shatter: [[1, 6]] }); void a; }
  lot(95, 80, 100, 8, 0); lot(120, 112, 44, 14, 0); lot(66, 114, 30, 8, 0);
  for (let i = 0; i < 14; i++) car(R(40, 140), R(78, 84), Math.PI / 2 * (rnd() < 0.5 ? 1 : -1));
  for (let i = 0; i < 6; i++) car(R(100, 140), R(108, 116), rnd() < 0.5 ? 0 : Math.PI);
  { const g = flatBuilding(136, 98, 0, 11, 7, 1, '#e4e0d4', '#a13a2e', { store: true, H: 3.4, robust: 1 }); part(g.h, MG(g.P).box('#e8e8e2', 0, 5.4, 11, 18, 0.5, 9).box('#c0392b', 0, 5.2, 11, 18.1, 0.12, 9.1), { kind: 'roof', fail: 98, k: 0.013, shatter: [[1, 6], [2, 4]] }); stat(g.P, (m) => { for (const sx of [-7, 7]) for (const sz of [8, 14]) m.box('#c9c9c2', sx, 2.6, sz, 0.35, 5.2, 0.35); for (const sx of [-3.5, 3.5]) m.box('#c0392b', sx, 0.7, 11, 0.8, 1.4, 0.6); }); sign(150 - 10, 113, 11, 3, 2.4, '#2a5aa0'); }
  car(130, 107, 0); car(122, 106, Math.PI);
  // ---------- SE: big-box store with a parking lot, warehouses, rail yard, water tower
  flatBuilding(70, -60, 0, 50, 30, 2.3, '#cfc9bd', '#8a8d90', { H: 8, blank: false });
  lot(120, -64, 50, 50, 0); for (let i = 0; i < 38; i++) car(R(98, 142), R(-86, -42), Math.PI / 2 * (rnd() < 0.5 ? 1 : -1)); for (const [lx, lz] of [[100, -88], [120, -88], [140, -88], [100, -40], [120, -40], [140, -40]]) lightPole(lx, lz);
  flatBuilding(60, -126, 0, 40, 24, 2.2, '#9aa7b2', '#7b8791', { H: 8, fw: 92, fr: 88, blank: true }); flatBuilding(112, -126, 0, 36, 22, 2.2, '#a9a79a', '#7b8791', { H: 8, fw: 92, fr: 88, blank: true });
  { const m = new Merger(rnd), x = 138, z = -86; m.cyl('#cfd2d6', x, 25, z, 4.2, 5, 0, 0, 0, 0.03).cone('#9aa0a6', x, 29, z, 4.4, 3.2); add(body(m, { house: null, kind: 'tank', fail: 158, k: 0.0035, shatter: [[6, 10], [1, 4]] })); for (let i = 0; i < 4; i++) { const a = (i / 4) * 6.283 + 0.785; st.cyl('#8a8f94', x + Math.cos(a) * 3.2, 11, z + Math.sin(a) * 3.2, 0.3, 22); } st.box('#8a8f94', x, 12, z, 7, 0.3, 0.3).box('#8a8f94', x, 12, z, 0.3, 0.3, 7); blockers.push({ x, z, r: 7 }); }
  // ---------- NW: school, gym, football field, playground, church
  flatBuilding(-88, 52, 0, 62, 14, 1.3, '#a3563f', '#6a6e72', { H: 4.8, fw: 130 }); flatBuilding(-44, 56, 0, 26, 22, 2.4, '#b9b2a4', '#7b8791', { H: 9, fw: 125 });
  lot(-60, 76, 70, 12, 0); for (let i = 0; i < 14; i++) car(R(-92, -30), R(72, 80), Math.PI / 2 * (rnd() < 0.5 ? 1 : -1)); car(-70, 70, 0, '#e8b81c', true); car(-64, 70, 0, '#e8b81c', true);
  { st.parent = frameM(-88, 114, 0); st.box('#4f8f3a', 0, 0.06, 0, 100, 0.1, 58).box('#3f7f33', -44, 0.08, 0, 12, 0.1, 58).box('#3f7f33', 44, 0.08, 0, 12, 0.1, 58); for (let i = -4; i <= 4; i++) st.box('#f0f0e8', i * 10, 0.12, 0, 0.2, 0.02, 48); st.box('#f0f0e8', 0, 0.12, 24, 80, 0.02, 0.2).box('#f0f0e8', 0, 0.12, -24, 80, 0.02, 0.2); st.parent = new THREE.Matrix4(); blockers.push({ x: -88, z: 114, r: 58 });
    for (const sx of [-1, 1]) { const m = new Merger(rnd); m.parent = frameM(-88 + sx * 52, 114, 0); m.cyl('#e8c01c', 0, 3.2, 0, 0.12, 6.4).box('#e8c01c', 0, 6.4, 0, 0.1, 0.1, 5.6).box('#e8c01c', 0, 7.6, -2.8, 0.1, 2.4, 0.1).box('#e8c01c', 0, 7.6, 2.8, 0.1, 2.4, 0.1); const b = add(body(m, { house: null, kind: 'pole', fail: 92, k: 0.0035, shatter: [[0, 2]] })); b.base = new THREE.Vector3(-88 + sx * 52, 0, 114); }
    for (const sz of [-1, 1]) { const m = new Merger(rnd); m.parent = frameM(-88, 114 + sz * 33, 0); for (let i = 0; i < 5; i++) m.box(i % 2 ? '#8a9aa8' : '#6f8294', 0, 0.9 + i * 0.7, -sz * i * 0.8, 40, 0.5, 1.0); m.box('#555a60', 0, 1.2, -sz * 3.4, 40, 2.4, 0.2); add(body(m, { house: null, kind: 'bleacher', fail: 112, k: 0.006, shatter: [[0, 6], [1, 3]] })); }
    for (const [lx, lz] of [[-142, 82], [-34, 82], [-142, 146], [-34, 146]]) lightPole(lx, lz); }
  { const sw = new Merger(rnd); sw.parent = frameM(-60, 36, 0); sw.cyl('#c0392b', -2.2, 1.6, 0, 0.1, 3.2, 0, 0, 0.5).cyl('#c0392b', 2.2, 1.6, 0, 0.1, 3.2, 0, 0, -0.5).box('#c0392b', 0, 3.1, 0, 4.6, 0.12, 0.12).box('#2a5aa0', -0.7, 1.0, 0, 0.5, 0.06, 0.4).box('#2a5aa0', 0.7, 1.0, 0, 0.5, 0.06, 0.4); add(body(sw, { house: null, kind: 'bin', fail: 88, k: 0.007, shatter: [[0, 2]] })); blockers.push({ x: -60, z: 36, r: 5 });
    const sl = new Merger(rnd); sl.parent = frameM(-48, 36, 0); sl.box('#e8c01c', 0, 1.2, 0, 1.0, 0.1, 3.4, 0.62, 0, 0).box('#2a5aa0', 0, 2.2, -1.8, 1.2, 0.2, 1.2); add(body(sl, { house: null, kind: 'bin', fail: 72, k: 0.01, shatter: [[0, 2]] })); }
  { const c = buildHouse(-132, 62, -Math.PI / 2, { W: 20, D: 10, H: 5.2, rise: 3.4, civic: true, siding: '#f2efe8', roofC: '#4a4f58', robust: 1 });
    const m = c.mk(); m.box('#f2efe8', 11.7, 0.35 + 6.5, 0, 3.6, 13, 3.6).box('#4a4f58', 11.7, 0.35 + 13.9, 0, 4.0, 0.3, 4.0).cone('#4a4f58', 11.7, 0.35 + 17, 0, 2.4, 6.2); c.part(m, { kind: 'steeple', fail: 118, k: 0.005, shatter: [[0, 5], [3, 5], [2, 6]] }); }
  // ---------- SW: mobile home park (very vulnerable), then the farm south of the tracks
  stat(new THREE.Matrix4(), (m) => { m.box('#4a4c50', -90, 0.045, -53, 100, 0.09, 6).box('#4a4c50', -90, 0.045, -77, 100, 0.09, 6); });
  for (let row = 0; row < 3; row++) for (let i = 0; i < 5; i++) {
    const x = -130 + i * 21 + R(-1, 1), z = -45 - row * 16 - (row === 2 ? 4 : 0), P = frameM(x, z, 0), m = MG(P), col = pick(['#e8e4d8', '#cfd6dc', '#d9cdb0', '#b8c4b0', '#c9b8b0']), h = newStruct(x, z, 14, 3.6, 1);
    m.box(col, 0, 1.6, 0, 14, 2.6, 3.6).box('#7a7f84', 0, 3.0, 0, 14.4, 0.18, 4.0).box('#5a5e63', 0, 0.6, 0, 14.2, 0.5, 3.4).box(GLASS, -3.5, 1.9, 1.84, 1.5, 1.0, 0.08).box(GLASS, 1.5, 1.9, 1.84, 1.5, 1.0, 0.08).box(GLASS, 4.5, 1.9, 1.84, 1.5, 1.0, 0.08).box('#6a3d2a', -6, 1.4, 1.84, 0.9, 1.9, 0.1);
    part(h, m, { kind: 'mobile', fail: 80, k: 0.0105, shatter: [[3, 10], [1, 6], [0, 4]] }); blockers.push({ x, z, r: 9 });
    if (rnd() < 0.5) car(x + 9, z + 5, R(-0.2, 0.2));
  }
  // railway across the whole map with a parked freight train
  stat(new THREE.Matrix4(), (m) => { m.box('#6a6258', 0, 0.12, -100, EXT, 0.2, 4.4); for (let i = -255; i <= 255; i += 2) m.box('#4a3f36', i, 0.18, -100, 0.5, 0.16, 3.2); m.box('#8a8f94', 0, 0.3, -99.2, EXT, 0.16, 0.14).box('#8a8f94', 0, 0.3, -100.8, EXT, 0.16, 0.14); });
  for (let i = 0; i < 9; i++) {
    const x = -22 - i * 13.5, m = new Merger(rnd); m.parent = frameM(x, -100, Math.PI / 2);
    if (i === 0) m.box('#2a2a2e', 0, 2.2, 0, 3.2, 3.6, 16).box('#a02828', 0, 2.2, -2, 3.3, 1.4, 12).box('#2a2a2e', 0, 4.4, 5, 3.0, 1.4, 4); else m.box(pick(['#8a3a2a', '#3a5a7a', '#6a6a60', '#5a7a4a', '#7a6a2a']), 0, 2.55, 0, 3.0, 3.0, 12.5).box('#4a4a4e', 0, 1.0, 0, 2.6, 0.5, 12.6).box('#33363a', 0, 4.15, 0, 3.1, 0.2, 12.6);
    const b = add(body(m, { house: null, kind: 'boxcar', fail: 148, k: 0.0042, friction: 0.12, shatter: i ? [[1, 8], [0, 4]] : [[6, 6]] })); b.fail *= R(0.94, 1.06);
  }
  // farm: barn, silos, farmhouse, hay bales, windmill, fields
  buildHouse(-60, -128, Math.PI, { W: 22, D: 12, H: 5.5, rise: 4.2, civic: true, siding: '#9b3a2f', roofC: '#6c7075', robust: 0.85 });
  for (const sx of [-92, -98]) { const m = new Merger(rnd); m.cyl('#c7c9cc', sx, 8, -128, 2.8, 16, 0, 0, 0, 0.04).cone('#9aa0a6', sx, 17.4, -128, 3.0, 2.4); add(body(m, { house: null, kind: 'silo', fail: 150, k: 0.0035, shatter: [[6, 14]] })); blockers.push({ x: sx, z: -128, r: 4 }); }
  buildHouse(-122, -128, Math.PI / 2, {}); 
  for (let i = 0; i < 10; i++) { const m = new Merger(rnd), x = R(-110, -70), z = R(-118, -108); m.cyl('#c9a94a', x, 0.8, z, 0.9, 1.6, Math.PI / 2, 0, 0, 0.1); add(body(m, { house: null, kind: 'bale', fail: 0, k: 0.012, loose: true, friction: 0.3, shatter: [] })); }
  { const m = new Merger(rnd), x = -34, z = -132; m.cyl('#8a8f94', x, 7, z, 0.25, 14).box('#d9d9d4', x, 14.2, z, 0.2, 4.8, 0.5).box('#d9d9d4', x, 14.2, z, 4.8, 0.2, 0.5).box('#aaa', x, 14.2, z + 0.4, 0.6, 0.6, 0.8); const b = add(body(m, { house: null, kind: 'pole', fail: 100, k: 0.0045, shatter: [[0, 4], [1, 2]] })); b.base = new THREE.Vector3(x, 0, z); }
  for (const [fx, fz, w, d, c] of [[-215, -50, 80, 70, '#7da34a'], [-215, 40, 80, 70, '#c9b45a'], [-215, 120, 80, 70, '#6b8f3a'], [215, 20, 80, 70, '#8a6b3c'], [215, -70, 80, 70, '#7da34a'], [215, 100, 80, 70, '#c9b45a'], [-60, 215, 90, 60, '#6b8f3a'], [60, 215, 90, 60, '#7da34a'], [-100, -215, 90, 60, '#c9b45a'], [100, -215, 90, 60, '#8a6b3c'], [-215, -150, 60, 60, '#c9b45a']]) { st.box(c, fx, 0.04, fz, w, 0.08, d, 0, 0, 0, 0.04); for (let i = -Math.floor(w / 8); i <= Math.floor(w / 8); i++) st.box('rgba(0,0,0,0)' === c ? c : '#5f7f35', fx + i * 7, 0.07, fz, 0.8, 0.02, d - 4, 0, 0, 0, 0.1); blockers.push({ x: fx, z: fz, r: Math.max(w, d) * 0.55 }); }
  // billboards along the roads leading out of town
  sign(-196, 12, 12, 12, 5, '#2a5aa0'); sign(196, -12, 12, 12, 5, '#c0392b', Math.PI); sign(12, 196, 12, 12, 5, '#2f7a4a', Math.PI / 2); sign(-12, -196, 12, 12, 5, '#d9a21b', -Math.PI / 2);
  // streetside bins & a few cars parked on the road
  for (let i = 0; i < 4; i++) { const arm = pick(arms), s = pick([-1, 1]), d = R(30, 100); if (arm.dx) car(arm.dx * d, s * 3.1, arm.dx > 0 ? Math.PI / 2 : -Math.PI / 2); else car(s * 3.1, arm.dz * d, arm.dz > 0 ? 0 : Math.PI); }
  // utility poles along both streets
  for (const v of [-245, -205, -165, -125, -85, -45, 45, 85, 125, 165, 205, 245]) for (const ax of [0, 1]) {
    const m = new Merger(rnd), x = ax ? 8.6 : v, z = ax ? v : 8.6;
    m.cyl('#6b4f36', x, 4.6, z, 0.17, 9.2, 0, 0, 0, 0.05).box('#5a4430', x, 8.7, z, ax ? 2.2 : 0.14, 0.14, ax ? 0.14 : 2.2).box('#4a3a2a', x, 7.9, z, ax ? 1.6 : 0.12, 0.12, ax ? 0.12 : 1.6);
    const b = add(body(m, { house: null, kind: 'pole', fail: 104, k: 0.003, shatter: [[0, 6]] })); b.base = new THREE.Vector3(x, 0, z); b.fail *= R(0.9, 1.1);
  }
  // trees: scattered through the yards, never on the road or on a house
  const trees = []; let tries = 0;
  while (trees.length < 150 && tries++ < 2400) {
    const x = R(-255, 255), z = R(-255, 255);
    if (STREETS.some((c) => Math.abs(x - c) < 11 || Math.abs(z - c) < 11) || Math.abs(z + 100) < 6) continue;
    if (blockers.some((b) => Math.hypot(b.x - x, b.z - z) < b.r + 1.5) || trees.some((t) => Math.hypot(t.x - x, t.z - z) < 6)) continue;
    trees.push({ x, z });
    const conifer = rnd() < 0.3, h = conifer ? R(7, 11) : R(6, 10), m = new Merger(rnd);
    m.cyl('#5d4631', x, h * 0.25, z, conifer ? 0.2 : R(0.25, 0.4), h * 0.5, 0, 0, 0, 0.08);
    if (conifer) { for (let i = 0; i < 4; i++) m.cone('#27502f', x, h * (0.35 + i * 0.17) + 1, z, (4 - i) * 0.85 + 0.6, h * 0.34, 0.1); }
    else { const c = pick(['#4e8a3a', '#5a9440', '#468034', '#6a9a3c']); m.ico(c, x, h * 0.72, z, R(2.6, 3.6), R(2.2, 3.0), R(2.6, 3.6), 0.1).ico(c, x + R(-1.5, 1.5), h * 0.6, z + R(-1.5, 1.5), 2.0, 1.8, 2.0, 0.1).ico(c, x + R(-1.5, 1.5), h * 0.85, z + R(-1.5, 1.5), 1.8, 1.6, 1.8, 0.1); }
    const b = add(body(m, { house: null, kind: 'tree', fail: (conifer ? 118 : 100) * R(0.92, 1.1), k: 0.006, leaf: !conifer, shatter: [[8, 6], [4, 14]] })); b.base = new THREE.Vector3(x, 0, z); b.phase = R(0, 6.28);
  }
  const statics = new THREE.Mesh(st.geometry(), MATERIAL); statics.receiveShadow = true; scene.add(statics);
  for (const b of bodies) { b.q0.copy(b.mesh.quaternion); if (b.base) b.pivot = b.pos0.clone().sub(b.base); }
  return { bodies, houses, statics };
}
