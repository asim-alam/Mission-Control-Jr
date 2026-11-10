// Page controller shared by the expansion missions: HUD, Pip, saving, pause, retry, prompts.
// Each mission supplies its rules (pure functions), its 3D scene and its story/debrief screens.
import {buildHud, dialog, closeDialog, dialogOpen} from './hud.js';
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
  startPip(spec.id);
  const sampleMode = new URLSearchParams(location.search).get('sampler') === '1';
  const persist = makeSaver(spec.id, {sampleMode});
  const report = reporter(spec.id);
  let carry = {}; try { carry = spec.carryFrom ? readJourney(localStorage).records[spec.carryFrom]?.carry || {} : {}; } catch {}
  const saved = sampleMode ? {state: null} : loadSaved(spec.id, undefined, {schema: spec.schema, migrate: spec.migrate});
  let paused = false, hudClock = 0;

  const ctx = {
    id: spec.id, hud, sampleMode, carry, report, persist, view: null, checkpoint: null,
    mission: saved.state || spec.create(carry),
    fresh() { return spec.create(carry); },
    act(action, {quiet = false} = {}) {
      const result = spec.rules.applyAction(ctx.mission, action);
      if (!quiet || !result.ok) hud.toast(result.message, result.ok ? 'info' : 'warn');
      if (result.ok) { persist(ctx.mission, true); ctx.view?.sync?.(); }
      if (ctx.mission.phase === 'debrief') spec.debrief(ctx);
      return result;
    },
    playing: () => ctx.mission.phase === 'active' && !dialogOpen() && !paused && !journeyPaused && !ctx.busy,
    busy: false,
    setControls() { if (!ctx.view) return; ctx.view.world.player.enabled = ctx.playing(); if (!ctx.playing()) ctx.view.world.player.release(); },
    close() { closeDialog(); ctx.setControls(); },
    dialog,
    saveCheckpoint() { ctx.checkpoint = snapshot(ctx.mission); },
    retry(after) { ctx.mission = restore(ctx.checkpoint); report.reset(); ctx.view.sync?.({animate: false}); after(); },
    restart() { clearSaved(spec.id); ctx.mission = ctx.fresh(); report.reset(); ctx.view.sync?.({animate: false}); spec.brief(ctx); },
    sourcesDialog(back) { dialog({title: 'Where this comes from', body: spec.sources(ctx), actions: [{label: '← Back', run: back}]}); },
    pause() {
      if (dialogOpen() || ctx.mission.phase !== 'active') return; paused = true; ctx.setControls();
      dialog({title: 'Paused', body: '<p>The clock is stopped. Take a break!</p>', actions: [
        {label: '▶ Keep playing', primary: true, run: () => { paused = false; ctx.close(); }},
        {label: 'Sources', run: () => ctx.sourcesDialog(() => { paused = false; ctx.pause(); })}, {label: '🗺️ Map', run: openJourney}]});
    },
    openJourney,
  };

  $('pause').onclick = () => ctx.pause(); $('journey').onclick = openJourney;
  document.addEventListener('visibilitychange', () => { if (document.hidden && ctx.playing()) ctx.pause(); });
  connectChapter(spec.id, () => ctx.setControls());
  try {
    ctx.view = await spec.scene(ctx);
    const {world} = ctx.view;
    world.interaction.on('focus', f => hud.prompt(f)); world.interaction.on('hold', p => hud.hold(p));
    const use = $('mx-use');
    use.onclick = e => { if (e.detail === 0) world.interaction.use(); }; // keyboard activation
    use.onpointerdown = () => world.interaction.use(); use.onpointerup = () => world.interaction.stopHold(); use.onpointerleave = () => world.interaction.stopHold();
    hud.walkButtons(ctx.view.walkTargets, target => { if (ctx.playing()) { ctx.view.walk(target); hud.toast('Walking… press E when you get there.', 'quiet'); } });
    world.onFrame(dt => {
      if (ctx.playing()) spec.rules.advance?.(ctx.mission, dt, ctx);
      hudClock += dt;
      if (hudClock >= .1) {
        hudClock = 0; const m = ctx.mission;
        hud.objective(spec.rules.getObjective(m)); hud.steps(spec.rules.getSteps(m));
        if (m.notice) { hud.toast(m.notice, 'warn'); m.notice = ''; }
        spec.hud(ctx);
      }
      hud.edge(world.guideScreen()); persist(ctx.mission); ctx.setControls();
    });
    if (saved.migrated) hud.toast(ctx.mission.notice || 'Your saved game was updated to the new version.', 'quiet');
    if (saved.discarded) hud.toast('Your old save was from an older version, so this is a fresh start.', 'quiet');
    if (sampleMode) spec.sampler(ctx);
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
