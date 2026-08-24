import React, { useState } from 'react';
import { 
  ChevronRight, FileSpreadsheet, Save, RotateCcw, ArrowLeft, CheckCircle2, Calculator,
  FlaskConical, Activity, AlertTriangle, ShieldCheck
} from 'lucide-react';
import { Experiment } from '../types';

interface DFSIPageProps {
  experiment: Experiment;
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export type SeverityType = 'Low' | 'Medium' | 'High' | 'Very High';

export const getSeverity = (dfsi: number): SeverityType => {
  if (dfsi < 50) return 'Low';
  if (dfsi >= 50 && dfsi <= 100) return 'Medium';
  if (dfsi > 100 && dfsi <= 200) return 'High';
  return 'Very High';
};

export const getSeverityBadgeStyle = (severity: SeverityType) => {
  switch (severity) {
    case 'Low':
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/80',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500'
      };
    case 'Medium':
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/80',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500'
      };
    case 'High':
      return {
        bg: 'bg-orange-50 dark:bg-orange-950/80',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-200 dark:border-orange-800',
        dot: 'bg-orange-500'
      };
    case 'Very High':
      return {
        bg: 'bg-red-50 dark:bg-red-950/80',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-200 dark:border-red-800',
        dot: 'bg-red-500'
      };
  }
};

