// Isaac's World Map: a 3D globe whose countries are painted with their flags.
// Tap a country -> panel with flag, name and capital.
import * as THREE from '../vendor/three.module.min.js';
import { OrbitControls } from '../vendor/OrbitControls.js';

const $ = (s) => document.querySelector(s);
const root = $('#view-map');
const canvas = $('#globe');
const ui = {
  loading: $('#loading'), bar: $('#loading-bar'), loadingText: $('#loading-text'),
  panel: $('#panel'), flag: $('#panel-flag'), name: $('#panel-name'),
  cap: $('#panel-cap'), capLabel: $('#panel-cap-label'),
};

const FOV = 38;
const MIN_DIST = 1.5;
// Shapes in the map data that have no ISO code of their own.
const NAME_FIX = { Somaliland: '706', Kosovo: 'XK', 'N. Cyprus': '196', 'Indian Ocean Ter.': '036' };
const TAP_SLOP = 12;        // px a finger may wander and still count as a tap
const TAP_FORGIVENESS = 16; // px around the tap we also look for a country (small fingers, small countries)

const rad = THREE.MathUtils.degToRad;
const clamp = THREE.MathUtils.clamp;

let ready = false, running = false, loadPromise = null, raf = 0, lastT = 0;
let renderer, scene, camera, controls, globe, highlight, hlCtx, hlTex;
let countries = [], idData, idW, idH;
let selected = null, fitDist = 3;
const anim = { active: false, dir: new THREE.Vector3(0, 0, 1), dist: 3 };
const shift = { x: 0, y: 0, tx: 0, ty: 0 };

// ---------------------------------------------------------------- lifecycle

export async function enter() {
  running = true;
  loadPromise ??= init().catch(fail);
  await loadPromise;
  if (!ready || !running) return;
  resize();
  if (!selected) controls.autoRotate = true;
  lastT = performance.now();
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(frame);
}

export function leave() {
  running = false;
  cancelAnimationFrame(raf);
  speechSynthesis?.cancel();
}

function fail(err) {
  console.error(err);
  ui.loadingText.textContent = 'Oops! Please reload the page.';
  ui.loading.querySelector('.spinner').style.animation = 'none';
}

function progress(p, text) {
  ui.bar.style.width = `${Math.round(p * 100)}%`;
  if (text) ui.loadingText.textContent = text;
}

// ---------------------------------------------------------------- data

async function init() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  progress(0.02, 'Loading the world…');
  const [world, info] = await Promise.all([
    fetch('data/world-50m.json').then((r) => r.json()),
    fetch('data/countries.json').then((r) => r.json()),
  ]);
  countries = buildCountries(topojson.feature(world, world.objects.countries).features, info);

  const flagged = countries.filter((c) => c.cca2);
  let done = 0;
  await pool(flagged, 10, async (c) => {
    c.flagImg = await loadFlag(c.cca2);
    progress(0.05 + 0.85 * (++done / flagged.length), 'Painting the flags…');
  });

  const maxTex = renderer.capabilities.maxTextureSize;
  const W = maxTex >= 4096 ? 4096 : 2048;
  progress(0.92, 'Painting the flags…');
  await new Promise((r) => setTimeout(r, 30)); // let the progress bar paint
  const mapCanvas = paintWorld(W, W / 2);
  buildIdMap(W / 2, W / 4);
  for (const c of countries) { c.flagImg?.revoke(); c.flagImg = null; }

  buildScene(mapCanvas);
  bindUi();
  ready = true;
  progress(1);
  ui.loading.classList.add('done');
}

