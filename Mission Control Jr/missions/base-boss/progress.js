import {facilities, quests, sites} from './region.js';
import {sunlightFraction} from '../../data/opportunity-2018.js';
import data from '../../data/normalized.json' with {type: 'json'};

export const lightTime = data.marsLightTime.oneWayMinutes;
// Compress the observed drop in Opportunity's array output into a 20-minute
// training forecast. Verdant's minimum light threshold is an authored rule.
const stormSpan = 20;
const growThreshold = .44;
let early = 0, late = stormSpan;
for (let i = 0; i < 20; i++) {
  const minute = (early + late) / 2;
  if (sunlightFraction(minute / stormSpan) >= growThreshold) early = minute;
  else late = minute;
}
const lightWindow = (early + late) / 2;

export const saveKey = 'mission-control-jr.base-boss-region.v1';
export function newExpedition() {
  return {
    x: sites.meridian.x, z: sites.meridian.z, heading: facilities.meridian.heading + Math.PI, minutes: 0,
    visited: ['meridian'], active: null, cargo: false,
    completed: {}, due: null, radioAt: null, harvestAt: null, debriefed: false, log: 'Reyes has a job for you at Meridian.',
  };
}

export function restore(storage) {
  try {
    const saved = JSON.parse(storage.getItem(saveKey));
    if (saved && [saved.x, saved.z, saved.heading, saved.minutes].every(Number.isFinite) &&
      Array.isArray(saved.visited) && saved.completed && (!saved.active || quests[saved.active])) {
      const expedition = {...saved};
      delete expedition.power;
      delete expedition.lastStop;
      return {...newExpedition(), ...expedition};
    }
  } catch {
    // Storage is optional on shared or restricted browsers.
  }
  return newExpedition();
}

export function save(state, storage) {
  try {
    storage.setItem(saveKey, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}

export function arrive(state, site) {
  if (!state.visited.includes(site)) state.visited.push(site);
}

export function questAction(state, id, site) {
  const job = quests[id];
  if (!job || state.completed[id]) return null;
  if (!state.active && job.from === site && (!job.requires ||
    (state.completed[job.requires] && state.minutes >= state.harvestAt))) return 'accept';
  if (state.active !== id) return null;
  if (!state.cargo && job.pickup === site) return 'pickup';
  if (state.cargo && job.to === site) return 'deliver';
  return null;
}

export function doQuest(state, id, site) {
  const action = questAction(state, id, site);
  const job = quests[id];
  if (action === 'accept') {
    state.active = id;
    state.log = `Job accepted. Collect the ${job.cargo.toLowerCase()} at ${sites[job.pickup].name}.`;
  }
  if (action === 'pickup') {
    state.cargo = true;
    state.log = `${job.cargo} secured. Deliver it to ${sites[job.to].name}.`;
    if (id === 'valve') state.due = state.minutes + lightWindow;
  }
  if (action === 'deliver') {
    let outcome = job.outcome;
    if (id === 'valve') {
      const onTime = state.minutes <= state.due;
      outcome = onTime
        ? 'Water is flowing again. You arrived before the lights paused, so the harvest is ready.'
        : 'Water is flowing again. Verdant paused its lights and used stored water. The harvest needs 6 more mission minutes.';
      state.harvestAt = state.minutes + (onTime ? 0 : 6);
    }
    state.completed[id] = outcome;
    state.active = null;
    state.cargo = false;
    state.due = null;
    state.log = outcome;
  }
  return action;
}

export function pingEarth(state) {
  if (!state.completed.relay || state.radioAt !== null) return false;
  state.radioAt = state.minutes + lightTime * 2;
  state.log = 'Test message sent. Check the reply after two legs of light travel.';
  return true;
}
