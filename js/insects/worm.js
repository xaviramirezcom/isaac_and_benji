// Earthworm / soil worm (Lumbricus terrestris) — an annelid, not an insect. Built from the standard anatomy of the species:
//  OUTSIDE: ~150 rings (segments; 100 are drawn), a fleshy lobe (prostomium) over the mouth on ring 1, the swollen saddle (clitellum) at rings 32–37,
//   eight bristles (setae) on almost every ring (none on the first and last), a round front half and a flattened tail with the anus, darker back / paler belly, dark back vessel showing through.
//  INSIDE (at their real ring numbers): brain (ring 3) · mouth + pharynx (1–5) · esophagus (6–13) with its pouches and chalky glands (10–13) · five pairs of "hearts" (7–11) ·
//   seminal vesicles (9–12), spermathecae (9–10), ovaries (13) · crop (15–16) · gizzard (17–18) · intestine (19→tail) · back and belly blood vessels · ventral nerve cord with a knot (ganglion) in every ring · tiny kidneys (nephridia).
// Every piece is bound to the ring it lives in, so when the worm crawls (waves of squeezing and stretching) the organs move with it.
// Real segment numbers are mapped onto the 100 drawn rings with K = rings / 150.
import * as THREE from '../../vendor/three.module.min.js';
import { V, mat, blob, part, canvasTex, microBumpTex } from './lib.js';

export const info = {
  id: 'worm', icon: '🪱',
  name: { en: 'Soil Worm', es: 'Lombriz de tierra' },
  sci: 'Lumbricus terrestris',
  blurb: { en: 'Not an insect! A soft, bendy worm with no legs, eyes or bones that tunnels through the soil.', es: '¡No es un insecto! Un gusano blando y flexible, sin patas, ojos ni huesos, que hace túneles en la tierra.' },
  cameraDir: V(0.2, 1.0, 0.8).normalize(),
};

