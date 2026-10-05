// Isaac's storm lab: a 3D neighbourhood you can run a tornado (EF0–EF5) or a storm (shower → derecho) through.
// One finger drags the storm across the map; two fingers turn / pinch the camera. Wind follows real vortex physics (Burgers–Rott),
// and every house part, car, tree, fence and pole lets go at roughly the wind speed where it fails in real life.
import * as THREE from '../vendor/three.module.min.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { TORNADO, STORM, HURRICANE } from './storms/levels.js';
import { buildWorld, MATERIAL } from './storms/world.js';
import { createVortex } from './storms/vortex.js';
import { createSky, createClouds, createRain, createLightning, createShelf, createGustDust } from './storms/sky.js';
import { createDebris } from './storms/debris.js';

const $ = (s) => document.querySelector(s);
const root = $('#view-storm'), canvas = $('#storm-canvas');
const ui = { loading: $('#storm-loading'), card: $('#storm-card'), name: $('#stc-name'), stat: $('#stc-stat'), desc: $('#stc-desc'), chips: $('#storm-chips'), hud: $('#storm-hud'), title: $('#storm-title') };
const T = {
  en: { title: 'Tornadoes & Storms', tornado: 'Tornado', storm: 'Storm', hurricane: 'Hurricane', say: 'Say it', winds: 'Winds', about: 'About', of: 'of tornadoes', hit: 'Buildings hit', cars: 'Cars moved', debris: 'Flying', wind: 'Wind', speech: 'en-US', hail: 'Hail', mph: 'mph', kmh: 'km/h', slow: 'Slow motion', sound: 'Sound', follow: 'Follow', reset: 'Rebuild the neighborhood', look: 'One finger: move the storm', hint: 'Drag your finger on the ground to move the storm', lookAlt: 'One finger: look around' },
  es: { title: 'Tornados y tormentas', tornado: 'Tornado', storm: 'Tormenta', hurricane: 'Huracán', say: 'Escucha', winds: 'Vientos', about: 'Cerca del', of: 'de los tornados', hit: 'Edificios dañados', cars: 'Autos movidos', debris: 'Volando', wind: 'Viento', speech: 'es-ES', hail: 'Granizo', mph: 'mph', kmh: 'km/h', slow: 'Cámara lenta', sound: 'Sonido', follow: 'Seguir', reset: 'Reconstruir el barrio', look: 'Un dedo: mover la tormenta', hint: 'Arrastra el dedo por el suelo para mover la tormenta', lookAlt: 'Un dedo: mirar alrededor' },
};
const GS = 2048, MPH = 0.44704, FOV = 48, AREA = 262, CELL = 130, RING = 75, CLOUD_BASE = 162;
const V = THREE.Vector3;

let lang = 'en', mode = 'tornado', levelIdx = 2, ready = false, running = false, loadPromise = null, raf = 0, lastT = 0, simT = 0;
let shelf, gust, streaks, marker, renderer, scene, camera, controls, hemi, sun, sky, clouds, rain, lightning, vortex, debris, ambient, world, hailMesh, ground, groundCtx, groundTex;
let sunBase = 0.9, fogFar = 1500, scarDirty = false, scarT = 0, cardTimer = 0, follow = true, steer = true, slowmo = false, soundOn = false, frameN = 0, hudT = 0, flash = 0, thunderQ = [];
const S = { finger: null, x: -105, z: 22, vx: 0, vz: 0, tx: 0, tz: 0, hasTarget: false, touch: 0, rc: 17, vmax: 55, lean: new THREE.Vector2(), lastStamp: new V(1e9, 0, 1e9) };
const hail = { pos: null, vel: null, life: null, ptr: 0, N: 260 };

const LEVELS = { tornado: TORNADO, storm: STORM, hurricane: HURRICANE };
const level = () => LEVELS[mode][levelIdx];
const RM = 95; // hurricane eyewall radius (m): the calm eye lies inside it

// ------------------------------------------------------------------ the wind field
const wk = new V();
function windAt(x, y, z, o, t) {
  const L = level(), dx = x - S.x, dz = z - S.z, r = Math.hypot(dx, dz), g = 1 + 0.06 * Math.sin(t * 1.9 + x * 0.05) * Math.cos(t * 1.3 + z * 0.04);
  if (mode === 'tornado') {
    const rr = Math.max(r, 0.8), rc = S.rc, vt = S.touch * S.vmax * 1.4 * (rc / rr) * (1 - Math.exp(-1.256 * (rr / rc) ** 2)) / (1 + (rr / (9 * rc)) ** 2);
    const inflow = -0.32 * vt * (rr > rc ? 1 : rr / rc);
    const up = S.touch * S.vmax * 0.55 * Math.exp(-((rr / (1.4 * rc)) ** 2)) * (0.7 + 0.3 * Math.min(1, y / 18));
    const trans = Math.exp(-((rr / (5 * rc)) ** 2)) * 0.8;
    return o.set(((dz / rr) * vt + (dx / rr) * inflow + S.vx * trans) * g, up * g, ((-dx / rr) * vt + (dz / rr) * inflow + S.vz * trans) * g);
  }
  if (mode === 'hurricane') { // Holland-style: calm eye, a ring of the strongest wind (the eyewall), slowly weaker farther out, spiralling inward
    const rr = Math.max(r, 1), x = rr / RM, vt = x < 1 ? S.vmax * x * x : (S.vmax * x ** -0.6) / (1 + (rr / (6 * RM)) ** 2) * 1.03;
    const inflow = -0.28 * vt * Math.min(1, x), up = S.vmax * 0.22 * Math.exp(-(((rr - RM) / (0.45 * RM)) ** 2)) * (0.6 + 0.4 * Math.min(1, y / 18));
    return o.set(((dz / rr) * vt + (dx / rr) * inflow + S.vx * 0.5) * g, up * g, ((-dx / rr) * vt + (dz / rr) * inflow + S.vz * 0.5) * g);
  }
  // storm: a downburst — wind blows outward from the storm, strongest around the rain core, plus a forward gust front
  const rr = Math.max(r, 1), out = S.vmax * (rr / RING) * Math.exp(1 - rr / RING), sp = Math.hypot(S.vx, S.vz) || 1, hx = S.vx / sp || 0.8, hz = S.vz / sp || 0.2;
  const fwd = 0.45 * S.vmax * Math.exp(-((rr / 170) ** 2));
  return o.set(((dx / rr) * out * 0.7 + hx * fwd) * g, -0.12 * out * Math.exp(-((rr / 40) ** 2)), ((dz / rr) * out * 0.7 + hz * fwd) * g);
}
const windMph = (x, y, z, t) => windAt(x, y, z, wk, t).length() / MPH;

