/**
 * HME 3 operation labels. v3 dropped the closed QOFT glyph set
 * (Σ◯ Θλ Λψ Ψmeta Π↺). Those remain only in archive/v2.2.
 * Live records store an open `operation` string; the default write is "write".
 * This instrument still uses a closed five-face vocabulary so the braid can
 * be ablated. It is a hypothesis about tick roles, not a ledger schema.
 *
 * @see https://github.com/donaldtuttle/HME/blob/main/docs/MIGRATION_V3.md
 */
export const GLYPHS = ["measure", "event", "write", "retrieve", "lineage"] as const;
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
  { name: string; role: string; hme: string; token: string; mark: string }
> = {
  measure: {
    name: "Measure",
    role: "Pre-event measurement",
    hme: "write_salience before the field event",
    token: "glyph-psi",
    mark: "mea",
  },
  event: {
    name: "Event",
    role: "Field event",
    hme: "FieldRuntime event (was Λψ)",
    token: "glyph-lambda",
    mark: "evt",
  },
  write: {
    name: "Write",
    role: "Durable encode",
    hme: 'encode_memory operation="write"',
    token: "glyph-sigma",
    mark: "wrt",
  },
  retrieve: {
    name: "Retrieve",
    role: "Ranked read",
    hme: "retrieve_memory — not a stored glyph",
    token: "glyph-theta",
    mark: "ret",
  },
  lineage: {
    name: "Lineage",
    role: "Lineage edge",
    hme: "LineageGraph (was QMesh / Π↺)",
    token: "glyph-pi",
    mark: "lin",
  },
};

/**
 * Affect-conditioned operator mix. Hypothesis, not a measurement from HME:
 * fear shifts Ξ_B toward retrieve + event; recovery writes and locks lineage.
 * Random source is the control (uniform, notebook-shaped).
 */
export const OPERATOR_MIX = {
  curiosity: { measure: 0.22, event: 0.1, write: 0.3, retrieve: 0.22, lineage: 0.16 },
  fear: { measure: 0.14, event: 0.3, write: 0.08, retrieve: 0.36, lineage: 0.12 },
  recover: { measure: 0.18, event: 0.12, write: 0.28, retrieve: 0.16, lineage: 0.26 },
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
