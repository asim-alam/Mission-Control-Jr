import {greenhouseScenario} from './scenario.js';
import {SAVE_SCHEMA} from '../shared/schema.js';

export const BEDS = ['a', 'b', 'c'];
export const GREENHOUSE_SAVE_SCHEMA = SAVE_SCHEMA + 1;

/** Add airflow and harvest-check fields when resuming an older greenhouse save. */
export function migrateGreenhouseState(old) {
  if (!old || old.missionId !== 'greenhouse' || !old.beds || !old.scenario) return null;
  const scenario = {...structuredClone(greenhouseScenario), ...old.scenario};
  return {...old, schema: GREENHOUSE_SAVE_SCHEMA, scenario,
    airflowChecked: false, fanRunning: false, fanStatusReported: scenario.fanStatusReported || 'LOW',
    leafWetness: scenario.leafWetnessStart ?? greenhouseScenario.leafWetnessStart, harvestChecked: false};
}
export function createMission({scenario = greenhouseScenario, seed = 42, initialCarry = {}} = {}) {
  const rested = initialCarry.rating === 'great';
  return {
    missionId: 'greenhouse', schema: GREENHOUSE_SAVE_SCHEMA, scenario: structuredClone(scenario), seed,
    phase: 'brief', stage: 'grow', day: 1, plan: null, simSeconds: 0, paused: false,
    beds: Object.fromEntries(BEDS.map(id => [id, {light: 'off', moisture: scenario.startMoisture, progress: scenario.crops[id].start, stress: 0, harvested: false, wateredToday: 0}])),
    tankL: scenario.tankStartL, batteryKWh: scenario.batteryKWh, powerUsedKWh: 0, waterUsedL: 0, leakedL: 0,
    leak: 'none',            // none → leaking → isolated → hose-off → hose-fitted → fixed
    isolationOpen: true, holding: null, basket: 'table', basketContents: [], served: false,
    airflowChecked: false, fanRunning: false, fanStatusReported: scenario.fanStatusReported || 'LOW',
    leafWetness: scenario.leafWetnessStart, harvestChecked: false,
    history: [], events: [], decisions: [], notice: '', crewRested: rested,
  };
}
