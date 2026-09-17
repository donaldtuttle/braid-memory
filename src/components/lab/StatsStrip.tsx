import { formatNum, formatPct, formatSignedPct } from "@/lib/braid/engine";
import type { Simulation } from "@/lib/braid/types";

function Cell({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] tracking-wide text-muted uppercase">{label}</div>
      <div className="mt-0.5 font-mono text-sm tabular-nums text-fg">{value}</div>
      {hint ? <div className="mt-0.5 text-[11px] text-subtle">{hint}</div> : null}
    </div>
  );
}

export function StatsStrip({ sim }: { sim: Simulation }) {
  const s = sim.stats;
  return (
    <div className="grid grid-cols-2 gap-4 rounded-[var(--radius-lg)] bg-surface p-4 shadow-[var(--shadow-border)] sm:grid-cols-3 lg:grid-cols-6">
      <Cell label="Match rate" value={formatPct(s.matchRate)} hint="identity crossings" />
      <Cell
        label="Dampening"
        value={formatPct(s.dampening)}
        hint={s.harmonicWrite ? "harmonizing" : "still fractured"}
      />
      <Cell
        label="Braid share"
        value={formatSignedPct(s.braidShare)}
        hint={s.verdict}
      />
      <Cell label="Mean ΔΨ div" value={formatNum(s.meanDeltaDiv)} />
      <Cell label="Mean ΔΨ post" value={formatNum(s.meanDeltaPost)} />
      <Cell label="Σ◯ → Θλ" value={String(s.writeRetrieve)} hint="write-retrieve pairs" />
    </div>
  );
}
