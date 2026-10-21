import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/** Small, non-interactive Meridian flyby used only behind the expedition menu. */
export async function createJourneyScene(host) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.1));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  host.replaceChildren(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden', 'true');

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xc89472);
  scene.fog = new THREE.Fog(0xb47d5c, 48, 150);
  const camera = new THREE.PerspectiveCamera(48, innerWidth / innerHeight, .1, 260);
  camera.position.set(30, 15, 35);
  camera.lookAt(8, 1.5, -4);
  scene.add(new THREE.HemisphereLight(0xf6ded0, 0x583c35, 2));
  const sun = new THREE.DirectionalLight(0xffe5cd, 2.7);
  sun.position.set(-20, 34, 16);
  scene.add(sun);

  const groundMap = await new THREE.TextureLoader().loadAsync(new URL('./assets/mars-ground.webp', import.meta.url).href);
  groundMap.colorSpace = THREE.SRGBColorSpace;
  groundMap.wrapS = groundMap.wrapT = THREE.RepeatWrapping;
  groundMap.repeat.set(30, 30);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), new THREE.MeshStandardMaterial({ map: groundMap, roughness: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -.08;
  scene.add(ground);

  const habitat = new THREE.Group();
  habitat.position.set(9, 0, -5);
  habitat.visible = false;
  scene.add(habitat);
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(2.25, 2.25, 7.8, 32, 1, false), new THREE.MeshStandardMaterial({ color: 0xd7d7cf, metalness: .24, roughness: .55 }));
  shell.rotation.z = Math.PI / 2;
  shell.position.y = 2.6;
  habitat.add(shell);
  const rimMat = new THREE.MeshStandardMaterial({ color: 0x26363c, metalness: .6, roughness: .42 });
  for (const x of [-3.96, 3.96]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(2.18, .19, 12, 36), rimMat);
    rim.rotation.y = Math.PI / 2;
    rim.position.set(x, 2.6, 0);
    habitat.add(rim);
  }
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x101b20, metalness: .5, roughness: .3 });
  for (const x of [-1.7, 0, 1.7]) {
    const window = new THREE.Mesh(new THREE.CylinderGeometry(.48, .48, .08, 24), windowMat);
    window.rotation.z = Math.PI / 2;
    window.position.set(x, 2.65, -2.19);
    habitat.add(window);
  }
  const legMat = new THREE.MeshStandardMaterial({ color: 0x584a3c, metalness: .35, roughness: .7 });
  for (const x of [-2.7, 2.7]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(.12, .18, 1.5, 8), legMat);
    leg.position.set(x, .75, 0);
    habitat.add(leg);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(1, .18, .7), new THREE.MeshStandardMaterial({ color: 0x242a2c, roughness: .9 }));
    foot.position.set(x, .12, 0);
    habitat.add(foot);
  }

  // Use the same outpost and rover models as the playable surface chapter.
  const modelLoader = new GLTFLoader();
  try {
    const model = (await modelLoader.loadAsync(new URL('./assets/models/habitat.glb', import.meta.url).href)).scene;
    const bounds = new THREE.Box3().setFromObject(model), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
    const scale = 7.8 / Math.max(size.x, size.z);
    model.scale.setScalar(scale);
    model.position.set(9 - center.x * scale, -bounds.min.y * scale, -5 - center.z * scale);
    model.traverse(child => { if (child.isMesh) { child.castShadow = false; child.receiveShadow = false; } });
    scene.add(model);
  } catch {
    habitat.visible = true;
  }

  const panelMat = new THREE.MeshStandardMaterial({ color: 0x153653, metalness: .3, roughness: .5, emissive: 0x061622 });
  const gridMat = new THREE.MeshStandardMaterial({ color: 0x7c9dad, metalness: .2, roughness: .5 });
  for (const x of [-9, -6, -3]) {
    const stand = new THREE.Mesh(new THREE.BoxGeometry(.25, 1.1, .25), rimMat);
    stand.position.set(x, .55, 2.5);
    scene.add(stand);
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.5, .08, 1.7), panelMat);
    panel.position.set(x, 1.3, 2.5);
    panel.rotation.x = -.16;
    scene.add(panel);
    for (let i = 0; i < 4; i++) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(.018, .09, 1.68), gridMat);
      line.position.set(x - .75 + i * .5, 1.35, 2.5);
      line.rotation.x = -.16;
      scene.add(line);
    }
  }

  const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ color: 0x764b39, roughness: 1 }), 90);
  const matrix = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  for (let i = 0; i < 90; i++) {
    const a = i * 2.399, radius = 14 + (i % 10) * 4, x = Math.cos(a) * radius, z = -18 + Math.sin(a) * radius;
    q.setFromEuler(new THREE.Euler(i * .23, i * .51, i * .17));
    matrix.compose(new THREE.Vector3(x, .16 + (i % 4) * .08, z), q, s.set(.2 + (i % 5) * .16, .18 + (i % 4) * .08, .22 + (i % 3) * .12));
    rocks.setMatrixAt(i, matrix);
  }
  scene.add(rocks);

  let rover;
  try {
    const gltf = await modelLoader.loadAsync(new URL('./assets/models/rover-dynamic.glb', import.meta.url).href);
    rover = gltf.scene;
    const bounds = new THREE.Box3().setFromObject(rover), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
    const scale = 3.5 / Math.max(size.x, size.z);
    rover.scale.setScalar(scale);
    rover.position.set(0, -bounds.min.y * scale, 0);
    rover.traverse(child => { if (child.isMesh) { child.castShadow = false; child.receiveShadow = false; } });
    rover.position.add(new THREE.Vector3(0, 0, 0));
    const roverMount = new THREE.Group(); roverMount.position.set(17, 0, 1); roverMount.rotation.y = -.5; roverMount.add(rover); scene.add(roverMount);
  } catch { /* the procedural habitat and surface remain available if the rover asset fails */ }

  try {
    const astronaut = (await modelLoader.loadAsync(new URL('./assets/models/astronaut.glb', import.meta.url).href)).scene;
    const bounds = new THREE.Box3().setFromObject(astronaut), size = bounds.getSize(new THREE.Vector3()), center = bounds.getCenter(new THREE.Vector3());
    const scale = 1.7 / Math.max(size.y, .01);
    for (const [x, z, yaw] of [[3, -3, .4], [5.2, -.6, -1.2], [10.8, 1, 2.4]]) {
      const crewMember = astronaut.clone(true);
      crewMember.scale.setScalar(scale);
      crewMember.position.set(x - center.x * scale, -bounds.min.y * scale, z - center.z * scale);
      crewMember.rotation.y = yaw;
      crewMember.traverse(child => { if (child.isMesh) { child.castShadow = false; child.receiveShadow = false; } });
      scene.add(crewMember);
    }
  } catch { /* keep the landing scene usable if optional crew art is unavailable */ }

  const dust = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: 0xf6c39a, size: .11, transparent: true, opacity: .46, depthWrite: false }));
  const positions = new Float32Array(72 * 3);
  for (let i = 0; i < 72; i++) { positions[i * 3] = (Math.random() - .5) * 100; positions[i * 3 + 1] = .5 + Math.random() * 8; positions[i * 3 + 2] = -28 + Math.random() * 62; }
  dust.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  scene.add(dust);

  let alive = true, frame = 0, last = 0, t = 0;
  const render = now => {
    if (!alive) return;
    frame = requestAnimationFrame(render);
    if (document.hidden || now - last < 33) return;
    const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
    camera.position.x = 30 + Math.sin(t * .13) * 1.2;
    camera.position.z = 35 + Math.cos(t * .11) * .8;
    camera.lookAt(8, 1.5, -4);
    const p = dust.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) { p.array[i * 3] += dt * .32; if (p.array[i * 3] > 50) p.array[i * 3] = -50; }
    p.needsUpdate = true;
    renderer.render(scene, camera);
  };
  const resize = () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); };
  addEventListener('resize', resize, { passive: true });
  frame = requestAnimationFrame(render);
  return () => {
    alive = false; cancelAnimationFrame(frame); removeEventListener('resize', resize);
    scene.traverse(obj => { obj.geometry?.dispose(); if (obj.material) for (const material of Array.isArray(obj.material) ? obj.material : [obj.material]) { for (const value of Object.values(material)) if (value?.isTexture) value.dispose(); material.dispose(); } });
    renderer.dispose(); renderer.domElement.remove(); groundMap.dispose();
  };
}
