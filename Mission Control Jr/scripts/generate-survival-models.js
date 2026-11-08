import {mkdir,readFile,writeFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {validateBytes} from 'gltf-validator';

globalThis.FileReader ??= class {readAsArrayBuffer(blob){blob.arrayBuffer().then(value=>{this.result=value;this.onloadend?.();}).catch(error=>{this.error=error;this.onerror?.(error);});}};
const materials=Object.fromEntries(Object.entries({shell:0xd2ddd8,frame:0x566d72,dark:0x182b33,accent:0xf19b48,water:0x68b8c9,screen:0x51d2c0,leaf:0x4eaa69,soil:0x655343}).map(([key,color])=>[key,new THREE.MeshStandardMaterial({color,roughness:.65,metalness:key==='frame'?.4:0})]));
function box(group,name,size,pos,material='shell') {const mesh=new THREE.Mesh(new THREE.BoxGeometry(...size),materials[material]);mesh.name=name;mesh.position.set(...pos);group.add(mesh);return mesh;}
function cylinder(group,name,radius,height,pos,material='frame') {const mesh=new THREE.Mesh(new THREE.CylinderGeometry(radius,radius,height,16),materials[material]);mesh.name=name;mesh.position.set(...pos);group.add(mesh);return mesh;}
function anchor(group,name,pos=[0,0,0]){const node=new THREE.Object3D();node.name=name;node.position.set(...pos);group.add(node);return node;}
function root(id,description,animatedNodes,collision){const g=new THREE.Group();g.name=id;g.userData={assetId:id,creator:'Mission Control Jr',license:'Project-original procedural model',modification:'Original geometry',units:'meters',upAxis:'+Y',forwardAxis:'+Z',origin:'ground center',description,animatedNodes,collisionProxy:collision,status:'authored educational equipment'};return g;}
function shelter(){const g=root('shelter-frame','Modular shelter alcove',['slot_left','slot_right','slot_roof','crew_anchor_1','crew_anchor_2','crew_anchor_3','crew_anchor_4'],{type:'box',size:[3,2.3,1.8]});
  box(g,'floor',[3,.1,1.8],[0,.05,0],'dark');for(const x of [-1.4,1.4]){box(g,'upright',[.12,2.2,.12],[x,1.15,-.75],'frame');box(g,'front_upright',[.12,2.2,.12],[x,1.15,.75],'frame');}
  box(g,'roof',[3,.12,1.8],[0,2.2,0],'frame');box(g,'back_wall',[2.7,1.9,.08],[0,1.1,-.82],'shell');
  anchor(g,'slot_left',[-1.1,.65,0]);anchor(g,'slot_right',[1.1,.65,0]);anchor(g,'slot_roof',[0,2.05,0]);for(let i=0;i<4;i++)anchor(g,`crew_anchor_${i+1}`,[-.8+i*.52,.1,-.25]);return g;}
function bag(){const g=root('water-bag-module','Portable sealed water module',['grip','hose_port'],{type:'box',size:[.55,.75,.35]});box(g,'soft_water_case',[.55,.7,.35],[0,.4,0],'water');box(g,'strap_left',[.05,.72,.38],[-.19,.4,0],'dark');box(g,'strap_right',[.05,.72,.38],[.19,.4,0],'dark');box(g,'carry_handle',[.3,.06,.08],[0,.83,0],'accent');anchor(g,'grip',[0,.83,0]);const port=cylinder(g,'hose_port',.06,.1,[.2,.75,0],'shell');port.rotation.z=Math.PI/2;return g;}
function monitor(){const g=root('exposure-monitor','Educational exposure trend display',['screen','indicator'],{type:'box',size:[.55,1.3,.4]});box(g,'stand',[.12,.8,.12],[0,.4,0],'frame');box(g,'base',[.5,.08,.4],[0,.04,0],'dark');box(g,'display_body',[.55,.48,.14],[0,1.05,0],'shell');box(g,'screen',[.44,.28,.02],[0,1.08,.08],'dark');box(g,'indicator',[.09,.04,.025],[.15,.88,.09],'screen');return g;}
function experiment(){const g=root('experiment-rack','Fictional recorder and experiment rack',['service_port','status_screen'],{type:'box',size:[1.1,1.65,.65]});box(g,'cabinet',[1.1,1.65,.65],[0,.825,0],'shell');box(g,'equipment_bay',[.88,1.1,.03],[0,.9,.34],'dark');for(let y=.55;y<1.4;y+=.27)box(g,'shelf',[.8,.04,.03],[0,y,.37],'frame');box(g,'status_screen',[.3,.2,.04],[.22,1.43,.36],'screen');cylinder(g,'service_port',.07,.06,[-.3,.55,.38],'accent').rotation.x=Math.PI/2;return g;}
function greenhouse(){
 const g=root('greenhouse-rack','Two established cultivation trays with individually selectable plant stages',['tray_a','tray_b','led_panel','valve_a','valve_b','growth_seedling','growth_mature','growth_harvested'],{type:'box',size:[2.5,2.1,.85]});
 for(const x of [-1.2,1.2])box(g,'rack_post',[.1,2.1,.1],[x,1.05,0],'frame');
 box(g,'rack_base',[2.5,.12,.85],[0,.1,0],'frame');box(g,'rack_top',[2.5,.12,.85],[0,2.03,0],'frame');box(g,'led_panel',[2.25,.06,.7],[0,1.91,0],'screen');
 for(const [i,id] of ['a','b'].entries()){
  const tray=new THREE.Group();tray.name=`tray_${id}`;tray.position.set(i? .6:-.6,.72,0);g.add(tray);box(tray,'tray_body',[1,.16,.7],[0,0,0],'shell');box(tray,'growing_medium',[.9,.08,.6],[0,.1,0],'soil');
  for(const stage of ['seedling','mature','harvested']){const group=new THREE.Group();group.name=`growth_${stage}_${id}`;tray.add(group);if(stage!=='harvested'){const scale=stage==='mature'?1:.48;for(const x of [-.27,0,.27]){cylinder(group,'stem',.018,.28*scale,[x,.18+.14*scale,0],'leaf');for(const angle of [0,2.09,4.18]){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),materials.leaf);leaf.scale.set(1.1*scale,.22*scale,.55*scale);leaf.position.set(x+Math.cos(angle)*.08*scale,.18+.24*scale,Math.sin(angle)*.08*scale);leaf.rotation.y=angle;group.add(leaf);}}}else box(group,'harvest_stubble',[.65,.025,.18],[0,.16,0],'leaf');}
  const valve=cylinder(g,`valve_${id}`,.075,.1,[i?.95:-.95,.7,.43],'accent');valve.rotation.x=Math.PI/2;
 }
 return g;
}
function irrigation(){const g=root('irrigation-manifold','Fictional water line teaching cutaway',['isolation_valve','pump','return_line'],{type:'box',size:[1.4,1.4,.5]});
 box(g,'backboard',[1.4,1.4,.12],[0,.7,0],'shell');const returnLine=cylinder(g,'return_line',.045,1.05,[0,.95,.18],'water');returnLine.rotation.z=Math.PI/2;
 cylinder(g,'pump',.18,.22,[-.4,.55,.2],'frame').rotation.x=Math.PI/2;const valve=cylinder(g,'isolation_valve',.11,.06,[.35,.95,.23],'accent');valve.rotation.x=Math.PI/2;
 for(const x of [-.4,.35])cylinder(g,'pipe',.04,.55,[x,.68,.18],'water');return g;}
