import test from 'node:test';
import assert from 'node:assert/strict';
import {createMission} from '../missions/solar-shelter/state.js';
import {applyAction,advanceMission,getResult,serializeSnapshot,restoreSnapshot} from '../missions/solar-shelter/actions.js';
function start(){const m=createMission();assert.ok(applyAction(m,{id:'inspectMonitor'}).ok);assert.ok(applyAction(m,{id:'begin'}).ok);return m;}
function action(m,id,targetId,payload){const r=applyAction(m,{id,targetId,payload});assert.ok(r.ok,r.message);}
test('two shelter strategies use conserved mass and yield real recorder and exposure differences',()=>{
  const a=start(),b=start();
  for(const m of [a,b]){action(m,'moveBag',0,'shelter');action(m,'moveBag',1,'shelter');action(m,'recallCrew');}
  action(b,'moveBag',2,'shelter');action(b,'setExperimentPolicy',undefined,true);
  advanceMission(a,1080-a.simSeconds);advanceMission(b,1080-b.simSeconds);
  action(a,'confirmCrew');action(b,'confirmCrew');const x=getResult(a),y=getResult(b);
  assert.equal(x.waterRemainingKg,15);assert.equal(y.waterRemainingKg,15);
  assert.equal(x.outcome,'crew-first');assert.equal(y.outcome,'useful-record');
  assert.ok(y.energyWh<x.energyWh);assert.ok(y.maxExposurePoints<x.maxExposurePoints);assert.ok(y.maxExposurePoints>0);
});
test('transfers cannot duplicate bags and scheduled events fire across work and snapshot restore',()=>{
  const m=start();action(m,'moveBag',0,'shelter');const before=JSON.stringify(m);
  assert.equal(applyAction(m,{id:'moveBag',targetId:0,payload:'shelter'}).ok,false);assert.equal(JSON.stringify(m),before);
  advanceMission(m,350);action(m,'moveBag',1,'shelter');assert.equal(m.events.find(e=>e.id==='activity-start').processed,true);
  const saved=restoreSnapshot(serializeSnapshot(m));assert.deepEqual(saved,m);
  action(saved,'recallCrew');action(saved,'confirmCrew',undefined,{early:true});assert.equal(getResult(saved).outcome,'limited');
});
test('powered recorder stops accumulating when essential loads exhaust the battery',()=>{
  const m=start();m.energyWh=0;action(m,'setExperimentPolicy',undefined,true);advanceMission(m,10);
  assert.equal(m.experimentPoweredSeconds,0);assert.ok(m.airReserveUnits<100);
});
