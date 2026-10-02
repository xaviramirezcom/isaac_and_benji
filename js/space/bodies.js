// The solar system: data (sizes and distances are playful, not to scale) + procedural planet textures.
export const BODIES = [
  { id: 'sun', kind: 'sun', r: 5, orbit: 0, spin: 0.05, tilt: 0, en: 'Sun', es: 'Sol', color: '#ffb02e',
    fact: { en: 'The Sun is a giant ball of hot, glowing gas. It gives us light and warmth, and over a million Earths could fit inside it!', es: 'El Sol es una enorme bola de gas caliente y brillante. Nos da luz y calor, ¡y en su interior cabrían más de un millón de Tierras!' },
    stat: { en: 'Surface: 5,500 °C', es: 'Superficie: 5.500 °C' }, face: { dark: [0.28, 0.07, 0.0], teeth: [1.0, 0.95, 0.7] } },
  { id: 'mercury', kind: 'mercury', r: 0.6, orbit: 9.5, spin: 0.2, tilt: 0.03, en: 'Mercury', es: 'Mercurio', color: '#a79d94',
    fact: { en: 'The smallest planet, and the closest to the Sun. It zooms around the Sun in just 88 days!', es: 'El planeta más pequeño y el más cercano al Sol. ¡Da la vuelta al Sol en solo 88 días!' }, stat: { en: 'One year: 88 days', es: 'Un año: 88 días' } },
  { id: 'venus', kind: 'venus', r: 0.95, orbit: 14, spin: -0.1, tilt: 3.1, en: 'Venus', es: 'Venus', color: '#e6c78a',
    fact: { en: 'The hottest planet, wrapped in thick clouds. It spins backwards, so the Sun rises in the west!', es: 'El planeta más caliente, envuelto en nubes espesas. ¡Gira al revés, así que el Sol sale por el oeste!' }, stat: { en: 'Hot as 465 °C', es: 'Caliente: 465 °C' } },
  { id: 'earth', kind: 'earth', r: 1.05, orbit: 19, spin: 0.35, tilt: 0.41, en: 'Earth', es: 'Tierra', color: '#3f86d8',
    fact: { en: 'Our home! The only planet we know with oceans of water, and with animals, insects and people.', es: '¡Nuestro hogar! El único planeta que conocemos con océanos de agua, y con animales, insectos y personas.' }, stat: { en: 'One year: 365 days', es: 'Un año: 365 días' },
    moons: [{ id: 'moon', kind: 'moon', r: 0.3, dist: 2.7, w: 0.9, en: 'Moon', es: 'Luna', color: '#c9c9c9',
      fact: { en: 'Earth’s moon is covered in craters. It takes about a month to go around the Earth.', es: 'La Luna está cubierta de cráteres. Tarda más o menos un mes en dar la vuelta a la Tierra.' }, stat: { en: 'Goes around Earth in 27 days', es: 'Da la vuelta a la Tierra en 27 días' } }] },
  { id: 'mars', kind: 'mars', r: 0.75, orbit: 24, spin: 0.33, tilt: 0.44, en: 'Mars', es: 'Marte', color: '#c8603a',
    fact: { en: 'The red planet! It has the tallest volcano in the whole solar system, called Olympus Mons.', es: '¡El planeta rojo! Tiene el volcán más alto de todo el sistema solar, llamado Monte Olimpo.' }, stat: { en: 'One year: 687 days', es: 'Un año: 687 días' },
    moons: [
      { id: 'phobos', kind: 'rockdark', r: 0.14, dist: 1.7, w: 1.5, en: 'Phobos', es: 'Fobos', color: '#8a7f78', fact: { en: 'A tiny, lumpy moon that zooms around Mars three times every day!', es: '¡Una lunita pequeña y llena de bultos que da tres vueltas a Marte cada día!' }, stat: { en: '3 laps of Mars a day', es: '3 vueltas a Marte al día' } },
      { id: 'deimos', kind: 'rockdark', r: 0.11, dist: 2.5, w: 0.95, en: 'Deimos', es: 'Deimos', color: '#9a8f86', fact: { en: 'The smaller of Mars’s two little moons.', es: 'La más pequeña de las dos lunitas de Marte.' }, stat: { en: 'One lap: 30 hours', es: 'Una vuelta: 30 horas' } }] },
  { id: 'jupiter', kind: 'jupiter', r: 2.7, orbit: 33, spin: 0.7, tilt: 0.05, en: 'Jupiter', es: 'Júpiter', color: '#d4a574',
    fact: { en: 'The biggest planet! Its Great Red Spot is a giant storm that is bigger than the whole Earth.', es: '¡El planeta más grande! Su Gran Mancha Roja es una tormenta gigante más grande que toda la Tierra.' }, stat: { en: 'A day lasts just 10 hours', es: 'Un día dura solo 10 horas' },
    moons: [
      { id: 'io', kind: 'io', r: 0.27, dist: 4.1, w: 1.1, en: 'Io', es: 'Ío', color: '#e6d25a', fact: { en: 'The most volcanic place in the solar system, with hundreds of volcanoes!', es: '¡El lugar con más volcanes del sistema solar, con cientos de volcanes!' }, stat: { en: 'Over 400 volcanoes', es: 'Más de 400 volcanes' } },
      { id: 'europa', kind: 'europa', r: 0.23, dist: 5.2, w: 0.8, en: 'Europa', es: 'Europa', color: '#e4dac4', fact: { en: 'A moon covered in ice, with a secret ocean hidden underneath.', es: 'Una luna cubierta de hielo, con un océano secreto escondido debajo.' }, stat: { en: 'Ocean under the ice', es: 'Océano bajo el hielo' } },
      { id: 'ganymede', kind: 'ganymede', r: 0.36, dist: 6.5, w: 0.6, en: 'Ganymede', es: 'Ganimedes', color: '#948576', fact: { en: 'The biggest moon in the solar system. It is even bigger than the planet Mercury!', es: 'La luna más grande del sistema solar. ¡Es incluso más grande que el planeta Mercurio!' }, stat: { en: 'Biggest moon', es: 'La luna más grande' } },
      { id: 'callisto', kind: 'callisto', r: 0.33, dist: 8.0, w: 0.45, en: 'Callisto', es: 'Calisto', color: '#6b6258', fact: { en: 'A very old moon with more craters than almost anywhere else.', es: 'Una luna muy antigua con más cráteres que casi cualquier otro lugar.' }, stat: { en: 'Most craters', es: 'Con más cráteres' } }] },
  { id: 'saturn', kind: 'saturn', r: 2.3, orbit: 43, spin: 0.65, tilt: 0.47, rings: true, en: 'Saturn', es: 'Saturno', color: '#e3c98e',
    fact: { en: 'Famous for its beautiful rings made of ice and rock. It is so light it would float in water!', es: 'Famoso por sus hermosos anillos de hielo y roca. ¡Es tan liviano que flotaría en el agua!' }, stat: { en: 'Rings: 280,000 km wide', es: 'Anillos: 280.000 km de ancho' },
    moons: [{ id: 'titan', kind: 'titan', r: 0.36, dist: 6.2, w: 0.5, en: 'Titan', es: 'Titán', color: '#d89a3a', fact: { en: 'Saturn’s big moon, with thick orange air and lakes of liquid gas.', es: 'La gran luna de Saturno, con aire naranja espeso y lagos de gas líquido.' }, stat: { en: 'Has thick orange air', es: 'Tiene aire naranja espeso' } }] },
  { id: 'uranus', kind: 'uranus', r: 1.6, orbit: 52, spin: 0.45, tilt: 1.7, en: 'Uranus', es: 'Urano', color: '#9fdbe3',
    fact: { en: 'An icy planet that spins on its side, like a ball rolling around the Sun.', es: 'Un planeta helado que gira de lado, como una pelota rodando alrededor del Sol.' }, stat: { en: 'Tilted on its side', es: 'Inclinado de lado' } },
  { id: 'neptune', kind: 'neptune', r: 1.55, orbit: 60, spin: 0.5, tilt: 0.5, en: 'Neptune', es: 'Neptuno', color: '#3f63d8',
    fact: { en: 'A deep blue icy planet with the fastest winds in the solar system.', es: 'Un planeta helado de un azul profundo con los vientos más rápidos del sistema solar.' }, stat: { en: 'Winds: 2,000 km/h', es: 'Vientos: 2.000 km/h' },
    moons: [{ id: 'triton', kind: 'triton', r: 0.24, dist: 3.5, w: -0.7, en: 'Triton', es: 'Tritón', color: '#e0c8c8', fact: { en: 'Neptune’s cold moon. It goes around backwards, and has geysers of icy gas!', es: 'La luna fría de Neptuno. ¡Gira al revés y tiene géiseres de gas helado!' }, stat: { en: 'Orbits backwards', es: 'Gira al revés' } }] },
  { id: 'pluto', kind: 'pluto', r: 0.42, orbit: 67, spin: 0.15, tilt: 2.0, en: 'Pluto', es: 'Plutón', color: '#c9a98a',
    fact: { en: 'A tiny, far-away dwarf planet. It has a big heart-shaped icy plain!', es: '¡Un planeta enano, pequeño y lejano. Tiene una gran llanura de hielo con forma de corazón!' }, stat: { en: 'One year: 248 Earth years', es: 'Un año: 248 años terrestres' },
    moons: [{ id: 'charon', kind: 'charon', r: 0.22, dist: 1.1, w: 0.8, en: 'Charon', es: 'Caronte', color: '#9a908a', fact: { en: 'Pluto’s big moon. Pluto and Charon are almost like a double planet!', es: 'La gran luna de Plutón. ¡Plutón y Caronte son casi como un planeta doble!' }, stat: { en: 'Half as wide as Pluto', es: 'Mide la mitad que Plutón' } }] },
];

