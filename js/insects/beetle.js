// Paulosawaya whymperi: a glossy chestnut-red scarab (chafer) beetle from the Andes / Amazon region.
import * as THREE from '../../vendor/three.module.min.js';
import { V, rad, mat, loft, blob, ball, cone, leg, beadAntenna, hairs, wing, part, shellColorTex, pitBumpTex, microBumpTex, facetTex } from './lib.js';

export const info = {
  id: 'beetle', icon: '🪲',
  name: { en: 'Whymper’s Chafer Beetle', es: 'Escarabajo de Whymper' },
  sci: 'Paulosawaya whymperi',
  blurb: { en: 'A shiny reddish-brown scarab beetle from the Andes and Amazon.', es: 'Un escarabajo brillante de color café rojizo de los Andes y el Amazonas.' },
  cameraDir: V(0.6, 0.5, 0.9).normalize(),
};

export const categories = {
  head:    { en: 'Head', es: 'Cabeza', dEn: 'The head has the eyes, the feelers and the mouth.', dEs: 'La cabeza tiene los ojos, las antenas y la boca.' },
  eyes:    { en: 'Eyes', es: 'Ojos', dEn: 'Beetle eyes see movement and light, so it can spot danger.', dEs: 'Los ojos del escarabajo ven el movimiento y la luz para notar el peligro.' },
  antennae:{ en: 'Antennae', es: 'Antenas', dEn: 'The feelers end in little fans that smell food and friends.', dEs: 'Las antenas terminan en abanicos que huelen la comida y a otros escarabajos.' },
  shield:  { en: 'Shield', es: 'Escudo', dEn: 'The hard shield behind the head protects the beetle’s middle.', dEs: 'El escudo duro detrás de la cabeza protege el centro del cuerpo del escarabajo.' },
  covers:  { en: 'Wing covers', es: 'Cubre-alas', dEn: 'Hard wing covers called elytra. They protect the thin wings underneath.', dEs: 'Cubre-alas duros llamados élitros. Protegen las alas delgadas de abajo.' },
  wings:   { en: 'Flying wings', es: 'Alas para volar', dEn: 'Thin wings hidden under the covers. The beetle unfolds them to fly!', dEs: 'Alas delgadas escondidas bajo los cubre-alas. ¡El escarabajo las abre para volar!' },
  tummy:   { en: 'Tummy', es: 'Barriga', dEn: 'The tummy holds the beetle’s food-processing parts and breathing holes.', dEs: 'La barriga guarda los órganos que procesan la comida y los agujeros para respirar.' },
  legs:    { en: 'Legs', es: 'Patas', dEn: 'Six legs! The front ones have teeth for digging into soil.', dEs: '¡Seis patas! Las de adelante tienen dientes para cavar la tierra.' },
};

