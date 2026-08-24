import React, { useState } from 'react';
import { 
  ChevronRight, Plus, Trash2, FileSpreadsheet, Save, RotateCcw, ArrowLeft, CheckCircle2, Calculator,
  Clock, Code, Sparkles, Droplet, Scale, TestTube2, PenTool, Layers, Activity, Cone, Cylinder,
  Filter, Hammer, Gauge, Waves, MoveHorizontal, ArrowDownToLine, Compass, ShieldCheck, ListOrdered
} from 'lucide-react';
import { Experiment, Observation } from '../types';
import { SpecificGravityPage } from './SpecificGravityPage';
import { LiquidLimitPage } from './LiquidLimitPage';
import { PlasticLimitPage } from './PlasticLimitPage';
import { ShrinkageLimitPage } from './ShrinkageLimitPage';
import { DFSIPage } from './DFSIPage';
import { SandReplacementPage } from './SandReplacementPage';
import { CoreCutterPage } from './CoreCutterPage';
import { SieveAnalysisPage } from './SieveAnalysisPage';
import { CompactionPage } from './CompactionPage';
import { PermeabilityPage } from './PermeabilityPage';
import { GeotechnicalDesignToolsPage } from './GeotechnicalDesignToolsPage';
import { UCSPage } from './UCSPage';
import { VaneShearPage } from './VaneShearPage';
import { CBRPage } from './CBRPage';
import { DirectShearPage } from './DirectShearPage';

interface ExperimentPageProps {
  experiment: Experiment;
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Droplet,
  Scale,
  TestTube2,
  PenTool,
  Layers,
  Activity,
  Cone,
  Cylinder,
  Filter,
  Hammer,
  Gauge,
  Waves,
  MoveHorizontal,
  ArrowDownToLine,
  Compass,
  ShieldCheck,
  Calculator
};

