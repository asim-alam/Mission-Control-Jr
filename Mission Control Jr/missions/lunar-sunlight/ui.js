// "Chasing the Sun" — story, pad choice, base console, 18-day time-lapse and debrief.
import {runMission} from '../shared/controller.js';
import {planCards, compareTable} from '../shared/hud.js';
import {readHistory, pushHistory} from '../shared/runtime.js';
import {tuneScenario} from '../../simulation/difficulty.js';
import {lunarSunScenario} from './scenario.js';
import {createMission} from './state.js';
import {applyAction, getObjective, getSteps, getResult, PLANS, runWatch, cableNeeded, panelHeight, sunShare} from './actions.js';
import {createSunScene} from './scene.js';

const ID = 'lunar-sunlight';
const pct = f => `${Math.round(f * 100)}%`;

function sources(ctx) {
  const sc = ctx.mission.scenario;
  return `<p>NASA’s <b>LOLA</b> laser altimeter mapped how often each spot near the Moon’s south pole is in sunlight. Averaged over ${sc.lola.years} years, one real spot gets sunlight <b>${pct(sc.lola.near)}</b> of the time, and a real spot on a high ridge gets <b>${pct(sc.lola.ridge)}</b>. <a href="https://pgda.gsfc.nasa.gov/products/69" target="_blank" rel="noopener">See the LOLA sunlight maps</a>.</p>
  <p>Near the pole, the Sun never climbs high. It slides around the horizon, so hills cast very long shadows, and higher places stay sunny longer. That is why NASA plans tall solar towers for the Moon. <a href="https://www.nasa.gov/reference/moonbase-environment/" target="_blank" rel="noopener">NASA: the Moon’s south pole</a>.</p>
  <p class="mx-made-up"><b>Made up for the game:</b> ${sc.limitation}</p>`;
}

function brief(ctx) {
  const sc = ctx.mission.scenario;
  ctx.dialog({label: 'MOON · SOUTH POLE · HORIZON BASE', title: 'Chasing the Sun', body: `
    <div class="kid-mission-intro">
      <p>☀️🔆 <b>Capture the Low Polar Sun!</b> Near the Moon’s South Pole, the Sun never climbs high—it skims right along the horizon, casting colossal shadows. Build a tall solar tower to capture sunlight for Horizon Base!</p>
    </div>
    <div class="kid-section-title">🧰 What You Need This Level</div>
    <div class="kid-supplies-grid">
      <div class="kid-supply-pill"><span class="pill-icon">🛒</span><div class="pill-text"><b>Mobile Tower Cart</b><span>Tows the telescoping solar mast to high elevation pads</span></div></div>
      <div class="kid-supply-pill"><span class="pill-icon">▲</span><div class="pill-text"><b>Telescoping Mast</b><span>Lifts solar panels high above crater shadows</span></div></div>
      <div class="kid-supply-pill"><span class="pill-icon">🔌</span><div class="pill-text"><b>High-Voltage Cable</b><span>Carries solar electric power back to base sockets</span></div></div>
      <div class="kid-supply-pill"><span class="pill-icon">☀️</span><div class="pill-text"><b>Sun Tracker Sensor</b><span>Rotates panels to track the low circling Sun</span></div></div>
    </div>
    <div class="kid-section-title">📋 Your Jobs (Do in order)</div>
    <ol class="kid-jobs-list">
      <li><span class="step-num">1</span><b>Tow Cart to Pad:</b> Grab the cart handle and position it on the Near Pad or Ridge Pad.</li>
      <li><span class="step-num">2</span><b>Deploy Legs &amp; Raise Mast:</b> Put stabilizer legs down, then hold ▲ to elevate the mast.</li>
      <li><span class="step-num">3</span><b>Open Solar Wings:</b> Unfold photovoltaic wings and turn on automatic sun tracking.</li>
      <li><span class="step-num">4</span><b>Plug Cable into Base:</b> Carry the heavy cable plug back to the base power socket.</li>
      <li><span class="step-num">5</span><b>Set Power Plan &amp; Watch:</b> Choose a power strategy and watch 18 days of sunlight at the console!</li>
    </ol>
    <div class="kid-controls-bar">
      <span>🎮 <b>Controls:</b></span>
      <span><kbd>WASD</kbd> / <kbd>Arrows</kbd> Walk &amp; Turn</span>
      <span><kbd>E</kbd> Grab cart handle &amp; plug</span>
      <span>Hold <kbd>E</kbd> / <kbd>▲</kbd> to raise the mast stages</span>
    </div>
    <p><b>Jin:</b> “Welcome to Horizon Base! Down here the Sun stays low, right on the horizon. Hills make <b>giant shadows</b>.”</p>
    <p><b>Elena:</b> “Our new solar mast is on that cart. Tow it to a pad, raise it up, and run the cable back to the base. Then the battery stays full and our science keeps running!”</p>
    <aside class="mx-detail"><b>More details</b><br>The panel makes ${sc.panelKW} kW in sunlight. The base needs ${sc.essentialKW} kW to stay warm, and science uses ${sc.scienceKW} kW more. The battery holds ${sc.batteryKWh} kWh.</aside>`,
    actions: [{label: '▶ Let’s go!', primary: true, run: () => { ctx.act({id: 'begin'}, {quiet: true}); planBoard(ctx); }}, {label: 'Is this real?', run: () => ctx.sourcesDialog(() => brief(ctx))}]});
}

