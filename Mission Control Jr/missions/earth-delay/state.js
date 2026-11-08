import {delayScenario} from './scenario.js';
export function createMission({scenario=delayScenario,seed=42,initialCarry={}}={}){
 const carriedTrays=initialCarry.version===1&&Array.isArray(initialCarry.trays)?initialCarry.trays.filter(t=>t&&['a','b'].includes(t.id)&&typeof t.harvested==='boolean'&&Number.isFinite(t.stress)).slice(0,2):[];
 const crops=carriedTrays.length?carriedTrays.map(t=>({id:t.id,harvested:t.harvested,stress:Math.max(0,Math.min(1,t.stress))})):[{id:'a',harvested:false,stress:0.1},{id:'b',harvested:false,stress:0.1}];
 return {missionId:'earth-delay',scenario:structuredClone(scenario),seed,phase:'brief',paused:false,simSeconds:0,events:[],energyWh:scenario.initialEnergyWh,airReserveUnits:scenario.initialAirReserve,
  faultInspected:false,branchIsolated:false,coverOpen:false,cartridgeReplaced:false,coverLatched:true,processorRunning:false,verified:false,
  spareCartridges:1,reserveConnected:false,policy:'normal',experimentOn:true,experimentPoweredSeconds:0,message:null,replyApplied:false,restoredAt:null,
  crops,cropCarryUsed:carriedTrays.length>0,decisions:[],notice:'',initialCarry:structuredClone(initialCarry)};
}
