import test from 'node:test';
import assert from 'node:assert/strict';
import {servePower,moveWater} from '../simulation/resources.js';
import {advanceClock} from '../simulation/clock.js';
import {createMessage,updateMessage} from '../simulation/messages.js';
import {accumulateExposure} from '../simulation/exposure.js';
import {advanceCrop,harvestCrop} from '../simulation/crops.js';
import {serializeSnapshot,restoreSnapshot,seededRandom} from '../simulation/replay.js';

test('battery depletion respects load priority and physical energy units', () => {
  const r=servePower({energyWh:10,capacityWh:100,generationW:0,loads:[{id:'air',watts:60},{id:'science',watts:60}]},600);
  assert.equal(r.energyWh,0); assert.equal(r.servedWh.air,10); assert.equal(r.servedWh.science,0);
});
test('water moves without vanishing and protection reduces but does not erase exposure', () => {
  const w={store:15,shelter:0}; assert.equal(moveWater(w,'store','shelter',5),true); assert.equal(w.store+w.shelter,15);
  assert.equal(moveWater(w,'store','shelter',11),false); assert.equal(accumulateExposure(0,1,.2,10),2);
  assert.throws(()=>accumulateExposure(0,1,0,10));
});
test('messages wait for link and a full request and reply', () => {
  const m=createMessage({id:'a',createdAt:0,outboundSeconds:10,processingSeconds:5,inboundSeconds:10,payload:'help'});
  updateMessage(m,0,false); assert.equal(m.status,'queued'); updateMessage(m,3,true); updateMessage(m,27,true); assert.equal(m.status,'returning');
  updateMessage(m,28,false); assert.equal(m.status,'reception-blocked'); updateMessage(m,30,true); assert.equal(m.deliveredAt,30);
  updateMessage(m,40,true); assert.equal(m.deliveredAt,30);
});
test('clock pauses and processes due events once across snapshots', () => {
  const s={simSeconds:0,paused:true,events:[{id:'a',at:2}]};let count=0;
  advanceClock(s,5,()=>{},()=>count++);assert.equal(s.simSeconds,0);s.paused=false;
  advanceClock(s,3,()=>{},()=>count++);assert.equal(count,1);
  const restored=restoreSnapshot(serializeSnapshot(s));advanceClock(restored,1,()=>{},()=>count++);assert.equal(count,1);
});
test('crops require time and support and only harvest once',()=>{
  const c={progress:.5,stress:0,harvested:false};advanceCrop(c,{seconds:100,lightFraction:0,waterFraction:1,growthSeconds:100});assert.equal(c.progress,.5);
  advanceCrop(c,{seconds:50,lightFraction:1,waterFraction:1,growthSeconds:100});assert.equal(harvestCrop(c),2);assert.equal(harvestCrop(c),0);
});
test('seeded random streams are reproducible',()=>{const a=seededRandom(5),b=seededRandom(5);assert.deepEqual([a(),a(),a()],[b(),b(),b()]);});
