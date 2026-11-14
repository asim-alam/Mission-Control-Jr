import test from 'node:test';
import assert from 'node:assert/strict';
import {createMission, migrateSave, PEOPLE, SHELTER_SCHEMA} from '../missions/solar-shelter/state.js';
import {applyAction, applyBlueprint, advanceMission, getResult, getShelterTask, getSteps, checkRefuge, blockingIssues, estimate, outsideRate, personRate, seatTransmission, serializeSnapshot, restoreSnapshot} from '../missions/solar-shelter/actions.js';
import {shelterScenario} from '../missions/solar-shelter/scenario.js';
import {saveActiveAttempt, loadActiveAttempt} from '../simulation/mission-storage.js';
// Same logic as missions/shared/runtime.js loadSaved (that module needs a browser window).
const loadSaved = (id, ls) => { const raw = loadActiveAttempt(id, ls); if (!raw) return {state: null}; const st = restoreSnapshot(raw); if (st.schema === SHELTER_SCHEMA) return {state: st, discarded: false}; const mv = migrateSave(st); return mv ? {state: mv, discarded: false, migrated: true} : {state: null, discarded: true}; };

const ok = (m, a) => { const r = applyAction(m, a); assert.ok(r.ok, `${a.id}: ${r.message}`); return r; };
const carry = (m, it, a) => { ok(m, {id: 'pickUp', targetId: it}); ok(m, a); };
function start(assist) { const m = createMission(); ok(m, {id: 'begin'}); ok(m, {id: 'openMap'}); if (assist) ok(m, {id: 'chooseAssist', payload: assist}); return m; }
const water = (m, n, at = 'back_l') => { ok(m, {id: 'buildRack', payload: at}); for (let i = 1; i <= n; i++) carry(m, `water-${i}`, {id: 'loadRack'}); ok(m, {id: 'latchRack'}); };
const panels = (m, rails) => rails.forEach((r, i) => { carry(m, `poly-${i + 1}`, {id: 'slidePanel', targetId: r}); ok(m, {id: 'fastenPanel', targetId: `poly-${i + 1}`}); });
const bags = (m, zones) => { zones.forEach((z, i) => carry(m, `bag-${i + 1}`, {id: 'placeBag', targetId: z})); for (const z of new Set(zones)) ok(m, {id: 'strapZone', targetId: z}); };
function watch(m) { if (m.stage === 'prep') ok(m, {id: 'ready'}); for (let i = 0; i < 3000 && m.stage !== 'after'; i++) advanceMission(m, .1); ok(m, {id: 'finish'}); return getResult(m); }
const strategyA = () => { const m = start('trolley'); water(m, 6); panels(m, ['roof_l', 'roof_l', 'roof_r', 'roof_r']); ok(m, {id: 'moveCrew', targetId: 'jin', payload: 'C'}); return m; };
const strategyB = () => { const m = start('airflow'); panels(m, ['roof_l', 'roof_l', 'roof_r', 'roof_r']); bags(m, ['stack_side', 'stack_side', 'stack_side', 'stack_back', 'stack_back', 'stack_back']); ok(m, {id: 'moveCrew', targetId: 'jin', payload: 'C'}); return m; };

test('two different layouts both protect the crew well; an empty refuge does not', () => {
  const a = watch(strategyA()), b = watch(strategyB()), bare = watch(start('trolley'));
  assert.equal(a.rating, 'great'); assert.equal(b.rating, 'great'); assert.equal(bare.rating, 'weak');
  assert.notEqual(a.water, b.water); assert.ok(a.reduction > bare.reduction + .25);
});

test('there is not time for everything: building all three ends with the particles rising mid-build', () => {
  const m = start('airflow'); water(m, 6); panels(m, ['roof_l', 'roof_l', 'roof_r', 'roof_r']);
  for (let i = 1; i <= 6 && m.stage === 'prep'; i++) carry(m, `bag-${i}`, {id: 'placeBag', targetId: i < 4 ? 'shelf_l' : 'shelf_r'});
  assert.equal(m.stage, 'event'); assert.equal(m.onsetDuringPrep, true);
  assert.ok(PEOPLE.every(p => !m.inside[p]), 'everyone still has to walk in');
  const before = m.exposure.elena; advanceMission(m, 1); assert.ok(m.exposure.elena > before);
});

test('exposure rate and accumulated exposure are separate, and sheltering never removes exposure', () => {
  const m = strategyA(); ok(m, {id: 'ready'});
  while (m.stage === 'cover') advanceMission(m, .5);
  for (let i = 0; i < 40; i++) advanceMission(m, .1);
  const total = m.exposure.you, rate = m.rate.you;
  assert.ok(rate > 0 && total > 0 && rate !== total);
  assert.ok(personRate(m, 'you') < m.outsideRate, 'the refuge lowers the rate');
  let last = total; for (let i = 0; i < 50; i++) { advanceMission(m, .2); assert.ok(m.exposure.you >= last); last = m.exposure.you; }
});

test('each person is tracked separately and the door seat is weaker', () => {
  const m = strategyA(); assert.ok(seatTransmission(m, 'F') > seatTransmission(m, 'C'));
  const r = watch(m); assert.equal(new Set(Object.values(r.exposure)).size > 1, true);
  assert.deepEqual(Object.keys(r.exposure).sort(), [...PEOPLE].sort());
});

