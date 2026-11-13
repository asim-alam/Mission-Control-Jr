import {openPipLesson, pipLessonOpen} from './professor-pip.js';
// Restored exterior prologue. Successful docking hands off to missions/orbit/ui.js via entry.js.
import {readApproach,saveApproach,clearApproach} from './missions/orbit/approach-state.js';
import {startPip} from './companion.js';startPip('orbit');
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Player, showCameraView} from './player.js';
import {createStation,createShuttle} from './station-model.js';
import {createOrbitalEnvironment} from './orbital-environment.js';
import {OrbitalAudio} from './orbital-audio.js';
import {OrbitalRadio} from './orbital-radio.js';
import {connectChapter,completeChapter,goToChapter,openJourney,journeyPaused} from './campaign-bridge.js';
import {createOrbit,randomDock,orbitalTask,actOrbit,advanceOrbit,dockReady,stepDock,guidedDock} from './orbital-mission.js';
import {installHudPresentation} from './hud-presentation.js';
import {installHiddenScrollUI} from './scroll-ui.js';
installHiddenScrollUI();

const $=id=>document.getElementById(id),keys=new Set();
const renderer=new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(innerWidth,innerHeight);renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.outputColorSpace=T.SRGBColorSpace;$('space').append(renderer.domElement);
const scene=new T.Scene();scene.background=new T.Color(0x03070c);const camera=new T.PerspectiveCamera(52,innerWidth/innerHeight,.08,30000);scene.add(camera);
const station=createStation();scene.add(station.exterior,station.interior);station.exterior.position.y=2.2;station.interior.visible=false;
function createDockCorridor(){const group=new T.Group();group.name='Docking Corridor';const zStart=21.2,zEnd=48,half=1.35,mat=new T.LineBasicMaterial({color:0x4cc9ff,transparent:true,opacity:0.65});const railPositions=[-half,half,zStart,-half,half,zEnd, half,half,zStart,half,half,zEnd, -half,-half,zStart,-half,-half,zEnd, half,-half,zStart,half,-half,zEnd],railsGeo=new T.BufferGeometry();railsGeo.setAttribute('position',new T.Float32BufferAttribute(railPositions,3));group.add(new T.LineSegments(railsGeo,mat));const gatePositions=[];for(const z of [21.5,27,33,39,46]){gatePositions.push(-half,-half,z,half,-half,z, half,-half,z,half,half,z, half,half,z,-half,half,z, -half,half,z,-half,-half,z);}const gatesGeo=new T.BufferGeometry();gatesGeo.setAttribute('position',new T.Float32BufferAttribute(gatePositions,3));group.add(new T.LineSegments(gatesGeo,mat));return {group,mat};}
const dockCorridor=createDockCorridor();station.exterior.add(dockCorridor.group);dockCorridor.group.visible=false;
const shuttle=createShuttle();scene.add(shuttle);shuttle.rotation.y=Math.PI;
const cockpit=new T.Group();scene.add(cockpit);cockpit.visible=false;
const frameMaterial=new T.MeshStandardMaterial({color:0x172b38,metalness:.5,roughness:.5});for(const [x,y,z,w,h,d]of [[0,.5,-1.7,2.2,.5,.2],[-1.15,1.6,-1.8,.12,2.4,.14],[1.15,1.6,-1.8,.12,2.4,.14],[0,2.9,-1.8,2.4,.14,.14]]){const mesh=new T.Mesh(new T.BoxGeometry(w,h,d),frameMaterial);mesh.position.set(x,y,z);cockpit.add(mesh);}
const dash=new T.Mesh(new T.BoxGeometry(1.8,.08,.6),new T.MeshStandardMaterial({color:0x245358,emissive:0x153e45,emissiveIntensity:.8,roughness:.6}));dash.position.set(0,.8,-1.6);dash.rotation.x=.3;cockpit.add(dash);
const stationFill=new T.AmbientLight(0xa3c0d2,.65);station.interior.add(stationFill);
const marker=new T.Mesh(new T.RingGeometry(.55,.63,36),new T.MeshBasicMaterial({color:0xeac092,transparent:true,opacity:.8,depthWrite:false}));marker.rotation.x=-Math.PI/2;marker.position.y=.035;station.interior.add(marker);

// 3D Docking Visual Hardware & Cutscene Components
const dockLeds=[];
const ledGeo=new T.SphereGeometry(.065,8,8);
const ledMatUnlit=new T.MeshStandardMaterial({color:0x16343d,emissive:0x08191f,roughness:.6});
const dockRingLight=new T.PointLight(0x3ee6b5,0,10);dockRingLight.position.set(0,0,21.0);station.exterior.add(dockRingLight);
for(let i=0;i<12;i++){
  const angle=(i/12)*Math.PI*2;
  const mesh=new T.Mesh(ledGeo,ledMatUnlit.clone());
  mesh.position.set(Math.cos(angle)*2.08,Math.sin(angle)*2.08,20.94);
  station.exterior.add(mesh);
  dockLeds.push(mesh);
}
const dockClamps=[];
const clampBaseMat=new T.MeshStandardMaterial({color:0x1b2832,metalness:.8,roughness:.35});
const clampArmMat=new T.MeshStandardMaterial({color:0x3a4b56,metalness:.85,roughness:.25});
const clampClawMat=new T.MeshStandardMaterial({color:0xffd23f,metalness:.65,roughness:.3});
for(let i=0;i<4;i++){
  const angle=(i/4)*Math.PI*2+Math.PI/4;
  const pivot=new T.Group();
  pivot.position.set(Math.cos(angle)*2.08,Math.sin(angle)*2.08,20.9);
  pivot.rotation.z=angle+Math.PI/2;
  const base=new T.Mesh(new T.BoxGeometry(.18,.16,.22),clampBaseMat);
  pivot.add(base);
  const arm=new T.Group();
  const claw=new T.Mesh(new T.BoxGeometry(.12,.14,.44),clampArmMat);
  claw.position.set(0,.08,.22);
  arm.add(claw);
  const hook=new T.Mesh(new T.BoxGeometry(.14,.15,.12),clampClawMat);
  hook.position.set(0,.02,.41);
  arm.add(hook);
  arm.rotation.x=.45; // open
  pivot.add(arm);
  station.exterior.add(pivot);
  dockClamps.push(arm);
}
const vaporRingMat=new T.MeshBasicMaterial({color:0xdff6ff,transparent:true,opacity:0,depthWrite:false,side:T.DoubleSide});
const vaporRing=new T.Mesh(new T.RingGeometry(1.95,2.25,32),vaporRingMat);
vaporRing.position.set(0,0,20.98);
station.exterior.add(vaporRing);
const rcsPlumes=[];
for(const [x,y,z,rx,ry,rz] of [[-1.2,0,2.8,0,0,Math.PI/2],[1.2,0,2.8,0,0,-Math.PI/2],[0,1.2,2.8,-Math.PI/2,0,0],[0,-1.2,2.8,Math.PI/2,0,0]]){
  const plume=new T.Mesh(new T.ConeGeometry(.16,.55,8),new T.MeshBasicMaterial({color:0x7de8ff,transparent:true,opacity:0}));
  plume.position.set(x,y,z);plume.rotation.set(rx,ry,rz);shuttle.add(plume);rcsPlumes.push(plume);
}
let dockingSceneActive=false,dockedExteriorView=false,dockingSceneStartTime=0;
let dockStartPos={x:0,y:0,distance:0,speed:0};
let camStartPos=new T.Vector3(),camStartTarget=new T.Vector3();
let clampAudioPlayed=false,elenaRadioPlayed=false;

// 3D Explosion System for Unsuccessful Docking
const explosionGroup=new T.Group();
explosionGroup.name='Docking Explosion';
explosionGroup.visible=false;
scene.add(explosionGroup);
const fireballInnerMat=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0});
const fireballInner=new T.Mesh(new T.SphereGeometry(.85,16,16),fireballInnerMat);
explosionGroup.add(fireballInner);
const fireballOuterMat=new T.MeshStandardMaterial({color:0xff3300,emissive:0xff5500,emissiveIntensity:3.5,transparent:true,opacity:0,roughness:.4});
const fireballOuter=new T.Mesh(new T.SphereGeometry(1.4,16,16),fireballOuterMat);
explosionGroup.add(fireballOuter);
const shockwaveMat=new T.MeshBasicMaterial({color:0xffaa33,transparent:true,opacity:0,side:T.DoubleSide,depthWrite:false});
const shockwave=new T.Mesh(new T.RingGeometry(.6,1.4,32),shockwaveMat);
explosionGroup.add(shockwave);
const explosionLight=new T.PointLight(0xff6600,0,35);
explosionGroup.add(explosionLight);
const sparkGeo=new T.SphereGeometry(.065,6,6);
const sparkColors=[0xffffff,0xffdd33,0xff7700,0xff2200,0xffa040];
const sparkParticles=[];
for(let i=0;i<48;i++){
  const color=sparkColors[i%sparkColors.length];
  const mat=new T.MeshBasicMaterial({color,transparent:true,opacity:0});
  const mesh=new T.Mesh(sparkGeo,mat);
  explosionGroup.add(mesh);
  sparkParticles.push({mesh,mat,velocity:new T.Vector3(),lifetime:1,baseSize:.6+Math.random()*.8});
}
const smokeGeo=new T.SphereGeometry(.7,10,10);
const smokeMat=new T.MeshStandardMaterial({color:0x181c22,roughness:.9,transparent:true,opacity:0,depthWrite:false});
const smokePuffs=[];
for(let i=0;i<10;i++){
  const mesh=new T.Mesh(smokeGeo,smokeMat.clone());
  explosionGroup.add(mesh);
  smokePuffs.push({mesh,velocity:new T.Vector3(),lifetime:1.8});
}
let explosionActive=false,explosionStartTime=0,cameraShake=0,shuttleWobbleYaw=0,shuttleWobblePitch=0,explosionAlertTimer=null,lastKnownBumps=0;
const audio=new OrbitalAudio();let m=createOrbit({randomizeDock:true}),env,avatar,mixer,walk,idle,ready=false,started=false,paused=false,autodock=false,overview=true,view='third',overviewYaw=.3,overviewPitch=.25,overviewDistance=5600,zoom=3,craftZoom=14,drag=null,last=performance.now(),lastHud=0,lastPhase='',toastTimer,completionShown=false,frameId,orbitalAge=0,details=false;
const radio=new OrbitalRadio(line=>{$('orbital-radio').hidden=false;$('radio-speaker').textContent=line.speaker;$('radio-subtitle').textContent=line.text;},()=>{$('orbital-radio').hidden=true;},value=>audio.setDucked(value),text=>{$('radio-state').textContent=text;});
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let detailsCollapseTimer,controlsFadeTimer;
function scheduleDetailsCollapse(){clearTimeout(detailsCollapseTimer);if(details)detailsCollapseTimer=setTimeout(()=>{details=false;$('objective').classList.remove('expanded');$('details').setAttribute('aria-expanded','false');renderHud();},5000);}
$('objective').addEventListener('pointermove',()=>{if(details)scheduleDetailsCollapse();});
$('objective').addEventListener('focusin',()=>{if(details)scheduleDetailsCollapse();});
$('menu-toggle').onclick=()=>{const group=$('menu-controls'),open=group.hidden;group.hidden=!open;$('menu-toggle').setAttribute('aria-expanded',String(open));if(open)group.querySelector('button:not([hidden])')?.focus();};
document.addEventListener('click', event => {
  const menu = $('menu-controls'), toggle = $('menu-toggle');
  if (!menu.hidden && !toggle.contains(event.target)) toggle.click();
});
const player=new Player(camera,renderer.domElement,interact,togglePause,()=>{},()=>{view=player.view;if(view==='third'){camera.fov=52;camera.updateProjectionMatrix();}showCameraView($('view'), view);});
player.position.set(0,1.68,14);player.yaw=0;player.view='third';player.thirdPersonDistance=zoom;player.bounds={minX:-10.6,maxX:10.6,minZ:-17.5,maxZ:17.5};player.obstacles=station.colliders;player.cameraObjects=station.cameraObjects;
connectChapter('orbit',value=>{clearInput();audio.paused=paused||value||document.hidden;audio.update();radio.pause(audio.paused || pipLessonOpen());});
let transferring=false,lastSave=0;
const save=()=>started&&!transferring&&['overview','docking'].includes(m.phase)?saveApproach(m):false;
function restoreOrbit(){const saved=readApproach();return saved&&saved.phase!=='docked'?{...createOrbit({randomizeDock:true}),...saved}:null;}
function boardCabin(){transferring=true;started=false;ready=false;cancelAnimationFrame(frameId);saveApproach({...m,phase:'docked'});clearInput();radio.stop();audio.dispose();$('action').disabled=true;$('action').textContent='Dock sealed · entering cabin…';const next=new URL(location.href);next.searchParams.set('arrival','docked');location.replace(next.href);}

