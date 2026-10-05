// Shared sound for the kids' apps. Everything is a decoded buffer played through ONE audio context that is unlocked by a touch,
// which is the only thing iPhones play reliably from timers. It also survives leaving the app and coming back:
//  - the context is resumed (or rebuilt) whenever the page comes back or the child touches the screen,
//  - a silent looping <audio> keeps older iPhones from muting web sound when the side switch is on silent.
let ac = null, curSrc = null, silent = null, muted = false;
const bufs = new Map();

function silentUrl() {   // one second of silence as a tiny WAV
  const n = 8000, b = new Uint8Array(44 + n), v = new DataView(b.buffer), w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF'); v.setUint32(4, 36 + n, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, 8000, true); v.setUint32(28, 8000, true); v.setUint16(32, 1, true); v.setUint16(34, 8, true); w(36, 'data'); v.setUint32(40, n, true); b.fill(128, 44);
  return URL.createObjectURL(new Blob([b], { type: 'audio/wav' }));
}
function makeContext() {
  const C = window.AudioContext || window.webkitAudioContext; ac = new C();
  try { navigator.audioSession.type = 'playback'; } catch { /* older browsers */ }       // 'playback' = not muted by the silent switch (iOS 16.4+)
  ac.addEventListener?.('statechange', () => { if (ac && ac.state === 'interrupted') ac.resume?.().catch(() => {}); });
  return ac;
}
export function audio() {
  try { if (!ac || ac.state === 'closed') makeContext(); if (ac.state !== 'running') ac.resume?.().catch(() => {}); } catch { ac = null; }
  return ac;
}
export function unlock() {                      // call this from a touch / click
  audio();
  try { if (!silent) { silent = new Audio(silentUrl()); silent.loop = true; silent.volume = 0.02; } if (silent.paused) silent.play().catch(() => {}); } catch { /* no silent loop */ }
}
export const setMuted = (m) => { muted = m; if (m) stop(); };
export function stop() { try { curSrc?.stop(); } catch { /* already stopped */ } curSrc = null; }

export function loadBuf(url) {
  if (!bufs.has(url)) bufs.set(url, fetch(url).then((r) => r.arrayBuffer()).then((ab) => new Promise((ok, no) => { const p = audio().decodeAudioData(ab, ok, no); p?.then?.(ok, no); })).catch(() => { bufs.delete(url); return null; }));
  return bufs.get(url);
}
export async function playUrl(url, { gain = 0.9, max = 0, stopPrev = false } = {}) {
  if (muted || !audio()) return null; const b = await loadBuf(url); if (!b || muted) return null;
  let ctx = audio();
  if (ctx.state !== 'running') { try { await Promise.race([ctx.resume(), new Promise((r) => setTimeout(r, 300))]); } catch { /* ignore */ } if (ctx.state !== 'running') { try { ctx.close(); } catch { /* ignore */ } ac = null; ctx = audio(); } }
  if (stopPrev) stop();
  const src = ctx.createBufferSource(), g = ctx.createGain(), t = ctx.currentTime; src.buffer = b; g.gain.setValueAtTime(gain, t); src.connect(g).connect(ctx.destination);
  if (max) { g.gain.setValueAtTime(gain, t + Math.max(0, max - 0.4)); g.gain.linearRampToValueAtTime(0.0001, t + max); src.start(t, 0, max + 0.05); } else src.start(t);
  if (stopPrev) curSrc = src; return src;
}
// a short synthesized note (counting ticks, pops)
export function tone(freq, dur = 0.16, vol = 0.16, type = 'sine', slideTo = 0) {
  if (muted) return; const ctx = audio(); if (!ctx) return; const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t); if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur * 0.65);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g).connect(ctx.destination); o.start(t); o.stop(t + dur + 0.02);
}
// coming back to the app: wake the audio up again
const wake = () => { if (!document.hidden && ac && ac.state !== 'running') ac.resume?.().catch(() => {}); try { if (silent && silent.paused) silent.play().catch(() => {}); } catch { /* ignore */ } };
document.addEventListener('visibilitychange', wake); window.addEventListener('pageshow', wake); window.addEventListener('focus', wake);
