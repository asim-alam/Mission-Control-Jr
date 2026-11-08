import {advanceClock} from '../../simulation/clock.js';
import {servePower} from '../../simulation/resources.js';
import {accumulateExposure} from '../../simulation/exposure.js';
import {recordDecision} from '../../simulation/decisions.js';
import {serializeSnapshot,restoreSnapshot} from '../../simulation/replay.js';

export function advanceMission(state,seconds){
  if(state.phase!=='active'||!Number.isFinite(seconds)||seconds<0)return false;
  const sc=state.scenario;
  advanceClock(state,Math.min(seconds,Math.max(0,sc.durationSeconds-state.simSeconds)),(m,dt)=>{
    const loads=[{id:'essential',watts:sc.essentialW},...(m.experimentOn?[{id:'experiment',watts:sc.experimentW}]:[])];
    const ledger=servePower({energyWh:m.energyWh,capacityWh:sc.capacityWh,generationW:0,loads},dt);m.energyWh=ledger.energyWh;
    const essentialFraction=ledger.servedWh.essential/(sc.essentialW*dt/3600);
    if(essentialFraction<1)m.airReserveUnits=Math.max(0,m.airReserveUnits-(1-essentialFraction)*dt*.03);
    if(m.experimentOn)m.experimentPoweredSeconds+=(ledger.servedWh.experiment||0)/(sc.experimentW/3600);
    const hazard=m.simSeconds>=sc.hazardStart&&m.simSeconds<sc.hazardEnd?sc.eventPerSecond:sc.backgroundPerSecond;
    const installed=m.bags.filter(b=>b.location==='shelter').length;
    const shield=installed>=3?sc.protection.three:installed>=2?sc.protection.two:sc.protection.habitat;
    for(const crew of Object.values(m.crew))crew.exposurePoints=accumulateExposure(crew.exposurePoints,hazard,crew.location==='shelter'?shield:sc.protection.habitat,dt);
    return m.airReserveUnits>0;
  },(event,m)=>{
    if(event.id==='activity-start')m.notice='The Sun storm is here! Call the crew into the safe room.';
    if(event.id==='activity-end')m.notice='The Sun storm is getting weaker. Check on the crew.';
    if(event.id==='supply-need')m.notice='The crew is thirsty. Use a water bag that you can reach.';
  });
  if(state.airReserveUnits<=0){state.phase='suspended';state.notice='Game paused: the air ran too low.';}
  return true;
}
export function applyAction(state,{id,targetId,payload}={}) {
  const fail=message=>({ok:false,message});const ok=message=>({ok:true,message});
  if(state.phase==='brief'&&id==='inspectMonitor'){state.phase='inspect';return ok('That storm really happened. Our clock here is pretend.');}
  if(state.phase==='inspect'&&id==='begin'){state.phase='active';recordDecision(state,'begin');return ok('Exercise begun.');}
  if(state.phase!=='active')return fail('Start the game, or play again.');
  if(state.paused)return fail('Unpause the game first.');
  if(id==='moveBag'){
    const bag=state.bags.find(b=>b.id===targetId);if(!bag||!['storage','shelter'].includes(payload)||bag.location===payload)return fail('Pick a bag and a new place for it.');
    advanceMission(state,state.scenario.bagTransferSeconds);if(state.phase!=='active')return fail('The game stopped before the bag got there.');
    bag.location=payload;recordDecision(state,id,{bag:bag.id,to:payload});return ok(`Bag ${bag.id+1} moved to ${payload}.`);
  }
  if(id==='setExperimentPolicy'){
    if(typeof payload!=='boolean'||state.experimentOn===payload)return fail('Pick the other setting.');
    state.experimentOn=payload;recordDecision(state,id,{on:payload});return ok(payload?'Recorder running.':'Recorder paused.');
  }
  if(id==='recallCrew'){
    if(Object.values(state.crew).every(c=>c.location==='shelter'))return fail('The crew is already safe inside.');
    advanceMission(state,60);if(state.phase!=='active')return fail('The game stopped while calling the crew.');
    for(const crew of Object.values(state.crew))crew.location='shelter';recordDecision(state,id);return ok('All four crew are in the safe room!');
  }
  if(id==='accessSupply'){
    if(state.waterConsumedKg>0)return fail('The crew already had a drink.');
    const bag=state.bags.find(b=>b.location==='storage'&&b.massKg>=1);if(!bag)return fail('Move a bag back to the store room first.');
    bag.massKg-=1;state.waterConsumedKg+=1;recordDecision(state,id,{bag:bag.id,kg:1});return ok('The crew drank a little water. The rest is saved.');
  }
  if(id==='wait') {if(!Number.isFinite(payload)||payload<=0||payload>1200)return fail('Pick how long to wait.');advanceMission(state,payload);recordDecision(state,id,{seconds:payload});return ok('Time passed. Power and radiation went up or down.');}
  if(id==='confirmCrew'){
    const sheltered=Object.values(state.crew).every(c=>c.location==='shelter');if(!sheltered)return fail('Call the crew in first.');
    if(state.simSeconds<state.scenario.hazardEnd&&!payload?.early)return fail('Wait until the Sun storm gets weaker, or stop early.');
    state.phase='debrief';state.result=getResult(state);recordDecision(state,id,{early:!!payload?.early});return ok('Everyone is OK!');
  }
  return fail('Unknown action.');
}
export function getObjective(state){if(state.phase==='brief')return 'Look at the space weather screen';if(state.phase==='inspect')return 'Start the Sun storm practice';if(state.phase==='suspended')return 'Game stopped. Try again from a safe spot.';if(state.phase==='debrief')return 'Look at what you chose';return state.simSeconds<state.scenario.hazardEnd?'Put water bags around the safe room. Call the crew in.':'Check on the crew and finish';}
export function getResult(state){const bagCount=state.bags.filter(b=>b.location==='shelter').length;return {outcome:state.phase==='suspended'?'suspended':state.simSeconds<state.scenario.hazardEnd?'limited':state.experimentPoweredSeconds>=state.scenario.experimentGoalSeconds?'useful-record':'crew-first',completed:state.phase==='debrief',shelterLayout:bagCount,waterRemainingKg:state.bags.reduce((sum,b)=>sum+b.massKg,0),waterConsumedKg:state.waterConsumedKg,energyWh:state.energyWh,airReserveUnits:state.airReserveUnits,experimentPoweredSeconds:state.experimentPoweredSeconds,experimentPreserved:state.experimentPoweredSeconds>=state.scenario.experimentGoalSeconds,maxExposurePoints:Math.max(...Object.values(state.crew).map(c=>c.exposurePoints)),crewAccountedFor:Object.values(state.crew).every(c=>c.location==='shelter'),sourceId:state.scenario.sourceId};}
export {serializeSnapshot,restoreSnapshot};
