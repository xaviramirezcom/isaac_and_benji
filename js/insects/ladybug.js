// Seven-spot ladybird (Coccinella septempunctata).
import * as THREE from '../../vendor/three.module.min.js';
import { V, rad, mat, loft, halfLoft, blob, ball, tube, leg, hairs, wing, part, makeMotion, canvasTex, microBumpTex, facetTex } from './lib.js';

export const info = {
  id: 'ladybug', icon: '🐞',
  name: { en: 'Ladybug', es: 'Mariquita' },
  sci: 'Coccinella septempunctata',
  blurb: { en: 'A tiny red beetle with seven black spots.', es: 'Un escarabajito rojo con siete lunares negros.' },
  cameraDir: V(0.5, 0.65, 0.9).normalize(),
};

export const categories = {
  head:     { en: 'Head', es: 'Cabeza', dEn: 'A small black head with white cheeks, tucked under the shield.', dEs: 'Una cabecita negra con mejillas blancas, metida bajo el escudo.' },
  eyes:     { en: 'Eyes', es: 'Ojos', dEn: 'Two black eyes that spot tasty aphids to eat.', dEs: 'Dos ojos negros que encuentran pulgones ricos para comer.' },
  antennae: { en: 'Antennae', es: 'Antenas', dEn: 'Short feelers with little clubs at the end, for smelling food.', dEs: 'Antenas cortas con una bolita al final para oler la comida.' },
  shield:   { en: 'Shield', es: 'Escudo', dEn: 'A black shield with two white patches protects the neck.', dEs: 'Un escudo negro con dos manchas blancas protege el cuello.' },
  covers:   { en: 'Spotted shell', es: 'Caparazón con lunares', dEn: 'The bright red covers and black spots warn birds: “I taste yucky!”', dEs: 'Las cubiertas rojas y los lunares negros avisan a los pájaros: “¡Sé feo!”' },
  wings:    { en: 'Flying wings', es: 'Alas para volar', dEn: 'Thin wings folded under the shell. A ladybug opens them to fly away!', dEs: 'Alas delgadas dobladas bajo el caparazón. ¡La mariquita las abre para volar!' },
  tummy:    { en: 'Tummy', es: 'Barriga', dEn: 'The underside of the body, where the six legs are attached.', dEs: 'La parte de abajo del cuerpo, donde se unen las seis patas.' },
  legs:     { en: 'Legs', es: 'Patas', dEn: 'Six little legs that can walk up a leaf and even upside down!', dEs: '¡Seis patitas que caminan por una hoja e incluso boca abajo!' },
};

function elytraTex(mirror) {
  return canvasTex(1024, 1024, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    [[0, '#9a0c06'], [0.12, '#c8120a'], [0.25, '#e8200f'], [0.38, '#c8120a'], [0.5, '#9a0c06'], [0.75, '#6a0b06'], [1, '#9a0c06']].forEach(([t, c]) => g.addColorStop(t, c));
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = '#1a0504'; x.fillRect(0, 0.75 * h - 3, w, 6); // thin seam down the middle of the back
    // u runs rear(0) -> front(1); v runs around the body (0.25 = top of the dome)
    const spots = [[0.7, 0.12, 0.16], [0.45, 0.06, 0.17], [0.22, 0.13, 0.13], [0.97, 0.0, 0.14]]; // [u, angle from the seam, size]
    for (const [u, a, r] of spots) {
      const v = mirror ? 0.25 + a : 0.25 - a;
      for (const dv of [-1, 0, 1]) { x.save(); x.translate(u * w, (1 - (v + dv)) * h); x.scale(1, 0.42); x.fillStyle = '#0d0a0a'; x.beginPath(); x.arc(0, 0, r * 620 * 0.9, 0, 7); x.fill(); x.restore(); }
    }
    const id = x.getImageData(0, 0, w, h), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 8; d[i] += n; d[i + 1] += n * 0.5; d[i + 2] += n * 0.5; } x.putImageData(id, 0, 0);
  });
}
function patchTex(patches, base = '#121010') {
  return canvasTex(512, 512, (x, w, h) => {
    x.fillStyle = base; x.fillRect(0, 0, w, h);
    for (const [u, v, rx, ry] of patches) for (const dv of [-1, 0, 1]) { x.save(); x.translate(u * w, (1 - (v + dv)) * h); x.scale(1, ry / rx); x.fillStyle = '#f4f0e6'; x.beginPath(); x.arc(0, 0, rx * w, 0, 7); x.fill(); x.restore(); }
  });
}

