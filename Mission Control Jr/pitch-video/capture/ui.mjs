// Real-time screen recordings of UI moments and title-screen 3D backdrops.
import {join} from 'node:path';
import {openGpuPage, sleep} from './rec.mjs';
import {openMission, primary, clickLabel, act, OUT, BASE} from './lib.mjs';

const HIDE = `const main = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0]; for (const el of document.body.querySelectorAll('*')) if (el !== main && !el.contains(main)) el.style.setProperty('visibility', 'hidden', 'important');`;
const glide = async (p, x0, y0, x1, y1, ms) => { const n = Math.round(ms / 40); for (let i = 0; i <= n; i++) { const t = i / n, e = t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2; await p.move(x0 + (x1 - x0) * e, y0 + (y1 - y0) * e); await sleep(40); } };
const smoothScroll = (p, sel, px, ms) => p.eval(`const el = ${sel}; const y0 = el.scrollTop ?? scrollY; const t0 = performance.now(); await new Promise(r => { const f = now => { const t = Math.min(1, (now - t0) / ${ms}); const e = t < .5 ? 2*t*t : 1 - (-2*t+2)**2/2; (el === document.scrollingElement ? scrollTo(0, y0 + ${px} * e) : (el.scrollTop = y0 + ${px} * e)); t < 1 ? requestAnimationFrame(f) : r(); }; requestAnimationFrame(f); });`);
const rec = (p, name, action) => p.record(join(OUT, name + '.mp4'), action).then(r => console.log('recorded', name, Math.round(r.fps), 'fps'));

const JOBS = {
  async home() {
    const p = await openGpuPage(BASE + 'index.html'); await sleep(9000);
    await p.move(300, 900);
    await rec(p, 'ui-home', async () => { await sleep(1500); await glide(p, 300, 900, 960, 700, 2500); await sleep(2500); });
    await p.eval(`document.getElementById('open-map').click()`); await sleep(2500);
    await rec(p, 'ui-map', async () => { await sleep(1200); await smoothScroll(p, 'document.querySelector("#mission-map") || document.scrollingElement', 500, 3000); await sleep(600); await p.eval(`document.querySelector('.dest-toggle-btn[data-campaign="moon"], button[data-campaign="moon"]')?.click()`); await sleep(2500); });
    await p.close();
  },
  async sources() {
    const p = await openGpuPage(BASE + 'sources.html'); await sleep(5000);
    await rec(p, 'ui-sources', async () => { await sleep(800); await smoothScroll(p, 'document.scrollingElement', 1800, 9000); await sleep(800); });
    await p.close();
  },
  async decision() {
    const p = await openMission('greenhouse'); await primary(p); await sleep(1500);
    await rec(p, 'ui-decision', async () => { await sleep(1200); await glide(p, 1200, 900, 1240, 430, 1600); await sleep(900); await glide(p, 1240, 430, 1520, 430, 1400); await sleep(1100); await glide(p, 1520, 430, 1700, 430, 900); await sleep(600); await clickLabel(p, 'Share the light'); await sleep(1500); });
    await p.close();
  },
  async report() {
    const p = await openMission('solar-shelter');
    await clickLabel(p, 'Skip'); await sleep(300); await primary(p); await sleep(400);
    const steps = [{id: 'buildRack', payload: 'back_l'}];
    for (let i = 1; i <= 6; i++) steps.push({id: 'pickUp', targetId: `water-${i}`}, {id: 'loadRack'});
    steps.push({id: 'latchRack'});
    for (const [i, r] of [[1, 'roof_l'], [2, 'roof_l'], [3, 'roof_r'], [4, 'roof_r']]) steps.push({id: 'pickUp', targetId: `poly-${i}`}, {id: 'slidePanel', targetId: r}, {id: 'fastenPanel', targetId: `poly-${i}`});
    steps.push({id: 'moveCrew', targetId: 'jin', payload: 'C'});
    for (const a of steps) await act(p, a);
    await p.ev(`(() => { const pl = __mission.view.world.player; pl.position.set(-4.6, 1.62, 1.4); pl.yaw = 0; pl.syncCamera(); })()`); await sleep(400);
    await p.ev(`__mission.view.world.interaction.useById('check')`); await sleep(300); await primary(p); await sleep(300);
    await p.ev('__mission.step(3)'); await p.ev('__mission.step(20)'); await p.ev('__mission.step(80)'); await sleep(1500);
    await primary(p); await sleep(2500);
    await rec(p, 'ui-report', async () => { await sleep(2500); await smoothScroll(p, 'document.querySelector("#dialog-body")', 600, 4500); await sleep(1500); });
    await p.close();
  },
  async titles() {
    for (const [page, name] of [['storm.html', 'ui-title-storm'], ['orbit.html', 'ui-title-orbit'], ['mission2.html', 'ui-title-rover']]) {
      const p = await openGpuPage(BASE + page); await sleep(9000);
      await p.eval(HIDE);
      await rec(p, name, () => sleep(8000));
      await p.close();
    }
  },
};
for (const j of (process.argv[2] || Object.keys(JOBS).join(',')).split(',')) { try { await JOBS[j](); } catch (e) { console.log(j, 'FAILED', e.message); } }
