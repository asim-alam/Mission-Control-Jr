// Rules for "A Place to Hide" (v3). Pure functions: the 3D scene and HUD only read this state.
// Time while preparing is "work minutes": every job costs minutes, walking is free. That keeps the
// mission deterministic and fair on slow laptops, and makes layout choices change preparation time.
import {recordDecision} from '../../simulation/decisions.js';
import {serializeSnapshot, restoreSnapshot} from '../../simulation/replay.js';
import {CREW, PEOPLE, SEAT_IDS, SURFACE_IDS} from './state.js';

const ok = (message, extra) => ({ok: true, message, ...extra});
const fail = message => ({ok: false, message});
export const NAMES = {elena: 'Elena', amara: 'Amara', jin: 'Jin', luca: 'Luca', you: 'You'};
export const ASSISTS = {
  trolley: {title: 'Help with the water trolley', text: 'Elena wheels all six water containers over to the refuge, so loading them is quicker.'},
  airflow: {title: 'Check the airflow', text: 'Elena inspects the vent and fits a duct, so bags can be stacked by the side wall without blocking the air.'},
};
export const item = (s, id) => s.items.find(i => i.id === id);
const at = (s, where) => s.items.filter(i => i.at === where);
export const rackWater = s => at(s, 'rack');
export const railPanels = (s, surface) => at(s, `rail:${surface}`);
export const zoneBags = (s, zone) => at(s, `zone:${zone}`);
const minutesLeftBeforeOnset = s => s.scenario.onsetMinute - s.minutes;

// ---- protection model ---------------------------------------------------------------------
/** Fraction of particles that get through one refuge surface (0..1). */
export function surfaceTransmission(s, surface) {
  const sc = s.scenario; let t = sc.surfaces[surface].base;
  if (s.rack.built && s.rack.at === surface) t *= 1 - sc.water.perContainer * rackWater(s).length;
  t *= sc.poly.factor ** railPanels(s, surface).length;
  for (const [zone, z] of Object.entries(sc.bags.zones)) if (z.surface === surface) t *= sc.bags.factor ** zoneBags(s, zone).length;
  return t;
}
/** Fraction that reaches someone sitting in a seat, from the made-up "sky share" of each surface. */
export function seatTransmission(s, seat) {
  const sky = s.scenario.seats[seat].sky; let sum = 0;
  for (const surface of SURFACE_IDS) sum += sky[surface] * surfaceTransmission(s, surface);
  return sum;
}
/** Outside rate (illustrative units per hour) at a time in the event: rise, high plateau, slow fade. */
export function outsideRate(s, hours = s.eventHours) {
  const sc = s.scenario, peak = sc.peakOutsideRate;
  if (hours < 0 || hours > sc.eventHours) return 0;
  if (hours < 1) return peak * hours;
  if (hours < 3) return peak;
  return peak * Math.exp(-(hours - 3) * Math.LN10 / (sc.eventHours - 3));
}
export const habRate = (s, hours) => s.scenario.backgroundRate + outsideRate(s, hours) * s.scenario.habInteriorShare;
export function personRate(s, person, hours = s.eventHours) {
  if (!s.inside[person]) return habRate(s, hours);
  return s.scenario.backgroundRate + outsideRate(s, hours) * seatTransmission(s, s.seats[person]);
}
/** Whole-event fluence (outside), used to turn transmissions into an expected total. */
export function eventFluence(s) { let f = 0; const n = 400, dt = s.scenario.eventHours / n; for (let i = 0; i < n; i++) f += outsideRate(s, (i + .5) * dt) * dt; return f; }
/** Estimate (not a measurement!) of what each person would collect in this layout if all goes to plan. */
export function estimate(s) {
  const f = eventFluence(s), out = {};
  for (const p of PEOPLE) out[p] = +(f * seatTransmission(s, s.seats[p])).toFixed(1);
  out.habitat = +(f * s.scenario.habInteriorShare).toFixed(1); return out;
}
export function seatLevel(s, seat) { const t = seatTransmission(s, seat); return t < .45 ? 'strong' : t < .62 ? 'medium' : 'weak'; }

