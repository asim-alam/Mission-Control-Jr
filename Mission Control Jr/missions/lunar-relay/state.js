import {lunarRelayScenario} from './scenario.js';
export function createMission({scenario=lunarRelayScenario,seed=42,initialCarry={}}={}){
 const valid=initialCarry.version===1&&Number.isFinite(initialCarry.energyWh)&&Number.isFinite(initialCarry.airReserveUnits);
 const roverEnergyWh=valid?Math.max(0,Math.min(scenario.roverCapacityWh,initialCarry.energyWh)):scenario.initialRoverWh;
 const suitReserveUnits=valid?Math.max(0,Math.min(100,initialCarry.airReserveUnits)):scenario.initialSuitUnits;
 return {missionId:'lunar-relay',scenario:structuredClone(scenario),seed,phase:'brief',paused:false,simSeconds:0,events:[],position:'base',positionZ:scenario.positions.base,routePlan:null,routeInspected:false,
  roverEnergyWh,suitReserveUnits,carryUsed:valid,relayLoaded:false,relayLocation:'base',relayDeployed:false,relayPowered:false,relayEnergyWh:0,verifiedHops:{base:false,field:false},probeProgressSeconds:0,observations:0,extraObservation:false,message:null,shortened:false,returned:false,decisions:[],notice:'',initialCarry:structuredClone(initialCarry)};
}
