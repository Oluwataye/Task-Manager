import React, { useState, useEffect } from 'react';
import { Receipt, Plus, DollarSign, Calendar, ClipboardList } from 'lucide-react';
import { Invoice } from '../types';
import { apiRequest } from '../lib/api';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'UNPAID' | 'PAID' | 'OVERDUE'>('UNPAID');
  const [loading, setLoading] = useState(true);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{ invoices: Invoice[] }>('/domain/invoices');
      setInvoices(data.invoices);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber || !amount || !dueDate) return;
    try {
      await apiRequest('/domain/invoices', {
        method: 'POST',
        body: JSON.stringify({ invoiceNumber, amount, status, dueDate }),
      });
      setInvoiceNumber('');
      setAmount('');
      setDueDate('');
      fetchInvoices();
    } catch (err: any) {
      alert(err.message || 'Failed to create invoice');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Finance & Invoices</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor vendor invoices, financial deadlines, and billing task clearances.
          </p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="custom-card p-5 border-l-4 border-l-emerald-600 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-1">
          <label className="block text-xs font-bold text-slate-700">Invoice Number *</label>
          <input
            type="text"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            placeholder="e.g. INV-2026-004"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium"
            required
          />
        </div>

        <div className="w-full md:w-36 space-y-1">
          <label className="block text-xs font-bold text-slate-700">Amount ($) *</label>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium"
            required
          />
        </div>

        <div className="w-full md:w-44 space-y-1">
          <label className="block text-xs font-bold text-slate-700">Due Date *</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium bg-white"
            required
          />
        </div>

        <button
          type="submit"
          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center space-x-1 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Invoice</span>
        </button>
      </form>

      <div className="custom-card overflow-hidden">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-[#0B2A4A] text-white font-bold uppercase text-[11px]">
            <tr>
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4">Linked Tasks</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-slate-50">
                <td className="py-3 px-4 font-bold text-slate-900">{inv.invoiceNumber}</td>
                <td className="py-3 px-4 font-extrabold text-slate-800">${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-3 py-1 rounded text-[10px] font-bold text-white ${
                      inv.status === 'PAID' ? 'bg-emerald-600' : inv.status === 'OVERDUE' ? 'bg-rose-600' : 'bg-amber-500'
                    }`}
                  >
                    {inv.status}
                  </span>
                </td>
                <td className="py-3 px-4 font-semibold text-slate-600">{new Date(inv.dueDate).toLocaleDateString()}</td>
                <td className="py-3 px-4 font-medium text-slate-500">{inv.tasks?.length || 0} Linked Tasks</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
