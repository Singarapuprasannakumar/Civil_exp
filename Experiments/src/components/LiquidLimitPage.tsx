import React, { useState } from 'react';
import { 
  ChevronRight, Plus, Trash2, FileSpreadsheet, Save, RotateCcw, ArrowLeft, CheckCircle2, Calculator,
  Table as TableIcon, LineChart as ChartIcon
} from 'lucide-react';
import { Experiment } from '../types';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LogarithmicScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(CategoryScale, LogarithmicScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

interface LiquidLimitPageProps {
  experiment: Experiment;
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export interface LLObservation {
  obsNo: number;
  blows: number | string;
  w1: number | string;
  w2: number | string;
  w3: number | string;
  waterWeight: number | string;
  drySoilWeight: number | string;
  waterContent: number | string;
}

export const LiquidLimitPage: React.FC<LiquidLimitPageProps> = ({ experiment, onBack, onShowToast }) => {
  const [regdNo, setRegdNo] = useState<string>('REG-2026-LL01');
  const [numObsInput, setNumObsInput] = useState<number | string>(4);
  const [tableGenerated, setTableGenerated] = useState<boolean>(true);

  const computeRowValues = (obsNo: number, blows: string | number, w1: string | number, w2: string | number, w3: string | number): LLObservation => {
    let waterWeight: number | string = '-';
    let drySoilWeight: number | string = '-';
    let waterContent: number | string = '-';

    const getVal = (v: any) => typeof v === 'string' && v.trim() === '' ? null : Number(v);

    const nW1 = getVal(w1);
    const nW2 = getVal(w2);
    const nW3 = getVal(w3);

    if (nW1 !== null && nW2 !== null && nW3 !== null && !isNaN(nW1) && !isNaN(nW2) && !isNaN(nW3)) {
      const ww = nW2 - nW3;
      const dsw = nW3 - nW1;
      waterWeight = Number(ww.toFixed(3));
      drySoilWeight = Number(dsw.toFixed(3));
      
      if (dsw > 0) {
        waterContent = Number(((ww / dsw) * 100).toFixed(2));
      }
    }

    return {
      obsNo,
      blows,
      w1,
      w2,
      w3,
      waterWeight,
      drySoilWeight,
      waterContent
    };
  };

  const [observations, setObservations] = useState<LLObservation[]>([
    computeRowValues(1, 15, 22.10, 68.40, 53.70),
    computeRowValues(2, 22, 21.80, 65.20, 52.00),
    computeRowValues(3, 28, 22.50, 67.80, 54.60),
    computeRowValues(4, 38, 21.90, 63.50, 52.10)
  ]);

  const handleGenerateTable = () => {
    let c = parseInt(String(numObsInput));
    if (isNaN(c)) c = 1;
    const count = Math.max(1, Math.min(20, c));
    const newRows: LLObservation[] = [];
    const defaultBlows = [15, 22, 28, 38, 45, 52];

    for (let i = 1; i <= count; i++) {
      const b = defaultBlows[(i - 1) % defaultBlows.length] || 15 + i * 5;
      newRows.push(computeRowValues(i, b, 22.0, 65.0, 52.0));
    }
    setObservations(newRows);
    setTableGenerated(true);
    onShowToast(`Generated observation table with ${count} Casagrande trial rows.`);
  };

  const handleCellEdit = (obsNo: number, field: keyof LLObservation, val: string) => {
    setObservations(prev => prev.map(obs => {
      if (obs.obsNo !== obsNo) return obs;
      
      const newObs = { ...obs, [field]: val };
      return computeRowValues(obsNo, newObs.blows, newObs.w1, newObs.w2, newObs.w3);
    }));
  };

  const handleAddRow = () => {
    const idx = observations.length + 1;
    const newObs = computeRowValues(idx, 15 + idx * 5, 22.0, 65.0, 52.0);
    setObservations(prev => [...prev, newObs]);
    setNumObsInput(idx);
    onShowToast(`Added Observation #${idx}`);
  };

  const handleDeleteRow = (obsNo: number) => {
    setObservations(prev => {
      const filtered = prev.filter(o => o.obsNo !== obsNo).map((o, i) => computeRowValues(i + 1, o.blows, o.w1, o.w2, o.w3));
      setNumObsInput(filtered.length);
      return filtered;
    });
    onShowToast(`Deleted Observation #${obsNo}`);
  };

  const handleReset = () => {
    setRegdNo('REG-2026-LL01');
    setObservations([
      computeRowValues(1, 15, 22.10, 68.40, 53.70),
      computeRowValues(2, 22, 21.80, 65.20, 52.00),
      computeRowValues(3, 28, 22.50, 67.80, 54.60),
      computeRowValues(4, 38, 21.90, 63.50, 52.10)
    ]);
    setNumObsInput(4);
    setTableGenerated(true);
    onShowToast('Reset to initial Casagrande dataset.');
  };

  const getNumVal = (v: any) => (typeof v === 'string' && v.trim() === '') ? null : Number(v);

  const validPoints = observations.filter(o => {
    const b = getNumVal(o.blows);
    return b !== null && b > 0 && typeof o.waterContent === 'number' && o.waterContent > 0;
  }).map(o => ({ ...o, blowsNum: Number(o.blows), waterContentNum: Number(o.waterContent)}));
  
  let slopeA = 0;
  let interceptB = 0;
  let liquidLimit: number | string = '-';
  let flowIndexValue: number | string = '-';

  if (validPoints.length >= 2) {
    const logN = validPoints.map(p => Math.log10(p.blowsNum));
    const wVals = validPoints.map(p => p.waterContentNum);

    const n = validPoints.length;
    const sumX = logN.reduce((a, b) => a + b, 0);
    const sumY = wVals.reduce((a, b) => a + b, 0);
    const sumXY = logN.reduce((sum, x, i) => sum + x * wVals[i], 0);
    const sumX2 = logN.reduce((sum, x) => sum + x * x, 0);

    const denom = n * sumX2 - sumX * sumX;
    if (denom !== 0) {
      slopeA = (n * sumXY - sumX * sumY) / denom;
      interceptB = (sumY - slopeA * sumX) / n;
      liquidLimit = slopeA * Math.log10(25) + interceptB;
    }

    const sortedPoints = [...validPoints].sort((a, b) => a.blowsNum - b.blowsNum);
    const p1 = sortedPoints[0];
    const p2 = sortedPoints[sortedPoints.length - 1];
    
    if (p1.blowsNum > 0 && p2.blowsNum > 0 && p1.blowsNum !== p2.blowsNum) {
       flowIndexValue = (p1.waterContentNum - p2.waterContentNum) / Math.log10(p2.blowsNum / p1.blowsNum);
    }
  }

  const flowCurveX = [10, 15, 20, 25, 30, 40, 50, 60, 80, 100];
  const flowCurveY = flowCurveX.map(x => typeof liquidLimit === 'number' ? slopeA * Math.log10(x) + interceptB : null);

  const chartDataConfig = {
    datasets: [
      {
        label: 'Flow Line (Regression Fit)',
        data: flowCurveX.map((x, i) => ({ x, y: flowCurveY[i] })).filter(d => d.y !== null),
        borderColor: '#2563EB',
        borderWidth: 2.5,
        pointRadius: 0,
        fill: false,
        tension: 0,
        showLine: true
      },
      {
        label: 'Observed Trial Values',
        data: validPoints.map(p => ({ x: p.blowsNum, y: p.waterContentNum })),
        backgroundColor: '#EF4444',
        borderColor: '#DC2626',
        pointRadius: 7,
        pointHoverRadius: 9,
        showLine: false
      },
      {
        label: 'Vertical N=25 Reference Line',
        data: typeof liquidLimit === 'number' ? [{ x: 25, y: 0 }, { x: 25, y: liquidLimit }] : [],
        borderColor: '#10B981',
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        showLine: true
      },
      {
        label: 'Liquid Limit @ 25 Blows',
        data: typeof liquidLimit === 'number' ? [{ x: 25, y: liquidLimit }] : [],
        backgroundColor: '#10B981',
        borderColor: '#059669',
        pointRadius: 11,
        pointStyle: 'rectRot',
        showLine: false,
        borderWidth: 2
      }
    ]
  };

  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Regd. No.,Observation No.,Number of Blows (N),Weight of Cup (W1) (g),Weight of Cup + Wet Soil (W2) (g),Weight of Cup + Dry Soil (W3) (g),Weight of Water (g),Dry Soil Weight (g),Water Content (%)\n";

    const formatVal = (v: any) => {
        if (v === '-' || v === null || v === '') return '';
        if (typeof v === 'number') return v.toFixed(3);
        const nv = Number(v);
        return isNaN(nv) ? '' : nv.toFixed(3);
    };

    observations.forEach(o => {
      csvContent += `${regdNo},${o.obsNo},${o.blows},${formatVal(o.w1)},${formatVal(o.w2)},${formatVal(o.w3)},${formatVal(o.waterWeight)},${formatVal(o.drySoilWeight)},${typeof o.waterContent === 'number' ? o.waterContent.toFixed(2) : ''}\n`;
    });

    csvContent += `\n${regdNo},,,,,,,Liquid Limit (%),${typeof liquidLimit === 'number' ? liquidLimit.toFixed(2) : ''}\n`;

    csvContent += "\nProject:,GeoTech Lab - Soil Testing Suite\n";
    csvContent += "Created & Developed By:,Singarapu Prasanna Kumar\n";
    csvContent += "Copyright:,© " + new Date().getFullYear() + " Singarapu Prasanna Kumar. All Rights Reserved.\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Liquid_Limit_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast("Exported to Liquid_Limit_Results.csv matching Python openpyxl format!");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <button onClick={onBack} className="hover:underline flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </button>
          <ChevronRight className="w-4 h-4" />
          <span className="font-semibold text-amber-600 dark:text-amber-400">Liquid Limit</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span>[03]</span>
              <span>Liquid Limit Test</span>
              <span className="text-[11px] font-semibold bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>IS 2720 Part 5 / ASTM D4318</span>
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Determine the Liquid Limit of soil using the Casagrande apparatus and Flow Curve method.
            </p>
          </div>

          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
        <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <TableIcon className="w-5 h-5 text-amber-600" />
          Test Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Registration Number
            </label>
            <input
              type="text"
              value={regdNo}
              onChange={(e) => setRegdNo(e.target.value)}
              placeholder="REG-2026-LL01"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-[11px] font-semibold text-slate-900 dark:text-white outline-none focus:border-amber-600"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Number of Observations (Trials)
            </label>
            <input
              type="text"
              value={numObsInput}
              onChange={(e) => setNumObsInput(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-[11px] font-bold text-slate-900 dark:text-white outline-none focus:border-amber-600 text-center"
            />
          </div>

          <button
            onClick={handleGenerateTable}
            className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] py-2.5 rounded-xl shadow-md shadow-amber-600/20 transition-all hover:scale-102 col-span-2 sm:col-span-1"
          >
            <TableIcon className="w-5 h-5" />
            <span>Generate Table</span>
          </button>
        </div>
      </div>

      {tableGenerated && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Observation Table ({observations.length} Casagrande Trials)
            </h3>

            <button
              onClick={handleAddRow}
              className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-[11px] px-4 py-2 rounded-xl transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Row</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border-collapse min-w-[980px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase tracking-wider">
                  <th className="p-3 border-r border-slate-200 dark:border-slate-700" colSpan={1}>Obs</th>
                  <th className="p-3 border-r border-slate-200 dark:border-slate-700 text-center bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300" colSpan={4}>
                    Inputs (Casagrande Test Values)
                  </th>
                  <th className="p-3 text-center bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300" colSpan={3}>
                    Calculated (Automatic Formulas)
                  </th>
                  <th className="p-3 text-center" colSpan={1}>Action</th>
                </tr>

                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px]">
                  <th className="p-3 border-r border-slate-200 dark:border-slate-800">Observation No.</th>
                  <th className="p-3">Number of Blows (N)</th>
                  <th className="p-3">Weight of Cup (W1) (g)</th>
                  <th className="p-3">Weight of Cup + Wet Soil (W2) (g)</th>
                  <th className="p-3 border-r border-slate-200 dark:border-slate-800">Weight of Cup + Dry Soil (W3) (g)</th>
                  
                  <th className="p-3 bg-slate-100/40 dark:bg-slate-800/30">Weight of Water (g)</th>
                  <th className="p-3 bg-slate-100/40 dark:bg-slate-800/30">Dry Soil Weight (g)</th>
                  <th className="p-3 bg-amber-100/50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 text-right font-bold">Water Content (%)</th>
                  <th className="p-3 text-center">Delete</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {observations.map((obs) => (
                  <tr key={obs.obsNo} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3 font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800">
                      Obs-{obs.obsNo}
                    </td>

                    <td className="p-2">
                      <input
                        type="text"
                        value={obs.blows}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'blows', e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-[11px] font-bold text-blue-600 outline-none focus:border-blue-600 w-full shadow-inner text-center"
                      />
                    </td>

                    <td className="p-2">
                      <input
                        type="text"
                        value={obs.w1}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'w1', e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-[11px] outline-none focus:border-blue-600 w-full shadow-inner"
                      />
                    </td>

                    <td className="p-2">
                      <input
                        type="text"
                        value={obs.w2}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'w2', e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-[11px] outline-none focus:border-blue-600 w-full shadow-inner"
                      />
                    </td>

                    <td className="p-2 border-r border-slate-100 dark:border-slate-800">
                      <input
                        type="text"
                        value={obs.w3}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'w3', e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 text-[11px] outline-none focus:border-blue-600 w-full shadow-inner"
                      />
                    </td>

                    <td className="p-3 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 text-center">
                      {obs.waterWeight !== '-' ? `${obs.waterWeight}` : '-'}
                    </td>

                    <td className="p-3 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 text-center">
                      {obs.drySoilWeight !== '-' ? `${obs.drySoilWeight}` : '-'}
                    </td>

                    <td className="p-3 bg-amber-100/40 dark:bg-amber-950/40 text-right font-extrabold text-amber-700 dark:text-amber-300 text-[11px]">
                      {obs.waterContent !== '-' ? `${obs.waterContent}` : '-'}
                    </td>

                    <td className="p-3 text-center">
                      <button
                        onClick={() => handleDeleteRow(obs.obsNo)}
                        className="text-slate-400 hover:text-red-500 p-1.5 rounded transition-colors"
                        title="Delete Trial"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-soft space-y-3">
        <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
          <Calculator className="w-5 h-5 text-amber-600" />
          Calculation Details & Regression Formulas
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-[11px]">
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Weight of Water</span>
            <code className="text-[11px] font-bold text-blue-600 dark:text-blue-400 font-mono block mt-1">
              = W2 − W3
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Dry Soil Weight</span>
            <code className="text-[11px] font-bold text-blue-600 dark:text-blue-400 font-mono block mt-1">
              = W3 − W1
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Water Content (w %)</span>
            <code className="text-[11px] font-bold text-amber-600 dark:text-amber-400 font-mono block mt-1">
              = (W2 − W3) ÷ (W3 − W1) × 100
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Flow Index (If)</span>
            <code className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono block mt-1 break-words">
              If = (w1 − w2) / log10(n2 / n1)
            </code>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ChartIcon className="w-5 h-5 text-blue-600" />
              Liquid Limit Flow Curve
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Regression: w = a × log10(N) + b. LL evaluated at N = 25.
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-4 py-2 rounded-xl border border-emerald-200 dark:border-emerald-800">
            <span>LL @ 25 Blows = {typeof liquidLimit === 'number' ? liquidLimit.toFixed(2) : '-'} %</span>
          </div>
        </div>

        <div className="h-[400px] w-full p-2 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
          <Line 
            data={chartDataConfig} 
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top', labels: { font: { size: 14 } } },
                tooltip: {
                  bodyFont: { size: 14 },
                  titleFont: { size: 14 },
                  callbacks: {
                    label: (ctx: any) => `${ctx.dataset.label}: ${Number(ctx.raw?.y || ctx.raw).toFixed(2)}%`,
                    title: (ctx: any) => `Blows: ${ctx[0].raw?.x || ctx[0].label}`
                  }
                },
                annotation: typeof liquidLimit === 'number' ? {
                  annotations: {
                    label1: {
                      type: 'label',
                      xValue: 25,
                      yValue: liquidLimit + (flowCurveY[0]! - flowCurveY[8]!) * 0.1,
                      backgroundColor: 'rgba(16, 185, 129, 0.9)',
                      color: 'white',
                      content: [`LL = ${liquidLimit.toFixed(2)} %`, 'N = 25 blows'],
                      font: { size: 14, weight: 'bold' },
                      padding: 6,
                      borderRadius: 4
                    }
                  }
                } : undefined
              } as any,
              scales: {
                x: {
                  type: 'logarithmic',
                  title: { display: true, text: 'Particle Size (mm) / Number of Blows (N)', font: { size: 16, weight: 'bold' } },
                  border: { display: true, color: '#1e3a8a', width: 1.5 },
                  // @ts-ignore
                  grid: { color: 'rgba(30, 58, 138, 0.35)', lineWidth: 1, borderDash: [5, 5] },
                  ticks: {
                    font: { size: 14, weight: 'bold' },
                    callback: function(value: any) {
                        return value === 10 || value === 20 || value === 25 || value === 30 || value === 40 || value === 50 || value === 60 || value === 80 || value === 100 ? value : '';
                    }
                  }
                },
                y: {
                  type: 'linear',
                  title: { display: true, text: 'Percentage Finer / Water Content (%)', font: { size: 16, weight: 'bold' } },
                  border: { display: true, color: '#1e3a8a', width: 1.5 },
                  // @ts-ignore
                  grid: { color: 'rgba(30, 58, 138, 0.35)', lineWidth: 1, borderDash: [5, 5] },
                  min: 0,
                  max: 100,
                  ticks: { 
                    font: { size: 14, weight: 'bold' },
                    stepSize: 20
                  }
                }
              }
            }} 
          />
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
        <h3 className="text-[11px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          FINAL RESULTS
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-7 space-y-2">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Observation Summary
            </h4>
            {validPoints.map((obs) => (
              <div 
                key={obs.obsNo}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 text-[11px] font-mono"
              >
                <span className="font-bold text-slate-900 dark:text-white">Observation {obs.obsNo} (N = {obs.blows})</span>
                <span className="font-bold text-amber-600 dark:text-amber-400 text-[11px]">
                  Water Content = {obs.waterContentNum.toFixed(2)} %
                </span>
              </div>
            ))}
          </div>

          <div className="md:col-span-5 bg-amber-50/90 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 rounded-xl p-6 flex flex-col justify-center text-center shadow-soft">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Liquid Limit (LL)
            </span>
            <span className="text-5xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
              {typeof liquidLimit === 'number' ? liquidLimit.toFixed(2) : '-'} %
            </span>
            <span className="text-[11px] text-slate-500 mt-3 font-semibold">
              Flow Index (If): {typeof flowIndexValue === 'number' ? flowIndexValue.toFixed(4) : '-'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-soft">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onShowToast('Liquid Limit test data saved!')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-[11px] font-bold shadow-md shadow-blue-600/20 transition-all"
          >
            <Save className="w-5 h-5" />
            <span>Save</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-[11px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <RotateCcw className="w-5 h-5 text-slate-500" />
            <span>Reset</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-[11px] font-bold shadow-md shadow-emerald-600/20 transition-all"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>Export Excel</span>
          </button>

          <button
            onClick={onBack}
            className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-[11px] font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <ArrowLeft className="w-5 h-5 text-slate-500" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
