// "Dust Busters" — story, cleaning plan, airlock HUD and debrief.
import {runMission} from '../shared/controller.js';
import {planCards, compareTable} from '../shared/hud.js';
import {readHistory, pushHistory} from '../shared/runtime.js';
import {tuneScenario} from '../../simulation/difficulty.js';
import {lunarDustScenario} from './scenario.js';
import {createMission, ITEMS} from './state.js';
import {applyAction, getObjective, getSteps, getResult, PLANS, dirtyItems} from './actions.js';
import {createDustScene} from './scene.js';

const ID = 'lunar-dust';

function sources(ctx) {
  const sc = ctx.mission.scenario;
  return `<p>In March 2025, NASA’s <b>Electrodynamic Dust Shield</b> rode to the Moon on the Blue Ghost lander. It used electric fields to lift Moon dust off <b>glass</b> and <b>radiator</b> surfaces. That is why the EDS plate here works best on the smooth helmet visor. <a href="https://www.nasa.gov/blogs/missions/2025/03/04/blue-ghost-begins-surface-operations-captures-descent-video-sunrise/" target="_blank" rel="noopener">Read NASA’s Blue Ghost update</a>.</p>
  <p>Moon dust is made of tiny sharp bits of broken rock. There is no wind or water on the Moon to smooth them, so the dust is jagged and clingy. Dust only moves inside a base if people carry it in.</p>
  <p class="mx-made-up"><b>Made up for the game:</b> ${sc.limitation}</p>`;
}

function brief(ctx) {
  const sc = ctx.mission.scenario;
  ctx.dialog({label: 'MOON · HORIZON BASE AIRLOCK', title: 'Dust Busters', body: `
    <p><b>Amara:</b> “What a moonwalk! But look at us. We are covered in Moon dust.”</p>
    <p><b>Luca (on the radio):</b> “Don’t bring that dust inside! It is sharp like tiny bits of glass. It scratches things and makes people cough. Clean everything in the airlock first.”</p>
    <ul class="mx-howto"><li>🚪 Shut the <b>outside hatch</b> and fill the airlock with air.</li><li>🧹 Clean the <b>suit, helmet, bag and boots</b>: brush, vacuum or the EDS plate.</li><li>🌬️ Press the green button to <b>clean the air</b>. Swap the filter when it is full.</li><li>✅ Open the <b>inside hatch</b> only when the screen says it is safe.</li></ul>
    <aside class="mx-detail"><b>More details</b><br>You have ${sc.powerUnits} power units and ${sc.spareFilters} spare filter${sc.spareFilters === 1 ? '' : 's'}. The vacuum uses ${sc.tools.vacuum.power} power each time, the EDS ${sc.tools.eds.power}, the air fan ${sc.scrub.power}.</aside>`,
    actions: [{label: '▶ Let’s bust some dust!', primary: true, run: () => { ctx.act({id: 'begin'}, {quiet: true}); planBoard(ctx); }}, {label: 'Is this real?', run: () => ctx.sourcesDialog(() => brief(ctx))}]});
}

function planBoard(ctx) {
  ctx.saveCheckpoint();
  const sc = ctx.mission.scenario, last = readHistory(ID).at(-1);
  ctx.dialog({label: 'PICK A PLAN', title: 'How will you clean the gear?', body: `<p>You can use any tool at any time. Your plan is just where you start.</p>
    ${planCards(Object.entries(PLANS).map(([id, p]) => ({id, ...p, cost: {brush: '⚡ No power · 🌫️ Dusty air', vacuum: `⚡ ${sc.tools.vacuum.power} each · ⏱ Slow`, mix: `⚡ ${sc.tools.eds.power} each · 🪖 Visor-safe`}[id]})), last?.plan)}
    ${last ? `<p class="mx-last">Last time: <b>${PLANS[last.plan]?.title || '—'}</b> · ${last.minutes} min · ⚡ ${last.power} left · dust in base: ${last.base}${last.scratched ? ' · 🪖 visor scratched' : ''}. Try something new?</p>` : ''}`,
    actions: [], onOpen: body => body.querySelectorAll('[data-plan]').forEach(b => { b.onclick = () => { ctx.act({id: 'choosePlan', payload: b.dataset.plan}); ctx.close(); }; })});
}

