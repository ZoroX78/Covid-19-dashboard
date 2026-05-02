"use client";

import { useMemo, useRef, useState } from "react";
import { Search, ChevronDown, ListFilter } from "lucide-react";

type SidebarProps = {
  countries: string[];
  selectedCountries: string[];
  primaryCountry: string;
  onToggleCountry: (country: string) => void;
  onSetPrimaryCountry: (country: string) => void;
  onClearSelection: () => void;
  onSelectAllFiltered: (countries: string[]) => void;
  onClearFiltered: (countries: string[]) => void;
};

export default function Sidebar({
  countries,
  selectedCountries,
  primaryCountry,
  onToggleCountry,
  onSetPrimaryCountry,
  onClearSelection,
  onSelectAllFiltered,
  onClearFiltered,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const filteredCountries = useMemo(
    () => countries.filter((country) => country.toLowerCase().includes(searchQuery.toLowerCase())),
    [countries, searchQuery],
  );

  return (
    <aside className="w-72 border-r border-slate-200 flex flex-col flex-shrink-0 bg-white h-full">
      <div className="p-4 border-b border-slate-200">
        <h1 className="font-bold text-lg text-slate-900 leading-tight">COVID-19 Data Explorer</h1>
        <p className="text-sm text-slate-500 mb-1">Explore global data on COVID-19.</p>
        <a href="#" className="text-sm text-blue-600 hover:underline">Download this dataset</a>
      </div>

      <div className="p-3 border-b border-slate-200 bg-slate-50">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3 text-slate-400" />
          <input
            type="text"
            placeholder="Type to add a country or region"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <div className="flex justify-between items-center mt-3 text-sm text-slate-600">
          <span>Selected: {selectedCountries.length}</span>
          <button className="flex items-center space-x-1 border border-slate-300 px-2 py-1 rounded bg-white">
            <span>Country or region</span>
            <ChevronDown className="w-3 h-3" />
          </button>
          <ListFilter className="w-4 h-4 cursor-pointer" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onSelectAllFiltered(filteredCountries)}
            className="text-xs px-2 py-1 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          >
            Select all filtered
          </button>
          <button
            type="button"
            onClick={() => onClearFiltered(filteredCountries)}
            className="text-xs px-2 py-1 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
          >
            Clear filtered
          </button>
        </div>
      </div>

      {selectedCountries.length > 0 && (
        <div className="p-3 border-b border-slate-200 bg-white">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Selected countries</p>
          <div className="flex flex-wrap gap-2">
            {selectedCountries.map((country) => {
              const isPrimary = primaryCountry === country;
              return (
                <div
                  key={country}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${
                    isPrimary ? "border-blue-400 bg-blue-50 text-blue-700" : "border-slate-300 bg-slate-50 text-slate-700"
                  }`}
                >
                  <button type="button" onClick={() => onSetPrimaryCountry(country)} className="hover:underline">
                    {country}{isPrimary ? " (primary)" : ""}
                  </button>
                  <button type="button" onClick={() => onToggleCountry(country)} aria-label={`Remove ${country}`} className="font-semibold">
                    x
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2" role="listbox" aria-multiselectable="true" aria-label="Country selection">
        {filteredCountries.map((country, index) => {
          const isSelected = selectedCountries.includes(country);
          return (
            <button
              key={country}
              ref={(element) => {
                optionRefs.current[index] = element;
              }}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              onClick={() => onToggleCountry(country)}
              onKeyDown={(event) => {
                if (event.key === " " || event.key === "Enter") {
                  event.preventDefault();
                  onToggleCountry(country);
                }
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  optionRefs.current[index + 1]?.focus();
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  optionRefs.current[index - 1]?.focus();
                }
              }}
              className={`flex w-full items-center gap-3 p-2 rounded text-left transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isSelected ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-700"
              }`}
            >
              <span className={`w-4 h-4 rounded-sm border ${isSelected ? "bg-blue-600 border-blue-600" : "border-slate-300"}`} />
              <span className="text-sm truncate">{country}</span>
            </button>
          );
        })}
      </div>

      <div className="p-3 border-t border-slate-200 text-center bg-white">
        <button
          type="button"
          onClick={onClearSelection}
          className="text-sm text-blue-600 hover:underline flex items-center justify-center w-full"
        >
          <span className="mr-1">x</span> Clear selection
        </button>
      </div>
    </aside>
  );
}
