// "Arrival at Mars" — briefing, radio-part and locker choices, landing planner, hatch check and debrief.
import {runMission} from '../shared/controller.js';
import {planCards, compareTable} from '../shared/hud.js';
import {readHistory, pushHistory, snapshot, clearSaved} from '../shared/runtime.js';
import {tuneScenario} from '../../simulation/difficulty.js';
import {arrivalScenario} from './scenario.js';
import {createMission, ORBIT_SCHEMA, readLegacyOrbit} from './state.js';
import {applyAction, getObjective, getSteps, getResult, powerUsed, powerAvailable, inShadow, minutesToShadow, minutesToSun, nextPass, hazardCamReady, partLabel, loadLabel} from './actions.js';
import {createArrivalScene} from './scene.js';

import {clearApproach} from './approach-state.js';

const ID = 'orbit';
const cap = t => t[0].toUpperCase() + t.slice(1);

function sources(ctx) {
  const sc = ctx.mission.scenario;
  return `<p><b>Orbiters pass messages along.</b> Spacecraft circling Mars, like NASA’s Mars Reconnaissance Orbiter, relay radio messages between landers or rovers on the ground and Earth. <a href="https://science.nasa.gov/mission/mars-reconnaissance-orbiter/" target="_blank" rel="noopener">Mars Reconnaissance Orbiter (NASA)</a></p>
  <p><b>Orbiters fly through Mars’ shadow.</b> On every trip around, part of the orbit is on Mars’ night side. The solar panels get no sunlight there, so the spacecraft runs on its batteries.</p>
  <p><b>Landing ellipses and steering around rocks.</b> A lander cannot aim at one exact spot: it aims at an oval called a landing ellipse. In 2021, NASA’s Perseverance rover used a camera and a map (Terrain-Relative Navigation) to steer away from dangerous ground while it landed. <a href="https://science.nasa.gov/mission/mars-2020-perseverance/" target="_blank" rel="noopener">Perseverance (NASA)</a></p>
  <p class="mx-made-up"><b>Made up for the game:</b> ${sc.limitation}</p>`;
}

function brief(ctx) {
  const legacy = readLegacyOrbit();
  const note = legacy && !legacy.complete ? '<p class="mx-last">We found a game from the old version of this mission. Your journey map is kept, but this new mission starts from the beginning.</p>' : '';
  const sc = ctx.mission.scenario;
  ctx.dialog({label: 'MARS DAY 11 · ASTERIA ORBITER', title: 'Arrival at Mars', body: `${note}
    <div class="kid-mission-intro">
      <p>🛰️ <b>Welcome to Mars Orbit!</b> You have docked with the Asteria orbital station. Before descending to Meridian Base on the surface, restore station communications and prepare the lander!</p>
    </div>
    <div class="kid-dock-celebration" style="margin-bottom:12px;">
      <div class="celebration-badge-row" style="padding:8px 12px;">
        <span class="kid-trophy" style="font-size:28px;">🏆</span>
        <div class="celebration-header">
          <span class="celebration-tag">DOCKING LESSON LEARNED</span>
          <h4 style="margin:0;font-family:var(--kid-display);font-size:16px;color:#fff;">Adjust Alignment &amp; Slow Speed (&lt; 0.2 m/s)</h4>
        </div>
      </div>
      <div class="kid-nasa-fact-pill">
        🌌 <b>Space Science:</b> In outer space, zero air friction means a ship never stops moving on its own. Slow speed and bullseye aim are the keys to safe space docking!
      </div>
    </div>
    <div class="kid-section-title">🧰 What You Need This Level</div>
    <div class="kid-supplies-grid">
      <div class="kid-supply-pill"><span class="pill-icon">⚡</span><div class="pill-text"><b>Power Switches</b><span>Manage power bus between sunlight and Mars’ shadow</span></div></div>
      <div class="kid-supply-pill"><span class="pill-icon">🟨</span><div class="pill-text"><b>Signal Tester</b><span>Pinpoints which radio component is broken</span></div></div>
      <div class="kid-supply-pill"><span class="pill-icon">📶</span><div class="pill-text"><b>Spare Amplifier</b><span>Replaces burnt-out radio parts in the locker</span></div></div>
      <div class="kid-supply-pill"><span class="pill-icon">🗺️</span><div class="pill-text"><b>Landing Planner</b><span>Selects the safest landing ellipse on Mars</span></div></div>
    </div>
    <div class="kid-section-title">📋 Your Jobs (Do in order)</div>
    <ol class="kid-jobs-list">
      <li><span class="step-num">1</span><b>Manage Power:</b> Switch off unneeded circuits before orbital shadow cut-off.</li>
      <li><span class="step-num">2</span><b>Diagnose Radio:</b> Grab the tester or look closely to find the broken component.</li>
      <li><span class="step-num">3</span><b>Safely Repair:</b> Switch off power first (no zaps!), then fix or swap the part.</li>
      <li><span class="step-num">4</span><b>Pick Landing Site:</b> Check the surface beacon and lander hazard camera.</li>
      <li><span class="step-num">5</span><b>Board the Lander:</b> Pack gear, check hatch seals, and fly down to Meridian Base!</li>
    </ol>
    <div class="kid-controls-bar">
      <span>🎮 <b>Controls:</b></span>
      <span><kbd>WASD</kbd> Walk</span>
      <span><kbd>Mouse</kbd> Look</span>
      <span><kbd>E</kbd> Interact with racks &amp; consoles</span>
      <span>Walk buttons guide you directly to each station!</span>
    </div>
    <p><b>Elena:</b> “Welcome to Mars! Look out of the window. Before we fly down to Meridian Base, we have two problems.”</p>
    <p>📻 <b>The radio is quiet.</b> The base cannot hear us. Its radio beacon helps the lander find the right spot, so we want it working.</p>
    <p>⚡ <b>Power is tight.</b> The solar wings make <b>${sc.power.sun} power units</b> in sunlight. When we fly through <b>Mars’ shadow</b>, there are only <b>${sc.power.shadow}</b>.</p>
    <aside class="mx-detail"><b>More details</b><br>Always switch off the power to a part before you touch it. If you forget, the breaker trips to keep you safe, and you can reset it.</aside>`,
    actions: [{label: '▶ Let’s go!', primary: true, run: () => { ctx.act({id: 'begin'}, {quiet: true}); ctx.saveCheckpoint(); ctx.close(); }}, {label: 'Is this real?', run: () => ctx.sourcesDialog(() => brief(ctx))}]});
}

