import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DEMO_ASSETS } from './demo-assets.js';
import { createMission, act, advance, objective, PREPARATION_SECONDS } from './mission.js';
import { Player } from './player.js';
import { MissionAudio } from './demo-audio.js';
import lines from './dialogue-lines.json';

const $=id=>document.getElementById(id);
let mission=createMission(),ready=false,selected=null,job=null,transition=null,clock=0,toastTimer,endingShown=false;
const journal=[],stations=[],mixers=[],crew=[],panels=[];
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.setSize(innerWidth,innerHeight);
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;
$('world').appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0xc89976);scene.fog=new THREE.Fog(0xb68865,45,130);
const exterior=new THREE.Group(),interior=new THREE.Group();scene.add(exterior,interior);interior.visible=false;
const camera=new THREE.PerspectiveCamera(58,innerWidth/innerHeight,.05,200);scene.add(camera);
const hemi=new THREE.HemisphereLight(0xe5edf2,0x6c4030,1.6);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffeedc,2.3);sun.position.set(18,24,12);sun.castShadow=true;
sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-22,right:22,top:22,bottom:-22});sun.shadow.bias=-.0004;scene.add(sun);
const habitatLamp=new THREE.PointLight(0x85f1d0,0,18,2);habitatLamp.position.set(0,3.6,3);exterior.add(habitatLamp);
const roomLamp=new THREE.PointLight(0xc4e8f1,35,18,1);roomLamp.position.set(0,2.4,-45);interior.add(roomLamp);
interior.add(new THREE.HemisphereLight(0xd8eaf3,0x7d9294,2));
const skyColor=new THREE.Color(0xc89976),stormColor=new THREE.Color(0x514941);
const audio=new MissionAudio((id,line)=> {
  $('radio').hidden=false;$('speaker').textContent=line.speaker;$('subtitle').textContent=line.text;
  journal.unshift({speaker:line.speaker,text:line.text});
},()=>{$('radio').hidden=true;});
const player=new Player(camera,renderer.domElement,()=>interact(),()=>togglePause(),()=>audio.effect('step'));
const loader=new GLTFLoader(),textures=new THREE.TextureLoader();
const obstacle=(x,z,w,d)=>({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});
const outsideObstacles=[obstacle(0,0,9.6,5.5),obstacle(9,-5,4.7,3.9),obstacle(5,5,1.1,1),obstacle(-1.5,4.7,.9,.8),obstacle(5.6,-.7,.6,2.5)];
for(const x of [-11,-8,-5])outsideObstacles.push(obstacle(x,4.8,2.8,1.6));
const insideObstacles=[obstacle(-3.8,-46.8,1.3,2.2),obstacle(3.8,-46.8,1.3,2.2),obstacle(-3.8,-43.8,1.3,2.2),obstacle(3.8,-43.8,1.3,2.2),obstacle(0,-47,1,.8),obstacle(2.6,-47,2.4,.75)];
player.obstacles=outsideObstacles;
const groundTexture=await textures.loadAsync(new URL('./assets/mars-ground.webp',import.meta.url).href).catch(()=>null);
if(groundTexture){groundTexture.colorSpace=THREE.SRGBColorSpace;groundTexture.wrapS=groundTexture.wrapT=THREE.RepeatWrapping;groundTexture.repeat.set(30,30);}
const ground=new THREE.Mesh(new THREE.PlaneGeometry(160,160),new THREE.MeshStandardMaterial({map:groundTexture,color:groundTexture?0xffffff:0x98604a,roughness:1}));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;exterior.add(ground);
textures.loadAsync(new URL('./assets/mars-sky.webp',import.meta.url).href).then(tex=>{tex.mapping=THREE.EquirectangularReflectionMapping;tex.colorSpace=THREE.SRGBColorSpace;scene.environment=tex;scene.environmentIntensity=.4;}).catch(()=>{});
const rocks=new THREE.MeshStandardMaterial({color:0x98604a,roughness:1});
for(let i=0;i<70;i++) {
  const a=i*2.399,r=19+(i%11)*3.1,size=.2+(i%7)*.1;
  const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(size,0),rocks);rock.position.set(Math.cos(a)*r,size*.4,Math.sin(a)*r);rock.scale.y=.55;rock.rotation.set(i*.1,i*.8,.15);rock.castShadow=true;exterior.add(rock);
  if(Math.abs(rock.position.x)<19&&Math.abs(rock.position.z)<19)outsideObstacles.push(obstacle(rock.position.x,rock.position.z,size*2,size*2));
}
const dustGeometry=new THREE.BufferGeometry(),dustPositions=new Float32Array(1800*3);
for(let i=0;i<dustPositions.length;i++)dustPositions[i]=(Math.random()-.5)*60;
dustGeometry.setAttribute('position',new THREE.BufferAttribute(dustPositions,3));
const dustMaterial=new THREE.PointsMaterial({color:0xd9ae84,size:.09,transparent:true,opacity:.02,depthWrite:false});
const dust=new THREE.Points(dustGeometry,dustMaterial);exterior.add(dust);
let airlock,rover,roverLid,batteryObject,installedBattery,toolObject,roomConsole,connectorVisuals=[];

