// Garden snail (Cornu aspersum, formerly Helix aspersa) — a land mollusc (gastropod), not an insect. Built from the species' anatomy:
//  OUTSIDE: a right-coiled (dextral) GLOBOSE shell of 4½ whorls: a huge last whorl (about 4/5 of the height), a low dome of a spire, no umbilicus, a large oblique rounded opening with a white
//   lip folded outward, the last whorl dipping a little in front of the opening; pale brown with up to five dark spiral bands broken by yellow flecks, a wrinkled surface and fine growth lines.
//   The shell is carried with its axis across the body: the spire points to the snail's RIGHT (a little up and back), the opening faces down and forward and the neck comes out of it ·
//   a muscular foot with a flat sole (pedal waves, slime from the pedal gland), rounded at the tail, grey-brown with dark lines along the neck and a net of skin bumps ·
//   a head with a mouth under TWO pairs of tentacles (the long upper pair carries the eyes at its tips; the short lower pair smells and feels) · the fleshy mantle collar at the shell opening with the
//   breathing hole (pneumostome) and the anus beside it on the RIGHT, and the mating opening (gonopore) on the right of the head behind the tentacles.
//  INSIDE: buccal mass with jaw and radula, salivary glands · esophagus → crop → stomach → looping intestine → rectum · two dark digestive glands (ceca) filling the upper whorls · the lung (the roof of the
//   mantle cavity) · heart (atrium + ventricle) beside the creamy kidney · circum-esophageal nerve ring (cerebral ganglia on top) · columellar muscle · hermaphrodite parts: ovotestis at the apex, hermaphroditic duct,
//   albumen gland, spermoviduct; dart sac with two mucous glands, penis, flagellum, bursa copulatrix (sperm store), vagina → gonopore.
// Sources: Invertebrate Anatomy OnLine (Lander University) "Helix aspersa"; Wikipedia "Cornu aspersum" and "Gastropod shell"; Conchological Society of GB & Ireland "Garden Snail - Cornu aspersum" (shell: globular, 4½–5 whorls, large mouth, white lip, umbilicus sealed).
import * as THREE from '../../vendor/three.module.min.js';
import { V, mat, part, canvasTex, microBumpTex, tube } from './lib.js';

export const info = {
  id: 'snail', icon: '🐌',
  name: { en: 'Garden Snail', es: 'Caracol de jardín' },
  sci: 'Cornu aspersum',
  blurb: { en: 'Not an insect! A soft mollusc that carries its spiral shell house and glides on a trail of slime.', es: '¡No es un insecto! Un molusco blando que carga su casita de caracola y se desliza sobre un rastro de baba.' },
  cameraDir: V(0.25, 0.3, 1.0).normalize(),
};

