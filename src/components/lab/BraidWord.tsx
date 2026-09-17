import type { PairKind, Simulation } from "@/lib/braid/types";
import { cn } from "@/lib/utils";

function kindClass(kind: PairKind): string {
  if (kind === "identity") return "bg-reentangle/15 text-reentangle";
  if (kind === "write-retrieve") return "bg-strand-a/15 text-strand-a";
  if (kind === "telemetry-collapse") return "bg-diverge/15 text-diverge";
  if (kind === "lineage") return "bg-strand-b/15 text-strand-b";
  return "bg-elevated text-fg";
}

export function BraidWord({
  sim,
  cursor,
  selectedT,
  onSelect,
}: {
  sim: Simulation;
  cursor: number;
  selectedT: number | null;
  onSelect: (t: number) => void;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] bg-surface p-4 shadow-[var(--shadow-border)]">
      <header className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="font-display text-lg leading-tight">Braid word</h3>
        <span className="font-mono text-xs text-muted">
          {sim.braidWord.length} crossings · {sim.stats.uniqueCrossings} unique
        </span>
      </header>
      <ol className="flex flex-wrap gap-1.5">
        {sim.braidWord.map((c) => {
          const on = c.t === cursor || c.t === selectedT;
          const faded = c.t > cursor;
          return (
            <li key={c.t}>
              <button
                type="button"
                onClick={() => onSelect(c.t)}
                className={cn(
                  "rounded-[var(--radius-sm)] px-2 py-1.5 font-mono text-xs transition-opacity duration-150",
                  kindClass(c.kind),
                  on && "ring-1 ring-accent",
                  faded && "opacity-30",
                )}
              >
                ({c.glyphA},{c.glyphB})
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
