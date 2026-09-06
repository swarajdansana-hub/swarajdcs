import React, { useState } from 'react';
import { Farmer, RateConfig, MilkType } from '../types';
import { calculateFarmerRate } from '../utils/rateCalculator';
import { 
  Users, 
  Settings as SettingsIcon, 
  Plus, 
  Check, 
  Grid, 
  Phone, 
  Building, 
  CreditCard,
  Percent,
  Upload,
  Download
} from 'lucide-react';

interface SettingsManagerProps {
  farmers: Farmer[];
  rateConfig: RateConfig;
  onUpdateRateConfig: (config: RateConfig) => void;
  onAddFarmer: (farmer: Farmer) => void;
  onOpenImportModal?: (type: 'farmers' | 'ratechart') => void;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({
  farmers,
  rateConfig,
  onUpdateRateConfig,
  onAddFarmer,
  onOpenImportModal,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'ratechart' | 'farmers'>('ratechart');
  
  // Rate config form state
  const [config, setConfig] = useState<RateConfig>(rateConfig);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // New Farmer form state
  const [showAddFarmer, setShowAddFarmer] = useState<boolean>(false);
  const [newCode, setNewCode] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newVillage, setNewVillage] = useState<string>('Anandpur');
  const [newMilkType, setNewMilkType] = useState<MilkType>('Cow');
  const [newBankAccount, setNewBankAccount] = useState<string>('');
  const [newIfsc, setNewIfsc] = useState<string>('');

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateRateConfig(config);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleCreateFarmer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      alert('Farmer Code and Name are required.');
      return;
    }

    const created: Farmer = {
      id: `f-${newCode.trim()}`,
      code: newCode.trim(),
      name: newName.trim(),
      phone: newPhone.trim() || 'N/A',
      village: newVillage.trim() || 'General',
      defaultMilkType: newMilkType,
      bankAccount: newBankAccount.trim() || undefined,
      ifsc: newIfsc.trim() || undefined,
      isActive: true,
    };

