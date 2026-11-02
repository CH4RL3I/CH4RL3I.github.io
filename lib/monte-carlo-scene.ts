/** Deterministic geometry and timing shared by the renderer and checks. */
export const PATH_STEPS = 49;
export const REPLAY_STEPS = 4;
export const INTRO_SECONDS = 2;
export const STEP_SECONDS = 4.6;
export const HOLD_SECONDS = 7;
export const RESET_SECONDS = 1.2;
export const CYCLE_SECONDS = INTRO_SECONDS + REPLAY_STEPS * STEP_SECONDS + HOLD_SECONDS + RESET_SECONDS;
export const clamp = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const p = clamp(x); return p * p * (3 - 2 * p); };

export function replayState(seconds: number, still = false) {
  const c = still ? INTRO_SECONDS + REPLAY_STEPS * STEP_SECONDS + 1 : seconds % CYCLE_SECONDS;
  const fitting = c >= INTRO_SECONDS && c < INTRO_SECONDS + REPLAY_STEPS * STEP_SECONDS;
  const fitted = c >= INTRO_SECONDS + REPLAY_STEPS * STEP_SECONDS;
  const step = fitting ? Math.floor((c - INTRO_SECONDS) / STEP_SECONDS) : fitted ? REPLAY_STEPS : 0;
  const a = fitting ? ((c - INTRO_SECONDS) / STEP_SECONDS) % 1 : 0;
  const progress = fitted ? 1 : (step + (fitting ? smooth((a - 0.81) / 0.19) : 0)) / REPLAY_STEPS;
  const phase = !fitting ? (fitted ? 'settled' : 'initial') : a < 0.17 ? 'forward' : a < 0.28 ? 'connect' : a < 0.52 ? 'generate' : a < 0.67 ? 'compare' : a < 0.81 ? 'feedback' : 'update';
  return {
    progress, phase, fitting, fitted,
    forward: fitting && a < 0.17 ? a / 0.17 : -1,
    connector: fitting && a >= 0.17 && a < 0.28 ? (a - 0.17) / 0.11 : -1,
    growth: fitting ? smooth((a - 0.28) / 0.24) : 1,
    compare: fitting ? smooth((a - 0.52) / 0.15) * (1 - smooth((a - 0.81) / 0.19)) : fitted ? 0.35 : 0,
    feedback: fitting && a >= 0.67 && a < 0.81 ? (a - 0.67) / 0.14 : -1,
    opacity: still ? 1 : smooth(c / 0.8) * (1 - smooth((c - (CYCLE_SECONDS - RESET_SECONDS)) / RESET_SECONDS)),
  };
}

/** Integrated Brownian shocks reused by both fans and every checkpoint. */
export function brownianPaths(count: number, seed = 7) {
  let state = seed >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const paths = new Float32Array(count * PATH_STEPS);
  const rootDt = Math.sqrt(1 / (PATH_STEPS - 1));
  for (let i = 0; i < count; i++) for (let s = 1; s < PATH_STEPS; s++) {
    const shock = Math.sqrt(-2 * Math.log(Math.max(1e-12, random()))) * Math.cos(2 * Math.PI * random());
    paths[i * PATH_STEPS + s] = paths[i * PATH_STEPS + s - 1] + rootDt * shock;
  }
  return paths;
}

export function logPrice(shocks: Float32Array, path: number, step: number, mu: number, sigma: number) {
  return (mu - sigma * sigma / 2) * step / (PATH_STEPS - 1) + sigma * shocks[path * PATH_STEPS + step];
}

/** Uniformly fit a complete projected silhouette, independent of aspect ratio. */
export function fitScene(points: readonly (readonly [number, number])[], width: number, height: number) {
  const xs = points.map((p) => p[0]), ys = points.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const scale = Math.min(width * 0.88 / (maxX - minX), height * 0.49 / (maxY - minY));
  return { scale, x: width / 2 - scale * (minX + maxX) / 2, y: height * 0.68 - scale * (minY + maxY) / 2 };
}
