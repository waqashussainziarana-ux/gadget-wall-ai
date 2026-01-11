
import React, { useMemo } from 'react';
import { Language, translations } from '../translations';

interface StrategyViewProps {
  language: Language;
}

const StrategyView: React.FC<StrategyViewProps> = ({ language }) => {
  const t = useMemo(() => translations[language].strategy, [language]);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-slate-800 mb-2">{t.title}</h2>
      <p className="text-slate-500 mb-10 text-lg">{t.subtitle}</p>

      <div className="space-y-12">
        <section>
          <h3 className="text-xl font-bold text-slate-700 mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm italic">1</span>
            {t.funnel}
          </h3>
          <div className="relative pl-8 border-l-2 border-slate-200 space-y-8">
            {t.steps.map((step, idx) => (
              <div key={idx} className="relative">
                <div className={`absolute -left-10 top-0 w-4 h-4 rounded-full border-4 border-white shadow-sm ${idx === 3 ? 'bg-green-500' : 'bg-blue-600'}`} style={{ opacity: 1 - idx * 0.15 }}></div>
                <h4 className="font-bold text-slate-800">{step.title}</h4>
                <p className="text-slate-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {t.tactics.map((tactic, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <h4 className="font-bold text-blue-600 mb-2">{tactic.title}</h4>
              <p className="text-slate-600 text-sm leading-relaxed">{tactic.desc}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default StrategyView;
