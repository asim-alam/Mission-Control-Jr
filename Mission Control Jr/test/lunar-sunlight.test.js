import test from 'node:test';
import assert from 'node:assert/strict';
import inputs from '../data/normalized.json' with {type: 'json'};
import {createMission} from '../missions/lunar-sunlight/state.js';
import {lunarSunScenario} from '../missions/lunar-sunlight/scenario.js';
import {applyAction, getObjective, getSteps, getResult, sunShare, panelHeight, cableNeeded, serializeSnapshot, restoreSnapshot} from '../missions/lunar-sunlight/actions.js';
import {tuneScenario} from '../simulation/difficulty.js';
import {sunlit, SITE} from '../missions/shared/moon-ground.js';

const act = (m, id, payload) => { const r = applyAction(m, {id, payload}); assert.ok(r.ok, `${id}: ${r.message}`); return r; };
const no = (m, id, payload) => assert.equal(applyAction(m, {id, payload}).ok, false, `${id} should be refused`);

/** Play a whole attempt: pad, number of mast stages, power plan. */
function play(pad, stages, plan = 'science', scenario = lunarSunScenario) {
  const m = createMission({scenario});
  act(m, 'begin'); act(m, 'choosePlan', pad); act(m, 'hitch'); act(m, 'arrive', pad); act(m, 'deployLegs');
  for (let i = 0; i < stages; i++) act(m, 'raiseStage');
  act(m, 'openWings'); act(m, 'takePlug'); act(m, 'plugIn'); act(m, 'tracker'); act(m, 'powerPlan', plan); act(m, 'watch');
  return m;
}

test('sourced numbers come from the LOLA data file; the made-up parts are labelled', () => {
  const patches = Object.fromEntries(inputs.lunarIllumination.patches.map(p => [p.id, p.meanFraction]));
  assert.equal(lunarSunScenario.lola.near, patches['nearby-patch']);
  assert.equal(lunarSunScenario.lola.ridge, patches['ridge-patch']);
  assert.ok(lunarSunScenario.lola.ridge > lunarSunScenario.lola.near);
  assert.match(lunarSunScenario.limitation, /made up/);
});

test('the terrain makes the ridge sunnier than the near pad, and height helps the near pad', () => {
  const m = createMission(); act(m, 'begin');
  const low = sunShare(m, 'near', 2.4), tall = sunShare(m, 'near', 2.4 + 1.8 * 3), ridge = sunShare(m, 'ridge', 2.4);
  assert.ok(ridge > low + .1, `ridge ${ridge} vs near ${low}`);
  assert.ok(tall > low + .15, `tall mast ${tall} vs short ${low}`);
  // The far horizon blocks the Sun when it is lower than the mountains.
  assert.equal(sunlit(SITE.pads.ridge.x, SITE.pads.ridge.z, 3, 205, 1.5), false);
});

test('two defensible strategies: a tall mast near home, or the sunny ridge', () => {
  const near = getResult(play('near', 3)), ridge = getResult(play('ridge', 1));
  assert.equal(near.rating, 'great'); assert.equal(ridge.rating, 'great');
  assert.ok(near.suitLeft !== ridge.suitLeft); assert.ok(ridge.cableM > near.cableM);
  assert.ok(near.height > ridge.height);
});

test('a short mast on the near pad gets cold with science on, and the save plan fixes it', () => {
  const sci = getResult(play('near', 1, 'science')), save = getResult(play('near', 1, 'save'));
  assert.ok(sci.coldHours > 0); assert.ok(save.coldHours < sci.coldHours); assert.ok(save.scienceHours < sci.scienceHours);
  assert.equal(sci.success, sci.rating !== 'low');
});

