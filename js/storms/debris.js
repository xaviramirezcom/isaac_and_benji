// A pool of flying debris (boards, plywood, shingles, siding, leaves, dirt, bricks, branches) drawn as one InstancedMesh.
// Each piece feels the wind's drag (light, flat pieces much more than bricks), gravity, and bounces and slides on the ground.
import * as THREE from '../../vendor/three.module.min.js';

export const TYPES = [
  { s: [[1.2, 2.6], [0.06, 0.1], [0.04, 0.09]], col: ['#b88f5a', '#a67c4a', '#c9a06a'], k: 0.05 },        // 0 plank
  { s: [[0.7, 1.3], [0.02, 0.03], [0.7, 1.2]], col: ['#c8a674', '#b99560'], k: 0.06 },                      // 1 plywood
  { s: [[0.3, 0.45], [0.02, 0.025], [0.25, 0.35]], col: ['#2c2c30', '#3b3532', '#4a403a'], k: 0.14 },     // 2 shingle
  { s: [[1.4, 2.2], [0.02, 0.03], [0.18, 0.3]], col: ['#f1ede4', '#e8dcc2', '#b9cfe0', '#c9d3c4'], k: 0.09 }, // 3 siding
  { s: [[0.1, 0.16], [0.01, 0.01], [0.08, 0.13]], col: ['#4e8a3a', '#6a9a3c', '#8a9a3c', '#a8842c'], k: 0.5 },  // 4 leaf
  { s: [[0.12, 0.3], [0.1, 0.25], [0.12, 0.3]], col: ['#5a4630', '#6a5538', '#4a3a28'], k: 0.2 },        // 5 dirt
  { s: [[0.22, 0.22], [0.1, 0.1], [0.1, 0.1]], col: ['#9a4a3a', '#8a3f32'], k: 0.02 },                    // 6 brick
  { s: [[1.0, 2.2], [0.05, 0.08], [0.05, 0.08]], col: ['#5d4631', '#6b5238'], k: 0.07 },                   // 7 (unused) / 8 branch
  { s: [[1.0, 2.2], [0.05, 0.08], [0.05, 0.08]], col: ['#5d4631', '#6b5238'], k: 0.07 },                   // 8 branch
];

export function createDebris(scene, N = 1100) {
  const geo = new THREE.BoxGeometry(1, 1, 1), mesh = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ roughness: 0.9 }), N);
  mesh.castShadow = true; mesh.frustumCulled = false; mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); scene.add(mesh);
  const pos = new Float32Array(N * 3), vel = new Float32Array(N * 3), scl = new Float32Array(N * 3), kk = new Float32Array(N), rate = new Float32Array(N), axs = new Float32Array(N * 3);
  const state = new Uint8Array(N); // 0 free · 1 flying · 2 resting
  const quats = Array.from({ length: N }, () => new THREE.Quaternion()), yaw = new Float32Array(N);
  const m4 = new THREE.Matrix4(), p3 = new THREE.Vector3(), s3 = new THREE.Vector3(), dq = new THREE.Quaternion(), ax = new THREE.Vector3(), w = new THREE.Vector3(), zero = new THREE.Matrix4().makeScale(0, 0, 0), col = new THREE.Color();
  for (let i = 0; i < N; i++) mesh.setMatrixAt(i, zero);
  let ptr = 0, active = 0;
  const R = (a, b) => a + Math.random() * (b - a);

  function spawn(type, x, y, z, vx = 0, vy = 0, vz = 0, spin = 6) {
    const T = TYPES[type], i = ptr; ptr = (ptr + 1) % N;
    pos.set([x, y, z], i * 3); vel.set([vx, vy, vz], i * 3);
    scl.set([R(...T.s[0]), R(...T.s[1]), R(...T.s[2])], i * 3); kk[i] = T.k * R(0.8, 1.25);
    quats[i].setFromEuler(new THREE.Euler(R(0, 6.28), R(0, 6.28), R(0, 6.28))); ax.set(R(-1, 1), R(-1, 1), R(-1, 1)).normalize(); axs.set([ax.x, ax.y, ax.z], i * 3); rate[i] = R(-1, 1) * spin;
    col.set(T.col[Math.floor(Math.random() * T.col.length)]); mesh.setColorAt(i, col); mesh.instanceColor.needsUpdate = true; state[i] = 1; yaw[i] = R(0, 6.28);
  }
  function clear() { state.fill(0); for (let i = 0; i < N; i++) mesh.setMatrixAt(i, zero); mesh.instanceMatrix.needsUpdate = true; ptr = 0; }

  function update(dt, windAt, time) {
    active = 0;
    for (let i = 0; i < N; i++) {
      const s = state[i]; if (!s) continue; const i3 = i * 3;
      const x = pos[i3], y = pos[i3 + 1], z = pos[i3 + 2]; windAt(x, y, z, w, time);
      const k = kk[i];
      if (s === 2) { // lying on the ground: a strong enough wind picks it up again
        const sp2 = w.x * w.x + w.z * w.z + w.y * w.y; if (k * sp2 < 6.0) continue;
        state[i] = 1; vel[i3 + 1] = 2 + Math.random() * 3; rate[i] = (Math.random() - 0.5) * 6;
      }
      active++;
      let vx = vel[i3], vy = vel[i3 + 1], vz = vel[i3 + 2];
      const rx = w.x - vx, ry = w.y - vy, rz = w.z - vz, rl = Math.hypot(rx, ry, rz);
      vx += rx * rl * k * dt; vy += (ry * rl * k - 9.8) * dt; vz += rz * rl * k * dt;
      const sp = Math.hypot(vx, vy, vz); if (sp > 85) { const f = 85 / sp; vx *= f; vy *= f; vz *= f; }
      let nx = x + vx * dt, ny = y + vy * dt, nz = z + vz * dt;
      const floor = Math.max(scl[i3 + 1], 0.05) * 0.6;
      if (ny < floor) {
        ny = floor; if (vy < -1.2) vy = -vy * 0.28; else vy = 0; vx *= 0.82; vz *= 0.82; rate[i] *= 0.7;
        if (Math.hypot(vx, vz) < 0.8 && Math.abs(vy) < 1.2) { state[i] = 2; vel[i3] = vel[i3 + 1] = vel[i3 + 2] = 0; quats[i].setFromAxisAngle(ax.set(0, 1, 0), yaw[i]); pos[i3] = nx; pos[i3 + 1] = floor; pos[i3 + 2] = nz; p3.set(nx, floor, nz); s3.set(scl[i3], scl[i3 + 1], scl[i3 + 2]); mesh.setMatrixAt(i, m4.compose(p3, quats[i], s3)); continue; }
      }
      vel[i3] = vx; vel[i3 + 1] = vy; vel[i3 + 2] = vz; pos[i3] = nx; pos[i3 + 1] = ny; pos[i3 + 2] = nz;
      const r = rate[i] * dt * (0.5 + Math.min(2, rl * 0.05));
      ax.set(axs[i3], axs[i3 + 1], axs[i3 + 2]); dq.setFromAxisAngle(ax, r); quats[i].multiply(dq);
      p3.set(nx, ny, nz); s3.set(scl[i3], scl[i3 + 1], scl[i3 + 2]); mesh.setMatrixAt(i, m4.compose(p3, quats[i], s3));
    }
    mesh.instanceMatrix.needsUpdate = true;
  }
  return { mesh, spawn, update, clear, get active() { return active; } };
}