function notify(text){$('toast').textContent=text;$('toast').hidden=false;if(!$('modal').hidden){let feedback=$('modal-feedback');if(!feedback){feedback=document.createElement('p');feedback.id='modal-feedback';feedback.setAttribute('role','status');$('modal-body').append(feedback);}feedback.textContent=text;feedback.style.color='#efbd95';}clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,6500);}
function clearInput(){keys.clear();player.release();player.route=[];autodock=false;}
function showModal(title,html,actions,tag='ASTERIA / OPERATIONS'){
  clearInput();player.enabled=false;$('modal-title').textContent=title;$('modal-tag').textContent=tag;$('modal-body').innerHTML=html;$('modal-actions').replaceChildren();
  for(const action of actions){const button=document.createElement('button');button.textContent=action.label;if(action.primary)button.className='primary';button.onclick=()=>{button.blur();action.run();};$('modal-actions').append(button);}$('modal').hidden=false;$('modal-actions').querySelector('button')?.focus();
}
function closeModal(){try{speechSynthesis.cancel();}catch{}$('modal').hidden=true;player.enabled=started&&m.phase==='station'&&!paused;}
function showDockingBriefing(){
  showModal('Dock with Asteria',`
    <div class="kid-docking-brief">
      <div class="kid-mission-intro">
        <p><b>Commander Elena:</b> “Welcome to Mars, Jin. Bring your ship in slowly so the docking clamps can catch. Then we’ll take a look at that radio.”</p>
      </div>
      <ol class="kid-jobs-list">
        <li><span class="step-num" aria-hidden="true">1</span><div><b>Line up the crosshair.</b> Use <kbd>A/D</kbd> to move left or right and <kbd>R/F</kbd> to move up or down.</div></li>
        <li><span class="step-num" aria-hidden="true">2</span><div><b>Move in slowly.</b> Use <kbd>W/S</kbd> to move forward or back. Press <kbd>Space</kbd> to brake below <b>0.2 m/s</b>.</div></li>
        <li><span class="step-num" aria-hidden="true">3</span><div><b>Dock on green.</b> Within <b>2 m</b>, wait for the crosshair to turn green, then press <kbd>E</kbd> or choose <b>Dock</b>.</div></li>
      </ol>
      <p><b>Help me dock</b> lets the ship steer and brake for you.</p>
    </div>`,
    [
      {label:'Start flying',primary:true,run:()=>{closeModal();if(m.phase==='overview')run('approach');}},
      {label:'Help me dock',run:()=>{closeModal();if(m.phase==='overview')run('approach');autodock=true;m.guided=true;closeFlightLesson();notify('Docking help is on.');renderHud();}},
      {label:'Look around',run:closeModal}
    ],
    'FLIGHT BRIEFING · DOCKING AT ASTERIA'
  );
}

function triggerDockingExplosion(reason=''){
  explosionActive=true;explosionStartTime=performance.now();cameraShake=.85;
  const impactZ=20.95;
  const impactX=station.exterior.position.x+m.dock.x*.5;
  const impactY=station.exterior.position.y+m.dock.y*.5;
  explosionGroup.position.set(impactX,impactY,impactZ);
  explosionGroup.visible=true;

  shockwave.rotation.set(0,0,Math.random()*Math.PI);
  shockwave.scale.setScalar(.4);
  shockwaveMat.opacity=.95;

  fireballInner.scale.setScalar(.2);
  fireballInnerMat.opacity=1;
  fireballOuter.scale.setScalar(.3);
  fireballOuterMat.opacity=.95;
  explosionLight.intensity=25;

  sparkParticles.forEach(sp=>{
    sp.mesh.position.set(0,0,0);
    sp.mesh.scale.setScalar(sp.baseSize);
    sp.mat.opacity=1;
    sp.lifetime=.7+Math.random()*.7;
    const theta=Math.random()*Math.PI*2,phi=Math.acos(Math.random()*2-1);
    const speed=4+Math.random()*11;
    sp.velocity.set(Math.sin(phi)*Math.cos(theta)*speed,Math.sin(phi)*Math.sin(theta)*speed,Math.cos(phi)*speed+Math.random()*4);
  });

  smokePuffs.forEach(sm=>{
    sm.mesh.position.set((Math.random()-.5)*.6,(Math.random()-.5)*.6,Math.random()*.5);
    sm.mesh.scale.setScalar(.4);
    sm.mesh.material.opacity=.65;
    sm.lifetime=1.2+Math.random()*.8;
    sm.velocity.set((Math.random()-.5)*2.5,(Math.random()-.5)*2.5,1+Math.random()*3.5);
  });

  shuttleWobbleYaw=(Math.random()<.5?-1:1)*(.15+Math.random()*.15);
  shuttleWobblePitch=(Math.random()<.5?-1:1)*(.12+Math.random()*.12);

  audio.explosion();

  let flashEl=$('explosion-screen-flash');
  if(!flashEl){flashEl=document.createElement('div');flashEl.id='explosion-screen-flash';flashEl.className='explosion-flash';document.body.appendChild(flashEl);}
  flashEl.classList.add('active');
  setTimeout(()=>{if(flashEl)flashEl.classList.remove('active');},180);

  let alertEl=$('dock-explosion-alert');
  if(!alertEl){alertEl=document.createElement('div');alertEl.id='dock-explosion-alert';alertEl.className='dock-explosion-card';document.body.appendChild(alertEl);}
  const speedVal=Math.abs(m.dock.speed).toFixed(2);
  const isFast=Math.abs(m.dock.speed)>.205;
  const isUnaligned=Math.abs(m.dock.x)>.35||Math.abs(m.dock.y)>.35;

  let title='💥 DOCKING COLLISION · IMPACT EXPLOSION!';
  let desc='Spacecraft collided with Asteria docking collar! Emergency reverse thrusters engaged.';
  if(isFast&&isUnaligned){
    desc=`Speed was <b>${speedVal} m/s</b> (Limit: 0.20 m/s) and crosshair was off-center! Kinetic impact triggered explosion!`;
  }else if(isFast){
    desc=`Speed was <b>${speedVal} m/s</b>! Must stay below <b>0.20 m/s</b> so clamps can latch gently without exploding!`;
  }else if(isUnaligned){
    desc=`Not lined up! Spacecraft hit the outer docking rim. Center the crosshair (<kbd>A/D</kbd> &amp; <kbd>R/F</kbd>) before contact!`;
  }

  alertEl.innerHTML=`
    <div class="explosion-card-inner">
      <span class="explosion-icon">💥</span>
      <div class="explosion-body">
        <strong class="explosion-title">${title}</strong>
        <p class="explosion-desc">${desc}</p>
        <div class="explosion-remedy">
          <span>🛑 <b>Tap Space</b> to brake under 0.2 m/s</span>
          <span>🎯 <b>Center crosshair</b> with A/D and R/F</span>
          <span>🚀 <b>Try again</b> from safe 5m distance</span>
        </div>
      </div>
      <button type="button" class="explosion-dismiss-btn" id="explosion-dismiss-btn">Try Again ➔</button>
    </div>
  `;
  alertEl.hidden=false;alertEl.classList.remove('fade-out');
  const dismissBtn=$('explosion-dismiss-btn');
  if(dismissBtn){dismissBtn.onclick=()=>{alertEl.classList.add('fade-out');setTimeout(()=>{alertEl.hidden=true;},400);};}
  clearTimeout(explosionAlertTimer);
  explosionAlertTimer=setTimeout(()=>{alertEl.classList.add('fade-out');setTimeout(()=>{alertEl.hidden=true;},400);},6500);

  notify(`💥 Collision! Ship bounced back to 5m. Slow down (<0.2 m/s) and line up!`);
}