// ------------------------------------------------------------------ building the scene
async function init() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
  scene = new THREE.Scene(); scene.fog = new THREE.Fog(0x56635d, 320, 1500);
  camera = new THREE.PerspectiveCamera(FOV, 1, 1, 3400);
  hemi = new THREE.HemisphereLight(0xaab4b8, 0x3f4a34, 0.95); scene.add(hemi);
  sun = new THREE.DirectionalLight(0xfff0d8, 0.9); sun.position.set(-110, 170, 80); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); scene.add(sun.target);
  Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150, near: 20, far: 480 }); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.4; scene.add(sun);

  sky = createSky(); scene.add(sky.mesh);
  clouds = createClouds(); scene.add(clouds.group);
  rain = createRain(); scene.add(rain.mesh);
  shelf = createShelf(); scene.add(shelf.mesh); gust = createGustDust(); scene.add(gust.mesh);
  streaks = { N: 1400, p: new Float32Array(1400 * 3), geo: new THREE.BufferGeometry(), v: new Float32Array(1400 * 3) };
  streaks.geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(1400 * 6), 3)); streaks.geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(1400 * 6), 3));
  streaks.mesh = new THREE.LineSegments(streaks.geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); streaks.mesh.frustumCulled = false; streaks.mesh.renderOrder = 7; scene.add(streaks.mesh);
  for (let i = 0; i < streaks.N; i++) streaks.p.set([(Math.random() - 0.5) * 220, 1 + Math.random() * 45, (Math.random() - 0.5) * 220], i * 3);
  lightning = createLightning(scene);
  vortex = createVortex(CLOUD_BASE - 6); scene.add(vortex.group);
  marker = new THREE.Mesh(new THREE.RingGeometry(0.82, 1, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8, depthWrite: false, side: THREE.DoubleSide })); marker.rotation.x = -Math.PI / 2; marker.visible = false; marker.renderOrder = 9; scene.add(marker);

  // ground: a repaintable canvas (grass + the scar the tornado leaves) in the middle, plain grass beyond
  const gc = document.createElement('canvas'); gc.width = gc.height = GS; groundCtx = gc.getContext('2d'); paintGrass(groundCtx, GS, 3);
  groundTex = new THREE.CanvasTexture(gc); groundTex.colorSpace = THREE.SRGBColorSpace; groundTex.anisotropy = 4;
  ground = new THREE.Mesh(new THREE.PlaneGeometry(AREA * 2, AREA * 2), new THREE.MeshStandardMaterial({ map: groundTex, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  const fc = document.createElement('canvas'); fc.width = fc.height = 512; paintGrass(fc.getContext('2d'), 512, 5);
  const ft = new THREE.CanvasTexture(fc); ft.colorSpace = THREE.SRGBColorSpace; ft.wrapS = ft.wrapT = THREE.RepeatWrapping; ft.repeat.set(70, 70); ft.anisotropy = 4;
  const far = new THREE.Mesh(new THREE.PlaneGeometry(6000, 6000), new THREE.MeshStandardMaterial({ map: ft, roughness: 1 })); far.rotation.x = -Math.PI / 2; far.position.y = -0.06; scene.add(far);

  await new Promise((r) => setTimeout(r, 30));
  world = buildWorld(scene);
  for (const b of world.bodies) { const s = [b.size.x, b.size.y, b.size.z].sort((a, c) => a - c); b.mid = Math.min(3, s[1] / 2); b.axisVec = new V(b.axis === 0 ? 1 : 0, b.axis === 1 ? 1 : 0, b.axis === 2 ? 1 : 0); if (b.kind === 'car') b.k = 0.0075, b.friction = 0.75; }
  debris = createDebris(scene, 1400); ambient = createDebris(scene, 600); ambient.mesh.castShadow = false;
  // hailstones
  const hg = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 8, 6), new THREE.MeshStandardMaterial({ color: 0xf2f6fa, roughness: 0.35 }), hail.N); hg.frustumCulled = false; hg.castShadow = false; hailMesh = hg; scene.add(hg);
  hail.pos = new Float32Array(hail.N * 3); hail.vel = new Float32Array(hail.N * 3); hail.life = new Float32Array(hail.N);
  const z0 = new THREE.Matrix4().makeScale(0, 0, 0); for (let i = 0; i < hail.N; i++) hg.setMatrixAt(i, z0);

  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.dampingFactor = 0.08; controls.enablePan = false; controls.minDistance = 16; controls.maxDistance = 1500; controls.maxPolarAngle = 1.5; controls.rotateSpeed = 0.7;
  applySteer(); controls.addEventListener('start', () => ui.card.classList.add('mini'));
  camera.position.set(S.x + 90, 95, S.z + 250); controls.target.set(S.x, 30, S.z); controls.update();
  buildChips(); bind(); resize(); chooseLevel(mode, levelIdx, true);
  if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__storm = { get S() { return S; }, get world() { return world; }, get debris() { return debris; }, get camera() { return camera; }, get controls() { return controls; }, windAt, chooseLevel, get hail() { return hail; }, windMph, reset: resetWorld };
  ready = true; ui.loading.classList.add('done');
}

function paintGrass(c, n, seed) {
  c.fillStyle = '#5d8740'; c.fillRect(0, 0, n, n);
  let s = seed; const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 9000 * (n / 1024) ** 2; i++) { const x = rnd() * n, y = rnd() * n, l = 6 + rnd() * 18, a = rnd() * 6.28; c.strokeStyle = `hsla(${88 + rnd() * 24}, ${30 + rnd() * 25}%, ${24 + rnd() * 22}%, .22)`; c.lineWidth = 1 + rnd() * 3; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); }
}
function stampScar(x, z, r, strength) {
  if (!groundCtx) return; const px = ((x + AREA) / (AREA * 2)) * GS, py = ((z + AREA) / (AREA * 2)) * GS, pr = (r / (AREA * 2)) * GS;
  const g = groundCtx.createRadialGradient(px, py, pr * 0.2, px, py, pr); g.addColorStop(0, `rgba(78,56,34,${0.42 * strength})`); g.addColorStop(0.7, `rgba(88,66,40,${0.26 * strength})`); g.addColorStop(1, 'rgba(88,66,40,0)');
  groundCtx.fillStyle = g; groundCtx.beginPath(); groundCtx.arc(px, py, pr, 0, 7); groundCtx.fill(); scarDirty = true;
}