function cloneAsset(gltf,parent,position,yaw=0,scale=1) {
  const model=gltf.scene.clone(true),materials=new Map();model.position.set(...position);model.rotation.y=yaw;model.scale.setScalar(scale);
  model.traverse(mesh=>{if(mesh.isMesh){mesh.castShadow=mesh.receiveShadow=true;if(!materials.has(mesh.material))materials.set(mesh.material,mesh.material.clone());mesh.material=materials.get(mesh.material);}});
  parent.add(model);return model;
}
function station(id,title,kind,model,point,stand,parent=exterior) {
  const marker=new THREE.Mesh(new THREE.RingGeometry(.45,.49,40),new THREE.MeshBasicMaterial({color:0x8fddc8,transparent:true,opacity:.25,side:THREE.DoubleSide,depthWrite:false}));
  marker.rotation.x=-Math.PI/2;marker.position.set(point.x,.022,point.z);parent.add(marker);
  const label=document.createElement('div');label.className='world-label';label.textContent=title;$('world-labels').appendChild(label);
  const result={id,title,kind,model,point,stand,marker,label,parent};model.userData.stationId=id;stations.push(result);return result;
}
function toast(text) {$('toast').hidden=false;$('toast').textContent=text;clearTimeout(toastTimer);toastTimer=setTimeout(()=>{$('toast').hidden=true;},4300);}
function button(label,action,disabled=false) {const b=document.createElement('button');b.textContent=label;b.disabled=disabled;b.onclick=action;return b;}
function showDialog(title,html,actions,eyebrow='MERIDIAN CONTROL') {
  player.enabled=false;player.release();audio.pause(true);$('hud').inert=true;
  $('dialog-title').textContent=title;$('dialog-body').innerHTML=html;$('dialog-eyebrow').textContent=eyebrow;
  $('dialog-actions').replaceChildren(...actions.map(a=>button(a.label,a.run)));
  $('dialog').hidden=false;$('dialog-actions').firstElementChild?.focus();
}
function closeDialog() {$('dialog').hidden=true;$('hud').inert=false;player.enabled=mission.started&&!mission.ended&&!transition;audio.pause(false);}
function togglePause() {
  if(!mission.started||mission.ended)return;
  if(!$('dialog').hidden){closeDialog();return;}
  showDialog('Take a breath.',`<p>The mission clock pauses here. Your preparations are preserved.</p>
    ${Object.entries(audio.volumes).map(([name,value])=>`<label>${name[0].toUpperCase()+name.slice(1)} volume <input aria-label="${name} volume" type="range" min="0" max="1" step="0.05" value="${value}" data-volume="${name}"></label>`).join('')}
    <label><span>Mute all audio</span><input id="master-mute" type="checkbox" ${audio.muted?'checked':''}></label>
    <label><span>Reduce motion and particles</span><input id="reduce-motion" type="checkbox" ${reducedMotion?'checked':''}></label>
    <p><strong>Controls:</strong> WASD / arrows to move, drag to look, E to interact. Navigation buttons walk you to equipment. Escape pauses; Mouse look captures the pointer.</p>`,[
    {label:'Resume mission',run:closeDialog},{label:'Restart mission',run:()=>startMission()}]);
  $('dialog-body').querySelectorAll('[data-volume]').forEach(input=>input.oninput=()=>audio.settings({[input.dataset.volume]:Number(input.value)}));
  $('master-mute').onchange=e=>audio.setMuted(e.target.checked);$('reduce-motion').onchange=e=>{reducedMotion=e.target.checked;};
}
let reducedMotion=false;
$('pause').onclick=togglePause;$('look').onclick=()=>player.capture();
$('skip-voice').onclick=()=>audio.skip();$('replay-voice').onclick=()=>audio.replay();
$('journal').onclick=()=>showDialog('Mission journal',`<p>Current objective: <strong>${objective(mission)}</strong></p>${mission.log.map(text=>`<p>• ${text}</p>`).join('')}${journal.map(entry=>`<div class="journal-entry"><b>${entry.speaker}</b><p>${entry.text}</p></div>`).join('')}`,[{label:'Return to mission',run:closeDialog}], 'EXPEDITION RECORD');
addEventListener('keydown',e=>{if(e.code==='KeyJ'&&player.enabled)$('journal').click();});

