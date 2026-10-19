// Isaac's Stars: 20 real stars of the Milky Way in a straight line, from our Sun to the biggest star known. Tap a star (or a button) and the camera
// flies there; every star boils, spins and glows, with the real surface colour for its heat. "Real size" stretches the line-up to the true sizes
// (the Sun becomes a spark!), "Fly!" is a guided tour, and the lessons explain colours, dwarfs / giants / supergiants, a star's life and tiny stars.
import * as THREE from '../vendor/three.module.min.js';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { STARS, GROUPS, LESSONS } from './stars/data.js';

const $ = (s) => document.querySelector(s);
const root = $('#view-stars'), canvas = $('#stars-canvas'), fxCanvas = $('#stars-fx');
const ui = {
  loading: $('#stars-loading'), card: $('#stars-card'), name: $('#stc-name'), badge: $('#stc-badge'), kid: $('#stc-kid'), fam: $('#stc-fam'), adult: $('#stc-adult'), stats: $('#stc-stats'),
  chips: $('#stars-chips'), tags: $('#stars-tags'), title: $('#stars-title'), sub: $('#stars-sub'), toast: $('#stars-toast'), play: $('#btn-tour'), real: $('#btn-real'), group: $('#stars-group'),
  learn: $('#st-learn'), lEm: $('#stl-em'), lTitle: $('#stl-title'), lKid: $('#stl-kid'), lAdult: $('#stl-adult'), lGroups: $('#stl-groups'), lDots: $('#stl-dots'),
};
const T = {
  en: { title: 'Stars', sub: 'Our Milky Way galaxy', speech: 'en-US', real: 'Real size!', realOn: 'Real sizes! Now see how tiny the Sun is!', realOff: 'Squeezed sizes, so every star fits.', tour: 'Fly!', suns: 'Suns', width: 'Width', heat: 'Heat', far: 'Distance', ly: 'light-years', lm: 'light-minutes', all: 'Show all stars', sunSpark: 'Our Sun', across: 'across', fits: 'Suns fit inside', ourstar: 'Our star!', wide: 'wide', unit: '°C' },
  es: { title: 'Estrellas', sub: 'Nuestra galaxia, la Vía Láctea', speech: 'es-ES', real: '¡Tamaño real!', realOn: '¡Tamaños reales! ¡Mira qué chiquito es el Sol!', realOff: 'Tamaños apretados, para que quepan todas.', tour: '¡Vuela!', suns: 'Soles', width: 'Ancho', heat: 'Calor', far: 'Distancia', ly: 'años luz', lm: 'minutos luz', all: 'Ver todas las estrellas', sunSpark: 'Nuestro Sol', across: 'de ancho', fits: 'Soles caben dentro', ourstar: '¡Nuestra estrella!', wide: 'de ancho', unit: '°C' },
};
const FOV = 45;
const NS = STARS.length;
const rComp = STARS.map((s) => 1.1 * Math.pow(s.R, 0.45));          // squeezed sizes, so that all 20 stars fit on one screen
const COLORS = [[3200, [0.95, 0.2, 0.06]], [3600, [1.0, 0.28, 0.08]], [4300, [1.0, 0.42, 0.1]], [4700, [1.0, 0.52, 0.15]], [5772, [1.0, 0.72, 0.2]], [6000, [1.0, 0.8, 0.32]], [8500, [0.96, 0.95, 1.0]], [9900, [0.86, 0.91, 1.0]], [12500, [0.74, 0.84, 1.0]], [25000, [0.56, 0.7, 1.0]]];
function starColor(Tk) {
  if (Tk <= COLORS[0][0]) return COLORS[0][1].slice(); if (Tk >= COLORS.at(-1)[0]) return COLORS.at(-1)[1].slice();
  for (let i = 0; i < COLORS.length - 1; i++) { const [t0, c0] = COLORS[i], [t1, c1] = COLORS[i + 1]; if (Tk <= t1) { const k = (Tk - t0) / (t1 - t0); return c0.map((v, j) => v + (c1[j] - v) * k); } }
}
const lerp3 = (a, b, k) => a.map((v, i) => v + (b[i] - v) * k);

let lang = 'en', ready = false, running = false, loadPromise = null, raf = 0, lastT = 0, clock = 0;
let renderer, scene, camera, controls, sky, skyPts;
const stars = [];            // { d, i, group, mesh, mat, glow, rays, col, r, pos, dust, comp, arcs, pop }
let focus = null, real = 0, realGoal = 0, flight = null, userMoved = false, overviewFit = true, tour = false, tourT = 0, groupFilter = null, lessonI = -1, cardMini = false;
const rNow = new Float32Array(NS), prevR = new Float32Array(NS), prevPos = STARS.map(() => new THREE.Vector3());
const V = (x, y, z) => new THREE.Vector3(x, y, z);

