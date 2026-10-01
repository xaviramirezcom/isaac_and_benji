// Giant red-headed centipede (Scolopendra heros). A myriapod, not an insect: one pair of legs on every body segment.
import * as THREE from '../../vendor/three.module.min.js';
import { V, rad, mat, loft, blob, ball, tube, cone, leg, beadAntenna, part, shellColorTex, microBumpTex } from './lib.js';

export const info = {
  id: 'centipede', icon: '🐛',
  name: { en: 'Giant Centipede', es: 'Ciempiés gigante' },
  sci: 'Scolopendra heros',
  blurb: { en: 'Not an insect! A long body with a pair of legs on every segment.', es: '¡No es un insecto! Un cuerpo largo con un par de patas en cada segmento.' },
  cameraDir: V(0.35, 0.8, 0.95).normalize(),
};

export const categories = {
  head:     { en: 'Head', es: 'Cabeza', dEn: 'A bright red head. Centipedes have tiny eyes, so they feel their way around.', dEs: 'Una cabeza roja brillante. Los ciempiés tienen ojos diminutos, así que se guían tocando.' },
  antennae: { en: 'Antennae', es: 'Antenas', dEn: 'Long feelers made of many little bumps, for smelling and touching everything.', dEs: 'Antenas largas hechas de muchos bultitos, para oler y tocar todo.' },
  fangs:    { en: 'Venom claws', es: 'Garras con veneno', dEn: 'Two curved claws under the head. They are really a pair of front legs that grew into fangs!', dEs: 'Dos garras curvas bajo la cabeza. ¡Son en realidad un par de patas delanteras que se volvieron colmillos!' },
  body:     { en: 'Body rings', es: 'Anillos del cuerpo', dEn: 'The body is made of many hard rings called segments. They let the centipede wiggle like a snake.', dEs: 'El cuerpo está hecho de muchos anillos duros llamados segmentos. Le permiten ondularse como una serpiente.' },
  legs:     { en: 'Legs', es: 'Patas', dEn: 'One pair of legs on every segment. The legs move in a wave, front to back!', dEs: 'Un par de patas en cada segmento. ¡Las patas se mueven en una ola, de adelante hacia atrás!' },
  tail:     { en: 'Tail legs', es: 'Patas de la cola', dEn: 'The last two legs are long and point backwards, like a second pair of feelers.', dEs: 'Las dos últimas patas son largas y apuntan hacia atrás, como otro par de antenas.' },
};

const N = 16, D = 0.42, G = -0.42;

// Centre line of the body: segment i (-1 is the head) at amplitude `amp`, wave phase `ph`. Returns position + heading.
function lay(i, amp, ph) {
  const x = -D * i, k = 0.62, env = 0.55 + 0.45 * Math.min(1, (i + 2) / 6);
  const z = amp * env * Math.sin(k * i - ph), dz = amp * env * k * Math.cos(k * i - ph); // dz/di
  return { x, z, phi: Math.atan2(dz, D) }; // heading about Y (the body points along +X, segments run toward -X)
}
const rotY = (lx, ly, lz, phi) => V(lx * Math.cos(phi) + lz * Math.sin(phi), ly, -lx * Math.sin(phi) + lz * Math.cos(phi));

