// Rules for "Arrival at Mars". Pure functions on plain state; the 3D scene only reads this.
import {recordDecision} from '../../simulation/decisions.js';
import {serializeSnapshot, restoreSnapshot} from '../../simulation/replay.js';
import {LOADS} from './state.js';

export const STAGES = ['feed', 'amp', 'card', 'radio'];
const ok = message => ({ok: true, message});
const fail = message => ({ok: false, message});

export const powerUsed = s => LOADS.reduce((n, l) => n + (s.loads[l] ? s.scenario.loads[l].units : 0), 0);
export const inShadow = (s, minute = s.minute) => { const t = minute % s.scenario.orbitMinutes; return t >= s.scenario.shadow.start && t < s.scenario.shadow.end; };
export const powerAvailable = (s, minute = s.minute) => inShadow(s, minute) ? s.scenario.power.shadow : s.scenario.power.sun;
/** Minutes until the orbiter next enters Mars' shadow (0 while in it). */
export function minutesToShadow(s) { if (inShadow(s)) return 0; const t = s.minute % s.scenario.orbitMinutes, st = s.scenario.shadow.start; return t < st ? st - t : s.scenario.orbitMinutes - t + st; }
export function minutesToSun(s) { if (!inShadow(s)) return 0; return s.scenario.shadow.end - s.minute % s.scenario.orbitMinutes; }
/** First pass over Meridian Base at or after this minute. */
export function nextPass(s, from = s.minute) { const {firstPass: f, orbitMinutes: o} = s.scenario; return from <= f ? f : f + Math.ceil((from - f) / o) * o; }
export const hazardCamReady = s => s.charge >= s.scenario.lander.hazardCamAt;
export const partLabel = (s, p) => s.scenario.parts[p].label;
export const loadLabel = (s, l) => s.scenario.loads[l].label;

function trip(s, why) {
  for (const l of LOADS) if (!s.scenario.loads[l].locked) s.loads[l] = false;
  s.tripped = true; s.trips += 1; s.events.push({type: 'trip', minute: s.minute, why});
  s.notice = why === 'shadow' ? 'We flew into Mars’ shadow with too much switched on. The breaker tripped! Reset it at the power panel.' : 'Too much power! The breaker tripped. Reset it at the power panel.';
}

/** Let story time pass, one minute at a time: charging, shadow, cold and passes over the base. */
export function spend(s, minutes) {
  const sc = s.scenario;
  for (let i = 0; i < minutes; i++) {
    const wasShadow = inShadow(s);
    s.minute += 1; s.simSeconds = s.minute * 60;
    if (s.boarded) continue;
    if (s.loads.charger && !s.tripped) s.charge = Math.min(100, s.charge + sc.lander.chargePerMinute);
    const shade = inShadow(s);
    if (!wasShadow && shade) { s.events.push({type: 'shadow', minute: s.minute}); if (powerUsed(s) > sc.power.shadow) trip(s, 'shadow'); else s.notice = 'We are in Mars’ shadow now. The solar wings get no sunlight, so we run on the battery.'; }
    if (wasShadow && !shade) s.notice = 'Sunlight again! The solar wings are making power.';
    if (!shade && minutesToShadow(s) === 10) s.notice = `Mars’ shadow in 10 minutes! Then there are only ${sc.power.shadow} power units.`;
    if (shade && !s.loads.heat) s.coldMinutes += 1;
    if (s.minute >= sc.firstPass && (s.minute - sc.firstPass) % sc.orbitMinutes === 0) { s.missedPasses += 1; s.notice = 'We just flew over Meridian Base. The next pass is in 2 hours.'; }
  }
}

export function testLights(s) {
  if (s.comms || (s.fixed && s.lastTest === 'ok')) return Object.fromEntries(STAGES.map(st => [st, 'green']));
  if (!s.lastTest) return Object.fromEntries(STAGES.map(st => [st, 'off']));
  if (s.lastTest === 'tester') { const at = STAGES.indexOf(s.fault); return Object.fromEntries(STAGES.map((st, i) => [st, i < at ? 'green' : i === at ? 'red' : 'off'])); }
  return {feed: 'off', amp: 'off', card: 'off', radio: 'red'};
}