function navigateTo(s) {
  if(!player.enabled||job)return;
  selected=s;
  if(player.navigate(s.stand,s.point))toast(`Walking to ${s.title}. WASD cancels guided walking.`);
  else toast('That route is obstructed. Walk around the equipment using WASD.');
  renderNavigation();renderInteraction();
}
function renderNavigation() {
  const available=stations.filter(s=>s.parent.visible);
  $('navigation').replaceChildren(...available.map(s=>{
    const b=button(s.title,()=>navigateTo(s));b.setAttribute('aria-label',`Walk to ${s.title}`);b.classList.toggle('active',s===selected);return b;
  }));
}
const reachRay=new THREE.Raycaster();
function nearby(s) {
  if(!s||!s.parent.visible||Math.hypot(camera.position.x-s.point.x,camera.position.z-s.point.z)>3.05)return false;
  const origin=new THREE.Vector3(camera.position.x,1.15,camera.position.z),target=new THREE.Vector3(s.point.x,1.15,s.point.z),direction=target.sub(origin);
  reachRay.set(origin,direction.clone().normalize());reachRay.far=direction.length();
  const hit=reachRay.intersectObjects(s.parent.children,true).find(hit=>hit.object.isMesh);
  if(!hit)return true;
  let node=hit.object;while(node){if(node.userData.stationId)return node.userData.stationId===s.id;node=node.parent;}
  return false;
}
function perform(type,value) {
  const result=act(mission,type,value);
  if(!result.ok){toast(result.message);return;}
  if(type!=='rotate')toast(result.message);audio.effect(['seal','openBay','enter'].includes(type)?'door':type==='connect'?'repair':'beep');
  if(result.line)audio.say(result.line,['life','research','storm','shelter','prepared','survived','evacuated'].includes(result.line));
  if(type==='enter')enterShelter();
  if(type==='seal')airlock.getObjectByName('door_left').position.x=-.5;
  if(mission.ended)showEnding();
  updateVisuals();renderMission();renderInteraction();
}
function startCleaning(index) {
  if(job)return;
  if(!mission.diagnosed){toast('Read the habitat diagnostics first.');return;}
  if(mission.cleaned[index])return;
  job={station:selected,index,time:0,duration:2.5};audio.effect('brush');renderInteraction();
}
function interact() {
  if(!player.enabled||job)return;
  const s=nearby(selected)?selected:stations.filter(s=>s.parent.visible&&nearby(s)).sort((a,b)=>distance(a)-distance(b))[0]||selected;
  if(!s){toast('Approach a marked location to interact.');return;}
  selected=s;
  if(!nearby(s)){toast(`Move closer to ${s.title}, or use its navigation button.`);return;}
  if(s.id==='terminal') {
    if(!mission.diagnosed)perform('diagnose');
    else if(mission.repaired&&mission.cleaned.every(Boolean)&&!mission.allocation)chooseAllocation();
    else toast(mission.allocation?'Reserves allocated. Return to shelter.':'Restore the solar array, then repair the power junction.');
  } else if(s.id.startsWith('solar'))startCleaning(Number(s.id.slice(-1)));
  else if(s.id==='rover')perform(mission.bayOpen?'battery':'openBay');
  else if(s.id==='junction'){if(!mission.installed)perform('install');else if(!mission.repaired)toast('Set the three connectors to 1 / 2 / 3, then engage the relay.');else toast('Power bus is stable.');}
  else if(s.id==='airlock') {
    if(!mission.diagnosed)perform('enter');
    else if(!mission.repaired||!mission.allocation)showDialog('Shelter before preparation?',`<p>You can bring the crew inside now, but unfinished repairs and missing reserves will affect the outcome.</p>`,[{label:'Keep preparing',run:closeDialog},{label:'Enter emergency shelter',run:()=>{closeDialog();perform('enter');}}]);
    else perform('enter');
  } else if(['elena','amara','luca'].includes(s.id)) {
    perform('talk',s.id);
    if(!mission.responded.includes(s.id))showDialog(s.title,`<p>${lines[s.id].text}</p><p>How will you respond?</p>`,[
      {label:'We can do this together',run:()=>{closeDialog();perform('respond',{crew:s.id,choice:'encourage'});}},
      {label:'Follow the emergency procedure',run:()=>{closeDialog();perform('respond',{crew:s.id,choice:'procedure'});}}
    ],'CREW CHECK-IN');
  }
  else if(s.id==='room-console')perform(mission.sealed?'report':'seal');
  else if(s.id==='water'){audio.say('water');toast('Drinking supply and shielding for the sleep area.');}
}
const distance=s=>Math.hypot(camera.position.x-s.point.x,camera.position.z-s.point.z);
function chooseAllocation() {
  showDialog('What gets the reserve power?',`<p>The repaired battery can support oxygen reserves or keep the science systems running through the front.</p><p><strong>Life support:</strong> fill oxygen reserves and protect the crew's margin.</p><p><strong>Science systems:</strong> preserve research operations with less oxygen in reserve.</p>`,[
    {label:'Prioritize life support',run:()=>{closeDialog();perform('allocate','life');}},
    {label:'Keep science systems running',run:()=>{closeDialog();perform('allocate','research');}},
    {label:'Decide later',run:closeDialog}], 'MISSION DECISION');
}
let lastInteractionKey='';
function renderInteraction(force=false) {
  const s=selected,near=nearby(s),key=`${s?.id}|${near}|${mission.diagnosed}|${mission.cleaned}|${mission.bayOpen}|${mission.battery}|${mission.installed}|${mission.connector}|${mission.repaired}|${mission.allocation}|${mission.sealed}|${Math.floor(mission.insideAge)}|${!!job}`;
  if(!force&&key===lastInteractionKey)return;lastInteractionKey=key;
  $('interaction').hidden=!s||!mission.started||mission.ended;if(!s)return;
  $('target-kind').textContent=`${s.kind} / ${distance(s).toFixed(1)} M`;$('target-title').textContent=s.title;
  let description='',buttons=[];
  const action=(label,fn,extra=false)=>buttons.push(button(label,fn,!near||!!job||extra));
  if(s.id==='terminal') {
    description=!mission.diagnosed?'Inspect the power and oxygen fault report.':mission.allocation?'Reserve plan confirmed. The crew is ready for shelter.':'Restore the collectors and battery, then choose reserve power priorities.';
    action(!mission.diagnosed?'Run diagnostics':'Allocate reserves',interact,mission.diagnosed&&(!mission.repaired||!mission.cleaned.every(Boolean)||!!mission.allocation));
  } else if(s.id.startsWith('solar')) {
    const i=Number(s.id.slice(-1));description=mission.cleaned[i]?'Collector restored. Tracking the sun and supplying power.':'Dust coats the cells. Run the EVA brush to restore output.';
    action(mission.cleaned[i]?'Collector online':job?'Cleaning…':'Clean collector',interact,mission.cleaned[i]);
  } else if(s.id==='rover') {
    description=mission.installed||mission.battery?'Reserve battery recovered.':'A reserve battery is mounted in the rear service bay.';
    action(mission.bayOpen?'Recover battery':'Open service bay',interact,mission.battery||mission.installed);
  } else if(s.id==='junction') {
    description=!mission.installed?'Fit the rover battery, then align the relay connectors.':mission.repaired?'Stable connection. Habitat systems are online.':'Turn the connectors to 1 / 2 / 3, then engage the relay.';
    if(!mission.installed)action('Install reserve battery',interact);
    else if(!mission.repaired) {
      for(let i=0;i<3;i++)action(`Connector ${i+1}: ${mission.connector[i]}`,()=>perform('rotate',i));
      action('Engage relay',()=>perform('connect'));
    }else action('Power restored',()=>{},true);
  } else if(s.id==='airlock'){description='Enter Meridian and secure the crew. Unfinished preparations will affect your result.';action('Enter shelter',interact);}
  else if(s.id==='room-console'){description=mission.sealed?'Crew accounted for. Transmit our status once the front passes.':'Confirm all four crew and seal the airlock.';action(mission.sealed?'Transmit status':'Seal airlock',interact,mission.sealed&&mission.insideAge<5);}
  else if(s.id==='water'){description='Water reserves protect the sleeping area and supply the crew.';action('Inspect water shielding',interact);}
  else {description='Check in with the crew. Their advice can help you prepare.';action('Talk to crew',interact);}
  $('target-description').textContent=description;$('action-buttons').replaceChildren(...buttons);
  $('job-track').hidden=!job;$('action-help').textContent=!near?'Walk closer, or choose this location in navigation.':job?'Brush running. Stay near the collector.':'Press E or use the controls above.';
}
function renderMission() {
  $('objective').textContent=objective(mission);
  const time=Math.max(0,Math.ceil(PREPARATION_SECONDS-mission.elapsed));
  $('forecast').textContent=mission.inside?(mission.sealed?'Airlock secure · storm passage in progress':'Shelter reached · airlock unsealed'):mission.storm?'DUST FRONT ARRIVED · Return to shelter':`Dust front ETA ${Math.floor(time/60)}:${String(time%60).padStart(2,'0')} · mission time pauses in menus`;
  $('vitals').innerHTML=[['POWER',mission.resources.power],['OXYGEN',mission.resources.oxygen],['MORALE',mission.resources.morale]].map(([label,value])=>`<span class="${value<30?'danger':''}">${label}<b>${Math.round(value)}%</b></span>`).join('')+'<span>CREW<b>04 / 04</b></span>';
  const tasks=[['Diagnostics',mission.diagnosed],['Collectors '+mission.cleaned.filter(Boolean).length+'/3',mission.cleaned.every(Boolean)],['Reserve battery',mission.battery||mission.installed],['Power connection',mission.repaired],['Reserve allocation',!!mission.allocation],['Airlock secured',mission.sealed]];
  $('tasks').innerHTML=tasks.map(([name,done])=>`<div class="${done?'done':''}">${done?'✓':'○'} ${name}</div>`).join('');
  $('inventory').textContent=mission.battery?'INVENTORY / RESERVE BATTERY + EVA BRUSH':mission.installed?'EQUIPPED / EVA BRUSH · BATTERY INSTALLED':'EQUIPPED / EVA CLEANING BRUSH';
}
function enterShelter() {
  job=null;transition={elapsed:0};player.release();player.enabled=false;audio.effect('door');toast('Airlock cycling. Entering Meridian…');
}
function completeEntry() {
  exterior.visible=false;interior.visible=true;scene.fog.near=80;scene.fog.far=130;
  player.reset(true);player.obstacles=insideObstacles;player.bounds={minX:-3.1,maxX:3.1,minZ:-48,maxZ:-42};
  selected=stations.find(s=>s.id==='room-console');renderNavigation();
  player.navigate(selected.stand,selected.point);audio.effect('door');
}
function updateVisuals() {
  if(!ready)return;
  batteryObject.visible=mission.bayOpen&&!mission.battery&&!mission.installed;installedBattery.visible=mission.installed;
  toolObject.visible=!!job;
  panels.forEach((p,i)=>{p.dust.material.opacity=mission.cleaned[i]?0:job?.index===i?.72*(1-job.time/job.duration):.72;});
  connectorVisuals.forEach((v,i)=>{v.rotation.z=mission.connector[i]*Math.PI/2;});
  habitatLamp.intensity=mission.repaired?12:1.5;
}
function startMission() {
  if(!ready)return;closeDialog();audio.stop();audio.start();mission=createMission();act(mission,'start');
  journal.length=0;endingShown=false;job=null;transition=null;selected=null;lastInteractionKey='';alarmClock=0;brushClock=0;player.reset();player.bounds={minX:-18,maxX:18,minZ:-18,maxZ:18};player.obstacles=outsideObstacles;
  exterior.visible=true;interior.visible=false;$('landing').hidden=true;$('hud').hidden=false;
  airlock.getObjectByName('door_left').position.x=-.5;airlock.getObjectByName('door_right').position.x=.5;
  for(const c of crew){c.model.position.copy(c.base);c.model.rotation.y=0;c.station.point.x=c.base.x;c.station.point.z=c.base.z;}
  renderNavigation();renderMission();renderInteraction(true);updateVisuals();
  audio.say('intro');
  showDialog('Engineer, you have the outpost.',`<p>You are <strong>Jin Park</strong>. A dust front is approaching Meridian. Keep the four-person crew safe.</p><p>Start at the <strong>habitat diagnostic terminal</strong>, then restore solar output, recover the rover battery, and reconnect power.</p><p><strong>WASD / arrows:</strong> walk. <strong>Drag:</strong> look around. <strong>E:</strong> interact. Navigation buttons guide you to a location; you still operate the equipment yourself.</p><p>The six-minute preparation clock starts after diagnostics. It pauses in menus. You can shelter early, but your choices affect the result.</p>`,[{label:'Start EVA',run:closeDialog}], 'SOL 12 / MISSION BRIEF');
}
function showEnding() {
  if(endingShown)return;endingShown=true;job=null;toolObject.visible=false;player.release();audio.say(mission.outcome,true);
  const prepared=mission.outcome==='prepared',evacuated=mission.outcome==='evacuated';
  showDialog(prepared?'Meridian holds.':evacuated?'Emergency evacuation.':'Everyone made it. Barely.',
    `<p>${prepared?'All four astronauts are safe. Your repairs and life-support reserves protected the outpost.':evacuated?'The crew activates the emergency evacuation plan. Unsecured life support makes Meridian unsafe.':'All four astronauts reached shelter, but incomplete preparation or reduced oxygen reserves left little margin.'}</p>
    <div class="report-row"><span>Solar collectors</span><b>${mission.cleaned.filter(Boolean).length} / 3 restored</b></div>
    <div class="report-row"><span>Battery and relay</span><b>${mission.repaired?'Stable':'Incomplete'}</b></div>
    <div class="report-row"><span>Reserve priority</span><b>${mission.allocation==='life'?'Life support':mission.allocation==='research'?'Science systems':'Unallocated'}</b></div>
    <div class="report-row"><span>Airlock</span><b>${mission.sealed?'Sealed':'Unsecured'}</b></div>
    <p>Scientific thinking, preparation, and care for your crew shape the next mission.</p>`,[
    {label:'Replay mission',run:startMission},{label:'Thirty-sol campaign',run:()=>location.href='./campaign.html'},
    {label:'Return to menu',run:()=>{audio.stop();closeDialog();mission=createMission();player.enabled=false;exterior.visible=true;interior.visible=false;$('hud').hidden=true;$('landing').hidden=false;}}
  ], 'EXPEDITION DEBRIEF');
  audio.pause(false);
}
$('begin').onclick=startMission;

