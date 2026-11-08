import {lunarSunScenario} from './scenario.js';
import {SAVE_SCHEMA} from '../shared/schema.js';

export function createMission({scenario = lunarSunScenario, seed = 42} = {}) {
  return {
    missionId: 'lunar-sunlight', schema: SAVE_SCHEMA, scenario: structuredClone(scenario), seed,
    phase: 'brief', plan: null, paused: false, simSeconds: 0,
    suitMinutes: scenario.suitMinutes, cart: 'base', hitched: false, legs: false, stages: 0, wings: false,
    plug: 'reel', tracker: false, savePlan: null, watch: null,
    batteryKWh: scenario.batteryStartKWh, events: [], decisions: [], notice: '', stoppedEarly: false, suitLow: false,
  };
}
