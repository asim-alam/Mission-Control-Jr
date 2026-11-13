import {openGpuPage, sleep} from './rec.mjs';
for (const gpu of [true]) {
  const p = await openGpuPage('http://127.0.0.1:5173/storm.html', {gpu});
  await sleep(8000);
  const info = await p.eval(`const c=document.createElement('canvas').getContext('webgl2'); const d=c&&c.getExtension('WEBGL_debug_renderer_info'); return d? c.getParameter(d.UNMASKED_RENDERER_WEBGL):'none'`);
  const r = await p.record(`/tmp/claude-1000/-home-parvej--claude-spares-spare-92cVHD/d226cc3c-813a-48e9-930d-6b50cc582610/scratchpad/fps-${gpu}.mp4`, () => sleep(4000));
  console.log({gpu, info, ...r}); await p.close();
}
