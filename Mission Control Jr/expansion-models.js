// Turntable gallery for the generated expansion GLBs (also used for screenshot checks).
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import manifest from './assets/models/expansion/manifest.json' with {type:'json'};
const urls=import.meta.glob('./assets/models/expansion/*.glb',{query:'?url',import:'default',eager:true});
const params=new URLSearchParams(location.search),only=params.get('only')?.split(','),skip=/interior|terrain|site|south-pole|airlock/;
const baseBossPreview = !only && params.get('group') === 'base-boss';
const list=manifest.filter(m=>only?only.includes(m.id):!m.id.startsWith('base-boss-')&&!skip.test(m.id));
const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.shadowMap.enabled=true;document.body.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color(0x1d1940);scene.environment=new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(),.04).texture;scene.environmentIntensity=.8;
const sun=new THREE.DirectionalLight(0xfff1dd,2.2);sun.position.set(6,10,8);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20});scene.add(sun);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(80,80),new THREE.MeshStandardMaterial({color:0x2c2858,roughness:.9}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
const camera=new THREE.PerspectiveCamera(40,innerWidth/innerHeight,.05,300);const controls=new OrbitControls(camera,renderer.domElement);
const loader=new GLTFLoader(),cols=Math.ceil(Math.sqrt(list.length)),tags=[];let x=0,z=0,rowDepth=0,maxX=0;
async function loadModel(id) {
  const {scene: model} = await loader.loadAsync(urls[`./assets/models/expansion/${id}.glb`]);
  model.traverse(part => {
    if (!part.isMesh) return;
    part.castShadow = !part.material.transparent;
    part.receiveShadow = true;
  });
  return model;
}

function label(text, position) {
  const element = document.createElement('div');
  element.className = 'tag';
  element.textContent = text;
  document.getElementById('tags').append(element);
  tags.push([element, position]);
}

if (baseBossPreview) {
  await stageBaseBoss();
} else {
  document.getElementById('count').textContent=`${list.length} models`;
  for(const [i,item] of list.entries()){
   const obj = await loadModel(item.id);
   const bounds=new THREE.Box3().setFromObject(obj),size=bounds.getSize(new THREE.Vector3()),lift=Math.max(0,-bounds.min.y);const cell=Math.max(size.x,size.z)+1;
   if(i%cols===0&&i){x=0;z+=rowDepth;rowDepth=0;}obj.position.set(x+cell/2,lift,z+cell/2);x+=cell;rowDepth=Math.max(rowDepth,cell);maxX=Math.max(maxX,x);scene.add(obj);
   label(item.id, new THREE.Vector3(obj.position.x,size.y+.15,obj.position.z));
  }
  const cx=maxX/2,cz=(z+rowDepth)/2,span=Math.max(maxX,z+rowDepth);controls.target.set(cx,.6,cz);camera.position.set(cx,span*.55+1,cz+span*.8+1);
  const az=params.get('az');if(az){const r=camera.position.distanceTo(controls.target);camera.position.set(cx+Math.sin(+az)*r*.8,camera.position.y,cz+Math.cos(+az)*r*.8);}controls.update();
}

async function stageBaseBoss() {
  document.getElementById('info').textContent = 'Base Boss · One Crate Before Dark — drag to orbit, scroll to zoom';
  scene.background.set(0xb87953);
  scene.fog = new THREE.FogExp2(0xb87953, .023);
  const ground = await new THREE.TextureLoader().loadAsync(new URL('./assets/mars-ground.webp', import.meta.url));
  ground.colorSpace = THREE.SRGBColorSpace;
  ground.wrapS = ground.wrapT = THREE.RepeatWrapping;
  ground.repeat.set(38, 38);
  ground.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  floor.material.map = ground;
  floor.material.color.set(0xe7c0a9);
  floor.scale.setScalar(3);
  scene.environmentIntensity = .64;
  sun.position.set(-8, 10, 10);
  sun.shadow.normalBias = .025;
  const sky = new THREE.HemisphereLight(0xffe9d7, 0xb46742, .72);
  scene.add(sky);

  const placements = [
    ['base-boss-verdant', 3.1, -2.75, -.28, 'Verdant greenhouse', 4.15],
    ['base-boss-landing-cache', -5.8, -1.25, .3, 'Landing cache', 3.45],
    ['base-boss-utility-rover', -.05, 4.8, -.72, 'Pressurized rover', 3.46],
    ['base-boss-charge-post', -4.65, 3.1, .18, 'Charging post', 1.82],
  ];
  const models = await Promise.all(placements.map(([id]) => loadModel(id)));
  for (const [index, model] of models.entries()) {
    const [, x, z, heading, name, height] = placements[index];
    model.position.set(x, 0, z);
    model.rotation.y = heading;
    scene.add(model);
    label(name, new THREE.Vector3(x, height, z));
  }

  const [verdant, cache, rover] = models;
  const [crate, valve, recycler] = await Promise.all(
    ['base-boss-valve-crate', 'check-valve', 'water-recycler'].map(loadModel)
  );
  const loadedCrate = crate.clone();
  rover.getObjectByName('cargo_slot_a').add(loadedCrate);
  cache.getObjectByName('cache_slot_a').add(crate);
  crate.getObjectByName('crate_lid').rotation.x = -1.12;
  crate.getObjectByName('valve_stowage').add(valve);
  verdant.getObjectByName('recycler_mount').add(recycler);

  const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({color: 0x82482f, roughness: 1}), 92);
  const transform = new THREE.Object3D();
  for (let i = 0; i < rocks.count; i++) {
    const angle = i * 2.39996;
    const radius = 11.5 + (i % 23) * 1.28;
    const scale = .18 + (i % 7) * .13;
    transform.position.set(Math.cos(angle) * radius, scale * .09, Math.sin(angle) * radius - 1.4);
    transform.scale.set(scale, scale * .55, scale * .84);
    transform.rotation.y = angle;
    transform.updateMatrix();
    rocks.setMatrixAt(i, transform.matrix);
  }
  rocks.receiveShadow = true;
  scene.add(rocks);

  controls.target.set(-.6, 1.05, -.9);
  camera.position.set(10, 9.6, 17.6);
  if (innerWidth < innerHeight) {
    camera.position.sub(controls.target).multiplyScalar(1.4).add(controls.target);
  }
  controls.update();
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
renderer.setAnimationLoop(()=>{controls.update();renderer.render(scene,camera);for(const [el,p] of tags){const v=p.clone().project(camera);el.style.left=`${(v.x+1)/2*innerWidth}px`;el.style.top=`${(1-v.y)/2*innerHeight}px`;el.style.display=v.z<1?'':'none';}});
window.galleryReady=true;
