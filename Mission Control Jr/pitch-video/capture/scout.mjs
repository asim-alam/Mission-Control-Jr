// Scout every mission: brief screenshot, in-world screenshot, and which camera hooks exist.
import {mkdir} from 'node:fs/promises';
import {openGpuPage, sleep} from './rec.mjs';
const OUT = decodeURIComponent(new URL('./scout/', import.meta.url).pathname); await mkdir(OUT, {recursive: true});
const BASE = 'http://127.0.0.1:5173/';
const ids = (process.argv[2] || 'orbit,storm,rover,solar-shelter,greenhouse,earth-delay,lunar-sunlight,lunar-dust,lunar-relay,extended').split(',');
const IN = b => `const W = document.getElementById('scene')?.contentWindow; if (!W) throw Error('no frame'); with (W) { ${b} }`;
for (const id of ids) {
  const page = await openGpuPage(BASE + 'index.html', {width: 1920, height: 1080});
  try {
    await sleep(1500);
    await page.eval(`localStorage.clear(); location.href = './index.html?mission=${id}';`);
    await sleep(2500);
    const end = Date.now() + 60000; let ok = false;
    while (Date.now() < end) {
      try { if (await page.eval(IN('return !!document.querySelector("canvas")'))) { ok = true; } } catch {}
      await page.eval(`document.querySelector('#transition:not([hidden]) button.primary, #transition:not([hidden]) button')?.click()`).catch(() => {});
      if (ok) break; await sleep(500);
    }
    await sleep(4000);
    await page.shot(`${OUT}${id}-1.jpg`);
    const info = await page.eval(IN(`return JSON.stringify({src: location.pathname, mission: !!window.__mission, world: !!window.__mission?.view?.world, player: !!window.__mission?.view?.world?.player,
      phase: window.__mission?.state?.phase, stage: window.__mission?.state?.stage, globals: Object.keys(window).filter(k => /^__|demo|game|app|mission/i.test(k)).slice(0, 20),
      dialog: document.querySelector('#dialog:not([hidden]) #dialog-title, [role=dialog] h2, .dialog h2')?.textContent?.slice(0, 80)})`)).catch(e => 'ERR ' + e.message);
    // Dismiss up to 4 dialogs with the primary button.
    for (let i = 0; i < 4; i++) { await page.eval(IN(`const b = document.querySelector('#dialog:not([hidden]) #dialog-actions button.primary:not(:disabled), dialog[open] button.primary'); b && b.click();`)).catch(() => {}); await sleep(900); }
    await sleep(2000);
    await page.shot(`${OUT}${id}-2.jpg`);
    console.log(id, info);
  } catch (e) { console.log(id, 'FAILED', e.message); }
  await page.close();
}
