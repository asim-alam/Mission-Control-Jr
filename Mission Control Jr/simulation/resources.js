/** Integrate prioritized electrical loads in watt-hours. Loads are served in order. */
export function servePower({energyWh, capacityWh, generationW = 0, loads}, seconds) {
  if (![energyWh, capacityWh, generationW, seconds].every(Number.isFinite) || capacityWh < 0 || seconds < 0 || generationW < 0 || energyWh < 0 || energyWh > capacityWh) throw new RangeError('Invalid power ledger');
  if (!Array.isArray(loads) || loads.some(l => !l.id || !Number.isFinite(l.watts) || l.watts < 0)) throw new RangeError('Invalid power load');
  // Work in energy, so the result remains correct if the battery empties inside a step.
  const hours = seconds / 3600;
  let available = energyWh + generationW * hours;
  const servedWh = {};
  for (const load of loads) {
    const demand = load.watts * hours;
    const served = Math.min(available, demand);
    servedWh[load.id] = (servedWh[load.id] || 0) + served;
    available -= served;
  }
  return {energyWh: Math.min(capacityWh, Math.max(0, available)), servedWh, spilledWh: Math.max(0, available - capacityWh)};
}

export function moveWater(locations, from, to, amountKg) {
  if (!Number.isFinite(amountKg) || amountKg <= 0 || from === to || !(from in locations) || !(to in locations) || locations[from] < amountKg) return false;
  locations[from] -= amountKg;
  locations[to] += amountKg;
  return true;
}
