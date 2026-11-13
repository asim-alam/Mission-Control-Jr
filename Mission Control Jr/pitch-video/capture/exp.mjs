// Cinematic shots for the shared-engine missions (shelter, greenhouse, earth delay, Moon x3).
// PREVIEW=1 renders 3 frames per shot (for framing checks).
import {openMission, primary, clickLabel, act, cleanFrame, installRig, renderMove, sleep} from './lib.mjs';

const prev = !!process.env.PREVIEW;
const R = (page, name, move, opts = {}) => renderMove(page, name, move, {...opts, seconds: prev ? .1 : opts.seconds ?? 6, fps: prev ? 30 : 30});

const MISSIONS = {
  async 'solar-shelter'(p) {
    await clickLabel(p, 'Skip'); await sleep(300); await primary(p); await sleep(500);
    const steps = [{id: 'buildRack', payload: 'back_l'}];
    for (let i = 1; i <= 6; i++) steps.push({id: 'pickUp', targetId: `water-${i}`}, {id: 'loadRack'});
    steps.push({id: 'latchRack'});
    for (const [i, r] of [[1, 'roof_l'], [2, 'roof_l'], [3, 'roof_r'], [4, 'roof_r']]) steps.push({id: 'pickUp', targetId: `poly-${i}`}, {id: 'slidePanel', targetId: r}, {id: 'fastenPanel', targetId: `poly-${i}`});
    steps.push({id: 'moveCrew', targetId: 'jin', payload: 'C'});
    for (const a of steps) await act(p, a);
    await sleep(2500);
    await cleanFrame(p); await installRig(p);
    await R(p, 'ex-shelter-refuge', {p0: [-1.5, 2.6, 4.2], p1: [-3.2, 1.9, 2.6], l0: [-4.6, 1, -1.6], l1: [-4.6, 1.1, -1.6]}, {seconds: 6});
    await R(p, 'ex-shelter-wall', {p0: [-1.6, 1.3, 0.9], p1: [-2.3, 1.7, 1.6], l0: [-4.6, 1, -1.6], l1: [-4.6, 1.1, -1.6]}, {seconds: 5});
    // Solar event running: wide, slow.
    await p.ev('__mission.state.phase'); await p.run(`window.__rig = null;`);
    await p.ev(`(() => { const b = document.querySelector('#dialog:not([hidden]) #dialog-actions button.primary'); b && b.click(); return 1; })()`);
    await p.ev('__mission.step(3)'); await p.ev('__mission.step(20)'); await sleep(800);
    await cleanFrame(p);
    await R(p, 'ex-shelter-event', {orbit: {c: [-4.6, 1, -1.6], r: 5.5, a0: 1.2, a1: 1.9, h0: 2.8, h1: 2.2}}, {seconds: 6});
  },
  async greenhouse(p) {
    await primary(p); await sleep(800);
    await clickLabel(p, 'Share the light'); await sleep(800); await primary(p); await sleep(800);
    await cleanFrame(p); await installRig(p);
    await R(p, 'ex-greenhouse-beds', {p0: [5.5, 1.5, -1.6], p1: [-2.5, 1.3, -2.0], l0: [3, 1, -4], l1: [-5, 1, -4]}, {seconds: 7, ease: 'linear'});
    await R(p, 'ex-greenhouse-close', {p0: [-1.0, 1.1, -2.6], p1: [-1.2, 1.4, -2.2], l0: [-1.1, .9, -4], l1: [-1.1, 1, -4]}, {seconds: 5});
  },
  async 'earth-delay'(p) {
    await primary(p); await sleep(800);
    await cleanFrame(p); await installRig(p);
    await R(p, 'ex-earth-delay', {p0: [4.5, 2.2, 2.5], p1: [1.5, 1.7, 0.5], l0: [-1.8, 1, -4.1], l1: [-1.8, 1.2, -4.1]}, {seconds: 6});
  },
  async 'lunar-sunlight'(p) {
    await primary(p); await sleep(800);
    await cleanFrame(p); await installRig(p);
    await R(p, 'ex-moon-mast', {orbit: {c: [6.6, 2, -2.4], r: 9, a0: 2.4, a1: 3.3, h0: 1.4, h1: 4.5}}, {seconds: 7});
  },
  async 'lunar-dust'(p) {
    await primary(p); await sleep(800);
    await cleanFrame(p); await installRig(p);
    await R(p, 'ex-moon-airlock', {p0: [1.7, 1.65, 0.7], p1: [0.5, 1.55, 0.1], l0: [-1.4, 1.5, -1.4], l1: [-1.0, 1.4, -1.4]}, {seconds: 5});
  },
  async 'lunar-relay'(p) {
    await primary(p); await sleep(800);
    await cleanFrame(p); await installRig(p);
    await R(p, 'ex-moon-relay', {p0: [-0.8, 1.8, -5.2], p1: [-2.5, 5.5, -1.5], l0: [-7.2, 1, -4.2], l1: [-7.2, 1.5, -4.2]}, {seconds: 7});
  },
};

for (const id of (process.argv[2] || Object.keys(MISSIONS).join(',')).split(',')) {
  const p = await openMission(id);
  try { await MISSIONS[id](p); } catch (e) { console.log(id, 'FAILED', e.message, p.logs.slice(-3)); }
  await p.close();
}
