// Save, retry, replay-comparison and campaign hooks shared by the expansion missions.
import {saveActiveAttempt, loadActiveAttempt, clearActiveAttempt} from '../../simulation/mission-storage.js';
import {serializeSnapshot, restoreSnapshot} from '../../simulation/replay.js';
import {completeChapter} from '../../campaign-bridge.js';

const HISTORY_PREFIX = 'mission-control-jr.attempts.v1.';
const storage = () => { try { return globalThis.localStorage; } catch { return null; } };


import {SAVE_SCHEMA} from './schema.js';
export {SAVE_SCHEMA};

/**
 * Load an active attempt. A mission may declare its own schema and a migrate(oldState) function that
 * turns an older save into a valid new one (or returns null when nothing in it is still valid).
 */
export function loadSaved(id, store = storage(), {schema = SAVE_SCHEMA, migrate = null} = {}) {
  const raw = loadActiveAttempt(id, store ?? undefined);
  if (!raw) return {state: null, discarded: false};
  try {
    const state = restoreSnapshot(raw);
    if (state.schema === schema && state.missionId === id) return {state, discarded: false};
    const moved = migrate?.(state);
    if (moved && moved.schema === schema && moved.missionId === id) return {state: moved, discarded: false, migrated: true};
  } catch {}
  clearActiveAttempt(id, store ?? undefined);
  return {state: null, discarded: true};
}

export function makeSaver(id, {sampleMode = false, store} = {}) {
  let last = 0;
  return function persist(state, force = false) {
    if (sampleMode || !state || state.phase === 'brief') return true;
    if (state.phase === 'debrief') { clearActiveAttempt(id, store); return true; }
    if (!force && Date.now() - last < 2500) return true;
    last = Date.now();
    return saveActiveAttempt(id, serializeSnapshot(state), store);
  };
}
export const clearSaved = (id, store) => clearActiveAttempt(id, store);
export const snapshot = state => serializeSnapshot(state);
export const restore = json => restoreSnapshot(json);

/** Remember the last few finished attempts so the debrief can compare plans across sessions. */
export function readHistory(id, store = storage()) {
  try { const list = JSON.parse(store?.getItem(HISTORY_PREFIX + id) || '[]'); return Array.isArray(list) ? list.filter(x => x && typeof x === 'object').slice(-5) : []; } catch { return []; }
}
export function pushHistory(id, summary, store = storage()) {
  const list = [...readHistory(id, store), {...summary, at: Date.now()}].slice(-5);
  try { store?.setItem(HISTORY_PREFIX + id, JSON.stringify(list)); } catch {}
  return list;
}

/** Report to the campaign shell once per finished attempt. */
export function reporter(id) {
  let sent = false;
  return {
    send(result) {
      if (sent) return; sent = true;
      completeChapter(id, {outcome: result.outcome, attemptCompleted: result.completed, success: result.success, mastered: result.mastered, score: result.score, carry: {version: 2, ...result.carry}});
    },
    reset() { sent = false; },
  };
}
