// "Dust Busters" — clean moonwalk gear in the airlock before anything goes into Horizon Base.
// SOURCED: NASA's Electrodynamic Dust Shield (EDS) on Firefly's Blue Ghost lander (March 2025) lifted
// lunar dust off glass and thermal-radiator surfaces using electric fields (nasa-blue-ghost-eds-2025).
// AUTHORED (game tuning): every dust amount, tool effect, minute, power cost and filter size below.
export const lunarDustScenario = {
  id: 'horizon-dust-v2', version: 2, sourceId: 'nasa-blue-ghost-eds-2025',
  items: {
    suit: {name: 'space suit', dust: 100, eds: 0},       // too big and floppy for the plate
    helmet: {name: 'helmet', dust: 60, eds: .95, visor: true}, // smooth glass visor: the EDS works best here
    bag: {name: 'tool bag', dust: 50, eds: .4},          // fabric: the plate helps a little
    boots: {name: 'boots', dust: 90, eds: .6},           // bumpy soles
  },
  tools: {
    brush: {minutes: 2, power: 0, remove: .8, airborne: .6},
    vacuum: {minutes: 7, power: 4, remove: .85, airborne: .05, toFilter: .2},
    eds: {minutes: 4, power: 5, airborne: .1},
  },
  pressurize: {minutes: 5, power: 8}, scrub: {minutes: 5, power: 5}, swapFilter: {minutes: 3}, hatchMinutes: 1,
  powerUnits: 50, filterCap: 100, spareFilters: 1,
  cleanEnough: 15, airSafe: 10, leak: {air: .6, gear: .3},
  ratings: {okBaseDust: 30},
  holdSeconds: {wheel: 1.6, brush: 1.1, vacuum: 2, filter: 1.3},
  limitation: 'NASA’s EDS test cleaned glass and radiator surfaces on a lander. The airlock, the dust amounts, how much each tool removes, the minutes, the power units and the filter size are made up for the game. Real lunar dust also sticks because of static electricity, which this game keeps simple.',
};
