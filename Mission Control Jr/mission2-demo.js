import {openPipMilestone, pipLessonOpen} from './professor-pip.js';
import {trackPipMilestones} from './professor-pip-milestones.js';
import {startPip} from './companion.js';startPip('rover');
import * as THREE from 'three';
import {connectChapter,completeChapter,goToChapter,openJourney,journeyPaused} from './campaign-bridge.js';
import {attachArrivalContext} from './surface-orbit-link.js';
attachArrivalContext();
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Player, showCameraView} from './player.js';
import {isBlocked} from './navigation.js';
import {ExpeditionAudio} from './mission2-audio.js';
import {HOME,RIDGE,HAZARD,BOUNDS,ROUTES,ROCKS,OUTPOST_SOLIDS,heightAt,surfaceAt,slopeAt,distance,routeLength,routeEnergy,safeReturnPoints} from './expedition-terrain.js';
import {stepRover,blocked} from './rover-controller.js';
import {chapterTuning} from './simulation/difficulty.js';
import {SAVE_KEY,SERVICE,TRAVERSE_QUESTION,applyStormCarry,reportStations,inspectionPoint,task2,createExpedition,act2,advance2,forecast,assessment2,retry,event} from './mission2.js';
import {readJourney} from './journey-state.js';
import {MARS_VISUALS as palette} from './mars-visuals.js';
import {addScenery} from './expedition-scenery.js';
import {REFERENCES,showReference} from './mission2-reference-viewer.js';
import {addExhibits,ROVER_PAD} from './expedition-exhibits.js';
import {installHudPresentation} from './hud-presentation.js';
import {installHiddenScrollUI} from './scroll-ui.js';
installHiddenScrollUI();

