import { mkdir, writeFile } from 'node:fs/promises';
import * as T from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { validateBytes } from 'gltf-validator';
import { createRover, optimizeModel } from './model-designs.js';
import { roverDynamic } from './mission-models.js';

// Original expedition models. Geometry and material data are embedded in each GLB.
globalThis.FileReader ??= class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(result => { this.result=result; this.onloadend?.(); })
      .catch(error => { this.error=error; this.onerror?.(error); });
  }
};
const palette={
  white:[0xdce3df,.15,.6], dark:[0x1a262d,.35,.65], orange:[0xe78b3d,.2,.55],
  metal:[0x8e9fa3,.75,.35], seat:[0x254656,.1,.82], light:[0x99eadd,.1,.25],
  basalt:[0x3b383b,0,1], redrock:[0x8f5542,0,1], ochre:[0xb77c53,0,1],
  pale:[0xd6b58d,0,1], cream:[0xe5cfac,0,1], dust:[0xa66c4e,0,1],
};
const materials=Object.fromEntries(Object.entries(palette).map(([name,[color,metalness,roughness]])=>{
  const m=new T.MeshStandardMaterial({color,metalness,roughness});m.name=name;
  if(name==='light'){m.emissive.set(0x368c80);m.emissiveIntensity=.5;}
  return [name,m];
}));
function box(g,size,mat,pos,r=.025){
  const m=new T.Mesh(new RoundedBoxGeometry(...size,2,r),materials[mat]);m.position.set(...pos);g.add(m);return m;
}
function beam(g,a,b,r,mat){
  const from=new T.Vector3(...a),to=new T.Vector3(...b);
  const m=new T.Mesh(new T.CylinderGeometry(r,r,from.distanceTo(to),12),materials[mat]);
  m.position.copy(from.clone().add(to).multiplyScalar(.5));
  m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),to.sub(from).normalize());g.add(m);return m;
}
function sphere(g,size,mat,pos){
  const m=new T.Mesh(new T.SphereGeometry(1,12,8),materials[mat]);m.scale.set(...size);m.position.set(...pos);g.add(m);return m;
}
function crewedRover(){
  // Reuse the working animated wheel nodes while replacing the uncrewed opaque hull.
  const g=roverDynamic();g.name='Meridian two-seat EVA expedition rover';
  g.remove(g.getObjectByName('chassis'));
  const source=createRover();source.updateMatrixWorld(true);
  for(const child of [...source.children]){
    const bounds=new T.Box3().setFromObject(child);
    if(child.name==='All-terrain wheel'||bounds.max.y>1.46)source.remove(child);
  }
  const body=new T.Group();body.name='Open EVA chassis';body.add(source);
  // Open footwell and low side rails expose both riders from a chase camera.
  box(body,[2.75,.11,1.56],'dark',[.36,1.38,0]);
  for(const z of [-.88,.88]){
    beam(body,[-.68,1.55,z],[1.39,1.55,z],.035,'orange');
    beam(body,[-.68,1.4,z],[-.68,2.58,z],.042,'metal');
    beam(body,[1.39,1.4,z],[1.39,2.58,z],.042,'metal');
    beam(body,[-.68,2.58,z],[1.39,2.58,z],.042,'orange');
    box(body,[.75,.075,.24],'metal',[.24,1.05,z*1.18]);
  }
  for(const x of [-.68,1.39])beam(body,[x,2.58,-.88],[x,2.58,.88],.042,'metal');
  // Two individual seat pans and backs. No windshield blocks the EVA suits.
  for(const z of [-.46,.46]){
    box(body,[.58,.11,.58],'seat',[.13,1.43,z],.07);
    box(body,[.12,.66,.57],'seat',[-.2,1.8,z],.06);
    box(body,[.14,.17,.39],'dark',[-.21,2.17,z],.035);
    for(const side of [-1,1])box(body,[.3,.07,.045],'metal',[.02,1.76,z+side*.32]);
    beam(body,[-.12,2.05,z-.2],[.34,1.49,z+.19],.025,'orange');
    box(body,[.09,.055,.08],'metal',[.34,1.49,z+.19],.01);
    box(body,[.22,.07,.3],'dark',[.98,1.48,z]);
  }
  box(body,[.25,.25,1.41],'white',[1.2,1.88,0],.055);
  box(body,[.021,.15,.42],'dark',[1.061,1.92,-.45],.01);
  box(body,[.023,.027,.31],'light',[1.046,1.94,-.45],.005);
  beam(body,[.88,1.64,-.46],[.92,1.91,-.46],.025,'dark');
  beam(body,[.85,1.94,-.57],[.85,1.94,-.35],.025,'orange');
  // Rear equipment deck, independent of the cab and the sensor head.
  box(body,[.76,.36,1.3],'white',[-1.3,1.63,0],.06);
  for(const z of [-.44,.44])box(body,[.79,.045,.055],'orange',[-1.3,1.84,z]);
  beam(body,[-.82,1.4,0],[-.82,2.76,0],.047,'metal');
  box(body,[.17,.1,.14],'orange',[-.82,2.48,0]);
  const chassis=optimizeModel(body,false);chassis.name='chassis';g.add(chassis);
  for(const [name,z] of [['driver',-.46],['passenger',.46]]){
    const mount=new T.Object3D();mount.name=`seat_${name}`;mount.position.set(.25,.56,z);mount.rotation.y=Math.PI/2;g.add(mount);
  }
  g.userData={units:'meters',static:false,forwardAxis:'+X',wheelRadius:.49,
    description:'Open unpressurized two-seat EVA rover; riders wear suits',
    seats:{driver:{position:[.25,.56,-.46],rotationY:Math.PI/2},passenger:{position:[.25,.56,.46],rotationY:Math.PI/2}}};
  return g;
}

