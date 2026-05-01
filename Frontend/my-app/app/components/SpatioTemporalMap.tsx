"use client";

import React, { useState, useEffect, useMemo } from "react";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";
import { scaleLinear } from "d3-scale";
import { Play, Pause, Plus, Minus, RotateCcw, Search } from "lucide-react";

// Standard TopoJSON map of the world
const geoUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// --- MOCK DATA ---
// Replace this with your actual API data. 
// Values represent infection intensity (0 to 100).
const mockTimeSeriesData: Record<number, Record<string, number>> = {
  2019: { "840": 0, "356": 0, "076": 0, "156": 5, "826": 0, "380": 0 }, // 840=USA, 356=IND, 076=BRA, 156=CHN, 826=GBR, 380=ITA
  2020: { "840": 40, "356": 20, "076": 30, "156": 80, "826": 50, "380": 60 },
  2021: { "840": 80, "356": 70, "076": 60, "156": 20, "826": 70, "380": 40 },
  2022: { "840": 100, "356": 90, "076": 85, "156": 40, "826": 80, "380": 50 },
  2023: { "840": 60, "356": 50, "076": 40, "156": 60, "826": 30, "380": 20 },
  2024: { "840": 30, "356": 20, "076": 20, "156": 30, "826": 15, "380": 10 },
};

