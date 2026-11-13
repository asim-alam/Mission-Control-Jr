import {sites, quests, nearestSite, planRoute, facilities} from './region.js';
import {newExpedition, arrive, restore, save, questAction, doQuest, lightTime, pingEarth} from './progress.js';
import {driveManual, driveAssisted} from './driving.js';
import {boardRange, contactRange, rangeBetween, servicePosts, stepOut, suitRange, walk} from './eva.js';
import {regionalMap} from './map.js';
import {mountDrill} from './drill-panel.js';
import {readJourney, finishChapter, saveJourney} from '../../journey-state.js';
import modelNotes from '../../docs/BASE-BOSS-MODEL-REFERENCES.md?url';

const $ = id => document.getElementById(id);
let state;
try { state = restore(localStorage); } catch { state = newExpedition(); }
let destination = null;
let preference = 'fast';
let plan = null;
let plannedFrom = null;
let trip = null;
let world = null;
let worldLoading = true;
let eva = null;
let evaWarning = '';
let atBeacon = false;
let currentSite = null;
let toastTimer = null;
let lastFrame = performance.now();
let lastMap = 0;
let lastSave = 0;
let movedSinceSave = false;
let driveWarning = '';
let survey = null;
const motion = {speed: 0, steer: 0, metres: 0};
const held = new Set();
const touch = new Set();
const driveKeys = new Set(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space']);
const map = regionalMap($('map'), $('map-sites'), id => setDestination(id));
const station = $('station');
const references = $('references');
const logDialog = $('log-dialog');
const drill = mountDrill($('drill-dialog'), run => world?.showDrill(run, state));
const modalOpen = () => references.open || logDialog.open || drill.open;

function persist() {
  try { save(state, localStorage); } catch { /* Continue with an in-memory expedition. */ }
  movedSinceSave = false;
  lastSave = performance.now();
}

function note(text) {
  $('toast').textContent = text;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { $('toast').textContent = ''; }, 5400);
}

function atSite() {
  if (eva) {
    const id = nearestSite(eva);
    return rangeBetween(eva, servicePosts[id]) <= 15 ? id : null;
  }
  const id = nearestSite(state);
  const site = sites[id];
  return Math.abs(motion.speed) < .9 && Math.hypot(state.x - site.x, state.z - site.z) <= 8 ? id : null;
}

function canTalk(id) {
  if (worldLoading || trip || !id || atSite() !== id) return false;
  return !world?.canWalk || Boolean(eva && rangeBetween(eva, servicePosts[id]) <= contactRange);
}

const allJobsDone = () => Object.keys(quests).every(id => state.completed[id]);

function displayTime(minutes) {
  const total = Math.max(0, Math.floor(minutes + .00001));
  const hours = Math.floor(total / 60);
  return hours ? `${hours}h ${total % 60}m` : `${total}m`;
}

function refreshReadout() {
  $('mission-time').textContent = displayTime(state.minutes);
  $('rover-speed').textContent = eva ? `${Math.round(rangeBetween(eva, state))} m from rover`
    : `${Math.round(Math.abs(motion.speed) * 3.6)} km/h`;
  $('eva').disabled = !world?.canWalk || Boolean(trip) || (!eva && Math.abs(motion.speed) >= .9);
  $('eva').textContent = eva ? 'Board rover' : 'Step outside';
  $('drive-key').textContent = eva ? 'E' : 'Space';
  $('drive-key-label').textContent = eva ? 'board' : 'brake';
  $('survey').hidden = Boolean(eva);
  $('survey').disabled = !world || !currentSite || Boolean(trip) || Boolean(eva);
  $('survey').setAttribute('aria-pressed', String(Boolean(survey)));
  $('survey').textContent = survey ? 'Rover view' : 'Survey base';
  $('rover-mode').textContent = eva ? 'ON FOOT' : trip ? 'ASSISTED DRIVE'
    : motion.speed < -.35 ? 'REVERSING' : motion.speed > .35 ? 'DRIVING' : 'PARKED';
}