const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
renderer.domElement.addEventListener('click',e=>{
  if(!player.enabled||player.lastDrag>8)return;
  if(document.pointerLockElement===renderer.domElement){interact();return;}
  pointer.set(e.clientX/innerWidth*2-1,-e.clientY/innerHeight*2+1);raycaster.setFromCamera(pointer,camera);
  const hits=raycaster.intersectObjects((mission.inside?interior:exterior).children,true);
  if(!hits.length)return;let obj=hits[0].object;
  while(obj&&!obj.userData.stationId)obj=obj.parent;
  const s=stations.find(s=>s.id===obj?.userData.stationId);
  if(s){selected=s;if(nearby(s)){renderInteraction(true);interact();}else navigateTo(s);}
});
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});

try {
  const assets=Object.fromEntries(await Promise.all(Object.entries(DEMO_ASSETS).map(async([name,url])=>{const model=await loader.loadAsync(url.href);return [name,model];})));
  cloneAsset(assets.habitat,exterior,[0,0,0],.12,1);
  rover=cloneAsset(assets.rover,exterior,[9,0,-5],-.35,1.1);
  const terminal=cloneAsset(assets.terminal,exterior,[-1.5,0,4.7]);
  station('terminal','Habitat diagnostics','CONTROL TERMINAL',terminal,{x:-1.5,z:4.7},{x:-1.5,z:6.7});
  for(let i=0;i<3;i++) {
    const x=-11+i*3,model=cloneAsset(assets.solar,exterior,[x,0,4.8]);
    const hinge=model.getObjectByName('panel_hinge');hinge.rotation.x=.35;
    const dirt=new THREE.Mesh(new THREE.PlaneGeometry(2.68,1.56),new THREE.MeshStandardMaterial({color:0x925b38,transparent:true,opacity:.72,roughness:1,depthWrite:false}));
    dirt.rotation.x=-Math.PI/2;dirt.position.y=.079;hinge.add(dirt);panels.push({model,hinge,dust:dirt});
    station(`solar${i}`,`Solar collector ${i+1}`,'SOLAR ARRAY',model,{x,z:4.8},{x,z:7.1});
  }
  const bay=new THREE.Group();bay.position.set(9,.75,-2.8);exterior.add(bay);
  roverLid=new THREE.Mesh(new THREE.BoxGeometry(.76,.13,.48),new THREE.MeshStandardMaterial({color:0xbac7cb,metalness:.6,roughness:.4}));roverLid.position.set(0,.6,0);bay.add(roverLid);
  batteryObject=cloneAsset(assets.battery,bay,[0,0,0]);batteryObject.visible=false;
  station('rover','Rover service bay','BATTERY SALVAGE',bay,{x:9,z:-2.8},{x:9,z:-.65});
  rover.userData.stationId='rover';
  const junction=cloneAsset(assets.junction,exterior,[5,0,5]);
  station('junction','Power junction','POWER RELAY',junction,{x:5,z:5},{x:5,z:7.1});
  for(let i=0;i<3;i++) {
    const dial=new THREE.Mesh(new THREE.BoxGeometry(.024,.106,.021),new THREE.MeshStandardMaterial({color:0x9de3ce,emissive:0x3d786b}));
    dial.position.set(-.23+i*.23,.79,.424);junction.add(dial);connectorVisuals.push(dial);
  }
  installedBattery=cloneAsset(assets.battery,junction,[0,.1,.5],Math.PI,.6);installedBattery.visible=false;
  airlock=cloneAsset(assets.airlock,exterior,[5.6,0,-.7],Math.PI/2);
  station('airlock','Meridian airlock','CREW SHELTER',airlock,{x:5.6,z:-.7},{x:7.5,z:-.7});
  for(const [id,name,pos]of[['elena','Elena · Commander',[-3.3,0,9]],['amara','Amara · Biologist',[-6.8,0,9.5]],['luca','Luca · Medic',[3,0,9]]]) {
    const model=cloneAsset(assets.crew,exterior,pos,0,.96),mixer=new THREE.AnimationMixer(model);
    const animations=Object.fromEntries(assets.crew.animations.map(clip=>[clip.name,mixer.clipAction(clip)]));animations.Idle?.play();
    const s=station(id,name,'CREW CONTACT',model,{x:pos[0],z:pos[2]},{x:pos[0],z:pos[2]+1.8});
    crew.push({model,mixer,animations,station:s,base:new THREE.Vector3(...pos),mode:'Idle'});mixers.push(mixer);
  }
  cloneAsset(assets.interior,interior,[0,0,-45]);
  roomConsole=cloneAsset(assets.terminal,interior,[0,.18,-47]);
  station('room-console','Shelter console','AIRLOCK / COMMUNICATIONS',roomConsole,{x:0,z:-47},{x:0,z:-44.8},interior);
  const tanks=new THREE.Group();tanks.position.set(2.6,.18,-47);interior.add(tanks);
  for(let i=0;i<3;i++)cloneAsset(assets.water,tanks,[(i-1)*.8,0,0]);
  station('water','Water shielding','LIFE SUPPORT',tanks,{x:2.6,z:-47},{x:2.2,z:-45.1},interior);
  for(const pos of [[-1.8,.18,-46],[1.7,.18,-45.8],[1.4,.18,-43.1]]) {
    const model=cloneAsset(assets.crew,interior,pos,.1,.96),mixer=new THREE.AnimationMixer(model);mixer.clipAction(assets.crew.animations.find(c=>c.name==='Idle')).play();mixers.push(mixer);
    insideObstacles.push(obstacle(pos[0],pos[2],.5,.5));
  }
  toolObject=cloneAsset(assets.tool,camera,[.29,-.4,-.7],-.3,.55);toolObject.visible=false;
  ready=true;$('begin').disabled=false;$('begin').textContent='Begin Mission →';$('load-status').textContent='MISSION CONTROL JR. ONLINE / ALL SYSTEMS LOADED';
} catch(error) {
  console.error(error);$('load-status').textContent='Mission assets could not load. Check the terminal server and reload.';
  $('begin').disabled=false;$('begin').textContent='Reload mission';$('begin').onclick=()=>location.reload();
}

