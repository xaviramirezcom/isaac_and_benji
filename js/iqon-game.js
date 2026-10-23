// Isaac's IQON: a procedural 3D of the IQON tower in Quito (BIG, 2023) and a disaster lab: earthquake, storm, tornado, tsunami, bomb (tap the tower), missile, implosion, rebuild.
// Every box of the tower is an instance with its own debris physics. Built in code, no downloaded models.
import * as THREE from '../vendor/three.module.min.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import { buildSkin as buildF16, NOZ1 as F16_LEN } from './f16.js';
const view = document.querySelector('#view-iqon');

// ---------------------------------------------------------------- the building, in metres
// IQON's facade is a grid of concrete cells (floor, ceiling and side walls, glazed at the front) that are pulled in and out like drawers by 0 to 4.5 m,
// in waves that run diagonally across the facade. The two base floors are flush glass on columns; the three top floors are an open stack of taller frames with planting.
const BAY = 3.3, NX = 11, NZ = 6, W = NX * BAY, D = NZ * BAY;
const FH = 3.55, BASE = [5.6, 4.6], FLOORS = 32, CROWN = 3, CROWN_H = 5.2, SLAB = 0.5;
const yOf = (f) => (f < 2 ? (f === 0 ? 0 : BASE[0]) : BASE[0] + BASE[1] + (f - 2) * FH);
const hOf = (f) => (f < 2 ? BASE[f] : f >= FLOORS - CROWN ? CROWN_H : FH);
const BODY_TOP = yOf(FLOORS - CROWN), TOP = BODY_TOP + CROWN * CROWN_H;
const hash = (a, b, c) => { let h = (a * 374761393 + b * 668265263 + c * 2246822519) >>> 0; h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const WAVE = [0, 1.5, 3, 4.5, 3, 1.5, 0, 0];
function depthOf(side, i, f) {
  if (f < 2) return 0;
  const r = hash(side, i, f);
  let d = WAVE[(i * 2 + f + side * 3) % WAVE.length];
  if (r < 0.22) d = WAVE[Math.floor(hash(side, f, i + 1) * WAVE.length)];
  if (f >= FLOORS - CROWN) d = r < 0.5 ? 3 : r < 0.75 ? 4.5 : 1.5;
  return d;
}
const crownHas = (side, i, f) => hash(side + 9, i, f) < 0.62;

const canvas = document.getElementById('iqon-canvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
const SKY = new THREE.Color(0x9fc6e9), SKY_NIGHT = new THREE.Color(0x0f1a2e), SKY_STORM = new THREE.Color(0x3b4653);
scene.background = SKY.clone(); scene.fog = new THREE.Fog(SKY.clone(), 500, 1400);
const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.55;
const sun = new THREE.DirectionalLight(0xfff2dc, 2.6); sun.position.set(-180, 320, 160); sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096); sun.shadow.camera.left = sun.shadow.camera.bottom = -220; sun.shadow.camera.right = sun.shadow.camera.top = 220; sun.shadow.camera.near = 50; sun.shadow.camera.far = 900; sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.3;
scene.add(sun); const hemi = new THREE.HemisphereLight(0xcfe6ff, 0x4f6b3a, 0.7); scene.add(hemi);

const concrete = new THREE.MeshStandardMaterial({ color: 0xd3cfc5, roughness: 0.88, metalness: 0 });
const concreteDark = new THREE.MeshStandardMaterial({ color: 0x8f8c84, roughness: 0.95 });
const glassLit = new THREE.MeshPhysicalMaterial({ color: 0x55707c, roughness: 0.1, metalness: 0.25, envMapIntensity: 1.6, clearcoat: 1, clearcoatRoughness: 0.05, emissive: 0xffd9a0, emissiveIntensity: 0 });
const rail = new THREE.MeshPhysicalMaterial({ color: 0xbfd3da, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.45, envMapIntensity: 1.2, depthWrite: false });
const leaf = new THREE.MeshStandardMaterial({ color: 0x3f7a3a, roughness: 0.9 });
const trunk = new THREE.MeshStandardMaterial({ color: 0x5a4330, roughness: 1 });

// every box is an instance; `items` remembers where each one belongs so it can fly off as debris and be put back
const box = new THREE.BoxGeometry(1, 1, 1), UP = new THREE.Vector3(0, 1, 0);
const lists = { concrete: [], concreteDark: [], glass: [], rail: [], leaf: [], trunk: [], siteConcrete: [], siteLeaf: [], siteTrunk: [] };
const items = [], M = new THREE.Matrix4();
let tagNow = 'cell';
const add = (list, x, y, z, sx, sy, sz, ry = 0) => {
  const q = new THREE.Quaternion().setFromAxisAngle(UP, ry), it = { list, idx: lists[list].length, pos: new THREE.Vector3(x, y, z), quat: q, scale: new THREE.Vector3(sx, sy, sz), tag: tagNow, d: null };
  items.push(it); lists[list].push(M.clone().compose(it.pos, q, it.scale));
};

tagNow = 'fixed';
add('glass', 0, BODY_TOP / 2, 0, W - 0.4, BODY_TOP, D - 0.4); items[items.length - 1].big = true;         // the flush glass body
add('concreteDark', 0, TOP / 2 + 0.6, 0, 11, TOP + 1.2, 8); items[items.length - 1].big = true;            // the core
for (let f = 2; f <= FLOORS - CROWN; f++) add('concrete', 0, yOf(f) + SLAB / 2, 0, W + 0.3, SLAB, D + 0.3);
for (let i = 0; i <= NX; i++) for (const s of [-1, 1]) add('concrete', -W / 2 + i * BAY, (BASE[0] + BASE[1]) / 2, s * (D / 2 - 0.05), 0.7, BASE[0] + BASE[1], 0.8);
for (let i = 1; i < NZ; i++) for (const s of [-1, 1]) add('concrete', s * (W / 2 - 0.05), (BASE[0] + BASE[1]) / 2, -D / 2 + i * BAY, 0.8, BASE[0] + BASE[1], 0.7);
add('concrete', 0, BASE[0] + 0.25, 0, W + 3, 0.5, D + 3);
tagNow = 'cell';
for (let f = 2; f < FLOORS; f++) {
  const y = yOf(f), h = hOf(f), crown = f >= FLOORS - CROWN;
  for (let side = 0; side < 4; side++) {
    const n = side < 2 ? NX : NZ, half = side < 2 ? D / 2 : W / 2, sgn = side % 2 ? -1 : 1;
    for (let i = 0; i < n; i++) {
      if (crown && !crownHas(side, i, f)) continue;
      const d = depthOf(side, i, f), along = -(side < 2 ? W : D) / 2 + (i + 0.5) * BAY;
      const place = (list, a, yy, o, sa, sy, so) => { if (side < 2) add(list, a, yy, sgn * o, sa, sy, so); else add(list, sgn * o, yy, a, so, sy, sa); };
      const back = crown ? half - BAY * 0.9 : half - 0.6, depth = half + d - back, out = (half + d + back) / 2;
      place('concrete', along, y + SLAB / 2, out, BAY + 0.02, SLAB, depth);
      place('concrete', along, y + h - 0.18, out, BAY + 0.02, 0.36, depth);
      for (const e of (crown ? [-1, 1] : [1])) place('concrete', along + e * (BAY / 2 - 0.14), y + h / 2, out, 0.28, h, depth);
      if (!crown && i === 0) place('concrete', along - (BAY / 2 - 0.14), y + h / 2, out, 0.28, h, depth);
      if (crown) place('concrete', along, y + h / 2, back + 0.1, BAY, h, 0.2);
      const open = hash(side, i, f + 5) < 0.55 && d >= 1.5, front = half + d - 0.15, gl = open ? front - Math.min(1.5, d) : front;
      place('glass', along, y + h / 2, gl, BAY - 0.5, h - SLAB - 0.4, 0.12);
      if (open) place('rail', along, y + SLAB + 0.55, front, BAY - 0.5, 1.1, 0.06);
      if ((open && hash(side, i, f + 3) < 0.3) || (crown && hash(side, i, f + 3) < 0.5)) {
        const tx = along + (hash(side, i, f + 8) - 0.5) * (BAY - 2.2), tz = gl + (open ? 0.75 : -0.9), th = 1.2 + 1.4 * hash(side, i, f + 9);
        place('concreteDark', tx, y + SLAB + 0.3, tz, 1.1, 0.6, 1.0); place('trunk', tx, y + SLAB + 0.6 + th / 2, tz, 0.14, th, 0.14); place('leaf', tx, y + SLAB + 0.6 + th + 0.5, tz, 1.3 + th * 0.5, 1.2 + th * 0.4, 1.3 + th * 0.5);
      }
    }
  }
}
add('concrete', 0, TOP + 0.15, 0, W - 1, 0.3, D - 1);
for (const [x, z, sx, sz] of [[-8, -3, 14, 6], [7, 4, 12, 5]]) { add('concreteDark', x, TOP + 0.7, z, sx, 0.6, sz); for (let k = 0; k < 4; k++) { const tx = x - sx / 2 + 1.5 + k * (sx - 3) / 3; add('trunk', tx, TOP + 2.2, z, 0.16, 2.4, 0.16); add('leaf', tx, TOP + 4, z, 2.4, 2.2, 2.4); } }

// ---------------------------------------------------------------- the site: the park, the avenue and the neighbours
const ground = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), new THREE.MeshStandardMaterial({ color: 0x6b7f63, roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
const park = new THREE.Mesh(new THREE.PlaneGeometry(520, 420), new THREE.MeshStandardMaterial({ color: 0x5c9a4a, roughness: 1 })); park.rotation.x = -Math.PI / 2; park.position.set(-40, 0.05, 330); park.receiveShadow = true; scene.add(park);
for (const [x, z, w, l] of [[0, 90, 900, 36], [-260, 0, 30, 900], [230, 0, 26, 900]]) { const r = new THREE.Mesh(new THREE.PlaneGeometry(w, l), new THREE.MeshStandardMaterial({ color: 0x4a4a4e, roughness: 1 })); r.rotation.x = -Math.PI / 2; r.position.set(x, 0.1, z); r.receiveShadow = true; scene.add(r); }
tagNow = 'site'; add('siteConcrete', 0, 0.2, 60, W + 60, 0.4, 20);
let seed = 11; const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
tagNow = 'tree';
for (let k = 0; k < 160; k++) { const x = -300 + rnd() * 520, z = 130 + rnd() * 400, th = 6 + rnd() * 10; add('siteTrunk', x, th / 2, z, 0.8, th, 0.8); add('siteLeaf', x, th + 4 + rnd() * 2, z, 9 + rnd() * 8, 8 + rnd() * 7, 9 + rnd() * 8); }
const city = new THREE.Group(); scene.add(city);
const nb = new THREE.MeshStandardMaterial({ color: 0xcfc4b4, roughness: 0.9 }), nbGlass = new THREE.MeshPhysicalMaterial({ color: 0x3b4e5a, roughness: 0.15, metalness: 0.1, clearcoat: 0.8 });
const neighbours = [[-95, -40, 30, 24, 40, 0], [-150, -120, 36, 36, 56, 1], [80, -60, 26, 30, 36, 0], [130, -140, 44, 28, 32, 1], [170, 10, 28, 28, 62, 1], [-80, -170, 28, 22, 26, 0], [60, -190, 36, 36, 22, 0], [-200, 50, 24, 28, 34, 1], [220, -80, 40, 24, 24, 0], [-20, -200, 54, 28, 16, 0], [105, 45, 22, 22, 18, 0], [-135, 70, 22, 32, 22, 1]];
for (const [x, z, w, d, h, g] of neighbours) { const m = new THREE.Mesh(box, g ? nbGlass : nb); m.position.set(x, h / 2, z); m.scale.set(w, h, d); m.castShadow = m.receiveShadow = true; city.add(m); for (let f = 1; f * 3.3 < h; f++) { const s = new THREE.Mesh(box, concrete); s.position.set(x, f * 3.3, z); s.scale.set(w + 0.6, 0.3, d + 0.6); city.add(s); } }
for (let k = 0; k < 90; k++) { const a = rnd() * Math.PI * 2, r = 320 + rnd() * 500, h = 10 + rnd() * 40, w = 18 + rnd() * 30; const m = new THREE.Mesh(box, rnd() < 0.5 ? nb : nbGlass); m.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r - 100); m.scale.set(w, h, w * (0.6 + rnd() * 0.8)); m.rotation.y = rnd(); m.castShadow = m.receiveShadow = true; city.add(m); }
const hills = new THREE.Mesh(new THREE.CylinderGeometry(1500, 1500, 260, 48, 1, true), new THREE.MeshStandardMaterial({ color: 0x4f6a3f, roughness: 1, side: THREE.BackSide })); hills.position.y = 20; scene.add(hills);

const mats = { concrete, concreteDark, glass: glassLit, rail, leaf, trunk, siteConcrete: concrete, siteLeaf: leaf, siteTrunk: trunk };
const inst = {}, building = new THREE.Group(); scene.add(building);
for (const k in lists) { const m = new THREE.InstancedMesh(box, mats[k], lists[k].length); lists[k].forEach((mat, i) => m.setMatrixAt(i, mat)); m.castShadow = m.receiveShadow = true; m.instanceMatrix.needsUpdate = true; m.frustumCulled = false; (k.startsWith('site') ? scene : building).add(m); inst[k] = m; }
const cells = items.filter((it) => it.tag === 'cell'), trees = items.filter((it) => it.tag === 'tree'), bigs = items.filter((it) => it.big), tower = items.filter((it) => (it.tag === 'cell' || it.tag === 'fixed') && !it.big);

// ---------------------------------------------------------------- debris physics: a piece that has come loose keeps its own position, spin and speed
const debris = [], E = new THREE.Euler(), Qd = new THREE.Quaternion(), tmp = new THREE.Vector3();
function loosen(it, vel, spin = 1) {
  if (it.d) return it.d;
  it.d = { it, pos: it.pos.clone(), vel: vel.clone(), rot: new THREE.Euler(0, 0, 0), ang: new THREE.Vector3((Math.random() - 0.5) * spin * 6, (Math.random() - 0.5) * spin * 6, (Math.random() - 0.5) * spin * 6), rest: false, ground: Math.max(it.scale.x, it.scale.y, it.scale.z) * 0.5 };
  debris.push(it.d); return it.d;
}
function writeItem(it, pos, quat) { inst[it.list].setMatrixAt(it.idx, M.compose(pos, quat, it.scale)); inst[it.list].instanceMatrix.needsUpdate = true; }
function stepDebris(dt) {
  for (const d of debris) {
    if (d.rest) continue;
    d.vel.y -= 14 * dt; d.vel.multiplyScalar(1 - 0.12 * dt);
    if (fx.tsunami && water.visible) { const wl = waterLevelAt(d.pos.x, d.pos.z); if (d.pos.y < wl + d.ground) { d.vel.x += (-waveDir.x * 28 - d.vel.x) * 2 * dt; d.vel.z += (-waveDir.y * 28 - d.vel.z) * 2 * dt; d.vel.y += (wl + d.ground - d.pos.y) * 20 * dt; d.vel.y *= 0.9; } }
    if (fx.tornado) { tornadoPull(d, dt); }
    d.pos.addScaledVector(d.vel, dt);
    d.rot.x += d.ang.x * dt; d.rot.y += d.ang.y * dt; d.rot.z += d.ang.z * dt;
    const floor = d.ground + (!fx.imploded && Math.abs(d.pos.x) < W / 2 + 4 && Math.abs(d.pos.z) < D / 2 + 4 ? BASE[0] + 0.5 : 0) + (fx.imploded ? 15 * pile * Math.exp(-(d.pos.x * d.pos.x / (W * W * 0.45) + d.pos.z * d.pos.z / (D * D * 0.9))) : 0);     // pieces land on the canopy over the base, on the ground, or on the growing rubble heap
    if (d.pos.y < floor && d.vel.y < 0) { d.pos.y = floor; d.vel.y = -d.vel.y * 0.25; d.vel.x *= 0.5; d.vel.z *= 0.5; d.ang.multiplyScalar(0.5); if (d.vel.length() < 1.5 && !fx.tsunami) { d.rest = true; d.rot.x = Math.round(d.rot.x / (Math.PI / 2)) * (Math.PI / 2); d.rot.z = Math.round(d.rot.z / (Math.PI / 2)) * (Math.PI / 2); } }
    if (Math.abs(d.pos.x) > 1200 || Math.abs(d.pos.z) > 1200) d.rest = true;
    writeItem(d.it, d.pos, Qd.setFromEuler(d.rot));
  }
}
function rebuild() {
  for (const d of debris) { d.it.d = null; writeItem(d.it, d.it.pos, d.it.quat); }
  debris.length = 0; fx.imploded = false; fx.implode = 0; implodeT = 0; pile = 0; puffs.length = 0; topple = null; for (const it of bigs) writeItem(it, it.pos, it.quat); building.position.set(0, 0, 0); building.quaternion.identity(); city.position.set(0, 0, 0);
  for (const t of trees) writeItem(t, t.pos, t.quat);
}

// ---------------------------------------------------------------- effects
const fx = { quake: 0, storm: 0, tornado: 0, tsunami: 0, implode: 0, imploded: false, t: 0 };
let implodeT = 0, pile = 0;
let shake = 0, lightningT = 0, nextBolt = 2;
const CAPS = {
  quake: 'Earthquake! Quito sits in the Andes, where quakes are common. A tall tower is built to sway like a tree instead of snapping: watch it lean and shed a few loose pieces.',
  storm: 'Storm! Dark clouds, heavy rain, wind in the park trees and lightning. The glass and concrete just get wet: a storm is loud, but a tower this heavy does not mind.',
  tornado: 'Tornado! A spinning funnel of air crosses the park. Inside it the wind is so strong it lifts trees and pulls the loose cells off the facade into a spiral.',
  tsunami: 'Tsunami! (Quito is 2,850 m up in the mountains, so this is pure imagination.) A wall of water sweeps the park and carries the trees away. The tower stands on its deep foundations.',
  bomb: 'Boom! An explosion blows the nearest cells off the facade: a fireball, a cloud of smoke and concrete pieces raining down. Tap anywhere on the tower to choose where it goes off.',
  missile: 'Incoming! A missile streaks in from the horizon with a smoke trail and bursts against the facade.',
  rebuild: 'All fixed: every cell is back in its place.',
};
const btns = [...view.querySelectorAll('.iqon-bar button')];
function setFx(name) { btns.forEach((b) => b.classList.toggle('on', b.dataset.fx === name && name !== 'rebuild')); }
btns.forEach((b) => b.addEventListener('click', () => start(b.dataset.fx)));
// the controls strip: one or two knobs per event
const set = { magnitude: 7, wind: 1, lightning: 1, size: 3, height: 16, from: 'park', power: 2, mpower: 2, count: 1, fall: 'down', chase: 1, jpower: 2 };
const ctl = view.querySelector('.iqon-ctl'), WINDS = ['Breeze', 'Strong', 'Gale', 'Hurricane'], SIZES = ['', 'Small', 'Big', 'Huge'];
const fmt = { magnitude: (v) => v.toFixed(1), wind: (v) => WINDS[v], size: (v) => 'F' + v, height: (v) => v + ' m', power: (v) => SIZES[v], mpower: (v) => SIZES[v], jpower: (v) => SIZES[v] };
ctl.querySelectorAll('input[type=range]').forEach((inp) => { const out = inp.parentElement.querySelector('output'), k = inp.dataset.set; const show = () => { set[k] = +inp.value; out.textContent = fmt[k] ? fmt[k](set[k]) : inp.value; }; inp.addEventListener('input', show); show(); });
ctl.querySelectorAll('.opts').forEach((g) => { const k = g.dataset.set; g.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { g.querySelectorAll('button').forEach((o) => o.classList.toggle('on', o === b)); const v = b.dataset.val; set[k] = isNaN(+v) ? v : +v; })); });
ctl.querySelectorAll('button.act').forEach((b) => b.addEventListener('click', () => jetAction(b.dataset.act)));
ctl.querySelectorAll('button.toggle').forEach((b) => { const k = b.dataset.set; b.addEventListener('click', () => { set[k] = set[k] ? 0 : 1; b.classList.toggle('on', !!set[k]); }); });
function showCtl(name) { let any = false; ctl.querySelectorAll('[data-for]').forEach((d) => { const on = d.dataset.for === name; d.hidden = !on; any ||= on; }); ctl.hidden = !any; }
const POW = { 1: [8, 18], 2: [11, 24], 3: [16, 34] };
const fxJet = { on: false };
let armed = 'bomb', topple = null;
const FALL = { left: [-1, 0], right: [1, 0], front: [0, 1], back: [0, -1] };
function start(name) {
  fx.quake = fx.storm = fx.tornado = fx.tsunami = fx.implode = 0; if (name !== 'rebuild') stopJet(); missiles.forEach((m) => { m.visible = false; }); flights.length = 0; funnel.visible = false; swirl.visible = false; rain.visible = false; water.visible = false; setFx(name);
  showCtl(name); salvo = null; fx.tornadoTarget = null;
  if (name === 'rebuild') rebuild();
  else if (name === 'quake') { fx.quake = 14; }
  else if (name === 'storm') { fx.storm = 30; rain.visible = true; nextBolt = 1.5; }
  else if (name === 'tornado') { fx.tornado = 38; funnel.visible = swirl.visible = true; funnel.position.set(-330, 0, 320); }
  else if (name === 'tsunami') { fx.tsunami = 34; water.visible = true; waveFront = 820; const [dx, dz] = { park: [0, 1], city: [0, -1], left: [-1, 0], right: [1, 0] }[set.from]; waveDir.set(dx, dz); waterG.rotation.y = Math.atan2(dx, dz); }
  else if (name === 'bomb') { armed = 'bomb'; const side = Math.random() < 0.5 ? 1 : -1, horizontal = Math.random() < 0.6; explode(horizontal ? new THREE.Vector3((Math.random() - 0.5) * W * 0.8, 20 + Math.random() * 95, side * (D / 2 + 1)) : new THREE.Vector3(side * (W / 2 + 1), 20 + Math.random() * 95, (Math.random() - 0.5) * D * 0.8), ...POW[set.power]); }
  else if (name === 'missile') { armed = 'missile'; fireSalvo(null); }
  else if (name === 'jet') { startJet(); }
  else if (name === 'implode') { fx.implode = 16; fx.imploded = true; implodeT = 0; topple = null; if (set.fall !== 'down') { const [dx, dz] = FALL[set.fall], d = new THREE.Vector3(dx, 0, dz); topple = { d, pivot: new THREE.Vector3(dx * W / 2, 0, dz * D / 2), axis: new THREE.Vector3().crossVectors(UP, d).normalize(), th: 0, w: 0, broke: false }; } }
}

