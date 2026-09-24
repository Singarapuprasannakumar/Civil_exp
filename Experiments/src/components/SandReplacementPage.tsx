import React, { useState } from 'react';
import { 
  ChevronRight, Plus, Trash2, FileSpreadsheet, Save, RotateCcw, ArrowLeft, CheckCircle2, Calculator,
  Table as TableIcon, Sliders, Layers, Droplets
} from 'lucide-react';
import { Experiment } from '../types';

interface SandReplacementPageProps {
  experiment: Experiment;
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export interface SRObservation {
  obsNo: number;
  // Calibration
  w1: string | number;
  w2: string | number;
  w3: string | number;
  w4: string | number;
  w5: string | number;
  v1: string | number;
  
  // Field Test
  w7: string | number;
  w8: string | number;
  w9: string | number;
  
  // Water Content
  cupNo: string | number;
  w10: string | number;
  w11: string | number;
  w12: string | number;
  g: string | number;
  
  // Calculated
  sandInReceiver: string | number;
  densitySand: string | number;
  sandInCone: string | number;
  sandInHole: string | number;
  volumeHole: string | number;
  bulkDensity: string | number;
  waterContent: string | number;
  dryDensity: string | number;
  voidRatio: string | number;
}

export const SandReplacementPage: React.FC<SandReplacementPageProps> = ({ experiment, onBack, onShowToast }) => {
  const [regdNo, setRegdNo] = useState<string>('REG-2026-SR01');
  const [numObsInput, setNumObsInput] = useState<number | string>(2);
  const [tableGenerated, setTableGenerated] = useState<boolean>(true);

  const computeRowValues = (
    obsNo: number,
    w1: string | number, w2: string | number, w3: string | number,
    w4: string | number, w5: string | number, v1: string | number,
    w7: string | number, w8: string | number, w9: string | number,
    cupNo: string | number, w10: string | number, w11: string | number,
    w12: string | number, g: string | number
  ): SRObservation => {
    const parse = (val: any) => {
      if (val === '' || val === null || val === undefined) return null;
      const n = Number(val);
      return isNaN(n) ? null : n;
    };

    const nw1 = parse(w1);
    const nw2 = parse(w2);
    const nw3 = parse(w3);
    const nw4 = parse(w4);
    const nw5 = parse(w5);
    const nv1 = parse(v1);

    const nw7 = parse(w7);
    const nw8 = parse(w8);
    const nw9 = parse(w9);

    const nw10 = parse(w10);
    const nw11 = parse(w11);
    const nw12 = parse(w12);
    const ng = parse(g);

    let sandInReceiver: string | number = '-';
    let densitySand: string | number = '-';
    let sandInCone: string | number = '-';
    let sandInHole: string | number = '-';
    let volumeHole: string | number = '-';
    let bulkDensity: string | number = '-';
    let waterContent: string | number = '-';
    let dryDensity: string | number = '-';
    let voidRatio: string | number = '-';

    // 1. Sand in Receiver & Density
    if (nw5 !== null && nw2 !== null) {
      const ms = nw5 - nw2;
      sandInReceiver = ms;
      if (nv1 !== null && nv1 > 0) {
        densitySand = ms / nv1;
      }
    }

    // 2. Sand in Cone
    if (nw1 !== null && nw2 !== null && nw3 !== null && nw4 !== null && nw5 !== null) {
      sandInCone = (nw3 - nw1) - (nw4 - nw1) - (nw5 - nw2);
    }

    // 3. Field Density calculations
    if (nw7 !== null && nw8 !== null && typeof sandInCone === 'number') {
      const sh = (nw7 - nw8) - sandInCone;
      sandInHole = sh;

      if (typeof densitySand === 'number' && densitySand > 0) {
        const vh = sh / densitySand;
        volumeHole = vh;

        if (nw9 !== null && vh > 0) {
          bulkDensity = nw9 / vh;
        }
      }
    }

    // 4. Water Content
    if (nw10 !== null && nw11 !== null && nw12 !== null) {
      if (nw11 - nw12 > 0) {
        waterContent = ((nw10 - nw11) / (nw11 - nw12)) * 100;
      }
    }

    // 5. Dry Density & Void Ratio
    if (typeof bulkDensity === 'number' && typeof waterContent === 'number') {
      const dd = bulkDensity / (1 + waterContent / 100);
      dryDensity = dd;

      if (dd > 0 && ng !== null) {
        voidRatio = (ng / dd) - 1;
      }
    }

    const fmt = (val: string | number, dec: number) => typeof val === 'number' ? Number(val.toFixed(dec)) : val;

    return {
      obsNo,
      w1, w2, w3, w4, w5, v1,
      w7, w8, w9,
      cupNo, w10, w11, w12, g,
      sandInReceiver: fmt(sandInReceiver, 3),
      densitySand: fmt(densitySand, 4),
      sandInCone: fmt(sandInCone, 3),
      sandInHole: fmt(sandInHole, 3),
      volumeHole: fmt(volumeHole, 3),
      bulkDensity: fmt(bulkDensity, 4),
      waterContent: fmt(waterContent, 2),
      dryDensity: fmt(dryDensity, 4),
      voidRatio: fmt(voidRatio, 4)
    };
  };

  const createDefaultRow = (idx: number) => {
    return computeRowValues(
      idx, 
      1500, 1100, 7500, 5200, 2450, 1000, 
      7500, 4800, 2450, 
      1, 50, 45, 10, 2.65
    );
  };

  const [observations, setObservations] = useState<SRObservation[]>([
    createDefaultRow(1),
    createDefaultRow(2)
  ]);

  const handleGenerateTable = () => {
    let c = parseInt(String(numObsInput));
    if (isNaN(c)) c = 1;
    const count = Math.max(1, Math.min(20, c));
    const newRows: SRObservation[] = [];
    for (let i = 1; i <= count; i++) {
      newRows.push(createDefaultRow(i));
    }
    setObservations(newRows);
    setTableGenerated(true);
    onShowToast(`Generated observation table with ${count} field trials.`);
  };

  const handleCellEdit = (
    obsNo: number, 
    field: keyof SRObservation, 
    val: string
  ) => {
    setObservations(prev => prev.map(obs => {
      if (obs.obsNo !== obsNo) return obs;
      
      const newObs = { ...obs, [field]: val };
      return computeRowValues(
        obsNo,
        newObs.w1, newObs.w2, newObs.w3, newObs.w4, newObs.w5, newObs.v1,
        newObs.w7, newObs.w8, newObs.w9,
        newObs.cupNo, newObs.w10, newObs.w11, newObs.w12, newObs.g
      );
    }));
  };

  const handleAddRow = () => {
    const idx = observations.length + 1;
    const newObs = createDefaultRow(idx);
    setObservations(prev => [...prev, newObs]);
    setNumObsInput(idx);
    onShowToast(`Added Observation #${idx}`);
  };

  const handleDeleteRow = (obsNo: number) => {
    setObservations(prev => {
      const filtered = prev.filter(o => o.obsNo !== obsNo).map((o, i) => computeRowValues(
        i + 1, o.w1, o.w2, o.w3, o.w4, o.w5, o.v1, o.w7, o.w8, o.w9, o.cupNo, o.w10, o.w11, o.w12, o.g
      ));
      setNumObsInput(filtered.length);
      return filtered;
    });
    onShowToast(`Deleted Observation #${obsNo}`);
  };

  const handleReset = () => {
    setRegdNo('REG-2026-SR01');
    setObservations([createDefaultRow(1), createDefaultRow(2)]);
    setNumObsInput(2);
    setTableGenerated(true);
    onShowToast('Reset to initial dataset.');
  };

  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    csvContent += "Regd. No.,Observation No.,Weight of Cylinder W1 (g),Weight of Container W2 (g),Weight Cylinder Full Sand W3 (g),Weight Cylinder + Rem. Sand W4 (g),Weight Receiver + Sand W5 (g),Volume Receiver V1 (cc),Weight Sand Receiver (g),Density Sand γs (g/cc),Sand in Cone (g),Weight Cylinder + Sand Field W7 (g),Weight Cylinder After Hole W8 (g),Weight Excavated Soil W9 (g),Sand in Hole (g),Volume Hole (cc),Bulk Density (g/cc),Cup No.,Weight Cup+Wet Soil W10 (g),Weight Cup+Dry Soil W11 (g),Weight Cup W12 (g),Water Content (%),Dry Density (g/cc),Specific Gravity G,Void Ratio\n";

    const fmt = (v: any) => {
        if (v === '-' || v === null || v === '') return '';
        if (typeof v === 'number') return v.toString();
        const num = Number(v);
        return isNaN(num) ? v.toString() : num.toString();
    };

    observations.forEach(o => {
      csvContent += `${regdNo},${o.obsNo},${fmt(o.w1)},${fmt(o.w2)},${fmt(o.w3)},${fmt(o.w4)},${fmt(o.w5)},${fmt(o.v1)},${fmt(o.sandInReceiver)},${fmt(o.densitySand)},${fmt(o.sandInCone)},${fmt(o.w7)},${fmt(o.w8)},${fmt(o.w9)},${fmt(o.sandInHole)},${fmt(o.volumeHole)},${fmt(o.bulkDensity)},${fmt(o.cupNo)},${fmt(o.w10)},${fmt(o.w11)},${fmt(o.w12)},${fmt(o.waterContent)},${fmt(o.dryDensity)},${fmt(o.g)},${fmt(o.voidRatio)}\n`;
    });

    csvContent += "\nProject:,GeoTech Lab - Soil Testing Suite\n";
    csvContent += "Created & Developed By:,Singarapu Prasanna Kumar\n";
    csvContent += "Copyright:,© " + new Date().getFullYear() + " Singarapu Prasanna Kumar. All Rights Reserved.\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Sand_Replacement_Results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast("Exported to Sand_Replacement_Results.csv matching specifications.");
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
          <span className="font-semibold text-amber-600 dark:text-amber-400">Sand Replacement Method</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span>[07]</span>
              <span>Sand Replacement Method</span>
              <span className="text-[11px] font-semibold bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 px-3 py-1.5 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>IS 2720 (Part 28) - 1974</span>
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Determine the field/in-situ density of soil using the Sand Replacement Method.
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
              placeholder="REG-2026-SR01"
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-[11px] font-semibold text-slate-900 dark:text-white outline-none focus:border-amber-600"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              Number of Observations
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
            className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] py-2.5 rounded-xl shadow-md shadow-amber-600/20 transition-all col-span-2 sm:col-span-1"
          >
            <TableIcon className="w-5 h-5" />
            <span>Generate Setup</span>
          </button>
        </div>
      </div>

