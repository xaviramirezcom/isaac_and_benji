// Isaac's Balsa Jet: a twin-tail fighter glider made only from 3 mm balsa sheets (plus a lump of clay), in 3D.
// LOOK: turn it, tap any piece, pull the pieces apart, paint it. BUILD: nine steps that bring the pieces in from the cut sheets. SHEETS: the pieces laid out on two
// real-size balsa sheets (grain along the sheet). FLY: balance it with clay and trim the elevators, then throw it: a small physics model decides if it glides, dives or stalls.
import * as THREE from '../vendor/three.module.min.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';
import * as D from './balsa/design.js';
import { UI, PART, STEPS, RESULT, FLY_ADULT } from './balsa/text.js';
import { simulate } from './balsa/sim.js';

const $ = (s) => document.querySelector(s);
const root = $('#view-balsa'), canvas = $('#bal-canvas');
const el = {
  loading: $('#bal-loading'), tags: $('#bal-tags'), toast: $('#bal-toast'), card: $('#bal-card'), chips: $('#bal-chips'), pull: $('#bal-pull'), paints: $('#bal-paints'),
  modes: $('#bal-modes'), panel: $('#bal-panel'),
};
const V3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const JET_Y = 70, NX = D.NOSE_X, T = D.THICK;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v)), smooth = (t) => t * t * (3 - 2 * t);

let lang = 'en', mode = 'look', step = 0, sel = null, paintId = 'wood', clayG = 5, elevDeg = 0, explode = 0, ready = false, running = false, loadP = null, raf = 0, lastT = 0, clock = 0, cardAdult = false;
let renderer, scene, camera, controls, rig, mat, sheetsG, ground, light, blob, camTween = null, flight = null, flown = null;
const inst = [];                 // every physical piece: { part, root, mesh, edges, mats, asm, sheet, t, delay, label }
const packing = D.packSheets();

// ------------------------------------------------------------ the look of balsa
function balsaTexture() {
  const S = 512, c = document.createElement('canvas'); c.width = c.height = S; const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, 0, S); g.addColorStop(0, '#ecdab4'); g.addColorStop(0.5, '#e6d2a7'); g.addColorStop(1, '#ead7ae'); x.fillStyle = g; x.fillRect(0, 0, S, S);
  const rnd = (a, b) => a + Math.random() * (b - a), wave = (y0, A, k, ph, col, w, al) => { x.strokeStyle = col; x.globalAlpha = al; x.lineWidth = w; x.beginPath(); for (let i = 0; i <= S; i += 8) { const yy = y0 + A * Math.sin((2 * Math.PI * k * i) / S + ph); i ? x.lineTo(i, yy) : x.moveTo(i, yy); } x.stroke(); };
  for (let i = 0; i < 9; i++) wave(rnd(0, S), rnd(2, 8), 1 + Math.floor(rnd(0, 2)), rnd(0, 6), '#c9a468', rnd(10, 38), rnd(0.05, 0.11));         // soft growth-ring bands
  for (let i = 0; i < 260; i++) wave(rnd(0, S), rnd(0.5, 3), 1 + Math.floor(rnd(0, 3)), rnd(0, 6), Math.random() < 0.7 ? '#b88f55' : '#fff3d6', rnd(0.5, 2), rnd(0.05, 0.2));   // the fine grain lines
  x.globalAlpha = 1; for (let i = 0; i < 520; i++) { x.fillStyle = Math.random() < 0.5 ? 'rgba(255,248,226,.22)' : 'rgba(150,110,60,.14)'; const l = rnd(6, 34), px = rnd(0, S), py = rnd(0, S); x.fillRect(px, py, l, rnd(0.6, 1.6)); if (px + l > S) x.fillRect(px - S, py, l, 1); }   // the shiny flecks
  for (let i = 0; i < 1600; i++) { x.fillStyle = 'rgba(120,85,40,.16)'; x.fillRect(rnd(0, S), rnd(0, S), rnd(1, 3), 1); }                    // pores
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; t.repeat.set(0.01, 0.01); return t;
}
function matTexture() {
  const W = 1200, H = 760, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  x.fillStyle = '#2f6b52'; x.fillRect(0, 0, W, H);
  for (let i = 0; i <= W; i += 10) { x.strokeStyle = i % 50 === 0 ? 'rgba(255,255,255,.34)' : 'rgba(255,255,255,.12)'; x.lineWidth = i % 50 === 0 ? 1.4 : 0.7; x.beginPath(); x.moveTo(i, 0); x.lineTo(i, H); x.stroke(); }
  for (let j = 0; j <= H; j += 10) { x.strokeStyle = j % 50 === 0 ? 'rgba(255,255,255,.34)' : 'rgba(255,255,255,.12)'; x.lineWidth = j % 50 === 0 ? 1.4 : 0.7; x.beginPath(); x.moveTo(0, j); x.lineTo(W, j); x.stroke(); }
  x.fillStyle = 'rgba(255,255,255,.55)'; x.font = 'bold 13px sans-serif'; for (let i = 100; i < W; i += 100) x.fillText(`${i / 10}`, i + 3, H - 6);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function groundTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'); x.fillStyle = '#9fb98a'; x.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 4000; i++) { x.fillStyle = `rgba(${60 + Math.random() * 60},${110 + Math.random() * 50},${50 + Math.random() * 40},.18)`; x.fillRect(Math.random() * 512, Math.random() * 512, 3, 3); }
  x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 3; x.strokeRect(0, 0, 512, 512);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; return t;
}

