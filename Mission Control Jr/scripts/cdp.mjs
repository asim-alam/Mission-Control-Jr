// Minimal Chrome DevTools Protocol driver for reproducible screenshots and flow checks.
// Usage: const page = await openPage('http://127.0.0.1:5173/?mission=greenhouse');
//        await page.eval('1+1'); await page.shot('out.png'); await page.close();
import {spawn} from 'node:child_process';
import {mkdtemp, writeFile, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const sleep = ms => new Promise(r => setTimeout(r, ms));

export async function openPage(url, {width = 1440, height = 900, chrome = 'google-chrome', port = 9333 + Math.floor(Math.random() * 400)} = {}) {
  const profile = await mkdtemp(join(process.env.TMPDIR || tmpdir(), 'mcj-cdp-'));
  const proc = spawn(chrome, ['--headless=new', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-first-run', '--no-default-browser-check', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    '--autoplay-policy=no-user-gesture-required', `--window-size=${width},${height}`, `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, 'about:blank'], {stdio: 'ignore'});
  let targets;
  for (let i = 0; i < 80; i++) {
    try { targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json(); if (targets.some(t => t.type === 'page')) break; } catch {}
    await sleep(150);
  }
  const target = targets.find(t => t.type === 'page');
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let seq = 0; const pending = new Map(); const logs = [];
  ws.onmessage = ev => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) { const {res, rej} = pending.get(msg.id); pending.delete(msg.id); msg.error ? rej(new Error(msg.error.message)) : res(msg.result); }
    else if (msg.method === 'Runtime.consoleAPICalled') logs.push(`[${msg.params.type}] ` + msg.params.args.map(a => a.value ?? a.description ?? '').join(' '));
    else if (msg.method === 'Runtime.exceptionThrown') logs.push('[exception] ' + (msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text));
  };
  const send = (method, params = {}) => new Promise((res, rej) => { const id = ++seq; pending.set(id, {res, rej}); ws.send(JSON.stringify({id, method, params})); });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {width, height, deviceScaleFactor: 1, mobile: width < 600});
  await send('Page.navigate', {url});
  const page = {
    logs, send,
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
    sleep,
    async shot(path) { const {data} = await send('Page.captureScreenshot', {format: path.endsWith('.jpg') ? 'jpeg' : 'png', quality: path.endsWith('.jpg') ? 82 : undefined}); await writeFile(path, Buffer.from(data, 'base64')); return path; },
    async key(code, key = code.replace(/^Key/, '').toLowerCase(), hold = 0) {
      await send('Input.dispatchKeyEvent', {type: 'keyDown', code, key});
      if (hold) await sleep(hold);
      await send('Input.dispatchKeyEvent', {type: 'keyUp', code, key});
    },
    async click(x, y) { for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', {type, x, y, button: 'left', clickCount: 1}); },
    async close() { try { ws.close(); } catch {} proc.kill('SIGKILL'); await sleep(200); await rm(profile, {recursive: true, force: true}).catch(() => {}); }
  };
  return page;
}
