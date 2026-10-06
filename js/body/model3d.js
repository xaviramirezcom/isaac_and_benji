// The 3D body: a glassy child-shaped shell and procedural organs (no downloaded models). 1 unit = 100 px of the 2D body, origin at the belly,
// so every organ sits exactly where the flat one does. Each organ is built as outer group (positioned, popped in) > inner group (beats / breathes) > meshes.
import * as THREE from '../../vendor/three.module.min.js';
import { SHAPES, OUT, IN, ARM_OUT, ARM_IN } from './shapes.js';

const X = (x) => (x - 150) / 100, Y = (y) => (320 - y) / 100;
const Z = { brain: 0, lungs: 0.02, heart: 0.12, liver: 0.07, stomach: 0.09, kidneys: -0.2, smallint: 0.03, largeint: 0, bladder: 0.02 };
const std = (color, rough = 0.5) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0, emissive: new THREE.Color(color).multiplyScalar(0.12) });
const mesh = (geo, mat) => { const m = new THREE.Mesh(geo, mat); return m; };
const sph = (rx, ry, rz, mod) => {   // a squashed sphere whose vertices can be bent by `mod(p)` (p = unit-sphere position, modified in place)
  const g = new THREE.SphereGeometry(1, 48, 36), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); mod?.(v); p.setXYZ(i, v.x * rx, v.y * ry, v.z * rz); }
  g.computeVertexNormals(); return g;
};
function tube(points, radius, segs, ringMod) {   // a tube along a smooth path, optionally pinched into rings (the big gut)
  const curve = new THREE.CatmullRomCurve3(points), g = new THREE.TubeGeometry(curve, segs, radius, 14, false);
  if (ringMod) { const p = g.attributes.position, per = 15, v = new THREE.Vector3(), c = new THREE.Vector3(); for (let i = 0; i < p.count; i++) { const j = Math.floor(i / per) / segs; curve.getPointAt(Math.min(1, j), c); v.fromBufferAttribute(p, i).sub(c).multiplyScalar(ringMod(j)).add(c); p.setXYZ(i, v.x, v.y, v.z); } g.computeVertexNormals(); }
  return g;
}
const pts = (arr, z = 0) => arr.map(([x, y], i) => new THREE.Vector3(x / 100, -y / 100, typeof z === 'function' ? z(i) : z));

