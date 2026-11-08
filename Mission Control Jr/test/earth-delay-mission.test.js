import test from 'node:test';
import assert from 'node:assert/strict';
import {createMission, PARTS} from '../missions/earth-delay/state.js';
import {delayScenario} from '../missions/earth-delay/scenario.js';
import inputs from '../data/normalized.json' with {type: 'json'};
import {applyAction, advanceMission, getResult, getObjective, getSteps, earthRoundTrip, knownBad, serializeSnapshot, restoreSnapshot} from '../missions/earth-delay/actions.js';
import {tuneScenario} from '../simulation/difficulty.js';

const act = (m, id, x) => { const r = applyAction(m, {id, targetId: x, payload: x}); assert.ok(r.ok, `${id} ${x ?? ''}: ${r.message}`); return r; };
const no = (m, id, x) => assert.equal(applyAction(m, {id, targetId: x, payload: x}).ok, false, `${id} should be refused`);
const start = (plan, opts = {}) => { const m = createMission(opts); act(m, 'begin'); act(m, 'choosePlan', plan); return m; };
const open = m => { act(m, 'togglePower'); act(m, 'openPanel'); };
const testAll = m => { act(m, 'takeMeter'); act(m, 'test', 'pump'); act(m, 'test', 'valve'); act(m, 'inspect', 'filter'); };
const swapBad = m => { for (const p of PARTS) if (m.findings[p] === 'bad') { act(m, 'takeSpare', p); act(m, 'swap', p); } };
const closeAndRun = m => { act(m, 'closePanel'); act(m, 'togglePower'); return act(m, 'testRun'); };

test('the message delay uses the sourced Mars–Earth light time both ways', () => {
  assert.equal(delayScenario.oneWaySeconds, inputs.marsLightTime.oneWayMinutes * 60);
  const m = start('earth');
  assert.equal(earthRoundTrip(m, false), 2 * delayScenario.oneWaySeconds + delayScenario.earthThinkSeconds);
  assert.ok(earthRoundTrip(m, true) < earthRoundTrip(m, false), 'sending meter readings shortens Earth’s thinking time');
  const faster = createMission({scenario: {...delayScenario, oneWaySeconds: 60}});
  assert.ok(earthRoundTrip(faster, false) < earthRoundTrip(m, false));
});

test('fix it yourself: test, swap only the bad parts, and it runs', () => {
  const m = start('self'); open(m); testAll(m);
  assert.deepEqual(knownBad(m).sort(), ['filter', 'pump']); // seed 42 → pump broken by a clogged filter
  swapBad(m); assert.equal(closeAndRun(m).ok, true); assert.equal(m.fixed, true);
  act(m, 'finish'); const r = getResult(m);
  assert.equal(r.fixed, true); assert.equal(r.sparesWasted, 0); assert.equal(r.rating, 'great');
});

test('ask Earth: the answer arrives after the real delay and names the broken parts', () => {
  const m = start('earth'); act(m, 'sendMessage'); act(m, 'toggleSave');
  assert.equal(m.message.status, 'outbound'); assert.match(getObjective(m), /wait for earth/i);
  advanceMission(m, (delayScenario.oneWaySeconds - 5) / delayScenario.timeScale); assert.equal(m.message.status, 'outbound');
  act(m, 'waitForEarth'); assert.equal(m.message.status, 'arrived'); act(m, 'readAnswer');
  assert.deepEqual(knownBad(m).sort(), ['filter', 'pump']);
  open(m); swapBad(m); assert.equal(closeAndRun(m).ok, true); act(m, 'finish');
  const r = getResult(m); assert.equal(r.fixed, true); assert.ok(r.minutes >= 2 * delayScenario.oneWaySeconds / 60);
});

