// Isaac's insects: explore a 3D insect (swipe to turn, pinch to zoom), tap a part to learn about it,
// remove parts, show only one part, or explode the whole insect.
import * as THREE from '../vendor/three.module.min.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

const $ = (s) => document.querySelector(s);
const root = $('#view-insect');
const canvas = $('#insect-canvas');
const ui = {
  loading: $('#insect-loading'), card: $('#insect-card'), name: $('#ic-name'), desc: $('#ic-desc'),
  only: $('#ic-only'), remove: $('#ic-remove'), chips: $('#insect-chips'), explode: $('#btn-explode'),
  title: $('#insect-name'), sci: $('#insect-sci'), cards: $('#insect-cards'),
  walk: $('#btn-walk'), fly: $('#btn-fly'),
};
const T = {
  en: { say: 'Say it', only: 'Only this', all: 'Show all', remove: 'Remove', back: 'Put back', walk: 'Walk', fly: 'Fly', speech: 'en-US' },
  es: { say: 'Escucha', only: 'Solo esto', all: 'Mostrar todo', remove: 'Quitar', back: 'Poner', walk: 'Caminar', fly: 'Volar', speech: 'es-ES' },
};
const ORDER = ['beetle', 'bee', 'ant', 'ladybug', 'fly', 'spider'];
const FOV = 36;

let registry = {}, built = {}, lang = 'en', loading = null;
let renderer, scene, camera, controls, pmrem, raf = 0, running = false, lastT = 0, thumbsDone = false;
let key, ground, scroller, prevRootY = 0;
let cur = null; // the insect on screen: { id, mod, root, parts: Map, center, radius }
let selection = null; // { ids:Set, name, desc }
let isolated = false, exploded = false;
const anim = { active: false, target: new THREE.Vector3(), dist: 8 };
const shift = { y: 0, ty: 0 }; // lifts the model above the card at the bottom
let homeDist = 8;

// ------------------------------------------------------------ loading
async function loadModules() {
  const results = await Promise.allSettled(ORDER.map((id) => import(`./insects/${id}.js`)));
  results.forEach((r, i) => { if (r.status === 'fulfilled') registry[ORDER[i]] = r.value; else console.warn('insect failed', ORDER[i], r.reason); });
}

function makeInsect(id) {
  if (built[id]) return built[id];
  const mod = registry[id], group = mod.build();
  const parts = new Map();
  const box = new THREE.Box3();
  group.children.forEach((c) => { if (c.userData.partId) box.union(new THREE.Box3().setFromObject(c)); });
  const center = box.getCenter(new THREE.Vector3()), radius = box.getBoundingSphere(new THREE.Sphere()).radius;
  group.children.forEach((c) => {
    if (!c.userData.partId) return;
    const b = new THREE.Box3().setFromObject(c), pc = b.getCenter(new THREE.Vector3());
    const dir = pc.clone().sub(center); dir.y += radius * 0.18; dir.normalize();
    const mats = [], meshes = [];
    c.traverse((o) => { if (o.isMesh) { meshes.push(o); o.material.userData.baseOpacity ??= o.material.opacity; mats.push(o.material); } });
    parts.set(c.userData.partId, {
      id: c.userData.partId, obj: c, cat: c.userData.category, info: c.userData.info, dir, mats, meshes, center: pc, size: b.getSize(new THREE.Vector3()).length(),
      base: c.position.clone(), removed: false, hidden: false, op: 1, off: new THREE.Vector3(),
    });
  });
  return (built[id] = { id, mod, root: group, parts, center, radius, motion: mod.motion?.(group) ?? null });
}

function setupRenderer() {
  if (renderer) return;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = THREE.NeutralToneMapping; renderer.toneMappingExposure = 1.12;
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  scene = new THREE.Scene();
  pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.7;
  key = new THREE.DirectionalLight(0xfff4e6, 2.2); key.position.set(4, 9, 5); key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; scene.add(key);
  const rim = new THREE.DirectionalLight(0xbfe8ff, 0.9); rim.position.set(-6, 3, -5); scene.add(rim);
  ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.38 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  scroller = makeScroller(); scene.add(scroller);
  scene.add(new THREE.HemisphereLight(0xdfffe8, 0x1c3a2a, 0.55));
  camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  controls = new OrbitControls(camera, canvas);
  controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.09; controls.rotateSpeed = 0.9; controls.zoomSpeed = 0.9;
  controls.addEventListener('start', () => { anim.active = false; });
  bind();
  if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__insect = { get camera() { return camera; }, get controls() { return controls; }, get cur() { return cur; }, select, deselect };
}

