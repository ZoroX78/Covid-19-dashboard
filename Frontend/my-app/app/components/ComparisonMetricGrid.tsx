"use client";

import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

const metrics = [
  { label: "TOTAL CASES", key: "total" },
  { label: "ACTIVE CASES", key: "active" },
  { label: "POSITIVITY RATE", key: "positivity" },
  { label: "VACCINATION %", key: "vax" },
];

// Mock data mapping
const countryStats = {
  "840": { total: "103.4M", active: "1.2M", positivity: "8.4%", vax: "68.2%", trend: "up" },
  "076": { total: "37.5M", active: "450K", positivity: "12.1%", vax: "82.4%", trend: "down" },
  "356": { total: "44.9M", active: "12K", positivity: "1.2%", vax: "90.1%", trend: "up" },
};

export default function ComparisonMetricGrid({ selectedCountries }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {metrics.map((metric) => (
        <div key={metric.label} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <h4 className="text-[10px] font-bold text-gray-400 tracking-widest mb-4 uppercase">
            {metric.label}
          </h4>
          
          <div className={`grid grid-cols-${selectedCountries.length} gap-4`}>
            {selectedCountries.map((country) => {
              const stats = countryStats[country.id];
              return (
                <div key={country.id} className="flex flex-col">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xl font-bold text-gray-900">{stats[metric.key]}</span>
                    {metric.key === "active" && (
                      stats.trend === "up" ? 
                      <TrendingUp className="w-3 h-3 text-red-500" /> : 
                      <TrendingDown className="w-3 h-3 text-green-500" />
                    )}
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 truncate">
                    {country.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}