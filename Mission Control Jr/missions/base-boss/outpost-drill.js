import {servePower, moveWater} from '../../simulation/resources.js';
import {accumulateExposure} from '../../simulation/exposure.js';
import {sunlightFraction} from '../../data/opportunity-2018.js';
import data from '../../data/normalized.json' with {type: 'json'};

const shiftMinutes = 10;
const lightTime = data.marsLightTime.oneWayMinutes;
export const replyMinute = lightTime * 2;
const arraySamples = [.12, .5, .88];
const {sourceUrl: radSource, reportedAbsorbedDoseMicrogray: radReading} = data.curiosityRad;
const micrograyPerTrainingPoint = 81;
const radPoints = radReading / micrograyPerTrainingPoint;
const demands = {life: 4, water: 2, grow: 3};
export const cropGoal = 2;

export const evidence = {
  dust: {label: 'NASA/JPL · Opportunity and the 2018 dust storm', href: 'https://www.jpl.nasa.gov/news/opportunity-hunkers-down-during-dust-storm/', fact: 'Dust reduced the sunlight reaching Opportunity. The archived decline in rover solar output sets the shape of Verdant’s training forecast.'},
  life: {label: 'NASA · Space station life support', href: 'https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/', fact: 'The station recovers clean water from waste. Its oxygen generator uses clean water and electricity to make oxygen.'},
  rad: {label: 'NASA/JPL · Curiosity’s May 2024 solar storm', href: radSource, fact: `NASA reported ${radReading.toLocaleString('en-US')} micrograys for the May 20, 2024 event at Curiosity. The drill scales this to ${Math.round(radPoints)} outdoor training points. Shelter protection in the drill is fictional.`},
  food: {label: 'NASA OSDR · Lettuce grown on the ISS', href: 'https://osdr.nasa.gov/bio/repo/data/studies/OSD-269', fact: 'The lettuce study used 16 hours of light and 8 hours of dark. The drill uses short light-and-water cycles for an already-grown crop.'},
  radio: {label: 'NASA/JPL · Horizons light-time calculation', href: 'https://ssd.jpl.nasa.gov/horizons/', fact: `The archived ${data.marsLightTime.date.slice(0, 10)} calculation gives ${lightTime.toFixed(2)} minutes one way. The drill assumes the reply is sent as soon as Earth receives the message.`},
};

export const stages = [
  {
    title: 'Dust dims the solar panels',
    brief: 'The reactor still powers the main base. Verdant’s power line from Meridian is limited, so its solar panels and battery have to cover the rest. Earth has been asked for help.',
    choice: 'What should Verdant power?',
    options: [
      {id: 'reserve', name: 'Run the water recycler', info: 'Protect air and water. Save more battery and miss this grow-light window.', loads: ['life', 'water']},
      {id: 'grow', name: 'Run the grow lights', info: 'Use stored water and try to keep the harvest on schedule.', loads: ['life', 'grow']},
      {id: 'both', name: 'Run both from the battery', info: 'Power the recycler and lights together. Spend battery you may need later.', loads: ['life', 'water', 'grow']},
    ],
    sources: ['dust', 'life'],
  },
  {
    title: 'Solar particles are on the way',
    brief: 'This is a separate event from the dust storm. Recall the crew and decide which refuge to use.',
    choice: 'Where should the crew shelter?',
    options: [
      {id: 'core', name: 'Use the shielded core', info: 'Keep the water tanks free for life support. Close the grow bay while the crew shelters.', loads: ['life', 'water'], protection: .42},
      {id: 'water-wall', name: 'Line the refuge with water', info: 'Set aside 2 water units for extra shielding. The automatic grow lights can still run if there is enough water and power.', loads: ['life', 'grow'], protection: .24, shieldingWater: 2},
    ],
    sources: ['rad'],
  },
  {
    title: 'Earth’s reply is still on the way',
    brief: 'Restore more power to Verdant. Start a local check or wait for Earth’s help. Water in the shielding stays there until the all-clear.',
    choice: 'Which restart plan should you use?',
    options: [
      {id: 'local', name: 'Start the local checklist', info: 'Spend 1 power on the test. Restore 3 power and use it for air and water.', loads: ['life', 'water'], feeder: 2},
      {id: 'wait', name: 'Wait for Earth’s checklist', info: 'Use 1 stored air unit during the wait. Restore 4 power and prioritize the grow lights.', loads: ['life', 'grow'], feeder: 4, waitingAir: 1},
    ],
    sources: ['radio', 'food', 'life'],
  },
];

