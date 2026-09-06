import React, { useState, useMemo } from 'react';
import { 
  MilkEntry, 
  Farmer, 
  FarmerCycleSummary, 
  CycleSummary 
} from '../types';
import { calculateCycleSummary } from '../utils/cycleUtils';
import { 
  CalendarRange, 
  Download, 
  Printer, 
  FileText, 
  CheckCircle, 
  Clock, 
  ArrowUpDown, 
  Eye, 
  X, 
  ShieldCheck,
  ChevronRight,
  Filter
} from 'lucide-react';

interface PaymentCycleSummaryProps {
  entries: MilkEntry[];
  farmers: Farmer[];
  onUpdatePaymentStatus: (farmerId: string, status: 'Pending' | 'Approved' | 'Paid') => void;
}

export const PaymentCycleSummary: React.FC<PaymentCycleSummaryProps> = ({
  entries,
  farmers,
  onUpdatePaymentStatus,
}) => {
  // Cycle selection (Cycle 1: 1-10, Cycle 2: 11-20, Cycle 3: 21-End)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(8); // September (0-indexed 8)
  const [selectedCycleNum, setSelectedCycleNum] = useState<1 | 2 | 3>(1);
  const [selectedFarmerForPassbook, setSelectedFarmerForPassbook] = useState<FarmerCycleSummary | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Approved' | 'Paid'>('All');

  // Compute Cycle Summary
  const cycleSummary: CycleSummary = useMemo(() => {
    return calculateCycleSummary(selectedCycleNum, selectedYear, selectedMonth, entries, farmers);
  }, [selectedCycleNum, selectedYear, selectedMonth, entries, farmers]);

  // Filter farmer summaries by status
  const filteredFarmerSummaries = useMemo(() => {
    if (statusFilter === 'All') return cycleSummary.farmerSummaries;
    return cycleSummary.farmerSummaries.filter((f) => f.paymentStatus === statusFilter);
  }, [cycleSummary.farmerSummaries, statusFilter]);

  // Total Net Payable for the cycle
  const totalNetPayable = useMemo(() => {
    return cycleSummary.farmerSummaries.reduce((sum, f) => sum + f.netPayable, 0);
  }, [cycleSummary.farmerSummaries]);

  const totalDeductions = useMemo(() => {
    return cycleSummary.farmerSummaries.reduce((sum, f) => sum + f.totalDeductions, 0);
  }, [cycleSummary.farmerSummaries]);

  // Export CSV for Bank Disbursal
  const handleExportBankCSV = () => {
    const headers = [
      'Farmer Code',
      'Farmer Name',
      'Bank Account',
      'IFSC',
      'Total Litres',
      'Avg Fat %',
      'Avg SNF %',
      'Gross Amount (INR)',
      'Deductions (INR)',
      'Net Payable (INR)',
      'Status'
    ];

    const rows = cycleSummary.farmerSummaries.map((f) => {
      const farmerObj = farmers.find((item) => item.id === f.farmerId);
      return [
        f.farmerCode,
        `"${f.farmerName}"`,
        farmerObj?.bankAccount || 'N/A',
        farmerObj?.ifsc || 'N/A',
        f.totalLiters,
        f.avgFat,
        f.avgSNF,
        f.grossAmount,
        f.totalDeductions,
        f.netPayable,
        f.paymentStatus
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DCS-Bank-Payment-${cycleSummary.cycleId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintSheet = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Cycle Selector & Actions Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div>
            <div className="flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-emerald-700" />
              <h2 className="text-base font-bold text-stone-900 tracking-tight">
                10-Day Payment Cycle Summaries & Settlements
              </h2>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Standard 10-day payment roster, feed deductions, weighted rates, and bank disbursement
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportBankCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Bank Payout CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePrintSheet}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 text-stone-700 hover:bg-stone-200 border border-stone-300 rounded-lg text-xs font-medium transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print 10-Day Bill Sheet</span>
            </button>
          </div>
        </div>

        {/* Cycle Choosers */}
        <div className="pt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-stone-600">Select Cycle:</span>
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
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-stone-800 font-medium"
            >
              <option value={7}>August 2026</option>
              <option value={8}>September 2026</option>
              <option value={9}>October 2026</option>
            </select>
          </div>
        </div>

        {/* 10-Day Cycle KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4 pt-4 border-t border-stone-100">
          <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
            <span className="text-[10px] uppercase font-semibold text-stone-500 block">
              Cycle Intake
            </span>
            <span className="text-lg font-bold font-mono text-stone-900">
              {cycleSummary.totalLiters} L
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5">
              {cycleSummary.totalEntries} collections
            </span>
          </div>

          <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
            <span className="text-[10px] uppercase font-semibold text-stone-500 block">
              10-Day Avg Fat
            </span>
            <span className="text-lg font-bold font-mono text-emerald-800">
              {cycleSummary.avgFat}%
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5">Weighted avg</span>
          </div>

          <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
            <span className="text-[10px] uppercase font-semibold text-stone-500 block">
              10-Day Avg SNF
            </span>
            <span className="text-lg font-bold font-mono text-emerald-800">
              {cycleSummary.avgSNF}%
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5">Weighted avg</span>
          </div>

          <div className="bg-stone-50 p-2.5 rounded-lg border border-stone-100">
            <span className="text-[10px] uppercase font-semibold text-stone-500 block">
              Gross Farmer Amount
            </span>
            <span className="text-lg font-bold font-mono text-stone-900">
              ₹{cycleSummary.farmerPayout.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] text-stone-400 block mt-0.5">Before deductions</span>
          </div>

          <div className="bg-amber-50/70 p-2.5 rounded-lg border border-amber-200">
            <span className="text-[10px] uppercase font-semibold text-amber-900 block">
              Feed/Store Deductions
            </span>
            <span className="text-lg font-bold font-mono text-amber-900">
              -₹{totalDeductions.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-amber-700 block mt-0.5">Cattle feed & loans</span>
          </div>

          <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
            <span className="text-[10px] uppercase font-semibold text-emerald-900 block">
              Net Disbursal Payable
            </span>
            <span className="text-lg font-bold font-mono text-emerald-900">
              ₹{totalNetPayable.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[10px] text-emerald-700 block mt-0.5">
              {cycleSummary.farmerSummaries.length} Farmers
            </span>
          </div>
        </div>
      </div>

      {/* Farmer Summary Table */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100 mb-4">
          <div>
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-700" />
              Farmer 10-Day Settlement Register ({cycleSummary.label})
            </h3>
            <p className="text-xs text-stone-500">
              Click "View Passbook" on any farmer to inspect every single morning and evening shift entry
            </p>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-stone-400" />
            <span className="text-stone-500">Filter:</span>
            {(['All', 'Pending', 'Approved', 'Paid'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  statusFilter === status
                    ? 'bg-stone-800 text-white'
                    : 'text-stone-600 hover:bg-stone-100'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          {filteredFarmerSummaries.length === 0 ? (
            <div className="text-center py-10 text-stone-400 text-xs">
              No records found for this cycle or status filter.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-stone-50 text-stone-600 font-semibold border-y border-stone-200">
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Farmer Name</th>
                  <th className="py-2.5 px-2">Type</th>
                  <th className="py-2.5 px-2 text-center">Shifts</th>
                  <th className="py-2.5 px-2 text-right">Total Liters</th>
                  <th className="py-2.5 px-2 text-right">Avg Fat%</th>
                  <th className="py-2.5 px-2 text-right">Avg SNF%</th>
                  <th className="py-2.5 px-2 text-right">Avg Rate/L</th>
                  <th className="py-2.5 px-3 text-right">Gross (₹)</th>
                  <th className="py-2.5 px-2 text-right">Deductions</th>
                  <th className="py-2.5 px-3 text-right">Net Payable (₹)</th>
                  <th className="py-2.5 px-2 text-center">Status</th>
                  <th className="py-2.5 px-3 text-center">Passbook</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {filteredFarmerSummaries.map((f) => (
                  <tr key={f.farmerId} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-stone-900">
                      #{f.farmerCode}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-stone-900">
                      {f.farmerName}
                    </td>
                    <td className="py-2.5 px-2">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          f.milkType === 'Cow'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-stone-200 text-stone-800'
                        }`}
                      >
                        {f.milkType}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-center font-mono text-stone-600">
                      <span className="font-semibold text-stone-800">{f.shiftsCount}</span>/20
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-bold text-stone-900">
                      {f.totalLiters.toFixed(1)} L
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-medium text-emerald-800">
                      {f.avgFat.toFixed(1)}%
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono font-medium text-emerald-800">
                      {f.avgSNF.toFixed(2)}%
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-stone-600">
                      ₹{f.avgRate.toFixed(2)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-stone-900">
                      ₹{f.grossAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-2 text-right font-mono text-amber-800 font-medium">
                      {f.totalDeductions > 0 ? `-₹${f.totalDeductions}` : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-900 text-sm">
                      ₹{f.netPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          const nextStatus =
                            f.paymentStatus === 'Pending'
                              ? 'Approved'
                              : f.paymentStatus === 'Approved'
                              ? 'Paid'
                              : 'Pending';
                          onUpdatePaymentStatus(f.farmerId, nextStatus);
                        }}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                          f.paymentStatus === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : f.paymentStatus === 'Approved'
                            ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-stone-100 text-stone-600 border-stone-300 hover:bg-stone-200'
                        }`}
                        title="Click to advance status"
                      >
                        {f.paymentStatus}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedFarmerForPassbook(f)}
                        className="text-xs text-emerald-700 hover:text-emerald-900 font-medium hover:underline flex items-center justify-center gap-1 mx-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Passbook</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 10-Day Farmer Passbook Statement Modal */}
      {selectedFarmerForPassbook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-stone-200 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-stone-100 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <div>
                  <h3 className="text-sm font-bold text-stone-900">
                    10-Day Member Passbook: #{selectedFarmerForPassbook.farmerCode} {selectedFarmerForPassbook.farmerName}
                  </h3>
                  <p className="text-[11px] text-stone-500">{cycleSummary.label}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFarmerForPassbook(null)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Shift Entries Table */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Summary Cards */}
              <div className="grid grid-cols-4 gap-2 bg-stone-50 p-3 rounded-lg border border-stone-200 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-stone-500 block">Total Liters</span>
                  <span className="font-bold text-stone-900">
                    {selectedFarmerForPassbook.totalLiters} L
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Avg Fat / SNF</span>
                  <span className="font-bold text-emerald-800">
                    {selectedFarmerForPassbook.avgFat}% / {selectedFarmerForPassbook.avgSNF}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Gross Amount</span>
                  <span className="font-bold text-stone-900">
                    ₹{selectedFarmerForPassbook.grossAmount.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 block">Net Payable</span>
                  <span className="font-bold text-emerald-900">
                    ₹{selectedFarmerForPassbook.netPayable.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Deductions Breakdown if any */}
              {selectedFarmerForPassbook.totalDeductions > 0 && (
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs">
                  <div className="font-semibold text-amber-900 mb-1">Cycle Deductions Applied:</div>
                  <div className="grid grid-cols-3 gap-2 text-stone-700">
                    <span>Cattle Feed: ₹{selectedFarmerForPassbook.deductions.cattleFeed}</span>
                    <span>Veterinary / Med: ₹{selectedFarmerForPassbook.deductions.veterinary}</span>
                    <span>Advance Loan: ₹{selectedFarmerForPassbook.deductions.advanceLoan}</span>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto border border-stone-200 rounded-lg">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-stone-100 text-stone-600 font-semibold">
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-2">Shift</th>
                      <th className="py-2 px-2 text-right">Liters</th>
                      <th className="py-2 px-2 text-right">Fat %</th>
                      <th className="py-2 px-2 text-right">SNF %</th>
                      <th className="py-2 px-2 text-right">Rate/L</th>
                      <th className="py-2 px-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 font-mono text-stone-700">
                    {selectedFarmerForPassbook.entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-stone-50">
                        <td className="py-2 px-3 text-stone-900 font-sans font-medium">
                          {entry.date}
                        </td>
                        <td className="py-2 px-2">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold ${
                              entry.shift === 'M'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {entry.shift === 'M' ? 'Morning' : 'Evening'}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right font-bold text-stone-900">
                          {entry.liters.toFixed(1)}
                        </td>
                        <td className="py-2 px-2 text-right text-emerald-800">
                          {entry.fat.toFixed(1)}%
                        </td>
                        <td className="py-2 px-2 text-right text-emerald-800">
                          {entry.snf.toFixed(2)}%
                        </td>
                        <td className="py-2 px-2 text-right text-stone-600">
                          ₹{entry.ratePerLiter.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-900">
                          ₹{entry.totalAmount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-5 py-3 bg-stone-50 border-t border-stone-200">
              <span className="text-xs text-stone-500">
                Payment Status:{' '}
                <strong className="text-stone-800">{selectedFarmerForPassbook.paymentStatus}</strong>
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedFarmerForPassbook(null)}
                  className="px-3 py-1.5 text-xs text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Passbook</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
