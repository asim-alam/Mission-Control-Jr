import {lunarDustScenario} from './scenario.js';
import {SAVE_SCHEMA} from '../shared/schema.js';

export const ITEMS = ['suit', 'helmet', 'bag', 'boots'];
export function createMission({scenario = lunarDustScenario, seed = 42} = {}) {
  return {
    missionId: 'lunar-dust', schema: SAVE_SCHEMA, scenario: structuredClone(scenario), seed,
    phase: 'brief', plan: null, minutes: 0, simSeconds: 0, power: scenario.powerUnits,
    outer: 'open', pressurized: false, hand: null, edsItem: null,
    items: Object.fromEntries(ITEMS.map(id => [id, {dust: scenario.items[id].dust, cleanedBy: []}])),
    scratched: false, airDust: 0, filterLoad: 0, spares: scenario.spareFilters, swaps: 0,
    baseDust: 0, leaks: 0, innerOpen: false, uses: {brush: 0, vacuum: 0, eds: 0, scrub: 0},
    decisions: [], notice: '', stoppedEarly: false,
  };
}
