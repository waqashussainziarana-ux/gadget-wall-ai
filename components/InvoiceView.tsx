
import React, { useMemo } from 'react';
import { translations } from '../translations';

export interface InvoiceData {
  customer_name: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  total: number;
  date: string;
}

interface Props {
  data: InvoiceData;
  onClose: () => void;
}

const InvoiceView: React.FC<Props> = ({ data, onClose }) => {
  const vatRate = 0.23; // Portugal standard VAT
  const subtotal = data.items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const vatAmount = subtotal * (vatRate / (1 + vatRate)); // Assuming price is VAT inclusive as standard in PT B2C
  const netAmount = subtotal - vatAmount;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:p-0">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 print:shadow-none print:rounded-none print:max-h-none print:overflow-visible">
        <div id="invoice-content" className="p-10 flex flex-col gap-8 print:p-8">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tighter">GADGET WALL</h2>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-[0.2em] mt-1">Electronics Distribution</p>
              <div className="text-[10px] text-slate-400 mt-6 font-medium leading-relaxed uppercase">
                Rua de Santa Catarina, Porto<br />
                Portugal • NIF: 500123456
              </div>
            </div>
            <div className="text-right">
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-widest">INVOICE</h3>
              <p className="text-xs font-bold text-slate-400 mt-1">#INV-{Math.floor(Math.random() * 90000) + 10000}</p>
              <p className="text-[10px] text-slate-400 mt-4 uppercase font-bold tracking-widest">{data.date}</p>
            </div>
          </div>

          <div className="h-px bg-slate-100 w-full"></div>

          {/* Customer */}
          <div className="flex justify-between items-end">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Billed To</p>
              <p className="text-lg font-black text-slate-800">{data.customer_name}</p>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden border border-slate-100 rounded-3xl print:border-slate-300">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4 text-center">Qty</th>
                  <th className="px-6 py-4 text-right">Price</th>
                  <th className="px-6 py-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 print:divide-slate-200">
                {data.items.map((item, i) => (
                  <tr key={i} className="text-sm font-bold text-slate-700">
                    <td className="px-6 py-4">{item.name}</td>
                    <td className="px-6 py-4 text-center text-slate-400">{item.quantity}</td>
                    <td className="px-6 py-4 text-right">€{item.price.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right font-black">€{(item.price * item.quantity).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-3">
              <div className="flex justify-between text-xs font-bold text-slate-400">
                <span>Subtotal (Net)</span>
                <span>€{netAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-400">
                <span>VAT (23%)</span>
                <span>€{vatAmount.toFixed(2)}</span>
              </div>
              <div className="h-px bg-slate-100"></div>
              <div className="flex justify-between text-xl font-black text-slate-900">
                <span>Total</span>
                <span className="text-blue-600 print:text-black">€{subtotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center border-t border-slate-50 pt-6 hidden print:block">
            Thank you for shopping at Gadget Wall. Consumer rights apply under EU law.
          </div>
        </div>

        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-center gap-4 print:hidden">
          <button 
            onClick={handlePrint}
            className="bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-2 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
            Print
          </button>
          <button 
            onClick={onClose}
            className="bg-slate-900 text-white px-12 py-4 rounded-full font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-200"
          >
            Close & Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;
