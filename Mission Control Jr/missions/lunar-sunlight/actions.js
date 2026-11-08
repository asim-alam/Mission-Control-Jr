// Rules for "Chasing the Sun". Pure functions; the 3D scene reads this state and sends actions.
import {recordDecision} from '../../simulation/decisions.js';
import {serializeSnapshot, restoreSnapshot} from '../../simulation/replay.js';
import {sunlit} from '../shared/moon-ground.js';

const ok = message => ({ok: true, message}), fail = message => ({ok: false, message});
export const PLANS = {
  near: {icon: '🏠', title: 'Near pad', text: 'Close to the base. A short walk and a short cable, but hills block the Sun sometimes.'},
  ridge: {icon: '⛰️', title: 'Ridge pad', text: 'High on the ridge. A long walk and most of the cable, but the Sun shines there more.'},
};
export const panelHeight = s => s.scenario.mast.baseTop + s.scenario.mast.stage * s.stages;
export const cableNeeded = (s, pad = s.cart) => { const p = s.scenario.pads[pad]; return p ? Math.hypot(p.x - s.scenario.port.x, p.z - s.scenario.port.z) : 0; };
export const sunAzimuth = (s, hour) => s.scenario.window.startAzimuthDeg + s.scenario.window.sweepDeg * hour / (s.scenario.window.days * 24);

/** Hour-by-hour sunlight for a pad and mast height over the sunlight window (true = sunlit). */
export function sunPlan(s, pad = s.cart, height = panelHeight(s)) {
  const p = s.scenario.pads[pad]; if (!p) return [];
  const hours = s.scenario.window.days * 24, out = [];
  for (let h = 0; h < hours; h++) out.push(sunlit(p.x, p.z, height, sunAzimuth(s, h + .5), s.scenario.sunElevationDeg));
  return out;
}
export const sunShare = (s, pad, height) => { const plan = sunPlan(s, pad, height); return plan.length ? plan.filter(Boolean).length / plan.length : 0; };

/** Run the whole window: battery, science and cold hours, hour by hour. */
export function runWatch(s) {
  const sc = s.scenario, plan = sunPlan(s), log = [];
  let battery = s.batteryKWh, scienceHours = 0, coldHours = 0, minBattery = battery;
  plan.forEach((lit, h) => {
    const gen = lit && s.tracker ? sc.panelKW : 0;
    const scienceWanted = s.savePlan === 'save' ? lit : true;
    let need = sc.essentialKW + (scienceWanted ? sc.scienceKW : 0);
    let have = battery + gen;
    let science = scienceWanted;
    if (have < need) { science = false; need = sc.essentialKW; }
    if (have < need) { coldHours++; battery = 0; } else battery = Math.min(sc.batteryKWh, have - need);
    if (science) scienceHours++;
    minBattery = Math.min(minBattery, battery);
    log.push({h, lit, battery: +battery.toFixed(2), science, cold: have < sc.essentialKW});
  });
  return {log, scienceHours, coldHours, minBattery: +minBattery.toFixed(1), endBattery: +battery.toFixed(1), sunShare: plan.filter(Boolean).length / plan.length, hours: plan.length};
}

function work(s, minutes) {
  s.suitMinutes = Math.max(0, s.suitMinutes - minutes); s.simSeconds += minutes * 60;
  if (s.suitMinutes <= s.scenario.lowSuitMinutes && !s.suitLow) { s.suitLow = true; s.notice = '⚠️ Suit air is getting low. Finish soon!'; }
  if (s.suitMinutes <= 0) { s.phase = 'debrief'; s.notice = 'Suit air ran out, so you went back inside to refill.'; return false; }
  return true;
}

