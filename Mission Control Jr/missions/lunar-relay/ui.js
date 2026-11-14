// "Over the Hill" — story, trip plan, rover drives, Earth's live help and the debrief.
import {runMission} from '../shared/controller.js';
import {openPipLesson} from '../../professor-pip.js';
import {planCards, compareTable} from '../shared/hud.js';
import {readHistory, pushHistory} from '../shared/runtime.js';
import {tuneScenario} from '../../simulation/difficulty.js';
import {lunarRelayScenario} from './scenario.js';
import {createMission} from './state.js';
import {applyAction, getObjective, getInstruction, getSteps, getResult, PLANS, NEXT, hasLink, batteryHome, suitLeft} from './actions.js';
import {createRelayScene} from './scene.js';

const ID = 'lunar-relay';

function sources(ctx) {
  const sc = ctx.mission.scenario;
  return `<p>Radio waves travel in straight lines. On the Moon there is no air to bend them, so a hill between two radios blocks the signal. NASA engineers study how radio travels across the lunar surface for future Artemis crews. <a href="https://www.nasa.gov/glenn/glenn-expertise-space-exploration/scan/lunar-surface-propagation/" target="_blank" rel="noopener">NASA Glenn: lunar surface radio</a>.</p>
  <p>On ${sc.geometryDate.slice(0, 10)}, light (and radio) took about <b>${sc.oneWaySeconds} seconds</b> to go from the Moon to Earth. That number comes from NASA JPL’s Horizons system. Mars is much farther: there it takes many minutes.</p>
  <p class="mx-made-up"><b>Made up for the game:</b> ${sc.limitation}</p>`;
}

function brief(ctx) {
  const sc = ctx.mission.scenario;
  ctx.briefing({label: 'DESTINATION: SADDLE RIDGE · DISTANCE: 384,400 KM · MOON SOUTH POLE', title: 'Over the Hill', body: `
    <p class="mission-destination-tag">📍 <b>Destination:</b> Saddle Ridge & Hollow · 🚀 <b>Distance:</b> 384,400 km from Earth (1.2 km rover trip)</p>
    <div class="kid-mission-intro">
      <p><b>Jin:</b> “Earth scientists requested a deep core soil sample from Shadow Hollow. But once you drive over the ridge and into the crater, the hills will completely block our radio signal!”</p>
    </div>
    <div class="mission-brief-steps">
      <p>📋 <b>Expedition Checklist:</b></p>
      <ul>
        <li>🗺️ <b>1. Trip Plan:</b> Choose whether to deploy a radio relay antenna on the ridge or drive directly into the hollow.</li>
        <li>📡 <b>2. Deploy Relay:</b> Set up the tripod radio dish atop Saddle Ridge so you can talk to base from anywhere.</li>
        <li>🚙 <b>3. Drive into Shadow Hollow:</b> Navigate down the crater slopes while watching your battery reserves.</li>
        <li>🧪 <b>4. Drill Core Sample:</b> Take the drill off the rover, extract the lunar regolith sample, and stow it securely.</li>
        <li>🏠 <b>5. Return Safely:</b> Drive back to Horizon Base with plenty of battery and suit oxygen to spare!</li>
      </ul>
    </div>
    <p>🎮 <b>Controls:</b> WASD / Arrows to drive, Space to brake, <b>E</b> to get out, grab the drill, or deploy the relay antenna.</p>
    <p>🌟 <i>Watch your battery and air meters closely! Mission Control will alert you at every step!</i></p>
    <aside class="mx-detail"><b>More details</b><br>The rover starts at ${sc.batteryStart}% battery and you have ${sc.suitMinutes} minutes of suit air. A message from the Moon reaches Earth in about ${sc.oneWaySeconds} seconds.</aside>`,
    actions: [{label: '▶ Let’s go!', primary: true, run: () => { ctx.act({id: 'begin'}, {quiet: true}); planBoard(ctx); }}, {label: 'Is this real?', run: () => ctx.sourcesDialog(() => brief(ctx))}]});
}

function planBoard(ctx) {
  ctx.saveCheckpoint();
  const last = readHistory(ID).at(-1);
  ctx.dialog({label: 'PLAN THE TRIP', title: 'How will you talk to the base?', body: `<p>You can change your mind on the way. Your plan is just where you start.</p>
    ${planCards(Object.entries(PLANS).map(([id, p]) => ({id, ...p, cost: {relay: '⏱ More time · 📶 Always in touch', direct: '⏱ Faster · 📵 Quiet behind the hill'}[id]})), last?.plan)}
    ${last ? `<p class="mx-last">Last time: <b>${PLANS[last.plan]?.title || '—'}</b> · 🧪 ${last.cores} core${last.cores === 1 ? '' : 's'} · 🔋 ${last.battery}% left · 📵 ${last.quiet} quiet minutes. Try something new?</p>` : ''}`,
    actions: [], onOpen: body => body.querySelectorAll('[data-plan]').forEach(b => { b.onclick = () => { ctx.act({id: 'choosePlan', payload: b.dataset.plan}); ctx.close(); }; })});
}

