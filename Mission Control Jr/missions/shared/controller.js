// Page controller shared by the expansion missions: HUD, Pip, saving, pause, retry, prompts.
// Each mission supplies its rules (pure functions), its 3D scene and its story/debrief screens.
import {buildHud, dialog, closeDialog, dialogOpen, narration} from './hud.js';
import {mountPipLesson, openPipLesson, pipLessonOpen} from '../../professor-pip.js';
import {pipLessonStep} from '../../professor-pip-lessons.js';
import {showCameraView} from '../../player.js';
import {learningMode} from '../../simulation/learning.js';
import {startPip} from '../../companion.js';
import {connectChapter, openJourney, journeyPaused} from '../../campaign-bridge.js';
import {readJourney} from '../../journey-state.js';
import {loadSaved, makeSaver, clearSaved, snapshot, restore, reporter} from './runtime.js';

/**
 * spec: {id, title, place, meters, carryFrom, schema?, migrate?(oldState), create(carry), rules: {applyAction, advance?, getObjective, getSteps},
 *        scene(ctx) → view, brief(ctx), sources(ctx) → html, hud(ctx, dt), debrief(ctx), sampler(ctx)}
 */
export async function runMission(spec) {
  const $ = id => document.getElementById(id);
  const hud = buildHud({title: spec.title, place: spec.place, meters: spec.meters});
  const pauseButton = $('pause'), viewButton = $('view');
  startPip(spec.id, {collapsed: Boolean(spec.rules.getInstruction)});
  const sampleMode = new URLSearchParams(location.search).get('sampler') === '1';
  const persist = makeSaver(spec.id, {sampleMode});
  const report = reporter(spec.id);
  let carry = {}; try { carry = spec.carryFrom ? readJourney(localStorage).records[spec.carryFrom]?.carry || {} : {}; } catch {}
  const saved = sampleMode ? {state: null} : loadSaved(spec.id, undefined, {schema: spec.schema, migrate: spec.migrate});
  let paused = false, hudClock = 0;
  const completedSharedSteps = new Set();
  let stepAlertElShared = null;
  let stepAlertTimerShared = null;
  const deck = spec.id === 'orbit' ? 'station' : spec.id;
  const lessonOptions = () => ({
    deck,
    step: pipLessonStep[deck](ctx.mission),
    onOpen: () => { ctx.view.world.interaction.stopHold(); ctx.setControls(); },
    onClose: () => ctx.setControls(),
  });

  const ctx = {
    id: spec.id, hud, sampleMode, carry, report, persist, view: null, checkpoint: null,
    mission: saved.state || spec.create(carry),
    fresh() { return spec.create(carry); },
    act(action, {quiet = false} = {}) {
      const result = spec.rules.applyAction(ctx.mission, action);
      if (!quiet || !result.ok) {
        if (spec.rules.getInstruction && (!result.ok || !dialogOpen())) hud.notice(result.message, !result.ok);
        else hud.toast(result.message, result.ok ? 'info' : 'warn');
      }
      if (!result.ok && dialogOpen()) {
        const body = $('dialog-body');
        let feedback = body.querySelector('.mx-action-feedback');
        if (!feedback) {
          feedback = document.createElement('p');
          feedback.className = 'mx-tip mx-action-feedback';
          feedback.setAttribute('role', 'status');
          body.append(feedback);
        }
        feedback.textContent = result.message;
        feedback.scrollIntoView({block: 'nearest'});
      }
      if (result.ok) { persist(ctx.mission, true); ctx.view?.sync?.(); }
      if (ctx.mission.phase === 'debrief') spec.debrief(ctx);
      return result;
    },
    playing: () => ctx.mission.phase === 'active' && !dialogOpen() && !pipLessonOpen() && !paused && !journeyPaused && !ctx.busy,
    busy: false,
    setControls() {
      if (!ctx.view) return;
      const active = ctx.playing();
      const {player} = ctx.view.world;
      player.enabled = active;
      pauseButton.disabled = !active;
      viewButton.disabled = !active;
      if (!active) player.release();
    },
    close() { closeDialog(); ctx.setControls(); },
    dialog,
    briefing(screen) {
      dialog({...screen, actions: [
        ...screen.actions,
        {label: 'Pip’s lesson', run: () => openPipLesson(spec.id, {...lessonOptions(), finishLabel: 'Back to briefing'})},
      ]});
    },
    saveCheckpoint() { ctx.checkpoint = snapshot(ctx.mission); },
    retry(after) { hud.notice(''); completedSharedSteps.clear(); ctx.mission = restore(ctx.checkpoint); report.reset(); ctx.view.sync?.({animate: false}); after(); },
    restart() { hud.notice(''); completedSharedSteps.clear(); clearSaved(spec.id); ctx.mission = ctx.fresh(); report.reset(); ctx.view.sync?.({animate: false}); spec.brief(ctx); },
    sourcesDialog(back) { dialog({title: 'Where this comes from', body: spec.sources(ctx), actions: [{label: '← Back', run: back}]}); },
    pause() {
      if (dialogOpen() || pipLessonOpen() || ctx.mission.phase !== 'active' || ctx.busy) return;
      paused = true;
      ctx.setControls();
      showPause();
    },
    openJourney,
  };

  // A restored game has already completed its earlier objectives. Seed the
  // transition tracker so reopening a save does not replay an old completion popup.
  for (const [i, step] of spec.rules.getSteps(ctx.mission).entries()) {
    if (step.done) completedSharedSteps.add(i);
  }

  function showPause() {
    dialog({title: 'Paused', body: '<p>The mission clock is stopped.</p>', actions: [
      {label: 'Keep playing', primary: true, run: () => { paused = false; ctx.close(); }},
      {label: `Read aloud: ${narration() ? 'On' : 'Off'}`, run: () => { hud.toggleNarration(); showPause(); }},
      {label: `Science details: ${learningMode() === 'details' ? 'On' : 'Off'}`, run: () => { hud.toggleScience(); showPause(); }},
      {label: 'Sources', run: () => ctx.sourcesDialog(showPause)},
    ]});
  }

  pauseButton.disabled = true;
  pauseButton.onclick = () => ctx.pause(); $('journey').onclick = openJourney;
  document.addEventListener('visibilitychange', () => { if (document.hidden && ctx.playing()) ctx.pause(); });
  connectChapter(spec.id, () => ctx.setControls());
  try {
    ctx.view = await spec.scene(ctx);
    const {world} = ctx.view;
    viewButton.disabled = true;
    world.player.onViewChange = view => showCameraView(viewButton, view);
    showCameraView(viewButton, world.player.view);
    viewButton.onclick = () => world.player.toggleView();
    viewButton.hidden = false;
    mountPipLesson(document.querySelector('.mx-job-tools'), spec.id, lessonOptions);
    world.interaction.on('focus', f => hud.prompt(f)); world.interaction.on('hold', p => hud.hold(p));
    const use = $('mx-use');
    use.onclick = e => { if (e.detail === 0) world.interaction.use(); }; // keyboard activation
    use.onpointerdown = () => world.interaction.use(); use.onpointerup = () => world.interaction.stopHold(); use.onpointerleave = () => world.interaction.stopHold();
    hud.walkButtons(ctx.view.walkTargets, target => {
      if (!ctx.playing()) return;
      const moving = ctx.view.walk(target);
      if (moving === false) hud.notice('The way is blocked. Walk around the equipment with WASD.', true);
      else if (!spec.rules.getInstruction) hud.toast('Walking… press E when you get there.', 'quiet');
    });
function showStepAlertShared(title, text, nextTip, icon = '🎉', onOpenLesson = null) {
  if (!stepAlertElShared) {
    stepAlertElShared = document.createElement('div');
    stepAlertElShared.id = 'mission-step-alert';
    stepAlertElShared.className = 'mission-step-alert-card';
    stepAlertElShared.setAttribute('role', 'alert');
    stepAlertElShared.setAttribute('aria-live', 'assertive');
    stepAlertElShared.innerHTML = `
      <span class="step-alert-icon" id="shared-step-alert-icon">🎉</span>
      <div class="step-alert-body">
        <strong id="shared-step-alert-title"></strong>
        <p id="shared-step-alert-msg"></p>
        <span class="step-alert-next" id="shared-step-alert-next"></span>
      </div>
      <button type="button" class="step-alert-lesson-btn" id="shared-step-alert-lesson">🎓 Pip’s Lesson</button>
      <button type="button" class="step-alert-dismiss" aria-label="Dismiss alert">✕</button>
    `;
    document.body.appendChild(stepAlertElShared);
    stepAlertElShared.querySelector('.step-alert-dismiss').onclick = () => {
      stepAlertElShared.hidden = true;
    };
  }
  stepAlertElShared.querySelector('#shared-step-alert-icon').textContent = icon;
  stepAlertElShared.querySelector('#shared-step-alert-title').textContent = title;
  stepAlertElShared.querySelector('#shared-step-alert-msg').textContent = text;
  stepAlertElShared.querySelector('#shared-step-alert-next').textContent = nextTip ? `👉 Next: ${nextTip}` : '';

  const lessonBtn = stepAlertElShared.querySelector('#shared-step-alert-lesson');
  if (lessonBtn) {
    lessonBtn.onclick = () => {
      stepAlertElShared.hidden = true;
      if (onOpenLesson) onOpenLesson();
      else openPipLesson(spec.id, { step: pipLessonStep[spec.id]?.(ctx.mission) || 0, autoVoice: true });
    };
  }

  stepAlertElShared.hidden = false;
  clearTimeout(stepAlertTimerShared);
  stepAlertTimerShared = setTimeout(() => {
    if (stepAlertElShared) stepAlertElShared.hidden = true;
  }, 8500);

  if (narration()) {
    try {
      const u = new SpeechSynthesisUtterance(`${title}. ${text}. ${nextTip ? 'Next: ' + nextTip : ''}`);
      speechSynthesis.speak(u);
    } catch {}
  }
}

    world.onFrame(dt => {
      if (ctx.playing()) spec.rules.advance?.(ctx.mission, dt, ctx);
      hudClock += dt;
      if (hudClock >= .1) {
        hudClock = 0; const m = ctx.mission;
        hud.objective(spec.rules.getObjective(m), {read: !spec.rules.getInstruction});
        if (spec.rules.getInstruction) hud.instruction(ctx.busy ? {text: 'Watch the scene. The next instruction will appear when it ends.'} : spec.rules.getInstruction?.(m));
        const stepsList = spec.rules.getSteps(m);
        hud.steps(stepsList);
        if (ctx.playing() && spec.id !== 'orbit' && !sampleMode) {
          for (let i = 0; i < stepsList.length; i++) {
            if (stepsList[i].done && !completedSharedSteps.has(i)) {
              completedSharedSteps.add(i);
              const nextStep = stepsList.slice(i + 1).find(s => !s.done);
              const nextTip = nextStep ? nextStep.text : 'Mission objective accomplished!';
              const stepNum = i + 1;
              const text = stepsList[i].text;
              const icon = text.includes('harvest') || text.includes('plants') || text.includes('dinner') ? '🥗'
                : text.includes('water') || text.includes('leak') ? '💧'
                : text.includes('Earth') || text.includes('Message') || text.includes('relay') ? '📡'
                : text.includes('dust') || text.includes('clean') || text.includes('Vacuum') || text.includes('Brush') ? '🧹'
                : text.includes('Sun') || text.includes('solar') || text.includes('light') || text.includes('mast') ? '☀️'
                : text.includes('power') || text.includes('battery') ? '⚡'
                : text.includes('plan') ? '📋'
                : '🎉';
              const lessonStep = pipLessonStep[spec.id] ? pipLessonStep[spec.id](ctx.mission) : Math.min(i, 2);
              showStepAlertShared(
                `STEP ${stepNum} COMPLETE: ${text}! ✅`,
                `Great work, Cadet! Step ${stepNum} accomplished.`,
                nextTip,
                icon,
                () => openPipLesson(spec.id, { step: lessonStep, autoVoice: true, onFinish: () => ctx.setControls() })
              );
              hud.toast(`🎉 Step ${stepNum} done! Next: ${nextTip}`, 'info');
              break;
            }
          }
        }
        if (m.notice) {
          if (spec.rules.getInstruction) hud.notice(m.notice, true);
          else hud.toast(m.notice, 'warn');
          m.notice = '';
        }
        spec.hud(ctx);
      }
      // Dynamic distance of destination for every small task
      const guideInfo = world.guideInfo?.();
      const currentInst = ctx.busy ? null : spec.rules.getInstruction?.(ctx.mission);
      const targetStationId = currentInst?.place;
      const targetObj = targetStationId && ctx.view?.walkTargets ? ctx.view.walkTargets.find(w => w.id === targetStationId) : null;
      let destName = targetObj ? targetObj.label.replace(/^[^\p{L}]+/u, '') : null;
      let destDist = null;
      if (guideInfo && guideInfo.distance != null) {
        destDist = guideInfo.distance;
        if (!destName && guideInfo.target?.name) {
          destName = guideInfo.target.name.replace(/[-_]/g, ' ');
        }
      } else if (targetObj) {
        const tx = targetObj.x ?? targetObj.point?.x;
        const tz = targetObj.z ?? targetObj.point?.z;
        if (tx != null && tz != null) {
          destDist = Math.hypot(world.player.position.x - tx, world.player.position.z - tz);
        }
      }
      const placeDists = {};
      if (ctx.view?.walkTargets) {
        for (const wt of ctx.view.walkTargets) {
          const wx = wt.x ?? wt.point?.x;
          const wz = wt.z ?? wt.point?.z;
          if (wx != null && wz != null) {
            placeDists[wt.id] = Math.hypot(world.player.position.x - wx, world.player.position.z - wz);
          }
        }
      }
      hud.updateDistanceTracker?.({
        destination: destName,
        distance: destDist,
        ready: destDist != null && destDist < 2.5,
        places: placeDists,
      });
      hud.edge(world.guideScreen()); persist(ctx.mission); ctx.setControls();
    });
    if (saved.migrated) hud.toast(ctx.mission.notice || 'Your saved game was updated to the new version.', 'quiet');
    if (saved.discarded) hud.toast('Your old save was from an older version, so this is a fresh start.', 'quiet');
    if (sampleMode) spec.sampler(ctx);
    else if (saved.state && ctx.mission.phase === 'active' && spec.resumePlan && !ctx.mission.plan) spec.resumePlan(ctx);
    else if (saved.state && ctx.mission.phase === 'active') dialog({title: 'Welcome back!', body: '<p>We found your saved game. Keep going?</p>', actions: [{label: '▶ Keep playing', primary: true, run: () => ctx.close()}, {label: 'Start over', run: () => ctx.restart()}]});
    else if (ctx.mission.phase === 'debrief') spec.debrief(ctx);
    else spec.brief(ctx);
    window.__mission = {get state() { return ctx.mission; }, act: ctx.act, view: ctx.view, ctx, step(seconds) { for (let t = 0; t < seconds; t += .1) spec.rules.advance?.(ctx.mission, .1, ctx); ctx.view.sync?.(); }};
    spec.ready?.(ctx);
  } catch (error) {
    console.error(error);
    dialog({title: 'The mission did not load', body: '<p>Please reload the page.</p>', actions: [{label: '🗺️ Back to the map', run: openJourney}]});
  }
  return ctx;
}
