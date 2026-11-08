import {bindStationPicking} from '../../simulation/picking.js';
import {getMissionAssets} from '../../mission-assets.js';
import {graphicsProfile} from '../../simulation/graphics.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Player} from '../../player.js';
const urls=getMissionAssets('greenhouse');
export async function createScene({container,onInteract,onPause,onMove}){
 const {lowEffects:lowQuality,pixelRatioCap}=graphicsProfile();const renderer=new THREE.WebGLRenderer({antialias:!lowQuality});renderer.setPixelRatio(Math.min(devicePixelRatio,pixelRatioCap));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;container.append(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x253a3d);const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.05,80);
 scene.add(new THREE.HemisphereLight(0xd3f0e4,0x314144,2));const light=new THREE.DirectionalLight(0xffedcf,2);light.position.set(-3,8,4);scene.add(light);
 const mat=color=>new THREE.MeshStandardMaterial({color,roughness:.8});const floor=new THREE.Mesh(new THREE.BoxGeometry(14,.2,12),mat(0x52666a));floor.position.y=-.1;scene.add(floor);
 for(const [x,z,w,d] of [[0,-6,14,.2],[-7,0,.2,12],[7,0,.2,12]]){const wall=new THREE.Mesh(new THREE.BoxGeometry(w,3.8,d),mat(0x9eafaa));wall.position.set(x,1.9,z);scene.add(wall);}
 const loader=new GLTFLoader(),assets=Object.fromEntries(await Promise.all(Object.entries(urls).map(async([id,url])=>[id,(await loader.loadAsync(url.href)).scene])));
 const add=(id,x,z)=>{const object=assets[id].clone(true);object.position.set(x,0,z);scene.add(object);return object;};
 const rack=add('rack',-2,-4.7),manifold=add('manifold',2,-4.7),terminal=add('terminal',5,-3.5),crew=add('crew',3,2);crew.scale.setScalar(.8);
 const led=rack.getObjectByName('led_panel');led.material=led.material.clone();const valves=['a','b'].map(id=>rack.getObjectByName(`valve_${id}`));
 const trayModels=['a','b'].map(id=>{const tray=rack.getObjectByName(`tray_${id}`);return {tray,seedling:tray.getObjectByName(`growth_seedling_${id}`),mature:tray.getObjectByName(`growth_mature_${id}`),harvested:tray.getObjectByName(`growth_harvested_${id}`)};});
 const valve=manifold.getObjectByName('isolation_valve');const stations=[{id:'crops',title:'Plant trays',point:{x:-2,z:-4.7},stand:{x:-2,z:-2.8},model:rack},{id:'manifold',title:'Water pipes',point:{x:2,z:-4.7},stand:{x:2,z:-2.8},model:manifold},{id:'console',title:'Grow clock',point:{x:5,z:-3.5},stand:{x:4,z:-2},model:terminal}];
 const player=new Player(camera,renderer.domElement,onInteract,onPause,()=>{});player.bounds={minX:-6.3,maxX:6.3,minZ:-5.5,maxZ:5.5};player.position.set(0,1.68,4.5);player.yaw=0;player.syncCamera();player.enabled=false;const disposePicking=bindStationPicking(renderer.domElement,camera,player,stations,onInteract);
 player.obstacles=[{minX:-3.4,maxX:-.6,minZ:-5.3,maxZ:-4},{minX:1.2,maxX:2.8,minZ:-5.2,maxZ:-4.3},{minX:4.4,maxX:5.6,minZ:-4,maxZ:-3}];
 let last=performance.now(),alive=true,raf=0;function animate(now){if(!alive)return;const dt=Math.min((now-last)/1000,.1);last=now;if(player.update(dt))onMove(dt);renderer.render(scene,camera);raf=requestAnimationFrame(animate);}raf=requestAnimationFrame(animate);
 function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}addEventListener('resize',resize);
 return {player,stations,nearest(){return stations.map(s=>({...s,distance:Math.hypot(player.position.x-s.stand.x,player.position.z-s.stand.z)})).sort((a,b)=>a.distance-b.distance)[0];},walkTo(id){const s=stations.find(s=>s.id===id);return s&&player.navigate(s.stand,s.point);},
  update(state){const any=state.selectedTrays.length>0;led.material.color.set(any?0x9cece2:0x455b5a);state.trays.forEach((t,i)=>{const v=trayModels[i];v.seedling.visible=!t.harvested&&t.progress<.9;v.mature.visible=!t.harvested&&t.progress>=.9;v.harvested.visible=t.harvested;valves[i].rotation.z=state.selectedTrays.includes(t.id)?.5:0;});valve.rotation.z=state.isolated?.8:0;},
  dispose(){alive=false;disposePicking();cancelAnimationFrame(raf);removeEventListener('resize',resize);scene.traverse(o=>{if(o.isMesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});renderer.dispose();renderer.domElement.remove();}};
}
