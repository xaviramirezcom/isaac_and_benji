// The tsunami physics: a real shallow-water simulation (the same kind of equations scientists use to forecast tsunamis).
// The sea is a grid of 30 m squares. Water height and water flow update every fraction of a second:
//   - how fast a wave travels depends on the depth:  speed = sqrt(gravity × depth)   (jet-plane fast in the deep sea, slow near the beach)
//   - as the sea gets shallow the wave slows down, bunches up and grows tall, then runs up over the land.
// The seabed shape (deep ocean → slope → shelf → beach → town → hill) is made in `bathy`. Houses slow the water down and break when it is deep and fast.
export const NX = 300, NY = 170, DX = 30, G = 9.81, DMIN = 0.02;
const N = NX * NY;
export const idx = (i, j) => i + NX * j;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const PROFILE = [[0, -2400], [2200, -2400], [3600, -1000], [4600, -130], [5400, -42], [5800, -7], [6000, 0], [6150, 2.5], [6500, 6], [7000, 14], [7600, 60], [8200, 110], [9000, 150]];

// ground height in metres at (x, y) in metres: negative = under the sea
export function bathy(x, y) {
  const xs = x - 150 * Math.sin(y / 820) - 80 * Math.sin(y / 330 + 1);          // the coastline curves in and out
  let k = 0; while (k < PROFILE.length - 2 && xs > PROFILE[k + 1][0]) k++;
  const [x0, b0] = PROFILE[k], [x1, b1] = PROFILE[k + 1], t = Math.min(1, Math.max(0, (xs - x0) / (x1 - x0))), s = t * t * (3 - 2 * t);
  let b = b0 + (b1 - b0) * s;
  const river = Math.exp(-(((y - 2600) / 140) ** 2)); if (xs > 5900) b -= 5.5 * river * smooth(5900, 6300, xs) * (1 - smooth(7000, 7500, xs));   // a river valley that the water loves to follow
  return b;
}

