import {openMission, primary, clickLabel, act, cleanFrame, installRig, renderMove, sleep} from './lib.mjs';
const p = await openMission('solar-shelter');
await clickLabel(p, 'Skip'); await sleep(300); await primary(p); await sleep(600);
await cleanFrame(p); await installRig(p);
await renderMove(p, 'test-shelter', {p0: [6, 2.4, 5], p1: [3, 1.8, 3.5], l0: [0, 1, 0], l1: [0, 1, -1]}, {seconds: 2});
await p.shot(decodeURIComponent(new URL('./scout/test-shelter.jpg', import.meta.url).pathname));
await p.close();
