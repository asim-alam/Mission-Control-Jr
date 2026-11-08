import {advanceClock} from '../../simulation/clock.js';
import {servePower} from '../../simulation/resources.js';
import {recordDecision} from '../../simulation/decisions.js';
import {serializeSnapshot,restoreSnapshot} from '../../simulation/replay.js';
export function sunlightAt(m,time=m.simSeconds){const pad=m.scenario.pads[m.collectorLocation];return !!pad&&!(time>=pad.shadow[0]&&time<pad.shadow[1]);}
export function outputW(m,time=m.simSeconds){const pad=m.scenario.pads[m.collectorLocation];if(!pad||!m.deployed||!m.connected||!sunlightAt(m,time))return 0;return m.scenario.panelRatedW*(.8+pad.referencePatch.meanFraction/2);}
export function advanceMission(m,seconds){
 if(m.phase!=='active'||m.paused||!Number.isFinite(seconds)||seconds<0)return false;
 const sc=m.scenario;advanceClock(m,Math.min(seconds,Math.max(0,sc.durationSeconds-m.simSeconds)),(s,dt)=>{
  const generation=outputW(s),loads=[{id:'essential',watts:sc.essentialW},...(s.scienceOn?[{id:'science',watts:sc.scienceW}]:[])];
  const r=servePower({energyWh:s.energyWh,capacityWh:sc.capacityWh,generationW:generation,loads},dt);s.energyWh=r.energyWh;s.generatedWh+=generation*dt/3600;
  const unserved=Math.max(0,sc.essentialW*dt/3600-(r.servedWh.essential||0));s.essentialUnservedWh+=unserved;s.airReserveUnits=Math.max(0,s.airReserveUnits-unserved*.5);s.scienceServedWh+=r.servedWh.science||0;
  return s.airReserveUnits>0;
 });
 if(m.airReserveUnits<=0){m.phase='suspended';m.notice='Training paused because essential services lost their reserve.';}
 return true;
}
export function applyAction(m,{id,payload}={}){
 const no=message=>({ok:false,message}),yes=message=>({ok:true,message});
 if(id==='begin'&&m.phase==='brief'){m.phase='active';recordDecision(m,id);return yes('Separate lunar training at Horizon Outpost has begun.');}
 if(m.phase!=='active')return no('Begin or restart the exercise.');if(m.paused)return no('Resume the exercise first.');
 const work=(seconds)=>{if(m.simSeconds+seconds>m.scenario.durationSeconds)return false;advanceMission(m,seconds);m.crewWorkSeconds+=seconds;return m.phase==='active';};
 if(id==='inspectPower'){if(m.powerInspected)return no('The power system is already inspected.');m.powerInspected=true;return yes('The battery must supply the habitat during shadow.');}
 if(id==='compareSites'){if(!m.powerInspected)return no('Inspect power first.');m.sitesCompared=true;return yes('The reference values are long-term averages for separate lunar patches, not a short-term forecast.');}
 if(id==='choosePad'){if(!m.sitesCompared||!['near','ridge','reserve'].includes(payload)||m.cartAttached)return no('Compare sites before choosing a plan; the cart cannot be rerouted mid-transfer.');m.selectedPad=payload;recordDecision(m,id,{pad:payload});return yes(payload==='reserve'?'Stored-energy plan selected.':`${m.scenario.pads[payload].name} selected.`);}
 if(id==='attachCart'){if(!['near','ridge'].includes(m.selectedPad)||m.cartAttached)return no('Choose a collector pad first.');if(!work(300))return no('The service window ended or training was suspended.');m.cartAttached=true;recordDecision(m,id);return yes('Collector secured to the transport cart.');}
 if(id==='transportCollector'){if(!m.cartAttached||m.collectorLocation!=='storage')return no('Attach the cart before transport.');const pad=m.scenario.pads[m.selectedPad];if(!work(pad.transportSeconds))return no('The transfer could not finish within the service window.');m.collectorLocation=m.selectedPad;m.cartLocation=m.selectedPad;recordDecision(m,id,{pad:m.selectedPad});return yes(`Collector moved to ${pad.name}.`);}
 if(id==='deployMast'){if(m.collectorLocation!==m.selectedPad||m.collectorLocation==='storage'||m.deployed)return no('Move the collector to its selected pad first.');if(!work(180))return no('The deployment could not finish.');m.deployed=true;recordDecision(m,id);return yes('Collector deployed; it still needs a connected cable.');}
 if(id==='routeCable'){const pad=m.scenario.pads[m.collectorLocation];if(!m.deployed||m.cableRouted||!pad)return no('Deploy the collector before routing cable.');const length=payload===undefined?pad.routeLengthM:payload;if(!Number.isFinite(length)||length<pad.routeLengthM||length>m.scenario.cableAvailableM)return no('The chosen route must reach the pad and fit the available cable.');if(!work(pad.cableSeconds))return no('The cable work could not finish.');m.cableLengthUsed=length;m.cableRouted=true;recordDecision(m,id,{length});return yes(`Cable routed along the ${pad.routeLengthM} m path.`);}
 if(id==='connectPower'){if(!m.cableRouted||m.connected)return no('Route the cable before connecting it.');if(!work(60))return no('The connection could not finish.');m.connected=true;recordDecision(m,id);return yes('Collector connected. It supplies power only in modeled sunlight.');}
 if(id==='setLoadPolicy'){if(!['conserve','science'].includes(payload))return no('Choose a valid load policy.');const on=payload==='science';if(on===m.scienceOn)return no('That load policy is already selected.');m.scienceOn=on;recordDecision(m,id,{policy:payload});return yes(on?'Optional survey load enabled.':'Optional survey load paused.');}
 if(id==='advanceInterval'){if(!Number.isFinite(payload)||payload<=0||payload>scDuration(m))return no('Choose a valid interval.');advanceMission(m,payload);recordDecision(m,id,{seconds:payload});return yes('Time advanced: battery, sunlight and loads changed together.');}
 if(id==='finishService'){if(!m.selectedPad)return no('Choose a plan before reviewing it.');if(m.simSeconds<m.scenario.durationSeconds&&!payload?.early)return no('Complete the service window or choose an early reduced result.');m.phase='debrief';recordDecision(m,id,{early:!!payload?.early});return yes('Service exercise complete.');}
 return no('Unknown action.');
}
function scDuration(m){return m.scenario.durationSeconds;}
export function getObjective(m){if(m.phase==='brief')return 'Welcome to separate lunar training.';if(m.phase==='suspended')return 'Training paused: review energy and retry.';if(m.phase==='debrief')return 'Review the sunlight and energy plan.';if(!m.powerInspected)return 'Inspect the battery and collector.';if(!m.sitesCompared)return 'Compare the lunar reference sites.';if(!m.selectedPad)return 'Choose a collector plan.';if(m.selectedPad!=='reserve'&&!m.connected)return 'Move, deploy and connect the collector.';return 'Manage optional work through the training shadow.';}
export function getResult(m){return {outcome:m.phase==='suspended'?'power-limit':m.simSeconds<m.scenario.durationSeconds?'limited':m.scienceServedWh>=100?'survey-complete':'reserve-protected',completed:m.phase==='debrief',energyWh:m.energyWh,airReserveUnits:m.airReserveUnits,collectorLocation:m.collectorLocation,selectedPad:m.selectedPad,cableLengthUsed:m.cableLengthUsed,connected:m.connected,scienceServedWh:m.scienceServedWh,essentialUnservedWh:m.essentialUnservedWh,generatedWh:m.generatedWh,crewWorkSeconds:m.crewWorkSeconds,sourceId:m.scenario.sourceId};}
export {serializeSnapshot,restoreSnapshot};