// ------------------------------------------------------------ building the pieces
const poly = (pts, sgn = 1) => pts.map(([u, v]) => new THREE.Vector2(NX - u, sgn * v));
function geometryFor(outline, holes, sgn = 1) {
  const sh = new THREE.Shape(poly(outline, sgn)); for (const h of holes) sh.holes.push(new THREE.Path(poly(h, sgn)));
  const b = 0.25, g = new THREE.ExtrudeGeometry(sh, { depth: T - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 1, curveSegments: 1, steps: 1 });
  g.translate(0, 0, b); return g;                                                // the piece now spans z = 0 .. 3
}
const basis = (ex, ey, ez) => new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(ex, ey, ez));
const Q_PLATE = new THREE.Quaternion();
const Q_FLAT = basis(V3(1, 0, 0), V3(0, 0, 1), V3(0, -1, 0));                         // shape y -> sideways, thickness hangs down
const F_PLATE = basis(V3(-1, 0, 0), V3(0, 0, 1), V3(0, 1, 0));                        // lying on a sheet, nose to the right
const F_FLAT = basis(V3(0, 0, -1), V3(1, 0, 0), V3(0, -1, 0));                        // wing-like parts: span along the sheet

let balsaMat = null;
function buildPieces() {
  const tex = balsaTexture(), texV = tex.clone(); texV.center.set(0, 0); texV.rotation = Math.PI / 2; texV.needsUpdate = true;
  const gains = (p) => PART[p.id];
  for (const it of D.instances()) {
    const p = it.part, sgn = it.s ?? 1, g = geometryFor(it.outline, p.holes ?? [], sgn);
    const wood = new THREE.MeshStandardMaterial({ map: p.grain === 'v' ? texV : tex, bumpMap: p.grain === 'v' ? texV : tex, bumpScale: 0.5, roughness: 0.78, metalness: 0 });
    const paint = new THREE.MeshStandardMaterial({ color: p.color, roughness: 0.45, metalness: 0.05 });
    const mesh = new THREE.Mesh(g, wood); mesh.castShadow = mesh.receiveShadow = true;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(g, 35), new THREE.LineBasicMaterial({ color: 0x6f4f26, transparent: true, opacity: 0.5 }));
    const rootO = new THREE.Group(), hinge = new THREE.Group(), holder = new THREE.Group(); holder.add(mesh, edges); hinge.add(holder); rootO.add(hinge);
    const b = { x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9 }; for (const [u, v] of it.outline) { const xs = NX - u, ys = sgn * v; b.x0 = Math.min(b.x0, xs); b.x1 = Math.max(b.x1, xs); b.y0 = Math.min(b.y0, ys); b.y1 = Math.max(b.y1, ys); }
    const o = { it, part: p, root: rootO, hinge, holder, mesh, edges, wood, paint, b, t: 0, delay: 0, sgn, kind: p.kind, asmP: V3(), asmQ: new THREE.Quaternion(), shP: V3(), shQ: new THREE.Quaternion(), exV: V3(), sheetIdx: 0, hingeLocal: V3() };
    // assembled pose
    if (p.kind === 'plate') { o.asmQ.copy(Q_PLATE); o.asmP.set(0, 0, it.z - T / 2); o.exV.set(0, 0, Math.sign(it.z || 1) * (Math.abs(it.z) * 5 + (it.z === 0 ? 0 : 14))); if (p.id === 'canopy') o.exV.set(0, 60 + Math.abs(it.z) * 3, it.z * 4); if (it.z === 0 && p.id === 'spine') o.exV.set(0, 0, 0); }
    else { o.asmQ.copy(Q_FLAT); o.asmP.set(0, p.y[1], 0); o.exV.set(p.id === 'elev' ? -30 : 0, p.id === 'elev' ? 26 : 60, p.id === 'elev' ? sgn * 40 : 0); }
    if (p.kind === 'elev') { const hx = NX - p.hinge; o.hingeLocal.set(hx, 0, 0); holder.position.set(-hx, 0, 0); o.asmP.add(V3(hx, 0, 0)); }      // the elevator turns about its tape hinge
    rig.add(rootO); inst.push(o);
  }
  // pose on the sheets
  for (let k = 0; k < packing.sheets.length; k++) for (const pi of packing.sheets[k].items) {
    const o = inst[pi.inst === undefined ? 0 : instIndex(pi.inst)], F = o.kind === 'plate' ? F_PLATE : F_FLAT, sheetTop = 3, X0 = -D.SHEET.w / 2, Z0 = -330 + k * 140;
    o.sheetIdx = k; o.shQ.copy(F);
    const corners = [[o.b.x0, o.b.y0], [o.b.x1, o.b.y0], [o.b.x0, o.b.y1], [o.b.x1, o.b.y1]].map(([a, c]) => V3(a, c, 0).applyQuaternion(F));
    const minX = Math.min(...corners.map((c) => c.x)), minZ = Math.min(...corners.map((c) => c.z));
    const base = V3(X0 + pi.x - minX, o.kind === 'plate' ? sheetTop + 0.2 : sheetTop + T + 0.2, Z0 + pi.y - minZ);
    base.add(V3().copy(o.hingeLocal).applyQuaternion(F));                                // the elevator's root sits on its hinge
    o.shP.copy(base).sub(V3(0, JET_Y, 0));                                                // the rig sits JET_Y above the table
  }
}
const instIndex = (it) => inst.findIndex((o) => o.it === it);

