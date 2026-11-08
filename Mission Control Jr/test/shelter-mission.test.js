import test from 'node:test';
import assert from 'node:assert/strict';
import {createMission, CREW, SLOT_IDS} from '../missions/solar-shelter/state.js';
import {applyAction, advanceSim, getResult, getObjective, getSteps, shelterTransmission, stormStrength, serializeSnapshot, restoreSnapshot} from '../missions/solar-shelter/actions.js';
import {shelterScenario} from '../missions/solar-shelter/scenario.js';

const ok = (m, action) => { const r = applyAction(m, action); assert.ok(r.ok, r.message); return r; };
function start(plan = 'roof') { const m = createMission(); ok(m, {id: 'begin'}); ok(m, {id: 'choosePlan', payload: plan}); return m; }
function build(m, pairs) { for (const [item, slot] of pairs) { ok(m, {id: 'pickUp', targetId: item}); ok(m, {id: 'place', targetId: slot}); } }
function ride(m) { for (const c of CREW) if (m.crew[c].at === 'work') ok(m, {id: 'callCrew', targetId: c}); m.playerInShelter = true; advanceSim(m, 200, {playerInShelter: true}); ok(m, {id: 'skipAhead'}); ok(m, {id: 'finish'}); return getResult(m); }
const WATER_FORT = [['poly-1', 'roof_1'], ['poly-2', 'roof_2'], ...SLOT_IDS.slice(0, 6).map((s, i) => [`water-${i + 1}`, s])];
const FAST = [['cargo-1', 'roof_1'], ['cargo-2', 'roof_2'], ['cargo-3', 'back_1'], ['cargo-4', 'back_2'], ['poly-1', 'left_1'], ['poly-2', 'left_2']];

test('three plans give different, defensible results', () => {
  const fort = ride((m => (build(m, WATER_FORT), m))(start('water')));
  const fast = ride((m => (build(m, FAST), m))(start('fast')));
  const roof = ride((m => (build(m, [['water-1', 'roof_1'], ['water-2', 'roof_2'], ['cargo-1', 'back_1'], ['cargo-2', 'back_2'], ['cargo-3', 'left_1'], ['cargo-4', 'left_2'], ['poly-1', 'right_1'], ['poly-2', 'right_2']]), m))(start('roof')));
  assert.equal(fort.rating, 'great'); assert.equal(roof.rating, 'great'); assert.equal(fast.rating, 'ok');
  assert.ok(fort.teamDose < roof.teamDose && roof.teamDose < fast.teamDose);
  assert.ok(fort.completed && fast.completed && fast.success && !fast.mastered && fort.mastered);
  assert.equal(fort.water, 6); assert.equal(fast.cargo, 4);
});

test('roof spots count double because Mars blocks particles from below', () => {
  const roof = start(), walls = start();
  build(roof, [['water-1', 'roof_1'], ['water-2', 'roof_2']]); build(walls, [['water-1', 'back_1'], ['water-2', 'back_2']]);
  assert.ok(shelterTransmission(roof) < shelterTransmission(walls));
});

test('shielding never blocks everything, and an empty shelter is no better than the habitat', () => {
  const m = start(); assert.equal(shelterTransmission(m), shelterScenario.habTransmission);
  build(m, WATER_FORT); assert.ok(shelterTransmission(m) > 0);
});

test('mistakes are recoverable: shields can be taken out and moved, bags are never duplicated', () => {
  const m = start(); build(m, [['water-1', 'back_1']]);
  assert.equal(applyAction(m, {id: 'place', targetId: 'back_2'}).ok, false);
  ok(m, {id: 'pickUp', targetId: 'water-1'}); assert.equal(m.slots.back_1, null); assert.equal(applyAction(m, {id: 'pickUp', targetId: 'water-2'}).ok, false);
  ok(m, {id: 'place', targetId: 'roof_1'}); assert.equal(m.slots.roof_1, 'water-1'); assert.equal(m.removals, 1);
  assert.equal(Object.values(m.slots).filter(Boolean).length, 1);
  ok(m, {id: 'pickUp', targetId: 'cargo-1'}); ok(m, {id: 'putBack'}); assert.equal(m.items.find(i => i.id === 'cargo-1').at, 'store');
});

test('crew left outside when the storm arrives get more dose; the arrival snapshot is recorded', () => {
  const early = start(), late = start();
  for (const m of [early, late]) build(m, WATER_FORT);
  for (const c of CREW) ok(early, {id: 'callCrew', targetId: c});
  advanceSim(late, shelterScenario.warningSeconds + 900, {playerInShelter: true});
  assert.equal(late.stage, 'storm'); assert.equal(late.atArrival.crewSafe, 0);
  const lateResult = ride(late), earlyResult = ride(early);
  assert.ok(lateResult.teamDose > earlyResult.teamDose + 10);
  assert.equal(lateResult.crewSafeAtArrival, 0); assert.equal(earlyResult.crewSafeAtArrival, 4);
});

test('storm strength rises, holds, fades; skip needs everyone inside; finish waits for all clear', () => {
  const m = start();
  assert.equal(stormStrength(m, 0), 0); assert.equal(stormStrength(m, shelterScenario.warningSeconds + 1800), 1);
  assert.ok(stormStrength(m, shelterScenario.warningSeconds + 3500) < .3);
  assert.equal(applyAction(m, {id: 'skipAhead'}).ok, false); assert.equal(applyAction(m, {id: 'finish'}).ok, false);
});

test('save snapshots round-trip with the v2 schema; objectives and steps follow progress', () => {
  const m = start(); build(m, [['poly-1', 'roof_1']]); ok(m, {id: 'pickUp', targetId: 'water-1'});
  const copy = restoreSnapshot(serializeSnapshot(m)); assert.deepEqual(copy, m); assert.equal(copy.schema, 2);
  assert.match(getObjective(copy), /water wall/); assert.equal(getSteps(copy).find(s => s.now).text, 'Cover the roof · 1/2');
  ok(copy, {id: 'stopEarly'}); const r = getResult(copy); assert.equal(r.outcome, 'stopped'); assert.equal(r.completed, false); assert.equal(r.score, null);
});
