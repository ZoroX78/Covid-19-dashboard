"use client";

import { useEffect, useMemo, useState } from "react";
import { Play, Pause, Download, Share2, Maximize, Map as MapIcon, LineChart, BarChart2, Table as TableIcon } from "lucide-react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import LineChartView, { type LinePoint } from "./LineChartView";
import BarChartView, { type BarPoint } from "./BarChartView";

const geoUrl = "https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson";
const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type TabId = "Table" | "Map" | "Line" | "Bar";

type MapTimelineCountry = {
  country: string;
  code: string;
  values: Record<string, number>;
};

type MapTimelineResponse = {
  years: number[];
  metric: string;
  data: MapTimelineCountry[];
};

type TimeseriesResponse = {
  country: string;
  metric: string;
  metricLabel: string;
  data: LinePoint[];
};

type BarGroupBy = "country" | "continent";

type BarRankingsResponse = {
  metric: string;
  metricLabel: string;
  groupBy: BarGroupBy;
  topN: number;
  data: BarPoint[];
};

type GeoProperties = {
  name?: string;
  NAME?: string;
};

const countryAliases: Record<string, string> = {
  "united states of america": "United States",
  "democratic republic of the congo": "DR Congo",
  "republic of the congo": "Congo",
  "cote d'ivoire": "Ivory Coast",
  "cote d’ivoire": "Ivory Coast",
  "czechia": "Czech Republic",
  "eswatini (swaziland)": "Eswatini",
  "north macedonia": "North Macedonia",
};

function normalizeCountryName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function resolveCountryName(name: string): string {
  const normalized = normalizeCountryName(name);
  return countryAliases[normalized] ?? name;
}

function toNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value);
}

function formatValue(value: number): string {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
}

type MainMapProps = {
  selectedCountry: string;
  selectedMetric: string;
  selectedMetricLabel: string;
  selectedInterval: "cumulative" | "daily";
  onSelectCountry: (country: string) => void;
};

