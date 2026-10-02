// Isaac's Solar System: a 3D, fully explorable solar system where every sun, planet and moon is a sleepy face
// that wakes up (dark eyes, huge grin full of little teeth) when you press Wake up on its card. Swipe to turn, pinch to zoom, tap a body.
import * as THREE from '../vendor/three.module.min.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { BODIES, paint, ringTexture } from './space/bodies.js';

const $ = (s) => document.querySelector(s);
const root = $('#view-space'), canvas = $('#space-canvas');
const ui = {
  loading: $('#space-loading'), bar: $('#space-bar'), card: $('#space-card'), name: $('#sc-name'), fact: $('#sc-fact'), stat: $('#sc-stat'), moons: $('#sc-moons'),
  chips: $('#space-chips'), pause: $('#btn-pause'), title: $('#space-title'),
};
const T = {
  en: { title: 'Solar System', wake: 'Wake up', sleep: 'Sleep', say: 'Say it', close: 'Close', moons: 'Moons', speech: 'en-US' },
  es: { title: 'Sistema Solar', wake: 'Despertar', sleep: 'Dormir', say: 'Escucha', close: 'Cerrar', moons: 'Lunas', speech: 'es-ES' },
};
const FOV = 45;
const ROCKY = new Set(['moon', 'mercury', 'mars', 'pluto', 'ganymede', 'callisto', 'charon', 'rockdark', 'europa', 'io']);
const ATMO = { earth: [0.35, 0.65, 1.0], venus: [1.0, 0.85, 0.5], mars: [1.0, 0.6, 0.4], titan: [1.0, 0.7, 0.3], jupiter: [1.0, 0.85, 0.65], saturn: [1.0, 0.9, 0.65], uranus: [0.6, 0.95, 1.0], neptune: [0.4, 0.55, 1.0] };
const ATMO_VERT = `#include <common>
#include <logdepthbuf_pars_vertex>
varying vec3 vN; varying vec3 vV;
void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv;
#include <logdepthbuf_vertex>
}`;
const ATMO_FRAG = `precision highp float;
#include <logdepthbuf_pars_fragment>
uniform vec3 uCol; varying vec3 vN; varying vec3 vV;
void main(){
#include <logdepthbuf_fragment>
  float f = pow(1.0 - clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0), 2.6); gl_FragColor = vec4(uCol * f, f * 0.9);
}`;
const PAUSE_ICON = '<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="8" y="6" width="6" height="20" rx="2" fill="currentColor"/><rect x="18" y="6" width="6" height="20" rx="2" fill="currentColor"/></svg>';
const PLAY_ICON = '<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 5l17 11L9 27z" fill="currentColor"/></svg>';

let lang = 'en', ready = false, running = false, loadPromise = null, raf = 0, lastT = 0;
let renderer, scene, camera, controls, sunLight;
const bodies = []; // every body (sun, planets, moons): { d, parent, anchor, tilt, spin, overlay, mat, angle, w, ... }
let focus = null, paused = false;
const anim = { active: false, dist: 130 };

