import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {pipTip} from '../companion.js';
import {JEZERO} from '../data/jezero-terrain.js';
import {heightAt} from '../expedition-terrain.js';
import {OPPORTUNITY_2018,sunlightFraction} from '../data/opportunity-2018.js';
import {freshClip} from '../voice-clips.js';
import {createMission as create,advance} from '../mission.js';

// Every objective each chapter can show. Pip must have a "why" for all of them.
const OBJECTIVES={
 storm:['Check the computer inside the base','Clean the solar panels · 1 of 3 done','Get the spare battery from the rover','Put the battery in the power box','Turn the plugs to 1, 2, 3 · then connect','Make a choice at the computer: air or science?','Go to the door and bring everyone inside','Go inside! Follow the marker to the door','Close the door tight at the console','Wait for the storm to pass · then send a message home','Mission complete'],
 rover:['Listen to Elena’s plan','Get the spare battery','Put the battery in the rover','Fix the loose wheel pin','Check the wheels','Clean the dusty camera','Check the camera','Check suits, tools and radio','Get in the rover','Pick a path','Test drive: steer and stop','Pick a path and say why','Radio stop 1 of 2 · where are we?','Look at the strange ground','What should we do?','Drive to Kestrel Ridge','Get out and explore','Take a wide photo','Take a close photo','Say what you see','Science done!','Bonus rock or go home?','Send your photos','Check everyone is home','Drive home'],
 orbit:['Arrival at Mars','Dock with the space station','Soft capture is ready','Hear the plan','Find what is broken on the antenna','Turn off power to the antenna motor','Fix the antenna controller','Turn power on and test the radio','Pack your kit','Check the door to the lander','Get in the lander','Check the landing path','Check fuel and seat belts','Land on Mars!','Landing on Mars…','You landed on Mars!'],
 'solar-shelter':['Look at the space weather screen','Start the Sun storm practice','Put water bags around the safe room. Call the crew in.','Check on the crew and finish','Look at what you chose','Game stopped. Try again from a safe spot.'],
 greenhouse:['Meet the plants','Pick which plants get light. Then let them grow.','Fix the leaky water pipe','Harvest the ready plants','See how your plants did','Game stopped. Try again from a safe spot.'],
 'earth-delay':['Look at the broken pump','Send a message to Earth','Fix it yourself, or save air while you wait for Earth','Test the pump','Finish the mission','Look at what you chose','Game stopped. Try again from a safe spot.'],
 'lunar-sunlight':['Welcome to the Moon base','Check the battery and solar panel','Look at where the sunlight is','Pick a spot for the solar panel','Move the solar panel, set it up and plug it in','Save energy when the shadow comes','See how your plan worked','Game stopped. Try again!'],
 'lunar-dust':['Bring in the dusty things','Clean the dust off. Then shut the outside door','Clean the air with both doors shut','Check that no dust is left','Open the inside door and go in','See how you kept dust out','Game stopped. Try again from a safe spot.'],
 'lunar-relay':['Plan your Moon drive','Look at the map and the hill','Pick the near stop or the far stop','Set up the relay if you need it. Then do the science','Send your message and drive home','Check the message arrived and everyone is home','See how your trip went','Game stopped. Try again!']
};

test('Pip has a short why-tip for every objective in every chapter',()=>{
 for(const [chapter,list] of Object.entries(OBJECTIVES))for(const objective of list){
  const tip=pipTip(chapter,objective);
  assert.ok(tip?.why,`${chapter}: no tip for "${objective}"`);
  assert.ok(tip.why.split(/[.!?](\s|$)/).filter(s=>s&&s.trim()).length<=2,`${chapter}: tip too long for "${objective}"`);
 }
 assert.equal(pipTip('storm',''),null);
});

test('Pip picks the right tip when objectives share words',()=>{
 assert.match(pipTip('storm','Make a choice at the computer: air or science?').why,/choose/);
 assert.match(pipTip('lunar-sunlight','Pick a spot for the solar panel').why,/sunlight reaches/);
 assert.match(pipTip('rover','Radio stop 2 of 2 · how is the ground?').why,/where we are/);
 assert.match(pipTip('orbit','You landed on Mars!').why,/Welcome/);
});

test('Jezero terrain grid matches the archived HiRISE window and the outpost sits at height 0',()=>{
 const raw=JSON.parse(readFileSync(new URL('../public/data/raw/jezero-dtm/window.json',import.meta.url)));
 assert.equal(raw.product,JEZERO.product);
 assert.equal(JEZERO.rows,raw.window.lines/2+1);assert.equal(JEZERO.cols,raw.window.samples/2+1);
 assert.equal(JEZERO.data.length,JEZERO.rows);assert.ok(JEZERO.data.every(r=>r.length===JEZERO.cols));
 const flat=raw.heights.flat(),relief=Math.max(...flat)-Math.min(...flat);
 assert.ok(relief>5&&relief<60,`real relief ${relief} m`);
 assert.ok(Math.min(...flat)<-2000,'Jezero floor is about 2.5 km below the areoid');
 assert.equal(JEZERO.data[(10-JEZERO.minZ)/2][(10-JEZERO.minX)/2],0);
 assert.ok(Object.is(Math.abs(heightAt(10,10)),0));
});

test('storm sunlight follows the real 2018 Opportunity power record',()=>{
 assert.equal(sunlightFraction(0),1);
 assert.equal(sunlightFraction(1),22/645);
 assert.ok(sunlightFraction(.5)<sunlightFraction(.25));
 assert.ok(OPPORTUNITY_2018.points.every((p,i,a)=>!i||p.wh<a[i-1].wh));
 const m=create();m.started=true;m.diagnosed=true;
 advance(m,1);const early=m.sunlight;m.elapsed=(m.prepSeconds??1e9)*.9;advance(m,.01);
 assert.ok(early>.9&&m.sunlight<early,'sunlight dims as the storm nears');
});

test('rewritten dialogue never plays an out-of-date recorded clip',()=>{
 assert.equal(freshClip('orbit','brief',{text:'A brand new line no voice actor has read.'},'clip.ogg'),null);
 assert.equal(freshClip('storm','intro',null,'clip.ogg'),null);
 assert.equal(freshClip('storm','intro',{text:'x'},undefined),null);
});
