import test from 'node:test';
import assert from 'node:assert/strict';
import {createMission, act, advance, objective, PREPARATION_SECONDS} from '../mission.js';

function begin(){const m=createMission();act(m,'start');act(m,'diagnose');return m;}
function prepare(choice='life'){
  const m=begin();for(let i=0;i<3;i++)assert.ok(act(m,'clean',i).ok);
  for(const action of ['openBay','battery','install'])assert.ok(act(m,action).ok);
  for(let i=0;i<3;i++)for(let turns=0;turns<=i;turns++)act(m,'rotate',i);
  assert.ok(act(m,'connect').ok);assert.ok(act(m,'allocate',choice).ok);return m;
}
function shelter(m){assert.ok(act(m,'enter').ok);assert.ok(act(m,'seal').ok);for(let i=0;i<5;i++)advance(m,1);assert.ok(act(m,'report').ok);}

test('complete repairs and oxygen allocation produce the prepared ending',()=>{
  const m=prepare();assert.equal(m.resources.oxygen,95);assert.equal(m.battery,false);
  assert.equal(m.installed,true);assert.equal(m.resources.power,98);shelter(m);
  assert.equal(m.outcome,'prepared');assert.equal(objective(m),'Mission complete');
  assert.equal(act(m,'talk','elena').ok,false);
});
test('science allocation is a distinct crew survival outcome',()=>{
  const m=prepare('research');assert.equal(m.resources.oxygen,55);shelter(m);assert.equal(m.outcome,'survived');
});
test('early shelter and late failure are reachable without soft locks',()=>{
  const early=begin();shelter(early);assert.equal(early.outcome,'survived');
  const late=begin();for(let i=0;i<PREPARATION_SECONDS+101;i++)advance(late,1);
  assert.equal(late.outcome,'evacuated');assert.equal(late.ended,true);
});
test('menus and pre-diagnosis briefing freeze the preparation clock',()=>{
  const m=createMission();act(m,'start');advance(m,1);assert.equal(m.elapsed,0);
  act(m,'diagnose');advance(m,1,true);assert.equal(m.elapsed,0);
  advance(m,100);assert.equal(m.elapsed,1);advance(m,-5);assert.equal(m.elapsed,1);
});
test('inventory, cleaning and crew rewards cannot be repeated',()=>{
  const m=begin();act(m,'clean',0);const power=m.resources.power;
  assert.equal(act(m,'clean',0).ok,false);assert.equal(m.resources.power,power);
  assert.equal(act(m,'battery').ok,false);assert.equal(act(m,'install').ok,false);
  act(m,'openBay');act(m,'battery');act(m,'install');assert.equal(act(m,'battery').ok,false);
  act(m,'talk','amara');const morale=m.resources.morale;act(m,'talk','amara');assert.equal(m.resources.morale,morale);
});
test('relay, reserve choice and shelter report enforce their prerequisites',()=>{
  const m=begin();assert.equal(act(m,'connect').ok,false);assert.equal(act(m,'allocate','life').ok,false);
  act(m,'openBay');act(m,'battery');act(m,'install');assert.equal(act(m,'connect').ok,false);
  assert.equal(act(m,'rotate',4).ok,false);assert.equal(act(m,'clean',-1).ok,false);
  assert.equal(act(m,'seal').ok,false);act(m,'enter');act(m,'seal');assert.equal(act(m,'report').ok,false);
  for(let i=0;i<16;i++)advance(m,1);assert.equal(m.outcome,'survived');
});
test('restart uses independent inventory, logs, timer and resource objects',()=>{
  const old=prepare();shelter(old);const fresh=createMission();
  assert.deepEqual(fresh.cleaned,[false,false,false]);assert.deepEqual(fresh.log,[]);
  assert.equal(fresh.elapsed,0);assert.equal(fresh.installed,false);assert.equal(fresh.outcome,null);
  assert.equal(fresh.resources.oxygen,77);assert.notEqual(fresh.resources,old.resources);
});
test('crew conversation choices affect resources once per crew member',()=>{
  const m=begin();assert.equal(act(m,'respond',{crew:'elena',choice:'encourage'}).ok,false);
  act(m,'talk','elena');const morale=m.resources.morale;
  act(m,'respond',{crew:'elena',choice:'encourage'});assert.equal(m.resources.morale,morale+2);
  assert.equal(act(m,'respond',{crew:'elena',choice:'encourage'}).ok,false);
  act(m,'talk','luca');const power=m.resources.power;act(m,'respond',{crew:'luca',choice:'procedure'});
  assert.equal(m.resources.power,power+1);
});