export const categories = {
  head:     { skin: true, en: 'Head end', es: 'Parte de la cabeza', dEn: 'The front end has no eyes or ears! A fleshy lobe called the prostomium hangs over the mouth. It feels and smells the soil and pushes into cracks. The mouth is on ring 1, underneath.', dEs: '¡La parte de adelante no tiene ojos ni orejas! Un lóbulo carnoso llamado prostomio cuelga sobre la boca. Siente y huele la tierra y se mete en las grietas. La boca está en el anillo 1, por abajo.' },
  body:     { skin: true, en: 'Body rings', es: 'Anillos del cuerpo', dEn: 'A worm is a tube made of little rings called segments: about 150 in a big earthworm (this model draws 100 so you can see them). It breathes through its moist skin! The back is dark and the belly is paler.', dEs: 'Una lombriz es un tubo hecho de anillitos llamados segmentos: unos 150 en una lombriz grande (este modelo dibuja 100 para que se vean). ¡Respira por la piel húmeda! La espalda es oscura y la barriga más clara.' },
  saddle:   { skin: true, en: 'The saddle', es: 'La silla (clitelo)', dEn: 'The swollen, lighter band near the front, around rings 32 to 37, is called the clitellum. It makes the slimy cocoon where baby worms grow.', dEs: 'La banda hinchada y más clara cerca de la cabeza, alrededor de los anillos 32 a 37, se llama clitelo. Hace el capullo baboso donde crecen las lombricitas.' },
  bristles: { en: 'Tiny bristles', es: 'Cerditas diminutas', dEn: 'Almost every ring has eight tiny stiff hairs called setae (not the first and the last). They grip the soil like little hooks, so the worm can pull itself along.', dEs: 'Casi todos los anillos tienen ocho pelitos duros llamados setas (menos el primero y el último). Se agarran a la tierra como ganchitos para que la lombriz se jale hacia adelante.' },
  tail:     { skin: true, en: 'Tail end', es: 'Parte de la cola', dEn: 'The back end is a bit flatter than the front. The very last part has the anus, where leftover soil comes out as little crumbs called castings. They make soil rich for plants!', dEs: 'La parte de atrás es un poco más plana que la de adelante. El último tramo tiene el ano, por donde sale la tierra que sobra en bolitas llamadas humus de lombriz. ¡Hacen la tierra rica para las plantas!' },
  brain:    { en: 'Brain', es: 'Cerebro', dEn: 'Two little lumps on top of the throat, in ring 3. Worms have no eyes, but they sense light, touch and tastes through their skin and this tiny brain.', dEs: 'Dos bultitos encima de la garganta, en el anillo 3. Las lombrices no tienen ojos, pero sienten la luz, el tacto y los sabores por la piel y con este cerebrito.' },
  pharynx:  { en: 'Mouth and throat', es: 'Boca y garganta', dEn: 'The mouth (rings 1 to 3) leads to a strong, muscular throat called the pharynx (rings 3 to 5). It works like a suction pump to pull in bits of leaves and soil.', dEs: 'La boca (anillos 1 a 3) lleva a una garganta fuerte y musculosa llamada faringe (anillos 3 a 5). Funciona como una bomba de succión para meter trocitos de hojas y tierra.' },
  esophagus:{ en: 'Food tube', es: 'Tubo de la comida', dEn: 'The thin food tube (esophagus) runs from ring 6 to 13. Chalky pouches and glands beside it (rings 10 to 13) get rid of extra calcium from the soil.', dEs: 'El tubo delgado de la comida (esófago) va del anillo 6 al 13. Unas bolsitas y glándulas con cal a su lado (anillos 10 a 13) sacan el calcio que sobra de la tierra.' },
  hearts:   { en: 'Five hearts', es: 'Cinco corazones', dEn: 'Five pairs of muscle loops (rings 7 to 11) wrap around the food tube and squeeze like hearts. They push the red blood from the back vessel to the belly vessel.', dEs: 'Cinco pares de lazos de músculo (anillos 7 a 11) rodean el tubo de la comida y se aprietan como corazones. Empujan la sangre roja del vaso de la espalda al vaso de la barriga.' },
  crop:     { en: 'Crop', es: 'Buche', dEn: 'A thin bag in rings 15 and 16 where swallowed food waits its turn.', dEs: 'Una bolsa delgada en los anillos 15 y 16 donde la comida tragada espera su turno.' },
  gizzard:  { en: 'Gizzard', es: 'Molleja', dEn: 'A very strong muscle in rings 17 and 18. It holds tiny grains of sand that grind the food, like teeth inside the tummy!', dEs: 'Un músculo muy fuerte en los anillos 17 y 18. Guarda granitos de arena que muelen la comida, ¡como dientes dentro de la barriga!' },
  intestine:{ en: 'Intestine', es: 'Intestino', dEn: 'The long gut from ring 19 to the tail, where the food is digested and soaked up. A fold inside (the typhlosole) makes more room to absorb. The yellow-green tissue around it helps like a liver.', dEs: 'El intestino largo, del anillo 19 a la cola, donde la comida se digiere y se absorbe. Un pliegue por dentro (el tiflosol) da más espacio para absorber. El tejido amarillo verdoso que lo rodea ayuda como un hígado.' },
  blood:    { en: 'Blood vessels', es: 'Vasos de sangre', dEn: 'A dark red vessel on the back carries blood forward, and a vessel on the belly carries it backward. You can see the back one through the skin! Worm blood is red.', dEs: 'Un vaso rojo oscuro en la espalda lleva la sangre hacia adelante y otro en la barriga la lleva hacia atrás. ¡El de la espalda se ve a través de la piel! La sangre de lombriz es roja.' },
  nerves:   { en: 'Nerve cord', es: 'Cordón nervioso', dEn: 'A white nerve cord runs along the belly with a little knot (ganglion) in every ring. It carries messages between the brain and the whole body.', dEs: 'Un cordón nervioso blanco corre por la barriga con un nudito (ganglio) en cada anillo. Lleva mensajes entre el cerebro y todo el cuerpo.' },
  kidneys:  { en: 'Tiny kidneys', es: 'Riñoncitos', dEn: 'Almost every ring has a pair of tiny coiled tubes called nephridia. They clean the body and get rid of waste water.', dEs: 'Casi todos los anillos tienen un par de tubitos enrollados llamados nefridios. Limpian el cuerpo y sacan el agua de desecho.' },
  repro:    { en: 'Baby-making parts', es: 'Partes para tener bebés', dEn: 'Every earthworm has both boy and girl parts: sperm sacs (seminal vesicles, rings 9 to 12), sperm stores (rings 9 and 10) and ovaries (ring 13). Two worms swap sperm, and then each makes a cocoon.', dEs: 'Cada lombriz tiene partes de niño y de niña: bolsas de esperma (vesículas seminales, anillos 9 a 12), almacenes de esperma (anillos 9 y 10) y ovarios (anillo 13). Dos lombrices se intercambian esperma y cada una hace un capullo.' },
};

