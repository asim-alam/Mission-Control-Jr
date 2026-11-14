// 3D view of "Chasing the Sun": Horizon Base near the Moon's south pole, a solar mast cart you tow,
// two pads (near and on the ridge), a cable you carry back to the base power port, and an 18-day time-lapse.
import * as THREE from 'three';
import {loadModel, part, tint} from '../shared/engine.js';
import {missionAsset} from '../shared/assets.js';
import {makeCrew} from '../shared/crew.js';
import {createMoonWorld, sunVector} from '../shared/moon-world.js';
import {SITE, sunlit, groundHeight} from '../shared/moon-ground.js';
import {panelHeight, sunPlan, sunShare, sunAzimuth, cableNeeded, PLANS} from './actions.js';

const HITCH = 1.95;              // tow handle distance in front of the cart centre (metres)
const CART_HOME = {x: 4.2, z: -6.2, yaw: Math.PI};
const MAST_LIFT = [0, 1.75, 1.75, .95]; // how far each stage slides (stage 1 = innermost tube)
const HOLD = {legs: 1.3, stage: 1.6, wings: 1.2, plug: .6};

function canvasScreen(mesh, w, h) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const ctx = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  mesh.material.map = tex; mesh.material.emissiveMap = tex; mesh.material.emissive?.set(0xffffff); mesh.material.emissiveIntensity = .95; mesh.material.color.set(0xffffff); mesh.material.needsUpdate = true;
  return {ctx, c, tex};
}
const yawToward = (dx, dz) => Math.atan2(-dx, -dz); // player yaw that looks along (dx, dz)