// ------------------------------------------------------------ the face (a shader painted on the front of every body)
const FACE_VERT = `#include <common>
#include <logdepthbuf_pars_vertex>
varying vec3 vL; varying vec3 vVN;
void main(){ vL = normalize(position); vVN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
#include <logdepthbuf_vertex>
}`;
// The face lives in the planet's own frame (local +Z), so it turns with the planet. Carved, ragged-edged, like "The Moon Wakes Up".
const FACE_FRAG = `precision highp float;
#include <logdepthbuf_pars_fragment>
uniform float uEye, uMouth, uLit, uChomp, uSlit; uniform vec3 uLight, uDark, uTeeth;
varying vec3 vL; varying vec3 vVN;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float ell(vec2 q, vec2 e){ return (length(q / e) - 1.0) * min(e.x, e.y); }
vec2 rot(vec2 q, float a){ float c = cos(a), s = sin(a); return vec2(c * q.x - s * q.y, s * q.x + c * q.y); }
void main(){
#include <logdepthbuf_fragment>
  float LIT = mix(clamp(dot(normalize(vVN), uLight) * 0.9 + 0.32, 0.25, 1.0), 1.0, uLit);
  if (vL.z < 0.02) discard;
  vec2 f = vL.xy; f.y += 0.14; // the face sits a little low on the disc, like the real thing
  float rag = (vn(f * 26.0) - 0.5) * 0.024 + (vn(f * 70.0) - 0.5) * 0.009;
  // eyes: grow out of nothing into small dark hollows, set low and close to the mouth
  float es = uEye * (1.0 + 0.3 * sin(uEye * 3.14159));
  vec2 ee = vec2(0.1, 0.058) * max(es, 0.0005);
  vec2 qL = rot(f - vec2(-0.18, 0.2), -0.22), qR = rot(f - vec2(0.18, 0.2), 0.22);
  float dE = min(ell(qL, ee), ell(qR, ee)) + rag; if (uEye < 0.01) dE = 1.0;
  // mouth: starts as a little pout, then opens into a wide laughing bowl edged with tiny teeth
  float sc = max(uMouth * (1.0 + 0.18 * sin(uMouth * 3.14159)), 0.0005); // pops out of nothing, like the eyes
  vec2 g = vec2(f.x, -0.27 + (f.y + 0.27) / sc) / vec2(sc, 1.0);
  float W = 0.6, ax = abs(g.x) / W;
  float top = -0.04 + 0.12 * ax * ax;
  float depth = 0.46 * mix(0.8, 1.0, uChomp) * pow(max(0.0, 1.0 - ax * ax), 0.6);
  float bot = top - depth;
  float dm = (max(max(g.y - top, bot - g.y), (ax - 1.0) * W) + rag * 1.2) * sc;
  float N = 46.0, t = (g.x + W) / (2.0 * W) * N;
  float tri = 1.0 - abs(2.0 * fract(t) - 1.0), tri2 = 1.0 - abs(2.0 * fract(t + 0.5) - 1.0);
  float tl = 0.04 * (0.5 + 0.5 * sqrt(max(0.0, 1.0 - ax * ax)));
  float teethU = step(top - tl * tri, g.y), teethB = step(g.y, bot + tl * 0.8 * tri2);
  float insE = 1.0 - smoothstep(-0.004, 0.004, dE), insM = (1.0 - smoothstep(-0.004, 0.004, dm)) * step(0.01, uMouth);
  float ins = max(insE, insM);
  vec3 col = uDark * mix(1.5, 0.3, clamp(-min(dE, dm) * 6.0, 0.0, 1.0));
  float teeth = max(teethU, teethB) * insM;
  col = mix(col, uTeeth * (0.5 + 0.5 * LIT) * (0.75 + 0.25 * max(tri, tri2)), teeth);
  float edge = min(dE, dm);
  // carved rim: dark crack all around, a faint bright lip on the lower side
  float crack = (1.0 - ins) * 0.7 * smoothstep(0.05, 0.0, edge);
  float a = max(ins, crack) * uSlit;
  gl_FragColor = vec4(col * (1.0 + 0.0), a);
}`;

