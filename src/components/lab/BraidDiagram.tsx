import { useMemo, type ReactNode } from "react";
import { GLYPH_META, type Glyph, type PairKind, type Simulation } from "@/lib/braid/types";
import { cn } from "@/lib/utils";

const COL = 48;
const PAD_X = 40;
const H = 196;
const YA = 52;
const YB = 140;

function glyphFill(g: Glyph): string {
  return `var(--color-${GLYPH_META[g].token})`;
}

function kindStroke(kind: PairKind): string {
  if (kind === "identity") return "var(--color-reentangle)";
  if (kind === "write-retrieve") return "var(--color-strand-a)";
  if (kind === "telemetry-collapse") return "var(--color-diverge)";
  if (kind === "lineage") return "var(--color-strand-b)";
  return "var(--color-muted)";
}

function geminiPath(x0: number, y0: number, x1: number, y1: number): string {
  const mx = (x0 + x1) / 2;
  return `M ${x0} ${y0} C ${mx} ${y0 + 22}, ${mx} ${y1 - 22}, ${x1} ${y1}`;
}

export function GeminiPath({
  sim,
  cursor,
  selectedT,
  recallGlyph,
  onSelect,
}: {
  sim: Simulation;
  cursor: number;
  selectedT: number | null;
  recallGlyph: Glyph | null;
  onSelect: (t: number) => void;
}) {
  const { params, steps, braidWord } = sim;
  const width = PAD_X * 2 + (params.steps - 1) * COL;

  const recalled = useMemo(() => {
    if (!recallGlyph) return new Set<number>();
    return new Set(
      braidWord
        .filter((c) => c.glyphA === recallGlyph || c.glyphB === recallGlyph)
        .map((c) => c.t),
    );
  }, [braidWord, recallGlyph]);

  const xAt = (t: number) => PAD_X + t * COL;

  return (
    <svg
      viewBox={`0 0 ${width} ${H}`}
      width={width}
      height={H}
      className="block max-w-none"
      role="img"
      aria-label="GeminiPath braid: Ξ_A paired with Ξ_B offset by delta t"
    >
      <title>GeminiPath time-offset braid</title>
      <line
        x1={xAt(params.divergencePoint)}
        x2={xAt(params.divergencePoint)}
        y1={8}
        y2={H - 10}
        stroke="var(--color-diverge)"
        strokeDasharray="3 4"
        strokeWidth={1}
        opacity={0.7}
      />
      <line
        x1={xAt(params.reentanglePoint)}
        x2={xAt(params.reentanglePoint)}
        y1={8}
        y2={H - 10}
        stroke="var(--color-reentangle)"
        strokeDasharray="3 4"
        strokeWidth={1}
        opacity={0.7}
      />
      <text
        x={xAt(params.divergencePoint) + 6}
        y={14}
        fill="var(--color-diverge)"
        fontSize={9}
        fontFamily="var(--font-mono)"
      >
        diverge
      </text>
      <text
        x={xAt(params.reentanglePoint) + 6}
        y={14}
        fill="var(--color-reentangle)"
        fontSize={9}
        fontFamily="var(--font-mono)"
      >
        re-entangle
      </text>

      <line
        x1={PAD_X}
        x2={width - PAD_X}
        y1={YA}
        y2={YA}
        stroke="var(--color-strand-a)"
        strokeWidth={1.5}
        opacity={0.35}
      />
      <line
        x1={PAD_X}
        x2={width - PAD_X}
        y1={YB}
        y2={YB}
        stroke="var(--color-strand-b)"
        strokeWidth={1.5}
        opacity={0.35}
      />

      {braidWord.map((c) => {
        const x0 = xAt(c.t);
        const x1 = xAt(c.t + params.deltaT);
        const active = c.t === cursor || c.t === selectedT;
        const inRecall = recalled.has(c.t);
        const faded = (recallGlyph && !inRecall) || (c.t > cursor && !active);
        const d = geminiPath(x0, YA, x1, YB);
        return (
          <path
            key={c.t}
            d={d}
            fill="none"
            stroke={kindStroke(c.kind)}
            strokeWidth={active || inRecall ? 2.4 : 1.2}
            opacity={faded ? 0.12 : active ? 0.95 : c.kind === "other" ? 0.28 : 0.72}
            className="cursor-pointer"
            onClick={() => onSelect(c.t)}
          />
        );
      })}

      {steps.map((s) => {
        const x = xAt(s.t);
        const visible = s.t <= cursor;
        const hot = s.t === cursor;
        return (
          <g
            key={s.t}
            opacity={visible ? 1 : 0.22}
            className="cursor-pointer"
            onClick={() => onSelect(s.t)}
          >
            <text
              x={x}
              y={YA - 14}
              textAnchor="middle"
              fill="var(--color-strand-a)"
              fontSize={10}
              fontFamily="var(--font-mono)"
            >
              {GLYPH_META[s.glyphA].mark}
            </text>
            <circle
              cx={x}
              cy={YA}
              r={hot ? 6.5 : 5}
              fill={glyphFill(s.glyphA)}
              stroke={hot ? "var(--color-fg)" : "none"}
              strokeWidth={hot ? 1.5 : 0}
            />
            <circle cx={x} cy={YA} r={12} fill="transparent" />
            <circle
              cx={x}
              cy={YB}
              r={hot ? 6.5 : 5}
              fill={glyphFill(s.glyphB)}
              stroke={hot ? "var(--color-fg)" : "none"}
              strokeWidth={hot ? 1.5 : 0}
            />
            <circle cx={x} cy={YB} r={12} fill="transparent" />
            <text
              x={x}
              y={YB + 18}
              textAnchor="middle"
              fill="var(--color-strand-b)"
              fontSize={10}
              fontFamily="var(--font-mono)"
            >
              {GLYPH_META[s.glyphB].mark}
            </text>
            <text
              x={x}
              y={H - 6}
              textAnchor="middle"
              fill="var(--color-subtle)"
              fontSize={9}
              fontFamily="var(--font-mono)"
            >
              {s.t}
            </text>
          </g>
        );
      })}

      <text
        x={6}
        y={YA + 4}
        fill="var(--color-strand-a)"
        fontSize={10}
        fontFamily="var(--font-mono)"
      >
        Ξ_A
      </text>
      <text
        x={6}
        y={YB + 4}
        fill="var(--color-strand-b)"
        fontSize={10}
        fontFamily="var(--font-mono)"
      >
        Ξ_B
      </text>
    </svg>
  );
}

