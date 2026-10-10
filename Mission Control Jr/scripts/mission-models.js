import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { createAstronaut, createRover, optimizeModel } from './model-designs.js';

const white=new T.MeshStandardMaterial({color:0xdde4e3,roughness:0.6});
const dark=new T.MeshStandardMaterial({color:0x202b33,metalness:0.4,roughness:0.55});
const orange=new T.MeshStandardMaterial({color:0xd97930,metalness:0.2,roughness:0.5});
const metal=new T.MeshStandardMaterial({color:0x82959c,metalness:0.8,roughness:0.3});
const blue=new T.MeshStandardMaterial({color:0x193c65,metalness:0.6,roughness:0.3});
const light=new T.MeshStandardMaterial({color:0x79e9d3,emissive:0x2ba995});
const mats={white,dark,orange,metal,blue,light};
Object.entries(mats).forEach(([name,m])=>{m.name=name;});
const root=name=>{const g=new T.Group();g.name=name;return g;};
function box(g,size,mat,pos=[0,0,0],r=.025) {
  const mesh=new T.Mesh(new RoundedBoxGeometry(...size,2,r),mats[mat]);mesh.position.set(...pos);g.add(mesh);return mesh;
}
function cyl(g,r,h,mat,pos=[0,0,0],axis='y') {
  const m=new T.Mesh(new T.CylinderGeometry(r,r,h,24),mats[mat]);m.position.set(...pos);
  if(axis==='z')m.rotation.x=Math.PI/2;if(axis==='x')m.rotation.z=Math.PI/2;g.add(m);return m;
}
function part(g,name,position) {
  const batch=optimizeModel(g,false);batch.name=name;if(position)batch.position.copy(position);return batch;
}
function dynamic(g) {g.userData={units:'meters',static:false};return g;}

