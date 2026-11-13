import * as THREE from 'three';
import { isBlocked, planRoute } from './navigation.js';

export function showCameraView(button, view) {
  button.textContent = view === 'first' ? 'First person' : 'Third person';
  button.setAttribute('aria-label', `${button.textContent} view. Switch to ${view === 'first' ? 'third' : 'first'} person (V)`);
}

export class Player {
  constructor(camera,canvas,onInteract,onPause,onStep,onViewChange=()=>{}) {
    this.camera=camera;this.canvas=canvas;this.enabled=false;this.keys=new Set();this.route=[];
    this.obstacles=[];this.bounds={minX:-18,maxX:18,minZ:-18,maxZ:18};this.stepClock=0;this.drag=null;
    this.position=new THREE.Vector3();this.yaw=0;this.pitch=0;this.facing=0;this.view='first';this.inside=false;
    this.cameraObjects=[];this.cameraRay=new THREE.Raycaster();this.cameraDistance=0;this.onViewChange=onViewChange;
    camera.rotation.order='YXZ';this.reset();
    addEventListener('keydown',e=> {
      if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
      if(e.code==='Escape'){this.keys.clear();this.route=[];onPause();return;}
      if(!this.enabled)return;
      if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) {e.preventDefault();this.keys.add(e.code);this.route=[];}
      if(e.code==='KeyE'&&!e.repeat){e.preventDefault();onInteract();}
      if(e.code==='KeyV'&&!e.repeat){e.preventDefault();this.toggleView();}
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
      this.route=[];this.yaw-=dx*.0025;this.pitch=THREE.MathUtils.clamp(this.pitch-dy*.0025,-1.2,1.2);
    });
    this.onStep=onStep;
  }
  capture() {if(this.enabled)this.canvas.requestPointerLock?.()?.catch?.(()=>{});}
  release() {if(document.pointerLockElement)document.exitPointerLock();this.keys.clear();}
  reset(inside=false) {
    this.route=[];this.keys.clear();this.inside=inside;this.position.set(0,inside?1.88:1.68,inside?-42.6:9);
    this.yaw=0;this.pitch=-.04;this.facing=Math.PI;this.syncCamera();
  }
  toggleView() {
    this.view=this.view==='first'?'third':'first';this.syncCamera();this.onViewChange(this.view);
  }
  syncCamera(bob=0) {
    const camera=this.camera;camera.rotation.set(this.pitch,this.yaw,0,'YXZ');
    if(this.view==='first'){camera.position.copy(this.position);camera.position.y+=bob;this.cameraDistance=0;return;}
    const focus=this.position.clone();focus.y-=this.inside?.6:.48;
    const backward=new THREE.Vector3(0,0,1).applyEuler(camera.rotation);
    const desiredDistance=this.inside?2.6:(this.thirdPersonDistance??3.8);
    // Probe the center and near-plane corners so the camera pulls in at walls.
    const right=new THREE.Vector3(1,0,0).applyEuler(camera.rotation);
    const up=new THREE.Vector3(0,1,0).applyEuler(camera.rotation);
    const blockers=[];
    for(const object of this.cameraObjects) object.traverseVisible(node=>{if(node.isMesh)blockers.push(node);});
    let distance=desiredDistance;
    for(const [x,y]of[[0,0],[-.16,-.12],[.16,-.12],[-.16,.12],[.16,.12]]) {
      const origin=focus.clone().addScaledVector(right,x).addScaledVector(up,y);
      this.cameraRay.set(origin,backward);this.cameraRay.far=desiredDistance+.18;
      const hit=this.cameraRay.intersectObjects(blockers,false)[0];
      if(hit)distance=Math.min(distance,Math.max(0,hit.distance-.18));
    }
    this.cameraDistance=distance;camera.position.copy(focus).addScaledVector(backward,distance);
    camera.updateMatrixWorld();
  }
  navigate(point,lookAt) {
    this.route=planRoute(this.position,point,this.obstacles,this.bounds);this.lookTarget=lookAt;
    return this.route.length>0;
  }
  update(dt,syncCamera=true) {
    if(!this.enabled)return false;
    const p=this.position;let dx=0,dz=0;

    // ArrowLeft and ArrowRight smoothly turn the viewing angle left and right (yaw)
    const turn=Number(this.keys.has('ArrowLeft'))-Number(this.keys.has('ArrowRight'));
    if(turn!==0){
      const turnSpeed=this.turnSpeed??2.4;
      this.yaw+=turn*turnSpeed*dt;
      if(this.lookTarget)this.lookTarget=null;
    }

    if(this.route.length) {
      const next=this.route[0],distance=Math.hypot(next.x-p.x,next.z-p.z);
      if(distance<.12){this.route.shift();if(!this.route.length&&this.lookTarget)this.facing=Math.atan2(this.lookTarget.x-p.x,this.lookTarget.z-p.z);}
      else {const amount=Math.min(distance,dt*3.8*(this.speedScale??1));dx=(next.x-p.x)/distance*amount;dz=(next.z-p.z)/distance*amount;}
      if(this.lookTarget) {
        const target=Math.atan2(p.x-this.lookTarget.x,p.z-this.lookTarget.z);
        let diff=target-this.yaw;diff=Math.atan2(Math.sin(diff),Math.cos(diff));
        this.yaw+=diff*Math.min(1,dt*5);this.pitch*=Math.max(0,1-dt*5);
      }
    } else {
      const forward=Number(this.keys.has('KeyW')||this.keys.has('ArrowUp'))-Number(this.keys.has('KeyS')||this.keys.has('ArrowDown'));
      const side=Number(this.keys.has('KeyD'))-Number(this.keys.has('KeyA'));
      const length=Math.hypot(forward,side)||1,yaw=this.yaw;
      if(forward!==0||side!==0){
        dx=(side*Math.cos(yaw)-forward*Math.sin(yaw))/length*dt*3.8*(this.speedScale??1);
        dz=(-side*Math.sin(yaw)-forward*Math.cos(yaw))/length*dt*3.8*(this.speedScale??1);
      }
    }
    const oldX=p.x,oldZ=p.z;
    const x=THREE.MathUtils.clamp(p.x+dx,this.bounds.minX,this.bounds.maxX);
    const allowed=(px,pz)=>!isBlocked(px,pz,this.obstacles)&&(!this.canMoveTo||this.canMoveTo(px,pz));
    if(allowed(x,p.z))p.x=x;
    const z=THREE.MathUtils.clamp(p.z+dz,this.bounds.minZ,this.bounds.maxZ);
    if(allowed(p.x,z))p.z=z;
    // Optional terrain following (outdoor Moon missions): keep the eyes above the ground.
    if(this.groundAt){const target=this.groundAt(p.x,p.z)+(this.eyeHeight??1.62);p.y+=(target-p.y)*Math.min(1,dt*10);}
    const moved=Math.hypot(p.x-oldX,p.z-oldZ)>.001;
    if(moved)this.facing=Math.atan2(p.x-oldX,p.z-oldZ);
    else if(turn!==0)this.facing=this.yaw+Math.PI;
    if(moved){this.stepClock+=dt;if(this.stepClock>.43){this.onStep();this.stepClock=0;}}
    if(syncCamera)this.syncCamera();
    return moved;
  }
}
