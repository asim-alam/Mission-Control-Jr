import {restoreOrbit} from './orbital-mission.js';

// Optional arrival history adds context without altering surface mission prerequisites.
export function attachArrivalContext(){try{const arrival=restoreOrbit(localStorage);if(!arrival?.complete)return;const copy=document.querySelector('.landing-copy');if(!copy)return;const note=document.createElement('p');note.className='landing-note';note.textContent='ARRIVAL QUALIFIED · Asteria relay verified · landed at Meridian';copy.append(note);}catch{/* Browser storage is optional. */}}
