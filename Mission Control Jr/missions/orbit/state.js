import {arrivalScenario} from './scenario.js';

export const ORBIT_SCHEMA = 3;
export const LEGACY_ORBIT_SAVE = 'mission-control-jr.orbit.v1';
export const FAULTS = ['feed', 'amp', 'card'];
export const LOADS = ['life', 'heat', 'radio', 'amp', 'motor', 'charger', 'camera'];

export function createMission({scenario = arrivalScenario, seed = Math.floor(Math.random() * 1e6), initialCarry = {}} = {}) {
  void initialCarry;
  return {
    missionId: 'orbit', schema: ORBIT_SCHEMA, scenario: structuredClone(scenario), seed,
    phase: 'brief', stage: 'orbit', minute: 0, simSeconds: 0,
    loads: Object.fromEntries(LOADS.map(l => [l, scenario.startOn.includes(l)])), tripped: false, trips: 0,
    fault: FAULTS[seed % FAULTS.length], fixed: false, comms: false, triedFixes: [], inspected: [], tests: 0,
    tester: 'case', spareAmp: 'case', holding: null, zaps: 0,
    charge: scenario.lander.startCharge, coldMinutes: 0, missedPasses: 0,
    site: null, sitesViewed: false, boarded: false, landing: null,
    events: [], decisions: [], notice: '',
  };
}

/** The old orbit chapter kept its own save. A finished one still counts on the journey map (journey.js);
 *  an unfinished one cannot be resumed in the new mission, so the player starts fresh with a note. */
export function readLegacyOrbit(storage = globalThis.localStorage) {
  try { const raw = storage?.getItem(LEGACY_ORBIT_SAVE); if (!raw) return null; const v = JSON.parse(raw); return v && typeof v === 'object' ? v : null; } catch { return null; }
}