function planBoard(ctx) {
  ctx.saveCheckpoint();
  const s = ctx.mission, sc = s.scenario, last = readHistory(ID).at(-1);
  const cards = Object.entries(PLANS).map(([id, p]) => ({id, ...p, cost: `🚶 ${sc.pads[id].towMinutes + sc.pads[id].carryMinutes} suit min · 🔌 ${Math.round(cableNeeded(s, id))} m cable`}));
  ctx.dialog({label: 'PICK A PAD', title: 'Where will the solar mast go?', body: `<p>You have <b>${sc.cableM} m</b> of cable and <b>${sc.suitMinutes} minutes</b> of suit air. A taller mast peeks over more shadows, but every stage takes time.</p>
    ${planCards(cards, last?.pad)}
    ${last ? `<p class="mx-last">Last time: <b>${PLANS[last.pad]?.title || '—'}</b>, mast ${last.height} m · ☀️ ${last.sun}% sunny · 🥶 ${last.cold} cold hours. Try something new?</p>` : ''}
    <aside class="mx-detail"><b>More details</b><br>Real NASA numbers: one spot near the pole is sunny ${pct(sc.lola.near)} of the time, a ridge spot ${pct(sc.lola.ridge)}. Our pads are made up, but they work the same way.</aside>`,
    actions: [], onOpen: body => body.querySelectorAll('[data-plan]').forEach(b => { b.onclick = () => { ctx.act({id: 'choosePlan', payload: b.dataset.plan}); ctx.close(); }; })});
}

function consoleScreen(ctx) {
  const s = ctx.mission, sc = s.scenario;
  if (!s.tracker) {
    const todo = [!s.legs && '🛒 Set up the cart on a pad', s.legs && s.stages < 1 && '▲ Raise the mast', s.stages > 0 && !s.wings && '🪽 Open the solar wings', s.plug !== 'port' && '🔌 Plug the cable into the base', '☀️ Turn on the Sun tracker'].filter(Boolean);
    return ctx.dialog({label: 'BASE CONSOLE', title: 'The panel is not ready yet', body: `<p><b>Jin:</b> “Before we can watch the days go by, the panel has to make power.”</p><ul class="mx-howto">${todo.map(t => `<li>${t}</li>`).join('')}</ul><p>🔋 Battery: <b>${s.batteryKWh.toFixed(0)} of ${sc.batteryKWh} kWh</b></p>`,
      actions: [{label: '← Back', primary: true, run: () => ctx.close()}, {label: 'Stop practice', run: () => { ctx.close(); ctx.act({id: 'stopEarly'}); }}]});
  }
  const share = sunShare(s, s.cart, panelHeight(s));
  ctx.dialog({label: 'BASE CONSOLE · POWER PLAN', title: 'How should the base use power?', body: `<p>☀️ Your panel is <b>${panelHeight(s).toFixed(1)} m</b> high on the <b>${sc.pads[s.cart].name}</b>. The forecast says it is sunny <b>${pct(share)}</b> of the next ${sc.window.days} days.</p>
    ${planCards([{id: 'science', icon: '🔬', title: 'Science all the time', text: 'More science, but the battery may run flat in long shadows.', cost: '🔬 More · 🔋 Risky'}, {id: 'save', icon: '🌙', title: 'Save in the dark', text: 'Science pauses when the panel is in shadow. The base stays warm.', cost: '🔬 Less · 🔋 Safe'}], s.savePlan)}
    <aside class="mx-detail"><b>More details</b><br>In shadow, the base keeps using ${sc.essentialKW} kW to stay warm. The battery holds ${sc.batteryKWh} kWh, enough for about ${Math.round(sc.batteryKWh / sc.essentialKW)} hours of darkness with no science.</aside>`,
    actions: [{label: `⏩ Watch ${sc.window.days} days`, primary: true, disabled: !s.savePlan, run: () => watchDays(ctx)}, {label: '← Back', run: () => ctx.close()}],
    onOpen: body => body.querySelectorAll('[data-plan]').forEach(b => { b.onclick = () => { ctx.act({id: 'powerPlan', payload: b.dataset.plan}, {quiet: true}); consoleScreen(ctx); }; })});
}

