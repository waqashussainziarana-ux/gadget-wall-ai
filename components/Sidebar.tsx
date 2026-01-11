
import React from 'react';
import { AppTab } from '../types';
import { translations, Language } from '../translations';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, language, setLanguage }) => {
  const t = translations[language].sidebar;

  const menuItems = [
    { id: AppTab.CHAT, label: t.chat, icon: '💬' },
    { id: AppTab.CATALOG, label: t.catalog, icon: '📱' },
    { id: AppTab.LEAD_GEN, label: t.leadGen, icon: '🔍' },
    { id: AppTab.PROMPT, label: t.prompt, icon: '🧠' },
    { id: AppTab.STRATEGY, label: t.strategy, icon: '📈' },
  ];

  return (
    <div className="w-64 bg-slate-900 text-white h-screen flex flex-col fixed left-0 top-0 shadow-xl z-20">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <span className="text-blue-400 text-2xl">G</span> Gadget Wall AI
        </h1>
        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Sales Strategist</p>
      </div>
      
      <nav className="flex-1 py-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-6 py-3 transition-colors ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white border-r-4 border-blue-300 shadow-inner' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-slate-800 space-y-4">
        <div className="flex gap-2">
           <button 
             onClick={() => setLanguage('pt')}
             className={`flex-1 py-2 rounded-lg text-[10px] font-bold border ${language === 'pt' ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}
           >
             🇵🇹 PORTUGUÊS
           </button>
           <button 
             onClick={() => setLanguage('en')}
             className={`flex-1 py-2 rounded-lg text-[10px] font-bold border ${language === 'en' ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}
           >
             🇬🇧 ENGLISH
           </button>
        </div>
        <div className="text-[10px] text-slate-500">
          <p>{t.market} 🇵🇹</p>
          <p className="mt-1">{t.status}</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
