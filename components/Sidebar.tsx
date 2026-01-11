
import React from 'react';
import { AppTab } from '../types';
import { translations, Language } from '../translations';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  user: { name: string; email: string } | null;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, language, setLanguage, user, onLogout, isOpen, onClose }) => {
  const t = translations[language].sidebar;
  const authT = translations[language].auth;

  const menuItems = [
    { id: AppTab.CHAT, label: t.chat, icon: '💬' },
    { id: AppTab.CATALOG, label: t.catalog, icon: '📱' },
    { id: AppTab.ORDERS, label: t.orders, icon: '📄' },
    { id: AppTab.LEAD_GEN, label: t.leadGen, icon: '🔍' },
    { id: AppTab.PROMPT, label: t.prompt, icon: '🧠' },
    { id: AppTab.STRATEGY, label: t.strategy, icon: '📈' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col shadow-xl z-50 transition-transform duration-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <span className="text-blue-400 text-2xl">G</span> Gadget Wall AI
            </h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">Sales Strategist</p>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="p-4 border-b border-slate-800">
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-[10px] font-black uppercase">
                 {user?.name?.slice(0, 2) || 'AD'}
               </div>
               <div className="overflow-hidden">
                 <p className="text-xs font-bold truncate">{user?.name}</p>
                 <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
               </div>
            </div>
            <button 
              onClick={onLogout}
              className="w-full mt-3 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-red-400 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              {authT.logout}
            </button>
          </div>
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
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
               🇵🇹 PT
             </button>
             <button 
               onClick={() => setLanguage('en')}
               className={`flex-1 py-2 rounded-lg text-[10px] font-bold border ${language === 'en' ? 'bg-blue-600 border-blue-500 text-white' : 'border-slate-700 text-slate-500 hover:border-slate-500'}`}
             >
               🇬🇧 EN
             </button>
          </div>
          <div className="text-[10px] text-slate-500">
            <p>{t.market} 🇵🇹</p>
            <p className="mt-1">{t.status}</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
