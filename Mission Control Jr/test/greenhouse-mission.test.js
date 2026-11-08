import test from 'node:test';
import assert from 'node:assert/strict';
import {createMission} from '../missions/greenhouse/state.js';
import {applyAction,advanceMission,getResult,serializeSnapshot,restoreSnapshot} from '../missions/greenhouse/actions.js';
const act=(m,id,payload,targetId)=>{const r=applyAction(m,{id,payload,targetId});assert.ok(r.ok,r.message);};
function start(){const m=createMission();act(m,'begin');return m;}
test('established crops require resources and elapsed light before one-time harvest',()=>{
 const m=start();assert.equal(applyAction(m,{id:'harvestTray',targetId:'a'}).ok,false);const before=m.trays[0].progress;
 act(m,'setPolicy',['a']);assert.equal(m.trays[0].progress,before);act(m,'advancePeriod');assert.ok(m.trays[0].progress>before);assert.ok(m.reservoirKg<12);assert.equal(m.periodsCompleted,1);
 act(m,'advancePeriod');act(m,'harvestTray',undefined,'a');assert.equal(applyAction(m,{id:'harvestTray',targetId:'a'}).ok,false);assert.ok(m.freshSupplementPortions>0);assert.equal(m.packagedFoodPortions,4);
});
test('one tray and two trays with fault repair produce different viable trade-offs',()=>{
 const one=start(),both=start();act(one,'setPolicy',['a']);act(one,'advancePeriod');act(one,'advancePeriod');act(one,'harvestTray',undefined,'a');act(one,'finishCultivation');
 act(both,'setPolicy',['a','b']);act(both,'advancePeriod');act(both,'inspectManifold');act(both,'isolateManifold');act(both,'repairReturnLine');act(both,'advancePeriod');
 for(const t of both.trays)if(t.progress>=1)act(both,'harvestTray',undefined,t.id);act(both,'finishCultivation');
 const a=getResult(one),b=getResult(both);assert.ok(a.completed&&b.completed);assert.ok(a.energyWh>b.energyWh);assert.ok(b.energyWh>0);assert.ok(a.waterRemainingKg>b.waterRemainingKg);assert.equal(a.harvestedSupplement,2);assert.equal(b.harvestedSupplement,4);assert.ok(b.faultRepaired);
});
test('habitat-first is a prudent limited harvest, and snapshot preserves deterministic state',()=>{
 const m=start();act(m,'setPolicy',[]);act(m,'advancePeriod');const saved=restoreSnapshot(serializeSnapshot(m));act(m,'advancePeriod');act(saved,'advancePeriod');assert.deepEqual(saved,m);act(m,'finishCultivation');assert.equal(getResult(m).outcome,'harvest-delayed');
});
test('pause freezes cultivation and unsupported lights cannot grow crops',()=>{
 const m=start();act(m,'setPolicy',['a']);m.paused=true;const before=JSON.stringify(m);advanceMission(m,3600);assert.equal(JSON.stringify(m),before);assert.equal(applyAction(m,{id:'advancePeriod'}).ok,false);m.paused=false;m.energyWh=0;m.scenario.generationW=[0,0];advanceMission(m,900);assert.equal(m.trays[0].progress,.76);assert.equal(m.waterDeliveredKg,0);assert.ok(m.airReserveUnits<100);
});
test('frame-sized advances tolerate floating-point rounding and continue simulating',()=>{
 const m=start();act(m,'setPolicy',['a']);for(let i=0;i<1200;i++)assert.equal(advanceMission(m,1/60),true);
 assert.ok(m.simSeconds>19.9);assert.ok(m.trays[0].progress>.76);
});
test('preserved experiment notes modestly affect the starting crop state without granting a harvest',()=>{
 const m=createMission({initialCarry:{experimentPreserved:true}});assert.equal(m.trays[0].progress,.78);assert.equal(m.trays[1].progress,.74);assert.equal(m.freshSupplementPortions,0);
});