    onAddFarmer(created);
    setShowAddFarmer(false);
    setNewCode('');
    setNewName('');
    setNewPhone('');
    setNewBankAccount('');
    setNewIfsc('');
  };

  const handleExportFarmersCSV = () => {
    const headers = ['Farmer Code,Farmer Name,Phone,Village,Milk Type,Bank Account,IFSC Code'];
    const rows = farmers.map((f) =>
      [
        f.code,
        `"${f.name}"`,
        f.phone,
        `"${f.village}"`,
        f.defaultMilkType,
        f.bankAccount || '',
        f.ifsc || '',
      ].join(',')
    );
    const csv = headers.concat(rows).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DCS-Farmers-Registry-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Generate Sample Rate Matrix Grid for Quick Display
  const cowFatSteps = [3.2, 3.5, 3.8, 4.2, 4.5];
  const cowSnfSteps = [8.2, 8.5, 8.8, 9.0];

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div>
            <h2 className="text-base font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <SettingsIcon className="w-5 h-5 text-emerald-700" />
              Rate Chart Configuration & Farmer Registry
            </h2>
            <p className="text-xs text-stone-500">
              Configure Fat/SNF milk pricing formulas, society commission margins, and member farmers
            </p>
          </div>

          <div className="inline-flex bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs font-medium self-start">
            <button
              type="button"
              onClick={() => setActiveSubTab('ratechart')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeSubTab === 'ratechart'
                  ? 'bg-white text-emerald-800 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Rate Chart & Margin Formula
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('farmers')}
              className={`px-3 py-1.5 rounded-md transition-all ${
                activeSubTab === 'farmers'
                  ? 'bg-white text-emerald-800 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Farmer Members ({farmers.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Rate Chart Formula */}
        {activeSubTab === 'ratechart' && (
          <div className="pt-4 space-y-6">
            <form onSubmit={handleSaveConfig} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cow Milk Pricing */}
                <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-amber-200/60 pb-2">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                      Cow Milk Rate Parameters
                    </span>
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono font-semibold">
                      Benchmark: 3.5% Fat / 8.5% SNF
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Base Rate (₹ / Litre)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={config.cowBaseRate}
                        onChange={(e) =>
                          setConfig({ ...config, cowBaseRate: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Fat Rate Diff (per 0.1%)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        value={config.cowFatIncRate}
                        onChange={(e) =>
                          setConfig({ ...config, cowFatIncRate: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        SNF Rate Diff (per 0.1%)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        value={config.cowSnfIncRate}
                        onChange={(e) =>
                          setConfig({ ...config, cowSnfIncRate: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Buffalo Milk Pricing */}
                <div className="p-4 bg-stone-50 rounded-xl border border-stone-300 space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                    <span className="text-xs font-bold text-stone-900 uppercase tracking-wider">
                      Buffalo Milk Rate Parameters
                    </span>
                    <span className="text-[10px] bg-stone-200 text-stone-800 px-2 py-0.5 rounded font-mono font-semibold">
                      Benchmark: 6.5% Fat / 9.0% SNF
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Base Rate (₹ / Litre)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        value={config.buffaloBaseRate}
                        onChange={(e) =>
                          setConfig({ ...config, buffaloBaseRate: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Fat Rate Diff (per 0.1%)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        value={config.buffaloFatIncRate}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            buffaloFatIncRate: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        SNF Rate Diff (per 0.1%)
                      </label>
                      <input
                        type="number"
                        step="0.05"
                        value={config.buffaloSnfIncRate}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            buffaloSnfIncRate: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* DCS Center Margin / Commission Setting */}
              <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-emerald-800" />
                    <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                      DCS Society Procurement Margin / Handling Commission
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-0.5">
                    Margin paid by Apex Chilling Plant over farmer procurement cost. Powers DCS daily profit.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="number"
                      step="0.25"
                      min="0.5"
                      max="10.0"
                      value={config.dcsMarginPerLiter}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          dcsMarginPerLiter: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-28 p-2 bg-white border border-emerald-300 rounded-lg font-mono font-bold text-sm text-right pr-6 focus:ring-2 focus:ring-emerald-500"
                    />
                    <span className="absolute right-2.5 top-2.5 text-xs text-stone-400 font-mono">₹</span>
                  </div>
                  <span className="text-xs font-semibold text-emerald-900">/ Litre</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <div>
                  {onOpenImportModal && (
                    <button
                      type="button"
                      onClick={() => onOpenImportModal('ratechart')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-300 rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Import Rate Chart (CSV / JSON)</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {saveSuccess && (
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1 animate-in fade-in">
                      <Check className="w-4 h-4" />
                      Rate Chart Updated Successfully!
                    </span>
                  )}
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg text-xs shadow-xs transition-colors"
                  >
                    Save & Apply Rate Settings
                  </button>
                </div>
              </div>
            </form>

            {/* Matrix Reference Grid Preview */}
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
              <div className="flex items-center gap-2 mb-3">
                <Grid className="w-4 h-4 text-stone-600" />
                <h3 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Live Rate Matrix Sample (Cow Milk Fat vs SNF)
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono text-center">
                  <thead>
                    <tr className="bg-stone-200 text-stone-700">
                      <th className="p-2 text-left font-sans">Fat \ SNF</th>
                      {cowSnfSteps.map((snf) => (
                        <th key={snf} className="p-2 font-bold">{snf}% SNF</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {cowFatSteps.map((fat) => (
                      <tr key={fat} className="hover:bg-stone-100">
                        <td className="p-2 text-left font-bold font-sans bg-stone-100 text-stone-800">
                          {fat}% Fat
                        </td>
                        {cowSnfSteps.map((snf) => {
                          const rate = calculateFarmerRate('Cow', fat, snf, config);
                          return (
                            <td
                              key={snf}
                              className={`p-2 font-semibold ${
                                fat === 3.5 && snf === 8.5
                                  ? 'bg-amber-100 text-amber-900 font-bold'
                                  : 'text-stone-700'
                              }`}
                            >
                              ₹{rate.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Farmers Directory */}
        {activeSubTab === 'farmers' && (
          <div className="pt-4 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <p className="text-xs text-stone-500">
                Registered cooperative society milk suppliers ({farmers.length} active members)
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleExportFarmersCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 text-stone-700 border border-stone-300 rounded-lg text-xs font-semibold hover:bg-stone-200 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-stone-600" />
                  <span>Export CSV</span>
                </button>
                {onOpenImportModal && (
                  <button
                    type="button"
                    onClick={() => onOpenImportModal('farmers')}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Import Farmers (CSV/JSON)</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowAddFarmer(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 shadow-xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Member Farmer</span>
                </button>
              </div>
            </div>

            {/* Add Farmer Modal */}
            {showAddFarmer && (
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 animate-in fade-in duration-150">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider">
                    Register New Member Farmer
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowAddFarmer(false)}
                    className="text-stone-400 hover:text-stone-700 text-xs"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleCreateFarmer} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Farmer Code <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 109"
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value)}
                        required
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Anand Kulkarni"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        required
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Primary Milk Variety
                      </label>
                      <select
                        value={newMilkType}
                        onChange={(e) => setNewMilkType(e.target.value as MilkType)}
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg font-medium"
                      >
                        <option value="Cow">Cow Milk</option>
                        <option value="Buffalo">Buffalo Milk</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Village
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Anandpur"
                        value={newVillage}
                        onChange={(e) => setNewVillage(e.target.value)}
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        Bank Account
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 918020038411"
                        value={newBankAccount}
                        onChange={(e) => setNewBankAccount(e.target.value)}
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                        IFSC Code
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. SBIN0004921"
                        value={newIfsc}
                        onChange={(e) => setNewIfsc(e.target.value)}
                        className="w-full p-2 bg-white border border-stone-300 rounded-lg font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddFarmer(false)}
                      className="px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-medium text-stone-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800"
                    >
                      Save Member
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Farmers Table */}
            <div className="overflow-x-auto border border-stone-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200">
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Farmer Name</th>
                    <th className="py-2.5 px-3">Village</th>
                    <th className="py-2.5 px-2">Default Variety</th>
                    <th className="py-2.5 px-3">Phone</th>
                    <th className="py-2.5 px-3">Bank Account</th>
                    <th className="py-2.5 px-2">IFSC</th>
                    <th className="py-2.5 px-2 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-stone-700">
                  {farmers.map((f) => (
                    <tr key={f.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-stone-900">
                        #{f.code}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-stone-900">{f.name}</td>
                      <td className="py-2.5 px-3 text-stone-600">{f.village}</td>
                      <td className="py-2.5 px-2">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            f.defaultMilkType === 'Cow'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-200 text-stone-800'
                          }`}
                        >
                          {f.defaultMilkType}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-stone-500">{f.phone}</td>
                      <td className="py-2.5 px-3 font-mono text-stone-600">{f.bankAccount || '-'}</td>
                      <td className="py-2.5 px-2 font-mono text-stone-600">{f.ifsc || '-'}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
