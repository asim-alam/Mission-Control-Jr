import inputs from '../../data/normalized.json' with {type: 'json'};

// "Message to Earth" — the water recycler breaks. Ask Earth for help, fix it yourself, or both.
// SOURCED: the Mars–Earth one-way light time on the mission date (JPL Horizons, mar099/DE441,
// archived in data/normalized.json). A message cannot travel faster than light, so this delay is real.
// AUTHORED (game tuning): the recycler hardware, the faults, meter readings, water use, spare parts and how long Earth thinks.
export const delayScenario = {
  id: 'meridian-sol35-v2', version: 2, sourceId: 'horizons-mars-earth-2026-11-14',
  oneWaySeconds: inputs.marsLightTime.oneWayMinutes * 60, geometryDate: inputs.marsLightTime.date, sol: 35,
  timeScale: 10,                 // 1 real second = 10 mission seconds while you play
  earthThinkSeconds: 360,        // Earth's team studies the problem; halved if you send your meter readings
  waterStartL: 20, defaultCarryL: 12, waterUseLPerMin: .5, saveUseLPerMin: .2, lowWaterL: 3,
  holdSeconds: {openPanel: 2, closePanel: 1.5, test: 1, inspect: 1, swap: 1.6},
  spares: {pump: 1, valve: 1, filter: 2},
  // Seeded faults. "broken" stops the machine; "cause" is what broke it (fix it or the machine runs badly).
  variants: [{broken: 'pump', cause: 'filter'}, {broken: 'valve', cause: 'filter'}, {broken: 'pump', cause: null}],
  meter: {
    pump: {range: '8–15 Ω', ok: '12 Ω', bad: 'OL (no path)'},
    valve: {range: '20–40 Ω', ok: '28 Ω', bad: '0.4 Ω'},
  },
  ratings: {great: 20, ok: 10},  // litres of water left
  limitation: 'The time for a message to reach Earth on this date is real (from NASA JPL Horizons). The recycler, its parts, the meter numbers, how much water the crew uses and how long Earth takes to think are made up for this game.',
};