// A faintly speckled floor that slides backwards while the insect walks (so the feet seem to grip the ground)
function makeScroller() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d');
  let a = 7; const r = () => { a = (a * 16807) % 2147483647; return a / 2147483647; };
  for (let i = 0; i < 160; i++) { x.fillStyle = r() > 0.5 ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.28)'; x.beginPath(); x.arc(r() * 256, r() * 256, 1.5 + r() * 5, 0, 7); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(14, 14);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.visible = false; m.userData.tile = 40 / 14;
  return m;
}

// ------------------------------------------------------------ list + thumbnails
function renderList() {
  ui.cards.innerHTML = ORDER.filter((id) => registry[id]).map((id) => {
    const i = registry[id].info;
    return `<a class="insect-card-tile" href="#/isaac/insects/${id}"><div class="thumb" data-id="${id}"><span>${i.icon}</span></div><b>${i.name[lang]}</b><i>${i.sci}</i></a>`;
  }).join('');
  if (thumbsDone) fillThumbs();
}

async function makeThumbs() {
  const r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  r.setSize(360, 360); r.setPixelRatio(1); r.toneMapping = THREE.NeutralToneMapping;
  const sc = new THREE.Scene(), pm = new THREE.PMREMGenerator(r);
  sc.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const k = new THREE.DirectionalLight(0xffffff, 1.8); k.position.set(4, 8, 5); sc.add(k); sc.add(new THREE.HemisphereLight(0xdfffe8, 0x1c3a2a, 0.55));
  const cam = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  for (const id of ORDER.filter((i) => registry[i])) {
    await new Promise((res) => setTimeout(res, 40)); // one insect at a time so the page stays responsive
    const m = makeInsect(id);
    sc.add(m.root);
    const d = m.radius / Math.sin(THREE.MathUtils.degToRad(FOV / 2)) * 0.8;
    cam.position.copy(m.center).addScaledVector(m.mod.info.cameraDir, d); cam.lookAt(m.center);
    r.render(sc, cam); thumbUrls[id] = r.domElement.toDataURL('image/png');
    sc.remove(m.root); fillThumbs();
  }
  pm.dispose(); r.dispose(); r.forceContextLoss();
}
let thumbUrls = {};
function fillThumbs() {
  ui.cards.querySelectorAll('.thumb').forEach((t) => { const u = thumbUrls[t.dataset.id]; if (u) t.innerHTML = `<img src="${u}" alt="">`; });
}

// ------------------------------------------------------------ enter / leave
export async function enter(view, id) {
  loading ??= loadModules();
  await loading;
  setLang(lang, true);
  if (view === 'insects') {
    renderList();
    if (!thumbsDone) { thumbsDone = true; setTimeout(() => { makeThumbs().catch((e) => console.warn(e)); }, 60); }
    return;
  }
  if (!registry[id]) { location.hash = '#/isaac/insects'; return; }
  setupRenderer();
  ui.loading.classList.remove('done');
  await new Promise((r) => setTimeout(r, 30));
  show(id);
  ui.loading.classList.add('done');
  running = true; lastT = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
}

export function leave() { running = false; cancelAnimationFrame(raf); speechSynthesis?.cancel(); }

