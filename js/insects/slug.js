// Leopard slug (Limax maximus) — a land mollusc (gastropod) like the snail, but its shell is a tiny plate hidden inside. Built from the species' anatomy:
//  OUTSIDE: a long soft body (10–20 cm), pale grey-brown with black spots: blotches on the mantle, broken black stripes along the sides · the MANTLE (shield) covers the front third behind the head,
//   rounded in front and angular behind, with the breathing hole (pneumostome) on its RIGHT edge just behind the middle; the anus and the kidney opening sit just inside it · the tail carries a short
//   KEEL (a ridge along the top of the back third) · the skin is divided into long tubercles by grooves · a flat sole with three long bands · two long upper tentacles with eyes, two short lower ones ·
//   the mating opening (gonopore) on the right side of the head behind the tentacles · colourless iridescent slime.
//  INSIDE: a thin oval internal shell (about 1/10 of the body length) under the back of the mantle, in the roof of the lung · the lung under the mantle, with the heart (atrium in front, ventricle behind)
//   on its LEFT and the big creamy kidney on its roof to the right of the heart · buccal mass with jaw and radula, two unequal salivary glands (the right one big and on top, the left long and thin on the floor) ·
//   nerve ring round the gullet · a long thin-walled crop running back along the right, the stomach at the front of the digestive gland, two big pale digestive gland lobes filling the back, an intestine of
//   five limbs looping on the left and the rectum crossing to the anus by the breathing hole · ovotestis at the very back, hermaphroditic duct, albumen gland in the middle, a coiled spermoviduct, seminal
//   receptacle and penis near the gonopore · retractor muscles from the tentacles and head joining into one tendon under the lung.
// Sources: Invertebrate Anatomy OnLine (Lander University) "Limax maximus"; Wikipedia "Limax maximus".
import * as THREE from '../../vendor/three.module.min.js';
import { V, mat, part, canvasTex, tube } from './lib.js';

export const info = {
  id: 'slug', icon: '🐌',
  name: { en: 'Leopard Slug', es: 'Babosa leopardo' },
  sci: 'Limax maximus',
  blurb: { en: 'Not an insect! A snail cousin with spots like a leopard. Its shell is a tiny plate hidden inside its back.', es: '¡No es un insecto! Un primo del caracol con manchas de leopardo. Su concha es una placa diminuta escondida dentro de la espalda.' },
  cameraDir: V(0.35, 0.55, 1.0).normalize(),
};

