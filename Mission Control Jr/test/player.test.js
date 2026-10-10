import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Player} from '../player.js';
import {isBlocked} from '../navigation.js';

test('guided player movement completes repair routes without crossing collisions',()=>{
  const original=globalThis.addEventListener;globalThis.addEventListener=()=>{};
  try{
    const camera=new THREE.PerspectiveCamera();
    const player=new Player(camera,{addEventListener(){}},()=>{},()=>{},()=>{});
    player.enabled=true;
    const box=(x,z,w,d)=>({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});
    player.obstacles=[box(0,0,9.6,5.5),box(9,-5,4.7,3.9),box(5,5,1.1,1),box(-1.5,4.7,.9,.8),box(5.6,-.7,.6,2.5),...[-11,-8,-5].map(x=>box(x,4.8,2.8,1.6))];
    for(const point of [{x:-1.5,z:6.7},{x:-11,z:7.1},{x:-8,z:7.1},{x:-5,z:7.1},{x:9,z:-.65},{x:5,z:7.1},{x:-1.5,z:6.7},{x:7.5,z:-.7}]){
      assert.equal(player.navigate(point,point),true);
      for(let frame=0;frame<1800&&player.route.length;frame++){
        player.update(1/60);assert.equal(isBlocked(camera.position.x,camera.position.z,player.obstacles),false);
      }
      assert.equal(player.route.length,0,JSON.stringify(point));
      assert.ok(Math.hypot(point.x-camera.position.x,point.z-camera.position.z)<.13);
    }
  }finally{globalThis.addEventListener=original;}
});
