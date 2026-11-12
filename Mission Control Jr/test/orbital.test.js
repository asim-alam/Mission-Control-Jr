import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createOrbit,orbitalTask,actOrbit,advanceOrbit,dockReady,stepDock,guidedDock,saveOrbit,restoreOrbit,ORBIT_SAVE} from '../orbital-mission.js';
import {createStation} from '../station-model.js';
import {Player} from '../player.js';
import {isBlocked} from '../navigation.js';

function docked(){const m=createOrbit();actOrbit(m,'approach');Object.assign(m.dock,{distance:1.8,x:0,y:0,speed:0});assert.ok(actOrbit(m,'dock').ok);return m;}
function actAt(m,id,choice){const task=orbitalTask(m);m.position={...task.target};assert.equal(task.action,id);const result=actOrbit(m,id,choice);assert.ok(result.ok,result.message);}
function prepared(){const m=docked();for(const id of ['brief','diagnose','isolate','repair','verify','kit','airlock'])actAt(m,id,id==='diagnose'?'pointing':id==='isolate'?'antenna':undefined);return m;}
test('docking requires alignment, low speed, range and correct mission phase',()=>{const m=createOrbit();assert.equal(actOrbit(m,'dock').ok,false);actOrbit(m,'approach');for(const bad of [{distance:3,x:0,y:0,speed:0},{distance:1.8,x:.5,y:0,speed:0},{distance:1.8,x:0,y:.5,speed:0},{distance:1.8,x:0,y:0,speed:.3},{distance:1.8,x:0,y:0,speed:.25}]){Object.assign(m.dock,bad);assert.equal(actOrbit(m,'dock').ok,false);}Object.assign(m.dock,{distance:1.8,x:.1,y:.1,speed:.2});assert.ok(actOrbit(m,'dock').ok);});
test('manual thrust, lateral and vertical controls move and brake the spacecraft',()=>{const m=createOrbit(),d=m.dock;for(let i=0;i<120;i++)stepDock(d,{thrust:1,side:-1,lift:-1},1/60);assert.ok(d.distance<34);assert.ok(d.x<.2);assert.ok(d.y<0);assert.ok(d.speed>1);for(let i=0;i<120;i++)stepDock(d,{brake:true},1/60);assert.equal(d.speed,0);});
test('fast or misaligned contact rejects approach without awarding docking',()=>{const d={distance:1.41,x:1,y:0,speed:1,bumps:0};assert.match(stepDock(d,{},.05),/not lined up/);assert.equal(d.bumps,1);assert.equal(d.distance,5);assert.equal(dockReady(d),false);});
test('assisted approach flies the real controller into a stable capture envelope',()=>{const d=createOrbit().dock;for(let i=0;i<60*90&&!dockReady(d);i++)stepDock(d,guidedDock(d),1/60);assert.ok(dockReady(d),JSON.stringify(d));assert.equal(d.bumps,0);});
test('station procedures reject distance, skipped actions and unsafe power choices',()=>{const m=docked();m.position={x:0,z:14};assert.equal(actOrbit(m,'brief').ok,false);assert.equal(actOrbit(m,'board').ok,false);actAt(m,'brief');m.position={...orbitalTask(m).target};assert.equal(actOrbit(m,'diagnose','habitat').ok,false);assert.equal(m.checks.diagnose,false);actAt(m,'diagnose','pointing');m.position={...orbitalTask(m).target};assert.equal(actOrbit(m,'isolate','habitat').ok,false);assert.equal(m.checks.isolate,false);actAt(m,'isolate','antenna');assert.equal(actOrbit(m,'verify').ok,false);});
test('complete arrival requires all station checks and lander checks before descent',()=>{const m=prepared();actAt(m,'board');assert.equal(m.phase,'craft');assert.equal(actOrbit(m,'descent').ok,false);assert.ok(actOrbit(m,'guidance').ok);assert.equal(actOrbit(m,'descent').ok,false);assert.ok(actOrbit(m,'propulsion').ok);assert.ok(actOrbit(m,'descent').ok);advanceOrbit(m,15);assert.equal(m.complete,false);advanceOrbit(m,1);assert.equal(m.complete,true);assert.equal(m.phase,'complete');assert.equal(actOrbit(m,'descent').ok,false);});
test('save and restore preserve verified progress and reject corrupt or out-of-order data',()=>{const data=new Map(),storage={setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k)};const m=prepared();assert.ok(saveOrbit(m,storage));const resumed=restoreOrbit(storage);assert.deepEqual(resumed.checks,m.checks);assert.equal(resumed.phase,'station');actAt(m,'board');saveOrbit(m,storage);assert.equal(restoreOrbit(storage).phase,'craft');data.set(ORBIT_SAVE,JSON.stringify({version:1,phase:'station',checks:{...m.checks,brief:false}}));assert.equal(restoreOrbit(storage),null);assert.equal(saveOrbit(m,{setItem(){throw Error('full');}}),false);assert.equal(restoreOrbit({getItem(){throw Error('blocked');}}),null);});
test('every station procedure is reachable using the real player and collision layout',()=>{const previous=globalThis.addEventListener;globalThis.addEventListener=()=>{};try{const station=createStation(),m=docked(),camera=new T.PerspectiveCamera(),player=new Player(camera,{addEventListener(){}},()=>{},()=>{},()=>{});player.enabled=true;player.position.set(0,1.68,14);player.bounds={minX:-10.6,maxX:10.6,minZ:-17.5,maxZ:17.5};player.obstacles=station.colliders;for(const id of ['brief','diagnose','isolate','repair','verify','kit','airlock','board']){const task=orbitalTask(m);assert.ok(player.navigate(task.target,task.target),id);for(let frame=0;frame<3600&&player.route.length;frame++){player.update(1/60,false);assert.equal(isBlocked(player.position.x,player.position.z,station.colliders),false);}assert.equal(player.route.length,0,id);m.position={x:player.position.x,z:player.position.z};assert.ok(actOrbit(m,id,id==='diagnose'?'pointing':id==='isolate'?'antenna':undefined).ok,id);}}finally{globalThis.addEventListener=previous;}});
test('independent restarts do not share checklist or navigation state',()=>{const a=prepared(),b=createOrbit();assert.equal(b.checks.brief,false);assert.equal(b.phase,'overview');a.dock.x=30;assert.equal(b.dock.x,1.6);});
test('docking can start from random positions within safe corridor and auto-dock lands safely',()=>{
  const m1 = createOrbit({randomizeDock: true});
  assert.ok(Math.abs(m1.dock.x) >= 1.0 && Math.abs(m1.dock.x) <= 4.0, `x=${m1.dock.x}`);
  assert.ok(Math.abs(m1.dock.y) >= 0.5 && Math.abs(m1.dock.y) <= 2.5, `y=${m1.dock.y}`);
  assert.ok(m1.dock.distance >= 28 && m1.dock.distance <= 50, `distance=${m1.dock.distance}`);
  assert.equal(m1.dock.speed, 0);
  assert.equal(m1.dock.bumps, 0);
  const d = m1.dock;
  for (let i = 0; i < 60 * 90 && !dockReady(d); i++) stepDock(d, guidedDock(d), 1/60);
  assert.ok(dockReady(d));
  assert.equal(d.bumps, 0);
});
