
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
    <div className="p-8">
      <div className="mb-10">
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t.title}</h2>
        <p className="text-slate-500 font-medium">{t.subtitle}</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-[3rem] border-4 border-dashed border-slate-100">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">📄</div>
           <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">{t.noOrders}</p>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t.recent}</h3>
            <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black">{orders.length} TOTAL</span>
          </div>
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