export function battery() {
  const g=root('Meridian reserve battery');
  box(g,[.48,.58,.32],'dark',[0,.3,0],.04);
  box(g,[.43,.46,.025],'white',[0,.3,.172]);
  for(const x of [-.19,.19])box(g,[.035,.5,.03],'orange',[x,.3,.194]);
  box(g,[.25,.045,.025],'light',[0,.46,.19]);
  for(let i=0;i<5;i++)box(g,[.28,.016,.016],'metal',[0,.15+i*.04,.195],.005);
  box(g,[.27,.04,.06],'metal',[0,.64,0]);
  for(const x of [-.11,.11])box(g,[.035,.07,.05],'metal',[x,.595,0]);
  cyl(g,.025,.045,'orange',[-.09,.61,.085]);cyl(g,.025,.045,'light',[.09,.61,.085]);
  return optimizeModel(g);
}
export function terminal() {
  const g=root('Habitat diagnostic terminal');
  box(g,[.8,.09,.6],'metal',[0,.045,0]);box(g,[.22,.9,.22],'dark',[0,.53,0]);
  box(g,[.86,.63,.21],'white',[0,1.16,0],.05);
  box(g,[.7,.43,.015],'dark',[0,1.22,.12]);
  for(let i=0;i<5;i++)box(g,[.5-i*.05,.018,.004],'light',[-i*.025,1.36-i*.063,.133],.003);
  for(const x of [-.27,0,.27])cyl(g,.04,.028,x===0?'orange':'light',[x,.94,.13],'z');
  box(g,[.68,.05,.4],'dark',[0,.79,.19]);
  for(let i=0;i<8;i++)box(g,[.052,.012,.12],'metal',[-.27+i*.076,.824,.21],.003);
  return optimizeModel(g);
}
export function junction() {
  const g=root('Power junction');
  box(g,[1,.08,.75],'metal',[0,.04,0]);box(g,[.85,1.05,.6],'white',[0,.6,0],.06);
  box(g,[.72,.65,.03],'dark',[0,.72,.32]);
  for(let i=0;i<3;i++) {
    cyl(g,.077,.04,'orange',[-.23+i*.23,.79,.365],'z');
    box(g,[.023,.1,.025],'metal',[-.23+i*.23,.79,.397]);
    box(g,[.075,.02,.015],'light',[-.23+i*.23,.56,.35]);
  }
  box(g,[.54,.08,.025],'orange',[0,1.09,.33]);
  box(g,[.52,.45,.27],'dark',[0,.34,.33]);
  return optimizeModel(g);
}
export function tank() {
  const g=root('Water shielding tank');
  cyl(g,.36,1.25,'white',[0,.78,0]);cyl(g,.4,.16,'dark',[0,.16,0]);
  cyl(g,.34,.12,'orange',[0,1.42,0]);cyl(g,.06,.18,'metal',[0,1.53,0]);
  box(g,[.18,.07,.13],'light',[0,1.63,0]);
  for(const y of [.35,1.16])cyl(g,.368,.055,'metal',[0,y,0]);
  return optimizeModel(g);
}
export function tool() {
  const g=root('EVA cleaning brush');
  box(g,[.12,.35,.1],'orange',[0,.2,0]);box(g,[.34,.11,.2],'dark',[0,.42,0]);
  for(let i=0;i<9;i++)box(g,[.022,.075,.16],'metal',[-.14+i*.035,.49,0],.003);
  box(g,[.08,.15,.018],'dark',[0,.21,.058]);
  return optimizeModel(g);
}
export function solar() {
  const g=root('Solar collector'); const base=root('Solar base');
  box(base,[1.5,.12,1.25],'metal',[0,.06,0]);cyl(base,.09,1.4,'metal',[0,.76,0]);
  box(base,[.4,.21,.35],'orange',[0,1.43,0]);g.add(part(base,'stand'));
  const panel=root('Panel');box(panel,[2.8,.09,1.7],'metal');
  for(let x=0;x<8;x++)for(let z=0;z<4;z++)box(panel,[.31,.019,.36],'blue',[-1.16+x*.333,.056,-.58+z*.386],.004);
  box(panel,[2.65,.015,.027],'orange',[0,.055,-.83]);
  const hinge=part(panel,'panel_hinge');hinge.position.y=1.47;hinge.rotation.x=-.35;g.add(hinge);
  return dynamic(g);
}
export function airlock() {
  const g=root('Meridian airlock');const frame=root('Frame');
  for(const x of [-1.13,1.13])box(frame,[.18,2.55,.32],'metal',[x,1.28,0]);
  box(frame,[2.45,.18,.32],'metal',[0,2.57,0]);box(frame,[2.45,.12,.6],'dark',[0,.06,0]);
  for(const x of [-1.12,1.12])box(frame,[.065,2.3,.04],'orange',[x,1.3,.19]);
  box(frame,[.7,.1,.04],'light',[0,2.58,.18]);g.add(part(frame,'frame'));
  for(const [name,x]of[['door_left',-.5],['door_right',.5]]) {
    const door=root(name);box(door,[.98,2.38,.13],'white',[0,1.31,0],.04);
    box(door,[.07,2.2,.035],'orange',[0,1.31,.089]);
    box(door,[.57,.3,.015],'dark',[0,1.67,.08]);
    const leaf=part(door,name);leaf.position.x=x;g.add(leaf);
  }
  return dynamic(g);
}
export function interior() {
  const g=root('Meridian shelter interior');
  box(g,[9,.18,7],'dark',[0,.09,0]);box(g,[9,2.8,.13],'white',[0,1.5,-3.5]);
  for(const x of [-4.45,4.45])box(g,[.13,2.8,7],'white',[x,1.5,0]);
  for(let i=0;i<9;i++)box(g,[.035,.006,6.8],'metal',[-4+i,.186,0],.002);
  for(const x of [-3.8,3.8])for(const z of [-2.2,.8]) {
    box(g,[1.25,.22,2.1],'metal',[x,.6,z]);box(g,[1.12,.19,1.91],'blue',[x,.81,z],.07);
    box(g,[.83,.14,.4],'white',[x,.98,z-.66],.07);
    box(g,[.08,.55,2.18],'orange',[x+Math.sign(x)*.58,.92,z]);
  }
  for(const x of [-2,0,2]) {
    box(g,[.9,.1,.05],'light',[x,2.45,-3.4]);
    box(g,[1.4,.48,.11],'dark',[x,1.68,-3.39]);
    box(g,[1.15,.03,.025],'light',[x,1.7,-3.32]);
  }
  return optimizeModel(g);
}
export function roverDynamic() {
  const source=createRover();const g=root('Meridian animated rover');
  const wheels=source.children.filter(c=>c.name==='All-terrain wheel');
  wheels.forEach((wheel,i)=> {
    const pos=wheel.position.clone();wheel.removeFromParent();wheel.position.set(0,0,0);
    g.add(part(wheel,`wheel_${i}`,pos));
  });
  const sensor=root('Sensor');const pivot=new T.Vector3(-.82,2.86,0);
  source.children.filter(c=>c.position.y>2.75&&Math.abs(c.position.x+.82)<.3).forEach(c=>{
    c.removeFromParent();c.position.sub(pivot);sensor.add(c);
  });
  g.add(part(sensor,'sensor_head',pivot));g.add(part(source,'chassis'));
  return dynamic(g);
}
export function astronautAnimated() {
  const source=createAstronaut();const g=root('Animated Meridian crew');
  const limbs=source.children.filter(c=>c.name==='Pressure leg'||c.name==='Pressure arm');
  const rest={};
  for(const limb of limbs) {
    const name=(limb.name==='Pressure leg'?'leg_':'arm_')+(limb.position.x<0?'left':'right');
    const pos=limb.position.clone(),q=limb.quaternion.clone();limb.removeFromParent();limb.position.set(0,0,0);limb.quaternion.identity();
    const batch=part(limb,name,pos);batch.quaternion.copy(q);rest[name]=q;g.add(batch);
  }
  g.add(part(source,'suit'));
  const times=[0,.5,1,1.5,2];
  function clip(name,amount,repair=false) {
    const tracks=[];
    for(const [joint,restQ]of Object.entries(rest)) {
      const sign=joint.endsWith('left')?1:-1;
      const values=times.flatMap((t)=> {
        const swing=Math.sin(t*Math.PI)*amount*sign*(joint.startsWith('arm')?-1:1);
        const q=new T.Quaternion().setFromEuler(new T.Euler(repair&&joint.startsWith('arm')?-.9+swing:swing,0,0)).multiply(restQ);
        return q.toArray();
      });
      tracks.push(new T.QuaternionKeyframeTrack(`${joint}.quaternion`,times,values));
    }
    return new T.AnimationClip(name,2,tracks);
  }
  g.animations=[clip('Idle',.035),clip('Walk',.45),clip('Repair',.14,true)];
  return dynamic(g);
}
export const MISSION_DESIGNS=[['battery',battery],['terminal',terminal],['junction',junction],['water-tank',tank],['eva-tool',tool],['solar-array',solar],['airlock',airlock],['habitat-interior',interior],['rover-dynamic',roverDynamic],['astronaut-animated',astronautAnimated]];
