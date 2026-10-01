// Bold jumping spider (Phidippus audax): black, fuzzy, big front eyes, shiny green jaws, white spots. Not an insect: 8 legs, 2 body parts.
import * as THREE from '../../vendor/three.module.min.js';
import { V, rad, mat, loft, blob, ball, tube, cone, leg, hairs, part, makeMotion, canvasTex, microBumpTex } from './lib.js';

export const info = {
  id: 'spider', icon: '🕷️',
  name: { en: 'Jumping Spider', es: 'Araña saltarina' },
  sci: 'Phidippus audax',
  blurb: { en: 'Not an insect! A spider has 8 legs and 2 body parts.', es: '¡No es un insecto! Una araña tiene 8 patas y 2 partes del cuerpo.' },
  cameraDir: V(0.7, 0.45, 0.85).normalize(),
};

export const categories = {
  head:    { en: 'Head & chest', es: 'Cabeza y pecho', dEn: 'Spiders have just two body parts. The front one joins the head and chest together.', dEs: 'Las arañas tienen solo dos partes del cuerpo. La de adelante une la cabeza y el pecho.' },
  eyes:    { en: 'Eyes', es: 'Ojos', dEn: 'Eight eyes! The two big ones in front help it judge distance before it jumps.', dEs: '¡Ocho ojos! Los dos grandes de adelante le ayudan a medir la distancia antes de saltar.' },
  jaws:    { en: 'Jaws', es: 'Mandíbulas', dEn: 'Shiny green jaws called chelicerae, with a tiny fang on each one.', dEs: 'Mandíbulas verdes y brillantes llamadas quelíceros, con un colmillito cada una.' },
  palps:   { en: 'Little arms', es: 'Pedipalpos', dEn: 'Two small arms near the mouth that feel and hold food.', dEs: 'Dos bracitos cerca de la boca que tocan y sujetan la comida.' },
  tummy:   { en: 'Tummy', es: 'Abdomen', dEn: 'The back body part holds the stomach and the silk-making parts.', dEs: 'La parte de atrás guarda el estómago y las partes que hacen la seda.' },
  silk:    { en: 'Silk spinners', es: 'Hileras', dEn: 'Tiny spinners at the tail make silk thread, like a safety rope for jumping.', dEs: 'Unas hileras diminutas en la cola hacen hilo de seda, como una cuerda de seguridad para saltar.' },
  legs:    { en: 'Legs', es: 'Patas', dEn: 'Eight legs! Insects have only six. Spiders push with their back legs to jump.', dEs: '¡Ocho patas! Los insectos tienen solo seis. Las arañas se impulsan con las patas de atrás para saltar.' },
};

function abdomenTex() {
  return canvasTex(1024, 512, (x, w, h) => {
    x.fillStyle = '#17120f'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#e9e3d4';
    for (const [u, r] of [[0.3, 0.07], [0.5, 0.075], [0.7, 0.06]]) { x.save(); x.translate(u * w, (1 - 0.25) * h); x.scale(1, 0.55); x.beginPath(); x.arc(0, 0, r * w, 0, 7); x.fill(); x.restore(); } // dorsal spots
    x.fillStyle = 'rgba(233,227,212,.9)'; x.fillRect(0.82 * w, 0, 0.05 * w, h * 0.5); // pale band across the front
    const id = x.getImageData(0, 0, w, h), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 18; d[i] += n; d[i + 1] += n; d[i + 2] += n; } x.putImageData(id, 0, 0);
  });
}