function partDialog(ctx, pid) {
  const s = ctx.mission, sc = s.scenario, p = sc.parts[pid], powered = s.loads[p.load] && !s.tripped;
  const isAmp = pid === 'amp', hasSpare = s.holding === 'amp';
  const zapsBefore = s.zaps;
  const run = action => { ctx.close(); ctx.act(action); if (ctx.mission.zaps > zapsBefore) ctx.view.zap(pid); };
  ctx.dialog({label: 'RADIO RACK', title: cap(p.label), body: `
    <p>This part gets its power from the <b>${loadLabel(s, p.load)}</b> switch, which is <b>${powered ? 'ON ⚡' : 'OFF'}</b>.</p>
    ${powered ? '<p class="mx-tip">⚠️ Switch it off at the power panel before you touch this part.</p>' : ''}
    ${isAmp && !hasSpare ? '<p>To swap the amplifier, bring the spare one from the spares locker.</p>' : ''}`,
    actions: [
      {label: `🔍 Look closely (${sc.minutes.inspect} min)`, primary: !s.diagnosed, run: () => run({id: 'inspect', targetId: pid})},
      {label: `🔧 ${p.fix} (${isAmp ? sc.minutes.swapAmp : sc.minutes.fix} min)`, primary: s.diagnosed === pid, disabled: isAmp && !hasSpare, run: () => run({id: 'fixPart', targetId: pid})},
      {label: '← Back', run: () => ctx.close()}]});
}

function lockerDialog(ctx) {
  const s = ctx.mission;
  if (s.holding) { ctx.act({id: 'putBack'}); return; }
  ctx.dialog({label: 'SPARES LOCKER', title: 'What do you need?', body: `<p>🟨 The <b>signal tester</b> clips onto the radio rack. When you test, it lights up the exact part that is broken.</p><p>📶 The <b>spare amplifier</b> replaces a burnt-out one. There is only one!</p>`,
    actions: [
      {label: '🟨 Take the signal tester', primary: s.tester === 'case' && !s.diagnosed, disabled: s.tester !== 'case', run: () => { ctx.close(); ctx.act({id: 'take', payload: 'tester'}); }},
      {label: '📶 Take the spare amplifier', primary: s.diagnosed === 'amp', disabled: s.spareAmp !== 'case', run: () => { ctx.close(); ctx.act({id: 'take', payload: 'amp'}); }},
      {label: '← Back', run: () => ctx.close()}]});
}

