/** New-mission rendering preference; inaccessible storage safely uses standard quality. */
export function graphicsQuality(storage) {
  try { return (storage ?? globalThis.localStorage)?.getItem('mission-control-jr.graphics') === 'low' ? 'low' : 'standard'; } catch { return 'standard'; }
}

/** Rendering budget for mission scenes; low effects reduces antialiasing, shadows, and pixel load. */
export function graphicsProfile(storage){
 const quality=graphicsQuality(storage),lowEffects=quality==='low';
 return Object.freeze({quality,lowEffects,pixelRatioCap:lowEffects ? 0.7 : 1.5});
}
