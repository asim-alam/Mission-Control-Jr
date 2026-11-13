// Shared HUD for the expansion missions: meters, the job card with a step checklist,
// a look-to-use prompt, an edge arrow toward the next target, walk-to buttons,
// optional narration, and the story/plan/debrief dialog.
import {learningMode} from '../../simulation/learning.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
const NARRATION_KEY = 'mission-control-jr.narration.v1';
const LEARNING_KEY = 'mission-control-jr.learning-mode.v1';
const store = {
  get(k, d) { try { return localStorage.getItem(k) ?? d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch {} },
};

/** Build the HUD once, synchronously, before Pip starts watching #objective. */
export function buildHud({title, place, meters}) {
  document.body.insertAdjacentHTML('beforeend', `
  <header class="mx-top">
    <div class="mx-title"><small>${esc(place)}</small><h1>${esc(title)}</h1></div>
    <div class="mx-timer" id="mx-timer" hidden></div>
    <div class="mx-actions">
      <button id="view" type="button" hidden>First person</button>
      <button id="zoom-out" type="button" aria-label="Zoom out">−</button><button id="zoom-in" type="button" aria-label="Zoom in">+</button>
      <button id="pause" type="button">⏸️ Pause</button><button id="journey" type="button">🗺️ Map</button>
    </div>
  </header>
  <section class="mx-meters" id="mx-meters" aria-label="Mission supplies">${meters.map(m => `
    <div class="mx-meter" data-meter="${m.id}"><span class="mx-meter-icon" aria-hidden="true">${m.icon}</span><span class="mx-meter-body"><span class="mx-meter-label">${esc(m.label)}</span><span class="mx-bar"><i></i></span><b class="mx-meter-value">—</b></span></div>`).join('')}
  </section>
  <section class="mx-job mission-guidance" aria-label="Your job">
    <div class="mx-job-heading">
      <p class="mx-eyebrow" id="mx-job-count">Your job now</p>
      <div class="mx-job-tools">
        <button id="mx-job-details" type="button" aria-expanded="false" aria-controls="mx-details">Details</button>
      </div>
    </div>
    <div id="objective"><h2>Loading…</h2></div>
    <div class="mx-task-distance-row" id="mx-task-distance-row" aria-live="polite" hidden>
      <span class="mx-task-dest-badge" id="mx-task-dest-name">📍 Destination</span>
      <span class="mx-task-dist-badge" id="mx-task-dist-value">🚀 — m</span>
    </div>
    <p class="mx-instruction" id="mx-instruction" aria-live="polite" hidden></p>
    <div id="mx-details" hidden>
      <ol class="mx-steps" id="mx-steps"></ol>
      <p class="mx-keys">WASD to walk · tap Places to walk there · drag to look · E to use · V to switch view</p>
    </div>
    <p class="mx-notice" id="notice" role="status" aria-live="polite"></p>
  </section>
  <div class="mx-crosshair" aria-hidden="true"></div>
  <div class="mx-edge" id="mx-edge" aria-hidden="true">➤</div>
  <div class="mx-prompt" id="mx-prompt" hidden><button type="button" id="mx-use"><kbd>E</kbd><span id="mx-use-label"></span><i class="mx-hold" id="mx-hold"></i></button></div>
  <section class="mx-walk" aria-label="Walk to a place">
    <button id="mx-next-place" type="button" hidden></button>
    <details id="mx-places"><summary>Places</summary><div id="locations"></div></details>
  </section>
  <div class="mx-toast" id="mx-toast" role="status" aria-live="polite"></div>
  <div id="dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title" hidden><div class="card"><p class="eyebrow" id="dialog-label"></p><h2 id="dialog-title"></h2><div id="dialog-body"></div><div id="dialog-actions"></div></div></div>`);
  const syncDetails = () => document.body.classList.toggle('mx-details-on', learningMode() === 'details');
  const details = $('mx-job-details'), steps = $('mx-details');
  details.onclick = () => {
    steps.hidden = !steps.hidden;
    details.setAttribute('aria-expanded', String(!steps.hidden));
  };
  syncDetails();
  const nextPlace = $('mx-next-place'), places = $('mx-places');
  let destinations = [], walk = () => {}, currentPlace;
  nextPlace.onclick = () => walk(currentPlace);
  let toastTimer = 0, lastObjective = '', lastStepsKey = '';
  const hud = {
    toggleNarration() {
      store.set(NARRATION_KEY, narration() ? 'off' : 'on');
      if (!narration()) try { speechSynthesis.cancel(); } catch {}
    },
    toggleScience() {
      store.set(LEARNING_KEY, learningMode() === 'details' ? 'simple' : 'details');
      syncDetails();
    },
    meter(id, {value, max = 100, text, warn = .25}) {
      const el = document.querySelector(`[data-meter="${id}"]`); if (!el) return;
      const f = Math.max(0, Math.min(1, value / max));
      el.querySelector('i').style.width = `${f * 100}%`;
      el.querySelector('.mx-meter-value').textContent = text ?? `${Math.round(f * 100)}%`;
      el.classList.toggle('low', f < warn); el.classList.toggle('mid', f >= warn && f < .5);
    },
    timer(text, urgent = false) { const t = $('mx-timer'); t.hidden = !text; t.textContent = text || ''; t.classList.toggle('urgent', urgent); },
    objective(text, {read = true} = {}) {
      if (text === lastObjective) return; lastObjective = text;
      $('objective').innerHTML = `<h2>${esc(text)}</h2>`;
      if (read) speak(text);
    },
    instruction(instruction) {
      const line = $('mx-instruction'), text = instruction?.text || '';
      if (text !== line.textContent) {
        line.textContent = text;
        if (text) speak(text);
      }
      line.hidden = !text;
      currentPlace = instruction?.place;
      const target = destinations.find(t => t.id === currentPlace);
      const label = target ? `Walk to ${(instruction.marker || target.label).replace(/^[^\p{L}]+/u, '')}` : '';
      if (label !== nextPlace.textContent) nextPlace.textContent = label;
      nextPlace.hidden = !target;
      for (const button of $('locations').children) {
        const destination = destinations.find(t => t.id === button.dataset.place);
        button.hidden = destination.id === currentPlace || (destination.visible && !destination.visible());
      }
    },
    steps(list) {
      const key = JSON.stringify(list); if (key === lastStepsKey) return; lastStepsKey = key;
      const current = list.findIndex(item => item.now);
      $('mx-job-count').textContent = current >= 0 ? `Step ${current + 1} of ${list.length}` : 'Mission objective';
      $('mx-steps').innerHTML = list.map(s => `<li class="${s.done ? 'done' : s.now ? 'now' : ''}">${s.done ? '✅' : s.now ? '👉' : '⬜'} <span>${esc(s.text)}</span>${s.now ? ' <span class="step-live-distance-badge" id="step-live-dist"></span>' : ''}</li>`).join('');
    },
    updateDistanceTracker({destination, distance, ready = false, places = null} = {}) {
      const row = $('mx-task-distance-row');
      if (row) {
        if (!destination && distance == null) {
          row.hidden = true;
        } else {
          row.hidden = false;
          const nameEl = $('mx-task-dest-name');
          const distEl = $('mx-task-dist-value');
          if (nameEl && destination) nameEl.textContent = `📍 ${destination}`;
          if (distEl && distance != null) {
            distEl.textContent = ready ? `🚀 ${distance.toFixed(1)} m · In reach! ✨` : `🚀 ${distance.toFixed(1)} m away`;
            distEl.classList.toggle('ready', Boolean(ready));
          }
        }
      }
      const stepDist = $('step-live-dist');
      if (stepDist) {
        if (distance != null) {
          stepDist.textContent = ready ? '📍 In reach!' : `📍 ${distance.toFixed(1)} m`;
          stepDist.classList.toggle('ready', Boolean(ready));
          stepDist.hidden = false;
        } else {
          stepDist.hidden = true;
        }
      }
      if (nextPlace && !nextPlace.hidden && currentPlace && distance != null) {
        const target = destinations.find(t => t.id === currentPlace);
        if (target) {
          const cleanName = target.label.replace(/^[^\p{L}]+/u, '');
          nextPlace.textContent = ready ? `At ${cleanName} · In reach` : `Walk to ${cleanName} · ${distance.toFixed(1)} m`;
        }
      }
      if (places && $('locations')) {
        for (const button of $('locations').children) {
          const pDist = places[button.dataset.place];
          if (pDist != null) {
            const destObj = destinations.find(t => t.id === button.dataset.place);
            const baseLabel = destObj ? destObj.label : button.dataset.place;
            button.innerHTML = `<span>${esc(baseLabel)}</span> <b class="place-dist-chip">${pDist.toFixed(1)} m</b>`;
          }
        }
      }
    },
    notice(text, warning = false) {
      const notice = $('notice');
      notice.textContent = text || '';
      notice.classList.toggle('is-warning', warning);
    },
    toast(text, kind = 'info') {
      const t = $('mx-toast'); t.textContent = text; t.className = `mx-toast show ${kind}`; clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { t.className = 'mx-toast'; }, 3200); if (kind !== 'quiet') speak(text);
    },
    prompt(focus) {
      const p = $('mx-prompt'); p.hidden = !focus;
      if (focus) { $('mx-use-label').textContent = focus.label; p.classList.toggle('holdable', !!focus.hold); p.querySelector('kbd').textContent = focus.hold ? 'Hold E' : 'E'; }
    },
    hold(progress) { $('mx-hold').style.setProperty('--p', progress); $('mx-prompt').classList.toggle('holding', progress > 0); },
    edge(info) {
      const e = $('mx-edge');
      if (!info || info.onScreen) { e.classList.remove('show'); return; }
      let x = info.x - .5, y = info.y - .5; if (info.behind) { x = -x; y = -y; if (Math.abs(x) < .05) y = .5; }
      const a = Math.atan2(y, x), r = Math.min(.42 / Math.abs(Math.cos(a) || 1e-6), .4 / Math.abs(Math.sin(a) || 1e-6));
      e.style.left = `${50 + Math.cos(a) * r * 100}%`; e.style.top = `${50 + Math.sin(a) * r * 100}%`; e.style.transform = `translate(-50%,-50%) rotate(${a}rad)`; e.classList.add('show');
    },
    walkButtons(list, onWalk) {
      destinations = list;
      walk = onWalk;
      $('locations').replaceChildren(...list.map(({id, label}) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = label;
        button.dataset.place = id;
        button.onclick = () => {
          places.open = false;
          places.querySelector('summary').focus({preventScroll: true});
          onWalk(id);
        };
        return button;
      }));
    },
  };
  return hud;
}

