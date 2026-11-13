// 3D view of "Dust Busters": Horizon Base's airlock right after a moonwalk.
// Shut the outer hatch, pump in air, clean four pieces of dusty gear with a brush, a vacuum hose or the
// EDS plate, scrub the air through the filter (swapping it from the locker when full), then open the inner hatch.
import * as THREE from 'three';
import {createWorld, loadModel, part, setOpacity} from '../shared/engine.js';
import {missionAsset} from '../shared/assets.js';
import {makeCrew} from '../shared/crew.js';
import {ITEMS} from './state.js';
import {dirtyItems, safeToEnter, itemName} from './actions.js';

const GEAR_MODEL = {suit: 'moon-suit', helmet: 'eva-helmet', bag: 'tool-bag', boots: 'moon-boots'};
const DUST_NODE = {suit: ['dust_legs', 'dust_arms', 'dust_body'], helmet: ['dust_visor'], bag: ['dust_bag'], boots: ['dust_boots']};

function canvasScreen(mesh, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  mesh.material.map = tex; mesh.material.emissiveMap = tex; mesh.material.emissive?.set(0xffffff); mesh.material.emissiveIntensity = .95; mesh.material.color.set(0xffffff); mesh.material.needsUpdate = true;
  return {ctx, c, tex};
}

