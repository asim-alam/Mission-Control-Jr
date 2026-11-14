// 3D view of "Over the Hill": Horizon Base, a two-seat rover, a radio relay you carry and set up on the
// ridge top, and a drill in Shadow Hollow. Radio lines turn green or red to show line of sight.
import * as THREE from 'three';
import {loadModel, part} from '../shared/engine.js';
import {missionAsset} from '../shared/assets.js';
import {makeCrew} from '../shared/crew.js';
import {createMoonWorld} from '../shared/moon-world.js';
import {groundHeight} from '../shared/moon-ground.js';
import {relayHops, hasLink, relayHeight, batteryHome, NEXT} from './actions.js';

const ROUTES = {
  'base>saddle': [[-4, -6.5], [-3, -16], [4, -30], [11, -41]],
  'saddle>hollow': [[11, -41], [12, -56], [13.5, -76]],
};
const route = (from, to) => ROUTES[`${from}>${to}`]?.map(([x, z]) => ({x, z})) || ROUTES[`${to}>${from}`].map(([x, z]) => ({x, z})).reverse();
const MAST_SUNK = -.8, STAGE_M = 1.8;
const yawToward = (dx, dz) => Math.atan2(-dx, -dz);

function canvasScreen(mesh, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  mesh.material = new THREE.MeshStandardMaterial({map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: .95, color: 0xffffff, roughness: .3});
  return {ctx, c, tex};
}

