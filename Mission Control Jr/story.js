// Story events keyed by sol. Each choice applies resource deltas and sets flags.
export const EVENTS = {
  3: {
    title: 'Sol 3 — Unexpected Growth',
    text: 'Biologist Amara Okafor finds a pale fungus growing in the hydroponics bay. Early tests show it is high in protein, but nobody knows yet whether it is safe to eat.',
    choices: [
      { label: 'Study toxicity before eating it (−10 power)', fx: { power: -10, morale: 5 }, flag: 'fungusStudied', note: 'Patience. Full results are due on Sol 21.' },
      { label: 'Start eating it now to save food', fx: { food: 15, morale: -5 }, flag: 'fungusRushed', note: 'A risky shortcut.' },
      { label: 'Destroy it; contamination risk', fx: { morale: -8, equipment: 3 }, note: 'Safe, but a discovery is lost.' },
    ],
  },
  8: {
    title: 'Sol 8 — The Silent Rover',
    text: 'Orbital images show an abandoned rover from an earlier mission 6 km away. It may still have a working battery and spare parts.',
    choices: [
      { label: 'Plan a careful EVA with a full suit check (−8 O₂)', fx: { oxygen: -8, equipment: 15, power: 10 }, flag: 'roverSalvaged', fatigue: 15, note: 'Preparation paid off.' },
      { label: 'Send one astronaut out fast, no checks', fx: { oxygen: -4, equipment: 8 }, hurt: 30, fatigue: 10, note: 'A suit seal failed on the way back.' },
      { label: 'Leave it; the risk is too high', fx: { morale: -4 }, note: 'Caution, at a cost to curiosity.' },
    ],
  },
  12: {
    title: 'Sol 12 — Dust Storm Warning',
    text: 'A regional dust storm is coming. It will cut solar output for days.',
    choices: [
      { label: 'Lower power use and stockpile oxygen now', fx: { power: -5, oxygen: 10, morale: -3 }, flag: 'stormReady', note: 'The crew rides out the storm in the dim light.' },
      { label: 'Keep working as normal', fx: { morale: 3 }, flag: 'stormIgnored', note: 'They will feel this later.' },
    ],
  },
  13: { storm: true },
  14: { storm: true },
  18: {
    title: 'Sol 18 — Running on Empty',
    text: 'Commander Reyes notices mistakes piling up. The crew is worn out after weeks of long shifts.',
    choices: [
      { label: 'Call a full rest day (no production today)', fx: { morale: 12 }, rest: 40, skipWork: true, note: 'Rested crews make fewer mistakes.' },
      { label: 'Push through; the schedule matters', fx: { equipment: -10, morale: -10 }, fatigue: 10, note: 'Exhaustion breeds errors.' },
    ],
  },
  21: {
    title: 'Sol 21 — Fungus Results',
    cond: (s) => s.flags.fungusStudied || s.flags.fungusRushed,
    text: null,
  },
  24: {
    title: 'Sol 24 — Solar Particle Event Forecast',
    text: 'Earth reports a major solar flare. A radiation storm will hit Mars around Sol 27. The hab walls alone will not be enough.',
    choices: [
      { label: 'Pack water tanks around the sleep area as shielding (−15 water)', fx: { water: -15, radiation: 35 }, flag: 'shelterBuilt', note: 'Water is an excellent radiation shield.' },
      { label: 'Shelter inside the salvaged rover cabin', cond: (s) => s.flags.roverSalvaged, fx: { power: -10, radiation: 25 }, flag: 'shelterBuilt', note: 'Old hardware, put to new use.' },
      { label: 'Trust the hab walls', fx: {}, note: 'Hope is not a plan.' },
    ],
  },
  27: { solarStorm: true },
};

export const WORK = [
  { id: 'power', label: 'Clean solar panels', fx: { power: 12 } },
  { id: 'life', label: 'Run O₂ / water recycling', fx: { oxygen: 8, water: 8, power: -4 } },
  { id: 'farm', label: 'Tend the greenhouse', fx: { food: 8, morale: 2, water: -3 } },
  { id: 'repair', label: 'Maintain equipment', fx: { equipment: 12 } },
  { id: 'rest', label: 'Light duty & rest', fx: { morale: 6 }, rest: 20 },
];
