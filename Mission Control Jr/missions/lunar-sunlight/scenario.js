import inputs from '../../data/normalized.json' with {type: 'json'};
import {SITE} from '../shared/moon-ground.js';

// "Chasing the Sun" — set up a tall solar mast near the Moon's south pole and keep Horizon Base powered.
// SOURCED: LOLA long-term sunlight averages for two real example spots near the pole (NASA PGDA product 69),
// and the fact that near the pole the Sun stays within about 1.5° of the horizon, so shadows are very long.
// AUTHORED (game tuning): the terrain, panel power, battery, loads, suit time and the 18-day window.
const patches = Object.fromEntries(inputs.lunarIllumination.patches.map(p => [p.id, p]));
export const lunarSunScenario = {
  id: 'horizon-sun-v2', version: 2, sourceId: 'lola-south-polar-illumination',
  lola: {near: patches['nearby-patch'].meanFraction, ridge: patches['ridge-patch'].meanFraction, years: inputs.lunarIllumination.averagingYears, product: inputs.lunarIllumination.productId},
  sunElevationDeg: 1.5, window: {days: 18, startAzimuthDeg: 65, sweepDeg: 220},
  pads: {
    near: {name: 'Near pad', x: SITE.pads.near.x, z: SITE.pads.near.z, towMinutes: 8, carryMinutes: 6},
    ridge: {name: 'Ridge pad', x: SITE.pads.ridge.x, z: SITE.pads.ridge.z, towMinutes: 16, carryMinutes: 13},
  },
  port: SITE.powerPort, cableM: 50,
  mast: {baseTop: 2.4, stage: 1.8, stages: 3},
  suitMinutes: 120, lowSuitMinutes: 15,
  workMinutes: {hitch: 2, legs: 3, stage: 4, wings: 3, plug: 2, tracker: 1},
  panelKW: 3.6, essentialKW: 1.2, scienceKW: .8, batteryKWh: 45, batteryStartKWh: 25,
  ratings: {greatScience: .7, okColdHours: 12},
  limitation: 'The LOLA numbers are long-term averages for two real 300 m spots near the pole, not for this made-up landscape. The hills, shadows, panel power, battery, loads, suit time and the 18-day window are made up for the game. The Sun’s height is kept at 1.5° the whole time to keep it simple.',
};