export function build() {
  const root = new THREE.Group();
  root.userData.groundY = G - 0.02;
  const plateMap = shellColorTex([[0, '#241510'], [0.3, '#2c1a14'], [0.5, '#c8601f'], [0.7, '#7a3a18'], [1, '#4a2410']], { speckle: 8, seed: 5 });
  const plateMat = mat(0xffffff, { roughness: 0.3, clearcoat: 0.9, clearcoatRoughness: 0.12, map: plateMap, bumpMap: microBumpTex(61, 50), bumpScale: 0.5 });
  const headMat = mat(0xc4401a, { roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.08, bumpMap: microBumpTex(62, 40), bumpScale: 0.4 });
  const legMat = mat(0xdc9a30, { roughness: 0.35, clearcoat: 0.6 });
  const fangMat = mat(0x2a0d08, { roughness: 0.2, clearcoat: 1 });
  const antMat = mat(0xe2a838, { roughness: 0.4, clearcoat: 0.4 });

  const L0 = lay(-1, 0, 0);
  // ---- head (a pivot group inside the part, so the walking animation can steer it)
  const headPivot = new THREE.Group(); headPivot.name = 'pivot-head'; headPivot.position.set(L0.x, 0, L0.z);
  headPivot.add(loft({ x0: 0.0, x1: 0.78, w: [[0, 0], [0.06, 0.4], [0.3, 0.5], [0.58, 0.46], [0.72, 0.3], [0.78, 0]], top: 0.15, bot: 0.12, n: 2.4, material: headMat }));
  for (const s of [-1, 1]) for (const [x, z] of [[0.52, 0.3], [0.44, 0.34], [0.6, 0.24]]) headPivot.add(ball(V(x, 0.1, s * z), 0.028, mat(0x050404, { roughness: 0.1, clearcoat: 1 })));
  const head = new THREE.Group(); head.add(headPivot);
  root.add(part('head', 'head', head, { en: 'Head', es: 'Cabeza', dEn: 'A bright red head with tiny eyes.', dEs: 'Una cabeza roja brillante con ojos diminutos.' }));

  const antPivots = [];
  for (const s of [-1, 1]) {
    const pv = new THREE.Group(); pv.name = 'pivot-ant'; pv.position.set(L0.x, 0, L0.z);
    pv.add(beadAntenna({ pts: [V(0.7, 0.04, s * 0.18), V(1.05, 0.14, s * 0.5), V(1.55, 0.12, s * 0.95), V(2.15, 0.02, s * 1.35)], beads: 16, r0: 0.04, r1: 0.026, material: antMat, scapeEnd: 0.18 }));
    const g = new THREE.Group(); g.add(pv); antPivots.push(pv);
    root.add(part(`antenna-${s < 0 ? 'left' : 'right'}`, 'antennae', g, { en: `${s < 0 ? 'Left' : 'Right'} antenna`, es: `Antena ${s < 0 ? 'izquierda' : 'derecha'}`, dEn: 'A long feeler made of many little bumps.', dEs: 'Una antena larga hecha de muchos bultitos.' }));
  }
  const fangPivot = new THREE.Group(); fangPivot.name = 'pivot-fang'; fangPivot.position.set(L0.x, 0, L0.z);
  for (const s of [-1, 1]) {
    fangPivot.add(tube([V(0.5, -0.1, s * 0.2), V(0.8, -0.16, s * 0.3), V(1.02, -0.13, s * 0.1)], (t) => 0.085 - 0.065 * t, fangMat, { segs: 16, radial: 10 }));
    fangPivot.add(cone(V(1.0, -0.13, s * 0.12), V(0.4, -0.1, -s * 0.9), 0.14, 0.022, fangMat, 8));
  }
  const fangs = new THREE.Group(); fangs.add(fangPivot);
  root.add(part('fangs', 'fangs', fangs, { en: 'Venom claws', es: 'Garras con veneno', dEn: 'Two curved claws that are really front legs turned into fangs.', dEs: 'Dos garras curvas que son en realidad patas delanteras convertidas en colmillos.' }));

  // ---- body rings (one part; each ring is moved by the walking animation)
  const plates = [], bodyG = new THREE.Group();
  for (let i = 0; i < N; i++) {
    const w = 0.44 + 0.12 * Math.sin((Math.PI * (i + 1)) / (N + 1));
    const p = blob(0.3, 0.17, w, plateMat, (v) => { if (v.y < 0) v.y *= 0.45; }, [40, 24]);
    const l = lay(i, 0, 0); p.position.set(l.x, 0, l.z); plates.push(p); bodyG.add(p);
  }
  root.add(part('body', 'body', bodyG, { en: 'Body rings', es: 'Anillos del cuerpo', dEn: 'Many hard rings that let the centipede wiggle like a snake.', dEs: 'Muchos anillos duros que dejan al ciempiés ondularse como una serpiente.' }));

  // ---- a pair of legs on every ring
  const rigs = [];
  for (let i = 0; i < N; i++) {
    const g = new THREE.Group(), l = lay(i, 0, 0), pair = [];
    for (const s of [-1, 1]) {
      const hip = V(l.x, -0.07, s * 0.36), foot = V(l.x - 0.12, G, s * 1.0);
      const lg = leg({ hip, foot, tarsusDir: V(-0.25, -0.75, s * 0.55), tarsusLen: 0.3, pole: V(0, 0.7, s), femur: 0.55, tibia: 0.55, rFem: 0.05, rTib: 0.034, rTar: 0.022, material: legMat, spines: 0, spurs: 0, tarsi: 2, coxa: 0.7, femurBulge: 0.008 });
      g.add(lg); pair.push({ s, rig: lg.userData.rig });
    }
    rigs.push({ i, pair });
    root.add(part(`legs-${i}`, 'legs', g, { en: `Leg pair ${i + 1}`, es: `Par de patas ${i + 1}`, dEn: 'Two legs, one on each side of the same ring.', dEs: 'Dos patas, una a cada lado del mismo anillo.' }));
  }

  // ---- the long trailing tail legs
  const tailPivot = new THREE.Group(); tailPivot.name = 'pivot-tail';
  const lt = lay(N - 1, 0, 0); tailPivot.position.set(lt.x, 0, lt.z);
  for (const s of [-1, 1]) {
    tailPivot.add(tube([V(-0.2, -0.05, s * 0.3), V(-0.9, -0.12, s * 0.55), V(-1.7, -0.22, s * 0.75), V(-2.3, -0.3, s * 0.85)], (t) => 0.055 - 0.03 * t, legMat, { segs: 24, radial: 10 }));
  }
  const tail = new THREE.Group(); tail.add(tailPivot);
  root.add(part('tail-legs', 'tail', tail, { en: 'Tail legs', es: 'Patas de la cola', dEn: 'The last two legs are long and point backwards, like extra feelers.', dEs: 'Las dos últimas patas son largas y apuntan hacia atrás, como antenas extra.' }));
  root.userData.rigs = { plates, rigs, headPivot, antPivots, fangPivot, tailPivot };
  return root;
}

