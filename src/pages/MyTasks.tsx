import React, { useState, useEffect } from 'react';
import { Plus, Search, Pencil, Trash2, Check } from 'lucide-react';
import { Task, TaskStatus } from '../types';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { CreateTaskModal } from '../components/modals/CreateTaskModal';

const STATUS_OPTIONS: TaskStatus[] = [
  'NOT_STARTED',
  'IN_PROGRESS',
  'ON_HOLD',
  'COMPLETED',
  'CANCELLED',
];

const statusLabel = (s: string) =>
  s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const statusBadgeClass = (s: string) => {
  switch (s) {
    case 'COMPLETED':   return 'bg-emerald-500 text-white';
    case 'IN_PROGRESS': return 'bg-amber-500 text-white';
    case 'ON_HOLD':     return 'bg-blue-500 text-white';
    case 'CANCELLED':   return 'bg-slate-400 text-white';
    default:            return 'bg-slate-300 text-slate-800';
  }
};

const priorityBadgeClass = (p: string) => {
  switch (p) {
    case 'HIGH':   return 'bg-rose-500 text-white';
    case 'MEDIUM': return 'bg-amber-500 text-white';
    default:       return 'bg-emerald-500 text-white';
  }
};

const dueStatusBadgeClass = (d: string) => {
  switch (d) {
    case 'Overdue':  return 'bg-rose-500 text-white';
    case 'Due Soon': return 'bg-amber-500 text-white';
    default:         return 'bg-emerald-500 text-white';
  }
};

const fmtDate = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: '2-digit' });
};

const fmtDateTime = (iso?: string | null) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })} : ${d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
};

