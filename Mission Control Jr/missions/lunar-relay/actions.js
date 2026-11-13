// Rules for "Over the Hill". Pure functions; the 3D scene reads this state and sends actions.
import {recordDecision} from '../../simulation/decisions.js';
import {serializeSnapshot, restoreSnapshot} from '../../simulation/replay.js';
import {lineOfSight} from '../shared/moon-ground.js';

const ok = message => ({ok: true, message}), fail = message => ({ok: false, message});
export const PLANS = {
  relay: {icon: '📡', title: 'Relay on the ridge', text: 'Stop on the ridge top and set up a radio relay. Then the base and Earth can hear you in the hollow.'},
  direct: {icon: '🚙', title: 'Quick trip', text: 'Skip the relay. Drill, then drive back. Your data goes home once you are over the hill.'},
};
export const NEXT = {base: ['saddle'], saddle: ['base', 'hollow'], hollow: ['saddle']};
export const relayHeight = s => s.scenario.relay.baseM + s.stages * s.scenario.relay.stageM;

/** Can the base hear a rover parked at this stop, straight over the ground? */
export function directLink(s, stop) {
  if (stop === 'base') return true;
  const sc = s.scenario, b = sc.baseAntenna;
  return lineOfSight(b, b.h, sc.stops[stop].park, sc.roverAntennaH).clear;
}
/** The relay's two hops: base → relay (needs the dish aimed) and relay → the rover at a stop. */
export function relayHops(s, stop = s.at) {
  const sc = s.scenario;
  if (s.relay !== 'ground' || !s.legs) return {base: false, field: false};
  const spot = sc.stops[s.relayAt].relaySpot, h = relayHeight(s), b = sc.baseAntenna;
  return {base: s.aimed && lineOfSight(b, b.h, spot, h).clear, field: lineOfSight(spot, h, sc.stops[stop].park, sc.roverAntennaH).clear};
}
export function hasLink(s, stop = s.at) { if (directLink(s, stop)) return true; const h = relayHops(s, stop); return h.base && h.field; }
/** Battery needed to drive home from where you are. */
export function batteryHome(s) {
  let need = 0, at = s.at; const sc = s.scenario;
  while (at !== 'base') { const to = at === 'hollow' ? 'saddle' : 'base'; need += sc.legs[`${at}>${to}`].battery; at = to; }
  return need;
}
export const suitLeft = s => Math.max(0, s.scenario.suitMinutes - s.minutes);

function spend(s, minutes) {
  if (!hasLink(s)) s.quietMinutes += minutes;
  s.minutes += minutes; s.simSeconds = s.minutes * 60;
  if (suitLeft(s) <= 0 && s.phase === 'active') { s.phase = 'debrief'; s.notice = 'Suit air is very low. Luca calls the crew home.'; }
}
function deliver(s) {
  let n = 0;
  for (const m of s.messages) if (m.status === 'queued' && hasLink(s)) { m.status = 'delivered'; m.deliveredMin = s.minutes; m.live = s.at === 'hollow'; n++; }
  return n;
}