export function build() {
  const root = new THREE.Group();
  const G = -0.9; root.userData.groundY = G - 0.02;
  const fur = mat(0x16110e, { roughness: 0.85, bumpMap: microBumpTex(51, 70), bumpScale: 1.2 });
  const abd = mat(0xffffff, { roughness: 0.85, map: abdomenTex(), bumpMap: microBumpTex(52, 70), bumpScale: 1.2 });
  const eyeMat = mat(0x060606, { roughness: 0.04, clearcoat: 1 });
  const green = mat(0x2f9e6a, { roughness: 0.18, metalness: 0.7, clearcoat: 1, iridescence: 1, iridescenceIOR: 1.8 });
  const legMat = mat(0x1a1410, { roughness: 0.8 }), spineMat = mat(0x0d0a08, { roughness: 0.6 });

  // ---- head & chest (cephalothorax)
  const head = new THREE.Group();
  const cm = loft({ x0: 0.0, x1: 1.4, w: [[0.0, 0], [0.1, 0.36], [0.4, 0.55], [0.85, 0.62], [1.2, 0.54], [1.4, 0]], top: [[0.0, 0], [0.1, 0.2], [0.4, 0.34], [0.85, 0.5], [1.2, 0.54], [1.4, 0.2]], bot: [[0.0, 0], [0.4, 0.3], [1.0, 0.34], [1.4, 0]], yc: 0.05, n: 2.2, material: fur });
  head.add(cm);
  head.add(hairs([cm], { count: 1800, length: 0.1, radius: 0.007, color: 0x080605, light: 0.04, back: 0.4, seed: 81 }));
  root.add(part('head', 'head', head, { en: 'Head & chest', es: 'Cabeza y pecho', dEn: 'Spiders have just two body parts: the head and chest are joined.', dEs: 'Las arañas tienen solo dos partes: la cabeza y el pecho van unidos.' }));

  const eyes = new THREE.Group();
  for (const s of [-1, 1]) {
    const big = blob(0.17, 0.17, 0.15, eyeMat, null, [32, 24]); big.position.set(1.34, 0.28, s * 0.17); eyes.add(big);
    const a = blob(0.09, 0.09, 0.08, eyeMat, null, [24, 18]); a.position.set(1.18, 0.4, s * 0.43); eyes.add(a);
    const m = blob(0.04, 0.04, 0.04, eyeMat, null, [16, 12]); m.position.set(0.98, 0.5, s * 0.3); eyes.add(m);
    const p = blob(0.08, 0.08, 0.07, eyeMat, null, [24, 18]); p.position.set(0.92, 0.52, s * 0.5); eyes.add(p);
  }
  root.add(part('eyes', 'eyes', eyes, { en: 'Eyes', es: 'Ojos', dEn: 'Eight eyes! The two big ones in front judge distance for jumping.', dEs: '¡Ocho ojos! Los dos grandes de adelante miden la distancia para saltar.' }));

  const jaws = new THREE.Group();
  for (const s of [-1, 1]) {
    const c = blob(0.11, 0.2, 0.1, green, null, [28, 20]); c.position.set(1.44, -0.05, s * 0.17); jaws.add(c);
    jaws.add(cone(V(1.48, -0.24, s * 0.17), V(0.2, -1, 0), 0.14, 0.03, mat(0x2a1a0e, { roughness: 0.3 }), 8));
  }
  root.add(part('jaws', 'jaws', jaws, { en: 'Jaws', es: 'Mandíbulas', dEn: 'Shiny green jaws, each with a tiny fang.', dEs: 'Mandíbulas verdes y brillantes, cada una con un colmillito.' }));

  const palps = new THREE.Group();
  for (const s of [-1, 1]) {
    palps.add(tube([V(1.42, -0.12, s * 0.34), V(1.62, -0.1, s * 0.4), V(1.74, -0.2, s * 0.34)], (t) => 0.05 - 0.02 * t, mat(0x2a211a, { roughness: 0.8 }), { segs: 12, radial: 8 }));
    palps.add(ball(V(1.78, -0.22, s * 0.33), 0.065, mat(0xcfc6b0, { roughness: 0.9, bumpMap: microBumpTex(53, 90), bumpScale: 1.5 })));
  }
  root.add(part('palps', 'palps', palps, { en: 'Little arms', es: 'Pedipalpos', dEn: 'Two small arms near the mouth that feel and hold food.', dEs: 'Dos bracitos cerca de la boca que tocan y sujetan la comida.' }));

  // ---- tummy (abdomen) + silk spinners
  const tummy = new THREE.Group();
  const am = loft({ x0: -1.65, x1: 0.06, w: [[-1.65, 0], [-1.55, 0.3], [-1.15, 0.58], [-0.65, 0.66], [-0.3, 0.48], [-0.12, 0.2], [0.06, 0.14]], top: [[-1.65, 0], [-1.55, 0.28], [-1.15, 0.58], [-0.65, 0.64], [-0.3, 0.44], [-0.12, 0.18], [0.06, 0.12]], bot: [[-1.65, 0], [-1.15, 0.5], [-0.65, 0.56], [-0.3, 0.38], [-0.12, 0.16], [0.06, 0.12]], yc: 0.05, n: 2.1, round: 0.03, material: abd });
  tummy.add(am);
  tummy.add(tube([V(-0.3, 0.07, 0), V(-0.05, 0.07, 0), V(0.18, 0.07, 0)], () => 0.15, fur, { segs: 8, radial: 14 })); // the thin neck (pedicel) joining the two body parts
  tummy.add(hairs([am], { count: 1600, length: 0.1, radius: 0.007, color: 0x080605, light: 0.04, back: 0.8, seed: 82 }));
  root.add(part('tummy', 'tummy', tummy, { en: 'Tummy', es: 'Abdomen', dEn: 'The back body part holds the stomach and the silk-making parts.', dEs: 'La parte de atrás guarda el estómago y las partes que hacen la seda.' }));
  const silk = new THREE.Group();
  for (const s of [-1, 1]) silk.add(blob(0.1, 0.05, 0.05, mat(0x2a221c, { roughness: 0.7 }), null, [16, 12])).children.at(-1).position.set(-1.66, -0.08, s * 0.07);
  root.add(part('silk', 'silk', silk, { en: 'Silk spinners', es: 'Hileras', dEn: 'Tiny spinners make silk thread, like a safety rope.', dEs: 'Hileras diminutas que hacen hilo de seda, como una cuerda de seguridad.' }));

  // ---- eight legs (four pairs)
  const spec = [
    { n: 'first', hip: V(1.0, -0.15, 0.28), foot: V(2.05, G + 0.2, 1.15), td: V(0.5, -0.6, 0.6), fem: 0.8, tib: 0.78 },
    { n: 'second', hip: V(0.75, -0.18, 0.34), foot: V(1.35, G, 2.0), td: V(0.2, -0.7, 0.75), fem: 0.9, tib: 0.9 },
    { n: 'third', hip: V(0.45, -0.18, 0.34), foot: V(0.1, G, 2.05), td: V(-0.2, -0.7, 0.75), fem: 0.9, tib: 0.9 },
    { n: 'fourth', hip: V(0.2, -0.15, 0.3), foot: V(-1.05, G, 1.6), td: V(-0.55, -0.6, 0.6), fem: 1.0, tib: 1.0 },
  ];
  const names = { first: ['Front', 'Delantera'], second: ['Second', 'Segunda'], third: ['Third', 'Tercera'], fourth: ['Back', 'Trasera'] };
  for (const sp of spec) for (const s of [-1, 1]) {
    const f = (v) => V(v.x, v.y, v.z * s);
    const L = leg({ hip: f(sp.hip), foot: f(sp.foot), tarsusDir: f(sp.td), tarsusLen: 0.5, pole: V(0, 0.8, 1.0 * s), femur: sp.fem, tibia: sp.tib, rFem: 0.1, rTib: 0.065, rTar: 0.04, material: legMat, spineMat, spines: 3, spurs: 0, tarsi: 3, femurBulge: 0.02, fur: { count: 150, length: 0.1, radius: 0.007, color: 0x080605, light: 0.04, back: 0.2, seed: 90 + spec.indexOf(sp) * 2 + (s > 0 ? 1 : 0) } });
    const side = s < 0 ? 'left' : 'right';
    root.add(part(`leg-${sp.n}-${side}`, 'legs', L, { en: `${names[sp.n][0]} ${side} leg`, es: `Pata ${names[sp.n][1].toLowerCase()} ${s < 0 ? 'izquierda' : 'derecha'}`, dEn: sp.n === 'fourth' ? 'A strong back leg that pushes the spider into a big jump!' : 'A hairy leg with tiny claws for gripping.', dEs: sp.n === 'fourth' ? '¡Una pata fuerte de atrás que lanza a la araña en un gran salto!' : 'Una pata peluda con garritas diminutas para agarrarse.' }));
  }
  return root;
}

export function motion(root) {
  return makeMotion(root, { legOrder: ['first', 'second', 'third', 'fourth'], stride: 1.0, lift: 0.4, period: 0.85, duty: 0.6, bob: 0.02 });
}