// ------------------------------------------------------------ shaders
const LOGV = `#include <common>
#include <logdepthbuf_pars_vertex>`;
const VERT = `${LOGV}
varying vec3 vP; varying vec3 vN; varying vec3 vV;
void main(){ vP = normalize(position); vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv;
#include <logdepthbuf_vertex>
}`;
const NOISE = `
vec3 hash3(vec3 p){ p = vec3(dot(p, vec3(127.1, 311.7, 74.7)), dot(p, vec3(269.5, 183.3, 246.1)), dot(p, vec3(113.5, 271.9, 124.6))); return fract(sin(p) * 43758.5453123); }
float h31(vec3 p){ p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float vn(vec3 x){ vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(h31(i), h31(i + vec3(1, 0, 0)), f.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), f.x), mix(h31(i + vec3(0, 1, 1)), h31(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
float fbm(vec3 p){ return 0.5 * vn(p) + 0.25 * vn(p * 2.03) + 0.125 * vn(p * 4.1) + 0.0625 * vn(p * 8.3); }
vec3 worley(vec3 x, float tm){            // cellular noise: x = nearest-cell distance, y = second-nearest, z = id of the cell
  vec3 n = floor(x), f = fract(x); float F1 = 9.0, F2 = 9.0, id = 0.0;
  for (int k = -1; k <= 1; k++) for (int j = -1; j <= 1; j++) for (int i = -1; i <= 1; i++) {
    vec3 g = vec3(float(i), float(j), float(k)); vec3 o = hash3(n + g); o = 0.5 + 0.5 * sin(tm + 6.2831 * o); vec3 r = g + o - f; float d = dot(r, r);
    if (d < F1) { F2 = F1; F1 = d; id = dot(n + g, vec3(1.0, 57.0, 113.0)); } else if (d < F2) F2 = d; }
  return vec3(sqrt(F1), sqrt(F2), id);
}`;
const FRAG = `precision highp float;
#include <logdepthbuf_pars_fragment>
uniform float uTime, uCell, uFine, uSpots, uContrast, uSpin, uDim, uObl, uWob, uBoost, uLimb, uWhite, uLanes, uBias; uniform vec3 uCol, uHot;
varying vec3 vP; varying vec3 vN; varying vec3 vV;
${NOISE}
void main(){
#include <logdepthbuf_fragment>
  float a = uTime * uSpin, c = cos(a), s = sin(a);
  vec3 q = vec3(c * vP.x + s * vP.z, vP.y, -s * vP.x + c * vP.z);
  vec3 w = vec3(vn(q * 1.7 + uTime * 0.03), vn(q * 1.7 + 5.2 - uTime * 0.02), vn(q * 1.7 + 9.1 + uTime * 0.025)) - 0.5;
  w += uWob * (vec3(vn(q * 1.1 + uTime * 0.1), vn(q * 1.1 + 4.0), vn(q * 1.1 - uTime * 0.08)) - 0.5) * 1.6;
  vec3 W = worley((q + w * 0.32) * uCell, uTime * 0.22);
  float edge = W.y - W.x, aa = fwidth(edge) * 1.5 + 0.0001;
  float lane = smoothstep(0.0, 0.13 + aa, edge);                                   // dark gaps between the bubbles of hot gas
  float cid = fract(sin(W.z) * 43758.545), centre = 1.0 - smoothstep(0.0, 0.85, W.x);
  float b = uBias + 0.55 * centre + 0.42 * (cid - 0.5);
  float fine = vn(q * uFine + vec3(0.0, uTime * 0.05, 0.0)) * 0.55 + vn(q * uFine * 2.3 - uTime * 0.04) * 0.45;
  b += (fine - 0.5) * 0.55;
  vec3 dark = uCol * 0.3, mid = uCol, hot = uHot;
  vec3 col = b < 0.5 ? mix(dark, mid, smoothstep(0.0, 0.5, b)) : mix(mid, hot, smoothstep(0.5, 1.0, b));
  col *= mix(1.0 - 0.7 * uContrast, 1.0, mix(1.0, lane, uLanes));
  float sp = fbm(q * 4.2 + 11.3), umbra = smoothstep(0.64, 0.7, sp) * uSpots, pen = smoothstep(0.6, 0.66, sp) * uSpots;
  col *= 1.0 - 0.45 * pen; col *= 1.0 - 0.85 * umbra;                                // sunspots: dark centre, lighter edge
  float mu = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
  col *= 1.0 - uLimb * (1.0 - pow(mu, 0.75));                                          // the edge of a star is darker, and redder
  col = mix(col, col * vec3(1.0, 0.8, 0.6), (1.0 - mu) * uLimb * 0.7);
  col *= mix(1.0, 0.72 + 0.4 * abs(q.y), uObl);                                         // fast spinners: hotter poles (gravity darkening)
  col = mix(col, vec3(1.0), uWhite * pow(mu, 2.6) * 0.9);                              // hot stars blaze white in the middle
  col = (1.0 - exp(-col * 1.5)) * uBoost;
  gl_FragColor = vec4(col * uDim, 1.0);
}`;
const HALO_FRAG = `precision highp float;
#include <logdepthbuf_pars_fragment>
uniform float uTime, uDisc, uStreak, uSpike, uSpikeRot, uRing, uFlick, uStr, uSeed, uPulse; uniform vec3 uCol;
varying vec2 vUv;
${NOISE}
float n2(vec2 p){ return vn(vec3(p, 3.7)); }
void main(){
#include <logdepthbuf_fragment>
  vec2 p = (vUv - 0.5) * 2.0; float q = length(p), x = q / uDisc, ang = atan(p.y, p.x);
  float g = exp(-max(x - 1.0, 0.0) * 2.6) * (x > 1.0 ? 1.0 : 1.3) * 0.85 + exp(-x * 0.55) * 0.1 + 0.5 * exp(-x * 5.0);   // the light round the star
  float st = 0.0;
  if (uStreak > 0.0) { float rays = pow(n2(vec2(ang * 5.0 + uSeed, uTime * 0.05)), 2.4) * 1.6 + pow(n2(vec2(ang * 11.0 + 8.0, uTime * 0.04 + x * 0.2)), 3.0); st = rays * uStreak * exp(-max(x - 1.0, 0.0) * 0.7) * smoothstep(1.0, 1.15, x); }
  float sk = 0.0;
  if (uSpike > 0.0) { float k = uSpike; float lines = pow(abs(cos(k * 0.5 * (ang - uSpikeRot))), 260.0) + 0.5 * pow(abs(cos(k * 0.5 * (ang - uSpikeRot) + 1.5708)), 400.0) * 0.0; sk = lines * exp(-x * 0.16) * 0.9 * smoothstep(0.7, 1.3, x); }
  float ring = 0.0;
  if (uRing > 0.0) { float ph = fract(uTime * 0.16 + uSeed), rr = 1.15 + ph * 3.4; ring = exp(-pow((x - rr) * 5.0, 2.0)) * (1.0 - ph) * uRing; }
  float fl = 1.0 + uFlick * (0.5 * sin(uTime * 11.0 + ang * 2.0) + 0.5 * sin(uTime * 7.3 + 1.0));
  float v = (g + st + sk + ring) * uStr * fl * (1.0 + 0.12 * uPulse);
  float edge = smoothstep(1.0, 0.82, q);
  vec3 col = uCol * v + vec3(1.0) * pow(max(g - 0.6, 0.0), 1.2) * 0.9 * uStr;
  gl_FragColor = vec4(col * edge, 1.0);
}`;
const HALO_VERT = `${LOGV}
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
#include <logdepthbuf_vertex>
}`;
const DUST_FRAG = `precision highp float;
#include <logdepthbuf_pars_fragment>
uniform float uTime, uDens, uSeed; uniform vec3 uCol;
varying vec3 vP; varying vec3 vN; varying vec3 vV;
${NOISE}
void main(){
#include <logdepthbuf_fragment>
  float mu = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
  vec3 d = vP * 2.4 + vec3(uSeed, 0.0, uSeed * 0.5);
  float c = fbm(d + vec3(0.0, uTime * 0.03, 0.0)) * 0.7 + 0.45 * fbm(d * 2.2 - uTime * 0.04);
  float cloud = smoothstep(0.42, 0.95, c);
  float rim = pow(1.0 - mu, 1.3) * 0.9 + 0.1;
  float a = cloud * rim * uDens;
  gl_FragColor = vec4(uCol * (0.35 + 0.65 * cloud) * a, a);
}`;

