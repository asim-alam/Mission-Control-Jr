// Shared 3D runtime for the six expansion missions.
// It owns the renderer, lighting presets, walking camera, look-to-use interaction,
// carrying, held actions, tweens, guide arrows, cables and particle effects.
// Game rules live in each mission's actions.js; this file only shows and collects actions.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {Player} from '../../player.js';
import {makeCrew} from './crew.js';
import {graphicsProfile} from '../../simulation/graphics.js';

const loader = new GLTFLoader();
const cache = new Map();
/** Load a GLB once; every placement is a deep clone with its own materials (so highlights stay local). */
export async function loadModel(url) {
  const href = url.href || url;
  if (!cache.has(href)) cache.set(href, loader.loadAsync(href).then(g => g.scene));
  const source = await cache.get(href);
  const clone = source.clone(true);
  clone.traverse(o => { if (o.isMesh) { o.material = o.material.clone(); o.castShadow = o.receiveShadow = true; } });
  return clone;
}

const PRESETS = {
  interior: {background: 0x0f1622, exposure: .92, env: .38, hemi: [0xdfe8ff, 0x3a2e28, .45], key: [0xfff0dc, .9, [3, 7, 2]], fog: null},
  moon: {background: 0x02030a, exposure: 1.18, env: .12, hemi: [0x9aa8c8, 0x15161a, .14], key: [0xfff6e8, 4.2, [-60, 4.2, 22]], fog: null},
};