export const DFSIPage: React.FC<DFSIPageProps> = ({ experiment, onBack, onShowToast }) => {
  // Test Information & Observation State (Single Sample Entry per Python workflow)
  const [sno, setSno] = useState<number>(1);
  const [sampleNo, setSampleNo] = useState<string>('SMP-2026-DFS01');
  const [volumeWater, setVolumeWater] = useState<number>(18.5);
  const [volumeKerosene, setVolumeKerosene] = useState<number>(10.0);

  // Automatic DFSI & Severity Calculations matching Python logic
  const dfsi = volumeKerosene > 0 ? ((volumeWater - volumeKerosene) / volumeKerosene) * 100 : 0;
  const severity = getSeverity(dfsi);
  const badgeStyle = getSeverityBadgeStyle(severity);

  const handleReset = () => {
    setSno(1);
    setSampleNo('SMP-2026-DFS01');
    setVolumeWater(18.5);
    setVolumeKerosene(10.0);
    onShowToast('Reset to initial DFSI test inputs.');
  };

  // Export Excel matching exact 7 Python pandas columns
  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    // 7 EXACT COLUMNS FROM PYTHON CODE
    csvContent += "Date & Time,S.No,Sample No,Volume in Water (mL),Volume in Kerosene (mL),Differential Free Swell Index (%),Degree of Severity\n";

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    csvContent += `${timestamp},${sno},${sampleNo},${volumeWater.toFixed(2)},${volumeKerosene.toFixed(2)},${dfsi.toFixed(2)},${severity}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Differential_Free_Swell_Index_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast("Exported to Differential_Free_Swell_Index_Results.csv matching Python pandas format!");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* BREADCRUMB & HEADER */}
      <div className="flex flex-col gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <button onClick={onBack} className="hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-purple-600 dark:text-purple-400">Differential Free Swell Index</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span>[06]</span>
              <span>Differential Free Swell Index Test</span>
              <span className="text-xs font-semibold bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>IS 2720 Part 40 / ASTM D4546</span>
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Determine the Differential Free Swell Index of soil by comparing the equilibrium volume in distilled water and kerosene.
            </p>
          </div>

          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      {/* 1. TEST INFORMATION CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <FlaskConical className="w-4 h-4 text-purple-600" />
          Test Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Sample Number
            </label>
            <input
              type="text"
              value={sampleNo}
              onChange={(e) => setSampleNo(e.target.value)}
              placeholder="SMP-2026-DFS01"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-purple-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Serial No. (S.No)
            </label>
            <input
              type="number"
              min="1"
              value={sno}
              onChange={(e) => setSno(parseInt(e.target.value) || 1)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-purple-600 outline-none focus:border-purple-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Test Date & Time [Auto]
            </label>
            <input
              type="text"
              readOnly
              value={new Date().toLocaleString()}
              className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-500 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* 2. OBSERVATION ENTRY FORM (SINGLE SAMPLE WORKFLOW MATCHING PYTHON CODE) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Activity className="w-4 h-4 text-purple-600" />
          Observation Entry (Equilibrium Cylinder Volumes)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* VOLUME IN DISTILLED WATER */}
          <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-xl space-y-2">
            <label className="text-xs font-bold text-blue-900 dark:text-blue-300 block">
              Volume of Soil in Distilled Water (mL)
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Final equilibrium soil volume recorded in 100 mL graduated cylinder after 24 hrs.
            </p>
            <input
              type="number"
              step="0.1"
              value={volumeWater}
              onChange={(e) => setVolumeWater(parseFloat(e.target.value) || 0)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-blue-600 outline-none focus:border-blue-600 w-full shadow-inner"
            />
          </div>

          {/* VOLUME IN KEROSENE */}
          <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/40 rounded-xl space-y-2">
            <label className="text-xs font-bold text-purple-900 dark:text-purple-300 block">
              Volume of Soil in Kerosene (mL)
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Non-swelling reference volume recorded in 100 mL graduated cylinder after 24 hrs.
            </p>
            <input
              type="number"
              step="0.1"
              value={volumeKerosene}
              onChange={(e) => setVolumeKerosene(parseFloat(e.target.value) || 0)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold text-purple-600 outline-none focus:border-purple-600 w-full shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* 3. CALCULATION DETAILS & SEVERITY CLASSIFICATION TABLE */}
      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-soft space-y-4">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
          <Calculator className="w-4 h-4 text-purple-600" />
          Calculation Details & Classification Reference
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* FORMULA (5 COLS) */}
          <div className="md:col-span-5 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">DFSI Formula</span>
            <code className="text-xs font-bold text-purple-600 dark:text-purple-400 font-mono block">
              DFSI (%) = ((Vol in Water − Vol in Kerosene) ÷ Vol in Kerosene) × 100
            </code>
            <p className="text-[11px] text-slate-500 mt-2">
              Measures free swelling potential of expansive clay soil solids.
            </p>
          </div>

          {/* SEVERITY TABLE (7 COLS) */}
          <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              Degree of Severity Classification Table (IS 2720 Part 40)
            </span>
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-semibold">
              <div className={`p-2 rounded-lg border ${dfsi < 50 ? 'ring-2 ring-emerald-500 font-extrabold' : ''} bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 border-emerald-200`}>
                <div>&lt; 50%</div>
                <div className="text-[11px] mt-0.5 font-bold">Low</div>
              </div>
              <div className={`p-2 rounded-lg border ${dfsi >= 50 && dfsi <= 100 ? 'ring-2 ring-amber-500 font-extrabold' : ''} bg-amber-50 dark:bg-amber-950/40 text-amber-700 border-amber-200`}>
                <div>50 - 100%</div>
                <div className="text-[11px] mt-0.5 font-bold">Medium</div>
              </div>
              <div className={`p-2 rounded-lg border ${dfsi > 100 && dfsi <= 200 ? 'ring-2 ring-orange-500 font-extrabold' : ''} bg-orange-50 dark:bg-orange-950/40 text-orange-700 border-orange-200`}>
                <div>100 - 200%</div>
                <div className="text-[11px] mt-0.5 font-bold">High</div>
              </div>
              <div className={`p-2 rounded-lg border ${dfsi > 200 ? 'ring-2 ring-red-500 font-extrabold' : ''} bg-red-50 dark:bg-red-950/40 text-red-700 border-red-200`}>
                <div>&gt; 200%</div>
                <div className="text-[11px] mt-0.5 font-bold">Very High</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. FINAL RESULTS PANEL */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
        <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          FINAL RESULTS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* SAMPLE INFO (5 COLS) */}
          <div className="md:col-span-5 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Sample Number:</span>
              <span className="font-bold text-slate-900 dark:text-white">{sampleNo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Volume in Water:</span>
              <span className="font-bold text-blue-600">{volumeWater.toFixed(2)} mL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Volume in Kerosene:</span>
              <span className="font-bold text-purple-600">{volumeKerosene.toFixed(2)} mL</span>
            </div>
          </div>

          {/* DFSI HIGHLIGHT CARD (4 COLS) */}
          <div className="md:col-span-4 bg-purple-50/90 dark:bg-purple-950/50 border border-purple-200 dark:border-purple-900/60 rounded-xl p-6 flex flex-col justify-center text-center shadow-soft">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Differential Free Swell Index
            </span>
            <span className="text-4xl font-extrabold text-purple-600 dark:text-purple-400 mt-2">
              {dfsi.toFixed(2)} %
            </span>
          </div>

          {/* SEVERITY BADGE CARD (3 COLS) */}
          <div className={`md:col-span-3 border rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-soft ${badgeStyle.bg} ${badgeStyle.border}`}>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Degree of Severity
            </span>
            <div className={`inline-flex items-center gap-2 mt-3 px-4 py-1.5 rounded-full border text-sm font-extrabold shadow-sm ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>
              <span className={`w-2.5 h-2.5 rounded-full ${badgeStyle.dot} animate-pulse`} />
              <span>{severity}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM ACTION BUTTONS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-soft">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onShowToast('DFSI test data saved!')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Reset</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={onBack}
            className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
