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

const STATION_WAYPOINTS = {
  panel: { id: 'panel', label: 'Power Panel', icon: '⚡', x: -1.5, z: -3.5 },
  rack: { id: 'rack', label: 'Radio Rack', icon: '📻', x: -1.5, z: -11 },
  locker: { id: 'locker', label: 'Spares Locker', icon: '🧰', x: -8, z: 0 },
  planner: { id: 'planner', label: 'Planner Table', icon: '🗺️', x: 5.5, z: 0 },
  hatch: { id: 'hatch', label: 'Lander Hatch', icon: '🚀', x: 0, z: 16.5 },
  window: { id: 'window', label: 'Mars Window', icon: '🪐', x: 9.5, z: 2.5 }
};

const STATION_PRACTICAL_STEPS = [
  {
    step: 1,
    title: 'Step 1 of 5: Move in Zero-G & Power Panel',
    badge: 'MISSION STEP 1 OF 5',
    target: STATION_WAYPOINTS.panel,
    desc: 'In space orbit, you float in microgravity! Press <kbd class="lesson-kbd">W</kbd><kbd class="lesson-kbd">A</kbd><kbd class="lesson-kbd">S</kbd><kbd class="lesson-kbd">D</kbd> or click below to walk to the ⚡ Power Panel.',
    btnHtml: '<span class="btn-icon">⚡</span> Walk to Power Panel (W)',
    subhint: 'Tip: Press W/A/S/D on your keyboard, use walk buttons, or click below!',
    okText: '<b>Arrived at Panel!</b> 👉 Instruction: Switch ON 📻 Radio, 📶 Amp & 🛰️ Antenna!',
    run(ctx) {
      ctx.view?.walk?.('panel');
    }
  },
  {
    step: 2,
    title: 'Step 2 of 5: Find What Is Broken',
    badge: 'MISSION STEP 2 OF 5',
    target: STATION_WAYPOINTS.rack,
    desc: 'Walk to the 📻 Radio Rack to test the signal (press the green button), or grab the signal tester from 🧰 Spares.',
    btnHtml: '<span class="btn-icon">📻</span> Walk to Radio Rack',
    subhint: 'Tip: Make sure 📻 Radio, 📶 Amp, and 🛰️ Antenna are ON, then press the green button!',
    okText: '<b>At Radio Rack!</b> 👉 Instruction: Press green button to test (or clip tester from Spares)!',
    run(ctx) {
      ctx.view?.walk?.('rack');
    }
  },
  {
    step: 3,
    title: 'Step 3 of 5: Safely Fix & Test Radio',
    badge: 'MISSION STEP 3 OF 5',
    target: STATION_WAYPOINTS.panel,
    desc: 'Turn power OFF (no zaps!), fix the broken part at Radio Rack, switch back ON 📻 Radio, 📶 Amp & 🛰️ Antenna, then press the green button to reach Meridian Base.',
    btnHtml: '<span class="btn-icon">⚡</span> Walk to Power Panel',
    subhint: 'Tip: Switch OFF power before touching hardware, fix, switch back ON 📻 📶 🛰️, then test.',
    okText: '<b>Radio Fixed & Online!</b> 👉 Instruction: Signal connected! Click Next to plan your landing!',
    run(ctx) {
      const guidance = getRepairGuidance(ctx.mission);
      ctx.view?.walk?.(guidance.walkTarget);
    }
  },
  {
    step: 4,
    title: 'Step 4 of 5: Charge & Pick Landing Site',
    badge: 'MISSION STEP 4 OF 5',
    target: STATION_WAYPOINTS.planner,
    desc: 'Charge lander in sunlight for hazard camera, and choose your landing ellipse at 🗺️ Planner table.',
    btnHtml: '<span class="btn-icon">🗺️</span> Walk to Landing Planner',
    subhint: 'Tip: Walk to holographic table to select the safest landing ellipse on Mars.',
    okText: '<b>At Planner Table!</b> 👉 Instruction: Select the safest landing ellipse on the table!',
    run(ctx) {
      ctx.view?.walk?.('planner');
    }
  },
  {
    step: 5,
    title: 'Step 5 of 5: Board the Lander & Land',
    badge: 'MISSION STEP 5 OF 5',
    target: STATION_WAYPOINTS.hatch,
    desc: 'Walk to the 🚀 Lander Hatch at the front of the station, check hatch seals, and fly down to Meridian Base!',
    btnHtml: '<span class="btn-icon">🚀</span> Walk to Lander Hatch',
    subhint: 'Tip: Head to the hatch, open seals, and start the descent.',
    okText: '<b>Hatch Reached!</b> 👉 Instruction: Open hatch, seal up tight, and fly down to Mars!',
    run(ctx) {
      ctx.view?.walk?.('hatch');
    }
  }
];

function calculateRelativeTelemetry(player, target) {
  if (!player || !target) return null;
  const px = player.position?.x ?? 0;
  const pz = player.position?.z ?? 0;
  const yaw = player.yaw ?? 0;

  const dx = target.x - px;
  const dz = target.z - pz;
  const totalDist = Math.hypot(dx, dz);

  // In Three.js / Asteria coordinate system:
  // Forward unit vector for yaw: (-sin(yaw), -cos(yaw))
  // Right unit vector for yaw: (cos(yaw), -sin(yaw))
  const forwardDist = -dx * Math.sin(yaw) - dz * Math.cos(yaw);
  const rightDist = dx * Math.cos(yaw) - dz * Math.sin(yaw);

  const isArrived = totalDist <= 2.2;

  let fbText = '';
  let fbArrow = '⬆️';
  if (Math.abs(forwardDist) < 0.4) {
    fbArrow = '🎯';
    fbText = 'Aligned Center';
  } else if (forwardDist > 0) {
    fbArrow = '⬆️';
    fbText = `${forwardDist.toFixed(1)} m Ahead`;
  } else {
    fbArrow = '⬇️';
    fbText = `${Math.abs(forwardDist).toFixed(1)} m Back`;
  }

  let lrText = '';
  let lrArrow = '➡️';
  if (Math.abs(rightDist) < 0.4) {
    lrArrow = '🎯';
    lrText = 'Aligned Center';
  } else if (rightDist > 0) {
    lrArrow = '➡️';
    lrText = `${rightDist.toFixed(1)} m Right`;
  } else {
    lrArrow = '⬅️';
    lrText = `${Math.abs(rightDist).toFixed(1)} m Left`;
  }

  const distText = isArrived ? `✅ In Reach (${totalDist.toFixed(1)}m)` : `${totalDist.toFixed(1)} m away`;

  return {
    totalDist,
    forwardDist,
    rightDist,
    isArrived,
    distText,
    fbArrow,
    fbText,
    lrArrow,
    lrText
  };
}

