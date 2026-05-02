"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type BarPoint = {
  category: string;
  value: number;
};

type BarChartViewProps = {
  data: BarPoint[];
  isLoading: boolean;
  metricLabel: string;
  groupBy: "country" | "continent";
};

export default function BarChartView({ data, isLoading, metricLabel, groupBy }: BarChartViewProps) {
  const isPercentageMetric = metricLabel.includes("%");
  return (
    <div className="w-full h-full min-h-[400px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 12, right: 24, left: 12, bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            type="category"
            dataKey="category"
            width={150}
            tick={{ fill: "#64748b", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#fff", borderRadius: "4px", border: "1px solid #e2e8f0" }}
            formatter={(value: number) => [
              isPercentageMetric ? `${value.toFixed(4)}%` : new Intl.NumberFormat("en-US").format(value),
              metricLabel,
            ]}
            labelFormatter={(label) => `${groupBy === "country" ? "Country" : "Continent"}: ${label}`}
          />
          <Bar dataKey="value" fill="#c2410c" radius={[0, 4, 4, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>

      {isLoading && (
        <div className="absolute inset-0 bg-white/80 p-4 pointer-events-none">
          <div className="h-full w-full animate-pulse rounded border border-slate-200 bg-slate-100" />
        </div>
      )}

      {!isLoading && data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500 pointer-events-none">
          No bar chart data available for this selection.
        </div>
      )}
    </div>
  );
}