function show(id) {
  if (cur) scene.remove(cur.root);
  cur = makeInsect(id);
  resetState(); shift.y = shift.ty = 0; camera.clearViewOffset();
  ui.walk.hidden = !cur.motion; ui.fly.hidden = !cur.motion?.canFly;
  scene.add(cur.root);
  ground.position.y = cur.root.userData.groundY ?? -1; scroller.position.y = ground.position.y + 0.004; prevRootY = 0;
  { const r = cur.radius * 1.5, sc = key.shadow.camera; sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.near = 0.5; sc.far = 40; sc.updateProjectionMatrix(); key.target.position.copy(cur.center); key.target.updateMatrixWorld(); }
  const { mod } = cur;
  ui.title.textContent = mod.info.name[lang]; ui.sci.textContent = mod.info.sci;
  buildChips();
  resize();
  const d = homeDistance();
  homeDist = d;
  controls.target.copy(cur.center); controls.minDistance = cur.radius * 0.45; controls.maxDistance = d * 1.6;
  camera.position.copy(cur.center).addScaledVector(mod.info.cameraDir, d);
  controls.update();
}

function homeDistance() {
  const aspect = camera.aspect, vf = THREE.MathUtils.degToRad(FOV), hf = 2 * Math.atan(Math.tan(vf / 2) * aspect);
  return (cur.radius * 1.12) / Math.sin(Math.min(vf, hf) / 2);
}

function resetState() {
  selection = null; isolated = false; exploded = false;
  cur.motion?.snap(); ui.walk.classList.remove('on'); ui.fly.classList.remove('on'); cur.root.position.y = 0; cur.root.rotation.set(0, 0, 0);
  ui.explode.classList.remove('on'); ui.card.classList.remove('open');
  for (const p of cur.parts.values()) { p.removed = false; p.hidden = false; p.op = 1; p.off.set(0, 0, 0); p.obj.position.copy(p.base); p.obj.visible = true; applyOpacity(p, 1); setGlow(p, false); }
  refreshChips();
}

function resize() {
  if (!renderer) return;
  const w = root.clientWidth, h = root.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  if (cur) { homeDist = homeDistance(); controls.maxDistance = homeDist * 1.6; }
}

// ------------------------------------------------------------ parts, selection
function pName(p) { return p.info[lang] ?? p.info.en; }
function pDesc(p) { return p.info[lang === 'es' ? 'dEs' : 'dEn']; }
function catInfo(cat) { const c = cur.mod.categories[cat]; return { name: c[lang], desc: c[lang === 'es' ? 'dEs' : 'dEn'] }; }

function select(ids, name, desc) {
  selection = { ids: new Set(ids), name, desc };
  updateCard();
  const sel = [...ids].map((i) => cur.parts.get(i));
  const box = new THREE.Box3();
  sel.forEach((p) => { const c = p.center.clone().add(p.off); box.expandByPoint(c); box.expandByScalar(p.size * 0.28); });
  const c = box.getCenter(new THREE.Vector3()), r = Math.max(box.getBoundingSphere(new THREE.Sphere()).radius, cur.radius * 0.28);
  const d = Math.min(homeDist, Math.max((r * 2.1) / Math.sin(THREE.MathUtils.degToRad(FOV / 2)) * 0.75, controls.minDistance * 1.05));
  anim.target.copy(c); anim.dist = d; anim.active = true;
  shift.ty = (ui.card.getBoundingClientRect().height + 100) / 2;
  refreshChips();
}
function deselect() {
  selection = null; isolated = false; ui.card.classList.remove('open');
  for (const p of cur.parts.values()) if (!p.removed) p.hidden = false;
  anim.target.copy(cur.center); anim.dist = homeDist; anim.active = true; shift.ty = 0;
  refreshChips();
}

function selectedParts() { return selection ? [...selection.ids].map((i) => cur.parts.get(i)) : []; }

function updateCard() {
  if (!selection) { ui.card.classList.remove('open'); return; }
  const t = T[lang], sel = selectedParts(), allRemoved = sel.every((p) => p.removed);
  ui.name.textContent = selection.name; ui.desc.textContent = selection.desc;
  ui.only.querySelector('span').textContent = isolated ? t.all : t.only; ui.only.classList.toggle('on', isolated);
  ui.remove.querySelector('span').textContent = allRemoved ? t.back : t.remove; ui.remove.classList.toggle('on', allRemoved);
  ui.card.classList.add('open');
}