// ---- refuge check -------------------------------------------------------------------------
export function checkRefuge(s) {
  const sc = s.scenario, list = [];
  const door = zoneBags(s, 'stack_door').length, side = zoneBags(s, 'stack_side').length;
  list.push({id: 'entrance', label: 'Entrance clear', ok: !door, blocking: true,
    fix: door ? `${door} supply ${door === 1 ? 'bag is' : 'bags are'} next to the door. People must be able to get in and out quickly, so move them.` : ''});
  const ductless = s.assist !== 'airflow';
  list.push({id: 'airflow', label: 'Air vent open', ok: !(ductless && side >= sc.ventBlockBags), blocking: true,
    fix: ductless && side >= sc.ventBlockBags ? 'The bags by the side wall cover the air vent. Five people need fresh air for hours. Move a bag, or ask for a duct.' : ''});
  const water = rackWater(s).length, tapBlocked = water > 0 && ((s.rack.at === 'back_r' && zoneBags(s, 'stack_back').length) || (s.rack.at === 'side_l' && side));
  list.push({id: 'water', label: 'Drinking water reachable', ok: !tapBlocked, blocking: true,
    fix: tapBlocked ? 'Bags are stacked in front of the water rack tap. The crew must be able to drink during a long wait.' : ''});
  const loose = [];
  if (water && !s.rack.latched) loose.push('the water rack is not latched');
  const unfastened = s.items.filter(i => i.kind === 'poly' && i.at.startsWith('rail:') && !i.fastened).length;
  if (unfastened) loose.push(`${unfastened} plastic ${unfastened === 1 ? 'panel is' : 'panels are'} not fastened`);
  for (const [zone, z] of Object.entries(sc.bags.zones)) if (zoneBags(s, zone).length && !s.zones[zone].strapped) loose.push(`the bags on the ${z.label} are not strapped`);
  list.push({id: 'secured', label: 'Supplies secured', ok: !loose.length, blocking: false, fix: loose.length ? `Loose: ${loose.join(', ')}. Loose things can slip during a long wait.` : ''});
  const door_ = PEOPLE.filter(p => s.seats[p] === 'F');
  list.push({id: 'seats', label: 'Crew seats', ok: !door_.length, blocking: false,
    fix: door_.length ? `${door_.map(p => NAMES[p]).join(' and ')} ${door_.length === 1 && door_[0] !== 'you' ? 'is' : 'are'} in the door seat, which has the least cover. Is there a better seat?` : ''});
  if (s.held) list.push({id: 'hands', label: 'Hands free', ok: false, blocking: true, fix: 'Put down what you are carrying first.'});
  return list;
}
export const blockingIssues = s => checkRefuge(s).filter(c => !c.ok && c.blocking);

