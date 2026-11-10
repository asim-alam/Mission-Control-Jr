// Separate from both legacy orbit saves and the redesigned cabin attempt.
// Docking numbers are authored training values, not spacecraft flight telemetry.
export const APPROACH_SAVE = 'mission-control-jr.arrival-approach.v1';

export function readApproach(storage = globalThis.localStorage) {
  try {
    const s = JSON.parse(storage.getItem(APPROACH_SAVE));
    if (s?.version !== 1) return null;
    if (s.phase === 'docked') return s;
    const d = s.dock;
    if (!['overview', 'docking'].includes(s.phase) || !d ||
      !['x', 'y', 'distance', 'speed', 'bumps'].every(k => Number.isFinite(d[k])) ||
      Math.abs(d.x) > 6 || Math.abs(d.y) > 4 || d.distance < 1.4 || d.distance > 65 || Math.abs(d.speed) > 2) return null;
    return s;
  } catch { return null; }
}

export function saveApproach(state, storage = globalThis.localStorage) {
  try {
    storage.setItem(APPROACH_SAVE, JSON.stringify({version: 1, phase: state.phase,
      dock: state.dock, guided: !!state.guided, elapsed: state.elapsed || 0}));
    return true;
  } catch { return false; }
}

export function clearApproach(storage = globalThis.localStorage) {
  try { storage.removeItem(APPROACH_SAVE); } catch {}
}

export function enterCabin({saved, approach, sampler = false, justDocked = false}) {
  return sampler || justDocked || saved?.phase === 'active' || saved?.phase === 'debrief' || approach?.phase === 'docked';
}
