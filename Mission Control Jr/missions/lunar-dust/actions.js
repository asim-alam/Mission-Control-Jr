// Rules for "Dust Busters". Pure functions; the 3D airlock reads this state and sends actions.
import {recordDecision} from '../../simulation/decisions.js';
import {serializeSnapshot, restoreSnapshot} from '../../simulation/replay.js';
import {ITEMS} from './state.js';

const ok = message => ({ok: true, message}), fail = message => ({ok: false, message});
export const PLANS = {
  brush: {icon: '🧹', title: 'Brush it off', text: 'Fast and needs no power. But brushing throws dust into the air.'},
  vacuum: {icon: '🌀', title: 'Vacuum it up', text: 'Slower and uses power. Very little dust gets into the air.'},
  mix: {icon: '⚡', title: 'Mix with the EDS', text: 'Use the electric dust plate for hard, smooth things. Clean the rest your way.'},
};
export const TOOL_OF_HAND = {brush: 'brush', nozzle: 'vacuum'};
export const itemName = (s, id) => s.scenario.items[id].name;
export const dirtyItems = s => ITEMS.filter(id => s.items[id].dust > s.scenario.cleanEnough);
export const safeToEnter = s => s.pressurized && !dirtyItems(s).length && s.airDust <= s.scenario.airSafe;
const spend = (s, minutes, power = 0) => { s.minutes += minutes; s.simSeconds = s.minutes * 60; s.power = Math.max(0, s.power - power); };

function clean(s, id, tool) {
  const sc = s.scenario, t = sc.tools[tool], item = s.items[id];
  const rate = tool === 'eds' ? sc.items[id].eds : t.remove;
  const removed = item.dust * rate; item.dust = +(item.dust - removed).toFixed(2); item.cleanedBy.push(tool);
  s.airDust = +(s.airDust + removed * t.airborne).toFixed(2);
  if (t.toFilter) s.filterLoad = +Math.min(sc.filterCap, s.filterLoad + removed * t.toFilter).toFixed(2);
  spend(s, t.minutes, t.power); s.uses[tool]++;
  return removed;
}

