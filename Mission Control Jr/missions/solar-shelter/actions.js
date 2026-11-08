// Rules for "A Place to Hide". Pure functions: the 3D scene and HUD only read this state.
import {recordDecision} from '../../simulation/decisions.js';
import {serializeSnapshot, restoreSnapshot} from '../../simulation/replay.js';
import {CREW, SLOT_IDS} from './state.js';

export const PLANS = {
  water: {icon: '💧', title: 'Water fortress', text: 'Carry the heavy water walls. Best shield, but slow to move.'},
  fast: {icon: '⚡', title: 'Fast fill', text: 'Use the light supply bags and plastic first. Fill every spot quickly.'},
  roof: {icon: '🏠', title: 'Roof first', text: 'Put your best shields on the roof, where most particles come from.'},
};

const ok = message => ({ok: true, message});
const fail = message => ({ok: false, message});
export const stormStart = s => s.scenario.warningSeconds;
export const stormEnd = s => s.scenario.warningSeconds + s.scenario.stormSeconds;
export const item = (s, id) => s.items.find(i => i.id === id);
export const filledSlots = s => SLOT_IDS.filter(id => s.slots[id]);
export const crewSafe = s => CREW.filter(id => s.crew[id].at === 'shelter').length;

/** Storm strength 0..1 over time: quick rise, long high part, slow fade (shape inspired by the GOES record). */
export function stormStrength(s, t = s.simSeconds) {
  const x = (t - stormStart(s)) / s.scenario.stormSeconds;
  if (x < 0 || x > 1) return 0;
  if (x < .08) return x / .08;
  if (x < .55) return 1;
  return 1 - (x - .55) / .45 * .9;
}
/** Fraction of particles that get through to people inside the shelter. */
export function shelterTransmission(s) {
  const sc = s.scenario; let sum = 0, weight = 0;
  for (const [id, w] of Object.entries(sc.slots)) {
    const placed = s.slots[id] && item(s, s.slots[id]);
    sum += w * (placed ? sc.materials[placed.kind].transmission : sc.habTransmission); weight += w;
  }
  return sum / weight;
}
export function doseRate(s, inShelter) {
  const sc = s.scenario, strength = stormStrength(s);
  return sc.backgroundDoseRate + sc.peakDoseRate * strength * (inShelter ? shelterTransmission(s) : sc.habTransmission);
}

/** Advance by real seconds; the stage decides how fast simulated time runs. */
export function advanceMission(s, realSeconds, {playerInShelter = s.playerInShelter} = {}) {
  if (s.phase !== 'active' || s.paused || !Number.isFinite(realSeconds) || realSeconds <= 0) return false;
  if (s.stage === 'plan' || s.stage === 'after') return false;
  s.playerInShelter = !!playerInShelter;
  const scale = s.stage === 'storm' ? s.scenario.stormTimeScale : s.scenario.prepTimeScale;
  let remaining = realSeconds * scale;
  while (remaining > 0 && s.phase === 'active' && s.stage !== 'after') {
    const step = Math.min(remaining, 5);
    integrate(s, step); remaining -= step;
  }
  return true;
}
/** Jump forward in simulated seconds (used by skip-ahead and tests). */
export function advanceSim(s, simSeconds, opts = {}) {
  const scale = s.stage === 'storm' ? s.scenario.stormTimeScale : s.scenario.prepTimeScale;
  return advanceMission(s, simSeconds / scale, opts);
}
function integrate(s, dt) {
  const before = s.simSeconds; s.simSeconds += dt;
  for (const id of CREW) {
    const c = s.crew[id];
    if (c.at === 'walking' && s.simSeconds >= c.arriveAt) { c.at = 'shelter'; c.arriveAt = null; }
    c.dose += doseRate(s, c.at === 'shelter') * dt;
  }
  s.playerDose += doseRate(s, s.playerInShelter) * dt;
  const sc = s.scenario;
  if (before < sc.warningSeconds * .5 && s.simSeconds >= sc.warningSeconds * .5) s.notice = 'Half of the warning time is gone.';
  if (before < sc.warningSeconds - 240 && s.simSeconds >= sc.warningSeconds - 240) s.notice = 'Four minutes left! Get everyone inside soon.';
  if (s.stage === 'prep' && s.simSeconds >= stormStart(s)) {
    s.stage = 'storm';
    s.atArrival = {filled: filledSlots(s).length, crewSafe: crewSafe(s), youInside: s.playerInShelter, transmission: +shelterTransmission(s).toFixed(3)};
    s.notice = 'The particle storm is here! Stay inside the shelter.';
  }
  if (s.stage === 'storm' && s.simSeconds >= stormEnd(s)) { s.stage = 'after'; s.notice = 'All clear! The storm has faded.'; }
}

