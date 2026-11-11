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

let currentStationStep = 0;
let stationLessonActive = false;
let stationStepCompleted = false;
let stationLessonContext = null;
let stationLessonEl = null;

const STATION_PRACTICAL_STEPS = [
  {
    step: 1,
    title: 'Step 1 of 4: Move Around in Zero-G',
    badge: 'CADET STATION TRAINING · STEP 1 OF 4',
    desc: 'In space orbit, you float in microgravity! Press <kbd class="lesson-kbd">W</kbd><kbd class="lesson-kbd">A</kbd><kbd class="lesson-kbd">S</kbd><kbd class="lesson-kbd">D</kbd> or click the button below to walk inside Asteria.',
    btnHtml: '<span class="btn-icon">🚶</span> Walk Forward (W)',
    subhint: 'Tip: Press W/A/S/D on your keyboard, use walk buttons, or click this button!',
    okText: 'Floating in free fall! Because Asteria is in orbit, you and the station fall around Mars together—creating weightlessness!',
    run(ctx) {
      if (ctx.view?.world?.player) {
        ctx.view.world.player.position.z -= 1.5;
        ctx.view.world.player.syncCamera?.();
      }
    }
  },
  {
    step: 2,
    title: 'Step 2 of 4: Window & Space Friction',
    badge: 'CADET STATION TRAINING · STEP 2 OF 4',
    desc: 'Head over to the 🪐 Window to look down at Mars (or click "Walk to Window" below). Notice how fast we move!',
    btnHtml: '<span class="btn-icon">🪐</span> Walk to Panoramic Window',
    subhint: 'Tip: Click this button, or click "🪐 Window" in the WALK TO menu at bottom left!',
    okText: 'Zero air friction! In outer space there is NO air resistance. Asteria glides in orbit at 3.5 km/s forever without needing engine fuel!',
    run(ctx) {
      ctx.view?.walk?.('window');
    }
  },
  {
    step: 3,
    title: 'Step 3 of 4: Power Management & Shadow',
    badge: 'CADET STATION TRAINING · STEP 3 OF 4',
    desc: 'Walk to the ⚡ Power Panel. Every orbit, Asteria passes into Mars\' dark shadow where solar wings stop making power!',
    btnHtml: '<span class="btn-icon">⚡</span> Walk to Power Panel',
    subhint: 'Tip: Click this button, or walk to the power panel in the hall.',
    okText: 'Smart power management! In shadow, solar power drops to 6 units. Switch off unneeded gear so you never trip the main breaker!',
    run(ctx) {
      ctx.view?.walk?.('panel');
    }
  },
  {
    step: 4,
    title: 'Step 4 of 4: Safe Repair & Spares',
    badge: 'CADET STATION TRAINING · STEP 4 OF 4',
    desc: 'Walk to the 📻 Radio Rack to test the signal, or check 🧰 Spares for the signal tester.',
    btnHtml: '<span class="btn-icon">📻</span> Walk to Radio Rack',
    subhint: 'Tip: Click this button, or walk to the radio rack in the main bay.',
    okText: 'Test first, power off before fixing! Never touch a live circuit—always turn its power switch OFF first to prevent breaker trips!',
    run(ctx) {
      ctx.view?.walk?.('rack');
    }
  }
];

function closeStationLesson() {
  stationLessonActive = false;
  if (stationLessonEl) {
    stationLessonEl.hidden = true;
  }
}

function speakStationText(text) {
  try {
    const s = window.speechSynthesis;
    if (s) {
      s.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      u.pitch = 1.2;
      s.speak(u);
    }
  } catch {}
}

function renderStationStep(index) {
  const step = STATION_PRACTICAL_STEPS[index];
  if (!step || !stationLessonEl) return;
  stationStepCompleted = false;

  const badgeEl = stationLessonEl.querySelector('#station-lesson-badge');
  const titleEl = stationLessonEl.querySelector('#station-step-title');
  const descEl = stationLessonEl.querySelector('#station-step-desc');
  const promptBox = stationLessonEl.querySelector('#station-prompt-action');
  const actionBtn = stationLessonEl.querySelector('#station-action-btn');
  const subhintEl = stationLessonEl.querySelector('#station-subhint');
  const okBox = stationLessonEl.querySelector('#station-ok-feedback');
  const okTextEl = stationLessonEl.querySelector('#station-ok-text');
  const nextBtn = stationLessonEl.querySelector('#station-next-step-btn');
  const dots = stationLessonEl.querySelectorAll('#station-lesson-dots .dot');

  if (badgeEl) badgeEl.textContent = step.badge;
  if (titleEl) titleEl.textContent = step.title;
  if (descEl) descEl.innerHTML = step.desc;
  if (actionBtn) actionBtn.innerHTML = step.btnHtml;
  if (subhintEl) subhintEl.textContent = step.subhint;
  if (promptBox) promptBox.hidden = false;
  if (okBox) okBox.hidden = true;

  dots.forEach((dot, i) => {
    dot.className = i === index ? 'dot active' : i < index ? 'dot done' : 'dot';
  });

  if (nextBtn) {
    nextBtn.textContent = index >= STATION_PRACTICAL_STEPS.length - 1 ? '🎓 Complete Training ➔' : 'Next ➔';
  }
}

