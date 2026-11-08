// 3D view of "A Place to Hide": a walk-in Mars habitat where shields are carried and fitted by hand.
import * as THREE from 'three';
import {createWorld, loadModel, part, setOpacity} from '../shared/engine.js';
import {missionAsset} from '../shared/assets.js';
import {makeCrew} from '../shared/crew.js';
import {planRoute} from '../../navigation.js';
import {CREW, SLOT_IDS} from './state.js';
import {item, stormStrength} from './actions.js';

const SHELTER = {x: -4.2, z: -1.4};
export const INSIDE = {minX: -5.8, maxX: -2.6, minZ: -2.6, maxZ: -.2};
const WORK = {elena: [.6, -3.5, Math.PI], amara: [-6.7, 2.9, -Math.PI / 2], jin: [2.6, 1.6, .6], luca: [6.4, 2.6, Math.PI / 2]};
const HOLD_POSE = {water: {scale: .3, offset: [-.05, -.32, 0], rotation: [0, -.5, 0]}, poly: {scale: .32, offset: [-.05, -.32, 0], rotation: [0, -.4, 0]}, cargo: {scale: .3, offset: [-.05, -.32, 0], rotation: [0, -.5, 0]}};

function storeSpot(it) {
  const n = +it.id.split('-')[1] - 1;
  if (it.kind === 'water') return [-.2 + n * 1.42, 4.42, Math.PI];
  if (it.kind === 'cargo') return [2.4 + n * 1.5, -4.38, 0];
  return [7.62, n ? 2.7 : -2.7, -Math.PI / 2];
}