export function applyAction(s, {id, targetId, payload} = {}) {
  if (s.phase === 'brief' && id === 'begin') { s.phase = 'active'; s.stage = 'plan'; recordDecision(s, 'begin'); return ok('Pick a plan.'); }
  if (s.phase !== 'active') return fail('Start the mission first.');
  if (s.paused) return fail('Unpause the game first.');
  if (id === 'choosePlan') {
    if (s.stage !== 'plan' || !PLANS[payload]) return fail('Pick one of the plans.');
    s.plan = payload; s.stage = 'prep'; recordDecision(s, id, {plan: payload});
    return ok(`Plan: ${PLANS[payload].title}. Go!`);
  }
  if (id === 'pickUp') {
    const it = item(s, targetId);
    if (!it) return fail('There is nothing there.');
    if (s.held) return fail('Your hands are full. Put that down first.');
    if (it.at === 'hand') return fail('You are already holding it.');
    if (it.at !== 'store') { s.slots[it.at] = null; s.removals++; }
    it.at = 'hand'; s.held = it.id; recordDecision(s, id, {item: it.id});
    return ok(`You picked up the ${s.scenario.materials[it.kind].label}.`);
  }
  if (id === 'place') {
    if (!s.held) return fail('Pick up a shield first.');
    if (!(targetId in s.slots)) return fail('That is not a shelter spot.');
    if (s.slots[targetId]) return fail('That spot is already full.');
    const it = item(s, s.held); it.at = targetId; s.slots[targetId] = it.id; s.held = null; s.trips++;
    recordDecision(s, id, {item: it.id, slot: targetId});
    const n = filledSlots(s).length;
    return ok(targetId.startsWith('roof') ? `Roof spot filled! The roof blocks the most. (${n} of 8)` : `Wall spot filled. (${n} of 8)`);
  }
  if (id === 'putBack') {
    if (!s.held) return fail('Your hands are empty.');
    item(s, s.held).at = 'store'; s.held = null; recordDecision(s, id); return ok('Put back.');
  }
  if (id === 'callCrew') {
    const c = s.crew[targetId]; if (!c) return fail('Nobody is there.');
    if (c.at !== 'work') return fail('They are already on the way.');
    c.at = 'walking'; c.arriveAt = s.simSeconds + s.scenario.crewWalkSeconds; recordDecision(s, id, {crew: targetId});
    return ok(`${targetId[0].toUpperCase() + targetId.slice(1)} is going to the shelter.`);
  }
  if (id === 'skipAhead') {
    if (s.stage !== 'prep' && s.stage !== 'storm') return fail('Nothing to skip.');
    if (!s.playerInShelter || crewSafe(s) + CREW.filter(c => s.crew[c].at === 'walking').length < CREW.length) return fail('Get everyone into the shelter first.');
    recordDecision(s, id, {at: Math.round(s.simSeconds)});
    while (s.stage !== 'after' && s.phase === 'active') integrate(s, 5);
    return ok('Time flew by inside the shelter.');
  }
  if (id === 'finish') {
    if (s.stage !== 'after') return fail('Wait until the storm is over.');
    s.phase = 'debrief'; recordDecision(s, id); return ok('Mission finished.');
  }
  if (id === 'stopEarly') { s.phase = 'debrief'; s.stoppedEarly = true; recordDecision(s, id); return ok('You stopped the practice.'); }
  return fail('Unknown action.');
}

