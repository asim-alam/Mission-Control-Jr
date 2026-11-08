import test from 'node:test';
import assert from 'node:assert/strict';
import inputs from '../data/normalized.json' with {type: 'json'};
import {createMission} from '../missions/lunar-relay/state.js';
import {lunarRelayScenario} from '../missions/lunar-relay/scenario.js';
import {applyAction, getObjective, getSteps, getResult, directLink, relayHops, hasLink, batteryHome, serializeSnapshot, restoreSnapshot} from '../missions/lunar-relay/actions.js';
import {tuneScenario} from '../simulation/difficulty.js';

const act = (m, id, payload) => { const r = applyAction(m, {id, payload}); assert.ok(r.ok, `${id}: ${r.message}`); return r; };
const no = (m, id, payload) => assert.equal(applyAction(m, {id, payload}).ok, false, `${id} should be refused`);
const run = (m, steps) => { for (const [id, x] of steps) act(m, id, x); return m; };
const setUpRelay = [['takeRelay'], ['stowRelay'], ['drive', 'saddle'], ['takeRelay'], ['placeRelay'], ['relayLegs'], ['raiseStage'], ['raiseStage'], ['aim']];
const drillOne = [['takeDrill'], ['placeDrill', 'a'], ['drillCore'], ['takeCore'], ['stowCore'], ['sendData']];
const home = [['takeDrill'], ['packDrill'], ['drive', 'saddle'], ['drive', 'base'], ['finish']];
const start = plan => { const m = createMission(); act(m, 'begin'); act(m, 'choosePlan', plan); return m; };

test('the light time is the sourced Horizons value; the made-up parts are labelled', () => {
  assert.equal(lunarRelayScenario.oneWaySeconds, +(inputs.moonLightTime.oneWayMinutes * 60).toFixed(2));
  assert.ok(lunarRelayScenario.oneWaySeconds > 1.2 && lunarRelayScenario.oneWaySeconds < 1.45);
  assert.match(lunarRelayScenario.limitation, /made up/);
});

test('the ridge blocks Shadow Hollow; the base can see the ridge top', () => {
  const m = createMission();
  assert.equal(directLink(m, 'hollow'), false); assert.equal(directLink(m, 'saddle'), true); assert.equal(directLink(m, 'base'), true);
});

test('the relay needs legs, enough height and an aimed dish for both hops', () => {
  const m = start('relay'); run(m, setUpRelay.slice(0, 6));
  assert.deepEqual(relayHops(m, 'hollow'), {base: false, field: false});
  act(m, 'raiseStage'); assert.equal(relayHops(m, 'hollow').field, false, 'one stage is too short to see into the hollow');
  act(m, 'raiseStage'); assert.equal(relayHops(m, 'hollow').field, true); assert.equal(relayHops(m, 'hollow').base, false, 'dish not aimed yet');
  act(m, 'aim'); assert.equal(hasLink(m, 'hollow'), true);
  // A relay set down in the hollow can never reach the base.
  const h = start('relay'); run(h, [['takeRelay'], ['stowRelay'], ['drive', 'saddle'], ['drive', 'hollow'], ['takeRelay'], ['placeRelay'], ['relayLegs'], ['raiseStage'], ['raiseStage'], ['raiseStage'], ['aim']]);
  assert.equal(relayHops(h, 'hollow').base, false);
});

test('two defensible strategies: relay for live science, or a quick trip with more reserves', () => {
  const quick = getResult(run(start('direct'), [['drive', 'saddle'], ['drive', 'hollow'], ...drillOne, ...home]));
  const relay = run(start('relay'), [...setUpRelay, ['drive', 'hollow'], ...drillOne]);
  assert.equal(relay.earthAsked, true, 'Earth asks for a second core when it hears you live');
  run(relay, [['takeDrill'], ['placeDrill', 'b'], ['drillCore'], ['takeCore'], ['stowCore'], ['sendData'], ...home]);
  const r = getResult(relay);
  assert.equal(quick.rating, 'great'); assert.equal(r.rating, 'great');
  assert.equal(quick.cores, 1); assert.equal(r.cores, 2); assert.equal(r.live, 2); assert.equal(quick.live, 0);
  assert.equal(quick.delivered, 1, 'quick-trip data arrives once you are back in view');
  assert.ok(quick.quietMinutes > 15); assert.equal(r.quietMinutes, 0);
  assert.ok(quick.battery > r.battery); assert.ok(quick.suitLeft > r.suitLeft);
});

