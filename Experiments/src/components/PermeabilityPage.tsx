import React, { useState } from 'react';
import { 
  ChevronRight, Plus, Trash2, FileSpreadsheet, Save, RotateCcw, ArrowLeft, CheckCircle2, Calculator,
  Table as TableIcon, LineChart as ChartIcon, Gauge, Waves
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

interface PermeabilityPageProps {
  experiment: Experiment;
  onBack: () => void;
  onShowToast: (msg: string) => void;
  initialMode?: 'constant' | 'falling';
}

export type PermeabilityMethod = 'constant' | 'falling';

export interface PermeabilityObs {
  obsNo: number;
  mouldSoil: number;     // Mass of Mould + Soil (g)
  cupNo: string;
  cupEmpty: number;      // Mass of Empty Cup (g)
  cupWet: number;        // Mass of Cup + Wet Soil (g)
  cupDry: number;        // Mass of Cup + Dry Soil (g)
  
  // Constant Head Specific
  headH?: number;        // Hydraulic Head (cm)
  timeT?: number;        // Time (sec)
  flowQ?: number;        // Quantity of Flow (cm³)

  // Falling Head Specific
  standpipeD?: number;   // Diameter of Stand Pipe (cm)
  headH1?: number;       // Initial Head h1 (cm)
  headH2?: number;       // Final Head h2 (cm)
  fallTimeT?: number;    // Time for Head to Fall (sec)

  // Calculated
  area: number;
  volume: number;
  soilMass: number;
  bulkDensity: number;
  waterContent: number;  // %
  dryDensity: number;    // g/cc
  voidRatio: number;     // e
  saturation: number;    // Sr %
  k: number;             // cm/sec
  k27: number;           // cm/sec
}

// ---------------------------------------------------------
// TEMPERATURE VISCOSITY LOOKUP MATCHING PYTHON CODE
// ---------------------------------------------------------
export const getViscosity = (temp: number): number => {
  const tempCorrection: Record<number, number> = {
    15: 0.01145, 16: 0.01116, 17: 0.01088, 18: 0.01060, 19: 0.01034,
    20: 0.01009, 21: 0.00984, 22: 0.00961, 23: 0.00938, 24: 0.00916,
    25: 0.00896, 26: 0.00875, 27: 0.00855, 28: 0.00836, 29: 0.00818,
    30: 0.00800, 31: 0.00783, 32: 0.00767, 33: 0.00751, 34: 0.00736,
    35: 0.00721, 36: 0.00706, 37: 0.00692, 38: 0.00679, 39: 0.00666,
    40: 0.00654
  };
  return tempCorrection[Math.round(temp)] || (0.00855 * (27 / (temp || 27)));
};

export const formatScientific = (val: number): string => {
  if (val === 0 || isNaN(val)) return "0";
  const exp = Math.floor(Math.log10(Math.abs(val)));
  const mantissa = val / Math.pow(10, exp);
  return `${mantissa.toFixed(2)} × 10^${exp}`;
};

export const PermeabilityPage: React.FC<PermeabilityPageProps> = ({ experiment, onBack, onShowToast, initialMode }) => {
  // Method Mode Toggle State
  const [method, setMethod] = useState<PermeabilityMethod>(initialMode || (experiment.num === '11' ? 'falling' : 'constant'));

  // Test Information State
  const [regdNo, setRegdNo] = useState<string>('REG-2026-PM01');
  const [specimenD, setSpecimenD] = useState<number>(10.0);
  const [specimenL, setSpecimenL] = useState<number>(12.73);
  const [gravityG, setGravityG] = useState<number>(2.67);
  const [mouldEmpty, setMouldEmpty] = useState<number>(4944.0);
  const [temperature, setTemperature] = useState<number>(27.0);
  const [numObsInput, setNumObsInput] = useState<number>(3);
  const [tableGenerated, setTableGenerated] = useState<boolean>(true);

  // Helper calculation function for Constant Head & Falling Head
  const computeRowValues = (
    obsNo: number,
    mouldSoil: number,
    cupNo: string,
    cupEmpty: number,
    cupWet: number,
    cupDry: number,
    hH?: number,
    tT?: number,
    fQ?: number,
    spD?: number,
    h1?: number,
    h2?: number,
    ftT?: number
  ): PermeabilityObs => {
    const area = (Math.PI * Math.pow(specimenD, 2)) / 4;
    const volume = area * specimenL;
    const soilMass = mouldSoil - mouldEmpty;
    const bulkDensity = volume > 0 ? soilMass / volume : 0;

    const massWater = cupWet - cupDry;
    const massDrySoil = cupDry - cupEmpty;
    const waterContent = massDrySoil > 0 ? (massWater / massDrySoil) * 100 : 0;

    const dryDensity = bulkDensity / (1 + waterContent / 100);
    const voidRatio = dryDensity > 0 ? (gravityG * 1.0 / dryDensity) - 1 : 0;
    const saturation = voidRatio > 0 ? (waterContent * gravityG) / (voidRatio * 100) : 0;

    const muT = getViscosity(temperature);
    const mu27 = getViscosity(27);

    let k = 0;
    if (method === 'constant') {
      const head = hH || 100;
      const time = tT || 120;
      const flow = fQ || 50;
      if (area > 0 && head > 0 && time > 0) {
        k = (flow * specimenL) / (area * head * time);
      }
    } else {
      const spArea = (Math.PI * Math.pow(spD || 1.0, 2)) / 4;
      const initHead = h1 || 100;
      const finHead = h2 || 90;
      const time = ftT || 120;
      if (area > 0 && time > 0 && finHead > 0) {
        k = ((spArea * specimenL) / (area * time)) * Math.log(initHead / finHead);
      }
    }

    const k27 = k * (muT / mu27);

    return {
      obsNo,
      mouldSoil: Number(mouldSoil.toFixed(1)),
      cupNo,
      cupEmpty: Number(cupEmpty.toFixed(2)),
      cupWet: Number(cupWet.toFixed(2)),
      cupDry: Number(cupDry.toFixed(2)),
      headH: hH,
      timeT: tT,
      flowQ: fQ,
      standpipeD: spD,
      headH1: h1,
      headH2: h2,
      fallTimeT: ftT,
      area: Number(area.toFixed(4)),
      volume: Number(volume.toFixed(4)),
      soilMass: Number(soilMass.toFixed(1)),
      bulkDensity: Number(bulkDensity.toFixed(4)),
      waterContent: Number(waterContent.toFixed(2)),
      dryDensity: Number(dryDensity.toFixed(4)),
      voidRatio: Number(voidRatio.toFixed(4)),
      saturation: Number((saturation * 100).toFixed(2)),
      k,
      k27
    };
  };

  // Initial datasets for Constant Head and Falling Head
  const [constantObs, setConstantObs] = useState<PermeabilityObs[]>([
    computeRowValues(1, 6607, 'C-22', 33.25, 55.00, 52.49, 100, 120, 50),
    computeRowValues(2, 6644, 'C-94', 22.90, 59.90, 54.70, 100, 120, 48),
    computeRowValues(3, 6723, 'C-08', 22.50, 38.80, 36.20, 100, 120, 45)
  ]);

  const [fallingObs, setFallingObs] = useState<PermeabilityObs[]>([
    computeRowValues(1, 6607, 'C-22', 33.25, 55.00, 52.49, undefined, undefined, undefined, 1.0, 100, 90, 120),
    computeRowValues(2, 6644, 'C-94', 22.90, 59.90, 54.70, undefined, undefined, undefined, 1.0, 100, 85, 150),
    computeRowValues(3, 6723, 'C-08', 22.50, 38.80, 36.20, undefined, undefined, undefined, 1.0, 100, 80, 180)
  ]);

  const activeObs = method === 'constant' ? constantObs : fallingObs;
  const setActiveObs = method === 'constant' ? setConstantObs : setFallingObs;

  const avgK27 = activeObs.length > 0 ? activeObs.reduce((a, b) => a + b.k27, 0) / activeObs.length : 0;

  // Chart.js configuration for Void Ratio (e) vs k27
  const chartLabels = activeObs.map(o => `Obs-${o.obsNo}`);
  const chartDataConfig = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Corrected Permeability k27 (cm/sec)',
        data: activeObs.map(o => o.k27),
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        borderWidth: 2.5,
        pointRadius: 6,
        pointBackgroundColor: '#2563EB',
        fill: true,
        tension: 0.2
      }
    ]
  };

  // Handle table generation
  const handleGenerateTable = () => {
    const count = Math.max(1, Math.min(20, numObsInput));
    const newRows: PermeabilityObs[] = [];
    for (let i = 1; i <= count; i++) {
      if (method === 'constant') {
        newRows.push(computeRowValues(i, 6600 + i * 30, `C-${20 + i}`, 25.0, 55.0, 50.0, 100, 120, 50 - i * 2));
      } else {
        newRows.push(computeRowValues(i, 6600 + i * 30, `C-${20 + i}`, 25.0, 55.0, 50.0, undefined, undefined, undefined, 1.0, 100, 90 - i * 3, 120 + i * 20));
      }
    }
    setActiveObs(newRows);
    setTableGenerated(true);
    onShowToast(`Generated observation table with ${count} trials for ${method === 'constant' ? 'Constant Head' : 'Falling Head'}.`);
  };

  // Real-time cell edit
  const handleCellEdit = (
    obsNo: number,
    field: string,
    val: string | number
  ) => {
    setActiveObs(prev => prev.map(obs => {
      if (obs.obsNo !== obsNo) return obs;
      const mouldSoil = field === 'mouldSoil' ? Number(val) : obs.mouldSoil;
      const cupNo = field === 'cupNo' ? String(val) : obs.cupNo;
      const cupEmpty = field === 'cupEmpty' ? Number(val) : obs.cupEmpty;
      const cupWet = field === 'cupWet' ? Number(val) : obs.cupWet;
      const cupDry = field === 'cupDry' ? Number(val) : obs.cupDry;

      const hH = field === 'headH' ? Number(val) : obs.headH;
      const tT = field === 'timeT' ? Number(val) : obs.timeT;
      const fQ = field === 'flowQ' ? Number(val) : obs.flowQ;

      const spD = field === 'standpipeD' ? Number(val) : obs.standpipeD;
      const h1 = field === 'headH1' ? Number(val) : obs.headH1;
      const h2 = field === 'headH2' ? Number(val) : obs.headH2;
      const ftT = field === 'fallTimeT' ? Number(val) : obs.fallTimeT;

      return computeRowValues(obsNo, mouldSoil, cupNo, cupEmpty, cupWet, cupDry, hH, tT, fQ, spD, h1, h2, ftT);
    }));
  };

  const handleAddRow = () => {
    const idx = activeObs.length + 1;
    let newObs: PermeabilityObs;
    if (method === 'constant') {
      newObs = computeRowValues(idx, 6700, `C-${20 + idx}`, 25.0, 55.0, 50.0, 100, 120, 45);
    } else {
      newObs = computeRowValues(idx, 6700, `C-${20 + idx}`, 25.0, 55.0, 50.0, undefined, undefined, undefined, 1.0, 100, 80, 160);
    }
    setActiveObs(prev => [...prev, newObs]);
    setNumObsInput(idx);
    onShowToast(`Added Observation #${idx}`);
  };

  const handleDeleteRow = (obsNo: number) => {
    setActiveObs(prev => {
      const filtered = prev.filter(o => o.obsNo !== obsNo).map((o, i) => computeRowValues(i + 1, o.mouldSoil, o.cupNo, o.cupEmpty, o.cupWet, o.cupDry, o.headH, o.timeT, o.flowQ, o.standpipeD, o.headH1, o.headH2, o.fallTimeT));
      setNumObsInput(filtered.length);
      return filtered;
    });
    onShowToast(`Deleted Observation #${obsNo}`);
  };

  const handleReset = () => {
    setRegdNo('REG-2026-PM01');
    setSpecimenD(10.0);
    setSpecimenL(12.73);
    setGravityG(2.67);
    setMouldEmpty(4944.0);
    setTemperature(27.0);
    if (method === 'constant') {
      setConstantObs([
        computeRowValues(1, 6607, 'C-22', 33.25, 55.00, 52.49, 100, 120, 50),
        computeRowValues(2, 6644, 'C-94', 22.90, 59.90, 54.70, 100, 120, 48),
        computeRowValues(3, 6723, 'C-08', 22.50, 38.80, 36.20, 100, 120, 45)
      ]);
    } else {
      setFallingObs([
        computeRowValues(1, 6607, 'C-22', 33.25, 55.00, 52.49, undefined, undefined, undefined, 1.0, 100, 90, 120),
        computeRowValues(2, 6644, 'C-94', 22.90, 59.90, 54.70, undefined, undefined, undefined, 1.0, 100, 85, 150),
        computeRowValues(3, 6723, 'C-08', 22.50, 38.80, 36.20, undefined, undefined, undefined, 1.0, 100, 80, 180)
      ]);
    }
    setNumObsInput(3);
    onShowToast(`Reset to initial ${method === 'constant' ? 'Constant Head' : 'Falling Head'} dataset.`);
  };

  // Export Excel matching exact Python script columns
  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    if (method === 'constant') {
      csvContent += "Regd. No.,Observation No.,Diameter of Specimen (cm),Length of Specimen (cm),Area of Specimen (cm2),Volume of Specimen (cm3),Mass of Empty Mould (g),Mass of Mould + Soil (g),Mass of Soil (g),Bulk Density (g/cm3),Water Content (%),Dry Density (g/cm3),Specific Gravity (G),Void Ratio (e),Degree of Saturation (%),Temperature (C),Hydraulic Head (cm),Time (sec),Quantity of Flow (cm3),k (cm/sec),k27 (cm/sec)\n";
      activeObs.forEach(o => {
        csvContent += `${regdNo},${o.obsNo},${specimenD},${specimenL},${o.area},${o.volume},${mouldEmpty},${o.mouldSoil},${o.soilMass},${o.bulkDensity},${o.waterContent},${o.dryDensity},${gravityG},${o.voidRatio},${o.saturation},${temperature},${o.headH},${o.timeT},${o.flowQ},${o.k.toExponential(4)},${o.k27.toExponential(4)}\n`;
      });
    } else {
      csvContent += "Regd. No.,Observation No.,Diameter of Specimen (cm),Length of Specimen (cm),Area of Specimen (cm2),Volume of Specimen (cm3),Mass of Empty Mould (g),Mass of Mould + Soil (g),Mass of Soil (g),Bulk Density (g/cm3),Water Content (%),Dry Density (g/cm3),Specific Gravity (G),Void Ratio (e),Degree of Saturation (%),Temperature (C),Diameter of Stand Pipe (cm),Area of Stand Pipe (cm2),Initial Head h1 (cm),Final Head h2 (cm),Time for Head to Fall (sec),k (cm/sec),k27 (cm/sec)\n";
      activeObs.forEach(o => {
        const spArea = (Math.PI * Math.pow(o.standpipeD || 1.0, 2)) / 4;
        csvContent += `${regdNo},${o.obsNo},${specimenD},${specimenL},${o.area},${o.volume},${mouldEmpty},${o.mouldSoil},${o.soilMass},${o.bulkDensity},${o.waterContent},${o.dryDensity},${gravityG},${o.voidRatio},${o.saturation},${temperature},${o.standpipeD},${spArea.toFixed(4)},${o.headH1},${o.headH2},${o.fallTimeT},${o.k.toExponential(4)},${o.k27.toExponential(4)}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Permeability_Test_${method === 'constant' ? 'Constant' : 'Falling'}_Head_Results.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast(`Exported to Permeability_Test_${method === 'constant' ? 'Constant' : 'Falling'}_Head_Results.csv!`);
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
          <span className="font-semibold text-teal-600 dark:text-teal-400">Permeability Test</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span>[{method === 'constant' ? '12' : '11'}]</span>
              <span>Permeability Test ({method === 'constant' ? 'Constant Head' : 'Falling Head'})</span>
              <span className="text-xs font-semibold bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>IS 2720 Part 17 / ASTM D2434</span>
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Determine the coefficient of permeability of soil using Constant Head and Falling Head laboratory methods.
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

      {/* SEGMENTED METHOD TOGGLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-soft flex items-center justify-center">
        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center gap-2 max-w-md w-full">
          <button
            onClick={() => setMethod('constant')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              method === 'constant'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Waves className="w-4 h-4" />
            <span>[ Constant Head Mode ]</span>
          </button>

          <button
            onClick={() => setMethod('falling')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
              method === 'falling'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Gauge className="w-4 h-4" />
            <span>[ Falling Head Mode ]</span>
          </button>
        </div>
      </div>

      {/* 1. TEST INFORMATION CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
        <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Gauge className="w-4 h-4 text-teal-600" />
          Test Information ({method === 'constant' ? 'Constant Head' : 'Falling Head'})
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Registration Number</label>
            <input
              type="text"
              value={regdNo}
              onChange={(e) => setRegdNo(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-teal-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Specimen Diameter (cm)</label>
            <input
              type="number"
              step="0.1"
              value={specimenD}
              onChange={(e) => setSpecimenD(parseFloat(e.target.value) || 10)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-blue-600 outline-none focus:border-teal-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Specimen Length (cm)</label>
            <input
              type="number"
              step="0.01"
              value={specimenL}
              onChange={(e) => setSpecimenL(parseFloat(e.target.value) || 12.73)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-blue-600 outline-none focus:border-teal-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Specific Gravity (G)</label>
            <input
              type="number"
              step="0.01"
              value={gravityG}
              onChange={(e) => setGravityG(parseFloat(e.target.value) || 2.67)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-teal-600 outline-none focus:border-teal-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Mass of Empty Mould (g)</label>
            <input
              type="number"
              step="0.1"
              value={mouldEmpty}
              onChange={(e) => setMouldEmpty(parseFloat(e.target.value) || 4944)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-teal-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Temperature (°C)</label>
            <input
              type="number"
              step="0.5"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value) || 27)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-amber-600 outline-none focus:border-teal-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Number of Observations</label>
            <input
              type="number"
              min="1"
              max="20"
              value={numObsInput}
              onChange={(e) => setNumObsInput(parseInt(e.target.value) || 1)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-teal-600 text-center"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleGenerateTable}
              className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md shadow-teal-600/20 transition-all hover:scale-102"
            >
              <TableIcon className="w-4 h-4" />
              <span>Generate Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. OBSERVATION TABLE */}
      {tableGenerated && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Observation Table ({activeObs.length} Trials - {method === 'constant' ? 'Constant Head' : 'Falling Head'})
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
                  <th className="p-2 border-r border-slate-200 dark:border-slate-700 text-center bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300" colSpan={method === 'constant' ? 8 : 9}>
                    Inputs ({method === 'constant' ? 'Head, Flow & Weights' : 'Standpipe, Heads & Weights'})
                  </th>
                  <th className="p-2 text-center bg-teal-50/80 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300" colSpan={4}>
                    Calculated (Density, Void Ratio & Permeability)
                  </th>
                  <th className="p-2 text-center" colSpan={1}>Action</th>
                </tr>

                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px]">
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Obs No.</th>
                  <th className="p-2.5">Mould+Soil (g)</th>
                  <th className="p-2.5">Cup No.</th>
                  <th className="p-2.5">Tare Cup (g)</th>
                  <th className="p-2.5">Cup+Wet (g)</th>
                  <th className="p-2.5">Cup+Dry (g)</th>
                  
                  {method === 'constant' ? (
                    <>
                      <th className="p-2.5">Head h (cm)</th>
                      <th className="p-2.5">Time t (sec)</th>
                      <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Flow Q (cm³)</th>
                    </>
                  ) : (
                    <>
                      <th className="p-2.5">Standpipe D (cm)</th>
                      <th className="p-2.5">Init Head h1 (cm)</th>
                      <th className="p-2.5">Fin Head h2 (cm)</th>
                      <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Fall Time t (sec)</th>
                    </>
                  )}

                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Moisture (%)</th>
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Void Ratio (e)</th>
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">k (cm/sec)</th>
                  <th className="p-2.5 bg-teal-100/50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 text-right font-bold">k27 (cm/sec)</th>
                  <th className="p-2.5 text-center">Delete</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {activeObs.map((obs) => (
                  <tr key={obs.obsNo} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800">
                      Obs-{obs.obsNo}
                    </td>

                    {/* MOULD+SOIL */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.1"
                        value={obs.mouldSoil}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'mouldSoil', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-teal-600 w-full shadow-inner"
                      />
                    </td>

                    {/* CUP NO */}
                    <td className="p-2">
                      <input
                        type="text"
                        value={obs.cupNo}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'cupNo', e.target.value)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-blue-600 outline-none focus:border-teal-600 w-full shadow-inner"
                      />
                    </td>

                    {/* CUP TARE */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.01"
                        value={obs.cupEmpty}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'cupEmpty', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-teal-600 w-full shadow-inner"
                      />
                    </td>

                    {/* CUP WET */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.01"
                        value={obs.cupWet}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'cupWet', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-teal-600 w-full shadow-inner"
                      />
                    </td>

                    {/* CUP DRY */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.01"
                        value={obs.cupDry}
                        onChange={(e) => handleCellEdit(obs.obsNo, 'cupDry', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-teal-600 w-full shadow-inner"
                      />
                    </td>

                    {/* METHOD SPECIFIC INPUTS */}
                    {method === 'constant' ? (
                      <>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.1"
                            value={obs.headH || 100}
                            onChange={(e) => handleCellEdit(obs.obsNo, 'headH', parseFloat(e.target.value) || 0)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-teal-600 w-full shadow-inner"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="1"
                            value={obs.timeT || 120}
                            onChange={(e) => handleCellEdit(obs.obsNo, 'timeT', parseFloat(e.target.value) || 0)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-teal-600 w-full shadow-inner"
                          />
                        </td>
                        <td className="p-2 border-r border-slate-100 dark:border-slate-800">
                          <input
                            type="number"
                            step="0.1"
                            value={obs.flowQ || 50}
                            onChange={(e) => handleCellEdit(obs.obsNo, 'flowQ', parseFloat(e.target.value) || 0)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-teal-600 w-full shadow-inner"
                          />
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.1"
                            value={obs.standpipeD || 1.0}
                            onChange={(e) => handleCellEdit(obs.obsNo, 'standpipeD', parseFloat(e.target.value) || 0)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-teal-600 w-full shadow-inner"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.1"
                            value={obs.headH1 || 100}
                            onChange={(e) => handleCellEdit(obs.obsNo, 'headH1', parseFloat(e.target.value) || 0)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-teal-600 w-full shadow-inner"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.1"
                            value={obs.headH2 || 90}
                            onChange={(e) => handleCellEdit(obs.obsNo, 'headH2', parseFloat(e.target.value) || 0)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-teal-600 w-full shadow-inner"
                          />
                        </td>
                        <td className="p-2 border-r border-slate-100 dark:border-slate-800">
                          <input
                            type="number"
                            step="1"
                            value={obs.fallTimeT || 120}
                            onChange={(e) => handleCellEdit(obs.obsNo, 'fallTimeT', parseFloat(e.target.value) || 0)}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-teal-600 w-full shadow-inner"
                          />
                        </td>
                      </>
                    )}

                    {/* CALCULATED FIELDS */}
                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {obs.waterContent.toFixed(2)} %
                    </td>

                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 font-bold text-blue-600 dark:text-blue-400">
                      {obs.voidRatio.toFixed(4)}
                    </td>

                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {formatScientific(obs.k)}
                    </td>

                    {/* CORRECTED K27 */}
                    <td className="p-2.5 bg-teal-100/40 dark:bg-teal-950/40 text-right font-extrabold text-teal-700 dark:text-teal-300">
                      {formatScientific(obs.k27)}
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
          <Calculator className="w-4 h-4 text-teal-600" />
          Calculation Details ({method === 'constant' ? 'Constant Head' : 'Falling Head'})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Specimen Area (A)</span>
            <code className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono block mt-1">
              = π · D² / 4
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Void Ratio (e)</span>
            <code className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono block mt-1">
              = (G / Dry Density) − 1
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Coefficient of Permeability (k)</span>
            <code className="text-xs font-bold text-teal-600 dark:text-teal-400 font-mono block mt-1">
              {method === 'constant' ? '= (Q · L) / (A · h · t)' : '= (a · L / (A · t)) · ln(h1 / h2)'}
            </code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 dark:text-slate-400 block text-[11px]">Temp Correction (k27)</span>
            <code className="text-xs font-bold text-teal-600 dark:text-teal-400 font-mono block mt-1">
              = k · (μ_T / μ_27)
            </code>
          </div>
        </div>
      </div>

      {/* 4. GRAPH CARD (CHART.JS) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ChartIcon className="w-4 h-4 text-teal-600" />
              Void Ratio (e) vs Permeability (k27)
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Relationship between soil void ratio and temperature-corrected coefficient of permeability at 27°C.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-bold text-teal-600 bg-teal-50 dark:bg-teal-950 px-3 py-1 rounded-xl">
            <span>Avg k27 = {formatScientific(avgK27)} cm/s</span>
          </div>
        </div>

        <div className="h-[300px] w-full p-2 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
          <Line 
            data={chartDataConfig}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { position: 'top' },
                tooltip: {
                  callbacks: {
                    label: (ctx) => `${ctx.dataset.label}: ${formatScientific(Number(ctx.raw))}`
                  }
                }
              },
              scales: {
                x: {
                  title: { display: true, text: 'Observation Trials', font: { size: 11, weight: 'bold' } },
                  grid: { color: 'rgba(226, 232, 240, 0.6)' }
                },
                y: {
                  title: { display: true, text: 'Permeability k27 (cm/sec)', font: { size: 11, weight: 'bold' } },
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
          {/* AVERAGE K27 CARD (5 COLS) */}
          <div className="md:col-span-5 bg-teal-50/90 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-900/60 rounded-xl p-6 flex flex-col justify-center text-center shadow-soft">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Average k27 ({method === 'constant' ? 'Constant Head' : 'Falling Head'})
            </span>
            <span className="text-3xl font-extrabold text-teal-600 dark:text-teal-400 mt-2">
              {formatScientific(avgK27)} <span className="text-sm font-semibold">cm/sec</span>
            </span>
            <span className="text-[11px] text-slate-400 mt-2">
              Mean of all {activeObs.length} trial measurements
            </span>
          </div>

          {/* TRIALS BREAKDOWN TABLE (7 COLS) */}
          <div className="md:col-span-7 space-y-2 max-h-[140px] overflow-y-auto pr-1">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Trial Results Breakdown
            </h4>
            {activeObs.map((obs) => (
              <div 
                key={obs.obsNo}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 text-xs font-mono"
              >
                <span className="font-bold text-slate-900 dark:text-white">Obs-{obs.obsNo}</span>
                <span className="text-blue-600">e = {obs.voidRatio.toFixed(4)}</span>
                <span className="font-bold text-teal-600 dark:text-teal-400">k27 = {formatScientific(obs.k27)} cm/s</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. BOTTOM ACTION BUTTONS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-soft">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onShowToast(`Permeability (${method === 'constant' ? 'Constant' : 'Falling'} Head) test data saved!`)}
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