function driveDialog(ctx) {
  const s = ctx.mission, sc = s.scenario;
  const cards = NEXT[s.at].map(to => {
    const leg = sc.legs[`${s.at}>${to}`], after = s.battery - leg.battery;
    const homeAfter = batteryHome({...s, at: to});
    return {id: to, icon: to === 'base' ? '🏠' : to === 'saddle' ? '⛰️' : '🕳️', title: sc.stops[to].name,
      text: to === 'hollow' ? (hasLink({...s, at: 'hollow'}) ? 'The relay can hear you down there. 📶' : 'Behind the hill: no radio down there. 📵') : to === 'saddle' ? 'Top of the ridge. The base can see you here.' : 'Back home to Horizon Base.',
      cost: `🔋 −${leg.battery}% · ⏱ ${leg.minutes} min${homeAfter > after ? ' · ⚠️ not enough to get home!' : ''}`};
  });
  const warn = s.hand ? '<p class="mx-tip">Put down what you are holding first.</p>' : s.drill !== 'rover' ? '<p class="mx-tip">Put the drill back on the rover first.</p>' : '';
  ctx.dialog({label: 'ROVER · DRIVE', title: 'Where to?', body: `<p>🔋 Battery <b>${s.battery}%</b> · you need <b>${batteryHome(s)}%</b> to get home from here.</p>${warn}${planCards(cards)}`,
    actions: [{label: '← Stay here', run: () => ctx.close()}],
    onOpen: body => body.querySelectorAll('[data-plan]').forEach(b => { b.onclick = () => driveTo(ctx, b.dataset.plan); })});
}
async function driveTo(ctx, to) {
  const s = ctx.mission;
  if (s.hand || s.drill !== 'rover') { ctx.close(); ctx.act({id: 'drive', payload: to}); return; }
  ctx.close(); ctx.busy = true; ctx.setControls();
  try { await ctx.view.drive(to, ctx.sampleMode ? .4 : 7); } catch (e) { console.error(e); }
  ctx.busy = false; ctx.act({id: 'drive', payload: to}); ctx.setControls();
}

