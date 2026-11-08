import {bindStationPicking} from '../../simulation/picking.js';
import {getMissionAssets} from '../../mission-assets.js';
import {graphicsProfile} from '../../simulation/graphics.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Player} from '../../player.js';
const modelUrls=getMissionAssets('solar-shelter');
export async function createScene({container,onInteract,onPause,onMove}) {
  const {lowEffects:lowQuality,pixelRatioCap}=graphicsProfile();const renderer=new THREE.WebGLRenderer({antialias:!lowQuality});renderer.setPixelRatio(Math.min(devicePixelRatio,pixelRatioCap));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;container.append(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x1b3039);const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.05,80);
  scene.add(new THREE.HemisphereLight(0xc9e8e5,0x39484a,2));const lamp=new THREE.DirectionalLight(0xffe0bc,2.2);lamp.position.set(-3,8,4);scene.add(lamp);
  const material=(color)=>new THREE.MeshStandardMaterial({color,roughness:.8});
  const floor=new THREE.Mesh(new THREE.BoxGeometry(15,.2,13),material(0x52666a));floor.position.y=-.1;scene.add(floor);
  const wallMat=material(0x9eafaa);for(const [x,z,w,d] of [[0,-6.5,15,.2],[-7.5,0,.2,13],[7.5,0,.2,13]]){const wall=new THREE.Mesh(new THREE.BoxGeometry(w,3.8,d),wallMat);wall.position.set(x,1.9,z);scene.add(wall);}
  const stripe=new THREE.Mesh(new THREE.BoxGeometry(14.8,.18,.03),material(0xd58e4c));stripe.position.set(0,2.3,-6.37);scene.add(stripe);
  const loader=new GLTFLoader();const assets=Object.fromEntries(await Promise.all(Object.entries(modelUrls).map(async([id,url])=>[id,(await loader.loadAsync(url.href)).scene])));
  const add=(id,x,z,yaw=0)=>{const object=assets[id].clone(true);object.position.set(x,0,z);object.rotation.y=yaw;scene.add(object);return object;};
  const frame=add('shelter',0,-4.7),monitor=add('monitor',-5,-2),rack=add('rack',5,-4);const bags=[0,1,2].map(i=>add('bag',-4.8+i*.75,3));
  const trolley=new THREE.Group();const trolleyBase=new THREE.Mesh(new THREE.BoxGeometry(.9,.12,.65),material(0x444e50));trolleyBase.position.y=.3;trolley.add(trolleyBase);for(const x of [-.3,.3])for(const z of [-.25,.25]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.13,.13,.08,12),material(0x16272b));wheel.rotation.x=Math.PI/2;wheel.position.set(x,.13,z);trolley.add(wheel);}scene.add(trolley);trolley.visible=false;let movingBag=-1;
  const crew=Array.from({length:4},(_,i)=>{const model=add('crew',1.5+i*.65,3);model.scale.setScalar(.8);return model;});
  const screen=rack.getObjectByName('status_screen');if(screen)screen.material=screen.material.clone();
  const stations=[{id:'monitor',title:'Space weather screen',point:{x:-5,z:-2},stand:{x:-4,z:-.9},model:monitor},{id:'water',title:'Water bags',point:{x:-4,z:3},stand:{x:-3,z:1.5},model:bags[0]},{id:'shelter',title:'Safe room',point:{x:0,z:-4.7},stand:{x:0,z:-2.6},model:frame},{id:'recorder',title:'Science machine',point:{x:5,z:-4},stand:{x:3.5,z:-2.8},model:rack}];
  const player=new Player(camera,renderer.domElement,onInteract,onPause,()=>{});player.bounds={minX:-6.8,maxX:6.8,minZ:-5.8,maxZ:5.8};player.position.set(0,1.68,4.8);player.yaw=0;player.syncCamera();player.enabled=false;const disposePicking=bindStationPicking(renderer.domElement,camera,player,stations,onInteract);
  player.obstacles=[{minX:-1.5,maxX:1.5,minZ:-5.7,maxZ:-3.8},{minX:4.2,maxX:5.8,minZ:-4.8,maxZ:-3.2}];
  let last=performance.now(),raf=0,alive=true;function animate(now){if(!alive)return;const dt=Math.min((now-last)/1000,.1);last=now;const moved=player.update(dt);if(moved)onMove(dt);renderer.render(scene,camera);raf=requestAnimationFrame(animate);}raf=requestAnimationFrame(animate);
  function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}addEventListener('resize',resize);
  return {player,stations,nearest(){return stations.map(s=>({...s,distance:Math.hypot(player.position.x-s.stand.x,player.position.z-s.stand.z)})).sort((a,b)=>a.distance-b.distance)[0];},walkTo(id){const station=stations.find(s=>s.id===id);return station&&player.navigate(station.stand,station.point);},
    update(state){for(const [i,bag] of state.bags.entries()){if(i===movingBag)continue;const target=bag.location==='storage'?[-4.8+i*.75,0,3]:[[-1.1,0,-4.65],[1.1,0,-4.65],[0,1.6,-4.7]][i];bags[i].position.set(...target);}const sheltered=Object.values(state.crew).every(c=>c.location==='shelter');crew.forEach((obj,i)=>obj.position.set(sheltered?-.9+i*.6:1.5+i*.65,0,sheltered?-4.5:3));if(screen)screen.material.color.set(state.experimentOn?0x59ead0:0x334544);},
    animateBag(index,state){const bag=state.bags[index],model=bags[index];const from=model.position.clone();const target=bag.location==='storage'?new THREE.Vector3(-4.8+index*.75,0,3):new THREE.Vector3(...[[-1.1,0,-4.65],[1.1,0,-4.65],[0,1.6,-4.7]][index]);movingBag=index;trolley.visible=true;return new Promise(resolve=>{const start=performance.now();function step(now){if(!alive){resolve();return;}const t=Math.min(1,(now-start)/1800),position=from.clone().lerp(target,t);model.position.copy(position);model.position.y+=Math.sin(Math.PI*t)*.35;trolley.position.set(position.x,0,position.z);if(t<1)requestAnimationFrame(step);else{movingBag=-1;trolley.visible=false;resolve();}}requestAnimationFrame(step);});},
    dispose(){alive=false;disposePicking();cancelAnimationFrame(raf);removeEventListener('resize',resize);scene.traverse(o=>{if(o.isMesh){o.geometry.dispose();const mats=Array.isArray(o.material)?o.material:[o.material];mats.forEach(m=>m.dispose());}});renderer.dispose();renderer.domElement.remove();}};
}
