import * as THREE from 'three';
import { EVENTS, WORK } from './story.js';
import { buildOutpost } from './outpost.js';
import { startAudio, setMuted, playBeep } from './audio.js';

// ---------- Scene ----------
const container = document.getElementById('game-container');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc98a5a);
scene.fog = new THREE.Fog(0xc98a5a, 40, 160);
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);

const hemi = new THREE.HemisphereLight(0xffd9b0, 0x5a2a18, 0.8);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xffe2c0, 2.2);
sun.position.set(20, 25, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -25, right: 25, top: 25, bottom: -25 });
scene.add(sun);

const texLoader = new THREE.TextureLoader();
texLoader.loadAsync(new URL('./assets/mars-sky.webp', import.meta.url).href).then((tex) => {
  tex.mapping = THREE.EquirectangularReflectionMapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  scene.background = tex;
  scene.environment = tex;
}).catch(() => {});

const groundTex = texLoader.load(new URL('./assets/mars-ground.webp', import.meta.url).href);
groundTex.colorSpace = THREE.SRGBColorSpace;
groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping;
groundTex.repeat.set(40, 40);
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(400, 400),
  new THREE.MeshStandardMaterial({ map: groundTex, roughness: 1 })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Scattered rocks
const rockMat = new THREE.MeshStandardMaterial({ color: 0x7a3b22, roughness: 1, flatShading: true });
for (let i = 0; i < 80; i++) {
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(0.3 + Math.random() * 1.2), rockMat);
  const a = Math.random() * Math.PI * 2;
  const r = 14 + Math.random() * 80;
  rock.position.set(Math.cos(a) * r, 0.1, Math.sin(a) * r);
  rock.rotation.set(Math.random() * 3, Math.random() * 3, 0);
  rock.castShadow = true;
  scene.add(rock);
}

// Solar panel array (primitives)
const panels = [];
const panelMat = new THREE.MeshStandardMaterial({ color: 0x1a2a55, metalness: 0.6, roughness: 0.3 });
const poleMat = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, metalness: 0.8 });
for (let i = 0; i < 6; i++) {
  const g = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.2), poleMat);
  pole.position.y = 0.6;
  const panel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 1.4), panelMat);
  panel.position.y = 1.25;
  panel.rotation.x = -0.5;
  panel.castShadow = true;
  g.add(pole, panel);
  g.position.set(-10 + (i % 3) * 2.8, 0, -4 + Math.floor(i / 3) * 2.4);
  scene.add(g);
  panels.push(panel);
}

// Shelter visual (water walls) appears when built
const shelter = new THREE.Mesh(
  new THREE.BoxGeometry(3, 1.6, 3),
  new THREE.MeshStandardMaterial({ color: 0x4fb3c8, transparent: true, opacity: 0.55 })
);
shelter.position.set(6, 0.81, 4);
shelter.visible = false;
scene.add(shelter);

buildOutpost(scene);

// Dust particles for storms
const dustCount = 3000;
const dustPos = new Float32Array(dustCount * 3);
for (let i = 0; i < dustCount * 3; i++) {
  dustPos[i] = (Math.random() - 0.5) * 80;
}
const dustGeo = new THREE.BufferGeometry();
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dustMat = new THREE.PointsMaterial({ color: 0xd9925a, size: 0.25, transparent: true, opacity: 0 });
const dust = new THREE.Points(dustGeo, dustMat);
scene.add(dust);

window.addEventListener('resize', () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
});

// ---------- Audio ----------
let muted = false;
document.getElementById('mute').onclick = () => {
  muted = !muted;
  setMuted(muted);
  const button = document.getElementById('mute');
  button.textContent = muted ? '🔇' : '🔊';
  button.setAttribute('aria-label', muted ? 'Unmute audio' : 'Mute audio');
  button.setAttribute('aria-pressed', String(muted));
};

// ---------- Game state ----------
const RES = ['power', 'oxygen', 'water', 'food', 'radiation', 'equipment', 'morale'];
const RES_LABEL = { power: 'Power', oxygen: 'Oxygen', water: 'Water', food: 'Food', radiation: 'Rad Shield', equipment: 'Equipment', morale: 'Morale' };
let state;
let stormLevel = 0;

function newGame() {
  stormLevel = 0;
  hideModal();
  state = {
    sol: 1,
    res: { power: 70, oxygen: 75, water: 70, food: 65, radiation: 20, equipment: 70, morale: 70 },
    crew: [
      { name: 'Cmdr. Elena Reyes', role: 'Commander', hp: 100, fatigue: 10 },
      { name: 'Dr. Amara Okafor', role: 'Biologist', hp: 100, fatigue: 10 },
      { name: 'Jin Park', role: 'Engineer', hp: 100, fatigue: 10 },
      { name: 'Dr. Luca Moreau', role: 'Medic', hp: 100, fatigue: 10 },
    ],
    flags: {},
    log: [],
    ended: false,
  };
  shelter.visible = false;
  render();
}

