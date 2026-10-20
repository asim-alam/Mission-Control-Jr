import {chapterById} from './journey-state.js';
const embedded=window.parent!==window;
export let journeyPaused=false;
let activeChapter='',hold=()=>{};
function send(type,data={}){if(embedded)window.parent.postMessage({source:'mission-control-jr',type,chapter:activeChapter,...data},location.origin);}
export function connectChapter(id,onHold=()=>{}){
  activeChapter=id;hold=onHold;
  if(!embedded){location.replace(`./#${id}`);return;}
  document.documentElement.classList.add('connected-mission');
  window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==window.parent||event.data?.source!=='mission-control-jr-shell')return;if(event.data.type==='hold'){const next=!!event.data.value;if(next===journeyPaused)return;journeyPaused=next;hold(journeyPaused);}});
  document.addEventListener('click',event=>{const anchor=event.target.closest?.('a[href]');if(!anchor||anchor.target==='_blank')return;const url=new URL(anchor.href,location.href);if(url.origin!==location.origin)return;const file=url.pathname.split('/').pop();const chapter=({'orbit.html':'orbit','storm.html':'storm','mission2.html':'rover','campaign.html':'extended'})[file];if(chapter){event.preventDefault();goToChapter(chapter);}else if(file===''||file==='index.html'){event.preventDefault();openJourney();}});
  send('ready');
}
export function completeChapter(id,result={}){send('complete',{chapter:id,result});}
export function goToChapter(id){if(!chapterById(id))return;if(embedded)send('next',{target:id});else location.href=`./#${id}`;}
export function openJourney(){if(embedded)send('menu');else location.href='./';}
