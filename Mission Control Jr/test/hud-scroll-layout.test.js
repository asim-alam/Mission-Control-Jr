import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = name => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

test('shared scroll utility hides native bars and captures wheel and keys without adding a cue', () => {
  const script = read('scroll-ui.js'), css = read('hud-redesign.css');
  assert.doesNotMatch(script, /scroll-cue|More below/);
  assert.match(script, /event\.preventDefault\(\);\s*event\.stopPropagation\(\)/);
  assert.match(script, /PageDown/);
  assert.match(script, /event\.key === 'Home'/);
  assert.match(script, /attributeFilter: \['hidden', 'class', 'open'\]/);
  assert.match(css, /\.scroll-hidden\s*\{[^}]*overscroll-behavior:\s*contain/s);
  assert.match(css, /\*::-webkit-scrollbar\s*\{\s*display:\s*none/);
  assert.match(css, /scrollbar-width:\s*none/);
  assert.match(css, /scrollbar-gutter:\s*auto/);
});

test('Tracks in the Dust compact objective is ordered and never internally scrolls', () => {
  const html = read('mission2.html'), css = read('hud-redesign.css'), js = read('mission2-demo.js');
  const label = html.indexOf('id="stage-count"'), title = html.indexOf('id="objective"'), next = html.indexOf('id="task-distance"'), progress = html.indexOf('id="objective-progress"');
  assert.ok(label < title && title < next && next < progress);
  assert.match(css, /#mission-panel:not\(\.expanded\)[^{]*\{[^}]*height:\s*auto[^}]*overflow:\s*visible/s);
  assert.match(js, /stage-count'\)\.textContent=`\$\{current\.stage\} \/ 8`/);
  assert.match(css, /#hud #radio\s*\{[^}]*max-height:\s*none[^}]*overflow:\s*visible/s);
  assert.match(css, /#hud #radio \.radio-top\s*\{[^}]*grid-template-columns/s);
});

test('Mission 2 shows the complete commander briefing without a disclosure button', () => {
  const js = read('mission2-demo.js'), css = read('hud-redesign.css');
  const briefing = js.slice(js.indexOf('function showBriefing'), js.indexOf('function referenceArchive'));
  assert.doesNotMatch(briefing, /<details|<summary|Full briefing|More below/);
  assert.match(briefing, /class="briefing-transcript"><p>Elena Reyes · Commander: Meridian survived the storm/);
  assert.match(css, /#dialog \.ui-card:has\(\.briefing-transcript\) #dialog-actions\s*\{[^}]*position:\s*sticky/s);
  assert.match(css, /#dialog \.ui-card:has\(\.briefing-transcript\) #dialog-body p\s*\{\s*max-width:\s*none/);
  assert.match(read('hud-presentation.js'), /modal\.querySelector\('\.briefing-transcript'\)/);
});

test('surface globe prop and its collision are absent while archive and atlas assets remain', () => {
  const exhibits = read('expedition-exhibits.js'), terrain = read('expedition-terrain.js'), mission = read('mission2-demo.js');
  assert.doesNotMatch(exhibits, /reference-mars-globe|navigation globe|planet\.rotation/);
  assert.doesNotMatch(exhibits, /CylinderGeometry\(\.8,\.65/);
  assert.doesNotMatch(terrain, /minX:2\.3,maxX:3\.7,minZ:7\.3,maxZ:8\.7/);
  assert.doesNotMatch(mission, /navigation globe|Mars planet is the navigation globe/);
  assert.match(read('mission2-reference-viewer.js'), /reference-mars-globe\.glb/);
  assert.match(read('orbit-demo.js'), /Mars \/ the world below/);
  assert.match(read('mission2.html'), /id="map-button"[^>]*>Map · M/);
});

test('Arrival uses the shared mission HUD with Pause and Map buttons and a 3D world container', () => {
  const html = read('orbit.html'), hud = read('missions/shared/hud.js'), controller = read('missions/shared/controller.js');
  const entry = read('missions/orbit/entry.js');
  assert.match(html, /missions\/orbit\/entry\.js/);
  assert.match(entry, /id="world"/);
  assert.match(entry, /import\('\.\/ui\.js'\)/);
  assert.match(hud, /id="pause"[^>]*>⏸️ Pause/);
  assert.match(hud, /id="journey"[^>]*>🗺️ Map/);
  assert.match(controller, /\$\('journey'\)\.onclick = openJourney/);
});

test('Meridian home uses the requested headline and a low-rate disposable Three.js scene', () => {
  const html = read('index.html'), js = read('journey.js'), scene = read('journey-scene.js'), css = read('hud-redesign.css');
  assert.match(html, /MISSION CONTROL<br><span>JUNIOR\.<\/span>/);
  assert.match(js, /Train as a junior astronaut on Mars/);
  assert.match(js, /stopHomeScene\(\)/);
  assert.match(scene, /now - last < 33/);
  assert.match(scene, /assets\/models\/rover-dynamic\.glb/);
  assert.match(scene, /assets\/models\/habitat\.glb/);
  assert.match(scene, /assets\/models\/astronaut\.glb/);
  assert.match(css, /#home-scene\s*\{\s*position:\s*fixed/s);
  assert.match(css, /home-scene-fallback/);
});

test('chapter navigation supports static entry paths and removes the left shadow from home and orbit', () => {
  const js = read('journey.js'), bridge = read('campaign-bridge.js'), css = read('hud-redesign.css'), storm = read('storm.html'), vite = read('vite.config.js');
  assert.match(js, /const chapterPath=\(id,sampler=false\)=>journeyUrl\(location\.href,id,\{sampler\}\)\.href/);
  assert.match(js, /addEventListener\('popstate'/);
  assert.match(js, /function menu\(\{updatePath=true\}=\{\}\).*frame\.hidden=true/s);
  assert.match(js, /function resume\(\).*frame\.hidden=false/s);
  assert.doesNotMatch(js, /replaceState\(null,'',`#\$\{id\}`\)/);
  assert.match(bridge, /location\.href=routeFor\(id\)/);
  assert.match(vite, /configureServer\(server\).*server\.middlewares\.use\(rewriteChapterRoutes\)/s);
  assert.match(vite, /configurePreviewServer\(server\).*server\.middlewares\.use\(rewriteChapterRoutes\)/s);
  assert.match(vite, /fileName:\s*'_redirects'/);
  assert.match(storm, /<h1>BEFORE<br><span>THE STORM<\/span>/);
  assert.match(css, /body:has\(#space\) #opening \{ background: transparent !important; \}/);
  assert.match(css, /#journey \{ background: linear-gradient\(90deg/s);
  assert.match(css, /body:has\(#space\) \.film-grain \{ background: linear-gradient\(0deg/s);
});
