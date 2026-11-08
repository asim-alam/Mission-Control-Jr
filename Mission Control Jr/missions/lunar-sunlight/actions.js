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
 if(m.airReserveUnits<=0){m.phase='suspended';m.notice='Game paused: the base ran out of power.';}
 return true;
}
export function applyAction(m,{id,payload}={}){
 const no=message=>({ok:false,message}),yes=message=>({ok:true,message});
 if(id==='begin'&&m.phase==='brief'){m.phase='active';recordDecision(m,id);return yes('Your Moon mission has started!');}
 if(m.phase!=='active')return no('Start the game, or play again.');if(m.paused)return no('Unpause the game first.');
 const work=(seconds)=>{if(m.simSeconds+seconds>m.scenario.durationSeconds)return false;advanceMission(m,seconds);m.crewWorkSeconds+=seconds;return m.phase==='active';};
 if(id==='inspectPower'){if(m.powerInspected)return no('You already checked the power.');m.powerInspected=true;return yes('When the shadow comes, the battery must power the base.');}
 if(id==='compareSites'){if(!m.powerInspected)return no('Check the power first.');m.sitesCompared=true;return yes('These numbers come from NASA maps of sunny spots on the Moon.');}
 if(id==='choosePad'){if(!m.sitesCompared||!['near','ridge','reserve'].includes(payload)||m.cartAttached)return no('Look at both spots before you choose.');m.selectedPad=payload;recordDecision(m,id,{pad:payload});return yes(payload==='reserve'?'You chose to use only the battery.':`${m.scenario.pads[payload].name} selected.`);}
 if(id==='attachCart'){if(!['near','ridge'].includes(m.selectedPad)||m.cartAttached)return no('Pick a spot for the solar panel first.');if(!work(300))return no('Time ran out, or the game stopped.');m.cartAttached=true;recordDecision(m,id);return yes('The solar panel is on the cart.');}
 if(id==='transportCollector'){if(!m.cartAttached||m.collectorLocation!=='storage')return no('Put the panel on the cart first.');const pad=m.scenario.pads[m.selectedPad];if(!work(pad.transportSeconds))return no('There was not enough time to move it.');m.collectorLocation=m.selectedPad;m.cartLocation=m.selectedPad;recordDecision(m,id,{pad:m.selectedPad});return yes(`The panel is at the ${pad.name}.`);}
 if(id==='deployMast'){if(m.collectorLocation!==m.selectedPad||m.collectorLocation==='storage'||m.deployed)return no('Move the panel to its spot first.');if(!work(180))return no('Setting up the panel did not finish.');m.deployed=true;recordDecision(m,id);return yes('The panel is up! Now it needs a cable.');}
 if(id==='routeCable'){const pad=m.scenario.pads[m.collectorLocation];if(!m.deployed||m.cableRouted||!pad)return no('Set up the panel before the cable.');const length=payload===undefined?pad.routeLengthM:payload;if(!Number.isFinite(length)||length<pad.routeLengthM||length>m.scenario.cableAvailableM)return no('The cable is not long enough for that path.');if(!work(pad.cableSeconds))return no('The cable did not finish.');m.cableLengthUsed=length;m.cableRouted=true;recordDecision(m,id,{length});return yes(`Cable laid: ${pad.routeLengthM} m long.`);}
 if(id==='connectPower'){if(!m.cableRouted||m.connected)return no('Lay the cable before you plug it in.');if(!work(60))return no('Plugging in did not finish.');m.connected=true;recordDecision(m,id);return yes('Plugged in! The panel makes power when the Sun shines on it.');}
 if(id==='setLoadPolicy'){if(!['conserve','science'].includes(payload))return no('Pick a choice.');const on=payload==='science';if(on===m.scienceOn)return no('You already picked that.');m.scienceOn=on;recordDecision(m,id,{policy:payload});return yes(on?'Science is on. It uses extra power.':'Science paused to save power.');}
 if(id==='advanceInterval'){if(!Number.isFinite(payload)||payload<=0||payload>scDuration(m))return no('Pick how long to wait.');advanceMission(m,payload);recordDecision(m,id,{seconds:payload});return yes('Time passed. The sunlight and battery changed.');}
 if(id==='finishService'){if(!m.selectedPad)return no('Pick a plan first.');if(m.simSeconds<m.scenario.durationSeconds&&!payload?.early)return no('Wait until the end, or stop early.');m.phase='debrief';recordDecision(m,id,{early:!!payload?.early});return yes('Mission done!');}
 return no('Unknown action.');
}
function scDuration(m){return m.scenario.durationSeconds;}
export function getObjective(m){if(m.phase==='brief')return 'Welcome to the Moon base';if(m.phase==='suspended')return 'Game stopped. Try again!';if(m.phase==='debrief')return 'See how your plan worked';if(!m.powerInspected)return 'Check the battery and solar panel';if(!m.sitesCompared)return 'Look at where the sunlight is';if(!m.selectedPad)return 'Pick a spot for the solar panel';if(m.selectedPad!=='reserve'&&!m.connected)return 'Move the solar panel, set it up and plug it in';return 'Save energy when the shadow comes';}
export function getResult(m){return {outcome:m.phase==='suspended'?'power-limit':m.simSeconds<m.scenario.durationSeconds?'limited':m.scienceServedWh>=100?'survey-complete':'reserve-protected',completed:m.phase==='debrief',energyWh:m.energyWh,airReserveUnits:m.airReserveUnits,collectorLocation:m.collectorLocation,selectedPad:m.selectedPad,cableLengthUsed:m.cableLengthUsed,connected:m.connected,scienceServedWh:m.scienceServedWh,essentialUnservedWh:m.essentialUnservedWh,generatedWh:m.generatedWh,crewWorkSeconds:m.crewWorkSeconds,sourceId:m.scenario.sourceId};}
export {serializeSnapshot,restoreSnapshot};
