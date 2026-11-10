import {shelterScenario} from './scenario.js';

export const SHELTER_SCHEMA = 3;
export const CREW = ['elena', 'amara', 'jin', 'luca'];
export const PEOPLE = [...CREW, 'you'];
export const SEAT_IDS = Object.keys(shelterScenario.seats);
export const SURFACE_IDS = Object.keys(shelterScenario.surfaces);

export function createMission({scenario = shelterScenario, seed = 42, initialCarry = {}} = {}) {
  const items = [];
  for (let i = 1; i <= scenario.water.count; i++) items.push({id: `water-${i}`, kind: 'water', at: 'store'});
  for (let i = 1; i <= scenario.poly.count; i++) items.push({id: `poly-${i}`, kind: 'poly', at: 'store', fastened: false});
  for (let i = 1; i <= scenario.bags.count; i++) items.push({id: `bag-${i}`, kind: 'bag', at: 'store'});
  return {
    missionId: 'solar-shelter', schema: SHELTER_SCHEMA, scenario: structuredClone(scenario), seed,
    // phase: brief → active → debrief. stage (while active): prep → check → cover → event → after
    phase: 'brief', stage: 'prep', simSeconds: 0, minutes: 0, paused: false,
    items, held: null,
    rack: {at: null, built: false, latched: false},
    zones: Object.fromEntries(Object.keys(scenario.bags.zones).map(id => [id, {strapped: false}])),
    assist: null, assistDone: false,
    seats: structuredClone(scenario.startSeats),
    mapViewed: false, checkViewed: false, overlay: false,
    exposure: Object.fromEntries(PEOPLE.map(p => [p, 0])), rate: Object.fromEntries(PEOPLE.map(p => [p, 0])),
    inside: Object.fromEntries(PEOPLE.map(p => [p, false])),
    eventHours: 0, coverLeft: 0, outsideRate: 0, peakOutside: 0,
    slipped: [], ventFixedByCrew: false, onsetDuringPrep: false, atOnset: null,
    blueprint: [], buildLog: [], events: [], decisions: [], notice: '',
    carryNote: initialCarry.stormOutcome || null,
  };
}

/** Old (schema 2) saves used a different shelter. Keep what is still valid and start the new build. */
export function migrateSave(old, scenario = shelterScenario) {
  if (!old || old.missionId !== 'solar-shelter') return null;
  if (old.schema === SHELTER_SCHEMA) return old;
  if (old.schema !== 2) return null;
  if (old.phase !== 'active') return null; // briefs and debriefs have nothing to keep
  const m = createMission({scenario: old.scenario?.difficulty ? {...scenario, difficulty: old.scenario.difficulty} : scenario, initialCarry: {stormOutcome: old.carryNote}});
  m.phase = 'active'; m.stage = 'prep'; m.migratedFrom = 2;
  m.notice = 'The refuge was upgraded since your last visit, so the building starts fresh.';
  return m;
}
