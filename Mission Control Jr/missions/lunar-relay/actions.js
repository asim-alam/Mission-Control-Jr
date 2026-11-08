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
 if(m.suitReserveUnits<=0||m.roverEnergyWh<=0){m.phase='suspended';m.notice='Game paused: the battery ran too low.';}
 return {probeServed};
}
export function applyAction(m,{id,payload}={}){
 const no=message=>({ok:false,message}),yes=message=>({ok:true,message});
 if(id==='begin'&&m.phase==='brief'){m.phase='active';recordDecision(m,id);return yes('Earth is close to the Moon. But a hill can still block the radio!');}
 if(m.phase!=='active')return no('Start the game, or play again.');if(m.paused)return no('Unpause the game first.');const sc=m.scenario;
 const work=(seconds,options)=>{advanceMission(m,seconds,options);return m.phase==='active';};
 if(id==='inspectRoute'){m.routeInspected=true;return yes('The radio works at the near stop. The far stop is behind the hill.');}
 if(id==='selectSurveyScope'){if(!m.routeInspected||!['near','far'].includes(payload)||m.position!=='base')return no('Look at the map at the base first.');m.routePlan=payload;recordDecision(m,id,{scope:payload});return yes(`${payload==='near'?'Near':'Far'} survey selected.`);}
 if(id==='loadRelayKit'){if(m.routePlan!=='far'||m.position!=='base'||m.relayLoaded)return no('Pick the far stop, then load the relay at the base.');if(!work(60))return no('The game stopped while loading.');m.relayLoaded=true;recordDecision(m,id);return yes('The relay is in the rover!');}
 if(id==='travelTo'){
  if(!m.routePlan||!(payload in sc.positions)||payload===m.position)return no('Pick a different place to go.');if(payload==='saddle'&&!m.relayLoaded)return no('Load the relay before you drive to the hill top.');if(payload==='far'&&m.routePlan!=='far')return no('Pick the far stop at the base first.');
  const target=sc.positions[payload],distance=Math.abs(m.positionZ-target),seconds=distance*sc.secondsPerMeter,remainingDistance=Math.abs(target-sc.positions.base),required=(sc.idleW+sc.driveW)*(seconds+remainingDistance*sc.secondsPerMeter)/3600+sc.minimumReturnWh;
  if(m.roverEnergyWh<required||m.suitReserveUnits<sc.suitPerSecond*(seconds+remainingDistance*sc.secondsPerMeter)+sc.minimumReturnSuit)return no('Not enough battery to get home from there.');
  if(!work(seconds,{drive:true,targetZ:target}))return no('The game stopped while driving.');m.position=payload;m.positionZ=target;if(payload==='saddle'&&m.relayLoaded&&!m.relayDeployed)m.relayLocation='saddle';if(payload==='base')m.returned=true;recordDecision(m,id,{destination:payload,seconds});return yes(`Reached ${payload}.`);
 }
 if(id==='anchorRelay'){if(m.position!=='saddle'||m.relayLocation!=='saddle'||m.relayDeployed)return no('Bring the relay to the hill top first.');if(!work(180))return no('The game stopped during setup.');m.relayDeployed=true;recordDecision(m,id);return yes('The relay pole is up. Now give it power.');}
 if(id==='connectRelayPower'){if(!m.relayDeployed||m.position!=='saddle'||m.relayPowered||m.relayEnergyWh>0)return no('Put up the pole before you plug in its battery.');if(m.roverEnergyWh<sc.relayAllocationWh+sc.minimumReturnWh)return no('Keep enough battery to drive home.');if(!work(30))return no('Training paused during connection.');m.roverEnergyWh-=sc.relayAllocationWh;m.relayEnergyWh=sc.relayAllocationWh;m.relayPowered=true;recordDecision(m,id);return yes('The relay has power! Now test both hops.');}
 if(id==='verifyHop'){if(!m.relayDeployed||!m.relayPowered||m.position!=='saddle'||!['base','field'].includes(payload))return no('Give the relay power before you test it.');if(m.verifiedHops[payload])return no('You already tested that hop.');const to=payload==='base'?sc.positions.base:sc.positions.far;if(!lineVisible(sc.ridgeZ,sc.relayHeightM,to,sc.terminalHeightM,sc))return no('The hill blocks that hop.');if(!work(30))return no('The game stopped during the test.');m.verifiedHops[payload]=true;recordDecision(m,id,{hop:payload});return yes(`${payload==='base'?'Outpost':'Field'} hop verified.`);}
 if(id==='startProbe'){if(!['near','far'].includes(m.position)||m.observations>0)return no('Drive to a stop before you use the science tool.');const seconds=m.position==='near'?120:240,forecast=returnForecast(m);if(forecast.energyWh<sc.minimumReturnWh+5||forecast.suitUnits<sc.minimumReturnSuit+sc.suitPerSecond*seconds)return no('Keep enough battery to get home.');const r=advanceMission(m,seconds,{probe:true});if(!r||m.phase!=='active')return no('The game stopped during the science.');m.probeProgressSeconds+=r.probeServed;if(r.probeServed<seconds-.01)return no('The science tool did not get enough power.');m.observations=m.position==='far'?2:1;recordDecision(m,id,{site:m.position,observations:m.observations});return yes(`Science done: ${m.observations} reading${m.observations===1?'':'s'}.`);}
 if(id==='extraObservation'){if(m.observations<1||m.extraObservation||m.message||!['near','far'].includes(m.position))return no('Do any extra science before you send the message.');const f=returnForecast(m);if(f.energyWh<sc.minimumReturnWh+10||f.suitUnits<sc.minimumReturnSuit+3.6)return no('Extra science would use the battery you need to get home.');const r=advanceMission(m,180,{probe:true});if(!r||m.phase!=='active'||r.probeServed<179.99)return no('The extra science did not finish.');m.observations++;m.extraObservation=true;recordDecision(m,id);return yes('Extra science done! It used time and battery.');}
 if(id==='sendPacket'){if(m.observations<1||m.message)return no('Do the science first. You only need to send one message.');m.message=createMessage({id:'lunar-field-record',createdAt:m.simSeconds,outboundSeconds:sc.oneWaySeconds,processingSeconds:0,inboundSeconds:0,payload:{observations:m.observations}});updateMessage(m.message,m.simSeconds,earthLinkAvailable(m));recordDecision(m,id,{observations:m.observations});return yes(m.message.status==='queued'?'The hill blocks the radio. The message will wait.':'Your message is flying to Earth!');}
 if(id==='wait'){if(!Number.isFinite(payload)||payload<=0||payload>600)return no('Pick how long to wait.');if(!work(payload))return no('The game stopped while waiting.');recordDecision(m,id,{seconds:payload});return yes('Time passed. The message moved along.');}
 if(id==='shortenSurvey'){m.shortened=true;recordDecision(m,id);return yes('The crew is going home with less science. Safe choice!');}
 if(id==='confirmDelivery'){if(m.position!=='base'||!m.returned)return no('Drive back to the base first.');if(m.observations&&!m.message)return no('Send your message first.');if(m.message&&m.message.status!=='delivered')return no('The message is still on its way. Wait a little.');m.phase='debrief';recordDecision(m,id);return yes('Everyone is home, and the message arrived!');}
 return no('Unknown action.');
}
export function getObjective(m){if(m.phase==='brief')return 'Plan your Moon drive';if(m.phase==='suspended')return 'Game stopped. Try again!';if(m.phase==='debrief')return 'See how your trip went';if(!m.routeInspected)return 'Look at the map and the hill';if(!m.routePlan)return 'Pick the near stop or the far stop';if(!m.observations)return 'Set up the relay if you need it. Then do the science';if(!m.returned)return 'Send your message and drive home';return 'Check the message arrived and everyone is home';}
export function getResult(m){return {outcome:m.phase==='suspended'?'suspended':m.shortened||!m.observations?'turnaround':m.routePlan==='far'&&m.relayDeployed&&m.verifiedHops.base&&m.verifiedHops.field?'relay-survey':'direct-survey',completed:m.phase==='debrief',position:m.position,routePlan:m.routePlan,observations:m.observations,roverEnergyWh:m.roverEnergyWh,suitReserveUnits:m.suitReserveUnits,carryUsed:m.carryUsed,relayEnergyWh:m.relayEnergyWh,relayDeployed:m.relayDeployed,verifiedHops:{...m.verifiedHops},message:m.message?structuredClone(m.message):null,returned:m.returned,sourceIds:m.scenario.sourceIds};}
export {serializeSnapshot,restoreSnapshot};
