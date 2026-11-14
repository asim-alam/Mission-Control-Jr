// 3D view of "A Place to Hide" (v3): a Mars habitat with a partly prepared refuge.
// Water goes into a rack, plastic panels slide into rails and get fastened, supply bags are stacked and strapped.
import * as THREE from 'three';
import {createWorld, loadModel, part, setOpacity, relativeNavigation} from '../shared/engine.js';
import {missionAsset} from '../shared/assets.js';
import {makeCrew} from '../shared/crew.js';
import {isBlocked, planRoute} from '../../navigation.js';
import {CREW, PEOPLE, SEAT_IDS} from './state.js';
import {item, rackWater, railPanels, zoneBags, getShelterTask, surfaceTransmission, seatTransmission} from './actions.js';

const R0 = {x: -4.6, z: -1.6};                    // refuge origin in the habitat
const W = (x, z) => [R0.x + x, R0.z + z];
const WORK = {elena: [-1.4, -2.6, Math.PI], amara: [-6.6, 2.9, -Math.PI / 2], jin: [2.6, 1.6, .6], luca: [6.2, 2.6, Math.PI / 2]};
const HOLD = {water: {scale: .7, offset: [-.1, -.28, 0], rotation: [0, -.3, 0]}, poly: {scale: .5, offset: [-.1, -.35, -.1], rotation: [0, -.2, 0]}, bag: {scale: .7, offset: [-.1, -.3, 0], rotation: [0, -.4, 0]}};
const RAILS = ['roof_l', 'roof_r', 'back_l', 'back_r'], ZONES = ['shelf_l', 'shelf_r', 'stack_side', 'stack_back', 'stack_door'], RACKS = ['back_l', 'back_r', 'side_l'];

