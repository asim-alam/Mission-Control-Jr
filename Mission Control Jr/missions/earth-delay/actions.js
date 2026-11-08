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
 if(state.airReserveUnits<=0){state.phase='suspended';state.notice='Game paused: the spare air ran out.';}
 return true;
}
export function applyAction(m,{id,payload}={}){
 const no=message=>({ok:false,message}),yes=message=>({ok:true,message});
 if(id==='begin'&&m.phase==='brief'){m.phase='active';recordDecision(m,id);return yes('The pump is broken. We need a plan!');}
 if(m.phase!=='active')return no('Start the game, or play again.');if(m.paused)return no('Unpause the game first.');
 const work=(seconds)=>{advanceMission(m,seconds);return m.phase==='active';};
 if(id==='inspectFault'){if(m.faultInspected)return no('You already looked at it.');m.faultInspected=true;recordDecision(m,id);return yes('The cooling pump has stopped.');}
 if(id==='sendEarthRequest'){
  if(!m.faultInspected||m.message)return no('Look at the pump first. You only need to send one message.');
  m.message=createMessage({id:'earth-advice',createdAt:m.simSeconds,outboundSeconds:m.scenario.oneWaySeconds,processingSeconds:m.scenario.processingSeconds,inboundSeconds:m.scenario.oneWaySeconds,payload:'Turn the pump power off before you fix it.'});updateMessage(m.message,m.simSeconds,true);recordDecision(m,id);return yes('Message sent! Earth needs time to get it and send a reply.');
 }
 if(id==='connectReserve'){if(m.reserveConnected)return no('The spare air is already on.');if(!work(60))return no('The game stopped while connecting.');m.reserveConnected=true;recordDecision(m,id);return yes('Reserve connected.');}
 if(id==='selectSupportPolicy'){
  if(!['normal','conserve'].includes(payload)||m.policy===payload)return no('Pick the other choice.');m.policy=payload;m.experimentOn=payload!=='conserve';recordDecision(m,id,{policy:payload});return yes(payload==='conserve'?'Science paused to save air.':'Science is on again.');
 }
 if(id==='isolatePumpBranch'){if(!m.faultInspected||m.branchIsolated||m.processorRunning)return no('Look at the pump before you turn it off.');if(!work(60))return no('The game stopped while turning it off.');m.branchIsolated=true;recordDecision(m,id);return yes('Pump power is off. It is safe to fix.');}
 if(id==='openServiceCover'){if(!m.branchIsolated||m.coverOpen||m.cartridgeReplaced)return no('Turn the pump power off first.');if(!work(45))return no('The game stopped while looking.');m.coverOpen=true;m.coverLatched=false;recordDecision(m,id);return yes('The cover is open.');}
 if(id==='replaceCartridge'){if(!m.branchIsolated||!m.coverOpen||m.cartridgeReplaced||m.spareCartridges<1)return no('Open the cover and put in the spare part.');if(!work(120))return no('The game stopped while swapping the part.');m.cartridgeReplaced=true;m.spareCartridges--;recordDecision(m,id);return yes('The new part is in!');}
 if(id==='latchCover'){if(!m.coverOpen||!m.cartridgeReplaced)return no('Put in the new part first.');if(!work(30))return no('The game stopped before the cover was closed.');m.coverOpen=false;m.coverLatched=true;recordDecision(m,id);return yes('Cover latched.');}
 if(id==='restoreBranch'){if(!m.branchIsolated||!m.cartridgeReplaced||!m.coverLatched||m.processorRunning)return no('Finish the repair steps first.');if(!work(30))return no('The game stopped before the pump was turned on.');m.branchIsolated=false;m.processorRunning=true;m.restoredAt=m.simSeconds;recordDecision(m,id);return yes('The pump is running again. You fixed it yourself!');}
 if(id==='applyAdvice'){
  if(m.message?.status!=='delivered'||m.processorRunning)return no('Earth has not answered yet, or the pump already works.');
  if(!m.branchIsolated||m.coverOpen)return no('Turn the pump off and close the cover before you try Earth’s idea.');if(!work(120))return no('The game stopped before the reset finished.');m.replyApplied=true;m.branchIsolated=false;m.processorRunning=true;m.restoredAt=m.simSeconds;recordDecision(m,id);return yes('Earth’s idea worked! The pump is running.');
 }
 if(id==='wait'){if(!Number.isFinite(payload)||payload<=0||payload>3600)return no('Pick how long to wait.');work(payload);recordDecision(m,id,{requestedSeconds:payload});return yes('You waited. The message moved along, and some air was used.');}
 if(id==='verifyFlow'){if(!m.processorRunning||m.energyWh<=0)return no('Turn the pump on before you test it.');if(!work(60))return no('The game stopped during the test.');if(m.energyWh<=0)return no('The power ran out before the test finished.');m.verified=true;recordDecision(m,id);return yes('Test passed! The water flows and the air is OK.');}
 if(id==='finish'){if(!m.verified)return no('Test the pump, or stop the game.');m.phase='debrief';recordDecision(m,id);return yes('Recovery complete.');}
 if(id==='suspendExercise'){m.phase='debrief';recordDecision(m,id);return yes('The crew is safe. The pump still needs fixing.');}
 return no('Unknown action.');
}
export function getObjective(m){if(m.phase==='brief')return 'Look at the broken pump';if(m.phase==='suspended')return 'Game stopped. Try again from a safe spot.';if(m.phase==='debrief')return 'Look at what you chose';if(!m.faultInspected)return 'Look at the broken pump';if(!m.message)return 'Send a message to Earth';if(!m.processorRunning)return 'Fix it yourself, or save air while you wait for Earth';return m.verified?'Finish the mission':'Test the pump';}
export function getResult(m){return {outcome:m.phase==='suspended'?'reserve-limit':!m.verified?'protected-suspension':m.replyApplied?'bridge-and-verify':'local-recovery',completed:m.phase==='debrief',energyWh:m.energyWh,airReserveUnits:m.airReserveUnits,spareRemaining:m.spareCartridges,processorRunning:m.processorRunning,verified:m.verified,experimentPoweredSeconds:m.experimentPoweredSeconds,crops:m.crops.map(c=>({...c})),cropCarryUsed:m.cropCarryUsed,replyReceivedAt:m.message?.deliveredAt??null,restoredAt:m.restoredAt,message:m.message?structuredClone(m.message):null,sourceId:m.scenario.sourceId};}
export {serializeSnapshot,restoreSnapshot};