export async function createDustScene({container, getState, act, onPause}) {
  const s = () => getState(), sc0 = s().scenario;
  const world = await createWorld({container, preset: 'interior', bounds: {minX: -2.2, maxX: 2.2, minZ: -1.15, maxZ: 1.0}, start: {x: 1.7, z: .7, yaw: Math.atan2(4.1, 1.2)}, onPause});
  const {scene, player} = world;
  const load = id => loadModel(missionAsset(id));
  const [room, suit, helmet, bag, boots, brush, filterIn, spare1, spare2, amaraSuit, amara] = await Promise.all([
    ...['moon-airlock', 'moon-suit', 'eva-helmet', 'tool-bag', 'moon-boots', 'dust-brush', 'filter-cartridge', 'filter-cartridge', 'filter-cartridge'].map(load),
    makeCrew('amara', {suitMode: true}), makeCrew('amara')]);
  scene.add(room);
  player.cameraObjects = [room];
  const gear = {suit, helmet, bag, boots};

  // Lights: cool ceiling strips plus a warm lamp over the bench.
  for (const x of [-1.6, 0, 1.6]) { const l = new THREE.PointLight(0xdfe9ff, 1.25, 6, 1.6); l.position.set(x, 2.4, -.3); scene.add(l); }
  world.renderer.toneMappingExposure = .8; world.hemi.intensity = .3;
  const benchLamp = new THREE.SpotLight(0xffe2b8, 4, 5, .7, .5, 1.4); benchLamp.position.set(-.3, 2.5, .6); benchLamp.target.position.set(-.3, .9, 1.3); scene.add(benchLamp, benchLamp.target);
  world.key.intensity = .35;

  const outside = new THREE.Group();
  scene.background = new THREE.Color(0x02030a);

  // ---- named parts -----------------------------------------------------------------------------
  const outerDoor = part(room, 'outer_door'), outerWheel = part(room, 'outer_wheel'), innerDoor = part(room, 'inner_door'), innerWheel = part(room, 'inner_wheel');
  const fan = part(room, 'fan'), filterDoor = part(room, 'filter_door'), filterSlot = part(room, 'filter_slot'), lockerDoor = part(room, 'locker_door');
  const airLamp = part(room, 'air_lamp').getObjectByProperty('isMesh', true).material, cycleBtn = part(room, 'cycle_button');
  const edsGlow = part(room, 'eds_glow'), edsSlot = part(room, 'eds_slot'), edsSwitch = part(room, 'eds_switch'), vac = part(room, 'vac_unit'), nozzle = part(room, 'vac_nozzle'), brushHolder = part(room, 'brush_holder');
  const floorDust = part(room, 'floor_dust');
  const screen = canvasScreen(part(room, 'air_screen').getObjectByName('screen') || part(room, 'air_screen').getObjectByProperty('isMesh', true), 640, 380);
  const edsMats = []; edsGlow.traverse(o => { if (o.isMesh) edsMats.push(o.material); });
  const outerClosedRot = outerDoor.rotation.y, innerClosedRot = innerDoor.rotation.y;

  // Gear in its places (hooks, shelf, mat). Hidden until Amara takes it off.
  const homes = {
    suit: Object.assign(new THREE.Group(), {name: 'home_suit'}), helmet: Object.assign(new THREE.Group(), {name: 'home_helmet'}),
    bag: Object.assign(new THREE.Group(), {name: 'home_bag'}), boots: Object.assign(new THREE.Group(), {name: 'home_boots'}),
  };
  homes.suit.position.set(-1.4, 1.95, -1.38); homes.helmet.position.set(-.1, 1.14, -1.45); homes.bag.position.set(.9, 1.5, -1.38); homes.boots.position.set(1.7, .03, -1.0);
  for (const id of ITEMS) { scene.add(homes[id]); homes[id].add(gear[id]); }
  const dustMats = Object.fromEntries(ITEMS.map(id => { const list = []; for (const n of DUST_NODE[id]) part(gear[id], n).traverse(o => { if (o.isMesh) { o.material.transparent = true; o.material.depthWrite = false; list.push(o.material); } }); return [id, list]; }));
  const scratches = part(helmet, 'scratches');
  brushHolder.add(brush); brush.position.set(0, -.05, .1); brush.rotation.set(0, 0, 0);
  const brushHome = brush.parent;
  filterSlot.add(filterIn); filterIn.rotation.set(0, 0, 0);
  part(room, 'spare_filter_1').add(spare1); part(room, 'spare_filter_2').add(spare2);
  const spares = [spare2, spare1]; // the last one in the list is taken first
  const grime = f => f.getObjectByName('grime'); for (const f of [filterIn, spare1, spare2]) { const g = grime(f); if (g) g.visible = false; }
  const trash = new THREE.Group(); trash.position.set(2.0, .05, .7); scene.add(trash);
  let filterNow = filterIn;

  // Amara: in her suit before the air comes in, then in her undersuit.
  scene.add(amaraSuit.model, amara.model);
  amaraSuit.teleport(-1.6, .75, Math.PI / 2); amara.teleport(-1.75, .75, Math.PI * .6);

  // Hit boxes for small things.
  const hitMat = new THREE.MeshBasicMaterial({transparent: true, opacity: 0, depthWrite: false});
  const hit = (parent, size, pos = [0, 0, 0]) => { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(...size), hitMat); m.position.set(...pos); g.add(m); parent.add(g); return g; };
  const outerHit = hit(outerWheel, [.2, .5, .5]), innerHit = hit(innerWheel, [.2, .5, .5]);
  const cycleHit = hit(cycleBtn, [.3, .3, .12]), edsSwitchHit = hit(edsSwitch, [.2, .25, .12]);
  const brushHit = hit(brushHolder, [.34, .5, .2], [0, .1, .1]), nozzleHit = hit(vac, [.6, .5, .45], [0, .2, 0]);
  const filterHit = hit(filterDoor, [.55, .7, .12], [.25, 0, 0]), lockerHit = hit(lockerDoor, [.6, 1.5, .1], [.3, 0, 0]);
  const gearHit = {suit: hit(homes.suit, [.7, 1.6, .45], [0, -.8, 0]), helmet: hit(homes.helmet, [.4, .4, .4], [0, .18, 0]), bag: hit(homes.bag, [.48, .4, .3], [0, -.2, 0]), boots: hit(homes.boots, [.5, .3, .45], [0, .13, 0])};

  const signs = [['🚪 Outside hatch', -2.5, 2.42, 0], ['🚪 Inside hatch', 2.5, 2.42, 0], ['🧹 Cleaning bench', -.3, 1.62, 1.35], ['🌬️ Air filter', 2.05, 2.3, 1.35], ['🧰 Spare filters', 2.2, 1.85, -1.25]];
  for (const [t, x, y, z] of signs) { const sp = world.sign(t, {width: 1.05}); sp.position.set(x, y, z); scene.add(sp); }
  player.obstacles = [];

  // ---- interactions --------------------------------------------------------------------------------
  const hs = sc0.holdSeconds, active = () => s().phase === 'active' && !!s().plan;
  world.register({id: 'outer', object: outerHit, range: 2, holdSeconds: hs.wheel, enabled: () => active() && s().outer === 'open', label: () => 'Hold E: spin the wheel to shut the outside hatch',
    onHold: p => { outerWheel.rotation.x = p * 9; }, onUse: () => act({id: 'closeOuter'})});
  world.register({id: 'cycle', object: cycleHit, range: 2.2, enabled: () => active() && s().outer === 'closed',
    label: () => !s().pressurized ? 'Press: fill the airlock with air' : s().filterLoad >= s().scenario.filterCap ? 'Filter full! Swap it first' : `Press: clean the air (${Math.round(s().airDust)} dust)`,
    onUse: () => act({id: s().pressurized ? 'scrub' : 'pressurize'})});
  world.register({id: 'brush', object: brushHit, range: 2.1, enabled: () => active() && s().pressurized && (s().hand === null || s().hand === 'brush' || s().hand === 'nozzle'),
    label: () => s().hand === 'brush' ? 'Put the brush back' : 'Take the brush (fast, no power)', onUse: () => act(s().hand === 'brush' ? {id: 'putTool'} : {id: 'takeTool', payload: 'brush'})});
  world.register({id: 'nozzle', object: nozzleHit, range: 2.1, enabled: () => active() && s().pressurized && (s().hand === null || s().hand === 'brush' || s().hand === 'nozzle'),
    label: () => s().hand === 'nozzle' ? 'Put the vacuum hose back' : `Take the vacuum hose (${s().scenario.tools.vacuum.power} power each)`, onUse: () => act(s().hand === 'nozzle' ? {id: 'putTool'} : {id: 'takeTool', payload: 'nozzle'})});
  world.register({id: 'eds', object: edsSwitchHit, range: 2.1, enabled: () => active() && !!s().edsItem, label: () => `Flip the EDS switch (${s().scenario.tools.eds.power} power)`, onUse: () => act({id: 'edsZap'})});
  for (const id of ITEMS) world.register({id: `gear:${id}`, object: gearHit[id], range: 2.1,
    enabled: () => active() && s().pressurized && s().edsItem !== id && s().items[id].dust > .5 && s().hand !== 'filter',
    holdSeconds: () => s().hand === 'brush' ? hs.brush : s().hand === 'nozzle' ? hs.vacuum : 0,
    label: () => s().hand === 'brush' ? `Hold E: brush the ${itemName(s(), id)}` : s().hand === 'nozzle' ? `Hold E: vacuum the ${itemName(s(), id)}` : s().scenario.items[id].eds ? `Put the ${itemName(s(), id)} on the EDS plate` : `The ${itemName(s(), id)}: grab a tool to clean it`,
    onHold: p => { if (s().hand) puff(id, p); },
    onUse: () => act(s().hand ? {id: 'clean', payload: id} : {id: 'edsLoad', payload: id})});
  world.register({id: 'locker', object: lockerHit, range: 2.2, enabled: () => active() && (s().hand === 'filter' || (s().spares > 0 && s().hand === null)),
    label: () => s().hand === 'filter' ? 'Put the filter back in the locker' : `Take a new air filter (${s().spares} left)`, onUse: () => act(s().hand === 'filter' ? {id: 'putTool'} : {id: 'takeFilter'})});
  world.register({id: 'filter', object: filterHit, range: 2.2, holdSeconds: hs.filter, enabled: () => active() && s().hand === 'filter', label: () => 'Hold E: swap in the new filter', onUse: () => act({id: 'swapFilter'})});
  world.register({id: 'inner', object: innerHit, range: 2, holdSeconds: hs.wheel, enabled: () => active() && s().pressurized,
    label: () => safeToEnter(s()) ? 'Hold E: open the inside hatch' : 'Hold E: open the inside hatch (still dusty!)', onHold: p => { innerWheel.rotation.x = -p * 9; }, onUse: () => act({id: 'openInner'})});

  // ---- effects -----------------------------------------------------------------------------------------
  const tmp = new THREE.Vector3();
  const airborne = world.particles({count: 260, color: 0xb9b3a8, size: .03, opacity: .75, gravity: -.02, life: [3, 6], spawn(p, v) { p.set((Math.random() - .5) * 4.6, .2 + Math.random() * 2.2, (Math.random() - .5) * 2.8); v.set((Math.random() - .5) * .15, (Math.random() - .5) * .05, (Math.random() - .5) * .15); }});
  const brushPuff = world.particles({count: 90, color: 0xc9c2b6, size: .045, opacity: .8, gravity: -.08, life: [1, 2.2], spawn(p, v) { gearHit[puffItem].getWorldPosition(p); p.y += (puffItem === 'suit' ? -.6 : .1) + (Math.random() - .5) * .3; p.z += .25; v.set((Math.random() - .5) * .6, Math.random() * .4, .3 + Math.random() * .3); }});
  const suck = world.particles({count: 60, color: 0xc9c2b6, size: .03, opacity: .8, gravity: 0, life: [.25, .4], spawn(p, v) { gearHit[puffItem].getWorldPosition(p); p.y += (puffItem === 'suit' ? -.6 : .1) + (Math.random() - .5) * .3; p.z += .35; nozzle.getWorldPosition(tmp); v.copy(tmp).sub(p).multiplyScalar(3); }});
  const zap = world.particles({count: 80, color: 0xd9ccb0, size: .03, opacity: .9, gravity: -1.2, additive: false, life: [.4, .9], spawn(p, v) { edsSlot.getWorldPosition(p); p.x += (Math.random() - .5) * .5; p.z += (Math.random() - .5) * .3; p.y += .1; v.set((Math.random() - .5) * .8, .6 + Math.random() * .6, (Math.random() - .5) * .8); }});
  const intoFilter = world.particles({count: 120, color: 0xb9b3a8, size: .035, opacity: .8, gravity: 0, life: [.6, 1.2], spawn(p, v) { p.set((Math.random() - .5) * 3.6, .4 + Math.random() * 1.8, (Math.random() - .5) * 2.4); fan.getWorldPosition(tmp); v.copy(tmp).sub(p).multiplyScalar(1.1); }});
  const leakPuff = world.particles({count: 120, color: 0xc9c2b6, size: .05, opacity: .85, gravity: -.05, life: [1.2, 2.2], spawn(p, v) { innerDoor.getWorldPosition(p); p.x += .1; p.y = .5 + Math.random() * 1.6; p.z += .76 + (Math.random() - .5) * 1.2; v.set(.8 + Math.random() * .6, (Math.random() - .5) * .2, (Math.random() - .5) * .4); }});
  let puffItem = 'suit';
  function puff(id, p) { puffItem = id; if (s().hand === 'brush') brushPuff.rate = 60; else suck.rate = 70; brushTime = .2; }
  let brushTime = 0;

  // Vacuum hose: a sagging cable from the vacuum to the nozzle.
  let hose = null;
  const nozzleHome = nozzle.parent, nozzleHomePos = nozzle.position.clone(), nozzleHomeRot = nozzle.rotation.clone();

  // ---- state → view -------------------------------------------------------------------------------------
  let shownMission = null, shown = null;
  let syncQueue = Promise.resolve();
  const sync = opts => (syncQueue = syncQueue.then(() => doSync(opts)).catch(e => console.error(e)));
  function setHand(what, animate) {
    // Put back whatever is in the hand.
    if (world.held === brush && what !== 'brush') { if (animate) world.place(brush, brushHome, {seconds: .35}); else { brushHome.add(brush); } brush.position.set(0, -.05, .1); brush.rotation.set(0, 0, 0); brush.scale.setScalar(1); }
    if (world.held === nozzle && what !== 'nozzle') { world.release(); nozzleHome.add(nozzle); nozzle.position.copy(nozzleHomePos); nozzle.rotation.copy(nozzleHomeRot); nozzle.scale.setScalar(1); }
    if (what === 'brush' && world.held !== brush) world.hold(brush, {scale: 1.1, offset: [-.02, -.05, -.05], rotation: [-.9, .3, 0]});
    if (what === 'nozzle' && world.held !== nozzle) world.hold(nozzle, {scale: 1.4, offset: [-.05, -.02, -.1], rotation: [0, Math.PI / 2 + .3, .2]});
    if (what === 'nozzle' && !hose) hose = world.cable({from: v => vac.getWorldPosition(v).add(new THREE.Vector3(.2, .25, -.1)), to: v => nozzle.getWorldPosition(v), color: 0x2c3440, radius: .025, sag: .5});
    if (what !== 'nozzle' && hose) { hose.remove(); hose = null; }
  }
  function resetView() {
    world.release(); setHand(null, false);
    outerDoor.rotation.y = outerClosedRot + 1.6; innerDoor.rotation.y = innerClosedRot; outerWheel.rotation.x = 0; innerWheel.rotation.x = 0; outside.visible = true;
    for (const id of ITEMS) { homes[id].add(gear[id]); gear[id].position.set(0, 0, 0); gear[id].rotation.set(0, 0, 0); gear[id].scale.setScalar(1); gear[id].visible = false; }
    filterNow = filterIn; filterSlot.add(filterIn); filterIn.position.set(0, 0, 0); filterIn.rotation.set(0, 0, 0); filterIn.scale.setScalar(1); trash.clear();
    part(room, 'spare_filter_2').add(spare2); part(room, 'spare_filter_1').add(spare1); for (const f of [spare1, spare2]) { f.position.set(0, 0, 0); f.rotation.set(0, 0, 0); f.scale.setScalar(1); }
    spares.length = 0; spares.push(spare2, spare1); for (const f of [filterIn, spare1, spare2]) { const g = grime(f); if (g) g.visible = false; }
    filterDoor.rotation.y = 0; lockerDoor.rotation.y = 0; scratches.visible = false;
    amaraSuit.model.visible = true; amara.model.visible = false;
    shown = {outer: 'open', pressurized: false, hand: null, edsItem: null, swaps: 0, spares: s().scenario.spareFilters, leaks: 0, innerOpen: false, edsUses: 0};
  }
  async function doSync({animate = true} = {}) {
    const st = s();
    if (shownMission !== st) { shownMission = st; resetView(); animate = false; }
    if (st.swaps > shown.swaps && !animate) { // restored save: show used filters in the trash
      while (shown.swaps < st.swaps) { const f = spares.pop() || null; const old = filterNow, g = grime(old); if (g) g.visible = true; const spot = new THREE.Group(); spot.position.set(trash.children.length * .3, 0, 0); spot.rotation.z = Math.PI / 2; trash.add(spot); spot.add(old); old.position.set(0, 0, 0); if (f) { filterSlot.add(f); f.position.set(0, 0, 0); f.rotation.set(0, 0, 0); f.visible = true; filterNow = f; } shown.swaps++; }
    }
    // Spare filters that were already used (on restore) are not in the locker.
    while (spares.length > st.spares + (st.hand === 'filter' ? 1 : 0)) { const f = spares.pop(); f.visible = false; }
    if (shown.outer !== st.outer) {
      const from = outerDoor.rotation.y, to = st.outer === 'closed' ? outerClosedRot : outerClosedRot + 1.6;
      if (animate) await world.tween(.9, t => { outerDoor.rotation.y = from + (to - from) * t; }); else outerDoor.rotation.y = to;
      outside.visible = st.outer === 'open'; shown.outer = st.outer;
    }
    if (shown.pressurized !== st.pressurized) {
      shown.pressurized = st.pressurized;
      if (st.pressurized) {
        if (animate) await world.tween(1.6, t => { airLamp.color.setRGB(1, .2 + .8 * t, .2 * (1 - t)); }); // red → amber → green handled per frame after
        amaraSuit.model.visible = false; amara.model.visible = true;
        for (const id of ITEMS) { gear[id].visible = true; if (animate) { gear[id].scale.setScalar(.01); world.tween(.5, t => gear[id].scale.setScalar(.01 + .99 * t)); } }
      }
    }
    // Hand: brush, hose or a filter.
    if (shown.hand !== st.hand) {
      const prev = shown.hand; shown.hand = st.hand;
      if (prev === 'filter' && st.hand !== 'filter' && world.held && spares.includes(world.held) === false && world.held !== brush && world.held !== nozzle) {
        const f = world.held;
        if (st.swaps > shown.swaps) {
          // Swap: the old filter comes out dirty and goes in the trash, the new one slides into the slot.
          const old = filterNow, g = grime(old); if (g) g.visible = true;
          if (animate) await world.tween(.5, t => { filterDoor.rotation.y = -1.7 * t; });
          const spot = new THREE.Group(); spot.position.set((trash.children.length % 2) * .3, 0, Math.floor(trash.children.length / 2) * .3); spot.rotation.z = Math.PI / 2; trash.add(spot);
          if (animate) { await world.place(old, spot, {seconds: .45, arc: .3}); await world.place(f, filterSlot, {seconds: .45, arc: .1}); } else { spot.add(old); filterSlot.add(f); world.release(); }
          for (const o of [old, f]) { o.position.set(0, 0, 0); o.rotation.set(0, 0, 0); o.scale.setScalar(1); }
          filterNow = f; shown.swaps = st.swaps;
          if (animate) await world.tween(.4, t => { filterDoor.rotation.y = -1.7 * (1 - t); }); else filterDoor.rotation.y = 0;
        } else { // put back in the locker
          const slot = [part(room, 'spare_filter_1'), part(room, 'spare_filter_2')].find(n => !n.children.some(c => c.visible && c.isGroup)) || part(room, 'spare_filter_1');
          if (animate) await world.place(f, slot, {seconds: .4}); else { slot.add(f); world.release(); }
          f.position.set(0, 0, 0); f.rotation.set(0, 0, 0); f.scale.setScalar(1); spares.push(f);
        }
      }
      if (st.hand === 'filter') {
        const f = spares.pop();
        if (f) { if (animate) await world.tween(.35, t => { lockerDoor.rotation.y = 1.9 * t; }); f.visible = true; world.hold(f, {scale: .8, offset: [-.05, -.08, 0], rotation: [0, .4, 0]}); if (animate) world.tween(.35, t => { lockerDoor.rotation.y = 1.9 * (1 - t); }); }
      }
      setHand(st.hand === 'brush' || st.hand === 'nozzle' ? st.hand : null, animate);
    }
    // EDS plate: carry the item there; after the zap it goes home.
    if (shown.edsItem !== st.edsItem) {
      const prev = shown.edsItem; shown.edsItem = st.edsItem;
      if (prev) { if (animate) { zap.burst(70); edsZapGlow = 1.2; await world.tween(.9, () => {}); await world.place(gear[prev], homes[prev], {seconds: .5, arc: .25}); } else { homes[prev].add(gear[prev]); gear[prev].position.set(0, 0, 0); gear[prev].rotation.set(0, 0, 0); gear[prev].scale.setScalar(1); } }
      if (st.edsItem) { const g = gear[st.edsItem]; if (animate) await world.place(g, edsSlot, {seconds: .55, arc: .3}); else { edsSlot.add(g); g.position.set(0, 0, 0); } g.rotation.set(0, st.edsItem === 'helmet' ? Math.PI : 0, 0); g.scale.setScalar(st.edsItem === 'boots' ? .9 : 1); if (st.edsItem === 'bag') { g.position.y = .36; } }
    }
    if (shown.leaks !== st.leaks) { shown.leaks = st.leaks; if (animate) { leakPuff.burst(110); await world.tween(.6, t => { innerDoor.rotation.y = innerClosedRot - .5 * Math.sin(Math.PI * t); }); } }
    if (!shown.innerOpen && st.innerOpen) { shown.innerOpen = true; if (animate) await world.tween(1, t => { innerDoor.rotation.y = innerClosedRot - 1.6 * t; }); else innerDoor.rotation.y = innerClosedRot - 1.6; }
  }
  sync({animate: false});

  // ---- per frame: dust layers, air, lamps, screen ----------------------------------------------------
  let edsZapGlow = 0, screenClock = 0;
  world.onFrame((dt, t) => {
    const st = s(), sc = st.scenario;
    for (const id of ITEMS) { const f = Math.min(1, st.items[id].dust / sc.items[id].dust); for (const m of dustMats[id]) m.opacity = f * .95; for (const n of DUST_NODE[id]) part(gear[id], n).visible = f > .02; }
    scratches.visible = st.scratched;
    airborne.rate = st.airDust * 1.2; if (st.airDust < .5) airborne.rate = 0;
    if (brushTime > 0) brushTime -= dt; else { brushPuff.rate = 0; suck.rate = 0; }
    floorDust.visible = true; floorDust.traverse(o => { if (o.isMesh) { o.material.transparent = true; o.material.opacity = Math.min(.9, .25 + st.uses.brush * .08 + st.uses.eds * .1); } });
    // Fan spins while scrubbing (a short burst after each scrub).
    if (st.uses.scrub > (shown?.scrubs ?? 0)) { shown.scrubs = st.uses.scrub; scrubTime = 2.4; intoFilter.burst(110); }
    if (scrubTime > 0) { scrubTime -= dt; fan.rotation.y += dt * 25; } else fan.rotation.y += dt * (st.pressurized ? 1.5 : 0);
    intoFilter.rate = scrubTime > 0 ? 60 : 0;
    const lamp = !st.pressurized ? 0xff3a3a : st.airDust > sc.airSafe ? 0xffb02e : 0x2bff86;
    airLamp.color.set(lamp); airLamp.emissive?.set(lamp); airLamp.emissiveIntensity = !st.pressurized ? (Math.sin(t * 5) > 0 ? 2.2 : .4) : 1.8;
    edsZapGlow = Math.max(0, edsZapGlow - dt); for (const m of edsMats) { m.emissive?.set(0x6fd8ff); m.emissiveIntensity = .15 + edsZapGlow * 2 + (st.edsItem ? .3 + Math.sin(t * 6) * .2 : 0); }
    edsSwitch.rotation.x = st.edsItem ? -.4 : 0;
    amaraSuit.update(dt); amara.update(dt); amara.mode = st.airDust > sc.airSafe * 2 ? 'work' : st.phase === 'debrief' && st.innerOpen ? 'wave' : 'idle'; amara.face(player.position.x, player.position.z);
    screenClock += dt; if (screenClock > .3) { screenClock = 0; drawScreen(st); }
  });
  let scrubTime = 0;

  function drawScreen(st) {
    const {ctx, c, tex} = screen, W = c.width, H = c.height, sc = st.scenario;
    ctx.fillStyle = '#0a1a2c'; ctx.fillRect(0, 0, W, H); ctx.textBaseline = 'top'; ctx.textAlign = 'left';
    ctx.font = '700 34px Fredoka Variable, system-ui'; ctx.fillStyle = '#ffd23f'; ctx.fillText('AIRLOCK DUST CHECK', 24, 16);
    ctx.font = '600 26px Nunito Variable, system-ui'; ctx.fillStyle = '#cfe6ff';
    ctx.fillText(!st.pressurized ? '🔴 No air yet (vacuum)' : `🟢 Air in · ${st.outer === 'closed' ? 'outside hatch shut' : 'outside hatch OPEN'}`, 24, 62);
    const bar = (y, label, value, max, warn) => { ctx.fillStyle = '#cfe6ff'; ctx.fillText(label, 24, y); ctx.strokeStyle = '#cfe6ff'; ctx.lineWidth = 2; ctx.strokeRect(250, y + 2, 360, 26); const f = Math.max(0, Math.min(1, value / max)); ctx.fillStyle = f > warn ? '#ff6a6a' : '#2bff86'; ctx.fillRect(252, y + 4, 356 * f, 22); };
    bar(104, 'Dust in the air', st.airDust, 80, sc.airSafe / 80);
    bar(142, 'Filter full', st.filterLoad, sc.filterCap, .85);
    ITEMS.forEach((id, i) => { const d = st.items[id].dust, okk = d <= sc.cleanEnough; ctx.fillStyle = okk ? '#2bff86' : '#ffb02e'; ctx.fillText(`${okk ? '✔' : '✖'} ${itemName(st, id)}`, 24 + (i % 2) * 300, 190 + Math.floor(i / 2) * 36); });
    ctx.font = '700 28px Fredoka Variable, system-ui'; const safe = safeToEnter(st);
    ctx.fillStyle = safe ? '#2bff86' : '#ff8a8a'; ctx.fillText(safe ? '✅ Safe to open the inside hatch' : `⛔ Not safe yet${dirtyItems(st).length ? ' · gear dusty' : st.airDust > sc.airSafe ? ' · air dusty' : ''}`, 24, 276);
    ctx.font = '600 24px Nunito Variable, system-ui'; ctx.fillStyle = '#9fb7d6'; ctx.fillText(`⚡ Power ${st.power} · 🧰 Spare filters ${st.spares} · ⏱ ${st.minutes} min`, 24, 326);
    tex.needsUpdate = true;
  }

  // ---- guidance -----------------------------------------------------------------------------------------
  const guideTarget = () => {
    const st = s(); if (st.phase !== 'active' || !st.plan) return null;
    if (st.outer === 'open') return outerHit;
    if (!st.pressurized) return cycleHit;
    if (st.hand === 'filter') return filterHit;
    const sc = st.scenario, canVacuum = st.power >= sc.tools.vacuum.power;
    if (st.edsItem && st.power >= sc.tools.eds.power) return edsSwitchHit;
    const dirty = dirtyItems(st).filter(id => id !== st.edsItem);
    if (!dirty.length && st.edsItem) return innerHit;
    if (dirty.length) {
      if (st.hand === 'nozzle' && !canVacuum) return brushHit;
      if (st.hand) return gearHit[dirty[0]];
      if (st.plan === 'mix' && st.power >= sc.tools.eds.power) { const e = dirty.find(id => sc.items[id].eds); if (e) return gearHit[e]; }
      return st.plan !== 'brush' && canVacuum ? nozzleHit : brushHit;
    }
    if (st.airDust > sc.airSafe && st.power >= sc.scrub.power) {
      if (st.filterLoad < sc.filterCap) return cycleHit;
      if (st.spares) return st.hand ? (st.hand === 'nozzle' ? nozzleHit : brushHit) : lockerHit;
    }
    return innerHit;
  };
  world.onFrame(() => world.guide(guideTarget(), .25));

  const walkTargets = [
    {id: 'outer', label: '🚪 Outside hatch', x: -1.2, z: .1, look: {x: -1.95, z: -.8}},
    {id: 'gear', label: '🧑‍🚀 Gear wall', x: -.3, z: -.7, look: {x: -.3, z: -1.7}},
    {id: 'bench', label: '🧹 Bench', x: -.3, z: .55, look: {x: -.3, z: 1.6}},
    {id: 'air', label: '🌬️ Air button', x: 1.1, z: -.8, look: {x: 1.2, z: -1.7}},
    {id: 'filter', label: '🔧 Filter', x: 1.8, z: .5, look: {x: 2.0, z: 1.4}},
    {id: 'inner', label: '🚪 Inside hatch', x: 1.9, z: .2, look: {x: 2.8, z: 0}},
  ];
  return {world, sync, idle: () => syncQueue, walkTargets,
    walk(id) { const t = walkTargets.find(w => w.id === id); if (t) return player.navigate({x: t.x, z: t.z}, t.look); },
    teleport(x, z, lookX, lookZ, pitch = -.2) { player.position.set(x, 1.62, z); if (lookX !== undefined) player.yaw = Math.atan2(-(lookX - x), -(lookZ - z)); player.pitch = pitch; player.syncCamera(); },
  };
}
