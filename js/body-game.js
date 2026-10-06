// Isaac's Human Body: a real human body in 3D (real anatomy data, see models/ATTRIBUTION.md) with the organs to put in and take out.
// Drag an organ from the tray onto the body and it settles in its right place (its outline lights up where while you hold it — it can never be
// "wrong": an organ dropped anywhere on the body glides home). Drag one out, or tap it and press the arrow, to take it out again. Tap an organ for
// what it does (the heart beats, the lungs breathe). Turn the body with a finger, pinch to zoom. Sound only follows a touch.
import { audio, unlock, loadBuf, playUrl, tone, setMuted, stop as stopSound, bubblePop, chime } from './sound.js';

const $ = (s) => document.querySelector(s);
const root = $('#view-body'), stage = $('#body-stage'), canvas = $('#body-canvas'), tray = $('#body-tray'), fx = $('#body-fx'), loading = $('#body-loading');
const card = $('#body-card'), cName = $('#bc-name'), cJob = $('#bc-job'), cAdult = $('#bc-adult');
const TRAY_ORDER = ['brain', 'heart', 'lungs', 'stomach', 'pancreas', 'liver', 'kidneys', 'smallint', 'largeint', 'bladder'];
const T = { en: { done: 'You built a whole body! 🎉' }, es: { done: '¡Armaste un cuerpo completo! 🎉' } };

let data = [], by = {}, lang = 'en', running = false, bound = false, soundOn = true, sel = null, ig = null, thumbs = {}, doneShown = false, skinOn = true;
const placed = new Set();
let pending = null, dr = null, bgDown = null, timers = [];
const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; };

// ---------------------------------------------------------------- sounds (all follow a touch)
const say = (id, job = false) => playUrl(`sounds/body/${lang}/${id}${job ? '-job' : ''}.mp3`, { gain: 1, stopPrev: true });
const thump = () => { tone(95, 0.14, 0.45, 'sine', 55); setTimeout(() => tone(80, 0.18, 0.35, 'sine', 50), 190); };
const land = (id) => { tone(330, 0.16, 0.2, 'sine', 520); setTimeout(() => tone(520, 0.2, 0.14, 'sine', 700), 90); if (id === 'heart') setTimeout(thump, 330); };

// ---------------------------------------------------------------- the tray
function buildTray() {
  tray.innerHTML = TRAY_ORDER.map((id) => `<button type="button" class="organ-chip" data-id="${id}"><img alt="" draggable="false" src="${thumbs[id] ?? ''}"><span></span></button>`).join('');
  tray.querySelectorAll('.organ-chip').forEach((b) => b.addEventListener('pointerdown', (e) => down(e, b.dataset.id, 'tray')));
  labels();
}
function labels() { tray.querySelectorAll('.organ-chip').forEach((b) => { b.querySelector('span').textContent = by[b.dataset.id]?.[lang] ?? ''; }); }
const chipEl = (id) => tray.querySelector(`.organ-chip[data-id="${id}"]`);
const refreshChips = () => tray.querySelectorAll('.organ-chip').forEach((b) => b.classList.toggle('in-body', placed.has(b.dataset.id)));

// ---------------------------------------------------------------- putting organs in and taking them out
function target(id, on) { if (ig) ig.targetId = on ? id : (ig.targetId === id ? null : ig.targetId); }
function put(id, at) {   // at = client point it was dropped on (or null)
  placed.add(id); refreshChips(); land(id); ig?.put(id, at);
  if (placed.size === TRAY_ORDER.length && !doneShown) { doneShown = true; later(celebrate, 700); }
}
function take(id, quiet) {
  if (!placed.has(id) && !quiet) return; placed.delete(id); doneShown = false; refreshChips(); ig?.take(id); if (sel === id) deselect();
  if (!quiet) { bubblePop(0.5); const c = chipEl(id); c.classList.remove('returned'); void c.offsetWidth; c.classList.add('returned'); }
}
function clearAll(quiet) { [...placed].forEach((id) => take(id, true)); deselect(); doneShown = false; if (quiet !== true) bubblePop(0.5); }
function celebrate() {
  chime(0.18); const m = document.createElement('div'); m.className = 'body-toast'; m.textContent = T[lang].done; stage.appendChild(m); later(() => m.remove(), 3600);
  for (let i = 0; i < 16; i++) { const h = document.createElement('i'); h.className = 'bh'; h.style.left = `${25 + Math.random() * 50}%`; h.style.setProperty('--d', `${(Math.random() * 0.9).toFixed(2)}s`); h.style.setProperty('--sz', `${22 + Math.random() * 22}px`); h.style.setProperty('--dx', `${Math.round((Math.random() - 0.5) * 120)}px`); fx.appendChild(h); later(() => h.remove(), 3200); }
}

