// Rules for "Message to Earth". Pure functions; the 3D scene only reads this state.
import {recordDecision} from '../../simulation/decisions.js';
import {serializeSnapshot, restoreSnapshot} from '../../simulation/replay.js';
import {PARTS} from './state.js';

const ok = message => ({ok: true, message}), fail = message => ({ok: false, message});
export const PLANS = {
  earth: {icon: '📡', title: 'Ask Earth first', text: 'Send a message, save water, and wait for the experts. Slow but sure.'},
  self: {icon: '🔧', title: 'Fix it yourself', text: 'Test the parts with the meter and swap what is broken. Fast if you are careful.'},
  both: {icon: '🤝', title: 'Do both', text: 'Send a message, then start testing while it travels. Earth checks your work.'},
};
export const PART_NAMES = {pump: 'pump motor', valve: 'water valve', filter: 'filter'};

/** Earth's answer arrives after: light time out + thinking + light time back. */
export function earthRoundTrip(s, withData = s.message.withData) {
  const sc = s.scenario; return sc.oneWaySeconds * 2 + sc.earthThinkSeconds * (withData ? .5 : 1);
}
export function messageProgress(s) {
  const m = s.message, sc = s.scenario; if (m.status === 'none') return null;
  const t = s.simSeconds - m.sentAt, out = sc.oneWaySeconds, think = m.arrivesAt - m.sentAt - out * 2;
  if (t < out) return {leg: 'out', fraction: t / out, secondsLeft: m.arrivesAt - s.simSeconds};
  if (t < out + think) return {leg: 'earth', fraction: (t - out) / think, secondsLeft: m.arrivesAt - s.simSeconds};
  if (t < out * 2 + think) return {leg: 'back', fraction: (t - out - think) / out, secondsLeft: m.arrivesAt - s.simSeconds};
  return {leg: 'arrived', fraction: 1, secondsLeft: 0};
}
export const earthKnows = s => s.message.status === 'arrived';
/** What the player knows is broken (from their own tests or from Earth). */
export function knownBad(s) {
  return PARTS.filter(p => s.health[p] !== 'ok' && s.health[p] !== 'clean' && (earthKnows(s) || s.findings[p] === 'bad'));
}
export const allGood = s => PARTS.every(p => s.health[p] === 'ok' || s.health[p] === 'clean');
export const waterRate = s => (s.saveMode ? s.scenario.saveUseLPerMin : s.scenario.waterUseLPerMin) / 60;

/** Mission clock: real seconds × timeScale. Water drains; the message travels. */
export function advanceMission(s, realSeconds) {
  if (s.phase !== 'active' || !s.plan || s.fixed) return;
  passTime(s, realSeconds * s.scenario.timeScale);
}
export function passTime(s, seconds) {
  s.simSeconds += seconds; s.waterL = Math.max(0, s.waterL - waterRate(s) * seconds);
  if (s.message.status !== 'none' && s.message.status !== 'arrived') {
    const p = messageProgress(s); s.message.status = p.leg === 'out' ? 'outbound' : p.leg === 'earth' ? 'earth' : p.leg === 'back' ? 'inbound' : 'arrived';
    if (s.message.status === 'arrived') s.notice = '📡 Earth answered! Read it at the console.';
  }
  if (s.waterL <= s.scenario.lowWaterL && !s.lowWater) { s.lowWater = true; s.phase = 'debrief'; s.notice = 'Water is very low. The crew opens the emergency water.'; }
}