const $=id=>document.getElementById(id),keys=new Set(),labels=[],mixers=[],beacons=[];
let m=createExpedition(chapterTuning('rover')),ready=false,view='third',orbitYaw=0,pitch=.15,drag=null,reduced=false,photo=null,planRoute='wash',endingShown=false,actionKey='',hazeSaid=false,hazardSaid=false,slipSaid=false,marginWarned=false,accumulator=0,last=performance.now(),toastTimer,frame=0,inputLockUntil=0,slowFrames=0,performanceMode=false,lastHud=0;
try{applyStormCarry(m,readJourney(localStorage).records.storm?.carry);}catch{/* Storage is optional; the standalone training starts at full rover charge. */}
const journal=[];
let scenery,exhibits,disposeReference,referenceGeneration=0,footSolids=[],cameraBlockers=[],roverZoom=9,walkZoom=5.2,viewFov=57,roverFootprint={minX:8.6,maxX:11.4,minZ:8,maxZ:12};
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.25));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFShadowMap;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=palette.exposure;$('world').appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(palette.background);scene.fog=new THREE.Fog(palette.fog,palette.fogNear,palette.fogFar);
const camera=new THREE.PerspectiveCamera(57,innerWidth/innerHeight,.08,600);scene.add(camera);
scene.add(new THREE.HemisphereLight(palette.sky,palette.groundLight,palette.hemisphere));
const sun=new THREE.DirectionalLight(palette.sun,palette.sunIntensity);sun.position.set(18,24,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-30,right:30,top:30,bottom:-30,near:1,far:140});sun.shadow.bias=-.0004;scene.add(sun,sun.target);
const world=new THREE.Group();scene.add(world);
const audio=new ExpeditionAudio((id,line)=>{$('radio').hidden=false;$('speaker').textContent=line.speaker;$('subtitle').textContent=line.text;journal.unshift({speaker:line.speaker,text:line.text});},()=>{$('radio').hidden=true;});
const player=new Player(camera,renderer.domElement,interact,togglePause,()=>audio.effect(),()=>{view=player.view;applyZoom();});player.thirdPersonDistance=walkZoom;player.bounds={...BOUNDS};player.position.set(6,1.68,12);player.view='third';player.yaw=-.55;player.pitch=-.13;
let rover,astronaut,walkingAvatar,walkingMixer,walkingClips={},seatedDriver,seatedAmara,bayBattery,sampleMesh,scaleMesh,roverWheelTurns=0;
const registry={rover:new URL('./assets/models/rover-crewed.glb',import.meta.url),habitat:new URL('./assets/models/habitat.glb',import.meta.url),crew:new URL('./assets/models/astronaut-animated.glb',import.meta.url),solar:new URL('./assets/models/solar-array.glb',import.meta.url),terminal:new URL('./assets/models/terminal.glb',import.meta.url),junction:new URL('./assets/models/junction.glb',import.meta.url),battery:new URL('./assets/models/battery.glb',import.meta.url),outcrop:new URL('./assets/models/kestrel-outcrop.glb',import.meta.url),scale:new URL('./assets/models/scale-marker.glb',import.meta.url),sample:new URL('./assets/models/field-sample.glb',import.meta.url)};
function clone(gltf,pos=[0,0,0],scale=1,parent=world){const obj=gltf.scene.clone(true);obj.position.set(...pos);obj.scale.setScalar(scale);obj.traverse(o=>{if(o.isMesh)o.castShadow=o.receiveShadow=true;});parent.add(obj);return obj;}
function groundPoint(x,z,offset=0){return new THREE.Vector3(x,heightAt(x,z)+offset,z);}
function label(text,x,z,y=2.5){const el=document.createElement('div');el.className='world-label';el.textContent=text;$('world-labels').append(el);labels.push({el,position:groundPoint(x,z,y)});}
function toast(text){$('toast').textContent=text;$('toast').hidden=false;if(!$('dialog').hidden){let feedback=$('dialog-feedback');if(!feedback){feedback=document.createElement('p');feedback.id='dialog-feedback';feedback.className='reserve-rule';feedback.setAttribute('role','status');$('dialog-body').append(feedback);}feedback.textContent=text;}clearTimeout(toastTimer);toastTimer=setTimeout(()=>{$('toast').hidden=true;},5200);}
function button(text,fn,disabled=false){const b=document.createElement('button');b.textContent=text;b.disabled=disabled;b.onclick=()=>{b.blur();fn();};return b;}
let audioBeforeJourney=false;connectChapter('rover',value=>{if(value){audioBeforeJourney=audio.paused;clearInput();player.enabled=false;audio.pause(true);audio.ctx?.suspend();}else{audio.ctx?.resume().catch(()=>{});audio.pause(audioBeforeJourney);}});
function enabled(){return !pipLessonOpen()&&!journeyPaused&&m.started&&!m.ended&&$('dialog').hidden&&!photo;}
function setInput(){player.enabled=enabled()&&!m.aboard;player.inside=false;}
function clearInput(){keys.clear();player.keys.clear();player.route=[];drag=null;}
function closePhoto(){photo=null;$('photo-frame').hidden=true;applyZoom();}
addEventListener('pagehide',()=>{audio.stop();audio.ctx?.close();clearInput();renderer.dispose();});
function applyZoom(){player.thirdPersonDistance=walkZoom;if(!photo){camera.fov=view==='first'?viewFov:57;camera.updateProjectionMatrix();}}
function zoom(direction){if(!m.started||!$('dialog').hidden||photo)return;if(view==='first')viewFov=THREE.MathUtils.clamp(viewFov+direction*4,35,82);else if(m.aboard)roverZoom=THREE.MathUtils.clamp(roverZoom+direction*1.5,4,22);else walkZoom=THREE.MathUtils.clamp(walkZoom+direction*.7,2.2,10);applyZoom();document.activeElement?.blur();}
let tasksCollapseTimer;
function scheduleTasksCollapse(){clearTimeout(tasksCollapseTimer);if($('mission-panel').classList.contains('expanded'))tasksCollapseTimer=setTimeout(()=>toggleTasks(false),5000);}
function toggleTasks(force){const panel=$('mission-panel'),expanded=force??!panel.classList.contains('expanded');panel.classList.toggle('expanded',expanded);$('tasks-button').setAttribute('aria-pressed',String(expanded));$('tasks-button').setAttribute('aria-expanded',String(expanded));scheduleTasksCollapse();document.activeElement?.blur();}
$('mission-panel').addEventListener('pointermove',()=>{if($('mission-panel').classList.contains('expanded'))scheduleTasksCollapse();});
$('mission-panel').addEventListener('focusin',()=>{if($('mission-panel').classList.contains('expanded'))scheduleTasksCollapse();});
function toggleMap(){const panel=$('map-panel');panel.hidden=!panel.hidden;$('map-button').setAttribute('aria-pressed',String(!panel.hidden));document.activeElement?.blur();}
function help(){
  showDialog('Rover controls',`
    <p><b>Move:</b> WASD or arrows. Drag to look, press V to change the view, or scroll to zoom.</p>
    <p><b>Park:</b> Space stops the rover. P sets or releases the parking brake. Stop before reversing with S. Press E to use equipment or get out when parked.</p>
    <p><b>Find your way:</b> Follow the orange marker. T opens tasks, M opens the map when parked, and F3 hides the HUD for a photo.</p>
    <p><b>Model exhibits:</b> Visit the east equipment pad for robot rovers or the base computer for the model archive and credits.</p>`,
    [{label:'Back to the scene',run:closeDialog}],'CONTROLS / EXHIBITS');
}
function showDialog(title,html,actions,eyebrow='MERIDIAN OPERATIONS'){
  referenceGeneration++;disposeReference?.();disposeReference=null;
  closePhoto();clearInput();player.enabled=false;player.release();audio.pause(true);$('hud').inert=true;$('dialog-title').textContent=title;$('dialog-body').innerHTML=html;$('dialog-eyebrow').textContent=eyebrow;$('dialog-actions').replaceChildren(...actions.map(a=>button(a.label,a.run,a.disabled)));$('dialog').hidden=false;$('dialog-actions').firstElementChild?.focus();
  if(eyebrow==='EXPEDITION DEBRIEF'&&Object.keys(m.frames).length){const gallery=document.createElement('div');gallery.className='observation-gallery';for(const[id,src]of Object.entries(m.frames)){const figure=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');img.src=src;img.alt=id==='context'?'Your captured context image of the Kestrel rock units':'Your captured scaled view of the geological contact';caption.textContent=id==='context'?'CONTEXT / TWO ROCK UNITS':'DETAIL / CONTACT + SCALE';figure.append(img,caption);gallery.append(figure);}$('dialog-body').append(gallery);}
}
function closeDialog(){referenceGeneration++;disposeReference?.();disposeReference=null;clearInput();$('dialog').hidden=true;$('hud').inert=false;audio.pause(false);setInput();}
function togglePause(){if(pipLessonOpen()||!m.started||m.ended)return;if(!$('dialog').hidden){closeDialog();return;}photo=null;$('photo-frame').hidden=true;showDialog('Expedition paused',`${Object.entries(audio.volumes).map(([key,value])=>`<label>${key} volume <input data-volume="${key}" type="range" min="0" max="1" step=".05" value="${value}"></label>`).join('')}<label>Reduce camera motion <input id="reduced" type="checkbox" ${reduced?'checked':''}></label><p>WASD or arrows drive. Space stops. P is the parking brake. E gets in or out. V changes the view. Shift saves battery. M opens the map when parked.</p>`,[{label:'Resume',run:closeDialog},{label:'Restart expedition',run:()=>location.reload()}]);$('dialog-body').querySelectorAll('[data-volume]').forEach(i=>i.oninput=()=>audio.settings({[i.dataset.volume]:Number(i.value)}));$('reduced').onchange=e=>{reduced=e.target.checked;};}
const roverMilestones = trackPipMilestones('rover', m);
function showRoverMilestone() {
  const lesson = roverMilestones.update(m);
  if (!lesson) return;
  queueMicrotask(() => openPipMilestone(lesson, {
    finishLabel: m.ended ? 'See mission report' : 'Continue',
    onOpen: () => { clearInput(); setInput(); audio.pause(true); },
    onClose: () => { setInput(); audio.pause(journeyPaused || (!m.ended && !$('dialog').hidden)); },
  }));
}
function run(type,value){
  if(photo&&type!=='photo')closePhoto();
  m.walker={x:player.position.x,z:player.position.z};const beforeAboard=m.aboard,result=act2(m,type,value);toast(result.message);if(result.line&&!m.ended)audio.say(result.line,['launch','science','return','dock'].includes(type));if(result.ok&&type==='launch')audio.say('ready');if(result.ok&&type==='check'&&value==='battery')audio.say('checks');audio.effect();actionKey='';
  if(result.ok)clearInput();
  if(result.ok&&['brakeTest','launch'].includes(type)){$('target-description').hidden=true;$('details-toggle').setAttribute('aria-expanded','false');if(type==='brakeTest')toast('Driving test passed! Next: pick a path and tell us why.');}
  if(result.ok&&type==='board'){view='third';orbitYaw=0;pitch=.18;inputLockUntil=performance.now()+200;if(m.phase==='test'){$('target-description').hidden=false;$('details-toggle').setAttribute('aria-expanded','true');toast('DRIVING TEST: press P → drive a little and steer → Space to stop → P to park.');}applyZoom();}
  if (result.ok && beforeAboard && !m.aboard) {
    const {x, z, heading} = m.vehicle;
    const side = heading + Math.PI / 2;
    const exit = [3, -3, 3.6, -3.6].map(offset => ({
      x: x + Math.cos(side) * offset, z: z - Math.sin(side) * offset,
    })).find(point => !blocked(point.x, point.z) && !isBlocked(point.x, point.z, player.obstacles, .45));
    if (!exit) {
      m.aboard = true;
      m.driving = true;
      toast('Something is in the way. Park on clear, firm ground.');
    } else {
      player.position.copy(groundPoint(exit.x, exit.z, 1.68));
      player.yaw = heading - Math.PI / 2;
      player.pitch = -.12;
      player.view = view;
    }
  }
  setInput();renderActions();if(m.ended)showEnding();else if(result.ok)showRoverMilestone();return result;
}
function start(){audio.start();$('landing').hidden=true;$('hud').hidden=false;$('mission-panel').hidden=false;toggleTasks(false);$('controls').classList.remove('controls-faded');setTimeout(()=>{if(m.started)$('controls').classList.add('controls-faded');},30000);run('start');showBriefing();setInput();renderActions();}
function showBriefing(){
  const margin=m.returnReserve||20;
  const batteryNote=['survived','evacuated'].includes(m.campaignOutcome)
    ? '<p>The rover battery is low after the storm. Watch your return forecast closely.</p>' : '';
  showDialog('Elena: bring the evidence home.',`
    <div class="briefing-transcript">
      <p><b>Elena Reyes:</b> “Jin, take Amara to Kestrel Ridge. Photograph the rock layers and bring everyone home safely.”</p>
      <p>Start with the rover inspection and driving test, then pick a route. If the ground looks strange, stop and check it.</p>
      <p>Take a wide shot of both rock layers and a close-up with the ruler for scale. The photos show the layers. On their own, they can’t tell you how the layers formed.</p>
    </div>
    <p class="reserve-rule">Aim to get home with at least <b>${margin}% battery and ${margin}% air</b>. Picking up a rock is optional.</p>${batteryNote}`,
    [
      {label:'Get the rover ready',run:()=>{run('acceptBrief');closeDialog();}},
    ],'MARS DAY 16 · TODAY’S PLAN');
}
function referenceArchive(index=0){if(m.aboard||(distance(player.position,SERVICE.comms)>3&&distance(player.position,ROVER_PAD)>6)){toast('Walk to the base computer or the robot rover pad to see the models.');return;}showDialog('Mars model room',`<p>Drag to spin a model. Use the wheel to zoom.</p><div id="reference-tabs" class="reference-tabs"></div><div id="reference-stage" class="reference-stage"></div><div id="reference-credit"></div>`,[{label:'Back to the trip',run:closeDialog}],'MERIDIAN / INTERACTIVE 3D ARCHIVE');
  const choose=async index=>{disposeReference?.();disposeReference=null;const generation=++referenceGeneration,ref=REFERENCES[index];$('reference-credit').innerHTML=`<strong>${ref.name}</strong><p>${ref.caption}</p><p><a href="${ref.source}" target="_blank" rel="noopener">${ref.author} · source model</a> / <a href="${ref.licenseUrl}" target="_blank" rel="noopener">${ref.license}</a></p><p class="fine-print">Display derivative: textures recompressed, geometry statically batched; concept rover presentation floor removed. Original creator/source/license retained. Full details: ASSET-REFERENCES.md.</p>`;try{const cleanup=await showReference($('reference-stage'),index,()=>generation===referenceGeneration&&!$('dialog').hidden);if(generation===referenceGeneration)disposeReference=cleanup;else cleanup();}catch(e){if(generation===referenceGeneration)$('reference-stage').textContent=`This model did not load. Your game is fine.`;}};
  $('reference-tabs').replaceChildren(...REFERENCES.map((r,i)=>button(r.name,()=>choose(i))));choose(index);
}
function inspectExhibit(){if(m.aboard||distance(player.position,ROVER_PAD)>6)return;const display=async id=>{toast('Getting the model ready…');try{await exhibits.setRover(id);closeDialog();toast(`${id==='concept'?'Mars rover concept':'Perseverance'} is now on the pad.`);}catch(e){toast(`This model did not load.`);}};showDialog('Robot rovers at the base',`<p>Pick a robot rover to show on the pad. Then walk around it, or open the spinning view.</p><p>These robots drive by themselves. Jin and Amara ride in their own rover.</p><p>Concept: Gregori Vorontsov, CC BY 4.0. Perseverance: Thomas Flynn, CC0. Source links and modifications are in the detail viewer.</p>`,[{label:'Display rover concept',run:()=>display('concept')},{label:'Display Perseverance',run:()=>display('perseverance')},{label:'Rotate / zoom model & credits',run:()=>referenceArchive(exhibits.current==='concept'?2:1)},{label:'Back to mission',run:closeDialog}],'EAST EQUIPMENT PAD / 21,16');}
function nearVehicle(){return m.aboard||distance(player.position,m.vehicle)<5;}
function requireNear(fn){if(!nearVehicle()){toast('Walk to the rover first.');return;}fn();}
function toggleParking(){document.activeElement?.blur();if(!m.aboard){toast('You are walking. Choose Drive the rover to get in.');return;}if(Math.abs(m.vehicle.speed)>.15){toast('Hold Space to stop first. Then press P.');return;}m.vehicle.parking=!m.vehicle.parking;actionKey='';toast(m.vehicle.parking?'Parking brake set.':'Brake off! Use WASD or arrows to drive.');}
function plan(){const r=run('plan');if(!r.ok)return;showPlan();}
function showPlan(){
  showDialog('Pick a path. Plan the trip home.',`<p>There are three paths to Kestrel Ridge. The map shows the land. But it cannot tell you if the ground is soft.</p><canvas id="plan-map" class="plan-map" width="450" height="380" aria-label="Map of three rover routes and uncertain ground"></canvas><div class="route-grid">${Object.entries(ROUTES).map(([id,r])=>`<button class="route-card ${id===planRoute?'active':''}" data-route="${id}"><b>${r.name}</b><span>${Math.round(routeLength(r.points))} m there · uses about ${Math.ceil(routeEnergy(r.points))}% battery</span><span>${r.surface}</span><span>${r.note}</span></button>`).join('')}</div><p class="reserve-rule">Save at least <strong>${m.returnReserve||20}%</strong> battery and air for when you get home. The numbers are made simple for the game.</p><label for="reason">Why this path?</label><select id="reason" class="reason-select"><option value="evidence">I looked at the ground and hills. I will have battery left, and a backup path.</option><option value="shortest">The shortest path always uses the least battery.</option><option value="longest">The longest path is always the safest.</option><option value="map">The map promises the ground is hard.</option></select><p class="fine-print">When you leave, a message goes to Earth. It takes 12 minutes to get there.</p>`,[{label:'Go! Start driving',run:()=>{const r=run('launch',{route:planRoute,reason:$('reason').value});if(r.ok)closeDialog();}},{label:'Back to the rover',run:()=>{m.phase='prep';closeDialog();actionKey='';}}], 'PLAN YOUR TRIP');
  const prompt=new Option('Pick a reason…','',true,true);$('reason').prepend(prompt);
  const projection=document.createElement('p');projection.id='plan-projection';projection.className='reserve-rule';$('reason').before(projection);
  const updateProjection=()=>{const r=ROUTES[planRoute],f=forecast({...m,vehicle:RIDGE},routeLength(r.points)/2.6+75,routeEnergy(r.points));projection.textContent=`When you get home you will have about ${f.battery.toFixed(0)}% battery and ${f.oxygen.toFixed(0)}% air. Soft ground can use more.`;};
  $('dialog-body').querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>{planRoute=b.dataset.route;$('dialog-body').querySelectorAll('[data-route]').forEach(c=>c.classList.toggle('active',c===b));drawMap($('plan-map'),true);updateProjection();});drawMap($('plan-map'),true);updateProjection();
}
function openMap(){if(Math.abs(m.vehicle.speed)>.05||!m.vehicle.parking){toast('Stop and press P before you open the map.');return;}const f=forecast(m);showDialog('Trip map',`<canvas id="large-map" class="plan-map" width="500" height="460"></canvas><p>Orange: your path. Green: where you drove. Striped circle: ground that might be soft. North is up. The way home is light blue.</p><p class="reserve-rule">At home you will have about <strong>${Math.max(0,f.battery).toFixed(0)}% battery and ${Math.max(0,f.oxygen).toFixed(0)}% air</strong>. Home is ${Math.round(f.metres)} m away. This is a guess, not a promise.</p>`,[{label:'Back to driving',run:closeDialog}]);drawMap($('large-map'),false);}
function openJournal(){if(m.aboard&&Math.abs(m.vehicle.speed)>.05){toast('Park before you read the diary.');return;}showDialog('Trip diary',`<p>Your science jobs: a wide photo of both rocks, a close photo with the ruler, and one thing you saw. Picking up a rock is extra.</p>${m.events.slice(-12).reverse().map(e=>`<div class="event-row">${Math.floor(e.time/60)}:${String(Math.floor(e.time%60)).padStart(2,'0')} · ${e.text}</div>`).join('')}${journal.slice(0,8).map(l=>`<div class="journal-entry"><b>${l.speaker}</b><p>${l.text}</p></div>`).join('')}`, [{label:'Continue expedition',run:closeDialog}]);}
function startPhoto(mode){if(m.aboard||distance(player.position,RIDGE)>17){toast('Get out and walk to the marker by the rocks.');return;}if(mode==='close'&&distance(player.position,RIDGE)>12){toast('Walk closer to the ruler for the close photo.');return;}photo=mode;view='first';player.view='first';player.enabled=true;camera.fov=mode==='close'?35:57;camera.updateProjectionMatrix();$('photo-frame').hidden=false;$('photo-caption').textContent=`${TRAVERSE_QUESTION} · FIELD CAMERA / ${mode==='context'?'BOTH ROCK UNITS':'CONTACT + SCALE'}`;toast('Drag to fit the rocks in the box. Then take the photo.');}
function capture(){
  if(!photo)return;camera.updateMatrixWorld();const targets=photo==='context'?[groundPoint(36,-160,.6),groundPoint(44,-160,1.8)]:[groundPoint(40,-158.2,1),groundPoint(38.8,-157.3,.4)];
  const inFrame=targets.every(t=>{const p=t.clone().project(camera),ray=new THREE.Raycaster(camera.position,t.clone().sub(camera.position).normalize(),.05,camera.position.distanceTo(t));return p.z> -1&&p.z<1&&Math.abs(p.x)<.43&&p.y<.55&&p.y>-.45&&ray.intersectObject(rover,true).length===0;});
  if(!inFrame){toast('Fit the glowing rocks inside the box. Step back for the wide photo. Show the ruler in the close photo.');return;}
  const mode=photo;renderer.render(scene,camera);const thumb=document.createElement('canvas');thumb.width=320;thumb.height=200;thumb.getContext('2d').drawImage(renderer.domElement,0,0,320,200);m.frames[mode]=thumb.toDataURL('image/jpeg',.75);photo=null;$('photo-frame').hidden=true;applyZoom();run('photo',mode);setInput();
}
function describe(){showDialog('What do the photos show?',`<p>Your photos show two kinds of rock touching. Pick what you can really see, so another scientist can check it.</p>`,[{label:'Dark rock under light stripes. We don’t know yet how they formed.',run:()=>{run('describe','evidence');closeDialog();}},{label:'This proves ancient life.',run:()=>run('describe','life')},{label:'Close report',run:closeDialog}],'FIELD SCIENCE / INTERPRETATION');}
function sample(){const f=forecast(m,18,1),margin=m.returnReserve||20;showDialog('Pick up a rock?',`<p>Amara found a small loose rock. Your photos are already done, so this is extra.</p><p>It takes <strong>18 seconds</strong> and <strong>1% battery</strong>.</p><p class="reserve-rule">After that you will have about <strong>${Math.max(0,f.battery).toFixed(0)}% battery and ${Math.max(0,f.oxygen).toFixed(0)}% air</strong> at home. You need ${m.returnReserve||20}% of each.</p><p>Saying no is fine. You still finish the science. To pick it up, stand next to the rock marker.</p>`,[{label:'Pick up the rock',run:()=>{if(distance(player.position,{x:42,z:-156})>4){toast('Walk to the rock marker next to the ruler. Get close to pick it up.');return;}if(run('sample').ok)closeDialog();}},{label:'Save battery · go home',run:()=>{run('return');closeDialog();}},{label:'Back to fieldwork',run:closeDialog}]);audio.say('sample');}
function interact(){if(photo){capture();return;}const b=$('action-buttons').querySelector('button:not(:disabled)')||$('mission-actions').querySelector('button:not(:disabled)');b?.click();}
// Caption-only commander prompt; recorded dialogue line IDs and audio stay unchanged.
function terrainDecision(){const f=forecast(m);showDialog('Amara: this ground looks different from the map!',`<p>The light patch is cracked, with soft dust under it. The wheels could sink. A shortcut might use more battery, or get stuck.</p><p><strong>Elena:</strong> Jin, tell me which way you will go, and why.</p><p class="reserve-rule">At home you will have about ${f.battery.toFixed(0)}% battery and ${f.oxygen.toFixed(0)}% air. You need ${m.returnReserve||20}% of each.</p><p>The ${m.route==='rim'?'east':'west'} edge goes around the soft patch. Pick what to do.</p>`,[{label:'Go around on firm ground',run:()=>{if(run('terrainDecision','perimeter').ok)closeDialog();}},{label:'Cross because it looks shorter',run:()=>run('terrainDecision','cross')},{label:'Turn back · go home safe',run:()=>{if(run('return').ok)closeDialog();}}],'05 / TERRAIN DECISION');}
function performTask(task){
  const actions={briefing:showBriefing,check:()=>run('check',['battery','wheels','camera','comms'].find(id=>!m.checks[id])),plan:()=>m.phase==='planning'?showPlan():plan(),terrainDecision,context:()=>startPhoto('context'),close:()=>startPhoto('close'),describe,sample};
  (actions[task.action]||(()=>run(task.action)))();
}
function walkToTask(task) {
  const {x, z} = task.target;
  const reach = Math.min(task.radius * .6, 2.4);
  const directions = [0, Math.PI / 2, Math.PI, -Math.PI / 2];
  const approach = task.target === m.vehicle
    ? [{x: x + Math.sin(m.vehicle.heading) * 3, z: z + Math.cos(m.vehicle.heading) * 3}]
    : [{x, z}];
  approach.push(...directions.map(angle => ({x: x + Math.cos(angle) * reach, z: z + Math.sin(angle) * reach})));
  const found = approach.some(point => player.navigate(point, task.target));
  toast(found ? 'Walking to the marker. Use WASD or arrows to take over.' : 'The approach is blocked. Use WASD or arrows to go around the equipment.');
}
function renderActions(){
  const task=task2(m),v=m.vehicle,actor=m.aboard?v:player.position,near=!task.target||distance(actor,task.target)<=task.radius;
  $('interaction').hidden=!!photo||(!task.target&&!task.action)||(!!task.target&&!near&&!(!m.aboard&&['prep','postdrive','science','briefing','return'].includes(m.phase)));
  $('target-kind').textContent=`STEP ${String(task.stage).padStart(2,'0')} / 08 · ${m.aboard?'ROVER TWO':'JIN PARK / EVA'}`;
  $('target-title').textContent=task.title;$('target-description').textContent=task.instruction;
  const driveTest=m.phase==='test'&&m.aboard,testReady=v.distance-m.brakeStart>=5&&v.steeringTravel-m.brakeTurn>=.6&&v.parking&&Math.abs(v.speed)<.05;$('drive-coach').hidden=!driveTest;$('drive-coach').textContent=driveTest?`1 Release P → 2 Drive ${Math.min(5,v.distance-m.brakeStart).toFixed(1)}/5 m · steer ${v.steeringTravel-m.brakeTurn>=.6?'✓':'left/right'} → 3 Space stop → 4 P park → 5 Done!`:'';
  const next=targetWaypoint(),bearing=((Math.atan2(next.x-v.x,-(next.z-v.z))*180/Math.PI)%360+360)%360;
  $('task-distance').textContent=m.aboard&&['outbound','return'].includes(m.phase)?`Next marker ${Math.round(distance(v,next))} m · ${Math.round(bearing)}° bearing${near?' · action in range':''}`:task.target?`${Math.round(distance(actor,task.target))} m · ${near?'ready to interact':'follow the orange marker'}`:'Time to choose';
  $('inspect-exhibit').hidden=m.aboard||!exhibits||distance(player.position,ROVER_PAD)>6;
  const key=[task.action,task.label,near,m.aboard,nearVehicle(),v.parking,m.phase,m.sample,m.checks.brakes,m.dataTransferred,testReady,distance(player.position,SERVICE.comms)<3].join('|');if(key===actionKey)return;actionKey=key;
  const actions=[],panel=[],allChecks=['battery','wheels','camera','comms'].every(id=>m.checks[id]);
  if(task.action)actions.push(button(task.label,()=>performTask(task),!near||(driveTest&&!testReady)));
  if(!m.aboard&&task.target&&!near&&['prep','postdrive','science','briefing','return'].includes(m.phase))actions.push(button('Walk to the marker',()=>walkToTask(task)));
  if(!m.aboard&&allChecks&&task.action!=='board')actions.push(button('Drive Rover Two · board (E)',()=>requireNear(()=>run('board')),!nearVehicle()));
  if(m.aboard&&task.action!=='exit')panel.push(button('Exit rover · E',()=>run('exit'),!v.parking));
  if(['outbound','science'].includes(m.phase))panel.push(button(m.scienceComplete?'Return with required records':'Review / abort & return',()=>run('return')));
  if(!m.aboard&&distance(player.position,SERVICE.comms)<3)panel.push(button('Explore 3D Mars reference archive',referenceArchive));
  $('action-buttons').replaceChildren(...actions);$('mission-actions').replaceChildren(...panel);
  $('action-help').textContent=m.aboard?'P releases / sets the parking brake. Space stops. V changes view.':'WASD / arrows move Jin. Drag to look. E uses the nearest active action.';
}
function showEnding(){
  if(endingShown)return;endingShown=true;clearInput();const a=assessment2(m);completeChapter('rover',{outcome:m.outcome,attemptCompleted:m.outcome!=='suspended',success:m.returned,mastered:m.outcome==='success',score:a.total,assisted:m.assisted,carry:{mission2Outcome:m.outcome,scienceComplete:m.scienceComplete,returnCharge:Math.round(m.battery),returnSuit:Math.round(m.oxygen)}});const titles={success:'Tracks home.',abort:'A prudent return.',margin:'Home, with a lesson.',suspended:'Stop. Understand. Try again.'};
  try{const old=JSON.parse(localStorage.getItem(SAVE_KEY)||'{}');localStorage.setItem(SAVE_KEY,JSON.stringify({...old,mission2:{outcome:m.outcome,score:a.total,assisted:m.assisted,science:m.scienceComplete,sample:m.sample,battery:m.battery,oxygen:m.oxygen,date:new Date().toISOString()}}));}catch{/* Storage is optional; a debrief must still work. */}
  const tip=m.outcome==='suspended'?'If the wheels spin but you do not move, stop pressing go. Look at the ground, then back out slowly.':m.outcome==='margin'?'Keep enough battery to get home. Sand, long paths and extra jobs all use battery.':!m.scienceComplete?'You kept the crew safe! Next time, try to take the wide photo and the close photo too.':m.collisions?'Drive slower near rocks, and start stopping earlier.':'You changed the plan when you saw a problem, and brought everyone home with great photos!';
  const detail=(()=>{try{return localStorage.getItem('mission-control-jr.learning-mode.v1')==='details';}catch{return false;}})();
  const practiced=detail?'Compare observed terrain with a route model, then preserve an energy and suit reserve for unplanned delay.':'Look at the ground, then keep enough charge and air to get home.';
  const decision=`${m.route?ROUTES[m.route].name:'No route'} selected${m.detour?' · changed to the firm perimeter after inspecting the crust':''}.`;
  showDialog(titles[m.outcome],`<p class="report-outcome">${m.assisted?'Finished with a practice restart':m.outcome==='suspended'?'Trip stopped early':'Trip finished · no restarts'}</p><p><strong>Today’s question:</strong> ${TRAVERSE_QUESTION}</p><canvas id="debrief-map" class="plan-map" width="450" height="300"></canvas><p><span class="report-total">${a.total}</span> / 100 · What you learned</p><div class="report-parts">${a.parts.map(([name,value,max])=>`<div><span>${name}</span><b>${Math.round(value)} / ${max}</b></div>`).join('')}</div><p>${practiced}</p><p>Home: <strong>${m.returned?'Everyone is back safe':'Not back home yet'}</strong> · Battery ${m.battery.toFixed(0)}% · Air ${m.oxygen.toFixed(0)}% · Science ${m.scienceComplete?'done':'not finished'} · Extra rock ${m.sample?'picked up':'left behind'}</p><section class="learning-summary"><h3>What you chose → What happened</h3><p><b>You chose:</b> ${decision}</p><p><b>The rover:</b> the path length and the ground changed how much battery was left.</p><p><b>The crew:</b> ${m.returned?'Jin and Amara got home safe.':'they did not get home yet.'}</p><p><b>The science:</b> ${m.scienceComplete?'the photos are saved.':'the question is still open.'}</p></section>
    <div class="kid-lesson-box">
      <span class="lesson-badge">🎓 Space Science Lesson</span>
      <h3>What We Learned on Mars</h3>
      <p><b>🌟 The Big Space Idea:</b> Driving across another planet requires careful planning. A shortcut can cost more battery if the wheels sink into soft Martian dust!</p>
      <div class="lesson-fact">
        <b>🚀 Real NASA Science:</b> The hills and ridges you navigated are from a real NASA HiRISE 3D elevation map of Jezero Crater, where the Perseverance rover explores. NASA rover drivers use these exact stereo models to evaluate ground hazards before uploading driving commands. <a href="https://robotics.jpl.nasa.gov/what-we-do/flight-projects/mars-science-laboratory/surface-system-software-and-rover-navigation/" target="_blank" rel="noopener">Learn more at NASA Robotics</a>
      </div>
      <p><b>💡 Your Astronaut Skill:</b> A true explorer observes the terrain with their own eyes and always saves enough energy to make it home safely.</p>
    </div>
    <p class="reserve-rule"><strong>What if you chose another way?</strong> Driving over the soft patch could make the wheels slip and use more battery. ${tip}</p>${m.events.filter(e=>['hazard','collision','sample','return','retry'].includes(e.type)).slice(-4).map(e=>`<div class="event-row">${Math.floor(e.time)} s · ${e.text}</div>`).join('')}<p><strong>What next?</strong> ${m.outcome==='success'?`Amara adds the mapped boundary to the field record. Elena asks what follow-up measurement could test its interpretation. ${m.earthFieldReport?.status==='delivered'?'Your photos reached Earth!':'Your photos are on the way to Earth.'} Continue to the shelter exercise.`:'The question is still open. You can try again.'}</p><p class="fine-print">This is a pretend future Mars trip. The numbers are game rules.</p>`,[{label:'Print my report',run:()=>window.print()},{label:'Think about it',run:reflection},...(m.checkpoint?[{label:'Try again from the last safe spot',run:restore}]:[]),{label:'Play again',run:()=>location.reload()},...(m.returned?[{label:'Done! See your journey',run:openJourney},{label:'Continue · A Place to Hide',run:()=>goToChapter('solar-shelter')}]:[{label:'Your journey',run:openJourney}])], 'EXPEDITION DEBRIEF');drawMap($('debrief-map'),false);audio.pause(false);audio.say(m.outcome,true);showRoverMilestone();
}
function reflection(){showDialog('Try it somewhere new.',`<p>A new path looks shorter, but the ground might be soft. What should you check first?</p>`,[{label:'Look at the ground, check the battery for home, and have a backup path.',run:()=>{toast('Yes! Look first, then check you have enough to get home.');event(m,'reflection','You looked, checked, and kept a backup.');endingShown=false;showEnding();}},{label:'The map promises the shortcut is fine.',run:()=>toast('A map helps you plan. But it cannot tell if the ground is soft. Look with your eyes too.')},{label:'Back to the report',run:()=>{endingShown=false;showEnding();}}]);}
function restore(){const restored=retry(m);if(!restored){toast('There is no safe spot to go back to yet.');return;}m=restored;endingShown=false;hazeSaid=false;slipSaid=false;actionKey='';photo=null;$('photo-frame').hidden=true;closeDialog();if(!m.aboard)player.position.copy(groundPoint(m.vehicle.x-3,m.vehicle.z,1.68));toast('Back to the last safe spot. Try again!');}
function drawMap(canvas,all=false){
  if(!canvas)return;const c=canvas.getContext('2d'),w=canvas.width,h=canvas.height;c.clearRect(0,0,w,h);c.fillStyle='#142b33';c.fillRect(0,0,w,h);const sx=w/215,sz=h/240,xy=p=>[(p.x+100)*sx,(p.z+198)*sz];
  c.strokeStyle='#35515a';c.lineWidth=.7;for(let x=-100;x<115;x+=25){c.beginPath();c.moveTo(...xy({x,z:-198}));c.lineTo(...xy({x,z:42}));c.stroke();}for(let z=-198;z<42;z+=25){c.beginPath();c.moveTo(...xy({x:-100,z}));c.lineTo(...xy({x:115,z}));c.stroke();}
  const line=(points,color,width,dash=[])=>{if(!points.length)return;c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.beginPath();points.forEach((p,i)=>i?c.lineTo(...xy(p)):c.moveTo(...xy(p)));c.stroke();c.setLineDash([]);};
  if(all)for(const[id,r]of Object.entries(ROUTES))line(r.points,id===planRoute?'#f2ba7c':'#657d86',id===planRoute?3:1.5);
  else if(m.route)line(ROUTES[m.route].points,'#e3a977',2,[4,3]);
  if(m.phase==='return'||m.ended)line(safeReturnPoints(m.vehicle),'#a9d2e5',2,[3,3]);line(m.trail,'#9ee6ca',2);
  for(const r of ROCKS){c.fillStyle='#7a8988';c.beginPath();c.arc(...xy(r),Math.max(2,r.r*sx),0,Math.PI*2);c.fill();}
  const [hx,hy]=xy(HAZARD);c.strokeStyle=m.hazard?'#f8a66d':'#c6b68c';c.fillStyle='#d3ad792c';c.beginPath();c.arc(hx,hy,HAZARD.r*sx,0,Math.PI*2);c.fill();c.stroke();c.font=`${Math.max(8,w/37)}px system-ui`;c.fillStyle='#d7c797';if(w>300)c.fillText('UNCERTAIN',hx-30,hy-17);
  for(const [p,name,color]of[[HOME,'MERIDIAN','#b1e8d3'],[RIDGE,'KESTREL','#edbd87']]){const[x,y]=xy(p);c.fillStyle=color;c.fillRect(x-3,y-3,6,6);if(w>220)c.fillText(name,x+7,y+3);}
  const[x,y]=xy(m.vehicle);c.save();c.translate(x,y);c.rotate(-m.vehicle.heading+Math.PI/2);c.fillStyle='#fff1d5';c.beginPath();c.moveTo(0,-7);c.lineTo(5,5);c.lineTo(-5,5);c.closePath();c.fill();c.restore();
}
function targetWaypoint(){
  if(!['outbound','return'].includes(m.phase))return task2(m).target||m.vehicle;
  if(m.phase==='return'){const points=safeReturnPoints(m.vehicle);return points.find((p,i)=>i&&distance(p,m.vehicle)>7)||HOME;}
  if(m.phase==='outbound'&&m.reports.every(Boolean)){
    if(!m.detour)return inspectionPoint(m);
    const points=m.detour==='east'?[{x:72,z:-144},{x:40,z:-150}]:[{x:7,z:-112},{x:7,z:-134},{x:40,z:-150}];
    if(m.route==='wash')points.shift();
    while(m.waypoint<points.length-1&&distance(m.vehicle,points[m.waypoint])<12)m.waypoint++;
    return points[Math.min(m.waypoint,points.length-1)];
  }
  const points=m.route?ROUTES[m.route].points:[];
  if(points.length){const i=m.reports.findIndex(done=>!done),cap=i>=0?points.indexOf(reportStations(m)[i]):points.length-1;while(m.waypoint<cap&&distance(m.vehicle,points[m.waypoint])<12)m.waypoint++;return points[Math.min(m.waypoint,cap)];}return task2(m).target||HOME;
}
function renderHud(){
  const v=m.vehicle,f=forecast(m),t=targetWaypoint(),surface=surfaceAt(v.x,v.z),heading=((90-v.heading*180/Math.PI)%360+360)%360;
  const task = task2(m);
  const photoInstruction = photo === 'context' ? 'Fit both rock layers in the frame. Then tap Take photo or press E.'
    : 'Fit the boundary between the rocks and the ruler in the frame. Then tap Take photo or press E.';
  const instruction = photo ? photoInstruction : m.aboard && v.parking && ['outbound','return'].includes(m.phase)
    && (!task.target || distance(v, task.target) > task.radius) ? 'Press P to release the brake, then drive to the orange marker.' : task.instruction;
  if ($('objective').textContent !== task.title) $('objective').textContent = task.title;
  if ($('rover-instruction').textContent !== instruction) $('rover-instruction').textContent = instruction;
  $('phase-note').textContent=`${TRAVERSE_QUESTION} ${m.phase==='prep'||m.phase==='test'?'The base keeps its own battery. The rover uses the spare.':`${Math.floor(m.elapsed/60)}:${String(Math.floor(m.elapsed%60)).padStart(2,'0')} outside · save ${m.returnReserve||20}% for home`}`;
  const vital=(icon,label,value,essential=false,max=100)=>{const n=Math.max(0,Math.min(100,Math.round(value/max*100))),state=n<20?'danger':n<40?'warning':'healthy';return `<span class="vital-chip ${essential?'vital-essential':''}" data-state="${state}" role="img" aria-label="${label} ${Math.round(value)}" title="${label}: ${Math.round(value)}"><span class="vital-icon" aria-hidden="true">${icon}</span><b>${Math.round(value)}</b><i style="width:${n}%"></i></span>`;};
  $('vitals').innerHTML=vital('⚡','Rover battery',m.battery,true)+vital('O₂','Suit air',m.oxygen)+vital('♙','Everyone here',2,true,2)+vital('⌂','Battery left at home',Math.max(0,f.battery),true)+vital('↩','Air left at home',Math.max(0,f.oxygen),true);
  const current=task2(m);$('stage-count').textContent=`${current.stage} / 8`;$('objective-progress').value=current.stage-1;
  const marker=$('objective-marker'),target=m.aboard?t:current.target;
  if(target){
    const refPos=m.aboard?m.vehicle:player.position;
    const distanceTo=distance(refPos,target);
    const pos=groundPoint(target.x,target.z,m.aboard?4.2:2.6).project(camera);
    const visible=pos.z<1&&pos.z>-1&&Math.abs(pos.x)<.96&&Math.abs(pos.y)<.92;
    marker.hidden=!visible;
    marker.textContent=`🎯 ${m.aboard?(m.phase==='return'?'Drive Home':current.title):current.title} · ${Math.round(distanceTo)} m`;
    marker.style.left=`${(pos.x*.5+.5)*innerWidth}px`;
    marker.style.top=`${(-pos.y*.5+.5)*innerHeight}px`;
  }
  else marker.hidden=true;
  $('tasks').innerHTML=[['Hear the plan',m.briefAccepted],['Get ready + driving test',Object.values(m.checks).every(Boolean)],['Pick a path',!!m.route],['Two radio stops',m.reports.every(Boolean)],['Look at the strange ground',!!m.detour],['Rock photos',m.scienceComplete],['Drive home safe',m.returned]].map(([text,done],i)=>`<div class="${done?'done':current.stage===i+1?'current':''}">${done?'✓':String(i+1).padStart(2,'0')} ${text}</div>`).join('');
  $('inventory').textContent=m.sample?'CAMERA · ROCK IN A BAG':m.checks.battery?'CAMERA · TOOLS':'SPARE BATTERY · READY TO PUT IN';
  $('hud').classList.toggle('foot',!m.aboard);$('speed').textContent=(Math.abs(v.speed)*(1-v.slip)*3.6).toFixed(1);$('heading').textContent=`${String(Math.round(heading)).padStart(3,'0')}° · HEADING`;$('surface').textContent=surface==='loose'?'UNCERTAIN / SOFT MATERIAL':`${surface.toUpperCase()} GROUND`;$('traction').textContent=`SLOPE ${slopeAt(v.x,v.z).toFixed(1)}° · SLIP ${Math.round(v.slip*100)}%`;$('gear').textContent=v.parking?'PARKING BRAKE SET':v.speed<-.05?'REVERSE':'DRIVE · SPACE TO BRAKE';$('eco').classList.toggle('active',m.eco);$('eco').textContent=`Eco: ${m.eco?'On':'Off'} · Shift`;showCameraView($('view'), view);
  if(!m.aboard)$('gear').textContent='ON FOOT · BOARD ROVER TO DRIVE';
  $('parking-toggle').textContent=v.parking?'Brake off · P':'Park · P';$('parking-toggle').classList.toggle('brake-set',v.parking);$('parking-toggle').setAttribute('aria-pressed',String(v.parking));
  const bearing=((Math.atan2(t.x-v.x,-(t.z-v.z))*180/Math.PI)%360+360)%360;
  $('waypoint').textContent=m.route?`${m.phase==='return'?'HOMEWARD WASH':'NEXT WAYPOINT'} · ${Math.round(distance(v,t))} m · ${Math.round(bearing)}° bearing · local ${Math.round(v.x)}, ${Math.round(v.z)}`:'MERIDIAN SERVICE APRON';
  for(const b of beacons){const chosen=b.id===m.route;b.light.visible=!m.route||chosen;b.light.material.color.setHex(chosen?0xf5bb78:0x9dc8b7);b.light.material.emissive.setHex(chosen?0x9c6030:0x21463b);b.light.scale.setScalar(chosen&&b.index===m.waypoint?1.5:1);}
  $('controls').innerHTML=m.aboard?'WASD / ARROWS <b>DRIVE</b> · SPACE <b>BRAKE</b> · P <b>PARK</b> · E <b>EXIT</b> · V <b>VIEW</b> · SHIFT <b>ECO</b> · M <b>MAP</b> · ESC <b>PAUSE</b><span>Brake to a stop, then release/reapply S to reverse. Both crew wear suits in this unpressurized rover.</span>':'WASD / ARROWS <b>WALK</b> · ⬅️/➡️ <b>TURN VIEW</b> · DRAG <b>LOOK</b> · E <b>USE</b> · V <b>VIEW</b> · ESC <b>PAUSE</b><span>Walk close to things to use them. Amara waits by the rover.</span>';
  drawMap($('minimap'));renderActions();
}
function toggleView(){if(photo){toast('Close the camera first.');return;}player.toggleView();orbitYaw=0;clearInput();}
addEventListener('keydown',e=>{
  if(pipLessonOpen())return;
  if(['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)&&e.code!=='Escape')return;
  if(!m.started||m.ended)return;
  // Player already owns Escape even while disabled in vehicle mode.
  if(!$('dialog').hidden)return;
  if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)&&$('mission-panel').classList.contains('expanded'))toggleTasks(false);
  if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)&&m.aboard){e.preventDefault();document.activeElement?.blur();keys.add(e.code);if(m.vehicle.parking&&!e.repeat&&['KeyW','KeyS','ArrowUp','ArrowDown'].includes(e.code))toast('The parking brake is on. Press P, then drive with WASD or arrows.');}
  if(e.repeat)return;
  if(e.code==='KeyV'&&!e.repeat&&m.aboard)toggleView();
  if(e.code==='KeyP'&&m.aboard)toggleParking();
  if(e.code==='KeyE'&&photo&&!e.defaultPrevented){e.preventDefault();capture();}
  else if(e.code==='KeyE'&&m.aboard&&performance.now()>inputLockUntil){
    e.preventDefault();
    run('exit');
  }
  if((e.code==='ShiftLeft'||e.code==='ShiftRight')&&m.aboard){m.eco=!m.eco;toast(m.eco?'Eco mode limits speed and reduces traction energy use.':'Normal driving.');}
  if(e.code==='KeyM')toggleMap();if(e.code==='KeyT')toggleTasks();if(e.code==='KeyH')help();if(e.code==='KeyJ')openJournal();if(e.code==='Equal'||e.code==='NumpadAdd')zoom(-1);if(e.code==='Minus'||e.code==='NumpadSubtract')zoom(1);
});
addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{clearInput();if(m.started&&!m.ended&&$('dialog').hidden)togglePause();});
renderer.domElement.addEventListener('pointerdown',e=>{if(m.aboard&&enabled()&&e.button===0){drag={x:e.clientX,y:e.clientY};renderer.domElement.setPointerCapture(e.pointerId);}});
renderer.domElement.addEventListener('pointermove',e=>{if(!drag||!m.aboard)return;orbitYaw-=(e.clientX-drag.x)*.004;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-drag.y)*.003,-.4,.65);drag={x:e.clientX,y:e.clientY};});renderer.domElement.addEventListener('pointerup',()=>{drag=null;});
$('begin').onclick=start;$('pause').onclick=togglePause;$('view').onclick=toggleView;$('map-button').onclick=openMap;$('expand-map').onclick=openMap;$('journal').onclick=openJournal;$('parking-toggle').onclick=toggleParking;$('eco').onclick=()=>{m.eco=!m.eco;$('eco').blur();};$('capture-photo').onclick=capture;$('cancel-photo').onclick=()=>{closePhoto();setInput();};$('skip-voice').onclick=()=>audio.skip();$('replay-voice').onclick=()=>audio.replay();
$('map-button').onclick=toggleMap;$('tasks-button').onclick=toggleTasks;$('help-button').onclick=help;$('zoom-in').onclick=()=>zoom(-1);$('zoom-out').onclick=()=>zoom(1);$('details-toggle').onclick=()=>{const p=$('target-description');p.hidden=!p.hidden;$('details-toggle').setAttribute('aria-expanded',String(!p.hidden));};$('inspect-exhibit').onclick=inspectExhibit;
installHudPresentation({hud:$('hud'),toolbar:document.querySelector('#topbar .toolbar'),onHelp:help,onJourney:openJourney,menuItems:['zoom-out','zoom-in','help-button','journal']});
renderer.domElement.addEventListener('wheel',e=>{if(enabled()){e.preventDefault();zoom(Math.sign(e.deltaY));}},{passive:false});
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});

