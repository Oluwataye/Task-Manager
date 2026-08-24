import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, RefreshCw, Search, Clock, User, Globe, Activity } from 'lucide-react';
import { apiRequest } from '../../lib/api';

export interface AuditLogItem {
  id: string;
  timestamp: string;
  userId?: string | null;
  userEmail?: string | null;
  userRole?: string | null;
  companyId: string;
  action: string;
  targetResource?: string | null;
  targetId?: string | null;
  details?: string | null;
  ip?: string | null;
}

interface AuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogsModal: React.FC<AuditLogsModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiRequest<{ auditLogs: AuditLogItem[] }>('/audit-logs');
      setLogs(data.auditLogs || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.action.toLowerCase().includes(q) ||
      (log.userEmail && log.userEmail.toLowerCase().includes(q)) ||
      (log.userRole && log.userRole.toLowerCase().includes(q)) ||
      (log.details && log.details.toLowerCase().includes(q)) ||
      (log.ip && log.ip.includes(q))
    );
  });

  const getActionBadgeClass = (action: string) => {
    if (action.includes('DELETE')) return 'bg-rose-500 text-white';
    if (action.includes('CREATE')) return 'bg-emerald-600 text-white';
    if (action.includes('UPDATE') || action.includes('SWITCH')) return 'bg-amber-500 text-white';
    if (action.includes('LOGIN')) return 'bg-blue-600 text-white';
    return 'bg-slate-600 text-white';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200 select-none">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#123C73] text-white flex items-center justify-center font-bold shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 leading-tight">System Security Audit Trail</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Real-time compliance, authentication & non-repudiation event logs
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              title="Refresh audit logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by user, action, IP, or details..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            />
          </div>

          <div className="text-xs text-slate-500 font-bold">
            Showing <span className="text-slate-900 font-extrabold">{filteredLogs.length}</span> audit logs
          </div>
        </div>

        {/* Log Stream */}
        <div className="p-4 overflow-y-auto flex-1 divide-y divide-slate-100 space-y-3">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-lg">
              {error}
            </div>
          )}

          {loading && logs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-medium text-xs flex items-center justify-center space-x-2">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              <span>Fetching audit trail records...</span>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400 font-medium text-xs">
              No audit logs match your search.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="pt-3 first:pt-0 hover:bg-slate-50/60 p-2 rounded-lg transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold ${getActionBadgeClass(log.action)}`}>
                      {log.action}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {log.userEmail || 'System Process'}
                    </span>
                    {log.userRole && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                        {log.userRole}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-medium">
                    {log.ip && (
                      <span className="flex items-center space-x-1">
                        <Globe className="w-3 h-3 text-slate-400" />
                        <span>{log.ip}</span>
                      </span>
                    )}
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(log.timestamp).toLocaleString()}</span>
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 font-medium mt-1 pl-1 border-l-2 border-slate-300">
                  {log.details || 'No additional event details.'}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center space-x-1 font-medium text-[11px]">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Audit trail active · All administrative events cryptographically logged</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
