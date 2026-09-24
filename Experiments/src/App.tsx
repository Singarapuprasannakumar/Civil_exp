import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { AntigravityProvider } from './components/AntigravityProvider';
import { Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { DashboardView } from './components/DashboardView';
import { ExperimentPage } from './components/ExperimentPage';
import { experimentsData } from './data/experimentsData';
import { Experiment } from './types';
import { Info } from 'lucide-react';

const ExperimentWrapper = ({ onBack, onShowToast }: { onBack: () => void, onShowToast: (msg: string) => void }) => {
  const { id } = useParams<{ id: string }>();
  const experiment = experimentsData.find(e => e.num === id);

  if (!experiment) {
    return <Navigate to="/" />;
  }

  return <ExperimentPage experiment={experiment} onBack={onBack} onShowToast={onShowToast} />;
};

export const AppContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchVal, setSearchVal] = useState('');
  const [toasts, setToasts] = useState<{ id: number; message: string }[]>([]);

  const showToast = (message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const activeTab = location.pathname.startsWith('/experiment/')
    ? `exp-${location.pathname.split('/')[2]}`
    : 'dashboard';

  const handleSelectTab = (tab: string) => {
    if (tab.startsWith('exp-')) {
      navigate(`/experiment/${tab.replace('exp-', '')}`);
    } else {
      navigate('/');
    }
  };

  const handleSelectExperiment = (exp: Experiment) => {
    navigate(`/experiment/${exp.num}`);
  };

  return (
    // ─────────────────────────────────────────────────────────────────
    // ROOT SHELL  — full viewport, horizontal flex (sidebar | main)
    // ─────────────────────────────────────────────────────────────────
    <div className="h-screen w-screen flex overflow-hidden bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">

      {/* ── SIDEBAR (fixed 280px, never shrinks) ── */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
      />

      {/* ── MAIN COLUMN (everything to the right of sidebar) ── */}
      <div className="flex-1 min-w-0 flex flex-col">

        {/* TOP HEADER — 72px sticky bar */}
        <TopHeader
          searchVal={searchVal}
          setSearchVal={setSearchVal}
        />

        {/* PAGE CONTENT — scrollable, full remaining height */}
        <main className="flex-1 overflow-y-auto">
          {/* Inner centering wrapper — never exceeds 1600px, always padded 32px */}
          <div className="w-full max-w-[1600px] mx-auto px-8 py-8 flex flex-col min-h-full">
            <div className="flex-1">
              <Routes>
                <Route path="/" element={<DashboardView searchVal={searchVal} onSelectExperiment={handleSelectExperiment} />} />
                <Route path="/experiment/:id" element={<ExperimentWrapper onBack={() => navigate('/')} onShowToast={showToast} />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
            
            {/* GLOBAL AUTHORSHIP & COPYRIGHT FOOTER */}
            <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px] items-center text-slate-500">
              
              {/* Column 1: Product Definition */}
              <div className="flex flex-col gap-1 border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 pb-4 md:pb-0 md:pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-blue-600 dark:text-blue-400 text-sm">GeoTech Lab</span>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <span className="font-medium text-slate-600 dark:text-slate-300 tracking-wide text-xs">Soil Testing Suite</span>
                </div>
                <p>Accurate Testing. Reliable Engineering.</p>
                <p>An Engineering Laboratory Software for Soil Testing, Calculations and Analysis.</p>
              </div>

              {/* Column 2: Creator Attribution */}
              <div className="flex flex-col gap-1 text-center border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 pb-4 md:pb-0 px-4">
                <span className="font-semibold text-slate-400">Created & Developed by</span>
                <span className="font-extrabold text-blue-600 dark:text-blue-400 text-sm tracking-wide">Singarapu Prasanna Kumar</span>
              </div>

              {/* Column 3: Copyright */}
              <div className="flex flex-col gap-1 md:text-right md:pl-4">
                <span className="font-medium text-slate-500">© 2026 Singarapu Prasanna Kumar.</span>
                <span className="font-medium text-slate-500">All Rights Reserved.</span>
              </div>

            </div>
          </div>
        </main>
      </div>

      {/* ── TOAST NOTIFICATIONS ── */}
      <div className="fixed top-20 right-8 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div
            key={t.id}
            className="pointer-events-auto bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-2xl border border-slate-700 dark:border-slate-200 flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-right duration-200"
          >
            <Info className="w-4 h-4 text-blue-400 dark:text-blue-600 shrink-0" />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AntigravityProvider theme="light" animations={true} rounded="xl" shadows="soft" density="comfortable">
      <Router>
        <AppContent />
      </Router>
    </AntigravityProvider>
  );
};
