// The human body, built by hand in code (no downloaded models): a lofted body with arms, legs, hands and head, a faint skeleton,
// and ten organs modelled from anatomy — folded brain, four-chambered heart with its vessels, lobed lungs with the airway, liver with gallbladder,
// J-shaped stomach, pancreas, kidneys with ureters, coiled small intestine, framing large intestine with haustra, bladder.
// Everything is built in metres around the middle of the body, then turned into scene units (SCALE).
// Every organ is built around its own centre, so it sits exactly where it lives and can be lifted out and put back.
import * as THREE from '../../vendor/three.module.min.js';
import { noise, fbm, ridged, smooth, gauss, hex, mix3, sweep, blob, ellipsoid, merge, solid, interpRows, surfaceNets } from './gen.js';

export const SCALE = 3.35;
export const ORGANS = ['brain', 'heart', 'lungs', 'stomach', 'pancreas', 'liver', 'kidneys', 'smallint', 'largeint', 'bladder'];
const keyed = (keys) => (t) => { for (let i = 0; i < keys.length - 1; i++) if (t <= keys[i + 1][0]) { const a = keys[i], b = keys[i + 1], k = (t - a[0]) / (b[0] - a[0] || 1), s = k * k * (3 - 2 * k); return Array.isArray(a[1]) ? a[1].map((v, j) => v + (b[1][j] - v) * s) : a[1] + (b[1] - a[1]) * s; } return keys[keys.length - 1][1]; };
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ================================================================= the skin: ONE seamless surface (smooth unions of head/neck/torso, arms, hands, legs and feet, meshed together)
const ROWS = [[0.915, 0.012, 0.012, 0], [0.905, 0.05, 0.06, -0.004], [0.885, 0.076, 0.088, -0.004], [0.86, 0.087, 0.1, 0], [0.83, 0.089, 0.104, 0.004], [0.8, 0.085, 0.1, 0.01], [0.78, 0.074, 0.09, 0.014], [0.76, 0.057, 0.076, 0.018], [0.745, 0.047, 0.062, 0.012], [0.73, 0.05, 0.058, -0.004], [0.71, 0.055, 0.06, -0.008],
  [0.69, 0.105, 0.068, -0.01], [0.668, 0.185, 0.082, -0.01], [0.64, 0.205, 0.094, 0], [0.6, 0.186, 0.104, 0.006], [0.55, 0.172, 0.112, 0.012], [0.5, 0.168, 0.116, 0.016], [0.45, 0.164, 0.114, 0.015], [0.4, 0.156, 0.108, 0.013], [0.3, 0.147, 0.1, 0.011], [0.22, 0.145, 0.098, 0.01], [0.12, 0.158, 0.102, 0.006], [0.04, 0.172, 0.108, 0], [-0.02, 0.172, 0.108, -0.004], [-0.07, 0.15, 0.1, -0.004], [-0.095, 0.09, 0.07, -0.004]];
