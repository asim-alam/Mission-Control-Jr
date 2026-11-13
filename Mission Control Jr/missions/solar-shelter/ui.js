// "A Place to Hide" (v3) — explainer, alert, refuge tablet, refuge check, event sensors and debrief.
import {runMission} from '../shared/controller.js';
import {compareTable} from '../shared/hud.js';
import {readHistory, pushHistory, snapshot} from '../shared/runtime.js';
import {tuneScenario} from '../../simulation/difficulty.js';
import {shelterScenario} from './scenario.js';
import {createMission, migrateSave, SHELTER_SCHEMA, PEOPLE, SEAT_IDS, SURFACE_IDS} from './state.js';
import {applyAction, advanceMission, applyBlueprint, getObjective, getInstruction, getSteps, getResult, checkRefuge, blockingIssues, estimate, seatLevel, seatTransmission, surfaceTransmission,
  teamExposure, explain, NAMES, ASSISTS, rackWater, railPanels, zoneBags} from './actions.js';
import {createShelterScene} from './scene.js';

const ID = 'solar-shelter';
const $ = id => document.getElementById(id);
let speed = 1, lastBlueprint = null;

// ---- science -----------------------------------------------------------------------------------
function sources(ctx) {
  const e = ctx.mission.scenario.event;
  return `<h3>What NASA has observed</h3>
  <ul>
   <li>The Sun sometimes sends out <b>solar energetic particles</b>: tiny bits of atoms moving very fast. They are invisible. <a href="https://www.nasa.gov/science-research/heliophysics/real-martians-how-to-protect-astronauts-from-space-radiation-on-mars/" target="_blank" rel="noopener">NASA: protecting astronauts on Mars</a></li>
   <li>Mars has a thin atmosphere and no global magnetic field, so more particles reach the ground than on Earth. The planet itself blocks the half of the sky below you.</li>
   <li>Water, food, plastic (polyethylene) and packed supplies are rich in hydrogen, which is good at slowing particles. NASA plans for crews to shelter behind them. <a href="https://science.nasa.gov/science-research/heliophysics/how-nasa-will-protect-astronauts-from-space-radiation-at-the-moon/" target="_blank" rel="noopener">NASA: how astronauts will shelter at the Moon</a> · <a href="https://svs.gsfc.nasa.gov/vis/a010000/a013200/a013275/script_27781_00.html" target="_blank" rel="noopener">NASA video script</a></li>
   <li>In May 2024 a big solar storm reached Mars. NASA spacecraft and rovers measured it there. <a href="https://www.nasa.gov/solar-system/planets/mars/nasa-watches-mars-light-up-during-epic-solar-storm/" target="_blank" rel="noopener">NASA: Mars lights up during a solar storm</a></li>
   <li>On 10 May 2024 the <b>GOES satellite near Earth</b> recorded a particle event (${e.instruments?.[0]?.displayName || 'GOES >10 MeV protons'}). That is a measurement near Earth, <b>not</b> a forecast for Mars. <a href="${e.link}" target="_blank" rel="noopener">NASA DONKI record</a> · <a href="https://ccmc.gsfc.nasa.gov/tools/DONKI/" target="_blank" rel="noopener">DONKI database</a></li>
  </ul>
  <h3>What is made up for the game</h3>
  <p class="mx-made-up">${ctx.mission.scenario.limitation}</p>
  <ul><li>Not every eruption on the Sun sends a dangerous particle burst to a base, and there is no fixed warning time.</li>
   <li>Going into a refuge lowers how fast you collect more exposure. It does not take away what you already collected.</li>
   <li>The purple streaks are an <b>illustration</b>. You could never see the real particles.</li>
   <li>This mission works without live data, so it always plays the same way.</li></ul>`;
}

