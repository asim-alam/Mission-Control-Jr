import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Explicit URLs let Vite include all three binaries in production builds.
export const MODEL_ASSETS = [
  { name: 'habitat', url: new URL('./assets/models/habitat.glb', import.meta.url) },
  { name: 'rover', url: new URL('./assets/models/rover.glb', import.meta.url) },
  { name: 'astronaut', url: new URL('./assets/models/astronaut.glb', import.meta.url) },
];

export async function buildOutpost(scene) {
  const loader = new GLTFLoader();
  try {
    // Load the suit once and reuse its geometry for both crew members.
    const results = await Promise.all(MODEL_ASSETS.map(asset => loader.loadAsync(asset.url.href)));
    const models = Object.fromEntries(MODEL_ASSETS.map((asset, i) => [asset.name, results[i].scene]));
    const placements = [
      ['habitat', 9, [0, 0, 0], 0.3],
      ['rover', 4.5, [8, 0, -6], -0.8],
      ['astronaut', 1.85, [4.4, 0, 3.8], 0.9],
      ['astronaut', 1.85, [-6.7, 0, 1.4], 1.2],
    ];
    for (const [name, size, position, yaw] of placements) {
      const model = models[name].clone(true);
      const dimensions = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
      const scale = size / Math.max(dimensions.x, dimensions.y, dimensions.z);
      model.scale.setScalar(scale);
      model.rotation.y = yaw;
      const bounds = new THREE.Box3().setFromObject(model);
      model.position.set(position[0], position[1] - bounds.min.y, position[2]);
      model.name = `${name} GLB`;
      model.traverse(part => {
        if (part.isMesh) {
          part.castShadow = part.receiveShadow = true;
          part.material.envMapIntensity = 0.45;
        }
      });
      scene.add(model);
    }
    return true;
  } catch (error) {
    console.warn('Outpost GLB loading failed; using fallback scenery.', error);
    buildFallbackOutpost(scene);
    return false;
  }
}

// Keep the game playable if a server fails to deliver a model.
function buildFallbackOutpost(scene) {
  const white = new THREE.MeshStandardMaterial({ color: 0xe6dfd3, roughness: 0.65 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x58626b, metalness: 0.7, roughness: 0.4 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x193c51, metalness: 0.4, roughness: 0.2 });
  const orange = new THREE.MeshStandardMaterial({ color: 0xe7863a, roughness: 0.7 });
  function part(group, geometry, material, x, y, z) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  }
  const hab = new THREE.Group();
  part(hab, new THREE.CylinderGeometry(2, 2, 7, 24), white, 0, 2.6, 0).rotation.z = Math.PI / 2;
  for (const x of [-2.5, 2.5]) {
    part(hab, new THREE.BoxGeometry(0.3, 1.3, 3), metal, x, 0.65, 0);
    part(hab, new THREE.BoxGeometry(1.2, 0.8, 0.12), glass, x, 2.8, 1.95);
  }
  part(hab, new THREE.CylinderGeometry(1.1, 1.1, 0.3, 24), metal, 3.6, 2.6, 0).rotation.z = Math.PI / 2;
  hab.rotation.y = 0.3;
  scene.add(hab);

  const rover = new THREE.Group();
  part(rover, new THREE.BoxGeometry(2.5, 0.7, 1.8), metal, 0, 0.9, 0);
  part(rover, new THREE.BoxGeometry(1.5, 1, 1.6), white, -0.3, 1.6, 0);
  part(rover, new THREE.BoxGeometry(0.05, 0.6, 1.3), glass, 0.48, 1.7, 0);
  for (const x of [-0.9, 0.9]) for (const z of [-1, 1]) {
    part(rover, new THREE.CylinderGeometry(0.5, 0.5, 0.35, 16), metal, x, 0.5, z).rotation.x = Math.PI / 2;
  }
  rover.position.set(8, 0, -6);
  rover.rotation.y = -0.8;
  scene.add(rover);

  for (const [x, z, yaw] of [[4, 3, -1.2], [-7, 0, 2.2]]) {
    const astronaut = new THREE.Group();
    part(astronaut, new THREE.BoxGeometry(0.5, 0.65, 0.32), white, 0, 1.05, 0);
    part(astronaut, new THREE.SphereGeometry(0.27, 16, 12), white, 0, 1.6, 0);
    part(astronaut, new THREE.BoxGeometry(0.35, 0.2, 0.12), glass, 0, 1.62, 0.23);
    part(astronaut, new THREE.BoxGeometry(0.42, 0.5, 0.22), orange, 0, 1.08, -0.25);
    for (const side of [-1, 1]) {
      part(astronaut, new THREE.CylinderGeometry(0.09, 0.09, 0.65, 10), white, side * 0.15, 0.4, 0);
      part(astronaut, new THREE.CylinderGeometry(0.08, 0.08, 0.55, 10), white, side * 0.35, 1, 0);
    }
    astronaut.position.set(x, 0, z);
    astronaut.rotation.y = yaw;
    scene.add(astronaut);
  }
}