let clayMesh = null;
function buildClay() {
  const m = new THREE.MeshStandardMaterial({ color: 0xc9743c, roughness: 0.9, bumpMap: balsaTexture(), bumpScale: 1.2 });
  clayMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), m); clayMesh.castShadow = true; rig.add(clayMesh);
  const o = { it: { part: { id: 'clay' } }, part: { id: 'clay', kind: 'clay', step: D.CLAY.step }, root: clayMesh, kind: 'clay', t: 0, delay: 0, asmP: V3(), asmQ: new THREE.Quaternion(), shP: V3(), shQ: new THREE.Quaternion(), exV: V3(40, 0, 0), sheetIdx: 0, clay: true, wood: m, paint: m, mesh: clayMesh };
  inst.push(o); setClay(clayG);
}
function setClay(g) {
  clayG = g; const o = inst.find((q) => q.clay); if (!o) return; const r = Math.cbrt(((3 * Math.max(g, 0.05)) / (4 * Math.PI * 1.7)) * 1000);       // clay is about 1.7 g/cm3: radius in mm
  clayMesh.scale.set(r * 1.15, r * 0.95, r * 0.95); o.asmP.set(NX - D.CLAY.u, D.CLAY.y, 0); o.shP.set(545, r - JET_Y, -210);          // on the table next to the sheets, until it goes into the nose
}

