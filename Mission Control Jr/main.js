import * as THREE from 'three';
import {mountPipLesson, pipLessonOpen} from './professor-pip.js';
import {showCameraView} from './player.js';
import {connectChapter,completeChapter,openJourney,journeyPaused} from './campaign-bridge.js';
import { EVENTS, WORK } from './story.js';
import { buildOutpost } from './outpost.js';
import { startAudio, setMuted, playBeep, disposeAudio } from './audio.js';
import {readMissionCarry} from './journey-state.js';
import {installHiddenScrollUI} from './scroll-ui.js';
import {modeledStormExposure,remainingCrewCondition} from './simulation/legacy-exposure.js';
import {selectDecisionReview} from './simulation/decision-review.js';
installHiddenScrollUI();

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

// Distinct low-poly rover cabin shelter; only visible for that chosen method.
const roverShelter = new THREE.Group();
const roverCabin = new THREE.Mesh(new THREE.BoxGeometry(3.8,1.7,2.5),new THREE.MeshStandardMaterial({color:0x8d7965,roughness:.85}));
roverCabin.position.y=.9;roverShelter.add(roverCabin);
const roverOpening = new THREE.Mesh(new THREE.BoxGeometry(1.1,1.15,.06),new THREE.MeshStandardMaterial({color:0x192a31,emissive:0x142126}));
roverOpening.position.set(0,.75,1.28);roverShelter.add(roverOpening);
roverShelter.position.set(10,0,4);roverShelter.visible=false;scene.add(roverShelter);

let commander;
buildOutpost(scene).then(() => {
  commander = scene.children.find(model => model.name === 'astronaut GLB');
});

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
if (window.parent !== window) connectChapter('extended',value=>setMuted(value||muted));
addEventListener('pagehide',()=>{disposeAudio();renderer.setAnimationLoop(null);renderer.dispose();});
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
const RES_LABEL = { power: 'Power', oxygen: 'Air', water: 'Water', food: 'Food', radiation: 'Sun shield', equipment: 'Machines', morale: 'Happy' };
let carriedMission={stormOutcome:null,successfulTraverse:false};try{carriedMission=readMissionCarry(localStorage);}catch{/* Direct play remains available without browser storage. */}
let state;
let stormLevel = 0;

function newGame(seed = 42) {
  stormLevel = 0;
  hideModal();
  state = {
    sol: 1,
    res: { power: 70, oxygen: carriedMission.stormOutcome==='prepared'?80:75, water: 70, food: 65, radiation: 20, equipment: 70, morale: 70 },
    crew: [
      { name: 'Cmdr. Elena Reyes', role: 'Commander', hp: 100, fatigue: 10 },
      { name: 'Dr. Amara Okafor', role: 'Biologist', hp: 100, fatigue: 10 },
      { name: 'Jin Park', role: 'Engineer', hp: 100, fatigue: 10 },
      { name: 'Dr. Luca Moreau', role: 'Medic', hp: 100, fatigue: 10 },
    ],
    flags: {
      ...(carriedMission.stormOutcome==='prepared'?{stormReady:true}:{}),
      ...(carriedMission.successfulTraverse?{kestrelSurveyed:true}:{}),
    },
    log: [], decisionHistory: [], seed: seed >>> 0, randomState: seed >>> 0,
    shieldWater: 0, shelterType: null, exposurePoints: 0, cropProgress: 0, cropPlantedSol: null,
    ended: false,
  };
  shelter.visible = false;
  roverShelter.visible = false;
  render();
}

