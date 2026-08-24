import React from 'react';
import { X, Bell, CheckCircle2, AlertTriangle, Sparkles, TestTube, Download } from 'lucide-react';
import { mockNotifications } from '../data/mockData';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications Center</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {mockNotifications.map((notif) => {
            let Icon = TestTube;
            let iconColor = 'text-blue-600 bg-blue-50 dark:bg-blue-950';
            if (notif.category === 'Calibration Due') {
              Icon = AlertTriangle;
              iconColor = 'text-amber-600 bg-amber-50 dark:bg-amber-950';
            }
            if (notif.category === 'Report Approved') {
              Icon = CheckCircle2;
              iconColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950';
            }
            if (notif.category === 'AI Prediction Ready') {
              Icon = Sparkles;
              iconColor = 'text-purple-600 bg-purple-50 dark:bg-purple-950';
            }

            return (
              <div 
                key={notif.id}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800 transition-all flex items-start gap-3"
              >
                <div className={`w-8 h-8 rounded-lg ${iconColor} flex items-center justify-center shrink-0 mt-0.5`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{notif.category}</span>
                    <span className="text-[10px] text-slate-400">{notif.timestamp}</span>
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mt-0.5">{notif.title}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-normal">{notif.message}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
