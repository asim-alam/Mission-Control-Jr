import inputs from '../../data/normalized.json' with {type: 'json'};

// "A Place to Hide" (v3) — reinforce a partly prepared refuge before a solar particle event.
// OBSERVED (NASA): solar energetic particles exist, are invisible and can be dangerous to crews;
//   water, polyethylene and packed supplies are hydrogen-rich and useful shielding; a planet blocks
//   the half of the sky below you; the 10 May 2024 SEP was recorded by GOES near EARTH (NASA DONKI).
// AUTHORED (game tuning, NOT measurements): every number below — work minutes, onset time, rate units,
//   how much each item reduces exposure, the "sky share" of each refuge surface. They are teaching values.
export const shelterScenario = {
  id: 'meridian-sol18-v3', version: 3, sourceId: 'donki-sep-2024-05-10-goes', event: inputs.sep,
  // The particle rise starts at this many work-minutes after the alert. The player is never shown this
  // exact number: forecasters only give a rough window (see forecastText).
  onsetMinute: 75,
  forecastText: 'Forecasters think particles may start rising in about an hour or two. Nobody knows the exact time.',
  eventHours: 10,                 // how long the event lasts in the story
  eventRealSeconds: 70,           // how long it takes to watch at normal speed
  coverMinutes: 4,                // story minutes for the crew to walk into the refuge
  // Illustrative exposure-rate units per hour. Not a real dose unit.
  backgroundRate: .004,
  peakOutsideRate: 2,
  habInteriorShare: .95,          // the habitat walls alone block a little
  // Surfaces of the refuge. "base" = how much gets through the bare wall (0..1).
  surfaces: {
    roof_l: {label: 'Roof (left)', base: .86}, roof_r: {label: 'Roof (right)', base: .86},
    back_l: {label: 'Back wall (left)', base: .84}, back_r: {label: 'Back wall (right)', base: .84},
    side_l: {label: 'Side wall', base: .84}, front: {label: 'Front and door', base: .8},
  },
  // Share of each seat's open sky that each surface covers (made-up geometry; each row adds up to 1).
  seats: {
    A: {label: 'Seat A', sky: {roof_l: .34, roof_r: .12, back_l: .22, back_r: .06, side_l: .18, front: .08}},
    B: {label: 'Seat B', sky: {roof_l: .30, roof_r: .18, back_l: .20, back_r: .10, side_l: .12, front: .10}},
    C: {label: 'Seat C', sky: {roof_l: .18, roof_r: .30, back_l: .10, back_r: .20, side_l: .08, front: .14}},
    D: {label: 'Seat D', sky: {roof_l: .12, roof_r: .34, back_l: .06, back_r: .22, side_l: .06, front: .20}},
    E: {label: 'Seat E', sky: {roof_l: .25, roof_r: .25, back_l: .08, back_r: .08, side_l: .10, front: .24}},
    F: {label: 'Door seat', sky: {roof_l: .14, roof_r: .28, back_l: .04, back_r: .10, side_l: .04, front: .40}},
  },
  startSeats: {elena: 'A', amara: 'B', jin: 'F', luca: 'D', you: 'E'},
  // Each item multiplies what gets through its surface by this factor.
  water: {count: 6, perContainer: .11, rackSpots: ['back_l', 'back_r', 'side_l'], minutes: {frame: 8, load: 5, loadTrolley: 3, latch: 3}},
  poly: {count: 4, factor: .65, rails: {roof_l: 2, roof_r: 2, back_l: 2, back_r: 2}, minutes: {slide: 4, fasten: 3}},
  bags: {count: 6, factor: .8, zones: {
    shelf_l: {surface: 'roof_l', cap: 3, label: 'left roof shelf', overhead: true},
    shelf_r: {surface: 'roof_r', cap: 3, label: 'right roof shelf', overhead: true},
    stack_side: {surface: 'side_l', cap: 3, label: 'side wall (by the vent)'},
    stack_back: {surface: 'back_r', cap: 3, label: 'back wall (right)'},
    stack_door: {surface: 'front', cap: 3, label: 'next to the door'},
  }, minutes: {place: 4, placeOverhead: 5, strap: 3}},
  moveMinutes: 2,
  ventBlockBags: 2,               // this many bags by the vent block the airflow (unless the duct is fitted)
  ratings: {great: .42, ok: .28},  // share of exposure avoided compared with waiting in the plain habitat
  limitation: 'The May 2024 particle event was measured by the GOES satellite near Earth, not at Mars. Everything else in this mission — the warning window, the refuge layout, the exposure units and how much each item blocks — is made up for practice. It is not a real dose or a forecast.',
};
