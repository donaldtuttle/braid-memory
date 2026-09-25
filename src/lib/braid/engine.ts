import { clippedNormal, mulberry32, pick, pickWeighted } from "./rng.ts";
import {
  EMOTION_WEIGHTS,
  GLYPHS,
  OPERATOR_MIX,
  type AblationVerdict,
  type BraidCrossing,
  type Emotion,
  type Glyph,
  type GlyphMix,
  type MixName,
  type PairKind,
  type Phase,
  type RecallHit,
  type SimParams,
  type SimStats,
  type Simulation,
  type StepRecord,
  type SweepStats,
} from "./types.ts";

function lerp(current: number, target: number, decay: number): number {
  return current + (target - current) * decay;
}

function mean(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function phaseAt(t: number, params: SimParams): Phase {
  if (t < params.divergencePoint) return "entangled";
  if (t < params.reentanglePoint) return "diverging";
  return "reentangling";
}

function emptyMix(): GlyphMix {
  return { measure: 0, event: 0, write: 0, retrieve: 0, lineage: 0 };
}

function mixWeights(name: MixName): number[] {
  const mix = OPERATOR_MIX[name];
  return GLYPHS.map((g) => mix[g]);
}

export function pairKind(a: Glyph, b: Glyph): PairKind {
  if (a === b) return "identity";
  if ((a === "write" && b === "retrieve") || (a === "retrieve" && b === "write")) {
    return "write-retrieve";
  }
  if ((a === "measure" && b === "event") || (a === "event" && b === "measure")) {
    return "telemetry-collapse";
  }
  if (a === "lineage" || b === "lineage") return "lineage";
  return "other";
}

function mixFor(agent: "A" | "B", phase: Phase): MixName {
  if (agent === "A") return "curiosity";
  if (phase === "diverging") return "fear";
  if (phase === "reentangling") return "recover";
  return "curiosity";
}

function emitGlyph(
  rng: () => number,
  source: SimParams["source"],
  agent: "A" | "B",
  phase: Phase,
): Glyph {
  if (source === "random") return pick(rng, GLYPHS);
  return pickWeighted(rng, GLYPHS, mixWeights(mixFor(agent, phase)));
}

function rateOf(xs: BraidCrossing[], pred: (c: BraidCrossing) => boolean): number {
  if (xs.length === 0) return 0;
  return xs.filter(pred).length / xs.length;
}

function dampen(div: number, post: number): number {
  if (div <= 1e-9) return 0;
  return (div - post) / div;
}

function verdictOf(hysteresis: number, braidShare: number): AblationVerdict {
  if (hysteresis < 0.04 && braidShare < 0.03) return "none";
  if (braidShare < 0.03) return "hysteresis";
  if (braidShare > hysteresis) return "braid";
  return "mixed";
}

function clampParams(params: SimParams): SimParams {
  const stepsN = Math.max(4, Math.min(48, Math.round(params.steps)));
  const diverge = Math.max(1, Math.min(stepsN - 2, Math.round(params.divergencePoint)));
  const reent = Math.max(diverge + 1, Math.min(stepsN - 1, Math.round(params.reentanglePoint)));
  const deltaT = Math.max(1, Math.min(stepsN - 1, Math.round(params.deltaT)));
  const gamma = Math.max(0, Math.min(1.5, params.gamma));
  const decay = Math.max(0.02, Math.min(0.6, params.decay));
  const seed = params.seed | 0;
  const source = params.source === "random" ? "random" : "operators";
  return {
    steps: stepsN,
    divergencePoint: diverge,
    reentanglePoint: reent,
    deltaT,
    gamma,
    seed,
    decay,
    source,
  };
}

function tally(glyphs: Glyph[]): GlyphMix {
  const mix = emptyMix();
  if (glyphs.length === 0) return mix;
  for (const g of glyphs) mix[g] += 1;
  for (const g of GLYPHS) mix[g] /= glyphs.length;
  return mix;
}

/**
 * ReflectiveStack × GeminiPath, now an instrument:
 * HME 3 operation labels, optional affect-conditioned mix, and an ablation of
 * hysteresis (emotion return) versus braid extra-dampening (identity recovery).
 *
 * Ψintent(t) = 0.5·t + emotion_weight(t) + 2·coherence(t)
 * braid_word(t) = (Ξ_A[t], Ξ_B[t + Δt])     ← Γ_Gemini
 * braid_coherence = 1 if operations match else 0.5
 * ΔΨ_braid = |Ψ_A − Ψ_B| − γ · braid_coherence
 */
export function runCore(params: SimParams): Omit<Simulation, "sweep"> {
  const p = clampParams(params);
  const rng = mulberry32(p.seed === 0 ? 1 : p.seed);

  const glyphA: Glyph[] = [];
  const glyphB: Glyph[] = [];
  const weightA: number[] = [];
  const weightB: number[] = [];
  const cohA: number[] = [];
  const cohB: number[] = [];
  const emotionA: Emotion[] = [];
  const emotionB: Emotion[] = [];

  let bWeight = EMOTION_WEIGHTS.curiosity;
  let bEmotion: Emotion = "curiosity";

  for (let t = 0; t < p.steps; t++) {
    const phase = phaseAt(t, p);
    if (t === p.divergencePoint) bEmotion = "fear";
    if (t === p.reentanglePoint) bEmotion = "curiosity";

    if (t >= p.divergencePoint && t < p.reentanglePoint) {
      bWeight = lerp(bWeight, EMOTION_WEIGHTS.fear, p.decay);
    } else if (t >= p.reentanglePoint) {
      bWeight = lerp(bWeight, EMOTION_WEIGHTS.curiosity, p.decay);
    }

    glyphA.push(emitGlyph(rng, p.source, "A", phase));
    glyphB.push(emitGlyph(rng, p.source, "B", phase));
    weightA.push(EMOTION_WEIGHTS.curiosity);
    weightB.push(bWeight);
    cohA.push(clippedNormal(rng, 0.5, 0.1, 0.2, 0.8));
    cohB.push(clippedNormal(rng, 0.5, 0.1, 0.2, 0.8));
    emotionA.push("curiosity");
    emotionB.push(t >= p.reentanglePoint ? "curiosity" : bEmotion);
  }

  const psiA = glyphA.map((_, t) => 0.5 * t + weightA[t]! + 2 * cohA[t]!);
  const psiB = glyphB.map((_, t) => 0.5 * t + weightB[t]! + 2 * cohB[t]!);

  const braidCoherence: number[] = [];
  for (let t = 0; t < p.steps; t++) {
    if (t + p.deltaT < p.steps) {
      braidCoherence.push(glyphA[t] === glyphB[t + p.deltaT] ? 1 : 0.5);
    } else {
      braidCoherence.push(0.5);
    }
  }

  const steps: StepRecord[] = [];
  for (let t = 0; t < p.steps; t++) {
    const deltaRaw = Math.abs(psiA[t]! - psiB[t]!);
    const bc = braidCoherence[t]!;
    steps.push({
      t,
      glyphA: glyphA[t]!,
      glyphB: glyphB[t]!,
      emotionA: emotionA[t]!,
      emotionB: emotionB[t]!,
      weightA: weightA[t]!,
      weightB: weightB[t]!,
      coherenceA: cohA[t]!,
      coherenceB: cohB[t]!,
      psiA: psiA[t]!,
      psiB: psiB[t]!,
      deltaRaw,
      braidCoherence: bc,
      deltaBraid: deltaRaw - p.gamma * bc,
      phase: phaseAt(t, p),
    });
  }

  const braidWord: BraidCrossing[] = [];
  for (let t = 0; t < p.steps - p.deltaT; t++) {
    const a = glyphA[t]!;
    const b = glyphB[t + p.deltaT]!;
    const ai = GLYPHS.indexOf(a);
    const bi = GLYPHS.indexOf(b);
    braidWord.push({
      t,
      glyphA: a,
      glyphB: b,
      matched: a === b,
      over: ai >= bi ? "A" : "B",
      kind: pairKind(a, b),
    });
  }

  const byPhase = (phase: Phase) => braidWord.filter((c) => steps[c.t]?.phase === phase);
  const preX = byPhase("entangled");
  const divX = byPhase("diverging");
  const postX = byPhase("reentangling");

  const rawDiv = steps.filter((s) => s.phase === "diverging").map((s) => s.deltaRaw);
  const rawPost = steps.filter((s) => s.phase === "reentangling").map((s) => s.deltaRaw);
  const braidPre = steps.filter((s) => s.phase === "entangled").map((s) => s.deltaBraid);
  const braidDiv = steps.filter((s) => s.phase === "diverging").map((s) => s.deltaBraid);
  const braidPost = steps.filter((s) => s.phase === "reentangling").map((s) => s.deltaBraid);
  const cohDiv = steps.filter((s) => s.phase === "diverging").map((s) => s.braidCoherence);
  const cohPost = steps.filter((s) => s.phase === "reentangling").map((s) => s.braidCoherence);

  const meanDiv = mean(braidDiv);
  const meanPost = mean(braidPost);
  const meanRawDiv = mean(rawDiv);
  const dampening = dampen(meanDiv, meanPost);
  const dampeningRaw = dampen(meanRawDiv, mean(rawPost));
  // Extra ΔΨ drop from identity recovery, not the ratio artifact of subtracting γ.
  const identityBonus = p.gamma * (mean(cohPost) - mean(cohDiv));
  const braidShare = identityBonus / Math.max(meanRawDiv, 1e-9);
  const verdict = verdictOf(dampeningRaw, braidShare);

  const unique = new Set(braidWord.map((c) => `${c.glyphA}|${c.glyphB}`)).size;
  const matchRate = rateOf(braidWord, (c) => c.matched);
  const divSteps = steps.filter((s) => s.phase === "diverging");
  const divGlyphsB = divSteps.map((s) => s.glyphB);

  const stats: SimStats = {
    meanDeltaRaw: mean(steps.map((s) => s.deltaRaw)),
    meanDeltaBraid: mean(steps.map((s) => s.deltaBraid)),
    meanDeltaPre: mean(braidPre),
    meanDeltaDiv: meanDiv,
    meanDeltaPost: meanPost,
    matchRate,
    matchRatePre: rateOf(preX, (c) => c.matched),
    matchRateDiv: rateOf(divX, (c) => c.matched),
    matchRatePost: rateOf(postX, (c) => c.matched),
    uniqueCrossings: unique,
    maxDeltaBraid: Math.max(0, ...steps.map((s) => s.deltaBraid)),
    dampening,
    dampeningRaw,
    braidShare,
    verdict,
    harmonicWrite: dampening > 0.08 && meanPost < meanDiv,
    writeRetrieve: braidWord.filter((c) => c.kind === "write-retrieve").length,
    telemetryCollapse: braidWord.filter((c) => c.kind === "telemetry-collapse").length,
    lineageLocks: braidWord.filter((c) => c.kind === "lineage" || (c.kind === "identity" && c.glyphA === "lineage")).length,
    collapseDensity:
      divSteps.length === 0
        ? 0
        : divSteps.filter((s) => s.glyphB === "event").length / divSteps.length,
    mixA: tally(glyphA),
    mixB: tally(glyphB),
    mixBDiv: tally(divGlyphsB),
  };

  return { params: p, steps, braidWord, stats };
}

export function runSweep(params: SimParams, n = 16): SweepStats {
  const shares: number[] = [];
  const damps: number[] = [];
  let braidWins = 0;
  let hysteresisWins = 0;
  let noneWins = 0;
  const base = clampParams(params);
  for (let i = 0; i < n; i++) {
    const seed = (base.seed + i * 997) | 0 || 1;
    const sim = runCore({ ...base, seed });
    shares.push(sim.stats.braidShare);
    damps.push(sim.stats.dampening);
    if (sim.stats.verdict === "braid" || sim.stats.verdict === "mixed") braidWins += 1;
    else if (sim.stats.verdict === "hysteresis") hysteresisWins += 1;
    else noneWins += 1;
  }
  return {
    n,
    meanBraidShare: mean(shares),
    meanDampening: mean(damps),
    braidWins,
    hysteresisWins,
    noneWins,
  };
}

export function runSimulation(params: SimParams): Simulation {
  const core = runCore(params);
  return { ...core, sweep: runSweep(core.params) };
}

function kindBoost(glyph: Glyph, kind: PairKind): number {
  if (kind === "identity") return 1.15;
  if (glyph === "retrieve" && kind === "write-retrieve") return 1.2;
  if (glyph === "write" && kind === "write-retrieve") return 1.2;
  if (glyph === "event" && kind === "telemetry-collapse") return 1.15;
  if (glyph === "measure" && kind === "telemetry-collapse") return 1.15;
  if (glyph === "lineage" && kind === "lineage") return 1.1;
  return 1;
}

export function recallGlyph(sim: Simulation, glyph: Glyph): RecallHit[] {
  const maxD = Math.max(sim.stats.maxDeltaBraid, 1e-6);
  return sim.braidWord
    .filter((c) => c.glyphA === glyph || c.glyphB === glyph)
    .map((c) => {
      const step = sim.steps[c.t]!;
      const closeness = 1 - Math.min(1, step.deltaBraid / maxD);
      const matchBoost = c.matched ? 1 : 0.55;
      const both = c.glyphA === glyph && c.glyphB === glyph;
      return {
        t: c.t,
        glyphA: c.glyphA,
        glyphB: c.glyphB,
        matched: c.matched,
        both,
        kind: c.kind,
        score: matchBoost * (0.45 + 0.55 * closeness) * (both ? 1.15 : 1) * kindBoost(glyph, c.kind),
      };
    })
    .sort((a, b) => b.score - a.score);
}

export function formatNum(n: number, digits = 3): string {
  return n.toFixed(digits);
}

export function formatPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function formatSignedPct(n: number): string {
  const pct = Math.round(n * 100);
  return `${pct > 0 ? "+" : ""}${pct}%`;
}
