// Isaac's tsunami lab: a 3D coast with a real shallow-water wave simulation. Tap the sea to shake the seabed with an earthquake, then watch the wave
// travel across the deep sea (fast and low), slow down and grow tall in the shallows, pull the sea away from the beach, flood the town and drain back.
// A warning buoy and siren give the little people time to walk up the hill — turn the siren off and see what changes. One finger turns the camera,
// two fingers pinch / move it. Cards explain each step in kid words, with real numbers behind the (i) button.
import * as THREE from '../vendor/three.module.min.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { createSim, NX, NY, DX, idx } from './tsunami/sim.js';
import { buildWorld, gdisp, VX } from './tsunami/scene.js';
import { audio, unlock, tone, setMuted } from './sound.js';

const $ = (s) => document.querySelector(s);
const root = $('#view-tsunami'), canvas = $('#tsu-canvas');
const ui = { loading: $('#tsu-loading'), card: $('#tsu-card'), hud: $('#tsu-hud'), hint: $('#tsu-hint'), chips: $('#tsu-chips'), title: $('#tsu-title') };

const SIZES = [
  { id: 'small', short: '6.5', A: 0.6, R: 700, chip: { en: 'Small shake', es: 'Temblor pequeño' }, adult: { en: 'Magnitude 6.5: a strong quake, but the seabed moves only a little, so the wave is small and harmless.', es: 'Magnitud 6,5: un sismo fuerte, pero el fondo del mar se mueve poco; la ola es pequeña e inofensiva.' } },
  { id: 'big', short: '8', A: 2.6, R: 1100, chip: { en: 'Big shake', es: 'Temblor grande' }, adult: { en: 'Magnitude 8: the seabed lifts a few metres over a large area. The wave floods low land near the beach.', es: 'Magnitud 8: el fondo marino sube unos metros en una zona grande. La ola inunda la tierra baja cerca de la playa.' } },
  { id: 'giant', short: '9', A: 6.5, R: 1600, chip: { en: 'Giant shake', es: 'Temblor gigante' }, adult: { en: 'Magnitude 9 (like Japan 2011 or the Indian Ocean 2004): each whole number releases about 32 times more energy. Run-up can reach 10–40 m.', es: 'Magnitud 9 (como Japón 2011 o el océano Índico 2004): cada número entero libera unas 32 veces más energía. La ola puede subir 10–40 m.' } },
];
const PH = [
  { n: { en: 'Make a tsunami', es: 'Haz un tsunami' }, k: { en: 'Tap the sea to shake the ground under the water!', es: '¡Toca el mar para sacudir el suelo bajo el agua!' }, a: { en: 'A tsunami (say “soo-NAH-mee”, Japanese for “harbour wave”) is a train of very long waves. Most start when an undersea earthquake suddenly lifts the seafloor.', es: 'Un tsunami (en japonés “ola de puerto”) es una serie de olas larguísimas. La mayoría empieza cuando un terremoto submarino levanta de golpe el fondo del mar.' } },
  { n: { en: 'The sea floor shakes', es: 'El fondo del mar tiembla' }, k: { en: 'Two giant plates of rock slip. The sea floor jumps up and pushes the water above it!', es: 'Dos placas gigantes de roca se deslizan. ¡El fondo del mar salta y empuja el agua de arriba!' }, a: { en: 'In a megathrust earthquake one plate slides under another along a fault hundreds of km long. The seabed can rise several metres in seconds, and all the water above rises with it.', es: 'En un terremoto de subducción una placa se desliza bajo otra a lo largo de una falla de cientos de km. El fondo puede subir varios metros en segundos y todo el agua de arriba sube con él.' } },
  { n: { en: 'A wave races across the sea', es: 'Una ola cruza el mar' }, k: { en: 'The hill of water splits in two and zooms away as fast as an airplane! In the deep sea the wave is low and very long, so boats hardly feel it.', es: '¡La colina de agua se parte en dos y sale veloz como un avión! En el mar profundo la ola es baja y muy larga, y los barcos casi no la sienten.' }, a: { en: 'Speed = √(gravity × depth). In 4,000 m of water that is about 200 m/s (≈ 700 km/h). The wavelength is 100–200 km but the height is only about a metre in deep water.', es: 'Velocidad = √(gravedad × profundidad). Con 4.000 m de agua son unos 200 m/s (≈ 700 km/h). La longitud de onda es de 100–200 km pero la altura es de solo ~1 m en aguas profundas.' } },
  { n: { en: 'The sea gets shallow', es: 'El mar se hace poco profundo' }, k: { en: 'Near the coast the sea floor rises. The front of the wave slows down and the back catches up, so the water piles up. The wave grows TALL!', es: 'Cerca de la costa el fondo sube. El frente de la ola se frena y la parte de atrás lo alcanza: el agua se amontona. ¡La ola crece MUCHO!' }, a: { en: 'Shoaling: speed falls with depth, so the wavelength shortens and the energy is squeezed into a taller wave (height grows roughly as depth to the power −¼ — Green’s law).', es: 'Asomeramiento: la velocidad baja con la profundidad, la longitud de onda se acorta y la energía se concentra en una ola más alta (la altura crece más o menos como la profundidad elevada a −¼, ley de Green).' } },
  { n: { en: 'The sea goes away!', es: '¡El mar se va!' }, k: { en: 'Look! The sea pulled back and the beach is empty. That is a WARNING! Walk up the hill right away.', es: '¡Mira! El mar se retiró y la playa quedó vacía. ¡Es un AVISO! Sube a la colina enseguida.' }, a: { en: 'If the trough of the wave arrives first, the shoreline can retreat hundreds of metres. A sea that suddenly drains away is a natural tsunami warning: move to high ground immediately — do not go to look.', es: 'Si llega primero el valle de la ola, la costa puede retroceder cientos de metros. Un mar que se vacía de golpe es un aviso natural: ve enseguida a un lugar alto y no vayas a mirar.' } },
  { n: { en: 'The wave comes onto the land', es: 'La ola entra a la tierra' }, k: { en: 'WHOOSH! The big wave rushes into the streets. Water is heavy and strong, and it can push houses.', es: '¡ZAS! La ola grande entra por las calles. El agua pesa y es fuerte, y puede empujar casas.' }, a: { en: 'A tsunami rarely curls like a surf wave; it floods like a very fast, very strong rising tide. One cubic metre of water weighs 1,000 kg, and floating debris adds to the damage.', es: 'Un tsunami casi nunca se enrosca como una ola de surf: inunda como una marea que sube muy rápido y con mucha fuerza. Un metro cúbico de agua pesa 1.000 kg y los escombros flotantes agravan el daño.' } },
  { n: { en: 'The water flows back', es: 'El agua regresa' }, k: { en: 'Now the water runs back to the sea. More waves can come, so stay up on the hill for a long time.', es: 'Ahora el agua vuelve al mar. Pueden venir más olas: quédate en la colina mucho rato.' }, a: { en: 'A tsunami is a wave train, with minutes to hours between crests; the first wave is often not the biggest. Stay on high ground until officials say it is safe.', es: 'Un tsunami es un tren de olas, con minutos u horas entre cada una; la primera suele no ser la mayor. Quédate en alto hasta que las autoridades digan que es seguro.' } },
  { n: { en: 'The sea calms down', es: 'El mar se calma' }, k: { en: 'Sirens and sea buoys tell people to go uphill. People on the hill are safe!', es: 'Las sirenas y las boyas del mar avisan a la gente que suba. ¡En la colina estamos a salvo!' }, a: { en: 'Warning systems combine seafloor pressure sensors (DART buoys), tide gauges and quake detectors. Warnings give minutes to hours; for a quake you feel strongly on the coast, do not wait — go uphill.', es: 'Los sistemas de alerta combinan sensores de presión en el fondo (boyas DART), mareógrafos y detectores de sismos. Dan minutos u horas; si sientes un sismo fuerte en la costa, no esperes: sube.' } },
];
const T = {
  en: { title: 'Tsunamis', hint: 'Tap the SEA to make an earthquake!', land: 'Tap the blue sea, not the land!', kmh: 'km/h', m: 'm', speed: 'Wave speed', height: 'Wave height', depth: 'Sea depth', houses: 'Houses', hill: 'On the hill', time: 'Time', warn: '⚠ TSUNAMI WARNING! ⚠', allSafe: 'Everyone reached the hill!', someSafe: 'Some people were too slow. Going up EARLY keeps everybody safe!', tiny: 'That one was small. Try a bigger shake!' },
  es: { title: 'Tsunamis', hint: '¡Toca el MAR para hacer un terremoto!', land: '¡Toca el mar azul, no la tierra!', kmh: 'km/h', m: 'm', speed: 'Velocidad', height: 'Altura de la ola', depth: 'Profundidad', houses: 'Casas', hill: 'En la colina', time: 'Tiempo', warn: '⚠ ¡ALERTA DE TSUNAMI! ⚠', allSafe: '¡Todos llegaron a la colina!', someSafe: 'Algunos fueron muy lentos. ¡Subir TEMPRANO salva a todos!', tiny: 'Ese fue pequeño. ¡Prueba uno más grande!' },
};
const SD = 0.09;
let lang = 'en', sizeIdx = 2, running = false, ready = false, loadP = null, raf = 0, lastT = 0, acc = 0, speedMul = 1, alarm = true, follow = true, soundOn = true, cardTimer = 0;
let renderer, scene, camera, controls, sim, W, shakeT = 0, ring, goal = new THREE.Vector3(170, 0, 85), epi = null, hudT = 0, phase = 0, phaseT = 0, base = { edge: 0 }, drawback = false, floodPeak = 0, peakT = 0, sirenOn = false, sirenT = -1, buoyHit = false, ended = false, bound = false, roar = null;
const flowv = [0, 0], camOff = new THREE.Vector3(-35, 40, 70);
let crestM = 0, moodNow = 0, shot = '', quakeReal = 0, floodT = -99, bannerEl = null, impact = 0;
const L = (o) => o[lang];

