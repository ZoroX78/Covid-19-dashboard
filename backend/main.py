from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import uvicorn

app = FastAPI(title="COVID-19 Data Explorer API")

# Enable CORS so Next.js (usually on port 3000) can fetch data
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable to hold our DataFrame in memory
df = pd.DataFrame()

DATASET_PATH = Path(__file__).resolve().parent / "compact.csv"
METRICS = {
    "total_cases": {
        "label": "Total cases",
        "description": "Cumulative confirmed COVID-19 cases",
        "interval": "cumulative",
    },
    "total_deaths": {
        "label": "Total deaths",
        "description": "Cumulative confirmed COVID-19 deaths",
        "interval": "cumulative",
    },
    "hosp_patients": {
        "label": "Hospital patients",
        "description": "Current number of COVID-19 patients in hospital",
        "interval": "daily",
    },
    "icu_patients": {
        "label": "ICU patients",
        "description": "Current number of COVID-19 patients in intensive care",
        "interval": "daily",
    },
    "stringency_index": {
        "label": "Stringency index",
        "description": "Government response stringency index",
        "interval": "daily",
    },
    "total_vaccinations": {
        "label": "Total vaccinations",
        "description": "Total number of vaccine doses administered",
        "interval": "cumulative",
    },
    "total_cases_per_100k": {
        "label": "Total cases per 100k",
        "description": "Cumulative confirmed COVID-19 cases per 100,000 people",
        "interval": "cumulative",
    },
    "total_deaths_per_100k": {
        "label": "Total deaths per 100k",
        "description": "Cumulative confirmed COVID-19 deaths per 100,000 people",
        "interval": "cumulative",
    },
    "remaining_population": {
        "label": "Remaining population (after COVID deaths)",
        "description": "Population minus cumulative COVID-19 deaths",
        "interval": "cumulative",
    },
    "population_reduction_pct": {
        "label": "Population reduction (%)",
        "description": "Cumulative COVID-19 deaths as a percentage of population",
        "interval": "cumulative",
    },
}
INTERVAL_DEFAULT_METRIC = {
    "cumulative": "total_cases",
    "daily": "hosp_patients",
}
SUPPORTED_INTERVALS = set(INTERVAL_DEFAULT_METRIC.keys())
REFERENCE_COLUMNS = [
    "total_cases",
    "total_deaths",
    "hosp_patients",
    "icu_patients",
]
BAR_METRICS = {
    "total_cases": "Total cases",
    "total_deaths": "Total deaths",
    "total_vaccinations": "Total vaccinations",
    "remaining_population": "Remaining population (after COVID deaths)",
    "population_reduction_pct": "Population reduction (%)",
    "extreme_poverty": "Extreme poverty (%)",
}
RAW_BAR_METRIC_COLUMNS = {"total_cases", "total_deaths", "total_vaccinations", "extreme_poverty"}
RAW_METRIC_COLUMNS = {
    "total_cases",
    "total_deaths",
    "hosp_patients",
    "icu_patients",
    "stringency_index",
    "total_vaccinations",
}
DERIVED_METRIC_COLUMNS = {"total_cases_per_100k", "total_deaths_per_100k"}
HISTOGRAM_METRICS = {"median_age": "Median age"}


def resolve_metric(metric: Optional[str], interval: str) -> str:
    if interval not in SUPPORTED_INTERVALS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported interval '{interval}'. Use one of: {sorted(SUPPORTED_INTERVALS)}",
        )
    resolved = metric or INTERVAL_DEFAULT_METRIC[interval]
    if resolved not in METRICS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported metric '{resolved}'. Use one of: {sorted(METRICS.keys())}",
        )
    return resolved


def resolve_bar_metric(metric: Optional[str]) -> str:
    resolved = metric or "total_cases"
    if resolved not in BAR_METRICS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported bar metric '{resolved}'. Use one of: {sorted(BAR_METRICS.keys())}",
        )
    return resolved