export const categories = {
  shell:    { skin: true, en: 'Shell', es: 'Concha', dEn: 'The shell is a hard house the snail builds itself from calcium (chalk). It is round like a ball: the last turn is huge and the little spiral on top is small. It has about 4 or 5 turns (whorls) and almost always twists to the right. The tip is the apex and the opening is the aperture, with a white lip. The snail adds new shell at the lip as it grows.', dEs: 'La concha es una casita dura que el caracol construye con calcio (tiza). Es redonda como una pelota: la última vuelta es enorme y la espiral de arriba es pequeña. Tiene unas 4 o 5 vueltas (anfractos) y casi siempre gira hacia la derecha. La punta es el ápice y la abertura es la boca de la concha, con un labio blanco. El caracol agrega concha nueva en el labio al crecer.' },
  body:     { skin: true, en: 'Foot', es: 'Pie', dEn: 'The foot is one big muscle with a flat sole. Waves of squeezing run along the sole from back to front and push the snail forward on a trail of slime. The slime comes from a gland between the head and the foot. The tail end is rounded.', dEs: 'El pie es un músculo grande con la planta plana. Ondas de apretón corren por la planta de atrás hacia adelante y empujan al caracol sobre un rastro de baba. La baba sale de una glándula entre la cabeza y el pie. La punta de la cola es redondeada.' },
  head:     { skin: true, en: 'Head and mouth', es: 'Cabeza y boca', dEn: 'The mouth is under the tentacles, with two soft lips. On the right side of the head, a little behind the right tentacle, is the small opening used for mating.', dEs: 'La boca está debajo de los tentáculos, con dos labios suaves. En el lado derecho de la cabeza, un poco detrás del tentáculo derecho, está la pequeña abertura que se usa para aparearse.' },
  tentacles:{ skin: true, en: 'Tentacles', es: 'Tentáculos', dEn: 'Four tentacles! The long upper pair has an eye at each tip that senses light and dark. The short lower pair smells and feels. A snail can pull a tentacle in by turning it inside out, like a glove finger.', dEs: '¡Cuatro tentáculos! El par largo de arriba tiene un ojo en cada punta que siente la luz y la oscuridad. El par corto de abajo huele y toca. El caracol puede meter un tentáculo dándole la vuelta, como el dedo de un guante.' },
  collar:   { skin: true, en: 'Collar and breathing hole', es: 'Collar y agujero para respirar', dEn: 'The thick fleshy collar (mantle) wraps the opening of the shell. On the right it has a round breathing hole called the pneumostome, and the anus is right beside it.', dEs: 'El collar carnoso y grueso (manto) rodea la abertura de la concha. A la derecha tiene un agujero redondo para respirar llamado neumostoma, y justo al lado está el ano.' },
  mouth:    { en: 'Jaw and radula', es: 'Mandíbula y rádula', dEn: 'Inside the mouth is a hard jaw that bites food, and the radula: a ribbon covered in thousands of tiny teeth that scrapes food like a rough tongue. White salivary glands help.', dEs: 'Dentro de la boca hay una mandíbula dura que muerde la comida y la rádula: una cinta cubierta de miles de dientitos que raspa la comida como una lengua áspera. Unas glándulas salivales blancas ayudan.' },
  gut:      { en: 'Gut', es: 'Intestino', dEn: 'Food goes down a narrow tube (esophagus) into a big thin bag called the crop, then to the stomach and a looping intestine. The leftovers leave through the anus, next to the breathing hole.', dEs: 'La comida baja por un tubo estrecho (esófago) a una bolsa grande y delgada llamada buche, luego al estómago y a un intestino que da vueltas. Lo que sobra sale por el ano, junto al agujero de respirar.' },
  digestive:{ en: 'Digestive glands', es: 'Glándulas digestivas', dEn: 'Two dark brown digestive glands fill the upper coils of the shell. They finish digesting the food and store energy.', dEs: 'Dos glándulas digestivas marrón oscuro llenan las vueltas de arriba de la concha. Terminan de digerir la comida y guardan energía.' },
  lung:     { en: 'Lung', es: 'Pulmón', dEn: 'A snail has no gills! The roof of the space inside the shell is a lung. Air comes in through the breathing hole, and a net of tiny blood vessels on the roof takes in the oxygen.', dEs: '¡El caracol no tiene branquias! El techo del espacio dentro de la concha es un pulmón. El aire entra por el agujero de respirar y una red de vasos diminutos en el techo toma el oxígeno.' },
  heart:    { en: 'Heart', es: 'Corazón', dEn: 'A small heart with two rooms (an atrium and a ventricle) sits next to the kidney by the lung. Snail blood does not stay in tubes everywhere: it flows around the organs. Scientists call that an open circulation.', dEs: 'Un corazón pequeño con dos cuartos (una aurícula y un ventrículo) está junto al riñón, cerca del pulmón. La sangre del caracol no va siempre por tubos: baña los órganos. Los científicos lo llaman circulación abierta.' },
  kidney:   { en: 'Kidney', es: 'Riñón', dEn: 'A creamy-white, triangle-shaped kidney at the back of the lung cleans waste out of the blood. The waste travels along a tube beside the rectum and leaves near the breathing hole.', dEs: 'Un riñón blanco cremoso con forma de triángulo, al fondo del pulmón, limpia los desechos de la sangre. Los desechos viajan por un tubo junto al recto y salen cerca del agujero de respirar.' },
  nerves:   { en: 'Brain (nerve ring)', es: 'Cerebro (anillo nervioso)', dEn: 'A ring of nerve lumps (ganglia) around the food tube is the snail\'s brain. The big pair on top are the cerebral ganglia, and nerves bring the light signals from the eyes.', dEs: 'Un anillo de bultitos de nervios (ganglios) alrededor del tubo de la comida es el cerebro del caracol. El par grande de arriba son los ganglios cerebrales y unos nervios traen las señales de luz desde los ojos.' },
  muscle:   { en: 'Pull-in muscle', es: 'Músculo para esconderse', dEn: 'A strong white muscle, the columellar muscle, is fastened to the middle post of the shell (the columella) and branches into the foot. When danger comes it pulls the whole snail inside its shell.', dEs: 'Un músculo blanco y fuerte, el músculo columelar, está sujeto al poste central de la concha (la columela) y se ramifica en el pie. Cuando hay peligro, mete todo el caracol dentro de la concha.' },
  repro1:   { en: 'Egg and sperm makers', es: 'Fábrica de huevos y esperma', dEn: 'Snails are hermaphrodites: every snail has both boy and girl parts. The ovotestis at the top of the shell makes both sperm and eggs. A twisty duct carries them to the white albumen gland, which makes the egg white, and then to a thick duct (the spermoviduct).', dEs: 'Los caracoles son hermafroditas: cada caracol tiene partes de niño y de niña. El ovotestis, en la punta de la concha, hace esperma y huevos. Un conducto retorcido los lleva a la glándula blanca de la albúmina, que hace la clara del huevo, y luego a un conducto grueso (el espermoviducto).' },
  repro2:   { en: 'Mating parts', es: 'Partes para aparearse', dEn: 'Near the head: the dart sac makes a tiny chalky "love dart", two branched mucus glands, the penis with a long thin flagellum, a round sperm store (bursa copulatrix) and the vagina all open at the mating opening. Two snails swap sperm, and each lays about 50 eggs in the soil.', dEs: 'Cerca de la cabeza: el saco del dardo hace un diminuto "dardo de amor" de cal, dos glándulas de moco ramificadas, el pene con un flagelo largo y delgado, un almacén redondo de esperma (bolsa copuladora) y la vagina se abren en la abertura de apareamiento. Dos caracoles se intercambian esperma y cada uno pone unos 50 huevos en la tierra.' },
};

const PI2 = Math.PI * 2, smooth = THREE.MathUtils.smoothstep;
// ---------------- the spiral shell (Raup's model): an oval that grows as it winds round the axis. θ grows from the apex to the aperture; dextral = clockwise seen from the apex.
// Globose helicid proportions: each whorl 2.8× the last (so the last whorl is ~4/5 of the shell), the oval reaches past the axis (no umbilicus), a low spire, height ≈ 0.85 × width.
const WR = 2.8, WHORLS = 4.5, TH0 = PI2 * 0.5, TH1 = PI2 * WHORLS, B = Math.log(WR) / PI2, AEND = 0.74, RHO = 0.8, ZC = 1.7, EL = 1.1, DIP = 0.22, TLT = 0.35;
const aOf = (th) => AEND * Math.exp(B * (th - TH1));
const dipOf = (th) => DIP * aOf(th) * smooth(th, TH1 - 2.2, TH1);                                   // the last whorl descends a little in front of the opening
const Sp = (th, phi, k = 1) => { const a = aOf(th), r = RHO * a + k * a * Math.cos(phi), te = th + TLT * k * Math.sin(phi); return V(r * Math.cos(te), -ZC * a - dipOf(th) + EL * k * a * Math.sin(phi), r * Math.sin(te)); };   // a point of the shell: turn θ, angle φ round the opening (0 = outer edge, π/2 = towards the apex), fraction k of the radius. TLT makes the opening oblique: its base leads, so the opening faces partly down towards the base
const key = (keys, t) => { for (let i = 0; i < keys.length - 1; i++) if (t <= keys[i + 1][0]) { const [t0, v0] = keys[i], [t1, v1] = keys[i + 1]; return v0 + (v1 - v0) * smooth(t, t0, t1); } return keys[keys.length - 1][1]; };

