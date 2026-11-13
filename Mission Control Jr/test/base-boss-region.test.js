import test from 'node:test';
import assert from 'node:assert/strict';
import {sites, quests, planRoute} from '../missions/base-boss/region.js';
import {driveAssisted, driveManual} from '../missions/base-boss/driving.js';
import {doQuest, newExpedition, pingEarth, lightTime, save, restore} from '../missions/base-boss/progress.js';

function travel(state, destination, priority = 'fast') {
  const plan = planRoute(state, destination, priority);
  const trip = {points: plan.points, index: 1};
  const before = state.minutes;
  for (let tick = 0; tick < 2200; tick++) {
    const result = driveAssisted(state, trip, 1 / 30);
    assert.equal(result.stopped, undefined);
    if (!result.done) continue;
    assert.ok(Math.hypot(state.x - sites[destination].x, state.z - sites[destination].z) < .001);
    assert.ok(Math.abs(state.minutes - before - plan.minutes) < .001);
    return;
  }
  assert.fail(`The rover did not reach ${destination}`);
}

test('each regional stop is reachable from every other stop via the surveyed tracks', () => {
  for (const [id, site] of Object.entries(sites)) {
    for (const destination of Object.keys(sites)) {
      if (destination === id) continue;
      for (const priority of ['fast', 'eco']) {
        travel({...newExpedition(), x: site.x, z: site.z}, destination, priority);
      }
    }
  }
});

test('Verdant route priorities trade rough ground for time and unlock the harvest at different times', () => {
  const outcomes = {};
  const plans = {};
  for (const priority of ['fast', 'eco']) {
    const state = newExpedition();
    assert.equal(doQuest(state, 'valve', 'meridian'), 'accept');
    assert.equal(doQuest(state, 'valve', 'verdant'), null);
    travel(state, 'cache');
    assert.equal(doQuest(state, 'valve', 'cache'), 'pickup');
    plans[priority] = planRoute(state, 'verdant', priority);
    travel(state, 'verdant', priority);
    assert.equal(doQuest(state, 'valve', 'verdant'), 'deliver');
    assert.equal(doQuest(state, 'valve', 'verdant'), null);
    outcomes[priority] = state;
  }
  assert.ok(plans.fast.terrain > plans.eco.terrain);
  assert.ok(plans.fast.minutes < plans.eco.minutes);
  assert.match(outcomes.fast.completed.valve, /harvest is ready/);
  assert.match(outcomes.eco.completed.valve, /6 more mission minutes/);
  assert.equal(doQuest(outcomes.eco, 'food', 'verdant'), null);
  outcomes.eco.minutes += 6.01;
  assert.equal(doQuest(outcomes.eco, 'food', 'verdant'), 'accept');
});

test('the four other jobs check custody and the Earth message uses archived two-way light time', () => {
  const state = newExpedition();
  assert.equal(pingEarth(state), false);
  state.completed.valve = 'Water is flowing.';
  for (const id of ['relay', 'sample', 'food', 'shelter']) {
    const quest = quests[id];
    assert.equal(doQuest(state, id, quest.from), 'accept');
    assert.equal(doQuest(state, id, quest.to), null);
    assert.equal(doQuest(state, id, quest.pickup), 'pickup');
    assert.equal(doQuest(state, id, quest.pickup), null);
    assert.equal(doQuest(state, id, quest.to), 'deliver');
    assert.equal(state.cargo, false);
  }
  assert.equal(pingEarth(state), true);
  assert.equal(state.radioAt, state.minutes + lightTime * 2);
  assert.equal(pingEarth(state), false);
});

test('manual driving advances time and older saved cargo resumes without another pickup', () => {
  const state = newExpedition();
  const motion = {speed: 0};
  for (let tick = 0; tick < 45; tick++) {
    driveManual(state, motion, {throttle: -1, steer: 0, brake: false}, 1 / 30);
  }
  assert.ok(state.minutes > 0);
  state.active = 'valve';
  state.cargo = true;
  let snapshot;
  const storage = {setItem: (_, value) => { snapshot = value; }, getItem: () => snapshot};
  assert.equal(save(state, storage), true);
  snapshot = JSON.stringify({...JSON.parse(snapshot), power: 78});
  const reloaded = restore(storage);
  assert.deepEqual(reloaded, state);
  assert.equal(doQuest(reloaded, 'valve', 'cache'), null);
});
