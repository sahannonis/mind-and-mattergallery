// Home page 3D: a block of wood on a gallery plinth is carved away, chip by chip,
// to reveal a hand-carved bird on a rock (Arnold Mikelson was known for his birds).
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const stage = document.getElementById('stage');
const canvas = document.getElementById('carve3d');
const replay = document.getElementById('replay');
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);

// Museum lighting: a warm spotlight from above-left, a cool rim light behind
const spot = new THREE.SpotLight(0xffe7c8, 75, 30, 0.4, 0.65, 1.4);
spot.position.set(-2.6, 7.6, 4.6); spot.target.position.set(0, 1, 0);
spot.castShadow = true; spot.shadow.mapSize.set(1024, 1024); spot.shadow.bias = -0.0008;
const rim = new THREE.DirectionalLight(0xa9bccd, 0.7); rim.position.set(4, 3, -4);
scene.add(spot, spot.target, rim, new THREE.HemisphereLight(0xfff4e8, 0x3a1a1c, 0.3));

const piece = new THREE.Group(); scene.add(piece);

// Plinth
const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.7, 1.7), new THREE.MeshStandardMaterial({ color: '#F1EBE1', roughness: 0.9, envMapIntensity: 0.35 }));
plinth.position.y = -0.85; plinth.receiveShadow = true; plinth.castShadow = true; piece.add(plinth);

// --- The carving -------------------------------------------------------------
const hash = n => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };
const LIGHT = new THREE.Color('#B07A50'), DARK = new THREE.Color('#7A4B2E');
// Colour each flat facet slightly differently, with darker grain lines, so it reads as hand-carved wood
function carved(geo, seed = 1) {
  geo = geo.index ? geo.toNonIndexed() : geo;
  const p = geo.attributes.position, cols = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let f = 0; f < p.count; f += 3) {
    const cx = (p.getX(f) + p.getX(f + 1) + p.getX(f + 2)) / 3, cy = (p.getY(f) + p.getY(f + 1) + p.getY(f + 2)) / 3;
    const grain = 0.5 + 0.5 * Math.sin(cy * 26 + cx * 4 + seed * 3);
    c.copy(LIGHT).lerp(DARK, Math.pow(grain, 6) * 0.55).offsetHSL(0, 0, (hash(f + seed * 97) - 0.5) * 0.1);
    for (let k = 0; k < 3; k++) cols.set([c.r, c.g, c.b], (f + k) * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  return geo;
}
const wood = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.58, envMapIntensity: 0.45 });
const sculpt = new THREE.Group(); piece.add(sculpt);
function part(geo, x, y, z, s = [1, 1, 1], r = [0, 0, 0], seed = 1, mat = wood) {
  const m = new THREE.Mesh(carved(geo, seed), mat);
  m.position.set(x, y, z); m.scale.set(...s); m.rotation.set(...r);
  m.castShadow = true; m.receiveShadow = true; sculpt.add(m); return m;
}

// rock the bird stands on (roughly chiselled)
{
  const g = new THREE.IcosahedronGeometry(1, 1), p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const k = 1 + (hash(i * 3.1) - 0.5) * 0.22; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); }
  part(g, 0, 0.3, 0, [1.15, 0.42, 0.75], [0, 0.3, 0], 5);
}
const B = 0.35; // bird sits this much higher than the base sketch
part(new THREE.IcosahedronGeometry(1, 2), 0, 1.05 + B, 0, [0.92, 0.52, 0.5], [0, 0, 0.22], 1);          // body
part(new THREE.IcosahedronGeometry(1, 2), 0.42, 1.12 + B, 0, [0.5, 0.5, 0.46], [0, 0, 0], 2);            // chest
part(new THREE.IcosahedronGeometry(0.3, 2), 0.88, 1.5 + B, 0, [1, 1, 1], [0, 0, 0], 3);                   // head
part(new THREE.ConeGeometry(0.075, 0.42, 7), 1.29, 1.46 + B, 0, [1, 1, 1], [0, 0, -Math.PI / 2 - 0.16], 4); // beak
const eyeMat = new THREE.MeshStandardMaterial({ color: '#2A1A12', roughness: 0.4 });
for (const z of [-0.2, 0.2]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 8), eyeMat); e.position.set(1.0, 1.57 + B, z); sculpt.add(e); }
for (const i of [-1, 0, 1]) part(new THREE.IcosahedronGeometry(1, 1), -1.08, 1.0 + B + 0.05 * Math.abs(i), i * 0.13, [0.56, 0.06, 0.15], [0, i * 0.25, 0.38], 6 + i); // tail
// folded wings
{
  const s = new THREE.Shape();
  s.moveTo(0, 0); s.bezierCurveTo(0.35, 0.34, 0.92, 0.3, 1.3, 0.04); s.bezierCurveTo(0.92, -0.1, 0.4, -0.14, 0, 0);
  const wg = new THREE.ExtrudeGeometry(s, { depth: 0.06, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 1, curveSegments: 8 });
  part(wg.clone(), 0.5, 1.18 + B, 0.43, [1, 1, 1], [0.12, Math.PI, -0.14], 8);
  part(wg.clone(), 0.5, 1.18 + B, -0.49, [1, 1, 1], [-0.12, Math.PI, -0.14], 9);
}
for (const x of [0.05, 0.25]) part(new THREE.CylinderGeometry(0.035, 0.035, 0.24, 6), x, 0.8, 0.1 * (x > 0.1 ? 1 : -1), [1, 1, 1], [0, 0, 0], 10);

