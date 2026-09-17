import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { DEFAULT_PARAMS, PRESETS, type SimParams, type TraceSource } from "@/lib/braid/types";
import { cn } from "@/lib/utils";

function Row({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <Label>{label}</Label>
        <span className="font-mono text-xs tabular-nums text-fg">{value}</span>
      </div>
      {children}
    </div>
  );
}

function sourceOf(p: SimParams): TraceSource {
  return p.source === "random" ? "random" : "operators";
}

export function ParamDock({
  params,
  onChange,
  onPreset,
}: {
  params: SimParams;
  onChange: (patch: Partial<SimParams>) => void;
  onPreset: (patch: Partial<SimParams>) => void;
}) {
  return (
    <section className="rounded-[var(--radius-xl)] bg-surface p-4 shadow-[var(--shadow-border)] md:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-full bg-elevated p-0.5">
          {(
            [
              ["operators", "HME operators"],
              ["random", "Random control"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onChange({ source: id })}
              className={cn(
                "h-9 rounded-full px-3 text-xs transition-colors duration-150",
                sourceOf(params) === id
                  ? "bg-accent text-accent-fg"
                  : "text-muted hover:text-fg",
              )}
              aria-pressed={sourceOf(params) === id}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => {
            const merged = { ...DEFAULT_PARAMS, ...p.params };
            const active =
              sourceOf(merged) === sourceOf(params) &&
              merged.divergencePoint === params.divergencePoint &&
              merged.reentanglePoint === params.reentanglePoint &&
              merged.deltaT === params.deltaT &&
              merged.gamma === params.gamma &&
              merged.seed === params.seed;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPreset(p.params)}
                className={cn(
                  "h-9 rounded-full px-3 text-xs transition-colors duration-150",
                  active
                    ? "bg-accent text-accent-fg"
                    : "bg-elevated text-muted hover:text-fg",
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Row label="Steps" value={String(params.steps)}>
          <Slider
            min={8}
            max={32}
            step={1}
            value={[params.steps]}
            onValueChange={([v]) => v !== undefined && onChange({ steps: v })}
          />
        </Row>
        <Row label="Divergence" value={`t = ${params.divergencePoint}`}>
          <Slider
            min={1}
            max={params.steps - 3}
            step={1}
            value={[params.divergencePoint]}
            onValueChange={([v]) =>
              v !== undefined && onChange({ divergencePoint: v })
            }
          />
        </Row>
        <Row label="Re-entangle" value={`t = ${params.reentanglePoint}`}>
          <Slider
            min={params.divergencePoint + 1}
            max={params.steps - 1}
            step={1}
            value={[params.reentanglePoint]}
            onValueChange={([v]) =>
              v !== undefined && onChange({ reentanglePoint: v })
            }
          />
        </Row>
        <Row label="Δt Gemini" value={String(params.deltaT)}>
          <Slider
            min={1}
            max={Math.max(1, params.steps - 4)}
            step={1}
            value={[params.deltaT]}
            onValueChange={([v]) => v !== undefined && onChange({ deltaT: v })}
          />
        </Row>
        <Row label="γ braid" value={params.gamma.toFixed(2)}>
          <Slider
            min={0}
            max={1.5}
            step={0.05}
            value={[params.gamma]}
            onValueChange={([v]) => v !== undefined && onChange({ gamma: v })}
          />
        </Row>
        <Row label="Hysteresis" value={params.decay.toFixed(2)}>
          <Slider
            min={0.04}
            max={0.4}
            step={0.02}
            value={[params.decay]}
            onValueChange={([v]) => v !== undefined && onChange({ decay: v })}
          />
        </Row>
      </div>
    </section>
  );
}
