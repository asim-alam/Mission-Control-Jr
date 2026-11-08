import {lunarSunScenario} from './scenario.js';
export function createMission({scenario=lunarSunScenario,seed=42}={}){
 return {missionId:'lunar-sunlight',scenario:structuredClone(scenario),seed,simSeconds:0,paused:false,phase:'brief',events:Object.entries(scenario.pads).flatMap(([id,pad])=>pad.shadow.map((at,i)=>({id:`${id}-shadow-${i}`,at}))),energyWh:scenario.initialEnergyWh,airReserveUnits:100,collectorLocation:'storage',selectedPad:null,cartAttached:false,cartLocation:'storage',deployed:false,cableLengthUsed:0,cableRouted:false,connected:false,scienceOn:false,scienceServedWh:0,essentialUnservedWh:0,generatedWh:0,crewWorkSeconds:0,powerInspected:false,sitesCompared:false,decisions:[],notice:''};
}