// ---- intro and alert ----------------------------------------------------------------------------
const EXPLAINER = [
  {title: 'Flares: a flash of light', body: '<p class="sx-big">☀️⚡</p><p>A <b>solar flare</b> is a sudden flash of light and X-rays from the Sun. It reaches Mars in about 13 minutes, at the speed of light.</p>'},
  {title: 'CMEs: a giant cloud', body: '<p class="sx-big">☀️☁️</p><p>A <b>coronal mass ejection</b> (CME) is a huge cloud of gas and magnetism thrown out by the Sun. It is slower and can take a day or more to travel.</p>'},
  {title: 'Energetic particles: the invisible part', body: '<p class="sx-big">☀️·  ·  ·</p><p>Flares and CMEs can speed up tiny particles. Some events send lots of them towards Mars, many send very few. They can arrive in under an hour or over many hours. They are <b>invisible</b>, so crews rely on sensors and forecasts.</p>'},
];
function explainer(ctx, i = 0, done = () => alertCard(ctx)) {
  const c = EXPLAINER[i];
  ctx.dialog({label: `SPACE WEATHER IN 30 SECONDS · ${i + 1} OF ${EXPLAINER.length}`, title: c.title, body: c.body,
    actions: [{label: i < EXPLAINER.length - 1 ? 'Next ▶' : 'Got it ▶', primary: true, run: () => i < EXPLAINER.length - 1 ? explainer(ctx, i + 1, done) : done()},
      ...(i > 0 ? [{label: '◀ Back', run: () => explainer(ctx, i - 1, done)}] : []), {label: 'Skip', run: done}]});
}
function brief(ctx) {
  const back = ctx.carry.stormOutcome ? '<p>You kept the base safe in the dust storm. This time the danger cannot be seen at all.</p>' : '';
  ctx.dialog({label: 'MARS DAY 18 · MERIDIAN BASE', title: 'A quiet morning', body: `${back}<p>The crew is busy around the habitat. Then the space weather console starts to beep.</p>
    <p>First, a quick look at what the Sun can do.</p>`,
    actions: [{label: '▶ Watch the 30-second explainer', primary: true, run: () => explainer(ctx)}, {label: 'Skip to the alert', run: () => alertCard(ctx)}, {label: 'Mission science', run: () => ctx.sourcesDialog(() => brief(ctx))}]});
}
function alertCard(ctx) {
  ctx.briefing({label: 'SPACE WEATHER ALERT · TO ALL CREW', title: 'Particle warning', body: `
    <div class="kid-mission-intro">
      <p><b>Elena:</b> “An eruption on the Sun may send energetic particles our way. ${ctx.mission.scenario.forecastText} We need a safer place for all five of us.”</p>
    </div>
    <p>Open the refuge tablet first. Use water bags, panels, and cargo to shield the seats where the crew will wait.</p>
    <p><b>Keep the door, vent, and drinking water tap clear.</b></p>`,
    actions: [{label: '▶ Let’s get to work', primary: true, run: () => { ctx.act({id: 'begin'}, {quiet: true}); ctx.saveCheckpoint(); ctx.close(); }}, {label: '☀️ Replay the explainer', run: () => explainer(ctx)}]});
}

