// Frame rate, shutter angle and flicker.
// A rotating shutter is described by its angle; a stills-style camera by an exposure time.
// The two are the same thing: time = angle / (360 × fps).

export const timeFromAngle = (fps, angle) => (fps > 0 && angle > 0 ? angle / (360 * fps) : 0);
export const angleFromTime = (fps, seconds) => (fps > 0 && seconds > 0 ? seconds * 360 * fps : 0);

// Shown the way a camera shows it: 1/50, 1/125…
export const asFraction = (seconds) => (seconds > 0 ? `1/${Math.round(1 / seconds)}` : '—');

// Mains-powered light pulses at twice the supply frequency. An exposure is flicker-free when it
// covers a whole number of those pulses — that is why 1/50 and 1/100 are safe on 50 Hz.
export function flicker(seconds, mains = 50) {
  if (!(seconds > 0) || !(mains > 0)) return { safe: false, pulses: 0, error: 1 };
  const pulses = seconds * 2 * mains;
  const nearest = Math.round(pulses);
  const error = nearest > 0 ? Math.abs(pulses - nearest) / nearest : 1;
  return { safe: nearest >= 1 && error < 0.02, pulses, nearest, error };
}

// The angles that come out flicker-free at this frame rate, nearest to 180° first.
export function safeAngles(fps, mains = 50, maxAngle = 360) {
  const out = [];
  for (let k = 1; k <= 64; k++) {
    const seconds = k / (2 * mains);
    const angle = angleFromTime(fps, seconds);
    if (angle > maxAngle + 0.001) break;
    if (angle >= 1) out.push({ angle: Math.round(angle * 10) / 10, seconds, label: asFraction(seconds) });
  }
  return out.sort((a, b) => Math.abs(a.angle - 180) - Math.abs(b.angle - 180));
}

// Shooting at 50 and playing at 25 gives half speed.
export function slowMotion(recordFps, projectFps) {
  if (!(recordFps > 0) || !(projectFps > 0)) return { factor: 0, label: '—' };
  const factor = recordFps / projectFps;
  const label = factor === 1 ? '1:1'
    : factor > 1 ? `${Math.round(factor * 100) / 100}× slower`
      : `${Math.round((1 / factor) * 100) / 100}× faster`;
  return { factor, label, secondsPerSecond: factor };
}

// 24 fps at 172.8° is the film-standard 1/50 — the angles a camera actually offers.
export const COMMON_ANGLES = [11.2, 22.5, 45, 90, 144, 172.8, 180, 270, 360];