// ---------------------------------------------------------------- the card (what it does)
function select(id) { deselectGlow(); sel = id; ig?.glow(id, true); fillCard(); card.classList.add('open'); card.classList.remove('adult'); ig?.focus(id); }
function fillCard() { if (!sel) return; cName.textContent = by[sel][lang]; cJob.textContent = by[sel]['job_' + lang]; cAdult.textContent = by[sel]['adult_' + lang]; }
function deselectGlow() { if (sel) ig?.glow(sel, false); }
function deselect() { deselectGlow(); sel = null; card.classList.remove('open', 'adult'); ig?.focus(null); }

// ---------------------------------------------------------------- touch: lift an organ, carry it, drop it
function down(e, id, src) { if (dr || e.button > 0) return; unlock(); pending = { id, src, x: e.clientX, y: e.clientY, pid: e.pointerId }; }
const overBody = (x, y) => !!ig?.overBody(x, y);
function lift(x, y) {
  const { id, src } = pending; pending = null; deselect();
  const g = document.createElement('div'); g.className = 'body-ghost'; g.innerHTML = `<img alt="" src="${thumbs[id] ?? ''}">`; document.body.appendChild(g);
  dr = { id, src, g }; moveGhost(x, y);
  if (src === 'body') ig?.hide(id); else chipEl(id).classList.add('lifted');
  target(id, true); say(id);
}
function moveGhost(x, y) { dr.g.style.transform = `translate(${x}px, ${y}px) translate(-50%, -62%)`; stage.classList.toggle('over', overBody(x, y)); }
function drop(x, y) {
  const { id, src, g } = dr; dr = null; g.remove(); stage.classList.remove('over'); target(id, false); chipEl(id)?.classList.remove('lifted');
  if (overBody(x, y)) { if (src === 'body') { placed.delete(id); ig?.take(id); } put(id, { x, y }); }
  else if (src === 'body') take(id);                         // carried out of the body: it goes back to the tray
}
function bindTouch() {
  document.addEventListener('pointermove', (e) => {
    if (dr) { moveGhost(e.clientX, e.clientY); return; }
    if (pending && e.pointerId === pending.pid && Math.hypot(e.clientX - pending.x, e.clientY - pending.y) > 9) lift(e.clientX, e.clientY);
  });
  const up = (e) => {
    if (ig) ig.controls.enabled = true;
    if (dr) { drop(e.clientX, e.clientY); return; }
    if (!pending || e.pointerId !== pending.pid) return; const p = pending; pending = null;
    if (e.type !== 'pointercancel') tap(p);
  };
  document.addEventListener('pointerup', up); document.addEventListener('pointercancel', up);
}
function tap({ id }) {
  if (placed.has(id)) { select(id); say(id); if (id === 'heart') setTimeout(thump, 350); }       // an organ in the body: what does it do?
  else { say(id); target(id, true); later(() => { if (!dr) target(id, false); }, 1800); const c = chipEl(id); c.classList.remove('wiggle'); void c.offsetWidth; c.classList.add('wiggle'); }   // in the tray: its name, and where it lives
}

