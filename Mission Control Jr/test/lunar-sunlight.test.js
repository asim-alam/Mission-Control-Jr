import test from 'node:test';
import assert from 'node:assert/strict';
import {createMission} from '../missions/lunar-sunlight/state.js';
import {applyAction,advanceMission,outputW,sunlightAt,getResult,serializeSnapshot,restoreSnapshot} from '../missions/lunar-sunlight/actions.js';
const act=(m,id,payload)=>{const r=applyAction(m,{id,payload});assert.ok(r.ok,r.message);};
function start(pad){const m=createMission();act(m,'begin');act(m,'inspectPower');act(m,'compareSites');act(m,'choosePad',pad);return m;}
function setup(m){for(const id of ['attachCart','transportCollector','deployMast','routeCable','connectPower'])act(m,id);}
test('collector output needs an installed route, connection and sunlight',()=>{
 const m=start('near');assert.equal(outputW(m),0);act(m,'attachCart');act(m,'transportCollector');act(m,'deployMast');assert.equal(outputW(m),0);assert.equal(applyAction(m,{id:'routeCable',payload:10}).ok,false);assert.equal(applyAction(m,{id:'routeCable',payload:51}).ok,false);act(m,'routeCable');assert.equal(outputW(m),0);act(m,'connectPower');assert.ok(outputW(m)>0);
 const shadow=m.scenario.pads.near.shadow;assert.equal(sunlightAt(m,shadow[0]),false);assert.equal(outputW(m,shadow[0]),0);assert.ok(outputW(m,shadow[1])>0);assert.equal(applyAction(m,{id:'connectPower'}).ok,false);
});
test('near conservation and ridge survey both keep essential power, with different work and science',()=>{
 const near=start('near'),ridge=start('ridge');setup(near);setup(ridge);act(ridge,'setLoadPolicy','science');
 advanceMission(near,7200-near.simSeconds);advanceMission(ridge,7200-ridge.simSeconds);act(near,'finishService');act(ridge,'finishService');
 const a=getResult(near),b=getResult(ridge);assert.equal(a.outcome,'reserve-protected');assert.equal(b.outcome,'survey-complete');assert.equal(a.essentialUnservedWh,0);assert.equal(b.essentialUnservedWh,0);assert.ok(a.energyWh>0&&b.energyWh>0);assert.ok(b.crewWorkSeconds>a.crewWorkSeconds);assert.ok(b.scienceServedWh>a.scienceServedWh);assert.ok(b.cableLengthUsed>a.cableLengthUsed);
});
test('reserve-only early completion and snapshots preserve independent lunar supplies',()=>{
 const m=start('reserve');assert.equal(m.energyWh,500);const saved=restoreSnapshot(serializeSnapshot(m));advanceMission(m,600);advanceMission(saved,600);assert.deepEqual(saved,m);act(m,'finishService',{early:true});assert.equal(getResult(m).outcome,'limited');
});
test('power, time and shadow freeze during pause, and inputs affect generation',()=>{
 const m=start('near');setup(m);m.paused=true;const before=JSON.stringify(m);advanceMission(m,900);assert.equal(JSON.stringify(m),before);assert.equal(applyAction(m,{id:'setLoadPolicy',payload:'science'}).ok,false);m.paused=false;
 const a=outputW(m);m.scenario.pads.near.referencePatch.meanFraction+=.1;assert.ok(outputW(m)>a);
});