function updateStationTelemetry(ctx) {
  if (!ctx) return;
  const player = ctx.view?.world?.player;

  // 1. Update station practical lesson card telemetry if active
  if (stationLessonActive && stationLessonEl && !stationLessonEl.hidden) {
    const step = STATION_PRACTICAL_STEPS[currentStationStep];
    const target = step?.target;
    if (target) {
      const telem = calculateRelativeTelemetry(player, target);
      const iconEl = stationLessonEl.querySelector('#station-dest-icon');
      const nameEl = stationLessonEl.querySelector('#station-dest-name');
      const distEl = stationLessonEl.querySelector('#station-dist-total');
      const arrowFbEl = stationLessonEl.querySelector('#station-arrow-fb');
      const valFbEl = stationLessonEl.querySelector('#station-val-fb');
      const arrowLrEl = stationLessonEl.querySelector('#station-arrow-lr');
      const valLrEl = stationLessonEl.querySelector('#station-val-lr');

      if (iconEl && iconEl.textContent !== target.icon) iconEl.textContent = target.icon;
      if (nameEl && nameEl.textContent !== target.label) nameEl.textContent = target.label;

      if (telem) {
        if (distEl) {
          distEl.textContent = telem.distText;
          distEl.classList.toggle('arrived', telem.isArrived);
        }
        if (arrowFbEl) arrowFbEl.textContent = telem.fbArrow;
        if (valFbEl) valFbEl.textContent = telem.fbText;
        if (arrowLrEl) arrowLrEl.textContent = telem.lrArrow;
        if (valLrEl) valLrEl.textContent = telem.lrText;
      }
    }
  }

  // 2. Update device visualizer
  updateDeviceVisualizer(ctx);
}

let autoAdvanceTimer = null;
let autoAdvanceCountdown = 0;

function clearAutoAdvanceTimer() {
  if (autoAdvanceTimer) {
    clearInterval(autoAdvanceTimer);
    autoAdvanceTimer = null;
  }
  autoAdvanceCountdown = 0;
  const nextBtn = stationLessonEl?.querySelector('#station-next-step-btn');
  if (nextBtn) {
    const isLast = currentStationStep >= STATION_PRACTICAL_STEPS.length - 1;
    nextBtn.textContent = isLast ? '🎓 Complete Training ➔' : 'Next ➔';
  }
}

function startAutoAdvanceCountdown() {
  clearAutoAdvanceTimer();
  autoAdvanceCountdown = 3;

  const nextBtn = stationLessonEl?.querySelector('#station-next-step-btn');
  const isLast = currentStationStep >= STATION_PRACTICAL_STEPS.length - 1;
  const baseLabel = isLast ? '🎓 Complete Training ➔' : 'Next ➔';

  if (nextBtn) {
    nextBtn.textContent = `${baseLabel} (${autoAdvanceCountdown}s)`;
  }

  autoAdvanceTimer = setInterval(() => {
    if (!stationLessonActive || !stationLessonEl || stationLessonEl.hidden) {
      clearAutoAdvanceTimer();
      return;
    }

    autoAdvanceCountdown--;

    if (autoAdvanceCountdown > 0) {
      if (nextBtn) {
        nextBtn.textContent = `${baseLabel} (${autoAdvanceCountdown}s)`;
      }
    } else {
      clearAutoAdvanceTimer();
      advanceStationLesson();
    }
  }, 1000);
}

function closeStationLesson() {
  clearAutoAdvanceTimer();
  stationLessonActive = false;
  if (stationLessonEl) {
    stationLessonEl.hidden = true;
  }
  const job = document.querySelector('.mx-job');
  if (job) job.hidden = false;
  const topBtn = document.getElementById('station-practice-btn');
  if (topBtn) {
    topBtn.setAttribute('aria-pressed', 'false');
    topBtn.classList.remove('is-active');
  }
}

function getActiveStationStepIndex(s) {
  if (!s) return 0;
  if (s.site) return 4;
  if (s.comms) return 3;
  if (s.diagnosed || s.fixed) return 2;
  const countSwitches = (s.loads?.radio ? 1 : 0) + (s.loads?.amp ? 1 : 0) + (s.loads?.motor ? 1 : 0);
  if (countSwitches === 3) return 1;
  return 0;
}

