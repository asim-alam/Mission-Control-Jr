import * as THREE from 'three';
import { buildOutpost } from './outpost.js';

/**
 * 3D Meridian Martian Outpost background for the homepage, matching mission=extended (Thirty Sols),
 * scaled up / zoomed in with a smooth orbiting camera and floating dust particles.
 */

// Model references used by Vite bundling and validated by tests:
const HABITAT_URL = new URL('./assets/models/habitat.glb', import.meta.url).href;
const ROVER_DYNAMIC_URL = new URL('./assets/models/rover-dynamic.glb', import.meta.url).href;
const ASTRONAUT_URL = new URL('./assets/models/astronaut.glb', import.meta.url).href;

export async function createJourneyScene(host) {
  const width = window.innerWidth || 800;
  const height = window.innerHeight || 600;

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  host.replaceChildren(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xc98a5a);
  scene.fog = new THREE.Fog(0xc98a5a, 40, 160);

  // Zoomed-in perspective camera (FOV 45, orbiting closer than extended mission radius 22)
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 500);

  // Atmospheric Martian lighting matching mission=extended
  const hemi = new THREE.HemisphereLight(0xffd9b0, 0x5a2a18, 0.85);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xffe2c0, 2.2);
  sun.position.set(20, 25, 10);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, { left: -25, right: 25, top: 25, bottom: -25 });
  scene.add(sun);

  // Load equirectangular sky map asynchronously
  const texLoader = new THREE.TextureLoader();
  texLoader.loadAsync(new URL('./assets/mars-sky.webp', import.meta.url).href).then((tex) => {
    tex.mapping = THREE.EquirectangularReflectionMapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    scene.background = tex;
    scene.environment = tex;
  }).catch(() => {});

  // Ground plane with Mars terrain texture - loads immediately
  const groundTex = texLoader.load(new URL('./assets/mars-ground.webp', import.meta.url).href);
  groundTex.colorSpace = THREE.SRGBColorSpace;
  groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
  groundTex.repeat.set(40, 40);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(400, 400),
    new THREE.MeshStandardMaterial({ map: groundTex, roughness: 1 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  // Scattered rocks around the landscape
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x7a3b22, roughness: 1, flatShading: true });
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  for (let i = 0; i < 80; i++) {
    const rock = new THREE.Mesh(rockGeo, rockMat);
    const scale = 0.3 + (i % 7) * 0.16;
    rock.scale.setScalar(scale);
    const a = i * 2.399;
    const r = 13 + (i % 12) * 5.2;
    rock.position.set(Math.cos(a) * r, scale * 0.35, Math.sin(a) * r);
    rock.rotation.set(i * 0.23, i * 0.51, i * 0.17);
    rock.castShadow = true;
    scene.add(rock);
  }

  // Meridian solar panel array
  const panelMat = new THREE.MeshStandardMaterial({ color: 0x1a2a55, metalness: 0.6, roughness: 0.3 });
  const poleMat = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.8 });
  const solarGroup = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2), poleMat);
    pole.position.y = 0.6;
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 1.4), panelMat);
    panel.position.y = 1.25;
    panel.rotation.x = -0.5;
    panel.castShadow = true;
    g.add(pole, panel);
    g.position.set(-10 + (i % 3) * 2.8, 0, -4 + Math.floor(i / 3) * 2.4);
    solarGroup.add(g);
  }
  scene.add(solarGroup);

  // Load the 3D Outpost models (habitat, rover, crew) in background without blocking render loop
  buildOutpost(scene);

  // Floating ambient Mars dust particles
  const dustCount = 800;
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 80;
    dustPos[i * 3 + 1] = 0.4 + Math.random() * 8;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustMat = new THREE.PointsMaterial({
    color: 0xd9925a,
    size: 0.22,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  // Initial camera placement
  let angle = 0.6;
  camera.position.set(Math.cos(angle) * 15.5, 6.8, Math.sin(angle) * 15.5);
  camera.lookAt(0, 1.8, 0);

  // Animation Loop (Slow orbiting camera zoomed in around the outpost)
  let alive = true, frame = 0, last = performance.now();
  const render = (now) => {
    if (!alive) return;
    frame = requestAnimationFrame(render);
    // Low-power throttling & background tab suppression
    if (document.hidden || now - last < 33) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    // Slow 360-degree orbit around the base, zoomed in (radius 15.5, height 6.8)
    angle += dt * 0.05;
    camera.position.set(Math.cos(angle) * 15.5, 6.8, Math.sin(angle) * 15.5);
    camera.lookAt(0, 1.8, 0);

    // Subtle dust motion
    const p = dustGeo.attributes.position;
    for (let i = 0; i < dustCount; i++) {
      let x = p.getX(i) + dt * 4;
      if (x > 40) x -= 80;
      p.setX(i, x);
    }
    p.needsUpdate = true;

    renderer.render(scene, camera);
  };

  const resize = () => {
    const w = window.innerWidth || 800;
    const h = window.innerHeight || 600;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  window.addEventListener('resize', resize, { passive: true });
  frame = requestAnimationFrame(render);

  return () => {
    alive = false;
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', resize);
    scene.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
    if (scene.background && scene.background.dispose) scene.background.dispose();
    if (scene.environment && scene.environment.dispose) scene.environment.dispose();
    renderer.dispose();
    if (host.contains(renderer.domElement)) {
      host.removeChild(renderer.domElement);
    }
  };
}