const N = 100, D = 0.066, R = 0.17, SEGS = 150, K = N / SEGS;                 // 100 drawn rings stand for ~150 real segments
const SADDLE = [Math.floor(31 * K), Math.ceil(37 * K) - 1];                   // rings that stand for segments 32 to 37
const smooth = THREE.MathUtils.smoothstep, WAVE = 22;
// shape: pointed at the head, a round cylinder along the body, a blunt, slightly flattened tail
const rad = (i) => R * (0.36 + 0.64 * smooth(i, 0, 9)) * (0.82 + 0.18 * smooth(N - 1 - i, 0, 6)) * (i >= SADDLE[0] && i <= SADDLE[1] ? 1.09 : 1);
const flat = (i) => smooth(i, N * 0.7, N - 1);
// real segment numbers → drawn rings (inclusive) and exact positions
const ringsFor = (s0, s1) => { const i0 = Math.max(0, Math.floor((s0 - 1) * K)), i1 = Math.min(N - 2, Math.max(i0, Math.ceil(s1 * K) - 1)); return Array.from({ length: i1 - i0 + 1 }, (_, k) => i0 + k); };
const at = (s) => { const f = (s - 0.5) * K, i = Math.min(N - 1, Math.floor(f)); return { i, dx: -(f - i - 0.5) * D }; };   // ring + offset along the body (head is +x, so a bigger segment number is further back)
const M4 = THREE.Matrix4, Q = new THREE.Quaternion(), P = new THREE.Vector3(), S = new THREE.Vector3(), E = new THREE.Euler();
const local = (x, y, z, sx, sy, sz, rot = null) => new M4().compose(P.set(x, y, z), rot ? Q.setFromEuler(E.set(rot[0], rot[1], rot[2])) : Q.identity(), S.set(sx, sy, sz));

function lay(ext, amp, ph) {
  const xs = [], zs = [], phis = []; let x = 0.1;
  for (let i = 0; i < N; i++) { xs.push(x); zs.push(amp * (0.3 + 0.7 * Math.min(1, i / 20)) * Math.sin(0.1 * i - ph)); if (i < N - 1) x -= D * 0.5 * (ext[i] + ext[i + 1]); }
  for (let i = 0; i < N; i++) { const a = Math.max(0, i - 1), b = Math.min(N - 1, i + 1); phis.push(Math.atan2(zs[b] - zs[a], xs[a] - xs[b])); }
  return { xs, zs, phis };
}

