import inputs from '../../data/normalized.json' with {type: 'json'};

// "A Place to Hide" — build a radiation shelter before a solar particle storm reaches Mars.
// SOURCED: the archived GOES >10 MeV proton event (NASA DONKI, 10 May 2024), the idea that water,
// polyethylene and packed supplies are useful shielding, and that Mars itself blocks about half the sky.
// AUTHORED (game tuning): warning time, storm length, "dose points", slot weights and how much each
// material blocks. They are teaching values, not a medical dose model.
export const shelterScenario = {
  id: 'meridian-sol18-v2', version: 2, sourceId: 'donki-sep-2024-05-10-goes', event: inputs.sep,
  warningSeconds: 1200,     // simulated seconds between the alert and the particles arriving
  stormSeconds: 3600,       // simulated seconds of strong particle flux (shortened for play)
  prepTimeScale: 5,         // simulated seconds per real second while getting ready
  stormTimeScale: 45,       // simulated seconds per real second during the storm
  peakDoseRate: .04,        // dose points per simulated second at the storm peak, with no shielding
  backgroundDoseRate: .0004,
  habTransmission: .85,     // the habitat walls alone let most particles through
  slots: {back_1: 1, back_2: 1, left_1: 1, left_2: 1, right_1: 1, right_2: 1, roof_1: 2, roof_2: 2},
  materials: {
    water: {count: 6, transmission: .25, walkSpeed: .6, label: 'water wall', icon: '💧'},
    poly: {count: 2, transmission: .2, walkSpeed: .9, label: 'plastic shield', icon: '🧱', boltSeconds: 1.6},
    cargo: {count: 4, transmission: .45, walkSpeed: .85, label: 'supply bags', icon: '🎒'},
  },
  crewWalkSeconds: 90,      // simulated seconds for a crew member to walk to the shelter
  ratings: {great: 40, ok: 65},
  limitation: 'The GOES event was measured near Earth in May 2024. The warning time, storm length, shielding numbers and dose points in this game are made up for practice. They are not a real dose or a Mars forecast.',
};
