
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChatMessage, Product, Order } from '../types';
import { salesService } from '../services/gemini';
import { Language, translations } from '../translations';
import InvoiceView, { InvoiceData } from './InvoiceView';

interface ChatBotProps {
  language: Language;
  products: Product[];
  isAdmin?: boolean;
  onAdminLoginRequest?: () => void;
  onOrderConfirmed?: (order: Order) => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ language, products, isAdmin = false, onAdminLoginRequest, onOrderConfirmed }) => {
  const t = useMemo(() => translations[language].chat, [language]);
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize welcome message
  useEffect(() => {
    setMessages([
      { role: 'model', text: t.welcome, timestamp: new Date() }
    ]);
    salesService.startConversation(products);
  }, [language, t.welcome, products]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const extractInvoiceData = (text: string): { cleanText: string; data: InvoiceData | null } => {
    const jsonRegex = /```json\s*(\{[\s\S]*?"invoice_data"[\s\S]*?\})\s*```/g;
    const match = jsonRegex.exec(text);
    
    if (match && match[1]) {
      try {
        const parsed = JSON.parse(match[1]);
        const cleanText = text.replace(jsonRegex, '').trim();
        return { cleanText, data: parsed.invoice_data };
      } catch (e) {
        console.error("Failed to parse invoice JSON", e);
      }
    }
    return { cleanText: text, data: null };
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!process.env.API_KEY) {
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: "Configuration Error: API Key is missing. Please check your environment variables.", 
        timestamp: new Date() 
      }]);
      return;
    }

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseRaw = await salesService.sendMessage(input, products);
      const { cleanText, data } = extractInvoiceData(responseRaw || '');
      
      const modelMsg: ChatMessage = { role: 'model', text: cleanText || t.processingError, timestamp: new Date() };
      setMessages(prev => [...prev, modelMsg]);

      if (data) {
        // Automatically save order if callback exists
        if (onOrderConfirmed) {
          onOrderConfirmed({
            id: `ORD-${Date.now()}`,
            customerName: data.customer_name,
            items: data.items,
            total: data.total,
            date: data.date,
            status: 'confirmed'
          });
        }
        
        // Delay invoice showing slightly for better flow
        setTimeout(() => setCurrentInvoice(data), 1000);
      }
    } catch (error: any) {
      console.error("Chat Error Detail:", error);
      let errorText = t.error;
      
      // More descriptive error for common issues
      if (error?.message?.includes('API key not valid')) {
        errorText = "Invalid API Key. Please update your environment variables.";
      } else if (error?.message?.includes('Requested entity was not found')) {
        errorText = "The AI model is currently unavailable. Please try again later.";
      }
      
      setMessages(prev => [...prev, { role: 'model', text: errorText, timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`flex flex-col h-full ${isAdmin ? 'bg-white rounded-[2.5rem] shadow-xl border border-slate-100 overflow-hidden relative h-[calc(100vh-120px)]' : 'bg-transparent overflow-hidden relative'}`}>
      {currentInvoice && (
        <InvoiceView data={currentInvoice} onClose={() => setCurrentInvoice(null)} />
      )}

      <div className={`p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10 ${isAdmin ? 'bg-slate-50/80 backdrop-blur-md' : 'bg-white'}`}>
        <div>
          <h2 className="font-black text-slate-800 tracking-tight">{isAdmin ? 'Live Sales Simulation' : 'Gadget Wall Sales Assistant'}</h2>
          <p className="text-[10px] text-green-600 font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_green]"></span> {t.online}
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => {
              setMessages([{ role: 'model', text: t.resetMsg, timestamp: new Date() }]);
              salesService.startConversation(products);
            }} 
            className="text-[10px] bg-white hover:bg-slate-100 border border-slate-200 px-4 py-2 rounded-full text-slate-600 font-black uppercase tracking-widest transition-colors shadow-sm"
          >
            {t.reset}
          </button>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-5 rounded-[2rem] shadow-sm leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none shadow-blue-100' 
                : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
            }`}>
              <p className="text-sm font-medium whitespace-pre-wrap">{msg.text}</p>
              <p className={`text-[10px] mt-3 font-bold uppercase tracking-widest opacity-40 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-100 p-5 rounded-[2rem] rounded-tl-none flex gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        )}
      </div>

      <div className={`p-6 bg-white border-t border-slate-100`}>
        <div className="flex gap-3 bg-slate-50 p-2 rounded-3xl border border-slate-100 shadow-inner">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={t.placeholder}
            className="flex-1 bg-transparent border-none focus:ring-0 px-4 py-3 text-sm font-medium text-slate-700"
          />
          <button
            onClick={handleSend}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-2xl transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:scale-95 active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-[10px] text-slate-400 text-center mt-4 font-bold uppercase tracking-widest">
          {t.tryQuery}
        </p>
      </div>
    </div>
  );
};

export default ChatBot;