// ------------------------------------------------------------------ levels
function chooseLevel(m, idx, first) {
  mode = m; levelIdx = idx; const L = level();
  resetWorld();
  S.touch = 0; S.vmax = L.vmax * MPH; if (m === 'tornado') S.rc = L.rc; if (m === 'hurricane') S.rc = RM;
  vortex.group.visible = m === 'tornado'; clouds.wall.m.visible = m === 'tornado';
  // cloud look per kind of storm: supercell = pinwheel with a dense core · storm = ragged · hurricane = spiral bands around a clear eye
  const preset = m === 'hurricane' ? { R: [1250, 1100, 950, 800], spiral: 1, arms: 3, pitch: 5.5, rot: 0.1, eye: RM * 0.75, core: 0, dark: [0.05, 0.12, 0.2, 0.4] } : m === 'tornado' ? { R: [760, 620, 480, 170], spiral: 0.75, arms: 2, pitch: 3.5, rot: 0.22, eye: 0, core: 0.9 } : { R: [760, 620, 480, 170], spiral: 0.12, arms: 2, pitch: 3, rot: 0.1, eye: 0, core: 0.15 };
  clouds.layers.forEach((l, i) => { const u = l.U; u.uR.value = preset.R[i]; u.uSpiral.value = preset.spiral; u.uArms.value = preset.arms; u.uPitch.value = preset.pitch; u.uRot.value = preset.rot * (1 + i * 0.15); u.uEyeR.value = i === 3 ? 0 : preset.eye; u.uCore.value = preset.core; u.uDark.value = preset.dark?.[i] ?? [0.5, 0.7, 0.85, 1][i]; });
  if (m === 'hurricane') clouds.layers[3].m.visible = true;
  const dark = m === 'tornado' ? 1 : L.cloud; clouds.layers.forEach((l) => (l.U.uCover.value = m === 'tornado' ? 1 : 0.35 + 0.65 * L.cloud));
  clouds.layers.forEach((l) => (l.U.uGreen.value = m === 'tornado' || idx >= 2 ? 0.7 : 0));
  rain.U.uRain.value = m === 'tornado' ? 0.55 : L.rain; sky.u.uTop.value.set(m === 'tornado' ? 0x27322f : m === 'hurricane' ? 0x1a232c : idx < 1 ? 0x4a5a68 : 0x1c2430); sky.u.uHor.value.set(m === 'tornado' ? 0x57665d : idx < 1 ? 0x93a3ae : 0x4c5a66);
  scene.fog.color.copy(sky.u.uHor.value); fogFar = m === 'storm' && idx < 1 ? 2000 : 1500;
  hemi.intensity = m === 'tornado' ? 0.95 : 1.15 - 0.25 * L.cloud; sunBase = m === 'tornado' ? 0.55 : 1.0 - 0.7 * L.cloud; sun.intensity = sunBase;
  if (m === 'storm') { S.x = -95; S.z = 0; S.vx = S.vz = 0; S.touch = 1; } else if (m === 'hurricane') { S.x = -165; S.z = 10; S.vx = S.vz = 0; S.touch = 1; } else { S.x = -105; S.z = 22; S.vx = S.vz = 0; }
  S.hasTarget = false; S.lean.set(0, 0); S.lastStamp.set(1e9, 0, 1e9);
  rain.U.uStorm.value.set(S.x, S.z);
  if (!first) { controls.target.set(S.x, 28, S.z); const k = m === 'hurricane' ? 2.6 : 1; camera.position.set(S.x + 90 * k, 95 * k, S.z + 250 * k); }
  refreshUI();
}
function resetWorld() {
  if (!world) return; for (const b of world.bodies) {
    b.mesh.position.copy(b.pos0); b.mesh.quaternion.copy(b.q0); b.mesh.visible = true; b.dead = false; b.loose = b.kind === 'car'; b.vel.set(0, 0, 0); b.ang.set(0, 0, 0); b.age = 0;
  }
  for (const h of world.houses) { h.damaged = h.roofGone = h.wallGone = false; h.acc = 0; }
  debris?.clear(); ambient?.clear(); lightning?.clear(); if (hail.life) { hail.life.fill(0); const z0 = new THREE.Matrix4().makeScale(0, 0, 0); for (let i = 0; i < hail.N; i++) hailMesh.setMatrixAt(i, z0); hailMesh.instanceMatrix.needsUpdate = true; }
  if (groundCtx) { paintGrass(groundCtx, GS, 3); groundTex.needsUpdate = true; }
}

