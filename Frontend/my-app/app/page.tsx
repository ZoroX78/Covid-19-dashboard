"use client";

import { useEffect, useMemo, useState } from "react";
import Sidebar from "@/app/components/sidebar";
import Topbar from "@/app/components/TopHeader";
import MainMap from "@/app/components/MainMap";
import { Calendar } from "lucide-react";

const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";
type IntervalType = "cumulative" | "daily";

type CountriesResponse = {
  countries: string[];
};

type MetricOption = {
  key: string;
  label: string;
  description: string;
  interval: IntervalType;
};

type MetricsResponse = {
  defaultMetricByInterval: Record<IntervalType, string>;
  metrics: MetricOption[];
};

type TimeseriesPoint = {
  date: string;
  value: number | null;
  total_cases: number | null;
  total_deaths: number | null;
  hosp_patients: number | null;
  icu_patients: number | null;
};

type TimeseriesResponse = {
  country: string;
  metric: string;
  metricLabel: string;
  data: TimeseriesPoint[];
};

function toOptionalNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMetric(value: number): string {
  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatPct(value: number): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export default function CovidDataExplorer() {
  const [metrics, setMetrics] = useState<MetricOption[]>([]);
  const [selectedInterval, setSelectedInterval] = useState<IntervalType>("cumulative");
  const [selectedMetric, setSelectedMetric] = useState<string>("total_cases");
  const [selectedMetricLabel, setSelectedMetricLabel] = useState<string>("Total cases");
  const [countries, setCountries] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [timeseriesRows, setTimeseriesRows] = useState<TimeseriesPoint[]>([]);

  const metricsByInterval = useMemo(
    () => metrics.filter((metric) => metric.interval === selectedInterval),
    [metrics, selectedInterval],
  );
  const effectiveMetric = useMemo(() => {
    const isValid = metricsByInterval.some((metric) => metric.key === selectedMetric);
    if (isValid) {
      return selectedMetric;
    }
    return metricsByInterval[0]?.key ?? selectedMetric;
  }, [metricsByInterval, selectedMetric]);

  useEffect(() => {
    async function loadMetrics() {
      const response = await fetch(`${backendBaseUrl}/api/metrics`);
      if (!response.ok) {
        return;
      }

      const json = (await response.json()) as MetricsResponse;
      setMetrics(json.metrics);

      const defaultMetric = json.defaultMetricByInterval.cumulative;
      if (defaultMetric) {
        setSelectedMetric(defaultMetric);
      } else if (json.metrics.length > 0) {
        setSelectedMetric(json.metrics[0].key);
      }
    }

    void loadMetrics();
  }, []);

  useEffect(() => {
    async function loadCountries() {
      const response = await fetch(`${backendBaseUrl}/api/countries`);
      if (!response.ok) {
        return;
      }

      const json = (await response.json()) as CountriesResponse;
      setCountries(json.countries);
      if (json.countries.length > 0) {
        setSelectedCountry((previous) => previous || json.countries[0]);
      }
    }

    void loadCountries();
  }, []);

  useEffect(() => {
    if (!selectedCountry) {
      return;
    }

    async function loadCountryTimeseries() {
      const params = new URLSearchParams({
        metric: effectiveMetric,
        interval: selectedInterval,
      });
      const response = await fetch(`${backendBaseUrl}/api/timeseries/${encodeURIComponent(selectedCountry)}?${params.toString()}`);
      if (!response.ok) {
        setTimeseriesRows([]);
        return;
      }

      const json = (await response.json()) as TimeseriesResponse;
      setSelectedMetricLabel(json.metricLabel);
      setTimeseriesRows(json.data);
    }

    void loadCountryTimeseries();
  }, [selectedCountry, selectedInterval, effectiveMetric]);

  const kpiData = useMemo(() => {
    const latest = timeseriesRows.at(-1);
    const previous = timeseriesRows.length > 1 ? timeseriesRows.at(-2) : undefined;

    if (!latest) {
      return [
        { id: 1, title: "LATEST SELECTED METRIC", value: "-", change: "-", context: "latest data point" },
        { id: 2, title: "TOTAL CASES", value: "-", change: "-", context: "cumulative" },
        { id: 3, title: "TOTAL DEATHS", value: "-", change: "-", context: "cumulative" },
        { id: 4, title: "HOSPITAL PATIENTS", value: "-", change: "-", context: "latest value" },
        { id: 5, title: "ICU PATIENTS", value: "-", change: "-", context: "latest value" },
        { id: 6, title: "DATA POINTS", value: "0", change: "-", context: "timeseries rows" },
      ];
    }

    const latestValue = toOptionalNumber(latest.value) ?? 0;
    const previousValue = previous ? toOptionalNumber(previous.value) : null;
    const selectedMetricDeltaPct =
      previousValue !== null && previousValue !== 0
        ? ((latestValue - previousValue) / Math.abs(previousValue)) * 100
        : 0;

    return [
      {
        id: 1,
        title: "LATEST SELECTED METRIC",
        value: formatMetric(latestValue),
        change: formatPct(selectedMetricDeltaPct),
        context: "vs previous row",
      },
      {
        id: 2,
        title: "TOTAL CASES",
        value: formatMetric(toOptionalNumber(latest.total_cases) ?? 0),
        change: "-",
        context: "cumulative",
      },
      {
        id: 3,
        title: "TOTAL DEATHS",
        value: formatMetric(toOptionalNumber(latest.total_deaths) ?? 0),
        change: "-",
        context: "cumulative",
      },
      {
        id: 4,
        title: "HOSPITAL PATIENTS",
        value: formatMetric(toOptionalNumber(latest.hosp_patients) ?? 0),
        change: "-",
        context: "latest value",
      },
      {
        id: 5,
        title: "ICU PATIENTS",
        value: formatMetric(toOptionalNumber(latest.icu_patients) ?? 0),
        change: "-",
        context: "latest value",
      },
      {
        id: 6,
        title: "DATA POINTS",  
        value: timeseriesRows.length.toString(),
        change: "-",
        context: "timeseries rows",
      },
    ];
  }, [timeseriesRows]);

  return (
    <div className="flex h-screen bg-white text-slate-800 font-sans overflow-hidden">
      <Sidebar countries={countries} selectedCountry={selectedCountry} onSelectCountry={setSelectedCountry} />
      <main className="flex-1 flex flex-col min-w-0 h-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Global Overview</h2>
            <p className="text-gray-500 mt-1">High-level telemetry from the compact OWID COVID dataset.</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
            <Calendar className="w-4 h-4 text-gray-500" />
            Last 7 Days
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {kpiData.map((kpi) => (
            <div key={kpi.id} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
              <h3 className="text-xs font-semibold text-gray-500 tracking-wider mb-2">{kpi.title}</h3>
              <div className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{kpi.value}</div>
              <div className="flex items-center text-xs font-medium">
                <span className="text-slate-600">{kpi.change}</span>
                <span className="text-gray-400 ml-1.5">{kpi.context}</span>
              </div>
            </div>
          ))}
        </div>
        <Topbar
          metrics={metrics}
          selectedMetric={effectiveMetric}
          selectedInterval={selectedInterval}
          onMetricChange={setSelectedMetric}
          onIntervalChange={setSelectedInterval}
        />
        <MainMap
          selectedCountry={selectedCountry}
          selectedMetric={effectiveMetric}
          selectedMetricLabel={selectedMetricLabel}
          selectedInterval={selectedInterval}
          onSelectCountry={setSelectedCountry}
        />
      </main>
    </div>
  );
}
