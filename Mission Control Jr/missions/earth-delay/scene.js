// 3D view of "Message to Earth": a service module with a broken water recycler, a spare-parts shelf,
// a save-water switch and the Earth-link console whose screen shows the message crossing space.
import * as THREE from 'three';
import {createWorld, loadModel, part} from '../shared/engine.js';
import {missionAsset} from '../shared/assets.js';
import {makeCrew} from '../shared/crew.js';
import {PARTS} from './state.js';
import {messageProgress, PART_NAMES, knownBad, earthKnows} from './actions.js';

const MODEL = {pump: 'pump-motor', valve: 'check-valve', filter: 'filter-cartridge'};
const HOLD = {meter: {scale: 2.2, offset: [-.02, -.05, -.1], rotation: [.35, -.25, 0]}, pump: {scale: 1.1, offset: [-.04, -.12, 0], rotation: [0, -.6, 0]},
  valve: {scale: 1.4, offset: [-.04, -.08, 0], rotation: [0, -.3, 0]}, filter: {scale: 1.1, offset: [-.04, -.1, 0], rotation: [0, 0, 0]}};
const SOCKET_ROT = {pump: [0, 0, 0], valve: [0, 0, 0], filter: [0, 0, 0]};

function canvasScreen(mesh, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  mesh.material.map = tex; mesh.material.emissiveMap = tex; mesh.material.emissive.set(0xffffff); mesh.material.emissiveIntensity = .9; mesh.material.color.set(0xffffff); mesh.material.needsUpdate = true;
  return {ctx, c, tex};
}
const mmss = s => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0')}`;

