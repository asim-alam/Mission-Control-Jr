import {advanceClock} from '../../simulation/clock.js';
import {servePower} from '../../simulation/resources.js';
import {recordDecision} from '../../simulation/decisions.js';
import {serializeSnapshot,restoreSnapshot} from '../../simulation/replay.js';
const frac=n=>Math.max(0,Math.min(1,n));
export function advanceMission(m,seconds,extraW=0){
 if(m.phase!=='active'||m.paused||![seconds,extraW].every(Number.isFinite)||seconds<0||extraW<0)return null;
 let served=0;const start=m.simSeconds;const sc=m.scenario;advanceClock(m,seconds,(s,dt)=>{const loads=[{id:'essential',watts:sc.essentialW},...(extraW?[{id:'work',watts:extraW}]:[])];const r=servePower({energyWh:s.energyWh,capacityWh:sc.capacityWh,generationW:0,loads},dt);s.energyWh=r.energyWh;const missing=Math.max(0,sc.essentialW*dt/3600-(r.servedWh.essential||0));s.airReserveUnits=Math.max(0,s.airReserveUnits-missing*.5);served+=r.servedWh.work||0;return s.airReserveUnits>0;});
 if(m.airReserveUnits<=0){m.phase='suspended';m.notice='Training paused: the air reserve reached its limit.';}
 return {workFraction:extraW&&seconds?frac(served/(extraW*seconds/3600)):seconds?frac((m.simSeconds-start)/seconds):1,elapsedFraction:seconds?frac((m.simSeconds-start)/seconds):1,servedWh:served};
}
export function applyAction(m,{id,targetId,payload}={}){
 const no=message=>({ok:false,message}),yes=message=>({ok:true,message});
 if(id==='begin'&&m.phase==='brief'){m.phase='active';recordDecision(m,id);return yes('Dust came from earlier equipment handling, not lunar wind.');}
 if(m.phase!=='active')return no('Begin or restart the exercise.');if(m.paused)return no('Resume the exercise first.');
 const item=m.items.find(i=>i.id===targetId);
 if(id==='stageItem'){if(!item||item.location!=='dirty'||m.outerDoor!=='open'||m.innerDoor!=='closed')return no('Stage an outside item with the outer door open and inner door closed.');item.location='staged';recordDecision(m,id,{item:item.id});return yes(`${item.id} staged in the dirty zone.`);}
 if(id==='quarantineItem'){if(!item||!['dirty','staged'].includes(item.location)||item.id==='boots')return no('Only optional outside equipment can be quarantined.');item.location='quarantine';recordDecision(m,id,{item:item.id});return yes(`${item.id} stays outside for later.`);}
 if(id==='closeRack'){const panel=m.items.find(i=>i.id==='panel');if(panel.location!=='staged'||m.rackClosed)return no('Stage the panel before closing the rack.');m.rackClosed=true;recordDecision(m,id);return yes('Rigid test panel secured in the rack.');}
 if(id==='startRack'){
  const panel=m.items.find(i=>i.id==='panel');if(!m.rackClosed||panel.location!=='staged'||panel.dust<=m.scenario.cleanThreshold)return no('Stage a dusty rigid panel and close the rack first.');
  const work=advanceMission(m,m.scenario.rackSeconds,m.scenario.rackW);if(!work)return no('The cycle cannot start.');m.rackPoweredSeconds+=m.scenario.rackSeconds*work.workFraction;panel.dust=Math.max(0,panel.dust-90*work.workFraction);m.treatment='powered';recordDecision(m,id,{servedFraction:work.workFraction});return yes(panel.dust<=m.scenario.cleanThreshold?'The panel is clean enough for the modeled boundary.':'The rack lacked enough served power; the panel remains dusty.');
 }
 if(id==='manualCleanItem'){
  if(!item||item.location!=='staged'||item.dust<=m.scenario.cleanThreshold)return no('Stage a dirty item first.');const filterCost=item.id==='panel'?15:5;if(m.filterRemaining<filterCost)return no('The filter needs replacement before this work.');
  const seconds=item.id==='panel'?m.scenario.manualPanelSeconds:m.scenario.manualOtherSeconds;const work=advanceMission(m,seconds);if(!work)return no('Work could not start.');m.filterRemaining-=filterCost*work.elapsedFraction;item.dust=Math.max(0,item.dust-90*work.elapsedFraction);m.treatment=item.id==='panel'?'manual':m.treatment;recordDecision(m,id,{item:item.id,filterCost:filterCost*work.elapsedFraction});return yes(work.elapsedFraction>=.999999?`${item.id} cleaned using the enclosed manual tool.`:`Cleaning stopped early; ${item.id} remains partly dusty.`);
 }
 if(id==='inspectFilter'){m.filterInspected=true;return yes(`Filter condition: ${m.filterRemaining} units; spare filters: ${m.spareFilters}.`);}
 if(id==='replaceFilter'){if(!m.filterInspected||m.spareFilters<1||m.filterRemaining===100)return no('Inspect the filter and check for a spare.');m.spareFilters--;m.filterRemaining=100;recordDecision(m,id);return yes('Fresh cassette fitted; the used filter is stored.');}
 if(id==='secureOuterDoor'){if(m.outerDoor==='closed')return no('The outer door is already closed.');if(m.innerDoor!=='closed')return no('Close the inner door first.');m.outerDoor='closed';m.cycleComplete=false;m.boundaryVerified=false;recordDecision(m,id);return yes('Outside door secured.');}
 if(id==='reopenOuterDoor'){if(m.innerDoor!=='closed'||m.outerDoor==='open')return no('The inner door must be closed before opening outside.');m.outerDoor='open';m.cycleComplete=false;m.boundaryVerified=false;m.airReserveUnits=Math.max(0,m.airReserveUnits-2);recordDecision(m,id);return yes('Outside door reopened; the cycle must be repeated.');}
 if(id==='runAirlockCycle'){
  if(m.outerDoor!=='closed'||m.innerDoor!=='closed')return no('Both doors must be closed for the cycle.');if(m.cycleComplete)return no('This cycle is already complete.');if(!['normal','conserve'].includes(payload))return no('Choose a cycle.');
  const cost=payload==='normal'?20:5,seconds=payload==='normal'?m.scenario.normalCycleSeconds:m.scenario.conserveCycleSeconds,air=payload==='normal'?5:2;
  if(m.filterRemaining<cost||m.airReserveUnits<=air)return no('The chosen cycle needs more filter or air reserve.');const work=advanceMission(m,seconds,m.scenario.cyclePumpW);if(!work)return no('The cycle could not start.');m.filterRemaining-=cost;m.airReserveUnits=Math.max(0,m.airReserveUnits-air);m.deconCycles++;m.cycleComplete=work.workFraction>=.999999&&m.phase==='active';recordDecision(m,id,{mode:payload,servedFraction:work.workFraction});return yes(m.cycleComplete?'Airlock cycle complete; verify the clean boundary.':'The pump lacked power; the cycle is incomplete.');
 }
 if(id==='verifyBoundary'){
  if(!m.cycleComplete||m.outerDoor!=='closed')return no('Secure the outside door and complete a powered cycle first.');
  if(m.items.some(i=>i.location==='dirty'||i.location==='staged'&&i.dust>m.scenario.cleanThreshold))return no('Clean or quarantine all outside items before opening the clean side.');
  const boots=m.items.find(i=>i.id==='boots');if(boots.location!=='staged'||boots.dust>m.scenario.cleanThreshold)return no('Stage and clean the boots first.');m.boundaryVerified=true;recordDecision(m,id);return yes('The clean boundary is verified.');
 }
 if(id==='openInnerDoor'){if(!m.boundaryVerified||m.outerDoor!=='closed'||m.innerDoor!=='closed')return no('Verify the cycle and keep the outer door closed.');m.innerDoor='open';for(const item of m.items)if(item.location==='staged')item.location='cabin';m.phase='debrief';recordDecision(m,id);return yes('Crew entered; quarantined items remain outside.');}
 return no('Unknown action.');
}
export function getObjective(m){if(m.phase==='brief')return 'Review the dirty-zone procedure.';if(m.phase==='suspended')return 'Training paused: restore a safe checkpoint.';if(m.phase==='debrief')return 'Review the clean return.';if(!m.items.some(i=>i.location==='staged'))return 'Stage the dusty equipment.';if(m.outerDoor==='open')return 'Clean or quarantine equipment, then secure the outside door.';if(!m.cycleComplete)return 'Run an airlock cycle with both doors closed.';if(!m.boundaryVerified)return 'Verify the clean boundary.';return 'Open the clean-side door.';}
export function getResult(m){return {outcome:m.phase==='suspended'?'suspended':m.items.some(i=>i.location==='quarantine')?'quarantined':m.treatment==='manual'?'manual-return':'clean-return',completed:m.phase==='debrief',energyWh:m.energyWh,airReserveUnits:m.airReserveUnits,filterRemaining:m.filterRemaining,spareFilters:m.spareFilters,items:m.items.map(i=>({...i})),treatment:m.treatment,deconCycles:m.deconCycles,recoveryChargeWh:m.recoveryChargeWh,sourceId:m.scenario.sourceId};}
export {serializeSnapshot,restoreSnapshot};