// ------------------------------------------------------------------ sound (everything starts from the child's touch)
let noiseBuf = null;
function noise(ctx) { if (noiseBuf && noiseBuf.sampleRate === ctx.sampleRate) return noiseBuf; noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); const d = noiseBuf.getChannelData(0); let l = 0; for (let i = 0; i < d.length; i++) { l = (l + 0.02 * (Math.random() * 2 - 1)) / 1.02; d[i] = l * 3.4; } return noiseBuf; }
function rumble(sec, vol) {
  if (!soundOn) return; const ctx = audio(); if (!ctx) return; const t = ctx.currentTime, s = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
  s.buffer = noise(ctx); s.loop = true; lp.type = 'lowpass'; lp.frequency.value = 130; lfo.frequency.value = 9; lg.gain.value = 0.35; lfo.connect(lg).connect(g.gain);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.4); g.gain.setValueAtTime(vol, t + sec - 1.2); g.gain.exponentialRampToValueAtTime(0.0001, t + sec); s.connect(lp).connect(g).connect(ctx.destination); s.start(t); lfo.start(t); s.stop(t + sec + 0.1); lfo.stop(t + sec + 0.1);
}
function startRoar() {
  if (roar || !soundOn) return; const ctx = audio(); if (!ctx) return; const s = ctx.createBufferSource(), bp = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noise(ctx); s.loop = true; bp.type = 'bandpass'; bp.frequency.value = 380; bp.Q.value = 0.4; g.gain.value = 0.0001; s.connect(bp).connect(g).connect(ctx.destination); s.start(); roar = { s, g, ctx };
}
function stopRoar() { if (!roar) return; try { roar.g.gain.setTargetAtTime(0.0001, roar.ctx.currentTime, 0.4); roar.s.stop(roar.ctx.currentTime + 1.5); } catch { /* already stopped */ } roar = null; }
function boom() { if (!soundOn) return; const ctx = audio(); if (!ctx) return; const t = ctx.currentTime, s = ctx.createBufferSource(), lp = ctx.createBiquadFilter(), g = ctx.createGain(); s.buffer = noise(ctx); lp.type = 'lowpass'; lp.frequency.setValueAtTime(260, t); lp.frequency.exponentialRampToValueAtTime(60, t + 1.6); g.gain.setValueAtTime(1.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4); s.connect(lp).connect(g).connect(ctx.destination); s.start(t); s.stop(t + 2.5); }
function siren(sec) {
  if (!soundOn) return; const ctx = audio(); if (!ctx) return; const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
  o.type = 'triangle'; o.frequency.value = 700; lfo.frequency.value = 0.45; lg.gain.value = 190; lfo.connect(lg).connect(o.frequency);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.18, t + 0.5); g.gain.setValueAtTime(0.18, t + sec - 1); g.gain.exponentialRampToValueAtTime(0.0001, t + sec); o.connect(g).connect(ctx.destination); o.start(t); lfo.start(t); o.stop(t + sec + 0.1); lfo.stop(t + sec + 0.1);
}

