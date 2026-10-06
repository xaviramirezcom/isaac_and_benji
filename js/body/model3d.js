// The realistic body: real human anatomy (Visible Human male reference + BodyParts3D, see models/ATTRIBUTION.md), simplified and packed into models/body.bin.
// Every organ is built around its own centre, so it sits exactly where it lives in the body and can be lifted out and put back.
import * as THREE from '../../vendor/three.module.min.js';

export const SCALE = 3.35;                    // metres → scene units (the body is about 6.1 tall)
export const ORGANS = ['brain', 'heart', 'lungs', 'stomach', 'liver', 'kidneys', 'smallint', 'largeint', 'bladder'];
const Q = 32767;

function geometry(buf, m) {
  const g = new THREE.BufferGeometry(), n = m.verts;
  const q = new Int16Array(buf, m.pos, n * 3), p = new Float32Array(n * 3), k = m.half * SCALE / Q;
  for (let i = 0; i < p.length; i++) p[i] = q[i] * k;
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  g.setAttribute('color', new THREE.BufferAttribute(new Uint8Array(buf, m.col, n * 3), 3, true));
  g.setIndex(new THREE.BufferAttribute(m.idxType === 'u2' ? new Uint16Array(buf, m.idx, m.tris * 3) : new Uint32Array(buf, m.idx, m.tris * 3), 1));
  g.computeVertexNormals();
  return g;
}
const organMat = () => new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: 0.5, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.4, sheen: 0.4, sheenColor: new THREE.Color(0xffb0a0), side: THREE.DoubleSide });

export async function loadBody() {
  const [meta, buf] = await Promise.all([fetch('models/body.json').then((r) => r.json()), fetch('models/body.bin').then((r) => r.arrayBuffer())]);
  const root = new THREE.Group(), organs = {}, ghosts = {};
  const at = (m) => new THREE.Vector3(...m.center).multiplyScalar(SCALE);

  // the skin: a see-through, softly lit body (a depth-only copy first, so only its outermost surface shows)
  const skinGeo = geometry(buf, meta.skin);
  const skinMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, vertexColors: true, uniforms: { uOpacity: { value: 1 } },
    vertexShader: 'varying vec3 vN; varying vec3 vV; varying vec3 vC; varying vec3 vW; void main(){ vC = color; vW = (modelMatrix * vec4(position, 1.0)).xyz; vec4 mv = modelViewMatrix * vec4(position, 1.0); vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform float uOpacity; varying vec3 vN; varying vec3 vV; varying vec3 vC; varying vec3 vW; void main(){ vec3 n = normalize(vN); float f = pow(1.0 - clamp(dot(n, normalize(vV)), 0.0, 1.0), 2.0); float l = 0.6 + 0.4 * dot(n, normalize(vec3(0.4, 0.6, 0.7)));'
      + ' vec3 m = vW / 3.35; float sh = smoothstep(-0.205, -0.195, m.y) * (1.0 - smoothstep(0.07, 0.08, m.y)) * (1.0 - smoothstep(0.29, 0.3, abs(m.x)));'   // a pair of boxer shorts, drawn smoothly in the shader
      + ' vec3 base = mix(vC, vec3(0.30, 0.42, 0.68), sh); vec3 c = mix(base * l, base * 0.78, f); float a = mix(0.3, 0.72, f); a = mix(a, mix(0.62, 0.85, f), sh); gl_FragColor = vec4(c, a * uOpacity); }',
  });
  const skin = new THREE.Mesh(skinGeo, skinMat), skinDepth = new THREE.Mesh(skinGeo, new THREE.MeshBasicMaterial({ colorWrite: false }));
  skin.renderOrder = 6; skinDepth.renderOrder = 5; const skinGroup = new THREE.Group(); skinGroup.add(skinDepth, skin);
  skinGroup.position.copy(at(meta.skin)); root.add(skinGroup);

  // the bones (a spine, pelvis and ribcage, faint so they never hide the organs)
  const bones = new THREE.Mesh(geometry(buf, meta.bones), new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.6, transparent: true, opacity: 0.4, depthWrite: false }));
  bones.position.copy(at(meta.bones)); bones.renderOrder = 4; root.add(bones);

  const ghostMat = new THREE.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.4, depthWrite: false });
  for (const id of ORGANS) {
    const m = meta[id], geo = geometry(buf, m), mat = organMat(), outer = new THREE.Group(), inner = new THREE.Group(), mesh = new THREE.Mesh(geo, mat);
    inner.add(mesh); outer.add(inner); outer.userData = { id, inner, mat, home: at(m), geo }; outer.position.copy(outer.userData.home); outer.visible = false; root.add(outer); organs[id] = outer;
    const gm = ghostMat.clone(), gh = new THREE.Mesh(geo, gm); gh.position.copy(outer.userData.home); gh.visible = false; gh.renderOrder = 3; gh.userData = { mat: gm }; root.add(gh); ghosts[id] = gh;
  }
  return { root, skin: skinGroup, skinMat, bones, organs, ghosts, meta };
}

// the heart beats and the lungs breathe (only the ones that are in the body)
export function pulse(organs, t) {
  const b = Math.max(0, Math.sin(t * 7.5)) ** 4 * 0.9 + Math.max(0, Math.sin(t * 7.5 - 1.1)) ** 4 * 0.4;
  organs.heart.userData.inner.scale.setScalar(1 + 0.045 * b);
  const br = Math.sin(t * 1.5); organs.lungs.userData.inner.scale.set(1 + 0.025 * br, 1 + 0.04 * br, 1 + 0.03 * br);
}

// a little picture of each organ for the tray, drawn once from the model itself
export function thumbnails(body, size = 160) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = size;
  const r = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true }); r.setSize(size, size, false); r.setClearColor(0, 0);
  const scene = new THREE.Scene(); scene.add(new THREE.HemisphereLight(0xffffff, 0xb9c6d0, 1.7)); const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(2, 3, 5); scene.add(key);
  const out = {};
  for (const id of ORGANS) {
    const o = body.organs[id], mesh = new THREE.Mesh(o.userData.geo, o.userData.mat); scene.add(mesh);
    const box = new THREE.Box3().setFromObject(mesh), c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3()), h = Math.max(s.x, s.y) * 0.56;
    const cam = new THREE.OrthographicCamera(-h, h, h, -h, 0.1, 50); cam.position.set(c.x, c.y, c.z + 10); cam.lookAt(c);
    r.render(scene, cam); out[id] = canvas.toDataURL('image/png'); scene.remove(mesh);
  }
  r.dispose(); r.forceContextLoss?.();
  return out;
}
