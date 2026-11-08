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
 'solar-shelter':['Read the Sun storm warning','Pick your shelter plan','Build the shelter · 3 of 8 spots filled','Put the water wall in a glowing shelter spot','Put the plastic shield in a glowing shelter spot','Call the crew into the shelter · 1 of 4','Get inside the shelter yourself','Stay inside until the storm passes','All clear! Check the storm screen','See how your shelter worked','Game stopped. Try again from a safe spot.'],
 greenhouse:['Meet the plants','Pick your farming plan','Day 1: set the lights, water, then end the day','Day 2: water the dry beds','Too much light! Turn a light down','Fix the leak: close the red valve','Fix the leak: take off the old hose','Fix the leak: get the spare hose','Fit the new hose where the old one was','Fix the leak: open the red valve','Harvest day! Get the basket','Pick the ready plants','Serve dinner: put the basket on the table','See how your plants did','Game stopped. Try again from a safe spot.'],
 'earth-delay':['Meet the broken water machine','Pick your repair plan','Send a message to Earth at the console','Earth answered! Read it at the console','Wait for Earth’s answer at the console','Turn on save-water mode while you wait','Fit the new pump motor in the machine','Fit the new filter in the machine','Turn off the power lever','Open the panel: hold E on it','Get a spare water valve from the shelf','Look at the filter','Test the pump motor with the meter','Get the multimeter from the shelf','Close the panel','Turn the power lever back on','Do a test run: press the lamp on the machine','It works! Finish at the console','See how your repair went','Game stopped. Try again from a safe spot.'],
 'lunar-sunlight':['Welcome to Horizon Base','Pick a pad for the solar mast','Hitch the solar cart: grab its handle','Tow the cart to the Ridge pad','Put the cart’s legs down at the Near pad','Raise the mast: press E on the green ▲ button','Raise the mast more, or open the solar wings','Open the solar wings','Take the plug from the cable reel','Carry the plug to the base power port','Turn on the Sun tracker on the cart','Pick a power plan at the base console','Watch 18 days go by at the base console','See how your plan worked','Game stopped. Try again!'],
 'lunar-dust':['Welcome back from your moonwalk','Pick a cleaning plan','Shut the outside hatch: hold E on the orange wheel','Fill the airlock with air: press the green button','Swap the air filter: hold E on the filter door','Flip the EDS switch to zap the dust','Clean the space suit: hold E on it','Clean the helmet: hold E on it','Put dusty gear on the EDS plate, or grab a tool','Grab the vacuum hose on the bench','Grab the brush on the bench','The filter is full! Get a new one from the locker','No filters left. Open the inside hatch when ready','Clean the air: press the green button','All clean! Open the inside hatch: hold E on the green wheel','See how you kept the dust out','Game stopped. Try again!'],
 'lunar-relay':['Welcome to Horizon Base','Pick a plan for the trip','Pick up the radio relay by its handle','Put the relay on the rover’s cargo deck','Get in the rover and drive to the ridge top','Lift the relay off the rover','Set the relay down on the yellow ring','Put the relay’s legs out: hold E on it','Raise the mast: press E on the green ▲','Aim the dish at the base: hold E on the dish','Drive down into Shadow Hollow','Take the drill off the rover','Set the drill on the glowing X','Set the drill on the second X','Drill a core: hold E on the drill','Take the core out of the drill','Put the core in the sample box on the rover','Send the data: hold E on the rover radio','Earth wants one more! Take the drill again','Move the drill to the second X','Put the drill back on the rover','Pick up the drill and put it on the rover','Drive home over the hill','Drive home to the base','Go inside: hold E on the base hatch','See how your trip went','Suit air ran low. Try again!','Game stopped. Try again!'],
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
 assert.match(pipTip('lunar-sunlight','Pick a pad for the solar mast').why,/sunny longer/);
 assert.match(pipTip('lunar-sunlight','Raise the mast more, or open the solar wings').why,/taller mast/);
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