export async function createRelayScene({container, getState, act, onPause, onDrive}) {
  const s = () => getState();
  const sc0 = s().scenario, stops = sc0.stops;
  const moon = await createMoonWorld({container, onPause, start: {x: -.8, z: -5.2, yaw: yawToward(-1, -.35)}, sun: {azimuth: 165, elevation: 1.5}});
  const {world} = moon, {scene, player} = world;
  const load = id => loadModel(missionAsset(id));
  const [hab, rover, relay, drill, jin] = await Promise.all([load('lunar-habitat'), load('moon-rover'), load('relay-station'), load('science-drill'), makeCrew('jin', {suitMode: true})]);
  scene.add(hab, jin.model); jin.teleport(6.8, -2.6, -2.2);
  const porch = new THREE.PointLight(0xffe2b0, 6, 9, 1.6); porch.position.set(6.2, 2.4, 0); scene.add(porch);
  const yard = new THREE.PointLight(0xffe2b0, 4, 10, 1.6); yard.position.set(-4, 3, -5); scene.add(yard);
  const beacon = part(hab, 'beacon').getObjectByProperty('isMesh', true)?.material;
  const baseDish = part(hab, 'base_dish');

  // ---- the rover ----------------------------------------------------------------------------------
  scene.add(rover);
  const wheels = ['wheel_fl', 'wheel_fr', 'wheel_rl', 'wheel_rr'].map(n => part(rover, n));
  const roverAnt = part(rover, 'rover_antenna');
  const dash = canvasScreen(part(rover, 'dash_screen').getObjectByProperty('isMesh', true), 384, 184);
  const headlight = new THREE.SpotLight(0xfff4dc, 40, 34, .6, .5, 1.2); headlight.position.set(0, 1, -1.4); headlight.target.position.set(0, -.6, -9); rover.add(headlight, headlight.target);
  const workLight = new THREE.PointLight(0xfff0d0, 0, 9, 1.4); workLight.position.set(1.4, 2.2, 0); rover.add(workLight);
  const relaySocket = new THREE.Group(); relaySocket.position.set(.3, .88, 1.08); rover.add(relaySocket);
  const drillSocket = new THREE.Group(); drillSocket.position.set(-.38, .88, 1.3); drillSocket.rotation.y = .3; rover.add(drillSocket);
  // Sample box on the cargo deck with a lid that opens.
  const boxMat = new THREE.MeshStandardMaterial({color: 0xe8e4da, roughness: .5, metalness: .2});
  const sampleBox = new THREE.Group(); sampleBox.position.set(-.38, .9, .78); rover.add(sampleBox);
  const boxBody = new THREE.Mesh(new THREE.BoxGeometry(.44, .2, .3), boxMat); boxBody.position.y = .1; sampleBox.add(boxBody);
  const lid = new THREE.Group(); lid.position.set(0, .2, -.15); sampleBox.add(lid);
  const lidMesh = new THREE.Mesh(new THREE.BoxGeometry(.46, .03, .32), new THREE.MeshStandardMaterial({color: 0xff8a3d, roughness: .5})); lidMesh.position.z = .16; lid.add(lidMesh);
  const coreSlots = [-.1, .1].map(x => { const g = new THREE.Group(); g.position.set(x, .12, 0); sampleBox.add(g); return g; });
  const roverSign = world.sign('🚙 Rover', {width: 1.1}); roverSign.position.set(0, 2.6, 0); rover.add(roverSign);

  // ---- relay, crate, drill -------------------------------------------------------------------------
  const relayLegs = [1, 2, 3].map(i => part(relay, `leg_${i}`)), mast = [part(relay, 'mast_1'), part(relay, 'mast_2'), part(relay, 'mast_3')];
  const mastY = mast.map(m => m.position.y), flaps = [part(relay, 'flap_l'), part(relay, 'flap_r')];
  const dishPivot = part(relay, 'dish_pivot'), dishTilt = part(relay, 'dish_tilt');
  const linkLamp = part(relay, 'link_lamp').getObjectByProperty('isMesh', true).material, powerLamp = part(relay, 'power_lamp').getObjectByProperty('isMesh', true).material;
  const crate = new THREE.Group();
  const crateM = new THREE.MeshStandardMaterial({color: 0x5d6b7a, roughness: .6, metalness: .3});
  const crateBox = new THREE.Mesh(new THREE.BoxGeometry(1, .5, .8), crateM); crateBox.position.y = .25; crateBox.castShadow = true; crate.add(crateBox);
  const crateSocket = new THREE.Group(); crateSocket.position.y = .5; crate.add(crateSocket);
  moon.onGround(crate, -7.2, -4.2, .4);
  const crateSign = world.sign('📡 Radio relay', {width: 1.4}); crateSign.position.set(0, 2.9, 0); crate.add(crateSign);
  // Ground marks: a yellow ring on the ridge top and X marks in the hollow.
  const ringMat = new THREE.MeshBasicMaterial({color: 0xffd23f, transparent: true, opacity: .6, side: THREE.DoubleSide, depthWrite: false});
  const markOn = (mesh, x, z) => { mesh.rotation.x = -Math.PI / 2; mesh.position.set(x, groundHeight(x, z) + .06, z); scene.add(mesh); return mesh; };
  const relayRing = markOn(new THREE.Mesh(new THREE.RingGeometry(.75, .95, 40), ringMat), stops.saddle.relaySpot.x, stops.saddle.relaySpot.z);
  const xMarks = {};
  for (const [id, p] of Object.entries(sc0.drillSpots)) {
    const g = new THREE.Group(); const m = new THREE.MeshBasicMaterial({color: id === 'a' ? 0xffd23f : 0x6ad7ff, transparent: true, opacity: .8, side: THREE.DoubleSide, depthWrite: false});
    for (const r of [Math.PI / 4, -Math.PI / 4]) { const bar = new THREE.Mesh(new THREE.PlaneGeometry(1.1, .16), m); bar.rotation.z = r; g.add(bar); }
    xMarks[id] = markOn(g, p.x, p.z); xMarks[id].userData.mat = m;
    const socket = new THREE.Group(); socket.position.set(p.x, groundHeight(p.x, p.z), p.z); scene.add(socket); xMarks[id].userData.socket = socket;
  }
  const label = (text, x, z, y = 3.4, w = 2) => { const l = world.sign(text, {width: w}); l.position.set(x, groundHeight(x, z) + y, z); scene.add(l); return l; };
  const ridgeLabel = label('⛰️ Ridge top', stops.saddle.relaySpot.x, stops.saddle.relaySpot.z, 3.2);
  label('🕳️ Shadow Hollow', 15, -80, 4, 2.4);
  const hatchSign = world.sign('🚪 Base hatch', {width: 1.4}); hatchSign.position.set(6.5, 3.4, 0); scene.add(hatchSign);
  const relaySpotSocket = new THREE.Group(); scene.add(relaySpotSocket);
  const relayStatus = {sprite: null, key: ''};
  function setRelayStatus(text) {
    if (relayStatus.key === text) return; relayStatus.key = text;
    if (relayStatus.sprite) relay.remove(relayStatus.sprite);
    if (!text) { relayStatus.sprite = null; return; }
    relayStatus.sprite = world.sign(text, {width: 1.7, font: 56}); relayStatus.sprite.position.set(0, 1.7, 0); relay.add(relayStatus.sprite);
  }

  // Drill parts and the core samples.
  const drillHead = part(drill, 'drill_head'), drillBit = part(drill, 'drill_bit'), coreProto = part(drill, 'core_sample');
  const bitY = drillBit.position.y, headY = drillHead.position.y;
  coreProto.removeFromParent();
  const cores = [coreProto, coreProto.clone()];
  const coreOut = new THREE.Group(); coreOut.position.set(.35, .25, 0); drill.add(coreOut);

  // ---- hit boxes ---------------------------------------------------------------------------------------
  const hitMat = new THREE.MeshBasicMaterial({transparent: true, opacity: 0, depthWrite: false});
  const hitBox = (parent, size, pos) => { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.BoxGeometry(...size), hitMat); m.position.set(...pos); g.add(m); parent.add(g); return g; };
  const crateHit = hitBox(crate, [1.1, .9, .9], [0, .45, 0]);
  const cargoHit = hitBox(rover, [1.3, .6, .9], [0, 1.1, 1.05]);
  const seatHit = hitBox(rover, [1.2, .9, .9], [0, 1.2, -.2]);
  const radioHit = hitBox(rover, [.5, .5, .4], [0, 1.2, -.9]);
  const boxHit = hitBox(sampleBox, [.55, .4, .45], [0, .15, 0]);
  const relayHit = hitBox(relay, [.9, .32, .9], [0, .1, 0]); // legs only, so it never covers the ▲ ▼ buttons
  const upHit = hitBox(relay, [.24, .2, .14], [.18, .48, .3]);
  const downHit = hitBox(relay, [.24, .2, .14], [-.18, .48, .3]);
  const dishHit = hitBox(dishPivot, [.8, .8, .6], [0, .1, 0]);
  const drillHit = hitBox(drill, [.9, 1.3, .9], [0, .65, 0]);
  const coreHit = hitBox(coreOut, [.25, .5, .25], [0, 0, 0]);
  const hatchHit = hitBox(hab, [.6, 2, 1.6], [0, 0, 0]);
  hatchHit.position.set(5.55, 2, 0);
  // ▲ ▼ buttons on the relay hub.
  const btn = (color, x) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .03, 16), new THREE.MeshStandardMaterial({color, emissive: color, emissiveIntensity: .4})); m.rotation.x = Math.PI / 2; m.position.set(x, .48, .262); relay.add(m); return m; };
  const upBtn = btn(0x2bd96b, .12), downBtn = btn(0xff5a4a, -.12);

  // ---- radio lines: green when the two ends can see each other, red when a hill is in the way ----------
  const lineMat = color => new THREE.LineDashedMaterial({color, dashSize: .8, gapSize: .45, transparent: true, opacity: .9, depthTest: true});
  const lines = {base: new THREE.Line(new THREE.BufferGeometry(), lineMat(0x2bff86)), field: new THREE.Line(new THREE.BufferGeometry(), lineMat(0x2bff86)), direct: new THREE.Line(new THREE.BufferGeometry(), lineMat(0xff5a4a))};
  Object.values(lines).forEach(l => { l.frustumCulled = false; l.visible = false; scene.add(l); });
  const baseAntPos = () => { const v = new THREE.Vector3(); baseDish.getWorldPosition(v); return v; };
  const relayTop = () => { const v = new THREE.Vector3(); dishPivot.getWorldPosition(v); return v; };
  const roverTop = (stop = s().at) => { const p = stops[stop].park; return new THREE.Vector3(p.x, groundHeight(p.x, p.z) + s().scenario.roverAntennaH, p.z); };
  function setLine(line, a, b, clear) {
    line.geometry.dispose(); line.geometry = new THREE.BufferGeometry().setFromPoints([a, b]); line.computeLineDistances();
    line.material.color.set(clear ? 0x2bff86 : 0xff5a4a); line.visible = true;
  }
  // Data pulses that hop along the radio path (and up toward Earth).
  const pulses = [];
  const pulseMat = new THREE.MeshBasicMaterial({color: 0x6ad7ff});
  function sendPulse(points, seconds = 1.6) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(.22, 12, 8), pulseMat); scene.add(m);
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0);
    return world.tween(seconds, (e, raw) => { m.position.copy(curve.getPointAt(Math.min(1, raw))); m.scale.setScalar(1 + Math.sin(raw * 30) * .2); }, t => t).then(() => { scene.remove(m); m.geometry.dispose(); });
  }

  // ---- rover placement and driving -------------------------------------------------------------------
  let roverPos = new THREE.Vector2(stops.base.park.x, stops.base.park.z), roverYaw = 0, driving = false, wheelSpin = 0;
  const roverBox = {minX: 0, maxX: 0, minZ: 0, maxZ: 0};
  const crateBoxAabb = {minX: -7.75, maxX: -6.65, minZ: -4.7, maxZ: -3.7};
  player.obstacles = [{minX: -4.6, maxX: 6.0, minZ: -2.15, maxZ: 2.15}, roverBox, crateBoxAabb];
  function placeRover() {
    const x = roverPos.x, z = roverPos.y, fx = -Math.sin(roverYaw), fz = -Math.cos(roverYaw);
    const ahead = groundHeight(x + fx * 1.1, z + fz * 1.1), behind = groundHeight(x - fx * 1.1, z - fz * 1.1);
    const right = groundHeight(x - fz * .9, z + fx * .9), left = groundHeight(x + fz * .9, z - fx * .9);
    const clamp = v => Math.max(-.4, Math.min(.4, v));
    rover.position.set(x, (ahead + behind + left + right) / 4, z);
    rover.rotation.set(clamp(Math.atan2(ahead - behind, 2.2)), roverYaw, clamp(Math.atan2(right - left, 1.8)), 'YXZ');
    const r = 1.55; Object.assign(roverBox, driving ? {minX: 0, maxX: 0, minZ: 0, maxZ: 0} : {minX: x - r, maxX: x + r, minZ: z - r, maxZ: z + r});
  }
  async function drive(to, seconds = 6) {
    const st = s(), pts = route(st.at, to);
    const curve = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(p.x, 0, p.z)), false, 'centripetal');
    driving = true; placeRover();
    const len = curve.getLength(); let last = curve.getPointAt(0);
    headlight.intensity = 60;
    await world.tween(seconds, e => {
      const p = curve.getPointAt(e), tan = curve.getTangentAt(Math.min(.999, e));
      roverPos.set(p.x, p.z); roverYaw = yawToward(tan.x, tan.z); wheelSpin += p.distanceTo(last) / .42; last = p;
      wheels.forEach(w => { w.rotation.x = -wheelSpin; });
      placeRover();
      // You ride in the left seat.
      const seat = new THREE.Vector3(); part(rover, 'seat_l').getWorldPosition(seat);
      player.position.set(seat.x, seat.y + 1.15, seat.z); player.yaw = roverYaw; player.pitch = -.08; player.syncCamera();
    });
    driving = false; placeRover(); stepOut();
    return len;
  }
  function stepOut() {
    const side = new THREE.Vector3(-2.1, 0, -.2).applyAxisAngle(new THREE.Vector3(0, 1, 0), roverYaw);
    const x = roverPos.x + side.x, z = roverPos.y + side.z;
    player.position.set(x, groundHeight(x, z) + 1.62, z); player.yaw = yawToward(roverPos.x - x + Math.sin(roverYaw) * -.8, roverPos.y - z); player.pitch = -.18; player.syncCamera();
  }

  // ---- interactions ------------------------------------------------------------------------------------
  const H = () => s().scenario.holdSeconds;
  const active = () => s().phase === 'active' && !!s().plan && !driving;
  const nearRover = () => !driving;
  world.register({id: 'crate', object: crateHit, range: 2.6, enabled: () => active() && (s().relay === 'crate' && !s().hand || s().relay === 'hand' && s().at === 'base'),
    label: () => s().relay === 'crate' ? 'Pick up the radio relay' : 'Put the relay back in its crate', onUse: () => act({id: s().relay === 'crate' ? 'takeRelay' : 'putRelayBack'})});
  world.register({id: 'cargo', object: cargoHit, range: 2.8, enabled: () => active() && nearRover() && ((s().relay === 'hand' && !s().scenario.stops[s().at].relaySpot) || (s().relay === 'rover' && !s().hand && s().at !== 'base') || (s().hand === 'drill' && s().cores >= (s().earthAsked ? 2 : 1)) || (s().drill === 'rover' && !s().hand && s().at === 'hollow')),
    label: () => s().relay === 'hand' ? 'Put the relay on the cargo deck'
      : s().hand === 'drill' ? 'Put the drill back on the rover'
      : s().at === 'hollow' && s().drill === 'rover' ? 'Take the drill off the rover'
      : s().relay === 'rover' && s().at !== 'base' ? 'Lift the relay off the rover'
      : s().drill === 'rover' ? 'Take the drill off the rover' : 'Use the rover cargo deck',
    onUse: () => { const st = s(); if (st.relay === 'hand') act({id: 'stowRelay'}); else if (st.hand === 'drill') act({id: 'packDrill'}); else if (st.at === 'hollow' && st.drill === 'rover') act({id: 'takeDrill'}); else act({id: 'takeRelay'}); }});
  world.register({id: 'seat', object: seatHit, range: 2.8, enabled: () => {
    const st = s(), needed = st.earthAsked ? 2 : 1;
    if (!active() || st.hand || st.stowed > st.messages.length) return false;
    if (st.at === 'base') return !!st.plan && !st.stowed && (st.plan !== 'relay' || st.relay === 'rover');
    if (st.at === 'saddle') return st.stowed > 0 || st.plan === 'direct' || (st.relay === 'ground' && st.aimed);
    return st.at === 'hollow' && st.stowed === st.messages.length && st.cores >= needed && st.drill === 'rover';
  }, label: () => '🚙 Get in and drive', onUse: () => onDrive()});
  world.register({id: 'radio', object: radioHit, range: 2.6, enabled: () => active() && s().stowed > s().messages.length, label: () => hasLink(s()) ? '📶 Send the data' : '📵 Send the data (no signal here)', onUse: () => act({id: 'sendData'})});
  world.register({id: 'box', object: boxHit, range: 2.6, enabled: () => active() && s().hand === 'core', label: () => 'Put the core in the sample box', onUse: () => act({id: 'stowCore'})});
  world.register({id: 'ring', object: relayRing, range: 3, enabled: () => active() && s().relay === 'hand' && s().at !== 'base', label: () => 'Set the relay down here', onUse: () => act({id: 'placeRelay'})});
  world.register({id: 'relay', object: relayHit, range: 2.6, holdSeconds: () => H().legs, enabled: () => active() && s().relay === 'ground' && s().relayAt === s().at && !s().hand && (!s().legs || !s().stages),
    label: () => s().legs ? 'Hold E: fold the legs (to pick it up)' : 'Hold E: put the relay’s legs out',
    onHold: p => { if (!s().legs) relayLegs.forEach(l => { l.rotation.x = .9 * p; }); }, onUse: () => act({id: 'relayLegs'})});
  world.register({id: 'relayPick', object: dishHit, range: 2.6, enabled: () => active() && s().relay === 'ground' && s().relayAt === s().at && !s().legs && !s().hand, label: () => 'Pick up the relay', onUse: () => act({id: 'takeRelay'})});
  world.register({id: 'mastUp', object: upHit, range: 2.4, enabled: () => active() && s().relay === 'ground' && s().legs && s().stages < s().scenario.relay.stages,
    label: () => `Press E: raise the mast (stage ${s().stages + 1} of ${s().scenario.relay.stages})`, onUse: () => { world.tween(.25, (e, r) => { upBtn.position.z = .262 - Math.sin(r * Math.PI) * .015; }); act({id: 'raiseStage'}); }});
  world.register({id: 'mastDown', object: downHit, range: 2.4, enabled: () => active() && s().relay === 'ground' && s().stages > 0, label: () => 'Press E: lower the mast', onUse: () => act({id: 'lowerStage'})});
  world.register({id: 'dish', object: dishHit, range: 8, holdSeconds: () => H().aim, enabled: () => active() && s().relay === 'ground' && s().legs && !s().aimed,
    label: () => 'Hold E: aim the dish at the base', onHold: p => { dishPivot.rotation.y = aimYaw() * p; }, onUse: () => act({id: 'aim'})});
  for (const id of Object.keys(sc0.drillSpots)) world.register({id: `x:${id}`, object: xMarks[id], range: 3, enabled: () => active() && s().hand === 'drill' && (id === 'a' ? s().cores === 0 : s().earthAsked && s().cores === 1),
    label: () => `Press E: set the drill on the ${id === 'a' ? 'yellow' : 'blue'} X`, onUse: () => act({id: 'placeDrill', payload: id})});
  world.register({id: 'drill', object: drillHit, range: 2.6, holdSeconds: () => s().cores < (s().earthAsked ? 2 : 1) && !s().coreReady ? H().drill : 0,
    enabled: () => active() && s().drill === 'ground' && !s().hand && !s().coreReady,
    label: () => s().cores < (s().earthAsked ? 2 : 1) && !(s().drillAt === 'a' && s().cores) ? 'Hold E: drill a core' : 'Pick up the drill',
    onHold: p => { drillHead.rotation.y += .5; drillHead.position.y = headY - .55 * p; dust.rate = 50; },
    onUse: () => { dust.rate = 0; const st = s(); if (st.cores < (st.earthAsked ? 2 : 1) && !(st.drillAt === 'a' && st.cores)) act({id: 'drillCore'}); else act({id: 'takeDrill'}); }});
  world.register({id: 'core', object: coreHit, range: 2.6, enabled: () => active() && s().coreReady && !s().hand, label: () => 'Take the core sample', onUse: () => act({id: 'takeCore'})});
  world.register({id: 'hatch', object: hatchHit, range: 3.2, enabled: () => active() && s().at === 'base' && !s().hand, label: () => s().stowed ? '🚪 Go inside with your cores' : '🚪 Go inside (no cores yet)', onUse: () => act({id: 'finish'})});

  // Prefer the object that completes the current task when hit areas overlap.
  world.interaction.preferTarget(() => {
    const st = s();
    if (!active()) return null;
    if (st.hand === 'relay') return st.at !== 'base' && st.scenario.stops[st.at].relaySpot ? 'ring' : 'cargo';
    if (st.hand === 'drill') return st.cores < (st.earthAsked ? 2 : 1) ? `x:${st.earthAsked && st.cores ? 'b' : 'a'}` : 'cargo';
    if (st.hand === 'core') return 'box';
    if (st.stowed > st.messages.length) return 'radio';
    if (st.relay === 'ground' && st.relayAt === st.at) {
      if (!st.legs) return 'relay';
      if (!relayHops(st, 'hollow').field && st.stages < st.scenario.relay.stages) return 'mastUp';
      if (!st.aimed) return 'dish';
    }
    if (st.at === 'hollow' && st.drill === 'rover' && st.cores < (st.earthAsked ? 2 : 1)) return 'cargo';
    if (st.drill === 'ground' && !st.hand && !st.coreReady) return 'drill';
    if (st.coreReady && !st.hand) return 'core';
    return null;
  }, {requiresFacing: false});

  const dust = world.particles({count: 80, color: 0xb9b2a6, size: .07, opacity: .8, gravity: -1.2, life: [.6, 1.2], spawn(p, v) { const d = new THREE.Vector3(); drill.getWorldPosition(d); p.set(d.x + (Math.random() - .5) * .2, d.y + .05, d.z + (Math.random() - .5) * .2); v.set((Math.random() - .5) * 1.4, .8 + Math.random() * 1.2, (Math.random() - .5) * 1.4); }});
  function aimYaw() {
    const a = new THREE.Vector3(); relay.getWorldPosition(a); const b = baseAntPos();
    return Math.atan2(b.x - a.x, b.z - a.z) - relay.rotation.y + Math.PI;
  }

  // ---- state → view -------------------------------------------------------------------------------------
  let shownMission = null, shown = null, syncQueue = Promise.resolve();
  const sync = opts => (syncQueue = syncQueue.then(() => doSync(opts)).catch(e => console.error(e)));
  const setMast = n => { mast[0].position.y = (s().relay === 'ground' ? MAST_SUNK : mastY[0]) + (n >= 1 ? STAGE_M : 0); mast[1].position.y = mastY[1] + (n >= 2 ? STAGE_M : 0); mast[2].position.y = mastY[2] + (n >= 3 ? STAGE_M : 0); };
  const setLegs = down => { relayLegs.forEach(l => { l.rotation.x = down ? .9 : 0; }); flaps.forEach((f, i) => { f.rotation.z = down ? 0 : (i ? 1 : -1) * 1.2; }); };
  function relayTo(where, animate) {
    const st = s();
    if (where === 'hand') return world.hold(relay, {scale: .5, offset: [-.1, -.1, -.25], rotation: [.1, .4, 0]});
    let socket = crateSocket;
    if (where === 'rover') socket = relaySocket;
    if (where === 'ground') { const p = stops[st.relayAt].relaySpot; relaySpotSocket.position.set(p.x, groundHeight(p.x, p.z) + .15, p.z); relaySpotSocket.rotation.y = 0; socket = relaySpotSocket; }
    if (animate) return world.place(relay, socket, {seconds: .5, arc: .3});
    world.release(); socket.add(relay); relay.position.set(0, 0, 0); relay.rotation.set(0, 0, 0); relay.scale.setScalar(1);
  }
  function drillTo(where, animate) {
    const st = s();
    if (where === 'hand') return world.hold(drill, {scale: .45, offset: [-.05, -.15, -.2], rotation: [0, .5, 0]});
    const socket = where === 'ground' ? xMarks[st.drillAt].userData.socket : drillSocket;
    if (animate) return world.place(drill, socket, {seconds: .5, arc: .3, scale: where === 'ground' ? 1 : .8});
    world.release(); socket.add(drill); drill.position.set(0, 0, 0); drill.rotation.set(0, 0, 0); drill.scale.setScalar(where === 'ground' ? 1 : .8);
  }
  function placeCores(st) {
    cores.forEach((c, i) => {
      if (st.hand === 'core' && i === st.cores - 1) return;
      if (i < st.stowed) { coreSlots[i].add(c); c.position.set(0, 0, 0); c.rotation.set(0, 0, 0); c.scale.setScalar(.6); c.visible = true; }
      else if (st.coreReady && i === st.cores - 1) { coreOut.add(c); c.position.set(0, 0, 0); c.rotation.set(0, 0, 0); c.scale.setScalar(1); c.visible = true; }
      else c.visible = false;
    });
  }
  function resetView() {
    const st = s(); world.release();
    const p = stops[st.at].park; roverPos.set(p.x, p.z); roverYaw = 0; placeRover();
    shown = {relay: st.relay, drill: st.drill, hand: st.hand, legs: st.legs, stages: st.stages, aimed: st.aimed, at: st.at, coreReady: st.coreReady, stowed: st.stowed, messages: st.messages.length};
    if (st.relay === 'hand') relayTo('hand'); else relayTo(st.relay, false);
    setLegs(st.legs); setMast(st.stages); dishPivot.rotation.y = st.aimed ? aimYaw() : 0;
    if (st.drill === 'hand') drillTo('hand'); else drillTo(st.drill, false);
    drillHead.position.y = headY; placeCores(st);
    if (st.hand === 'core') world.hold(cores[st.cores - 1], {scale: 1, offset: [0, 0, 0], rotation: [.3, 0, .2]});
    lid.rotation.x = 0;
  }
  async function doSync({animate = true} = {}) {
    const st = s();
    if (shownMission !== st) { shownMission = st; resetView(); return; }
    if (shown.at !== st.at) { const p = stops[st.at].park; if (Math.hypot(roverPos.x - p.x, roverPos.y - p.z) > .5) { roverPos.set(p.x, p.z); placeRover(); stepOut(); } shown.at = st.at; }
    if (shown.relay !== st.relay) {
      if (shown.relay === 'ground' && st.relay === 'hand') setMast(0);
      if (st.relay === 'hand') await relayTo('hand'); else { await relayTo(st.relay, animate); setMast(st.stages); }
      if (st.relay === 'ground') setMast(0);
      shown.relay = st.relay;
    }
    if (shown.legs !== st.legs) {
      const a = shown.legs ? 1 : 0, b = st.legs ? 1 : 0;
      if (animate) await world.tween(.5, t => { const k = a + (b - a) * t; relayLegs.forEach(l => { l.rotation.x = .9 * k; }); flaps.forEach((f, i) => { f.rotation.z = (i ? 1 : -1) * 1.2 * (1 - k); }); });
      setLegs(st.legs); shown.legs = st.legs;
    }
    if (shown.stages !== st.stages) {
      const k = Math.max(shown.stages, st.stages) - 1, node = mast[k], from = node.position.y, base = k === 0 ? MAST_SUNK : mastY[k], to = base + (st.stages > k ? STAGE_M : 0);
      if (animate) await world.tween(1, t => { node.position.y = from + (to - from) * t; });
      setMast(st.stages); shown.stages = st.stages;
    }
    if (shown.aimed !== st.aimed) {
      const from = dishPivot.rotation.y, to = st.aimed ? aimYaw() : 0;
      if (animate) await world.tween(.6, t => { dishPivot.rotation.y = from + (to - from) * t; }); else dishPivot.rotation.y = to;
      shown.aimed = st.aimed;
    }
    if (shown.drill !== st.drill || shown.hand !== st.hand) {
      if (st.drill !== shown.drill) { if (st.drill === 'hand') await drillTo('hand'); else await drillTo(st.drill, animate); }
      if (st.hand === 'core' && shown.hand !== 'core') world.hold(cores[st.cores - 1], {scale: 1, offset: [0, 0, 0], rotation: [.3, 0, .2]});
      if (shown.hand === 'core' && st.hand !== 'core') { const c = cores[st.stowed - 1]; if (animate) { await world.tween(.3, t => { lid.rotation.x = -1.6 * t; }); await world.place(c, coreSlots[st.stowed - 1], {seconds: .45, arc: .2, scale: .6}); await world.tween(.3, t => { lid.rotation.x = -1.6 * (1 - t); }); } }
      shown.drill = st.drill; shown.hand = st.hand;
    }
    if (shown.coreReady !== st.coreReady) {
      if (st.coreReady && animate) { await world.tween(.6, t => { drillHead.position.y = headY - .55 * (1 - t); drillHead.rotation.y += .3; }); }
      drillHead.position.y = headY; shown.coreReady = st.coreReady;
    }
    // Safety net: if quick actions raced the animations, snap the relay and drill to where the rules say they are.
    const now = s(), want = {crate: crateSocket, rover: relaySocket, ground: relaySpotSocket}[now.relay];
    if (want && relay.parent !== want) { relayTo(now.relay, false); setLegs(now.legs); setMast(now.stages); shown.relay = now.relay; }
    const wantDrill = now.drill === 'ground' ? xMarks[now.drillAt]?.userData.socket : now.drill === 'rover' ? drillSocket : null;
    if (wantDrill && drill.parent !== wantDrill) { drillTo(now.drill, false); shown.drill = now.drill; }
    placeCores(st); shown.stowed = st.stowed;
    if (shown.messages !== st.messages.length || st.messages.some(m => m.status === 'delivered' && !m.shown)) {
      shown.messages = st.messages.length;
      const fresh = st.messages.filter(m => m.status === 'delivered' && !m.shownView);
      if (fresh.length && animate) {
        fresh.forEach(m => { m.shownView = true; });
        const from = roverTop(), base = baseAntPos(), path = [from];
        if (!hasDirect(st) && st.relay === 'ground') path.push(relayTop());
        path.push(base);
        await sendPulse(path, 1.8);
        sendPulse([base, base.clone().add(new THREE.Vector3(60, 220, -900))], 1.35);
      } else fresh.forEach(m => { m.shownView = true; });
    }
  }
  const hasDirect = st => hasLink({...st, relay: 'crate'});
  sync({animate: false});

  // ---- per frame: lamps, radio lines, dash screen, crew ---------------------------------------------------
  let screenClock = 0, lineKey = '';
  world.onFrame((dt, t) => {
    const st = s();
    if (beacon) beacon.emissiveIntensity = Math.sin(t * 2) > .6 ? 3 : .4;
    jin.update(dt); jin.face(player.position.x, player.position.z); jin.mode = st.phase === 'active' && st.at === 'base' ? 'idle' : 'wave';
    jin.model.position.y = groundHeight(jin.model.position.x, jin.model.position.z);
    roverAnt.rotation.y += dt * .3;
    workLight.intensity = st.at === 'hollow' && !driving ? 8 : 0;
    headlight.intensity = driving || st.at === 'hollow' ? 60 : 0;
    relayRing.material.opacity = st.relay === 'hand' && st.at === 'saddle' ? .55 + Math.sin(t * 4) * .3 : st.plan === 'relay' && st.relay !== 'ground' ? .35 : 0;
    ridgeLabel.visible = !(st.relay === 'ground' && st.relayAt === 'saddle');
    for (const [id, x] of Object.entries(xMarks)) { const want = id === 'a' ? st.cores === 0 : st.earthAsked && st.cores === 1; x.visible = want || (st.drill === 'ground' && st.drillAt === id); x.userData.mat.opacity = st.hand === 'drill' && want ? .6 + Math.sin(t * 5) * .3 : .5; }
    // Relay lamps and radio lines.
    const onGround = st.relay === 'ground' && st.legs, hops = relayHops(st, 'hollow');
    const color = !onGround ? 0x444444 : hops.base && hops.field ? 0x2bff86 : hops.base || hops.field ? 0xffb02e : 0xff5a4a;
    linkLamp.color.set(color); linkLamp.emissive?.set(color); linkLamp.emissiveIntensity = onGround ? 2.4 : .2;
    powerLamp.emissiveIntensity = onGround ? 1.8 + Math.sin(t * 3) * .6 : .1;
    setRelayStatus(onGround ? `${hops.base ? '🟢' : '🔴'} Base   ${hops.field ? '🟢' : '🔴'} Hollow · ${relayHeight(st).toFixed(1)} m` : '');
    const key = [st.relay, st.relayAt, st.legs, st.stages, st.aimed, st.at, driving, Math.round(relay.position.y * 10)].join();
    if (key !== lineKey && !driving) {
      lineKey = key;
      if (onGround) { const top = relayTop(); setLine(lines.base, baseAntPos(), top, hops.base); setLine(lines.field, top, roverTop('hollow'), hops.field); }
      else { lines.base.visible = lines.field.visible = false; }
      if (st.at === 'hollow') setLine(lines.direct, roverTop('hollow'), baseAntPos(), false); else lines.direct.visible = false;
      lines.direct.visible = st.at === 'hollow' && !hasLink(st);
    }
    if (driving) lines.direct.visible = false;
    screenClock += dt; if (screenClock > .3) { screenClock = 0; drawDash(st); }
  });
  function drawDash(st) {
    const {ctx, c, tex} = dash, W = c.width;
    ctx.fillStyle = '#071528'; ctx.fillRect(0, 0, W, c.height); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    const link = hasLink(st), home = batteryHome(st);
    ctx.font = '700 30px Fredoka Variable, system-ui'; ctx.fillStyle = link ? '#2bff86' : '#ff6a6a';
    ctx.fillText(link ? '📶 SIGNAL' : '📵 NO SIGNAL', 14, 10);
    ctx.fillStyle = '#ffd23f'; ctx.textAlign = 'right'; ctx.fillText(`🔋 ${st.battery}%`, W - 14, 10); ctx.textAlign = 'left';
    ctx.strokeStyle = '#cfe6ff'; ctx.lineWidth = 3; ctx.strokeRect(14, 56, W - 28, 30);
    ctx.fillStyle = st.battery - home < st.scenario.batteryReserve ? '#ff6a6a' : '#2bff86'; ctx.fillRect(17, 59, (W - 34) * st.battery / 100, 24);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(17 + (W - 34) * home / 100, 52, 3, 38);
    ctx.font = '600 22px Nunito Variable, system-ui'; ctx.fillStyle = '#cfe6ff';
    ctx.fillText(home ? `Need ${home}% to get home` : 'You are home', 14, 96);
    const unsent = st.messages.filter(m => m.status === 'queued').length;
    ctx.fillText(unsent ? `📦 ${unsent} data waiting to send` : `🧪 Cores: ${st.stowed}`, 14, 128);
    tex.needsUpdate = true;
  }

  // ---- guidance ----------------------------------------------------------------------------------------
  const guideTarget = () => {
    const st = s(); if (st.phase !== 'active' || !st.plan || driving) return null;
    if (st.hand === 'relay') return st.at === 'saddle' ? relayRing : cargoHit;
    if (st.hand === 'drill') { const want = st.cores === 0 ? 'a' : st.earthAsked && st.cores === 1 && !st.coreReady ? 'b' : null; return want && !(st.cores >= (st.earthAsked ? 2 : 1)) ? xMarks[want] : cargoHit; }
    if (st.hand === 'core') return boxHit;
    if (st.at === 'base') { if (st.stowed) return hatchHit; if (st.plan === 'relay' && st.relay === 'crate') return crateHit; return seatHit; }
    if (st.at === 'saddle') {
      if (st.stowed) return seatHit;
      if (st.plan === 'relay' && st.relay === 'rover') return cargoHit;
      if (st.relay === 'ground' && st.relayAt === 'saddle') { if (!st.legs) return relayHit; const h = relayHops(st, 'hollow'); if (!h.field && st.stages < st.scenario.relay.stages) return upHit; if (!st.aimed) return dishHit; }
      return seatHit;
    }
    if (st.coreReady) return coreHit;
    if (st.stowed > st.messages.length) return radioHit;
    if (st.drill === 'ground') return drillHit;
    if (st.cores < (st.earthAsked ? 2 : 1)) return cargoHit;
    return seatHit;
  };
  world.onFrame(() => world.guide(guideTarget(), .45));

  const getTargetPos = id => {
    try {
      if (id === 'hatch') return {x: 7.2, z: 0};
      const st = s();
      if (!st) return null;
      if (id === 'rover') {
        const v = new THREE.Vector3();
        rover.getWorldPosition(v);
        return {x: v.x, z: v.z};
      }
      if (id === 'relay') {
        const relaySpot = st.scenario?.stops?.[st.at]?.relaySpot;
        if (relaySpot) return {x: relaySpot.x, z: relaySpot.z};
        const v = new THREE.Vector3();
        (st.relay === 'crate' ? crate : relay).getWorldPosition(v);
        return {x: v.x, z: v.z};
      }
      if (id === 'drill') {
        const v = new THREE.Vector3();
        (st.drill === 'ground' ? drill : xMarks[st.earthAsked && st.cores ? 'b' : 'a']).getWorldPosition(v);
        return {x: v.x, z: v.z};
      }
    } catch {}
    return null;
  };
  const walkTargets = [
    {id: 'rover', label: '🚙 Rover', get x() { return getTargetPos('rover')?.x ?? null; }, get z() { return getTargetPos('rover')?.z ?? null; }},
    {id: 'relay', label: '📡 Relay / setup ring', get x() { return getTargetPos('relay')?.x ?? null; }, get z() { return getTargetPos('relay')?.z ?? null; }},
    {id: 'drill', label: '🔩 Drill / X', get x() { return getTargetPos('drill')?.x ?? null; }, get z() { return getTargetPos('drill')?.z ?? null; }},
    {id: 'hatch', label: '🚪 Base hatch', x: 7.2, z: 0},
  ];
  const worldOf = o => { const v = new THREE.Vector3(); o.getWorldPosition(v); return v; };
  return {world, sync, idle: () => syncQueue, drive, walkTargets, NEXT,
    walk(id) {
      if (id === 'hatch') return player.navigate({x: 7.2, z: 0}, worldOf(hatchHit));
      const st = s();
      const relaySpot = st.hand === 'relay' && st.scenario.stops[st.at].relaySpot;
      const roverTaskTarget = st.hand === 'core' ? boxHit
        : st.hand === 'drill' && st.cores >= (st.earthAsked ? 2 : 1) ? cargoHit
        : st.hand === 'relay' && !relaySpot ? cargoHit
        : st.stowed > st.messages.length ? radioHit
        : st.at === 'hollow' && st.drill === 'rover' && st.cores < (st.earthAsked ? 2 : 1) ? cargoHit
        : st.at !== 'base' && st.plan === 'relay' && st.relay === 'rover' && !st.hand ? cargoHit
        : seatHit;
      const target = id === 'rover' ? worldOf(roverTaskTarget) : id === 'relay' && relaySpot
        ? new THREE.Vector3(relaySpot.x, groundHeight(relaySpot.x, relaySpot.z), relaySpot.z)
        : id === 'relay' ? worldOf(st.relay === 'crate' ? crate : relay) : worldOf(st.drill === 'ground' ? drill : xMarks[st.earthAsked && st.cores ? 'b' : 'a']);
      const from = new THREE.Vector2(player.position.x - target.x, player.position.z - target.z);
      const bearing = from.length() < .01 ? 0 : Math.atan2(from.y, from.x);
      // Rover equipment sits inside its collision footprint. Try several safe
      // approach points so a blocked straight-line waypoint still routes around it.
      const radii = id === 'rover' ? [2.4, 2.2, 1.95] : [1.8, 2.05, 2.3];
      for (const radius of radii) for (const turn of [0, .7, -.7, 1.35, -1.35, 2.1, -2.1, Math.PI]) {
        const a = bearing + turn;
        if (player.navigate({x: target.x + Math.cos(a) * radius, z: target.z + Math.sin(a) * radius}, {x: target.x, z: target.z})) return true;
      }
      return false;
    },
    teleport(x, z, lookX, lookZ, pitch = -.2) { player.position.set(x, groundHeight(x, z) + 1.62, z); player.yaw = yawToward(lookX - x, lookZ - z); player.pitch = pitch; player.syncCamera(); },
    roverPosition: () => ({x: roverPos.x, z: roverPos.y, yaw: roverYaw}),
    /** Test helper: stand a short way from a thing and look at it. */
    near(id, d = 1.6, pitch = null) {
      const hits = {crate: crateHit, cargo: cargoHit, seat: seatHit, radio: radioHit, box: boxHit, ring: relayRing, relay: relayHit, mastUp: upHit, dish: dishHit, 'x:a': xMarks.a, 'x:b': xMarks.b, drill: drillHit, core: coreHit, hatch: hatchHit};
      const p = worldOf(hits[id]), v = new THREE.Vector2(player.position.x - p.x, player.position.z - p.z); if (v.length() < .01) v.set(1, 0); v.normalize();
      const x = p.x + v.x * d, z = p.z + v.y * d; this.teleport(x, z, p.x, p.z, pitch ?? Math.atan2(p.y - (groundHeight(x, z) + 1.62), d));
    },
  };
}
