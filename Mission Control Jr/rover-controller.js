import {HOME,BOUNDS,ROCKS,OUTPOST_SOLIDS,distance,heightAt,surfaceAt,slopeAt} from './expedition-terrain.js';
export function createRoverState(){return {x:HOME.x,z:HOME.z,y:0,heading:Math.PI/2,speed:0,wheelSpeed:0,slip:0,sink:0,parking:true,reverseReady:true,contact:false,distance:0,steeringTravel:0};}
export function blocked(x,z){return x<BOUNDS.minX||x>BOUNDS.maxX||z<BOUNDS.minZ||z>BOUNDS.maxZ||distance({x,z},{x:0,z:0})<8||OUTPOST_SOLIDS.some(o=>x>o.minX-2.5&&x<o.maxX+2.5&&z>o.minZ-2.5&&z<o.maxZ+2.5)||ROCKS.some(r=>distance({x,z},r)<r.r+2.5);}
const approach=(v,t,a)=>v<t?Math.min(t,v+a):Math.max(t,v-a);
export function stepRover(v,input,dt){
  dt=Math.max(0,Math.min(dt,1/30));const surface=surfaceAt(v.x,v.z),steer=Math.max(-1,Math.min(1,input.steer||0)),throttle=Math.max(-1,Math.min(1,input.throttle||0));
  if(throttle!==-1)v.reverseReady=true;
  const brake=input.brake||v.parking||(throttle<0&&(v.speed>.08||!v.reverseReady));
  if(throttle<0&&v.speed>.08)v.reverseReady=false;
  const target=brake?0:throttle<0?-1:throttle>0?(input.eco?2.1:3.3):0;
  v.speed=approach(v.speed,target,dt*(brake?2.1:throttle?.8:.45));
  const slip=surface==='loose'?(throttle>0?.73:.34):surface==='rough'?.13:.025;
  v.slip=slip;v.wheelSpeed=v.speed;v.steeringAngle=steer*.45;const groundSpeed=v.speed*(1-slip);
  v.heading+=steer*groundSpeed/3*Math.tan(.52)*dt;
  v.steeringTravel+=Math.abs(steer*groundSpeed)*dt;
  const x=v.x+Math.cos(v.heading)*groundSpeed*dt,z=v.z-Math.sin(v.heading)*groundSpeed*dt;
  let collision=false,metres=0;
  if(blocked(x,z)){collision=!v.contact;v.contact=true;v.speed=0;}else{metres=Math.hypot(x-v.x,z-v.z);v.x=x;v.z=z;if(metres>.00001)v.contact=false;}
  v.distance+=metres;
  v.sink=Math.max(0,Math.min(1,v.sink+(surface==='loose'&&throttle>0&&!brake?.06:-.12)*dt));
  v.y=heightAt(v.x,v.z)-v.sink*.14;
  return {metres,collision,surface,slope:slopeAt(v.x,v.z),poweredSlip:surface==='loose'&&throttle>0&&!brake,speed:Math.abs(groundSpeed)*3.6};
}