function updateObjective() {
  const active = state.active && quests[state.active];
  const finished = Object.keys(state.completed).length;
  $('objective-label').textContent = active ? active.title : `${finished} / ${Object.keys(quests).length} JOBS DONE`;
  const nextBase = nextJobSite();
  $('objective-title').textContent = active
    ? `${state.cargo ? 'Deliver to' : 'Collect at'} ${sites[state.cargo ? active.to : active.pickup].name}`
    : state.debriefed ? 'Network ready' : allJobsDone() ? 'Report back to Meridian'
      : finished ? `Check in at ${sites[nextBase].name}` : 'Check in with Reyes';
  let note = active ? (state.cargo ? `Cargo secured: ${active.cargo}.` : active.brief)
    : state.debriefed ? 'The crews have supplies, a working relay, and a stocked shelter. You can keep exploring.'
      : allJobsDone() ? 'Meet Reyes at the service beacon to give your final report.'
        : finished ? 'Follow the marked route or pick another base on the map.'
          : 'Parked at Meridian? Step outside and walk to the gold beacon.';
  if (state.active === 'valve' && state.cargo) {
    const remaining = Math.ceil(state.due - state.minutes);
    note = remaining > 0 ? `Lights pause in ${remaining} mission min. The service cut is faster.`
      : 'The grow lights paused. Deliver the valve to restore water and get the next harvest growing.';
  }
  $('objective-note').textContent = note;
}

function jobTarget() {
  const job = quests[state.active];
  return job ? state.cargo ? job.to : job.pickup : null;
}

function nextJobSite() {
  if (state.active || state.debriefed) return null;
  if (allJobsDone()) return 'meridian';
  // The harvest gives the crew a reason to visit Forge after repairing Verdant.
  const next = ['valve', 'food', 'relay', 'sample', 'shelter'].find(id => !state.completed[id]);
  return quests[next].from;
}

function setDestination(id) {
  if (trip) return;
  destination = id;
  map.select(id);
  recalculate(true);
}

function recalculate(refreshTrail = false) {
  plannedFrom = {x: state.x, z: state.z};
  plan = destination ? planRoute(plannedFrom, destination, preference) : null;
  const label = $('route-summary');
  const next = $('autopilot');
  $('fast-route').setAttribute('aria-pressed', String(preference === 'fast'));
  $('eco-route').setAttribute('aria-pressed', String(preference === 'eco'));
  $('fast-route').disabled = $('eco-route').disabled = Boolean(trip);
  next.textContent = trip ? 'Stop assisted drive' : 'Drive there for me';
  next.disabled = Boolean(eva) || (!trip && (!plan || plan.metres < 1));
  const title = document.createElement('strong');
  if (eva) {
    title.textContent = 'Rover parked';
    label.replaceChildren(title, 'Board the rover to use assisted drive.');
  } else if (trip) {
    title.textContent = `Driving to ${sites[trip.destination].name}`;
    label.replaceChildren(title, 'You can take over at any time.');
  } else if (plan) {
    title.textContent = plan.metres < 1 ? `At ${sites[destination].name}` :
      plan.name || `To ${sites[destination].name}`;
    label.replaceChildren(title, plan.metres < 1 ? 'Choose another base or talk to the crew.'
      : `${Math.ceil(plan.metres)} m · ${plan.minutes.toFixed(1)} min`);
  } else {
    label.textContent = 'Choose a base on the map.';
  }
  if (refreshTrail) world?.route(eva ? null : plan, eva ? null : destination);
}

function actionButton(label, callback, className = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = label;
  button.onclick = callback;
  return button;
}

function element(tag, text, className) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.textContent = text;
  return el;
}

function performJob(id, site, from) {
  if (!canTalk(site)) return;
  const action = doQuest(state, id, site);
  if (!action) return;
  note(state.log);
  updateObjective();
  setDestination(jobTarget() ?? nextJobSite());
  world?.updateProgress(state);
  renderStation();
  persist();
  if (!from?.isConnected) station.querySelector('button')?.focus({preventScroll: true});
}