function timeLine(s) {
  const pass = nextPass(s) - s.minute;
  return `🕐 Next pass over Meridian Base in <b>${pass} min</b> · ${inShadow(s) ? `🌑 In Mars’ shadow for <b>${minutesToSun(s)} more min</b>` : `🌑 Shadow in <b>${minutesToShadow(s)} min</b>`}`;
}

function planner(ctx) {
  const s = ctx.mission, sc = s.scenario, cam = hazardCamReady(s);
  const size = s.comms ? Math.round(sc.ellipseKm * sc.beaconShrink * 10) / 10 : sc.ellipseKm;
  const options = Object.entries(sc.sites).map(([id, site]) => ({id, icon: site.icon, title: site.label, text: site.text, cost: `🚙 ${site.km} km from base · ${site.ground}`}));
  ctx.dialog({label: 'LANDING PLANNER', title: 'Where shall we land?', body: `
    <p>The yellow oval on the table is the <b>landing ellipse</b>: we will land somewhere inside it. Green ground is smooth.</p>
    <p>${s.comms ? '📻 Base beacon <b>ON</b>' : '📻 Base beacon <b>OFF</b> (radio broken)'} → ellipse about <b>${size} km</b> long · ${cam ? '📷 Hazard camera <b>READY</b>: the lander can steer away from rocks' : `📷 Hazard camera needs ${sc.lander.hazardCamAt}% charge (now <b>${Math.round(s.charge)}%</b>)`}</p>
    ${planCards(options, s.site)}
    <p class="mx-last">${timeLine(s)}</p>`,
    actions: [{label: `⏩ Wait ${sc.minutes.wait} minutes`, run: () => { ctx.act({id: 'wait'}, {quiet: true}); planner(ctx); }}, {label: 'Close', primary: !!s.site, run: () => ctx.close()}],
    onOpen: body => body.querySelectorAll('[data-plan]').forEach(b => { b.onclick = () => { ctx.act({id: 'chooseSite', payload: b.dataset.plan}, {quiet: true}); planner(ctx); }; })});
}

function hatch(ctx) {
  const s = ctx.mission, sc = s.scenario;
  if (!s.site) { ctx.hud.toast('Pick a landing site at the planner table first.', 'warn'); return; }
  const site = sc.sites[s.site], warn = [];
  const land = async cameraView => {
    ctx.checkpoint = snapshot(ctx.mission);
    ctx.close(); const r = ctx.act({id: 'board'}); if (!r.ok) return;
    ctx.busy = true; ctx.setControls();
    try {
      await ctx.view.fly(cameraView);
    } finally {
      ctx.busy = false; ctx.setControls();
    }
    ctx.act({id: 'touchdown'}, {quiet: true});
  };
  if (!s.comms) warn.push('📻 The radio is still broken, so the base beacon is off. The landing ellipse is big.');
  if (!hazardCamReady(s)) warn.push(`📷 The lander is ${Math.round(s.charge)}% charged. The hazard camera needs ${sc.lander.hazardCamAt}% to steer around rocks.`);
  ctx.dialog({label: 'LANDER HATCH', title: 'Ready to land?', body: `
    <p>Site: <b>${site.icon} ${site.label}</b> (${site.ground}).</p>
    ${warn.length ? `<ul class="mx-howto">${warn.map(w => `<li>${w}</li>`).join('')}</ul>` : '<p>✅ Beacon on and hazard camera ready. Everything looks good!</p>'}
    <p class="mx-last">${timeLine(s)}. We undock on that pass.</p>
    <p><b>Choose your view:</b> look through the cockpit window, or watch the lander from outside.</p>`,
    actions: [
      {label: '🚀 Land · First person', primary: true, run: () => land('cockpit')},
      {label: '🎥 Land · Outside camera', run: () => land('exterior')},
      {label: 'Not yet', run: () => ctx.close()}]});
}

