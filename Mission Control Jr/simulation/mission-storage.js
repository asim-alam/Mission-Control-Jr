const prefix='mission-control-jr.active-attempt.v1.';
const maxBytes=500_000;
const browserStorage=()=>globalThis.localStorage;
const validState=(id,state)=>state&&state.missionId===id&&['brief','inspect','active','debrief','suspended'].includes(state.phase)&&Number.isFinite(state.simSeconds)&&state.simSeconds>=0&&(state.events===undefined||Array.isArray(state.events)&&state.events.length<=200);

/** Persist only a validated, versioned controller snapshot; storage failure never blocks play. */
export function saveActiveAttempt(id,snapshot,storage){
 try{
  const state=JSON.parse(snapshot);
  if(!/^[a-z0-9-]{1,40}$/.test(id)||state?.version!==1||!validState(id,state.state))return false;
  const encoded=JSON.stringify({version:1,missionId:id,savedAt:Date.now(),snapshot});
  if(encoded.length>maxBytes)return false;
  (storage??browserStorage()).setItem(prefix+id,encoded);return true;
 }catch{return false;}
}

export function loadActiveAttempt(id,storage){
 try{
  const raw=(storage??browserStorage()).getItem(prefix+id);if(!raw)return null;
  const saved=JSON.parse(raw);if(saved?.version!==1||saved.missionId!==id||typeof saved.snapshot!=='string'||saved.snapshot.length>maxBytes)return null;
  const value=JSON.parse(saved.snapshot);if(value?.version!==1||!validState(id,value.state))return null;
  return saved.snapshot;
 }catch{return null;}
}

export function clearActiveAttempt(id,storage){try{(storage??browserStorage()).removeItem(prefix+id);return true;}catch{return false;}}
