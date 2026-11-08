import {startPip} from './companion.js';startPip('storm');
import * as THREE from 'three';
const sampleMode=new URLSearchParams(location.search).get('sampler')==='1';
import {connectChapter,completeChapter,goToChapter,openJourney,journeyPaused} from './campaign-bridge.js';
import {attachArrivalContext} from './surface-orbit-link.js';
attachArrivalContext();
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DEMO_ASSETS } from './demo-assets.js';
import { createMission, act, advance, objective, PREPARATION_SECONDS } from './mission.js';
import { chapterTuning } from './simulation/difficulty.js';
import { Player } from './player.js';
import { MissionAudio } from './demo-audio.js';
import lines from './dialogue-lines.json';
import { installHudPresentation } from './hud-presentation.js';
import { installHiddenScrollUI } from './scroll-ui.js';
installHiddenScrollUI();

const $=id=>document.getElementById(id);
let mission=createMission(chapterTuning('storm')),ready=false,selected=null,job=null,transition=null,clock=0,toastTimer,endingShown=false;
const journal=[],stations=[],mixers=[],crew=[],panels=[];
let panelCollapseTimer;
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
const player=new Player(camera,renderer.domElement,()=>interact(),()=>togglePause(),()=>audio.effect('step'),renderView);
function renderView() {
  const third=player.view==='third';$('view').textContent=`View: ${third?'Third':'First'} person`;
  $('view').setAttribute('aria-pressed',String(third));
}
let audioBeforeJourney=false;connectChapter('storm',value=>{if(value){audioBeforeJourney=!!audio.paused;player.release();player.route=[];player.enabled=false;audio.pause(true);audio.context?.suspend();}else{audio.context?.resume().catch(()=>{});audio.pause(audioBeforeJourney);}});
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
let airlock,rover,roverLid,batteryObject,installedBattery,toolObject,roomConsole,avatar,avatarMixer,avatarAnimations,avatarTool,avatarMode='Idle',connectorVisuals=[];

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
  showDialog('Paused',`<p>The clock is stopped. Take your time. Nothing changes while this is open.</p>
    ${Object.entries(audio.volumes).map(([name,value])=>`<label>${name[0].toUpperCase()+name.slice(1)} volume <input aria-label="${name} volume" type="range" min="0" max="1" step="0.05" value="${value}" data-volume="${name}"></label>`).join('')}
    <label><span>Mute all audio</span><input id="master-mute" type="checkbox" ${audio.muted?'checked':''}></label>
    <label><span>Reduce motion and particles</span><input id="reduce-motion" type="checkbox" ${reducedMotion?'checked':''}></label>
    <p><strong>How to play:</strong> WASD or arrow keys to walk. Drag to look around. Press E to use things. V changes the camera. T shows your to-do list. Escape pauses.</p>`,[
    {label:'Keep playing',run:closeDialog},{label:'Start over',run:()=>startMission()}]);
  $('dialog-body').querySelectorAll('[data-volume]').forEach(input=>input.oninput=()=>audio.settings({[input.dataset.volume]:Number(input.value)}));
  $('master-mute').onchange=e=>audio.setMuted(e.target.checked);$('reduce-motion').onchange=e=>{reducedMotion=e.target.checked;};
}
let reducedMotion=false;
$('pause').onclick=togglePause;$('look').onclick=()=>player.capture();
$('tasks-toggle').onclick=toggleTasks;$('tasks-toggle-card').onclick=toggleTasks;
function toggleTasks(force) {
  const panel=$('mission-panel'),expanded=force??!panel.classList.contains('expanded');
  panel.classList.toggle('expanded',expanded);
  $('tasks-toggle').setAttribute('aria-expanded',String(expanded));
  $('tasks-toggle-card').setAttribute('aria-expanded',String(expanded));
  scheduleTasksCollapse();
}
function scheduleTasksCollapse(){clearTimeout(panelCollapseTimer);if($('mission-panel').classList.contains('expanded'))panelCollapseTimer=setTimeout(()=>toggleTasks(false),5000);}
$('mission-panel').addEventListener('pointermove',()=>{if($('mission-panel').classList.contains('expanded'))scheduleTasksCollapse();});
$('mission-panel').addEventListener('focusin',()=>{if($('mission-panel').classList.contains('expanded'))scheduleTasksCollapse();});
$('view').onclick=()=>{if(player.enabled)player.toggleView();};
$('skip-voice').onclick=()=>audio.skip();$('replay-voice').onclick=()=>audio.replay();
$('journal').onclick=()=>showDialog('Mission journal',`<p>Your next job: <strong>${objective(mission)}</strong></p>${mission.log.map(text=>`<p>• ${text}</p>`).join('')}${journal.map(entry=>`<div class="journal-entry"><b>${entry.speaker}</b><p>${entry.text}</p></div>`).join('')}`,[{label:'Back to the mission',run:closeDialog}], 'WHAT HAPPENED SO FAR');
addEventListener('keydown',e=>{if(e.code==='KeyJ'&&player.enabled)$('journal').click();if(e.code==='KeyT'&&player.enabled)toggleTasks();});
installHudPresentation({hud:$('hud'),toolbar:document.querySelector('#topbar .toolbar'),onHelp:()=>{if(player.enabled)togglePause();},onJourney:openJourney});