function talk(ctx, who) {
  const s = ctx.mission, sc = s.scenario;
  if (who === 'window') { ctx.hud.toast(inShadow(s) ? `🌑 We are over Mars’ night side. Sunlight comes back in ${minutesToSun(s)} minutes.` : `☀️ Mars below us! Shadow in ${minutesToShadow(s)} minutes. Then we have only ${sc.power.shadow} power units.`, 'quiet'); return; }
  let line;
  if (who === 'jin') line = !s.comms ? '“There are three ways to find a broken part. Clip on the tester and test. Look closely at each part. Or just try fixing one… but guessing takes longer.”' : '“The radio works! Now the lander. Charging it uses 3 power units, so switch something else off first.”';
  else if (s.tripped) line = '“The breaker tripped. That keeps us safe. Reset it with the yellow handle, then switch things on one at a time.”';
  else if (!s.comms) line = s.diagnosed ? `“You found it: the ${partLabel(s, s.diagnosed)}. Remember, switch off its power first!”` : '“Let’s test the radio first. The test needs the Radio, the Amplifier and the Antenna motor all on.”';
  else if (!hazardCamReady(s)) line = `“If the lander gets to ${sc.lander.hazardCamAt}% charge, its hazard camera can steer us away from rocks. Charge it while we are in sunlight!”`;
  else line = '“Radio on, lander charged. Pick a site at the planner table, and let’s go home!”';
  ctx.dialog({label: who === 'jin' ? 'JIN · ENGINEER' : 'ELENA · COMMANDER', title: who === 'jin' ? 'Jin says' : 'Elena says', body: `<p>${line}</p><p class="mx-last">${timeLine(s)} · ⚡ ${powerUsed(s)} of ${powerAvailable(s)} power units</p>`, actions: [{label: 'Thanks!', primary: true, run: () => ctx.close()}]});
}

function debrief(ctx) {
  clearApproach();
  const r = getResult(ctx.mission), sc = ctx.mission.scenario, L = r.landing;
  ctx.report.send({outcome: r.outcome, completed: r.completed, success: r.success, mastered: r.mastered, score: r.score,
    carry: {comms: r.comms, site: r.site, landing: L ? (L.rough ? 'rough' : 'smooth') : null, distanceKm: L?.distanceKm ?? null, passIndex: r.passIndex, arrivalMinute: r.minute}});
  const history = r.completed && !ctx.sampleMode ? pushHistory(ID, {site: r.site, comms: r.comms, charge: r.charge, landing: L.rough ? 'bumpy' : L.diverted ? 'steered' : 'smooth', km: L.distanceKm, pass: r.passIndex + 1, minute: r.minute}) : readHistory(ID);
  ctx.persist(ctx.mission, true); ctx.setControls();
  const site = r.site ? sc.sites[r.site] : null;
  const title = !r.completed ? 'Practice stopped' : L.rough ? '😬 A bumpy landing' : L.diverted ? '🎯 Steered to safety!' : '🎉 A smooth landing!';
  const story = !r.completed ? '' : L.rough ? `<p>The lander came down on ${site.ground}. Bump! One leg got bent, but everyone is safe.</p>` : L.diverted ? '<p>The lander saw rocks below and steered to smooth ground. Just like Perseverance did!</p>' : '<p>Touchdown on smooth ground. Perfect!</p>';
  const tip = !r.completed ? 'You can try again any time.'
    : L.rough && !r.comms ? 'Tip: fix the radio first. The base beacon makes the landing ellipse much smaller.'
      : L.rough ? `Tip: charge the lander to ${sc.lander.hazardCamAt}% so its hazard camera can steer around rocks.`
        : r.zaps ? 'Tip: switch off a part’s power before you touch it. Then the breaker will not trip.'
          : r.coldMinutes ? 'Tip: keep the heaters on in Mars’ shadow. It gets cold fast!'
            : L.distanceKm > 4 ? 'Tip: a far landing site is safe, but it is a long drive to the base. Can you land closer?'
              : 'Great flying! Try a different site or a different way to find the broken part.';
  const compare = history.length > 1 ? compareTable(history.map((h, i) => i === history.length - 1 ? 'This time' : `Try ${i + 1}`), [
    {label: 'Site', values: history.map(h => sc.sites[h.site]?.label || '—')},
    {label: 'Radio fixed', values: history.map(h => h.comms ? 'yes' : 'no')},
    {label: 'Lander charge %', values: history.map(h => h.charge), better: 'high'},
    {label: 'Landing', values: history.map(h => h.landing)},
    {label: 'Km to base', values: history.map(h => h.km), better: 'low'},
    {label: 'Pass', values: history.map(h => h.pass), better: 'low'}]) : '<p class="mx-last">Play again with a different plan to compare results here.</p>';
  ctx.dialog({label: 'MISSION REPORT · ARRIVAL AT MARS', title, body: `${story}
    ${r.completed ? `<p>${site.icon} <b>${site.label}</b> · 🚙 <b>${L.distanceKm} km</b> from the base · 📻 Radio: <b>${r.comms ? 'fixed' : 'broken'}</b> · 🔋 Lander: <b>${r.charge}%</b> · 🕐 Pass <b>${r.passIndex + 1}</b>${r.trips ? ` · ⚡ Breaker trips: <b>${r.trips}</b>` : ''}${r.coldMinutes ? ` · 🥶 Cold: <b>${r.coldMinutes} min</b>` : ''}</p>` : ''}
    <div class="kid-lesson-box">
      <span class="lesson-badge">🎓 Space Science Lesson</span>
      <h3>What We Learned in Mars Orbit</h3>
      <p><b>🌟 The Big Space Idea:</b> Every spacecraft orbiting a planet passes through darkness on every lap. When solar panels enter the planet's shadow, battery power and heat become critical!</p>
      <div class="lesson-fact">
        <b>🚀 Real NASA Science:</b> NASA orbiters like the Mars Reconnaissance Orbiter (MRO) use solar arrays in sunlight and switch seamlessly to rechargeable nickel-hydrogen batteries while passing behind Mars. They also relay radio communications between surface rovers and Earth!
      </div>
      <p><b>💡 Your Astronaut Skill:</b> Always isolate electrical circuits before touching hardware to prevent accidental shorts and breaker trips.</p>
    </div>
    <p class="mx-tip">💡 ${tip}</p>${compare}
    <aside class="mx-detail"><b>More details</b><br>The broken part was the <b>${partLabel(ctx.mission, r.fault)}</b>. ${r.usedTester ? 'You found it with the tester.' : r.inspected ? 'You found it by looking closely.' : 'You found it by trying fixes.'} Next, the base gets ready for a dust storm. ${r.comms ? 'Because the radio works, the base heard about the storm early.' : ''}</aside>`,
    actions: [
      {label: '🔁 Try the landing again', primary: true, disabled: !ctx.checkpoint || !r.completed, run: () => ctx.retry(() => { ctx.view.returnToInterior?.(); ctx.close(); })},
      {label: '↺ Play again (new broken part)', run: () => ctx.restart()}, {label: '🗺️ Back to the map', run: ctx.openJourney}, {label: 'Sources', run: () => ctx.sourcesDialog(() => debrief(ctx))}]});
}

