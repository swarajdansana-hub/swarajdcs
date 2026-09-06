import React from 'react';
import { MilkEntry, Farmer } from '../types';
import { Printer, X, CheckCircle, Milk } from 'lucide-react';

interface ReceiptSlipModalProps {
  entry: MilkEntry | null;
  farmer?: Farmer;
  onClose: () => void;
}

export const ReceiptSlipModal: React.FC<ReceiptSlipModalProps> = ({ entry, farmer, onClose }) => {
  if (!entry) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(entry.date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-stone-200 animate-in fade-in zoom-in duration-150">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-stone-100 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-700" />
            <span className="text-sm font-semibold text-stone-800">Milk Collection Receipt</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Slip Body */}
        <div id="thermal-receipt" className="p-6 font-mono text-stone-800 bg-white">
          <div className="text-center pb-3 border-b border-dashed border-stone-300">
            <div className="flex justify-center mb-1">
              <div className="w-7 h-7 rounded-md bg-emerald-700 text-white flex items-center justify-center">
                <Milk className="w-4 h-4" />
              </div>
            </div>
            <h2 className="font-bold text-sm uppercase tracking-wide">Kisan Dairy Co-op Society</h2>
            <p className="text-xs text-stone-500">DCS Unit #402 • Anandpur Center</p>
            <p className="text-[11px] text-stone-400">Registered Milk Procurement Center</p>
          </div>

          <div className="py-3 text-xs space-y-1.5 border-b border-dashed border-stone-300">
            <div className="flex justify-between">
              <span className="text-stone-500">Receipt No:</span>
              <span className="font-semibold text-stone-900">{entry.receiptNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Date & Shift:</span>
              <span className="font-medium">
                {formattedDate} • {entry.shift === 'M' ? 'Morning (M)' : 'Evening (E)'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Farmer Code:</span>
              <span className="font-bold text-stone-900 font-mono">#{entry.farmerCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">Farmer Name:</span>
              <span className="font-semibold text-stone-900">{entry.farmerName}</span>
            </div>
            {farmer?.village && (
              <div className="flex justify-between">
                <span className="text-stone-500">Village:</span>
                <span>{farmer.village}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-stone-500">Milk Variety:</span>
              <span className="font-semibold px-1.5 py-0.5 bg-stone-100 rounded text-[11px]">
                {entry.milkType} Milk
              </span>
            </div>
          </div>

          {/* Quality & Volume Parameters */}
          <div className="py-3 text-xs border-b border-dashed border-stone-300">
            <table className="w-full text-left">
              <thead>
                <tr className="text-stone-500 border-b border-stone-200 pb-1">
                  <th className="font-medium pb-1">Parameter</th>
                  <th className="font-medium text-right pb-1">Reading</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                <tr>
                  <td className="py-1">Quantity (Litres)</td>
                  <td className="py-1 text-right font-bold text-sm text-stone-900">
                    {entry.liters.toFixed(1)} L
                  </td>
                </tr>
                <tr>
                  <td className="py-1">Fat %</td>
                  <td className="py-1 text-right font-semibold">{entry.fat.toFixed(1)}%</td>
                </tr>
                <tr>
                  <td className="py-1">SNF (Solids-Not-Fat) %</td>
                  <td className="py-1 text-right font-semibold">{entry.snf.toFixed(2)}%</td>
                </tr>
                {entry.clr !== undefined && (
                  <tr>
                    <td className="py-1">Lactometer Reading (CLR)</td>
                    <td className="py-1 text-right">{entry.clr}</td>
                  </tr>
                )}
                <tr>
                  <td className="py-1 text-stone-600">Rate / Litre</td>
                  <td className="py-1 text-right font-semibold text-stone-900">
                    ₹{entry.ratePerLiter.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total Payable */}
          <div className="py-3 bg-emerald-50/50 -mx-2 px-4 rounded-lg my-2 border border-emerald-100">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-emerald-800 font-semibold block">
                  Total Payable
                </span>
                <span className="text-[10px] text-stone-500">10-Day Cycle Credit</span>
              </div>
              <span className="text-xl font-bold text-emerald-900">
                ₹{entry.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="text-center pt-2 text-[10px] text-stone-400">
            <p>Thank you for partnering with your Village Dairy Co-op!</p>
            <p className="mt-0.5">Computerized Testing • Fair Quality Pricing</p>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 bg-stone-50 border-t border-stone-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50 transition-colors"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 shadow-xs transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Thermal Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
};
