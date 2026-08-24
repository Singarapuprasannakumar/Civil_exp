import React, { useState } from 'react';
import { 
  Search, LayoutGrid, List, ArrowRight,
  Droplet, Scale, TestTube2, PenTool, Layers, Activity, Cone, Cylinder,
  Filter, Hammer, Gauge, Waves, MoveHorizontal, ArrowDownToLine, Compass, ShieldCheck
} from 'lucide-react';
import { SoilTest, TestStatus } from '../types';

interface TestGridProps {
  tests: SoilTest[];
  onOpenTest: (test: SoilTest) => void;
}

// Map Lucide icons dynamically
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

export const TestGrid: React.FC<TestGridProps> = ({ tests, onOpenTest }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredTests = tests.filter(test => {
    const matchesFilter = filter === 'all' || test.status.toLowerCase() === filter.toLowerCase();
    const matchesSearch = test.title.toLowerCase().includes(search.toLowerCase()) || 
                          test.desc.toLowerCase().includes(search.toLowerCase()) ||
                          test.num.includes(search);
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-5">
      {/* HEADER & TOOLBAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Laboratory Tests</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Select a soil testing experiment to begin.</p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* SEARCH */}
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 shadow-sm">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input 
              type="text"
              placeholder="Search tests..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent text-xs outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 w-32 focus:w-44 transition-all"
            />
          </div>

          {/* FILTER TABS */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
            {['all', 'active', 'pending', 'completed'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                  filter === tab 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* VIEW TOGGLE */}
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1 shadow-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' : 'text-slate-400'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'list' ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' : 'text-slate-400'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* CARDS CONTAINER */}
      <div className={
        viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" 
          : "flex flex-col gap-3"
      }>
        {filteredTests.map((test) => {
          const IconComponent = iconMap[test.iconName] || Droplet;
          
          return (
            <div
              key={test.id}
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-soft hover:shadow-elevated hover:border-blue-300 dark:hover:border-blue-800 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between h-[230px] relative overflow-hidden"
            >
              {/* TOP HEADER */}
              <div className="flex items-center justify-between">
                <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                  <IconComponent className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  {test.num}
                </span>
              </div>

              {/* CARD CONTENT */}
              <div className="my-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {test.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-normal">
                  {test.desc}
                </p>
              </div>

              {/* FOOTER & BUTTON */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between mt-auto">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
                  {test.status}
                </span>

                <button
                  onClick={() => onOpenTest(test)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-200"
                >
                  <span>Open</span>
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