      {tableGenerated && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                Section 1 — Calibration Data
              </h3>
              <button
                onClick={handleAddRow}
                className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold text-[11px] px-4 py-2 rounded-xl transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Record</span>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-blue-50/80 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold border-b border-blue-200 dark:border-blue-800 text-[11px] uppercase tracking-wider">
                    <th className="p-3 border-r border-blue-200 dark:border-blue-800">Obs</th>
                    <th className="p-3">W1 (Cyl) (g)</th>
                    <th className="p-3">W2 (Container) (g)</th>
                    <th className="p-3">W3 (Cyl+Sand Pre) (g)</th>
                    <th className="p-3">W4 (Cyl+Sand Post) (g)</th>
                    <th className="p-3">W5 (Rec+Sand) (g)</th>
                    <th className="p-3">V1 (Rec Vol) (cc)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {observations.map((obs) => (
                    <tr key={obs.obsNo} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800">
                        Obs-{obs.obsNo}
                      </td>
                      <td className="p-2">
                        <input type="text" value={obs.w1} onChange={(e) => handleCellEdit(obs.obsNo, 'w1', e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none focus:border-blue-600 w-full" />
                      </td>
                      <td className="p-2">
                        <input type="text" value={obs.w2} onChange={(e) => handleCellEdit(obs.obsNo, 'w2', e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none focus:border-blue-600 w-full" />
                      </td>
                      <td className="p-2">
                        <input type="text" value={obs.w3} onChange={(e) => handleCellEdit(obs.obsNo, 'w3', e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none focus:border-blue-600 w-full" />
                      </td>
                      <td className="p-2">
                        <input type="text" value={obs.w4} onChange={(e) => handleCellEdit(obs.obsNo, 'w4', e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none focus:border-blue-600 w-full" />
                      </td>
                      <td className="p-2">
                        <input type="text" value={obs.w5} onChange={(e) => handleCellEdit(obs.obsNo, 'w5', e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none focus:border-blue-600 w-full" />
                      </td>
                      <td className="p-2">
                        <input type="text" value={obs.v1} onChange={(e) => handleCellEdit(obs.obsNo, 'v1', e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none focus:border-blue-600 w-full" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-600" />
                Section 2 — Field Test Data
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-amber-50/80 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold border-b border-amber-200 dark:border-amber-800 text-[11px] uppercase tracking-wider">
                    <th className="p-3 border-r border-amber-200 dark:border-amber-800">Obs</th>
                    <th className="p-3">W7 (Cyl+Sand Pre Hole) (g)</th>
                    <th className="p-3">W8 (Cyl+Sand Post Hole) (g)</th>
                    <th className="p-3">W9 (Excavated Soil) (g)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {observations.map((obs) => (
                    <tr key={obs.obsNo} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800">
                        Obs-{obs.obsNo}
                      </td>
                      <td className="p-2">
                        <input type="text" value={obs.w7} onChange={(e) => handleCellEdit(obs.obsNo, 'w7', e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none focus:border-amber-600 w-full" />
                      </td>
                      <td className="p-2">
                        <input type="text" value={obs.w8} onChange={(e) => handleCellEdit(obs.obsNo, 'w8', e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none focus:border-amber-600 w-full" />
                      </td>
                      <td className="p-2">
                        <input type="text" value={obs.w9} onChange={(e) => handleCellEdit(obs.obsNo, 'w9', e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none focus:border-amber-600 w-full" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Droplets className="w-5 h-5 text-emerald-600" />
                Section 3 — Water Content
              </h3>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px] border-collapse min-w-[900px]">
                <thead>
                  <tr className="bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold border-b border-emerald-200 dark:border-emerald-800 text-[11px] uppercase tracking-wider">
                    <th className="p-3 border-r border-emerald-200 dark:border-emerald-800">Obs</th>
                    <th className="p-3">Cup No</th>
                    <th className="p-3">W10 (Cup+Wet) (g)</th>
                    <th className="p-3">W11 (Cup+Dry) (g)</th>
                    <th className="p-3">W12 (Cup) (g)</th>
                    <th className="p-3">G (Spec. Grav)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {observations.map((obs) => (
                    <tr key={obs.obsNo} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3 font-bold text-slate-900 dark:text-white border-r border-slate-100 dark:border-slate-800">
                        Obs-{obs.obsNo}
                      </td>
                      <td className="p-2">
                        <input type="text" value={obs.cupNo} onChange={(e) => handleCellEdit(obs.obsNo, 'cupNo', e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none focus:border-emerald-600 w-full" />
                      </td>
                      <td className="p-2">
                        <input type="text" value={obs.w10} onChange={(e) => handleCellEdit(obs.obsNo, 'w10', e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none focus:border-emerald-600 w-full" />
                      </td>
                      <td className="p-2">
                        <input type="text" value={obs.w11} onChange={(e) => handleCellEdit(obs.obsNo, 'w11', e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none focus:border-emerald-600 w-full" />
                      </td>
                      <td className="p-2">
                        <input type="text" value={obs.w12} onChange={(e) => handleCellEdit(obs.obsNo, 'w12', e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none focus:border-emerald-600 w-full" />
                      </td>
                      <td className="p-2">
                        <input type="text" value={obs.g} onChange={(e) => handleCellEdit(obs.obsNo, 'g', e.target.value)} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1.5 outline-none focus:border-emerald-600 w-full" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-soft space-y-4">
        <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-3">
          <Calculator className="w-5 h-5 text-amber-600" />
          Calculation Details
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 text-[11px]">
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">Sand in Receiver</span>
            <code className="text-[11px] font-bold text-blue-600 dark:text-blue-400 font-mono block">Sand in Receiver = W5 - W2</code>
            <div className="text-[11px] text-slate-500">
              Result: {observations[0]?.sandInReceiver} g
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">Density of Sand (γs)</span>
            <code className="text-[11px] font-bold text-blue-600 dark:text-blue-400 font-mono block">γs = (W5 - W2) / V1</code>
            <div className="text-[11px] text-slate-500">
              Result: {observations[0]?.densitySand} g/cc
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">Sand in Cone</span>
            <code className="text-[11px] font-bold text-blue-600 dark:text-blue-400 font-mono block">Sand in Cone =<br/>(W3 - W1) - (W4 - W1) - (W5 - W2)</code>
            <div className="text-[11px] text-slate-500">
              Result: {observations[0]?.sandInCone} g
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">Sand in Hole</span>
            <code className="text-[11px] font-bold text-amber-600 dark:text-amber-400 font-mono block">Sand in Hole =<br/>(W7 - W8) - Sand in Cone</code>
            <div className="text-[11px] text-slate-500">
              Result: {observations[0]?.sandInHole} g
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">Volume of Hole</span>
            <code className="text-[11px] font-bold text-amber-600 dark:text-amber-400 font-mono block">V2 = Sand in Hole / γs</code>
            <div className="text-[11px] text-slate-500">
              Result: {observations[0]?.volumeHole} cc
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">Bulk Density (γ)</span>
            <code className="text-[11px] font-bold text-amber-600 dark:text-amber-400 font-mono block">γ = W9 / V2</code>
            <div className="text-[11px] text-slate-500">
              Result: {observations[0]?.bulkDensity} g/cc
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">Water Content (w)</span>
            <code className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 font-mono block">w = ((W10 - W11) / (W11 - W12)) × 100</code>
            <div className="text-[11px] text-slate-500">
              Result: {observations[0]?.waterContent} %
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">Dry Density (γd)</span>
            <code className="text-[11px] font-bold text-purple-600 dark:text-purple-400 font-mono block">γd = γ / (1 + w / 100)</code>
            <div className="text-[11px] text-slate-500">
              Result: {observations[0]?.dryDensity} g/cc
            </div>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
            <span className="font-bold text-slate-700 dark:text-slate-300 block">In-situ Void Ratio (e)</span>
            <code className="text-[11px] font-bold text-rose-600 dark:text-rose-400 font-mono block">e = (G / γd) - 1</code>
            <div className="text-[11px] text-slate-500">
              Result: {observations[0]?.voidRatio}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-soft space-y-4">
        <h3 className="text-[11px] font-extrabold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          FINAL RESULTS
        </h3>

        <div className="space-y-6">
          {observations.map((obs) => (
            <div 
              key={obs.obsNo}
              className="p-5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
                <span className="font-bold text-slate-900 dark:text-white text-[11px]">Observation {obs.obsNo}</span>
                <button onClick={() => handleDeleteRow(obs.obsNo)} className="text-slate-400 hover:text-red-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm border-b-2 border-b-amber-500">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Dry Density</span>
                  <span className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400">{obs.dryDensity !== '-' ? `${obs.dryDensity}` : '-'}</span>
                  <span className="text-[11px] text-slate-400 block mt-1">g/cc</span>
                </div>
                
                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Bulk Density</span>
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">{obs.bulkDensity !== '-' ? `${obs.bulkDensity}` : '-'}</span>
                  <span className="text-[11px] text-slate-400 block mt-1">g/cc</span>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">Water Content</span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{obs.waterContent !== '-' ? `${obs.waterContent}` : '-'}</span>
                  <span className="text-[11px] text-slate-400 block mt-1">%</span>
                </div>

                <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block mb-1">In-situ Void Ratio</span>
                  <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">{obs.voidRatio !== '-' ? `${obs.voidRatio}` : '-'}</span>
                  <span className="text-[11px] text-slate-400 block mt-1">-</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-soft">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onShowToast('Test data saved!')}
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
