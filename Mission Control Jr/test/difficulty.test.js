import test from 'node:test';
import assert from 'node:assert/strict';
import {difficultyLevel,setDifficultyLevel,tuneScenario,chapterTuning,reserveText,CADET_TUNING,DIFFICULTY_KEY} from '../simulation/difficulty.js';
import {createMission as createDelay} from '../missions/earth-delay/state.js';
import {delayScenario} from '../missions/earth-delay/scenario.js';
import {applyAction as delayAction} from '../missions/earth-delay/actions.js';
import {createMission as createShelter} from '../missions/solar-shelter/state.js';
import {shelterScenario} from '../missions/solar-shelter/scenario.js';
import {applyAction as shelterAction} from '../missions/solar-shelter/actions.js';
import {createMission as createDust} from '../missions/lunar-dust/state.js';
import {lunarDustScenario} from '../missions/lunar-dust/scenario.js';
import {greenhouseScenario} from '../missions/greenhouse/scenario.js';
import {lunarSunScenario} from '../missions/lunar-sunlight/scenario.js';
import {lunarRelayScenario} from '../missions/lunar-relay/scenario.js';
import {createMission as createStorm,act as stormAct,advance as stormAdvance,PREPARATION_SECONDS} from '../mission.js';
import {createExpedition,forecast} from '../mission2.js';

const memory=(value)=>{const data=new Map(value?[[DIFFICULTY_KEY,value]]:[]);return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,String(v))};};
const ok=(r)=>assert.ok(r.ok,r.message);

test('Cadet is the default level and Explorer can be chosen',()=>{
 assert.equal(difficultyLevel(memory()),'cadet');
 assert.equal(difficultyLevel({getItem(){throw new Error('blocked');}}),'cadet');
 const store=memory();assert.equal(setDifficultyLevel('explorer',store),true);assert.equal(difficultyLevel(store),'explorer');
 assert.equal(setDifficultyLevel('expert',store),false);assert.equal(difficultyLevel(store),'explorer');
});

test('Explorer keeps every authored scenario value; Cadet changes only listed values',()=>{
 const all={'solar-shelter':shelterScenario,greenhouse:greenhouseScenario,'earth-delay':delayScenario,'lunar-sunlight':lunarSunScenario,'lunar-dust':lunarDustScenario,'lunar-relay':lunarRelayScenario};
 for(const [id,scenario] of Object.entries(all)){
  const {difficulty,...explorer}=tuneScenario(id,scenario,'explorer');assert.equal(difficulty,'explorer');assert.deepEqual(explorer,scenario,id);
  const cadet=tuneScenario(id,scenario,'cadet');assert.equal(cadet.difficulty,'cadet');
  for(const key of Object.keys(scenario))if(!(key in CADET_TUNING[id]))assert.deepEqual(cadet[key],scenario[key],`${id}.${key}`);
 }
 assert.notEqual(tuneScenario('lunar-sunlight',lunarSunScenario,'cadet').pads,lunarSunScenario.pads,'tuned copy must not share nested objects');
});

// Wait for Earth without save-water mode: the lesson case.
function waitForEarth(level){
 const m=createDelay({scenario:tuneScenario('earth-delay',delayScenario,level)});
 for(const [id,x] of [['begin'],['choosePlan','earth'],['sendMessage'],['waitForEarth'],['readAnswer'],['togglePower'],['openPanel']])ok(delayAction(m,{id,payload:x,targetId:x}));
 for(const p of ['pump','filter']){ok(delayAction(m,{id:'takeSpare',targetId:p}));ok(delayAction(m,{id:'swap',targetId:p}));}
 for(const id of ['closePanel','togglePower','testRun','finish'])ok(delayAction(m,{id}));
 return m;
}
test('Earth delay: waiting without saving water costs more on Explorer; Cadet keeps more water',()=>{
 const explorer=waitForEarth('explorer'),cadet=waitForEarth('cadet');
 assert.equal(explorer.fixed,true);assert.equal(cadet.fixed,true);
 assert.ok(cadet.waterL>explorer.waterL,'Cadet should keep more water');
 assert.ok(explorer.waterL<explorer.waterStartL*.6,'the cost of waiting should still be obvious');
});

test('Shelter: a Cadet gets more work time before the particles rise; the shielding rules stay the same',()=>{
 const cadet=createShelter({scenario:tuneScenario('solar-shelter',shelterScenario,'cadet')}),explorer=createShelter({scenario:tuneScenario('solar-shelter',shelterScenario,'explorer')});
 assert.ok(cadet.scenario.onsetMinute>explorer.scenario.onsetMinute);assert.deepEqual(cadet.scenario.water,explorer.scenario.water);assert.equal(cadet.scenario.peakOutsideRate,explorer.scenario.peakOutsideRate);
 for(const m of [cadet,explorer]){ok(shelterAction(m,{id:'begin'}));ok(shelterAction(m,{id:'chooseAssist',payload:'trolley'}));}
});

test('Lunar dust: Cadet starts with more power and two spare filters; tools work the same',()=>{
 const cadet=createDust({scenario:tuneScenario('lunar-dust',lunarDustScenario,'cadet')}),explorer=createDust({scenario:tuneScenario('lunar-dust',lunarDustScenario,'explorer')});
 assert.deepEqual([cadet.power,cadet.spares],[70,2]);assert.deepEqual([explorer.power,explorer.spares],[50,1]);
 assert.deepEqual(cadet.scenario.tools,explorer.scenario.tools);
});

test('Storm: Cadet has longer preparation and slower unsealed oxygen loss',()=>{
 const run=(options)=>{const m=createStorm(options);stormAct(m,'start');stormAct(m,'diagnose');for(let t=0;t<PREPARATION_SECONDS+1;t+=1)stormAdvance(m,1);return m;};
 const explorer=run(chapterTuning('storm','explorer')),cadet=run(chapterTuning('storm','cadet'));
 assert.equal(explorer.storm,true);assert.equal(cadet.storm,false);
 for(let t=0;t<200;t++)stormAdvance(cadet,1);assert.equal(cadet.storm,true);
 const a=createStorm(),b=createStorm(chapterTuning('storm','cadet'));for(const m of [a,b]){stormAct(m,'start');stormAct(m,'diagnose');stormAct(m,'enter');stormAdvance(m,1);}
 assert.ok(b.resources.oxygen>a.resources.oxygen);
});

test('Rover: Cadet forecast and drain use the same gentler scale',()=>{
 const explorer=createExpedition(chapterTuning('rover','explorer')),cadet=createExpedition(chapterTuning('rover','cadet'));
 assert.equal(explorer.drainScale,1);assert.ok(cadet.drainScale<1);
 assert.ok(forecast(cadet,300).battery>forecast(explorer,300).battery);assert.ok(forecast(cadet,300).oxygen>forecast(explorer,300).oxygen);
});

test('HUD reserves read as percent and a word for Cadets, units for Explorers',()=>{
 assert.equal(reserveText(200,400,'Wh','cadet'),'50% · Good');
 assert.equal(reserveText(40,100,'units','cadet'),'40% · Getting low');
 assert.equal(reserveText(-5,100,'units','cadet'),'0% · Very low');
 assert.equal(reserveText(140.4,400,'Wh','explorer'),'140 Wh');
 assert.equal(reserveText(11.25,12,'kg','explorer'),'11.3 kg');
});