export function createSim() {
  const b = new Float32Array(N), eta = new Float32Array(N), n0 = new Float32Array(N), nn = new Float32Array(N), foam = new Float32Array(N);
  const Px = new Float32Array((NX + 1) * NY), Py = new Float32Array(NX * (NY + 1)), u = new Float32Array(N), v = new Float32Array(N);
  const sources = [], S = { time: 0, quakeTime: -1, maxEta: 0, front: 0, frontEta: 0, maxRun: 0, shoreX: 6000, shoreMin: 1e9 };
  for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
    const k = idx(i, j), x = (i + 0.5) * DX, y = (j + 0.5) * DX; b[k] = bathy(x, y); eta[k] = Math.max(0, b[k]);
    n0[k] = b[k] < 0 ? 0.025 : (b[k] > 40 ? 0.08 : 0.03); nn[k] = n0[k];
  }
  const wet = (k) => eta[k] - b[k];

  function step(dt) {
    // 1. the water level changes where more flows in than out
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const k = idx(i, j), dq = (Px[i + 1 + (NX + 1) * j] - Px[i + (NX + 1) * j] + Py[i + NX * (j + 1)] - Py[i + NX * j]) / DX;
      let e = eta[k] - dt * dq; if (!(e > b[k])) e = b[k]; eta[k] = e;
    }
    // 2. an earthquake under the sea lifts (and drops) the seabed, and the water above follows
    for (let s = sources.length - 1; s >= 0; s--) {
      const q = sources[s], f = dt / q.dur; q.t += dt; if (q.t > q.dur + dt) { sources.splice(s, 1); continue; }
      const r = Math.ceil(3.2 * q.R / DX) + 2, ci = Math.round(q.cx / DX), cj = Math.round(q.cy / DX);
      for (let j = Math.max(0, cj - r * 3); j < Math.min(NY, cj + r * 3); j++) for (let i = Math.max(0, ci - r - 55); i < Math.min(NX, ci + r + 55); i++) {
        const k = idx(i, j); if (b[k] > -250) continue; const x = (i + 0.5) * DX, y = (j + 0.5) * DX, deepOnly = smooth(-250, -700, b[k]);   // quakes that make tsunamis happen in the deep trench
        const up = Math.exp(-(((x - q.cx) / q.R) ** 2 + ((y - q.cy) / (2.3 * q.R)) ** 2)), down = Math.exp(-(((x - q.cx - 1.5 * q.R) / (1.1 * q.R)) ** 2 + ((y - q.cy) / (2.3 * q.R)) ** 2));
        eta[k] += q.A * (up - 1.0 * down) * f * deepOnly;
      }
    }
    // 3. the water accelerates down the slope of its own surface, and rubs against the ground
    for (let j = 0; j < NY; j++) for (let i = 1; i < NX; i++) {
      const kR = idx(i, j), kL = kR - 1, f = i + (NX + 1) * j, d = 0.5 * (eta[kL] + eta[kR]) - Math.max(b[kL], b[kR]);
      if (d < DMIN) { Px[f] = 0; continue; }
      const my = 0.25 * (Py[i - 1 + NX * j] + Py[i - 1 + NX * (j + 1)] + Py[i + NX * j] + Py[i + NX * (j + 1)]), M = Math.hypot(Px[f], my), fr = G * 0.5 * (nn[kL] + nn[kR]) ** 2 * M / Math.pow(d, 2.333);
      let p = (Px[f] - dt * G * d * (eta[kR] - eta[kL]) / DX) / (1 + dt * fr); const lim = d * 16; Px[f] = p > lim ? lim : p < -lim ? -lim : p;
    }
    for (let j = 1; j < NY; j++) for (let i = 0; i < NX; i++) {
      const kU = idx(i, j), kD = kU - NX, f = i + NX * j, d = 0.5 * (eta[kD] + eta[kU]) - Math.max(b[kD], b[kU]);
      if (d < DMIN) { Py[f] = 0; continue; }
      const mx = 0.25 * (Px[i + (NX + 1) * (j - 1)] + Px[i + 1 + (NX + 1) * (j - 1)] + Px[i + (NX + 1) * j] + Px[i + 1 + (NX + 1) * j]), M = Math.hypot(Py[f], mx), fr = G * 0.5 * (nn[kD] + nn[kU]) ** 2 * M / Math.pow(d, 2.333);
      let p = (Py[f] - dt * G * d * (eta[kU] - eta[kD]) / DX) / (1 + dt * fr); const lim = d * 16; Py[f] = p > lim ? lim : p < -lim ? -lim : p;
    }
    // 4. the edges: the open sea lets waves leave, the sides soak them up, the hill is a wall
    for (let j = 0; j < NY; j++) { Px[(NX + 1) * j] = -Math.sqrt(G * Math.max(1, -b[idx(0, j)])) * eta[idx(0, j)] * 0.98; Px[NX + (NX + 1) * j] = 0; }   // (waves leave through the open sea; the hill side is a wall)
    for (let i = 0; i < NX; i++) { Py[i] = 0; Py[i + NX * NY] = 0; }
    const sp = 18; for (let j = 0; j < NY; j++) for (let i = 0; i < sp; i++) { const k = idx(i, j), f = 1 - 0.04 * (1 - i / sp); eta[k] *= b[k] < 0 ? f : 1; }
    for (let i = 0; i < NX; i++) for (let m = 0; m < 12; m++) { const f = 1 - 0.05 * (1 - m / 12); for (const j of [m, NY - 1 - m]) { const k = idx(i, j); if (b[k] < 0) eta[k] *= f; } }
    S.time += dt;
  }

  // shake the sea: a quake of height A (metres of seabed lift) and width R (metres) at (cx, cy)
  function quake(cx, cy, A, R) { sources.push({ cx, cy, A, R, t: 0, dur: 6 }); S.quakeTime = S.time; S.maxRun = 0; S.shoreMin = 1e9; }

  // read the sea: speeds, and the biggest wave and where its front is (call a few times a second)
  function measure() {
    let mx = 0, front = 0, fe = 0, run = 0, shore = 1e9;
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const k = idx(i, j), d = eta[k] - b[k];
      if (b[k] < -15) { const e = Math.abs(eta[k]); if (e > mx) mx = e; if (e > 0.25 && i > front) { front = i; fe = e; } }
      if (b[k] > 0.3 && d > 0.15 && d > run) run = d;
      if (b[k] < 0 && b[k] > -2 && d < 0.05 && i < shore) shore = i;
    }
    S.maxEta = mx; S.front = front; S.frontEta = fe; if (run > S.maxRun) S.maxRun = run;
    // where the water's edge is, relative to where it began (the beach): shoreline retreat shows as a bigger number
    let edge = 0, cnt = 0; for (let j = 0; j < NY; j += 6) for (let i = 150; i < 230; i++) { const k = idx(i, j); if (eta[k] - b[k] > 0.1 && b[k] > -40) edge = Math.max(edge, i); }
    let low = 0; for (let j = 0; j < NY; j += 6) { let e = -1; for (let i = 120; i < 215; i++) { const k = idx(i, j); if (eta[k] - b[k] > 0.1) e = i; } if (e > 0) { low += e; cnt++; } }
    S.edgeAvg = cnt ? low / cnt : 0; S.edgeMax = edge;
    let dr = 0; for (let j = 0; j < NY; j += 5) for (let i = 188; i < 200; i++) { const k = idx(i, j); if (b[k] < -1.2 && b[k] > -14) dr = Math.min(dr, eta[k] / -b[k]); }   // how far the sea has dropped near the beach (−0.3 = a third of the water gone)
    S.draw = dr;
    return S;
  }

  // flow speed at every cell centre (for foam, debris, damage)
  function flow() {
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const k = idx(i, j), d = eta[k] - b[k];
      if (d < 0.03) { u[k] = 0; v[k] = 0; continue; }
      u[k] = 0.5 * (Px[i + (NX + 1) * j] + Px[i + 1 + (NX + 1) * j]) / d; v[k] = 0.5 * (Py[i + NX * j] + Py[i + NX * (j + 1)]) / d;
    }
  }
  const depthAt = (x, y) => { const i = Math.min(NX - 1, Math.max(0, Math.floor(x / DX))), j = Math.min(NY - 1, Math.max(0, Math.floor(y / DX))); return Math.max(0, wet(idx(i, j))); };
  const velAt = (x, y, out) => { const i = Math.min(NX - 1, Math.max(0, Math.floor(x / DX))), j = Math.min(NY - 1, Math.max(0, Math.floor(y / DX))), k = idx(i, j); out[0] = u[k]; out[1] = v[k]; return out; };
  function reset() { sources.length = 0; for (let k = 0; k < N; k++) { eta[k] = Math.max(0, b[k]); nn[k] = n0[k]; foam[k] = 0; u[k] = 0; v[k] = 0; } Px.fill(0); Py.fill(0); S.time = 0; S.quakeTime = -1; S.maxEta = 0; S.maxRun = 0; S.front = 0; }
  return { b, eta, nn, n0, foam, u, v, S, step, quake, measure, flow, depthAt, velAt, reset, sources };
}