// ---------------------------------------------------------------- the 3D body (loaded the first time)
async function init3D() {
  if (ig) return; loading.hidden = false;
  const [THREE, { OrbitControls }, M] = await Promise.all([import('../vendor/three.module.min.js'), import('../vendor/OrbitControls.js'), import('./body/model3d.js?v=4')]);
  const body = await M.loadBody(); thumbs = M.thumbnails(body); buildTray();
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100); scene.add(camera);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9c6d0, 1.5)); const key = new THREE.DirectionalLight(0xffffff, 2.3); key.position.set(3, 4, 6); camera.add(key); const fill = new THREE.DirectionalLight(0xcfe3ff, 0.9); fill.position.set(-4, -1, 3); camera.add(fill);
  scene.add(body.root);
  const controls = new OrbitControls(camera, canvas); controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.09; controls.minDistance = 1.6; controls.maxDistance = 17; controls.rotateSpeed = 0.9;
  const ray = new THREE.Raycaster(), v2 = new THREE.Vector2(), tmp = new THREE.Vector3(), tweens = [], skinMeshes = body.skin.children;
  let goal = null, dist = 11.4;
  const H = { THREE, renderer, scene, camera, controls, body, targetId: null, raf: 0, t0: performance.now() };
  const aim = (x, y) => { const r = canvas.getBoundingClientRect(); v2.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1); ray.setFromCamera(v2, camera); };
  const worldAt = (x, y, z) => { aim(x, y); return ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 0, 1), -z), new THREE.Vector3()) ?? new THREE.Vector3(0, 0, z); };
  H.overBody = (x, y) => { aim(x, y); return ray.intersectObject(skinMeshes[1], false).length > 0; };
  H.pick = (x, y) => { aim(x, y); const hit = ray.intersectObjects(Object.values(body.organs).filter((o) => o.visible), true)[0]; if (!hit) return null; let o = hit.object; while (o && !o.userData.id) o = o.parent; return o?.userData.id ?? null; };
  H.put = (id, at) => { const o = body.organs[id], to = o.userData.home.clone(); o.visible = true; o.scale.setScalar(1); const from = at ? worldAt(at.x, at.y, to.z) : to.clone().add(new THREE.Vector3(0, 0.5, 0.6)); tweens.push({ o, from, to, t0: performance.now(), dur: 620 }); };
  H.take = (id) => { body.organs[id].visible = false; };
  H.hide = (id) => { body.organs[id].visible = false; };
  H.glow = (id, on) => { const m = body.organs[id].userData.mat; m.emissive.setHex(on ? 0x6a5a10 : 0x000000); };
  H.focus = (id) => { goal = id ? { to: body.organs[id].userData.home.clone(), dist: Math.min(dist, 4.6) } : { to: new THREE.Vector3(0, 0, 0), dist }; };
  H.fit = () => { const r = stage.getBoundingClientRect(); if (!r.width || !r.height) return; renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; const tf = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)); dist = Math.max(3.25 / tf, 1.9 / tf / camera.aspect); camera.updateProjectionMatrix(); };
  H.reset = () => { camera.position.set(0, 0.1, dist); controls.target.set(0, 0, 0); goal = null; controls.update(); };
  H.skin = (on) => { body.skin.visible = on; body.bones.visible = true; };
  H.frame = () => {
    H.raf = requestAnimationFrame(H.frame); if (!running) return; const now = performance.now(), t = (now - H.t0) / 1000;
    for (let i = tweens.length - 1; i >= 0; i--) { const w = tweens[i], k = Math.min(1, (now - w.t0) / w.dur), e = 1 - (1 - k) ** 3, over = k < 0.7 ? 1 : 1 + 0.1 * Math.sin((k - 0.7) / 0.3 * Math.PI); w.o.position.lerpVectors(w.from, w.to, e); w.o.scale.setScalar((0.7 + 0.3 * e) * over); if (k >= 1) { w.o.position.copy(w.to); w.o.scale.setScalar(1); tweens.splice(i, 1); } }
    M.pulse(body.organs, t);
    for (const [id, g] of Object.entries(body.ghosts)) { const on = H.targetId === id && !placed.has(id); g.visible = on; if (on) g.userData.mat.opacity = 0.34 + 0.22 * Math.sin(t * 6); }
    if (goal) { controls.target.lerp(goal.to, 0.1); const d = camera.position.distanceTo(controls.target); tmp.copy(camera.position).sub(controls.target).setLength(d + (goal.dist - d) * 0.1); camera.position.copy(controls.target).add(tmp); if (controls.target.distanceTo(goal.to) < 0.01 && Math.abs(d - goal.dist) < 0.05) goal = null; }
    controls.update(); renderer.render(scene, camera);
  };
  // picking an organ in the body (a capture listener runs before the orbit controls, so they can be switched off while an organ is held)
  canvas.addEventListener('pointerdown', (e) => { unlock(); const id = H.pick(e.clientX, e.clientY); if (id) { controls.enabled = false; e.preventDefault(); down(e, id, 'body'); } else bgDown = { x: e.clientX, y: e.clientY, pid: e.pointerId }; }, true);
  new ResizeObserver(() => H.fit()).observe(stage); ig = H; H.fit(); H.reset(); H.frame();
  placed.forEach((id) => { body.organs[id].visible = true; });
  loading.hidden = true;
}

