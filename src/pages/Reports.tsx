import React, { useState, useEffect, useCallback } from 'react';
import { Download, Printer } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { Task, User } from '../types';

function formatDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function initFrom() {
  const d = new Date();
  d.setDate(1);
  return formatDate(d);
}
function initTo() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1, 0);
  return formatDate(d);
}

function getDueStatus(t: Task) {
  if (t.status === 'COMPLETED') return 'On Time';
  if (!t.dueDate) return 'On Time';
  const due = new Date(t.dueDate);
  const now = new Date();
  if (due < now) return 'Overdue';
  const diff = (due.getTime() - now.getTime()) / 86400000;
  if (diff <= 3) return 'Due Soon';
  return 'On Time';
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    COMPLETED: 'bg-emerald-500 text-white',
    IN_PROGRESS: 'bg-amber-500 text-white',
    NOT_STARTED: 'bg-slate-400 text-white',
    ON_HOLD: 'bg-purple-500 text-white',
    CANCELLED: 'bg-rose-500 text-white',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${map[status] || 'bg-slate-200 text-slate-700'}`}>
      {status.replace('_', ' ')}
    </span>
  );
};

const DueStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    'On Time': 'bg-emerald-100 text-emerald-700 border border-emerald-300',
    'Due Soon': 'bg-amber-100 text-amber-700 border border-amber-300',
    'Overdue': 'bg-rose-100 text-rose-700 border border-rose-300',
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${map[status] || ''}`}>{status}</span>
  );
};