async function watchDays(ctx) {
  ctx.close(); ctx.busy = true; ctx.setControls();
  const preview = runWatch(ctx.mission);
  ctx.hud.toast(`Watching ${ctx.mission.scenario.window.days} days go by…`, 'info');
  try { await ctx.view.timelapse(preview, ctx.sampleMode ? .5 : 9); } catch (e) { console.error(e); }
  ctx.busy = false; ctx.act({id: 'watch'}, {quiet: true});
}

function debrief(ctx) {
  const r = getResult(ctx.mission);
  ctx.view?.restoreLights?.();
  ctx.report.send({outcome: r.outcome, completed: r.completed, success: r.success, mastered: r.mastered, score: r.score, carry: {pad: r.pad, height: r.height, rating: r.rating, coldHours: r.coldHours}});
  const history = r.completed && !ctx.sampleMode ? pushHistory(ID, {pad: r.pad, height: r.height, sun: r.sunShare, science: r.scienceHours, cold: r.coldHours, suit: r.suitLeft, plan: r.savePlan}) : readHistory(ID);
  ctx.persist(ctx.mission, true); ctx.setControls();
  const days = ctx.mission.scenario.window.days;
  const title = !r.completed ? (ctx.mission.stoppedEarly ? 'Practice stopped' : '😮‍💨 Out of suit air') : {great: '🏆 Sun chaser!', ok: '👍 The base stayed powered', low: '🥶 The base got cold'}[r.rating];
  const tip = !r.completed ? (ctx.mission.stoppedEarly ? 'You can try again any time.' : 'Tip: the ridge is far away. Plan your trip so you do not waste suit air.')
    : r.coldHours > 0 ? (r.stages < 3 ? 'Tip: a taller mast peeks over hill shadows. Try raising it more, or try the ridge.' : 'Tip: in the dark, pause science to save the battery.')
    : r.rating === 'great' ? (r.pad === 'near' ? 'Great! The near pad worked because your mast was tall. Could the ridge give even more?' : 'The ridge is sunny, but it cost a lot of suit air. Could the near pad work with a tall mast?')
    : 'The base stayed warm! Can you find a way to run more science?';
  const compare = history.length > 1 ? compareTable(history.map((h, i) => i === history.length - 1 ? 'This time' : `Try ${i + 1}`), [
    {label: 'Pad', values: history.map(h => PLANS[h.pad]?.title || '—')},
    {label: 'Mast height (m)', values: history.map(h => h.height), better: 'high'},
    {label: 'Sunny (%)', values: history.map(h => h.sun), better: 'high'},
    {label: 'Science hours', values: history.map(h => h.science), better: 'high'},
    {label: 'Cold hours', values: history.map(h => h.cold), better: 'low'},
    {label: 'Suit air left (min)', values: history.map(h => h.suit), better: 'high'}]) : '<p class="mx-last">Play again with a different pad or mast height to compare here.</p>';
  ctx.dialog({label: 'MISSION REPORT · CHASING THE SUN', title, body: `
    ${r.completed ? `<p>${PLANS[r.pad].icon} <b>${PLANS[r.pad].title}</b> · mast <b>${r.height} m</b> · ☀️ sunny <b>${r.sunShare}%</b> of ${days} days · 🔌 ${r.cableM} m of cable</p>
      <p>🔬 Science ran <b>${r.scienceHours}</b> hours · 🥶 Cold hours: <b>${r.coldHours}</b> · 🔋 Lowest battery: <b>${r.minBattery} kWh</b> · 🧑‍🚀 Suit air left: <b>${r.suitLeft} min</b></p>` : ''}
    <div class="kid-lesson-box">
      <span class="lesson-badge">🎓 Space Science Lesson</span>
      <h3>What We Learned About Lunar Sunlight</h3>
      <p><b>🌟 The Big Space Idea:</b> Because the Moon's axis is barely tilted (only 1.5°), the Sun always circles close to the horizon at the lunar poles. Deep craters remain pitch black, while tall peaks stay in almost eternal sunlight!</p>
      <div class="lesson-fact">
        <b>🚀 Real NASA Science:</b> NASA’s Lunar Reconnaissance Orbiter (LOLA) measured sunlight across the Moon's South Pole for over 18 years. High ridges around craters like Shackleton receive up to 86% annual sunlight, which is why NASA plans to install tall solar towers there for Artemis bases! <a href="https://pgda.gsfc.nasa.gov/products/69" target="_blank" rel="noopener">See LOLA maps</a>
      </div>
      <p><b>💡 Your Astronaut Skill:</b> Elevated ground provides continuous energy in space—mastering terrain is the key to surviving long nights.</p>
    </div>
    <p class="mx-tip">💡 ${tip}</p>${compare}
    <aside class="mx-detail"><b>More details</b><br>NASA’s Artemis plans look for “peaks of near-eternal light”: high rims near the pole that are sunny most of the time. Real spots still have some shadow, so a base needs batteries too.</aside>`,
    actions: [
      {label: '🔁 Try a different plan', primary: true, disabled: !ctx.checkpoint, run: () => ctx.retry(() => planBoard(ctx))},
      {label: '↺ Play again', run: () => ctx.restart()}, {label: '🗺️ Back to the map', run: ctx.openJourney}, {label: 'Sources', run: () => ctx.sourcesDialog(() => debrief(ctx))}]});
}

