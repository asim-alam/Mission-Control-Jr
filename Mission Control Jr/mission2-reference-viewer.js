import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export const REFERENCES=[
  {name:'Olympus Mons',caption:'Terrain reference · illustrative scale. This is not the local geography of fictional Meridian.',author:'SebastianSosnowski',source:'https://sketchfab.com/3d-models/mars-olympus-mons-53679864b41a43b0ae0459ce99d6adf0',license:'CC BY 4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0/',url:new URL('./assets/models/reference-olympus-mons.glb',import.meta.url)},
  {name:'Perseverance',caption:'Robotic rover reference. Compare its instruments with our fictional crew transport; it has no seats for the field crew.',author:'Thomas Flynn',source:'https://sketchfab.com/3d-models/perseverance-nasa-mars-landing-2021-c1c94e1f69df45eeae4a0a1d0d27e85b',license:'CC0 1.0',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',url:new URL('./assets/models/reference-perseverance.glb',import.meta.url)},
  {name:'Mars rover concept',caption:'Robotic concept reference by its original creator. It is separate from Rover Two and Perseverance.',author:'Gregori Vorontsov',source:'https://sketchfab.com/3d-models/mars-rover-df65512e57f848fe8107823ad0a45e7d',license:'CC BY 4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0/',url:new URL('./assets/models/reference-mars-rover.glb',import.meta.url)},
  {name:'Mars globe',caption:'Planet reference for the navigation table. It is a globe, not local terrain or the outpost sky.',author:'Akshat',source:'https://sketchfab.com/3d-models/mars-9c7bbc64d8c74acfa9ec344c0fc10e1a',license:'CC BY 4.0',licenseUrl:'https://creativecommons.org/licenses/by/4.0/',url:new URL('./assets/models/reference-mars-globe.glb',import.meta.url)},
];

export async function showReference(container,index,alive=()=>true){
  const ref=REFERENCES[index],status=document.createElement('p');status.textContent=`Loading ${ref.name}…`;container.replaceChildren(status);
  const gltf=await new GLTFLoader().loadAsync(ref.url.href);
  const disposeModel=()=>gltf.scene.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const mat of Array.isArray(o.material)?o.material:[o.material]){for(const value of Object.values(mat))if(value?.isTexture)value.dispose();mat.dispose();}}});
  if(!alive()){disposeModel();return ()=>{};}
  const renderer=new THREE.WebGLRenderer({antialias:true});renderer.setPixelRatio(1);renderer.setSize(640,360);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.domElement.setAttribute('aria-label',`${ref.name} interactive 3D reference. Drag to rotate.`);container.replaceChildren(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color(0x172a32);scene.add(new THREE.HemisphereLight(0xe5edf2,0x6c4030,2.2));const sun=new THREE.DirectionalLight(0xffeedc,3);sun.position.set(4,6,3);scene.add(sun);
  const group=new THREE.Group(),box=new THREE.Box3().setFromObject(gltf.scene),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=4/Math.max(size.x,size.z);gltf.scene.scale.setScalar(scale);gltf.scene.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);group.add(gltf.scene);scene.add(group);
  const cam=new THREE.PerspectiveCamera(40,640/360,.01,100);cam.position.set(5,4.8,6);cam.lookAt(0,.6,0);const render=()=>renderer.render(scene,cam);render();
  let x=null;renderer.domElement.onpointerdown=e=>{x=e.clientX;renderer.domElement.setPointerCapture(e.pointerId);};renderer.domElement.onpointermove=e=>{if(x!==null){group.rotation.y+=(e.clientX-x)*.009;x=e.clientX;render();}};renderer.domElement.onpointerup=()=>x=null;renderer.domElement.onpointercancel=()=>x=null;
  renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();const target=new THREE.Vector3(0,.6,0),offset=cam.position.clone().sub(target),length=THREE.MathUtils.clamp(offset.length()*(e.deltaY>0?1.12:.89),3,22);cam.position.copy(target.add(offset.setLength(length)));cam.lookAt(0,.6,0);render();},{passive:false});
  return ()=>{disposeModel();renderer.dispose();renderer.domElement.remove();};
}
