import React, { useState } from 'react';
import { 
  ChevronRight, Plus, Trash2, FileSpreadsheet, Save, RotateCcw, ArrowLeft, CheckCircle2, Calculator,
  Table as TableIcon, LineChart as ChartIcon, Compass
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
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface VaneShearPageProps {
  experiment: Experiment;
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export interface VaneShearObs {
  obsNo: number;
  theta1: number;       // Initial Reading (deg)
  theta2: number;       // Final Reading (deg)
  
  // Calculated
  angleDiff: number;    // theta2 - theta1
  torqueT: number;      // K * angleDiff * (pi / 180) (kg-cm)
  denominator: number;  // pi * d^2 * (H/2 + d/6)
  shearStrength: number;// torqueT / denominator (kg/cm2)
}

export const VaneShearPage: React.FC<VaneShearPageProps> = ({ experiment, onBack, onShowToast }) => {
  // Test Information State
  const [regdNo, setRegdNo] = useState<string>('REG-2026-VS01');
  const [vaneD, setVaneD] = useState<number>(3.8);   // cm
  const [vaneH, setVaneH] = useState<number>(7.6);   // cm
  const [springK, setSpringK] = useState<number>(2.0); // kg-cm/deg
  const [numObsInput, setNumObsInput] = useState<number>(3);
  const [tableGenerated, setTableGenerated] = useState<boolean>(true);

  // Helper calculation function matching Python logic
  const computeRowValues = (
    obsNo: number,
    t1: number,
    t2: number,
    K: number,
    d: number,
    H: number
  ): VaneShearObs => {
    const angleDiff = t2 - t1;
    const torqueT = K * angleDiff * (Math.PI / 180);
    const denominator = Math.PI * Math.pow(d, 2) * (H / 2 + d / 6);
    const shearStrength = denominator > 0 ? torqueT / denominator : 0;

    return {
      obsNo,
      theta1: Number(t1.toFixed(2)),
      theta2: Number(t2.toFixed(2)),
      angleDiff: Number(angleDiff.toFixed(2)),
      torqueT: Number(torqueT.toFixed(4)),
      denominator: Number(denominator.toFixed(4)),
      shearStrength: Number(shearStrength.toFixed(6))
    };
  };

  // Pre-populated observation dataset matching Python script
  const [observations, setObservations] = useState<VaneShearObs[]>([
    computeRowValues(1, 0.0, 45.0, 2.0, 3.8, 7.6),
    computeRowValues(2, 0.0, 48.0, 2.0, 3.8, 7.6),
    computeRowValues(3, 0.0, 43.5, 2.0, 3.8, 7.6)
  ]);

  const avgTorque = observations.length > 0 ? observations.reduce((a, b) => a + b.torqueT, 0) / observations.length : 0;
  const avgShear = observations.length > 0 ? observations.reduce((a, b) => a + b.shearStrength, 0) / observations.length : 0;
  const avgAngleDiff = observations.length > 0 ? observations.reduce((a, b) => a + b.angleDiff, 0) / observations.length : 0;

  // Chart.js Configuration
  const chartLabels = observations.map(o => `Obs-${o.obsNo}`);
  const chartDataConfig = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Shear Strength τf (kg/cm²)',
        data: observations.map(o => o.shearStrength),
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2.5,
        pointRadius: 6,
        pointBackgroundColor: '#EF4444',
        tension: 0.2
      }
    ]
  };

  // Handle table generation
  const handleGenerateTable = () => {
    const count = Math.max(1, Math.min(20, numObsInput));
    const newRows: VaneShearObs[] = [];
    for (let i = 1; i <= count; i++) {
      newRows.push(computeRowValues(i, 0.0, 40.0 + i * 3, springK, vaneD, vaneH));
    }
    setObservations(newRows);
    setTableGenerated(true);
    onShowToast(`Generated observation table with ${count} readings.`);
  };

  // Real-time cell edit
  const handleCellEdit = (
    obsNo: number,
    field: 'theta1' | 'theta2',
    val: number
  ) => {
    setObservations(prev => prev.map(obs => {
      if (obs.obsNo !== obsNo) return obs;
      const t1 = field === 'theta1' ? val : obs.theta1;
      const t2 = field === 'theta2' ? val : obs.theta2;
      return computeRowValues(obsNo, t1, t2, springK, vaneD, vaneH);
    }));
  };

  const handleAddRow = () => {
    const idx = observations.length + 1;
    const lastT2 = observations.length > 0 ? observations[observations.length - 1].theta2 : 45.0;
    const newObs = computeRowValues(idx, 0.0, lastT2 + 2, springK, vaneD, vaneH);
    setObservations(prev => [...prev, newObs]);
    setNumObsInput(idx);
    onShowToast(`Added Observation #${idx}`);
  };

  const handleDeleteRow = (obsNo: number) => {
    setObservations(prev => {
      const filtered = prev.filter(o => o.obsNo !== obsNo).map((o, i) => computeRowValues(i + 1, o.theta1, o.theta2, springK, vaneD, vaneH));
      setNumObsInput(filtered.length);
      return filtered;
    });
    onShowToast(`Deleted Observation #${obsNo}`);
  };

  const handleReset = () => {
    setRegdNo('REG-2026-VS01');
    setVaneD(3.8);
    setVaneH(7.6);
    setSpringK(2.0);
    setObservations([
      computeRowValues(1, 0.0, 45.0, 2.0, 3.8, 7.6),
      computeRowValues(2, 0.0, 48.0, 2.0, 3.8, 7.6),
      computeRowValues(3, 0.0, 43.5, 2.0, 3.8, 7.6)
    ]);
    setNumObsInput(3);
    onShowToast('Reset to initial Vane Shear dataset.');
  };

  // Export Excel matching exact 10 Python script columns + appends AVERAGE row
  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    // 10 EXACT COLUMNS FROM PYTHON CODE
    csvContent += "Regd. No.,Sample No.,Spring Constant (K),Initial Reading (θ1),Final Reading (θ2),Angle Difference (Δθ),Torque (T) kg-cm,Shear Strength (τf) kg/cm2,Vane Diameter (d) mm,Vane Height (H) mm\n";

    observations.forEach(o => {
      csvContent += `${regdNo},${o.obsNo},${springK},${o.theta1.toFixed(2)},${o.theta2.toFixed(2)},${o.angleDiff.toFixed(2)},${o.torqueT.toFixed(4)},${o.shearStrength.toFixed(6)},${vaneD * 10},${vaneH * 10}\n`;
    });

    // APPEND AVERAGE ROW MATCHING PYTHON CODE
    csvContent += `\n${regdNo},AVERAGE,${springK},,${avgAngleDiff.toFixed(2)},${avgTorque.toFixed(4)},${avgShear.toFixed(6)},${vaneD * 10},${vaneH * 10}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "vane_shear_test_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast("Exported to vane_shear_test_results.csv matching Python openpyxl format!");
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
          <span className="font-semibold text-red-600 dark:text-red-400">Vane Shear Test</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span>[15]</span>
              <span>Vane Shear Test</span>
              <span className="text-xs font-semibold bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>IS 4434-1978 / ASTM D2573</span>
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Determine undrained shear strength of soft to medium clay using the laboratory vane shear apparatus.
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
          <Compass className="w-4 h-4 text-red-600" />
          Test Information & Vane Dimensions
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Registration Number</label>
            <input
              type="text"
              value={regdNo}
              onChange={(e) => setRegdNo(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-red-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Vane Diameter d (cm)</label>
            <input
              type="number"
              step="0.1"
              value={vaneD}
              onChange={(e) => setVaneD(parseFloat(e.target.value) || 3.8)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-blue-600 outline-none focus:border-red-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Vane Height H (cm)</label>
            <input
              type="number"
              step="0.1"
              value={vaneH}
              onChange={(e) => setVaneH(parseFloat(e.target.value) || 7.6)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-blue-600 outline-none focus:border-red-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Spring Constant K (kg-cm/°)</label>
            <input
              type="number"
              step="0.1"
              value={springK}
              onChange={(e) => setSpringK(parseFloat(e.target.value) || 2.0)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-red-600 outline-none focus:border-red-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Observations</label>
            <input
              type="number"
              min="1"
              max="20"
              value={numObsInput}
              onChange={(e) => setNumObsInput(parseInt(e.target.value) || 1)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-red-600 text-center"
            />
          </div>
        </div>
      </div>

      {/* 2. OBSERVATION TABLE */}
      {tableGenerated && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Observation Table ({observations.length} Readings)
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
            <table className="w-full text-left text-xs border-collapse min-w-[900px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase tracking-wider">
                  <th className="p-2 border-r border-slate-200 dark:border-slate-700" colSpan={1}>Obs</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-700 text-center bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300" colSpan={2}>
                    Editable Inputs (Strain Indicator Readings)
                  </th>
                  <th className="p-2 text-center bg-red-50/80 dark:bg-red-950/40 text-red-700 dark:text-red-300" colSpan={3}>
                    Auto-Calculated (Angle, Torque & Shear Strength)
                  </th>
                  <th className="p-2 text-center" colSpan={1}>Action</th>
                </tr>

                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px]">
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Obs No.</th>
                  <th className="p-2.5">Initial Reading θ1 (°)</th>
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Final Reading θ2 (°)</th>
                  
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Angle Diff Δθ (°)</th>
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Torque T (kg-cm)</th>
                  <th className="p-2.5 bg-red-100/50 dark:bg-red-950/50 text-red-800 dark:text-red-200 text-right font-bold">Shear Strength τf (kg/cm²)</th>
                  <th className="p-2.5 text-center">Delete</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {observations.map((obs) => (
                  <tr key={obs.obsNo} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800">
                      Obs-{obs.obsNo}
                    </td>

                    {/* THETA 1 */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.1"
                        value={obs.theta1}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'theta1', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-red-600 w-full shadow-inner"
                      />
                    </td>

                    {/* THETA 2 */}
                    <td className="p-2 border-r border-slate-100 dark:border-slate-800">
                      <input
                        type="number"
                        step="0.1"
                        value={obs.theta2}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'theta2', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-blue-600 outline-none focus:border-red-600 w-full shadow-inner"
                      />
                    </td>

                    {/* CALCULATED FIELDS */}
                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {obs.angleDiff.toFixed(2)}°
                    </td>

                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {obs.torqueT.toFixed(4)} kg-cm
                    </td>

                    {/* SHEAR STRENGTH */}
                    <td className="p-2.5 bg-red-100/40 dark:bg-red-950/40 text-right font-extrabold text-red-700 dark:text-red-300">
                      {obs.shearStrength.toFixed(6)} kg/cm²
                    </td>

                    {/* DELETE */}
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => handleDeleteRow(obs.obsNo)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                        title="Delete Reading"
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
          Calculation Details & Substitution Derivation
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 block text-[11px]">Angle Difference (Δθ)</span>
            <code className="text-xs font-bold text-blue-600 font-mono block mt-1">= θ2 − θ1</code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 block text-[11px]">Torque (T)</span>
            <code className="text-xs font-bold text-blue-600 font-mono block mt-1">= K × Δθ × (π / 180) kg-cm</code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 block text-[11px]">Shear Strength (τf)</span>
            <code className="text-xs font-bold text-red-600 font-mono block mt-1">= T / [π · d² · (H/2 + d/6)] kg/cm²</code>
          </div>
        </div>
      </div>

      {/* 4. GRAPH CARD (CHART.JS) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ChartIcon className="w-4 h-4 text-red-600" />
              Observation Trial vs Shear Strength (τf)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Measured undrained shear strength (kg/cm²) for each observation trial.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="bg-red-50 dark:bg-red-950 text-red-600 px-3 py-1 rounded-xl border border-red-200">
              Avg τf = {avgShear.toFixed(6)} kg/cm²
            </span>
          </div>
        </div>

        <div className="h-[280px] w-full p-2 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
          <Line 
            data={chartDataConfig}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top' },
                tooltip: {
                  callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} kg/cm²`
                  }
                }
              },
              scales: {
                x: { title: { display: true, text: 'Observation Trial', font: { size: 11, weight: 'bold' } } },
                y: { title: { display: true, text: 'Shear Strength τf (kg/cm²)', font: { size: 11, weight: 'bold' } } }
              }
            }}
          />
        </div>
      </div>

      {/* 5. FINAL RESULTS PANEL */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
        <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          FINAL RESULTS SUMMARY
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* AVERAGE TORQUE & SHEAR CARDS (6 COLS) */}
          <div className="md:col-span-6 grid grid-cols-2 gap-4">
            <div className="bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 rounded-xl p-5 text-center shadow-soft">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Average Torque (T)
              </span>
              <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-2 block">
                {avgTorque.toFixed(4)} <span className="text-sm font-semibold">kg-cm</span>
              </span>
            </div>

            <div className="bg-red-50/90 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-xl p-5 text-center shadow-soft">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Average Shear Strength (τf)
              </span>
              <span className="text-3xl font-extrabold text-red-600 dark:text-red-400 mt-2 block">
                {avgShear.toFixed(6)} <span className="text-sm font-semibold">kg/cm²</span>
              </span>
            </div>
          </div>

          {/* OBSERVATION BREAKDOWN (6 COLS) */}
          <div className="md:col-span-6 space-y-2 max-h-[140px] overflow-y-auto pr-1">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Trial Summary Breakdown
            </h4>
            {observations.map((obs) => (
              <div 
                key={obs.obsNo}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 text-xs font-mono"
              >
                <span className="font-bold text-slate-900 dark:text-white">Obs-{obs.obsNo}</span>
                <span className="text-blue-600">T = {obs.torqueT.toFixed(4)} kg-cm</span>
                <span className="font-bold text-red-600 dark:text-red-400">τf = {obs.shearStrength.toFixed(6)} kg/cm²</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. BOTTOM ACTION BUTTONS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-soft">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onShowToast('Vane Shear test data saved!')}
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