runMission({
  id: ID, schema: ORBIT_SCHEMA, migrate: () => null, title: 'Arrival at Mars', place: 'MISSION CONTROL JR. · MARS DAY 11 · IN ORBIT',
  meters: [{id: 'power', icon: '⚡', label: 'Power used'}, {id: 'charge', icon: '🔋', label: 'Lander charge'}],
  create: () => createMission({scenario: tuneScenario(ID, arrivalScenario)}),
  rules: {applyAction, getObjective, getSteps},
  scene: async ctx => {
    const view = await createArrivalScene({container: document.getElementById('world'), getState: () => ctx.mission, act: a => ctx.act(a), onPause: () => ctx.pause(),
      openPart: pid => partDialog(ctx, pid), openCase: () => lockerDialog(ctx), openPlanner: () => planner(ctx), openHatch: () => hatch(ctx), talk: who => talk(ctx, who)});
    view.world.onInspect = text => ctx.hud.toast(text, 'quiet'); return view;
  },
  brief, sources, debrief,
  ready(ctx) {
    // Replay includes the Mars opening and docking; landing-only retry stays in the cabin.
    ctx.restart = () => { clearSaved(ID); clearApproach(); location.reload(); };
  },
  sampler(ctx) { ctx.act({id: 'begin'}, {quiet: true}); ctx.saveCheckpoint(); },
  hud(ctx) {
    const s = ctx.mission, used = powerUsed(s), avail = powerAvailable(s), {hud} = ctx;
    hud.timer(s.phase === 'active' ? (s.stage === 'descent' ? '🚀 Landing' : `${inShadow(s) ? '🌑' : '☀️'} Pass in ${nextPass(s) - s.minute} min`) : '');
    hud.meter('power', {value: Math.max(0, avail - used), max: avail, text: s.tripped ? 'TRIPPED' : `${used} / ${avail}`, warn: s.tripped || used > avail ? 2 : !inShadow(s) && minutesToShadow(s) <= 10 && used > s.scenario.power.shadow ? 1 : 0});
    hud.meter('charge', {value: s.charge, max: 100, text: `${Math.round(s.charge)}%${hazardCamReady(s) ? ' 📷' : ''}`});
  },
});
