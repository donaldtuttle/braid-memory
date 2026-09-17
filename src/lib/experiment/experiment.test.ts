import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../braid/rng.ts';
import { conditionsFor, generateCase, validateSettings } from './generate.ts';
import { alignment, assignment, pairScore, retrieve } from './retrieve.ts';
import { assembleReport, hasBenefit, pairedDifference, reportCSV, runCondition, scoreRetrieval } from './run.ts';
import { DEFAULT_SETTINGS, METHODS, type PublicHistory } from './types.ts';

function withoutTime<T>(value: T): T {
  return JSON.parse(JSON.stringify(value, (key, v) => ['elapsedMs', 'createdAt'].includes(key) ? 0 : v));
}
function exact(scores: number[][], ordered: boolean, row = 0, used: number[] = []): number {
  if (row === scores.length) return 0;
  let best = exact(scores, ordered, row + 1, used);
  for (let j = 0; j < scores[row].length; j++) {
    if (used.includes(j) || (ordered && used.length > 0 && j <= used[used.length - 1])) continue;
    best = Math.max(best, scores[row][j] + exact(scores, ordered, row + 1, [...used, j]));
  }
  return best;
}
function total(scores: number[][], choices: (number | null)[]) {
  return choices.reduce<number>((sum, j, i) => sum + (j === null ? 0 : scores[i][j]), 0);
}
function deepFreeze<T>(value: T): T {
  if (value && typeof value === 'object') { Object.freeze(value); for (const v of Object.values(value)) deepFreeze(v); }
  return value;
}

describe('observable histories and isolated scoring', () => {
  it('reproduces records and gives IDs no parent field', () => {
    const c = generateCase(42, conditionsFor(DEFAULT_SETTINGS)[0]);
    assert.deepEqual(c, generateCase(42, conditionsFor(DEFAULT_SETTINGS)[0]));
    for (const r of [...c.public.observations, ...c.public.updates]) assert.deepEqual(Object.keys(r).sort(), ['clues', 'id', 'text', 'time']);
    assert.equal(new Set(Object.values(c.answers)).size, 8);
    for (const q of c.public.updates) {
      const a = c.public.observations.find(r => r.id === c.answers[q.id])!;
      assert.ok(a.time < q.time);
      assert.ok(q.clues.every(clue => a.clues.includes(clue)));
    }
  });
  it('keeps base histories and answer keys paired across the four scenarios', () => {
    const cases = conditionsFor(DEFAULT_SETTINGS).map(c => generateCase(91, c));
    for (const c of cases) {
      assert.deepEqual(c.public.observations, cases[0].public.observations);
      assert.deepEqual(c.answers, cases[0].answers);
    }
    const totalClues = (i: number) => cases[i].public.updates.reduce((sum, q) => sum + q.clues.length, 0);
    assert.ok(totalClues(1) <= totalClues(0));
  });
  it('retrieves from immutable public records without accessing any answer key', () => {
    const c = generateCase(9, conditionsFor(DEFAULT_SETTINGS)[0]);
    Object.defineProperty(c.public, 'answers', { get() { throw new Error('Answer-key access'); } });
    const history = deepFreeze(c.public);
    for (const m of METHODS) assert.equal(retrieve(history, m, 8).predictions.length, 8);
  });
  it('changing the evaluator key changes correctness, not the predictions', () => {
    const c = generateCase(123, conditionsFor(DEFAULT_SETTINGS)[0]);
    const history = deepFreeze(c.public);
    for (const m of METHODS) {
      const first = retrieve(history, m, 55);
      const fake = Object.fromEntries(Object.keys(c.answers).map(id => [id, 'absent-id']));
      assert.equal(scoreRetrieval(first, fake).correct, 0);
      assert.deepEqual(withoutTime(first), withoutTime(retrieve(history, m, 55)));
    }
  });
  it('rejects missing, duplicate, or unknown predictions', () => {
    const c = generateCase(3, conditionsFor(DEFAULT_SETTINGS)[0]);
    const result = retrieve(c.public, 'ordinary', 5);
    assert.throws(() => scoreRetrieval({ ...result, predictions: result.predictions.slice(1) }, c.answers));
    assert.throws(() => scoreRetrieval({ ...result, predictions: result.predictions.map(() => result.predictions[0]) }, c.answers));
  });
});

