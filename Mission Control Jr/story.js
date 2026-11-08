// Story events keyed by sol. Each choice applies resource deltas and sets flags.
export const EVENTS = {
  3: {
    title: 'Day 3 — A Strange Plant',
    text: 'Amara finds a pale mushroom growing with the plants. It could be good food. But is it safe to eat? Nobody knows yet.',
    choices: [
      { label: 'Test it first to see if it is safe (−10 power)', fx: { power: -10, morale: 5 }, flag: 'fungusStudied', note: 'Good thinking! The test results come on Day 21.' },
      { label: 'Eat it now to save food', fx: { food: 15, morale: -5 }, flag: 'fungusRushed', note: 'That was a risky guess.' },
      { label: 'Throw it away, just in case', fx: { morale: -8, equipment: 3 }, note: 'Safe, but we will never know what it was.' },
    ],
  },
  8: {
    title: 'Day 8 — An Old Rover',
    text: 'Space photos show an old rover 6 km away. It might still have a good battery and spare parts!',
    choices: [
      { label: 'Check the spacesuit well, then walk there (−8 air)', fx: { oxygen: -8, equipment: 15, power: 10 }, flag: 'roverSalvaged', fatigue: 15, note: 'Checking first paid off!' },
      { label: 'Rush out fast with no checks', fx: { oxygen: -4, equipment: 8 }, hurt: 30, fatigue: 10, note: 'The spacesuit leaked a little on the way back. Ouch.' },
      { label: 'Leave it. It is too far.', fx: { morale: -4 }, note: 'Safe, but we missed the spare parts.' },
    ],
  },
  12: {
    title: 'Day 12 — Dust Storm Coming!',
    text: 'A big dust storm is coming. The dust will hide the Sun, so the solar panels will make less power for days.',
    choices: [
      { label: 'Save power and store extra air now', fx: { power: -5, oxygen: 10, morale: -3 }, flag: 'stormReady', note: 'The crew is ready. They wait in the dim light.' },
      { label: 'Keep working like normal', fx: { morale: 3 }, flag: 'stormIgnored', note: 'Hmm. That might be a problem later.' },
    ],
  },
  13: { storm: true },
  14: { storm: true },
  18: {
    title: 'Day 18 — Very Tired Crew',
    text: 'Elena sees the crew making mistakes. They have worked hard for weeks and are very tired.',
    choices: [
      { label: 'Take a rest day (no work today)', fx: { morale: 12 }, rest: 40, skipWork: true, note: 'Rested people make fewer mistakes.' },
      { label: 'Keep working anyway', fx: { equipment: -10, morale: -10 }, fatigue: 10, note: 'Tired people break things by accident.' },
    ],
  },
  21: {
    title: 'Day 21 — Mushroom Test Results',
    cond: (s) => s.flags.fungusStudied || s.flags.fungusRushed,
    text: null,
  },
  24: {
    title: 'Day 24 — Sun Storm Coming!',
    text: 'Earth says the Sun just had a huge flash. Invisible radiation will reach Mars on Day 27. The base walls are not enough to block it.',
    choices: [
      { label: 'Put 15 water around the beds to block it', cond: (s) => s.res.water >= 15, fx: { radiation: 35 }, shieldWater: 15, shelterType: 'water', flag: 'shelterBuilt', note: 'Water blocks radiation. The beds are safer now.' },
      { label: 'Hide inside the old rover', cond: (s) => s.flags.roverSalvaged, fx: { power: -10, radiation: 25 }, shelterType: 'rover', flag: 'shelterBuilt', note: 'The rover walls help block it, but it uses power.' },
      { label: 'Just hope the walls are enough', fx: {}, note: 'Hoping is not a plan!' },
    ],
  },
  27: { solarStorm: true },
};

export const WORK = [
  { id: 'power', label: 'Clean the solar panels', fx: { power: 12 } },
  { id: 'life', label: 'Make air and clean water', fx: { oxygen: 8, water: 8, power: -4 } },
  { id: 'farm', label: 'Look after the plants (−4 power, −3 water)', fx: { morale: 2, water: -3, power: -4 } },
  { id: 'repair', label: 'Fix machines', fx: { equipment: 12 } },
  { id: 'rest', label: 'Easy jobs and rest', fx: { morale: 6 }, rest: 20 },
];
