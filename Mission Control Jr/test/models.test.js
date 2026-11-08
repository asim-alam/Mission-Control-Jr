import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateBytes } from 'gltf-validator';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MODEL_ASSETS, buildOutpost } from '../outpost.js';

for (const asset of MODEL_ASSETS) {
  test(`${asset.name}.glb is valid, self-contained and loadable`, async () => {
    const bytes = await readFile(asset.url);
    const report = await validateBytes(new Uint8Array(bytes), { uri: asset.name+'.glb', maxIssues: 20 });
    assert.equal(report.issues.numErrors, 0, JSON.stringify(report.issues.messages));
    const json = JSON.parse(bytes.subarray(20, 20+bytes.readUInt32LE(12)).toString());
    assert.ok(json.buffers.every(buffer => !buffer.uri), 'geometry must be embedded');
    assert.ok((json.images || []).every(image => !image.uri), 'images must be embedded');
    const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset+bytes.byteLength);
    const gltf = await new GLTFLoader().parseAsync(data, '');
    let meshes=0;
    gltf.scene.traverse(node => { if (node.isMesh) meshes++; });
    assert.ok(meshes > 0 && meshes <= 12, 'model must render with a small number of material batches');
    const bounds = new THREE.Box3().setFromObject(gltf.scene);
    assert.ok(Math.abs(bounds.min.y) < 0.001, 'model origin must be on the ground');
    assert.ok(bounds.getSize(new THREE.Vector3()).toArray().every(v => v > 0 && Number.isFinite(v)));
  });
}

test('outpost uses all three GLBs, shares suit geometry and grounds placements', async () => {
  const originalLoad = GLTFLoader.prototype.loadAsync;
  const requests=[];
  GLTFLoader.prototype.loadAsync = async function(url) {
    requests.push(url);
    const bytes=await readFile(new URL(url));
    return this.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  };
  try {
    const scene=new THREE.Scene();
    assert.equal(await buildOutpost(scene),true);
    assert.equal(requests.length,3);
    assert.equal(scene.children.length,4);
    const astronauts=scene.children.filter(obj=>obj.name==='astronaut GLB');
    assert.equal(astronauts.length,2);
    assert.equal(astronauts[0].children[0].children[0].geometry,astronauts[1].children[0].children[0].geometry);
    for (const model of scene.children) {
      assert.ok(Math.abs(new THREE.Box3().setFromObject(model).min.y)<0.001);
      model.traverse(mesh=> { if(mesh.isMesh) assert.ok(mesh.castShadow && mesh.receiveShadow); });
    }
  } finally { GLTFLoader.prototype.loadAsync=originalLoad; }
});