export function applyAction(s, {id, payload, targetId} = {}) {
  if (s.phase === 'brief' && id === 'begin') { s.phase = 'active'; recordDecision(s, 'begin'); return ok('Pick a plan for the trip.'); }
  if (s.phase !== 'active') return fail('Start the mission first.');
  const sc = s.scenario, arg = payload ?? targetId;
  if (id === 'choosePlan') {
    if (!PLANS[arg] || s.plan) return fail('Pick one of the plans.');
    s.plan = arg; recordDecision(s, id, {plan: arg});
    return ok(arg === 'relay' ? 'Plan: relay on the ridge. Load the relay onto the rover!' : 'Plan: quick trip. Hop in the rover!');
  }
  if (!s.plan) return fail('Pick a plan first.');
  if (id === 'stopEarly') { s.stoppedEarly = true; s.phase = 'debrief'; return ok('Practice stopped.'); }
  switch (id) {
    case 'takeRelay': {
      if (s.hand) return fail('Your hands are full.');
      const here = s.relay === 'crate' ? s.at === 'base' : s.relay === 'rover' || (s.relay === 'ground' && s.relayAt === s.at);
      if (!here) return fail('The relay is not here.');
      if (s.relay === 'ground' && (s.legs || s.stages)) return fail('Lower the mast and lift the legs first.');
      s.relay = 'hand'; s.hand = 'relay'; s.relayAt = null; s.aimed = false; s.legs = false; s.stages = 0; recordDecision(s, id); return ok('You have the relay. It is light on the Moon!');
    }
    case 'stowRelay':
      if (s.hand !== 'relay' && s.relay !== 'hand') return fail('Pick up the relay first.');
      s.relay = 'rover'; s.hand = null; recordDecision(s, id); return ok('The relay is on the cargo deck.');
    case 'putRelayBack':
      if (s.relay !== 'hand' || s.at !== 'base') return fail('You can only put it back at the base.');
      s.relay = 'crate'; s.hand = null; return ok('Relay back in its crate.');
    case 'placeRelay':
      if (s.relay !== 'hand') return fail('Pick up the relay first.');
      if (!sc.stops[s.at].relaySpot) return fail('Set it down out on the trip, not at the base.');
      s.relay = 'ground'; s.relayAt = s.at; s.hand = null; s.legs = false; s.stages = 0; s.aimed = false; spend(s, sc.minutes.placeRelay); recordDecision(s, id, {at: s.at});
      return ok('Relay set down. Now put its legs out.');
    case 'relayLegs':
      if (s.relay !== 'ground' || s.relayAt !== s.at) return fail('Set the relay down first.');
      if (s.legs && s.stages) return fail('Lower the mast first.');
      s.legs = !s.legs; spend(s, sc.minutes.legs); recordDecision(s, id, {down: s.legs});
      return ok(s.legs ? 'Legs out. The relay stands steady.' : 'Legs up.');
    case 'raiseStage':
      if (s.relay !== 'ground' || !s.legs) return fail('Put the relay’s legs out first.');
      if (s.stages >= sc.relay.stages) return fail('The mast is as tall as it goes.');
      s.stages++; spend(s, sc.minutes.stage); recordDecision(s, id, {stages: s.stages});
      return ok(`Mast up to ${relayHeight(s).toFixed(1)} m.${relayHops(s, 'hollow').field ? ' It can see into Shadow Hollow!' : ' Still too low to see over the hill.'}`);
    case 'lowerStage':
      if (s.relay !== 'ground' || s.stages <= 0) return fail('The mast is already down.');
      s.stages--; spend(s, 1); recordDecision(s, id, {stages: s.stages}); return ok(`Mast down to ${relayHeight(s).toFixed(1)} m.`);
    case 'aim': {
      if (s.relay !== 'ground' || !s.legs) return fail('Put the relay’s legs out first.');
      if (s.aimed) return fail('The dish already points at the base.');
      s.aimed = true; spend(s, sc.minutes.aim); recordDecision(s, id);
      const hop = relayHops(s);
      return ok(hop.base ? 'Beep! The dish found the base. Green light!' : 'The dish points at the base, but the hill is in the way.');
    }
    case 'drive': {
      if (!NEXT[s.at].includes(arg)) return fail('You can’t drive there from here.');
      if (s.hand) return fail('Put down what you are holding first.');
      if (s.drill !== 'rover') return fail('Put the drill back on the rover first.');
      const leg = sc.legs[`${s.at}>${arg}`], from = s.at, quietBefore = !hasLink(s);
      s.at = arg;
      if (quietBefore || !hasLink(s)) s.quietMinutes += leg.minutes;
      s.minutes += leg.minutes; s.simSeconds = s.minutes * 60;
      let message = `Arrived at ${sc.stops[arg].name}.`;
      if (s.battery < leg.battery) { s.battery = 0; s.rescued = true; s.minutes += sc.minutes.rescue; s.simSeconds = s.minutes * 60; message = 'The rover battery ran flat! Luca drove out a spare battery. That took a while.'; }
      else s.battery -= leg.battery;
      const sent = deliver(s);
      if (sent) message += ` 📶 Signal! Your data zipped to the base and reached Earth ${sc.oneWaySeconds} seconds later.`;
      recordDecision(s, id, {from, to: arg, battery: s.battery, sent});
      if (suitLeft(s) <= 0) { s.phase = 'debrief'; return ok('Suit air is very low. Luca calls the crew home.'); }
      return ok(message);
    }
    case 'takeDrill':
      if (s.hand) return fail('Your hands are full.');
      if (s.at !== 'hollow') return fail('Drill in Shadow Hollow, where the science is.');
      if (s.coreReady) return fail('Take the core out of the drill first.');
      if (s.drill === 'hand') return fail('You already have the drill.');
      s.drill = 'hand'; s.hand = 'drill'; s.drillAt = null; spend(s, sc.minutes.takeDrill); recordDecision(s, id); return ok('You have the drill. Set it on the X.');
    case 'placeDrill': {
      if (s.hand !== 'drill') return fail('Pick up the drill first.');
      if (!sc.drillSpots[arg]) return fail('Put it on an X.');
      if (arg === 'b' && !s.earthAsked) return fail('Use the first X.');
      if (arg === 'a' && s.cores >= 1) return fail('You already drilled here. Earth asked for the second X!');
      s.drill = 'ground'; s.drillAt = arg; s.hand = null; spend(s, sc.minutes.placeDrill); recordDecision(s, id, {spot: arg}); return ok('Drill in place. Hold E on it to drill.');
    }
    case 'packDrill':
      if (s.hand !== 'drill') return fail('Pick up the drill first.');
      s.drill = 'rover'; s.hand = null; recordDecision(s, id); return ok('Drill back on the rover.');
    case 'drillCore': {
      if (s.drill !== 'ground') return fail('Set the drill on the X first.');
      if (s.coreReady) return fail('Take the core out first.');
      if (s.cores >= (s.earthAsked ? 2 : 1)) return fail('That is all the cores we need. Head home!');
      if (s.battery < sc.drillBattery) return fail('Not enough battery to drill.');
      s.battery -= sc.drillBattery; s.coreReady = true; s.cores++; spend(s, sc.minutes.drill); recordDecision(s, id, {core: s.cores, spot: s.drillAt});
      return ok('Brrrr! The drill spins down and pulls up a core of Moon soil.');
    }
    case 'takeCore':
      if (!s.coreReady) return fail('Drill a core first.');
      if (s.hand) return fail('Your hands are full.');
      s.coreReady = false; s.hand = 'core'; recordDecision(s, id); return ok('Careful! Put the core in the sample box on the rover.');
    case 'stowCore':
      if (s.hand !== 'core') return fail('Take the core out of the drill first.');
      s.hand = null; s.stowed++; spend(s, sc.minutes.stow); recordDecision(s, id); return ok('Core safe in the sample box. Now send the data!');
    case 'sendData': {
      const unsent = s.stowed - s.messages.length;
      if (unsent <= 0) return fail(s.stowed ? 'All the data is sent.' : 'Put a core in the sample box first.');
      for (let i = 0; i < unsent; i++) s.messages.push({core: s.messages.length + 1, status: 'queued', sentMin: s.minutes, deliveredMin: null, live: false});
      spend(s, sc.minutes.send);
      const sent = deliver(s); recordDecision(s, id, {sent, link: hasLink(s)});
      if (!sent) return ok('No signal! The hill blocks the radio. The data waits in the rover until you are in view.');
      if (s.cores === 1 && !s.earthAsked) { s.earthAsked = true; return ok(`📶 Sent! Earth got it ${sc.oneWaySeconds} s later. Earth: “We see shiny bits! Can you drill one more core at the second X?”`); }
      return ok(`📶 Sent! Earth got it ${sc.oneWaySeconds} s later. Earth: “Great core. Thank you, crew!”`);
    }
    case 'finish':
      if (s.at !== 'base') return fail('Drive back to the base first.');
      if (s.hand) return fail('Put down what you are holding first.');
      s.finished = true; s.phase = 'debrief'; recordDecision(s, id); return ok('Welcome home, crew!');
  }
  return fail('Nothing happens.');
}

