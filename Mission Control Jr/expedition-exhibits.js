import * as THREE from 'three';
import {heightAt,distance} from './expedition-terrain.js';
export const ROVER_PAD={x:21,z:16};
const paths={globe:new URL('./assets/models/reference-mars-globe.glb',import.meta.url),concept:new URL('./assets/models/reference-mars-rover.glb',import.meta.url),perseverance:new URL('./assets/models/reference-perseverance.glb',import.meta.url)};

export function fitReference(model,footprint){const box=new THREE.Box3().setFromObject(model),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3()),scale=footprint/Math.max(size.x,size.z);model.scale.setScalar(scale);model.position.set(-center.x*scale,-box.min.y*scale,-center.z*scale);model.traverse(o=>{if(o.isMesh){o.castShadow=false;o.receiveShadow=true;}});return model;}
function dispose(model){model?.traverse(o=>{if(o.isMesh){o.geometry.dispose();for(const material of Array.isArray(o.material)?o.material:[o.material]){for(const value of Object.values(material))if(value?.isTexture)value.dispose();material.dispose();}}});}
function sign(world,text,x,z){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle='#213638';ctx.fillRect(0,0,512,128);ctx.fillStyle='#e4b17e';ctx.font='bold 25px sans-serif';ctx.fillText(text,18,52);ctx.fillStyle='#c8ddd3';ctx.font='18px sans-serif';ctx.fillText('MERIDIAN / INTERACTIVE REFERENCE',18,91);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const plate=new THREE.Mesh(new THREE.PlaneGeometry(2.8,.7),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));plate.position.set(x,heightAt(x,z)+1.2,z);world.add(plate);}
export async function addExhibits(world,loader){
  const [globe,concept]=await Promise.all(['globe','concept'].map(id=>loader.loadAsync(paths[id].href)));
  const planet=new THREE.Group();planet.position.set(3,1.18,8);planet.add(fitReference(globe.scene,1.25));world.add(planet);
  const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(.8,.65,1.05,20),new THREE.MeshStandardMaterial({color:0x304448,roughness:.85}));pedestal.position.set(3,.525,8);pedestal.receiveShadow=true;world.add(pedestal);
  const pad=new THREE.Group();pad.position.set(ROVER_PAD.x,heightAt(ROVER_PAD.x,ROVER_PAD.z),ROVER_PAD.z);pad.rotation.y=-.3;world.add(pad);let model=fitReference(concept.scene,4),generation=0,current='concept';pad.add(model);
  const shadow=new THREE.Mesh(new THREE.CircleGeometry(2.5,40),new THREE.MeshBasicMaterial({color:0x30281f,transparent:true,opacity:.22,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.set(21,.035,16);world.add(shadow);sign(world,'ROBOTIC ROVER / INSPECT',23.5,18.5);sign(world,'MARS / NAVIGATION GLOBE',3,9.6);
  return {pad,planet,get current(){return current;},async setRover(id){if(!['concept','perseverance'].includes(id)||id===current)return;const token=++generation,gltf=await loader.loadAsync(paths[id].href);if(token!==generation){dispose(gltf.scene);return;}pad.remove(model);dispose(model);model=fitReference(gltf.scene,4);pad.add(model);current=id;},update(focus,dt){pad.visible=distance(focus,ROVER_PAD)<65;planet.rotation.y+=dt*.13;}};
}