// ------------------------------------------------------------ building the system
const world = new THREE.Vector3();
function makeBody(d, parent, texSize) {
  const anchor = new THREE.Group(), tilt = new THREE.Group(); tilt.rotation.z = d.tilt ?? 0; anchor.add(tilt);
  const map = new THREE.CanvasTexture(paint(d, texSize, texSize / 2)); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
  const seg = d.r > 1 ? [72, 48] : [48, 32];
  const geo = new THREE.SphereGeometry(d.r, seg[0], seg[1]);
  const material = d.id === 'sun' ? new THREE.MeshBasicMaterial({ map }) : new THREE.MeshStandardMaterial({ map, roughness: 0.95, metalness: 0, ...(ROCKY.has(d.kind) ? { bumpMap: map, bumpScale: 2.2 } : {}) });
  const mesh = new THREE.Mesh(geo, material); tilt.add(mesh);
  const f = d.face ?? {};
  const fm = new THREE.ShaderMaterial({ vertexShader: FACE_VERT, fragmentShader: FACE_FRAG, transparent: true, depthWrite: false,
    uniforms: { uEye: { value: 0 }, uMouth: { value: 0 }, uChomp: { value: 0 }, uSlit: { value: 0 }, uLit: { value: d.id === 'sun' ? 1 : 0 }, uLight: { value: new THREE.Vector3(0, 0, 1) },
      uDark: { value: new THREE.Vector3(...(f.dark ?? [0.03, 0.025, 0.025])) }, uTeeth: { value: f.teeth ? new THREE.Vector3(...f.teeth) : (() => { const c = new THREE.Color(d.color); return new THREE.Vector3(c.r, c.g, c.b).multiplyScalar(1.25); })() } } });
  const overlay = new THREE.Mesh(new THREE.SphereGeometry(d.r * 1.006, seg[0], seg[1]), fm); mesh.add(overlay);
  const b = { d, parent, anchor, tilt, mesh, overlay, fm, angle: Math.random() * Math.PI * 2, w: 0, awake: false, blink: 2 + Math.random() * 4, bounce: 0, phase: Math.random() * 6.28, wasAwake: false, moons: [] };
  if (ATMO[d.kind]) {
    const am = new THREE.ShaderMaterial({ vertexShader: ATMO_VERT, fragmentShader: ATMO_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uCol: { value: new THREE.Vector3(...ATMO[d.kind]) } } });
    mesh.add(new THREE.Mesh(new THREE.SphereGeometry(d.r * 1.07, 48, 32), am));
  }
  if (d.rings) {
    const rg = new THREE.RingGeometry(d.r * 1.35, d.r * 2.45, 96, 1), pos = rg.attributes.position, uv = rg.attributes.uv, v = new THREE.Vector3();
    for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); uv.setXY(i, (v.length() - d.r * 1.35) / (d.r * 1.1), 0.5); }
    const rt = new THREE.CanvasTexture(ringTexture()); rt.colorSpace = THREE.SRGBColorSpace;
    const ring = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({ map: rt, side: THREE.DoubleSide, transparent: true, depthWrite: false })); ring.rotation.x = Math.PI / 2; tilt.add(ring);
  }
  bodies.push(b); return b;
}

async function init() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  scene = new THREE.Scene(); scene.background = new THREE.Color(0x03040c);
  camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 1500);
  scene.add(new THREE.AmbientLight(0xffffff, 0.62));
  sunLight = new THREE.PointLight(0xfff1d6, 3.2, 0, 0); scene.add(sunLight);
  // stars
  const n = 1800, sp = new Float32Array(n * 3), sc = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const r = 450 + Math.random() * 300, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1); sp.set([r * Math.sin(ph) * Math.cos(th), r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], i * 3); const c = 0.6 + Math.random() * 0.4; sc.set([c, c, c * (0.85 + Math.random() * 0.15)], i * 3); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('color', new THREE.BufferAttribute(sc, 3));
  scene.add(new THREE.Points(sg, new THREE.PointsMaterial({ size: 2, sizeAttenuation: false, vertexColors: true })));

  const total = BODIES.length + BODIES.reduce((a, b) => a + (b.moons?.length ?? 0), 0); let done = 0;
  const tick = async () => { ui.bar.style.width = `${Math.round((++done / total) * 100)}%`; await new Promise((r) => setTimeout(r, 0)); };
  for (const d of BODIES) {
    const b = makeBody(d, null, d.r > 1.5 ? 768 : 512); scene.add(b.anchor); await tick();
    if (d.id === 'sun') { sunLight.position.set(0, 0, 0); const glow = makeGlow(d.r); b.anchor.add(glow); }
    else { // orbit ring
      const pts = []; for (let i = 0; i <= 128; i++) { const a = (i / 128) * Math.PI * 2; pts.push(new THREE.Vector3(Math.cos(a) * d.orbit, 0, Math.sin(a) * d.orbit)); }
      scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), new THREE.LineBasicMaterial({ color: 0x8ab4ff, transparent: true, opacity: 0.16 })));
    }
    for (const md of d.moons ?? []) { const m = makeBody({ ...md, orbit: md.dist, tilt: 0, spin: 0.4 }, b, 384); b.anchor.add(m.anchor); b.moons.push(m); await tick(); }
  }
  controls = new OrbitControls(camera, canvas);
  controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.09; controls.rotateSpeed = 0.8; controls.zoomSpeed = 1.0; controls.maxDistance = 330; controls.minDistance = 6;
  controls.addEventListener('start', () => { anim.active = false; ui.card.classList.add('mini'); }); // touching the space tucks the card away
  camera.position.set(0, 62, 128); controls.update();
  buildChips(); bind(); resize();
  if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__space = { get camera() { return camera; }, get controls() { return controls; }, bodies, focusOn };
  ready = true; ui.loading.classList.add('done');
}

