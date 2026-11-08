import {MISSIONS,missionById,missionsFor} from './mission-registry.js';
export const JOURNEY_KEY='mission-control-jr.journey.v1'; // Retain the storage key to migrate existing saves in place.
export const CHAPTERS=MISSIONS;
export const storyChapters=missionsFor('mars');
export const chapterById=missionById;
export const createJourney=()=>({version:2,current:'orbit',selectedCampaign:'mars',campaigns:{mars:{current:'orbit'},moon:{current:'lunar-sunlight'}},completed:[],records:{},attempts:{}});
export function completionStatus(record){
  if(record?.mastered)return '🏆 Super job!';
  if(record?.success)return '✓ Done! Try another plan?';
  return 'Stopped safely · try again!';
}

// Bound untrusted save data without truncating carry at twelve fields.
function safeValue(value,depth=0){
  if(value===null||typeof value==='boolean')return value;
  if(typeof value==='string')return value.slice(0,500);
  if(typeof value==='number')return Number.isFinite(value)?value:null;
  if(depth>=4)return null;
  if(Array.isArray(value))return value.slice(0,50).map(v=>safeValue(v,depth+1));
  if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).filter(([k])=>!['__proto__','prototype','constructor'].includes(k)).slice(0,100).map(([k,v])=>[k,safeValue(v,depth+1)]));
  return null;
}
function cleanRecord(record){
  const attemptCompleted=typeof record?.attemptCompleted==='boolean'?record.attemptCompleted:record?.completed!==false;
  const success=typeof record?.success==='boolean'?record.success:attemptCompleted;
  return {outcome:String(record?.outcome||'Complete').slice(0,80),assisted:!!record?.assisted,score:Number.isFinite(record?.score)?Math.max(0,Math.min(100,record.score)):null,completed:attemptCompleted,attemptCompleted,success,mastered:record?.mastered===true,...(record?.carry&&typeof record.carry==='object'?{carry:safeValue(record.carry)}:{})};
}
export function readJourney(storage){
  try{
    const saved=JSON.parse(storage.getItem(JOURNEY_KEY)||'null');
    if(!saved || ![1,2].includes(saved.version))return createJourney();
    const state=createJourney();
    state.current=missionById(saved.current)?.id||'orbit';
    state.selectedCampaign=['mars','moon'].includes(saved.selectedCampaign)?saved.selectedCampaign:'mars';
    for(const campaign of ['mars','moon']){
      const current=missionById(saved.campaigns?.[campaign]?.current);
      if(current?.campaign===campaign)state.campaigns[campaign].current=current.id;
    }
    state.completed=MISSIONS.filter(m=>Array.isArray(saved.completed)&&saved.completed.includes(m.id)).map(m=>m.id);
    for(const id of state.completed)if(saved.records?.[id]&&typeof saved.records[id]==='object')state.records[id]=cleanRecord(saved.records[id]);
    for(const mission of MISSIONS){const attempts=saved.attempts?.[mission.id];if(Array.isArray(attempts))state.attempts[mission.id]=attempts.slice(-20).map(v=>safeValue(v));}
    return state;
  }catch{return createJourney();}
}
export function saveJourney(state,storage){try{storage.setItem(JOURNEY_KEY,JSON.stringify(state));return true;}catch{return false;}}
export function readMissionCarry(storage){const journey=readJourney(storage),storm=journey.records.storm?.carry||{},rover=journey.records.rover?.carry||{};return {stormOutcome:['prepared','survived','evacuated'].includes(storm.stormOutcome)?storm.stormOutcome:null,successfulTraverse:rover.mission2Outcome==='success'};}
export function finishChapter(state,id,result={}){
  if(!missionById(id))return false;
  state.attempts ||= {};
  const attemptCompleted=typeof result.attemptCompleted==='boolean'?result.attemptCompleted:result.success!==false;
  const success=typeof result.success==='boolean'?result.success:attemptCompleted;
  const mastered=attemptCompleted&&success&&result.mastered===true;
  const normalized={...result,completed:attemptCompleted,attemptCompleted,success,mastered};
  const attempt=cleanRecord(normalized);
  (state.attempts[id] ||= []).push(attempt);state.attempts[id]=state.attempts[id].slice(-20);
  if(!attemptCompleted)return false;
  if(!state.completed.includes(id))state.completed.push(id);
  const prior=state.records[id];
  if(!prior || !prior.mastered || attempt.mastered)state.records[id]=cleanRecord(normalized);
  return success;
}
export function nextStoryChapter(state,campaign='mars'){return missionsFor(campaign).find(chapter=>!state.completed.includes(chapter.id))?.id||(campaign==='mars'?'extended':null);}
export const storyComplete=(state,campaign='mars')=>missionsFor(campaign).every(chapter=>state.completed.includes(chapter.id));
