// Sky dome, storm clouds (a big dark deck plus a lower, swirling wall cloud), rain and lightning.
import * as THREE from '../../vendor/three.module.min.js';

const NOISE = `
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++){ s += a * vn(p); p = p * 2.03 + 11.7; a *= 0.5; } return s; }
`;

export function createSky() {
  const u = { uTop: { value: new THREE.Color(0x1a2224) }, uHor: { value: new THREE.Color(0x56635d) }, uFlash: { value: 0 } };
  const m = new THREE.Mesh(new THREE.SphereGeometry(2600, 32, 16), new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false, uniforms: u,
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform vec3 uTop, uHor; uniform float uFlash; varying vec3 vP; void main(){ float h = clamp(normalize(vP).y, 0.0, 1.0); vec3 c = mix(uHor, uTop, pow(h, 0.55)); c += vec3(0.55, 0.6, 0.8) * uFlash * (1.0 - h * 0.5); gl_FragColor = vec4(c, 1.0); }',
  }));
  m.renderOrder = -10; m.frustumCulled = false;
  return { mesh: m, u };
}

export function createClouds() {
  const group = new THREE.Group(), layers = [];
  const make = (y, R, seed, swirl, alpha, dark) => {
    const U = { uTime: { value: 0 }, uCenter: { value: new THREE.Vector2() }, uR: { value: R }, uY: { value: y }, uCamY: { value: 0 }, uCover: { value: 1 }, uSwirl: { value: swirl }, uAlpha: { value: alpha }, uDark: { value: dark }, uSeed: { value: seed }, uFlash: { value: 0 }, uGreen: { value: 0 } };
    const mt = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, uniforms: U,
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `${NOISE}
        uniform float uTime, uR, uY, uCamY, uCover, uSwirl, uAlpha, uDark, uSeed, uFlash, uGreen; uniform vec2 uCenter; varying vec3 vW;
        void main(){
          vec2 p = vW.xz - uCenter; float r = length(p) / uR;
          float a = uSwirl * (1.0 - clamp(r, 0.0, 1.0)) * uTime * 0.12; vec2 q = vec2(cos(a) * p.x - sin(a) * p.y, sin(a) * p.x + cos(a) * p.y);
          float n = fbm(q * 0.011 + uSeed), n2 = fbm(q * 0.034 + 5.0 + uTime * 0.01 + uSeed);
          float dens = smoothstep(0.52 - 0.34 * uCover, 0.86, n * 0.72 + n2 * 0.42) * (1.0 - smoothstep(0.5, 1.0, r));
          vec3 col = mix(vec3(0.05, 0.06, 0.07), vec3(0.48, 0.5, 0.5), clamp(n2 * (0.45 + 0.9 * r) * (1.0 - 0.6 * uDark) + 0.05 + 0.25 * n * r, 0.0, 1.0));
          col *= mix(vec3(1.0), vec3(0.86, 1.0, 0.9), uGreen);
          col += vec3(0.5, 0.55, 0.8) * uFlash * (1.0 - r);
          float fade = smoothstep(6.0, 46.0, abs(uCamY - uY)) * (uCamY > uY ? 0.8 : 1.0);   // see-through while the camera is inside the layer; seen from far above it shows the storm's swirl
          gl_FragColor = vec4(col, dens * uAlpha * fade);
        }`,
    });
    const m = new THREE.Mesh(new THREE.CircleGeometry(R, 64), mt); m.rotation.x = -Math.PI / 2; m.position.y = y; m.frustumCulled = false; m.renderOrder = 1;
    group.add(m); layers.push({ m, U }); return { m, U };
  };
  make(236, 760, 1.3, 0.3, 0.8, 0.5); make(206, 620, 7.1, 0.5, 0.9, 0.7); make(176, 480, 3.7, 0.8, 0.95, 0.85);
  const wall = make(162, 170, 9.4, 2.2, 1, 1);     // the low, rotating wall cloud the funnel hangs from
  return { group, layers, wall };
}

export function createRain(count = 9000) {
  const base = new Float32Array(count * 2 * 3), end = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) { const x = Math.random() * 140, y = Math.random() * 70, z = Math.random() * 140; for (let k = 0; k < 2; k++) { base.set([x, y, z], (i * 2 + k) * 3); end[i * 2 + k] = k; } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(base, 3)); g.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
  const U = { uTime: { value: 0 }, uCenter: { value: new THREE.Vector3() }, uWind: { value: new THREE.Vector2() }, uStorm: { value: new THREE.Vector2() }, uCell: { value: 120 }, uRain: { value: 0 } };
  const m = new THREE.LineSegments(g, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: U,
    vertexShader: `attribute float aEnd; uniform float uTime, uCell; uniform vec3 uCenter; uniform vec2 uWind, uStorm; varying float vA;
      void main(){
        vec3 vel = vec3(uWind.x * 1.1, -24.0, uWind.y * 1.1);
        vec3 w = mod(position + vel * uTime, vec3(140.0, 70.0, 140.0)) - vec3(70.0, 0.0, 70.0);
        w += vec3(uCenter.x, 0.0, uCenter.z);
        w -= vel * 0.026 * aEnd;                                                 // streak tail
        float d = length(w.xz - uStorm);
        vA = (1.0 - smoothstep(uCell * 0.55, uCell, d)) * (1.0 - 0.6 * aEnd);
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }`,
    fragmentShader: 'uniform float uRain; varying float vA; void main(){ gl_FragColor = vec4(0.8, 0.86, 0.92, 0.5 * vA * uRain); }',
  }));
  m.frustumCulled = false; m.renderOrder = 6;
  return { mesh: m, U };
}