async function load(){
  const texture=await new THREE.TextureLoader().loadAsync(new URL('./assets/mars-ground.webp',import.meta.url).href).catch(()=>null);if(texture){texture.colorSpace=THREE.SRGBColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(230/palette.tileMetres,250/palette.tileMetres);}
  const sky=await new THREE.TextureLoader().loadAsync(new URL('./assets/mars-sky.webp',import.meta.url).href).catch(()=>null);if(sky){sky.mapping=THREE.EquirectangularReflectionMapping;sky.colorSpace=THREE.SRGBColorSpace;scene.environment=sky;scene.environmentIntensity=palette.environmentIntensity;}
  const geometry=new THREE.PlaneGeometry(230,250,120,130);geometry.rotateX(-Math.PI/2);geometry.translate(5,0,-75);const positions=geometry.attributes.position;
  for(let i=0;i<positions.count;i++)positions.setY(i,heightAt(positions.getX(i),positions.getZ(i)));geometry.computeVertexNormals();const ground=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({map:texture,color:texture?0xffffff:palette.rock,roughness:1}));ground.receiveShadow=true;world.add(ground);
  const loader=new GLTFLoader(),assets=Object.fromEntries(await Promise.all(Object.entries(registry).map(async([key,url])=>[key,await loader.loadAsync(url.href)])));
  const habitat=clone(assets.habitat);const terminal=clone(assets.terminal,[5,0,7]);terminal.rotation.y=.8;clone(assets.junction,[-4,0,6]);const supplyBattery=clone(assets.battery,[-4,.4,6]);supplyBattery.name='spare_supply';
  cameraBlockers.push(habitat,terminal);
  for(let i=0;i<3;i++)clone(assets.solar,[-12+i*3,0,5]);
  rover=clone(assets.rover,[HOME.x,0,HOME.z]);bayBattery=clone(assets.battery,[-1.2,1.5,0],.65,rover);bayBattery.visible=false;
  astronaut=assets.crew;walkingAvatar=clone(assets.crew,[6,0,12]);walkingMixer=new THREE.AnimationMixer(walkingAvatar);for(const clip of assets.crew.animations)walkingClips[clip.name]=walkingMixer.clipAction(clip);walkingClips.Idle?.play();
  function seated(mount){const a=clone(assets.crew,[0,0,0],.91,mount);for(const name of ['leg_left','leg_right']){const leg=a.getObjectByName(name);if(leg)leg.rotation.x=-1.1;}for(const name of ['arm_left','arm_right']){const arm=a.getObjectByName(name);if(arm)arm.rotation.x=-.75;}return a;}
  seatedDriver=seated(rover.getObjectByName('seat_driver'));seatedAmara=seated(rover.getObjectByName('seat_passenger'));
  for(const [name,x,z]of[['ELENA / COMMAND',-5,12],['LUCA / MEDIC',2,14]]){const a=clone(assets.crew,[x,0,z]);const mix=new THREE.AnimationMixer(a);mix.clipAction(assets.crew.animations.find(c=>c.name==='Idle')).play();mixers.push(mix);label(name,x,z);}
  clone(assets.outcrop,[RIDGE.x,heightAt(RIDGE.x,RIDGE.z),RIDGE.z]);scaleMesh=clone(assets.scale,[38.8,heightAt(38.8,-157.3),-157.3]);sampleMesh=clone(assets.sample,[42,heightAt(42,-156),-156],1.5);
  label('KESTREL RIDGE / GEOLOGICAL CONTACT',RIDGE.x,RIDGE.z,4.2);label('MERIDIAN / RETURN APRON',HOME.x,HOME.z,4);label('UNCERTAIN GROUND / INSPECTION',HAZARD.x,HAZARD.z,2);
  const markerMat=new THREE.MeshStandardMaterial({color:0xb2e6d2,emissive:0x21463b});
  for(const p of [HOME,{x:36,z:-153}]){const ring=new THREE.Mesh(new THREE.RingGeometry(p===HOME?5:2,p===HOME?5.12:2.08,60),new THREE.MeshBasicMaterial({color:0x99dbc4,side:THREE.DoubleSide,transparent:true,opacity:.5}));ring.rotation.x=-Math.PI/2;ring.position.copy(groundPoint(p.x,p.z,.04));world.add(ring);}
  const rockMaterial=new THREE.MeshStandardMaterial({color:palette.rock,roughness:1});for(const [i,r]of ROCKS.entries()){const rock=new THREE.Mesh(new THREE.DodecahedronGeometry(r.r,0),rockMaterial);rock.position.copy(groundPoint(r.x,r.z,r.r*.4));rock.scale.y=.6;rock.rotation.y=i;rock.castShadow=rock.receiveShadow=true;world.add(rock);cameraBlockers.push(rock);}
  const crustMaterial=new THREE.MeshStandardMaterial({color:0xd7bc91,roughness:1});
  for(let i=0;i<18;i++){const angle=i*2.399,radius=8+(i%4)*.7,x=HAZARD.x+Math.cos(angle)*radius,z=HAZARD.z+Math.sin(angle)*radius;const plate=new THREE.Mesh(new THREE.DodecahedronGeometry(.55+(i%3)*.25,0),crustMaterial);plate.scale.set(1.2,.045,1);plate.rotation.y=angle;plate.position.copy(groundPoint(x,z,.045));world.add(plate);}
  scenery=addScenery(world,label);
  for(const [id,route]of Object.entries(ROUTES))for(let i=1;i<route.points.length;i++){const p=route.points[i],pole=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,1.2,8),markerMat);pole.position.copy(groundPoint(p.x,p.z,.6));world.add(pole);const light=new THREE.Mesh(new THREE.OctahedronGeometry(.25),markerMat.clone());light.position.copy(groundPoint(p.x,p.z,1.5));world.add(light);beacons.push({id,index:i,light});}
  footSolids=[{minX:-5,maxX:5,minZ:-3.5,maxZ:3.5},{minX:35.8,maxX:44.2,minZ:-162.5,maxZ:-158},...OUTPOST_SOLIDS,...ROCKS.map(r=>({minX:r.x-r.r,maxX:r.x+r.r,minZ:r.z-r.r,maxZ:r.z+r.r}))];player.obstacles=[...footSolids,roverFootprint];player.cameraObjects=[rover,terminal,habitat];
  $('load-status').textContent='Parking the robot rover…';exhibits=await addExhibits(world,loader);
  ready=true;$('load-status').textContent='Ready!';$('begin').disabled=false;$('begin').textContent='Start the trip';camera.position.set(28,14,36);camera.lookAt(13,1,-10);renderHud();
}
function vehicleCamera(dt){
  const v=m.vehicle,pos=groundPoint(v.x,v.z);let desired,look;
  if(view==='first'){const local=new THREE.Vector3(1.05,2.12,-.46);rover.updateMatrixWorld(true);desired=rover.localToWorld(local);look=desired.clone().add(new THREE.Vector3(Math.cos(v.heading-orbitYaw)*10,-pitch*8,-Math.sin(v.heading-orbitYaw)*10));seatedDriver.visible=false;camera.position.copy(desired);camera.lookAt(look);}
  else{seatedDriver.visible=m.aboard;const angle=v.heading-orbitYaw;desired=pos.clone().add(new THREE.Vector3(-Math.cos(angle)*roverZoom,roverZoom*.45+pitch*4,Math.sin(angle)*roverZoom));look=pos.clone().add(new THREE.Vector3(Math.cos(v.heading)*2,1.4,-Math.sin(v.heading)*2));const ray=new THREE.Raycaster(look,desired.clone().sub(look).normalize(),.1,look.distanceTo(desired)),hit=ray.intersectObjects(cameraBlockers,true)[0];if(hit)desired=ray.ray.at(Math.max(.4,hit.distance-.35),new THREE.Vector3());desired.y=Math.max(desired.y,heightAt(desired.x,desired.z)+.5);if(hit)camera.position.copy(desired);else camera.position.lerp(desired,reduced?1:1-Math.exp(-dt*6));camera.lookAt(look);}
}
function loop(now){
  requestAnimationFrame(loop);const rawDt=(now-last)/1000,dt=Math.min(rawDt,.1);last=now;if(!ready||document.hidden||journeyPaused)return;
  if(rawDt>.12)slowFrames++;else slowFrames=Math.max(0,slowFrames-1);if(slowFrames>15&&!performanceMode){performanceMode=true;renderer.setPixelRatio(.85);renderer.shadowMap.enabled=false;toast('Fast mode: simpler pictures so the game runs smoother.');}
  const halfX=Math.abs(Math.cos(m.vehicle.heading))*2+Math.abs(Math.sin(m.vehicle.heading))*1.4,halfZ=Math.abs(Math.sin(m.vehicle.heading))*2+Math.abs(Math.cos(m.vehicle.heading))*1.4;Object.assign(roverFootprint,{minX:m.vehicle.x-halfX,maxX:m.vehicle.x+halfX,minZ:m.vehicle.z-halfZ,maxZ:m.vehicle.z+halfZ});
  const active=!pipLessonOpen()&&m.started&&!m.ended&&$('dialog').hidden;setInput();if(photo)player.enabled=active&&!m.aboard;
  if(active){
    if(m.aboard&&Math.abs(m.vehicle.speed)>.12&&$('mission-panel').classList.contains('expanded'))toggleTasks(false);
    if(m.aboard){accumulator+=dt;while(accumulator>=1/60){const input={throttle:Number(keys.has('KeyW')||keys.has('ArrowUp'))-Number(keys.has('KeyS')||keys.has('ArrowDown')),steer:Number(keys.has('KeyA')||keys.has('ArrowLeft'))-Number(keys.has('KeyD')||keys.has('ArrowRight')),brake:keys.has('Space'),eco:m.eco};const telemetry=stepRover(m.vehicle,input,1/60);advance2(m,1/60,telemetry);roverWheelTurns+=m.vehicle.wheelSpeed/60/.49;if(telemetry.collision)toast('Bump! Stop, then back up slowly.');accumulator-=1/60;if(m.ended)break;}}
    else{accumulator=0;const moved=player.update(dt*.48,false);if(moved&&$('mission-panel').classList.contains('expanded'))toggleTasks(false);player.position.y=heightAt(player.position.x,player.position.z)+1.68;player.syncCamera();walkingAvatar.position.copy(player.position).y-=1.68;walkingAvatar.rotation.y=player.facing;walkingClips.Walk?.setEffectiveWeight(moved?1:0);walkingClips.Idle?.setEffectiveWeight(moved?0:1);if(moved)walkingClips.Walk?.play();else walkingClips.Idle?.play();advance2(m,dt,{metres:0,surface:'firm',poweredSlip:false,speed:0,collision:false});}
    walkingMixer?.update(dt);mixers.forEach(x=>x.update(dt));
    if(m.phase==='outbound'&&m.vehicle.z< -55&&!hazeSaid){hazeSaid=true;audio.say('haze');}
    if(m.phase==='outbound'&&distance(m.vehicle,HAZARD)<28&&!hazardSaid){hazardSaid=true;audio.say('hazard',true);toast('Strange ground ahead! Stop, press P, and take a look.');}
    if(m.vehicle.slip>.5&&Math.abs(m.vehicle.speed)>.2&&!slipSaid){slipSaid=true;audio.say('slip',true);toast('The wheels are spinning! Let go, then back up slowly onto firm ground.');}
    const f=forecast(m),margin=m.returnReserve||20;if((f.battery<margin||f.oxygen<margin)&&!marginWarned&&['outbound','science','return'].includes(m.phase)){marginWarned=true;toast('Battery is getting low! Skip the extra jobs and drive home now.');audio.say('ready',true);}
    if(m.ended)showEnding();
  }else accumulator=0;
  if(rover){const v=m.vehicle;rover.position.copy(groundPoint(v.x,v.z,-v.sink*.14));rover.rotation.y=v.heading;const forwardSlope=(heightAt(v.x+Math.cos(v.heading),v.z-Math.sin(v.heading))-heightAt(v.x-Math.cos(v.heading),v.z+Math.sin(v.heading)))/2;const crossSlope=(heightAt(v.x+Math.sin(v.heading),v.z+Math.cos(v.heading))-heightAt(v.x-Math.sin(v.heading),v.z-Math.cos(v.heading)))/2;rover.rotation.z=Math.atan(forwardSlope);rover.rotation.x=-Math.atan(crossSlope);bayBattery.visible=m.checks.battery;seatedDriver.visible=m.aboard;seatedAmara.visible=m.started;for(let i=0;i<6;i++){const wheel=rover.getObjectByName(`wheel_${i}`);if(wheel)wheel.rotation.z=-roverWheelTurns;}const sensor=rover.getObjectByName('sensor_head');if(sensor)sensor.rotation.y=Math.sin(now*.0003)*.2;sampleMesh.visible=!m.sample;}
  if(rover)for(const i of [2,5]){const wheel=rover.getObjectByName(`wheel_${i}`);if(wheel)wheel.rotation.y=m.vehicle.steeringAngle||0;}
  walkingAvatar.visible=m.started&&!m.aboard&&view==='third';if(m.aboard&&m.started)vehicleCamera(dt);
  const focus=m.aboard?m.vehicle:player.position;sun.position.set(focus.x+18,24,focus.z+12);sun.target.position.set(focus.x,0,focus.z);sun.target.updateMatrixWorld();const haze=m.started&&m.vehicle.z< -55?.25:0;scene.fog.far=palette.fogFar-haze*80;scene.fog.near=palette.fogNear-haze*40;audio.update(m.vehicle.speed,m.vehicle.slip,m.aboard&&active);scenery?.update(task2(m),now,focus);world.getObjectByName('spare_supply').visible=!m.spareCollected;
  exhibits?.update(focus,dt);
  camera.updateMatrixWorld();const blockers=['#topbar','#mission-panel','#radio','#interaction','#map-panel','#vehicle-instruments'].map(s=>$(s)).filter(el=>el&&!el.hidden&&getComputedStyle(el).display!=='none').map(el=>el.getBoundingClientRect());for(const l of labels){const p=l.position.clone().project(camera),d=camera.position.distanceTo(l.position);l.el.hidden=!m.started||p.z< -1||p.z>1||d>15||Math.abs(p.x)>1||Math.abs(p.y)>1;if(!l.el.hidden){l.el.style.left=`${(p.x*.5+.5)*innerWidth}px`;l.el.style.top=`${(-p.y*.5+.5)*innerHeight}px`;const r=l.el.getBoundingClientRect();if(blockers.some(b=>r.left<b.right+10&&r.right>b.left-10&&r.top<b.bottom+8&&r.bottom>b.top-8))l.el.hidden=true;}}
  if(now-lastHud>125&&m.started){lastHud=now;renderHud();}renderer.render(scene,camera);
}
load().catch(e=>{console.error(e);$('load-status').textContent=`Something did not load: ${e.message}. Run the project with npm run dev.`;});requestAnimationFrame(loop);
