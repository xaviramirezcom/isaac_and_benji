// Western honey bee (Apis mellifera), worker.
import * as THREE from '../../vendor/three.module.min.js';
import { V, rad, mat, loft, blob, ball, cone, tube, leg, beadAntenna, hairs, wing, part, canvasTex, microBumpTex, facetTex } from './lib.js';

export const info = {
  id: 'bee', icon: '🐝',
  name: { en: 'Honey Bee', es: 'Abeja de la miel' },
  sci: 'Apis mellifera',
  blurb: { en: 'A fuzzy, striped bee that makes honey.', es: 'Una abeja peluda y rayada que hace miel.' },
  cameraDir: V(0.6, 0.45, 0.95).normalize(),
};

export const categories = {
  head:    { en: 'Head', es: 'Cabeza', dEn: 'The head holds the brain, the eyes, the feelers and the tongue.', dEs: 'La cabeza tiene el cerebro, los ojos, las antenas y la lengua.' },
  eyes:    { en: 'Eyes', es: 'Ojos', dEn: 'Two big eyes made of thousands of tiny lenses, plus three small ones on top.', dEs: 'Dos ojos grandes hechos de miles de lentes diminutas, y tres pequeños arriba.' },
  antennae:{ en: 'Antennae', es: 'Antenas', dEn: 'Feelers! Bees smell flowers and taste sweet nectar with them.', dEs: '¡Antenas! Las abejas huelen las flores y prueban el néctar dulce con ellas.' },
  tongue:  { en: 'Tongue', es: 'Lengua', dEn: 'A long tongue like a straw that slurps up sweet nectar.', dEs: 'Una lengua larga como un popote que sorbe el néctar dulce.' },
  thorax:  { en: 'Fuzzy middle', es: 'Tórax peludo', dEn: 'The thorax is the strong middle part. Its muscles move the wings and legs.', dEs: 'El tórax es la parte fuerte del medio. Sus músculos mueven las alas y las patas.' },
  wings:   { en: 'Wings', es: 'Alas', dEn: 'Four see-through wings. A bee flaps them about 230 times every second!', dEs: 'Cuatro alas transparentes. ¡Una abeja las mueve unas 230 veces por segundo!' },
  tummy:   { en: 'Striped tummy', es: 'Abdomen rayado', dEn: 'The tummy makes wax and holds the honey stomach.', dEs: 'El abdomen produce cera y guarda el estómago de la miel.' },
  stinger: { en: 'Stinger', es: 'Aguijón', dEn: 'Worker bees use their stinger only to protect the hive.', dEs: 'Las abejas obreras usan su aguijón solo para proteger la colmena.' },
  legs:    { en: 'Legs', es: 'Patas', dEn: 'Six hairy legs. The back ones carry pollen in little baskets!', dEs: 'Seis patas peludas. ¡Las de atrás cargan polen en cestitas!' },
};

function bandTex() {
  return canvasTex(1024, 128, (x, w, h) => {
    // u=0 is the tail tip, u=1 the front. Alternating amber / dark brown segment bands.
    const amber = '#e2a41c', dark = '#2a1809';
    x.fillStyle = amber; x.fillRect(0, 0, w, h);
    const seg = [[0, 0.17], [0.17, 0.34], [0.34, 0.5], [0.5, 0.66], [0.66, 0.82], [0.82, 1]]; // 6 segments from the tip
    seg.forEach(([a, b], i) => {
      const dk = i <= 1; // last two are dark
      if (dk) { x.fillStyle = dark; x.fillRect(a * w, 0, (b - a) * w, h); }
      else { const g = x.createLinearGradient(a * w, 0, b * w, 0); g.addColorStop(0, dark); g.addColorStop(0.36, 'rgba(42,24,9,0)'); g.addColorStop(1, 'rgba(42,24,9,0)'); x.fillStyle = g; x.fillRect(a * w, 0, (b - a) * w, h); }
      x.fillStyle = 'rgba(0,0,0,.35)'; x.fillRect(b * w - 3, 0, 3, h);
    });
    const id = x.getImageData(0, 0, w, h), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 14; d[i] += n; d[i + 1] += n; d[i + 2] += n; } x.putImageData(id, 0, 0);
  });
}

