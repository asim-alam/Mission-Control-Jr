import * as THREE from 'three';

// Small, original training-station geometry. Dimensions are metres; +Y is up.
// Colliders use world XZ bounds and deliberately leave every mission console reachable.
const TAU=Math.PI*2;
const metal=new THREE.MeshStandardMaterial({color:0xc9d0d2,metalness:.65,roughness:.38});
const white=new THREE.MeshStandardMaterial({color:0xe5e4dd,metalness:.12,roughness:.62});
const graphite=new THREE.MeshStandardMaterial({color:0x263641,metalness:.6,roughness:.43});
const orange=new THREE.MeshStandardMaterial({color:0xe28e43,metalness:.2,roughness:.5});
const floorMat=new THREE.MeshStandardMaterial({color:0x37454c,metalness:.4,roughness:.68});
const blue=new THREE.MeshStandardMaterial({color:0x123a70,metalness:.65,roughness:.27});
const lightMat=new THREE.MeshStandardMaterial({color:0xcce9ef,emissive:0xa4deea,emissiveIntensity:2});
const greenMat=new THREE.MeshStandardMaterial({color:0x97dccc,emissive:0x4a9989,emissiveIntensity:.6});

function mesh(parent,geometry,material,x=0,y=0,z=0){const m=new THREE.Mesh(geometry,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(parent,w,h,d,material,x=0,y=0,z=0){return mesh(parent,new THREE.BoxGeometry(w,h,d),material,x,y,z);}
function cylinder(parent,r1,r2,length,material,x=0,y=0,z=0,axis='z',segments=32){const m=mesh(parent,new THREE.CylinderGeometry(r1,r2,length,segments),material,x,y,z);if(axis==='z')m.rotation.x=Math.PI/2;if(axis==='x')m.rotation.z=Math.PI/2;return m;}
function ring(parent,r,t,material,x,y,z,axis='z'){const m=mesh(parent,new THREE.TorusGeometry(r,t,8,40),material,x,y,z);if(axis==='x')m.rotation.y=Math.PI/2;if(axis==='y')m.rotation.x=Math.PI/2;return m;}
function rod(parent,a,b,r=.045,material=metal){const v=new THREE.Vector3().subVectors(b,a),m=mesh(parent,new THREE.CylinderGeometry(r,r,v.length(),8),material);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());return m;}
function label(parent,text,w,h,x,y,z,rotation=0,color='#cce5e8'){
  if(typeof document==='undefined')return null;
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=160;const c=canvas.getContext('2d');
  c.fillStyle='#182831';c.fillRect(0,0,768,160);c.fillStyle='#e29b58';c.fillRect(0,0,14,160);c.font='600 43px Arial';c.textAlign='center';c.textBaseline='middle';c.fillStyle=color;c.fillText(text,391,82,718);
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const m=mesh(parent,new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}),x,y,z);m.rotation.y=rotation;return m;
}

function solarWing(parent,side){
  const g=new THREE.Group();parent.add(g);g.position.x=side*21;
  box(g,23,.16,.32,metal);for(let z=-12;z<=12;z+=3){box(g,20,.08,2.7,blue,0,.13,z);box(g,20,.05,.045,metal,0,.2,z-1.35);box(g,20,.05,.045,metal,0,.2,z+1.35);}
  // One line-segment draw call supplies the photovoltaic cell grid on each wing.
  const vertices=[];for(let z=-13.35;z<=13.35;z+=.45){vertices.push(-10,.181,z,10,.181,z);}for(let x=-10;x<=10;x+=.5){vertices.push(x,.181,-13.35,x,.181,13.35);}
  const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.add(new THREE.LineSegments(geo,new THREE.LineBasicMaterial({color:0x4f74a2,transparent:true,opacity:.5})));
  for(let z of [-10,0,10])rod(parent,new THREE.Vector3(side*3.4,1,z),new THREE.Vector3(side*12,0,z),.09);
  return g;
}