// ------------------------------------------------------------------ building
async function init() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' }); renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  sim = createSim(); W = buildWorld(sim); scene = W.scene;
  camera = new THREE.PerspectiveCamera(46, 1, 0.5, 2500); camera.position.set(140, 62, 178);
  controls = new OrbitControls(camera, canvas); controls.target.set(175, 0, 85); controls.enableDamping = true; controls.dampingFactor = 0.08; controls.maxPolarAngle = 1.48; controls.minDistance = 8; controls.maxDistance = 330; controls.rotateSpeed = 0.8;
  controls.addEventListener('start', () => { if (follow && epi) setFollow(false); });
  sim.houses = W.houses; for (const h of W.houses) sim.nn[idx(h.i, h.j)] = 0.22;           // houses slow the water down
  ring = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 48), new THREE.MeshBasicMaterial({ color: 0xff5a3c, transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.visible = false; scene.add(ring);
  sim.measure(); base.edge = sim.S.edgeAvg;
  bindOnce(); onResize(); new ResizeObserver(onResize).observe(canvas.parentElement);
}
function onResize() { const r = canvas.parentElement.getBoundingClientRect(); if (!r.width || !renderer) return; renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); }

// ------------------------------------------------------------------ what happens
function trigger(x, z) {
  const S = SIZES[sizeIdx]; if (sim.S.quakeTime >= 0) resetWorld(true);
  sim.quake(x * DX, z * DX, S.A, S.R); epi = { x, z }; phase = 1; phaseT = 0; shakeT = 7; drawback = false; floodPeak = 0; peakT = 0; sirenOn = false; sirenT = -1; buoyHit = false; ended = false; sim.measure(); base.edge = sim.S.edgeAvg;
  quakeReal = performance.now(); shot = ''; floodT = -99; ring.visible = true; ring.position.set(x, 0.3, z); ring.userData.t = 0; ui.hint.classList.add('gone'); rumble(7, 0.9 * (0.5 + S.A / 14)); startRoar(); setFollow(true); setCard(1);
}
function resetWorld(quiet) {
  sim.reset(); for (const h of W.houses) { h.alive = true; W.place(h, true); sim.nn[idx(h.i, h.j)] = 0.22; } for (const m of [W.hm, W.rm, W.tm2, W.cm]) m.instanceMatrix.needsUpdate = true;
  W.debris.length = 0; W.dm.count = 0; W.people.forEach((p, n) => { const h = W.houses[Math.floor((n * 37) % W.houses.length)]; p.x = h.x + 0.7 + (n % 5) * 0.08; p.z = h.z + 0.5 + (n % 3) * 0.2; p.state = 'home'; p.wait = (n % 7) * 0.9; });
  epi = null; phase = 0; moodNow = 0; for (const r of W.wallRows) r.on = false; W.updateWall(); sirenOn = false; sirenT = -1; shakeT = 0; ring.visible = false; stopRoar(); acc = 0; setFollow(false);
  if (!quiet) { ui.hint.classList.remove('gone'); setCard(0); controls.target.set(175, 0, 85); camera.position.set(140, 62, 178); }
}