runMission({
  id: ID, title: 'Chasing the Sun', place: 'MISSION CONTROL JR. · MOON SOUTH POLE',
  meters: [{id: 'suit', icon: '🧑‍🚀', label: 'Suit air'}, {id: 'battery', icon: '🔋', label: 'Base battery'}, {id: 'cable', icon: '🔌', label: 'Cable'}],
  create: () => createMission({scenario: tuneScenario(ID, lunarSunScenario), seed: 42 + readHistory(ID).length}),
  rules: {applyAction, getObjective, getSteps},
  scene: ctx => createSunScene({container: document.getElementById('world'), getState: () => ctx.mission, act: a => ctx.act(a), onPause: () => ctx.pause(), onConsole: () => consoleScreen(ctx)}),
  brief, sources, debrief,
  sampler(ctx) { ctx.act({id: 'begin'}, {quiet: true}); ctx.saveCheckpoint(); },
  hud(ctx) {
    const s = ctx.mission, sc = s.scenario, {hud} = ctx;
    hud.timer(s.phase === 'active' && s.plan ? `🧑‍🚀 Suit air ${Math.round(s.suitMinutes)} min` : '', s.suitMinutes <= sc.lowSuitMinutes);
    hud.meter('suit', {value: s.suitMinutes, max: sc.suitMinutes, text: `${Math.round(s.suitMinutes)} min`, warn: .2});
    hud.meter('battery', {value: s.batteryKWh, max: sc.batteryKWh, text: `${s.batteryKWh.toFixed(0)} kWh`});
    let used = 0;
    if (s.plug === 'port') used = cableNeeded(s);
    else if (s.plug === 'hand') { const c = ctx.view.cartPosition(), p = ctx.view.world.player.position; used = Math.hypot(p.x - c.x, p.z - c.z); }
    hud.meter('cable', {value: sc.cableM - used, max: sc.cableM, text: s.plug === 'reel' ? `${sc.cableM} m on reel` : `${Math.round(used)} of ${sc.cableM} m`, warn: .1});
  },
});
