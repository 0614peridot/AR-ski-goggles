import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';

// ---------- Renderer / scene / camera ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.xr.enabled = true;
// 'local' = the viewer's eyes start at the origin, so the panorama stays centred on them.
renderer.xr.setReferenceSpaceType('local');
document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// ---------- 360 environment sphere ----------
const geometry = new THREE.SphereGeometry(500, 96, 48);
geometry.scale(-1, 1, 1); // look at the inside of the sphere

const material = new THREE.MeshBasicMaterial();
const hideLoading = () => {
  const loading = document.getElementById('loading');
  if (!loading) return;
  loading.style.opacity = '0';
  setTimeout(() => loading.remove(), 400);
};
const useTexture = (texture) => {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  material.map = texture;
  material.needsUpdate = true;
  hideLoading();
};

// Still photo first (instant), then swap to the 10-second looping video once it can play.
new THREE.TextureLoader().load('./ski-360.png', (tex) => { if (!material.map) useTexture(tex); });

const video = document.createElement('video');
video.src = './ski-360-loop.mp4';
video.loop = true;
video.muted = true;
video.playsInline = true;
video.crossOrigin = 'anonymous';
video.addEventListener('canplay', () => video.play().catch(() => {}), { once: true });
video.addEventListener('playing', () => {
  if (!(material.map instanceof THREE.VideoTexture)) useTexture(new THREE.VideoTexture(video));
});
// Some browsers block autoplay until the first interaction (e.g. entering VR).
const resume = () => { if (video.paused && video.readyState >= 2) video.play().catch(() => {}); };
window.addEventListener('pointerdown', resume);
renderer.xr.addEventListener('sessionstart', resume);

const environment = new THREE.Mesh(geometry, material);
environment.rotation.y = -Math.PI / 2; // centre of the image (down the slope) faces forward
scene.add(environment);

// ---------- Desktop / mobile look controls (drag + wheel zoom) ----------
let yaw = 0;
let pitch = 0;
let dragging = false;
let lastX = 0;
let lastY = 0;
const hint = document.getElementById('hint');

renderer.domElement.addEventListener('pointerdown', (e) => {
  dragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
  renderer.domElement.setPointerCapture(e.pointerId);
  hint.style.opacity = '0';
});
renderer.domElement.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const speed = (camera.fov / window.innerHeight) * (Math.PI / 180);
  yaw += (e.clientX - lastX) * speed;
  pitch += (e.clientY - lastY) * speed;
  pitch = THREE.MathUtils.clamp(pitch, -Math.PI / 2 + 0.01, Math.PI / 2 - 0.01);
  lastX = e.clientX;
  lastY = e.clientY;
});
const endDrag = () => { dragging = false; };
renderer.domElement.addEventListener('pointerup', endDrag);
renderer.domElement.addEventListener('pointercancel', endDrag);

renderer.domElement.addEventListener('wheel', (e) => {
  e.preventDefault();
  camera.fov = THREE.MathUtils.clamp(camera.fov + e.deltaY * 0.05, 30, 100);
  camera.updateProjectionMatrix();
}, { passive: false });

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- Loop ----------
const headPosition = new THREE.Vector3();
renderer.setAnimationLoop(() => {
  if (!renderer.xr.isPresenting) {
    camera.rotation.set(pitch, yaw, 0, 'YXZ');
  } else {
    // Keep the panorama centred on the head so walking around doesn't break the illusion.
    renderer.xr.getCamera().getWorldPosition(headPosition);
    environment.position.copy(headPosition);
  }
  renderer.render(scene, camera);
});
