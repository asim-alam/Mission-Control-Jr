import test from 'node:test';
import assert from 'node:assert/strict';
import {createMission} from '../missions/lunar-dust/state.js';
import {applyAction,advanceMission,getResult,serializeSnapshot,restoreSnapshot} from '../missions/lunar-dust/actions.js';
const act=(m,id,targetId,payload)=>{const r=applyAction(m,{id,targetId,payload});assert.ok(r.ok,r.message);};
function start(carry){const m=createMission({initialCarry:carry});act(m,'begin');return m;}
function stage(m){for(const id of ['panel','boots','tool'])act(m,'stageItem',id);}
function entry(m,cycle='conserve'){act(m,'secureOuterDoor');act(m,'runAirlockCycle',undefined,cycle);act(m,'verifyBoundary');act(m,'openInnerDoor');}
test('powered panel and manual boots/tool lead to a clean cabin with finite resources',()=>{
 const m=start();stage(m);act(m,'closeRack');act(m,'startRack');for(const id of ['boots','tool'])act(m,'manualCleanItem',id);entry(m,'normal');const r=getResult(m);
 assert.equal(r.outcome,'clean-return');assert.ok(r.items.every(i=>i.location==='cabin'));assert.ok(r.items.every(i=>i.dust<=20));assert.equal(m.outerDoor,'closed');assert.equal(m.innerDoor,'open');assert.equal(r.filterRemaining,0);assert.ok(r.energyWh<350);
});
test('manual panel plus longer conservation cycle offers a second viable path',()=>{
 const m=start();stage(m);for(const id of ['panel','boots','tool'])act(m,'manualCleanItem',id);entry(m,'conserve');const r=getResult(m);
 assert.equal(r.outcome,'manual-return');assert.ok(r.energyWh>0);assert.equal(r.spareFilters,1);assert.equal(r.filterRemaining,0);assert.equal(r.airReserveUnits,98);
});
test('quarantined equipment stays outside and interlocks reject unsafe sequences',()=>{
 const m=start();act(m,'stageItem','boots');act(m,'manualCleanItem','boots');act(m,'quarantineItem','panel');act(m,'quarantineItem','tool');
 assert.equal(applyAction(m,{id:'openInnerDoor'}).ok,false);act(m,'secureOuterDoor');assert.equal(applyAction(m,{id:'stageItem',targetId:'panel'}).ok,false);act(m,'runAirlockCycle',undefined,'conserve');act(m,'verifyBoundary');act(m,'openInnerDoor');assert.equal(getResult(m).outcome,'quarantined');assert.equal(m.items.find(i=>i.id==='panel').location,'quarantine');
});
test('zero electrical supply cannot finish a powered rack or airlock cycle',()=>{
 const m=start();act(m,'stageItem','panel');act(m,'closeRack');m.energyWh=0;act(m,'startRack');assert.equal(m.items[0].dust,100);act(m,'secureOuterDoor');act(m,'runAirlockCycle',undefined,'conserve');assert.equal(m.cycleComplete,false);assert.equal(applyAction(m,{id:'verifyBoundary'}).ok,false);
});
test('manual cleaning interrupted by an exhausted air reserve only makes partial progress',()=>{
 const m=start();act(m,'stageItem','boots');m.energyWh=0;m.airReserveUnits=0.01;
 act(m,'manualCleanItem','boots');
 assert.equal(m.phase,'suspended');assert.ok(m.simSeconds<300);assert.ok(m.items.find(i=>i.id==='boots').dust>20);assert.ok(m.filterRemaining>25);
});
test('low lunar carry receives a labeled recovery reserve; snapshots and pause are deterministic',()=>{
 const m=start({version:1,collectorLocation:'near',energyWh:10});assert.equal(m.energyWh,180);assert.equal(m.recoveryChargeWh,170);m.paused=true;const before=JSON.stringify(m);advanceMission(m,60);assert.equal(JSON.stringify(m),before);assert.equal(applyAction(m,{id:'stageItem',targetId:'boots'}).ok,false);m.paused=false;
 const copy=restoreSnapshot(serializeSnapshot(m));assert.deepEqual(copy,m);const unrelated=start({version:1,stormOutcome:'prepared',energyWh:10});assert.equal(unrelated.energyWh,350);
});
