export const METHODS = ['ordinary', 'braid', 'scrambled'] as const;
export type Method = typeof METHODS[number];
export const METHOD_LABELS: Record<Method, string> = {
  ordinary: 'Ordinary search', braid: 'Braid-assisted', scrambled: 'Scrambled connections',
};
export const PROTOCOL = 'find-the-right-memory/v1';
export const UPDATES = 8;
export interface Settings { seed: number; histories: number; missing: number; distractors: number; jitter: number }
export const DEFAULT_SETTINGS: Settings = { seed: 20260917, histories: 40, missing: 0.45, distractors: 16, jitter: 4 };
export interface MemoryRecord { id: string; time: number; clues: string[]; text: string }
export interface PublicHistory { observations: MemoryRecord[]; updates: MemoryRecord[]; nominalDelay: number }
export type AnswerKey = Record<string, string>;
export interface Case { seed: number; public: PublicHistory; answers: AnswerKey }
export interface Prediction { queryId: string; selectedId: string | null; score: number }
export interface Retrieval {
  method: Method; predictions: Prediction[];
  cost: { pairEvaluations: number; rankingSteps: number; rankingBudget: number; elapsedMs: number; permutedPositions: number };
}
export interface ScoredRetrieval extends Retrieval { correct: number; total: number; unanswered: number }
export interface CaseResult extends Case { methods: Record<Method, ScoredRetrieval> }
export interface Difference { mean: number; low: number; high: number }
export interface MethodSummary { accuracy: number; correct: number; total: number; unanswered: number; pairEvaluations: number; rankingSteps: number; elapsedMs: number }
export interface Condition {
  id: string; label: string; description: string; missing: number; distractors: number; jitter: number; delayShift: number;
}
export interface ConditionResult {
  condition: Condition; cases: CaseResult[]; summaries: Record<Method, MethodSummary>;
  vsOrdinary: Difference; vsScrambled: Difference;
}
export interface Report {
  protocol: string; createdAt: string; settings: Settings;
  implementation: string;
  environment: string; conditions: ConditionResult[];
  verdict: 'Exploratory benefit' | 'No clear benefit' | 'Mechanism not tested';
  scope: string;
}
