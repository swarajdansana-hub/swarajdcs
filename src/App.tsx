/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { MilkEntry, Farmer, RateConfig, ShiftType } from './types';
import { INITIAL_FARMERS, generateInitialEntries } from './data/initialData';
import { DEFAULT_RATE_CONFIG } from './utils/rateCalculator';
import { Header } from './components/Header';
import { DailyEntry } from './components/DailyEntry';
import { Dashboard } from './components/Dashboard';
import { PaymentCycleSummary } from './components/PaymentCycleSummary';
import { TenDayReports } from './components/TenDayReports';
import { SettingsManager } from './components/SettingsManager';
import { RateChartMatrix } from './components/RateChartMatrix';
import { ReceiptSlipModal } from './components/ReceiptSlipModal';
import { ImportModal, ImportType } from './components/ImportModal';
import { CheckCircle2, X } from 'lucide-react';

const STORAGE_KEYS = {
  ENTRIES: 'dcs_milk_entries_v1',
  FARMERS: 'dcs_farmers_v1',
  CONFIG: 'dcs_rate_config_v1',
};

export default function App() {
  // Navigation tab
  const [activeTab, setActiveTab] = useState<'entry' | 'dashboard' | 'cycle' | 'reports' | 'ratechart' | 'settings'>('entry');
  
  // Date & Shift Context (Default to Sep 5, 2026 - aligned with initial dataset and runtime)
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-05');
  const [activeShift, setActiveShift] = useState<ShiftType>('M');

  // Receipt Modal
  const [receiptEntry, setReceiptEntry] = useState<MilkEntry | null>(null);

  // Import Modal State & Toast Notifications
  const [importModalOpen, setImportModalOpen] = useState<boolean>(false);
  const [importModalType, setImportModalType] = useState<ImportType>('farmers');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Core Data States with LocalStorage Persistence
  const [entries, setEntries] = useState<MilkEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ENTRIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load saved entries', e);
    }
    return generateInitialEntries();
  });

  const [farmers, setFarmers] = useState<Farmer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.FARMERS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load saved farmers', e);
    }
    return INITIAL_FARMERS;
  });

  const [rateConfig, setRateConfig] = useState<RateConfig>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load saved rate config', e);
    }
    return DEFAULT_RATE_CONFIG;
  });

  // Sync to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
    } catch (e) {
      console.error('Failed to persist entries', e);
    }
  }, [entries]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.FARMERS, JSON.stringify(farmers));
    } catch (e) {
      console.error('Failed to persist farmers', e);
    }
  }, [farmers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(rateConfig));
    } catch (e) {
      console.error('Failed to persist config', e);
    }
  }, [rateConfig]);

  // Actions
  const handleAddEntry = (entry: MilkEntry) => {
    setEntries((prev) => [entry, ...prev]);
  };

  const handleDeleteEntry = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleUpdatePaymentStatus = (
    farmerId: string,
    status: 'Pending' | 'Approved' | 'Paid'
  ) => {
    // In our system, we can update or record farmer status
    console.log(`Updated status for farmer ${farmerId} to ${status}`);
  };

  const handleUpdateRateConfig = (newConfig: RateConfig) => {
    setRateConfig(newConfig);
  };

  const handleAddFarmer = (farmer: Farmer) => {
    setFarmers((prev) => [...prev, farmer]);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleOpenImport = (type: ImportType = 'farmers') => {
    setImportModalType(type);
    setImportModalOpen(true);
  };

  const handleImportFarmers = (imported: Farmer[], mode: 'merge' | 'replace') => {
    if (mode === 'replace') {
      setFarmers(imported);
      showToast(`Registry replaced with ${imported.length} farmers.`);
    } else {
      setFarmers((prev) => {
        const importedMap = new Map(imported.map((f) => [f.code, f]));
        const updatedPrev = prev.map((f) => importedMap.get(f.code) || f);
        const existingCodes = new Set(prev.map((f) => f.code));
        const newFarmers = imported.filter((f) => !existingCodes.has(f.code));
        return [...updatedPrev, ...newFarmers];
      });
      showToast(`Successfully merged ${imported.length} farmers into the registry.`);
    }
  };

  const handleImportRateConfig = (newConfig: RateConfig) => {
    setRateConfig(newConfig);
    showToast('Milk Rate Chart parameters updated successfully.');
  };

  const handleResetData = () => {
    if (confirm('Reset to standard 10-day realistic sample data? Any new custom entries will be reset.')) {
      const freshEntries = generateInitialEntries();
      setEntries(freshEntries);
      setFarmers(INITIAL_FARMERS);
      setRateConfig(DEFAULT_RATE_CONFIG);
      localStorage.removeItem(STORAGE_KEYS.ENTRIES);
      localStorage.removeItem(STORAGE_KEYS.FARMERS);
      localStorage.removeItem(STORAGE_KEYS.CONFIG);
      setSelectedDate('2026-09-05');
      setActiveShift('M');
    }
  };

  const selectedFarmerForReceipt = receiptEntry
    ? farmers.find((f) => f.id === receiptEntry.farmerId)
    : undefined;

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeShift={activeShift}
        setActiveShift={setActiveShift}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        onResetData={handleResetData}
        onOpenImport={() => handleOpenImport('farmers')}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'entry' && (
          <DailyEntry
            entries={entries}
            farmers={farmers}
            rateConfig={rateConfig}
            activeShift={activeShift}
            setActiveShift={setActiveShift}
            selectedDate={selectedDate}
            onAddEntry={handleAddEntry}
            onDeleteEntry={handleDeleteEntry}
            onViewReceipt={(entry) => setReceiptEntry(entry)}
            onOpenRateChart={() => setActiveTab('ratechart')}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard
            entries={entries}
            rateConfig={rateConfig}
            selectedDate={selectedDate}
          />
        )}

        {activeTab === 'cycle' && (
          <PaymentCycleSummary
            entries={entries}
            farmers={farmers}
            onUpdatePaymentStatus={handleUpdatePaymentStatus}
          />
        )}

        {activeTab === 'reports' && (
          <TenDayReports
            entries={entries}
            farmers={farmers}
          />
        )}

        {activeTab === 'ratechart' && (
          <RateChartMatrix
            rateConfig={rateConfig}
            onUpdateRateConfig={handleUpdateRateConfig}
            onOpenImportModal={handleOpenImport}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsManager
            farmers={farmers}
            rateConfig={rateConfig}
            onUpdateRateConfig={handleUpdateRateConfig}
            onAddFarmer={handleAddFarmer}
            onOpenImportModal={handleOpenImport}
          />
        )}
      </main>

      {/* Thermal Receipt Slip Modal */}
      <ReceiptSlipModal
        entry={receiptEntry}
        farmer={selectedFarmerForReceipt}
        onClose={() => setReceiptEntry(null)}
      />

      {/* Data Import Modal */}
      <ImportModal
        isOpen={importModalOpen}
        defaultType={importModalType}
        currentRateConfig={rateConfig}
        currentFarmersCount={farmers.length}
        onClose={() => setImportModalOpen(false)}
        onImportFarmers={handleImportFarmers}
        onImportRateConfig={handleImportRateConfig}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-medium border border-stone-700 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-stone-400 hover:text-white ml-2"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Subtle Footer */}
      <footer className="bg-white border-t border-stone-200 py-3 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>
            DCS Milk Procurement & Accounting • Anandpur Center #402
          </span>
          <span className="font-mono text-stone-400">
            Current Rate Model: ISI Benchmark Matrix • DCS Margin +₹{rateConfig.dcsMarginPerLiter}/L
          </span>
        </div>
      </footer>
    </div>
  );
}