// --- explosions: a fireball, a shock ring, smoke and flying cells
const fire = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshBasicMaterial({ color: 0xffb347, transparent: true, opacity: 0.9 })); fire.visible = false; scene.add(fire);
const ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.12, 8, 48), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7 })); ring.visible = false; scene.add(ring);
const flash = new THREE.PointLight(0xffc070, 0, 220, 1.5); scene.add(flash);
const smokeMat = new THREE.MeshStandardMaterial({ color: 0x5a5550, transparent: true, opacity: 0.85, roughness: 1 });
const smoke = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), smokeMat, 120); smoke.count = 0; scene.add(smoke);
const puffs = [], booms = [];
function explode(center, radius, power) {
  booms.push({ c: center.clone(), t: 0, r: radius });
  for (const it of cells) { const dist = it.pos.distanceTo(center); if (dist < radius) { const dir = tmp.copy(it.pos).sub(center).normalize(); dir.y += 0.5; loosen(it, dir.normalize().multiplyScalar(power * (0.5 + Math.random()) * (1 - dist / radius * 0.5)), 2); } }
  for (let k = 0; k < 14; k++) puffs.push({ p: center.clone().add(new THREE.Vector3((Math.random() - 0.5) * radius * 0.6, Math.random() * radius * 0.4, (Math.random() - 0.5) * radius * 0.6)), v: new THREE.Vector3((Math.random() - 0.5) * 8, 4 + Math.random() * 8, (Math.random() - 0.5) * 8), s: radius * (0.12 + Math.random() * 0.14), t: 0, life: 3 + Math.random() * 2.5 });
  shake = Math.max(shake, power * 0.08);
}
function stepBooms(dt) {
  for (const b of booms) b.t += dt; while (booms.length && booms[0].t > 1.2) booms.shift();
  const b = booms[booms.length - 1];
  fire.visible = ring.visible = !!b && b.t < 1.0;
  if (b) { const k = Math.min(1, b.t / 0.5); fire.position.copy(b.c); fire.scale.setScalar(2 + b.r * 0.75 * Math.sqrt(k)); fire.material.opacity = 0.95 * (1 - b.t); fire.material.color.setHSL(0.08 - 0.06 * b.t, 1, 0.6 - 0.3 * b.t); ring.position.copy(b.c); ring.scale.setScalar(1 + b.t * b.r * 1.8); ring.material.opacity = 0.6 * (1 - b.t); ring.lookAt(camera.position); flash.position.copy(b.c); flash.intensity = Math.max(0, 1 - b.t * 2) * 6000; } else flash.intensity = 0;
  for (const p of puffs) { p.t += dt; p.v.y += 2 * dt; p.v.multiplyScalar(1 - 0.6 * dt); p.p.addScaledVector(p.v, dt); p.s += dt * 1.1; }
  while (puffs.length && puffs[0].t > puffs[0].life) puffs.shift(); while (puffs.length > 120) puffs.shift();
  smoke.count = puffs.length; puffs.forEach((p, i) => smoke.setMatrixAt(i, M.compose(p.p, Qd.identity(), tmp.setScalar(p.s))));
  smoke.instanceMatrix.needsUpdate = true; smokeMat.opacity = puffs.length ? Math.max(0.1, 0.75 - (puffs[0].t / puffs[0].life) * 0.65) : 0;
}

