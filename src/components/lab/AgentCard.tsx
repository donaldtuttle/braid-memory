import { GLYPH_META, type StepRecord } from "@/lib/braid/types";
import { cn } from "@/lib/utils";

export function AgentCard({
  name,
  strand,
  step,
}: {
  name: string;
  strand: "a" | "b";
  step: StepRecord;
}) {
  const glyph = strand === "a" ? step.glyphA : step.glyphB;
  const emotion = strand === "a" ? step.emotionA : step.emotionB;
  const weight = strand === "a" ? step.weightA : step.weightB;
  const psi = strand === "a" ? step.psiA : step.psiB;
  const coh = strand === "a" ? step.coherenceA : step.coherenceB;
  const tone = strand === "a" ? "text-strand-a" : "text-strand-b";
  const bar = strand === "a" ? "bg-strand-a" : "bg-strand-b";
  const weightNorm = (weight - 0.6) / 0.5;
  const meta = GLYPH_META[glyph];

  return (
    <article className="rounded-[var(--radius-lg)] bg-surface p-4 shadow-[var(--shadow-border)]">
      <header className="flex items-baseline justify-between gap-3">
        <h3 className={cn("font-mono text-sm tracking-wide", tone)}>{name}</h3>
        <span className="font-display text-2xl leading-none">{glyph}</span>
      </header>
      <p className="mt-1 text-xs text-muted">{meta.hme}</p>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
        <div>
          <dt className="text-xs tracking-wide text-muted uppercase">Emotion</dt>
          <dd className="mt-0.5 capitalize">{emotion}</dd>
        </div>
        <div>
          <dt className="text-xs tracking-wide text-muted uppercase">Ψintent</dt>
          <dd className="mt-0.5 font-mono tabular-nums">{psi.toFixed(3)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="flex justify-between text-xs tracking-wide text-muted uppercase">
            <span>Weight</span>
            <span className="font-mono tabular-nums normal-case">{weight.toFixed(3)}</span>
          </dt>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-elevated">
            <div
              className={cn("h-full rounded-full", bar)}
              style={{ width: `${Math.max(4, Math.min(100, weightNorm * 100))}%` }}
            />
          </div>
        </div>
        <div className="col-span-2">
          <dt className="flex justify-between text-xs tracking-wide text-muted uppercase">
            <span>Coherence</span>
            <span className="font-mono tabular-nums normal-case">{coh.toFixed(3)}</span>
          </dt>
          <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-elevated">
            <div
              className="h-full rounded-full bg-fg/50"
              style={{ width: `${coh * 100}%` }}
            />
          </div>
        </div>
      </dl>
    </article>
  );
}
