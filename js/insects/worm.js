// Earthworm / soil worm (Lumbricus terrestris). Not an insect: a soft, legless ringed worm (an annelid) that tunnels through soil.
// ~38 visible rings, a smooth lighter "saddle" (clitellum), tiny bristles (setae) on every ring, no eyes. It crawls with waves of squeezing and stretching.
import * as THREE from '../../vendor/three.module.min.js';
import { V, mat, blob, ball, cone, part, canvasTex, microBumpTex } from './lib.js';

export const info = {
  id: 'worm', icon: '🪱',
  name: { en: 'Soil Worm', es: 'Lombriz de tierra' },
  sci: 'Lumbricus terrestris',
  blurb: { en: 'Not an insect! A soft, bendy worm with no legs that tunnels through the soil.', es: '¡No es un insecto! Un gusano blando y flexible, sin patas, que hace túneles en la tierra.' },
  cameraDir: V(0.2, 1.0, 0.8).normalize(),
};

export const categories = {
  head:     { en: 'Head end', es: 'Parte de la cabeza', dEn: 'The front end has no eyes! A soft lip, the prostomium, feels the way and pushes the soil. The mouth is underneath.', dEs: '¡La parte de adelante no tiene ojos! Un labio suave, el prostomio, siente el camino y empuja la tierra. La boca está abajo.' },
  body:     { en: 'Body rings', es: 'Anillos del cuerpo', dEn: 'A worm is made of lots of little rings called segments. A real earthworm has about 100 to 150 of them (this model shows fewer so you can see them). They squeeze and stretch like a spring so the worm can crawl.', dEs: 'Una lombriz está hecha de muchos anillitos llamados segmentos. Una lombriz de verdad tiene unos 100 a 150 (este modelo muestra menos para que se vean). Se aprietan y se estiran como un resorte para arrastrarse.' },
  saddle:   { en: 'The saddle', es: 'La silla (clitelo)', dEn: 'The smooth, lighter band near the front is called the clitellum. It makes a slimy cocoon where baby worms grow.', dEs: 'La banda lisa y más clara cerca de la cabeza se llama clitelo. Hace un capullo baboso donde crecen las lombricitas.' },
  bristles: { en: 'Tiny bristles', es: 'Cerditas diminutas', dEn: 'Almost every ring has eight tiny stiff hairs called setae. They grip the soil like little hooks, so the worm can pull itself along.', dEs: 'Casi todos los anillos tienen ocho pelitos duros llamados setas. Se agarran a la tierra como ganchitos para que la lombriz se jale hacia adelante.' },
  tail:     { en: 'Tail end', es: 'Parte de la cola', dEn: 'The back end, where the leftover soil comes out as little crumbs called castings. They make the soil rich for plants!', dEs: 'La parte de atrás, por donde sale la tierra que sobra en bolitas llamadas humus de lombriz. ¡Hacen la tierra rica para las plantas!' },
};

const N = 64, D = 0.105, R = 0.3, SADDLE = [13, 16], WAVE = 14;   // the saddle is near the FRONT (about a quarter of the way back), as on a real earthworm
const smooth = THREE.MathUtils.smoothstep;
// a real earthworm: pointed at the head, a smooth cylinder along the body, a blunt, slightly flattened tail (not pointed)
const rad = (i) => R * (0.4 + 0.6 * smooth(i, 0, 7)) * (0.8 + 0.2 * smooth(N - 1 - i, 0, 5)) * (i >= SADDLE[0] && i <= SADDLE[1] ? 1.1 : 1);
const flat = (i) => smooth(i, N * 0.68, N - 1);   // the back part is flattened a little
const rotY = (lx, ly, lz, phi) => V(lx * Math.cos(phi) + lz * Math.sin(phi), ly, -lx * Math.sin(phi) + lz * Math.cos(phi));

// where every ring sits: `ext` is how stretched each ring is, `z` how far the body bends sideways
function lay(ext, amp, ph) {
  const xs = [], zs = [], phis = []; let x = 0.1;
  for (let i = 0; i < N; i++) {
    xs.push(x); zs.push(amp * (0.3 + 0.7 * Math.min(1, i / 12)) * Math.sin(0.17 * i - ph)); if (i < N - 1) x -= D * 0.5 * (ext[i] + ext[i + 1]);
  }
  for (let i = 0; i < N; i++) { const a = Math.max(0, i - 1), b = Math.min(N - 1, i + 1); phis.push(Math.atan2(zs[b] - zs[a], xs[a] - xs[b])); }
  return { xs, zs, phis };
}

