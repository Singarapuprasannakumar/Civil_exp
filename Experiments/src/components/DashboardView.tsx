import React from 'react';
import {
  ArrowRight, FlaskConical, Droplet, Scale, TestTube2, PenTool, Layers, Activity, Cone, Cylinder,
  Filter, Hammer, Gauge, Waves, MoveHorizontal, ArrowDownToLine, Compass, ShieldCheck, Clock,
  CheckCircle2, Sparkles, Award
} from 'lucide-react';
import { experimentsData } from '../data/experimentsData';
import { Experiment } from '../types';

interface DashboardViewProps {
  searchVal: string;
  onSelectExperiment: (exp: Experiment) => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Droplet, Scale, TestTube2, PenTool, Layers, Activity, Cone, Cylinder,
  Filter, Hammer, Gauge, Waves, MoveHorizontal, ArrowDownToLine, Compass, ShieldCheck
};

export const DashboardView: React.FC<DashboardViewProps> = ({ searchVal, onSelectExperiment }) => {
  const labExperiments = experimentsData.filter(e => parseInt(e.num) <= 16);

  const filtered = labExperiments.filter(exp =>
    exp.title.toLowerCase().includes(searchVal.toLowerCase()) ||
    (exp.desc || '').toLowerCase().includes(searchVal.toLowerCase()) ||
    exp.num.includes(searchVal)
  );

  const readyCount = labExperiments.filter(e => e.hasCode).length;
  const isSuiteFullyImplemented = readyCount >= 16;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">

      {/* ── DASHBOARD HEADER ── */}
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-none">
          Dashboard
        </h1>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2">
          Select an experiment to begin testing and calculations.
        </p>
      </div>

      {/* ── SUITE COMPLETION BANNER ── */}
      {isSuiteFullyImplemented && (
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 border border-white/20 animate-in slide-in-from-top duration-500">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

          <div className="flex items-center gap-4 z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/30 flex items-center justify-center shrink-0">
              <Award className="w-8 h-8 text-yellow-300 animate-bounce" />
            </div>
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-extrabold bg-white/20 text-white backdrop-blur-sm border border-white/30">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>100% Complete • 16/16 Experiments Ready</span>
              </div>
              <h2 className="text-xl font-extrabold tracking-tight">
                GeoLab AI Laboratory Suite Fully Implemented
              </h2>
              <p className="text-xs text-blue-100 max-w-xl leading-relaxed">
                All 16 Soil Mechanics laboratory experiments are fully active with exact IS standards, live calculations, interactive graphs, and Excel exports.
              </p>
            </div>
          </div>

          <div className="z-10 flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-3xl font-black font-mono">16 / 16</span>
              <span className="text-xs block text-blue-200 font-bold uppercase">Suite Progress</span>
            </div>
          </div>
        </div>
      )}

      {/* ── SECTION HEADER + BADGE ── */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
          Laboratory Experiments
        </h2>
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold shadow-md shadow-blue-600/20">
          <FlaskConical className="w-4 h-4" />
          <span>{readyCount} Experiments Ready</span>
        </div>
      </div>

      {/* ── 4-COLUMN RESPONSIVE GRID ── */}
      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
        {filtered.map((exp) => {
          const IconComp = iconMap[exp.iconName] || Droplet;
          const isReady = exp.hasCode;

          return (
            <div
              key={exp.id}
              onClick={() => onSelectExperiment(exp)}
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-soft hover:shadow-elevated hover:border-blue-300 dark:hover:border-blue-800 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between min-h-[220px] h-full cursor-pointer relative overflow-hidden"
            >
              {/* TOP ROW: icon circle + number/status badge */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-[52px] h-[52px] rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110 shadow-sm"
                  style={{ backgroundColor: exp.iconBg, color: exp.iconColor }}
                >
                  <IconComp className="w-6 h-6" />
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border ${
                    isReady
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 border-emerald-200 dark:border-emerald-800'
                      : 'bg-purple-50 dark:bg-purple-950/60 text-purple-600 border-purple-200 dark:border-purple-800'
                  }`}>
                    {isReady ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    <span>{exp.status}</span>
                  </span>
                  <span className="text-sm font-bold text-slate-400 font-mono">
                    {exp.num}
                  </span>
                </div>
              </div>

              {/* CARD TITLE & DESCRIPTION */}
              <div className="my-2 space-y-1 flex-1">
                <h3 className="text-[20px] font-bold text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {exp.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {exp.desc}
                </p>
              </div>

              {/* ACTION BUTTON */}
              <div className="pt-3">
                <button className={`w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl border transition-all duration-200 ${
                  isReady
                    ? 'text-blue-600 dark:text-blue-400 bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                }`}>
                  <span>{isReady ? 'Start Experiment' : 'View Details'}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
