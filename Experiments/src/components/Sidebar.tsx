import React from 'react';
import { 
  LayoutGrid, FlaskConical, Droplet, Scale, TestTube2, PenTool, Layers, Activity, Cone, Cylinder,
  Filter, Hammer, Gauge, Waves, MoveHorizontal, ArrowDownToLine, Compass, ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  collapsed?: boolean;
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
  ShieldCheck
};

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab }) => {
  const experimentsNav = [
    { num: '01', title: 'Moisture Content', icon: 'Droplet' },
    { num: '02', title: 'Specific Gravity', icon: 'Scale' },
    { num: '03', title: 'Liquid Limit', icon: 'TestTube2' },
    { num: '04', title: 'Plastic Limit', icon: 'PenTool' },
    { num: '05', title: 'Shrinkage Limit', icon: 'Layers' },
    { num: '06', title: 'Differential Free Swell Index', icon: 'Activity' },
    { num: '07', title: 'Sand Replacement Method', icon: 'Cone' },
    { num: '08', title: 'Core Cutter Method', icon: 'Cylinder' },
    { num: '09', title: 'Sieve Analysis', icon: 'Filter' },
    { num: '10', title: 'IS Light Compaction Test', icon: 'Hammer' },
    { num: '11', title: 'Falling Head Permeability', icon: 'Gauge' },
    { num: '12', title: 'Constant Head Permeability', icon: 'Waves' },
    { num: '13', title: 'Direct Shear Test', icon: 'MoveHorizontal' },
    { num: '14', title: 'UCS Test', icon: 'ArrowDownToLine' },
    { num: '15', title: 'Vane Shear Test', icon: 'Compass' },
    { num: '16', title: 'California Bearing Ratio', icon: 'ShieldCheck' }
  ];

  return (
    <aside className="w-[280px] min-w-[280px] flex-shrink-0 bg-[#0F172A] text-slate-300 h-full flex flex-col p-4 select-none z-40 border-r border-slate-800 overflow-y-auto">
      {/* BRAND LOGO */}
      <div className="px-3 py-4 mb-2 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
          <FlaskConical className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <h1 className="text-lg font-bold text-white tracking-tight leading-none">GeoLab AI</h1>
          <span className="text-[11px] font-medium text-slate-400 mt-1">Soil Testing Suite</span>
        </div>
      </div>

      {/* DASHBOARD LINK */}
      <div className="mb-4">
        <button
          onClick={() => onSelectTab('dashboard')}
          className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-semibold text-xs transition-all duration-200 ${
            activeTab === 'dashboard'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
              : 'hover:bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          <LayoutGrid className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
      </div>

      {/* EXPERIMENTS NAV LIST */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-1">
        <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
          LABORATORY EXPERIMENTS
        </div>

        {experimentsNav.map((item) => {
          const IconComp = iconMap[item.icon] || Droplet;
          const isSelected = activeTab === `exp-${item.num}`;

          return (
            <button
              key={item.num}
              onClick={() => onSelectTab(`exp-${item.num}`)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] font-medium transition-all duration-200 group text-left ${
                isSelected
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold'
                  : 'hover:bg-slate-800/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                isSelected ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
              }`} />
              <span className="font-mono text-[10px] opacity-70">{item.num}</span>
              <span className="truncate">{item.title}</span>
            </button>
          );
        })}
      </div>

      {/* BOTTOM PROMO CARD MATCHING REFERENCE IMAGE */}
      <div className="mt-auto pt-4">
        <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 group cursor-pointer shadow-xl min-h-[100px]">
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-40 transition-transform duration-500 group-hover:scale-105"
            style={{ backgroundImage: `url('/assets/geotechnical_sidebar_card.jpg')` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent" />
          
          <div className="relative p-3 text-white">
            <div className="flex items-center gap-2 mb-1">
              <FlaskConical className="w-4 h-4 text-blue-400" />
              <span className="text-[11px] font-bold tracking-wide uppercase text-blue-400">GeoLab AI</span>
            </div>
            <p className="text-[11px] font-medium text-slate-200 leading-tight">
              Accurate Testing.<br />Reliable Engineering.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
