import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync,statSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join} from 'node:path';

const root=fileURLToPath(new URL('../',import.meta.url));

for(const {label,script,asset,directory,expectedCount} of [
  {label:'survival',script:'generate-survival-models.js',asset:'shelter-frame',directory:'survival',expectedCount:8},
  {label:'lunar',script:'generate-lunar-models.js',asset:'lunar-relay-mast',directory:'lunar',expectedCount:11},
]){
  test(`${label} generator refreshes one asset and preserves complete manifest`,()=>{
    execFileSync(process.execPath,[join(root,'scripts',script),asset],{cwd:root,stdio:'ignore'});
    const folder=join(root,'assets','models',directory);
    const manifest=JSON.parse(readFileSync(join(folder,'manifest.json'),'utf8'));
    assert.equal(manifest.length,expectedCount);
    assert.equal(new Set(manifest.map(item=>item.id)).size,expectedCount);
    const model=manifest.find(item=>item.id===asset);
    assert.ok(model,'selected model remains in the manifest');
    assert.equal(model.errors,0);
    assert.equal(model.warnings,0);
    assert.ok(model.triangles>0);
    assert.equal(statSync(join(folder,`${asset}.glb`)).size,model.bytes);
    assert.ok(manifest.every(item=>item.bytes>0&&item.triangles>0&&Number.isFinite(item.draws)&&Number.isFinite(item.materials)));
  });
}