function buildChips() {
  const cats = [...new Set([...cur.parts.values()].map((p) => p.cat))];
  ui.chips.innerHTML = cats.map((c) => `<button type="button" class="chip" data-cat="${c}">${cur.mod.categories[c][lang]}</button>`).join('');
  ui.chips.querySelectorAll('.chip').forEach((b) => b.addEventListener('click', () => {
    const cat = b.dataset.cat, ids = [...cur.parts.values()].filter((p) => p.cat === cat).map((p) => p.id);
    if (selection && selection.cat === cat) { deselect(); return; }
    const ci = catInfo(cat); select(ids, ci.name, ci.desc); selection.cat = cat; refreshChips();
  }));
  refreshChips();
}
function refreshChips() {
  ui.chips.querySelectorAll('.chip').forEach((b) => b.classList.toggle('on', !!selection && selection.cat === b.dataset.cat));
}

function toggleRemove() {
  const sel = selectedParts(), allRemoved = sel.every((p) => p.removed);
  sel.forEach((p) => { p.removed = !allRemoved; p.hidden = false; });
  isolated = false; updateCard();
}
function toggleOnly() {
  if (isolated) { for (const p of cur.parts.values()) if (!p.removed) p.hidden = false; isolated = false; }
  else { for (const p of cur.parts.values()) if (!selection.ids.has(p.id)) p.hidden = true; for (const p of selectedParts()) { p.removed = false; p.hidden = false; } isolated = true; }
  updateCard();
}

