
import React, { useState, useMemo, useEffect } from 'react';
import { AppTab, Product, Order } from './types';
import Sidebar from './components/Sidebar';
import ChatBot from './components/ChatBot';
import ProductCatalogView from './components/ProductCatalogView';
import StrategyView from './components/StrategyView';
import LeadDiscoveryView from './components/LeadDiscoveryView';
import OrdersView from './components/OrdersView';
import AuthView from './components/AuthView';
import { generateSystemPrompt, PRODUCT_CATALOG as INITIAL_CATALOG } from './constants';
import { translations, Language } from './translations';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.CHAT);
  const [products, setProducts] = useState<Product[]>(INITIAL_CATALOG);
  const [orders, setOrders] = useState<Order[]>([]);
  const [language, setLanguage] = useState<Language>('en'); 
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const browserLang = navigator.language.toLowerCase();
    const detectedLang: Language = browserLang.startsWith('pt') ? 'pt' : 'en';
    
    const savedLang = localStorage.getItem('gw_lang') as Language;
    if (savedLang) {
      setLanguage(savedLang);
    } else {
      setLanguage(detectedLang);
    }

    const savedUser = localStorage.getItem('gw_session');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const savedOrders = localStorage.getItem('gw_orders');
    if (savedOrders) {
      setOrders(JSON.parse(savedOrders));
    }

    setIsReady(true);
  }, []);

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('gw_lang', lang);
  };

  const handleLogin = (userData: { name: string; email: string }) => {
    setUser(userData);
    setShowAuthScreen(false);
    localStorage.setItem('gw_session', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab(AppTab.CHAT);
    localStorage.removeItem('gw_session');
  };

  const handleOrderConfirmed = (order: Order) => {
    setOrders(prev => {
      const updated = [...prev, order];
      localStorage.setItem('gw_orders', JSON.stringify(updated));
      return updated;
    });
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
        return <ChatBot language={language} products={products} isAdmin={!!user} onAdminLoginRequest={() => setShowAuthScreen(true)} onOrderConfirmed={handleOrderConfirmed} />;
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
      case AppTab.ORDERS:
        return <OrdersView orders={orders} language={language} />;
      case AppTab.LEAD_GEN:
        return <LeadDiscoveryView language={language} />;
      case AppTab.PROMPT:
        return (
          <div className="p-4 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-4">{t.prompt.title}</h2>
            <div className="bg-slate-900 text-slate-300 p-4 sm:p-8 rounded-2xl font-mono text-xs sm:text-sm leading-relaxed overflow-x-auto shadow-2xl border border-slate-700">
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
        return <ChatBot language={language} products={products} isAdmin={!!user} onOrderConfirmed={handleOrderConfirmed} />;
    }
  };

  if (!isReady) return null;

  if (showAuthScreen && !user) {
    return <AuthView language={language} setLanguage={handleSetLanguage} onLogin={handleLogin} onBack={() => setShowAuthScreen(false)} />;
  }

  if (!user) {
    return (
      <div className="bg-slate-50 min-h-screen flex flex-col">
        <header className="h-16 sm:h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center px-4 sm:px-8 sticky top-0 z-50">
          <div className="flex-1 flex items-center gap-2 sm:gap-3">
             <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-lg shadow-blue-100">G</div>
             <div>
               <h1 className="text-sm sm:text-lg font-black text-slate-900 tracking-tight">Gadget Wall</h1>
               <p className="text-[8px] sm:text-[10px] font-bold text-blue-600 uppercase tracking-widest">{t.sidebar.market}</p>
             </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
             <div className="hidden xs:flex bg-slate-100 p-1 rounded-xl">
                <button onClick={() => handleSetLanguage('pt')} className={`px-2 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${language === 'pt' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>PT</button>
                <button onClick={() => handleSetLanguage('en')} className={`px-2 sm:px-4 py-1 sm:py-1.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${language === 'en' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}>EN</button>
             </div>
             <button 
               onClick={() => setShowAuthScreen(true)}
               className="bg-slate-900 text-white px-3 sm:px-6 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
             >
               Staff
             </button>
          </div>
        </header>
        <div className="flex-1 max-w-5xl mx-auto w-full p-2 sm:p-4 lg:p-10 flex flex-col">
          <div className="flex-1 bg-white rounded-2xl sm:rounded-[3rem] shadow-2xl shadow-slate-200 border border-slate-100 overflow-hidden flex flex-col">
             <ChatBot language={language} products={products} isAdmin={false} onOrderConfirmed={handleOrderConfirmed} />
          </div>
        </div>
        <footer className="p-4 sm:p-6 text-center">
           <p className="text-[8px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest">© 2024 Gadget Wall Electronics • Porto, Portugal</p>
        </footer>
      </div>
    );
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
        }} 
        language={language} 
        setLanguage={handleSetLanguage}
        user={user}
        onLogout={handleLogout}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      
      <main className="flex-1 w-full lg:ml-64 min-h-screen flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 sm:px-8 sticky top-0 z-40">
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden p-2 -ml-2 mr-2 text-slate-500 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
          </button>
          <div className="flex-1 truncate">
            <h1 className="text-[10px] sm:text-sm font-semibold text-slate-500 uppercase tracking-wider truncate">
              {activeTab === AppTab.CHAT && t.header.chat}
              {activeTab === AppTab.CATALOG && t.header.catalog}
              {activeTab === AppTab.ORDERS && t.header.orders}
              {activeTab === AppTab.LEAD_GEN && t.header.leadGen}
              {activeTab === AppTab.PROMPT && t.header.prompt}
              {activeTab === AppTab.STRATEGY && t.header.strategy}
            </h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl">
              <button 
                onClick={() => handleSetLanguage('pt')}
                className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${language === 'pt' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                PT
              </button>
              <button 
                onClick={() => handleSetLanguage('en')}
                className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${language === 'en' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
              >
                EN
              </button>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-right hidden xs:block">
                <p className="text-[10px] sm:text-xs font-bold text-slate-800">{t.header.hub}</p>
                <p className="text-[8px] sm:text-[10px] text-slate-400">{t.header.time}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                {user.name.slice(0, 1)}
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 w-full max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