const STEP = 0.002, TOP = 0.915, TAB = []; for (let y = TOP; y >= -0.0951; y -= STEP) TAB.push(interpRows(ROWS, y));
const smin = (a, b, k) => { const h = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - h * h * k * 0.25; };
const seg = (px, py, pz, a, b) => { const bx = b[0] - a[0], by = b[1] - a[1], bz = b[2] - a[2], ax = px - a[0], ay = py - a[1], az = pz - a[2], t = Math.min(1, Math.max(0, (ax * bx + ay * by + az * bz) / (bx * bx + by * by + bz * bz))); return Math.hypot(ax - bx * t, ay - by * t, az - bz * t) - (a[3] + (b[3] - a[3]) * t); };
const chain = (px, py, pz, pts) => { let d = 1e9; for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, seg(px, py, pz, pts[i], pts[i + 1])); return d; };
const ell = (px, py, pz, c, r) => { const x = (px - c[0]) / r[0], y = (py - c[1]) / r[1], z = (pz - c[2]) / r[2]; return (Math.hypot(x, y, z) - 1) * Math.min(r[0], r[1], r[2]); };
const ARM = [[0.165, 0.655, 0, 0.064], [0.212, 0.585, 0, 0.058], [0.243, 0.46, 0.002, 0.048], [0.262, 0.34, 0.004, 0.041], [0.28, 0.22, 0.012, 0.043], [0.298, 0.11, 0.02, 0.029], [0.306, 0.07, 0.022, 0.024]];
const LEG = [[0.095, 0.04, 0, 0.102], [0.093, -0.1, 0.005, 0.092], [0.087, -0.28, 0.008, 0.08], [0.076, -0.46, 0.01, 0.057], [0.07, -0.55, 0, 0.06], [0.068, -0.64, -0.012, 0.066], [0.058, -0.76, -0.005, 0.041], [0.047, -0.84, -0.004, 0.033], [0.047, -0.875, -0.004, 0.032]];
const FOOT = [[0.05, -0.872, -0.02, 0.034], [0.054, -0.892, 0.1, 0.021]];
function bodySDF(px, py, pz) {
  const x = Math.abs(px), y = py, z = pz;
  // head, neck and trunk (a stack of rounded cross-sections)
  const i = Math.min(TAB.length - 1, Math.max(0, Math.round((TOP - y) / STEP))), r = TAB[i], ax = x;
  let hw = r[0] + 0.012 * gauss(y - 0.66, 0.03), hd = r[1];
  if (z > 0.03) hd += 0.016 * gauss(y - 0.545, 0.04) * gauss(ax - 0.078, 0.045) + 0.004 * gauss(y - 0.4, 0.1) * gauss(ax - 0.02, 0.02);
  if (z < -0.02) hd += 0.009 * gauss(y - 0.57, 0.06) * gauss(ax - 0.09, 0.05) + 0.006 * gauss(y - 0.35, 0.12) * gauss(ax - 0.04, 0.03);
  const q = Math.pow(ax / hw, 2.4) + Math.pow(Math.abs(z - r[2]) / hd, 2.4), dxz = (Math.pow(q, 1 / 2.4) - 1) * Math.min(hw, hd), dy = Math.max(y - TOP, -0.0951 - y, 0);
  let d = dy > 0 ? Math.hypot(Math.max(dxz, 0), dy) : dxz;
  d = smin(d, chain(x, y, z, ARM), 0.04);                                   // shoulders melt into the arms
  d = smin(d, ell(x, y, z, [0.309, 0.032, 0.022], [0.033, 0.05, 0.016]), 0.012);   // the hand: palm,
  d = smin(d, ell(x, y, z, [0.309, -0.012, 0.027], [0.03, 0.052, 0.013]), 0.012);  // fingers together,
  d = smin(d, seg(x, y, z, [0.284, 0.07, 0.03, 0.011], [0.268, 0.01, 0.05, 0.009]), 0.01);   // and the thumb
  d = smin(d, chain(x, y, z, LEG), 0.05);                                   // hips melt into the legs
  d = smin(d, chain(x, y, z, FOOT), 0.025);                                 // and the legs into the feet
  d = smin(d, ell(x, y, z, [0.087, 0.822, -0.004], [0.007, 0.027, 0.018]), 0.01);   // ears
  d = smin(d, ell(x, y, z, [0, 0.806, 0.1], [0.01, 0.024, 0.018]), 0.012);          // nose
  return d;
}
function bodySkin() { return surfaceNets(bodySDF, [-0.4, -0.935, -0.15], [0.4, 0.93, 0.16], 0.0072); }