export function newDrill() {
  return {turn: 0, battery: 3, air: 3, water: 5, shieldWater: 0, crop: 0, exposure: 0, history: []};
}

export function solarForTurn(turn) {
  return Math.floor(6 * sunlightFraction(arraySamples[turn]));
}

export function tryPlan(state, id) {
  const option = stages[state.turn]?.options.find(choice => choice.id === id);
  if (!option) return null;
  const stock = {clean: state.water, wall: state.shieldWater};
  if (option.shieldingWater && !moveWater(stock, 'clean', 'wall', option.shieldingWater)) return null;
  const available = 3 + solarForTurn(state.turn) + (option.feeder || 0);
  const loads = state.crop === cropGoal ? option.loads.filter(load => load !== 'grow') : option.loads;
  const energy = servePower({
    energyWh: state.battery, capacityWh: 7, generationW: available * 6,
    loads: loads.map(load => ({id: load, watts: demands[load] * 6})),
  }, shiftMinutes * 60);
  const served = key => (energy.servedWh[key] || 0) >= demands[key] - .00001;
  const recyclerRan = served('water');
  const madeAir = served('life') && stock.clean + (recyclerRan ? 2 : 0) >= 1;
  const air = Math.max(0, state.air - (option.waitingAir || 0) - (madeAir ? 0 : 2));
  const afterCrew = Math.max(0, stock.clean + (recyclerRan ? 2 : 0) - 1);
  const lit = served('grow') && afterCrew >= 1;
  const crop = Math.min(cropGoal, state.crop + Number(lit));
  const exposure = option.protection
    ? accumulateExposure(state.exposure, radPoints / (shiftMinutes * 60), option.protection, shiftMinutes * 60)
    : state.exposure;
  const result = {
    turn: state.turn + 1, battery: Math.round(energy.energyWh), air,
    water: Math.min(7, afterCrew - Number(lit)), shieldWater: stock.wall, crop, exposure,
  };
  const effects = [
    madeAir ? 'Life support held the air reserve.' : 'Life support drew down the stored air.',
    recyclerRan ? 'The recycler returned clean water to the tank.' : 'The crew used stored water.',
    state.crop === cropGoal ? 'The crop stayed ready for harvest.' :
      lit ? 'The crop got a light and water cycle.' : 'The crop missed a light and water cycle.',
  ];
  if (option.shieldingWater) effects.push('Two water units are still inside the shielding wall.');
  if (option.protection) effects.push(`The shelter limited this event to ${Math.round(exposure)} training exposure points out of ${Math.round(radPoints)} outdoors.`);
  if (result.turn === stages.length) {
    result.water = Math.min(7, result.water + result.shieldWater);
    result.shieldWater = 0;
    if (stock.wall) effects.push('The crew returned the shielding water to the clean-water tank.');
    effects.push(`Earth’s reply arrived at about minute ${Math.round(replyMinute)}.`);
  }
  return {
    ...result,
    history: [...state.history, {name: option.name, lit, recyclerRan, effects: effects.join(' ')}],
  };
}

export function drillOutcome(state) {
  if (state.turn < stages.length) return null;
  if (state.air < 2 || state.water < 2) {
    return {title: 'Recovery needed', summary: 'Reserves are too low. The crew switches to emergency supplies and calls for support. Replay to find where you can preserve air or water.'};
  }
  if (state.crop < cropGoal) {
    return {title: 'Crew safe · harvest delayed', summary: 'Your crew has air, water and shelter. They use packed food while the greens get their remaining light and water cycle.'};
  }
  return {title: 'Crew safe · harvest ready', summary: 'Your crew has air, water and shelter, and the greens can supplement their packed food.'};
}
