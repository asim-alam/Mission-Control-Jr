export function seededRandom(seed) {
  let value = seed >>> 0;
  return () => { value = (Math.imul(1664525, value) + 1013904223) >>> 0; return value / 4294967296; };
}
export function serializeSnapshot(state) { return JSON.stringify({version:1, state}); }
export function restoreSnapshot(json) {
  const value = JSON.parse(json);
  if (value?.version !== 1 || !value.state || typeof value.state !== 'object' || !Number.isFinite(value.state.simSeconds)) throw new TypeError('Invalid mission snapshot');
  return value.state;
}