function completeStationStep() {
  if (stationStepCompleted || !stationLessonActive) return;
  stationStepCompleted = true;
  const step = STATION_PRACTICAL_STEPS[currentStationStep];
  if (!step || !stationLessonEl) return;

  const promptBox = stationLessonEl.querySelector('#station-prompt-action');
  const okBox = stationLessonEl.querySelector('#station-ok-feedback');
  const okTextEl = stationLessonEl.querySelector('#station-ok-text');
  const nextBtn = stationLessonEl.querySelector('#station-next-step-btn');

  if (promptBox) promptBox.hidden = true;
  if (okBox) okBox.hidden = false;
  if (okTextEl) okTextEl.textContent = step.okText;

  speakStationText(step.okText);

  if (nextBtn) nextBtn.focus();
}

function advanceStationLesson() {
  if (currentStationStep < STATION_PRACTICAL_STEPS.length - 1) {
    currentStationStep++;
    renderStationStep(currentStationStep);
  } else {
    finishStationLesson();
  }
}

function finishStationLesson() {
  closeStationLesson();
  if (stationLessonContext?.hud?.toast) {
    stationLessonContext.hud.toast('🎉 Cadet Training Complete! All practical lessons learned! Fix the radio, charge the lander, and pick your landing site!', 'info');
  }
  speakStationText('Outstanding work, Cadet! All practical station lessons complete! Now restore the radio, charge the lander, and pick your landing zone on Mars.');
}

function startStationLesson(ctx, stepIndex = 0) {
  stationLessonContext = ctx;
  stationLessonActive = true;
  currentStationStep = stepIndex;

  if (!stationLessonEl) {
    stationLessonEl = document.createElement('section');
    stationLessonEl.id = 'station-lesson';
    stationLessonEl.className = 'flight-lesson-card';
    stationLessonEl.setAttribute('role', 'region');
    stationLessonEl.setAttribute('aria-label', 'Cadet station practical training');
    stationLessonEl.innerHTML = `
      <div class="lesson-top-bar">
        <div class="lesson-badge-pill">
          <span class="lesson-badge-icon">🎓</span>
          <span id="station-lesson-badge">CADET STATION TRAINING · STEP 1 OF 4</span>
        </div>
        <button id="station-lesson-skip-btn" type="button" class="lesson-close-btn" title="Skip practice and explore station">Skip practice ✕</button>
      </div>
      <div class="lesson-content">
        <h3 id="station-step-title"></h3>
        <p id="station-step-desc"></p>
        <div class="lesson-interactive-area">
          <div id="station-prompt-action" class="lesson-prompt-action">
            <button id="station-action-btn" type="button" class="lesson-test-btn"></button>
            <small class="lesson-subhint" id="station-subhint"></small>
          </div>
          <div id="station-ok-feedback" class="lesson-ok-box" hidden>
            <div class="lesson-ok-msg">
              <span class="ok-badge">✅ OK!</span>
              <span id="station-ok-text"></span>
            </div>
            <button id="station-next-step-btn" type="button" class="primary lesson-next-btn">Next ➔</button>
          </div>
        </div>
      </div>
      <div class="lesson-dots" id="station-lesson-dots" aria-hidden="true">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    `;
    document.body.appendChild(stationLessonEl);

    stationLessonEl.querySelector('#station-lesson-skip-btn').onclick = () => closeStationLesson();
    stationLessonEl.querySelector('#station-action-btn').onclick = () => {
      const step = STATION_PRACTICAL_STEPS[currentStationStep];
      step?.run(stationLessonContext);
      completeStationStep();
    };
    stationLessonEl.querySelector('#station-next-step-btn').onclick = () => advanceStationLesson();

    window.addEventListener('keydown', e => {
      if (!stationLessonActive) return;
      if (!stationStepCompleted) {
        if (currentStationStep === 0 && ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
          completeStationStep();
        }
      } else if (e.code === 'Enter' || e.code === 'Space') {
        e.preventDefault();
        advanceStationLesson();
      }
    });
  }

  stationLessonEl.hidden = false;
  renderStationStep(currentStationStep);
}