// ---- time ---------------------------------------------------------------------------------
function spend(s, minutes) {
  s.minutes += minutes; s.simSeconds += minutes * 60;
  for (const p of PEOPLE) s.exposure[p] += s.scenario.backgroundRate * minutes / 60;
  if (s.stage === 'prep' && s.minutes >= s.scenario.onsetMinute) onset(s, true);
}
function onset(s, duringPrep) {
  s.stage = 'event'; s.eventHours = 0; s.onsetDuringPrep = duringPrep;
  s.atOnset = {minutes: Math.round(s.minutes), estimate: estimate(s), issues: checkRefuge(s).filter(c => !c.ok).map(c => c.id)};
  if (duringPrep) {
    s.coverLeft = s.scenario.coverMinutes; for (const p of PEOPLE) s.inside[p] = false;
    if (s.held) { item(s, s.held).at = 'store'; s.held = null; }
    // The crew sort out the dangerous problems as they arrive. It costs protection, but nobody is trapped.
    if (zoneBags(s, 'stack_door').length) { for (const b of zoneBags(s, 'stack_door')) b.at = 'store'; s.events.push({id: 'door-cleared'}); }
    if (s.assist !== 'airflow') while (zoneBags(s, 'stack_side').length >= s.scenario.ventBlockBags) { zoneBags(s, 'stack_side')[0].at = 'store'; s.ventFixedByCrew = true; }
    s.notice = 'Sensors show particles rising! Everyone is heading into the refuge now.';
  } else s.notice = 'Sensors show particles rising. You are all in the refuge.';
}
const coverRate = .25; // story hours per real second while the crew walks in (keeps "late" visible)
/** Advance by real seconds. Only the cover walk and the event run on the clock. */
export function advanceMission(s, realSeconds, {speed = 1} = {}) {
  if (s.phase !== 'active' || s.paused || !Number.isFinite(realSeconds) || realSeconds <= 0) return false;
  if (s.stage === 'cover') {
    const left = minutesLeftBeforeOnset(s), step = Math.min(left, realSeconds * 30);
    s.minutes += step; s.simSeconds += step * 60;
    for (const p of PEOPLE) s.exposure[p] += s.scenario.backgroundRate * step / 60;
    if (minutesLeftBeforeOnset(s) <= 1e-6) onset(s, false);
    return true;
  }
  if (s.stage !== 'event') return false;
  const sc = s.scenario;
  let hours = s.coverLeft > 0 ? Math.min(s.coverLeft / 60, realSeconds * coverRate) : realSeconds * sc.eventHours / sc.eventRealSeconds * speed;
  while (hours > 1e-9 && s.stage === 'event') {
    const dh = Math.min(hours, .05); hours -= dh; integrate(s, dh);
  }
  return true;
}
function integrate(s, dh) {
  const h0 = s.eventHours, mid = h0 + dh / 2;
  for (const p of PEOPLE) { s.rate[p] = personRate(s, p, mid); s.exposure[p] += s.rate[p] * dh; }
  s.outsideRate = outsideRate(s, mid); s.peakOutside = Math.max(s.peakOutside, s.outsideRate);
  s.eventHours += dh; s.simSeconds += dh * 3600;
  if (s.coverLeft > 0) { s.coverLeft = Math.max(0, s.coverLeft - dh * 60); if (!s.coverLeft) { for (const p of PEOPLE) s.inside[p] = true; s.notice = 'Everyone is in the refuge now.'; } }
  // Loose things slip during the long wait. This is a story event, not a physics simulation.
  if (h0 < 2 && s.eventHours >= 2) slips(s);
  if (s.eventHours >= s.scenario.eventHours) { s.stage = 'after'; s.rate = Object.fromEntries(PEOPLE.map(p => [p, s.scenario.backgroundRate])); s.outsideRate = 0; s.notice = 'The particle levels are back to normal. All clear!'; }
}
function slips(s) {
  const sc = s.scenario, lost = [];
  for (const [zone, z] of Object.entries(sc.bags.zones)) if (z.overhead && !s.zones[zone].strapped) for (const b of zoneBags(s, zone)) { b.at = 'floor'; lost.push(b.id); }
  for (const p of s.items) if (p.kind === 'poly' && p.at.startsWith('rail:') && !p.fastened) { p.at = 'floor'; lost.push(p.id); }
  if (!s.rack.latched) for (const w of rackWater(s).slice(-2)) { w.at = 'floor'; lost.push(w.id); }
  if (lost.length) { s.slipped.push(...lost); s.notice = `Something loose just slipped down (${lost.length} ${lost.length === 1 ? 'item' : 'items'}). That part of the refuge is weaker now.`; }
}