export function applyAction(s, {id, targetId, payload} = {}) {
  if (s.phase === 'brief' && id === 'begin') { s.phase = 'active'; recordDecision(s, 'begin'); return ok('Pick a plan.'); }
  if (s.phase !== 'active') return fail('Start the mission first.');
  if (id === 'choosePlan') { if (!PLANS[payload] || s.plan) return fail('Pick one of the plans.'); s.plan = payload; recordDecision(s, id, {plan: payload}); return ok(`Plan: ${PLANS[payload].title}.`); }
  if (!s.plan) return fail('Pick a plan first.');
  if (s.fixed && !['finish', 'stopEarly', 'toggleSave', 'readAnswer'].includes(id)) return fail('The recycler is fixed! Finish at the console.');
  const sc = s.scenario;
  switch (id) {
    case 'toggleSave': s.saveMode = !s.saveMode; recordDecision(s, id, {on: s.saveMode}); return ok(s.saveMode ? 'Save-water mode on. Short showers and careful cups!' : 'Save-water mode off.');
    case 'sendMessage': {
      if (s.message.status !== 'none') return fail('Your message is already on its way.');
      const withData = PARTS.some(p => s.findings[p]);
      s.message = {status: 'outbound', sentAt: s.simSeconds, arrivesAt: s.simSeconds + earthRoundTrip(s, withData), withData};
      recordDecision(s, id, {withData}); return ok(withData ? 'Sent, with your meter readings! Earth can answer faster.' : 'Message sent to Earth!');
    }
    case 'waitForEarth': {
      if (s.message.status === 'none') return fail('Send a message first.');
      if (s.message.status === 'arrived') return fail('Earth already answered.');
      const wait = s.message.arrivesAt - s.simSeconds; passTime(s, wait); recordDecision(s, id, {minutes: +(wait / 60).toFixed(1)});
      return ok(s.phase === 'debrief' ? 'The water ran too low while you waited.' : `You waited ${Math.round(wait / 60)} minutes. Earth answered!`);
    }
    case 'togglePower': {
      if (s.power) { s.power = false; s.alarm = false; recordDecision(s, id, {on: false}); return ok('Power off. Now it is safe to open the panel.'); }
      if (s.panel === 'open') return fail('Close the panel before you turn the power on.');
      s.power = true; recordDecision(s, id, {on: true}); return ok('Power on. Do a test run!');
    }
    case 'openPanel': if (s.power) return fail('Safety first! Turn off the power lever.'); if (s.panel === 'open') return fail('The panel is already open.'); s.panel = 'open'; passTime(s, 60); recordDecision(s, id); return ok('Panel open. You can see the pump, the valve and the filter.');
    case 'closePanel': if (s.panel !== 'open') return fail('The panel is already closed.'); if (s.holding && s.holding !== 'meter') return fail('Fit the part you are holding first.'); s.panel = 'closed'; passTime(s, 45); recordDecision(s, id); return ok('Panel closed and bolted.');
    case 'takeMeter': if (s.holding === 'meter') return fail('You already have the meter.'); s.holding = 'meter'; return ok('You have the multimeter.');
    case 'test': {
      if (!['pump', 'valve'].includes(targetId)) return fail('The meter tests the pump and the valve.');
      if (s.holding !== 'meter') return fail('Get the multimeter from the shelf first.');
      if (s.panel !== 'open') return fail('Open the panel first.');
      if (s.power) return fail('Turn the power off before testing.');
      const bad = s.health[targetId] === 'bad'; s.findings[targetId] = bad ? 'bad' : 'ok'; passTime(s, 60);
      recordDecision(s, id, {part: targetId, bad}); const m = sc.meter[targetId];
      return ok(`${PART_NAMES[targetId]}: ${bad ? m.bad : m.ok}. Normal is ${m.range}. ${bad ? 'That is NOT normal!' : 'That looks normal.'}`);
    }
    case 'inspect': {
      if (targetId !== 'filter') return fail('Use the meter on that part.');
      if (s.panel !== 'open') return fail('Open the panel first.');
      const clogged = s.health.filter === 'clogged'; s.findings.filter = clogged ? 'bad' : 'ok'; passTime(s, 60); recordDecision(s, id, {part: 'filter', clogged});
      return ok(clogged ? 'Yuck! The filter is brown and clogged.' : 'The filter looks clean and white.');
    }
    case 'takeSpare': {
      if (!PARTS.includes(targetId)) return fail('Pick a spare part.');
      if (s.spares[targetId] <= 0) return fail(`No spare ${PART_NAMES[targetId]} left.`);
      if (s.holding && s.holding !== 'meter') return fail('Your hands are full.');
      s.holding = targetId; return ok(`You have a spare ${PART_NAMES[targetId]}.${s.findings[targetId] || earthKnows(s) ? '' : ' (You have not checked if the old one is broken.)'}`);
    }
    case 'putBack': { if (!s.holding) return fail('Your hands are empty.'); const was = s.holding; s.holding = null; return ok(was === 'meter' ? 'Meter back on the hook.' : `Spare ${PART_NAMES[was]} back on the shelf.`); }
    case 'swap': {
      if (s.holding !== targetId) return fail(`Bring a spare ${PART_NAMES[targetId]} from the shelf.`);
      if (s.panel !== 'open') return fail('Open the panel first.');
      if (s.power) return fail('Turn the power off first.');
      const wasBroken = s.health[targetId] !== 'ok' && s.health[targetId] !== 'clean';
      s.spares[targetId] -= 1; s.holding = null; s.health[targetId] = targetId === 'filter' ? 'clean' : 'ok';
      s.findings[targetId] = 'ok'; s.swaps.push({part: targetId, needed: wasBroken}); s.removed.push({part: targetId, broken: wasBroken}); passTime(s, 120);
      recordDecision(s, id, {part: targetId, needed: wasBroken});
      return ok(wasBroken ? `New ${PART_NAMES[targetId]} fitted!` : `New ${PART_NAMES[targetId]} fitted. The old one was fine, so that spare was not needed.`);
    }
    case 'testRun': {
      if (!s.power) return fail('Turn the power on first.');
      if (s.panel === 'open') return fail('Close the panel first.');
      const v = s.variant, brokenFixed = s.health[v.broken] === 'ok' || s.health[v.broken] === 'clean';
      const result = !brokenFixed ? 'no-start' : allGood(s) ? 'fixed' : 'low-flow'; s.testRuns.push(result); passTime(s, 60);
      recordDecision(s, id, {result});
      if (result === 'fixed') { s.fixed = true; s.alarm = false; return ok('Clean water is flowing! You fixed it!'); }
      s.alarm = true;
      return fail(result === 'no-start' ? (v.broken === 'pump' ? 'The motor will not spin. Something is still broken.' : 'The motor spins, but no water moves. Something is still stuck.') : 'Water moves, but slowly, and the motor gets hot. Something is blocking the flow.');
    }
    case 'readAnswer': if (!earthKnows(s)) return fail('Earth has not answered yet.'); s.readAnswer = true; for (const p of PARTS) if (s.health[p] !== 'ok' && s.health[p] !== 'clean') s.findings[p] = 'bad'; return ok('You read Earth’s answer.');
    case 'finish': if (!s.fixed) return fail('Fix the recycler first.'); s.phase = 'debrief'; recordDecision(s, id); return ok('Mission complete!');
    case 'stopEarly': s.phase = 'debrief'; s.stoppedEarly = true; recordDecision(s, id); return ok('You stopped the practice.');
  }
  return fail('Unknown action.');
}

