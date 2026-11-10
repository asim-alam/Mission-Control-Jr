import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {missionById} from '../mission-registry.js';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('the shared mission controller binds its DOM helper before using it', async () => {
  const source = await read('missions/shared/controller.js');
  assert.match(source, /const\s+\$\s*=\s*id\s*=>\s*document\.getElementById\(id\)/);
  assert.ok(source.indexOf('const $') < source.indexOf("$('"));
});

for (const mission of ['orbit', 'solar-shelter', 'greenhouse', 'earth-delay', 'lunar-sunlight', 'lunar-dust', 'lunar-relay']) {
  test(`${mission} page loads its mission script and a world container`, async () => {
    const source = await read(`missions/${mission}/ui.js`);
    const usesController = /from '\.\.\/shared\/controller\.js'/.test(source) && /runMission\(\{/.test(source);
    const bindsOwn = /const\s+\$\s*=\s*id\s*=>\s*document\.getElementById\(id\)/.test(source);
    assert.ok(usesController || bindsOwn, `${mission}: no DOM bootstrap`);
    const html = await read(missionById(mission).file);
    assert.match(html, new RegExp(`missions/${mission}/ui\\.js`));
    if (usesController) assert.match(html, /id="world"/);
  });
}
