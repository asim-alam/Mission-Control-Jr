import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateBytes} from 'gltf-validator';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {DEMO_ASSETS} from '../demo-assets.js';
const requiredNodes={solar:['panel_hinge'],airlock:['door_left','door_right'],rover:['sensor_head',...Array.from({length:6},(_,i)=>`wheel_${i}`)]};
for(const [name,url] of Object.entries(DEMO_ASSETS)){
  test(`mission ${name} GLB validates and retains its interactive parts`,async()=>{
    const bytes=await readFile(url),report=await validateBytes(new Uint8Array(bytes),{maxIssues:30});
    assert.equal(report.issues.numErrors,0,JSON.stringify(report.issues.messages));
    const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
    const bounds=new THREE.Box3().setFromObject(gltf.scene);
    assert.ok(bounds.getSize(new THREE.Vector3()).toArray().every(v=>Number.isFinite(v)&&v>0));
    for(const node of requiredNodes[name]||[])assert.ok(gltf.scene.getObjectByName(node),node);
    if(name==='crew'){
      assert.deepEqual(gltf.animations.map(a=>a.name).sort(),['Idle','Repair','Walk']);
      const arm=gltf.scene.getObjectByName('arm_left'),initial=arm.quaternion.clone();
      const mixer=new THREE.AnimationMixer(gltf.scene);mixer.clipAction(gltf.animations.find(a=>a.name==='Walk')).play();mixer.update(.25);
      assert.ok(arm.quaternion.angleTo(initial)>.01,'exported animation must actually move its named arm');
    }
    const json=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
    assert.ok(json.buffers.every(b=>!b.uri));assert.ok((json.images||[]).every(i=>!i.uri));
  });
}
test('every scripted voice line has a bundled OGG clip',async()=>{
  const lines=JSON.parse(await readFile(new URL('../dialogue-lines.json',import.meta.url),'utf8'));
  for(const id of Object.keys(lines)){
    const bytes=await readFile(new URL(`../assets/audio/${id}.ogg`,import.meta.url));
    assert.equal(bytes.subarray(0,4).toString(),'OggS');assert.ok(bytes.length>5000,id);
  }
});
