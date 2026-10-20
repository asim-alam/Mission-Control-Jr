import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createJourney,finishChapter,nextStoryChapter,storyComplete,readJourney,saveJourney,JOURNEY_KEY} from '../journey-state.js';

test('connected expedition advances through arrival, storm and rover and retains chapter results',()=>{
  const state=createJourney();assert.equal(nextStoryChapter(state),'orbit');
  assert.equal(finishChapter(state,'storm',{success:false}),false);assert.deepEqual(state.completed,[]);
  finishChapter(state,'orbit',{assisted:true,outcome:'Arrival qualified'});assert.equal(nextStoryChapter(state),'storm');
  finishChapter(state,'storm',{outcome:'Meridian protected'});assert.equal(nextStoryChapter(state),'rover');
  finishChapter(state,'rover',{score:91,outcome:'success'});assert.equal(storyComplete(state),true);assert.equal(nextStoryChapter(state),'extended');assert.equal(state.records.rover.score,91);
  finishChapter(state,'rover',{score:94});assert.equal(state.completed.length,3);assert.equal(state.records.rover.score,94);
});
test('chapter practice never marks earlier chapters complete and progress survives storage round trip',()=>{
  const state=createJourney();state.current='rover';finishChapter(state,'rover',{score:85});assert.equal(nextStoryChapter(state),'orbit');
  const items=new Map(),storage={setItem:(key,value)=>items.set(key,value),getItem:key=>items.get(key)};assert.equal(saveJourney(state,storage),true);assert.deepEqual(readJourney(storage),state);
  items.set(JOURNEY_KEY,JSON.stringify({version:1,current:'bad',completed:['bad','rover','rover'],records:{rover:{score:999,outcome:'success'}}}));const restored=readJourney(storage);assert.equal(restored.current,'orbit');assert.deepEqual(restored.completed,['rover']);assert.equal(restored.records.rover.score,100);
  items.set(JOURNEY_KEY,'broken');assert.deepEqual(readJourney(storage),createJourney());assert.equal(saveJourney(state,undefined),false);assert.deepEqual(readJourney(undefined),createJourney());
});
test('every orbital briefing subtitle has a bundled Vorbis voice clip',()=>{
  const lines=JSON.parse(readFileSync(new URL('../dialogue-lines-orbit.json',import.meta.url)));assert.equal(Object.keys(lines).length,7);
  for(const [id,line]of Object.entries(lines)){assert.ok(line.text.length>30);assert.equal(line.speaker,'Elena Reyes · Commander');const audio=readFileSync(new URL(`../assets/audio-orbit/${id}.ogg`,import.meta.url));assert.equal(audio.subarray(0,4).toString(),'OggS');assert.ok(audio.length>20000,id);}
});
