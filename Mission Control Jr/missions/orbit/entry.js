import exteriorCss from '../../orbit.css?inline';
import hudCss from '../../hud-redesign.css?inline';
import interiorCss from '../../expansion.css?inline';
import {loadSaved} from '../shared/runtime.js';
import {ORBIT_SCHEMA} from './state.js';
import {readApproach, enterCabin} from './approach-state.js';

const params = new URLSearchParams(location.search);
const inside = enterCabin({saved: loadSaved('orbit', undefined, {schema: ORBIT_SCHEMA}).state,
  approach: readApproach(), sampler: params.get('sampler') === '1', justDocked: params.get('arrival') === 'docked'});

const styles = document.createElement('style');
styles.textContent = inside ? interiorCss : exteriorCss + '\n' + hudCss;
// Keep the kid theme last in both development and bundled production output.
document.head.prepend(styles);

if (inside) {
  // Reloading at docking releases the exterior renderer, audio and input listeners.
  document.body.innerHTML = '<div id="world" aria-label="Three-dimensional Asteria station interior above Mars with a radio rack, power panel, landing planner and lander hatch"></div>';
  params.delete('arrival');
  history.replaceState(null, '', `${location.pathname}${params.size ? '?' + params : ''}${location.hash}`);
  await import('./ui.js');
} else {
  document.body.dataset.approach = 'true';
  await import('../../orbit-demo.js');
}
