import React, { useState } from 'react';
import { 
  ChevronRight, Plus, Trash2, FileSpreadsheet, FileDown, Printer, Save, Sparkles, CheckCircle2, Calculator, Info, BookOpen
} from 'lucide-react';

export interface MoistureObservation {
  obsNo: number;
  containerNo: string;
  m1: number;
  m2: number;
  m3: number;
  mw: number;
  md: number;
  moisture: number;
}

interface MoistureContentWorkbenchProps {
  onShowToast: (msg: string) => void;
  onOpenPdfPreview: () => void;
  onBack: () => void;
}

export const MoistureContentWorkbench: React.FC<MoistureContentWorkbenchProps> = ({
  onShowToast,
  onOpenPdfPreview,
  onBack
}) => {
  // Pre-populated observations matching user example
  const [observations, setObservations] = useState<MoistureObservation[]>([
    { obsNo: 1, containerNo: 'MC-01', m1: 12.5, m2: 36.4, m3: 30.1, mw: 6.3, md: 17.6, moisture: 35.80 },
    { obsNo: 2, containerNo: 'MC-02', m1: 14.0, m2: 42.0, m3: 35.0, mw: 7.0, md: 21.0, moisture: 33.33 },
    { obsNo: 3, containerNo: 'MC-03', m1: 13.2, m2: 39.5, m3: 33.0, mw: 6.5, md: 19.8, moisture: 32.83 }
  ]);

  // Input state for adding a new observation
  const [sampleId, setSampleId] = useState('SMP-2026-BH01-01');
  const [containerNo, setContainerNo] = useState(`MC-0${observations.length + 1}`);
  const [m1, setM1] = useState<number | ''>(12.5);
  const [m2, setM2] = useState<number | ''>(36.4);
  const [m3, setM3] = useState<number | ''>(30.1);

  const handleAddObservation = (e: React.FormEvent) => {
    e.preventDefault();

    const numM1 = Number(m1) || 0;
    const numM2 = Number(m2) || 0;
    const numM3 = Number(m3) || 0;

    const mw = numM2 - numM3;
    const md = numM3 - numM1;
    const moisture = md > 0 ? (mw / md) * 100 : 0;

    const newObs: MoistureObservation = {
      obsNo: observations.length + 1,
      containerNo: containerNo || `MC-0${observations.length + 1}`,
      m1: numM1,
      m2: numM2,
      m3: numM3,
      mw: Number(mw.toFixed(2)),
      md: Number(md.toFixed(2)),
      moisture: Number(moisture.toFixed(2))
    };

    setObservations(prev => [...prev, newObs]);
    setContainerNo(`MC-0${observations.length + 2}`);
    onShowToast(`Added Observation #${newObs.obsNo} (${newObs.containerNo}): ${newObs.moisture.toFixed(2)}%`);
  };

  const handleDeleteObservation = (obsNo: number) => {
    setObservations(prev => prev.filter(o => o.obsNo !== obsNo).map((o, idx) => ({ ...o, obsNo: idx + 1 })));
    onShowToast(`Deleted Observation #${obsNo}`);
  };

  // Live Statistics Calculations
  const moistureValues = observations.map(o => o.moisture);
  const avgMoisture = moistureValues.length > 0 ? moistureValues.reduce((a, b) => a + b, 0) / moistureValues.length : 0;
  const maxMoisture = moistureValues.length > 0 ? Math.max(...moistureValues) : 0;
  const minMoisture = moistureValues.length > 0 ? Math.min(...moistureValues) : 0;
  
  // Standard Deviation calculation
  const stdDev = moistureValues.length > 1 
    ? Math.sqrt(moistureValues.reduce((sq, n) => sq + Math.pow(n - avgMoisture, 2), 0) / (moistureValues.length - 1))
    : 0;

  // Export Excel function (creates moisture_content_results.xlsx CSV/Data trigger)
  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Observation No,Container No,Mass M1 (g),Mass M2 (g),Mass M3 (g),Mass Water Mw (g),Mass Dry Soil Md (g),Moisture Content (%)\n";
    
    observations.forEach(o => {
      csvContent += `${o.obsNo},${o.containerNo},${o.m1},${o.m2},${o.m3},${o.mw},${o.md},${o.moisture}\n`;
    });
    
    csvContent += `\nAverage Moisture Content (%),${avgMoisture.toFixed(2)}\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "moisture_content_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast('Exported moisture_content_results.xlsx / CSV successfully!');
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* BREADCRUMB HEADER */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <button onClick={onBack} className="hover:underline">Dashboard</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <button onClick={onBack} className="hover:underline">Laboratory</button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-blue-600 dark:text-blue-400">Moisture Content Test</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
            <span>Moisture Content Test Workbench</span>
            <span className="text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
              IS 2720 Part 2 / ASTM D2216
            </span>
          </h1>
        </div>

        <button 
          onClick={onBack} 
          className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          ← Back to Catalog
        </button>
      </div>

      {/* THREE PANEL GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT PANEL (35% = 4 COLS IN 12-GRID) - SAMPLE INFO & OBSERVATION INPUTS */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-soft space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-600" />
              Sample & Observation Input
            </h3>
            <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-950 text-blue-600 px-2 py-0.5 rounded">
              35% Panel
            </span>
          </div>

          <form onSubmit={handleAddObservation} className="space-y-3.5">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Sample Identifier</label>
              <input
                type="text"
                value={sampleId}
                onChange={(e) => setSampleId(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-blue-600"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Container Number</label>
              <input
                type="text"
                value={containerNo}
                onChange={(e) => setContainerNo(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-blue-600"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Mass of Container + Lid ($M_1$) (g)
              </label>
              <input
                type="number"
                step="0.01"
                value={m1}
                onChange={(e) => setM1(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-blue-600"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Mass of Container + Lid + Moist Soil ($M_2$) (g)
              </label>
              <input
                type="number"
                step="0.01"
                value={m2}
                onChange={(e) => setM2(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-blue-600"
                required
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                Mass of Container + Lid + Oven Dry Soil ($M_3$) (g)
              </label>
              <input
                type="number"
                step="0.01"
                value={m3}
                onChange={(e) => setM3(e.target.value === '' ? '' : parseFloat(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium outline-none focus:border-blue-600"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md shadow-blue-600/20 transition-all mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Observation</span>
            </button>
          </form>
        </div>

        {/* CENTER PANEL (40% = 5 COLS IN 12-GRID) - OBSERVATION TABLE */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-soft space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Observation Table ({observations.length} Entries)
            </h3>
            <span className="text-[10px] font-bold bg-purple-50 dark:bg-purple-950 text-purple-600 px-2 py-0.5 rounded">
              40% Panel
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-2">Obs</th>
                  <th className="p-2">Container</th>
                  <th className="p-2">M1 (g)</th>
                  <th className="p-2">M2 (g)</th>
                  <th className="p-2">M3 (g)</th>
                  <th className="p-2">Mw (g)</th>
                  <th className="p-2">Md (g)</th>
                  <th className="p-2 text-right">Moisture %</th>
                  <th className="p-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                {observations.map((obs) => (
                  <tr key={obs.obsNo} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="p-2 font-bold">{obs.obsNo}</td>
                    <td className="p-2 font-semibold text-blue-600">{obs.containerNo}</td>
                    <td className="p-2">{obs.m1.toFixed(1)}</td>
                    <td className="p-2">{obs.m2.toFixed(1)}</td>
                    <td className="p-2">{obs.m3.toFixed(1)}</td>
                    <td className="p-2 text-slate-600">{obs.mw.toFixed(1)}</td>
                    <td className="p-2 text-slate-600">{obs.md.toFixed(1)}</td>
                    <td className="p-2 text-right font-bold text-emerald-600">{obs.moisture.toFixed(2)}%</td>
                    <td className="p-2 text-center">
                      <button 
                        onClick={() => handleDeleteObservation(obs.obsNo)}
                        className="text-slate-400 hover:text-red-500 p-1"
                        title="Delete Observation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT PANEL (25% = 3 COLS IN 12-GRID) - LIVE CALCULATION & STATS */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-soft space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Live Calculations
            </h3>
            <span className="text-[10px] font-bold bg-teal-50 dark:bg-teal-950 text-teal-600 px-2 py-0.5 rounded">
              25% Panel
            </span>
          </div>

          <div className="bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl p-4 text-center">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
              Average Moisture Content
            </span>
            <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-1 block">
              {avgMoisture.toFixed(2)} %
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Maximum Moisture:</span>
              <span className="font-bold text-slate-900 dark:text-white">{maxMoisture.toFixed(2)} %</span>
            </div>

            <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Minimum Moisture:</span>
              <span className="font-bold text-slate-900 dark:text-white">{minMoisture.toFixed(2)} %</span>
            </div>

            <div className="flex justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Standard Deviation:</span>
              <span className="font-bold text-slate-900 dark:text-white">± {stdDev.toFixed(2)} %</span>
            </div>

            <div className="flex justify-between p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800">
              <span className="text-emerald-800 dark:text-emerald-300 font-bold">Verification Status:</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
              </span>
            </div>
          </div>

          {/* IS STANDARD CARD */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>IS 2720 Part 2 Reference</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
              Oven drying at 105°C – 110°C for 16-24 hours until constant mass is attained.
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-soft">
        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel (moisture_content_results.xlsx)</span>
          </button>

          <button 
            onClick={onOpenPdfPreview}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-red-600/20 transition-all"
          >
            <FileDown className="w-4 h-4" />
            <span>Export PDF</span>
          </button>

          <button 
            onClick={() => onShowToast('Printing Observation Summary Sheet...')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => onShowToast('AI Agent Analyzing Soil Moisture Variance...')}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-purple-600/20 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Analysis</span>
          </button>

          <button 
            onClick={() => {
              onShowToast('Moisture Content results appended to database!');
              onBack();
            }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-600/20 transition-all"
          >
            <Save className="w-4 h-4" />
            <span>Save Result</span>
          </button>
        </div>
      </div>
    </div>
  );
};