export function build() {
  const root = new THREE.Group();
  root.userData.groundY = -R * 0.9;
  const skinMap = canvasTex(64, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); [[0, '#2c1219'], [0.035, '#3d1a22'], [0.07, '#6b3036'], [0.28, '#85403f'], [0.5, '#a05a56'], [0.78, '#bb8274'], [1, '#d3a08e']].forEach(([t, c]) => g.addColorStop(t, c)); x.fillStyle = g; x.fillRect(0, 0, w, h); });   // the dark line on the back is the back blood vessel showing through
  const skin = mat(0xffffff, { roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.28, map: skinMap, sheen: 0.25, sheenColor: new THREE.Color(0xc98a8a), iridescence: 0.2, iridescenceIOR: 1.2, bumpMap: microBumpTex(91, 20), bumpScale: 0.1, transparent: true });
  const saddleMap = canvasTex(64, 256, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); [[0, '#a8564e'], [0.5, '#d48a7a'], [1, '#e6ae9c']].forEach(([t, c]) => g.addColorStop(t, c)); x.fillStyle = g; x.fillRect(0, 0, w, h); });
  const saddleMat = mat(0xffffff, { roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12, map: saddleMap, sheen: 0.3, sheenColor: new THREE.Color(0xe0a090), bumpMap: microBumpTex(92, 14), bumpScale: 0.15, transparent: true });
  const lipMat = mat(0xa5565e, { roughness: 0.3, clearcoat: 0.9, sheen: 0.4, sheenColor: new THREE.Color(0xe9a8a8), transparent: true });
  const wet = (c, o = {}) => mat(c, { roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.25, ...o });

  const UB = blob(1, 1, 1, null, (v) => { if (v.y < 0) v.y *= 0.84; }, [36, 22]).geometry;       // a unit ring: an egg-shaped bead with a slightly flatter belly
  const SPH = new THREE.SphereGeometry(1, 18, 12), CYL = new THREE.CylinderGeometry(1, 1, 1, 8, 1);
  const TOR = new THREE.TorusGeometry(1, 0.16, 8, 24).rotateY(Math.PI / 2);                       // a loop that goes round the body (in the plane across the worm)
  const KNOT = new THREE.TorusKnotGeometry(1, 0.22, 26, 6, 2, 3);
  const CONE = new THREE.ConeGeometry(0.011, 0.1, 5).translate(0, 0.05, 0);

  const rigs = [];   // every piece: an instanced mesh whose copies each live in one ring (and move with it)
  const inst = (group, geo, material, items) => { const m = new THREE.InstancedMesh(geo, material, items.length); m.frustumCulled = false; group.add(m); rigs.push({ mesh: m, items }); return m; };
  const barLocal = (p0, p1, r) => { const d = p1.clone().sub(p0), len = d.length(), q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.clone().normalize()); return new M4().compose(p0.clone().add(p1).multiplyScalar(0.5), q, V(r, len, r)); };

  // ---------------- the skin: head end, body, saddle, tail
  const headG = new THREE.Group(), bodyG = new THREE.Group(), saddleG = new THREE.Group(), tailG = new THREE.Group();
  const skinItem = (i) => { const r = rad(i), f = flat(i); return { i, m: local(0, 0, 0, D * 3.4, r * 0.96 * (1 - 0.22 * f), r * 1.04 * (1 + 0.12 * f)) }; };
  inst(headG, UB, skin, [0, 1, 2, 3].map(skinItem));
  inst(headG, SPH, lipMat, [{ i: 0, m: local(D * 2.6, R * 0.04, 0, D * 2.6, R * 0.2, R * 0.26) }]);                                       // the prostomium: a fleshy lobe over the mouth
  inst(headG, SPH, wet(0x3a1218), [{ i: 0, m: local(D * 1.3, -R * 0.16, 0, D * 1.1, R * 0.07, R * 0.12) }]);                           // the mouth, underneath ring 1
  inst(bodyG, UB, skin, Array.from({ length: N - 9 }, (_, k) => k + 4).filter((i) => i < SADDLE[0] || i > SADDLE[1]).map(skinItem));
  inst(saddleG, UB, saddleMat, Array.from({ length: SADDLE[1] - SADDLE[0] + 1 }, (_, k) => SADDLE[0] + k).map(skinItem));
  inst(tailG, UB, skin, Array.from({ length: 5 }, (_, k) => N - 5 + k).map(skinItem));
  inst(tailG, SPH, wet(0x6b2c30), [{ i: N - 1, m: local(-D * 1.4, 0, 0, D * 0.5, R * 0.3, R * 0.34) }]);                                // the end (with the anus: a small slit)
  root.add(part('head', 'head', headG, categories.head)); root.add(part('body', 'body', bodyG, categories.body)); root.add(part('saddle', 'saddle', saddleG, categories.saddle)); root.add(part('tail', 'tail', tailG, categories.tail));

  // ---------------- bristles: four pairs, two near the belly and two on the sides, on every ring except the first and the last
  const bristleG = new THREE.Group(), bItems = [];
  for (let i = 1; i < N - 1; i++) for (const sg of [-1, 1]) for (const deg of [16, 34, 62, 80]) { const a = deg * Math.PI / 180, dir = V(0, -Math.cos(a), sg * Math.sin(a)).normalize(); bItems.push({ i, dyn: true, off: V(0, dir.y * rad(i) * 0.82, dir.z * rad(i) * 0.9), quat: new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), dir) }); }
  inst(bristleG, CONE, wet(0xe8c9a0, { roughness: 0.5, clearcoat: 0.2 }), bItems);
  root.add(part('bristles', 'bristles', bristleG, categories.bristles));

  // ---------------- the inside (each at its real ring numbers)
  const brainG = new THREE.Group(), r3 = ringsFor(3, 3), r4 = ringsFor(4, 4);
  inst(brainG, SPH, wet(0xf2ead6), r3.flatMap((i) => [-1, 1].map((sg) => ({ i, m: local(0, rad(i) * 0.44, sg * rad(i) * 0.15, D * 0.9, rad(i) * 0.13, rad(i) * 0.15) }))));          // the two lobes of the brain on top of the throat
  inst(brainG, CYL, wet(0xf2ead6), r3.map((i) => ({ i, m: barLocal(V(0, rad(i) * 0.44, -rad(i) * 0.12), V(0, rad(i) * 0.44, rad(i) * 0.12), rad(i) * 0.04) })));
  root.add(part('brain', 'brain', brainG, categories.brain));

  const pharG = new THREE.Group();
  inst(pharG, SPH, wet(0xd98d86), ringsFor(3, 5).map((i) => ({ i, m: local(0, 0, 0, D * 1.7, rad(i) * 0.52, rad(i) * 0.56) })));                      // the muscular throat
  inst(pharG, SPH, wet(0xc4707a, { transparent: true, opacity: 0.9 }), ringsFor(1, 2).map((i) => ({ i, m: local(0, -rad(i) * 0.04, 0, D * 1.5, rad(i) * 0.34, rad(i) * 0.4) })));      // the mouth cavity
  root.add(part('pharynx', 'pharynx', pharG, categories.pharynx));

  const esoG = new THREE.Group();
  inst(esoG, SPH, wet(0xe8b3a4), ringsFor(6, 13).map((i) => ({ i, m: local(0, 0, 0, D * 1.7, rad(i) * 0.2, rad(i) * 0.2) })));                           // the thin food tube
  inst(esoG, SPH, wet(0xf3ead8), ringsFor(10, 11).flatMap((i) => [-1, 1].map((sg) => ({ i, m: local(0, -rad(i) * 0.03, sg * rad(i) * 0.42, D * 1.4, rad(i) * 0.2, rad(i) * 0.22) }))));   // the chalky pouches
  inst(esoG, SPH, wet(0xf6f1e6), ringsFor(12, 13).flatMap((i) => [-1, 1].map((sg) => ({ i, m: local(0, -rad(i) * 0.02, sg * rad(i) * 0.4, D * 1.5, rad(i) * 0.25, rad(i) * 0.3) }))));      // the calcium glands
  root.add(part('esophagus', 'esophagus', esoG, categories.esophagus));

  const heartG = new THREE.Group(), hItems = [];
  for (let s = 7; s <= 11; s++) { const a = at(s), r = rad(a.i); hItems.push({ i: a.i, dyn: true, kind: 'heart', base: local(a.dx, 0, 0, r * 0.4, r * 0.4, r * 0.4), s }); }
  inst(heartG, TOR, wet(0xcc2b22, { clearcoat: 1 }), hItems);                                                                                             // five loops round the food tube that squeeze like hearts
  root.add(part('hearts', 'hearts', heartG, categories.hearts));

  const cropG = new THREE.Group(); inst(cropG, SPH, wet(0xe9c7b4, { transparent: true, opacity: 0.92 }), ringsFor(15, 16).map((i) => ({ i, m: local(0, 0, 0, D * 2.0, rad(i) * 0.62, rad(i) * 0.64) }))); root.add(part('crop', 'crop', cropG, categories.crop));
  const gizG = new THREE.Group(); inst(gizG, SPH, wet(0xb7a58b, { roughness: 0.55 }), ringsFor(17, 18).map((i) => ({ i, m: local(0, 0, 0, D * 2.3, rad(i) * 0.58, rad(i) * 0.6) }))); root.add(part('gizzard', 'gizzard', gizG, categories.gizzard));
  const intG = new THREE.Group(); inst(intG, SPH, wet(0xb9a24a, { roughness: 0.5 }), ringsFor(19, SEGS).filter((i) => i < N - 2).map((i) => ({ i, m: local(0, 0, 0, D * 1.7, rad(i) * 0.46, rad(i) * 0.5) }))); root.add(part('intestine', 'intestine', intG, categories.intestine));

  const bloodG = new THREE.Group();
  inst(bloodG, SPH, wet(0x6e1010), Array.from({ length: N - 3 }, (_, i) => ({ i, m: local(0, rad(i) * 0.58, 0, D * 1.6, rad(i) * 0.075, rad(i) * 0.075) })));      // the dark vessel on the back
  inst(bloodG, SPH, wet(0xa8352a), Array.from({ length: N - 3 }, (_, i) => i).filter((i) => i > 2).map((i) => ({ i, m: local(0, -rad(i) * 0.55, 0, D * 1.6, rad(i) * 0.055, rad(i) * 0.055) })));   // the vessel on the belly
  root.add(part('blood', 'blood', bloodG, categories.blood));

  const nerveG = new THREE.Group();
  inst(nerveG, SPH, wet(0xf1ead8), Array.from({ length: N - 3 }, (_, i) => i).filter((i) => i > 4).map((i) => ({ i, m: local(0, -rad(i) * 0.68, 0, D * 1.6, rad(i) * 0.055, rad(i) * 0.1) })));       // the cord along the belly
  inst(nerveG, SPH, wet(0xfaf5e8), Array.from({ length: N - 3 }, (_, i) => i).filter((i) => i > 4).map((i) => ({ i, m: local(0, -rad(i) * 0.7, 0, D * 0.8, rad(i) * 0.1, rad(i) * 0.15) })));         // a little knot (ganglion) in every ring
  inst(nerveG, SPH, wet(0xfaf5e8), r4.map((i) => ({ i, m: local(0, -rad(i) * 0.58, 0, D * 0.9, rad(i) * 0.12, rad(i) * 0.2) })));                                                                    // the ganglion under the throat
  inst(nerveG, CYL, wet(0xf1ead8), r3.flatMap((i) => [-1, 1].map((sg) => ({ i, m: barLocal(V(0, rad(i) * 0.44, sg * rad(i) * 0.15), V(-D * 1.1, -rad(i) * 0.58, sg * rad(i) * 0.3), rad(i) * 0.03) }))));   // the collar of nerves round the throat
  root.add(part('nerves', 'nerves', nerveG, categories.nerves));

  const kidG = new THREE.Group(); inst(kidG, KNOT, wet(0xf1e7c9), Array.from({ length: N - 4 }, (_, i) => i).filter((i) => i > 4).flatMap((i) => [-1, 1].map((sg) => ({ i, m: local(0, -rad(i) * 0.2, sg * rad(i) * 0.66, rad(i) * 0.1, rad(i) * 0.1, rad(i) * 0.1) })))); root.add(part('kidneys', 'kidneys', kidG, categories.kidneys));

  const repG = new THREE.Group();
  inst(repG, SPH, wet(0xf0e2b8), ringsFor(9, 12).flatMap((i) => [-1, 1].map((sg) => ({ i, m: local(0, rad(i) * 0.12, sg * rad(i) * 0.4, D * 1.5, rad(i) * 0.28, rad(i) * 0.3) }))));        // the sperm sacs (seminal vesicles)
  inst(repG, SPH, wet(0xffffff), [9, 10].flatMap((s) => { const a = at(s); return [-1, 1].map((sg) => ({ i: a.i, m: local(a.dx, -rad(a.i) * 0.14, sg * rad(a.i) * 0.55, rad(a.i) * 0.1, rad(a.i) * 0.1, rad(a.i) * 0.1) })); }));   // the sperm stores (spermathecae)
  inst(repG, SPH, wet(0xf6d7c8), [13].flatMap((s) => { const a = at(s); return [-1, 1].map((sg) => ({ i: a.i, m: local(a.dx, -rad(a.i) * 0.36, sg * rad(a.i) * 0.16, rad(a.i) * 0.1, rad(a.i) * 0.07, rad(a.i) * 0.07) })); }));   // the ovaries
  root.add(part('repro', 'repro', repG, categories.repro));

  root.userData.rigs = { rigs };
  motion(root);   // put every piece in its place straight away (so the camera frames the whole worm)
  return root;
}