// ---------------------------------------------------------------- the organs
const BUILD = {
  brain() {
    const g = sph(0.38, 0.29, 0.33, (v) => {
      const b = 0.055 * (Math.sin(v.x * 13) * Math.sin(v.y * 11 + 1) + Math.sin(v.z * 12 + 2) * Math.sin(v.x * 9 + v.y * 5));
      v.multiplyScalar(1 + b); if (v.y > 0.1) v.multiplyScalar(1 - 0.1 * Math.exp(-(v.x * v.x) / 0.012)); if (v.y < -0.4) v.y = -0.4 + (v.y + 0.4) * 0.4;
    });
    return [mesh(g, std(0xf4a6c8, 0.62))];
  },
  heart() {
    const s = new THREE.Shape();
    s.moveTo(0, -0.18); s.bezierCurveTo(-0.32, 0.02, -0.24, 0.24, -0.09, 0.21); s.bezierCurveTo(-0.03, 0.2, 0, 0.15, 0, 0.12); s.bezierCurveTo(0, 0.15, 0.03, 0.2, 0.09, 0.21); s.bezierCurveTo(0.24, 0.24, 0.32, 0.02, 0, -0.18);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.1, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.05, bevelSegments: 6, curveSegments: 20 }); g.translate(0, 0, -0.05); g.computeVertexNormals();
    const red = std(0xe63946, 0.35), a = mesh(g, red);
    const v1 = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.22, 10), std(0xd7303c, 0.4)), v2 = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.2, 10), std(0x5b87d9, 0.4));
    v1.position.set(-0.04, 0.27, 0); v1.rotation.z = 0.25; v2.position.set(0.09, 0.26, -0.03); v2.rotation.z = -0.3;
    return [a, v1, v2];
  },
  lungs() {
    const lungMat = std(0xff9b9b, 0.55), out = [];
    for (const s of [-1, 1]) {
      const m = mesh(sph(0.2, 0.37, 0.16, (v) => { v.x *= 0.6 + 0.4 * (1 - v.y) / 2; if (v.x * s > 0) v.x *= 0.85; v.y *= v.y > 0.6 ? 0.92 : 1; }), lungMat);
      m.position.set(s * 0.27, -0.01, 0); m.rotation.z = -s * 0.08; out.push(m);
      const br = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.2, 8), std(0xf3b6bd, 0.5)); br.position.set(s * 0.07, 0.1, 0); br.rotation.z = s * 0.9; out.push(br);
    }
    const tr = mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.34, 10), std(0xf3b6bd, 0.5)); tr.position.set(0, 0.3, 0); out.push(tr);
    return out;
  },
  liver() {
    const g = sph(0.37, 0.19, 0.23, (v) => { const t = Math.max(0, v.x); v.y *= 1 - 0.5 * t * t; v.z *= 1 - 0.25 * t; if (v.y < -0.3) v.y = -0.3 + (v.y + 0.3) * 0.5; });
    const m = mesh(g, std(0xb5683f, 0.5)); m.rotation.z = 0.12; return [m];
  },
  stomach() {
    const g = sph(0.25, 0.27, 0.17, (v) => { v.x *= 1 + 0.18 * v.y; v.x += 0.1 * v.y * v.y; });
    const m = mesh(g, std(0xf2a65a, 0.5)); m.rotation.z = -0.5;
    const e = mesh(tube(pts([[-10, -22], [-13, -34], [-14, -46]]), 0.035, 12), std(0xf7c08a, 0.5));
    return [m, e];
  },
  kidneys() {
    return [-1, 1].map((s) => {
      const m = mesh(sph(0.1, 0.16, 0.08, (v) => { const dent = Math.exp(-(v.y * v.y) / 0.12) * Math.max(0, -s * v.x); v.x += s * dent * 0.7; }), std(0xb24a45, 0.45));
      m.position.set(s * 0.32, 0, 0); m.rotation.z = s * 0.15; return m;
    });
  },
  smallint() {   // rows of wavy gut, like the flat one
    const P = [];
    for (let r = 0; r < 5; r++) {
      const dir = r % 2 ? -1 : 1, y0 = 0.2 - r * 0.13;
      for (let k = 0; k <= 24; k++) { const t = k / 24; P.push(new THREE.Vector3(dir * (-0.34 + 0.68 * t), y0 + 0.035 * Math.sin(t * Math.PI * 4), 0.02 * Math.cos(t * Math.PI * 4 + r))); }
      if (r < 4) for (let j = 1; j <= 5; j++) { const a = -Math.PI / 2 + Math.PI * j / 6; P.push(new THREE.Vector3(dir * (0.34 + 0.065 * Math.cos(a)), y0 - 0.065 * (1 + Math.sin(a)), 0)); }
    }
    return [mesh(tube(P, 0.052, 520, (u) => 1 + 0.06 * Math.sin(u * 90)), std(0xf0907f, 0.4))];
  },
  largeint() {
    const P = pts([[-40, 36], [-46, 28], [-46, -20], [-40, -31], [-20, -26], [0, -22], [20, -26], [40, -31], [46, -22], [46, 20], [40, 38], [24, 42], [14, 30], [6, 26], [0, 36]], (i) => 0.02 * Math.sin(i));
    return [mesh(tube(P, 0.075, 300, (u) => 0.88 + 0.16 * Math.abs(Math.sin(u * Math.PI * 14))), std(0xd18a5a, 0.5))];
  },
  bladder() { return [mesh(sph(0.14, 0.16, 0.14, (v) => { if (v.y > 0.7) v.multiplyScalar(0.9); }), std(0xf6d365, 0.3))]; },
};