// --- the missile and its smoke trail
const missile = new THREE.Group(); { const bodyM = new THREE.MeshStandardMaterial({ color: 0xd8d8d8, roughness: 0.4, metalness: 0.5 }); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 9, 12), bodyM); b.rotation.x = Math.PI / 2; missile.add(b); const nose = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.5, 12), new THREE.MeshStandardMaterial({ color: 0xc8322e })); nose.rotation.x = Math.PI / 2; nose.position.z = 5.7; missile.add(nose); for (let k = 0; k < 4; k++) { const fin = new THREE.Mesh(box, bodyM); fin.scale.set(0.15, 2.2, 2.4); fin.position.set(Math.cos(k * Math.PI / 2) * 1.2, Math.sin(k * Math.PI / 2) * 1.2, -3.5); fin.rotation.z = k * Math.PI / 2; missile.add(fin); } const jet = new THREE.Mesh(new THREE.ConeGeometry(0.6, 4, 10), new THREE.MeshBasicMaterial({ color: 0xffa040 })); jet.rotation.x = -Math.PI / 2; jet.position.z = -6.4; missile.add(jet); }
missile.visible = false; scene.add(missile);
const TRAIL = 400, trailPos = new Float32Array(TRAIL * 3), trailAge = new Float32Array(TRAIL).fill(99); let trailHead = 0;
const trail = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(trailPos, 3)), new THREE.PointsMaterial({ color: 0xe8e8e8, size: 5, transparent: true, opacity: 0.55, depthWrite: false, sizeAttenuation: true })); trail.frustumCulled = false; scene.add(trail);
const missiles = [missile]; for (let k = 1; k < 5; k++) { const m = missile.clone(); m.visible = false; scene.add(m); missiles.push(m); }
const flights = []; let salvo = null;
function fireSalvo(aim) { salvo = { n: set.count, aim: aim ? aim.clone() : null, next: 0, power: set.mpower }; }
function launchMissile(aim, power, from = null, arc = 60) {
  const m = missiles.find((x) => !x.visible); if (!m) return;
  const side = aim ? Math.sign(aim.z || 1) : Math.random() < 0.5 ? 1 : -1;
  const target = aim ? aim.clone().add(new THREE.Vector3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, 0)) : new THREE.Vector3((Math.random() - 0.5) * W * 0.6, 35 + Math.random() * 80, side * (D / 2 + 1));
  from = from ? from.clone() : new THREE.Vector3(-650 + Math.random() * 300, 380 + Math.random() * 120, side * 650);
  flights.push({ m, from, target, t: 0, dur: Math.max(0.6, from.distanceTo(target) / 230), power, arc }); m.visible = true;
}
function stepMissile(dt) {
  for (let i = 0; i < TRAIL; i++) trailAge[i] += dt;
  if (salvo) { salvo.next -= dt; if (salvo.next <= 0) { launchMissile(salvo.aim, salvo.power); salvo.next = 0.5; if (--salvo.n <= 0) salvo = null; } }
  for (const f of flights) {
    f.t += dt; const k = Math.min(1, f.t / f.dur), m = f.m;
    m.position.lerpVectors(f.from, f.target, k); m.position.y += Math.sin(k * Math.PI) * f.arc; m.lookAt(tmp.lerpVectors(f.from, f.target, Math.min(1, k + 0.01)).setY(tmp.y + Math.sin(Math.min(1, k + 0.01) * Math.PI) * f.arc));
    for (let n = 0; n < 3; n++) { const i = trailHead = (trailHead + 1) % TRAIL; trailPos[i * 3] = m.position.x + (Math.random() - 0.5) * 2; trailPos[i * 3 + 1] = m.position.y + (Math.random() - 0.5) * 2; trailPos[i * 3 + 2] = m.position.z + (Math.random() - 0.5) * 2; trailAge[i] = 0; }
    if (k >= 1) { const [r, pw] = POW[f.power]; explode(f.target, r * 1.3, pw * 1.3); m.visible = false; f.done = true; }
  }
  for (let i = flights.length - 1; i >= 0; i--) if (flights[i].done) flights.splice(i, 1);
  for (let i = 0; i < TRAIL; i++) if (trailAge[i] < 8) trailPos[i * 3 + 1] += 1.5 * dt;
  trail.geometry.attributes.position.needsUpdate = true; trail.material.opacity = 0.55;
  trail.visible = trailAge.some((a) => a < 8);
}