function navigateTo(s) {
  if(!player.enabled||job)return;
  selected=s;
  if(player.navigate(s.stand,s.point))toast(`Walking to ${s.title}. Press WASD to walk yourself.`);
  else toast('Something is in the way. Walk around it with WASD.');
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
  if(!s||!s.parent.visible||Math.hypot(player.position.x-s.point.x,player.position.z-s.point.z)>3.05)return false;
  const origin=new THREE.Vector3(player.position.x,mission.inside?1.33:1.15,player.position.z),target=new THREE.Vector3(s.point.x,origin.y,s.point.z),direction=target.sub(origin);
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
  if(!mission.diagnosed){toast('Check the computer inside first.');return;}
  if(mission.cleaned[index])return;
  job={station:selected,index,time:0,duration:2.5};audio.effect('brush');renderInteraction();
}
function interact() {
  if(!player.enabled||job)return;
  const s=nearby(selected)?selected:stations.filter(s=>s.parent.visible&&nearby(s)).sort((a,b)=>distance(a)-distance(b))[0]||selected;
  if(!s){toast('Walk up to a glowing marker, then press E.');return;}
  selected=s;
  if(!nearby(s)){toast(`Get closer to ${s.title}. Or tap its button to walk there.`);return;}
  if(s.id==='terminal') {
    if(!mission.diagnosed)perform('diagnose');
    else if(mission.repaired&&mission.cleaned.every(Boolean)&&!mission.allocation)chooseAllocation();
    else toast(mission.allocation?'Choice made! Now go inside.':'Clean the panels, then fix the power box.');
  } else if(s.id.startsWith('solar'))startCleaning(Number(s.id.slice(-1)));
  else if(s.id==='rover')perform(mission.bayOpen?'battery':'openBay');
  else if(s.id==='junction'){if(!mission.installed)perform('install');else if(!mission.repaired)toast('Turn the three plugs to 1, 2, 3. Then connect.');else toast('The power is working.');}
  else if(s.id==='airlock') {
    if(!mission.diagnosed)perform('enter');
    else if(!mission.repaired||!mission.allocation)showDialog('Go inside now?',`<p>You can go in now. But some jobs are not done yet. That means less power and air during the storm.</p>`,[{label:'Keep getting ready',run:closeDialog},{label:'Go inside now',run:()=>{closeDialog();perform('enter');}}]);
    else perform('enter');
  } else if(['elena','amara','luca'].includes(s.id)) {
    perform('talk',s.id);
    if(!mission.responded.includes(s.id))showDialog(s.title,`<p>${lines[s.id].text}</p><p>What do you say?</p>`,[
      {label:'We can do this together!',run:()=>{closeDialog();perform('respond',{crew:s.id,choice:'encourage'});}},
      {label:'Let’s follow the safety steps',run:()=>{closeDialog();perform('respond',{crew:s.id,choice:'procedure'});}}
    ],'CREW CHECK-IN');
  }
  else if(s.id==='room-console')perform(mission.sealed?'report':'seal');
  else if(s.id==='water'){audio.say('water');toast('Drinking water. It also protects the beds from radiation.');}
}
const distance=s=>Math.hypot(player.position.x-s.point.x,player.position.z-s.point.z);
function chooseAllocation() {
  // Caption-only decision context. Existing recorded dialogue keys are left untouched to keep voice/subtitle sync.
  showDialog('Where should the battery power go?',`<p>The battery has power for one big job. You choose!</p><p><strong>Amara:</strong> “My plant experiment needs power. If it stops, we lose our notes.”</p><p><strong>Luca:</strong> “Extra air keeps all four of us safe, even if the storm lasts a long time.”</p><p><strong>Extra air:</strong> everyone is safer. <strong>Science:</strong> the experiment keeps going, but we have less spare air. Both choices have a cost.</p>`,[
    {label:'Save extra air',run:()=>{closeDialog();perform('allocate','life');}},
    {label:'Keep the experiment running',run:()=>{closeDialog();perform('allocate','research');}},
    {label:'Decide later',run:closeDialog}], 'YOUR CHOICE');
}
let lastInteractionKey='';
function renderInteraction(force=false) {
  const s=selected,near=nearby(s),key=`${s?.id}|${near}|${mission.diagnosed}|${mission.cleaned}|${mission.bayOpen}|${mission.battery}|${mission.installed}|${mission.connector}|${mission.repaired}|${mission.allocation}|${mission.sealed}|${Math.floor(mission.insideAge)}|${!!job}`;
  if(!force&&key===lastInteractionKey)return;lastInteractionKey=key;
  $('interaction').hidden=!s||!mission.started||mission.ended||!near;if(!s)return;
  $('target-kind').textContent=`${s.kind} / ${distance(s).toFixed(1)} M`;$('target-title').textContent=s.title;
  let description='',buttons=[];
  const action=(label,fn,extra=false)=>buttons.push(button(label,fn,!near||!!job||extra));
  if(s.id==='terminal') {
    description=!mission.diagnosed?'The computer shows what is broken.':mission.allocation?'Choice made. The crew is ready to go inside.':'Clean the panels and fix the battery. Then make your choice here.';
    action(!mission.diagnosed?'Check the computer':'Air or science?',interact,mission.diagnosed&&(!mission.repaired||!mission.cleaned.every(Boolean)||!!mission.allocation));
  } else if(s.id.startsWith('solar')) {
    const i=Number(s.id.slice(-1));description=mission.cleaned[i]?'Clean! This panel is making power from sunlight.':'Dust is blocking the sunlight. Brush it off!';
    action(mission.cleaned[i]?'Panel is clean':job?'Cleaning…':'Clean the panel',interact,mission.cleaned[i]);
  } else if(s.id==='rover') {
    description=mission.installed||mission.battery?'You have the spare battery.':'The spare battery is in the back of the rover.';
    action(mission.bayOpen?'Take the battery':'Open the hatch',interact,mission.battery||mission.installed);
  } else if(s.id==='junction') {
    description=!mission.installed?'Put the battery in. Then turn the plugs.':mission.repaired?'The power is working!':'Click each plug until they show 1, 2, 3. Then press connect.';
    if(!mission.installed)action('Put the battery in',interact);
    else if(!mission.repaired) {
      for(let i=0;i<3;i++)action(`Plug ${i+1} shows ${mission.connector[i]}`,()=>perform('rotate',i));
      action('Connect',()=>perform('connect'));
    }else action('Power is on',()=>{},true);
  } else if(s.id==='airlock'){description='Go inside the base. Jobs you skip will make the storm harder.';action('Go inside',interact);}
  else if(s.id==='room-console'){description=mission.sealed?'Everyone is here. Send a message home when the storm passes.':'Count the crew and close the door tight.';action(mission.sealed?'Send message home':'Close the door',interact,mission.sealed&&mission.insideAge<5);}
  else if(s.id==='water'){description='Our drinking water. It also blocks radiation near the beds.';action('Look at the water',interact);}
  else {description='Talk with your crew. They have good tips!';action('Talk',interact);}
  $('target-description').textContent=description;$('action-buttons').replaceChildren(...buttons);
  $('job-track').hidden=!job;$('action-help').textContent=!near?'Walk closer, or tap this place in the walk-to list.':job?'Brushing… Stay next to the panel.':'Press E or tap a button above.';
}
function renderMission() {
  $('objective').textContent=objective(mission);
  const time=Math.max(0,Math.ceil((mission.prepSeconds??PREPARATION_SECONDS)-mission.elapsed));
  const sun=`Sunlight ${Math.round((mission.sunlight??1)*100)}%`;$('forecast').textContent=mission.inside?(mission.sealed?'Door sealed · waiting for the storm to pass':'You are inside · close the door'):mission.storm?`THE STORM IS HERE · Go inside! · ${sun}`:`Storm arrives in ${Math.floor(time/60)}:${String(time%60).padStart(2,'0')} · ${sun}`;
  $('minimal-forecast').textContent=$('forecast').textContent;
  const tasks=[['Check computer',mission.diagnosed],['Clean panels '+mission.cleaned.filter(Boolean).length+'/3',mission.cleaned.every(Boolean)],['Get battery',mission.battery||mission.installed],['Fix power',mission.repaired],['Air or science?',!!mission.allocation],['Close the door',mission.sealed]];
  const firstOpen=tasks.findIndex(([,done])=>!done);$('mission-step').textContent=`JOB ${firstOpen<0?6:firstOpen+1} OF 6`;
  const nextId=mission.inside?'room-console':!mission.diagnosed?'terminal':mission.cleaned.some(done=>!done)?`solar${mission.cleaned.findIndex(done=>!done)}`:!mission.battery&&!mission.installed?'rover':!mission.installed||!mission.repaired?'junction':!mission.allocation?'terminal':'airlock';
  const nextTarget=stations.find(s=>s.id===nextId);$('next-action').textContent=mission.ended?'Mission finished!':nextTarget?`${nextTarget.title} · ${Math.round(distance(nextTarget))} m · press E`:'Go inside';
  const completeCount=tasks.filter(([,done])=>done).length;$('mission-panel').style.setProperty('--mission-progress',`${completeCount/tasks.length*100}%`);
  const vital=(icon,label,value,essential=false)=>{const n=Math.round(value),state=n<20?'danger':n<40?'warning':'healthy';return `<span class="vital-chip ${essential?'vital-essential':''}" data-state="${state}" role="img" aria-label="${label} ${n} percent" title="${label} ${n}%"><span class="vital-icon" aria-hidden="true">${icon}</span><b>${n}%</b><i style="width:${n}%"></i></span>`;};
  $('vitals').innerHTML=vital('⚡','Power',mission.resources.power,true)+vital('O₂','Oxygen',mission.resources.oxygen)+vital('♡','Morale',mission.resources.morale)+'<span class="vital-chip" role="img" aria-label="Four crew members safe" title="Crew 4 of 4"><span class="vital-icon" aria-hidden="true">♙</span><b>4/4</b><i style="width:100%"></i></span>';
  $('tasks').innerHTML=tasks.map(([name,done])=>`<div class="${done?'done':''}">${done?'✓':'○'} ${name}</div>`).join('');
  $('inventory').textContent=mission.battery?'INVENTORY / RESERVE BATTERY + EVA BRUSH':mission.installed?'EQUIPPED / EVA BRUSH · BATTERY INSTALLED':'EQUIPPED / EVA CLEANING BRUSH';
}
function enterShelter() {
  job=null;transition={elapsed:0};player.release();player.enabled=false;audio.effect('door');toast('The door is opening. Going inside…');
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
  toolObject.visible=!!job&&player.view==='first';
  avatarTool.visible=!!job&&player.view==='third';
  panels.forEach((p,i)=>{p.dust.material.opacity=mission.cleaned[i]?0:job?.index===i?.72*(1-job.time/job.duration):.72;});
  connectorVisuals.forEach((v,i)=>{v.rotation.z=mission.connector[i]*Math.PI/2;});
  habitatLamp.intensity=mission.repaired?12:1.5;
}
function startMission() {
  if(!ready)return;closeDialog();audio.stop();audio.start();mission=createMission(chapterTuning('storm'));act(mission,'start');if(sampleMode){act(mission,'diagnose');for(let i=0;i<3;i++)act(mission,'clean',i);for(const id of ['openBay','battery','install'])act(mission,id);for(let i=0;i<3;i++)for(let turn=0;turn<=i;turn++)act(mission,'rotate',i);act(mission,'connect');}
  journal.length=0;endingShown=false;job=null;transition=null;selected=null;lastInteractionKey='';alarmClock=0;brushClock=0;player.reset();player.bounds={minX:-18,maxX:18,minZ:-18,maxZ:18};player.obstacles=outsideObstacles;
  exterior.visible=true;interior.visible=false;$('landing').hidden=true;$('hud').hidden=false;
  toggleTasks(false);$('controls').classList.remove('controls-faded');setTimeout(()=>{if(mission.started)$('controls').classList.add('controls-faded');},30000);
  airlock.getObjectByName('door_left').position.x=-.5;airlock.getObjectByName('door_right').position.x=.5;
  for(const c of crew){c.model.position.copy(c.base);c.model.rotation.y=0;c.station.point.x=c.base.x;c.station.point.z=c.base.z;}
  renderView();renderNavigation();renderMission();renderInteraction(true);updateVisuals();
  if(sampleMode){showDialog('Practice: the big choice',`<p>The panels and battery are already fixed here. Walk to the computer. Choose: extra air or the experiment? Then bring the crew inside.</p><p>WASD or arrows to walk. Drag to look. E to use things. Practice does not change your journey.</p>`,[{label:'Start practice',run:closeDialog}],'PRACTICE');return;}
  audio.say('intro');
  showDialog('A dust storm is coming!',`<p>You are <strong>Jin</strong>, the base fixer. Four friends live here at Meridian on Mars. A giant dust storm is on its way. Help keep everyone safe!</p><p><strong>Your jobs:</strong> check the computer, clean the solar panels, get the spare battery, and fix the power.</p><p><strong>WASD or arrows:</strong> walk. <strong>Drag:</strong> look around. <strong>E:</strong> use things. <strong>V:</strong> change the camera. The buttons can walk you to each place.</p><p>The storm clock starts after you check the computer. It stops while you read menus. Pip the robot will help you.</p>`,[{label:'Let’s go!',run:closeDialog}], 'MARS DAY 12');
}
function showEnding() {
  if(endingShown)return;endingShown=true;job=null;toolObject.visible=false;player.release();audio.say(mission.outcome,true);
  const prepared=mission.outcome==='prepared',evacuated=mission.outcome==='evacuated';completeChapter('storm',{outcome:mission.outcome,attemptCompleted:true,success:mission.outcome!=='evacuated',mastered:mission.outcome==='prepared',carry:{stormOutcome:mission.outcome,allocation:mission.allocation||'none',batteryRecovered:mission.batteryRecovered,batteryInstalled:mission.batteryInstalled,experimentData:mission.experimentData,cleanedCollectors:mission.cleaned.filter(Boolean).length}});
  // The journal records cause and effect in player language; no game values or outcome rules change here.
  journal.unshift({speaker:'WHAT HAPPENED',text:`You cleaned ${mission.cleaned.filter(Boolean).length} of 3 panels. Then the storm blocked the Sun, and power fell to ${Math.round(mission.resources.power)}%.`});
  journal.unshift({speaker:'YOUR CHOICE',text:`${mission.allocation==='life'?'You saved extra air':mission.allocation==='research'?'You kept Amara’s experiment running':'You did not choose yet'}. Air ended at ${Math.round(mission.resources.oxygen)}%.`});
  const detailsMode=(()=>{try{return localStorage.getItem('mission-control-jr.learning-mode.v1')==='details';}catch{return false;}})();
  showDialog(prepared?'You did it! Everyone is safe.':evacuated?'Time to leave the base.':'Everyone is safe, just barely!',
    `<p>${prepared?'All four friends are safe. Your repairs and the extra air protected the base.':evacuated?'The air machine did not have enough power. So the crew left the base to stay safe. You can try again!':'All four friends got inside. But some jobs were not done, so supplies got very low.'}</p>
    <div class="report-row"><span>Solar panels</span><b>${mission.cleaned.filter(Boolean).length} of 3 clean</b></div>
    <div class="report-row"><span>Battery and power</span><b>${mission.repaired?'Working':'Not finished'}</b></div>
    <div class="report-row"><span>Your choice</span><b>${mission.allocation==='life'?'Extra air':mission.allocation==='research'?'Science':'Not chosen'}</b></div>
    <div class="report-row"><span>Door</span><b>${mission.sealed?'Closed tight':'Not closed'}</b></div>
    <section class="learning-summary"><h3>What you chose → what happened</h3><p><b>You chose:</b> ${mission.allocation==='life'?'extra air.':mission.allocation==='research'?`science. The experiment wrote ${Math.round(mission.experimentData)} new notes.`:'nothing yet.'}</p><p><b>The machines:</b> you cleaned ${mission.cleaned.filter(Boolean).length} of 3 panels. ${detailsMode?`Power ${Math.round(mission.resources.power)}%. Air ${Math.round(mission.resources.oxygen)}%.`:'Less sunlight means less power to share.'}</p><p><b>The crew:</b> ${prepared?'everyone has lots of spare air.':evacuated?'everyone left to stay safe.':'everyone is safe, but spare air is low.'}</p><p><b>Next mission:</b> ${prepared?'the rover starts fully charged.':'the rover starts with less charge.'}</p></section><p><strong>Try it again?</strong> Extra air keeps people safer. Science saves the experiment. What would you pick next time?</p><p><strong>This really happened!</strong> In June 2018, a huge dust storm covered all of Mars. NASA’s rover Opportunity used sunlight for power. In one week its power fell from 645 to just 22 watt-hours. That is like going from a bright day to a dark night. The storm in this game follows Opportunity’s real power drop. <a href="https://www.jpl.nasa.gov/news/nasa-mars-rovers-braving-severe-dust-storms/" target="_blank" rel="noopener">Read about it at NASA/JPL</a></p>`,[
    {label:`Next mission · ${evacuated?'Rover rescue drive':'Tracks in the Dust'}`,run:()=>goToChapter('rover')},
    {label:'Play again',run:startMission},{label:'30-day Mars base game',run:()=>goToChapter('extended')},
    {label:'Back to the mission map',run:openJourney}
  ], 'HOW DID IT GO?');
  audio.pause(false);
}
$('begin').onclick=startMission;
addEventListener('pagehide',()=>{audio.stop();audio.context?.close();player.release();renderer.setAnimationLoop(null);renderer.dispose();});

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
  station('terminal','Base computer','COMPUTER',terminal,{x:-1.5,z:4.7},{x:-1.5,z:6.7});
  for(let i=0;i<3;i++) {
    const x=-11+i*3,model=cloneAsset(assets.solar,exterior,[x,0,4.8]);
    const hinge=model.getObjectByName('panel_hinge');hinge.rotation.x=.35;
    const dirt=new THREE.Mesh(new THREE.PlaneGeometry(2.68,1.56),new THREE.MeshStandardMaterial({color:0x925b38,transparent:true,opacity:.72,roughness:1,depthWrite:false}));
    dirt.rotation.x=-Math.PI/2;dirt.position.y=.079;hinge.add(dirt);panels.push({model,hinge,dust:dirt});
    station(`solar${i}`,`Solar panel ${i+1}`,'SOLAR PANEL',model,{x,z:4.8},{x,z:7.1});
  }
  const bay=new THREE.Group();bay.position.set(9,.75,-2.8);exterior.add(bay);
  roverLid=new THREE.Mesh(new THREE.BoxGeometry(.76,.13,.48),new THREE.MeshStandardMaterial({color:0xbac7cb,metalness:.6,roughness:.4}));roverLid.position.set(0,.6,0);bay.add(roverLid);
  batteryObject=cloneAsset(assets.battery,bay,[0,0,0]);batteryObject.visible=false;
  station('rover','Rover hatch','SPARE BATTERY',bay,{x:9,z:-2.8},{x:9,z:-.65});
  rover.userData.stationId='rover';
  const junction=cloneAsset(assets.junction,exterior,[5,0,5]);
  station('junction','Power box','POWER BOX',junction,{x:5,z:5},{x:5,z:7.1});
  for(let i=0;i<3;i++) {
    const dial=new THREE.Mesh(new THREE.BoxGeometry(.024,.106,.021),new THREE.MeshStandardMaterial({color:0x9de3ce,emissive:0x3d786b}));
    dial.position.set(-.23+i*.23,.79,.424);junction.add(dial);connectorVisuals.push(dial);
  }
  installedBattery=cloneAsset(assets.battery,junction,[0,.1,.5],Math.PI,.6);installedBattery.visible=false;
  airlock=cloneAsset(assets.airlock,exterior,[5.6,0,-.7],Math.PI/2);
  station('airlock','Base door','GO INSIDE',airlock,{x:5.6,z:-.7},{x:7.5,z:-.7});
  for(const [id,name,pos]of[['elena','Elena · Commander',[-3.3,0,9]],['amara','Amara · Biologist',[-6.8,0,9.5]],['luca','Luca · Medic',[3,0,9]]]) {
    const model=cloneAsset(assets.crew,exterior,pos,0,.96),mixer=new THREE.AnimationMixer(model);
    const animations=Object.fromEntries(assets.crew.animations.map(clip=>[clip.name,mixer.clipAction(clip)]));animations.Idle?.play();
    const s=station(id,name,'CREW CONTACT',model,{x:pos[0],z:pos[2]},{x:pos[0],z:pos[2]+1.8});
    crew.push({model,mixer,animations,station:s,base:new THREE.Vector3(...pos),mode:'Idle'});mixers.push(mixer);
  }
  cloneAsset(assets.interior,interior,[0,0,-45]);
  roomConsole=cloneAsset(assets.terminal,interior,[0,.18,-47]);
  station('room-console','Door console','DOOR AND RADIO',roomConsole,{x:0,z:-47},{x:0,z:-44.8},interior);
  const tanks=new THREE.Group();tanks.position.set(2.6,.18,-47);interior.add(tanks);
  for(let i=0;i<3;i++)cloneAsset(assets.water,tanks,[(i-1)*.8,0,0]);
  station('water','Water tanks','WATER',tanks,{x:2.6,z:-47},{x:2.2,z:-45.1},interior);
  for(const pos of [[-1.8,.18,-46],[1.7,.18,-45.8],[1.4,.18,-43.1]]) {
    const model=cloneAsset(assets.crew,interior,pos,.1,.96),mixer=new THREE.AnimationMixer(model);mixer.clipAction(assets.crew.animations.find(c=>c.name==='Idle')).play();mixers.push(mixer);
    insideObstacles.push(obstacle(pos[0],pos[2],.5,.5));
  }
  toolObject=cloneAsset(assets.tool,camera,[.29,-.4,-.7],-.3,.55);toolObject.visible=false;
  avatar=cloneAsset(assets.crew,scene,[0,0,9],Math.PI,.96);avatar.name='Jin Park / player';avatar.visible=false;
  avatarMixer=new THREE.AnimationMixer(avatar);
  avatarAnimations=Object.fromEntries(assets.crew.animations.map(clip=>[clip.name,avatarMixer.clipAction(clip)]));avatarAnimations.Idle?.play();
  avatarTool=cloneAsset(assets.tool,avatar.getObjectByName('arm_right')||avatar,[0,-.78,.10],Math.PI,.55);avatarTool.visible=false;
  ready=true;$('begin').disabled=false;$('begin').textContent='Begin Mission →';$('load-status').textContent='MISSION CONTROL JR. ONLINE / ALL SYSTEMS LOADED';
} catch(error) {
  console.error(error);$('load-status').textContent='The game could not load. Ask a grown-up to check the game server, then reload.';
  $('begin').disabled=false;$('begin').textContent='Try loading again';$('begin').onclick=()=>location.reload();
}

