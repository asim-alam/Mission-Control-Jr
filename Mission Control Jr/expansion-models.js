// Turntable gallery for the generated expansion GLBs (also used for screenshot checks).
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import manifest from './assets/models/expansion/manifest.json' with {type:'json'};
const urls=import.meta.glob('./assets/models/expansion/*.glb',{query:'?url',import:'default',eager:true});
const params=new URLSearchParams(location.search),only=params.get('only')?.split(','),skip=/interior|terrain|site|south-pole|airlock/;
const list=manifest.filter(m=>only?only.includes(m.id):!skip.test(m.id));
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;document.body.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x1d1940);scene.environment=new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.8;
const sun=new THREE.DirectionalLight(0xfff1dd,2.2);sun.position.set(6,10,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20});scene.add(sun);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(80,80),new THREE.MeshStandardMaterial({color:0x2c2858,roughness:.9}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
const camera=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,.05,300);const controls=new OrbitControls(camera,renderer.domElement);
const loader=new GLTFLoader(),cols=Math.ceil(Math.sqrt(list.length)),tags=[];let x=0,z=0,rowDepth=0,maxX=0;
document.getElementById('count').textContent=`${list.length} models`;
for(const [i,item] of list.entries()){
 const gltf=await loader.loadAsync(urls[`./assets/models/expansion/${item.id}.glb`]);const obj=gltf.scene;obj.traverse(o=>{if(o.isMesh){o.castShadow=o.receiveShadow=true;}});
 const bounds=new THREE.Box3().setFromObject(obj),size=bounds.getSize(new THREE.Vector3()),lift=Math.max(0,-bounds.min.y);const cell=Math.max(size.x,size.z)+1;
 if(i%cols===0&&i){x=0;z+=rowDepth;rowDepth=0;}obj.position.set(x+cell/2,lift,z+cell/2);x+=cell;rowDepth=Math.max(rowDepth,cell);maxX=Math.max(maxX,x);scene.add(obj);
 const el=document.createElement('div');el.className='tag';el.textContent=item.id;document.getElementById('tags').append(el);tags.push([el,new THREE.Vector3(obj.position.x,size.y+.15,obj.position.z)]);
}
const cx=maxX/2,cz=(z+rowDepth)/2,span=Math.max(maxX,z+rowDepth);controls.target.set(cx,.6,cz);camera.position.set(cx,span*.55+1,cz+span*.8+1);
const az=params.get('az');if(az){const r=camera.position.distanceTo(controls.target);camera.position.set(cx+Math.sin(+az)*r*.8,camera.position.y,cz+Math.cos(+az)*r*.8);}controls.update();
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);for(const [el,p] of tags){const v=p.clone().project(camera);el.style.left=`${(v.x+1)/2*innerWidth}px`;el.style.top=`${(1-v.y)/2*innerHeight}px`;el.style.display=v.z<1?'':'none';}});
window.galleryReady=true;