@app.on_event("startup")
def load_and_clean_data():
    """Loads and preprocesses the CSV when the server starts."""
    global df
    print("Loading dataset...")

    raw_df = pd.read_csv(DATASET_PATH)

    required_columns = {"country", "code", "date"}
    missing_required = required_columns - set(raw_df.columns)
    if missing_required:
        raise RuntimeError(f"Dataset is missing required columns: {sorted(missing_required)}")

    numeric_columns = RAW_METRIC_COLUMNS | RAW_BAR_METRIC_COLUMNS | {"population", "median_age"}

    missing_metrics = (RAW_METRIC_COLUMNS | {"median_age"}) - set(raw_df.columns)
    if missing_metrics:
        raise RuntimeError(f"Dataset is missing expected metric columns: {sorted(missing_metrics)}")

    missing_bar_metrics = RAW_BAR_METRIC_COLUMNS - set(raw_df.columns)
    if missing_bar_metrics:
        raise RuntimeError(f"Dataset is missing expected bar chart columns: {sorted(missing_bar_metrics)}")

    df = raw_df[raw_df["code"].notna()].copy()
    df["date"] = pd.to_datetime(df["date"], format="%d-%m-%Y", errors="coerce")
    df = df[df["date"].notna()].copy()
    df = df.sort_values(by=["country", "date"])

    for column in numeric_columns:
        df[column] = pd.to_numeric(df[column], errors="coerce")

    valid_population = df["population"].notna() & (df["population"] > 0)
    df["total_cases_per_100k"] = None
    df["total_deaths_per_100k"] = None
    df["remaining_population"] = None
    df["population_reduction_pct"] = None
    df.loc[valid_population, "total_cases_per_100k"] = (
        df.loc[valid_population, "total_cases"] / df.loc[valid_population, "population"]
    ) * 100000
    df.loc[valid_population, "total_deaths_per_100k"] = (
        df.loc[valid_population, "total_deaths"] / df.loc[valid_population, "population"]
    ) * 100000
    df.loc[valid_population, "remaining_population"] = (
        df.loc[valid_population, "population"] - df.loc[valid_population, "total_deaths"]
    )
    df.loc[valid_population, "population_reduction_pct"] = (
        df.loc[valid_population, "total_deaths"] / df.loc[valid_population, "population"]
    ) * 100

    for column in DERIVED_METRIC_COLUMNS:
        df[column] = pd.to_numeric(df[column], errors="coerce")

    df["remaining_population"] = pd.to_numeric(df["remaining_population"], errors="coerce")
    df["population_reduction_pct"] = pd.to_numeric(df["population_reduction_pct"], errors="coerce")

    df["Year"] = df["date"].dt.year.astype(int)

    print(f"Dataset loaded successfully. {len(df)} rows ready.")


@app.get("/api/countries")
def get_countries(metric: Optional[str] = None, interval: str = "cumulative"):
    """Returns countries that have data for the selected metric."""
    selected_metric = resolve_metric(metric, interval)
    countries = (
        df[df[selected_metric].notna()]["country"]
        .dropna()
        .unique()
        .tolist()
    )
    return {"countries": sorted(countries)}


@app.get("/api/metrics")
def get_metrics():
    """Returns available metrics that can be used by map and line chart."""
    return {
        "defaultMetricByInterval": INTERVAL_DEFAULT_METRIC,
        "metrics": [
            {
                "key": key,
                "label": config["label"],
                "description": config["description"],
                "interval": config["interval"],
            }
            for key, config in METRICS.items()
        ],
    }


@app.get("/api/map-data")
def get_map_data(year: Optional[int] = None, metric: Optional[str] = None, interval: str = "cumulative"):
    """Returns the latest data point for each country, optionally filtered by year and metric."""
    selected_metric = resolve_metric(metric, interval)
    source = df if year is None else df[df["Year"] == year]
    source = source[source[selected_metric].notna()].copy()
    latest_data = source.sort_values(by=["country", "date"]).groupby("country").tail(1)

    result = [
        {
            "country": row["country"],
            "code": row["code"],
            "value": float(row[selected_metric]),
        }
        for _, row in latest_data.iterrows()
    ]
    return {"year": year, "metric": selected_metric, "data": result}


