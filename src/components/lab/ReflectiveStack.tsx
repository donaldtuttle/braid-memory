import { GLYPH_META, type Simulation } from "@/lib/braid/types";
import { cn } from "@/lib/utils";

export function ReflectiveStack({
  sim,
  cursor,
  onSelect,
}: {
  sim: Simulation;
  cursor: number;
  onSelect: (t: number) => void;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] bg-surface p-4 shadow-[var(--shadow-border)]">
      <header className="mb-3">
        <h3 className="font-display text-lg leading-tight">ReflectiveStack</h3>
        <p className="mt-1 text-xs text-muted">
          Memory-layer trace persistence. Each row is a recursion step.
        </p>
      </header>
      <ol
        className="grid gap-1"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(2.25rem, 1fr))" }}
      >
        {sim.steps.map((s) => {
          const written = s.t <= cursor;
          const hot = s.t === cursor;
          return (
            <li key={s.t}>
              <button
                type="button"
                onClick={() => onSelect(s.t)}
                className={cn(
                  "flex aspect-square w-full flex-col items-center justify-center rounded-[var(--radius-xs)] font-mono text-[10px] leading-none transition-opacity duration-150",
                  written ? "bg-elevated text-fg" : "bg-bg text-subtle",
                  hot && "ring-1 ring-accent",
                  s.phase === "diverging" && written && "ring-1 ring-diverge/50",
                  s.phase === "reentangling" &&
                    written &&
                    "ring-1 ring-reentangle/40",
                )}
                aria-label={`Step ${s.t} ${s.glyphA} ${s.glyphB}`}
              >
                <span className="text-strand-a">{GLYPH_META[s.glyphA].mark}</span>
                <span className="mt-0.5 text-strand-b">{GLYPH_META[s.glyphB].mark}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
