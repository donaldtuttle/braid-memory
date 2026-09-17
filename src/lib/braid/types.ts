/**
 * QOFT operator vocabulary as HME actually uses it on the ledger.
 * ApplyReplay is an operation after retrieve, not a stored glyph.
 *
 * @see https://github.com/donaldtuttle/HME
 */
export const GLYPHS = ["Ψmeta", "Λψ", "Σ◯", "Θλ", "Π↺"] as const;
export type Glyph = (typeof GLYPHS)[number];

export const EMOTIONS = ["curiosity", "fear"] as const;
export type Emotion = (typeof EMOTIONS)[number];

export const EMOTION_WEIGHTS: Record<Emotion, number> = {
  curiosity: 1.1,
  fear: 0.6,
};

export type TraceSource = "random" | "operators";

export const GLYPH_META: Record<
  Glyph,
  { name: string; role: string; hme: string; token: string }
> = {
  Ψmeta: {
    name: "Psi-meta",
    role: "Pre-collapse telemetry",
    hme: "Ψmeta telemetry before projection",
    token: "glyph-psi",
  },
  Λψ: {
    name: "Lambda-psi",
    role: "Collapse / projection",
    hme: "Λψ local collapse event",
    token: "glyph-lambda",
  },
  "Σ◯": {
    name: "Sigma-circle",
    role: "Durable write",
    hme: "encode_memory default glyph",
    token: "glyph-sigma",
  },
  Θλ: {
    name: "Theta-lambda",
    role: "Retrieve / ReplayPlan",
    hme: "retrieve_memory / recall packet",
    token: "glyph-theta",
  },
  "Π↺": {
    name: "Pi-loop",
    role: "Lineage / recurrence",
    hme: "QMesh memory_precedes_collapse",
    token: "glyph-pi",
  },
};

/**
 * Affect-conditioned operator mix. Hypothesis, not a measurement from HME:
 * fear shifts Ξ_B toward retrieve + collapse; recovery writes and locks lineage.
 * Random source is the control (uniform, notebook-shaped).
 */
export const OPERATOR_MIX = {
  curiosity: { Ψmeta: 0.22, Λψ: 0.1, "Σ◯": 0.3, Θλ: 0.22, "Π↺": 0.16 },
  fear: { Ψmeta: 0.14, Λψ: 0.3, "Σ◯": 0.08, Θλ: 0.36, "Π↺": 0.12 },
  recover: { Ψmeta: 0.18, Λψ: 0.12, "Σ◯": 0.28, Θλ: 0.16, "Π↺": 0.26 },
} as const satisfies Record<string, Record<Glyph, number>>;

export type MixName = keyof typeof OPERATOR_MIX;

export type Phase = "entangled" | "diverging" | "reentangling";

export type PairKind =
  | "identity"
  | "write-retrieve"
  | "telemetry-collapse"
  | "lineage"
  | "other";

export type AblationVerdict = "none" | "hysteresis" | "mixed" | "braid";

export interface SimParams {
  steps: number;
  divergencePoint: number;
  reentanglePoint: number;
  deltaT: number;
  gamma: number;
  seed: number;
  decay: number;
  source: TraceSource;
}

export const DEFAULT_PARAMS: SimParams = {
  steps: 16,
  divergencePoint: 6,
  reentanglePoint: 12,
  deltaT: 3,
  gamma: 0.15,
  seed: 7,
  decay: 0.1,
  source: "operators",
};

export interface StepRecord {
  t: number;
  glyphA: Glyph;
  glyphB: Glyph;
  emotionA: Emotion;
  emotionB: Emotion;
  weightA: number;
  weightB: number;
  coherenceA: number;
  coherenceB: number;
  psiA: number;
  psiB: number;
  deltaRaw: number;
  braidCoherence: number;
  deltaBraid: number;
  phase: Phase;
}

export interface BraidCrossing {
  t: number;
  glyphA: Glyph;
  glyphB: Glyph;
  matched: boolean;
  over: "A" | "B";
  kind: PairKind;
}

export interface RecallHit {
  t: number;
  glyphA: Glyph;
  glyphB: Glyph;
  matched: boolean;
  score: number;
  both: boolean;
  kind: PairKind;
}

export type GlyphMix = Record<Glyph, number>;

export interface SimStats {
  meanDeltaRaw: number;
  meanDeltaBraid: number;
  meanDeltaPre: number;
  meanDeltaDiv: number;
  meanDeltaPost: number;
  matchRate: number;
  matchRatePre: number;
  matchRateDiv: number;
  matchRatePost: number;
  uniqueCrossings: number;
  maxDeltaBraid: number;
  dampening: number;
  dampeningRaw: number;
  braidShare: number;
  verdict: AblationVerdict;
  harmonicWrite: boolean;
  writeRetrieve: number;
  telemetryCollapse: number;
  lineageLocks: number;
  collapseDensity: number;
  mixA: GlyphMix;
  mixB: GlyphMix;
  mixBDiv: GlyphMix;
}

export interface SweepStats {
  n: number;
  meanBraidShare: number;
  meanDampening: number;
  braidWins: number;
  hysteresisWins: number;
  noneWins: number;
}

export interface Simulation {
  params: SimParams;
  steps: StepRecord[];
  braidWord: BraidCrossing[];
  stats: SimStats;
  sweep: SweepStats;
}

export const PRESETS: { id: string; label: string; params: Partial<SimParams> }[] =
  [
    {
      id: "early",
      label: "Early fracture",
      params: { source: "operators", divergencePoint: 3, reentanglePoint: 10, seed: 11 },
    },
    {
      id: "tight",
      label: "Tight Gemini",
      params: { source: "operators", deltaT: 1, seed: 3 },
    },
    {
      id: "strong",
      label: "Strong braid",
      params: { source: "operators", gamma: 0.85, seed: 7 },
    },
    {
      id: "ablate",
      label: "γ = 0",
      params: { source: "operators", gamma: 0, seed: 7 },
    },
  ];