@app.get("/api/map-data-timeline")
def get_map_data_timeline(metric: Optional[str] = None, interval: str = "cumulative"):
    """
    Returns yearly map data for all countries.
    For each country and year, the latest available row in that year is used.
    """
    selected_metric = resolve_metric(metric, interval)
    yearly_latest = (
        df.sort_values(by=["country", "date"])
        .groupby(["country", "code", "Year"], as_index=False)
        .tail(1)
    )

    years = sorted(yearly_latest["Year"].unique().tolist())
    pivot = yearly_latest.pivot_table(
        index=["country", "code"],
        columns="Year",
        values=selected_metric,
        aggfunc="last",
    )
    pivot_total_deaths = yearly_latest.pivot_table(
        index=["country", "code"],
        columns="Year",
        values="total_deaths",
        aggfunc="last",
    )
    pivot_remaining_population = yearly_latest.pivot_table(
        index=["country", "code"],
        columns="Year",
        values="remaining_population",
        aggfunc="last",
    )
    pivot_population_reduction_pct = yearly_latest.pivot_table(
        index=["country", "code"],
        columns="Year",
        values="population_reduction_pct",
        aggfunc="last",
    )
    pivot_population = yearly_latest.pivot_table(
        index=["country", "code"],
        columns="Year",
        values="population",
        aggfunc="last",
    )

    timeline_data = []
    unique_country_rows = yearly_latest[["country", "code"]].drop_duplicates()
    for _, unique_row in unique_country_rows.iterrows():
        country = unique_row["country"]
        code = unique_row["code"]
        selected_values_row = pivot.loc[(country, code)] if (country, code) in pivot.index else pd.Series(dtype=float)
        total_deaths_row = (
            pivot_total_deaths.loc[(country, code)]
            if (country, code) in pivot_total_deaths.index
            else pd.Series(dtype=float)
        )
        remaining_population_row = (
            pivot_remaining_population.loc[(country, code)]
            if (country, code) in pivot_remaining_population.index
            else pd.Series(dtype=float)
        )
        population_reduction_pct_row = (
            pivot_population_reduction_pct.loc[(country, code)]
            if (country, code) in pivot_population_reduction_pct.index
            else pd.Series(dtype=float)
        )
        population_row = (
            pivot_population.loc[(country, code)]
            if (country, code) in pivot_population.index
            else pd.Series(dtype=float)
        )

        values = {}
        total_deaths_values = {}
        remaining_population_values = {}
        population_reduction_pct_values = {}
        population_values = {}
        for year in years:
            value = selected_values_row.get(year)
            if pd.notna(value):
                values[str(int(year))] = float(value)
            total_deaths = total_deaths_row.get(year)
            if pd.notna(total_deaths):
                total_deaths_values[str(int(year))] = float(total_deaths)
            remaining_population = remaining_population_row.get(year)
            if pd.notna(remaining_population):
                remaining_population_values[str(int(year))] = float(remaining_population)
            population_reduction_pct = population_reduction_pct_row.get(year)
            if pd.notna(population_reduction_pct):
                population_reduction_pct_values[str(int(year))] = float(population_reduction_pct)
            population = population_row.get(year)
            if pd.notna(population):
                population_values[str(int(year))] = float(population)

        timeline_data.append(
            {
                "country": country,
                "code": code,
                "values": values,
                "totalDeathsValues": total_deaths_values,
                "remainingPopulationValues": remaining_population_values,
                "populationReductionPctValues": population_reduction_pct_values,
                "populationValues": population_values,
            }
        )

    return {"years": [int(year) for year in years], "metric": selected_metric, "data": timeline_data}


@app.get("/api/timeseries/{country_name}")
def get_timeseries(country_name: str, metric: Optional[str] = None, interval: str = "cumulative"):
    """Returns country time-series data with selected and reference metrics."""
    selected_metric = resolve_metric(metric, interval)
    country_data = df[df["country"] == country_name].copy()

    if country_data.empty:
        raise HTTPException(status_code=404, detail="Country not found")

    chart_data = country_data.sort_values(by="date").copy()
    chart_data = chart_data[chart_data[selected_metric].notna()].copy()
    chart_data["date"] = chart_data["date"].dt.strftime("%Y-%m-%d")
    chart_data["value"] = chart_data[selected_metric].astype(float)

    payload_columns = ["date", "value", *REFERENCE_COLUMNS]
    for column in REFERENCE_COLUMNS:
        if column in chart_data.columns:
            chart_data[column] = chart_data[column].apply(
                lambda value: float(value) if pd.notna(value) else None
            )

    result = chart_data[payload_columns].to_dict(orient="records")

    return {
        "country": country_name,
        "metric": selected_metric,
        "metricLabel": METRICS[selected_metric]["label"],
        "data": result,
    }