// ---------------------------------------------------------------- language, sound, the skin
function setLang(l) {
  lang = l; document.querySelectorAll('#view-body .lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === l)); labels(); fillCard();
  data.forEach((o) => { loadBuf(`sounds/body/${l}/${o.id}.mp3`); loadBuf(`sounds/body/${l}/${o.id}-job.mp3`); });
}
function bind() {
  if (bound) return; bound = true; bindTouch();
  const unlockNow = () => unlock(); root.addEventListener('pointerdown', unlockNow, true); root.addEventListener('touchend', unlockNow, true);
  document.querySelectorAll('#view-body .lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  $('#btn-bsound').addEventListener('click', () => { soundOn = !soundOn; $('#btn-bsound').classList.toggle('on', soundOn); setMuted(!soundOn); if (soundOn) unlock(); });
  $('#btn-bclear').addEventListener('click', () => clearAll());
  $('#btn-bskin').addEventListener('click', () => { skinOn = !skinOn; $('#btn-bskin').classList.toggle('on', skinOn); ig?.skin(skinOn); });
  $('#bc-say').addEventListener('click', () => { if (sel) { unlock(); say(sel, true); if (sel === 'heart') setTimeout(thump, 200); } });
  $('#bc-info').addEventListener('click', () => card.classList.toggle('adult'));
  $('#bc-out').addEventListener('click', () => { if (sel) take(sel); });
  canvas.addEventListener('pointerup', (e) => { if (bgDown && e.pointerId === bgDown.pid && Math.hypot(e.clientX - bgDown.x, e.clientY - bgDown.y) < 8) deselect(); bgDown = null; });
}

export async function enter() {
  running = true; setMuted(!soundOn); audio(); bind();
  if (!data.length) { data = await fetch('data/body.json').then((r) => r.json()).catch(() => []); by = Object.fromEntries(data.map((o) => [o.id, o])); }
  if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__body = { get ig() { return ig; }, all() { TRAY_ORDER.forEach((id) => put(id, null)); }, put: (id) => put(id, null), select };   // dev helper
  if (!running) return;
  try { await init3D(); } catch (err) { console.error(err); loading.hidden = true; return; }
  if (!running) return; clearAll(true); setLang('en'); refreshChips(); skinOn = true; $('#btn-bskin').classList.add('on'); ig.skin(true); ig.fit(); ig.reset();
}
export function leave() { running = false; timers.forEach(clearTimeout); timers = []; stopSound(); deselect(); dr?.g.remove(); dr = null; pending = null; stage.classList.remove('over'); document.querySelectorAll('.body-ghost').forEach((g) => g.remove()); }
