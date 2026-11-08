import {lunarDustScenario} from './scenario.js';
export function createMission({scenario=lunarDustScenario,seed=42,initialCarry={}}={}){
 const valid=initialCarry.version===1&&['near','ridge','storage'].includes(initialCarry.collectorLocation)&&Number.isFinite(initialCarry.energyWh);
 const carried=valid?Math.max(0,Math.min(scenario.capacityWh,initialCarry.energyWh)):scenario.initialEnergyWh;
 const energy=Math.max(scenario.minimumRecoveryWh,carried);
 return {missionId:'lunar-dust',scenario:structuredClone(scenario),seed,phase:'brief',paused:false,simSeconds:0,events:[],energyWh:energy,recoveryChargeWh:energy-carried,airReserveUnits:scenario.initialAirReserve,
  items:[{id:'panel',dust:100,location:'dirty'},{id:'boots',dust:100,location:'dirty'},{id:'tool',dust:80,location:'dirty'}],rackClosed:false,rackPoweredSeconds:0,treatment:null,filterRemaining:30,spareFilters:1,filterInspected:false,
  outerDoor:'open',innerDoor:'closed',cycleComplete:false,boundaryVerified:false,deconCycles:0,decisions:[],notice:''};
}
