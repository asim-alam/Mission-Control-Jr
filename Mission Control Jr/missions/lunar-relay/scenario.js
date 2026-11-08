// "Over the Hill" — drive a rover over Long Ridge to drill a core in Shadow Hollow and get the data home.
// SOURCED: the Earth–Moon one-way light time on 2026-11-14 from JPL Horizons (horizons-moon-earth-2026-11-14);
//          radio on the Moon travels in straight lines, so hills block it (nasa-lunar-propagation).
// AUTHORED (game tuning): the map, every battery %, minute, mast height and antenna height below.
import inputs from '../../data/normalized.json' with {type: 'json'};
import {SITE} from '../shared/moon-ground.js';

export const lunarRelayScenario = {
  id: 'over-the-hill-v2', version: 2, sourceIds: ['horizons-moon-earth-2026-11-14', 'nasa-lunar-propagation'],
  oneWaySeconds: +(inputs.moonLightTime.oneWayMinutes * 60).toFixed(2), geometryDate: inputs.moonLightTime.date,
  baseAntenna: {x: -3.2, z: 0, h: 6},           // dish on the habitat roof
  roverAntennaH: 2.3,
  stops: {
    base: {name: 'Horizon Base', park: {x: -4, z: -6.5}},
    saddle: {name: 'Ridge top', park: {x: 11, z: -41}, relaySpot: {x: SITE.relay.saddle.x, z: SITE.relay.saddle.z}},
    hollow: {name: 'Shadow Hollow', park: {x: 13.5, z: -76}, relaySpot: {x: 16.5, z: -73.5}},
  },
  drillSpots: {a: {x: 16, z: -78.2}, b: {x: 17.8, z: -79.2}},
  // Battery % and suit minutes for each drive (uphill costs more).
  legs: {'base>saddle': {battery: 18, minutes: 6}, 'saddle>base': {battery: 12, minutes: 6}, 'saddle>hollow': {battery: 10, minutes: 5}, 'hollow>saddle': {battery: 15, minutes: 5}},
  batteryStart: 85, batteryReserve: 10, suitMinutes: 90, lowSuitMinutes: 15,
  relay: {baseM: 1.2, stageM: 1.8, stages: 3},
  minutes: {placeRelay: 2, legs: 1, stage: 2, aim: 2, takeDrill: 1, placeDrill: 1, drill: 8, stow: 1, send: 1, rescue: 15},
  drillBattery: 8,
  holdSeconds: {legs: 1.2, stage: 1.5, aim: 1.4, drill: 2.4},
  limitation: 'The ridge, the hollow and every distance, battery %, minute and mast height are made up for the game. Radio line of sight is checked against the game’s own hills, which is a simple picture of real radio, not a full link budget. The Earth–Moon light time is real.',
};
