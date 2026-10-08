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
  vec2 rp = vP * 1.3 + uTime * vec2(0.6, 0.35);
  vec2 rip = vec2(sin(rp.x * 1.7 + sin(rp.y * 1.1)) + sin(rp.y * 2.3 - uTime * 1.7), cos(rp.x * 2.1 - uTime * 1.9) + sin(rp.y * 1.3 + rp.x * .5 + uTime * 2.2));
  vec3 n = normalize(vec3(-hx / (2.0 * e) - rip.x * 0.045 * calm, 1.0, -hz / (2.0 * e) - rip.y * 0.045 * calm));
  vec3 V = normalize(cameraPosition - vW), L = normalize(uSun), H = normalize(L + V);
  float diff = 0.55 + 0.45 * max(dot(n, L), 0.0), spec = pow(max(dot(n, H), 0.0), 140.0), fres = pow(1.0 - max(dot(n, V), 0.0), 3.0);
  float mud = smoothstep(0.1, 1.5, c.a) * smoothstep(0.0, 3.0, D);
  vec3 deep = vec3(0.015, 0.14, 0.30), mid = vec3(0.04, 0.42, 0.52), shallow = vec3(0.25, 0.68, 0.66);
  vec3 body = mix(shallow, mix(mid, deep, smoothstep(10.0, 400.0, D)), smoothstep(0.5, 10.0, D));
  body += clamp(c.r * 2.6, -0.5, 0.5) * vec3(0.22, 0.34, 0.34) * (1.0 - mud);   // waves show as lighter ridges and darker troughs
  body = mix(body, vec3(0.42, 0.32, 0.2), mud * 0.85) * diff;
  vec3 colr = mix(body, uSky, fres * 0.65) + vec3(1.0, 0.95, 0.85) * spec * 1.4;
  float fn = vnoise(vP * 2.2 + uTime * 0.3) * 0.6 + vnoise(vP * 5.0 - uTime * 0.5) * 0.4;
  float foam = clamp(c.b * (0.55 + 0.9 * fn) + smoothstep(0.7, 0.05, D) * 0.7 * smoothstep(0.1, 0.9, fn), 0.0, 1.0);
  colr = mix(colr, vec3(0.96, 0.98, 1.0), foam);
  float a = mix(0.0, 0.93, smoothstep(0.015, 0.7, D)); a = max(a, foam * 0.9);
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

  // ---- the town: houses, a few tall buildings, streets, trees
  const houses = [], towers = [];
  for (let i = 207; i <= 247; i += 4) for (let j = 6; j <= 162; j += 5) {
    const k = idx(i, j), b = sim.b[k]; if (b < 2.4 || Math.abs(j - 87) < 3 && i > 214) continue;       // leave the river valley open
    const tall = (i === 207 && j % 15 === 1) || (i === 211 && j % 25 === 6);
    houses.push({ i, j, x: i + 0.5, z: j + 0.5, y: gdisp(b), w: tall ? 0.78 : 0.62 + rnd() * 0.16, h: tall ? 1.7 + rnd() * 0.7 : 0.55 + rnd() * 0.12, alive: true, tall, c: new THREE.Color().setHSL(rnd() * 0.12 + (rnd() < 0.5 ? 0.02 : 0.1), 0.32, 0.72 + rnd() * 0.15), roof: new THREE.Color().setHSL(0.02 + rnd() * 0.05, 0.55, 0.38 + rnd() * 0.12) });
  }
  const hm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.85 }), houses.length);
  const rm = new THREE.InstancedMesh(new THREE.ConeGeometry(0.78, 0.5, 4), new THREE.MeshStandardMaterial({ roughness: 0.8 }), houses.length); const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), P = new THREE.Vector3(), Sc = new THREE.Vector3(), E = new THREE.Euler();
  const place = (h, show) => {
    if (!show) { M.makeScale(0, 0, 0); hm.setMatrixAt(h.n, M); rm.setMatrixAt(h.n, M); return; }
    Q.identity(); P.set(h.x, h.y + h.h / 2, h.z); Sc.set(h.w, h.h, h.w); M.compose(P, Q, Sc); hm.setMatrixAt(h.n, M);
    Q.setFromEuler(E.set(0, Math.PI / 4, 0)); P.set(h.x, h.y + h.h + (h.tall ? 0.04 : 0.15), h.z); Sc.set(h.w * (h.tall ? 0.01 : 1), h.tall ? 0.01 : 1, h.w * (h.tall ? 0.01 : 1)); M.compose(P, Q, Sc); rm.setMatrixAt(h.n, M);
  };
  houses.forEach((h, n) => { h.n = n; place(h, true); hm.setColorAt(n, h.c); rm.setColorAt(n, h.roof); });
  world.add(hm, rm);
  const trees = []; for (let t = 0; t < 650; t++) { const i = 200 + rnd() * 98, j = 3 + rnd() * 164, k = idx(Math.floor(i), Math.floor(j)), b = sim.b[k]; if (b < 3.5 || (i < 250 && Math.floor((i - 207) / 4) !== (i - 207) / 4 && false)) continue; if (i < 249 && i > 205 && Math.abs((i - 207) % 4) < 1.6 && (j - 6) % 5 < 2) continue; trees.push([i, gdisp(b), j, 0.45 + rnd() * 0.5]); }
  const tm = new THREE.InstancedMesh(new THREE.ConeGeometry(0.28, 0.85, 6), new THREE.MeshStandardMaterial({ color: 0x2f6f3c, roughness: 0.9 }), trees.length);
  trees.forEach((t, n) => { P.set(t[0], t[1] + 0.4 * t[3], t[2]); Sc.set(t[3], t[3], t[3]); Q.identity(); M.compose(P, Q, Sc); tm.setMatrixAt(n, M); }); world.add(tm);

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

  const api = { scene, world, water, wMat, field, fieldTex, houses, hm, rm, place, people, pm, debris, dm, DEB, buoy, flag, sun, hillX, hillZ, M, Q, P, Sc };
  api.updateField = (sim, dt) => {
    const { eta, b, foam, u, v } = sim;
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const k = idx(i, j), d = eta[k] - b[k], o = k * 4;
      if (d < 0.012) { field[o] = gdisp(b[k]) - 0.05; field[o + 1] = 0; field[o + 2] = 0; field[o + 3] = b[k]; foam[k] *= 0.9; continue; }
      const ex = b[k] < 0 ? 1 + 12 * smooth(40, 400, -b[k]) : 1, y = b[k] < 0 ? eta[k] * VX * ex : (b[k] + d) * VX;
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