// ================================================================= the skeleton (faint: ribs, breastbone, spine, pelvis)
const BONE = hex('#e6dac0'), CART = hex('#d3cdc0');
function skeleton() {
  const parts = [];
  for (let k = 0; k < 12; k++) for (const s of [-1, 1]) {
    const y0 = 0.625 - k * 0.0345, hw = 0.135 - Math.abs(k - 3) * 0.004 - (k > 8 ? 0.012 : 0), hd = 0.085, pts = [], len = k < 10 ? 1 : 0.55 - (k - 10) * 0.12;
    for (let j = 0; j <= 10; j++) { const th = 0.12 + (Math.PI * 0.72) * (j / 10) * len; pts.push([s * hw * Math.sin(th), y0 - 0.075 * (th / Math.PI) * (k + 3) / 8, 0.012 - hd * Math.cos(th)]); }
    if (k < 10) pts.push([s * 0.012, pts[pts.length - 1][1] - 0.02, 0.1]);
    parts.push(sweep(pts, [0.0048, 0.0036], { n: 40, ring: 6, colorFn: (p, t) => (t > 0.8 && k < 10 ? CART : BONE) }));
  }
  parts.push(solid(sweep([[0, 0.588, 0.108], [0, 0.52, 0.114], [0, 0.44, 0.112], [0, 0.415, 0.108]], keyed([[0, [0.006, 0.02]], [0.3, [0.005, 0.016]], [0.85, [0.004, 0.012]], [1, [0.003, 0.004]]]), { n: 20, ring: 8 }), BONE));
  for (let i = 0; i < 24; i++) {
    const y = 0.735 - i * 0.0255, z = -0.082 - 0.016 * Math.sin((0.735 - y) / 0.6 * Math.PI * 1.6 + 0.4) + (y < 0.3 ? 0.01 : 0), r = i < 7 ? 0.015 : 0.02 + i * 0.0003;
    const v = blob(ellipsoid(r, 0.0098, r * 0.85), null, 16, 12); v.translate(0, y, z); parts.push(solid(v, BONE));
    const sp = blob(ellipsoid(0.004, 0.01, 0.02), null, 10, 8); sp.rotateX(0.5); sp.translate(0, y - 0.004, z - 0.03); parts.push(solid(sp, BONE));
  }
  const sacrum = blob(ellipsoid(0.038, 0.058, 0.02), null, 20, 14); sacrum.translate(0, 0.03, -0.075); parts.push(solid(sacrum, BONE));
  for (const s of [-1, 1]) {
    const wing = blob((u, o) => { o.set(u.x * 0.07, u.y * 0.06, u.z * 0.016); o.applyAxisAngle(V(0, 1, 0), s * 0.55); o.applyAxisAngle(V(0, 0, 1), -s * 0.2); o.add(V(s * 0.105, 0.045, -0.025)); }, null, 24, 18); parts.push(solid(wing, BONE));
    const hip = blob(ellipsoid(0.02, 0.03, 0.02), null, 14, 10); hip.translate(s * 0.095, -0.03, 0.01); parts.push(solid(hip, BONE));
  }
  parts.push(solid(sweep([[-0.095, -0.01, 0.02], [-0.06, -0.045, 0.075], [0, -0.058, 0.088], [0.06, -0.045, 0.075], [0.095, -0.01, 0.02]], 0.009, { n: 30, ring: 8 }), BONE));
  return merge(parts);
}

// ================================================================= the organs
const fat = hex('#e6b76a');
function brain() {
  const base = hex('#dba9a4'), dark = hex('#b0706e'), c = [0, 0.855, 0];
  const cortex = blob((u, out) => {
    const rx = 0.067, ry = 0.052, rz = 0.086; let y = u.y * ry; if (u.y < -0.3) y = -0.3 * ry + (u.y + 0.3) * ry * 0.4;
    const px = u.x * rx, pz = u.z * rz, n = ridged(px * 150 + noise(px * 60, y * 60, pz * 60) * 1.4, y * 150, pz * 150, 2);
    const d = 0.0042 * (n - 0.6) - 0.011 * gauss(u.x, 0.045) * smooth(-0.1, 0.4, u.y);   // folds, and the groove between the two halves
    const nv = V(u.x / rx, u.y / ry, u.z / rz).normalize(); out.set(px, y, pz).addScaledVector(nv, d).add(V(c[0], c[1], c[2]));
  }, (p) => { const n = ridged(p.x * 150 + noise(p.x * 60, p.y * 60, p.z * 60) * 1.4, p.y * 150, p.z * 150, 2); return mix3(dark, base, smooth(0.28, 0.72, n)); }, 96, 72);
  const cb = blob((u, o) => { const px = u.x * 0.05, py = u.y * 0.026, pz = u.z * 0.036; o.set(px, py + 0.0016 * Math.sin(py * 460 + u.x * 2), pz).add(V(0, 0.824, -0.062)); }, (p) => mix3(hex('#c4857c'), hex('#d89a90'), 0.5 + 0.5 * Math.sin(p.y * 460)), 48, 36);
  const stem = sweep([[0, 0.83, -0.02], [0, 0.795, -0.024], [0, 0.762, -0.026]], (t) => 0.0105 - 0.0015 * t, { n: 16, ring: 12, colorFn: () => hex('#e3c2b4') });
  return merge([cortex, cb, stem]);
}

