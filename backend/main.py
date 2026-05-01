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
}
RAW_METRIC_COLUMNS = {
    "total_cases",
    "total_deaths",
    "hosp_patients",
    "icu_patients",
    "stringency_index",
    "total_vaccinations",
}
DERIVED_METRIC_COLUMNS = {"total_cases_per_100k", "total_deaths_per_100k"}


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

    bar_metric_columns = set(BAR_METRICS.keys())
    numeric_columns = RAW_METRIC_COLUMNS | bar_metric_columns | {"population"}

    missing_metrics = RAW_METRIC_COLUMNS - set(raw_df.columns)
    if missing_metrics:
        raise RuntimeError(f"Dataset is missing expected metric columns: {sorted(missing_metrics)}")

    missing_bar_metrics = bar_metric_columns - set(raw_df.columns)
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
    df.loc[valid_population, "total_cases_per_100k"] = (
        df.loc[valid_population, "total_cases"] / df.loc[valid_population, "population"]
    ) * 100000
    df.loc[valid_population, "total_deaths_per_100k"] = (
        df.loc[valid_population, "total_deaths"] / df.loc[valid_population, "population"]
    ) * 100000

    for column in DERIVED_METRIC_COLUMNS:
        df[column] = pd.to_numeric(df[column], errors="coerce")

    df["Year"] = df["date"].dt.year.astype(int)

    print(f"Dataset loaded successfully. {len(df)} rows ready.")


@app.get("/api/countries")
def get_countries():
    """Returns a list of unique countries for the Sidebar."""
    countries = df["country"].dropna().unique().tolist()
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
        df[df[selected_metric].notna()]
        .sort_values(by=["country", "date"])
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

    timeline_data = []
    for (country, code), row in pivot.iterrows():
        values = {}
        for year in years:
            value = row.get(year)
            if pd.notna(value):
                values[str(int(year))] = float(value)
        timeline_data.append({"country": country, "code": code, "values": values})

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
        ranking = (
            latest_per_country[latest_per_country["continent"].notna()]
            .groupby("continent", as_index=False)[selected_metric]
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


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