/** Where the lander touches down. Same seed + same pass + same site = same spot, so a retry is a fair test. */
export function computeLanding(s, pass = nextPass(s)) {
  const sc = s.scenario, site = sc.sites[s.site], passIndex = Math.round((pass - sc.firstPass) / sc.orbitMinutes);
  let a = (s.seed * 31 + passIndex * 101 + Object.keys(sc.sites).indexOf(s.site) * 7) >>> 0;
  const rng = () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const angle = rng() * Math.PI * 2, r = Math.sqrt(rng()), shrink = s.comms ? sc.beaconShrink : 1;
  const rel = r * shrink, cam = hazardCamReady(s), onSmooth = rel <= site.safe + 1e-9;
  const diverted = !onSmooth && cam, rough = !onSmooth && !cam, finalRel = diverted ? site.safe * .9 : rel;
  const offKm = finalRel * sc.ellipseKm / 2;
  return {site: s.site, pass, passIndex, comms: s.comms, hazardCam: cam, rel: +rel.toFixed(3), angle: +angle.toFixed(3), finalRel: +finalRel.toFixed(3),
    smooth: !rough, diverted, rough, offKm: +offKm.toFixed(2), distanceKm: +(site.km + offKm).toFixed(1)};
}

export function applyAction(s, {id, targetId, payload} = {}) {
  const sc = s.scenario;
  if (s.phase === 'brief' && id === 'begin') { s.phase = 'active'; recordDecision(s, 'begin'); return ok('The radio to Meridian Base is quiet. Let’s find out why.'); }
  if (s.phase !== 'active') return fail('Start the mission first.');
  if (id === 'stopEarly') { s.phase = 'debrief'; s.stoppedEarly = true; recordDecision(s, id); return ok('You stopped the practice.'); }
  if (s.stage === 'descent') {
    if (id === 'touchdown') { s.phase = 'debrief'; s.stage = 'landed'; recordDecision(s, id, {...s.landing}); return ok('Touchdown!'); }
    return fail('We are landing! Hold on tight.');
  }
  if (id === 'toggleLoad') {
    const load = sc.loads[targetId]; if (!load) return fail('Pick a switch.');
    if (load.locked) return fail('Life support keeps the air fresh. It always stays on!');
    const on = !s.loads[targetId];
    if (on && s.tripped) return fail('The main breaker is off. Reset it first: the yellow handle.');
    s.loads[targetId] = on; recordDecision(s, id, {load: targetId, on, minute: s.minute});
    const want = powerUsed(s);
    if (on && want > powerAvailable(s)) { trip(s, 'overload'); return ok(`Too much! ${want} units is more than the ${powerAvailable(s)} we have. The breaker tripped.`); }
    return ok(`${load.icon} ${load.label} ${on ? 'on' : 'off'} · ${powerUsed(s)} of ${powerAvailable(s)} power units`);
  }
  if (id === 'resetBreaker') {
    if (!s.tripped) return fail('The breaker is fine.');
    s.tripped = false; spend(s, sc.minutes.reset); recordDecision(s, id);
    return ok('Breaker reset. Switch things back on one at a time, and watch the power gauge.');
  }
  if (id === 'take') {
    if (s.holding) return fail('Your hands are full.');
    if (payload === 'tester' && s.tester === 'case') { s.tester = 'hand'; s.holding = 'tester'; spend(s, sc.minutes.take); return ok('You have the signal tester. Clip it onto the radio rack.'); }
    if (payload === 'amp' && s.spareAmp === 'case') { s.spareAmp = 'hand'; s.holding = 'amp'; spend(s, sc.minutes.take); return ok('You have the spare amplifier.'); }
    return fail('That is not in the locker.');
  }
  if (id === 'putBack') {
    if (s.holding === 'tester') s.tester = 'case'; else if (s.holding === 'amp') s.spareAmp = 'case'; else return fail('Your hands are empty.');
    s.holding = null; return ok('Put back in the locker.');
  }
  if (id === 'clipTester') {
    if (s.holding !== 'tester') return fail('Get the signal tester from the spares locker first.');
    s.holding = null; s.tester = 'rack'; spend(s, sc.minutes.clip); recordDecision(s, id);
    return ok('Tester clipped on. Now press the green test button.');
  }
  if (id === 'testSignal') {
    if (s.tripped) return fail('No power! Reset the breaker first.');
    const off = sc.testNeeds.filter(l => !s.loads[l]);
    if (off.length) return fail(`To test, switch on: ${off.map(l => loadLabel(s, l)).join(', ')}.`);
    spend(s, sc.minutes.test); s.tests += 1;
    if (s.fixed) { s.lastTest = 'ok'; s.comms = true; recordDecision(s, id, {result: 'ok'}); s.events.push({type: 'comms', minute: s.minute}); return ok('📻 “Asteria, this is Meridian Base. We hear you loud and clear!” The base landing beacon is on.'); }
    s.lastTest = s.tester === 'rack' ? 'tester' : 'plain';
    if (s.tester === 'rack') { s.diagnosed = s.fault; recordDecision(s, id, {result: 'tester', fault: s.fault}); return ok(`The tester shows it: the ${partLabel(s, s.fault)} light is red. That is the broken part!`); }
    recordDecision(s, id, {result: 'no-signal'});
    return ok('No signal. Something in the radio is broken, but which part? The signal tester would show you.');
  }
  if (id === 'inspect') {
    const part = sc.parts[targetId]; if (!part) return fail('Look at a part of the radio.');
    spend(s, sc.minutes.inspect); if (!s.inspected.includes(targetId)) s.inspected.push(targetId); recordDecision(s, id, {part: targetId});
    if (targetId === s.fault && !s.fixed) { s.diagnosed = s.fault; return ok(`🔍 ${part.clue}`); }
    return ok(`🔍 The ${part.label} looks fine.`);
  }
  if (id === 'fixPart') {
    const part = sc.parts[targetId]; if (!part) return fail('Pick a part of the radio.');
    if (s.fixed && targetId === s.fault) return fail('That part is already fixed. Test the radio!');
    if (targetId === 'amp' && s.holding !== 'amp') return fail('Get the spare amplifier from the spares locker first.');
    if (s.loads[part.load] && !s.tripped) {
      s.zaps += 1; trip(s, 'zap'); recordDecision(s, id, {part: targetId, zap: true});
      s.notice = `Zap! The ${part.label} still had power. The breaker tripped to keep you safe. Switch off the ${loadLabel(s, part.load)} before you touch it.`;
      return ok('Zap!');
    }
    s.triedFixes.push(targetId); recordDecision(s, id, {part: targetId, right: targetId === s.fault});
    if (targetId !== s.fault) { spend(s, sc.minutes.wrongFix); return ok(`The ${part.label} was fine. You put it back. Time used: ${sc.minutes.wrongFix} minutes.`); }
    if (targetId === 'amp') { s.holding = null; s.spareAmp = 'rack'; spend(s, sc.minutes.swapAmp); } else spend(s, sc.minutes.fix);
    s.fixed = true; s.lastTest = null;
    return ok(`Fixed the ${part.label}! Switch the radio parts back on and test the radio.`);
  }
  if (id === 'chooseSite') {
    if (!sc.sites[payload]) return fail('Pick a landing site.');
    s.site = payload; s.sitesViewed = true; recordDecision(s, id, {site: payload, comms: s.comms, charge: s.charge, minute: s.minute});
    return ok(`Landing site: ${sc.sites[payload].icon} ${sc.sites[payload].label}.`);
  }
  if (id === 'wait') {
    const n = Math.max(1, Math.min(60, Number(payload) || sc.minutes.wait)); spend(s, n); recordDecision(s, id, {minutes: n});
    return ok(`${n} minutes went by.`);
  }
  if (id === 'board') {
    if (!s.site) return fail('Pick a landing site at the planner table first.');
    if (s.holding) return fail('Put down what you are holding first.');
    recordDecision(s, id, {site: s.site, comms: s.comms, charge: s.charge, minute: s.minute});
    s.loads.charger = false; s.boarded = true; s.stage = 'descent';
    spend(s, sc.minutes.board);
    const pass = nextPass(s); spend(s, pass - s.minute);
    s.landing = computeLanding(s, pass);
    return ok('Hatch closed! We undock on the next pass over Meridian Base.');
  }
  return fail('Unknown action.');
}