export const categories = {
  body:     { skin: true, en: 'Body and foot', es: 'Cuerpo y pie', dEn: 'A slug is a snail that keeps its shell inside! The long soft body is grey with black spots and stripes. The skin is made of long bumps (tubercles) with grooves between them that carry slime all over the body. Underneath is the foot, a flat sole with three long bands that ripples to glide along.', dEs: '¡Una babosa es un caracol que guarda la concha por dentro! El cuerpo largo y blando es gris con manchas y rayas negras. La piel está hecha de bultos largos (tubérculos) con surcos entre ellos que llevan baba por todo el cuerpo. Debajo está el pie, una planta plana con tres bandas largas que ondula para deslizarse.' },
  mantle:   { skin: true, en: 'Mantle and breathing hole', es: 'Manto y agujero para respirar', dEn: 'The thick oval shield behind the head is the mantle. It is round at the front and pointed at the back, and it is covered in leopard blotches. On its right edge, just behind the middle, is the round breathing hole (pneumostome). It opens and closes to let air into the lung.', dEs: 'El escudo ovalado y grueso detrás de la cabeza es el manto. Es redondo adelante y puntiagudo atrás, y está cubierto de manchas de leopardo. En su borde derecho, justo detrás del medio, está el agujero redondo para respirar (neumostoma). Se abre y se cierra para dejar entrar aire al pulmón.' },
  head:     { skin: true, en: 'Head and mouth', es: 'Cabeza y boca', dEn: 'A small head with the mouth underneath. On the right side, behind the tentacles, is the little opening used for mating. Two leopard slugs climb up high and hang from a thick rope of slime to mate!', dEs: 'Una cabeza pequeña con la boca por debajo. En el lado derecho, detrás de los tentáculos, está la pequeña abertura que se usa para aparearse. ¡Dos babosas leopardo suben alto y se cuelgan de una cuerda gruesa de baba para aparearse!' },
  tentacles:{ skin: true, en: 'Tentacles', es: 'Tentáculos', dEn: 'Four tentacles, like a snail. The long upper pair has an eye at each tip. The short lower pair smells and feels the ground. Each one can be pulled in by turning it inside out.', dEs: 'Cuatro tentáculos, como el caracol. El par largo de arriba tiene un ojo en cada punta. El par corto de abajo huele y toca el suelo. Cada uno se puede meter dándole la vuelta como un guante.' },
  keel:     { skin: true, en: 'Tail keel', es: 'Quilla de la cola', dEn: 'The back third of the body has a ridge along the top, like the keel of a boat. The tail is pointed. The keel helps tell a leopard slug apart from other big slugs.', dEs: 'El último tercio del cuerpo tiene una cresta por encima, como la quilla de un barco. La cola es puntiaguda. La quilla ayuda a distinguir a la babosa leopardo de otras babosas grandes.' },
  shell:    { en: 'Hidden shell', es: 'Concha escondida', dEn: 'Yes, a slug has a shell! It is a thin, whitish oval plate about as long as your fingernail, hidden under the back of the mantle. Long ago, the slug\'s ancestors had a shell on the outside, like a snail.', dEs: '¡Sí, la babosa tiene concha! Es una placa ovalada, delgada y blancuzca, del largo de una uña, escondida bajo la parte de atrás del manto. Hace mucho, los antepasados de la babosa tenían la concha por fuera, como el caracol.' },
  lung:     { en: 'Lung', es: 'Pulmón', dEn: 'Under the mantle is a flat air space: the lung. Its roof is full of tiny blood vessels that take in oxygen. Air gets in and out through the breathing hole on the right.', dEs: 'Debajo del manto hay un espacio plano con aire: el pulmón. Su techo está lleno de vasos diminutos que toman el oxígeno. El aire entra y sale por el agujero de respirar, a la derecha.' },
  heart:    { en: 'Heart', es: 'Corazón', dEn: 'A small two-roomed heart sits in a little bag on the left side of the lung: the atrium in front gets the fresh blood from the lung, and the ventricle behind pumps it out. The blood then flows around the organs.', dEs: 'Un corazón pequeño de dos cuartos está en una bolsita en el lado izquierdo del pulmón: la aurícula de adelante recibe la sangre fresca del pulmón y el ventrículo de atrás la bombea. Luego la sangre baña los órganos.' },
  kidney:   { en: 'Kidney', es: 'Riñón', dEn: 'A big creamy-white kidney on the roof of the lung, to the right of the heart, cleans the blood. Its waste tube runs to a tiny opening right next to the anus, inside the breathing hole.', dEs: 'Un riñón grande, blanco cremoso, en el techo del pulmón a la derecha del corazón, limpia la sangre. Su tubo de desechos va a una abertura diminuta junto al ano, dentro del agujero de respirar.' },
  mouth:    { en: 'Jaw, radula and spit glands', es: 'Mandíbula, rádula y glándulas de saliva', dEn: 'The round muscle in the head is the buccal mass. A hard jaw on top bites, and the radula, a ribbon of tiny teeth, scrapes. Two white salivary glands are not twins: the right one is big and sits on top, the left one is long and thin on the floor.', dEs: 'El músculo redondo de la cabeza es la masa bucal. Una mandíbula dura arriba muerde y la rádula, una cinta de dientitos, raspa. Dos glándulas salivales blancas no son gemelas: la derecha es grande y está arriba, la izquierda es larga y delgada en el piso.' },
  nerves:   { en: 'Brain (nerve ring)', es: 'Cerebro (anillo nervioso)', dEn: 'A ring of nerve lumps (ganglia) around the food tube behind the mouth is the brain. The pair on top are the cerebral ganglia; nerves run from them up the tentacles to the eyes.', dEs: 'Un anillo de bultitos de nervios (ganglios) alrededor del tubo de la comida, detrás de la boca, es el cerebro. El par de arriba son los ganglios cerebrales; de ellos salen nervios que suben por los tentáculos hasta los ojos.' },
  gut:      { en: 'Gut', es: 'Intestino', dEn: 'Food goes down a short tube into a long thin bag, the crop, that runs back along the right side. At the back it widens into the stomach. Then the intestine loops back and forth five times on the left side, and the last part crosses over to the anus next to the breathing hole.', dEs: 'La comida baja por un tubo corto a una bolsa larga y delgada, el buche, que va hacia atrás por el lado derecho. Al fondo se ensancha en el estómago. Luego el intestino va y viene cinco veces por el lado izquierdo, y la última parte cruza hasta el ano, junto al agujero de respirar.' },
  digestive:{ en: 'Digestive gland', es: 'Glándula digestiva', dEn: 'Two big pale lobes fill the back of the body around the stomach. They finish digesting the food and store energy, like a liver.', dEs: 'Dos lóbulos grandes y pálidos llenan la parte de atrás del cuerpo alrededor del estómago. Terminan de digerir la comida y guardan energía, como un hígado.' },
  repro1:   { en: 'Egg and sperm makers', es: 'Fábrica de huevos y esperma', dEn: 'Slugs are hermaphrodites: each one has both boy and girl parts. The dark ovotestis at the very back makes sperm and eggs. A thin twisty duct carries them forward to the pale yellow albumen gland in the middle, which makes the egg jelly, and then into a thick coiled tube, the spermoviduct.', dEs: 'Las babosas son hermafroditas: cada una tiene partes de niño y de niña. El ovotestis oscuro, en el fondo, hace esperma y huevos. Un conducto delgado y retorcido los lleva adelante a la glándula de la albúmina, amarilla pálida, en el medio, que hace la gelatina del huevo, y luego a un tubo grueso y enrollado, el espermoviducto.' },
  repro2:   { en: 'Mating parts', es: 'Partes para aparearse', dEn: 'Near the head, on the right: the white penis (kept inside until mating), a round white sperm store (seminal receptacle) and the mating opening. A thin muscle pulls the penis back in.', dEs: 'Cerca de la cabeza, a la derecha: el pene blanco (guardado adentro hasta el apareamiento), un almacén redondo y blanco de esperma (receptáculo seminal) y la abertura de apareamiento. Un músculo delgado vuelve a meter el pene.' },
  muscles:  { en: 'Pull-in muscles', es: 'Músculos para esconder', dEn: 'White bands run from the tentacles and the head back into the body and join into one cord fastened under the lung. They pull the tentacles and head in, turning the tentacles inside out.', dEs: 'Unas bandas blancas van desde los tentáculos y la cabeza hacia atrás por el cuerpo y se unen en una cuerda sujeta bajo el pulmón. Meten los tentáculos y la cabeza, dando la vuelta a los tentáculos.' },
};