// --- rain, wind and lightning
const RAIN = 6000, rainPos = new Float32Array(RAIN * 3); for (let i = 0; i < RAIN; i++) { rainPos[i * 3] = (Math.random() - 0.5) * 420; rainPos[i * 3 + 1] = Math.random() * 220; rainPos[i * 3 + 2] = (Math.random() - 0.5) * 420 + 80; }
const rain = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(rainPos, 3)), new THREE.PointsMaterial({ color: 0xcfe3ff, size: 0.9, transparent: true, opacity: 0.6, depthWrite: false })); rain.visible = false; rain.frustumCulled = false; scene.add(rain);
function stepStorm(dt) {
  if (!fx.storm) return;
  const wind = set.wind;
  for (let i = 0; i < RAIN; i++) { rainPos[i * 3 + 1] -= 70 * dt; rainPos[i * 3] -= (8 + 18 * wind) * dt; if (rainPos[i * 3 + 1] < 0 || rainPos[i * 3] < -230) { rainPos[i * 3 + 1] = Math.random() * 220; rainPos[i * 3] = (Math.random() - 0.5) * 420 + 60; } }
  rain.geometry.attributes.position.needsUpdate = true;
  nextBolt -= dt; if (nextBolt < 0 && set.lightning) { lightningT = 0.25; nextBolt = 2.5 + Math.random() * 4; }
  if (wind >= 2 && Math.random() < (wind - 1) * 1.6 * dt) { const it = cells[Math.floor(Math.random() * cells.length)]; if (it.pos.y > 20) loosen(it, new THREE.Vector3(-14 * (wind - 1) - 6, 3, (Math.random() - 0.5) * 6), 1.5); }     // a gale tears loose cells off and blows them downwind
}
function sway(t, wind) {                                                                       // the park trees lean in the wind
  for (const it of trees) { if (it.d) continue; const a = wind * (0.08 + 0.1 * Math.sin(t * 2.2 + it.pos.x * 0.05 + it.pos.z * 0.03)); E.set(0, 0, 0); E.z = a; E.x = a * 0.4; const q = Qd.setFromEuler(E); writeItem(it, tmp.copy(it.pos).setY(it.pos.y - Math.abs(a) * it.pos.y * 0.3).addScaledVector(new THREE.Vector3(-1, 0, 0), a * it.pos.y * 0.8), q); }
}