// a smooth body part lofted from horizontal elliptical slices (no seam: the last column wraps to the first)
function loft(rings, seg = 40) {
  const pos = [], idx = [];
  rings.forEach((r) => { for (let j = 0; j < seg; j++) { const a = j / seg * Math.PI * 2; pos.push(r.cx + r.rx * Math.cos(a), r.y, r.rz * Math.sin(a)); } });
  for (let i = 0; i < rings.length - 1; i++) for (let j = 0; j < seg; j++) { const a = i * seg + j, b = i * seg + (j + 1) % seg, c = (i + 1) * seg + j, d = (i + 1) * seg + (j + 1) % seg; idx.push(a, c, b, b, c, d); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); return g;
}
// ---------------------------------------------------------------- the whole body
export function buildBody() {
  const root = new THREE.Group(), shell = new THREE.Group(), organs = {}, ghosts = {};
  const shellMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: {},
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0), 2.2); vec3 c = mix(vec3(0.78, 0.91, 0.98), vec3(0.34, 0.66, 0.86), f); gl_FragColor = vec4(c, 0.16 + 0.5 * f); }',
  });
  const part = (geo, x, y, z = 0, rz = 0, sx = 1, sy = 1, sz = 1) => { const m = new THREE.Mesh(geo, shellMat); m.position.set(x, y, z); m.rotation.z = rz; m.scale.set(sx, sy, sz); m.renderOrder = 5; shell.add(m); return m; };
  part(new THREE.SphereGeometry(1, 48, 32), 0, 2.5, 0.0, 0, 0.44, 0.56, 0.47);                         // head
  const at = (pl, y) => { for (let i = 0; i < pl.length - 1; i++) { const [x0, y0] = pl[i], [x1, y1] = pl[i + 1]; if ((y >= y0 && y <= y1) || (y >= y1 && y <= y0)) return y1 === y0 ? x0 : x0 + (x1 - x0) * (y - y0) / (y1 - y0); } return pl[pl.length - 1][0]; };
  const IN_UP = IN.slice().reverse();                                                                    // inner leg, top to bottom
  const ring = (y, cx, rx, rz) => ({ y: (320 - y) / 100, cx: cx / 100, rx: rx / 100, rz: rz / 100 });
  const torso = [], sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  for (let y = 110; y <= 362; y += 6) { const w = y < 118 ? 16 : at(OUT.filter((p) => p[1] <= 360), Math.min(y, 358)) * (y > 360 ? 1 + (y - 360) / 400 : 1), f = 1 - 0.38 * sm(140, 200, y) + 0.08 * sm(280, 360, y); torso.push(ring(y, 0, w, w * f)); }
  const capped = (r) => [{ ...r[0], rx: r[0].rx * 0.1, rz: r[0].rz * 0.1, y: r[0].y + 0.04 }, ...r, { ...r[r.length - 1], rx: r[r.length - 1].rx * 0.1, rz: r[r.length - 1].rz * 0.1, y: r[r.length - 1].y - 0.04 }];
  const lofted = (rings) => { const m = new THREE.Mesh(loft(capped(rings)), shellMat); m.renderOrder = 5; shell.add(m); };
  lofted(torso);
  for (const sgn of [-1, 1]) {
    const leg = []; for (let y = 338; y <= 610; y += 6) { const o = at(OUT.filter((p) => p[1] >= 340), y), i = at(IN_UP, Math.max(y, 386)); leg.push(ring(y, sgn * (o + i) / 2, (o - i) / 2, (o - i) / 2 * 1.05)); }
    const l = loft(capped(leg)); const m = new THREE.Mesh(l, shellMat); m.renderOrder = 5; shell.add(m);
    const arm = []; for (let y = 158; y <= 346; y += 6) { const o = at(ARM_OUT, y), i = at(ARM_IN, y); arm.push(ring(y, sgn * (o + i) / 2, (o - i) / 2 + 1, (o - i) / 2 + 1)); }
    const am = new THREE.Mesh(loft(capped(arm)), shellMat); am.renderOrder = 5; shell.add(am);
    part(new THREE.SphereGeometry(1, 20, 14), sgn * 0.9, 0.0 - 0.42, 0, sgn * 0.05, 0.13, 0.27, 0.1);              // hands
    part(new THREE.SphereGeometry(1, 20, 14), sgn * 0.3, -3.0, 0.1, 0, 0.2, 0.1, 0.3);                           // feet
    part(new THREE.SphereGeometry(1, 20, 14), sgn * 0.62, 1.62, 0, 0, 0.17, 0.17, 0.17);                         // shoulders
  }
  // a friendly face (opaque, so it is always there)
  const dark = new THREE.MeshBasicMaterial({ color: 0x2f5d7a });
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.045, 14, 10), dark); e.position.set(s * 0.16, 2.3, 0.4); e.scale.z = 0.5; shell.add(e); }
  const mo = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.014, 8, 24, Math.PI), dark); mo.rotation.z = Math.PI; mo.position.set(0, 2.26, 0.385); shell.add(mo);
  root.add(shell);

  const ghostMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.NormalBlending });
  for (const id of Object.keys(SHAPES)) {
    const sl = SHAPES[id].slot, outer = new THREE.Group(), inner = new THREE.Group();
    BUILD[id]().forEach((m) => inner.add(m)); outer.add(inner); outer.userData = { id, inner }; outer.position.set(X(sl.x), id === 'brain' ? 2.6 : Y(sl.y), Z[id]); outer.scale.setScalar(id === 'brain' ? 0.8 : sl.s); outer.visible = false; root.add(outer); organs[id] = outer;
    const gh = new THREE.Group(); gh.position.copy(outer.position); gh.scale.copy(outer.scale);
    const gm = ghostMat.clone(); inner.traverse((o) => { if (o.isMesh) { const c = new THREE.Mesh(o.geometry, gm); c.position.copy(o.position); c.rotation.copy(o.rotation); c.scale.copy(o.scale); c.renderOrder = 4; gh.add(c); } });
    gh.userData = { mat: gm }; gh.renderOrder = 4; root.add(gh); ghosts[id] = gh;
  }
  return { root, shell, organs, ghosts, slot: (id) => organs[id].position };
}

// the heart beats, the lungs breathe (only the ones that are in the body)
export function pulse(organs, t) {
  const b = Math.max(0, Math.sin(t * 7.5)) ** 4 * 0.9 + Math.max(0, Math.sin(t * 7.5 - 1.1)) ** 4 * 0.4;
  organs.heart.userData.inner.scale.setScalar(1 + 0.07 * b);
  organs.lungs.userData.inner.scale.set(1 + 0.03 * Math.sin(t * 1.5), 1 + 0.05 * Math.sin(t * 1.5), 1 + 0.03 * Math.sin(t * 1.5));
}