const clamp = (v) => Math.max(0, Math.min(100, v));
function randomEvent() { state.randomState=(Math.imul(1664525,state.randomState)+1013904223)>>>0;return state.randomState/4294967296; }
function apply(fx = {}) {
  for (const k in fx) state.res[k] = k==='water'?Math.max(state.shieldWater,clamp(state.res[k] + fx[k])):clamp(state.res[k] + fx[k]);
}
const living = () => state.crew.filter((c) => c.hp > 0);
function hurtCrew(c, dmg, why) {
  c.hp = remainingCrewCondition(c.hp,dmg);
  log(`${c.name} got hurt (${why}) and needs rest. Don't worry, they will get better.`);
}
function hurtRandom(dmg, why, count = 1) {
  const alive = living();
  for (let i = 0; i < count && alive.length; i++) {
    const [c] = alive.splice(Math.floor(randomEvent() * alive.length), 1);
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
    log('Power is very low! The air machine slows down.');
  }
  for (const c of living()) {
    c.fatigue = Math.min(100, c.fatigue + 5);
    if (c.fatigue > 80 && randomEvent() < 0.3) hurtCrew(c, 10, 'too tired');
  }
  if (r.oxygen <= 0) hurtRandom(40, 'hypoxia');
  if (r.food <= 0 || r.water-state.shieldWater <= 0) hurtRandom(20, 'starvation/dehydration');
  if (r.morale < 20) apply({ equipment: -4 });
}

function chooseWork(w) {
  if (state.ended || currentEvent()) return;
  if(w.id==='farm' && (state.res.power<4 || state.res.water-state.shieldWater<3)){log('The plants need more power and water.');render();return;}
  playBeep();
  apply(w.fx);
  state.decisionHistory.push({sol:state.sol,type:'work',choice:w.id});
  if(w.id==='farm'){
    state.cropPlantedSol ??= state.sol;
    state.cropProgress+=1;
    log('The plants got light and water. They will be ready later.');
  }
  if (w.rest) state.crew.forEach((c) => { c.fatigue = Math.max(0, c.fatigue - w.rest); });
  else state.crew.forEach((c) => { c.fatigue = Math.min(100, c.fatigue + 4); });
  log(`Today's job: ${w.label}.`);
  endDay();
}

function endDay() {
  dailyUpkeep();
  if(state.cropProgress>=2 && state.sol-state.cropPlantedSol>=2){apply({food:5});state.cropProgress=0;state.cropPlantedSol=null;log('Some fresh food is ready to eat! We still need the packed food too.');}
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
  state.decisionHistory.push({sol:state.sol,type:'event',choice:ch.label});
  if(ch.shieldWater)state.shieldWater=ch.shieldWater;
  if(ch.shelterType)state.shelterType=ch.shelterType;
  if(ch.exposurePoints)state.exposurePoints+=ch.exposurePoints;
  if (ch.flag) state.flags[ch.flag] = true;
  if (ch.shelterType === 'water') shelter.visible = true;
  if (ch.shelterType === 'rover') roverShelter.visible = true;
  if (ch.hurt) hurtRandom(ch.hurt, ch.hurtReason || 'spacesuit leak', ch.hurtCount || 1);
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
  let choices=ev.choices;
  if (state.sol === 8 && state.flags.kestrelSurveyed) {
    choices = [...choices, { label: 'Use the rover map from Kestrel Ridge to pick a safe path', fx: { equipment: 10, power: 5 }, flag: 'kestrelRouteUsed', note: 'Your rover map showed the safest way. Great!' }];
  }
  if (ev.storm) {
    return {
      title: `Day ${state.sol} — Dust Storm`,
      text: state.flags.stormReady ? 'Dust hides the Sun. You saved enough, so the base is OK!' : 'Dust hides the Sun. The solar panels make almost no power, and you did not save enough.',
      choices: [{ label: 'Wait for the storm to pass', fx: state.flags.stormReady ? {} : { oxygen: -6, morale: -5 }, note: 'The storm keeps blowing.' }],
    };
  }
  if (ev.solarStorm) {
    const exposure=modeledStormExposure(state.res.radiation), shelter=state.shelterType;
    const shelterName=shelter==='water'?'the beds with water around them':shelter==='rover'?'the old rover':'the base with no extra cover';
    return {
      title: 'Day 27 — Sun Storm',
      text: `The Sun storm is here. The crew hides in ${shelterName}. Radiation points: ${exposure.exposurePoints}. Extra cover makes this number smaller, but never zero.`,
      choices: [{ label: 'Wait it out', fx: shelter ? { morale: 8 } : { morale: -15 }, exposurePoints: exposure.exposurePoints, hurt: exposure.crewConditionLoss, hurtCount: 4, hurtReason: 'Sun storm', note: shelter ? 'Your cover helped! The crew needs a little rest.' : 'The crew got more radiation and needs rest to get better.' }],
    };
  }
  if (ev.cond && !ev.cond(state)) return null;
  if (state.sol === 21) {
    const safe = state.flags.fungusStudied;
    return {
      title: ev.title,
      text: safe ? 'The test says the mushroom is safe when cooked. Now there is more food for everyone!' : 'Two crew members get a tummy ache. The mushroom had something bad in it. A test would have found it.',
      choices: [{ label: 'Continue', fx: safe ? { food: 25, morale: 10 } : { morale: -10 }, hurt: safe ? 0 : 25, hurtCount: 2, hurtReason: 'fungus poisoning', note: safe ? 'Science gave the crew more food!' : 'Lesson learned: test first.' }],
    };
  }
  return { ...ev, choices: choices.filter((c) => !c.cond || c.cond(state)) };
}

