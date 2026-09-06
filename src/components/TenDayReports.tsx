import React, { useState, useMemo } from 'react';
import { MilkEntry, Farmer, CycleSummary } from '../types';
import { calculateCycleSummary } from '../utils/cycleUtils';
import { 
  FileSpreadsheet, 
  Printer, 
  Download, 
  Award, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert, 
  Sparkles,
  BarChart2,
  Calendar
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine
} from 'recharts';

interface TenDayReportsProps {
  entries: MilkEntry[];
  farmers: Farmer[];
}

export const TenDayReports: React.FC<TenDayReportsProps> = ({ entries, farmers }) => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // September
  const [selectedCycleNum, setSelectedCycleNum] = useState<1 | 2 | 3>(1);

  // Compute 10-day cycle summary
  const cycleSummary: CycleSummary = useMemo(() => {
    return calculateCycleSummary(selectedCycleNum, selectedYear, selectedMonth, entries, farmers);
  }, [selectedCycleNum, selectedYear, selectedMonth, entries, farmers]);

  // Extract cycle entries for deeper analysis
  const cycleEntries = useMemo(() => {
    const startDay = selectedCycleNum === 1 ? 1 : selectedCycleNum === 2 ? 11 : 21;
    const endDay =
      selectedCycleNum === 1
        ? 10
        : selectedCycleNum === 2
        ? 20
        : new Date(selectedYear, selectedMonth + 1, 0).getDate();

    return entries.filter((e) => {
      const d = new Date(e.date);
      if (d.getFullYear() !== selectedYear || d.getMonth() !== selectedMonth) return false;
      const day = d.getDate();
      return day >= startDay && day <= endDay;
    });
  }, [entries, selectedYear, selectedMonth, selectedCycleNum]);

  // Cow vs Buffalo separate quality metrics
  const milkTypeMetrics = useMemo(() => {
    let cowLiters = 0;
    let cowFatKg = 0;
    let cowSnfKg = 0;
    let buffaloLiters = 0;
    let buffaloFatKg = 0;
    let buffaloSnfKg = 0;

    cycleEntries.forEach((e) => {
      if (e.milkType === 'Cow') {
        cowLiters += e.liters;
        cowFatKg += (e.liters * e.fat) / 100;
        cowSnfKg += (e.liters * e.snf) / 100;
      } else {
        buffaloLiters += e.liters;
        buffaloFatKg += (e.liters * e.fat) / 100;
        buffaloSnfKg += (e.liters * e.snf) / 100;
      }
    });

    const cowAvgFat = cowLiters > 0 ? (cowFatKg / cowLiters) * 100 : 0;
    const cowAvgSnf = cowLiters > 0 ? (cowSnfKg / cowLiters) * 100 : 0;
    const buffaloAvgFat = buffaloLiters > 0 ? (buffaloFatKg / buffaloLiters) * 100 : 0;
    const buffaloAvgSnf = buffaloLiters > 0 ? (buffaloSnfKg / buffaloLiters) * 100 : 0;

    return {
      cowLiters: Number(cowLiters.toFixed(1)),
      cowAvgFat: Number(cowAvgFat.toFixed(2)),
      cowAvgSnf: Number(cowAvgSnf.toFixed(2)),
      cowFatKg: Number(cowFatKg.toFixed(2)),
      cowSnfKg: Number(cowSnfKg.toFixed(2)),
      buffaloLiters: Number(buffaloLiters.toFixed(1)),
      buffaloAvgFat: Number(buffaloAvgFat.toFixed(2)),
      buffaloAvgSnf: Number(buffaloAvgSnf.toFixed(2)),
      buffaloFatKg: Number(buffaloFatKg.toFixed(2)),
      buffaloSnfKg: Number(buffaloSnfKg.toFixed(2)),
      totalFatKg: Number((cowFatKg + buffaloFatKg).toFixed(2)),
      totalSnfKg: Number((cowSnfKg + buffaloSnfKg).toFixed(2)),
    };
  }, [cycleEntries]);

  // Day-by-day 10-day Fat & SNF Trend data
  const dayByDayTrend = useMemo(() => {
    const map: Record<
      string,
      {
        totalLiters: number;
        fatKg: number;
        snfKg: number;
        cowFatKg: number;
        cowLiters: number;
        bufFatKg: number;
        bufLiters: number;
      }
    > = {};

    cycleEntries.forEach((e) => {
      if (!map[e.date]) {
        map[e.date] = {
          totalLiters: 0,
          fatKg: 0,
          snfKg: 0,
          cowFatKg: 0,
          cowLiters: 0,
          bufFatKg: 0,
          bufLiters: 0,
        };
      }
      map[e.date].totalLiters += e.liters;
      map[e.date].fatKg += (e.liters * e.fat) / 100;
      map[e.date].snfKg += (e.liters * e.snf) / 100;
      if (e.milkType === 'Cow') {
        map[e.date].cowLiters += e.liters;
        map[e.date].cowFatKg += (e.liters * e.fat) / 100;
      } else {
        map[e.date].bufLiters += e.liters;
        map[e.date].bufFatKg += (e.liters * e.fat) / 100;
      }
    });

    const sortedDates = Object.keys(map).sort();
    return sortedDates.map((dateStr) => {
      const item = map[dateStr];
      const dateObj = new Date(dateStr);
      const display = `${dateObj.getDate()} ${dateObj.toLocaleDateString('en-US', { month: 'short' })}`;

      const overallFat = item.totalLiters > 0 ? (item.fatKg / item.totalLiters) * 100 : 0;
      const overallSnf = item.totalLiters > 0 ? (item.snfKg / item.totalLiters) * 100 : 0;
      const cowFat = item.cowLiters > 0 ? (item.cowFatKg / item.cowLiters) * 100 : 0;
      const bufFat = item.bufLiters > 0 ? (item.bufFatKg / item.bufLiters) * 100 : 0;

      return {
        date: dateStr,
        display,
        overallFat: Number(overallFat.toFixed(2)),
        overallSnf: Number(overallSnf.toFixed(2)),
        cowFat: Number(cowFat.toFixed(2)),
        bufFat: Number(bufFat.toFixed(2)),
      };
    });
  }, [cycleEntries]);

  // Quality alerts / Low SNF detection table
  // Standard threshold: Cow SNF < 8.4% or Buffalo SNF < 8.9% flags potential water dilution
  const qualityAlerts = useMemo(() => {
    return cycleEntries.filter((e) => {
      if (e.milkType === 'Cow' && e.snf < 8.4) return true;
      if (e.milkType === 'Buffalo' && e.snf < 8.9) return true;
      return false;
    });
  }, [cycleEntries]);

  // Top Quality Farmers by 10-day average Fat & SNF
  const topFarmersByFat = useMemo(() => {
    return [...cycleSummary.farmerSummaries]
      .filter((f) => f.totalLiters > 0)
      .sort((a, b) => b.avgFat - a.avgFat)
      .slice(0, 5);
  }, [cycleSummary.farmerSummaries]);

  const topFarmersByVolume = useMemo(() => {
    return [...cycleSummary.farmerSummaries]
      .filter((f) => f.totalLiters > 0)
      .sort((a, b) => b.totalLiters - a.totalLiters)
      .slice(0, 5);
  }, [cycleSummary.farmerSummaries]);

  // Export 10-Day Quality Audit Report CSV
  const handleExportQualityReport = () => {
    const headers = [
      'Date',
      'Shift',
      'Farmer Code',
      'Farmer Name',
      'Milk Type',
      'Liters',
      'Fat %',
      'SNF %',
      'Rate/Ltr',
      'Total Amount (INR)'
    ];

    const rows = cycleEntries.map((e) => [
      e.date,
      e.shift === 'M' ? 'Morning' : 'Evening',
      e.farmerCode,
      `"${e.farmerName}"`,
      e.milkType,
      e.liters,
      e.fat,
      e.snf,
      e.ratePerLiter,
      e.totalAmount
    ].join(','));

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DCS-10Day-Audit-Report-${cycleSummary.cycleId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* 10-Day Report Header & Controls */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base font-bold text-stone-900 tracking-tight">
                10-Day Fat & SNF Averages and Quality Audit Report
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Comprehensive milk quality analytics, weighted averages, and consistency inspection
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportQualityReport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Quality Audit CSV</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-300 rounded-lg text-xs font-medium transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print 10-Day Report</span>
            </button>
          </div>
        </div>

        {/* Cycle Chooser */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-stone-600">Audit Cycle:</span>
            <div className="inline-flex bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs">
              <button
                type="button"
                onClick={() => setSelectedCycleNum(1)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  selectedCycleNum === 1
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Cycle 1 (1st – 10th)
              </button>
              <button
                type="button"
                onClick={() => setSelectedCycleNum(2)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  selectedCycleNum === 2
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Cycle 2 (11th – 20th)
              </button>
              <button
                type="button"
                onClick={() => setSelectedCycleNum(3)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  selectedCycleNum === 3
                    ? 'bg-emerald-700 text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Cycle 3 (21st – End)
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-stone-500 bg-stone-50 px-2 py-1 rounded border border-stone-200">
              {cycleSummary.label}
            </span>
          </div>
        </div>

        {/* 10-Day Fat & SNF Averages Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-stone-100">
          {/* Cow Milk Averages */}
          <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200/80">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                Cow Milk (10-Day Avg)
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-bold">
                {milkTypeMetrics.cowLiters} L
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold font-mono text-amber-950">
                {milkTypeMetrics.cowAvgFat}% Fat
              </span>
              <span className="text-stone-400">/</span>
              <span className="text-xl font-bold font-mono text-amber-900">
                {milkTypeMetrics.cowAvgSnf}% SNF
              </span>
            </div>
            <div className="mt-2 text-[11px] text-amber-800 border-t border-amber-200/60 pt-1.5 flex justify-between">
              <span>Fat Mass: {milkTypeMetrics.cowFatKg} kg</span>
              <span>SNF Mass: {milkTypeMetrics.cowSnfKg} kg</span>
            </div>
          </div>

          {/* Buffalo Milk Averages */}
          <div className="bg-stone-100/80 p-4 rounded-xl border border-stone-300">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                Buffalo Milk (10-Day Avg)
              </span>
              <span className="text-[10px] bg-stone-200 text-stone-800 px-1.5 py-0.5 rounded font-mono font-bold">
                {milkTypeMetrics.buffaloLiters} L
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold font-mono text-stone-900">
                {milkTypeMetrics.buffaloAvgFat}% Fat
              </span>
              <span className="text-stone-400">/</span>
              <span className="text-xl font-bold font-mono text-stone-800">
                {milkTypeMetrics.buffaloAvgSnf}% SNF
              </span>
            </div>
            <div className="mt-2 text-[11px] text-stone-600 border-t border-stone-200 pt-1.5 flex justify-between">
              <span>Fat Mass: {milkTypeMetrics.buffaloFatKg} kg</span>
              <span>SNF Mass: {milkTypeMetrics.buffaloSnfKg} kg</span>
            </div>
          </div>

          {/* Combined Weighted Averages */}
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Combined 10-Day Quality
              </span>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-bold">
                {cycleSummary.totalLiters} L
              </span>
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold font-mono text-emerald-950">
                {cycleSummary.avgFat}%
              </span>
              <span className="text-emerald-700 text-xs font-semibold">Fat</span>
              <span className="text-stone-300">|</span>
              <span className="text-2xl font-bold font-mono text-emerald-950">
                {cycleSummary.avgSNF}%
              </span>
              <span className="text-emerald-700 text-xs font-semibold">SNF</span>
            </div>
            <div className="mt-2 text-[11px] text-emerald-800 border-t border-emerald-200 pt-1.5">
              Weighted across {cycleSummary.totalEntries} collections
            </div>
          </div>

          {/* Total Solids Harvested */}
          <div className="bg-white p-4 rounded-xl border border-stone-200">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                Total Solids Harvested
              </span>
              <Sparkles className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-stone-900">
                {milkTypeMetrics.totalFatKg}
              </span>
              <span className="text-xs text-stone-500 font-medium">kg Fat</span>
            </div>
            <div className="mt-2 text-[11px] text-stone-500 border-t border-stone-100 pt-1.5 flex justify-between">
              <span>SNF Mass: {milkTypeMetrics.totalSnfKg} kg</span>
              <span>Total: {(milkTypeMetrics.totalFatKg + milkTypeMetrics.totalSnfKg).toFixed(1)} kg TS</span>
            </div>
          </div>
        </div>
      </div>

      {/* 10-Day Fat & SNF Curves Chart */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-emerald-700" />
              10-Day Fat & SNF Consistency Trajectory
            </h3>
            <p className="text-xs text-stone-500">
              Tracking milk fat and solids-not-fat levels across the 10-day procurement cycle
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dayByDayTrend} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="display" tick={{ fontSize: 11, fill: '#64748b' }} />
              <YAxis
                domain={[3.0, 10.0]}
                tick={{ fontSize: 11, fill: '#64748b' }}
                tickFormatter={(val) => `${val}%`}
              />
              <Tooltip
                formatter={(val: any) => [`${val}%`, '']}
                contentStyle={{ backgroundColor: '#1c1917', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
              <ReferenceLine y={8.5} stroke="#cbd5e1" strokeDasharray="3 3" label={{ value: 'Std SNF (8.5%)', fill: '#94a3b8', fontSize: 10 }} />
              <Line
                type="monotone"
                dataKey="overallFat"
                name="Weighted Avg Fat %"
                stroke="#059669"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="overallSnf"
                name="Weighted Avg SNF %"
                stroke="#2563eb"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="bufFat"
                name="Buffalo Fat %"
                stroke="#7c3aed"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={{ r: 2 }}
              />
              <Line
                type="monotone"
                dataKey="cowFat"
                name="Cow Fat %"
                stroke="#f59e0b"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={{ r: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Two Columns: Quality Watch & Top Farmers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Quality Alerts / Adulteration Watch */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Quality Alerts & Low SNF Watch
              </h3>
              <p className="text-xs text-stone-500">
                Entries below cooperative purity benchmarks (potential dilution or mastitis check)
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
              {qualityAlerts.length} Flagged
            </span>
          </div>

          {qualityAlerts.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-500">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 mx-auto mb-1" />
              <p className="font-semibold text-stone-800">100% Quality Benchmark Achieved</p>
              <p className="text-stone-400 mt-0.5">All 10-day entries meet or exceed standard SNF cutoffs.</p>
            </div>
          ) : (
            <div className="overflow-x-auto max-h-56">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50 text-stone-600 font-semibold border-y border-stone-200">
                    <th className="py-2 px-2">Date</th>
                    <th className="py-2 px-2">Farmer</th>
                    <th className="py-2 px-1">Type</th>
                    <th className="py-2 px-2 text-right">Fat%</th>
                    <th className="py-2 px-2 text-right">SNF%</th>
                    <th className="py-2 px-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700 font-mono">
                  {qualityAlerts.slice(0, 8).map((alert) => (
                    <tr key={alert.id} className="hover:bg-amber-50/40">
                      <td className="py-2 px-2 font-sans font-medium text-stone-800">
                        {alert.date} ({alert.shift})
                      </td>
                      <td className="py-2 px-2 font-sans">
                        #{alert.farmerCode} {alert.farmerName}
                      </td>
                      <td className="py-2 px-1 font-sans text-[10px]">
                        {alert.milkType}
                      </td>
                      <td className="py-2 px-2 text-right text-stone-700">
                        {alert.fat.toFixed(1)}%
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-amber-700">
                        {alert.snf.toFixed(2)}%
                      </td>
                      <td className="py-2 px-2 text-center font-sans">
                        <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">
                          Low SNF
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Top Performing Farmers (10-day Quality & Volume Leaders) */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
            <div>
              <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-700" />
                10-Day Quality Champions
              </h3>
              <p className="text-xs text-stone-500">
                Top suppliers ranked by 10-day weighted Fat & SNF average
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            {topFarmersByFat.map((f, idx) => (
              <div
                key={f.farmerId}
                className="flex items-center justify-between p-2.5 bg-stone-50 rounded-lg border border-stone-100 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      idx === 0
                        ? 'bg-amber-400 text-amber-950 font-bold shadow-2xs'
                        : idx === 1
                        ? 'bg-stone-300 text-stone-900'
                        : idx === 2
                        ? 'bg-amber-700 text-white'
                        : 'bg-stone-200 text-stone-700'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <span className="font-semibold text-stone-900">
                      #{f.farmerCode} {f.farmerName}
                    </span>
                    <span className="text-[10px] text-stone-500 ml-1.5">
                      ({f.milkType} • {f.totalLiters} L)
                    </span>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="font-bold text-emerald-800 text-sm">{f.avgFat}% Fat</span>
                  <span className="text-[10px] text-stone-500 ml-1">/ {f.avgSNF}% SNF</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
