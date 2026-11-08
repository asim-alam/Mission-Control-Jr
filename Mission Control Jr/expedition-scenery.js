import * as THREE from 'three';
import {HOME,RIDGE,HAZARD,ROUTES,ROCKS,distance,heightAt} from './expedition-terrain.js';
import {MARS_VISUALS} from './mars-visuals.js';

function segmentDistance(p,a,b){const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz)));return distance(p,{x:a.x+t*dx,z:a.z+t*dz});}
export function clearCorridor(p){return Object.values(ROUTES).every(r=>r.points.slice(1).every((b,i)=>segmentDistance(p,r.points[i],b)>9))&&distance(p,HOME)>23&&distance(p,RIDGE)>17&&distance(p,HAZARD)>18;}

export function addScenery(world,label){
  const mat=new THREE.MeshStandardMaterial({color:MARS_VISUALS.rock,roughness:1}),geom=new THREE.DodecahedronGeometry(1,0),matrix=new THREE.Matrix4(),q=new THREE.Quaternion(),v=new THREE.Vector3();
  const points=[];
  // Clusters follow existing collidable boulder landmarks; small fragments stay outside corridors.
  for(let c=0;c<ROCKS.length;c++)for(let i=0;i<24;i++){const a=i*2.399+c,r=3+(i%8)*.85,p={x:ROCKS[c].x+Math.cos(a)*r,z:ROCKS[c].z+Math.sin(a)*r};if(clearCorridor(p))points.push({...p,s:.15+(i%5)*.1,a});}
  const stones=new THREE.InstancedMesh(geom,mat,points.length);points.forEach((p,i)=>{q.setFromAxisAngle(new THREE.Vector3(0,1,0),p.a);matrix.compose(v.set(p.x,heightAt(p.x,p.z)+p.s*.15,p.z),q,new THREE.Vector3(p.s,p.s*.45,p.s*1.3));stones.setMatrixAt(i,matrix);});stones.receiveShadow=true;world.add(stones);
  // Distant silhouettes outside playable bounds. These are fictional Meridian landforms.
  const hills=new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1,1),mat,18);
  for(let i=0;i<18;i++){const a=i/18*Math.PI*2,r=170+(i%3)*18;q.setFromAxisAngle(new THREE.Vector3(0,1,0),i);matrix.compose(v.set(10+Math.cos(a)*r,-2,-75+Math.sin(a)*r),q,new THREE.Vector3(16+i%4*4,9+i%5*4,18+i%3*5));hills.setMatrixAt(i,matrix);}world.add(hills);
  const pale=new THREE.MeshStandardMaterial({color:0xb8a18a,roughness:1}),dark=new THREE.MeshStandardMaterial({color:0x26383b,roughness:.9}),orange=new THREE.MeshStandardMaterial({color:0xcf9763,roughness:.8});
  const boxGeo=new THREE.BoxGeometry(1,1,1);
  function box(x,y,z,sx,sy,sz,material){const mesh=new THREE.Mesh(boxGeo,material);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=mesh.receiveShadow=true;world.add(mesh);return mesh;}
  // Cargo stays against the solar service area, away from the manual test apron.
  for(const [x,z]of [[-11,12],[-13,12],[-11,14]]){box(x,.45,z,1.2,.9,.9,pale);box(x,.85,z,1.23,.08,.94,orange);}
  box(-4,.28,7.15,1.9,.12,.6,dark);box(5,.04,7,2.4,.08,2.4,dark);
  const cablePoints=[new THREE.Vector3(-9,.08,5),new THREE.Vector3(-8,.08,7.8),new THREE.Vector3(-5,.08,8.1),new THREE.Vector3(-4,.1,6)];
  world.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cablePoints),24,.035,5,false),dark));
  function sign(text,x,z){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=160;const c=canvas.getContext('2d');c.fillStyle='#263638';c.fillRect(0,0,512,160);c.fillStyle='#efba83';c.fillRect(0,0,10,160);c.font='bold 29px sans-serif';c.fillText(text,25,69);c.font='19px sans-serif';c.fillStyle='#d0ded6';c.fillText('MERIDIAN / FIELD OPERATIONS',25,112);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2.5,.78),new THREE.MeshStandardMaterial({map:texture,roughness:1,side:THREE.DoubleSide}));mesh.position.set(x,heightAt(x,z)+1.6,z);world.add(mesh);box(x,heightAt(x,z)+.7,z,.07,1.4,.07,dark);}
  sign('R2 / SUPPLY RACK',-4,5.2);sign('OPERATIONS / RECORDS',5,6.3);
  for(const [text,x,z]of [['NORTH WASH',-47,-85],['RIM ESCARPMENT',88,-90],['KESTREL / FIELD PARKING',47,-153]])sign(text,x,z);
  label('R2 / CHARGED SPARE',-4,6,2.5);label('OPERATIONS / RADIO + RECORDS',5,7,2.8);
  const target=new THREE.Group(),targetMaterial=new THREE.MeshBasicMaterial({color:0xffca88,transparent:true,opacity:.85,depthWrite:false});
  const ring=new THREE.Mesh(new THREE.RingGeometry(.8,1.02,40),targetMaterial);ring.rotation.x=-Math.PI/2;target.add(ring);
  const pointer=new THREE.Mesh(new THREE.OctahedronGeometry(.23),targetMaterial);pointer.position.y=2.2;target.add(pointer);world.add(target);
  return {update(task,time,focus){target.visible=!!task.target;if(task.target){target.position.set(task.target.x,heightAt(task.target.x,task.target.z)+.08,task.target.z);pointer.visible=!focus||distance(focus,task.target)>4;pointer.position.y=2.2+Math.sin(time*.002)*.12;const scale=task.stage===4||task.stage===5?2.4:1;ring.scale.setScalar(scale);}}};
}
