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
  value: number;
};

type LineChartViewProps = {
  data: LinePoint[];
  isLoading: boolean;
  metricLabel: string;
};

export default function LineChartView({ data, isLoading, metricLabel }: LineChartViewProps) {
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
          />

          <Line
            type="monotone"
            dataKey="value"
            stroke="#c2410c"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>

      {data.length > 0 && (
        <div className="absolute right-0 top-0 h-full w-[180px] pointer-events-none flex flex-col pt-10 pb-[60px] text-xs">
          <div className="absolute top-[32%] text-[#c2410c]">{metricLabel}</div>
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
