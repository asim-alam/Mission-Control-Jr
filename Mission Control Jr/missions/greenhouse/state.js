import {greenhouseScenario} from './scenario.js';
export function createMission({scenario=greenhouseScenario,seed=42,initialCarry={}}={}){
 return {missionId:'greenhouse',scenario:structuredClone(scenario),seed,simSeconds:0,phase:'brief',paused:false,
  energyWh:scenario.initialEnergyWh,airReserveUnits:100,reservoirKg:scenario.initialWaterKg,waterDeliveredKg:0,packagedFoodPortions:12,freshSupplementPortions:0,
  trays:[{id:'a',progress:.76+(initialCarry.experimentPreserved?.02:0),stress:0,harvested:false,lightSeconds:0,waterKg:0},{id:'b',progress:.72+(initialCarry.experimentPreserved?.02:0),stress:0,harvested:false,lightSeconds:0,waterKg:0}],
  selectedTrays:[],fault:false,faultInspected:false,isolated:false,repaired:false,periodsCompleted:0,decisions:[],crewWorkSeconds:0,notice:'',initialCarry:structuredClone(initialCarry)};
}
