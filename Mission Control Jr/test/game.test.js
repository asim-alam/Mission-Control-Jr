import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { EVENTS, WORK } from '../story.js';
import {modeledStormExposure,remainingCrewCondition} from '../simulation/legacy-exposure.js';
import {selectDecisionReview} from '../simulation/decision-review.js';
import {trackPipMilestones} from '../professor-pip-milestones.js';

// Exercise the actual mission controller without requiring WebGL or audio.
const main = readFileSync(new URL('../main.js', import.meta.url), 'utf8');
const controller = main.slice(main.indexOf('// ---------- Game state'), main.indexOf('// ---------- Loop'));
function game(random = () => 0.99) {
  const completions=[];
  class Element {
    children = [];
    style = {};
    hidden = true;
    textContent = '';
    set innerHTML(value) { this.html = value; this.children = []; }
    get innerHTML() { return this.html || ''; }
    get firstElementChild() { return this.children[0]; }
    appendChild(child) { this.children.push(child); }
    focus() {}
  }
  const elements = new Map();
  const document = {
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, new Element());
      return elements.get(id);
    },
    createElement: () => new Element(),
  };
  const context = vm.createContext({
    EVENTS, WORK, modeledStormExposure, remainingCrewCondition, selectDecisionReview, trackPipMilestones, openPipMilestone() {}, document, shelter: { visible: false }, roverShelter:{visible:false},
    playBeep() {}, startAudio() {}, completeChapter(...args) { completions.push(args); }, openJourney() {}, Math: Object.assign(Object.create(Math), { random }),
  });
  vm.runInContext(controller + `
    globalThis.game = {
      newGame, chooseWork, resolveChoice, currentEvent, dailyUpkeep,
      get state() { return state; },
      get storm() { return stormLevel; },
    };
    newGame();
  `, context);
  return { ...context.game, api: context.game, elements, context, completions };
}

test('restart clears storm, shelter, event resolution and ending state', () => {
  const { api, context, elements } = game();
  vm.runInContext('stormLevel = 1; shelter.visible = true; roverShelter.visible = true; state.eventDone = 3; state.ended = true;', context);
  api.newGame();
  assert.equal(api.storm, 0);
  assert.equal(context.shelter.visible, false);
  assert.equal(context.roverShelter.visible,false);
  assert.equal(api.state.sol, 1);
  assert.equal(api.state.ended, false);
  assert.equal(api.state.eventDone, undefined);
  assert.equal(elements.get('modal').hidden, true);
});

test('events must be resolved before work and do not repeat that sol', () => {
  const { api } = game();
  api.chooseWork(WORK[0]);
  api.chooseWork(WORK[0]);
  assert.equal(api.state.sol, 3);
  api.chooseWork(WORK[0]);
  assert.equal(api.state.sol, 3);
  api.resolveChoice(api.currentEvent().choices[0]);
  assert.equal(api.currentEvent(), null);
  assert.equal(api.state.flags.fungusStudied, true);
  api.chooseWork(WORK[0]);
  assert.equal(api.state.sol, 4);
});

test('fungus poisoning injures two different crew members with the correct cause', () => {
  const { api } = game(() => 0);
  api.state.sol = 21;
  api.state.flags.fungusRushed = true;
  api.resolveChoice(api.currentEvent().choices[0]);
  assert.equal(api.state.crew.filter(c => c.hp === 75).length, 2);
  assert.equal(api.state.log.filter(line => line.includes('fungus poisoning')).length, 2);
});

test('water, rover, and no added shelter leave distinct nonzero modeled exposure', () => {
  for (const [shelterType,prep,exposure,condition] of [['water',55,15,97],['rover',45,25,95],[null,20,50,90]]) {
    const { api } = game();api.state.sol=27;api.state.shelterType=shelterType;api.state.res.radiation=prep;
    api.resolveChoice(api.currentEvent().choices[0]);
    assert.ok(api.state.crew.every(c=>c.hp===condition));assert.equal(api.state.exposurePoints,exposure);
  }
});