const SKY_FRAG = `precision highp float; varying vec3 vD;
${NOISE}
void main(){
  vec3 d = normalize(vD), n = normalize(vec3(0.28, 0.9, 0.22));
  float lat = dot(d, n), band = exp(-lat * lat * 14.0), core = exp(-lat * lat * 90.0);
  float cloud = fbm(d * 3.2), dust = fbm(d * 7.0 + 4.0);
  vec3 col = vec3(0.012, 0.014, 0.03) + vec3(0.06, 0.05, 0.1) * fbm(d * 2.0 + 9.0);
  col += (vec3(0.5, 0.42, 0.62) * band * (0.25 + 0.9 * cloud) + vec3(0.9, 0.7, 0.5) * core * cloud * 0.6) * (1.0 - 0.7 * smoothstep(0.45, 0.7, dust) * band);
  col += vec3(0.1, 0.18, 0.4) * smoothstep(0.6, 0.85, fbm(d * 2.6 + 20.0)) * 0.5;      // a faint blue nebula
  gl_FragColor = vec4(col, 1.0);
}`;

// ------------------------------------------------------------ how each star looks (on top of the facts in data.js)
// S = size of the glow in star-radii, str = glow strength, streak = corona rays, spike = diffraction spikes, ring = pulse rings, fine = size of the tiny speckle,
// white = blazing white middle (hot stars), limb = darker edge, lanes = dark gaps between the bubbles, contrast, boost = brightness.
const LOOK = {
  sun: { S: 7, str: 0.8, streak: 1, fine: 90, limb: 0.7, lanes: 1, contrast: 0.3, boost: 1.2 },
  sirius: { S: 9, str: 1.3, spike: 4, flick: 1, fine: 40, white: 0.5, limb: 0.3, lanes: 0.4, contrast: 0.15, boost: 1.15, bias: 0.4, col: [0.62, 0.78, 1.0] },
  vega: { S: 8, str: 1.15, spike: 4, fine: 40, white: 0.45, limb: 0.35, lanes: 0.35, contrast: 0.15, boost: 1.15, bias: 0.4, disc: 1, col: [0.7, 0.84, 1.0] },
  regulus: { S: 8, str: 1.15, spike: 4, fine: 36, white: 0.45, limb: 0.35, lanes: 0.35, contrast: 0.15, boost: 1.15, bias: 0.4, col: [0.5, 0.7, 1.0] },
  spica: { S: 11, str: 1.5, spike: 6, streak: 0.45, fine: 36, white: 0.4, limb: 0.3, lanes: 0.3, contrast: 0.12, boost: 1.15, bias: 0.4, col: [0.34, 0.55, 1.0] },
  pollux: { S: 5, str: 0.8, streak: 0.25, fine: 34, limb: 0.7, lanes: 1, contrast: 0.65 },
  arcturus: { S: 5, str: 0.85, streak: 0.3, fine: 30, limb: 0.7, lanes: 1, contrast: 0.7 },
  aldebaran: { S: 5.5, str: 0.85, streak: 0.3, fine: 26, limb: 0.72, lanes: 1, contrast: 0.75 },
  polaris: { S: 6.5, str: 1.0, ring: 1, spike: 6, fine: 40, limb: 0.55, lanes: 0.9, contrast: 0.4, bias: 0.3, boost: 1.3, col: [1.0, 0.88, 0.5] },
  rigel: { S: 12, str: 1.6, spike: 6, streak: 0.5, fine: 32, white: 0.45, limb: 0.3, lanes: 0.4, contrast: 0.2, boost: 1.15, bias: 0.38, col: [0.42, 0.64, 1.0] },
  deneb: { S: 9, str: 1.2, spike: 4, streak: 0.3, fine: 30, white: 0.35, limb: 0.4, lanes: 0.5, contrast: 0.3, boost: 1.15, bias: 0.38, col: [0.8, 0.88, 1.0] },
  antares: { S: 4.5, str: 0.75, streak: 0.2, fine: 16, limb: 0.8, lanes: 1, contrast: 0.85, dust: 0.6 },
  mucep: { S: 4.5, str: 0.7, streak: 0.2, fine: 16, limb: 0.8, lanes: 1, contrast: 0.9, dust: 0.6 },
  betelgeuse: { S: 4.5, str: 0.8, streak: 0.2, fine: 16, limb: 0.8, lanes: 1, contrast: 0.9, dust: 0.7 },
  uyscuti: { S: 4, str: 0.6, fine: 14, limb: 0.85, lanes: 1, contrast: 0.9, dust: 0.9 },
  kycyg: { S: 4, str: 0.6, fine: 14, limb: 0.85, lanes: 1, contrast: 0.9, dust: 0.9 },
  rwcep: { S: 4.2, str: 0.7, fine: 14, limb: 0.8, lanes: 1, contrast: 0.85, dust: 0.95 },
  vycma: { S: 4, str: 0.6, fine: 12, limb: 0.85, lanes: 1, contrast: 0.95, dust: 1.1 },
  nmlcyg: { S: 4, str: 0.55, fine: 12, limb: 0.85, lanes: 1, contrast: 0.95, dust: 1.2 },
  st218: { S: 3.8, str: 0.5, fine: 10, limb: 0.9, lanes: 1, contrast: 1.0, dust: 1.3 },
};
function ringTex() {
  const c = document.createElement('canvas'); c.width = c.height = 512; const x = c.getContext('2d'), g = x.createRadialGradient(256, 256, 0, 256, 256, 256);
  [[0, 'rgba(0,0,0,0)'], [0.4, 'rgba(0,0,0,0)'], [0.47, 'rgba(190,215,255,.55)'], [0.65, 'rgba(160,190,255,.3)'], [0.9, 'rgba(140,170,255,.08)'], [1, 'rgba(0,0,0,0)']].forEach(([t, col]) => g.addColorStop(t, col)); x.fillStyle = g; x.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 1400; k++) { const a = Math.random() * 6.283, r = 190 + Math.random() * 60, al = Math.random() * 0.35; x.fillStyle = `rgba(220,235,255,${al})`; x.fillRect(256 + Math.cos(a) * r, 256 + Math.sin(a) * r, 1.5, 1.5); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// ------------------------------------------------------------ building
async function init() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, logarithmicDepthBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
  scene = new THREE.Scene(); scene.background = new THREE.Color(0x000004);
  camera = new THREE.PerspectiveCamera(FOV, 1, 0.02, 4e5);

  // the sky: a Milky Way band and thousands of far-away stars, glued to the camera
  sky = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, depthTest: false, vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }', fragmentShader: SKY_FRAG }));
  sky.renderOrder = -20; sky.frustumCulled = false; scene.add(sky);
  const n = 4200, sp = new Float32Array(n * 3), sc = new Float32Array(n * 3), band = new THREE.Vector3(0.28, 0.9, 0.22).normalize(), tmp = V(0, 0, 0);
  for (let i = 0; i < n; i++) {
    for (;;) { tmp.set(Math.random() * 2 - 1, Math.random() * 2 - 1, Math.random() * 2 - 1); if (tmp.lengthSq() > 1 || tmp.lengthSq() < 0.01) continue; tmp.normalize(); const lat = tmp.dot(band); if (Math.random() < 0.25 + 0.75 * Math.exp(-lat * lat * 10)) break; }
    sp.set([tmp.x, tmp.y, tmp.z], i * 3); const w = 0.4 + Math.random() * 0.6, tint = Math.random(); sc.set([w * (0.85 + 0.15 * tint), w * 0.92, w * (1 - 0.2 * tint + 0.1)], i * 3);
  }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.BufferAttribute(sp, 3)); sg.setAttribute('color', new THREE.BufferAttribute(sc, 3));
  skyPts = new THREE.Points(sg, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true, depthWrite: false, depthTest: false, transparent: true, opacity: 0.95 })); skyPts.renderOrder = -19; skyPts.frustumCulled = false; scene.add(skyPts);

  const sphereGeo = new THREE.SphereGeometry(1, 128, 96), planeGeo = new THREE.PlaneGeometry(1, 1), dustGeo = new THREE.SphereGeometry(1, 64, 48), rTex = ringTex();
  const tag = (d) => { const el = document.createElement('div'); el.className = 'star-tag'; el.textContent = d.en; ui.tags.appendChild(el); return el; };
  for (let i = 0; i < NS; i++) {
    const d = STARS[i], fx = d.fx ?? {}, lk = LOOK[d.id] ?? {}, col = lk.col ?? starColor(d.T), hot = lerp3(col, d.T > 8000 ? [1, 1, 1] : [1, 0.93, 0.62], d.T > 8000 ? 0.5 : 0.55).map((v) => v * 1.05);
    const mat = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms: {
      uTime: { value: 0 }, uCell: { value: fx.cell ?? 8 }, uFine: { value: lk.fine ?? 30 }, uSpots: { value: fx.spots ?? 0 }, uContrast: { value: lk.contrast ?? 0.5 }, uSpin: { value: fx.spin ?? 0.1 }, uDim: { value: 1 }, uObl: { value: fx.oblate ? 1 : 0 },
      uWob: { value: 0 }, uBoost: { value: lk.boost ?? 1.1 }, uLimb: { value: lk.limb ?? 0.6 }, uWhite: { value: lk.white ?? 0 }, uLanes: { value: lk.lanes ?? 1 }, uBias: { value: lk.bias ?? 0.2 }, uCol: { value: new THREE.Vector3(...col) }, uHot: { value: new THREE.Vector3(...hot) } } });
    const group = new THREE.Group(), mesh = new THREE.Mesh(sphereGeo, mat); group.add(mesh);
    const hm = new THREE.ShaderMaterial({ vertexShader: HALO_VERT, fragmentShader: HALO_FRAG, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, uniforms: {
      uTime: { value: 0 }, uDisc: { value: 0.2 }, uStreak: { value: lk.streak ?? 0 }, uSpike: { value: lk.spike ?? 0 }, uSpikeRot: { value: 0.3 }, uRing: { value: lk.ring ?? 0 }, uFlick: { value: lk.flick ?? 0 }, uStr: { value: lk.str ?? 1 },
      uSeed: { value: Math.random() * 20 }, uPulse: { value: 0 }, uCol: { value: new THREE.Vector3(...col.map((v) => Math.min(1, v * 1.05))) } } });
    const halo = new THREE.Mesh(planeGeo, hm); halo.frustumCulled = false; halo.renderOrder = 5; group.add(halo);
    const st = { d, i, lk, group, mesh, mat, halo, hm, col, pos: V(0, 0, 0), pop: 0, tag: tag(d), phase: Math.random() * 6.28, dim: 1 };
    if (lk.dust) { const dm = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: DUST_FRAG, transparent: true, depthWrite: false, uniforms: { uTime: { value: 0 }, uDens: { value: lk.dust }, uSeed: { value: Math.random() * 30 }, uCol: { value: new THREE.Vector3(col[0] * 0.95, col[1] * 0.62, col[2] * 0.5) } } }); st.dust = new THREE.Mesh(dustGeo, dm); st.dust.renderOrder = 4; group.add(st.dust); }
    if (lk.disc) { const dsc = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: rTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })); dsc.rotation.x = -1.25; dsc.rotation.z = 0.2; dsc.renderOrder = 3; st.disc = dsc; group.add(dsc); }
    if (fx.comp) { const cc = starColor(fx.comp.T); const cm = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 24), new THREE.MeshBasicMaterial({ color: new THREE.Color(...cc.map((v) => Math.min(1, v * 1.15))) })); const cg = new THREE.Mesh(planeGeo, new THREE.ShaderMaterial({ vertexShader: HALO_VERT, fragmentShader: HALO_FRAG, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, uniforms: { uTime: { value: 0 }, uDisc: { value: 0.15 }, uStreak: { value: 0 }, uSpike: { value: 4 }, uSpikeRot: { value: 0.8 }, uRing: { value: 0 }, uFlick: { value: 0 }, uStr: { value: 0.9 }, uSeed: { value: 3 }, uPulse: { value: 0 }, uCol: { value: new THREE.Vector3(...cc) } } })); cg.frustumCulled = false; group.add(cm, cg); st.comp = { mesh: cm, glow: cg, ...fx.comp }; }
    if (fx.flares) { st.arcs = []; for (let k = 0; k < fx.flares; k++) { const curve = new THREE.CatmullRomCurve3(Array.from({ length: 13 }, (_, j) => { const a = (j / 12) * Math.PI; return V(Math.cos(a) * 0.3, Math.sin(a) * 0.42, 0); })); const am = new THREE.MeshBasicMaterial({ color: 0xff9a35, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 }); const arc = new THREE.Mesh(new THREE.TubeGeometry(curve, 26, 0.022, 8, false), am); const holder = new THREE.Group(); holder.add(arc); group.add(holder); st.arcs.push({ holder, arc, am, life: Math.random() * 6, dur: 4 + Math.random() * 3 }); } }
    scene.add(group); stars.push(st);
    if (i % 3 === 0) { ui.loading.querySelector('.bar i').style.width = `${Math.round((i / NS) * 100)}%`; await new Promise((r) => setTimeout(r, 0)); }
  }
  controls = new OrbitControls(camera, canvas);
  controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = 0.09; controls.rotateSpeed = 0.7; controls.zoomSpeed = 1.1; controls.minDistance = 0.3; controls.maxDistance = 3e5;
  controls.addEventListener('start', () => { userMoved = true; overviewFit = false; flight = null; if (tour && !focus) stopTour(); if (focus && !cardMini) setMini(true); });
  layout(); introShot();
  buildChips(); bind(); resize();
  if (['localhost', '127.0.0.1'].includes(location.hostname)) window.__stars = { get camera() { return camera; }, get controls() { return controls; }, stars, focusOn, setReal: (v) => { real = realGoal = v; }, get focus() { return focus; } };
  ready = true; ui.loading.classList.add('done');
}

