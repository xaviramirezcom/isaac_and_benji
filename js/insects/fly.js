// Housefly (Musca domestica).
import * as THREE from '../../vendor/three.module.min.js';
import { V, rad, mat, loft, blob, ball, tube, cone, leg, hairs, wing, part, canvasTex, microBumpTex, facetTex } from './lib.js';

export const info = {
  id: 'fly', icon: '🪰',
  name: { en: 'Housefly', es: 'Mosca doméstica' },
  sci: 'Musca domestica',
  blurb: { en: 'A fast flyer with two wings and big red eyes.', es: 'Una voladora rápida con dos alas y grandes ojos rojos.' },
  cameraDir: V(0.55, 0.5, 0.95).normalize(),
};

export const categories = {
  head:     { en: 'Head', es: 'Cabeza', dEn: 'The head holds the eyes, the feelers and the mouth.', dEs: 'La cabeza tiene los ojos, las antenas y la boca.' },
  eyes:     { en: 'Eyes', es: 'Ojos', dEn: 'Huge eyes made of thousands of tiny lenses. A fly sees almost all around!', dEs: 'Ojos enormes hechos de miles de lentes diminutas. ¡La mosca ve casi todo alrededor!' },
  antennae: { en: 'Antennae', es: 'Antenas', dEn: 'Tiny feelers with a hair on each one, to smell food from far away.', dEs: 'Antenas diminutas con un pelito cada una, para oler la comida desde lejos.' },
  mouth:    { en: 'Mouth', es: 'Boca', dEn: 'A soft sponge-like mouth. Flies lick their food like a sponge!', dEs: 'Una boca blandita como esponja. ¡Las moscas lamen su comida como una esponja!' },
  thorax:   { en: 'Striped middle', es: 'Tórax rayado', dEn: 'The strong middle with four dark stripes. Wings and legs are attached here.', dEs: 'El centro fuerte con cuatro rayas oscuras. Aquí se unen las alas y las patas.' },
  wings:    { en: 'Wings', es: 'Alas', dEn: 'Only two wings! Flies are super fast and can hover and turn in a snap.', dEs: '¡Solo dos alas! Las moscas son rapidísimas y giran en un instante.' },
  halteres: { en: 'Balance knobs', es: 'Balancines', dEn: 'Tiny knobs behind the wings. They work like a gyroscope to keep the fly steady.', dEs: 'Bolitas diminutas detrás de las alas. Funcionan como un giroscopio para mantener a la mosca estable.' },
  tummy:    { en: 'Tummy', es: 'Abdomen', dEn: 'The tummy is covered with stiff hairs called bristles.', dEs: 'El abdomen está cubierto de pelos rígidos llamados cerdas.' },
  legs:     { en: 'Legs', es: 'Patas', dEn: 'Six hairy legs with sticky pads, so a fly can walk on the ceiling!', dEs: '¡Seis patas peludas con almohadillas pegajosas para caminar por el techo!' },
};

function thoraxTex() {
  return canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = '#4a4946'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#100f0e'; for (const v of [0.1, 0.19, 0.31, 0.4]) { x.fillRect(0, v * h - 11, w * 0.97, 22); }
    const id = x.getImageData(0, 0, w, h), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 22; d[i] += n; d[i + 1] += n; d[i + 2] += n; } x.putImageData(id, 0, 0);
  });
}
function abdomenTex() {
  return canvasTex(1024, 256, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#46422f'); g.addColorStop(0.25, '#6a604a'); g.addColorStop(0.5, '#46422f'); g.addColorStop(1, '#2c2a22'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(14,12,10,.9)'; x.fillRect(0, h * 0.24, w, 12);                                    // dark midline
    for (let i = 0; i < 5; i++) { const u = (i + 0.7) / 5.4 * w; const gr = x.createLinearGradient(u - 50, 0, u + 20, 0); gr.addColorStop(0, 'rgba(25,22,18,0)'); gr.addColorStop(1, 'rgba(25,22,18,.75)'); x.fillStyle = gr; x.fillRect(u - 50, 0, 70, h); }
    const id = x.getImageData(0, 0, w, h), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 16; d[i] += n; d[i + 1] += n; d[i + 2] += n; } x.putImageData(id, 0, 0);
  });
}