export const MyTasks: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [activeChip, setActiveChip] = useState<'Visible' | 'In Progress' | 'Completed' | 'Overdue'>('Visible');
  const [counts, setCounts] = useState({ visible: 0, inProgress: 0, completed: 0, overdue: 0 });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ myTasksOnly: 'true' });
      if (search) params.append('search', search);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (priorityFilter !== 'ALL') params.append('priority', priorityFilter);
      params.append('filterChip', activeChip);

      const data = await apiRequest<{ tasks: Task[]; counts: typeof counts }>(`/tasks?${params}`);
      setTasks(data.tasks);
      if (data.counts) setCounts(data.counts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyTasks(); }, [search, statusFilter, priorityFilter, activeChip]);

  if (!user) return null;

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await apiRequest(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchMyTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  const handleQuickComplete = async (taskId: string) => {
    await handleStatusChange(taskId, 'COMPLETED');
  };

  const handleDelete = async (taskId: string) => {
    if (!window.confirm('Delete this task? This action cannot be undone.')) return;
    try {
      await apiRequest(`/tasks/${taskId}`, { method: 'DELETE' });
      fetchMyTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const chips: Array<{ label: string; key: typeof activeChip; count: number; dot: string }> = [
    { label: 'Visible',     key: 'Visible',     count: counts.visible,    dot: 'bg-slate-500' },
    { label: 'In Progress', key: 'In Progress',  count: counts.inProgress, dot: 'bg-amber-400' },
    { label: 'Completed',   key: 'Completed',    count: counts.completed,  dot: 'bg-emerald-500' },
    { label: 'Overdue',     key: 'Overdue',      count: counts.overdue,    dot: 'bg-rose-500' },
  ];

  return (
    <div className="space-y-5 pb-8">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Tasks</h1>
          <p className="text-xs text-slate-500 mt-0.5">View and manage the tasks assigned to you.</p>
        </div>

        <button
          onClick={() => { setTaskToEdit(null); setIsModalOpen(true); }}
          className="px-5 py-2.5 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 shrink-0 self-start sm:self-auto"
          style={{ background: '#123C73' }}
        >
          <Plus className="w-4 h-4" />
          <span>+ Create Task</span>
        </button>
      </div>

      {/* ── Filter Chips ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        {chips.map((c) => (
          <button
            key={c.key}
            onClick={() => setActiveChip(c.key)}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-full border text-xs font-bold transition-all ${
              activeChip === c.key
                ? 'border-[#123C73] bg-[#123C73] text-white shadow-sm'
                : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
            }`}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${activeChip === c.key ? 'bg-white' : c.dot}`} />
            <span>{c.label} {c.count}</span>
          </button>
        ))}
      </div>

      {/* ── Search & Filters ─────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search task name..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white min-w-[130px]"
        >
          <option value="ALL">All Status</option>
          <option value="NOT_STARTED">Not Started</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="ON_HOLD">On Hold</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold bg-white min-w-[130px]"
        >
          <option value="ALL">All Priority</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </div>

      {/* ── Table ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">

            {/* Dark navy header — exactly matching sample */}
            <thead>
              <tr style={{ background: '#0B2A4A' }} className="text-white font-bold text-[11px] uppercase">
                <th className="py-3.5 px-4 text-center">Task Name</th>
                <th className="py-3.5 px-4 text-center">Description</th>
                <th className="py-3.5 px-4 text-center">Task Link / File</th>
                <th className="py-3.5 px-4 text-center">Assignee</th>
                <th className="py-3.5 px-4 text-center">Priority</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Due Date</th>
                <th className="py-3.5 px-4 text-center">Start Date</th>
                <th className="py-3.5 px-4 text-center">Due Status</th>
                <th className="py-3.5 px-4 text-center">Completion Date</th>
                <th className="py-3.5 px-4 text-center">Notes / Remarks</th>
                <th className="py-3.5 px-4 text-center">Date Created</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400 font-medium">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      <span>Loading your tasks…</span>
                    </div>
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-14 text-center">
                    <p className="text-slate-400 font-medium text-sm">No tasks assigned to you.</p>
                    <p className="text-slate-300 text-xs mt-1">Tasks assigned to your profile will appear here.</p>
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const primaryAssignee = task.assignees?.[0];

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">

                      {/* Task Name */}
                      <td className="py-3 px-4 min-w-[160px]">
                        <span className="font-semibold text-amber-600 cursor-pointer hover:underline">
                          {task.name}
                        </span>
                      </td>

                      {/* Description */}
                      <td className="py-3 px-4 min-w-[200px] max-w-[240px]">
                        <span className="text-teal-600 font-medium line-clamp-2">
                          {task.description || '—'}
                        </span>
                      </td>

                      {/* Task Link / File */}
                      <td className="py-3 px-4 text-center text-slate-400">
                        —
                      </td>

                      {/* Assignee */}
                      <td className="py-3 px-4 min-w-[140px]">
                        {primaryAssignee ? (
                          <div className="flex items-center space-x-2">
                            <div className="w-7 h-7 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                              {primaryAssignee.user?.fullName
                                ?.split(' ')
                                .map((n: string) => n[0])
                                .join('')
                                .substring(0, 2)
                                .toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-700 truncate">
                              {primaryAssignee.user?.fullName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* Priority badge */}
                      <td className="py-3 px-4 text-center">
                        <span className={`px-3 py-1 rounded-md text-[11px] font-bold ${priorityBadgeClass(task.priority)}`}>
                          {task.priority.charAt(0) + task.priority.slice(1).toLowerCase()}
                        </span>
                      </td>

                      {/* Status — inline dropdown */}
                      <td className="py-3 px-4 text-center">
                        <div className="relative inline-block">
                          <select
                            value={task.status}
                            onChange={(e) => handleStatusChange(task.id, e.target.value as TaskStatus)}
                            className={`appearance-none pr-5 pl-3 py-1 rounded-md text-[11px] font-bold border-none cursor-pointer outline-none ${statusBadgeClass(task.status)}`}
                            style={{ minWidth: 100 }}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s} className="text-slate-800 bg-white">
                                {statusLabel(s)}
                              </option>
                            ))}
                          </select>
                          <span className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-white text-[9px]">▼</span>
                        </div>
                      </td>

                      {/* Due Date */}
                      <td className="py-3 px-4 text-center text-slate-600 font-medium">
                        {fmtDate(task.dueDate)}
                      </td>

                      {/* Start Date */}
                      <td className="py-3 px-4 text-center text-slate-600 font-medium">
                        {fmtDateTime(task.startDate)}
                      </td>

                      {/* Due Status badge */}
                      <td className="py-3 px-4 text-center">
                        <span className={`px-3 py-1 rounded-md text-[11px] font-bold ${dueStatusBadgeClass(task.dueStatus || 'On Time')}`}>
                          {task.dueStatus || 'On Time'}
                        </span>
                      </td>

                      {/* Completion Date */}
                      <td className="py-3 px-4 text-center text-slate-600 font-medium">
                        {fmtDateTime((task as any).completionDate)}
                      </td>

                      {/* Notes / Remarks */}
                      <td className="py-3 px-4 text-center text-slate-500 max-w-[160px]">
                        <span className="line-clamp-2">{task.notes || '—'}</span>
                      </td>

                      {/* Date Created */}
                      <td className="py-3 px-4 text-center text-slate-600 font-medium">
                        {fmtDateTime(task.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-1.5 justify-center">
                          {/* Edit */}
                          <button
                            onClick={() => { setTaskToEdit(task); setIsModalOpen(true); }}
                            title="Edit task"
                            className="w-7 h-7 rounded border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-600 flex items-center justify-center transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(task.id)}
                            title="Delete task"
                            className="w-7 h-7 rounded border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Quick Complete */}
                          {task.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleQuickComplete(task.id)}
                              title="Mark as completed"
                              className="w-7 h-7 rounded border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Row count footer */}
        {!loading && tasks.length > 0 && (
          <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{tasks.length}</strong> task{tasks.length !== 1 ? 's' : ''} assigned to you
          </div>
        )}
      </div>

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setTaskToEdit(null); }}
        onSuccess={fetchMyTasks}
        taskToEdit={taskToEdit}
      />
    </div>
  );
};
