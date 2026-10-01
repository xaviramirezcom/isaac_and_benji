// Carpenter ant (Camponotus), worker: black head and tummy, red-brown middle.
import * as THREE from '../../vendor/three.module.min.js';
import { V, rad, mat, loft, blob, ball, cone, tube, leg, beadAntenna, hairs, part, microBumpTex, facetTex } from './lib.js';

export const info = {
  id: 'ant', icon: '🐜',
  name: { en: 'Carpenter Ant', es: 'Hormiga carpintera' },
  sci: 'Camponotus',
  blurb: { en: 'A strong ant that digs tunnels in wood.', es: 'Una hormiga fuerte que cava túneles en la madera.' },
  cameraDir: V(0.65, 0.5, 0.9).normalize(),
};

export const categories = {
  head:     { en: 'Head', es: 'Cabeza', dEn: 'The head has the brain, the eyes, the feelers and the strong jaws.', dEs: 'La cabeza tiene el cerebro, los ojos, las antenas y las mandíbulas fuertes.' },
  eyes:     { en: 'Eyes', es: 'Ojos', dEn: 'Small eyes that see light and movement.', dEs: 'Ojos pequeños que ven la luz y el movimiento.' },
  antennae: { en: 'Antennae', es: 'Antenas', dEn: 'Bent feelers. Ants smell, taste and touch the world with them.', dEs: 'Antenas dobladas. Las hormigas huelen, prueban y tocan el mundo con ellas.' },
  jaws:     { en: 'Jaws', es: 'Mandíbulas', dEn: 'Strong jaws called mandibles. Ants dig, carry and chew with them.', dEs: 'Mandíbulas fuertes. Las hormigas cavan, cargan y muerden con ellas.' },
  thorax:   { en: 'Middle', es: 'Tórax', dEn: 'The middle part, called the thorax. All six legs are attached here.', dEs: 'La parte del medio, llamada tórax. Aquí se unen las seis patas.' },
  waist:    { en: 'Waist', es: 'Cintura', dEn: 'A thin waist that lets the ant bend its tummy in any direction.', dEs: 'Una cintura delgada que deja a la hormiga doblar su barriga hacia donde quiera.' },
  tummy:    { en: 'Tummy', es: 'Barriga', dEn: 'The tummy holds food. Ants can share it with friends mouth to mouth!', dEs: 'La barriga guarda comida. ¡Las hormigas la comparten con sus amigas de boca a boca!' },
  legs:     { en: 'Legs', es: 'Patas', dEn: 'Six strong legs with tiny claws. Ants run fast and climb anywhere!', dEs: 'Seis patas fuertes con garritas. ¡Las hormigas corren rápido y suben a todas partes!' },
};