export function applyAction(s, {id, payload, targetId} = {}) {
  if (s.phase === 'brief' && id === 'begin') { s.phase = 'active'; recordDecision(s, 'begin'); return ok('Pick a cleaning plan.'); }
  if (s.phase !== 'active') return fail('Start the mission first.');
  const sc = s.scenario, arg = payload ?? targetId;
  if (id === 'choosePlan') { if (!PLANS[arg] || s.plan) return fail('Pick one of the plans.'); s.plan = arg; recordDecision(s, id, {plan: arg}); return ok(`Plan: ${PLANS[arg].title}. First, close the outside hatch!`); }
  if (!s.plan) return fail('Pick a plan first.');
  if (id === 'stopEarly') { s.stoppedEarly = true; s.phase = 'debrief'; return ok('Practice stopped.'); }
  switch (id) {
    case 'closeOuter':
      if (s.outer === 'closed') return fail('The outside hatch is already shut.');
      s.outer = 'closed'; spend(s, sc.hatchMinutes); recordDecision(s, id); return ok('Hatch shut tight. Now fill the airlock with air.');
    case 'pressurize':
      if (s.outer !== 'closed') return fail('Shut the outside hatch first, or the air will rush out!');
      if (s.pressurized) return fail('The airlock already has air.');
      if (s.power < sc.pressurize.power) return fail('Not enough power to pump in air.');
      s.pressurized = true; spend(s, sc.pressurize.minutes, sc.pressurize.power); recordDecision(s, id);
      return ok('Whoosh! Air is in. Amara takes off the dusty gear.');
    case 'takeTool': {
      if (!['brush', 'nozzle'].includes(arg)) return fail('That is not a cleaning tool.');
      if (!s.pressurized) return fail('Fill the airlock with air first.');
      if (s.hand === arg) return fail('You already have it.');
      if (s.hand === 'filter') return fail('Put the filter in first.');
      s.hand = arg; recordDecision(s, id, {tool: arg}); return ok(arg === 'brush' ? 'You have the brush. Hold E on dusty gear.' : 'You have the vacuum hose. Hold E on dusty gear.');
    }
    case 'putTool':
      if (!s.hand) return fail('Your hands are empty.');
      if (s.hand === 'filter') { s.spares++; s.hand = null; return ok('Filter back in the locker.'); }
      s.hand = null; return ok('Tool put away.');
    case 'clean': {
      if (!ITEMS.includes(arg)) return fail('That is not gear.');
      if (!s.pressurized) return fail('Fill the airlock with air first.');
      const tool = TOOL_OF_HAND[s.hand]; if (!tool) return fail('Grab the brush or the vacuum hose first.');
      if (s.edsItem === arg) return fail('That is on the EDS plate. Flip the switch!');
      if (s.items[arg].dust <= .5) return fail(`The ${itemName(s, arg)} is already clean.`);
      if (s.power < sc.tools[tool].power) return fail('Not enough power for the vacuum. Try the brush!');
      const removed = clean(s, arg, tool);
      let message = `${tool === 'brush' ? 'Brushed' : 'Vacuumed'} the ${itemName(s, arg)}.`;
      if (tool === 'brush' && sc.items[arg].visor && !s.scratched) { s.scratched = true; message = 'Scratch! Moon dust is sharp like tiny bits of glass. Brushing scratched the visor.'; }
      else if (tool === 'brush') message += ' Dust puffs into the air!';
      recordDecision(s, id, {item: arg, tool, removed: +removed.toFixed(1)});
      return ok(message + (s.items[arg].dust > sc.cleanEnough ? ' Still dusty. Clean it again.' : ' Clean!'));
    }
    case 'edsLoad':
      if (!ITEMS.includes(arg)) return fail('That is not gear.');
      if (!s.pressurized) return fail('Fill the airlock with air first.');
      if (!sc.items[arg].eds) return fail(`The ${itemName(s, arg)} is too big for the EDS plate.`);
      if (s.hand) return fail('Put down what you are holding first.');
      if (s.edsItem) return fail('Something is already on the plate.');
      if (s.items[arg].dust <= .5) return fail(`The ${itemName(s, arg)} is already clean.`);
      s.edsItem = arg; recordDecision(s, id, {item: arg}); return ok(`The ${itemName(s, arg)} is on the plate. Flip the EDS switch!`);
    case 'edsZap': {
      if (!s.edsItem) return fail('Put the helmet, bag or boots on the plate first.');
      if (s.power < sc.tools.eds.power) return fail('Not enough power for the EDS.');
      const item = s.edsItem; const removed = clean(s, item, 'eds'); s.edsItem = null;
      recordDecision(s, id, {item, removed: +removed.toFixed(1)});
      return ok(`Zap! The electric field lifted dust off the ${itemName(s, item)}.${s.items[item].dust > sc.cleanEnough ? ' Some is still stuck.' : ' Clean!'}`);
    }
    case 'scrub': {
      if (!s.pressurized) return fail('Fill the airlock with air first.');
      if (s.airDust <= .5) return fail('The air is already clean.');
      if (s.filterLoad >= sc.filterCap) return fail('The filter is full! Get a new one from the locker.');
      if (s.power < sc.scrub.power) return fail('Not enough power to run the fan.');
      const room = sc.filterCap - s.filterLoad, caught = Math.min(room, s.airDust);
      s.filterLoad = +(s.filterLoad + caught).toFixed(2); s.airDust = +(s.airDust - caught).toFixed(2); s.uses.scrub++;
      spend(s, sc.scrub.minutes, sc.scrub.power); recordDecision(s, id, {caught: +caught.toFixed(1)});
      return ok(s.airDust > .5 ? 'The filter filled up before the air was clean! Swap in a new filter.' : 'The fan pulled the dust into the filter. The air is clean!');
    }
    case 'takeFilter':
      if (s.hand === 'filter') return fail('You already have a filter.');
      if (s.hand) return fail('Put your tool away first.');
      if (s.spares <= 0) return fail('No spare filters left.');
      s.spares--; s.hand = 'filter'; recordDecision(s, id); return ok('Got a new filter. Swap it in at the filter door.');
    case 'swapFilter':
      if (s.hand !== 'filter') return fail('Get a new filter from the locker first.');
      s.hand = null; s.filterLoad = 0; s.swaps++; spend(s, sc.swapFilter.minutes); recordDecision(s, id); return ok('New filter in! The old one goes in the trash.');
    case 'openInner': {
      if (!s.pressurized) return fail('Fill the airlock with air before you open the inside hatch!');
      if (safeToEnter(s)) { s.innerOpen = true; spend(s, sc.hatchMinutes); recordDecision(s, id, {safe: true}); s.phase = 'debrief'; return ok('The hatch opens. Clean gear, clean air, clean base!'); }
      const gear = dirtyItems(s).reduce((sum, k) => sum + s.items[k].dust - sc.cleanEnough, 0);
      const leak = Math.round(s.airDust * sc.leak.air + gear * sc.leak.gear);
      s.baseDust += leak; s.airDust = +(s.airDust * .5).toFixed(2); s.leaks++; spend(s, sc.hatchMinutes);
      recordDecision(s, id, {safe: false, leak});
      if (s.leaks >= 2) { s.innerOpen = true; s.phase = 'debrief'; return ok('Amara says it is time to go in, dust and all.'); }
      return ok('Uh-oh! A puff of dust got into the base. Shut it, clean more, then try again.');
    }
  }
  return fail('Nothing happens.');
}

