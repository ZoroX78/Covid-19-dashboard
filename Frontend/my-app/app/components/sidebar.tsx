import Link from 'next/link';
import { 
  Globe, 
  BarChart2, 
  ArrowLeftRight, 
  TrendingUp, 
  Info, 
  Settings, 
  UserCircle 
} from 'lucide-react';

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-gray-200 bg-white flex flex-col h-screen sticky top-0 shrink-0 hidden md:flex">
      {/* Branding */}
      <div className="p-6 border-b border-gray-100">
        <h1 className="text-xl font-bold text-blue-700 tracking-tight">PandemicWatch</h1>
        <p className="text-xs text-black-500 font-medium tracking-widest mt-1 uppercase">
          Global Health Intelligence
        </p>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 py-6 flex flex-col gap-1 px-3">
        {/* Active Link Example */}
        <Link 
          href="/" 
          className="flex items-center gap-3 px-4 py-3 bg-blue-50/50 text-blue-700 font-semibold rounded-md border-l-4 border-blue-600 transition-colors"
        >
          <Globe className="w-5 h-5" />
          <span className="text-sm">GLOBAL OVERVIEW</span>
        </Link>

        {/* Inactive Links */}
        <Link href="/country-deep-dive" className="nav-item">
          <BarChart2 className="w-5 h-5 text-gray-500" />
          <span className="text-sm">COUNTRY DEEP-DIVE</span>
        </Link>

        <Link href="/compare" className="nav-item">
          <ArrowLeftRight className="w-5 h-5 text-gray-500" />
          <span className="text-sm">COMPARATIVE WORKSPACE</span>
        </Link>

        <Link href="/predictions" className="nav-item">
          <TrendingUp className="w-5 h-5 text-gray-500" />
          <span className="text-sm">PREDICTIVE TRENDS</span>
        </Link>

        <div className="mt-4">
          <Link href="/about" className="nav-item">
            <Info className="w-5 h-5 text-gray-500" />
            <span className="text-sm">ABOUT</span>
          </Link>
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-100 flex flex-col gap-1">
        <button className="nav-item w-full text-left">
          <Settings className="w-5 h-5 text-gray-500" />
          <span className="text-sm">SETTINGS</span>
        </button>
        <button className="nav-item w-full text-left">
          <UserCircle className="w-5 h-5 text-gray-500" />
          <span className="text-sm">USER STATUS</span>
        </button>
      </div>
    </aside>
  );
}