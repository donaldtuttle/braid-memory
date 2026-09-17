import { recallGlyph } from "@/lib/braid/engine";
import { GLYPHS, GLYPH_META, type Glyph, type PairKind, type Simulation } from "@/lib/braid/types";
import { cn } from "@/lib/utils";

const KIND_HINT: Record<PairKind, string> = {
  identity: "identity",
  "write-retrieve": "write→retrieve",
  "telemetry-collapse": "telemetry→collapse",
  lineage: "lineage",
  other: "other",
};

export function RecallPanel({
  sim,
  active,
  onPick,
  onJump,
}: {
  sim: Simulation;
  active: Glyph | null;
  onPick: (g: Glyph) => void;
  onJump: (t: number) => void;
}) {
  const hits = active ? recallGlyph(sim, active) : [];

  return (
    <section className="rounded-[var(--radius-lg)] bg-surface p-4 shadow-[var(--shadow-border)]">
      <header className="mb-3">
        <h3 className="font-display text-lg leading-tight">Glyph address</h3>
        <p className="mt-1 text-xs text-muted">
          Ranked Gemini crossings. Not <span className="font-mono">retrieve_memory</span>
          , not a calibrated confidence.
        </p>
      </header>
      <div className="flex flex-wrap gap-1.5">
        {GLYPHS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => onPick(g)}
            className={cn(
              "min-h-11 min-w-11 rounded-[var(--radius-sm)] px-2.5 py-1.5 font-mono text-sm transition-colors duration-150",
              active === g
                ? "bg-accent text-accent-fg"
                : "bg-elevated text-fg hover:shadow-[var(--shadow-border-hover)]",
            )}
            aria-pressed={active === g}
            title={GLYPH_META[g].hme}
          >
            <span className="block leading-none">{g}</span>
            <span
              className={cn(
                "mt-1 block text-[10px] font-sans tracking-wide",
                active === g ? "text-accent-fg/70" : "text-subtle",
              )}
            >
              {GLYPH_META[g].role.split(" / ")[0]}
            </span>
          </button>
        ))}
      </div>
      {active ? (
        <ul className="mt-3 max-h-44 space-y-1 overflow-auto">
          {hits.length === 0 ? (
            <li className="text-sm text-muted">No crossings encode {active}.</li>
          ) : (
            hits.map((h) => (
              <li key={`${h.t}-${h.glyphA}-${h.glyphB}`}>
                <button
                  type="button"
                  onClick={() => onJump(h.t)}
                  className="flex w-full items-center justify-between gap-2 rounded-[var(--radius-sm)] px-2 py-2 text-left text-sm hover:bg-elevated"
                >
                  <span className="font-mono">
                    t={h.t}{" "}
                    <span className="text-strand-a">{h.glyphA}</span>
                    <span className="text-subtle"> · </span>
                    <span className="text-strand-b">{h.glyphB}</span>
                    <span className="ml-2 text-[11px] text-muted">
                      {KIND_HINT[h.kind]}
                    </span>
                  </span>
                  <span className="font-mono tabular-nums text-muted">
                    {h.score.toFixed(2)}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-muted">
          Probe an operator. Θλ boosts write→retrieve crossings; Λψ boosts
          telemetry→collapse.
        </p>
      )}
    </section>
  );
}