const PI2 = Math.PI * 2, smooth = THREE.MathUtils.smoothstep;
const key = (keys, t) => { for (let i = 0; i < keys.length - 1; i++) if (t <= keys[i + 1][0]) { const [t0, v0] = keys[i], [t1, v1] = keys[i + 1]; return v0 + (v1 - v0) * smooth(t, t0, t1); } return keys[keys.length - 1][1]; };
const X0 = -2.6, X1 = 2.4, LEN = X1 - X0;                                                     // tail tip → front of the head
const MX0 = 0.35, MX1 = 1.95;                                                                 // the mantle covers the front third
const wKey = [[0, 0.03], [0.06, 0.16], [0.18, 0.3], [0.32, 0.38], [0.5, 0.44], [0.62, 0.45], [0.9, 0.38], [0.97, 0.28], [1, 0.12]];
const hKey = [[0, 0.03], [0.06, 0.16], [0.18, 0.3], [0.32, 0.42], [0.5, 0.5], [0.62, 0.53], [0.86, 0.5], [0.93, 0.42], [0.97, 0.34], [1, 0.16]];
const tOf = (x) => (x - X0) / LEN, wAt = (x) => key(wKey, tOf(x)), hAt = (x) => key(hKey, tOf(x));
const P = V(0.9, 0, 0);                                                                       // everything scrunches up towards this point