export function motion(root) {
  const { plates, rigs, headPivot, antPivots, fangPivot, tailPivot } = root.userData.rigs;
  const st = { mode: null, walk: 0, fly: 0, cycle: 0, t: 0 };
  const T = 1.0, stride = 0.55, duty = 0.55, lift = 0.28, speedUnits = stride / (duty * T);
  const ease = THREE.MathUtils.smoothstep;
  const steer = (obj, l, dx = 0) => { obj.position.set(l.x + dx, 0, l.z); obj.rotation.y = -l.phi; };
  const m = {
    canFly: false, state: st,
    setMode(mode) { st.mode = st.mode === mode ? null : mode; return st.mode; },
    snap() { st.mode = null; st.walk = st.fly = 0; this.update(0.0001); },
    update(dt) {
      st.walk += ((st.mode === 'walk' ? 1 : 0) - st.walk) * (1 - Math.exp(-dt * 6)); if (st.walk < 0.001) st.walk = 0;
      st.t += dt; st.cycle += (dt / T) * (st.walk > 0.02 ? 1 : 0);
      const amp = 0.38 * st.walk, ph = st.cycle * Math.PI * 2;
      const L = (i) => lay(i, amp, ph);
      plates.forEach((p, i) => { const l = L(i); p.position.set(l.x, 0, l.z); p.rotation.y = -l.phi; });
      const h = L(-1); steer(headPivot, h); antPivots.forEach((a) => steer(a, h)); steer(fangPivot, h); steer(tailPivot, L(N - 1));
      for (const { i, pair } of rigs) {
        const l = L(i);
        for (const { s, rig } of pair) {
          const wave = (st.cycle - i * 0.085 + (s > 0 ? 0.5 : 0)) % 1, ph2 = wave < 0 ? wave + 1 : wave; let dx = 0, dy = 0;
          if (ph2 < duty) dx = stride * (0.5 - ph2 / duty); else { const u = (ph2 - duty) / (1 - duty); dx = stride * (-0.5 + ease(u, 0, 1)); dy = lift * Math.sin(Math.PI * u); }
          dx *= st.walk; dy *= st.walk;
          const hipW = rotY(0, -0.07, s * 0.36, -l.phi).add(V(l.x, 0, l.z)), footW = rotY(-0.12 + dx, G + dy, s * 1.0, -l.phi).add(V(l.x, 0, l.z));
          rig.update(hipW.sub(rig.hip), footW.sub(rig.foot));
        }
      }
      return speedUnits * st.walk;
    },
  };
  m.update(0.0001);
  return m;
}
