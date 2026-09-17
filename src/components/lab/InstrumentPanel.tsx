import { formatNum, formatPct, formatSignedPct } from "@/lib/braid/engine";
import {
  GLYPHS,
  GLYPH_META,
  type AblationVerdict,
  type Glyph,
  type GlyphMix,
  type Simulation,
} from "@/lib/braid/types";
import { cn } from "@/lib/utils";

const VERDICT: Record<AblationVerdict, { title: string; body: string }> = {
  none: {
    title: "Still fractured",
    body: "ΔΨ does not drop after re-entangle. Raise γ, tighten Δt, or switch to operators and watch match rate by phase.",
  },
  hysteresis: {
    title: "Hysteresis does the work",
    body: "Emotion weight walking back to curiosity explains the drop. Identity density did not recover — γ is not extra-damping.",
  },
  mixed: {
    title: "Split credit",
    body: "Emotion return and identity recovery both move ΔΨ. Check the 16-seed sweep before treating it as a signal.",
  },
  braid: {
    title: "Braid extra-damps",
    body: "Match rate recovered after re-entangle. GeminiPath is doing work beyond hysteresis — the claim the notebook made.",
  },
};

function MixBars({ mix, label }: { mix: GlyphMix; label: string }) {
  return (
    <div>
      <div className="mb-2 font-mono text-[11px] tracking-wide text-muted uppercase">
        {label}
      </div>
      <ul className="space-y-1.5">
        {GLYPHS.map((g) => (
          <li key={g} className="flex items-center gap-2">
            <span className="w-11 shrink-0 font-mono text-[11px] text-fg">{g}</span>
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-elevated">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.max(2, mix[g] * 100)}%`,
                  background: `var(--color-${GLYPH_META[g].token})`,
                }}
              />
            </div>
            <span className="w-8 shrink-0 text-right font-mono text-[11px] tabular-nums text-muted">
              {Math.round(mix[g] * 100)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ShareBar({
  hysteresis,
  braid,
}: {
  hysteresis: number;
  braid: number;
}) {
  const h = Math.max(0, hysteresis);
  const b = Math.max(0, braid);
  const total = h + b;
  const hPct = total <= 1e-9 ? 0 : (h / total) * 100;
  const bPct = total <= 1e-9 ? 0 : (b / total) * 100;
  return (
    <div>
      <div className="mb-1.5 flex justify-between gap-2 text-[11px] tracking-wide text-muted uppercase">
        <span>Hysteresis {formatPct(h)}</span>
        <span>Identity {formatSignedPct(braid)}</span>
      </div>
      <div className="flex h-2 overflow-hidden rounded-full bg-elevated">
        <div className="bg-strand-b" style={{ width: `${hPct}%` }} />
        <div className="bg-strand-a" style={{ width: `${bPct}%` }} />
      </div>
    </div>
  );
}

const KIND_LABEL: Record<string, string> = {
  identity: "identity",
  "write-retrieve": "Σ◯ → Θλ",
  "telemetry-collapse": "Ψmeta → Λψ",
  lineage: "Π↺ lineage",
};

export function InstrumentPanel({ sim }: { sim: Simulation }) {
  const s = sim.stats;
  const v = VERDICT[s.verdict];
  const pairs: { kind: string; n: number }[] = [
    { kind: "identity", n: sim.braidWord.filter((c) => c.kind === "identity").length },
    { kind: "write-retrieve", n: s.writeRetrieve },
    { kind: "telemetry-collapse", n: s.telemetryCollapse },
    { kind: "lineage", n: s.lineageLocks },
  ];

  return (
    <section className="rounded-[var(--radius-lg)] bg-surface p-4 shadow-[var(--shadow-border)]">
      <header className="mb-3">
        <p className="font-mono text-[11px] tracking-[0.16em] text-muted uppercase">
          Ablation
        </p>
        <h3 className="mt-1 font-display text-lg leading-tight">{v.title}</h3>
        <p className="mt-1 text-xs text-muted">{v.body}</p>
      </header>

      <ShareBar hysteresis={s.dampeningRaw} braid={s.braidShare} />

      <dl className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-[11px] tracking-wide text-muted uppercase">Match pre</dt>
          <dd className="mt-0.5 font-mono tabular-nums">{formatPct(s.matchRatePre)}</dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-wide text-muted uppercase">Match div</dt>
          <dd className="mt-0.5 font-mono tabular-nums text-diverge">
            {formatPct(s.matchRateDiv)}
          </dd>
        </div>
        <div>
          <dt className="text-[11px] tracking-wide text-muted uppercase">Match post</dt>
          <dd className="mt-0.5 font-mono tabular-nums text-reentangle">
            {formatPct(s.matchRatePost)}
          </dd>
        </div>
      </dl>

      <p className="mt-3 font-mono text-[11px] leading-relaxed text-subtle">
        16 seeds from {sim.params.seed}: braid extra-damps {sim.sweep.braidWins}/
        {sim.sweep.n}, hysteresis {sim.sweep.hysteresisWins}/{sim.sweep.n}, mean share{" "}
        {formatNum(sim.sweep.meanBraidShare)}.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <MixBars mix={s.mixA} label="Ξ_A mix" />
        <MixBars mix={s.mixBDiv} label="Ξ_B during diverge" />
      </div>

      <ul className="mt-4 flex flex-wrap gap-1.5">
        {pairs.map((p) => (
          <li
            key={p.kind}
            className="rounded-full bg-elevated px-2.5 py-1 font-mono text-[11px] text-muted"
          >
            {KIND_LABEL[p.kind]} {p.n}
          </li>
        ))}
        <li className="rounded-full bg-elevated px-2.5 py-1 font-mono text-[11px] text-muted">
          Λψ density {formatPct(s.collapseDensity)}
        </li>
      </ul>

      <p className="mt-3 text-[11px] text-subtle">
        Operator mix is a hypothesis (fear → retrieve + collapse). Random source is
        the control. This panel does not write the HME field or ledger.
      </p>
    </section>
  );
}

export function GlyphKey({ glyphs }: { glyphs?: readonly Glyph[] }) {
  const list = glyphs ?? GLYPHS;
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1">
      {list.map((g) => (
        <li key={g} className="flex items-center gap-1.5 text-[11px] text-muted">
          <span
            className={cn("size-2 rounded-full")}
            style={{ background: `var(--color-${GLYPH_META[g].token})` }}
          />
          <span className="font-mono text-fg">{g}</span>
          <span>{GLYPH_META[g].role}</span>
        </li>
      ))}
    </ul>
  );
}