function buildCountries(features, info) {
  const byKey = new Map();
  const decor = []; // shapes we paint but can't be tapped
  for (const f of features) {
    const key = f.id ?? NAME_FIX[f.properties.name];
    const polys = (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).map(makePoly);
    const meta = info[key];
    if (!meta) { decor.push({ polys, cca2: null, color: '#e3e8ef' }); continue; }
    let c = byKey.get(key);
    if (!c) { c = { key, name: meta.name, cca2: meta.cca2, capital: meta.capital, polys: [] }; byKey.set(key, c); }
    c.polys.push(...polys);
  }
  const list = [...byKey.values()];
  for (const c of list) {
    const main = c.polys.reduce((a, b) => (b.w * b.h > a.w * a.h ? b : a));
    c.lon = (main.x0 + main.x1) / 2;
    c.lat = (main.y0 + main.y1) / 2;
    c.span = Math.max(main.w * Math.cos(rad(c.lat)), main.h); // degrees, for picking a zoom level
    c.main = main;
  }
  list.forEach((c, i) => { c.idx = i + 1; });
  return [...list, ...decor];
}

function makePoly(rings) {
  let x0 = 180, x1 = -180, y0 = 90, y1 = -90;
  for (const [x, y] of rings[0]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return { rings, x0, x1, y0, y1, w: x1 - x0, h: y1 - y0 };
}

async function pool(items, size, fn) {
  let i = 0;
  await Promise.all(Array.from({ length: size }, async () => { while (i < items.length) await fn(items[i++]); }));
}

// Loads an SVG flag. Safari won't draw an SVG to a canvas unless it has width/height, so we add them.
async function loadFlag(code, retries = 1) {
  try {
    const text = await (await fetch(`flags/${code}.svg`)).text();
    const url = URL.createObjectURL(new Blob([text.replace('<svg ', '<svg width="640" height="480" ')], { type: 'image/svg+xml' }));
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    return { img, revoke: () => URL.revokeObjectURL(url) };
  } catch (e) {
    return retries ? loadFlag(code, retries - 1) : null;
  }
}

// ---------------------------------------------------------------- painting

const px = (lon, W) => ((lon + 180) / 360) * W;
const py = (lat, H) => ((90 - lat) / 180) * H;

function trace(ctx, rings, W, H) {
  ctx.beginPath();
  for (const ring of rings) {
    ring.forEach(([lon, lat], i) => (i ? ctx.lineTo(px(lon, W), py(lat, H)) : ctx.moveTo(px(lon, W), py(lat, H))));
    ctx.closePath();
  }
}

function averageColor(img) {
  const c = document.createElement('canvas'); c.width = 8; c.height = 6;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0, 8, 6);
  const d = x.getImageData(0, 0, 8, 6).data;
  let r = 0, g = 0, b = 0;
  for (let i = 0; i < d.length; i += 4) { r += d[i]; g += d[i + 1]; b += d[i + 2]; }
  const n = d.length / 4;
  return `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`;
}

function paintWorld(W, H) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');

  // ocean + faint grid lines so the sphere reads as a globe
  ctx.fillStyle = '#58b6f7'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = W / 2048 * 1.2; ctx.beginPath();
  for (let lon = -180; lon <= 180; lon += 30) { ctx.moveTo(px(lon, W), 0); ctx.lineTo(px(lon, W), H); }
  for (let lat = -60; lat <= 60; lat += 30) { ctx.moveTo(0, py(lat, H)); ctx.lineTo(W, py(lat, H)); }
  ctx.stroke();

  for (const c2 of countries) {
    const flag = c2.flagImg?.img;
    const avg = flag ? averageColor(flag) : (c2.color ?? '#e3e8ef');
    // One flag bitmap per country, sized for its biggest piece, so the SVG is only rasterised once.
    let bitmap = null;
    if (flag) {
      const m = c2.main ?? c2.polys[0];
      const bw = clamp(Math.round((m.w / 360) * W), 8, 1400), bh = clamp(Math.round((m.h / 180) * H), 8, 1400);
      bitmap = document.createElement('canvas'); bitmap.width = bw; bitmap.height = bh;
      bitmap.getContext('2d').drawImage(flag, 0, 0, bw, bh);
    }
    for (const p of c2.polys) {
      const bx = px(p.x0, W), by = py(p.y1, H), bw = (p.w / 360) * W, bh = (p.h / 180) * H;
      trace(ctx, p.rings, W, H);
      if (!bitmap || bw < 3 || bh < 3) { ctx.fillStyle = avg; ctx.fill('evenodd'); continue; }
      ctx.save(); ctx.clip('evenodd'); ctx.drawImage(bitmap, bx, by, bw, bh); ctx.restore();
    }
  }

  // borders
  ctx.lineJoin = 'round'; ctx.lineWidth = W / 2048 * 1.6; ctx.strokeStyle = 'rgba(255,255,255,.9)';
  for (const c2 of countries) for (const p of c2.polys) { trace(ctx, p.rings, W, H); ctx.stroke(); }
  return c;
}