function makeGlow(r) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), g = x.createRadialGradient(128, 128, 10, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,230,150,.85)'); g.addColorStop(0.35, 'rgba(255,160,40,.35)'); g.addColorStop(1, 'rgba(255,120,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 256, 256);
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true })); s.scale.setScalar(r * 5); return s;
}

// ------------------------------------------------------------ enter / leave / resize
export async function enter() {
  running = true; ui.loading.classList.remove('done');
  loadPromise ??= init().catch((e) => { console.error(e); ui.loading.querySelector('p').textContent = 'Oops! Please reload.'; });
  await loadPromise; if (!ready || !running) return;
  setLang(lang); resize(); lastT = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
}
export function leave() { running = false; cancelAnimationFrame(raf); speechSynthesis?.cancel(); }

function resize() {
  if (!renderer) return; const w = root.clientWidth, h = root.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}

// ------------------------------------------------------------ the loop
const tmp = new THREE.Vector3(), tmp2 = new THREE.Vector3(), lightV = new THREE.Vector3();
const fq = new THREE.Quaternion(), fm4 = new THREE.Matrix4(), fz = new THREE.Vector3(), fx = new THREE.Vector3(), fy = new THREE.Vector3(), fup = new THREE.Vector3(), fw = new THREE.Vector3();
function faceCamera(b, k) { // rotate the planet so its face (local +Z) looks at the camera, with the eyes level
  b.tilt.getWorldQuaternion(fq).invert(); b.anchor.getWorldPosition(fw);
  fz.copy(camera.position).sub(fw).normalize().applyQuaternion(fq);
  fup.set(0, 1, 0).applyQuaternion(fq); fx.crossVectors(fup, fz);
  if (fx.lengthSq() < 1e-6) fx.set(1, 0, 0); fx.normalize(); fy.crossVectors(fz, fx);
  fq.setFromRotationMatrix(fm4.makeBasis(fx, fy, fz)); b.mesh.quaternion.slerp(fq, k);
}
function frame(now) {
  if (!running) return;
  raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  const ts0 = paused ? 0 : 1;
  for (const b of bodies) {
    const d = b.d, ts = b.parent && focus && (focus === b || focus === b.parent) ? ts0 * 0.2 : ts0; // calmer moons while you look at them
    if (d.id !== 'sun') {
      const omega = b.parent ? d.w : 0.09 * Math.pow(19 / d.orbit, 1.2);
      b.angle += omega * dt * ts;
      b.anchor.position.set(Math.cos(b.angle) * d.orbit, 0, Math.sin(b.angle) * d.orbit);
    }
    if (b.turning > 0) { // Wake up was pressed: turn the face round to look at the user
      b.turning -= dt; faceCamera(b, 1 - Math.exp(-dt * 4.5));
    } else if (b.parent && !b.awake && b.w < 0.01) b.mesh.rotation.y = -b.angle - Math.PI / 2; // moons are tidally locked (like ours) while asleep
    else b.mesh.rotateY((d.spin ?? 0.3) * (focus === b || b.awake ? 0.06 : 1) * dt * ts);
  }
  // faces: appear when the card's Wake up button is pressed, and disappear again on Sleep
  camera.updateMatrixWorld(); const vm = camera.matrixWorldInverse;
  for (const b of bodies) {
    b.anchor.getWorldPosition(world);
    b.w = Math.min(1, Math.max(0, b.w + (b.awake ? dt / 2.2 : -dt / 1.6))); // a face appears slowly, and fades away again when told to sleep
    if (b.w > 0.5 && !b.wasAwake) { b.wasAwake = true; b.bounce = 1; } if (b.w < 0.2) b.wasAwake = false;
    const u = b.fm.uniforms;
    u.uSlit.value = b.w > 0.01 ? 1 : 0; u.uEye.value = u.uMouth.value = THREE.MathUtils.smoothstep(b.w, 0.05, 0.6); u.uChomp.value = THREE.MathUtils.smoothstep(0.5 + 0.5 * Math.sin(now / 1500 + b.phase), 0.05, 0.95);
    lightV.copy(world).negate().normalize().transformDirection(vm); u.uLight.value.copy(lightV);
    b.bounce = Math.max(0, b.bounce - dt * 1.6); const s = 1 + 0.12 * Math.sin(b.bounce * Math.PI); b.mesh.scale.setScalar(s);
  }
  // camera follows the focused body as it travels
  const goal = focus ? (focus.anchor.getWorldPosition(tmp2), tmp2) : tmp2.set(0, 0, 0);
  const k = 1 - Math.exp(-dt * 7); tmp.copy(goal).sub(controls.target).multiplyScalar(k);
  controls.target.add(tmp); camera.position.add(tmp);
  if (anim.active) {
    const dir = tmp.copy(camera.position).sub(controls.target), cur = dir.length();
    if (anim.faceParent && focus?.parent) { focus.parent.anchor.getWorldPosition(tmp2); tmp2.sub(controls.target).setY(0).normalize().setY(0.28).normalize(); dir.normalize().lerp(tmp2, 1 - Math.exp(-dt * 2.5)).multiplyScalar(cur); }
    const nd = anim.settled ? cur : cur + (anim.dist - cur) * (1 - Math.exp(-dt * 3));
    camera.position.copy(controls.target).addScaledVector(dir.normalize(), nd); if (Math.abs(nd - anim.dist) < anim.dist * 0.01) { anim.settled = true; if (!anim.faceParent) anim.active = false; }
  }
  controls.rotateSpeed = 0.5 + 0.4 * Math.min(1, camera.position.distanceTo(controls.target) / 60);
  controls.update();
  renderer.render(scene, camera);
}