// ------------------------------------------------------------ the world
async function init() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5)); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  scene = new THREE.Scene(); scene.background = new THREE.Color(0x232a35);
  const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.7;
  camera = new THREE.PerspectiveCamera(40, 1, 1, 60000);
  light = new THREE.DirectionalLight(0xfff0dc, 2.4); light.position.set(260, 520, 300); light.castShadow = true; light.shadow.mapSize.set(2048, 2048);
  Object.assign(light.shadow.camera, { left: -620, right: 620, top: 420, bottom: -420, near: 100, far: 1400 }); light.shadow.bias = -0.0004; light.shadow.normalBias = 0.6; scene.add(light, light.target);
  scene.add(new THREE.HemisphereLight(0xdfe9ff, 0x4a3b2b, 0.5));
  mat = new THREE.Mesh(new THREE.PlaneGeometry(1200, 760), new THREE.MeshStandardMaterial({ map: matTexture(), roughness: 0.9 })); mat.rotation.x = -Math.PI / 2; mat.position.set(0, -0.1, -150); mat.receiveShadow = true; scene.add(mat);
  ground = new THREE.Mesh(new THREE.PlaneGeometry(60000, 9000), new THREE.MeshStandardMaterial({ map: (() => { const t = groundTexture(); t.repeat.set(60, 9); return t; })(), roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.visible = false; scene.add(ground);
  blob = new THREE.Mesh(new THREE.CircleGeometry(1, 24), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false })); blob.rotation.x = -Math.PI / 2; blob.visible = false; scene.add(blob);
  // the two balsa sheets
  const sTex = balsaTexture(); sheetsG = new THREE.Group();
  for (let k = 0; k < packing.count; k++) { const s = new THREE.Mesh(new THREE.BoxGeometry(D.SHEET.w, 3, D.SHEET.h), new THREE.MeshStandardMaterial({ map: sTex, bumpMap: sTex, bumpScale: 0.4, roughness: 0.8, color: 0xe9d5ab })); s.position.set(0, 1.5, -330 + k * 140 + D.SHEET.h / 2); s.receiveShadow = true; s.castShadow = true; sheetsG.add(s); }
  scene.add(sheetsG);
  rig = new THREE.Group(); rig.position.set(0, JET_Y, 0); scene.add(rig);
  buildPieces(); buildClay(); await new Promise((r) => setTimeout(r, 0));
  controls = new OrbitControls(camera, canvas); controls.enableDamping = true; controls.dampingFactor = 0.09; controls.rotateSpeed = 0.8; controls.enablePan = true; controls.screenSpacePanning = true; controls.minDistance = 80; controls.maxDistance = 4000;
  controls.addEventListener('start', () => { camTween = null; });
  buildChips(); buildPaints(); bind(); resize(); setMode('look', true);
  if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__balsa = { inst, get camera() { return camera; }, get controls() { return controls; }, setMode, setStep: (n) => setStep(n), select: (id) => select(id), get rig() { return rig; }, packing, setExplode: (v) => { explode = v; } };
  ready = true; el.loading.classList.add('done');
}