function houseDamage() {
  const { eta, b, u, v, nn, n0 } = sim; let changed = false;
  for (const h of W.houses) {
    if (!h.alive) continue; const k = idx(h.i, h.j), d = eta[k] - b[k]; if (d < 1.2) continue; const sp = Math.hypot(u[k], v[k]);
    if ((d > 1.7 && sp > 0.8) || d > 4.2 || d * sp * sp > 5) {
      h.alive = false; W.place(h, false); nn[k] = n0[k]; changed = true;
      for (let q = 0; q < 26; q++) W.emit(h.x + (Math.random() - 0.5), h.y + 0.3, h.z + (Math.random() - 0.5), 2 + Math.random() * 4, 3 + Math.random() * 5, (Math.random() - 0.5) * 5, 0.3 + Math.random() * 0.5, 1.1);
      for (let n = 0; n < 10 && W.debris.length < W.DEB; n++) W.debris.push({ x: h.x + (Math.random() - 0.5) * 0.5, z: h.z + (Math.random() - 0.5) * 0.5, sx: 0.12 + Math.random() * 0.3, sy: 0.05 + Math.random() * 0.12, sz: 0.12 + Math.random() * 0.3, r: Math.random() * 6, life: 0, c: Math.random() < 0.5 ? 0xb98a5a : 0xd8cbb0 });
    }
  }
  if (changed) { for (const m of [W.hm, W.rm, W.tm2, W.cm]) m.instanceMatrix.needsUpdate = true; }
}
function moveThings(dtS) {
  const { eta, b } = sim, M = W.M, Q = W.Q, P = W.P, Sc = W.Sc, E = new THREE.Euler();
  // floating pieces
  W.debris.forEach((p, n) => {
    const x = p.x * DX, y = p.z * DX, d = sim.depthAt(x, y); let yy;
    if (d > 0.15) { sim.velAt(x, y, flowv); p.x += flowv[0] / DX * dtS * 0.9; p.z += flowv[1] / DX * dtS * 0.9; p.r += dtS * 0.4; const k = idx(Math.min(NX - 1, Math.max(0, Math.floor(p.x))), Math.min(NY - 1, Math.max(0, Math.floor(p.z)))); yy = (b[k] < 0 ? eta[k] * VX : (b[k] + d) * VX) + 0.05 + 0.04 * Math.sin(p.r * 3); }
    else { const k = idx(Math.min(NX - 1, Math.max(0, Math.floor(p.x))), Math.min(NY - 1, Math.max(0, Math.floor(p.z)))); yy = gdisp(b[k]) + p.sy / 2; }
    Q.setFromEuler(E.set(0, p.r, 0)); P.set(p.x, yy, p.z); Sc.set(p.sx, p.sy, p.sz); M.compose(P, Q, Sc); W.dm.setMatrixAt(n, M); W.dm.setColorAt(n, new THREE.Color(p.c));
  });
  W.dm.count = W.debris.length; W.dm.instanceMatrix.needsUpdate = true; if (W.dm.instanceColor) W.dm.instanceColor.needsUpdate = true;
  // little people
  const hillX = W.hillX; let safe = 0; const free = new THREE.Color(0xff8a1f);
  W.people.forEach((p, n) => {
    const x = p.x * DX, y = p.z * DX, d = sim.depthAt(x, y), k = idx(Math.min(NX - 1, Math.floor(p.x)), Math.min(NY - 1, Math.floor(p.z)));
    if (d > 0.35 && p.state !== 'float') { p.state = 'float'; p.wait = 0; W.pm.setColorAt(n, free); W.pm.instanceColor.needsUpdate = true; }
    if (p.state === 'float') { sim.velAt(x, y, flowv); p.x += flowv[0] / DX * dtS * 0.7; p.z += flowv[1] / DX * dtS * 0.7; if (d < 0.1) { p.wait += dtS; if (p.wait > 2) p.state = 'flee'; } }
    else if ((p.state === 'home' && sirenOn && (p.wait -= dtS) < 0) || p.state === 'flee') p.state = 'flee';
    if (p.state === 'flee') { const dx = p.tx - p.x, dz = p.tz - p.z, dd = Math.hypot(dx, dz); if (dd > 0.4) { p.x += dx / dd * 0.6 * dtS; p.z += dz / dd * 0.6 * dtS; } }
    if (p.x > hillX - 2.5) safe++;
    const kk = idx(Math.min(NX - 1, Math.max(0, Math.floor(p.x))), Math.min(NY - 1, Math.max(0, Math.floor(p.z)))), yy = d > 0.2 ? (b[kk] < 0 ? eta[kk] * VX : (b[kk] + d) * VX) + 0.12 : gdisp(b[kk]) + 0.2;
    Q.identity(); P.set(p.x, yy + 0.04 * Math.sin(performance.now() / 150 + n) * (p.state === 'flee' ? 1 : 0), p.z); Sc.set(1, 1, 1); M.compose(P, Q, Sc); W.pm.setMatrixAt(n, M);
  });
  W.pm.instanceMatrix.needsUpdate = true; return safe;
}