// ------------------------------------------------------------ focus, card, chips
const nm = (b) => b.d[lang];
function focusOn(b) {
  focus = b; anim.active = true; anim.faceParent = false;
  if (b) {
    const reach = Math.max(b.d.r * (b.parent ? 6 : 4.5), ...(b.moons?.map((m) => m.d.orbit * 1.5) ?? [0]));
    anim.faceParent = !!b.parent; anim.settled = false; // a moon: look at it from its planet's side, so we meet its face
    anim.dist = Math.min(reach, 90); controls.minDistance = b.d.r * 1.8; showCard(b);
  } else { anim.dist = 130; controls.minDistance = 6; ui.card.classList.remove('open'); }
  refreshChips();
}
function showCard(b) {
  const t = T[lang]; ui.name.textContent = nm(b); ui.fact.textContent = b.d.fact[lang]; ui.stat.textContent = b.d.stat?.[lang] ?? '';
  ui.moons.innerHTML = b.moons.length ? `<span>${t.moons}:</span>` + b.moons.map((m) => `<button type="button" class="moon-chip" data-id="${m.d.id}">${m.d[lang]}</button>`).join('') : '';
  ui.moons.querySelectorAll('.moon-chip').forEach((el) => el.addEventListener('click', () => focusOn(bodies.find((x) => x.d.id === el.dataset.id))));
  wakeLabel(b); ui.card.classList.remove('mini'); ui.card.classList.add('open');
}
function wakeLabel(b = focus) { if (b) $('#sc-wake-l').textContent = b.awake ? T[lang].sleep : T[lang].wake; }
const CHIPS = BODIES.flatMap((d) => (d.id === 'earth' ? [d, d.moons[0]] : [d])); // our Moon gets its own button
function buildChips() {
  ui.chips.innerHTML = CHIPS.map((d) => `<button type="button" class="chip" data-id="${d.id}">${d[lang]}</button>`).join('');
  ui.chips.querySelectorAll('.chip').forEach((el) => el.addEventListener('click', () => { const b = bodies.find((x) => x.d.id === el.dataset.id); focusOn(focus === b ? null : b); }));
}
function refreshChips() { ui.chips.querySelectorAll('.chip').forEach((el) => el.classList.toggle('on', !!focus && (focus.d.id === el.dataset.id || (focus.parent?.d.id === el.dataset.id && !CHIPS.some((c) => c.id === focus.d.id))))); }