const timer=new THREE.Timer();timer.connect(document);let uiClock=0,alarmClock=0,brushClock=0;
renderer.setAnimationLoop(time=> {
  timer.update(time);const dt=Math.min(timer.getDelta(),.05);clock+=dt;
  const paused=!$('dialog').hidden||document.hidden||!!transition;
  if(transition&&$('dialog').hidden&&!document.hidden){
    transition.elapsed+=dt;const openness=Math.min(1,transition.elapsed/.85);
    airlock.getObjectByName('door_left').position.x=-.5-openness;
    airlock.getObjectByName('door_right').position.x=.5+openness;
    if(openness===1){transition=null;completeEntry();}
  }
  if(!mission.started) {camera.position.set(Math.cos(.7+clock*.015)*20,9,Math.sin(.7+clock*.015)*20);camera.lookAt(0,2,0);}
  else {
    player.enabled=!paused&&!mission.ended;
    player.obstacles=mission.inside?insideObstacles:[...outsideObstacles,...crew.map(c=>obstacle(c.model.position.x,c.model.position.z,.5,.5))];
    const moving=player.update(dt);camera.position.y=(mission.inside?1.88:1.68)+(moving&&!reducedMotion?Math.sin(clock*13)*.025:0);
    const event=advance(mission,dt,paused);if(event)audio.say(event,true);if(mission.ended)showEnding();
    if(job&&!paused) {
      if(!nearby(job.station)){job=null;toolObject.visible=false;toast('Cleaning cancelled: you moved away.');renderInteraction(true);}
      else {job.time+=dt;brushClock+=dt;if(brushClock>.5){audio.effect('brush');brushClock=0;}
        toolObject.position.x=.29+Math.sin(clock*16)*.045;toolObject.rotation.z=Math.sin(clock*16)*.12;
        $('job-bar').style.width=`${job.time/job.duration*100}%`;
        if(job.time>=job.duration){const index=job.index;job=null;perform('clean',index);}
      }
    }
    if(ready&&player.enabled&&!player.route.length&&!nearby(selected)) {
      const next=stations.filter(s=>s.parent.visible&&nearby(s)).sort((a,b)=>distance(a)-distance(b))[0];
      if(next&&next!==selected){selected=next;renderNavigation();}
    }
  }
  const weather=mission.storm?Math.min(1,mission.stormAge/7):Math.min(.16,mission.elapsed/PREPARATION_SECONDS*.16);
  if(exterior.visible) {
    scene.background=skyColor.clone().lerp(stormColor,weather);scene.fog.color.copy(scene.background);
    scene.fog.near=weather?6:45;scene.fog.far=130-weather*112;sun.intensity=2.3-weather*1.85;hemi.intensity=1.6-weather*.5;
    sun.position.set(18-mission.elapsed*.025,24-mission.elapsed*.025,12);
    dustMaterial.opacity=(.02+weather*.5)*(reducedMotion?.35:1);
    const p=dustGeometry.attributes.position;for(let i=0;i<p.count;i++){let x=p.getX(i)+dt*(1+weather*11);if(x>30)x=-30;p.setX(i,x);}p.needsUpdate=true;
  } else {scene.background=new THREE.Color(0x1b2a33);scene.fog.near=80;scene.fog.far=130;}
  if(ready) {
    panels.forEach(p=>{p.hinge.rotation.x=.35+(reducedMotion?0:Math.sin(clock*.22)*.04);});
    const sensor=rover.getObjectByName('sensor_head');if(sensor)sensor.rotation.y=Math.sin(clock*.4)*.65;
    // Short docking motion stays inside the rover's collision bounds.
    const docking=mission.diagnosed?Math.min(1,mission.elapsed/2):0;
    rover.position.x=9-(1-docking)*.22;
    for(let i=0;i<6;i++){const wheel=rover.getObjectByName(`wheel_${i}`);if(wheel)wheel.rotation.z=docking*.63;}
    roverLid.rotation.x=THREE.MathUtils.lerp(roverLid.rotation.x,mission.bayOpen?-1.25:0,Math.min(1,dt*4));
    for(const c of crew) {
      let mode='Idle';
      if(c.station.id==='amara'&&!mission.storm&&camera.position.distanceTo(c.model.position)>4&&mission.started&&!paused) {
        c.model.position.x=c.base.x+Math.sin(clock*.4)*.65;c.model.rotation.y=Math.cos(clock*.4)>0?Math.PI/2:-Math.PI/2;mode='Walk';
      }
      if(job&&c.station.id==='amara')mode='Repair';
      if(mode!==c.mode){c.animations[c.mode]?.fadeOut(.3);c.animations[mode]?.reset().fadeIn(.3).play();c.mode=mode;}
      if(player.enabled&&camera.position.distanceTo(c.model.position)<5)c.model.rotation.y=Math.atan2(camera.position.x-c.model.position.x,camera.position.z-c.model.position.z);
      c.station.point.x=c.model.position.x;c.station.point.z=c.model.position.z;
    }
    if(mission.inside&&!mission.sealed&&!transition){airlock.getObjectByName('door_left').position.x=-1.5;airlock.getObjectByName('door_right').position.x=1.5;}
    if(mission.sealed){airlock.getObjectByName('door_left').position.x=-.5;airlock.getObjectByName('door_right').position.x=.5;}
    if(!paused)mixers.forEach(mixer=>mixer.update(dt));
    updateVisuals();
    for(const s of stations) {
      s.marker.material.opacity=s===selected?.65:.15;
      const point=new THREE.Vector3(s.point.x,2.2,s.point.z).project(camera);
      const visible=mission.started&&!mission.ended&&s.parent.visible&&point.z<1&&point.z>-1&&Math.abs(point.x)<.95&&Math.abs(point.y)<.9&&distance(s)<15;
      s.label.hidden=!visible;if(visible){s.label.style.left=`${(point.x*.5+.5)*innerWidth}px`;s.label.style.top=`${(-point.y*.5+.5)*innerHeight}px`;}
    }
  }
  if(mission.storm&&!mission.inside&&!paused&&!mission.ended){alarmClock+=dt;if(alarmClock>12){audio.effect('alarm');alarmClock=0;}}
  audio.update(camera.position,camera.rotation.y,weather,mission.inside);
  uiClock+=dt;if(uiClock>.25&&mission.started){renderMission();renderInteraction();if(selected)$('target-kind').textContent=`${selected.kind} / ${distance(selected).toFixed(1)} M`;uiClock=0;}
  renderer.render(scene,camera);
});