// forked, jittery lightning bolts that flash for a moment
export function createLightning(scene) {
  const bolts = [], mat = (o) => new THREE.LineBasicMaterial({ color: 0xdfe8ff, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false });
  function path(from, to, jitter, out) {
    const segs = 14, pts = [from.clone()];
    for (let i = 1; i < segs; i++) { const t = i / segs, p = from.clone().lerp(to, t); p.x += (Math.random() - 0.5) * jitter; p.z += (Math.random() - 0.5) * jitter; pts.push(p); }
    pts.push(to.clone()); for (let i = 0; i < pts.length - 1; i++) out.push(pts[i], pts[i + 1]); return pts;
  }
  return {
    strike(x, z, topY = 190) {
      const v = [], top = new THREE.Vector3(x + (Math.random() - 0.5) * 40, topY, z + (Math.random() - 0.5) * 40), hit = new THREE.Vector3(x, 0.3, z);
      const main = path(top, hit, 22, v);
      for (let f = 0; f < 3; f++) { const s = main[2 + Math.floor(Math.random() * 8)], e = s.clone().add(new THREE.Vector3((Math.random() - 0.5) * 90, -30 - Math.random() * 60, (Math.random() - 0.5) * 90)); e.y = Math.max(e.y, 5); path(s, e, 12, v); }
      const g = new THREE.BufferGeometry().setFromPoints(v), lines = [new THREE.LineSegments(g, mat(1)), new THREE.LineSegments(g, mat(0.6))];
      lines[1].position.set(0.35, 0, 0.25); lines[1].scale.setScalar(1.002); lines.forEach((l) => { l.frustumCulled = false; l.renderOrder = 8; scene.add(l); });
      bolts.push({ lines, g, age: 0, x, z });
    },
    update(dt) {
      let flash = 0;
      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i]; b.age += dt; const t = b.age, on = t < 0.1 || (t > 0.16 && t < 0.24) || (t > 0.3 && t < 0.34 && Math.random() < 0.7);
        b.lines[0].material.opacity = on ? 1 : 0; b.lines[1].material.opacity = on ? 0.6 : 0; b.lines.forEach((l) => (l.visible = on));
        flash = Math.max(flash, on ? 1 - t * 1.5 : Math.max(0, 0.35 - t));
        if (t > 0.4) { b.lines.forEach((l) => scene.remove(l)); b.g.dispose(); bolts.splice(i, 1); }
      }
      return Math.max(0, flash);
    },
    clear() { for (const b of bolts) { b.lines.forEach((l) => scene.remove(l)); b.g.dispose(); } bolts.length = 0; },
  };
}

// a low, dark shelf/roll cloud ringing the storm's gust front
export function createShelf() {
  const U = { uTime: { value: 0 }, uR: { value: 150 }, uH: { value: 70 }, uBase: { value: 55 }, uAmt: { value: 1 } };
  const m = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 96, 1, true), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, fog: false, uniforms: U,
    vertexShader: `uniform float uR, uH, uBase; varying float vT; varying float vAng;
      void main(){ float ang = atan(position.z, position.x), t = uv.y; float r = uR * (1.0 + 0.16 * (1.0 - t)); vT = t; vAng = ang;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(cos(ang) * r, uBase + t * uH, sin(ang) * r, 1.0); }`,
    fragmentShader: `${NOISE}
      uniform float uTime, uAmt; varying float vT; varying float vAng;
      void main(){
        float n = fbm(vec2(vAng * 7.0 + uTime * 0.2, vT * 4.0 - uTime * 0.3)), n2 = fbm(vec2(vAng * 19.0 - uTime * 0.35, vT * 9.0 + 3.0));
        float a = smoothstep(0.32, 0.8, n * 0.8 + n2 * 0.35) * smoothstep(0.0, 0.18, vT) * (1.0 - smoothstep(0.65, 1.0, vT)) * uAmt;
        vec3 col = mix(vec3(0.1, 0.11, 0.12), vec3(0.5, 0.52, 0.52), n * (1.0 - vT) * 0.9 + n2 * 0.1);
        gl_FragColor = vec4(col, a * 0.85);
      }`,
  }));
  m.frustumCulled = false; m.renderOrder = 2;
  return { mesh: m, U };
}

// dust and spray kicked up along the ground by the outflow wind, spreading outward from the storm
export function createGustDust(count = 1800) {
  const seed = new Float32Array(count * 4); for (let i = 0; i < count * 4; i++) seed[i] = Math.random();
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
  const U = { uTime: { value: 0 }, uPixel: { value: 600 }, uAmt: { value: 1 }, uRing: { value: 75 } };
  const m = new THREE.Points(g, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: U,
    vertexShader: `attribute vec4 aSeed; uniform float uTime, uPixel, uRing; varying float vA;
      void main(){
        float t = fract(aSeed.x + uTime * (0.07 + 0.05 * aSeed.w)); float ang = aSeed.y * 6.2832;
        float r = uRing * (0.55 + 1.1 * t + 0.25 * aSeed.z); float h = aSeed.z * 9.0 * (0.4 + t);
        vec4 mv = modelViewMatrix * vec4(cos(ang) * r, h, sin(ang) * r, 1.0);
        gl_PointSize = (9.0 + 14.0 * aSeed.w + 16.0 * t) * uPixel / max(-mv.z, 1.0);
        vA = 0.22 * smoothstep(0.0, 0.15, t) * smoothstep(1.0, 0.6, t); gl_Position = projectionMatrix * mv; }`,
    fragmentShader: 'uniform float uAmt; varying float vA; void main(){ vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5) discard; gl_FragColor = vec4(0.62, 0.6, 0.55, vA * uAmt * (1.0 - smoothstep(0.1, 0.5, d))); }',
  }));
  m.frustumCulled = false; m.renderOrder = 5;
  return { mesh: m, U };
}
