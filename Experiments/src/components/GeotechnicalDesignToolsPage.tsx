import React, { useState } from 'react';
import { 
  ChevronRight, Save, RotateCcw, ArrowLeft, CheckCircle2, Calculator,
  LineChart as ChartIcon, Printer, FileSpreadsheet, ShieldAlert, Layers
} from 'lucide-react';
import { Experiment } from '../types';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, LogarithmicScale, PointElement, LineElement, Title, Tooltip, Legend);

interface GeotechnicalDesignToolsPageProps {
  experiment: Experiment;
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export type DesignToolTab = 'spt' | 'adhesion' | 'nq';

// ---------------------------------------------------------
// MODULE 1: CLAY & SAND CALCULATIONS FROM N_COMBINED.PY
// ---------------------------------------------------------
export const getClayProperties = (N: number) => {
  const ranges: [number, number][] = [
    [0, 2], [2.01, 4], [4.01, 8], [8.01, 15], [15.01, 30], [30.01, 50]
  ];
  const quValues: [number, number][] = [
    [0, 25], [25, 50], [50, 100], [100, 200], [200, 400], [400, 500]
  ];
  const consistencies = ["Very soft", "Soft", "Medium", "Stiff", "Very stiff", "Hard"];

  if (N < 0) return { consistency: "Below range", qu: 0, cohesion: 0, reco: "N/A" };
  if (N > 50) {
    const qu = 500 + (N - 50) * 5;
    return { consistency: "Hard", qu: Number(qu.toFixed(2)), cohesion: Number((qu / 2).toFixed(2)), reco: "✓✓✓ Ideal for all types of foundations" };
  }

  for (let i = 0; i < ranges.length; i++) {
    const [nLow, nHigh] = ranges[i];
    if (N >= nLow && N <= nHigh) {
      const consistency = consistencies[i];
      const fraction = (N - nLow) / (nHigh - nLow || 1);
      const qu = quValues[i][0] + fraction * (quValues[i][1] - quValues[i][0]);
      const cohesion = qu / 2;

      let reco = "Suitable for foundations";
      if (qu < 25) reco = "⚠️ Very soft clay - deep foundation or soil improvement needed";
      else if (qu < 50) reco = "⚠️ Soft clay - consider shallow foundation with caution";
      else if (qu < 100) reco = "✓ Medium clay - suitable for shallow foundations";
      else if (qu < 200) reco = "✓ Stiff clay - good for shallow foundations";
      else if (qu < 400) reco = "✓✓ Very stiff clay - excellent for foundations";
      else reco = "✓✓✓ Hard clay - ideal for all types of foundations";

      return { consistency, qu: Number(qu.toFixed(2)), cohesion: Number(cohesion.toFixed(2)), reco };
    }
  }

  return { consistency: "Hard", qu: 500, cohesion: 250, reco: "Ideal for foundations" };
};

export const getSandProperties = (N: number) => {
  let phiMeyerhof = N <= 4 ? 28 + (N / 4) * 2 : 25 + 0.15 * N;
  let phiPeck = N < 0 ? 28 : N < 50 ? 27.1 + 0.3 * N - 0.00054 * N * N : Math.min(45, 27.1 + 0.3 * 50 - 0.00054 * 2500 + (N - 50) * 0.1);
  let phiDunham = N < 0 ? 28 : Math.min(48, 28 + 0.36 * N);
  let phiHatanaka = N < 0 ? 28 : Math.min(50, Math.sqrt(20 * N) + 20);

  // Interpolated table lookup
  let phiInterp = 28;
  const ranges: [number, number][] = [[0, 4], [4.01, 10], [10.01, 30], [30.01, 50], [50.01, 100]];
  const phiVals: [number, number][] = [[28, 30], [30, 34], [34, 38], [38, 42], [42, 46]];

  for (let i = 0; i < ranges.length; i++) {
    if (N >= ranges[i][0] && N <= ranges[i][1]) {
      const frac = (N - ranges[i][0]) / (ranges[i][1] - ranges[i][0]);
      phiInterp = phiVals[i][0] + frac * (phiVals[i][1] - phiVals[i][0]);
      break;
    }
  }
  if (N > 100) phiInterp = Math.min(50, 46 + (N - 100) * 0.05);

  let density = "Very loose";
  if (N > 4 && N <= 10) density = "Loose";
  else if (N > 10 && N <= 30) density = "Medium dense";
  else if (N > 30 && N <= 50) density = "Dense";
  else if (N > 50) density = "Very dense";

  const allPhis = [phiInterp, phiPeck, phiMeyerhof, phiDunham, phiHatanaka].map(p => Number(p.toFixed(2)));
  const conservative = Math.min(...allPhis);
  const average = Number((allPhis.reduce((a, b) => a + b, 0) / allPhis.length).toFixed(2));

  return {
    density,
    phiInterp: Number(phiInterp.toFixed(2)),
    phiPeck: Number(phiPeck.toFixed(2)),
    phiMeyerhof: Number(phiMeyerhof.toFixed(2)),
    phiDunham: Number(phiDunham.toFixed(2)),
    phiHatanaka: Number(phiHatanaka.toFixed(2)),
    conservative,
    average
  };
};

// ---------------------------------------------------------
// MODULE 2: TOMLINSON ADHESION FACTOR INTERPOLATION
// ---------------------------------------------------------
export const getAdhesionFactor = (cohesion: number, pileType: 'concrete' | 'all'): number => {
  const cVals = [0, 25, 50, 75, 100, 125, 150];
  const aConcrete = [1.00, 0.85, 0.70, 0.55, 0.40, 0.25, 0.10];
  const aAll = [1.00, 0.75, 0.55, 0.40, 0.28, 0.18, 0.10];

  const targetArr = pileType === 'concrete' ? aConcrete : aAll;
  if (cohesion <= 0) return 1.00;
  if (cohesion >= 150) return 0.10;

  for (let i = 0; i < cVals.length - 1; i++) {
    if (cohesion >= cVals[i] && cohesion <= cVals[i + 1]) {
      const frac = (cohesion - cVals[i]) / (cVals[i + 1] - cVals[i]);
      const alpha = targetArr[i] + frac * (targetArr[i + 1] - targetArr[i]);
      return Number(Math.max(0, Math.min(1, alpha)).toFixed(4));
    }
  }

  return 0.5;
};

// ---------------------------------------------------------
// MODULE 3: IS:2911 BEARING CAPACITY FACTOR Nq INTERPOLATION
// ---------------------------------------------------------
export const getNqFactor = (phi: number): number => {
  const phiVals = [20, 25, 30, 32, 35, 37, 40, 42, 45];
  const nqVals = [8.0, 15.0, 30.0, 39.7, 60.0, 85.0, 120.0, 165.0, 250.0];

  if (phi <= 20) return 8.0;
  if (phi >= 45) return 250.0;

  for (let i = 0; i < phiVals.length - 1; i++) {
    if (phi >= phiVals[i] && phi <= phiVals[i + 1]) {
      const frac = (phi - phiVals[i]) / (phiVals[i + 1] - phiVals[i]);
      const nq = nqVals[i] + frac * (nqVals[i + 1] - nqVals[i]);
      return Number(nq.toFixed(2));
    }
  }

  return 30.0;
};

export const GeotechnicalDesignToolsPage: React.FC<GeotechnicalDesignToolsPageProps> = ({ experiment, onBack, onShowToast }) => {
  const [activeTab, setActiveTab] = useState<DesignToolTab>('spt');

  // TAB 1 STATE: SPT
  const [soilType, setSoilType] = useState<'clay' | 'sand'>('clay');
  const [sptN, setSptN] = useState<number>(25);

  // TAB 2 STATE: ADHESION FACTOR
  const [adhesionCohesion, setAdhesionCohesion] = useState<number>(75);
  const [pileType, setPileType] = useState<'concrete' | 'all'>('concrete');

  // TAB 3 STATE: BEARING CAPACITY FACTOR Nq
  const [bearingPhi, setBearingPhi] = useState<number>(34);

  // TAB 1 COMPUTATIONS
  const clayRes = getClayProperties(sptN);
  const sandRes = getSandProperties(sptN);

  // TAB 2 COMPUTATIONS
  const alphaVal = getAdhesionFactor(adhesionCohesion, pileType);

  // TAB 3 COMPUTATIONS
  const nqVal = getNqFactor(bearingPhi);

  // TOMLINSON GRAPH CONFIG (TAB 2)
  const cSteps = [0, 25, 50, 75, 100, 125, 150];
  const tomlinsonChartData = {
    labels: cSteps.map(c => `${c} kPa`),
    datasets: [
      {
        label: 'Concrete Pilings (Tomlinson 1957)',
        data: cSteps.map(c => getAdhesionFactor(c, 'concrete')),
        borderColor: '#2563EB',
        borderWidth: 2.5,
        pointRadius: 4,
        tension: 0.3
      },
      {
        label: 'All Pilings (Average)',
        data: cSteps.map(c => getAdhesionFactor(c, 'all')),
        borderColor: '#EF4444',
        borderWidth: 2.5,
        pointRadius: 4,
        tension: 0.3
      },
      {
        label: `Design Point (c=${adhesionCohesion}kPa, α=${alphaVal})`,
        data: cSteps.map(c => Math.abs(c - adhesionCohesion) < 15 ? alphaVal : null),
        borderColor: '#10B981',
        backgroundColor: '#10B981',
        pointRadius: 8,
        showLine: false
      }
    ]
  };

  // IS:2911 SEMILOG GRAPH CONFIG (TAB 3)
  const phiSteps = [20, 25, 30, 32, 35, 37, 40, 42, 45];
  const is2911ChartData = {
    labels: phiSteps.map(p => `${p}°`),
    datasets: [
      {
        label: 'IS:2911 Part 1-1979 (Nq vs φ\')',
        data: phiSteps.map(p => getNqFactor(p)),
        borderColor: '#7C3AED',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        borderWidth: 2.5,
        pointRadius: 5,
        tension: 0.2
      },
      {
        label: `Design Point (φ=${bearingPhi}°, Nq=${nqVal})`,
        data: phiSteps.map(p => Math.abs(p - bearingPhi) < 2 ? nqVal : null),
        borderColor: '#F59E0B',
        backgroundColor: '#F59E0B',
        pointRadius: 9,
        showLine: false
      }
    ]
  };

  // Reset function
  const handleReset = () => {
    setSptN(25);
    setSoilType('clay');
    setAdhesionCohesion(75);
    setPileType('concrete');
    setBearingPhi(34);
    onShowToast('Reset design tools inputs to default values.');
  };

  // Export CSV
  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (activeTab === 'spt') {
      csvContent += "Soil Type,SPT N-Value,Consistency/Density,Unconfined Strength qu (kPa),Cohesion c (kPa),Conservative Friction Angle (deg)\n";
      if (soilType === 'clay') {
        csvContent += `Clay,${sptN},${clayRes.consistency},${clayRes.qu},${clayRes.cohesion},N/A\n`;
      } else {
        csvContent += `Sand,${sptN},${sandRes.density},N/A,N/A,${sandRes.conservative}\n`;
      }
    } else if (activeTab === 'adhesion') {
      csvContent += "Cohesion c (kPa),Pile Type,Adhesion Factor alpha\n";
      csvContent += `${adhesionCohesion},${pileType === 'concrete' ? 'Concrete Pilings' : 'All Pilings'},${alphaVal}\n`;
    } else {
      csvContent += "Angle of Internal Friction phi (deg),Bearing Capacity Factor Nq\n";
      csvContent += `${bearingPhi},${nqVal}\n`;
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Geotechnical_Design_${activeTab.toUpperCase()}_Results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast(`Exported ${activeTab.toUpperCase()} design results to CSV!`);
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
          <span className="font-semibold text-purple-600 dark:text-purple-400">Geotechnical Design Tools</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span>[17]</span>
              <span>Geotechnical Design Tools</span>
              <span className="text-xs font-semibold bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>IS 2911 / Tomlinson 1957</span>
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Engineering design calculators based on empirical correlations contained in N_combined.py.
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

      {/* SEGMENTED TOOL SELECTOR TABS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-soft flex items-center justify-center">
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-2 max-w-2xl w-full">
          <button
            onClick={() => setActiveTab('spt')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'spt'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>[ Soil Properties from SPT ]</span>
          </button>

          <button
            onClick={() => setActiveTab('adhesion')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'adhesion'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>[ Adhesion Factor α ]</span>
          </button>

          <button
            onClick={() => setActiveTab('nq')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'nq'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ChartIcon className="w-4 h-4" />
            <span>[ Bearing Capacity Factor Nq ]</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: SOIL PROPERTIES FROM SPT N-VALUES */}
      {/* ======================================================== */}
      {activeTab === 'spt' && (
        <div className="space-y-6">
          {/* INPUT FORM */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              Soil Property Estimator from SPT N-Values
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Soil Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSoilType('clay')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      soilType === 'clay'
                        ? 'bg-purple-50 dark:bg-purple-950 text-purple-600 border-purple-300 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Clay Soil
                  </button>

                  <button
                    onClick={() => setSoilType('sand')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      soilType === 'sand'
                        ? 'bg-amber-50 dark:bg-amber-950 text-amber-600 border-amber-300 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Sandy Soil
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  SPT N-Value (blows / 300mm)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={sptN}
                  onChange={(e) => setSptN(parseFloat(e.target.value) || 0)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-purple-600 outline-none focus:border-purple-600"
                />
              </div>
            </div>
          </div>

          {/* CLAY RESULTS */}
          {soilType === 'clay' ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                CLAY SOIL ANALYSIS RESULTS
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-1">
                  <span className="text-xs font-bold text-slate-500 block">Consistency</span>
                  <span className="text-2xl font-extrabold text-purple-600">{clayRes.consistency}</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1">
                  <span className="text-xs font-bold text-slate-500 block">Unconfined Strength (qu)</span>
                  <span className="text-2xl font-extrabold text-slate-900 dark:text-white">{clayRes.qu} <span className="text-sm">kPa</span></span>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">Cohesion (c = qu / 2)</span>
                  <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-300">{clayRes.cohesion} <span className="text-sm">kPa</span></span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300">
                {clayRes.reco}
              </div>
            </div>
          ) : (
            /* SAND RESULTS */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
              <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                SANDY SOIL FRICTION ANGLE ESTIMATES (MULTIPLE CORRELATIONS)
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Interpolated</span>
                  <span className="font-bold text-blue-600 text-sm">{sandRes.phiInterp}°</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Peck (1974)</span>
                  <span className="font-bold text-blue-600 text-sm">{sandRes.phiPeck}°</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Meyerhof (1956)</span>
                  <span className="font-bold text-blue-600 text-sm">{sandRes.phiMeyerhof}°</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Dunham (1954)</span>
                  <span className="font-bold text-blue-600 text-sm">{sandRes.phiDunham}°</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">Hatanaka (1996)</span>
                  <span className="font-bold text-blue-600 text-sm">{sandRes.phiHatanaka}°</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-1">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-300 block">Relative Density</span>
                  <span className="text-xl font-extrabold text-amber-600">{sandRes.density}</span>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-1">
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 block">Most Conservative φ (Design Value)</span>
                  <span className="text-2xl font-extrabold text-emerald-600">{sandRes.conservative}°</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: ADHESION FACTOR (TOMLINSON 1957) */}
      {/* ======================================================== */}
      {activeTab === 'adhesion' && (
        <div className="space-y-6">
          {/* INPUT FORM */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              Tomlinson (1957) Adhesion Factor (α) Calculator
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Cohesion c (kPa, range 0–150)
                </label>
                <input
                  type="number"
                  min="0"
                  max="150"
                  value={adhesionCohesion}
                  onChange={(e) => setAdhesionCohesion(parseFloat(e.target.value) || 0)}
                  className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-blue-600 outline-none focus:border-blue-600"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pile Type Selection</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPileType('concrete')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      pileType === 'concrete'
                        ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 border-blue-300 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    Concrete Pilings
                  </button>

                  <button
                    onClick={() => setPileType('all')}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                      pileType === 'all'
                        ? 'bg-red-50 dark:bg-red-950 text-red-600 border-red-300 shadow-sm'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                    }`}
                  >
                    All Pilings (Average)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* RESULTS CARD */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ADHESION FACTOR RESULTS
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="p-6 bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 rounded-xl text-center shadow-soft">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Adhesion Factor (α)
                </span>
                <span className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 mt-2 block">
                  {alphaVal.toFixed(4)}
                </span>
                <span className="text-[11px] text-slate-400 mt-2 block">
                  Dimensionless multiplier for unit skin friction (0 ≤ α ≤ 1)
                </span>
              </div>

              {/* TOMLINSON GRAPH */}
              <div className="h-[220px] w-full p-2 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
                <Line 
                  data={tomlinsonChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { title: { display: true, text: 'Cohesion c (kPa)', font: { size: 10, weight: 'bold' } } },
                      y: { min: 0, max: 1.1, title: { display: true, text: 'Adhesion Factor α', font: { size: 10, weight: 'bold' } } }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: BEARING CAPACITY FACTOR Nq (IS:2911) */}
      {/* ======================================================== */}
      {activeTab === 'nq' && (
        <div className="space-y-6">
          {/* INPUT FORM */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <ChartIcon className="w-4 h-4 text-emerald-600" />
              IS:2911 Part 1-1979 Fig 16.6 Bearing Capacity Factor (Nq)
            </h3>

            <div className="max-w-md space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Angle of Internal Friction φ' (degrees, range 20°–45°)
              </label>
              <input
                type="number"
                min="20"
                max="45"
                step="0.5"
                value={bearingPhi}
                onChange={(e) => setBearingPhi(parseFloat(e.target.value) || 20)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-emerald-600 outline-none focus:border-emerald-600 w-full"
              />
            </div>
          </div>

          {/* RESULTS CARD */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
            <h3 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              BEARING CAPACITY FACTOR Nq RESULTS
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div className="p-6 bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-center shadow-soft">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                  Design Nq Factor
                </span>
                <span className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2 block">
                  {nqVal.toFixed(2)}
                </span>
                <span className="text-[11px] text-slate-400 mt-2 block">
                  Dimensionless end-bearing capacity factor for driven piles
                </span>
              </div>

              {/* SEMILOG GRAPH */}
              <div className="h-[220px] w-full p-2 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
                <Line 
                  data={is2911ChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: { title: { display: true, text: 'Friction Angle φ\' (deg)', font: { size: 10, weight: 'bold' } } },
                      y: { type: 'logarithmic', title: { display: true, text: 'Nq (Log Scale)', font: { size: 10, weight: 'bold' } } }
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CALCULATION DETAILS & EQUATIONS */}
      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-soft space-y-3">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
          <Calculator className="w-4 h-4 text-purple-600" />
          Governing Empirical Equations & Code References
        </h4>

        {activeTab === 'spt' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <span className="font-semibold text-slate-500 block text-[11px]">Clay Cohesion</span>
              <code className="text-xs font-bold text-purple-600 font-mono block mt-1">c = qu / 2</code>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <span className="font-semibold text-slate-500 block text-[11px]">Meyerhof (1956)</span>
              <code className="text-xs font-bold text-purple-600 font-mono block mt-1">φ = 25 + 0.15·N</code>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <span className="font-semibold text-slate-500 block text-[11px]">Peck et al. (1974)</span>
              <code className="text-xs font-bold text-purple-600 font-mono block mt-1">φ = 27.1 + 0.3N − 0.00054N²</code>
            </div>
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
              <span className="font-semibold text-slate-500 block text-[11px]">Hatanaka (1996)</span>
              <code className="text-xs font-bold text-purple-600 font-mono block mt-1">φ = √(20N) + 20</code>
            </div>
          </div>
        )}

        {activeTab === 'adhesion' && (
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1">
            <span className="font-bold text-blue-600">Tomlinson (1957) Adhesion Factor Curve</span>
            <p className="text-slate-600 dark:text-slate-400 text-[11px]">
              Relates undrained shear strength (cohesion c) to adhesion factor α for skin friction capacity of driven piles.
            </p>
          </div>
        )}

        {activeTab === 'nq' && (
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs space-y-1">
            <span className="font-bold text-emerald-600">IS:2911 Part 1-1979 Fig 16.6</span>
            <p className="text-slate-600 dark:text-slate-400 text-[11px]">
              End bearing capacity factor Nq for driven piles in sand as a function of effective friction angle φ'.
            </p>
          </div>
        )}
      </div>

      {/* BOTTOM ACTION BUTTONS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-soft">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onShowToast('Geotechnical Design Tools calculation saved!')}
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
            onClick={() => window.print()}
            className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
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
