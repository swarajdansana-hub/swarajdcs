import React from 'react';
import { 
  Milk, 
  TrendingUp, 
  CalendarRange, 
  FileSpreadsheet, 
  Table,
  Users, 
  Settings, 
  Sun, 
  Moon,
  RotateCcw,
  Upload
} from 'lucide-react';
import { ShiftType } from '../types';

interface HeaderProps {
  activeTab: 'entry' | 'dashboard' | 'cycle' | 'reports' | 'ratechart' | 'settings';
  setActiveTab: (tab: 'entry' | 'dashboard' | 'cycle' | 'reports' | 'ratechart' | 'settings') => void;
  activeShift: ShiftType;
  setActiveShift: (shift: ShiftType) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  onResetData: () => void;
  onOpenImport?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  activeShift,
  setActiveShift,
  selectedDate,
  setSelectedDate,
  onResetData,
  onOpenImport,
}) => {
  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-3 gap-3 border-b border-stone-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs">
              <Milk className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold text-stone-900 tracking-tight">
                  Kisan Dairy Cooperative Society
                </h1>
                <span className="text-xs font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-medium">
                  DCS #402
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Automated Milk Procurement, 10-Day Cycle Settlements & Profit Analytics
              </p>
            </div>
          </div>

          {/* Quick Context Controls: Date & Shift */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Shift Selector */}
            <div className="inline-flex bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveShift('M')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  activeShift === 'M'
                    ? 'bg-amber-500 text-white font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Morning Shift</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveShift('E')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                  activeShift === 'E'
                    ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Evening Shift</span>
              </button>
            </div>

            {/* Date Picker */}
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-stone-50 border border-stone-200 text-xs rounded-lg px-2.5 py-1.5 text-stone-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />

            {/* Import Data Hub Button */}
            {onOpenImport && (
              <button
                type="button"
                onClick={onOpenImport}
                title="Import Rate Chart or Farmers Data"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors shadow-2xs"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">Import</span>
              </button>
            )}

            {/* Reset Sample Button */}
            <button
              type="button"
              onClick={onResetData}
              title="Reset to 10-day realistic sample data"
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg border border-stone-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2 scrollbar-none">
          <button
            type="button"
            id="nav-tab-entry"
            onClick={() => setActiveTab('entry')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'entry'
                ? 'bg-emerald-50 text-emerald-800 font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Milk className="w-4 h-4" />
            <span>Daily Collection Entry</span>
          </button>

          <button
            type="button"
            id="nav-tab-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-emerald-50 text-emerald-800 font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Daily Profit Trends</span>
          </button>

          <button
            type="button"
            id="nav-tab-cycle"
            onClick={() => setActiveTab('cycle')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'cycle'
                ? 'bg-emerald-50 text-emerald-800 font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <CalendarRange className="w-4 h-4" />
            <span>10-Day Payment Cycles</span>
          </button>

          <button
            type="button"
            id="nav-tab-reports"
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'reports'
                ? 'bg-emerald-50 text-emerald-800 font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>10-Day Fat & SNF Reports</span>
          </button>

          <button
            type="button"
            id="nav-tab-ratechart"
            onClick={() => setActiveTab('ratechart')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'ratechart'
                ? 'bg-emerald-50 text-emerald-800 font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Rate Chart (Fat & SNF)</span>
          </button>

          <button
            type="button"
            id="nav-tab-settings"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors ${
              activeTab === 'settings'
                ? 'bg-emerald-50 text-emerald-800 font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Farmers Registry</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