const clamp = (v) => Math.max(0, Math.min(100, v));
function apply(fx = {}) {
  for (const k in fx) state.res[k] = clamp(state.res[k] + fx[k]);
}
const living = () => state.crew.filter((c) => c.hp > 0);
function hurtCrew(c, dmg, why) {
  c.hp = Math.max(0, c.hp - dmg);
  log(`${c.name} injured (${why}).` + (c.hp === 0 ? ' They did not survive.' : ''));
  if (c.hp === 0) state.res.morale = clamp(state.res.morale - 25);
}
function hurtRandom(dmg, why, count = 1) {
  const alive = living();
  for (let i = 0; i < count && alive.length; i++) {
    const [c] = alive.splice(Math.floor(Math.random() * alive.length), 1);
    hurtCrew(c, dmg, why);
  }
}
function log(msg) {
  state.log.unshift(`Sol ${state.sol}: ${msg}`);
  state.log.length = Math.min(state.log.length, 6);
}

// Daily consumption and consequences
function dailyUpkeep() {
  const n = living().length;
  const r = state.res;
  const decay = r.equipment < 30 ? 1.6 : 1;
  apply({ oxygen: -n * 1.5 * decay, water: -n * 1.2, food: -n * 1.3, power: -6 * decay, equipment: -3 });
  if (stormLevel > 0) apply({ power: state.flags.stormReady ? -4 : -14 });
  if (r.power < 15) {
    apply({ oxygen: -6, morale: -4 });
    log('Power critical: life support throttled.');
  }
  for (const c of living()) {
    c.fatigue = Math.min(100, c.fatigue + 5);
    if (c.fatigue > 80 && Math.random() < 0.3) hurtCrew(c, 10, 'exhaustion accident');
  }
  if (r.oxygen <= 0) hurtRandom(40, 'hypoxia');
  if (r.food <= 0 || r.water <= 0) hurtRandom(20, 'starvation/dehydration');
  if (r.morale < 20) apply({ equipment: -4 });
}

function chooseWork(w) {
  if (state.ended || currentEvent()) return;
  playBeep();
  apply(w.fx);
  if (w.rest) state.crew.forEach((c) => { c.fatigue = Math.max(0, c.fatigue - w.rest); });
  else state.crew.forEach((c) => { c.fatigue = Math.min(100, c.fatigue + 4); });
  log(`Crew focus: ${w.label}.`);
  endDay();
}

function endDay() {
  dailyUpkeep();
  if (!living().length) return ending();
  if (state.sol === 30) return ending();
  state.sol++;
  stormLevel = EVENTS[state.sol]?.storm ? 1 : 0;
  render();
}

function resolveChoice(ch) {
  if (state.ended) return;
  playBeep();
  apply(ch.fx);
  if (ch.flag) state.flags[ch.flag] = true;
  if (ch.flag === 'shelterBuilt') shelter.visible = true;
  if (ch.hurt) hurtRandom(ch.hurt, ch.hurtReason || 'suit failure', ch.hurtCount || 1);
  if (ch.fatigue) state.crew.forEach((c) => { c.fatigue = Math.min(100, c.fatigue + ch.fatigue); });
  if (ch.rest) state.crew.forEach((c) => { c.fatigue = Math.max(0, c.fatigue - ch.rest); });
  log(ch.note);
  if (!living().length) return ending();
  if (ch.skipWork) return endDay();
  state.eventDone = state.sol;
  render();
}

// Build the event for this sol (if any, and not yet resolved)
function currentEvent() {
  if (state.eventDone === state.sol) return null;
  const ev = EVENTS[state.sol];
  if (!ev) return null;
  if (ev.storm) {
    return {
      title: `Sol ${state.sol} — Dust Storm`,
      text: state.flags.stormReady ? 'Dust blots out the sun. Your reserves hold.' : 'Dust blots out the sun. Solar output collapses, and you were not ready.',
      choices: [{ label: 'Endure', fx: state.flags.stormReady ? {} : { oxygen: -6, morale: -5 }, note: 'The storm rages on.' }],
    };
  }
  if (ev.solarStorm) {
    const shielded = state.flags.shelterBuilt;
    return {
      title: 'Sol 27 — Radiation Storm',
      text: shielded ? 'Particle counts spike. The crew huddles behind the shielding for 30 hours. Dosimeters stay in safe ranges.' : 'Particle counts spike. With little shielding, the crew absorbs a dangerous dose.',
      choices: [{ label: 'Wait it out', fx: shielded ? { morale: 8 } : { morale: -15 }, hurt: shielded ? 0 : Math.max(10, 70 - state.res.radiation), hurtCount: 4, hurtReason: 'radiation sickness', note: shielded ? 'Preparation saved lives.' : 'Radiation sickness sets in.' }],
    };
  }
  if (ev.cond && !ev.cond(state)) return null;
  if (state.sol === 21) {
    const safe = state.flags.fungusStudied;
    return {
      title: ev.title,
      text: safe ? 'The study confirms the fungus is safe once cooked. It can add a reliable protein source to the menu.' : 'Two crew members get sick. The raw fungus held a mild toxin that a study would have found.',
      choices: [{ label: 'Continue', fx: safe ? { food: 25, morale: 10 } : { morale: -10 }, hurt: safe ? 0 : 25, hurtCount: 2, hurtReason: 'fungus poisoning', note: safe ? 'Science fed the crew.' : 'A hard lesson in rigor.' }],
    };
  }
  return { ...ev, choices: ev.choices.filter((c) => !c.cond || c.cond(state)) };
}