export function build() {
  const root = new THREE.Group();
  const G = -1.15; root.userData.groundY = G - 0.02;

  const darkFur = mat(0x1d1710, { roughness: 0.8, bumpMap: microBumpTex(3, 70), bumpScale: 1.2 });
  const thoraxBase = mat(0x4c3014, { roughness: 0.85, bumpMap: microBumpTex(4, 70), bumpScale: 1.0 });
  const abdomen = mat(0xffffff, { roughness: 0.5, clearcoat: 0.35, map: bandTex(), bumpMap: microBumpTex(6, 50), bumpScale: 0.6 });
  const eyeMat = mat(0x24150f, { roughness: 0.14, clearcoat: 1, bumpMap: facetTex(), bumpScale: 1.1 });
  const legMat = mat(0x2b1b0c, { roughness: 0.55, clearcoat: 0.3, bumpMap: microBumpTex(9, 60), bumpScale: 0.6 });
  const spineMat = mat(0x1a1006, { roughness: 0.6 });
  const amber = mat(0xb8741c, { roughness: 0.45, clearcoat: 0.4 });

  // ---- head
  const head = new THREE.Group();
  const hm = loft({ x0: 1.45, x1: 2.08, w: [[1.45, 0], [1.52, 0.4], [1.7, 0.53], [1.92, 0.46], [2.04, 0.22], [2.08, 0]], top: [[1.45, 0], [1.52, 0.36], [1.7, 0.52], [1.92, 0.44], [2.04, 0.22], [2.08, 0]], bot: [[1.45, 0], [1.55, 0.35], [1.8, 0.46], [2.0, 0.28], [2.08, 0]], yc: 0.02, n: 2.1, material: darkFur });
  head.add(hm);
  head.add(hairs([hm], { count: 1500, length: 0.09, radius: 0.007, color: 0x8f7d5e, light: 0.4, back: 0.2, seed: 21 }));
  root.add(part('head', 'head', head, { en: 'Head', es: 'Cabeza', dEn: 'The head holds the brain and the senses.', dEs: 'La cabeza guarda el cerebro y los sentidos.' }));

  const eyes = new THREE.Group();
  for (const s of [-1, 1]) { const e = blob(0.24, 0.4, 0.2, eyeMat, null, [56, 36]); e.position.set(1.74, 0.1, s * 0.42); e.rotation.set(0, s * 0.25, s * -0.15); eyes.add(e); }
  for (const [x, y, z] of [[1.82, 0.5, 0], [1.74, 0.46, 0.16], [1.74, 0.46, -0.16]]) eyes.add(ball(V(x, y, z), 0.06, mat(0xc88a1c, { roughness: 0.15, clearcoat: 1 })));
  root.add(part('eyes', 'eyes', eyes, { en: 'Eyes', es: 'Ojos', dEn: 'Two big eyes made of thousands of tiny lenses, plus three small ones on top.', dEs: 'Dos ojos grandes de miles de lentes diminutas, y tres pequeños arriba.' }));

  for (const s of [-1, 1]) {
    const a = beadAntenna({ pts: [V(2.0, 0.2, s * 0.1), V(2.3, 0.62, s * 0.22), V(2.62, 0.55, s * 0.34), V(2.95, 0.22, s * 0.46)], beads: 10, r0: 0.04, r1: 0.032, material: mat(0x2a1b0e, { roughness: 0.5 }), scapeEnd: 0.4 });
    root.add(part(`antenna-${s < 0 ? 'left' : 'right'}`, 'antennae', a, { en: `${s < 0 ? 'Left' : 'Right'} antenna`, es: `Antena ${s < 0 ? 'izquierda' : 'derecha'}`, dEn: 'A bent feeler with ten little bumps for smelling.', dEs: 'Una antena doblada con diez bultitos para oler.' }));
  }

  const tongue = new THREE.Group();
  tongue.add(tube([V(2.02, -0.2, 0), V(2.28, -0.36, 0), V(2.62, -0.52, 0)], (t) => 0.06 - 0.03 * t, amber, { segs: 14, radial: 10 }));
  tongue.add(ball(V(2.66, -0.54, 0), 0.04, mat(0xd89a3a, { roughness: 0.7 }), 1.8, 1, 1));
  for (const s of [-1, 1]) { const m = blob(0.16, 0.05, 0.08, mat(0x24150a, { roughness: 0.45 })); m.position.set(2.08, -0.16, s * 0.12); m.rotation.y = s * 0.3; tongue.add(m); }
  root.add(part('tongue', 'tongue', tongue, { en: 'Tongue', es: 'Lengua', dEn: 'A long tongue like a straw that slurps up sweet nectar.', dEs: 'Una lengua larga como un popote que sorbe el néctar dulce.' }));

  // ---- fuzzy thorax
  const thorax = new THREE.Group();
  const tm = loft({ x0: 0.5, x1: 1.5, w: [[0.5, 0], [0.58, 0.55], [0.85, 0.74], [1.15, 0.74], [1.38, 0.52], [1.5, 0]], top: [[0.5, 0], [0.58, 0.5], [0.85, 0.74], [1.15, 0.72], [1.38, 0.5], [1.5, 0]], bot: 0.55, yc: 0.06, n: 2.1, material: thoraxBase });
  thorax.add(tm);
  thorax.add(hairs([tm], { count: 9000, length: 0.17, radius: 0.0085, color: 0xbf8a36, light: 0.4, back: 0.85, spread: 0.45, seed: 31, lenVar: 0.55 }));
  root.add(part('thorax', 'thorax', thorax, { en: 'Fuzzy middle (thorax)', es: 'Tórax peludo', dEn: 'The thorax is the strong middle. Its muscles move the wings and legs.', dEs: 'El tórax es el centro fuerte. Sus músculos mueven las alas y las patas.' }));

  // ---- striped tummy + stinger
  const tummy = new THREE.Group();
  const am = loft({ x0: -2.0, x1: 0.62, w: [[-2.0, 0], [-1.88, 0.2], [-1.55, 0.46], [-1.0, 0.64], [-0.4, 0.7], [0.15, 0.62], [0.5, 0.36], [0.62, 0]], top: [[-2.0, 0], [-1.88, 0.18], [-1.55, 0.42], [-1.0, 0.6], [-0.4, 0.66], [0.15, 0.58], [0.5, 0.34], [0.62, 0]], bot: [[-2.0, 0], [-1.55, 0.4], [-1.0, 0.58], [-0.4, 0.62], [0.15, 0.54], [0.62, 0]], yc: -0.02, n: 2.15, mod: (x) => 1 + 0.018 * Math.pow(Math.abs(Math.sin(((x + 2.0) / 2.62) * Math.PI * 6)), 0.6), material: abdomen });
  tummy.add(am);
  tummy.add(hairs([am], { count: 2300, length: 0.075, radius: 0.0055, color: 0xb8924c, light: 0.5, back: 0.9, seed: 41, region: (x) => x > -1.7 }));
  root.add(part('tummy', 'tummy', tummy, { en: 'Striped tummy', es: 'Abdomen rayado', dEn: 'The tummy makes wax and holds the honey stomach.', dEs: 'El abdomen produce cera y guarda el estómago de la miel.' }));
  const sting = new THREE.Group();
  sting.add(cone(V(-1.98, -0.04, 0), V(-1, -0.12, 0), 0.38, 0.05, mat(0x2a1a0c, { roughness: 0.35, clearcoat: 0.6 }), 10));
  root.add(part('stinger', 'stinger', sting, { en: 'Stinger', es: 'Aguijón', dEn: 'Worker bees use their stinger only to protect the hive.', dEs: 'Las abejas obreras usan su aguijón solo para proteger la colmena.' }));

  // ---- wings (4): big forewings, small hindwings
  const wingDefs = [
    { n: 'forewing', len: 2.3, wid: 0.78, hinge: V(1.08, 0.76, 0.3), yaw: 14, roll: 30, seed: 2, en: 'Front wing', es: 'Ala delantera' },
    { n: 'hindwing', len: 1.55, wid: 0.5, hinge: V(0.92, 0.7, 0.32), yaw: 20, roll: 24, seed: 5, en: 'Back wing', es: 'Ala trasera' },
  ];
  for (const d of wingDefs) for (const s of [-1, 1]) {
    const w = wing({ length: d.len, width: d.wid, lateral: 0.38, veins: 7, tint: '#dfe8ef', alpha: 0.62, veinColor: 'rgba(45,32,20,.85)', curve: 0.045, seed: d.seed + (s > 0 ? 1 : 0) });
    if (s < 0) w.scale.z = -1;
    const g = new THREE.Group(); g.add(w);
    g.position.set(d.hinge.x, d.hinge.y, d.hinge.z * s);
    g.rotation.order = 'YXZ'; g.rotation.set(rad(d.roll) * s, Math.PI + rad(d.yaw) * s * 1, 0);
    root.add(part(`${d.n}-${s < 0 ? 'left' : 'right'}`, 'wings', g, { en: `${s < 0 ? 'Left' : 'Right'} ${d.en.toLowerCase()}`, es: `${d.es} ${s < 0 ? 'izquierda' : 'derecha'}`, dEn: 'A thin wing with tiny veins. Front and back wings hook together to fly!', dEs: 'Un ala delgada con venitas. ¡Las alas de adelante y atrás se enganchan para volar!' }));
  }

  // ---- legs (hind legs carry pollen baskets)
  const spec = [
    { n: 'front', hip: V(1.38, -0.42, 0.26), foot: V(2.05, G, 0.9), td: V(0.4, -0.7, 0.5), fem: 0.62, tib: 0.62, tar: 0.5, rf: 0.07, rt: 0.045 },
    { n: 'middle', hip: V(0.98, -0.5, 0.3), foot: V(1.15, G, 1.25), td: V(0.2, -0.7, 0.7), fem: 0.7, tib: 0.72, tar: 0.52, rf: 0.075, rt: 0.045 },
    { n: 'hind', hip: V(0.62, -0.5, 0.3), foot: V(-0.15, G, 1.2), td: V(-0.4, -0.7, 0.6), fem: 0.74, tib: 0.86, tar: 0.55, rf: 0.08, rt: 0.06, basket: true },
  ];
  for (const sp of spec) for (const s of [-1, 1]) {
    const f = (v) => V(v.x, v.y, v.z * s);
    const L = leg({ hip: f(sp.hip), foot: f(sp.foot), tarsusDir: f(sp.td), tarsusLen: sp.tar, pole: V(0, 0.6, 1.0 * s), femur: sp.fem, tibia: sp.tib, rFem: sp.rf, rTib: sp.rt, rTar: 0.028, material: legMat, spineMat, spines: 2, spurs: 2, tarsi: 4 });
    if (sp.basket) { // pollen basket on the hind shin: a shiny hollow plate edged with hairs, holding a ball of pollen
      const K = L.userData.knee, A = f(sp.foot).clone().addScaledVector(f(sp.td).normalize(), -sp.tar), mid = K.clone().lerp(A, 0.5), dir = A.clone().sub(K).normalize();
      const plate = blob(0.46, 0.05, 0.17, mat(0x3a2a14, { roughness: 0.25, clearcoat: 0.8 })); plate.position.copy(mid).addScaledVector(V(0, 0, s), 0.04); plate.quaternion.setFromUnitVectors(V(1, 0, 0), dir); L.add(plate);
      const pollen = blob(0.2, 0.17, 0.17, mat(0xf3b323, { roughness: 0.9, bumpMap: microBumpTex(13, 120), bumpScale: 2 }), (v) => v.multiplyScalar(1 + 0.05 * Math.sin(v.x * 18) * Math.cos(v.y * 14))); pollen.position.copy(mid).addScaledVector(V(0, 0, s), 0.18).addScaledVector(V(0, 0.05, 0), 1); L.add(pollen);
      const bt = blob(0.17, 0.045, 0.11, legMat); bt.position.copy(A).addScaledVector(dir, 0.14); bt.quaternion.setFromUnitVectors(V(1, 0, 0), dir); L.add(bt);
    }
    const meshes = []; L.traverse((o) => { if (o.isMesh && o.geometry.type !== 'ConeGeometry') meshes.push(o); });
    L.add(hairs(meshes.slice(0, 6), { count: 110, length: 0.09, radius: 0.005, color: 0x6a4a22, light: 0.3, back: 0.3, seed: 51 + sp.n.length + s }));
    const side = s < 0 ? 'left' : 'right';
    root.add(part(`leg-${sp.n}-${side}`, 'legs', L, { en: `${sp.n[0].toUpperCase() + sp.n.slice(1)} ${side} leg`, es: `Pata ${{ front: 'delantera', middle: 'del medio', hind: 'trasera' }[sp.n]} ${s < 0 ? 'izquierda' : 'derecha'}`,
      dEn: sp.basket ? 'A hind leg with a pollen basket full of yellow pollen!' : 'A hairy walking leg. The front legs clean the antennae.', dEs: sp.basket ? '¡Una pata trasera con una cestita llena de polen amarillo!' : 'Una pata peluda para caminar. Las de adelante limpian las antenas.' }));
  }
  return root;
}
