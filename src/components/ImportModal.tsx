import React, { useState, useRef } from 'react';
import { Farmer, RateConfig } from '../types';
import { 
  parseFarmersCSV, 
  parseFarmersJSON, 
  parseRateConfigCSV, 
  parseRateConfigJSON,
  getFarmersSampleCSV,
  getFarmersSampleJSON,
  getRateConfigSampleCSV,
  getRateConfigSampleJSON,
  ParseResult
} from '../utils/dataImportUtils';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  X, 
  Users, 
  Table, 
  FileCode, 
  RefreshCw,
  Layers,
  ArrowRight
} from 'lucide-react';

export type ImportType = 'farmers' | 'ratechart';

interface ImportModalProps {
  isOpen: boolean;
  defaultType?: ImportType;
  currentRateConfig: RateConfig;
  currentFarmersCount: number;
  onClose: () => void;
  onImportFarmers: (farmers: Farmer[], mode: 'merge' | 'replace') => void;
  onImportRateConfig: (config: RateConfig) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  defaultType = 'farmers',
  currentRateConfig,
  currentFarmersCount,
  onClose,
  onImportFarmers,
  onImportRateConfig,
}) => {
  const [activeTab, setActiveTab] = useState<ImportType>(defaultType);
  const [inputMode, setInputMode] = useState<'file' | 'paste'>('file');
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [rawText, setRawText] = useState<string>('');
  const [farmerMergeMode, setFarmerMergeMode] = useState<'merge' | 'replace'>('merge');

  // Parsed states
  const [parsedFarmers, setParsedFarmers] = useState<ParseResult<Farmer[]> | null>(null);
  const [parsedRateConfig, setParsedRateConfig] = useState<ParseResult<RateConfig> | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  // Trigger file parsing based on content
  const handleProcessText = (content: string, nameHint: string = 'pasted-data.txt') => {
    setRawText(content);
    const isJSON = content.trim().startsWith('{') || content.trim().startsWith('[');

    if (activeTab === 'farmers') {
      const res = isJSON ? parseFarmersJSON(content) : parseFarmersCSV(content);
      setParsedFarmers(res);
      setParsedRateConfig(null);
    } else {
      const res = isJSON 
        ? parseRateConfigJSON(content, currentRateConfig) 
        : parseRateConfigCSV(content, currentRateConfig);
      setParsedRateConfig(res);
      setParsedFarmers(null);
    }
  };

  const handleFileSelect = (file: File) => {
    setFileName(file.name);
    setFileSize((file.size / 1024).toFixed(1) + ' KB');

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) {
        handleProcessText(text, file.name);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleDownloadTemplate = (format: 'csv' | 'json') => {
    let content = '';
    let filename = '';

    if (activeTab === 'farmers') {
      content = format === 'csv' ? getFarmersSampleCSV() : getFarmersSampleJSON();
      filename = `dcs_farmers_template.${format}`;
    } else {
      content = format === 'csv' 
        ? getRateConfigSampleCSV(currentRateConfig) 
        : getRateConfigSampleJSON(currentRateConfig);
      filename = `dcs_rate_chart_template.${format}`;
    }

    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
    setFileName('');
    setFileSize('');
    setRawText('');
    setParsedFarmers(null);
    setParsedRateConfig(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCommitImport = () => {
    if (activeTab === 'farmers' && parsedFarmers && parsedFarmers.data.length > 0) {
      onImportFarmers(parsedFarmers.data, farmerMergeMode);
      onClose();
    } else if (activeTab === 'ratechart' && parsedRateConfig && parsedRateConfig.validRows > 0) {
      onImportRateConfig(parsedRateConfig.data);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Import Data Hub
              </h3>
              <p className="text-xs text-stone-500">
                Upload CSV or JSON files to batch-import cooperative data
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs: Farmers vs Rate Chart */}
        <div className="px-6 pt-3 pb-2 border-b border-stone-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="inline-flex bg-stone-100 p-1 rounded-lg border border-stone-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setActiveTab('farmers');
                handleReset();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'farmers'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Farmers Registry</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('ratechart');
                handleReset();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                activeTab === 'ratechart'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Rate Chart & Parameters</span>
            </button>
          </div>

          {/* Template Download Shortcuts */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-stone-400 text-[11px]">Download Template:</span>
            <button
              type="button"
              onClick={() => handleDownloadTemplate('csv')}
              className="inline-flex items-center gap-1 px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded font-medium text-[11px] border border-stone-200 transition-colors"
            >
              <Download className="w-3 h-3 text-emerald-700" />
              <span>Sample CSV</span>
            </button>
            <button
              type="button"
              onClick={() => handleDownloadTemplate('json')}
              className="inline-flex items-center gap-1 px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded font-medium text-[11px] border border-stone-200 transition-colors"
            >
              <FileCode className="w-3 h-3 text-amber-700" />
              <span>Sample JSON</span>
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Method Choice: File Drop vs Paste */}
          <div className="flex items-center justify-between text-xs border-b border-stone-100 pb-2">
            <span className="font-semibold text-stone-700">
              {activeTab === 'farmers'
                ? 'Select or Drop Farmers File (CSV / JSON)'
                : 'Select or Drop Rate Chart File (CSV / JSON)'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setInputMode('file')}
                className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                  inputMode === 'file'
                    ? 'bg-emerald-100 text-emerald-900 font-bold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                File Upload
              </button>
              <span className="text-stone-300">|</span>
              <button
                type="button"
                onClick={() => setInputMode('paste')}
                className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                  inputMode === 'paste'
                    ? 'bg-emerald-100 text-emerald-900 font-bold'
                    : 'text-stone-500 hover:text-stone-800'
                }`}
              >
                Paste Direct Text
              </button>
            </div>
          </div>

          {inputMode === 'file' ? (
            /* Drag and Drop Zone */
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-emerald-600 bg-emerald-50/50 scale-[1.01]'
                  : fileName
                  ? 'border-emerald-300 bg-emerald-50/20'
                  : 'border-stone-300 hover:border-emerald-500 hover:bg-stone-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,.txt"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                {fileName ? (
                  <div>
                    <p className="text-sm font-bold text-stone-900 font-mono">{fileName}</p>
                    <p className="text-xs text-stone-500">{fileSize} • Click or drop another file to replace</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-stone-800">
                      Drag & Drop your {activeTab === 'farmers' ? 'Farmers' : 'Rate Chart'} file here
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Supports standard <strong>.CSV</strong>, <strong>.JSON</strong>, or <strong>.TXT</strong> (Excel exports)
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Paste Raw Content */
            <div className="space-y-2">
              <textarea
                rows={6}
                value={rawText}
                onChange={(e) => handleProcessText(e.target.value)}
                placeholder={
                  activeTab === 'farmers'
                    ? 'Paste CSV or JSON here...\ne.g.\nFarmer Code,Farmer Name,Phone,Village,Milk Type,Bank Account,IFSC\n101,Ramesh Patel,9825102931,Anandpur,Cow,918020038411,SBIN0004921'
                    : 'Paste CSV or JSON here...\ne.g.\ncowBaseRate,36.5\ncowStandardFat,3.5\ncowStandardSNF,8.5\ndcsMarginPerLiter,2.75'
                }
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl font-mono text-xs text-stone-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
              />
              <div className="flex justify-between items-center text-[11px] text-stone-500">
                <span>Copy from Excel, Google Sheets, or WhatsApp text</span>
                {rawText && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-rose-600 hover:text-rose-800 font-medium"
                  >
                    Clear Text
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Validation & Parsing Preview for Farmers */}
          {activeTab === 'farmers' && parsedFarmers && (
            <div className="space-y-4 pt-2 animate-in fade-in duration-150">
              {/* Status Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div className="flex items-center gap-2">
                  {parsedFarmers.data.length > 0 ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">
                      Parsed {parsedFarmers.validRows} valid farmers out of {parsedFarmers.totalRows} rows
                    </span>
                    {parsedFarmers.warnings.length > 0 && (
                      <span className="text-[11px] text-amber-700">
                        {parsedFarmers.warnings.length} warning(s) detected during parse
                      </span>
                    )}
                  </div>
                </div>

                {/* Merge Mode Toggle */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-stone-500 font-medium">Import Mode:</span>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="farmerMergeMode"
                      value="merge"
                      checked={farmerMergeMode === 'merge'}
                      onChange={() => setFarmerMergeMode('merge')}
                      className="text-emerald-700 focus:ring-emerald-500"
                    />
                    <span className="text-stone-700 font-medium">Merge & Update</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer ml-2">
                    <input
                      type="radio"
                      name="farmerMergeMode"
                      value="replace"
                      checked={farmerMergeMode === 'replace'}
                      onChange={() => setFarmerMergeMode('replace')}
                      className="text-rose-700 focus:ring-rose-500"
                    />
                    <span className="text-rose-700 font-medium">Replace All ({currentFarmersCount})</span>
                  </label>
                </div>
              </div>

              {/* Errors if any */}
              {parsedFarmers.errors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                  {parsedFarmers.errors.map((err, i) => (
                    <p key={i} className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{err}</span>
                    </p>
                  ))}
                </div>
              )}

              {/* Table Preview */}
              {parsedFarmers.data.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs text-stone-500">
                    <span className="font-semibold text-stone-800">Preview Parsed Records:</span>
                    <span>Showing first {Math.min(10, parsedFarmers.data.length)} of {parsedFarmers.data.length}</span>
                  </div>
                  <div className="border border-stone-200 rounded-xl overflow-x-auto max-h-48">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-stone-100 text-stone-600 font-sans font-semibold sticky top-0">
                        <tr>
                          <th className="py-2 px-3">Code</th>
                          <th className="py-2 px-3">Farmer Name</th>
                          <th className="py-2 px-2">Variety</th>
                          <th className="py-2 px-3">Village</th>
                          <th className="py-2 px-3">Phone</th>
                          <th className="py-2 px-3">Bank Account</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-stone-700">
                        {parsedFarmers.data.slice(0, 10).map((f, i) => (
                          <tr key={i} className="hover:bg-stone-50">
                            <td className="py-1.5 px-3 font-bold text-stone-900">#{f.code}</td>
                            <td className="py-1.5 px-3 font-sans font-medium text-stone-900">{f.name}</td>
                            <td className="py-1.5 px-2">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                f.defaultMilkType === 'Cow' ? 'bg-amber-100 text-amber-800' : 'bg-stone-200 text-stone-800'
                              }`}>
                                {f.defaultMilkType}
                              </span>
                            </td>
                            <td className="py-1.5 px-3 font-sans text-stone-600">{f.village}</td>
                            <td className="py-1.5 px-3 text-stone-500">{f.phone}</td>
                            <td className="py-1.5 px-3 text-stone-600">{f.bankAccount || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Validation & Parsing Preview for Rate Chart */}
          {activeTab === 'ratechart' && parsedRateConfig && (
            <div className="space-y-4 pt-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 p-3 bg-stone-50 rounded-xl border border-stone-200">
                {parsedRateConfig.validRows > 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                )}
                <div>
                  <span className="text-xs font-bold text-stone-900 block">
                    {parsedRateConfig.validRows > 0
                      ? `Detected and parsed ${parsedRateConfig.validRows} rate configuration parameters`
                      : 'No valid rate parameters detected'}
                  </span>
                  <span className="text-[11px] text-stone-500">
                    Review values below. Values in bold green will update your current active chart.
                  </span>
                </div>
              </div>

              {parsedRateConfig.errors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                  {parsedRateConfig.errors.map((err, i) => (
                    <p key={i} className="flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{err}</span>
                    </p>
                  ))}
                </div>
              )}

              {/* Comparison Grid */}
              {parsedRateConfig.validRows > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {/* Cow Milk Card */}
                  <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
                    <span className="font-bold text-amber-900 text-xs block border-b border-amber-200/60 pb-1">
                      Cow Milk Parameters
                    </span>
                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-stone-600 font-sans">Base Rate:</span>
                        <span className="font-bold text-stone-900">
                          ₹{currentRateConfig.cowBaseRate.toFixed(2)} →{' '}
                          <strong className="text-emerald-700">₹{parsedRateConfig.data.cowBaseRate.toFixed(2)}/L</strong>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600 font-sans">Benchmark Fat / SNF:</span>
                        <span className="font-semibold text-stone-900">
                          {parsedRateConfig.data.cowStandardFat}% / {parsedRateConfig.data.cowStandardSNF}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600 font-sans">Fat Diff (per 0.1%):</span>
                        <span className="font-bold text-emerald-800">
                          +₹{parsedRateConfig.data.cowFatIncRate.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600 font-sans">SNF Diff (per 0.1%):</span>
                        <span className="font-bold text-emerald-800">
                          +₹{parsedRateConfig.data.cowSnfIncRate.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Buffalo Milk Card */}
                  <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
                    <span className="font-bold text-stone-900 text-xs block border-b border-stone-200 pb-1">
                      Buffalo Milk Parameters
                    </span>
                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-stone-600 font-sans">Base Rate:</span>
                        <span className="font-bold text-stone-900">
                          ₹{currentRateConfig.buffaloBaseRate.toFixed(2)} →{' '}
                          <strong className="text-emerald-700">₹{parsedRateConfig.data.buffaloBaseRate.toFixed(2)}/L</strong>
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600 font-sans">Benchmark Fat / SNF:</span>
                        <span className="font-semibold text-stone-900">
                          {parsedRateConfig.data.buffaloStandardFat}% / {parsedRateConfig.data.buffaloStandardSNF}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600 font-sans">Fat Diff (per 0.1%):</span>
                        <span className="font-bold text-emerald-800">
                          +₹{parsedRateConfig.data.buffaloFatIncRate.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-600 font-sans">SNF Diff (per 0.1%):</span>
                        <span className="font-bold text-emerald-800">
                          +₹{parsedRateConfig.data.buffaloSnfIncRate.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Society Margin Card */}
                  <div className="md:col-span-2 p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-emerald-950 block">
                        DCS Society Procurement Margin
                      </span>
                      <span className="text-[11px] text-stone-500">
                        Commission per litre earned from apex chilling plant
                      </span>
                    </div>
                    <div className="font-mono text-sm font-bold text-emerald-900">
                      ₹{parsedRateConfig.data.dcsMarginPerLiter.toFixed(2)} / Litre
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-stone-600 hover:text-stone-900 font-medium transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={
                (activeTab === 'farmers' && (!parsedFarmers || parsedFarmers.data.length === 0)) ||
                (activeTab === 'ratechart' && (!parsedRateConfig || parsedRateConfig.validRows === 0))
              }
              onClick={handleCommitImport}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold transition-all ${
                (activeTab === 'farmers' && parsedFarmers && parsedFarmers.data.length > 0) ||
                (activeTab === 'ratechart' && parsedRateConfig && parsedRateConfig.validRows > 0)
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-xs'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              <span>
                {activeTab === 'farmers'
                  ? `Import ${parsedFarmers ? parsedFarmers.data.length : 0} Farmers`
                  : 'Apply New Rate Chart'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