function heart() {
  const C = V(0.025, 0.47, 0.05), red = hex('#b8353d'), arteryC = hex('#c73838'), veinC = hex('#4b6bb3'), trunkC = hex('#7a74c2');
  const body = blob((u, out) => {
    const y = u.y, k = y < 0 ? 1 + y * 0.58 : 1, lean = y < 0 ? y * y : 0;
    out.set(u.x * 0.046 * k + lean * 0.016, y * 0.06, u.z * 0.039 * k + lean * 0.006);
    out.multiplyScalar(1 - 0.07 * gauss(y - 0.16, 0.09) - 0.06 * gauss(u.x - 0.18, 0.1) * smooth(0.1, 0.6, u.z) * smooth(-0.9, 0.2, y));   // the groove between atria and ventricles, and the one down the front between the two ventricles
    out.applyAxisAngle(V(0, 0, 1), -0.5); out.applyAxisAngle(V(1, 0, 0), 0.25); out.add(C);
  }, (p) => { const g = gauss(p.y - C.y - 0.01, 0.03), n = fbm(p.x * 160, p.y * 160, p.z * 160, 3); return mix3(red, fat, Math.min(0.7, g * 0.5 * (0.4 + n) + 0.12 * n)); }, 72, 56);
  const appR = blob(ellipsoid(0.024, 0.026, 0.02), () => hex('#b0343b'), 24, 18); appR.translate(-0.022 + C.x, 0.06 + C.y, 0.016 + C.z);
  const appL = blob(ellipsoid(0.014, 0.02, 0.012), () => hex('#b0343b'), 20, 14); appL.translate(0.036 + C.x, 0.062 + C.y, 0.03 + C.z);
  const tube = (pts, r, col, o = {}) => sweep(pts.map(([x, y, z]) => [x + C.x, y + C.y, z + C.z]), r, { n: o.n ?? 24, ring: o.ring ?? 12, colorFn: () => col });
  return merge([body, appR, appL,
    tube([[0.005, 0.045, 0], [0, 0.075, 0.005], [-0.012, 0.098, -0.005], [-0.03, 0.092, -0.03], [-0.04, 0.06, -0.045], [-0.04, 0, -0.05], [-0.04, -0.06, -0.055]], (t) => 0.0135 - 0.003 * t, arteryC, { n: 50 }),
    tube([[-0.012, 0.098, -0.005], [-0.014, 0.135, -0.005]], 0.006, arteryC), tube([[-0.02, 0.097, -0.015], [-0.021, 0.132, -0.015]], 0.0045, arteryC), tube([[-0.026, 0.093, -0.022], [-0.036, 0.116, -0.02]], 0.005, arteryC),
    tube([[0.012, 0.03, 0.032], [0.012, 0.065, 0.028], [0.02, 0.09, 0.012]], 0.0125, trunkC), tube([[0.02, 0.09, 0.012], [0.05, 0.09, -0.01], [0.075, 0.085, -0.03]], 0.008, trunkC), tube([[0.02, 0.09, 0.012], [-0.03, 0.08, -0.015], [-0.07, 0.075, -0.03]], 0.008, trunkC),
    tube([[-0.03, 0.15, -0.012], [-0.03, 0.09, -0.005], [-0.028, 0.045, 0]], 0.0115, veinC), tube([[-0.02, -0.01, -0.015], [-0.025, -0.06, -0.02], [-0.028, -0.1, -0.025]], 0.013, veinC),
    tube([[0.03, 0.045, -0.03], [0.06, 0.055, -0.04], [0.085, 0.05, -0.05]], 0.0065, hex('#8a6fc0')), tube([[-0.005, 0.03, -0.03], [-0.04, 0.04, -0.045], [-0.075, 0.04, -0.05]], 0.0065, hex('#8a6fc0')),
    tube([[0.012, 0.07, 0.036], [0.014, 0.03, 0.042], [0.024, -0.012, 0.042], [0.034, -0.046, 0.036], [0.04, -0.066, 0.03]], 0.0028, hex('#d93a32'), { ring: 6 }),
    tube([[-0.01, 0.074, 0.035], [-0.04, 0.05, 0.03], [-0.05, 0.01, 0.022], [-0.04, -0.02, 0.03], [-0.012, -0.03, 0.04]], 0.0028, hex('#d93a32'), { ring: 6 })]);
}

