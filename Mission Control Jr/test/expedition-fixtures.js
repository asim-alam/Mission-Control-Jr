import assert from 'node:assert/strict';
import {SERVICE,reportStations,inspectionPoint,createExpedition,act2} from '../mission2.js';
import {RIDGE} from '../expedition-terrain.js';
export function readiness(m=createExpedition()){
  assert.ok(act2(m,'start').ok);assert.ok(act2(m,'acceptBrief').ok);
  m.walker={...SERVICE.spare};assert.ok(act2(m,'spare').ok);
  for(const key of ['battery','wheels','camera','comms']){m.walker={...SERVICE[key]};assert.ok(act2(m,'check',key).ok);if(!m.checks[key])assert.ok(act2(m,'check',key).ok);}
  return m;
}
// State-machine fixtures place actors deliberately. The integration test drives every metre.
export function prepared(){const m=readiness();assert.ok(act2(m,'board').ok);assert.ok(act2(m,'launch',{route:'wash'}).ok);return m;}
export function fieldArrival(m){for(const p of reportStations(m)){Object.assign(m.vehicle,p);assert.ok(act2(m,'report').ok);}Object.assign(m.vehicle,inspectionPoint(m));assert.ok(act2(m,'hazard').ok);assert.ok(act2(m,'terrainDecision','perimeter').ok);Object.assign(m.vehicle,RIDGE);return m;}
export function postdrive(m){assert.ok(act2(m,'dock').ok);assert.equal(m.ended,false);assert.ok(act2(m,'exit').ok);m.walker={...SERVICE.comms};assert.ok(act2(m,'transfer').ok);assert.ok(act2(m,'crew').ok);}