export const ExperimentPage: React.FC<ExperimentPageProps> = ({ experiment, onBack, onShowToast }) => {
  const IconComp = iconMap[experiment.iconName] || Droplet;

  // ----------------------------------------------------
  // ROUTER FOR IMPLEMENTED PYTHON EXPERIMENTS & DESIGN TOOLS
  // ----------------------------------------------------
  if (experiment.num === '02') {
    return (
      <SpecificGravityPage 
        experiment={experiment} 
        onBack={onBack} 
        onShowToast={onShowToast} 
      />
    );
  }

  if (experiment.num === '03') {
    return (
      <LiquidLimitPage 
        experiment={experiment} 
        onBack={onBack} 
        onShowToast={onShowToast} 
      />
    );
  }

  if (experiment.num === '04') {
    return (
      <PlasticLimitPage 
        experiment={experiment} 
        onBack={onBack} 
        onShowToast={onShowToast} 
      />
    );
  }

  if (experiment.num === '05') {
    return (
      <ShrinkageLimitPage 
        experiment={experiment} 
        onBack={onBack} 
        onShowToast={onShowToast} 
      />
    );
  }

  if (experiment.num === '06') {
    return (
      <DFSIPage 
        experiment={experiment} 
        onBack={onBack} 
        onShowToast={onShowToast} 
      />
    );
  }

  if (experiment.num === '07') {
    return (
      <SandReplacementPage 
        experiment={experiment} 
        onBack={onBack} 
        onShowToast={onShowToast} 
      />
    );
  }

  if (experiment.num === '08') {
    return (
      <CoreCutterPage 
        experiment={experiment} 
        onBack={onBack} 
        onShowToast={onShowToast} 
      />
    );
  }

  if (experiment.num === '09') {
    return (
      <SieveAnalysisPage 
        experiment={experiment} 
        onBack={onBack} 
        onShowToast={onShowToast} 
      />
    );
  }

  if (experiment.num === '10') {
    return (
      <CompactionPage 
        experiment={experiment} 
        onBack={onBack} 
        onShowToast={onShowToast} 
      />
    );
  }

  if (experiment.num === '11') {
    return (
      <PermeabilityPage 
        experiment={experiment} 
        onBack={onBack} 
        onShowToast={onShowToast} 
        initialMode="falling"
      />
    );
  }

  if (experiment.num === '12') {
    return (
      <PermeabilityPage 
        experiment={experiment} 
        onBack={onBack} 
        onShowToast={onShowToast} 
        initialMode="constant"
      />
    );
  }

  if (experiment.num === '13') {
    return (
      <DirectShearPage 
        onBack={onBack} 
      />
    );
  }

  if (experiment.num === '14') {
    return (
      <UCSPage 
        experiment={experiment} 
        onBack={onBack} 
        onShowToast={onShowToast} 
      />
    );
  }

  if (experiment.num === '15') {
    return (
      <VaneShearPage 
        experiment={experiment} 
        onBack={onBack} 
        onShowToast={onShowToast} 
      />
    );
  }

  if (experiment.num === '16') {
    return (
      <CBRPage 
        experiment={experiment} 
        onBack={onBack} 
        onShowToast={onShowToast} 
      />
    );
  }

  if (experiment.num === '17') {
    return (
      <GeotechnicalDesignToolsPage 
        experiment={experiment} 
        onBack={onBack} 
        onShowToast={onShowToast} 
      />
    );
  }

  // ----------------------------------------------------
  // STATE 2: COMING SOON PLACEHOLDER (FOR UNIMPLEMENTED TESTS)
  // ----------------------------------------------------
  if (!experiment.hasCode) {
    return (
      <div className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-center py-12 px-4 select-none animate-in fade-in duration-300">
        <div className="max-w-xl w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-elevated text-center relative overflow-hidden space-y-6">
          <div className="absolute inset-0 opacity-5 dark:opacity-10 pointer-events-none bg-[radial-gradient(#2563EB_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <button onClick={onBack} className="hover:underline flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              Dashboard
            </button>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="font-semibold text-purple-600 dark:text-purple-400">{experiment.title}</span>
          </div>

          <div className="flex justify-center">
            <div 
              className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg shadow-purple-500/10 border border-purple-200 dark:border-purple-800/50 animate-bounce duration-1000"
              style={{ backgroundColor: experiment.iconBg, color: experiment.iconColor }}
            >
              <IconComp className="w-10 h-10" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
              <Clock className="w-3.5 h-3.5" />
              <span>Status: Coming Soon</span>
            </div>

            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              [{experiment.num}] {experiment.title}
            </h1>

            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {experiment.desc} • Standard: <span className="font-semibold text-slate-700 dark:text-slate-300">{experiment.standard}</span>
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 rounded-xl p-5 text-xs space-y-2 text-left">
            <div className="flex items-start gap-2.5">
              <Code className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white">Calculation Logic Pending</h4>
                <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed mt-0.5">
                  "This experiment interface will become available after its calculation logic has been integrated."
                </p>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-2.5 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-relaxed">
                "The frontend will be automatically generated from the corresponding Python experiment script."
              </p>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onBack}
              className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md shadow-blue-600/20 transition-all hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // STATE 1: MOISTURE CONTENT TEST (EXPERIMENT 01)
  // ----------------------------------------------------

  const [observations, setObservations] = useState<Observation[]>([
    { obsNo: 1, containerNo: 'MC-01', m1: 12.5, m2: 36.4, m3: 30.1, c1: 6.3, c2: 17.6, resultVal: 35.80 },
    { obsNo: 2, containerNo: 'MC-02', m1: 14.0, m2: 42.0, m3: 35.0, c1: 7.0, c2: 21.0, resultVal: 33.33 },
    { obsNo: 3, containerNo: 'MC-03', m1: 13.2, m2: 39.5, m3: 33.0, c1: 6.5, c2: 19.8, resultVal: 32.83 }
  ]);

  const [numObsInput, setNumObsInput] = useState<number>(3);

  const handleNumObsChange = (val: number) => {
    setNumObsInput(val);
    if (val <= 0) return;

    setObservations(prev => {
      if (val === prev.length) return prev;
      if (val > prev.length) {
        const addedCount = val - prev.length;
        const newRows: Observation[] = [];
        for (let i = 0; i < addedCount; i++) {
          const idx = prev.length + i + 1;
          const m1 = 12.5;
          const m2 = 36.4;
          const m3 = 30.1;
          const c1 = m2 - m3;
          const c2 = m3 - m1;
          const res = c2 > 0 ? (c1 / c2) * 100 : 0;
          newRows.push({
            obsNo: idx,
            containerNo: `MC-0${idx}`,
            m1,
            m2,
            m3,
            c1: Number(c1.toFixed(2)),
            c2: Number(c2.toFixed(2)),
            resultVal: Number(res.toFixed(2))
          });
        }
        return [...prev, ...newRows];
      } else {
        return prev.slice(0, val);
      }
    });
  };

  const handleCellEdit = (obsNo: number, field: 'containerNo' | 'm1' | 'm2' | 'm3', val: string | number) => {
    setObservations(prev => prev.map(obs => {
      if (obs.obsNo !== obsNo) return obs;

      const updated = { ...obs, [field]: val };
      const numM1 = Number(updated.m1) || 0;
      const numM2 = Number(updated.m2) || 0;
      const numM3 = Number(updated.m3) || 0;

      const mw = numM2 - numM3;
      const md = numM3 - numM1;
      const moisture = md > 0 ? (mw / md) * 100 : 0;

      return {
        ...updated,
        c1: Number(mw.toFixed(2)),
        c2: Number(md.toFixed(2)),
        resultVal: Number(moisture.toFixed(2))
      };
    }));
  };

  const handleAddRow = () => {
    const idx = observations.length + 1;
    const m1 = 12.5;
    const m2 = 36.4;
    const m3 = 30.1;
    const c1 = m2 - m3;
    const c2 = m3 - m1;
    const res = c2 > 0 ? (c1 / c2) * 100 : 0;

    const newObs: Observation = {
      obsNo: idx,
      containerNo: `MC-0${idx}`,
      m1,
      m2,
      m3,
      c1: Number(c1.toFixed(2)),
      c2: Number(c2.toFixed(2)),
      resultVal: Number(res.toFixed(2))
    };

    setObservations(prev => [...prev, newObs]);
    setNumObsInput(idx);
    onShowToast(`Added Observation #${idx}`);
  };

  const handleDeleteRow = (obsNo: number) => {
    setObservations(prev => {
      const filtered = prev.filter(o => o.obsNo !== obsNo).map((o, i) => ({ ...o, obsNo: i + 1 }));
      setNumObsInput(filtered.length);
      return filtered;
    });
    onShowToast(`Deleted Observation #${obsNo}`);
  };

  const handleReset = () => {
    setObservations([
      { obsNo: 1, containerNo: 'MC-01', m1: 12.5, m2: 36.4, m3: 30.1, c1: 6.3, c2: 17.6, resultVal: 35.80 },
      { obsNo: 2, containerNo: 'MC-02', m1: 14.0, m2: 42.0, m3: 35.0, c1: 7.0, c2: 21.0, resultVal: 33.33 },
      { obsNo: 3, containerNo: 'MC-03', m1: 13.2, m2: 39.5, m3: 33.0, c1: 6.5, c2: 19.8, resultVal: 32.83 }
    ]);
    setNumObsInput(3);
    onShowToast('Observations reset.');
  };

  const results = observations.map(o => o.resultVal);
  const avgMoisture = results.length > 0 ? results.reduce((a, b) => a + b, 0) / results.length : 0;

  const handleExportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Observation No,Container No,Mass of Container + Lid (M1) (g),Mass of Container + Lid + Moist Soil (M2) (g),Mass of Container + Lid + Oven Dry Soil (M3) (g),Mass of Water Mw (g),Mass of Oven Dry Soil Md (g),Moisture Content (%)\n";
    
    observations.forEach(o => {
      csvContent += `${o.obsNo},${o.containerNo},${o.m1},${o.m2},${o.m3},${o.c1},${o.c2},${o.resultVal}\n`;
    });
    
    csvContent += `\nAverage Moisture Content,${avgMoisture.toFixed(2)}%\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "moisture_content_results.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast("Exported to moisture_content_results.csv!");
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
          <span className="font-semibold text-blue-600 dark:text-blue-400">Moisture Content</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
              <span>[01]</span>
              <span>Moisture Content Test</span>
              <span className="text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>IS 2720 Part 2 / ASTM D2216</span>
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Determine the moisture content of soil using the oven drying method.
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

      {/* OBSERVATION CONTROLS BAR */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-soft flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ListOrdered className="w-5 h-5 text-blue-600" />
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Number of Observations:
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={numObsInput}
              onChange={(e) => handleNumObsChange(parseInt(e.target.value) || 1)}
              className="w-20 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-blue-600 text-center outline-none focus:border-blue-600"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleAddRow}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Observation</span>
          </button>
        </div>
      </div>

      {/* OBSERVATION TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Observation Table ({observations.length} Observations)
          </h3>
          <span className="text-[11px] font-semibold text-slate-400">
            Real-time live calculations active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 sticky top-0">
              <tr>
                <th className="p-3 w-28">Observation No</th>
                <th className="p-3 w-32">Container No</th>
                <th className="p-3">Mass of Container + Lid (M1) (g)</th>
                <th className="p-3">Mass of Container + Lid + Moist Soil (M2) (g)</th>
                <th className="p-3">Mass of Container + Lid + Oven Dry Soil (M3) (g)</th>
                <th className="p-3 bg-slate-100/60 dark:bg-slate-800/40">Mass of Water Mw (g)</th>
                <th className="p-3 bg-slate-100/60 dark:bg-slate-800/40">Mass of Oven Dry Soil Md (g)</th>
                <th className="p-3 bg-blue-50/60 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-right">Moisture Content (%)</th>
                <th className="p-3 text-center w-16">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
              {observations.map((obs) => (
                <tr key={obs.obsNo} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3 font-bold text-slate-900 dark:text-white">Obs-{obs.obsNo}</td>
                  <td className="p-3">
                    <input
                      type="text"
                      value={obs.containerNo}
                      onChange={(e) => handleCellEdit(obs.obsNo, 'containerNo', e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 outline-none focus:border-blue-600 w-full"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      step="0.01"
                      value={obs.m1}
                      onChange={(e) => handleCellEdit(obs.obsNo, 'm1', e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-blue-600 w-full"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      step="0.01"
                      value={obs.m2}
                      onChange={(e) => handleCellEdit(obs.obsNo, 'm2', e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-blue-600 w-full"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      step="0.01"
                      value={obs.m3}
                      onChange={(e) => handleCellEdit(obs.obsNo, 'm3', e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs outline-none focus:border-blue-600 w-full"
                    />
                  </td>
                  <td className="p-3 bg-slate-50/50 dark:bg-slate-800/30 font-semibold text-slate-700 dark:text-slate-300">
                    {obs.c1.toFixed(2)} g
                  </td>
                  <td className="p-3 bg-slate-50/50 dark:bg-slate-800/30 font-semibold text-slate-700 dark:text-slate-300">
                    {obs.c2.toFixed(2)} g
                  </td>
                  <td className="p-3 bg-blue-50/40 dark:bg-blue-950/20 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                    {obs.resultVal.toFixed(2)} %
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => handleDeleteRow(obs.obsNo)}
                      className="text-slate-400 hover:text-red-500 p-1 rounded transition-colors"
                      title="Delete Observation"
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

      {/* RESULT SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-5 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-xl p-6 flex flex-col justify-center text-center shadow-soft">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Average Moisture Content
          </span>
          <span className="text-4xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">
            {avgMoisture.toFixed(2)} %
          </span>
          <span className="text-[11px] text-slate-400 mt-2">
            Mean of all {observations.length} observation readings
          </span>
        </div>

        <div className="md:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-soft space-y-3">
          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
            Observation Summary
          </h4>

          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
            {observations.map((obs) => (
              <div 
                key={obs.obsNo}
                className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/80 text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white">Obs-{obs.obsNo}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-blue-600 font-semibold">Container: {obs.containerNo}</span>
                </div>
                <div className="font-bold text-emerald-600 dark:text-emerald-400">
                  Moisture Content = {obs.resultVal.toFixed(2)} %
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BOTTOM ACTIONS */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-soft">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onShowToast('Moisture Content test data saved!')}
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