export function getObjective(s) {
  if (s.phase === 'brief') return 'Welcome back from your moonwalk';
  if (s.phase === 'debrief') return s.stoppedEarly ? 'Game stopped. Try again!' : 'See how you kept the dust out';
  if (!s.plan) return 'Pick a cleaning plan';
  const sc = s.scenario;
  if (s.outer === 'open') return 'Shut the outside hatch: hold E on the orange wheel';
  if (!s.pressurized) return 'Fill the airlock with air: press the green button';
  if (s.hand === 'filter') return 'Swap the air filter: hold E on the filter door';
  if (s.edsItem) return 'Flip the EDS switch to zap the dust';
  const dirty = dirtyItems(s);
  if (dirty.length) {
    if (s.hand) return `Clean the ${itemName(s, dirty[0])}: hold E on it`;
    return s.plan === 'mix' && dirty.some(id => sc.items[id].eds) ? 'Put dusty gear on the EDS plate, or grab a tool' : s.plan === 'vacuum' ? 'Grab the vacuum hose on the bench' : 'Grab the brush on the bench';
  }
  if (s.airDust > sc.airSafe) {
    if (s.filterLoad >= sc.filterCap) return s.spares > 0 ? 'The filter is full! Get a new one from the locker' : 'No filters left. Open the inside hatch when ready';
    return 'Clean the air: press the green button';
  }
  return 'All clean! Open the inside hatch: hold E on the green wheel';
}
export function getSteps(s) {
  const list = [
    {text: 'Pick a plan', done: !!s.plan},
    {text: 'Shut the outside hatch', done: s.outer === 'closed'},
    {text: 'Fill the airlock with air', done: s.pressurized},
    {text: 'Clean all 4 pieces of gear', done: s.pressurized && !dirtyItems(s).length},
    {text: 'Clean the air', done: s.pressurized && s.airDust <= s.scenario.airSafe && !dirtyItems(s).length},
    {text: 'Open the inside hatch', done: s.innerOpen},
  ];
  if (s.phase !== 'brief') { const now = list.find(x => !x.done); if (now) now.now = true; }
  return list;
}
export function getResult(s) {
  const sc = s.scenario, completed = s.phase === 'debrief' && !s.stoppedEarly && s.innerOpen;
  const rating = !completed ? 'none' : s.baseDust === 0 && !s.scratched ? 'great' : s.baseDust <= sc.ratings.okBaseDust ? 'ok' : 'low';
  return {
    outcome: !completed ? 'stopped' : rating === 'great' ? 'clean-base' : rating === 'ok' ? 'mostly-clean' : 'dusty-base',
    completed, success: completed && rating !== 'low', mastered: rating === 'great',
    score: completed ? Math.max(0, Math.min(100, Math.round(80 - s.baseDust * 1.2 - (s.scratched ? 15 : 0) + s.power / sc.powerUnits * 15 + Math.max(0, 60 - s.minutes) / 12))) : null,
    plan: s.plan, rating, minutes: s.minutes, powerLeft: s.power, baseDust: s.baseDust, scratched: s.scratched, filters: s.swaps, leaks: s.leaks, uses: {...s.uses},
  };
}
export {serializeSnapshot, restoreSnapshot};