test('the refuge check catches a blocked door, a blocked vent and a covered water tap, and they can be fixed', () => {
  const m = start('trolley'); water(m, 2, 'back_r');
  bags(m, ['stack_door', 'stack_side', 'stack_side', 'stack_back']);
  const ids = blockingIssues(m).map(c => c.id).sort(); assert.deepEqual(ids, ['airflow', 'entrance', 'water']);
  assert.equal(applyAction(m, {id: 'ready'}).ok, false);
  for (const b of ['bag-1', 'bag-2', 'bag-4']) { ok(m, {id: 'pickUp', targetId: b}); ok(m, {id: 'putBack'}); }
  assert.deepEqual(blockingIssues(m), []); ok(m, {id: 'ready'});
});

test('loose supplies slip during the event and stop helping', () => {
  const m = start('trolley'); carry(m, 'bag-1', {id: 'placeBag', targetId: 'shelf_l'}); carry(m, 'bag-2', {id: 'placeBag', targetId: 'shelf_l'});
  assert.ok(checkRefuge(m).find(c => c.id === 'secured' && !c.ok));
  const r = watch(m); assert.equal(r.slipped, 2); assert.equal(r.bags, 0);
});

test('the forecast is a rough window: the player is never told the exact onset', () => {
  const m = start(); assert.match(m.scenario.forecastText, /nobody knows/i); assert.doesNotMatch(m.scenario.forecastText, /75/);
  assert.equal(outsideRate(m, -1), 0); assert.ok(estimate(m).habitat > estimate(m).you);
});

test('try changing one thing: the last layout rebuilds with the same work minutes', () => {
  const a = strategyA(), bp = a.blueprint.slice(), minutes = a.minutes;
  const m = start(); const r = applyBlueprint(m, bp.filter(s => s.id !== 'chooseAssist' || !m.assist));
  assert.ok(r.ok); assert.equal(m.minutes, minutes); assert.equal(m.rack.latched, true);
});

test('saves round-trip through the storage validator, and old shelter saves migrate', () => {
  const store = new Map(); const ls = {getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v), removeItem: k => store.delete(k)};
  const m = strategyA(); assert.equal(saveActiveAttempt('solar-shelter', serializeSnapshot(m), ls), true);
  const back = loadSaved('solar-shelter', ls);
  assert.equal(back.discarded, false); assert.equal(back.state.minutes, m.minutes); assert.deepEqual(back.state.seats, m.seats);
  const old = {missionId: 'solar-shelter', schema: 2, phase: 'active', stage: 'prep', simSeconds: 400, plan: 'roof', carryNote: 'prepared', scenario: {}, events: []};
  ls.setItem('mission-control-jr.active-attempt.v1.solar-shelter', JSON.stringify({version: 1, missionId: 'solar-shelter', savedAt: 1, snapshot: JSON.stringify({version: 1, state: old})}));
  const moved = loadSaved('solar-shelter', ls);
  assert.equal(moved.migrated, true); assert.equal(moved.state.phase, 'active'); assert.equal(moved.state.carryNote, 'prepared'); assert.equal(moved.state.stage, 'prep');
  assert.equal(migrateSave({...old, phase: 'debrief'}), null);
  assert.deepEqual(restoreSnapshot(serializeSnapshot(m)).items, m.items);
});

test('guidance leads from the tablet and Elena through the first secured shielding and the safety check', () => {
  const m = createMission();
  const at = (place, step) => {
    const task = getShelterTask(m);
    assert.equal(task.place, place, task.text);
    assert.equal(getSteps(m).findIndex(s => s.now), step);
    if (place) assert.ok(task.marker);
  };
  ok(m, {id: 'begin'}); at('tablet', 0);
  ok(m, {id: 'openMap'}); at('elena', 1);
  ok(m, {id: 'chooseAssist', payload: 'trolley'}); at('mount:back_l', 2);
  ok(m, {id: 'buildRack', payload: 'back_l'}); at('item:water-1', 2);
  assert.match(getShelterTask(m).text, /trolley/);
  ok(m, {id: 'pickUp', targetId: 'water-1'}); at('rack', 2);
  ok(m, {id: 'loadRack'}); at('rack', 2);
  ok(m, {id: 'latchRack'}); at('item:poly-1', 2);
  ok(m, {id: 'pickUp', targetId: 'poly-1'}); at('rail:roof_l', 2);
  ok(m, {id: 'slidePanel', targetId: 'roof_l'}); at('item:poly-1', 2);
  ok(m, {id: 'fastenPanel', targetId: 'poly-1'}); at('item:bag-1', 2);
  ok(m, {id: 'pickUp', targetId: 'bag-1'}); at('zone:shelf_r', 2);
  ok(m, {id: 'placeBag', targetId: 'shelf_r'}); at('zone:shelf_r', 2);
  ok(m, {id: 'strapZone', targetId: 'shelf_r'}); at('check', 3);
  ok(m, {id: 'ready'}); at(undefined, 4);
  advanceMission(m, 1000); advanceMission(m, 1000); at(undefined, 5);
  assert.equal(m.scenario.id, shelterScenario.id);
});

test('after a failed refuge check the guide marks the actual blockage and returns to the door after cleanup', () => {
  const m = start('airflow');
  carry(m, 'bag-1', {id: 'placeBag', targetId: 'stack_door'});
  ok(m, {id: 'runCheck'});
  assert.equal(getShelterTask(m).place, 'item:bag-1');
  assert.match(getShelterTask(m).title, /doorway/);
  ok(m, {id: 'pickUp', targetId: 'bag-1'});
  assert.match(getShelterTask(m).text, /Put item back/);
  ok(m, {id: 'putBack'});
  assert.equal(getShelterTask(m).place, 'check');
});
