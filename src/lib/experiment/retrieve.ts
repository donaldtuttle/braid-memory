import { mulberry32 } from '../braid/rng.ts';
import { shuffled } from './generate.ts';
import type { MemoryRecord, Method, PublicHistory, Retrieval } from './types.ts';

export function pairScore(observation: MemoryRecord, update: MemoryRecord, nominalDelay: number): number {
  if (observation.time >= update.time) return -Infinity;
  const content = update.clues.filter(c => observation.clues.includes(c)).length / Math.max(1, update.clues.length);
  const timing = Math.exp(-Math.abs(update.time - observation.time - nominalDelay) / 12);
  return 4 * content + 0.75 * timing;
}

/** Rectangular Hungarian assignment, with one dummy column per query for abstention. */
export function assignment(scores: number[][]): { choices: (number | null)[]; steps: number } {
  const m = scores.length;
  const n = scores[0]?.length ?? 0;
  const cols = n + m;
  const u = Array(m + 1).fill(0), v = Array(cols + 1).fill(0);
  const p = Array(cols + 1).fill(0), way = Array(cols + 1).fill(0);
  let steps = 0;
  for (let i = 1; i <= m; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = Array(cols + 1).fill(Infinity), used = Array(cols + 1).fill(false);
    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity, j1 = 0;
      for (let j = 1; j <= cols; j++) {
        if (used[j]) continue;
        steps++;
        const score = j <= n ? scores[i0 - 1][j - 1] : 0;
        const cur = (Number.isFinite(score) ? -score : 1e6) - u[i0] - v[j];
        if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
        if (minv[j] < delta) { delta = minv[j]; j1 = j; }
      }
      for (let j = 0; j <= cols; j++) {
        if (used[j]) { u[p[j]] += delta; v[j] -= delta; }
        else minv[j] -= delta;
      }
      j0 = j1;
    } while (p[j0] !== 0);
    do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0 !== 0);
  }
  const choices: (number | null)[] = Array(m).fill(null);
  for (let j = 1; j <= n; j++) if (p[j] > 0 && scores[p[j] - 1][j - 1] > 0) choices[p[j] - 1] = j - 1;
  return { choices, steps };
}

/** Maximum-score ordered matching with skips on either history. */
export function alignment(scores: number[][]): { choices: (number | null)[]; steps: number } {
  const m = scores.length, n = scores[0]?.length ?? 0;
  const dp = Array.from({ length: m + 1 }, () => new Float64Array(n + 1));
  const action = Array.from({ length: m + 1 }, () => new Uint8Array(n + 1));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = dp[i][j - 1]; action[i][j] = 1;
      if (dp[i - 1][j] > dp[i][j]) { dp[i][j] = dp[i - 1][j]; action[i][j] = 2; }
      const match = dp[i - 1][j - 1] + scores[i - 1][j - 1];
      if (match > dp[i][j]) { dp[i][j] = match; action[i][j] = 3; }
    }
  }
  const choices: (number | null)[] = Array(m).fill(null);
  let i = m, j = n;
  while (i > 0 && j > 0) {
    if (action[i][j] === 3) { choices[i - 1] = j - 1; i--; j--; }
    else if (action[i][j] === 2) i--;
    else j--;
  }
  return { choices, steps: m * n };
}

export function retrieve(history: PublicHistory, method: Method, controlSeed: number): Retrieval {
  const start = performance.now();
  const byTime = (a: MemoryRecord, b: MemoryRecord) => a.time - b.time || a.id.localeCompare(b.id);
  const observations = [...history.observations].sort(byTime), updates = [...history.updates].sort(byTime);
  const n = observations.length, m = updates.length;
  // Pair features are constructed independently and charged equally for every method.
  const scores = updates.map(q => observations.map(a => pairScore(a, q, history.nominalDelay)));
  const order = Array.from({ length: n }, (_, i) => i);
  const structuralOrder = method === 'scrambled' ? shuffled(order, mulberry32(controlSeed)) : order;
  const ranked = method === 'ordinary' ? assignment(scores) : alignment(scores.map(row => structuralOrder.map(j => row[j])));
  const rankingBudget = m * m * (n + m);
  if (ranked.steps > rankingBudget) throw new Error('Ranking budget exceeded; run invalid.');
  const predictions = updates.map((q, i) => {
    const chosen = ranked.choices[i];
    const j = chosen === null ? null : structuralOrder[chosen];
    return { queryId: q.id, selectedId: j === null ? null : observations[j].id, score: j === null ? 0 : scores[i][j] };
  });
  return { method, predictions, cost: { pairEvaluations: m * n, rankingSteps: ranked.steps, rankingBudget,
    permutedPositions: structuralOrder.filter((j, i) => j !== i).length, elapsedMs: performance.now() - start } };
}