export function ArtinBraid({
  sim,
  cursor,
  selectedT,
  recallGlyph,
  onSelect,
}: {
  sim: Simulation;
  cursor: number;
  selectedT: number | null;
  recallGlyph: Glyph | null;
  onSelect: (t: number) => void;
}) {
  const { braidWord } = sim;
  const n = braidWord.length;
  const col = 52;
  const pad = 40;
  const width = pad * 2 + Math.max(n, 1) * col;
  const yLane = [48, 128] as const;
  const H = 176;

  const recalled = useMemo(() => {
    if (!recallGlyph) return new Set<number>();
    return new Set(
      braidWord
        .filter((c) => c.glyphA === recallGlyph || c.glyphB === recallGlyph)
        .map((c) => c.t),
    );
  }, [braidWord, recallGlyph]);

  type Seg = {
    t: number;
    agent: "A" | "B";
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    over: boolean;
    glyph: Glyph;
    matched: boolean;
  };

  const segs = useMemo(() => {
    const out: Seg[] = [];
    let laneA = 0;
    let laneB = 1;
    for (let i = 0; i < n; i++) {
      const c = braidWord[i]!;
      const x0 = pad + i * col;
      const x1 = pad + (i + 1) * col;
      const fromA = laneA;
      const fromB = laneB;
      let toA = fromA;
      let toB = fromB;
      if (!c.matched) {
        toA = fromB;
        toB = fromA;
      }
      const aOver = c.matched ? true : c.over === "A";
      out.push({
        t: c.t,
        agent: "A",
        x0,
        y0: yLane[fromA],
        x1,
        y1: yLane[toA],
        over: aOver,
        glyph: c.glyphA,
        matched: c.matched,
      });
      out.push({
        t: c.t,
        agent: "B",
        x0,
        y0: yLane[fromB],
        x1,
        y1: yLane[toB],
        over: !aOver && !c.matched ? true : c.matched,
        glyph: c.glyphB,
        matched: c.matched,
      });
      laneA = toA;
      laneB = toB;
    }
    return out;
  }, [braidWord, n]);

  function curve(s: Seg): string {
    const mx = (s.x0 + s.x1) / 2;
    return `M ${s.x0} ${s.y0} C ${mx} ${s.y0}, ${mx} ${s.y1}, ${s.x1} ${s.y1}`;
  }

  const under = segs.filter((s) => !s.over);
  const over = segs.filter((s) => s.over);

  function drawSeg(s: Seg, knockout: boolean) {
    const active = s.t === cursor || s.t === selectedT;
    const inRecall = recalled.has(s.t);
    const faded = (recallGlyph && !inRecall) || (s.t > cursor && !active);
    const color =
      s.agent === "A" ? "var(--color-strand-a)" : "var(--color-strand-b)";
    return (
      <path
        key={`${s.t}-${s.agent}-${knockout ? "k" : "s"}`}
        d={curve(s)}
        fill="none"
        stroke={knockout ? "var(--color-surface)" : color}
        strokeWidth={knockout ? 8 : active || inRecall ? 3.2 : 2.2}
        strokeLinecap="round"
        opacity={knockout ? 1 : faded ? 0.14 : 1}
        className={knockout ? undefined : "cursor-pointer"}
        onClick={knockout ? undefined : () => onSelect(s.t)}
      />
    );
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${H}`}
      width={width}
      height={H}
      className="block max-w-none"
      role="img"
      aria-label="Artin 2-strand braid of Gemini pairings"
    >
      <title>Artin braid of Gemini crossings</title>
      {under.map((s) => drawSeg(s, false))}
      {over.map((s) => drawSeg(s, true))}
      {over.map((s) => drawSeg(s, false))}

      {braidWord.map((c, i) => {
        const x = pad + (i + 1) * col;
        const visible = c.t <= cursor;
        return (
          <text
            key={c.t}
            x={x}
            y={H - 8}
            textAnchor="middle"
            fill="var(--color-subtle)"
            fontSize={9}
            fontFamily="var(--font-mono)"
            opacity={visible ? 1 : 0.25}
          >
            {c.t}
          </text>
        );
      })}
      <text
        x={8}
        y={52}
        fill="var(--color-muted)"
        fontSize={9}
        fontFamily="var(--font-mono)"
      >
        lane 0
      </text>
      <text
        x={8}
        y={132}
        fill="var(--color-muted)"
        fontSize={9}
        fontFamily="var(--font-mono)"
      >
        lane 1
      </text>
    </svg>
  );
}

export function BraidFrame({
  children,
  caption,
}: {
  children: ReactNode;
  caption: string;
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]">
      <div className="min-w-0 overflow-x-auto overscroll-x-contain">
        {children}
      </div>
      <p className="mt-3 text-xs text-muted">{caption}</p>
    </div>
  );
}

export function CrossingReadout({
  sim,
  t,
}: {
  sim: Simulation;
  t: number | null;
}) {
  if (t === null) {
    return (
      <p className="text-sm text-muted">
        Click a crossing or bead to inspect the Gemini pairing.
      </p>
    );
  }
  const cross = sim.braidWord.find((c) => c.t === t);
  const step = sim.steps[t];
  if (!step) return null;
  const kindLabel =
    cross?.kind === "write-retrieve"
      ? "write → retrieve"
      : cross?.kind === "telemetry-collapse"
        ? "telemetry → collapse"
        : cross?.kind === "lineage"
          ? "lineage"
          : cross?.matched
            ? "identity"
            : cross
              ? `σ ${cross.over} over`
              : null;
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 font-mono text-sm">
      <span className="text-muted">t={t}</span>
      <span>
        <span className="text-strand-a">Ξ_A</span> {step.glyphA}
      </span>
      {cross ? (
        <span>
          Γ <span className="text-strand-b">Ξ_B[t+Δt]</span> {cross.glyphB}
          <span
            className={cn(
              "ml-2",
              cross.kind === "identity"
                ? "text-reentangle"
                : cross.kind === "write-retrieve"
                  ? "text-strand-a"
                  : cross.kind === "telemetry-collapse"
                    ? "text-diverge"
                    : "text-muted",
            )}
          >
            {kindLabel}
          </span>
        </span>
      ) : (
        <span className="text-subtle">no Gemini window</span>
      )}
      <span className="text-muted">ΔΨ {step.deltaBraid.toFixed(3)}</span>
    </div>
  );
}
