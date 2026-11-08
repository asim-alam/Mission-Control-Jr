import test from 'node:test';
import assert from 'node:assert/strict';
import {createMission} from '../missions/lunar-relay/state.js';
import {applyAction,advanceMission,lineVisible,localLinkAvailable,returnForecast,getResult,serializeSnapshot,restoreSnapshot} from '../missions/lunar-relay/actions.js';
const act=(m,id,payload)=>{const r=applyAction(m,{id,payload});assert.ok(r.ok,r.message);};
function start(scope){const m=createMission();act(m,'begin');act(m,'inspectRoute');act(m,'selectSurveyScope',scope);return m;}
test('ridge blocks the far stop; an unpowered or one-hop relay cannot restore the link',()=>{
 const m=start('far');assert.equal(lineVisible(0,2,100,2,m.scenario),false);act(m,'loadRelayKit');act(m,'travelTo','saddle');act(m,'anchorRelay');assert.equal(localLinkAvailable(m),false);act(m,'connectRelayPower');act(m,'verifyHop','base');assert.equal(localLinkAvailable(m),false);act(m,'verifyHop','field');assert.equal(localLinkAvailable(m),true);m.relayEnergyWh=0;assert.equal(localLinkAvailable(m),false);
});
test('near survey and relay-supported far survey both return with delivered observations',()=>{
 const near=start('near');act(near,'travelTo','near');act(near,'startProbe');act(near,'sendPacket');act(near,'travelTo','base');act(near,'wait',3);act(near,'confirmDelivery');
 const far=start('far');act(far,'loadRelayKit');act(far,'travelTo','saddle');act(far,'anchorRelay');act(far,'connectRelayPower');act(far,'verifyHop','base');act(far,'verifyHop','field');act(far,'travelTo','far');act(far,'startProbe');act(far,'sendPacket');act(far,'travelTo','base');act(far,'wait',3);act(far,'confirmDelivery');
 const a=getResult(near),b=getResult(far);assert.equal(a.outcome,'direct-survey');assert.equal(b.outcome,'relay-survey');assert.equal(a.message.status,'delivered');assert.equal(b.message.status,'delivered');assert.ok(b.observations>a.observations);assert.ok(b.roverEnergyWh<a.roverEnergyWh);assert.ok(b.suitReserveUnits<a.suitReserveUnits);assert.ok(a.roverEnergyWh>20&&b.roverEnergyWh>20);
});
test('blocked packet waits, survives restore, and leaves only after contact returns',()=>{
 const m=start('far');act(m,'travelTo','far');act(m,'startProbe');assert.equal(localLinkAvailable(m),false);act(m,'sendPacket');assert.equal(m.message.status,'queued');const saved=restoreSnapshot(serializeSnapshot(m));advanceMission(saved,5);assert.equal(saved.message.departureAt,null);
 act(saved,'travelTo','base');act(saved,'wait',3);assert.equal(saved.message.status,'delivered');assert.ok(saved.message.departureAt>saved.message.createdAt);assert.ok(saved.message.deliveredAt-saved.message.departureAt>=saved.scenario.oneWaySeconds);assert.ok(saved.scenario.oneWaySeconds<2);
});
test('pause and return forecast protect resources and optional work costs reserve',()=>{
 const m=start('near');act(m,'travelTo','near');act(m,'startProbe');const forecast=returnForecast(m),before=m.roverEnergyWh;act(m,'extraObservation');assert.ok(m.roverEnergyWh<before);assert.ok(returnForecast(m).energyWh<forecast.energyWh);m.paused=true;const serialized=JSON.stringify(m);advanceMission(m,100);assert.equal(JSON.stringify(m),serialized);assert.equal(applyAction(m,{id:'travelTo',payload:'base'}).ok,false);
});
test('lunar dust carry sets the bounded rover and suit starting reserves',()=>{
 const carried=createMission({initialCarry:{version:1,energyWh:250,airReserveUnits:62}});
 assert.equal(carried.roverEnergyWh,250);assert.equal(carried.suitReserveUnits,62);assert.equal(carried.carryUsed,true);
 const bounded=createMission({initialCarry:{version:1,energyWh:900,airReserveUnits:140}});
 assert.equal(bounded.roverEnergyWh,500);assert.equal(bounded.suitReserveUnits,100);
 const invalid=createMission({initialCarry:{version:1,energyWh:25}});
 assert.equal(invalid.roverEnergyWh,360);assert.equal(invalid.carryUsed,false);
});