test('plans compare: doing both keeps more water than only waiting, and save mode matters', () => {
  const both = start('both'); open(both); testAll(both); act(both, 'sendMessage'); act(both, 'toggleSave'); swapBad(both); closeAndRun(both); act(both, 'finish');
  const wait = save => { const m = start('earth'); act(m, 'sendMessage'); if (save) act(m, 'toggleSave'); act(m, 'waitForEarth'); act(m, 'readAnswer'); open(m); swapBad(m); closeAndRun(m); act(m, 'finish'); return getResult(m); };
  const saved = wait(true), unsaved = wait(false), quick = getResult(both);
  assert.ok(quick.waterLeftL > saved.waterLeftL && saved.waterLeftL > unsaved.waterLeftL, `${quick.waterLeftL} > ${saved.waterLeftL} > ${unsaved.waterLeftL}`);
  assert.notEqual(unsaved.rating, 'great');
});

test('safety interlocks and recoverable mistakes', () => {
  const m = start('self');
  no(m, 'openPanel'); act(m, 'togglePower'); no(m, 'test', 'pump'); act(m, 'openPanel');
  // Guess without testing: swap the pump only. The run shows low flow because the filter is still clogged.
  act(m, 'takeSpare', 'pump'); act(m, 'swap', 'pump');
  act(m, 'closePanel'); act(m, 'togglePower'); assert.equal(applyAction(m, {id: 'testRun'}).ok, false);
  assert.equal(m.testRuns.at(-1), 'low-flow'); assert.equal(m.fixed, false);
  // Recover: open again, look at the filter, swap it and run.
  open(m); act(m, 'inspect', 'filter'); act(m, 'takeSpare', 'filter'); act(m, 'swap', 'filter'); assert.equal(closeAndRun(m).ok, true);
});

test('a wrong guess wastes a spare and the valve spare runs out', () => {
  const m = start('self'); open(m);
  act(m, 'takeSpare', 'valve'); act(m, 'swap', 'valve'); // the valve was fine
  no(m, 'takeSpare', 'valve');
  testAll(m); swapBad(m); closeAndRun(m); act(m, 'finish');
  const r = getResult(m); assert.equal(r.sparesWasted, 1); assert.equal(r.fixed, true);
});

test('every seeded fault can be found and fixed', () => {
  for (const seed of [42, 43, 44]) {
    const m = start('self', {seed}); open(m); testAll(m); swapBad(m);
    assert.equal(closeAndRun(m).ok, true, `seed ${seed}`); assert.equal(m.variant, delayScenario.variants[seed % 3]);
  }
});

test('waiting with low water ends the try safely, and snapshots restore exactly', () => {
  const m = start('earth', {scenario: {...delayScenario, waterStartL: 4}}); act(m, 'sendMessage');
  const snap = serializeSnapshot(m); act(m, 'waitForEarth'); assert.equal(m.phase, 'debrief'); assert.equal(m.lowWater, true);
  const back = restoreSnapshot(snap); assert.equal(back.phase, 'active'); assert.equal(back.message.status, 'outbound');
  const a = start('both'); open(a); act(a, 'takeMeter'); const copy = restoreSnapshot(serializeSnapshot(a));
  advanceMission(a, 3); advanceMission(copy, 3); assert.deepEqual(copy, a);
});

test('objectives and steps guide every stage; Cadet keeps the real delay', () => {
  const m = createMission(); assert.match(getObjective(m), /broken water machine/);
  act(m, 'begin'); assert.match(getObjective(m), /repair plan/); act(m, 'choosePlan', 'both');
  assert.match(getObjective(m), /message to Earth/); act(m, 'sendMessage');
  assert.match(getObjective(m), /power lever/); open(m); assert.match(getObjective(m), /multimeter/);
  assert.ok(getSteps(m).length >= 5);
  const cadet = tuneScenario('earth-delay', delayScenario, 'cadet');
  assert.equal(cadet.oneWaySeconds, delayScenario.oneWaySeconds);
  assert.ok(cadet.waterStartL > delayScenario.waterStartL); assert.ok(cadet.earthThinkSeconds < delayScenario.earthThinkSeconds);
});
