import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

for(const mission of ['solar-shelter','greenhouse','earth-delay','lunar-sunlight','lunar-dust','lunar-relay']){
 test(`${mission} binds its DOM helper before using it`,async()=>{
  const source=await readFile(new URL(`../missions/${mission}/ui.js`,import.meta.url),'utf8');
  assert.match(source,/const\s+\$\s*=\s*id\s*=>\s*document\.getElementById\(id\)/);
  assert.match(source,/\$\(['"]/);
 });
}
