// Synthesized audio replaces the MP3s missing from the supplied project.
let context;
let master;
let muted = false;

export function startAudio() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  if (!context) {
    context = new AudioContext();
    master = context.createGain();
    master.gain.value = muted ? 0 : 0.12;
    master.connect(context.destination);
    for (const frequency of [55, 82.4]) {
      const tone = context.createOscillator();
      const gain = context.createGain();
      tone.frequency.value = frequency;
      gain.gain.value = 0.08;
      tone.connect(gain).connect(master);
      tone.start();
    }
  }
  context.resume().catch(() => {});
}

export function setMuted(value) {
  muted = value;
  if (master) master.gain.setTargetAtTime(muted ? 0 : 0.12, context.currentTime, 0.03);
}

export function playBeep() {
  if (muted || !context) return;
  const tone = context.createOscillator();
  const gain = context.createGain();
  const now = context.currentTime;
  tone.frequency.setValueAtTime(660, now);
  tone.frequency.exponentialRampToValueAtTime(440, now + 0.08);
  gain.gain.setValueAtTime(0.5, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
  tone.connect(gain).connect(master);
  tone.start(now);
  tone.stop(now + 0.12);
  tone.onended = () => { tone.disconnect(); gain.disconnect(); };
}