export function build() {
  const root = new THREE.Group();
  root.userData.groundY = -R * 0.9;
  // a back that is darker purple-brown and a belly that is pale pink (v runs from the back over to the belly)
  const skinMap = canvasTex(64, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); [[0, '#4f2230'], [0.25, '#6f3338'], [0.5, '#965350'], [0.78, '#bb8274'], [1, '#d3a08e']].forEach(([t, c]) => g.addColorStop(t, c)); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  const skin = mat(0xffffff, { roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.28, map: skinMap, sheen: 0.25, sheenColor: new THREE.Color(0xc98a8a), iridescence: 0.25, iridescenceIOR: 1.2, bumpMap: microBumpTex(91, 20), bumpScale: 0.12 });
  const saddleMap = canvasTex(64, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); [[0, '#b86a62'], [0.5, '#d48a7a'], [1, '#e6ae9c']].forEach(([t, c]) => g.addColorStop(t, c)); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  const saddleMat = mat(0xffffff, { roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12, map: saddleMap, sheen: 0.3, sheenColor: new THREE.Color(0xe0a090), bumpMap: microBumpTex(92, 14), bumpScale: 0.2 });
  const lipMat = mat(0xb26068, { roughness: 0.3, clearcoat: 0.9, sheen: 0.5, sheenColor: new THREE.Color(0xffc9d0) });
  const mouthMat = mat(0x3a1218, { roughness: 0.4, clearcoat: 0.6 });
  const setaMat = mat(0xe8c9a0, { roughness: 0.5, clearcoat: 0.3 });

  const segs = [], base = [];       // one pivot per ring (they are moved by the crawl animation)
  const mk = (i) => { const r = rad(i), g = new THREE.Group(), m = blob(D * 3.4, r * 0.96 * (1 - 0.22 * flat(i)), r * 1.04 * (1 + 0.12 * flat(i)), i >= SADDLE[0] && i <= SADDLE[1] ? saddleMat : skin, (v) => { if (v.y < 0) v.y *= 0.84; }, [40, 26]); g.add(m); segs[i] = { g, m }; base[i] = r; return g; };
  for (let i = 0; i < N; i++) mk(i);

  // ---- head end: the first ring, a soft lip over the mouth
  const head = new THREE.Group();
  segs[0].g.add(blob(0.09, 0.1, 0.125, lipMat, (v) => { if (v.y < 0) v.y *= 0.8; }, [32, 20])); segs[0].g.children[1].position.set(0.2, 0.012, 0);    // the prostomium lip
  segs[0].g.add(ball(V(0.16, -0.075, 0), 0.05, mouthMat, 1.4, 0.55, 1.2));                                                                                // the mouth underneath
  head.add(segs[0].g, segs[1].g, segs[2].g);
  root.add(part('head', 'head', head, categories.head));
  const bodyG = new THREE.Group(); for (let i = 3; i < N - 5; i++) if (i < SADDLE[0] || i > SADDLE[1]) bodyG.add(segs[i].g);
  root.add(part('body', 'body', bodyG, categories.body));
  const saddleG = new THREE.Group(); for (let i = SADDLE[0]; i <= SADDLE[1]; i++) saddleG.add(segs[i].g);
  root.add(part('saddle', 'saddle', saddleG, categories.saddle));
  const tail = new THREE.Group(); for (let i = N - 5; i < N; i++) tail.add(segs[i].g);
  tail.add(ball(V(0, 0, 0), 0.01, mouthMat));      // (the tip)
  root.add(part('tail', 'tail', tail, categories.tail));

  // ---- bristles: four tiny hooks on the belly of every ring (they follow their ring)
  const bristleG = new THREE.Group(), bristles = [];
  for (let i = 1; i < N - 1; i++) {
    const r = base[i], row = [];
    for (const sg of [-1, 1]) for (const deg of [14, 30, 58, 76]) {   // eight in all: four pairs, two near the belly and two at the sides
      const a = deg * Math.PI / 180, dir = V(0, -Math.cos(a), sg * Math.sin(a)).normalize(), c = cone(V(0, 0, 0), dir, 0.1, 0.012, setaMat, 5);
      bristleG.add(c); row.push({ c, off: V(0, -Math.cos(a) * r * 0.8, sg * Math.sin(a) * r * 0.9), dir });
    }
    bristles.push({ i, row });
  }
  root.add(part('bristles', 'bristles', bristleG, categories.bristles));
  root.userData.rigs = { segs, bristles, base };
  motion(root);   // put every ring in its place straight away (so the camera frames the whole worm)
  return root;
}

export function motion(root) {
  const { segs, bristles, base } = root.userData.rigs;
  const st = { mode: null, walk: 0, fly: 0, cycle: 0, t: 0 };
  const m = {
    canFly: false, state: st, walkLabel: { en: 'Crawl', es: 'Arrastrarse' },
    setMode(mode) { st.mode = st.mode === mode ? null : mode; return st.mode; },
    snap() { st.mode = null; st.walk = st.fly = 0; this.update(0.0001); },
    update(dt) {
      st.walk += ((st.mode === 'walk' ? 1 : 0) - st.walk) * (1 - Math.exp(-dt * 6)); if (st.walk < 0.001) st.walk = 0;
      st.t += dt; st.cycle += dt * 0.5 * (st.walk > 0.02 ? 1 : 0);
      const A = st.walk, ph = st.cycle * Math.PI * 2, ext = [], thick = [];
      for (let i = 0; i < N; i++) { const s = Math.sin((i / WAVE - st.cycle) * Math.PI * 2); ext.push(1 - 0.42 * A * s); thick.push(1 + 0.3 * A * s); }   // waves of squeeze (short and fat) and stretch (long and thin) run down the body
      const L = lay(ext, 0.11 * A + 0.015 * Math.sin(st.t * 0.7), ph * 0.6);
      for (let i = 0; i < N; i++) { const s = segs[i]; s.g.position.set(L.xs[i], 0, L.zs[i]); s.g.rotation.y = -L.phis[i]; s.m.scale.set(ext[i], thick[i], thick[i]); }
      for (const { i, row } of bristles) {
        const sOut = 0.5 + 0.9 * A * Math.max(0, Math.sin((i / WAVE - st.cycle) * Math.PI * 2)), th = thick[i];   // the bristles stick out where the ring is fat and gripping
        for (const b of row) { const o = rotY(b.off.x, b.off.y * th, b.off.z * th, -L.phis[i]); b.c.position.set(L.xs[i] + o.x, o.y, L.zs[i] + o.z); b.c.quaternion.setFromUnitVectors(V(0, 1, 0), rotY(b.dir.x, b.dir.y, b.dir.z, -L.phis[i]).normalize()); b.c.scale.set(1, sOut, 1); }
      }
      return 0.5 * A;
    },
  };
  m.update(0.0001);
  return m;
}