test('data sent behind the hill waits, survives a save, and leaves at the ridge top', () => {
  const m = run(start('direct'), [['drive', 'saddle'], ['drive', 'hollow'], ...drillOne]);
  assert.equal(m.messages[0].status, 'queued'); assert.equal(m.earthAsked, false); no(m, 'placeDrill', 'b');
  const copy = restoreSnapshot(serializeSnapshot(m)); assert.deepEqual(copy, m);
  run(copy, [['takeDrill'], ['packDrill'], ['drive', 'saddle']]);
  assert.equal(copy.messages[0].status, 'delivered'); assert.equal(copy.messages[0].live, false);
});

test('battery is a real cost: running flat brings a slow rescue, and mistakes can be undone', () => {
  const m = start('direct'); no(m, 'drive', 'hollow'); no(m, 'takeDrill');
  for (let i = 0; i < 3; i++) { act(m, 'drive', i ? 'saddle' : 'saddle'); act(m, 'drive', 'hollow'); }
  assert.ok(m.battery < batteryHome(m));
  act(m, 'drive', 'saddle'); act(m, 'drive', 'base');
  assert.equal(m.rescued, true); act(m, 'finish'); assert.equal(getResult(m).rating, 'low');
  // Undo: pick the relay back up after setting it down.
  const u = start('relay'); run(u, [['takeRelay'], ['stowRelay'], ['drive', 'saddle'], ['takeRelay'], ['placeRelay'], ['relayLegs'], ['raiseStage']]);
  no(u, 'takeRelay'); no(u, 'relayLegs'); act(u, 'lowerStage'); act(u, 'relayLegs'); act(u, 'takeRelay'); act(u, 'stowRelay');
  assert.equal(u.relay, 'rover');
});

test('interlocks: hands full, drill packed, home to finish', () => {
  const m = start('relay'); act(m, 'takeRelay'); no(m, 'drive', 'saddle'); no(m, 'finish'); act(m, 'stowRelay');
  run(m, [['drive', 'saddle'], ['drive', 'hollow'], ['takeDrill'], ['placeDrill', 'a']]); no(m, 'drive', 'saddle'); no(m, 'finish');
  act(m, 'drillCore'); no(m, 'drillCore'); no(m, 'takeDrill'); act(m, 'takeCore'); act(m, 'stowCore');
});

test('objectives follow the job, and Cadet is gentler without moving the hill', () => {
  const m = createMission(); assert.equal(getObjective(m), 'Welcome to Horizon Base'); act(m, 'begin');
  assert.equal(getObjective(m), 'Pick a plan for the trip'); act(m, 'choosePlan', 'relay');
  assert.equal(getObjective(m), 'Pick up the radio relay by its handle'); act(m, 'takeRelay');
  assert.equal(getObjective(m), 'Put the relay on the rover’s cargo deck'); act(m, 'stowRelay');
  assert.equal(getObjective(m), 'Get in the rover and drive to the ridge top'); act(m, 'drive', 'saddle');
  assert.equal(getObjective(m), 'Lift the relay off the rover');
  assert.equal(getSteps(m).find(s => s.now).text, 'Set up the relay on the ridge');
  const cadet = tuneScenario('lunar-relay', lunarRelayScenario, 'cadet');
  assert.ok(cadet.suitMinutes > lunarRelayScenario.suitMinutes); assert.ok(cadet.batteryStart > lunarRelayScenario.batteryStart);
  assert.deepEqual(cadet.stops, lunarRelayScenario.stops); assert.equal(cadet.oneWaySeconds, lunarRelayScenario.oneWaySeconds);
});