// ---------------------------------------------------------------- procedural textures
function hash(ix, iy, s) { let h = (ix * 374761393 + iy * 668265263 + s * 2147483647) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967295; }
function vnoise(x, y, px, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const x0 = ((xi % px) + px) % px, x1 = (x0 + 1) % px, a = hash(x0, yi, s), b = hash(x1, yi, s), c = hash(x0, yi + 1, s), d = hash(x1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, px, oct, s) { let a = 0.5, f = 1, sum = 0, n = 0; for (let o = 0; o < oct; o++) { sum += a * vnoise(x * f, y * f, px * f, s + o * 7); n += a; f *= 2; a *= 0.5; } return sum / n; }
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function craters(ctx, w, h, n, seed, dark = 0.35, light = 0.15, maxR = 0.07) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = (0.1 + r() * 0.8) * h, rad = (0.008 + r() * r() * maxR) * w;
    for (const dx of [-w, 0, w]) {
      const g = ctx.createRadialGradient(x + dx - rad * 0.2, y - rad * 0.2, rad * 0.1, x + dx, y, rad);
      g.addColorStop(0, `rgba(0,0,0,${dark})`); g.addColorStop(0.75, `rgba(0,0,0,${dark * 0.55})`); g.addColorStop(0.9, `rgba(255,255,255,${light})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + dx, y, rad, 0, 7); ctx.fill();
    }
  }
}

const GAS = {
  jupiter: ['#b98a5b', '#e8d6b8', '#a56d3c', '#f0e2c9', '#c79a6a', '#8a5a34', '#e2c9a4', '#b27a4a', '#efdcc0', '#9c6a3e'],
  saturn: ['#d9bf86', '#ecd9a9', '#cfb277', '#f0e1b8', '#d5b97e', '#e6d09b'],
  neptune: ['#2c4fc4', '#4b78e6', '#2547b0', '#5a86ee', '#2a50c8'],
  uranus: ['#8fd5df', '#a8e3ea', '#86cdd8', '#b4e8ee'],
  venus: ['#e8cf93', '#f4e2b0', '#d8b878', '#f1dca4'],
};

export function paint(body, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  const id = x.createImageData(w, h), d = id.data, kind = body.kind, S = body.id.length * 31 + 7, PX = 6;
  const put = (i, col) => { d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255; };
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const u = i / w, v = j / h, nx = u * PX, ny = v * PX / 2, idx = (j * w + i) * 4; let col;
    const n = fbm(nx, ny, PX, 5, S), n2 = fbm(nx * 2 + 5, ny * 2, PX * 2, 4, S + 3);
    if (kind === 'sun') { const t = sm(0.3, 0.75, fbm(nx * 3, ny * 3, PX * 3, 4, S)); col = mix(hex('#ff7a10'), hex('#fff0a0'), t * 0.9 + 0.1); }
    else if (kind === 'earth') {
      const lat = Math.abs(v - 0.5) * 2, land = sm(0.5, 0.56, n + 0.03 * (1 - lat)), ocean = mix(hex('#1b5ca8'), hex('#2f86d6'), n2);
      const green = mix(hex('#3f8a3a'), hex('#8a7a3c'), sm(0.45, 0.8, n2)); col = mix(ocean, green, land);
      const cloud = sm(0.52, 0.72, fbm(nx * 2 + 9, ny * 2, PX * 2, 5, S + 11)); col = mix(col, [255, 255, 255], cloud * 0.8);
      col = mix(col, [245, 248, 255], sm(0.84, 0.93, lat));
    }
    else if (kind === 'mars') { col = mix(hex('#c8603a'), hex('#8a3a20'), sm(0.42, 0.7, n2)); col = mix(col, hex('#e8a070'), sm(0.55, 0.8, n) * 0.4); col = mix(col, [250, 245, 240], sm(0.9, 0.96, Math.abs(v - 0.5) * 2)); }
    else if (GAS[kind]) {
      const pal = GAS[kind].map(hex), warp = (fbm(nx, ny * 3, PX, 4, S) - 0.5) * (kind === 'venus' ? 0.5 : 0.06);
      const t = ((v + warp) * pal.length * (kind === 'uranus' ? 0.5 : 1)), a = Math.floor(t), f = t - a;
      col = mix(pal[((a % pal.length) + pal.length) % pal.length], pal[(((a + 1) % pal.length) + pal.length) % pal.length], sm(0.25, 0.75, f));
      col = mix(col, [255, 255, 255], (fbm(nx * 4, ny * 6, PX * 4, 3, S + 5) - 0.5) * 0.18);
    }
    else if (kind === 'pluto') { col = mix(hex('#b58a6a'), hex('#d8c0a8'), n); }
    else if (kind === 'io') { col = mix(hex('#e8d450'), hex('#f3ea9a'), n2); const sp = sm(0.62, 0.7, fbm(nx * 4, ny * 4, PX * 4, 2, S + 2)); col = mix(col, hex('#d2691e'), sp * 0.8); col = mix(col, [40, 30, 20], sm(0.72, 0.76, fbm(nx * 6, ny * 6, PX * 6, 2, S + 8)) * 0.9); }
    else if (kind === 'europa') { col = mix(hex('#ece4cf'), hex('#d8caa8'), n2); }
    else if (kind === 'titan') { col = mix(hex('#d8963a'), hex('#e8b060'), n); }
    else if (kind === 'triton') { col = mix(hex('#dcc4c4'), hex('#f0e0e0'), n); }
    else if (kind === 'ganymede') { col = mix(hex('#7a6d60'), hex('#b0a08e'), sm(0.4, 0.7, n)); }
    else if (kind === 'callisto') { col = mix(hex('#4f473f'), hex('#7a6e62'), n); }
    else if (kind === 'charon') { col = mix(hex('#8a8078'), hex('#b0a8a0'), n); col = mix(col, hex('#7a3a2a'), sm(0.82, 0.95, v) * 0.7); }
    else if (kind === 'rockdark') { col = mix(hex('#6a625c'), hex('#9a9088'), n); }
    else if (kind === 'mercury') { col = mix(hex('#7d756e'), hex('#b0a89e'), n); }
    else { col = mix(hex('#8a8a8a'), hex('#d0d0d0'), n); } // moon
    put(idx, col);
  }
  x.putImageData(id, 0, 0);
  if (kind === 'earth' || kind === 'sun' || GAS[kind]) { /* no craters */ }
  else if (kind === 'pluto') { x.fillStyle = 'rgba(240,230,215,.75)'; x.beginPath(); const cx = w * 0.62, cy = h * 0.52, s = h * 0.17; x.moveTo(cx, cy + s); x.bezierCurveTo(cx - s * 2, cy - s * 0.4, cx - s * 0.8, cy - s * 1.6, cx, cy - s * 0.5); x.bezierCurveTo(cx + s * 0.8, cy - s * 1.6, cx + s * 2, cy - s * 0.4, cx, cy + s); x.fill(); craters(x, w, h, 10, 3, 0.2, 0.1, 0.05); }
  else if (kind === 'europa') { const r = rng(5); x.strokeStyle = 'rgba(150,90,50,.55)'; for (let i = 0; i < 38; i++) { x.lineWidth = 1 + r() * 2; x.beginPath(); let px = r() * w, py = r() * h; x.moveTo(px, py); for (let k = 0; k < 4; k++) { px += (r() - 0.5) * w * 0.25; py += (r() - 0.5) * h * 0.3; x.lineTo(px, py); } x.stroke(); } }
  else if (kind === 'titan' || kind === 'triton' || kind === 'io') { /* smooth */ }
  else { craters(x, w, h, kind === 'callisto' ? 90 : kind === 'rockdark' ? 40 : 55, S, 0.38, 0.16, kind === 'rockdark' ? 0.12 : 0.07); }
  if (GAS[kind] && kind === 'jupiter') { const g = x.createRadialGradient(w * 0.7, h * 0.64, 2, w * 0.7, h * 0.64, h * 0.1); g.addColorStop(0, 'rgba(190,70,40,.95)'); g.addColorStop(0.7, 'rgba(200,100,60,.7)'); g.addColorStop(1, 'rgba(200,100,60,0)'); x.fillStyle = g; x.save(); x.translate(w * 0.7, h * 0.64); x.scale(1.7, 1); x.translate(-w * 0.7, -h * 0.64); x.beginPath(); x.arc(w * 0.7, h * 0.64, h * 0.1, 0, 7); x.fill(); x.restore(); }
  return c;
}

export function ringTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 4; const x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 512, 0);
  [[0, 'rgba(220,200,160,0)'], [0.06, 'rgba(220,200,160,.55)'], [0.22, 'rgba(235,215,175,.9)'], [0.4, 'rgba(200,175,135,.35)'], [0.46, 'rgba(60,50,40,.05)'], [0.52, 'rgba(225,205,165,.85)'], [0.8, 'rgba(215,195,155,.7)'], [1, 'rgba(215,195,155,0)']].forEach(([t, col]) => g.addColorStop(t, col));
  x.fillStyle = g; x.fillRect(0, 0, 512, 4); return c;
}
