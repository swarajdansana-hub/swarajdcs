import React, { useState, useMemo } from 'react';
import { MilkType, RateConfig } from '../types';
import { calculateFarmerRate, calculatePlantRate } from '../utils/rateCalculator';
import { 
  Table, 
  Printer, 
  Download, 
  Upload,
  Sliders, 
  Check, 
  Search, 
  Sparkles, 
  Scale, 
  Info,
  Maximize2,
  ChevronDown
} from 'lucide-react';

interface RateChartMatrixProps {
  rateConfig: RateConfig;
  onUpdateRateConfig: (config: RateConfig) => void;
  onOpenImportModal?: (type: 'ratechart' | 'farmers') => void;
}

export const RateChartMatrix: React.FC<RateChartMatrixProps> = ({
  rateConfig,
  onUpdateRateConfig,
  onOpenImportModal,
}) => {
  const [selectedMilkType, setSelectedMilkType] = useState<MilkType>('Cow');
  const [stepSize, setStepSize] = useState<0.1 | 0.2>(0.1);
  const [hoveredCell, setHoveredCell] = useState<{ fat: number; snf: number; rate: number } | null>(null);
  
  // Interactive Lookup / Calculator
  const [lookupFat, setLookupFat] = useState<string>(selectedMilkType === 'Cow' ? '3.8' : '6.8');
  const [lookupSnf, setLookupSnf] = useState<string>(selectedMilkType === 'Cow' ? '8.6' : '9.1');
  const [sampleLiters, setSampleLiters] = useState<string>('15');

  // Edit Parameters Accordion
  const [showConfigEditor, setShowConfigEditor] = useState<boolean>(false);
  const [editConfig, setEditConfig] = useState<RateConfig>(rateConfig);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Sync lookup defaults when milk type changes
  const handleSelectMilkType = (type: MilkType) => {
    setSelectedMilkType(type);
    if (type === 'Cow') {
      setLookupFat('3.8');
      setLookupSnf('8.6');
    } else {
      setLookupFat('6.8');
      setLookupSnf('9.1');
    }
  };

  // Generate Matrix Rows (Fat) & Columns (SNF)
  const { fatRows, snfCols, benchmarkFat, benchmarkSnf, baseRate } = useMemo(() => {
    if (selectedMilkType === 'Cow') {
      // Cow standard range: Fat 2.8% to 5.2%, SNF 7.5% to 9.4%
      const fats: number[] = [];
      const minFat = 2.8;
      const maxFat = 5.2;
      for (let f = minFat; f <= maxFat + 0.001; f += stepSize) {
        fats.push(Number(f.toFixed(1)));
      }

      const snfs: number[] = [];
      const minSnf = 7.6;
      const maxSnf = 9.9;
      for (let s = minSnf; s <= maxSnf + 0.001; s += stepSize) {
        snfs.push(Number(s.toFixed(1)));
      }

      return {
        fatRows: fats,
        snfCols: snfs,
        benchmarkFat: rateConfig.cowStandardFat,
        benchmarkSnf: rateConfig.cowStandardSNF,
        baseRate: rateConfig.cowBaseRate,
      };
    } else {
      // Buffalo standard range: Fat 5.0% to 10.5%, SNF 8.0% to 10.0%
      const fats: number[] = [];
      const minFat = 5.0;
      const maxFat = 10.2;
      for (let f = minFat; f <= maxFat + 0.001; f += stepSize) {
        fats.push(Number(f.toFixed(1)));
      }

      const snfs: number[] = [];
      const minSnf = 8.0;
      const maxSnf = 9.8;
      for (let s = minSnf; s <= maxSnf + 0.001; s += stepSize) {
        snfs.push(Number(s.toFixed(1)));
      }

      return {
        fatRows: fats,
        snfCols: snfs,
        benchmarkFat: rateConfig.buffaloStandardFat,
        benchmarkSnf: rateConfig.buffaloStandardSNF,
        baseRate: rateConfig.buffaloBaseRate,
      };
    }
  }, [selectedMilkType, stepSize, rateConfig]);

  // Lookup Calculation
  const numLookupFat = parseFloat(lookupFat) || 0;
  const numLookupSnf = parseFloat(lookupSnf) || 0;
  const numSampleLiters = parseFloat(sampleLiters) || 0;

  const lookupResult = useMemo(() => {
    if (numLookupFat <= 0 || numLookupSnf <= 0) return null;
    const farmerRate = calculateFarmerRate(selectedMilkType, numLookupFat, numLookupSnf, rateConfig);
    const plantRate = calculatePlantRate(farmerRate, rateConfig);
    const sampleFarmerPayout = Number((numSampleLiters * farmerRate).toFixed(2));
    const samplePlantRevenue = Number((numSampleLiters * plantRate).toFixed(2));
    const sampleSocietyMargin = Number((samplePlantRevenue - sampleFarmerPayout).toFixed(2));

    return {
      farmerRate,
      plantRate,
      marginPerLiter: rateConfig.dcsMarginPerLiter,
      sampleFarmerPayout,
      samplePlantRevenue,
      sampleSocietyMargin,
    };
  }, [selectedMilkType, numLookupFat, numLookupSnf, numSampleLiters, rateConfig]);

  // Handle Save Parameters
  const handleSaveParameters = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRateConfig(editConfig);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  // Export Matrix to CSV
  const handleExportMatrixCSV = () => {
    const headers = ['Fat % \\ SNF %', ...snfCols.map((s) => `${s.toFixed(1)}%`)];
    const rows = fatRows.map((f) => {
      const cellRates = snfCols.map((s) => {
        return calculateFarmerRate(selectedMilkType, f, s, rateConfig).toFixed(2);
      });
      return [`${f.toFixed(1)}%`, ...cellRates].join(',');
    });

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      `"Kisan DCS #402 - Official ${selectedMilkType} Milk Fat & SNF Rate Chart (INR/Litre)"\n` +
      `"Base Rate: INR ${baseRate} @ ${benchmarkFat}% Fat / ${benchmarkSnf}% SNF"\n\n` +
      [headers.join(','), ...rows].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DCS-Rate-Chart-${selectedMilkType}-Fat-SNF.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <Table className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base font-bold text-stone-900 tracking-tight">
                Official Milk Rate Chart (Fat & SNF Matrix)
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Two-axis pricing grid: Vertical rows = <strong>Fat %</strong> • Horizontal columns = <strong>SNF %</strong> • Cells = <strong>₹/Litre</strong>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {onOpenImportModal && (
              <button
                type="button"
                onClick={() => onOpenImportModal('ratechart')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white hover:bg-emerald-800 rounded-lg text-xs font-semibold transition-colors shadow-xs"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Rate Chart</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowConfigEditor(!showConfigEditor)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-300 rounded-lg text-xs font-semibold transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showConfigEditor ? 'Hide Formula Parameters' : 'Adjust Base Pricing'}</span>
            </button>
            <button
              type="button"
              onClick={handleExportMatrixCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Matrix CSV</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 text-white hover:bg-stone-900 rounded-lg text-xs font-semibold transition-colors shadow-xs"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" />
              <span>Print Official Poster Chart</span>
            </button>
          </div>
        </div>

        {/* Variety Selector & Step Options */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="inline-flex bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs">
              <button
                type="button"
                onClick={() => handleSelectMilkType('Cow')}
                className={`px-4 py-1.5 rounded-md font-semibold transition-all ${
                  selectedMilkType === 'Cow'
                    ? 'bg-amber-600 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Cow Milk Rate Chart
              </button>
              <button
                type="button"
                onClick={() => handleSelectMilkType('Buffalo')}
                className={`px-4 py-1.5 rounded-md font-semibold transition-all ${
                  selectedMilkType === 'Buffalo'
                    ? 'bg-stone-800 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Buffalo Milk Rate Chart
              </button>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-stone-600">
              <span className="text-stone-500 font-medium">Interval:</span>
              <button
                type="button"
                onClick={() => setStepSize(0.1)}
                className={`px-2 py-1 rounded text-xs font-mono font-medium transition-colors ${
                  stepSize === 0.1
                    ? 'bg-emerald-100 text-emerald-800 font-bold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                0.1% (Standard)
              </button>
              <button
                type="button"
                onClick={() => setStepSize(0.2)}
                className={`px-2 py-1 rounded text-xs font-mono font-medium transition-colors ${
                  stepSize === 0.2
                    ? 'bg-emerald-100 text-emerald-800 font-bold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                0.2% (Condensed)
              </button>
            </div>
          </div>

          <div className="text-xs text-stone-600 flex items-center gap-2">
            <span className="font-semibold text-stone-800">Benchmark:</span>
            <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 font-mono font-bold px-2 py-0.5 rounded">
              {benchmarkFat}% Fat / {benchmarkSnf}% SNF = ₹{baseRate.toFixed(2)}/L
            </span>
          </div>
        </div>

        {/* Optional Formula Parameter Editor */}
        {showConfigEditor && (
          <form
            onSubmit={handleSaveParameters}
            className="mt-4 p-4 bg-stone-50 rounded-xl border border-stone-200 animate-in fade-in duration-150 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-200">
              <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Edit Pricing Formula for {selectedMilkType} Milk
              </h4>
              <span className="text-[11px] text-stone-500">
                Adjusting parameters automatically updates every cell in the matrix below
              </span>
            </div>

            {selectedMilkType === 'Cow' ? (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Cow Base Rate (₹/L)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editConfig.cowBaseRate}
                    onChange={(e) =>
                      setEditConfig({ ...editConfig, cowBaseRate: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Std Fat / SNF Benchmark
                  </label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      step="0.1"
                      value={editConfig.cowStandardFat}
                      onChange={(e) =>
                        setEditConfig({
                          ...editConfig,
                          cowStandardFat: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-1/2 p-2 bg-white border border-stone-300 rounded-lg font-mono"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={editConfig.cowStandardSNF}
                      onChange={(e) =>
                        setEditConfig({
                          ...editConfig,
                          cowStandardSNF: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-1/2 p-2 bg-white border border-stone-300 rounded-lg font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Fat Diff (₹ / 0.1%)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={editConfig.cowFatIncRate}
                    onChange={(e) =>
                      setEditConfig({
                        ...editConfig,
                        cowFatIncRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    SNF Diff (₹ / 0.1%)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={editConfig.cowSnfIncRate}
                    onChange={(e) =>
                      setEditConfig({
                        ...editConfig,
                        cowSnfIncRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Buffalo Base Rate (₹/L)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editConfig.buffaloBaseRate}
                    onChange={(e) =>
                      setEditConfig({
                        ...editConfig,
                        buffaloBaseRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Std Fat / SNF Benchmark
                  </label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      step="0.1"
                      value={editConfig.buffaloStandardFat}
                      onChange={(e) =>
                        setEditConfig({
                          ...editConfig,
                          buffaloStandardFat: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-1/2 p-2 bg-white border border-stone-300 rounded-lg font-mono"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={editConfig.buffaloStandardSNF}
                      onChange={(e) =>
                        setEditConfig({
                          ...editConfig,
                          buffaloStandardSNF: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-1/2 p-2 bg-white border border-stone-300 rounded-lg font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Fat Diff (₹ / 0.1%)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={editConfig.buffaloFatIncRate}
                    onChange={(e) =>
                      setEditConfig({
                        ...editConfig,
                        buffaloFatIncRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    SNF Diff (₹ / 0.1%)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={editConfig.buffaloSnfIncRate}
                    onChange={(e) =>
                      setEditConfig({
                        ...editConfig,
                        buffaloSnfIncRate: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              {saveSuccess && (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  Formula Saved!
                </span>
              )}
              <button
                type="submit"
                className="px-4 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800"
              >
                Apply to Rate Chart
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Interactive Quick Fat & SNF Rate Lookup Bar */}
      <div className="bg-emerald-900 text-white rounded-xl p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-800 text-emerald-200 flex items-center justify-center shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Quick Fat & SNF Rate Finder
                <span className="text-xs font-mono font-normal text-emerald-300">
                  ({selectedMilkType} Milk)
                </span>
              </h3>
              <p className="text-xs text-emerald-200">
                Type any Fat & SNF reading to see the exact rate and highlight it in the matrix below
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <label className="block text-[10px] text-emerald-300 uppercase font-semibold mb-0.5">
                Fat %
              </label>
              <input
                type="number"
                step="0.1"
                min="2.0"
                max="12.0"
                value={lookupFat}
                onChange={(e) => setLookupFat(e.target.value)}
                className="w-20 p-1.5 rounded bg-emerald-950 border border-emerald-700 text-white font-mono font-bold text-sm text-center"
              />
            </div>

            <div>
              <label className="block text-[10px] text-emerald-300 uppercase font-semibold mb-0.5">
                SNF %
              </label>
              <input
                type="number"
                step="0.1"
                min="6.0"
                max="12.0"
                value={lookupSnf}
                onChange={(e) => setLookupSnf(e.target.value)}
                className="w-20 p-1.5 rounded bg-emerald-950 border border-emerald-700 text-white font-mono font-bold text-sm text-center"
              />
            </div>

            <div>
              <label className="block text-[10px] text-emerald-300 uppercase font-semibold mb-0.5">
                Can Litres
              </label>
              <input
                type="number"
                step="1"
                min="1"
                value={sampleLiters}
                onChange={(e) => setSampleLiters(e.target.value)}
                className="w-20 p-1.5 rounded bg-emerald-950 border border-emerald-700 text-white font-mono font-bold text-sm text-center"
              />
            </div>

            {lookupResult && (
              <div className="bg-emerald-800/80 px-4 py-2 rounded-lg border border-emerald-700/60 flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-emerald-300 uppercase block">Rate / Litre</span>
                  <span className="text-xl font-bold text-amber-300">
                    ₹{lookupResult.farmerRate.toFixed(2)}
                  </span>
                </div>
                <div className="border-l border-emerald-700/60 pl-3">
                  <span className="text-[10px] text-emerald-300 uppercase block">
                    Total ({numSampleLiters}L)
                  </span>
                  <span className="text-lg font-bold text-white">
                    ₹{lookupResult.sampleFarmerPayout.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* The Full Fat & SNF Matrix Grid */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100 mb-4">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-700" />
            <h3 className="text-sm font-bold text-stone-900">
              {selectedMilkType} Milk Two-Axis Rate Matrix (₹ per Litre)
            </h3>
          </div>

          <div className="flex items-center gap-3 text-xs text-stone-500">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-200 border border-amber-400"></span>
              <span>Benchmark Standard</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-600 text-white flex items-center justify-center text-[9px] font-bold">✓</span>
              <span>Active Lookup</span>
            </span>
          </div>
        </div>

        {/* Scrollable Matrix Table */}
        <div className="overflow-x-auto max-h-[600px] scrollbar-thin border border-stone-200 rounded-lg">
          <table className="w-full text-center text-xs font-mono border-collapse select-none">
            {/* Sticky Header: SNF % Columns */}
            <thead className="sticky top-0 z-20 bg-stone-800 text-white shadow-xs">
              <tr>
                <th className="p-2.5 bg-stone-900 text-amber-400 font-bold sticky left-0 z-30 border-r border-stone-700 text-left pl-3 text-[11px] whitespace-nowrap">
                  Fat % \ SNF %
                </th>
                {snfCols.map((snf) => {
                  const isBenchmarkSnf = Math.abs(snf - benchmarkSnf) < 0.05;
                  const isLookupSnf = Math.abs(snf - numLookupSnf) < 0.05;
                  return (
                    <th
                      key={snf}
                      className={`p-2 font-bold text-[11px] border-r border-stone-700/60 transition-colors ${
                        isLookupSnf
                          ? 'bg-emerald-700 text-white ring-2 ring-emerald-400'
                          : isBenchmarkSnf
                          ? 'bg-stone-700 text-amber-300'
                          : 'text-stone-200'
                      }`}
                    >
                      {snf.toFixed(1)}%
                    </th>
                  );
                })}
              </tr>
            </thead>

            {/* Matrix Body: Fat Rows */}
            <tbody className="divide-y divide-stone-100">
              {fatRows.map((fat) => {
                const isBenchmarkFat = Math.abs(fat - benchmarkFat) < 0.05;
                const isLookupFat = Math.abs(fat - numLookupFat) < 0.05;

                return (
                  <tr key={fat} className="hover:bg-stone-50/80 transition-colors">
                    {/* Sticky Row Header: Fat % */}
                    <td
                      className={`p-2 text-left pl-3 font-bold sticky left-0 z-10 border-r border-stone-200 text-[11px] transition-colors ${
                        isLookupFat
                          ? 'bg-emerald-700 text-white'
                          : isBenchmarkFat
                          ? 'bg-amber-100 text-amber-900 font-bold'
                          : 'bg-stone-100 text-stone-800'
                      }`}
                    >
                      {fat.toFixed(1)}% Fat
                    </td>

                    {/* Rate Cells for each SNF */}
                    {snfCols.map((snf) => {
                      const rate = calculateFarmerRate(selectedMilkType, fat, snf, rateConfig);
                      const isBenchmarkCell = isBenchmarkFat && Math.abs(snf - benchmarkSnf) < 0.05;
                      const isLookupCell = isLookupFat && Math.abs(snf - numLookupSnf) < 0.05;

                      return (
                        <td
                          key={snf}
                          onMouseEnter={() => setHoveredCell({ fat, snf, rate })}
                          onMouseLeave={() => setHoveredCell(null)}
                          onClick={() => {
                            setLookupFat(fat.toString());
                            setLookupSnf(snf.toString());
                          }}
                          className={`p-2 border-r border-stone-100 cursor-pointer font-medium transition-all ${
                            isLookupCell
                              ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-500 shadow-sm scale-105 z-10'
                              : isBenchmarkCell
                              ? 'bg-amber-200 text-amber-950 font-bold'
                              : rate > baseRate
                              ? 'text-emerald-900 hover:bg-emerald-50'
                              : 'text-stone-700 hover:bg-stone-100'
                          }`}
                          title={`Fat: ${fat}% | SNF: ${snf}% = ₹${rate.toFixed(2)}/Litre`}
                        >
                          {rate.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Hovered Cell Detail Strip */}
        <div className="mt-3 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-stone-400" />
            {hoveredCell ? (
              <span className="font-mono text-stone-800">
                Selected Cell: <strong>{hoveredCell.fat}% Fat</strong> & <strong>{hoveredCell.snf}% SNF</strong> ={' '}
                <strong className="text-emerald-800 text-sm">₹{hoveredCell.rate.toFixed(2)} / Litre</strong>
              </span>
            ) : (
              <span>Click or hover on any cell in the table to inspect exact pricing breakdown</span>
            )}
          </div>
          <span className="text-[11px] text-stone-400 font-mono">
            Rate Formula: ISI Dual-Factor Matrix Model
          </span>
        </div>
      </div>
    </div>
  );
};