export function narration() { return store.get(NARRATION_KEY, 'off') === 'on'; }
/** Read text aloud when narration is on. Never throws. */
export function speak(text, force = false) {
  if (!force && !narration()) return;
  try { const s = speechSynthesis; s.cancel(); const u = new SpeechSynthesisUtterance(String(text).replace(/<[^>]+>/g, ' ')); u.rate = .95; u.pitch = 1.1; u.lang = 'en-US'; s.speak(u); } catch {}
}

/**
 * Show the dialog. body is trusted HTML authored in the mission. actions: [{label, run, primary, disabled}].
 * Detail blocks marked class="mx-detail" only show when Details is on.
 */
export function dialog({label = '', title, body, actions, onOpen}) {
  $('dialog-label').textContent = label; $('dialog-title').textContent = title; $('dialog-body').innerHTML = body;
  $('dialog-actions').replaceChildren(...actions.map(a => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = a.label; b.disabled = !!a.disabled;
    if (a.primary) b.classList.add('primary'); if (a.title) b.title = a.title; b.onclick = a.run; return b;
  }));
  $('dialog').hidden = false; onOpen?.($('dialog-body'));
  ($('dialog-actions').querySelector('button.primary:not(:disabled)') || $('dialog-actions').querySelector('button:not(:disabled)'))?.focus();
  if (narration()) speak(`${title}. ${$('dialog-body').innerText}`);
}
export function closeDialog() { $('dialog').hidden = true; try { speechSynthesis.cancel(); } catch {} }
export const dialogOpen = () => !$('dialog').hidden;

