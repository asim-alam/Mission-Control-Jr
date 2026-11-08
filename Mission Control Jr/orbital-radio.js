import lines from './dialogue-lines-orbit.json';
import {freshClip,speakLine,stopSpeech,pauseSpeech} from './voice-clips.js';
const clips=import.meta.glob('./assets/audio-orbit/*.ogg',{eager:true,query:'?url',import:'default'});

// One recorded voice at a time; replacing a line invalidates its old handlers.
export class OrbitalRadio{
  constructor(onLine,onEnd,onDuck,onStatus=()=>{}){this.onStatus=onStatus;this.onLine=onLine;this.onEnd=onEnd;this.onDuck=onDuck;this.voice=null;this.last='arrival';this.token=0;this.paused=false;this.muted=false;}
  say(id){if(!lines[id])return;this.stop();this.last=id;this.active=id;const token=this.token,url=freshClip('orbit',id,lines[id],clips[`./assets/audio-orbit/${id}.ogg`]);this.onLine(lines[id]);this.onDuck(true);if(!url){speakLine(lines[id],{muted:this.muted});this.onDuck(false);return;}const voice=this.voice=new Audio(url);voice.volume=.85;voice.muted=this.muted;voice.onplaying=()=>{if(token===this.token)this.onStatus('VOICE PLAYING');};voice.onpause=()=>{if(token===this.token)this.onStatus('VOICE PAUSED');};voice.onended=()=>{if(token===this.token)this.stop();};voice.onerror=()=>{if(token===this.token){this.onDuck(false);this.onStatus('VOICE UNAVAILABLE · REPLAY');}};if(!this.paused)voice.play().catch(()=>{if(token===this.token){this.onDuck(false);this.onStatus('PRESS REPLAY FOR VOICE');}});}
  stop(){stopSpeech();this.token++;if(this.voice){this.voice.pause();this.voice.onended=null;this.voice.onerror=null;this.voice.onplaying=null;this.voice.onpause=null;this.voice=null;}this.active=null;this.onDuck(false);this.onEnd();}
  replay(){this.say(this.last);}
  pause(value){if(this.paused===!!value)return;this.paused=!!value;pauseSpeech(this.paused);if(!this.voice)return;if(value)this.voice.pause();else this.voice.play().catch(()=>{});}
  setMuted(value){this.muted=!!value;if(this.voice)this.voice.muted=this.muted;}
}
