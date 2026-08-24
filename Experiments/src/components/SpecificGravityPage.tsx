import React, { useState } from 'react';
import { 
  ChevronRight, Plus, Trash2, FileSpreadsheet, Save, RotateCcw, ArrowLeft, CheckCircle2, Calculator,
  Thermometer, Table as TableIcon, HelpCircle, Check, ArrowRight
} from 'lucide-react';
import { Experiment } from '../types';

interface SpecificGravityPageProps {
  experiment: Experiment;
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

// Water Specific Gravity Lookup Table (1°C to 40°C) matching Python script
const waterSpGrMap: Record<number, number> = {
  1: 0.9999, 2: 0.9999, 3: 1.0000, 4: 1.0000, 5: 1.0000,
  6: 1.0000, 7: 0.9999, 8: 0.9999, 9: 0.9998, 10: 0.9997,
  11: 0.9996, 12: 0.9995, 13: 0.9994, 14: 0.9993, 15: 0.9991,
  16: 0.9990, 17: 0.9988, 18: 0.9986, 19: 0.9984, 20: 0.9982,
  21: 0.9980, 22: 0.9978, 23: 0.9976, 24: 0.9973, 25: 0.9971,
  26: 0.9968, 27: 0.9965, 28: 0.9963, 29: 0.9960, 30: 0.9957,
  31: 0.9954, 32: 0.9951, 33: 0.9947, 34: 0.9944, 35: 0.9941,
  36: 0.9937, 37: 0.9934, 38: 0.9930, 39: 0.9926, 40: 0.9922
};

export interface SGObservation {
  sampleNo: number;
  w1: number; // Pycnometer
  w2: number; // Pycnometer + Dry Soil
  w3: number; // Pycnometer + Soil + Water
  w4: number; // Pycnometer + Water
  soilWeight: number;       // W2 - W1
  waterPycnometer: number;  // W4 - W1
  waterAboveSoil: number;   // W3 - W2
  gt: number;               // soilWeight / ((W4 - W1) - (W3 - W2))
  g27: number;              // (Gt * GL) / G_water_27
}

export const SpecificGravityPage: React.FC<SpecificGravityPageProps> = ({ experiment, onBack, onShowToast }) => {
  // 1. TEST INFORMATION STATE (Python initial inputs)
  const [regdNo, setRegdNo] = useState<string>('REG-2026-SG01');
  const [temp, setTemp] = useState<number>(27);
  const [numObsInput, setNumObsInput] = useState<number>(3);
  const [tableGenerated, setTableGenerated] = useState<boolean>(true);

  const GL = waterSpGrMap[temp] || 0.9965;
  const G_water_27 = waterSpGrMap[27] || 0.9965;

  // Formula computation helper matching Python script
  const computeRowValues = (sampleNo: number, w1: number, w2: number, w3: number, w4: number, glVal: number): SGObservation => {
    const soilWeight = w2 - w1;
    const waterPycnometer = w4 - w1;
    const waterAboveSoil = w3 - w2;
    const denominator = (w4 - w1) - (w3 - w2);

    let gt = 0;
    let g27 = 0;

    if (denominator !== 0) {
      gt = soilWeight / denominator;
      g27 = (gt * glVal) / G_water_27;
    }

    return {
      sampleNo,
      w1: Number(w1.toFixed(4)),
      w2: Number(w2.toFixed(4)),
      w3: Number(w3.toFixed(4)),
      w4: Number(w4.toFixed(4)),
      soilWeight: Number(soilWeight.toFixed(4)),
      waterPycnometer: Number(waterPycnometer.toFixed(4)),
      waterAboveSoil: Number(waterAboveSoil.toFixed(4)),
      gt: Number(gt.toFixed(4)),
      g27: Number(g27.toFixed(4))
    };
  };

  // Pre-populated default dataset
  const [observations, setObservations] = useState<SGObservation[]>([
    computeRowValues(1, 450.0, 950.0, 1580.0, 1265.0, 0.9965),
    computeRowValues(2, 452.5, 955.0, 1582.0, 1266.5, 0.9965),
    computeRowValues(3, 448.0, 946.0, 1578.5, 1264.0, 0.9965)
  ]);

  // Generate Table Action
  const handleGenerateTable = () => {
    const count = Math.max(1, Math.min(20, numObsInput));
    const newRows: SGObservation[] = [];
    for (let i = 1; i <= count; i++) {
      newRows.push(computeRowValues(i, 450.0, 950.0, 1580.0, 1265.0, GL));
    }
    setObservations(newRows);
    setTableGenerated(true);
    onShowToast(`Generated observation table with ${count} sample rows.`);
  };

  // Temperature Change Listener (1°C to 40°C Dropdown)
  const handleTempChange = (newTemp: number) => {
    setTemp(newTemp);
    const newGL = waterSpGrMap[newTemp] || 0.9965;
    setObservations(prev => prev.map(obs => computeRowValues(obs.sampleNo, obs.w1, obs.w2, obs.w3, obs.w4, newGL)));
  };

  // Real-time Cell Editing for W1, W2, W3, W4
  const handleCellEdit = (sampleNo: number, field: 'w1' | 'w2' | 'w3' | 'w4', val: number) => {
    setObservations(prev => prev.map(obs => {
      if (obs.sampleNo !== sampleNo) return obs;
      const w1 = field === 'w1' ? val : obs.w1;
      const w2 = field === 'w2' ? val : obs.w2;
      const w3 = field === 'w3' ? val : obs.w3;
      const w4 = field === 'w4' ? val : obs.w4;
      return computeRowValues(sampleNo, w1, w2, w3, w4, GL);
    }));
  };

  const handleAddRow = () => {
    const idx = observations.length + 1;
    const newObs = computeRowValues(idx, 450.0, 950.0, 1580.0, 1265.0, GL);
    setObservations(prev => [...prev, newObs]);
    setNumObsInput(idx);
    onShowToast(`Added Sample #${idx}`);
  };

  const handleDeleteRow = (sampleNo: number) => {
    setObservations(prev => {
      const filtered = prev.filter(o => o.sampleNo !== sampleNo).map((o, i) => computeRowValues(i + 1, o.w1, o.w2, o.w3, o.w4, GL));
      setNumObsInput(filtered.length);
      return filtered;
    });
    onShowToast(`Deleted Sample #${sampleNo}`);
  };

  const handleReset = () => {
    setRegdNo('REG-2026-SG01');
    setTemp(27);
    setObservations([
      computeRowValues(1, 450.0, 950.0, 1580.0, 1265.0, 0.9965),
      computeRowValues(2, 452.5, 955.0, 1582.0, 1266.5, 0.9965),
      computeRowValues(3, 448.0, 946.0, 1578.5, 1264.0, 0.9965)
    ]);
    setNumObsInput(3);
    setTableGenerated(true);
    onShowToast('Reset to initial Pycnometer dataset.');
  };

  // Average G27 calculation
  const g27Values = observations.map(o => o.g27);
  const averageG27 = g27Values.length > 0 ? g27Values.reduce((a, b) => a + b, 0) / g27Values.length : 0;

  // Export Excel matching exact 13 Python script columns + append Average G27 row
  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Regd. No.,Sample No.,Temperature (°C),Specific Gravity of Water at T (GL),W1 (g),W2 (g),W3 (g),W4 (g),Weight of Soil (g),Weight of Water Filling Pycnometer (g),Weight of Water Above Soil (g),Gt,G27\n";

    observations.forEach(o => {
      csvContent += `${regdNo},${o.sampleNo},${temp},${GL.toFixed(4)},${o.w1.toFixed(4)},${o.w2.toFixed(4)},${o.w3.toFixed(4)},${o.w4.toFixed(4)},${o.soilWeight.toFixed(4)},${o.waterPycnometer.toFixed(4)},${o.waterAboveSoil.toFixed(4)},${o.gt.toFixed(4)},${o.g27.toFixed(4)}\n`;
    });

    csvContent += `${regdNo},,,,,,,,,,Average G27,,${averageG27.toFixed(4)}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "specific_gravity_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast("Exported to specific_gravity_results.csv matching Python openpyxl format!");
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
          <span className="font-semibold text-teal-600 dark:text-teal-400">Specific Gravity</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span>[02]</span>
              <span>Specific Gravity Test Using Pycnometer</span>
              <span className="text-xs font-semibold bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>IS 2720 Part 3 / ASTM D854</span>
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Determine the specific gravity of soil solids using the pycnometer method.
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

      {/* 1. SEPARATE DEDICATED "TEST INFORMATION" CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Thermometer className="w-4 h-4 text-teal-600" />
          Test Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* REGISTRATION NUMBER */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Registration No.
            </label>
            <input
              type="text"
              value={regdNo}
              onChange={(e) => setRegdNo(e.target.value)}
              placeholder="REG-2026-001"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-teal-600"
            />
          </div>

          {/* LABORATORY TEMPERATURE DROPDOWN (1°C - 40°C VALIDATION) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Laboratory Temp (°C)
            </label>
            <select
              value={temp}
              onChange={(e) => handleTempChange(parseInt(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-teal-600 outline-none focus:border-teal-600 cursor-pointer"
            >
              {Array.from({ length: 40 }, (_, i) => i + 1).map((tVal) => (
                <option key={tVal} value={tVal}>
                  {tVal}°C {tVal === 27 ? '(Standard Reference)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* READ-ONLY GL */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Water Sp. Gr. (GL) [Read-Only]
            </label>
            <input
              type="text"
              readOnly
              value={GL.toFixed(4)}
              className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-teal-600 cursor-not-allowed"
            />
          </div>

          {/* NUMBER OF OBSERVATIONS */}
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
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-teal-600 text-center"
            />
          </div>

          {/* GENERATE TABLE ACTION */}
          <button
            onClick={handleGenerateTable}
            className="flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md shadow-teal-600/20 transition-all hover:scale-102"
          >
            <TableIcon className="w-4 h-4" />
            <span>Generate Table</span>
          </button>
        </div>
      </div>

      {/* 2. FOCUSED OBSERVATION TABLE WITH VISUAL INPUTS VS CALCULATED GROUPING */}
      {tableGenerated && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Observation Table ({observations.length} Samples)
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
                {/* GROUPED CATEGORY HEADER ROW */}
                <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase tracking-wider">
                  <th className="p-2 border-r border-slate-200 dark:border-slate-700" colSpan={1}>Sample</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-700 text-center bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300" colSpan={4}>
                    Inputs (Editable Pycnometer Weights)
                  </th>
                  <th className="p-2 text-center bg-teal-50/80 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300" colSpan={5}>
                    Calculated (Automatic Formulas)
                  </th>
                  <th className="p-2 text-center" colSpan={1}>Action</th>
                </tr>

                {/* DETAILED COLUMN HEADER ROW */}
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px]">
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Sample No</th>
                  <th className="p-2.5">W1 (Pycnometer)</th>
                  <th className="p-2.5">W2 (Pyc + Soil)</th>
                  <th className="p-2.5">W3 (Pyc + Soil + Water)</th>
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">W4 (Pyc + Water)</th>
                  
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Soil Weight</th>
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Water in Pycnometer</th>
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Water Above Soil</th>
                  <th className="p-2.5 bg-teal-50/40 dark:bg-teal-950/20 text-teal-700 dark:text-teal-300">Gt (@ {temp}°C)</th>
                  <th className="p-2.5 bg-teal-100/50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 text-right font-bold">G27 (@ 27°C)</th>
                  <th className="p-2.5 text-center">Delete</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {observations.map((obs) => (
                  <tr key={obs.sampleNo} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800">
                      Sample {obs.sampleNo}
                    </td>

                    {/* W1 INPUT */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.0001"
                        value={obs.w1}
                        onChange={(e) => handleCellEdit(obs.sampleNo, 'w1', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-600 w-full shadow-inner"
                      />
                    </td>

                    {/* W2 INPUT */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.0001"
                        value={obs.w2}
                        onChange={(e) => handleCellEdit(obs.sampleNo, 'w2', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-600 w-full shadow-inner"
                      />
                    </td>

                    {/* W3 INPUT */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.0001"
                        value={obs.w3}
                        onChange={(e) => handleCellEdit(obs.sampleNo, 'w3', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-600 w-full shadow-inner"
                      />
                    </td>

                    {/* W4 INPUT */}
                    <td className="p-2 border-r border-slate-100 dark:border-slate-800">
                      <input
                        type="number"
                        step="0.0001"
                        value={obs.w4}
                        onChange={(e) => handleCellEdit(obs.sampleNo, 'w4', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-blue-600 w-full shadow-inner"
                      />
                    </td>

                    {/* CALCULATED COLUMNS (READ-ONLY SHADED) */}
                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {obs.soilWeight.toFixed(4)} g
                    </td>

                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {obs.waterPycnometer.toFixed(4)} g
                    </td>

                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {obs.waterAboveSoil.toFixed(4)} g
                    </td>

                    <td className="p-2.5 bg-teal-50/50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-300 font-semibold">
                      {obs.gt.toFixed(4)}
                    </td>

                    <td className="p-2.5 bg-teal-100/40 dark:bg-teal-950/50 text-right font-extrabold text-teal-800 dark:text-teal-200">
                      {obs.g27.toFixed(4)}
                    </td>

                    {/* DELETE */}
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => handleDeleteRow(obs.sampleNo)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                        title="Delete Sample"
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

      {/* 3. CALCULATION DETAILS & STEPS CARD */}
      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-soft space-y-3">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
          <Calculator className="w-4 h-4 text-teal-600" />
          Calculation Details & Governing Formulas
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3 text-xs">
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Weight of Soil</span>
            <code className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono block mt-1">
              = W2 − W1
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Water Filling Pycnometer</span>
            <code className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono block mt-1">
              = W4 − W1
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Water Above Soil</span>
            <code className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono block mt-1">
              = W3 − W2
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Gt (@ {temp}°C)</span>
            <code className="text-xs font-bold text-teal-600 dark:text-teal-400 font-mono block mt-1">
              = Soil Wt ÷ Denominator
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">G27 (@ 27°C)</span>
            <code className="text-xs font-bold text-teal-600 dark:text-teal-400 font-mono block mt-1">
              = (Gt × GL) ÷ G27Water
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
          {/* INDIVIDUAL SAMPLE G27 BREAKDOWN (7 COLS) */}
          <div className="md:col-span-7 space-y-2">
            {observations.map((obs) => (
              <div 
                key={obs.sampleNo}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 text-xs font-mono"
              >
                <span className="font-bold text-slate-900 dark:text-white">Sample {obs.sampleNo}</span>
                <span className="font-bold text-teal-600 dark:text-teal-400 text-sm">
                  G27 = {obs.g27.toFixed(4)}
                </span>
              </div>
            ))}
          </div>

          {/* PROMINENT AVERAGE G27 CARD (5 COLS) */}
          <div className="md:col-span-5 bg-teal-50/90 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-900/60 rounded-xl p-6 flex flex-col justify-center text-center shadow-soft">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Average G27
            </span>
            <span className="text-4xl font-extrabold text-teal-700 dark:text-teal-400 mt-2">
              {averageG27.toFixed(4)}
            </span>
            <span className="text-[11px] text-slate-400 mt-2">
              Final specific gravity at 27°C reference
            </span>
          </div>
        </div>
      </div>

      {/* 5. BOTTOM ACTION BUTTONS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-soft">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onShowToast('Specific Gravity test data saved!')}
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
