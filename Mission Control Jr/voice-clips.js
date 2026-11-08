// Recorded voice clips are only used while their line text matches what was recorded
// (voice-recorded.json, written by the voice generators). A rewritten line falls back to the
// browser's own speech voice, so captions and sound never disagree.
import recorded from './voice-recorded.json' with {type:'json'};
export function freshClip(set,id,line,url){return url&&line&&recorded[set]?.[id]===line.text?url:null;}
export function speakLine(line,{muted=false,volume=1}={}){
 try{
  const s=globalThis.speechSynthesis;if(!s||muted||!line?.text)return false;s.cancel();
  const u=new SpeechSynthesisUtterance(line.text);u.rate=.92;u.pitch=/Pip/.test(line.speaker||'')?1.35:1;u.volume=Math.max(0,Math.min(1,volume));s.speak(u);return true;
 }catch{return false;}
}
export function stopSpeech(){try{globalThis.speechSynthesis?.cancel();}catch{}}
export function pauseSpeech(value){try{const s=globalThis.speechSynthesis;if(!s)return;value?s.pause():s.resume();}catch{}}