// A hidden map where every country is one flat colour = its id. Lets us turn a tap into a country.
const idColor = (id) => `rgb(${id},${(id * 37) % 256},${(id * 91) % 256})`;
function buildIdMap(W, H) {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  for (const country of countries) {
    if (!country.idx) continue;
    ctx.fillStyle = idColor(country.idx);
    for (const p of country.polys) { trace(ctx, p.rings, W, H); ctx.fill('evenodd'); }
  }
  idData = ctx.getImageData(0, 0, W, H).data; idW = W; idH = H;
}

function countryAtUv(u, v) {
  const x = clamp(Math.floor(u * idW), 0, idW - 1), y = clamp(Math.floor((1 - v) * idH), 0, idH - 1);
  const i = (y * idW + x) * 4, id = idData[i];
  // edge pixels are blends of two colours; the check bytes reject those
  if (id && idData[i + 1] === (id * 37) % 256 && idData[i + 2] === (id * 91) % 256) return countries[id - 1];
  return null;
}

// ---------------------------------------------------------------- scene

function lonLatToVec3(lon, lat, r = 1) {
  return new THREE.Vector3(Math.cos(rad(lat)) * Math.cos(rad(lon)), Math.sin(rad(lat)), -Math.cos(rad(lat)) * Math.sin(rad(lon))).multiplyScalar(r);
}

function buildScene(mapCanvas) {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(FOV, 1, 0.05, 50);

  const tex = new THREE.CanvasTexture(mapCanvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  globe = new THREE.Mesh(new THREE.SphereGeometry(1, 128, 64), new THREE.MeshBasicMaterial({ map: tex }));
  scene.add(globe);

  // glowing outline of the selected country, on its own transparent layer
  const hl = document.createElement('canvas'); hl.width = mapCanvas.width; hl.height = mapCanvas.height;
  hlCtx = hl.getContext('2d');
  hlTex = new THREE.CanvasTexture(hl); hlTex.colorSpace = THREE.SRGBColorSpace;
  hlTex.generateMipmaps = false; hlTex.minFilter = THREE.LinearFilter; // redrawn on every tap: keep uploads cheap
  highlight = new THREE.Mesh(
    new THREE.SphereGeometry(1.002, 96, 48),
    new THREE.MeshBasicMaterial({ map: hlTex, transparent: true, depthWrite: false }),
  );
  scene.add(highlight);

  // soft atmosphere rim
  scene.add(new THREE.Mesh(
    new THREE.SphereGeometry(1.14, 64, 32),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, transparent: true, depthWrite: false,
      vertexShader: 'varying vec3 vN; void main(){ vN = normalize(normalMatrix * normal); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying vec3 vN; void main(){ float i = pow(max(0.72 - dot(vN, vec3(0.0, 0.0, 1.0)), 0.0), 3.5); gl_FragColor = vec4(0.55, 0.82, 1.0, clamp(i * 1.4, 0.0, 1.0)); }',
    }),
  ));

  controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableDamping = true; controls.dampingFactor = 0.1;
  controls.minDistance = MIN_DIST;
  controls.minPolarAngle = 0.05; controls.maxPolarAngle = Math.PI - 0.05;
  controls.autoRotate = true; controls.autoRotateSpeed = 0.6;
  controls.addEventListener('start', () => { anim.active = false; controls.autoRotate = false; });

  // start looking at Africa/Europe
  camera.position.copy(lonLatToVec3(10, 20, 3));
  resize();
  camera.position.setLength(fitDist);
}

