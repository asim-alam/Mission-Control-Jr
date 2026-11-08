import {createMission as createShelter} from '../missions/solar-shelter/state.js';
import {applyAction as actShelter} from '../missions/solar-shelter/actions.js';
import {createMission as createGreenhouse} from '../missions/greenhouse/state.js';
import {applyAction as actGreenhouse} from '../missions/greenhouse/actions.js';
import {createMission as createDelay} from '../missions/earth-delay/state.js';
import {applyAction as actDelay} from '../missions/earth-delay/actions.js';
import {createMission as createSunlight} from '../missions/lunar-sunlight/state.js';
import {applyAction as actSunlight} from '../missions/lunar-sunlight/actions.js';
/** Fixed scenario entry states; they never grant campaign completion. */
export function samplerSnapshot(id){
 const definitions={
  'solar-shelter':[createShelter,actShelter,[{id:'inspectMonitor'},{id:'begin'}]],
  greenhouse:[createGreenhouse,actGreenhouse,[{id:'begin'},{id:'setPolicy',payload:['a','b']},{id:'advancePeriod'}]],
  'earth-delay':[createDelay,actDelay,[{id:'begin'},{id:'inspectFault'},{id:'sendEarthRequest'}]],
  'lunar-sunlight':[createSunlight,actSunlight,[{id:'begin'},{id:'inspectPower'},{id:'compareSites'}]]
 };
 const def=definitions[id];if(!def)return null;const [create,act,actions]=def,m=create({seed:42});for(const action of actions){const result=act(m,action);if(!result.ok)throw new Error(`Sampler ${id}: ${result.message}`);}return m;
}
