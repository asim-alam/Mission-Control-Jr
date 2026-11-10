import * as THREE from 'three';
import {createStation} from '../../station-model.js';

// Keep the original full-size cross-shaped Asteria deck. All coordinates are metres.
export const STATION_BOUNDS = {minX: -10.6, maxX: 10.6, minZ: -17.5, maxZ: 17.5};
export const STATION_START = {x: 0, z: 14, yaw: 0};
export const EQUIPMENT = {
  rack: {x: -2, z: -12.5, yaw: 0},
  panel: {x: -2, z: -4.8, yaw: 0},
  locker: {x: -9.5, z: 0, yaw: Math.PI / 2},
  planner: {x: 7, z: 0, yaw: -Math.PI / 2},
};
export const WALK_TARGETS = [
  {id: 'rack', label: '📻 Radio rack', x: -1.5, z: -11, look: {x: -2, z: -12.5}},
  {id: 'panel', label: '⚡ Power panel', x: -1.5, z: -3.5, look: {x: -2, z: -4.8}},
  {id: 'locker', label: '🧰 Spares', x: -8, z: 0, look: {x: -9.5, z: 0}},
  {id: 'planner', label: '🗺️ Planner', x: 5.5, z: 0, look: {x: 7, z: 0}},
  {id: 'hatch', label: '🚀 Hatch', x: 0, z: 16.5, look: {x: 0, z: 18}},
  {id: 'window', label: '🪐 Window', x: 9.5, z: 2.5, look: {x: 12, z: 2.5}},
];

export function createArrivalInterior() {
  const station = createStation();
  // Only the old console units are replaced. Keep the hull, floor, bunks, racks,
  // handrails, science benches, lighting and observation window exactly in place.
  for (const terminal of station.terminals) terminal.object.removeFromParent();
  const obstacles = station.colliders.slice(0, -station.terminals.length);
  const materials = new Map(), lights = [], strips = [];
  let window;
  station.interior.traverse(o => {
    if (o.isPointLight) { o.userData.nominalIntensity = o.intensity; lights.push(o); }
    if (!o.isMesh) return;
    o.castShadow = false; // The original structural shell does not need hundreds of shadow casters.
    const clone = m => { if (!materials.has(m)) materials.set(m, m.clone()); return materials.get(m); };
    o.material = Array.isArray(o.material) ? o.material.map(clone) : clone(o.material);
    if (o.material.emissiveIntensity === 2 && !strips.includes(o.material)) strips.push(o.material);
    if (o.geometry.type === 'PlaneGeometry' && o.material.transparent && o.position.x > 11) window = o;
  });

  // A visible, usable control on the existing docking hatch.
  const hatch = new THREE.Group(); hatch.name = 'lander-hatch-control';
  hatch.position.set(0, 1.45, 17.92);
  const wheel = new THREE.Mesh(new THREE.TorusGeometry(.24, .035, 8, 24),
    new THREE.MeshStandardMaterial({color: 0xffb02e, metalness: .5, roughness: .4}));
  hatch.add(wheel);
  for (const angle of [0, Math.PI / 2]) {
    const spoke = new THREE.Mesh(new THREE.BoxGeometry(.46, .04, .05), wheel.material);
    spoke.rotation.z = angle; hatch.add(spoke);
  }
  station.interior.add(hatch);
  return {cabin: station.interior, exterior: station.exterior, obstacles, lights, strips, window, hatch};
}

export function equipmentObstacle(object) {
  const box = new THREE.Box3().setFromObject(object);
  return {minX: box.min.x, maxX: box.max.x, minZ: box.min.z, maxZ: box.max.z};
}
