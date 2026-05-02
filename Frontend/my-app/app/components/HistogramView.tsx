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

export type HistogramBin = {
  label: string;
  start: number;
  end: number;
  count: number;
  countries: string[];
};

type HistogramViewProps = {
  data: HistogramBin[];
  isLoading: boolean;
  metricLabel: string;
};

export default function HistogramView({ data, isLoading, metricLabel }: HistogramViewProps) {
  return (
    <div className="w-full h-full min-h-[400px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 24, left: 12, bottom: 12 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
          <XAxis type="category" dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis type="number" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: "#fff", borderRadius: "4px", border: "1px solid #e2e8f0", maxWidth: "380px" }}
            content={({ active, payload, label }) => {
              if (!active || !payload || payload.length === 0) {
                return null;
              }
              const bin = payload[0]?.payload as HistogramBin;
              const preview = (bin.countries ?? []).slice(0, 12);
              const remaining = Math.max(0, (bin.countries?.length ?? 0) - preview.length);
              return (
                <div className="rounded border border-slate-200 bg-white p-2 text-xs shadow-sm">
                  <div className="font-semibold text-slate-800">{metricLabel} range: {label}</div>
                  <div className="mt-1 text-slate-700">
                    Countries: <span className="font-semibold">{new Intl.NumberFormat("en-US").format(bin.count)}</span>
                  </div>
                  <div className="mt-1 text-slate-600">
                    {preview.join(", ")}
                    {remaining > 0 ? `, +${remaining} more` : ""}
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="count" fill="#0369a1" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>

      {isLoading && (
        <div className="absolute inset-0 bg-white/80 p-4 pointer-events-none">
          <div className="h-full w-full animate-pulse rounded border border-slate-200 bg-slate-100" />
        </div>
      )}

      {!isLoading && data.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500 pointer-events-none">
          No histogram data available for this selection.
        </div>
      )}
    </div>
  );
}