export default function MainMap({
  selectedCountry,
  selectedMetric,
  selectedMetricLabel,
  selectedInterval,
  onSelectCountry,
}: MainMapProps) {
  const [activeTab, setActiveTab] = useState<TabId>("Map");
  const [years, setYears] = useState<number[]>([]);
  const [currentYear, setCurrentYear] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [mapDataByYear, setMapDataByYear] = useState<Record<number, Record<string, number>>>({});
  const [countryCodeToName, setCountryCodeToName] = useState<Record<string, string>>({});
  const [lineData, setLineData] = useState<LinePoint[]>([]);
  const [isLoadingMapData, setIsLoadingMapData] = useState<boolean>(true);
  const [isLoadingLineData, setIsLoadingLineData] = useState<boolean>(false);
  const [isLoadingBarData, setIsLoadingBarData] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [barData, setBarData] = useState<BarPoint[]>([]);
  const [selectedBarMetric, setSelectedBarMetric] = useState<"total_cases" | "total_deaths" | "total_vaccinations">("total_cases");
  const [selectedBarGroupBy, setSelectedBarGroupBy] = useState<BarGroupBy>("country");
  const [selectedBarMetricLabel, setSelectedBarMetricLabel] = useState<string>("Total cases");
  const [hoveredCountry, setHoveredCountry] = useState<{ code: string; name: string; value: number | null } | null>(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        setIsLoadingMapData(true);
        setErrorMessage("");

        const params = new URLSearchParams({
          metric: selectedMetric,
          interval: selectedInterval,
        });
        const timelineRes = await fetch(`${backendBaseUrl}/api/map-data-timeline?${params.toString()}`);

        if (!timelineRes.ok) {
          throw new Error("Failed to fetch backend data.");
        }

        const timelineJson = (await timelineRes.json()) as MapTimelineResponse;

        const sortedYears = [...timelineJson.years].sort((a, b) => a - b);
        const yearlyMap: Record<number, Record<string, number>> = {};
        const codeToCountry: Record<string, string> = {};
        sortedYears.forEach((year) => {
          yearlyMap[year] = {};
        });

        for (const entry of timelineJson.data) {
          const code = (entry.code ?? "").toUpperCase();
          if (!code) {
            continue;
          }
          codeToCountry[code] = entry.country;
          for (const [yearText, value] of Object.entries(entry.values)) {
            const year = Number(yearText);
            if (!Number.isNaN(year) && yearlyMap[year]) {
              yearlyMap[year][code] = toNumber(value);
            }
          }
        }

        setYears(sortedYears);
        if (sortedYears.length > 0) {
          setCurrentYear(sortedYears[0]);
        }
        setMapDataByYear(yearlyMap);
        setCountryCodeToName(codeToCountry);
      } catch {
        setErrorMessage("Unable to load data from backend. Make sure FastAPI is running on port 8000.");
      } finally {
        setIsLoadingMapData(false);
      }
    }

    void loadInitialData();
  }, [selectedInterval, selectedMetric]);

  useEffect(() => {
    if (!selectedCountry) {
      return;
    }

    async function loadCountrySeries() {
      try {
        setIsLoadingLineData(true);
        const params = new URLSearchParams({
          metric: selectedMetric,
          interval: selectedInterval,
        });
        const response = await fetch(`${backendBaseUrl}/api/timeseries/${encodeURIComponent(selectedCountry)}?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch line chart data.");
        }
        const json = (await response.json()) as TimeseriesResponse;
        setLineData(
          json.data.map((point) => ({
            date: point.date,
            value: toNumber(point.value),
          })),
        );
      } catch {
        setLineData([]);
      } finally {
        setIsLoadingLineData(false);
      }
    }

    void loadCountrySeries();
  }, [selectedCountry, selectedInterval, selectedMetric]);

  useEffect(() => {
    if (activeTab !== "Bar") {
      return;
    }

    async function loadBarRankings() {
      try {
        setIsLoadingBarData(true);
        const params = new URLSearchParams({
          metric: selectedBarMetric,
          group_by: selectedBarGroupBy,
          top_n: selectedBarGroupBy === "continent" ? "10" : "15",
        });
        const response = await fetch(`${backendBaseUrl}/api/bar-rankings?${params.toString()}`);
        if (!response.ok) {
          throw new Error("Failed to fetch bar chart data.");
        }
        const json = (await response.json()) as BarRankingsResponse;
        setSelectedBarMetricLabel(json.metricLabel);
        setBarData(
          json.data.map((item) => ({
            category: item.category,
            value: toNumber(item.value),
          })),
        );
      } catch {
        setBarData([]);
      } finally {
        setIsLoadingBarData(false);
      }
    }

    void loadBarRankings();
  }, [activeTab, selectedBarMetric, selectedBarGroupBy]);

  useEffect(() => {
    if (!isPlaying || years.length === 0) {
      return;
    }

    const timer = setInterval(() => {
      setCurrentYear((previousYear) => {
        const currentIndex = years.indexOf(previousYear);
        if (currentIndex < 0) {
          return years[0];
        }
        if (currentIndex >= years.length - 1) {
          setIsPlaying(false);
          return years[currentIndex];
        }
        return years[currentIndex + 1];
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, years]);

  const currentYearMap = mapDataByYear[currentYear] ?? {};
  const selectedCountryCode = useMemo(() => {
    for (const [code, country] of Object.entries(countryCodeToName)) {
      if (country === selectedCountry) {
        return code;
      }
    }
    return "";
  }, [countryCodeToName, selectedCountry]);

  const maxMapValue = useMemo(() => {
    let max = 0;
    for (const yearData of Object.values(mapDataByYear)) {
      for (const value of Object.values(yearData)) {
        if (value > max) {
          max = value;
        }
      }
    }
    return max > 0 ? max : 1;
  }, [mapDataByYear]);

  const mapColorScale = useMemo(
    () =>
      scaleLinear<string>()
        .domain([0, maxMapValue])
        .range(["#FFEDD5", "#991B1B"]),
    [maxMapValue],
  );

  const filteredLineData = useMemo(
    () =>
      lineData.filter((point) => {
        const year = new Date(point.date).getUTCFullYear();
        return Number.isNaN(year) ? true : year <= currentYear;
      }),
    [lineData, currentYear],
  );

  const currentYearIndex = years.indexOf(currentYear);
  const selectedCountryLabel = selectedCountry || "No country selected";
  const headingMetricLabel = activeTab === "Bar" ? selectedBarMetricLabel : selectedMetricLabel;
  const headingSuffix =
    activeTab === "Line"
      ? `${selectedCountryLabel}, up to ${currentYear || "N/A"}`
      : activeTab === "Bar"
        ? "latest available values"
        : `${currentYear || "N/A"}`;

  const handlePlayPause = () => {
    if (years.length === 0) {
      return;
    }
    const lastYear = years[years.length - 1];
    if (!isPlaying && currentYear >= lastYear) {
      setCurrentYear(years[0]);
    }
    setIsPlaying((value) => !value);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto p-6">
      {/* Title Area */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-2xl font-serif text-slate-900 mb-2">
            {headingMetricLabel}, {headingSuffix}
          </h2>
          <p className="text-sm text-slate-600 max-w-4xl leading-relaxed">
            Data is loaded from the compact OWID dataset. The timeline controls both map shading and the line chart range.
          </p>
        </div>
        <div className="bg-slate-900 text-white text-xs font-bold px-2 py-1 flex-shrink-0 text-center leading-tight">
          Our World
          <br />
          in Data
        </div>
      </div>

      {errorMessage && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{errorMessage}</div>}

      {/* View Tabs */}
      <div className="flex flex-wrap items-center gap-4 border-b border-slate-200 mb-6 pb-2">
        <div className="flex w-fit">
          {[
            { id: "Table" as const, icon: TableIcon },
            { id: "Map" as const, icon: MapIcon },
            { id: "Line" as const, icon: LineChart },
            { id: "Bar" as const, icon: BarChart2 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id ? "border-slate-800 text-slate-800" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.id}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Visualization Area */}
      {activeTab === "Map" && (
        <div className="flex-1 min-h-[400px] flex flex-col items-center justify-center relative mb-8">
          <ComposableMap projection="geoMercator" className="w-full h-full max-h-[500px]">
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const properties = geo.properties as GeoProperties;
                  const geoCode = String(geo.id ?? "").toUpperCase();
                  const geoName = properties.name ?? properties.NAME ?? countryCodeToName[geoCode] ?? geoCode;
                  const countryValue = currentYearMap[geoCode];
                  const mapValue = countryValue ?? 0;
                  const fill = mapValue > 0 ? mapColorScale(mapValue) : "#E2E8F0";
                  const isSelected = selectedCountryCode === geoCode;

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={isSelected ? "#D93025" : fill}
                      stroke="#FFFFFF"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: isSelected ? "#D93025" : "#D97706", outline: "none" },
                        pressed: { fill: "#92400E", outline: "none" },
                      }}
                      onMouseEnter={() => {
                        setHoveredCountry({
                          code: geoCode,
                          name: countryCodeToName[geoCode] ?? resolveCountryName(geoName),
                          value: countryValue ?? null,
                        });
                      }}
                      onMouseLeave={() => setHoveredCountry(null)}
                      onClick={() => {
                        const matchedCountry = countryCodeToName[geoCode];
                        if (matchedCountry) {
                          onSelectCountry(matchedCountry);
                        }
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ComposableMap>

          {isLoadingMapData && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500 bg-white/70">
              Loading map data...
            </div>
          )}

          {hoveredCountry && !isLoadingMapData && (
            <div className="absolute top-4 left-4 rounded border border-slate-200 bg-white/95 p-3 text-xs shadow-sm pointer-events-none">
              <div className="font-semibold text-slate-800">{hoveredCountry.name}</div>
              <div className="text-slate-500">{hoveredCountry.code}</div>
              <div className="mt-1 text-slate-700">
                {selectedMetricLabel}:{" "}
                <span className="font-semibold">
                  {hoveredCountry.value === null ? "No data" : formatValue(hoveredCountry.value)}
                </span>
              </div>
            </div>
          )}

          {/* Map Legend */}
          <div className="absolute bottom-0 flex flex-col items-center w-full">
            <div className="flex items-center text-xs text-slate-500 mb-1 w-[600px]">
              <span className="flex-1">No data</span>
              <span className="flex-1 text-center">Low</span>
              <span className="flex-1 text-center">High</span>
            </div>
            <div className="flex w-[600px] h-3">
              <div className="flex-1 bg-slate-200" />
              <div className="flex-[4] bg-gradient-to-r from-[#FFEDD5] to-[#991B1B]" />
            </div>
          </div>
        </div>
      )}

        {activeTab === "Line" && (
          <div className="flex-1 min-h-[400px] mb-8">
            <LineChartView data={filteredLineData} isLoading={isLoadingLineData} metricLabel={selectedMetricLabel} />
          </div>
        )}

      {activeTab === "Bar" && (
        <div className="flex-1 min-h-[400px] mb-8">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Metric</label>
              <select
                value={selectedBarMetric}
                onChange={(event) =>
                  setSelectedBarMetric(event.target.value as "total_cases" | "total_deaths" | "total_vaccinations")
                }
                className="w-56 px-3 py-2 text-sm bg-white border border-slate-300 rounded text-slate-700"
              >
                <option value="total_cases">Total cases</option>
                <option value="total_deaths">Total deaths</option>
                <option value="total_vaccinations">Total vaccinations</option>
              </select>
            </div>
            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Category axis</label>
              <select
                value={selectedBarGroupBy}
                onChange={(event) => setSelectedBarGroupBy(event.target.value as BarGroupBy)}
                className="w-44 px-3 py-2 text-sm bg-white border border-slate-300 rounded text-slate-700"
              >
                <option value="country">Country</option>
                <option value="continent">Continent</option>
              </select>
            </div>
          </div>
          <BarChartView
            data={barData}
            isLoading={isLoadingBarData}
            metricLabel={selectedBarMetricLabel}
            groupBy={selectedBarGroupBy}
          />
        </div>
      )}

      {/* Placeholders for other tabs */}
      {activeTab === "Table" && (
        <div className="flex-1 min-h-[400px] flex items-center justify-center mb-8 border-2 border-dashed border-slate-200 rounded-lg">
          <p className="text-slate-500">{activeTab} View Placeholder</p>
        </div>
      )}

      {/* Footer Timeline & Meta */}
      <div className="mt-auto border-t border-slate-200 pt-4">
        <div className="flex items-center space-x-4 mb-4">
          <button onClick={handlePlayPause} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors">
            {isPlaying ? (
              <Pause className="w-5 h-5 text-blue-700" />
            ) : (
              <Play className="w-5 h-5 text-slate-700" />
            )}
          </button>
          <span className="text-sm font-medium text-slate-600">{years[0] ?? "N/A"}</span>
          <div className="flex-1 relative flex items-center">
            <input
              type="range"
              min={0}
              max={Math.max(0, years.length - 1)}
              step={1}
              value={Math.max(0, currentYearIndex)}
              disabled={years.length === 0}
              onChange={(event) => {
                const nextIndex = Number(event.target.value);
                const nextYear = years[nextIndex];
                if (nextYear !== undefined) {
                  setCurrentYear(nextYear);
                  setIsPlaying(false);
                }
              }}
              className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-500"
            />
          </div>
          <span className="text-sm font-medium text-slate-600">{years[years.length - 1] ?? "N/A"}</span>
        </div>

        <div className="flex justify-between items-end text-xs text-slate-500">
          <div className="max-w-4xl">
            <p className="mb-1">
              <strong>Data source:</strong> Backend FastAPI service (OWID compact COVID dataset)
            </p>
            <p>
              <strong>Note:</strong>{" "}
              {activeTab === "Bar"
                ? "Bar rankings use each country's latest available value, then aggregate by continent when selected."
                : activeTab === "Map"
                  ? "Map shading uses ISO country codes from the backend data; use per-capita metrics (per 100k) for fair country-to-country comparison."
                  : "The selected timeline year controls map shading and trims the line chart to data up to that year."}
            </p>
          </div>
          <div className="flex items-center space-x-3 flex-shrink-0 pb-1">
            <span className="uppercase text-[10px] font-bold tracking-wider">CC BY</span>
            <button className="p-1.5 hover:bg-slate-100 rounded text-slate-600">
              <Download className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-slate-100 rounded text-slate-600">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="p-1.5 hover:bg-slate-100 rounded text-slate-600">
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
