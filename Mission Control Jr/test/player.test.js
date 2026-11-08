import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {Player} from '../player.js';
import {isBlocked} from '../navigation.js';
test('adjustable walking camera zoom preserves position and still avoids walls',()=>{const original=globalThis.addEventListener;globalThis.addEventListener=()=>{};try{const camera=new THREE.PerspectiveCamera(),player=new Player(camera,{addEventListener(){}},()=>{},()=>{},()=>{});player.toggleView();const origin=player.position.clone();player.thirdPersonDistance=8;player.syncCamera();assert.equal(player.cameraDistance,8);const wall=new THREE.Mesh(new THREE.BoxGeometry(8,5,.2),new THREE.MeshBasicMaterial());wall.position.set(0,2,12);wall.updateMatrixWorld();player.pitch=0;player.cameraObjects=[wall];player.syncCamera();assert.ok(player.cameraDistance<3);player.cameraObjects=[];player.thirdPersonDistance=2.2;player.syncCamera();assert.equal(player.cameraDistance,2.2);assert.deepEqual(player.position,origin);wall.geometry.dispose();wall.material.dispose();}finally{globalThis.addEventListener=original;}});

for(const view of ['first','third'])test(`guided player movement in ${view} person completes repair routes without crossing collisions`,()=>{
  const original=globalThis.addEventListener;globalThis.addEventListener=()=>{};
  try{
    const camera=new THREE.PerspectiveCamera();
    const player=new Player(camera,{addEventListener(){}},()=>{},()=>{},()=>{});
    if(view==='third')player.toggleView();
    player.enabled=true;
    const box=(x,z,w,d)=>({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});
    player.obstacles=[box(0,0,9.6,5.5),box(9,-5,4.7,3.9),box(5,5,1.1,1),box(-1.5,4.7,.9,.8),box(5.6,-.7,.6,2.5),...[-11,-8,-5].map(x=>box(x,4.8,2.8,1.6))];
    for(const point of [{x:-1.5,z:6.7},{x:-11,z:7.1},{x:-8,z:7.1},{x:-5,z:7.1},{x:9,z:-.65},{x:5,z:7.1},{x:-1.5,z:6.7},{x:7.5,z:-.7}]){
      assert.equal(player.navigate(point,point),true);
      for(let frame=0;frame<1800&&player.route.length;frame++){
        player.update(1/60);assert.equal(isBlocked(player.position.x,player.position.z,player.obstacles),false);
      }
      assert.equal(player.route.length,0,JSON.stringify(point));
      assert.ok(Math.hypot(point.x-player.position.x,point.z-player.position.z)<.13);
    }
  }finally{globalThis.addEventListener=original;}
});

test('switching view preserves the astronaut, route, and camera-relative movement',()=>{
  const original=globalThis.addEventListener;globalThis.addEventListener=()=>{};
  try {
    const camera=new THREE.PerspectiveCamera(),views=[];
    const player=new Player(camera,{addEventListener(){}},()=>{},()=>{},()=>{},view=>views.push(view));
    player.enabled=true;player.yaw=Math.PI/2;player.keys.add('KeyW');player.update(.1);
    const before=player.position.clone();
    assert.ok(before.x<0);assert.ok(Math.abs(before.z-9)<.001);
    player.navigate({x:-3,z:9},{x:-3,z:8});const route=player.route;
    player.toggleView();
    assert.deepEqual(player.position,before);assert.equal(player.route,route);
    assert.equal(player.cameraDistance,3.8);assert.ok(camera.position.distanceTo(before)>3);
    player.toggleView();assert.deepEqual(camera.position,before);assert.deepEqual(views,['third','first']);
    player.toggleView();player.reset(true);
    assert.equal(player.view,'third');assert.equal(player.position.z,-42.6);assert.equal(player.position.y,1.88);
    assert.equal(player.cameraDistance,2.6);assert.equal(player.route.length,0);
  } finally {globalThis.addEventListener=original;}
});

test('third-person camera pulls forward before a wall and restores its distance in open space',()=>{
  const original=globalThis.addEventListener;globalThis.addEventListener=()=>{};
  try {
    const camera=new THREE.PerspectiveCamera();
    const player=new Player(camera,{addEventListener(){}},()=>{},()=>{},()=>{});
    player.pitch=0;player.toggleView();
    const wall=new THREE.Mesh(new THREE.BoxGeometry(8,5,.2),new THREE.MeshBasicMaterial());
    wall.position.set(0,2,11);wall.updateMatrixWorld();player.cameraObjects=[wall];player.syncCamera();
    assert.ok(camera.position.z<10.9);assert.ok(player.cameraDistance<2);
    assert.equal(player.position.z,9);
    player.yaw=Math.PI;player.syncCamera();assert.equal(player.cameraDistance,3.8);
    assert.ok(camera.position.z<6);
    wall.geometry.dispose();wall.material.dispose();
  } finally {globalThis.addEventListener=original;}
});