function lungs() {
  const parts = [], lungC = hex('#cd938f'), dark = hex('#a97571'), pale = hex('#e3b5ac');
  for (const s of [-1, 1]) {
    const c = V(s * 0.078, 0.5, -0.004), scl = s > 0 ? 0.93 : 1;
    parts.push(blob((u, out) => {
      let x = u.x * 0.058, y = u.y * 0.125, z = u.z * 0.088; const med = -u.x * s;
      if (u.y > 0) { const k = 1 - 0.35 * u.y * u.y; x *= k; z *= k; } else { const k = 1 + 0.18 * -u.y; x *= k; z *= k; }
      if (med > 0) x *= 0.55;
      y += 0.03 * smooth(-0.45, -1, u.y) * (1 - (u.x * u.x + u.z * u.z));                       // the lung's underside is hollowed by the diaphragm
      let r = 1;
      if (s > 0) r -= 0.5 * gauss(u.y + 0.15, 0.4) * smooth(0.05, 0.7, u.z) * smooth(0, 0.6, med);   // the notch where the heart sits
      r -= 0.035 * gauss(u.y * 0.7 - u.z * 0.7 - 0.05, 0.06);                                         // the slanting fissure between the lobes
      if (s < 0) r -= 0.03 * gauss(u.y - 0.12, 0.05) * smooth(-0.1, 0.5, u.z);                        // the right lung has a second, flat fissure
      out.set(x * r, y, z * r).multiplyScalar(scl).add(c);
      const q = fbm(out.x * 70, out.y * 70, out.z * 70, 3); out.addScaledVector(V(u.x, u.y * 0.5, u.z).normalize(), 0.0016 * (q - 0.5));
    }, (p) => { const q = fbm(p.x * 55 + 3, p.y * 55, p.z * 55, 3); return mix3(mix3(dark, lungC, smooth(0.25, 0.55, q)), pale, smooth(0.6, 0.85, q)); }, 72, 60));
  }
  const airC = hex('#e8dbc9'), ring = (t) => 1 + 0.07 * Math.cos(t * Math.PI * 2 * 18);
  parts.push(sweep([[0, 0.668, -0.002], [0, 0.62, -0.006], [0, 0.586, -0.01]], 0.0095, { n: 60, ring: 14, mod: ring, colorFn: () => airC }));
  parts.push(sweep([[0, 0.586, -0.01], [-0.02, 0.572, -0.012], [-0.043, 0.552, -0.01]], 0.0072, { n: 24, ring: 12, mod: ring, colorFn: () => airC }));
  parts.push(sweep([[0, 0.586, -0.01], [0.022, 0.57, -0.012], [0.05, 0.546, -0.01]], 0.0068, { n: 24, ring: 12, mod: ring, colorFn: () => airC }));
  [[[-0.043, 0.552, -0.01], [-0.058, 0.585, -0.005]], [[-0.043, 0.552, -0.01], [-0.062, 0.55, 0.0]], [[-0.043, 0.552, -0.01], [-0.064, 0.515, -0.015]], [[0.05, 0.546, -0.01], [0.064, 0.58, -0.01]], [[0.05, 0.546, -0.01], [0.066, 0.512, -0.015]]]
    .forEach((p) => parts.push(sweep(p, 0.0042, { n: 8, ring: 8, colorFn: () => airC })));
  return merge(parts);
}

function liver() {
  const base = hex('#8f3a2b'), light = hex('#a85140'), c = V(-0.04, 0.375, 0.025);
  const body = blob((u, out) => {
    let x = u.x * 0.108, y = u.y * 0.064, z = u.z * 0.086; const t = smooth(-0.1, 1, u.x);
    y *= 1 - 0.68 * t; z *= 1 - 0.4 * t; if (u.y < 0) y *= 0.78;
    const r = 1 - 0.075 * gauss(u.x - 0.2, 0.08) * smooth(0.1, 0.7, u.y) * smooth(0, 0.6, u.z) - 0.05 * gauss(u.x + 0.05, 0.16) * smooth(-0.2, -0.9, u.y) * smooth(-0.1, -0.7, u.z);  // the groove for the ligament and the notch underneath
    out.set(x * r, y * r, z * r); const q = fbm(out.x * 80, out.y * 80, out.z * 80, 2); out.addScaledVector(V(u.x, u.y, u.z).normalize(), 0.0014 * (q - 0.5)).add(c);
  }, (p) => mix3(base, light, smooth(0.3, 0.7, fbm(p.x * 40, p.y * 40, p.z * 40, 3))), 80, 60);
  const gb = blob((u, o) => { const k = u.y < 0 ? 1 - 0.45 * -u.y : 1; o.set(u.x * 0.014 * k, u.y * 0.03, u.z * 0.013 * k).applyAxisAngle(V(0, 0, 1), 0.35).add(V(-0.06, 0.318, 0.078)); }, (p) => mix3(hex('#5f8f38'), hex('#7eab45'), fbm(p.x * 120, p.y * 120, p.z * 120, 2)), 28, 22);
  const duct = sweep([[-0.062, 0.34, 0.07], [-0.052, 0.352, 0.05], [-0.04, 0.358, 0.035]], 0.003, { n: 10, ring: 6, colorFn: () => hex('#7a9a45') });
  return merge([body, gb, duct]);
}

