import React, { useState } from 'react';
import { 
  ChevronRight, Plus, Trash2, FileSpreadsheet, Save, RotateCcw, ArrowLeft, CheckCircle2, Calculator,
  Table as TableIcon, Sliders, Layers
} from 'lucide-react';
import { Experiment } from '../types';

interface SandReplacementPageProps {
  experiment: Experiment;
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export interface SRObservation {
  obsNo: number;
  // Stage 1: Calibration Inputs
  w1: number; // Sand Pouring Cylinder (g)
  w2: number; // Empty Receiver (g)
  w3: number; // Cylinder + Sand Before Filling Receiver (g)
  w4: number; // Cylinder + Sand After Filling Receiver (g)
  sandInCone: number; // Mass of Sand in Cone Portion (g)
  v1: number; // Volume of Receiver (cc)
  
  // Stage 1: Calculated
  weightSandReceiver: number; // W3 - W4 - sandInCone
  densitySand: number;        // weightSandReceiver / V1

  // Stage 2: Field Density Inputs
  w7: number; // Cylinder + Sand Before Filling Hole (g)
  w8: number; // Cylinder + Sand After Filling Hole (g)
  w9: number; // Excavated Soil (g)
  moisture: number; // Moisture Content (%)

  // Stage 2: Calculated
  sandUsedTotal: number; // W7 - W8
  sandInHole: number;    // sandUsedTotal - sandInCone
  volumeHole: number;    // sandInHole / densitySand
  wetDensity: number;    // W9 / volumeHole
  dryDensity: number;    // wetDensity / (1 + moisture / 100)
}

export const SandReplacementPage: React.FC<SandReplacementPageProps> = ({ experiment, onBack, onShowToast }) => {
  // Test Information State
  const [regdNo, setRegdNo] = useState<string>('REG-2026-SR01');
  const [numObsInput, setNumObsInput] = useState<number>(2);
  const [tableGenerated, setTableGenerated] = useState<boolean>(true);

  // Helper function to calculate row values per Python logic
  const computeRowValues = (
    obsNo: number,
    w1: number, w2: number, w3: number, w4: number, sandInCone: number, v1: number,
    w7: number, w8: number, w9: number, moisture: number
  ): SRObservation => {
    const weightSandReceiver = w3 - w4 - sandInCone;
    const densitySand = v1 > 0 ? weightSandReceiver / v1 : 0;

    const sandUsedTotal = w7 - w8;
    const sandInHole = sandUsedTotal - sandInCone;
    const volumeHole = densitySand > 0 ? sandInHole / densitySand : 0;
    const wetDensity = volumeHole > 0 ? w9 / volumeHole : 0;
    const dryDensity = wetDensity / (1 + moisture / 100);

    return {
      obsNo,
      w1: Number(w1.toFixed(3)),
      w2: Number(w2.toFixed(3)),
      w3: Number(w3.toFixed(3)),
      w4: Number(w4.toFixed(3)),
      sandInCone: Number(sandInCone.toFixed(3)),
      v1: Number(v1.toFixed(3)),
      weightSandReceiver: Number(weightSandReceiver.toFixed(3)),
      densitySand: Number(densitySand.toFixed(4)),

      w7: Number(w7.toFixed(3)),
      w8: Number(w8.toFixed(3)),
      w9: Number(w9.toFixed(3)),
      moisture: Number(moisture.toFixed(2)),

      sandUsedTotal: Number(sandUsedTotal.toFixed(3)),
      sandInHole: Number(sandInHole.toFixed(3)),
      volumeHole: Number(volumeHole.toFixed(3)),
      wetDensity: Number(wetDensity.toFixed(4)),
      dryDensity: Number(dryDensity.toFixed(4))
    };
  };

  // Default pre-populated Sand Replacement dataset
  const [observations, setObservations] = useState<SRObservation[]>([
    computeRowValues(1, 1500.0, 1100.0, 7500.0, 5200.0, 450.0, 1000.0, 7500.0, 4800.0, 2450.0, 12.5),
    computeRowValues(2, 1500.0, 1100.0, 7500.0, 5210.0, 448.0, 1000.0, 7500.0, 4815.0, 2465.0, 12.0)
  ]);

  // Handle table generation
  const handleGenerateTable = () => {
    const count = Math.max(1, Math.min(20, numObsInput));
    const newRows: SRObservation[] = [];
    for (let i = 1; i <= count; i++) {
      newRows.push(computeRowValues(i, 1500.0, 1100.0, 7500.0, 5200.0, 450.0, 1000.0, 7500.0, 4800.0, 2450.0, 12.5));
    }
    setObservations(newRows);
    setTableGenerated(true);
    onShowToast(`Generated observation table with ${count} field trials.`);
  };

  // Real-time live cell editing
  const handleCellEdit = (
    obsNo: number, 
    field: 'w1' | 'w2' | 'w3' | 'w4' | 'sandInCone' | 'v1' | 'w7' | 'w8' | 'w9' | 'moisture', 
    val: number
  ) => {
    setObservations(prev => prev.map(obs => {
      if (obs.obsNo !== obsNo) return obs;
      const w1 = field === 'w1' ? val : obs.w1;
      const w2 = field === 'w2' ? val : obs.w2;
      const w3 = field === 'w3' ? val : obs.w3;
      const w4 = field === 'w4' ? val : obs.w4;
      const sandInCone = field === 'sandInCone' ? val : obs.sandInCone;
      const v1 = field === 'v1' ? val : obs.v1;

      const w7 = field === 'w7' ? val : obs.w7;
      const w8 = field === 'w8' ? val : obs.w8;
      const w9 = field === 'w9' ? val : obs.w9;
      const moisture = field === 'moisture' ? val : obs.moisture;

      return computeRowValues(obsNo, w1, w2, w3, w4, sandInCone, v1, w7, w8, w9, moisture);
    }));
  };

  const handleAddRow = () => {
    const idx = observations.length + 1;
    const newObs = computeRowValues(idx, 1500.0, 1100.0, 7500.0, 5200.0, 450.0, 1000.0, 7500.0, 4800.0, 2450.0, 12.5);
    setObservations(prev => [...prev, newObs]);
    setNumObsInput(idx);
    onShowToast(`Added Observation #${idx}`);
  };

  const handleDeleteRow = (obsNo: number) => {
    setObservations(prev => {
      const filtered = prev.filter(o => o.obsNo !== obsNo).map((o, i) => computeRowValues(i + 1, o.w1, o.w2, o.w3, o.w4, o.sandInCone, o.v1, o.w7, o.w8, o.w9, o.moisture));
      setNumObsInput(filtered.length);
      return filtered;
    });
    onShowToast(`Deleted Observation #${obsNo}`);
  };

  const handleReset = () => {
    setRegdNo('REG-2026-SR01');
    setObservations([
      computeRowValues(1, 1500.0, 1100.0, 7500.0, 5200.0, 450.0, 1000.0, 7500.0, 4800.0, 2450.0, 12.5),
      computeRowValues(2, 1500.0, 1100.0, 7500.0, 5210.0, 448.0, 1000.0, 7500.0, 4815.0, 2465.0, 12.0)
    ]);
    setNumObsInput(2);
    setTableGenerated(true);
    onShowToast('Reset to initial Sand Replacement dataset.');
  };

  // Export Excel matching exact 17 Python script columns
  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    // 17 EXACT COLUMNS FROM PYTHON CODE
    csvContent += "Regd. No.,Observation No.,Weight of Sand Pouring Cylinder W1 (g),Weight of Empty Receiver W2 (g),Weight of Cylinder + Sand before Filling Receiver W3 (g),Weight of Cylinder + Sand after Filling Receiver W4 (g),Volume of Receiver V1 (cc),Bulk Density of Sand γs (g/cc),Sand in Cone Portion (g),Weight of Cylinder + Sand before Filling Hole W7 (g),Weight of Cylinder + Sand after Filling Hole W8 (g),Weight of Excavated Soil W9 (g),Moisture Content (%),Weight of Sand in Hole (g),Volume of Hole (cc),Wet Density (g/cc),Dry Density (g/cc)\n";

    observations.forEach(o => {
      csvContent += `${regdNo},${o.obsNo},${o.w1.toFixed(3)},${o.w2.toFixed(3)},${o.w3.toFixed(3)},${o.w4.toFixed(3)},${o.v1.toFixed(3)},${o.densitySand.toFixed(4)},${o.sandInCone.toFixed(3)},${o.w7.toFixed(3)},${o.w8.toFixed(3)},${o.w9.toFixed(3)},${o.moisture.toFixed(2)},${o.sandInHole.toFixed(3)},${o.volumeHole.toFixed(3)},${o.wetDensity.toFixed(4)},${o.dryDensity.toFixed(4)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Sand_Replacement_Test_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast("Exported to Sand_Replacement_Test_Results.csv matching Python openpyxl format!");
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
          <span className="font-semibold text-amber-600 dark:text-amber-400">Sand Replacement Method</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span>[07]</span>
              <span>Sand Replacement Method Test</span>
              <span className="text-xs font-semibold bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>IS 2720 Part 28 / ASTM D1556</span>
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Determine the in-situ density of soil using the Sand Replacement Method.
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
          <TableIcon className="w-4 h-4 text-amber-600" />
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
              placeholder="REG-2026-SR01"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-amber-600"
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
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-amber-600 text-center"
            />
          </div>

          <button
            onClick={handleGenerateTable}
            className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md shadow-amber-600/20 transition-all hover:scale-102 col-span-2 sm:col-span-1"
          >
            <TableIcon className="w-4 h-4" />
            <span>Generate Table</span>
          </button>
        </div>
      </div>

      {tableGenerated && (
        <div className="space-y-6">
          {/* 2. STAGE 1: CALIBRATION SECTION */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600" />
                Stage 1: Calibration (Sand Bulk Density Determination)
              </h3>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2.5 py-1 rounded-full">
                Receiver Vol = {observations[0]?.v1 || 1000} cc
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse min-w-[980px]">
                <thead>
                  <tr className="bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold border-b border-blue-200 dark:border-blue-800 text-[11px] uppercase tracking-wider">
                    <th className="p-2.5 border-r border-blue-200 dark:border-blue-800">Obs</th>
                    <th className="p-2.5">W1 (Cylinder) (g)</th>
                    <th className="p-2.5">W2 (Receiver) (g)</th>
                    <th className="p-2.5">W3 (Cyl + Sand Pre) (g)</th>
                    <th className="p-2.5">W4 (Cyl + Sand Post) (g)</th>
                    <th className="p-2.5">Sand in Cone (g)</th>
                    <th className="p-2.5">V1 (Receiver cc)</th>
                    <th className="p-2.5 bg-blue-100/50 dark:bg-blue-950/60 font-extrabold text-blue-900 dark:text-blue-200">Sand Receiver Wt (g)</th>
                    <th className="p-2.5 bg-blue-200/50 dark:bg-blue-900/60 text-right font-extrabold text-blue-900 dark:text-blue-100">Density of Sand γs (g/cc)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {observations.map((obs) => (
                    <tr key={obs.obsNo} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800">
                        Obs-{obs.obsNo}
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.1"
                          value={obs.w1}
                          onChange={(e) => handleCellEdit(obs.obsNo, 'w1', parseFloat(e.target.value) || 0)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-600 w-full"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.1"
                          value={obs.w2}
                          onChange={(e) => handleCellEdit(obs.obsNo, 'w2', parseFloat(e.target.value) || 0)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-600 w-full"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.1"
                          value={obs.w3}
                          onChange={(e) => handleCellEdit(obs.obsNo, 'w3', parseFloat(e.target.value) || 0)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-600 w-full"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.1"
                          value={obs.w4}
                          onChange={(e) => handleCellEdit(obs.obsNo, 'w4', parseFloat(e.target.value) || 0)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-600 w-full"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.1"
                          value={obs.sandInCone}
                          onChange={(e) => handleCellEdit(obs.obsNo, 'sandInCone', parseFloat(e.target.value) || 0)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-600 w-full"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.1"
                          value={obs.v1}
                          onChange={(e) => handleCellEdit(obs.obsNo, 'v1', parseFloat(e.target.value) || 0)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-600 w-full"
                        />
                      </td>

                      <td className="p-2.5 bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200 font-bold">
                        {obs.weightSandReceiver.toFixed(3)} g
                      </td>

                      <td className="p-2.5 bg-blue-100/60 dark:bg-blue-950/60 text-right font-extrabold text-blue-900 dark:text-blue-100">
                        {obs.densitySand.toFixed(4)} g/cc
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. STAGE 2: FIELD DENSITY SECTION */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                Stage 2: Field Density (In-Situ Soil Density Determination)
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
                <thead>
                  <tr className="bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold border-b border-amber-200 dark:border-amber-800 text-[11px] uppercase tracking-wider">
                    <th className="p-2.5 border-r border-amber-200 dark:border-amber-800">Obs</th>
                    <th className="p-2.5">W7 (Cyl + Sand Pre Hole) (g)</th>
                    <th className="p-2.5">W8 (Cyl + Sand Post Hole) (g)</th>
                    <th className="p-2.5">W9 (Excavated Soil) (g)</th>
                    <th className="p-2.5">Moisture Content (%)</th>
                    <th className="p-2.5 bg-amber-100/40 dark:bg-amber-950/30">Sand in Hole (g)</th>
                    <th className="p-2.5 bg-amber-100/40 dark:bg-amber-950/30">Volume of Hole (cc)</th>
                    <th className="p-2.5 bg-amber-100/40 dark:bg-amber-950/30">Wet Density (g/cc)</th>
                    <th className="p-2.5 bg-amber-200/60 dark:bg-amber-950/70 text-right font-extrabold text-amber-950 dark:text-amber-100">Dry Density (g/cc)</th>
                    <th className="p-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {observations.map((obs) => (
                    <tr key={obs.obsNo} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800">
                        Obs-{obs.obsNo}
                      </td>

                      {/* W7 */}
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.1"
                          value={obs.w7}
                          onChange={(e) => handleCellEdit(obs.obsNo, 'w7', parseFloat(e.target.value) || 0)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-amber-600 w-full shadow-inner"
                        />
                      </td>

                      {/* W8 */}
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.1"
                          value={obs.w8}
                          onChange={(e) => handleCellEdit(obs.obsNo, 'w8', parseFloat(e.target.value) || 0)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-amber-600 w-full shadow-inner"
                        />
                      </td>

                      {/* W9 */}
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.1"
                          value={obs.w9}
                          onChange={(e) => handleCellEdit(obs.obsNo, 'w9', parseFloat(e.target.value) || 0)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-amber-600 w-full shadow-inner"
                        />
                      </td>

                      {/* MOISTURE */}
                      <td className="p-2">
                        <input
                          type="number"
                          step="0.01"
                          value={obs.moisture}
                          onChange={(e) => handleCellEdit(obs.obsNo, 'moisture', parseFloat(e.target.value) || 0)}
                          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-amber-600 w-full shadow-inner"
                        />
                      </td>

                      {/* CALCULATED FIELDS */}
                      <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                        {obs.sandInHole.toFixed(3)} g
                      </td>

                      <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                        {obs.volumeHole.toFixed(3)} cc
                      </td>

                      <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                        {obs.wetDensity.toFixed(4)} g/cc
                      </td>

                      {/* DRY DENSITY */}
                      <td className="p-2.5 bg-amber-100/50 dark:bg-amber-950/60 text-right font-extrabold text-amber-800 dark:text-amber-200">
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
        </div>
      )}

      {/* 4. CALCULATION DETAILS CARD */}
      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-soft space-y-3">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
          <Calculator className="w-4 h-4 text-amber-600" />
          Calculation Details & Governing Formulas
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Sand Filling Receiver</span>
            <code className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono block mt-1">
              = W3 − W4 − Sand in Cone
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Bulk Density of Sand (γs)</span>
            <code className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono block mt-1">
              = Receiver Sand Wt ÷ V1
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Volume of Hole</span>
            <code className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono block mt-1">
              = Sand in Hole ÷ γs
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Dry Density</span>
            <code className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono block mt-1">
              = Wet Density ÷ (1 + w / 100)
            </code>
          </div>
        </div>
      </div>

      {/* 5. FINAL RESULTS PANEL MATCHING PYTHON CLI OUTPUT */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
        <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          FINAL RESULTS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {observations.map((obs) => (
            <div 
              key={obs.obsNo}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 space-y-3"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="font-bold text-slate-900 dark:text-white text-xs">Observation {obs.obsNo}</span>
                <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                  Sand Density γs = {obs.densitySand.toFixed(4)} g/cc
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Hole Volume</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{obs.volumeHole.toFixed(2)} cc</span>
                </div>
                <div className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
                  <span className="text-[10px] text-slate-400 block">Wet Density</span>
                  <span className="font-bold text-blue-600">{obs.wetDensity.toFixed(4)} g/cc</span>
                </div>
                <div className="p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">Dry Density</span>
                  <span className="font-extrabold text-amber-700 dark:text-amber-300">{obs.dryDensity.toFixed(4)} g/cc</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. BOTTOM ACTION BUTTONS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-soft">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onShowToast('Sand Replacement test data saved!')}
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
