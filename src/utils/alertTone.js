/**
 * Attention alert for Instant Assessment queue + scheduled bookings.
 * Uses Web Audio API so marketing can hear a request even when on another tab.
 */

let audioCtx = null;
let activeNodes = [];
let repeatTimer = null;

function getCtx() {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function beep(ctx, { freq = 880, start = 0, dur = 0.16, gain = 0.22, type = 'sine' } = {}) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, ctx.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
  osc.connect(g);
  g.connect(ctx.destination);
  osc.start(ctx.currentTime + start);
  osc.stop(ctx.currentTime + start + dur + 0.02);
  activeNodes.push(osc, g);
}

function playOnce(kind = 'instant') {
  const ctx = getCtx();
  if (!ctx) return;
  // Instant: urgent triple ping. Scheduled: softer double chime.
  if (kind === 'scheduled') {
    beep(ctx, { freq: 660, start: 0, dur: 0.18, gain: 0.18 });
    beep(ctx, { freq: 880, start: 0.2, dur: 0.22, gain: 0.2 });
    return;
  }
  if (kind === 'boon') {
    beep(ctx, { freq: 520, start: 0, dur: 0.14, gain: 0.16, type: 'triangle' });
    beep(ctx, { freq: 700, start: 0.16, dur: 0.18, gain: 0.18, type: 'triangle' });
    return;
  }
  // instant (default)
  beep(ctx, { freq: 880, start: 0, dur: 0.14, gain: 0.24 });
  beep(ctx, { freq: 1175, start: 0.16, dur: 0.14, gain: 0.24 });
  beep(ctx, { freq: 880, start: 0.32, dur: 0.18, gain: 0.22 });
}

export function stopAlertTone() {
  if (repeatTimer) {
    clearInterval(repeatTimer);
    repeatTimer = null;
  }
  activeNodes.forEach((n) => {
    try {
      if (typeof n.stop === 'function') n.stop();
    } catch (_) { /* ignore */ }
  });
  activeNodes = [];
}

/**
 * Play alert tone. For instant assessments, repeats a few times so staff can accept.
 */
export function playAlertTone(kind = 'instant', { repeats = kind === 'instant' ? 4 : 1, gapMs = 1600 } = {}) {
  stopAlertTone();
  playOnce(kind);
  if (repeats <= 1) return;
  let left = repeats - 1;
  repeatTimer = setInterval(() => {
    playOnce(kind);
    left -= 1;
    if (left <= 0) stopAlertTone();
  }, gapMs);
}

export function notifyDesktop(title, body) {
  try {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission === 'granted') {
      const n = new Notification(title, {
        body,
        icon: '/frenvi_logo.png',
        tag: 'frenvi-admin-alert',
        requireInteraction: true
      });
      setTimeout(() => {
        try { n.close(); } catch (_) { /* ignore */ }
      }, 12000);
      return;
    }
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  } catch (_) { /* ignore */ }
}

/** Unlock audio on first user gesture (browser autoplay policy). */
export function unlockAlertAudio() {
  const ctx = getCtx();
  if (!ctx) return;
  try {
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  } catch (_) { /* ignore */ }
}
