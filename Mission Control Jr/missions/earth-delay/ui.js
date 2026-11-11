// "Message to Earth" — story, plan board, Earth-link console and repair debrief.
import {runMission} from '../shared/controller.js';
import {planCards, compareTable} from '../shared/hud.js';
import {readHistory, pushHistory} from '../shared/runtime.js';
import {tuneScenario} from '../../simulation/difficulty.js';
import {delayScenario} from './scenario.js';
import {createMission} from './state.js';
import {applyAction, advanceMission, getObjective, getSteps, getResult, PLANS, PART_NAMES, messageProgress, earthRoundTrip, earthAnswer, waterRate} from './actions.js';
import {createDelayScene} from './scene.js';

const ID = 'earth-delay';
const min = s => Math.max(0, Math.round(s / 60));

function sources(ctx) {
  const sc = ctx.mission.scenario;
  return `<p>On <b>${sc.geometryDate.slice(0, 10)}</b>, light took <b>${(sc.oneWaySeconds / 60).toFixed(1)} minutes</b> to travel from Mars to Earth. We got this from NASA JPL’s <b>Horizons</b> system, which tracks where the planets are. <a href="https://ssd.jpl.nasa.gov/horizons/" target="_blank" rel="noopener">Try Horizons</a>.</p>
  <p>Radio messages travel at the speed of light, so nothing can make the answer come faster. Real Mars crews will need to fix many things on their own. <a href="https://www.nasa.gov/humans-in-space/the-human-body-in-space/" target="_blank" rel="noopener">Read about the hazards of deep space, including distance from Earth</a>.</p>
  <p class="mx-made-up"><b>Made up for the game:</b> ${sc.limitation}</p>`;
}
function brief(ctx) {
  const sc = ctx.mission.scenario, carry = ctx.mission.carryL;
  ctx.dialog({label: `MARS DAY ${sc.sol} · ALARM!`, title: 'The water machine broke!', body: `
    <div class="kid-mission-intro">
      <p>🚨 <b>Water Recycler Offline!</b> The habitat water machine stopped working. You have <b>${ctx.mission.waterL.toFixed(0)} litres</b> of reserve water left${carry ? ` (plus ${carry.toFixed(0)} L saved in the greenhouse)` : ''}. Earth is far away—radio signals take <b>${(sc.oneWaySeconds / 60).toFixed(0)} minutes</b> each way!</p>
    </div>
    <div class="kid-section-title">🧰 What You Need This Level</div>
    <div class="kid-supplies-grid">
      <div class="kid-supply-pill"><span class="pill-icon">📡</span><div class="pill-text"><b>Earth Link Console</b><span>Transmit diagnostic readings across deep space</span></div></div>
      <div class="kid-supply-pill"><span class="pill-icon">🧪</span><div class="pill-text"><b>Multimeter Tester</b><span>Test pump, valve &amp; filter voltages to isolate faults</span></div></div>
      <div class="kid-supply-pill"><span class="pill-icon">🔧</span><div class="pill-text"><b>Spare Parts Locker</b><span>1 spare pump, 1 spare valve, and replacement filters</span></div></div>
      <div class="kid-supply-pill"><span class="pill-icon">🚿</span><div class="pill-text"><b>Save-Water Lever</b><span>Cut daily water usage in half while troubleshooting</span></div></div>
    </div>
    <div class="kid-section-title">📋 Your Jobs (Do in order)</div>
    <ol class="kid-jobs-list">
      <li><span class="step-num">1</span><b>Turn on Save-Water Mode:</b> Flip the water conservation lever so supplies last longer.</li>
      <li><span class="step-num">2</span><b>Choose Strategy:</b> Decide whether to ask Earth, test yourself, or do both together.</li>
      <li><span class="step-num">3</span><b>Power OFF Before Repair:</b> Always switch off the electrical breaker before opening the panel!</li>
      <li><span class="step-num">4</span><b>Test &amp; Replace:</b> Use the multimeter to find the broken component, then swap in the spare.</li>
      <li><span class="step-num">5</span><b>Restore Flow &amp; Report:</b> Turn power on, verify clean water flow, and notify Earth!</li>
    </ol>
    <div class="kid-controls-bar">
      <span>🎮 <b>Controls:</b></span>
      <span><kbd>WASD</kbd> Walk</span>
      <span><kbd>Mouse</kbd> Look</span>
      <span><kbd>E</kbd> Test &amp; Swap parts</span>
      <span>Walk buttons guide you directly to each machine!</span>
    </div>
    <p><b>Luca:</b> “Our water recycler just stopped! It cleans all our water. We have <b>${ctx.mission.waterL.toFixed(0)} litres</b> left${carry ? `, including ${carry.toFixed(0)} L saved in the greenhouse tank` : ''}.”</p>
    <p><b>Elena:</b> “We can ask the experts on Earth. But Earth is far away. A message takes <b>${(sc.oneWaySeconds / 60).toFixed(0)} minutes</b> to get there, even at the speed of light, and the answer takes just as long to come back.”</p>
    <aside class="mx-detail"><b>More details</b><br>Time runs ${sc.timeScale}× faster here: one real second is ${sc.timeScale} mission seconds. The crew uses ${sc.waterUseLPerMin} L of water a minute, or ${sc.saveUseLPerMin} L in save mode.</aside>`,
    actions: [{label: '▶ Let’s fix it!', primary: true, run: () => { ctx.act({id: 'begin'}, {quiet: true}); planBoard(ctx); }}, {label: 'Is this real?', run: () => ctx.sourcesDialog(() => brief(ctx))}]});
}
function planBoard(ctx) {
  ctx.saveCheckpoint();
  const sc = ctx.mission.scenario, last = readHistory(ID).at(-1), wait = earthRoundTrip(ctx.mission, false);
  ctx.dialog({label: 'PICK A PLAN', title: 'How will you fix it?', body: `<p>An answer from Earth takes about <b>${min(wait)} mission minutes</b>. You have spares: ${sc.spares.pump} pump, ${sc.spares.valve} valve, ${sc.spares.filter} filters.</p>
    ${planCards(Object.entries(PLANS).map(([id, p]) => ({id, ...p, cost: {earth: '🐢 Slow · ✅ Sure', self: '🐇 Fast · 🎲 Risky', both: '🤝 Team · 🧠 Smart'}[id]})), last?.plan)}
    ${last ? `<p class="mx-last">Last time: <b>${PLANS[last.plan]?.title || 'a plan'}</b> · ${last.water} L water left · ${last.minutes} min. Try something new?</p>` : ''}
    <aside class="mx-detail"><b>More details</b><br>If you send your meter readings with the message, Earth can answer faster.</aside>`,
    actions: [], onOpen: body => body.querySelectorAll('[data-plan]').forEach(b => { b.onclick = () => { ctx.act({id: 'choosePlan', payload: b.dataset.plan}); ctx.close(); }; })});
}
function answerDialog(ctx) {
  const a = earthAnswer(ctx.mission); ctx.act({id: 'readAnswer'}, {quiet: true});
  ctx.dialog({label: 'MESSAGE FROM EARTH', title: '📨 Earth answered!', body: `<div class="mx-letter"><p><b>From:</b> ${a.from}</p>${a.lines.map(l => `<p>${l}</p>`).join('')}</div>`,
    actions: [{label: 'Got it!', primary: true, run: () => ctx.close()}]});
}
function consoleScreen(ctx) {
  const s = ctx.mission, sc = s.scenario, p = messageProgress(s);
  if (s.fixed) return ctx.dialog({label: 'EARTH LINK', title: 'Clean water is flowing!', body: '<p>Send Earth the good news and finish the mission.</p>', actions: [{label: '✅ Finish the mission', primary: true, run: () => { ctx.close(); ctx.act({id: 'finish'}); }}, {label: '← Back', run: () => ctx.close()}]});
  if (s.message.status === 'arrived') return answerDialog(ctx);
  const found = Object.entries(s.findings).filter(([, v]) => v).map(([k, v]) => `${PART_NAMES[k]}: ${v === 'bad' ? 'broken' : 'OK'}`);
  const waitLitres = p ? waterRate(s) * p.secondsLeft : 0;
  const body = s.message.status === 'none'
    ? `<p>A message to Earth and back takes about <b>${min(earthRoundTrip(s, found.length > 0))} mission minutes</b>.</p>${found.length ? `<p>📎 Your meter readings will be sent too: ${found.join(', ')}. That helps Earth answer faster!</p>` : '<p>Tip: if you test some parts first, Earth can answer faster.</p>'}`
    : `<p>${p.leg === 'out' ? '✉️ Your message is flying to Earth.' : p.leg === 'earth' ? '🧠 Earth is thinking about your problem.' : '✉️ The answer is flying back to Mars.'} It arrives in <b>${min(p.secondsLeft)} mission minutes</b>.</p>
       <p>If you just wait, the crew will use about <b>${waitLitres.toFixed(1)} L</b> of water${s.saveMode ? ' (save mode is on)' : '. Turn on save-water mode to use less'}. Or keep working while you wait!</p>`;
  ctx.dialog({label: 'EARTH LINK · MARS ↔ EARTH', title: s.message.status === 'none' ? 'Send a message to Earth?' : 'Waiting for Earth', body,
    actions: [
      ...(s.message.status === 'none' ? [{label: '📡 Send the message', primary: true, run: () => { ctx.act({id: 'sendMessage'}); ctx.close(); }}]
        : [{label: '⏩ Wait for the answer', primary: s.plan === 'earth', run: () => { ctx.close(); ctx.act({id: 'waitForEarth'}); if (ctx.mission.message.status === 'arrived') answerDialog(ctx); }}]),
      {label: '← Back', run: () => ctx.close()}, {label: 'Stop practice', run: () => { ctx.close(); ctx.act({id: 'stopEarly'}); }}]});
}
function debrief(ctx) {
  const r = getResult(ctx.mission);
  ctx.report.send({outcome: r.outcome, completed: r.completed, success: r.success, mastered: r.mastered, score: r.score, carry: {plan: r.plan, rating: r.rating, waterLeftL: r.waterLeftL, askedEarth: r.askedEarth}});
  const history = r.completed && !ctx.sampleMode ? pushHistory(ID, {plan: r.plan, water: r.waterLeftL, minutes: r.minutes, spares: r.sparesUsed, wasted: r.sparesWasted, fixed: r.fixed}) : readHistory(ID);
  ctx.persist(ctx.mission, true); ctx.setControls();
  const title = !r.completed ? 'Practice stopped' : !r.fixed ? '😟 The water ran low' : {great: '🏆 Super fixer!', ok: '👍 Fixed it!', low: '😅 Fixed, just in time'}[r.rating];
  const broke = `The <b>${PART_NAMES[r.broken]}</b> was broken${r.cause ? `, because the <b>${PART_NAMES[r.cause]}</b> was clogged` : ''}.`;
  const tip = !r.completed ? 'You can try again any time.' : !r.fixed ? 'Tip: turn on save-water mode early, and keep working while Earth thinks.' : r.sparesWasted ? 'Tip: test a part before you swap it, so you do not use up spares you might need later.' : !r.askedEarth ? 'You fixed it alone! Next time, try asking Earth too. What could go wrong without help?' : r.plan === 'earth' ? 'Tip: you could test parts while the message travels. Then Earth answers faster!' : 'Smart teamwork with Earth. Can you save even more water?';
  const compare = history.length > 1 ? compareTable(history.map((h, i) => i === history.length - 1 ? 'This time' : `Try ${i + 1}`), [
    {label: 'Plan', values: history.map(h => PLANS[h.plan]?.title || '—')},
    {label: 'Water left (L)', values: history.map(h => h.water), better: 'high'},
    {label: 'Mission minutes', values: history.map(h => h.minutes), better: 'low'},
    {label: 'Spares used', values: history.map(h => h.spares), better: 'low'},
    {label: 'Spares wasted', values: history.map(h => h.wasted), better: 'low'}]) : '<p class="mx-last">Play again with a different plan to compare results here.</p>';
  ctx.dialog({label: 'MISSION REPORT · MESSAGE TO EARTH', title, body: `
    ${r.completed ? `<p>${broke}</p><p>💧 Water left: <b>${r.waterLeftL} L</b> · ⏱ <b>${r.minutes}</b> mission minutes · 🔧 Spares used: <b>${r.sparesUsed}</b>${r.sparesWasted ? ` (${r.sparesWasted} not needed)` : ''} · 📡 Asked Earth: <b>${r.askedEarth ? 'yes' : 'no'}</b></p>` : ''}
    <div class="kid-lesson-box">
      <span class="lesson-badge">🎓 Space Science Lesson</span>
      <h3>What We Learned About Deep Space Communication</h3>
      <p><b>🌟 The Big Space Idea:</b> Even radio waves traveling at light speed (~300,000 km/s) take many minutes to cross interplanetary space!</p>
      <div class="lesson-fact">
        <b>🚀 Real NASA Science:</b> Today's light-travel time was calculated directly from NASA JPL's Horizons ephemeris system. Depending on planetary positions, one-way delays between Earth and Mars range between 4 and 24 minutes. That is why Mars astronauts must be trained to diagnose and fix mechanical problems independently!
      </div>
      <p><b>💡 Your Astronaut Skill:</b> When communication with Earth is delayed, careful multimeter testing and conservation buy you the precious time needed to succeed.</p>
    </div>
    <p class="mx-tip">💡 ${tip}</p>${compare}
    <aside class="mx-detail"><b>More details</b><br>On the Moon, a message to Earth takes about one second. On Mars it takes many minutes, so Mars crews must be ready to solve problems on their own.</aside>`,
    actions: [
      {label: '🔁 Try a different plan', primary: true, disabled: !ctx.checkpoint, run: () => ctx.retry(() => planBoard(ctx))},
      {label: '↺ Play again', run: () => ctx.restart()}, {label: '🗺️ Back to the map', run: ctx.openJourney}, {label: 'Sources', run: () => ctx.sourcesDialog(() => debrief(ctx))}]});
}

