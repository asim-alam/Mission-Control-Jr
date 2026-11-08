// "The Greenhouse Promise" — story, plan board, day console and birthday-dinner debrief.
import {runMission} from '../shared/controller.js';
import {planCards, compareTable} from '../shared/hud.js';
import {readHistory, pushHistory} from '../shared/runtime.js';
import {tuneScenario} from '../../simulation/difficulty.js';
import {greenhouseScenario} from './scenario.js';
import {createMission, BEDS} from './state.js';
import {applyAction, getObjective, getSteps, getResult, PLANS, lightPower, batteryNeeded, isReady, moistureState} from './actions.js';
import {createGreenhouseScene} from './scene.js';

const ID = 'greenhouse';

function sources(ctx) {
  const sc = ctx.mission.scenario;
  return `<p>NASA grows plants in space in a chamber called <b>Veggie</b>. In study <b>OSD-269</b>, lettuce on the Space Station had <b>${sc.lightHours} hours of light and ${sc.darkHours} hours of dark</b> each day. <a href="https://osdr.nasa.gov/bio/repo/data/studies/OSD-269" target="_blank" rel="noopener">See the NASA study</a>.</p>
  <p>Astronauts first ate red romaine lettuce grown in space in 2015, grew mizuna greens, and picked chile peppers in 2021. <a href="https://www.nasa.gov/missions/station/iss-research/growing-plants-in-space/" target="_blank" rel="noopener">Read about growing plants in space</a>.</p>
  <p class="mx-made-up"><b>Made up for the game:</b> ${sc.limitation}</p>`;
}
function brief(ctx) {
  const rested = ctx.mission.crewRested ? '<p>After the Sun storm, the crew is rested and ready to farm.</p>' : '';
  ctx.dialog({label: 'MARS DAYS 32–34 · THE GREENHOUSE', title: 'A birthday promise', body: `${rested}
    <p><b>Amara:</b> “Shh! It’s Elena’s birthday in three days. I promised her a <b>fresh salad</b>. Can you help me grow it?”</p>
    <p>You have three beds: 🥬 <b>red lettuce</b>, 🌿 <b>mizuna</b> and 🌶️ <b>chile peppers</b>. Plants need <b>light</b> and the right amount of <b>water</b>. Light uses power, and we only have so much each day.</p>
    <ul class="mx-howto"><li>💡 Flip a bed’s <b>light lever</b>: off → half → full.</li><li>💧 Turn the blue <b>valve wheel</b> to water. Watch the dial: green is just right.</li><li>📺 At the console, check the power and <b>end the day</b>.</li></ul>
    <aside class="mx-detail"><b>More details</b><br>NASA’s plant chambers use red and blue LEDs, because plants use those colours most for growing. The light schedule here (16 hours on, 8 off) comes from a real NASA lettuce study.</aside>`,
    actions: [{label: '▶ Let’s grow!', primary: true, run: () => { ctx.act({id: 'begin'}, {quiet: true}); planBoard(ctx); }}, {label: 'Is this real?', run: () => ctx.sourcesDialog(() => brief(ctx))}]});
}
function planBoard(ctx) {
  ctx.saveCheckpoint();
  const sc = ctx.mission.scenario, last = readHistory(ID).at(-1);
  ctx.dialog({label: 'PICK A PLAN', title: 'How will you share the light?', body: `<p>Each day there is <b>${sc.powerBudgetKWh} kWh</b> of solar power for the lights. Full light on a bed uses ${sc.lightKWh.full} kWh, half uses ${sc.lightKWh.half}. You can borrow up to <b>${sc.batteryKWh} kWh</b> from the battery for the whole mission, but the base needs it at night.</p>
    ${planCards(Object.entries(PLANS).map(([id, p]) => ({id, ...p, cost: {salad: '🥗 Safe · 🔋 Saves battery', feast: '🌶️ Bonus · 🔋 Uses battery', even: '🧪 Experiment'}[id]})), last?.plan)}
    ${last ? `<p class="mx-last">Last time: <b>${PLANS[last.plan]?.title || 'a plan'}</b> · ${last.salad} salad portions${last.peppers ? ' + peppers' : ''}. Try something new?</p>` : ''}`,
    actions: [], onOpen: body => body.querySelectorAll('[data-plan]').forEach(b => { b.onclick = () => { ctx.act({id: 'choosePlan', payload: b.dataset.plan}); ctx.close(); }; })});
}
function consoleScreen(ctx) {
  const s = ctx.mission, sc = s.scenario, power = lightPower(s), need = batteryNeeded(s), harvestDay = s.day > sc.growDays;
  const rows = BEDS.map(id => { const b = s.beds[id]; return `<tr><td>${sc.crops[id].icon} ${sc.crops[id].name}</td><td>${b.harvested ? 'picked' : b.light}</td><td>${b.harvested ? '—' : moistureState(s, id)}</td><td>${Math.round(Math.min(1, b.progress / sc.crops[id].ready) * 100)}%</td></tr>`; }).join('');
  ctx.dialog({label: `GREENHOUSE · MARS DAY ${sc.startSol + s.day - 1}`, title: harvestDay ? 'Harvest day!' : `Day ${s.day} of ${sc.growDays}: end the day?`, body: `
    <table class="mx-compare"><thead><tr><th>Bed</th><th>Light</th><th>Soil</th><th>Grown</th></tr></thead><tbody>${rows}</tbody></table>
    <p>⚡ Lights tonight: <b>${power.toFixed(2)} kWh</b> of ${sc.powerBudgetKWh} kWh solar${need > 0 ? ` · <b>${need.toFixed(2)} kWh</b> from the battery` : ''}. 🔋 Battery left: <b>${s.batteryKWh.toFixed(2)} kWh</b>. 💧 Tank: <b>${s.tankL.toFixed(1)} L</b>.</p>
    ${need > s.batteryKWh + 1e-9 ? '<p class="mx-tip">⚠️ Not enough power for all these lights. Turn one down.</p>' : ''}
    ${harvestDay ? '<p>Pick the ready plants with the basket, then put the basket on the table to serve dinner.</p>' : ''}`,
    actions: [
      ...(!harvestDay ? [{label: '🌙 End the day', primary: true, run: async () => {
        const r = ctx.act({id: 'endDay'}); if (!r.ok) return; ctx.close(); ctx.busy = true; await ctx.view.nightfall(); ctx.busy = false;
      }}] : []),
      {label: '← Back', run: () => ctx.close()}, {label: 'Stop practice', run: () => { ctx.close(); ctx.act({id: 'stopEarly'}); }}]});
}
function debrief(ctx) {
  const r = getResult(ctx.mission), sc = ctx.mission.scenario;
  ctx.report.send({outcome: r.outcome, completed: r.completed, success: r.success, mastered: r.mastered, score: r.score, carry: {plan: r.plan, rating: r.rating, tankL: r.tankL, leakFixed: r.leakFixed, trays: r.trays}});
  const history = r.completed && !ctx.sampleMode ? pushHistory(ID, {plan: r.plan, salad: r.saladPortions, peppers: r.peppers, battery: r.batteryLeftKWh, tank: r.tankL, health: r.health}) : readHistory(ID);
  if (r.completed) ctx.view.celebrate();
  ctx.persist(ctx.mission, true); ctx.setControls();
  const title = !r.completed ? 'Practice stopped' : {feast: '🎉 A birthday feast!', salad: '🥗 Salad served!', small: '🙂 A small snack', none: '😢 Nothing to eat yet'}[r.rating];
  const story = !r.completed ? '' : r.rating === 'feast' ? '<p><b>Elena:</b> “A salad AND spicy peppers? On Mars? Best birthday ever!”</p>' : r.rating === 'salad' ? '<p><b>Elena:</b> “Fresh salad! It tastes like home. Thank you!”</p>' : '<p><b>Elena:</b> “Every leaf counts. Thank you for trying!”</p>';
  const tip = !r.completed ? 'You can try again any time.' : r.health < 80 ? 'Tip: keep the soil dial in the green. Too dry or too wet makes plants droopy.' : !r.leakFixed ? 'Tip: fix the leak quickly. It wastes water the base needs later.' : r.rating === 'salad' ? 'Tip: borrowing a little battery power on one day could grow peppers too.' : r.batteryLeftKWh < .2 ? 'Tip: you used almost all the battery. Could you save some and still feast?' : 'Great farming! Try a different plan and compare.';
  const compare = history.length > 1 ? compareTable(history.map((h, i) => i === history.length - 1 ? 'This time' : `Try ${i + 1}`), [
    {label: 'Plan', values: history.map(h => PLANS[h.plan]?.title || '—')},
    {label: 'Salad portions', values: history.map(h => h.salad), better: 'high'},
    {label: 'Peppers', values: history.map(h => h.peppers ? 'yes' : 'no')},
    {label: 'Battery left (kWh)', values: history.map(h => h.battery), better: 'high'},
    {label: 'Water left (L)', values: history.map(h => h.tank), better: 'high'},
    {label: 'Plant health %', values: history.map(h => h.health), better: 'high'}]) : '<p class="mx-last">Play again with a different plan to compare results here.</p>';
  ctx.dialog({label: 'MISSION REPORT · THE GREENHOUSE PROMISE', title, body: `${story}
    ${r.completed ? `<p>🥗 Salad: <b>${r.saladPortions}</b> of ${sc.saladGoal} portions · 🌶️ Peppers: <b>${r.peppers ? 'yes' : 'no'}</b> · 🔋 Battery left: <b>${r.batteryLeftKWh} kWh</b> · 💧 Water left: <b>${r.tankL} L</b>${r.leakedL ? ` (${r.leakedL} L leaked)` : ''} · 🌱 Plant health: <b>${r.health}%</b></p>` : ''}
    <p class="mx-tip">💡 ${tip}</p>${compare}
    <aside class="mx-detail"><b>More details</b><br>Farming on Mars means balancing power, water and time. Water left in the tank here carries on to the next mission, when a pump breaks.</aside>`,
    actions: [
      {label: '🔁 Try a different plan', primary: true, disabled: !ctx.checkpoint, run: () => ctx.retry(() => planBoard(ctx))},
      {label: '↺ Play again', run: () => ctx.restart()}, {label: '🗺️ Back to the map', run: ctx.openJourney}, {label: 'Sources', run: () => ctx.sourcesDialog(() => debrief(ctx))}]});
}