function renderStation() {
  station.replaceChildren();
  if (!currentSite || trip) return;
  const id = currentSite;
  const site = sites[id];
  station.append(
    element('span', `${site.code} · ${site.contact}`, 'panel-label'),
    element('h2', site.name),
    element('p', site.role),
  );
  if (!canTalk(id)) {
    if (worldLoading) return;
    if (eva) station.append(element('p', 'Walk to the gold beacon to check in.', 'job-intro'));
    else {
      station.append(element('p', 'Step outside and follow the gold beacon to talk to the crew.', 'job-intro'));
    }
    return;
  }
  let featured = false;
  for (const [jobId, job] of Object.entries(quests)) {
    const action = questAction(state, jobId, id);
    if (!action) continue;
    const secondaryOffer = action === 'accept' && featured;
    const content = document.createElement(secondaryOffer ? 'details' : 'div');
    content.className = 'jobs';
    content.append(element(secondaryOffer ? 'summary' : 'h3', job.title));
    featured = true;
    const brief = {accept: job.brief, pickup: job.pickupBrief, deliver: job.deliveryBrief}[action];
    if (brief) content.append(element('p', brief, 'job-intro'));
    const button = actionButton(action === 'accept' ? `Accept: ${job.title}` :
      action === 'pickup' ? job.pickupAction : job.deliveryAction,
    event => performJob(jobId, id, event.currentTarget), 'primary');
    if (action === 'accept') button.setAttribute('aria-label', `Accept job: ${job.title}`);
    content.append(button);
    station.append(content);
  }
  if (id === 'meridian' && allJobsDone() && !state.debriefed) {
    station.append(
      element('p', 'Reyes: “Give me your field report. What helped us keep the bases running?”', 'job-intro'),
      actionButton('Give the final report', finishExpedition, 'primary'),
    );
  }
  if (id === 'verdant' && state.completed.valve && state.minutes < state.harvestAt) {
    station.append(actionButton('Wait for the harvest', () => {
      if (!canTalk(id)) return;
      state.minutes = state.harvestAt;
      state.log = 'Verdant’s first harvest is ready.';
      stateChanged();
    }));
  }
  if (id === 'kestrel' && state.completed.relay) {
    if (state.radioAt === null) {
      station.append(actionButton('Send test message to Earth', () => {
        if (!canTalk(id) || !pingEarth(state)) return;
        stateChanged();
      }));
    } else if (state.minutes < state.radioAt) {
      station.append(element('p', `Earth reply in ${Math.ceil(state.radioAt - state.minutes)} mission min. You can leave and keep working.`));
      station.append(actionButton('Wait for Earth reply', () => {
        if (!canTalk(id)) return;
        state.minutes = state.radioAt;
        state.log = 'Earth received the test signal and sent an acknowledgment.';
        stateChanged();
      }));
    } else {
      station.append(element('p', `Earth reply received. Light took about ${Math.round(lightTime)} minutes each way.`));
    }
  }
}

function finishExpedition() {
  if (!canTalk('meridian') || !allJobsDone() || state.debriefed) return;
  state.debriefed = true;
  state.log = 'Reyes: “Good work, Commander. The basin can count on its crews and its supply routes.”';
  try {
    const journey = readJourney(localStorage);
    finishChapter(journey, 'extended', {outcome: 'Meridian Network ready', mastered: true});
    saveJourney(journey, localStorage);
  } catch { /* The field report also works without storage. */ }
  setDestination(null);
  stateChanged();
  $('field-log').click();
}

function stateChanged() {
  note(state.log);
  updateObjective();
  recalculate(true);
  renderStation();
  world?.updateProgress(state);
  persist();
}

function endTrip(message) {
  trip = null;
  motion.speed = 0;
  motion.steer = 0;
  if (message) note(message);
  currentSite = atSite();
  if (currentSite) arrive(state, currentSite);
  recalculate(true);
  renderStation();
  persist();
}