function stomach() {
  const a = hex('#d9776a'), b = hex('#eb9d90');
  const path = [[0.075, 0.435, 0.045], [0.09, 0.405, 0.06], [0.088, 0.365, 0.07], [0.076, 0.337, 0.076], [0.046, 0.323, 0.079], [0.016, 0.333, 0.071]];
  const r = keyed([[0, 0.024], [0.15, 0.036], [0.4, 0.042], [0.65, 0.033], [0.85, 0.023], [1, 0.015]]);
  const sack = sweep(path, r, { n: 60, ring: 28, mod: (t, an) => 0.97 + 0.07 * noise(t * 16, an * 1.8, 5), colorFn: (p) => mix3(a, b, fbm(p.x * 70, p.y * 70, p.z * 70, 3)) });
  const gullet = sweep([[0, 0.52, -0.012], [0.012, 0.48, 0], [0.03, 0.447, 0.02], [0.05, 0.43, 0.036]], 0.0105, { n: 24, ring: 12, colorFn: () => hex('#d99a8a') });
  return merge([sack, gullet]);
}

function pancreas() {
  const a = hex('#e0b980'), b = hex('#efd3a6');
  return sweep([[-0.05, 0.305, 0.02], [-0.025, 0.322, 0.03], [0.005, 0.333, 0.032], [0.04, 0.345, 0.028], [0.075, 0.368, 0.012], [0.092, 0.388, 0.0]], keyed([[0, [0.014, 0.021]], [0.2, [0.011, 0.017]], [0.6, [0.01, 0.012]], [1, [0.007, 0.009]]]),
    { n: 90, ring: 18, mod: (t, an) => 0.88 + 0.3 * (ridged(t * 55, an * 2.2, 1.7, 2) - 0.4), colorFn: (p) => mix3(a, b, fbm(p.x * 90, p.y * 90, p.z * 90, 3)) });
}

function kidneys() {
  const base = hex('#8c3a33'), parts = [];
  for (const s of [-1, 1]) {
    const c = V(s * 0.07, s > 0 ? 0.28 : 0.262, -0.05);
    parts.push(blob((u, out) => {
      const med = -s * u.x; let x = u.x * 0.03; if (med > 0) x *= 1 - 0.7 * gauss(u.y, 0.3) * med;
      out.set(x, u.y * 0.055, u.z * 0.019).applyAxisAngle(V(0, 0, 1), s * 0.14).add(c);
      out.addScaledVector(V(u.x, u.y, u.z).normalize(), 0.0012 * (fbm(out.x * 90, out.y * 90, out.z * 90, 2) - 0.5));
    }, (p) => mix3(base, hex('#a04a40'), fbm(p.x * 70, p.y * 70, p.z * 70, 3)), 48, 36));
    parts.push(blob((u, o) => { o.set(u.x * 0.017, u.y * 0.007, u.z * 0.006).applyAxisAngle(V(0, 0, 1), -s * 0.3).add(V(s * 0.062, c.y + 0.058, -0.044)); }, () => hex('#dcb86e'), 20, 14));
    const hx = s * 0.052, dy = s > 0 ? 0 : 0.015;
    parts.push(sweep([[hx, c.y - 0.01, -0.046], [s * 0.046, 0.23, -0.046], [s * 0.038, 0.16, -0.036], [s * 0.03, 0.09, -0.016], [s * 0.022, 0.05, -0.002]], 0.0028, { n: 50, ring: 8, colorFn: () => hex('#e2c48d') }));
    parts.push(sweep([[hx, c.y + 0.0, -0.046], [s * 0.03, 0.288, -0.04], [s * 0.012, 0.292 - dy * 0, -0.035]], 0.0042, { n: 14, ring: 8, colorFn: () => hex('#c73838') }));
    parts.push(sweep([[hx, c.y - 0.016, -0.046], [s * 0.03, 0.272, -0.04], [s * 0.014, 0.274, -0.034]], 0.0056, { n: 14, ring: 8, colorFn: () => hex('#4b6bb3') }));
  }
  return merge(parts);
}

