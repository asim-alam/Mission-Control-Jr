// Rules for "The Greenhouse Promise". Pure functions; the 3D scene only reads this state.
import {recordDecision} from '../../simulation/decisions.js';
import {serializeSnapshot, restoreSnapshot} from '../../simulation/replay.js';
import {BEDS} from './state.js';

export const PLANS = {
  salad: {icon: '🥗', title: 'Salad first', text: 'Full light on the lettuce and mizuna. Peppers wait.'},
  feast: {icon: '🌶️', title: 'Try for a feast', text: 'Borrow battery power so the peppers grow too.'},
  even: {icon: '⚖️', title: 'Share the light', text: 'Give every bed some light, and change it day by day.'},
};
const LIGHTING_PLANS = {
  salad: [{a: 'full', b: 'full', c: 'off'}, {a: 'full', b: 'full', c: 'off'}],
  feast: [{a: 'full', b: 'full', c: 'full'}, {a: 'full', b: 'full', c: 'half'}],
  even: [{a: 'full', b: 'half', c: 'off'}, {a: 'half', b: 'full', c: 'half'}],
};
export const targetLight = (s, id) => LIGHTING_PLANS[s.plan]?.[Math.min(s.day - 1, 1)]?.[id] ?? 'off';
export const bedToSetLight = s => BEDS.find(id => !s.beds[id].harvested && s.beds[id].light !== targetLight(s, id));
const ok = message => ({ok: true, message});
const fail = message => ({ok: false, message});
const crop = (s, id) => s.scenario.crops[id];
export const lightPower = s => BEDS.reduce((sum, id) => sum + s.scenario.lightKWh[s.beds[id].harvested ? 'off' : s.beds[id].light], 0);
export const batteryNeeded = s => Math.max(0, lightPower(s) - s.scenario.powerBudgetKWh);
/** Greens can be picked early as baby leaves. Peppers need mature fruit. */
export const isReady = (s, id) => !s.beds[id].harvested && s.beds[id].progress >= crop(s, id).ready * (crop(s, id).babyHarvest ?? s.scenario.babyHarvest) - 1e-9;
export const isFull = (s, id) => s.beds[id].progress >= crop(s, id).ready - 1e-9;
export const flowFactor = s => !s.isolationOpen ? 0 : s.leak === 'leaking' ? s.scenario.leakFlowFactor : 1;
export function moistureState(s, id) { const m = s.beds[id].moisture, [lo, hi] = s.scenario.moistureBand; return m < lo ? 'dry' : m > hi ? 'soggy' : 'good'; }
/** Leaf-surface dampness is a different observation from water stored in the root zone. */
export function leafSurfaceState(s) { return s.leafWetness >= s.scenario.leafWetnessCaution ? 'damp' : 'dry'; }
export function saladPortions(s) { return s.basketContents.filter(c => c.crop !== 'pepper').reduce((n, c) => n + c.portions, 0); }
export const needsFreeHandsForHose = s => s.leak === 'hose-off' && s.holding === 'basket';