function ending() {
  state.ended = true;
  $('work').innerHTML = '';
  renderStats();
  const readyCrew = state.crew.filter((c) => c.hp >= 50).length;
  const r = state.res;
  const prep = ['fungusStudied', 'roverSalvaged', 'stormReady', 'shelterBuilt'].filter((f) => state.flags[f]).length;
  let title;
  let text;
  if (readyCrew === 4 && prep >= 3 && r.morale > 50) {
    title = 'Super Mission';
    text = 'All four astronauts are healthy and happy. Your careful plan will help future Mars bases!';
  } else if (readyCrew === 4) {
    title = 'Safe Return';
    text = 'Everyone is safe, but it was close sometimes. Planning ahead makes it easier.';
  } else {
    title = 'Recovery Needed';
    text = `${readyCrew} of 4 crew members are ready to go. Everyone is safe. The others need some rest to get better.`;
  }
  completeChapter('extended',{outcome:title,attemptCompleted:true,success:readyCrew===4,mastered:title==='Super Mission'});
  const decisionReview=selectDecisionReview(state.decisionHistory);
  const review=decisionReview.entries.map(entry=>`<li>Sol ${entry.sol}: ${entry.choice}</li>`).join('');
  const summarizedWork=decisionReview.summarizedWork?`<li>${decisionReview.summarizedWork} more daily job choices are not shown. All your big choices are listed.</li>`:'';
  let explanation='Good job plans and safe hiding spots keep the crew healthy and the supplies full.';try{if(localStorage.getItem('mission-control-jr.learning-mode.v1')==='details')explanation=`Current resources: power ${Math.round(r.power)}, oxygen ${Math.round(r.oxygen)}, water ${Math.round(r.water)}, food ${Math.round(r.food)}, equipment ${Math.round(r.equipment)}, morale ${Math.round(r.morale)}. Every choice changes these numbers. They are game numbers, not real ones.`;}catch{}
  showModal(`<h2 id="modal-heading">Base Boss Report · ${title}</h2><p>${text}</p><p class="small">Things you got ready: ${prep}/4 · Happiness at the end ${Math.round(r.morale)}</p>
    <section class="learning-summary"><h3>Your big choices</h3><ol>${review||'<li>No big choices yet.</li>'}${summarizedWork}</ol><p><b>What you learned:</b> power, air, water, food and crew health are all connected. A choice today changes what you can do later.</p><p>${explanation}</p><p><b>Try again?</b> Different jobs or hiding spots would change your numbers and how the crew feels at the end.</p><p><b>Just a game:</b> the radiation points and health numbers are made up for the game. Crew members can get hurt and need rest, but nobody ever dies.</p><p><b>This is real!</b> NASA is building machines that clean and reuse air and water, so astronauts can go on long trips. <a href="https://www.nasa.gov/directorates/stmd/game-changing-development-program/next-generation-life-support-ngls/" target="_blank" rel="noopener">NASA Next Generation Life Support</a></p></section>
    <p class="lesson">This is a game. The numbers are made simple so they are fun to play with.</p>`,
    [{ label: 'Back to the map', onClick:openJourney },{ label: 'Begin a new mission', onClick: () => { hideModal(); newGame(); } }]);
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
    const lastJob = state.decisionHistory.findLast(entry => entry.type === 'work');
    const lowest = ['power', 'oxygen', 'water', 'food', 'equipment'].reduce((low, key) => state.res[key] < state.res[low] ? key : low);
    const tip = state.sol === 1
      ? 'Check the meters, then pick one job. The crew will use supplies as the sol ends.'
      : `${RES_LABEL[lowest]} is lowest. Pick one job to help the crew through this sol.`;
    $('work').innerHTML = `<h3>Pick today’s job</h3><p class="small work-tip">${tip}</p>`;
    if (lastJob?.sol === state.sol - 1) {
      const summary = document.createElement('p');
      summary.className = 'small work-tip';
      summary.textContent = `Sol ${lastJob.sol} done · ${WORK.find(w => w.id === lastJob.choice).label}`;
      $('work').appendChild(summary);
    }
    WORK.forEach((w) => {
      const b = document.createElement('button');
      b.textContent = w.id === 'farm' ? 'Tend the plants' : w.label;
      const effects = Object.entries(w.fx).map(([key, amount]) => `${amount > 0 ? '+' : '−'}${Math.abs(amount)} ${RES_LABEL[key].toLowerCase()}`);
      if (w.rest) effects.push(`−${w.rest} tiredness`);
      const detail = document.createElement('small');
      detail.textContent = effects.join(' · ');
      b.appendChild(detail);
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
  $('crew').innerHTML = state.crew.map((c) => `<div class="crew"><b>${c.name}</b><small>${c.role}</small>
    <div class="mini">Condition ${c.hp} · Tired ${c.fatigue}</div></div>`).join('');
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

let cameraView = 'third';
function toggleView() {
  if ($('hud').hidden || !$('modal').hidden || pipLessonOpen()) return;
  cameraView = cameraView === 'first' ? 'third' : 'first';
  showCameraView($('view'), cameraView);
}
$('view').onclick = toggleView;

$('start').onclick = () => {
  $('view').hidden = false;
  showCameraView($('view'), cameraView);
  $('title').style.display = 'none';
  $('hud').hidden = false;
  startAudio();
  playBeep();
  newGame();
};


// ---------- Loop ----------
mountPipLesson($('campaign-guidance'), 'campaign', () => ({
  step: state.ended || state.sol >= 30 ? 2 : state.sol > 1 ? 1 : 0,
}));
$('campaign-guidance').hidden = true;
$('start').addEventListener('click', () => { $('campaign-guidance').hidden = false; });
window.addEventListener('keydown', event => { if (event.code === 'KeyV' && !event.repeat) toggleView(); });
const timer = new THREE.Timer();
timer.connect(document);
let angle = 0.6;
renderer.setAnimationLoop((time) => {
  timer.update(time);
  if(journeyPaused)return;
  const dt = Math.min(timer.getDelta(), 0.1);
  angle += dt * 0.05;
  if (commander) commander.visible = cameraView === 'third';
  if (cameraView === 'first') {
    camera.position.set(4.4, 1.65, 3.8);
    camera.lookAt(-2, 1.5, -3.5);
  } else {
    camera.position.set(Math.cos(angle) * 22, 9, Math.sin(angle) * 22);
    camera.lookAt(0, 2, 0);
  }
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