// --- the tornado: a funnel that walks across the park and sucks things up
const funnelMat = new THREE.MeshBasicMaterial({ color: 0x7d7772, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false });
const funnel = new THREE.Mesh(new THREE.CylinderGeometry(70, 6, 260, 32, 12, true), funnelMat); funnel.position.y = 130; funnel.visible = false; scene.add(funnel);
{ const p = funnel.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), k = (y + 130) / 260, r = 6 + 64 * Math.pow(k, 1.8); const a = Math.atan2(p.getZ(i), p.getX(i)); p.setX(i, Math.cos(a) * r); p.setZ(i, Math.sin(a) * r); } funnel.geometry.computeVertexNormals(); }
const SW = 1500, swPos = new Float32Array(SW * 3), swA = new Float32Array(SW), swH = new Float32Array(SW); for (let i = 0; i < SW; i++) { swA[i] = Math.random() * Math.PI * 2; swH[i] = Math.random(); }
const swirl = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(swPos, 3)), new THREE.PointsMaterial({ color: 0x6e6862, size: 4.5, transparent: true, opacity: 0.65, depthWrite: false })); swirl.visible = false; swirl.frustumCulled = false; scene.add(swirl);
const tornadoSize = () => 0.5 + (set.size - 1) * 0.225;
function tornadoPull(d, dt) {
  const sz = tornadoSize(), dx = d.pos.x - funnel.position.x, dz = d.pos.z - funnel.position.z, r = Math.hypot(dx, dz), k = Math.min(1, d.pos.y / 260), rad = (8 + 64 * Math.pow(k, 1.8) + 10) * sz, sp = 0.6 + 0.4 * sz;
  if (r < rad) { const tx = -dz / (r + 1), tz = dx / (r + 1); d.vel.x += (tx * 38 * sp - dx / (r + 1) * 12 - d.vel.x) * 2.5 * dt; d.vel.z += (tz * 38 * sp - dz / (r + 1) * 12 - d.vel.z) * 2.5 * dt; d.vel.y += (16 * sp - d.vel.y) * 1.5 * dt + 14 * sp * dt; d.rest = false; }
}
function stepTornado(dt, t) {
  if (!fx.tornado) return;
  const sz = tornadoSize(), e = 38 - fx.tornado, path = e < 22 ? e / 22 : 1;
  let tx = -330 + (10 - -330) * path + (e > 28 ? (e - 28) * 30 : 0), tz = 320 + (-30 - 320) * path - (e > 28 ? (e - 28) * 25 : 0);
  if (fx.tornadoTarget) { tx = fx.tornadoTarget.x; tz = fx.tornadoTarget.z; if (e > 30) fx.tornado = 8; }                 // steered by a tap on the ground: it keeps going while you steer
  funnel.position.x += (tx - funnel.position.x) * dt * 1.2; funnel.position.z += (tz - funnel.position.z) * dt * 1.2; funnel.rotation.y += dt * 3; funnel.position.y = 130; funnel.scale.set(sz, 1, sz);
  for (let i = 0; i < SW; i++) { swA[i] += dt * (2.5 + 2 * (1 - swH[i])); swH[i] = (swH[i] + dt * 0.08) % 1; const r = (6 + 64 * Math.pow(swH[i], 1.8) + 3) * sz; swPos[i * 3] = funnel.position.x + Math.cos(swA[i]) * r; swPos[i * 3 + 1] = swH[i] * 260; swPos[i * 3 + 2] = funnel.position.z + Math.sin(swA[i]) * r; }
  swirl.geometry.attributes.position.needsUpdate = true;
  for (const it of trees) if (!it.d && Math.hypot(it.pos.x - funnel.position.x, it.pos.z - funnel.position.z) < 30 * sz && Math.random() < 1.5 * sz * dt) loosen(it, new THREE.Vector3(0, 12, 0), 1);
  for (const it of cells) if (!it.d && Math.hypot(it.pos.x - funnel.position.x, it.pos.z - funnel.position.z) < (10 + 64 * Math.pow(Math.min(1, it.pos.y / 260), 1.8) + 4) * sz && Math.random() < 0.35 * sz * dt) loosen(it, new THREE.Vector3(0, 8, 0), 2);
  shake = Math.max(shake, 0.4 * Math.max(0, 1 - Math.hypot(funnel.position.x, funnel.position.z) / 120));
}

