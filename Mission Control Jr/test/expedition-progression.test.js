import test from 'node:test';
import assert from 'node:assert/strict';
import {SERVICE,reportStations,inspectionPoint,task2,createExpedition,act2,retry,finish2,applyStormCarry} from '../mission2.js';
import {HOME,RIDGE} from '../expedition-terrain.js';
import {prepared,fieldArrival} from './expedition-fixtures.js';
import {readiness} from './expedition-fixtures.js';

test('departure planning cannot launch a moving rover or a rover outside the apron',()=>{
  const m=readiness();act2(m,'board');m.vehicle.distance=6;m.vehicle.steeringTravel=1;act2(m,'brakeTest');assert.ok(act2(m,'plan').ok);m.vehicle.parking=false;assert.equal(act2(m,'launch',{route:'wash',reason:'evidence'}).ok,false);m.vehicle.parking=true;Object.assign(m.vehicle,RIDGE);assert.equal(act2(m,'launch',{route:'wash',reason:'evidence'}).ok,false);Object.assign(m.vehicle,HOME);assert.ok(act2(m,'launch',{route:'wash',reason:'evidence'}).ok);assert.equal(act2(m,'plan').ok,false);
});

test('briefing and physical readiness cannot be completed remotely or aboard',()=>{
  const m=createExpedition();act2(m,'start');assert.equal(act2(m,'spare').ok,false);assert.equal(task2(m).stage,1);
  act2(m,'acceptBrief');assert.equal(act2(m,'spare').ok,false);m.walker={...SERVICE.spare};assert.ok(act2(m,'spare').ok);
  assert.equal(act2(m,'check','battery').ok,false);m.walker={...SERVICE.battery};assert.ok(act2(m,'check','battery').ok);assert.equal(act2(m,'board').ok,false);
  m.aboard=true;m.walker={...SERVICE.wheels};assert.equal(act2(m,'check','wheels').ok,false);
});
test('missed stations and arrival alone never unlock ridge science',()=>{
  const m=prepared();Object.assign(m.vehicle,RIDGE);assert.equal(act2(m,'science').ok,false);assert.deepEqual(m.reports,[false,false]);assert.equal(act2(m,'hazard').ok,false);
  Object.assign(m.vehicle,reportStations(m)[0]);m.vehicle.parking=false;assert.equal(act2(m,'report').ok,false);m.vehicle.parking=true;assert.ok(act2(m,'report').ok);assert.deepEqual(m.reports,[true,false]);assert.equal(act2(m,'report').ok,false);
  Object.assign(m.vehicle,reportStations(m)[1]);assert.ok(act2(m,'report').ok);assert.equal(act2(m,'hazard').ok,false);
  Object.assign(m.vehicle,inspectionPoint(m));assert.ok(act2(m,'hazard').ok);assert.equal(act2(m,'terrainDecision','cross').ok,false);assert.equal(m.detour,false);
  Object.assign(m.vehicle,RIDGE);assert.equal(act2(m,'science').ok,false);Object.assign(m.vehicle,inspectionPoint(m));assert.ok(act2(m,'terrainDecision','perimeter').ok);Object.assign(m.vehicle,RIDGE);assert.ok(act2(m,'science').ok);
});
test('return requires parking, terminal transfer and a separate final crew count',()=>{
  const m=prepared();act2(m,'return');Object.assign(m.vehicle,HOME);m.vehicle.parking=false;assert.equal(act2(m,'dock').ok,false);m.vehicle.parking=true;assert.ok(act2(m,'dock').ok);assert.equal(m.ended,false);assert.equal(act2(m,'crew').ok,false);
  act2(m,'exit');m.walker={x:50,z:0};assert.equal(act2(m,'transfer').ok,false);m.walker={...SERVICE.comms};assert.equal(act2(m,'crew').ok,false);assert.ok(act2(m,'transfer').ok);assert.equal(act2(m,'transfer').ok,false);assert.ok(act2(m,'crew').ok);assert.equal(m.outcome,'abort');
});
test('interrupted fieldwork checkpoint and clean restart preserve independent progress',()=>{
  const m=fieldArrival(prepared());act2(m,'science');act2(m,'exit');act2(m,'photo','context');finish2(m,true);const restored=retry(m);assert.equal(restored.phase,'science');assert.equal(restored.photos.context,false);assert.equal(restored.aboard,true);assert.ok(restored.assisted);
  const fresh=createExpedition();assert.equal(fresh.phase,'briefing');assert.deepEqual(fresh.reports,[false,false]);assert.equal(fresh.spareCollected,false);assert.equal(fresh.dataTransferred,false);restored.reports[0]=false;assert.equal(m.reports[0],true);
});
test('storm outcomes carry charge and a conservative return rule into the traverse',()=>{
  const prepared=applyStormCarry(createExpedition(),{stormOutcome:'prepared'});
  const survived=applyStormCarry(createExpedition(),{stormOutcome:'survived'});
  const evacuated=applyStormCarry(createExpedition(),{stormOutcome:'evacuated'});
  assert.equal(prepared.battery,100);assert.equal(prepared.returnReserve,20);
  assert.equal(survived.battery,88);assert.equal(survived.returnReserve,24);
  assert.equal(evacuated.battery,84);assert.equal(evacuated.returnReserve,24);
});
