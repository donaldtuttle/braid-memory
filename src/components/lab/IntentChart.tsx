import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { Simulation } from "@/lib/braid/types";

export function IntentChart({
  sim,
  cursor,
}: {
  sim: Simulation;
  cursor: number;
}) {
  const data = sim.steps.map((s) => ({
    t: s.t,
    raw: Number(s.deltaRaw.toFixed(4)),
    braid: Number(s.deltaBraid.toFixed(4)),
  }));

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid stroke="color-mix(in oklab, var(--color-fg) 6%, transparent)" />
          <XAxis
            dataKey="t"
            stroke="var(--color-subtle)"
            tick={{ fill: "var(--color-subtle)", fontSize: 11, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="var(--color-subtle)"
            tick={{ fill: "var(--color-subtle)", fontSize: 11, fontFamily: "var(--font-mono)" }}
            tickLine={false}
            axisLine={false}
            width={36}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-elevated)",
              border: "1px solid color-mix(in oklab, var(--color-fg) 12%, transparent)",
              borderRadius: 8,
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--color-fg)",
            }}
            formatter={(value, name) => [
              Number(value).toFixed(3),
              name === "raw" ? "raw ΔΨ" : "braid ΔΨ",
            ]}
            labelFormatter={(l) => `step ${l}`}
          />
          <ReferenceLine
            x={sim.params.divergencePoint}
            stroke="var(--color-diverge)"
            strokeDasharray="3 4"
          />
          <ReferenceLine
            x={sim.params.reentanglePoint}
            stroke="var(--color-reentangle)"
            strokeDasharray="3 4"
          />
          <ReferenceLine
            x={cursor}
            stroke="var(--color-fg)"
            strokeOpacity={0.35}
          />
          <Line
            type="monotone"
            dataKey="raw"
            stroke="var(--color-muted)"
            strokeWidth={1.4}
            dot={false}
            opacity={0.45}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="braid"
            stroke="var(--color-strand-a)"
            strokeWidth={2.2}
            dot={{ r: 3, fill: "var(--color-strand-a)", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
