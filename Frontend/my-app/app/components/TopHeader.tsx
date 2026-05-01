type IntervalType = "cumulative" | "daily";

type MetricOption = {
  key: string;
  label: string;
  interval: IntervalType;
};

type TopbarProps = {
  metrics: MetricOption[];
  selectedMetric: string;
  selectedInterval: IntervalType;
  onMetricChange: (metric: string) => void;
  onIntervalChange: (interval: IntervalType) => void;
};

export default function Topbar({
  metrics,
  selectedMetric,
  selectedInterval,
  onMetricChange,
  onIntervalChange,
}: TopbarProps) {
  const filteredMetrics = metrics.filter((metric) => metric.interval === selectedInterval);

  return (
    <header className="flex flex-wrap items-center gap-6 p-4 border-b border-slate-200 bg-slate-50/50">
      <div className="flex flex-col">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Metric</label>
        <select
          value={selectedMetric}
          onChange={(event) => onMetricChange(event.target.value)}
          className="w-64 px-3 py-2 text-sm bg-white border border-slate-300 rounded text-slate-700"
        >
          {filteredMetrics.map((metric) => (
            <option key={metric.key} value={metric.key}>
              {metric.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Interval</label>
        <select
          value={selectedInterval}
          onChange={(event) => onIntervalChange(event.target.value as IntervalType)}
          className="w-48 px-3 py-2 text-sm bg-white border border-slate-300 rounded text-slate-700"
        >
          <option value="cumulative">Cumulative</option>
          <option value="daily">Daily</option>
        </select>
      </div>
      <div className="flex items-center mt-5 ml-auto">
        <span className="text-sm text-slate-700">Loaded from compact OWID COVID dataset</span>
      </div>
    </header>
  );
}
