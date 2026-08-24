import React, { useState } from 'react';
import { 
  ChevronRight, Plus, Trash2, FileSpreadsheet, Save, RotateCcw, ArrowLeft, CheckCircle2, Calculator,
  Table as TableIcon, LineChart as ChartIcon, ShieldCheck, AlertTriangle, AlertCircle, Check
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

interface CBRPageProps {
  experiment: Experiment;
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export interface CBRObservation {
  sNo: number;
  penDial: number;      // Divisions
  prr: number;          // Proving Ring Reading (Divisions)
  remarks: string;

  // Calculated
  penetration: number;  // mm = penDial * leastCount
  load: number;         // kg = prr * provingRingConstant
  correctedLoad: number;// kg
}

export const CBRPage: React.FC<CBRPageProps> = ({ experiment, onBack, onShowToast }) => {
  // Step 1: Test Information State
  const [regdNo, setRegdNo] = useState<string>('REG-2026-CBR01');
  const [provingConstant, setProvingConstant] = useState<number>(1.5); // kg/div
  const [surchargeWeight, setSurchargeWeight] = useState<number>(5.0); // kg
  const [leastCount, setLeastCount] = useState<number>(0.01);        // mm/div
  const [dryDensity, setDryDensity] = useState<number>(1.85);        // g/cc
  const [moistureContent, setMoistureContent] = useState<number>(12.5);  // %
  const [useRepeatedResult, setUseRepeatedResult] = useState<boolean>(false);

  // Pre-populated default CBR observation dataset matching Python sample data
  const initialRawRows = [
    { sNo: 1, penDial: 50, prr: 12, remarks: "" },
    { sNo: 2, penDial: 100, prr: 25, remarks: "" },
    { sNo: 3, penDial: 150, prr: 38, remarks: "" },
    { sNo: 4, penDial: 200, prr: 52, remarks: "" },
    { sNo: 5, penDial: 250, prr: 68, remarks: "" },
    { sNo: 6, penDial: 300, prr: 85, remarks: "" },
    { sNo: 7, penDial: 400, prr: 115, remarks: "" },
    { sNo: 8, penDial: 500, prr: 148, remarks: "" },
    { sNo: 9, penDial: 750, prr: 225, remarks: "" },
    { sNo: 10, penDial: 1000, prr: 305, remarks: "" },
    { sNo: 11, penDial: 1250, prr: 400, remarks: "" }
  ];

  const [rawRows, setRawRows] = useState(initialRawRows);

  // Step 3: Concavity Analysis matching Python script check_concavity
  const checkConcavity = (penVals: number[], loadVals: number[]) => {
    if (penVals.length < 5) return { detected: false, idx: -1 };

    const slopes: number[] = [];
    for (let i = 1; i < penVals.length; i++) {
      const dPen = penVals[i] - penVals[i - 1];
      if (dPen !== 0) {
        slopes.push((loadVals[i] - loadVals[i - 1]) / dPen);
      } else {
        slopes.push(0);
      }
    }

    const maxLoad = Math.max(...loadVals, 1);
    const thresholdLoad = 0.05 * maxLoad;
    let zeroPoints = 0;
    for (let i = 0; i < loadVals.length; i++) {
      if (loadVals[i] <= thresholdLoad) zeroPoints++;
      else break;
    }

    if (zeroPoints >= 2 && zeroPoints < loadVals.length - 2) {
      let significantIncrease = false;
      const flatSlopes = slopes.slice(0, Math.max(1, zeroPoints - 1));
      const avgSlopeFlat = flatSlopes.reduce((a, b) => a + b, 0) / flatSlopes.length;

      for (let i = zeroPoints; i < Math.min(zeroPoints + 3, slopes.length); i++) {
        if (avgSlopeFlat > 0) {
          if (slopes[i] / avgSlopeFlat > 10) { significantIncrease = true; break; }
        } else {
          if (slopes[i] > 2) { significantIncrease = true; break; }
        }
      }
      if (significantIncrease) return { detected: true, idx: zeroPoints };
    }

    return { detected: false, idx: -1 };
  };

  // Perform Calculations
  const penVals = rawRows.map(r => Number((r.penDial * leastCount).toFixed(3)));
  const loadVals = rawRows.map(r => Number((r.prr * provingConstant).toFixed(2)));

  const concavityRes = checkConcavity(penVals, loadVals);
  const concavityDetected = concavityRes.detected;
  const concavityIdx = concavityRes.idx;

  // Apply initial correction if concavity detected
  const correctedLoadVals = loadVals.map((load, i) => {
    if (concavityDetected && concavityIdx > 0) {
      const shiftLoad = loadVals[concavityIdx - 1];
      return i >= concavityIdx ? Number(Math.max(0, load - shiftLoad).toFixed(2)) : 0;
    }
    return load;
  });

  const observations: CBRObservation[] = rawRows.map((r, i) => ({
    sNo: r.sNo,
    penDial: r.penDial,
    prr: r.prr,
    remarks: r.remarks,
    penetration: penVals[i],
    load: loadVals[i],
    correctedLoad: correctedLoadVals[i]
  }));

  // Step 4 & 5: Load Interpolation & CBR Calculations
  const interpolateLoad = (targetPen: number, pArr: number[], lArr: number[]): number => {
    for (let i = 0; i < pArr.length - 1; i++) {
      if (pArr[i] <= targetPen && targetPen <= pArr[i + 1]) {
        const x1 = pArr[i], x2 = pArr[i + 1];
        const y1 = lArr[i], y2 = lArr[i + 1];
        if (x2 - x1 !== 0) {
          return y1 + ((y2 - y1) * (targetPen - x1)) / (x2 - x1);
        }
      }
    }
    const closestIdx = pArr.reduce((prev, curr, idx) => Math.abs(curr - targetPen) < Math.abs(pArr[prev] - targetPen) ? idx : prev, 0);
    return lArr[closestIdx] || 0;
  };

  const stdLoads = { 2.5: 1370, 5.0: 2055 };

  const load25 = interpolateLoad(2.5, penVals, loadVals);
  const load50 = interpolateLoad(5.0, penVals, loadVals);
  const correctedLoad25 = interpolateLoad(2.5, penVals, correctedLoadVals);
  const correctedLoad50 = interpolateLoad(5.0, penVals, correctedLoadVals);

  const cbr25 = (load25 / stdLoads[2.5]) * 100;
  const cbr50 = (load50 / stdLoads[5.0]) * 100;

  const correctedCbr25 = (correctedLoad25 / stdLoads[2.5]) * 100;
  const correctedCbr50 = (correctedLoad50 / stdLoads[5.0]) * 100;

  const finalCbr25 = concavityDetected ? correctedCbr25 : cbr25;
  const finalCbr50 = concavityDetected ? correctedCbr50 : cbr50;

  // Step 6: Final CBR Decision (IS 2720 Part 16)
  let finalCbr = finalCbr25;
  let finalPenetration = 2.5;
  let testValid = true;

  if (finalCbr25 >= finalCbr50) {
    finalCbr = finalCbr25;
    finalPenetration = 2.5;
    testValid = true;
  } else {
    testValid = false;
    if (useRepeatedResult) {
      finalCbr = finalCbr50;
      finalPenetration = 5.0;
    } else {
      finalCbr = finalCbr25;
      finalPenetration = 2.5;
    }
  }

  // Step 7: Subgrade Rating
  const getSubgradeRating = (val: number) => {
    if (val <= 3) return { rating: "Poor", color: "text-red-600 bg-red-50 border-red-200 dark:bg-red-950 dark:text-red-400", reco: "Poor subgrade strength; subbase or stabilization required." };
    if (val <= 5) return { rating: "Normal", color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:text-amber-400", reco: "Fair subgrade strength; standard pavement thickness needed." };
    if (val <= 15) return { rating: "Good", color: "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400", reco: "Good subgrade strength; economical pavement section." };
    return { rating: "Excellent", color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:text-blue-400", reco: "Excellent subgrade strength; minimal pavement thickness needed." };
  };

  const ratingInfo = getSubgradeRating(finalCbr);

  // Step 8: Load-Penetration Chart.js Graph
  const chartLabels = penVals.map(p => `${p.toFixed(2)} mm`);
  const chartDataConfig = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Original Load (kg)',
        data: loadVals,
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: '#2563EB',
        fill: false,
        tension: 0.2
      },
      ...(concavityDetected ? [{
        label: 'Corrected Load (kg)',
        data: correctedLoadVals,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 2.5,
        borderDash: [4, 4],
        pointRadius: 5,
        pointBackgroundColor: '#10B981',
        fill: false,
        tension: 0.2
      }] : [])
    ]
  };

  // Real-time cell edit
  const handleCellEdit = (sNo: number, field: 'penDial' | 'prr' | 'remarks', val: string | number) => {
    setRawRows(prev => prev.map(row => {
      if (row.sNo !== sNo) return row;
      return {
        ...row,
        [field]: field === 'remarks' ? String(val) : (parseFloat(String(val)) || 0)
      };
    }));
  };

  const handleAddRow = () => {
    const idx = rawRows.length + 1;
    const lastPen = rawRows.length > 0 ? rawRows[rawRows.length - 1].penDial + 250 : 1500;
    const lastPRR = rawRows.length > 0 ? rawRows[rawRows.length - 1].prr + 80 : 450;
    setRawRows(prev => [...prev, { sNo: idx, penDial: lastPen, prr: lastPRR, remarks: "" }]);
    onShowToast(`Added observation #${idx}`);
  };

  const handleDeleteRow = (sNo: number) => {
    setRawRows(prev => prev.filter(r => r.sNo !== sNo).map((r, i) => ({ ...r, sNo: i + 1 })));
    onShowToast(`Deleted observation #${sNo}`);
  };

  const handleReset = () => {
    setRegdNo('REG-2026-CBR01');
    setProvingConstant(1.5);
    setSurchargeWeight(5.0);
    setLeastCount(0.01);
    setDryDensity(1.85);
    setMoistureContent(12.5);
    setUseRepeatedResult(false);
    setRawRows(initialRawRows);
    onShowToast('Reset to initial CBR dataset.');
  };

  // Export Excel matching exact Python workbook structure
  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "CALIFORNIA BEARING RATIO (CBR) TEST RESULTS\n\n";
    csvContent += `Registration No.,${regdNo}\n`;
    csvContent += `Proving Ring Constant,${provingConstant} kg/division\n`;
    csvContent += `Surcharge Weight,${surchargeWeight} kg\n`;
    csvContent += `Least Count of Penetration Dial,${leastCount} mm/division\n`;
    csvContent += `Dry Density,${dryDensity.toFixed(2)} g/cc\n`;
    csvContent += `Moisture Content,${moistureContent.toFixed(2)} %\n`;
    csvContent += `Concavity Detected,${concavityDetected ? 'Yes' : 'No'}\n\n`;

    csvContent += "S. No.,Penetration (mm),Load (kg),Corrected Load (kg),CBR (%),Corrected CBR (%),Remarks\n";
    observations.forEach(o => {
      let cbrVal = "";
      let corrCbrVal = "";
      if (o.penetration <= 2.5 && o.penetration > 0) {
        cbrVal = ((o.load / 1370) * 100).toFixed(2);
        corrCbrVal = ((o.correctedLoad / 1370) * 100).toFixed(2);
      } else if (o.penetration <= 5.0 && o.penetration > 0) {
        cbrVal = ((o.load / 2055) * 100).toFixed(2);
        corrCbrVal = ((o.correctedLoad / 2055) * 100).toFixed(2);
      }
      csvContent += `${o.sNo},${o.penetration.toFixed(3)},${o.load.toFixed(2)},${o.correctedLoad.toFixed(2)},${cbrVal},${corrCbrVal},${o.remarks}\n`;
    });

    csvContent += `\nSUMMARY OF RESULTS\n`;
    csvContent += `Load at 2.5 mm,${load25.toFixed(2)} kg,CBR at 2.5 mm,${cbr25.toFixed(2)} %\n`;
    csvContent += `Load at 5.0 mm,${load50.toFixed(2)} kg,CBR at 5.0 mm,${cbr50.toFixed(2)} %\n`;
    if (concavityDetected) {
      csvContent += `Corrected Load at 2.5 mm,${correctedLoad25.toFixed(2)} kg,Corrected CBR at 2.5 mm,${correctedCbr25.toFixed(2)} %\n`;
      csvContent += `Corrected Load at 5.0 mm,${correctedLoad50.toFixed(2)} kg,Corrected CBR at 5.0 mm,${correctedCbr50.toFixed(2)} %\n`;
    }
    csvContent += `\nFINAL CBR VALUE\n`;
    csvContent += `CBR = ${finalCbr.toFixed(2)} % at ${finalPenetration.toFixed(1)} mm penetration,Status: ${testValid ? 'TEST VALID' : 'TEST NEEDS REPETITION'},Rating: ${ratingInfo.rating}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "cbr_test_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast("Exported to cbr_test_results.csv matching Python openpyxl format!");
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
          <span className="font-semibold text-blue-600 dark:text-blue-400">California Bearing Ratio (CBR) Test</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span>[16]</span>
              <span>California Bearing Ratio (CBR) Test</span>
              <span className="text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>IS 2720 Part 16 / ASTM D1883</span>
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Determine the California Bearing Ratio (CBR) of subgrade soil using penetration test data and evaluate subgrade strength classification.
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

      {/* STEP 1: TEST INFORMATION CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          Test Information & Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Registration Number</label>
            <input
              type="text"
              value={regdNo}
              onChange={(e) => setRegdNo(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Proving Ring Constant (kg/div)</label>
            <input
              type="number"
              step="0.1"
              value={provingConstant}
              onChange={(e) => setProvingConstant(parseFloat(e.target.value) || 1.5)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-blue-600 outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Surcharge Weight (kg)</label>
            <input
              type="number"
              step="0.5"
              value={surchargeWeight}
              onChange={(e) => setSurchargeWeight(parseFloat(e.target.value) || 5.0)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Penetration Dial Least Count (mm/div)</label>
            <input
              type="number"
              step="0.001"
              value={leastCount}
              onChange={(e) => setLeastCount(parseFloat(e.target.value) || 0.01)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-blue-600 outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Dry Density (g/cc)</label>
            <input
              type="number"
              step="0.01"
              value={dryDensity}
              onChange={(e) => setDryDensity(parseFloat(e.target.value) || 1.85)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-emerald-600 outline-none focus:border-blue-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Moisture Content (%)</label>
            <input
              type="number"
              step="0.1"
              value={moistureContent}
              onChange={(e) => setMoistureContent(parseFloat(e.target.value) || 12.5)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-amber-600 outline-none focus:border-blue-600"
            />
          </div>
        </div>
      </div>

      {/* STEP 3: CONCAVITY STATUS BADGE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-soft flex items-center justify-between">
        <div className="flex items-center gap-3">
          {concavityDetected ? (
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          )}
          <div>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Concavity Analysis: {concavityDetected ? 'Initial Concavity Detected' : 'No Concavity Detected'}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {concavityDetected 
                ? 'Applied initial curve correction (shifted origin load).' 
                : 'Load-penetration curve exhibits standard convex shape.'}
            </p>
          </div>
        </div>

        <div className={`px-3 py-1 rounded-full text-xs font-bold border ${
          concavityDetected 
            ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 border-amber-300' 
            : 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border-emerald-300'
        }`}>
          {concavityDetected ? 'Correction Active' : 'Normal Curve'}
        </div>
      </div>

      {/* STEP 2: OBSERVATION TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Observation Table ({observations.length} Penetration Points)
          </h3>

          <button
            onClick={handleAddRow}
            className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Add Point</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase tracking-wider">
                <th className="p-2 border-r border-slate-200 dark:border-slate-700" colSpan={1}>S.No</th>
                <th className="p-2 border-r border-slate-200 dark:border-slate-700 text-center bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300" colSpan={3}>
                  Editable Inputs (Readings & Remarks)
                </th>
                <th className="p-2 text-center bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300" colSpan={3}>
                  Read-Only Calculations (Penetration & Loads)
                </th>
                <th className="p-2 text-center" colSpan={1}>Action</th>
              </tr>

              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px]">
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">S.No.</th>
                <th className="p-2.5">Penetration Dial (Div)</th>
                <th className="p-2.5">Proving Ring (PRR)</th>
                <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Remarks</th>
                
                <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Penetration (mm)</th>
                <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Load (kg)</th>
                <th className="p-2.5 bg-emerald-100/50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 font-bold text-right">Corrected Load (kg)</th>
                <th className="p-2.5 text-center">Delete</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
              {observations.map((obs) => (
                <tr key={obs.sNo} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-2.5 font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800">
                    {obs.sNo}
                  </td>

                  {/* PENETRATION DIAL */}
                  <td className="p-2">
                    <input
                      type="number"
                      step="1"
                      value={obs.penDial}
                      onChange={(e) => handleCellEdit(obs.sNo, 'penDial', e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-blue-600 outline-none focus:border-blue-600 w-full shadow-inner"
                    />
                  </td>

                  {/* PROVING RING READING */}
                  <td className="p-2">
                    <input
                      type="number"
                      step="1"
                      value={obs.prr}
                      onChange={(e) => handleCellEdit(obs.sNo, 'prr', e.target.value)}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-blue-600 outline-none focus:border-blue-600 w-full shadow-inner"
                    />
                  </td>

                  {/* REMARKS */}
                  <td className="p-2 border-r border-slate-100 dark:border-slate-800">
                    <input
                      type="text"
                      value={obs.remarks}
                      onChange={(e) => handleCellEdit(obs.sNo, 'remarks', e.target.value)}
                      placeholder="Optional"
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-blue-600 w-full shadow-inner"
                    />
                  </td>

                  {/* READ ONLY CALCULATED */}
                  <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 font-bold">
                    {obs.penetration.toFixed(2)} mm
                  </td>

                  <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                    {obs.load.toFixed(2)} kg
                  </td>

                  <td className="p-2.5 bg-emerald-100/40 dark:bg-emerald-950/40 text-right font-extrabold text-emerald-700 dark:text-emerald-300">
                    {obs.correctedLoad.toFixed(2)} kg
                  </td>

                  {/* DELETE */}
                  <td className="p-2.5 text-center">
                    <button
                      onClick={() => handleDeleteRow(obs.sNo)}
                      className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                      title="Delete Point"
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

      {/* STEP 9: CALCULATION DETAILS */}
      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-soft space-y-3">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
          <Calculator className="w-4 h-4 text-blue-600" />
          Calculation Details & IS 2720 Part 16 Governing Formulas
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 block text-[11px]">Penetration (mm)</span>
            <code className="text-xs font-bold text-blue-600 font-mono block mt-1">= Dial Reading × Least Count</code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 block text-[11px]">Load (kg)</span>
            <code className="text-xs font-bold text-blue-600 font-mono block mt-1">= PRR × Ring Constant</code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 block text-[11px]">CBR Percentage</span>
            <code className="text-xs font-bold text-emerald-600 font-mono block mt-1">= (Measured / Standard) × 100</code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 block text-[11px]">Standard Loads</span>
            <code className="text-xs font-bold text-emerald-600 font-mono block mt-1">2.5mm: 1370kg | 5.0mm: 2055kg</code>
          </div>
        </div>
      </div>

      {/* STEP 8: LOAD-PENETRATION GRAPH */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ChartIcon className="w-4 h-4 text-blue-600" />
              Load vs Penetration Curve
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Penetration (mm) vs Load (kg) with standard penetration markers at 2.5 mm and 5.0 mm.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="bg-blue-50 dark:bg-blue-950 text-blue-600 px-3 py-1 rounded-xl border border-blue-200">
              CBR 2.5mm = {finalCbr25.toFixed(2)}%
            </span>
            <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-600 px-3 py-1 rounded-xl border border-emerald-200">
              CBR 5.0mm = {finalCbr50.toFixed(2)}%
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
                    label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} kg`
                  }
                }
              },
              scales: {
                x: { title: { display: true, text: 'Penetration (mm)', font: { size: 11, weight: 'bold' } } },
                y: { title: { display: true, text: 'Load (kg)', font: { size: 11, weight: 'bold' } } }
              }
            }}
          />
        </div>
      </div>

      {/* STEP 6: TEST VALIDATION & REPEAT TOGGLE */}
      {!testValid && (
        <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 rounded-xl p-5 shadow-soft space-y-3">
          <div className="flex items-center gap-3 text-amber-700 dark:text-amber-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <div>
              <h4 className="text-xs font-bold">IS 2720 Part 16 Warning: CBR 5.0 mm ({finalCbr50.toFixed(2)}%) &gt; CBR 2.5 mm ({finalCbr25.toFixed(2)}%)</h4>
              <p className="text-[11px] text-amber-600 dark:text-amber-300 mt-0.5">
                Standard requires repeating the test. If repeated test yields the same result, CBR at 5.0 mm is adopted.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={useRepeatedResult}
                onChange={(e) => setUseRepeatedResult(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span>Use Repeated Test Result (Adopt CBR 5.0 mm = {finalCbr50.toFixed(2)}%)</span>
            </label>
          </div>
        </div>
      )}

      {/* STEP 7 & 10: FINAL RESULTS PANEL */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
        <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          FINAL CBR RESULTS & SUBGRADE RATING
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* FINAL CBR CARD (6 COLS) */}
          <div className="md:col-span-6 grid grid-cols-2 gap-4">
            <div className="bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 rounded-xl p-5 text-center shadow-soft">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Final CBR Value
              </span>
              <span className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 mt-2 block">
                {finalCbr.toFixed(2)} %
              </span>
              <span className="text-[11px] text-slate-400 mt-2 block">
                At {finalPenetration.toFixed(1)} mm penetration
              </span>
            </div>

            <div className={`p-5 rounded-xl border text-center shadow-soft ${ratingInfo.color}`}>
              <span className="text-xs font-bold uppercase tracking-wider block">
                Subgrade Rating
              </span>
              <span className="text-3xl font-extrabold mt-2 block">
                {ratingInfo.rating}
              </span>
              <span className="text-[11px] opacity-80 mt-2 block">
                {ratingInfo.reco}
              </span>
            </div>
          </div>

          {/* PARAMETERS GRID (6 COLS) */}
          <div className="md:col-span-6 grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block">Load at 2.5 mm</span>
              <span className="font-bold text-blue-600">{load25.toFixed(2)} kg</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block">Load at 5.0 mm</span>
              <span className="font-bold text-blue-600">{load50.toFixed(2)} kg</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block">CBR at 2.5 mm</span>
              <span className="font-bold text-emerald-600">{finalCbr25.toFixed(2)} %</span>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] text-slate-400 block">CBR at 5.0 mm</span>
              <span className="font-bold text-emerald-600">{finalCbr50.toFixed(2)} %</span>
            </div>
          </div>
        </div>
      </div>

      {/* STEP 11: BOTTOM ACTION BUTTONS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-soft">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onShowToast('CBR test data saved!')}
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
