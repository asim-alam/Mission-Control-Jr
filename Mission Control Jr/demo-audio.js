import lines from './dialogue-lines.json';
const voiceFiles=import.meta.glob('./assets/audio/*.ogg',{eager:true,query:'?url',import:'default'});

export class MissionAudio {
  constructor(onLine,onEnd) {this.onLine=onLine;this.onEnd=onEnd;this.queue=[];this.volumes={master:.7,voice:1,effects:.65,ambience:.5};this.muted=false;this.active=null;}
  start() {
    if(this.context){this.context.resume().catch(()=>{});return;}
    const Context=window.AudioContext||window.webkitAudioContext;if(!Context)return;
    this.context=new Context();const c=this.context;
    this.master=c.createGain();this.master.connect(c.destination);
    this.effects=c.createGain();this.effects.connect(this.master);
    this.ambience=c.createGain();this.ambience.connect(this.master);
    const buffer=c.createBuffer(1,c.sampleRate*3,c.sampleRate),data=buffer.getChannelData(0);
    for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;this.noise=buffer;
    const wind=c.createBufferSource();wind.buffer=buffer;wind.loop=true;
    this.windFilter=c.createBiquadFilter();this.windFilter.type='lowpass';this.windFilter.frequency.value=260;
    this.windGain=c.createGain();this.windGain.gain.value=.09;wind.connect(this.windFilter).connect(this.windGain).connect(this.ambience);wind.start();
    const breathing=c.createBufferSource();breathing.buffer=buffer;breathing.loop=true;
    const breathFilter=c.createBiquadFilter();breathFilter.type='bandpass';breathFilter.frequency.value=550;breathFilter.Q.value=.8;
    this.breathGain=c.createGain();this.breathGain.gain.value=.008;
    breathing.connect(breathFilter).connect(this.breathGain).connect(this.ambience);breathing.start();
    this.music=c.createGain();this.music.gain.value=.006;this.music.connect(this.ambience);
    for(const frequency of [110,164.81,220]){const note=c.createOscillator();note.type='sine';note.frequency.value=frequency;note.connect(this.music);note.start();}
    for(const [x,z,f]of[[0,0,65],[5,5,90]]) {
      const oscillator=c.createOscillator();oscillator.frequency.value=f;
      const gain=c.createGain();gain.gain.value=.025;
      const panner=c.createPanner();panner.panningModel='HRTF';panner.distanceModel='inverse';panner.refDistance=2;panner.maxDistance=30;
      panner.positionX.value=x;panner.positionY.value=1;panner.positionZ.value=z;
      oscillator.connect(gain).connect(panner).connect(this.ambience);oscillator.start();
    }
    this.settings();c.resume().catch(()=>{});
  }
  settings(values={}) {
    Object.assign(this.volumes,values);const v=this.volumes;
    if(this.master){this.master.gain.value=this.muted?0:v.master;this.effects.gain.value=v.effects;this.ambience.gain.value=v.ambience*(this.active?.35:1);}
    if(this.voice)this.voice.volume=this.muted?0:Math.min(1,v.master*v.voice);
  }
  setMuted(value) {this.muted=value;this.settings();}
  effect(name) {
    if(!this.context||this.muted)return;
    const c=this.context,t=c.currentTime,g=c.createGain();g.connect(this.effects);
    const noise=['step','brush','door','repair','radio'].includes(name);
    const source=noise?c.createBufferSource():c.createOscillator();
    const duration=name==='brush'?.55:name==='door'?.6:name==='repair'?.25:.13;
    if(noise){source.buffer=this.noise;const filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=name==='step'?450:1200;source.connect(filter).connect(g);source.onended=()=>{filter.disconnect();g.disconnect();};}
    else{source.frequency.value=name==='alarm'?360:660;source.connect(g);source.onended=()=>g.disconnect();}
    g.gain.setValueAtTime(name==='step'?.13:.23,t);g.gain.exponentialRampToValueAtTime(.001,t+duration);
    source.start(t);source.stop(t+duration);
  }
  update(position,yaw,storm,inside) {
    if(!this.context)return;
    const c=this.context,l=c.listener,t=c.currentTime;
    if(l.positionX){l.positionX.value=position.x;l.positionY.value=position.y;l.positionZ.value=position.z;l.forwardX.value=-Math.sin(yaw);l.forwardY.value=0;l.forwardZ.value=-Math.cos(yaw);l.upY.value=1;}
    this.windFilter.frequency.setTargetAtTime(inside?160:260+storm*1800,t,.2);
    this.windGain.gain.setTargetAtTime(inside?.035:.09+storm*.55,t,.2);
    this.breathGain.gain.setTargetAtTime(inside?0:.012+.008*Math.sin(t*1.7),t,.1);
    this.music.gain.setTargetAtTime(inside?.005:.006+storm*.012,t,.2);
  }
  say(id,interrupt=false) {
    if(!lines[id])return;
    if(interrupt)this.stop();
    if(this.active===id||this.queue.includes(id))return;
    this.queue.push(id);if(this.queue.length>3)this.queue.shift();this.next();
  }
  next() {
    if(this.active||!this.queue.length)return;
    const id=this.queue.shift(),line=lines[id];this.active=id;this.last=id;this.onLine(id,line);this.settings();this.effect('radio');
    const done=()=>{if(this.active!==id)return;this.active=null;this.voice=null;clearTimeout(this.fallbackTimer);this.onEnd();this.settings();this.next();};
    const fallback=()=> {
      if(window.speechSynthesis&&this.volumes.voice>0&&!this.muted) {
        const utterance=new SpeechSynthesisUtterance(line.text);utterance.rate=.95;utterance.volume=this.volumes.master*this.volumes.voice;
        const voices=speechSynthesis.getVoices();utterance.voice=voices.find(v=>v.lang.startsWith('en'))||null;
        utterance.onend=done;utterance.onerror=done;speechSynthesis.speak(utterance);
      }
      this.fallbackTimer=setTimeout(done,Math.max(5000,line.text.length*65));
    };
    const url=voiceFiles[`./assets/audio/${id}.ogg`];
    if(url){this.voice=new Audio(url);this.settings();this.voice.onended=done;this.voice.onerror=fallback;this.voice.play().catch(fallback);}else fallback();
  }
  skip() {this.voice?.pause();window.speechSynthesis?.cancel();clearTimeout(this.fallbackTimer);this.active=null;this.voice=null;this.onEnd();this.settings();this.next();}
  stop() {this.queue=[];this.skip();}
  pause(value) {if(this.voice){if(value)this.voice.pause();else this.voice.play().catch(()=>{});}if(window.speechSynthesis){if(value)speechSynthesis.pause();else speechSynthesis.resume();}}
  replay() {if(this.last)this.say(this.last,true);}
}