export function applyAction(s, {id, targetId, payload} = {}) {
  if (s.phase === 'brief' && id === 'begin') { s.phase = 'active'; recordDecision(s, 'begin'); return ok('Pick a plan.'); }
  if (s.phase !== 'active') return fail('Start the mission first.');
  if (id === 'choosePlan') { if (!PLANS[payload] || s.plan) return fail('Pick one of the plans.'); s.plan = payload; recordDecision(s, id, {plan: payload}); return ok(`Plan: ${PLANS[payload].title}.`); }
  if (!s.plan) return fail('Pick a plan first.');
  if (id === 'checkAirflow') {
    if (s.airflowChecked) return fail('You already checked the fan.');
    s.airflowChecked = true;
    recordDecision(s, id, {readout: s.fanStatusReported, actual: s.fanRunning ? 'running' : 'off'});
    return ok(s.fanRunning ? 'Air is moving through the greenhouse.' : 'The panel says LOW, but the airflow marker does not move. The fan is actually OFF.');
  }
  if (id === 'resetFan') {
    if (!s.airflowChecked) return fail('Check the air at the vent first.');
    if (s.fanRunning) return fail('The fan is already running.');
    s.fanRunning = true; s.fanStatusReported = 'RUNNING';
    recordDecision(s, id, {restored: true});
    return ok('Airflow restored. Check the leaf surfaces again after the next night.');
  }
  const bed = s.beds[targetId];
  if (id === 'setLight') {
    if (!bed || !['off', 'half', 'full'].includes(payload)) return fail('Pick a light setting.');
    if (bed.harvested) return fail('That bed is already picked.');
    bed.light = payload; recordDecision(s, id, {bed: targetId, light: payload});
    return ok(`${crop(s, targetId).name}: light ${payload === 'off' ? 'off' : payload === 'half' ? 'half' : 'full'}.`);
  }
  if (id === 'water') {
    if (!bed || bed.harvested) return fail('Nothing to water there.');
    const flow = flowFactor(s);
    if (flow === 0) return fail('No water is coming out! Is a valve closed?');
    const amount = Math.min(s.tankL, s.scenario.waterPerTurnL * flow);
    if (amount <= 0) return fail('The water tank is empty.');
    s.tankL -= amount; bed.moisture += amount; bed.wateredToday += amount; s.waterUsedL += amount; recordDecision(s, id, {bed: targetId, litres: +amount.toFixed(2)});
    return ok(flow < 1 ? `Only a trickle came out (${amount.toFixed(1)} L). Something is leaking!` : `${crop(s, targetId).name} got ${amount} L of water.`);
  }
  if (id === 'toggleIsolation') {
    s.isolationOpen = !s.isolationOpen;
    if (!s.isolationOpen && s.leak === 'leaking') s.leak = 'isolated';
    if (s.isolationOpen && s.leak === 'hose-fitted') s.leak = 'fixed';
    if (s.isolationOpen && s.leak === 'hose-off') { s.isolationOpen = false; return fail('Wait! Fit the new hose before you open the valve.'); }
    recordDecision(s, id, {open: s.isolationOpen});
    return ok(s.isolationOpen ? (s.leak === 'fixed' ? 'Water is flowing again. Leak fixed!' : 'Valve open.') : 'Valve closed. The water stopped.');
  }
  if (id === 'removeHose') {
    if (s.leak !== 'isolated' && s.leak !== 'leaking') return fail('The hose is fine.');
    if (s.isolationOpen) return fail('Close the red valve first, or water will spray everywhere!');
    s.leak = 'hose-off'; recordDecision(s, id); return ok('Old hose off. Now get the spare hose from the tool shelf.');
  }
  if (id === 'takeSpare') {
    if (s.leak !== 'hose-off') return fail('Take the old hose off first.');
    if (s.holding) return fail('Your hands are full.');
    s.holding = 'hose'; recordDecision(s, id); return ok('You have the spare hose.');
  }
  if (id === 'fitHose') {
    if (s.holding !== 'hose') return fail('Get the spare hose first.');
    if (s.leak !== 'hose-off') return fail('Take the old hose off first.');
    s.holding = null; s.leak = 'hose-fitted'; recordDecision(s, id); return ok('New hose fitted. Open the red valve again.');
  }
  if (id === 'takeBasket') { if (s.holding) return fail('Your hands are full.'); if (s.basket !== 'table') return fail('No basket there.'); s.holding = 'basket'; s.basket = 'hand'; return ok('You have the basket.'); }
  if (id === 'returnBasket') {
    if (s.holding !== 'basket') return fail('You aren’t holding the basket.');
    s.holding = null;
    s.basket = 'table';
    return ok('Basket back on the table.');
  }
  if (id === 'harvest') {
    if (!bed) return fail('Nothing to pick.');
    if (!isReady(s, targetId)) return fail(`${crop(s, targetId).name} is not ready yet.`);
    if (s.holding !== 'basket') return fail('Get the basket from the table first.');
    const size = Math.min(1, bed.progress / crop(s, targetId).ready), portions = Math.max(1, Math.round(crop(s, targetId).portions * size * (1 - bed.stress * .5)));
    bed.harvested = true; bed.light = 'off'; s.basketContents.push({bed: targetId, crop: crop(s, targetId).crop, portions});
    recordDecision(s, id, {bed: targetId, portions}); return ok(`Picked ${size < 1 ? 'baby ' : ''}${crop(s, targetId).name}! ${portions} portions.`);
  }
  if (id === 'inspectHarvest') {
    if (s.day <= s.scenario.growDays) return fail('Wait until harvest day.');
    if (s.holding !== 'basket' || !s.basketContents.length) return fail('Pick the ready plants into the clean basket first.');
    if (s.harvestChecked) return fail('You already completed the harvest check.');
    s.harvestChecked = true;
    const surface = leafSurfaceState(s);
    recordDecision(s, id, {leafSurface: surface, portions: s.basketContents.reduce((n, c) => n + c.portions, 0)});
    return ok(surface === 'damp'
      ? 'Some leaves still look damp. Keep the harvest separate and record that clue. A visual check cannot test for tiny germs.'
      : 'The leaf surfaces look dry. Keep the harvest in the clean basket. A visual check is not a laboratory test.');
  }
  if (id === 'serve') {
    if (s.holding !== 'basket') return fail('Bring the basket to the table.');
    if (s.day <= s.scenario.growDays) return fail('Let the plants grow first. Dinner is on harvest day.');
    if (!s.harvestChecked) return fail('Check the leaves and clean basket before serving.');
    s.holding = null; s.basket = 'table'; s.served = true; s.phase = 'debrief'; recordDecision(s, id); return ok('Dinner is served!');
  }
  if (id === 'endDay') {
    if (s.day > s.scenario.growDays) return fail('Today is harvest day. Pick the ready plants and serve dinner.');
    const need = batteryNeeded(s);
    if (need > s.batteryKWh + 1e-9) return fail('Too much light! There is not enough power. Turn a light down.');
    if (!s.isolationOpen) return fail('The water valve is still closed. Open it before night, or the plants get no water.');
    endDay(s, need); return ok(`Good morning! Mars day ${s.scenario.startSol + s.day - 1}.`);
  }
  if (id === 'stopEarly') { s.phase = 'debrief'; s.stoppedEarly = true; recordDecision(s, id); return ok('You stopped the practice.'); }
  return fail('Unknown action.');
}