// ------------------------------------------------------------ where everything is: a straight line, the Sun first and the biggest star last
const tmpA = V(0, 0, 0), tmpB = V(0, 0, 0), up = V(0, 1, 0);
function radii() { const k = real * real * (3 - 2 * real); for (let i = 0; i < NS; i++) { prevR[i] = rNow[i]; rNow[i] = Math.exp(Math.log(rComp[i]) * (1 - k) + Math.log(STARS[i].R) * k); } }
let lineLen = 1;
function layout() {
  radii(); const s = [0]; for (let i = 1; i < NS; i++) s.push(s[i - 1] + rNow[i - 1] + rNow[i] + 0.55 * (rNow[i] + rNow[i - 1]) + 2.5 * (1 - real) + 0.5);
  lineLen = s[NS - 1];
  for (let i = 0; i < NS; i++) { stars[i].pos.set(s[i] - lineLen / 2, 0, 0); stars[i].group.position.copy(stars[i].pos); }
}
function introShot() {
  const s0 = stars[0]; focus = null; controls.target.copy(s0.pos);
  camera.position.copy(s0.pos).add(V(0.4, 0.35, 1).normalize().multiplyScalar(rNow[0] * 4)); controls.update();
  overviewFit = true; userMoved = false; flyOverview(3.6, true);
}

