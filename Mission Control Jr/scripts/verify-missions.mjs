// End-to-end check of the four redesigned Mars missions in headless Chrome.
// Usage: npm run dev   (in another terminal), then
//        node scripts/verify-missions.mjs [shelter|orbit|storm|rover|all] [--shots=docs/mission-redesign-v2/after] [--width=1440]
// Each flow: start → play to completion → completion record → retry → save/reload → (legacy save where it applies).
// Arrival camera: --landing-view=cockpit or --landing-view=exterior (default).
import {mkdir} from 'node:fs/promises';
import {openPage} from './cdp.mjs';

const args = Object.fromEntries(process.argv.slice(3).map(a => a.replace(/^--/, '').split('=')));
const which = process.argv[2] || 'all';
const BASE = args.base || 'http://127.0.0.1:5173/';
const SHOTS = args.shots || 'docs/mission-redesign-v2/after';
const WIDTH = +(args.width || 1440), HEIGHT = +(args.height || 900);
await mkdir(SHOTS, {recursive: true});
const results = []; let lastPage = null;
const sleep = ms => new Promise(r => setTimeout(r, ms));
const check = (name, cond, detail = '') => { results.push({name, ok: !!cond, detail}); console.log(`${cond ? '✔' : '✖'} ${name}${detail ? ` — ${detail}` : ''}`); };

/**
 * Missions run inside the journey shell (index.html) in an iframe. page.eval / page.run evaluate inside
 * that iframe (via `with`), page.top runs in the shell itself.
 */
const IN_FRAME = body => `const W = document.getElementById('scene')?.contentWindow; if (!W) throw Error('no frame'); with (W) { ${body} }`;
function wrap(page) {
  const run = page.eval; page.top = run; page.run = b => run(IN_FRAME(b)); page.eval = e => run(IN_FRAME(`return (${e})`));
  page.waitFor = async (e, timeout = 60000) => { const end = Date.now() + timeout; while (Date.now() < end) { try { if (await page.eval(`!!(${e})`)) return true; } catch {} await sleep(250); } throw new Error(`Timed out waiting for: ${e}`); };
  return page;
}
async function launch(page) {
  const end = Date.now() + 120000;
  while (Date.now() < end) {
    try { if (await page.eval('!!window.__mission && !!document.querySelector("#dialog:not([hidden])")')) return; } catch {}
    await page.top(`document.querySelector('#transition:not([hidden]) button.primary, #transition:not([hidden]) button')?.click()`).catch(() => {});
    await sleep(400);
  }
  throw new Error('mission did not start');
}
async function open(id, {fresh = true, width = WIDTH, height = HEIGHT, setup = ''} = {}) {
  const page = wrap(await openPage(BASE + 'index.html', {width, height})); lastPage = page;
  await sleep(1500);
  await page.top(`${fresh ? 'localStorage.clear();' : ''} ${setup} location.href = './index.html?mission=${id}';`);
  await sleep(1500);
  await launch(page);
  page.logs.length = 0;
  return page;
}
const primary = page => page.eval(`(() => { const b = document.querySelector('#dialog:not([hidden]) #dialog-actions button.primary:not(:disabled)'); if (!b) return false; b.click(); return true; })()`);
const clickLabel = (page, text) => page.eval(`(() => { const b = [...document.querySelectorAll('#dialog-actions button, #dialog-body button')].find(b => b.textContent.includes(${JSON.stringify(text)}) && !b.disabled); if (!b) return false; b.click(); return true; })()`);
const act = (page, a) => page.eval(`(() => { const r = __mission.act(${JSON.stringify(a)}, {quiet: true}); return r.ok ? 'ok' : r.message; })()`);
const state = (page, expr) => page.eval(`(() => { const m = __mission.state; return ${expr}; })()`);
const dialogTitle = page => page.eval(`document.querySelector('#dialog:not([hidden]) #dialog-title')?.textContent || ''`);
const journey = (page, id) => page.eval(`(() => { try { return JSON.parse(localStorage.getItem('mission-control-jr.journey.v1')).records[${JSON.stringify(id)}] || null; } catch { return null; } })()`);
async function reloadAndResume(page) {
  await page.eval(`__mission.ctx.persist(__mission.state, true)`);
  await page.run('location.reload()'); await sleep(800);
  await launch(page);
  const title = await dialogTitle(page);
  await primary(page);
  return title;
}
const soon = (page, e, ms = 20000) => page.waitFor(e, ms).then(() => true, () => false);
const errorsOf = page => page.logs.filter(l => l.startsWith('[exception]') || l.startsWith('[error]'));