runMission({
  id: ID, title: 'Message to Earth', place: 'MISSION CONTROL JR. · MARS DAY 35', carryFrom: 'greenhouse',
  meters: [{id: 'water', icon: '💧', label: 'Water left'}, {id: 'earth', icon: '📡', label: 'Earth’s answer'}, {id: 'spares', icon: '🔧', label: 'Spare parts'}],
  create: carry => createMission({scenario: tuneScenario(ID, delayScenario), initialCarry: carry, seed: 42 + readHistory(ID).length}),
  rules: {applyAction, getObjective, getSteps, advance: (m, dt) => advanceMission(m, dt)},
  scene: ctx => createDelayScene({container: document.getElementById('world'), getState: () => ctx.mission, act: a => ctx.act(a), onPause: () => ctx.pause(), onConsole: () => consoleScreen(ctx)}),
  brief, sources, debrief,
  sampler(ctx) { ctx.act({id: 'begin'}, {quiet: true}); ctx.saveCheckpoint(); ctx.act({id: 'choosePlan', payload: 'both'}, {quiet: true}); },
  hud(ctx) {
    const s = ctx.mission, {hud} = ctx, p = messageProgress(s), sc = s.scenario;
    hud.timer(s.phase === 'active' && s.plan ? `⏱ Mission time ${Math.floor(s.simSeconds / 60)} min${s.saveMode ? ' · 🚿 saving' : ''}` : '', s.waterL < 8);
    hud.meter('water', {value: s.waterL, max: s.waterStartL, text: `${s.waterL.toFixed(1)} L`, warn: .3});
    hud.meter('earth', p ? {value: p.leg === 'arrived' ? 1 : 1 - p.secondsLeft / earthRoundTrip(s), max: 1, text: p.leg === 'arrived' ? 'Arrived!' : `${min(p.secondsLeft)} min`} : {value: 0, max: 1, text: 'Not sent'});
    const left = s.spares.pump + s.spares.valve + s.spares.filter, total = sc.spares.pump + sc.spares.valve + sc.spares.filter;
    hud.meter('spares', {value: left, max: total, text: `${left} of ${total}`});
  },
}).then(ctx => addEventListener('keydown', e => { if (e.code === 'KeyQ' && ctx.playing() && ctx.mission.holding) ctx.act({id: 'putBack'}); }));