function playDockingCutscene(){
  dockingSceneActive=true;dockedExteriorView=false;dockingSceneStartTime=performance.now();
  clampAudioPlayed=false;elenaRadioPlayed=false;
  dockStartPos={x:m.dock.x,y:m.dock.y,distance:m.dock.distance,speed:m.dock.speed};
  camStartPos.copy(camera.position);camStartTarget.set(shuttle.position.x,shuttle.position.y,shuttle.position.z-3);
  clearInput();player.enabled=false;audio.start();
  if($('dock-alignment-svg'))$('dock-alignment-svg').style.display='none';
  if($('dock-target-box'))$('dock-target-box').hidden=true;
  if($('dock-center-zone'))$('dock-center-zone').hidden=true;
  if($('dock-slow-alert'))$('dock-slow-alert').hidden=true;
  if($('flight-lesson'))$('flight-lesson').hidden=true;
  if($('reticle'))$('reticle').hidden=true;
  if($('objective'))$('objective').hidden=true;
  if($('telemetry'))$('telemetry').hidden=true;
  if($('progress'))$('progress').hidden=true;
  if($('controls-hint'))$('controls-hint').hidden=true;
  let barTop=$('cinematic-bar-top');if(!barTop){barTop=document.createElement('div');barTop.id='cinematic-bar-top';barTop.className='cinematic-bar-top';document.body.appendChild(barTop);}
  barTop.classList.remove('fade-out');barTop.classList.add('active');
  let barBottom=$('cinematic-bar-bottom');if(!barBottom){barBottom=document.createElement('div');barBottom.id='cinematic-bar-bottom';barBottom.className='cinematic-bar-bottom';document.body.appendChild(barBottom);}
  barBottom.classList.remove('fade-out');barBottom.classList.add('active');
  let cutsceneHud=$('docking-cinematic-hud');if(!cutsceneHud){cutsceneHud=document.createElement('div');cutsceneHud.id='docking-cinematic-hud';document.body.appendChild(cutsceneHud);}
  cutsceneHud.hidden=false;
  cutsceneHud.innerHTML=`
    <div class="dock-cutscene-top">
      <div class="dock-cutscene-card">
        <div class="dock-cutscene-badge">🛰️ ASTERIA CORRIDOR · TERMINAL CAPTURE</div>
        <h2 class="dock-cutscene-title" id="cutscene-title">🎯 SOFT CAPTURE IN PROGRESS</h2>
        <p class="dock-cutscene-desc" id="cutscene-desc">Guiding spacecraft into Asteria docking port collar...</p>
        <div class="dock-cutscene-steps">
          <div class="dock-step-pill active" id="cutscene-step-1">1. SOFT CAPTURE</div>
          <div class="dock-step-pill" id="cutscene-step-2">2. HARD CLAMPS</div>
          <div class="dock-step-pill" id="cutscene-step-3">3. AIRLOCK SEAL</div>
        </div>
        <div class="dock-cutscene-telemetry">
          <div class="dock-tel-item"><span class="dock-tel-label">CLOSURE SPEED</span><span class="dock-tel-val" id="cutscene-speed">${Math.abs(dockStartPos.speed).toFixed(2)} m/s</span></div>
          <div class="dock-tel-item"><span class="dock-tel-label">PORT DISTANCE</span><span class="dock-tel-val" id="cutscene-dist">${dockStartPos.distance.toFixed(1)} m</span></div>
          <div class="dock-tel-item"><span class="dock-tel-label">ALIGNMENT</span><span class="dock-tel-val" id="cutscene-align">99.8% (LOCKED)</span></div>
          <div class="dock-tel-item"><span class="dock-tel-label">LATCH STATUS</span><span class="dock-tel-val" id="cutscene-clamps">ALIGNING (0/4)</span></div>
        </div>
      </div>
      <button type="button" class="dock-skip-btn" id="cutscene-skip-btn">Skip Cutscene ⏩</button>
    </div>
    <div class="dock-cutscene-bottom">
      <div class="dock-pressure-bar-wrap">
        <span class="dock-pressure-label">💨 Vestibule Pressure</span>
        <div class="dock-pressure-track"><div class="dock-pressure-fill" id="cutscene-pressure-fill" style="width:0%"></div></div>
        <span class="dock-pressure-val" id="cutscene-pressure-val">0.0 kPa</span>
      </div>
    </div>
  `;
  const skipBtn=$('cutscene-skip-btn');if(skipBtn)skipBtn.onclick=()=>finishDockingScene();
}

function finishDockingScene(){
  if(!dockingSceneActive&&dockedExteriorView)return;
  dockingSceneActive=false;dockedExteriorView=true;
  shuttle.position.set(0,2.2,25.07);
  dockClamps.forEach(arm=>{arm.rotation.x=-.08;});
  dockLeds.forEach(led=>{led.material.color.setHex(0x3ee6b5);led.material.emissive.setHex(0x3ee6b5);led.material.emissiveIntensity=3;});
  dockRingLight.intensity=3;vaporRing.material.opacity=0;rcsPlumes.forEach(p=>{p.material.opacity=0;});
  if(!clampAudioPlayed){audio.dockLock();clampAudioPlayed=true;}
  if(!elenaRadioPlayed){radio.say('docked');elenaRadioPlayed=true;}
  const barTop=$('cinematic-bar-top'),barBottom=$('cinematic-bar-bottom'),cutsceneHud=$('docking-cinematic-hud');
  if(barTop)barTop.classList.add('fade-out');if(barBottom)barBottom.classList.add('fade-out');if(cutsceneHud)cutsceneHud.hidden=true;
  if($('objective'))$('objective').hidden=false;if($('telemetry'))$('telemetry').hidden=false;if($('progress'))$('progress').hidden=false;if($('controls-hint'))$('controls-hint').hidden=false;
  $('location').textContent='ASTERIA SPACE STATION · DOCKED';$('readout').textContent='DOCKING CLAMP LOCKED ✅ · 101.3 kPa';$('subreadout').textContent='PORT 01 SEALED · ATMOSPHERE EQUALIZED';$('controls-hint').textContent='DRAG LOOK · WHEEL ZOOM · CLICK "OPEN HATCH" OR PRESS E TO ENTER CABIN';
  const actionBtn=$('action');if(actionBtn){actionBtn.hidden=false;actionBtn.disabled=false;actionBtn.textContent='🚀 Open hatch & enter cabin';actionBtn.onclick=()=>boardCabin();}
  showDockingSuccessLesson();
}

function showDockingSuccessLesson(){
  audio.ping();
  openPipLesson('orbit', {
    deck: 'docked',
    finishLabel: 'Enter Asteria',
    onFinish: boardCabin,
    onOpen: () => radio.pause(true),
    onClose: () => { radio.pause(paused || journeyPaused || document.hidden); renderHud(); },
  });
}
function help(){if(m.phase==='overview'||m.phase==='docking'){showDockingBriefing();return;}showModal('How to play',`<p><b>Look around:</b> Drag to turn the camera. Use the wheel or + / − to zoom.</p><p><b>Shortcuts:</b> F3 hides the HUD for a photo. Esc pauses. Press ? to reopen this guide.</p>`,[{label:'Back to the game',run:closeModal}],'HOW TO PLAY');}
function atlas(){showModal('Mars / the world below',`<p>This is Mars, spinning below you. One side is in sunlight, one side is in night.</p><p class="planet-note"><strong>Olympus Mons</strong> is the biggest volcano in the solar system. It is about three times taller than Mount Everest! <strong>Valles Marineris</strong> is a giant canyon. It is long enough to stretch across the United States. This picture is art, not a real map.</p><p>Learn more: <a href="https://science.nasa.gov/mars/facts/" target="_blank" rel="noopener">NASA Mars facts</a> · <a href="https://science.nasa.gov/resource/planet-mars-3d-model/" target="_blank" rel="noopener">NASA 3D Mars</a></p><p><strong>Planet model:</strong> Mars by Akshat, supplied by you; <a href="https://sketchfab.com/3d-models/mars-9c7bbc64d8c74acfa9ec344c0fc10e1a" target="_blank" rel="noopener">source</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>. Optimized from the original; diffuse map preserved and material converted to core PBR. Station and spacecraft are original procedural models.</p>`,[{label:'Back',run:closeModal}],'MARS FACTS');}
function syncSound(){radio.setMuted(audio.muted);const button=$('sound');button.textContent=audio.muted?'Sound off':'Sound on';button.setAttribute('aria-pressed',String(!audio.muted));}
function togglePause(){if(pipLessonOpen()||!ready||!started||m.complete&&!$('modal').hidden)return;if(!$('modal').hidden){if(paused){paused=false;audio.paused=false;audio.update();}closeModal();return;}paused=true;audio.paused=true;audio.update();showModal('Hold position.',`<p>The game is paused. Your progress is saved.</p><p>${m.phase==='docking'?'Line up with the docking port and approach slowly.':'Explore Mars from orbit, then start flying toward Asteria.'} After docking, enter the cabin to fix the radio and plan your landing.</p>`,[{label:'Resume',primary:true,run:()=>{paused=false;audio.paused=false;audio.update();closeModal();}},{label:audio.muted?'Unmute sound':'Mute sound',run:()=>{audio.setMuted(!audio.muted);syncSound();notify(audio.muted?'Sound muted.':'Sound enabled.');}},{label:'Start over',run:restart},{label:'Your journey',run:openJourney}],'PAUSED');}

const FLIGHT_LESSON_STEPS = [
  {
    step: 1,
    title: 'Steer right',
    keys: ['KeyD', 'ArrowRight'],
    keyLabel: 'D',
    actionLabel: 'Steer Right ➡️',
    desc: 'Press <kbd class="lesson-kbd">D</kbd> or <kbd class="lesson-kbd">➡️</kbd> to fire the right steering thrusters.',
    btnText: '<span class="btn-icon">👉</span> Press <kbd>D</kbd> <span>(Steer Right ➡️)</span>',
    okText: 'Great job! D fires thrusters to steer your spaceship right.',
    simKey: 'KeyD'
  },
  {
    step: 2,
    title: 'Steer left',
    keys: ['KeyA', 'ArrowLeft'],
    keyLabel: 'A',
    actionLabel: 'Steer Left ⬅️',
    desc: 'Press <kbd class="lesson-kbd">A</kbd> or <kbd class="lesson-kbd">⬅️</kbd> to move back toward the line.',
    btnText: '<span class="btn-icon">👉</span> Press <kbd>A</kbd> <span>(Steer Left ⬅️)</span>',
    okText: 'Perfect! A and D keep you centered between the corridor lines.',
    simKey: 'KeyA'
  },
  {
    step: 3,
    title: 'Move up or down',
    keys: ['KeyR', 'KeyF'],
    keyLabel: 'R or F',
    actionLabel: 'Up / Down ↕️',
    desc: 'Press <kbd class="lesson-kbd">R</kbd> (Up) or <kbd class="lesson-kbd">F</kbd> (Down) to adjust your docking height.',
    btnText: '<span class="btn-icon">👉</span> Try <kbd>F</kbd> · Down',
    okText: 'Awesome! R lifts your ship up, and F lowers it down.',
    simKey: 'KeyF'
  },
  {
    step: 4,
    title: 'Fly toward Asteria',
    keys: ['KeyW', 'ArrowUp'],
    keyLabel: 'W',
    actionLabel: 'Fly Closer 🚀',
    desc: 'Press <kbd class="lesson-kbd">W</kbd> or <kbd class="lesson-kbd">⬆️</kbd> to move toward the docking port.',
    btnText: '<span class="btn-icon">👉</span> Press <kbd>W</kbd> <span>(Fly Closer 🚀)</span>',
    okText: 'Nice! W moves you closer toward the space station.',
    simKey: 'KeyW'
  },
  {
    step: 5,
    title: 'Slow the ship',
    keys: ['Space'],
    keyLabel: 'Space',
    actionLabel: 'Brake 🛑',
    desc: 'Press <kbd class="lesson-kbd">Space</kbd> to brake and keep your speed under 0.2 m/s.',
    btnText: '<span class="btn-icon">👉</span> Press <kbd>Space</kbd> <span>(Brake 🛑)</span>',
    okText: 'Excellent! Speed must always stay below 0.2 m/s before docking.',
    simKey: 'Space'
  }
];

let lessonIndex = 0, lessonActive = false, lessonStepCompleted = false, lessonAdvanceTimer = null, lessonCompletedOnce = false, slowAlertUntil = 0, lastDockZone = '';

