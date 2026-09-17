import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pairKind, runCore, runSimulation } from "./engine.ts";
import { DEFAULT_PARAMS, GLYPHS, type Glyph } from "./types.ts";

describe("HME operator glyphs", () => {
  it("uses the QOFT ledger set, not the notebook alphabet", () => {
    assert.deepEqual([...GLYPHS], ["Ψmeta", "Λψ", "Σ◯", "Θλ", "Π↺"]);
  });

  it("classifies write→retrieve and identity", () => {
    assert.equal(pairKind("Σ◯", "Θλ"), "write-retrieve");
    assert.equal(pairKind("Θλ", "Σ◯"), "write-retrieve");
    assert.equal(pairKind("Σ◯", "Σ◯"), "identity");
    assert.equal(pairKind("Ψmeta", "Λψ"), "telemetry-collapse");
    assert.equal(pairKind("Π↺", "Θλ"), "lineage");
  });
});

describe("runCore", () => {
  it("is deterministic for a seed", () => {
    const a = runCore({ ...DEFAULT_PARAMS, seed: 7 });
    const b = runCore({ ...DEFAULT_PARAMS, seed: 7 });
    assert.deepEqual(
      a.steps.map((s) => s.glyphA),
      b.steps.map((s) => s.glyphA),
    );
    assert.deepEqual(
      a.steps.map((s) => s.glyphB),
      b.steps.map((s) => s.glyphB),
    );
    assert.equal(a.stats.braidShare, b.stats.braidShare);
  });

  it("emits only HME glyphs", () => {
    const sim = runCore({ ...DEFAULT_PARAMS, steps: 32, seed: 41 });
    const allowed = new Set<Glyph>(GLYPHS);
    for (const s of sim.steps) {
      assert.ok(allowed.has(s.glyphA));
      assert.ok(allowed.has(s.glyphB));
    }
  });

  it("γ = 0 makes braid share vanish", () => {
    const sim = runCore({ ...DEFAULT_PARAMS, gamma: 0, seed: 7 });
    assert.ok(Math.abs(sim.stats.braidShare) < 1e-9);
    assert.equal(sim.stats.dampening, sim.stats.dampeningRaw);
  });

  it("operator mix shifts Ξ_B toward retrieve + collapse while diverging", () => {
    const sim = runCore({
      ...DEFAULT_PARAMS,
      source: "operators",
      steps: 36,
      divergencePoint: 8,
      reentanglePoint: 24,
      seed: 13,
    });
    const fearOps = sim.stats.mixBDiv.Θλ + sim.stats.mixBDiv.Λψ;
    const aFearish = sim.stats.mixA.Θλ + sim.stats.mixA.Λψ;
    assert.ok(
      fearOps > aFearish,
      `B diverge retrieve+collapse ${fearOps} vs A ${aFearish}`,
    );
    assert.ok(sim.stats.mixBDiv["Σ◯"] < sim.stats.mixA["Σ◯"] + 0.05);
  });

  it("random source does not systematically extra-damp", () => {
    const sim = runSimulation({
      ...DEFAULT_PARAMS,
      source: "random",
      gamma: 0.85,
      steps: 32,
      divergencePoint: 8,
      reentanglePoint: 20,
      seed: 5,
    });
    assert.ok(
      Math.abs(sim.sweep.meanBraidShare) < 0.15,
      `random braid share ${sim.sweep.meanBraidShare}`,
    );
  });
});
