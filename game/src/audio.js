// WebAudio sound, generated in code: soft footsteps, a rising alert sting when a guard
// turns suspicious, a chime when a page is taken. No audio files, no network.
let ctx = null;
function audio() {
  if (!ctx) {
    try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { return null; }
  }
  if (ctx && ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}
function blip(freq, dur, gain, type = 'sine') {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator(), g = ac.createGain();
  osc.type = type; osc.frequency.value = freq;
  g.gain.setValueAtTime(gain, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(); osc.stop(ac.currentTime + dur);
}
export function footstep(sneaking, running) {
  blip(sneaking ? 140 : running ? 220 : 180, 0.07, sneaking ? 0.02 : running ? 0.06 : 0.04, 'triangle');
}
export function alertSting() { blip(660, 0.18, 0.08, 'sawtooth'); blip(880, 0.25, 0.06, 'sawtooth'); }
export function pageChime() { blip(880, 0.12, 0.05); setTimeout(() => blip(1320, 0.16, 0.05), 90); }
export function winChime() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.22, 0.06), i * 110)); }
export function unlockAudio() { audio(); }