$('autopilot').onclick = () => {
  if (eva) return;
  if (trip) {
    endTrip('Assisted drive paused.');
    return;
  }
  recalculate(true);
  if (!plan || $('autopilot').disabled) return;
  trip = {points: plan.points, index: 1, destination};
  survey = null;
  motion.steer = 0;
  currentSite = null;
  renderStation();
  recalculate();
};

function setPreference(value) {
  if (trip) return;
  preference = value;
  recalculate(true);
}
$('fast-route').onclick = () => setPreference('fast');
$('eco-route').onclick = () => setPreference('eco');

$('toggle-map').onclick = () => {
  const content = $('map-content');
  content.hidden = !content.hidden;
  $('toggle-map').setAttribute('aria-expanded', String(!content.hidden));
  $('toggle-map').textContent = content.hidden ? 'Show map' : 'Hide map';
};
function openModal(dialog) {
  held.clear();
  touch.clear();
  dialog.showModal();
}
$('sources').onclick = () => openModal(references);
$('start-drill').onclick = () => {
  held.clear();
  touch.clear();
  drill.show();
};
$('survey').onclick = () => {
  survey = survey ? null : currentSite;
  refreshReadout();
};

function toggleEva() {
  if (!world?.canWalk || trip) return;
  if (eva) {
    if (rangeBetween(eva, state) > boardRange) {
      note('Walk back to the blue ring around the rover to get in.');
      return;
    }
    eva = null;
    note('Back in the rover.');
  } else {
    if (Math.abs(motion.speed) >= .9) return;
    eva = stepOut(state, currentSite);
    if (!eva) {
      note('There is no room to get out here. Move the rover to open ground.');
      return;
    }
    motion.speed = motion.steer = 0;
    note(currentSite ? 'Follow the gold beacon. The blue ring marks your rover.'
      : `You can walk up to ${suitRange} m from the rover. Follow the blue ring to get back in.`);
  }
  held.clear();
  touch.clear();
  survey = null;
  evaWarning = '';
  currentSite = atSite();
  atBeacon = canTalk(currentSite);
  recalculate(true);
  renderStation();
  refreshReadout();
  $('world').focus({preventScroll: true});
}
$('eva').onclick = toggleEva;

$('field-log').onclick = () => {
  const entries = Object.entries(state.completed);
  const content = $('log-content');
  content.replaceChildren(element('p', `${entries.length} of ${Object.keys(quests).length} jobs completed.`));
  if (!entries.length) content.append(element('p', 'Completed jobs and their outcomes will appear here.'));
  if (state.debriefed) content.append(
    element('h3', 'Meridian Network ready'),
    element('p', 'Reyes signed your field report. A repaired water recycler helped grow food for another base. The relay brought the crews back in touch. The shelter gave the field team a safe place to wait.'),
  );
  for (const [id, outcome] of entries) {
    content.append(element('h3', quests[id].title), element('p', outcome));
  }
  if (state.active) {
    content.append(element('h3', 'Current job'), element('p', state.log));
  }
  openModal(logDialog);
};
$('model-notes').href = modelNotes;

addEventListener('keydown', event => {
  if (modalOpen() || event.altKey || event.metaKey || event.ctrlKey) return;
  if (event.code === 'KeyE' && !event.repeat) {
    toggleEva();
    return;
  }
  if (!driveKeys.has(event.code) || (event.code === 'Space' && event.target.closest?.('button, a, summary'))) return;
  event.preventDefault();
  held.add(event.code);
  survey = null;
  if (event.code !== 'Space' && world) $('world').focus({preventScroll: true});
  if (trip) endTrip('Manual control.');
});
addEventListener('keyup', event => held.delete(event.code));
addEventListener('blur', () => { held.clear(); touch.clear(); });
for (const button of document.querySelectorAll('[data-drive]')) {
  const key = button.dataset.drive;
  button.addEventListener('pointerdown', event => {
    event.preventDefault();
    button.setPointerCapture(event.pointerId);
    touch.add(key);
    survey = null;
    if (trip) endTrip('Manual control.');
  });
  for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) {
    button.addEventListener(event, () => touch.delete(key));
  }
}
addEventListener('pagehide', persist);

