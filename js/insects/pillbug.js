// Rolly polly / pill bug (Armadillidium vulgare): a crustacean (cousin of crabs), not an insect. Armoured plates that roll into a ball.
import * as THREE from '../../vendor/three.module.min.js';
import { V, rad, mat, loft, blob, ball, tube, cone, leg, beadAntenna, part, canvasTex, microBumpTex, facetTex } from './lib.js';

export const info = {
  id: 'pillbug', icon: '🐚',
  name: { en: 'Rolly Polly', es: 'Cochinilla (bolita)' },
  sci: 'Armadillidium vulgare',
  blurb: { en: 'Not an insect! It is a crustacean, and it can roll into a ball.', es: '¡No es un insecto! Es un crustáceo y puede enrollarse como una bolita.' },
  cameraDir: V(0.6, 0.65, 0.9).normalize(),
};

export const categories = {
  head:     { en: 'Head', es: 'Cabeza', dEn: 'A small head with two little eyes and mouth parts for munching dead leaves.', dEs: 'Una cabecita con dos ojitos y la boca para masticar hojas secas.' },
  eyes:     { en: 'Eyes', es: 'Ojos', dEn: 'Two small dark eyes on the sides of the head.', dEs: 'Dos ojitos oscuros a los lados de la cabeza.' },
  antennae: { en: 'Antennae', es: 'Antenas', dEn: 'Feelers to touch and smell the damp ground.', dEs: 'Antenas para tocar y oler el suelo húmedo.' },
  shell:    { en: 'Armor plates', es: 'Placas de armadura', dEn: 'Seven hard plates overlap like armor. They slide so the rolly polly can curl into a ball!', dEs: 'Siete placas duras se superponen como una armadura. ¡Se deslizan para que se enrolle como una bolita!' },
  tail:     { en: 'Tail', es: 'Cola', dEn: 'The last plate, with two little spikes. It closes the ball like a lid.', dEs: 'La última placa, con dos puntitas. Cierra la bolita como una tapa.' },
  legs:     { en: 'Legs', es: 'Patas', dEn: 'Fourteen legs, seven on each side! Insects have only six.', dEs: '¡Catorce patas, siete de cada lado! Los insectos tienen solo seis.' },
};

const NP = 7, SP = 0.3, LEN = 0.52, YC = 0.36, X0 = 0.62;
const WID = [0.52, 0.66, 0.74, 0.78, 0.76, 0.68, 0.56], HGT = [0.4, 0.52, 0.58, 0.6, 0.58, 0.52, 0.42];
const plateW = (i) => WID[i];
const plateH = (i) => HGT[i];