// List of countries for the dropdown (mapped to numeric ISO-3166-1 IDs used by the TopoJSON above)
const countryOptions = [
  { id: "004", name: "Afghanistan" },
  { id: "008", name: "Albania" },
  { id: "012", name: "Algeria" },
  { id: "016", name: "American Samoa" },
  { id: "020", name: "Andorra" },
  { id: "024", name: "Angola" },
  { id: "028", name: "Antigua and Barbuda" },
  { id: "032", name: "Argentina" },
  { id: "051", name: "Armenia" },
  { id: "036", name: "Australia" },
  { id: "040", name: "Austria" },
  { id: "031", name: "Azerbaijan" },
  { id: "044", name: "Bahamas" },
  { id: "048", name: "Bahrain" },
  { id: "050", name: "Bangladesh" },
  { id: "052", name: "Barbados" },
  { id: "112", name: "Belarus" },
  { id: "056", name: "Belgium" },
  { id: "084", name: "Belize" },
  { id: "204", name: "Benin" },
  { id: "064", name: "Bhutan" },
  { id: "068", name: "Bolivia" },
  { id: "070", name: "Bosnia and Herz." },
  { id: "072", name: "Botswana" },
  { id: "076", name: "Brazil" },
  { id: "096", name: "Brunei" },
  { id: "100", name: "Bulgaria" },
  { id: "854", name: "Burkina Faso" },
  { id: "108", name: "Burundi" },
  { id: "116", name: "Cambodia" },
  { id: "120", name: "Cameroon" },
  { id: "124", name: "Canada" },
  { id: "132", name: "Cape Verde" },
  { id: "140", name: "Central African Rep." },
  { id: "148", name: "Chad" },
  { id: "152", name: "Chile" },
  { id: "156", name: "China" },
  { id: "170", name: "Colombia" },
  { id: "174", name: "Comoros" },
  { id: "178", name: "Congo" },
  { id: "180", name: "DR Congo" },
  { id: "188", name: "Costa Rica" },
  { id: "191", name: "Croatia" },
  { id: "192", name: "Cuba" },
  { id: "196", name: "Cyprus" },
  { id: "203", name: "Czech Republic" },
  { id: "208", name: "Denmark" },
  { id: "262", name: "Djibouti" },
  { id: "212", name: "Dominica" },
  { id: "214", name: "Dominican Republic" },
  { id: "218", name: "Ecuador" },
  { id: "818", name: "Egypt" },
  { id: "222", name: "El Salvador" },
  { id: "226", name: "Equatorial Guinea" },
  { id: "232", name: "Eritrea" },
  { id: "233", name: "Estonia" },
  { id: "748", name: "Eswatini" },
  { id: "231", name: "Ethiopia" },
  { id: "242", name: "Fiji" },
  { id: "246", name: "Finland" },
  { id: "250", name: "France" },
  { id: "266", name: "Gabon" },
  { id: "270", name: "Gambia" },
  { id: "268", name: "Georgia" },
  { id: "276", name: "Germany" },
  { id: "288", name: "Ghana" },
  { id: "300", name: "Greece" },
  { id: "308", name: "Grenada" },
  { id: "320", name: "Guatemala" },
  { id: "324", name: "Guinea" },
  { id: "624", name: "Guinea-Bissau" },
  { id: "328", name: "Guyana" },
  { id: "332", name: "Haiti" },
  { id: "340", name: "Honduras" },
  { id: "348", name: "Hungary" },
  { id: "352", name: "Iceland" },
  { id: "356", name: "India" },
  { id: "360", name: "Indonesia" },
  { id: "364", name: "Iran" },
  { id: "368", name: "Iraq" },
  { id: "372", name: "Ireland" },
  { id: "376", name: "Israel" },
  { id: "380", name: "Italy" },
  { id: "384", name: "Ivory Coast" },
  { id: "388", name: "Jamaica" },
  { id: "392", name: "Japan" },
  { id: "400", name: "Jordan" },
  { id: "398", name: "Kazakhstan" },
  { id: "404", name: "Kenya" },
  { id: "296", name: "Kiribati" },
  { id: "410", name: "South Korea" },
  { id: "408", name: "North Korea" },
  { id: "414", name: "Kuwait" },
  { id: "417", name: "Kyrgyzstan" },
  { id: "418", name: "Laos" },
  { id: "428", name: "Latvia" },
  { id: "422", name: "Lebanon" },
  { id: "426", name: "Lesotho" },
  { id: "430", name: "Liberia" },
  { id: "434", name: "Libya" },
  { id: "440", name: "Lithuania" },
  { id: "442", name: "Luxembourg" },
  { id: "450", name: "Madagascar" },
  { id: "454", name: "Malawi" },
  { id: "458", name: "Malaysia" },
  { id: "462", name: "Maldives" },
  { id: "466", name: "Mali" },
  { id: "470", name: "Malta" },
  { id: "584", name: "Marshall Islands" },
  { id: "478", name: "Mauritania" },
  { id: "480", name: "Mauritius" },
  { id: "484", name: "Mexico" },
  { id: "498", name: "Moldova" },
  { id: "492", name: "Monaco" },
  { id: "496", name: "Mongolia" },
  { id: "499", name: "Montenegro" },
  { id: "504", name: "Morocco" },
  { id: "508", name: "Mozambique" },
  { id: "104", name: "Myanmar" },
  { id: "516", name: "Namibia" },
  { id: "520", name: "Nauru" },
  { id: "524", name: "Nepal" },
  { id: "528", name: "Netherlands" },
  { id: "554", name: "New Zealand" },
  { id: "558", name: "Nicaragua" },
  { id: "562", name: "Niger" },
  { id: "566", name: "Nigeria" },
  { id: "807", name: "North Macedonia" },
  { id: "578", name: "Norway" },
  { id: "512", name: "Oman" },
  { id: "586", name: "Pakistan" },
  { id: "585", name: "Palau" },
  { id: "275", name: "Palestine" },
  { id: "591", name: "Panama" },
  { id: "598", name: "Papua New Guinea" },
  { id: "600", name: "Paraguay" },
  { id: "604", name: "Peru" },
  { id: "608", name: "Philippines" },
  { id: "616", name: "Poland" },
  { id: "620", name: "Portugal" },
  { id: "634", name: "Qatar" },
  { id: "642", name: "Romania" },
  { id: "643", name: "Russia" },
  { id: "646", name: "Rwanda" },
  { id: "659", name: "Saint Kitts and Nevis" },
  { id: "662", name: "Saint Lucia" },
  { id: "670", name: "Saint Vincent" },
  { id: "882", name: "Samoa" },
  { id: "674", name: "San Marino" },
  { id: "678", name: "Sao Tome and Principe" },
  { id: "682", name: "Saudi Arabia" },
  { id: "686", name: "Senegal" },
  { id: "688", name: "Serbia" },
  { id: "690", name: "Seychelles" },
  { id: "694", name: "Sierra Leone" },
  { id: "702", name: "Singapore" },
  { id: "703", name: "Slovakia" },
  { id: "705", name: "Slovenia" },
  { id: "090", name: "Solomon Islands" },
  { id: "706", name: "Somalia" },
  { id: "710", name: "South Africa" },
  { id: "728", name: "South Sudan" },
  { id: "724", name: "Spain" },
  { id: "144", name: "Sri Lanka" },
  { id: "729", name: "Sudan" },
  { id: "740", name: "Suriname" },
  { id: "752", name: "Sweden" },
  { id: "756", name: "Switzerland" },
  { id: "760", name: "Syria" },
  { id: "158", name: "Taiwan" },
  { id: "762", name: "Tajikistan" },
  { id: "834", name: "Tanzania" },
  { id: "764", name: "Thailand" },
  { id: "626", name: "Timor-Leste" },
  { id: "768", name: "Togo" },
  { id: "776", name: "Tonga" },
  { id: "780", name: "Trinidad and Tobago" },
  { id: "788", name: "Tunisia" },
  { id: "792", name: "Turkey" },
  { id: "795", name: "Turkmenistan" },
  { id: "798", name: "Tuvalu" },
  { id: "800", name: "Uganda" },
  { id: "804", name: "Ukraine" },
  { id: "784", name: "United Arab Emirates" },
  { id: "826", name: "United Kingdom" },
  { id: "840", name: "United States" },
  { id: "858", name: "Uruguay" },
  { id: "860", name: "Uzbekistan" },
  { id: "548", name: "Vanuatu" },
  { id: "862", name: "Venezuela" },
  { id: "704", name: "Vietnam" },
  { id: "887", name: "Yemen" },
  { id: "894", name: "Zambia" },
  { id: "716", name: "Zimbabwe" },
];