/** Run one night: lights, growth, plant drinking, the leak. */
export function endDay(s, battery = batteryNeeded(s)) {
  const sc = s.scenario, [lo, hi] = sc.moistureBand, report = {day: s.day, beds: {}};
  s.batteryKWh -= battery; s.powerUsedKWh += lightPower(s);
  for (const id of BEDS) {
    const b = s.beds[id]; if (b.harvested) continue;
    const use = sc.plantUseL[b.light], mid = b.moisture - use / 2;
    const condition = mid < lo ? 'dry' : mid > hi ? 'soggy' : 'good';
    const factor = condition === 'good' ? 1 : condition === 'dry' ? .4 : .6;
    const grow = sc.growth[b.light] * factor * (1 - b.stress * .5);
    b.progress += grow; b.moisture = Math.max(0, b.moisture - use);
    b.stress = condition === 'good' ? Math.max(0, b.stress - .15) : Math.min(.9, b.stress + (condition === 'dry' ? .3 : .2));
    report.beds[id] = {light: b.light, condition, grow: +grow.toFixed(2)}; b.wateredToday = 0;
  }
  if (s.leak === 'leaking') { const lost = Math.min(s.tankL, sc.leakLPerDay); s.tankL -= lost; s.leakedL += lost; report.leakedL = lost; }
  // Authored teaching indicator: a stopped fan lets leaf-surface moisture build; it is not soil moisture or RH.
  const leafChange = s.fanRunning ? -sc.leafWetnessDryingPerNight : sc.leafWetnessGainPerNight;
  s.leafWetness = Math.max(0, Math.min(1, s.leafWetness + leafChange));
  const leafSurface = leafSurfaceState(s);
  if (!s.fanRunning && leafSurface === 'damp') {
    for (const id of BEDS) if (!s.beds[id].harvested) s.beds[id].stress = Math.min(.9, s.beds[id].stress + sc.leafWetnessStressPerNight);
  }
  report.airflow = s.fanRunning ? 'restored' : 'no airflow'; report.leafSurface = leafSurface;
  s.history.push(report); s.day += 1; s.simSeconds += 86400;
  if (s.day === sc.leakDay && s.leak === 'none') { s.leak = 'leaking'; s.notice = 'Drip, drip… A water hose is leaking!'; }
  if (s.day > sc.growDays) s.notice = noHarvest(s)
    ? 'No plants reached picking size. Check the greenhouse screen to review the results.'
    : 'Harvest day! Pick the plants that are ready.';
  return report;
}

