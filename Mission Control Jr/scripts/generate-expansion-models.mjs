// Builds every expansion-mission GLB from the editable sources in scripts/expansion-models/.
// Usage: npm run models:expansion            (all models)
//        npm run models:expansion -- water-wall-bag   (one model)
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import * as THREE from 'three';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {validateBytes} from 'gltf-validator';
import {finalize} from './expansion-models/kit.mjs';
import * as hab from './expansion-models/mars-hab.mjs';
import * as farm from './expansion-models/greenhouse.mjs';
import * as repair from './expansion-models/repair.mjs';
import * as lunar from './expansion-models/lunar.mjs';
import * as refuge from './expansion-models/refuge.mjs';

globalThis.FileReader ??= class { readAsArrayBuffer(blob) { blob.arrayBuffer().then(v => { this.result = v; this.onloadend?.(); }).catch(e => { this.error = e; this.onerror?.(e); }); } };

export const DESIGNS = {
  // Shared habitat environments
  'hab-quarters-interior': () => hab.habInterior('hab-quarters-interior', {length: 16, width: 10, dressing: 'quarters'}),
  'hab-service-interior': () => hab.habInterior('hab-service-interior', {length: 14, width: 9, dressing: 'service'}),
  // A Place to Hide
  'storm-shelter': hab.stormShelter, 'water-wall-bag': hab.waterBag, 'poly-shield-panel': hab.polyPanel,
  'cargo-shield-stack': hab.cargoStack, 'space-weather-console': hab.weatherConsole, 'stowage-rack': hab.stowageRack,
  'drinking-water-station': hab.waterStation, 'crew-member': hab.crewMember,
  ...refuge.DESIGNS, ...farm.DESIGNS, ...repair.DESIGNS, ...lunar.DESIGNS,
};

const target = process.argv[2];
if (target && !DESIGNS[target]) throw Error(`Unknown model: ${target}`);
const out = new URL('../assets/models/expansion/', import.meta.url);
await mkdir(out, {recursive: true});
const report = [];
for (const [id, make] of Object.entries(DESIGNS)) {
  if (target && id !== target) continue;
  const object = finalize(make());
  object.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(object).getSize(new THREE.Vector3());
  object.userData.dimensionsMeters = size.toArray().map(n => +n.toFixed(3));
  let triangles = 0, draws = 0; const mats = new Set();
  object.traverse(c => { if (!c.isMesh) return; draws++; const g = c.geometry; triangles += (g.index ? g.index.count : g.attributes.position.count) / 3; mats.add(c.material.name); });
  const bytes = Buffer.from(await new GLTFExporter().parseAsync(object, {binary: true, onlyVisible: false}));
  const validation = await validateBytes(new Uint8Array(bytes), {uri: `${id}.glb`});
  if (validation.issues.numErrors) throw Error(`${id}: ${validation.issues.numErrors} glTF errors ${JSON.stringify(validation.issues.messages.slice(0, 3))}`);
  await writeFile(new URL(`${id}.glb`, out), bytes);
  report.push({id, bytes: bytes.length, triangles: Math.round(triangles), draws, materials: mats.size, boundsMeters: object.userData.dimensionsMeters,
    interactionNodes: object.userData.interactionNodes, errors: validation.issues.numErrors, warnings: validation.issues.numWarnings});
}
const manifestUrl = new URL('manifest.json', out);
let previous = []; try { previous = JSON.parse(await readFile(manifestUrl, 'utf8')); } catch {}
const merged = new Map(previous.map(i => [i.id, i])); for (const item of report) merged.set(item.id, item);
const manifest = Object.keys(DESIGNS).filter(id => merged.has(id)).map(id => merged.get(id));
await writeFile(manifestUrl, JSON.stringify(manifest, null, 1) + '\n');
for (const r of report) console.log(`${r.id.padEnd(28)} ${String(r.triangles).padStart(6)} tris ${String(r.draws).padStart(3)} draws ${(r.bytes / 1024).toFixed(0).padStart(5)} KB  warn ${r.warnings}`);