export default function SpatioTemporalMap() {
  const [currentYear, setCurrentYear] = useState<number>(2019);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [position, setPosition] = useState({ coordinates: [0, 20] as [number, number], zoom: 1 });

  // Filter country options based on search term
  const filteredCountries = useMemo(() => {
    return countryOptions.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [searchTerm]);

  // Create a color scale from light orange to dark red
  const colorScale = useMemo(() => {
    return scaleLinear<string>()
      .domain([0, 100]) // Data min/max
      .range(["#FFEDD5", "#991B1B"]); // Tailwind orange-50 to red-800
  }, []);

  // Animation Loop Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentYear((prev) => {
          if (prev >= 2024) {
            setIsPlaying(false);
            return 2024;
          }
          return prev + 1;
        });
      }, 1000); // 1 second per year
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handlePlayPause = () => {
    if (currentYear >= 2024 && !isPlaying) setCurrentYear(2019); // Reset if at the end
    setIsPlaying(!isPlaying);
  };

  // Zoom Controls
  const handleZoomIn = () => {
    if (position.zoom >= 8) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition(pos => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  const handleReset = () => {
    setPosition({ coordinates: [0, 20], zoom: 1 });
  };

  const handleMoveEnd = (newPosition: { coordinates: [number, number]; zoom: number }) => {
    setPosition(newPosition);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col relative">
      
      {/* Top Overlay Controls */}
      <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
        <div className="bg-white/90 backdrop-blur p-3 rounded-lg border border-gray-200 shadow-sm pointer-events-auto">
          <h3 className="text-sm font-bold text-gray-900">Global Spread Index</h3>
          <p className="text-xs text-gray-500 mb-2">Year: {currentYear}</p>
          
          {/* Heatmap Legend */}
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[10px] text-gray-500 mr-1">Low</span>
            <div className="w-16 h-2 rounded bg-gradient-to-r from-[#FFEDD5] to-[#991B1B]"></div>
            <span className="text-[10px] text-gray-500 ml-1">High</span>
          </div>
        </div>

        {/* Target Country Selector */}
        <div className="pointer-events-auto flex flex-col gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Search country..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-gray-200 text-sm rounded-md pl-9 pr-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700 w-48"
            />
          </div>
          <div className="flex flex-col">
            <select 
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-white border border-gray-200 text-sm rounded-md px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700"
            >
              <option value="">{searchTerm ? `Results (${filteredCountries.length})` : "Global View (No Focus)"}</option>
              {filteredCountries.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* The Map Area */}
      <div className="bg-[#F1F5F9] w-full h-[500px] relative">
        {/* Manual Zoom Controls */}
        <div className="absolute right-4 bottom-4 z-10 flex flex-col gap-2">
          <button 
            onClick={handleZoomIn}
            className="p-2 bg-white rounded-md border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-600 transition-colors"
            title="Zoom In"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button 
            onClick={handleZoomOut}
            className="p-2 bg-white rounded-md border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-600 transition-colors"
            title="Zoom Out"
          >
            <Minus className="w-5 h-5" />
          </button>
          <button 
            onClick={handleReset}
            className="p-2 bg-white rounded-md border border-gray-200 shadow-sm hover:bg-gray-50 text-gray-600 transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        <ComposableMap projection="geoMercator" projectionConfig={{ scale: 140 }}>
          <ZoomableGroup 
            center={position.coordinates} 
            zoom={position.zoom} 
            onMoveEnd={handleMoveEnd}
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const geoId = geo.id; // Numeric ID from the topology
                  const isSelected = selectedCountry === geoId;
                  
                  // Get data for this specific country in the current year
                  const countryValue = mockTimeSeriesData[currentYear]?.[geoId] || 0;
                  
                  // Determine fill color
                  const fillColor = countryValue > 0 ? colorScale(countryValue) : "#E2E8F0";

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={isSelected ? "#D93025" : fillColor} // Target override
                      stroke="#CBD5E1"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none", transition: "all 300ms ease-in-out" },
                        hover: { 
                          fill: isSelected ? "#D93025" : "#F87171", 
                          outline: "none", 
                          cursor: "pointer" 
                        },
                        pressed: { outline: "none" },
                      }}
                      // Optional: Click map to select
                      onClick={() => setSelectedCountry(geoId)}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      {/* Bottom Timeline Controller */}
      <div className="border-t border-gray-200 bg-white p-4 flex items-center gap-6">
        {/* Playback Buttons */}
        <div className="flex items-center gap-2">
          <button 
            onClick={handlePlayPause}
            className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-1" />}
          </button>
        </div>

        {/* Timeline Slider */}
        <div className="flex-1 relative flex items-center">
          <span className="text-sm font-medium text-gray-500 mr-4">2019</span>
          <input 
            type="range" 
            min="2019" 
            max="2024" 
            step="1"
            value={currentYear}
            onChange={(e) => {
              setCurrentYear(parseInt(e.target.value));
              setIsPlaying(false); // Pause if manually scrubbing
            }}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <span className="text-sm font-medium text-gray-500 ml-4">2024</span>
        </div>
      </div>

    </div>
  );
}