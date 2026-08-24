import React, { useState, useEffect } from 'react';
import { X, Upload, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiRequest } from '../../lib/api';
import { Company } from '../../types';

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({ isOpen, onClose }) => {
  const { company, updateCompany } = useAuth();

  const [name, setName] = useState('');
  const [systemName, setSystemName] = useState('');
  const [tagline, setTagline] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#123C73');
  const [secondaryColor, setSecondaryColor] = useState('#1B4B82');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

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

    // Compress via Canvas → JPEG 80% quality, max 200×200px
    // This keeps payload tiny and avoids Netlify's 1 MB body limit
    const reader = new FileReader();
    reader.onload = (evt) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 200;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);

        // Store in localStorage (no API call needed — avoids 1 MB Netlify limit)
        try {
          localStorage.setItem('company_logo', compressed);
        } catch {
          setError('Logo too large for local storage. Please use a smaller image.');
          return;
        }

        setLogoUrl(compressed);
        // Also push into auth context so sidebar/header update immediately
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
        // ignore server error if offline or mock
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
        }),
      });

      const currentLogo = localStorage.getItem('company_logo') || res.company.logoUrl || null;
      updateCompany({ ...res.company, logoUrl: currentLogo });
      setMessage('System Settings saved successfully!');
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-extrabold text-slate-900">System Settings</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSaveSettings} className="p-6 space-y-5 text-xs">
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
                  Click here or drag and drop a PNG, JPG, or WEBP image. Recommended: square image, up to 2 MB.
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
            <p className="text-[11px] text-slate-400 mt-1">
              The logo is securely uploaded. No link or code editing is required.
            </p>
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

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-slate-300 rounded-full font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-800 hover:bg-blue-900 text-white rounded-full font-bold shadow-md shadow-blue-800/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
