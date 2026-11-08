/** Advance in bounded intervals, visiting scheduled boundaries in stable order. */
export function advanceClock(state, seconds, integrate, onEvent = () => {}) {
  if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Invalid duration');
  if (state.paused) return;
  const end = state.simSeconds + seconds;
  while (state.simSeconds < end) {
    const due = (state.events || []).filter(e => !e.processed && e.at <= state.simSeconds).sort((a,b) => a.at-b.at || String(a.id).localeCompare(String(b.id)));
    for (const event of due) { event.processed = true; onEvent(event, state); }
    const next = Math.min(end, state.simSeconds + 1, ...(state.events || []).filter(e => !e.processed && e.at > state.simSeconds).map(e => e.at));
    const keepGoing = integrate(state, next - state.simSeconds);
    state.simSeconds = next;
    if (keepGoing === false) break;
  }
  for (const event of (state.events || []).filter(e => !e.processed && e.at <= state.simSeconds).sort((a,b) => a.at-b.at || String(a.id).localeCompare(String(b.id)))) { event.processed = true; onEvent(event, state); }
}
