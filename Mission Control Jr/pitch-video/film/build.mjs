// Generates index.html for "Before the Storm" from the edit plan below. Re-run after changing timings: node build.mjs
import {execSync} from 'node:child_process';
import {existsSync, writeFileSync} from 'node:fs';

const DUR = 235;
const len = {};
const media = id => {
  const p = id.startsWith('n-') ? `assets/nasa/${id}.mp4` : `assets/game/${id}.mp4`;
  if (!existsSync(p)) return null;
  len[id] ??= +execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${p}"`).toString();
  return p;
};
const FALLBACK = {'ui-home': 'bb-outpost-push', 'ui-map': 'bb-basin-crane', 'ui-decision': 'ex-greenhouse-close', 'ui-sources': 'n-opp-shadow', 'ui-report': 'ex-shelter-event', 'ui-title-storm': 'bb-outpost-low'};

// ---- shots: [clip, start, duration, {tilt, zoom, ms (media start)}]
const shots = [];
const S = (id, t, d, o = {}) => shots.push([id, t, d, o]);

// INTRO MONTAGE (duotone, Dutch tilt)
const intro = [['n-mars-globe', 1.2], ['n-jezero-low', 1.0], ['n-opp-horizon', 1.0], ['n-moon-zoom', .9], ['n-artemis-pad', .9], ['bb-outpost-push', .8], ['n-persev-ground', .8], ['n-earth-iss', .7], ['n-opp-rim', .7], ['n-sun', .6], ['n-opp-tracks', .6], ['ex-moon-relay', .5], ['n-crew-walk', .6], ['n-mars-dust', 1.1]];
let t = 1.2;
intro.forEach(([id, d], i) => { S(id, t, d, {tilt: (i % 2 ? -1 : 1) * (2 + (i % 3)), zoom: 1.18, ms: 2 + i * .7}); t += d; });

// ACT 1 — WHO
S('n-mars-dust', 19, 3.5, {ms: 4}); S('n-dark-sky', 22.5, 3.3);
S('n-opp-selfie', 25.8, 2.55); S('n-opp-rim', 28.35, 1.05, {ms: 1}); S('n-opp-deck', 29.4, 3.6); S('n-opp-shadow', 33, 3.4, {ms: 20});
S('bb-outpost-push', 47, 5, {zoom: 1.06});
S('bb-outpost-low', 52, 6); S('bb-basin-crane', 58, 5);
S('bb-dawn-rise', 63, 4);
// ACT 2 — WHY
S('n-mars-globe', 67, 1.95); S('n-jezero-high', 68.95, 2.55, {ms: 1}); S('n-crew-walk', 71.5, 4);
S('n-persev-ground', 78.8, 3.9); S('n-persev-crater', 82.7, 1.5, {ms: 1}); S('ex-shelter-wall', 84.2, 4.8);
S('n-opp-tracks', 89, 3.9); S('n-opp-horizon', 92.9, 2.1, {ms: 2});
S('n-artemis-pad', 95, 1.8, {ms: 1}); S('n-artemis-ign', 96.8, 1.6); S('n-artemis-lift', 98.4, 1.8); S('n-artemis-glow', 100.2, 1.8);
S('n-earth-iss', 102, 4, {ms: 1}); S('n-crew-walk', 106, 4, {ms: 1}); S('ex-shelter-refuge', 110, 4, {ms: 1});
// ACT 3 — WHAT
S('ui-home', 114, 5.5); S('ui-map', 119.5, 5.5);
// REAL <-> GAME montage
const pairs = [['n-opp-tracks', 'bb-rover-wheels'], ['n-jezero-low', 'bb-basin-crane'], ['n-dark-sky', 'bb-outpost-low'], ['n-opp-deck', 'ex-shelter-wall'], ['n-flare', 'ex-shelter-event'], ['n-veggie', 'ex-greenhouse-close'], ['n-orion-moon', 'ex-earth-delay'], ['n-apollo-lm', 'ex-moon-airlock'], ['n-moon-shadows', 'ex-moon-mast'], ['n-apollo-boot', 'ex-moon-relay']].flat();
const raw = pairs.map((_, i) => 1.0 - .5 * i / (pairs.length - 1)); const k = 15.8 / raw.reduce((a, b) => a + b);
t = 125; pairs.forEach((id, i) => { const d = +(raw[i] * k).toFixed(3); S(id, t, d, {ms: 1 + (i % 4) * .5, zoom: 1.08}); t += d; });
['n-artemis-ign', 'ex-shelter-refuge', 'n-sls-engines', 'bb-outpost-push', 'n-artemis-lift', 'ex-greenhouse-beds', 'n-earthrise', 'bb-rover-track'].forEach((id, i) => S(id, 140.8 + i * .4, .4, {ms: 1.5, zoom: 1.1}));
S('ui-decision', 145.5, 8);
S('ex-shelter-refuge', 153.6, 3.2, {ms: 2}); S('ex-greenhouse-beds', 156.8, 3.2, {ms: 2}); S('ex-earth-delay', 160, 3.2, {ms: 1}); S('ex-moon-mast', 163.2, 3.2);
S('ui-sources', 166.4, 10.4); S('n-opp-shadow', 176.8, 3.7, {ms: 40}); S('n-veggie', 180.5, 4.1, {ms: 1});
// ACT 4 — HOW
S('ex-shelter-wall', 184.6, 4.6); S('ex-greenhouse-close', 189.2, 3.4, {ms: 1}); S('ex-shelter-event', 192.6, 5);
S('bb-basin-crane', 197.6, 6.4);
S('bb-rover-track', 204, 4); S('n-jpl-cheer', 208, 3.5); S('bb-outpost-low', 211.5, 4);
S('n-dark-sky', 215.5, 3.45); S('bb-dawn-rise', 218.95, 6.0);

