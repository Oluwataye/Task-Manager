import React, { useState, useEffect } from 'react';
import { Wrench, Plus, ClipboardList } from 'lucide-react';
import { Asset } from '../types';
import { apiRequest } from '../lib/api';

export const AssetsPage: React.FC = () => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [name, setName] = useState('');
  const [maintenanceType, setMaintenanceType] = useState('Routine Servicing');
  const [loading, setLoading] = useState(true);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{ assets: Asset[] }>('/domain/assets');
      setAssets(data.assets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    try {
      await apiRequest('/domain/assets', {
        method: 'POST',
        body: JSON.stringify({ name, maintenanceType }),
      });
      setName('');
      fetchAssets();
    } catch (err: any) {
      alert(err.message || 'Failed to create asset');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Facilities & Assets</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track equipment, maintenance schedules, and facility work orders.
          </p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="custom-card p-5 border-l-4 border-l-teal-600 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-1">
          <label className="block text-xs font-bold text-slate-700">Asset / Equipment Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Chiller Unit #1"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium"
            required
          />
        </div>

        <div className="flex-1 space-y-1">
          <label className="block text-xs font-bold text-slate-700">Maintenance Schedule Type</label>
          <select
            value={maintenanceType}
            onChange={(e) => setMaintenanceType(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white"
          >
            <option value="Routine Servicing">Routine Servicing</option>
            <option value="Safety Inspection">Safety Inspection</option>
            <option value="Emergency Repair">Emergency Repair</option>
            <option value="Preventative Care">Preventative Care</option>
          </select>
        </div>

        <button
          type="submit"
          className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center space-x-1 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Asset</span>
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map((a) => (
          <div key={a.id} className="custom-card p-5 hover:shadow-md transition-all space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                <Wrench className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">{a.name}</h3>
                <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">
                  {a.maintenanceType}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
              <div className="flex items-center space-x-1">
                <ClipboardList className="w-4 h-4 text-teal-600" />
                <span>{a.tasks?.length || 0} Work Orders</span>
              </div>
              <span className="text-[11px] text-slate-400">Recorded {new Date(a.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
