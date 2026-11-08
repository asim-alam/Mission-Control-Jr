// Fictional training procedures. All speeds, margins and telemetry are authored game values.
export const ORBIT_SAVE='mission-control-jr.orbit.v1';
export const STATIONS={brief:{x:8,z:0},relay:{x:-2,z:-12},power:{x:-2,z:-4},kit:{x:-9,z:0},airlock:{x:0,z:-16},craft:{x:0,z:15}};
export function createOrbit(){return {phase:'overview',stage:0,checks:{brief:false,diagnose:false,isolate:false,repair:false,verify:false,kit:false,airlock:false,guidance:false,propulsion:false},dock:{x:1.6,y:.65,distance:34,speed:0,bumps:0},position:{x:0,z:14},guided:false,elapsed:0,descent:0,complete:false,log:[]};}
export function dockReady(d){return d.distance<=2&&Math.abs(d.x)<=.35&&Math.abs(d.y)<=.35&&Math.abs(d.speed)<=.15;}
export function stepDock(d,input,dt){
  dt=Math.min(.05,Math.max(0,dt));
  d.speed=Math.max(-.8,Math.min(2,d.speed+(input.thrust||0)*.7*dt));
  if(input.brake)d.speed=Math.sign(d.speed)*Math.max(0,Math.abs(d.speed)-1.5*dt);
  d.x=Math.max(-6,Math.min(6,d.x+(input.side||0)*.75*dt));d.y=Math.max(-4,Math.min(4,d.y+(input.lift||0)*.6*dt));
  d.distance=Math.max(1.4,Math.min(65,d.distance-d.speed*dt));
  if(d.distance<=1.4&&(Math.abs(d.speed)>.2||Math.abs(d.x)>.4||Math.abs(d.y)>.4)){d.distance=5;d.speed=-.2;d.bumps++;return 'Too fast or not lined up! Slow down and line up first.';}
  return '';
}
export function guidedDock(d){if(dockReady(d))return {brake:true};const target=Math.min(1.7,Math.max(0,(d.distance-1.6)*.5));return {thrust:d.speed<target-.035?1:0,brake:d.speed>target+.02,side:Math.abs(d.x)>.025?-Math.sign(d.x):0,lift:Math.abs(d.y)>.025?-Math.sign(d.y):0};}
const sequence=[
  ['brief','Hear the plan','Window console','Elena has a job for you. Go to the window console to hear it.','Hear Elena’s plan'],
  ['diagnose','Find what is broken on the antenna','Radio rack','Look at the screen. Find which part is broken before you touch the power.','Look at the screen'],
  ['isolate','Turn off power to the antenna motor','Power box','Keep the station power on. Turn off only the broken antenna motor.','Turn off antenna motor'],
  ['repair','Fix the antenna controller','Radio rack','The power is off, so it is safe. Pull out the controller and push it back in.','Push controller back in'],
  ['verify','Turn power on and test the radio','Power box','Turn the antenna motor back on. Then test if the base can hear us.','Power on and test'],
  ['kit','Pack your kit','Gear room','Check your space suit air. Pack the camera and ruler. Make sure both crew are ready.','Check suit and pack kit'],
  ['airlock','Check the door to the lander','Lander door','Check that the air is safe and both doors lock right before you go through.','Check air and doors'],
];
export function orbitalTask(m){
  if(m.phase==='overview')return {title:'Arrival at Mars',instruction:'Look at Mars and the space station. Then fly the spaceship!',label:'Start flying',action:'approach',stage:1};
  if(m.phase==='docking')return {title:dockReady(m.dock)?'Soft capture is ready':'Dock with the space station',instruction:'W/S forward and back · A/D left and right · R/F up and down · Space slows down. Line up the cross, get very close, and go slow. Then press E.',label:'Dock · E',action:'dock',stage:1};
  if(m.phase==='station'){
    const row=sequence.find(([id])=>!m.checks[id]);
    if(row){const [id,title,place,instruction,label]=row;return {id,title,place,instruction,label,action:id,stage:id==='kit'||id==='airlock'?3:2,target:STATIONS[{diagnose:'relay',repair:'relay',isolate:'power',verify:'power'}[id]||id]};}
    return {title:'Get in the lander',instruction:'Go back to the docking door. Get in the lander and do the last checks.',label:'Get in · E',action:'board',target:STATIONS.craft,stage:3};
  }
  if(m.phase==='craft'){if(!m.checks.guidance)return {title:'Check the landing path',instruction:'Check the computer knows the way down. We are landing at Meridian base.',label:'Check landing path',action:'guidance',stage:3};if(!m.checks.propulsion)return {title:'Check fuel and seat belts',instruction:'Check there is enough fuel, the engine is ready, and everyone is buckled in.',label:'Check fuel and belts',action:'propulsion',stage:3};return {title:'Land on Mars!',instruction:'Everything is ready. Start the landing. You can pause or skip the movie.',label:'Start landing',action:'descent',stage:4};}
  if(m.phase==='descent')return {title:'Landing on Mars…',instruction:'Slow down, fly through the air, fire the rockets, touch down! The game makes it faster than real life.',stage:4};
  return {title:'You landed on Mars!',instruction:'The lander is safe at Meridian base. Next comes the dust storm.',stage:5};
}
export function actOrbit(m,action,choice){
  const no=message=>({ok:false,message});
  if(m.complete)return no('You landed! Go on to the base, or play again.');
  if(action==='approach'&&m.phase==='overview'){m.phase='docking';return {ok:true,message:'Approach clearance received. Keep closure speed low.'};}
  if(action==='dock'){if(m.phase!=='docking'||!dockReady(m.dock))return no('Dock not ready: check range, both offsets and closure speed.');m.phase='station';m.position={x:0,z:14};m.log.push('Dock sealed; pressure equalized.');return {ok:true,message:'Dock secure. Transfer complete. Follow the marker to Elena’s briefing.'};}
  const task=orbitalTask(m);if(action!==task.action)return no('Finish the job you are on first.');
  if(m.phase==='station'){
    if(Math.hypot(m.position.x-task.target.x,m.position.z-task.target.z)>2.5)return no('Walk to the glowing machine.');
    if(action==='diagnose'&&choice!=='pointing')return no('Station power is fine. The antenna motor is the broken part. Turn off only that.');
    if(action==='isolate'&&choice!=='antenna')return no('Keep the air machines on! Only turn off the broken antenna motor.');
    if(action==='board')m.phase='craft';else m.checks[action]=true;
  }else if(m.phase==='craft'){
    if(action==='descent'){m.phase='descent';m.descent=0;}else m.checks[action]=true;
  }else return no('You cannot do that right now.');
  m.log.push(task.title);return {ok:true,message:({diagnose:'Found it! The antenna motor is broken. The radio keeps cutting out.',isolate:'Antenna motor is off. Station power is still on.',repair:'Controller pushed back in. Now turn it on and test.',verify:'It works! The base can hear us again.',kit:'Suit air is good. Camera and ruler are packed. Crew ready.',airlock:'The air is safe and the doors lock. You can go through.',guidance:'Landing path checked. The computer knows the way.',propulsion:'Enough fuel. Everyone is buckled in.'})[action]||'Job done!'};
}
export function advanceOrbit(m,dt){if(!Number.isFinite(dt)||dt<=0)return;m.elapsed+=dt;if(m.phase==='descent'){m.descent+=dt;if(m.descent>=16){m.phase='complete';m.complete=true;m.log.push('Touchdown confirmed at Outpost Meridian.');}}}
export function saveOrbit(m,storage){try{storage.setItem(ORBIT_SAVE,JSON.stringify({version:1,phase:m.phase,checks:m.checks,dock:m.dock,guided:m.guided,log:m.log,complete:m.complete,elapsed:m.elapsed}));return true;}catch{return false;}}
export function restoreOrbit(storage){try{const saved=JSON.parse(storage.getItem(ORBIT_SAVE)||'null');if(saved?.version!==1||!['station','craft','complete'].includes(saved.phase))return null;const m=createOrbit();if(!saved.checks||Object.keys(m.checks).some(id=>typeof saved.checks[id]!=='boolean'))return null;const order=Object.keys(m.checks),firstMissing=order.findIndex(id=>!saved.checks[id]);if(firstMissing>=0&&order.slice(firstMissing).some(id=>saved.checks[id]))return null;if(saved.phase==='craft'&&order.slice(0,7).some(id=>!saved.checks[id]))return null;if(saved.phase==='complete'&&!order.every(id=>saved.checks[id]))return null;m.checks={...saved.checks};m.phase=saved.phase;m.complete=saved.phase==='complete';m.guided=!!saved.guided;m.log=Array.isArray(saved.log)?saved.log.filter(x=>typeof x==='string').slice(-30):[];m.elapsed=Number.isFinite(saved.elapsed)?Math.max(0,saved.elapsed):0;return m;}catch{return null;}}