// where the shell sits on the snail: the opening is at the bottom-front of the coil and faces forward (and a little up, as the shell leans back over the neck); the apex points to the snail's right, a little up and back
const nLoc = (() => { const n = new THREE.Vector3().crossVectors(Sp(TH1, 0, 1).sub(Sp(TH1, Math.PI, 1)), Sp(TH1, Math.PI / 2, 1).sub(Sp(TH1, -Math.PI / 2, 1))).normalize(); return n.dot(V(-Math.sin(TH1), 0, Math.cos(TH1))) < 0 ? n.negate() : n; })();   // the direction the opening faces (shell frame)
const nW = V(0.8, 0.45, -0.25).normalize();
const qA = new THREE.Quaternion().setFromUnitVectors(nLoc, nW);
const apW = V(0, 1, 0).applyQuaternion(qA), wantUp = V(-0.25, 0.25, 0.93).normalize();
const proj = (v) => v.clone().addScaledVector(nW, -v.dot(nW)), pa = proj(apW), pt = proj(wantUp);
const qSpin = new THREE.Quaternion().setFromAxisAngle(nW, Math.atan2(nW.dot(new THREE.Vector3().crossVectors(pa, pt)), pa.dot(pt)));
const QSH = qSpin.multiply(qA);
if (typeof window !== 'undefined' && ['localhost', '127.0.0.1'].includes(location.hostname)) window.__snailDbg = { apex: V(0, 1, 0).applyQuaternion(QSH).toArray().map((n) => +n.toFixed(2)), open: nLoc.clone().applyQuaternion(QSH).toArray().map((n) => +n.toFixed(2)), apexOpenDeg: +THREE.MathUtils.radToDeg(Math.acos(nLoc.y)).toFixed(0) };
const APER = V(0.45, 1.42, -0.05);                                            // where the centre of the shell's opening is, in the world (on top of the foot, behind the neck)
const cEnd = Sp(TH1, 0, 0);
const LIFT = 0, SHZ = 0;
const PSH = APER.clone().sub(cEnd.clone().applyQuaternion(QSH)).add(V(0, LIFT, SHZ));
const toW = (v) => v.clone().applyQuaternion(QSH).add(PSH);
const P = APER;                                                              // the head and foot pull in toward this point (retract frame)