describe('search against exhaustive independent solutions', () => {
  it('solves unrestricted and ordered assignments including skips and blocked pairs', () => {
    const rng = mulberry32(876);
    for (let trial = 0; trial < 60; trial++) {
      const scores = Array.from({ length: 3 }, () => Array.from({ length: 5 }, () => rng() < 0.2 ? -Infinity : Math.floor(rng() * 20) / 4));
      for (const [fn, ordered] of [[assignment, false], [alignment, true]] as const) {
        const result = fn(scores);
        assert.equal(total(scores, result.choices), exact(scores, ordered));
        const chosen = result.choices.filter(j => j !== null);
        assert.equal(chosen.length, new Set(chosen).size);
      }
    }
  });
  it('abstains when every candidate is in the future', () => {
    const history: PublicHistory = { nominalDelay: 12,
      observations: [{ id: 'a', time: 10, clues: ['pump'], text: 'pump' }],
      updates: [{ id: 'q', time: 5, clues: ['pump'], text: 'pump' }] };
    assert.equal(pairScore(history.observations[0], history.updates[0], 12), -Infinity);
    for (const m of METHODS) assert.equal(retrieve(history, m, 1).predictions[0].selectedId, null);
  });
  it('lets ordinary search win when the order assumption is false', () => {
    const history: PublicHistory = { nominalDelay: 12,
      observations: [{ id: 'a', time: 1, clues: ['pump'], text: 'pump' }, { id: 'b', time: 2, clues: ['fan'], text: 'fan' }],
      updates: [{ id: 'q1', time: 13, clues: ['fan'], text: 'fan' }, { id: 'q2', time: 14, clues: ['pump'], text: 'pump' }] };
    const answers = { q1: 'b', q2: 'a' };
    assert.equal(scoreRetrieval(retrieve(history, 'ordinary', 1), answers).correct, 2);
    assert.ok(scoreRetrieval(retrieve(history, 'braid', 1), answers).correct < 2);
  });
  it('keeps candidate scores fixed when only structural connections are scrambled', () => {
    const c = generateCase(34, conditionsFor(DEFAULT_SETTINGS)[0]);
    const before = JSON.stringify(c.public);
    const braid = retrieve(c.public, 'braid', 91), scrambled = retrieve(c.public, 'scrambled', 91);
    assert.equal(JSON.stringify(c.public), before);
    assert.equal(braid.cost.rankingSteps, scrambled.cost.rankingSteps);
    assert.ok(scrambled.cost.permutedPositions > 0);
    assert.equal(braid.cost.permutedPositions, 0);
    for (const r of [braid, scrambled]) for (const p of r.predictions) if (p.selectedId) {
      const a = c.public.observations.find(a => a.id === p.selectedId)!;
      const q = c.public.updates.find(q => q.id === p.queryId)!;
      assert.equal(p.score, pairScore(a, q, 12));
    }
  });
});

describe('protocol, budget, results, and exports', () => {
  it('rejects nonfinite, out-of-range, and fractional integer settings', () => {
    for (const patch of [{ seed: -1 }, { seed: 2 ** 32 }, { histories: 9 }, { histories: 201 }, { jitter: 2.5 }, { missing: NaN }, { distractors: Infinity }]) {
      assert.throws(() => validateSettings({ ...DEFAULT_SETTINGS, ...patch }));
    }
  });
  it('maintains equal pair budgets, unique eligible choices, and reproducibility at boundary settings', () => {
    for (const patch of [{ missing: 0, jitter: 0, distractors: 0 }, { missing: 1, jitter: 30, distractors: 64 }]) {
      const settings = { ...DEFAULT_SETTINGS, ...patch, histories: 10 };
      const result = runCondition(settings, 0);
      assert.deepEqual(withoutTime(result), withoutTime(runCondition(settings, 0)));
      for (const c of result.cases) {
        for (const m of METHODS) {
          const r = c.methods[m];
          assert.equal(r.cost.pairEvaluations, 8 * (16 + settings.distractors));
          assert.ok(r.cost.rankingSteps <= r.cost.rankingBudget);
          const selected = r.predictions.map(p => p.selectedId).filter(Boolean);
          assert.equal(selected.length, new Set(selected).size);
          for (const p of r.predictions) if (p.selectedId) assert.ok(c.public.observations.find(a => a.id === p.selectedId)!.time < c.public.updates.find(q => q.id === p.queryId)!.time);
        }
      }
    }
  });
  it('requires both contrasts and their intervals to clear the declared thresholds', () => {
    const win = { mean: 0.1, low: 0.01, high: 0.2 };
    assert.equal(hasBenefit(win, win), true);
    for (const fail of [{ ...win, mean: 0.049 }, { ...win, low: 0 }, { mean: -0.1, low: -0.2, high: 0 }]) {
      assert.equal(hasBenefit(win, fail), false); assert.equal(hasBenefit(fail, win), false);
    }
    assert.deepEqual(pairedDifference([0, 0, 0], 2), { mean: 0, low: 0, high: 0 });
    assert.deepEqual(pairedDifference([0.5, 0.5, 0.5], 2), { mean: 0.5, low: 0.5, high: 0.5 });
  });
  it('exports every prediction, full records, distinct answer keys, and run metadata', () => {
    const s = { ...DEFAULT_SETTINGS, histories: 10 };
    const report = assembleReport(s, [0, 1, 2, 3].map(i => runCondition(s, i)), 'node test', 'test-fixture');
    assert.equal(report.conditions[0].summaries.ordinary.total, 80);
    const csv = reportCSV(report);
    assert.equal(csv.trim().split('\r\n').length, 1 + 4 * 10 * 8 * 3);
    assert.deepEqual(JSON.parse(JSON.stringify(report)), report);
    assert.equal(report.conditions[0].cases[0].public.observations.length, 32);
    assert.ok(report.scope.includes('Exploratory'));
    assert.equal(report.implementation, 'test-fixture');
  });
});
