import {shelterScenario} from './scenario.js';
export function createMission({scenario=shelterScenario,seed=42,initialCarry={}}={}) {
  return {missionId:'solar-shelter',scenario:structuredClone(scenario),seed,simSeconds:0,paused:false,phase:'brief',
    events:[{id:'activity-start',at:scenario.hazardStart},{id:'supply-need',at:780},{id:'activity-end',at:scenario.hazardEnd}],
    energyWh:scenario.initialEnergyWh,airReserveUnits:100,waterConsumedKg:0,
    bags:[0,1,2].map(id=>({id,location:'storage',massKg:scenario.bagMassKg})),
    crew:Object.fromEntries(['elena','amara','jin','luca'].map(name=>[name,{location:'habitat',exposurePoints:0}])),
    experimentOn:false,experimentPoweredSeconds:initialCarry.experimentPreserved?60:0,decisions:[],notice:'',result:null};
}
