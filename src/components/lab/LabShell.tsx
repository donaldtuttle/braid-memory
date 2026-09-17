import { useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Shuffle,
} from "lucide-react";
import { AgentCard } from "@/components/lab/AgentCard";
import {
  ArtinBraid,
  BraidFrame,
  CrossingReadout,
  GeminiPath,
} from "@/components/lab/BraidDiagram";
import { BraidWord } from "@/components/lab/BraidWord";
import { IntentChart } from "@/components/lab/IntentChart";
import { InstrumentPanel, GlyphKey } from "@/components/lab/InstrumentPanel";
import { ParamDock } from "@/components/lab/ParamDock";
import { RecallPanel } from "@/components/lab/RecallPanel";
import { ReflectiveStack } from "@/components/lab/ReflectiveStack";
import { StatsStrip } from "@/components/lab/StatsStrip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLab } from "@/lib/braid/store";
import { cn } from "@/lib/utils";

function phaseCopy(phase: string, source: string): { title: string; body: string } {
  const ops = source !== "random";
  if (phase === "diverging") {
    return {
      title: "Divergence",
      body: ops
        ? "Ξ_B switches to fear. Operator mix shifts toward Θλ retrieve and Λψ collapse; writes (Σ◯) drop. ΔΨ climbs."
        : "Ξ_B switches to fear. Glyphs stay uniform random — only emotion weight moves ΔΨ. This is the control.",
    };
  }
  if (phase === "reentangling") {
    return {
      title: "Re-entanglement",
      body: ops
        ? "Mix returns toward write + lineage. If identity crossings recover, braid extra-damps beyond hysteresis. Read the ablation."
        : "Emotion weight hysteretic-returns. Random glyphs cannot recover identity density, so γ is a near-constant subtract.",
    };
  }
  return {
    title: "Entangled",
    body: ops
      ? "Both agents on the curiosity mix: telemetry, durable write, retrieve, occasional collapse, lineage."
      : "Both agents share curiosity. Glyphs are independent draws; GeminiPath already writes the offset braid.",
  };
}