// ------------------------------------------------------------ camera flights
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function overviewDist() {
  const vh = THREE.MathUtils.degToRad(FOV / 2), hh = Math.atan(Math.tan(vh) * camera.aspect), half = lineLen / 2 + rNow[NS - 1];
  return Math.max((half * 1.06) / Math.tan(hh), (rNow[NS - 1] * 1.5) / Math.tan(vh)) + rNow[NS - 1];
}
function startFlight(toTarget, toPos, dur, arc = 0.2) {
  flight = { t: 0, dur, aT: controls.target.clone(), aP: camera.position.clone(), bT: toTarget.clone(), bP: toPos.clone(), arc: arc * camera.position.distanceTo(toPos) };
  overviewFit = false; controls.enabled = false;
}
function flyOverview(dur = 2.6, intro = false) {
  focus = null; overviewFit = true; userMoved = false; showCard(null); refreshChips(); navArrows();
  startFlight(V(0, 0, 0), V(0, overviewDist() * 0.16, overviewDist()), dur, intro ? 0 : 0.05);
}
function viewDirFor() { return V(0.5, 0.24, 1).normalize(); }                  // from the side, so the next star glows behind it
const cardUp = () => !cardMini && ui.card.classList.contains('open');
function focusDist(st) { const vh = THREE.MathUtils.degToRad(FOV / 2), hh = Math.atan(Math.tan(vh) * camera.aspect); return rNow[st.i] / (Math.tan(Math.min(vh, cardUp() ? Math.min(vh, hh) * 0.9 : hh)) * (cardUp() ? 0.5 : 0.62)); }   // the whole star fits in the part of the screen that the card leaves free
function aimPoint(st, dist) { return st.pos.clone().addScaledVector(camera.up, -dist * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * (cardUp() ? 0.42 : 0.04)); }
function focusOn(st, dur = 2.8) {
  if (!st) { stopTour(); groupFilter = null; applyGroup(); flyOverview(); return; }
  focus = st; cardMini = false; showCard(st); refreshChips(); navArrows();
  const dist = focusDist(st), tgt = aimPoint(st, dist);
  startFlight(tgt, tgt.clone().addScaledVector(viewDirFor(), dist), dur + Math.min(1.4, Math.log10(1 + camera.position.distanceTo(st.pos)) * 0.28), 0.12);
  st.pop = 1; tourT = 0;
}
function stepStar(k) { const i = focus ? Math.min(NS - 1, Math.max(0, focus.i + k)) : k > 0 ? 0 : NS - 1; if (focus && i === focus.i) return; focusOn(stars[i]); }
function navArrows() {
  $('#st-left').hidden = $('#st-right').hidden = !focus;
  const below = $('#view-stars .insect-tools').getBoundingClientRect().bottom - root.getBoundingClientRect().top + 10;     // under the buttons, never on top of them
  $('#st-left').style.top = $('#st-right').style.top = `${below}px`;
  if (focus) { $('#st-left').classList.toggle('off', focus.i === 0); $('#st-right').classList.toggle('off', focus.i === NS - 1); } }

