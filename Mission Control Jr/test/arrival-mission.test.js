import test from 'node:test';
import assert from 'node:assert/strict';
import {createMission, ORBIT_SCHEMA, FAULTS} from '../missions/orbit/state.js';
import {applyAction, getResult, getObjective, powerUsed, powerAvailable, inShadow, nextPass, computeLanding, testLights, serializeSnapshot, restoreSnapshot} from '../missions/orbit/actions.js';
import {arrivalScenario} from '../missions/orbit/scenario.js';

const ok = (m, a) => { const r = applyAction(m, a); assert.ok(r.ok, `${a.id}: ${r.message}`); return r; };
const seedFor = fault => FAULTS.indexOf(fault);
const start = (fault = 'feed', scenario = arrivalScenario) => { const m = createMission({seed: seedFor(fault), scenario}); ok(m, {id: 'begin'}); return m; };
const off = (m, ...loads) => loads.forEach(l => m.loads[l] && ok(m, {id: 'toggleLoad', targetId: l}));
const on = (m, ...loads) => loads.forEach(l => !m.loads[l] && ok(m, {id: 'toggleLoad', targetId: l}));
/** The careful path: tester, switch off the right load, fix, test. */
function repair(m) {
  on(m, 'motor'); ok(m, {id: 'take', payload: 'tester'}); ok(m, {id: 'clipTester'}); ok(m, {id: 'testSignal'});
  assert.equal(m.diagnosed, m.fault);
  const part = m.scenario.parts[m.fault];
  if (m.fault === 'amp') ok(m, {id: 'take', payload: 'amp'});
  off(m, part.load); ok(m, {id: 'fixPart', targetId: m.fault}); on(m, ...m.scenario.testNeeds); ok(m, {id: 'testSignal'});
  assert.equal(m.comms, true);
}
const land = (m, site) => { ok(m, {id: 'chooseSite', payload: site}); ok(m, {id: 'board'}); ok(m, {id: 'touchdown'}); return getResult(m); };

test('each of the three faults can be found with the tester and fixed', () => {
  for (const fault of FAULTS) { const m = start(fault); repair(m); assert.deepEqual(Object.values(testLights(m)), ['green', 'green', 'green', 'green']); }
});

test('the power bus has a limit; going over trips the breaker and a reset recovers', () => {
  const m = start(); assert.equal(powerUsed(m), 9); assert.equal(powerAvailable(m), 10);
  on(m, 'motor'); assert.equal(powerUsed(m), 10);
  const r = ok(m, {id: 'toggleLoad', targetId: 'charger'}); assert.match(r.message, /13 units/);
  assert.equal(m.tripped, true); assert.equal(powerUsed(m), 3, 'only life support stays on');
  assert.equal(applyAction(m, {id: 'toggleLoad', targetId: 'radio'}).ok, false, 'cannot switch on while tripped');
  assert.match(getObjective(m), /breaker tripped/);
  ok(m, {id: 'resetBreaker'}); on(m, 'radio', 'amp', 'motor'); assert.equal(m.tripped, false);
  assert.equal(applyAction(m, {id: 'toggleLoad', targetId: 'life'}).ok, false, 'life support stays on');
});

test('touching a powered part zaps and trips the breaker (no damage); turning it off first is safe', () => {
  const m = start('card'); on(m, 'motor'); ok(m, {id: 'testSignal'});
  assert.equal(m.lastTest, 'plain'); assert.equal(m.diagnosed, undefined, 'a plain test does not say which part');
  ok(m, {id: 'fixPart', targetId: 'card'}); assert.equal(m.zaps, 1); assert.equal(m.tripped, true); assert.equal(m.fixed, false);
  ok(m, {id: 'resetBreaker'}); ok(m, {id: 'fixPart', targetId: 'card'}); assert.equal(m.fixed, true);
});

test('looking closely is another way to find the fault; guessing wrong costs time but is not a failure', () => {
  const m = start('amp'); const t0 = m.minute;
  ok(m, {id: 'inspect', targetId: 'feed'}); assert.equal(m.diagnosed, undefined);
  const r = ok(m, {id: 'inspect', targetId: 'amp'}); assert.match(r.message, /burnt/); assert.equal(m.diagnosed, 'amp');
  off(m, 'motor'); ok(m, {id: 'fixPart', targetId: 'feed'}); assert.equal(m.fixed, false); assert.ok(m.minute > t0 + 8);
  assert.equal(applyAction(m, {id: 'fixPart', targetId: 'amp'}).ok, false, 'needs the spare in hand');
});

test('Mars shadow cuts the power: too much on at shadow time trips the breaker; heaters off in shadow means cold', () => {
  const m = start(); off(m, 'radio', 'amp'); on(m, 'charger'); const c0 = m.charge;
  while (!inShadow(m)) ok(m, {id: 'wait', payload: 1});
  assert.equal(m.tripped, true, '8 units is more than the 6 in shadow'); assert.ok(m.charge > c0);
  ok(m, {id: 'resetBreaker'}); off(m, 'heat'); ok(m, {id: 'wait', payload: 10}); assert.ok(m.coldMinutes >= 10);
});

test('landing: the radio beacon shrinks the ellipse and the hazard camera avoids rocks; choices change the outcome', () => {
  // Same seed, same pass, same site: only the beacon differs.
  const a = start('feed'), b = start('feed'); repair(b);
  a.site = b.site = 'pad'; const la = computeLanding(a, 100), lb = computeLanding(b, 100);
  assert.ok(lb.rel < la.rel, 'beacon makes the miss smaller');
  // A fully charged lander can always divert to smooth ground.
  const c = start('feed'); c.charge = 90; c.site = 'pad'; const lc = computeLanding(c, 100); assert.equal(lc.rough, false);
  // Plains are smooth everywhere but far away.
  const d = start('feed'); const rd = land(d, 'plains'); assert.equal(rd.success, true); assert.ok(rd.landing.distanceKm >= 9);
  // Without the radio or charge, the rocky pad is usually rough. Find a seed where it is.
  let rough = null; for (let seed = 0; seed < 60 && !rough; seed++) { const m = createMission({seed}); ok(m, {id: 'begin'}); const r = land(m, 'pad'); if (r.landing.rough) rough = r; }
  assert.ok(rough && rough.completed && !rough.success && rough.outcome === 'landed-rough');
});

test('a full careful run lands smoothly on the first pass and is mastered', () => {
  const m = start('amp'); repair(m);
  off(m, 'radio', 'amp', 'motor'); on(m, 'charger');
  while (m.charge < 80) ok(m, {id: 'wait', payload: 1});
  off(m, 'charger'); assert.ok(m.minute < 55, `charged by minute ${m.minute}`);
  const r = land(m, 'pad'); assert.equal(r.success, true); assert.equal(r.passIndex, 0); assert.equal(r.mastered, true); assert.ok(r.score >= 90, `score ${r.score}`);
  assert.equal(nextPass({scenario: arrivalScenario, minute: 101}), 220);
});

test('save and restore keep the whole attempt; schema is set', () => {
  const m = start('card'); on(m, 'motor'); ok(m, {id: 'testSignal'});
  const back = restoreSnapshot(serializeSnapshot(m)); assert.deepEqual(back, m); assert.equal(back.schema, ORBIT_SCHEMA);
});