export function build() {
  const root = new THREE.Group();
  const G = -1.05; root.userData.groundY = G - 0.02;
  const black = mat(0x16110f, { roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.15, bumpMap: microBumpTex(21, 80), bumpScale: 0.7 });
  const red = mat(0x8a2f12, { roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.15, bumpMap: microBumpTex(22, 80), bumpScale: 0.7 });
  const legMat = mat(0x5a2210, { roughness: 0.38, clearcoat: 0.6 }), spineMat = mat(0x2a1208, { roughness: 0.5 });
  const eyeMat = mat(0x0c0807, { roughness: 0.12, clearcoat: 1, bumpMap: facetTex(), bumpScale: 0.9 });
  const jawMat = mat(0x3a1a0c, { roughness: 0.3, clearcoat: 0.9 });

  // ---- head (heart shaped from above)
  const head = new THREE.Group();
  const hm = loft({ x0: 1.38, x1: 2.28, w: [[1.38, 0], [1.44, 0.42], [1.6, 0.64], [1.85, 0.62], [2.1, 0.46], [2.22, 0.26], [2.28, 0]], top: [[1.38, 0], [1.44, 0.3], [1.65, 0.5], [1.9, 0.5], [2.15, 0.36], [2.28, 0]], bot: [[1.38, 0], [1.5, 0.34], [1.9, 0.42], [2.28, 0]], yc: 0.08, n: 2.2, material: black });
  head.add(hm);
  head.add(hairs([hm], { count: 260, length: 0.09, radius: 0.005, color: 0x3a2e28, light: 0.2, back: 0.2, seed: 61 }));
  root.add(part('head', 'head', head, { en: 'Head', es: 'Cabeza', dEn: 'A big head with a strong brain and strong muscles for the jaws.', dEs: 'Una cabeza grande con cerebro y músculos fuertes para las mandíbulas.' }));

  const eyes = new THREE.Group();
  for (const s of [-1, 1]) { const e = blob(0.13, 0.17, 0.1, eyeMat, null, [40, 28]); e.position.set(1.92, 0.2, s * 0.56); e.rotation.y = s * 0.5; eyes.add(e); }
  root.add(part('eyes', 'eyes', eyes, { en: 'Eyes', es: 'Ojos', dEn: 'Small eyes that see light and movement.', dEs: 'Ojos pequeños que ven la luz y el movimiento.' }));

  const jaws = new THREE.Group();
  for (const s of [-1, 1]) {
    jaws.add(tube([V(2.22, -0.12, s * 0.3), V(2.5, -0.14, s * 0.34), V(2.7, -0.1, s * 0.16)], (t) => 0.12 - 0.095 * t, jawMat, { segs: 16, radial: 10 }));
    for (let i = 0; i < 4; i++) jaws.add(cone(V(2.5 + i * 0.065, -0.1, s * (0.3 - i * 0.045)), V(0.25, 0.1, -s * 0.9), 0.07, 0.022, jawMat, 5));
  }
  root.add(part('jaws', 'jaws', jaws, { en: 'Jaws', es: 'Mandíbulas', dEn: 'Strong jaws called mandibles. Ants dig, carry and chew with them.', dEs: 'Mandíbulas fuertes. Las hormigas cavan, cargan y muerden con ellas.' }));

  for (const s of [-1, 1]) {
    const a = beadAntenna({ pts: [V(2.18, 0.12, s * 0.2), V(2.62, 0.55, s * 0.4), V(2.98, 0.42, s * 0.55), V(3.28, 0.12, s * 0.7)], beads: 11, r0: 0.045, r1: 0.04, material: mat(0x5a2210, { roughness: 0.45, clearcoat: 0.4 }), scapeEnd: 0.4 });
    root.add(part(`antenna-${s < 0 ? 'left' : 'right'}`, 'antennae', a, { en: `${s < 0 ? 'Left' : 'Right'} antenna`, es: `Antena ${s < 0 ? 'izquierda' : 'derecha'}`, dEn: 'A bent feeler with many little parts for smelling and touching.', dEs: 'Una antena doblada con muchas partecitas para oler y tocar.' }));
  }

  // ---- middle (thorax)
  const thorax = new THREE.Group();
  const tm = loft({ x0: -0.2, x1: 1.4, w: [[-0.2, 0], [-0.15, 0.18], [0.0, 0.3], [0.2, 0.3], [0.32, 0.22], [0.5, 0.24], [0.75, 0.26], [0.86, 0.28], [0.95, 0.4], [1.1, 0.46], [1.3, 0.4], [1.4, 0]],
    top: [[-0.2, 0], [-0.15, 0.3], [0.0, 0.46], [0.2, 0.46], [0.32, 0.3], [0.45, 0.32], [0.7, 0.33], [0.84, 0.3], [0.92, 0.46], [1.1, 0.58], [1.3, 0.5], [1.4, 0]], bot: 0.26, yc: 0.14, n: 2.3, segX: 160, material: red });
  thorax.add(tm);
  thorax.add(hairs([tm], { count: 220, length: 0.08, radius: 0.005, color: 0x3a2418, light: 0.2, back: 0.5, seed: 62 }));
  root.add(part('thorax', 'thorax', thorax, { en: 'Middle (thorax)', es: 'Tórax', dEn: 'The middle part. All six legs are attached here.', dEs: 'La parte del medio. Aquí se unen las seis patas.' }));

  // ---- waist (petiole)
  const waist = new THREE.Group();
  waist.add(loft({ x0: -0.58, x1: -0.16, w: [[-0.58, 0], [-0.5, 0.1], [-0.38, 0.14], [-0.26, 0.11], [-0.16, 0]], top: [[-0.58, 0], [-0.5, 0.22], [-0.38, 0.34], [-0.26, 0.26], [-0.16, 0]], bot: 0.1, yc: 0.2, n: 2.2, material: black }));
  root.add(part('waist', 'waist', waist, { en: 'Waist', es: 'Cintura', dEn: 'A thin waist that lets the ant bend its tummy any way.', dEs: 'Una cintura delgada que deja a la hormiga doblar su barriga hacia donde quiera.' }));

  // ---- tummy (gaster)
  const tummy = new THREE.Group();
  const tg = loft({ x0: -2.2, x1: -0.5, w: [[-2.2, 0], [-2.1, 0.3], [-1.8, 0.62], [-1.3, 0.78], [-0.9, 0.66], [-0.6, 0.3], [-0.5, 0]], top: [[-2.2, 0], [-2.1, 0.28], [-1.8, 0.58], [-1.3, 0.72], [-0.9, 0.62], [-0.6, 0.3], [-0.5, 0]], bot: [[-2.2, 0], [-1.8, 0.5], [-1.3, 0.64], [-0.9, 0.52], [-0.5, 0]], yc: 0.14, n: 2.2, mod: (x) => 1 + 0.03 * Math.pow(Math.abs(Math.sin(((x + 2.2) / 1.7) * Math.PI * 4)), 0.5), segX: 120, material: black });
  tummy.add(tg);
  tummy.add(hairs([tg], { count: 500, length: 0.09, radius: 0.005, color: 0x6a5a48, light: 0.4, back: 0.9, seed: 63 }));
  root.add(part('tummy', 'tummy', tummy, { en: 'Tummy', es: 'Barriga', dEn: 'The tummy holds food. Ants share it with friends mouth to mouth!', dEs: 'La barriga guarda comida. ¡Las hormigas la comparten de boca a boca!' }));

  // ---- six long legs
  const spec = [
    { n: 'front', hip: V(1.02, -0.12, 0.2), foot: V(2.0, G, 1.0), td: V(0.5, -0.7, 0.55), fem: 1.0, tib: 1.05 },
    { n: 'middle', hip: V(0.5, -0.14, 0.22), foot: V(0.75, G, 1.75), td: V(0.2, -0.7, 0.8), fem: 1.1, tib: 1.15 },
    { n: 'hind', hip: V(0.02, -0.14, 0.2), foot: V(-0.95, G, 1.45), td: V(-0.5, -0.7, 0.6), fem: 1.1, tib: 1.2 },
  ];
  for (const sp of spec) for (const s of [-1, 1]) {
    const f = (v) => V(v.x, v.y, v.z * s);
    const L = leg({ hip: f(sp.hip), foot: f(sp.foot), tarsusDir: f(sp.td), tarsusLen: 0.7, pole: V(0, 0.7, 1.0 * s), femur: sp.fem, tibia: sp.tib, rFem: 0.075, rTib: 0.05, rTar: 0.03, material: legMat, spineMat, spines: 3, spurs: 1, tarsi: 5, femurBulge: 0.02 });
    const side = s < 0 ? 'left' : 'right';
    root.add(part(`leg-${sp.n}-${side}`, 'legs', L, { en: `${sp.n[0].toUpperCase() + sp.n.slice(1)} ${side} leg`, es: `Pata ${{ front: 'delantera', middle: 'del medio', hind: 'trasera' }[sp.n]} ${s < 0 ? 'izquierda' : 'derecha'}`,
      dEn: 'A long, strong leg with tiny claws for climbing.', dEs: 'Una pata larga y fuerte con garritas para trepar.' }));
  }
  return root;
}
