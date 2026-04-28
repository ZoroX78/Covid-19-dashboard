"use client";

import React from 'react';
// Make sure this import path matches where you saved the map component!
import SpatioTemporalMap from '@/app/components/SpatioTemporalMap'; 
import ComparisonChart from '@/app/components/ComparisonChart';
import { Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- MOCK DATA ---
const kpiData = [
  { id: 1, title: "TOTAL CASES", value: "672.3M", change: "+1.2%", isPositiveTrend: false, context: "vs last wk", type: "bad_up" },
  { id: 2, title: "ACTIVE CASES", value: "21.5M", change: "+0.4%", isPositiveTrend: false, context: "vs last wk", type: "bad_up" },
  { id: 3, title: "DAILY SURGE", value: "45,210", change: "-5.1%", isPositiveTrend: true, context: "vs yesterday", type: "good_down" },
  { id: 4, title: "TOTAL RECOVERED", value: "643.8M", change: "+2.1%", isPositiveTrend: true, context: "vs last wk", type: "good_up" },
  { id: 5, title: "TOTAL DEATHS", value: "6.88M", change: "0.0%", isPositiveTrend: null, context: "vs last wk", type: "neutral" },
  { id: 6, title: "TOTAL VACCINATED", value: "5.5B", change: "+0.8%", isPositiveTrend: true, context: "vs last wk", type: "good_up" },
];

const mockChartData = [
  { name: 'Jan', cases: 4000, trend: 2400 },
  { name: 'Feb', cases: 3000, trend: 1398 },
  { name: 'Mar', cases: 2000, trend: 9800 },
  { name: 'Apr', cases: 2780, trend: 3908 },
  { name: 'May', cases: 1890, trend: 4800 },
  { name: 'Jun', cases: 2390, trend: 3800 },
  { name: 'Jul', cases: 3490, trend: 4300 },
];

export default function GlobalOverview() {
  return (
    <div className="max-w-[1600px] mx-auto flex flex-col gap-6">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Global Overview</h2>
          <p className="text-gray-500 mt-1">High-level telemetry of global infection vectors and recovery rates.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
          <Calendar className="w-4 h-4 text-gray-500" />
          Last 7 Days
        </button>
      </div>

      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpiData.map((kpi) => (
          <div key={kpi.id} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
            <h3 className="text-xs font-semibold text-gray-500 tracking-wider mb-2">{kpi.title}</h3>
            <div className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">{kpi.value}</div>
            
            <div className="flex items-center text-xs font-medium">
              {/* Conditional Trend Coloring */}
              <span className={`flex items-center gap-1 ${
                kpi.type === 'bad_up' ? 'text-red-600' :
                kpi.type === 'good_down' || kpi.type === 'good_up' ? 'text-green-600' :
                'text-gray-400'
              }`}>
                {kpi.type.includes('up') && <TrendingUp className="w-3 h-3" />}
                {kpi.type.includes('down') && <TrendingDown className="w-3 h-3" />}
                {kpi.type === 'neutral' && <Minus className="w-3 h-3" />}
                {kpi.change}
              </span>
              <span className="text-gray-400 ml-1.5">{kpi.context}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Map Section - Now using the actual component */}
      <div className="w-full">
        <SpatioTemporalMap />
      </div>

      {/* Trend Analysis Chart Section */}
      
        
        
        {/* Recharts Implementation */}
        <div className="h-[300px] w-full">
          <ComparisonChart/>
        </div>
      </div>

  );
}