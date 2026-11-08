// "A Place to Hide" — story, plan board, storm screen and debrief. Shared plumbing lives in ../shared/controller.js.
import {runMission} from '../shared/controller.js';
import {planCards, compareTable} from '../shared/hud.js';
import {readHistory, pushHistory} from '../shared/runtime.js';
import {tuneScenario} from '../../simulation/difficulty.js';
import {shelterScenario} from './scenario.js';
import {createMission, CREW} from './state.js';
import {applyAction, advanceMission, getObjective, getSteps, getResult, PLANS, stormStart, stormEnd, teamDose, shelterTransmission, filledSlots, crewSafe} from './actions.js';
import {createShelterScene} from './scene.js';

const ID = 'solar-shelter';
const name = id => id[0].toUpperCase() + id.slice(1);

function sources(ctx) {
  return `<p>On <b>10 May 2024</b>, NASA’s space weather team recorded a real burst of fast particles from the Sun, measured by the GOES satellite near Earth. <a href="${ctx.mission.scenario.event.link}" target="_blank" rel="noopener">See NASA’s record</a>.</p>
  <p>NASA plans for crews to shelter behind water, food and supplies when a storm like this comes. <a href="https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/" target="_blank" rel="noopener">Read how NASA protects astronauts</a>.</p>
  <p class="mx-made-up"><b>Made up for the game:</b> ${ctx.mission.scenario.limitation}</p>`;
}
function brief(ctx) {
  const back = ctx.carry.stormOutcome ? '<p>You kept the base safe in the dust storm. Now a different kind of storm is coming.</p>' : '';
  ctx.dialog({label: 'MARS DAY 18 · SPACE WEATHER ALERT', title: 'A storm from the Sun!', body: `${back}
    <p><b>Elena:</b> “The Sun just threw out a cloud of super-fast particles. They are invisible, but they can hurt our bodies. They reach Mars in about <b>${Math.round(ctx.mission.scenario.warningSeconds / 60)} minutes</b>!”</p>
    <p>Build a shelter around the crew. <b>Water</b>, <b>plastic</b> and <b>packed supplies</b> all block particles. Then call everyone inside.</p>
    <ul class="mx-howto"><li>👀 Look at a thing and press <b>E</b> (or click it) to pick it up.</li><li>🟨 Carry it to a glowing yellow spot on the shelter.</li><li>🗣️ Walk up to a crew member and press <b>E</b> to call them.</li><li>↩️ Press <b>Q</b> to put a shield back.</li></ul>
    <aside class="mx-detail"><b>More details</b><br>Mars has a thin atmosphere and no global magnetic field, so more particles reach the ground than on Earth. The planet itself blocks everything coming from below, so the roof matters most.</aside>`,
    actions: [{label: '▶ Let’s go!', primary: true, run: () => { ctx.act({id: 'begin'}, {quiet: true}); planBoard(ctx); }}, {label: 'Is this real?', run: () => ctx.sourcesDialog(() => brief(ctx))}]});
}
function planBoard(ctx) {
  ctx.saveCheckpoint();
  const last = readHistory(ID).at(-1);
  ctx.dialog({label: 'PICK A PLAN', title: 'How will you build it?', body: `<p>There are <b>8 spots</b>: 6 on the walls and 2 on the roof. The roof spots count double.</p>${planCards(Object.entries(PLANS).map(([id, p]) => ({id, ...p, cost: {water: '🐢 Slow · 💪 Strongest', fast: '🐇 Quick · 🙂 Medium', roof: '⚖️ In between'}[id]})), last?.plan)}
    ${last ? `<p class="mx-last">Last time: <b>${PLANS[last.plan]?.title || 'a plan'}</b> · team dose ${last.teamDose}. Try something new?</p>` : ''}
    <aside class="mx-detail"><b>More details</b><br>Water and plastic are full of hydrogen. Hydrogen is very good at slowing down fast particles. Supply bags help too, but less.</aside>`,
    actions: [], onOpen: body => body.querySelectorAll('[data-plan]').forEach(b => { b.onclick = () => { ctx.act({id: 'choosePlan', payload: b.dataset.plan}); ctx.close(); }; })});
}
function consoleScreen(ctx) {
  const s = ctx.mission, toStorm = Math.max(0, stormStart(s) - s.simSeconds);
  const canSkip = s.stage !== 'after' && s.playerInShelter && crewSafe(s) + CREW.filter(c => s.crew[c].at === 'walking').length === 4;
  ctx.dialog({label: 'STORM SCREEN', title: s.stage === 'after' ? 'All clear!' : s.stage === 'storm' ? 'The storm is here' : `Storm arrives in ${Math.ceil(toStorm / 60)} min`, body: `
    <p>Shelter blocks <b>${Math.round((1 - shelterTransmission(s)) * 100)}%</b> of particles · ${filledSlots(s).length} of 8 spots filled · ${crewSafe(s)} of 4 crew inside.</p>
    ${s.stage === 'after' ? '<p>The particles have faded. Everyone can come out!</p>' : '<p>When everyone is inside (you too), you can skip ahead to the end of the storm.</p>'}`,
    actions: [
      ...(s.stage === 'after' ? [{label: '✅ Finish the mission', primary: true, run: () => { ctx.close(); ctx.act({id: 'finish'}); }}] : [{label: '⏩ Skip ahead', disabled: !canSkip, title: canSkip ? '' : 'Everyone (you too) must be in the shelter', run: () => { ctx.close(); ctx.act({id: 'skipAhead'}); }}]),
      {label: '← Back', run: () => ctx.close()}, {label: 'Stop practice', run: () => { ctx.close(); ctx.act({id: 'stopEarly'}); }}]});
}
function doseBars(ctx) {
  const m = ctx.mission, people = [...CREW.map(id => [name(id), m.crew[id].dose]), ['You', m.playerDose]], max = Math.max(100, ...people.map(p => p[1])), g = m.scenario.ratings;
  return `<div class="mx-bars">${people.map(([n, d]) => `<div class="mx-barrow"><span>${n}</span><span class="mx-track"><i style="width:${d / max * 100}%" class="${d <= g.great ? 'good' : d <= g.ok ? 'mid' : 'bad'}"></i><em style="left:${g.great / max * 100}%"></em><em style="left:${g.ok / max * 100}%"></em></span><b>${d.toFixed(0)}</b></div>`).join('')}</div><p class="mx-legend">Lines: under ${g.great} is great · under ${g.ok} is OK.</p>`;
}
function debrief(ctx) {
  const r = getResult(ctx.mission);
  ctx.report.send({outcome: r.outcome, completed: r.completed, success: r.success, mastered: r.mastered, score: r.score, carry: {plan: r.plan, rating: r.rating, teamDose: r.teamDose, roofCovered: r.roofCovered}});
  const history = r.completed && !ctx.sampleMode ? pushHistory(ID, {plan: r.plan, teamDose: r.teamDose, filled: r.filled, roof: r.roofCovered, crewSafe: r.crewSafeAtArrival}) : readHistory(ID);
  ctx.persist(ctx.mission, true); ctx.setControls();
  const title = !r.completed ? 'Practice stopped' : {great: '🏆 Super shelter!', ok: '👍 Everyone made it', high: '😬 Too many particles got in'}[r.rating];
  const tip = !r.completed ? 'You can try again any time.' : r.roofCovered < 2 ? 'Tip: the roof spots count double. Put your best shields up there!' : r.filled < 8 ? 'Tip: every empty spot lets particles stream in. Try to fill all 8.' : r.crewSafeAtArrival < 4 ? 'Tip: call the crew earlier, so nobody is outside when the storm hits.' : r.water + r.poly < 8 ? 'Tip: water and plastic block more than supply bags. Was there time to use more?' : 'You built a strong shelter. Can you do it faster?';
  const compare = history.length > 1 ? compareTable(history.map((h, i) => i === history.length - 1 ? 'This time' : `Try ${i + 1}`), [
    {label: 'Plan', values: history.map(h => PLANS[h.plan]?.title || '—')},
    {label: 'Team dose', values: history.map(h => h.teamDose), better: 'low'},
    {label: 'Spots filled', values: history.map(h => h.filled), better: 'high'},
    {label: 'Roof covered', values: history.map(h => h.roof), better: 'high'},
    {label: 'Crew in on time', values: history.map(h => h.crewSafe), better: 'high'}]) : '<p class="mx-last">Play again with a different plan to compare results here.</p>';
  ctx.dialog({label: 'MISSION REPORT · A PLACE TO HIDE', title, body: `
    ${r.completed ? doseBars(ctx) : ''}
    ${r.completed ? `<p>Your shelter blocked <b>${Math.round((1 - r.transmission) * 100)}%</b> of particles. ${r.filled} of 8 spots filled (roof ${r.roofCovered}/2) using ${r.water} water, ${r.poly} plastic and ${r.cargo} supply ${r.cargo === 1 ? 'stack' : 'stacks'}.</p>` : ''}
    <p class="mx-tip">💡 ${tip}</p>${compare}
    <aside class="mx-detail"><b>More details</b><br>Real crews watch NASA space weather alerts. The particles in a storm like this can arrive in under an hour. The dose points here are made up, but the idea is real: more hydrogen-rich mass between you and space means fewer particles get through.</aside>`,
    actions: [
      {label: '🔁 Try a different plan', primary: true, disabled: !ctx.checkpoint, run: () => ctx.retry(() => planBoard(ctx))},
      {label: '↺ Play again', run: () => ctx.restart()}, {label: '🗺️ Back to the map', run: ctx.openJourney}, {label: 'Sources', run: () => ctx.sourcesDialog(() => debrief(ctx))}]});
}