function renderLessonStep(index) {
  if (autodock) {
    closeFlightLesson();
    return;
  }
  const step = FLIGHT_LESSON_STEPS[index];
  if (!step) return;
  lessonStepCompleted = false;
  const badgeEl = $('lesson-badge-text');
  if (badgeEl) badgeEl.textContent = `PRACTICE · ${step.step} / ${FLIGHT_LESSON_STEPS.length}`;
  const titleEl = $('lesson-step-title');
  if (titleEl) titleEl.textContent = step.title;
  const descEl = $('lesson-step-desc');
  if (descEl) descEl.innerHTML = step.desc;
  const keyBtn = $('lesson-key-btn');
  if (keyBtn) keyBtn.innerHTML = step.btnText;
  const promptAction = $('lesson-prompt-action');
  if (promptAction) promptAction.hidden = false;
  const okFeedback = $('lesson-ok-feedback');
  if (okFeedback) okFeedback.hidden = true;
  const lessonEl = $('flight-lesson');
  if (lessonEl) lessonEl.hidden = false;

}

function startFlightLesson() {
  if (autodock) {
    closeFlightLesson();
    return;
  }
  clearTimeout(lessonAdvanceTimer);
  lessonIndex = 0;
  lessonActive = true;
  lessonStepCompleted = false;
  renderLessonStep(0);
  if ($('lesson-btn')) $('lesson-btn').hidden = true;
}

function completeLessonStep() {
  if (!lessonActive || lessonStepCompleted) return;
  const step = FLIGHT_LESSON_STEPS[lessonIndex];
  if (!step) return;
  lessonStepCompleted = true;
  audio.ping();
  const promptAction = $('lesson-prompt-action');
  if (promptAction) promptAction.hidden = true;
  const okFeedback = $('lesson-ok-feedback');
  if (okFeedback) okFeedback.hidden = false;
  const okBadge = okFeedback?.querySelector('.ok-badge');
  if (okBadge) okBadge.textContent = '✅ OK!';
  const okText = $('lesson-ok-text');
  if (okText) okText.textContent = step.okText;
  const nextBtn = $('lesson-next-step-btn');
  if (nextBtn) nextBtn.textContent = lessonIndex < FLIGHT_LESSON_STEPS.length - 1 ? 'Next ➔' : 'Certify & Fly! 🎓';

  clearTimeout(lessonAdvanceTimer);
  lessonAdvanceTimer = setTimeout(() => {
    advanceFlightLesson();
  }, 1600);
}

function advanceFlightLesson() {
  clearTimeout(lessonAdvanceTimer);
  lessonStepCompleted = false;
  lessonIndex++;
  if (lessonIndex < FLIGHT_LESSON_STEPS.length) {
    renderLessonStep(lessonIndex);
  } else {
    showLessonGraduation();
  }
}

function showLessonGraduation() {
  lessonActive = false;
  lessonCompletedOnce = true;
  const badgeEl = $('lesson-badge-text');
  if (badgeEl) badgeEl.textContent = 'PRACTICE COMPLETE';
  const titleEl = $('lesson-step-title');
  if (titleEl) titleEl.textContent = 'Ready to dock';
  const descEl = $('lesson-step-desc');
  if (descEl) descEl.innerHTML = 'Line up the crosshair and slow below <b>0.2 m/s</b>. Dock when it turns green.';
  const promptAction = $('lesson-prompt-action');
  if (promptAction) promptAction.hidden = true;
  const okFeedback = $('lesson-ok-feedback');
  if (okFeedback) okFeedback.hidden = false;
  const badge = okFeedback?.querySelector('.ok-badge');
  if (badge) badge.textContent = '🎓 CERTIFIED!';
  const okText = $('lesson-ok-text');
  if (okText) okText.textContent = 'Flight controls checked.';
  const nextBtn = $('lesson-next-step-btn');
  if (nextBtn) {
    nextBtn.textContent = "Let's Dock! 🚀";
    nextBtn.onclick = () => closeFlightLesson();
  }
  const dots = $('lesson-dots')?.children || [];
  for (let i = 0; i < dots.length; i++) dots[i].className = 'dot done';
  lessonAdvanceTimer = setTimeout(closeFlightLesson, 4500);
}

function closeFlightLesson() {
  clearTimeout(lessonAdvanceTimer);
  lessonActive = false;
  if ($('flight-lesson')) $('flight-lesson').hidden = true;
  if ($('lesson-btn') && m.phase === 'docking' && !autodock) $('lesson-btn').hidden = false;
}

function start(saved=null){if(!saved)orbitalAge=0;m=saved||createOrbit({randomizeDock:true});started=true;completionShown=false;overview=m.phase==='overview';dockingSceneActive=false;dockedExteriorView=false;explosionActive=false;explosionGroup.visible=false;cameraShake=0;shuttle.rotation.set(0,Math.PI,0);lastKnownBumps=m.dock?m.dock.bumps:0;const expAlert=$('dock-explosion-alert');if(expAlert){expAlert.hidden=true;expAlert.classList.remove('fade-out');}const expFlash=$('explosion-screen-flash');if(expFlash){expFlash.classList.remove('active');}dockClamps.forEach(arm=>{arm.rotation.x=.45;});dockLeds.forEach(led=>{led.material.color.setHex(0x16343d);led.material.emissive.setHex(0x08191f);led.material.emissiveIntensity=0.2;});dockRingLight.intensity=0;vaporRing.material.opacity=0;rcsPlumes.forEach(p=>{p.material.opacity=0;});const barTop=$('cinematic-bar-top'),barBottom=$('cinematic-bar-bottom'),cutsceneHud=$('docking-cinematic-hud');if(barTop)barTop.classList.remove('active','fade-out');if(barBottom)barBottom.classList.remove('active','fade-out');if(cutsceneHud)cutsceneHud.hidden=true;$('opening').hidden=true;$('opening-stamp').hidden=true;$('hud').hidden=false;$('controls-hint').classList.remove('controls-faded');clearTimeout(controlsFadeTimer);controlsFadeTimer=setTimeout(()=>$('controls-hint').classList.add('controls-faded'),30000);audio.paused=false;audio.start();radio.stop();audio.update('orbit');syncSound();player.position.set(0,1.68,14);player.view='third';view='third';player.yaw=0;player.pitch=-.03;lastPhase='';closeModal();renderHud();if(m.complete)complete();else radio.say('arrival');save();if(!saved&&m.phase==='overview')showDockingBriefing();if(m.phase==='docking'&&!lessonCompletedOnce&&!autodock)startFlightLesson();}
function restart(){clearInput();paused=false;audio.paused=false;clearApproach();start();save();}
function run(action,choice){m.position={x:player.position.x,z:player.position.z};const result=actOrbit(m,action,choice);notify(result.message);if(result.ok){if(action==='dock'){playDockingCutscene();return true;}save();audio.ping();const voice={dock:'docked',verify:'relay',board:'lander',descent:'descent'}[action];if(voice)radio.say(voice);if(['station','craft','complete'].includes(m.phase))save();closeModal();if(action==='approach'){if(m.dock.x===1.6&&m.dock.y===.65&&m.dock.distance===34){Object.assign(m.dock,randomDock());}overview=false;if(!lessonCompletedOnce&&!autodock)startFlightLesson();}if(action==='dock'){player.position.set(0,1.68,14);overview=false;view='first';player.view='first';}if(action==='verify'){station.dish.rotation.z=0;station.dish.rotation.x=.3;}}renderHud();return result.ok;}
function interact(){if(!started||paused||!$('modal').hidden)return;if(dockedExteriorView){boardCabin();return;}const task=orbitalTask(m);if(m.phase==='docking'){if(!dockReady(m.dock)){const d=m.dock,fast=Math.abs(d.speed)>.205,unaligned=Math.abs(d.x)>.35||Math.abs(d.y)>.35,tooFar=d.distance>2.2;if(!tooFar){d.distance=5;d.speed=-0.25;d.bumps++;triggerDockingExplosion(fast&&unaligned?'speed and alignment':fast?'speed':'alignment');return;}if(fast&&unaligned)notify('Too fast and not lined up! Slow down below 0.2 m/s and center the cross.');else if(fast)notify('Too fast! Slow down below 0.2 m/s (press Space to brake).');else if(unaligned)notify('Not lined up! Center the cross (A/D and R/F) before docking.');else notify(`Fly closer! Get inside 2 m to dock (currently ${d.distance.toFixed(1)} m).`);return;}run('dock');return;}if(m.phase==='station'&&Math.hypot(player.position.x-task.target.x,player.position.z-task.target.z)>2.5){notify('Follow the orange marker, or press Show me the way.');return;}
  if(task.action==='brief'){radio.say('brief');showModal('Next stop: Meridian base!',`<p><strong>Elena Reyes:</strong> “Jin, I have a job for you. Fix our radio antenna. Pack your kit. Then fly the lander down to the base. Amara will meet you there.”</p><p>The antenna motor is broken. Here is the plan: 1. Find the broken part. 2. Turn off power to just that part. 3. Fix it. 4. Test it. Keep the air machines on the whole time!</p><p>You are <strong>Jin Park, the engineer</strong>. Three more crew are waiting on Mars.</p>`,[{label:'Got it!',primary:true,run:()=>run('brief')}]);return;}
  if(task.action==='diagnose'){showModal('What is broken? Look first.',`<dl><dt>Station power</dt><dd>OK</dd><dt>Antenna motor</dt><dd>Working too hard!</dd><dt>Radio</dt><dd>Keeps cutting out</dd><dt>Air machines</dt><dd>OK</dd></dl><p>Which part needs fixing?</p>`,[{label:'The antenna motor',primary:true,run:()=>run('diagnose','pointing')},{label:'The air machines',run:()=>run('diagnose','habitat')},{label:'Look again later',run:closeModal}]);return;}
  if(task.action==='isolate'){showModal('Keep the air machines on!',`<p>The antenna motor has its own power switch. Turn off just that one, so it is safe to fix.</p><dl><dt>Station power and air</dt><dd>OK · keep on</dd><dt>Antenna motor</dt><dd>Broken</dd></dl>`,[{label:'Turn off the antenna motor',primary:true,run:()=>run('isolate','antenna')},{label:'Turn off all station power',run:()=>run('isolate','habitat')},{label:'Back',run:closeModal}]);return;}
  if(task.action)run(task.action);
}
function complete(){if(completionShown)return;completionShown=true;save();completeChapter('orbit',{outcome:'Arrival qualified',assisted:m.guided});radio.say('touchdown');showModal('You landed! Welcome to Meridian.',`
  <p>You docked, fixed the radio, packed your kit and checked the lander. Great job!</p>
  <dl><dt>Docking</dt><dd>${m.guided?'With help':'By yourself'}</dd><dt>Jobs done</dt><dd>9 / 9</dd><dt>Radio</dt><dd>Working</dd><dt>Landed at</dt><dd>Meridian base</dd></dl>
  <div class="kid-lesson-box">
    <span class="lesson-badge">🎓 Space Science Lesson</span>
    <h3>What We Learned in Mars Orbit</h3>
    <p><b>🌟 The Big Space Idea:</b> Orbiting spacecraft need steady radio contact to act as relays, passing messages between surface rovers and Earth!</p>
    <div class="lesson-fact">
      <b>🚀 Real NASA Science:</b> Real NASA orbiters like the Mars Reconnaissance Orbiter (MRO) fly around Mars every 2 hours. Just like friends passing a note, rovers on the surface beam pictures up to orbiters, which beam them across deep space to Earth! <a href="https://science.nasa.gov/resource/mars-report-dust-storms/" target="_blank" rel="noopener">Learn more at NASA</a>
    </div>
    <p><b>💡 Your Astronaut Skill:</b> Find the broken part first, turn off only that circuit, and test your fix before locking up.</p>
  </div>
  <p><strong>What next?</strong> Tomorrow a dust storm comes. Help keep the base safe in <em>Before the Storm</em>.</p>`,[{label:'Continue · Before the Storm',primary:true,run:()=>goToChapter('storm')},{label:'Look around the station again',run:()=>{radio.stop();m.phase='station';m.complete=false;completionShown=false;player.position.set(0,1.68,14);closeModal();}},{label:'Play again',run:restart}],'YOU DID IT!');}