function getRepairGuidance(s) {
  const faultKey = s?.diagnosed || s?.fault || 'card';
  const sc = s?.scenario;
  const part = sc?.parts?.[faultKey] || { label: 'controller card', load: 'radio', fix: 'Pull the controller card out and push it back in' };
  const loadInfo = sc?.loads?.[part.load] || { label: 'Radio', icon: '📻' };

  if (s?.tripped) {
    return {
      substep: 'reset',
      target: STATION_WAYPOINTS.panel,
      title: '⚠️ Breaker Tripped! Reset at Power Panel',
      desc: `<b>Power Tripped!</b> The main breaker tripped to protect the ship. Walk to the <b>⚡ Power Panel</b> and pull down the <b>Yellow Breaker Handle</b> to restore power.`,
      btnHtml: '<span class="btn-icon">⚡</span> Walk to Power Panel (Reset Breaker)',
      subhint: 'Tip: Aim at the yellow breaker handle at the power panel and press (E) to reset.',
      walkTarget: 'panel',
      partName: part.label,
      loadName: `${loadInfo.icon} ${loadInfo.label}`,
      activeVisStep: 1,
      fixActionDesc: part.fix
    };
  }

  if (s?.loads?.[part.load] && !s?.fixed) {
    return {
      substep: 'power_off',
      target: STATION_WAYPOINTS.panel,
      title: `⚡ Switch OFF ${loadInfo.icon} ${loadInfo.label} First!`,
      desc: `<b>Broken Part: ${part.label}</b>.<br>⚠️ <b>CRITICAL SAFETY RULE:</b> Always switch OFF <b>${loadInfo.icon} ${loadInfo.label}</b> at the Power Panel before touching hardware to prevent electric shocks!`,
      btnHtml: `<span class="btn-icon">⚡</span> Walk to Power Panel (Switch OFF ${loadInfo.icon})`,
      subhint: `Tip: Aim at switch for ${loadInfo.icon} ${loadInfo.label} and press (E) to flip DOWN into OFF.`,
      walkTarget: 'panel',
      partName: part.label,
      loadName: `${loadInfo.icon} ${loadInfo.label}`,
      activeVisStep: 1,
      fixActionDesc: part.fix
    };
  }

  if (faultKey === 'amp' && s?.holding !== 'amp' && !s?.fixed) {
    return {
      substep: 'grab_spare',
      target: STATION_WAYPOINTS.locker,
      title: '🧰 Grab Spare Amplifier from Locker',
      desc: `The amplifier burnt out! Walk to the <b>🧰 Spares Locker</b> on the left wall and press <b>(E)</b> to take the spare amplifier.`,
      btnHtml: '<span class="btn-icon">🧰</span> Walk to Spares Locker (Take Spare)',
      subhint: 'Tip: Open the locker and press (E) to take the spare amplifier.',
      walkTarget: 'locker',
      partName: part.label,
      loadName: `${loadInfo.icon} ${loadInfo.label}`,
      activeVisStep: 2,
      fixActionDesc: part.fix
    };
  }

  if (!s?.fixed) {
    const actionText = faultKey === 'amp' 
      ? 'Install the spare amplifier into the rack slot' 
      : faultKey === 'feed'
      ? 'Push in the antenna cable plug and twist tight'
      : 'Pull the controller card out and push it back in';

    return {
      substep: 'fix_part',
      target: STATION_WAYPOINTS.rack,
      title: `🔧 Fix the ${part.label} at Radio Rack`,
      desc: `Power is safely OFF! Walk to the <b>📻 Radio Rack</b>, aim at the <b>${part.label}</b>, and press <b>(E)</b> to ${actionText}.`,
      btnHtml: `<span class="btn-icon">🔧</span> Walk to Radio Rack (${part.label})`,
      subhint: `Tip: Aim crosshair at the ${part.label} and press (E) or click to repair.`,
      walkTarget: 'rack',
      partName: part.label,
      loadName: `${loadInfo.icon} ${loadInfo.label}`,
      activeVisStep: 2,
      fixActionDesc: part.fix
    };
  }

  const offLoads = sc?.testNeeds?.filter(l => !s?.loads?.[l]) || [];
  if (offLoads.length > 0) {
    const offLabels = offLoads.map(l => `${sc.loads[l].icon} ${sc.loads[l].label}`).join(', ');
    return {
      substep: 'power_on',
      target: STATION_WAYPOINTS.panel,
      title: '⚡ Turn ON Radio, Amp & Antenna Switches',
      desc: `<b>Part repaired successfully!</b> Now walk to the <b>⚡ Power Panel</b> and turn ON <b>${offLabels}</b> (all 3 must be UP/ON to broadcast).`,
      btnHtml: '<span class="btn-icon">⚡</span> Walk to Power Panel (Turn ON 📻 📶 🛰️)',
      subhint: 'Tip: Flip switches #3, #4 and #5 UP into ON.',
      walkTarget: 'panel',
      partName: part.label,
      loadName: `${loadInfo.icon} ${loadInfo.label}`,
      activeVisStep: 3,
      fixActionDesc: part.fix
    };
  }

  if (!s?.comms) {
    return {
      substep: 'test_signal',
      target: STATION_WAYPOINTS.rack,
      title: '🟢 Press Green Button to Test Signal!',
      desc: `All 3 radio switches are powered! Walk to the <b>📻 Radio Rack</b>, aim at the <b>Round Green Test Button</b>, and press <b>(E)</b> to link with Meridian Base on Mars.`,
      btnHtml: '<span class="btn-icon">📻</span> Walk to Radio Rack (Press Green Button)',
      subhint: 'Tip: Aim at the round green button on the radio rack and press (E) or click.',
      walkTarget: 'rack',
      partName: part.label,
      loadName: `${loadInfo.icon} ${loadInfo.label}`,
      activeVisStep: 3,
      fixActionDesc: part.fix
    };
  }

  return {
    substep: 'done',
    target: STATION_WAYPOINTS.planner,
    title: '🎉 Radio Connected to Meridian Base!',
    desc: `Meridian Base hears Asteria loud and clear! The landing beacon is active. Head to the <b>🗺️ Planner Table</b>.`,
    btnHtml: '<span class="btn-icon">🗺️</span> Walk to Landing Planner',
    subhint: 'Tip: Click Next or walk to the planner table.',
    walkTarget: 'planner',
    partName: part.label,
    loadName: `${loadInfo.icon} ${loadInfo.label}`,
    activeVisStep: 3,
    fixActionDesc: part.fix
  };
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

function renderDeviceVisualizer(stepIndex, ctx) {
  const container = stationLessonEl?.querySelector('#station-device-vis');
  if (!container) return;

  const s = ctx?.mission || {};
  const loads = s.loads || {};

  if (stepIndex === 0) {
    // Step 1: Power Panel Switches Visualization
    const radioOn = !!loads.radio;
    const ampOn = !!loads.amp;
    const motorOn = !!loads.motor;
    const countOn = (radioOn ? 1 : 0) + (ampOn ? 1 : 0) + (motorOn ? 1 : 0);

    container.innerHTML = `
      <div class="device-vis-panel">
        <div class="vis-header">
          <span class="vis-title">⚡ POWER PANEL SWITCH BOARD</span>
          <span class="vis-badge ${countOn === 3 ? 'ready' : ''}" id="vis-panel-status">${countOn}/3 SWITCHES ON</span>
        </div>
        <div class="vis-switches-grid">
          <div class="vis-switch-box locked">
            <div class="vis-switch-slot"><div class="vis-lever up"></div></div>
            <div class="vis-lamp green"></div>
            <span class="vis-icon">🫁</span>
            <span class="vis-name">Life</span>
            <span class="vis-tag">LOCKED</span>
          </div>
          <div class="vis-switch-box ok">
            <div class="vis-switch-slot"><div class="vis-lever up"></div></div>
            <div class="vis-lamp green"></div>
            <span class="vis-icon">🔥</span>
            <span class="vis-name">Heat</span>
            <span class="vis-tag">ON</span>
          </div>
          <div class="vis-switch-box target ${radioOn ? 'is-on' : 'is-off'}" id="vis-sw-radio">
            <div class="vis-switch-slot"><div class="vis-lever ${radioOn ? 'up' : 'down'}"></div></div>
            <div class="vis-lamp ${radioOn ? 'green' : 'amber'}"></div>
            <span class="vis-icon">📻</span>
            <span class="vis-name">Radio</span>
            <span class="vis-state-btn">${radioOn ? '✅ ON' : 'FLIP UP'}</span>
          </div>
          <div class="vis-switch-box target ${ampOn ? 'is-on' : 'is-off'}" id="vis-sw-amp">
            <div class="vis-switch-slot"><div class="vis-lever ${ampOn ? 'up' : 'down'}"></div></div>
            <div class="vis-lamp ${ampOn ? 'green' : 'amber'}"></div>
            <span class="vis-icon">📶</span>
            <span class="vis-name">Amp</span>
            <span class="vis-state-btn">${ampOn ? '✅ ON' : 'FLIP UP'}</span>
          </div>
          <div class="vis-switch-box target ${motorOn ? 'is-on' : 'is-off'}" id="vis-sw-motor">
            <div class="vis-switch-slot"><div class="vis-lever ${motorOn ? 'up' : 'down'}"></div></div>
            <div class="vis-lamp ${motorOn ? 'green' : 'amber'}"></div>
            <span class="vis-icon">🛰️</span>
            <span class="vis-name">Antenna</span>
            <span class="vis-state-btn">${motorOn ? '✅ ON' : 'FLIP UP'}</span>
          </div>
        </div>
        <div class="vis-caption-hint" id="vis-panel-hint">
          ${countOn === 3 
            ? '🎉 <b>All 3 powered!</b> Ready to test signal at the Radio Rack.' 
            : '👉 <b>Aim at switches #3, #4 & #5</b> and press <b>(E)</b> to flip UP into ON.'}
        </div>
      </div>
    `;
  } else if (stepIndex === 1) {
    // Step 2: Radio Rack & Green Test Button Visualization
    const isDiagnosed = !!(s.diagnosed || s.fixed);
    const faultKey = s.diagnosed || s.fault || 'card';
    const faultPart = s.scenario?.parts?.[faultKey];

    container.innerHTML = `
      <div class="device-vis-panel">
        <div class="vis-header">
          <span class="vis-title">📻 RADIO RACK & TEST BUTTON</span>
          <span class="vis-badge ${isDiagnosed ? 'ready' : 'highlight'}">${isDiagnosed ? 'FAULT PINPOINTED ✅' : 'DIAGNOSTIC BAY'}</span>
        </div>
        <div class="vis-rack-layout">
          <div class="vis-rack-target-btn">
            <div class="vis-big-green-btn"><span class="btn-core"></span></div>
            <div class="vis-btn-desc">
              <strong>🟢 Round Green Test Button</strong>
              <small>${isDiagnosed ? `Diagnosis complete: ${faultPart?.label || faultKey} identified!` : 'Aim crosshair and press <b>(E)</b> or click to test signal!'}</small>
            </div>
            <span class="vis-press-pill">${isDiagnosed ? 'TESTED ✅' : 'PRESS (E)'}</span>
          </div>
          <div class="vis-rack-components-row">
            <div class="vis-rack-subitem ${s.tester === 'rack' ? 'active' : ''}">
              <span class="comp-icon">🟨</span>
              <div class="comp-info">
                <strong>Tester Socket</strong>
                <small>${s.tester === 'rack' ? 'Tester Clipped ✅' : 'From 🧰 Spares'}</small>
              </div>
            </div>
            <div class="vis-rack-subitem ${faultKey === 'feed' && isDiagnosed ? 'fault' : ''}">
              <span class="comp-icon">🔌</span>
              <div class="comp-info">
                <strong>Cable Plug</strong>
                <small>${faultKey === 'feed' && isDiagnosed ? '⚠️ BROKEN PART!' : 'Antenna feed'}</small>
              </div>
            </div>
            <div class="vis-rack-subitem ${faultKey === 'amp' && isDiagnosed ? 'fault' : ''}">
              <span class="comp-icon">📶</span>
              <div class="comp-info">
                <strong>Amp Module</strong>
                <small>${faultKey === 'amp' && isDiagnosed ? '⚠️ BROKEN PART!' : 'Swap from Locker'}</small>
              </div>
            </div>
            <div class="vis-rack-subitem ${faultKey === 'card' && isDiagnosed ? 'fault' : ''}">
              <span class="comp-icon">🟩</span>
              <div class="comp-info">
                <strong>Control Card</strong>
                <small>${faultKey === 'card' && isDiagnosed ? '⚠️ BROKEN PART!' : 'Reseat in slot'}</small>
              </div>
            </div>
          </div>
        </div>
        <div class="vis-caption-hint">
          ${isDiagnosed 
            ? `⚠️ <b>Broken Part Found: ${faultPart?.label || faultKey}!</b> Switch off its power before touching hardware!` 
            : '👉 <b>Green Button:</b> Press to test. <i>(Tester from 🧰 Spares pinpoints which part broke!)</i>'}
        </div>
      </div>
    `;
  } else if (stepIndex === 2) {
    // Step 3: Dynamic Safe Repair Pipeline
    const guidance = getRepairGuidance(s);
    const isComms = !!s.comms;

    container.innerHTML = `
      <div class="device-vis-panel">
        <div class="vis-header">
          <span class="vis-title">🔧 SAFE RADIO REPAIR PIPELINE</span>
          <span class="vis-badge ${isComms ? 'ready' : 'highlight'}">${isComms ? 'ONLINE ✅' : guidance.substep.replace('_', ' ').toUpperCase()}</span>
        </div>
        <div class="vis-repair-steps-row">
          <div class="vis-repair-step ${guidance.activeVisStep > 1 ? 'done' : 'active'}">
            <span class="step-num">1</span>
            <span class="step-ic">⚡</span>
            <strong>${s.tripped ? 'Reset Breaker' : `${guidance.loadName} OFF`}</strong>
            <small>At Power Panel</small>
          </div>
          <div class="vis-repair-step-arrow">➔</div>
          <div class="vis-repair-step ${guidance.activeVisStep > 2 ? 'done' : guidance.activeVisStep === 2 ? 'active' : ''}">
            <span class="step-num">2</span>
            <span class="step-ic">${guidance.substep === 'grab_spare' ? '🧰' : '🔧'}</span>
            <strong>${guidance.substep === 'grab_spare' ? 'Get Spare Amp' : `Fix ${guidance.partName}`}</strong>
            <small>${guidance.substep === 'grab_spare' ? 'At Spares Locker' : 'At Radio Rack'}</small>
          </div>
          <div class="vis-repair-step-arrow">➔</div>
          <div class="vis-repair-step ${isComms ? 'done' : guidance.activeVisStep === 3 ? 'active' : ''}">
            <span class="step-num">3</span>
            <span class="step-ic">🟢</span>
            <strong>Turn ON & Test</strong>
            <small>Green Button</small>
          </div>
        </div>
        <div class="vis-caption-hint">
          ${guidance.desc}
        </div>
      </div>
    `;
  } else if (stepIndex === 3) {
    // Step 4: Holographic Landing Planner Table
    const chosenSite = s.site;
    const siteObj = chosenSite ? s.scenario?.sites[chosenSite] : null;

    container.innerHTML = `
      <div class="device-vis-panel">
        <div class="vis-header">
          <span class="vis-title">🗺️ HOLOGRAPHIC PLANNER TABLE</span>
          <span class="vis-badge ${chosenSite ? 'ready' : ''}">${chosenSite ? `${siteObj?.icon} ${siteObj?.label}` : 'PICK SITE'}</span>
        </div>
        <div class="vis-planner-graphic">
          <div class="vis-hologram-circle">
            <div class="vis-safe-zone"></div>
            <div class="vis-ellipse-ring"></div>
            <div class="vis-base-beacon">🏠 Base</div>
            <div class="vis-rock-marker r1">🪨</div>
            <div class="vis-rock-marker r2">🪨</div>
            <div class="vis-lander-marker">🚀</div>
          </div>
          <div class="vis-sites-mini-list">
            <div class="site-mini-chip ${chosenSite === 'pad' ? 'selected' : ''}">🏠 <b>Pad</b>: 0.3km · Rocks</div>
            <div class="site-mini-chip ${chosenSite === 'ridge' ? 'selected' : ''}">⛰️ <b>Ridge</b>: 2.5km · Dunes</div>
            <div class="site-mini-chip ${chosenSite === 'plains' ? 'selected' : ''}">🟫 <b>Plains</b>: 9km · Smooth</div>
          </div>
        </div>
        <div class="vis-caption-hint">
          ${chosenSite 
            ? `✅ <b>Selected:</b> ${siteObj?.label}. Descent trajectory locked!` 
            : '👉 <b>Walk to the holographic table</b> and select the safest landing ellipse on Mars.'}
        </div>
      </div>
    `;
  } else if (stepIndex === 4) {
    // Step 5: Lander Hatch & Descent
    const isBoarded = !!s.boarded;

    container.innerHTML = `
      <div class="device-vis-panel">
        <div class="vis-header">
          <span class="vis-title">🚀 LANDER DOCKING HATCH</span>
          <span class="vis-badge ${isBoarded ? 'ready' : 'highlight'}">${isBoarded ? 'DESCENDING' : 'FINAL STEP'}</span>
        </div>
        <div class="vis-hatch-graphic">
          <div class="vis-hatch-wheel-box">
            <div class="vis-hatch-wheel">
              <div class="vis-spoke h"></div>
              <div class="vis-spoke v"></div>
            </div>
            <div class="vis-wheel-status">HATCH WHEEL</div>
          </div>
          <div class="vis-hatch-checks">
            <div class="check-row"><span>✅</span> <b>Cabin Pressure:</b> Normal</div>
            <div class="check-row"><span>✅</span> <b>Descent Thrusters:</b> Ready</div>
            <div class="check-row"><span>🚀</span> <b>Destination:</b> Mars Meridian Base</div>
          </div>
        </div>
        <div class="vis-caption-hint">
          👉 <b>Turn the hatch wheel:</b> Open hatch, board the lander, and begin your descent to Mars!
        </div>
      </div>
    `;
  }
}

function updateDeviceVisualizer(ctx) {
  const container = stationLessonEl?.querySelector('#station-device-vis');
  if (!container || !stationLessonActive || stationLessonEl.hidden) return;

  const s = ctx?.mission || {};
  const loads = s.loads || {};

  if (currentStationStep === 0) {
    const radioOn = !!loads.radio;
    const ampOn = !!loads.amp;
    const motorOn = !!loads.motor;
    const countOn = (radioOn ? 1 : 0) + (ampOn ? 1 : 0) + (motorOn ? 1 : 0);

    const swRadio = container.querySelector('#vis-sw-radio');
    const swAmp = container.querySelector('#vis-sw-amp');
    const swMotor = container.querySelector('#vis-sw-motor');
    const statusBadge = container.querySelector('#vis-panel-status');
    const hintEl = container.querySelector('#vis-panel-hint');

    if (swRadio) {
      swRadio.classList.toggle('is-on', radioOn);
      swRadio.classList.toggle('is-off', !radioOn);
      const lever = swRadio.querySelector('.vis-lever');
      const lamp = swRadio.querySelector('.vis-lamp');
      const btn = swRadio.querySelector('.vis-state-btn');
      if (lever) { lever.className = `vis-lever ${radioOn ? 'up' : 'down'}`; }
      if (lamp) { lamp.className = `vis-lamp ${radioOn ? 'green' : 'amber'}`; }
      if (btn) { btn.textContent = radioOn ? '✅ ON' : 'FLIP UP'; }
    }
    if (swAmp) {
      swAmp.classList.toggle('is-on', ampOn);
      swAmp.classList.toggle('is-off', !ampOn);
      const lever = swAmp.querySelector('.vis-lever');
      const lamp = swAmp.querySelector('.vis-lamp');
      const btn = swAmp.querySelector('.vis-state-btn');
      if (lever) { lever.className = `vis-lever ${ampOn ? 'up' : 'down'}`; }
      if (lamp) { lamp.className = `vis-lamp ${ampOn ? 'green' : 'amber'}`; }
      if (btn) { btn.textContent = ampOn ? '✅ ON' : 'FLIP UP'; }
    }
    if (swMotor) {
      swMotor.classList.toggle('is-on', motorOn);
      swMotor.classList.toggle('is-off', !motorOn);
      const lever = swMotor.querySelector('.vis-lever');
      const lamp = swMotor.querySelector('.vis-lamp');
      const btn = swMotor.querySelector('.vis-state-btn');
      if (lever) { lever.className = `vis-lever ${motorOn ? 'up' : 'down'}`; }
      if (lamp) { lamp.className = `vis-lamp ${motorOn ? 'green' : 'amber'}`; }
      if (btn) { btn.textContent = motorOn ? '✅ ON' : 'FLIP UP'; }
    }
    if (statusBadge) {
      statusBadge.textContent = `${countOn}/3 SWITCHES ON`;
      statusBadge.classList.toggle('ready', countOn === 3);
    }
    if (hintEl) {
      hintEl.innerHTML = countOn === 3
        ? '🎉 <b>All 3 powered!</b> Ready to test signal at the Radio Rack.'
        : '👉 <b>Aim at switches #3, #4 & #5</b> and press <b>(E)</b> to flip UP into ON.';
    }

    if (countOn === 3) {
      if (!stationStepCompleted) {
        completeStationStep();
      } else if (!container.dataset.switchesFinished) {
        container.dataset.switchesFinished = 'true';
        const okTextEl = stationLessonEl?.querySelector('#station-ok-text');
        if (okTextEl) {
          const msg = '<b>🎉 All 3 switches powered ON!</b> 👉 Ready to test signal at the Radio Rack!';
          okTextEl.innerHTML = msg;
          speakStationText(msg.replace(/<[^>]*>/g, ''));
        }
        startAutoAdvanceCountdown();
      }
    }
  } else if (currentStationStep === 1) {
    if (s.diagnosed || s.fixed) {
      if (!container.querySelector('.vis-badge.ready')) {
        renderStationStep(1);
      }
    }
  } else if (currentStationStep === 2) {
    const guidance = getRepairGuidance(s);
    const prevKey = container.dataset.substepKey;
    const currentKey = `${guidance.substep}_${s.tripped}_${s.fixed}_${s.comms}`;
    if (prevKey !== currentKey) {
      container.dataset.substepKey = currentKey;
      renderDeviceVisualizer(2, ctx);

      const titleEl = stationLessonEl.querySelector('#station-step-title');
      const descEl = stationLessonEl.querySelector('#station-step-desc');
      const targetIconEl = stationLessonEl.querySelector('#station-dest-icon');
      const targetNameEl = stationLessonEl.querySelector('#station-dest-name');
      const actionBtn = stationLessonEl.querySelector('#station-action-btn');
      const subhintEl = stationLessonEl.querySelector('#station-subhint');

      if (titleEl) titleEl.textContent = guidance.title;
      if (descEl) descEl.innerHTML = guidance.desc;
      if (targetIconEl) targetIconEl.textContent = guidance.target.icon;
      if (targetNameEl) targetNameEl.textContent = guidance.target.label;
      if (actionBtn) {
        actionBtn.innerHTML = guidance.btnHtml;
        actionBtn.onclick = () => {
          ctx.view?.walk?.(guidance.walkTarget);
        };
      }
      if (subhintEl) subhintEl.textContent = guidance.subhint;
      STATION_PRACTICAL_STEPS[2].target = guidance.target;
    }
  }
}

function renderStationStep(index) {
  clearAutoAdvanceTimer();
  const step = STATION_PRACTICAL_STEPS[index];
  if (!step || !stationLessonEl) return;
  stationStepCompleted = false;

  const s = stationLessonContext?.mission;
  const badgeEl = stationLessonEl.querySelector('#station-lesson-badge');
  const titleEl = stationLessonEl.querySelector('#station-step-title');
  const descEl = stationLessonEl.querySelector('#station-step-desc');
  const targetIconEl = stationLessonEl.querySelector('#station-dest-icon');
  const targetNameEl = stationLessonEl.querySelector('#station-dest-name');
  const promptBox = stationLessonEl.querySelector('#station-prompt-action');
  const actionBtn = stationLessonEl.querySelector('#station-action-btn');
  const subhintEl = stationLessonEl.querySelector('#station-subhint');
  const okBox = stationLessonEl.querySelector('#station-ok-feedback');
  const okTextEl = stationLessonEl.querySelector('#station-ok-text');
  const nextBtn = stationLessonEl.querySelector('#station-next-step-btn');
  const dotsBox = stationLessonEl.querySelector('#station-lesson-dots');

  if (badgeEl) badgeEl.textContent = step.badge;
  if (titleEl) titleEl.textContent = step.title;
  if (descEl) descEl.innerHTML = step.desc;
  if (targetIconEl && step.target) targetIconEl.textContent = step.target.icon;
  if (targetNameEl && step.target) targetNameEl.textContent = step.target.label;
  if (actionBtn) actionBtn.innerHTML = step.btnHtml;
  if (subhintEl) subhintEl.textContent = step.subhint;
  if (promptBox) {
    promptBox.hidden = false;
    promptBox.style.display = 'flex';
  }
  if (okBox) {
    okBox.hidden = true;
    okBox.style.display = 'none';
  }
  if (okTextEl) {
    okTextEl.innerHTML = '';
  }

  // Dynamic overrides for Step 2 and Step 3 based on diagnosis & repair state:
  if (index === 1 && s && (s.diagnosed || s.fixed)) {
    const guidance = getRepairGuidance(s);
    if (badgeEl) badgeEl.textContent = 'MISSION STEP 2 OF 5 · BROKEN PART FOUND ✅';
    if (titleEl) titleEl.textContent = `Step 2 of 5: Broken Part Found: ${guidance.partName}!`;
    if (descEl) descEl.innerHTML = `You pinpointed the radio fault: the <b>${guidance.partName}</b> is broken!<br>👉 <b>Next Step:</b> Switch off power safely before touching it. Click below to proceed to Step 3.`;
    if (actionBtn) {
      actionBtn.innerHTML = '<span class="btn-icon">➔</span> Proceed to Step 3: Safe Repair';
      actionBtn.onclick = () => advanceStationLesson();
    }
    if (subhintEl) subhintEl.textContent = 'Tip: Click Next or this button to see step-by-step repair instructions!';
  } else if (index === 2) {
    const guidance = getRepairGuidance(s);
    if (titleEl) titleEl.textContent = guidance.title;
    if (descEl) descEl.innerHTML = guidance.desc;
    if (targetIconEl) targetIconEl.textContent = guidance.target.icon;
    if (targetNameEl) targetNameEl.textContent = guidance.target.label;
    if (actionBtn) {
      actionBtn.innerHTML = guidance.btnHtml;
      actionBtn.onclick = () => {
        stationLessonContext?.view?.walk?.(guidance.walkTarget);
      };
    }
    if (subhintEl) subhintEl.textContent = guidance.subhint;
    step.target = guidance.target;
  }

  if (dotsBox) {
    dotsBox.innerHTML = STATION_PRACTICAL_STEPS.map((_, i) => `<span class="dot ${i === index ? 'active' : i < index ? 'done' : ''}"></span>`).join('');
  }

  if (nextBtn) {
    nextBtn.textContent = index >= STATION_PRACTICAL_STEPS.length - 1 ? '🎓 Complete Training ➔' : 'Next ➔';
  }

  renderDeviceVisualizer(index, stationLessonContext);
  updateStationTelemetry(stationLessonContext);
}

function completeStationStep() {
  if (stationStepCompleted || !stationLessonActive) return;
  stationStepCompleted = true;
  const step = STATION_PRACTICAL_STEPS[currentStationStep];
  if (!step || !stationLessonEl) return;

  const s = stationLessonContext?.mission;
  const promptBox = stationLessonEl.querySelector('#station-prompt-action');
  const okBox = stationLessonEl.querySelector('#station-ok-feedback');
  const okTextEl = stationLessonEl.querySelector('#station-ok-text');
  const nextBtn = stationLessonEl.querySelector('#station-next-step-btn');

  if (promptBox) {
    promptBox.hidden = true;
    promptBox.style.display = 'none';
  }
  if (okBox) {
    okBox.hidden = false;
    okBox.style.display = 'flex';
  }

  let feedbackText = step.okText;
  if (currentStationStep === 0) {
    const loads = s?.loads || {};
    const countOn = (loads.radio ? 1 : 0) + (loads.amp ? 1 : 0) + (loads.motor ? 1 : 0);
    if (countOn === 3) {
      feedbackText = '<b>🎉 All 3 switches powered ON!</b> 👉 Ready to test signal at the Radio Rack!';
    }
  } else if (currentStationStep === 1 && s && (s.diagnosed || s.fixed)) {
    const guidance = getRepairGuidance(s);
    feedbackText = `<b>Broken Part Found: ${guidance.partName}!</b> 👉 Switch off power safely before touching!`;
  } else if (currentStationStep === 2 && s?.comms) {
    feedbackText = '<b>🎉 Radio Connected to Meridian Base!</b> 👉 Next stop: 🗺️ Landing Planner Table!';
  } else if (currentStationStep === 3 && s?.site) {
    feedbackText = '<b>🗺️ Landing Site Confirmed!</b> 👉 Next stop: 🚀 Lander Hatch!';
  } else if (currentStationStep === 4 && s?.boarded) {
    feedbackText = '<b>🚀 Cadet Boarded!</b> 👉 Hatch sealed and ready to land on Mars!';
  }
  if (okTextEl) {
    okTextEl.innerHTML = feedbackText;
  }

  speakStationText(feedbackText.replace(/<[^>]*>/g, ''));

  // Automatically start 10-second countdown to show next job
  startAutoAdvanceCountdown();

  if (nextBtn) nextBtn.focus();
}

function advanceStationLesson() {
  clearAutoAdvanceTimer();
  if (currentStationStep < STATION_PRACTICAL_STEPS.length - 1) {
    currentStationStep++;
    renderStationStep(currentStationStep);
  } else {
    finishStationLesson();
  }
}

function finishStationLesson() {
  clearAutoAdvanceTimer();
  closeStationLesson();
  const topBtn = document.getElementById('station-practice-btn');
  if (topBtn) {
    topBtn.setAttribute('aria-pressed', 'false');
    topBtn.classList.remove('is-active');
  }
  if (stationLessonContext?.hud?.toast) {
    stationLessonContext.hud.toast('🎉 Cadet Training Complete! All practical lessons learned! Fix the radio, charge the lander, and pick your landing site!', 'info');
  }
  speakStationText('Outstanding work, Cadet! All practical station lessons complete! Now restore the radio, charge the lander, and pick your landing zone on Mars.');
}

function startStationLesson(ctx, stepIndex = 0) {
  stationLessonContext = ctx;
  stationLessonActive = true;
  currentStationStep = stepIndex;

  const topBtn = document.getElementById('station-practice-btn');
  if (topBtn) {
    topBtn.setAttribute('aria-pressed', 'true');
    topBtn.classList.add('is-active');
  }

  const job = document.querySelector('.mx-job');
  if (job) job.hidden = true;

  if (!stationLessonEl) {
    stationLessonEl = document.createElement('section');
    stationLessonEl.id = 'station-lesson';
    stationLessonEl.className = 'station-lesson-card';
    stationLessonEl.setAttribute('role', 'region');
    stationLessonEl.setAttribute('aria-label', 'Cadet station practical training');
    stationLessonEl.innerHTML = `
      <div class="lesson-top-bar">
        <div class="lesson-badge-pill">
          <span class="lesson-badge-icon">🔬</span>
          <span id="station-lesson-badge">MISSION STEP 1 OF 5</span>
        </div>
        <button id="station-lesson-skip-btn" type="button" class="lesson-close-btn" title="Close details">Close ✕</button>
      </div>
      <div class="lesson-content">
        <h3 id="station-step-title"></h3>
        <p id="station-step-desc"></p>
        <div id="station-nav-telemetry" class="station-nav-telemetry" aria-live="polite">
          <div class="telemetry-header">
            <span class="nav-target-label"><span id="station-dest-icon">⚡</span> <b id="station-dest-name">Power Panel</b></span>
            <span id="station-dist-total" class="nav-distance-badge">-- m</span>
          </div>
          <div class="nav-coords-row">
            <div class="nav-coord-chip" id="station-chip-fb">
              <span id="station-arrow-fb">⬆️</span>
              <span id="station-val-fb">-- Ahead</span>
            </div>
            <div class="nav-coord-chip" id="station-chip-lr">
              <span id="station-arrow-lr">↔️</span>
              <span id="station-val-lr">-- Aligned</span>
            </div>
          </div>
        </div>
        <div id="station-device-vis" class="station-device-vis" aria-live="polite"></div>
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

const MISSION_STEP_MESSAGES = [
  {
    num: 1,
    title: 'Find What Is Broken',
    icon: '🔍',
    briefMsg: 'Switch ON 📻 Radio, 📶 Amp & 🛰️ Antenna at the panel, then test on rack (or use tester from Spares).',
    doneCheck: s => !!(s.diagnosed || s.fixed),
    completeTitle: 'STEP 1 COMPLETE: Broken Part Found! 🔍',
    completeMsg: 'You pinpointed the broken part! Remember: switch off its power before touching it, then fix or swap it.',
    nextTip: 'Next: Switch off power safely and fix the part.'
  },
  {
    num: 2,
    title: 'Fix & Test the Radio',
    icon: '📻',
    briefMsg: 'Safely turn power off (no zaps!), fix the part, turn ON 📻 📶 🛰️, and test signal to Meridian Base.',
    doneCheck: s => !!s.comms,
    completeTitle: 'STEP 2 COMPLETE: Radio Connected! 📻',
    completeMsg: 'Meridian Base hears Asteria loud and clear! The surface radio beacon is now active.',
    nextTip: 'Next: Charge the lander while in sunlight.'
  },
  {
    num: 3,
    title: 'Charge the Lander',
    icon: '🔋',
    briefMsg: 'Charge to 50% in sunlight so the hazard camera can steer away from rocks.',
    doneCheck: s => hazardCamReady(s),
    completeTitle: 'STEP 3 COMPLETE: Lander Charged! 🔋',
    completeMsg: 'Lander charge is high enough! The terrain hazard camera is ready to steer around rocks.',
    nextTip: 'Next: Pick a landing site at the planner table.'
  },
  {
    num: 4,
    title: 'Pick a Landing Site',
    icon: '🗺️',
    briefMsg: 'Choose the safest landing ellipse at the holographic planner table.',
    doneCheck: s => !!s.site,
    completeTitle: 'STEP 4 COMPLETE: Landing Site Chosen! 🗺️',
    completeMsg: 'Landing site confirmed on Mars! The descent trajectory is calculated.',
    nextTip: 'Next: Head to the lander hatch to board!'
  },
  {
    num: 5,
    title: 'Board the Lander & Land',
    icon: '🚀',
    briefMsg: 'Open the hatch, check seals, and fly down through Mars’ thin atmosphere.',
    doneCheck: s => !!s.boarded,
    completeTitle: 'STEP 5 COMPLETE: Lander Sealed & Descending! 🚀',
    completeMsg: 'Hatch locked tight! Undocking from Asteria Station and descending to Mars surface!',
    nextTip: 'Touchdown on Mars!'
  }
];

let completedMissionSteps = new Set();
let stepAlertEl = null;
let stepAlertTimer = null;

function showStepCompletionAlert(step) {
  if (!stepAlertEl) {
    stepAlertEl = document.createElement('div');
    stepAlertEl.id = 'mission-step-alert';
    stepAlertEl.className = 'mission-step-alert-card';
    stepAlertEl.setAttribute('role', 'alert');
    stepAlertEl.setAttribute('aria-live', 'assertive');
    stepAlertEl.innerHTML = `
      <span class="step-alert-icon" id="step-alert-icon">🎉</span>
      <div class="step-alert-body">
        <strong id="step-alert-title"></strong>
        <p id="step-alert-msg"></p>
        <span class="step-alert-next" id="step-alert-next"></span>
      </div>
      <button type="button" class="step-alert-dismiss" aria-label="Dismiss alert">✕</button>
    `;
    document.body.appendChild(stepAlertEl);
    stepAlertEl.querySelector('.step-alert-dismiss').onclick = () => {
      stepAlertEl.hidden = true;
    };
  }

  const iconEl = stepAlertEl.querySelector('#step-alert-icon');
  const titleEl = stepAlertEl.querySelector('#step-alert-title');
  const msgEl = stepAlertEl.querySelector('#step-alert-msg');
  const nextEl = stepAlertEl.querySelector('#step-alert-next');

  if (iconEl) iconEl.textContent = `${step.icon}`;
  if (titleEl) titleEl.textContent = step.completeTitle;
  if (msgEl) msgEl.textContent = step.completeMsg;
  if (nextEl) nextEl.textContent = `👉 ${step.nextTip}`;

  stepAlertEl.hidden = false;
  clearTimeout(stepAlertTimer);
  stepAlertTimer = setTimeout(() => {
    if (stepAlertEl) stepAlertEl.hidden = true;
  }, 7500);

  speakStationText(`${step.completeTitle}. ${step.completeMsg}`);
}

function brief(ctx) {
  const legacy = readLegacyOrbit();
  const note = legacy && !legacy.complete ? '<p class="mx-last">We found a game from the old version of this mission. Your journey map is kept, but this new mission starts from the beginning.</p>' : '';
  ctx.dialog({
    label: 'MARS DAY 11 · ASTERIA ORBITER',
    title: 'Arrival at Mars',
    body: `${note}
    <div class="kid-mission-intro" style="text-align:center;padding:10px 14px 4px;">
      <div style="font-size:42px;margin-bottom:4px;filter:drop-shadow(0 2px 8px rgba(0,0,0,0.4));">🏆</div>
      <div class="celebration-tag" style="display:inline-block;margin-bottom:6px;background:rgba(255,210,63,0.18);color:var(--kid-yellow);border:1.5px solid rgba(255,210,63,0.5);border-radius:14px;padding:3px 12px;font-weight:800;font-size:12px;letter-spacing:.08em;">DOCKING COMPLETE · HATCH SEALED</div>
      <h3 style="font-family:var(--kid-display);font-size:22px;color:#fff;margin:4px 0 8px;">Arrival at Asteria Station!</h3>
      <p style="font-size:14px;color:var(--kid-soft);margin:0 0 10px;line-height:1.4;">
        <b>Commander Elena:</b> “Welcome aboard, Cadet Jin! Follow these 5 steps to complete the orbital mission and land safely on Mars.”
      </p>
    </div>
    <div class="kid-section-title" style="margin-top:6px;">📋 5 Steps to Complete the Mission</div>
    <div class="kid-steps-preview-grid" style="display:grid;grid-template-columns:1fr;gap:6px;margin:6px 0 12px;">
      ${MISSION_STEP_MESSAGES.map(s => `
        <div class="kid-step-preview-row" style="display:flex;align-items:center;gap:10px;background:rgba(255,255,255,0.06);border:1px solid rgba(76,201,255,0.3);border-radius:12px;padding:8px 12px;text-align:left;">
          <span style="font-size:22px;flex-shrink:0;">${s.icon}</span>
          <div style="flex:1;">
            <strong style="display:block;font-size:13px;color:#ffd23f;">Step ${s.num}: ${s.title}</strong>
            <span style="display:block;font-size:12px;color:#fff;opacity:0.9;">${s.briefMsg}</span>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="kid-nasa-fact-pill" style="text-align:left;display:inline-block;padding:8px 14px;background:rgba(76,201,255,0.12);border:1.5px solid var(--kid-sky);border-radius:14px;color:#eef2f5;font-size:13px;line-height:1.4;">
      🚀 <b>Practical Station Training:</b> As you complete each step, you will see a highlighted achievement message and next-step guide!
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
    stationLessonContext = ctx;
    const view = await createArrivalScene({container: document.getElementById('world'), getState: () => ctx.mission, act: a => ctx.act(a), onPause: () => ctx.pause(),
      openPart: pid => partDialog(ctx, pid), openCase: () => lockerDialog(ctx), openPlanner: () => planner(ctx), openHatch: () => hatch(ctx), talk: who => talk(ctx, who)});
    view.world.onInspect = text => ctx.hud.toast(text, 'quiet');
    view.world.onFrame(() => updateStationTelemetry(ctx));
    return view;
  },
  brief, sources, debrief,
  ready(ctx) {
    // Replay includes the Mars opening and docking; landing-only retry stays in the cabin.
    ctx.restart = () => { clearSaved(ID); clearApproach(); location.reload(); };

    // Initialize already completed steps so alerts only fire on newly achieved steps
    completedMissionSteps = new Set();
    for (const step of MISSION_STEP_MESSAGES) {
      if (step.doneCheck(ctx.mission)) {
        completedMissionSteps.add(step.num);
      }
    }

    // Unify "Practical Lesson" into the main "🔬 Details" button and remove redundant default details button
    const actionsBar = document.querySelector('.mx-actions');
    const oldDetails = document.getElementById('mx-details');
    if (oldDetails) {
      oldDetails.hidden = true;
      oldDetails.style.display = 'none';
      oldDetails.classList.add('orbit-hidden');
      oldDetails.remove();
    }
    if (actionsBar && !document.getElementById('station-practice-btn')) {
      const btn = document.createElement('button');
      btn.id = 'station-practice-btn';
      btn.type = 'button';
      btn.textContent = '🔬 Details';
      btn.title = 'Station procedures, visual hardware guides & mission details';
      btn.setAttribute('aria-pressed', 'false');
      btn.onclick = () => {
        if (stationLessonActive && stationLessonEl && !stationLessonEl.hidden) {
          closeStationLesson();
        } else {
          startStationLesson(ctx, getActiveStationStepIndex(ctx.mission));
        }
      };
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
    if (stationLessonActive && ctx.view?.world?.player) {
      const p = ctx.view.world.player.position;
      if (!stationStepCompleted) {
        if (currentStationStep === 0) {
          const loads = s.loads || {};
          const countOn = (loads.radio ? 1 : 0) + (loads.amp ? 1 : 0) + (loads.motor ? 1 : 0);
          if (countOn === 3) {
            completeStationStep();
          }
        } else if (currentStationStep === 1 && (s.diagnosed || s.fixed)) {
          completeStationStep();
        } else if (currentStationStep === 2 && s.comms) {
          completeStationStep();
        } else if (currentStationStep === 3 && s.site) {
          completeStationStep();
        } else if (currentStationStep === 4 && s.boarded) {
          completeStationStep();
        }
      }
    }

    // Monitor and celebrate every step of completing the mission!
    if (s.phase === 'active') {
      for (const step of MISSION_STEP_MESSAGES) {
        if (!completedMissionSteps.has(step.num) && step.doneCheck(s)) {
          completedMissionSteps.add(step.num);
          showStepCompletionAlert(step);
          hud.toast(`🎉 ${step.completeTitle} · ${step.nextTip}`, 'info');
          break;
        }
      }
      updateStationGuidance(s);
    }
    updateStationTelemetry(ctx);
  },
});

function getStationTarget(s) {
  if (s.stage === 'descent' || s.phase !== 'active') return null;
  if (s.tripped) return {id: 'panel', name: 'Power panel', icon: '⚡'};
  if (!inShadow(s) && minutesToShadow(s) <= 10 && powerUsed(s) > s.scenario.power.shadow) {
    return {id: 'panel', name: 'Power panel', icon: '⚡'};
  }
  if (s.holding === 'tester') return {id: 'rack', name: 'Radio rack', icon: '📻'};
  if (s.holding === 'amp' && !s.fixed) {
    return s.loads.amp ? {id: 'panel', name: 'Power panel', icon: '⚡'} : {id: 'rack', name: 'Radio rack', icon: '📻'};
  }
  if (!s.comms) {
    if (s.fixed) {
      const off = s.scenario.testNeeds.find(l => !s.loads[l]);
      return off ? {id: 'panel', name: 'Power panel', icon: '⚡'} : {id: 'rack', name: 'Radio rack', icon: '📻'};
    }
    if (s.diagnosed) {
      const p = s.scenario.parts[s.diagnosed];
      if (s.loads[p.load]) return {id: 'panel', name: 'Power panel', icon: '⚡'};
      if (s.diagnosed === 'amp') return s.holding === 'amp' ? {id: 'rack', name: 'Radio rack', icon: '📻'} : {id: 'locker', name: 'Spares locker', icon: '🧰'};
      return {id: 'rack', name: 'Radio rack', icon: '📻'};
    }
    const need = s.scenario.testNeeds.find(l => !s.loads[l]);
    if (need) return {id: 'panel', name: 'Power panel', icon: '⚡'};
    return {id: 'rack', name: 'Radio rack', icon: '📻'};
  }
  if (!s.site) {
    if (!hazardCamReady(s) && !s.loads.charger) return {id: 'panel', name: 'Power panel', icon: '⚡'};
    return {id: 'planner', name: 'Landing planner', icon: '🗺️'};
  }
  return {id: 'hatch', name: 'Lander hatch', icon: '🚀'};
}

function updateStationGuidance(s) {
  const target = getStationTarget(s);

  // Update walk buttons highlight
  const locButtons = document.querySelectorAll('#locations button');
  if (locButtons.length) {
    locButtons.forEach(btn => {
      const label = btn.textContent || '';
      const isTarget = target && (
        (target.id === 'panel' && label.includes('Power panel')) ||
        (target.id === 'rack' && label.includes('Radio rack')) ||
        (target.id === 'locker' && label.includes('Spares')) ||
        (target.id === 'planner' && label.includes('Planner')) ||
        (target.id === 'hatch' && label.includes('Hatch')) ||
        (target.id === 'window' && label.includes('Window'))
      );
      btn.classList.toggle('is-next-target', !!isTarget);
    });
  }

  // Remove waypoint pill from job card if present
  const waypointEl = document.getElementById('mx-job-waypoint');
  if (waypointEl) {
    waypointEl.remove();
  }
}