// ---- actions ------------------------------------------------------------------------------
const BUILD = new Set(['buildRack', 'loadRack', 'latchRack', 'slidePanel', 'fastenPanel', 'placeBag', 'strapZone', 'pickUp', 'chooseAssist', 'moveCrew']);
export function applyAction(s, action = {}) {
  const r = act(s, action);
  if (r.ok && BUILD.has(action.id) && !action.replay) s.blueprint.push({id: action.id, targetId: action.targetId, payload: action.payload});
  return r;
}
function act(s, {id, targetId, payload} = {}) {
  const sc = s.scenario;
  if (s.phase === 'brief' && id === 'begin') { s.phase = 'active'; s.stage = 'prep'; recordDecision(s, 'begin'); return ok('Get the refuge ready.'); }
  if (s.phase !== 'active') return fail('Start the mission first.');
  if (s.paused) return fail('Unpause the game first.');
  if (id === 'openMap') { s.mapViewed = true; return ok('Refuge map open.'); }
  if (id === 'toggleOverlay') { s.overlay = !s.overlay; return ok(s.overlay ? 'Showing the particle illustration. Real particles are invisible.' : 'Illustration hidden.'); }
  if (id === 'stopEarly') { s.phase = 'debrief'; s.stoppedEarly = true; recordDecision(s, id); return ok('You stopped the practice.'); }
  if (id === 'finish') { if (s.stage !== 'after') return fail('Wait for the all clear.'); s.phase = 'debrief'; recordDecision(s, id); return ok('Mission finished.'); }
  if (s.stage !== 'prep') return fail('The refuge is closed up now.');

  if (id === 'chooseAssist') {
    if (s.assist) return fail('Elena is already helping.');
    if (!ASSISTS[payload]) return fail('Pick one of the jobs for Elena.');
    s.assist = payload; recordDecision(s, id, {assist: payload});
    if (payload === 'trolley') for (const w of s.items) if (w.kind === 'water' && w.at === 'store') w.at = 'trolley';
    return ok(payload === 'trolley' ? 'Elena is wheeling the water over to the refuge.' : 'Elena is fitting a duct to the air vent.');
  }
  if (id === 'moveCrew') {
    const person = targetId, seat = payload;
    if (!(person in s.seats) || !SEAT_IDS.includes(seat)) return fail('Pick a person and a seat.');
    const other = Object.keys(s.seats).find(p => s.seats[p] === seat);
    if (other === person) return fail(`${NAMES[person]} is already there.`);
    if (other) s.seats[other] = s.seats[person];
    s.seats[person] = seat; recordDecision(s, id, {person, seat});
    return ok(`${NAMES[person]} will sit in ${sc.seats[seat].label}${other ? ` and ${NAMES[other]} swaps seats` : ''}.`);
  }
  if (id === 'runCheck') { s.checkViewed = true; recordDecision(s, id); return ok('Refuge check done.'); }
  if (id === 'ready') {
    const block = blockingIssues(s);
    if (block.length) return fail(block[0].fix);
    s.checkViewed = true; s.stage = 'cover'; for (const p of PEOPLE) s.inside[p] = true;
    s.readyAt = Math.round(s.minutes); recordDecision(s, id, {minutes: s.readyAt});
    return ok('Everyone is in the refuge. Now we watch the sensors.');
  }
  if (id === 'buildRack') {
    if (s.rack.built) return fail('The water rack is already built.');
    if (!sc.water.rackSpots.includes(payload)) return fail('The rack fits against the back wall or the side wall.');
    if (s.held) return fail('Put down what you are carrying first.');
    s.rack = {at: payload, built: true, latched: false}; spend(s, sc.water.minutes.frame); recordDecision(s, id, {at: payload});
    return ok(`Rack frame bolted to the ${sc.surfaces[payload].label.toLowerCase()}.`);
  }
  if (id === 'pickUp') {
    const it = item(s, targetId); if (!it) return fail('There is nothing there.');
    if (s.held) return fail('Your hands are full. Put that down first.');
    if (it.at === 'floor') return fail('That fell during the event.');
    const placed = !['store', 'trolley'].includes(it.at);
    if (placed) {
      if (it.at.startsWith('zone:')) s.zones[it.at.slice(5)].strapped = false;
      if (it.at === 'rack') s.rack.latched = false;
      spend(s, sc.moveMinutes);
      if (s.stage !== 'prep') return ok('No time left to move it.');
    }
    it.from = it.at; it.at = 'hand'; it.fastened = false; s.held = it.id; recordDecision(s, id, {item: it.id});
    return ok(placed ? `You took out the ${label(it)}. (${sc.moveMinutes} work minutes)` : `You picked up a ${label(it)}.`);
  }
  if (id === 'putBack') {
    if (!s.held) return fail('Your hands are empty.');
    const it = item(s, s.held); it.at = it.from === 'trolley' ? 'trolley' : 'store'; s.held = null; return ok('Put down.');
  }
  const held = s.held && item(s, s.held);
  if (id === 'loadRack') {
    if (!held || held.kind !== 'water') return fail('Carry a water container to the rack.');
    if (!s.rack.built) return fail('Build the rack frame first.');
    if (rackWater(s).length >= sc.water.count) return fail('The rack is full.');
    held.at = 'rack'; s.held = null; s.rack.latched = false;
    spend(s, held.from === 'trolley' ? sc.water.minutes.loadTrolley : sc.water.minutes.load);
    return ok(`Water container in the rack (${rackWater(s).length} of ${sc.water.count}).`);
  }
  if (id === 'latchRack') {
    if (!s.rack.built || !rackWater(s).length) return fail('Load some water first.');
    if (s.rack.latched) return fail('Already latched.');
    s.rack.latched = true; spend(s, sc.water.minutes.latch); return ok('Rack latched. The containers cannot slide out.');
  }
  if (id === 'slidePanel') {
    if (!held || held.kind !== 'poly') return fail('Carry a plastic panel to a rail.');
    const cap = sc.poly.rails[targetId]; if (!cap) return fail('That is not a panel rail.');
    if (railPanels(s, targetId).length >= cap) return fail('Those rails are full.');
    held.at = `rail:${targetId}`; held.fastened = false; s.held = null; spend(s, sc.poly.minutes.slide);
    return ok('Panel slid into the rails. Fasten it so it stays put.');
  }
  if (id === 'fastenPanel') {
    const it = item(s, targetId);
    if (!it || it.kind !== 'poly' || !it.at.startsWith('rail:')) return fail('Slide a panel into the rails first.');
    if (it.fastened) return fail('That panel is already fastened.');
    it.fastened = true; spend(s, sc.poly.minutes.fasten); return ok('Panel fastened.');
  }
  if (id === 'placeBag') {
    if (!held || held.kind !== 'bag') return fail('Carry a supply bag here.');
    const z = sc.bags.zones[targetId]; if (!z) return fail('That is not a stacking spot.');
    if (zoneBags(s, targetId).length >= z.cap) return fail('That stack is full.');
    held.at = `zone:${targetId}`; s.held = null; s.zones[targetId].strapped = false;
    spend(s, z.overhead ? sc.bags.minutes.placeOverhead : sc.bags.minutes.place);
    return ok(`Bag stacked on the ${z.label}. Strap the stack when you are done.`);
  }
  if (id === 'strapZone') {
    if (!sc.bags.zones[targetId] || !zoneBags(s, targetId).length) return fail('Stack some bags here first.');
    if (s.zones[targetId].strapped) return fail('Already strapped.');
    s.zones[targetId].strapped = true; spend(s, sc.bags.minutes.strap); return ok('Stack strapped down.');
  }
  return fail('Unknown action.');
}
const label = it => ({water: 'water container', poly: 'plastic panel', bag: 'supply bag'})[it.kind];