// ---- A Place to Hide ------------------------------------------------------------------------
async function shelter() {
  console.log('\n— A Place to Hide —');
  const page = await open('solar-shelter');
  await page.shot(`${SHOTS}/shelter-1-brief.png`);
  await clickLabel(page, 'explainer'); await sleep(300);
  check('shelter: SEP explainer opens', /Flares/.test(await dialogTitle(page)));
  await page.shot(`${SHOTS}/shelter-2-explainer.png`);
  await clickLabel(page, 'Skip'); await sleep(200);
  check('shelter: group alert after the explainer', /Particle warning/.test(await dialogTitle(page)));
  await primary(page); await sleep(400);
  check('shelter: mission active', await state(page, 'm.phase') === 'active');
  // Hands-on interaction through the real look-to-use system: walk up to Elena and press E.
  await page.eval(`(() => { const p = __mission.view.world.player; p.position.set(-1.4, 1.62, -1.2); p.yaw = 0; p.pitch = -.2; p.syncCamera(); })()`); await sleep(500);
  const used = await page.eval(`__mission.view.world.interaction.useById('elena')`); await sleep(300);
  check('shelter: E on Elena opens the help choice', used && /Elena can do one job/.test(await dialogTitle(page)));
  await page.eval(`document.querySelector('[data-assist="trolley"]').click()`); await sleep(300);
  await act(page, {id: 'openMap'});
  await page.eval(`__mission.ctx.dialog && document.querySelector('#sx-tablet').click()`); await sleep(400);
  await page.shot(`${SHOTS}/shelter-3-tablet-map.png`); await clickLabel(page, 'Close');
  const steps = [{id: 'buildRack', payload: 'back_l'}];
  for (let i = 1; i <= 6; i++) steps.push({id: 'pickUp', targetId: `water-${i}`}, {id: 'loadRack'});
  steps.push({id: 'latchRack'});
  for (const [i, r] of [[1, 'roof_l'], [2, 'roof_l'], [3, 'roof_r'], [4, 'roof_r']]) steps.push({id: 'pickUp', targetId: `poly-${i}`}, {id: 'slidePanel', targetId: r}, {id: 'fastenPanel', targetId: `poly-${i}`});
  steps.push({id: 'moveCrew', targetId: 'jin', payload: 'C'});
  let bad = [];
  for (const a of steps) { const r = await act(page, a); if (r !== 'ok') bad.push(`${a.id}:${r}`); }
  check('shelter: build water rack + roof panels', !bad.length, bad.join(' '));
  await sleep(1500);
  await page.eval(`(() => { const p = __mission.view.world.player; p.position.set(-4.4, 1.62, 1.6); p.yaw = 0; p.pitch = -.15; p.syncCamera(); })()`); await sleep(800);
  await page.shot(`${SHOTS}/shelter-4-built-refuge.png`);
  const saveTitle = await reloadAndResume(page);
  check('shelter: save/reload resumes the build', /Welcome back/.test(saveTitle) && await state(page, 'm.rack.latched && m.minutes > 50'));
  await page.eval(`(() => { const p = __mission.view.world.player; p.position.set(-4.6, 1.62, 1.4); p.yaw = 0; p.syncCamera(); })()`); await sleep(400);
  await page.eval(`__mission.view.world.interaction.useById('check')`); await sleep(300);
  check('shelter: refuge check dialog', /Ready when you are|Not ready/.test(await dialogTitle(page)));
  await page.shot(`${SHOTS}/shelter-5-check.png`);
  await primary(page); await sleep(300);
  await page.eval('__mission.step(3)');
  await act(page, {id: 'toggleOverlay'});
  await page.eval('__mission.step(20)');
  check('shelter: event shows outside and refuge sensors', await soon(page, `!document.getElementById('sx-sensors').hidden && +document.getElementById('sx-out').textContent > +document.getElementById('sx-in').textContent`));
  await page.eval(`(() => { const p = __mission.view.world.player; p.yaw = Math.PI * .85; p.pitch = .35; p.syncCamera(); })()`); await sleep(600);
  await page.shot(`${SHOTS}/shelter-6-event.png`);
  await page.eval('__mission.step(80)');
  check('shelter: all clear appears', await soon(page, `/back to normal/.test(document.querySelector('#dialog:not([hidden]) #dialog-title')?.textContent)`));
  await primary(page);
  check('shelter: debrief', await soon(page, `/refuge/i.test(document.querySelector('#dialog:not([hidden]) #dialog-title')?.textContent)`));
  await page.shot(`${SHOTS}/shelter-7-debrief.png`);
  const rec = await journey(page, 'solar-shelter');
  check('shelter: completion recorded on the journey map', rec && rec.attemptCompleted !== false, JSON.stringify(rec)?.slice(0, 120));
  await clickLabel(page, 'cutaway'); await soon(page, `document.getElementById('sx-back') && !document.getElementById('sx-back').hidden`); await sleep(1500);
  await page.shot(`${SHOTS}/shelter-8-cutaway.png`);
  await page.eval(`document.getElementById('sx-back').click()`);
  await soon(page, `/Try changing one thing/.test(document.getElementById('dialog-actions').textContent)`); await clickLabel(page, 'Try changing one thing');
  await soon(page, `/Rebuild my last layout/.test(document.getElementById('dialog-actions').textContent)`); await clickLabel(page, 'Rebuild my last layout');
  const rebuilt = await soon(page, `(() => { const m = __mission.state; return m.phase === 'active' && m.stage === 'prep' && m.rack.latched && m.items.filter(i => i.at.startsWith('rail:')).length === 4; })()`);
  check('shelter: retry rebuilds the last layout in prep', rebuilt, rebuilt ? '' : await state(page, 'JSON.stringify({phase: m.phase, stage: m.stage, rack: m.rack, rails: m.items.filter(i => i.at.startsWith("rail:")).length, dlg: document.querySelector("#dialog:not([hidden]) #dialog-title")?.textContent})'));
  // Narrow viewport + keyboard: the HUD must not overflow.
  await page.eval(`document.querySelector('#dialog:not([hidden]) #dialog-actions button')?.click()`);
  const errs = errorsOf(page); check('shelter: no page errors', !errs.length, errs.join(' | '));
  await page.close();
  // Legacy (schema 2) save migrates.
  const legacySave = {missionId: 'solar-shelter', schema: 2, phase: 'active', stage: 'prep', simSeconds: 300, plan: 'roof', carryNote: 'prepared', events: []};
  const legacy = await open('solar-shelter', {width: 390, height: 844, setup: `localStorage.setItem('mission-control-jr.active-attempt.v1.solar-shelter', ${JSON.stringify(JSON.stringify({version: 1, missionId: 'solar-shelter', savedAt: 1, snapshot: JSON.stringify({version: 1, state: legacySave})}))});`});
  check('shelter: legacy schema-2 save migrates', await legacy.eval(`__mission.state.schema === 3 && __mission.state.phase === 'active' && __mission.state.migratedFrom === 2`));
  await primary(legacy); await sleep(600);
  check('shelter: narrow viewport has no horizontal scroll', await legacy.eval('document.documentElement.scrollWidth <= innerWidth + 1'));
  await legacy.shot(`${SHOTS}/shelter-9-narrow.png`);
  await legacy.close();
}

