import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateBytes} from 'gltf-validator';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const assets={
 'shelter-frame':['slot_left','slot_right','slot_roof','crew_anchor_1','crew_anchor_2','crew_anchor_3','crew_anchor_4'],
 'water-bag-module':['grip','hose_port'],
 'exposure-monitor':['screen','indicator'],
 'experiment-rack':['service_port','status_screen'],
 'greenhouse-rack':['tray_a','tray_b','led_panel','valve_a','valve_b'],
 'irrigation-manifold':['isolation_valve','pump','return_line'],
 'pump-service-module':['power_disconnect','cover_hinge','pump_cartridge','latch'],
 'air-reserve-cylinder':['valve','connector']
};
for(const [name,nodes] of Object.entries(assets))test(`${name} is a valid self-contained model with interaction nodes`,async()=>{
 const bytes=await readFile(new URL(`../assets/models/survival/${name}.glb`,import.meta.url));
 const report=await validateBytes(new Uint8Array(bytes));assert.equal(report.issues.numErrors,0);assert.equal(report.issues.numWarnings,0);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());assert.ok(json.buffers.every(b=>!b.uri));
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 for(const node of nodes)assert.ok(gltf.scene.getObjectByName(node),node);
 if(name==='greenhouse-rack')for(const tray of ['tray_a','tray_b'])for(const stage of ['growth_seedling','growth_mature','growth_harvested'])assert.ok(gltf.scene.getObjectByName(tray).getObjectByName(`${stage}_${tray.slice(-1)}`),`${tray}/${stage}`);
});