export function LabShell() {
  const hydrate = useLab((s) => s.hydrate);
  const params = useLab((s) => s.params);
  const sim = useLab((s) => s.sim);
  const cursor = useLab((s) => s.cursor);
  const playing = useLab((s) => s.playing);
  const view = useLab((s) => s.view);
  const selectedT = useLab((s) => s.selectedT);
  const recall = useLab((s) => s.recallGlyph);
  const setParams = useLab((s) => s.setParams);
  const applyPreset = useLab((s) => s.applyPreset);
  const reseed = useLab((s) => s.reseed);
  const setCursor = useLab((s) => s.setCursor);
  const setView = useLab((s) => s.setView);
  const setSelectedT = useLab((s) => s.setSelectedT);
  const setRecallGlyph = useLab((s) => s.setRecallGlyph);
  const togglePlay = useLab((s) => s.togglePlay);
  const stepBy = useLab((s) => s.stepBy);
  const hydrated = useLab((s) => s.hydrated);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      const { cursor: t, sim: live, pause } = useLab.getState();
      if (t >= live.params.steps - 1) {
        pause();
        return;
      }
      useLab.setState({ cursor: t + 1 });
    }, 380);
    return () => window.clearInterval(id);
  }, [playing]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (["INPUT", "TEXTAREA", "SELECT", "BUTTON", "A"].includes(tag ?? "")) return;
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        stepBy(1);
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        stepBy(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, stepBy]);

  const step = sim.steps[cursor] ?? sim.steps[sim.steps.length - 1]!;
  const inspect = selectedT ?? (cursor < sim.params.steps - sim.params.deltaT ? cursor : null);
  const copy = phaseCopy(step.phase, sim.params.source);

  function jump(t: number) {
    setCursor(t);
    setSelectedT(t);
  }

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-bg text-fg">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 45% at 50% -10%, color-mix(in oklab, var(--color-strand-a) 10%, transparent), transparent), radial-gradient(ellipse 55% 40% at 90% 110%, color-mix(in oklab, var(--color-strand-b) 8%, transparent), transparent)",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <header className="flex flex-col gap-5 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="font-mono text-[11px] tracking-[0.18em] text-muted uppercase">
              Instrument · HME operators
            </p>
            <h1 className="mt-2 font-display text-4xl leading-none tracking-[-0.03em] md:text-5xl">
              Braid Memory
            </h1>
            <p className="mt-2 max-w-xl text-sm text-muted">
              Sweep γ and Δt. If dampening tracks hysteresis, the braid is not
              doing the work. Operator glyphs are the QOFT set HME writes on the
              ledger — this lab does not touch the field.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="seed" className="sr-only">
                Seed
              </Label>
              <Input
                id="seed"
                inputMode="numeric"
                className="h-11 w-[5.5rem]"
                value={params.seed}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (Number.isFinite(n)) setParams({ seed: Math.trunc(n) });
                }}
                aria-label="Simulation seed"
              />
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={reseed}
                aria-label="Reseed"
              >
                <Shuffle className="size-4" />
              </Button>
            </div>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => stepBy(-1)}
              aria-label="Step back"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="primary"
              onClick={togglePlay}
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? (
                <Pause className="size-4" />
              ) : (
                <Play className="size-4 ml-0.5" />
              )}
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => stepBy(1)}
              aria-label="Step forward"
            >
              <ChevronRight className="size-4" />
            </Button>
            <span className="ml-1 font-mono text-sm tabular-nums text-muted">
              t {cursor}/{sim.params.steps - 1}
            </span>
          </div>
        </header>

        <div className="mt-6 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
          <div className="min-w-0 space-y-4">
            <Tabs
              value={view}
              onValueChange={(v) => setView(v as "gemini" | "artin")}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <TabsList>
                  <TabsTrigger value="gemini">GeminiPath</TabsTrigger>
                  <TabsTrigger value="artin">Artin braid</TabsTrigger>
                </TabsList>
                <span
                  className={cn(
                    "font-mono text-[11px] tracking-wide uppercase",
                    step.phase === "diverging"
                      ? "text-diverge"
                      : step.phase === "reentangling"
                        ? "text-reentangle"
                        : "text-muted",
                  )}
                >
                  {copy.title}
                </span>
              </div>
              <TabsContent value="gemini">
                <BraidFrame caption="Γ_Gemini pairs Ξ_A[t] with Ξ_B[t+Δt]. Green identity, teal write→retrieve, rust telemetry→collapse, gold lineage.">
                  <GeminiPath
                    sim={sim}
                    cursor={cursor}
                    selectedT={selectedT}
                    recallGlyph={recall}
                    onSelect={jump}
                  />
                </BraidFrame>
              </TabsContent>
              <TabsContent value="artin">
                <BraidFrame caption="2-strand Artin word. Matched glyphs stay in lane (identity); mismatches cross, over-strand by glyph index.">
                  <ArtinBraid
                    sim={sim}
                    cursor={cursor}
                    selectedT={selectedT}
                    recallGlyph={recall}
                    onSelect={jump}
                  />
                </BraidFrame>
              </TabsContent>
            </Tabs>
            <div className="rounded-[var(--radius-lg)] bg-surface px-4 py-3 shadow-[var(--shadow-border)]">
              <CrossingReadout sim={sim} t={inspect} />
              <p className="mt-2 text-sm text-muted">{copy.body}</p>
            </div>
            <div className="rounded-[var(--radius-xl)] bg-surface p-4 shadow-[var(--shadow-border)]">
              <h3 className="font-display text-lg leading-tight">ΔΨintent</h3>
              <p className="mt-1 text-xs text-muted">
                Raw |Ψ_A − Ψ_B| versus braid-corrected (minus γ · coherence). Gap
                is Γ; drop after re-entangle is hysteresis plus any identity recovery.
              </p>
              <IntentChart sim={sim} cursor={cursor} />
            </div>
            <ReflectiveStack sim={sim} cursor={cursor} onSelect={jump} />
          </div>

          <aside className="min-w-0 space-y-4">
            <InstrumentPanel sim={sim} />
            <AgentCard name="Ξ_A" strand="a" step={step} />
            <AgentCard name="Ξ_B" strand="b" step={step} />
            <StatsStrip sim={sim} />
            <RecallPanel
              sim={sim}
              active={recall}
              onPick={setRecallGlyph}
              onJump={jump}
            />
            <BraidWord
              sim={sim}
              cursor={cursor}
              selectedT={selectedT}
              onSelect={jump}
            />
          </aside>
        </div>

        <div className="mt-4">
          {hydrated ? (
            <ParamDock
              params={params}
              onChange={setParams}
              onPreset={applyPreset}
            />
          ) : (
            <div className="h-48 rounded-[var(--radius-xl)] bg-surface" />
          )}
        </div>

        <footer className="mt-8 border-t border-border pt-5 text-xs text-subtle">
          <GlyphKey />
          <p className="mt-4">
            HME stores payloads as FFT patterns plus a ledger (hashes, position,
            glyph). Glyphs there are operation tags: Σ◯ default write, Θλ retrieve
            / ReplayPlan, Λψ collapse, Ψmeta telemetry, Π↺ QMesh lineage.
            ApplyReplay is a mutation after retrieve, not a stored glyph.
          </p>
          <p className="mt-1">
            Space plays, arrows step. Seed is deterministic. Side quest of{" "}
            <a
              className="text-muted underline decoration-border underline-offset-2 hover:text-fg"
              href="https://github.com/donaldtuttle/HME"
              target="_blank"
              rel="noreferrer"
            >
              donaldtuttle/HME
            </a>
            .
          </p>
        </footer>
      </div>
    </div>
  );
}