// ---- Arrival at Mars ------------------------------------------------------------------------
const stand = (page, x, z, yaw, pitch = -.1) => page.eval(`(() => { const p = __mission.view.world.player; p.position.set(${x}, 1.62, ${z}); p.yaw = ${yaw}; p.pitch = ${pitch}; p.syncCamera(); })()`);
async function orbit() {
  console.log('\n— Arrival at Mars —');
  // This check covers the cabin; the exterior prologue has its own docking checks.
  const page = await open('orbit', {setup: `localStorage.setItem('mission-control-jr.arrival-approach.v1', JSON.stringify({version: 1, phase: 'docked'}));`});
  await page.shot(`${SHOTS}/orbit-1-brief.png`);
  check('orbit: briefing explains radio and power', /Arrival at Mars/.test(await dialogTitle(page)));
  await primary(page); await sleep(400);
  check('orbit: mission active', await state(page, 'm.phase') === 'active');
  await stand(page, 9.5, 2.5, -Math.PI / 2, -.05); await sleep(800);
  await page.shot(`${SHOTS}/orbit-2-window.png`);
  // Real look-to-use: press the switch on the power panel and the rack test button.
  await stand(page, -1.5, -3.5, 0, -.2); await sleep(400);
  await page.eval(`__mission.view.world.interaction.useById('switch:motor')`); await sleep(200);
  check('orbit: E on a panel switch turns the load on', await state(page, 'm.loads.motor === true'));
  await stand(page, -1.5, -11, 0, -.25); await sleep(300);
  await page.eval(`__mission.view.world.interaction.useById('test')`); await sleep(200);
  check('orbit: plain test says no signal', await state(page, "m.lastTest === 'plain' && !m.diagnosed"));
  for (const a of [{id: 'take', payload: 'tester'}, {id: 'clipTester'}, {id: 'testSignal'}]) await act(page, a);
  const fault = await state(page, 'm.fault');
  check('orbit: the tester finds the broken part', await state(page, 'm.diagnosed === m.fault'), fault);
  await sleep(500); await page.shot(`${SHOTS}/orbit-3-rack-tester.png`);
  // Touch the part with its power still on: the zap trips the breaker (recoverable).
  if (fault === 'amp') await act(page, {id: 'take', payload: 'amp'});
  await page.eval(`(() => { const L = __mission.state.scenario.parts[__mission.state.fault].load; if (!__mission.state.loads[L]) __mission.act({id: 'toggleLoad', targetId: L}, {quiet: true}); })()`);
  await page.eval(`__mission.view.world.interaction.useById('part:${fault}')`); await sleep(300);
  check('orbit: E on a radio part opens look/fix choices', /look|fix|swap/i.test(await page.eval(`document.getElementById('dialog-actions').textContent`)));
  await clickLabel(page, fault === 'amp' ? 'Swap' : fault === 'feed' ? 'Push' : 'Pull'); await sleep(300);
  check('orbit: touching a powered part trips the breaker', await state(page, 'm.tripped && m.zaps === 1'));
  await sleep(300); await page.shot(`${SHOTS}/orbit-4-tripped.png`);
  await act(page, {id: 'resetBreaker'}); await act(page, {id: 'fixPart', targetId: fault});
  for (const l of ['radio', 'amp', 'motor']) await page.eval(`!__mission.state.loads.${l} && __mission.act({id: 'toggleLoad', targetId: '${l}'}, {quiet: true})`);
  await act(page, {id: 'testSignal'});
  check('orbit: the fixed radio reaches the base', await state(page, 'm.comms'));
  const saveTitle = await reloadAndResume(page);
  check('orbit: save/reload keeps the repair', /Welcome back/.test(saveTitle) && await state(page, 'm.comms && m.minute > 10'));
  for (const l of ['radio', 'amp', 'motor']) await act(page, {id: 'toggleLoad', targetId: l});
  await act(page, {id: 'toggleLoad', targetId: 'charger'});
  await page.eval(`(() => { while (__mission.state.charge < 80) __mission.act({id: 'wait', payload: 1}, {quiet: true}); __mission.act({id: 'toggleLoad', targetId: 'charger'}, {quiet: true}); })()`);
  await stand(page, 5.5, 0, -Math.PI / 2, -.5); await sleep(300);
  await page.eval(`__mission.view.world.interaction.useById('planner')`); await sleep(300);
  await page.eval(`document.querySelector('#dialog-body [data-plan="pad"]').click()`); await sleep(400);
  check('orbit: planner picks a site', await state(page, "m.site === 'pad'"));
  await clickLabel(page, 'Close'); await sleep(900);
  await page.shot(`${SHOTS}/orbit-5-planner.png`);
  await stand(page, 0, 16.5, Math.PI, 0); await page.eval(`document.querySelectorAll('canvas').forEach(c => c.dispatchEvent(new PointerEvent('pointerleave')))`); await sleep(300);
  await page.eval(`__mission.view.world.interaction.useById('hatch')`); await sleep(400);
  check('orbit: hatch shows a ready check', /Ready to land/.test(await dialogTitle(page)));
  check('orbit: ready check offers both landing cameras', await page.eval(`(() => {
    const text = document.getElementById('dialog-actions').textContent;
    return text.includes('First person') && text.includes('Outside camera');
  })()`));
  const firstPerson = args['landing-view'] === 'cockpit';
  await clickLabel(page, firstPerson ? 'First person' : 'Outside camera'); await sleep(1000);
  check(`orbit: ${firstPerson ? 'cockpit' : 'outside'} camera is active`, await page.eval(`(() => {
    const w = __mission.view.world;
    return w.camera.getObjectByName('Meridian landing cockpit').visible === ${firstPerson}
      && w.scene.getObjectByName('Meridian crew transfer vehicle').visible === ${!firstPerson}
      && !w.hand.visible && __mission.state.stage === 'descent';
  })()`));
  await page.shot(`${SHOTS}/orbit-landing-${firstPerson ? 'cockpit' : 'exterior'}.png`);
  await sleep(24000);
  check('orbit: landing ends in a debrief', await soon(page, `/landing|Steered/i.test(document.querySelector('#dialog:not([hidden]) #dialog-title')?.textContent)`, 150000));
  await sleep(500); await page.shot(`${SHOTS}/orbit-6-debrief.png`);
  const rec = await journey(page, 'orbit');
  check('orbit: completion recorded on the journey map', rec && rec.attemptCompleted !== false && rec.carry?.comms === true, JSON.stringify(rec)?.slice(0, 140));
  await clickLabel(page, 'Try the landing again');
  check('orbit: retry returns to just before boarding', await soon(page, `(() => { const m = __mission.state; return m.phase === 'active' && !m.boarded && m.comms && m.site === 'pad'; })()`));
  check('orbit: retry restores cabin camera and hands', await page.eval(`!__mission.view.world.camera.getObjectByName('Meridian landing cockpit').visible && __mission.view.world.hand.visible`));
  const errs = errorsOf(page); check('orbit: no page errors', !errs.length, errs.join(' | '));
  await page.close();
  // Legacy save from the old orbit chapter + narrow viewport.
  const legacy = await open('orbit', {width: 390, height: 844, setup: `localStorage.setItem('mission-control-jr.arrival-approach.v1', JSON.stringify({version: 1, phase: 'docked'})); localStorage.setItem('mission-control-jr.orbit.v1', JSON.stringify({phase: 'station', stage: 2, checks: {brief: true}, complete: false}));`});
  check('orbit: old unfinished save gets a fresh start note', /old version/.test(await legacy.eval(`document.getElementById('dialog-body').textContent`)));
  await legacy.shot(`${SHOTS}/orbit-7-narrow-brief.png`);
  await primary(legacy); await sleep(600);
  check('orbit: narrow viewport has no horizontal scroll', await legacy.eval('document.documentElement.scrollWidth <= innerWidth + 1'));
  await legacy.shot(`${SHOTS}/orbit-8-narrow.png`);
  await legacy.close();
}

const FLOWS = {shelter, orbit};
try {
  for (const [name, fn] of Object.entries(FLOWS)) if (which === 'all' || which === name) await fn();
} catch (e) { check('flow crashed', false, e.stack); console.log((lastPage?.logs || []).slice(-15).join('\n')); try { console.log(await lastPage.eval(`document.querySelector('#dialog-title')?.textContent`)); } catch {} }
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