function pumpModule(){const g=root('pump-service-module','Fictional interlocked coolant pump trainer',['power_disconnect','cover_hinge','pump_cartridge','latch'],{type:'box',size:[1.2,1.5,.6]});
 box(g,'service_frame',[1.2,1.5,.5],[0,.75,0],'shell');box(g,'service_bay',[.85,.9,.04],[0,.78,.27],'dark');
 const disconnect=box(g,'power_disconnect',[.2,.13,.08],[-.4,1.32,.3],'accent');disconnect.rotation.z=.15;
 const hinge=new THREE.Group();hinge.name='cover_hinge';hinge.position.set(-.48,1.2,.32);g.add(hinge);box(hinge,'service_cover',[.93,.85,.08],[.46,-.42,0],'frame');
 cylinder(g,'pump_cartridge',.18,.55,[0,.8,.34],'water').rotation.x=Math.PI/2;box(g,'latch',[.12,.1,.09],[.45,.8,.4],'accent');return g;}
function airCylinder(){const g=root('air-reserve-cylinder','Fictional reserve air cylinder',['valve','connector'],{type:'cylinder',radius:.28,height:1.3});
 cylinder(g,'pressure_body',.28,1.05,[0,.6,0],'shell');cylinder(g,'neck',.09,.16,[0,1.2,0],'frame');const valve=cylinder(g,'valve',.13,.06,[0,1.32,0],'accent');box(g,'connector',[.16,.1,.1],[.12,1.2,0],'water');return g;}
const designs={'shelter-frame':shelter,'water-bag-module':bag,'exposure-monitor':monitor,'experiment-rack':experiment,'greenhouse-rack':greenhouse,'irrigation-manifold':irrigation,'pump-service-module':pumpModule,'air-reserve-cylinder':airCylinder};
const target=process.argv[2];if(target&&!designs[target])throw Error(`Unknown asset: ${target}`);
const out=new URL('../assets/models/survival/',import.meta.url);await mkdir(out,{recursive:true});const report=[];
for(const [id,make] of Object.entries(designs)){if(target&&id!==target)continue;const object=make();object.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(object),size=new THREE.Vector3();bounds.getSize(size);object.userData.dimensionsMeters=size.toArray().map(n=>+n.toFixed(3));
  let triangles=0,draws=0;const mats=new Set();object.traverse(child=>{if(!child.isMesh)return;draws++;const geometry=child.geometry;triangles+=(geometry.index?geometry.index.count:geometry.attributes.position.count)/3;for(const material of Array.isArray(child.material)?child.material:[child.material])mats.add(material.name||material.uuid);});
  const bytes=Buffer.from(await new GLTFExporter().parseAsync(object,{binary:true,onlyVisible:false}));const validation=await validateBytes(new Uint8Array(bytes),{uri:`${id}.glb`});if(validation.issues.numErrors)throw Error(`${id}: ${validation.issues.numErrors} glTF errors`);await writeFile(new URL(`${id}.glb`,out),bytes);report.push({id,bytes:bytes.length,triangles,draws,materials:mats.size,boundsMeters:object.userData.dimensionsMeters,errors:validation.issues.numErrors,warnings:validation.issues.numWarnings,messages:validation.issues.messages});}
const manifestUrl=new URL('manifest.json',out);let manifest=report;if(target){let previous=[];try{previous=JSON.parse(await readFile(manifestUrl,'utf8'));}catch{}const updated=new Map(previous.map(item=>[item.id,item]));for(const item of report)updated.set(item.id,item);manifest=Object.keys(designs).flatMap(id=>updated.has(id)?[updated.get(id)]:[]);}await writeFile(manifestUrl,JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify(report,null,2));
