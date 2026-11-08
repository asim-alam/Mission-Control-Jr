export function recordDecision(state, id, facts = {}) {
  state.decisions ||= [];
  state.decisions.push({id, at:state.simSeconds, facts:structuredClone(facts)});
  return state.decisions.at(-1);
}