// ------------------------------------------------------------ the loop
function resize() {
  if (!renderer) return; const w = root.clientWidth, h = root.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); fxCanvas.width = w; fxCanvas.height = h; navArrows();
}
const warp = Array.from({ length: 110 }, () => ({ a: Math.random() * 6.283, r: Math.random(), s: 0.4 + Math.random() }));
function drawWarp(k) {
  const c = fxCanvas.getContext('2d'), w = fxCanvas.width, h = fxCanvas.height; c.clearRect(0, 0, w, h); if (k < 0.02) return;
  c.lineCap = 'round'; const R = Math.hypot(w, h) / 2, cx = w / 2, cy = h * 0.42;
  for (const p of warp) { p.r = (p.r + 0.04 * p.s * k) % 1; const r0 = R * (0.08 + p.r * 0.9), r1 = r0 + R * 0.18 * k * p.s; c.strokeStyle = `rgba(200,220,255,${0.5 * k * (1 - p.r)})`; c.lineWidth = 1 + 1.6 * p.s * k; c.beginPath(); c.moveTo(cx + Math.cos(p.a) * r0, cy + Math.sin(p.a) * r0); c.lineTo(cx + Math.cos(p.a) * r1, cy + Math.sin(p.a) * r1); c.stroke(); }
}
let warpK = 0;
function frame(now) {
  if (!running) return; raf = requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - lastT) / 1000); lastT = now; clock += dt;
  if (real !== realGoal) { const d = realGoal - real; real += Math.sign(d) * Math.min(Math.abs(d), dt / 3.4); }
  layout();
  const camPos = camera.position;
  for (const st of stars) {
    const i = st.i, fx = st.d.fx ?? {}, lk = st.lk; let r = rNow[i], sy = 1, sx = 1, pulse = 0;
    if (fx.pulse === 'cepheid') { pulse = Math.sin(clock * 1.6); r *= 1 + 0.07 * pulse; }
    if (fx.pulse === 'irregular') r *= 1 + 0.045 * Math.sin(clock * 0.9 + st.phase) + 0.035 * Math.sin(clock * 1.7 + 2) + 0.025 * Math.sin(clock * 2.9);
    if (fx.oblate) sy = 1 - fx.oblate; if (st.d.id === 'spica') sx = 1.13;
    st.mesh.scale.set(r * sx, r * sy, r); st.mat.uniforms.uTime.value = clock + st.phase * 3; st.mat.uniforms.uWob.value = fx.pulse === 'irregular' ? 0.5 : 0;
    const dist = camPos.distanceTo(st.pos), dimK = groupFilter && st.d.grp !== groupFilter ? 0.22 : 1; st.dim += (dimK - st.dim) * Math.min(1, dt * 5); st.mat.uniforms.uDim.value = st.dim;
    st.pop = Math.max(0, st.pop - dt * 0.7); const popK = 1 + 0.8 * st.pop * st.pop;
    const near = THREE.MathUtils.smoothstep(dist / r, 2.2, 6.5);                                         // the glow thins out as you get close
    const half = Math.max(r * (lk.S ?? 5), dist * 0.045) * popK, hu = st.hm.uniforms;
    st.halo.quaternion.copy(camera.quaternion); st.halo.scale.setScalar(half * 2); hu.uDisc.value = Math.min(0.9, r / half); hu.uTime.value = clock; hu.uStr.value = (lk.str ?? 1) * st.dim * (0.55 + 0.45 * near) * (r / half > 0.5 ? 0.6 : 1); hu.uSpikeRot.value = 0.25 + st.phase * 0.02; hu.uPulse.value = pulse;
    if (st.dust) { st.dust.scale.setScalar(r * (1.32 + 0.05 * Math.sin(clock * 0.4 + st.phase))); st.dust.material.uniforms.uTime.value = clock; st.dust.material.uniforms.uDens.value = lk.dust * st.dim * near; st.dust.visible = near > 0.02; }
    if (st.disc) { const q = r * 9; st.disc.scale.set(q, q, 1); st.disc.material.opacity = st.dim * near; }
    if (st.comp) { const c = st.comp, a = (clock / c.period) * 6.283 + st.phase, cr = Math.max(c.r * r, 1e-4), od = r * (1.4 + c.orbit * 0.6); c.mesh.position.set(Math.cos(a) * od, 0.15 * od * Math.sin(a * 2), Math.sin(a) * od); c.mesh.scale.setScalar(cr); c.glow.position.copy(c.mesh.position); c.glow.quaternion.copy(camera.quaternion); const hs = Math.max(cr * 10, dist * 0.03, r * 0.14); c.glow.scale.setScalar(hs * 2); c.glow.material.uniforms.uDisc.value = Math.min(0.2, cr / hs); c.glow.material.uniforms.uTime.value = clock; }
    if (st.arcs) for (const A of st.arcs) {                                  // loops of glowing gas rise from the Sun's surface, then fall back
      A.life += dt;
      if (A.life > A.dur || !A.n) { A.life = 0; A.dur = 4 + Math.random() * 3; A.n = A.n ?? V(0, 1, 0); tmpA.copy(camPos).sub(st.pos).normalize(); A.n.set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5); A.n.addScaledVector(tmpA, -A.n.dot(tmpA)).normalize(); A.n.addScaledVector(tmpA, (Math.random() - 0.5) * 0.25).normalize(); A.k = 0.45 + Math.random() * 0.7; A.holder.quaternion.setFromUnitVectors(V(0, 1, 0), A.n); A.holder.rotateY(Math.random() * 6.28); A.holder.rotateZ(0); }
      const u = A.life / A.dur; A.am.opacity = Math.sin(Math.PI * Math.min(1, u)) * 0.7 * near; A.holder.visible = near > 0.02;
      A.holder.position.copy(A.n).multiplyScalar(r * 0.93); A.holder.scale.setScalar(r * A.k * (0.35 + 0.65 * Math.min(1, u * 1.6)));
    }
  }
  sky.position.copy(camPos); sky.scale.setScalar(camera.far * 0.4); skyPts.position.copy(camPos); skyPts.scale.setScalar(camera.far * 0.39);

  let warpTarget = 0;
  if (flight) {
    flight.t += dt / flight.dur; const t = Math.min(1, flight.t), e = ease(t);
    const tg = flight.aT.clone().lerp(flight.bT, e), ps = flight.aP.clone().lerp(flight.bP, e); ps.y += Math.sin(Math.PI * e) * flight.arc;
    controls.target.copy(tg); camera.position.copy(ps); camera.lookAt(tg); warpTarget = Math.sin(Math.PI * Math.min(1, t * 1.05)) * Math.min(1, flight.aP.distanceTo(flight.bP) / (lineLen * 0.35 + 1));
    camera.fov = FOV + 22 * warpTarget; camera.updateProjectionMatrix();
    if (t >= 1) { flight = null; controls.enabled = true; camera.fov = FOV; camera.updateProjectionMatrix(); controls.update(); }
  } else {
    if (real !== realGoal || (focus && prevR[focus.i] !== rNow[focus.i])) {            // sizes are changing: stay with the star we are looking at
      if (focus) { const i = focus.i, off = camPos.clone().sub(controls.target); const ratio = prevR[i] > 0 ? rNow[i] / prevR[i] : 1; const tgt = aimPoint(focus, off.length() * ratio); off.multiplyScalar(ratio); controls.target.copy(tgt); camera.position.copy(tgt).add(off); }
    }
    if (overviewFit && !focus) { const off = camPos.clone().sub(controls.target).normalize(); controls.target.set(0, 0, 0); camera.position.copy(off.multiplyScalar(overviewDist())); }
    if (tour && focus) { tourT += dt; if (tourT > 9.5) { if (focus.i === NS - 1) { stopTour(); focusOn(null); } else stepStar(1); } }
    controls.autoRotate = !!focus && !userMoved; controls.autoRotateSpeed = 0.6;
    controls.update();
  }
  warpK += (warpTarget - warpK) * Math.min(1, dt * 6); drawWarp(warpK);
  renderer.render(scene, camera);
  updateTags();
}
const proj = V(0, 0, 0);
function updateTags() {
  const w = root.clientWidth, h = root.clientHeight, showAll = !focus && !flight; let lastX = -1e9;
  for (const st of stars) {                                              // stars are in a line from left to right, so a name is shown only when there is room for it
    const el = st.tag; proj.copy(st.pos).project(camera); const sx = ((proj.x + 1) / 2) * w;
    const vis = showAll && proj.z < 1 && Math.abs(proj.x) < 1.05 && Math.abs(proj.y) < 1.05 && (!groupFilter || st.d.grp === groupFilter) && sx - lastX > 64;
    if (!vis) { if (el._on) { el.style.opacity = 0; el._on = false; } continue; }
    lastX = sx; const rad = (rNow[st.i] * h) / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * camera.position.distanceTo(st.pos));
    el.style.transform = `translate(-50%, 0) translate(${sx}px, ${((1 - proj.y) / 2) * h + Math.max(10, rad) + 8}px)`; el.style.opacity = 1; el._on = true;
  }
}

