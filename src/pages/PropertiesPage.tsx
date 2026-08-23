import React, { useState, useEffect } from 'react';
import { Building, Plus, MapPin, ClipboardList } from 'lucide-react';
import { Property } from '../types';
import { apiRequest } from '../lib/api';

export const PropertiesPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{ properties: Property[] }>('/domain/properties');
      setProperties(data.properties);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    try {
      await apiRequest('/domain/properties', {
        method: 'POST',
        body: JSON.stringify({ name, address }),
      });
      setName('');
      setAddress('');
      fetchProperties();
    } catch (err: any) {
      alert(err.message || 'Failed to create property');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Property Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage physical locations, buildings, and property-scoped task assignments.
          </p>
        </div>
      </div>

      {/* Add Property Form */}
      <form onSubmit={handleCreate} className="custom-card p-5 border-l-4 border-l-indigo-600 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-1">
          <label className="block text-xs font-bold text-slate-700">Property / Building Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Skyline Tower"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium"
            required
          />
        </div>

        <div className="flex-1 space-y-1">
          <label className="block text-xs font-bold text-slate-700">Address / Location</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g. 100 Financial District"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium"
          />
        </div>

        <button
          type="submit"
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center space-x-1 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Property</span>
        </button>
      </form>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.map((p) => (
          <div key={p.id} className="custom-card p-5 hover:shadow-md transition-all space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <Building className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">{p.name}</h3>
                <div className="flex items-center space-x-1 text-xs text-slate-500">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{p.address || 'No address specified'}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
              <div className="flex items-center space-x-1">
                <ClipboardList className="w-4 h-4 text-indigo-600" />
                <span>{p.tasks?.length || 0} Linked Tasks</span>
              </div>
              <span className="text-[11px] text-slate-400">Added {new Date(p.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
