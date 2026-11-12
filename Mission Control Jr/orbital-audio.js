// Original, lightweight Web Audio soundscape. No paid assets or synthetic voice.
export class OrbitalAudio{
  constructor(){this.muted=false;this.paused=false;this.started=false;this.mode='orbit';this.currentActive=false;}
  start(){
    const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
    if(!this.ctx){this.ctx=new C();this.master=this.ctx.createGain();this.master.gain.value=.32;this.master.connect(this.ctx.destination);
      const makeLayer=(volume)=>{const gain=this.ctx.createGain();gain.gain.value=0;gain.connect(this.master);return {gain,volume};};
      this.orbit=makeLayer(.16);this.station=makeLayer(.105);this.flight=makeLayer(.12);
      const makeTone=(layer,type,freq,level,detune=0)=>{const osc=this.ctx.createOscillator(),gain=this.ctx.createGain();osc.type=type;osc.frequency.value=freq;osc.detune.value=detune;gain.gain.value=level;osc.connect(gain).connect(layer.gain);osc.start();return osc;};
      // A slow, warm chord gives the orbital panorama a cinematic bed.
      makeTone(this.orbit,'sine',55,.55);makeTone(this.orbit,'triangle',82.41,.17,-5);makeTone(this.orbit,'sine',110,.09,4);
      // Quiet equipment resonance and a soft, modulated cabin air tone.
      this.humLayer=this.ctx.createGain();this.humLayer.gain.value=.5;this.humLayer.connect(this.station.gain);
      this.hum=this.ctx.createOscillator();this.hum.type='sine';this.hum.frequency.value=62;this.hum.connect(this.humLayer);this.hum.start();
      this.harmonic=this.ctx.createOscillator();this.harmonic.type='triangle';this.harmonic.frequency.value=124;const harmonicGain=this.ctx.createGain();harmonicGain.gain.value=.12;this.harmonic.connect(harmonicGain).connect(this.station.gain);this.harmonic.start();
      makeTone(this.flight,'triangle',73,.26);makeTone(this.flight,'sine',146,.12,3);
      this.started=true;
    }
    this.ctx.resume().catch(()=>{});this.update(this.mode);
  }
  update(mode=this.mode){
    this.mode=mode;if(!this.ctx)return;const now=this.ctx.currentTime,active=this.started&&!this.paused&&!this.muted;if(mode===this.appliedMode&&active===this.currentActive)return;this.appliedMode=mode;this.currentActive=active;
    for(const [name,layer]of [['orbit',this.orbit],['station',this.station],['flight',this.flight]])layer.gain.gain.setTargetAtTime(active&&mode===name?layer.volume:0,now,.8);
  }
  setMuted(value){this.muted=Boolean(value);this.update(this.mode);}
  setDucked(value){if(this.ctx)this.master.gain.setTargetAtTime(value?.09:.32,this.ctx.currentTime,.25);}
  ping(){if(!this.ctx||this.muted||this.paused)return;const now=this.ctx.currentTime;for(const [freq,delay]of [[523.25,0],[659.25,.09],[783.99,.18]]){const tone=this.ctx.createOscillator(),gain=this.ctx.createGain();tone.type='sine';tone.frequency.setValueAtTime(freq,now+delay);gain.gain.setValueAtTime(.0001,now+delay);gain.gain.exponentialRampToValueAtTime(.075,now+delay+.025);gain.gain.exponentialRampToValueAtTime(.0001,now+delay+.42);tone.connect(gain).connect(this.master);tone.start(now+delay);tone.stop(now+delay+.45);tone.onended=()=>{tone.disconnect();gain.disconnect();};}}
  dockLock(){if(!this.ctx||this.muted||this.paused)return;try{const now=this.ctx.currentTime;const thud=this.ctx.createOscillator(),thudGain=this.ctx.createGain();thud.type='sine';thud.frequency.setValueAtTime(110,now);thud.frequency.exponentialRampToValueAtTime(38,now+.32);thudGain.gain.setValueAtTime(.32,now);thudGain.gain.exponentialRampToValueAtTime(.0001,now+.35);thud.connect(thudGain).connect(this.master);thud.start(now);thud.stop(now+.38);thud.onended=()=>{thud.disconnect();thudGain.disconnect();};const click=this.ctx.createOscillator(),clickGain=this.ctx.createGain();click.type='triangle';click.frequency.setValueAtTime(1600,now+.04);click.frequency.exponentialRampToValueAtTime(500,now+.12);clickGain.gain.setValueAtTime(.18,now+.04);clickGain.gain.exponentialRampToValueAtTime(.0001,now+.14);click.connect(clickGain).connect(this.master);click.start(now+.04);click.stop(now+.15);click.onended=()=>{click.disconnect();clickGain.disconnect();};const hiss=this.ctx.createOscillator(),hissGain=this.ctx.createGain();hiss.type='sine';hiss.frequency.setValueAtTime(540,now+.18);hiss.frequency.linearRampToValueAtTime(180,now+1.1);hissGain.gain.setValueAtTime(.001,now+.18);hissGain.gain.linearRampToValueAtTime(.065,now+.35);hissGain.gain.exponentialRampToValueAtTime(.0001,now+1.15);hiss.connect(hissGain).connect(this.master);hiss.start(now+.18);hiss.stop(now+1.2);hiss.onended=()=>{hiss.disconnect();hissGain.disconnect();};setTimeout(()=>{if(!this.muted&&!this.paused)this.ping();},800);}catch{}}
  dispose(){this.hum?.stop();this.harmonic?.stop();this.ctx?.close();}
}
