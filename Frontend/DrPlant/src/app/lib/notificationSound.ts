let audioCtx: AudioContext | null = null;
let unlocked = false;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

/** Call once after a user gesture so autoplay policies allow notification sounds. */
export function unlockNotificationSound(): void {
  const ctx = getContext();
  if (!ctx || unlocked) return;
  if (ctx.state === "suspended") {
    void ctx.resume().then(() => {
      unlocked = true;
    });
  } else {
    unlocked = true;
  }
}

function beep(
  ctx: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  volume: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** Short two-tone chime for new notifications. */
export function playNotificationSound(): void {
  try {
    const ctx = getContext();
    if (!ctx) return;
    const start = () => {
      const t = ctx.currentTime;
      beep(ctx, 880, t, 0.12, 0.12);
      beep(ctx, 1174.66, t + 0.14, 0.16, 0.1);
    };
    if (ctx.state === "suspended") {
      void ctx.resume().then(start);
    } else {
      start();
    }
  } catch {
    /* ignore — autoplay blocked or unsupported */
  }
}

if (typeof window !== "undefined") {
  const unlock = () => {
    unlockNotificationSound();
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  };
  window.addEventListener("pointerdown", unlock, { once: true, passive: true });
  window.addEventListener("keydown", unlock, { once: true });
}
