import React, { useState } from 'react';
import { Sparkles, BookOpen, BrainCircuit, FileText, Scale, Calculator, Search, HelpCircle, Send, Bot, User } from 'lucide-react';

interface AICopilotViewProps {
  onShowToast: (msg: string) => void;
}

export const AICopilotView: React.FC<AICopilotViewProps> = ({ onShowToast }) => {
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Welcome to GeoLab AI Copilot — your intelligent geotechnical assistant. Select a action shortcut or type any question regarding ASTM/IS standards, soil classification, or failure envelope analysis.'
    }
  ]);
  const [inputVal, setInputVal] = useState('');

  const shortcuts = [
    { title: 'Explain ASTM D4318', icon: BookOpen, prompt: 'Explain the testing procedure and precision limits of ASTM D4318 Atterberg limits.' },
    { title: 'Predict Soil Type', icon: BrainCircuit, prompt: 'Predict USCS soil classification for LL=45%, PL=22%, Fines=65%.' },
    { title: 'Generate Report Summary', icon: FileText, prompt: 'Generate an executive geotechnical summary for Project NH-16.' },
    { title: 'Compare Samples', icon: Scale, prompt: 'Compare shear strength parameters between Sample BH-01 and BH-02.' },
    { title: 'Calculate Moisture', icon: Calculator, prompt: 'Calculate moisture content for M1=25.4g, M2=142.8g, M3=124.6g.' },
    { title: 'Find Reports', icon: Search, prompt: 'Find all CBR test reports generated this month.' }
  ];

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend || inputVal;
    if (!text.trim()) return;

    setMessages(prev => [...prev, { sender: 'user', text }]);
    if (!textToSend) setInputVal('');

    setTimeout(() => {
      let aiText = 'Analysis Complete: Based on liquid limit LL = 45% and plasticity index PI = 23%, the plasticity plotted on Casagrande Plasticity Chart lies strictly above the A-Line (PI = 0.73 × [LL - 20] = 18.25%). Soil classifies as CI (Medium Plasticity Clay).';
      if (text.includes('ASTM D4318')) {
        aiText = 'ASTM D4318 standard covers the determination of the liquid limit, plastic limit, and plasticity index of soils using the Casagrande percussion cup device and 3mm thread rolling methods.';
      }
      setMessages(prev => [...prev, { sender: 'ai', text: aiText }]);
    }, 600);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          GeoLab AI Engineering Copilot
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Trained on ASTM, AASHTO, and IS Geotechnical Soil Mechanics Standards.
        </p>
      </div>

      {/* SHORTCUT CARDS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {shortcuts.map((sc, idx) => {
          const Icon = sc.icon;
          return (
            <button
              key={idx}
              onClick={() => handleSendMessage(sc.prompt)}
              className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 flex flex-col items-center text-center gap-2 transition-all hover:-translate-y-0.5 group"
            >
              <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center">
                <Icon className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-purple-600">{sc.title}</span>
            </button>
          );
        })}
      </div>

      {/* CHAT CONVERSATION WORKSPACE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex flex-col h-[480px] shadow-soft overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-purple-50/40 dark:bg-purple-950/20 flex items-center justify-between">
          <span className="text-xs font-bold text-purple-700 dark:text-purple-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Live Intelligent Session
          </span>
          <span className="text-[11px] text-slate-400">Model: GeoLab-LLM-v2.4</span>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs shrink-0 ${
                m.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
              }`}>
                {m.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className={`p-4 rounded-2xl text-xs max-w-[75%] leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/80 dark:border-slate-700/80 shadow-sm'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3">
          <input
            type="text"
            placeholder="Ask Copilot regarding soil parameters, standards, or report calculations..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-purple-600"
          />
          <button
            onClick={() => handleSendMessage()}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors"
          >
            Send Question
          </button>
        </div>
      </div>
    </div>
  );
};
