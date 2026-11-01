// Live 3D car for the detail drawer. Loaded lazily the first time a 3D vehicle is opened,
// and it only renders while the drawer is showing it.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';

export const MODELS = { 'C-01': '/models/amg.glb', 'S-04': '/models/raptor.glb' };

let renderer, scene, camera, controls, host, running = false, current = null;
const cache = {};

function setup(el) {
  host = el;
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.AgXToneMapping;
  renderer.toneMappingExposure = 1.65;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050505);
  scene.environment = studioEnvironment(renderer);
  scene.environmentIntensity = 1.0;

  camera = new THREE.PerspectiveCamera(32, 16 / 10, 0.1, 100);
  camera.position.set(5.4, 1.4, 6.4); // front three-quarter (Blender -Y front = glTF +Z)

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.55, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.06;
  controls.enablePan = false;
  controls.minDistance = 5;
  controls.maxDistance = 11;
  controls.minPolarAngle = Math.PI * 0.2;
  controls.maxPolarAngle = Math.PI * 0.49; // never dip under the floor
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.6;
  controls.addEventListener('start', () => { controls.autoRotate = false; });

  // Floor, like the film's studio: a real mirror reflection under a dark glaze (= glossy black floor),
  // plus a soft contact shadow on top.
  const mirror = new Reflector(new THREE.CircleGeometry(30, 96), {
    textureWidth: 1024, textureHeight: 1024, color: 0x5a5a5a,
  });
  mirror.rotation.x = -Math.PI / 2;
  scene.add(mirror);
  const glaze = new THREE.Mesh(
    new THREE.CircleGeometry(30, 96),
    new THREE.MeshBasicMaterial({ color: 0x050505, transparent: true, opacity: 0.86 }),
  );
  glaze.rotation.x = -Math.PI / 2;
  glaze.position.y = 0.002;
  scene.add(glaze);
  const shadowCatcher = new THREE.Mesh(new THREE.CircleGeometry(30, 96), new THREE.ShadowMaterial({ opacity: 0.7 }));
  shadowCatcher.rotation.x = -Math.PI / 2;
  shadowCatcher.position.y = 0.004;
  shadowCatcher.receiveShadow = true;
  scene.add(shadowCatcher);

  const key = new THREE.DirectionalLight(0xfff4ea, 1.4);
  key.position.set(0.5, 8, 0.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 15 });
  key.shadow.radius = 8;
  key.shadow.bias = -0.0005;
  scene.add(key);

  new ResizeObserver(resize).observe(host);
  resize();
}

// A tiny studio built from glowing panels, baked into an environment map.
// This is what the car paint reflects: a top softbox, two strip lights and a warm rim.
function studioEnvironment(r) {
  const env = new THREE.Scene();
  env.background = new THREE.Color(0x000000);
  const panel = (w, h, intensity, pos, look, color = 0xffffff) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(...look); env.add(m);
  };
  panel(2, 7, 6, [0, 5, 0], [0, 0, 0]);                       // key softbox overhead
  panel(0.4, 4, 9, [-6, 2.2, -2.5], [0, 0.5, 0]);             // strip left
  panel(0.4, 4, 7, [6, 2.2, 2.5], [0, 0.5, 0]);               // strip right
  panel(6, 0.5, 5, [0, 1.6, 7], [0, 0.5, 0], 0xffe6cf);       // warm rim behind
  panel(4, 0.3, 2, [2, 0.4, -7], [0, 0.4, 0]);                // low front kicker
  panel(0.3, 3, 4, [-7, 1.2, 4], [0, 0.6, 0]);                // second strip: long highlights along the flanks
  panel(0.3, 3, 4, [7, 1.2, -4], [0, 0.6, 0]);
  panel(12, 2, 0.35, [0, 7, -9], [0, 0, 0]);                  // faint fill so blacks keep their shape
  const pmrem = new THREE.PMREMGenerator(r);
  const tex = pmrem.fromScene(env, 0.02).texture;
  pmrem.dispose();
  return tex;
}

function resize() {
  if (!renderer) return;
  const w = host.clientWidth, h = host.clientHeight;
  if (!w || !h) return;
  renderer.setSize(w, h, false);
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

async function load(url) {
  if (cache[url]) return cache[url];
  const draco = new DRACOLoader().setDecoderPath('/draco/');
  const gltf = await new GLTFLoader().setDRACOLoader(draco).loadAsync(url);
  const root = gltf.scene;
  root.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      const m = o.material;
      if (m && m.isMeshStandardMaterial) m.envMapIntensity = 1.7;
    }
  });
  // sit on the floor, centred
  const box = new THREE.Box3().setFromObject(root);
  const c = box.getCenter(new THREE.Vector3());
  root.position.x -= c.x; root.position.z -= c.z; root.position.y -= box.min.y;
  root.userData.size = box.getSize(new THREE.Vector3());
  cache[url] = root;
  return root;
}

// Frame each vehicle by its own size, from the front three-quarter.
function frameModel(root) {
  const s = root.userData.size;
  const d = Math.max(s.x, s.z) * 1.22;
  controls.target.set(0, s.y * 0.4, 0);
  camera.position.set(d * 0.6, s.y * 0.85, d * 0.8);
  controls.minDistance = d * 0.7;
  controls.maxDistance = d * 1.5;
  controls.update();
}

export async function showModel(el, id) {
  if (!renderer) setup(el);
  const root = await load(MODELS[id]);
  if (current !== root) {
    if (current) scene.remove(current);
    scene.add(root); current = root;
    frameModel(root);
  }
  controls.autoRotate = true;
  resize();
  start();
}

function frame() {
  if (!running) return;
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}

export function start() { if (!running) { running = true; requestAnimationFrame(frame); } }
export function stop() { running = false; }
