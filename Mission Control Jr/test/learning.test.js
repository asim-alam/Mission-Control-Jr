import test from 'node:test';
import assert from 'node:assert/strict';
import {learningDetail,learningMode,learningPrompt,learningChoices} from '../simulation/learning.js';

test('simple explanations stay short while details add the mission-specific data limits',()=>{
 const simple={getItem:()=> 'simple'},details={getItem:()=> 'details'};
 for(const id of ['solar-shelter','greenhouse','earth-delay','lunar-sunlight','lunar-dust','lunar-relay']){
  assert.equal(learningMode(simple),'simple');assert.equal(learningDetail(id,simple),'');assert.ok(learningPrompt(id,simple).length>35,id);assert.ok(learningDetail(id,details).length>80,id);assert.equal(learningPrompt(id,details),'');
 }
 assert.match(learningDetail('lunar-relay',details),/two clear hops/);
 assert.match(learningDetail('lunar-dust',details),/not wind/);
});

test('simple mode shows two primary choices with progressive disclosure; details show every choice',()=>{
 const simple={getItem:()=> 'simple'},details={getItem:()=> 'details'};
 const actions=Array.from({length:6},(_,i)=>({label:`Choice ${i+1}`,run(){}}));
 const visible=learningChoices(actions,false,simple);
 assert.deepEqual(visible.map(a=>a.label),['Choice 1','Choice 2','More choices']);
 assert.equal(visible[2].more,true);
 assert.equal(learningChoices(actions,true,simple).length,6);
 assert.equal(learningChoices(actions,false,details).length,6);
 assert.equal(learningChoices(actions,false,simple).length,3);
});
