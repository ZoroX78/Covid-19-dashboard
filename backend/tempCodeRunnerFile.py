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

@app.on_event("startup")
def load_and_clean_data():
    """Loads and preprocesses the CSV when the server starts."""
    global df
    print("Loading dataset...")
    
    # Load the CSV
    raw_df = pd.read_csv("estimated-cumulative-excess-deaths-per-100000-people-during-covid-19.csv")
    
    # Filter out aggregated regions (keep only actual countries with a Code)
    df = raw_df[raw_df['Code'].notna()].copy()

    # Parse dates and keep rows with valid dates only
    df["Day"] = pd.to_datetime(df["Day"], errors="coerce")
    df = df[df["Day"].notna()].copy()
    
    # Sort chronologically to ensure forward-filling works correctly
    df = df.sort_values(by=['Entity', 'Day'])
    
    # Forward-fill the sparse weekly data to create continuous daily lines
    cols_to_fill = [
        'Central estimate', 
        'Lower bound, 95% uncertainty interval', 
        'Upper bound', 
        'Confirmed COVID-19 deaths (per 100,000)'
    ]
    df[cols_to_fill] = df.groupby('Entity')[cols_to_fill].ffill()
    
    # Replace any remaining NaNs with 0 to prevent JSON serialization errors
    df.fillna(0, inplace=True)

    # Add a year column to support timeline controls on the frontend
    df["Year"] = df["Day"].dt.year.astype(int)
    
    print(f"Dataset loaded successfully. {len(df)} rows ready.")

@app.get("/api/countries")
def get_countries():
    """Returns a list of unique countries for the Sidebar."""
    countries = df['Entity'].unique().tolist()
    return {"countries": sorted(countries)}

@app.get("/api/map-data")
def get_map_data(year: Optional[int] = None):
    """Returns the latest data point for each country, optionally filtered by year."""
    source = df if year is None else df[df["Year"] == year]
    latest_data = source.sort_values(by=["Entity", "Day"]).groupby("Entity").tail(1)

    # Select only what the map needs to stay fast and lightweight
    result = latest_data[['Entity', 'Code', 'Central estimate']].to_dict(orient='records')
    return {"year": year, "data": result}

@app.get("/api/map-data-timeline")
def get_map_data_timeline():
    """
    Returns yearly map data for all countries.
    For each country and year, the latest available row in that year is used.
    """
    yearly_latest = (
        df.sort_values(by=["Entity", "Day"])
        .groupby(["Entity", "Code", "Year"], as_index=False)
        .tail(1)
    )

    years = sorted(yearly_latest["Year"].unique().tolist())
    pivot = yearly_latest.pivot_table(
        index=["Entity", "Code"],
        columns="Year",
        values="Central estimate",
        aggfunc="last",
    )

    timeline_data = []
    for (entity, code), row in pivot.iterrows():
        values = {}
        for year in years:
            value = row.get(year)
            if pd.notna(value):
                values[str(int(year))] = float(value)
        timeline_data.append({"country": entity, "code": code, "values": values})

    return {"years": [int(year) for year in years], "data": timeline_data}

@app.get("/api/timeseries/{country_name}")
def get_timeseries(country_name: str):
    """Returns the time series data formatted specifically for the Recharts frontend."""
    country_data = df[df['Entity'] == country_name]
    
    if country_data.empty:
        raise HTTPException(status_code=404, detail="Country not found")
        
    chart_data = country_data.sort_values(by="Day").copy()
    chart_data["date"] = chart_data["Day"].dt.strftime("%Y-%m-%d")
    chart_data = chart_data.rename(columns={
        'Upper bound': 'upperBound',
        'Central estimate': 'central',
        'Lower bound, 95% uncertainty interval': 'lowerBound',
        'Confirmed COVID-19 deaths (per 100,000)': 'confirmed'
    })
    
    # Select the columns to send
    final_columns = ['date', 'upperBound', 'central', 'lowerBound', 'confirmed']
    result = chart_data[final_columns].to_dict(orient='records')
    
    return {"country": country_name, "data": result}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