// ------------------------------------------------------------------ physics of the neighbourhood
const wv = new V(), qa = new THREE.Quaternion(), ax = new V(), dv = new V(), upv = new V(0, 1, 0), qs = new THREE.Quaternion(), p3 = new V();
let spawnBudget = 0;
const emit = (type, ...a) => (type === 4 || type === 5 ? ambient : debris).spawn(type, ...a);
function burst(b, list, f = 1) { for (const [type, n] of list) for (let i = 0; i < Math.ceil(n * f); i++) spawnFrom(b, type); }
function spawnFrom(b, type, dmul = 1) {
  if (spawnBudget <= 0) return; spawnBudget--;
  const m = b.mesh.position, s = b.size;
  emit(type, m.x + (Math.random() - 0.5) * s.x * 0.8, Math.max(0.3, m.y + (Math.random() - 0.5) * s.y * 0.8), m.z + (Math.random() - 0.5) * s.z * 0.8,
    b.vel.x * 0.6 + (Math.random() - 0.5) * 6 * dmul, b.vel.y * 0.4 + 1 + Math.random() * 4 * dmul, b.vel.z * 0.6 + (Math.random() - 0.5) * 6 * dmul);
}
function release(b, t) {
  windAt(b.mesh.position.x, b.mesh.position.y, b.mesh.position.z, wv, t);
  b.loose = true; b.age = 0; b.vel.copy(wv).multiplyScalar(0.18); b.ang.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(3);
  const h = b.house; if (h) { h.damaged = true; if (b.kind === 'roof') h.roofGone = true; if (b.kind === 'wallF' || b.kind === 'wallB' || b.kind === 'wallS') h.wallGone = true; }
  if (b.shatter.length) burst(b, b.shatter.map(([ty, n]) => [ty, Math.max(1, n * 0.3)]));
}
function shatter(b) { burst(b, b.shatter); b.dead = true; b.mesh.visible = false; }
function updateBodies(dt, t) {
  spawnBudget = 90; const farR = mode === 'tornado' ? 9 * S.rc + 100 : mode === 'hurricane' ? 700 : 380, farR2 = farR * farR; const wh = Math.max(0.02, dt);
  for (const b of world.bodies) {
    if (b.dead) continue; const m = b.mesh;
    if (!b.loose) {
      const ph = b.pos0, h = b.house, fdx = ph.x - S.x, fdz = ph.z - S.z; if (fdx * fdx + fdz * fdz > farR2) continue;
      windAt(ph.x, b.base ? 5 : Math.min(ph.y, 8), ph.z, wv, t); const ms = wv.length(), mph = ms / MPH;
      if (b.fail) {
        let ok = true; if (h) { if (b.kind === 'furn') ok = h.wallGone; if (b.kind === 'slab') ok = h.wallGone && h.roofGone; }
        const hf = h ? (b.kind !== 'roof' && h.roofGone ? 0.88 : 1) * (h.wallGone ? 0.9 : 1) : 1;
        if (ok && mph > b.fail * hf) { release(b, t); continue; }
      }
      if (b.base) { // trees and poles bend in the wind
        const sw = Math.min(0.6, ms * (b.kind === 'pole' ? 0.0035 : 0.0125)) * (0.6 + 0.4 * Math.sin(t * 2.3 + (b.phase ?? 0))) + (b.kind === 'pole' ? 0 : Math.min(0.08, ms * 0.0022) * Math.sin(t * 8 + (b.phase ?? 0) * 3));
        const hl = Math.hypot(wv.x, wv.z) || 1; ax.set(-wv.z / hl, 0, wv.x / hl); qa.setFromAxisAngle(ax, sw); m.quaternion.copy(qa); dv.copy(b.pivot).applyQuaternion(qa); m.position.copy(b.base).add(dv);
      }
      // shingles peel off roofs, leaves and twigs tear off trees well before anything breaks
      if (b.kind === 'roof' && mph > 64) { b.shed = (b.shed ?? 0) + (mph - 64) * 0.16 * dt; while (b.shed > 1) { b.shed--; if (spawnBudget > 0) { spawnBudget--; emit(2, ph.x + (Math.random() - 0.5) * b.size.x, ph.y + b.size.y * 0.5, ph.z + (Math.random() - 0.5) * b.size.z, wv.x * 0.2, 2 + Math.random() * 2, wv.z * 0.2); } } }
      if (b.kind === 'tree' && b.leaf !== false && mph > 36) { b.shed = (b.shed ?? 0) + (mph - 36) * 0.09 * dt; while (b.shed > 1) { b.shed--; if (spawnBudget > 0) { spawnBudget--; emit(Math.random() < 0.08 ? 8 : 4, ph.x + (Math.random() - 0.5) * 4, 4 + Math.random() * 5, ph.z + (Math.random() - 0.5) * 4, wv.x * 0.3, 1, wv.z * 0.3); } } }
      continue;
    }
    // ---- loose: drag from the wind, gravity, ground friction, tumbling
    b.age += dt; const pos = m.position;
    windAt(pos.x, pos.y, pos.z, wv, t);
    const rx = wv.x - b.vel.x, ry = wv.y - b.vel.y, rz = wv.z - b.vel.z, rl = Math.hypot(rx, ry, rz);
    let a_x = b.k * rl * rx, a_y = b.k * rl * ry - 9.8, a_z = b.k * rl * rz;
    ax.copy(b.axisVec).applyQuaternion(m.quaternion); const c = Math.abs(ax.y), hy = b.rest * c + b.mid * Math.sqrt(Math.max(0, 1 - c * c));
    const onGround = pos.y <= hy + 0.05, mu = b.friction ?? 0.5;
    if (onGround) {
      if (a_y < 0) { a_y = 0; if (b.vel.y < 0) b.vel.y = 0; }
      const vh = Math.hypot(b.vel.x, b.vel.z), ah = Math.hypot(a_x, a_z);
      if (vh < 0.25 && ah < mu * 9.8) { b.vel.x = b.vel.z = 0; a_x = a_z = 0; }
      else if (vh > 0.05) { a_x -= (b.vel.x / vh) * mu * 9.8; a_z -= (b.vel.z / vh) * mu * 9.8; }
    }
    b.vel.x += a_x * dt; b.vel.y += a_y * dt; b.vel.z += a_z * dt;
    const sp = b.vel.length(); if (sp > 85) b.vel.multiplyScalar(85 / sp);
    pos.x += b.vel.x * dt; pos.y += b.vel.y * dt; pos.z += b.vel.z * dt;
    if (pos.y < hy) {
      const impact = -b.vel.y; pos.y = hy;
      if (impact > 2.5) { b.vel.y = impact * 0.22; b.vel.x *= 0.85; b.vel.z *= 0.85; b.ang.multiplyScalar(0.6).add(ax.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(impact * 0.15)); } else b.vel.y = 0;
      if (b.shatter.length && b.age > 0.3 && impact > (b.kind === 'slab' ? 16 : 10)) { shatter(b); continue; }
    }
    // the wind tears flimsy flying parts apart in the strongest gusts
    if (b.shatter.length && !onGround && b.age > 0.5 && rl > 48 && Math.random() < dt * 0.5) { shatter(b); continue; }
    if (!onGround) {
      const rate = Math.min(6, Math.max(0.6, rl * 0.07)) * (b.kind === 'car' ? 0.45 : b.kind === 'slab' ? 0.3 : 1), len = b.ang.length();
      if (len < 0.1) b.ang.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5); b.ang.multiplyScalar(1 + (rate / Math.max(b.ang.length(), 0.01) - 1) * Math.min(1, dt * 1.5));
      ax.copy(b.ang).normalize(); qa.setFromAxisAngle(ax, b.ang.length() * dt); m.quaternion.premultiply(qa);
    } else { // lie flat: turn the thinnest side to face up
      b.ang.multiplyScalar(Math.exp(-dt * 5)); ax.copy(b.axisVec).applyQuaternion(m.quaternion); const sgn = ax.y >= 0 ? 1 : -1; qs.setFromUnitVectors(ax, dv.set(0, sgn, 0)); qa.identity().slerp(qs, Math.min(1, dt * 5)); m.quaternion.premultiply(qa);
      if (b.slide && b.kind === 'car') { /* cars keep their wheels where they land */ }
    }
    if (pos.x > 600 || pos.x < -600 || pos.z > 600 || pos.z < -600) { b.dead = true; m.visible = false; }
  }
  void wh;
}