// ------------------------------------------------------------ modes, steps, camera
const camLook = (d = 480) => ({ target: V3(0, JET_Y + 22, 0), pos: V3(0.62, 0.4, 1).normalize().multiplyScalar(d).add(V3(0, JET_Y + 22, 0)) });
const camSheets = () => ({ target: V3(0, 0, -250), pos: V3(0, 760, 470) });
function goCam(c, dur = 1.3) { camTween = { t: 0, dur, aT: controls.target.clone(), aP: camera.position.clone(), bT: c.target, bP: c.pos }; }
function targets() {
  for (const o of inst) {
    const k = o.part.step ?? 1; let want = 0;
    if (mode === 'sheets') want = 1; else if (mode === 'build') want = k > step ? 1 : 0;
    if (o.want !== want) { o.want = want; o.delay = mode === 'build' && want === 0 ? 0.12 * Math.max(0, k - (step - 1)) * (o.it?.z ? 1 : 0.5) : 0; }
  }
}
function setMode(m, first = false) {
  const was = mode; mode = m; select(null, true); closeCard(); el.paints.hidden = true; explode = 0; el.pull.value = 0;
  document.querySelectorAll('#bal-modes button').forEach((b) => b.classList.toggle('on', b.dataset.mode === m));
  document.querySelectorAll('.jp').forEach((p) => { p.hidden = p.dataset.mode !== m; });
  const flying = m === 'fly'; ground.visible = flying; mat.visible = !flying; blob.visible = flying;
  scene.background.set(flying ? 0xbfe0f5 : 0x232a35); scene.fog = flying ? new THREE.Fog(0xbfe0f5, 4000, 30000) : null;
  if (m === 'build') { if (was !== 'build') step = 0; setStep(step, true); }
  else if (m === 'sheets') { sheetsG.visible = true; targets(); goCam(camSheets()); renderSheetsPanel(); }
  else if (m === 'fly') { sheetsG.visible = false; explode = 0; targets(); resetFlight(); renderFly(); }
  else { sheetsG.visible = false; targets(); goCam(camLook()); }
  if (m !== 'fly') { rig.position.set(0, JET_Y, 0); rig.rotation.set(0, 0, 0); flight = null; light.castShadow = true; }
  refreshText();
}
function setStep(n, instant = false) {
  step = clamp(n, 0, STEPS.length - 1); targets(); sheetsG.visible = step === 0;
  if (step === 7 && paintId === 'wood') setPaint('grey');
  if (step === 0) goCam(camSheets()); else goCam(camLook(430));
  const s = STEPS[step]; $('#jb-n').textContent = `${UI[lang].step} ${step} / ${STEPS.length - 1}`; $('#jb-name').textContent = s.name[lang]; $('#jb-kid').textContent = s.kid[lang]; $('#jb-adult').textContent = s.adult[lang];
  const go = $('#jb-go'); go.hidden = step !== STEPS.length - 1; go.textContent = UI[lang].goFly;
  $('#jb-prev').style.opacity = step === 0 ? 0.35 : 1; $('#jb-next').style.opacity = step === STEPS.length - 1 ? 0.35 : 1;
}
function renderSheetsPanel() {
  const n = packing.count, pieces = inst.filter((o) => !o.clay).length, t = UI[lang];
  $('#js-text').textContent = lang === 'es'
    ? `Se necesitan ${n} láminas de balsa de 3 × 100 × 1000 mm para las ${pieces} piezas (usas el ${Math.round(packing.usedPct)} % de la madera). La veta va a lo largo de cada lámina: por eso las alas se cortan de punta a punta.`
    : `You need ${n} sheets of 3 × 100 × 1000 mm balsa for the ${pieces} pieces (you use ${Math.round(packing.usedPct)}% of the wood). The grain runs along each sheet, so the wings are cut tip to tip.`;
  $('#js-chips').innerHTML = packing.sheets.map((s, k) => `<button type="button" class="chip" data-k="${k}">${t.sheetN} ${k + 1}</button>`).join('');
  $('#js-chips').querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => { const k = +b.dataset.k; goCam({ target: V3(0, 0, -330 + k * 140 + 50), pos: V3(0, 520, -330 + k * 140 + 50 + 330) }); }));
}

// ------------------------------------------------------------ selection and card
const partList = () => [...D.PARTS.map((p) => p.id), 'clay'];
function select(id, silent = false) {
  sel = sel === id && !silent ? null : id; if (silent) sel = id;
  for (const o of inst) {
    const on = !sel || o.part.id === sel, m = o.mesh.material;
    m.transparent = !on; m.opacity = on ? 1 : 0.16; m.depthWrite = on; m.needsUpdate = true;
    if (o.edges) o.edges.material.opacity = on ? 0.5 : 0.1;
    if (m.emissive) { m.emissive.setHex(sel && on ? 0x6a4a10 : 0x000000); m.emissiveIntensity = sel && on ? 0.35 : 0; }
  }
  el.chips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset.id === sel));
  if (sel && !silent) showCard(sel); else if (!sel) closeCard();
}
function metaFor(id) {
  const t = UI[lang], out = [];
  if (id === 'clay') { out.push(lang === 'es' ? 'No es madera' : 'Not wood', `${t.weight}: ${clayG.toFixed(1)} ${t.g}`); return out; }
  const p = D.PARTS.find((q) => q.id === id), its = inst.filter((o) => o.part.id === id), b = D.bbox(its[0].it.outline);
  const du = b.x1 - b.x0, dv = b.y1 - b.y0, a = p.grain === 'v' ? [dv, du] : [du, dv];
  out.push(`× ${its.length}`, `${t.size}: ${Math.round(a[0])} × ${Math.round(a[1])} × ${T} ${t.mm}`, `${t.grain}: ${p.grain === 'v' ? t.grainV : t.grainU}`, `${t.weight}: ${D.massOf(its[0].it).toFixed(1)} ${t.g}`, `${t.toSheet} ${[...new Set(its.map((o) => o.sheetIdx + 1))].join(' + ')}`);
  return out;
}
function showCard(id) {
  const P = PART[id], t = UI[lang]; $('#jc-name').textContent = `${id === 'clay' ? D.CLAY.n : D.PARTS.find((q) => q.id === id).n} · ${P.name[lang]}`;
  $('#jc-meta').innerHTML = metaFor(id).map((s) => `<span>${s}</span>`).join(''); $('#jc-kid').textContent = P.kid[lang]; $('#jc-adult').textContent = P.adult[lang];
  el.card.classList.add('open'); el.card.classList.toggle('adult', cardAdult);
}
function closeCard() { el.card.classList.remove('open', 'adult'); cardAdult = false; }
function buildChips() {
  el.chips.innerHTML = partList().map((id) => `<button type="button" class="chip" data-id="${id}"><b>${id === 'clay' ? D.CLAY.n : D.PARTS.find((q) => q.id === id).n}</b><span>${PART[id].name[lang]}</span></button>`).join('');
  el.chips.querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => select(c.dataset.id)));
}
function buildPaints() {
  el.paints.innerHTML = D.PAINTS.map((p) => `<button type="button" data-id="${p.id}" style="background:${p.swatch}" aria-label="${p.en}"></button>`).join('');
  el.paints.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { setPaint(b.dataset.id); }));
}
function setPaint(id) {
  paintId = id; const P = D.PAINTS.find((p) => p.id === id);
  for (const o of inst) {
    if (o.clay) continue; if (id === 'wood') { o.mesh.material = o.wood; o.edges.material.color.setHex(0x6f4f26); continue; }
    const c = { spine: P.body, inner: P.mid, cheek: P.tail, wing: P.wing, tail: P.wing, elev: P.accent, canopy: P.canopy }[o.part.id];
    o.paint.color.set(c); o.mesh.material = o.paint; o.edges.material.color.setHex(0x1d232d);
  }
  el.paints.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.id === id)); select(sel, true);
}

