import test from 'node:test';
import assert from 'node:assert/strict';
import {samplerSnapshot} from '../simulation/sampler.js';
import {journeyUrl,missionFromUrl} from '../mission-routes.js';
import {missionById} from '../mission-registry.js';
test('sampler snapshots start at real decisions without pre-awarded completion',()=>{
 for(const id of ['solar-shelter','greenhouse','earth-delay','lunar-sunlight']){const m=samplerSnapshot(id);assert.equal(m.phase,'active');assert.equal(m.result??null,null);assert.deepEqual(samplerSnapshot(id),m);}
 const greenhouse=samplerSnapshot('greenhouse');assert.equal(greenhouse.periodsCompleted,1);assert.equal(greenhouse.fault,true);
 const delay=samplerSnapshot('earth-delay');assert.equal(delay.message.status,'outbound');assert.equal(delay.message.deliveredAt,null);
 const moon=samplerSnapshot('lunar-sunlight');assert.equal(moon.sitesCompared,true);assert.equal(moon.selectedPad,null);
});
test('sampler URLs preserve practice mode below a subdirectory',()=>{
 const url=journeyUrl('https://example.org/app/index.html','greenhouse',{sampler:true});assert.equal(url.href,'https://example.org/app/index.html?mission=greenhouse&sampler=1');assert.equal(missionFromUrl(url.href,missionById),'greenhouse');
});