function speak() {
  if (!selection || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(`${selection.name}. ${selection.desc}`); u.lang = T[lang].speech; u.rate = 0.85; speechSynthesis.speak(u);
}

function setLang(l, silent) {
  lang = l;
  document.querySelectorAll('#view-insect .lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === l));
  const t = T[l];
  $('#ic-speak-l').textContent = t.say; $('#lbl-walk').textContent = t.walk; $('#lbl-fly').textContent = t.fly;
  if (registry.beetle || Object.keys(registry).length) {
    if (!ui.cards.hidden) renderList();
    if (cur && !silent) {
      ui.title.textContent = cur.mod.info.name[l]; buildChips();
      if (selection) { const one = selection.ids.size === 1 && !selection.cat; if (one) { const p = cur.parts.get([...selection.ids][0]); selection.name = pName(p); selection.desc = pDesc(p); } else { const ci = catInfo(selection.cat); selection.name = ci.name; selection.desc = ci.desc; } updateCard(); refreshChips(); }
    }
  }
  speechSynthesis?.cancel();
}

// ------------------------------------------------------------ materials, frame loop
function applyOpacity(p, op) {
  p.mats.forEach((m) => {
    const base = m.userData.baseOpacity ?? 1;
    m.opacity = base * op; const fading = op < 0.995 || base < 1;
    if (m.transparent !== fading) { m.transparent = fading; m.needsUpdate = true; }
    m.depthWrite = op > 0.6 && base >= 1 ? true : base < 1 ? false : false;
  });
  p.obj.visible = op > 0.02;
}
const glowColor = new THREE.Color(0xffe27a);
function setGlow(p, on, t = 0) {
  p.mats.forEach((m) => { if (!m.emissive) return; if (on) { m.emissive.copy(glowColor); m.emissiveIntensity = 0.1 + 0.05 * Math.sin(t / 260); } else { m.emissiveIntensity = 0; } });
}

function frame(now) {
  if (!running) return;
  raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;
  const k = 1 - Math.exp(-dt * 9);
  const selVisible = selection ? [...selection.ids].some((i) => !cur.parts.get(i).removed) : false; // nothing to highlight once it's removed
  for (const p of cur.parts.values()) {
    const sel = selection?.ids.has(p.id);
    const tgtOp = p.removed || p.hidden ? 0 : selection && selVisible && !sel ? 0.2 : 1;
    p.op += (tgtOp - p.op) * k; if (Math.abs(tgtOp - p.op) < 0.003) p.op = tgtOp;
    applyOpacity(p, p.op);
    const tgtOff = p.removed ? p.dir.clone().multiplyScalar(cur.radius * 0.9) : exploded ? p.dir.clone().multiplyScalar(cur.radius * 0.45) : null;
    if (tgtOff) p.off.lerp(tgtOff, k); else p.off.lerp(new THREE.Vector3(), k);
    p.obj.position.copy(p.base).add(p.off);
    setGlow(p, !!sel && p.op > 0.05, now);
  }
  if (cur.motion) {
    const speed = cur.motion.update(dt);
    const ry = cur.root.position.y, dy = ry - prevRootY; prevRootY = ry;
    if (dy) { controls.target.y += dy; camera.position.y += dy; anim.target.y += dy; }
    const w = cur.motion.state.walk; scroller.visible = w > 0.01; scroller.material.opacity = 0.55 * w;
    scroller.material.map.offset.x += (speed * dt) / scroller.userData.tile;
  }
  if (anim.active) {
    const ka = 1 - Math.exp(-dt * 5);
    const dir = camera.position.clone().sub(controls.target).normalize();
    controls.target.lerp(anim.target, ka);
    const d = camera.position.distanceTo(controls.target), nd = d + (anim.dist - d) * ka;
    camera.position.copy(controls.target).addScaledVector(dir, nd);
    if (controls.target.distanceTo(anim.target) < 0.01 && Math.abs(nd - anim.dist) < 0.02) anim.active = false;
  }
  if (Math.abs(shift.y - shift.ty) > 0.2) { shift.y += (shift.ty - shift.y) * k; camera.setViewOffset(root.clientWidth, root.clientHeight, 0, shift.y, root.clientWidth, root.clientHeight); }
  controls.update();
  renderer.render(scene, camera);
}

// ------------------------------------------------------------ input
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
function pick(x, y) {
  const r = canvas.getBoundingClientRect();
  ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const meshes = [];
  for (const p of cur.parts.values()) if (p.op > 0.4) meshes.push(...p.meshes);
  const hit = ray.intersectObjects(meshes, false)[0];
  return hit ? cur.parts.get(hit.object.userData.partId) : null;
}

let bound = false;
function bind() {
  if (bound) return; bound = true;
  let down = null, pointers = 0, multi = false;
  canvas.addEventListener('pointerdown', (e) => { pointers++; if (pointers > 1) { multi = true; down = null; } else { multi = false; down = { x: e.clientX, y: e.clientY, t: performance.now() }; } });
  const up = (e, cancelled) => {
    pointers = Math.max(0, pointers - 1);
    if (!cancelled && down && !multi && performance.now() - down.t < 700 && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 10) onTap(e.clientX, e.clientY);
    if (!pointers) { down = null; multi = false; }
  };
  canvas.addEventListener('pointerup', (e) => up(e, false));
  canvas.addEventListener('pointercancel', (e) => up(e, true));
  $('#ic-speak').addEventListener('click', speak);
  ui.only.addEventListener('click', toggleOnly);
  ui.remove.addEventListener('click', toggleRemove);
  ui.explode.addEventListener('click', () => {
    exploded = !exploded; ui.explode.classList.toggle('on', exploded);
    if (!selection) { anim.target.copy(cur.center); anim.dist = Math.min(controls.maxDistance, homeDist * (exploded ? 1.3 : 1)); anim.active = true; }
  });
  const setMode = (m) => { if (!cur.motion || (m === 'fly' && !cur.motion.canFly)) return; const now = cur.motion.setMode(m); ui.walk.classList.toggle('on', now === 'walk'); ui.fly.classList.toggle('on', now === 'fly'); };
  ui.walk.addEventListener('click', () => setMode('walk'));
  ui.fly.addEventListener('click', () => setMode('fly'));
  $('#btn-ireset').addEventListener('click', () => {
    resetState(); shift.ty = 0; anim.target.copy(cur.center); anim.dist = homeDist; anim.active = true;
  });
  document.querySelectorAll('#view-insect .lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  new ResizeObserver(resize).observe(root);
}

function onTap(x, y) {
  const p = pick(x, y);
  if (!p) { if (selection) deselect(); return; }
  if (selection && selection.ids.size === 1 && selection.ids.has(p.id)) { deselect(); return; }
  select([p.id], pName(p), pDesc(p));
}

// list screen language switch lives in the viewer; the list follows the current language
