import React, { useState } from 'react';
import { 
  ChevronRight, Plus, Trash2, FileSpreadsheet, Save, RotateCcw, ArrowLeft, CheckCircle2, Calculator,
  Table as TableIcon, Cylinder
} from 'lucide-react';
import { Experiment } from '../types';

interface CoreCutterPageProps {
  experiment: Experiment;
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export interface CCObservation {
  obsNo: number;
  cutterNo: string;
  d: number;             // Internal Diameter (cm)
  h: number;             // Internal Height (cm)
  volume: number;        // (pi / 4) * d^2 * h
  w1: number;            // Weight of Empty Core Cutter (g)
  w2: number;            // Weight of Core Cutter + Wet Soil (g)
  wetSoil: number;       // W2 - W1
  moisture: number;      // Moisture Content (%)
  bulkDensity: number;   // wetSoil / volume
  dryDensity: number;    // bulkDensity / (1 + moisture / 100)
}

export const CoreCutterPage: React.FC<CoreCutterPageProps> = ({ experiment, onBack, onShowToast }) => {
  // Test Information State
  const [regdNo, setRegdNo] = useState<string>('REG-2026-CC01');
  const [numObsInput, setNumObsInput] = useState<number>(3);
  const [tableGenerated, setTableGenerated] = useState<boolean>(true);

  // Helper function to calculate row values per Python logic
  const computeRowValues = (
    obsNo: number,
    cutterNo: string,
    d: number,
    h: number,
    w1: number,
    w2: number,
    moisture: number
  ): CCObservation => {
    const volume = (Math.PI / 4) * Math.pow(d, 2) * h;
    const wetSoil = w2 - w1;
    const bulkDensity = volume > 0 ? wetSoil / volume : 0;
    const dryDensity = bulkDensity / (1 + moisture / 100);

    return {
      obsNo,
      cutterNo,
      d: Number(d.toFixed(3)),
      h: Number(h.toFixed(3)),
      volume: Number(volume.toFixed(3)),
      w1: Number(w1.toFixed(3)),
      w2: Number(w2.toFixed(3)),
      wetSoil: Number(wetSoil.toFixed(3)),
      moisture: Number(moisture.toFixed(2)),
      bulkDensity: Number(bulkDensity.toFixed(4)),
      dryDensity: Number(dryDensity.toFixed(4))
    };
  };

  // Default pre-populated Core Cutter dataset
  const [observations, setObservations] = useState<CCObservation[]>([
    computeRowValues(1, 'CC-01', 10.0, 13.0, 980.0, 2825.0, 12.5),
    computeRowValues(2, 'CC-02', 10.0, 13.0, 985.0, 2810.0, 12.0),
    computeRowValues(3, 'CC-03', 10.0, 13.0, 978.0, 2835.0, 13.0)
  ]);

  // Handle table generation
  const handleGenerateTable = () => {
    const count = Math.max(1, Math.min(20, numObsInput));
    const newRows: CCObservation[] = [];
    for (let i = 1; i <= count; i++) {
      newRows.push(computeRowValues(i, `CC-0${i}`, 10.0, 13.0, 980.0, 2825.0, 12.5));
    }
    setObservations(newRows);
    setTableGenerated(true);
    onShowToast(`Generated observation table with ${count} Core Cutter trials.`);
  };

  // Real-time live cell editing
  const handleCellEdit = (
    obsNo: number,
    field: 'cutterNo' | 'd' | 'h' | 'w1' | 'w2' | 'moisture',
    val: string | number
  ) => {
    setObservations(prev => prev.map(obs => {
      if (obs.obsNo !== obsNo) return obs;
      const cNo = field === 'cutterNo' ? String(val) : obs.cutterNo;
      const d = field === 'd' ? Number(val) : obs.d;
      const h = field === 'h' ? Number(val) : obs.h;
      const w1 = field === 'w1' ? Number(val) : obs.w1;
      const w2 = field === 'w2' ? Number(val) : obs.w2;
      const moisture = field === 'moisture' ? Number(val) : obs.moisture;
      return computeRowValues(obsNo, cNo, d, h, w1, w2, moisture);
    }));
  };

  const handleAddRow = () => {
    const idx = observations.length + 1;
    const newObs = computeRowValues(idx, `CC-0${idx}`, 10.0, 13.0, 980.0, 2825.0, 12.5);
    setObservations(prev => [...prev, newObs]);
    setNumObsInput(idx);
    onShowToast(`Added Observation #${idx}`);
  };

  const handleDeleteRow = (obsNo: number) => {
    setObservations(prev => {
      const filtered = prev.filter(o => o.obsNo !== obsNo).map((o, i) => computeRowValues(i + 1, o.cutterNo, o.d, o.h, o.w1, o.w2, o.moisture));
      setNumObsInput(filtered.length);
      return filtered;
    });
    onShowToast(`Deleted Observation #${obsNo}`);
  };

  const handleReset = () => {
    setRegdNo('REG-2026-CC01');
    setObservations([
      computeRowValues(1, 'CC-01', 10.0, 13.0, 980.0, 2825.0, 12.5),
      computeRowValues(2, 'CC-02', 10.0, 13.0, 985.0, 2810.0, 12.0),
      computeRowValues(3, 'CC-03', 10.0, 13.0, 978.0, 2835.0, 13.0)
    ]);
    setNumObsInput(3);
    setTableGenerated(true);
    onShowToast('Reset to initial Core Cutter dataset.');
  };

  // Export Excel matching exact 12 Python script columns
  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    // 12 EXACT COLUMNS FROM PYTHON CODE
    csvContent += "Regd. No.,Observation No.,Core Cutter No.,Internal Diameter (cm),Internal Height (cm),Volume of Core Cutter (cc),Weight of Empty Core Cutter W1 (g),Weight of Core Cutter + Wet Soil W2 (g),Weight of Wet Soil (g),Moisture Content (%),Bulk Density (g/cc),Dry Density (g/cc)\n";

    observations.forEach(o => {
      csvContent += `${regdNo},${o.obsNo},${o.cutterNo},${o.d.toFixed(3)},${o.h.toFixed(3)},${o.volume.toFixed(3)},${o.w1.toFixed(3)},${o.w2.toFixed(3)},${o.wetSoil.toFixed(3)},${o.moisture.toFixed(2)},${o.bulkDensity.toFixed(4)},${o.dryDensity.toFixed(4)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Field_Density_Core_Cutter_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast("Exported to Field_Density_Core_Cutter_Results.csv matching Python openpyxl format!");
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
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">Core Cutter Method</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span>[08]</span>
              <span>Core Cutter Method Test</span>
              <span className="text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>IS 2720 Part 29 / ASTM D2937</span>
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Determine the in-situ bulk density and dry density of soil using the Core Cutter Method.
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
              placeholder="REG-2026-CC01"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-emerald-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Number of Observations
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

      {/* 2. OBSERVATION TABLE (12 EXACT COLUMNS FROM PYTHON CODE) */}
      {tableGenerated && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Observation Table ({observations.length} Core Cutter Trials)
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
            <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase tracking-wider">
                  <th className="p-2 border-r border-slate-200 dark:border-slate-700" colSpan={1}>Obs</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-700 text-center bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300" colSpan={6}>
                    Inputs (Dimensions & Core Cutter Weights)
                  </th>
                  <th className="p-2 text-center bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" colSpan={4}>
                    Calculated (Volume, Wet & Dry Density)
                  </th>
                  <th className="p-2 text-center" colSpan={1}>Action</th>
                </tr>

                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px]">
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Obs No.</th>
                  <th className="p-2.5">Cutter No.</th>
                  <th className="p-2.5">Diameter D (cm)</th>
                  <th className="p-2.5">Height H (cm)</th>
                  <th className="p-2.5">W1 (Empty Cutter g)</th>
                  <th className="p-2.5">W2 (Cutter + Wet g)</th>
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Moisture Content (%)</th>
                  
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Volume (cc)</th>
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Weight of Wet Soil (g)</th>
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Bulk Density (g/cc)</th>
                  <th className="p-2.5 bg-emerald-100/50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 text-right font-bold">Dry Density (g/cc)</th>
                  <th className="p-2.5 text-center">Delete</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {observations.map((obs) => (
                  <tr key={obs.obsNo} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800">
                      Obs-{obs.obsNo}
                    </td>

                    {/* CUTTER NO */}
                    <td className="p-2">
                      <input
                        type="text"
                        value={obs.cutterNo}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'cutterNo', e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-blue-600 outline-none focus:border-blue-600 w-full shadow-inner"
                      />
                    </td>

                    {/* DIAMETER D */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.01"
                        value={obs.d}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'd', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-600 w-full shadow-inner"
                      />
                    </td>

                    {/* HEIGHT H */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.01"
                        value={obs.h}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'h', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-600 w-full shadow-inner"
                      />
                    </td>

                    {/* W1 */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.1"
                        value={obs.w1}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'w1', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-600 w-full shadow-inner"
                      />
                    </td>

                    {/* W2 */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.1"
                        value={obs.w2}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'w2', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-600 w-full shadow-inner"
                      />
                    </td>

                    {/* MOISTURE */}
                    <td className="p-2 border-r border-slate-100 dark:border-slate-800">
                      <input
                        type="number"
                        step="0.01"
                        value={obs.moisture}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'moisture', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-600 w-full shadow-inner"
                      />
                    </td>

                    {/* CALCULATED FIELDS */}
                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {obs.volume.toFixed(3)} cc
                    </td>

                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {obs.wetSoil.toFixed(3)} g
                    </td>

                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {obs.bulkDensity.toFixed(4)} g/cc
                    </td>

                    {/* DRY DENSITY */}
                    <td className="p-2.5 bg-emerald-100/40 dark:bg-emerald-950/40 text-right font-extrabold text-emerald-700 dark:text-emerald-300">
                      {obs.dryDensity.toFixed(4)} g/cc
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
          Calculation Details & Governing Formulas
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Volume of Core Cutter</span>
            <code className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono block mt-1">
              = (π / 4) × D² × H
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Weight of Wet Soil</span>
            <code className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono block mt-1">
              = W2 − W1
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Bulk Density</span>
            <code className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono block mt-1">
              = Weight of Wet Soil ÷ Volume
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Dry Density</span>
            <code className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono block mt-1">
              = Bulk Density ÷ (1 + Moisture / 100)
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {observations.map((obs) => (
            <div 
              key={obs.obsNo}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-bold text-slate-900 dark:text-white text-xs">Observation {obs.obsNo}</span>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  Cutter: {obs.cutterNo}
                </span>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <span className="text-slate-500">Bulk Density:</span>
                  <span className="font-bold text-blue-600">{obs.bulkDensity.toFixed(4)} g/cc</span>
                </div>
                <div className="flex justify-between p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">Dry Density:</span>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-300">{obs.dryDensity.toFixed(4)} g/cc</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. BOTTOM ACTION BUTTONS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-soft">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onShowToast('Core Cutter test data saved!')}
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