function brief(ctx) {
  const legacy = readLegacyOrbit();
  const note = legacy && !legacy.complete ? '<p class="mx-last">We found a game from the old version of this mission. Your journey map is kept, but this new mission starts from the beginning.</p>' : '';
  ctx.dialog({
    label: 'MARS DAY 11 · ASTERIA ORBITER',
    title: 'Arrival at Mars',
    body: `${note}
    <div class="kid-mission-intro" style="text-align:center;padding:12px 14px;">
      <div style="font-size:48px;margin-bottom:6px;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4));">🏆</div>
      <div class="celebration-tag" style="display:inline-block;margin-bottom:8px;background:rgba(255,210,63,0.18);color:var(--kid-yellow);border:1.5px solid rgba(255,210,63,0.5);border-radius:14px;padding:4px 14px;font-weight:800;font-size:12px;letter-spacing:.08em;">DOCKING COMPLETE · HATCH SEALED</div>
      <h3 style="font-family:var(--kid-display);font-size:22px;color:#fff;margin:6px 0 10px;">Welcome aboard Asteria Station!</h3>
      <p style="font-size:15px;color:var(--kid-soft);margin:0 0 14px;line-height:1.45;">
        <b>Commander Elena:</b> “Great docking, Cadet Jin! Hatch is sealed and pressurized. Let's step onto the deck and check station systems hands-on!”
      </p>
      <div class="kid-nasa-fact-pill" style="text-align:left;display:inline-block;padding:10px 16px;background:rgba(76,201,255,0.12);border:1.5px solid var(--kid-sky);border-radius:14px;color:#eef2f5;font-size:13px;line-height:1.4;">
        🚀 <b>Practical Station Training:</b> Inside the station, follow the step-by-step practical guide to move in zero-g, check Mars through the window, manage shadow power, and safely fix the radio!
      </div>
    </div>`,
    actions: [
      {
        label: '▶ Start Station Practice ➔',
        primary: true,
        run: () => {
          ctx.act({id: 'begin'}, {quiet: true});
          ctx.saveCheckpoint();
          ctx.close();
          startStationLesson(ctx);
        }
      },
      {
        label: 'Is this real?',
        run: () => ctx.sourcesDialog(() => brief(ctx))
      }
    ]
  });
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

    // Header shortcut button for station practical lesson
    const actionsBar = document.querySelector('.mx-actions');
    if (actionsBar && !document.getElementById('station-practice-btn')) {
      const btn = document.createElement('button');
      btn.id = 'station-practice-btn';
      btn.type = 'button';
      btn.textContent = '🎓 Practical Lesson';
      btn.title = 'Practice zero-g movement, orbit science and power management';
      btn.onclick = () => startStationLesson(ctx, 0);
      actionsBar.insertBefore(btn, actionsBar.firstChild);
    }
  },
  sampler(ctx) { ctx.act({id: 'begin'}, {quiet: true}); ctx.saveCheckpoint(); },
  hud(ctx) {
    const s = ctx.mission, used = powerUsed(s), avail = powerAvailable(s), {hud} = ctx;
    hud.timer(s.phase === 'active' ? (s.stage === 'descent' ? '🚀 Landing' : `${inShadow(s) ? '🌑' : '☀️'} Pass in ${nextPass(s) - s.minute} min`) : '');
    hud.meter('power', {value: Math.max(0, avail - used), max: avail, text: s.tripped ? 'TRIPPED' : `${used} / ${avail}`, warn: s.tripped || used > avail ? 2 : !inShadow(s) && minutesToShadow(s) <= 10 && used > s.scenario.power.shadow ? 1 : 0});
    hud.meter('charge', {value: s.charge, max: 100, text: `${Math.round(s.charge)}%${hazardCamReady(s) ? ' 📷' : ''}`});

    // Check station practical lesson triggers in real time
    if (stationLessonActive && !stationStepCompleted && ctx.view?.world?.player) {
      const p = ctx.view.world.player.position;
      if (currentStationStep === 0 && (Math.hypot(p.x, p.z - 14) > 0.8 || p.z < 13.2)) {
        completeStationStep();
      } else if (currentStationStep === 1 && Math.hypot(p.x - 9.5, p.z - 2.5) < 3.8) {
        completeStationStep();
      } else if (currentStationStep === 2 && Math.hypot(p.x - (-1.5), p.z - (-3.5)) < 3.5) {
        completeStationStep();
      } else if (currentStationStep === 3 && (Math.hypot(p.x - (-1.5), p.z - (-11)) < 3.5 || Math.hypot(p.x - (-8), p.z) < 3.5)) {
        completeStationStep();
      }
    }
  },
});
