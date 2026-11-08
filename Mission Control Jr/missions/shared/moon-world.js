// Outdoor Moon world shared by "Chasing the Sun" and "Over the Hill":
// the south-pole terrain, a grazing Sun with long shadows, stars, Earth on the horizon,
// terrain-following walking and ground-hugging cables.
import * as THREE from 'three';
import {createWorld, loadModel} from './engine.js';
import {missionAsset} from './assets.js';
import {groundHeight, azimuthDir, SITE} from './moon-ground.js';

/** Direction toward the Sun (unit vector) for a compass azimuth (0 = north / -z) and elevation in degrees. */
export function sunVector(azimuthDeg, elevationDeg) {
  const d = azimuthDir(azimuthDeg), el = elevationDeg * Math.PI / 180;
  return new THREE.Vector3(d.x * Math.cos(el), Math.sin(el), d.z * Math.cos(el)).normalize();
}

function regolithTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const ctx = c.getContext('2d');
  const img = ctx.createImageData(256, 256); let s = 9;
  const r = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
  for (let i = 0; i < img.data.length; i += 4) { const v = 200 + r() * 55 - (r() < .04 ? 70 : 0); img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
  ctx.putImageData(img, 0, 0);
  for (let i = 0; i < 60; i++) { ctx.fillStyle = `rgba(80,80,80,${.05 + r() * .08})`; ctx.beginPath(); ctx.arc(r() * 256, r() * 256, 2 + r() * 9, 0, Math.PI * 2); ctx.fill(); }
  const tex = new THREE.CanvasTexture(c); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(48, 48); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return tex;
}
function earthTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128; const ctx = c.getContext('2d');
  ctx.fillStyle = '#1d5fb8'; ctx.fillRect(0, 0, 256, 128);
  ctx.fillStyle = '#3f9a4a'; for (const [x, y, w, h] of [[30, 30, 50, 40], [110, 50, 40, 50], [170, 25, 60, 35], [200, 75, 30, 25]]) { ctx.beginPath(); ctx.ellipse(x, y, w / 2, h / 2, .4, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,.75)'; for (let i = 0; i < 14; i++) { ctx.beginPath(); ctx.ellipse(Math.random() * 256, Math.random() * 128, 20, 5, Math.random(), 0, Math.PI * 2); ctx.fill(); }
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; return tex;
}

export async function createMoonWorld({container, start, onPause, sun = {azimuth: 120, elevation: 1.5}}) {
  const half = SITE.size / 2 - 4;
  const world = await createWorld({container, preset: 'moon', bounds: {minX: -half, maxX: half, minZ: -half, maxZ: half}, start, onPause});
  const {scene, player, key, camera} = world;
  camera.far = 3000; camera.updateProjectionMatrix();
  player.groundAt = groundHeight; player.eyeHeight = 1.62; player.position.y = groundHeight(start.x, start.z) + 1.62;
  const site = await loadModel(missionAsset('moon-south-pole'));
  site.traverse(o => { if (o.isMesh && o.material.name.startsWith('moon-regolith')) { o.material.map = regolithTexture(); o.material.needsUpdate = true; } if (o.name === 'far_massifs') o.traverse(m => { if (m.isMesh) m.castShadow = false; }); });
  scene.add(site);

  // Stars and Earth.
  const starGeo = new THREE.BufferGeometry(), sp = [];
  for (let i = 0; i < 1800; i++) { const v = new THREE.Vector3().randomDirection(); if (v.y < -.02) v.y = -v.y; sp.push(...v.multiplyScalar(1500).toArray()); }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: .85})));
  const earth = new THREE.Mesh(new THREE.SphereGeometry(14, 32, 20), new THREE.MeshStandardMaterial({map: earthTexture(), emissive: 0x16305a, emissiveIntensity: .5, roughness: .8}));
  const earthDir = sunVector(8, 5.5); earth.position.copy(earthDir).multiplyScalar(1000); scene.add(earth);
  // The Sun: a bright disc on the horizon plus the key light.
  const sunDisc = new THREE.Mesh(new THREE.CircleGeometry(9, 32), new THREE.MeshBasicMaterial({color: 0xfffbe8}));
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({color: 0xfff1c8, transparent: true, opacity: .35, depthWrite: false, blending: THREE.AdditiveBlending})); glow.scale.set(80, 80, 1);
  scene.add(sunDisc, glow);
  Object.assign(key.shadow.camera, {left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 400}); key.shadow.camera.updateProjectionMatrix();
  key.shadow.mapSize.set(4096, 4096); key.shadow.bias = -.0004; key.shadow.normalBias = .06;
  let sunAz = sun.azimuth, sunEl = sun.elevation;
  // The light is drawn a little higher than the rules use (1.5°) so shadows stay readable on screen.
  const drawEl = el => Math.max(el, 3.2);
  function setSun(azimuthDeg, elevationDeg = sunEl) {
    sunAz = azimuthDeg; sunEl = elevationDeg;
    const v = sunVector(azimuthDeg, elevationDeg);
    sunDisc.position.copy(v).multiplyScalar(1200); sunDisc.lookAt(0, 0, 0); glow.position.copy(sunDisc.position);
  }
  world.onFrame(() => {
    const p = player.position, v = sunVector(sunAz, drawEl(sunEl));
    key.target.position.set(p.x, groundHeight(p.x, p.z), p.z); key.position.copy(key.target.position).addScaledVector(v, 150); key.target.updateMatrixWorld();
  });
  setSun(sunAz, sunEl);

  /** A cable that lies on the ground between two moving points (functions that fill a Vector3). */
  function groundCable({from, to, color = 0xffb02e, radius = .03}) {
    const mat = new THREE.MeshStandardMaterial({color, roughness: .6});
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat); mesh.castShadow = true; scene.add(mesh);
    const a = new THREE.Vector3(), b = new THREE.Vector3(); let lastKey = '';
    const stop = world.onFrame(() => {
      from(a); to(b); const k = [a.x, a.y, a.z, b.x, b.y, b.z].map(n => n.toFixed(1)).join();
      if (k === lastKey) return; lastKey = k;
      const flat = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(2, Math.ceil(flat / .8)), pts = [a.clone()];
      for (let i = 1; i < n; i++) { const t = i / n, x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t; const lift = Math.min(1, Math.min(i, n - i) / 2); pts.push(new THREE.Vector3(x, groundHeight(x, z) + .04 + (1 - lift) * ((i < n / 2 ? a.y - groundHeight(a.x, a.z) : b.y - groundHeight(b.x, b.z)) * .6), z)); }
      pts.push(b.clone());
      mesh.geometry.dispose(); mesh.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), pts.length * 3, radius, 6);
    });
    return {mesh, remove() { stop(); scene.remove(mesh); mesh.geometry.dispose(); mat.dispose(); }};
  }
  /** Put an object on the ground at (x, z) with an optional yaw. */
  const onGround = (object, x, z, yaw = 0, lift = 0) => { object.position.set(x, groundHeight(x, z) + lift, z); object.rotation.y = yaw; if (!object.parent) scene.add(object); return object; };

  return {world, site, earth, setSun, get sun() { return {azimuth: sunAz, elevation: sunEl}; }, groundCable, onGround, ground: groundHeight};
}