export function build() {
  const root = new THREE.Group();
  const G = -0.82;
  root.userData.groundY = G - 0.02;

  // ---- materials
  const shellMap = shellColorTex([[0, '#701d0b'], [0.1, '#a83312'], [0.25, '#e8672a'], [0.4, '#b23a15'], [0.5, '#701d0b'], [0.75, '#561609'], [1, '#701d0b']], { speckle: 8, seed: 3 });
  const pits = pitBumpTex({ rows: 9, step: 17, pit: 3.2, seed: 4 });
  const shellBase = { roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08, bumpScale: 1.1 };
  const elytraMat = mat(0xffffff, { ...shellBase, map: shellMap, bumpMap: pits });
  const proMap = shellColorTex([[0, '#74200c'], [0.25, '#df6025'], [0.5, '#74200c'], [0.75, '#561609'], [1, '#74200c']], { speckle: 10, seed: 8 });
  const proMat = mat(0xffffff, { ...shellBase, map: proMap, bumpMap: pitBumpTex({ rows: 22, step: 9, pit: 1.8, groove: 0, seed: 9, base: 140 }), bumpScale: 0.9 });
  const headMat = mat(0x4a140a, { roughness: 0.32, clearcoat: 0.9, bumpMap: microBumpTex(2, 60), bumpScale: 0.6 });
  const clypMat = mat(0x8a3a16, { roughness: 0.3, clearcoat: 0.8, bumpMap: microBumpTex(5, 50), bumpScale: 0.5 });
  const belly = mat(0x6e2c14, { roughness: 0.42, clearcoat: 0.5, bumpMap: microBumpTex(11, 40), bumpScale: 0.5 });
  const legMat = mat(0x74210e, { roughness: 0.38, clearcoat: 0.7, bumpMap: microBumpTex(12, 55), bumpScale: 0.5 });
  const spineMat = mat(0x33100a, { roughness: 0.4 });
  const eyeMat = mat(0x120807, { roughness: 0.12, clearcoat: 1, bumpMap: facetTex(), bumpScale: 0.9 });
  const amber = mat(0xd99a3a, { roughness: 0.4, clearcoat: 0.4 });

  // ---- head
  const head = new THREE.Group();
  head.add(loft({ x0: 1.78, x1: 2.5, w: [[1.78, 0], [1.86, 0.36], [2.0, 0.56], [2.2, 0.57], [2.4, 0.42], [2.5, 0]], top: [[1.78, 0], [1.86, 0.2], [2.0, 0.3], [2.2, 0.3], [2.4, 0.2], [2.5, 0]], bot: 0.2, yc: -0.02, n: 2.3, material: headMat }));
  root.add(part('head', 'head', head, { en: 'Head', es: 'Cabeza', dEn: 'A small, strong head tucked under the shield.', dEs: 'Una cabeza pequeña y fuerte metida bajo el escudo.' }));

  const mouth = new THREE.Group();
  mouth.add(loft({ x0: 2.22, x1: 2.62, w: [[2.22, 0.4], [2.32, 0.5], [2.5, 0.46], [2.62, 0.12]], top: [[2.2, 0.1], [2.4, 0.1], [2.56, 0.05]], bot: 0.08, yc: -0.07, n: 3.4, round: 0.18, material: clypMat }));
  for (const s of [-1, 1]) { const m = loft({ x0: 2.48, x1: 2.68, w: 0.08, top: 0.05, bot: 0.05, zc: s * 0.2, yc: -0.2, round: 0.4, material: mat(0x24100a, { roughness: 0.4 }) }); mouth.add(m); }
  root.add(part('mouth', 'head', mouth, { en: 'Mouth', es: 'Boca', dEn: 'A broad plate and tiny jaws for chewing leaves and roots.', dEs: 'Una placa ancha y mandíbulas diminutas para masticar hojas y raíces.' }));

  const eyes = new THREE.Group();
  for (const s of [-1, 1]) { const e = blob(0.14, 0.17, 0.1, eyeMat, null, [48, 32]); e.position.set(2.06, 0.12, s * 0.58); e.rotation.y = s * 0.45; eyes.add(e); }
  root.add(part('eyes', 'eyes', eyes, { en: 'Eyes', es: 'Ojos', dEn: 'Two big dark eyes, one on each side of the head.', dEs: 'Dos ojos grandes y oscuros, uno a cada lado de la cabeza.' }));

  for (const s of [-1, 1]) {
    const a = new THREE.Group(), name = s < 0 ? 'left' : 'right';
    const tip = V(2.98, 0.22, s * 0.74);
    a.add(beadAntenna({ pts: [V(2.4, -0.04, s * 0.34), V(2.65, 0.06, s * 0.52), V(2.84, 0.15, s * 0.65), tip], beads: 5, r0: 0.035, r1: 0.03, material: amber, scapeEnd: 0.45 }));
    const fan = new THREE.Group(); fan.position.copy(tip); fan.rotation.y = s * 0.55; a.add(fan);
    for (let i = 0; i < 3; i++) { const p = blob(0.3, 0.012, 0.085, mat(0xe39a38, { roughness: 0.4, clearcoat: 0.3 }), null, [28, 12]); p.position.x = 0.17; const pv = new THREE.Group(); pv.rotation.x = (i - 1) * 0.55; pv.add(p); fan.add(pv); }
    root.add(part(`antenna-${name}`, 'antennae', a, { en: `${s < 0 ? 'Left' : 'Right'} antenna`, es: `Antena ${s < 0 ? 'izquierda' : 'derecha'}`, dEn: 'A feeler with a fan of three plates at the tip.', dEs: 'Una antena con un abanico de tres placas en la punta.' }));
  }

  // ---- shield (pronotum) + little triangle (scutellum)
  const shield = new THREE.Group();
  const pro = loft({ x0: 0.78, x1: 1.88, w: [[0.78, 0], [0.84, 0.72], [1.0, 0.9], [1.3, 0.94], [1.6, 0.82], [1.82, 0.46], [1.88, 0]], top: [[0.78, 0], [0.84, 0.34], [1.0, 0.52], [1.3, 0.6], [1.6, 0.5], [1.82, 0.3], [1.88, 0]], bot: 0.25, yc: 0.08, n: 2.2, round: 0.05, material: proMat });
  shield.add(pro);
  const sc = blob(0.1, 0.05, 0.09, proMat, null, [24, 16]); sc.position.set(0.84, 0.58, 0); shield.add(sc);
  shield.add(hairs([pro], { count: 500, length: 0.075, radius: 0.0055, color: 0x8a5a2a, light: 0.1, back: 0.3, seed: 4, region: (x) => x > 1.55 }));
  root.add(part('shield', 'shield', shield, { en: 'Shield', es: 'Escudo', dEn: 'The pronotum is a strong shield over the front of the body.', dEs: 'El pronoto es un escudo fuerte sobre la parte delantera del cuerpo.' }));

  // ---- wing covers (elytra): two glossy halves meeting in a seam
  const ew = [[-1.5, 0], [-1.35, 0.18], [-1.05, 0.36], [-0.45, 0.53], [0.2, 0.6], [0.7, 0.58], [0.95, 0]];
  for (const s of [-1, 1]) {
    const e = loft({ x0: -1.5, x1: 0.95, w: ew, zc: ew.map(([x, v]) => [x, v * s * 0.985]), top: [[-1.5, 0], [-1.35, 0.22], [-1.0, 0.42], [-0.4, 0.57], [0.3, 0.6], [0.8, 0.53], [0.95, 0]], bot: 0.22, yc: 0.1, n: 2.2, round: 0.035, segX: 110, segR: 60, material: elytraMat });
    const g = new THREE.Group(); g.add(e);
    root.add(part(`cover-${s < 0 ? 'left' : 'right'}`, 'covers', g, { en: `${s < 0 ? 'Left' : 'Right'} wing cover`, es: `Cubre-ala ${s < 0 ? 'izquierdo' : 'derecho'}`, dEn: 'A hard, shiny cover called an elytron. Beetles lift it up before they fly.', dEs: 'Una cubierta dura y brillante llamada élitro. El escarabajo la levanta antes de volar.' }));
  }

  // ---- folded flying wings under the covers
  const wings = new THREE.Group();
  for (const s of [-1, 1]) {
    const w = wing({ length: 2.1, width: 0.6, veins: 7, tint: '#d8993f', alpha: 0.9, veinColor: 'rgba(90,50,15,.8)', curve: 0.03, seed: 6 });
    w.position.set(-1.4, 0.2, s * 0.3); w.rotation.y = s > 0 ? 0 : Math.PI; if (s < 0) { w.position.set(-1.4, 0.2, -0.3); w.scale.z = -1; w.rotation.y = 0; }
    wings.add(w);
  }
  root.add(part('wings', 'wings', wings, { en: 'Flying wings', es: 'Alas para volar', dEn: 'Folded up like paper under the covers. When open, they are bigger than the body.', dEs: 'Dobladas como papel bajo los cubre-alas. Abiertas son más grandes que el cuerpo.' }));

  // ---- tummy (abdomen); its last bit sticks out behind the covers
  const tummy = new THREE.Group();
  const ab = loft({ x0: -1.7, x1: 0.88, w: [[-1.7, 0], [-1.62, 0.3], [-1.3, 0.62], [-0.6, 0.86], [0.2, 0.92], [0.75, 0.76], [0.88, 0]], top: 0.42, bot: [[-1.7, 0], [-1.5, 0.3], [-0.8, 0.52], [0.2, 0.54], [0.88, 0]], yc: -0.03, n: 2.3, round: 0.04, mod: (x) => 1 + 0.025 * Math.sin(x * 22), material: belly });
  tummy.add(ab);
  tummy.add(hairs([ab], { count: 900, length: 0.09, radius: 0.0055, color: 0x7a4a24, light: 0.1, back: 0.5, seed: 11, region: (x, y) => y < -0.2 }));
  root.add(part('tummy', 'tummy', tummy, { en: 'Tummy', es: 'Barriga', dEn: 'Mostly hidden under the covers; its last bit sticks out at the back.', dEs: 'Casi toda escondida bajo los cubre-alas; solo la punta sale por detrás.' }));

  // ---- legs (feet planted on the ground)
  const spec = [
    { n: 'front', hip: V(1.3, -0.4, 0.4), foot: V(2.3, G, 1.75), td: V(0.6, -0.6, 0.6), fem: 0.85, tib: 0.9, rf: 0.17, rt: 0.09, teeth: 3, spines: 0 },
    { n: 'middle', hip: V(0.28, -0.4, 0.46), foot: V(0.7, G, 1.75), td: V(0.2, -0.65, 0.8), fem: 0.95, tib: 0.95, rf: 0.13, rt: 0.06, spines: 5 },
    { n: 'hind', hip: V(-0.75, -0.46, 0.6), foot: V(-1.5, G, 2.05), td: V(-0.45, -0.65, 0.7), fem: 1.0, tib: 1.0, rf: 0.165, rt: 0.075, spines: 6 },
  ];
  for (const sp of spec) for (const s of [-1, 1]) {
    const f = (v) => V(v.x, v.y, v.z * s);
    const L = leg({ hip: f(sp.hip), foot: f(sp.foot), tarsusDir: f(sp.td), tarsusLen: 0.55, pole: V(0.0, 0.7, 1.0 * s), femur: sp.fem, tibia: sp.tib, rFem: sp.rf, rTib: sp.rt, rTar: 0.04, material: legMat, spineMat, spines: sp.spines, teeth: sp.teeth ?? 0 });
    const side = s < 0 ? 'left' : 'right';
    root.add(part(`leg-${sp.n}-${side}`, 'legs', L, { en: `${sp.n[0].toUpperCase() + sp.n.slice(1)} ${side} leg`, es: `Pata ${{ front: 'delantera', middle: 'del medio', hind: 'trasera' }[sp.n]} ${s < 0 ? 'izquierda' : 'derecha'}`,
      dEn: sp.n === 'front' ? 'A digging leg with three strong teeth.' : 'A walking leg with little spines that grip the ground.', dEs: sp.n === 'front' ? 'Una pata para cavar con tres dientes fuertes.' : 'Una pata para caminar con espinitas que se agarran al suelo.' }));
  }
  return root;
}
