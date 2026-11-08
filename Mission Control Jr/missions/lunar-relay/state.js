import {lunarRelayScenario} from './scenario.js';
import {SAVE_SCHEMA} from '../shared/schema.js';

export function createMission({scenario = lunarRelayScenario, seed = 42} = {}) {
  return {
    missionId: 'lunar-relay', schema: SAVE_SCHEMA, scenario: structuredClone(scenario), seed,
    phase: 'brief', plan: null, minutes: 0, simSeconds: 0, battery: scenario.batteryStart, at: 'base',
    hand: null, relay: 'crate', relayAt: null, legs: false, stages: 0, aimed: false,
    drill: 'rover', drillAt: null, coreReady: false, cores: 0, stowed: 0, messages: [],
    earthAsked: false, quietMinutes: 0, rescued: false, finished: false,
    decisions: [], notice: '', stoppedEarly: false,
  };
}