export function build() {
  const root = new THREE.Group(); root.userData.groundY = -0.02;
  // glossy dark plum with a thin cream rim at the edge of every plate (u runs along the body, v around it)
  const plateMap = canvasTex(512, 256, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); [[0, '#201219'], [0.25, '#5a3a4c'], [0.5, '#2c1a24'], [0.75, '#190e14'], [1, '#2c1a24']].forEach(([t, c]) => g.addColorStop(t, c)); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = '#d6cbb6'; x.fillRect(0, 0, w * 0.035, h); x.fillRect(w * 0.965, 0, w * 0.035, h);
    const id = x.getImageData(0, 0, w, h), d = id.data; for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 10; d[i] += n; d[i + 1] += n; d[i + 2] += n; } x.putImageData(id, 0, 0);
  });
  const plateMat = mat(0xffffff, { roughness: 0.3, metalness: 0.1, clearcoat: 0.8, clearcoatRoughness: 0.12, map: plateMap, bumpMap: microBumpTex(81, 60), bumpScale: 0.7 });
  const headMat = mat(0x2a1a22, { roughness: 0.4, clearcoat: 0.4, bumpMap: microBumpTex(82, 60), bumpScale: 0.6 });
  const legMat = mat(0xc08a3c, { roughness: 0.5, clearcoat: 0.3 });
  const eyeMat = mat(0x070707, { roughness: 0.1, clearcoat: 1, bumpMap: facetTex(), bumpScale: 0.7 });
  const lightMat = mat(0x6a4a3a, { roughness: 0.5 });

  const T0 = new THREE.Matrix4().makeTranslation(X0, YC, 0);
  const tr = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
  const noAuto = (o, m) => { o.matrixAutoUpdate = false; o.matrix.copy(m); };

  // ---- head, in the first plate's own frame so it follows that plate when rolling
  const headPivot = new THREE.Group(); noAuto(headPivot, T0);
  headPivot.add(loft({ x0: 0.12, x1: 0.58, w: [[0.12, 0], [0.18, 0.24], [0.3, 0.32], [0.46, 0.3], [0.54, 0.18], [0.58, 0]], top: [[0.12, 0], [0.18, 0.14], [0.3, 0.2], [0.46, 0.19], [0.54, 0.11], [0.58, 0]], bot: 0.11, yc: -0.07, n: 2.3, material: headMat }));
  for (const s of [-1, 1]) { const m = blob(0.09, 0.04, 0.06, mat(0x2a2d31, { roughness: 0.4 }), null, [16, 10]); m.position.set(0.56, -0.17, s * 0.1); headPivot.add(m); }
  const head = new THREE.Group(); head.add(headPivot);
  root.add(part('head', 'head', head, { en: 'Head', es: 'Cabeza', dEn: 'A small head with two little eyes.', dEs: 'Una cabecita con dos ojitos.' }));
  const eyePivot = new THREE.Group(); noAuto(eyePivot, T0);
  for (const s of [-1, 1]) { const e = blob(0.07, 0.08, 0.06, eyeMat, null, [24, 16]); e.position.set(0.42, 0.0, s * 0.27); eyePivot.add(e); }
  const eyes = new THREE.Group(); eyes.add(eyePivot);
  root.add(part('eyes', 'eyes', eyes, { en: 'Eyes', es: 'Ojos', dEn: 'Two small dark eyes on the sides of the head.', dEs: 'Dos ojitos oscuros a los lados de la cabeza.' }));
  const antPivots = [];
  for (const s of [-1, 1]) {
    const pv = new THREE.Group(); noAuto(pv, T0); antPivots.push(pv);
    pv.add(beadAntenna({ pts: [V(0.48, 0.0, s * 0.12), V(0.86, 0.16, s * 0.24), V(1.3, 0.3, s * 0.36), V(1.7, 0.34, s * 0.5)], beads: 7, r0: 0.026, r1: 0.02, material: lightMat, scapeEnd: 0.4 }));
    const g = new THREE.Group(); g.add(pv);
    root.add(part(`antenna-${s < 0 ? 'left' : 'right'}`, 'antennae', g, { en: `${s < 0 ? 'Left' : 'Right'} antenna`, es: `Antena ${s < 0 ? 'izquierda' : 'derecha'}`, dEn: 'A feeler to touch and smell the damp ground.', dEs: 'Una antena para tocar y oler el suelo húmedo.' }));
  }

  // ---- armour plates + tail
  const plates = [];
  for (let i = 0; i < NP; i++) {
    const w = plateW(i), h = plateH(i), L = LEN / 2, m = loft({ x0: -L, x1: L, w: [[-L, w * 0.78], [-L / 2, w * 0.97], [0, w], [L / 2, w * 0.97], [L, w * 0.78]], top: [[-L, h * 0.5], [-L / 2, h * 0.9], [0, h], [L / 2, h * 0.92], [L, h * 0.55]], bot: 0.1, n: 2.0, round: 0.16, segX: 30, segR: 48, material: plateMat });
    const g = new THREE.Group(); g.add(m); noAuto(m, tr(X0 - i * SP, YC, 0)); plates.push(m);
    root.add(part(`plate-${i}`, 'shell', g, { en: `Armor plate ${i + 1}`, es: `Placa ${i + 1}`, dEn: 'One plate of the armor. The plates overlap and slide over each other.', dEs: 'Una placa de la armadura. Las placas se superponen y se deslizan.' }));
  }
  const tg = new THREE.Group(), tail = loft({ x0: -0.28, x1: 0.28, w: [[-0.28, 0.06], [-0.12, 0.22], [0.05, 0.34], [0.28, 0.3]], top: [[-0.28, 0.05], [-0.1, 0.2], [0.05, 0.3], [0.28, 0.28]], bot: 0.1, n: 2.2, round: 0.25, material: plateMat });
  for (const s of [-1, 1]) tail.add(cone(V(-0.24, 0, s * 0.1), V(-1, 0.1, s * 0.3), 0.22, 0.05, plateMat, 8));
  tg.add(tail); noAuto(tail, tr(X0 - NP * SP, YC, 0)); plates.push(tail);
  root.add(part('tail', 'tail', tg, { en: 'Tail', es: 'Cola', dEn: 'The last plate, with two little spikes.', dEs: 'La última placa, con dos puntitas.' }));

  // ---- seven pairs of short legs
  const rigs = [];
  for (let i = 0; i < NP; i++) {
    const g = new THREE.Group(), pair = [], w = plateW(i);
    for (const s of [-1, 1]) {
      const hip = V(X0 - i * SP, YC - 0.1, s * w * 0.5), foot = V(X0 - i * SP - 0.05, 0, s * (w * 0.82 + 0.1));
      const lg = leg({ hip, foot, tarsusDir: V(-0.1, -0.7, s * 0.5), tarsusLen: 0.17, pole: V(0, 0.7, s), femur: 0.3, tibia: 0.3, rFem: 0.04, rTib: 0.03, rTar: 0.022, material: legMat, spines: 0, spurs: 0, tarsi: 2, coxa: 0.8, femurBulge: 0.004 });
      g.add(lg); pair.push({ s, w, rig: lg.userData.rig });
    }
    rigs.push({ i, pair });
    root.add(part(`legs-${i}`, 'legs', g, { en: `Leg pair ${i + 1}`, es: `Par de patas ${i + 1}`, dEn: 'Two short legs, one on each side.', dEs: 'Dos patitas cortas, una a cada lado.' }));
  }
  root.userData.rig = { plates, headPivot, eyePivot, antPivots, rigs };
  return root;
}

