// Shared helpers: open a mission inside the journey shell, drive it, and render cinematic camera moves
// frame-by-frame (deterministic camera, perfectly smooth 30 fps regardless of GPU speed).
import {spawn} from 'node:child_process';
import {mkdtemp, writeFile, rm, mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {openGpuPage, sleep} from './rec.mjs';
export {sleep};

export const BASE = 'http://127.0.0.1:5173/';
export const OUT = decodeURIComponent(new URL('../film/assets/game/', import.meta.url).pathname);
await mkdir(OUT, {recursive: true});

const IN_FRAME = body => `const W = document.getElementById('scene')?.contentWindow; if (!W) throw Error('no frame'); with (W) { ${body} }`;

export async function openMission(id, {setup = '', width = 1920, height = 1080} = {}) {
  const page = await openGpuPage(BASE + 'index.html', {width, height});
  page.top = page.eval;
  page.run = b => page.top(IN_FRAME(b));
  page.ev = e => page.top(IN_FRAME(`return (${e})`));
  await sleep(1500);
  await page.top(`localStorage.clear(); ${setup} location.href = './index.html?mission=${id}';`);
  await sleep(2000);
  const end = Date.now() + 90000;
  while (Date.now() < end) {
    try { if (await page.ev('!!window.__mission && !!document.querySelector("#dialog:not([hidden])")')) break; } catch {}
    await page.top(`document.querySelector('#transition:not([hidden]) button.primary, #transition:not([hidden]) button')?.click()`).catch(() => {});
    await sleep(400);
  }
  await sleep(1500);
  return page;
}

export const primary = page => page.ev(`(() => { const b = document.querySelector('#dialog:not([hidden]) #dialog-actions button.primary:not(:disabled)'); if (!b) return false; b.click(); return true; })()`);
export const clickLabel = (page, text) => page.ev(`(() => { const b = [...document.querySelectorAll('#dialog-actions button, #dialog-body button')].find(b => b.textContent.includes(${JSON.stringify(text)}) && !b.disabled); if (!b) return false; b.click(); return true; })()`);
export const act = (page, a) => page.ev(`(() => { const r = __mission.act(${JSON.stringify(a)}, {quiet: true}); return r.ok ? 'ok' : r.message; })()`);
export const title = page => page.ev(`document.querySelector('#dialog:not([hidden]) #dialog-title')?.textContent || ''`);

/** Hide every HTML overlay inside the mission frame and the shell, leaving only the 3D canvas. */
export async function cleanFrame(page, on = true) {
  const css = `body *:not(canvas):not(:has(canvas)) { visibility: hidden !important; }`;
  await page.run(`const main = [...document.querySelectorAll('canvas')].sort((a, b) => b.width * b.height - a.width * a.height)[0]; for (const el of document.body.querySelectorAll('*')) if (el !== main && !el.contains(main)) el.style.setProperty('visibility', 'hidden', 'important');`);
  if (false) await page.run(`let s = document.getElementById('__clean'); if (${on}) { if (!s) { s = document.createElement('style'); s.id = '__clean'; document.head.append(s); } s.textContent = ${JSON.stringify(css)}; } else s?.remove();`);
  await page.top(`let s = document.getElementById('__clean'); if (${on}) { if (!s) { s = document.createElement('style'); s.id = '__clean'; document.head.append(s); } s.textContent = 'body > *:not(#scene):not(iframe) { visibility: hidden !important; } #scene { position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 9999 !important; }'; } else s?.remove();`);
}

/** Install a camera rig that overrides the player camera every frame from window.__rig. */
export async function installRig(page) {
  await page.run(`
    const w = __mission.view.world; if (window.__rigInstalled) return; window.__rigInstalled = true;
    const T = w.camera.position.constructor;
    window.__rig = null; w.hand.visible = false;
    const pa = new T(), la = new T();
    w.onFrame(() => {
      const r = window.__rig; if (!r) return;
      const t = r.ease(r.t);
      pa.set(r.p0[0] + (r.p1[0] - r.p0[0]) * t, r.p0[1] + (r.p1[1] - r.p0[1]) * t, r.p0[2] + (r.p1[2] - r.p0[2]) * t);
      la.set(r.l0[0] + (r.l1[0] - r.l0[0]) * t, r.l0[1] + (r.l1[1] - r.l0[1]) * t, r.l0[2] + (r.l1[2] - r.l0[2]) * t);
      if (r.orbit) { const a = r.orbit.a0 + (r.orbit.a1 - r.orbit.a0) * t; pa.set(r.orbit.c[0] + Math.cos(a) * r.orbit.r, r.orbit.h0 + (r.orbit.h1 - r.orbit.h0) * t, r.orbit.c[2] + Math.sin(a) * r.orbit.r); la.set(...r.orbit.c); }
      w.camera.position.copy(pa); w.camera.lookAt(la);
      if (r.fov) { w.camera.fov = r.fov; w.camera.updateProjectionMatrix(); }
    });
    // Keep the player from overriding us.
    const sync = w.player.syncCamera.bind(w.player); w.player.syncCamera = () => { if (!window.__rig) sync(); };
  `);
}

/**
 * Render a camera move frame by frame. move = {p0, p1, l0, l1} or {orbit: {c, r, a0, a1, h0, h1}}; seconds, fps.
 * `during(i, n)` may run per frame (e.g. advance the sim).
 */
export async function renderMove(page, name, move, {seconds = 6, fps = 30, settle = 2, during, ease = 'inout'} = {}) {
  const easeSrc = ease === 'linear' ? 't => t' : ease === 'out' ? 't => 1 - (1 - t) ** 3' : 't => t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2';
  await page.run(`window.__rig = Object.assign(${JSON.stringify(move)}, {t: 0, ease: ${easeSrc}});`);
  await sleep(600);
  const dir = await mkdtemp(join(process.env.TMPDIR || tmpdir(), 'mcj-mv-'));
  const n = Math.round(seconds * fps);
  for (let i = 0; i < n; i++) {
    await page.run(`window.__rig.t = ${i / (n - 1)};`);
    if (during) await during(i, n);
    await page.top(`await new Promise(r => { let k = ${settle}; const f = () => (--k > 0 ? requestAnimationFrame(f) : r()); requestAnimationFrame(f); });`);
    const {data} = await page.send('Page.captureScreenshot', {format: 'jpeg', quality: 93});
    await writeFile(join(dir, `f${String(i).padStart(5, '0')}.jpg`), Buffer.from(data, 'base64'));
  }
  const out = join(OUT, `${name}.mp4`);
  await new Promise((res, rej) => {
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(fps), '-i', join(dir, 'f%05d.jpg'), '-c:v', 'libx264', '-crf', '15', '-preset', 'medium', '-pix_fmt', 'yuv420p', out], {stdio: 'inherit'});
    ff.on('exit', c => c ? rej(new Error('ffmpeg ' + c)) : res());
  });
  await rm(dir, {recursive: true, force: true});
  await page.run(`window.__rig = null;`);
  console.log('rendered', name, n, 'frames');
  return out;
}

/** Plain screen recording (UI moments: dialogs, menus). */
export async function screenRecord(page, name, action, opts) {
  const out = join(OUT, `${name}.mp4`);
  const r = await page.record(out, action, opts);
  console.log('recorded', name, r);
  return out;
}

/** List the named objects in the scene with world positions (for planning camera moves). */
export async function inventory(page) {
  return page.ev(`(() => {
    const w = __mission.view.world; const out = []; const v = new w.camera.position.constructor();
    w.scene.children.forEach(o => { if (!o.name && !o.children.length) return; o.getWorldPosition(v); out.push([o.name || o.type, +v.x.toFixed(1), +v.y.toFixed(1), +v.z.toFixed(1)]); });
    const p = w.player.position; return {player: [+p.x.toFixed(1), +p.y.toFixed(1), +p.z.toFixed(1), +w.player.yaw.toFixed(2)], objects: out.slice(0, 60)};
  })()`);
}
