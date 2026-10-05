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
  st.box('#3a3c40', 0, 0.04, 0, 300, 0.08, 12, 0, 0, 0, 0.02); st.box('#3a3c40', 0, 0.04, 0, 12, 0.08, 300, 0, 0, 0, 0.02);
  for (let i = -145; i <= 145; i += 8) { if (Math.abs(i) < 8) continue; st.box('#e8d36a', i, 0.09, 0, 3.6, 0.02, 0.18); st.box('#e8d36a', 0, 0.09, i, 0.18, 0.02, 3.6); }
  for (const s of [-1, 1]) {
    st.box('#b9b7b0', 0, 0.06, s * 7.4, 300, 0.12, 2.4, 0, 0, 0, 0.02); st.box('#b9b7b0', s * 7.4, 0.06, 0, 2.4, 0.12, 300, 0, 0, 0, 0.02);
  }
  // ---- houses: 3 on each side of each of the 4 street arms
  const arms = [{ dx: 1, dz: 0 }, { dx: -1, dz: 0 }, { dx: 0, dz: 1 }, { dx: 0, dz: -1 }];
  for (const arm of arms) for (const side of [-1, 1]) for (const dist of [34, 64, 94]) {
    const off = 20.5, x = arm.dx * dist + (arm.dz ? side * off : 0), z = arm.dz * dist + (arm.dx ? side * off : 0);
    // the front of the house faces the street
    const fx = arm.dz ? -side : 0, fz = arm.dx ? -side : 0, yaw = Math.atan2(fx, fz);
    buildHouse(x + R(-1.5, 1.5) * (arm.dx ? 1 : 0), z + R(-1.5, 1.5) * (arm.dz ? 1 : 0), yaw);
  }
  function buildHouse(x, z, yaw) {
    const W = R(10.5, 13), D = R(8.2, 10), H = 3.0, fy = 0.35, rise = 2.5, t = 0.3, robust = R(0.9, 1.2);
    const siding = pick(SIDING), roofC = pick(ROOFS), doorC = pick(DOOR), house = { x, z, robust, parts: [], damaged: false, roofGone: false, wallGone: false, W, D };
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
    mk2(mk().box('#ece9e2', -W / 2 + 2.25, fy + 1.15, D / 2 + 0.14, 3.5, 2.3, 0.12).box('#c9c6bd', -W / 2 + 2.25, fy + 1.15, D / 2 + 0.21, 3.2, 0.06, 0.04).box('#c9c6bd', -W / 2 + 2.25, fy + 1.6, D / 2 + 0.21, 3.2, 0.06, 0.04).box('#c9c6bd', -W / 2 + 2.25, fy + 0.7, D / 2 + 0.21, 3.2, 0.06, 0.04), { kind: 'garage', fail: 82, k: 0.02, shatter: [[1, 8], [3, 3]] });
    // roof: two sloped halves
    const run = D / 2 + 0.7, L = Math.hypot(run, rise), a = Math.atan2(rise, run);
    for (const s of [-1, 1]) {
      mk2(mk().box(roofC, 0, fy + H + rise / 2 - 0.05, s * run / 2, W + 1.1, 0.2, L, s * a, 0, 0, 0.1).box('#2c2c30', 0, fy + H + rise + 0.02, 0, W + 1.1, 0.25, 0.35, 0, 0, 0, 0.02), { kind: 'roof', fail: 100, k: 0.014, shatter: [[2, 14], [0, 4], [1, 3]] });
    }
    mk2(mk().box(BRICK, W * 0.28, fy + H + rise * 0.5 + 0.6, -D * 0.15, 0.95, rise + 1.7, 0.95, 0, 0, 0, 0.1).box('#6b5a50', W * 0.28, fy + H + rise + 1.5, -D * 0.15, 1.15, 0.18, 1.15), { kind: 'chimney', fail: 108, k: 0.004, shatter: [[6, 10]] });
    // furniture inside (shows once the walls are gone)
    mk2(mk().box('#6f4e3a', -W * 0.2, fy + 0.5, 0.5, 2.4, 0.9, 1.0).box('#6f4e3a', -W * 0.2, fy + 0.95, 0.15, 2.4, 0.6, 0.3), { kind: 'furn', fail: 160, k: 0.005, shatter: [[0, 4]] });
    mk2(mk().box('#8a6a46', W * 0.15, fy + 0.45, -1.2, 1.6, 0.08, 1.0).box('#8a6a46', W * 0.15 - 0.6, fy + 0.2, -1.5, 0.1, 0.4, 0.1).box('#8a6a46', W * 0.15 + 0.6, fy + 0.2, -0.9, 0.1, 0.4, 0.1), { kind: 'furn', fail: 160, k: 0.006, shatter: [[0, 3]] });
    houses.push(house);
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
  }
  function car(x, z, yaw) {
    const col = pick(CARS), P = new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, yaw, 0)), new THREE.Vector3(1, 1, 1));
    const m = new Merger(rnd); m.parent = P; const big = rnd() < 0.3;
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
  // streetside bins & a few cars parked on the road
  for (let i = 0; i < 4; i++) { const arm = pick(arms), s = pick([-1, 1]), d = R(30, 100); if (arm.dx) car(arm.dx * d, s * 3.1, arm.dx > 0 ? Math.PI / 2 : -Math.PI / 2); else car(s * 3.1, arm.dz * d, arm.dz > 0 ? 0 : Math.PI); }
  // utility poles along both streets
  for (const v of [-125, -85, -45, 45, 85, 125]) for (const ax of [0, 1]) {
    const m = new Merger(rnd), x = ax ? 8.6 : v, z = ax ? v : 8.6;
    m.cyl('#6b4f36', x, 4.6, z, 0.17, 9.2, 0, 0, 0, 0.05).box('#5a4430', x, 8.7, z, ax ? 2.2 : 0.14, 0.14, ax ? 0.14 : 2.2).box('#4a3a2a', x, 7.9, z, ax ? 1.6 : 0.12, 0.12, ax ? 0.12 : 1.6);
    const b = add(body(m, { house: null, kind: 'pole', fail: 104, k: 0.003, shatter: [[0, 6]] })); b.base = new THREE.Vector3(x, 0, z); b.fail *= R(0.9, 1.1);
  }
  // trees: scattered through the yards, never on the road or on a house
  const trees = []; let tries = 0;
  while (trees.length < 62 && tries++ < 800) {
    const x = R(-132, 132), z = R(-132, 132);
    if (Math.abs(x) < 12 || Math.abs(z) < 12) continue;
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
