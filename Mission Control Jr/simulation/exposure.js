// Educational points, not a clinical dose. Shielding always leaves a nonzero fraction.
export function accumulateExposure(current, hazardPerSecond, protectionFactor, seconds) {
  if (![current,hazardPerSecond,protectionFactor,seconds].every(Number.isFinite) || current < 0 || hazardPerSecond < 0 || protectionFactor <= 0 || protectionFactor > 1 || seconds < 0) throw new RangeError('Invalid exposure');
  return current + hazardPerSecond * protectionFactor * seconds;
}
