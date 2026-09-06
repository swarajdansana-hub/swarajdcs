import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  MilkEntry, 
  Farmer, 
  RateConfig, 
  ShiftType, 
  MilkType 
} from '../types';
import { 
  calculateMilkTotals, 
  calculateSnfFromClr 
} from '../utils/rateCalculator';
import { 
  Plus, 
  Printer, 
  Trash2, 
  Sparkles, 
  Scale, 
  Search, 
  TrendingUp, 
  CheckCircle2, 
  Sun, 
  Moon, 
  Layers 
} from 'lucide-react';

interface DailyEntryProps {
  entries: MilkEntry[];
  farmers: Farmer[];
  rateConfig: RateConfig;
  activeShift: ShiftType;
  setActiveShift: (shift: ShiftType) => void;
  selectedDate: string;
  onAddEntry: (entry: MilkEntry) => void;
  onDeleteEntry: (id: string) => void;
  onViewReceipt: (entry: MilkEntry) => void;
  onOpenRateChart?: () => void;
}

export const DailyEntry: React.FC<DailyEntryProps> = ({
  entries,
  farmers,
  rateConfig,
  activeShift,
  setActiveShift,
  selectedDate,
  onAddEntry,
  onDeleteEntry,
  onViewReceipt,
  onOpenRateChart,
}) => {
  // Form States
  const [farmerCode, setFarmerCode] = useState<string>('');
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [milkType, setMilkType] = useState<MilkType>('Cow');
  const [liters, setLiters] = useState<string>('');
  const [fat, setFat] = useState<string>('');
  const [useClr, setUseClr] = useState<boolean>(false);
  const [clr, setClr] = useState<string>('');
  const [snf, setSnf] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFarmerSearch, setShowFarmerSearch] = useState<boolean>(false);
  const [lastSavedEntry, setLastSavedEntry] = useState<MilkEntry | null>(null);

  const farmerCodeInputRef = useRef<HTMLInputElement>(null);

  // Auto-fill farmer when farmerCode matches
  useEffect(() => {
    if (!farmerCode.trim()) {
      setSelectedFarmer(null);
      return;
    }
    const match = farmers.find(
      (f) => f.code.toLowerCase() === farmerCode.trim().toLowerCase()
    );
    if (match) {
      setSelectedFarmer(match);
      setMilkType(match.defaultMilkType);
    } else {
      setSelectedFarmer(null);
    }
  }, [farmerCode, farmers]);

  // Recalculate SNF if CLR or Fat changes in CLR mode
  useEffect(() => {
    if (useClr && clr && fat) {
      const calculated = calculateSnfFromClr(parseFloat(clr), parseFloat(fat));
      if (calculated > 0) {
        setSnf(calculated.toString());
      }
    }
  }, [useClr, clr, fat]);

  // Live Rate Calculation
  const numLiters = parseFloat(liters) || 0;
  const numFat = parseFloat(fat) || 0;
  const numSnf = parseFloat(snf) || 0;

  const liveTotals = useMemo(() => {
    if (numLiters > 0 && numFat > 0 && numSnf > 0) {
      return calculateMilkTotals(numLiters, numFat, numSnf, milkType, rateConfig);
    }
    return {
      ratePerLiter: 0,
      totalAmount: 0,
      plantRatePerLiter: 0,
      plantTotalAmount: 0,
      societyProfit: 0,
      fatKg: 0,
      snfKg: 0,
    };
  }, [numLiters, numFat, numSnf, milkType, rateConfig]);

  // Handle Form Submit
  const handleSubmit = (e: React.FormEvent, printImmediately: boolean = false) => {
    e.preventDefault();

    if (!selectedFarmer) {
      alert('Please enter a valid Farmer Code or select from the farmer list.');
      return;
    }
    if (numLiters <= 0) {
      alert('Please enter valid milk quantity in Litres.');
      return;
    }
    if (numFat <= 0 || numFat > 15) {
      alert('Please enter a valid Fat % (typically 3.0% to 12.0%).');
      return;
    }
    if (numSnf <= 0 || numSnf > 15) {
      alert('Please enter a valid SNF % (typically 7.5% to 11.0%).');
      return;
    }

    const receiptNo = `REC-${Date.now().toString().slice(-6)}`;
    const newEntry: MilkEntry = {
      id: `entry-${Date.now()}`,
      receiptNo,
      date: selectedDate,
      shift: activeShift,
      farmerId: selectedFarmer.id,
      farmerCode: selectedFarmer.code,
      farmerName: selectedFarmer.name,
      milkType,
      liters: numLiters,
      fat: numFat,
      snf: numSnf,
      clr: useClr && clr ? parseFloat(clr) : undefined,
      ratePerLiter: liveTotals.ratePerLiter,
      totalAmount: liveTotals.totalAmount,
      plantRatePerLiter: liveTotals.plantRatePerLiter,
      plantTotalAmount: liveTotals.plantTotalAmount,
      societyProfit: liveTotals.societyProfit,
      createdAt: new Date().toISOString(),
    };

    onAddEntry(newEntry);
    setLastSavedEntry(newEntry);

    if (printImmediately) {
      onViewReceipt(newEntry);
    }

    // Reset entry fields for next farmer
    setFarmerCode('');
    setSelectedFarmer(null);
    setLiters('');
    setFat('');
    setSnf('');
    setClr('');

    // Focus back on farmer code input
    setTimeout(() => {
      farmerCodeInputRef.current?.focus();
    }, 50);
  };

  // Filter entries for the selected date and shift
  const shiftEntries = useMemo(() => {
    return entries.filter(
      (e) => e.date === selectedDate && e.shift === activeShift
    );
  }, [entries, selectedDate, activeShift]);

  // Calculate Shift Metrics
  const shiftSummary = useMemo(() => {
    let totalLiters = 0;
    let totalFatKg = 0;
    let totalSnfKg = 0;
    let totalFarmerPayout = 0;
    let totalPlantRevenue = 0;
    let totalProfit = 0;
    let cowCount = 0;
    let buffaloCount = 0;

    shiftEntries.forEach((e) => {
      totalLiters += e.liters;
      totalFatKg += (e.liters * e.fat) / 100;
      totalSnfKg += (e.liters * e.snf) / 100;
      totalFarmerPayout += e.totalAmount;
      totalPlantRevenue += e.plantTotalAmount;
      totalProfit += e.societyProfit;
      if (e.milkType === 'Cow') cowCount++;
      else buffaloCount++;
    });

    const avgFat = totalLiters > 0 ? (totalFatKg / totalLiters) * 100 : 0;
    const avgSnf = totalLiters > 0 ? (totalSnfKg / totalLiters) * 100 : 0;

    return {
      count: shiftEntries.length,
      totalLiters: Number(totalLiters.toFixed(1)),
      avgFat: Number(avgFat.toFixed(2)),
      avgSnf: Number(avgSnf.toFixed(2)),
      totalFarmerPayout: Number(totalFarmerPayout.toFixed(2)),
      totalPlantRevenue: Number(totalPlantRevenue.toFixed(2)),
      totalProfit: Number(totalProfit.toFixed(2)),
      cowCount,
      buffaloCount,
    };
  }, [shiftEntries]);

  // Filtered farmers for search dropdown
  const filteredFarmers = useMemo(() => {
    if (!searchQuery.trim()) return farmers;
    const q = searchQuery.toLowerCase();
    return farmers.filter(
      (f) =>
        f.code.toLowerCase().includes(q) ||
        f.name.toLowerCase().includes(q) ||
        f.village.toLowerCase().includes(q)
    );
  }, [farmers, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Shift Live Statistics Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <span
              className={`p-2 rounded-lg ${
                activeShift === 'M'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-indigo-100 text-indigo-800'
              }`}
            >
              {activeShift === 'M' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-stone-900">
                  {activeShift === 'M' ? 'Morning Shift Collection' : 'Evening Shift Collection'}
                </h2>
                <span className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded font-mono">
                  {selectedDate}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                {shiftSummary.count} milk cans accepted • {shiftSummary.cowCount} Cow, {shiftSummary.buffaloCount} Buffalo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveShift('M')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeShift === 'M'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Morning (M)
            </button>
            <button
              type="button"
              onClick={() => setActiveShift('E')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeShift === 'E'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Evening (E)
            </button>
          </div>
        </div>

        {/* 4 Summary Chips */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
          <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
            <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
              Shift Volume
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-bold text-stone-900 font-mono">
                {shiftSummary.totalLiters}
              </span>
              <span className="text-xs text-stone-500 font-medium">Litres</span>
            </div>
          </div>

          <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
            <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
              Weighted Fat / SNF
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-base font-bold text-emerald-800 font-mono">
                {shiftSummary.avgFat}%
              </span>
              <span className="text-xs text-stone-400">/</span>
              <span className="text-base font-bold text-emerald-800 font-mono">
                {shiftSummary.avgSnf}%
              </span>
            </div>
          </div>

          <div className="bg-stone-50 p-3 rounded-lg border border-stone-100">
            <span className="text-[11px] font-medium text-stone-500 uppercase tracking-wider block">
              Farmer Payout (Cost)
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-bold text-stone-800 font-mono">
                ₹{shiftSummary.totalFarmerPayout.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
            <span className="text-[11px] font-medium text-emerald-800 uppercase tracking-wider block flex items-center justify-between">
              <span>Shift DCS Margin</span>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-semibold">
                +₹{rateConfig.dcsMarginPerLiter}/L
              </span>
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-bold text-emerald-900 font-mono">
                +₹{shiftSummary.totalProfit.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Rapid Milk Collection Form (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-stone-900">New Milk Intake</h3>
                <p className="text-[11px] text-stone-500">Fast keyboard-ready entry desk</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowFarmerSearch(!showFarmerSearch)}
              className="text-xs text-emerald-700 hover:text-emerald-800 font-medium flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded"
            >
              <Search className="w-3 h-3" />
              <span>Lookup Farmer</span>
            </button>
          </div>

          {/* Farmer Quick Search Dropdown Modal */}
          {showFarmerSearch && (
            <div className="mb-4 p-3 bg-stone-50 border border-stone-200 rounded-lg animate-in fade-in duration-150">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-700">Search Farmer Directory</span>
                <button
                  type="button"
                  onClick={() => setShowFarmerSearch(false)}
                  className="text-stone-400 hover:text-stone-600 text-xs"
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                placeholder="Search name, code, village..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs p-2 rounded border border-stone-300 bg-white mb-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-stone-100">
                {filteredFarmers.map((f) => (
                  <div
                    key={f.id}
                    onClick={() => {
                      setFarmerCode(f.code);
                      setSelectedFarmer(f);
                      setMilkType(f.defaultMilkType);
                      setShowFarmerSearch(false);
                    }}
                    className="p-1.5 hover:bg-emerald-50 rounded cursor-pointer flex justify-between items-center text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-emerald-800">#{f.code}</span>
                      <span className="ml-2 font-medium text-stone-800">{f.name}</span>
                      <span className="ml-1 text-stone-400 text-[10px]">({f.village})</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 bg-stone-200 text-stone-700 rounded font-medium">
                      {f.defaultMilkType}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-4">
            {/* Farmer Code & Auto-resolved Name */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Farmer Code <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    ref={farmerCodeInputRef}
                    type="text"
                    placeholder="e.g. 101, 102"
                    value={farmerCode}
                    onChange={(e) => setFarmerCode(e.target.value)}
                    required
                    className="w-full text-sm font-mono font-semibold px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="flex-2 bg-stone-100 rounded-lg px-3 py-2 border border-stone-200 flex items-center justify-between">
                  {selectedFarmer ? (
                    <div>
                      <span className="text-xs font-bold text-stone-900 block truncate">
                        {selectedFarmer.name}
                      </span>
                      <span className="text-[10px] text-stone-500">
                        {selectedFarmer.village}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-stone-400 italic">
                      {farmerCode ? 'Farmer code not found' : 'Enter code to load farmer'}
                    </span>
                  )}
                  {selectedFarmer && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                </div>
              </div>
            </div>

            {/* Milk Type & Shift Mode */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Milk Variety
                </label>
                <div className="grid grid-cols-2 gap-1 bg-stone-100 p-1 rounded-lg border border-stone-200">
                  <button
                    type="button"
                    onClick={() => setMilkType('Cow')}
                    className={`py-1.5 text-xs font-medium rounded transition-colors ${
                      milkType === 'Cow'
                        ? 'bg-emerald-700 text-white font-semibold shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Cow Milk
                  </button>
                  <button
                    type="button"
                    onClick={() => setMilkType('Buffalo')}
                    className={`py-1.5 text-xs font-medium rounded transition-colors ${
                      milkType === 'Buffalo'
                        ? 'bg-emerald-700 text-white font-semibold shadow-2xs'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    Buffalo
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Quantity (Litres) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="e.g. 14.5"
                  value={liters}
                  onChange={(e) => setLiters(e.target.value)}
                  required
                  className="w-full text-sm font-mono font-semibold px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Testing Quality Inputs: Fat & SNF / CLR */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-700" />
                  Quality Analyzer Testing
                </span>
                <button
                  type="button"
                  onClick={() => setUseClr(!useClr)}
                  className="text-[11px] font-medium text-emerald-700 hover:underline"
                >
                  {useClr ? 'Switch to Direct SNF %' : 'Compute SNF from CLR'}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Fat Input */}
                <div>
                  <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                    Fat % <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="2.0"
                      max="15.0"
                      placeholder={milkType === 'Cow' ? '3.8' : '6.8'}
                      value={fat}
                      onChange={(e) => setFat(e.target.value)}
                      required
                      className="w-full text-sm font-mono font-bold px-3 py-1.5 bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <span className="absolute right-3 top-2 text-xs text-stone-400 font-mono">%</span>
                  </div>
                  <span className="text-[10px] text-stone-400 mt-0.5 block">
                    {milkType === 'Cow' ? 'Base: 3.5%' : 'Base: 6.5%'}
                  </span>
                </div>

                {/* SNF or CLR Input */}
                {useClr ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      Lactometer (CLR) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="15"
                      max="40"
                      placeholder="e.g. 28.5"
                      value={clr}
                      onChange={(e) => setClr(e.target.value)}
                      required
                      className="w-full text-sm font-mono font-bold px-3 py-1.5 bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-emerald-700 font-mono mt-0.5 block font-medium">
                      SNF: {snf || '0.00'}%
                    </span>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                      SNF % <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.01"
                        min="5.0"
                        max="14.0"
                        placeholder={milkType === 'Cow' ? '8.50' : '9.00'}
                        value={snf}
                        onChange={(e) => setSnf(e.target.value)}
                        required
                        className="w-full text-sm font-mono font-bold px-3 py-1.5 bg-white border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      <span className="absolute right-3 top-2 text-xs text-stone-400 font-mono">%</span>
                    </div>
                    <span className="text-[10px] text-stone-400 mt-0.5 block">
                      {milkType === 'Cow' ? 'Base: 8.5%' : 'Base: 9.0%'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Live Calculation Preview Card */}
            <div className="bg-emerald-900 text-white rounded-xl p-4 shadow-sm space-y-3">
              <div className="flex justify-between items-center pb-2 border-b border-emerald-800/80">
                <span className="text-xs uppercase tracking-wider text-emerald-300 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Auto-Computed Rate & Payout
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-emerald-200">
                    {milkType} Rate Chart
                  </span>
                  {onOpenRateChart && (
                    <button
                      type="button"
                      onClick={onOpenRateChart}
                      className="text-[10px] bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-semibold px-2 py-0.5 rounded border border-emerald-600 transition-colors"
                    >
                      View Full Rate Chart
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] text-emerald-300 block">Farmer Rate / Litre</span>
                  <span className="text-xl font-bold font-mono text-emerald-100">
                    ₹{liveTotals.ratePerLiter.toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-emerald-300 block">Total Amount Payable</span>
                  <span className="text-2xl font-bold font-mono text-amber-300">
                    ₹{liveTotals.totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-emerald-800/80 flex justify-between text-[11px] text-emerald-200">
                <span>
                  Fat: <strong className="text-white">{liveTotals.fatKg} kg</strong> • SNF:{' '}
                  <strong className="text-white">{liveTotals.snfKg} kg</strong>
                </span>
                <span>
                  DCS Margin: <strong className="text-emerald-300">+₹{liveTotals.societyProfit.toFixed(2)}</strong>
                </span>
              </div>
            </div>

            {/* Submit Action Buttons */}
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2.5 px-4 rounded-lg text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Save Entry (Enter)</span>
              </button>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                className="bg-stone-800 hover:bg-stone-900 text-white font-medium py-2.5 px-4 rounded-lg text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                title="Save and directly open thermal print receipt slip"
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Save & Print Slip</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Shift Milk Ledger Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-stone-200 p-5 shadow-xs flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100 mb-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-700" />
                Shift Collection Ledger
              </h3>
              <p className="text-xs text-stone-500">
                {shiftEntries.length} receipts registered for {selectedDate} ({activeShift === 'M' ? 'Morning' : 'Evening'})
              </p>
            </div>

            {lastSavedEntry && (
              <button
                type="button"
                onClick={() => onViewReceipt(lastSavedEntry)}
                className="text-xs bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-md font-medium flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Last Slip ({lastSavedEntry.farmerCode})</span>
              </button>
            )}
          </div>

          {/* Table */}
          <div className="flex-1 overflow-x-auto">
            {shiftEntries.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-stone-200 rounded-lg text-stone-400">
                <Scale className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-800" />
                <p className="text-sm font-medium text-stone-600">No collection entries yet for this shift</p>
                <p className="text-xs mt-1 text-stone-400">
                  Enter farmer code and milk metrics on the left to record the first can.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50 text-stone-600 font-semibold border-y border-stone-200">
                    <th className="py-2.5 px-3">Receipt</th>
                    <th className="py-2.5 px-3">Farmer</th>
                    <th className="py-2.5 px-2">Type</th>
                    <th className="py-2.5 px-2 text-right">Liters</th>
                    <th className="py-2.5 px-2 text-right">Fat%</th>
                    <th className="py-2.5 px-2 text-right">SNF%</th>
                    <th className="py-2.5 px-2 text-right">Rate/L</th>
                    <th className="py-2.5 px-3 text-right">Amount</th>
                    <th className="py-2.5 px-2 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {shiftEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-stone-500">
                        {entry.receiptNo}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-stone-900">
                          #{entry.farmerCode} {entry.farmerName}
                        </div>
                      </td>
                      <td className="py-2.5 px-2">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            entry.milkType === 'Cow'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-200 text-stone-800'
                          }`}
                        >
                          {entry.milkType}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold text-stone-900">
                        {entry.liters.toFixed(1)}
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-medium text-emerald-800">
                        {entry.fat.toFixed(1)}%
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono font-medium text-emerald-800">
                        {entry.snf.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-2 text-right font-mono text-stone-600">
                        ₹{entry.ratePerLiter.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-900">
                        ₹{entry.totalAmount.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => onViewReceipt(entry)}
                            title="Print receipt slip"
                            className="p-1 text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Delete entry for farmer #${entry.farmerCode}?`)) {
                                onDeleteEntry(entry.id);
                              }
                            }}
                            title="Delete entry"
                            className="p-1 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Shift Footer Totals */}
          {shiftEntries.length > 0 && (
            <div className="mt-3 pt-3 border-t border-stone-200 bg-stone-50 -mx-5 -mb-5 px-5 py-3 rounded-b-xl flex flex-wrap items-center justify-between text-xs">
              <div className="text-stone-600">
                Total Shift Dispatch:{' '}
                <strong className="text-stone-900 font-mono">{shiftSummary.totalLiters} L</strong>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-stone-600">
                  Total Payable:{' '}
                  <strong className="text-stone-900 font-mono">
                    ₹{shiftSummary.totalFarmerPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </span>
                <span className="text-emerald-800 font-medium">
                  Center Profit:{' '}
                  <strong className="font-mono">
                    +₹{shiftSummary.totalProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </strong>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
