import test from 'node:test';
import assert from 'node:assert/strict';
import {samplerSnapshot} from '../simulation/sampler.js';
import {journeyUrl,missionFromUrl} from '../mission-routes.js';
import {missionById} from '../mission-registry.js';
test('sampler snapshots start at real decisions without pre-awarded completion',()=>{
 for(const id of ['solar-shelter','greenhouse','earth-delay','lunar-sunlight','lunar-dust','lunar-relay']){const m=samplerSnapshot(id);assert.equal(m.phase,'active');assert.equal(m.result??null,null);assert.deepEqual(samplerSnapshot(id),m);}
 const shelter=samplerSnapshot('solar-shelter');assert.equal(shelter.plan,'roof');assert.equal(shelter.stage,'prep');
 const greenhouse=samplerSnapshot('greenhouse');assert.equal(greenhouse.plan,'salad');assert.equal(greenhouse.day,1);
 const delay=samplerSnapshot('earth-delay');assert.equal(delay.message.status,'outbound');assert.ok(delay.message.arrivesAt>delay.simSeconds);
 const moon=samplerSnapshot('lunar-sunlight');assert.equal(moon.plan,null);assert.equal(moon.cart,'base');
});
test('sampler URLs preserve practice mode below a subdirectory',()=>{
 const url=journeyUrl('https://example.org/app/index.html','greenhouse',{sampler:true});assert.equal(url.href,'https://example.org/app/index.html?mission=greenhouse&sampler=1');assert.equal(missionFromUrl(url.href,missionById),'greenhouse');
});
