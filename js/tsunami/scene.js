// The tsunami world: seabed and land, a town on the coast, a hill to run up, a warning buoy, little people, and the sea itself.
// 1 scene unit = one 30 m grid square. Heights are drawn about twice as tall as they are wide so that waves and hills can be seen.
import * as THREE from '../../vendor/three.module.min.js';
import { NX, NY, DX, idx } from './sim.js';

export const VX = 2 / 30;                                             // metres → scene height
export const gdisp = (b) => (b > -60 ? b * VX : -60 * VX - 1.6 * Math.log(1 + (-b - 60) / 150));
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const rnd = (() => { let s = 7; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
const col = (h) => new THREE.Color(h);

const WATER_VERT = `
uniform highp sampler2D uField;
varying vec2 vP; varying float vD; varying vec3 vW;
void main(){
  ivec2 ij = ivec2(int(position.x), int(position.z));
  vec4 f = texelFetch(uField, ij, 0);
  vec3 p = vec3(position.x + 0.5, f.r, position.z + 0.5);
  vP = vec2(position.x, position.z); vD = f.g; vW = p;
  gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
}`;
const WATER_FRAG = `
precision highp float;
uniform highp sampler2D uField; uniform float uTime; uniform vec3 uSun, uSky, uHorizon;
varying vec2 vP; varying float vD; varying vec3 vW;
const int NXI = ${NX}, NYI = ${NY};
vec4 S(vec2 p){ vec2 q = p - 0.0; ivec2 i0 = ivec2(floor(q)); vec2 t = fract(q);
  ivec2 a = clamp(i0, ivec2(0), ivec2(NXI-1, NYI-1)), b = clamp(i0 + ivec2(1,0), ivec2(0), ivec2(NXI-1, NYI-1)), c = clamp(i0 + ivec2(0,1), ivec2(0), ivec2(NXI-1, NYI-1)), d = clamp(i0 + ivec2(1,1), ivec2(0), ivec2(NXI-1, NYI-1));
  return mix(mix(texelFetch(uField, a, 0), texelFetch(uField, b, 0), t.x), mix(texelFetch(uField, c, 0), texelFetch(uField, d, 0), t.x), t.y); }
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y); }
void main(){
  vec4 c = S(vP); float D = c.g;
  if (vD < 0.012) discard;
  float e = 0.6;
  float hx = S(vP + vec2(e,0)).r - S(vP - vec2(e,0)).r, hz = S(vP + vec2(0,e)).r - S(vP - vec2(0,e)).r;
  float calm = 1.0 - smoothstep(0.0, 2.5, abs(hx) + abs(hz));
  vec2 q1 = vP * 0.55 + vec2(uTime * 0.22, uTime * 0.15), q2 = vP * 1.5 + vec2(-uTime * 0.31, uTime * 0.2);
  vec2 rip = vec2(vnoise(q1 + vec2(0.37, 0.0)) - vnoise(q1 - vec2(0.37, 0.0)), vnoise(q1 + vec2(0.0, 0.41)) - vnoise(q1 - vec2(0.0, 0.41))) * 0.9
           + vec2(vnoise(q2 + vec2(0.3, 0.0)) - vnoise(q2 - vec2(0.3, 0.0)), vnoise(q2 + vec2(0.0, 0.33)) - vnoise(q2 - vec2(0.0, 0.33))) * 0.5;
  vec3 n = normalize(vec3(-hx / (2.0 * e) - rip.x * 0.55 * (0.4 + 0.6 * calm), 1.0, -hz / (2.0 * e) - rip.y * 0.55 * (0.4 + 0.6 * calm)));
  vec3 V = normalize(cameraPosition - vW), L = normalize(uSun), H = normalize(L + V);
  float diff = 0.62 + 0.38 * max(dot(n, L), 0.0), spec = pow(max(dot(n, H), 0.0), 220.0), fres = pow(1.0 - max(dot(n, V), 0.0), 3.0);
  float mud = smoothstep(0.1, 1.5, c.a) * smoothstep(0.0, 3.0, D);
  vec3 deep = vec3(0.02, 0.26, 0.48), mid = vec3(0.05, 0.52, 0.66), shallow = vec3(0.42, 0.84, 0.78);
  vec3 body = mix(shallow, mix(mid, deep, smoothstep(12.0, 500.0, D)), smoothstep(0.6, 12.0, D));
  body += clamp(c.r * 2.6, -0.5, 0.5) * vec3(0.20, 0.30, 0.30) * (1.0 - mud);   // waves show as lighter ridges and darker troughs
  body = mix(body, vec3(0.44, 0.34, 0.21), mud * 0.85) * diff;
  vec3 colr = mix(body, uSky, fres * 0.7) + vec3(1.0, 0.96, 0.86) * spec * 1.6;
  float fn = vnoise(vP * 1.7 + uTime * 0.25) * 0.6 + vnoise(vP * 4.6 - uTime * 0.4) * 0.4;
  float foam = smoothstep(0.18, 0.75, c.b * (0.35 + 1.15 * fn)) + smoothstep(0.6, 0.04, D) * 0.75 * smoothstep(0.2, 0.8, fn);
  foam = clamp(foam, 0.0, 1.0);
  colr = mix(colr, vec3(0.97, 0.99, 1.0), foam);
  float a = mix(0.4, 0.94, smoothstep(0.8, 16.0, D)) * smoothstep(0.012, 0.3, D); a = max(a, foam * 0.92);
  gl_FragColor = vec4(colr, a);
}`;

export function buildWorld(sim) {
  const scene = new THREE.Scene(), world = new THREE.Group(); scene.add(world);
  const HOR = col(0xcfe3f1), SKY = col(0x6fb0e8); scene.background = HOR.clone(); scene.fog = new THREE.Fog(HOR, 150, 420);

  // ---- light and sky
  scene.add(new THREE.HemisphereLight(0xdff0ff, 0x6a7a62, 1.25));
  const sun = new THREE.DirectionalLight(0xfff1d6, 2.2); sun.position.set(-90, 120, 60); scene.add(sun);
  const skyMat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { top: { value: SKY }, hor: { value: HOR }, sunDir: { value: sun.position.clone().normalize() } },
    vertexShader: 'varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 top, hor, sunDir; varying vec3 vD; void main(){ float h = clamp(vD.y, 0.0, 1.0); vec3 c = mix(hor, top, pow(h, 0.55)); float s = max(dot(normalize(vD), normalize(sunDir)), 0.0); c += vec3(1.0, 0.9, 0.7) * (pow(s, 600.0) * 3.0 + pow(s, 12.0) * 0.18); gl_FragColor = vec4(c, 1.0); }' });
  const dome = new THREE.Mesh(new THREE.SphereGeometry(900, 24, 16), skyMat); dome.renderOrder = -2; scene.add(dome);

  // ---- terrain (sea floor and land), coloured by height
  const terrain = (() => {
    const pos = new Float32Array(NX * NY * 3), colr = new Float32Array(NX * NY * 3), ix = [], c = new THREE.Color();
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const k = idx(i, j), b = sim.b[k]; pos.set([i + 0.5, gdisp(b), j + 0.5], k * 3);
      const n = Math.sin(i * 0.9 + j * 1.3) * 0.5 + Math.sin(i * 2.1 - j * 0.7) * 0.5;
      if (b < -1) c.set(b > -30 ? 0xcdbf94 : 0x6f7f86).lerp(col(0x1b3a52), smooth(-10, -300, b) * 0.9); else if (b < 3.2) c.set(0xe8d9a8); else if (b < 28) c.set(0x86b95c).lerp(col(0x6ea251), 0.5 + 0.5 * n * 0.4); else if (b < 85) c.set(0x568f4c).lerp(col(0x7c9a58), smooth(60, 85, b)); else c.set(0x8e8a78).lerp(col(0xb0ac98), 0.3 + 0.2 * n);
      colr.set([c.r, c.g, c.b], k * 3);
    }
    for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = idx(i, j), b2 = a + 1, c2 = a + NX, d = c2 + 1; ix.push(a, c2, b2, b2, c2, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(colr, 3)); g.setIndex(ix); g.computeVertexNormals();
    return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, flatShading: false }));
  })();
  world.add(terrain);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshBasicMaterial({ color: 0x143650 })); ground.rotation.x = -Math.PI / 2; ground.position.set(NX / 2, -6.2, NY / 2); scene.add(ground);   // deep sea below / beyond
  const oceanFar = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.MeshBasicMaterial({ color: 0x1d6e8c, fog: true })); oceanFar.rotation.x = -Math.PI / 2; oceanFar.position.set(-1980, -0.05, NY / 2); scene.add(oceanFar);

  // ---- the sea: a flat grid whose height, depth and foam come from a texture the simulation fills every frame
  const field = new Float32Array(NX * NY * 4), fieldTex = new THREE.DataTexture(field, NX, NY, THREE.RGBAFormat, THREE.FloatType);
  fieldTex.minFilter = fieldTex.magFilter = THREE.NearestFilter; fieldTex.needsUpdate = true;
  const wMat = new THREE.ShaderMaterial({ vertexShader: WATER_VERT, fragmentShader: WATER_FRAG, transparent: true, depthWrite: false, uniforms: { uField: { value: fieldTex }, uTime: { value: 0 }, uSun: { value: sun.position.clone() }, uSky: { value: SKY.clone().lerp(HOR, 0.5) }, uHorizon: { value: HOR } } });
  const wpos = new Float32Array(NX * NY * 3), widx = [];
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) wpos.set([i, 0, j], idx(i, j) * 3);
  for (let j = 0; j < NY - 1; j++) for (let i = 0; i < NX - 1; i++) { const a = idx(i, j); widx.push(a, a + NX, a + 1, a + 1, a + NX, a + NX + 1); }
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(wpos, 3)); wg.setIndex(widx);
  const water = new THREE.Mesh(wg, wMat); water.frustumCulled = false; water.renderOrder = 3; world.add(water);

  // ---- the town: textured houses with gable roofs and chimneys, apartment blocks, a street grid, and trees
  const tex = (draw) => { const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); draw(g); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };
  const win = (g, x, y, w, h) => { g.fillStyle = '#f4f1ea'; g.fillRect(x - 5, y - 5, w + 10, h + 10); const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, '#a9d4ee'); gr.addColorStop(1, '#4f86b0'); g.fillStyle = gr; g.fillRect(x, y, w, h); g.fillStyle = '#f4f1ea'; g.fillRect(x + w / 2 - 2, y, 4, h); g.fillRect(x, y + h / 2 - 2, w, 4); };
  const houseTex = tex((g) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256); g.strokeStyle = 'rgba(0,0,0,.07)'; g.lineWidth = 2; for (let y = 10; y < 256; y += 14) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); } win(g, 30, 34, 60, 70); win(g, 166, 34, 60, 70); win(g, 30, 138, 52, 62); win(g, 174, 138, 52, 62); g.fillStyle = '#6b4226'; g.fillRect(104, 128, 48, 128); g.fillStyle = '#f2c14e'; g.beginPath(); g.arc(142, 196, 4, 0, 7); g.fill(); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 244, 256, 12); });
  const towerTex = tex((g) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256); for (let r = 0; r < 6; r++) for (let c = 0; c < 4; c++) win(g, 16 + c * 60, 14 + r * 40, 34, 26); g.fillStyle = '#5a4a3a'; g.fillRect(108, 226, 40, 30); });
  const roofTex = tex((g) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256); g.strokeStyle = 'rgba(0,0,0,.22)'; g.lineWidth = 3; for (let y = 0; y < 256; y += 24) { g.beginPath(); g.moveTo(0, y); g.lineTo(256, y); g.stroke(); for (let x = (y / 24) % 2 ? 0 : 16; x < 256; x += 32) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + 24); g.stroke(); } } });
  const roofGeo = (() => { const o = 0.6, h = 1, v = [], uv = [], add = (a, u) => { v.push(...a); uv.push(...u); };
    add([-o, 0, -o], [0, 0]); add([o, 0, -o], [1, 0]); add([o, h, 0], [1, 1]); add([-o, 0, -o], [0, 0]); add([o, h, 0], [1, 1]); add([-o, h, 0], [0, 1]);   // the two sloping sides
    add([-o, 0, o], [0, 0]); add([-o, h, 0], [0, 1]); add([o, h, 0], [1, 1]); add([-o, 0, o], [0, 0]); add([o, h, 0], [1, 1]); add([o, 0, o], [1, 0]);
    add([-o, 0, -o], [0, 0]); add([-o, h, 0], [0.5, 1]); add([-o, 0, o], [1, 0]); add([o, 0, o], [0, 0]); add([o, h, 0], [0.5, 1]); add([o, 0, -o], [1, 0]);   // the triangle ends
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); return g; })();
  const houses = [];
  for (let i = 207; i <= 247; i += 4) for (let j = 6; j <= 162; j += 5) {
    const k = idx(i, j), b = sim.b[k]; if (b < 2.4 || (Math.abs(j - 87) < 3 && i > 214)) continue;          // leave the river valley open
    const tall = (i === 207 && j % 15 === 1) || (i === 211 && j % 25 === 6) || (i === 215 && j % 35 === 11);
    const w = tall ? 1.45 : 1.25 + rnd() * 0.45, h = tall ? 2.4 + rnd() * 1.6 : 0.75 + rnd() * 0.25, yaw = rnd() < 0.5 ? 0 : Math.PI / 2;
    houses.push({ i, j, x: i + 0.5 + (rnd() - 0.5) * 0.4, z: j + 0.5 + (rnd() - 0.5) * 0.4, y: gdisp(b), w, h, yaw, alive: true, tall, c: new THREE.Color().setHSL(tall ? 0.1 + rnd() * 0.05 : [0.08, 0.12, 0.55, 0.0, 0.95, 0.3][Math.floor(rnd() * 6)], tall ? 0.15 : 0.35 + rnd() * 0.25, tall ? 0.8 : 0.78 + rnd() * 0.12), roof: new THREE.Color().setHSL([0.02, 0.05, 0.62, 0.08, 0.0][Math.floor(rnd() * 5)], 0.5, 0.38 + rnd() * 0.14) });
  }
  const hm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ map: houseTex, roughness: 0.85 }), houses.length);
  const tm2 = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ map: towerTex, roughness: 0.8 }), houses.length);
  const rm = new THREE.InstancedMesh(roofGeo, new THREE.MeshStandardMaterial({ map: roofTex, roughness: 0.85 }), houses.length);
  const cm = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 0.34, 0.14), new THREE.MeshStandardMaterial({ color: 0x8a5a44 }), houses.length);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), Sc = new THREE.Vector3(), E = new THREE.Euler(), Z0 = new THREE.Matrix4().makeScale(0, 0, 0);
  const place = (h, show) => {
    if (!show) { hm.setMatrixAt(h.n, Z0); tm2.setMatrixAt(h.n, Z0); rm.setMatrixAt(h.n, Z0); cm.setMatrixAt(h.n, Z0); return; }
    Q.setFromEuler(E.set(0, h.yaw, 0)); P.set(h.x, h.y + h.h / 2, h.z);
    if (h.tall) { Sc.set(h.w, h.h, h.w); M.compose(P, Q, Sc); tm2.setMatrixAt(h.n, M); hm.setMatrixAt(h.n, Z0); rm.setMatrixAt(h.n, Z0); cm.setMatrixAt(h.n, Z0); return; }
    Sc.set(h.w, h.h, h.w * 0.9); M.compose(P, Q, Sc); hm.setMatrixAt(h.n, M); tm2.setMatrixAt(h.n, Z0);
    P.set(h.x, h.y + h.h, h.z); Sc.set(h.w * 1.0, h.w * 0.42, h.w * 0.9); M.compose(P, Q, Sc); rm.setMatrixAt(h.n, M);
    const cx = Math.cos(h.yaw) * h.w * 0.22, cz = -Math.sin(h.yaw) * h.w * 0.22; P.set(h.x + cx, h.y + h.h + h.w * 0.34, h.z + cz); Q.identity(); Sc.set(1, 1, 1); M.compose(P, Q, Sc); cm.setMatrixAt(h.n, M);
  };
  houses.forEach((h, n) => { h.n = n; place(h, true); hm.setColorAt(n, h.c); tm2.setColorAt(n, h.c); rm.setColorAt(n, h.roof); });
  hm.instanceMatrix.needsUpdate = tm2.instanceMatrix.needsUpdate = rm.instanceMatrix.needsUpdate = cm.instanceMatrix.needsUpdate = true;
  world.add(hm, tm2, rm, cm);
  const towerM = tm2;
  // streets: grey ribbons that follow the ground between the rows of houses
  const roadMat = new THREE.MeshStandardMaterial({ color: 0x7d838b, roughness: 0.95, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const ribbon = (pts, w) => { const pos = [], ix = []; pts.forEach(([x, z], n) => { const k = idx(Math.min(NX - 1, Math.floor(x)), Math.min(NY - 1, Math.floor(z))), y = gdisp(sim.b[k]) + 0.03, dx = n < pts.length - 1 ? pts[n + 1][0] - x : x - pts[n - 1][0], dz = n < pts.length - 1 ? pts[n + 1][1] - z : z - pts[n - 1][1], l = Math.hypot(dx, dz) || 1, nx = -dz / l * w / 2, nz = dx / l * w / 2; pos.push(x + nx, y, z + nz, x - nx, y, z - nz); if (n) { const a = (n - 1) * 2; ix.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } });
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(ix); g.computeVertexNormals(); return new THREE.Mesh(g, roadMat); };
  for (let i = 205; i <= 249; i += 4) { const pts = []; for (let z = 4; z <= 166; z += 2) { if (sim.b[idx(i, Math.min(NY - 1, z))] < 2.2) { if (pts.length > 1) world.add(ribbon(pts, 0.7)); pts.length = 0; continue; } pts.push([i + 0.5, z + 0.5]); } if (pts.length > 1) world.add(ribbon(pts, 0.7)); }
  for (let j = 8; j <= 164; j += 5) { const pts = []; for (let x = 203; x <= 251; x += 2) { if (sim.b[idx(x, j)] < 2.2) { pts.length = 0; continue; } pts.push([x + 0.5, j + 0.5]); } if (pts.length > 1) world.add(ribbon(pts, 0.55)); }
  // trees: pines and round trees with trunks
  const merge = (parts) => { const pos = [], nor = [], col = []; for (const [g, c, m] of parts) { const gg = g.clone().applyMatrix4(m), p = gg.attributes.position, n = gg.attributes.normal, ix = gg.index; const get = (i) => { pos.push(p.getX(i), p.getY(i), p.getZ(i)); nor.push(n.getX(i), n.getY(i), n.getZ(i)); col.push(c.r, c.g, c.b); }; if (ix) for (let i = 0; i < ix.count; i++) get(ix.getX(i)); else for (let i = 0; i < p.count; i++) get(i); } const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); return g; };
  const T = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z), brown = col(0x6b4a2f), pine = merge([[new THREE.CylinderGeometry(0.05, 0.07, 0.4, 6), brown, T(0, 0.2, 0)], [new THREE.ConeGeometry(0.34, 0.6, 7), col(0x2f6f3c), T(0, 0.6, 0)], [new THREE.ConeGeometry(0.26, 0.5, 7), col(0x3a7d44), T(0, 0.95, 0)], [new THREE.ConeGeometry(0.17, 0.4, 7), col(0x468b4e), T(0, 1.25, 0)]]);
  const round = merge([[new THREE.CylinderGeometry(0.06, 0.08, 0.5, 6), brown, T(0, 0.25, 0)], [new THREE.IcosahedronGeometry(0.4, 1), col(0x5aa14a), T(0, 0.78, 0)], [new THREE.IcosahedronGeometry(0.28, 1), col(0x74b85a), T(0.18, 0.95, 0.1)]]);
  const trees = []; for (let t = 0; t < 900; t++) { const i = 200 + rnd() * 98, j = 3 + rnd() * 164, k = idx(Math.floor(i), Math.floor(j)), b = sim.b[k]; if (b < 3.5) continue; if (i < 250 && i > 204 && (Math.abs(((i - 205) % 4 + 4) % 4 - 0) < 1.1 || Math.abs((((j - 8) % 5) + 5) % 5) < 1.0 || (Math.abs((((i - 207) % 4) + 4) % 4) < 1.7 && Math.abs((((j - 6) % 5) + 5) % 5) < 1.7))) continue; trees.push([i, gdisp(b), j, 0.7 + rnd() * 0.7, b > 40 || rnd() < 0.45 ? 0 : 1]); }
  const mkTrees = (geo, list) => { const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }), Math.max(1, list.length)); list.forEach((t, n) => { P.set(t[0], t[1], t[2]); Q.setFromEuler(E.set(0, rnd() * 6, 0)); Sc.set(t[3], t[3] * (0.9 + rnd() * 0.3), t[3]); M.compose(P, Q, Sc); m.setMatrixAt(n, M); m.setColorAt(n, new THREE.Color().setHSL(0.3 + rnd() * 0.05, 0.1, 0.88 + rnd() * 0.12)); }); m.count = list.length; return m; };
  world.add(mkTrees(pine, trees.filter((t) => t[4] === 0)), mkTrees(round, trees.filter((t) => t[4] === 1)));

  // ---- the hill to run up: a green safe spot with a flag
  const hillX = 252.5, hillZ = 86.5, hillY = gdisp(sim.b[idx(252, 86)]);
  const flag = new THREE.Group(); const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.4, 6), new THREE.MeshStandardMaterial({ color: 0xeeeeee })); pole.position.y = 1.2;
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.7), new THREE.MeshStandardMaterial({ color: 0x1fb86a, side: THREE.DoubleSide })); cloth.position.set(0.58, 2.05, 0); flag.add(pole, cloth);
  const safe = new THREE.Mesh(new THREE.CircleGeometry(5.5, 28), new THREE.MeshBasicMaterial({ color: 0x3fe08a, transparent: true, opacity: 0.35, depthWrite: false })); safe.rotation.x = -Math.PI / 2; safe.position.y = 0.06; flag.add(safe);
  flag.position.set(hillX, hillY, hillZ); world.add(flag);

  // ---- the warning buoy out at sea
  const buoy = new THREE.Group(); { const hull = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 0.5, 14), new THREE.MeshStandardMaterial({ color: 0xffb020 })), mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.8, 6), new THREE.MeshStandardMaterial({ color: 0xdddddd })), lamp = new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff4040 })); mast.position.y = 1.1; lamp.position.y = 2.1; lamp.name = 'lamp'; buoy.add(hull, mast, lamp); }
  buoy.position.set(100.5, 0.3, 85.5); world.add(buoy);

  // ---- little people (they walk to the hill when the siren sounds)
  const people = []; for (let n = 0; n < 54; n++) { const h = houses[Math.floor(rnd() * houses.length)]; people.push({ x: h.x + 0.7 + rnd() * 0.5, z: h.z + 0.5 + rnd() * 0.8, tx: 252 + rnd() * 6, tz: 80 + rnd() * 14, state: 'home', c: new THREE.Color().setHSL(rnd(), 0.7, 0.5), wait: rnd() * 6 }); }
  const pm = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.1, 0.22, 4, 8), new THREE.MeshStandardMaterial({ roughness: 0.7 }), people.length); people.forEach((p, n) => pm.setColorAt(n, p.c)); pm.frustumCulled = false; world.add(pm);

  // ---- floating pieces from broken houses
  const DEB = 360, debris = [], dm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.9 }), DEB); dm.frustumCulled = false; dm.count = 0; world.add(dm);

  const api = { scene, world, water, wMat, field, fieldTex, houses, hm, rm, tm2: towerM, cm, place, people, pm, debris, dm, DEB, buoy, flag, sun, hillX, hillZ, M, Q, P, Sc };
  api.updateField = (sim, dt) => {
    const { eta, b, foam, u, v } = sim;
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const k = idx(i, j), d = eta[k] - b[k], o = k * 4;
      if (d < 0.012) { field[o] = gdisp(b[k]) - 0.05; field[o + 1] = 0; field[o + 2] = 0; field[o + 3] = b[k]; foam[k] *= 0.9; continue; }
      const ex = b[k] < 0 ? (1.7 - 0.7 * smooth(2, 40, -b[k])) + 12 * smooth(40, 400, -b[k]) : 1, y = b[k] < 0 ? eta[k] * VX * ex : (b[k] + d) * VX;
      const sp = Math.hypot(u[k], v[k]), kk = Math.min(N1, Math.max(0, k)), gx = Math.abs(eta[Math.min(k + 1, N1)] - eta[Math.max(k - 1, 0)]) / (2 * DX), gz = Math.abs(eta[Math.min(k + NX, N1)] - eta[Math.max(k - NX, 0)]) / (2 * DX);
      const crest = b[k] > -90 ? smooth(0.015, 0.06, gx + gz) * smooth(0.5, 4, sp + 1) : 0, rush = smooth(2.5, 7, sp) * smooth(8, 0.4, d + 0.01) * 0.9;
      foam[k] = Math.max(foam[k] * 0.985, crest * 0.8, rush);
      field[o] = Math.max(y, gdisp(b[k]) + 0.012); field[o + 1] = d; field[o + 2] = foam[k]; field[o + 3] = b[k];
    }
    fieldTex.needsUpdate = true;
  };
  const N1 = NX * NY - 1;
  return api;
}
