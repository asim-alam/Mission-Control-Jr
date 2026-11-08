import inputs from '../../data/normalized.json' with {type:'json'};
const patches=Object.fromEntries(inputs.lunarIllumination.patches.map(p=>[p.id,p]));
export const lunarSunScenario={id:'horizon-sun-v1',version:1,kind:'fictional local training with long-term LOLA reference analogs',sourceId:'lola-south-polar-illumination',durationSeconds:7200,initialEnergyWh:500,capacityWh:800,essentialW:200,scienceW:120,panelRatedW:450,cableAvailableM:50,
 pads:{near:{name:'Near pad',referencePatch:patches['nearby-patch'],routeLengthM:18,transportSeconds:480,cableSeconds:120,shadow:[2400,6000]},ridge:{name:'Ridge pad',referencePatch:patches['ridge-patch'],routeLengthM:42,transportSeconds:900,cableSeconds:240,shadow:[4200,5400]}},
 limitation:'LOLA values are long-term averages for separate 300 m example patches, not measurements of this fictional terrain or an hourly forecast. The short shadow schedule, panel-output mapping, loads and distances are authored.'};