function setLang(l) {
  lang = l; const t = T[l];
  document.querySelectorAll('#view-space .lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === l));
  ui.title.textContent = t.title; $('#sc-speak-l').textContent = t.say; $('#sc-close-l').textContent = t.close;
  ui.chips.querySelectorAll('.chip').forEach((el) => { el.textContent = CHIPS.find((d) => d.id === el.dataset.id)[l]; });
  if (focus) showCard(focus); speechSynthesis?.cancel();
}
function speak() {
  if (!focus || !('speechSynthesis' in window)) return; speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(`${nm(focus)}. ${focus.d.fact[lang]}`); u.lang = T[lang].speech; u.rate = 0.85; speechSynthesis.speak(u);
}

// ------------------------------------------------------------ input: tap to choose (generous for tiny moons)
const proj = new THREE.Vector3();
function pick(cx, cy) {
  const r = canvas.getBoundingClientRect(); let best = null, bestScore = Infinity;
  for (const b of bodies) {
    b.anchor.getWorldPosition(world); proj.copy(world).project(camera); if (proj.z > 1) continue;
    const sx = r.left + ((proj.x + 1) / 2) * r.width, sy = r.top + ((1 - proj.y) / 2) * r.height, dist = camera.position.distanceTo(world);
    const pr = (b.d.r * r.height) / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * dist), hit = Math.max(pr, 22), dd = Math.hypot(cx - sx, cy - sy);
    if (dd <= hit) { const score = dd / hit + dist * 0.002; if (score < bestScore) { bestScore = score; best = b; } }
  }
  return best;
}
let bound = false;
function bind() {
  if (bound) return; bound = true;
  let down = null, pointers = 0, multi = false;
  canvas.addEventListener('pointerdown', (e) => { pointers++; if (pointers > 1) { multi = true; down = null; } else { multi = false; down = { x: e.clientX, y: e.clientY, t: performance.now() }; } });
  const up = (e, cancelled) => {
    pointers = Math.max(0, pointers - 1);
    if (!cancelled && down && !multi && performance.now() - down.t < 700 && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 10) { const b = pick(e.clientX, e.clientY); if (b) focusOn(b); else if (focus) focusOn(null); }
    if (!pointers) { down = null; multi = false; }
  };
  canvas.addEventListener('pointerup', (e) => up(e, false)); canvas.addEventListener('pointercancel', (e) => up(e, true));
  ui.card.addEventListener('click', () => { if (ui.card.classList.contains('mini')) ui.card.classList.remove('mini'); });
  $('#sc-wake').addEventListener('click', () => { if (!focus) return; focus.awake = !focus.awake; if (focus.awake) focus.turning = 1.6; wakeLabel(); });
  $('#sc-speak').addEventListener('click', speak); $('#sc-close').addEventListener('click', () => focusOn(null));
  ui.pause.addEventListener('click', () => { paused = !paused; ui.pause.innerHTML = paused ? PLAY_ICON : PAUSE_ICON; ui.pause.classList.toggle('on', paused); });
  $('#btn-sreset').addEventListener('click', () => { focusOn(null); anim.dist = 130; anim.active = true; camera.position.set(0, 62, 128).multiplyScalar(1); });
  document.querySelectorAll('#view-space .lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  new ResizeObserver(resize).observe(root);
}
