import * as THREE from 'three';
import { isBlocked, planRoute } from './navigation.js';

export class Player {
  constructor(camera,canvas,onInteract,onPause,onStep) {
    this.camera=camera;this.canvas=canvas;this.enabled=false;this.keys=new Set();this.route=[];
    this.obstacles=[];this.bounds={minX:-18,maxX:18,minZ:-18,maxZ:18};this.stepClock=0;this.drag=null;
    camera.rotation.order='YXZ';camera.position.set(0,1.68,9);camera.lookAt(0,1.4,0);
    addEventListener('keydown',e=> {
      if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
      if(e.code==='Escape'){this.keys.clear();this.route=[];onPause();return;}
      if(!this.enabled)return;
      if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {e.preventDefault();this.keys.add(e.code);this.route=[];}
      if(e.code==='KeyE'&&!e.repeat){e.preventDefault();onInteract();}
    });
    addEventListener('keyup',e=>this.keys.delete(e.code));addEventListener('blur',()=>{this.keys.clear();this.route=[];});
    canvas.addEventListener('pointerdown',e=>{if(this.enabled&&e.button===0)this.drag={x:e.clientX,y:e.clientY,distance:0};});
    addEventListener('pointerup',()=>{this.lastDrag=this.drag?.distance||0;this.drag=null;});
    addEventListener('mousemove',e=> {
      if(!this.enabled)return;
      let dx=0,dy=0;
      if(document.pointerLockElement===canvas){dx=e.movementX;dy=e.movementY;}
      else if(this.drag){dx=e.clientX-this.drag.x;dy=e.clientY-this.drag.y;this.drag.distance+=Math.abs(dx)+Math.abs(dy);this.drag.x=e.clientX;this.drag.y=e.clientY;}
      else return;
      this.route=[];camera.rotation.y-=dx*.0025;camera.rotation.x=THREE.MathUtils.clamp(camera.rotation.x-dy*.0025,-1.2,1.2);
    });
    this.onStep=onStep;
  }
  capture() {if(this.enabled)this.canvas.requestPointerLock?.()?.catch?.(()=>{});}
  release() {if(document.pointerLockElement)document.exitPointerLock();this.keys.clear();}
  reset(inside=false) {
    this.route=[];this.keys.clear();this.camera.position.set(0,1.68,inside?-42.6:9);
    this.camera.lookAt(0,1.3,inside?-47:0);
  }
  navigate(point,lookAt) {
    this.route=planRoute(this.camera.position,point,this.obstacles,this.bounds);this.lookTarget=lookAt;
    return this.route.length>0;
  }
  update(dt) {
    if(!this.enabled)return false;
    const p=this.camera.position;let dx=0,dz=0;
    if(this.route.length) {
      const next=this.route[0],distance=Math.hypot(next.x-p.x,next.z-p.z);
      if(distance<.12)this.route.shift();
      else {const amount=Math.min(distance,dt*3.8);dx=(next.x-p.x)/distance*amount;dz=(next.z-p.z)/distance*amount;}
      if(this.lookTarget) {
        const target=Math.atan2(p.x-this.lookTarget.x,p.z-this.lookTarget.z);
        let diff=target-this.camera.rotation.y;diff=Math.atan2(Math.sin(diff),Math.cos(diff));
        this.camera.rotation.y+=diff*Math.min(1,dt*5);this.camera.rotation.x*=Math.max(0,1-dt*5);
      }
    } else {
      const forward=Number(this.keys.has('KeyW')||this.keys.has('ArrowUp'))-Number(this.keys.has('KeyS')||this.keys.has('ArrowDown'));
      const side=Number(this.keys.has('KeyD')||this.keys.has('ArrowRight'))-Number(this.keys.has('KeyA')||this.keys.has('ArrowLeft'));
      const length=Math.hypot(forward,side)||1,yaw=this.camera.rotation.y;
      dx=(side*Math.cos(yaw)-forward*Math.sin(yaw))/length*dt*3.8;
      dz=(-side*Math.sin(yaw)-forward*Math.cos(yaw))/length*dt*3.8;
    }
    const oldX=p.x,oldZ=p.z;
    const x=THREE.MathUtils.clamp(p.x+dx,this.bounds.minX,this.bounds.maxX);
    if(!isBlocked(x,p.z,this.obstacles))p.x=x;
    const z=THREE.MathUtils.clamp(p.z+dz,this.bounds.minZ,this.bounds.maxZ);
    if(!isBlocked(p.x,z,this.obstacles))p.z=z;
    const moved=Math.hypot(p.x-oldX,p.z-oldZ)>.001;
    if(moved){this.stepClock+=dt;if(this.stepClock>.43){this.onStep();this.stepClock=0;}}
    return moved;
  }
}
