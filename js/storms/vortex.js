// The tornado you see: a rotating condensation funnel (three nested noisy shells) plus thousands of swirling dust/debris/cloud
// particles, all animated on the GPU. The shape follows a real tornado: narrow at the ground, flaring into the wall cloud above.
import * as THREE from '../../vendor/three.module.min.js';

const NOISE = `
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++){ s += a * vn(p); p = p * 2.03 + 11.7; a *= 0.5; } return s; }
`;
// funnel radius at height fraction t (0 ground .. 1 cloud base)
const PROFILE = `float prof(float t, float rc, float top){ return rc * (0.55 + 0.45 * t) + (top - rc) * pow(t, 2.6); }`;

export function createVortex(H = 160) {
  const group = new THREE.Group(), U = {
    uTime: { value: 0 }, uH: { value: H }, uRc: { value: 10 }, uTop: { value: 40 }, uTouch: { value: 1 }, uSpin: { value: 60 }, uLean: { value: new THREE.Vector2() },
    uPixel: { value: 600 }, uDark: { value: 0.0 }, uWob: { value: 0.5 },
  };
  const shells = [];
  const shellMat = (scale, speed, alpha, seed) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { ...U, uScale: { value: scale }, uSpeed: { value: speed }, uAlpha: { value: alpha }, uSeed: { value: seed } },
    vertexShader: `${PROFILE}
      uniform float uH, uRc, uTop, uTouch, uScale, uTime, uWob; uniform vec2 uLean;
      varying float vT; varying float vH; varying vec3 vN; varying vec3 vV; varying float vAng;
      void main(){
        float yb = uH * (1.0 - uTouch);                       // the funnel descends from the cloud
        float t = uv.y; float hh = yb + t * (uH - yb); float hf = hh / uH;
        float ang = atan(position.z, position.x);
        float r = prof(hf, uRc, uTop) * uScale * (0.85 + 0.15 * sin(ang * 3.0 + hf * 8.0 + uTime));
        r *= mix(0.15, 1.0, smoothstep(0.0, 0.04 + 0.3 * (1.0 - uTouch), t + (1.0 - uTouch) * 0.0 + 0.04));
        vec3 p = vec3(cos(ang) * r, hh, sin(ang) * r);
        p.xz += uLean * pow(hf, 1.8) + vec2(sin(hf * 3.0 + uTime * 0.7), cos(hf * 2.3 + uTime * 0.6)) * uWob * uRc * 1.4 * (1.0 - hf) * (0.4 + hf);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vT = hf; vH = hh; vAng = ang; vN = normalize(normalMatrix * normalize(vec3(cos(ang), 0.15, sin(ang)))); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `${NOISE}
      uniform float uTime, uSpeed, uAlpha, uSeed, uDark;
      varying float vT; varying float vH; varying vec3 vN; varying vec3 vV; varying float vAng;
      void main(){
        float s = uTime * uSpeed;
        float n = fbm(vec2(vAng * 3.2 + s * 2.2 + uSeed, vT * 9.0 - s * 0.7 + uSeed * 3.0));
        float streak = fbm(vec2(vAng * 9.0 + s * 3.4, vT * 3.0 + uSeed)) ;
        float edge = pow(abs(dot(normalize(vN), normalize(vV))), 1.1);
        float a = smoothstep(0.28, 0.78, n * 0.75 + streak * 0.5) * edge;
        a *= smoothstep(0.0, 0.05, vT) * smoothstep(1.0, 0.8, vT) * uAlpha;
        vec3 cold = mix(vec3(0.56, 0.58, 0.6), vec3(0.8, 0.82, 0.84), n);           // condensation: grey-white
        vec3 dirt = vec3(0.33, 0.28, 0.22);
        vec3 col = mix(dirt, cold, smoothstep(0.02, 0.38 + 0.2 * (1.0 - uDark), vT));
        col *= 0.62 + 0.38 * streak; col *= 1.0 - 0.45 * uDark;
        gl_FragColor = vec4(col, a);
      }`,
  });
  const cyl = new THREE.CylinderGeometry(1, 1, 1, 64, 40, true);
  [[1.0, 0.9, 0.55, 0.0], [0.72, 1.25, 0.6, 3.1], [0.45, 1.7, 0.7, 7.7]].forEach(([sc, sp, al, sd]) => { const m = new THREE.Mesh(cyl, shellMat(sc, sp, al, sd)); m.frustumCulled = false; m.renderOrder = 4; group.add(m); shells.push(m); });

  // swirling particles: cloud, dust, debris
  const makePoints = (count, o) => {
    const seed = new Float32Array(count * 4); for (let i = 0; i < count * 4; i++) seed[i] = Math.random();
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    const mt = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, uniforms: { ...U, uMaxH: { value: o.maxH }, uSpread: { value: o.spread }, uAlpha: { value: o.alpha }, uSize: { value: o.size }, uDirtMix: { value: o.dirt } },
      vertexShader: `${PROFILE}
        attribute vec4 aSeed;
        uniform float uTime, uH, uRc, uTop, uTouch, uSpin, uMaxH, uSpread, uAlpha, uSize, uPixel, uWob; uniform vec2 uLean;
        varying float vA; varying float vDirt; varying float vShade;
        void main(){
          float yb = uH * (1.0 - uTouch);
          float t = fract(aSeed.x + uTime * (0.035 + 0.05 * aSeed.w) );
          float hf0 = t * uMaxH; float hh = yb * 0.0 + max(hf0 * uH, yb);       // ground-hugging sets keep to the bottom of the funnel
          float hf = hh / uH;
          float r = prof(hf, uRc, uTop) * (0.5 + uSpread * aSeed.z);
          float w = uSpin / max(r, 3.0) * (0.55 + 0.7 * aSeed.w);                 // angular speed ~ wind / radius
          float ang = aSeed.y * 6.2832 + uTime * w;
          vec3 p = vec3(cos(ang) * r, hh, sin(ang) * r);
          p.xz += uLean * pow(hf, 1.8) + vec2(sin(hf * 3.0 + uTime * 0.7), cos(hf * 2.3 + uTime * 0.6)) * uWob * uRc * 0.9 * (1.0 - hf);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float world = (uSize * (0.6 + aSeed.w)) * (0.7 + 0.03 * uRc + hf * 0.8);
          gl_PointSize = world * uPixel / max(-mv.z, 1.0);
          vA = uAlpha * smoothstep(0.0, 0.08, t) * smoothstep(1.0, 0.82, t) * smoothstep(0.0, 0.3, uTouch);
          vDirt = uDirtMix * (1.0 - smoothstep(0.0, 0.3, hf)) + (1.0 - uDirtMix) * 0.0;
          vShade = 0.65 + 0.35 * aSeed.w;
          gl_Position = projectionMatrix * mv;
        }`.replace('uSize, uPixel, uWob;', 'uSize, uPixel, uWob, uDirtMix;'),
      fragmentShader: `uniform float uDark; varying float vA; varying float vDirt; varying float vShade;
        void main(){
          vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5) discard;
          float a = vA * (1.0 - smoothstep(0.1, 0.5, d));
          vec3 cloud = vec3(0.6, 0.62, 0.64) * vShade, dirt = vec3(0.36, 0.3, 0.23) * vShade;
          gl_FragColor = vec4(mix(cloud, dirt, clamp(vDirt, 0.0, 1.0)) * (1.0 - 0.4 * uDark), a);
        }`,
    });
    const p = new THREE.Points(g, mt); p.frustumCulled = false; p.renderOrder = 3; group.add(p); return p;
  };
  makePoints(2600, { maxH: 1.0, spread: 1.3, alpha: 0.2, size: 4.5, dirt: 0.15 });      // the cloud / funnel body
  makePoints(2400, { maxH: 0.2, spread: 2.6, alpha: 0.26, size: 5.0, dirt: 1.0 });      // the debris cloud around the base
  makePoints(900, { maxH: 0.07, spread: 5.5, alpha: 0.2, size: 6.0, dirt: 1.0 });       // dust ring spreading across the ground

  return {
    group, U,
    update(time, level, touch, lean, pixel, dark) {
      U.uTime.value = time; U.uTouch.value = touch; U.uLean.value.copy(lean); U.uPixel.value = pixel; U.uDark.value = dark;
      if (level) { U.uRc.value = level.rc; U.uTop.value = level.rc * 3.2 + 22; U.uSpin.value = level.vmax * 0.447 * 0.9; U.uWob.value = Math.max(0.12, 0.7 - level.vmax / 400); }
    },
  };
}
