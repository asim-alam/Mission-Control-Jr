import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createMission, ITEMS} from '../missions/lunar-dust/state.js';
import {lunarDustScenario} from '../missions/lunar-dust/scenario.js';
import {applyAction, getObjective, getSteps, getResult, safeToEnter, serializeSnapshot, restoreSnapshot} from '../missions/lunar-dust/actions.js';
import {tuneScenario} from '../simulation/difficulty.js';

const act = (m, id, payload) => { const r = applyAction(m, {id, payload}); assert.ok(r.ok, `${id} ${payload ?? ''}: ${r.message}`); return r; };
const no = (m, id, payload) => assert.equal(applyAction(m, {id, payload}).ok, false, `${id} ${payload ?? ''} should be refused`);
function ready(plan, scenario = lunarDustScenario) { const m = createMission({scenario}); act(m, 'begin'); act(m, 'choosePlan', plan); act(m, 'closeOuter'); act(m, 'pressurize'); return m; }
function cleanWith(m, tool, items = ITEMS) { if (m.hand !== tool) { if (m.hand) act(m, 'putTool'); act(m, 'takeTool', tool); } for (const id of items) while (m.items[id].dust > m.scenario.cleanEnough) act(m, 'clean', id); act(m, 'putTool'); }
function clearAir(m) { for (let k = 0; k < 6 && m.airDust > m.scenario.airSafe; k++) { if (m.filterLoad >= m.scenario.filterCap) { act(m, 'takeFilter'); act(m, 'swapFilter'); } act(m, 'scrub'); } }

test('the EDS source is recorded and the made-up parts are labelled', () => {
  const prov = JSON.parse(readFileSync(new URL('../public/data/provenance.json', import.meta.url)));
  const rec = prov.find(p => p.id === lunarDustScenario.sourceId); assert.ok(rec); assert.match(rec.qualityNotes.join(' '), /glass/);
  assert.match(lunarDustScenario.limitation, /made up/);
  // The plate works best on the smooth visor and not at all on the big floppy suit.
  assert.ok(lunarDustScenario.items.helmet.eds > lunarDustScenario.items.boots.eds && lunarDustScenario.items.boots.eds > lunarDustScenario.items.bag.eds);
  assert.equal(lunarDustScenario.items.suit.eds, 0);
});

test('order matters: shut the hatch, then air, then cleaning', () => {
  const m = createMission(); act(m, 'begin'); act(m, 'choosePlan', 'brush');
  no(m, 'pressurize'); no(m, 'takeTool', 'brush'); no(m, 'openInner'); act(m, 'closeOuter'); no(m, 'closeOuter');
  no(m, 'clean', 'suit'); act(m, 'pressurize'); no(m, 'clean', 'suit'); act(m, 'takeTool', 'brush'); act(m, 'clean', 'suit');
  assert.ok(m.airDust > 0); no(m, 'edsLoad', 'helmet'); act(m, 'putTool'); no(m, 'edsLoad', 'suit'); act(m, 'edsLoad', 'helmet'); no(m, 'edsLoad', 'boots'); act(m, 'edsZap');
  assert.equal(m.edsItem, null); assert.ok(m.items.helmet.dust <= m.scenario.cleanEnough);
});

test('three defensible plans, each with a different cost', () => {
  const brush = ready('brush'); act(brush, 'edsLoad', 'helmet'); act(brush, 'edsZap'); cleanWith(brush, 'brush'); clearAir(brush); act(brush, 'openInner');
  const vac = ready('vacuum'); cleanWith(vac, 'nozzle'); clearAir(vac); act(vac, 'openInner');
  const mix = ready('mix'); for (const id of ['helmet', 'boots', 'bag']) { act(mix, 'edsLoad', id); act(mix, 'edsZap'); } cleanWith(mix, 'nozzle'); clearAir(mix); act(mix, 'openInner');
  const [a, b, c] = [brush, vac, mix].map(getResult);
  for (const r of [a, b, c]) { assert.equal(r.rating, 'great', JSON.stringify(r)); assert.equal(r.baseDust, 0); }
  assert.ok(a.minutes < b.minutes, 'brushing is faster'); assert.ok(a.filters > b.filters, 'brushing uses more filters');
  assert.ok(b.powerLeft < a.powerLeft, 'vacuuming costs power'); assert.ok(c.powerLeft < b.powerLeft, 'the EDS costs the most power');
});

