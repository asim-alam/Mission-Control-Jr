export const JOURNEY_KEY='mission-control-jr.journey.v1';
export const CHAPTERS=[
  {id:'orbit',number:'01',sol:'SOL 11',title:'Arrival at Mars',file:'orbit.html',tag:'DOCK · RESTORE · DESCEND',description:'Reach Asteria, restore the relay, and bring Jin safely to Outpost Meridian.'},
  {id:'storm',number:'02',sol:'SOL 12',title:'Before the Storm',file:'storm.html',tag:'DIAGNOSE · REPAIR · PROTECT',description:'A dust front is approaching. Protect the four-person crew and keep Meridian running.'},
  {id:'rover',number:'03',sol:'SOL 16',title:'Tracks in the Dust',file:'mission2.html',tag:'PLAN · EXPLORE · RETURN',description:'Drive with Amara to Kestrel Ridge, document the evidence, and bring the crew home.'},
  {id:'extended',number:'+',sol:'EXTENDED SIMULATION',title:'Thirty Sols',file:'campaign.html',tag:'COMMAND · ADAPT · SUSTAIN',description:'Apply your field lessons in a longer command exercise with crew and resource decisions.'},
];
export const storyChapters=CHAPTERS.slice(0,3);
export const chapterById=id=>CHAPTERS.find(chapter=>chapter.id===id);
export const createJourney=()=>({version:1,current:'orbit',completed:[],records:{}});
export function readJourney(storage){try{const saved=JSON.parse(storage.getItem(JOURNEY_KEY)||'null');if(saved?.version!==1)return createJourney();const state=createJourney();state.current=chapterById(saved.current)?.id||'orbit';state.completed=CHAPTERS.filter(chapter=>Array.isArray(saved.completed)&&saved.completed.includes(chapter.id)).map(chapter=>chapter.id);for(const id of state.completed){const record=saved.records?.[id];if(record&&typeof record==='object')state.records[id]={outcome:String(record.outcome||'Complete').slice(0,80),assisted:!!record.assisted,score:Number.isFinite(record.score)?Math.max(0,Math.min(100,record.score)):null};}return state;}catch{return createJourney();}}
export function saveJourney(state,storage){try{storage.setItem(JOURNEY_KEY,JSON.stringify(state));return true;}catch{return false;}}
export function finishChapter(state,id,result={}){if(!chapterById(id)||result.success===false)return false;if(!state.completed.includes(id))state.completed.push(id);state.records[id]={outcome:String(result.outcome||'Complete').slice(0,80),assisted:!!result.assisted,score:Number.isFinite(result.score)?Math.max(0,Math.min(100,result.score)):null};return true;}
export function nextStoryChapter(state){return storyChapters.find(chapter=>!state.completed.includes(chapter.id))?.id||'extended';}
export const storyComplete=state=>storyChapters.every(chapter=>state.completed.includes(chapter.id));
