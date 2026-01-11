
import React, { useState, useMemo, useEffect } from 'react';
import { AppTab, Product } from './types';
import Sidebar from './components/Sidebar';
import ChatBot from './components/ChatBot';
import ProductCatalogView from './components/ProductCatalogView';
import StrategyView from './components/StrategyView';
import LeadDiscoveryView from './components/LeadDiscoveryView';
import AuthView from './components/AuthView';
import { generateSystemPrompt, PRODUCT_CATALOG as INITIAL_CATALOG } from './constants';
import { translations, Language } from './translations';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.CHAT);
  const [products, setProducts] = useState<Product[]>(INITIAL_CATALOG);
  const [language, setLanguage] = useState<Language>('en'); // Default to EN
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 1. Detect browser language
    const browserLang = navigator.language.toLowerCase();
    const detectedLang: Language = browserLang.startsWith('pt') ? 'pt' : 'en';
    
    // 2. Check for saved language preference
    const savedLang = localStorage.getItem('gw_lang') as Language;
    if (savedLang) {
      setLanguage(savedLang);
    } else {
      setLanguage(detectedLang);
    }

    // 3. Check for existing session
    const savedUser = localStorage.getItem('gw_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsReady(true);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('gw_lang', lang);
  };

  const handleLogin = (userData: { name: string; email: string }) => {
    setUser(userData);
    localStorage.setItem('gw_session', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('gw_session');
  };

  const t = useMemo(() => translations[language], [language]);

  const handleUpdateStock = (productId: string, newSerials: string[]) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const existingSerials = p.serialNumbers || [];
        return {
          ...p,
          stock: p.stock + newSerials.length,
          serialNumbers: [...existingSerials, ...newSerials]
        };
      }
      return p;
    }));
  };

  const handleAddProducts = (newProducts: Product[]) => {
    setProducts(prev => [...prev, ...newProducts]);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const renderContent = () => {
    switch (activeTab) {
      case AppTab.CHAT:
        return <ChatBot language={language} products={products} />;
      case AppTab.CATALOG:
        return (
          <ProductCatalogView 
            products={products} 
            onUpdateStock={handleUpdateStock} 
            onAddProducts={handleAddProducts}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            language={language} 
          />
        );
      case AppTab.LEAD_GEN:
        return <LeadDiscoveryView language={language} />;
      case AppTab.PROMPT:
        return (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-4">{t.prompt.title}</h2>
            <div className="bg-slate-900 text-slate-300 p-8 rounded-2xl font-mono text-sm leading-relaxed overflow-x-auto shadow-2xl border border-slate-700">
              <pre className="whitespace-pre-wrap">{generateSystemPrompt(products)}</pre>
            </div>
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm italic">
              {t.prompt.note}
            </div>
          </div>
        );
      case AppTab.STRATEGY:
        return <StrategyView language={language} />;
      default:
        return <ChatBot language={language} products={products} />;
    }
  };

  if (!isReady) return null;

  if (!user) {
    return <AuthView language={language} setLanguage={handleSetLanguage} onLogin={handleLogin} />;
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        language={language} 
        setLanguage={handleSetLanguage}
        user={user}
        onLogout={handleLogout}
      />
      
      <main className="flex-1 ml-64 min-h-screen">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 sticky top-0 z-10">
          <div className="flex-1">
            <h1 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
              {activeTab === AppTab.CHAT && t.header.chat}
              {activeTab === AppTab.CATALOG && t.header.catalog}
              {activeTab === AppTab.LEAD_GEN && t.header.leadGen}
              {activeTab === AppTab.PROMPT && t.header.prompt}
              {activeTab === AppTab.STRATEGY && t.header.strategy}
            </h1>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => handleSetLanguage('pt')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${language === 'pt' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                PT
              </button>
              <button 
                onClick={() => handleSetLanguage('en')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${language === 'en' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                EN
              </button>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-800">{t.header.hub}</p>
                <p className="text-[10px] text-slate-400">{t.header.time}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                {user.name.slice(0, 1)}
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto p-4 lg:p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