// ------------------------------------------------------------------ phases, card, HUD
function setCard(p, forceOpen = true) {
  phase = p; const c = PH[p]; $('#tsu-name').textContent = L(c.n); $('#tsu-kid').textContent = p === 7 ? endText() : L(c.k); $('#tsu-adult').textContent = L(c.a) + (p === 0 ? ' ' + L(SIZES[sizeIdx].adult) : '');
  $('#tsu-meter').innerHTML = PH.slice(1).map((_, i) => `<i class="${i + 1 <= p ? 'on' : ''}"></i>`).join('');
  if (forceOpen) { ui.card.classList.add('open'); ui.card.classList.remove('mini'); clearTimeout(cardTimer); cardTimer = setTimeout(() => ui.card.classList.add('mini'), p === 0 ? 20000 : 16000); }
}
let safeNow = 0;
function endText() { const total = W?.people.length ?? 1; if (sim.S.maxRun < 0.3 && sim.S.maxEta < 0.5) return L(T[lang] ? { en: T.en.tiny, es: T.es.tiny } : { en: '', es: '' }); return safeNow >= total ? T[lang].allSafe : T[lang].someSafe; }
function advance() {
  const S = sim.S, tq = S.time - S.quakeTime; if (S.quakeTime < 0) return;
  if (phase === 1 && tq > 7) setCard(2);
  if (phase <= 2 && S.front >= 178 && tq > 20) setCard(3);                                           // the front reaches the shallow shelf
  if (S.draw < -0.3 && !drawback && phase < 5 && tq > 15) { drawback = true; setCard(4); }
  if (phase < 5 && S.maxRun > 0.4) { floodT = S.time; boom(); setCard(5); }
  if (S.maxRun > floodPeak) { floodPeak = S.maxRun; peakT = S.time; }
  if (phase === 5 && S.time - peakT > 18 && S.maxRun < floodPeak * 0.5) setCard(6);
  if ((phase === 6 || (phase >= 2 && S.maxRun < 0.4 && tq > 140)) && !ended && S.time - peakT > 40 && S.maxEta < 0.6) { ended = true; setCard(7); stopRoar(); }
  // the warning: the buoy feels the wave, or the warning centre calls after a little while
  const bi = idx(100, 85); if (!buoyHit && Math.abs(sim.eta[bi]) > 0.08) { buoyHit = true; tone(1400, 0.1, 0.18, 'square'); setTimeout(() => tone(1400, 0.1, 0.18, 'square'), 200); }
  if (alarm && !sirenOn && (buoyHit || tq > 45)) { sirenOn = true; siren(8); }
}
function updateBanner() { if (!bannerEl) bannerEl = $('#tsu-banner'); const show = epi && (sirenOn || (phase >= 3 && phase <= 5)); bannerEl.classList.toggle('on', !!show); bannerEl.textContent = T[lang].warn; }
function updateHud(safe) {
  const S = sim.S, t = T[lang], fi = Math.min(NX - 1, S.front), h0 = sim.b[idx(fi, 85)], H = Math.max(2, -h0), c = Math.sqrt(9.81 * H) * 3.6, alive = W.houses.filter((h) => h.alive).length, tq = S.quakeTime < 0 ? 0 : Math.max(0, S.time - S.quakeTime);
  const mm = String(Math.floor(tq / 60)).padStart(2, '0'), ss = String(Math.floor(tq % 60)).padStart(2, '0');
  const wave = S.front > 0 && tq > 7 && phase < 6 ? `<span>🌊 ${t.speed}: <b>${Math.round(c)}</b> ${t.kmh}</span><span>↕ ${t.height}: <b>${(Math.max(S.frontEta, S.maxRun, crestM) || 0).toFixed(1)}</b> ${t.m}</span><span>≈ ${t.depth}: <b>${Math.round(H).toLocaleString(lang)}</b> ${t.m}</span>` : '';
  ui.hud.innerHTML = `<span>⏱ ${mm}:${ss}</span>${wave}<span>🏠 ${t.houses}: <b>${alive}</b>/${W.houses.length}</span><span>⛰ ${t.hill}: <b>${safe}</b>/${W.people.length}</span>`;
}

