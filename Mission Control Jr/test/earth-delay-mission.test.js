import test from 'node:test';
import assert from 'node:assert/strict';
import {createMission} from '../missions/earth-delay/state.js';
import {delayScenario} from '../missions/earth-delay/scenario.js';
import {applyAction,advanceMission,getResult,serializeSnapshot,restoreSnapshot} from '../missions/earth-delay/actions.js';
const act=(m,id,payload)=>{const r=applyAction(m,{id,payload});assert.ok(r.ok,r.message);};
function start(scenario=delayScenario){const m=createMission({scenario});act(m,'begin');act(m,'inspectFault');act(m,'sendEarthRequest');return m;}
test('Earth reply includes both light-time legs and processing and survives snapshots',()=>{
 const m=start();act(m,'connectReserve');act(m,'selectSupportPolicy','conserve');act(m,'isolatePumpBranch');
 assert.equal(applyAction(m,{id:'applyAdvice'}).ok,false);const arrival=2*m.scenario.oneWaySeconds+m.scenario.processingSeconds;
 advanceMission(m,arrival-m.simSeconds-.1);assert.notEqual(m.message.status,'delivered');
 const saved=restoreSnapshot(serializeSnapshot(m));advanceMission(m,.2);advanceMission(saved,.2);assert.equal(m.message.status,'delivered');assert.deepEqual(saved,m);
 act(m,'applyAdvice');act(m,'verifyFlow');act(m,'finish');const r=getResult(m);assert.equal(r.outcome,'bridge-and-verify');assert.equal(r.spareRemaining,1);assert.ok(r.replyReceivedAt>=arrival);assert.ok(r.airReserveUnits>0);
});
test('local repair takes a finite spare and can finish before Earth replies',()=>{
 const m=start();for(const id of ['isolatePumpBranch','openServiceCover','replaceCartridge','latchCover','restoreBranch','verifyFlow','finish'])act(m,id);
 const r=getResult(m);assert.equal(r.outcome,'local-recovery');assert.equal(r.spareRemaining,0);assert.equal(r.replyReceivedAt,null);assert.ok(r.airReserveUnits>0);
});
test('repair interlocks and zero energy prevent unsupported verification',()=>{
 const m=start();assert.equal(applyAction(m,{id:'openServiceCover'}).ok,false);assert.equal(applyAction(m,{id:'replaceCartridge'}).ok,false);
 const before=JSON.stringify(m);m.paused=true;assert.equal(applyAction(m,{id:'connectReserve'}).ok,false);m.paused=false;assert.equal(JSON.stringify(m),before);
 m.processorRunning=true;m.energyWh=0;assert.equal(applyAction(m,{id:'verifyFlow'}).ok,false);
});
test('unmitigated waiting exceeds the reserve before the reply and suspension is recoverable',()=>{
 const m=start();advanceMission(m,2*m.scenario.oneWaySeconds+m.scenario.processingSeconds);assert.equal(m.phase,'suspended');assert.notEqual(m.message.status,'delivered');
 const safe=start();act(safe,'suspendExercise');assert.equal(getResult(safe).outcome,'protected-suspension');assert.equal(safe.processorRunning,false);
});
test('light-time input changes the reply schedule',()=>{
 const a=start(),b=start({...delayScenario,oneWaySeconds:10});
 advanceMission(a,201);advanceMission(b,201);assert.notEqual(a.message.status,'delivered');assert.equal(b.message.status,'delivered');
});
test('greenhouse crop condition carries into Earth-delay and changes only living trays',()=>{
 const carried=createMission({initialCarry:{version:1,trays:[{id:'a',harvested:false,stress:.72,progress:.8},{id:'b',harvested:true,stress:.4,progress:1}]}});
 assert.equal(carried.cropCarryUsed,true);assert.equal(carried.crops[0].stress,.72);assert.equal(carried.crops[1].harvested,true);
 act(carried,'begin');carried.energyWh=0;advanceMission(carried,60);
 assert.ok(carried.crops[0].stress>.72);assert.equal(carried.crops[1].stress,.4);
 const fresh=createMission();assert.equal(fresh.cropCarryUsed,false);assert.equal(getResult(carried).cropCarryUsed,true);
});
