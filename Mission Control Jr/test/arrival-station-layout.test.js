import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createArrivalInterior, equipmentObstacle, EQUIPMENT, STATION_START, STATION_BOUNDS, WALK_TARGETS} from '../missions/orbit/station-layout.js';
import {planRoute, isBlocked} from '../navigation.js';

test('the restored station keeps its observation window and hatch and replaces old console units', () => {
  const station = createArrivalInterior();
  assert.equal(station.cabin.name, 'Asteria walkable interior');
  assert.ok(station.window.isMesh);
  assert.ok(station.hatch.children.length >= 3);
  assert.equal(station.lights.length, 5);
  assert.ok(station.strips.length);
  assert.equal(isBlocked(0, 0, station.obstacles), false);
  assert.equal(isBlocked(7, 12, station.obstacles), true); // outside the cross-shaped hull
});

test('actual replacement GLBs leave every mission station reachable throughout the old deck', async () => {
  const {obstacles, cabin} = createArrivalInterior();
  const models = {rack: 'comm-rack', panel: 'power-panel', locker: 'spares-case', planner: 'landing-planner'};
  for (const [id, name] of Object.entries(models)) {
    const bytes = await readFile(new URL(`../assets/models/expansion/${name}.glb`, import.meta.url));
    const {scene} = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
    const at = EQUIPMENT[id]; scene.position.set(at.x, 0, at.z); scene.rotation.y = at.yaw;
    cabin.add(scene); obstacles.push(equipmentObstacle(scene));
  }
  assert.equal(isBlocked(STATION_START.x, STATION_START.z, obstacles), false);
  // Check every destination from every other destination, including the two side rooms.
  for (const start of [STATION_START, ...WALK_TARGETS]) for (const end of WALK_TARGETS) {
    assert.equal(isBlocked(end.x, end.z, obstacles), false, end.id);
    const route = planRoute(start, end, obstacles, STATION_BOUNDS);
    assert.ok(route.length, `${start.id || 'entry'} → ${end.id}`);
    for (const point of route) assert.equal(isBlocked(point.x, point.z, obstacles), false);
  }
});