// ------------------------------------------------------------------ the loop
function autoSpeed() {   // fast across the open sea, slower as the wave arrives, slowest at the moment it hits the town
  if (!epi) return 3 * speedMul; const S = sim.S, tq = S.time - S.quakeTime; let v;
  if (tq < 7) v = 3; else if (phase <= 3 && S.front < 165) v = 14; else if (phase < 5) v = S.front < 188 ? 6 : 3.2; else if (phase === 5) v = S.time - floodT < 7 ? 2 : 4.5; else v = 9;
  return v * speedMul;
}
function updateWallRows() {
  const { eta, b } = sim, rows = W.wallRows, on = [], xs = [], hs = []; crestM = 0;
  for (let j = 0; j < W.WJ; j++) {
    let best = -1, bi = -1; if (epi && sim.S.quakeTime >= 0) for (let i = 100; i < 232; i++) { const k = idx(i, j * 2); if (b[k] > 1.2) break; if (eta[k] > best) { best = eta[k]; bi = i; } }
    const k = bi >= 0 ? idx(bi, j * 2) : 0, fade = bi >= 0 ? 1 - smoothS(-4, 1.2, b[k]) : 0; on[j] = best > 2.4 && fade > 0.05; xs[j] = bi; hs[j] = Math.min(8, best * VX * 4.8) * fade; if (best > crestM) crestM = best;
  }
  for (let j = 0; j < W.WJ; j++) { const r = rows[j], a = Math.max(0, j - 1), c = Math.min(W.WJ - 1, j + 1); r.on = on[j]; if (!r.on) continue; let sx = 0, sh = 0, n = 0; for (const q of [a, j, c]) if (on[q]) { sx += xs[q]; sh += hs[q]; n++; } r.x = sx / n; r.h = sh / n; }
  W.updateWall();
  for (let j = 0; j < W.WJ; j += 1) { const r = rows[j]; if (r.on && r.h > 0.8 && Math.random() < 0.3) W.emit(r.x + 0.5 + r.h * 1.1, r.h * 0.9, j * 2 + 0.5, 3 + Math.random() * 6, 2 + Math.random() * 5, (Math.random() - 0.5) * 3, 0.22 + Math.random() * 0.4, 1.2); }
}
const smoothS = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const gnd = (x, z) => gdisp(sim.b[idx(Math.min(NX - 1, Math.max(0, Math.round(x))), Math.min(NY - 1, Math.max(0, Math.round(z))))]);
const camP = new THREE.Vector3(), tgtP = new THREE.Vector3();
function director(dt, now) {   // a little film crew: close to the rising water, alongside the wave, in the street as it arrives, then high above the flood
  const S = sim.S, tr = (now - quakeReal) / 1000; let name, kp = 1.8, kt = 2.4;
  if (tr < 4 && phase <= 2) { name = 'rise'; tgtP.set(epi.x + 12, 1, epi.z); camP.set(epi.x - 14 + tr * 3, 6 + tr * 0.7, epi.z + 26); }
  else if (phase <= 3 && S.front < 178) { name = 'side'; tgtP.set(S.front + 14, 1, epi.z); camP.set(S.front - 18, 10, epi.z + 36); }
  else if (phase <= 4 || (phase === 5 && S.time - floodT < 3)) { name = 'street'; const sx = 218 + Math.min(1, Math.max(0, (S.front - 178) / 20)) * 0, k0 = Math.min(1, tr / 40); tgtP.set(190 + (S.time - (floodT > 0 ? floodT : S.time)) * 0, 2.6, epi.z); camP.set(sx + 8 + k0 * 4, gnd(226, epi.z + 10) + 3.4, epi.z + 10 + k0 * 6); kp = 5; }
  else if (phase === 5) { name = 'aerial'; const t = Math.min(1, (S.time - floodT) / 40); tgtP.set(212, 2, epi.z); camP.set(238, 14 + t * 26, epi.z + 40 + t * 20); kp = 1.4; }
  else { name = 'high'; tgtP.set(205, 0, epi.z); camP.set(196, 62, epi.z + 118); kp = 0.9; }
  if (name !== shot) { shot = name; if (name === 'street' || name === 'aerial') { camera.position.copy(camP); controls.target.copy(tgtP); return; } }   // a hard CUT, like a film
  controls.target.lerp(tgtP, Math.min(1, dt * kt)); camera.position.lerp(camP, Math.min(1, dt * kp));
}
function frame(now) {
  raf = requestAnimationFrame(frame); if (!running || !ready) return; const dt = Math.min(0.05, (now - lastT) / 1000 || 0.016); lastT = now;
  acc += dt * autoSpeed(); let steps = 0, simDt = 0; while (acc >= SD && steps < 6) { sim.step(SD); acc -= SD; steps++; simDt += SD; }
  if (acc > 1) acc = 0;
  if (steps) { sim.flow(); houseDamage(); }
  W.updateField(sim, dt); W.wMat.uniforms.uTime.value = now / 1000;
  const safe = moveThings(simDt); safeNow = safe;
  if (epi) updateWallRows(); W.updateSpray(dt);
  const wantMood = epi && phase >= 2 && phase <= 6 ? 0.9 : 0; moodNow += (wantMood - moodNow) * Math.min(1, dt * 0.7); W.setMood(moodNow);
  hudT += dt; if (hudT > 0.25) { hudT = 0; sim.measure(); if (!Number.isFinite(sim.S.maxEta)) { resetWorld(false); } advance(); updateHud(safe); updateBanner(); }
  // the earthquake shakes the whole world for a moment; the ring marks where it began
  impact = phase === 5 && sim.S.time - floodT < 12 ? 0.5 : (phase === 4 ? 0.12 : 0); if (shakeT > 0) { shakeT -= dt * 3; const a = Math.max(0, shakeT / 7) * 0.22 + impact * 0.25; W.world.position.set((Math.random() - 0.5) * a, (Math.random() - 0.5) * a * 0.5, (Math.random() - 0.5) * a); } else if (impact > 0) W.world.position.set((Math.random() - 0.5) * impact * 0.25, (Math.random() - 0.5) * impact * 0.12, (Math.random() - 0.5) * impact * 0.25); else W.world.position.set(0, 0, 0);
  if (ring.visible) { ring.userData.t += dt; const t = ring.userData.t, s = 2 + t * 22; ring.scale.set(s, s, s); ring.material.opacity = Math.max(0, 0.9 - t * 0.35); if (t > 2.6) ring.visible = false; }
  // the buoy bobs on the sea and flashes when the wave passes
  const bk = idx(100, 85), by = sim.eta[bk] * VX * 8; W.buoy.position.y = Math.max(-0.5, by) + 0.2; W.buoy.getObjectByName('lamp').material.color.setHex(buoyHit && Math.floor(now / 300) % 2 ? 0xffff40 : 0xff4040);
  W.flag.children[1].rotation.y = Math.sin(now / 280) * 0.25;
  // the director
  if (follow && epi) director(dt, now);
  // the sound of the water follows how much water is rushing at the coast
  if (roar) { const S = sim.S, v = Math.min(1, (S.maxRun * 0.12) + (phase >= 3 && phase < 7 ? 0.1 + Math.min(0.5, S.frontEta * 0.06) : 0)); roar.g.gain.setTargetAtTime(soundOn ? v * 0.5 + 0.0001 : 0.0001, roar.ctx.currentTime, 0.25); }
  controls.update(); renderer.render(scene, camera);
}