// ---- VO
const VO = {s02: 19, s03: 26, s04: 37, s06: 47.3, s07: 52.2, s09: 67.3, s10: 78.8, s11: 84.2, s12: 89, s13: 95.2, s14: 102.2, s15: 114.2, s16: 146, s17: 153.8, s18: 166.6, s19: 184.8, s20: 197.8, s21: 204.2, s22: 216, s23: 220.5, s24: 226};
const voLen = {};
for (const id in VO) voLen[id] = +execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 assets/vo/${id}.mp3`).toString();

// ---- music ducking envelope
const silent = [[44, 47], [144, 145.5], [215.3, 216.2]];
const level = x => {
  if (silent.some(([a, b]) => x >= a && x < b)) return .03;
  if (x < 16) return .95;
  if (Object.entries(VO).some(([id, s]) => x >= s - .4 && x < s + voLen[id] + .5)) return .32;
  if (x >= 125 && x < 144) return 1;
  return .7;
};
const pts = []; let last = null;
for (let x = 0; x <= DUR; x += .1) { const v = level(+x.toFixed(1)); if (v !== last) { if (last !== null) pts.push({t: +(x - .25).toFixed(2), v: last}); pts.push({t: +(x + .05).toFixed(2), v}); last = v; } }
pts[0].t = 0; pts.push({t: DUR, v: last});
const automation = JSON.stringify({version: 1, lanes: [{target: 'volume', points: pts.filter(p => p.t >= 0)}]});

// ---- text cards: [id, start, dur, html, class]
const cards = [
  ['mars-date', 16.3, 2.6, 'MARS &nbsp;·&nbsp; JUNE 2018', 'date'],
  ['type', 37, 6.9, [...'MY BATTERY IS LOW AND IT’S GETTING DARK.'].map(c => `<span class="ch">${c === ' ' ? '&nbsp;' : c}</span>`).join(''), 'typed'],
  ['type-src', 39.5, 4.4, 'Opportunity’s final data, in plain words · 10 June 2018', 'small'],
  ['never', 44.2, 2.7, 'It never woke up.', 'serif'],
  ['team-0', 52.6, 2, 'BONGO APHELION<small>NASA Space Apps Challenge 2026</small>', 'lower'],
  ['team-1', 54.6, 1.6, 'Md. Asim Alam Chowdhury<small>Frontend</small>', 'lower'],
  ['team-2', 56.2, 1.6, 'Parvej Shah<small>Cloud Engineer</small>', 'lower'],
  ['team-3', 57.8, 1.6, 'Md. Saikat Islam<small>Backend Developer</small>', 'lower'],
  ['team-4', 59.4, 1.6, 'Md. Inzamamul Lohani<small>Story Designer</small>', 'lower'],
  ['team-5', 61, 1.7, 'Fayroz Tasnim Rowza<small>Research &amp; Analysis</small>', 'lower'],
  ['title', 63.2, 3.7, 'MISSION CONTROL JR.<small>Small decisions. Giant missions.</small>', 'big'],
  ['fact-1', 68, 3.4, 'MARS IS RED.', 'fact'],
  ['fact-2', 72, 3.4, 'ASTRONAUTS NEED OXYGEN.', 'fact'],
  ['fact-3', 75.6, 3.1, 'A REAL MISSION IS A <em>CHOICE.</em>', 'big2'],
  ['batt', 79.2, 4.6, 'ONE BATTERY<small>AIR FOR THE CREW &nbsp;/&nbsp; KEEP THE SCIENCE RUNNING</small>', 'split'],
  ['water', 84.5, 4.5, 'ONE TANK OF WATER<small>DRINK IT &nbsp;/&nbsp; SHIELD THE CREW FROM THE SUN</small>', 'split'],
  ['costs', 89.6, 5.4, 'EVERY CHOICE COSTS SOMETHING.', 'big2'],
  ['artemis', 95.6, 5.8, 'ARTEMIS &nbsp;·&nbsp; MOON, THEN MARS', 'date'],
  ['ages', 105, 4.6, 'TOMORROW’S MISSION PLANNERS ARE <em>7–9</em> TODAY', 'date'],
  ['product', 117.5, 7, 'FREE &nbsp;·&nbsp; ANY WEB BROWSER &nbsp;·&nbsp; 9 MISSIONS ON MARS &amp; THE MOON', 'date'],
  ['real', 125.2, 1.6, 'REAL', 'tag'],
  ['game', 126.3, 1.4, 'GAME', 'tag'],
  ['decide', 146.2, 2.8, 'YOU DECIDE.', 'tagr'],
  ['m-1', 154, 2.8, 'Solar storm shelter', 'lower'],
  ['m-2', 157.2, 2.8, 'Birthday salad greenhouse', 'lower'],
  ['m-3', 160.4, 2.8, 'Water recycler · Earth is minutes away', 'lower'],
  ['m-4', 163.6, 2.6, 'Chase sunlight on the Moon', 'lower'],
  ['src-1', 167.2, 4.4, 'Opportunity power data<small>2018 global dust storm · NASA/JPL-Caltech</small>', 'callout'],
  ['src-2', 171.8, 3.8, 'Curiosity RAD radiation readings<small>NASA/JPL-Caltech/SwRI</small>', 'callout'],
  ['src-3', 175.8, 3.8, 'HiRISE map of Jezero crater<small>NASA/JPL-Caltech/University of Arizona</small>', 'callout'],
  ['src-4', 179.8, 4.6, 'Veggie: lettuce grown on the ISS<small>NASA</small>', 'callout'],
  ['fail', 192.8, 4.6, 'FAILING ISN’T THE END. <em>IT’S THE LESSON.</em>', 'big2'],
  ['next-1', 204.6, 4.4, 'NEXT &nbsp;·&nbsp; CLASSROOMS &nbsp;·&nbsp; LIVE SPACE WEATHER &nbsp;·&nbsp; MORE LANGUAGES', 'date'],
  ['next-2', 209.4, 5.6, 'LOOKING FOR TEACHERS, SCHOOLS &amp; MENTORS', 'date'],
  ['final', 226, 4.6, 'MISSION CONTROL JR.<small>Small decisions. Giant missions.</small>', 'big'],
  ['end', 230.7, 4.3, `<b>mission-control-jr.netlify.app</b><span>BONGO APHELION · NASA Space Apps Challenge 2026</span><i>Footage: NASA, NASA/JPL-Caltech, NASA/GSFC/SDO. Use of NASA imagery does not imply endorsement.<br>Music: “Cinematic Documentary” by AShamaluevMusic · Voice: Ava (Microsoft neural TTS)</i>`, 'endcard'],
];

// ---- emit
const vids = [], tw = [];
shots.forEach(([id0, st, d, o], i) => {
  let id = id0, src = media(id);
  if (!src) { id = FALLBACK[id0]; src = media(id); console.log('fallback', id0, '->', id); }
  let ms = o.ms ?? 0;
  if (ms + d > len[id] - .05) ms = Math.max(0, len[id] - d - .05);
  if (d > len[id]) console.log('WARN short clip', id, len[id], 'for', d);
  const z = o.zoom ?? 1.04, tilt = o.tilt ?? 0, vid = `v${i}`;
  vids.push(`<div class="w" id="w${i}"><video id="${vid}" class="clip" src="${src}" data-start="${st}" data-duration="${d}" data-media-start="${ms.toFixed(2)}" data-track-index="1" muted playsinline></video></div>`);
  tw.push(`tl.fromTo('#w${i}', {scale: ${z}, rotation: ${tilt}, xPercent: ${(i % 3 - 1) * .8}}, {scale: ${(z + .06).toFixed(2)}, rotation: ${tilt * .6}, xPercent: ${(1 - i % 3) * .8}, duration: ${d}, ease: 'none'}, ${st});`);
});
const cardHtml = cards.map(([id, st, d, h, c]) => `<div id="c-${id}" class="clip card ${c}" data-start="${st}" data-duration="${d}" data-track-index="3"><div class="in">${h}</div></div>`).join('\n');
cards.forEach(([id, st, d, , c]) => {
  if (c === 'typed') return;
  const y = c === 'lower' || c === 'callout' ? 0 : 18;
  tw.push(`tl.fromTo('#c-${id} .in', {opacity: 0, y: ${y}, x: ${c === 'lower' || c === 'callout' ? -30 : 0}}, {opacity: 1, y: 0, x: 0, duration: .55, ease: 'power3.out'}, ${st});`);
  tw.push(`tl.to('#c-${id} .in', {opacity: 0, duration: .35, ease: 'power2.in'}, ${(st + d - .4).toFixed(2)});`);
});
// typewriter, synced to s04
const chars = [...'MY BATTERY IS LOW AND IT’S GETTING DARK.'];
tw.push(`gsap.utils.toArray('#c-type .ch').forEach((el, i) => tl.fromTo(el, {opacity: 0}, {opacity: 1, duration: .01}, 37.6 + i * ${(4.6 / chars.length).toFixed(3)}));`);
tw.push(`tl.fromTo('#c-type .in', {opacity: 1}, {opacity: 0, duration: .5}, 43.3);`);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<script src="https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js"></script>
<title>Before the Storm — Mission Control Jr.</title>
<style>
  html, body { margin: 0; background: #000; }
  #root { position: relative; width: 1920px; height: 1080px; overflow: hidden; background: #050505; font-family: 'Inter', sans-serif; color: #f4ece2; }
  .w { position: absolute; inset: 0; overflow: hidden; }
  .w video { width: 100%; height: 100%; object-fit: cover; display: block; }
  #duo { position: absolute; inset: 0; background: #c2622b; mix-blend-mode: color; opacity: .62; z-index: 5; }
  #duo2 { position: absolute; inset: 0; background: linear-gradient(180deg, #1d3b2e 0%, transparent 60%); mix-blend-mode: multiply; opacity: .5; z-index: 5; }
  #grain { position: absolute; inset: 0; z-index: 6; pointer-events: none; background: radial-gradient(ellipse at center, transparent 45%, rgba(0,0,0,.62) 100%); }
  .bar { position: absolute; left: 0; right: 0; height: 104px; background: #000; z-index: 20; }
  #bar-t { top: 0; } #bar-b { bottom: 0; }
  #field { position: absolute; inset: 0; background: #b9532a; z-index: 8; overflow: hidden; }
  .gl { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: 'League Gothic', sans-serif; font-size: 300px; letter-spacing: 6px; color: #f6e7d2; line-height: 1; }
  #gl-0 { clip-path: inset(0 0 66% 0); } #gl-1 { clip-path: inset(34% 0 33% 0); } #gl-2 { clip-path: inset(67% 0 0 0); }
  #gl-sub { position: absolute; left: 0; right: 0; bottom: 250px; text-align: center; font: 500 26px 'Space Mono', monospace; letter-spacing: 12px; color: #2a120a; }
  .card { position: absolute; inset: 0; z-index: 10; display: flex; align-items: center; justify-content: center; pointer-events: none; }
  .card .in { text-align: center; text-shadow: 0 2px 24px rgba(0,0,0,.6); }
  .card small { display: block; font: 400 30px 'Inter', sans-serif; letter-spacing: 3px; margin-top: 18px; color: #e9c9a8; text-transform: none; }
  .date .in { font: 500 34px 'Space Mono', monospace; letter-spacing: 10px; align-self: flex-end; margin-bottom: 170px; max-width: 1500px; }
  .typed .in { font: 400 54px 'Space Mono', monospace; color: #ffb37a; letter-spacing: 2px; max-width: 1500px; }
  .small .in { font: 400 22px 'Space Mono', monospace; color: #8c7a6a; align-self: flex-end; margin-bottom: 330px; letter-spacing: 3px; }
  .serif .in { font: italic 400 84px 'EB Garamond', serif; color: #efe6da; }
  .lower { justify-content: flex-start; }
  .lower .in { align-self: flex-end; margin: 0 0 160px 150px; text-align: left; font: 600 46px 'Inter', sans-serif; border-left: 6px solid #e2763c; padding-left: 26px; }
  .lower small { font-size: 26px; margin-top: 8px; letter-spacing: 4px; text-transform: uppercase; color: #f0b58a; }
  .big .in { font: 400 190px 'League Gothic', sans-serif; letter-spacing: 8px; line-height: .95; }
  .big small { font: italic 400 50px 'EB Garamond', serif; letter-spacing: 1px; color: #f0c9a0; }
  .fact .in { font: 400 150px 'League Gothic', sans-serif; letter-spacing: 6px; color: #f4ece2; }
  .big2 .in { font: 400 130px 'League Gothic', sans-serif; letter-spacing: 5px; max-width: 1600px; line-height: 1; }
  em { font-style: normal; color: #ff8a47; }
  .split .in { font: 400 150px 'League Gothic', sans-serif; letter-spacing: 6px; }
  .split small { font: 600 34px 'Space Mono', monospace; letter-spacing: 6px; color: #ffcf9e; }
  .tag { justify-content: flex-start; } .tag .in { align-self: flex-start; margin: 150px 0 0 150px; font: 700 30px 'Space Mono', monospace; letter-spacing: 14px; color: #ffb37a; }
  .tagr .in { font: 400 170px 'League Gothic', sans-serif; letter-spacing: 10px; align-self: flex-start; margin-top: 140px; }
  .callout { justify-content: flex-end; }
  .callout .in { align-self: flex-end; margin: 0 150px 160px 0; text-align: right; background: rgba(12,10,9,.78); border-right: 6px solid #e2763c; padding: 24px 32px; font: 600 40px 'Inter', sans-serif; }
  .callout small { font: 400 22px 'Space Mono', monospace; letter-spacing: 2px; color: #d9b897; margin-top: 10px; }
  .endcard .in { display: flex; flex-direction: column; gap: 26px; align-items: center; }
  .endcard b { font: 700 54px 'Space Mono', monospace; color: #ffb37a; letter-spacing: 2px; }
  .endcard span { font: 600 30px 'Inter', sans-serif; letter-spacing: 8px; }
  .endcard i { font: 400 22px 'Inter', sans-serif; font-style: normal; color: #a89888; line-height: 1.7; max-width: 1400px; }
</style>
</head>
<body>
<div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="1920" data-height="1080" data-layout-allow-overlap data-layout-allow-overflow>
${vids.join('\n')}
<div id="duo" class="clip" data-start="1.2" data-duration="11.4" data-track-index="2"></div>
<div id="duo2" class="clip" data-start="1.2" data-duration="11.4" data-track-index="2"></div>
<div id="grain"></div>
<div id="field" class="clip" data-start="12.6" data-duration="3.4" data-track-index="2">
  <div class="gl" id="gl-0">BEFORE THE STORM</div><div class="gl" id="gl-1">BEFORE THE STORM</div><div class="gl" id="gl-2">BEFORE THE STORM</div>
  <div id="gl-sub">A JUNIOR ASTRONAUT MISSION TRAINER</div>
</div>
${cardHtml}
<div class="bar" id="bar-t"></div><div class="bar" id="bar-b"></div>
<audio id="music" class="clip" src="assets/music/score-ashamaluev-cinematic-documentary.wav" data-start="0" data-duration="${DUR}" data-track-index="5" data-volume="1" data-fade-out="2.5" data-automation='${automation}'></audio>
${Object.entries(VO).map(([id, s]) => `<audio id="vo-${id}" class="clip" src="assets/vo/${id}.mp3" data-start="${s}" data-duration="${voLen[id].toFixed(2)}" data-track-index="6" data-volume="1.15"></audio>`).join('\n')}
</div>
<script>
const tl = gsap.timeline({paused: true});
${tw.join('\n')}
// glitch-slice title reveal
const gl = [['#gl-0', -260, 40], ['#gl-1', 220, -30], ['#gl-2', -140, 60]];
gl.forEach(([s, x0, x1], i) => {
  tl.fromTo(s, {x: x0, opacity: 0}, {x: x1, opacity: 1, duration: .12, ease: 'steps(2)'}, 12.75 + i * .06);
  tl.to(s, {x: -x1 * .6, duration: .08, ease: 'steps(1)'}, 13.0 + i * .05);
  tl.to(s, {x: 0, duration: .5, ease: 'expo.out'}, 13.15 + i * .04);
  tl.to(s, {x: x1 * .4, duration: .06, ease: 'steps(1)'}, 14.4 + i * .03);
  tl.to(s, {x: 0, duration: .1, ease: 'steps(1)'}, 14.5);
});
tl.fromTo('#gl-sub', {opacity: 0, scale: 1.08}, {opacity: 1, scale: 1, duration: 1, ease: 'power3.out'}, 13.6);
tl.fromTo('#field', {opacity: 1}, {opacity: 0, duration: .5, ease: 'power2.in'}, 15.45);
// letterbox breathes open for the final title
tl.fromTo('.bar', {height: 104}, {height: 0, duration: 1.2, ease: 'power2.inOut'}, 225.2);
window.__timelines['main'] = tl;
</script>
</body>
</html>
`;
writeFileSync('index.html', html);
console.log('shots', shots.length, 'cards', cards.length, 'music points', pts.length);
