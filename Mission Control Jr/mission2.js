import {HOME,RIDGE,HAZARD,ROUTES,distance,returnForecast,surfaceAt} from './expedition-terrain.js';
import {createRoverState} from './rover-controller.js';
import {createMessage,updateMessage} from './simulation/messages.js';
export const SAVE_KEY='mission-control-jr.episodes.v1';
export const SERVICE={spare:{x:-4,z:8.1},battery:{x:10,z:13},wheels:{x:12.5,z:10},camera:{x:10,z:7},comms:{x:5,z:9}};
export function reportStations(m){const p=ROUTES[m.route||'wash'].points;return m.route==='wash'?[p[2],p[3]]:[p[1],p[2]];}
export function inspectionPoint(m){return m.route==='rim'?{x:59,z:-132}:m.route==='direct'?{x:25,z:-105}:{x:7,z:-134};}
export const TRAVERSE_QUESTION='Do the layered rocks at Kestrel Ridge justify a longer expedition?';
export function createExpedition(){return {phase:'briefing',started:false,briefAccepted:false,spareCollected:false,walker:{x:6,z:12},reports:[false,false],detour:false,dataTransferred:false,earthStatus:null,earthFieldReport:null,checks:{battery:false,wheels:false,camera:false,comms:false,brakes:false},pinFound:false,cameraFound:false,route:null,reason:false,driving:false,aboard:false,brakeStart:0,brakeTurn:0,brakeMoved:false,vehicle:createRoverState(),battery:100,oxygen:100,returnReserve:20,elapsed:0,hazard:false,reported:false,photos:{context:false,close:false},frames:{},observation:false,sample:false,scienceComplete:false,returned:false,ended:false,outcome:null,assisted:false,checkpoint:null,eco:false,drivingSeconds:0,overspeed:0,collisions:0,slipSeconds:0,marginReviewed:false,optionalReviewed:false,trail:[],events:[],waypoint:0,overspeedAge:0};}
function earthPacket(id,time,payload){const packet=createMessage({id,createdAt:time,outboundSeconds:720,processingSeconds:0,inboundSeconds:0,payload});updateMessage(packet,time,true);return packet;}
function updateEarthPackets(m){for(const packet of [m.earthStatus,m.earthFieldReport])if(packet)updateMessage(packet,m.elapsed,true);}
export function applyStormCarry(m,carry){if(carry?.stormOutcome==='survived'||carry?.stormOutcome==='evacuated'){m.campaignOutcome=carry.stormOutcome;m.battery=carry.stormOutcome==='survived'?88:84;m.returnReserve=24;}return m;}
export function event(m,type,text){m.events.push({type,text,time:m.elapsed,x:m.vehicle.x,z:m.vehicle.z,battery:m.battery,oxygen:m.oxygen});if(m.events.length>300)m.events.shift();}
export function checkpoint(m){if(!m.vehicle.parking||Math.abs(m.vehicle.speed)>.05||surfaceAt(m.vehicle.x,m.vehicle.z)==='loose')return;const {checkpoint:old,...data}=m;m.checkpoint=JSON.parse(JSON.stringify(data));}
export function retry(m){if(!m.checkpoint)return null;const next=JSON.parse(JSON.stringify(m.checkpoint));next.assisted=true;next.ended=false;next.outcome=null;next.vehicle.speed=0;next.vehicle.parking=true;next.checkpoint=JSON.parse(JSON.stringify(m.checkpoint));event(next,'retry','Checkpoint practice restored the simulation, including its recorded reserves.');return next;}
export function forecast(m,seconds=0,charge=0){return returnForecast(m.vehicle,m.battery,m.oxygen,seconds,charge,m.eco);}
export function task2(m){
  const task=(stage,title,instruction,action,label,target=null,radius=3)=>({stage,title,instruction,action,label,target,radius});
  if(m.ended)return task(8,'Expedition debrief','Review the route, evidence and decisions.');
  if(m.phase==='briefing')return task(1,'Receive Elena’s briefing','Review the purpose, roles and safe-return rule.','briefing','Open mission briefing',SERVICE.comms);
  if(m.phase==='prep'){
    if(!m.spareCollected)return task(2,'Collect the charged spare','Walk to the R2 supply rack. The habitat keeps its backup.','spare','Collect spare R2',SERVICE.spare);
    for(const id of ['battery','wheels','camera','comms'])if(!m.checks[id])return task(2,{battery:'Fit R2 to Rover Two',wheels:m.pinFound?'Secure the loose retaining pin':'Inspect the wheel assembly',camera:m.cameraFound?'Clean the dusty lens':'Inspect the mast camera',comms:'Check suits, kit and local radio'}[id],'Approach the highlighted service station on foot. Inspect, correct, then verify.','check',id==='battery'?'Fit and latch R2':id==='wheels'?(m.pinFound?'Secure retaining pin':'Inspect wheel assembly'):id==='camera'?(m.cameraFound?'Clean and verify lens':'Inspect mast camera'):'Confirm kit, suits & radio',SERVICE[id]);
    if(!m.checks.brakes)return task(2,'Take the controls for clearance','Board Rover Two. Amara rides beside you.','board','Drive Rover Two · board (E)',m.vehicle,5);
    return task(3,'Plan the traverse','Board and compare terrain, distance and return reserves.','plan','Compare routes',m.vehicle,5);
  }
  if(m.phase==='test')return task(2,'Demonstrate steering and stopping',`Release P. Drive 5 m and steer, then hold Space and set P. Progress: ${Math.min(5,m.vehicle.distance-m.brakeStart).toFixed(1)} / 5 m.`, 'brakeTest','Verify steering & stop test',HOME,28);
  if(m.phase==='planning')return task(3,'Compare routes and protect the return','Select a corridor and explain your decision.','plan','Open route plan');
  if(m.phase==='outbound'){
    const i=m.reports.findIndex(done=>!done);if(i>=0)return task(4,`Report ${i+1} / 2 · ${i===0?'navigation fix':'ground and reserve check'}`,'Follow your corridor to the marked station. Stop, set P, then transmit your observations.','report',`Transmit station ${i+1} report`,reportStations(m)[i],13);
    if(!m.hazard)return task(5,'Inspect the unexpected ground','Stop at the observation marker outside the broken crust. Set P and inspect before choosing a response.','hazard','Inspect broken crust',inspectionPoint(m),13);
    if(!m.detour)return task(5,'Choose a response to the evidence','Broken crust is not a verified road. Compare the safe perimeter with returning now.','terrainDecision','Review terrain response',inspectionPoint(m),16);
    return task(6,'Reach the Kestrel parking apron','Use the firm perimeter waypoints. Stop outside the outcrop, set P, and begin fieldwork.','science','Park · start field science',{x:40,z:-150},13);
  }
  if(m.phase==='science'){
    if(m.aboard)return task(6,'Dismount for field science','Park and exit with E. Walk to the scale marker. Amara remains on local radio.','exit','Exit rover · E');
    if(!m.photos.context)return task(6,'Photograph both rock units','Walk to the observation marker, open the camera, then frame both units.','context','Frame context image',{x:40,z:-152},8);
    if(!m.photos.close)return task(6,'Record the contact with a scale','Include the geological boundary and the scale marker.','close','Frame contact + scale',{x:40,z:-154},6);
    if(!m.observation)return task(6,'Describe the evidence','Record what the images show without claiming water or life.','describe','Write the observation');
    if(m.sample)return task(6,'Science and fragment secured','Return to Rover Two and log the homeward route.','return','Log return route',m.vehicle,5);
    return task(6,'Protect the science and return margin','Required records are complete. Review an optional fragment or return now.','sample','Review optional sample',{x:42,z:-156},6);
  }
  if(m.phase==='postdrive')return m.dataTransferred?task(7,'Confirm the field crew','At the operations terminal, confirm Jin and Amara are safely at Meridian.','crew','Confirm both crew · debrief',SERVICE.comms):task(7,'Transfer the field record','Rover secured. Exit and walk to the operations terminal to upload observations and the drive log.','transfer','Transfer expedition record',SERVICE.comms);
  return task(7,'Bring the evidence home','Follow the surveyed wash. Stop at the Meridian ring and set P.','dock','Secure Rover Two at Meridian',HOME,13);
}
export function objective2(m){return task2(m).title;}
export function finish2(m,suspended=false){m.ended=true;m.vehicle.speed=0;m.vehicle.parking=true;m.driving=false;m.outcome=suspended?'suspended':m.battery<(m.returnReserve||20)||m.oxygen<(m.returnReserve||20)?'margin':m.scienceComplete?'success':'abort';event(m,'ending',m.outcome);}
export function act2(m,type,value){
  const no=message=>({ok:false,message});if(m.ended)return no('Review the debrief or retry a checkpoint.');
  const nearBase=distance(m.vehicle,HOME)<28,parked=m.vehicle.parking&&Math.abs(m.vehicle.speed)<.05;
  let message='',line;
  if(type==='start'){m.started=true;line='brief';message='Sol 16 · canonical prepared ending. Jin and Amara are cleared for a short qualification traverse.';}
  else if(!m.started)return no('Begin the expedition first.');
  else if(type==='acceptBrief'){if(m.phase!=='briefing')return no('The briefing is already acknowledged.');m.briefAccepted=true;m.phase='prep';message='Elena: bring home a checkable record, with both crew and a return reserve. Start at the R2 supply rack.';}
  else if(!m.briefAccepted)return no('Acknowledge Elena’s briefing before preparing the rover.');
  else if(type==='spare'){if(m.phase!=='prep'||m.aboard||distance(m.walker,SERVICE.spare)>3)return no('Approach the R2 supply rack on foot.');if(m.spareCollected)return no('R2 is already in your field kit.');m.spareCollected=true;message='Charged spare R2 collected. Carry it to the highlighted rover battery bay.';}
  else if(type==='check'){
    if(!nearBase||!['prep','test'].includes(m.phase))return no('Complete vehicle checks at Meridian.');
    if(!(value in m.checks)||value==='brakes')return no('Complete the real steering and brake test.');
    if(m.checks[value])return no('Already verified.');
    if(m.aboard||distance(m.walker,SERVICE[value])>3)return no('Dismount and approach the highlighted service station.');
    if(value==='battery'&&!m.spareCollected)return no('Collect R2 from the supply rack first.');
    if(value==='wheels'&&!m.pinFound){m.pinFound=true;return {ok:true,message:'A retaining pin is loose. Inspecting found it; secure the pin before clearance.'};}
    if(value==='camera'&&!m.cameraFound){m.cameraFound=true;return {ok:true,message:'Dust on the lens. Clean it before confirming the camera check.'};}
    m.checks[value]=true;message={battery:'Charged spare R2 connected and latched. Habitat backup stays in place.',wheels:'Retaining pin secured. Wheels and suspension clear.',camera:'Lens cleaned. Mast image clear.',comms:'Field kit secured. Both suits and local radio confirmed.'}[value];line=value==='battery'?'spare':value==='comms'?'ready':null;
  }else if(type==='board'){
    if(m.aboard)return no('Already aboard.');if(!['battery','wheels','camera','comms'].every(id=>m.checks[id]))return no('Complete the four physical readiness stations first.');
    if(Math.abs(m.vehicle.speed)>.05||!m.vehicle.parking)return no('Stop and set the parking brake.');
    m.aboard=true;m.driving=true;if(m.phase==='prep'&&!m.checks.brakes){m.phase='test';m.brakeStart=m.vehicle.distance;m.brakeTurn=m.vehicle.steeringTravel;}message='Jin at the controls. Amara aboard. P releases the parking brake; WASD drives.';
  }else if(type==='exit'){
    if(!m.aboard)return no('Already on foot.');if(Math.abs(m.vehicle.speed)>.05||!m.vehicle.parking)return no('Stop and set the parking brake before exiting.');
    m.aboard=false;m.driving=false;message='Jin dismounted. Amara remains with the parked rover on local radio.';
  }else if(type==='brakeTest'){
    if(!nearBase||m.phase!=='test')return no('Use the Meridian test apron.');
    if(m.vehicle.distance-m.brakeStart<5||m.vehicle.steeringTravel-m.brakeTurn<.6)return no('Drive at least 5 metres and steer before braking.');
    if(Math.abs(m.vehicle.speed)>.05||!m.vehicle.parking)return no('Come to a complete stop and set P, the parking brake.');
    m.checks.brakes=true;m.phase='prep';message='Actual steering and stopping test passed.';
  }else if(type==='plan'){
    if(m.phase!=='prep'||!nearBase)return no('Plan departure at Meridian after readiness is complete.');
    if(!Object.values(m.checks).every(Boolean))return no('Verify all five readiness groups first.');
    if(Math.abs(m.vehicle.speed)>.05||!m.vehicle.parking)return no('Park before opening the route plan.');m.phase='planning';message='Compare distance, surfaces, uncertainty, and projected reserves.';line='route';
  }else if(type==='launch'){
    if(m.phase!=='planning'||!ROUTES[value?.route]||value.reason!=='evidence')return no('Choose a route using terrain evidence and the return forecast. Shortest is not always lowest cost.');
    if(!nearBase||!parked)return no('Return to the Meridian apron, stop, and set P before logging departure.');
    if(!m.aboard)return no('Board the rover with Amara first.');
    if(!Object.values(m.checks).every(Boolean))return no('Readiness is incomplete.');
    m.route=value.route;m.reason=true;m.marginReviewed=true;m.phase='outbound';m.waypoint=1;m.trail=[{x:m.vehicle.x,z:m.vehicle.z}];m.earthStatus=earthPacket('departure-status',m.elapsed,'Departure status');checkpoint(m);message='Departure report logged. Drive the selected corridor; change course if the evidence changes.';line='departure';
  }else if(type==='report'){
    const i=m.reports.findIndex(done=>!done);if(m.phase!=='outbound'||i<0)return no('Both outbound station reports are already complete.');
    if(distance(m.vehicle,reportStations(m)[i])>13)return no('Reach the current report station; another checkpoint cannot substitute for it.');
    if(!m.aboard||!parked)return no('Stop, set P, and transmit from Rover Two.');
    const f=forecast(m);m.reports[i]=true;message=`Amara: station ${i+1} logged. ${surfaceAt(m.vehicle.x,m.vehicle.z)} ground; heading ${Math.round(((90-m.vehicle.heading*180/Math.PI)%360+360)%360)}°. Home forecast ${f.battery.toFixed(0)} charge / ${f.oxygen.toFixed(0)} suit units. ${i===0?'Navigation fix confirmed. Proceed to the ground check.':'Elena: visibility is falling. Inspect the pale crust before the ridge approach.'}`;checkpoint(m);
  }else if(type==='hazard'){
    if(m.phase!=='outbound'||!m.reports.every(Boolean))return no('Complete both parked route reports before the terrain assessment.');
    if(distance(m.vehicle,inspectionPoint(m))>13)return no('Approach the safe inspection marker to observe the surface.');
    if(Math.abs(m.vehicle.speed)>.08||!m.vehicle.parking)return no('Stop and set the parking brake to inspect.');
    m.hazard=true;m.reported=true;message='Amara: broken crust and fine material are visible. No load-bearing evidence. Choose a firm perimeter or return with the report.';line='hazard';checkpoint(m);
  }else if(type==='terrainDecision'){
    if(m.phase!=='outbound'||!m.hazard||!parked||distance(m.vehicle,inspectionPoint(m))>16)return no('Inspect the ground and choose a response from the parked observation station.');
    if(value!=='perimeter')return no('A short crossing is not supported by the observed broken crust. Select the surveyed perimeter or abort and return.');
    m.detour=m.route==='rim'?'east':'west';m.waypoint=0;message=`Jin: taking the ${m.detour} firm perimeter. Elena: revised route received. Continue to the Kestrel apron.`;line='detour';checkpoint(m);
  }else if(type==='science'){
    if(m.phase!=='outbound'||distance(m.vehicle,RIDGE)>23)return no('Reach the ridge parking area first.');
    if(!m.reports.every(Boolean)||!m.detour)return no('The route reports and terrain response must be complete before fieldwork.');
    if(Math.abs(m.vehicle.speed)>.05||!m.vehicle.parking)return no('Park before beginning fieldwork.');
    m.phase='science';checkpoint(m);message='Firm parking confirmed. Exit and walk to the observation point. Amara remains beside the rover.';line='ridge';
  }else if(type==='photo'){
    if(m.phase!=='science'||m.aboard)return no('Park and dismount for the field observations.');
    if(!['context','close'].includes(value))return no('Unknown camera mode.');m.photos[value]=true;message=value==='context'?'Context frame saved: both units and their boundary.':'Close view saved with a scale reference.';
  }else if(type==='describe'){
    if(m.phase!=='science'||m.aboard||!m.photos.context||!m.photos.close)return no('Record both photographs on foot before writing the observation.');
    if(value!=='evidence')return no('The images show layers and a contact. They do not establish water or life. Describe what you observed.');
    m.observation=true;m.scienceComplete=true;message='Location-linked observation complete. Both units documented; formation remains uncertain.';line='science';
  }else if(type==='sample'){
    if(m.phase!=='science'||!m.scienceComplete||m.aboard)return no('Document the context on foot before collecting.');if(m.sample)return no('The fragment is already labeled.');
    const f=forecast(m,18,1),margin=m.returnReserve||20;m.optionalReviewed=true;if(f.battery<margin||f.oxygen<margin)return no('Optional work would breach the forecast return margin. Preserve the record and return.');
    m.sample=true;m.battery-=1;m.oxygen-=1.8;m.elapsed+=18;updateEarthPackets(m);message='Loose fragment collected and linked to the recorded contact. Work cost: 18 simulated seconds.';
  }else if(type==='return'){
    if(!['outbound','science'].includes(m.phase))return no('The expedition has not departed.');
    if(Math.abs(m.vehicle.speed)>.05||!m.vehicle.parking)return no('Park before revising the return route.');
    m.optionalReviewed=true;m.phase='return';m.waypoint=1;message=m.scienceComplete?'Required observations secured. Return via the surveyed wash.':'Prudent abort logged. Return with the observations you have.';line='return';checkpoint(m);
  }else if(type==='dock'){
    if(m.phase!=='return'||distance(m.vehicle,HOME)>13)return no('Return to the marked Meridian apron.');
    if(!m.aboard||Math.abs(m.vehicle.speed)>.05||!m.vehicle.parking)return no('Both field crew must be aboard, stopped, and parked for the return count.');
    m.phase='postdrive';message='Luca: rover secured at Meridian. Dismount and transfer the expedition record at the operations terminal.';line='dock';checkpoint(m);
  }else if(type==='transfer'||type==='crew'){
    if(m.phase!=='postdrive'||m.aboard||distance(m.walker,SERVICE.comms)>3)return no('Dismount and approach the operations terminal at Meridian.');
    if(type==='transfer'){if(m.dataTransferred)return no('The expedition record is already transferred.');m.dataTransferred=true;m.earthFieldReport=earthPacket('field-record',m.elapsed,'Field record');message=`Field record transferred locally and sent toward Earth: ${Object.values(m.photos).filter(Boolean).length} images, ${m.reports.filter(Boolean).length} route reports, ${m.events.length} log entries. Confirm both crew to close the mission.`;}
    else {if(!m.dataTransferred)return no('Transfer the field record before the final crew count.');m.returned=true;finish2(m);message='Luca: Jin and Amara accounted for. Elena: evidence received. Your decisions are ready for debrief.';line=m.outcome;}
  }else return no('Unknown expedition action.');
  event(m,type,message);return {ok:true,message,line};
}
export function advance2(m,dt,telemetry,paused=false){
  if(paused||!m.started||m.ended||!['outbound','science','return'].includes(m.phase))return;
  m.elapsed+=dt;updateEarthPackets(m);m.oxygen=Math.max(0,m.oxygen-dt*.1);m.battery=Math.max(0,m.battery-dt*.012-telemetry.metres*(m.eco?.83:1)*({firm:.075,rough:.12,loose:.225}[telemetry.surface]||.075)-(telemetry.poweredSlip?dt*.18:0));
  if(telemetry.metres>0.001){m.drivingSeconds+=dt;m.drivenMetres=(m.drivenMetres||0)+telemetry.metres;const limit={firm:12,rough:8,loose:4}[telemetry.surface];if(telemetry.speed>limit){m.overspeedAge+=dt;if(m.overspeedAge>2)m.overspeed+=dt;}else m.overspeedAge=0;}
  if(telemetry.collision){m.collisions++;event(m,'collision','Vehicle clearance contact. Stop, reassess, and reverse into clear ground.');}
  if(telemetry.poweredSlip)m.slipSeconds+=dt;
  if(!m.trail.length||distance(m.vehicle,m.trail.at(-1))>3)m.trail.push({x:m.vehicle.x,z:m.vehicle.z});
  if(m.trail.length>1800)m.trail.shift();
  if(m.battery<=0||m.oxygen<=0||m.vehicle.sink>=.95)finish2(m,true);
}
export function assessment2(m){
  const navigation=m.drivingSeconds>0?(Math.max(0,10-m.collisions*2)+10*(1-Math.min(1,m.overspeed/m.drivingSeconds)))*Math.min(1,(m.drivenMetres||0)/100):0;
  const margin=m.returnReserve||20,parts=[['Readiness',Object.values(m.checks).filter(Boolean).length*4,20],['Plan & adapt',(m.reason?5:0)+(m.marginReviewed?5:0)+(m.hazard?5:0),15],['Safe navigation',navigation,20],['Reserves',(m.optionalReviewed?5:0)+(m.returned&&m.battery>=margin?5:0)+(m.returned&&m.oxygen>=margin?5:0),15],['Science',(m.photos.context?5:0)+(m.photos.close?5:0)+(m.observation?5:0),15],['Communication',(m.route?2:0)+(m.reported?2:0)+(m.returned?1:0),5],['Safe return',m.returned?10:0,10]];
  return {parts,total:Math.round(parts.reduce((s,p)=>s+p[1],0))};
}