@app.get("/api/bar-rankings")
def get_bar_rankings(
    metric: Optional[str] = None,
    group_by: str = "country",
    top_n: int = 10,
):
    """
    Returns latest-value rankings for bar charts.
    Important: values are derived from each country's latest available row,
    not by summing daily totals over time.
    """
    selected_metric = resolve_bar_metric(metric)
    normalized_group_by = group_by.lower()
    if normalized_group_by not in {"country", "continent"}:
        raise HTTPException(status_code=400, detail="group_by must be 'country' or 'continent'")

    if top_n < 1 or top_n > 50:
        raise HTTPException(status_code=400, detail="top_n must be between 1 and 50")

    latest_per_country = (
        df[df[selected_metric].notna()]
        .sort_values(by=["country", "date"])
        .groupby("country", as_index=False)
        .tail(1)
    )

    if normalized_group_by == "country":
        ranking = (
            latest_per_country[["country", selected_metric]]
            .rename(columns={"country": "category", selected_metric: "value"})
            .sort_values(by="value", ascending=False)
            .head(top_n)
        )
    else:
        continent_source = latest_per_country[latest_per_country["continent"].notna()].copy()
        if selected_metric == "population_reduction_pct":
            continent_source = continent_source[
                continent_source["population"].notna()
                & (continent_source["population"] > 0)
                & continent_source["total_deaths"].notna()
            ]
            grouped = (
                continent_source.groupby("continent", as_index=False)
                .agg(total_deaths=("total_deaths", "sum"), population=("population", "sum"))
            )
            grouped["value"] = (grouped["total_deaths"] / grouped["population"]) * 100
            ranking = (
                grouped[["continent", "value"]]
                .rename(columns={"continent": "category"})
                .sort_values(by="value", ascending=False)
                .head(top_n)
            )
        elif selected_metric == "extreme_poverty":
            continent_source = continent_source[
                continent_source["population"].notna()
                & (continent_source["population"] > 0)
                & continent_source["extreme_poverty"].notna()
            ].copy()
            continent_source["weighted_extreme_poverty"] = (
                continent_source["extreme_poverty"] * continent_source["population"]
            )
            grouped = (
                continent_source.groupby("continent", as_index=False)
                .agg(
                    weighted_extreme_poverty=("weighted_extreme_poverty", "sum"),
                    population=("population", "sum"),
                )
            )
            grouped["value"] = grouped["weighted_extreme_poverty"] / grouped["population"]
            ranking = (
                grouped[["continent", "value"]]
                .rename(columns={"continent": "category"})
                .sort_values(by="value", ascending=False)
                .head(top_n)
            )
        else:
            ranking = (
                continent_source.groupby("continent", as_index=False)[selected_metric]
                .sum()
                .rename(columns={"continent": "category", selected_metric: "value"})
                .sort_values(by="value", ascending=False)
                .head(top_n)
            )

    result = [
        {"category": str(row["category"]), "value": float(row["value"])}
        for _, row in ranking.iterrows()
    ]

    return {
        "metric": selected_metric,
        "metricLabel": BAR_METRICS[selected_metric],
        "groupBy": normalized_group_by,
        "topN": top_n,
        "data": result,
    }


@app.get("/api/histogram-data")
def get_histogram_data(metric: str = "median_age", bins: int = 12):
    if metric not in HISTOGRAM_METRICS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported histogram metric '{metric}'. Use one of: {sorted(HISTOGRAM_METRICS.keys())}",
        )
    if bins < 5 or bins > 30:
        raise HTTPException(status_code=400, detail="bins must be between 5 and 30")

    latest_per_country = (
        df[df[metric].notna()]
        .sort_values(by=["country", "date"])
        .groupby("country", as_index=False)
        .tail(1)
    )
    if latest_per_country.empty:
        return {
            "metric": metric,
            "metricLabel": HISTOGRAM_METRICS[metric],
            "bins": bins,
            "countryCount": 0,
            "data": [],
        }

    values = latest_per_country[metric].astype(float)
    min_value = float(values.min())
    max_value = float(values.max())
    if min_value == max_value:
        return {
            "metric": metric,
            "metricLabel": HISTOGRAM_METRICS[metric],
            "bins": 1,
            "countryCount": int(len(values)),
            "data": [
                {
                    "label": f"{min_value:.1f}",
                    "start": min_value,
                    "end": max_value,
                    "count": int(len(values)),
                    "countries": sorted(latest_per_country["country"].astype(str).tolist()),
                }
            ],
        }

    step = (max_value - min_value) / bins
    edges = [min_value + (index * step) for index in range(bins + 1)]
    histogram_source = latest_per_country[["country", metric]].copy()
    histogram_source["bin"] = pd.cut(histogram_source[metric].astype(float), bins=edges, include_lowest=True)
    categories = histogram_source["bin"]
    counts = categories.value_counts(sort=False)

    data = []
    for interval, count in counts.items():
        countries_in_bin = (
            histogram_source.loc[histogram_source["bin"] == interval, "country"]
            .astype(str)
            .sort_values()
            .tolist()
        )
        data.append(
            {
                "label": f"{interval.left:.1f}-{interval.right:.1f}",
                "start": float(interval.left),
                "end": float(interval.right),
                "count": int(count),
                "countries": countries_in_bin,
            }
        )

    return {
        "metric": metric,
        "metricLabel": HISTOGRAM_METRICS[metric],
        "bins": bins,
        "countryCount": int(len(values)),
        "data": data,
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