function antenna(parent){
  const pivot=new THREE.Group();pivot.position.set(0,5.6,-9);parent.add(pivot);
  cylinder(parent,.18,.24,3.2,metal,0,4,-9,'y',12);
  const positions=[],indices=[],rings=12,sectors=40,radius=2.15;
  for(let j=0;j<=rings;j++){const r=radius*j/rings;for(let i=0;i<=sectors;i++){const a=TAU*i/sectors;positions.push(r*Math.cos(a),r*r*.19,r*Math.sin(a));}}
  for(let j=0;j<rings;j++)for(let i=0;i<sectors;i++){const a=j*(sectors+1)+i,b=a+sectors+1;indices.push(a,b,a+1,b,b+1,a+1);}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  const dishMat=metal.clone();dishMat.side=THREE.DoubleSide;mesh(pivot,geometry,dishMat);
  ring(pivot,radius,.045,graphite,0,radius*radius*.19,0,'y');
  for(let a=0;a<TAU;a+=TAU/3)rod(pivot,new THREE.Vector3(Math.cos(a)*radius,.9,Math.sin(a)*radius),new THREE.Vector3(0,2,0),.035,graphite);
  cylinder(pivot,.12,.12,.4,orange,0,2,0,'y',12);pivot.rotation.z=.35;
  return pivot;
}

function consoleUnit(parent,id,x,z,rotation=0){
  const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=rotation;parent.add(g);
  box(g,.9,.92,.5,graphite,0,.46,0);box(g,.98,.08,.6,metal,0,.96,.08);
  const screen=box(g,.8,.54,.065,new THREE.MeshStandardMaterial({color:0x102c3b,emissive:0x1c6074,emissiveIntensity:.65}),0,1.37,-.09);screen.rotation.x=-.12;
  for(let i=0;i<3;i++)box(g,.53,.014,.01,greenMat,-.05,1.52-i*.12,-.049);
  for(let i=0;i<3;i++)cylinder(g,.025,.025,.025,i===0?orange:greenMat,-.25+i*.17,1.012,.14,'y',10);
  label(g,id.toUpperCase(),1.05,.22,0,1.89,-.045);
  return g;
}