export const Reports: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const [fromDate, setFromDate] = useState(initFrom());
  const [toDate, setToDate] = useState(initTo());
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const [filtered, setFiltered] = useState<Task[]>([]);

  useEffect(() => {
    Promise.all([
      apiRequest<{ tasks: Task[] }>('/tasks'),
      apiRequest<{ users: User[] }>('/users'),
    ]).then(([tRes, uRes]) => {
      setTasks(tRes.tasks);
      setUsers(uRes.users);
      setFiltered(tRes.tasks);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const applyFilters = useCallback(() => {
    let result = [...tasks];

    if (fromDate) result = result.filter((t) => !t.createdAt || new Date(t.createdAt) >= new Date(fromDate));
    if (toDate) result = result.filter((t) => !t.createdAt || new Date(t.createdAt) <= new Date(toDate + 'T23:59:59'));
    if (assigneeFilter !== 'ALL') result = result.filter((t) => t.assignees.some((a) => a.userId === assigneeFilter));
    if (statusFilter !== 'ALL') result = result.filter((t) => t.status === statusFilter);
    if (priorityFilter !== 'ALL') result = result.filter((t) => t.priority === priorityFilter);

    setFiltered(result);
  }, [tasks, fromDate, toDate, assigneeFilter, statusFilter, priorityFilter]);

  const handleReset = () => {
    setFromDate(initFrom());
    setToDate(initTo());
    setAssigneeFilter('ALL');
    setStatusFilter('ALL');
    setPriorityFilter('ALL');
    setFiltered(tasks);
  };

  // Derived stats
  const total = filtered.length;
  const completed = filtered.filter((t) => t.status === 'COMPLETED').length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const inProgress = filtered.filter((t) => t.status === 'IN_PROGRESS').length;
  const overdue = filtered.filter((t) => getDueStatus(t) === 'Overdue').length;
  const notStarted = filtered.filter((t) => t.status === 'NOT_STARTED').length;
  const onHold = filtered.filter((t) => t.status === 'ON_HOLD').length;
  const cancelled = filtered.filter((t) => t.status === 'CANCELLED').length;
  const high = filtered.filter((t) => t.priority === 'HIGH').length;
  const medium = filtered.filter((t) => t.priority === 'MEDIUM').length;
  const low = filtered.filter((t) => t.priority === 'LOW').length;
  const dueToday = filtered.filter((t) => {
    if (!t.dueDate || ['COMPLETED', 'CANCELLED'].includes(t.status)) return false;
    return new Date(t.dueDate).toDateString() === new Date().toDateString();
  }).length;
  const dueThisWeek = filtered.filter((t) => {
    if (!t.dueDate || ['COMPLETED', 'CANCELLED'].includes(t.status)) return false;
    const diff = (new Date(t.dueDate).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 7;
  }).length;

  // Team performance
  const teamPerf = users.map((u) => {
    const userTasks = filtered.filter((t) => t.assignees.some((a) => a.userId === u.id));
    const c = userTasks.filter((t) => t.status === 'COMPLETED').length;
    const ip = userTasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const ov = userTasks.filter((t) => getDueStatus(t) === 'Overdue').length;
    const rate = userTasks.length > 0 ? Math.round((c / userTasks.length) * 100) : 0;
    return { user: u, total: userTasks.length, completed: c, inProgress: ip, overdue: ov, rate };
  }).filter((r) => r.total > 0);

  // CSV export
  const exportCSV = () => {
    const headers = ['Task Name', 'Assignee', 'Priority', 'Status', 'Due Date', 'Due Status'];
    const rows = filtered.map((t) => [
      `"${t.name}"`,
      `"${t.assignees[0]?.user?.fullName || 'Unassigned'}"`,
      t.priority,
      t.status,
      t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
      getDueStatus(t),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `task-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Task Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">Analyze task performance, workload, completion, priorities, and overdue work in one place.</p>
        </div>
        <div className="flex space-x-2">
          <button onClick={exportCSV} className="flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition">
            <Download className="w-3.5 h-3.5" /><span>Export CSV</span>
          </button>
          <button onClick={() => window.print()} className="flex items-center space-x-1.5 px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition">
            <Printer className="w-3.5 h-3.5" /><span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">From Date</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">To Date</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Assignee</label>
            <select value={assigneeFilter} onChange={e => setAssigneeFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500">
              <option value="ALL">All Assignees</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Status</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500">
              <option value="ALL">All Status</option>
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="ON_HOLD">On Hold</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Priority</label>
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500">
              <option value="ALL">All Priority</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <button onClick={applyFilters}
            className="px-5 py-2 rounded-lg text-xs font-bold text-white transition"
            style={{ background: '#123C73' }}>
            Apply
          </button>
          <button onClick={handleReset}
            className="px-5 py-2 rounded-lg text-xs font-bold text-slate-700 border border-slate-300 bg-white hover:bg-slate-50 transition">
            Reset
          </button>
        </div>
      </div>

      {/* 5 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Tasks */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm border-b-4 border-b-blue-500">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <span className="text-xs font-bold text-slate-600">Total Tasks</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{total}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Based on selected filters</div>
        </div>
        {/* Completed */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm border-b-4 border-b-emerald-500">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            </div>
            <span className="text-xs font-bold text-slate-600">Completed</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{completed}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{completed} of {total} tasks</div>
        </div>
        {/* Completion Rate */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm border-b-4 border-b-blue-400">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            </div>
            <span className="text-xs font-bold text-slate-600">Completion Rate</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{completionRate}%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Completed vs. total tasks</div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* In Progress */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm border-b-4 border-b-amber-500">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            </div>
            <span className="text-xs font-bold text-slate-600">In Progress</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{inProgress}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Currently being worked on</div>
        </div>
        {/* Overdue */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm border-b-4 border-b-rose-500">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
              <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
            </div>
            <span className="text-xs font-bold text-slate-600">Overdue</span>
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{overdue}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Requires attention</div>
        </div>
      </div>

      {/* Tasks by Status + Priority & Task Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tasks by Status */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Tasks by Status</h3>
            <span className="text-[10px] text-slate-400">Distribution of filtered tasks</span>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Not Started', count: notStarted, color: '#3B82F6' },
              { label: 'In Progress', count: inProgress, color: '#F59E0B' },
              { label: 'Completed', count: completed, color: '#16A34A' },
              { label: 'On Hold', count: onHold, color: '#8B5CF6' },
              { label: 'Cancelled', count: cancelled, color: '#EF4444' },
            ].map((s) => {
              const p = pct(s.count);
              return (
                <div key={s.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span className="font-medium text-slate-700">{s.label}</span>
                    </div>
                    <span className="font-bold text-slate-700">{s.count} ({p}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p}%`, background: s.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Priority & Task Health */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800">Priority & Task Health</h3>
            <span className="text-[10px] text-slate-400">Where attention is needed</span>
          </div>
          <div className="space-y-3 mb-4">
            {[
              { label: 'High', count: high, color: '#EF4444' },
              { label: 'Medium', count: medium, color: '#F59E0B' },
              { label: 'Low', count: low, color: '#16A34A' },
            ].map((s) => {
              const p = pct(s.count);
              return (
                <div key={s.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                      <span className="font-medium text-slate-700">{s.label}</span>
                    </div>
                    <span className="font-bold text-slate-700">{s.count} ({p}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p}%`, background: s.color }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
            {[
              { label: 'Due Today', val: dueToday, sub: 'Open tasks due today' },
              { label: 'Due This Week', val: dueThisWeek, sub: 'Open tasks in next 7 days' },
              { label: 'On Hold', val: onHold, sub: 'Tasks currently paused' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-xl font-extrabold text-slate-900">{s.val}</div>
                <div className="text-[10px] font-bold text-slate-600">{s.label}</div>
                <div className="text-[9px] text-slate-400">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Performance */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800">Team Performance</h3>
          <span className="text-[11px] text-slate-400">{teamPerf.length} assignee{teamPerf.length !== 1 ? 's' : ''}</span>
        </div>
        {teamPerf.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-6">No assignee data available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200">
                  {['Assignee', 'Total Tasks', 'Completed', 'In Progress', 'Overdue', 'Completion Rate'].map((h) => (
                    <th key={h} className="text-left py-2 px-3 font-bold text-slate-600 text-[11px] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {teamPerf.map(({ user, total: t, completed: c, inProgress: ip, overdue: ov, rate }) => (
                  <tr key={user.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-800">{user.fullName}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-700">{t}</td>
                    <td className="py-2.5 px-3 font-bold text-emerald-600">{c}</td>
                    <td className="py-2.5 px-3 font-bold text-amber-600">{ip}</td>
                    <td className="py-2.5 px-3 font-bold text-rose-600">{ov}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="font-bold text-slate-700 w-8 text-right">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Task Report */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-800">Detailed Task Report</h3>
          <span className="text-[11px] text-slate-400">{filtered.length} task{filtered.length !== 1 ? 's' : ''}</span>
        </div>
        {filtered.length === 0 ? (
          <p className="text-center text-xs text-slate-400 py-6">No tasks match the selected filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-[#123C73]">
                  {['Task Name', 'Assignee', 'Priority', 'Status', 'Due Date', 'Due Status'].map((h) => (
                    <th key={h} className="text-left py-2.5 px-3 font-bold text-white text-[11px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((t) => {
                  const ds = getDueStatus(t);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800 max-w-[200px] truncate">{t.name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{t.assignees[0]?.user?.fullName || '—'}</td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          t.priority === 'HIGH' ? 'bg-rose-100 text-rose-700' :
                          t.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>{t.priority}</span>
                      </td>
                      <td className="py-2.5 px-3"><StatusBadge status={t.status} /></td>
                      <td className="py-2.5 px-3 text-slate-600">{t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}</td>
                      <td className="py-2.5 px-3"><DueStatusBadge status={ds} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