function input() {
  const has = (button, first, second) => touch.has(button) || held.has(first) || held.has(second);
  return {
    throttle: Number(has('forward', 'KeyW', 'ArrowUp')) - Number(has('back', 'KeyS', 'ArrowDown')),
    steer: Number(has('right', 'KeyD', 'ArrowRight')) - Number(has('left', 'KeyA', 'ArrowLeft')),
    brake: held.has('Space'),
  };
}

function frame(now) {
  const dt = Math.min(.25, (now - lastFrame) / 1000);
  lastFrame = now;
  let result = {metres: 0};
  if (eva) eva.walking = false;
  if (!modalOpen() && !document.hidden) {
    if (eva) {
      const warning = walk(eva, state, input(), dt);
      if (warning === 'range' && warning !== evaWarning) note('Suit range reached. Head back toward the rover.');
      evaWarning = warning;
    } else if (trip) {
      result = driveAssisted(state, trip, dt);
      motion.speed = result.done || result.stopped ? 0 : 18;
      if (result.done) endTrip(`Parked at ${sites[trip.destination].name}.`);
      if (result.stopped) endTrip('A structure is blocking this approach. Steer around it, then try the route again.');
    } else if (world) {
      const controls = input();
      const steps = Math.max(1, Math.ceil(dt / .05));
      for (let i = 0; i < steps; i++) {
        const step = driveManual(state, motion, controls, dt / steps);
        result.metres += step.metres;
        if (step.stopped) {
          result.stopped = step.stopped;
          break;
        }
      }
      if (result.stopped && result.stopped !== driveWarning) {
        note('Path blocked. Reverse and steer around.');
      }
      driveWarning = result.stopped || '';
    }
  }
  motion.metres = result.metres;
  movedSinceSave ||= result.metres > .001;
  const nearby = trip ? null : atSite();
  const canMeetCrew = canTalk(nearby);
  if (nearby !== currentSite || canMeetCrew !== atBeacon) {
    const arrived = nearby !== currentSite;
    currentSite = nearby;
    atBeacon = canMeetCrew;
    if (arrived && nearby && !eva) {
      arrive(state, nearby);
      recalculate(true);
      persist();
    }
    renderStation();
  }
  if (movedSinceSave && now - lastSave > 2600) persist();
  if (now - lastMap > 180) {
    if (destination && !trip && Math.hypot(state.x - plannedFrom.x, state.z - plannedFrom.z) >= 6) recalculate(true);
    const remaining = trip ? {points: [state, ...trip.points.slice(trip.index)]} : plan;
    map.draw(state, remaining, eva);
    refreshReadout();
    if (state.active === 'valve' && state.cargo) updateObjective();
    lastMap = now;
  }
  world?.render(state, motion, dt, drill.open ? 'verdant' : survey, eva, currentSite);
  requestAnimationFrame(frame);
}

currentSite = atSite();
survey = currentSite;
renderStation();
updateObjective();
setDestination(jobTarget() ?? nextJobSite());
refreshReadout();
map.draw(state, plan);
requestAnimationFrame(frame);

import('./world.js').then(({buildWorld}) => buildWorld($('world'))).then(view => {
  view.updateProgress(state);
  if (drill.state) view.showDrill(drill.state, state);
  view.route(plan, destination);
  world = view;
  $('loading').hidden = true;
}).catch(error => {
  console.warn('Mars terrain unavailable:', error);
  $('loading').textContent = '3D terrain is unavailable. You can still travel and finish jobs using the map.';
  setTimeout(() => { $('loading').hidden = true; }, 5500);
}).finally(() => {
  worldLoading = false;
  atBeacon = canTalk(currentSite);
  renderStation();
  refreshReadout();
});