export async function createWorld({container, preset = 'interior', bounds, start = {x: 0, z: 0, yaw: 0}, eyeHeight = 1.62, onPause = () => {}, onStep = () => {}}) {
  const profile = graphicsProfile();
  const renderer = new THREE.WebGLRenderer({antialias: !profile.lowEffects, powerPreference: 'high-performance'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, profile.pixelRatioCap));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const look = PRESETS[preset];
  renderer.toneMappingExposure = look.exposure;
  renderer.shadowMap.enabled = !profile.lowEffects;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  container.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(look.background);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = look.env;
  const hemi = new THREE.HemisphereLight(...look.hemi); scene.add(hemi);
  const key = new THREE.DirectionalLight(look.key[0], look.key[1]);
  key.position.set(...look.key[2]); key.castShadow = !profile.lowEffects;
  key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -.0005; key.shadow.normalBias = .03;
  Object.assign(key.shadow.camera, {left: -14, right: 14, top: 14, bottom: -14, near: .5, far: 160});
  scene.add(key, key.target);

  const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, .04, 2000);
  scene.add(camera);
  const player = new Player(camera, renderer.domElement, () => interaction.use(), onPause, onStep);
  const avatar = await makeCrew('jin', {suitMode: preset === 'moon'});
  avatar.model.name = 'Player astronaut';
  avatar.model.visible = false;
  scene.add(avatar.model);
  player.thirdPersonDistance = preset === 'moon' ? 3.5 : 1.9;
  player.view = 'third';
  player.eyeHeight = eyeHeight;
  player.bounds = bounds; player.position.set(start.x, eyeHeight, start.z); player.yaw = start.yaw || 0; player.pitch = -.12; player.syncCamera();

  // ---- frame loop ----------------------------------------------------------------------
  const updaters = new Set(); let last = performance.now(), raf = 0, alive = true, elapsed = 0;
  const onFrame = fn => (updaters.add(fn), () => updaters.delete(fn));
  function frame(now) {
    if (!alive) return;
    const dt = Math.min((now - last) / 1000, .1); last = now; elapsed += dt;
    const moved = player.update(dt);
    for (const fn of [...updaters]) fn(dt, elapsed, moved);
    avatar.model.visible = player.view === 'third' && player.cameraDistance > .65;
    if (avatar.model.visible) {
      avatar.model.position.copy(player.position);
      avatar.model.position.y -= player.eyeHeight;
      avatar.model.rotation.y = moved ? player.facing : player.yaw + Math.PI;
      avatar.mode = moved ? 'walk' : 'idle';
      avatar.update(dt);
    }
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  function resize() { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); }
  addEventListener('resize', resize);

  // ---- tweens -----------------------------------------------------------------------------
  function tween(seconds, step, ease = t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2) {
    return new Promise(resolve => {
      let t = 0;
      const stop = onFrame(dt => { t = Math.min(1, t + dt / seconds); step(ease(t), t); if (t >= 1) { stop(); resolve(); } });
      if (seconds <= 0) { step(1, 1); stop(); resolve(); }
    });
  }

  // ---- hands: the carried object floats in front of the camera ---------------------------
  const hand = new THREE.Group(); hand.position.set(.32, -.38, -.75); camera.add(hand);
  let held = null;
  function hold(object, {scale = 1, offset = [0, 0, 0], rotation = [0, 0, 0]} = {}) {
    if (held) release();
    const from = new THREE.Vector3(); object.getWorldPosition(from);
    hand.attach(object); held = object;
    object.userData.handScale = scale;
    const startPos = object.position.clone(), startScale = object.scale.clone(), target = new THREE.Vector3(...offset);
    const startQ = object.quaternion.clone(), targetQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation));
    return tween(.35, t => { object.position.lerpVectors(startPos, target, t); object.scale.lerpVectors(startScale, new THREE.Vector3(scale, scale, scale), t); object.quaternion.slerpQuaternions(startQ, targetQ, t); });
  }
  /** Move the held object (or any object) to a world socket and parent it there. */
  async function place(object, socket, {seconds = .55, arc = .35, scale = 1} = {}) {
    if (object === held) held = null;
    scene.attach(object);
    const a = object.position.clone(), qa = object.quaternion.clone(), sa = object.scale.clone();
    const b = new THREE.Vector3(), qb = new THREE.Quaternion(), sb = new THREE.Vector3();
    socket.updateWorldMatrix(true, false); socket.matrixWorld.decompose(b, qb, sb); sb.multiplyScalar(scale);
    await tween(seconds, t => { object.position.lerpVectors(a, b, t); object.position.y += Math.sin(Math.PI * t) * arc; object.quaternion.slerpQuaternions(qa, qb, t); object.scale.lerpVectors(sa, sb, t); });
    socket.attach(object); object.position.set(0, 0, 0); object.quaternion.identity(); object.scale.setScalar(scale);
  }
  function release() { if (held) { scene.attach(held); held = null; } }
  // Small walking bob for the hands.
  onFrame((dt, t, moved) => {
    hand.position.set(.32, (player.view === 'third' ? -.28 : -.38) + (moved ? Math.sin(t * 9) * .012 : 0),
      player.view === 'third' ? -player.cameraDistance - .55 : -.75);
  });

  // ---- interaction: look (or point) at a registered thing and press E / click -------------
  const raycaster = new THREE.Raycaster(), center = new THREE.Vector2(0, 0), pointer = new THREE.Vector2(), tmp = new THREE.Vector3();
  const items = new Map(); let focused = null, holdState = null, pointerAim = null, preferred = null, preferredRequiresFacing = true, suppressOtherTargets = false;
  const listeners = {focus: () => {}, hold: () => {}};
  const holdOf = item => typeof item.holdSeconds === 'function' ? item.holdSeconds() : item.holdSeconds;
  const highlight = new THREE.Color(0xffd23f);
  function setGlow(item, amount) {
    item.object.traverse(o => {
      if (!o.isMesh) return;
      o.userData.baseEmissive ??= o.material.emissive?.clone();
      o.userData.baseEmissiveIntensity ??= o.material.emissiveIntensity;
      if (!o.material.emissive) return;
      if (amount > 0) { o.material.emissive.copy(o.userData.baseEmissive).lerp(highlight, Math.min(1, amount)); o.material.emissiveIntensity = Math.max(o.userData.baseEmissiveIntensity, amount * .9); }
      else { o.material.emissive.copy(o.userData.baseEmissive); o.material.emissiveIntensity = o.userData.baseEmissiveIntensity; }
    });
  }
  /**
   * Register something the player can use.
   * spec: {id, object, label(): string, enabled(): bool, range, holdSeconds, onUse(), onHold(progress)}
   */
  function register(spec) {
    const item = {range: 2.4, holdSeconds: 0, enabled: () => true, ...spec};
    item.object.userData.interactId = item.id;
    items.set(item.id, item); return () => { if (focused === item) setFocus(null); items.delete(item.id); };
  }
  function distanceTo(item) { item.object.getWorldPosition(tmp); return Math.hypot(tmp.x - player.position.x, tmp.z - player.position.z); }
  function withinReach(item) { return item.object.visible && item.enabled() && distanceTo(item) <= item.range; }
  function preferredInReach() {
    const item = preferred && items.get(preferred());
    if (item && (preferredRequiresFacing ? frontScore(item) < Infinity : withinReach(item))) return item;
    return null;
  }
  function preferredItem() {
    const item = preferred && items.get(preferred());
    return item?.enabled() ? item : null;
  }
  function pick(ndc) {
    raycaster.setFromCamera(ndc, camera); raycaster.far = 6 + player.cameraDistance;
    const targets = [...items.values()].filter(i => i.object.visible && i.enabled()).map(i => i.object);
    for (const hit of raycaster.intersectObjects(targets, true)) {
      for (let object = hit.object; object; object = object.parent) {
        const item = items.get(object.userData.interactId);
        if (item?.object !== object || !item.enabled()) continue;
        return distanceTo(item) <= item.range ? item : null;
      }
    }
    return null;
  }
  function frontScore(item) {
    if (!item.object.visible || !item.enabled()) return Infinity;
    const d = distanceTo(item); if (d > item.range) return Infinity;
    const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd);
    item.object.getWorldPosition(tmp); tmp.sub(player.position).setY(0).normalize();
    const facing = tmp.dot(new THREE.Vector3(fwd.x, 0, fwd.z).normalize());
    return facing < .35 ? Infinity : d - facing * 1.5;
  }
  function nearestInFront() {
    let best = null, bestScore = Infinity;
    for (const item of items.values()) { const score = frontScore(item); if (score < bestScore) { bestScore = score; best = item; } }
    // Stay on the current target unless another one is clearly better (stops flicker while holding E).
    if (focused && best !== focused && frontScore(focused) < bestScore + .6) return focused;
    return best;
  }
  function setFocus(item) {
    if (focused === item) return;
    if (focused) setGlow(focused, 0);
    focused = item; listeners.focus(item ? {id: item.id, label: item.label(), hold: holdOf(item) > 0} : null);
  }
  onFrame((dt, t) => {
    if (!player.enabled) { setFocus(null); return; }
    const guided = preferredItem();
    const item = holdState && focused && frontScore(focused) < Infinity ? focused
      : preferredInReach() || (guided && suppressOtherTargets ? null : (pointerAim && pick(pointerAim)) || pick(center) || nearestInFront());
    setFocus(item);
    if (focused) { setGlow(focused, .35 + Math.sin(t * 6) * .2); listeners.focus({id: focused.id, label: focused.label(), hold: holdOf(focused) > 0}); }
    if (!holdState && eDown && !eCompleted && focused && holdOf(focused) > 0) holdState = {id: focused.id, start: performance.now()};
    if (holdState) {
      if (!focused || focused.id !== holdState.id) { holdState = null; listeners.hold(0); }
      else {
        const p = Math.min(1, (performance.now() - holdState.start) / 1000 / holdOf(focused));
        focused.onHold?.(p, dt); listeners.hold(p);
        if (p >= 1) { const done = focused; holdState = null; if (eDown) eCompleted = true; listeners.hold(0); done.onUse(); }
      }
    }
  });
  function useItem(item) {
    if (!player.enabled || !item || !withinReach(item)) return false;
    setFocus(item);
    if (holdOf(item) > 0) { holdState ||= {id: item.id, start: performance.now()}; return true; }
    item.onUse();
    return true;
  }
  const interaction = {
    use() { return useItem((!preferredRequiresFacing && preferredInReach()) || focused); },
    stopHold() { if (holdState) { holdState = null; listeners.hold(0); } },
    useById(id) { return useItem(items.get(id)); },
    on(event, fn) { listeners[event] = fn; },
    preferTarget(getId, {requiresFacing = true, suppressOtherTargets: suppress = false} = {}) { preferred = getId; preferredRequiresFacing = requiresFacing; suppressOtherTargets = suppress; },
    get focused() { return focused?.id || null; },
  };
  // Hold E (or hold the pointer) for held actions.
  // One key hold completes one job, even if the next target appears under the same cursor.
  let eDown = false, eCompleted = false;
  addEventListener('keydown', e => { if (e.code === 'KeyE') eDown = true; });
  addEventListener('keyup', e => { if (e.code === 'KeyE') { eDown = false; eCompleted = false; interaction.stopHold(); } });
  addEventListener('blur', () => { eDown = false; eCompleted = false; interaction.stopHold(); });
  const canvas = renderer.domElement;
  canvas.addEventListener('pointermove', e => { if (e.pointerType === 'mouse' && !player.drag) { const r = canvas.getBoundingClientRect(); pointer.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); pointerAim = pointer; } });
  canvas.addEventListener('pointerleave', () => { pointerAim = null; });
  canvas.addEventListener('pointerup', e => { if (e.button !== 0 || (player.drag?.distance || 0) > 8) { interaction.stopHold(); return; } const r = canvas.getBoundingClientRect(); pointer.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); const item = pick(pointer); if (item && !(holdOf(item) > 0)) { setFocus(item); item.onUse(); } interaction.stopHold(); });
  canvas.addEventListener('pointerdown', e => { if (e.button !== 0) return; const r = canvas.getBoundingClientRect(); pointer.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); const item = pick(pointer); if (item && holdOf(item) > 0) { setFocus(item); holdState = {id: item.id, start: performance.now()}; } });

  // ---- guide arrow: a bouncing chevron above the next target -----------------------------
  const arrow = new THREE.Group();
  const arrowMat = new THREE.MeshStandardMaterial({color: 0xffd23f, emissive: 0xffa21f, emissiveIntensity: 1.2, roughness: .4});
  const cone = new THREE.Mesh(new THREE.ConeGeometry(.16, .32, 4), arrowMat); cone.rotation.x = Math.PI; arrow.add(cone);
  const stem = new THREE.Mesh(new THREE.BoxGeometry(.08, .22, .08), arrowMat); stem.position.y = .25; arrow.add(stem);
  arrow.visible = false; scene.add(arrow); let guideTarget = null, guideLift = .5;
  function updateGuidePosition(t = elapsed) {
    if (!guideTarget) return;
    const box = new THREE.Box3().setFromObject(guideTarget);
    if (box.isEmpty()) return;
    arrow.position.set((box.min.x + box.max.x) / 2, box.max.y + guideLift + Math.sin(t * 3.5) * .12, (box.min.z + box.max.z) / 2);
    arrow.rotation.y = t * 1.6;
    const d = arrow.position.distanceTo(camera.position); arrow.scale.setScalar(Math.max(1, d / 7));
  }
  function guide(object, lift = .5) { guideTarget = object; guideLift = lift; arrow.visible = !!object; updateGuidePosition(); }
  onFrame((dt, t) => {
    updateGuidePosition(t);
  });
  function guideScreen() {
    if (!guideTarget) return null;
    updateGuidePosition();
    camera.updateWorldMatrix(true, false);
    arrow.updateMatrixWorld(true);
    const v = arrow.position.clone().project(camera);
    const behind = v.z > 1; return {x: (v.x + 1) / 2, y: (1 - v.y) / 2, behind, onScreen: !behind && Math.abs(v.x) < .92 && Math.abs(v.y) < .92};
  }
  function guideInfo() {
    if (!guideTarget) return null;
    const dist = Math.hypot(arrow.position.x - player.position.x, arrow.position.z - player.position.z);
    const rel = relativeNavigation(player.position, player.yaw, arrow.position);
    return {target: guideTarget, position: arrow.position, distance: dist, relative: rel, screen: guideScreen()};
  }

  // ---- cables: a sagging tube between two moving points ----------------------------------
  function cable({from, to, color = 0xffb02e, radius = .025, sag = .35, segments = 24}) {
    const mat = new THREE.MeshStandardMaterial({color, roughness: .6});
    const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat); mesh.castShadow = true; scene.add(mesh);
    const a = new THREE.Vector3(), b = new THREE.Vector3(); let lastKey = '';
    const stop = onFrame(() => {
      from(a); to(b); const key = a.toArray().concat(b.toArray()).map(n => n.toFixed(2)).join();
      if (key === lastKey) return; lastKey = key;
      const length = a.distanceTo(b), pts = [];
      for (let i = 0; i <= 8; i++) { const t = i / 8, p = a.clone().lerp(b, t); p.y -= Math.sin(Math.PI * t) * Math.min(sag, length * .12); pts.push(p); }
      mesh.geometry.dispose(); mesh.geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), segments, radius, 6);
    });
    return {mesh, remove() { stop(); scene.remove(mesh); mesh.geometry.dispose(); mat.dispose(); }};
  }

  // ---- particles: puffs of dust, water drops, sparks, radiation streaks ------------------
  // A soft round dot so particles never look like squares up close.
  const dot = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(.45, 'rgba(255,255,255,.85)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
  function particles({count = 60, color = 0xffffff, size = .06, opacity = .9, additive = false, gravity = -1, spawn, life = [1, 2]}) {
    const geo = new THREE.BufferGeometry(), pos = new Float32Array(count * 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({color, size: size * 1.6, map: dot, alphaTest: .02, transparent: true, opacity, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending});
    const points = new THREE.Points(geo, mat); points.frustumCulled = false; scene.add(points);
    const state = Array.from({length: count}, () => ({age: 1, life: 0, p: new THREE.Vector3(0, -999, 0), v: new THREE.Vector3()}));
    let rate = 0, budget = 0;
    const stop = onFrame(dt => {
      budget += rate * dt;
      for (const s of state) {
        if (s.age >= s.life && budget >= 1) { budget--; s.age = 0; s.life = life[0] + Math.random() * (life[1] - life[0]); spawn(s.p, s.v); }
        if (s.age < s.life) { s.age += dt; s.v.y += gravity * dt; s.p.addScaledVector(s.v, dt); } else s.p.set(0, -999, 0);
      }
      state.forEach((s, i) => pos.set([s.p.x, s.p.y, s.p.z], i * 3)); geo.attributes.position.needsUpdate = true;
      budget = Math.min(budget, count);
    });
    return {points, set rate(v) { rate = v; }, get rate() { return rate; }, burst(n) { budget += n; }, remove() { stop(); scene.remove(points); geo.dispose(); mat.dispose(); }};
  }

  // ---- labels: small text sprites for in-world signs -------------------------------------
  function sign(text, {width = 1.2, color = '#ffd23f', background = 'rgba(18,15,46,.86)', font = 64} = {}) {
    const c = document.createElement('canvas'); const ctx = c.getContext('2d'); ctx.font = `700 ${font}px Fredoka Variable, Nunito Variable, system-ui`;
    const w = Math.ceil(ctx.measureText(text).width) + font; c.width = w; c.height = font * 1.6;
    ctx.font = `700 ${font}px Fredoka Variable, Nunito Variable, system-ui`; ctx.fillStyle = background; ctx.beginPath(); ctx.roundRect(0, 0, c.width, c.height, font * .5); ctx.fill();
    ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'; ctx.fillText(text, c.width / 2, c.height / 2 + 3);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({map: tex, depthWrite: false, transparent: true}));
    sprite.scale.set(width, width * c.height / c.width, 1); sprite.renderOrder = 5; return sprite;
  }

  function place3d(object, x, y, z, yaw = 0, parent = scene) { object.position.set(x, y, z); object.rotation.y = yaw; parent.add(object); return object; }

  function dispose() {
    alive = false; cancelAnimationFrame(raf); removeEventListener('resize', resize);
    scene.traverse(o => { if (o.isMesh || o.isPoints || o.isSprite) { o.geometry?.dispose(); (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.map?.dispose(); m.dispose(); }); } });
    renderer.dispose(); renderer.domElement.remove();
  }

  return {renderer, scene, camera, player, key, hemi, profile, onFrame, tween, hold, place, release, get held() { return held; }, hand,
    register, interaction, guide, guideScreen, guideInfo, cable, particles, sign, place3d, loadModel, dispose};
}

