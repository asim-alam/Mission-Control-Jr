import {shelterScenario} from './scenario.js';
import {SAVE_SCHEMA} from '../shared/schema.js';

export const CREW = ['elena', 'amara', 'jin', 'luca'];
export const SLOT_IDS = Object.keys(shelterScenario.slots);

export function createMission({scenario = shelterScenario, seed = 42, initialCarry = {}} = {}) {
  const items = [];
  for (const [kind, spec] of Object.entries(scenario.materials)) for (let i = 1; i <= spec.count; i++) items.push({id: `${kind}-${i}`, kind, at: 'store'});
  return {
    missionId: 'solar-shelter', schema: SAVE_SCHEMA, scenario: structuredClone(scenario), seed,
    phase: 'brief', stage: 'warning', plan: null, simSeconds: 0, paused: false,
    items, held: null, slots: Object.fromEntries(Object.keys(scenario.slots).map(id => [id, null])),
    crew: Object.fromEntries(CREW.map(id => [id, {at: 'work', arriveAt: null, dose: 0}])),
    playerInShelter: false, playerDose: 0, trips: 0, removals: 0,
    atArrival: null, events: [], decisions: [], notice: '', carryNote: initialCarry.stormOutcome || null,
  };
}