runMission({
  id: ID, title: 'The Greenhouse Promise', place: 'MISSION CONTROL JR. · MARS DAYS 32–34', carryFrom: 'solar-shelter',
  meters: [{id: 'power', icon: '⚡', label: 'Light power today'}, {id: 'battery', icon: '🔋', label: 'Battery'}, {id: 'water', icon: '💧', label: 'Water tank'}],
  create: carry => createMission({scenario: tuneScenario(ID, greenhouseScenario), initialCarry: carry}),
  rules: {applyAction, getObjective, getSteps},
  scene: async ctx => { const view = await createGreenhouseScene({container: document.getElementById('world'), getState: () => ctx.mission, act: a => ctx.act(a), onPause: () => ctx.pause(), onConsole: () => consoleScreen(ctx)}); view.world.onInspect = text => ctx.hud.toast(text, 'quiet'); return view; },
  brief, sources, debrief,
  sampler(ctx) { ctx.act({id: 'begin'}, {quiet: true}); ctx.saveCheckpoint(); ctx.act({id: 'choosePlan', payload: 'salad'}, {quiet: true}); },
  hud(ctx) {
    const s = ctx.mission, sc = s.scenario, {hud} = ctx, power = lightPower(s);
    hud.timer(s.phase === 'active' && s.plan ? (s.day > sc.growDays ? '🎂 Harvest day' : `☀️ Day ${s.day} of ${sc.growDays}`) : '');
    hud.meter('power', {value: Math.max(0, sc.powerBudgetKWh - power), max: sc.powerBudgetKWh, text: `${power.toFixed(1)} / ${sc.powerBudgetKWh} kWh`, warn: power > sc.powerBudgetKWh ? 2 : 0});
    hud.meter('battery', {value: s.batteryKWh - batteryNeeded(s), max: sc.batteryKWh, text: `${Math.max(0, s.batteryKWh - batteryNeeded(s)).toFixed(1)} kWh`});
    hud.meter('water', {value: s.tankL, max: sc.tankStartL, text: `${s.tankL.toFixed(1)} L`});
  },
});