// ------------------------------------------------------------ fly: balance, trim, throw
function renderFly() {
  const w = D.weight(clayG), t = UI[lang], pc = w.pc;
  $('#jf-mark').style.left = `${clamp(((70 - pc) / 90) * 100, 1, 99)}%`;      // the left end is tail-heavy, the right end nose-heavy $('#jf-pc').textContent = `${Math.round(pc)} ${t.pc}`;
  $('#jf-clay-o').textContent = `${clayG.toFixed(1)} ${t.g}`; $('#jf-elev-o').textContent = `${Math.abs(elevDeg)}° ${elevDeg === 0 ? '' : elevDeg > 0 ? t.up : t.down}`;
  $('#jf-tail').textContent = t.tail; $('#jf-nose').textContent = t.nose; $('#jf-clay-l').textContent = t.clay; $('#jf-elev-l').textContent = t.elev; $('#jf-throw').textContent = flight ? t.again : t.throwIt; $('#jf-adult').textContent = FLY_ADULT[lang];
  const hinge = -elevDeg * (Math.PI / 180); for (const o of inst) if (o.kind === 'elev') o.hinge.rotation.set(0, hinge, 0);
  for (const o of inst) if (o.clay) { /* clay grows with the slider */ }
}
function resetFlight() {
  flight = null; flown = null; rig.position.set(-120, 1800, 0); rig.rotation.set(0, 0, 0.4); camTween = null;
  camera.position.set(-120 + 120, 1950, 760); controls.target.set(-120, 1800, 0); controls.update(); explode = 0; $('#jf-throw').textContent = UI[lang].throwIt;
}
function throwIt() {
  if (flight) { resetFlight(); renderFly(); return; }
  const w = D.weight(clayG), r = simulate({ massG: w.g, cgPct: w.pc, elevDeg });
  flight = { r, t: 0, slow: 0.55 }; $('#jf-throw').textContent = UI[lang].again; el.toast.classList.remove('show');
}
function flyFrame(dt) {
  if (!flight) return;
  const f = flight, r = f.r; f.t += dt * f.slow; const path = r.path;
  let i = Math.min(path.length - 1, Math.floor(f.t * 60)); const a = path[i], b = path[Math.min(path.length - 1, i + 1)], k = f.t * 60 - i, lerp = (p, q) => p + (q - p) * clamp(k, 0, 1);
  const x = lerp(a.x, b.x), y = lerp(a.y, b.y); let th = lerp(a.th, b.th);
  if (r.outcome === 'glide' || r.outcome === 'short') th *= 1 - clamp((f.t * 60 - (path.length - 28)) / 28, 0, 1);      // the nose levels out just before it lands
  rig.position.set(-120 + x * 1000, Math.max(y * 1000, 4), 0); rig.rotation.set(0, 0, th);
  if (f.t * 60 >= path.length - 1 && !f.done) { f.done = true; const d = r.x.toFixed(1); const good = r.outcome === 'glide' && r.x >= 12; el.toast.textContent = good ? (lang === 'es' ? `¡Planeo perfecto! Voló ${d} m.` : `Perfect glide! It flew ${d} m.`) : RESULT[r.outcome][lang](d); el.toast.classList.remove('show'); void el.toast.offsetWidth; el.toast.classList.add('show'); }
}

