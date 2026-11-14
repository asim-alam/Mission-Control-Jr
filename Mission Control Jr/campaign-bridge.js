import {chapterById,CHAPTERS} from './journey-state.js';
import {journeyUrl} from './mission-routes.js';
const embedded=window.parent!==window;
export let journeyPaused=false;
let activeChapter='',hold=()=>{};
function send(type,data={}){if(embedded)window.parent.postMessage({source:'mission-control-jr',type,chapter:activeChapter,...data},location.origin);}
const routeFor=id=>journeyUrl(location.href,id).href;
export function connectChapter(id,onHold=()=>{}){
  activeChapter=id;hold=onHold;
  if(!embedded){location.replace(routeFor(id));return;}
  document.documentElement.classList.add('connected-mission');
  window.addEventListener('message',event=>{if(event.origin!==location.origin||event.source!==window.parent||event.data?.source!=='mission-control-jr-shell')return;if(event.data.type==='hold'){const next=!!event.data.value;if(next===journeyPaused)return;journeyPaused=next;hold(journeyPaused);}});
  document.addEventListener('click',event=>{const anchor=event.target.closest?.('a[href]');if(!anchor||anchor.target==='_blank')return;const url=new URL(anchor.href,location.href);if(url.origin!==location.origin)return;const file=url.pathname.split('/').pop();const chapter=CHAPTERS.find(c=>c.id===file||c.file===file||c.path===file)?.id;if(chapter){event.preventDefault();goToChapter(chapter);}else if(file===''||file==='index.html'){event.preventDefault();openJourney();}});
  send('ready');
}
export function completeChapter(id,result={}){send('complete',{chapter:id,result});}
export function goToChapter(id){if(!chapterById(id))return;if(embedded)send('next',{target:id});else location.href=routeFor(id);}
export function openJourney(mode='map'){if(embedded)send(mode);else location.href=mode==='menu'?'./':'./mission-map';}
export function openTeacherLesson(){if(embedded)send('teacher-lesson');else location.href='./?lesson=all-missions';}
