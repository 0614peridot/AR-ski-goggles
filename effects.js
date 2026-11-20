import * as THREE from 'three';

// Everything here is a pure function of time t and repeats exactly every LOOP seconds,
// so frame 0 and frame LOOP*fps are identical and the video loops without a seam.
export const LOOP = 10;

// Image coordinates (u = 0..1 across, r = 0..1 top→bottom) → world direction.
// Matches the environment sphere in main.js (scaled -1 on X, rotated -90° on Y).
export function imageDir(u, r) {
  const phi = 2 * Math.PI * u;
  const th = Math.PI * r;
  return new THREE.Vector3(-Math.sin(phi) * Math.sin(th), Math.cos(th), Math.cos(phi) * Math.sin(th));
}

const SUN = { u: 0.1996, r: 0.3843 }; // measured from ski-360.png

// ---------- Falling snow ----------
function createSnow(count, pxPerUnit) {
  const pos = new Float32Array(count * 3);
  const params = new Float32Array(count * 4); // speed, phase, sway cycles, size
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const rad = 2 + Math.pow(Math.random(), 1.4) * 22; // denser close to the viewer
    const speed = 0.6 + Math.random() * 0.8; // m/s
    pos[i * 3] = Math.cos(a) * rad;
    pos[i * 3 + 1] = Math.random() * speed * LOOP; // start offset inside its own cycle
    pos[i * 3 + 2] = Math.sin(a) * rad;
    params[i * 4] = speed;
    params[i * 4 + 1] = Math.random() * Math.PI * 2;
    params[i * 4 + 2] = 1 + Math.floor(Math.random() * 3);
    params[i * 4 + 3] = 0.045 + Math.random() * 0.06; // flake size in metres (exaggerated to read at 2K)
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('params', new THREE.BufferAttribute(params, 4));

  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uLoop: { value: LOOP }, uPx: { value: pxPerUnit } },
    vertexShader: /* glsl */ `
      attribute vec4 params;
      uniform float uTime, uLoop, uPx;
      varying float vAlpha;
      const float TAU = 6.2831853;
      void main() {
        float speed = params.x, phase = params.y, cycles = params.z, size = params.w;
        float H = speed * uLoop;                       // fall height covered in exactly one loop
        float k = mod(position.y + speed * uTime, H);  // 0..H
        float sway = TAU * cycles * uTime / uLoop + phase;
        vec3 p = vec3(position.x + 0.35 * sin(sway), 7.0 - k, position.z + 0.35 * cos(sway + phase)); // whole cycles only → seamless
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        float px = size * uPx / -mv.z;
        vAlpha = 0.9 * smoothstep(0.0, 0.08, k / H) * smoothstep(1.0, 0.92, k / H);
        if (px < 1.5) { vAlpha *= (px / 1.5) * (px / 1.5); px = 1.5; }
        gl_PointSize = px;
      }`,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      void main() {
        float d = length(gl_PointCoord - 0.5) * 2.0;
        float a = vAlpha * smoothstep(1.0, 0.2, d);
        gl_FragColor = vec4(vec3(0.97, 0.99, 1.0) * a, 1.0);
      }`,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return points;
}

// ---------- Sun glare (6 rays → rotating 60° per loop is seamless) ----------
function glareTexture() {
  const s = 512, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grad.addColorStop(0, 'rgba(255,240,200,1)');
  grad.addColorStop(0.08, 'rgba(255,220,150,0.7)');
  grad.addColorStop(0.35, 'rgba(255,200,120,0.12)');
  grad.addColorStop(1, 'rgba(255,200,120,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, s, s);
  g.translate(s / 2, s / 2);
  g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) {
    g.rotate(Math.PI / 3);
    const ray = g.createLinearGradient(0, 0, s / 2, 0);
    ray.addColorStop(0, 'rgba(255,235,190,0.45)');
    ray.addColorStop(1, 'rgba(255,235,190,0)');
    g.fillStyle = ray;
    g.beginPath();
    g.moveTo(0, -3); g.lineTo(s / 2, 0); g.lineTo(0, 3);
    g.fill();
  }
  return new THREE.CanvasTexture(c);
}

function createGlare() {
  const mat = new THREE.SpriteMaterial({
    map: glareTexture(),
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.position.copy(imageDir(SUN.u, SUN.r).multiplyScalar(100));
  sprite.scale.setScalar(55);
  return sprite;
}

// ---------- Sparkles on sunlit snow ----------
function createSparkles(image, count, pxPerUnit) {
  const c = document.createElement('canvas');
  c.width = image.width; c.height = image.height;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(image, 0, 0);
  const data = g.getImageData(0, 0, c.width, c.height).data;

  const pos = [], params = [];
  let tries = 0;
  while (pos.length / 3 < count && tries++ < 200000) {
    const u = Math.random(), r = 0.56 + Math.random() * 0.32;
    const x = Math.floor(u * c.width), y = Math.floor(r * c.height);
    const i = (y * c.width + x) * 4;
    const R = data[i], G = data[i + 1], B = data[i + 2];
    if (R < 215 || G < 215 || B < 215) continue; // sunlit, unsaturated snow only
    const d = imageDir(u, r).multiplyScalar(60);
    pos.push(d.x, d.y, d.z);
    params.push(Math.random() * Math.PI * 2, 1 + Math.floor(Math.random() * 3), 6 + Math.random() * 8);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('params', new THREE.Float32BufferAttribute(params, 3));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uLoop: { value: LOOP }, uScale: { value: pxPerUnit / 512 } },
    vertexShader: /* glsl */ `
      attribute vec3 params;
      uniform float uTime, uLoop, uScale;
      varying float vAlpha;
      void main() {
        float s = sin(6.2831853 * params.y * uTime / uLoop + params.x);
        vAlpha = pow(max(s, 0.0), 14.0);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = params.z * uScale;
      }`,
    fragmentShader: /* glsl */ `
      varying float vAlpha;
      void main() {
        vec2 p = (gl_PointCoord - 0.5) * 2.0;
        float core = exp(-dot(p, p) * 18.0);
        float cross = exp(-abs(p.x) * 22.0) * exp(-abs(p.y) * 3.5) + exp(-abs(p.y) * 22.0) * exp(-abs(p.x) * 3.5);
        gl_FragColor = vec4(vec3(1.0, 0.98, 0.93) * vAlpha * (core + 0.7 * cross), 1.0);
      }`,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return points;
}

// pxPerUnit: focal length in pixels of the camera rendering the effects (cube face size / 2).
export function createEffects(scene, image, pxPerUnit = 512) {
  const snow = createSnow(5000, pxPerUnit);
  const glare = createGlare();
  const sparkles = createSparkles(image, 450, pxPerUnit);
  scene.add(snow, glare, sparkles);

  return function update(t) {
    const phase = (2 * Math.PI * t) / LOOP;
    snow.material.uniforms.uTime.value = t;
    sparkles.material.uniforms.uTime.value = t;
    glare.material.rotation = phase / 6; // 60° per loop, rays are 6-fold symmetric
    glare.material.opacity = 0.55 + 0.2 * Math.sin(phase);
  };
}
