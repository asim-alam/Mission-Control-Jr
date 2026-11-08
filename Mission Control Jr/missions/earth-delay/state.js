import {delayScenario} from './scenario.js';
import {SAVE_SCHEMA} from '../shared/schema.js';

export const PARTS = ['pump', 'valve', 'filter'];
export function createMission({scenario = delayScenario, seed = 42, initialCarry = {}} = {}) {
  const variant = scenario.variants[Math.abs(seed | 0) % scenario.variants.length];
  const carryL = Number.isFinite(initialCarry.tankL) ? Math.max(0, Math.min(18, initialCarry.tankL)) : scenario.defaultCarryL;
  const health = {pump: 'ok', valve: 'ok', filter: 'clean'};
  health[variant.broken] = variant.broken === 'filter' ? 'clogged' : 'bad';
  if (variant.cause) health[variant.cause] = 'clogged';
  return {
    missionId: 'earth-delay', schema: SAVE_SCHEMA, scenario: structuredClone(scenario), seed, variant,
    phase: 'brief', plan: null, simSeconds: 0, paused: false,
    waterL: scenario.waterStartL + carryL, carryL, waterStartL: scenario.waterStartL + carryL, saveMode: false,
    power: true, panel: 'closed', health, findings: {pump: null, valve: null, filter: null},
    holding: null, spares: {...scenario.spares}, swaps: [], removed: [],
    message: {status: 'none', sentAt: null, arrivesAt: null, withData: false},
    testRuns: [], fixed: false, readAnswer: false, alarm: true,
    events: [], decisions: [], notice: '', stoppedEarly: false, lowWater: false,
  };
}