/** Find a named node in a loaded model, or throw a clear error during development. */
export function part(object, name) { const found = object.getObjectByName(name); if (!found) console.warn(`Missing node "${name}" in ${object.name}`); return found || new THREE.Group(); }
/** Recolour every mesh material under a node (materials are per-instance after loadModel). */
export function tint(object, color, emissive = null, intensity = 1) {
  object.traverse(o => { if (!o.isMesh) return; o.material.color?.set(color); if (emissive !== null && o.material.emissive) { o.material.emissive.set(emissive); o.material.emissiveIntensity = intensity; o.userData.baseEmissive = o.material.emissive.clone(); o.userData.baseEmissiveIntensity = intensity; } });
}
export function setOpacity(object, opacity) {
  object.traverse(o => { if (!o.isMesh) return; o.material.transparent = opacity < 1; o.material.opacity = opacity; o.material.depthWrite = opacity >= .99; });
}

/** Compute left/right and backward/forward relative navigation vector from player to target */
export function relativeNavigation(playerPos, playerYaw, targetPos) {
  if (!playerPos || !targetPos) return null;
  const dx = targetPos.x - playerPos.x;
  const dz = targetPos.z - playerPos.z;
  const total = Math.hypot(dx, dz);
  const yaw = playerYaw || 0;
  const forward = -dx * Math.sin(yaw) - dz * Math.cos(yaw);
  const right = dx * Math.cos(yaw) - dz * Math.sin(yaw);

  const fbDist = Math.abs(forward);
  const lrDist = Math.abs(right);
  const fbWord = forward >= 0 ? 'Forward' : 'Backward';
  const fbArrow = forward >= 0 ? '⬆️' : '⬇️';
  const lrWord = right >= 0 ? 'Right' : 'Left';
  const lrArrow = right >= 0 ? '➡️' : '⬅️';

  const ready = total <= 2.2;
  let summary = '';
  if (ready) {
    summary = '✨ In reach!';
  } else {
    const parts = [];
    if (fbDist >= 0.2) parts.push(`${fbArrow} ${fbWord} ${fbDist.toFixed(1)} m`);
    if (lrDist >= 0.2) parts.push(`${lrArrow} ${lrWord} ${lrDist.toFixed(1)} m`);
    summary = parts.join(' · ') || `${total.toFixed(1)} m`;
  }

  return {
    total,
    forward,
    right,
    fbWord,
    fbArrow,
    fbDist,
    lrWord,
    lrArrow,
    lrDist,
    summary,
    ready
  };
}
