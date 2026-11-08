import test from 'node:test';
import assert from 'node:assert/strict';
import {createMission} from '../missions/greenhouse/state.js';
import {applyAction, getResult, getObjective, getSteps, serializeSnapshot, restoreSnapshot, batteryNeeded} from '../missions/greenhouse/actions.js';
import {greenhouseScenario} from '../missions/greenhouse/scenario.js';
import {tuneScenario} from '../simulation/difficulty.js';

const explorer = () => createMission({scenario: tuneScenario('greenhouse', greenhouseScenario, 'explorer')});
const act = (m, id, targetId, payload) => { const r = applyAction(m, {id, targetId, payload}); return r; };
const must = (m, id, targetId, payload) => { const r = act(m, id, targetId, payload); assert.ok(r.ok, `${id} ${targetId ?? ''}: ${r.message}`); return r; };
function start(plan) { const m = explorer(); must(m, 'begin'); must(m, 'choosePlan', null, plan); return m; }
function fixLeak(m) { must(m, 'toggleIsolation'); must(m, 'removeHose'); must(m, 'takeSpare'); must(m, 'fitHose'); must(m, 'toggleIsolation'); }
function day(m, lights, water = Object.keys(lights)) {
  for (const [bed, light] of Object.entries(lights)) must(m, 'setLight', bed, light);
  for (const bed of water) must(m, 'water', bed);
  return act(m, 'endDay');
}
function harvestAndServe(m) { must(m, 'takeBasket'); for (const bed of ['a', 'b', 'c']) act(m, 'harvest', bed); must(m, 'serve'); return getResult(m); }

test('salad plan: lettuce + mizuna on full light serves the salad and keeps the battery', () => {
  const m = start('salad');
  assert.ok(day(m, {a: 'full', b: 'full'}).ok);
  assert.equal(m.leak, 'leaking'); fixLeak(m);
  assert.ok(day(m, {a: 'full', b: 'full'}).ok);
  const r = harvestAndServe(m);
  assert.equal(r.rating, 'salad'); assert.ok(r.saladPortions >= greenhouseScenario.saladGoal); assert.equal(r.peppers, false);
  assert.equal(r.batteryLeftKWh, greenhouseScenario.batteryKWh); assert.equal(r.leakFixed, true); assert.equal(r.completed, true);
});

test('feast plan: borrowing battery grows peppers too, but the battery cannot cover everything', () => {
  const m = start('feast');
  assert.ok(day(m, {a: 'full', b: 'full', c: 'full'}).ok);
  fixLeak(m);
  for (const bed of ['a', 'b', 'c']) must(m, 'water', bed);
  const tooMuch = act(m, 'endDay'); // a second full day of three beds needs more than the battery has left
  assert.equal(tooMuch.ok, false); assert.match(tooMuch.message, /Too much light/); assert.equal(getObjective(m), 'Too much light! Turn a light down');
  must(m, 'setLight', 'c', 'half'); assert.ok(batteryNeeded(m) <= m.batteryKWh + 1e-9); must(m, 'endDay');
  const r = harvestAndServe(m);
  assert.equal(r.rating, 'feast'); assert.equal(r.peppers, true); assert.ok(r.batteryLeftKWh < .2); assert.equal(r.mastered, true);
});

test('the leak is a recoverable mistake: an unfixed leak wastes water, a closed valve blocks the night', () => {
  const m = start('salad');
  day(m, {a: 'full', b: 'full'});
  const trickle = must(m, 'water', 'a'); assert.match(trickle.message, /trickle/);
  assert.equal(act(m, 'fitHose').ok, false);
  must(m, 'toggleIsolation'); assert.equal(m.leak, 'isolated');
  assert.equal(act(m, 'endDay').ok, false, 'cannot end the day with the water shut off');
  assert.equal(act(m, 'water', 'b').ok, false);
  must(m, 'removeHose'); assert.equal(act(m, 'toggleIsolation').ok, false, 'cannot open the valve with no hose');
  must(m, 'takeSpare'); must(m, 'fitHose'); must(m, 'toggleIsolation'); assert.equal(m.leak, 'fixed');

  const leaky = start('salad'); day(leaky, {a: 'full', b: 'full'});
  assert.equal(leaky.leakedL, 0, 'nothing drains until a night passes');
  assert.ok(day(leaky, {a: 'full', b: 'full'}, ['a', 'a', 'b', 'b']).ok);
  const r = harvestAndServe(leaky); assert.ok(r.leakedL > 0); assert.equal(r.leakFixed, false);
});

test('water matters: no water or too much water both leave a smaller, droopier harvest', () => {
  const dry = start('salad'); day(dry, {a: 'full', b: 'full'}, []); fixLeak(dry); day(dry, {a: 'full', b: 'full'}, []);
  const wet = start('salad'); day(wet, {a: 'full', b: 'full'}, ['a', 'a', 'a', 'b', 'b', 'b']); fixLeak(wet); day(wet, {a: 'full', b: 'full'}, ['a', 'a', 'b', 'b']);
  for (const m of [dry, wet]) { const r = harvestAndServe(m); assert.ok(r.health < 90, `health ${r.health}`); assert.notEqual(r.rating, 'feast'); }
});

test('three plans are each defensible and compare on different numbers', () => {
  const salad = start('salad'); day(salad, {a: 'full', b: 'full'}); fixLeak(salad); day(salad, {a: 'full', b: 'full'});
  const even = start('even'); day(even, {a: 'full', b: 'half', c: 'half'}); fixLeak(even); for (const b of ['a', 'b', 'c']) must(even, 'water', b); must(even, 'setLight', 'b', 'full'); must(even, 'setLight', 'c', 'full'); must(even, 'endDay');
  const rs = harvestAndServe(salad), re = harvestAndServe(even);
  assert.ok(rs.batteryLeftKWh > re.batteryLeftKWh, 'salad saves battery');
  assert.ok(re.peppers || re.portions >= rs.portions, 'sharing gives something extra');
});

test('snapshots restore a checkpoint for "try a different plan"', () => {
  const m = explorer(); must(m, 'begin'); const snap = serializeSnapshot(m);
  must(m, 'choosePlan', null, 'salad'); day(m, {a: 'full', b: 'full'});
  const back = restoreSnapshot(snap); assert.equal(back.plan, null); assert.equal(back.day, 1); assert.equal(back.phase, 'active');
  assert.ok(applyAction(back, {id: 'choosePlan', payload: 'feast'}).ok);
});

test('steps and objectives follow the mission and Cadet tuning is gentler', () => {
  const m = start('salad');
  assert.equal(getSteps(m).find(s => s.now).text, 'Day 1: lights + water');
  assert.equal(getObjective(m), 'Day 1: set the lights, water, then end the day');
  must(m, 'setLight', 'a', 'full'); m.beds.a.moisture = .5; assert.equal(getObjective(m), 'Day 1: water the dry beds');
  const cadet = tuneScenario('greenhouse', greenhouseScenario, 'cadet');
  assert.ok(cadet.batteryKWh > greenhouseScenario.batteryKWh); assert.ok(cadet.leakLPerDay < greenhouseScenario.leakLPerDay);
  assert.ok(cadet.moistureBand[1] - cadet.moistureBand[0] > greenhouseScenario.moistureBand[1] - greenhouseScenario.moistureBand[0]);
});