export function applyAction(s, {id, payload, targetId} = {}) {
  if (s.phase === 'brief' && id === 'begin') { s.phase = 'active'; recordDecision(s, 'begin'); return ok('Pick a spot for the solar mast.'); }
  if (s.phase !== 'active') return fail('Start the mission first.');
  const sc = s.scenario, arg = payload ?? targetId;
  if (id === 'choosePlan') { if (!PLANS[arg] || s.plan) return fail('Pick one of the pads.'); s.plan = arg; recordDecision(s, id, {pad: arg}); return ok(`Plan: ${PLANS[arg].title}. Hitch up the solar cart!`); }
  if (!s.plan) return fail('Pick a pad first.');
  if (id === 'stopEarly') { s.stoppedEarly = true; s.phase = 'debrief'; return ok('Practice stopped.'); }
  switch (id) {
    case 'hitch':
      if (s.hitched) return fail('The cart is already hitched.'); if (s.legs) return fail('Lift the legs before you move the cart.');
      if (s.plug === 'port') return fail('Unplug the cable first.');
      s.hitched = true; work(s, sc.workMinutes.hitch); recordDecision(s, id); return ok('Cart hitched. Walk and it will follow you!');
    case 'arrive': {
      if (!s.hitched) return fail('Hitch the cart first.'); if (!sc.pads[arg] && arg !== 'base') return fail('That is not a pad.');
      if (s.cart === arg) return fail('You are already there.');
      const from = s.cart; s.cart = arg; recordDecision(s, id, {pad: arg});
      if (arg !== 'base' && !work(s, sc.pads[arg].towMinutes)) return ok('Out of suit air.');
      if (from !== 'base' && arg === 'base') work(s, sc.pads[from].towMinutes);
      return ok(arg === 'base' ? 'Back at the base.' : `You reached the ${sc.pads[arg].name}. Unhitch the cart and put its legs down.`);
    }
    case 'deployLegs':
      if (!sc.pads[s.cart]) return fail('Take the cart to a pad first.'); if (s.legs) return fail('The legs are already down.');
      s.hitched = false; s.legs = true; work(s, sc.workMinutes.legs); recordDecision(s, id, {pad: s.cart}); return ok('Legs down. The cart is steady.');
    case 'raiseStage':
      if (!s.legs) return fail('Put the legs down first, or the mast could tip.'); if (s.stages >= sc.mast.stages) return fail('The mast is all the way up.');
      if (s.wings) return fail('Fold the wings before you raise the mast.');
      s.stages++; work(s, sc.workMinutes.stage); recordDecision(s, id, {stages: s.stages});
      return ok(`Mast stage ${s.stages} up! The panel is ${panelHeight(s).toFixed(1)} m high. Sun forecast: ${Math.round(sunShare(s, s.cart, panelHeight(s)) * 100)}%.`);
    case 'lowerStage':
      if (s.stages <= 0) return fail('The mast is already down.'); if (s.wings) return fail('Fold the wings first.');
      s.stages--; work(s, 1); recordDecision(s, id, {stages: s.stages}); return ok('Mast lowered one stage.');
    case 'openWings':
      if (!s.legs) return fail('Put the legs down first.'); if (s.stages < 1) return fail('Raise the mast at least one stage first, so the wings clear the cart.');
      if (s.wings) return fail('The wings are already open.');
      s.wings = true; work(s, sc.workMinutes.wings); recordDecision(s, id, {stages: s.stages}); return ok('Solar wings open!');
    case 'foldWings':
      if (!s.wings) return fail('The wings are already folded.'); s.wings = false; s.tracker = false; work(s, 1); recordDecision(s, id); return ok('Wings folded.');
    case 'liftLegs':
      if (!s.legs) return fail('The legs are already up.'); if (s.stages > 0 || s.wings) return fail('Fold the wings and lower the mast first.');
      if (s.plug === 'port') return fail('Unplug the cable first.');
      s.legs = false; work(s, 1); recordDecision(s, id); return ok('Legs up. You can hitch the cart again.');
    case 'takePlug':
      if (s.plug !== 'reel') return fail(s.plug === 'hand' ? 'You already have the plug.' : 'The plug is already in the base.');
      if (!sc.pads[s.cart] || !s.legs) return fail('Set the cart up on a pad first.');
      s.plug = 'hand'; recordDecision(s, id); return ok('You have the plug. Walk it back to the base power port.');
    case 'plugIn': {
      if (s.plug !== 'hand') return fail('Take the plug from the cable reel first.');
      const need = cableNeeded(s); if (need > sc.cableM) return fail(`The cable is too short: ${need.toFixed(0)} m needed, ${sc.cableM} m on the reel.`);
      s.plug = 'port'; work(s, sc.pads[s.cart].carryMinutes + sc.workMinutes.plug); recordDecision(s, id, {cableM: +need.toFixed(1)});
      return ok(`Plugged in! ${need.toFixed(0)} m of cable used.`);
    }
    case 'unplug': if (s.plug !== 'port') return fail('The cable is not plugged in.'); s.plug = 'reel'; s.tracker = false; work(s, 1); recordDecision(s, id); return ok('Unplugged and wound back.');
    case 'putPlugBack': if (s.plug !== 'hand') return fail('You are not holding the plug.'); s.plug = 'reel'; recordDecision(s, id); return ok('Plug back on the reel.');
    case 'tracker':
      if (!s.wings) return fail('Open the solar wings first.'); if (s.plug !== 'port') return fail('Plug the cable into the base first.');
      if (s.tracker) return fail('The Sun tracker is already on.');
      s.tracker = true; work(s, sc.workMinutes.tracker); recordDecision(s, id, {stages: s.stages, pad: s.cart}); return ok('Sun tracker on! The panel turns to face the Sun.');
    case 'powerPlan':
      if (!['science', 'save'].includes(arg)) return fail('Pick a power plan.'); s.savePlan = arg; recordDecision(s, id, {plan: arg});
      return ok(arg === 'save' ? 'Science will pause in the dark to save the battery.' : 'Science will run all the time.');
    case 'watch': {
      if (!s.tracker) return fail('Turn on the Sun tracker first.'); if (!s.savePlan) return fail('Pick a power plan at the console.');
      s.watch = runWatch(s); s.batteryKWh = s.watch.endBattery; s.simSeconds += s.watch.hours * 3600; recordDecision(s, id, {scienceHours: s.watch.scienceHours, coldHours: s.watch.coldHours});
      s.phase = 'debrief'; return ok(`${s.scenario.window.days} days later…`);
    }
  }
  return fail('Nothing happens.');
}