export async function createShelterScene({container, getState, act, onPause, onConsole}) {
  const world = await createWorld({container, preset: 'interior', bounds: {minX: -7.4, maxX: 7.4, minZ: -4.4, maxZ: 4.4}, start: {x: 5.6, z: .6, yaw: Math.PI / 2}, onPause});
  const {scene, player} = world;
  const [hab, shelter, console_, station, ...crewList] = await Promise.all([
    loadModel(missionAsset('hab-quarters-interior')), loadModel(missionAsset('storm-shelter')), loadModel(missionAsset('space-weather-console')),
    loadModel(missionAsset('drinking-water-station')), ...CREW.map(id => makeCrew(id))]);
  scene.add(hab);
  world.place3d(shelter, SHELTER.x, 0, SHELTER.z);
  world.place3d(console_, .6, 0, -4.45);
  world.place3d(station, -2.1, 0, 4.5, Math.PI);
  // Warm practical lights along the ceiling strips plus a cool fill near the shelter.
  const lamps = [];
  for (const x of [-5, 0, 5]) { const l = new THREE.PointLight(0xfff0dc, 3, 9, 1.6); l.position.set(x, 3.6, 0); scene.add(l); lamps.push(l); }
  const shelterLamp = new THREE.PointLight(0xffc56b, 2.5, 4, 2); shelterLamp.position.set(SHELTER.x, 2, SHELTER.z + .3); scene.add(shelterLamp);
  world.key.position.set(2, 9, 3); world.key.target.position.set(-1, 0, -1);

  // Shield items.
  const state0 = getState();
  const models = {};
  for (const it of state0.items) {
    models[it.id] = await loadModel(missionAsset({water: 'water-wall-bag', poly: 'poly-shield-panel', cargo: 'cargo-shield-stack'}[it.kind]));
    models[it.id].name = it.id;
  }
  const slotNodes = Object.fromEntries(SLOT_IDS.map(id => [id, part(shelter, `slot_${id}`)]));
  const mounts = Object.fromEntries(SLOT_IDS.map(id => [id, part(shelter, `mount_${id}`)]));
  const outlines = Object.fromEntries(SLOT_IDS.map(id => [id, part(shelter, `outline_${id}`)]));
  // Invisible panels make each open slot easy to aim at (the outline itself is only thin bars).
  const hitMat = new THREE.MeshBasicMaterial({transparent: true, opacity: 0, depthWrite: false});
  for (const id of SLOT_IDS) { const hit = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.1), hitMat); hit.name = `hit_${id}`; hit.material.side = THREE.DoubleSide; outlines[id].add(hit); }
  const storeAnchors = {};
  for (const it of state0.items) {
    const [x, z, yaw] = storeSpot(it); const a = new THREE.Group(); a.position.set(x, 0, z); a.rotation.y = yaw; scene.add(a); storeAnchors[it.id] = a;
  }
  const where = {}; // what the scene currently shows for each item
  function snap(it) {
    const m = models[it.id];
    if (it.at === 'hand') { world.hand.add(m); const pose = HOLD_POSE[it.kind]; m.position.set(...pose.offset); m.rotation.set(...pose.rotation); m.scale.setScalar(pose.scale); }
    else { (it.at === 'store' ? storeAnchors[it.id] : mounts[it.at]).add(m); m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); m.scale.setScalar(1); }
    where[it.id] = it.at;
  }
  state0.items.forEach(snap);

  // Crew.
  const crew = Object.fromEntries(crewList.map(p => [p.id, p]));
  const seats = CREW.map((_, i) => part(shelter, `seat_${i + 1}`));
  const crewShown = {};
  function seatPos(i) { const v = new THREE.Vector3(); seats[i].getWorldPosition(v); return v; }
  for (const id of CREW) { scene.add(crew[id].model); const [x, z, yaw] = WORK[id]; crew[id].teleport(x, z, yaw); crew[id].mode = 'work'; crewShown[id] = 'work'; }
  function placeCrew(id, at, animate) {
    const p = crew[id], i = CREW.indexOf(id), seat = seatPos(i);
    if (at === 'work') { const [x, z, yaw] = WORK[id]; p.teleport(x, z, yaw); p.mode = 'work'; }
    else if (!animate) { p.teleport(seat.x, seat.z + .25, 0); p.mode = 'sit'; }
    else {
      const route = planRoute(p.model.position, {x: seat.x, z: .4}, obstacles, {minX: -7.6, maxX: 7.6, minZ: -4.6, maxZ: 4.6});
      p.mode = 'wave'; setTimeout(() => p.walkRoute([...route, {x: seat.x, z: seat.z + .25}], () => { p.model.rotation.y = 0; p.mode = 'sit'; }), 600);
    }
    crewShown[id] = at === 'work' ? 'work' : 'shelter';
  }

  // Walls of the shelter block walking (the front stays open).
  const obstacles = [
    {minX: -5.95, maxX: -5.8, minZ: -2.75, maxZ: -.05}, {minX: -2.6, maxX: -2.45, minZ: -2.75, maxZ: -.05}, {minX: -5.95, maxX: -2.45, minZ: -2.78, maxZ: -2.62},
    {minX: .05, maxX: 1.15, minZ: -4.8, maxZ: -4.05}, {minX: -6.5, maxX: -3.6, minZ: -5, maxZ: -4.1}, {minX: -2.5, maxX: -1.7, minZ: 4.1, maxZ: 5},
    {minX: -1, maxX: 7.6, minZ: 4.15, maxZ: 5}, {minX: 1.6, maxX: 7.7, minZ: -5, maxZ: -4.05}, {minX: 7.2, maxX: 8, minZ: -3.5, maxZ: -1.9}, {minX: 7.2, maxX: 8, minZ: 1.9, maxZ: 3.5},
  ];
  player.obstacles = obstacles;

  // ---- interactions --------------------------------------------------------------------
  const s = () => getState();
  const label = it => s().scenario.materials[it.kind].label;
  const active = () => s().phase === 'active' && (s().stage === 'prep' || s().stage === 'storm');
  for (const it of state0.items) {
    world.register({id: `item:${it.id}`, object: models[it.id], range: 2.6,
      enabled: () => active() && !s().held && item(s(), it.id).at !== 'hand',
      label: () => item(s(), it.id).at === 'store' ? `Pick up the ${label(it)}` : `Take out the ${label(it)}`,
      onUse: () => act({id: 'pickUp', targetId: it.id})});
  }
  for (const id of SLOT_IDS) {
    world.register({id: `slot:${id}`, object: outlines[id], range: 2.7,
      enabled: () => active() && !!s().held && !s().slots[id],
      holdSeconds: () => s().held && item(s(), s().held).kind === 'poly' ? s().scenario.materials.poly.boltSeconds : 0,
      label: () => s().held && item(s(), s().held).kind === 'poly' ? `Bolt the plastic shield ${id.startsWith('roof') ? 'onto the roof' : 'here'}` : `Put it ${id.startsWith('roof') ? 'on the roof' : 'in this wall spot'}`,
      onUse: () => act({id: 'place', targetId: id})});
  }
  for (const id of CREW) {
    world.register({id: `crew:${id}`, object: crew[id].model, range: 2.6, enabled: () => active() && s().crew[id].at === 'work',
      label: () => `Tell ${crew[id].look.name} to go to the shelter`, onUse: () => act({id: 'callCrew', targetId: id})});
  }
  world.register({id: 'console', object: console_, range: 2.6, enabled: () => s().phase === 'active' && s().stage !== 'plan', label: () => 'Check the storm screen', onUse: onConsole});

  // ---- storm effects ---------------------------------------------------------------------
  const center = new THREE.Vector3(SHELTER.x, 1.1, SHELTER.z);
  const streaks = world.particles({count: 260, color: 0xb18cff, size: .07, additive: true, gravity: 0, life: [.6, 1.2],
    spawn(p, v) { p.set(-7 + Math.random() * 14, 4.3, -4.5 + Math.random() * 9); v.set((Math.random() - .5) * 2, -6 - Math.random() * 3, (Math.random() - .5) * 2); }});
  const leaks = world.particles({count: 160, color: 0xff6bd5, size: .09, additive: true, gravity: 0, life: [.35, .6],
    spawn(p, v) {
      const open = SLOT_IDS.filter(id => !s().slots[id]); if (!open.length) { p.set(0, -99, 0); return; }
      const id = open[Math.floor(Math.random() * open.length)], src = new THREE.Vector3(); slotNodes[id].getWorldPosition(src);
      const out = src.clone().sub(center).setLength(1.4); p.copy(src).add(out).add(new THREE.Vector3((Math.random() - .5) * 1.2, (Math.random() - .5) * 1.2, (Math.random() - .5) * 1.2));
      v.copy(center).sub(p).setLength(5 + Math.random() * 2);
    }});
  const sparks = world.particles({count: 90, color: 0xfff1a8, size: .06, additive: true, gravity: 0, life: [.2, .4],
    spawn(p, v) {
      const full = SLOT_IDS.filter(id => s().slots[id]); if (!full.length) { p.set(0, -99, 0); return; }
      const id = full[Math.floor(Math.random() * full.length)], src = new THREE.Vector3(); slotNodes[id].getWorldPosition(src);
      p.copy(src).add(src.clone().sub(center).setLength(.25)).add(new THREE.Vector3((Math.random() - .5) * 1.1, (Math.random() - .5) * 1.1, (Math.random() - .5) * 1.1));
      v.set((Math.random() - .5), (Math.random() - .5), (Math.random() - .5));
    }});
  const beacon = part(console_, 'beacon_lamp'), doseScreen = part(shelter, 'dose_display'), screen = part(console_, 'display');
  const strips = []; hab.traverse(o => { if (o.isMesh && o.material.name === 'light-strip') strips.push(o.material); });
  const calm = new THREE.Color(0xfff1d6), alarm = new THREE.Color(0xff5a7a);

  world.onFrame((dt, t) => {
    const st = s(), strength = st.phase === 'active' ? stormStrength(st) : 0;
    const warning = st.phase === 'active' && st.stage === 'prep';
    streaks.rate = strength * 260; leaks.rate = strength * 220; sparks.rate = strength * 150;
    beacon.material.emissiveIntensity = warning || strength > 0 ? (Math.sin(t * 8) > 0 ? 3 : .2) : .4;
    const mood = Math.min(1, strength * 1.2 + (warning ? .15 : 0));
    for (const m of strips) m.emissive.copy(calm).lerp(alarm, mood);
    lamps.forEach(l => l.color.copy(calm).lerp(alarm, mood * .8));
    screen.material.emissive.set(warning || strength > 0 ? 0xff8a3d : 0x2fd3c0);
    const doseColor = st.stage === 'storm' ? (st.playerInShelter ? 0x3ee6b5 : 0xff5d73) : 0x2fd3c0;
    doseScreen.material.emissive.set(doseColor);
    // Slot guides: glow when the player carries a shield, red when the storm finds a gap.
    for (const id of SLOT_IDS) {
      const o = outlines[id], filled = !!st.slots[id];
      o.visible = !filled && st.phase === 'active' && st.stage !== 'plan';
      o.traverse(m => { if (m.isMesh) { m.material.emissive?.set(strength > 0 ? 0xff3a3a : 0xffc83a); m.material.emissiveIntensity = st.held ? 1 + Math.sin(t * 6) * .6 : .25; } });
    }
    for (const p of crewList) p.update(dt);
    player.speedScale = st.held ? st.scenario.materials[item(st, st.held).kind].walkSpeed : 1;
  });

  /** Bring the 3D view in line with the rules state, animating anything that just changed. */
  async function sync({animate = true} = {}) {
    const st = s();
    for (const it of st.items) {
      if (where[it.id] === it.at) continue;
      const m = models[it.id];
      if (!animate) { snap(it); continue; }
      where[it.id] = it.at;
      if (it.at === 'hand') world.hold(m, HOLD_POSE[it.kind]);
      else { const target = it.at === 'store' ? storeAnchors[it.id] : mounts[it.at]; world.place(m, target, {seconds: .6, arc: it.at.startsWith('roof') ? .8 : .3}); }
    }
    for (const id of CREW) {
      const at = st.crew[id].at === 'work' ? 'work' : 'shelter';
      if (crewShown[id] !== at) placeCrew(id, at, animate && st.crew[id].at === 'walking');
    }
  }
  sync({animate: false});

  const guideTargets = () => {
    const st = s(); if (st.phase !== 'active' || st.stage === 'plan') return null;
    if (st.stage === 'after') return console_;
    if (st.held) { const open = SLOT_IDS.filter(id => !st.slots[id]); const pick = open.find(id => id.startsWith('roof')) || open[0]; return pick ? outlines[pick] : null; }
    const called = CREW.find(id => st.crew[id].at === 'work');
    const filled = SLOT_IDS.filter(id => st.slots[id]).length, left = st.items.filter(i => i.at === 'store');
    const order = st.plan === 'fast' ? ['cargo', 'poly', 'water'] : st.plan === 'water' ? ['water', 'poly', 'cargo'] : ['poly', 'water', 'cargo'];
    const late = st.simSeconds > st.scenario.warningSeconds * .7;
    if (filled < 8 && left.length && !(late && called)) { for (const k of order) { const it = left.find(i => i.kind === k); if (it) return models[it.id]; } }
    if (called) return crew[called].model;
    if (!st.playerInShelter) return shelter;
    return null;
  };
  world.onFrame(() => world.guide(guideTargets(), .4));

  return {world, sync, inShelter() { const p = player.position; return p.x > INSIDE.minX && p.x < INSIDE.maxX && p.z > INSIDE.minZ && p.z < INSIDE.maxZ; },
    walkTargets: [{id: 'store-water', label: '💧 Water walls', x: 2.5, z: 3.2}, {id: 'store-cargo', label: '🎒 Supply bags', x: 4.6, z: -3.1}, {id: 'store-poly', label: '🧱 Plastic shields', x: 6.4, z: 0},
      {id: 'shelter', label: '🏠 Shelter', x: -4.2, z: -1.2}, {id: 'console', label: '📺 Storm screen', x: .6, z: -3.2}],
    walk(id) { const t = this.walkTargets.find(w => w.id === id); if (t) player.navigate({x: t.x, z: t.z}, {x: t.x, z: t.z - 1}); }};
}
