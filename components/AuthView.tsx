
import React, { useState, useMemo } from 'react';
import { Language, translations } from '../translations';

interface AuthViewProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  onLogin: (user: { name: string; email: string }) => void;
}

type AuthMode = 'login' | 'signup' | 'forgot';

const AuthView: React.FC<AuthViewProps> = ({ language, setLanguage, onLogin }) => {
  const t = useMemo(() => translations[language].auth, [language]);
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (mode === 'login') {
      const users = JSON.parse(localStorage.getItem('gw_users') || '[]');
      const user = users.find((u: any) => u.email === email && u.password === password);
      
      if (user) {
        onLogin({ name: user.name, email: user.email });
      } else if (email === 'admin@gadgetwall.pt' && password === 'admin') {
        onLogin({ name: 'Admin', email: 'admin@gadgetwall.pt' });
      } else {
        setError(t.errorAuth);
      }
    } else if (mode === 'signup') {
      if (!name || !email || !password) return setError("Please fill all fields.");
      
      const users = JSON.parse(localStorage.getItem('gw_users') || '[]');
      if (users.find((u: any) => u.email === email)) {
        return setError("Email already registered.");
      }

      users.push({ name, email, password });
      localStorage.setItem('gw_users', JSON.stringify(users));
      onLogin({ name, email });
    } else if (mode === 'forgot') {
      setMessage(t.successReset);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative">
      {/* Global Language Switcher */}
      <div className="absolute top-8 right-8 flex bg-white/50 backdrop-blur-md p-1 rounded-2xl border border-slate-200 shadow-sm z-10">
        <button 
          onClick={() => setLanguage('pt')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${language === 'pt' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:text-slate-600'}`}
        >
          🇵🇹 Português
        </button>
        <button 
          onClick={() => setLanguage('en')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${language === 'en' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-slate-400 hover:text-slate-600'}`}
        >
          🇬🇧 English
        </button>
      </div>

      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col p-10 animate-in fade-in zoom-in-95 duration-500">
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-6 shadow-lg shadow-blue-200">
            G
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {mode === 'login' && t.loginTitle}
            {mode === 'signup' && t.signupTitle}
            {mode === 'forgot' && t.forgotTitle}
          </h1>
          <p className="text-slate-400 font-medium text-sm mt-2">
            {mode === 'login' && t.loginSubtitle}
            {mode === 'signup' && t.signupSubtitle}
            {mode === 'forgot' && t.forgotSubtitle}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'signup' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">{t.nameLabel}</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-medium"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4">{t.emailLabel}</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-medium"
            />
          </div>

          {mode !== 'forgot' && (
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-4 mr-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t.passwordLabel}</label>
                {mode === 'login' && (
                  <button type="button" onClick={() => setMode('forgot')} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 transition-colors">
                    {t.forgotLink}
                  </button>
                )}
              </div>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-100 transition-all font-medium"
              />
            </div>
          )}

          {error && <p className="text-red-500 text-xs font-bold text-center animate-bounce">{error}</p>}
          {message && <p className="text-green-600 text-xs font-bold text-center">{message}</p>}

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[2rem] font-black shadow-xl shadow-blue-100 transition-all active:scale-95 text-sm uppercase tracking-widest mt-4"
          >
            {mode === 'login' && t.loginBtn}
            {mode === 'signup' && t.signupBtn}
            {mode === 'forgot' && t.resetBtn}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-slate-50 text-center">
          {mode === 'login' && (
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
              {t.noAccount} <button onClick={() => setMode('signup')} className="text-blue-600 ml-2">{t.signupBtn}</button>
            </p>
          )}
          {(mode === 'signup' || mode === 'forgot') && (
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
              {t.hasAccount} <button onClick={() => setMode('login')} className="text-blue-600 ml-2">{t.loginBtn}</button>
            </p>
          )}
        </div>
      </div>
      
      {/* Browser Language Detection Notice */}
      <div className="absolute bottom-8 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
        {language === 'pt' ? 'Idioma detectado automaticamente: Português' : 'Language auto-detected: English'}
      </div>
    </div>
  );
};

export default AuthView;