export function build() {
  const root = new THREE.Group();
  const G = -0.48; root.userData.groundY = G - 0.02;
  const gloss = { roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05 };
  const blackMat = mat(0x0f0c0c, { ...gloss, bumpMap: microBumpTex(33, 50), bumpScale: 0.5 });
  const legMat = mat(0x16100e, { roughness: 0.35, clearcoat: 0.7 }), spineMat = mat(0x0a0707, { roughness: 0.5 });
  const eyeMat = mat(0x050404, { roughness: 0.08, clearcoat: 1, bumpMap: facetTex(), bumpScale: 0.5 });

  // ---- head
  const head = new THREE.Group();
  head.add(loft({ x0: 0.88, x1: 1.3, w: [[0.88, 0], [0.94, 0.22], [1.08, 0.3], [1.23, 0.24], [1.3, 0]], top: [[0.88, 0], [0.94, 0.14], [1.08, 0.2], [1.23, 0.14], [1.3, 0]], bot: 0.13, yc: 0.07, n: 2.2, material: mat(0xffffff, { ...gloss, map: patchTex([[0.85, 0.07, 0.12, 0.1], [0.85, 0.43, 0.12, 0.1], [0.7, 0.07, 0.07, 0.07], [0.7, 0.43, 0.07, 0.07]]) }) }));
  root.add(part('head', 'head', head, { en: 'Head', es: 'Cabeza', dEn: 'A small black head with white cheeks.', dEs: 'Una cabecita negra con mejillas blancas.' }));
  const eyes = new THREE.Group();
  for (const s of [-1, 1]) { const e = blob(0.12, 0.13, 0.09, eyeMat, null, [32, 20]); e.position.set(1.1, 0.14, s * 0.28); e.rotation.y = s * 0.5; eyes.add(e); }
  root.add(part('eyes', 'eyes', eyes, { en: 'Eyes', es: 'Ojos', dEn: 'Two black eyes that spot tasty aphids to eat.', dEs: 'Dos ojos negros que encuentran pulgones ricos para comer.' }));
  for (const s of [-1, 1]) {
    const a = new THREE.Group(), pts = [V(1.24, 0.08, s * 0.1), V(1.4, 0.16, s * 0.2), V(1.55, 0.16, s * 0.27), V(1.66, 0.1, s * 0.32)];
    a.add(tube(pts, (t) => 0.026 - 0.01 * t, legMat, { segs: 12, radial: 8 })); { const club = blob(0.09, 0.05, 0.05, legMat, null, [16, 10]); club.position.set(1.7, 0.08, s * 0.34); a.add(club); }
    root.add(part(`antenna-${s < 0 ? 'left' : 'right'}`, 'antennae', a, { en: `${s < 0 ? 'Left' : 'Right'} antenna`, es: `Antena ${s < 0 ? 'izquierda' : 'derecha'}`, dEn: 'A short feeler with a little club at the tip.', dEs: 'Una antena corta con una bolita en la punta.' }));
  }

  // ---- shield (black with two white patches)
  const shield = new THREE.Group();
  shield.add(loft({ x0: 0.4, x1: 1.0, w: [[0.4, 0], [0.45, 0.4], [0.6, 0.55], [0.78, 0.5], [0.92, 0.34], [1.0, 0]], top: [[0.4, 0], [0.45, 0.3], [0.6, 0.42], [0.78, 0.38], [0.92, 0.24], [1.0, 0]], bot: 0.14, yc: 0.16, n: 2.2, material: mat(0xffffff, { ...gloss, map: patchTex([[0.8, 0.06, 0.2, 0.16], [0.8, 0.44, 0.2, 0.16]]), bumpMap: microBumpTex(35, 40), bumpScale: 0.4 }) }));
  root.add(part('shield', 'shield', shield, { en: 'Shield', es: 'Escudo', dEn: 'A black shield with two white patches.', dEs: 'Un escudo negro con dos manchas blancas.' }));

  // ---- spotted shell: two red domes meeting in a seam
  for (const s of [-1, 1]) {
    const e = halfLoft(s, { x0: -0.95, x1: 0.52, w: [[-0.95, 0.0], [-0.9, 0.302], [-0.8, 0.504], [-0.65, 0.672], [-0.45, 0.792], [-0.2, 0.84], [0.05, 0.792], [0.28, 0.645], [0.45, 0.419], [0.52, 0.235]], top: [[-0.95, 0.0], [-0.9, 0.405], [-0.8, 0.611], [-0.65, 0.77], [-0.45, 0.878], [-0.2, 0.92], [0.05, 0.878], [0.28, 0.745], [0.45, 0.527], [0.52, 0.332]], bot: 0.1, yc: 0.08, n: 2.0, round: 0.03, segX: 100, segR: 72, material: mat(0xffffff, { ...gloss, map: elytraTex(s < 0), bumpMap: microBumpTex(37, 30), bumpScale: 0.3 }) });
    const pivot = V(0.5, 0.45, s * 0.15), g = new THREE.Group(); g.position.copy(pivot); e.position.copy(pivot).negate(); g.add(e); // hinged at the front
    root.add(part(`cover-${s < 0 ? 'left' : 'right'}`, 'covers', g, { en: `${s < 0 ? 'Left' : 'Right'} shell cover`, es: `Cubierta ${s < 0 ? 'izquierda' : 'derecha'}`, dEn: 'A red shell with black spots. Red tells birds: “I taste yucky!”', dEs: 'Un caparazón rojo con lunares. El rojo avisa a los pájaros: “¡Sé feo!”' }));
  }

  // ---- folded flying wings (each hinged at its root so it can unfold)
  const wings = new THREE.Group();
  for (const s of [-1, 1]) {
    const w = wing({ length: 1.5, width: 0.42, lateral: 0.3, veins: 5, tint: '#8a8078', alpha: 0.8, veinColor: 'rgba(30,25,20,.8)', curve: 0.02, seed: 8 });
    if (s < 0) w.scale.z = -1;
    const hw = new THREE.Group(); hw.name = `hw-${s < 0 ? 'left' : 'right'}`; hw.position.set(0.35, 0.14, s * 0.22); hw.rotation.y = Math.PI; hw.add(w); wings.add(hw);
  }
  root.add(part('wings', 'wings', wings, { en: 'Flying wings', es: 'Alas para volar', dEn: 'Thin wings folded under the shell. A ladybug opens them to fly away!', dEs: 'Alas delgadas dobladas bajo el caparazón. ¡La mariquita las abre para volar!' }));

  // ---- tummy (underside)
  const tummy = new THREE.Group();
  tummy.add(loft({ x0: -0.92, x1: 0.9, w: [[-0.92, 0], [-0.8, 0.5], [-0.4, 0.74], [0.1, 0.72], [0.55, 0.52], [0.9, 0]], top: 0.2, bot: [[-0.92, 0], [-0.6, 0.2], [0.1, 0.24], [0.9, 0]], yc: 0.0, n: 2.2, material: blackMat }));
  root.add(part('tummy', 'tummy', tummy, { en: 'Tummy', es: 'Barriga', dEn: 'The underside, where the six legs are attached.', dEs: 'La parte de abajo, donde se unen las seis patas.' }));

  // ---- legs
  const spec = [
    { n: 'front', hip: V(0.75, -0.02, 0.32), foot: V(1.3, G, 0.95), td: V(0.4, -0.7, 0.6), fem: 0.4, tib: 0.4 },
    { n: 'middle', hip: V(0.1, -0.05, 0.5), foot: V(0.15, G, 1.2), td: V(0.1, -0.7, 0.7), fem: 0.45, tib: 0.45 },
    { n: 'hind', hip: V(-0.5, -0.05, 0.5), foot: V(-0.85, G, 1.0), td: V(-0.4, -0.7, 0.6), fem: 0.45, tib: 0.45 },
  ];
  for (const sp of spec) for (const s of [-1, 1]) {
    const f = (v) => V(v.x, v.y, v.z * s);
    const L = leg({ hip: f(sp.hip), foot: f(sp.foot), tarsusDir: f(sp.td), tarsusLen: 0.3, pole: V(0, 0.5, 1.0 * s), femur: sp.fem, tibia: sp.tib, rFem: 0.08, rTib: 0.05, rTar: 0.034, material: legMat, spineMat, spines: 0, spurs: 0, tarsi: 3, femurBulge: 0.01 });
    const side = s < 0 ? 'left' : 'right';
    root.add(part(`leg-${sp.n}-${side}`, 'legs', L, { en: `${sp.n[0].toUpperCase() + sp.n.slice(1)} ${side} leg`, es: `Pata ${{ front: 'delantera', middle: 'del medio', hind: 'trasera' }[sp.n]} ${s < 0 ? 'izquierda' : 'derecha'}`, dEn: 'A tiny leg with sticky pads that grip leaves.', dEs: 'Una patita con almohadillas pegajosas que se agarran a las hojas.' }));
  }
  return root;
}

export function motion(root) {
  return makeMotion(root, { legOrder: ['front', 'middle', 'hind'], stride: 0.4, lift: 0.2, period: 0.55, duty: 0.62, bob: 0.015,
    fly: { hover: 0.9, tilt: rad(12), freq: 6, legBack: { front: 0.1, middle: -0.1, hind: -0.3 },
      wings: [{ ids: ['hw-left', 'hw-right'], yaw: (s) => Math.PI + rad(80) * s, roll: rad(4), amp: rad(40), unfold: 1.5 }],
      covers: [{ ids: ['cover-left', 'cover-right'], pitch: rad(34), splay: rad(32) }] } });
}
