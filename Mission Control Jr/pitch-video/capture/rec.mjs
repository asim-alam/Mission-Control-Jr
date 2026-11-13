// Screencast recorder on top of the project's CDP driver.
// Records JPEG frames with timestamps, then encodes a constant-fps MP4 with ffmpeg.
import {spawn} from 'node:child_process';
import {mkdtemp, writeFile, readdir, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

export const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function openGpuPage(url, {width = 1920, height = 1080, port = 9800 + Math.floor(Math.random() * 150), gpu = true} = {}) {
  const profile = await mkdtemp(join(process.env.TMPDIR || tmpdir(), 'mcj-rec-'));
  const flags = gpu ? ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=vulkan', '--enable-features=Vulkan'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
  const proc = spawn('google-chrome', ['--headless=new', ...flags, '--no-first-run', '--no-default-browser-check',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--hide-scrollbars', '--mute-audio',
    '--autoplay-policy=no-user-gesture-required', `--window-size=${width},${height}`, `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], {stdio: 'ignore'});
  let targets;
  for (let i = 0; i < 80; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (targets.some(t => t.type === 'page')) break; } catch {} await sleep(150); }
  const target = targets.find(t => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let seq = 0; const pending = new Map(); const logs = []; const listeners = new Map();
  ws.onmessage = ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { const {res, rej} = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(msg.error.message)) : res(msg.result); }
    else if (msg.method === 'Runtime.exceptionThrown') logs.push('[exception] ' + (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text));
    if (msg.method && listeners.has(msg.method)) listeners.get(msg.method)(msg.params);
  };
  const send = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, {res, rej}); ws.send(JSON.stringify({id, method, params})); });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor: 1, mobile: false});
  await send('Page.navigate', {url});
  const page = {
    logs, send, sleep, width, height,
    async eval(expression) {
      const r = await send('Runtime.evaluate', {expression: `(async()=>{${expression}})()`, awaitPromise: true, returnByValue: true});
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    },
    async waitFor(expression, timeout = 60000) {
      const end = Date.now() + timeout;
      while (Date.now() < end) { try { if (await page.eval(`return !!(${expression})`)) return true; } catch {} await sleep(250); }
      throw new Error(`Timed out waiting for: ${expression}`);
    },
    async shot(path) { const {data} = await send('Page.captureScreenshot', {format: 'jpeg', quality: 90}); await writeFile(path, Buffer.from(data, 'base64')); return path; },
    async keyDown(code, key = code.replace(/^Key/, '').toLowerCase()) { await send('Input.dispatchKeyEvent', {type: 'keyDown', code, key, windowsVirtualKeyCode: vk(code)}); },
    async keyUp(code, key = code.replace(/^Key/, '').toLowerCase()) { await send('Input.dispatchKeyEvent', {type: 'keyUp', code, key, windowsVirtualKeyCode: vk(code)}); },
    async hold(code, ms) { await page.keyDown(code); await sleep(ms); await page.keyUp(code); },
    async click(x, y) { await send('Input.dispatchMouseEvent', {type: 'mouseMoved', x, y}); for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', {type, x, y, button: 'left', clickCount: 1}); },
    async move(x, y) { await send('Input.dispatchMouseEvent', {type: 'mouseMoved', x, y}); },
    /** Record while `action()` runs; writes an MP4 at `fps`. */
    async record(out, action, {fps = 30} = {}) {
      const dir = await mkdtemp(join(process.env.TMPDIR || tmpdir(), 'mcj-frames-'));
      const frames = [];
      listeners.set('Page.screencastFrame', async p => {
        frames.push({t: p.metadata.timestamp, data: p.data});
        send('Page.screencastFrameAck', {sessionId: p.sessionId}).catch(() => {});
      });
      await send('Page.startScreencast', {format: 'jpeg', quality: 92, maxWidth: width, maxHeight: height, everyNthFrame: 1});
      const t0 = Date.now();
      await action();
      const dur = (Date.now() - t0) / 1000;
      await send('Page.stopScreencast'); listeners.delete('Page.screencastFrame');
      if (!frames.length) throw new Error('no frames');
      // Build a concat list with real per-frame durations, then resample to constant fps.
      const start = frames[0].t; let list = '';
      for (let i = 0; i < frames.length; i++) {
        const f = join(dir, `f${String(i).padStart(5, '0')}.jpg`);
        await writeFile(f, Buffer.from(frames[i].data, 'base64'));
        const next = i + 1 < frames.length ? frames[i + 1].t : start + dur;
        list += `file '${f}'\nduration ${Math.max(0.001, next - frames[i].t).toFixed(4)}\n`;
      }
      list += `file '${join(dir, `f${String(frames.length - 1).padStart(5, '0')}.jpg`)}'\n`;
      await writeFile(join(dir, 'list.txt'), list);
      await new Promise((res, rej) => {
        const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(dir, 'list.txt'),
          '-vf', `fps=${fps},scale=${width}:${height}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-crf', '16', '-preset', 'medium', out], {stdio: 'inherit'});
        ff.on('exit', c => c ? rej(new Error('ffmpeg ' + c)) : res());
      });
      await rm(dir, {recursive: true, force: true});
      return {frames: frames.length, seconds: dur, fps: frames.length / dur};
    },
    async close() { try { ws.close(); } catch {} proc.kill('SIGKILL'); await sleep(200); await rm(profile, {recursive: true, force: true}).catch(() => {}); }
  };
  return page;
}

function vk(code) {
  const m = {KeyW: 87, KeyA: 65, KeyS: 83, KeyD: 68, KeyE: 69, KeyQ: 81, ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39, Space: 32, Enter: 13, ShiftLeft: 16, Escape: 27};
  return m[code] || 0;
}
