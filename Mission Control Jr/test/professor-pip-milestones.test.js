import test from 'node:test';
import assert from 'node:assert/strict';
import {trackPipMilestones} from '../professor-pip-milestones.js';
import {createMission} from '../missions/orbit/state.js';
import {applyAction} from '../missions/orbit/actions.js';

test('Arrival teaches after touchdown, once per landing, including on a retry', () => {
  const state = createMission({seed: 42});
  applyAction(state, {id: 'begin'});
  const pip = trackPipMilestones('station', state);
  applyAction(state, {id: 'chooseSite', payload: 'pad'});
  const beforeLanding = structuredClone(state);

  assert.equal(applyAction(state, {id: 'board'}).ok, true);
  assert.equal(pip.update(state), undefined);
  assert.equal(applyAction(state, {id: 'touchdown'}).ok, true);
  assert.match(pip.update(state).title, /Touchdown/);
  assert.equal(pip.update(state), undefined);

  const savedDebrief = trackPipMilestones('station', state);
  assert.equal(savedDebrief.update(state), undefined);
  pip.reset(beforeLanding);
  applyAction(beforeLanding, {id: 'board'});
  applyAction(beforeLanding, {id: 'touchdown'});
  assert.match(pip.update(beforeLanding).title, /Touchdown/);
});

test('Stopping practice does not trigger the recycler completion lesson', () => {
  const state = {phase: 'active', fixed: true};
  const pip = trackPipMilestones('earth-delay', state);
  assert.equal(pip.update({...state, phase: 'debrief', stoppedEarly: true}), undefined);
  assert.equal(pip.update({...state, phase: 'debrief'}).title, 'Clean water is flowing');
});
