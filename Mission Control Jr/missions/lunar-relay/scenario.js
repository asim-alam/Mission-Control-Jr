import inputs from '../../data/normalized.json' with {type:'json'};
export const lunarRelayScenario={id:'horizon-ridge-v1',version:1,sourceIds:['horizons-moon-earth-2026-11-14','nasa-lunar-propagation'],oneWaySeconds:inputs.moonLightTime.oneWayMinutes*60,geometryDate:inputs.moonLightTime.date,
 initialRoverWh:360,roverCapacityWh:500,initialSuitUnits:100,idleW:25,driveW:180,probeW:80,relayW:18,relayAllocationWh:35,suitPerSecond:.02,secondsPerMeter:4,minimumReturnWh:20,minimumReturnSuit:10,
 positions:{base:0,near:30,saddle:60,far:100},ridgeZ:60,ridgeHeightM:8,terminalHeightM:2,relayHeightM:10,
 limitation:'A fictional two-dimensional ridge blocks direct local contact. The model is a line-of-sight teaching simplification, not a radio link budget. Center-to-center lunar light time approximates the surface link.'};