// the tornado also scoops up dirt and grass at its base, and hail rains down in storms
function updateWindVisuals(dt, L) {
  streaks.mesh.visible = mode !== 'tornado'; if (mode === 'tornado') { shelf.mesh.visible = false; gust.mesh.visible = false; return; }
  const ps = streaks.p, pos = streaks.geo.attributes.position.array, col = streaks.geo.attributes.color.array, cx = controls.target.x, cz = controls.target.z;
  for (let i = 0; i < streaks.N; i++) {
    const i3 = i * 3; let x = ps[i3], y = ps[i3 + 1], z = ps[i3 + 2];
    if (Math.abs(x - cx) > 115 || Math.abs(z - cz) > 115 || Math.random() < dt * 0.15) { x = cx + (Math.random() - 0.5) * 220; z = cz + (Math.random() - 0.5) * 220; y = 1 + Math.random() * 45; }
    windAt(x, y, z, wv, simT); const sp = wv.length(), len = Math.min(0.2, 0.05 + sp * 0.003);
    x += wv.x * dt * 0.9; y += wv.y * dt * 0.9; z += wv.z * dt * 0.9; if (y < 0.5) y = 0.5 + Math.random() * 30; ps[i3] = x; ps[i3 + 1] = y; ps[i3 + 2] = z;
    const o = i * 6, c = Math.min(0.32, Math.max(0, (sp - 8) / 90));
    pos[o] = x; pos[o + 1] = y; pos[o + 2] = z; pos[o + 3] = x - wv.x * len; pos[o + 4] = y - wv.y * len; pos[o + 5] = z - wv.z * len;
    col[o] = col[o + 1] = col[o + 2] = c; col[o + 3] = col[o + 4] = col[o + 5] = 0;
  }
  streaks.geo.attributes.position.needsUpdate = true; streaks.geo.attributes.color.needsUpdate = true;
  // roll cloud and ground dust around a storm's gust front
  const isStorm = mode !== 'tornado', hur = mode === 'hurricane', big = isStorm ? Math.min(1, Math.max(0, (L.vmax - 30) / 50)) : 0;
  shelf.mesh.visible = isStorm && L.vmax >= 40; shelf.U.uF0.value = hur ? 1.0 : 1.16; shelf.U.uF1.value = hur ? 0.5 : -0.16; shelf.mesh.position.set(S.x, 0, S.z); shelf.U.uTime.value = simT; shelf.U.uAmt.value = 0.4 + 0.6 * big; shelf.U.uR.value = hur ? RM * 1.05 : RING * 2.0; shelf.U.uBase.value = hur ? 0 : 30 + 25 * (1 - big); shelf.U.uH.value = hur ? 200 : 60 + 30 * big;
  gust.mesh.visible = isStorm && L.vmax >= 30; gust.mesh.position.set(S.x, 0, S.z); gust.U.uTime.value = simT; gust.U.uAmt.value = 0.18 + 0.6 * big; gust.U.uRing.value = hur ? RM * 1.1 : RING; gust.U.uPixel.value = canvas.height / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
}
function updateWeatherParticles(dt, t) {
  const L = level();
  if (mode === 'tornado' && S.touch > 0.6) {
    const n = (levelIdx + 1) * 5 * dt * 1.2 + Math.random() * 0.6; for (let i = 0; i < n && i < 14; i++) { const a = Math.random() * 6.28, r = S.rc * (0.4 + Math.random() * 1.4); emit(Math.random() < 0.7 ? 5 : 4, S.x + Math.cos(a) * r, 0.3, S.z + Math.sin(a) * r, 0, 3 + Math.random() * 4, 0); }
  }
  if (mode !== 'tornado' && L.vmax > 18) {
    let n = (L.vmax - 18) * 0.4 * dt; while (n > 0 && (n >= 1 || Math.random() < n)) { n--; const a = Math.random() * 6.28, r = Math.random() * (mode === 'hurricane' ? 300 : CELL); ambient.spawn(Math.random() < 0.85 ? 4 : 5, S.x + Math.cos(a) * r, 1 + Math.random() * 6, S.z + Math.sin(a) * r, 0, 1.5, 0); }
  }
  if (mode === 'storm' && L.hail > 0) {
    const sz = Math.max(0.1, (L.hailSize ?? 0.02) * 4), rate = 130 * L.hail;
    let n = rate * dt; while (n > 0 && (n >= 1 || Math.random() < n)) { n--; const i = hail.ptr; hail.ptr = (hail.ptr + 1) % hail.N; const a = Math.random() * 6.28, r = Math.sqrt(Math.random()) * CELL * 0.8; hail.pos.set([S.x + Math.cos(a) * r, 70 + Math.random() * 40, S.z + Math.sin(a) * r], i * 3); hail.vel.set([0, -8, 0], i * 3); hail.life[i] = 6; }
  }
  const m4 = new THREE.Matrix4(), sc = new V(), q = new THREE.Quaternion(), zero = new THREE.Matrix4().makeScale(0, 0, 0), size = Math.max(0.1, (L.hailSize ?? 0.02) * 4);
  for (let i = 0; i < hail.N; i++) {
    if (hail.life[i] <= 0) continue; const i3 = i * 3; windAt(hail.pos[i3], hail.pos[i3 + 1], hail.pos[i3 + 2], wv, t);
    hail.vel[i3] += (wv.x - hail.vel[i3]) * 0.8 * dt; hail.vel[i3 + 2] += (wv.z - hail.vel[i3 + 2]) * 0.8 * dt; hail.vel[i3 + 1] = Math.max(-34, hail.vel[i3 + 1] - 9.8 * dt);
    hail.pos[i3] += hail.vel[i3] * dt; hail.pos[i3 + 1] += hail.vel[i3 + 1] * dt; hail.pos[i3 + 2] += hail.vel[i3 + 2] * dt;
    if (hail.pos[i3 + 1] < size) { hail.pos[i3 + 1] = size; if (hail.vel[i3 + 1] < -3) { hail.vel[i3 + 1] *= -0.45; hail.vel[i3] *= 0.7; hail.vel[i3 + 2] *= 0.7; } else { hail.vel[i3 + 1] = 0; hail.life[i] -= dt * 2.2; } }
    hail.life[i] -= dt * 0.3; hailMesh.setMatrixAt(i, hail.life[i] > 0 ? m4.compose(p3.set(hail.pos[i3], hail.pos[i3 + 1], hail.pos[i3 + 2]), q, sc.setScalar(size)) : zero);
  }
  hailMesh.instanceMatrix.needsUpdate = true;
  // lightning
  const rate = mode === 'tornado' ? 0.06 : (L.lightning ?? 0); if (rate > 0 && Math.random() < rate * dt) {
    const a = Math.random() * 6.28, r = Math.random() * (mode === 'hurricane' ? 380 : CELL * 0.9), x = S.x + Math.cos(a) * r, z = S.z + Math.sin(a) * r; lightning.strike(x, z, 190); thunderQ.push({ at: simT + Math.hypot(x - camera.position.x, z - camera.position.z) / 340 * 0.6, big: Math.min(1, 1 - Math.hypot(x - camera.position.x, z - camera.position.z) / 600) });
  }
}

