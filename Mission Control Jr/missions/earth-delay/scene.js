import {bindStationPicking} from '../../simulation/picking.js';
import {getMissionAssets} from '../../mission-assets.js';
import {graphicsProfile} from '../../simulation/graphics.js';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Player} from '../../player.js';
const urls=getMissionAssets('earth-delay');
export async function createScene({container,onInteract,onPause,onMove}){
 const {lowEffects:lowQuality,pixelRatioCap}=graphicsProfile();const renderer=new THREE.WebGLRenderer({antialias:!lowQuality});renderer.setPixelRatio(Math.min(devicePixelRatio,pixelRatioCap));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;container.append(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color(0x25363c);const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.05,80);scene.add(new THREE.HemisphereLight(0xd3ede5,0x314144,2));const light=new THREE.DirectionalLight(0xffe0c1,2);light.position.set(-3,8,4);scene.add(light);
 const mat=color=>new THREE.MeshStandardMaterial({color,roughness:.8});const floor=new THREE.Mesh(new THREE.BoxGeometry(14,.2,12),mat(0x52666a));floor.position.y=-.1;scene.add(floor);for(const [x,z,w,d]of[[0,-6,14,.2],[-7,0,.2,12],[7,0,.2,12]]){const wall=new THREE.Mesh(new THREE.BoxGeometry(w,3.8,d),mat(0x9eafaa));wall.position.set(x,1.9,z);scene.add(wall);}
 const loader=new GLTFLoader(),assets=Object.fromEntries(await Promise.all(Object.entries(urls).map(async([id,url])=>[id,(await loader.loadAsync(url.href)).scene])));const add=(id,x,z)=>{const o=assets[id].clone(true);o.position.set(x,0,z);scene.add(o);return o;};
 const pump=add('pump',-3,-4.7),reserve=add('reserve',0,-4.7),terminal=add('terminal',4,-4.7),crew=add('crew',3,2);crew.scale.setScalar(.8);
 const hinge=pump.getObjectByName('cover_hinge'),cartridge=pump.getObjectByName('pump_cartridge'),disconnect=pump.getObjectByName('power_disconnect'),valve=reserve.getObjectByName('valve'),screen=terminal.getObjectByName('status_screen');screen.material=screen.material.clone();
 const stations=[{id:'pump',title:'Pump service module',point:{x:-3,z:-4.7},stand:{x:-3,z:-2.8},model:pump},{id:'reserve',title:'Air reserve',point:{x:0,z:-4.7},stand:{x:0,z:-2.8},model:reserve},{id:'terminal',title:'Earth message terminal',point:{x:4,z:-4.7},stand:{x:4,z:-2.8},model:terminal}];
 const player=new Player(camera,renderer.domElement,onInteract,onPause,()=>{});player.bounds={minX:-6.3,maxX:6.3,minZ:-5.5,maxZ:5.5};player.position.set(0,1.68,4.5);player.yaw=0;player.syncCamera();player.enabled=false;const disposePicking=bindStationPicking(renderer.domElement,camera,player,stations,onInteract);player.obstacles=[{minX:-3.8,maxX:-2.2,minZ:-5.3,maxZ:-4.2},{minX:-.4,maxX:.4,minZ:-5.1,maxZ:-4.3},{minX:3.3,maxX:4.7,minZ:-5.2,maxZ:-4.2}];
 let last=performance.now(),alive=true,raf=0;function animate(now){if(!alive)return;const dt=Math.min((now-last)/1000,.1);last=now;if(player.update(dt))onMove(dt);renderer.render(scene,camera);raf=requestAnimationFrame(animate);}raf=requestAnimationFrame(animate);
 function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}addEventListener('resize',resize);
 return {player,stations,nearest(){return stations.map(s=>({...s,distance:Math.hypot(player.position.x-s.stand.x,player.position.z-s.stand.z)})).sort((a,b)=>a.distance-b.distance)[0];},walkTo(id){const s=stations.find(s=>s.id===id);return s&&player.navigate(s.stand,s.point);},
 update(state){hinge.rotation.y=state.coverOpen?-1.4:0;cartridge.scale.setScalar(state.cartridgeReplaced?.85:1);disconnect.rotation.z=state.branchIsolated?-.7:.15;valve.rotation.y=state.reserveConnected?1:0;screen.material.color.set(state.message?.status==='delivered'?0x68e0b0:state.message?0xe1a253:0x415455);},
 dispose(){alive=false;disposePicking();cancelAnimationFrame(raf);removeEventListener('resize',resize);scene.traverse(o=>{if(o.isMesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose());}});renderer.dispose();renderer.domElement.remove();}};
}