// --- the tsunami: a wave that runs in from the park, floods the ground and carries the trees along
const WG = 140, water = new THREE.Mesh(new THREE.PlaneGeometry(1800, 1800, WG, WG), new THREE.MeshPhysicalMaterial({ color: 0x2a6f8f, roughness: 0.15, metalness: 0.05, transparent: true, opacity: 0.86, clearcoat: 1 }));
water.rotation.x = -Math.PI / 2; water.position.y = -3; water.visible = false; water.receiveShadow = true; const waterG = new THREE.Group(); waterG.add(water); scene.add(waterG);
let waveFront = 820, flood = 0; const waveDir = new THREE.Vector2(0, 1), sOf = (p) => p.x * waveDir.x + p.z * waveDir.y;   // the wave runs along waveDir (from +s towards -s)
const waveH = (z, t) => { const hs = set.height / 16, d = z - waveFront, crest = hs * (16 * Math.exp(-d * d / 2200) * (d > 0 ? 1 : 0.5) + 10 * Math.exp(-d * d / 400)); const behind = d < 0 ? 1 : 0; return crest + behind * (6 * Math.min(1.6, Math.max(0.5, hs)) + 1.2 * Math.sin(z * 0.05 + t * 2)) * flood; };
const waterLevelAt = (x, z) => water.position.y + waveH(x * waveDir.x + z * waveDir.y, fx.t);
function stepTsunami(dt, t) {
  if (!fx.tsunami) return;
  const e = 34 - fx.tsunami; waveFront -= (e < 20 ? 48 : 20) * dt; flood = e < 24 ? Math.min(1, e / 3) : Math.max(0, 1 - (e - 24) / 8);
  water.position.y = -3 + 2.5 * flood;
  const p = water.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) { const z = -p.getY(i); p.setZ(i, waveH(z, t)); }
  p.needsUpdate = true; water.geometry.computeVertexNormals();
  for (const it of trees) if (!it.d && Math.abs(sOf(it.pos) - waveFront) < 18) loosen(it, new THREE.Vector3(-waveDir.x * 30 + (Math.random() - 0.5) * 6, 6, -waveDir.y * 30 + (Math.random() - 0.5) * 6), 0.8);
  shake = Math.max(shake, 0.25 * Math.max(0, 1 - Math.abs(waveFront) / 80));
}