function smallIntestine() {
  const P = [[0.012, 0.334, 0.07], [-0.035, 0.322, 0.055], [-0.05, 0.3, 0.03], [-0.045, 0.272, 0.012], [-0.02, 0.262, 0.005], [0.015, 0.268, 0.012], [0.035, 0.285, 0.02]];   // the duodenum's C-shaped loop around the pancreas…
  const rowsN = 14;
  for (let r = 0; r < rowsN; r++) {   // …then the coils: rows of loops, back and forth, piled in two layers
    const dir = r % 2 ? -1 : 1, y0 = 0.292 - r * 0.0122, z0 = 0.05 + 0.026 * Math.sin(r * 1.7), waves = 4 + (r % 3);
    for (let k = 0; k <= 13; k++) { const t = k / 13; P.push([dir * (-0.09 + 0.18 * t) + 0.008 * (noise(r, k, 1) - 0.5), y0 + 0.011 * Math.sin(t * Math.PI * waves + r) + 0.004 * (noise(r, k, 2) - 0.5), z0 + 0.022 * Math.sin(t * Math.PI * 2.3 + r * 2) + 0.01 * (noise(r, k, 3) - 0.5)]); }
    if (r < rowsN - 1) for (let j = 1; j <= 4; j++) { const a = -Math.PI / 2 + Math.PI * j / 5; P.push([dir * (0.09 + 0.011 * Math.cos(a)), y0 - 0.0122 * (1 + Math.sin(a)) / 2, z0 + 0.015 * Math.sin(r + j)]); }
  }
  const j0 = hex('#e88d7a'), j1 = hex('#eba995');
  return sweep(P, 0.0108, { n: 2100, ring: 10, tension: 0.4, mod: (t) => 1 + 0.05 * Math.sin(t * 760), colorFn: (p, t) => mix3(j0, j1, smooth(0.2, 0.9, t) * (0.7 + 0.3 * noise(t * 30, 0, 0))) });
}

function largeIntestine() {
  const P = [[-0.078, 0.062, 0.04], [-0.092, 0.1, 0.038], [-0.096, 0.16, 0.033], [-0.094, 0.24, 0.03], [-0.092, 0.31, 0.03], [-0.082, 0.335, 0.036], [-0.05, 0.322, 0.07], [-0.01, 0.292, 0.078], [0.03, 0.296, 0.074], [0.065, 0.322, 0.06], [0.092, 0.342, 0.032], [0.105, 0.3, 0.018], [0.108, 0.22, 0.012], [0.102, 0.14, 0.01], [0.088, 0.085, 0.018], [0.06, 0.055, 0.032], [0.025, 0.052, 0.034], [0.0, 0.07, 0.03], [0.02, 0.03, 0.0], [0.005, 0.0, -0.035], [0.0, -0.03, -0.045]];
  const r = keyed([[0, 0.027], [0.12, 0.0245], [0.35, 0.022], [0.55, 0.019], [0.75, 0.0185], [0.9, 0.017], [1, 0.015]]), N = 54, base = hex('#d28a66'), dark = hex('#a8603f');
  const colon = sweep(P, r, { n: 900, ring: 20, tension: 0.5, mod: (t, a) => { const h = Math.abs(Math.sin(t * Math.PI * N)); return (0.86 + 0.16 * h ** 0.6) * (t > 0.88 ? 1 : 1 - 0.05 * Math.cos(a * 3)); }, colorFn: (p, t) => mix3(dark, base, Math.abs(Math.sin(t * Math.PI * N)) ** 0.5) });
  const app = sweep([[-0.082, 0.056, 0.036], [-0.074, 0.036, 0.04], [-0.058, 0.02, 0.04]], 0.0045, { n: 12, ring: 8, colorFn: () => hex('#d99a78') });
  return merge([colon, app]);
}

function bladder() {
  const a = hex('#dba08a'), b = hex('#e6b8a0');
  const sack = blob((u, o) => { let x = u.x * 0.042, y = u.y * 0.037, z = u.z * 0.039; if (u.y > 0.4) y *= 0.82; if (u.y < -0.3) { const k = 1 + (u.y + 0.3) * 0.5; x *= k; z *= k; } o.set(x, y, z).add(V(0, 0.048, 0.03)); },
    (p) => mix3(a, b, fbm(p.x * 110, p.y * 110, p.z * 110, 3)), 48, 36);
  const urethra = sweep([[0, 0.014, 0.028], [0, -0.012, 0.022], [0, -0.032, 0.015]], 0.0052, { n: 14, ring: 10, colorFn: () => a });
  return merge([sack, urethra]);
}