export async function createSunScene({container, getState, act, onPause, onConsole}) {
  const s = () => getState();
  const sc0 = s().scenario;
  const moon = await createMoonWorld({container, onPause, start: {x: 7.4, z: -3.2, yaw: yawToward(-1, -.9)}, sun: {azimuth: sc0.window.startAzimuthDeg, elevation: sc0.sunElevationDeg}});
  const {world} = moon, {scene, player} = world;
  const load = id => loadModel(missionAsset(id));
  const [hab, cart, jin, elena] = await Promise.all([load('lunar-habitat'), load('solar-mast-cart'), makeCrew('jin', {suitMode: true}), makeCrew('elena', {suitMode: true})]);
  scene.add(hab);
  moon.onGround(cart, CART_HOME.x, CART_HOME.z, CART_HOME.yaw);

  // Habitat lights and windows.
  const windowMats = []; hab.traverse(o => { if (o.isMesh && o.material.name === 'hab-window') windowMats.push(o.material); });
  const porchLight = new THREE.PointLight(0xffe2b0, 6, 9, 1.6); porchLight.position.set(6.2, 2.4, 0); scene.add(porchLight);
  const portLight = new THREE.PointLight(0xffe2b0, 3, 6, 1.6); portLight.position.set(-.8, 2.2, -3.4); scene.add(portLight);
  const beacon = part(hab, 'beacon').getObjectByProperty('isMesh', true)?.material;

  // Base console: a weatherproof screen by the airlock porch (built here from simple shapes).
  const consoleGroup = new THREE.Group();
  const metal = new THREE.MeshStandardMaterial({color: 0x9aa3ad, roughness: .45, metalness: .6});
  const post = new THREE.Mesh(new THREE.CylinderGeometry(.06, .08, 1.1, 12), metal); post.position.y = .55; consoleGroup.add(post);
  const boxM = new THREE.Mesh(new THREE.BoxGeometry(.9, .6, .14), new THREE.MeshStandardMaterial({color: 0x2c3440, roughness: .5, metalness: .3})); boxM.position.y = 1.3; boxM.rotation.x = -.35; consoleGroup.add(boxM);
  const consoleScreenMesh = new THREE.Mesh(new THREE.PlaneGeometry(.8, .5), new THREE.MeshStandardMaterial({color: 0xffffff, emissive: 0xffffff, roughness: .3}));
  consoleScreenMesh.position.set(0, 1.3, .075); consoleScreenMesh.rotation.x = -.35; consoleGroup.add(consoleScreenMesh);
  moon.onGround(consoleGroup, 6.6, -2.4, Math.PI * .85);
  const consoleScreen = canvasScreen(consoleScreenMesh, 512, 320);

  // Pad rings that glow for the chosen plan.
  const padRing = {};
  for (const [id, p] of Object.entries(sc0.pads)) {
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.9, 2.15, 48), new THREE.MeshBasicMaterial({color: 0xffd23f, transparent: true, opacity: .0, side: THREE.DoubleSide, depthWrite: false}));
    ring.rotation.x = -Math.PI / 2; ring.position.set(p.x, groundHeight(p.x, p.z) + .06, p.z); scene.add(ring); padRing[id] = ring;
    const label = world.sign(`${PLANS[id].icon} ${p.name}`, {width: 2.2}); label.position.set(p.x, groundHeight(p.x, p.z) + 3.2, p.z); scene.add(label); padRing[id].label = label;
  }
  const portSign = world.sign('🔌 Power port', {width: 1.5}); portSign.position.set(-.8, 2.25, -2.6); scene.add(portSign);
  const consoleSign = world.sign('🖥️ Base console', {width: 1.6}); consoleSign.position.set(6.6, 2.35, -2.4); scene.add(consoleSign);
  const cartSign = world.sign('☀️ Solar cart', {width: 1.4}); cart.add(cartSign); cartSign.position.set(0, 3.6, 0);

  // ---- cart parts ---------------------------------------------------------------------------
  const wheels = ['wheel_l', 'wheel_r'].map(n => part(cart, n)), legs = [1, 2, 3, 4].map(i => part(cart, `leg_${i}`));
  const stages = [null, part(cart, 'mast_3'), part(cart, 'mast_2'), part(cart, 'mast_1')];
  const stageBase = stages.map(st => st?.position.y ?? 0);
  const pivot = part(cart, 'panel_pivot'), wings = [part(cart, 'wing_l'), part(cart, 'wing_r')], sunLamp = part(cart, 'sun_lamp').getObjectByProperty('isMesh', true).material;
  const drum = part(cart, 'reel_drum'), crank = part(cart, 'crank'), towBar = part(cart, 'tow_bar'), cableExit = part(cart, 'cable_exit');
  const plug = part(cart, 'plug'), plugHome = new THREE.Group(); plugHome.position.copy(plug.position); plugHome.rotation.copy(plug.rotation); cart.add(plugHome); plugHome.add(plug); plug.position.set(0, 0, 0); plug.rotation.set(0, 0, 0);
  const cartScreen = canvasScreen(part(cart, 'screen').getObjectByProperty('isMesh', true), 512, 188);
  const portSocket = part(hab, 'port_socket'), portLamp = part(hab, 'port_lamp').getObjectByProperty('isMesh', true).material;

  // A small control box on the cart's right side: mast ▲ ▼ buttons and the wing switch.
  const ctrl = new THREE.Group(); ctrl.position.set(.68, .95, -.15); ctrl.rotation.y = Math.PI / 2; cart.add(ctrl);
  const ctrlBox = new THREE.Mesh(new THREE.BoxGeometry(.5, .32, .08), new THREE.MeshStandardMaterial({color: 0x39424e, roughness: .5, metalness: .3})); ctrl.add(ctrlBox);
  const btn = (color, x, y) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(.045, .045, .04, 16), new THREE.MeshStandardMaterial({color, emissive: color, emissiveIntensity: .35, roughness: .4})); m.rotation.x = Math.PI / 2; m.position.set(x, y, .055); ctrl.add(m); return m; };
  const upBtn = btn(0x2bd96b, -.15, .06), downBtn = btn(0xff5a4a, -.15, -.07);
  const wingSwitch = new THREE.Group(); wingSwitch.position.set(.12, 0, .05); ctrl.add(wingSwitch);
  const wingLever = new THREE.Mesh(new THREE.BoxGeometry(.05, .16, .05), new THREE.MeshStandardMaterial({color: 0xffc21f, emissive: 0xffa21f, emissiveIntensity: .3})); wingLever.position.y = .06; wingSwitch.add(wingLever);
  const ctrlLabel = world.sign('▲▼ mast · wings', {width: .55, font: 48}); ctrlLabel.position.set(0, .28, .05); ctrl.add(ctrlLabel);
  const hitMat = new THREE.MeshBasicMaterial({transparent: true, opacity: 0, depthWrite: false});
  const hitBox = (parent, size, pos) => { const m = new THREE.Mesh(new THREE.BoxGeometry(...size), hitMat); m.position.set(...pos); parent.add(m); return m; };
  const upHit = new THREE.Group(); ctrl.add(upHit); hitBox(upHit, [.14, .12, .1], [-.15, .06, .06]);
  const downHit = new THREE.Group(); ctrl.add(downHit); hitBox(downHit, [.14, .12, .1], [-.15, -.07, .06]);
  const wingHit = new THREE.Group(); ctrl.add(wingHit); hitBox(wingHit, [.16, .28, .12], [.12, .02, .06]);
  const legHit = new THREE.Group(); cart.add(legHit); hitBox(legHit, [1.5, .5, 1.7], [0, .55, 0]);
  const handleHit = new THREE.Group(); towBar.add(handleHit); hitBox(handleHit, [.6, .3, .4], [0, .22, 1.0]);
  const screenHit = new THREE.Group(); part(cart, 'screen').add(screenHit); hitBox(screenHit, [.66, .28, .1], [0, 0, .02]);
  const plugHit = new THREE.Group(); drum.add(plugHit); hitBox(plugHit, [.5, .5, .6], [-.15, -.02, -.05]);
  const portHit = new THREE.Group(); portSocket.add(portHit); hitBox(portHit, [.6, .6, .4], [0, .05, .1]);

  // Crew: Jin waits at the console, Elena helps outside.
  scene.add(jin.model, elena.model);
  jin.teleport(7.4, -1.6, -2.3); elena.teleport(2.2, -5.2, .8);

  // ---- cart physics: towing like a trailer ------------------------------------------------------
  const cartPos = new THREE.Vector2(CART_HOME.x, CART_HOME.z); let cartYaw = CART_HOME.yaw, wheelSpin = 0;
  const cartObstacle = {minX: 0, maxX: 0, minZ: 0, maxZ: 0};
  const baseObstacles = [{minX: -4.6, maxX: 6.0, minZ: -2.15, maxZ: 2.15}, {minX: 6.35, maxX: 6.85, minZ: -2.65, maxZ: -2.15}];
  player.obstacles = [...baseObstacles, cartObstacle];
  function placeCart() {
    cart.position.set(cartPos.x, groundHeight(cartPos.x, cartPos.y), cartPos.y); cart.rotation.y = cartYaw;
    // Tilt to follow the slope.
    const fx = Math.sin(cartYaw), fz = Math.cos(cartYaw), ahead = groundHeight(cartPos.x + fx * .7, cartPos.y + fz * .7), behind = groundHeight(cartPos.x - fx * .7, cartPos.y - fz * .7);
    const right = groundHeight(cartPos.x + fz * .7, cartPos.y - fx * .7), left = groundHeight(cartPos.x - fz * .7, cartPos.y + fx * .7);
    const clamp = v => Math.max(-.32, Math.min(.32, v));
    cart.rotation.set(clamp(Math.atan2(behind - ahead, 1.4)), cartYaw, clamp(Math.atan2(left - right, 1.4)), 'YXZ');
    const r = 1.05; Object.assign(cartObstacle, s().hitched ? {minX: 0, maxX: 0, minZ: 0, maxZ: 0} : {minX: cartPos.x - r, maxX: cartPos.x + r, minZ: cartPos.y - r, maxZ: cartPos.y + r});
  }
  const hitchWorld = () => new THREE.Vector2(cartPos.x + Math.sin(cartYaw) * HITCH, cartPos.y + Math.cos(cartYaw) * HITCH);
  function tow(dt) {
    const target = new THREE.Vector2(player.position.x, player.position.z);
    const dir = target.clone().sub(cartPos); const len = dir.length(); if (len < .01) return;
    dir.divideScalar(len);
    const next = target.clone().sub(dir.clone().multiplyScalar(HITCH)), moved = next.distanceTo(cartPos);
    cartPos.copy(next); cartYaw = Math.atan2(dir.x, dir.y); wheelSpin += moved / .45;
    wheels.forEach(w => { w.rotation.x = wheelSpin; });
    placeCart();
    // Arriving at a pad or back home.
    const st = s();
    for (const [id, p] of Object.entries(st.scenario.pads)) if (st.cart !== id && Math.hypot(cartPos.x - p.x, cartPos.y - p.z) < 1.8) { act({id: 'arrive', payload: id}); return; }
    if (st.cart !== 'base' && Math.hypot(cartPos.x - CART_HOME.x, cartPos.y - CART_HOME.z) < 3) act({id: 'arrive', payload: 'base'});
  }
  // Cable leash: you can only walk as far as the cable reaches.
  player.canMoveTo = (x, z) => {
    if (s().plug !== 'hand') return true;
    const e = new THREE.Vector3(); cableExit.getWorldPosition(e);
    const d = Math.hypot(x - e.x, z - e.z); return d <= s().scenario.cableM - .3 || d < Math.hypot(player.position.x - e.x, player.position.z - e.z);
  };

  // Cable on the ground from the reel to the plug.
  let cable = null;
  function showCable(on) {
    if (on && !cable) cable = moon.groundCable({from: v => cableExit.getWorldPosition(v), to: v => plug.getWorldPosition(v), color: 0xffb02e, radius: .035});
    if (!on && cable) { cable.remove(); cable = null; }
  }

  // ---- interactions --------------------------------------------------------------------------------
  const active = () => s().phase === 'active' && !!s().plan;
  const atPad = () => !!s().scenario.pads[s().cart];
  world.register({id: 'hitch', object: handleHit, range: 2.6, enabled: () => active() && !s().hitched && !s().legs && s().plug !== 'port', label: () => 'Grab the handle: hitch the cart', onUse: () => {
    // Step to the handle so the cart follows from there.
    const h = hitchWorld(); player.position.x = h.x; player.position.z = h.y; player.yaw = yawToward(Math.sin(cartYaw), Math.cos(cartYaw)); player.syncCamera(); act({id: 'hitch'});
  }});
  world.register({id: 'legs', object: legHit, range: 3, holdSeconds: HOLD.legs, enabled: () => active() && atPad() && (!s().legs || (s().stages === 0 && !s().wings && s().plug !== 'port')),
    label: () => s().legs ? 'Hold E: lift the legs (to move the cart)' : 'Hold E: put the cart’s legs down',
    onHold: p => { if (!s().legs) legs.forEach((l, i) => { l.rotation.z = (i % 2 ? -1 : 1) * 1.35 * (1 - p); }); },
    onUse: () => act({id: s().legs ? 'liftLegs' : 'deployLegs'})});
  world.register({id: 'mastUp', object: upHit, range: 2.4, holdSeconds: HOLD.stage, enabled: () => active() && s().legs && !s().wings && s().stages < s().scenario.mast.stages,
    label: () => `Hold E: raise the mast (stage ${s().stages + 1} of ${s().scenario.mast.stages})`, onHold: p => { upBtn.position.z = .055 - Math.min(.02, p * .05); }, onUse: () => { upBtn.position.z = .055; act({id: 'raiseStage'}); }});
  world.register({id: 'mastDown', object: downHit, range: 2.4, holdSeconds: HOLD.stage * .7, enabled: () => active() && s().legs && !s().wings && s().stages > 0,
    label: () => 'Hold E: lower the mast one stage', onUse: () => act({id: 'lowerStage'})});
  world.register({id: 'wings', object: wingHit, range: 2.4, holdSeconds: HOLD.wings, enabled: () => active() && s().legs && s().stages > 0,
    label: () => s().wings ? 'Hold E: fold the solar wings' : 'Hold E: open the solar wings', onUse: () => act({id: s().wings ? 'foldWings' : 'openWings'})});
  world.register({id: 'plug', object: plugHit, range: 2.4, enabled: () => active() && (s().plug === 'reel' ? s().legs && atPad() : s().plug === 'hand' && nearCart(3)),
    label: () => s().plug === 'reel' ? `Take the plug (${s().scenario.cableM} m of cable)` : 'Put the plug back on the reel', onUse: () => act({id: s().plug === 'reel' ? 'takePlug' : 'putPlugBack'})});
  world.register({id: 'port', object: portHit, range: 2.4, holdSeconds: () => s().plug === 'hand' ? HOLD.plug : .8, enabled: () => active() && (s().plug === 'hand' || s().plug === 'port'),
    label: () => s().plug === 'hand' ? 'Hold E: plug the cable into the base' : 'Hold E: unplug the cable', onUse: () => act({id: s().plug === 'hand' ? 'plugIn' : 'unplug'})});
  world.register({id: 'tracker', object: screenHit, range: 2.4, enabled: () => active() && atPad() && s().legs,
    label: () => s().tracker ? 'Sun tracker is on ✔' : !s().wings ? 'Sun forecast screen (open the wings first)' : s().plug !== 'port' ? 'Sun forecast screen (plug in the cable first)' : 'Turn on the Sun tracker',
    onUse: () => { if (!s().tracker) act({id: 'tracker'}); }});
  world.register({id: 'console', object: consoleGroup, range: 2.6, enabled: active, label: () => 'Use the base console', onUse: onConsole});
  function nearCart(r) { return Math.hypot(player.position.x - cartPos.x, player.position.z - cartPos.y) < r; }

  // ---- state → view ----------------------------------------------------------------------------------
  let shownMission = null, shown = null;
  let syncQueue = Promise.resolve();
  const sync = opts => (syncQueue = syncQueue.then(() => doSync(opts)).catch(e => console.error(e)));
  function setLegs(down) { legs.forEach((l, i) => { l.rotation.z = down ? 0 : (i % 2 ? -1 : 1) * 1.35; }); }
  function setStages(n) { for (let k = 1; k <= 3; k++) stages[k].position.y = stageBase[k] + (k <= n ? MAST_LIFT[k] : 0); }
  function setWings(open) { wings.forEach((w, i) => { const sgn = i ? 1 : -1; w.rotation.z = open ? 0 : -sgn * Math.PI / 2; w.position.z = open ? 0 : sgn * .05; }); }
  function plugTo(where, animate) {
    if (where === 'hand') { world.hold(plug, {scale: .9, offset: [-.06, .02, -.05], rotation: [.2, .3, 0]}); return; }
    const target = where === 'port' ? portSocket : plugHome;
    if (animate) return world.place(plug, target, {seconds: .45, arc: .15});
    world.release(); target.add(plug); plug.position.set(0, 0, 0); plug.rotation.set(0, where === 'port' ? Math.PI : 0, 0); plug.scale.setScalar(1);
  }
  function resetView() {
    world.release(); cartPos.set(CART_HOME.x, CART_HOME.z); cartYaw = CART_HOME.yaw; placeCart();
    setLegs(false); setStages(0); setWings(false); plugTo('reel', false); showCable(false); moon.setSun(s().scenario.window.startAzimuthDeg);
    shown = {legs: false, stages: 0, wings: false, plug: 'reel', cart: 'base'};
  }
  async function doSync({animate = true} = {}) {
    const st = s();
    if (shownMission !== st) { shownMission = st; resetView(); animate = false; if (st.cart !== 'base' && st.scenario.pads[st.cart]) { const p = st.scenario.pads[st.cart]; cartPos.set(p.x, p.z); cartYaw = Math.atan2(SITE.base.x - p.x, SITE.base.z - p.z); placeCart(); } }
    if (!st.hitched && shown.cart !== st.cart && st.scenario.pads[st.cart]) { const p = st.scenario.pads[st.cart]; cartPos.set(p.x, p.z); placeCart(); }
    shown.cart = st.cart;
    if (shown.legs !== st.legs) {
      const from = shown.legs ? 0 : 1, to = st.legs ? 0 : 1;
      if (animate) await world.tween(.5, t => legs.forEach((l, i) => { l.rotation.z = (i % 2 ? -1 : 1) * 1.35 * (from + (to - from) * t); })); else setLegs(st.legs);
      shown.legs = st.legs;
      if (st.legs) { const p = st.scenario.pads[st.cart]; if (p) { const d = Math.hypot(cartPos.x - p.x, cartPos.y - p.z); if (d > .05) { const a = cartPos.clone(), b = new THREE.Vector2(p.x, p.z); if (animate) await world.tween(.4, t => { cartPos.lerpVectors(a, b, t); placeCart(); }); else { cartPos.copy(b); placeCart(); } } } }
      placeCart();
    }
    if (shown.wings && !st.wings) { if (animate) await world.tween(.8, t => wings.forEach((w, i) => { const sgn = i ? 1 : -1; w.rotation.z = -sgn * Math.PI / 2 * t; w.position.z = sgn * .05 * t; })); else setWings(false); shown.wings = false; }
    if (shown.stages !== st.stages) {
      const k = Math.max(shown.stages, st.stages), node = stages[k], from = node.position.y, to = stageBase[k] + (st.stages >= k ? MAST_LIFT[k] : 0);
      if (animate) await world.tween(1.1, t => { node.position.y = from + (to - from) * t; }); else setStages(st.stages);
      setStages(st.stages); shown.stages = st.stages;
    }
    if (!shown.wings && st.wings) { if (animate) await world.tween(1, t => wings.forEach((w, i) => { const sgn = i ? 1 : -1; w.rotation.z = -sgn * Math.PI / 2 * (1 - t); w.position.z = sgn * .05 * (1 - t); })); else setWings(true); shown.wings = true; }
    if (shown.plug !== st.plug) {
      const prev = shown.plug; shown.plug = st.plug;
      if (st.plug === 'hand') { plugTo('hand'); showCable(true); }
      else if (st.plug === 'port') { await plugTo('port', animate); plug.rotation.y = Math.PI; showCable(true); }
      else { if (animate) { await plugTo('reel', true); showCable(false); await world.tween(.6, t => { drum.rotation.x = -t * 18; }); } else { plugTo('reel', false); showCable(false); } }
      if (st.plug === 'hand' && prev === 'reel' && animate) world.tween(.5, t => { drum.rotation.x = t * 10; });
    }
  }
  sync({animate: false});

  // ---- per-frame: towing, Sun tracking, lamps, screens ------------------------------------------------
  let screenClock = 0, lapse = null, lastForecastKey = '';
  world.onFrame((dt, t) => {
    const st = s();
    if (st.phase === 'active' && st.hitched) tow(dt);
    // Sun tracker: the panel turns toward the Sun; otherwise it faces the cart's front.
    const az = lapse ? lapse.azimuth : moon.sun.azimuth;
    const sunDir = sunVector(az, 1.5);
    const wantYaw = st.tracker ? Math.atan2(sunDir.x, sunDir.z) - cartYaw : 0;
    let diff = wantYaw - pivot.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff)); pivot.rotation.y += diff * Math.min(1, dt * (lapse ? 8 : 2));
    // Is the panel lit right now?
    const lit = st.scenario.pads[st.cart] && st.legs ? sunlit(cartPos.x, cartPos.y, panelHeight(st), az, st.scenario.sunElevationDeg) : false;
    const lampColor = !st.wings ? 0x555555 : lit ? 0x2bff86 : 0xffb02e;
    sunLamp.color.set(lampColor); sunLamp.emissive?.set(lampColor); sunLamp.emissiveIntensity = st.wings ? 2.2 : .2;
    portLamp.color.set(st.plug === 'port' ? 0x2bff86 : 0xffb02e); portLamp.emissive?.set(st.plug === 'port' ? 0x2bff86 : 0xffb02e); portLamp.emissiveIntensity = st.plug === 'port' ? 2 : (Math.sin(t * 4) > 0 ? 1.6 : .3);
    for (const [id, ring] of Object.entries(padRing)) { ring.material.opacity = st.plan === id ? .55 + Math.sin(t * 3) * .3 : st.plan ? 0 : .25; ring.label.visible = (!st.plan || st.plan === id) && !(st.cart === id && st.legs); }
    if (beacon) beacon.emissiveIntensity = Math.sin(t * 2) > .6 ? 3 : .4;
    jin.update(dt); elena.update(dt);
    jin.mode = lapse ? 'idle' : st.tracker ? 'wave' : 'idle'; jin.face(player.position.x, player.position.z);
    // Elena follows a few steps behind you when you go out with the cart.
    const ep = elena.model.position, goal = st.hitched ? new THREE.Vector2(cartPos.x + 1.6, cartPos.y + .6) : st.legs ? new THREE.Vector2(cartPos.x - 1.4, cartPos.y + 1.4) : new THREE.Vector2(2.2, -5.2);
    if (Math.hypot(goal.x - ep.x, goal.y - ep.z) > 1.2) { elena.speed = st.hitched ? 3.8 : 2.2; if (elena.mode !== 'walk' || !elena.target || elena.target.distanceTo(new THREE.Vector3(goal.x, 0, goal.y)) > 1) elena.walkTo(goal.x, goal.y); }
    if (elena.mode !== 'walk') elena.mode = st.legs && !st.wings ? 'work' : 'idle';
    elena.model.position.y = groundHeight(ep.x, ep.z);
    screenClock += dt; if (screenClock > .3) { screenClock = 0; drawCartScreen(st); drawConsole(st, t); }
  });

  // Little sun-forecast screen on the cart: 18 days of sunshine for this pad and height.
  function drawCartScreen(st) {
    const key = [st.cart, st.legs, st.stages, st.wings, st.tracker, st.plug].join();
    if (key === lastForecastKey) return; lastForecastKey = key;
    const {ctx, c, tex} = cartScreen, W = c.width, H = c.height;
    ctx.fillStyle = '#0a1a2c'; ctx.fillRect(0, 0, W, H); ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.font = '700 30px Fredoka Variable, system-ui'; ctx.fillStyle = '#ffd23f';
    if (!st.scenario.pads[st.cart] || !st.legs) { ctx.fillText('☀️ SUN FORECAST', 18, 14); ctx.font = '600 26px Nunito Variable, system-ui'; ctx.fillStyle = '#cfe6ff'; ctx.fillText(st.scenario.pads[st.cart] ? 'Put my legs down first.' : 'Take me to a pad!', 18, 70); tex.needsUpdate = true; return; }
    const plan = sunPlan(st), share = plan.filter(Boolean).length / plan.length;
    ctx.fillText(`☀️ ${Math.round(share * 100)}% sunny · mast ${panelHeight(st).toFixed(1)} m`, 18, 12);
    const x0 = 18, w = W - 36, y0 = 64, h = 46;
    plan.forEach((lit, i) => { ctx.fillStyle = lit ? '#ffd23f' : '#20314a'; ctx.fillRect(x0 + i / plan.length * w, y0, w / plan.length + .6, h); });
    ctx.strokeStyle = '#cfe6ff'; ctx.lineWidth = 2; ctx.strokeRect(x0, y0, w, h);
    ctx.font = '600 22px Nunito Variable, system-ui'; ctx.fillStyle = '#cfe6ff';
    ctx.fillText('day 1', x0, y0 + h + 8); ctx.textAlign = 'right'; ctx.fillText(`day ${st.scenario.window.days}`, x0 + w, y0 + h + 8);
    ctx.textAlign = 'center'; ctx.fillStyle = st.tracker ? '#2bff86' : '#ffb02e'; ctx.fillText(st.tracker ? 'TRACKER ON' : !st.wings ? 'wings folded' : st.plug !== 'port' ? 'plug in the cable' : 'press to track', x0 + w / 2, y0 + h + 8);
    tex.needsUpdate = true;
  }
  function drawConsole(st, t) {
    const {ctx, c, tex} = consoleScreen, W = c.width, H = c.height;
    ctx.fillStyle = '#071528'; ctx.fillRect(0, 0, W, H); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.font = '700 34px Fredoka Variable, system-ui'; ctx.fillStyle = '#ffd23f';
    const bat = lapse ? lapse.battery : st.batteryKWh;
    ctx.fillText(lapse ? `Day ${Math.min(st.scenario.window.days, Math.floor(lapse.hour / 24) + 1)} of ${st.scenario.window.days}` : 'HORIZON BASE POWER', W / 2, 16);
    ctx.font = '600 28px Nunito Variable, system-ui'; ctx.fillStyle = '#cfe6ff';
    ctx.fillText(`🔋 Battery ${bat.toFixed(0)} of ${st.scenario.batteryKWh} kWh`, W / 2, 80);
    const f = Math.max(0, Math.min(1, bat / st.scenario.batteryKWh));
    ctx.strokeStyle = '#cfe6ff'; ctx.lineWidth = 3; ctx.strokeRect(56, 128, W - 112, 40); ctx.fillStyle = f < .2 ? '#ff6a6a' : f < .5 ? '#ffb02e' : '#2bff86'; ctx.fillRect(59, 131, (W - 118) * f, 34);
    ctx.fillStyle = '#cfe6ff';
    ctx.fillText(lapse ? (lapse.lit ? '☀️ Panel in sunlight' : '🌑 Panel in shadow') : st.plug === 'port' ? '🔌 Solar cable connected' : '🔌 No solar cable yet', W / 2, 190);
    ctx.fillText(st.savePlan ? (st.savePlan === 'save' ? '🌙 Plan: science pauses in the dark' : '🔬 Plan: science all the time') : 'Pick a power plan here', W / 2, 238);
    tex.needsUpdate = true;
  }

  /** The 18-day time-lapse: the Sun sweeps along the horizon while the battery rises and falls. */
  async function timelapse(watch, seconds = 9) {
    const st = s(), hours = watch.log.length; lapse = {hour: 0, azimuth: st.scenario.window.startAzimuthDeg, battery: st.batteryKWh, lit: false};
    await world.tween(seconds, (e, raw) => {
      const h = Math.min(hours - 1, Math.floor(raw * hours)), row = watch.log[h];
      lapse.hour = h; lapse.azimuth = sunAzimuth(st, h + .5); lapse.battery = row.battery; lapse.lit = row.lit;
      moon.setSun(lapse.azimuth);
      const glow = row.cold ? .05 : row.science ? 1.4 : .6;
      for (const m of windowMats) { m.emissiveIntensity = glow; }
      porchLight.intensity = row.cold ? .4 : 6;
    }, t => t);
    lapse = null;
  }
  function restoreLights() { for (const m of windowMats) m.emissiveIntensity = 1; porchLight.intensity = 6; moon.setSun(s().scenario.window.startAzimuthDeg); }

  // ---- guidance ----------------------------------------------------------------------------------------
  const padMarker = id => padRing[id];
  const guideTarget = () => {
    const st = s(); if (st.phase !== 'active' || !st.plan) return null;
    if (st.plug === 'hand') return portHit;
    if (!st.legs) { if (!st.hitched) return handleHit; return st.cart === st.plan ? legHit : padMarker(st.plan); }
    if (st.stages < 1) return upHit;
    if (!st.wings) return wingHit;
    if (st.plug === 'reel') return plugHit;
    if (!st.tracker) return screenHit;
    return consoleGroup;
  };
  world.onFrame(() => world.guide(guideTarget(), .45));

  const walkTargets = [
    {id: 'console', label: '🖥️ Base console', x: 7.6, z: -3.6},
    {id: 'cart', label: '☀️ Solar cart', get x() { return cartPos.x; }, get z() { return cartPos.y; }},
    {id: 'port', label: '🔌 Power port', x: -.8, z: -3.6},
    {id: 'near', label: '🏠 Near pad', x: SITE.pads.near.x, z: SITE.pads.near.z + 3},
    {id: 'ridge', label: '⛰️ Ridge pad', x: SITE.pads.ridge.x, z: SITE.pads.ridge.z + 3},
  ];
  return {world, sync, idle: () => syncQueue, timelapse, restoreLights, cartPosition: () => ({x: cartPos.x, z: cartPos.y}), walkTargets,
    walk(id) {
      const t = walkTargets.find(w => w.id === id); if (!t) return;
      if (id === 'cart') { const h = s().hitched ? null : {x: cartPos.x + Math.sin(cartYaw) * (HITCH + .6), z: cartPos.y + Math.cos(cartYaw) * (HITCH + .6)}; return h ? player.navigate(h, {x: cartPos.x, z: cartPos.y}) : false; }
      if (s().hitched && SITE.pads[id]) {
        const pad = SITE.pads[id];
        const approach = new THREE.Vector2(pad.x - cartPos.x, pad.z - cartPos.y).setLength(HITCH);
        return player.navigate({x: pad.x + approach.x, z: pad.z + approach.y}, pad);
      }
      const look = id === 'console' ? {x: 6.6, z: -2.4} : id === 'port' ? {x: -.8, z: -2.3} : {x: t.x, z: t.z - 3};
      return player.navigate({x: t.x, z: t.z}, look);
    },
    /** Test helper: drop the player (and a hitched cart) at a spot. */
    teleport(x, z, yaw = player.yaw) { player.position.set(x, groundHeight(x, z) + 1.62, z); player.yaw = yaw; player.syncCamera(); if (s().hitched) tow(0); },
  };
}
