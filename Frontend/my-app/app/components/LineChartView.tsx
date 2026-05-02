"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";

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

function formatDateLabel(dateText: string): string {
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) {
    return dateText;
  }
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function getColorByCountry(country: string, countries: string[]): string {
  const index = countries.indexOf(country);
  return lineColors[index >= 0 ? index % lineColors.length : 0];
}

function ComparisonTooltip({
  active,
  label,
  payload,
  countries,
  metricLabel,
}: TooltipProps<ValueType, NameType> & { countries: string[]; metricLabel: string; }) {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  const ranked = payload
    .map((item) => ({
      country: String(item.name ?? ""),
      value: typeof item.value === "number" ? item.value : Number(item.value),
    }))
    .filter((item) => Number.isFinite(item.value))
    .sort((left, right) => right.value - left.value);

  return (
    <div className="rounded border border-slate-200 bg-white p-3 text-xs shadow-sm">
      <div className="font-semibold text-slate-800 mb-2">{formatDateLabel(String(label ?? ""))}</div>
      {ranked.map((item, index) => (
        <div key={item.country} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: getColorByCountry(item.country, countries) }}
            />
            <span className="text-slate-700">{item.country}</span>
          </div>
          <span className="text-slate-600">
            #{index + 1} {new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(item.value)}
          </span>
        </div>
      ))}
      <div className="mt-2 text-[11px] text-slate-500">{metricLabel}</div>
    </div>
  );
}

export default function LineChartView({ data, isLoading, metricLabel, countries }: LineChartViewProps) {
  const legendCountries = countries.slice(0, 8);
  return (
    <div className="w-full h-full min-h-[400px] flex flex-col relative">
      {countries.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-3">
          {legendCountries.map((country, index) => (
            <div key={country} className="flex items-center gap-1.5 text-xs text-slate-700">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: lineColors[index % lineColors.length] }} />
              <span className="truncate max-w-[140px]">{country}</span>
            </div>
          ))}
          {countries.length > legendCountries.length && (
            <span className="text-xs text-slate-500">+{countries.length - legendCountries.length} more</span>
          )}
        </div>
      )}
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
            content={(props) => <ComparisonTooltip {...props} countries={countries} metricLabel={metricLabel} />}
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
        <div className="absolute inset-0 bg-white/80 p-4 pointer-events-none">
          <div className="h-full w-full animate-pulse rounded border border-slate-200 bg-slate-100" />
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
