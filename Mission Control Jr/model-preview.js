import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MODEL_ASSETS } from './outpost.js';
import { DEMO_ASSETS } from './demo-assets.js';

// Stable names remain independent of the build's hashed asset filenames.
const missionNames={habitat:'habitat',rover:'rover-dynamic',crew:'astronaut-animated',solar:'solar-array',battery:'battery',terminal:'terminal',junction:'junction',airlock:'airlock',interior:'habitat-interior',water:'water-tank',tool:'eva-tool'};
const allAssets=[...MODEL_ASSETS,...Object.entries(DEMO_ASSETS).map(([key,url])=>({name:missionNames[key],url}))];
const uniqueAssets=[...new Map(allAssets.map(a=>[a.name,a])).values()];
for(const asset of uniqueAssets){const link=document.createElement('a');link.href=asset.url.href;link.download=asset.name+'.glb';link.textContent=asset.name+'.glb ↓';document.getElementById('downloads').appendChild(link);}

const loader=new GLTFLoader();
for (const card of document.querySelectorAll('[data-model]')) {
  const name=card.dataset.model;
  const asset=uniqueAssets.find(asset=>asset.name===name);
  const container=card.querySelector('.view');
  card.querySelector('a').href=asset.url.href;
  const renderer=new THREE.WebGLRenderer({antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=1.2;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFShadowMap;
  container.appendChild(renderer.domElement);
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(0x161d24);
  const pmrem=new THREE.PMREMGenerator(renderer);
  const room=new RoomEnvironment();
  scene.environment=pmrem.fromScene(room,0.04).texture;
  scene.environmentIntensity=0.65;
  room.dispose(); pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xd8e7f3,0x414b55,2));
  const key=new THREE.DirectionalLight(0xfff5e7,3);
  key.position.set(5,8,4); key.castShadow=true;
  key.shadow.mapSize.set(1024,1024); key.shadow.bias=-0.0003;
  Object.assign(key.shadow.camera,{left:-6,right:6,top:6,bottom:-6}); scene.add(key);
  const rim=new THREE.DirectionalLight(0x8fb8d0,2); rim.position.set(-4,5,-5); scene.add(rim);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.ShadowMaterial({opacity:0.25}));
  floor.rotation.x=-Math.PI/2; floor.position.y=-0.015; floor.receiveShadow=true; scene.add(floor);
  const camera=new THREE.PerspectiveCamera(35,1,0.01,200);
  const controls=new OrbitControls(camera,renderer.domElement);
  controls.enablePan=false; controls.enableDamping=true; controls.maxPolarAngle=Math.PI*0.49;
  const resize=()=> {
    renderer.setSize(container.clientWidth,container.clientHeight);
    camera.aspect=container.clientWidth/container.clientHeight; camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(container); resize();
  let mixer,model;
  try {
    const gltf=await loader.loadAsync(asset.url.href);model=gltf.scene;
    if(gltf.animations.length){mixer=new THREE.AnimationMixer(model);mixer.clipAction(gltf.animations.find(c=>c.name==='Idle')||gltf.animations[0]).play();}
    model.traverse(mesh=> { if(mesh.isMesh) mesh.castShadow=mesh.receiveShadow=true; });
    scene.add(model);
    const bounds=new THREE.Box3().setFromObject(model);
    const size=bounds.getSize(new THREE.Vector3());
    const target=bounds.getCenter(new THREE.Vector3());
    const radius=Math.max(size.x,size.y,size.z);
    const direction=name.startsWith('astronaut')?new THREE.Vector3(0.85,0.35,1.7):new THREE.Vector3(1.3,0.7,1.65);
    const distance=radius/(2*Math.tan(THREE.MathUtils.degToRad(35)/2))*1.2;
    camera.position.copy(target).add(direction.normalize().multiplyScalar(distance));
    controls.target.copy(target); controls.minDistance=radius*0.7; controls.maxDistance=radius*5;
    controls.update();
    card.querySelector('.status').textContent='Ready';
  } catch(error) {
    card.querySelector('.status').textContent='Model unavailable'; console.error(error);
  }
  const timer=new THREE.Timer();timer.connect(document);
  renderer.setAnimationLoop(time=> {timer.update(time);mixer?.update(Math.min(.05,timer.getDelta()));controls.update();renderer.render(scene,camera);});
}