export async function createShelterScene({container, getState, act, onPause, onTablet, onCheck, onElena}) {
  const world = await createWorld({container, preset: 'interior', bounds: {minX: -7.4, maxX: 7.4, minZ: -4.4, maxZ: 4.4}, start: {x: 4.8, z: .6, yaw: Math.PI / 2}, onPause});
  const {scene, player} = world;
  const s = () => getState();
  const st0 = s();
  const [hab, refuge, console_, shelf, rack, trolley, duct, ...crewList] = await Promise.all([
    loadModel(missionAsset('hab-quarters-interior')), loadModel(missionAsset('refuge-v3')), loadModel(missionAsset('space-weather-console')),
    loadModel(missionAsset('stowage-rack')), loadModel(missionAsset('water-rack')), loadModel(missionAsset('water-trolley')), loadModel(missionAsset('vent-duct')),
    ...CREW.map(id => makeCrew(id))]);
  scene.add(hab);
  player.cameraObjects = [hab, refuge, console_, shelf, trolley];
  world.place3d(refuge, R0.x, 0, R0.z);
  world.place3d(console_, .6, 0, -4.45);
  world.place3d(shelf, 4.2, 0, -3.95);
  world.place3d(trolley, 1.6, 0, 3.2);
  const lamps = [];
  for (const x of [-5, 0, 5]) { const l = new THREE.PointLight(0xfff0dc, 3, 9, 1.6); l.position.set(x, 3.6, 0); scene.add(l); lamps.push(l); }
  const refugeLamp = new THREE.PointLight(0xffe2b0, 2.2, 5, 2); refugeLamp.position.set(R0.x, 2, R0.z); scene.add(refugeLamp);
  world.key.position.set(2, 9, 3); world.key.target.position.set(-2, 0, -1);

  // Items.
  const kindAsset = {water: 'water-container', poly: 'shield-panel', bag: 'supply-bag'};
  const models = {};
  for (const it of st0.items) { models[it.id] = await loadModel(missionAsset(kindAsset[it.kind])); models[it.id].name = it.id; }
  const anchor = (x, y, z, yaw = 0) => { const a = new THREE.Group(); a.position.set(x, y, z); a.rotation.y = yaw; scene.add(a); return a; };
  const stores = {}, floorSpots = {};
  st0.items.forEach(it => {
    const n = +it.id.split('-')[1] - 1;
    if (it.kind === 'water') stores[it.id] = anchor(-.4 + (n % 3) * .58, n < 3 ? 0 : .55, 3.95, Math.PI);
    else if (it.kind === 'poly') stores[it.id] = anchor(6.95, 0, -2.1 + n * 1.35, -Math.PI / 2);
    else stores[it.id] = anchor(3.75 + (n % 2) * .85, [.11, .81, 1.51][Math.floor(n / 2)], -3.95);
    const [fx, fz] = W(-1.2 + (n % 4) * .7, .3 + Math.floor(n / 4) * .3); floorSpots[it.id] = anchor(fx, .12, fz, n);
  });
  const rails = Object.fromEntries(RAILS.map(r => [r, [part(refuge, `rail_${r}_1`), part(refuge, `rail_${r}_2`)]]));
  const zones = Object.fromEntries(ZONES.map(z => [z, part(refuge, `zone_${z}`)]));
  const straps = Object.fromEntries(ZONES.map(z => [z, part(refuge, `strap_${z}`)]));
  const mounts = Object.fromEntries(RACKS.map(r => [r, part(refuge, `rack_${r}`)]));
  const rackSpots = [1, 2, 3, 4, 5, 6].map(i => part(rack, `spot_${i}`)), latch = part(rack, 'latch_bar');
  const carts = [1, 2, 3, 4, 5, 6].map(i => part(trolley, `cart_${i}`));
  const zoneSlot = {};
  for (const z of ZONES) {
    const shelfZone = z.startsWith('shelf');
    zoneSlot[z] = [0, 1, 2].map(k => { const a = new THREE.Group(); if (shelfZone) a.position.set(0, k === 2 ? .33 : 0, [-.55, -.05, -.3][k]); else a.position.set(0, .135 + k * .33, 0); a.rotation.y = shelfZone ? Math.PI / 2 : 0; zones[z].add(a); return a; });
  }
  rack.visible = false; duct.visible = false;
  const vent = part(refuge, 'vent'), ventFan = part(refuge, 'vent_fan');
  vent.add(duct); duct.rotation.y = -Math.PI / 2; duct.position.set(0, -.38, .05);

  function anchorFor(st, it) {
    if (it.at === 'store') return stores[it.id];
    if (it.at === 'trolley') return carts[st.items.filter(i => i.kind === 'water').indexOf(it)];
    if (it.at === 'rack') return rackSpots[rackWater(st).indexOf(it)];
    if (it.at === 'floor') return floorSpots[it.id];
    if (it.at.startsWith('rail:')) { const r = it.at.slice(5); return rails[r][railPanels(st, r).indexOf(it)]; }
    if (it.at.startsWith('zone:')) { const z = it.at.slice(5); return zoneSlot[z][zoneBags(st, z).indexOf(it)]; }
    return null;
  }
  const keyOf = (st, it) => it.at === 'hand' ? 'hand' : `${it.at}#${anchorFor(st, it)?.uuid}`;
  const where = {};
  function snap(st, it) {
    const m = models[it.id];
    if (it.at === 'hand') { world.hand.add(m); const p = HOLD[it.kind]; m.position.set(...p.offset); m.rotation.set(...p.rotation); m.scale.setScalar(p.scale); }
    else { anchorFor(st, it).add(m); m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); m.scale.setScalar(1); if (it.at === 'floor') m.rotation.set(.3, 0, .4); }
    where[it.id] = keyOf(st, it);
  }

  // Crew.
  const crew = Object.fromEntries(crewList.map(p => [p.id, p]));
  const seatNodes = Object.fromEntries(SEAT_IDS.map(id => [id, part(refuge, `seat_${id}`)]));
  const seatWorld = id => { const v = new THREE.Vector3(); seatNodes[id].getWorldPosition(v); return v; };
  const crewShown = {};
  for (const id of CREW) { scene.add(crew[id].model); const [x, z, yaw] = WORK[id]; crew[id].teleport(x, z, yaw); crew[id].mode = 'work'; crewShown[id] = 'work'; }
  const door = {x: R0.x, z: R0.z + 1.9};
  const obstacles = [
    {minX: R0.x - 1.9, maxX: R0.x - 1.7, minZ: R0.z - 1.5, maxZ: R0.z + 1.5}, {minX: R0.x + 1.66, maxX: R0.x + 1.9, minZ: R0.z - 1.5, maxZ: R0.z + 1.5},
    {minX: R0.x - 1.9, maxX: R0.x + 1.9, minZ: R0.z - 1.5, maxZ: R0.z - 1.33},
    {minX: R0.x - 1.85, maxX: R0.x - .75, minZ: R0.z + 1.05, maxZ: R0.z + 1.45}, {minX: R0.x + .75, maxX: R0.x + 1.85, minZ: R0.z + 1.05, maxZ: R0.z + 1.45},
    {minX: .05, maxX: 1.15, minZ: -4.8, maxZ: -4.05}, {minX: 3.0, maxX: 5.4, minZ: -4.5, maxZ: -3.55}, {minX: -1, maxX: 1.3, minZ: 3.65, maxZ: 5},
    {minX: .75, maxX: 2.45, minZ: 2.8, maxZ: 3.6},
  ];
  const trolleyObstacle = obstacles.at(-1);
  player.obstacles = obstacles;
  const bounds = {minX: -7.6, maxX: 7.6, minZ: -4.6, maxZ: 4.6};
  function sendToSeat(id, animate) {
    const p = crew[id], seat = seatWorld(s().seats[id]);
    if (!animate) { p.teleport(seat.x, seat.z + .05, 0); p.mode = 'sit'; crewShown[id] = `seat:${s().seats[id]}`; return; }
    crewShown[id] = `seat:${s().seats[id]}`;
    const route = planRoute(p.model.position, door, obstacles, bounds);
    p.mode = 'wave'; setTimeout(() => p.walkRoute([...route, {x: door.x, z: R0.z + .9}, {x: seat.x, z: seat.z + .05}], () => { p.model.rotation.y = 0; p.mode = 'sit'; }), 400);
  }

  // Elena's help, shown in 3D.
  const trolleyHome = trolley.position.clone(), trolleyAtRefuge = new THREE.Vector3(R0.x + 1.1, 0, R0.z + 2.6);
  let assistShown = null;
  function showAssist(animate) {
    const a = s().assist; if (a === assistShown) return; assistShown = a;
    const elena = crew.elena;
    if (a === 'trolley') {
      if (!animate) { trolley.position.copy(trolleyAtRefuge); elena.teleport(trolleyAtRefuge.x + .9, trolleyAtRefuge.z, -Math.PI / 2); elena.mode = 'work'; return; }
      elena.walkTo(trolleyHome.x + 1, trolleyHome.z, () => {
        elena.mode = 'work'; const from = trolley.position.clone();
        world.tween(4, t => { trolley.position.lerpVectors(from, trolleyAtRefuge, t); elena.model.position.set(trolley.position.x + .9, 0, trolley.position.z); elena.face(trolleyAtRefuge.x, trolleyAtRefuge.z); elena.mode = t < 1 ? 'walk' : 'work'; });
      });
    }
    if (a === 'airflow') {
      const v = new THREE.Vector3(); vent.getWorldPosition(v);
      const fit = () => { elena.model.position.set(v.x + .7, 0, v.z); elena.model.rotation.y = -Math.PI / 2; elena.mode = 'work'; duct.visible = true; duct.scale.set(1, .01, 1); world.tween(2.4, t => duct.scale.set(1, Math.max(.01, t), 1)); };
      if (!animate) { fit(); duct.scale.set(1, 1, 1); return; }
      elena.walkRoute([...planRoute(elena.model.position, door, obstacles, bounds), {x: door.x, z: R0.z + .9}, {x: v.x + .7, z: v.z}], fit);
    }
  }

  // ---- interactions --------------------------------------------------------------------------
  const targets = new Map();
  function register(spec) {
    targets.set(spec.id, spec);
    world.register(spec);
  }
  const prep = () => s().phase === 'active' && s().stage === 'prep';
  const held = () => s().held && item(s(), s().held);
  const name = it => ({water: 'water container', poly: 'plastic panel', bag: 'supply bag'})[it.kind];
  for (const it of st0.items) {
    register({id: `item:${it.id}`, object: models[it.id], range: 2.4,
      enabled: () => prep() && !s().held && !['hand', 'floor'].includes(item(s(), it.id).at),
      holdSeconds: () => { const i = item(s(), it.id); return i.kind === 'poly' && i.at.startsWith('rail:') && !i.fastened ? 1.1 : 0; },
      label: () => { const i = item(s(), it.id); if (i.kind === 'poly' && i.at.startsWith('rail:') && !i.fastened) return 'Fasten the panel (turn both knobs)'; return ['store', 'trolley'].includes(i.at) ? `Pick up a ${name(i)}` : `Take out the ${name(i)} (2 min)`; },
      onUse: () => { const i = item(s(), it.id); act(i.kind === 'poly' && i.at.startsWith('rail:') && !i.fastened ? {id: 'fastenPanel', targetId: it.id} : {id: 'pickUp', targetId: it.id}); }});
  }
  const hitPlane = (w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide})); return m; };
  for (const r of RACKS) {
    const hit = hitPlane(1.3, 1.9); hit.position.set(0, .95, .2); mounts[r].add(hit);
    register({id: `mount:${r}`, object: hit, range: 2.6, enabled: () => prep() && !s().rack.built && !s().held, holdSeconds: 1.5,
      label: () => `Bolt the water rack frame here (${s().scenario.water.minutes.frame} min)`, onUse: () => act({id: 'buildRack', payload: r})});
  }
  register({id: 'rack', object: rack, range: 2.6, enabled: () => prep() && s().rack.built && ((held()?.kind === 'water') || (!s().held && rackWater(s()).length && !s().rack.latched)),
    holdSeconds: () => s().held ? 0 : 1.2,
    label: () => s().held ? `Load the water into the rack (${item(s(), s().held).from === 'trolley' ? s().scenario.water.minutes.loadTrolley : s().scenario.water.minutes.load} min)` : `Latch the rack bars (${s().scenario.water.minutes.latch} min)`,
    onUse: () => act({id: s().held ? 'loadRack' : 'latchRack'})});
  for (const r of RAILS) {
    const roof = r.startsWith('roof'), hit = hitPlane(1.3, roof ? 2.5 : 2.1);
    if (roof) { hit.rotation.x = -Math.PI / 2; } else hit.position.set(0, 1.05, .08);
    part(refuge, `rail_${r}`).add(hit);
    register({id: `rail:${r}`, object: hit, range: roof ? 3.2 : 2.6, enabled: () => prep() && held()?.kind === 'poly' && railPanels(s(), r).length < 2, holdSeconds: 1,
      label: () => `Slide the panel into the ${s().scenario.surfaces[r].label.toLowerCase()} rails`, onUse: () => act({id: 'slidePanel', targetId: r})});
  }
  for (const z of ZONES) {
    const shelfZone = z.startsWith('shelf'), hit = hitPlane(1, shelfZone ? .6 : 1.2); hit.position.set(0, shelfZone ? .2 : .6, shelfZone ? .2 : .3); zones[z].add(hit);
    register({id: `zone:${z}`, object: hit, range: shelfZone ? 3 : 2.5,
      enabled: () => prep() && ((held()?.kind === 'bag' && zoneBags(s(), z).length < 3) || (!s().held && zoneBags(s(), z).length && !s().zones[z].strapped)),
      holdSeconds: () => s().held ? (shelfZone ? .8 : 0) : 1.2,
      label: () => s().held ? `Stack the bag on the ${s().scenario.bags.zones[z].label}` : `Strap the stack down (${s().scenario.bags.minutes.strap} min)`,
      onUse: () => act(s().held ? {id: 'placeBag', targetId: z} : {id: 'strapZone', targetId: z})});
  }
  register({id: 'elena', object: crew.elena.model, range: 2.6, enabled: () => prep() && !s().assist, label: () => 'Ask Elena to help', onUse: onElena});
  register({id: 'tablet', object: console_, range: 2.6, enabled: () => s().phase === 'active', label: () => 'Open the refuge map', onUse: onTablet});
  const doorFrame = part(refuge, 'door_frame');
  const doorHit = hitPlane(1.4, 2.2); doorHit.position.set(0, 1.1, .05); doorFrame.add(doorHit);
  register({id: 'check', object: doorHit, range: 2.6, enabled: () => prep() && !s().held, label: () => 'Run the refuge check', onUse: onCheck});

  // ---- effects -------------------------------------------------------------------------------
  const roofAvg = () => (surfaceTransmission(s(), 'roof_l') + surfaceTransmission(s(), 'roof_r')) / 2;
  const top = () => R0.x - 1.7 + Math.random() * 3.4, depth = () => R0.z - 1.3 + Math.random() * 2.6;
  const blocked = world.particles({count: 140, color: 0xc49bff, size: .06, additive: true, gravity: 0, life: [.28, .32],
    spawn(p, v) { p.set(top(), 4.1, depth()); v.set(0, -6, 0); }});
  const through = world.particles({count: 120, color: 0xff7bd8, size: .07, additive: true, gravity: 0, life: [.62, .7],
    spawn(p, v) { p.set(top(), 4.1, depth()); v.set(0, -6, 0); }});
  const roofNode = part(refuge, 'roof_cutaway'), display = part(refuge, 'refuge_display'), screen = part(console_, 'display'), beacon = part(console_, 'beacon_lamp');
  const strips = []; hab.traverse(o => { if (o.isMesh && o.material.name === 'light-strip') strips.push(o.material); });
  const calm = new THREE.Color(0xfff1d6), alert = new THREE.Color(0xffb36b);
  let cutaway = false;
  const seatSigns = {};
  world.onFrame((dt, t) => {
    Object.assign(trolleyObstacle, {minX: trolley.position.x - .85, maxX: trolley.position.x + .85,
      minZ: trolley.position.z - .4, maxZ: trolley.position.z + .4});
    const st = s(), live = st.phase === 'active' && (st.stage === 'event');
    const intensity = live ? st.outsideRate / st.scenario.peakOutsideRate : 0;
    const showOverlay = st.overlay && live;
    blocked.rate = showOverlay ? intensity * 300 * (1 - roofAvg()) : 0; through.rate = showOverlay ? intensity * 300 * roofAvg() : 0;
    beacon.material.emissiveIntensity = st.phase === 'active' && st.stage !== 'after' ? (Math.sin(t * 6) > 0 ? 2.4 : .3) : .4;
    const mood = st.phase === 'active' && st.stage !== 'after' ? .5 : 0;
    for (const m of strips) m.emissive.copy(calm).lerp(alert, mood);
    lamps.forEach(l => l.color.copy(calm).lerp(alert, mood * .6));
    screen.material.emissive.set(st.stage === 'prep' || live ? 0xff8a3d : 0x2fd3c0);
    display.material.emissive.set(live ? 0x3ee6b5 : 0x2fd3c0);
    ventFan.rotation.z += dt * (st.assist === 'airflow' || zoneBags(st, 'stack_side').length < st.scenario.ventBlockBags ? 9 : 1.2);
    latch.rotation.y = THREE.MathUtils.lerp(latch.rotation.y, st.rack.latched ? 0 : -1.2, Math.min(1, dt * 6));
    for (const z of ZONES) straps[z].visible = !!st.zones[z].strapped && zoneBags(st, z).length > 0;
    for (const id of CREW) crew[id].update(dt);
    player.speedScale = held() ? {water: .75, poly: .8, bag: .85}[held().kind] : 1;
    // Seated during the event: you can look around, not walk away.
    if (st.phase === 'active' && st.stage !== 'prep' && !cutaway) { const v = seatWorld(st.seats.you); player.position.set(v.x, 1.25, v.z); }
  });

  /** Bring the 3D view in line with the rules state. */
  function sync({animate = true} = {}) {
    const st = s();
    rack.visible = st.rack.built; if (st.rack.built && rack.parent !== mounts[st.rack.at]) { mounts[st.rack.at].add(rack); rack.position.set(0, 0, 0); }
    for (const it of st.items) {
      if (where[it.id] === keyOf(st, it)) continue;
      const m = models[it.id];
      if (!animate || it.at === 'floor') { snap(st, it); continue; }
      where[it.id] = keyOf(st, it);
      if (it.at === 'hand') world.hold(m, HOLD[it.kind]); else world.place(m, anchorFor(st, it), {seconds: .6, arc: it.at.startsWith('rail:roof') || it.at.startsWith('zone:shelf') ? .7 : .3});
    }
    showAssist(animate);
    for (const id of CREW) {
      const want = st.phase !== 'brief' && (st.stage !== 'prep') ? `seat:${st.seats[id]}` : 'work';
      if (crewShown[id] === want) continue;
      if (want === 'work') { const [x, z, yaw] = WORK[id]; crew[id].teleport(x, z, yaw); crew[id].mode = 'work'; crewShown[id] = 'work'; assistShown = null; }
      else sendToSeat(id, animate);
    }
  }
  sync({animate: false});

  // Cutaway for the debrief: lift the camera above the refuge, fade its roof and show each person's result.
  function setCutaway(on, labels = {}) {
    cutaway = on;
    setOpacity(roofNode, on ? .08 : 1);
    for (const sp of Object.values(seatSigns)) sp.removeFromParent();
    if (on) {
      for (const p of PEOPLE) {
        const v = seatWorld(s().seats[p]), sp = world.sign(labels[p] || p, {width: .95, color: labels[`${p}:color`] || '#ffd23f'});
        sp.position.set(v.x, 1.75, v.z + .1); scene.add(sp); seatSigns[p] = sp;
      }
      player.enabled = false; player.position.set(R0.x + .2, 3.1, R0.z + 3.4);
      const dx = R0.x - player.position.x, dy = .5 - 3.1, dz = R0.z - .3 - player.position.z;
      player.yaw = Math.atan2(-dx, -dz); player.pitch = Math.atan2(dy, Math.hypot(dx, dz)); player.syncCamera();
    }
  }

  const pos = new THREE.Vector3();
  const inside = (x, z) => Math.abs(x - R0.x) < 1.3 && Math.abs(z - R0.z) < 1.1;
  const outsideDoor = {x: R0.x, z: R0.z + 2.2};
  let assistedWalk;
  world.interaction.preferTarget(() => {
    if (!assistedWalk || player.route.length || player.keys.size || player.drag) return null;
    const {id, x, z} = assistedWalk;
    return Math.hypot(player.position.x - x, player.position.z - z) <= .25 ? id : null;
  });
  const walkTo = (target, id) => {
    const look = target.object.getWorldPosition(new THREE.Vector3());
    // Approach mounted equipment from inside; checking the door is done in the hall.
    const inRefuge = id !== 'check' && (id === 'rack' || /^(mount|rail|zone):/.test(id) ||
      (id.startsWith('item:') && !['store', 'trolley'].includes(item(s(), id.slice(5)).at)));
    const candidates = [];
    for (const r of [1.4, 1, 1.85]) for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      candidates.push({x: Math.round((look.x + Math.sin(a) * r) * 2) / 2, z: Math.round((look.z + Math.cos(a) * r) * 2) / 2});
    }
    const valid = candidates.filter(({x, z}) => Math.hypot(x - look.x, z - look.z) < (target.range ?? 2.4) &&
      (!inRefuge || inside(x, z)) && !isBlocked(x, z, obstacles));
    valid.sort((a, b) => Math.hypot(a.x - player.position.x, a.z - player.position.z) -
      Math.hypot(b.x - player.position.x, b.z - player.position.z));
    const points = id === 'check' ? [outsideDoor, ...valid] : valid;
    assistedWalk = null;
    return points.some(p => {
      if (!player.navigate(p, look)) return false;
      assistedWalk = {...p, id};
      return true;
    });
  };

  let guideKey = '', guidance;
  const guide = document.createElement('div');
  guide.className = 'sx-target'; guide.hidden = true; guide.setAttribute('aria-hidden', 'true');
  container.append(guide);
  world.onFrame(() => {
    const current = getShelterTask(s());
    if (assistedWalk && !player.route.length &&
      (player.keys.size || player.drag || Math.hypot(player.position.x - assistedWalk.x, player.position.z - assistedWalk.z) > .25)) assistedWalk = null;
    if (current?.place !== guideKey) {
      guideKey = current?.place;
      guidance = targets.get(guideKey);
    }
    const active = player.enabled && guidance?.enabled();
    world.guide(active ? guidance.object : null, .23);
    guide.hidden = !active;
    if (!active) return;
    const target = guidance.object.getWorldPosition(pos);
    const distance = Math.hypot(target.x - player.position.x, target.z - player.position.z);
    const markerY = guidance.object.isMesh ? .42 : 1.2;
    pos.y += markerY;
    pos.project(world.camera);
    const screen = {x: (pos.x + 1) / 2, y: (1 - pos.y) / 2, onScreen: pos.z < 1};
    const rel = relativeNavigation(player.position, player.yaw, target);
    const label = `◆ ${current.marker} · ${rel ? rel.summary : Math.ceil(distance) + ' m'}`;
    if (guide.textContent !== label) guide.textContent = label;
    const visible = screen?.onScreen && screen.y > .13 && screen.y < .78 && screen.x > .20 && screen.x < .76;
    guide.classList.toggle('sx-target-in-world', !!visible);
    if (visible) {
      guide.style.setProperty('--sx-x', `${screen.x * 100}%`);
      guide.style.setProperty('--sx-y', `${screen.y * 100}%`);
    }
  });

  const landmarks = [
    {id: 'store-water', label: 'Water containers', find: st => st.items.find(i => i.kind === 'water' && ['store', 'trolley'].includes(i.at))},
    {id: 'store-bags', label: 'Supply bags', find: st => st.items.find(i => i.kind === 'bag' && i.at === 'store')},
    {id: 'store-poly', label: 'Plastic panels', find: st => st.items.find(i => i.kind === 'poly' && i.at === 'store')},
  ];
  const labelFor = (id, label) => ({id, label, visible: () => targets.get(id)?.enabled()});
  return {world, sync, setCutaway, seatTransmission: seat => seatTransmission(s(), seat),
    walkTargets: [labelFor('tablet', 'refuge tablet'), labelFor('elena', 'Elena'), labelFor('check', 'refuge door'),
      labelFor('rack', 'water rack'), ...landmarks.map(l => ({id: l.id, label: l.label, visible: () => prep() && !held() && !!l.find(s())})),
      // The current target gets its own shortcut even when it isn't a general landmark.
      ...[...targets.keys()].filter(id => !['tablet', 'elena', 'check', 'rack'].includes(id)).map(id => ({
        id, label: id.startsWith('mount:') ? 'wall mount' : 'marked spot', visible: () => false,
      }))],
    walk(id) {
      const landmark = landmarks.find(l => l.id === id);
      if (landmark) id = `item:${landmark.find(s())?.id}`;
      const target = targets.get(id);
      if (!target?.enabled()) return false;
      return walkTo(target, id);
    }};
}