/** Rebuild a saved layout in order (same work minutes as doing it by hand). Used by "Try changing one thing". */
export function applyBlueprint(s, blueprint) {
  let n = 0;
  for (const step of blueprint) { if (s.stage !== 'prep') break; if (act(s, {...step}).ok) { s.blueprint.push(step); n++; } }
  return ok(`Your last layout is rebuilt (${n} jobs).`);
}

// ---- HUD text -----------------------------------------------------------------------------
export function getObjective(s) {
  if (s.phase === 'brief') return 'Hear the space weather alert';
  if (s.phase === 'debrief') return s.stoppedEarly ? 'Game stopped. Try again from a safe spot.' : 'See how your refuge worked';
  if (s.stage === 'cover') return 'Wait with the crew for the sensors';
  if (s.stage === 'event') return s.coverLeft > 0 ? 'Everyone is hurrying into the refuge' : 'Watch the outside and refuge sensors';
  if (s.stage === 'after') return 'All clear! Finish at the refuge screen';
  if (!s.mapViewed) return 'Look at the refuge map on the tablet';
  if (!s.assist) return 'Ask Elena for one kind of help';
  const held = s.held && item(s, s.held);
  if (held) return {water: s.rack.built ? 'Load the water container into the rack' : 'Build the rack frame, then load the water', poly: 'Slide the plastic panel into a rail', bag: 'Stack the supply bag in a stacking spot'}[held.kind];
  if (s.checkViewed && blockingIssues(s).length) return `Fix the refuge: ${blockingIssues(s)[0].label.toLowerCase()}`;
  return 'Strengthen the refuge, then run the refuge check';
}
export function getSteps(s) {
  const water = rackWater(s).length, panels = s.items.filter(i => i.kind === 'poly' && i.at.startsWith('rail:')).length, bags = s.items.filter(i => i.kind === 'bag' && i.at.startsWith('zone:')).length;
  const list = [
    {text: 'Look at the refuge map', done: s.mapViewed},
    {text: 'Pick Elena’s job', done: !!s.assist},
    {text: `Water rack · ${water}/${s.scenario.water.count}${s.rack.latched ? ' · latched' : ''}`, done: water > 0 && s.rack.latched},
    {text: `Plastic panels · ${panels}/${s.scenario.poly.count}`, done: panels > 0 && s.items.every(i => i.kind !== 'poly' || !i.at.startsWith('rail:') || i.fastened)},
    {text: `Supply bags · ${bags}/${s.scenario.bags.count}`, done: bags > 0 && Object.keys(s.zones).every(z => !zoneBags(s, z).length || s.zones[z].strapped)},
    {text: 'Run the refuge check', done: s.stage !== 'prep'},
    {text: 'Wait out the event', done: s.stage === 'after' || s.phase === 'debrief'},
  ];
  if (s.phase === 'active') { const now = list.find(x => !x.done); if (now) now.now = true; }
  return list;
}
export const teamExposure = s => PEOPLE.reduce((a, p) => a + s.exposure[p], 0) / PEOPLE.length;
/** Compare with what the crew would have collected waiting in the plain habitat. */
export function reduction(s) { const hab = eventFluence(s) * s.scenario.habInteriorShare; return hab > 0 ? Math.max(0, 1 - (teamExposure(s) - s.scenario.backgroundRate * s.minutes / 60) / hab) : 0; }
export function rating(s) { const r = reduction(s); return r >= s.scenario.ratings.great ? 'great' : r >= s.scenario.ratings.ok ? 'ok' : 'weak'; }

