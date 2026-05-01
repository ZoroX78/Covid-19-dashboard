"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export type LinePoint = {
  date: string;
  [country: string]: string | number | null;
};

type LineChartViewProps = {
  data: LinePoint[];
  isLoading: boolean;
  metricLabel: string;
  countries: string[];
};

const lineColors = [
  "#c2410c",
  "#1d4ed8",
  "#15803d",
  "#7c3aed",
  "#db2777",
  "#0891b2",
  "#b45309",
  "#4f46e5",
];

export default function LineChartView({ data, isLoading, metricLabel, countries }: LineChartViewProps) {
  return (
    <div className="w-full h-full min-h-[400px] flex flex-col relative">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 200,
            left: 0,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />

          <XAxis dataKey="date" axisLine={false} tickLine tick={{ fill: "#64748b", fontSize: 12 }} dy={10} minTickGap={50} />

          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />

          <Tooltip
            contentStyle={{ backgroundColor: "#fff", borderRadius: "4px", border: "1px solid #e2e8f0" }}
            itemStyle={{ fontSize: "14px" }}
            labelStyle={{ fontWeight: "bold", color: "#0f172a", marginBottom: "8px" }}
            formatter={(value: number | string | null, name: string) => [
              value === null ? "No data" : new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(Number(value)),
              name,
            ]}
          />

          {countries.map((country, index) => (
            <Line
              key={country}
              type="monotone"
              dataKey={country}
              name={country}
              stroke={lineColors[index % lineColors.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              isAnimationActive={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {data.length > 0 && countries.length > 0 && (
        <div className="absolute right-0 top-0 h-full w-[180px] pointer-events-none flex flex-col pt-10 pb-[60px] text-xs">
          <div className="absolute top-[32%] text-[#334155]">{metricLabel}</div>
        </div>
      )}

      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500 pointer-events-none">
          Loading chart data...
        </div>
      )}

      {!isLoading && data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500 pointer-events-none">
          No chart data available for this selection.
        </div>
      )}
    </div>
  );
}