// ------------------------------------------------------------ cards, chips, text
const fmt = (n) => (n >= 10 ? Math.round(n).toLocaleString(lang === 'es' ? 'es-ES' : 'en-US') : String(Math.round(n * 10) / 10));
function words(n) {
  if (n < 1e3) return fmt(n); const es = lang === 'es';
  if (n < 1e6) return `${fmt(n / 1e3)} ${es ? 'mil' : 'thousand'}`; if (n < 1e9) return `${fmt(n / 1e6)} ${es ? (n / 1e6 < 2 ? 'millón' : 'millones') : 'million'}`;
  return `${fmt(n / 1e9)} ${es ? 'mil millones' : 'billion'}`;
}
const heatC = (Tk) => `${(Math.round((Tk - 273) / 100) * 100).toLocaleString(lang === 'es' ? 'es-ES' : 'en-US')} ${T[lang].unit}`;
function distText(d) { const t = T[lang]; return d.lm ? `${d.lm} ${t.lm}` : `${fmt(d.ly)} ${t.ly}`; }
function showCard(st) {
  if (!st) { ui.card.classList.remove('open', 'adult'); return; }
  const t = T[lang], d = st.d, g = GROUPS.find((x) => x.id === d.grp);
  ui.name.textContent = d[lang]; ui.badge.textContent = d.cls[lang]; ui.badge.style.setProperty('--dot', `rgb(${st.col.map((v) => Math.round(v * 255)).join(',')})`);
  ui.kid.textContent = d.kid[lang]; ui.adult.textContent = d.adult[lang]; ui.fam.textContent = `${g[lang]}: ${g.kid[lang]}`;
  ui.stats.innerHTML = [['📏', t.width, d.R === 1 ? t.ourstar : `${fmt(d.R)} ${t.suns} ${t.wide}`], ['🌡️', t.heat, heatC(d.T)], ['🛣️', t.far, distText(d)], ['📦', t.fits, d.R < 2 ? '—' : words(Math.pow(d.R, 3))]]
    .map(([e, a, b]) => `<div class="stat"><span>${e}</span><b>${b}</b><i>${a}</i></div>`).join('');
  ui.card.classList.add('open'); setMini(false);
}
function setMini(on) { cardMini = on; ui.card.classList.toggle('mini', on); }
function buildChips() {
  ui.chips.innerHTML = stars.map((st) => `<button type="button" class="chip star-chip" data-id="${st.d.id}"><i style="background:rgb(${st.col.map((v) => Math.round(v * 255)).join(',')})"></i><span>${st.d[lang]}</span></button>`).join('');
  ui.chips.querySelectorAll('.chip').forEach((el) => el.addEventListener('click', () => { const st = stars.find((s) => s.d.id === el.dataset.id); if (tour) stopTour(); focusOn(focus === st ? null : st); }));
}
function refreshChips() {
  ui.chips.querySelectorAll('.chip').forEach((el) => { const st = stars.find((s) => s.d.id === el.dataset.id); el.classList.toggle('on', focus === st); el.classList.toggle('dim', !!groupFilter && st.d.grp !== groupFilter); });
  const on = ui.chips.querySelector('.chip.on'); if (on) on.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
}
function applyGroup() {
  const g = GROUPS.find((x) => x.id === groupFilter); ui.group.hidden = !g;
  if (g) { ui.group.querySelector('b').textContent = g[lang]; ui.group.querySelector('span').textContent = T[lang].all; }
  refreshChips();
}
function toast(msg) { ui.toast.textContent = msg; ui.toast.classList.remove('show'); void ui.toast.offsetWidth; ui.toast.classList.add('show'); }
function setLang(l) {
  lang = l; const t = T[l];
  document.querySelectorAll('#view-stars .lang button').forEach((b) => b.classList.toggle('on', b.dataset.lang === l));
  ui.title.textContent = t.title; ui.sub.textContent = t.sub; $('#btn-tour-l').textContent = t.tour; $('#btn-real-l').textContent = t.real;
  ui.chips.querySelectorAll('.chip').forEach((el) => { el.querySelector('span').textContent = STARS.find((d) => d.id === el.dataset.id)[l]; });
  stars.forEach((st) => { st.tag.textContent = st.d[l]; });
  if (focus) showCard(focus); applyGroup(); if (lessonI >= 0) showLesson(lessonI); speechSynthesis?.cancel();
}
function speak(text) { if (!('speechSynthesis' in window)) return; speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = T[lang].speech; u.rate = 0.85; speechSynthesis.speak(u); }

// ------------------------------------------------------------ tour and real size
function startTour() { tour = true; ui.play.classList.add('on'); focusOn(stars[0]); }
function stopTour() { tour = false; ui.play.classList.remove('on'); }
function toggleReal() { realGoal = realGoal > 0.5 ? 0 : 1; ui.real.classList.toggle('on', realGoal === 1); toast(realGoal ? T[lang].realOn : T[lang].realOff); if (!focus) overviewFit = true; }

