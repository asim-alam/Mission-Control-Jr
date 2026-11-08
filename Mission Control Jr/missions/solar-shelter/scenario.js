import inputs from '../../data/normalized.json' with {type:'json'};
export const shelterScenario = {
  id:'meridian-sol18-v1',version:1,kind:'authored hazard inspired by archived observation',
  sourceId:'donki-sep-2024-05-10-goes',event:inputs.sep,
  durationSeconds:1200,hazardStart:480,hazardEnd:1080,initialEnergyWh:140,capacityWh:400,
  essentialW:180,experimentW:240,experimentGoalSeconds:600,bagTransferSeconds:120,bagMassKg:5,
  backgroundPerSecond:.002,eventPerSecond:.03,protection:{habitat:.6,two:.35,three:.2},
  limitation:'The archived GOES event is historical context near Earth. The hazard timing, shielding factors, and exposure points are authored, not a Mars forecast or medical dose.'
};
