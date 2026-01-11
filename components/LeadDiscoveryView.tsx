
import React, { useState, useMemo } from 'react';
import { Language, translations } from '../translations';
import { salesService } from '../services/gemini';
import { Lead } from '../types';

interface LeadDiscoveryViewProps {
  language: Language;
}

const LeadDiscoveryView: React.FC<LeadDiscoveryViewProps> = ({ language }) => {
  const t = useMemo(() => translations[language].leadGen, [language]);
  const [query, setQuery] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const steps = [
    t.discoverySteps.sources,
    t.discoverySteps.engine,
    t.discoverySteps.scoring,
    t.discoverySteps.outreach
  ];

  const handleDiscover = async () => {
    if (!query.trim() || isLoading) return;
    setIsLoading(true);
    setLeads([]);
    
    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev < 3 ? prev + 1 : prev));
    }, 1500);

    try {
      const discoveredLeads = await salesService.discoverLeads(query, language);
      setLeads(discoveredLeads);
    } catch (error) {
      console.error(error);
      alert("Error searching for leads. Please check your API key.");
    } finally {
      setIsLoading(false);
      setCurrentStep(0);
      clearInterval(stepInterval);
    }
  };

  const handleContact = (lead: Lead) => {
    navigator.clipboard.writeText(lead.outreachMessage);
    setCopiedId(lead.id || lead.sourceUrl);
    setTimeout(() => setCopiedId(null), 3000);

    if (lead.sourceUrl) {
      window.open(lead.sourceUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert("Source link not available for this lead.");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-2xl sm:rounded-[3rem] p-6 sm:p-12 shadow-xl shadow-slate-200 border border-slate-100">
        <div className="max-w-3xl">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2 sm:mb-4">{t.title}</h2>
          <p className="text-slate-500 text-sm sm:text-lg leading-relaxed">{t.subtitle}</p>
        </div>

        <div className="mt-6 sm:mt-10 relative">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
            <input 
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleDiscover()}
              placeholder={t.searchPlaceholder}
              className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-xl sm:rounded-[2rem] px-4 sm:px-8 py-3.5 sm:py-5 text-sm sm:text-lg font-medium focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all"
            />
            <button 
              onClick={handleDiscover}
              disabled={isLoading || !query.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 sm:px-10 py-3.5 sm:py-5 rounded-xl sm:rounded-[2rem] font-black text-sm sm:text-lg shadow-xl shadow-blue-200 transition-all flex items-center justify-center gap-2 sm:gap-3 active:scale-95"
            >
              {isLoading ? (
                <span className="w-5 h-5 sm:w-6 sm:h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              )}
              {isLoading ? t.searching : t.discoverBtn}
            </button>
          </div>

          {isLoading && (
            <div className="mt-6 sm:mt-8 space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-top-4">
              <div className="flex justify-between items-center px-2">
                {steps.map((step, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1.5 sm:gap-3">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all ${idx <= currentStep ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                      {idx + 1}
                    </div>
                    <span className={`text-[7px] sm:text-[10px] font-black uppercase tracking-widest text-center max-w-[50px] sm:max-w-[80px] ${idx <= currentStep ? 'text-blue-600' : 'text-slate-300'}`}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
              <div className="h-1.5 sm:h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(37,99,235,0.5)]"
                  style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {leads.length > 0 && (
        <div className="space-y-4 sm:space-y-6">
          <h3 className="text-xl sm:text-2xl font-black text-slate-800 px-2 sm:px-4 flex items-center gap-2 sm:gap-3">
            <span className="bg-green-100 text-green-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm">{leads.length}</span>
            {t.results}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 pb-12 sm:pb-20">
            {leads.map((lead, idx) => {
              const leadId = lead.id || lead.sourceUrl;
              const isCopied = copiedId === leadId;
              
              return (
                <div key={idx} className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-100 p-6 sm:p-8 shadow-sm hover:shadow-xl transition-all group flex flex-col relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4 sm:mb-6">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-50 text-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center font-bold text-lg">
                        {lead.platform ? lead.platform[0].toUpperCase() : 'L'}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-black text-slate-800 leading-tight truncate text-sm sm:text-base">{lead.title}</h4>
                        <p className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 truncate">{lead.platform || 'General Search'}</p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 sm:gap-2">
                      <div className="flex flex-col items-center">
                        <div className="text-[7px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5 sm:mb-1">{t.intent}</div>
                        <div className={`text-[10px] sm:text-sm font-black w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 ${lead.intentScore > 80 ? 'border-green-500 text-green-600' : 'border-blue-500 text-blue-600'}`}>
                          {lead.intentScore}
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="text-[7px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-tighter mb-0.5 sm:mb-1">{t.fit}</div>
                        <div className={`text-[10px] sm:text-sm font-black w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center border-2 ${lead.fitScore > 80 ? 'border-green-500 text-green-600' : 'border-blue-500 text-blue-600'}`}>
                          {lead.fitScore}
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-600 text-xs sm:text-sm italic mb-4 sm:mb-6 leading-relaxed bg-slate-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-100">
                    "{lead.snippet}"
                  </p>

                  <div className="space-y-2 sm:space-y-3 flex-1">
                    <label className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">{t.message}</label>
                    <div className="bg-blue-50 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-blue-100 text-blue-900 text-[10px] sm:text-sm leading-relaxed relative group/msg">
                      {lead.outreachMessage}
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(lead.outreachMessage);
                          setCopiedId(leadId);
                          setTimeout(() => setCopiedId(null), 2000);
                        }}
                        className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 p-1.5 sm:p-2 bg-white rounded-lg sm:rounded-xl shadow-sm border border-blue-100 text-blue-400 hover:text-blue-600 transition-all opacity-0 group-hover/msg:opacity-100"
                        title="Copy Message"
                      >
                        {isCopied ? (
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <a 
                      href={lead.sourceUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-[10px] sm:text-xs font-bold text-slate-400 hover:text-blue-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                      View Original Source
                    </a>
                    
                    <button 
                      onClick={() => handleContact(lead)}
                      className={`w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
                        isCopied 
                        ? 'bg-green-500 text-white shadow-green-100' 
                        : 'bg-blue-600 text-white shadow-blue-100 hover:bg-blue-700'
                      }`}
                    >
                      {isCopied ? (
                        <>
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                          Copied...
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                          {t.contact}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isLoading && leads.length === 0 && (
        <div className="text-center py-16 sm:py-24 bg-white rounded-2xl sm:rounded-[3rem] border-4 border-dashed border-slate-100">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <svg className="w-8 h-8 sm:w-12 sm:h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] sm:text-sm">{t.noLeads}</p>
        </div>
      )}
    </div>
  );
};

export default LeadDiscoveryView;