export function build() {
  const root = new THREE.Group();
  root.userData.groundY = -0.01;
  const wet = (c, o = {}) => mat(c, { roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.28, ...o });
  const grooves = (x, w, h, line, a, cx = 34, cy = 11) => {                       // long tubercles: a net of grooves with cells stretched along the body
    const nx = Math.ceil(w / cx) + 2, ny = Math.ceil(h / cy) + 2, pts = [];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) pts.push([(i - 0.5 + (j % 2) * 0.5 + (Math.random() - 0.5) * 0.5) * cx, (j - 0.5 + (Math.random() - 0.5) * 0.5) * cy]);
    x.strokeStyle = line; x.globalAlpha = a; x.lineWidth = 2; x.lineCap = 'round'; x.beginPath();
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) { const p = pts[j * nx + i], r = pts[j * nx + i + 1], d = pts[(j + 1) * nx + i]; x.moveTo(p[0], p[1]); x.lineTo(r[0], r[1]); x.moveTo(p[0], p[1]); x.lineTo(d[0], d[1]); }
    x.stroke(); x.globalAlpha = 1;
  };
  const dash = (x, w, h, v, n, len, wd, a, jitter = 0.012) => { x.fillStyle = `rgba(20,16,14,${a})`; for (let i = 0; i < n; i++) { const px = Math.random() * w, py = (v + (Math.random() - 0.5) * jitter) * h, l = len * (0.5 + Math.random()); x.beginPath(); x.ellipse(px, py, l, wd * (0.6 + Math.random() * 0.8), 0, 0, 7); x.fill(); } };
  // body skin: u runs along the body (tail → head), v round it (right side at the ground → top → left side → sole). Ash grey-brown with rows of black dashes along the sides, a pale sole with three bands.
  const skinMap = canvasTex(1024, 512, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); [[0, '#b2a088'], [0.12, '#a08c72'], [0.25, '#948066'], [0.38, '#a08c72'], [0.5, '#b2a088'], [0.52, '#d6cbb4'], [1, '#dcd2bc']].forEach(([t, c]) => g.addColorStop(t, c)); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (const [v, n] of [[0.075, 90], [0.15, 110], [0.215, 70], [0.285, 70], [0.35, 110], [0.425, 90]]) dash(x, w, h * 1, v, n, 14, 5, 0.85);        // three broken stripes a side (the dashes tend to join into lines towards the tail)
    x.globalAlpha = 0.6; x.fillStyle = '#e4ddcb'; x.fillRect(0, 0.235 * h, w * 0.3, 0.03 * h); x.globalAlpha = 1;                                   // the pale keel along the top of the tail
    x.fillStyle = 'rgba(120,110,95,.5)'; for (const v of [0.667, 0.833]) x.fillRect(0, v * h - 1.5, w, 3);                                           // the two grooves that divide the sole into three bands
    grooves(x, w, h * 0.5, '#4a423a', 0.6);
    const gh = x.createLinearGradient(w * 0.86, 0, w * 0.92, 0); gh.addColorStop(0, 'rgba(190,140,95,0)'); gh.addColorStop(1, 'rgba(190,140,95,1)'); x.fillStyle = gh; x.fillRect(w * 0.86, 0, w * 0.14, h * 0.5);   // the head and neck are plain tan-orange, with no spots
  });
  const bumpMap = canvasTex(1024, 512, (x, w, h) => { x.fillStyle = '#c8c8c8'; x.fillRect(0, 0, w, h); grooves(x, w, h * 0.5, '#303030', 1); x.fillStyle = '#b0b0b0'; x.fillRect(0, h * 0.5, w, h * 0.5); }, { srgb: false });
  skinMap.flipY = bumpMap.flipY = false;                                                           // v = 0 is the top row of the canvas (the right side at the ground), v = 1 the bottom
  const skin = mat(0xffffff, { roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.15, map: skinMap, bumpMap, bumpScale: 0.7, sheen: 0.3, sheenColor: new THREE.Color(0xd9d2c4), iridescence: 0.25, iridescenceIOR: 1.25, transparent: true });
  const mantleMap = canvasTex(512, 512, (x, w, h) => {                                             // the shield: darker grey with leopard blotches
    const g = x.createLinearGradient(0, 0, 0, h); [[0, '#a89176'], [0.5, '#8f7a62'], [1, '#a89176']].forEach(([t, c]) => g.addColorStop(t, c)); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) { const px = w * (0.08 + 0.84 * Math.random()), py = h * (0.08 + 0.84 * Math.random()), r = 9 + Math.random() * 16; x.fillStyle = 'rgba(20,16,14,.88)'; x.beginPath(); for (let k = 0; k <= 12; k++) { const an = (k / 12) * PI2, rr = r * (0.7 + 0.5 * Math.random()); x.lineTo(px + rr * Math.cos(an) * 1.3, py + rr * Math.sin(an)); } x.closePath(); x.fill(); }
    grooves(x, w, h, '#4a423a', 0.35, 18, 14);
  });
  mantleMap.flipY = false;
  const mantleMat = mat(0xffffff, { roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.12, map: mantleMap, sheen: 0.3, sheenColor: new THREE.Color(0xd9d2c4), iridescence: 0.3, iridescenceIOR: 1.25, transparent: true });
  const tentMat = wet(0xa0764f, { roughness: 0.35, clearcoat: 0.9, transparent: true });

  const frame = () => { const g = new THREE.Group(); g.position.copy(P); return g; };
  const W = (v) => v.clone().sub(P);
  const sph = (pos, rx, ry, rz, mt) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), mt); m.position.copy(W(pos)); m.scale.set(rx, ry, rz); return m; };
  const tubeThrough = (pts, rf, mt, o = {}) => tube(pts.map(W), typeof rf === 'function' ? rf : () => rf, mt, { segs: o.segs ?? 40, radial: o.radial ?? 10 });
  const sectionTop = (t, a, keel) => Math.pow(Math.max(0, Math.sin(a)), 0.62) * (1 + keel * 0.28 * Math.exp(-Math.pow((a - Math.PI / 2) / 0.22, 2)));      // the arch of a cross-section; the tail's keel is a ridge on top

  // ======================= BODY: a loft that is rebuilt every frame (so it can ripple and scrunch up)
  const NR = 72, MR = 30;
  const bpos = new Float32Array(NR * MR * 3), buv = new Float32Array(NR * MR * 2), bidx = [];
  for (let i = 0; i < NR; i++) for (let j = 0; j < MR; j++) { buv[(i * MR + j) * 2] = i / (NR - 1); buv[(i * MR + j) * 2 + 1] = j / MR; }
  for (let i = 0; i < NR - 1; i++) for (let j = 0; j < MR; j++) { const a = i * MR + j, b = i * MR + ((j + 1) % MR), c = (i + 1) * MR + j, d = (i + 1) * MR + ((j + 1) % MR); bidx.push(a, c, b, b, c, d); }
  const bgeo = new THREE.BufferGeometry(); bgeo.setAttribute('position', new THREE.BufferAttribute(bpos, 3)); bgeo.setAttribute('uv', new THREE.BufferAttribute(buv, 2)); bgeo.setIndex(bidx);
  const bodyMesh = new THREE.Mesh(bgeo, skin); bodyMesh.frustumCulled = false;
  const bodyF = frame(); bodyF.add(bodyMesh);
  root.add(part('body', 'body', (() => { const g = new THREE.Group(); g.add(bodyF); return g; })(), categories.body));
  const JT = 16;                                                                              // ring points 0..JT-1 make the arch, the rest the sole
  const fillBody = (cyc, walk, curl) => {
    for (let i = 0; i < NR; i++) {
      const t = i / (NR - 1), x = X0 + LEN * t, w = key(wKey, t), h = key(hKey, t), keel = smooth(-x, 0.9, 1.4) * (1 - smooth(t, 0, 0.03));
      const wave = Math.sin((t * 7 - cyc) * PI2), stretch = 1 + 0.05 * walk * wave, lift = 0.025 * walk * Math.max(0, wave);
      const sx = (x - P.x) * (1 - 0.38 * curl) * stretch + P.x, hh = h * (1 + 0.55 * curl) * (1 - 0.04 * walk * wave), ww = w * (1 + 0.25 * curl);
      for (let j = 0; j < MR; j++) {
        let z, y; if (j < JT) { const a = (Math.PI * j) / (JT - 1); z = ww * Math.cos(a); y = hh * sectionTop(t, a, keel); } else { z = -ww + (2 * ww * (j - (JT - 1))) / (MR - JT + 1); y = lift * (1 - Math.abs(z) / Math.max(ww, 1e-3)); }
        const o = (i * MR + j) * 3; bpos[o] = sx - P.x; bpos[o + 1] = y; bpos[o + 2] = z - P.z;
      }
    }
    bgeo.attributes.position.needsUpdate = true; bgeo.computeVertexNormals();
  };
  fillBody(0, 0, 0);

  // ======================= KEEL: the ridge on the tail is part of the body loft; this part is the tail tip and lets the child tap "the keel"
  const keelF = frame(); { const pts = []; for (let k = 0; k <= 12; k++) { const x = -2.5 + (1.5 * k) / 12; pts.push(V(x, hAt(x) * 1.0 + 0.012, 0)); } keelF.add(tubeThrough(pts, (t) => 0.022 + 0.012 * Math.sin(t * Math.PI), wet(0xe0d8c6, { roughness: 0.35, transparent: true }), { segs: 24, radial: 8 })); }
  root.add(part('keel', 'keel', (() => { const g = new THREE.Group(); g.add(keelF); return g; })(), categories.keel));

  // ======================= MANTLE (shield): a raised oval over the front third, rounded in front, angular behind, with the breathing hole on its right edge
  const mantleF = frame(); {
    const NU = 40, NV = 20, mp = [], mu = [], mi = [];
    for (let i = 0; i <= NU; i++) {
      const s = i / NU, x = MX0 + (MX1 - MX0) * s, edge = s < 0.3 ? Math.sqrt(1 - Math.pow(1 - s / 0.3, 2)) : s > 0.75 ? Math.pow((1 - s) / 0.25, 0.55) : 1;   // rounded front, pointed back
      const w = (wAt(x) + 0.05) * edge, h = hAt(x);
      for (let j = 0; j <= NV; j++) { const a = (Math.PI * j) / NV, lip = j === 0 || j === NV ? -0.04 : 0; const z = w * Math.cos(a), y = h * Math.pow(Math.max(0, Math.sin(a)), 0.7) + 0.085 * edge * Math.pow(Math.sin(a), 0.5) + lip; mp.push(x, y, z); mu.push(s, j / NV); }
    }
    for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const a = i * (NV + 1) + j, b = a + 1, c = a + NV + 1, d = c + 1; mi.push(a, c, b, b, c, d); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(mp, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(mu, 2)); g.setIndex(mi); g.computeVertexNormals(); g.translate(-P.x, 0, 0);
    const m = new THREE.Mesh(g, mantleMat); mantleF.add(m);
    const px = MX0 + (MX1 - MX0) * 0.58;                                                   // the breathing hole: right edge, just behind the middle of the mantle
    mantleF.add(sph(V(px, hAt(px) * 0.55 + 0.05, wAt(px) + 0.03), 0.075, 0.07, 0.045, wet(0x1a1512)));
    mantleF.add(sph(V(px, hAt(px) * 0.55 + 0.05, wAt(px) + 0.02), 0.11, 0.1, 0.03, wet(0x8c8477, { transparent: true })));   // the thick rim round it
  }
  root.add(part('mantle', 'mantle', (() => { const g = new THREE.Group(); g.add(mantleF); return g; })(), categories.mantle));

  // ======================= HEAD: mouth under the front, the mating opening on the right
  const headF = frame();
  headF.add(sph(V(2.37, 0.07, 0), 0.03, 0.03, 0.09, wet(0x2a1a14)));                            // the mouth slit, underneath
  for (const s of [-1, 1]) headF.add(sph(V(2.3, 0.09, s * 0.07), 0.07, 0.05, 0.06, wet(0xc9a07a, { transparent: true })));   // the lips
  headF.add(sph(V(2.0, 0.3, wAt(2.0) * 0.92), 0.04, 0.045, 0.03, wet(0x3b2a20)));                 // the mating opening (gonopore), right side behind the tentacles
  root.add(part('head', 'head', (() => { const g = new THREE.Group(); g.add(headF); return g; })(), categories.head));

  // ======================= TENTACLES: two long upper ones with eyes, two short lower feelers (they sway and turn inside out to pull in)
  const tentF = frame(), nerveF = frame(), tents = [];
  const UPB = (s) => V(2.12, 0.47, s * 0.11), UPD = (s) => V(0.5, 0.8, s * 0.38), UPL = 1.05;
  const mkTent = (base, dir, len, r0, r1, upper) => {
    const pv = new THREE.Group(); pv.position.copy(W(base)); pv.quaternion.setFromUnitVectors(V(0, 1, 0), dir.clone().normalize());
    pv.add(new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 12, 1).translate(0, len / 2, 0), tentMat));
    if (upper) { const knob = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), tentMat); knob.position.set(0, len, 0); knob.scale.set(0.045, 0.05, 0.045); pv.add(knob); const eye = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), wet(0x050505, { roughness: 0.1, clearcoat: 1 })); eye.position.set(0.015, len + 0.025, 0.032); eye.scale.setScalar(0.02); pv.add(eye); }
    else { const tip = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 10), tentMat); tip.position.set(0, len, 0); tip.scale.set(r1 * 1.1, r1 * 1.3, r1 * 1.1); pv.add(tip); }
    let nv = null;
    if (upper) { nv = new THREE.Group(); nv.position.copy(pv.position); nv.quaternion.copy(pv.quaternion); nv.add(new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.012, len * 0.96, 8).translate(0, len * 0.48, 0), wet(0xf1ead6))); nerveF.add(nv); }
    tentF.add(pv); tents.push({ pv, nv, base: pv.quaternion.clone() });
  };
  for (const s of [-1, 1]) { mkTent(UPB(s), UPD(s), UPL, 0.055, 0.026, true); mkTent(V(2.33, 0.17, s * 0.09), V(0.8, -0.3, s * 0.5), 0.36, 0.045, 0.026, false); }
  root.add(part('tentacles', 'tentacles', (() => { const g = new THREE.Group(); g.add(tentF); return g; })(), categories.tentacles));

  // ======================= INSIDE
  const shellF = frame(); { const sx = 0.72; shellF.add(sph(V(sx, hAt(sx) + 0.03, 0.02), 0.26, 0.018, 0.15, wet(0xf4f0e4, { roughness: 0.35, clearcoat: 0.8 }))); }       // the thin oval internal shell in the roof of the lung, under the back of the mantle
  root.add(part('shell', 'shell', (() => { const g = new THREE.Group(); g.add(shellF); return g; })(), categories.shell));

  const lungF = frame(); { const veins = canvasTex(256, 128, (x, w, h) => { x.fillStyle = '#e9a9a0'; x.fillRect(0, 0, w, h); x.strokeStyle = '#a21f2c'; x.lineCap = 'round'; for (let k = 0; k < 60; k++) { let px = Math.random() * w, py = Math.random() * h; x.lineWidth = 1 + Math.random() * 2; x.beginPath(); x.moveTo(px, py); for (let s = 0; s < 5; s++) { px += (Math.random() - 0.3) * 30; py += (Math.random() - 0.5) * 18; x.lineTo(px, py); } x.stroke(); } });
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 16), mat(0xffffff, { roughness: 0.5, clearcoat: 0.5, map: veins, transparent: true, opacity: 0.85 })); m.position.copy(W(V(1.1, hAt(1.1) * 0.72, 0))); m.scale.set(0.72, 0.1, wAt(1.1) * 0.8); lungF.add(m); }   // the lung: a flat air space under the mantle with a roof full of blood vessels
  root.add(part('lung', 'lung', (() => { const g = new THREE.Group(); g.add(lungF); return g; })(), categories.lung));

  const heartF = frame(), heartPv = new THREE.Group(); heartPv.position.copy(W(V(0.95, hAt(0.95) * 0.55, -wAt(0.95) * 0.45)));
  { const at = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), wet(0xd9484e, { clearcoat: 1 })); at.position.set(0.07, 0, 0); at.scale.set(0.06, 0.055, 0.055); const ve = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), wet(0xb7222a, { clearcoat: 1 })); ve.position.set(-0.06, 0, 0); ve.scale.set(0.075, 0.07, 0.07); heartPv.add(at, ve); }   // atrium in front, ventricle behind
  heartF.add(heartPv); heartF.add(sph(V(0.95, hAt(0.95) * 0.55, -wAt(0.95) * 0.45), 0.17, 0.11, 0.1, wet(0xf2e8dc, { transparent: true, opacity: 0.35 })));                          // the pericardium (a thin bag) on the left of the lung
  root.add(part('heart', 'heart', (() => { const g = new THREE.Group(); g.add(heartF); return g; })(), categories.heart));

  const kidF = frame(); kidF.add(sph(V(0.78, hAt(0.78) * 0.62, 0.08), 0.3, 0.07, 0.17, wet(0xf6efd9)));                                                                            // the big creamy kidney on the roof of the lung, right of the heart
  kidF.add(tubeThrough([V(0.55, hAt(0.6) * 0.6, 0.2), V(0.8, hAt(0.8) * 0.6, 0.3), V(1.05, hAt(1.05) * 0.56, wAt(1.05) * 0.95)], 0.014, wet(0xf6efd9), { segs: 12, radial: 6 }));  // its tube (ureter) to the opening beside the anus
  root.add(part('kidney', 'kidney', (() => { const g = new THREE.Group(); g.add(kidF); return g; })(), categories.kidney));

  const mouthF = frame();
  mouthF.add(sph(V(2.12, 0.2, 0), 0.2, 0.14, 0.14, wet(0xcc8f7e)));                                                                  // the buccal mass fills the head
  mouthF.add(sph(V(2.28, 0.26, 0), 0.03, 0.05, 0.11, wet(0x3a2a1e, { clearcoat: 1 })));                                              // the jaw arches over the front of the pharynx
  mouthF.add(sph(V(2.12, 0.1, 0), 0.14, 0.025, 0.08, wet(0xd4a548, { clearcoat: 1 })));                                               // the radula on the floor
  mouthF.add(sph(V(1.78, 0.36, 0.08), 0.24, 0.07, 0.13, wet(0xf3eee2)));                                                              // the right salivary gland: big, on top
  mouthF.add(sph(V(1.65, 0.06, -0.12), 0.38, 0.035, 0.05, wet(0xf3eee2)));                                                            // the left one: long and narrow, on the floor
  root.add(part('mouth', 'mouth', (() => { const g = new THREE.Group(); g.add(mouthF); return g; })(), categories.mouth));

  { const nc = V(1.9, 0.24, 0); nerveF.add(new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 10, 24).rotateY(Math.PI / 2).translate(nc.x - P.x, nc.y, nc.z), wet(0xf1ead6)));   // the nerve ring round the gullet behind the buccal mass
    for (const s of [-1, 1]) { nerveF.add(sph(V(nc.x, nc.y + 0.12, s * 0.05), 0.06, 0.045, 0.05, wet(0xfaf3df))); nerveF.add(sph(V(nc.x, nc.y - 0.11, s * 0.06), 0.055, 0.045, 0.05, wet(0xf1ead6))); }   // cerebral ganglia on top, pedal and the others below
    for (const s of [-1, 1]) nerveF.add(tubeThrough([V(nc.x + 0.03, nc.y + 0.14, s * 0.06), V(nc.x + 0.1, nc.y + 0.3, s * 0.09), UPB(s)], 0.014, wet(0xf1ead6), { segs: 10, radial: 6 })); }   // the eye nerves run up into the tentacles
  root.add(part('nerves', 'nerves', (() => { const g = new THREE.Group(); g.add(nerveF); return g; })(), categories.nerves));

  const gutF = frame(), gutMat = wet(0xe8d4ae, { transparent: true, opacity: 0.85 });
  gutF.add(tubeThrough([V(1.95, 0.22, 0), V(1.85, 0.2, 0.06), V(1.75, 0.18, 0.1)], 0.028, wet(0xe3b3a3), { segs: 10, radial: 8 }));                                                     // the short esophagus through the nerve ring
  gutF.add(tubeThrough(Array.from({ length: 12 }, (_, i) => { const x = 1.75 - (2.3 * i) / 11; return V(x, 0.12 + 0.05 * Math.sin(i), wAt(x) * 0.45); }), (t) => 0.05 + 0.03 * Math.sin(t * Math.PI), gutMat, { segs: 40 }));   // the crop: a long thin bag along the right side
  gutF.add(sph(V(-0.65, 0.2, 0.08), 0.13, 0.1, 0.1, wet(0xb69a62)));                                                                                                                    // the stomach where the crop widens, at the front of the digestive gland
  const loop = [V(-0.6, 0.12, -0.08), V(0.0, 0.08, -0.18), V(0.8, 0.12, -0.2), V(0.9, 0.2, -0.22), V(0.3, 0.26, -0.24), V(-0.4, 0.28, -0.2), V(-0.5, 0.36, -0.14), V(0.3, 0.34, -0.2), V(1.2, 0.3, -0.18), V(1.25, 0.38, -0.12), V(0.4, 0.42, -0.14), V(-0.5, 0.42, -0.1), V(-0.55, 0.46, 0.0), V(0.0, 0.47, 0.1), V(0.6, 0.46, 0.22), V(1.05, 0.4, wAt(1.05) * 0.96)];   // five limbs on the left, then the rectum crosses to the anus beside the breathing hole
  gutF.add(tubeThrough(loop, 0.035, wet(0x9c7b3a), { segs: 120, radial: 8 }));
  root.add(part('gut', 'gut', (() => { const g = new THREE.Group(); g.add(gutF); return g; })(), categories.gut));

  const digF = frame(), digMat = wet(0xd8c9a2, { roughness: 0.55 });
  for (let k = 0; k < 14; k++) { const x = -1.85 + k * 0.1 + (k % 2) * 0.03, s = -1 + 2 * (k % 2), h = hAt(x), w = wAt(x); digF.add(sph(V(x, h * 0.42 + 0.03 * Math.sin(k * 2.1), s * w * 0.35), 0.17, h * 0.36, w * 0.42, digMat)); }   // two lobed pale glands filling the back of the body
  root.add(part('digestive', 'digestive', (() => { const g = new THREE.Group(); g.add(digF); return g; })(), categories.digestive));

  const r1F = frame();
  for (let k = 0; k < 7; k++) r1F.add(sph(V(-2.15 + (k % 3) * 0.08, 0.14 + (k % 2) * 0.07, -0.06 + (k % 4) * 0.04), 0.06, 0.05, 0.05, wet(0x5a3c2c)));                                   // the dark lobed ovotestis at the very back
  r1F.add(tubeThrough(Array.from({ length: 24 }, (_, i) => { const x = -2.0 + (2.0 * i) / 23; return V(x, hAt(x) * 0.78 + 0.03 * Math.sin(i * 2.7), 0.02 + 0.04 * Math.cos(i * 2.3)); }), 0.016, wet(0xefe0b4), { segs: 60, radial: 6 }));   // the twisty hermaphroditic duct runs forward over the stomach and crop
  r1F.add(sph(V(0.1, 0.17, -0.04), 0.42, 0.14, 0.2, wet(0xf1e7a8)));                                                                                                                   // the pale yellow albumen gland fills the middle, low down
  r1F.add(tubeThrough(Array.from({ length: 16 }, (_, i) => { const x = 0.45 + (1.25 * i) / 15; return V(x, 0.22 + 0.07 * Math.sin(i * 1.9), 0.06 + 0.08 * Math.cos(i * 1.6)); }), 0.05, wet(0xf7f3ea), { segs: 50, radial: 8 }));              // the thick coiled spermoviduct
  root.add(part('repro1', 'repro1', (() => { const g = new THREE.Group(); g.add(r1F); return g; })(), categories.repro1));

  const r2F = frame();
  r2F.add(sph(V(1.76, 0.3, 0.2), 0.07, 0.06, 0.06, wet(0xffffff)));                                                                                                                       // the seminal receptacle (sperm store)
  r2F.add(tubeThrough([V(1.98, 0.3, 0.3), V(1.75, 0.34, 0.27), V(1.45, 0.36, 0.22)], 0.045, wet(0xf7f3ea), { segs: 14 }));                                                                // the penis, kept inside
  r2F.add(tubeThrough([V(1.45, 0.36, 0.22), V(0.9, 0.46, 0.12), V(0.5, hAt(0.5) * 0.9, 0.05)], 0.014, wet(0xf1ead6), { segs: 14, radial: 6 }));                                           // the penis retractor muscle, from the body wall near the back of the lung
  root.add(part('repro2', 'repro2', (() => { const g = new THREE.Group(); g.add(r2F); return g; })(), categories.repro2));

  const musF = frame(), musMat = wet(0xf5f2ea, { roughness: 0.5 }), tendon = V(0.6, 0.12, 0);
  for (const s of [-1, 1]) { musF.add(tubeThrough([UPB(s), V(1.8, 0.3, s * 0.12), V(1.2, 0.2, s * 0.06), tendon], 0.02, musMat, { segs: 16, radial: 6 })); musF.add(tubeThrough([V(2.33, 0.17, s * 0.09), V(1.9, 0.14, s * 0.1), tendon], 0.016, musMat, { segs: 12, radial: 6 })); }   // tentacle and head retractors join into one tendon under the lung
  musF.add(tubeThrough([tendon, V(0.2, 0.1, 0)], 0.03, musMat, { segs: 6, radial: 8 }));
  root.add(part('muscles', 'muscles', (() => { const g = new THREE.Group(); g.add(musF); return g; })(), categories.muscles));

  root.userData.rigs = { fillBody, tents, heartPv, frames: [bodyF, keelF, mantleF, headF, tentF, nerveF, shellF, lungF, heartF, kidF, mouthF, gutF, digF, r1F, r2F, musF] };
  motion(root);
  return root;
}