// ------------------------------------------------------------------ main loop
const lean = new THREE.Vector2();
function frame(now) {
  if (!running) return; raf = requestAnimationFrame(frame);
  const raw = Math.min(0.05, (now - lastT) / 1000); lastT = now; const dt = raw * (slowmo ? 0.22 : 1); simT += dt; frameN++;
  // move the storm toward the finger (it keeps coasting a little when you let go)
  const vmaxSpeed = mode === 'hurricane' ? 26 : 55; if (S.finger) { const p = groundPoint(S.finger); if (p) { S.tx = THREE.MathUtils.clamp(p.x, -AREA, AREA); S.tz = THREE.MathUtils.clamp(p.z, -AREA, AREA); S.hasTarget = true; } }
  if (S.hasTarget) { dv.set(S.tx - S.x, 0, S.tz - S.z); const d = dv.length(); if (d > 0.4) { dv.multiplyScalar(Math.min(vmaxSpeed, d * 3.2) / d); const kk = Math.min(1, dt * 7); S.vx += (dv.x - S.vx) * kk; S.vz += (dv.z - S.vz) * kk; } else { S.vx *= Math.exp(-dt * 2); S.vz *= Math.exp(-dt * 2); } }
  else { S.vx *= Math.exp(-dt * 1.4); S.vz *= Math.exp(-dt * 1.4); }
  S.x = THREE.MathUtils.clamp(S.x + S.vx * dt, -AREA, AREA); S.z = THREE.MathUtils.clamp(S.z + S.vz * dt, -AREA, AREA);
  const L = level();
  if (mode === 'tornado') { S.touch = Math.min(1, S.touch + dt / 4.5); S.rc += (L.rc - S.rc) * Math.min(1, dt * 0.9); S.vmax += (L.vmax * MPH - S.vmax) * Math.min(1, dt * 0.9); }
  else { S.touch = 1; S.vmax += (L.vmax * MPH - S.vmax) * Math.min(1, dt * 0.9); S.rc = mode === 'hurricane' ? RM : S.rc; }
  updateBodies(dt, simT); debris.update(dt, windAt, simT); ambient.update(dt, windAt, simT); updateWeatherParticles(dt, simT);
  // tornado path scar on the ground
  if (mode === 'tornado' && S.touch > 0.85 && Math.hypot(S.x - S.lastStamp.x, S.z - S.lastStamp.z) > S.rc * 0.35) { stampScar(S.x, S.z, S.rc * 1.5, Math.min(1, 0.4 + levelIdx * 0.15)); S.lastStamp.set(S.x, 0, S.z); }
  // visuals
  lean.set(S.vx, S.vz).multiplyScalar(2.2); if (lean.length() > 42) lean.setLength(42); S.lean.lerp(lean, Math.min(1, dt * 1.2));
  const pix = canvas.height / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)));
  vortex.group.position.set(S.x, 0, S.z); vortex.update(simT, { rc: S.rc, vmax: S.vmax / MPH }, S.touch, S.lean, pix, 0.0);
  const cx = S.x + (mode === 'tornado' ? S.lean.x : 0), cz = S.z + (mode === 'tornado' ? S.lean.y : 0);
  flash = lightning.update(raw) ;
  for (const l of clouds.layers) { l.U.uTime.value = simT; l.U.uCenter.value.set(cx, cz); l.U.uCamY.value = camera.position.y; l.U.uFlash.value = flash; }
  clouds.layers.forEach((l, i) => { l.m.material.uniforms.uAlpha.value = [0.8, 0.9, 0.95, 1][i] * (mode === 'tornado' ? 1 : 0.3 + 0.7 * L.cloud); });
  const eyeF = mode === 'hurricane' ? 1 - THREE.MathUtils.smoothstep(Math.hypot(controls.target.x - S.x, controls.target.z - S.z), RM * 0.5, RM * 1.1) : 0;
  sky.u.uFlash.value = flash * 0.7; hemi.intensity = (mode === 'tornado' ? 0.95 : 1.15 - 0.25 * (L.cloud ?? 1)) + flash * 2.2 + eyeF * 0.55; sun.intensity = sunBase + eyeF * 0.9;
  rain.U.uTime.value = simT; rain.U.uCenter.value.set(controls.target.x, 0, controls.target.z); rain.U.uStorm.value.set(S.x, S.z); rain.U.uCell.value = mode === 'tornado' ? 150 : mode === 'hurricane' ? 560 : CELL * 1.1; rain.U.uHole.value = mode === 'hurricane' ? RM * 0.62 : 0;
  windAt(controls.target.x, 10, controls.target.z, wv, simT); rain.U.uWind.value.set(wv.x, wv.z);
  updateWindVisuals(dt, L);
  // a ring on the ground shows where the finger is sending the storm
  if (S.finger && S.hasTarget) { marker.visible = true; marker.position.set(S.tx, 0.4, S.tz); marker.scale.setScalar(4 + 1.2 * Math.sin(simT * 6) + (mode === 'tornado' ? S.rc * 0.5 : 8)); } else marker.visible = false;
  // camera follows the storm (but stays put while a finger is steering, so the map doesn't slide under it)
  if (follow && !S.finger) { dv.set(S.x, 30, S.z).sub(controls.target).multiplyScalar(Math.min(1, dt * 2.6 + 0.02)); controls.target.add(dv); camera.position.add(dv); }
  controls.update();
  if (camera.position.y < 3) camera.position.y = 3;
  { const cd = camera.position.distanceTo(controls.target); scene.fog.near = Math.max(320, cd * 0.9); scene.fog.far = fogFar + cd * 3; controls.rotateSpeed = THREE.MathUtils.clamp(cd / 250, 0.5, 1.1); }
  if (scarDirty && simT - scarT > 0.2) { groundTex.needsUpdate = true; scarDirty = false; scarT = simT; }
  sun.position.set(controls.target.x - 110, 170, controls.target.z + 80); sun.target.position.set(controls.target.x, 0, controls.target.z); sun.target.updateMatrixWorld();
  if (frameN % 3 === 0) renderer.shadowMap.needsUpdate = true;
  renderer.render(scene, camera);
  audioFrame(); thunderFrame();
  hudT -= raw; if (hudT <= 0) { hudT = 0.3; updateHud(); }
}

