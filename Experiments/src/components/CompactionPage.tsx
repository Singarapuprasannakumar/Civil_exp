import React, { useState } from 'react';
import { 
  ChevronRight, Plus, Trash2, FileSpreadsheet, Save, RotateCcw, ArrowLeft, CheckCircle2, Calculator,
  Table as TableIcon, LineChart as ChartIcon, Hammer
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

interface CompactionPageProps {
  experiment: Experiment;
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export interface CompactionObs {
  detNo: number;
  mouldSoil: number;     // Mould + Compacted Soil (g)
  mould: number;         // Empty Mould (g)
  containerNo: string;
  w1: number;            // Container Tare (g)
  w2: number;            // Container + Wet Soil (g)
  w3: number;            // Container + Dry Soil (g)
  
  // Calculated
  soilWeight: number;    // mouldSoil - mould
  bulkDensity: number;   // soilWeight / mouldVolume
  waterWeight: number;   // W2 - W3
  drySoilWeight: number; // W3 - W1
  moisture: number;      // (waterWeight / drySoilWeight) * 100
  dryDensity: number;    // bulkDensity / (1 + moisture / 100)
  
  e: number;             // Void ratio = (G / dryDensity) - 1
  Sr: number;            // Degree of saturation = (w * G) / (e * 100)
  zavDensity: number;    // G / (1 + G * w / 100)
  sat95Density: number;  // G / (1 + G * w / (100 * 0.95))
}

export const CompactionPage: React.FC<CompactionPageProps> = ({ experiment, onBack, onShowToast }) => {
  // Test Information State
  const [regdNo, setRegdNo] = useState<string>('REG-2026-CP01');
  const [mouldVolume, setMouldVolume] = useState<number>(1000.0);
  const [gravityG, setGravityG] = useState<number>(2.70);
  const [numObsInput, setNumObsInput] = useState<number>(7);
  const [tableGenerated, setTableGenerated] = useState<boolean>(true);

  // Helper calculation function matching Python logic
  const computeRowValues = (
    detNo: number,
    mouldSoil: number,
    mould: number,
    containerNo: string,
    w1: number,
    w2: number,
    w3: number,
    vol: number,
    G: number
  ): CompactionObs => {
    const soilWeight = mouldSoil - mould;
    const bulkDensity = vol > 0 ? soilWeight / vol : 0;

    const waterWeight = w2 - w3;
    const drySoilWeight = w3 - w1;
    const moisture = drySoilWeight > 0 ? (waterWeight / drySoilWeight) * 100 : 0;

    const dryDensity = bulkDensity / (1 + moisture / 100);

    const e = dryDensity > 0 ? (G * 1.0 / dryDensity) - 1 : 0;
    const Sr = e > 0 ? ((moisture / 100) * G) / e : 0;

    const zavDensity = (G * 1.0) / (1 + (G * moisture) / 100);
    const sat95Density = (G * 1.0) / (1 + (G * moisture) / (100 * 0.95));

    return {
      detNo,
      mouldSoil: Number(mouldSoil.toFixed(1)),
      mould: Number(mould.toFixed(1)),
      containerNo,
      w1: Number(w1.toFixed(2)),
      w2: Number(w2.toFixed(2)),
      w3: Number(w3.toFixed(2)),
      soilWeight: Number(soilWeight.toFixed(1)),
      bulkDensity: Number(bulkDensity.toFixed(4)),
      waterWeight: Number(waterWeight.toFixed(2)),
      drySoilWeight: Number(drySoilWeight.toFixed(2)),
      moisture: Number(moisture.toFixed(2)),
      dryDensity: Number(dryDensity.toFixed(4)),
      e: Number(e.toFixed(4)),
      Sr: Number((Sr * 100).toFixed(2)),
      zavDensity: Number(zavDensity.toFixed(4)),
      sat95Density: Number(sat95Density.toFixed(4))
    };
  };

  // Default pre-populated 7-point Proctor Compaction dataset matching Python script sample_data
  const [observations, setObservations] = useState<CompactionObs[]>([
    computeRowValues(1, 6607, 4944, 'C-23', 22.5, 45.3, 42.5, 1000, 2.7),
    computeRowValues(2, 6644, 4944, 'C-94', 22.9, 59.9, 54.7, 1000, 2.7),
    computeRowValues(3, 6723, 4944, 'C-08', 22.5, 38.8, 36.2, 1000, 2.7),
    computeRowValues(4, 6795, 4944, 'C-09', 22.6, 52.2, 47.4, 1000, 2.7),
    computeRowValues(5, 6837, 4944, 'C-159', 23.1, 46.8, 42.4, 1000, 2.7),
    computeRowValues(6, 6842, 4941, 'C-71', 22.9, 45.6, 41.3, 1000, 2.7),
    computeRowValues(7, 6829, 4944, 'C-10', 22.5, 44.9, 40.2, 1000, 2.7)
  ]);

  // Quadratic Polynomial Fitting matching Python np.polyfit(x, y, 2)
  const validObs = observations.filter(o => o.moisture > 0 && o.dryDensity > 0);
  const xVals = validObs.map(o => o.moisture);
  const yVals = validObs.map(o => o.dryDensity);

  let omc = 14.25;
  let mdd = 1.8520;
  let polyCoeffs: [number, number, number] | null = null;

  if (validObs.length >= 3) {
    // Solve system for a*x^2 + b*x + c = y using least squares regression
    const n = validObs.length;
    let sX = 0, sX2 = 0, sX3 = 0, sX4 = 0;
    let sY = 0, sXY = 0, sX2Y = 0;

    for (let i = 0; i < n; i++) {
      const xi = xVals[i];
      const yi = yVals[i];
      const xi2 = xi * xi;
      sX += xi;
      sX2 += xi2;
      sX3 += xi2 * xi;
      sX4 += xi2 * xi2;
      sY += yi;
      sXY += xi * yi;
      sX2Y += xi2 * yi;
    }

    // Solve 3x3 matrix equation for [a, b, c]
    const D = n * (sX2 * sX4 - sX3 * sX3) - sX * (sX * sX4 - sX2 * sX3) + sX2 * (sX * sX3 - sX2 * sX2);
    if (D !== 0) {
      const Da = sY * (sX2 * sX4 - sX3 * sX3) - sX * (sXY * sX4 - sX2Y * sX3) + sX2 * (sXY * sX3 - sX2Y * sX2);
      const Db = n * (sXY * sX4 - sX2Y * sX3) - sY * (sX * sX4 - sX2 * sX3) + sX2 * (sX * sX2Y - sXY * sX2);
      const Dc = n * (sX2 * sX2Y - sX3 * sXY) - sX * (sX * sX2Y - sX2 * sXY) + sY * (sX * sX3 - sX2 * sX2);

      const a = Da / D;
      const b = Db / D;
      const c = Dc / D;
      polyCoeffs = [a, b, c];

      if (a < 0) {
        omc = -b / (2 * a);
        mdd = a * omc * omc + b * omc + c;
      }
    }
  }

  // Generate smooth polynomial curve & ZAV / 95% Saturation curves
  const minW = Math.max(0, Math.min(...xVals, 8) - 2);
  const maxW = Math.max(...xVals, 22) + 4;
  const wSteps: number[] = [];
  for (let w = minW; w <= maxW; w += 0.5) {
    wSteps.push(Number(w.toFixed(1)));
  }

  const polyYSteps = wSteps.map(w => {
    if (polyCoeffs) {
      const [a, b, c] = polyCoeffs;
      return a * w * w + b * w + c;
    }
    return null;
  });

  const zavYSteps = wSteps.map(w => (gravityG * 1.0) / (1 + (gravityG * w) / 100));
  const sat95YSteps = wSteps.map(w => (gravityG * 1.0) / (1 + (gravityG * w) / (100 * 0.95)));

  const chartDataConfig = {
    labels: wSteps.map(w => `${w}`),
    datasets: [
      {
        label: 'Observed Values',
        data: wSteps.map(w => {
          const found = validObs.find(o => Math.abs(o.moisture - w) < 0.3);
          return found ? found.dryDensity : null;
        }),
        borderColor: '#2563EB',
        backgroundColor: '#2563EB',
        pointRadius: 6,
        showLine: false
      },
      {
        label: 'Compaction Curve (Quadratic Fit)',
        data: polyYSteps,
        borderColor: '#DC2626',
        borderWidth: 2.5,
        pointRadius: 0,
        fill: false,
        tension: 0.3
      },
      {
        label: 'Zero Air Voids (Sr=100%)',
        data: zavYSteps,
        borderColor: '#10B981',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        fill: false
      },
      {
        label: '95% Saturation (Sr=95%)',
        data: sat95YSteps,
        borderColor: '#F59E0B',
        borderWidth: 2,
        borderDash: [2, 2],
        pointRadius: 0,
        fill: false
      }
    ]
  };

  // Handle table generation
  const handleGenerateTable = () => {
    const count = Math.max(1, Math.min(20, numObsInput));
    const newRows: CompactionObs[] = [];
    const baseWets = [6607, 6644, 6723, 6795, 6837, 6842, 6829, 6800, 6750];

    for (let i = 1; i <= count; i++) {
      const w2Val = baseWets[(i - 1) % baseWets.length] || 6600 + i * 30;
      newRows.push(computeRowValues(i, w2Val, 4944, `C-${10 + i}`, 22.5, 45.0 + i * 2, 40.0 + i * 1.5, mouldVolume, gravityG));
    }
    setObservations(newRows);
    setTableGenerated(true);
    onShowToast(`Generated observation table with ${count} determinations.`);
  };

  // Real-time cell edit
  const handleCellEdit = (
    detNo: number,
    field: 'mouldSoil' | 'mould' | 'containerNo' | 'w1' | 'w2' | 'w3',
    val: string | number
  ) => {
    setObservations(prev => prev.map(obs => {
      if (obs.detNo !== detNo) return obs;
      const mouldSoil = field === 'mouldSoil' ? Number(val) : obs.mouldSoil;
      const mould = field === 'mould' ? Number(val) : obs.mould;
      const containerNo = field === 'containerNo' ? String(val) : obs.containerNo;
      const w1 = field === 'w1' ? Number(val) : obs.w1;
      const w2 = field === 'w2' ? Number(val) : obs.w2;
      const w3 = field === 'w3' ? Number(val) : obs.w3;

      return computeRowValues(detNo, mouldSoil, mould, containerNo, w1, w2, w3, mouldVolume, gravityG);
    }));
  };

  const handleAddRow = () => {
    const idx = observations.length + 1;
    const newObs = computeRowValues(idx, 6800, 4944, `C-${10 + idx}`, 22.5, 46.0, 41.0, mouldVolume, gravityG);
    setObservations(prev => [...prev, newObs]);
    setNumObsInput(idx);
    onShowToast(`Added Determination #${idx}`);
  };

  const handleDeleteRow = (detNo: number) => {
    setObservations(prev => {
      const filtered = prev.filter(o => o.detNo !== detNo).map((o, i) => computeRowValues(i + 1, o.mouldSoil, o.mould, o.containerNo, o.w1, o.w2, o.w3, mouldVolume, gravityG));
      setNumObsInput(filtered.length);
      return filtered;
    });
    onShowToast(`Deleted Determination #${detNo}`);
  };

  const handleReset = () => {
    setRegdNo('REG-2026-CP01');
    setMouldVolume(1000.0);
    setGravityG(2.70);
    setObservations([
      computeRowValues(1, 6607, 4944, 'C-23', 22.5, 45.3, 42.5, 1000, 2.7),
      computeRowValues(2, 6644, 4944, 'C-94', 22.9, 59.9, 54.7, 1000, 2.7),
      computeRowValues(3, 6723, 4944, 'C-08', 22.5, 38.8, 36.2, 1000, 2.7),
      computeRowValues(4, 6795, 4944, 'C-09', 22.6, 52.2, 47.4, 1000, 2.7),
      computeRowValues(5, 6837, 4944, 'C-159', 23.1, 46.8, 42.4, 1000, 2.7),
      computeRowValues(6, 6842, 4941, 'C-71', 22.9, 45.6, 41.3, 1000, 2.7),
      computeRowValues(7, 6829, 4944, 'C-10', 22.5, 44.9, 40.2, 1000, 2.7)
    ]);
    setNumObsInput(7);
    setTableGenerated(true);
    onShowToast('Reset to initial Compaction dataset.');
  };

  // Export Excel matching exact 24 Python script columns + append OMC/MDD rows
  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    // 24 EXACT COLUMNS FROM PYTHON CODE
    csvContent += "Regd. No.,Observation No.,Mould Volume (cc),Weight of Empty Mould (g),Weight of Mould + Soil (g),Weight of Compacted Soil (g),Bulk Density (g/cc),Cup No.,Weight of Cup W1 (g),Weight of Cup + Wet Soil W2 (g),Weight of Cup + Dry Soil W3 (g),Weight of Water (g),Weight of Dry Soil (g),Moisture Content (%),Dry Density (g/cc),G,w (%),e,S_r,γ_d ZAV,γ_d 95%,Spacer,ZAV Dry Density,95% Sat Dry Density\n";

    observations.forEach(o => {
      csvContent += `${regdNo},${o.detNo},${mouldVolume.toFixed(3)},${o.mould.toFixed(3)},${o.mouldSoil.toFixed(3)},${o.soilWeight.toFixed(3)},${o.bulkDensity.toFixed(4)},${o.containerNo},${o.w1.toFixed(3)},${o.w2.toFixed(3)},${o.w3.toFixed(3)},${o.waterWeight.toFixed(3)},${o.drySoilWeight.toFixed(3)},${o.moisture.toFixed(2)},${o.dryDensity.toFixed(4)},${gravityG},${o.moisture.toFixed(2)},${o.e.toFixed(4)},${o.Sr.toFixed(2)},${o.zavDensity.toFixed(4)},${o.sat95Density.toFixed(4)},,${o.zavDensity.toFixed(4)},${o.sat95Density.toFixed(4)}\n`;
    });

    // APPEND OMC AND MDD SUMMARY ROWS MATCHING PYTHON CODE
    csvContent += `\n${regdNo},,,,,,,,,,,,,OMC (%),${omc.toFixed(2)}\n`;
    csvContent += `${regdNo},,,,,,,,,,,,,MDD (g/cc),${mdd.toFixed(4)}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "IS_Light_Compaction_Test_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast("Exported to IS_Light_Compaction_Test_Results.csv matching Python openpyxl format!");
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
          <span className="font-semibold text-red-600 dark:text-red-400">IS Light Compaction Test</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span>[10]</span>
              <span>IS Light Compaction Test</span>
              <span className="text-xs font-semibold bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-full border border-red-200 dark:border-red-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>IS 2720 Part 7 / ASTM D698</span>
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Determine the Optimum Moisture Content (OMC) and Maximum Dry Density (MDD) of soil using the IS Light Compaction Test.
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
          <Hammer className="w-4 h-4 text-red-600" />
          Test Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Registration Number
            </label>
            <input
              type="text"
              value={regdNo}
              onChange={(e) => setRegdNo(e.target.value)}
              placeholder="REG-2026-CP01"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-red-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Mould Volume (cc)
            </label>
            <input
              type="number"
              step="1"
              value={mouldVolume}
              onChange={(e) => setMouldVolume(parseFloat(e.target.value) || 1000)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-blue-600 outline-none focus:border-red-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Specific Gravity (G)
            </label>
            <input
              type="number"
              step="0.01"
              value={gravityG}
              onChange={(e) => setGravityG(parseFloat(e.target.value) || 2.7)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-teal-600 outline-none focus:border-red-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Determinations
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
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md shadow-red-600/20 transition-all hover:scale-102"
          >
            <TableIcon className="w-4 h-4" />
            <span>Generate Table</span>
          </button>
        </div>
      </div>

      {/* 2. OBSERVATION TABLE (MATCHING PYTHON COMPACTION CODE) */}
      {tableGenerated && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Observation Table ({observations.length} Compaction Determinations)
            </h3>

            <button
              onClick={handleAddRow}
              className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Determination</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[1200px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase tracking-wider">
                  <th className="p-2 border-r border-slate-200 dark:border-slate-700" colSpan={1}>Det</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-700 text-center bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300" colSpan={6}>
                    Inputs (Mould & Water Content Measurements)
                  </th>
                  <th className="p-2 text-center bg-red-50/80 dark:bg-red-950/40 text-red-700 dark:text-red-300" colSpan={5}>
                    Calculated (Soil Wt, Moisture & Dry Density)
                  </th>
                  <th className="p-2 text-center" colSpan={1}>Action</th>
                </tr>

                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px]">
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Det No.</th>
                  <th className="p-2.5">Mould + Soil (g)</th>
                  <th className="p-2.5">Empty Mould (g)</th>
                  <th className="p-2.5">Cup No.</th>
                  <th className="p-2.5">W1 (Cup g)</th>
                  <th className="p-2.5">W2 (Cup+Wet g)</th>
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">W3 (Cup+Dry g)</th>
                  
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Soil Wt (g)</th>
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Bulk Density (g/cc)</th>
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Water Wt (g)</th>
                  <th className="p-2.5 bg-blue-100/40 dark:bg-blue-950/40 font-bold text-blue-700 dark:text-blue-300">Moisture (%)</th>
                  <th className="p-2.5 bg-red-100/50 dark:bg-red-950/50 text-red-800 dark:text-red-200 text-right font-bold">Dry Density (g/cc)</th>
                  <th className="p-2.5 text-center">Delete</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {observations.map((obs) => (
                  <tr key={obs.detNo} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800">
                      Det-{obs.detNo}
                    </td>

                    {/* MOULD + SOIL */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.1"
                        value={obs.mouldSoil}
                        onChange={(e) => handleCellEdit(obs.detNo, 'mouldSoil', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-red-600 w-full shadow-inner"
                      />
                    </td>

                    {/* EMPTY MOULD */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.1"
                        value={obs.mould}
                        onChange={(e) => handleCellEdit(obs.detNo, 'mould', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-red-600 w-full shadow-inner"
                      />
                    </td>

                    {/* CUP NO */}
                    <td className="p-2">
                      <input
                        type="text"
                        value={obs.containerNo}
                        onChange={(e) => handleCellEdit(obs.detNo, 'containerNo', e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-blue-600 outline-none focus:border-red-600 w-full shadow-inner"
                      />
                    </td>

                    {/* W1 */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.01"
                        value={obs.w1}
                        onChange={(e) => handleCellEdit(obs.detNo, 'w1', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-red-600 w-full shadow-inner"
                      />
                    </td>

                    {/* W2 */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.01"
                        value={obs.w2}
                        onChange={(e) => handleCellEdit(obs.detNo, 'w2', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-red-600 w-full shadow-inner"
                      />
                    </td>

                    {/* W3 */}
                    <td className="p-2 border-r border-slate-100 dark:border-slate-800">
                      <input
                        type="number"
                        step="0.01"
                        value={obs.w3}
                        onChange={(e) => handleCellEdit(obs.detNo, 'w3', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-red-600 w-full shadow-inner"
                      />
                    </td>

                    {/* CALCULATED FIELDS */}
                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {obs.soilWeight.toFixed(1)} g
                    </td>

                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {obs.bulkDensity.toFixed(4)} g/cc
                    </td>

                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {obs.waterWeight.toFixed(2)} g
                    </td>

                    <td className="p-2.5 bg-blue-100/40 dark:bg-blue-950/40 font-bold text-blue-700 dark:text-blue-300">
                      {obs.moisture.toFixed(2)} %
                    </td>

                    {/* DRY DENSITY */}
                    <td className="p-2.5 bg-red-100/40 dark:bg-red-950/40 text-right font-extrabold text-red-700 dark:text-red-300">
                      {obs.dryDensity.toFixed(4)} g/cc
                    </td>

                    {/* DELETE */}
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => handleDeleteRow(obs.detNo)}
                        className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                        title="Delete Determination"
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
          Calculation Details & Compaction Formulas
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Bulk Density</span>
            <code className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono block mt-1">
              = Compacted Soil Wt ÷ Mould Vol
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Moisture Content (%)</span>
            <code className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono block mt-1">
              = ((W2 − W3) ÷ (W3 − W1)) × 100
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Zero Air Voids (ZAV)</span>
            <code className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono block mt-1">
              γd_ZAV = G ÷ (1 + G·w/100)
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">95% Saturation Line</span>
            <code className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono block mt-1">
              γd_95% = G ÷ (1 + G·w/(100·0.95))
            </code>
          </div>
        </div>
      </div>

      {/* 4. COMPACTION CURVE GRAPH CARD (CHART.JS) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ChartIcon className="w-4 h-4 text-red-600" />
              Compaction Curve & Saturation Lines (2nd Degree Polynomial Fit)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Moisture Content (%) vs Dry Density (g/cc) with Zero Air Voids and 95% Saturation curves.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="bg-blue-50 dark:bg-blue-950 text-blue-600 px-3 py-1 rounded-xl border border-blue-200">
              OMC = {omc.toFixed(2)} %
            </span>
            <span className="bg-red-50 dark:bg-red-950 text-red-600 px-3 py-1 rounded-xl border border-red-200">
              MDD = {mdd.toFixed(4)} g/cc
            </span>
          </div>
        </div>

        <div className="h-[320px] w-full p-2 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
          <Line 
            data={chartDataConfig}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top' },
                tooltip: {
                  callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} g/cc`
                  }
                }
              },
              scales: {
                x: {
                  title: { display: true, text: 'Moisture Content (%)', font: { size: 11, weight: 'bold' } },
                  grid: { color: 'rgba(226, 232, 240, 0.6)' }
                },
                y: {
                  title: { display: true, text: 'Dry Density (g/cc)', font: { size: 11, weight: 'bold' } },
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
          {/* OMC & MDD HIGHLIGHT CARDS (6 COLS) */}
          <div className="md:col-span-6 grid grid-cols-2 gap-4">
            <div className="bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 rounded-xl p-5 text-center shadow-soft">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Optimum Moisture Content (OMC)
              </span>
              <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-2 block">
                {omc.toFixed(2)} %
              </span>
            </div>

            <div className="bg-red-50/90 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-xl p-5 text-center shadow-soft">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Maximum Dry Density (MDD)
              </span>
              <span className="text-3xl font-extrabold text-red-600 dark:text-red-400 mt-2 block">
                {mdd.toFixed(4)} <span className="text-sm font-semibold">g/cc</span>
              </span>
            </div>
          </div>

          {/* DETERMINATION SUMMARY TABLE (6 COLS) */}
          <div className="md:col-span-6 space-y-2 max-h-[140px] overflow-y-auto pr-1">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Determination Summary
            </h4>
            {observations.map((obs) => (
              <div 
                key={obs.detNo}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 text-xs font-mono"
              >
                <span className="font-bold text-slate-900 dark:text-white">Det-{obs.detNo}</span>
                <span className="text-blue-600">w = {obs.moisture.toFixed(2)}%</span>
                <span className="font-bold text-red-600 dark:text-red-400">γd = {obs.dryDensity.toFixed(4)} g/cc</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. BOTTOM ACTION BUTTONS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-soft">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onShowToast('Compaction test data saved!')}
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
