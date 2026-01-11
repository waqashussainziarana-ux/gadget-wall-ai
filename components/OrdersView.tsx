
import React, { useMemo, useState } from 'react';
import { Order } from '../types';
import { Language, translations } from '../translations';
import InvoiceView from './InvoiceView';

interface Props {
  orders: Order[];
  language: Language;
}

const OrdersView: React.FC<Props> = ({ orders, language }) => {
  const t = useMemo(() => translations[language].orders, [language]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  return (
    <div className="p-4 sm:p-8">
      <div className="mb-6 sm:mb-10">
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{t.title}</h2>
        <p className="text-slate-500 text-sm sm:text-base font-medium">{t.subtitle}</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-12 sm:py-20 bg-white rounded-2xl sm:rounded-[3rem] border-4 border-dashed border-slate-100">
           <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 text-2xl sm:text-3xl">📄</div>
           <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] sm:text-sm">{t.noOrders}</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl sm:rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-slate-400">{t.recent}</h3>
            <span className="bg-blue-600 text-white px-2 sm:px-3 py-1 rounded-full text-[8px] sm:text-[10px] font-black">{orders.length} TOTAL</span>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-50">
                  <th className="px-8 py-5">Order ID</th>
                  <th className="px-8 py-5">{t.customer}</th>
                  <th className="px-8 py-5">{t.date}</th>
                  <th className="px-8 py-5">{t.total}</th>
                  <th className="px-8 py-5">{t.status}</th>
                  <th className="px-8 py-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.slice().reverse().map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5 text-sm font-mono text-slate-400">{order.id}</td>
                    <td className="px-8 py-5 text-sm font-black text-slate-800">{order.customerName}</td>
                    <td className="px-8 py-5 text-sm font-medium text-slate-500">{order.date}</td>
                    <td className="px-8 py-5 text-sm font-black text-blue-600">€{order.total.toFixed(2)}</td>
                    <td className="px-8 py-5 text-sm">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200">
                        {t.confirmed}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <button 
                        onClick={() => setSelectedOrder(order)}
                        className="bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
                      >
                        {t.viewInvoice}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-slate-50">
            {orders.slice().reverse().map((order) => (
              <div key={order.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[10px] font-mono text-slate-400 uppercase tracking-tighter">{order.id}</p>
                    <h4 className="font-black text-slate-800 text-sm mt-0.5">{order.customerName}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">{order.date}</p>
                  </div>
                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-green-200">
                    {t.confirmed}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <p className="text-lg font-black text-blue-600">€{order.total.toFixed(2)}</p>
                  <button 
                    onClick={() => setSelectedOrder(order)}
                    className="bg-slate-100 text-slate-600 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    {t.viewInvoice}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedOrder && (
        <InvoiceView 
          data={{
            customer_name: selectedOrder.customerName,
            items: selectedOrder.items,
            total: selectedOrder.total,
            date: selectedOrder.date
          }} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}
    </div>
  );
};

export default OrdersView;
