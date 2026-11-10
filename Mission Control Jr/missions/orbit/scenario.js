// "Arrival at Mars" (v2) — fix the orbiter's radio on limited power, then plan the landing.
// OBSERVED (NASA): orbiters around Mars relay radio messages for landers and rovers; spacecraft in orbit
//   pass through Mars' shadow and run on batteries there; landers aim for a "landing ellipse", and
//   Perseverance used Terrain-Relative Navigation to steer away from hazards while landing in 2021.
// AUTHORED (game tuning, NOT measurements): every number below — power units, minutes, orbit length,
//   ellipse sizes, distances, the lander charge rate and the rock fields. They are teaching values.
export const arrivalScenario = {
  id: 'asteria-arrival-v2', version: 2,
  orbitMinutes: 120,               // one trip around Mars in the story
  shadow: {start: 55, end: 90},     // minutes of each orbit spent in Mars' shadow (no sunlight for the solar wings)
  firstPass: 100,                   // the orbiter passes over Meridian Base at this minute, then every orbit
  power: {sun: 10, shadow: 6},      // power units available in sunlight and in shadow
  loads: {
    life: {label: 'Life support', icon: '🫁', units: 3, locked: true},
    heat: {label: 'Heaters', icon: '🔥', units: 2},
    radio: {label: 'Radio', icon: '📻', units: 2},
    amp: {label: 'Amplifier', icon: '📶', units: 2},
    motor: {label: 'Antenna motor', icon: '🛰️', units: 1},
    charger: {label: 'Lander charger', icon: '🔌', units: 3},
    camera: {label: 'Science camera', icon: '📷', units: 1},
  },
  startOn: ['life', 'heat', 'radio', 'amp'],
  // Which load powers each part of the radio. You must switch that load off before you touch the part.
  parts: {
    feed: {label: 'antenna cable plug', load: 'motor', fix: 'Push the cable plug back in and twist it tight', clue: 'The cable plug wiggles. It is loose!'},
    amp: {label: 'amplifier', load: 'amp', fix: 'Swap in the spare amplifier', clue: 'It smells hot, and one of its fins is dark. It is burnt out!'},
    card: {label: 'controller card', load: 'radio', fix: 'Pull the controller card out and push it back in', clue: 'The card’s little light is blinking. It is stuck!'},
  },
  testNeeds: ['radio', 'amp', 'motor'],
  lander: {startCharge: 45, chargePerMinute: 1, hazardCamAt: 80},
  minutes: {test: 3, clip: 2, inspect: 4, fix: 6, wrongFix: 4, swapAmp: 8, reset: 2, take: 1, site: 2, wait: 10, board: 5},
  // Landing sites. ellipseKm = size of the landing ellipse with no radio beacon. safe = how much of the ellipse
  // (0..1 from the centre) is smooth ground; outside it there are rocks (or dunes).
  sites: {
    pad: {label: 'Meridian Pad', icon: '🏠', km: .3, safe: .28, ground: 'big rocks around the flat pad', text: 'Right next to the base. The flat pad is small, with big rocks all around it.'},
    ridge: {label: 'Dune Ridge', icon: '⛰️', km: 2.5, safe: .5, ground: 'sand dunes and slopes', text: 'A short drive away. Smooth in the middle, sandy slopes at the edges.'},
    plains: {label: 'Wide Plains', icon: '🟫', km: 9, safe: 1, ground: 'flat ground everywhere', text: 'Flat and smooth almost everywhere, but a long rover drive from the base.'},
  },
  ellipseKm: 6,
  beaconShrink: .45,               // the base radio beacon makes the ellipse this much smaller
  limitation: 'Orbiters really do relay radio for Mars landers, pass through Mars’ shadow and use landing ellipses, and Perseverance really steered around hazards while landing. Everything else here — the orbiter, the power units, the minutes, the sites, the ellipse sizes and the rocks — is made up for practice.',
};
