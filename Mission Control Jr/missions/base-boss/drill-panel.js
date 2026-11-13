import {cropGoal, drillOutcome, evidence, newDrill, replyMinute, solarForTurn, stages, tryPlan} from './outpost-drill.js';

function content(tag, text, className) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.textContent = text;
  return el;
}

function sourceLink(id) {
  const {label, href} = evidence[id];
  const link = content('a', label);
  link.href = href;
  link.target = '_blank';
  link.rel = 'noopener';
  return link;
}

function dial(label, value, detail) {
  const dial = document.createElement('div');
  dial.className = 'drill-dial';
  dial.append(content('span', label, 'panel-label'), content('strong', value), content('small', detail));
  return dial;
}

export function mountDrill(root, onChange) {
  const body = root.querySelector('#drill-content');
  let run = newDrill();

  function render() {
    const phase = stages[run.turn];
    const outcome = drillOutcome(run);
    const last = run.history.at(-1);
    const phaseLabel = content('span', phase ? `SHIFT ${run.turn + 1} OF ${stages.length}` : 'MISSION REVIEW', 'panel-label');
    const title = content('h2', phase?.title || outcome.title);
    title.id = 'drill-title';
    title.tabIndex = -1;
    const brief = content('p', phase?.brief || outcome.summary, 'drill-brief');
    const stats = document.createElement('div');
    stats.className = 'drill-dials';
    stats.append(
      dial('BATTERY', `${run.battery} / 7`, phase ? `${solarForTurn(run.turn)} solar power this shift` : 'Training power units'),
      dial('CREW RESERVES', `${run.air} air · ${run.water} water`, run.shieldWater ? `${run.shieldWater} water set aside as shielding` : 'Stored training units'),
      dial('GROWTH', `${run.crop} / ${cropGoal} cycles`, run.crop === cropGoal ? 'Harvest ready' : 'Light and water cycles'),
    );
    body.replaceChildren(phaseLabel, title, brief, stats);
    if (phase && run.turn > 0) {
      const minutes = replyMinute - run.turn * 10;
      body.append(content('p', `Earth reply in about ${Math.round(minutes)} mission minutes. You can act while you wait.`, 'drill-radio'));
    }
    if (last && phase) body.append(content('p', last.effects, 'drill-effect'));
    if (phase) {
      body.append(content('h3', phase.choice));
      const options = document.createElement('div');
      options.className = 'drill-options';
      for (const choice of phase.options) {
        const next = tryPlan(run, choice.id);
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'drill-option';
        button.disabled = !next;
        button.setAttribute('aria-label', choice.name);
        const forecast = next ? `After this shift · ${next.battery} battery · ${next.air} air · ${next.water} water · ${next.crop}/${cropGoal} grow cycles` +
          (choice.protection ? ` · ${Math.round(next.exposure)} exposure points` : '') : 'Needs two available water units.';
        const info = run.crop === cropGoal && choice.id === 'wait'
          ? 'Use 1 stored air unit during the wait. Restore 4 power. The crop is ready, so its lights can stay off.'
          : choice.info;
        button.append(content('strong', choice.name), content('span', info), content('small', forecast));
        button.onclick = () => {
          run = next;
          onChange(run);
          render();
          body.scrollIntoView({block: 'start', behavior: 'instant'});
          body.querySelector('h2').focus({preventScroll: true});
        };
        options.append(button);
      }
      body.append(options);
    } else {
      const list = document.createElement('ol');
      list.className = 'drill-history';
      for (const event of run.history) {
        const item = document.createElement('li');
        item.append(content('strong', event.name), content('p', event.effects));
        list.append(item);
      }
      const replay = content('button', 'Replay the drill', 'primary');
      replay.type = 'button';
      replay.onclick = () => {
        run = newDrill();
        onChange(run);
        render();
        body.scrollIntoView({block: 'start', behavior: 'instant'});
        body.querySelector('h2').focus({preventScroll: true});
      };
      body.append(list, replay);
    }
    const provenance = document.createElement('details');
    provenance.className = 'drill-sources';
    provenance.append(content('summary', 'NASA data behind this shift'));
    const ids = phase?.sources || Object.keys(evidence);
    for (const id of ids) {
      provenance.append(sourceLink(id), content('p', evidence[id].fact));
    }
    provenance.append(content('p', 'The power, water, crop cycles and shelter protection are game units. The drill uses archived solar output, a Curiosity radiation observation and a dated Earth–Mars light-time calculation.'));
    body.append(provenance);
  }

  root.addEventListener('close', () => onChange(null));
  return {
    get open() { return root.open; },
    get state() { return root.open ? run : null; },
    show() {
      render();
      root.showModal();
      onChange(run);
      body.querySelector('h2').focus({preventScroll: true});
    },
  };
}
