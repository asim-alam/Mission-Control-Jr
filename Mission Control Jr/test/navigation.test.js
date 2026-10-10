import test from 'node:test';
import assert from 'node:assert/strict';
import {planRoute,isBlocked} from '../navigation.js';
const box=(x,z,w,d)=>({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2});
const obstacles=[box(0,0,9.6,5.5),box(9,-5,4.7,3.9),box(5,5,1.1,1),box(-1.5,4.7,.9,.8),box(5.6,-.7,.6,2.5),...[-11,-8,-5].map(x=>box(x,4.8,2.8,1.6)),...[-3.3,-6.8,3].map(x=>box(x,9,.5,.5))];
test('every outdoor repair and shelter station is reachable around scenery',()=>{
  let start={x:0,z:9};
  for(const end of [{x:-1.5,z:6.7},...[-11,-8,-5].map(x=>({x,z:7.1})),{x:9,z:-.65},{x:5,z:7.1},{x:-1.5,z:6.7},{x:7.5,z:-.7}]){
    const route=planRoute(start,end,obstacles);assert.ok(route.length,JSON.stringify({start,end}));
    for(const point of route)assert.equal(isBlocked(point.x,point.z,obstacles),false);
    for(let i=1;i<route.length;i++){
      const previous=route[i-1],next=route[i];
      for(let k=1;k<10;k++)assert.equal(isBlocked(previous.x+(next.x-previous.x)*k/10,previous.z+(next.z-previous.z)*k/10,obstacles),false,'no corner clipping');
    }
    start=end;
  }
});
test('blocked targets and disconnected rooms do not create unsafe routes',()=>{
  assert.deepEqual(planRoute({x:0,z:9},{x:0,z:0},obstacles),[]);
  assert.deepEqual(planRoute({x:0,z:3},{x:0,z:-3},[box(0,0,10,1)],{minX:-4,maxX:4,minZ:-4,maxZ:4}),[]);
});
test('shelter console and water shielding are reachable around crew',()=>{
  const inside=[box(0,-47,1,.8),box(2.6,-47,2.4,.75),...[[ -1.8,-46],[1.7,-45.8],[1.4,-43.1]].map(([x,z])=>box(x,z,.5,.5))];
  const bounds={minX:-3.1,maxX:3.1,minZ:-48,maxZ:-42};
  assert.ok(planRoute({x:0,z:-42.6},{x:0,z:-44.8},inside,bounds).length);
  assert.ok(planRoute({x:0,z:-44.8},{x:2.2,z:-45.1},inside,bounds).length);
});