// --- the implosion: charges flash up the tower, then it drops from the bottom, floor on floor, into a heap under a dust cloud
function stepImplode(dt) {
  if (!fx.implode) return;
  implodeT += dt;
  if (implodeT < 1.1 && Math.random() < 16 * dt) { const a = Math.random() * Math.PI * 2; booms.push({ c: new THREE.Vector3(Math.cos(a) * W / 2, Math.random() * TOP, Math.sin(a) * D / 2), t: 0, r: 4 }); shake = Math.max(shake, 0.5); }
  const tc = implodeT - 1.0; if (tc < 0) return;
  if (topple) {                                                                                 // toppling: the whole tower tips about the edge of its base, then breaks up and falls along the ground
    if (!topple.broke) {
      topple.w += 0.26 * dt; topple.th += topple.w * dt;
      const q = Qd.setFromAxisAngle(topple.axis, topple.th); building.quaternion.copy(q); building.position.copy(topple.pivot).sub(tmp.copy(topple.pivot).applyQuaternion(q));
      shake = Math.max(shake, 0.3);
      if (topple.th > 0.62) {
        const om = topple.axis.clone().multiplyScalar(topple.w);
        for (const it of tower) { const pw = tmp.copy(it.pos).sub(topple.pivot).applyQuaternion(q).add(topple.pivot); const v = new THREE.Vector3().crossVectors(om, tmp.clone().sub(topple.pivot)); v.x += (Math.random() - 0.5) * 3; v.z += (Math.random() - 0.5) * 3; const d = loosen(it, v, 1.5); d.pos.copy(pw); d.rot.setFromQuaternion(q); }
        for (const it of bigs) { inst[it.list].setMatrixAt(it.idx, M.compose(tmp.set(0, -80, 0), it.quat, it.scale)); inst[it.list].instanceMatrix.needsUpdate = true; }
        building.quaternion.identity(); building.position.set(0, 0, 0); topple.broke = true; shake = Math.max(shake, 1.4);
      }
    } else if (Math.random() < 50 * dt) { const a = Math.random() * TOP * 0.9; puffs.push({ p: topple.d.clone().multiplyScalar(a).add(new THREE.Vector3((Math.random() - 0.5) * 20, 4 + Math.random() * 8, (Math.random() - 0.5) * 20)), v: new THREE.Vector3((Math.random() - 0.5) * 10, 2, (Math.random() - 0.5) * 10), s: 7 + Math.random() * 9, t: 0, life: 5 + Math.random() * 4 }); }
    return;
  }
  for (const it of tower) { if (it.d) continue; const delay = (it.pos.y / TOP) * 3.4 + hash(it.idx, it.pos.y | 0, 2) * 0.4; if (tc > delay) { tmp.set(-it.pos.x, 0, -it.pos.z).normalize().multiplyScalar(2 + 5 * Math.random()); tmp.y = -6 - 6 * Math.random(); loosen(it, tmp, 1.5); } }
  const c = Math.min(1, tc / 4.4);                                                             // the glass body and the core sink as the floors pancake
  for (const it of bigs) { const sy = it.scale.y * (1 - c), bottom = it.pos.y - it.scale.y / 2; inst[it.list].setMatrixAt(it.idx, sy > 0.5 ? M.compose(tmp.set(it.pos.x, bottom + sy / 2, it.pos.z), it.quat, new THREE.Vector3(it.scale.x, sy, it.scale.z)) : M.compose(tmp.set(0, -80, 0), it.quat, it.scale)); inst[it.list].instanceMatrix.needsUpdate = true; }
  pile = Math.min(1, tc / 5);
  if (Math.random() < 40 * dt) { const a = Math.random() * Math.PI * 2, r = 8 + Math.random() * 34; puffs.push({ p: new THREE.Vector3(Math.cos(a) * r, 3 + Math.random() * 8 + 25 * (1 - c), Math.sin(a) * r * 0.8), v: new THREE.Vector3(Math.cos(a) * 7, 1.5, Math.sin(a) * 7), s: 7 + Math.random() * 9, t: 0, life: 5 + Math.random() * 4 }); }
  shake = Math.max(shake, 1.0 * (1 - c) + 0.15);
}

// --- the jet: an F-16 flying circuits round the tower; fire its Sidewinders or drop bombs on it, with a chase camera
const jet = new THREE.Group(); { const inner = new THREE.Group(); inner.scale.setScalar(0.04); inner.rotation.y = Math.PI; inner.position.x = F16_LEN * 0.04 / 2; for (const m of buildF16()) inner.add(m); jet.add(inner);
  const ab = new THREE.Mesh(new THREE.ConeGeometry(0.42, 3.4, 12), new THREE.MeshBasicMaterial({ color: 0xff9a2e, transparent: true, opacity: 0.85, depthWrite: false })); ab.rotation.z = Math.PI / 2; ab.position.set(-F16_LEN * 0.04 / 2 - 1.5, 0.2, 0); jet.add(ab); jet.userData.ab = ab; }
jet.visible = false; scene.add(jet);
const bombs = [], bombGeo = new THREE.CylinderGeometry(0.45, 0.3, 3, 10).rotateZ(Math.PI / 2), bombMat = new THREE.MeshStandardMaterial({ color: 0x3a3f44, roughness: 0.6, metalness: 0.4 });
let jetA = 0, chaseOn = true;
const jetFwd = () => new THREE.Vector3(1, 0, 0).applyQuaternion(jet.quaternion);
if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__iqon = { jet, get cam() { return camera; }, get ctl() { return controls; }, fxJet, bombs, flights };
function startJet() { fxJet.on = true; jet.visible = true; fx.jet = 9999; chaseOn = !!set.chase; }
function stopJet() { fxJet.on = false; jet.visible = false; fx.jet = 0; controls.enabled = true; for (const b of bombs) scene.remove(b.m); bombs.length = 0; }
function jetAction(act) {
  if (act === 'fire') jetFire(null);
  else if (act === 'bomb') { if (!fxJet.on) startJet(); const m = new THREE.Mesh(bombGeo, bombMat); m.position.copy(jet.position).addScaledVector(new THREE.Vector3(0, -1.2, 0), 1); m.quaternion.copy(jet.quaternion); scene.add(m); bombs.push({ m, vel: jetFwd().multiplyScalar(62) }); }
  else if (act === 'chase') { chaseOn = !chaseOn; set.chase = chaseOn ? 1 : 0; ctl.querySelector('[data-act=chase]').classList.toggle('on', chaseOn); if (!chaseOn) controls.enabled = true; }
}
function jetFire(aim) {
  if (!fxJet.on) startJet();
  const p = jet.position, target = aim ? aim.clone() : new THREE.Vector3(Math.max(-W / 2, Math.min(W / 2, p.x)), Math.max(15, Math.min(TOP - 6, p.y - 20)), Math.max(-D / 2, Math.min(D / 2, p.z)));   // the nearest point of the tower
  for (const sgn of [-1, 1]) { const from = jet.localToWorld(new THREE.Vector3(1.2, -0.3, sgn * 4.7)); launchMissile(target, set.jpower, from, 0); }
}
function stepJet(dt, t) {
  if (!fxJet.on) return;
  jetA += dt * 0.26; const R = 230, h = (a) => 95 + 35 * Math.sin(a * 1.7);
  const p = new THREE.Vector3(Math.cos(jetA) * R, h(jetA), -Math.sin(jetA) * R), n = new THREE.Vector3(Math.cos(jetA + 0.02) * R, h(jetA + 0.02), -Math.sin(jetA + 0.02) * R);
  jet.position.copy(p); const d = n.sub(p).normalize(), yaw = Math.atan2(-d.z, d.x), pitch = Math.asin(Math.max(-1, Math.min(1, d.y)));
  jet.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), pitch)).multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -0.55));   // banked into the left-hand circuit
  jet.userData.ab.scale.set(1, 0.8 + 0.5 * Math.random(), 1);
  for (let i = bombs.length - 1; i >= 0; i--) { const b = bombs[i]; b.vel.y -= 12 * dt; b.vel.multiplyScalar(1 - 0.08 * dt); b.m.position.addScaledVector(b.vel, dt); b.m.lookAt(tmp.copy(b.m.position).add(b.vel)); b.m.rotateY(-Math.PI / 2);
    const q = b.m.position, inTower = Math.abs(q.x) < W / 2 + 2 && Math.abs(q.z) < D / 2 + 2 && q.y < TOP + 6;
    if (q.y < 1 || inTower) { const [r, pw] = POW[set.jpower]; explode(q.clone().setY(Math.max(1, q.y)), r * 1.2, pw * 1.2); scene.remove(b.m); bombs.splice(i, 1); } }
  if (chaseOn) { controls.enabled = false; const f = jetFwd(), goal = jet.position.clone().addScaledVector(f, -52).add(new THREE.Vector3(0, 16, 0)), look = jet.position.clone().addScaledVector(f, 50).lerp(new THREE.Vector3(0, 70, 0), 0.3); const k = 1 - Math.exp(-dt * 3.5); camera.position.lerp(goal, k); controls.target.lerp(look, k); camera.up.set(0, 1, 0); camera.lookAt(controls.target); }
}

