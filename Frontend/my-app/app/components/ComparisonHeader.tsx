"use client";

import React from 'react';
import { ArrowLeftRight, X, Plus } from 'lucide-react';

export default function ComparisonHeader({ selectedCountries, onRemove, onAdd }) {
  return (
    <div className="flex flex-col gap-4 mb-8">
      <div className="flex flex-wrap items-center gap-3">
        {selectedCountries.map((country, index) => (
          <React.Fragment key={country.id}>
            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 shadow-sm">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: country.color }} 
              />
              <span className="text-sm font-semibold text-gray-700">{country.name}</span>
              <button 
                onClick={() => onRemove(country.id)}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {index < selectedCountries.length - 1 && (
              <ArrowLeftRight className="w-4 h-4 text-gray-300 mx-1" />
            )}
          </React.Fragment>
        ))}

        {selectedCountries.length < 3 && (
          <button 
            onClick={onAdd}
            className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-full text-sm text-gray-500 hover:border-blue-400 hover:text-blue-500 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Country
          </button>
        )}
      </div>
    </div>
  );
}