// Base Boss (Meridian Basin) cinematic shots through the temporary __camOverride hook.
import {spawn} from 'node:child_process';
import {mkdtemp, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openGpuPage, sleep} from './rec.mjs';
import {OUT} from './lib.mjs';

const M = [-51.1, 1.5, 44.2]; // Meridian
// Each shot: pose(t, w) returns {p:[x,y,z], l:[x,y,z], rover?:[x,z,heading]} — evaluated in the page.
const SHOTS = {
  'bb-outpost-push': {seconds: 7, pose: `t => ({p: [${M[0]} + Math.cos(2.2 + t*.35) * (30 - t*9), 2.4 + t*1.2, ${M[2]} + Math.sin(2.2 + t*.35) * (30 - t*9)], l: [${M[0]}, 3, ${M[2]}]})`},
  'bb-outpost-low':  {seconds: 6, pose: `t => ({p: [${M[0]} + Math.cos(-2.4 + t*.45) * 22, 1.3, ${M[2]} + Math.sin(-2.4 + t*.45) * 22], l: [${M[0]}, 4, ${M[2]}]})`},
  'bb-basin-crane':  {seconds: 8, pose: `t => ({p: [${M[0]} + 60 - t*25, 34 - t*16, ${M[2]} + 55 - t*10], l: [${M[0]} + 10 - t*10, 2, ${M[2]}], rover: [${M[0]} + 28 - t*16, ${M[2]} + 16 - t*6, -1.9]})`},
  'bb-rover-track':  {seconds: 6, pose: `t => { const x = ${M[0]} + 40 - t*14, z = ${M[2]} + 22 - t*5; return {p: [x - 2, 1.0, z + 5.5], l: [x - 1.5, .9, z], rover: [x, z, -1.85]}; }`},
  'bb-rover-wheels': {seconds: 4, pose: `t => { const x = ${M[0]} + 34 - t*7, z = ${M[2]} + 20 - t*2.5; return {p: [x - .8, 1.1, z - 3.8], l: [x + .6, .6, z], rover: [x, z, -1.85]}; }`},
  'bb-dawn-rise':    {seconds: 6, pose: `t => ({p: [${M[0]} + 16, 1.2 + t*7, ${M[2]} - 12 + t*3], l: [${M[0]}, 3 + t*1.5, ${M[2]}]})`},
};

const which = process.argv[2] ? process.argv[2].split(',') : Object.keys(SHOTS);
const p = await openGpuPage('http://127.0.0.1:5173/base-boss.html');
await sleep(9000);
// Hide all HTML UI, keep the canvas.
await p.eval(`const main = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0]; for (const el of document.body.querySelectorAll('*')) if (el !== main && !el.contains(main)) el.style.setProperty('visibility', 'hidden', 'important');`);
for (const name of which) {
  const {seconds, pose} = SHOTS[name]; const fps = 30, n = process.env.PREVIEW ? 3 : Math.round(seconds * fps);
  await p.eval(`
    const pose = ${pose}; window.__bbT = 0;
    window.__camOverride = (cam, w) => {
      const r = pose(window.__bbT, w);
      if (r.rover) { const y = w.ground(r.rover[0], r.rover[1]); w.state.x = r.rover[0]; w.state.z = r.rover[1]; w.state.heading = r.rover[2]; }
      const gy = w.ground(r.p[0], r.p[2]);
      cam.position.set(r.p[0], Math.max(r.p[1] + gy, gy + .5), r.p[2]);
      cam.lookAt(r.l[0], r.l[1] + w.ground(r.l[0], r.l[2]), r.l[2]);
    };`);
  await sleep(1500);
  const dir = await mkdtemp(join(tmpdir(), 'mcj-bb-'));
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1), e = t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
    await p.eval(`window.__bbT = ${e}; await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));`);
    const {data} = await p.send('Page.captureScreenshot', {format: 'jpeg', quality: 93});
    await writeFile(join(dir, `f${String(i).padStart(5, '0')}.jpg`), Buffer.from(data, 'base64'));
  }
  await new Promise((res, rej) => spawn('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '30', '-i', join(dir, 'f%05d.jpg'), '-c:v', 'libx264', '-crf', '15', '-pix_fmt', 'yuv420p', join(OUT, name + '.mp4')], {stdio: 'inherit'}).on('exit', c => c ? rej(c) : res()));
  await rm(dir, {recursive: true, force: true});
  console.log('rendered', name, n);
}
await p.close();