// --- the earthquake: the ground shakes, the tower sways from its base and sheds loose pieces
function stepQuake(dt, t) {
  if (!fx.quake) { if (!topple || topple.broke) { building.position.x *= 0.9; building.position.z *= 0.9; building.rotation.z *= 0.9; building.rotation.x *= 0.9; } city.position.x *= 0.9; city.position.z *= 0.9; return; }
  const mag = (set.magnitude - 4) / 5, e = 14 - fx.quake, env = (e < 2 ? e / 2 : e > 10 ? Math.max(0, (14 - e) / 4) : 1) * mag;
  const gx = env * (0.9 * Math.sin(t * 17) + 0.5 * Math.sin(t * 29)), gz = env * 0.5 * Math.sin(t * 23);
  building.position.x = gx; building.position.z = gz; city.position.x = gx; city.position.z = gz;
  building.rotation.z = env * 0.016 * Math.sin(t * 2.6); building.rotation.x = env * 0.011 * Math.sin(t * 2.1 + 1);         // the sway: slow, like a tree, biggest at the top
  shake = Math.max(shake, env * 0.6);
  if (env > 0.35 && Math.random() < 2.5 * (env * 1.6) * dt) { const it = cells[Math.floor(Math.random() * cells.length)]; if (it.pos.y > 30) loosen(it, new THREE.Vector3((Math.random() - 0.5) * 4, 2, (Math.random() - 0.5) * 4).add(tmp.set(it.pos.x, 0, it.pos.z).normalize().multiplyScalar(6)), 1.5); }
}

// ---------------------------------------------------------------- camera, controls, loop
const camera = new THREE.PerspectiveCamera(42, 1, 1, 4000);
camera.position.set(-140, 70, 230);
const controls = new OrbitControls(camera, canvas); controls.target.set(0, 66, 0); controls.enableDamping = true; controls.dampingFactor = 0.08; controls.maxPolarAngle = Math.PI * 0.49; controls.minDistance = 40; controls.maxDistance = 700; controls.autoRotate = true; controls.autoRotateSpeed = 0.6;
controls.addEventListener('start', () => { controls.autoRotate = false; spinBtn.classList.remove('on'); });
const spinBtn = document.getElementById('iqon-spin'); spinBtn.addEventListener('click', () => { controls.autoRotate = !controls.autoRotate; spinBtn.classList.toggle('on', controls.autoRotate); });
let night = false; const nightBtn = document.getElementById('iqon-night');
nightBtn.addEventListener('click', () => { night = !night; nightBtn.classList.toggle('on', night); glassLit.emissiveIntensity = night ? 0.55 : 0; glassLit.color.set(night ? 0x1a2a33 : 0x55707c); nbGlass.emissive.set(night ? 0xffc88a : 0x000000); nbGlass.emissiveIntensity = night ? 0.25 : 0; });
// tap the tower to plant a bomb (or aim the missiles) there; tap the ground to steer the tornado
const ray = new THREE.Raycaster(); let down = null;
canvas.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
canvas.addEventListener('pointerup', (e) => {
  if (!down || performance.now() - down.t > 500 || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return;
  const r = canvas.getBoundingClientRect(); ray.setFromCamera(new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1), camera);
  const hit = ray.intersectObjects([inst.concrete, inst.glass, inst.concreteDark], false)[0];
  if (hit) { if (fxJet.on) jetFire(hit.point); else if (armed === 'missile') fireSalvo(hit.point); else { const [r, pw] = POW[set.power]; explode(hit.point, r, pw); } return; }
  if (fx.tornado) { const g = ray.intersectObject(ground, false)[0]; if (g) fx.tornadoTarget = g.point.clone(); }
});
function resize() { const w = view.clientWidth, h = view.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(view);
const shakeOff = new THREE.Vector3(), bgNow = new THREE.Color();
let last = performance.now(), raf = 0, running = false;
function frame(now) {
  if (!running) return; raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now; fx.t += dt; const t = fx.t;
  for (const k of ['quake', 'storm', 'tornado', 'tsunami', 'implode', 'jet']) if (fx[k]) { fx[k] = Math.max(0, fx[k] - dt); if (!fx[k]) { if (k === 'storm') rain.visible = false; if (k === 'tornado') funnel.visible = swirl.visible = false; if (k === 'tsunami') water.visible = false; btns.forEach((b) => b.classList.remove('on')); } }
  stepQuake(dt, t); stepStorm(dt); stepTornado(dt, t); stepTsunami(dt, t); stepImplode(dt); stepJet(dt, t); stepMissile(dt); stepBooms(dt); stepDebris(dt);
  const wind = fx.storm ? 0.4 + 0.45 * set.wind : fx.tornado ? Math.max(0.3, 1 - Math.hypot(funnel.position.x + 40, funnel.position.z - 330) / 300) : 0; if (wind || fx.t < 0.1) sway(t, wind);
  // sky and light: day, night, storm, lightning
  lightningT = Math.max(0, lightningT - dt); const bolt = lightningT > 0 ? 1 : 0;
  bgNow.copy(night ? SKY_NIGHT : SKY); if (fx.storm) bgNow.lerp(SKY_STORM, Math.min(1, (30 - fx.storm) / 2) * (night ? 0.5 : 1)); if (fx.tornado) bgNow.lerp(SKY_STORM, 0.5); if (bolt) bgNow.lerp(new THREE.Color(0xffffff), 0.35);
  scene.background.lerp(bgNow, 0.08); scene.fog.color.copy(scene.background);
  const dim = fx.storm || fx.tornado ? 0.45 : 1; sun.intensity = (night ? 0.25 : 2.6) * dim + bolt * 3; sun.color.set(night ? 0x8fa8ff : 0xfff2dc); hemi.intensity = (night ? 0.25 : 0.7) * dim; scene.environmentIntensity = (night ? 0.12 : 0.55) * dim;
  camera.position.sub(shakeOff); if (!fxJet.on || !chaseOn) controls.update();
  shake = Math.max(0, shake - dt * 1.2); shakeOff.set((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake).multiplyScalar(2); camera.position.add(shakeOff);
  renderer.render(scene, camera);
}

export function enter() { resize(); running = true; last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); }
export function leave() { running = false; cancelAnimationFrame(raf); }