// Spotlight: dim everything except the selected country, then draw a thin crisp line around it.
function drawHighlight(c) {
  const W = hlCtx.canvas.width, H = hlCtx.canvas.height;
  hlCtx.clearRect(0, 0, W, H);
  if (c) {
    hlCtx.fillStyle = 'rgba(6, 22, 70, .5)';
    hlCtx.fillRect(0, 0, W, H);
    hlCtx.globalCompositeOperation = 'destination-out';
    hlCtx.fillStyle = '#000';
    for (const p of c.polys) { trace(hlCtx, p.rings, W, H); hlCtx.fill('evenodd'); }
    hlCtx.globalCompositeOperation = 'source-over';
    hlCtx.lineJoin = 'round'; hlCtx.strokeStyle = '#fff'; hlCtx.lineWidth = W / 2048 * 2.4;
    for (const p of c.polys) { trace(hlCtx, p.rings, W, H); hlCtx.stroke(); }
  }
  hlTex.needsUpdate = true;
}

function resize() {
  if (!renderer) return;
  const w = root.clientWidth, h = root.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const half = Math.min(rad(FOV), 2 * Math.atan(Math.tan(rad(FOV) / 2) * camera.aspect)) / 2;
  fitDist = 1 / Math.sin(half) * 1.2;
  controls.maxDistance = fitDist * 1.15;
  if (camera.position.length() > controls.maxDistance) camera.position.setLength(controls.maxDistance);
  applyViewShift(true);
}

// Moves the globe away from the info panel by shifting the camera's view window.
function applyViewShift(force) {
  const w = root.clientWidth, h = root.clientHeight;
  if (force || Math.abs(shift.x - shift.tx) > 0.1 || Math.abs(shift.y - shift.ty) > 0.1) {
    camera.setViewOffset(w, h, shift.x, shift.y, w, h);
  }
}

// ---------------------------------------------------------------- frame loop

function frame(now) {
  if (!running) return;
  raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now;

  if (anim.active) stepAnim(dt);
  if (shift.x !== shift.tx || shift.y !== shift.ty) {
    const k = 1 - Math.exp(-dt * 8);
    shift.x += (shift.tx - shift.x) * k; shift.y += (shift.ty - shift.y) * k;
    if (Math.abs(shift.tx - shift.x) < 0.3) shift.x = shift.tx;
    if (Math.abs(shift.ty - shift.y) < 0.3) shift.y = shift.ty;
    applyViewShift(true);
  }
  // keep a finger drag roughly 1:1 with the surface, whatever the zoom
  controls.rotateSpeed = Math.tan(rad(FOV) / 2) * (camera.position.length() - 1) / Math.PI * 1.05;
  controls.update(dt);
  renderer.render(scene, camera);
}

function flyTo(dir, dist) {
  anim.dir.copy(dir).normalize();
  anim.dist = clamp(dist, MIN_DIST, controls.maxDistance);
  anim.active = true;
}

function stepAnim(dt) {
  const k = 1 - Math.exp(-dt * 5);
  const d = camera.position.length();
  const dir = camera.position.clone().normalize().lerp(anim.dir, k).normalize();
  const nd = d + (anim.dist - d) * k;
  camera.position.copy(dir).multiplyScalar(nd);
  if (dir.distanceTo(anim.dir) < 0.002 && Math.abs(nd - anim.dist) < 0.005) anim.active = false;
}

function zoomBy(factor) {
  controls.autoRotate = false;
  const d = anim.active ? anim.dist : camera.position.length();
  flyTo(anim.active ? anim.dir : camera.position, 1 + (d - 1) * factor);
}

// ---------------------------------------------------------------- picking

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