export function getObjective(s) {
  const sc = s.scenario;
  if (s.phase === 'brief') return 'Arrival at Mars';
  if (s.phase === 'debrief') return s.stoppedEarly ? 'Game stopped. Try again from a safe spot.' : 'See how your landing went';
  if (s.stage === 'descent') return 'Landing on Mars…';
  if (s.tripped) return 'The breaker tripped! Reset it at the power panel';
  if (!inShadow(s) && minutesToShadow(s) <= 10 && powerUsed(s) > sc.power.shadow) return `Shadow soon! Use ${sc.power.shadow} power units or less`;
  if (s.holding === 'tester') return 'Clip the tester onto the radio rack';
  if (s.holding === 'amp' && !s.fixed) return s.loads.amp ? 'Fix the amplifier: switch off the Amplifier first' : 'Put the spare amplifier in the radio rack';
  if (!s.comms) {
    if (s.fixed) return 'Switch the radio parts on, then test the radio';
    if (s.diagnosed) { const p = sc.parts[s.diagnosed]; return s.loads[p.load] ? `Fix the ${p.label}: switch off the ${loadLabel(s, p.load)} first` : `Fix the ${p.label}`; }
    if (!s.tests) return 'Test the radio: press the green button on the rack';
    return 'Find what is broken: use the tester, or look closely';
  }
  if (!s.site) return !hazardCamReady(s) && !s.loads.charger ? 'Charge the lander, then pick a landing site' : 'Pick a landing site at the planner table';
  return 'Get in the lander: open the hatch';
}
export function getSteps(s) {
  const list = [
    {text: 'Find what is broken', done: !!(s.diagnosed || s.fixed)},
    {text: 'Fix and test the radio', done: s.comms},
    {text: 'Charge the lander (helps)', done: hazardCamReady(s)},
    {text: 'Pick a landing site', done: !!s.site},
    {text: 'Get in and land', done: s.boarded},
  ];
  if (s.phase !== 'brief') { const now = list.find(x => !x.done); if (now) now.now = true; }
  return list;
}
export function getResult(s) {
  const completed = s.phase === 'debrief' && !s.stoppedEarly, L = s.landing;
  const success = completed && !!L && !L.rough;
  return {
    outcome: !completed ? 'stopped' : L.rough ? 'landed-rough' : L.diverted ? 'landed-diverted' : 'landed-smooth',
    completed, success, mastered: success && s.comms && !s.zaps && !s.coldMinutes,
    score: completed ? Math.round(Math.max(0, Math.min(100, (L.rough ? 35 : 65) + (s.comms ? 15 : 0) + (L.distanceKm < 1.5 ? 10 : L.distanceKm < 4 ? 5 : 0) + (s.coldMinutes ? 0 : 5) + (s.zaps ? 0 : 5) - L.passIndex * 5))) : null,
    site: s.site, comms: s.comms, landing: L, charge: Math.round(s.charge), trips: s.trips, zaps: s.zaps, coldMinutes: s.coldMinutes,
    minute: s.minute, passIndex: L?.passIndex ?? null, fault: s.fault, wrongFixes: s.triedFixes.filter(p => p !== s.fault).length, usedTester: s.tester === 'rack', inspected: s.inspected.length,
  };
}
export {serializeSnapshot, restoreSnapshot};