export function getObjective(s) {
  if (s.phase === 'brief') return 'Welcome to Horizon Base';
  if (s.phase === 'debrief') return s.stoppedEarly ? 'Game stopped. Try again!' : s.finished ? 'See how your trip went' : 'Suit air ran low. Try again!';
  if (!s.plan) return 'Pick a plan for the trip';
  const sc = s.scenario;
  if (s.hand === 'relay') return s.at === 'base' ? 'Put the relay on the rover’s cargo deck' : sc.stops[s.at].relaySpot ? 'Set the relay down on the yellow ring' : 'Put the relay on the rover';
  if (s.hand === 'drill') return s.coreReady ? 'Put the drill on the rover' : s.cores < (s.earthAsked ? 2 : 1) ? `Set the drill on the ${s.earthAsked && s.cores ? 'second' : 'glowing'} X` : 'Put the drill back on the rover';
  if (s.hand === 'core') return 'Put the core in the sample box on the rover';
  if (s.at === 'base') {
    if (s.stowed) return 'Go inside: hold E on the base hatch';
    if (s.plan === 'relay' && s.relay === 'crate') return 'Pick up the radio relay by its handle';
    return 'Get in the rover and drive to the ridge top';
  }
  if (s.at === 'saddle') {
    if (s.stowed) return 'Drive home to the base';
    if (s.relay === 'rover' && s.plan === 'relay') return 'Lift the relay off the rover';
    if (s.relay === 'ground' && s.relayAt === 'saddle') {
      if (!s.legs) return 'Put the relay’s legs out: hold E on it';
      const hop = relayHops(s, 'hollow');
      if (!hop.field && s.stages < sc.relay.stages) return 'Raise the mast: press E on the green ▲';
      if (!s.aimed) return 'Aim the dish at the base: hold E on the dish';
    }
    return 'Drive down into Shadow Hollow';
  }
  // Shadow Hollow
  if (s.coreReady) return 'Take the core out of the drill';
  if (s.stowed > s.messages.length) return 'Send the data from the rover radio';
  if (s.drill === 'ground' && s.cores < (s.earthAsked ? 2 : 1)) return s.drillAt === 'a' && s.earthAsked && s.cores ? 'Move the drill to the second X' : 'Drill a core: hold E on the drill';
  if (s.drill === 'rover' && s.cores < (s.earthAsked ? 2 : 1)) return s.earthAsked ? 'Earth wants one more! Take the drill again' : 'Take the drill off the rover';
  if (s.drill === 'ground') return 'Pick up the drill and put it on the rover';
  return 'Drive home over the hill';
}
export function getInstruction(s) {
  if (s.phase !== 'active') return null;
  if (!s.plan) return {text: 'Choose whether to carry a relay or send the data after you get back over the ridge.'};
  if (s.hand === 'relay') return s.at === 'base' || !s.scenario.stops[s.at].relaySpot
    ? {place: 'rover', text: 'Use the rover’s rear cargo deck to load the relay.'}
    : {text: 'Aim at the yellow ring on the ground and use it to set the relay down.'};
  if (s.hand === 'drill') {
    if (s.cores >= (s.earthAsked ? 2 : 1)) return {place: 'rover', text: 'Use the rear cargo deck to put the drill away.'};
    return {place: 'drill', text: s.cores ? 'Use the second glowing X to set down the drill.' : 'Use the first glowing X to set down the drill.'};
  }
  if (s.hand === 'core') return {place: 'rover', text: 'Use the sample box on the rover to store the core.'};
  const drive = to => ({place: 'rover', text: `Use the rover seat, then choose ${s.scenario.stops[to].name} on the drive screen.`});
  if (s.at === 'base') {
    if (s.stowed) return {place: 'hatch', text: 'Hold E or hold the prompt on the base hatch to bring your sample inside.'};
    if (s.plan === 'relay' && s.relay === 'crate') return {place: 'relay', text: 'Use the relay’s handle at its crate to pick it up.'};
    return drive('saddle');
  }
  if (s.at === 'saddle') {
    if (s.stowed) return drive('base');
    if (s.plan === 'relay' && s.relay === 'rover') return {place: 'rover', text: 'Use the rear cargo deck to lift off the relay.'};
    if (s.relay === 'ground' && s.relayAt === 'saddle') {
      if (!s.legs) return {place: 'relay', text: 'Hold E or hold the prompt on the relay frame to lower its legs.'};
      if (!relayHops(s, 'hollow').field && s.stages < s.scenario.relay.stages) return {place: 'relay', text: 'Use the green ▲ until the mast can reach the hollow.'};
      if (!s.aimed) return {place: 'relay', text: 'Aim at the dish. Hold E or hold the prompt until the relay finds the base.'};
    }
    return drive('hollow');
  }
  if (s.coreReady) return {place: 'drill', text: 'Use the core at the top of the drill to take it out.'};
  if (s.stowed > s.messages.length) return {place: 'rover', text: hasLink(s)
    ? 'Use the rover radio to send your sample data. Watch for Earth’s reply.'
    : 'Use the rover radio to save the data. It will send when you drive back into signal range.'};
  const more = s.cores < (s.earthAsked ? 2 : 1);
  if (s.drill === 'ground') return {place: 'drill', text: !more ? 'Use the drill to pick it up, then stow it on the rover.'
    : s.cores && s.drillAt === 'a' ? 'Use the drill to pick it up. Carry it to the second glowing X.'
    : 'Aim at the drill on the X. Hold E or hold the prompt until the core comes up.'};
  if (more) return {place: 'rover', text: 'Use the rear cargo deck to take the drill.'};
  return drive('saddle');
}

