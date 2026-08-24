import React, { useState } from 'react';
import { 
  ChevronRight, Plus, Trash2, FileSpreadsheet, Save, RotateCcw, ArrowLeft, CheckCircle2, Calculator,
  Table as TableIcon
} from 'lucide-react';
import { Experiment } from '../types';

interface PlasticLimitPageProps {
  experiment: Experiment;
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export interface PLObservation {
  obsNo: number;
  containerNo: string;
  w1: number;            // Weight of Container (g)
  w2: number;            // Weight of Container + Wet Soil (g)
  w3: number;            // Weight of Container + Dry Soil (g)
  waterWeight: number;   // W2 - W3
  drySoilWeight: number; // W3 - W1
  waterContent: number;  // (waterWeight / drySoilWeight) * 100
}

export const PlasticLimitPage: React.FC<PlasticLimitPageProps> = ({ experiment, onBack, onShowToast }) => {
  // Test Information State
  const [regdNo, setRegdNo] = useState<string>('REG-2026-PL01');
  const [numObsInput, setNumObsInput] = useState<number>(3);
  const [tableGenerated, setTableGenerated] = useState<boolean>(true);

  // Helper function to calculate row values per Python logic
  const computeRowValues = (obsNo: number, containerNo: string, w1: number, w2: number, w3: number): PLObservation => {
    const waterWeight = w2 - w3;
    const drySoilWeight = w3 - w1;
    const waterContent = drySoilWeight > 0 ? (waterWeight / drySoilWeight) * 100 : 0;

    return {
      obsNo,
      containerNo,
      w1: Number(w1.toFixed(3)),
      w2: Number(w2.toFixed(3)),
      w3: Number(w3.toFixed(3)),
      waterWeight: Number(waterWeight.toFixed(3)),
      drySoilWeight: Number(drySoilWeight.toFixed(3)),
      waterContent: Number(waterContent.toFixed(2))
    };
  };

  // Default pre-populated thread rolling observations dataset
  const [observations, setObservations] = useState<PLObservation[]>([
    computeRowValues(1, 'C-01', 18.50, 42.30, 37.80),
    computeRowValues(2, 'C-02', 19.10, 43.80, 39.00),
    computeRowValues(3, 'C-03', 18.80, 42.90, 38.25)
  ]);

  // Handle table generation
  const handleGenerateTable = () => {
    const count = Math.max(1, Math.min(20, numObsInput));
    const newRows: PLObservation[] = [];
    for (let i = 1; i <= count; i++) {
      newRows.push(computeRowValues(i, `C-0${i}`, 18.50, 42.30, 37.80));
    }
    setObservations(newRows);
    setTableGenerated(true);
    onShowToast(`Generated observation table with ${count} 3mm thread trial rows.`);
  };

  // Real-time live cell editing
  const handleCellEdit = (obsNo: number, field: 'containerNo' | 'w1' | 'w2' | 'w3', val: string | number) => {
    setObservations(prev => prev.map(obs => {
      if (obs.obsNo !== obsNo) return obs;
      const cNo = field === 'containerNo' ? String(val) : obs.containerNo;
      const w1 = field === 'w1' ? Number(val) : obs.w1;
      const w2 = field === 'w2' ? Number(val) : obs.w2;
      const w3 = field === 'w3' ? Number(val) : obs.w3;
      return computeRowValues(obsNo, cNo, w1, w2, w3);
    }));
  };

  const handleAddRow = () => {
    const idx = observations.length + 1;
    const newObs = computeRowValues(idx, `C-0${idx}`, 18.50, 42.30, 37.80);
    setObservations(prev => [...prev, newObs]);
    setNumObsInput(idx);
    onShowToast(`Added Observation #${idx}`);
  };

  const handleDeleteRow = (obsNo: number) => {
    setObservations(prev => {
      const filtered = prev.filter(o => o.obsNo !== obsNo).map((o, i) => computeRowValues(i + 1, o.containerNo, o.w1, o.w2, o.w3));
      setNumObsInput(filtered.length);
      return filtered;
    });
    onShowToast(`Deleted Observation #${obsNo}`);
  };

  const handleReset = () => {
    setRegdNo('REG-2026-PL01');
    setObservations([
      computeRowValues(1, 'C-01', 18.50, 42.30, 37.80),
      computeRowValues(2, 'C-02', 19.10, 43.80, 39.00),
      computeRowValues(3, 'C-03', 18.80, 42.90, 38.25)
    ]);
    setNumObsInput(3);
    setTableGenerated(true);
    onShowToast('Reset to initial Plastic Limit dataset.');
  };

  // Average Plastic Limit calculation
  const waterContents = observations.map(o => o.waterContent);
  const plasticLimit = waterContents.length > 0 ? waterContents.reduce((a, b) => a + b, 0) / waterContents.length : 0;

  // Export Excel matching exact 9 Python script columns + append Plastic Limit (%) summary row
  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    // 9 EXACT COLUMNS FROM PYTHON CODE
    csvContent += "Regd. No.,Observation No.,Container No.,Weight of Container (W1) (g),Weight of Container + Wet Soil (W2) (g),Weight of Container + Dry Soil (W3) (g),Weight of Water (g),Weight of Dry Soil (g),Water Content (%)\n";

    observations.forEach(o => {
      csvContent += `${regdNo},${o.obsNo},${o.containerNo},${o.w1.toFixed(3)},${o.w2.toFixed(3)},${o.w3.toFixed(3)},${o.waterWeight.toFixed(3)},${o.drySoilWeight.toFixed(3)},${o.waterContent.toFixed(2)}\n`;
    });

    // APPEND PLASTIC LIMIT SUMMARY ROW MATCHING PYTHON CODE
    csvContent += `\n${regdNo},,,,,,,Plastic Limit (%),${plasticLimit.toFixed(2)}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Plastic_Limit_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast("Exported to Plastic_Limit_Results.csv matching Python openpyxl format!");
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
          <span className="font-semibold text-red-600 dark:text-red-400">Plastic Limit</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span>[04]</span>
              <span>Plastic Limit Test</span>
              <span className="text-xs font-semibold bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>IS 2720 Part 5 / ASTM D4318</span>
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Determine the Plastic Limit of soil by rolling soil threads until they crumble at approximately 3 mm diameter.
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
          <TableIcon className="w-4 h-4 text-red-600" />
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
              placeholder="REG-2026-PL01"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-red-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Number of Observations (Threads)
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={numObsInput}
              onChange={(e) => setNumObsInput(parseInt(e.target.value) || 1)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-red-600 text-center"
            />
          </div>

          <button
            onClick={handleGenerateTable}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md shadow-red-600/20 transition-all hover:scale-102 col-span-2 sm:col-span-1"
          >
            <TableIcon className="w-4 h-4" />
            <span>Generate Table</span>
          </button>
        </div>
      </div>

      {/* 2. OBSERVATION TABLE (9 EXACT COLUMNS FROM PYTHON CODE) */}
      {tableGenerated && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Observation Table ({observations.length} Thread Trials)
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
            <table className="w-full text-left text-xs border-collapse min-w-[980px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase tracking-wider">
                  <th className="p-2 border-r border-slate-200 dark:border-slate-700" colSpan={1}>Obs</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-700 text-center bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300" colSpan={4}>
                    Inputs (Thread Trial Weights)
                  </th>
                  <th className="p-2 text-center bg-red-50/80 dark:bg-red-950/40 text-red-700 dark:text-red-300" colSpan={3}>
                    Calculated (Automatic Formulas)
                  </th>
                  <th className="p-2 text-center" colSpan={1}>Action</th>
                </tr>

                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px]">
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Observation No.</th>
                  <th className="p-2.5">Container No.</th>
                  <th className="p-2.5">W1 (Weight of Container) (g)</th>
                  <th className="p-2.5">W2 (Container + Wet Soil) (g)</th>
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">W3 (Container + Dry Soil) (g)</th>
                  
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Weight of Water (W2 - W3)</th>
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Weight of Dry Soil (W3 - W1)</th>
                  <th className="p-2.5 bg-red-100/50 dark:bg-red-950/50 text-red-800 dark:text-red-200 text-right font-bold">Water Content (%)</th>
                  <th className="p-2.5 text-center">Delete</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {observations.map((obs) => (
                  <tr key={obs.obsNo} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800">
                      Obs-{obs.obsNo}
                    </td>

                    {/* CONTAINER NO INPUT */}
                    <td className="p-2">
                      <input
                        type="text"
                        value={obs.containerNo}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'containerNo', e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-blue-600 outline-none focus:border-blue-600 w-full shadow-inner"
                      />
                    </td>

                    {/* W1 INPUT */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.001"
                        value={obs.w1}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'w1', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-600 w-full shadow-inner"
                      />
                    </td>

                    {/* W2 INPUT */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.001"
                        value={obs.w2}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'w2', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-600 w-full shadow-inner"
                      />
                    </td>

                    {/* W3 INPUT */}
                    <td className="p-2 border-r border-slate-100 dark:border-slate-800">
                      <input
                        type="number"
                        step="0.001"
                        value={obs.w3}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'w3', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-600 w-full shadow-inner"
                      />
                    </td>

                    {/* CALCULATED WATER WEIGHT */}
                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {obs.waterWeight.toFixed(3)} g
                    </td>

                    {/* CALCULATED DRY SOIL WEIGHT */}
                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {obs.drySoilWeight.toFixed(3)} g
                    </td>

                    {/* CALCULATED WATER CONTENT (%) */}
                    <td className="p-2.5 bg-red-100/40 dark:bg-red-950/40 text-right font-extrabold text-red-700 dark:text-red-300">
                      {obs.waterContent.toFixed(2)} %
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
          <Calculator className="w-4 h-4 text-red-600" />
          Calculation Details & Plastic Limit Formula
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Weight of Water</span>
            <code className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono block mt-1">
              = W2 − W3
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Weight of Dry Soil</span>
            <code className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono block mt-1">
              = W3 − W1
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Water Content (w %)</span>
            <code className="text-xs font-bold text-red-600 dark:text-red-400 font-mono block mt-1">
              = (Weight of Water ÷ Weight of Dry Soil) × 100
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
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">Observation {obs.obsNo}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-blue-600 font-semibold">Container {obs.containerNo}</span>
                </div>
                <span className="font-bold text-red-600 dark:text-red-400 text-sm">
                  Water Content = {obs.waterContent.toFixed(2)} %
                </span>
              </div>
            ))}
          </div>

          {/* PROMINENT PLASTIC LIMIT HIGHLIGHT CARD (5 COLS) */}
          <div className="md:col-span-5 bg-red-50/90 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-xl p-6 flex flex-col justify-center text-center shadow-soft">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Plastic Limit (PL)
            </span>
            <span className="text-4xl font-extrabold text-red-600 dark:text-red-400 mt-2">
              {plasticLimit.toFixed(2)} %
            </span>
            <span className="text-[11px] text-slate-400 mt-2">
              Average Water Content of 3 mm crumbling soil threads
            </span>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM ACTION BUTTONS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-soft">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onShowToast('Plastic Limit test data saved!')}
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
