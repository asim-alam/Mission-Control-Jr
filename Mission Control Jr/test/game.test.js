import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { EVENTS, WORK } from '../story.js';

// Exercise the actual mission controller without requiring WebGL or audio.
const main = readFileSync(new URL('../main.js', import.meta.url), 'utf8');
const controller = main.slice(main.indexOf('// ---------- Game state'), main.indexOf('// ---------- Loop'));
function game(random = () => 0.99) {
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
    EVENTS, WORK, document, shelter: { visible: false },
    playBeep() {}, startAudio() {}, Math: Object.assign(Object.create(Math), { random }),
  });
  vm.runInContext(controller + `
    globalThis.game = {
      newGame, chooseWork, resolveChoice, currentEvent, dailyUpkeep,
      get state() { return state; },
      get storm() { return stormLevel; },
    };
    newGame();
  `, context);
  return { ...context.game, api: context.game, elements, context };
}

test('restart clears storm, shelter, event resolution and ending state', () => {
  const { api, context, elements } = game();
  vm.runInContext('stormLevel = 1; shelter.visible = true; state.eventDone = 3; state.ended = true;', context);
  api.newGame();
  assert.equal(api.storm, 0);
  assert.equal(context.shelter.visible, false);
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

test('radiation affects the entire unshielded crew, and shelter prevents it', () => {
  for (const shielded of [false, true]) {
    const { api } = game();
    api.state.sol = 27;
    api.state.flags.shelterBuilt = shielded;
    api.resolveChoice(api.currentEvent().choices[0]);
    assert.ok(api.state.crew.every(c => c.hp === (shielded ? 100 : 50)));
  }
});

test('fatal event immediately ends the mission and refreshes crew display', () => {
  const { api, elements } = game();
  api.state.sol = 27;
  api.state.crew.forEach(c => { c.hp = 10; });
  api.resolveChoice(api.currentEvent().choices[0]);
  assert.equal(api.state.ended, true);
  assert.match(elements.get('modal-body').innerHTML, /Silent Outpost/);
  assert.match(elements.get('crew').innerHTML, /HP 0/);
  assert.equal(elements.get('work').children.length, 0);
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
  elements.get('modal-buttons').children[0].onclick();
  assert.equal(api.state.sol, 1);
  assert.equal(api.state.ended, false);
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