function dockingGuidance(d){
  if(dockReady(d))return '✅ READY! Press E or click Dock button';
  const hints=[];
  if(Math.abs(d.speed)>.205)hints.push(`🛑 Space (Brake: ${(Math.abs(d.speed)-0.2).toFixed(2)} m/s over limit)`);
  else if(d.distance>2)hints.push(`🚀 W (Fly ${(d.distance-2).toFixed(1)} m closer)`);
  if(d.x>.35)hints.push(`⬅️ Hold A: ${d.x.toFixed(1)} m Left (~${Math.max(1,Math.round(d.x/0.75))}s)`);
  else if(d.x<-.35)hints.push(`➡️ Hold D: ${Math.abs(d.x).toFixed(1)} m Right (~${Math.max(1,Math.round(Math.abs(d.x)/0.75))}s)`);
  else hints.push('↔️ Left/Right: Centered ✅');
  if(d.y>.35)hints.push(`⬇️ Hold F: ${d.y.toFixed(1)} m Down (~${Math.max(1,Math.round(d.y/0.6))}s)`);
  else if(d.y<-.35)hints.push(`⬆️ Hold R: ${Math.abs(d.y).toFixed(1)} m Up (~${Math.max(1,Math.round(Math.abs(d.y)/0.6))}s)`);
  else hints.push('↕️ Up/Down: Level ✅');
  return hints.join(' · ');
}
function renderHud(){if(!started)return;
  const canSwitch = !dockedExteriorView && !dockingSceneActive && ['docking','station','craft'].includes(m.phase);
  $('view').hidden = !canSwitch;
  $('orbit-overview').hidden = m.phase !== 'docking' || dockingSceneActive;
  $('orbit-overview').textContent = overview ? 'Back to ship' : 'Orbit overview';
  $('pause').hidden = m.complete || dockingSceneActive;
  $('zoom-in').hidden = m.phase === 'descent' || dockingSceneActive;
  $('zoom-out').hidden = $('zoom-in').hidden;
  if (canSwitch) showCameraView($('view'), m.phase === 'station' ? player.view : view);
if(dockedExteriorView){$('progress').replaceChildren();for(const [i,text]of ['01 DOCK','02 FIX','03 PACK','04 LAND'].entries()){const item=document.createElement('span');item.textContent=text;item.className=i===0?'current':'';$('progress').append(item);}$('step-label').textContent='01 / 04 · DOCKED AT ASTERIA';$('task-title').textContent='Docking Complete · Hatch Ready';$('task-instruction').innerHTML='<b>🎉 Docking successful!</b> Clamps are locked and pressure is equalized. Open the hatch and enter the cabin to begin station repairs.';$('action').hidden=false;$('action').disabled=false;$('action').textContent='🚀 Open hatch & enter cabin';$('action').onclick=()=>boardCabin();$('location').textContent='ASTERIA SPACE STATION · DOCKED';$('readout').textContent='DOCKING CLAMP LOCKED ✅ · 101.3 kPa';$('subreadout').textContent='PORT 01 SEALED · ATMOSPHERE EQUALIZED';$('controls-hint').textContent='DRAG LOOK · WHEEL ZOOM · CLICK "OPEN HATCH" OR PRESS E TO ENTER CABIN';return;}const task=orbitalTask(m);$('progress').replaceChildren();for(const [i,text]of ['01 DOCK','02 FIX','03 PACK','04 LAND'].entries()){const item=document.createElement('span');item.textContent=text;item.className=task.stage===i+1?'current':task.stage>i+1?'done':'';$('progress').append(item);}$('step-label').textContent=`${String(Math.min(task.stage,4)).padStart(2,'0')} / 04 · ${m.phase==='station'?'JIN PARK / ASTERIA':m.phase==='complete'?'OUTPOST MERIDIAN':'CREW TRANSFER VEHICLE'}`;$('task-title').textContent=task.title;
  if(m.phase==='docking'){const d=m.dock;if(dockReady(d)){$('task-instruction').innerHTML='<b>🎉 All lined up and slow!</b> Press <b>E</b> or click <b>Dock</b> below to lock onto Asteria.';}else{const items=[];if(d.x>.35)items.push(`⬅️ <b>Hold A</b> to move <b>${d.x.toFixed(1)} m Left</b> (~${Math.max(1,Math.round(d.x/0.75))} sec)`);else if(d.x<-.35)items.push(`➡️ <b>Hold D</b> to move <b>${Math.abs(d.x).toFixed(1)} m Right</b> (~${Math.max(1,Math.round(Math.abs(d.x)/0.75))} sec)`);else items.push('✅ <b>Left/Right:</b> Centered');if(d.y>.35)items.push(`⬇️ <b>Hold F</b> to move <b>${d.y.toFixed(1)} m Down</b> (~${Math.max(1,Math.round(d.y/0.6))} sec)`);else if(d.y<-.35)items.push(`⬆️ <b>Hold R</b> to move <b>${Math.abs(d.y).toFixed(1)} m Up</b> (~${Math.max(1,Math.round(Math.abs(d.y)/0.6))} sec)`);else items.push('✅ <b>Up/Down:</b> Level');if(Math.abs(d.speed)>.205)items.push(`🛑 <b>Press Space</b> to brake below 0.2 m/s (currently <b>${d.speed.toFixed(2)} m/s</b>)`);else if(d.distance>2)items.push(`🚀 <b>Tap W</b> to fly closer (currently <b>${d.distance.toFixed(1)} m</b>, need under 2 m)`);$('task-instruction').innerHTML=items.map(s=>`<div>• ${s}</div>`).join('');}}else{$('task-instruction').textContent=task.instruction;}
  $('task-instruction').hidden=false;$('action').textContent=task.label||'';$('action').hidden=!task.action;$('guide').hidden=m.phase!=='station';$('assist').hidden=m.phase!=='docking'||dockReady(m.dock);$('assist').textContent=autodock?'Docking help is on':'Help me dock';$('skip').hidden=m.phase!=='descent';
  if($('lesson-btn')) $('lesson-btn').hidden = m.phase!=='docking'||lessonActive||autodock;
  const distance=task.target?Math.hypot(player.position.x-task.target.x,player.position.z-task.target.z):0;$('distance').textContent=task.target?`📍 Next Stop: ${task.place||'Lander door'} · ${distance.toFixed(1)} m away ${distance<=2.5?'· [Press E to use]':'· [Click "Show me the way" to walk]'}`:m.phase==='docking'?(dockReady(m.dock)?'✅ All lined up and slow! Press E to dock.':autodock?'Docking help is steering and braking. Wait for the green crosshair.':Math.abs(m.dock.speed)>.205?'⚠️ Too fast! Tap Space to brake below 0.2 m/s.':(m.dock.distance>2?'Press W to approach Asteria station · Keep speed below 0.2 m/s':'Line up crosshair with station · Press E when ready')):m.phase==='overview'?'Look at Mars below · Click "Start flying" to fly toward Asteria station':m.phase==='craft'?'BUCKLED IN · FINAL LANDER CHECKS':'';$('action').disabled=m.phase==='station'?distance>2.5:m.phase==='docking'?!dockReady(m.dock):false;
  $('location').textContent=m.phase==='station'?'ASTERIA SPACE STATION':m.phase==='docking'?'DOCKING':m.phase==='craft'?'LANDER · GETTING READY':'FLYING AROUND MARS';$('readout').textContent=m.phase==='docking'?`${m.dock.distance.toFixed(1)} m to port  /  ${m.dock.speed.toFixed(2)} m/s (MAX 0.20)`:m.phase==='station'?`RADIO ${m.checks.verify?'WORKING':m.checks.isolate&&!m.checks.verify?'POWER OFF':'BROKEN'}`:m.phase==='craft'?`CHECKS ${Number(m.checks.guidance)+Number(m.checks.propulsion)} / 2`:'ASTERIA / MARS';
  const is2mReady=m.phase==='docking'&&m.dock.distance<=2.05&&dockReady(m.dock);
  const isSlowAlert=m.phase==='docking'&&((m.dock.distance<=10.5&&Math.abs(m.dock.speed)>.205)||performance.now()<slowAlertUntil);
  const ro=$('readout');
  if(ro){
    if(is2mReady){
      ro.style.color='#3ee6b5';
      ro.style.textShadow='0 0 14px rgba(62,230,181,0.95)';
    }else if(isSlowAlert){
      ro.style.color='#ff4d6d';
      ro.style.textShadow='0 0 12px rgba(255,77,109,0.9)';
    }else{
      ro.style.color='';
      ro.style.textShadow='';
    }
  }
  $('subreadout').textContent=m.phase==='docking'?(autodock&&!dockReady(m.dock)?'Docking help is steering and braking.':dockingGuidance(m.dock)):m.phase==='station'?(task.place?`📍 Target: ${task.place} · Follow the orange ring`:'Station is safe'):'IN SUNLIGHT ABOVE MARS';$('controls-hint').textContent=m.phase==='station'?'WASD MOVE · ⬅️/➡️ TURN VIEW · DRAG LOOK · E USE · V VIEW · WHEEL ZOOM · ESC PAUSE':m.phase==='docking'?'W/S FORWARD · A/D SIDEWAYS · R/F UP/DOWN · SPACE BRAKE · MAX 0.2 m/s · E DOCK':'DRAG LOOK · WHEEL ZOOM · DETAILS FOR HELP · ESC PAUSE';
  const reticle=$('reticle');if(reticle){const ready=m.phase==='docking'&&dockReady(m.dock);reticle.style.color=ready?'#5efc8d':'#dce5dc70';reticle.style.transform=ready?'translate(-50%,-50%) scale(1.6)':'translate(-50%,-50%) scale(1)';}}
