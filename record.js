import * as THREE from 'three';
import { Muxer, ArrayBufferTarget } from 'mp4-muxer';
import { createEffects, LOOP } from './effects.js';

// Renders the panorama + looping effects as a flat 360° (equirectangular) frame,
// and encodes LOOP seconds of it into a seamless MP4 with the browser's own encoder.
const WIDTH = 2048, HEIGHT = 1024, FPS = 30, FACE = 1024;

const status = document.getElementById('status');
const button = document.getElementById('record');

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(WIDTH, HEIGHT, false);
document.body.appendChild(renderer.domElement);

const image = await new Promise((resolve, reject) => {
  const img = new Image();
  img.onload = () => resolve(img);
  img.onerror = reject;
  img.src = './ski-360.png';
});

// Effects are drawn into a cube around the viewer on black, then screen-blended over the photo.
const fxScene = new THREE.Scene();
const updateEffects = createEffects(fxScene, image, FACE / 2);
const cubeTarget = new THREE.WebGLCubeRenderTarget(FACE, { generateMipmaps: false });
const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeTarget);

const base = new THREE.Texture(image);
base.needsUpdate = true;
base.minFilter = THREE.LinearFilter;
base.generateMipmaps = false;

const composite = new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  new THREE.ShaderMaterial({
    uniforms: { uBase: { value: base }, uFx: { value: cubeTarget.texture } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: /* glsl */ `
      uniform sampler2D uBase;
      uniform samplerCube uFx;
      varying vec2 vUv;
      void main() {
        float phi = 6.2831853 * vUv.x;
        float th = 3.1415927 * (1.0 - vUv.y);
        vec3 dir = vec3(-sin(phi) * sin(th), cos(th), cos(phi) * sin(th)); // same mapping as imageDir()
        vec3 b = texture2D(uBase, vUv).rgb;
        vec3 fx = clamp(textureCube(uFx, dir).rgb, 0.0, 1.0);
        gl_FragColor = vec4(1.0 - (1.0 - b) * (1.0 - fx), 1.0); // screen blend
      }`,
  }),
);
const flatScene = new THREE.Scene();
flatScene.add(composite);
const flatCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

function renderAt(t) {
  updateEffects(t);
  renderer.setClearColor(0x000000, 1);
  cubeCamera.update(renderer, fxScene);
  renderer.render(flatScene, flatCamera);
}
window.renderAt = renderAt; // used by automated checks

// ---------- Live preview ----------
let recording = false;
renderer.setAnimationLoop(() => {
  if (!recording) renderAt((performance.now() / 1000) % LOOP);
});

// ---------- Encode ----------
async function record() {
  const config = { codec: 'avc1.640033', width: WIDTH, height: HEIGHT, bitrate: 24_000_000, framerate: FPS };
  const support = await VideoEncoder.isConfigSupported(config);
  if (!support.supported) throw new Error('This browser cannot encode H.264 video. Please open this page in Chrome.');

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: 'avc', width: WIDTH, height: HEIGHT, frameRate: FPS },
    fastStart: 'in-memory',
  });
  let error = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => { error = e; },
  });
  encoder.configure(config);

  const total = LOOP * FPS; // frame `total` would equal frame 0 → seamless loop
  for (let i = 0; i < total; i++) {
    if (error) throw error;
    renderAt(i / FPS);
    const frame = new VideoFrame(renderer.domElement, { timestamp: Math.round((i * 1e6) / FPS), duration: Math.round(1e6 / FPS) });
    encoder.encode(frame, { keyFrame: i % FPS === 0 });
    frame.close();
    if (encoder.encodeQueueSize > 8) await new Promise((r) => setTimeout(r, 0));
    if (i % 15 === 0) { status.textContent = `Rendering frame ${i + 1}/${total}`; await new Promise((r) => setTimeout(r, 0)); }
  }
  await encoder.flush();
  if (error) throw error;
  muxer.finalize();
  return new Blob([muxer.target.buffer], { type: 'video/mp4' });
}

button.addEventListener('click', async () => {
  recording = true;
  button.disabled = true;
  try {
    const blob = await record();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ski-360-loop.mp4';
    a.click();
    status.textContent = `Done · ${(blob.size / 1e6).toFixed(1)} MB · Saved as ski-360-loop.mp4. Move it into the project folder.`;
  } catch (e) {
    status.textContent = `Failed: ${e.message}`;
    console.error(e);
  } finally {
    recording = false;
    button.disabled = false;
  }
});

button.disabled = false;
status.textContent = `Previewing (${LOOP}s loop)`;