test('interlocks: legs before mast, mast before wings, plug before tracker; mistakes can be undone', () => {
  const m = createMission(); act(m, 'begin'); no(m, 'hitch'); act(m, 'choosePlan', 'near');
  no(m, 'deployLegs'); act(m, 'hitch'); act(m, 'arrive', 'near'); no(m, 'raiseStage'); act(m, 'deployLegs');
  no(m, 'openWings'); act(m, 'raiseStage'); act(m, 'openWings'); no(m, 'raiseStage'); no(m, 'tracker');
  act(m, 'foldWings'); act(m, 'raiseStage'); act(m, 'openWings');
  act(m, 'takePlug'); act(m, 'putPlugBack'); act(m, 'takePlug'); act(m, 'plugIn'); no(m, 'liftLegs');
  // Change your mind: pack up and move to the ridge.
  act(m, 'unplug'); act(m, 'foldWings'); act(m, 'lowerStage'); act(m, 'lowerStage'); act(m, 'liftLegs'); act(m, 'hitch'); act(m, 'arrive', 'ridge'); act(m, 'deployLegs');
  assert.equal(m.cart, 'ridge'); assert.equal(m.stages, 0); assert.equal(m.plug, 'reel');
  no(m, 'watch');
});

test('suit air is a real cost and can run out', () => {
  const m = createMission(); act(m, 'begin'); act(m, 'choosePlan', 'ridge');
  const steps = trips => [['hitch'], ['arrive', trips % 2 ? 'ridge' : 'near'], ['deployLegs'], ['liftLegs']];
  for (let trips = 0; m.phase === 'active' && trips < 20; trips++) for (const [id, x] of steps(trips)) if (m.phase === 'active') act(m, id, x);
  assert.equal(m.phase, 'debrief'); assert.equal(getResult(m).completed, false); assert.equal(getResult(m).outcome, 'suit-limit');
});

test('cable length is measured from the pad to the base power port and fits the reel', () => {
  const m = createMission();
  for (const pad of ['near', 'ridge']) assert.ok(cableNeeded(m, pad) < m.scenario.cableM);
  assert.ok(cableNeeded(m, 'ridge') > cableNeeded(m, 'near') * 1.8);
});

test('snapshots restore mid-mission exactly', () => {
  const m = createMission(); act(m, 'begin'); act(m, 'choosePlan', 'near'); act(m, 'hitch'); act(m, 'arrive', 'near'); act(m, 'deployLegs'); act(m, 'raiseStage');
  const copy = restoreSnapshot(serializeSnapshot(m)); assert.deepEqual(copy, m);
  act(m, 'openWings'); act(copy, 'openWings'); assert.deepEqual(copy, m); assert.equal(panelHeight(copy), 4.2);
});

test('objectives and steps follow the job, and Cadet is gentler without changing the Sun', () => {
  const m = createMission(); assert.equal(getObjective(m), 'Welcome to Horizon Base'); act(m, 'begin');
  assert.equal(getObjective(m), 'Pick a pad for the solar mast'); act(m, 'choosePlan', 'near');
  assert.equal(getObjective(m), 'Hitch the solar cart: grab its handle'); act(m, 'hitch');
  assert.equal(getObjective(m), 'Tow the cart to the Near pad'); act(m, 'arrive', 'near');
  assert.equal(getObjective(m), 'Put the cart’s legs down at the Near pad');
  assert.equal(getSteps(m).find(s => s.now).text, 'Legs down + raise the mast');
  const cadet = tuneScenario('lunar-sunlight', lunarSunScenario, 'cadet');
  assert.ok(cadet.suitMinutes > lunarSunScenario.suitMinutes); assert.deepEqual(cadet.window, lunarSunScenario.window); assert.deepEqual(cadet.pads, lunarSunScenario.pads);
  const easy = getResult(play('near', 1, 'science', cadet)), hard = getResult(play('near', 1, 'science'));
  assert.ok(easy.coldHours <= hard.coldHours);
  const w = play('near', 2); assert.equal(getObjective(w), 'See how your plan worked'); assert.equal(getResult(w).completed, true);
});