/** The next helpful step, short enough to read aloud. */
export function getObjective(s) {
  if (s.phase === 'brief') return 'Meet the broken water machine';
  if (s.phase === 'debrief') return s.stoppedEarly ? 'Game stopped. Try again from a safe spot.' : 'See how your repair went';
  if (!s.plan) return 'Pick your repair plan';
  if (s.fixed) return 'It works! Finish at the console';
  if (s.plan !== 'self' && s.message.status === 'none') return 'Send a message to Earth at the console';
  if (s.message.status === 'arrived' && !s.readAnswer) return 'Earth answered! Read it at the console';
  const bad = knownBad(s), needsWork = bad.length > 0 || (s.plan !== 'earth' && PARTS.some(p => !s.findings[p]));
  if (s.plan === 'earth' && !earthKnows(s) && !bad.length) return s.saveMode ? 'Wait for Earth’s answer at the console' : 'Turn on save-water mode while you wait';
  if (s.holding && s.holding !== 'meter') return `Fit the new ${PART_NAMES[s.holding]} in the machine`;
  if (needsWork) {
    if (s.power) return 'Turn off the power lever';
    if (s.panel === 'closed') return 'Open the panel: hold E on it';
    const untested = PARTS.find(p => !s.findings[p] && !earthKnows(s));
    if (bad.length) return `Get a spare ${PART_NAMES[bad[0]]} from the shelf`;
    if (untested === 'filter') return 'Look at the filter';
    if (untested) return s.holding === 'meter' ? `Test the ${PART_NAMES[untested]} with the meter` : 'Get the multimeter from the shelf';
  }
  if (s.panel === 'open') return 'Close the panel';
  if (!s.power) return 'Turn the power lever back on';
  return 'Do a test run: press the lamp on the machine';
}
export function getSteps(s) {
  const opened = s.panel === 'open' || s.swaps.length > 0 || s.testRuns.length > 0;
  const found = knownBad(s).length > 0 || s.swaps.some(w => w.needed);
  const list = [
    {text: 'Pick a plan', done: !!s.plan},
    ...(s.plan && s.plan !== 'self' ? [{text: 'Message Earth', done: s.message.status !== 'none'}] : []),
    {text: 'Power off + open the panel', done: opened},
    {text: 'Find what is broken', done: found || allGood(s)},
    {text: 'Swap the broken parts', done: allGood(s)},
    {text: 'Test run', done: s.fixed},
  ];
  if (s.phase !== 'brief') { const now = list.find(x => !x.done); if (now) now.now = true; }
  return list;
}
export function getResult(s) {
  const completed = s.phase === 'debrief' && !s.stoppedEarly, fixed = s.fixed;
  const water = +s.waterL.toFixed(1), g = s.scenario.ratings, wasted = s.swaps.filter(w => !w.needed).length;
  const rating = !completed ? 'none' : !fixed ? 'low' : water >= g.great && wasted === 0 ? 'great' : water >= g.ok ? 'ok' : 'low';
  return {
    outcome: !completed ? 'stopped' : !fixed ? 'water-low' : rating === 'great' ? 'fixed-great' : 'fixed',
    completed, success: completed && fixed, mastered: rating === 'great',
    score: completed ? Math.round(Math.max(0, Math.min(100, (fixed ? 50 : 0) + water / s.waterStartL * 40 + (wasted ? 0 : 10)))) : null,
    plan: s.plan, rating, fixed, waterLeftL: water, minutes: Math.round(s.simSeconds / 60), sparesUsed: s.swaps.length, sparesWasted: wasted,
    askedEarth: s.message.status !== 'none', sentData: s.message.withData, testRuns: s.testRuns.length, broken: s.variant.broken, cause: s.variant.cause,
  };
}
export function earthAnswer(s) {
  const v = s.variant, broken = PART_NAMES[v.broken], cause = v.cause && PART_NAMES[v.cause];
  return {from: 'Maya, Mission Control in Houston',
    lines: [`Hi Meridian crew! We studied your recycler${s.message.withData ? ' and your meter readings — thank you, they helped a lot' : ''}.`,
      `The ${broken} is broken.${cause ? ` We think the ${cause} is clogged too. That made the ${broken} work too hard.` : ' Everything else should be fine.'}`,
      `Turn the power off, open the panel, and swap the ${broken}${cause ? ` and the ${cause}` : ''}. Then do a test run.`,
      'You’ve got this. Talk soon — well, in about 22 minutes!']};
}
export {serializeSnapshot, restoreSnapshot};