function ending() {
  state.ended = true;
  $('work').innerHTML = '';
  renderStats();
  const alive = living().length;
  const r = state.res;
  const prep = ['fungusStudied', 'roverSalvaged', 'stormReady', 'shelterBuilt'].filter((f) => state.flags[f]).length;
  let title;
  let text;
  if (alive === 0) {
    title = 'Silent Outpost';
    text = 'Meridian goes quiet. The next crew will study your logs and learn what went wrong.';
  } else if (alive === 4 && prep >= 3 && r.morale > 50) {
    title = 'Model Mission';
    text = 'All four astronauts return home healthy. Your careful data and preparation become the template for future outposts.';
  } else if (alive === 4) {
    title = 'Safe Return';
    text = 'Everyone made it home, though sometimes only just. Better planning could have made it easier.';
  } else {
    title = 'Costly Victory';
    text = `${alive} of 4 astronauts came home. The mission survived, but not everyone did.`;
  }
  showModal(`<h2 id="modal-heading">${title}</h2><p>${text}</p><p class="small">Preparations made: ${prep}/4 · Final morale ${Math.round(r.morale)}</p>
    <p class="lesson">Successful space exploration requires scientific thinking, careful preparation, and caring for your crew.</p>`,
    [{ label: 'Begin a new mission', onClick: () => { hideModal(); newGame(); } }]);
}

// ---------- UI ----------
const $ = (id) => document.getElementById(id);
function render() {
  renderStats();
  const ev = currentEvent();
  if (ev) {
    showModal(`<h2 id="modal-heading">${ev.title}</h2><p>${ev.text}</p>`, ev.choices.map((c) => ({ label: c.label, onClick: () => { hideModal(); resolveChoice(c); } })));
    $('work').innerHTML = '';
  } else {
    $('work').innerHTML = '<h3>Assign today\'s crew focus</h3>';
    WORK.forEach((w) => {
      const b = document.createElement('button');
      b.textContent = w.label;
      b.onclick = () => chooseWork(w);
      $('work').appendChild(b);
    });
  }
}
function renderStats() {
  $('sol').textContent = `SOL ${state.sol} / 30`;
  $('resources').innerHTML = RES.map((k) => {
    const v = Math.round(state.res[k]);
    const col = v < 25 ? '#ff5a4a' : v < 50 ? '#ffb347' : '#5fe0c8';
    return `<div class="res"><span>${RES_LABEL[k]}</span><div class="bar"><i style="width:${v}%;background:${col}"></i></div><b>${v}</b></div>`;
  }).join('');
  $('crew').innerHTML = state.crew.map((c) => `<div class="crew ${c.hp <= 0 ? 'dead' : ''}"><b>${c.name}</b><small>${c.role}</small>
    <div class="mini">HP ${c.hp} · Fatigue ${c.fatigue}</div></div>`).join('');
  $('log').innerHTML = state.log.map((l) => `<div>${l}</div>`).join('');

}

function showModal(html, buttons) {
  $('modal-body').innerHTML = html;
  const box = $('modal-buttons');
  box.innerHTML = '';
  buttons.forEach((b) => {
    const el = document.createElement('button');
    el.textContent = b.label;
    el.onclick = b.onClick;
    box.appendChild(el);
  });
  $('modal').hidden = false;
  $('hud').inert = true;
  box.firstElementChild?.focus();
}
function hideModal() {
  $('modal').hidden = true;
  $('hud').inert = false;
}

$('start').onclick = () => {
  $('title').style.display = 'none';
  $('hud').hidden = false;
  startAudio();
  playBeep();
  newGame();
};

// ---------- Loop ----------
const timer = new THREE.Timer();
timer.connect(document);
let angle = 0.6;
renderer.setAnimationLoop((time) => {
  timer.update(time);
  const dt = Math.min(timer.getDelta(), 0.1);
  angle += dt * 0.05;
  camera.position.set(Math.cos(angle) * 22, 9, Math.sin(angle) * 22);
  camera.lookAt(0, 2, 0);
  const target = stormLevel ? 0.8 : 0;
  dustMat.opacity += (target - dustMat.opacity) * dt * 2;
  scene.fog.far += ((stormLevel ? 35 : 160) - scene.fog.far) * dt;
  sun.intensity += ((stormLevel ? 0.6 : 2.2) - sun.intensity) * dt;
  const p = dustGeo.attributes.position;
  for (let i = 0; i < dustCount; i++) {
    let x = p.getX(i) + dt * 12;
    if (x > 40) x -= 80;
    p.setX(i, x);
  }
  p.needsUpdate = true;
  renderer.render(scene, camera);
});