export function teamDose(s) { const all = [...CREW.map(id => s.crew[id].dose), s.playerDose]; return all.reduce((a, b) => a + b, 0) / all.length; }
export function rating(s, dose = teamDose(s)) { return dose <= s.scenario.ratings.great ? 'great' : dose <= s.scenario.ratings.ok ? 'ok' : 'high'; }

export function getObjective(s) {
  if (s.phase === 'brief') return 'Read the Sun storm warning';
  if (s.phase === 'debrief') return s.stoppedEarly ? 'Game stopped. Try again from a safe spot.' : 'See how your shelter worked';
  if (s.phase === 'suspended') return 'Game stopped. Try again from a safe spot.';
  if (s.stage === 'plan') return 'Pick your shelter plan';
  if (s.stage === 'after') return 'All clear! Check the storm screen';
  if (s.held) return `Put the ${s.scenario.materials[item(s, s.held).kind].label} in a glowing shelter spot`;
  const filled = filledSlots(s).length, safe = crewSafe(s) + CREW.filter(c => s.crew[c].at === 'walking').length;
  if (s.stage === 'storm') return s.playerInShelter ? 'Stay inside until the storm passes' : 'Get inside the shelter yourself';
  const leftover = s.items.some(i => i.at === 'store');
  if (filled < 8 && leftover && !(s.simSeconds > s.scenario.warningSeconds * .7 && safe < CREW.length)) return `Build the shelter · ${filled} of 8 spots filled`;
  if (safe < CREW.length) return `Call the crew into the shelter · ${safe} of 4`;
  if (!s.playerInShelter) return 'Get inside the shelter yourself';
  return 'Stay inside until the storm passes';
}

export function getSteps(s) {
  const filled = filledSlots(s).length, roof = ['roof_1', 'roof_2'].filter(id => s.slots[id]).length;
  const called = CREW.filter(c => s.crew[c].at !== 'work').length, started = s.phase !== 'brief';
  const list = [
    {text: 'Pick a plan', done: !!s.plan},
    {text: `Cover the roof · ${roof}/2`, done: roof === 2},
    {text: `Fill the walls · ${filled - roof}/6`, done: filled - roof === 6},
    {text: `Call the crew · ${called}/4`, done: called === 4},
    {text: 'Get inside yourself', done: s.playerInShelter || s.stage === 'after'},
    {text: 'Wait out the storm', done: s.stage === 'after' || s.phase === 'debrief'},
  ];
  if (started) { const now = list.find(x => !x.done); if (now) now.now = true; }
  return list;
}

export function getResult(s) {
  const dose = teamDose(s), r = rating(s, dose), filled = filledSlots(s).length;
  const completed = s.phase === 'debrief' && !s.stoppedEarly;
  const used = kind => s.items.filter(i => i.kind === kind && i.at !== 'store' && i.at !== 'hand').length;
  return {
    outcome: !completed ? 'stopped' : r === 'great' ? 'great-shield' : r === 'ok' ? 'safe' : 'high-dose',
    completed, success: completed && r !== 'high', mastered: completed && r === 'great', score: completed ? Math.max(0, Math.min(100, Math.round(100 - dose))) : null,
    plan: s.plan, rating: r, teamDose: +dose.toFixed(1), maxDose: +Math.max(s.playerDose, ...CREW.map(c => s.crew[c].dose)).toFixed(1),
    filled, roofCovered: ['roof_1', 'roof_2'].filter(id => s.slots[id]).length, water: used('water'), poly: used('poly'), cargo: used('cargo'),
    crewSafeAtArrival: s.atArrival?.crewSafe ?? crewSafe(s), filledAtArrival: s.atArrival?.filled ?? filled, trips: s.trips, removals: s.removals,
    transmission: +shelterTransmission(s).toFixed(2), sourceId: s.scenario.sourceId,
  };
}
export {serializeSnapshot, restoreSnapshot};