export function motion(root) {
  const { rigs } = root.userData.rigs;
  const st = { mode: null, walk: 0, fly: 0, cycle: 0, t: 0 };
  const ringM = Array.from({ length: N }, () => new M4()), tmp = new M4(), loc = new M4(), qY = new THREE.Quaternion(), ax = new THREE.Vector3(0, 1, 0), pp = new THREE.Vector3(), sc = new THREE.Vector3();
  const m = {
    canFly: false, state: st, walkLabel: { en: 'Crawl', es: 'Arrastrarse' },
    setMode(mode) { st.mode = st.mode === mode ? null : mode; return st.mode; },
    snap() { st.mode = null; st.walk = st.fly = 0; this.update(0.0001); },
    update(dt) {
      st.walk += ((st.mode === 'walk' ? 1 : 0) - st.walk) * (1 - Math.exp(-dt * 6)); if (st.walk < 0.001) st.walk = 0;
      st.t += dt; st.cycle += dt * 0.45 * (st.walk > 0.02 ? 1 : 0);
      const A = st.walk, ph = st.cycle * Math.PI * 2, ext = [], thick = [], fat = [];
      for (let i = 0; i < N; i++) { const s = Math.sin((i / WAVE - st.cycle) * Math.PI * 2); ext.push(1 - 0.4 * A * s); thick.push(1 + 0.28 * A * s); fat.push(Math.max(0, s)); }   // waves of squeezing (short, fat) and stretching (long, thin) run from head to tail
      const L = lay(ext, 0.08 * A + 0.01 * Math.sin(st.t * 0.7), ph * 0.5);
      for (let i = 0; i < N; i++) ringM[i].compose(pp.set(L.xs[i], 0, L.zs[i]), qY.setFromAxisAngle(ax, -L.phis[i]), sc.set(ext[i], thick[i], thick[i]));
      for (const { mesh, items } of rigs) {
        for (let k = 0; k < items.length; k++) {
          const it = items[k];
          if (!it.dyn) loc.copy(it.m);
          else if (it.kind === 'heart') { const beat = Math.pow(Math.max(0, Math.sin(st.t * 7 - it.s * 0.5)), 3), f = 1 + 0.22 * beat; loc.copy(it.base); const e = loc.elements; e[0] *= f; e[1] *= f; e[2] *= f; e[4] *= f; e[5] *= f; e[6] *= f; e[8] *= f; e[9] *= f; e[10] *= f; }   // the hearts squeeze
          else loc.compose(it.off, it.quat, sc.set(1, 0.5 + 0.9 * A * fat[it.i], 1));   // bristles stick out and grip where the ring is fat
          tmp.multiplyMatrices(ringM[it.i], loc); mesh.setMatrixAt(k, tmp);
        }
        mesh.instanceMatrix.needsUpdate = true;
      }
      return 0.4 * A;
    },
  };
  m.update(0.0001);
  return m;
}
