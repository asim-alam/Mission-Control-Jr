import {HOME,RIDGE,HAZARD,ROUTES,distance,returnForecast,surfaceAt} from './expedition-terrain.js';
import {createRoverState} from './rover-controller.js';
import {createMessage,updateMessage} from './simulation/messages.js';
export const SAVE_KEY='mission-control-jr.episodes.v1';
export const SERVICE={spare:{x:-4,z:8.1},battery:{x:10,z:13},wheels:{x:12.5,z:10},camera:{x:10,z:7},comms:{x:5,z:9}};
export function reportStations(m){const p=ROUTES[m.route||'wash'].points;return m.route==='wash'?[p[2],p[3]]:[p[1],p[2]];}
export function inspectionPoint(m){return m.route==='rim'?{x:59,z:-132}:m.route==='direct'?{x:25,z:-105}:{x:7,z:-134};}
export const TRAVERSE_QUESTION='Are the striped rocks at Kestrel Ridge worth a closer look?';
export function createExpedition({drainScale=1}={}){return {drainScale,phase:'briefing',started:false,briefAccepted:false,spareCollected:false,walker:{x:6,z:12},reports:[false,false],detour:false,dataTransferred:false,earthStatus:null,earthFieldReport:null,checks:{battery:false,wheels:false,camera:false,comms:false,brakes:false},pinFound:false,cameraFound:false,route:null,reason:false,driving:false,aboard:false,brakeStart:0,brakeTurn:0,brakeMoved:false,vehicle:createRoverState(),battery:100,oxygen:100,returnReserve:20,elapsed:0,hazard:false,reported:false,photos:{context:false,close:false},frames:{},observation:false,sample:false,scienceComplete:false,returned:false,ended:false,outcome:null,assisted:false,checkpoint:null,eco:false,drivingSeconds:0,overspeed:0,collisions:0,slipSeconds:0,marginReviewed:false,optionalReviewed:false,trail:[],events:[],waypoint:0,overspeedAge:0};}
function earthPacket(id,time,payload){const packet=createMessage({id,createdAt:time,outboundSeconds:720,processingSeconds:0,inboundSeconds:0,payload});updateMessage(packet,time,true);return packet;}
function updateEarthPackets(m){for(const packet of [m.earthStatus,m.earthFieldReport])if(packet)updateMessage(packet,m.elapsed,true);}
export function applyStormCarry(m,carry){if(carry?.stormOutcome==='survived'||carry?.stormOutcome==='evacuated'){m.campaignOutcome=carry.stormOutcome;m.battery=carry.stormOutcome==='survived'?88:84;m.returnReserve=24;}return m;}
export function event(m,type,text){m.events.push({type,text,time:m.elapsed,x:m.vehicle.x,z:m.vehicle.z,battery:m.battery,oxygen:m.oxygen});if(m.events.length>300)m.events.shift();}
export function checkpoint(m){if(!m.vehicle.parking||Math.abs(m.vehicle.speed)>.05||surfaceAt(m.vehicle.x,m.vehicle.z)==='loose')return;const {checkpoint:old,...data}=m;m.checkpoint=JSON.parse(JSON.stringify(data));}
export function retry(m){if(!m.checkpoint)return null;const next=JSON.parse(JSON.stringify(m.checkpoint));next.assisted=true;next.ended=false;next.outcome=null;next.vehicle.speed=0;next.vehicle.parking=true;next.checkpoint=JSON.parse(JSON.stringify(m.checkpoint));event(next,'retry','Back to your last safe spot. Your supplies are how they were then.');return next;}
export function forecast(m,seconds=0,charge=0){return returnForecast(m.vehicle,m.battery,m.oxygen,seconds,charge,m.eco,m.drainScale??1);}
export function task2(m){
  const task=(stage,title,instruction,action,label,target=null,radius=3)=>({stage,title,instruction,action,label,target,radius});
  if(m.ended)return task(8,'Mission finished!','Look back at your drive, your photos and your choices.');
  if(m.phase==='briefing')return task(1,'Listen to Elena’s plan','Find out where we are going and the big safety rule.','briefing','Hear the plan',SERVICE.comms);
  if(m.phase==='prep'){
    if(!m.spareCollected)return task(2,'Get the spare battery','Walk to the battery shelf. Take the charged spare for the rover.','spare','Take the spare battery',SERVICE.spare);
    const checks = {
      battery: ['Fit the rover battery', 'Walk to the battery bay and choose Put the battery in.', 'Put the battery in'],
      wheels: m.pinFound ? ['Fix the loose wheel pin', 'Choose Push the pin in at the wheel.', 'Push the pin in']
        : ['Check the wheels', 'Walk to the marked wheel and choose Look at the wheels.', 'Look at the wheels'],
      camera: m.cameraFound ? ['Clean the dusty camera', 'Choose Wipe the camera at the rover’s camera mast.', 'Wipe the camera']
        : ['Check the camera', 'Walk to the marked camera and choose Look at the camera.', 'Look at the camera'],
      comms: ['Check the expedition gear', 'At the base computer, choose Check suits, tools and radio.', 'Check suits, tools and radio'],
    };
    for (const [id, [title, instruction, label]] of Object.entries(checks)) {
      if (!m.checks[id]) return task(2, title, instruction, 'check', label, SERVICE[id]);
    }
    if(!m.checks.brakes)return task(2,'Get in the rover','Climb in. Amara rides next to you.','board','Get in the rover (E)',m.vehicle,5);
    return task(3,'Pick a path','Look at three paths. Which one is safest?','plan','Look at the paths',m.vehicle,5);
  }
  if (m.phase === 'test') {
    const moved = m.vehicle.distance - m.brakeStart >= 5;
    const turned = m.vehicle.steeringTravel - m.brakeTurn >= .6;
    const instruction = !m.aboard ? 'Return to the rover and press E to get back in.'
      : moved && turned && m.vehicle.parking ? 'Choose Finish the test drive.'
        : m.vehicle.parking ? 'Press P to release the parking brake.'
          : !moved ? 'Drive forward with W and turn with A or D. Travel at least 5 metres.'
            : !turned ? 'Turn with A or D while moving.'
              : Math.abs(m.vehicle.speed) >= .05 ? 'Hold Space until the rover stops.'
                : 'Press P to set the parking brake.';
    return task(2, 'Test drive: steer and stop', instruction, 'brakeTest', 'Finish the test drive', HOME, 28);
  }
  if(m.phase==='planning')return task(3,'Pick a path and say why','Choose a path. Make sure there is battery to get home.','plan','Look at the paths');
  if(m.phase==='outbound'){
    const i=m.reports.findIndex(done=>!done);if(i>=0)return task(4,`Radio stop ${i+1} of 2 · ${i===0?'where are we?':'how is the ground?'}`,'Drive to the marker. Stop, press P, then radio home.','report',`Radio home from stop ${i+1}`,reportStations(m)[i],13);
    if(!m.hazard)return task(5,'Look at the strange ground','Stop at the marker next to the cracked ground. Press P. Look before you drive on it.','hazard','Look at the cracked ground',inspectionPoint(m),13);
    if(!m.detour)return task(5,'What should we do?','Cracked ground might be soft sand. Go around it, or go home?','terrainDecision','Decide what to do',inspectionPoint(m),16);
    return task(6,'Drive to Kestrel Ridge','Follow the markers on firm ground. Park near the rocks and press P.','science','Park and start exploring',{x:40,z:-150},13);
  }
  if(m.phase==='science'){
    if(m.aboard)return task(6,'Get out and explore','Press E to climb out. Amara stays with the rover.','exit','Get out · E');
    if(!m.photos.context)return task(6,'Take a wide photo','Walk to the marker. Get the dark rock and the light rock in one picture.','context','Take the wide photo',{x:40,z:-152},8);
    if(!m.photos.close)return task(6,'Take a close photo','Show where the two rocks meet. Put the ruler in the picture too.','close','Take the close photo',{x:40,z:-154},6);
    if(!m.observation)return task(6,'Say what you see','Tell only what the photos show. No guessing!','describe','Write what you see');
    if(m.sample)return task(6,'Science done!','Walk back to the rover. Time to head home.','return','Head home',m.vehicle,5);
    return task(6,'Bonus rock or go home?','Your photos are done. Pick up a bonus rock only if there is enough battery.','sample','Think about the bonus rock',{x:42,z:-156},6);
  }
  if (m.phase === 'postdrive' && m.aboard) return task(7, 'Get out at Meridian', 'Press E or choose Get out. Then walk to the base computer.', 'exit', 'Get out · E');
  if(m.phase==='postdrive')return m.dataTransferred?task(7,'Check everyone is home','At the base computer, check that Jin and Amara are back.','crew','Everyone is home!',SERVICE.comms):task(7,'Send your photos','Get out and walk to the base computer. Send your photos and notes.','transfer','Send photos and notes',SERVICE.comms);
  if (!m.aboard) return task(7, 'Get back in the rover', 'Walk to Rover Two and press E or choose Get in the rover.', 'board', 'Get in the rover (E)', m.vehicle, 5);
  return task(7,'Drive home','Follow the safe path home. Stop in the base circle and press P.','dock','Park at the base',HOME,13);
}
export function objective2(m){return task2(m).title;}
export function finish2(m,suspended=false){m.ended=true;m.vehicle.speed=0;m.vehicle.parking=true;m.driving=false;m.outcome=suspended?'suspended':m.battery<(m.returnReserve||20)||m.oxygen<(m.returnReserve||20)?'margin':m.scienceComplete?'success':'abort';event(m,'ending',m.outcome);}
export function act2(m,type,value){
  const no=message=>({ok:false,message});if(m.ended)return no('The drive is over. Look at your results, or try again.');
  const nearBase=distance(m.vehicle,HOME)<28,parked=m.vehicle.parking&&Math.abs(m.vehicle.speed)<.05;
  let message='',line;
  if(type==='start'){m.started=true;line='brief';message='Mars day 16. The storm is over! Jin and Amara are ready for a short rover trip.';}
  else if(!m.started)return no('Start the mission first.');
  else if(type==='acceptBrief'){if(m.phase!=='briefing')return no('You already heard the plan.');m.briefAccepted=true;m.phase='prep';message='Elena: take good photos, bring everyone home, and save battery for the trip back. Start at the battery shelf.';}
  else if(!m.briefAccepted)return no('Listen to Elena’s plan first.');
  else if(type==='spare'){if(m.phase!=='prep'||m.aboard||distance(m.walker,SERVICE.spare)>3)return no('Walk to the battery shelf.');if(m.spareCollected)return no('You already have the spare battery.');m.spareCollected=true;message='Got the spare battery! Carry it to the glowing spot on the rover.';}
  else if(type==='check'){
    if(!nearBase||!['prep','test'].includes(m.phase))return no('Do the rover checks at the base.');
    if(!(value in m.checks)||value==='brakes')return no('Do the test drive to check the brakes.');
    if(m.checks[value])return no('Already checked!');
    if(m.aboard||distance(m.walker,SERVICE[value])>3)return no('Get out and walk to the glowing spot.');
    if(value==='battery'&&!m.spareCollected)return no('Get the spare battery from the shelf first.');
    if(value==='wheels'&&!m.pinFound){m.pinFound=true;return {ok:true,message:'Good looking! A wheel pin is loose. Push it back in.'};}
    if(value==='camera'&&!m.cameraFound){m.cameraFound=true;return {ok:true,message:'The camera is dusty. Wipe it clean.'};}
    m.checks[value]=true;message={battery:'Battery in and locked. The base keeps its own battery.',wheels:'Pin fixed. The wheels are ready.',camera:'Camera clean. Now it can see!',comms:'Suits, tools and radio all work.'}[value];line=value==='battery'?'spare':value==='comms'?'ready':null;
  }else if(type==='board'){
    if(m.aboard)return no('You are already in the rover.');if(!['battery','wheels','camera','comms'].every(id=>m.checks[id]))return no('Finish the four rover checks first.');
    if(Math.abs(m.vehicle.speed)>.05||!m.vehicle.parking)return no('Stop, then press P for the parking brake.');
    m.aboard=true;m.driving=true;if(m.phase==='prep'&&!m.checks.brakes){m.phase='test';m.brakeStart=m.vehicle.distance;m.brakeTurn=m.vehicle.steeringTravel;}message='You are driving! Amara is with you. Press P to let go of the brake. WASD to drive.';
  }else if(type==='exit'){
    if(!m.aboard)return no('You are already outside.');if(Math.abs(m.vehicle.speed)>.05||!m.vehicle.parking)return no('Stop and press P before you get out.');
    m.aboard=false;m.driving=false;message='You climbed out. Amara stays with the rover and talks by radio.';
  }else if(type==='brakeTest'){
    if(!nearBase||m.phase!=='test')return no('Do the test drive near the base.');
    if(m.vehicle.distance-m.brakeStart<5||m.vehicle.steeringTravel-m.brakeTurn<.6)return no('Drive 5 metres and turn a little before you stop.');
    if(Math.abs(m.vehicle.speed)>.05||!m.vehicle.parking)return no('Stop all the way, then press P.');
    m.checks.brakes=true;m.phase='prep';message='Test drive passed! Steering and brakes work.';
  }else if(type==='plan'){
    if(m.phase!=='prep'||!nearBase)return no('Finish the checks at the base, then pick a path.');
    if(!Object.values(m.checks).every(Boolean))return no('Finish all five rover checks first.');
    if(Math.abs(m.vehicle.speed)>.05||!m.vehicle.parking)return no('Park before you look at the paths.');m.phase='planning';message='Look at each path: how long, how bumpy, and how much battery it uses.';line='route';
  }else if(type==='launch'){
    if(m.phase!=='planning'||!ROUTES[value?.route]||value.reason!=='evidence')return no('Pick a path by looking at the ground and the battery. The shortest path is not always best.');
    if(!nearBase||!parked)return no('Go back near the base, stop, and press P before you leave.');
    if(!m.aboard)return no('Get in the rover with Amara first.');
    if(!Object.values(m.checks).every(Boolean))return no('Some rover checks are not done yet.');
    m.route=value.route;m.reason=true;m.marginReviewed=true;m.phase='outbound';m.waypoint=1;m.trail=[{x:m.vehicle.x,z:m.vehicle.z}];m.earthStatus=earthPacket('departure-status',m.elapsed,'Departure status');checkpoint(m);message='We are off! Follow your path. If you see something strange, you can change the plan.';line='departure';
  }else if(type==='report'){
    const i=m.reports.findIndex(done=>!done);if(m.phase!=='outbound'||i<0)return no('You already radioed from both stops.');
    if(distance(m.vehicle,reportStations(m)[i])>13)return no('Drive to the next radio stop marker.');
    if(!m.aboard||!parked)return no('Stop, press P, then radio home.');
    const f=forecast(m);m.reports[i]=true;message=`Amara: stop ${i+1} done! The ground here is ${({firm:'firm',rough:'bumpy',loose:'soft'})[surfaceAt(m.vehicle.x,m.vehicle.z)]}. If we drive home now, we arrive with ${f.battery.toFixed(0)}% battery and ${f.oxygen.toFixed(0)}% air. ${i===0?'We know where we are. On to the next stop!':'Elena: it is getting hazy. Look at the pale ground before the ridge.'}`;checkpoint(m);
  }else if(type==='hazard'){
    if(m.phase!=='outbound'||!m.reports.every(Boolean))return no('Radio home from both stops first.');
    if(distance(m.vehicle,inspectionPoint(m))>13)return no('Drive to the safe marker to look at the ground.');
    if(Math.abs(m.vehicle.speed)>.08||!m.vehicle.parking)return no('Stop and press P to look.');
    m.hazard=true;m.reported=true;message='Amara: the ground is cracked, with fine dust under it. It might be too soft. Let’s go around, or go home.';line='hazard';checkpoint(m);
  }else if(type==='terrainDecision'){
    if(m.phase!=='outbound'||!m.hazard||!parked||distance(m.vehicle,inspectionPoint(m))>16)return no('Park at the marker and look at the ground first.');
    if(value!=='perimeter')return no('The cracked ground might trap our wheels. Go around it, or go home.');
    m.detour=m.route==='rim'?'east':'west';m.waypoint=0;message=`Jin: we will go around on the ${m.detour} side, on firm ground. Elena: good thinking! Keep going to Kestrel Ridge.`;line='detour';checkpoint(m);
  }else if(type==='science'){
    if(m.phase!=='outbound'||distance(m.vehicle,RIDGE)>23)return no('Drive to the parking spot at the ridge first.');
    if(!m.reports.every(Boolean)||!m.detour)return no('Finish the radio stops and the ground check first.');
    if(Math.abs(m.vehicle.speed)>.05||!m.vehicle.parking)return no('Park before you explore.');
    m.phase='science';checkpoint(m);message='Parked on firm ground. Get out and walk to the rocks. Amara stays with the rover.';line='ridge';
  }else if(type==='photo'){
    if(m.phase!=='science'||m.aboard)return no('Park and get out to take photos.');
    if(!['context','close'].includes(value))return no('Pick wide photo or close photo.');m.photos[value]=true;message=value==='context'?'Wide photo saved! You can see both kinds of rock.':'Close photo saved, with the ruler for size.';
  }else if(type==='describe'){
    if(m.phase!=='science'||m.aboard||!m.photos.context||!m.photos.close)return no('Take both photos first.');
    if(value!=='evidence')return no('The photos show rock layers. They do not show water or life. Say only what you see.');
    m.observation=true;m.scienceComplete=true;message='Great science! You wrote down what you saw. How the rocks formed is still a mystery.';line='science';
  }else if(type==='sample'){
    if(m.phase!=='science'||!m.scienceComplete||m.aboard)return no('Take your photos before picking up rocks.');if(m.sample)return no('You already have the bonus rock.');
    const f=forecast(m,18,1),margin=m.returnReserve||20;m.optionalReviewed=true;if(f.battery<margin||f.oxygen<margin)return no('Not enough battery for the bonus rock. Your photos are enough. Let’s go home!');
    m.sample=true;m.battery-=1;m.oxygen-=1.8;m.elapsed+=18;updateEarthPackets(m);message='Bonus rock collected! It took a little time and battery.';
  }else if(type==='return'){
    if(!['outbound','science'].includes(m.phase))return no('You have not left the base yet.');
    if(Math.abs(m.vehicle.speed)>.05||!m.vehicle.parking)return no('Park before you head home.');
    m.optionalReviewed=true;m.phase='return';m.waypoint=1;message=m.scienceComplete?'Science done! Drive home on the safe path.':'Going home early is a smart choice when things look risky.';line='return';checkpoint(m);
  }else if(type==='dock'){
    if(m.phase!=='return'||distance(m.vehicle,HOME)>13)return no('Drive to the circle at the base.');
    if(!m.aboard||Math.abs(m.vehicle.speed)>.05||!m.vehicle.parking)return no('Both of you must be in the rover, stopped, with P on.');
    m.phase='postdrive';message='Luca: welcome home! Get out and send your photos from the base computer.';line='dock';checkpoint(m);
  }else if(type==='transfer'||type==='crew'){
    if(m.phase!=='postdrive'||m.aboard||distance(m.walker,SERVICE.comms)>3)return no('Get out and walk to the base computer.');
    if(type==='transfer'){if(m.dataTransferred)return no('Your photos are already sent.');m.dataTransferred=true;m.earthFieldReport=earthPacket('field-record',m.elapsed,'Field record');message=`Sent to Earth: ${Object.values(m.photos).filter(Boolean).length} photos and ${m.reports.filter(Boolean).length} radio reports. Now check that everyone is home.`;}
    else {if(!m.dataTransferred)return no('Send your photos first.');m.returned=true;finish2(m);message='Luca: Jin and Amara are both home! Elena: we got your photos. Let’s see how you did.';line=m.outcome;}
  }else return no('That does not work here.');
  event(m,type,message);return {ok:true,message,line};
}
export function advance2(m,dt,telemetry,paused=false){
  if(paused||!m.started||m.ended||!['outbound','science','return'].includes(m.phase))return;
  m.elapsed+=dt;updateEarthPackets(m);const drain=m.drainScale??1;m.oxygen=Math.max(0,m.oxygen-dt*.1*drain);m.battery=Math.max(0,m.battery-(dt*.012+telemetry.metres*(m.eco?.83:1)*({firm:.075,rough:.12,loose:.225}[telemetry.surface]||.075)+(telemetry.poweredSlip?dt*.18:0))*drain);
  if(telemetry.metres>0.001){m.drivingSeconds+=dt;m.drivenMetres=(m.drivenMetres||0)+telemetry.metres;const limit={firm:12,rough:8,loose:4}[telemetry.surface];if(telemetry.speed>limit){m.overspeedAge+=dt;if(m.overspeedAge>2)m.overspeed+=dt;}else m.overspeedAge=0;}
  if(telemetry.collision){m.collisions++;event(m,'collision','Bump! The rover hit something. Stop, look, and back up slowly.');}
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
