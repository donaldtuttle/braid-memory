/** Mulberry32 — deterministic, seedable, good enough for a lab instrument. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)]!;
}

export function pickWeighted<T>(
  rng: () => number,
  items: readonly T[],
  weights: readonly number[],
): T {
  let sum = 0;
  for (const w of weights) sum += w;
  let r = rng() * (sum || 1);
  for (let i = 0; i < items.length; i++) {
    r -= weights[i] ?? 0;
    if (r <= 0) return items[i]!;
  }
  return items[items.length - 1]!;
}

/** Box–Muller gaussian, then clip. */
export function clippedNormal(
  rng: () => number,
  mean: number,
  std: number,
  lo: number,
  hi: number,
): number {
  const u = Math.max(rng(), 1e-12);
  const v = rng();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return Math.min(hi, Math.max(lo, mean + std * z));
}
