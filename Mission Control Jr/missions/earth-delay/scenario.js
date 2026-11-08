import inputs from '../../data/normalized.json' with {type:'json'};
export const delayScenario={id:'meridian-sol35-v1',version:1,sourceId:'horizons-mars-earth-2026-11-14',
 oneWaySeconds:inputs.marsLightTime.oneWayMinutes*60,geometryDate:inputs.marsLightTime.date,processingSeconds:180,
 initialEnergyWh:120,capacityWh:200,essentialW:80,processorW:35,experimentW:40,initialAirReserve:100,cropStressPerUnservedSecond:.00004,cropStressReliefPerServedSecond:.000002,
 normalAirLossPerSecond:.09,conservedAirLossPerSecond:.025,unpoweredAirLossPerSecond:.09,
 limitation:'The archived center-to-center down-leg light time is used as an approximation for both legs. Earth processing, hardware, fault and costs are authored training assumptions.'};