test('brushing the visor scratches it; opening early leaks dust but can be fixed', () => {
  const m = ready('brush'); act(m, 'takeTool', 'brush'); act(m, 'clean', 'helmet'); assert.equal(m.scratched, true);
  act(m, 'putTool'); assert.equal(safeToEnter(m), false);
  const r = act(m, 'openInner'); assert.match(r.message, /dust got into the base/); assert.ok(m.baseDust > 0); assert.equal(m.phase, 'active');
  cleanWith(m, 'brush'); clearAir(m); act(m, 'openInner'); const res = getResult(m);
  assert.equal(res.completed, true); assert.equal(res.rating, m.baseDust <= m.scenario.ratings.okBaseDust ? 'ok' : 'low'); assert.equal(res.leaks, 1);
});

test('a full filter blocks the fan until you swap one in; spares run out', () => {
  const m = ready('brush'); cleanWith(m, 'brush'); act(m, 'scrub');
  assert.equal(m.filterLoad, m.scenario.filterCap); assert.ok(m.airDust > m.scenario.airSafe);
  no(m, 'scrub'); assert.equal(getObjective(m), 'The filter is full! Get a new one from the locker');
  act(m, 'takeFilter'); assert.equal(getObjective(m), 'Swap the air filter: hold E on the filter door'); act(m, 'swapFilter');
  act(m, 'scrub'); assert.equal(m.spares, 0); no(m, 'takeFilter');
});

test('a second early opening ends the mission with a dusty base', () => {
  const m = ready('brush'); act(m, 'openInner'); act(m, 'openInner');
  assert.equal(m.phase, 'debrief'); const r = getResult(m); assert.equal(r.completed, true); assert.equal(r.rating, 'low'); assert.equal(r.success, false);
});

test('power runs out: the vacuum stops, the brush still works', () => {
  const m = ready('vacuum'); m.power = 3; act(m, 'takeTool', 'nozzle'); no(m, 'clean', 'suit'); act(m, 'putTool'); act(m, 'takeTool', 'brush'); act(m, 'clean', 'suit');
});

test('snapshots restore exactly, objectives follow the job, and Cadet is gentler', () => {
  const m = ready('mix'); act(m, 'edsLoad', 'helmet');
  const copy = restoreSnapshot(serializeSnapshot(m)); assert.deepEqual(copy, m); act(m, 'edsZap'); act(copy, 'edsZap'); assert.deepEqual(copy, m);
  const f = createMission(); assert.equal(getObjective(f), 'Welcome back from your moonwalk'); act(f, 'begin'); assert.equal(getObjective(f), 'Pick a cleaning plan');
  act(f, 'choosePlan', 'vacuum'); assert.equal(getObjective(f), 'Shut the outside hatch: hold E on the orange wheel'); act(f, 'closeOuter');
  assert.equal(getObjective(f), 'Fill the airlock with air: press the green button'); act(f, 'pressurize'); assert.equal(getObjective(f), 'Grab the vacuum hose on the bench');
  assert.equal(getSteps(f).find(s => s.now).text, 'Clean all 4 pieces of gear');
  const cadet = ready('brush', tuneScenario('lunar-dust', lunarDustScenario, 'cadet')); cleanWith(cadet, 'brush', ['suit', 'bag', 'boots']); act(cadet, 'edsLoad', 'helmet'); act(cadet, 'edsZap'); clearAir(cadet); act(cadet, 'openInner');
  assert.equal(getResult(cadet).rating, 'great'); assert.ok(cadet.power > 0);
});
