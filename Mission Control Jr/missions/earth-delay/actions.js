import {advanceClock} from '../../simulation/clock.js';
import {servePower} from '../../simulation/resources.js';
import {createMessage,updateMessage} from '../../simulation/messages.js';
import {recordDecision} from '../../simulation/decisions.js';
import {serializeSnapshot,restoreSnapshot} from '../../simulation/replay.js';
const fraction=n=>Math.max(0,Math.min(1,n));
export function advanceMission(state,seconds){
 if(state.phase!=='active'||state.paused||!Number.isFinite(seconds)||seconds<0)return false;
 const sc=state.scenario;advanceClock(state,seconds,(m,dt)=>{
  const loads=[{id:'essential',watts:sc.essentialW},...(m.processorRunning?[{id:'processor',watts:sc.processorW}]:[]),...(m.experimentOn?[{id:'experiment',watts:sc.experimentW}]:[])];
  const ledger=servePower({energyWh:m.energyWh,capacityWh:sc.capacityWh,generationW:0,loads},dt);m.energyWh=ledger.energyWh;
  const processor=m.processorRunning?fraction((ledger.servedWh.processor||0)/(sc.processorW*dt/3600)):0;
  const faultRate=m.reserveConnected&&m.policy==='conserve'?sc.conservedAirLossPerSecond:sc.normalAirLossPerSecond;
  const loss=m.processorRunning?sc.unpoweredAirLossPerSecond*(1-processor):faultRate;
  m.airReserveUnits=Math.max(0,m.airReserveUnits-dt*loss);
  if(m.experimentOn){
   const served=(ledger.servedWh.experiment||0)/(sc.experimentW/3600);
   m.experimentPoweredSeconds+=served;
   for(const crop of m.crops){if(crop.harvested)continue;crop.stress=fraction(crop.stress+Math.max(0,dt-served)*sc.cropStressPerUnservedSecond-served*sc.cropStressReliefPerServedSecond);}
  }
  if(m.message)updateMessage(m.message,m.simSeconds+dt,true);
  return m.airReserveUnits>0;
 });
 if(state.airReserveUnits<=0){state.phase='suspended';state.notice='Training paused: the breathing reserve was exhausted.';}
 return true;
}
export function applyAction(m,{id,payload}={}){
 const no=message=>({ok:false,message}),yes=message=>({ok:true,message});
 if(id==='begin'&&m.phase==='brief'){m.phase='active';recordDecision(m,id);return yes('The pump fault needs a local plan.');}
 if(m.phase!=='active')return no('Begin the exercise or restart.');if(m.paused)return no('Resume the exercise first.');
 const work=(seconds)=>{advanceMission(m,seconds);return m.phase==='active';};
 if(id==='inspectFault'){if(m.faultInspected)return no('The fault is already inspected.');m.faultInspected=true;recordDecision(m,id);return yes('The coolant pump is stopped.');}
 if(id==='sendEarthRequest'){
  if(!m.faultInspected||m.message)return no('Inspect the fault first; only one request is needed.');
  m.message=createMessage({id:'earth-advice',createdAt:m.simSeconds,outboundSeconds:m.scenario.oneWaySeconds,processingSeconds:m.scenario.processingSeconds,inboundSeconds:m.scenario.oneWaySeconds,payload:'Check isolation before restoring the pump.'});updateMessage(m.message,m.simSeconds,true);recordDecision(m,id);return yes('Status sent. Earth cannot reply until both journeys and processing are complete.');
 }
 if(id==='connectReserve'){if(m.reserveConnected)return no('The reserve is already connected.');if(!work(60))return no('Training paused during connection.');m.reserveConnected=true;recordDecision(m,id);return yes('Reserve connected.');}
 if(id==='selectSupportPolicy'){
  if(!['normal','conserve'].includes(payload)||m.policy===payload)return no('Choose a different support policy.');m.policy=payload;m.experimentOn=payload!=='conserve';recordDecision(m,id,{policy:payload});return yes(payload==='conserve'?'Optional study paused to protect reserves.':'Optional study resumed.');
 }
 if(id==='isolatePumpBranch'){if(!m.faultInspected||m.branchIsolated||m.processorRunning)return no('Inspect the fault before isolating the stopped branch.');if(!work(60))return no('Training paused during isolation.');m.branchIsolated=true;recordDecision(m,id);return yes('Pump branch isolated.');}
 if(id==='openServiceCover'){if(!m.branchIsolated||m.coverOpen||m.cartridgeReplaced)return no('Isolate the stopped branch first.');if(!work(45))return no('Training paused during inspection.');m.coverOpen=true;m.coverLatched=false;recordDecision(m,id);return yes('Training service cover opened.');}
 if(id==='replaceCartridge'){if(!m.branchIsolated||!m.coverOpen||m.cartridgeReplaced||m.spareCartridges<1)return no('Open the isolated service cover and use the available spare.');if(!work(120))return no('Training paused during replacement.');m.cartridgeReplaced=true;m.spareCartridges--;recordDecision(m,id);return yes('The spare cartridge is installed.');}
 if(id==='latchCover'){if(!m.coverOpen||!m.cartridgeReplaced)return no('Fit the replacement cartridge first.');if(!work(30))return no('Training paused before the cover was latched.');m.coverOpen=false;m.coverLatched=true;recordDecision(m,id);return yes('Cover latched.');}
 if(id==='restoreBranch'){if(!m.branchIsolated||!m.cartridgeReplaced||!m.coverLatched||m.processorRunning)return no('Complete the isolated service sequence first.');if(!work(30))return no('Training paused before restoration.');m.branchIsolated=false;m.processorRunning=true;m.restoredAt=m.simSeconds;recordDecision(m,id);return yes('Pump restarted using the local procedure.');}
 if(id==='applyAdvice'){
  if(m.message?.status!=='delivered'||m.processorRunning)return no('Earth advice is not available yet, or the pump already runs.');
  if(!m.branchIsolated||m.coverOpen)return no('Isolate the pump branch and close its cover before the suggested reset.');if(!work(120))return no('Training paused before the reset was complete.');m.replyApplied=true;m.branchIsolated=false;m.processorRunning=true;m.restoredAt=m.simSeconds;recordDecision(m,id);return yes('Earth’s advice confirmed the training reset; the pump restarted.');
 }
 if(id==='wait'){if(!Number.isFinite(payload)||payload<=0||payload>3600)return no('Choose a valid wait.');work(payload);recordDecision(m,id,{requestedSeconds:payload});return yes('Waiting used reserves and advanced the message.');}
 if(id==='verifyFlow'){if(!m.processorRunning||m.energyWh<=0)return no('Restore powered flow before verifying it.');if(!work(60))return no('Training paused during verification.');if(m.energyWh<=0)return no('Stored energy ran out before the flow check finished.');m.verified=true;recordDecision(m,id);return yes('Flow and reserve trend verified.');}
 if(id==='finish'){if(!m.verified)return no('Verify flow, or suspend the exercise.');m.phase='debrief';recordDecision(m,id);return yes('Recovery complete.');}
 if(id==='suspendExercise'){m.phase='debrief';recordDecision(m,id);return yes('The crew is safe; the unresolved fault remains for review.');}
 return no('Unknown action.');
}
export function getObjective(m){if(m.phase==='brief')return 'Inspect the stopped coolant pump.';if(m.phase==='suspended')return 'Training paused: restore a safe checkpoint.';if(m.phase==='debrief')return 'Review the local decision and message timeline.';if(!m.faultInspected)return 'Inspect the pump fault.';if(!m.message)return 'Send a status request to Earth.';if(!m.processorRunning)return 'Repair locally, conserve while waiting, or suspend safely.';return m.verified?'Finish the recovery exercise.':'Verify powered flow.';}
export function getResult(m){return {outcome:m.phase==='suspended'?'reserve-limit':!m.verified?'protected-suspension':m.replyApplied?'bridge-and-verify':'local-recovery',completed:m.phase==='debrief',energyWh:m.energyWh,airReserveUnits:m.airReserveUnits,spareRemaining:m.spareCartridges,processorRunning:m.processorRunning,verified:m.verified,experimentPoweredSeconds:m.experimentPoweredSeconds,crops:m.crops.map(c=>({...c})),cropCarryUsed:m.cropCarryUsed,replyReceivedAt:m.message?.deliveredAt??null,restoredAt:m.restoredAt,message:m.message?structuredClone(m.message):null,sourceId:m.scenario.sourceId};}
export {serializeSnapshot,restoreSnapshot};
