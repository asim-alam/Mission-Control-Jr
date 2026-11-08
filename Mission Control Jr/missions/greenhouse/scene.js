// 3D view of "The Greenhouse Promise": grow beds with levers, valves and living plants.
import * as THREE from 'three';
import {createWorld, loadModel, part} from '../shared/engine.js';
import {missionAsset} from '../shared/assets.js';
import {makeCrew} from '../shared/crew.js';
import {BEDS} from './state.js';
import {isReady, isFull, moistureState} from './actions.js';

const BED_X = {a: -4.6, b: -1.1, c: 2.4}, BED_Z = -3.95;
const CROP_MODEL = {lettuce: 'lettuce-plant', mizuna: 'mizuna-plant', pepper: 'pepper-plant'};
const LIGHT_LEVEL = {off: 0, half: 1, full: 2};

export async function createGreenhouseScene({container, getState, act, onPause, onConsole}) {
  const world = await createWorld({container, preset: 'interior', bounds: {minX: -7.4, maxX: 7.4, minZ: -4.4, maxZ: 4.4}, start: {x: 6.3, z: .4, yaw: Math.PI / 2}, onPause});
  const {scene, player} = world, s = getState;
  const load = id => loadModel(missionAsset(id));
  const [hab, consoleM, tank, line, shelf, table, basket, spare, amara] = await Promise.all(['hab-greenhouse-interior', 'farm-console', 'greenhouse-water-tank', 'irrigation-line', 'tool-shelf', 'galley-table', 'harvest-basket', 'spare-hose'].map(load).concat([makeCrew('amara')]));
  scene.add(hab);
  world.place3d(consoleM, 5.7, 0, -4.1); world.place3d(tank, -6.7, 0, 3.9); world.place3d(line, -3, 0, 4.88, Math.PI);
  world.place3d(shelf, 1.3, 0, 4.85, Math.PI); world.place3d(table, 5, 0, 2.3, Math.PI / 2);
  for (const x of [-5, 0, 5]) { const l = new THREE.PointLight(0xfff0dc, 2.6, 9, 1.6); l.position.set(x, 3.6, 0); scene.add(l); }
  const ambientStrips = []; hab.traverse(o => { if (o.isMesh && o.material.name === 'light-strip') ambientStrips.push(o.material); });

  // Beds and plants.
  const beds = {};
  for (const id of BEDS) {
    const model = await load('grow-bed'); world.place3d(model, BED_X[id], 0, BED_Z);
    const glow = []; part(model, 'led_glow').traverse(o => { if (o.isMesh) glow.push(o.material); });
    const lamp = new THREE.PointLight(0xff5fa8, 0, 3.2, 1.8); lamp.position.set(BED_X[id], 1.55, BED_Z); scene.add(lamp);
    const plants = [];
    for (let i = 1; i <= 6; i++) {
      const p = await load(CROP_MODEL[s().scenario.crops[id].crop]); part(model, `plant_${i}`).add(p); p.position.y = .06;
      p.rotation.y = i * 1.3; const leafMats = []; p.traverse(o => { if (o.isMesh && /leaf|pepper-green/.test(o.material.name)) { leafMats.push({m: o.material, base: o.material.color.clone()}); } });
      plants.push({model: p, leaves: part(p, 'leaves'), fruit: p.getObjectByName('fruit'), flowers: p.getObjectByName('flowers'), leafMats});
    }
    const label = world.sign(`${s().scenario.crops[id].icon} ${s().scenario.crops[id].name}`, {width: 1.1}); label.position.set(BED_X[id], 2.05, BED_Z + .3); scene.add(label);
    beds[id] = {model, glow, lamp, plants, lever: part(model, 'light_lever'), valve: part(model, 'valve_wheel'), needle: part(model, 'moisture_needle'), spray: part(model, 'water_spray'), shown: {progress: s().beds[id].progress}};
  }
  // Amara tends the beds at the start.
  scene.add(amara.model); amara.teleport(-2.8, -2.6, Math.PI); amara.mode = 'work';
  const party = await Promise.all(['elena', 'jin', 'luca'].map(id => makeCrew(id)));
  party.forEach((p, i) => { scene.add(p.model); p.model.visible = false; p.teleport(4.2 + i * .8, 3.3, Math.PI); });

  // Water: tank level, leak drips and a puddle that grows.
  const level = part(tank, 'level'), leakPoint = part(line, 'leak_point'), hoseMount = part(line, 'hose_mount'), oldHose = part(line, 'hose_segment'), isoValve = part(line, 'isolation_valve');
  const puddle = new THREE.Mesh(new THREE.CircleGeometry(1, 28), new THREE.MeshStandardMaterial({color: 0x3aa6dc, roughness: .05, metalness: .2, transparent: true, opacity: .55}));
  puddle.rotation.x = -Math.PI / 2; puddle.position.set(-2.85, .012, 4.35); puddle.scale.setScalar(.01); scene.add(puddle);
  const leakWorld = new THREE.Vector3();
  const drips = world.particles({count: 60, color: 0x7fd3ff, size: .05, gravity: -9, life: [.4, .6], spawn(p, v) { leakPoint.getWorldPosition(leakWorld); p.copy(leakWorld).add(new THREE.Vector3((Math.random() - .5) * .1, 0, 0)); v.set((Math.random() - .5) * .3, -.5, -.6 - Math.random() * .4); }});
  const sprayWorld = new THREE.Vector3(); let sprayBed = null, sprayTime = 0;
  const spray = world.particles({count: 120, color: 0x9be4ff, size: .04, gravity: -6, life: [.3, .5], spawn(p, v) { beds[sprayBed || 'a'].spray.getWorldPosition(sprayWorld); p.copy(sprayWorld).add(new THREE.Vector3((Math.random() - .5) * 1.3, 0, (Math.random() - .5) * .5)); v.set(0, -.8, 0); }});
  const sparkle = world.particles({count: 80, color: 0xfff1a8, size: .06, additive: true, gravity: .3, life: [.6, 1], spawn(p, v) {
    const ready = BEDS.filter(id => isReady(s(), id)); if (!ready.length) { p.set(0, -99, 0); return; }
    const id = ready[Math.floor(Math.random() * ready.length)]; p.set(BED_X[id] + (Math.random() - .5) * 1.4, 1.0 + Math.random() * .3, BED_Z + (Math.random() - .5) * .6); v.set(0, .2, 0); }});
  // Spare hose: lives on the shelf, in the hand, or on the line.
  const shelfHook = part(shelf, 'hose_hook'); shelfHook.add(spare); spare.rotation.y = Math.PI;
  // Basket: on the table or in the hand. Harvested plants go into it.
  const tableSpot = new THREE.Group(); tableSpot.position.set(0, .81, -.45); table.add(tableSpot); tableSpot.add(basket);
  const contents = part(basket, 'contents'), bowl = part(table, 'bowl_contents');

  player.obstacles = [
    ...BEDS.map(id => ({minX: BED_X[id] - .95, maxX: BED_X[id] + .95, minZ: BED_Z - .5, maxZ: BED_Z + .5})),
    {minX: 5.15, maxX: 6.25, minZ: -4.4, maxZ: -3.8}, {minX: -7.2, maxX: -6.2, minZ: 3.4, maxZ: 4.4}, {minX: 4.5, maxX: 5.5, minZ: 1.5, maxZ: 3.1},
    {minX: .6, maxX: 2, minZ: 4.6, maxZ: 5},
  ];

  // ---- interactions --------------------------------------------------------------------
  const playing = () => s().phase === 'active' && !!s().plan;
  const name = id => s().scenario.crops[id].name;
  const next = {off: 'half', half: 'full', full: 'off'};
  for (const id of BEDS) {
    const b = beds[id];
    world.register({id: `lever:${id}`, object: b.lever, range: 2.2, enabled: () => playing() && !s().beds[id].harvested,
      label: () => `Light: ${s().beds[id].light.toUpperCase()} → switch to ${next[s().beds[id].light].toUpperCase()}`, onUse: () => act({id: 'setLight', targetId: id, payload: next[s().beds[id].light]})});
    world.register({id: `valve:${id}`, object: b.valve, range: 2.2, enabled: () => playing() && !s().beds[id].harvested,
      label: () => `Turn the valve: water the ${name(id).toLowerCase()} (soil is ${moistureState(s(), id)})`, onUse: () => { const r = act({id: 'water', targetId: id}); if (r.ok) { sprayBed = id; sprayTime = 1.2; world.tween(.8, t => { b.valve.rotation.z = -t * Math.PI; }); } }});
    // An invisible box over the plants, so aiming at leaves (not the lever or valve) picks the crop.
    const hit = new THREE.Mesh(new THREE.BoxGeometry(1.6, .55, .75), new THREE.MeshBasicMaterial({transparent: true, opacity: 0, depthWrite: false}));
    hit.position.set(0, 1.08, 0); b.model.add(hit);
    world.register({id: `plants:${id}`, object: hit, range: 2.3, enabled: () => playing() && !s().beds[id].harvested,
      label: () => isReady(s(), id) ? (s().holding === 'basket' ? `Pick the ${name(id).toLowerCase()}` : `${name(id)} is ready! Get the basket`) : `Look at the ${name(id).toLowerCase()}`,
      onUse: () => {
        if (isReady(s(), id)) { act({id: 'harvest', targetId: id}); return; }
        const bed = s().beds[id], pct = Math.round(bed.progress / s().scenario.crops[id].ready * 100);
        world.onInspect?.(`${s().scenario.crops[id].icon} ${name(id)}: ${pct}% grown · soil ${moistureState(s(), id)} · ${bed.stress > .25 ? 'looking droopy' : 'looking happy'}`);
      }});
  }
  world.register({id: 'iso', object: isoValve, range: 2.4, holdSeconds: 1.2, enabled: () => playing(),
    label: () => s().isolationOpen ? 'Close the red valve (stops the water)' : 'Open the red valve', onUse: () => { const was = s().isolationOpen; const r = act({id: 'toggleIsolation'}); if (r.ok) world.tween(.6, t => { isoValve.rotation.z = (was ? t : 1 - t) * Math.PI * 1.5; }); }});
  world.register({id: 'oldhose', object: oldHose, range: 2.4, enabled: () => playing() && (s().leak === 'leaking' || s().leak === 'isolated'),
    label: () => 'Unclip the leaking hose', onUse: () => act({id: 'removeHose'})});
  world.register({id: 'mount', object: hoseMount, range: 2.4, holdSeconds: 1.5, enabled: () => playing() && s().leak === 'hose-off' && s().holding === 'hose',
    label: () => 'Fit the new hose and tighten the clamps', onUse: () => act({id: 'fitHose'})});
  world.register({id: 'spare', object: spare, range: 2.4, enabled: () => playing() && s().leak === 'hose-off' && !s().holding, label: () => 'Take the spare hose', onUse: () => act({id: 'takeSpare'})});
  world.register({id: 'basket', object: basket, range: 2.4, enabled: () => playing() && s().basket === 'table' && !s().holding, label: () => 'Pick up the harvest basket', onUse: () => act({id: 'takeBasket'})});
  world.register({id: 'table', object: table, range: 2.4, enabled: () => playing() && s().holding === 'basket', label: () => s().day > s().scenario.growDays ? 'Serve dinner!' : 'Put the basket down', onUse: () => act({id: 'serve'})});
  world.register({id: 'console', object: consoleM, range: 2.4, enabled: () => playing(), label: () => s().day > s().scenario.growDays ? 'Check the greenhouse screen' : 'Plan power and end the day', onUse: onConsole});

  // ---- per-frame look --------------------------------------------------------------------
  const pink = new THREE.Color(0xff2a5a), night = new THREE.Color(0x4c5cff), day = new THREE.Color(0xfff1d6);
  let nightAmount = 0;
  world.onFrame((dt, t) => {
    const st = s();
    for (const id of BEDS) {
      const b = beds[id], bed = st.beds[id], lvl = LIGHT_LEVEL[bed.harvested ? 'off' : bed.light];
      for (const m of b.glow) m.emissiveIntensity += ((lvl ? .9 + lvl * .7 : 0) - m.emissiveIntensity) * Math.min(1, dt * 6);
      b.lamp.intensity += ((lvl * 2.2) - b.lamp.intensity) * Math.min(1, dt * 6);
      b.lever.rotation.z += ((1 - lvl) * .6 - b.lever.rotation.z) * Math.min(1, dt * 8);
      b.needle.rotation.z += ((1.2 - Math.min(4.5, bed.moisture) / 4.5 * 2.4) - b.needle.rotation.z) * Math.min(1, dt * 4);
      b.shown.progress += (bed.progress - b.shown.progress) * Math.min(1, dt * 1.5);
      const crop = st.scenario.crops[id], grown = Math.min(1.15, b.shown.progress / crop.ready);
      const mood = moistureState(st, id), droop = bed.stress * .9 + (mood === 'dry' ? .25 : 0);
      for (const p of b.plants) {
        p.model.visible = !bed.harvested;
        p.model.scale.setScalar(crop.crop === 'pepper' ? .9 + grown * 1.4 : .5 + grown * 1.1);
        p.leaves.rotation.x = Math.sin(t * 1.3 + p.model.rotation.y) * .03 + droop * .3;
        p.leaves.position.y = -droop * .02;
        for (const {m, base} of p.leafMats) m.color.copy(base).lerp(new THREE.Color(mood === 'soggy' ? 0xc9b84a : 0x8a6a3a), Math.min(.75, bed.stress));
        if (p.fruit) { p.fruit.visible = b.shown.progress >= crop.ready * st.scenario.babyHarvest; p.fruit.traverse(o => { if (o.isMesh) o.material.color.set(isFull(st, id) ? 0xe2382b : 0x5aa83a); }); }
        if (p.flowers) p.flowers.visible = !p.fruit?.visible;
      }
    }
    level.scale.y = Math.max(.02, st.tankL / st.scenario.tankStartL);
    const leaking = st.leak === 'leaking';
    drips.rate = leaking ? 40 : st.leak === 'isolated' ? 4 : 0;
    const puddleSize = Math.min(1.6, .2 + st.leakedL * .12 + (leaking ? .25 : 0));
    puddle.scale.setScalar(st.leak === 'none' ? .01 : puddleSize); puddle.visible = st.leak !== 'none';
    oldHose.visible = st.leak === 'none' || st.leak === 'leaking' || st.leak === 'isolated';
    const holdingHose = st.holding === 'hose', fitted = st.leak === 'hose-fitted' || (st.leak === 'fixed' && spare.parent !== shelfHook);
    if (holdingHose && spare.parent !== world.hand) { world.hand.add(spare); spare.position.set(-.05, -.05, 0); spare.rotation.set(0, .5, .2); spare.scale.setScalar(.6); }
    if (fitted && spare.parent !== hoseMount) { hoseMount.add(spare); spare.position.set(0, -.04, 0); spare.rotation.set(0, 0, 0); spare.scale.setScalar(1); }
    if (!holdingHose && !fitted && spare.parent !== shelfHook) { shelfHook.add(spare); spare.position.set(0, 0, 0); spare.rotation.set(0, Math.PI, 0); spare.scale.setScalar(1); }
    const basketInHand = st.holding === 'basket';
    if (basketInHand && basket.parent !== world.hand) { world.hand.add(basket); basket.position.set(-.1, -.12, 0); basket.rotation.set(0, 0, 0); basket.scale.setScalar(.75); }
    if (!basketInHand && basket.parent !== tableSpot) { tableSpot.add(basket); basket.position.set(0, 0, 0); basket.scale.setScalar(1); }
    while (contents.children.length < st.basketContents.length) { const c = st.basketContents[contents.children.length]; loadModel(missionAsset(CROP_MODEL[c.crop])).then(m => { m.scale.setScalar(.9); m.position.set((contents.children.length % 2 - .5) * .14, 0, 0); contents.add(m); }); break; }
    if (st.served && !bowl.children.length && contents.children.length) { for (const c of [...contents.children]) bowl.add(c); }
    if (sprayTime > 0) { sprayTime -= dt; spray.rate = 120; } else spray.rate = 0;
    sparkle.rate = st.phase === 'active' && BEDS.some(id => isReady(st, id)) ? 30 : 0;
    for (const m of ambientStrips) m.emissive.copy(day).lerp(night, nightAmount);
    amara.update(dt); party.forEach(p => p.update(dt));
  });

  async function nightfall() {
    await world.tween(1.2, t => { nightAmount = t; });
    await new Promise(r => setTimeout(r, 900));
    await world.tween(1.2, t => { nightAmount = 1 - t; });
  }
  function celebrate() {
    const spots = [[6.25, 1.35], [6.25, 3.25], [5.5, 3.95]];
    party.forEach((p, i) => { p.model.visible = true; p.teleport(spots[i][0], spots[i][1]); p.face(2, 2.3); p.mode = 'wave'; });
    amara.teleport(6.3, 2.3); amara.face(2, 2.3); amara.mode = 'wave';
    player.position.set(2, 1.62, 2.3); player.yaw = -Math.PI / 2; player.pitch = -.15; player.syncCamera();
  }

  const guideTarget = () => {
    const st = s(); if (st.phase !== 'active' || !st.plan) return null;
    if (st.holding === 'hose') return hoseMount;
    if (st.leak === 'leaking' || st.leak === 'hose-fitted') return isoValve;
    if (st.leak === 'isolated') return oldHose;
    if (st.leak === 'hose-off') return spare;
    if (st.day > st.scenario.growDays) { const ready = BEDS.find(id => isReady(st, id)); if (st.holding !== 'basket') return basket; return ready ? beds[ready].plants[0].model : table; }
    const dry = BEDS.find(id => !st.beds[id].harvested && st.beds[id].light !== 'off' && moistureState(st, id) === 'dry');
    return dry ? beds[dry].valve : consoleM;
  };
  world.onFrame(() => world.guide(guideTarget(), .3));

  return {world, nightfall, celebrate,
    walkTargets: [{id: 'a', label: '🥬 Lettuce bed', x: BED_X.a, z: -2.6}, {id: 'b', label: '🌿 Mizuna bed', x: BED_X.b, z: -2.6}, {id: 'c', label: '🌶️ Pepper bed', x: BED_X.c, z: -2.6},
      {id: 'line', label: '🚰 Water pipe', x: -3, z: 3.4}, {id: 'shelf', label: '🧰 Tool shelf', x: 1.3, z: 3.5}, {id: 'table', label: '🍽️ Table', x: 3.6, z: 2.3}, {id: 'console', label: '📺 Console', x: 5.7, z: -2.7}],
    walk(id) { const t = this.walkTargets.find(w => w.id === id); if (t) player.navigate({x: t.x, z: t.z}, {x: t.x, z: t.z + (t.z < 0 ? -1 : 1)}); }};
}