export function getSteps(s) {
  const relay = s.plan === 'relay';
  const list = [
    {text: 'Pick a plan', done: !!s.plan},
    ...(relay ? [{text: 'Load the relay on the rover', done: s.relay === 'rover' || s.relay === 'ground' || s.at !== 'base'}, {text: 'Set up the relay on the ridge', done: hasLinkTo(s)}] : []),
    {text: 'Drill a core in the hollow', done: s.stowed > 0},
    {text: 'Send the first core’s data', done: s.messages.length > 0},
    ...(s.earthAsked ? [{text: 'Collect and send the second core', done: s.messages.length > 1}] : []),
    {text: 'Drive home and go inside', done: s.finished},
  ];
  if (s.phase !== 'brief') { const now = list.find(x => !x.done); if (now) now.now = true; }
  return list;
}
const hasLinkTo = s => { const h = relayHops(s, 'hollow'); return h.base && h.field; };

export function getResult(s) {
  const sc = s.scenario, completed = s.phase === 'debrief' && s.finished;
  const live = s.messages.filter(m => m.live).length, delivered = s.messages.filter(m => m.status === 'delivered').length;
  const suit = suitLeft(s);
  const rating = !completed ? 'none' : s.stowed === 0 ? 'low' : s.rescued || suit < sc.lowSuitMinutes || s.battery < sc.batteryReserve ? 'ok' : 'great';
  return {
    outcome: !completed ? (s.stoppedEarly ? 'stopped' : 'suit-limit') : rating === 'low' ? 'no-science' : live ? 'live-science' : 'late-science',
    completed, success: completed && rating !== 'low', mastered: rating === 'great',
    score: completed ? Math.max(0, Math.min(100, Math.round(50 + s.stowed * 15 + live * 5 + suit / 6 + s.battery / 4 - s.quietMinutes / 2 - (s.rescued ? 25 : 0)))) : null,
    plan: s.plan, rating, minutes: s.minutes, battery: s.battery, suitLeft: suit, cores: s.stowed, delivered, live,
    quietMinutes: s.quietMinutes, relayUsed: hasLinkTo(s), stages: s.stages, rescued: s.rescued,
  };
}
export {serializeSnapshot, restoreSnapshot};
