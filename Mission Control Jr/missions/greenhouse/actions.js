import {servePower} from '../../simulation/resources.js';
import {advanceCrop,harvestCrop} from '../../simulation/crops.js';
import {recordDecision} from '../../simulation/decisions.js';
import {serializeSnapshot,restoreSnapshot} from '../../simulation/replay.js';
const day=86400;
const fraction=value=>Math.max(0,Math.min(1,value));
/** Fixed quarter-hour work steps split at day/light boundaries; water and loads share the same time path. */
export function advanceMission(state,seconds){
 if(state.phase!=='active'||state.paused||!Number.isFinite(seconds)||seconds<0)return false;
 const sc=state.scenario,end=Math.min(sc.durationSeconds,state.simSeconds+seconds);
 while(state.simSeconds<end&&state.airReserveUnits>0){
  const period=Math.floor(state.simSeconds/day),within=state.simSeconds%day,lit=within<sc.lightSeconds;
  const boundary=lit?state.simSeconds+(sc.lightSeconds-within):state.simSeconds+(day-within);
  const dt=Math.min(900,end-state.simSeconds,boundary-state.simSeconds);
  const active=lit?state.trays.filter(t=>state.selectedTrays.includes(t.id)&&!t.harvested):[];
  const loads=[{id:'essential',watts:sc.essentialW},...(active.length?[{id:'pump',watts:sc.pumpW}]:[]),...active.map(t=>({id:t.id,watts:sc.lightW}))];
  const ledger=servePower({energyWh:state.energyWh,capacityWh:sc.capacityWh,generationW:lit?sc.generationW[period]:0,loads},dt);state.energyWh=ledger.energyWh;
  const essential=fraction(ledger.servedWh.essential/(sc.essentialW*dt/3600));state.airReserveUnits=Math.max(0,state.airReserveUnits-(1-essential)*dt/3600*8);
  for(const tray of active){
   const light=fraction(ledger.servedWh[tray.id]/(sc.lightW*dt/3600));const flow=tray.id==='b'&&state.isolated?0:tray.id==='b'&&state.fault&&!state.repaired?sc.faultFlowFactor:1;
   const wanted=sc.waterPerTrayKg*dt/sc.lightSeconds;const pumpFraction=fraction(ledger.servedWh.pump/(sc.pumpW*dt/3600));
   const delivered=Math.min(state.reservoirKg,wanted*flow*pumpFraction);state.reservoirKg-=delivered;state.waterDeliveredKg+=delivered;tray.waterKg+=delivered;tray.lightSeconds+=dt*light;
   const water=wanted?fraction(delivered/wanted):0;
   advanceCrop(tray,{seconds:dt,lightFraction:light,waterFraction:water,growthSeconds:sc.lightSeconds/sc.progressPerFullLightPeriod});
  }
  state.simSeconds+=dt;
  if(state.simSeconds===day){state.fault=true;state.periodsCompleted=1;state.packagedFoodPortions=Math.max(0,state.packagedFoodPortions-4);state.notice='A water pipe is blocked! Look at the water pipes.';}
  if(state.simSeconds===2*day){state.periodsCompleted=2;state.packagedFoodPortions=Math.max(0,state.packagedFoodPortions-4);state.notice='The plants grew! Check the trays and pick what is ready.';}
 }
 if(state.airReserveUnits<=0){state.phase='suspended';state.notice='Game paused: the air ran out.';}
 return true;
}
export function applyAction(state,{id,targetId,payload}={}){
 const no=message=>({ok:false,message}),yes=message=>({ok:true,message});
 if(id==='begin'&&state.phase==='brief'){state.phase='active';recordDecision(state,id);return yes('These plants have been growing for weeks.');}
 if(state.phase!=='active')return no('Start the game, or play again.');
 if(state.paused)return no('Unpause the game first.');
 if(id==='setPolicy'){
  if(!Array.isArray(payload)||new Set(payload).size!==payload.length||payload.some(x=>!['a','b'].includes(x)))return no('Pick which trays to help.');
  state.selectedTrays=[...payload];recordDecision(state,id,{trays:[...payload]});return yes(payload.length?`Lighting plan: tray ${payload.join(' and ')}.`:'Base first: the plant lights are off to save power.');
 }
 if(id==='advancePeriod'){
  if(state.simSeconds>=state.scenario.durationSeconds)return no('Both days are done.');
  const next=Math.min(state.scenario.durationSeconds,(Math.floor(state.simSeconds/day)+1)*day);
  advanceMission(state,next-state.simSeconds);recordDecision(state,id,{through:state.simSeconds});return yes('The base used power and water while time passed.');
 }
 if(id==='inspectManifold'){
  if(!state.fault)return no('The pipe is working fine.');state.faultInspected=true;return yes('The pipe is blocked. Fixing it takes time and power.');
 }
 if(id==='isolateManifold'){
  if(!state.faultInspected||state.repaired||state.isolated)return no('Look at the problem first.');state.isolated=true;recordDecision(state,id);return yes('The pipe is turned off. Now you can fix it.');
 }
 if(id==='repairReturnLine'){
  if(!state.isolated||state.repaired)return no('Turn off the pipe first.');
  if(state.energyWh<state.scenario.repairEnergyWh)return no('Not enough power to fix it.');
  if(state.simSeconds+state.scenario.repairSeconds>state.scenario.durationSeconds)return no('There is not enough time left to fix it.');
  state.energyWh-=state.scenario.repairEnergyWh;state.crewWorkSeconds+=state.scenario.repairSeconds;
  advanceMission(state,state.scenario.repairSeconds);if(state.phase!=='active')return no('The game stopped during the fix.');
  state.repaired=true;state.isolated=false;recordDecision(state,id);return yes('Fixed! Water flows to the plants again.');
 }
 if(id==='harvestTray'){
  const tray=state.trays.find(t=>t.id===targetId);if(!tray||tray.harvested||tray.progress<1)return no('This tray is not ready, or you already picked it.');
  const amount=harvestCrop(tray);state.freshSupplementPortions+=amount;recordDecision(state,id,{tray:tray.id,portions:amount});return yes(`Harvested ${amount} fresh-food supplement portions.`);
 }
 if(id==='finishCultivation'){
  if(state.periodsCompleted<2&&!payload?.early)return no('Grow for two days, or stop early.');
  state.phase='debrief';recordDecision(state,id,{early:!!payload?.early});return yes('Time to see how your plants did!');
 }
 return no('Unknown action.');
}
export function getObjective(m){if(m.phase==='brief')return 'Meet the plants';if(m.phase==='suspended')return 'Game stopped. Try again from a safe spot.';if(m.phase==='debrief')return 'See how your plants did';return m.periodsCompleted===0?'Pick which plants get light. Then let them grow.':m.periodsCompleted===1?'Fix the leaky water pipe':'Harvest the ready plants';}
export function getResult(m){return {outcome:m.phase==='suspended'?'suspended':m.periodsCompleted<2?'limited':m.freshSupplementPortions>=4?'balanced-harvest':m.freshSupplementPortions?'small-harvest':'harvest-delayed',completed:m.phase==='debrief',energyWh:m.energyWh,waterRemainingKg:m.reservoirKg,waterDeliveredKg:m.waterDeliveredKg,packagedFoodPortions:m.packagedFoodPortions,harvestedSupplement:m.freshSupplementPortions,trays:m.trays.map(t=>({...t})),faultRepaired:m.repaired,sourceIds:m.scenario.sourceIds};}
export {serializeSnapshot,restoreSnapshot};
