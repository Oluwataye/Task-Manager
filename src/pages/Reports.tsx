import React, { useState, useEffect } from 'react';
import {
  Download,
  Printer,
  Filter,
  BarChart3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
} from 'lucide-react';
import { apiRequest } from '../lib/api';
import { Task, User } from '../types';

export const Reports: React.FC = () => {
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [assigneeId, setAssigneeId] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [priority, setPriority] = useState('ALL');

  const [users, setUsers] = useState<User[]>([]);
  const [summary, setSummary] = useState<any>({});
  const [teamPerformance, setTeamPerformance] = useState<any[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ users: User[] }>('/users')
      .then((res) => setUsers(res.users))
      .catch(console.error);

    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (fromDate) params.append('fromDate', fromDate);
      if (toDate) params.append('toDate', toDate);
      if (assigneeId !== 'ALL') params.append('assigneeId', assigneeId);
      if (status !== 'ALL') params.append('status', status);
      if (priority !== 'ALL') params.append('priority', priority);

      const data = await apiRequest<{ summary: any; teamPerformance: any[]; tasks: Task[] }>(
        `/reports?${params.toString()}`
      );
      setSummary(data.summary);
      setTeamPerformance(data.teamPerformance);
      setTasks(data.tasks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReportData();
  };

  const handleResetFilter = () => {
    setFromDate('');
    setToDate('');
    setAssigneeId('ALL');
    setStatus('ALL');
    setPriority('ALL');
    fetchReportData();
  };

  const handleExportCSV = () => {
    const params = new URLSearchParams();
    if (fromDate) params.append('fromDate', fromDate);
    if (toDate) params.append('toDate', toDate);
    if (status !== 'ALL') params.append('status', status);
    if (priority !== 'ALL') params.append('priority', priority);

    window.open(`/api/reports/export-csv?${params.toString()}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Comprehensive audit reports, team performance tracking, and exportable datasets.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleApplyFilter} className="custom-card p-4 space-y-3 print:hidden">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 mb-1">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Report Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">To Date</label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Assignee</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white"
            >
              <option value="ALL">All Assignees</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white"
            >
              <option value="ALL">All Status</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white"
            >
              <option value="ALL">All Priority</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleResetFilter}
            className="px-3 py-1.5 border border-slate-300 hover:bg-slate-100 rounded-lg text-xs font-semibold text-slate-600"
          >
            Reset
          </button>
          <button
            type="submit"
            className="px-5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-sm"
          >
            Apply Filters
          </button>
        </div>
      </form>

      {/* Stat Cards Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="custom-card p-4 border-l-4 border-l-blue-600">
          <div className="text-xs font-bold text-slate-500">Total Filtered Tasks</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{summary.totalTasks || 0}</div>
        </div>

        <div className="custom-card p-4 border-l-4 border-l-emerald-500">
          <div className="text-xs font-bold text-slate-500">Completed</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{summary.completedTasks || 0}</div>
        </div>

        <div className="custom-card p-4 border-l-4 border-l-emerald-500">
          <div className="text-xs font-bold text-slate-500">Completion Rate</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{summary.completionRate || 0}%</div>
        </div>

        <div className="custom-card p-4 border-l-4 border-l-amber-500">
          <div className="text-xs font-bold text-slate-500">In Progress</div>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{summary.inProgressTasks || 0}</div>
        </div>

        <div className="custom-card p-4 border-l-4 border-l-rose-500">
          <div className="text-xs font-bold text-slate-500">Overdue</div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">{summary.overdueTasks || 0}</div>
        </div>
      </div>

      {/* Team Performance Table */}
      <div className="custom-card p-5 space-y-4">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-blue-700" />
          <h2 className="text-sm font-extrabold text-slate-900">Team Performance & Workload Breakdown</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#0B2A4A] text-white font-bold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Employee / Assignee</th>
                <th className="py-2.5 px-4 text-center">Total Tasks</th>
                <th className="py-2.5 px-4 text-center">Completed</th>
                <th className="py-2.5 px-4 text-center">In Progress</th>
                <th className="py-2.5 px-4 text-center">Overdue</th>
                <th className="py-2.5 px-4">Completion Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {teamPerformance.map((item) => (
                <tr key={item.user.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-bold text-slate-800 flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center">
                      {item.user.fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2)}
                    </div>
                    <span>{item.user.fullName}</span>
                  </td>
                  <td className="py-2.5 px-4 text-center font-bold text-slate-700">{item.totalTasks}</td>
                  <td className="py-2.5 px-4 text-center font-bold text-emerald-600">{item.completed}</td>
                  <td className="py-2.5 px-4 text-center font-bold text-amber-600">{item.inProgress}</td>
                  <td className="py-2.5 px-4 text-center font-bold text-rose-600">{item.overdue}</td>
                  <td className="py-2.5 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-32 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${item.completionRate}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-700">{item.completionRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed Task Report Table */}
      <div className="custom-card p-5 space-y-4">
        <h2 className="text-sm font-extrabold text-slate-900">Detailed Task Audit Report</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#0B2A4A] text-white font-bold uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Task Name</th>
                <th className="py-2.5 px-4">Priority</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Due Status</th>
                <th className="py-2.5 px-4">Assignee(s)</th>
                <th className="py-2.5 px-4">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tasks.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="py-2.5 px-4 font-bold text-slate-800">{t.name}</td>
                  <td className="py-2.5 px-4 font-bold">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] text-white ${
                        t.priority === 'HIGH' ? 'bg-rose-500' : t.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    >
                      {t.priority}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-700">{t.status.replace('_', ' ')}</td>
                  <td className="py-2.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] text-white font-bold ${
                        t.dueStatus === 'Overdue' ? 'bg-rose-500' : t.dueStatus === 'Due Soon' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                    >
                      {t.dueStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-600">
                    {t.assignees.map((a) => a.user.fullName).join(', ') || 'Unassigned'}
                  </td>
                  <td className="py-2.5 px-4 text-slate-500">
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