export function getObjective(s) {
  if (s.phase === 'brief') return 'Welcome to Horizon Base';
  if (s.phase === 'debrief') return s.stoppedEarly ? 'Game stopped. Try again!' : 'See how your plan worked';
  if (!s.plan) return 'Pick a pad for the solar mast';
  const pad = s.scenario.pads[s.plan].name;
  if (s.plug === 'hand') return 'Carry the plug to the base power port';
  if (!s.legs) {
    if (!s.hitched) return 'Hitch the solar cart: grab its handle';
    return s.cart === s.plan ? `Put the cart’s legs down at the ${pad}` : `Tow the cart to the ${pad}`;
  }
  if (s.stages < 1) return 'Raise the mast: hold E on the green ▲ button';
  if (!s.wings) return s.stages < s.scenario.mast.stages ? 'Raise the mast more, or open the solar wings' : 'Open the solar wings';
  if (s.plug === 'reel') return 'Take the plug from the cable reel';
  if (!s.tracker) return 'Turn on the Sun tracker on the cart';
  if (!s.savePlan) return 'Pick a power plan at the base console';
  return `Watch ${s.scenario.window.days} days go by at the base console`;
}
export function getSteps(s) {
  const list = [
    {text: 'Pick a pad', done: !!s.plan},
    {text: 'Tow the cart there', done: s.legs || s.cart === s.plan && s.plan !== null},
    {text: 'Legs down + raise the mast', done: s.stages > 0},
    {text: 'Open the solar wings', done: s.wings},
    {text: 'Plug the cable into the base', done: s.plug === 'port'},
    {text: 'Sun tracker on', done: s.tracker},
    {text: `Watch ${s.scenario.window.days} days`, done: !!s.watch},
  ];
  if (s.phase !== 'brief') { const now = list.find(x => !x.done); if (now) now.now = true; }
  return list;
}
export function getResult(s) {
  const completed = s.phase === 'debrief' && !s.stoppedEarly && !!s.watch, w = s.watch, sc = s.scenario;
  const scienceShare = w ? w.scienceHours / w.hours : 0;
  const rating = !completed ? 'none' : w.coldHours === 0 && scienceShare >= sc.ratings.greatScience ? 'great' : w.coldHours <= sc.ratings.okColdHours ? 'ok' : 'low';
  return {
    outcome: !completed ? (s.stoppedEarly ? 'stopped' : 'suit-limit') : rating === 'great' ? 'powered-great' : rating === 'ok' ? 'powered' : 'cold',
    completed, success: completed && rating !== 'low', mastered: rating === 'great',
    score: completed ? Math.round(Math.max(0, Math.min(100, 60 - w.coldHours * 1.5 + scienceShare * 30 + s.suitMinutes / sc.suitMinutes * 10))) : null,
    plan: s.plan, pad: s.cart, rating, stages: s.stages, height: +panelHeight(s).toFixed(1), sunShare: w ? Math.round(w.sunShare * 100) : 0,
    scienceHours: w?.scienceHours ?? 0, coldHours: w?.coldHours ?? 0, minBattery: w?.minBattery ?? 0, endBattery: w?.endBattery ?? 0,
    suitLeft: Math.round(s.suitMinutes), cableM: Math.round(cableNeeded(s)), savePlan: s.savePlan,
  };
}
export {serializeSnapshot, restoreSnapshot};