// ------------------------------------------------------------ lessons
function art(id) {
  if (id === 'colour') return `<div class="stl-bar"><div class="stl-grad"></div><div class="stl-lab"><span>${lang === 'es' ? 'Muy caliente' : 'Hottest'}</span><span>${lang === 'es' ? 'Más fría' : 'Coolest'}</span></div><div class="stl-dots">${['#8fb4ff', '#d8e4ff', '#ffe9b0', '#ff9a3c', '#ff4a2a'].map((c) => `<i style="background:${c}"></i>`).join('')}</div></div>`;
  if (id === 'size') return `<div class="stl-sizes">${[['dwarf', 26], ['giant', 44], ['super', 66], ['hyper', 92]].map(([k, s]) => `<div><i style="width:${s}px;height:${s}px"></i><span>${{ dwarf: lang === 'es' ? 'Enana' : 'Dwarf', giant: lang === 'es' ? 'Gigante' : 'Giant', super: lang === 'es' ? 'Super' : 'Super-giant', hyper: lang === 'es' ? 'Hiper' : 'Hyper-giant' }[k]}</span></div>`).join('')}</div>`;
  return `<div class="stl-emoji">${LESSONS.find((l) => l.id === id).em}</div>`;
}
const SLIDES = LESSONS.length + 1;     // the last slide: the star families
function showLesson(i) {
  lessonI = i; ui.learn.hidden = false; ui.learn.classList.remove('adult'); const fam = i === LESSONS.length;
  if (fam) { ui.lEm.innerHTML = '<div class="stl-emoji">🌟</div>'; ui.lTitle.textContent = lang === 'es' ? 'Las familias de estrellas' : 'Star families'; ui.lKid.textContent = lang === 'es' ? 'Toca una familia para ver sus estrellas brillar.' : 'Tap a family to make its stars glow!'; $('#stl-adult').textContent = lang === 'es' ? 'Se agrupan por tamaño y color. Esas familias no son categorías oficiales exactas: son una forma sencilla de ordenar las 20 estrellas.' : 'Grouped by size and colour. These families are a simple way to sort the 20 stars, not exact official classes.'; ui.lGroups.hidden = false; ui.lGroups.innerHTML = GROUPS.map((g) => `<button type="button" class="fam-btn" data-g="${g.id}"><i style="background:${g.dot}"></i>${g[lang]}</button>`).join(''); ui.lGroups.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => { closeLesson(); groupFilter = b.dataset.g; applyGroup(); focusOn(stars.find((s) => s.d.grp === groupFilter)); })); }
  else { const L = LESSONS[i]; ui.lEm.innerHTML = art(L.id); ui.lTitle.textContent = L.title[lang]; ui.lKid.textContent = L.kid[lang]; $('#stl-adult').textContent = L.adult[lang]; ui.lGroups.hidden = true; ui.lGroups.innerHTML = ''; }
  ui.lDots.innerHTML = Array.from({ length: SLIDES }, (_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('');
}
function closeLesson() { ui.learn.hidden = true; lessonI = -1; speechSynthesis?.cancel(); }

// ------------------------------------------------------------ input
const pr = V(0, 0, 0);
function pick(cx, cy) {
  const r = canvas.getBoundingClientRect(); let best = null, bs = Infinity;
  for (const st of stars) { pr.copy(st.pos).project(camera); if (pr.z > 1) continue; const sx = r.left + ((pr.x + 1) / 2) * r.width, sy = r.top + ((1 - pr.y) / 2) * r.height, dist = camera.position.distanceTo(st.pos); const rad = (rNow[st.i] * r.height) / (2 * Math.tan(THREE.MathUtils.degToRad(FOV / 2)) * dist), hit = Math.max(rad, 26), dd = Math.hypot(cx - sx, cy - sy); if (dd <= hit) { const sc = dd / hit + dist * 1e-5; if (sc < bs) { bs = sc; best = st; } } }
  return best;
}
let bound = false;
function bind() {
  if (bound) return; bound = true;
  let down = null, pointers = 0, multi = false;
  canvas.addEventListener('pointerdown', (e) => { pointers++; if (pointers > 1) { multi = true; down = null; } else { multi = false; down = { x: e.clientX, y: e.clientY, t: performance.now() }; } });
  const up = (e, cancelled) => { pointers = Math.max(0, pointers - 1); if (!cancelled && down && !multi && performance.now() - down.t < 700 && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 10) { const st = pick(e.clientX, e.clientY); if (st) { if (tour) stopTour(); focusOn(st); } else if (focus && !cardMini) setMini(true); } if (!pointers) { down = null; multi = false; } };
  canvas.addEventListener('pointerup', (e) => up(e, false)); canvas.addEventListener('pointercancel', (e) => up(e, true));
  const tuck = () => { if (focus && !cardMini && !flight) setMini(true); };                // zooming or turning the view also tucks the card away
  canvas.addEventListener('wheel', tuck, { passive: true }); canvas.addEventListener('touchmove', tuck, { passive: true }); canvas.addEventListener('gesturestart', tuck);
  ui.card.addEventListener('click', (e) => { if (!e.target.closest('button') && cardMini) setMini(false); });
  $('#stc-prev').addEventListener('click', () => { if (tour) stopTour(); stepStar(-1); }); $('#stc-next').addEventListener('click', () => { if (tour) stopTour(); stepStar(1); });
  $('#stc-say').addEventListener('click', () => { if (focus) speak(`${focus.d[lang]}. ${focus.d.kid[lang]}`); });
  $('#stc-info').addEventListener('click', () => ui.card.classList.toggle('adult')); $('#stc-close').addEventListener('click', () => { stopTour(); focusOn(null); });
  $('#st-left').addEventListener('click', () => { if (tour) stopTour(); stepStar(-1); }); $('#st-right').addEventListener('click', () => { if (tour) stopTour(); stepStar(1); });
  ui.play.addEventListener('click', () => (tour ? stopTour() : startTour())); ui.real.addEventListener('click', toggleReal);
  $('#btn-sov').addEventListener('click', () => { stopTour(); groupFilter = null; applyGroup(); flyOverview(); });
  $('#btn-learn').addEventListener('click', () => { stopTour(); showLesson(0); });
  $('#stl-close').addEventListener('click', closeLesson); $('#stl-prev').addEventListener('click', () => showLesson((lessonI + SLIDES - 1) % SLIDES)); $('#stl-next').addEventListener('click', () => showLesson((lessonI + 1) % SLIDES));
  $('#stl-info').addEventListener('click', () => ui.learn.classList.toggle('adult'));
  $('#stl-say').addEventListener('click', () => { if (lessonI >= 0) speak(`${ui.lTitle.textContent}. ${ui.lKid.textContent}`); });
  ui.group.addEventListener('click', () => { groupFilter = null; applyGroup(); });
  document.querySelectorAll('#view-stars .lang button').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
  new ResizeObserver(resize).observe(root);
}

// ------------------------------------------------------------ enter / leave
export async function enter() {
  running = true; ui.loading.classList.remove('done'); lang = 'en';
  loadPromise ??= init().catch((e) => { console.error(e); ui.loading.querySelector('p').textContent = 'Oops! Please reload.'; });
  await loadPromise; if (!ready || !running) return;
  setLang('en'); resize(); lastT = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(frame);
}
export function leave() { running = false; cancelAnimationFrame(raf); speechSynthesis?.cancel(); stopTour(); closeLesson(); }