test('shelter reallocates water and greenhouse work yields a delayed supplement',()=>{
  const {api}=game();api.state.sol=24;const before=api.state.res.water;
  api.resolveChoice(api.currentEvent().choices[0]);assert.equal(api.state.res.water,before);assert.equal(api.state.shieldWater,15);assert.equal(api.state.shelterType,'water');
  const g=game().api;const initialFood=g.state.res.food;g.chooseWork(WORK[2]);assert.ok(g.state.res.food<initialFood);assert.equal(g.state.cropProgress,1);
  g.chooseWork(WORK[2]);g.state.eventDone=3;g.chooseWork(WORK[4]);assert.equal(g.state.cropProgress,0);assert.ok(g.state.log.some(line=>line.includes('fresh food is ready')));
});
test('water and rover shelter choices show distinct physical protection at the outpost',()=>{
 const water=game(),rover=game();water.api.state.sol=24;rover.api.state.sol=24;rover.api.state.flags.roverSalvaged=true;
 water.api.resolveChoice(water.api.currentEvent().choices.find(choice=>choice.shelterType==='water'));
 rover.api.resolveChoice(rover.api.currentEvent().choices.find(choice=>choice.shelterType==='rover'));
 assert.equal(water.context.shelter.visible,true);assert.equal(water.context.roverShelter.visible,false);assert.equal(rover.context.shelter.visible,false);assert.equal(rover.context.roverShelter.visible,true);
});

test('cumulative training hazards never reduce crew condition to zero or end the exercise with deaths', () => {
  const { api, elements } = game();
  api.state.sol = 27;
  api.state.crew.forEach(c => { c.hp = 10; });
  api.resolveChoice(api.currentEvent().choices[0]);
  assert.equal(api.state.ended, false);
  assert.ok(api.state.crew.every(c=>c.hp>=1));
  assert.doesNotMatch(api.state.log.join(' '),/did not survive|death/i);
  assert.match(elements.get('crew').innerHTML,/Condition 1/);
  assert.ok(elements.get('work').children.length>0);
});

test('exhaustion injures the tired astronaut instead of a rested colleague', () => {
  const { api } = game(() => 0);
  api.state.crew[3].fatigue = 90;
  api.dailyUpkeep();
  assert.equal(api.state.crew[3].hp, 90);
  assert.ok(api.state.crew.slice(0, 3).every(c => c.hp === 100));
});

test('full rest event advances one day without also producing work', () => {
  const { api } = game();
  api.state.sol = 18;
  api.state.crew.forEach(c => { c.fatigue = 80; });
  api.resolveChoice(api.currentEvent().choices[0]);
  assert.equal(api.state.sol, 19);
  assert.equal(api.state.res.power, 64);
  assert.ok(api.state.crew.every(c => c.fatigue === 45));
});

test('mission completion keeps the HUD on Sol 30 and blocks further work', () => {
  const { api, elements } = game();
  api.state.sol = 30;
  api.chooseWork(WORK[4]);
  assert.equal(api.state.ended, true);
  assert.equal(api.state.sol, 30);
  assert.equal(elements.get('sol').textContent, 'SOL 30 / 30');
  const finalState = JSON.stringify(api.state);
  api.chooseWork(WORK[0]);
  assert.equal(JSON.stringify(api.state), finalState);
  elements.get('modal-buttons').children.find(button=>button.textContent==='Begin a new mission').onclick();
  assert.equal(api.state.sol, 1);
  assert.equal(api.state.ended, false);
});

test('Thirty Sols records a completed recovery attempt without claiming success or mastery',()=>{
  const {api,elements,completions}=game();api.state.sol=30;api.state.crew.forEach(c=>{c.hp=20;});
  api.chooseWork(WORK[4]);
  assert.match(elements.get('modal-body').innerHTML,/Recovery Needed/);
  const result=completions.find(([id])=>id==='extended')?.[1];
  assert.equal(result.attemptCompleted,true);assert.equal(result.success,false);assert.equal(result.mastered,false);
});

test('conditional rover shelter and fungus events follow prior choices', () => {
  const { api } = game();
  api.state.sol = 21;
  assert.equal(api.currentEvent(), null);
  api.state.sol = 24;
  assert.equal(api.currentEvent().choices.length, 2);
  api.state.flags.roverSalvaged = true;
  assert.equal(api.currentEvent().choices.length, 3);
});

test('Kestrel survey adds the Sol 8 route option only when the connected mission was successful',()=>{
  const {api}=game();api.state.sol=8;assert.equal(api.currentEvent().choices.length,3);
  api.state.flags.kestrelSurveyed=true;assert.equal(api.currentEvent().choices.length,4);
  api.resolveChoice(api.currentEvent().choices[3]);assert.equal(api.state.flags.kestrelRouteUsed,true);
});
