import React, { useState, useEffect } from 'react';
import { X, Upload, Building2, Plus, Trash2, ShieldCheck, Wrench, ListFilter, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { Company } from '../../types';

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'general' | 'maintenance' | 'statuses' | 'priorities';

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({ isOpen, onClose }) => {
  const { company, updateCompany } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('general');

  // General tab state
  const [name, setName] = useState('');
  const [systemName, setSystemName] = useState('');
  const [tagline, setTagline] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#123C73');
  const [secondaryColor, setSecondaryColor] = useState('#1B4B82');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Master lookup data lists
  const [maintenanceTypes, setMaintenanceTypes] = useState<string[]>([]);
  const [reportStatuses, setReportStatuses] = useState<string[]>([]);
  const [reportPriorities, setReportPriorities] = useState<string[]>([]);

  // Inputs for adding new item
  const [newMaintenanceType, setNewMaintenanceType] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newPriority, setNewPriority] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (company && isOpen) {
      setName(company.name || 'Your Company Name');
      setSystemName(company.systemName || 'Task Monitoring System');
      setTagline(company.tagline || 'Track, assign, and monitor employee tasks in real-time');
      setPrimaryColor(company.primaryColor || '#123C73');
      setSecondaryColor(company.secondaryColor || '#1B4B82');
      const savedLogo = localStorage.getItem('company_logo');
      setLogoUrl(savedLogo || company.logoUrl || null);

      setMaintenanceTypes(
        company.maintenanceTypes || [
          'Routine Servicing',
          'Safety Inspection',
          'Emergency Repair',
          'Preventative Care',
          'Quarterly Overhaul',
          'Compliance Audit',
        ]
      );
      setReportStatuses(
        company.reportStatuses || [
          'NOT_STARTED',
          'IN_PROGRESS',
          'ON_HOLD',
          'COMPLETED',
          'CANCELLED',
          'UNDER_REVIEW',
        ]
      );
      setReportPriorities(
        company.reportPriorities || [
          'LOW',
          'MEDIUM',
          'HIGH',
          'CRITICAL',
        ]
      );

      setMessage('');
      setError('');
    }
  }, [company, isOpen]);

  if (!isOpen) return null;

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError('Logo file size must be up to 2 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 200;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);

        try {
          localStorage.setItem('company_logo', compressed);
        } catch {
          setError('Logo too large for local storage. Please use a smaller image.');
          return;
        }

        setLogoUrl(compressed);
        const updated = { ...(company as Company), logoUrl: compressed };
        updateCompany(updated);
        setMessage('Logo uploaded successfully!');
      };
      img.onerror = () => setError('Failed to load image. Please try another file.');
      img.src = evt.target?.result as string;
    };
    reader.onerror = () => setError('Failed to read file');
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = async () => {
    try {
      setLoading(true);
      localStorage.removeItem('company_logo');
      try {
        await apiRequest<{ company: Company }>('/settings/remove-logo', {
          method: 'POST',
        });
      } catch (e) {
        // ignore offline
      }
      setLogoUrl(null);
      const updated = { ...(company as Company), logoUrl: null };
      updateCompany(updated);
      setMessage('Logo removed');
    } catch (err: any) {
      setError(err.message || 'Failed to remove logo');
    } finally {
      setLoading(false);
    }
  };

  // Auto-save helper for instant feedback & persistence
  const saveMasterLookups = async (
    mTypes = maintenanceTypes,
    rStatuses = reportStatuses,
    rPriorities = reportPriorities
  ) => {
    try {
      const res = await apiRequest<{ company: Company }>('/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          systemName,
          tagline,
          primaryColor,
          secondaryColor,
          maintenanceTypes: mTypes,
          reportStatuses: rStatuses,
          reportPriorities: rPriorities,
        }),
      });

      const currentLogo = localStorage.getItem('company_logo') || res.company.logoUrl || null;
      updateCompany({ ...res.company, logoUrl: currentLogo });
    } catch (err: any) {
      console.error('Failed to save lookups:', err);
    }
  };

  // Handlers for Maintenance Schedule Types
  const handleAddMaintenanceType = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newMaintenanceType.trim();
    if (!trimmed) return;
    if (maintenanceTypes.includes(trimmed)) {
      setError('Maintenance type already exists');
      return;
    }
    const updated = [...maintenanceTypes, trimmed];
    setMaintenanceTypes(updated);
    setNewMaintenanceType('');
    setError('');
    setMessage(`Added "${trimmed}" to Maintenance Schedule Types`);
    saveMasterLookups(updated, reportStatuses, reportPriorities);
  };

  const handleDeleteMaintenanceType = (item: string) => {
    const updated = maintenanceTypes.filter((t) => t !== item);
    setMaintenanceTypes(updated);
    setMessage(`Removed "${item}" from Maintenance Schedule Types`);
    saveMasterLookups(updated, reportStatuses, reportPriorities);
  };

  // Handlers for Report Statuses
  const handleAddStatus = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newStatus.trim();
    if (!trimmed) return;
    const formatted = trimmed.toUpperCase().replace(/\s+/g, '_');
    if (reportStatuses.includes(formatted)) {
      setError('Report Status already exists');
      return;
    }
    const updated = [...reportStatuses, formatted];
    setReportStatuses(updated);
    setNewStatus('');
    setError('');
    setMessage(`Added "${formatted}" to Report Statuses`);
    saveMasterLookups(maintenanceTypes, updated, reportPriorities);
  };

  const handleDeleteStatus = (item: string) => {
    const updated = reportStatuses.filter((s) => s !== item);
    setReportStatuses(updated);
    setMessage(`Removed "${item}" from Report Statuses`);
    saveMasterLookups(maintenanceTypes, updated, reportPriorities);
  };

  // Handlers for Priorities
  const handleAddPriority = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newPriority.trim();
    if (!trimmed) return;
    const formatted = trimmed.toUpperCase();
    if (reportPriorities.includes(formatted)) {
      setError('Priority level already exists');
      return;
    }
    const updated = [...reportPriorities, formatted];
    setReportPriorities(updated);
    setNewPriority('');
    setError('');
    setMessage(`Added "${formatted}" to Report Priorities`);
    saveMasterLookups(maintenanceTypes, reportStatuses, updated);
  };

  const handleDeletePriority = (item: string) => {
    const updated = reportPriorities.filter((p) => p !== item);
    setReportPriorities(updated);
    setMessage(`Removed "${item}" from Report Priorities`);
    saveMasterLookups(maintenanceTypes, reportStatuses, updated);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const res = await apiRequest<{ company: Company }>('/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          name,
          systemName,
          tagline,
          primaryColor,
          secondaryColor,
          maintenanceTypes,
          reportStatuses,
          reportPriorities,
        }),
      });

      const currentLogo = localStorage.getItem('company_logo') || res.company.logoUrl || null;
      updateCompany({ ...res.company, logoUrl: currentLogo });
      setMessage('Superadmin System Settings saved successfully!');
      setTimeout(() => {
        onClose();
      }, 600);
    } catch (err: any) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#123C73] text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">SaaS System Administration</h2>
              <p className="text-[11px] text-slate-500 font-medium">Configure company branding, maintenance types, and master data</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-100/50 px-5 pt-3 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => { setActiveTab('general'); setMessage(''); setError(''); }}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center space-x-1.5 ${
              activeTab === 'general'
                ? 'bg-white text-[#123C73] border-t-2 border-t-[#123C73] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>General & Branding</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('maintenance'); setMessage(''); setError(''); }}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center space-x-1.5 ${
              activeTab === 'maintenance'
                ? 'bg-white text-[#123C73] border-t-2 border-t-[#123C73] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Maintenance Schedule Types ({maintenanceTypes.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('statuses'); setMessage(''); setError(''); }}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center space-x-1.5 ${
              activeTab === 'statuses'
                ? 'bg-white text-[#123C73] border-t-2 border-t-[#123C73] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>Report Statuses ({reportStatuses.length})</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('priorities'); setMessage(''); setError(''); }}
            className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all flex items-center space-x-1.5 ${
              activeTab === 'priorities'
                ? 'bg-white text-[#123C73] border-t-2 border-t-[#123C73] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Report Priorities ({reportPriorities.length})</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {message && (
            <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
              {message}
            </div>
          )}
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* TAB 1: GENERAL & BRANDING */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              {/* Live Preview Card */}
              <div className="p-4 bg-slate-100/80 rounded-xl border border-slate-200 flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center p-1 overflow-hidden shadow shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Company Logo" className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="w-7 h-7 text-blue-800" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm leading-tight">
                    {name || 'Your Company Name'}
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    {systemName || 'Task Monitoring System'}
                  </div>
                </div>
              </div>

              {/* Company Logo Upload Block */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">Company Logo</label>
                <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-800 text-xs">Upload your company logo</div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Recommended: square image, up to 2 MB. Automatically compressed client-side.
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <label className="px-3 py-1.5 bg-slate-200/80 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg cursor-pointer transition-colors flex items-center space-x-1">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Choose Logo</span>
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                    </label>

                    {logoUrl && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="px-3 py-1.5 bg-slate-200/80 hover:bg-rose-100 hover:text-rose-700 text-slate-700 font-semibold rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Two-Column: Company Name + System Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Company Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">System Name</label>
                  <input
                    type="text"
                    value={systemName}
                    onChange={(e) => setSystemName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-medium"
                  />
                </div>
              </div>

              {/* System Tagline */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">System Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-medium"
                />
              </div>

              {/* Two-Column Color Pickers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Primary Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Secondary Color</label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="w-9 h-9 rounded-lg border border-slate-300 cursor-pointer p-0.5"
                    />
                    <input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 border border-slate-300 rounded-full font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-[#123C73] hover:bg-[#0e2f5c] text-white rounded-full font-bold shadow-md shadow-blue-900/20 transition-all disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save General Settings'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: MAINTENANCE SCHEDULE TYPES */}
          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-800 text-xs font-medium">
                Superadmins can create, modify, and delete Maintenance Schedule Types available across the assets and facilities modules.
              </div>

              {/* Add New Type Form */}
              <form onSubmit={handleAddMaintenanceType} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMaintenanceType}
                  onChange={(e) => setNewMaintenanceType(e.target.value)}
                  placeholder="e.g. Electrical Compliance Check..."
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold text-xs shadow transition-all flex items-center space-x-1 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Type</span>
                </button>
              </form>

              {/* List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                {maintenanceTypes.map((item) => (
                  <div key={item} className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center space-x-2">
                      <Wrench className="w-4 h-4 text-teal-600" />
                      <span className="font-bold text-slate-800">{item}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteMaintenanceType(item)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                      title="Delete maintenance type"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: REPORT STATUSES */}
          {activeTab === 'statuses' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs font-medium">
                Superadmins can define custom Report & Task Statuses across system monitoring and task assignment views.
              </div>

              {/* Add New Status Form */}
              <form onSubmit={handleAddStatus} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  placeholder="e.g. Under Review / Urgent Inspection..."
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold text-xs shadow transition-all flex items-center space-x-1 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Status</span>
                </button>
              </form>

              {/* List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                {reportStatuses.map((item) => (
                  <div key={item} className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">
                        {item}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteStatus(item)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                      title="Delete status"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: REPORT PRIORITIES */}
          {activeTab === 'priorities' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium">
                Superadmins can manage Report Priority levels (Low, Medium, High, Critical, Urgent, etc.).
              </div>

              {/* Add New Priority Form */}
              <form onSubmit={handleAddPriority} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  placeholder="e.g. CRITICAL / URGENT..."
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow transition-all flex items-center space-x-1 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Priority</span>
                </button>
              </form>

              {/* List */}
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
                {reportPriorities.map((item) => (
                  <div key={item} className="px-4 py-2.5 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 bg-rose-500 text-white rounded font-bold text-[10px]">
                        {item}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeletePriority(item)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
                      title="Delete priority"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
