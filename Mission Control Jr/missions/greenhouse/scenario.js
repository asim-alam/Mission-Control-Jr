import inputs from '../../data/normalized.json' with {type: 'json'};

// "The Greenhouse Promise" — harvest already-established crops for Elena's birthday during a short, fictional Mars training window.
// SOURCED: the light schedule (NASA OSDR study OSD-269: 16 h light, 8 h dark, ISS Veggie lettuce),
// and the crops themselves (red romaine lettuce and mizuna grown in Veggie; chile peppers harvested on the ISS in 2021).
// AUTHORED (game tuning): growth per day, power use, water use, the leak and portions. Not measured Mars farming.
export const greenhouseScenario = {
  id: 'meridian-cultivation-v3', version: 3, sourceIds: ['osdr-osd-269', 'osd-269-veggie-fan-anomaly', 'nasa-life-support-baseline'],
  lightHours: inputs.lettuceReference.lightHours, darkHours: inputs.lettuceReference.darkHours, startSol: 32,
  // Study conditions from VEG-03A (ISS Veggie). These are learning references, not calculated Mars lamp settings.
  lightReference: {parUmolM2S: 200, redBlueGreen: [12, 3, 1], ledDistanceCm: [30.5, 31.75]},
  growDays: 2,                        // two nights of growing, then harvest day
  powerBudgetKWh: 2.2,                // solar power for grow lights each day
  batteryKWh: 1.2,                    // extra stored power you may borrow over the whole mission
  lightKWh: {off: 0, half: .55, full: 1},
  growth: {off: 0, half: .6, full: 1},
  plantUseL: {off: .4, half: .8, full: 1.2},
  moistureBand: [1, 3.2], startMoisture: 1.6, waterPerTurnL: 1, tankStartL: 18, babyHarvest: .8,
  leakDay: 2, leakLPerDay: 6, leakFlowFactor: .5,
  // Authored scenario fault and leaf-surface teaching values; not measurements from NASA.
  fanStatusReported: 'LOW', leafWetnessStart: .15, leafWetnessGainPerNight: .3,
  leafWetnessDryingPerNight: .22, leafWetnessCaution: .55, leafWetnessStressPerNight: .08,
  crops: {
    a: {crop: 'lettuce', name: 'Red lettuce', icon: '🥬', start: 1.4, ready: 3, portions: 4},
    b: {crop: 'mizuna', name: 'Mizuna greens', icon: '🌿', start: 1.2, ready: 3, portions: 3},
    c: {crop: 'pepper', name: 'Chile peppers', icon: '🌶️', start: 3.5, ready: 5, portions: 2},
  },
  saladGoal: 6,
  limitation: 'The 16:8 photoperiod and selected lettuce light conditions are ISS study references. Crop growth, power and water budgets, hose leak, fan fault response, leaf-surface moisture values, stress and portions are authored for this short Mars training game.',
};
