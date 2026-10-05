// The tornado you see: a solid-looking condensation funnel (a main shell plus two wispy outer ones) with fine rotating striations,
// a ragged dark debris sleeve and a dust skirt around its base, all animated on the GPU. The shape follows real tornadoes:
// narrow and slightly ropey near the ground, flaring out into the wall cloud above.
import * as THREE from '../../vendor/three.module.min.js';

const NOISE = `
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 4; i++){ s += a * vn(p); p = p * 2.03 + 11.7; a *= 0.5; } return s; }
`;
// funnel radius at height fraction t (0 ground .. 1 cloud base): thin for most of its height, flaring into the cloud at the top
const PROFILE = `float prof(float t, float rc, float top){ return rc * (0.72 + 0.5 * t) + (top - rc) * pow(t, 3.3); }
vec2 sway(float hf, float time, float wob, float rc, float seed){ return vec2(sin(hf * 3.4 + time * 0.55 + seed), cos(hf * 2.7 + time * 0.47 + seed * 1.7)) * wob * rc * 2.2 * sin(hf * 3.14159) * (1.0 - 0.4 * hf); }`;

export function createVortex(H = 160) {
  const group = new THREE.Group(), U = {
    uTime: { value: 0 }, uH: { value: H }, uRc: { value: 10 }, uTop: { value: 40 }, uTouch: { value: 1 }, uSpin: { value: 60 }, uLean: { value: new THREE.Vector2() },
    uPixel: { value: 600 }, uDark: { value: 0.0 }, uWob: { value: 0.5 },
  };
  const shellMat = (scale, speed, alpha, seed, solid) => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.FrontSide, uniforms: { ...U, uScale: { value: scale }, uSpeed: { value: speed }, uAlpha: { value: alpha }, uSeed: { value: seed }, uSolid: { value: solid } },
    vertexShader: `${NOISE}${PROFILE}
      uniform float uH, uRc, uTop, uTouch, uScale, uTime, uWob, uSeed, uSpeed; uniform vec2 uLean;
      varying float vT; varying vec3 vN; varying vec3 vV; varying float vAng; varying float vRad;
      void main(){
        float yb = uH * (1.0 - uTouch);                       // the funnel descends from the cloud
        float t = uv.y; float hh = yb + t * (uH - yb); float hf = hh / uH;
        float ang = atan(position.z, position.x);
        float r = prof(hf, uRc, uTop) * uScale;
        float rag = vn(vec2(ang * 3.0 + uTime * 0.6 * uSpeed + uSeed, hf * 6.0 - uTime * 0.45)) * 0.7 + vn(vec2(ang * 9.0 - uTime * 1.1 * uSpeed, hf * 15.0)) * 0.3;
        r *= 0.86 + 0.28 * rag * (0.5 + hf);                   // ragged, billowing edge
        r *= mix(0.12, 1.0, smoothstep(0.0, 0.05 + 0.22 * (1.0 - uTouch), t + 0.02));   // pointed tip while it descends
        vec3 p = vec3(cos(ang) * r, hh, sin(ang) * r);
        p.xz += uLean * pow(hf, 1.7) + sway(hf, uTime, uWob, uRc, uSeed);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vT = hf; vAng = ang; vRad = r; vN = normalize(normalMatrix * normalize(vec3(cos(ang), 0.12, sin(ang)))); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `${NOISE}
      uniform float uTime, uSpeed, uAlpha, uSeed, uDark, uSolid, uSpin;
      varying float vT; varying vec3 vN; varying vec3 vV; varying float vAng; varying float vRad;
      void main(){
        float s = uTime * uSpeed, spin = uSpin * 0.03;
        float n = fbm(vec2(vAng * 2.6 + s * 1.4 + uSeed, vT * 8.0 - s * 0.5 + uSeed * 3.0));
        float n2 = fbm(vec2(vAng * 11.0 + s * 3.0, vT * 22.0 - s * 0.9));
        float band = 0.5 + 0.5 * sin(vAng * 17.0 + vT * 42.0 + uTime * spin + n * 4.0);   // fine twisting striations
        float ndv = abs(dot(normalize(vN), normalize(vV)));
        float edge = smoothstep(0.0, mix(0.55, 0.22, uSolid), ndv);
        float body = mix(smoothstep(0.2, 0.75, n * 0.8 + n2 * 0.4), 0.9, uSolid);
        float a = body * edge * uAlpha * (0.78 + 0.22 * band) * smoothstep(0.0, 0.03, vT) * smoothstep(1.0, 0.86, vT);
        vec3 L = normalize(vec3(-0.55, 0.45, 0.7));
        float lit = 0.38 + 0.62 * clamp(dot(normalize(vN), L) * 0.5 + 0.5, 0.0, 1.0);
        vec3 cold = mix(vec3(0.34, 0.36, 0.39), vec3(0.78, 0.8, 0.83), clamp(n * 1.1 + band * 0.25, 0.0, 1.0)) * lit;
        vec3 dirt = vec3(0.3, 0.25, 0.2) * (0.7 + 0.5 * n2);
        float dm = 1.0 - smoothstep(0.0, 0.3 + 0.18 * (1.0 - uDark), vT);              // debris-brown near the ground
        vec3 col = mix(cold, dirt, dm * 0.85);
        col *= mix(1.0, 0.62, smoothstep(0.55, 1.0, vT));                              // darker where it joins the cloud
        gl_FragColor = vec4(col * (1.0 - 0.4 * uDark), a);
      }`,
  });
  const cyl = new THREE.CylinderGeometry(1, 1, 1, 96, 70, true);
  [[1.0, 0.8, 0.95, 0.0, 1.0], [1.1, 1.2, 0.35, 3.1, 0.0], [0.82, 1.6, 0.4, 7.7, 0.3]].forEach(([sc, sp, al, sd, so]) => { const m = new THREE.Mesh(cyl, shellMat(sc, sp, al, sd, so)); m.frustumCulled = false; m.renderOrder = 4; group.add(m); });

  // swirling particles: wisps along the funnel, the dark debris sleeve at its base, a dust skirt on the ground
  const makePoints = (count, o) => {
    const seed = new Float32Array(count * 4); for (let i = 0; i < count * 4; i++) seed[i] = Math.random();
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(count * 3), 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    const mt = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, uniforms: { ...U, uMaxH: { value: o.maxH }, uMinR: { value: o.minR }, uSpread: { value: o.spread }, uAlpha: { value: o.alpha }, uSize: { value: o.size }, uDirtMix: { value: o.dirt } },
      vertexShader: `${PROFILE}
        attribute vec4 aSeed;
        uniform float uTime, uH, uRc, uTop, uTouch, uSpin, uMaxH, uMinR, uSpread, uAlpha, uSize, uPixel, uWob, uDirtMix; uniform vec2 uLean;
        varying float vA; varying float vDirt; varying float vShade;
        void main(){
          float yb = uH * (1.0 - uTouch);
          float t = fract(aSeed.x + uTime * (0.03 + 0.05 * aSeed.w));
          float hh = max(t * uMaxH * uH, yb); float hf = hh / uH;
          float r = prof(hf, uRc, uTop) * (uMinR + uSpread * aSeed.z) + (uMaxH < 0.3 ? uRc * 0.6 * aSeed.z : 0.0);
          float w = uSpin / max(r, 3.0) * (0.55 + 0.7 * aSeed.w);
          float ang = aSeed.y * 6.2832 + uTime * w;
          vec3 p = vec3(cos(ang) * r, hh, sin(ang) * r);
          p.xz += uLean * pow(hf, 1.7) + sway(hf, uTime, uWob, uRc, 0.0);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          float world = (uSize * (0.6 + aSeed.w)) * (0.8 + 0.035 * uRc + hf * 0.7);
          gl_PointSize = world * uPixel / max(-mv.z, 1.0);
          vA = uAlpha * smoothstep(0.0, 0.08, t) * smoothstep(1.0, 0.8, t) * smoothstep(0.0, 0.3, uTouch) * mix(1.0, pow(1.0 - t, 1.3) * 1.5, step(uMaxH, 0.5));
          vDirt = uDirtMix; vShade = 0.6 + 0.4 * aSeed.w;
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `uniform float uDark; varying float vA; varying float vDirt; varying float vShade;
        void main(){
          vec2 c = gl_PointCoord - 0.5; float d = length(c); if (d > 0.5) discard;
          float a = vA * (1.0 - smoothstep(0.12, 0.5, d));
          vec3 cloud = vec3(0.6, 0.62, 0.64) * vShade, dirt = vec3(0.3, 0.25, 0.19) * vShade;
          gl_FragColor = vec4(mix(cloud, dirt, clamp(vDirt, 0.0, 1.0)) * (1.0 - 0.4 * uDark), a);
        }`,
    });
    const p = new THREE.Points(g, mt); p.frustumCulled = false; p.renderOrder = 3; group.add(p); return p;
  };
  makePoints(1100, { maxH: 1.0, minR: 0.85, spread: 0.55, alpha: 0.13, size: 3.4, dirt: 0.0 });       // wisps hugging the funnel
  makePoints(2600, { maxH: 0.3, minR: 0.8, spread: 1.4, alpha: 0.34, size: 5.2, dirt: 1.0 });         // the dark debris sleeve around the base
  makePoints(1000, { maxH: 0.07, minR: 1.2, spread: 3.6, alpha: 0.22, size: 6.0, dirt: 1.0 });        // dust skirt spreading over the ground

  return {
    group, U,
    update(time, level, touch, lean, pixel, dark) {
      U.uTime.value = time; U.uTouch.value = touch; U.uLean.value.copy(lean); U.uPixel.value = pixel; U.uDark.value = dark;
      if (level) { U.uRc.value = level.rc; U.uTop.value = level.rc * 3.0 + 26; U.uSpin.value = level.vmax * 0.447 * 0.9; U.uWob.value = Math.max(0.1, 0.62 - level.vmax / 420); }
    },
  };
}
