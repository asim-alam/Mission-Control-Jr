import {advanceClock} from '../../simulation/clock.js';
import {servePower} from '../../simulation/resources.js';
import {recordDecision} from '../../simulation/decisions.js';
import {serializeSnapshot,restoreSnapshot} from '../../simulation/replay.js';
const frac=n=>Math.max(0,Math.min(1,n));
export function advanceMission(m,seconds,extraW=0){
 if(m.phase!=='active'||m.paused||![seconds,extraW].every(Number.isFinite)||seconds<0||extraW<0)return null;
 let served=0;const start=m.simSeconds;const sc=m.scenario;advanceClock(m,seconds,(s,dt)=>{const loads=[{id:'essential',watts:sc.essentialW},...(extraW?[{id:'work',watts:extraW}]:[])];const r=servePower({energyWh:s.energyWh,capacityWh:sc.capacityWh,generationW:0,loads},dt);s.energyWh=r.energyWh;const missing=Math.max(0,sc.essentialW*dt/3600-(r.servedWh.essential||0));s.airReserveUnits=Math.max(0,s.airReserveUnits-missing*.5);served+=r.servedWh.work||0;return s.airReserveUnits>0;});
 if(m.airReserveUnits<=0){m.phase='suspended';m.notice='Game paused: the air ran too low.';}
 return {workFraction:extraW&&seconds?frac(served/(extraW*seconds/3600)):seconds?frac((m.simSeconds-start)/seconds):1,elapsedFraction:seconds?frac((m.simSeconds-start)/seconds):1,servedWh:served};
}
export function applyAction(m,{id,targetId,payload}={}){
 const no=message=>({ok:false,message}),yes=message=>({ok:true,message});
 if(id==='begin'&&m.phase==='brief'){m.phase='active';recordDecision(m,id);return yes('The dust came in on our gear. The Moon has no wind!');}
 if(m.phase!=='active')return no('Start the game, or play again.');if(m.paused)return no('Unpause the game first.');
 const item=m.items.find(i=>i.id===targetId);
 if(id==='stageItem'){if(!item||item.location!=='dirty'||m.outerDoor!=='open'||m.innerDoor!=='closed')return no('Bring dusty things in while the inside door is shut.');item.location='staged';recordDecision(m,id,{item:item.id});return yes(`${item.id} staged in the dirty zone.`);}
 if(id==='quarantineItem'){if(!item||!['dirty','staged'].includes(item.location)||item.id==='boots')return no('Only extra things can be left outside.');item.location='quarantine';recordDecision(m,id,{item:item.id});return yes(`${item.id} stays outside for later.`);}
 if(id==='closeRack'){const panel=m.items.find(i=>i.id==='panel');if(panel.location!=='staged'||m.rackClosed)return no('Put the panel in before you close the cleaner.');m.rackClosed=true;recordDecision(m,id);return yes('The panel is in the cleaner.');}
 if(id==='startRack'){
  const panel=m.items.find(i=>i.id==='panel');if(!m.rackClosed||panel.location!=='staged'||panel.dust<=m.scenario.cleanThreshold)return no('Put the dusty panel in and close the cleaner first.');
  const work=advanceMission(m,m.scenario.rackSeconds,m.scenario.rackW);if(!work)return no('It cannot start yet.');m.rackPoweredSeconds+=m.scenario.rackSeconds*work.workFraction;panel.dust=Math.max(0,panel.dust-90*work.workFraction);m.treatment='powered';recordDecision(m,id,{servedFraction:work.workFraction});return yes(panel.dust<=m.scenario.cleanThreshold?'The panel is clean!':'Not enough power. The panel is still dusty.');
 }
 if(id==='manualCleanItem'){
  if(!item||item.location!=='staged'||item.dust<=m.scenario.cleanThreshold)return no('Bring in a dusty thing first.');const filterCost=item.id==='panel'?15:5;if(m.filterRemaining<filterCost)return no('The dust filter is full. Change it first.');
  const seconds=item.id==='panel'?m.scenario.manualPanelSeconds:m.scenario.manualOtherSeconds;const work=advanceMission(m,seconds);if(!work)return no('It could not start.');m.filterRemaining-=filterCost*work.elapsedFraction;item.dust=Math.max(0,item.dust-90*work.elapsedFraction);m.treatment=item.id==='panel'?'manual':m.treatment;recordDecision(m,id,{item:item.id,filterCost:filterCost*work.elapsedFraction});return yes(work.elapsedFraction>=.999999?`${item.id} cleaned using the enclosed manual tool.`:`Cleaning stopped early. The ${item.id} is still a bit dusty.`);
 }
 if(id==='inspectFilter'){m.filterInspected=true;return yes(`Filter condition: ${m.filterRemaining} units; spare filters: ${m.spareFilters}.`);}
 if(id==='replaceFilter'){if(!m.filterInspected||m.spareFilters<1||m.filterRemaining===100)return no('Look at the filter. Is there a spare?');m.spareFilters--;m.filterRemaining=100;recordDecision(m,id);return yes('New filter in! The old one is put away.');}
 if(id==='secureOuterDoor'){if(m.outerDoor==='closed')return no('The outside door is already shut.');if(m.innerDoor!=='closed')return no('Shut the inside door first.');m.outerDoor='closed';m.cycleComplete=false;m.boundaryVerified=false;recordDecision(m,id);return yes('The outside door is shut.');}
 if(id==='reopenOuterDoor'){if(m.innerDoor!=='closed'||m.outerDoor==='open')return no('Shut the inside door before you open the outside door.');m.outerDoor='open';m.cycleComplete=false;m.boundaryVerified=false;m.airReserveUnits=Math.max(0,m.airReserveUnits-2);recordDecision(m,id);return yes('You opened the outside door. Now you must clean the air again.');}
 if(id==='runAirlockCycle'){
  if(m.outerDoor!=='closed'||m.innerDoor!=='closed')return no('Both doors must be shut to clean the air.');if(m.cycleComplete)return no('The air is already clean.');if(!['normal','conserve'].includes(payload))return no('Pick how to clean the air.');
  const cost=payload==='normal'?20:5,seconds=payload==='normal'?m.scenario.normalCycleSeconds:m.scenario.conserveCycleSeconds,air=payload==='normal'?5:2;
  if(m.filterRemaining<cost||m.airReserveUnits<=air)return no('There is not enough filter or air for that.');const work=advanceMission(m,seconds,m.scenario.cyclePumpW);if(!work)return no('Air cleaning could not start.');m.filterRemaining-=cost;m.airReserveUnits=Math.max(0,m.airReserveUnits-air);m.deconCycles++;m.cycleComplete=work.workFraction>=.999999&&m.phase==='active';recordDecision(m,id,{mode:payload,servedFraction:work.workFraction});return yes(m.cycleComplete?'The air is clean! Now check it.':'Not enough power. The air is not clean yet.');
 }
 if(id==='verifyBoundary'){
  if(!m.cycleComplete||m.outerDoor!=='closed')return no('Shut the outside door and clean the air first.');
  if(m.items.some(i=>i.location==='dirty'||i.location==='staged'&&i.dust>m.scenario.cleanThreshold))return no('Clean every dusty thing, or leave it outside, before you go in.');
  const boots=m.items.find(i=>i.id==='boots');if(boots.location!=='staged'||boots.dust>m.scenario.cleanThreshold)return no('Clean the boots first.');m.boundaryVerified=true;recordDecision(m,id);return yes('Checked! No dust gets in.');
 }
 if(id==='openInnerDoor'){if(!m.boundaryVerified||m.outerDoor!=='closed'||m.innerDoor!=='closed')return no('Check the air, and keep the outside door shut.');m.innerDoor='open';for(const item of m.items)if(item.location==='staged')item.location='cabin';m.phase='debrief';recordDecision(m,id);return yes('The crew is inside. Some things stayed outside.');}
 return no('Unknown action.');
}
export function getObjective(m){if(m.phase==='brief')return 'See how you kept dust out';if(m.phase==='suspended')return 'Game stopped. Try again from a safe spot.';if(m.phase==='debrief')return 'See how you kept dust out';if(!m.items.some(i=>i.location==='staged'))return 'Bring in the dusty things';if(m.outerDoor==='open')return 'Clean the dust off. Then shut the outside door';if(!m.cycleComplete)return 'Clean the air with both doors shut';if(!m.boundaryVerified)return 'Check that no dust is left';return 'Open the inside door and go in';}
export function getResult(m){return {outcome:m.phase==='suspended'?'suspended':m.items.some(i=>i.location==='quarantine')?'quarantined':m.treatment==='manual'?'manual-return':'clean-return',completed:m.phase==='debrief',energyWh:m.energyWh,airReserveUnits:m.airReserveUnits,filterRemaining:m.filterRemaining,spareFilters:m.spareFilters,items:m.items.map(i=>({...i})),treatment:m.treatment,deconCycles:m.deconCycles,recoveryChargeWh:m.recoveryChargeWh,sourceId:m.scenario.sourceId};}
export {serializeSnapshot,restoreSnapshot};
