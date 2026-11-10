import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {MISSIONS} from '../mission-registry.js';
import {missionAssets,getMissionAssets} from '../mission-assets.js';

test('every playable surface mission has an explicit build-tracked asset bundle',()=>{
  const expected=MISSIONS.filter(m=>m.id==='orbit'||m.id==='solar-shelter'||m.id==='greenhouse'||m.id==='earth-delay'||m.id.startsWith('lunar-')).map(m=>m.id).sort();
  assert.deepEqual(Object.keys(missionAssets).sort(),expected);
  for(const id of expected){const bundle=getMissionAssets(id);assert.ok(Object.keys(bundle).length>=4);for(const asset of Object.values(bundle)){assert.equal(asset.protocol,'file:');assert.ok(existsSync(new URL(asset)));}}
  assert.throws(()=>getMissionAssets('not-a-mission'),RangeError);
});
