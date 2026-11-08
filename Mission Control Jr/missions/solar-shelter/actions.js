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
    if(event.id==='activity-start')m.notice='The training shelter period has begun. Recall the crew.';
    if(event.id==='activity-end')m.notice='Activity in the training model is declining. Check the crew.';
    if(event.id==='supply-need')m.notice='The crew needs drinking water; use an accessible bag or retrieve one.';
  });
  if(state.airReserveUnits<=0){state.phase='suspended';state.notice='Training paused: the air reserve reached its limit.';}
  return true;
}
export function applyAction(state,{id,targetId,payload}={}) {
  const fail=message=>({ok:false,message});const ok=message=>({ok:true,message});
  if(state.phase==='brief'&&id==='inspectMonitor'){state.phase='inspect';return ok('The historical event is context; the training clock is authored.');}
  if(state.phase==='inspect'&&id==='begin'){state.phase='active';recordDecision(state,'begin');return ok('Exercise begun.');}
  if(state.phase!=='active')return fail('Begin the exercise or restart.');
  if(state.paused)return fail('Resume the exercise first.');
  if(id==='moveBag'){
    const bag=state.bags.find(b=>b.id===targetId);if(!bag||!['storage','shelter'].includes(payload)||bag.location===payload)return fail('Choose a bag and a different valid location.');
    advanceMission(state,state.scenario.bagTransferSeconds);if(state.phase!=='active')return fail('Training stopped before the transfer finished.');
    bag.location=payload;recordDecision(state,id,{bag:bag.id,to:payload});return ok(`Bag ${bag.id+1} moved to ${payload}.`);
  }
  if(id==='setExperimentPolicy'){
    if(typeof payload!=='boolean'||state.experimentOn===payload)return fail('Choose a different recorder setting.');
    state.experimentOn=payload;recordDecision(state,id,{on:payload});return ok(payload?'Recorder running.':'Recorder paused.');
  }
  if(id==='recallCrew'){
    if(Object.values(state.crew).every(c=>c.location==='shelter'))return fail('Crew already sheltered.');
    advanceMission(state,60);if(state.phase!=='active')return fail('Training stopped during recall.');
    for(const crew of Object.values(state.crew))crew.location='shelter';recordDecision(state,id);return ok('All four crew are in the shelter.');
  }
  if(id==='accessSupply'){
    if(state.waterConsumedKg>0)return fail('This drinking-water need has already been met.');
    const bag=state.bags.find(b=>b.location==='storage'&&b.massKg>=1);if(!bag)return fail('Move a bag to accessible storage first.');
    bag.massKg-=1;state.waterConsumedKg+=1;recordDecision(state,id,{bag:bag.id,kg:1});return ok('One kilogram of water used; the rest remains stored.');
  }
  if(id==='wait') {if(!Number.isFinite(payload)||payload<=0||payload>1200)return fail('Choose a valid wait.');advanceMission(state,payload);recordDecision(state,id,{seconds:payload});return ok('Time advanced; power and exposure were updated.');}
  if(id==='confirmCrew'){
    const sheltered=Object.values(state.crew).every(c=>c.location==='shelter');if(!sheltered)return fail('Recall and account for the crew first.');
    if(state.simSeconds<state.scenario.hazardEnd&&!payload?.early)return fail('Wait until the activity declines, or choose a limited early finish.');
    state.phase='debrief';state.result=getResult(state);recordDecision(state,id,{early:!!payload?.early});return ok('Crew check complete.');
  }
  return fail('Unknown action.');
}
export function getObjective(state){if(state.phase==='brief')return 'Inspect the space-weather monitor.';if(state.phase==='inspect')return 'Begin the training exercise.';if(state.phase==='suspended')return 'Training suspended: restore a checkpoint or restart.';if(state.phase==='debrief')return 'Review your decisions.';return state.simSeconds<state.scenario.hazardEnd?'Prepare the shelter, manage the recorder, and recall the crew.':'Check the crew and complete the exercise.';}
export function getResult(state){const bagCount=state.bags.filter(b=>b.location==='shelter').length;return {outcome:state.phase==='suspended'?'suspended':state.simSeconds<state.scenario.hazardEnd?'limited':state.experimentPoweredSeconds>=state.scenario.experimentGoalSeconds?'useful-record':'crew-first',completed:state.phase==='debrief',shelterLayout:bagCount,waterRemainingKg:state.bags.reduce((sum,b)=>sum+b.massKg,0),waterConsumedKg:state.waterConsumedKg,energyWh:state.energyWh,airReserveUnits:state.airReserveUnits,experimentPoweredSeconds:state.experimentPoweredSeconds,experimentPreserved:state.experimentPoweredSeconds>=state.scenario.experimentGoalSeconds,maxExposurePoints:Math.max(...Object.values(state.crew).map(c=>c.exposurePoints)),crewAccountedFor:Object.values(state.crew).every(c=>c.location==='shelter'),sourceId:state.scenario.sourceId};}
export {serializeSnapshot,restoreSnapshot};