// ------------------------------------------------------------------ touch and buttons
const ray = new THREE.Raycaster(), v2 = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hitP = new THREE.Vector3();
function bindOnce() {
  if (bound) return; bound = true; let down = null;
  canvas.addEventListener('pointerdown', (e) => { unlock(); down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  canvas.addEventListener('pointerup', (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10 || performance.now() - down.t > 450) { down = null; return; } down = null;
    const r = canvas.getBoundingClientRect(); v2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(v2, camera);
    if (!ray.ray.intersectPlane(plane, hitP)) return; const i = Math.floor(hitP.x), j = Math.floor(hitP.z);
    if (i < 3 || i >= NX - 3 || j < 6 || j >= NY - 6 || sim.b[idx(i, j)] > -25) { ui.hint.textContent = T[lang].land; ui.hint.classList.remove('gone'); setTimeout(() => { if (!epi) ui.hint.textContent = T[lang].hint; else ui.hint.classList.add('gone'); }, 2200); return; }
    trigger(hitP.x, hitP.z);
  });
  document.querySelectorAll('#view-tsunami .lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  $('#btn-tsound').addEventListener('click', () => { soundOn = !soundOn; $('#btn-tsound').classList.toggle('on', soundOn); setMuted(!soundOn); if (!soundOn) stopRoar(); else { unlock(); if (epi && !ended) startRoar(); } });
  $('#btn-tspeed').addEventListener('click', () => { speedMul = speedMul === 1 ? 0.5 : speedMul === 0.5 ? 2 : 1; $('#btn-tspeed').dataset.s = speedMul === 1 ? 'AUTO' : '×' + speedMul; $('#btn-tspeed').classList.toggle('on', speedMul !== 1); });
  $('#btn-talarm').addEventListener('click', () => { alarm = !alarm; $('#btn-talarm').classList.toggle('on', alarm); if (alarm) { unlock(); tone(880, 0.12, 0.15); } });
  $('#btn-tfollow').addEventListener('click', () => setFollow(!follow));
  $('#btn-treset').addEventListener('click', () => { unlock(); resetWorld(false); });
  $('#tsu-info').addEventListener('click', () => ui.card.classList.toggle('adult'));
  $('#tsu-close').addEventListener('click', () => ui.card.classList.add('mini'));
  ui.card.addEventListener('click', (e) => { if (ui.card.classList.contains('mini') && !e.target.closest('button')) ui.card.classList.remove('mini'); });
}
function setFollow(on) { if (on) camOff.copy(camera.position).sub(controls.target); follow = on; $('#btn-tfollow').classList.toggle('on', on); }
function buildChips() {
  ui.chips.innerHTML = SIZES.map((s, i) => `<button type="button" class="chip lvl${i === sizeIdx ? ' on' : ''}" data-i="${i}"><b>${s.short}</b><span>${L(s.chip)}</span></button>`).join('');
  ui.chips.querySelectorAll('.chip').forEach((el) => el.addEventListener('click', () => { unlock(); const i = +el.dataset.i; if (i === sizeIdx && phase === 0) { ui.card.classList.toggle('mini'); return; } sizeIdx = i; buildChips(); if (phase === 0) setCard(0); }));
}
function setLang(l) {
  lang = l; document.querySelectorAll('#view-tsunami .lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === l)); ui.title.textContent = T[l].title; ui.hint.textContent = epi ? T[l].land : T[l].hint; buildChips(); setCard(phase, false);
}

export async function enter() {
  running = true; setMuted(!soundOn); audio();
  if (!loadP) { ui.loading.hidden = false; loadP = new Promise((ok) => setTimeout(async () => { try { await init(); ready = true; } catch (e) { console.error(e); } ok(); }, 30)); }
  await loadP; ui.loading.hidden = true; if (!running || !ready) return;
  if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__tsu = { sim, W, trigger, resetWorld, camera, controls, setSize(i) { sizeIdx = i; } };   // dev helper
  resetWorld(false); sizeIdx = 2; lang = 'en'; setLang('en'); ui.hint.classList.remove('gone'); onResize(); lastT = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
}
export function leave() { running = false; cancelAnimationFrame(raf); stopRoar(); clearTimeout(cardTimer); }