function debrief(ctx) {
  const r = getResult(ctx.mission);
  ctx.report.send({outcome: r.outcome, completed: r.completed, success: r.success, mastered: r.mastered, score: r.score, carry: {plan: r.plan, rating: r.rating, baseDust: r.baseDust}});
  const history = r.completed && !ctx.sampleMode ? pushHistory(ID, {plan: r.plan, minutes: r.minutes, power: r.powerLeft, base: r.baseDust, scratched: r.scratched, filters: r.filters}) : readHistory(ID);
  ctx.persist(ctx.mission, true); ctx.setControls();
  const title = !r.completed ? 'Practice stopped' : {great: '🏆 Dust Buster!', ok: '👍 Mostly clean', low: '🤧 Dusty base'}[r.rating];
  const tip = !r.completed ? 'You can try again any time.'
    : r.baseDust > 0 ? 'Tip: wait until the screen says “safe” before you open the inside hatch.'
    : r.scratched ? 'Tip: brushing the visor scratched it. Try the vacuum or the EDS plate on the helmet.'
    : r.plan === 'brush' ? 'Fast and clean! Brushing made dusty air, so the filter worked hard. Could the vacuum save filters?'
    : r.plan === 'vacuum' ? 'Super clean! The vacuum was slow and used power. Could the brush be faster on the suit?'
    : 'Smart use of the EDS! It used a lot of power. Which gear needed it most?';
  const compare = history.length > 1 ? compareTable(history.map((h, i) => i === history.length - 1 ? 'This time' : `Try ${i + 1}`), [
    {label: 'Plan', values: history.map(h => PLANS[h.plan]?.title || '—')},
    {label: 'Minutes', values: history.map(h => h.minutes), better: 'low'},
    {label: 'Power left', values: history.map(h => h.power), better: 'high'},
    {label: 'Dust in base', values: history.map(h => h.base), better: 'low'},
    {label: 'Filters used', values: history.map(h => h.filters), better: 'low'},
    {label: 'Visor', values: history.map(h => h.scratched ? 'scratched' : 'OK')}]) : '<p class="mx-last">Play again with a different plan to compare here.</p>';
  ctx.dialog({label: 'MISSION REPORT · DUST BUSTERS', title, body: `
    ${r.completed ? `<p>⏱ <b>${r.minutes}</b> min · ⚡ Power left: <b>${r.powerLeft}</b> · 🌬️ Filters swapped: <b>${r.filters}</b> · 🧹 ${r.uses.brush} brush · 🌀 ${r.uses.vacuum} vacuum · ⚡ ${r.uses.eds} EDS</p>
      <p>🏠 Dust that got into the base: <b>${r.baseDust}</b>${r.leaks ? ` (the inside hatch opened too early ${r.leaks} time${r.leaks > 1 ? 's' : ''})` : ''} · 🪖 Visor: <b>${r.scratched ? 'scratched' : 'shiny'}</b></p>` : ''}
    <p class="mx-tip">💡 ${tip}</p>${compare}
    <aside class="mx-detail"><b>More details</b><br>Apollo astronauts found Moon dust on everything after their moonwalks. Future Artemis bases will need airlocks, filters and new tools like the EDS to keep it out.</aside>`,
    actions: [
      {label: '🔁 Try a different plan', primary: true, disabled: !ctx.checkpoint, run: () => ctx.retry(() => planBoard(ctx))},
      {label: '↺ Play again', run: () => ctx.restart()}, {label: '🗺️ Back to the map', run: ctx.openJourney}, {label: 'Sources', run: () => ctx.sourcesDialog(() => debrief(ctx))}]});
}

runMission({
  id: ID, title: 'Dust Busters', place: 'MISSION CONTROL JR. · MOON BASE AIRLOCK',
  meters: [{id: 'power', icon: '⚡', label: 'Power'}, {id: 'air', icon: '🌫️', label: 'Dust in the air'}, {id: 'filter', icon: '🌬️', label: 'Filter'}],
  create: () => createMission({scenario: tuneScenario(ID, lunarDustScenario), seed: 42 + readHistory(ID).length}),
  rules: {applyAction, getObjective, getSteps},
  scene: ctx => createDustScene({container: document.getElementById('world'), getState: () => ctx.mission, act: a => ctx.act(a), onPause: () => ctx.pause()}),
  brief, sources, debrief,
  sampler(ctx) { ctx.act({id: 'begin'}, {quiet: true}); ctx.saveCheckpoint(); },
  hud(ctx) {
    const s = ctx.mission, sc = s.scenario, {hud} = ctx;
    const clean = ITEMS.length - dirtyItems(s).length;
    hud.timer(s.phase === 'active' && s.plan ? `⏱ ${s.minutes} min · 🧑‍🚀 ${s.pressurized ? clean : 0} of 4 clean` : '', false);
    hud.meter('power', {value: s.power, max: sc.powerUnits, text: `${s.power} of ${sc.powerUnits}`});
    hud.meter('air', {value: Math.max(0, 60 - s.airDust), max: 60, text: s.airDust <= sc.airSafe ? (s.airDust < .5 ? 'Clean' : 'Safe') : `${Math.round(s.airDust)} dusty`, warn: .5});
    hud.meter('filter', {value: sc.filterCap - s.filterLoad, max: sc.filterCap, text: `${Math.round(100 - s.filterLoad / sc.filterCap * 100)}% left · ${s.spares} spare`});
  },
}).then(ctx => addEventListener('keydown', e => { if (e.code === 'KeyQ' && ctx.playing() && ctx.mission.hand) ctx.act({id: 'putTool'}); }));
