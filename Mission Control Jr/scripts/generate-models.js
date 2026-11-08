import { mkdir, writeFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createAstronaut, createHabitat, createRover, optimizeModel } from './model-designs.js';
import { MISSION_DESIGNS } from './mission-models.js';

// GLTFExporter uses the browser FileReader interface for binary Blob output.
globalThis.FileReader ??= class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then(result => { this.result=result; this.onloadend?.(); })
      .catch(error => { this.error=error; this.onerror?.(error); });
  }
};
const directory=new URL('../assets/models/',import.meta.url);
await mkdir(directory,{recursive:true});
const exporter=new GLTFExporter();
const designs=[['astronaut',()=>optimizeModel(createAstronaut())],['habitat',()=>optimizeModel(createHabitat())],['rover',()=>optimizeModel(createRover())],...MISSION_DESIGNS];
const requested=process.argv.slice(2);
if (requested.some(name=>!designs.some(([model])=>model===name))) {
  throw new Error(`Choose ${designs.map(([name])=>name).join(', ')}. Omit names to generate all models.`);
}
for(const [name, create] of designs.filter(([name])=>!requested.length || requested.includes(name))) {
  const model=create();
  const glb=await exporter.parseAsync(model,{binary:true,animations:model.animations});
  await writeFile(new URL(`${name}.glb`,directory),new Uint8Array(glb));
  const size=new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
  let triangles=0, meshes=0;model.traverse(m=>{if(m.isMesh){triangles+=(m.geometry.index?.count||m.geometry.attributes.position.count)/3;meshes++;}});
  console.log(`${name}.glb: ${(glb.byteLength/1024).toFixed(0)} KB, ${triangles} triangles, ${meshes} meshes, ${size.toArray().map(v=>v.toFixed(2)).join(' × ')} m`);
}
