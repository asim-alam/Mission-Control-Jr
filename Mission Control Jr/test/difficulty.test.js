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

// Wait for Earth's advice without conserving reserves: the lesson case.
function waitForEarth(level){
 const m=createDelay({scenario:tuneScenario('earth-delay',delayScenario,level)});
 for(const id of ['begin','inspectFault','sendEarthRequest','isolatePumpBranch'])ok(delayAction(m,{id}));
 while(m.phase==='active'&&m.message.status!=='delivered')delayAction(m,{id:'wait',payload:300});
 if(m.phase==='active'){ok(delayAction(m,{id:'applyAdvice'}));ok(delayAction(m,{id:'verifyFlow'}));}
 return m;
}
test('Earth delay: waiting idly stops Explorer training but Cadet survives with a visible cost',()=>{
 assert.equal(waitForEarth('explorer').phase,'suspended');
 const cadet=waitForEarth('cadet');assert.equal(cadet.phase,'active');assert.equal(cadet.verified,true);
 assert.ok(cadet.airReserveUnits<40,'the cost of waiting should still be obvious');
});

test('Shelter: a Cadet can place all water and recall the crew with time to spare',()=>{
 const m=createShelter({scenario:tuneScenario('solar-shelter',shelterScenario,'cadet')});
 ok(shelterAction(m,{id:'inspectMonitor'}));ok(shelterAction(m,{id:'begin'}));
 for(const id of [0,1,2])ok(shelterAction(m,{id:'moveBag',targetId:id,payload:'shelter'}));ok(shelterAction(m,{id:'recallCrew'}));
 assert.ok(m.scenario.hazardStart-m.simSeconds>=360,`only ${m.scenario.hazardStart-m.simSeconds}s left`);
 assert.ok(m.scenario.hazardStart<m.scenario.hazardEnd&&m.scenario.hazardEnd<m.scenario.durationSeconds);
});

test('Lunar dust: Cadet starts with a larger filter and two spares; Explorer is unchanged',()=>{
 const cadet=createDust({scenario:tuneScenario('lunar-dust',lunarDustScenario,'cadet')}),explorer=createDust({scenario:tuneScenario('lunar-dust',lunarDustScenario,'explorer')});
 assert.deepEqual([cadet.filterRemaining,cadet.spareFilters],[60,2]);assert.deepEqual([explorer.filterRemaining,explorer.spareFilters],[30,1]);
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
