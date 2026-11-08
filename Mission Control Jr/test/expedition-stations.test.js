import test from 'node:test';
import assert from 'node:assert/strict';
import {planRoute,isBlocked} from '../navigation.js';
import {SERVICE} from '../mission2.js';
import {BOUNDS,OUTPOST_SOLIDS} from '../expedition-terrain.js';

test('all physical service stations have walking clearance around the parked rover and outpost',()=>{
  const obstacles=[{minX:-5,maxX:5,minZ:-3.5,maxZ:3.5},...OUTPOST_SOLIDS,{minX:8.6,maxX:11.4,minZ:8,maxZ:12}];
  let start={x:6,z:12};for(const target of Object.values(SERVICE)){const path=planRoute(start,target,obstacles,BOUNDS);assert.ok(path.length,JSON.stringify(target));for(const p of path)assert.equal(isBlocked(p.x,p.z,obstacles),false);start=target;}
});
