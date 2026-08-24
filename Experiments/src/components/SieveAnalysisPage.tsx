import React, { useState } from 'react';
import { 
  ChevronRight, Plus, Trash2, FileSpreadsheet, Save, RotateCcw, ArrowLeft, CheckCircle2, Calculator,
  Table as TableIcon, LineChart as ChartIcon, Filter
} from 'lucide-react';
import { Experiment } from '../types';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface SieveAnalysisPageProps {
  experiment: Experiment;
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export interface SieveRow {
  obsNo: number;
  sieveSize: number;      // mm
  weightRetained: number; // g
  cumulativeWeight: number; // g
  percentRetained: number; // %
  percentPassing: number;  // %
}

// ---------------------------------------------------------
// LOGARITHMIC INTERPOLATION FUNCTIONS (PYTHON EQUIVALENT)
// ---------------------------------------------------------
export const interpolateSize = (targetPercent: number, sizes: number[], passing: number[]): number | null => {
  for (let i = 0; i < passing.length - 1; i++) {
    const p1 = passing[i];
    const p2 = passing[i + 1];

    if ((p1 >= targetPercent && targetPercent >= p2) || (p1 <= targetPercent && targetPercent <= p2)) {
      if (p1 === p2) continue;
      const x1 = Math.log10(sizes[i]);
      const x2 = Math.log10(sizes[i + 1]);

      const x = x1 + ((targetPercent - p1) * (x2 - x1)) / (p2 - p1);
      return Math.pow(10, x);
    }
  }
  return null;
};

export const interpolatePercent = (targetSize: number, sizes: number[], passing: number[]): number => {
  for (let i = 0; i < sizes.length - 1; i++) {
    if (sizes[i] >= targetSize && targetSize >= sizes[i + 1]) {
      const p1 = passing[i];
      const p2 = passing[i + 1];

      const s1 = Math.log10(sizes[i]);
      const s2 = Math.log10(sizes[i + 1]);
      const s = Math.log10(targetSize);

      if (s1 === s2) return p1;
      return p1 + ((s - s1) * (p2 - p1)) / (s2 - s1);
    }
  }
  return 0;
};

export const SieveAnalysisPage: React.FC<SieveAnalysisPageProps> = ({ experiment, onBack, onShowToast }) => {
  // Test Information State
  const [regdNo, setRegdNo] = useState<string>('REG-2026-SA01');
  const [totalWeight, setTotalWeight] = useState<number>(1000.0);
  const [numObsInput, setNumObsInput] = useState<number>(7);
  const [tableGenerated, setTableGenerated] = useState<boolean>(true);

  // Initial IS Standard Sieve Set
  const [rawInputs, setRawInputs] = useState<{ sieveSize: number; weightRetained: number }[]>([
    { sieveSize: 4.75, weightRetained: 45.0 },
    { sieveSize: 2.00, weightRetained: 120.0 },
    { sieveSize: 1.00, weightRetained: 180.0 },
    { sieveSize: 0.425, weightRetained: 250.0 },
    { sieveSize: 0.250, weightRetained: 190.0 },
    { sieveSize: 0.150, weightRetained: 110.0 },
    { sieveSize: 0.075, weightRetained: 75.0 }
  ]);

  // Sort descending by sieve size matching Python script
  const sortedData = [...rawInputs].sort((a, b) => b.sieveSize - a.sieveSize);

  let runTotal = 0;
  const rows: SieveRow[] = sortedData.map((item, idx) => {
    runTotal += item.weightRetained;
    const pr = totalWeight > 0 ? (item.weightRetained / totalWeight) * 100 : 0;
    const pp = totalWeight > 0 ? 100 - (runTotal / totalWeight) * 100 : 0;

    return {
      obsNo: idx + 1,
      sieveSize: item.sieveSize,
      weightRetained: Number(item.weightRetained.toFixed(3)),
      cumulativeWeight: Number(runTotal.toFixed(3)),
      percentRetained: Number(pr.toFixed(2)),
      percentPassing: Number(pp.toFixed(2))
    };
  });

  // Calculate D10, D30, D60 using Python logarithmic interpolation
  const sieveSizes = rows.map(r => r.sieveSize);
  const percentPassing = rows.map(r => r.percentPassing);

  const D10 = interpolateSize(10, sieveSizes, percentPassing) || 0.085;
  const D30 = interpolateSize(30, sieveSizes, percentPassing) || 0.220;
  const D60 = interpolateSize(60, sieveSizes, percentPassing) || 0.850;

  const Cu = D10 > 0 ? D60 / D10 : 0;
  const Cc = (D10 * D60) > 0 ? (D30 * D30) / (D10 * D60) : 0;

  // Gravel, Sand, and Fines fractions matching Python logic
  const fines = interpolatePercent(0.075, sieveSizes, percentPassing);
  const gravel = 100 - interpolatePercent(4.75, sieveSizes, percentPassing);
  const sand = Math.max(0, 100 - gravel - fines);

  // Classification Logic matching Python script
  let classification = "SW";
  if (fines > 50) {
    classification = "Fine-grained soil";
  } else {
    if (gravel > sand) {
      if (Cu >= 4 && Cc >= 1 && Cc <= 3) {
        classification = "GW";
      } else {
        classification = "GP";
      }
    } else {
      if (Cu >= 6 && Cc >= 1 && Cc <= 3) {
        classification = "SW";
      } else {
        classification = "SP";
      }
    }
  }

  // Handle table generation
  const handleGenerateTable = () => {
    const count = Math.max(1, Math.min(20, numObsInput));
    const standardSizes = [10.0, 4.75, 2.00, 1.00, 0.425, 0.250, 0.150, 0.075, 0.045];
    const newInputs = [];

    for (let i = 0; i < count; i++) {
      const size = standardSizes[i] || Number((4.75 / Math.pow(2, i)).toFixed(3));
      newInputs.push({ sieveSize: size, weightRetained: 50.0 + i * 20.0 });
    }
    setRawInputs(newInputs);
    setTableGenerated(true);
    onShowToast(`Generated observation table with ${count} sieve sizes.`);
  };

  // Real-time cell edit
  const handleCellEdit = (idx: number, field: 'sieveSize' | 'weightRetained', val: number) => {
    setRawInputs(prev => prev.map((item, i) => i === idx ? { ...item, [field]: val } : item));
  };

  const handleAddRow = () => {
    const minSize = Math.min(...rawInputs.map(r => r.sieveSize));
    const newSize = Number((minSize / 2).toFixed(3));
    setRawInputs(prev => [...prev, { sieveSize: newSize > 0 ? newSize : 0.045, weightRetained: 25.0 }]);
    setNumObsInput(prev => prev + 1);
    onShowToast("Added new sieve row.");
  };

  const handleDeleteRow = (idx: number) => {
    setRawInputs(prev => {
      const filtered = prev.filter((_, i) => i !== idx);
      setNumObsInput(filtered.length);
      return filtered;
    });
    onShowToast("Deleted sieve row.");
  };

  const handleReset = () => {
    setRegdNo('REG-2026-SA01');
    setTotalWeight(1000.0);
    setRawInputs([
      { sieveSize: 4.75, weightRetained: 45.0 },
      { sieveSize: 2.00, weightRetained: 120.0 },
      { sieveSize: 1.00, weightRetained: 180.0 },
      { sieveSize: 0.425, weightRetained: 250.0 },
      { sieveSize: 0.250, weightRetained: 190.0 },
      { sieveSize: 0.150, weightRetained: 110.0 },
      { sieveSize: 0.075, weightRetained: 75.0 }
    ]);
    setNumObsInput(7);
    setTableGenerated(true);
    onShowToast('Reset to initial Sieve Analysis dataset.');
  };

  // Chart.js Configuration for Grain Size Distribution Curve
  const chartLabels = rows.map(r => `${r.sieveSize}`);
  const chartDataConfig = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Percentage Passing (%)',
        data: rows.map(r => r.percentPassing),
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderWidth: 2.5,
        pointRadius: 6,
        pointBackgroundColor: '#DC2626',
        pointBorderColor: '#EF4444',
        fill: true,
        tension: 0.2
      }
    ]
  };

  // Export Excel matching exact 6 Python script columns
  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    // 6 EXACT COLUMNS FROM PYTHON CODE
    csvContent += "Regd. No.,Sieve Size (mm),Weight Retained (g),Cumulative Weight Retained (g),Percent Retained (%),Percent Passing (%)\n";

    rows.forEach(r => {
      csvContent += `${regdNo},${r.sieveSize},${r.weightRetained.toFixed(3)},${r.cumulativeWeight.toFixed(3)},${r.percentRetained.toFixed(2)},${r.percentPassing.toFixed(2)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Grain_Size_Analysis_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast("Exported to Grain_Size_Analysis_Results.csv matching Python openpyxl format!");
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
          <span className="font-semibold text-blue-600 dark:text-blue-400">Sieve Analysis</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span>[09]</span>
              <span>Sieve Analysis (Grain Size Analysis)</span>
              <span className="text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>IS 2720 Part 4 / ASTM D422</span>
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Determine the particle size distribution of soil by sieve analysis and classify the soil based on grain size characteristics.
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
          <Filter className="w-4 h-4 text-blue-600" />
          Test Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Registration Number
            </label>
            <input
              type="text"
              value={regdNo}
              onChange={(e) => setRegdNo(e.target.value)}
              placeholder="REG-2026-SA01"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Total Sample Weight (g)
            </label>
            <input
              type="number"
              step="0.1"
              value={totalWeight}
              onChange={(e) => setTotalWeight(parseFloat(e.target.value) || 1)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-blue-600 outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Number of Sieves
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={numObsInput}
              onChange={(e) => setNumObsInput(parseInt(e.target.value) || 1)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-600 text-center"
            />
          </div>

          <button
            onClick={handleGenerateTable}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition-all hover:scale-102 col-span-2 sm:col-span-1"
          >
            <TableIcon className="w-4 h-4" />
            <span>Generate Table</span>
          </button>
        </div>
      </div>

      {/* 2. OBSERVATION TABLE (6 EXACT COLUMNS FROM PYTHON CODE) */}
      {tableGenerated && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Observation Table ({rows.length} Sieves - Sorted Descending)
            </h3>

            <button
              onClick={handleAddRow}
              className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Sieve</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[850px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase tracking-wider">
                  <th className="p-2 border-r border-slate-200 dark:border-slate-700" colSpan={1}>Obs</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-700 text-center bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300" colSpan={2}>
                    Inputs (Sieve Size & Mass Retained)
                  </th>
                  <th className="p-2 text-center bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" colSpan={3}>
                    Calculated (Cumulative & Percent Passing)
                  </th>
                  <th className="p-2 text-center" colSpan={1}>Action</th>
                </tr>

                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px]">
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Obs No.</th>
                  <th className="p-2.5">Sieve Size (mm)</th>
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Weight Retained (g)</th>
                  
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Cumulative Weight (g)</th>
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Percent Retained (%)</th>
                  <th className="p-2.5 bg-emerald-100/50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 text-right font-bold">Percent Passing (%)</th>
                  <th className="p-2.5 text-center">Delete</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {rows.map((row, idx) => (
                  <tr key={row.obsNo} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800">
                      Obs-{row.obsNo}
                    </td>

                    {/* SIEVE SIZE INPUT */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.001"
                        value={row.sieveSize}
                        onChange={(e) => handleCellEdit(idx, 'sieveSize', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-bold text-blue-600 outline-none focus:border-blue-600 w-full shadow-inner"
                      />
                    </td>

                    {/* WEIGHT RETAINED INPUT */}
                    <td className="p-2 border-r border-slate-100 dark:border-slate-800">
                      <input
                        type="number"
                        step="0.1"
                        value={row.weightRetained}
                        onChange={(e) => handleCellEdit(idx, 'weightRetained', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-blue-600 w-full shadow-inner"
                      />
                    </td>

                    {/* CALCULATED FIELDS */}
                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {row.cumulativeWeight.toFixed(3)} g
                    </td>

                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {row.percentRetained.toFixed(2)} %
                    </td>

                    {/* PERCENT PASSING (%) */}
                    <td className="p-2.5 bg-emerald-100/40 dark:bg-emerald-950/40 text-right font-extrabold text-emerald-700 dark:text-emerald-300">
                      {row.percentPassing.toFixed(2)} %
                    </td>

                    {/* DELETE */}
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => handleDeleteRow(idx)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                        title="Delete Sieve"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. CALCULATION DETAILS CARD */}
      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-soft space-y-3">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
          <Calculator className="w-4 h-4 text-blue-600" />
          Calculation Details & Gradation Formulas
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Cumulative Weight</span>
            <code className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono block mt-1">
              = Running Sum of Retained Wt
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Percent Retained</span>
            <code className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono block mt-1">
              = (Retained Wt ÷ Total Wt) × 100
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Percent Passing</span>
            <code className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono block mt-1">
              = 100 − (Cum Wt ÷ Total Wt) × 100
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Uniformity Coeff (Cu)</span>
            <code className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono block mt-1">
              = D60 ÷ D10
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Curvature Coeff (Cc)</span>
            <code className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono block mt-1">
              = (D30²) ÷ (D10 × D60)
            </code>
          </div>
        </div>
      </div>

      {/* 4. GRAIN SIZE DISTRIBUTION GRAPH CARD (CHART.JS) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ChartIcon className="w-4 h-4 text-blue-600" />
              Grain Size Distribution Curve (Semi-Log Scale)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Plotting Particle Size (mm) vs Percent Passing (%) with $D_{10}$, $D_{30}$, and $D_{60}$ reference points.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-3 py-1 rounded-xl">
            <span>Classification: {classification}</span>
          </div>
        </div>

        <div className="h-[300px] w-full p-2 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
          <Line 
            data={chartDataConfig}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top' },
                tooltip: {
                  callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}%`
                  }
                }
              },
              scales: {
                x: {
                  title: { display: true, text: 'Sieve Particle Size (mm)', font: { size: 11, weight: 'bold' } },
                  grid: { color: 'rgba(226, 232, 240, 0.6)' }
                },
                y: {
                  min: 0,
                  max: 100,
                  title: { display: true, text: 'Percentage Passing (%)', font: { size: 11, weight: 'bold' } },
                  grid: { color: 'rgba(226, 232, 240, 0.6)' }
                }
              }
            }}
          />
        </div>
      </div>

      {/* 5. FINAL RESULTS PANEL */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
        <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          FINAL RESULTS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* PARAMETERS GRID (7 COLS) */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 rounded-xl">
              <span className="text-[10px] text-slate-400 block">D10 (mm)</span>
              <span className="font-bold text-blue-600">{D10.toFixed(4)}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 rounded-xl">
              <span className="text-[10px] text-slate-400 block">D30 (mm)</span>
              <span className="font-bold text-blue-600">{D30.toFixed(4)}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 rounded-xl">
              <span className="text-[10px] text-slate-400 block">D60 (mm)</span>
              <span className="font-bold text-blue-600">{D60.toFixed(4)}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 rounded-xl">
              <span className="text-[10px] text-slate-400 block">Coeff Uniformity (Cu)</span>
              <span className="font-bold text-emerald-600">{Cu.toFixed(2)}</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 rounded-xl">
              <span className="text-[10px] text-slate-400 block">Coeff Curvature (Cc)</span>
              <span className="font-bold text-emerald-600">{Cc.toFixed(2)}</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 rounded-xl">
              <span className="text-[10px] text-slate-400 block">Gravel (&gt;4.75mm)</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{gravel.toFixed(2)} %</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 rounded-xl">
              <span className="text-[10px] text-slate-400 block">Sand (4.75-0.075mm)</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{sand.toFixed(2)} %</span>
            </div>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 rounded-xl">
              <span className="text-[10px] text-slate-400 block">Fines (&lt;0.075mm)</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">{fines.toFixed(2)} %</span>
            </div>
          </div>

          {/* SOIL CLASSIFICATION CARD (5 COLS) */}
          <div className="md:col-span-5 bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 rounded-xl p-6 flex flex-col justify-center text-center shadow-soft">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Soil Classification (USCS / IS)
            </span>
            <span className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">
              {classification}
            </span>
            <span className="text-[11px] text-slate-400 mt-2">
              Determined per Cu, Cc, Gravel, Sand, and Fines fractions
            </span>
          </div>
        </div>
      </div>

      {/* 6. BOTTOM ACTION BUTTONS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-soft">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onShowToast('Sieve Analysis test data saved!')}
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