// ================================================================= assembling
const BUILD = { brain, heart, lungs, stomach, pancreas, liver, kidneys, smallint: smallIntestine, largeint: largeIntestine, bladder };
const organMat = () => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.46, metalness: 0, clearcoat: 0.6, clearcoatRoughness: 0.3, sheen: 0.35, sheenColor: new THREE.Color(0xffb8a8), side: THREE.DoubleSide });

export async function loadBody() {
  const root = new THREE.Group(), organs = {}, ghosts = {}, S = SCALE;
  const scaled = (g) => { g.scale(S, S, S); return g; };

  const skinGeo = scaled(bodySkin());
  const skinMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { uOpacity: { value: 1 } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform float uOpacity; varying vec3 vN; varying vec3 vV; void main(){ vec3 n = normalize(vN); float f = pow(1.0 - clamp(dot(n, normalize(vV)), 0.0, 1.0), 2.0); float l = 0.6 + 0.4 * dot(n, normalize(vec3(0.4, 0.6, 0.7)));'
      + ' vec3 skin = vec3(0.89, 0.65, 0.52); vec3 c = mix(skin * l, skin * 0.78, f); float a = mix(0.3, 0.72, f); gl_FragColor = vec4(c, a * uOpacity); }',   // see-through skin, a little more solid at the edges
  });
  const skin = new THREE.Mesh(skinGeo, skinMat), skinDepth = new THREE.Mesh(skinGeo, new THREE.MeshBasicMaterial({ colorWrite: false }));
  skin.renderOrder = 6; skinDepth.renderOrder = 5; const skinGroup = new THREE.Group(); skinGroup.add(skinDepth, skin); root.add(skinGroup);

  const bones = new THREE.Mesh(scaled(skeleton()), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, transparent: true, opacity: 0.4, depthWrite: false })); bones.renderOrder = 4; root.add(bones);

  const ghostMat = new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.4, depthWrite: false });
  for (const id of ORGANS) {
    const geo = BUILD[id](); geo.computeBoundingBox(); const ctr = geo.boundingBox.getCenter(new THREE.Vector3()); geo.translate(-ctr.x, -ctr.y, -ctr.z); scaled(geo);
    const home = ctr.clone().multiplyScalar(S), mat = organMat(), outer = new THREE.Group(), inner = new THREE.Group(), mesh = new THREE.Mesh(geo, mat);
    inner.add(mesh); outer.add(inner); outer.userData = { id, inner, mat, home, geo }; outer.position.copy(home); outer.visible = false; root.add(outer); organs[id] = outer;
    const gm = ghostMat.clone(), gh = new THREE.Mesh(geo, gm); gh.position.copy(home); gh.visible = false; gh.renderOrder = 3; gh.userData = { mat: gm }; root.add(gh); ghosts[id] = gh;
  }
  return { root, skin: skinGroup, skinMat, bones, organs, ghosts };
}

// the heart beats and the lungs breathe (only the ones that are in the body)
export function pulse(organs, t) {
  const b = Math.max(0, Math.sin(t * 7.5)) ** 4 * 0.9 + Math.max(0, Math.sin(t * 7.5 - 1.1)) ** 4 * 0.4;
  organs.heart.userData.inner.scale.setScalar(1 + 0.045 * b);
  const br = Math.sin(t * 1.5); organs.lungs.userData.inner.scale.set(1 + 0.025 * br, 1 + 0.04 * br, 1 + 0.03 * br);
}

// a little picture of each organ for the tray, drawn once from the model itself
export function thumbnails(body, size = 160) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true }); r.setSize(size, size, false); r.setClearColor(0, 0);
  const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight(0xffffff, 0xb9c6d0, 1.7)); const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(2, 3, 5); scene.add(key);
  const out = {};
  for (const id of ORGANS) {
    const o = body.organs[id], mesh = new THREE.Mesh(o.userData.geo, o.userData.mat); scene.add(mesh);
    const box = new THREE.Box3().setFromObject(mesh), c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3()), h = Math.max(s.x, s.y) * 0.56;
    const cam = new THREE.OrthographicCamera(-h, h, h, -h, 0.1, 50); cam.position.set(c.x, c.y, c.z + 10); cam.lookAt(c);
    r.render(scene, cam); out[id] = canvas.toDataURL('image/png'); scene.remove(mesh);
  }
  r.dispose(); r.forceContextLoss?.();
  return out;
}