export function getObjective(s) {
  if (s.phase === 'brief') return 'Meet the plants';
  if (s.phase === 'debrief') return s.stoppedEarly ? 'Game stopped. Try again from a safe spot.' : 'See how your plants did';
  if (!s.plan) return 'Pick your farming plan';
  if (s.holding === 'hose') return 'Fit the new hose where the old one was';
  if (s.leak === 'leaking') return 'Fix the leak: close the red valve';
  if (s.leak === 'isolated') return 'Fix the leak: take off the old hose';
  if (needsFreeHandsForHose(s)) return 'Put the basket back to free your hands';
  if (s.leak === 'hose-off') return 'Fix the leak: get the spare hose';
  if (s.leak === 'hose-fitted') return 'Fix the leak: open the red valve';
  if (!s.airflowChecked) return 'Check the fan: does air move when the panel says LOW?';
  if (!s.fanRunning) return 'Reset the fan controller to restore airflow';
  if (s.day > s.scenario.growDays) {
    if (noHarvest(s)) return 'Review the crop results';
    if (BEDS.some(id => isReady(s, id))) return s.holding === 'basket' ? 'Pick the ready plants' : 'Harvest day! Get the basket';
    if (s.holding === 'basket' && !s.harvestChecked) return 'Check the leaves and clean basket at the table';
    return s.holding === 'basket' ? 'Serve dinner: put the basket on the table' : 'Harvest day! Get the basket';
  }
  if (batteryNeeded(s) > s.batteryKWh + 1e-9) return 'Too much light! Turn a light down';
  if (dryLitBed(s)) return `Day ${s.day}: water the dry beds`;
  return `Day ${s.day}: set the lights, water, then end the day`;
}
export const noHarvest = s => s.day > s.scenario.growDays && !s.basketContents.length && !BEDS.some(id => isReady(s, id));
export const dryLitBed = s => BEDS.find(id => !s.beds[id].harvested && s.beds[id].light !== 'off' && moistureState(s, id) === 'dry');
export function bedToDim(s) {
  if (batteryNeeded(s) <= s.batteryKWh + 1e-9) return null;
  return BEDS.find(id => !s.beds[id].harvested && s.beds[id].light === 'full')
    ?? BEDS.find(id => !s.beds[id].harvested && s.beds[id].light === 'half');
}

function bedToLight(s) {
  return BEDS.find(id => !s.beds[id].harvested && s.beds[id].light === 'off');
}

export function getInstruction(s) {
  if (s.phase !== 'active') return null;
  if (!s.plan) return {text: 'Choose which crops get the most light.'};
  if (s.holding === 'hose') return {place: 'line', text: 'Walk to the pipe. Aim at the highlighted empty fitting, then hold E to attach the spare hose.'};
  if (s.leak === 'leaking' || s.leak === 'hose-fitted') return {place: 'line', text: 'Aim at the red valve. Hold E or hold the prompt until it turns.'};
  if (s.leak === 'isolated') return {place: 'line', text: 'Aim at the old hose and press E or tap to unclip it.'};
  if (needsFreeHandsForHose(s)) return {place: 'table', text: 'Walk to the table and press E or tap Put the basket back. Then return to the tool shelf.'};
  if (s.leak === 'hose-off') return {place: 'shelf', text: 'Walk to the tool shelf. When you’re close, press E or tap Take the spare hose.'};
  if (!s.airflowChecked) return {place: 'fan', text: 'Aim at the vent and press E or tap to check whether it is blowing.'};
  if (!s.fanRunning) return {place: 'fan', text: 'Use the same vent again to reset the fan. Watch the blades spin.'};
  if (s.day > s.scenario.growDays) {
    if (noHarvest(s)) return {place: 'console', text: 'No plants reached picking size. Check the greenhouse screen, then choose Stop practice to finish and try again.'};
    const ready = BEDS.find(id => isReady(s, id));
    if (s.holding !== 'basket') return {place: 'table', text: 'Step 1 of 3: pick up the clean basket from the table. Then pick every plant marked ready.'};
    if (ready) return {place: ready, text: 'Step 2 of 3: pick each sparkling plant with E. Lettuce and mizuna can be picked young at 40% grown for fewer portions. Peppers need 80% grown.'};
    return {place: 'table', text: s.harvestChecked ? 'Step 3 of 3: return to the table and press E to serve dinner and finish the mission.' : 'Step 3 of 3: return to the table and press E to check the leaves and basket. Then serve dinner.'};
  }
  const dim = bedToDim(s);
  if (dim) return {place: dim, text: 'Light power is over budget. Use this bed’s lever to turn its lamp down.'};
  const nextLight = bedToSetLight(s);
  if (nextLight) return {place: nextLight, marker: `${crop(s, nextLight).name} light`, text: `Set the ${crop(s, nextLight).name.toLowerCase()} lamp to ${targetLight(s, nextLight)}. Press E at its light lever until it shows ${targetLight(s, nextLight)}.`};
  if (s.tankL > 0) {
    const dry = dryLitBed(s);
    if (dry) return {place: dry, text: 'Use the water valve at the marked bed. Stop when its soil reads Good.'};
  }
  return {place: 'console', text: `Day ${s.day}: the lights match your plan and the lit beds have good soil. Open the console and choose End the day. Harvest after Day ${s.scenario.growDays}.`};
}