export function build() {
  const root = new THREE.Group();
  const G = -0.95; root.userData.groundY = G - 0.02;
  const body = (map) => mat(0xffffff, { roughness: 0.55, clearcoat: 0.25, map, bumpMap: microBumpTex(41, 70), bumpScale: 0.9 });
  const faceMat = mat(0x5a4c26, { roughness: 0.6, bumpMap: microBumpTex(42, 60), bumpScale: 0.8 });
  const eyeMat = mat(0xa81414, { roughness: 0.1, clearcoat: 1, bumpMap: facetTex(), bumpScale: 1.2 });
  const legMat = mat(0x151210, { roughness: 0.5, clearcoat: 0.3 }), spineMat = mat(0x0a0807, { roughness: 0.6 });
  const bristle = { color: 0x080706, light: 0.03, spread: 0.2 };

  // ---- head
  const head = new THREE.Group();
  const hm = loft({ x0: 1.05, x1: 1.68, w: [[1.05, 0], [1.12, 0.36], [1.3, 0.5], [1.5, 0.44], [1.64, 0.2], [1.68, 0]], top: [[1.05, 0], [1.12, 0.32], [1.3, 0.46], [1.5, 0.4], [1.64, 0.2], [1.68, 0]], bot: [[1.05, 0], [1.2, 0.34], [1.5, 0.36], [1.68, 0]], yc: 0.0, n: 2.1, material: faceMat });
  head.add(hm);
  root.add(part('head', 'head', head, { en: 'Head', es: 'Cabeza', dEn: 'The head holds the eyes, the feelers and the mouth.', dEs: 'La cabeza tiene los ojos, las antenas y la boca.' }));
  const eyes = new THREE.Group();
  for (const s of [-1, 1]) { const e = blob(0.3, 0.42, 0.26, eyeMat, null, [56, 36]); e.position.set(1.34, 0.08, s * 0.4); e.rotation.set(0, s * 0.3, 0); eyes.add(e); }
  root.add(part('eyes', 'eyes', eyes, { en: 'Eyes', es: 'Ojos', dEn: 'Huge eyes made of thousands of tiny lenses.', dEs: 'Ojos enormes hechos de miles de lentes diminutas.' }));
  for (const s of [-1, 1]) {
    const a = new THREE.Group();
    { const seg = blob(0.07, 0.15, 0.04, mat(0x4a3a1a, { roughness: 0.5 }), null, [16, 12]); seg.position.set(1.66, 0.22, s * 0.1); a.add(seg); }
    a.add(tube([V(1.66, 0.3, s * 0.1), V(1.78, 0.34, s * 0.12), V(1.9, 0.26, s * 0.14)], () => 0.009, legMat, { segs: 10, radial: 5 }));
    root.add(part(`antenna-${s < 0 ? 'left' : 'right'}`, 'antennae', a, { en: `${s < 0 ? 'Left' : 'Right'} antenna`, es: `Antena ${s < 0 ? 'izquierda' : 'derecha'}`, dEn: 'A tiny feeler with a hair on it, for smelling.', dEs: 'Una antenita con un pelito para oler.' }));
  }
  const mouth = new THREE.Group();
  mouth.add(tube([V(1.55, -0.2, 0), V(1.72, -0.34, 0), V(1.86, -0.5, 0)], (t) => 0.07 - 0.03 * t, mat(0x7a6030, { roughness: 0.5 }), { segs: 12, radial: 10 }));
  for (const s of [-1, 1]) { const l = blob(0.1, 0.035, 0.07, mat(0xcdbd9a, { roughness: 0.7, bumpMap: microBumpTex(43, 80), bumpScale: 1 }), null, [20, 12]); l.position.set(1.9, -0.53, s * 0.06); l.rotation.set(0, 0, -0.5); mouth.add(l); }
  root.add(part('mouth', 'mouth', mouth, { en: 'Mouth', es: 'Boca', dEn: 'A soft sponge-like mouth for licking food.', dEs: 'Una boca blandita como esponja para lamer la comida.' }));

  // ---- striped thorax
  const thorax = new THREE.Group();
  const tm = loft({ x0: 0.0, x1: 1.12, w: [[0.0, 0], [0.08, 0.42], [0.4, 0.58], [0.8, 0.58], [1.05, 0.4], [1.12, 0]], top: [[0.0, 0], [0.08, 0.4], [0.4, 0.62], [0.8, 0.6], [1.05, 0.38], [1.12, 0]], bot: 0.42, yc: 0.05, n: 2.2, material: body(thoraxTex()) });
  thorax.add(tm); thorax.add(hairs([tm], { count: 700, length: 0.11, radius: 0.0065, back: 0.7, seed: 71, ...bristle }));
  root.add(part('thorax', 'thorax', thorax, { en: 'Striped middle', es: 'Tórax rayado', dEn: 'The strong middle with four dark stripes.', dEs: 'El centro fuerte con cuatro rayas oscuras.' }));

  // ---- tummy
  const tummy = new THREE.Group();
  const am = loft({ x0: -1.35, x1: 0.05, w: [[-1.35, 0], [-1.25, 0.26], [-0.9, 0.5], [-0.4, 0.55], [-0.05, 0.4], [0.05, 0]], top: [[-1.35, 0], [-1.25, 0.24], [-0.9, 0.46], [-0.4, 0.5], [-0.05, 0.36], [0.05, 0]], bot: [[-1.35, 0], [-0.9, 0.38], [-0.4, 0.44], [0.05, 0]], yc: 0.0, n: 2.2, material: body(abdomenTex()) });
  tummy.add(am); tummy.add(hairs([am], { count: 650, length: 0.1, radius: 0.0065, back: 0.9, seed: 72, ...bristle }));
  root.add(part('tummy', 'tummy', tummy, { en: 'Tummy', es: 'Abdomen', dEn: 'The tummy is covered with stiff hairs called bristles.', dEs: 'El abdomen está cubierto de pelos rígidos llamados cerdas.' }));

  // ---- two clear wings
  for (const s of [-1, 1]) {
    const w = wing({ length: 2.05, width: 0.78, lateral: 0.4, veins: 6, tint: '#e4eaee', alpha: 0.5, veinColor: 'rgba(40,32,24,.85)', curve: 0.04, seed: 9 + (s > 0 ? 1 : 0) });
    if (s < 0) w.scale.z = -1;
    const g = new THREE.Group(); g.add(w); g.position.set(0.9, 0.66, 0.22 * s); g.rotation.order = 'YXZ'; g.rotation.set(rad(26) * s, Math.PI + rad(16) * s, 0);
    root.add(part(`wing-${s < 0 ? 'left' : 'right'}`, 'wings', g, { en: `${s < 0 ? 'Left' : 'Right'} wing`, es: `Ala ${s < 0 ? 'izquierda' : 'derecha'}`, dEn: 'One of only two wings. A fly flaps it about 200 times a second.', dEs: 'Una de solo dos alas. Una mosca la mueve unas 200 veces por segundo.' }));
  }
  for (const s of [-1, 1]) {
    const h = new THREE.Group();
    h.add(tube([V(0.12, 0.3, 0.3 * s), V(0.04, 0.2, 0.36 * s), V(-0.03, 0.16, 0.4 * s)], () => 0.016, legMat, { segs: 8, radial: 6 }));
    h.add(ball(V(-0.06, 0.15, 0.42 * s), 0.045, mat(0xd8d2b8, { roughness: 0.5 })));
    root.add(part(`haltere-${s < 0 ? 'left' : 'right'}`, 'halteres', h, { en: `${s < 0 ? 'Left' : 'Right'} balance knob`, es: `Balancín ${s < 0 ? 'izquierdo' : 'derecho'}`, dEn: 'A tiny knob that helps the fly keep its balance in the air.', dEs: 'Una bolita que ayuda a la mosca a mantener el equilibrio en el aire.' }));
  }

  // ---- legs
  const spec = [
    { n: 'front', hip: V(0.95, -0.35, 0.22), foot: V(1.85, G, 0.85), td: V(0.5, -0.7, 0.5), fem: 0.62, tib: 0.7 },
    { n: 'middle', hip: V(0.5, -0.4, 0.28), foot: V(0.55, G, 1.45), td: V(0.2, -0.7, 0.7), fem: 0.75, tib: 0.8 },
    { n: 'hind', hip: V(0.1, -0.4, 0.28), foot: V(-0.7, G, 1.3), td: V(-0.4, -0.7, 0.6), fem: 0.75, tib: 0.85 },
  ];
  for (const sp of spec) for (const s of [-1, 1]) {
    const f = (v) => V(v.x, v.y, v.z * s);
    const L = leg({ hip: f(sp.hip), foot: f(sp.foot), tarsusDir: f(sp.td), tarsusLen: 0.42, pole: V(0, 0.6, 1.0 * s), femur: sp.fem, tibia: sp.tib, rFem: 0.055, rTib: 0.036, rTar: 0.024, material: legMat, spineMat, spines: 4, spurs: 1, tarsi: 4, femurBulge: 0.01 });
    const side = s < 0 ? 'left' : 'right';
    root.add(part(`leg-${sp.n}-${side}`, 'legs', L, { en: `${sp.n[0].toUpperCase() + sp.n.slice(1)} ${side} leg`, es: `Pata ${{ front: 'delantera', middle: 'del medio', hind: 'trasera' }[sp.n]} ${s < 0 ? 'izquierda' : 'derecha'}`, dEn: 'A hairy leg with sticky pads. Flies taste with their feet!', dEs: 'Una pata peluda con almohadillas pegajosas. ¡Las moscas prueban con los pies!' }));
  }
  return root;
}