function debrief(ctx) {
  const r = getResult(ctx.mission), s = ctx.mission;
  ctx.report.send({outcome: r.outcome, completed: r.completed, success: r.success, mastered: r.mastered, score: r.score, carry: {plan: r.plan, rating: r.rating, cores: r.cores}});
  const history = r.completed && !ctx.sampleMode ? pushHistory(ID, {plan: r.plan, minutes: r.minutes, battery: r.battery, suit: r.suitLeft, cores: r.cores, quiet: r.quietMinutes, live: r.live}) : readHistory(ID);
  ctx.persist(ctx.mission, true); ctx.setControls();
  const title = !r.completed ? (s.stoppedEarly ? 'Practice stopped' : '😮‍💨 Suit air ran low') : {great: '🏆 Over the hill!', ok: '👍 Home with science', low: '🙂 Home safe, but no core'}[r.rating];
  const tip = !r.completed ? 'Tip: plan your drives so you have air and battery to get home.'
    : r.rescued ? 'Tip: the rover ran flat. Watch the white mark on the battery bar: that is what you need to get home.'
    : !r.cores ? 'Tip: drill a core in Shadow Hollow before you come home.'
    : r.live ? 'You talked to Earth live from behind the hill! The relay cost time, but you got extra science. Could a quick trip save battery?'
    : 'Quick and safe! But nobody could hear you in the hollow. Could a relay on the ridge let Earth help you?';
  const compare = history.length > 1 ? compareTable(history.map((h, i) => i === history.length - 1 ? 'This time' : `Try ${i + 1}`), [
    {label: 'Plan', values: history.map(h => PLANS[h.plan]?.title || '—')},
    {label: 'Cores', values: history.map(h => h.cores), better: 'high'},
    {label: 'Sent live', values: history.map(h => h.live), better: 'high'},
    {label: 'Quiet minutes', values: history.map(h => h.quiet), better: 'low'},
    {label: 'Battery left (%)', values: history.map(h => h.battery), better: 'high'},
    {label: 'Suit air left (min)', values: history.map(h => h.suit), better: 'high'}]) : '<p class="mx-last">Play again with the other plan to compare here.</p>';
  ctx.dialog({label: 'MISSION REPORT · OVER THE HILL', title, body: `
    ${r.completed ? `<p>🧪 Cores: <b>${r.cores}</b> · 📶 Sent live: <b>${r.live}</b> · 📵 Out of touch: <b>${r.quietMinutes} min</b></p>
      <p>🔋 Battery left: <b>${r.battery}%</b> · 🧑‍🚀 Suit air left: <b>${r.suitLeft} min</b> · ⏱ ${r.minutes} min${r.relayUsed ? ` · 📡 relay mast ${(s.scenario.relay.baseM + r.stages * s.scenario.relay.stageM).toFixed(1)} m` : ''}</p>` : ''}
    <div class="kid-lesson-box">
      <span class="lesson-badge">🎓 Space Science Lesson</span>
      <h3>What We Learned About Lunar Radio</h3>
      <p><b>🌟 The Big Space Idea:</b> High-frequency radio signals travel in straight lines ("line of sight"). On the Moon, without an air layer to bounce waves, crater walls create dead zones!</p>
      <div class="lesson-fact">
        <b>🚀 Real NASA Science:</b> NASA’s Artemis program and Glenn Research Center study surface radio propagation for polar lunar missions. Future astronauts exploring shadowed lunar craters will deploy hilltop relay stations and communicate through orbiting lunar Gateway relays. <a href="https://www.nasa.gov/glenn/glenn-expertise-space-exploration/scan/lunar-surface-propagation/" target="_blank" rel="noopener">Learn more at NASA Glenn</a>
      </div>
      <p><b>💡 Your Astronaut Skill:</b> Always establish a communications link before venturing into hazardous, unmapped territory.</p>
    </div>
    <p class="mx-tip">💡 ${tip}</p>${compare}
    <aside class="mx-detail"><b>More details</b><br>The Moon is so close that Earth hears you about ${s.scenario.oneWaySeconds} seconds later, if your radio can reach. Future Artemis crews will use relays and satellites so they can talk from behind hills and craters.</aside>`,
    actions: [
      {label: '🎓 Pip’s debrief lesson', primary: true, run: () => openPipLesson(ID, {deck: ID, step: 0, autoVoice: true, finishLabel: 'Back to report', onFinish: () => debrief(ctx)})},
      {label: '🔁 Try a different plan', disabled: !ctx.checkpoint, run: () => ctx.retry(() => planBoard(ctx))},
      {label: '↺ Play again', run: () => ctx.restart()}, {label: '🗺️ Back to the map', run: ctx.openJourney}, {label: 'Sources', run: () => ctx.sourcesDialog(() => debrief(ctx))}]});
}

runMission({
  id: ID, title: 'Over the Hill', place: 'MISSION CONTROL JR. · MOON SOUTH POLE · 384,400 KM FROM EARTH',
  meters: [{id: 'battery', icon: '🔋', label: 'Rover battery'}, {id: 'suit', icon: '🧑‍🚀', label: 'Suit air'}, {id: 'radio', icon: '📶', label: 'Radio'}],
  create: () => createMission({scenario: tuneScenario(ID, lunarRelayScenario), seed: 42 + readHistory(ID).length}),
  rules: {applyAction, getObjective, getInstruction, getSteps},
  scene: ctx => createRelayScene({container: document.getElementById('world'), getState: () => ctx.mission, act: a => ctx.act(a), onPause: () => ctx.pause(), onDrive: () => driveDialog(ctx)}),
  brief, sources, debrief, resumePlan: planBoard,
  sampler(ctx) { ctx.act({id: 'begin'}, {quiet: true}); ctx.saveCheckpoint(); },
  hud(ctx) {
    const s = ctx.mission, sc = s.scenario, {hud} = ctx, link = hasLink(s), home = batteryHome(s);
    hud.timer(s.phase === 'active' && s.plan ? `🧑‍🚀 ${suitLeft(s)} min · ${link ? '📶 Signal' : '📵 No signal'}` : '', suitLeft(s) <= sc.lowSuitMinutes);
    hud.meter('battery', {value: s.battery, max: 100, text: `${s.battery}% · need ${home}%`, warn: (home + sc.batteryReserve) / 100});
    hud.meter('suit', {value: suitLeft(s), max: sc.suitMinutes, text: `${suitLeft(s)} min`, warn: .2});
    const queued = s.messages.filter(m => m.status === 'queued').length;
    hud.meter('radio', {value: link ? 1 : 0, max: 1, text: link ? (queued ? 'Sending…' : 'Signal') : queued ? `No signal · ${queued} waiting` : 'No signal'});
  },
});