const timer=new THREE.Timer();timer.connect(document);let uiClock=0,alarmClock=0,brushClock=0;
renderer.setAnimationLoop(time=> {
  timer.update(time);const dt=Math.min(timer.getDelta(),.05);clock+=dt;
  const paused=journeyPaused||!$('dialog').hidden||document.hidden||!!transition;
  if(transition&&$('dialog').hidden&&!document.hidden&&!journeyPaused){
    transition.elapsed+=dt;const openness=Math.min(1,transition.elapsed/.85);
    airlock.getObjectByName('door_left').position.x=-.5-openness;
    airlock.getObjectByName('door_right').position.x=.5+openness;
    if(openness===1){transition=null;completeEntry();}
  }
  if(!mission.started) {camera.position.set(Math.cos(.7+clock*.015)*20,9,Math.sin(.7+clock*.015)*20);camera.lookAt(0,2,0);}
  else {
    player.enabled=!paused&&!mission.ended;
    player.obstacles=mission.inside?insideObstacles:[...outsideObstacles,...crew.map(c=>obstacle(c.model.position.x,c.model.position.z,.5,.5))];
    const moving=player.update(dt,false);if(moving&&$('mission-panel').classList.contains('expanded'))toggleTasks(false);player.position.y=mission.inside?1.88:1.68;
    player.cameraObjects=(mission.inside?interior:exterior).children;
    scene.updateMatrixWorld(true);player.syncCamera(moving&&!reducedMotion?Math.sin(clock*13)*.025:0);
    if(avatar) {
      avatar.visible=player.view==='third'&&player.cameraDistance>.75;
      avatar.position.set(player.position.x,mission.inside?.18:0,player.position.z);
      const facing=job?Math.atan2(job.station.point.x-player.position.x,job.station.point.z-player.position.z):player.facing;
      const turn=Math.atan2(Math.sin(facing-avatar.rotation.y),Math.cos(facing-avatar.rotation.y));
      avatar.rotation.y+=turn*Math.min(1,dt*12);
      const mode=job?'Repair':moving?'Walk':'Idle';
      if(mode!==avatarMode){avatarAnimations[avatarMode]?.fadeOut(.2);avatarAnimations[mode]?.reset().fadeIn(.2).play();avatarMode=mode;}
      if(!paused&&!mission.ended)avatarMixer.update(dt*(mode==='Walk'?1.7:1));
    }
    const event=advance(mission,dt,paused);if(event)audio.say(event,true);if(mission.ended)showEnding();
    if(job&&!paused) {
      if(!nearby(job.station)){job=null;toolObject.visible=false;toast('You walked away, so cleaning stopped. Come back to finish.');renderInteraction(true);}
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
  const weather=mission.storm?Math.min(1,mission.stormAge/7):Math.min(.16,mission.elapsed/(mission.prepSeconds??PREPARATION_SECONDS)*.16);
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
      if(c.station.id==='amara'&&!mission.storm&&player.position.distanceTo(c.model.position)>4&&mission.started&&!paused) {
        c.model.position.x=c.base.x+Math.sin(clock*.4)*.65;c.model.rotation.y=Math.cos(clock*.4)>0?Math.PI/2:-Math.PI/2;mode='Walk';
      }
      if(job&&c.station.id==='amara')mode='Repair';
      if(mode!==c.mode){c.animations[c.mode]?.fadeOut(.3);c.animations[mode]?.reset().fadeIn(.3).play();c.mode=mode;}
      if(player.enabled&&player.position.distanceTo(c.model.position)<5)c.model.rotation.y=Math.atan2(player.position.x-c.model.position.x,player.position.z-c.model.position.z);
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
  if(avatar&&!mission.started)avatar.visible=false;
  audio.update(mission.started?player.position:camera.position,mission.started?player.yaw:camera.rotation.y,weather,mission.inside);
  uiClock+=dt;if(uiClock>.25&&mission.started){renderMission();renderInteraction();if(selected)$('target-kind').textContent=`${selected.kind} / ${distance(selected).toFixed(1)} M`;uiClock=0;}
  renderer.render(scene,camera);
});
