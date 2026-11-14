// "The Greenhouse Promise" — story, plan board, day console and birthday-dinner debrief.
import {runMission} from '../shared/controller.js';
import {openPipLesson} from '../../professor-pip.js';
import {planCards, compareTable} from '../shared/hud.js';
import {readHistory, pushHistory} from '../shared/runtime.js';
import {tuneScenario} from '../../simulation/difficulty.js';
import {greenhouseScenario} from './scenario.js';
import {createMission, BEDS, GREENHOUSE_SAVE_SCHEMA, migrateGreenhouseState} from './state.js';
import {applyAction, getObjective, getInstruction, getSteps, getResult, PLANS, lightPower, batteryNeeded, isReady, moistureState, leafSurfaceState} from './actions.js';
import {createGreenhouseScene} from './scene.js';

const ID = 'greenhouse';

function sources(ctx) {
  const sc = ctx.mission.scenario, ref = sc.lightReference;
  return `<p><b>NASA OSDR OSD-269:</b> ISS red romaine lettuce used <b>${sc.lightHours} hours of light and ${sc.darkHours} hours of dark</b> in a 24-hour photoperiod. The VEG-03A pillows received about <b>${ref.parUmolM2S} µmol/m²/s PAR</b> at the center, with a <b>${ref.redBlueGreen.join(':')}</b> red:blue:green LED ratio. The LED array was about <b>${ref.ledDistanceCm[0]}–${ref.ledDistanceCm[1]} cm</b> above the baseplate. These are study conditions, not universal crop settings or values calculated by the game's light lever. <a href="https://osdr.nasa.gov/bio/repo/data/studies/OSD-269" target="_blank" rel="noopener">Open the NASA study record</a>.</p>
  <p><b>Airflow lesson:</b> the OSD-269 research paper describes a fan readout that showed “LOW” after power was cycled even though the fan was actually off. The researchers reported excess early moisture, likely associated with a fan malfunction. They also explain that incomplete environmental logging means microbial findings cannot be causally assigned to those chamber conditions. <a href="https://doi.org/10.3389/fpls.2020.00199" target="_blank" rel="noopener">Read the peer-reviewed study</a>. The in-game controller reset is fictional practice, not NASA's documented repair procedure.</p>
  <p><b>Growing in space:</b> NASA's Veggie system uses plant pillows and controlled water delivery. Root-zone water and air matter, and watering in microgravity needs special care. <a href="https://www.nasa.gov/exploration-research-and-technology/growing-plants-in-space/" target="_blank" rel="noopener">NASA: Growing Plants in Space</a> · <a href="https://science.nasa.gov/science-research/science-enabling-technology/technology-highlights/how-do-you-water-plants-in-space/" target="_blank" rel="noopener">NASA: Plant Water Management</a>.</p>
  <p>The <b>2022 Life Support Baseline Values and Assumptions Document</b> is a broad engineering reference for comparing life-support systems. It is not a single lettuce watering recipe, and this game does not copy its numerical tables into the crop model. <a href="https://ntrs.nasa.gov/citations/20210024855" target="_blank" rel="noopener">Open the NASA BVAD record</a>.</p>
  <p class="mx-made-up"><b>Made up for the game:</b> ${sc.limitation}</p>`;
}
function brief(ctx) {
  const rested = ctx.mission.crewRested ? '<p>After the Sun storm, the crew is rested and ready to farm.</p>' : '';
  ctx.briefing({label: 'DESTINATION: VERDANT BIO-DOME · DISTANCE: 225M KM · MARS DAYS 32–34', title: 'A birthday promise', body: `${rested}
    <p class="mission-destination-tag">📍 <b>Destination:</b> Verdant Bio-Dome · 🚀 <b>Distance:</b> 225,000,000 km from Earth</p>
    <div class="kid-mission-intro">
      <p><b>Amara:</b> “It’s Elena’s birthday in three days. I promised her a fresh salad. Can you help me care for the crops and prepare a feast?”</p>
    </div>
    <div class="mission-brief-steps">
      <p>📋 <b>Greenhouse Care Checklist:</b></p>
      <ul>
        <li>📋 <b>1. Farming Plan:</b> Choose how to share the daily solar light between lettuce, mizuna greens, and peppers.</li>
        <li>🌀 <b>2. Check the Fan:</b> Verify actual air movement (if the readout says LOW, reset the controller!).</li>
        <li>💧 <b>3. Water the Beds:</b> Check each bed’s soil moisture and turn valves until moisture is in the green zone.</li>
        <li>🔧 <b>4. Fix Leaky Hose:</b> If a water pipe drips, close the red valve, replace the hose, and reopen it!</li>
        <li>🥗 <b>5. Harvest & Birthday Feast:</b> Pick ripe crops with your basket and serve Elena’s birthday dinner!</li>
      </ul>
    </div>
    <p>🎮 <b>Controls:</b> WASD / Arrows to walk, Drag to look, <b>E</b> to adjust light levers, water valves, and carry the harvest basket.</p>
    <p>🌟 <i>Fresh plants bring oxygen and joy to the crew. Mission Control will guide you every day!</i></p>
    <aside class="mx-detail"><b>NASA study details</b><br>OSD-269 used a 16-hour light / 8-hour dark schedule. The VEG-03A lettuce pillows received about 200 µmol/m²/s of photosynthetically active radiation at the centre of the unit, with a 12:3:1 red:blue:green LED ratio. NASA's VEG-01A and VEG-01B lettuce crops were first harvested after 33 days. This game starts with established plants and skips time; its two practice growing periods are not real seed-to-harvest times. These are measured ISS study conditions; the game's light settings are simplified power choices.</aside>`,
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
  const fan = s.fanRunning ? 'RUNNING' : s.airflowChecked ? 'OFF · reset needed' : `${s.fanStatusReported} reading · check the vent`;
  const leaves = leafSurfaceState(s);
  ctx.dialog({label: `GREENHOUSE · MARS DAY ${sc.startSol + s.day - 1}`, title: harvestDay ? 'Harvest day!' : `Day ${s.day} of ${sc.growDays}: end the day?`, body: `
    <table class="mx-compare"><thead><tr><th>Bed</th><th>Light</th><th>Soil</th><th>Grown</th></tr></thead><tbody>${rows}</tbody></table>
    <p>⚡ Lights tonight: <b>${power.toFixed(2)} kWh</b> of ${sc.powerBudgetKWh} kWh solar${need > 0 ? ` · <b>${need.toFixed(2)} kWh</b> from the battery` : ''}. 🔋 Battery left: <b>${s.batteryKWh.toFixed(2)} kWh</b>. 💧 Tank: <b>${s.tankL.toFixed(1)} L</b>.</p>
    <p>🌀 Fan: <b>${fan}</b> · 🍃 Leaf surfaces: <b>${leaves}</b> (separate from soil moisture).</p>
    ${need > s.batteryKWh + 1e-9 ? '<p class="mx-tip">⚠️ Not enough power for all these lights. Turn one down.</p>' : ''}
    ${harvestDay ? '<p>Pick the ready plants with the basket. At the table, check leaf surfaces and clean handling before serving.</p>' : ''}`,
    actions: [
      ...(!harvestDay ? [{label: '🌙 End the day', primary: true, run: async () => {
        const r = ctx.act({id: 'endDay'}); if (!r.ok) return; ctx.close(); ctx.busy = true; await ctx.view.nightfall(); ctx.busy = false;
      }}] : []),
      {label: '← Back', run: () => ctx.close()}, {label: 'Stop practice', run: () => { ctx.close(); ctx.act({id: 'stopEarly'}); }}]});
}
function debrief(ctx) {
  const r = getResult(ctx.mission), sc = ctx.mission.scenario;
  ctx.report.send({outcome: r.outcome, completed: r.completed, success: r.success, mastered: r.mastered, score: r.score, carry: {plan: r.plan, rating: r.rating, tankL: r.tankL, leakFixed: r.leakFixed, trays: r.trays, airflowRestored: r.airflowRestored, leafSurface: r.leafSurface, harvestChecked: r.harvestChecked}});
  const history = r.completed && !ctx.sampleMode ? pushHistory(ID, {plan: r.plan, salad: r.saladPortions, peppers: r.peppers, battery: r.batteryLeftKWh, tank: r.tankL, health: r.health, airflow: r.airflowRestored, leafSurface: r.leafSurface, harvestChecked: r.harvestChecked}) : readHistory(ID);
  if (r.completed) ctx.view.celebrate();
  ctx.persist(ctx.mission, true); ctx.setControls();
  const title = !r.completed ? 'Practice stopped' : {feast: '🎉 A birthday feast!', salad: '🥗 Salad served!', small: '🙂 A small snack', none: '😢 Nothing to eat yet'}[r.rating];
  const story = !r.completed ? '' : r.rating === 'feast' ? '<p><b>Elena:</b> “A salad AND spicy peppers? On Mars? Best birthday ever!”</p>' : r.rating === 'salad' ? '<p><b>Elena:</b> “Fresh salad! It tastes like home. Thank you!”</p>' : '<p><b>Elena:</b> “Every leaf counts. Thank you for trying!”</p>';
  const tip = !r.completed ? 'You can try again any time.' : !r.airflowRestored ? 'The fan read LOW, but checking the vent showed that it was off. Verify airflow, not just the indicator.' : r.leafSurface === 'damp' ? 'Air moving through the greenhouse helps leaf surfaces dry. Leaf-surface dampness is not the same as wet soil.' : r.health < 80 ? 'Tip: keep the soil dial in the green. Too dry or too wet makes plants droopy.' : !r.leakFixed ? 'Tip: fix the leak quickly. It wastes water the base needs later.' : r.rating === 'salad' ? 'Tip: borrowing a little battery power on one day could grow peppers too.' : r.batteryLeftKWh < .2 ? 'Tip: you used almost all the battery. Could you save some and still feast?' : 'Great farming! Try a different plan and compare.';
  const compare = history.length > 1 ? compareTable(history.map((h, i) => i === history.length - 1 ? 'This time' : `Try ${i + 1}`), [
    {label: 'Plan', values: history.map(h => PLANS[h.plan]?.title || '—')},
    {label: 'Salad portions', values: history.map(h => h.salad), better: 'high'},
    {label: 'Peppers', values: history.map(h => h.peppers ? 'yes' : 'no')},
    {label: 'Battery left (kWh)', values: history.map(h => h.battery), better: 'high'},
    {label: 'Water left (L)', values: history.map(h => h.tank), better: 'high'},
    {label: 'Plant health %', values: history.map(h => h.health), better: 'high'},
    {label: 'Airflow restored', values: history.map(h => h.airflow ? 'yes' : 'no')},
    {label: 'Leaf surface', values: history.map(h => h.leafSurface || 'not recorded')},
    {label: 'Harvest check', values: history.map(h => h.harvestChecked ? 'yes' : 'no')}]) : '<p class="mx-last">Play again with a different plan to compare results here.</p>';
  ctx.dialog({label: 'MISSION REPORT · THE GREENHOUSE PROMISE', title, body: `${story}
    ${r.completed ? `<p>🥗 Salad: <b>${r.saladPortions}</b> of ${sc.saladGoal} portions · 🌶️ Peppers: <b>${r.peppers ? 'yes' : 'no'}</b> · 🔋 Battery left: <b>${r.batteryLeftKWh} kWh</b> · 💧 Water left: <b>${r.tankL} L</b>${r.leakedL ? ` (${r.leakedL} L leaked)` : ''} · 🌱 Plant health: <b>${r.health}%</b></p>` : ''}
    <div class="kid-lesson-box">
      <span class="lesson-badge">🎓 Space Science Lesson</span>
      <h3>What We Learned in the Space Greenhouse</h3>
      <p><b>🌟 The Big Space Idea:</b> Space crops need moving air as well as water and light—stagnant air traps moisture on leaf surfaces, encouraging bacteria!</p>
      <div class="lesson-fact">
        <b>🚀 Real NASA Science:</b> In NASA’s OSD-269 plant experiment on the International Space Station, researchers found a fan anomaly where a controller displayed "LOW" even when the fan was off. Checking real air movement and optimizing a 16:8 light schedule (like you used today) is crucial for real space agriculture! <a href="https://doi.org/10.3389/fpls.2020.00199" target="_blank" rel="noopener">Read the study</a>
      </div>
      <p><b>💡 Your Astronaut Skill:</b> Fresh green food is a huge psychological and nutritional boost for astronauts on long-duration planetary missions.</p>
    </div>
    <p class="mx-tip">💡 ${tip}</p>${compare}
    <aside class="mx-detail"><b>More details</b><br>The fan clue is inspired by the OSD-269 research paper. Its LOW/off anomaly is documented; the reset action, moisture index and stress values in this game are authored. The clean-basket step is a handling reminder, not a test for microbes. A visual check cannot certify food safety. The salad is a fresh-food supplement, not the crew's full diet. Water left in the tank carries on to the next mission, when a pump breaks.</aside>`,
    actions: [
      {label: '🎓 Pip’s debrief lesson', primary: true, run: () => openPipLesson(ID, {deck: ID, step: 0, autoVoice: true, finishLabel: 'Back to report', onFinish: () => debrief(ctx)})},
      {label: '🔁 Try a different plan', disabled: !ctx.checkpoint, run: () => ctx.retry(() => planBoard(ctx))},
      {label: '↺ Play again', run: () => ctx.restart()}, {label: '🗺️ Back to the map', run: ctx.openJourney}, {label: 'Sources', run: () => ctx.sourcesDialog(() => debrief(ctx))}]});
}

runMission({
  id: ID, schema: GREENHOUSE_SAVE_SCHEMA, migrate: migrateGreenhouseState,
  title: 'The Greenhouse Promise', place: 'MISSION CONTROL JR. · VERDANT BIO-DOME · 225M KM FROM EARTH', carryFrom: 'solar-shelter',
  meters: [{id: 'power', icon: '⚡', label: 'Light power today'}, {id: 'battery', icon: '🔋', label: 'Battery'}, {id: 'water', icon: '💧', label: 'Water tank'}],
  create: carry => createMission({scenario: tuneScenario(ID, greenhouseScenario), initialCarry: carry}),
  rules: {applyAction, getObjective, getInstruction, getSteps},
  scene: async ctx => { const view = await createGreenhouseScene({container: document.getElementById('world'), getState: () => ctx.mission, act: a => ctx.act(a), onPause: () => ctx.pause(), onConsole: () => consoleScreen(ctx)}); view.world.onInspect = text => ctx.hud.toast(text, 'quiet'); return view; },
  brief, sources, debrief, resumePlan: planBoard,
  sampler(ctx) { ctx.act({id: 'begin'}, {quiet: true}); ctx.saveCheckpoint(); ctx.act({id: 'choosePlan', payload: 'salad'}, {quiet: true}); },
  hud(ctx) {
    const s = ctx.mission, sc = s.scenario, {hud} = ctx, power = lightPower(s);
    hud.timer(s.phase === 'active' && s.plan ? (s.day > sc.growDays ? '🎂 Harvest day' : `☀️ Day ${s.day} of ${sc.growDays}`) : '');
    hud.meter('power', {value: Math.max(0, sc.powerBudgetKWh - power), max: sc.powerBudgetKWh, text: `${power.toFixed(1)} / ${sc.powerBudgetKWh} kWh`, warn: power > sc.powerBudgetKWh ? 2 : 0});
    hud.meter('battery', {value: s.batteryKWh - batteryNeeded(s), max: sc.batteryKWh, text: `${Math.max(0, s.batteryKWh - batteryNeeded(s)).toFixed(1)} kWh`});
    hud.meter('water', {value: s.tankL, max: sc.tankStartL, text: `${s.tankL.toFixed(1)} L`});
  },
});
