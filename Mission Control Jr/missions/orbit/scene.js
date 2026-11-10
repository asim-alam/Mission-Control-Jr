// 3D view of "Arrival at Mars": the orbiter cabin, the radio rack, the power panel and the landing hologram.
import * as THREE from 'three';
import {createWorld, loadModel, part} from '../shared/engine.js';
import {missionAsset} from '../shared/assets.js';
import {makeCrew} from '../shared/crew.js';
import {LOADS} from './state.js';
import {powerUsed, powerAvailable, inShadow, testLights, hazardCamReady} from './actions.js';

const RACK = [-2.2, -1.55], PANEL = [1.2, -1.7], CASE = [-2.0, 1.55], TABLE = [3.0, .2];
const LED = {green: [0x2bff86, 1.8], red: [0xff3a3a, 2.2], off: [0x3a3020, .05], amber: [0xffb02e, 1.2]};

function marsTexture() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d');
  g.fillStyle = '#b5532c'; g.fillRect(0, 0, 512, 256);
  let a = 7; const rnd = () => (a = (a * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 260; i++) { const x = rnd() * 512, y = 20 + rnd() * 216, r = 6 + rnd() * 38; g.fillStyle = `rgba(${rnd() < .5 ? '90,40,25' : '220,140,90'},${.08 + rnd() * .18})`; g.beginPath(); g.ellipse(x, y, r * 1.6, r, 0, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = 'rgba(250,240,235,.85)'; g.fillRect(0, 0, 512, 12); g.fillRect(0, 246, 512, 10);
  g.strokeStyle = 'rgba(70,30,20,.5)'; g.lineWidth = 5; g.beginPath(); g.moveTo(150, 128); g.bezierCurveTo(220, 120, 280, 140, 340, 132); g.stroke(); // a long canyon
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export async function createArrivalScene({container, getState, act, onPause, openPart, openCase, openPlanner, openHatch, talk}) {
  const world = await createWorld({container, preset: 'interior', bounds: {minX: -4.5, maxX: 4.45, minZ: -1.25, maxZ: 1.25}, start: {x: 3.9, z: -.2, yaw: Math.PI / 2}, onPause});
  const {scene, player} = world, s = getState;
  const load = id => loadModel(missionAsset(id));
  const [cabin, rack, panel, planner, locker, spareAmp, tester, elena, jin] = await Promise.all(['orbiter-cabin', 'comm-rack', 'power-panel', 'landing-planner', 'spares-case', 'amp-module', 'signal-tester'].map(load).concat([makeCrew('elena'), makeCrew('jin')]));
  scene.add(cabin);
  world.place3d(rack, RACK[0], 0, RACK[1]); world.place3d(panel, PANEL[0], 0, PANEL[1]);
  world.place3d(locker, CASE[0], 0, CASE[1], Math.PI); world.place3d(planner, TABLE[0], 0, TABLE[1], -Math.PI / 2);
  const cabinLights = []; for (const x of [-3.5, -1, 1.5, 4]) { const l = new THREE.PointLight(0xfff0dc, 2.4, 7, 1.6); l.position.set(x, 2.3, 0); scene.add(l); cabinLights.push(l); }
  const strips = []; part(cabin, 'ceiling_lights').traverse(o => { if (o.isMesh) strips.push(o.material); });
  const amberLamps = []; part(cabin, 'shadow_lamp').traverse(o => { if (o.isMesh) amberLamps.push(o.material); });
  const glass = []; part(cabin, 'window').traverse(o => { if (o.isMesh && o.material.name === 'glass') glass.push(o.material); });

  // Outside the window: Mars, the Sun's light on it and some stars.
  const sun = new THREE.DirectionalLight(0xfff2e0, 2.2); sun.position.set(-20, 30, 40); sun.target.position.set(-38, -8, 0); scene.add(sun, sun.target);
  const marsMat = new THREE.MeshStandardMaterial({map: marsTexture(), roughness: 1});
  const mars = new THREE.Mesh(new THREE.SphereGeometry(22, 48, 32), marsMat); mars.position.set(-38, -8, 0); mars.rotation.z = .3; scene.add(mars);
  const glow = new THREE.Mesh(new THREE.SphereGeometry(22.6, 32, 20), new THREE.MeshBasicMaterial({color: 0xff9a5a, transparent: true, opacity: .12, side: THREE.BackSide})); mars.add(glow);
  const starGeo = new THREE.BufferGeometry(), sp = [];
  for (let i = 0; i < 500; i++) { const v = new THREE.Vector3().randomDirection().multiplyScalar(300); if (v.x > -30) v.x = -30 - Math.random() * 200; sp.push(v.x, v.y, v.z); }
  starGeo.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({color: 0xffffff, size: 1.4, sizeAttenuation: false})));

  // Crew.
  scene.add(elena.model, jin.model); elena.teleport(3.2, -1.0, -Math.PI / 2); jin.teleport(-1.1, -.7, Math.PI * .8); jin.mode = 'work';

  // ---- radio rack parts -----------------------------------------------------------------
  const leds = Object.fromEntries(['feed', 'amp', 'card', 'radio'].map(st => [st, part(rack, `led_${st}`).material]));
  const feedPlug = part(rack, 'feed_plug'), ampSlot = part(rack, 'amp_slot'), oldAmp = part(rack, 'amp_module'), card = part(rack, 'controller_card');
  const testBtn = part(rack, 'test_button'), port = part(rack, 'tester_port'), radioScreen = part(rack, 'radio_screen').material;
  const plugHome = feedPlug.position.clone(), cardHome = card.position.clone();
  const smokeAt = new THREE.Vector3(); part(rack, 'smoke_point').getWorldPosition(smokeAt);
  const smoke = world.particles({count: 50, color: 0x6a6a6a, size: .07, opacity: .5, gravity: .25, life: [1.2, 2], spawn(p, v) { p.copy(smokeAt).add(new THREE.Vector3((Math.random() - .5) * .3, 0, 0)); v.set((Math.random() - .5) * .05, .12, .05); }});
  const sparkAt = new THREE.Vector3();
  const sparks = world.particles({count: 80, color: 0xfff1a8, size: .04, additive: true, gravity: -4, life: [.25, .5], spawn(p, v) { p.copy(sparkAt); v.set((Math.random() - .5) * 2, Math.random() * 1.5, Math.random()); }});
  // Locker contents.
  const slotAmp = part(locker, 'slot_amp'), slotTester = part(locker, 'slot_tester'), lockerDoor = part(locker, 'case_door');
  slotAmp.add(spareAmp); slotTester.add(tester);
  // Power panel.
  const toggles = Object.fromEntries(LOADS.map(l => [l, part(panel, `toggle_${l}`)]));
  const lamps = Object.fromEntries(LOADS.map(l => [l, part(panel, `lamp_${l}`).material]));
  const mainLamp = part(panel, 'main_lamp').material, needle = part(panel, 'power_needle'), mark = part(panel, 'budget_mark'), breaker = part(panel, 'main_breaker');
  for (const l of LOADS) { const lab = world.sign(`${s().scenario.loads[l].icon}${s().scenario.loads[l].units}`, {width: .17, font: 48}); part(panel, `label_${l}`).add(lab); }
  const panelSign = world.sign('⚡ POWER PANEL', {width: .9}); panelSign.position.set(PANEL[0], 2.28, PANEL[1] + .1); scene.add(panelSign);
  const rackSign = world.sign('📻 RADIO RACK', {width: .9}); rackSign.position.set(RACK[0], 2.15, RACK[1] + .3); scene.add(rackSign);
  const lockerSign = world.sign('🧰 SPARES', {width: .7}); lockerSign.position.set(CASE[0], 1.9, CASE[1] - .3); scene.add(lockerSign);
  const tableSign = world.sign('🗺️ LANDING PLANNER', {width: 1.1}); tableSign.position.set(TABLE[0], 2.05, TABLE[1]); scene.add(tableSign);
  const hatchSign = world.sign('🚀 LANDER HATCH', {width: .9}); hatchSign.position.set(4.8, 2.2, 0); scene.add(hatchSign);

  // ---- landing hologram: shows the chosen (or first) site large, with its ellipse and rocks --------
  const holo = part(planner, 'holo_surface'), holoRing = part(planner, 'holo_ring').material;
  const map = new THREE.Group(); holo.add(map);
  const holoMat = (color, opacity = .6) => new THREE.MeshBasicMaterial({color, transparent: true, opacity, depthWrite: false});
  const ground = new THREE.Mesh(new THREE.CircleGeometry(.62, 48), holoMat(0xc56a3c, .55)); ground.rotation.x = -Math.PI / 2; map.add(ground);
  const safe = new THREE.Mesh(new THREE.CircleGeometry(1, 40), holoMat(0x3fe08a, .45)); safe.rotation.x = -Math.PI / 2; safe.position.y = .004; map.add(safe);
  const ellipse = new THREE.Mesh(new THREE.RingGeometry(.97, 1, 64), holoMat(0xffe14a, .95)); ellipse.rotation.x = -Math.PI / 2; ellipse.position.y = .008; map.add(ellipse);
  const rocks = new THREE.Group(); map.add(rocks);
  const rockGeo = new THREE.DodecahedronGeometry(.018), rockMat = holoMat(0x5b2a17, .9), duneMat = holoMat(0xe0a060, .8);
  const baseMark = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .05, 12), holoMat(0x4cc9ff, .95)); map.add(baseMark);
  const lander = new THREE.Mesh(new THREE.ConeGeometry(.025, .06, 10), holoMat(0xffffff, 1)); lander.visible = false; map.add(lander);
  const R = .55; // hologram radius for the full (no beacon) ellipse
  let shownSite = null;
  function buildSite(id) {
    shownSite = id; const site = s().scenario.sites[id];
    rocks.clear(); let a = id.length * 977;
    const rnd = () => (a = (a * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < (id === 'plains' ? 6 : 70); i++) {
      const ang = rnd() * Math.PI * 2, r = (site.safe + .04 + rnd() * (1.05 - site.safe)) * R;
      if (r > .6) continue;
      const m = new THREE.Mesh(rockGeo, id === 'ridge' ? duneMat : rockMat); m.position.set(Math.cos(ang) * r, .012, Math.sin(ang) * r * .55); m.scale.setScalar(.7 + rnd() * 1.4);
      if (id === 'ridge') m.scale.set(2.4, .5, 1); rocks.add(m);
    }
    const bx = id === 'pad' ? .08 : id === 'ridge' ? .5 : .62; baseMark.position.set(Math.min(.6, bx), .03, 0); baseMark.visible = id !== 'plains';
  }
  function placeLanding(L) {
    const r = L.finalRel * R; lander.position.set(Math.cos(L.angle) * r, .03, Math.sin(L.angle) * r * .55);
  }

  // ---- interactions ------------------------------------------------------------------------
  const playing = () => s().phase === 'active' && s().stage !== 'descent';
  const sc = () => s().scenario;
  for (const l of LOADS) {
    world.register({id: `switch:${l}`, object: part(panel, `switch_${l}`), range: 2.1, enabled: playing,
      label: () => { const L = sc().loads[l]; return L.locked ? `${L.icon} ${L.label}: always on (${L.units} units)` : `${L.icon} ${L.label} (${L.units} units): ${s().loads[l] ? 'ON → switch off' : 'OFF → switch on'}`; },
      onUse: () => act({id: 'toggleLoad', targetId: l})});
  }
  world.register({id: 'breaker', object: breaker, range: 2.1, holdSeconds: 1, enabled: () => playing() && s().tripped, label: () => 'Hold E: reset the main breaker', onUse: () => act({id: 'resetBreaker'})});
  world.register({id: 'gauge', object: part(panel, 'power_gauge'), range: 2.4, enabled: playing,
    label: () => `Power: ${powerUsed(s())} of ${powerAvailable(s())} units${inShadow(s()) ? ' (in Mars’ shadow)' : ''}`, onUse: () => world.onInspect?.(`⚡ Using ${powerUsed(s())} of ${powerAvailable(s())} power units. In Mars’ shadow there are only ${sc().power.shadow}.`)});
  world.register({id: 'test', object: testBtn, range: 2.1, enabled: playing, label: () => s().comms ? 'Radio works! Call the base again' : 'Press: test the radio', onUse: () => { world.tween(.25, t => { testBtn.position.z = .33 - Math.sin(t * Math.PI) * .02; }); act({id: 'testSignal'}); }});
  for (const [pid, object] of [['feed', feedPlug], ['amp', oldAmp], ['card', card]]) {
    world.register({id: `part:${pid}`, object, range: 2.1, enabled: () => playing() && !(s().fixed && s().fault === pid),
      label: () => `${sc().parts[pid].label[0].toUpperCase()}${sc().parts[pid].label.slice(1)}: look or fix`, onUse: () => openPart(pid)});
  }
  world.register({id: 'port', object: port, range: 2.1, enabled: () => playing() && s().holding === 'tester', label: () => 'Clip the signal tester on here', onUse: () => act({id: 'clipTester'})});
  world.register({id: 'locker', object: lockerDoor, range: 2.2, enabled: playing, label: () => s().holding ? 'Put it back in the spares locker' : 'Open the spares locker', onUse: openCase});
  world.register({id: 'planner', object: part(planner, 'planner_screen'), range: 2.4, enabled: playing, label: () => 'Plan the landing', onUse: openPlanner});
  world.register({id: 'holo', object: ground, range: 1.9, enabled: playing, label: () => 'Plan the landing', onUse: openPlanner});
  world.register({id: 'hatch', object: part(cabin, 'hatch_wheel'), range: 2.2, enabled: playing, label: () => s().site ? 'Open the hatch and get in the lander' : 'Lander hatch (pick a landing site first)', onUse: openHatch});
  world.register({id: 'elena', object: elena.model, range: 2.2, enabled: playing, label: () => 'Talk to Elena', onUse: () => talk('elena')});
  world.register({id: 'jin', object: jin.model, range: 2.2, enabled: playing, label: () => 'Talk to Jin', onUse: () => talk('jin')});
  world.register({id: 'window', object: part(cabin, 'window'), range: 3, enabled: playing, label: () => 'Look at Mars', onUse: () => talk('window')});

  player.obstacles = [
    {minX: RACK[0] - .65, maxX: RACK[0] + .65, minZ: -1.8, maxZ: RACK[1] + .3}, {minX: CASE[0] - .6, maxX: CASE[0] + .6, minZ: CASE[1] - .3, maxZ: 1.8},
    {minX: TABLE[0] - .8, maxX: TABLE[0] + .8, minZ: TABLE[1] - .8, maxZ: TABLE[1] + .8},
  ];

  // ---- per-frame look ------------------------------------------------------------------------
  let zapTime = 0, shake = 0, descent = 0;
  const setLed = (m, kind, t) => { const [c, i] = LED[kind]; m.color.setHex(c); m.emissive.setHex(c); m.emissiveIntensity = kind === 'red' ? i * (.6 + .4 * Math.sin(t * 8)) : i; };
  world.onFrame((dt, t) => {
    const st = s(), shade = inShadow(st), lights = testLights(st);
    for (const [k, m] of Object.entries(leds)) setLed(m, lights[k], t);
    radioScreen.emissive.setHex(st.comms ? 0x2bff86 : st.tripped || !st.loads.radio ? 0x000000 : 0x2fd3c0); radioScreen.emissiveIntensity = st.comms ? .9 + .2 * Math.sin(t * 3) : .5;
    feedPlug.position.copy(plugHome); if (st.fault === 'feed' && !st.fixed) { feedPlug.position.x += .05; feedPlug.rotation.x = .25; } else feedPlug.rotation.x = 0;
    card.position.copy(cardHome); if (st.fault === 'card' && !st.fixed) card.position.z += .05;
    if (st.fault === 'card' && !st.fixed) card.traverse(o => { if (o.isMesh && o.material.name === 'signal-green') { o.material.emissive?.setHex(0x2bff86); o.material.emissiveIntensity = Math.sin(t * 10) > 0 ? .8 : 0; } });
    smoke.rate = st.fault === 'amp' && !st.fixed && st.loads.amp && !st.tripped ? 6 : 0;
    oldAmp.traverse(o => { if (o.isMesh && st.fault === 'amp' && !st.fixed) o.material.color.setHex(o.material.name === 'aluminium' ? 0x6a5a50 : 0x3a3330); });
    // Where the tester and the spare amplifier are.
    const wantTester = st.tester === 'hand' ? world.hand : st.tester === 'rack' ? port : slotTester;
    if (tester.parent !== wantTester) { wantTester.add(tester); tester.position.set(...(st.tester === 'hand' ? [-.05, -.05, 0] : [0, 0, 0])); tester.rotation.set(0, st.tester === 'rack' ? Math.PI / 2 : 0, 0); tester.scale.setScalar(st.tester === 'hand' ? .9 : 1); }
    const wantAmp = st.spareAmp === 'hand' ? world.hand : st.spareAmp === 'rack' ? ampSlot : slotAmp;
    if (spareAmp.parent !== wantAmp) { wantAmp.add(spareAmp); spareAmp.position.set(...(st.spareAmp === 'hand' ? [-.1, -.1, 0] : st.spareAmp === 'rack' ? [0, -.13, .04] : [0, 0, 0])); spareAmp.rotation.set(0, 0, 0); spareAmp.scale.setScalar(st.spareAmp === 'hand' ? .6 : 1); }
    oldAmp.visible = st.spareAmp !== 'rack';
    lockerDoor.rotation.y += ((st.holding || st.tester === 'hand' ? -1.6 : 0) - lockerDoor.rotation.y) * Math.min(1, dt * 5);
    // Power panel.
    for (const l of LOADS) { toggles[l].rotation.x += ((st.loads[l] ? -.5 : .5) - toggles[l].rotation.x) * Math.min(1, dt * 10); setLed(lamps[l], st.loads[l] ? 'green' : 'off', t); }
    setLed(mainLamp, st.tripped ? 'red' : 'green', t);
    const ang = v => Math.PI / 2 - Math.min(13, v) / 13 * Math.PI;
    needle.rotation.z += (ang(powerUsed(st)) - needle.rotation.z) * Math.min(1, dt * 6); mark.rotation.z = ang(powerAvailable(st));
    // Cabin lights: dim when the breaker is off; amber lamps in Mars' shadow; frost when cold.
    const dim = st.tripped ? .25 : 1;
    for (const l of cabinLights) l.intensity += (2.4 * dim - l.intensity) * Math.min(1, dt * 4);
    for (const m of strips) m.emissiveIntensity = 2.2 * dim;
    for (const m of amberLamps) m.emissiveIntensity = shade ? 1.4 + .3 * Math.sin(t * 2) : 0;
    for (const m of glass) { m.color.setHex(shade && !st.loads.heat ? 0xe8f4ff : 0xa9dcff); m.opacity = shade && !st.loads.heat ? .55 : .32; }
    // Mars in shadow: night side faces us.
    sun.intensity += ((shade ? .05 : 2.2) - sun.intensity) * Math.min(1, dt * 2);
    mars.rotation.y += dt * .01;
    // Hologram.
    const id = st.site || 'pad'; if (id !== shownSite) buildSite(id);
    const site = st.scenario.sites[id], shrink = st.comms ? st.scenario.beaconShrink : 1;
    safe.scale.set(Math.min(site.safe, 1.08) * R, Math.min(site.safe, 1.08) * R * .55, 1);
    const target = shrink * R; ellipse.scale.x += (target - ellipse.scale.x) * Math.min(1, dt * 3); ellipse.scale.y = ellipse.scale.x * .55;
    ellipse.material.color.setHex(st.site ? 0xffe14a : 0x9aa8b8);
    holoRing.emissive.setHex(hazardCamReady(st) ? 0x2bff86 : 0xffb02e);
    map.rotation.y += dt * .05;
    if (st.landing) { placeLanding(st.landing); lander.visible = true; lander.position.y = .03 + (1 - descent) * .5; lander.material.color.setHex(descent >= 1 ? (st.landing.rough ? 0xff4a4a : 0x2bff86) : 0xffffff); } else lander.visible = false;
    // Effects.
    if (zapTime > 0) { zapTime -= dt; sparks.rate = 160; } else sparks.rate = 0;
    if (shake > 0) { shake = Math.max(0, shake - dt); world.camera.position.x += (Math.random() - .5) * shake * .05; world.camera.position.y += (Math.random() - .5) * shake * .05; }
    elena.update(dt); jin.update(dt);
  });

  function zap(pid) { ({feed: feedPlug, amp: oldAmp, card})[pid].getWorldPosition(sparkAt); zapTime = .5; shake = .4; }
  /** Undock and fly down: Mars grows in the window, the hologram lander drops to its spot. */
  async function fly() {
    player.position.set(1.6, 1.62, .2); player.yaw = Math.PI / 2; player.pitch = -.05; player.syncCamera();
    const from = mars.position.clone();
    await world.tween(4, t => { mars.position.lerpVectors(from, new THREE.Vector3(-26, -12, 0), t); glow.material.opacity = .12 + Math.sin(t * Math.PI) * .5; shake = Math.sin(t * Math.PI) * .6; descent = t * .8; });
    player.position.set(1.9, 1.62, .2); player.yaw = -Math.PI / 2; player.pitch = -.55; player.syncCamera();
    await world.tween(2.2, t => { descent = .8 + t * .2; });
    shake = s().landing?.rough ? 1.4 : .3; descent = 1;
    await new Promise(r => setTimeout(r, 900));
  }

  const guideTarget = () => {
    const st = s(); if (!playing()) return null;
    if (st.tripped) return breaker;
    if (st.holding === 'tester') return port;
    if (st.holding === 'amp') return st.loads.amp ? toggles.amp.parent : oldAmp;
    if (!st.comms) {
      if (st.fixed || st.diagnosed) { const p = st.fixed ? null : st.scenario.parts[st.diagnosed]; if (p && st.loads[p.load]) return toggles[p.load].parent; if (st.fixed) { const off = st.scenario.testNeeds.find(l => !st.loads[l]); return off ? toggles[off].parent : testBtn; } return st.diagnosed === 'amp' ? lockerDoor : ({feed: feedPlug, card})[st.diagnosed]; }
      const need = st.scenario.testNeeds.find(l => !st.loads[l]); return need ? toggles[need].parent : testBtn;
    }
    return st.site ? part(cabin, 'hatch_wheel') : ground;
  };
  world.onFrame(() => world.guide(guideTarget(), .35));

  return {world, zap, fly,
    walkTargets: [{id: 'rack', label: '📻 Radio rack', x: RACK[0], z: -.6}, {id: 'panel', label: '⚡ Power panel', x: PANEL[0], z: -.7}, {id: 'locker', label: '🧰 Spares', x: CASE[0], z: .5},
      {id: 'planner', label: '🗺️ Planner', x: TABLE[0] - 1.1, z: TABLE[1]}, {id: 'hatch', label: '🚀 Hatch', x: 4.2, z: -.6}, {id: 'window', label: '🪐 Window', x: -3.8, z: 0}],
    walk(id) {
      const t = this.walkTargets.find(w => w.id === id); if (!t) return;
      const look = {rack: {x: RACK[0], z: -1.8}, panel: {x: PANEL[0], z: -1.8}, locker: {x: CASE[0], z: 1.8}, planner: {x: TABLE[0], z: TABLE[1]}, hatch: {x: 5, z: 0}, window: {x: -5, z: 0}}[id];
      player.navigate({x: t.x, z: t.z}, look);
    }};
}