// ---- tablet: refuge map (an estimate from the layout, not a particle detector) --------------------
const LEVEL_COLOR = {strong: '#3fcf8e', medium: '#ffc83a', weak: '#ff6b6b'};
const level = t => t < .45 ? 'strong' : t < .62 ? 'medium' : 'weak';
const SEAT_XY = {A: [-1.3, -.45], B: [-.45, -.45], C: [.45, -.45], D: [1.3, -.45], E: [-1.05, .55], F: [1.05, .85]};
function mapSvg(m, picked) {
  const X = x => 200 + x * 95, Y = z => 155 + z * 95;
  const band = (id, x1, y1, x2, y2, w = 10) => { const t = surfaceTransmission(m, id); return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${LEVEL_COLOR[level(t)]}" stroke-width="${w}" stroke-linecap="round"><title>${m.scenario.surfaces[id].label}: lets through about ${Math.round(t * 100)}%</title></line>`; };
  const roof = id => { const t = surfaceTransmission(m, id), x = id === 'roof_l' ? X(-1.8) : X(0); return `<rect x="${x + 6}" y="${Y(-1.4) + 6}" width="${95 * 1.8 - 12}" height="${95 * 2.8 - 12}" rx="8" fill="${LEVEL_COLOR[level(t)]}" opacity=".16"/><text x="${x + 85}" y="${Y(1.2)}" text-anchor="middle" class="sx-roof">${id === 'roof_l' ? 'Roof L' : 'Roof R'} ${Math.round(t * 100)}%</text>`; };
  const seats = SEAT_IDS.map(id => { const [x, z] = SEAT_XY[id], who = PEOPLE.find(p => m.seats[p] === id), t = seatTransmission(m, id);
    return `<g class="sx-seat" data-seat="${id}" tabindex="0" role="button" aria-label="${m.scenario.seats[id].label}${who ? `, ${NAMES[who]}` : ', empty'}"><circle cx="${X(x)}" cy="${Y(z)}" r="27" fill="${LEVEL_COLOR[level(t)]}" stroke="${who && who === picked ? '#fff' : '#120f2e'}" stroke-width="${who && who === picked ? 5 : 2}"/><text x="${X(x)}" y="${Y(z) - 4}" text-anchor="middle">${who ? NAMES[who] : '·'}</text><text x="${X(x)}" y="${Y(z) + 12}" text-anchor="middle" class="sx-small">${id} · ${Math.round(t * 100)}%</text></g>`; }).join('');
  const water = rackWater(m).length, icons = [];
  if (m.rack.built) { const [x, z] = {back_l: [-.85, -1.18], back_r: [.85, -1.18], side_l: [-1.58, .05]}[m.rack.at]; icons.push(`<text x="${X(x)}" y="${Y(z) + 5}" text-anchor="middle">💧${water}</text>`); }
  for (const [z, [x, y]] of Object.entries({shelf_l: [-1.25, .2], shelf_r: [1.25, .2], stack_side: [-1.55, 1.0], stack_back: [.85, -.85], stack_door: [0, 1.1]})) { const n = zoneBags(m, z).length; if (n) icons.push(`<text x="${X(x)}" y="${Y(y)}" text-anchor="middle">🎒${n}${m.zones[z].strapped ? '🔒' : ''}</text>`); }
  for (const r of ['roof_l', 'roof_r', 'back_l', 'back_r']) { const n = railPanels(m, r).length; if (n) { const [x, y] = {roof_l: [-.9, -1.0], roof_r: [.9, -1.0], back_l: [-.9, -1.33], back_r: [.9, -1.33]}[r]; icons.push(`<text x="${X(x)}" y="${Y(y)}" text-anchor="middle">🧱${n}</text>`); } }
  return `<svg class="sx-map" viewBox="0 0 400 330" role="img" aria-label="Top-down map of the refuge">
    <rect x="${X(-1.8)}" y="${Y(-1.4)}" width="${95 * 3.6}" height="${95 * 2.8}" fill="#1c2340" rx="6"/>${roof('roof_l')}${roof('roof_r')}
    ${band('back_l', X(-1.8), Y(-1.4), X(0), Y(-1.4))}${band('back_r', X(0), Y(-1.4), X(1.8), Y(-1.4))}${band('side_l', X(-1.8), Y(-1.4), X(-1.8), Y(1.4))}
    ${band('front', X(-1.8), Y(1.4), X(-.4), Y(1.4))}${band('front', X(.4), Y(1.4), X(1.8), Y(1.4))}
    <text x="${X(0)}" y="${Y(1.4) + 22}" text-anchor="middle" class="sx-small">door → habitat</text><text x="${X(-1.8) - 8}" y="${Y(.95)}" text-anchor="end" class="sx-small">vent</text>
    ${icons.join('')}${seats}</svg>`;
}
function tablet(ctx, picked = null) {
  const m = ctx.mission; if (!m.mapViewed) ctx.act({id: 'openMap'}, {quiet: true});
  const est = estimate(m), canMove = m.phase === 'active' && m.stage === 'prep';
  ctx.dialog({label: 'REFUGE TABLET · ESTIMATE FROM THE LAYOUT', title: 'Refuge map', body: `
    <p class="sx-note">This map <b>estimates</b> protection from what is built. It cannot see particles. Percent = how much would still get through.</p>
    ${mapSvg(m, picked)}
    <p class="sx-legend"><span style="color:${LEVEL_COLOR.strong}">●</span> stronger <span style="color:${LEVEL_COLOR.medium}">●</span> medium <span style="color:${LEVEL_COLOR.weak}">●</span> weaker</p>
    ${canMove ? `<p>${picked ? `Now tap a seat for <b>${NAMES[picked]}</b>.` : 'To change seats, tap a person below, then a seat.'}</p>
    <div class="sx-people">${PEOPLE.map(p => `<button type="button" data-person="${p}" class="${p === picked ? 'picked' : ''}">${NAMES[p]} · ${m.seats[p]} · est. ${est[p]}</button>`).join('')}</div>` : ''}
    <p class="sx-small">Waiting in the plain habitat would be about <b>${est.habitat}</b> units each (estimate).</p>`,
    actions: [{label: 'Close', primary: true, run: () => ctx.close()}, {label: 'Mission science', run: () => ctx.sourcesDialog(() => tablet(ctx, picked))}],
    onOpen: body => {
      body.querySelectorAll('[data-person]').forEach(b => { b.onclick = () => tablet(ctx, b.dataset.person === picked ? null : b.dataset.person); });
      body.querySelectorAll('[data-seat]').forEach(g => { const go = () => { if (!picked || !canMove) return; ctx.act({id: 'moveCrew', targetId: picked, payload: g.dataset.seat}); tablet(ctx); }; g.onclick = go; g.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') go(); }; });
    }});
}

// ---- Elena's help --------------------------------------------------------------------------------
function elena(ctx) {
  ctx.dialog({label: 'CREW HELP', title: 'Elena can do one job', body: `<p><b>Elena:</b> “I can help with one thing while you build. Which one?”</p>
    <div class="mx-plans">${Object.entries(ASSISTS).map(([id, a]) => `<button type="button" class="mx-plan" data-assist="${id}"><span class="mx-plan-icon">${id === 'trolley' ? '🛒' : '🌬️'}</span><b>${a.title}</b><span>${a.text}</span></button>`).join('')}</div>`,
    actions: [{label: 'Not yet', run: () => ctx.close()}],
    onOpen: body => body.querySelectorAll('[data-assist]').forEach(b => { b.onclick = () => { ctx.act({id: 'chooseAssist', payload: b.dataset.assist}); ctx.close(); }; })});
}

// ---- refuge check --------------------------------------------------------------------------------
function check(ctx) {
  ctx.act({id: 'runCheck'}, {quiet: true});
  const list = checkRefuge(ctx.mission), block = blockingIssues(ctx.mission), est = estimate(ctx.mission);
  ctx.dialog({label: 'REFUGE CHECK', title: block.length ? 'Not ready yet' : 'Ready when you are', body: `
    <ul class="sx-check">${list.map(c => `<li class="${c.ok ? 'ok' : c.blocking ? 'bad' : 'warn'}"><b>${c.ok ? '✅' : c.blocking ? '⛔' : '⚠️'} ${c.label}</b>${c.fix ? `<br><span>${c.fix}</span>` : ''}</li>`).join('')}</ul>
    <p>Estimated total for each person: ${PEOPLE.map(p => `${NAMES[p]} <b>${est[p]}</b>`).join(' · ')} <span class="sx-small">(the plain habitat: ${est.habitat})</span></p>
    <p class="sx-small">Starting the watch closes the refuge. You can keep building instead; the particles may start rising before you finish.</p>`,
    actions: [{label: '🚪 Close up and watch the sensors', primary: true, disabled: !!block.length, title: block.length ? block[0].fix : '', run: () => { ctx.act({id: 'ready'}); ctx.close(); }},
      {label: '🔧 Keep working', run: () => ctx.close()}, {label: '📋 Map', run: () => tablet(ctx)}]});
}

// ---- event sensors panel ---------------------------------------------------------------------------
function ensurePanel(ctx) {
  if ($('sx-sensors')) return;
  document.body.insertAdjacentHTML('beforeend', `<section class="sx-sensors" id="sx-sensors" hidden aria-label="Sensor readings">
    <div class="sx-gauges"><div><small>OUTSIDE SENSOR · roof mast</small><b id="sx-out">—</b><span>units per hour</span></div><div><small>REFUGE SENSOR · inside</small><b id="sx-in">—</b><span>units per hour</span></div></div>
    <table class="sx-people-table"><thead><tr><th></th><th>rate now</th><th>total so far</th></tr></thead><tbody id="sx-rows"></tbody></table>
    <div class="sx-tools"><button type="button" id="sx-overlay" aria-pressed="false">✨ Illustration</button><button type="button" id="sx-speed" aria-pressed="false">⏩ Faster</button><button type="button" id="sx-science">🔬 Science</button></div>
    <p class="sx-illus" id="sx-illus" hidden>ILLUSTRATION · real particles are invisible</p></section>
    <div class="sx-tablet-btn"><button type="button" id="sx-tablet">📋 Refuge map</button><button type="button" id="sx-explain">☀️ What is this?</button><button type="button" id="sx-put-back" hidden>Put item back</button></div>`);
  $('sx-overlay').onclick = () => ctx.act({id: 'toggleOverlay'});
  $('sx-speed').onclick = () => { speed = speed === 1 ? 3 : 1; $('sx-speed').setAttribute('aria-pressed', String(speed > 1)); };
  $('sx-science').onclick = () => ctx.sourcesDialog(() => ctx.close());
  $('sx-tablet').onclick = () => { if (ctx.mission.phase === 'active') tablet(ctx); };
  $('sx-put-back').onclick = () => { if (ctx.playing()) ctx.act({id: 'putBack'}); };
  $('sx-explain').onclick = () => explainer(ctx, 0, () => ctx.close());
}
function sensorPanel(ctx) {
  const m = ctx.mission, show = m.phase === 'active' && (m.stage === 'event' || m.stage === 'after' || m.stage === 'cover');
  $('sx-sensors').hidden = !show; if (!show) return;
  const avgIn = PEOPLE.filter(p => m.inside[p]).reduce((a, p) => a + m.rate[p], 0) / Math.max(1, PEOPLE.filter(p => m.inside[p]).length);
  $('sx-out').textContent = m.outsideRate.toFixed(2); $('sx-in').textContent = m.stage === 'event' ? avgIn.toFixed(2) : '0.00';
  $('sx-rows').innerHTML = PEOPLE.map(p => `<tr><th>${NAMES[p]}${m.inside[p] ? '' : ' 🚶'}</th><td>${m.rate[p].toFixed(2)}</td><td><b>${m.exposure[p].toFixed(1)}</b></td></tr>`).join('');
  $('sx-overlay').setAttribute('aria-pressed', String(!!m.overlay)); $('sx-illus').hidden = !m.overlay;
}

// ---- debrief -----------------------------------------------------------------------------------------
function bars(m) {
  const max = Math.max(...PEOPLE.map(p => m.exposure[p]), estimate(m).habitat);
  return `<div class="mx-bars">${PEOPLE.map(p => { const d = m.exposure[p], lv = seatLevel(m, m.seats[p]); return `<div class="mx-barrow"><span>${NAMES[p]} (${m.seats[p]})</span><span class="mx-track"><i style="width:${d / max * 100}%" class="${lv === 'strong' ? 'good' : lv === 'medium' ? 'mid' : 'bad'}"></i><em style="left:${estimate(m).habitat / max * 100}%" title="plain habitat"></em></span><b>${d.toFixed(1)}</b></div>`; }).join('')}</div>
    <p class="mx-legend">Line = what waiting in the plain habitat would have given. Units are made up for the game.</p>`;
}
function debrief(ctx) {
  const m = ctx.mission, r = getResult(m);
  ctx.report.send({outcome: r.outcome, completed: r.completed, success: r.success, mastered: r.mastered, score: r.score, carry: {rating: r.rating, reduction: r.reduction, assist: r.assist, rackAt: r.rackAt}});
  const history = r.completed && !ctx.sampleMode ? pushHistory(ID, {reduction: Math.round(r.reduction * 100), team: r.teamExposure, water: r.water, poly: r.poly, bags: r.bags, minutes: r.minutes, assist: r.assist}) : readHistory(ID);
  ctx.persist(m, true); ctx.setControls(); lastBlueprint = m.blueprint.slice();
  if (!r.completed) { ctx.dialog({label: 'MISSION REPORT', title: 'Practice stopped', body: '<p>That is fine. Real crews practise many times.</p>', actions: [{label: '↺ Start again', primary: true, run: () => ctx.restart()}, {label: '🗺️ Map', run: ctx.openJourney}]}); return; }
  const ex = explain(m), title = {great: '🏆 A strong refuge', ok: '👍 The refuge helped', weak: '🤔 The refuge was thin'}[r.rating];
  const helped = ex.helped.length ? ex.helped.map(h => `<b>${h.label.toLowerCase()}</b>`).join(' and ') : 'nothing much yet';
  const notes = [];
  if (m.onsetDuringPrep) notes.push(`The particles started rising while you were still building, so everyone collected some exposure walking in. Moving inside slowed it down, but it did not undo it.`);
  if (m.slipped.length) notes.push(`${m.slipped.length} loose ${m.slipped.length === 1 ? 'item' : 'items'} slipped down during the wait. Strapping and fastening keeps protection where you put it.`);
  if (m.ventFixedByCrew || m.events.some(e => e.id === 'door-cleared')) notes.push('The crew had to move bags from the vent or the door when they ran in, so those bags stopped helping.');
  const compare = history.length > 1 ? compareTable(history.map((h, i) => i === history.length - 1 ? 'This time' : `Try ${i + 1}`), [
    {label: 'Exposure avoided', values: history.map(h => h.reduction ?? 0), better: 'high', format: v => `${v}%`},
    {label: 'Team average', values: history.map(h => h.team ?? 0), better: 'low'},
    {label: 'Water · panels · bags', values: history.map(h => `${h.water ?? 0}·${h.poly ?? 0}·${h.bags ?? 0}`)},
    {label: 'Work minutes', values: history.map(h => h.minutes ?? 0), better: 'low'}]) : '<p class="mx-last">Try changing one thing to compare layouts here.</p>';
  ctx.dialog({label: 'MISSION REPORT · A PLACE TO HIDE', title, body: `${bars(m)}
    <p>Together you avoided about <b>${Math.round(r.reduction * 100)}%</b> of the exposure you would have had in the plain habitat.</p>
    <div class="kid-lesson-box">
      <span class="lesson-badge">🎓 Space Science Lesson</span>
      <h3>What We Learned About Space Radiation</h3>
      <p><b>🌟 The Big Space Idea:</b> High-energy solar particles are invisible and zip right through thin metal, but materials packed with light hydrogen atoms (like water, food, and polyethylene plastic) slow them down!</p>
      <div class="lesson-fact">
        <b>🚀 Real NASA Science:</b> In real space missions to the Moon and Mars, NASA designs "storm shelters" surrounded by the crew's drinking water tanks and pantry bags. Water and plastic absorb particle radiation without needing thousands of pounds of heavy lead shielding!
      </div>
      <p><b>💡 Your Astronaut Skill:</b> A good shelter protects everyone while keeping emergency doors, vents, and water taps completely accessible.</p>
    </div>
    <p>✅ <b>What helped most:</b> ${helped}.</p>
    <p>🔎 <b>What stayed weaker:</b> ${NAMES[ex.worst]} collected the most. In ${m.scenario.seats[ex.seat].label} the most still came through the <b>${ex.weakest.label.toLowerCase()}</b>.</p>
    ${notes.map(n => `<p class="mx-tip">💡 ${n}</p>`).join('')}${compare}
    <aside class="mx-detail"><b>More details</b><br>These numbers come from a made-up model of this refuge. Real shelters are designed with careful measurements and computer models. Water, plastic and packed supplies all help, and where you put them matters as much as what they are.</aside>`,
    actions: [{label: '🔁 Try changing one thing', primary: true, run: () => retry(ctx)}, {label: '👀 See the cutaway', run: () => cutaway(ctx)},
      {label: '↺ Start over', run: () => ctx.restart()}, {label: '🗺️ Map', run: ctx.openJourney}, {label: 'Mission science', run: () => ctx.sourcesDialog(() => debrief(ctx))}]});
}
function cutaway(ctx) {
  const m = ctx.mission, labels = {};
  for (const p of PEOPLE) { const lv = seatLevel(m, m.seats[p]); labels[p] = `${NAMES[p]} ${m.exposure[p].toFixed(1)}`; labels[`${p}:color`] = LEVEL_COLOR[lv]; }
  ctx.close(); ctx.view.setCutaway(true, labels);
  let b = $('sx-back'); if (!b) { document.body.insertAdjacentHTML('beforeend', '<button type="button" class="sx-back" id="sx-back">◀ Back to the report</button>'); b = $('sx-back'); }
  b.hidden = false; b.focus(); b.onclick = () => { b.hidden = true; ctx.view.setCutaway(false); debrief(ctx); };
}
function retry(ctx) {
  const bp = lastBlueprint || ctx.mission.blueprint.slice();
  // After a page reload the in-memory checkpoint is gone: rebuild it as "just after the alert".
  if (!ctx.checkpoint) { const f = ctx.fresh(); applyAction(f, {id: 'begin'}); ctx.checkpoint = snapshot(f); }
  // Back to the start of the build; offer to rebuild the last layout so the player can change just one thing.
  ctx.retry(() => {
    ctx.dialog({label: 'TRY CHANGING ONE THING', title: 'Back to the alert', body: '<p>You are back at the start of the build, with the same forecast.</p><p>Rebuild your last layout in one go (it uses the same work minutes), then change one thing. Or build from scratch.</p>',
      actions: [{label: '🏗️ Rebuild my last layout', primary: true, disabled: !bp.length, run: () => { const r = applyBlueprint(ctx.mission, bp); ctx.view.sync({animate: false}); ctx.persist(ctx.mission, true); ctx.hud.toast(r.message); ctx.close(); }},
        {label: '🧹 Start from scratch', run: () => ctx.close()}]});
  });
}

runMission({
  id: ID, schema: SHELTER_SCHEMA, title: 'A Place to Hide', place: 'MISSION CONTROL JR. · MARS DAY 18', carryFrom: 'storm',
  migrate: old => migrateSave(old, tuneScenario(ID, shelterScenario)),
  meters: [{id: 'time', icon: '⏱', label: 'Work time used'}, {id: 'shield', icon: '🛡️', label: 'Refuge estimate'}, {id: 'dose', icon: '📈', label: 'Team exposure'}],
  create: carry => createMission({scenario: tuneScenario(ID, shelterScenario), initialCarry: carry}),
  rules: {applyAction, getObjective, getInstruction, getSteps, advance: (m, dt) => advanceMission(m, dt, {speed})},
  scene: ctx => createShelterScene({container: $('world'), getState: () => ctx.mission, act: a => ctx.act(a), onPause: () => ctx.pause(),
    onTablet: () => tablet(ctx), onCheck: () => check(ctx), onElena: () => elena(ctx)}),
  brief, sources, debrief,
  ready(ctx) { ensurePanel(ctx); },
  sampler(ctx) { ctx.act({id: 'begin'}, {quiet: true}); ctx.saveCheckpoint(); },
  hud(ctx) {
    const m = ctx.mission, {hud} = ctx;
    if (!$('sx-sensors')) ensurePanel(ctx);
    if (m.phase === 'active' && m.stage === 'prep') hud.timer(`⏱ ${Math.round(m.minutes)} work-min since the alert · forecast: maybe 1–2 h`);
    else if (m.phase === 'active' && m.stage === 'cover') hud.timer('🚪 In the refuge · waiting for the sensors');
    else if (m.phase === 'active' && m.stage === 'event') hud.timer(`☀️ Particle event · hour ${Math.floor(m.eventHours) + 1} of about ${m.scenario.eventHours}`, m.coverLeft > 0);
    else if (m.phase === 'active' && m.stage === 'after') hud.timer('✅ All clear');
    else hud.timer('');
    hud.meter('time', {value: m.minutes, max: 120, text: `${Math.round(m.minutes)} min`, warn: 0});
    const avg = PEOPLE.reduce((a, p) => a + seatTransmission(m, m.seats[p]), 0) / PEOPLE.length;
    hud.meter('shield', {value: (1 - avg) * 100, max: 70, text: `${Math.round((1 - avg) * 100)}% blocked`, warn: .3});
    hud.meter('dose', {value: Math.max(0, 12 - teamExposure(m)), max: 12, text: teamExposure(m).toFixed(1), warn: .3});
    sensorPanel(ctx);
    $('sx-put-back').hidden = !m.held || m.stage !== 'prep';
    if (m.phase === 'active' && m.stage === 'after' && !ctx.allClearShown && !ctx.busy) {
      ctx.allClearShown = true;
      ctx.dialog({label: 'ALL CLEAR', title: 'The sensors are back to normal', body: '<p>The particle levels have dropped back to normal. Everyone can come out of the refuge.</p>',
        actions: [{label: '📊 See the report', primary: true, run: () => { ctx.close(); ctx.act({id: 'finish'}); }}]});
    }
  },
}).then(ctx => {
  addEventListener('keydown', e => { if (e.code === 'KeyQ' && ctx.playing() && ctx.mission.held) ctx.act({id: 'putBack'}); if (e.code === 'KeyM' && ctx.playing()) tablet(ctx); });
  const restart = ctx.restart; ctx.restart = () => { ctx.allClearShown = false; restart(); };
  const retryFn = ctx.retry; ctx.retry = after => { ctx.allClearShown = false; retryFn(after); };
});