// ------------------------------------------------------------------ UI
function stats() {
  const hit = world.houses.filter((h) => h.damaged).length, moved = world.bodies.filter((b) => b.kind === 'car' && (b.dead || b.mesh.position.distanceToSquared(b.pos0) > 6)).length;
  return { hit, moved, total: world.houses.length };
}
function updateHud() {
  const t = T[lang], s = stats(), mph = Math.round(windMph(S.x + (mode === 'tornado' ? level().rc * 0.9 : 70), 4, S.z + 0.01, simT) / 5) * 5;
  const peak = Math.round(S.vmax / MPH);
  ui.hud.innerHTML = `<b>${t.wind}</b> ${peak} ${t.mph} · ${Math.round(peak * 1.609)} ${t.kmh}<br>${t.hit} <b>${s.hit}/${s.total}</b> · ${t.cars} <b>${s.moved}</b> · ${t.debris} <b>${debris.active}</b>`; void mph;
}
function refreshUI() {
  const t = T[lang], L = level(), isT = mode === 'tornado', list = LEVELS[mode];
  document.querySelectorAll('#storm-type button').forEach((b) => b.classList.toggle('on', b.dataset.mode === mode));
  ui.chips.innerHTML = list.map((l, i) => `<button type="button" class="chip lvl${i === levelIdx ? ' on' : ''}" data-i="${i}"><b>${l.short}</b><span>${l.label[lang]}</span></button>`).join('');
  ui.chips.querySelectorAll('.chip').forEach((el) => el.addEventListener('click', () => { const i = +el.dataset.i; if (i === levelIdx) { ui.card.classList.toggle('mini'); return; } chooseLevel(mode, i); ui.card.classList.remove('mini'); }));
  ui.name.textContent = `${isT || mode === 'hurricane' ? L.short + ' · ' : ''}${L.label[lang]}`;
  const mph = lang === 'es' ? L.mphEs ?? L.mph : L.mph, kmh = lang === 'es' ? L.kmhEs ?? L.kmh : L.kmh;
  ui.stat.textContent = `${t.winds}: ${mph} ${t.mph} (${kmh} ${t.kmh})` + (isT ? ` · ${t.about} ${lang === 'es' ? L.shareEs ?? L.share : L.share} ${t.of}` : '');
  ui.desc.textContent = L.desc[lang]; ui.card.classList.add('open'); clearTimeout(cardTimer); cardTimer = setTimeout(() => ui.card.classList.add('mini'), 9000);
  document.querySelector('#storm-type [data-mode=tornado]').textContent = t.tornado; document.querySelector('#storm-type [data-mode=storm]').textContent = t.storm; document.querySelector('#storm-type [data-mode=hurricane]').textContent = t.hurricane;
  $('#storm-hint').textContent = t.hint; ui.title.textContent = t.title; $('#stc-speak-l').textContent = t.say;
  $('#btn-slow').setAttribute('aria-label', t.slow); $('#btn-sound').setAttribute('aria-label', t.sound); $('#btn-follow').setAttribute('aria-label', t.follow); $('#btn-srebuild').setAttribute('aria-label', t.reset); $('#btn-steer').setAttribute('aria-label', steer ? t.look : t.lookAlt);
}
function buildChips() { refreshUI(); }
function setLang(l) { lang = l; document.querySelectorAll('#view-storm .lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === l)); refreshUI(); speechSynthesis?.cancel(); }
function speak() { if (!('speechSynthesis' in window)) return; speechSynthesis.cancel(); const L = level(), u = new SpeechSynthesisUtterance(`${L.short && mode !== 'storm' ? L.short + '. ' : ''}${L.label[lang]}. ${L.desc[lang]}`); u.lang = T[lang].speech; u.rate = 0.9; speechSynthesis.speak(u); }

// ------------------------------------------------------------------ input
const ray = new THREE.Raycaster(), plane = new THREE.Plane(new V(0, 1, 0), 0), ndc = new THREE.Vector2(), hit = new V();
function groundPoint(e) {
  const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
  if (!ray.ray.intersectPlane(plane, hit)) return null; return hit;
}
function applySteer() {
  const T0 = THREE.TOUCH, M0 = THREE.MOUSE;
  controls.touches = { ONE: steer ? -1 : T0.ROTATE, TWO: T0.DOLLY_ROTATE }; controls.mouseButtons = { LEFT: steer ? -1 : M0.ROTATE, MIDDLE: M0.DOLLY, RIGHT: M0.ROTATE };
}
let bound = false;
function bind() {
  if (bound) return; bound = true; const pointers = new Set();
  const setTarget = (e) => { const p = groundPoint(e); if (p) { S.tx = THREE.MathUtils.clamp(p.x, -AREA, AREA); S.tz = THREE.MathUtils.clamp(p.z, -AREA, AREA); S.hasTarget = true; } };
  canvas.addEventListener('pointerdown', (e) => { $('#storm-hint').classList.add('gone'); pointers.add(e.pointerId); if (steer && pointers.size === 1 && (e.pointerType !== 'mouse' || e.button === 0)) { S.finger = { clientX: e.clientX, clientY: e.clientY }; setTarget(e); ui.card.classList.add('mini'); } else { S.hasTarget = false; S.finger = null; } });
  canvas.addEventListener('pointermove', (e) => { if (steer && pointers.size === 1 && pointers.has(e.pointerId) && (e.pointerType !== 'mouse' || e.buttons & 1)) { S.finger = { clientX: e.clientX, clientY: e.clientY }; setTarget(e); } });
  const up = (e) => { pointers.delete(e.pointerId); S.finger = null; if (!pointers.size) S.hasTarget = false; };
  canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  document.querySelectorAll('#storm-type button').forEach((b) => b.addEventListener('click', () => { if (b.dataset.mode !== mode) { chooseLevel(b.dataset.mode, b.dataset.mode === 'storm' ? 1 : 2); ui.card.classList.remove('mini'); } }));
  document.querySelectorAll('#view-storm .lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  $('#stc-speak').addEventListener('click', speak); $('#stc-close').addEventListener('click', () => ui.card.classList.add('mini'));
  ui.card.addEventListener('click', (e) => { if (!e.target.closest('button') && ui.card.classList.contains('mini')) ui.card.classList.remove('mini'); });
  const tog = (id, fn) => $(id).addEventListener('click', () => fn($(id)));
  tog('#btn-slow', (b) => { slowmo = !slowmo; b.classList.toggle('on', slowmo); });
  tog('#btn-follow', (b) => { follow = !follow; b.classList.toggle('on', follow); }); $('#btn-follow').classList.add('on');
  tog('#btn-steer', (b) => { steer = !steer; b.classList.toggle('on', !steer); applySteer(); refreshUI(); });
  tog('#btn-srebuild', () => chooseLevel(mode, levelIdx));
  tog('#btn-sound', (b) => { soundOn = !soundOn; b.classList.toggle('on', soundOn); if (soundOn) startAudio(); else stopAudio(); });
  new ResizeObserver(resize).observe(root);
}

// ------------------------------------------------------------------ sound (opt-in): wind, rumble, rain and thunder made with Web Audio
let ac = null, au = null;
function noiseBuf(sec, brown) { const b = ac.createBuffer(1, ac.sampleRate * sec, ac.sampleRate), d = b.getChannelData(0); let l = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; l = brown ? (l + 0.02 * w) / 1.02 : w; d[i] = brown ? l * 3.5 : w; } return b; }
function startAudio() {
  try {
    ac ??= new (window.AudioContext || window.webkitAudioContext)(); ac.resume();
    if (!au) {
      const mk = (buf, type, freq, q) => { const s = ac.createBufferSource(); s.buffer = buf; s.loop = true; const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = ac.createGain(); g.gain.value = 0; s.connect(f).connect(g).connect(ac.destination); s.start(); return { f, g }; };
      au = { wind: mk(noiseBuf(3, false), 'bandpass', 500, 0.6), rumble: mk(noiseBuf(4, true), 'lowpass', 140, 0.7), rain: mk(noiseBuf(2, false), 'highpass', 3500, 0.4) };
    }
  } catch { soundOn = false; $('#btn-sound').classList.remove('on'); }
}
function stopAudio() { if (au) for (const k of Object.values(au)) k.g.gain.setTargetAtTime(0, ac.currentTime, 0.1); }
function audioFrame() {
  if (!soundOn || !au) return; const t = ac.currentTime, d = Math.hypot(camera.position.x - S.x, camera.position.y * 0.6, camera.position.z - S.z), near = THREE.MathUtils.clamp(1 - d / 380, 0.12, 1), v = S.vmax / MPH / 220;
  au.wind.g.gain.setTargetAtTime(Math.min(0.5, (0.06 + v * 0.6) * near * S.touch), t, 0.2); au.wind.f.frequency.setTargetAtTime(250 + v * 900 + 80 * Math.sin(simT), t, 0.2);
  au.rumble.g.gain.setTargetAtTime(mode === 'tornado' ? Math.min(0.9, (0.2 + v * 1.4) * near * S.touch) : 0.12 * near, t, 0.3);
  au.rain.g.gain.setTargetAtTime(rain.U.uRain.value * 0.12 * near, t, 0.3);
}
function thunderFrame() {
  while (thunderQ.length && thunderQ[0].at <= simT) { const th = thunderQ.shift(); if (!soundOn || !ac) continue;
    const s = ac.createBufferSource(); s.buffer = noiseBuf(3, true); const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 220; const g = ac.createGain(), t = ac.currentTime;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.9 * Math.max(0.2, th.big), t + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.8); s.connect(f).connect(g).connect(ac.destination); s.start(); }
}

// ------------------------------------------------------------------ enter / leave / resize
export async function enter() {
  running = true; ui.loading.classList.remove('done');
  loadPromise ??= init().catch((e) => { console.error(e); ui.loading.querySelector('p').textContent = 'Oops! Please reload.'; });
  await loadPromise; if (!ready || !running) return;
  setLang(lang); resize(); lastT = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
}
export function leave() { running = false; cancelAnimationFrame(raf); speechSynthesis?.cancel(); if (soundOn) { soundOn = false; $('#btn-sound').classList.remove('on'); stopAudio(); } }
function resize() { if (!renderer) return; const w = root.clientWidth, h = root.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
void MATERIAL;
