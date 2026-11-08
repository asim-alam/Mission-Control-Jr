import test from 'node:test';
import assert from 'node:assert/strict';
import {clearActiveAttempt,loadActiveAttempt,saveActiveAttempt} from '../simulation/mission-storage.js';
import {createMission as createRelay} from '../missions/lunar-relay/state.js';
import {applyAction,serializeSnapshot,restoreSnapshot} from '../missions/lunar-relay/actions.js';

function memoryStorage(){const data=new Map();return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value),removeItem:key=>data.delete(key)};}
test('active mission snapshots restore across reload and clear on completion',()=>{
 const storage=memoryStorage(),state=createRelay();assert.equal(applyAction(state,{id:'begin'}).ok,true);const snapshot=serializeSnapshot(state);
 assert.equal(saveActiveAttempt('lunar-relay',snapshot,storage),true);
 assert.deepEqual(restoreSnapshot(loadActiveAttempt('lunar-relay',storage)),state);
 assert.equal(loadActiveAttempt('greenhouse',storage),null);assert.equal(clearActiveAttempt('lunar-relay',storage),true);assert.equal(loadActiveAttempt('lunar-relay',storage),null);
});
test('corrupt, mismatched, oversized or unavailable storage is nonfatal',()=>{
 const storage=memoryStorage();storage.setItem('mission-control-jr.active-attempt.v1.lunar-relay','{');
 assert.equal(loadActiveAttempt('lunar-relay',storage),null);assert.equal(saveActiveAttempt('lunar-relay','{}',storage),false);
 assert.equal(saveActiveAttempt('lunar-relay','x'.repeat(500001),storage),false);
 const unavailable={getItem(){throw Error('denied');},setItem(){throw Error('denied');},removeItem(){throw Error('denied');}};
 assert.equal(loadActiveAttempt('lunar-relay',unavailable),null);assert.equal(saveActiveAttempt('lunar-relay','{}',unavailable),false);assert.equal(clearActiveAttempt('lunar-relay',unavailable),false);
});