export function motion(root) {
  const { fillBody, tents, heartPv, frames } = root.userData.rigs;
  const st = { mode: null, walk: 0, fly: 0, curl: 0, cycle: 0, t: 0 };
  const m = {
    canFly: false, second: { id: 'curl', label: { en: 'Scrunch up', es: 'Encogerse' } }, state: st, walkLabel: { en: 'Glide', es: 'Deslizarse' },
    setMode(mode) { st.mode = st.mode === mode ? null : mode; return st.mode; },
    snap() { st.mode = null; st.walk = st.curl = 0; this.update(0.0001); },
    update(dt) {
      const k = 1 - Math.exp(-dt * 5);
      st.walk += ((st.mode === 'walk' ? 1 : 0) - st.walk) * k; st.curl += ((st.mode === 'curl' ? 1 : 0) - st.curl) * k * 0.8; if (st.walk < 0.001) st.walk = 0; if (st.curl < 0.001) st.curl = 0;
      st.t += dt; st.cycle += dt * 0.55 * (st.walk > 0.02 ? 1 : 0);
      const c = st.curl, retractT = smooth(c, 0, 0.6);
      for (const f of frames) f.scale.set(1 - 0.38 * c, 1 + 0.55 * c, 1 + 0.25 * c);                                             // everything inside scrunches up with the body: shorter, taller, wider
      frames[0].scale.set(1, 1, 1);                                                                                                // (the body loft does its own scrunching)
      tents.forEach((t, n) => {
        const sway = (1 - retractT) * (0.15 + 0.1 * st.walk) * Math.sin(st.t * (1.4 + n * 0.3) + n);
        t.pv.quaternion.copy(t.base); t.pv.rotateX(sway); t.pv.rotateZ(sway * 0.6 * Math.cos(st.t * 0.9 + n));
        t.pv.scale.set(1 + 0.4 * retractT, Math.max(0.07, 1 - 0.95 * retractT), 1 + 0.4 * retractT);
        if (t.nv) { t.nv.quaternion.copy(t.pv.quaternion); t.nv.scale.copy(t.pv.scale); }                                        // pulled in by turning inside out
      });
      if (st.walk > 0.01 || c > 0.01 || !m._init) { fillBody(st.cycle, st.walk * (1 - c), c); m._init = true; }
      const beat = Math.pow(Math.max(0, Math.sin(st.t * 4.6)), 4); heartPv.scale.setScalar(1 + 0.18 * beat);
      return 0.24 * st.walk * (1 - c);
    },
  };
  m.update(0.0001);
  return m;
}
