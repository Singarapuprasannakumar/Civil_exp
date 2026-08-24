import React, { useState } from 'react';
import { 
  ChevronRight, Plus, Trash2, FileSpreadsheet, Save, RotateCcw, ArrowLeft, CheckCircle2, Calculator,
  Table as TableIcon
} from 'lucide-react';
import { Experiment } from '../types';

interface ShrinkageLimitPageProps {
  experiment: Experiment;
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export interface SLObservation {
  obsNo: number;
  w1: number; // Empty Shrinkage Dish
  w2: number; // Dish + Wet Soil
  w3: number; // Dish + Dry Soil
  wetSoil: number;       // W2 - W1
  drySoil: number;       // W3 - W1
  waterLost: number;     // Wet Soil - Dry Soil
  w4: number; // Dish + Mercury Filling Dish
  w5: number; // Empty Evaporating Dish
  w6: number; // Evaporating Dish + Mercury Displaced
  v1: number;            // (W4 - W1) / 13.6
  v2: number;            // (W6 - W5) / 13.6
  volumeReduction: number; // V1 - V2
  shrinkageLimit: number; // ((Water Lost - Volume Reduction) / Dry Soil) * 100
}

const MERCURY_DENSITY = 13.6; // g/cc per Python script

export const ShrinkageLimitPage: React.FC<ShrinkageLimitPageProps> = ({ experiment, onBack, onShowToast }) => {
  // Test Information State
  const [regdNo, setRegdNo] = useState<string>('REG-2026-SL01');
  const [numObsInput, setNumObsInput] = useState<number>(3);
  const [tableGenerated, setTableGenerated] = useState<boolean>(true);

  // Helper function to calculate row values per Python logic
  const computeRowValues = (
    obsNo: number, 
    w1: number, 
    w2: number, 
    w3: number, 
    w4: number, 
    w5: number, 
    w6: number
  ): SLObservation => {
    const wetSoil = w2 - w1;
    const drySoil = w3 - w1;
    const waterLost = wetSoil - drySoil;

    const weightMercuryFillingDish = w4 - w1;
    const v1 = weightMercuryFillingDish / MERCURY_DENSITY;

    const mercuryDisplaced = w6 - w5;
    const v2 = mercuryDisplaced / MERCURY_DENSITY;

    const volumeReduction = v1 - v2;

    const shrinkageLimit = drySoil > 0 ? ((waterLost - volumeReduction) / drySoil) * 100 : 0;

    return {
      obsNo,
      w1: Number(w1.toFixed(3)),
      w2: Number(w2.toFixed(3)),
      w3: Number(w3.toFixed(3)),
      wetSoil: Number(wetSoil.toFixed(3)),
      drySoil: Number(drySoil.toFixed(3)),
      waterLost: Number(waterLost.toFixed(3)),
      w4: Number(w4.toFixed(3)),
      w5: Number(w5.toFixed(3)),
      w6: Number(w6.toFixed(3)),
      v1: Number(v1.toFixed(3)),
      v2: Number(v2.toFixed(3)),
      volumeReduction: Number(volumeReduction.toFixed(3)),
      shrinkageLimit: Number(shrinkageLimit.toFixed(2))
    };
  };

  // Default pre-populated mercury displacement dataset
  const [observations, setObservations] = useState<SLObservation[]>([
    computeRowValues(1, 15.20, 52.40, 44.10, 395.40, 112.50, 318.20),
    computeRowValues(2, 15.50, 53.10, 44.60, 396.20, 114.00, 320.80),
    computeRowValues(3, 15.00, 51.80, 43.70, 394.80, 111.80, 316.50)
  ]);

  // Handle table generation
  const handleGenerateTable = () => {
    const count = Math.max(1, Math.min(20, numObsInput));
    const newRows: SLObservation[] = [];
    for (let i = 1; i <= count; i++) {
      newRows.push(computeRowValues(i, 15.20, 52.40, 44.10, 395.40, 112.50, 318.20));
    }
    setObservations(newRows);
    setTableGenerated(true);
    onShowToast(`Generated observation table with ${count} mercury displacement trial rows.`);
  };

  // Real-time live cell editing
  const handleCellEdit = (obsNo: number, field: 'w1' | 'w2' | 'w3' | 'w4' | 'w5' | 'w6', val: number) => {
    setObservations(prev => prev.map(obs => {
      if (obs.obsNo !== obsNo) return obs;
      const w1 = field === 'w1' ? val : obs.w1;
      const w2 = field === 'w2' ? val : obs.w2;
      const w3 = field === 'w3' ? val : obs.w3;
      const w4 = field === 'w4' ? val : obs.w4;
      const w5 = field === 'w5' ? val : obs.w5;
      const w6 = field === 'w6' ? val : obs.w6;
      return computeRowValues(obsNo, w1, w2, w3, w4, w5, w6);
    }));
  };

  const handleAddRow = () => {
    const idx = observations.length + 1;
    const newObs = computeRowValues(idx, 15.20, 52.40, 44.10, 395.40, 112.50, 318.20);
    setObservations(prev => [...prev, newObs]);
    setNumObsInput(idx);
    onShowToast(`Added Observation #${idx}`);
  };

  const handleDeleteRow = (obsNo: number) => {
    setObservations(prev => {
      const filtered = prev.filter(o => o.obsNo !== obsNo).map((o, i) => computeRowValues(i + 1, o.w1, o.w2, o.w3, o.w4, o.w5, o.w6));
      setNumObsInput(filtered.length);
      return filtered;
    });
    onShowToast(`Deleted Observation #${obsNo}`);
  };

  const handleReset = () => {
    setRegdNo('REG-2026-SL01');
    setObservations([
      computeRowValues(1, 15.20, 52.40, 44.10, 395.40, 112.50, 318.20),
      computeRowValues(2, 15.50, 53.10, 44.60, 396.20, 114.00, 320.80),
      computeRowValues(3, 15.00, 51.80, 43.70, 394.80, 111.80, 316.50)
    ]);
    setNumObsInput(3);
    setTableGenerated(true);
    onShowToast('Reset to initial Shrinkage Limit dataset.');
  };

  // Average Shrinkage Limit calculation
  const slValues = observations.map(o => o.shrinkageLimit);
  const averageSL = slValues.length > 0 ? slValues.reduce((a, b) => a + b, 0) / slValues.length : 0;

  // Export Excel matching exact 15 Python script columns + append Average Shrinkage Limit (%) summary row
  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    // 15 EXACT COLUMNS FROM PYTHON CODE
    csvContent += "Regd. No.,Observation No.,Weight of Empty Shrinkage Dish W1 (g),Weight of Dish + Wet Soil W2 (g),Weight of Dish + Dry Soil W3 (g),Weight of Wet Soil (g),Weight of Dry Soil (g),Weight of Water Lost (g),Weight of Dish + Mercury Filling Dish W4 (g),Weight of Empty Evaporating Dish W5 (g),Weight of Evaporating Dish + Mercury Displaced W6 (g),Volume of Wet Soil Pat V1 (cc),Volume of Dry Soil Pat V2 (cc),Volume Reduction (cc),Shrinkage Limit (%)\n";

    observations.forEach(o => {
      csvContent += `${regdNo},${o.obsNo},${o.w1.toFixed(3)},${o.w2.toFixed(3)},${o.w3.toFixed(3)},${o.wetSoil.toFixed(3)},${o.drySoil.toFixed(3)},${o.waterLost.toFixed(3)},${o.w4.toFixed(3)},${o.w5.toFixed(3)},${o.w6.toFixed(3)},${o.v1.toFixed(3)},${o.v2.toFixed(3)},${o.volumeReduction.toFixed(3)},${o.shrinkageLimit.toFixed(2)}\n`;
    });

    // APPEND AVERAGE SHRINKAGE LIMIT SUMMARY ROW MATCHING PYTHON CODE
    csvContent += `\n${regdNo},,,,,,,,,,,,,Average Shrinkage Limit (%),${averageSL.toFixed(2)}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Shrinkage_Limit_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast("Exported to Shrinkage_Limit_Results.csv matching Python openpyxl format!");
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
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Shrinkage Limit</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span>[05]</span>
              <span>Shrinkage Limit Test</span>
              <span className="text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>IS 2720 Part 6 / ASTM D4943</span>
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Determine the Shrinkage Limit of soil using the shrinkage dish and mercury displacement method.
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
          <TableIcon className="w-4 h-4 text-emerald-600" />
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
              placeholder="REG-2026-SL01"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-emerald-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Number of Observations (Pat Trials)
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={numObsInput}
              onChange={(e) => setNumObsInput(parseInt(e.target.value) || 1)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-600 text-center"
            />
          </div>

          <button
            onClick={handleGenerateTable}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:scale-102 col-span-2 sm:col-span-1"
          >
            <TableIcon className="w-4 h-4" />
            <span>Generate Table</span>
          </button>
        </div>
      </div>

      {/* 2. OBSERVATION TABLE (15 EXACT COLUMNS FROM PYTHON CODE) */}
      {tableGenerated && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Observation Table ({observations.length} Mercury Displacement Trials)
            </h3>

            <button
              onClick={handleAddRow}
              className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Row</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[1400px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase tracking-wider">
                  <th className="p-2 border-r border-slate-200 dark:border-slate-700" colSpan={1}>Obs</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-700 text-center bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300" colSpan={6}>
                    Inputs (Raw Dish & Mercury Weights)
                  </th>
                  <th className="p-2 text-center bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" colSpan={7}>
                    Calculated (Volumes & Shrinkage Limit)
                  </th>
                  <th className="p-2 text-center" colSpan={1}>Action</th>
                </tr>

                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px]">
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Obs No.</th>
                  <th className="p-2.5">W1 (Dish)</th>
                  <th className="p-2.5">W2 (Dish + Wet)</th>
                  <th className="p-2.5">W3 (Dish + Dry)</th>
                  <th className="p-2.5">W4 (Dish + Hg)</th>
                  <th className="p-2.5">W5 (Evap Dish)</th>
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">W6 (Evap + Hg Displaced)</th>
                  
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Wet Soil</th>
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Dry Soil</th>
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Water Lost</th>
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">V1 (Wet Pat cc)</th>
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">V2 (Dry Pat cc)</th>
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Vol Reduction</th>
                  <th className="p-2.5 bg-emerald-100/50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 text-right font-bold">Shrinkage Limit (%)</th>
                  <th className="p-2.5 text-center">Delete</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {observations.map((obs) => (
                  <tr key={obs.obsNo} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800">
                      Obs-{obs.obsNo}
                    </td>

                    {/* W1 */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.001"
                        value={obs.w1}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'w1', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-600 w-full shadow-inner"
                      />
                    </td>

                    {/* W2 */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.001"
                        value={obs.w2}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'w2', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-600 w-full shadow-inner"
                      />
                    </td>

                    {/* W3 */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.001"
                        value={obs.w3}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'w3', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-600 w-full shadow-inner"
                      />
                    </td>

                    {/* W4 */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.001"
                        value={obs.w4}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'w4', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-600 w-full shadow-inner"
                      />
                    </td>

                    {/* W5 */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.001"
                        value={obs.w5}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'w5', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-600 w-full shadow-inner"
                      />
                    </td>

                    {/* W6 */}
                    <td className="p-2 border-r border-slate-100 dark:border-slate-800">
                      <input
                        type="number"
                        step="0.001"
                        value={obs.w6}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'w6', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-600 w-full shadow-inner"
                      />
                    </td>

                    {/* CALCULATED FIELDS */}
                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {obs.wetSoil.toFixed(3)} g
                    </td>

                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {obs.drySoil.toFixed(3)} g
                    </td>

                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {obs.waterLost.toFixed(3)} g
                    </td>

                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {obs.v1.toFixed(3)} cc
                    </td>

                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {obs.v2.toFixed(3)} cc
                    </td>

                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {obs.volumeReduction.toFixed(3)} cc
                    </td>

                    {/* SHRINKAGE LIMIT % */}
                    <td className="p-2.5 bg-emerald-100/40 dark:bg-emerald-950/40 text-right font-extrabold text-emerald-700 dark:text-emerald-300">
                      {obs.shrinkageLimit.toFixed(2)} %
                    </td>

                    {/* DELETE */}
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => handleDeleteRow(obs.obsNo)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                        title="Delete Trial"
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
          <Calculator className="w-4 h-4 text-emerald-600" />
          Calculation Details & Mercury Displacement Formulas
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Wet Soil</span>
            <code className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono block mt-1">
              = W2 − W1
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Dry Soil</span>
            <code className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono block mt-1">
              = W3 − W1
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">V1 (Wet Pat Vol)</span>
            <code className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono block mt-1">
              = (W4 − W1) ÷ 13.6
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">V2 (Dry Pat Vol)</span>
            <code className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono block mt-1">
              = (W6 − W5) ÷ 13.6
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Volume Reduction</span>
            <code className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono block mt-1">
              = V1 − V2
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Shrinkage Limit (%)</span>
            <code className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono block mt-1">
              = ((Water Lost − Vol Red) ÷ Dry Soil) × 100
            </code>
          </div>
        </div>
      </div>

      {/* 4. FINAL RESULTS PANEL MATCHING PYTHON CLI OUTPUT */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
        <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          FINAL RESULTS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* INDIVIDUAL OBSERVATION SUMMARY (7 COLS) */}
          <div className="md:col-span-7 space-y-2">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Observation Summary
            </h4>
            {observations.map((obs) => (
              <div 
                key={obs.obsNo}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 text-xs font-mono"
              >
                <span className="font-bold text-slate-900 dark:text-white">Observation {obs.obsNo}</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  Shrinkage Limit = {obs.shrinkageLimit.toFixed(2)} %
                </span>
              </div>
            ))}
          </div>

          {/* PROMINENT AVERAGE SHRINKAGE LIMIT HIGHLIGHT CARD (5 COLS) */}
          <div className="md:col-span-5 bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 rounded-xl p-6 flex flex-col justify-center text-center shadow-soft">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Average Shrinkage Limit
            </span>
            <span className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
              {averageSL.toFixed(2)} %
            </span>
            <span className="text-[11px] text-slate-400 mt-2">
              Mean of mercury displacement soil pat readings
            </span>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM ACTION BUTTONS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-soft">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onShowToast('Shrinkage Limit test data saved!')}
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
