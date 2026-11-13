import {openGpuPage, sleep} from './rec.mjs';
const p = await openGpuPage('http://127.0.0.1:5173/base-boss.html');
await sleep(9000);
console.log(await p.eval(`return await new Promise(r => { window.__camOverride = (cam, w) => { window.__camOverride = null; r(JSON.stringify({cam: cam.position.toArray().map(v=>+v.toFixed(1)), state: {x: w.state.x, z: w.state.z, heading: w.state.heading}, fac: Object.fromEntries(Object.entries(w.facilities).map(([k,f]) => [k, [+f.x.toFixed(1), +w.ground(f.x,f.z).toFixed(1), +f.z.toFixed(1), +(f.heading||0).toFixed(2)]]))})); }; })`));
await p.close();