runMission({
  id: ID, title: 'A Place to Hide', place: 'MISSION CONTROL JR. · MARS DAY 18', carryFrom: 'storm',
  meters: [{id: 'time', icon: '⏳', label: 'Warning time'}, {id: 'shield', icon: '🛡️', label: 'Shelter shield'}, {id: 'dose', icon: '☢️', label: 'Team dose'}],
  create: carry => createMission({scenario: tuneScenario(ID, shelterScenario), initialCarry: carry}),
  rules: {applyAction, getObjective, getSteps, advance: (m, dt, ctx) => advanceMission(m, dt, {playerInShelter: ctx.view.inShelter()})},
  scene: ctx => createShelterScene({container: document.getElementById('world'), getState: () => ctx.mission, act: a => ctx.act(a), onPause: () => ctx.pause(), onConsole: () => consoleScreen(ctx)}),
  brief, sources, debrief,
  sampler(ctx) { ctx.act({id: 'begin'}, {quiet: true}); ctx.saveCheckpoint(); ctx.act({id: 'choosePlan', payload: 'roof'}, {quiet: true}); },
  hud(ctx) {
    const s = ctx.mission, {hud} = ctx, toStorm = stormStart(s) - s.simSeconds;
    if (s.phase === 'active' && !ctx.playing() && s.stage !== 'plan') s.playerInShelter = ctx.view.inShelter();
    if (s.phase === 'active' && s.stage === 'prep') hud.timer(`☀️ Storm in ${Math.floor(toStorm / 60)}:${String(Math.floor(toStorm % 60)).padStart(2, '0')}`, toStorm < 240);
    else if (s.phase === 'active' && s.stage === 'storm') hud.timer(`☢️ Storm · ${Math.ceil((stormEnd(s) - s.simSeconds) / 60)} min left`, !s.playerInShelter);
    else if (s.phase === 'active' && s.stage === 'after') hud.timer('✅ All clear');
    else hud.timer('');
    hud.meter('time', {value: Math.max(0, toStorm), max: s.scenario.warningSeconds, text: toStorm > 0 ? `${Math.ceil(toStorm / 60)} min` : 'Storm!'});
    hud.meter('shield', {value: (1 - shelterTransmission(s)) * 100, max: 80, text: `${filledSlots(s).length}/8 spots`, warn: .45});
    const dose = teamDose(s); hud.meter('dose', {value: Math.max(0, 100 - dose), max: 100, text: dose.toFixed(0), warn: .35});
  },
}).then(ctx => addEventListener('keydown', e => { if (e.code === 'KeyQ' && ctx.playing() && ctx.mission.held) ctx.act({id: 'putBack'}); }));
