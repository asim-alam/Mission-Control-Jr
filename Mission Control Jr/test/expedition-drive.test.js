import test from 'node:test';
import assert from 'node:assert/strict';
import {HOME,RIDGE,HAZARD,ROUTES,distance,surfaceAt} from '../expedition-terrain.js';
import {stepRover} from '../rover-controller.js';
import {createExpedition,act2,advance2,reportStations,inspectionPoint,SERVICE} from '../mission2.js';
import {readiness} from './expedition-fixtures.js';
const dt=1/60;
function driveTo(m,target){let frames=0;while(distance(m.vehicle,target)>5&&frames++<60*180&&!m.ended){const h=Math.atan2(-(target.z-m.vehicle.z),target.x-m.vehicle.x),delta=Math.atan2(Math.sin(h-m.vehicle.heading),Math.cos(h-m.vehicle.heading));const telemetry=stepRover(m.vehicle,{throttle:1,steer:Math.max(-1,Math.min(1,delta*3)),eco:false},dt);advance2(m,dt,telemetry);}assert.ok(frames<60*180,`could not reach ${JSON.stringify(target)} from ${JSON.stringify(m.vehicle)}`);assert.equal(m.ended,false);}
function stop(m){for(let i=0;i<120;i++){const t=stepRover(m.vehicle,{brake:true},dt);advance2(m,dt,t);}m.vehicle.parking=true;}
for(const route of ['wash','direct','rim'])test(`a full physics-driven ${route} expedition completes both reports, science, return and terminal checks`,()=>{
  const m=readiness();act2(m,'board');m.vehicle.parking=false;driveTo(m,{x:12,z:-2});stop(m);assert.ok(act2(m,'brakeTest').ok);assert.ok(act2(m,'plan').ok);assert.ok(act2(m,'launch',{route,reason:'evidence'}).ok);m.vehicle.parking=false;
  const stations=reportStations(m),points=ROUTES[route].points;
  for(const p of points.slice(1,points.indexOf(stations[1])+1)){driveTo(m,p);if(stations.includes(p)){stop(m);assert.ok(act2(m,'report').ok);m.vehicle.parking=false;}}
  if(route==='wash')driveTo(m,{x:-15,z:-116});driveTo(m,inspectionPoint(m));stop(m);assert.ok(act2(m,'hazard').ok);assert.ok(act2(m,'terrainDecision','perimeter').ok);m.vehicle.parking=false;
  if(route==='rim')driveTo(m,{x:72,z:-144});else if(route==='direct'){driveTo(m,{x:7,z:-112});driveTo(m,{x:7,z:-134});}driveTo(m,{x:40,z:-150});
  stop(m);assert.ok(distance(m.vehicle,RIDGE)<23);assert.equal(surfaceAt(m.vehicle.x,m.vehicle.z),'firm');assert.ok(act2(m,'science').ok);assert.ok(act2(m,'exit').ok);act2(m,'photo','context');act2(m,'photo','close');act2(m,'describe','evidence');assert.ok(act2(m,'return').ok);assert.ok(act2(m,'board').ok);m.vehicle.parking=false;
  // Reorient on the firm destination apron before taking the surveyed return.
  for(const p of [...ROUTES.wash.points].reverse().slice(1))driveTo(m,p);stop(m);assert.ok(distance(m.vehicle,HOME)<13);assert.ok(act2(m,'dock').ok);assert.equal(m.ended,false);act2(m,'exit');m.walker={...SERVICE.comms};assert.ok(act2(m,'transfer').ok);assert.ok(act2(m,'crew').ok);assert.equal(m.outcome,'success');assert.ok(m.battery>=20);assert.ok(m.oxygen>=20);assert.equal(m.collisions,0);assert.equal(m.slipSeconds,0);
});