/** What helped most and what stayed weakest, in the player's actual layout. */
export function explain(s) {
  const sc = s.scenario, gains = SURFACE_IDS.map(id => ({id, label: sc.surfaces[id].label, cut: sc.surfaces[id].base - surfaceTransmission(s, id)})).sort((a, b) => b.cut - a.cut);
  const worst = [...PEOPLE].sort((a, b) => s.exposure[b] - s.exposure[a])[0], seat = s.seats[worst], sky = sc.seats[seat].sky;
  const weakest = SURFACE_IDS.map(id => ({id, label: sc.surfaces[id].label, leak: sky[id] * surfaceTransmission(s, id)})).sort((a, b) => b.leak - a.leak)[0];
  const helped = gains.filter(g => g.cut > .05).slice(0, 2);
  return {helped, weakest, worst, seat};
}
export function getResult(s) {
  const completed = s.phase === 'debrief' && !s.stoppedEarly, r = rating(s), red = reduction(s);
  const used = kind => s.items.filter(i => i.kind === kind && (i.at === 'rack' || i.at.startsWith('rail:') || i.at.startsWith('zone:'))).length;
  return {
    outcome: !completed ? 'stopped' : r === 'great' ? 'great-shield' : r === 'ok' ? 'safe' : 'weak-shield',
    completed, success: completed && r !== 'weak', mastered: completed && r === 'great', score: completed ? Math.round(red * 100) : null,
    rating: r, reduction: +red.toFixed(2), teamExposure: +teamExposure(s).toFixed(1),
    exposure: Object.fromEntries(PEOPLE.map(p => [p, +s.exposure[p].toFixed(1)])), seats: {...s.seats},
    assist: s.assist, rackAt: s.rack.at, water: used('water'), poly: used('poly'), bags: used('bag'), slipped: s.slipped.length,
    minutes: Math.round(s.readyAt ?? s.atOnset?.minutes ?? s.minutes), lateCover: s.onsetDuringPrep, sourceId: s.scenario.sourceId,
  };
}
export {serializeSnapshot, restoreSnapshot, CREW};
