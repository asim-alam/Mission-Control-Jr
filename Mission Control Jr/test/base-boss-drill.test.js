import test from 'node:test';
import assert from 'node:assert/strict';
import {drillOutcome, newDrill, replyMinute, solarForTurn, stages, tryPlan} from '../missions/base-boss/outpost-drill.js';

test('the dust forecast loses solar output and Earth cannot reply in the first two shifts', () => {
  assert.deepEqual(stages.map((_, i) => solarForTurn(i)), [5, 3, 0]);
  assert.ok(replyMinute > 20 && replyMinute < 30);
});

test('shielding water is reserved until the alert clears and buys lower exposure', () => {
  const start = tryPlan(newDrill(), 'reserve');
  const core = tryPlan(start, 'core');
  const wall = tryPlan(start, 'water-wall');
  assert.equal(wall.shieldWater, 2);
  assert.equal(core.shieldWater, 0);
  assert.ok(wall.exposure > 0 && wall.exposure < core.exposure);
  assert.equal(tryPlan(wall, 'local').shieldWater, 0);
  assert.equal(tryPlan({...start, water: 1}, 'water-wall'), null);
});

test('the same outpost can yield a ready harvest, a delayed harvest, or emergency recovery', () => {
  const run = decisions => decisions.reduce((state, decision) => tryPlan(state, decision), newDrill());
  assert.match(drillOutcome(run(['both', 'water-wall', 'local'])).title, /harvest ready/);
  assert.match(drillOutcome(run(['reserve', 'core', 'local'])).title, /harvest delayed/);
  assert.equal(drillOutcome(run(['grow', 'water-wall', 'wait'])).title, 'Recovery needed');
  const original = newDrill();
  const preview = tryPlan(original, 'both');
  assert.equal(original.history.length, 0);
  assert.equal(original.battery, 3);
  assert.equal(preview.battery, 2);
});
