import { mulberry32 } from '../braid/rng.ts';
import { conditionsFor, generateCase, validateSettings } from './generate.ts';
import { retrieve } from './retrieve.ts';
import { METHODS, PROTOCOL, type AnswerKey, type CaseResult, type ConditionResult, type Difference, type Method, type MethodSummary, type Report, type Retrieval, type ScoredRetrieval, type Settings } from './types.ts';

export function scoreRetrieval(result: Retrieval, answers: AnswerKey): ScoredRetrieval {
  const ids = Object.keys(answers);
  if (result.predictions.length !== ids.length || new Set(result.predictions.map(p => p.queryId)).size !== ids.length || result.predictions.some(p => !(p.queryId in answers))) {
    throw new Error('Predictions must contain exactly one result per query.');
  }
  return { ...result, correct: result.predictions.filter(p => p.selectedId === answers[p.queryId]).length,
    total: ids.length, unanswered: result.predictions.filter(p => p.selectedId === null).length };
}
export function pairedDifference(values: number[], seed: number): Difference {
  const rng = mulberry32(seed), n = values.length;
  if (n === 0) throw new Error('At least one independent history is required.');
  const means = Array.from({ length: 2000 }, () => {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += values[Math.floor(rng() * n)];
    return sum / n;
  }).sort((a, b) => a - b);
  return { mean: values.reduce((a, b) => a + b, 0) / n, low: means[49], high: means[1949] };
}
export function hasBenefit(ordinary: Difference, scrambled: Difference): boolean {
  return ordinary.mean >= 0.05 && ordinary.low > 0 && scrambled.mean >= 0.05 && scrambled.low > 0;
}
function summarize(cases: CaseResult[], method: Method): MethodSummary {
  const values = cases.map(c => c.methods[method]);
  const sum = (f: (r: ScoredRetrieval) => number) => values.reduce((a, r) => a + f(r), 0);
  const correct = sum(r => r.correct), total = sum(r => r.total);
  return { correct, total, accuracy: correct / total, unanswered: sum(r => r.unanswered),
    pairEvaluations: sum(r => r.cost.pairEvaluations), rankingSteps: sum(r => r.cost.rankingSteps), elapsedMs: sum(r => r.cost.elapsedMs) };
}
export function runCondition(settings: Settings, conditionIndex: number): ConditionResult {
  validateSettings(settings);
  const condition = conditionsFor(settings)[conditionIndex];
  if (!condition) throw new Error('Unknown condition.');
  const cases: CaseResult[] = [];
  for (let i = 0; i < settings.histories; i++) {
    const seed = (settings.seed + Math.imul(i + 1, 0x9e3779b9)) >>> 0;
    const generated = generateCase(seed, condition);
    const results = {} as Record<Method, ScoredRetrieval>;
    // Rotate execution order to reduce systematic first-run/JIT timing bias.
    for (let j = 0; j < METHODS.length; j++) {
      const method = METHODS[(i + j) % METHODS.length];
      const output = retrieve(generated.public, method, seed ^ 0x48da731b);
      results[method] = scoreRetrieval(output, generated.answers);
    }
    cases.push({ ...generated, methods: results });
  }
  const difference = (method: Method) => pairedDifference(cases.map(c => (c.methods.braid.correct - c.methods[method].correct) / c.methods.braid.total), settings.seed ^ (conditionIndex + 33));
  return { condition, cases,
    summaries: Object.fromEntries(METHODS.map(m => [m, summarize(cases, m)])) as Record<Method, MethodSummary>,
    vsOrdinary: difference('ordinary'), vsScrambled: difference('scrambled') };
}
export function assembleReport(settings: Settings, conditions: ConditionResult[], environment: string, implementation: string): Report {
  const primary = conditions[0];
  if (!primary || conditions.length !== 4) throw new Error('All four conditions are required.');
  const active = primary.cases.some(c => c.methods.scrambled.cost.permutedPositions > 0);
  return { protocol: PROTOCOL, createdAt: new Date().toISOString(), settings: { ...settings }, environment, implementation, conditions,
    verdict: !active ? 'Mechanism not tested' : hasBenefit(primary.vsOrdinary, primary.vsScrambled) ? 'Exploratory benefit' : 'No clear benefit',
    scope: 'Exploratory synthetic retrieval only. Tests ordinary sequence alignment, not HME storage, physical QOFT, or unique braid topology. All cases retained; confidence intervals resample independent histories. New seeds are not a preregistered confirmation study.' };
}
export function reportCSV(report: Report): string {
  const rows: (string | number | boolean | null)[][] = [[
    'protocol', 'run_seed', 'condition', 'history_seed', 'query_id', 'method', 'selected_id', 'correct_id', 'correct', 'score',
    'history_pair_evaluations', 'history_ranking_steps', 'history_elapsed_ms',
  ]];
  for (const condition of report.conditions) for (const c of condition.cases) for (const method of METHODS) {
    const r = c.methods[method];
    for (const p of r.predictions) rows.push([report.protocol, report.settings.seed, condition.condition.id, c.seed, p.queryId,
      method, p.selectedId, c.answers[p.queryId], p.selectedId === c.answers[p.queryId], p.score,
      r.cost.pairEvaluations, r.cost.rankingSteps, r.cost.elapsedMs]);
  }
  return rows.map(row => row.map(v => `"${String(v ?? '').replaceAll('"', '""')}"`).join(',')).join('\r\n') + '\r\n';
}
