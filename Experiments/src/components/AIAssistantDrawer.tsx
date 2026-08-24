import React, { useState } from 'react';
import { Sparkles, X, Send, Bot, User, CheckCircle2, Lightbulb, FileText, BrainCircuit } from 'lucide-react';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({ isOpen, onClose, onShowToast }) => {
  if (!isOpen) return null;

  const [inputMsg, setInputMsg] = useState('');
  const [messages, setMessages] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am your GeoLab AI Engineering Assistant. I can predict USCS soil classifications, analyze CBR failure envelopes, check compaction OMC, or generate formal test reports. What would you like to do today?'
    }
  ]);

  const handleSend = () => {
    if (!inputMsg.trim()) return;

    const userText = inputMsg;
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputMsg('');

    setTimeout(() => {
      let response = 'Analyzing soil testing dataset... Based on the index properties (Liquid Limit = 42%, Plasticity Index = 18%), the soil falls above the A-line in the USCS Chart, classifying as CI (Silty Clay of Medium Compressibility).';
      if (userText.toLowerCase().includes('cbr')) {
        response = 'For the CBR penetration test, maximum bearing resistance occurred at 2.5mm penetration (98 kgf, CBR = 7.15%). The subgrade qualifies for Heavy Highway Pavement (Class B).';
      }
      setMessages(prev => [...prev, { sender: 'ai', text: response }]);
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 h-full flex flex-col shadow-2xl">
        {/* HEADER */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-purple-50/50 dark:bg-purple-950/30">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">GeoLab AI Assistant</h3>
              <span className="text-[11px] text-purple-600 dark:text-purple-400 font-semibold">Geotechnical Intelligence Model</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QUICK SUGGESTIONS */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px] scrollbar-none">
          <button 
            onClick={() => { setInputMsg('Predict Soil Classification for BH-04'); }}
            className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap hover:border-purple-500"
          >
            <BrainCircuit className="w-3 h-3 inline mr-1 text-purple-600" />
            Predict Soil Class
          </button>
          <button 
            onClick={() => { setInputMsg('Generate Engineering Executive Summary'); }}
            className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap hover:border-purple-500"
          >
            <FileText className="w-3 h-3 inline mr-1 text-blue-600" />
            Generate Summary
          </button>
        </div>

        {/* CHAT MESSAGES */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex items-start gap-2.5 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                m.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-purple-600 text-white'
              }`}>
                {m.sender === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div className={`p-3 rounded-2xl text-xs max-w-[82%] leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none border border-slate-200/60 dark:border-slate-700/60'
              }`}>
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* INPUT */}
        <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder="Ask AI to analyze soil tests..."
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:border-purple-600"
          />
          <button
            onClick={handleSend}
            className="w-9 h-9 rounded-xl bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