/** A plan card list used for strategy choices. options: [{id, icon, title, text, cost}] */
export function planCards(options, selected) {
  return `<div class="mx-plans">${options.map(o => `<button type="button" class="mx-plan${o.id === selected ? ' picked' : ''}" data-plan="${o.id}"><span class="mx-plan-icon">${o.icon}</span><b>${esc(o.title)}</b><span>${esc(o.text)}</span>${o.cost ? `<small>${esc(o.cost)}</small>` : ''}</button>`).join('')}</div>`;
}

/** Side-by-side comparison of this attempt and earlier ones. rows: [{label, values:[...], better:'high'|'low'}] */
export function compareTable(headers, rows) {
  return `<table class="mx-compare"><thead><tr><th></th>${headers.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => {
    const nums = r.values.map(v => typeof v === 'number' ? v : NaN), best = r.better === 'low' ? Math.min(...nums.filter(Number.isFinite)) : Math.max(...nums.filter(Number.isFinite));
    return `<tr><th>${esc(r.label)}</th>${r.values.map((v, i) => `<td class="${r.better && nums[i] === best && nums.filter(Number.isFinite).length > 1 ? 'best' : ''}">${esc(r.format ? r.format(v) : v)}</td>`).join('')}</tr>`;
  }).join('')}</tbody></table>`;
}