// ------------------------------------------------------------ the loop
const tmpV = V3(), tmpQ = new THREE.Quaternion(), ctr = V3();
function frame(now) {
  if (!running) return; raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; clock += dt;
  const e = smooth(explode);
  for (const o of inst) {
    const want = o.want ?? 0; if (o.delay > 0 && o.t !== want) o.delay -= dt; else o.t += clamp(want - o.t, -dt * 0.75, dt * 0.75);
    const tt = smooth(clamp(o.t, 0, 1));
    tmpV.copy(o.asmP).addScaledVector(o.exV, e); o.root.position.copy(tmpV).lerp(o.shP, tt); o.root.position.y += Math.sin(Math.PI * tt) * (o.clay ? 80 : 120);
    if (o.clay) { o.root.visible = !(mode === 'build' && step < 8 && o.t < 0.05) || true; continue; }
    o.root.quaternion.copy(o.asmQ).slerp(o.shQ, tt);
  }
  if (mode === 'fly') { flyFrame(dt); const tgt = V3().copy(rig.position); if (flight) { camera.position.lerp(V3(tgt.x + 120, tgt.y + 160, tgt.z + 760), 1 - Math.exp(-dt * 3)); controls.target.lerp(tgt, 1 - Math.exp(-dt * 6)); } blob.position.set(rig.position.x, 1, 0); const hgt = Math.max(0, rig.position.y); blob.scale.set(150 + hgt * 0.04, 40 + hgt * 0.015, 1); blob.material.opacity = clamp(0.38 - hgt / 6000, 0.08, 0.38); }
  if (camTween) { camTween.t += dt / camTween.dur; const k = smooth(clamp(camTween.t, 0, 1)); controls.target.lerpVectors(camTween.aT, camTween.bT, k); camera.position.lerpVectors(camTween.aP, camTween.bP, k); if (camTween.t >= 1) camTween = null; }
  controls.update(); renderer.render(scene, camera); updateTags();
}
function updateTags() {
  const w = root.clientWidth, h = root.clientHeight, show = (mode === 'look' && explode > 0.25) || mode === 'sheets' || (mode === 'build' && step === 0);
  const seen = new Set();
  for (const o of inst) {
    if (!o.label) { o.label = document.createElement('div'); o.label.className = 'bal-tag'; o.label.textContent = o.clay ? D.CLAY.n : o.part.n; el.tags.appendChild(o.label); }
    const first = !seen.has(o.part.id); seen.add(o.part.id); const buildOn = mode === 'build' && step > 0 && (o.part.step ?? 1) === step;
    const vis = (show && (first || mode === 'sheets')) || buildOn;
    if (!vis) { o.label.style.opacity = 0; continue; }
    if (o.clay) ctr.copy(o.root.position).add(rig.position); else { ctr.set((o.b.x0 + o.b.x1) / 2, (o.b.y0 + o.b.y1) / 2, 1.5); o.holder.localToWorld(ctr); }
    ctr.project(camera); if (ctr.z > 1 || Math.abs(ctr.x) > 1.05 || Math.abs(ctr.y) > 1.05) { o.label.style.opacity = 0; continue; }
    o.label.style.transform = `translate(-50%, -50%) translate(${((ctr.x + 1) / 2) * w}px, ${((1 - ctr.y) / 2) * h}px)`; o.label.style.opacity = 1; o.label.classList.toggle('dim', !!sel && sel !== o.part.id);
  }
}