export function build() {
  const root = new THREE.Group();
  root.userData.groundY = -0.02;
  const wet = (c, o = {}) => mat(c, { roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.28, ...o });
  // the shell's colour runs along the spiral (u) and round the whorl (v): pale brown with dark bands broken by yellow flecks, wrinkles and fine lines of growth
  const shellMap = canvasTex(1024, 256, (x, w, h) => {
    // v runs round the whorl: 0 = the outer edge (periphery), 0.25 = the apical side, 0.5 = the inner wall (hidden), 0.75 = the base. Pale brown with up to five soft dark bands broken by yellow flecks.
    const g = x.createLinearGradient(0, 0, 0, h); [[0, '#c7a060'], [0.25, '#b9904f'], [0.5, '#c49a58'], [0.75, '#cfae6c'], [1, '#c7a060']].forEach(([t, c]) => g.addColorStop(t, c)); x.fillStyle = g; x.fillRect(0, 0, w, h);
    const band = (v, wd, a) => { const gb = x.createLinearGradient(0, (v - wd) * h, 0, (v + wd) * h); gb.addColorStop(0, 'rgba(78,42,20,0)'); gb.addColorStop(0.3, `rgba(78,42,20,${a})`); gb.addColorStop(0.7, `rgba(78,42,20,${a})`); gb.addColorStop(1, 'rgba(78,42,20,0)'); x.fillStyle = gb; x.fillRect(0, (v - wd) * h, w, 2 * wd * h); };
    band(0.03, 0.035, 0.8); band(0.135, 0.03, 0.7); band(0.9, 0.03, 0.75); band(0.78, 0.025, 0.55); band(0.965, 0.02, 0.6);     // the five bands: one at the periphery, one above it, three on the base side
    x.globalAlpha = 0.75; for (let i = 0; i < 1600; i++) { x.fillStyle = Math.random() < 0.72 ? '#ecd38d' : '#5a2f14'; const l = 4 + Math.random() * 14; x.fillRect(Math.random() * w, Math.random() * h, l, 2 + Math.random() * 5); }   // yellow flecks and streaks that break the bands up
    x.globalAlpha = 0.18; x.fillStyle = '#3a1c08'; for (let i = 0; i < w; i += 5 + (i % 4)) x.fillRect(i, 0, 1.2, h);    // fine lines of growth
    x.globalAlpha = 0.1; x.fillStyle = '#fff6dc'; for (let i = 2; i < w; i += 9) x.fillRect(i, 0, 2, h);
    x.globalAlpha = 0.35; x.fillStyle = '#4a2a12'; x.fillRect(0, 0.3 * h, w, 0.012 * h); x.globalAlpha = 1;                   // the suture: the thin groove where a whorl meets the one before
  }, { repeat: [4, 1] });
  const wrinkle = canvasTex(512, 256, (x, w, h) => { x.fillStyle = '#8a8a8a'; x.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 3) { x.fillStyle = `rgb(${110 + Math.random() * 60},${110 + Math.random() * 60},${110 + Math.random() * 60})`; x.fillRect(i, 0, 2, h); } x.globalAlpha = 0.35; for (let i = 0; i < 900; i++) { x.fillStyle = Math.random() < 0.5 ? '#000' : '#fff'; x.fillRect(Math.random() * w, Math.random() * h, 2 + Math.random() * 6, 1 + Math.random() * 2); } }, { srgb: false, repeat: [12, 1] });
  shellMap.flipY = false;                                                                           // v = 0 is the top row of the canvas
  const shellMat = mat(0xffffff, { roughness: 0.5, clearcoat: 0.45, clearcoatRoughness: 0.35, map: shellMap, bumpMap: wrinkle, bumpScale: 0.6, side: THREE.DoubleSide, transparent: true });
  const net = (x, w, h, line, a, cell = 15) => {                       // the net of grooves that divides the skin into little bumps
    const nx = Math.ceil(w / cell) + 2, ny = Math.ceil(h / cell) + 2, pts = [];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) pts.push([(i - 0.5 + (j % 2) * 0.5 + (Math.random() - 0.5) * 0.7) * cell, (j - 0.5 + (Math.random() - 0.5) * 0.7) * cell * 0.9]);
    x.strokeStyle = line; x.globalAlpha = a; x.lineWidth = 2.2; x.lineCap = 'round'; x.beginPath();
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) { const p = pts[j * nx + i], r = pts[j * nx + i + 1], d = pts[(j + 1) * nx + i]; x.moveTo(p[0], p[1]); x.lineTo(r[0], r[1]); x.moveTo(p[0], p[1]); x.lineTo(d[0], d[1]); }
    x.stroke(); x.globalAlpha = 1;
  };
  // the skin: u runs along the body (tail → head, 3 repeats), v runs round it (right side at the ground → back → left side → sole). Grey-brown, darker on the back, two dark lines along the neck, a pale sole.
  const skinMap = canvasTex(768, 512, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); [[0, '#8a7352'], [0.12, '#7a6146'], [0.25, '#6b5340'], [0.38, '#7a6146'], [0.5, '#8a7352'], [0.56, '#b9a47a'], [1, '#cdbb8f']].forEach(([t, c]) => g.addColorStop(t, c)); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.globalAlpha = 0.3; for (let i = 0; i < 220; i++) { x.fillStyle = Math.random() < 0.5 ? '#3f2e1e' : '#dcc89c'; x.beginPath(); x.arc(Math.random() * w, Math.random() * h * 0.55, 3 + Math.random() * 9, 0, 7); x.fill(); } x.globalAlpha = 1;
    x.globalAlpha = 0.55; x.fillStyle = '#3a2a1c'; for (const v of [0.17, 0.33]) { x.beginPath(); x.moveTo(w * 0.72, v * h); x.quadraticCurveTo(w * 0.86, v * h - 6, w, v * h + 6); x.lineWidth = 7; x.strokeStyle = '#3a2a1c'; x.stroke(); } x.globalAlpha = 1;   // the dark lines along the neck (last third = the neck and head)
    net(x, w, h, '#4b3622', 0.7);
  }, { repeat: [1, 1] });
  const bumpDots = canvasTex(512, 512, (x, w, h) => { x.fillStyle = '#d0d0d0'; x.fillRect(0, 0, w, h); net(x, w, h, '#202020', 1); }, { srgb: false, repeat: [2, 5] });
  skinMap.flipY = bumpDots.flipY = false;
  const skin = mat(0xffffff, { roughness: 0.42, clearcoat: 0.85, clearcoatRoughness: 0.2, map: skinMap, bumpMap: bumpDots, bumpScale: 0.9, sheen: 0.2, sheenColor: new THREE.Color(0xc9b486), transparent: true });
  const lipSkin = wet(0xb8a383, { transparent: true });

  const shellFrame = () => { const g = new THREE.Group(); g.quaternion.copy(QSH); g.position.copy(PSH); return g; };
  const retractFrame = () => { const g = new THREE.Group(); g.position.copy(P); return g; };
  const holder = (...frames) => { const h = new THREE.Group(); frames.forEach((f) => h.add(f)); return h; };
  const W = (v) => v.clone().sub(P);                                                               // world → retract frame
  const sph = (pos, rx, ry, rz, mt) => { const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), mt); m.position.copy(pos); m.scale.set(rx, ry, rz); return m; };
  const tubeThrough = (pts, rf, mt, o = {}) => tube(pts, typeof rf === 'function' ? rf : () => rf, mt, { segs: o.segs ?? 40, radial: o.radial ?? 10 });
  const spiralTube = (th0, th1, phiFn, kFn, rFn, mt, n = 80) => tubeThrough(Array.from({ length: n + 1 }, (_, i) => { const t = i / n, th = th0 + (th1 - th0) * t; return Sp(th, phiFn(t), kFn(t)); }), (t) => rFn(t, th0 + (th1 - th0) * t), mt, { segs: n, radial: 12 });

  // ======================= SHELL
  const steps = 400, around = 48, pos = [], uv = [], idx = [];
  for (let i = 0; i <= steps; i++) { const th = TH0 + ((TH1 - TH0) * i) / steps; for (let j = 0; j <= around; j++) { const phi = (j / around) * PI2, p = Sp(th, phi, 1); pos.push(p.x, p.y, p.z); uv.push((th - TH0) / PI2, j / around); } }
  for (let i = 0; i < steps; i++) for (let j = 0; j < around; j++) { const a = i * (around + 1) + j, b = a + 1, c = a + around + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
  const sg = new THREE.BufferGeometry(); sg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); sg.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); sg.setIndex(idx); sg.computeVertexNormals();
  const shellG = shellFrame(); shellG.add(new THREE.Mesh(sg, shellMat));
  { // the white lip, folded outward: a short flaring band round the opening
    const nl = 64, lp = [], li = [], ring = (k, dth) => Array.from({ length: nl + 1 }, (_, j) => Sp(TH1 + dth, (j / nl) * PI2, k));
    const rows = [ring(0.985, -0.1), ring(1.0, -0.03), ring(1.035, 0.015), ring(1.075, 0.03)];
    rows.forEach((r) => r.forEach((p) => lp.push(p.x, p.y, p.z)));
    for (let i = 0; i < rows.length - 1; i++) for (let j = 0; j < nl; j++) { const a = i * (nl + 1) + j, b = a + 1, c = a + nl + 1, d = c + 1; li.push(a, c, b, b, c, d); }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lg.setIndex(li); lg.computeVertexNormals();
    shellG.add(new THREE.Mesh(lg, wet(0xf3ebdc, { roughness: 0.35, side: THREE.DoubleSide, transparent: true })));
    shellG.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ring(1.075, 0.03).slice(0, nl), true), 96, 0.028, 8, true), wet(0xf3ebdc, { roughness: 0.35, transparent: true })));
  }
  root.add(part('shell', 'shell', holder(shellG), categories.shell));

  // ======================= THE SOFT BODY: a foot lofted from rings (so it can ripple), in the retract frame
  const NR = 56, MR = 26, X0 = -2.1, X1 = 2.55;
  // half width and height along the foot (t: tail 0 → head 1). A rounded tail, a long low tail under the shell, the neck rising into the shell's opening, then the head.
  const wKey = [[0, 0.17], [0.08, 0.25], [0.2, 0.35], [0.35, 0.45], [0.5, 0.55], [0.6, 0.55], [0.72, 0.48], [0.85, 0.42], [0.95, 0.36], [1, 0.3]];
  const hKey = [[0, 0.16], [0.08, 0.22], [0.2, 0.3], [0.33, 0.45], [0.44, 0.95], [0.54, 1.5], [0.62, 1.3], [0.72, 0.95], [0.82, 0.62], [0.92, 0.46], [1, 0.34]];
  const capT = 0.5 / (X1 - X0), capH = 0.32 / (X1 - X0);                                                            // the tail and the head are capped like the end of a sausage (rounded, never pointed)
  const cap = (t) => { const e = t < capT ? Math.sqrt(Math.max(0, 1 - Math.pow(1 - t / capT, 2))) : 1, f = t > 1 - capH ? Math.sqrt(Math.max(0, 1 - Math.pow(1 - (1 - t) / capH, 2))) : 1; return e * f; };
  const bpos = new Float32Array(NR * MR * 3), buv = new Float32Array(NR * MR * 2), bidx = [];
  for (let i = 0; i < NR; i++) for (let j = 0; j < MR; j++) { buv[(i * MR + j) * 2] = (i / (NR - 1)); buv[(i * MR + j) * 2 + 1] = j / MR; }
  for (let i = 0; i < NR - 1; i++) for (let j = 0; j < MR; j++) { const a = i * MR + j, b = i * MR + ((j + 1) % MR), c = (i + 1) * MR + j, d = (i + 1) * MR + ((j + 1) % MR); bidx.push(a, c, b, b, c, d); }
  const bgeo = new THREE.BufferGeometry(); bgeo.setAttribute('position', new THREE.BufferAttribute(bpos, 3)); bgeo.setAttribute('uv', new THREE.BufferAttribute(buv, 2)); bgeo.setIndex(bidx);
  const footMesh = new THREE.Mesh(bgeo, skin); footMesh.frustumCulled = false;
  const bodyR = retractFrame(); bodyR.add(footMesh);
  root.add(part('body', 'body', holder(bodyR), categories.body));
  const fillFoot = (cyc, walk) => {
    for (let i = 0; i < NR; i++) {
      const t = i / (NR - 1), c = cap(t), w = key(wKey, t) * c, h = Math.max(0.004, key(hKey, t) * c), x = X0 + (X1 - X0) * t, wave = Math.sin((t * 9 - cyc) * PI2), hh = h * (1 + 0.05 * walk * wave), lift = 0.03 * walk * Math.max(0, wave);
      for (let j = 0; j < MR; j++) {
        let z, y; if (j < 14) { const a = (Math.PI * j) / 13; z = w * Math.cos(a); y = hh * Math.pow(Math.max(0, Math.sin(a)), 0.72); } else { z = -w + (2 * w * (j - 13)) / 13; y = lift * (1 - Math.abs(z) / Math.max(w, 1e-3)); }
        const o = (i * MR + j) * 3; bpos[o] = x - P.x; bpos[o + 1] = y - P.y; bpos[o + 2] = z - P.z;
      }
    }
    bgeo.attributes.position.needsUpdate = true; bgeo.computeVertexNormals();
  };
  fillFoot(0, 0);

  // ======================= HEAD: lips, mouth, mating opening, pedal gland
  const headR = retractFrame();
  for (const s of [-1, 1]) headR.add(sph(W(V(2.42, 0.17, s * 0.12)), 0.13, 0.08, 0.12, lipSkin));
  headR.add(sph(W(V(2.52, 0.17, 0)), 0.03, 0.04, 0.17, wet(0x2a1a14)));                  // the mouth slit
  headR.add(sph(W(V(1.95, 0.52, 0.38)), 0.05, 0.05, 0.03, wet(0x3b2a20)));                    // the mating opening (gonopore), on the right behind the right tentacles
  headR.add(sph(W(V(2.3, 0.04, 0)), 0.09, 0.015, 0.1, wet(0xd9cdb1)));                     // the slime gland opening, between head and foot
  root.add(part('head', 'head', holder(headR), categories.head));

  // ======================= TENTACLES: two long upper ones with eyes, two short lower ones (they sway, and pull in by turning inside out)
  const tentR = retractFrame(), nerveR = retractFrame(), tents = [];
  const UPB = (s) => V(2.02, 0.6, s * 0.17), UPD = (s) => V(0.5, 0.78, s * 0.42), UPL = 1.45;
  const mkTent = (base, dir, len, r0, r1, upper) => {
    const pv = new THREE.Group(); pv.position.copy(W(base)); pv.quaternion.setFromUnitVectors(V(0, 1, 0), dir.clone().normalize());
    const cyl = new THREE.CylinderGeometry(r1, r0, len, 12, 1).translate(0, len / 2, 0); pv.add(new THREE.Mesh(cyl, skin));
    if (upper) { pv.add(sph(V(0, len, 0), 0.062, 0.07, 0.062, skin)); pv.add(sph(V(0.02, len + 0.035, 0.045).clone(), 0.028, 0.028, 0.028, wet(0x050505, { roughness: 0.1, clearcoat: 1 }))); }   // the knob with the eye
    else pv.add(sph(V(0, len, 0), r1 * 1.1, r1 * 1.3, r1 * 1.1, skin));
    let nv = null;
    if (upper) { nv = new THREE.Group(); nv.position.copy(pv.position); nv.quaternion.copy(pv.quaternion); nv.add(new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.014, len * 0.96, 8).translate(0, len * 0.48, 0), wet(0xf1ead6))); nerveR.add(nv); }   // the eye nerve runs inside the tentacle, so it sways and pulls in with it
    tentR.add(pv); tents.push({ pv, nv, upper, base: pv.quaternion.clone() }); return pv;
  };
  for (const s of [-1, 1]) { mkTent(UPB(s), UPD(s), UPL, 0.085, 0.034, true); mkTent(V(2.4, 0.3, s * 0.16), V(0.85, -0.15, s * 0.5), 0.5, 0.06, 0.035, false); }
  root.add(part('tentacles', 'tentacles', holder(tentR), categories.tentacles));

  // ======================= COLLAR, breathing hole (right side), anus
  const collarG = shellFrame(); const cPts = Array.from({ length: 48 }, (_, j) => Sp(TH1, (j / 48) * PI2, 0.93));
  collarG.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cPts, true), 96, 0.11, 10, true), skin));
  let bestJ = 0, bestV = -9; for (let j = 0; j < 96; j++) { const p = toW(Sp(TH1, (j / 96) * PI2, 0.97)), sc = p.z * 1 + p.y * 0.3 - p.x * 0.1; if (sc > bestV) { bestV = sc; bestJ = j; } }
  const phiR = (bestJ / 96) * PI2, pn = Sp(TH1, phiR, 0.97), pnW = toW(pn);
  const pneu = sph(pn, 0.085, 0.06, 0.09, wet(0x2a1c14)); collarG.add(pneu);
  const anus = sph(Sp(TH1, phiR - 0.5, 0.97), 0.05, 0.04, 0.05, wet(0x6b5a44)); collarG.add(anus);
  { const aE = aOf(TH1), rad = V(Math.cos(TH1), 0, Math.sin(TH1)), tan = V(-Math.sin(TH1), 0, Math.cos(TH1)), up = V(0, 1, 0);        // the soft neck fills the opening of the shell like a plug
    const plug = new THREE.Mesh(new THREE.SphereGeometry(1, 28, 20), skin); plug.scale.set(aE * 0.96, aE * EL * 0.96, aE * 0.6);
    plug.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(rad, up, tan)); plug.position.copy(Sp(TH1, 0, 0)).addScaledVector(tan, -aE * 0.15); collarG.add(plug); }
  root.add(part('collar', 'collar', holder(collarG), categories.collar));

  // ======================= INSIDE: the head end (retract frame)
  const mouthR = retractFrame();
  mouthR.add(sph(W(V(2.1, 0.3, 0)), 0.26, 0.17, 0.17, wet(0xcc8f7e)));                                 // the buccal mass
  mouthR.add(sph(W(V(2.33, 0.35, 0)), 0.04, 0.07, 0.15, wet(0x3a2a1e, { clearcoat: 1 })));              // the hard jaw
  mouthR.add(sph(W(V(2.16, 0.18, 0)), 0.18, 0.03, 0.1, wet(0xd4a548, { clearcoat: 1 })));              // the radula: a golden ribbon of teeth
  for (const s of [-1, 1]) mouthR.add(sph(W(V(1.7, 0.44, s * 0.2)), 0.26, 0.07, 0.13, wet(0xf3eee2)));      // the salivary glands
  root.add(part('mouth', 'mouth', holder(mouthR), categories.mouth));

  const nc = W(V(1.8, 0.36, 0));
  nerveR.add(new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.035, 10, 28).rotateY(Math.PI / 2).translate(nc.x, nc.y, nc.z), wet(0xf1ead6)));          // the nerve ring round the food tube
  for (const s of [-1, 1]) { nerveR.add(sph(V(nc.x, nc.y + 0.2, s * 0.08), 0.1, 0.075, 0.085, wet(0xfaf3df))); nerveR.add(sph(V(nc.x, nc.y - 0.18, s * 0.09), 0.09, 0.07, 0.08, wet(0xf1ead6))); }    // the cerebral ganglia on top, the others below
  nerveR.add(sph(V(nc.x, nc.y - 0.2, 0), 0.08, 0.07, 0.1, wet(0xf1ead6)));
  for (const s of [-1, 1]) nerveR.add(tubeThrough([V(nc.x + 0.05, nc.y + 0.22, s * 0.1), V(nc.x + 0.15, nc.y + 0.32, s * 0.15), W(UPB(s))], 0.02, wet(0xf1ead6), { segs: 12, radial: 6 }));   // the eye nerves leave the brain and run up inside the tentacles
  root.add(part('nerves', 'nerves', holder(nerveR), categories.nerves));

  const mus = new THREE.Group(), muscleMat = wet(0xf5f2ea, { roughness: 0.5 }), colTop = toW(V(0, -ZC * AEND * 0.7, 0)), colBot = toW(V(0, -ZC * AEND * 1.55, 0));
  mus.add(tubeThrough([toW(V(0, -0.15, 0)), colTop, colBot], 0.085, muscleMat, { segs: 14 }));          // the central post of the shell with the muscle on it
  const musR = retractFrame(); for (const [x, z] of [[-1.6, 0.0], [-0.9, 0.05], [0.0, -0.1], [1.0, 0.12], [1.9, 0.0]]) musR.add(tubeThrough([W(colBot), W(V(colBot.x * 0.5 + x * 0.5, 0.42, z * 0.5)), W(V(x, 0.14, z))], 0.06, muscleMat, { segs: 14, radial: 8 }));
  root.add(part('muscle', 'muscle', holder(mus, musR), categories.muscle));

  const r2R = retractFrame();                                                                              // the mating parts, near the head
  const cream = wet(0xefe6cf), white = wet(0xf7f3ea);
  r2R.add(sph(W(V(1.65, 0.46, 0.2)), 0.18, 0.1, 0.1, cream));                                           // the dart sac
  r2R.add(sph(W(V(1.8, 0.46, 0.2)), 0.06, 0.012, 0.012, wet(0xffffff, { clearcoat: 1 })));               // the little chalky dart
  for (const s of [0, 1]) r2R.add(tubeThrough([W(V(1.6, 0.5, 0.22)), W(V(1.3, 0.6, 0.3 + s * 0.1)), W(V(1.0, 0.62 - s * 0.08, 0.36 + s * 0.08))], 0.04, white, { segs: 16, radial: 8 }));     // two branched mucus glands
  r2R.add(tubeThrough([W(V(1.9, 0.48, 0.34)), W(V(1.6, 0.52, 0.34)), W(V(1.2, 0.56, 0.3))], 0.06, wet(0xe9d9bd), { segs: 16 }));        // the penis
  r2R.add(tubeThrough(Array.from({ length: 14 }, (_, i) => W(V(1.2 - i * 0.12, 0.58 + 0.05 * Math.sin(i * 1.4), 0.3 + 0.06 * Math.cos(i * 1.2)))), 0.02, white, { segs: 40, radial: 6 }));   // the long thin flagellum
  r2R.add(sph(W(V(1.05, 0.6, 0.08)), 0.09, 0.09, 0.09, wet(0xffffff)));                                     // the sperm store (bursa copulatrix)
  r2R.add(tubeThrough([W(V(1.05, 0.58, 0.1)), W(V(1.5, 0.45, 0.2)), W(V(1.95, 0.5, 0.36))], 0.025, cream, { segs: 14, radial: 6 }));   // the vagina
  root.add(part('repro2', 'repro2', holder(r2R), categories.repro2));

  // ======================= INSIDE: the coiled part (shell frame)
  const gutS = shellFrame(), gutR = retractFrame(), gutMat = wet(0xe8d4ae, { transparent: true, opacity: 0.8 });
  gutR.add(tubeThrough([W(V(1.98, 0.36, 0)), W(V(1.5, 0.48, 0.04)), W(V(1.0, 0.6, 0.1)), W(toW(Sp(TH1 - 0.5, -0.9, 0.5)))], 0.035, wet(0xe3b3a3), { segs: 24, radial: 8 }));   // the food tube (esophagus)
  gutS.add(spiralTube(TH1 - 5.2, TH1 - 0.4, () => -0.9, () => 0.35, (t, th) => 0.48 * aOf(th), gutMat, 110));                                           // the crop: a big thin-walled bag
  gutS.add(sph(Sp(TH1 - 5.6, -0.7, 0.3), 0.06, 0.06, 0.06, wet(0xb69a62)));                                                                                // the stomach
  gutS.add(spiralTube(TH1 - 5.6, TH1 - 1.0, (t) => 0.2 + 0.9 * t + 0.6 * Math.sin(t * 18), (t) => 0.55 + 0.12 * Math.sin(t * 12), (t, th) => 0.17 * aOf(th) + 0.012, wet(0x9c7b3a), 160));   // the looping intestine
  gutS.add(spiralTube(TH1 - 1.1, TH1 - 0.05, () => phiR, () => 0.8, () => 0.03, wet(0x8a6a30), 24));                                                     // the rectum, along the right edge of the lung to the anus
  root.add(part('gut', 'gut', holder(gutS, gutR), categories.gut));

  const digS = shellFrame(), digMat = wet(0x4d2e1d, { roughness: 0.6 });
  digS.add(spiralTube(TH0 + 0.6, TH1 - 6.5, () => 0, () => 0, (t, th) => 0.72 * aOf(th) * (1 + 0.09 * Math.sin(th * 5)), digMat, 150));                      // the right digestive gland: fills the upper whorls
  digS.add(spiralTube(TH1 - 6.5, TH1 - 2.4, () => 0.25, () => 0.18, (t, th) => 0.55 * aOf(th) * (1 + 0.1 * Math.sin(th * 5)), digMat, 120));                  // the left one: at the base of the coil
  root.add(part('digestive', 'digestive', holder(digS), categories.digestive));

  const lungS = shellFrame(); { const nu = 70, nv = 18, th0 = TH1 - PI2 * 0.78, th1 = TH1 - 0.15, p0 = 0.06 * Math.PI, p1 = 0.88 * Math.PI, lp = [], lu = [], li = [];
    for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const p = Sp(th0 + (th1 - th0) * (i / nu), p0 + (p1 - p0) * (j / nv), 0.93); lp.push(p.x, p.y, p.z); lu.push(i / nu, j / nv); }
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + 1, c = a + nv + 1, d = c + 1; li.push(a, c, b, b, c, d); }
    const lg = new THREE.BufferGeometry(); lg.setAttribute('position', new THREE.Float32BufferAttribute(lp, 3)); lg.setAttribute('uv', new THREE.Float32BufferAttribute(lu, 2)); lg.setIndex(li); lg.computeVertexNormals();
    const veins = canvasTex(512, 128, (x, w, h) => { x.fillStyle = '#e9a9a0'; x.fillRect(0, 0, w, h); x.strokeStyle = '#a21f2c'; x.lineCap = 'round'; for (let k = 0; k < 90; k++) { let px = Math.random() * w, py = Math.random() * h; x.lineWidth = 1 + Math.random() * 2.4; x.beginPath(); x.moveTo(px, py); for (let s = 0; s < 6; s++) { px += (Math.random() - 0.3) * 40; py += (Math.random() - 0.5) * 22; x.lineTo(px, py); } x.stroke(); } });
    lungS.add(new THREE.Mesh(lg, mat(0xffffff, { roughness: 0.5, clearcoat: 0.5, map: veins, side: THREE.DoubleSide, transparent: true })));   // the lung: the roof of the shell space, covered in blood vessels
  }
  root.add(part('lung', 'lung', holder(lungS), categories.lung));
  const kidS = shellFrame(); { const th = TH1 - PI2 * 0.72, a = aOf(th); kidS.add(sph(Sp(th, 0.5 * Math.PI, 0.6), a * 0.45, a * 0.22, a * 0.32, wet(0xf6efd9))); }       // the creamy-white kidney
  root.add(part('kidney', 'kidney', holder(kidS), categories.kidney));
  const heartS = shellFrame(), heartPv = new THREE.Group(); { const th = TH1 - PI2 * 0.6, a = aOf(th), c = Sp(th, 0.62 * Math.PI, 0.55); heartPv.position.copy(c); heartPv.add(sph(V(0, 0, 0), a * 0.26, a * 0.22, a * 0.22, wet(0xb7222a, { clearcoat: 1 }))); heartPv.add(sph(V(a * 0.3, a * 0.08, -a * 0.15), a * 0.18, a * 0.15, a * 0.16, wet(0xd9484e, { clearcoat: 1 }))); heartS.add(heartPv); }   // the ventricle (big) and atrium (small)
  root.add(part('heart', 'heart', holder(heartS), categories.heart));

  const r1S = shellFrame(), creamM = wet(0xf1e3bd);
  for (let k = 0; k < 16; k++) { const th = TH0 + 0.5 + k * 0.28, a = aOf(th); r1S.add(sph(Sp(th, 0.25 * Math.PI + 0.5 * Math.sin(k * 1.9), 0.5), a * 0.4, a * 0.4, a * 0.4, creamM)); }      // the ovotestis: a cluster of little sacs at the top
  r1S.add(spiralTube(PI2 * 1.6, PI2 * 3.3, (t) => Math.PI * (0.95 + 0.1 * Math.sin(t * 40)), () => 0.5, () => 0.03, wet(0xefe0b4), 140));                                           // the twisty hermaphroditic duct
  r1S.add(spiralTube(PI2 * 3.3, PI2 * 3.95, () => 0.7 * Math.PI, () => 0.4, (t, th) => 0.34 * aOf(th), wet(0xfbfaf6), 60));                                                          // the albumen gland (white)
  r1S.add(spiralTube(PI2 * 3.95, PI2 * 4.38, () => 0.8 * Math.PI, () => 0.4, (t, th) => 0.3 * aOf(th), wet(0xf3efe2), 40));                                                           // the thick spermoviduct
  root.add(part('repro1', 'repro1', holder(r1S), categories.repro1));

  root.userData.rigs = { fillFoot, tents, bodyR, headR, tentR, mouthR, nerveR, musR, r2R, gutR, heartPv, P };
  root.userData.retractFrames = [bodyR, headR, tentR, mouthR, nerveR, musR, r2R, gutR];
  motion(root);
  return root;
}