// Jagged polygon extrusions create clearly legible geological strata without textures.
function stratum(g,width,depth,bottom,top,mat,seed){
  const count=14,verts=[],indices=[];
  const ring=[];
  for(let i=0;i<count;i++){
    const a=i/count*Math.PI*2;
    const jitter=1+.065*Math.sin(i*7.37+seed*3.1);
    ring.push([Math.cos(a)*width*.5*jitter,Math.sin(a)*depth*.5*jitter]);
  }
  for(const y of [bottom,top])for(let i=0;i<count;i++){
    const [x,z]=ring[i];verts.push(x,y+.045*Math.sin(i*2.1+seed),z);
  }
  for(let i=0;i<count;i++){
    const n=(i+1)%count;
    indices.push(i,count+i,n,n,count+i,count+n);
  }
  for(let i=1;i<count-1;i++)indices.push(0,i,i+1,count,count+i+1,count+i);
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(verts,3));
  geo.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(verts.length/3*2),2));
  geo.setIndex(indices);geo.computeVertexNormals();
  const m=new T.Mesh(geo,materials[mat]);g.add(m);return m;
}
function outcrop(){
  const g=new T.Group();g.name='Kestrel layered sedimentary outcrop';
  stratum(g,8.1,4.4,.06,.55,'basalt',1);
  stratum(g,7.75,4.1,.53,.78,'redrock',2);
  stratum(g,7.35,3.9,.76,1.05,'pale',3);
  stratum(g,7.0,3.75,1.02,1.15,'ochre',4);
  stratum(g,6.8,3.6,1.13,1.48,'cream',5);
  stratum(g,6.4,3.45,1.46,1.6,'redrock',6);
  stratum(g,6.0,3.15,1.58,1.88,'pale',7);
  stratum(g,5.4,2.8,1.86,2.06,'ochre',8);
  // Tilted broken blocks at the foot of the exposure give a safe observation ledge.
  for(let i=0;i<9;i++){
    const x=-3.5+i*.84,z=2.05+.12*Math.sin(i*2.4);
    const m=box(g,[.5+.15*Math.sin(i+2),.16,.32],'pale',[x,.1,z],.025);
    m.rotation.y=i*.47;m.rotation.z=.12*Math.sin(i*1.6);
  }
  const result=optimizeModel(g);result.userData={units:'meters',static:true,
    description:'Illustrative layered outcrop: dark basal unit and alternating pale fine layers; morphology alone does not prove past water or life',
    observationFaces:['+Z','-Z'],sampleLocal:[.5,.82,1.9]};return result;
}
function sample(){
  const g=new T.Group();g.name='Sealed field sample cartridge';
  const c=new T.Mesh(new T.CylinderGeometry(.057,.057,.23,20),materials.metal);c.position.y=.155;g.add(c);
  for(const y of [.052,.258]){
    const cap=new T.Mesh(new T.CylinderGeometry(.064,.064,.033,20),materials.orange);cap.position.y=y;g.add(cap);
  }
  box(g,[.085,.1,.008],'white',[0,.154,.055],.004);
  for(let i=0;i<4;i++)box(g,[.044,.005,.003],'dark',[0,.135+i*.014,.06],.001);
  sphere(g,[.027,.035,.027],'pale',[0,.293,0]);
  return optimizeModel(g);
}
function scaleMarker(){
  const g=new T.Group();g.name='Geology scale and orientation marker';
  box(g,[.52,.017,.16],'white',[0,.015,0],.007);
  for(let i=0;i<10;i++)box(g,[.048,.003,.112],i%2?'white':'dark',[-.225+i*.05,.025,0],.001);
  box(g,[.05,.006,.14],'orange',[.232,.027,0],.002);
  beam(g,[-.24,.024,0],[-.24,.37,0],.01,'metal');
  const flag=new T.Shape();flag.moveTo(0,0);flag.lineTo(.1,-.035);flag.lineTo(0,-.07);flag.closePath();
  const marker=new T.Mesh(new T.ExtrudeGeometry(flag,{depth:.006,bevelEnabled:false}),materials.orange);marker.position.set(-.24,.37,0);g.add(marker);
  const result=optimizeModel(g);result.userData={units:'meters',static:true,scaleLengthMeters:.5};return result;
}

const directory=new URL('../assets/models/',import.meta.url);await mkdir(directory,{recursive:true});
const exporter=new GLTFExporter();
const designs=[['rover-crewed',crewedRover],['kestrel-outcrop',outcrop],['field-sample',sample],['scale-marker',scaleMarker]];
const names=process.argv.slice(2);
if(names.some(name=>!designs.some(([id])=>id===name)))throw new Error('Unknown expedition model requested');
for(const [name,create] of designs.filter(([id])=>!names.length||names.includes(id))){
  const model=create();
  const glb=await exporter.parseAsync(model,{binary:true});
  const bytes=new Uint8Array(glb);
  const validation=await validateBytes(bytes,{uri:`${name}.glb`});
  if(validation.issues.numErrors)throw new Error(`${name}: ${JSON.stringify(validation.issues)}`);
  await writeFile(new URL(`${name}.glb`,directory),bytes);
  let triangles=0,meshes=0;model.traverse(m=>{if(m.isMesh){meshes++;triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;}});
  const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3());
  console.log(JSON.stringify({name,bytes:bytes.length,size:size.toArray().map(v=>+v.toFixed(3)),bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()},meshes,triangles,errors:validation.issues.numErrors,warnings:validation.issues.numWarnings,metadata:model.userData}));
}