export function motion(root) {
  const { plates, headPivot, eyePivot, antPivots, rigs } = root.userData.rig;
  const st = { mode: null, walk: 0, fly: 0, roll: 0, cycle: 0 };
  const T = 1.1, stride = 0.34, duty = 0.6, lift = 0.16, speedUnits = stride / (duty * T), ease = THREE.MathUtils.smoothstep;
  const J = new THREE.Vector3(0, -0.02, 0), Mt = [], tmp = new THREE.Matrix4(), tmp2 = new THREE.Matrix4(), rz = new THREE.Matrix4();
  for (let i = 0; i <= NP; i++) Mt.push(new THREE.Matrix4());
  const m = {
    canFly: false, second: { id: 'roll', label: { en: 'Roll up', es: 'Enrollarse' } }, state: st,
    setMode(mode) { st.mode = st.mode === mode ? null : mode; return st.mode; },
    snap() { st.mode = null; st.walk = st.roll = 0; this.update(0.0001); },
    update(dt) {
      const k = 1 - Math.exp(-dt * 5);
      st.walk += ((st.mode === 'walk' ? 1 : 0) - st.walk) * k; st.roll += ((st.mode === 'roll' ? 1 : 0) - st.roll) * k * 0.8;
      if (st.walk < 0.001) st.walk = 0; if (st.roll < 0.001) st.roll = 0;
      st.cycle += (dt / T) * (st.walk > 0.02 ? 1 : 0);
      const alpha = st.roll * rad(52);
      // forward kinematics: each plate hinges on the one before it
      Mt[0].makeTranslation(X0, YC, 0);
      for (let i = 1; i <= NP; i++) {
        rz.makeRotationZ(alpha); tmp.makeTranslation(-SP / 2, J.y, 0).multiply(rz).multiply(tmp2.makeTranslation(-SP / 2, -J.y, 0)); // hinge: back edge of the last plate -> front edge of this one
        Mt[i].copy(Mt[i - 1]).multiply(tmp);
      }
      plates.forEach((p, i) => { p.matrix.copy(Mt[i]); p.matrixWorldNeedsUpdate = true; });
      // the head tucks under the belly as the body curls
      tmp.makeTranslation(0.12, 0, 0).multiply(rz.makeRotationZ(-st.roll * rad(75))).multiply(tmp2.makeTranslation(-0.12, 0, 0)); const Mh = Mt[0].clone().multiply(tmp);
      headPivot.matrix.copy(Mh); eyePivot.matrix.copy(Mh); const Ma = Mh.clone().multiply(tmp2.makeScale(1 - 0.85 * st.roll, 1 - 0.85 * st.roll, 1 - 0.85 * st.roll)); antPivots.forEach((a) => a.matrix.copy(Ma)); // antennae fold away
      [headPivot, eyePivot, ...antPivots].forEach((p) => { p.matrixWorldNeedsUpdate = true; });
      // sit the ball on the ground
      const v = new THREE.Vector3(), d = new THREE.Vector3(); let minY = Infinity;
      plates.forEach((p, i) => { v.setFromMatrixPosition(Mt[i]); d.set(0, 1, 0).transformDirection(Mt[i]); const h = i < NP ? plateH(i) : 0.28; minY = Math.min(minY, v.y + Math.min(h * d.y, -0.1 * d.y)); });
      root.position.y = -minY;
      // legs: walk in a wave, or tuck up under the body when rolling
      for (const { i, pair } of rigs) {
        for (const { s, w, rig } of pair) {
          const wave = (st.cycle - i * 0.1 + (s > 0 ? 0.5 : 0)) % 1, ph = wave < 0 ? wave + 1 : wave; let dx = 0, dy = 0;
          if (ph < duty) dx = stride * (0.5 - ph / duty); else { const u = (ph - duty) / (1 - duty); dx = stride * (-0.5 + ease(u, 0, 1)); dy = lift * Math.sin(Math.PI * u); }
          dx *= st.walk; dy *= st.walk;
          const hipL = V(0, -0.1, s * w * 0.5), footWalk = V(-0.05 + dx, -YC + dy, s * (w * 0.82 + 0.1)), footTuck = V(0, -0.25, s * 0.22);
          const hipW = hipL.applyMatrix4(Mt[i]), footW = footWalk.lerp(footTuck, st.roll).applyMatrix4(Mt[i]);
          rig.update(hipW.sub(rig.hip), footW.sub(rig.foot));
        }
      }
      return speedUnits * st.walk;
    },
  };
  m.update(0.0001);
  return m;
}