// ------------------------------------------------------------ text, language, input
function refreshText() {
  const t = UI[lang]; $('#bal-title').textContent = t.title; $('#bal-sub').textContent = t.sub; $('#jm-look').textContent = t.look; $('#jm-build').textContent = t.build; $('#jm-sheets').textContent = t.sheets; $('#jm-fly').textContent = t.fly; $('#jp-pull-l').textContent = t.pull;
  document.querySelectorAll('#view-balsa .lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === lang));
  buildChips(); if (sel) { el.chips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset.id === sel)); showCard(sel); }
  if (mode === 'build') setStep(step); if (mode === 'sheets') renderSheetsPanel(); renderFly();
}
function speak(text) { if (!('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = UI[lang].speech; u.rate = 0.88; speechSynthesis.speak(u); }
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick(cx, cy) {
  const r = canvas.getBoundingClientRect(); ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(inst.map((o) => o.mesh).filter((m) => m.parent && m.visible), false); if (!hits.length) return null;
  const o = inst.find((q) => q.mesh === hits[0].object); return o?.part.id ?? null;
}
let bound = false;
function bind() {
  if (bound) return; bound = true; let down = null, ptrs = 0, multi = false;
  canvas.addEventListener('pointerdown', (e) => { ptrs++; if (ptrs > 1) { multi = true; down = null; } else { multi = false; down = { x: e.clientX, y: e.clientY, t: performance.now() }; } });
  const up = (e, cancelled) => { ptrs = Math.max(0, ptrs - 1); if (!cancelled && down && !multi && performance.now() - down.t < 600 && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 10 && mode !== 'fly') { const id = pick(e.clientX, e.clientY); if (id) select(id); else if (sel) select(null); } if (!ptrs) { down = null; multi = false; } };
  canvas.addEventListener('pointerup', (e) => up(e, false)); canvas.addEventListener('pointercancel', (e) => up(e, true));
  el.modes.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => setMode(b.dataset.mode)));
  el.pull.addEventListener('input', () => { explode = +el.pull.value / 100; });
  $('#jc-close').addEventListener('click', () => select(null)); $('#jc-info').addEventListener('click', () => { cardAdult = !cardAdult; el.card.classList.toggle('adult', cardAdult); });
  $('#jc-say').addEventListener('click', () => { if (sel) speak(`${PART[sel].name[lang]}. ${PART[sel].kid[lang]}`); });
  $('#jb-prev').addEventListener('click', () => setStep(step - 1)); $('#jb-next').addEventListener('click', () => setStep(step + 1)); $('#jb-info').addEventListener('click', () => $('.jp.build').classList.toggle('adult'));
  $('#jb-say').addEventListener('click', () => speak(`${STEPS[step].name[lang]}. ${STEPS[step].kid[lang]}`)); $('#jb-go').addEventListener('click', () => setMode('fly'));
  $('#jf-clay').addEventListener('input', (e) => { setClay(+e.target.value); renderFly(); if (flight) { flight = null; resetFlight(); } }); $('#jf-elev').addEventListener('input', (e) => { elevDeg = +e.target.value; renderFly(); });
  $('#jf-throw').addEventListener('click', throwIt); $('#jf-info').addEventListener('click', () => $('.jp.fly').classList.toggle('adult'));
  $('#bal-paint').addEventListener('click', () => { el.paints.hidden = !el.paints.hidden; el.paints.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.id === paintId)); });
  $('#bal-reset').addEventListener('click', () => { if (mode === 'sheets') goCam(camSheets()); else if (mode !== 'fly') goCam(camLook(mode === 'build' ? 430 : 480)); else { resetFlight(); renderFly(); } });
  document.querySelectorAll('#view-balsa .lang button').forEach((b) => b.addEventListener('click', () => { lang = b.dataset.lang; refreshText(); speechSynthesis?.cancel(); }));
  new ResizeObserver(resize).observe(root);
}
function resize() { if (!renderer) return; const w = root.clientWidth, h = root.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w / h < 0.8 ? 52 : 40; camera.updateProjectionMatrix(); }

export async function enter() {
  running = true; lang = 'en'; el.loading.classList.remove('done');
  loadP ??= init().catch((e) => { console.error(e); el.loading.querySelector('p').textContent = 'Oops! Please reload.'; });
  await loadP; if (!ready || !running) return;
  lang = 'en'; paintId === 'wood' || setPaint('wood'); setMode('look'); explode = 0; el.pull.value = 0; refreshText(); resize(); lastT = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
}
export function leave() { running = false; cancelAnimationFrame(raf); speechSynthesis?.cancel(); }