export function createStation(){
  const exterior=new THREE.Group();exterior.name='Asteria orbital training station';
  const interior=new THREE.Group();interior.name='Asteria walkable interior';
  const colliders=[],cameraObjects=[],terminals=[];
  const collider=(minX,maxX,minZ,maxZ)=>colliders.push({minX,maxX,minZ,maxZ});
  function solid(w,h,d,mat,x,y,z,collision=true){const m=box(interior,w,h,d,mat,x,y,z);cameraObjects.push(m);if(collision)collider(x-w/2,x+w/2,z-d/2,z+d/2);return m;}

  // Insulated pressure vessels, external hoops, shielding bands and docking hardware.
  cylinder(exterior,3.4,3.4,36,metal,0,0,0);
  for(let z=-18;z<=18;z+=4.5){ring(exterior,3.44,.095,graphite,0,0,z);}
  cylinder(exterior,3.12,3.4,2,white,0,0,19);
  cylinder(exterior,2.05,2.05,1.15,graphite,0,0,20.3);
  ring(exterior,2.08,.19,metal,0,0,20.9);
  cylinder(exterior,3.4,2.8,2,white,0,0,-19);
  for(let side of [-1,1]){
    cylinder(exterior,3.25,3.25,9,white,side*7,0,0,'x');
    for(let x of [3.1,7,11.4])ring(exterior,3.28,.11,graphite,side*x,0,0,'x');
    cylinder(exterior,2.85,3.25,.65,graphite,side*11.6,0,0,'x');
    for(let z of [-13,13]){box(exterior,4.6,.16,5,white,side*7,-1.8,z);for(let k=-2;k<=2;k++)box(exterior,.04,.035,4.8,graphite,side*7+k*.8,-1.69,z);}
    solarWing(exterior,side);
    // External translation rails and thermal-control lines.
    rod(exterior,new THREE.Vector3(side*2.7,2.35,-17),new THREE.Vector3(side*2.7,2.35,17),.055,orange);
    for(let z=-16;z<=16;z+=4)rod(exterior,new THREE.Vector3(side*2.7,2.2,z),new THREE.Vector3(side*2.7,2.8,z),.055,orange);
  }
  const windowMat=new THREE.MeshPhysicalMaterial({color:0x7bc8e9,metalness:.25,roughness:.12,transparent:true,opacity:.65});
  cylinder(exterior,2.2,2.2,.06,windowMat,12,0,0,'x');
  label(exterior,'ASTERIA  /  MARS RELAY',6,1.1,0,1.1,18.04);
  const dish=antenna(exterior);

  // Cross-shaped deck. Four inaccessible quadrants keep movement inside the pressure hull.
  box(interior,6,.22,36,floorMat,0,-.11,0);box(interior,22,.22,12,floorMat,0,-.105,0);
  box(interior,6,.15,36,white,0,4.575,0);box(interior,22,.15,12,white,0,4.58,0);
  collider(-30,-3,-30,-6);collider(3,30,-30,-6);collider(-30,-3,6,30);collider(3,30,6,30);
  collider(-30,-11,-6,6);collider(11,30,-6,6);collider(-3,3,-30,-18);collider(-3,3,18,30);
  for(let x of [-3.1,3.1])for(let z of [-12,12])solid(.2,4.5,12,white,x,2.25,z);
  for(let z of [-6.1,6.1])for(let x of [-7,7])solid(8,4.5,.2,white,x,2.25,z);
  solid(.2,4.5,12,white,-11.1,2.25,0);
  for(let z of [-18.1,18.1]){
    solid(1.8,4.5,.2,white,-2.1,2.25,z);solid(1.8,4.5,.2,white,2.1,2.25,z);
    solid(2.4,1.1,.2,white,0,3.95,z);solid(2.35,3.35,.12,graphite,0,1.68,z);
    ring(interior,1.12,.06,orange,0,1.75,z+(z<0?.08:-.08));
  }
  // Panoramic observation port: clear centre, solid edge framing only.
  solid(.2,.7,12,graphite,11.1,.35,0);solid(.2,.65,12,graphite,11.1,4.17,0);
  solid(.2,3.2,.18,graphite,11.1,2.25,-5.85);solid(.2,3.2,.18,graphite,11.1,2.25,5.85);
  const glass=mesh(interior,new THREE.PlaneGeometry(11.5,3.12),new THREE.MeshPhysicalMaterial({color:0x9ad7e5,transparent:true,opacity:.08,roughness:.1,metalness:.05,depthWrite:false,side:THREE.DoubleSide}),11.08,2.25,0);glass.rotation.y=Math.PI/2;
  for(let z of [-3.8,0,3.8])box(interior,.15,3.2,.06,metal,11.05,2.25,z);
  label(interior,'MARS OBSERVATION / RELAY CONTROL',5,.42,10.96,3.85,0,-Math.PI/2);

  // Structural ribs and ceiling strips avoid visual clutter across the open junction.
  for(let z of [-16,-11,-6,6,11,16]){
    for(let x of [-2.88,2.88])box(interior,.15,4.1,.14,metal,x,2.1,z);
    box(interior,5.7,.13,.14,metal,0,4.35,z);
  }
  for(let x of [-1.8,1.8])box(interior,.12,.04,33,lightMat,x,4.46,0);
  for(let x of [-7,7])box(interior,7,.04,.15,lightMat,x,4.46,0);
  for(let z of [-12,0,12]){const light=new THREE.PointLight(0xcce7f2,24,17,2);light.position.set(0,3.9,z);interior.add(light);}
  for(let x of [-8,8]){const light=new THREE.PointLight(0xe5eced,15,11,2);light.position.set(x,3.8,0);interior.add(light);}
  // Deck seams, yellow route edges and bolted access panels.
  for(let z=-17;z<=17;z+=2)box(interior,5.8,.012,.025,graphite,0,.012,z);
  for(let x of [-1.28,1.28])box(interior,.035,.016,31,orange,x,.019,0);
  for(let x=-10;x<=10;x+=2)box(interior,.025,.014,11.7,graphite,x,.02,0);
  for(let z of [-4.8,4.8])for(let x of [-6,6])rod(interior,new THREE.Vector3(x-2.5,1.05,z),new THREE.Vector3(x+2.5,1.05,z),.04,orange);
  for(let z of [-11,11])for(let x of [-2.76,2.76])rod(interior,new THREE.Vector3(x,1.05,z-4),new THREE.Vector3(x,1.05,z+4),.04,orange);

  // Habitation bunks occupy the far wall, leaving the medical/kit terminal clear.
  for(let z of [-4.6,4.6]){
    solid(5,2.9,1.55,graphite,-7.8,1.45,z);
    for(let y of [.72,2.08]){box(interior,4.6,.16,1.43,white,-7.8,y,z);box(interior,3.5,.08,1.05,new THREE.MeshStandardMaterial({color:0x59717e,roughness:.95}),-8.1,y+.14,z);box(interior,.6,.18,.85,white,-6,y+.25,z);}
  }
  label(interior,'CREW QUARTERS  /  EMERGENCY KIT',5,.38,-10.96,3.65,0,Math.PI/2);
  // Right room: flight desk, secured sample drawers, and recessed science bench.
  solid(5.5,.95,1.1,graphite,7.4,.475,-5.3);
  box(interior,5.65,.09,1.18,metal,7.4,1,-5.3);
  for(let x of [5.4,6.7,8,9.3]){box(interior,.94,.6,.08,white,x,.55,-4.7);box(interior,.35,.045,.06,orange,x,.55,-4.64);}
  solid(2.5,2.5,.7,graphite,7.7,1.25,5.55);
  for(let i=0;i<4;i++)box(interior,2.2,.025,.08,metal,7.7,.4+i*.6,5.15);
  label(interior,'SEALED SAMPLES / FLIGHT LAB',4,.35,7.4,3.2,-5.97);
  // Shallow central racks sit between the interaction stations.
  for(let z of [-8,9])for(let x of [-2.52,2.52]){
    solid(.66,2.55,1.55,graphite,x,1.275,z);
    for(let y of [.5,1.1,1.7,2.3])box(interior,.025,.1,1.15,y===1.7?orange:metal,x+(x<0?.34:-.34),y,z);
  }
  const definitions=[['relay',-2,-12,0],['power',-2,-4,0],['kit',-9,0,Math.PI/2],['brief',8,0,-Math.PI/2],['airlock',0,-16,0],['craft',0,15,Math.PI]];
  for(const [id,x,z,rotation] of definitions){
    // Consoles are offset behind their interaction point rather than blocking it.
    const facing=new THREE.Vector3(0,0,-.85).applyAxisAngle(new THREE.Vector3(0,1,0),rotation);
    const unit=consoleUnit(interior,id,x+facing.x,z+facing.z,rotation);cameraObjects.push(...unit.children.filter(o=>o.isMesh));
    const halfX=Math.abs(Math.sin(rotation))>.5?.3:.5,halfZ=Math.abs(Math.sin(rotation))>.5?.5:.3;
    collider(unit.position.x-halfX,unit.position.x+halfX,unit.position.z-halfZ,unit.position.z+halfZ);
    terminals.push({id,position:new THREE.Vector3(x,0,z),object:unit});
  }
  label(interior,'ASTERIA  /  FLIGHT DECK',4,.43,0,3.65,17.95,Math.PI);
  label(interior,'TRANSFER  /  PRESSURE CHECK',4,.43,0,3.65,-17.95);
  return {exterior,interior,colliders,cameraObjects,terminals,dish};
}

