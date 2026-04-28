import { Search, Bell, Download } from 'lucide-react';
import Image from 'next/image';

export default function TopHeader() {
  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Search Bar */}
      <div className="flex items-center bg-gray-100 rounded-md px-3 py-2 w-96 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
        <Search className="w-4 h-4 text-gray-400 mr-2" />
        <input 
          type="text" 
          placeholder="Search countries, trends, or metrics (Cmd+K)" 
          className="bg-transparent border-none outline-none text-sm w-full text-gray-700 placeholder:text-gray-400"
        />
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-6">
        <span className="text-sm text-gray-500 hidden lg:block">
          Last updated: 12m ago
        </span>
        
        <div className="flex items-center gap-4 border-l pl-6 border-gray-200">
          <button className="text-gray-500 hover:text-gray-700 transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          <button className="text-gray-500 hover:text-gray-700 transition-colors">
            <Download className="w-5 h-5" />
          </button>
          <button className="w-8 h-8 rounded-full overflow-hidden border border-gray-200">
            {/* Placeholder for User Avatar */}
            <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white text-xs">
              U
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}