export function motion(root) {
  const { fillFoot, tents, heartPv } = root.userData.rigs, frames = root.userData.retractFrames;
  const st = { mode: null, walk: 0, fly: 0, hide: 0, cycle: 0, t: 0 };
  const m = {
    canFly: false, second: { id: 'hide', label: { en: 'Hide', es: 'Esconderse' } }, state: st, walkLabel: { en: 'Glide', es: 'Deslizarse' },
    setMode(mode) { st.mode = st.mode === mode ? null : mode; return st.mode; },
    snap() { st.mode = null; st.walk = st.hide = 0; this.update(0.0001); },
    update(dt) {
      const k = 1 - Math.exp(-dt * 5);
      st.walk += ((st.mode === 'walk' ? 1 : 0) - st.walk) * k; st.hide += ((st.mode === 'hide' ? 1 : 0) - st.hide) * k * 0.7; if (st.walk < 0.001) st.walk = 0; if (st.hide < 0.001) st.hide = 0;
      st.t += dt; st.cycle += dt * 0.5 * (st.walk > 0.02 ? 1 : 0);
      const h = st.hide, retractT = smooth(h, 0, 0.55), pull = smooth(h, 0.3, 1), s = 1 - 0.9 * pull;
      for (const f of frames) { f.scale.setScalar(s); f.position.set(P.x, P.y + LIFT * pull, P.z + SHZ * pull); }                                                                       // the whole soft body pulls into the shell
      tents.forEach((t, n) => {
        const sway = (1 - retractT) * (0.18 + 0.1 * st.walk) * Math.sin(st.t * (1.3 + n * 0.3) + n);
        t.pv.quaternion.copy(t.base); t.pv.rotateX(sway); t.pv.rotateZ(sway * 0.6 * Math.cos(st.t * 0.9 + n));
        t.pv.scale.set(1 + 0.4 * retractT, Math.max(0.07, 1 - 0.95 * retractT), 1 + 0.4 * retractT);
        if (t.nv) { t.nv.quaternion.copy(t.pv.quaternion); t.nv.scale.copy(t.pv.scale); }                          // a tentacle is pulled in by turning it inside out: it shortens and thickens
      });
      if (st.walk > 0.01 || h > 0.01 || !m._init) { fillFoot(st.cycle, st.walk * (1 - h)); m._init = true; }
      const beat = Math.pow(Math.max(0, Math.sin(st.t * 5.2)), 4); heartPv.scale.setScalar(1 + 0.18 * beat);              // the heart beats
      return 0.22 * st.walk * (1 - h);
    },
  };
  m.update(0.0001);
  return m;
}