export function createShuttle(){
  const group=new THREE.Group();group.name='Meridian crew transfer vehicle';
  cylinder(group,1.45,1.45,3.5,white,0,0,0);
  cylinder(group,.72,1.45,2.1,white,0,0,2.7);
  cylinder(group,.69,.69,.45,graphite,0,0,3.93);ring(group,.72,.09,metal,0,0,4.17);
  cylinder(group,1.2,1.35,1.5,graphite,0,0,-2.5);
  cylinder(group,1.5,1.45,.2,orange,0,0,1.7);
  for(let z of [-1.5,0,1.5])ring(group,1.46,.04,graphite,0,0,z);
  for(let side of [-1,1]){
    box(group,2.2,.09,2.7,blue,side*2.65,0,-1.8);box(group,1.3,.12,.15,metal,side*1.85,0,-1.8);
    for(let z=-3;z<-0.5;z+=.5)box(group,2.15,.025,.025,metal,side*2.65,.06,z);
    const port=mesh(group,new THREE.SphereGeometry(.32,12,8),new THREE.MeshStandardMaterial({color:0x0c2539,metalness:.6,roughness:.15}),side*1.17,.55,2);port.scale.set(.12,.8,1.1);port.rotation.z=-side*.4;
    for(let y of [-.8,.8]){cylinder(group,.15,.3,.55,graphite,side*.8,y,-3.5);}
    rod(group,new THREE.Vector3(side*1.2,.7,-1),new THREE.Vector3(side*1.2,.7,1),.035,orange);
  }
  label(group,'MERIDIAN / CREW TRANSFER',2.1,.32,0,.2,1.76);
  return group;
}
