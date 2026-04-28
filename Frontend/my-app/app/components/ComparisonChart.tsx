"use client";

import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';

// Mock data supporting 3 countries to match the curve shape in the design
const comparisonData = [
  { month: 'Jan', us: 20, brazil: 10, india: 5 },
  { month: 'Feb', us: 60, brazil: 30, india: 15 },
  { month: 'Mar', us: 82, brazil: 25, india: 40 },
  { month: 'Apr', us: 86, brazil: 50, india: 65 },
  { month: 'May', us: 70, brazil: 62, india: 85 },
  { month: 'Jun', us: 50, brazil: 40, india: 60 },
  { month: 'Jul', us: 55, brazil: 18, india: 45 },
  { month: 'Aug', us: 40, brazil: 15, india: 30 },
  { month: 'Sep', us: 45, brazil: 25, india: 20 },
  { month: 'Oct', us: 55, brazil: 30, india: 15 },
];

export default function ComparisonChart() {
  const [timeRange, setTimeRange] = useState('Monthly');

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm w-full">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-start justify-between mb-8 gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Daily New Cases Comparison</h2>
          <p className="text-sm text-gray-500 mt-1">7-day rolling average per 100k population</p>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200 text-sm">
          {['Daily', 'Weekly', 'Monthly', 'Yearly'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-1.5 rounded-md font-medium transition-all ${
                timeRange === range 
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-200' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="h-[400px] w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={comparisonData} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
            {/* Minimalist Grid */}
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            
            {/* Axes */}
            <XAxis 
              dataKey="month" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9CA3AF', fontSize: 12 }} 
              dy={15} 
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#9CA3AF', fontSize: 12 }} 
              ticks={[0, 25, 50, 75, 100]} // Hardcoded intervals to match design
              domain={[0, 100]}
            />
            
            {/* Tooltip & Legend */}
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ fontWeight: 600 }}
            />
            <Legend 
              iconType="plainline" 
              wrapperStyle={{ paddingTop: '20px' }}
            />

            {/* Country Lines (Up to 3) */}
            <Line 
              name="United States"
              type="monotone" 
              dataKey="us" 
              stroke="#2563EB" // Solid Blue
              strokeWidth={6} 
              dot={false} 
              activeDot={{ r: 8 }} 
            />
            <Line 
              name="Brazil"
              type="monotone" 
              dataKey="brazil" 
              stroke="#93C5FD" // Light Blue
              strokeWidth={6} 
              dot={false} 
              activeDot={{ r: 8 }} 
            />
            <Line 
              name="India"
              type="monotone" 
              dataKey="india" 
              stroke="#10B981" // Emerald Green for clear contrast
              strokeWidth={6} 
              dot={false} 
              activeDot={{ r: 8 }} 
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}