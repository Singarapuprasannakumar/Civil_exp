import React from 'react';
import { Wrench, CheckCircle2, AlertTriangle, Play, Pause, Calendar, Activity } from 'lucide-react';
import { mockEquipment } from '../data/mockData';

interface EquipmentViewProps {
  onShowToast: (msg: string) => void;
}

export const EquipmentView: React.FC<EquipmentViewProps> = ({ onShowToast }) => {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Wrench className="w-5 h-5 text-amber-500" />
            Laboratory Equipment Panel (LIMS)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitor sensor health, ISO calibration schedules, and real-time machine utilization.
          </p>
        </div>

        <button 
          onClick={() => onShowToast('Registering New Laboratory Machine...')}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md shadow-blue-600/20"
        >
          <span>+ Add Equipment</span>
        </button>
      </div>

      {/* EQUIPMENT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {mockEquipment.map((eq) => {
          let statusBg = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200';
          if (eq.status === 'Busy' || eq.status === 'Running') {
            statusBg = 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400 border-blue-200';
          }
          if (eq.status === 'Calibration Due') {
            statusBg = 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-200';
          }

          return (
            <div 
              key={eq.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-soft space-y-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    {eq.serial}
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{eq.name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{eq.model}</p>
                </div>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusBg}`}>
                  {eq.status}
                </span>
              </div>

              {/* HEALTH BAR */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                  <span>Equipment Health</span>
                  <span className="font-bold text-slate-900 dark:text-white">{eq.healthScore}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${eq.healthScore}%` }}
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>Next Calib: <strong>{eq.nextCalibration}</strong></span>
                <span>Utilization: <strong>{eq.utilizationRate}%</strong></span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
