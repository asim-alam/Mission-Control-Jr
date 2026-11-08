import {advanceClock} from '../../simulation/clock.js';
import {servePower} from '../../simulation/resources.js';
import {createMessage,updateMessage} from '../../simulation/messages.js';
import {recordDecision} from '../../simulation/decisions.js';
import {serializeSnapshot,restoreSnapshot} from '../../simulation/replay.js';
export function lineVisible(aZ,aHeight,bZ,bHeight,scenario){const ridge=scenario.ridgeZ;if((aZ-ridge)*(bZ-ridge)>0||aZ===bZ)return true;const t=(ridge-aZ)/(bZ-aZ);if(t<0||t>1)return true;return aHeight+(bHeight-aHeight)*t>scenario.ridgeHeightM;}
export function localLinkAvailable(m){const sc=m.scenario;if(lineVisible(0,sc.terminalHeightM,m.positionZ,sc.terminalHeightM,sc))return true;return m.relayDeployed&&m.relayPowered&&m.relayEnergyWh>0&&m.verifiedHops.base&&m.verifiedHops.field&&lineVisible(0,sc.terminalHeightM,sc.ridgeZ,sc.relayHeightM,sc)&&lineVisible(sc.ridgeZ,sc.relayHeightM,m.positionZ,sc.terminalHeightM,sc);}
export function earthLinkAvailable(m){return localLinkAvailable(m);}
export function returnForecast(m){const sc=m.scenario,distance=Math.abs(m.positionZ-sc.positions.base),seconds=distance*sc.secondsPerMeter;return {energyWh:m.roverEnergyWh-(sc.idleW+sc.driveW)*seconds/3600,suitUnits:m.suitReserveUnits-sc.suitPerSecond*seconds,seconds};}
export function advanceMission(m,seconds,{drive=false,probe=false,targetZ=null}={}){
 if(m.phase!=='active'||m.paused||!Number.isFinite(seconds)||seconds<0)return null;
 const sc=m.scenario,startZ=m.positionZ,startTime=m.simSeconds;let probeServed=0;
 advanceClock(m,seconds,(s,dt)=>{
  const loads=[{id:'idle',watts:sc.idleW},...(drive?[{id:'drive',watts:sc.driveW}]:[]),...(probe?[{id:'probe',watts:sc.probeW}]:[])];
  const ledger=servePower({energyWh:s.roverEnergyWh,capacityWh:sc.roverCapacityWh,generationW:0,loads},dt);s.roverEnergyWh=ledger.energyWh;
  const driveFrac=drive?Math.max(0,Math.min(1,(ledger.servedWh.drive||0)/(sc.driveW*dt/3600))):1;
  if(targetZ!==null&&seconds>0){const expected=startZ+(targetZ-startZ)*Math.min(1,(s.simSeconds+dt-startTime)/seconds);s.positionZ+= (expected-s.positionZ)*driveFrac;}
  s.suitReserveUnits=Math.max(0,s.suitReserveUnits-dt*sc.suitPerSecond);
  if(probe)probeServed+=(ledger.servedWh.probe||0)/(sc.probeW/3600);
  if(s.relayPowered){s.relayEnergyWh=Math.max(0,s.relayEnergyWh-sc.relayW*dt/3600);if(s.relayEnergyWh===0)s.relayPowered=false;}
  if(s.message)updateMessage(s.message,s.simSeconds+dt,earthLinkAvailable(s));
  return s.suitReserveUnits>0&&s.roverEnergyWh>0;
 });
 if(m.suitReserveUnits<=0||m.roverEnergyWh<=0){m.phase='suspended';m.notice='Training paused at the field reserve limit.';}
 return {probeServed};
}
export function applyAction(m,{id,payload}={}){
 const no=message=>({ok:false,message}),yes=message=>({ok:true,message});
 if(id==='begin'&&m.phase==='brief'){m.phase='active';recordDecision(m,id);return yes('A ridge can block the link even though the Moon is relatively close.');}
 if(m.phase!=='active')return no('Begin or restart the exercise.');if(m.paused)return no('Resume the exercise first.');const sc=m.scenario;
 const work=(seconds,options)=>{advanceMission(m,seconds,options);return m.phase==='active';};
 if(id==='inspectRoute'){m.routeInspected=true;return yes('The near stop has direct contact; the far stop sits behind the ridge.');}
 if(id==='selectSurveyScope'){if(!m.routeInspected||!['near','far'].includes(payload)||m.position!=='base')return no('Inspect the route at base first.');m.routePlan=payload;recordDecision(m,id,{scope:payload});return yes(`${payload==='near'?'Near':'Far'} survey selected.`);}
 if(id==='loadRelayKit'){if(m.routePlan!=='far'||m.position!=='base'||m.relayLoaded)return no('Choose the far survey and load the relay at base.');if(!work(60))return no('Training paused during loading.');m.relayLoaded=true;recordDecision(m,id);return yes('Relay kit loaded.');}
 if(id==='travelTo'){
  if(!m.routePlan||!(payload in sc.positions)||payload===m.position)return no('Choose a different valid field location.');if(payload==='saddle'&&!m.relayLoaded)return no('Load the relay kit before traveling to the saddle.');if(payload==='far'&&m.routePlan!=='far')return no('Choose the far survey at base first.');
  const target=sc.positions[payload],distance=Math.abs(m.positionZ-target),seconds=distance*sc.secondsPerMeter,remainingDistance=Math.abs(target-sc.positions.base),required=(sc.idleW+sc.driveW)*(seconds+remainingDistance*sc.secondsPerMeter)/3600+sc.minimumReturnWh;
  if(m.roverEnergyWh<required||m.suitReserveUnits<sc.suitPerSecond*(seconds+remainingDistance*sc.secondsPerMeter)+sc.minimumReturnSuit)return no('The predicted return reserve is too small for that route.');
  if(!work(seconds,{drive:true,targetZ:target}))return no('Training paused during travel.');m.position=payload;m.positionZ=target;if(payload==='saddle'&&m.relayLoaded&&!m.relayDeployed)m.relayLocation='saddle';if(payload==='base')m.returned=true;recordDecision(m,id,{destination:payload,seconds});return yes(`Reached ${payload}.`);
 }
 if(id==='anchorRelay'){if(m.position!=='saddle'||m.relayLocation!=='saddle'||m.relayDeployed)return no('Bring the relay kit to the saddle first.');if(!work(180))return no('Training paused during setup.');m.relayDeployed=true;recordDecision(m,id);return yes('Relay mast anchored but not powered.');}
 if(id==='connectRelayPower'){if(!m.relayDeployed||m.position!=='saddle'||m.relayPowered||m.relayEnergyWh>0)return no('Anchor the mast before connecting its battery.');if(m.roverEnergyWh<sc.relayAllocationWh+sc.minimumReturnWh)return no('Keep enough rover energy for the return.');if(!work(30))return no('Training paused during connection.');m.roverEnergyWh-=sc.relayAllocationWh;m.relayEnergyWh=sc.relayAllocationWh;m.relayPowered=true;recordDecision(m,id);return yes('Relay battery connected; both hops still need checking.');}
 if(id==='verifyHop'){if(!m.relayDeployed||!m.relayPowered||m.position!=='saddle'||!['base','field'].includes(payload))return no('Power the relay at the saddle before checking a hop.');if(m.verifiedHops[payload])return no('That hop was already checked.');const to=payload==='base'?sc.positions.base:sc.positions.far;if(!lineVisible(sc.ridgeZ,sc.relayHeightM,to,sc.terminalHeightM,sc))return no('That hop is blocked by the modeled ridge.');if(!work(30))return no('Training paused during the check.');m.verifiedHops[payload]=true;recordDecision(m,id,{hop:payload});return yes(`${payload==='base'?'Outpost':'Field'} hop verified.`);}
 if(id==='startProbe'){if(!['near','far'].includes(m.position)||m.observations>0)return no('Park at a survey stop before taking the first reading.');const seconds=m.position==='near'?120:240,forecast=returnForecast(m);if(forecast.energyWh<sc.minimumReturnWh+5||forecast.suitUnits<sc.minimumReturnSuit+sc.suitPerSecond*seconds)return no('Keep enough reserve for the return.');const r=advanceMission(m,seconds,{probe:true});if(!r||m.phase!=='active')return no('Training paused during probe work.');m.probeProgressSeconds+=r.probeServed;if(r.probeServed<seconds-.01)return no('The probe did not receive enough power.');m.observations=m.position==='far'?2:1;recordDecision(m,id,{site:m.position,observations:m.observations});return yes(`Probe recorded ${m.observations} observation${m.observations===1?'':'s'}.`);}
 if(id==='extraObservation'){if(m.observations<1||m.extraObservation||m.message||!['near','far'].includes(m.position))return no('Complete any extra observation before sending the field packet.');const f=returnForecast(m);if(f.energyWh<sc.minimumReturnWh+10||f.suitUnits<sc.minimumReturnSuit+3.6)return no('The optional observation would breach the return reserve.');const r=advanceMission(m,180,{probe:true});if(!r||m.phase!=='active'||r.probeServed<179.99)return no('The optional observation did not complete.');m.observations++;m.extraObservation=true;recordDecision(m,id);return yes('An additional observation was recorded at the cost of time and reserve.');}
 if(id==='sendPacket'){if(m.observations<1||m.message)return no('Collect a record first; only one packet is needed.');m.message=createMessage({id:'lunar-field-record',createdAt:m.simSeconds,outboundSeconds:sc.oneWaySeconds,processingSeconds:0,inboundSeconds:0,payload:{observations:m.observations}});updateMessage(m.message,m.simSeconds,earthLinkAvailable(m));recordDecision(m,id,{observations:m.observations});return yes(m.message.status==='queued'?'Ridge blocks the link; the packet is queued.':'The record has begun its journey to Earth.');}
 if(id==='wait'){if(!Number.isFinite(payload)||payload<=0||payload>600)return no('Choose a valid wait.');if(!work(payload))return no('Training paused while waiting.');recordDecision(m,id,{seconds:payload});return yes('Time advanced; the packet and reserves were updated.');}
 if(id==='shortenSurvey'){m.shortened=true;recordDecision(m,id);return yes('The crew is returning with a limited record.');}
 if(id==='confirmDelivery'){if(m.position!=='base'||!m.returned)return no('Return to base before the crew check.');if(m.observations&&!m.message)return no('Send the field record before confirming delivery.');if(m.message&&m.message.status!=='delivered')return no('The packet is still queued or traveling; wait for delivery.');m.phase='debrief';recordDecision(m,id);return yes('Crew and available field record checked.');}
 return no('Unknown action.');
}
export function getObjective(m){if(m.phase==='brief')return 'Plan the lunar survey.';if(m.phase==='suspended')return 'Training paused: review the return reserve.';if(m.phase==='debrief')return 'Review the survey and communication record.';if(!m.routeInspected)return 'Inspect the route and ridge.';if(!m.routePlan)return 'Choose near or far survey.';if(!m.observations)return 'Deploy a relay if needed and operate the probe.';if(!m.returned)return 'Send the record and bring the crew home.';return 'Confirm delivery and the crew.';}
export function getResult(m){return {outcome:m.phase==='suspended'?'suspended':m.shortened||!m.observations?'turnaround':m.routePlan==='far'&&m.relayDeployed&&m.verifiedHops.base&&m.verifiedHops.field?'relay-survey':'direct-survey',completed:m.phase==='debrief',position:m.position,routePlan:m.routePlan,observations:m.observations,roverEnergyWh:m.roverEnergyWh,suitReserveUnits:m.suitReserveUnits,carryUsed:m.carryUsed,relayEnergyWh:m.relayEnergyWh,relayDeployed:m.relayDeployed,verifiedHops:{...m.verifiedHops},message:m.message?structuredClone(m.message):null,returned:m.returned,sourceIds:m.scenario.sourceIds};}
export {serializeSnapshot,restoreSnapshot};
