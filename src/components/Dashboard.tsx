import React, { useMemo, useState } from 'react';
import { MilkEntry, RateConfig, DailyProfitSummary } from '../types';
import { calculateDailyProfitSummaries } from '../utils/cycleUtils';
import { 
  TrendingUp, 
  Wallet, 
  Milk, 
  ArrowUpRight, 
  Calendar, 
  PieChart as PieIcon, 
  Sun, 
  Moon,
  DollarSign,
  BarChart3,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  AreaChart,
  Area,
  CartesianGrid,
  Line,
  ComposedChart
} from 'recharts';

interface DashboardProps {
  entries: MilkEntry[];
  rateConfig: RateConfig;
  selectedDate: string;
}

export const Dashboard: React.FC<DashboardProps> = ({
  entries,
  rateConfig,
  selectedDate,
}) => {
  const [chartView, setChartView] = useState<'profit' | 'volume' | 'revenue'>('profit');

  // Compute Daily summaries
  const dailySummaries: DailyProfitSummary[] = useMemo(() => {
    return calculateDailyProfitSummaries(entries);
  }, [entries]);

  // Today's summary
  const todaySummary = useMemo(() => {
    return (
      dailySummaries.find((d) => d.date === selectedDate) || {
        date: selectedDate,
        displayDate: 'Today',
        dayOfWeek: '',
        totalLiters: 0,
        morningLiters: 0,
        eveningLiters: 0,
        morningProfit: 0,
        eveningProfit: 0,
        farmerPayout: 0,
        plantRevenue: 0,
        netProfit: 0,
        marginPercent: 0,
        avgFat: 0,
        avgSNF: 0,
        entriesCount: 0,
      }
    );
  }, [dailySummaries, selectedDate]);

  // Cumulative Totals across all days in the dataset
  const cumulativeTotals = useMemo(() => {
    let liters = 0;
    let profit = 0;
    let payout = 0;
    let revenue = 0;
    let morningLiters = 0;
    let eveningLiters = 0;

    dailySummaries.forEach((d) => {
      liters += d.totalLiters;
      profit += d.netProfit;
      payout += d.farmerPayout;
      revenue += d.plantRevenue;
      morningLiters += d.morningLiters;
      eveningLiters += d.eveningLiters;
    });

    const avgDailyProfit = dailySummaries.length > 0 ? profit / dailySummaries.length : 0;
    const profitPerLiter = liters > 0 ? profit / liters : 0;

    return {
      liters: Number(liters.toFixed(1)),
      profit: Number(profit.toFixed(2)),
      payout: Number(payout.toFixed(2)),
      revenue: Number(revenue.toFixed(2)),
      avgDailyProfit: Number(avgDailyProfit.toFixed(2)),
      profitPerLiter: Number(profitPerLiter.toFixed(2)),
      morningLiters: Number(morningLiters.toFixed(1)),
      eveningLiters: Number(eveningLiters.toFixed(1)),
    };
  }, [dailySummaries]);

  return (
    <div className="space-y-6">
      {/* Top Banner & KPI Stat Cards */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-base font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-700" />
              Daily Profit Trends & Financial Performance
            </h2>
            <p className="text-xs text-stone-500">
              Real-time monitoring of DCS collection volume, farmer payout cost, and plant margin
            </p>
          </div>
          <div className="text-xs text-stone-600 bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 self-start">
            <span className="font-semibold text-stone-800">Fixed DCS Margin:</span>
            <span className="font-mono font-bold text-emerald-800">+₹{rateConfig.dcsMarginPerLiter}/Litre</span>
          </div>
        </div>

        {/* 4 Key Performance Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Today's Net Profit */}
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Today's Center Profit
              </span>
              <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                <Wallet className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-emerald-900">
                ₹{todaySummary.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-emerald-700 font-medium flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5" />
                {todaySummary.marginPercent}% margin
              </span>
            </div>
            <div className="mt-2 text-[11px] text-stone-500 flex justify-between border-t border-stone-100 pt-2">
              <span>Morn: ₹{todaySummary.morningProfit.toFixed(0)}</span>
              <span>Eve: ₹{todaySummary.eveningProfit.toFixed(0)}</span>
            </div>
          </div>

          {/* Card 2: Cumulative Period Profit */}
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                10-Day Cycle Profit
              </span>
              <span className="p-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                <DollarSign className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-stone-900">
                ₹{cumulativeTotals.profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-stone-500 flex justify-between border-t border-stone-100 pt-2">
              <span>Avg/Day: ₹{cumulativeTotals.avgDailyProfit.toFixed(0)}</span>
              <span>₹{cumulativeTotals.profitPerLiter}/L avg margin</span>
            </div>
          </div>

          {/* Card 3: Today's Collection Volume */}
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                Today's Milk Intake
              </span>
              <span className="p-1.5 bg-amber-50 text-amber-700 rounded-lg">
                <Milk className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-stone-900">
                {todaySummary.totalLiters}
              </span>
              <span className="text-xs font-medium text-stone-500">Litres</span>
            </div>
            <div className="mt-2 text-[11px] text-stone-500 flex justify-between border-t border-stone-100 pt-2">
              <span className="flex items-center gap-1">
                <Sun className="w-3 h-3 text-amber-500" /> {todaySummary.morningLiters} L
              </span>
              <span className="flex items-center gap-1">
                <Moon className="w-3 h-3 text-indigo-500" /> {todaySummary.eveningLiters} L
              </span>
            </div>
          </div>

          {/* Card 4: Cumulative Revenue vs Cost */}
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                10-Day Plant Dispatch
              </span>
              <span className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                <PieIcon className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono text-indigo-950">
                ₹{cumulativeTotals.revenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="mt-2 text-[11px] text-stone-500 flex justify-between border-t border-stone-100 pt-2">
              <span>Farmer Cost: ₹{cumulativeTotals.payout.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100 mb-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-700" />
              Daily Operational & Profit Trends
            </h3>
            <p className="text-xs text-stone-500">
              Continuous day-by-day procurement analysis across 10-day cycles
            </p>
          </div>

          {/* View Toggles */}
          <div className="inline-flex bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs font-medium self-start">
            <button
              type="button"
              onClick={() => setChartView('profit')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                chartView === 'profit'
                  ? 'bg-white text-emerald-800 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Daily Net Profit (₹)
            </button>
            <button
              type="button"
              onClick={() => setChartView('volume')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                chartView === 'volume'
                  ? 'bg-white text-emerald-800 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Shift Volumes (Ltr)
            </button>
            <button
              type="button"
              onClick={() => setChartView('revenue')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                chartView === 'revenue'
                  ? 'bg-white text-emerald-800 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Plant Revenue vs Cost
            </button>
          </div>
        </div>

        {/* Chart Canvas */}
        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            {chartView === 'profit' ? (
              <ComposedChart data={dailySummaries} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as DailyProfitSummary;
                      return (
                        <div className="bg-stone-900 text-white text-xs p-3 rounded-lg shadow-lg font-mono">
                          <p className="font-bold text-emerald-400 mb-1">
                            {data.displayDate} ({data.dayOfWeek})
                          </p>
                          <p>Total Liters: {data.totalLiters} L</p>
                          <p className="text-emerald-300 font-bold">
                            Net Profit: ₹{data.netProfit.toFixed(2)}
                          </p>
                          <p className="text-stone-400 text-[10px] mt-1">
                            Morning: ₹{data.morningProfit.toFixed(0)} • Evening: ₹{data.eveningProfit.toFixed(0)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar
                  dataKey="morningProfit"
                  name="Morning Shift Profit (₹)"
                  fill="#f59e0b"
                  radius={[4, 4, 0, 0]}
                  stackId="profit"
                />
                <Bar
                  dataKey="eveningProfit"
                  name="Evening Shift Profit (₹)"
                  fill="#4f46e5"
                  radius={[4, 4, 0, 0]}
                  stackId="profit"
                />
                <Line
                  type="monotone"
                  dataKey="netProfit"
                  name="Total Daily Profit (₹)"
                  stroke="#059669"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#059669' }}
                />
              </ComposedChart>
            ) : chartView === 'volume' ? (
              <BarChart data={dailySummaries} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} unit="L" />
                <Tooltip
                  formatter={(val: any) => [`${val} L`, 'Volume']}
                  contentStyle={{ backgroundColor: '#1c1917', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar
                  dataKey="morningLiters"
                  name="Morning Shift (L)"
                  fill="#f59e0b"
                  stackId="volume"
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="eveningLiters"
                  name="Evening Shift (L)"
                  fill="#4f46e5"
                  stackId="volume"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            ) : (
              <AreaChart data={dailySummaries} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="displayDate" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickFormatter={(val) => `₹${val}`}
                />
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Amount']}
                  contentStyle={{ backgroundColor: '#1c1917', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area
                  type="monotone"
                  dataKey="plantRevenue"
                  name="Plant Dispatch Revenue (₹)"
                  stroke="#059669"
                  fill="#d1fae5"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="farmerPayout"
                  name="Farmer Procurement Cost (₹)"
                  stroke="#64748b"
                  fill="#f1f5f9"
                  strokeWidth={2}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Daily Profit Breakdown Table */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              Day-by-Day Financial Breakdown
            </h3>
            <p className="text-xs text-stone-500">
              Shift-wise liters, farmer payout, apex plant revenue, and society net margin
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-stone-50 text-stone-600 font-semibold border-y border-stone-200">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3 text-right">Morning (L)</th>
                <th className="py-2.5 px-3 text-right">Evening (L)</th>
                <th className="py-2.5 px-3 text-right">Total Litres</th>
                <th className="py-2.5 px-3 text-right">Avg Fat / SNF</th>
                <th className="py-2.5 px-3 text-right">Farmer Cost</th>
                <th className="py-2.5 px-3 text-right">Plant Revenue</th>
                <th className="py-2.5 px-3 text-right">Net Profit</th>
                <th className="py-2.5 px-3 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-700">
              {dailySummaries.map((day) => (
                <tr
                  key={day.date}
                  className={`hover:bg-stone-50/80 transition-colors ${
                    day.date === selectedDate ? 'bg-emerald-50/40 font-medium' : ''
                  }`}
                >
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                      <span>{day.displayDate}</span>
                      <span className="text-[10px] text-stone-400 font-mono">({day.dayOfWeek})</span>
                      {day.date === selectedDate && (
                        <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.2 rounded font-mono font-bold">
                          Selected
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-stone-600">
                    {day.morningLiters.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-stone-600">
                    {day.eveningLiters.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-900">
                    {day.totalLiters.toFixed(1)} L
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-stone-700">
                    {day.avgFat}% / {day.avgSNF}%
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-stone-600">
                    ₹{day.farmerPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-stone-900 font-medium">
                    ₹{day.plantRevenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-800">
                    +₹{day.netProfit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-semibold">
                    {day.marginPercent}%
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-stone-100 font-bold text-stone-900 border-t-2 border-stone-300">
                <td className="py-3 px-3">10-Day Period Totals</td>
                <td className="py-3 px-3 text-right font-mono">{cumulativeTotals.morningLiters} L</td>
                <td className="py-3 px-3 text-right font-mono">{cumulativeTotals.eveningLiters} L</td>
                <td className="py-3 px-3 text-right font-mono text-emerald-900">{cumulativeTotals.liters} L</td>
                <td className="py-3 px-3 text-right font-mono">-</td>
                <td className="py-3 px-3 text-right font-mono">
                  ₹{cumulativeTotals.payout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-3 text-right font-mono">
                  ₹{cumulativeTotals.revenue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-800 text-sm">
                  +₹{cumulativeTotals.profit.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </td>
                <td className="py-3 px-3 text-right font-mono text-emerald-700">
                  {cumulativeTotals.revenue > 0
                    ? ((cumulativeTotals.profit / cumulativeTotals.revenue) * 100).toFixed(2)
                    : 0}
                  %
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