function pick(cx, cy) {
  const r = canvas.getBoundingClientRect();
  const probe = (x, y) => {
    ndc.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(globe, false)[0];
    return hit ? countryAtUv(hit.uv.x, hit.uv.y) : null;
  };
  const exact = probe(cx, cy);
  if (exact) return exact;
  for (const radius of [TAP_FORGIVENESS * 0.5, TAP_FORGIVENESS]) {
    for (let a = 0; a < 8; a++) {
      const hit = probe(cx + Math.cos(a * Math.PI / 4) * radius, cy + Math.sin(a * Math.PI / 4) * radius);
      if (hit) return hit;
    }
  }
  return null;
}

// ---------------------------------------------------------------- selection + panel

function select(c) {
  selected = c;
  drawHighlight(c);
  speechSynthesis?.cancel();

  ui.flag.src = `flags/${c.cca2}.svg`;
  ui.flag.alt = `Flag of ${c.name}`;
  ui.name.textContent = c.name;
  if (c.cca2 === 'aq') { ui.capLabel.textContent = 'Who lives here?'; ui.cap.textContent = 'Penguins! 🐧'; }
  else if (!c.capital) { ui.capLabel.textContent = 'Capital'; ui.cap.textContent = 'No capital city'; }
  else { ui.capLabel.textContent = 'Capital'; ui.cap.textContent = c.capital; }
  ui.panel.classList.remove('open'); void ui.panel.offsetWidth; // restart the pop animation
  ui.panel.classList.add('open');
  ui.panel.setAttribute('aria-hidden', 'false');

  const rect = ui.panel.getBoundingClientRect();
  shift.tx = 0; shift.ty = (rect.height + 14) / 2; // lift the globe above the bottom panel

  controls.autoRotate = false;
  // zoom so the country fills a comfortable part of the screen (narrow screens need to sit further back)
  const ext = rad(clamp(c.span, 2, 90) * 3) / Math.min(1, camera.aspect);
  flyTo(lonLatToVec3(c.lon, c.lat), 1 + ext / (2 * Math.tan(rad(FOV) / 2)));
}

function deselect() {
  selected = null;
  drawHighlight(null);
  ui.panel.classList.remove('open');
  ui.panel.setAttribute('aria-hidden', 'true');
  shift.tx = 0; shift.ty = 0;
  speechSynthesis?.cancel();
}

function speak() {
  if (!selected || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const text = selected.capital && selected.cca2 !== 'aq'
    ? `${selected.name}. The capital is ${selected.capital}.` : selected.name;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'en-US'; u.rate = 0.8;
  speechSynthesis.speak(u);
}

function randomCountry() {
  const pool = countries.filter((c) => c.idx && c.capital);
  let c; do { c = pool[Math.floor(Math.random() * pool.length)]; } while (c === selected);
  select(c);
}

// ---------------------------------------------------------------- input

let down = null, pointers = 0, multi = false;
function bindUi() {
  canvas.addEventListener('pointerdown', (e) => {
    pointers++;
    if (pointers > 1) { multi = true; down = null; } else { multi = false; down = { x: e.clientX, y: e.clientY, t: performance.now() }; }
  });
  const up = (e, cancelled) => {
    pointers = Math.max(0, pointers - 1);
    if (!cancelled && down && !multi && performance.now() - down.t < 800
        && Math.hypot(e.clientX - down.x, e.clientY - down.y) < TAP_SLOP) onTap(e.clientX, e.clientY);
    if (!pointers) { down = null; multi = false; }
  };
  canvas.addEventListener('pointerup', (e) => up(e, false));
  canvas.addEventListener('pointercancel', (e) => up(e, true));

  $('#panel-close').addEventListener('click', deselect);
  $('#btn-speak').addEventListener('click', speak);
  $('#btn-random').addEventListener('click', randomCountry);
  $('#btn-zoom-in').addEventListener('click', () => zoomBy(0.55));
  $('#btn-zoom-out').addEventListener('click', () => zoomBy(1 / 0.55));
  new ResizeObserver(resize).observe(root);
}

function onTap(x, y) {
  const c = pick(x, y);
  if (c) select(c); else if (selected) deselect();
}
