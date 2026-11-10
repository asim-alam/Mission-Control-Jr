import test from 'node:test';
import assert from 'node:assert/strict';
import {createOrbit, actOrbit} from '../orbital-mission.js';
import {APPROACH_SAVE, readApproach, saveApproach, clearApproach, enterCabin} from '../missions/orbit/approach-state.js';

const store = () => {
  const data = new Map();
  return {getItem: k => data.get(k) ?? null, setItem: (k, v) => data.set(k, v), removeItem: k => data.delete(k)};
};

test('new arrivals dock before entering; active cabin saves and sampler resume inside', () => {
  assert.equal(enterCabin({}), false);
  assert.equal(enterCabin({saved: {phase: 'brief'}}), false);
  for (const opts of [{saved: {phase: 'active'}}, {saved: {phase: 'debrief'}},
    {sampler: true}, {justDocked: true}, {approach: {phase: 'docked'}}]) assert.equal(enterCabin(opts), true);
});

test('docking save resumes offsets and speed, rejects damaged data and leaves legacy progress intact', () => {
  const storage = store(), m = createOrbit();
  storage.setItem('mission-control-jr.orbit.v1', 'legacy progress');
  actOrbit(m, 'approach'); m.dock.distance = 17; m.dock.speed = .8;
  assert.equal(actOrbit(m, 'dock').ok, false);
  saveApproach(m, storage);
  assert.deepEqual(readApproach(storage).dock, m.dock);
  assert.equal(readApproach(storage).phase, 'docking');
  storage.setItem(APPROACH_SAVE, JSON.stringify({version: 1, phase: 'docking', dock: {...m.dock, distance: -5}}));
  assert.equal(readApproach(storage), null);
  saveApproach({...m, phase: 'docked'}, storage);
  assert.equal(enterCabin({approach: readApproach(storage)}), true);
  clearApproach(storage);
  assert.equal(readApproach(storage), null);
  assert.equal(storage.getItem('mission-control-jr.orbit.v1'), 'legacy progress');
});
