// The glide: a tiny two-dimensional flight model of the jet after a hand toss (side view). It is deliberately simple, but the physics is the real kind:
// the wing makes lift, the tail keeps it steady, and where the balance point (centre of gravity, CG) sits decides if the jet glides, dives or stalls.
import { WING, NEUTRAL_PERCENT } from './design.js';

const RHO = 1.2, G = 9.81;
const S = WING.area / 1e6, C = WING.mac / 1e3, AR = (WING.b / 1e3) ** 2 / S;
const CLA = (2 * Math.PI * AR) / (AR + 2);          // lift per radian of wing angle
const AS = 0.2;                                      // the angle (rad, ~11 deg) where the flat wing stalls
const SM_REF = 0.14, A_TRIM = 0.105;                 // the design: at 26% balance it settles at ~6 degrees
export const CM0 = CLA * SM_REF * A_TRIM;            // nose-up push from the tail setting
const CM_ELEV = 0.0035;                              // pitching push per degree of elevator

function liftCoef(a) {
  const m = Math.abs(a), s = Math.sign(a); if (m <= AS) return CLA * a;
  const t = Math.min(1, (m - AS) / 0.15);                                // after the stall the lift falls away
  return s * (CLA * AS * (1 - t) + 0.95 * Math.sin(2 * m) * t);
}
function effAngle(a) { const s = Math.sign(a), m = Math.abs(a); return m < AS ? a : s * (AS + 0.35 * (m - AS)); }   // past the stall the wing stops "pulling the nose back"

export function simulate({ massG, cgPct, elevDeg = 0, np = NEUTRAL_PERCENT, dt = 1 / 240, tMax = 25 }) {
  const m = massG / 1000, Iy = m * 0.085 * 0.085, SM = (np - cgPct) / 100;
  let V = 9, g = 0.3, th = 0.4, q = 0, x = 0, y = 1.8, t = 0, maxAlpha = 0, stallTime = 0, minTh = 0, maxTh = 0;
  const path = [];
  while (y > 0 && t < tMax) {
    const a = th - g, qd = 0.5 * RHO * V * V, CL = liftCoef(a), CD = 0.055 + 0.15 * CL * CL + 1.0 * Math.sin(a) ** 2;
    const L = qd * S * CL, D = qd * S * CD;
    const Cm = CM0 + CM_ELEV * elevDeg - CLA * SM * effAngle(a) - 10 * ((q * C) / (2 * Math.max(V, 1)));
    const M = qd * S * C * Cm;
    const Vs = Math.max(V, 0.8);
    V += (-D / m - G * Math.sin(g)) * dt; g += ((L / m - G * Math.cos(g)) / Vs) * dt; q += (M / Iy) * dt; th += q * dt;
    x += V * Math.cos(g) * dt; y += V * Math.sin(g) * dt; t += dt;
    V = Math.max(V, 0.3);
    if (Math.abs(a) > AS * 1.4) stallTime += dt; maxAlpha = Math.max(maxAlpha, Math.abs(a)); minTh = Math.min(minTh, th); maxTh = Math.max(maxTh, th);
    if (path.length === 0 || Math.round(t * 60) !== Math.round((t - dt) * 60)) path.push({ t, x, y, th, g, V });
  }
  let outcome = 'glide';
  if (SM <= 0.02 || maxTh > 2.4 || minTh < -2.4) outcome = 'tumble';
  else if (stallTime > 0.5) outcome = 'stall';
  else if (g < -0.6) outcome = 'dive';
  else if (t < 1.6) outcome = 'short';
  return { path, x, t, outcome, maxAlpha, SM };
}
