import React, { useState } from 'react';
import { 
  ChevronRight, Plus, Trash2, FileSpreadsheet, Save, RotateCcw, ArrowLeft, CheckCircle2, Calculator,
  Table as TableIcon, LineChart as ChartIcon, ArrowDownToLine, Upload
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

interface UCSPageProps {
  experiment: Experiment;
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export interface UCSObservation {
  obsNo: number;
  specimen: number;
  d: number;             // Diameter (mm)
  l: number;             // Length (mm)
  dial: number;          // Dial Reading (divisions)
  prr: number;           // Proving Ring Reading (divisions)

  // Calculated
  a0: number;            // pi * d^2 / 4
  axialDeformation: number; // dial * leastCount
  strain: number;        // axialDeformation / l
  correctedArea: number; // a0 / (1 - strain)
  load: number;          // prr * provingConstant
  sigma: number;         // (load / correctedArea) * 1000 (kPa)
}

export const UCSPage: React.FC<UCSPageProps> = ({ experiment, onBack, onShowToast }) => {
  // Test Information State
  const [regdNo, setRegdNo] = useState<string>('REG-2026-UCS1');
  const [provingConstant, setProvingConstant] = useState<number>(1.2); // N/div
  const [leastCount, setLeastCount] = useState<number>(0.01);        // mm/div
  const [selectedSpecimen, setSelectedSpecimen] = useState<number>(1);
  const [tableGenerated, setTableGenerated] = useState<boolean>(true);

  // Helper calculation function matching Python logic
  const computeRowValues = (
    obsNo: number,
    specimen: number,
    d: number,
    l: number,
    dial: number,
    prr: number,
    prConst: number,
    lCount: number
  ): UCSObservation => {
    const a0 = (Math.PI * Math.pow(d, 2)) / 4;
    const axialDeformation = dial * lCount;
    const strain = l > 0 ? axialDeformation / l : 0;
    const correctedArea = (1 - strain) > 0 ? a0 / (1 - strain) : a0;
    const load = prr * prConst;
    const sigma = correctedArea > 0 ? (load / correctedArea) * 1000 : 0;

    return {
      obsNo,
      specimen,
      d: Number(d.toFixed(3)),
      l: Number(l.toFixed(3)),
      dial: Number(dial.toFixed(3)),
      prr: Number(prr.toFixed(3)),
      a0: Number(a0.toFixed(3)),
      axialDeformation: Number(axialDeformation.toFixed(3)),
      strain: Number(strain.toFixed(5)),
      correctedArea: Number(correctedArea.toFixed(3)),
      load: Number(load.toFixed(3)),
      sigma: Number(sigma.toFixed(3))
    };
  };

  // Pre-populated default multi-specimen observation dataset
  const [observations, setObservations] = useState<UCSObservation[]>([
    // Specimen 1
    computeRowValues(1, 1, 38.0, 76.0, 20, 15, 1.2, 0.01),
    computeRowValues(2, 1, 38.0, 76.0, 40, 32, 1.2, 0.01),
    computeRowValues(3, 1, 38.0, 76.0, 60, 52, 1.2, 0.01),
    computeRowValues(4, 1, 38.0, 76.0, 80, 70, 1.2, 0.01),
    computeRowValues(5, 1, 38.0, 76.0, 100, 85, 1.2, 0.01),
    computeRowValues(6, 1, 38.0, 76.0, 120, 78, 1.2, 0.01),

    // Specimen 2
    computeRowValues(1, 2, 38.0, 76.0, 20, 18, 1.2, 0.01),
    computeRowValues(2, 2, 38.0, 76.0, 40, 35, 1.2, 0.01),
    computeRowValues(3, 2, 38.0, 76.0, 60, 58, 1.2, 0.01),
    computeRowValues(4, 2, 38.0, 76.0, 80, 76, 1.2, 0.01),
    computeRowValues(5, 2, 38.0, 76.0, 100, 92, 1.2, 0.01),
    computeRowValues(6, 2, 38.0, 76.0, 120, 84, 1.2, 0.01),

    // Specimen 3
    computeRowValues(1, 3, 38.0, 76.0, 20, 14, 1.2, 0.01),
    computeRowValues(2, 3, 38.0, 76.0, 40, 30, 1.2, 0.01),
    computeRowValues(3, 3, 38.0, 76.0, 60, 48, 1.2, 0.01),
    computeRowValues(4, 3, 38.0, 76.0, 80, 66, 1.2, 0.01),
    computeRowValues(5, 3, 38.0, 76.0, 100, 81, 1.2, 0.01),
    computeRowValues(6, 3, 38.0, 76.0, 120, 75, 1.2, 0.01)
  ]);

  // Unique specimen numbers
  const specimenIds = Array.from(new Set(observations.map(o => o.specimen)));

  // Calculate UCS (qu) and Cohesion (cu) per specimen matching Python logic
  const getSpecimenSummary = (spId: number) => {
    const spObs = observations.filter(o => o.specimen === spId);
    if (spObs.length === 0) return { qu: 0, cu: 0, peakStress: 0 };

    const L = spObs[0].l;
    const stresses = spObs.map(o => o.sigma);
    const peakStress = Math.max(...stresses);

    // Stress at 20% strain
    const strainPercents = spObs.map(o => (o.axialDeformation / L) * 100);
    const stress20Obj = spObs.find((o, idx) => strainPercents[idx] >= 20);
    const stress20 = stress20Obj ? stress20Obj.sigma : peakStress;

    const qu = Math.min(peakStress, stress20);
    const cu = qu / 2;

    return { qu: Number(qu.toFixed(2)), cu: Number(cu.toFixed(2)), peakStress: Number(peakStress.toFixed(2)) };
  };

  const specimenSummaries = specimenIds.map(spId => ({
    specimen: spId,
    ...getSpecimenSummary(spId)
  }));

  const quAvg = specimenSummaries.length > 0 
    ? specimenSummaries.reduce((a, b) => a + b.qu, 0) / specimenSummaries.length 
    : 0;

  const cuAvg = specimenSummaries.length > 0 
    ? specimenSummaries.reduce((a, b) => a + b.cu, 0) / specimenSummaries.length 
    : 0;

  // Active specimen observations for Chart.js
  const activeObs = observations.filter(o => o.specimen === selectedSpecimen);
  const activeSummary = getSpecimenSummary(selectedSpecimen);

  const chartDataConfig = {
    labels: activeObs.map(o => `${o.axialDeformation.toFixed(2)} mm`),
    datasets: [
      {
        label: `Compressive Stress (kPa) - Specimen ${selectedSpecimen}`,
        data: activeObs.map(o => o.sigma),
        borderColor: '#14B8A6',
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: '#14B8A6',
        fill: true,
        tension: 0.3
      }
    ]
  };

  // Real-time cell edit
  const handleCellEdit = (
    obsNo: number,
    specimen: number,
    field: 'dial' | 'prr' | 'd' | 'l',
    val: number
  ) => {
    setObservations(prev => prev.map(obs => {
      if (obs.obsNo !== obsNo || obs.specimen !== specimen) return obs;
      const d = field === 'd' ? val : obs.d;
      const l = field === 'l' ? val : obs.l;
      const dial = field === 'dial' ? val : obs.dial;
      const prr = field === 'prr' ? val : obs.prr;
      return computeRowValues(obsNo, specimen, d, l, dial, prr, provingConstant, leastCount);
    }));
  };

  const handleAddRow = () => {
    const spObs = observations.filter(o => o.specimen === selectedSpecimen);
    const idx = spObs.length + 1;
    const lastDial = spObs.length > 0 ? spObs[spObs.length - 1].dial + 20 : 20;
    const lastPRR = spObs.length > 0 ? spObs[spObs.length - 1].prr + 10 : 15;
    const d = spObs.length > 0 ? spObs[0].d : 38.0;
    const l = spObs.length > 0 ? spObs[0].l : 76.0;

    const newObs = computeRowValues(idx, selectedSpecimen, d, l, lastDial, lastPRR, provingConstant, leastCount);
    setObservations(prev => [...prev, newObs]);
    onShowToast(`Added reading for Specimen #${selectedSpecimen}`);
  };

  const handleDeleteRow = (obsNo: number, specimen: number) => {
    setObservations(prev => prev.filter(o => !(o.obsNo === obsNo && o.specimen === specimen)));
    onShowToast(`Deleted reading from Specimen #${specimen}`);
  };

  const handleReset = () => {
    setRegdNo('REG-2026-UCS1');
    setProvingConstant(1.2);
    setLeastCount(0.01);
    setObservations([
      computeRowValues(1, 1, 38.0, 76.0, 20, 15, 1.2, 0.01),
      computeRowValues(2, 1, 38.0, 76.0, 40, 32, 1.2, 0.01),
      computeRowValues(3, 1, 38.0, 76.0, 60, 52, 1.2, 0.01),
      computeRowValues(4, 1, 38.0, 76.0, 80, 70, 1.2, 0.01),
      computeRowValues(5, 1, 38.0, 76.0, 100, 85, 1.2, 0.01),
      computeRowValues(6, 1, 38.0, 76.0, 120, 78, 1.2, 0.01),
      computeRowValues(1, 2, 38.0, 76.0, 20, 18, 1.2, 0.01),
      computeRowValues(2, 2, 38.0, 76.0, 40, 35, 1.2, 0.01),
      computeRowValues(3, 2, 38.0, 76.0, 60, 58, 1.2, 0.01),
      computeRowValues(4, 2, 38.0, 76.0, 80, 76, 1.2, 0.01),
      computeRowValues(5, 2, 38.0, 76.0, 100, 92, 1.2, 0.01),
      computeRowValues(6, 2, 38.0, 76.0, 120, 84, 1.2, 0.01),
      computeRowValues(1, 3, 38.0, 76.0, 20, 14, 1.2, 0.01),
      computeRowValues(2, 3, 38.0, 76.0, 40, 30, 1.2, 0.01),
      computeRowValues(3, 3, 38.0, 76.0, 60, 48, 1.2, 0.01),
      computeRowValues(4, 3, 38.0, 76.0, 80, 66, 1.2, 0.01),
      computeRowValues(5, 3, 38.0, 76.0, 100, 81, 1.2, 0.01),
      computeRowValues(6, 3, 38.0, 76.0, 120, 75, 1.2, 0.01)
    ]);
    setSelectedSpecimen(1);
    onShowToast('Reset to initial UCS dataset.');
  };

  // Export Excel matching exact 13 Python script columns + append summary
  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    // 13 EXACT COLUMNS FROM PYTHON CODE
    csvContent += "Regd. No.,Specimen No.,Diameter (mm),Length (mm),Initial Area A0 (mm2),Observation No.,Dial Gauge Reading (divisions),Proving Ring Reading (divisions),Axial Deformation (mm),Axial Strain,Corrected Area Ac (mm2),Load (N),Compressive Stress (kPa)\n";

    observations.forEach(o => {
      csvContent += `${regdNo},${o.specimen},${o.d.toFixed(3)},${o.l.toFixed(3)},${o.a0.toFixed(3)},${o.obsNo},${o.dial.toFixed(3)},${o.prr.toFixed(3)},${o.axialDeformation.toFixed(3)},${o.strain.toFixed(5)},${o.correctedArea.toFixed(3)},${o.load.toFixed(3)},${o.sigma.toFixed(3)}\n`;
    });

    // APPEND SUMMARY ROWS MATCHING PYTHON openpyxl OUTPUT
    csvContent += `\n,,,,,,,,,,Average Final UCS (kPa),${quAvg.toFixed(3)}\n`;
    csvContent += `,,,,,,,,,,Average Cohesion cu (kPa),${cuAvg.toFixed(3)}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "UCS_Test_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast("Exported to UCS_Test_Results.csv matching Python openpyxl format!");
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
          <span className="font-semibold text-teal-600 dark:text-teal-400">UCS Test</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span>[14]</span>
              <span>Unconfined Compressive Strength (UCS) Test</span>
              <span className="text-xs font-semibold bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>IS 2720 Part 10 / ASTM D2166</span>
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Determine Unconfined Compressive Strength (qu) and Cohesion (cu) of cohesive soil.
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
          <ArrowDownToLine className="w-4 h-4 text-teal-600" />
          Test Information
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
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Proving Ring Constant (N/div)</label>
            <input
              type="number"
              step="0.01"
              value={provingConstant}
              onChange={(e) => setProvingConstant(parseFloat(e.target.value) || 1)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-teal-600 outline-none focus:border-teal-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Dial Gauge Least Count (mm/div)</label>
            <input
              type="number"
              step="0.001"
              value={leastCount}
              onChange={(e) => setLeastCount(parseFloat(e.target.value) || 0.01)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-blue-600 outline-none focus:border-teal-600"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Active Specimen View</label>
            <select
              value={selectedSpecimen}
              onChange={(e) => setSelectedSpecimen(parseInt(e.target.value))}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-teal-600"
            >
              {specimenIds.map(id => (
                <option key={id} value={id}>Specimen #{id}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. OBSERVATION TABLE (MATCHING PYTHON UCS CODE) */}
      {tableGenerated && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Observation Table (Specimen #{selectedSpecimen} - {activeObs.length} Readings)
            </h3>

            <button
              onClick={handleAddRow}
              className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-xs px-3 py-1.5 rounded-xl transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Reading</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse min-w-[1100px]">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-700 text-[11px] uppercase tracking-wider">
                  <th className="p-2 border-r border-slate-200 dark:border-slate-700" colSpan={1}>Obs</th>
                  <th className="p-2 border-r border-slate-200 dark:border-slate-700 text-center bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300" colSpan={4}>
                    Inputs (Dimensions & Readings)
                  </th>
                  <th className="p-2 text-center bg-teal-50/80 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300" colSpan={7}>
                    Calculated (Deformation, Strain, Area, Load & Stress)
                  </th>
                  <th className="p-2 text-center" colSpan={1}>Action</th>
                </tr>

                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 text-[11px]">
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">Obs No.</th>
                  <th className="p-2.5">Diameter d (mm)</th>
                  <th className="p-2.5">Length L (mm)</th>
                  <th className="p-2.5">Dial Reading (div)</th>
                  <th className="p-2.5 border-r border-slate-200 dark:border-slate-800">PRR (div)</th>
                  
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Initial Area A0 (mm²)</th>
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Deformation (mm)</th>
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Axial Strain ε</th>
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Corrected Ac (mm²)</th>
                  <th className="p-2.5 bg-slate-100/40 dark:bg-slate-800/30">Load (N)</th>
                  <th className="p-2.5 bg-teal-100/50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 text-right font-bold">Compressive Stress (kPa)</th>
                  <th className="p-2.5 text-center">Delete</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {activeObs.map((obs) => (
                  <tr key={obs.obsNo} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-2.5 font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800">
                      Obs-{obs.obsNo}
                    </td>

                    {/* DIAMETER D */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.1"
                        value={obs.d}
                        onChange={(e) => handleCellEdit(obs.obsNo, obs.specimen, 'd', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-teal-600 w-full shadow-inner"
                      />
                    </td>

                    {/* LENGTH L */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.1"
                        value={obs.l}
                        onChange={(e) => handleCellEdit(obs.obsNo, obs.specimen, 'l', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs outline-none focus:border-teal-600 w-full shadow-inner"
                      />
                    </td>

                    {/* DIAL READING */}
                    <td className="p-2">
                      <input
                        type="number"
                        step="1"
                        value={obs.dial}
                        onChange={(e) => handleCellEdit(obs.obsNo, obs.specimen, 'dial', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-blue-600 outline-none focus:border-teal-600 w-full shadow-inner"
                      />
                    </td>

                    {/* PRR */}
                    <td className="p-2 border-r border-slate-100 dark:border-slate-800">
                      <input
                        type="number"
                        step="1"
                        value={obs.prr}
                        onChange={(e) => handleCellEdit(obs.obsNo, obs.specimen, 'prr', parseFloat(e.target.value) || 0)}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-blue-600 outline-none focus:border-teal-600 w-full shadow-inner"
                      />
                    </td>

                    {/* CALCULATED FIELDS */}
                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {obs.a0.toFixed(2)} mm²
                    </td>

                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {obs.axialDeformation.toFixed(3)} mm
                    </td>

                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {obs.strain.toFixed(5)}
                    </td>

                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {obs.correctedArea.toFixed(2)} mm²
                    </td>

                    <td className="p-2.5 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
                      {obs.load.toFixed(2)} N
                    </td>

                    {/* COMPRESSIVE STRESS */}
                    <td className="p-2.5 bg-teal-100/40 dark:bg-teal-950/40 text-right font-extrabold text-teal-700 dark:text-teal-300">
                      {obs.sigma.toFixed(2)} kPa
                    </td>

                    {/* DELETE */}
                    <td className="p-2.5 text-center">
                      <button
                        onClick={() => handleDeleteRow(obs.obsNo, obs.specimen)}
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
          <Calculator className="w-4 h-4 text-teal-600" />
          Calculation Details & Governing Formulas
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 block text-[11px]">Initial Area (A0)</span>
            <code className="text-xs font-bold text-blue-600 font-mono block mt-1">= π · d² / 4</code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 block text-[11px]">Corrected Area (Ac)</span>
            <code className="text-xs font-bold text-blue-600 font-mono block mt-1">= A0 / (1 − Strain)</code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 block text-[11px]">Compressive Stress (σ)</span>
            <code className="text-xs font-bold text-teal-600 font-mono block mt-1">= (Load / Ac) × 1000 kPa</code>
          </div>

          <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <span className="font-semibold text-slate-500 block text-[11px]">Undrained Cohesion (cu)</span>
            <code className="text-xs font-bold text-teal-600 font-mono block mt-1">= qu / 2</code>
          </div>
        </div>
      </div>

      {/* 4. GRAPH CARD (CHART.JS) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ChartIcon className="w-4 h-4 text-teal-600" />
              Stress vs Axial Deformation Curve (Specimen #{selectedSpecimen})
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Axial Deformation (mm) vs Compressive Stress (kPa) with Peak Stress marker.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold">
            <span className="bg-teal-50 dark:bg-teal-950 text-teal-600 px-3 py-1 rounded-xl border border-teal-200">
              Peak = {activeSummary.peakStress} kPa
            </span>
            <span className="bg-blue-50 dark:bg-blue-950 text-blue-600 px-3 py-1 rounded-xl border border-blue-200">
              qu = {activeSummary.qu} kPa
            </span>
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
                    label: (ctx) => `${ctx.dataset.label}: ${ctx.raw} kPa`
                  }
                }
              },
              scales: {
                x: { title: { display: true, text: 'Axial Deformation (mm)', font: { size: 11, weight: 'bold' } } },
                y: { title: { display: true, text: 'Compressive Stress (kPa)', font: { size: 11, weight: 'bold' } } }
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
          {/* AVERAGE UCS & COHESION CARDS (6 COLS) */}
          <div className="md:col-span-6 grid grid-cols-2 gap-4">
            <div className="bg-teal-50/90 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-900/60 rounded-xl p-5 text-center shadow-soft">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Average Final UCS (qu)
              </span>
              <span className="text-3xl font-extrabold text-teal-600 dark:text-teal-400 mt-2 block">
                {quAvg.toFixed(2)} <span className="text-sm font-semibold">kPa</span>
              </span>
            </div>

            <div className="bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 rounded-xl p-5 text-center shadow-soft">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Average Cohesion (cu)
              </span>
              <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-2 block">
                {cuAvg.toFixed(2)} <span className="text-sm font-semibold">kPa</span>
              </span>
            </div>
          </div>

          {/* SPECIMEN BREAKDOWN TABLE (6 COLS) */}
          <div className="md:col-span-6 space-y-2 max-h-[140px] overflow-y-auto pr-1">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Specimen Summary Breakdown
            </h4>
            {specimenSummaries.map((s) => (
              <div 
                key={s.specimen}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 text-xs font-mono"
              >
                <span className="font-bold text-slate-900 dark:text-white">Specimen {s.specimen}</span>
                <span className="text-teal-600">qu = {s.qu.toFixed(2)} kPa</span>
                <span className="font-bold text-blue-600">cu = {s.cu.toFixed(2)} kPa</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. BOTTOM ACTION BUTTONS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-soft">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onShowToast('UCS test data saved!')}
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
