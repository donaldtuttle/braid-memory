import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pairKind, runCore, runSimulation } from "./engine.ts";
import { DEFAULT_PARAMS, GLYPHS, type Glyph } from "./types.ts";

describe("HME 3 operations", () => {
  it("uses plain v3 labels, not the archived QOFT glyphs", () => {
    assert.deepEqual([...GLYPHS], ["measure", "event", "write", "retrieve", "lineage"]);
  });

  it("classifies write→retrieve and identity", () => {
    assert.equal(pairKind("write", "retrieve"), "write-retrieve");
    assert.equal(pairKind("retrieve", "write"), "write-retrieve");
    assert.equal(pairKind("write", "write"), "identity");
    assert.equal(pairKind("measure", "event"), "telemetry-collapse");
    assert.equal(pairKind("lineage", "retrieve"), "lineage");
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

  it("emits only HME 3 operation labels", () => {
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
    const fearOps = sim.stats.mixBDiv.retrieve + sim.stats.mixBDiv.event;
    const aFearish = sim.stats.mixA.retrieve + sim.stats.mixA.event;
    assert.ok(
      fearOps > aFearish,
      `B diverge retrieve+collapse ${fearOps} vs A ${aFearish}`,
    );
    assert.ok(sim.stats.mixBDiv.write < sim.stats.mixA.write + 0.05);
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