export async function createDelayScene({container, getState, act, onPause, onConsole}) {
  const world = await createWorld({container, preset: 'interior', bounds: {minX: -6.4, maxX: 6.4, minZ: -3.9, maxZ: 3.9}, start: {x: 5.2, z: 0, yaw: Math.PI / 2}, onPause});
  const {scene, player} = world, s = () => getState();
  const load = id => loadModel(missionAsset(id));
  const [hab, recycler, shelf, panelM, consoleM, tank, meter, elena, luca] = await Promise.all(
    ['hab-service-interior', 'water-recycler', 'parts-shelf', 'utility-panel', 'earth-link-console', 'greenhouse-water-tank', 'multimeter'].map(load).concat([makeCrew('elena'), makeCrew('luca')]));
  scene.add(hab);
  player.cameraObjects = [hab, recycler, shelf, panelM, consoleM, tank];
  world.place3d(recycler, -1.8, 0, -4.1); world.place3d(shelf, 1.5, 0, -4.15); world.place3d(panelM, -4.4, 0, -4.38);
  world.place3d(consoleM, 3.6, 0, 3.55, Math.PI); world.place3d(tank, -5.8, 0, -3.5);
  for (const x of [-4.5, 0, 4.5]) { const l = new THREE.PointLight(0xfff0dc, 2.6, 9, 1.6); l.position.set(x, 3.4, 0); scene.add(l); }
  const workLamp = new THREE.SpotLight(0xffffff, 6, 6, .6, .5, 1.5); workLamp.position.set(-1.8, 2.9, -2.2); workLamp.target.position.set(-1.8, .9, -4); scene.add(workLamp, workLamp.target);
  world.key.position.set(2, 9, 4); world.key.target.position.set(-1, 0, -2);
  const strips = []; hab.traverse(o => { if (o.isMesh && o.material.name === 'light-strip') strips.push(o.material); });
  player.obstacles = [{minX: -2.75, maxX: -.85, minZ: -4.6, maxZ: -3.65}, {minX: .65, maxX: 2.35, minZ: -4.6, maxZ: -3.85}, {minX: 2.7, maxX: 4.5, minZ: 3.1, maxZ: 4.2},
    {minX: -6.6, maxX: -5.0, minZ: -4.4, maxZ: -2.7}, {minX: -7, maxX: -2.9, minZ: 3.7, maxZ: 4.6}];

  // ---- recycler parts in their sockets ---------------------------------------------------
  const sockets = Object.fromEntries(PARTS.map(p => [p, part(recycler, `${p}_socket`)]));
  const installed = {}, spares = {pump: [], valve: [], filter: []};
  for (const p of PARTS) { installed[p] = await load(MODEL[p]); installed[p].userData.kind = p; sockets[p].add(installed[p]); installed[p].rotation.set(...SOCKET_ROT[p]); }
  const hit = new THREE.MeshBasicMaterial({transparent: true, opacity: 0, depthWrite: false});
  for (const p of PARTS) { const h = new THREE.Mesh(new THREE.BoxGeometry(.36, .42, .3), hit); h.name = `hit_${p}`; sockets[p].add(h); }
  const shelfSpots = {pump: ['spare_pump'], valve: ['spare_valve'], filter: ['spare_filter_1', 'spare_filter_2']};
  for (const p of PARTS) for (let i = 0; i < s().scenario.spares[p]; i++) { const m = await load(MODEL[p]); part(shelf, shelfSpots[p][i]).add(m); m.userData.kind = p; spares[p].push(m); }
  part(shelf, 'meter_hook').add(meter); meter.rotation.set(0, 0, 0);
  const junk = new THREE.Group(); junk.position.set(-.5, 0, -3.2); scene.add(junk); let junkCount = 0;

  const door = part(recycler, 'access_panel'), bolts = [1, 2, 3, 4].map(i => part(recycler, `bolt_${i}`)), lever = part(recycler, 'power_lever');
  const lamp = part(recycler, 'status_lamp'), flow = part(recycler, 'flow_water'), outlet = part(recycler, 'outlet');
  const lampMat = lamp.children[0]?.material || lamp.getObjectByProperty('isMesh', true).material;
  const lampHit = new THREE.Mesh(new THREE.SphereGeometry(.16, 10, 8), hit); lamp.add(lampHit);
  const leverHit = new THREE.Mesh(new THREE.BoxGeometry(.24, .4, .2), hit); leverHit.position.y = .1; lever.add(leverHit);
  const saveSwitch = part(panelM, 'save_switch'), needle = part(panelM, 'gauge_needle'), saveLamp = part(panelM, 'save_lamp').getObjectByProperty('isMesh', true).material;
  const level = part(tank, 'level');
  const screen = canvasScreen(part(consoleM, 'screen').getObjectByProperty('isMesh', true), 1024, 600);
  const lcd = canvasScreen(part(meter, 'meter_screen').getObjectByProperty('isMesh', true), 256, 146);
  const antenna = part(consoleM, 'antenna_lamp').getObjectByProperty('isMesh', true).material;

  // Crew: Elena watches the Earth link, Luca keeps the water tank company.
  scene.add(elena.model, luca.model); elena.teleport(2.7, 2.6, Math.PI * .75); elena.mode = 'idle'; luca.teleport(-4.6, -2.3, -.4); luca.mode = 'idle';
  const sign = (text, x, y, z, w = 1.2) => { const sp = world.sign(text, {width: w}); sp.position.set(x, y, z); scene.add(sp); return sp; };
  sign('💧 Water recycler', -1.8, 2.45, -3.7, 1.5); sign('🧰 Spare parts', 1.5, 2.05, -3.9, 1.3); sign('🚿 Save water', -4.4, 2.1, -4.1, 1.2); sign('📡 Earth link', 3.6, 2.45, 3.4, 1.3);

  // ---- interactions ------------------------------------------------------------------------
  const active = () => s().phase === 'active' && !!s().plan;
  const hs = s().scenario.holdSeconds;
  world.register({id: 'lever', object: lever, range: 2.2, enabled: () => active() && !s().fixed, label: () => s().power ? 'Turn the power OFF (safety first)' : 'Turn the power back ON', onUse: () => act({id: 'togglePower'})});
  world.register({id: 'panel', object: door, range: 2.2, enabled: () => active() && !s().fixed && !s().power && (s().panel === 'closed' || !s().holding || s().holding === 'meter'),
    holdSeconds: () => s().panel === 'closed' ? hs.openPanel : hs.closePanel,
    label: () => s().panel === 'closed' ? 'Hold E: unscrew the bolts and open the panel' : 'Hold E: close the panel and screw it shut',
    onHold: p => { if (s().panel === 'closed') bolts.forEach((b, i) => { b.rotation.z = -p * 18; b.position.z = .03 + p * .05; }); },
    onUse: () => act({id: s().panel === 'closed' ? 'openPanel' : 'closePanel'})});
  for (const p of PARTS) {
    world.register({id: `part:${p}`, object: sockets[p], range: 2.2, enabled: () => active() && !s().fixed && s().panel === 'open' && (s().holding === p || (p === 'filter' ? !s().holding || s().holding === 'meter' : s().holding === 'meter')),
      holdSeconds: () => s().holding === p ? hs.swap : p === 'filter' ? hs.inspect : hs.test,
      label: () => s().holding === p ? `Hold E: swap in the new ${PART_NAMES[p]}` : p === 'filter' ? 'Hold E: pull out the filter and look at it' : `Hold E: test the ${PART_NAMES[p]} with the meter`,
      onHold: prog => { if (p === 'filter' && s().holding !== p) installed.filter.position.z = Math.sin(prog * Math.PI) * .25; },
      onUse: () => act({id: s().holding === p ? 'swap' : p === 'filter' ? 'inspect' : 'test', targetId: p})});
  }
  world.register({id: 'testRun', object: lamp, range: 2.4, enabled: () => active() && !s().fixed && s().power && s().panel === 'closed', label: () => 'Press the lamp: do a test run', onUse: () => act({id: 'testRun'})});
  world.register({id: 'meter', object: meter, range: 2.3, enabled: () => active() && !s().fixed && s().holding !== 'meter' && meter.parent !== world.hand, label: () => 'Take the multimeter', onUse: () => act({id: 'takeMeter'})});
  for (const p of PARTS) spares[p].forEach((m, i) => world.register({id: `spare:${p}:${i}`, object: m, range: 2.3,
    enabled: () => active() && !s().fixed && m.parent && m.parent !== world.hand && spareShown(p) > i && (!s().holding || s().holding === 'meter'),
    label: () => `Take the spare ${PART_NAMES[p]}${knownBad(s()).includes(p) ? ' ✔' : ''}`, onUse: () => act({id: 'takeSpare', targetId: p})}));
  world.register({id: 'save', object: saveSwitch, range: 2.2, enabled: active, label: () => s().saveMode ? 'Turn save-water mode OFF' : 'Turn save-water mode ON', onUse: () => act({id: 'toggleSave'})});
  world.register({id: 'console', object: consoleM, range: 2.6, enabled: active, label: () => 'Use the Earth link', onUse: onConsole});
  function spareShown(p) { return spares[p].filter(m => m.parent && m.parent !== world.hand && m.parent !== junk && !Object.values(sockets).includes(m.parent)).length; }

  // ---- state → view -------------------------------------------------------------------------
  let shown = {holding: null, panel: 'closed', swaps: 0, testRuns: 0, power: true};
  function spareFor(p) { return spares[p].find(m => m.parent && m.parent !== world.hand && m.parent !== junk && !Object.values(sockets).includes(m.parent)); }
  let syncQueue = Promise.resolve();
  const sync = opts => (syncQueue = syncQueue.then(() => doSync(opts)).catch(e => console.error(e)));
  const original = {...installed}; let shownMission = null;
  // A new mission object (retry, restart, new plan) puts every part back where it started.
  function resetView() {
    world.release();
    for (const p of PARTS) {
      const o = original[p]; sockets[p].add(o); o.position.set(0, 0, 0); o.rotation.set(...SOCKET_ROT[p]); o.scale.setScalar(1); installed[p] = o;
      spares[p].forEach((m, i) => { part(shelf, shelfSpots[p][i]).add(m); m.position.set(0, 0, 0); m.rotation.set(0, 0, 0); m.scale.setScalar(1); });
    }
    for (const m of [...Object.values(original), ...Object.values(spares).flat()]) m.traverse(o => { if (['scorch', 'grime', 'stuck_flag'].includes(o.name)) o.visible = false; });
    part(shelf, 'meter_hook').add(meter); meter.position.set(0, 0, 0); meter.rotation.set(0, 0, 0); meter.scale.setScalar(1);
    junk.clear(); junkCount = 0; running = 0; runResult = null; door.rotation.y = 0; bolts.forEach(b => { b.visible = true; b.rotation.z = 0; });
    shown = {holding: null, panel: 'closed', swaps: 0, testRuns: 0, power: true};
  }
  async function doSync({animate = true} = {}) {
    const st = s();
    if (shownMission !== st) { if (shownMission) { resetView(); animate = false; } shownMission = st; }
    // Panel door and bolts.
    if (shown.panel !== st.panel) {
      const open = st.panel === 'open', from = door.rotation.y, to = open ? -2.55 : 0;
      if (animate) await world.tween(.7, t => { door.rotation.y = from + (to - from) * t; }); else door.rotation.y = to;
      bolts.forEach(b => { b.visible = !open; b.rotation.z = 0; b.position.z = .03; }); shown.panel = st.panel;
    }
    // Swaps: old part to the junk pile, the held spare into the socket.
    while (shown.swaps < st.swaps.length) {
      const w = st.swaps[shown.swaps]; shown.swaps++;
      const old = installed[w.part], fresh = world.held && world.held.userData.kind === w.part ? world.held : spareFor(w.part);
      const spot = new THREE.Group(); spot.position.set((junkCount % 3) * .35 - .35, .02, Math.floor(junkCount / 3) * .3); spot.rotation.set(0, junkCount * 1.3, Math.PI / 2); junk.add(spot); junkCount++;
      const scorch = old.getObjectByName('scorch'); if (scorch) scorch.visible = w.needed && w.part === 'pump';
      const grime = old.getObjectByName('grime'); if (grime) grime.visible = w.needed;
      if (animate) await world.place(old, spot, {seconds: .5, arc: .5}); else { spot.add(old); old.position.set(0, 0, 0); old.rotation.set(0, 0, 0); }
      if (fresh) { if (animate) await world.place(fresh, sockets[w.part], {seconds: .55, arc: .2}); else { sockets[w.part].add(fresh); fresh.position.set(0, 0, 0); fresh.rotation.set(0, 0, 0); fresh.scale.setScalar(1); } fresh.rotation.set(...SOCKET_ROT[w.part]); installed[w.part] = fresh; }
      fresh?.traverse(o => { if (['scorch', 'grime', 'stuck_flag'].includes(o.name)) o.visible = false; });
    }
    // Hands.
    if (shown.holding !== st.holding) {
      const prev = shown.holding; shown.holding = st.holding;
      if (prev === 'meter' && st.holding !== 'meter') { if (animate) world.place(meter, part(shelf, 'meter_hook'), {seconds: .4}); else { part(shelf, 'meter_hook').add(meter); meter.position.set(0, 0, 0); meter.rotation.set(0, 0, 0); meter.scale.setScalar(1); } }
      if (prev && prev !== 'meter' && world.held?.userData.kind === prev) { const m = world.held; const slot = shelfSpots[prev].map(n => part(shelf, n)).find(n => !n.children.some(c => c.isGroup && c.userData.kind)); world.place(m, slot || part(shelf, shelfSpots[prev][0]), {seconds: .4}); }
      if (st.holding === 'meter') world.hold(meter, HOLD.meter);
      else if (st.holding && st.holding !== 'meter') { const m = spareFor(st.holding); if (m) world.hold(m, HOLD[st.holding]); }
    }
    // Findings show on the parts themselves.
    for (const p of PARTS) {
      const m = installed[p], bad = st.findings[p] === 'bad' && st.health[p] !== 'ok' && st.health[p] !== 'clean';
      const scorch = m.getObjectByName('scorch'), grime = m.getObjectByName('grime'), flag = m.getObjectByName('stuck_flag');
      if (scorch) scorch.visible = bad; if (grime) grime.visible = bad; if (flag) flag.visible = bad;
    }
  }
  // Hide fault marks until the player finds them.
  for (const p of PARTS) installed[p].traverse(o => { if (['scorch', 'grime', 'stuck_flag'].includes(o.name)) o.visible = false; });
  sync({animate: false});

  // ---- effects --------------------------------------------------------------------------------
  const stream = world.particles({count: 80, color: 0x7cc8ff, size: .035, gravity: -4, life: [.3, .5], spawn(p, v) { outlet.getWorldPosition(p); p.x += .18; p.y -= .06; v.set((Math.random() - .5) * .1, -.2, (Math.random() - .5) * .1); }});
  const steam = world.particles({count: 60, color: 0xe8eef2, size: .09, opacity: .5, gravity: .6, life: [.8, 1.4], spawn(p, v) { sockets.pump.getWorldPosition(p); p.z += .25; v.set((Math.random() - .5) * .2, .3, .2); }});
  const sparks = world.particles({count: 40, color: 0xffd36b, size: .05, additive: true, gravity: -3, life: [.2, .4], spawn(p, v) { sockets[s().variant.broken].getWorldPosition(p); p.z += .25; v.set((Math.random() - .5) * 2, Math.random() * 1.5, Math.random()); }});
  let running = 0, runResult = null, flowLevel = .08;
  const calm = new THREE.Color(0xfff1d6), alarmC = new THREE.Color(0xff6a6a);
  let screenClock = 0;
  world.onFrame((dt, t) => {
    const st = s();
    if (st.testRuns.length > shown.testRuns) {
      shown.testRuns = st.testRuns.length; runResult = st.testRuns.at(-1); running = 3;
      if (runResult === 'no-start') sparks.burst(30);
    }
    if (running > 0) running -= dt;
    const spinning = st.fixed || (running > 0 && runResult !== 'no-start' || running > 0 && st.variant.broken === 'valve');
    installed.pump.getObjectByName('fan') && (installed.pump.getObjectByName('fan').rotation.y += dt * (spinning ? (runResult === 'low-flow' && !st.fixed ? 10 : 22) : 0));
    const wantFlow = st.fixed ? 1 : running > 0 ? (runResult === 'low-flow' ? .35 : .05) : .08;
    flowLevel += (wantFlow - flowLevel) * Math.min(1, dt * 2); flow.scale.y = Math.max(.03, flowLevel);
    stream.rate = st.fixed ? 60 : running > 0 && runResult === 'low-flow' ? 10 : 0;
    steam.rate = running > 0 && runResult === 'low-flow' ? 25 : 0;
    // Lamp: red alarm, amber when off, green when fixed.
    const col = st.fixed ? 0x2bff86 : !st.power ? 0xffb02e : 0xff3a3a;
    lampMat.emissive.set(col); lampMat.color.set(col); lampMat.emissiveIntensity = st.fixed ? 2 : st.alarm && st.power ? (Math.sin(t * 7) > 0 ? 2.4 : .3) : 1.2;
    lever.rotation.x += ((st.power ? -.55 : .55) - lever.rotation.x) * Math.min(1, dt * 10);
    saveSwitch.rotation.x += ((st.saveMode ? .7 : -.2) - saveSwitch.rotation.x) * Math.min(1, dt * 10);
    saveLamp.emissive.set(st.saveMode ? 0x2bff86 : 0xffb02e); saveLamp.color.set(st.saveMode ? 0x2bff86 : 0xffb02e);
    needle.rotation.z += ((st.saveMode ? .7 : -.4) - needle.rotation.z) * Math.min(1, dt * 4);
    level.scale.y = Math.max(.03, st.waterL / Math.max(1, st.waterStartL));
    const alarmMood = st.alarm && st.power && !st.fixed ? (Math.sin(t * 3) * .5 + .5) * .35 : 0;
    for (const m of strips) m.emissive.copy(calm).lerp(alarmC, alarmMood);
    antenna.emissive.set(st.message.status === 'none' ? 0x334455 : st.message.status === 'arrived' ? 0x2bff86 : 0xffb02e);
    antenna.emissiveIntensity = st.message.status === 'outbound' || st.message.status === 'inbound' ? (Math.sin(t * 5) > 0 ? 2.5 : .4) : 1.4;
    elena.update(dt); luca.update(dt);
    elena.mode = st.message.status === 'arrived' && !st.readAnswer ? 'wave' : st.fixed ? 'wave' : 'idle';
    luca.mode = st.fixed ? 'wave' : 'idle';
    screenClock += dt; if (screenClock > .25) { screenClock = 0; drawScreen(st, t); drawMeter(st); }
    player.speedScale = st.holding === 'pump' ? .85 : 1;
  });

  function drawScreen(st, t) {
    const {ctx, c, tex} = screen, W = c.width, H = c.height;
    const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#071528'); g.addColorStop(1, '#0d2340'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) { ctx.fillStyle = `rgba(255,255,255,${.25 + (i * 37 % 10) / 20})`; ctx.fillRect((i * 151) % W, (i * 97) % (H - 120) + 10, 2, 2); }
    const mars = {x: 150, y: 300}, earth = {x: W - 150, y: 300};
    ctx.fillStyle = '#d0613a'; ctx.beginPath(); ctx.arc(mars.x, mars.y, 70, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#a84a2a'; ctx.beginPath(); ctx.arc(mars.x - 20, mars.y + 15, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2f7fd8'; ctx.beginPath(); ctx.arc(earth.x, earth.y, 70, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4fbf6a'; ctx.beginPath(); ctx.ellipse(earth.x + 10, earth.y - 10, 28, 20, .5, 0, Math.PI * 2); ctx.fill();
    ctx.font = '700 34px Fredoka Variable, system-ui'; ctx.fillStyle = '#fff'; ctx.textAlign = 'center';
    ctx.fillText('MARS · you', mars.x, mars.y + 115); ctx.fillText('EARTH · Houston', earth.x, earth.y + 115);
    ctx.setLineDash([12, 14]); ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(mars.x + 80, mars.y); ctx.lineTo(earth.x - 80, earth.y); ctx.stroke(); ctx.setLineDash([]);
    const p = messageProgress(st); ctx.font = '700 40px Fredoka Variable, system-ui';
    let title = 'Recycler broken! Send a message?', sub = `Light takes ${Math.round(st.scenario.oneWaySeconds / 60)} minutes to cross this gap.`;
    if (p) {
      const x = p.leg === 'out' ? mars.x + 80 + (earth.x - mars.x - 160) * p.fraction : p.leg === 'back' ? earth.x - 80 - (earth.x - mars.x - 160) * p.fraction : p.leg === 'earth' ? earth.x - 80 : mars.x + 80;
      if (p.leg !== 'arrived') { ctx.fillStyle = '#ffd23f'; ctx.beginPath(); ctx.arc(x, mars.y - (p.leg === 'earth' ? 100 : 0), 16 + Math.sin(t * 8) * 4, 0, Math.PI * 2); ctx.fill(); ctx.fillText('✉', x, mars.y - 40 - (p.leg === 'earth' ? 100 : 0)); }
      title = p.leg === 'out' ? 'Your message is flying to Earth…' : p.leg === 'earth' ? 'Earth is thinking…' : p.leg === 'back' ? 'Earth’s answer is flying back…' : '✅ Earth answered!';
      sub = p.leg === 'arrived' ? 'Read it at this console.' : `Answer arrives in ${mmss(p.secondsLeft)} (mission time)`;
    }
    ctx.fillStyle = '#ffd23f'; ctx.fillText(title, W / 2, 70); ctx.font = '600 30px Nunito Variable, system-ui'; ctx.fillStyle = '#cfe6ff'; ctx.fillText(sub, W / 2, 118);
    ctx.textAlign = 'left'; ctx.font = '700 30px Nunito Variable, system-ui'; ctx.fillStyle = st.waterL < 10 ? '#ff8a8a' : '#9fe8ff';
    ctx.fillText(`💧 Water ${st.waterL.toFixed(1)} L   ⏱ ${mmss(st.simSeconds)}   ${st.saveMode ? '🚿 Saving water' : ''}`, 40, H - 40);
    tex.needsUpdate = true;
  }
  let lastReading = '';
  function drawMeter(st) {
    const {ctx, c, tex} = lcd; const d = st.decisions.filter(x => x.id === 'test').at(-1);
    const text = d ? (d.facts.bad ? st.scenario.meter[d.facts.part].bad : st.scenario.meter[d.facts.part].ok) : '---';
    if (text === lastReading) return; lastReading = text;
    ctx.fillStyle = '#b7c9a8'; ctx.fillRect(0, 0, c.width, c.height); ctx.fillStyle = '#1d2a1a'; ctx.font = '700 54px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text.split(' ')[0] + (text.includes('Ω') ? 'Ω' : ''), c.width / 2, c.height / 2 + 4); tex.needsUpdate = true;
  }

  const guideTarget = () => {
    const st = s(); if (st.phase !== 'active' || !st.plan) return null;
    if (st.fixed) return consoleM;
    if (st.plan !== 'self' && st.message.status === 'none') return consoleM;
    if (st.message.status === 'arrived' && !st.readAnswer) return consoleM;
    if (st.plan === 'earth' && st.message.status !== 'arrived' && !knownBad(st).length) return st.saveMode ? consoleM : saveSwitch;
    if (st.holding && st.holding !== 'meter') return st.power ? lever : st.panel === 'closed' ? door : sockets[st.holding];
    const bad = knownBad(st), untested = !earthKnows(st) && PARTS.find(p => !st.findings[p]);
    const needsWork = bad.length || (st.plan !== 'earth' && untested);
    if (needsWork) {
      if (st.power) return lever; if (st.panel === 'closed') return door;
      if (bad.length) return spareFor(bad[0]) || sockets[bad[0]];
      if (untested === 'filter') return sockets.filter;
      return st.holding === 'meter' ? sockets[untested] : meter;
    }
    if (st.panel === 'open') return door; if (!st.power) return lever; return lamp;
  };
  world.onFrame(() => world.guide(guideTarget(), .35));

  return {world, sync, idle: () => syncQueue,
    walkTargets: [{id: 'recycler', label: '💧 Recycler', x: -1.8, z: -2.6}, {id: 'shelf', label: '🧰 Spare parts', x: 1.5, z: -2.8}, {id: 'save', label: '🚿 Save water', x: -4.4, z: -3}, {id: 'console', label: '📡 Earth link', x: 3.6, z: 2.3}],
    walk(id) { const t = this.walkTargets.find(w => w.id === id); if (t) return player.navigate({x: t.x, z: t.z}, {x: t.x, z: t.z + (t.z < 0 ? -1 : 1)}); }};
}