// --- The block of wood, made of small chips that fly off ------------------------
const CELL = 0.17, X0 = -1.7, Y0 = 0.02, Z0 = -0.85, NX = 20, NY = 13, NZ = 10;
const COUNT = NX * NY * NZ;
const chips = new THREE.InstancedMesh(new THREE.BoxGeometry(CELL, CELL, CELL), new THREE.MeshStandardMaterial({ roughness: 0.7, envMapIntensity: 0.4 }), COUNT);
chips.castShadow = true; chips.receiveShadow = true; piece.add(chips);
const home = [], vel = [], spin = [], delay = [];
{
  const c = new THREE.Color(); let n = 0;
  for (let ix = 0; ix < NX; ix++) for (let iy = 0; iy < NY; iy++) for (let iz = 0; iz < NZ; iz++) {
    const h = new THREE.Vector3(X0 + (ix + 0.5) * CELL, Y0 + (iy + 0.5) * CELL, Z0 + (iz + 0.5) * CELL);
    home.push(h);
    const out = h.clone().sub(new THREE.Vector3(0, 1.1, 0)).normalize();
    vel.push(out.multiplyScalar(1.1 + hash(n * 1.7) * 1.3).add(new THREE.Vector3(0, 1.1 + hash(n * 2.3) * 1.2, 0.35)));
    spin.push(new THREE.Vector3(hash(n * 3.1) * 9, hash(n * 4.7) * 9, hash(n * 5.3) * 9));
    delay.push((1 - iy / (NY - 1)) * 0.68 + hash(n * 6.1) * 0.32);   // carved from the top down
    c.copy(LIGHT).lerp(DARK, Math.pow(0.5 + 0.5 * Math.sin(h.y * 26 + h.x * 4), 6) * 0.5).offsetHSL(0, 0, (hash(n * 8.3) - 0.5) * 0.08);
    chips.setColorAt(n, c); n++;
  }
  chips.instanceColor.needsUpdate = true;
}
const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e3 = new THREE.Euler(), v3 = new THREE.Vector3(), s3 = new THREE.Vector3();
const START = 0.9, SPREAD = 3.6, FLIGHT = 1.15;
const smooth = t => t * t * (3 - 2 * t);
function carveAt(t) {               // t = seconds since the carving began
  let alive = 0;
  for (let n = 0; n < COUNT; n++) {
    const local = t - START - delay[n] * SPREAD;
    if (local <= 0) { m4.makeTranslation(home[n].x, home[n].y, home[n].z); chips.setMatrixAt(n, m4); alive++; continue; }
    if (local >= FLIGHT) { m4.makeScale(0, 0, 0); chips.setMatrixAt(n, m4); continue; }
    v3.copy(home[n]).addScaledVector(vel[n], local); v3.y -= 3.2 * local * local;
    e3.set(spin[n].x * local, spin[n].y * local, spin[n].z * local); q.setFromEuler(e3);
    s3.setScalar(1 - smooth(local / FLIGHT));
    m4.compose(v3, q, s3); chips.setMatrixAt(n, m4); alive++;
  }
  chips.instanceMatrix.needsUpdate = true;
  chips.visible = alive > 0;
  return alive === 0;
}

// Fit the plinth and carving in the stage at any screen size
function fit() {
  const w = stage.clientWidth, h = stage.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  camera.aspect = w / h; camera.updateProjectionMatrix();
  const halfV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const dist = Math.max(1.75 / halfV, 2.05 / (halfV * camera.aspect)) + 1.6;
  camera.position.set(0, 1.05 + dist * 0.17, dist);
  camera.lookAt(0, 0.85, 0);
  if (reduce) renderer.render(scene, camera);
}
new ResizeObserver(fit).observe(stage);

// Drag sideways to turn it; vertical swipes still scroll the page
let yaw = -0.5, target = -0.5, dragging = false, lastX = 0;
canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => { if (dragging) { target += (e.clientX - lastX) * 0.008; lastX = e.clientX; } });
canvas.addEventListener('pointerup', () => dragging = false);
canvas.addEventListener('pointercancel', () => dragging = false);

let carveStart = performance.now(), done = false, last = performance.now(), running = true, raf = 0;
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (!dragging) target += dt * 0.13;                 // slow turn, like a museum turntable
  yaw += (target - yaw) * 0.06;                        // damped, so every movement eases in and out
  piece.rotation.y = yaw;
  if (!done) { done = carveAt((now - carveStart) / 1000); if (done) replay.hidden = false; }
  renderer.render(scene, camera);
  if (running) raf = requestAnimationFrame(frame);
}

replay.addEventListener('click', () => { if (reduce) return; carveStart = performance.now(); done = false; replay.hidden = true; });

stage.classList.add('is-3d');
fit();
if (reduce) { carveAt(1e9); piece.rotation.y = yaw; renderer.render(scene, camera); running = false; }
else { carveAt(0); raf = requestAnimationFrame(frame); }

const setRunning = on => {
  if (reduce) return;
  if (on && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
  if (!on) { running = false; cancelAnimationFrame(raf); }
};
new IntersectionObserver(([e]) => setRunning(e.isIntersecting && !document.hidden)).observe(stage);
document.addEventListener('visibilitychange', () => setRunning(!document.hidden));
