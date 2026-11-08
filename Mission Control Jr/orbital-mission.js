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
  if(d.distance<=1.4&&(Math.abs(d.speed)>.2||Math.abs(d.x)>.4||Math.abs(d.y)>.4)){d.distance=5;d.speed=-.2;d.bumps++;return 'Approach rejected. Brake and align before soft capture.';}
  return '';
}
export function guidedDock(d){if(dockReady(d))return {brake:true};const target=Math.min(1.7,Math.max(0,(d.distance-1.6)*.5));return {thrust:d.speed<target-.035?1:0,brake:d.speed>target+.02,side:Math.abs(d.x)>.025?-Math.sign(d.x):0,lift:Math.abs(d.y)>.025?-Math.sign(d.y):0};}
const sequence=[
  ['brief','Read the surface assignment','Observation / mission control','Elena has requested a weather-node survey and a safe crew return. Read the assignment at the window console.','Read Elena’s briefing'],
  ['diagnose','Diagnose the relay fault','Communications rack','Compare bus voltage, pointing-drive current and signal. Identify the failed circuit before touching the power controls.','Inspect relay telemetry'],
  ['isolate','Isolate the pointing-drive branch','Power distribution','Keep habitat power online. Isolate only the faulty antenna drive and verify zero current.','Isolate antenna branch'],
  ['repair','Restore the relay controller','Communications rack','With the drive isolated, reseat its controller cartridge. This is a simplified training repair.','Reseat controller'],
  ['verify','Power up and verify the link','Power distribution','Restore the isolated branch, run the link test and wait for Meridian’s acknowledgement.','Restore power and test'],
  ['kit','Secure the expedition kit','Crew / equipment module','Check suit reserve, secure camera and scale marker, and account for the two-person surface team.','Verify suit and science kit'],
  ['airlock','Verify the transfer vestibule','Transfer / pressure systems','Check the pressure readouts and inner/outer hatch interlock before entering the lander transfer route.','Run pressure and interlock check'],
];
export function orbitalTask(m){
  if(m.phase==='overview')return {title:'Arrival at Mars',instruction:'Explore Mars and Asteria, then take the spacecraft controls.',label:'Begin approach',action:'approach',stage:1};
  if(m.phase==='docking')return {title:dockReady(m.dock)?'Soft capture is ready':'Align with Asteria docking port',instruction:'W/S thrust · A/D lateral · R/F vertical · Space brake. Align both offsets within 0.35 m, close to 2 m, and brake below 0.15 m/s. E seals the dock.',label:'Seal dock · E',action:'dock',stage:1};
  if(m.phase==='station'){
    const row=sequence.find(([id])=>!m.checks[id]);
    if(row){const [id,title,place,instruction,label]=row;return {id,title,place,instruction,label,action:id,stage:id==='kit'||id==='airlock'?3:2,target:STATIONS[{diagnose:'relay',repair:'relay',isolate:'power',verify:'power'}[id]||id]};}
    return {title:'Board the Meridian lander',instruction:'Return to the docking vestibule. Board the lander and run its final descent checks.',label:'Board lander · E',action:'board',target:STATIONS.craft,stage:3};
  }
  if(m.phase==='craft'){if(!m.checks.guidance)return {title:'Verify descent guidance',instruction:'Confirm the landing corridor and that the terrain-relative navigation solution is valid. The destination is the existing Outpost Meridian.',label:'Validate landing solution',action:'guidance',stage:3};if(!m.checks.propulsion)return {title:'Verify propulsion and crew restraints',instruction:'Read back propellant reserve, engine readiness and the secured crew manifest.',label:'Run propulsion / crew check',action:'propulsion',stage:3};return {title:'Commit to the Meridian descent',instruction:'All systems verified. Begin the time-compressed arrival sequence. You can pause or skip its camera animation.',label:'Begin descent',action:'descent',stage:4};}
  if(m.phase==='descent')return {title:'Descent to Outpost Meridian',instruction:'Deorbit → entry → powered descent → touchdown. Time and distances are compressed for the prototype.',stage:4};
  return {title:'Arrival qualification complete',instruction:'The lander is secure at Meridian. Continue into the existing surface story or take the later rover expedition.',stage:5};
}
export function actOrbit(m,action,choice){
  const no=message=>({ok:false,message});
  if(m.complete)return no('Arrival is complete. Continue to the surface or restart.');
  if(action==='approach'&&m.phase==='overview'){m.phase='docking';return {ok:true,message:'Approach clearance received. Keep closure speed low.'};}
  if(action==='dock'){if(m.phase!=='docking'||!dockReady(m.dock))return no('Dock not ready: check range, both offsets and closure speed.');m.phase='station';m.position={x:0,z:14};m.log.push('Dock sealed; pressure equalized.');return {ok:true,message:'Dock secure. Transfer complete. Follow the marker to Elena’s briefing.'};}
  const task=orbitalTask(m);if(action!==task.action)return no('Complete the current procedure first.');
  if(m.phase==='station'){
    if(Math.hypot(m.position.x-task.target.x,m.position.z-task.target.z)>2.5)return no('Approach the highlighted equipment.');
    if(action==='diagnose'&&choice!=='pointing')return no('The habitat bus is stable. The high drive current and intermittent signal identify the pointing-drive branch.');
    if(action==='isolate'&&choice!=='antenna')return no('Keep life support powered. Isolate only the faulty antenna branch.');
    if(action==='board')m.phase='craft';else m.checks[action]=true;
  }else if(m.phase==='craft'){
    if(action==='descent'){m.phase='descent';m.descent=0;}else m.checks[action]=true;
  }else return no('That procedure is unavailable.');
  m.log.push(task.title);return {ok:true,message:({diagnose:'Bus 28 V. Drive current high; link intermittent. Pointing-drive branch fault identified.',isolate:'Antenna branch isolated: 0 A. Habitat bus remains online.',repair:'Controller reseated. Ready for powered verification.',verify:'Drive stable. Local relay test acknowledged by Meridian.',kit:'Suit reserve nominal. Camera, scale and crew manifest secured.',airlock:'Pressure matched. Hatch interlock passed. Transfer route ready.',guidance:'Meridian landing corridor validated. Terrain navigation ready.',propulsion:'Propellant margin verified. Crew restraints checked.'})[action]||'Procedure complete.'};
}
export function advanceOrbit(m,dt){if(!Number.isFinite(dt)||dt<=0)return;m.elapsed+=dt;if(m.phase==='descent'){m.descent+=dt;if(m.descent>=16){m.phase='complete';m.complete=true;m.log.push('Touchdown confirmed at Outpost Meridian.');}}}
export function saveOrbit(m,storage){try{storage.setItem(ORBIT_SAVE,JSON.stringify({version:1,phase:m.phase,checks:m.checks,dock:m.dock,guided:m.guided,log:m.log,complete:m.complete,elapsed:m.elapsed}));return true;}catch{return false;}}
export function restoreOrbit(storage){try{const saved=JSON.parse(storage.getItem(ORBIT_SAVE)||'null');if(saved?.version!==1||!['station','craft','complete'].includes(saved.phase))return null;const m=createOrbit();if(!saved.checks||Object.keys(m.checks).some(id=>typeof saved.checks[id]!=='boolean'))return null;const order=Object.keys(m.checks),firstMissing=order.findIndex(id=>!saved.checks[id]);if(firstMissing>=0&&order.slice(firstMissing).some(id=>saved.checks[id]))return null;if(saved.phase==='craft'&&order.slice(0,7).some(id=>!saved.checks[id]))return null;if(saved.phase==='complete'&&!order.every(id=>saved.checks[id]))return null;m.checks={...saved.checks};m.phase=saved.phase;m.complete=saved.phase==='complete';m.guided=!!saved.guided;m.log=Array.isArray(saved.log)?saved.log.filter(x=>typeof x==='string').slice(-30):[];m.elapsed=Number.isFinite(saved.elapsed)?Math.max(0,saved.elapsed):0;return m;}catch{return null;}}
