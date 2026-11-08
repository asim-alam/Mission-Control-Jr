export function advanceCrop(crop, {seconds, lightFraction, waterFraction, growthSeconds}) {
  if (![seconds,lightFraction,waterFraction,growthSeconds].every(Number.isFinite) || seconds < 0 || growthSeconds <= 0 || lightFraction < 0 || lightFraction > 1 || waterFraction < 0 || waterFraction > 1) throw new RangeError('Invalid crop conditions');
  if (crop.harvested) return crop;
  const support = Math.min(lightFraction, waterFraction);
  crop.progress = Math.min(1, crop.progress + seconds / growthSeconds * support);
  crop.stress = Math.min(1, Math.max(0, crop.stress + seconds / growthSeconds * (1 - support) * .25));
  return crop;
}
export function harvestCrop(crop) {
  if (crop.harvested || crop.progress < 1) return 0;
  crop.harvested = true;
  return crop.stress < .5 ? 2 : 1;
}
