import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateBytes} from 'gltf-validator';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const assets={'lunar-habitat':['airlock_anchor','power_port','comms_port'],'polar-solar-mast':['azimuth_pivot','panel_hinge','base_anchor','cable_port'],'battery-cart':['wheel_l','wheel_r','handle','power_port'],'cable-reel':['reel_axis','connector'],'lunar-terrain-patch':['safe_path','ridge_crest'],'dust-control-rack':['test_panel','electrode_grid','cleaning_tool','dust_surface','rack_cover'],'boot-tray':['boot_zone_l','boot_zone_r','tool_zone'],'filter-cassette':['grip','slot','latch'],'lunar-airlock':['outer_door','inner_door','clean_zone','dirty_zone'],'lunar-relay-mast':['mast_pivot','antenna_pivot','battery_port','ground_anchor'],'field-probe':['sensor_head','tripod','sample_target']};
for(const [name,nodes] of Object.entries(assets))test(`${name} is self-contained and retains its interaction anchors`,async()=>{
 const bytes=await readFile(new URL(`../assets/models/lunar/${name}.glb`,import.meta.url));const result=await validateBytes(new Uint8Array(bytes));assert.equal(result.issues.numErrors,0);assert.equal(result.issues.numWarnings,0);
 const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());assert.ok(json.buffers.every(buffer=>!buffer.uri));
 const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');for(const node of nodes)assert.ok(gltf.scene.getObjectByName(node),node);
});