export function getSteps(s) {
  const grow = s.day > s.scenario.growDays, fixed = s.leak === 'fixed' || s.leak === 'none';
  const list = [
    {text: 'Pick a plan', done: !!s.plan},
    {text: 'Check and restore airflow', done: s.fanRunning},
    {text: 'Day 1: set lights, water soil to Good, end day', done: s.day > 1},
    {text: 'Day 2: set lights, water soil to Good, end day', done: s.day > 2},
    {text: 'Fix the leak', done: s.day >= s.scenario.leakDay && fixed},
    {text: 'Pick up basket and harvest all ready plants', done: grow && !BEDS.some(id => isReady(s, id)) && s.basketContents.length > 0},
    {text: 'At the table: check leaves and clean basket', done: s.harvestChecked},
    {text: 'At the table: serve dinner to finish', done: s.served},
  ];
  if (s.phase === 'active') {
    const fixingLeak = !fixed;
    const current = !s.plan ? 0 : fixingLeak ? 4 : !s.fanRunning ? 1 : !grow ? (s.day === 1 ? 2 : 3)
      : noHarvest(s) || BEDS.some(id => isReady(s, id)) ? 5 : !s.harvestChecked ? 6 : 7;
    list[current].now = true;
  }
  return list;
}
export function getResult(s) {
  const completed = s.phase === 'debrief' && !s.stoppedEarly, salad = saladPortions(s), peppers = s.basketContents.some(c => c.crop === 'pepper');
  const avgHealth = BEDS.reduce((n, id) => n + (1 - s.beds[id].stress), 0) / BEDS.length;
  const rating = !completed ? 'none' : salad >= s.scenario.saladGoal && peppers ? 'feast' : salad >= s.scenario.saladGoal ? 'salad' : salad + (peppers ? 2 : 0) > 0 ? 'small' : 'none';
  return {
    outcome: !completed ? 'stopped' : rating === 'feast' ? 'birthday-feast' : rating === 'salad' ? 'salad-served' : rating === 'small' ? 'small-harvest' : 'no-harvest',
    completed, success: completed && (rating === 'feast' || rating === 'salad'), mastered: completed && rating === 'feast',
    score: completed ? Math.round(Math.min(100, Math.min(1, salad / s.scenario.saladGoal) * 70 + (peppers ? 10 : 0) + avgHealth * 10 + (s.batteryKWh / s.scenario.batteryKWh) * 10)) : null,
    plan: s.plan, rating, saladPortions: salad, peppers, portions: s.basketContents.reduce((n, c) => n + c.portions, 0),
    tankL: +s.tankL.toFixed(1), waterUsedL: +s.waterUsedL.toFixed(1), leakedL: +s.leakedL.toFixed(1), leakFixed: s.leak === 'fixed',
    batteryLeftKWh: +s.batteryKWh.toFixed(2), powerUsedKWh: +s.powerUsedKWh.toFixed(2), health: Math.round(avgHealth * 100),
    airflowRestored: s.fanRunning, leafSurface: leafSurfaceState(s), harvestChecked: s.harvestChecked,
    trays: BEDS.map(id => ({id, harvested: s.beds[id].harvested, stress: +s.beds[id].stress.toFixed(2)})),
  };
}
export {serializeSnapshot, restoreSnapshot};
