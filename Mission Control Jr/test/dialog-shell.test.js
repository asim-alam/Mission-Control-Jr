import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = path => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

test('every mission and campaign briefing uses the shared scrim and card classes', async () => {
  const pages = ['orbit.html', 'storm.html', 'mission2.html', 'campaign.html', 'index.html'];
  const html = await Promise.all(pages.map(read));
  const hud = await read('missions/shared/hud.js');
  for (let i = 0; i < pages.length; i++) {
    // Redesigned missions build their dialog through the shared mission HUD (missions/shared/hud.js).
    if (/missions\/[a-z-]+\/ui\.js/.test(html[i])) { assert.match(hud, /id="dialog" role="dialog" aria-modal="true"/, `${pages[i]} uses the shared mission dialog`); continue; }
    assert.match(html[i], /class="ui-scrim[^\"]*"/, `${pages[i]} has a shared scrim`);
    assert.match(html[i], /class="[^"]*ui-card[^"]*"/, `${pages[i]} has a shared card`);
  }
});

test('shared dialog CSS constrains card geometry, preserves padding, and transfers active captions', async () => {
  const css = await read('hud-redesign.css');
  assert.match(css, /width:\s*min\(640px,\s*100%\)/);
  assert.match(css, /max-width:\s*720px/);
  assert.match(css, /padding:\s*32px\s*!important/);
  assert.match(css, /padding:\s*20px\s*!important/);
  assert.match(css, /\.ui-dialog-caption/);
  assert.match(css, /backdrop-filter:\s*none\s*!important/);
  assert.match(css, /\.ui-card #modal-body dl/);
});