function toggleView() {
  if ($('view').hidden || !$('modal').hidden) return;
  if (m.phase === 'station') player.toggleView();
  else {
    view = view === 'first' && !overview ? 'third' : 'first';
    overview = false;
    camera.fov = 52;
    camera.updateProjectionMatrix();
  }
  renderHud();
}
function changeZoom(direction){if(!ready||!$('modal').hidden)return;if(m.phase==='station'&&!dockedExteriorView){if(player.view==='third'){zoom=T.MathUtils.clamp(zoom+direction*.45,1.2,5);player.thirdPersonDistance=zoom;}else{camera.fov=T.MathUtils.clamp(camera.fov+direction*4,35,78);camera.updateProjectionMatrix();}}else if((m.phase==='craft'||m.phase==='docking')&&!overview&&view==='first'){camera.fov=T.MathUtils.clamp(camera.fov+direction*4,35,78);camera.updateProjectionMatrix();}else if((m.phase==='docking'||dockedExteriorView)&&!overview){craftZoom=T.MathUtils.clamp(craftZoom+direction*1.5,5,30);}else{overviewDistance=T.MathUtils.clamp(overviewDistance+direction*350,4000,11000);}}
$('begin').onclick=()=>start();$('resume').onclick=()=>{let saved;try{saved=restoreOrbit(localStorage);}catch{}if(saved)start(saved);};$('action').onclick=()=>{document.activeElement?.blur();interact();};$('guide').onclick=()=>{const task=orbitalTask(m);if(task.target&&m.phase==='station'){player.enabled=true;const ok=player.navigate(task.target,task.target);notify(ok?'Walking you there. Press WASD to take over.':'The way is blocked. Move to the middle hall and try again.');}document.activeElement?.blur();};$('assist').onclick=()=>{autodock=!autodock;m.guided=true;if(autodock){closeFlightLesson();if($('lesson-btn'))$('lesson-btn').hidden=true;}notify(autodock?'Docking help is on. The computer will fly slowly.':'Docking help is off. You are flying!');renderHud();document.activeElement?.blur();};$('details').onclick=()=>{details=!details;$('details').setAttribute('aria-expanded',String(details));$('objective').classList.toggle('expanded',details);clearTimeout(detailsCollapseTimer);if(details)detailsCollapseTimer=setTimeout(()=>{details=false;$('objective').classList.remove('expanded');$('details').setAttribute('aria-expanded','false');renderHud();},5000);renderHud();};$('zoom-in').onclick=()=>{changeZoom(-1);document.activeElement?.blur();};$('zoom-out').onclick=()=>{changeZoom(1);document.activeElement?.blur();};$('sound').onclick=()=>{audio.start();audio.setMuted(!audio.muted);syncSound();if(!audio.muted)audio.ping();document.activeElement?.blur();};syncSound();$('radio-skip').onclick=()=>radio.stop();$('radio-replay').onclick=()=>radio.replay();$('station-overview-marker').onclick=()=>{if(!started)start();if(m.phase==='overview')run('approach');else{overview=false;renderHud();}};$('help').onclick=help;$('atlas').onclick=atlas;$('pause').onclick=togglePause;$('view').onclick=toggleView;$('orbit-overview').onclick=()=>{overview=!overview;renderHud();};$('skip').onclick=()=>{if(m.phase==='descent'){advanceOrbit(m,16);complete();}};
if($('lesson-key-btn'))$('lesson-key-btn').onclick=()=>{if(!lessonActive||lessonStepCompleted)return;const step=FLIGHT_LESSON_STEPS[lessonIndex];if(step){const k=step.simKey;keys.add(k);setTimeout(()=>keys.delete(k),350);completeLessonStep();}};
if($('lesson-next-step-btn'))$('lesson-next-step-btn').onclick=()=>{if(lessonIndex>=FLIGHT_LESSON_STEPS.length-1)showLessonGraduation();else advanceFlightLesson();};
if($('lesson-skip-btn'))$('lesson-skip-btn').onclick=closeFlightLesson;
if($('lesson-btn'))$('lesson-btn').onclick=()=>{startFlightLesson();document.activeElement?.blur();};
if($('dock-slow-alert'))$('dock-slow-alert').onclick=()=>{if(m.phase==='docking'&&dockReady(m.dock))interact();};
installHudPresentation({hud:$('hud'),toolbar:document.querySelector('header nav'),onHelp:help,onJourney:openJourney,menu:$('menu-controls')});
renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();changeZoom(Math.sign(e.deltaY));},{passive:false});renderer.domElement.addEventListener('pointerdown',e=>{if(e.button===0&&m.phase!=='station'&&$('modal').hidden)drag={x:e.clientX,y:e.clientY};});addEventListener('pointerup',()=>drag=null);addEventListener('pointermove',e=>{if(!drag)return;overviewYaw-=(e.clientX-drag.x)*.004;overviewPitch=T.MathUtils.clamp(overviewPitch+(e.clientY-drag.y)*.003,-.55,1.2);drag={x:e.clientX,y:e.clientY};});
addEventListener('keydown',e=>{if(pipLessonOpen()||['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)||!started)return;if(dockingSceneActive){if(e.code==='Space'||e.code==='Enter'||e.code==='Escape'){e.preventDefault();finishDockingScene();}return;}if(dockedExteriorView&&e.code==='KeyE'){e.preventDefault();boardCabin();return;}if(!$('modal').hidden)return;if(lessonActive&&!lessonStepCompleted){const step=FLIGHT_LESSON_STEPS[lessonIndex];if(step&&step.keys.includes(e.code))completeLessonStep();}else if(lessonActive&&lessonStepCompleted&&(e.code==='Enter'||e.code==='Space')){e.preventDefault();if(lessonIndex>=FLIGHT_LESSON_STEPS.length-1)showLessonGraduation();else advanceFlightLesson();}if(['KeyW','KeyS','KeyA','KeyD','KeyR','KeyF','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)){e.preventDefault();keys.add(e.code);const wasAutodock=autodock;autodock=false;if(wasAutodock)renderHud();if($('objective').classList.contains('expanded')){$('objective').classList.remove('expanded');details=false;$('details').setAttribute('aria-expanded','false');clearTimeout(detailsCollapseTimer);}}if(e.code==='KeyE'&&!e.repeat&&m.phase!=='station')interact();if(e.code==='KeyV'&&!e.repeat&&m.phase!=='station')toggleView();if(e.code==='Equal'||e.code==='NumpadAdd')changeZoom(-1);if(e.code==='Minus'||e.code==='NumpadSubtract')changeZoom(1);});addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',clearInput);document.addEventListener('visibilitychange',()=>{clearInput();last=performance.now();});
addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();});addEventListener('pagehide',()=>{save();clearInput();cancelAnimationFrame(frameId);radio.stop();audio.dispose();renderer.dispose();});
function frame(now){frameId=requestAnimationFrame(frame);const dt=document.hidden?0:Math.min(.05,(now-last)/1000);last=now;const live=ready&&started&&!paused&&!journeyPaused&&!pipLessonOpen()&&($('modal').hidden||dockingSceneActive);if(ready&&(!started||live)){orbitalAge+=dt;env.update(dt*(reduced?.25:1));}
  if(live){if(dockingSceneActive){const elapsed=(now-dockingSceneStartTime)/1000;if(elapsed>=5.0){finishDockingScene();}else if(elapsed<1.8){const p1=Math.min(1,elapsed/1.7),e1=Math.sin(p1*Math.PI/2);shuttle.position.x=dockStartPos.x*(1-e1);shuttle.position.y=2.2+dockStartPos.y*(1-e1);shuttle.position.z=(26.2+dockStartPos.distance)*(1-e1)+25.07*e1;const camTarget=new T.Vector3(-5.6,3.8,23.8);camera.position.lerpVectors(camStartPos,camTarget,e1);const lookInterface=new T.Vector3(0,2.2,21.0);const curLook=camStartTarget.clone().lerp(lookInterface,e1);camera.lookAt(curLook);const pulse=Math.sin(elapsed*16)>0.1?.75:0;rcsPlumes.forEach(p=>{p.material.opacity=pulse*(1-p1);});const ledIdx=Math.floor(elapsed*12)%12;dockLeds.forEach((led,i)=>{const act=(i===ledIdx||i===(ledIdx+6)%12);led.material.color.setHex(act?0x3ee6b5:0x16343d);led.material.emissive.setHex(act?0x3ee6b5:0x08191f);led.material.emissiveIntensity=act?2.2:.2;});const spd=Math.max(0,dockStartPos.speed*(1-e1)).toFixed(2),dst=Math.max(0,dockStartPos.distance*(1-e1)).toFixed(2);const speedEl=$('cutscene-speed'),distEl=$('cutscene-dist');if(speedEl)speedEl.textContent=`${spd} m/s`;if(distEl)distEl.textContent=`${dst} m`;}else if(elapsed<3.4){shuttle.position.set(0,2.2,25.07);rcsPlumes.forEach(p=>{p.material.opacity=0;});const cp=Math.min(1,Math.max(0,(elapsed-1.8)/.7)),cpEase=cp*cp*(3-2*cp);dockClamps.forEach(arm=>{arm.rotation.x=.45*(1-cpEase)-.08*cpEase;});if(elapsed>=2.2){if(!clampAudioPlayed){audio.dockLock();clampAudioPlayed=true;}dockLeds.forEach(led=>{led.material.color.setHex(0x3ee6b5);led.material.emissive.setHex(0x3ee6b5);led.material.emissiveIntensity=3;});dockRingLight.intensity=3.5;const vp=Math.min(1,(elapsed-2.2)/.8);vaporRing.scale.setScalar(1+vp*.45);vaporRing.material.opacity=Math.max(0,(1-vp)*.75);}const p2Norm=Math.min(1,(elapsed-1.8)/1.6);camera.position.lerpVectors(new T.Vector3(-5.6,3.8,23.8),new T.Vector3(-4.2,3.3,22.8),p2Norm);camera.lookAt(0,2.2,21.0);const pressRatio=Math.min(1,Math.max(0,(elapsed-2.2)/1.5));const kpa=(pressRatio*101.3).toFixed(1);const pressFill=$('cutscene-pressure-fill'),pressVal=$('cutscene-pressure-val');if(pressFill)pressFill.style.width=`${pressRatio*100}%`;if(pressVal)pressVal.textContent=`${kpa} kPa`;const titleEl=$('cutscene-title'),descEl=$('cutscene-desc'),clampsEl=$('cutscene-clamps');if(titleEl)titleEl.textContent='🔒 HARD CAPTURE CONFIRMED · CLAMPS LOCKED';if(descEl)descEl.textContent='Magnetic latches engaged · 4 / 4 mechanical clamps locked tight!';if(clampsEl)clampsEl.textContent=cp>=1?'LOCKED (4/4) ✅':'ENGAGING (2/4)';const s1=$('cutscene-step-1'),s2=$('cutscene-step-2'),s3=$('cutscene-step-3');if(s1)s1.className='dock-step-pill done';if(s2)s2.className='dock-step-pill active';if(s3)s3.className='dock-step-pill';const spdEl=$('cutscene-speed'),dstEl=$('cutscene-dist');if(spdEl)spdEl.textContent='0.00 m/s';if(dstEl)dstEl.textContent='0.00 m';}else{shuttle.position.set(0,2.2,25.07);dockClamps.forEach(arm=>{arm.rotation.x=-.08;});dockLeds.forEach(led=>{led.material.color.setHex(0x3ee6b5);led.material.emissive.setHex(0x3ee6b5);led.material.emissiveIntensity=3;});dockRingLight.intensity=3;vaporRing.material.opacity=0;const pressFill=$('cutscene-pressure-fill'),pressVal=$('cutscene-pressure-val');if(pressFill)pressFill.style.width='100%';if(pressVal)pressVal.textContent='101.3 kPa (SAFE)';const p3Norm=Math.min(1,(elapsed-3.4)/1.6);camera.position.lerpVectors(new T.Vector3(-4.2,3.3,22.8),new T.Vector3(-6.6,4.2,26.2),p3Norm);camera.lookAt(0,2.2,21.0);if(!elenaRadioPlayed){radio.say('docked');elenaRadioPlayed=true;}const titleEl=$('cutscene-title'),descEl=$('cutscene-desc'),clampsEl=$('cutscene-clamps');if(titleEl)titleEl.textContent='✅ AIRLOCK SEALED · DOCKING COMPLETE!';if(descEl)descEl.textContent='Pressure equalized (101.3 kPa). Welcome aboard Asteria Station!';if(clampsEl)clampsEl.textContent='LOCKED (4/4) ✅';const s1=$('cutscene-step-1'),s2=$('cutscene-step-2'),s3=$('cutscene-step-3');if(s1)s1.className='dock-step-pill done';if(s2)s2.className='dock-step-pill done';if(s3)s3.className='dock-step-pill active done';}}advanceOrbit(m,dt);if(m.phase==='docking'&&!dockingSceneActive){
    if(autodock){
      if(lessonActive||($('flight-lesson')&&!$('flight-lesson').hidden))closeFlightLesson();
      if($('lesson-btn')&&!$('lesson-btn').hidden)$('lesson-btn').hidden=true;
    }
    const input=autodock?guidedDock(m.dock):{thrust:Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown')),side:Number(keys.has('KeyD')||keys.has('ArrowRight'))-Number(keys.has('KeyA')||keys.has('ArrowLeft')),lift:Number(keys.has('KeyR'))-Number(keys.has('KeyF')),brake:keys.has('Space')};const feedback=stepDock(m.dock,input,dt);if(feedback)notify(feedback);
    const d=m.dock;if(d.bumps>lastKnownBumps){lastKnownBumps=d.bumps;slowAlertUntil=now+4500;triggerDockingExplosion(feedback);}
    let currentZone = '';
    if (d.distance <= 2.05) currentZone = '2m';
    else if (d.distance <= 10.5) currentZone = '10m';
    else currentZone = 'far';
    if (currentZone !== lastDockZone) {
      if ((currentZone === '10m' && Math.abs(d.speed) > .205) || currentZone === '2m') audio.ping();
      lastDockZone = currentZone;
    }

    const alertEl=$('dock-slow-alert');
    if(alertEl){
      const is2mZone = d.distance <= 2.05;
      const is5mZone = d.distance <= 5.5;
      const is10mZone = d.distance <= 10.5;
      const isTooFast = Math.abs(d.speed) > .205;
      const isReadyToDock = dockReady(d);
      const justBumped = now < slowAlertUntil;

      const title = $('slow-alert-title'), desc = $('slow-alert-desc');
      const iconEl = alertEl.querySelector('.slow-alert-icon');

      if (justBumped) {
        alertEl.hidden = false;
        alertEl.className = 'dock-speed-alert-card';
        if (iconEl) iconEl.textContent = '🛑';
        if (title) title.textContent = '🛑 MISTAKE! PUSHED BACK TO 5M!';
        if (desc) desc.innerHTML = 'Too fast or unaligned! Tap <kbd>Space</kbd> to brake below <b>0.2 m/s</b>!';
      } else if (autodock && !isReadyToDock) {
        alertEl.hidden = true;
      } else if (is2mZone) {
        // === 2M DOCKING ZONE ALERT ===
        alertEl.hidden = false;
        if (isReadyToDock) {
          alertEl.className = 'dock-speed-alert-card dock-ready-alert';
          if (iconEl) iconEl.textContent = '🎯';
          if (title) title.textContent = '🎯 2m TO PORT · PRESS (E) TO DOCK!';
          if (desc) desc.innerHTML = 'All lined up and slow! Press <kbd>E</kbd> or click here to lock onto Asteria!';
        } else if (isTooFast) {
          alertEl.className = 'dock-speed-alert-card';
          if (iconEl) iconEl.textContent = '🛑';
          if (title) title.textContent = '🛑 2m TO PORT · BRAKE FIRST!';
          if (desc) desc.innerHTML = `Speed is <b>${Math.abs(d.speed).toFixed(2)} m/s</b>! Tap <kbd>Space</kbd> under <b>0.2 m/s</b>, then press <kbd>E</kbd>!`;
        } else {
          alertEl.className = 'dock-speed-alert-card dock-align-alert';
          if (iconEl) iconEl.textContent = '↔️';
          if (title) title.textContent = '🎯 2m TO PORT · CENTER CROSSHAIR!';
          if (desc) desc.innerHTML = 'Line up with <kbd>A</kbd>/<kbd>D</kbd> and <kbd>R</kbd>/<kbd>F</kbd>, then press <kbd>E</kbd> to dock!';
        }
      } else if (is5mZone && isTooFast) {
        // === 5M SLOW DOWN ALERT ===
        alertEl.hidden = false;
        alertEl.className = 'dock-speed-alert-card';
        if (iconEl) iconEl.textContent = '🛑';
        if (title) title.textContent = '🛑 SLOW DOWN! (5m TO PORT)';
        if (desc) desc.innerHTML = `Speed is <b>${Math.abs(d.speed).toFixed(2)} m/s</b>! Tap <kbd>Space</kbd> to brake under <b>0.2 m/s</b>!`;
      } else if (is10mZone) {
        // === 10M SLOW DOWN ALERT ===
        alertEl.hidden = false;
        if (isTooFast) {
          alertEl.className = 'dock-speed-alert-card';
          if (iconEl) iconEl.textContent = '🛑';
          if (title) title.textContent = '🛑 SLOW DOWN! (10m TO PORT)';
          if (desc) desc.innerHTML = `Approaching station at <b>${Math.abs(d.speed).toFixed(2)} m/s</b>! Tap <kbd>Space</kbd> to slow under <b>0.2 m/s</b>!`;
        } else {
          alertEl.className = 'dock-speed-alert-card dock-amber-alert';
          if (iconEl) iconEl.textContent = '⚠️';
          if (title) title.textContent = '⚠️ 10m APPROACH · KEEP SPEED SLOW';
          if (desc) desc.innerHTML = `Nice flying! Speed is <b>${Math.abs(d.speed).toFixed(2)} m/s</b>. Stay under <b>0.2 m/s</b> as you approach 2m.`;
        }
      } else {
        alertEl.hidden = true;
      }
    }
  }else{const alertEl=$('dock-slow-alert');if(alertEl)alertEl.hidden=true;}if(m.phase==='station'){player.enabled=true;const moved=player.update(dt*.72);if(moved&&$('objective').classList.contains('expanded')){$('objective').classList.remove('expanded');details=false;$('details').setAttribute('aria-expanded','false');clearTimeout(detailsCollapseTimer);}avatar.position.set(player.position.x,0,player.position.z);avatar.rotation.y=player.facing;if(walk&&idle){walk.setEffectiveWeight(moved?1:0);idle.setEffectiveWeight(moved?0:1);}}mixer?.update(dt);if(m.complete)complete();}
  const inside=started&&m.phase==='station'&&!dockingSceneActive&&!dockedExteriorView;station.interior.visible=inside;station.exterior.visible=!inside;shuttle.visible=!inside&&!['descent','complete'].includes(m.phase);avatar&&(avatar.visible=inside&&player.view==='third'&&player.cameraDistance>1.55);player.enabled=live&&inside;audio.paused=paused||journeyPaused||document.hidden;radio.pause(audio.paused);audio.update(!started?'orbit':inside?'station':['craft','descent','complete'].includes(m.phase)?'flight':'orbit');env?.setOverview(!inside&&overview);
  if(m.phase!==lastPhase){lastPhase=m.phase;keys.clear();player.release();player.route=[];camera.fov=52;camera.updateProjectionMatrix();if(m.phase==='station'){player.syncCamera();}if(m.phase==='craft')overview=false;renderHud();}
  if(!inside){const d=m.dock,flyby=!started||m.phase==='overview';station.exterior.position.set(0,2.2,0);if(flyby){const offset=env.orbitOffset.clone().applyAxisAngle(new T.Vector3(0,1,0),reduced?0:orbitalAge*.0015);station.exterior.position.copy(env.planet.position).add(offset);}if(dockingSceneActive){}else if(dockedExteriorView){shuttle.position.set(0,2.2,25.07);const lookAtTarget=new T.Vector3(0,2.2,21.0);camera.position.set(lookAtTarget.x+Math.sin(overviewYaw)*craftZoom,lookAtTarget.y+Math.sin(overviewPitch)*craftZoom*.6+1.2,lookAtTarget.z+Math.cos(overviewYaw)*craftZoom);camera.lookAt(lookAtTarget);}else if(!started||m.phase==='overview'||overview&&m.phase!=='descent'){shuttle.position.set(d.x+station.exterior.position.x,station.exterior.position.y+d.y,26.2+d.distance+station.exterior.position.z);const center=env.overviewTarget,angle=overviewYaw+.3;camera.position.set(center.x+Math.sin(angle)*overviewDistance,center.y+Math.sin(overviewPitch)*overviewDistance*.7,center.z+Math.cos(angle)*overviewDistance);camera.lookAt(center);}else if(m.phase==='descent'){const t=Math.min(1,m.descent/16),target=env.planet.position.clone(),dir=new T.Vector3(-.5,.48,1).normalize();camera.position.copy(target).addScaledVector(dir,env.radius*(1.75-(reduced?0:t)*.735));camera.lookAt(target);$('descent-label').hidden=false;$('descent-phase').textContent=t<.24?'DEORBIT BURN':t<.55?'ENTERING THE AIR':t<.85?'ROCKETS ON · LANDING':'TOUCHDOWN / MERIDIAN';}else{shuttle.position.set(d.x+station.exterior.position.x,station.exterior.position.y+d.y,26.2+d.distance+station.exterior.position.z);const target=shuttle.position.clone().add(new T.Vector3(0,0,-3));camera.position.copy(shuttle.position).add(new T.Vector3(Math.sin(overviewYaw)*craftZoom*.75,craftZoom*.36+overviewPitch*3,craftZoom));camera.lookAt(target);}}
  if(explosionActive){
    const elap=(now-explosionStartTime)/1000;
    if(elap>2.0){
      explosionActive=false;
      explosionGroup.visible=false;
      cameraShake=0;
      shuttle.rotation.set(0,Math.PI,0);
    }else{
      const fbProgress=Math.min(1,elap/.35),fbEase=Math.sin(fbProgress*Math.PI/2);
      fireballInner.scale.setScalar(.2+fbEase*1.8);
      fireballOuter.scale.setScalar(.3+fbEase*2.5);
      fireballInnerMat.opacity=Math.max(0,1-(elap/.4));
      fireballOuterMat.opacity=Math.max(0,1-(elap/.65));

      const swProgress=Math.min(1,elap/.7);
      shockwave.scale.setScalar(.4+swProgress*5.2);
      shockwaveMat.opacity=Math.max(0,(1-swProgress)*.85);

      explosionLight.intensity=Math.max(0,25*(1-elap/.6));

      sparkParticles.forEach(sp=>{
        if(elap<sp.lifetime){
          sp.mesh.position.addScaledVector(sp.velocity,dt);
          sp.velocity.multiplyScalar(.96);
          const sparkRatio=elap/sp.lifetime;
          sp.mat.opacity=Math.max(0,1-sparkRatio);
          sp.mesh.scale.setScalar(sp.baseSize*(1-sparkRatio*.5));
        }else{
          sp.mat.opacity=0;
        }
      });

      smokePuffs.forEach(sm=>{
        if(elap<sm.lifetime){
          sm.mesh.position.addScaledVector(sm.velocity,dt);
          sm.velocity.multiplyScalar(.94);
          const smokeRatio=elap/sm.lifetime;
          sm.mesh.scale.setScalar(.4+smokeRatio*2.8);
          sm.mesh.material.opacity=Math.max(0,(1-smokeRatio)*.55);
        }else{
          sm.mesh.material.opacity=0;
        }
      });

      if(cameraShake>0){
        cameraShake=Math.max(0,cameraShake-dt*1.2);
        const shakeAmp=cameraShake*.45;
        camera.position.x+=(Math.random()-.5)*shakeAmp;
        camera.position.y+=(Math.random()-.5)*shakeAmp;
        camera.position.z+=(Math.random()-.5)*shakeAmp;
      }

      const wobbleDamp=Math.max(0,1-elap/1.5);
      shuttle.rotation.y=Math.PI+Math.sin(elap*24)*shuttleWobbleYaw*wobbleDamp;
      shuttle.rotation.x=Math.sin(elap*20)*shuttleWobblePitch*wobbleDamp;
      shuttle.rotation.z=Math.cos(elap*22)*(shuttleWobbleYaw*.5)*wobbleDamp;
    }
  }
  cockpit.visible=started&&!overview&&view==='first'&&!dockingSceneActive&&!dockedExteriorView&&['docking','craft'].includes(m.phase);
  if(cockpit.visible){
    camera.position.copy(shuttle.position).add(new T.Vector3(0,0,-1.4));
    if(m.phase==='docking') camera.rotation.set(0,0,0);
    else camera.lookAt(env.planet.position);
    cockpit.quaternion.copy(camera.quaternion);
    cockpit.position.copy(camera.position).add(new T.Vector3(0,-1.55,0).applyQuaternion(camera.quaternion));
    shuttle.visible=false;
  }
  if(m.phase!=='descent')$('descent-label').hidden=true;
  const stationMarker=$('station-overview-marker');stationMarker.hidden=inside||!overview||m.phase==='descent';if(!stationMarker.hidden){camera.updateMatrixWorld();const projected=station.exterior.position.clone().project(camera);stationMarker.hidden=projected.z<0||projected.z>1||Math.abs(projected.x)>.9||Math.abs(projected.y)>.85;stationMarker.style.left=`${(projected.x*.5+.5)*innerWidth}px`;stationMarker.style.top=`${(-projected.y*.5+.5)*innerHeight}px`;}
  const targetBox=$('dock-target-box'),alignSvg=$('dock-alignment-svg'),dockLine=$('dock-line'),dockBorderL=$('dock-border-l'),dockBorderR=$('dock-border-r'),dockHLine=$('dock-hline'),dockVLine=$('dock-vline'),centerZone=$('dock-center-zone');
  if(targetBox&&alignSvg){
    const isDocking=started&&!inside&&m.phase==='docking'&&!overview&&!dockingSceneActive&&!dockedExteriorView;
    targetBox.hidden=!isDocking;
    if(centerZone)centerZone.hidden=!isDocking;
    alignSvg.style.display=isDocking?'block':'none';
    if(dockCorridor)dockCorridor.group.visible=isDocking;
    if(isDocking){
      camera.updateMatrixWorld();
      const portWorld=station.exterior.position.clone().add(new T.Vector3(0,0,20.9));
      const projected=portWorld.clone().project(camera);
      if(projected.z>0&&projected.z<1){
        targetBox.hidden=false;
        const px=(projected.x*.5+.5)*innerWidth,py=(-projected.y*.5+.5)*innerHeight,cx=innerWidth*.5,cy=innerHeight*.5;
        targetBox.style.left=`${px}px`;targetBox.style.top=`${py}px`;
        const ready=dockReady(m.dock),aligned=Math.abs(m.dock.x)<=.35&&Math.abs(m.dock.y)<=.35;
        targetBox.classList.toggle('aligned',aligned);
        if(centerZone)centerZone.classList.toggle('aligned',aligned);
        if(dockCorridor)dockCorridor.mat.color.setHex(aligned?0x3ee6b5:0x4cc9ff);
        const zoneSteer=$('dock-zone-steer');
        if(zoneSteer){
          if(ready){zoneSteer.textContent='✅ READY TO DOCK! PRESS E';}
          else if(aligned){zoneSteer.textContent=m.dock.distance>2?`🚀 TAP W: ${(m.dock.distance-2).toFixed(1)}m CLOSER`:'🛑 SPACE: SLOW DOWN (<0.2)';}
          else{
            const directions=[];
            if(m.dock.x>.35)directions.push(`⬅️ HOLD A (${m.dock.x.toFixed(1)}m)`);
            else if(m.dock.x<-.35)directions.push(`➡️ HOLD D (${Math.abs(m.dock.x).toFixed(1)}m)`);
            if(m.dock.y>.35)directions.push(`⬇️ HOLD F (${m.dock.y.toFixed(1)}m)`);
            else if(m.dock.y<-.35)directions.push(`⬆️ HOLD R (${Math.abs(m.dock.y).toFixed(1)}m)`);
            zoneSteer.textContent=directions.join(' · ');
          }
        }
        const targetText=$('dock-target-text');
        if(targetText){
          if(ready){targetText.textContent='🎯 LOCKED · PRESS E TO DOCK';}
          else if(aligned){targetText.textContent=m.dock.distance>2?`LINED UP · FLY ${(m.dock.distance-2).toFixed(1)}m CLOSER (W)`:'LINED UP · SLOW DOWN';}
          else{
            const parts=[];
            if(m.dock.x>.35)parts.push(`⬅️ A: ${m.dock.x.toFixed(1)}m`);
            else if(m.dock.x<-.35)parts.push(`➡️ D: ${Math.abs(m.dock.x).toFixed(1)}m`);
            if(m.dock.y>.35)parts.push(`⬇️ F: ${m.dock.y.toFixed(1)}m`);
            else if(m.dock.y<-.35)parts.push(`⬆️ R: ${Math.abs(m.dock.y).toFixed(1)}m`);
            targetText.textContent=parts.join(' · ') || 'LINE UP HERE ↵';
          }
        }
        const dx=px-cx,dy=py-cy,len=Math.hypot(dx,dy),W=30;
        const nx=len>1?-dy/len:0,ny=len>1?dx/len:0;
        if(dockLine){dockLine.setAttribute('x1',String(cx));dockLine.setAttribute('y1',String(cy));dockLine.setAttribute('x2',String(px));dockLine.setAttribute('y2',String(py));dockLine.setAttribute('stroke',aligned?'#3ee6b5':'#ffd23f');dockLine.setAttribute('stroke-width',aligned?'2.5':'3.5');}
        if(dockBorderL){dockBorderL.setAttribute('x1',String(cx+nx*W));dockBorderL.setAttribute('y1',String(cy+ny*W));dockBorderL.setAttribute('x2',String(px+nx*W));dockBorderL.setAttribute('y2',String(py+ny*W));dockBorderL.setAttribute('stroke',aligned?'rgba(62,230,181,0.75)':'rgba(76,201,255,0.75)');}
        if(dockBorderR){dockBorderR.setAttribute('x1',String(cx-nx*W));dockBorderR.setAttribute('y1',String(cy-ny*W));dockBorderR.setAttribute('x2',String(px-nx*W));dockBorderR.setAttribute('y2',String(py-ny*W));dockBorderR.setAttribute('stroke',aligned?'rgba(62,230,181,0.75)':'rgba(76,201,255,0.75)');}
        if(dockHLine){dockHLine.setAttribute('x1','0');dockHLine.setAttribute('y1',String(py));dockHLine.setAttribute('x2',String(innerWidth));dockHLine.setAttribute('y2',String(py));dockHLine.setAttribute('stroke',aligned?'rgba(62,230,181,0.5)':'rgba(76,201,255,0.4)');}
        if(dockVLine){dockVLine.setAttribute('x1',String(px));dockVLine.setAttribute('y1','0');dockVLine.setAttribute('x2',String(px));dockVLine.setAttribute('y2',String(innerHeight));dockVLine.setAttribute('stroke',aligned?'rgba(62,230,181,0.5)':'rgba(76,201,255,0.4)');}
      }else{targetBox.hidden=true;alignSvg.style.display='none';if(centerZone)centerZone.hidden=true;}
    }
  }
  const task=orbitalTask(m);marker.visible=inside&&!!task.target;if(marker.visible){marker.position.set(task.target.x,.025,task.target.z);const point=new T.Vector3(task.target.x,2.15,task.target.z).project(camera);$('marker').hidden=point.z<0||point.z>1||Math.abs(point.x)>.88||Math.abs(point.y)>.8;$('marker').style.left=`${(point.x*.5+.5)*innerWidth}px`;$('marker').style.top=`${(-point.y*.5+.5)*innerHeight}px`;$('marker-name').textContent=(task.place||'TRANSFER').toUpperCase();}else $('marker').hidden=true;
  if(live&&now-lastSave>2500){save();lastSave=now;}if(started&&now-lastHud>180){renderHud();lastHud=now;}renderer.render(scene,camera);
}
async function load(){try{env=await createOrbitalEnvironment(scene,new GLTFLoader());ready=true;$('begin').disabled=false;$('loading').hidden=true;try{$('resume').hidden=!restoreOrbit();}catch{}frameId=requestAnimationFrame(frame);}catch(error){console.error(error);$('loading').textContent='Something did not load. Please reload the page.';}}
load();
