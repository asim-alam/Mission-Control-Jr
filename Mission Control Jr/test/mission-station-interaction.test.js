import test from 'node:test';
import assert from 'node:assert/strict';
import {stationActionHandler} from '../simulation/interactions.js';

test('a DOM click dispatches the stable nearby station ID, not the click event',()=>{
 let received;
 const click=stationActionHandler({id:'horizon-console'},id=>{received=id;});
 click({type:'click',target:{}});
 assert.equal(received,'horizon-console');
});
