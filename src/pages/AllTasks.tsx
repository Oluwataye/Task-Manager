import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Check,
  ExternalLink,
  Users as UsersIcon,
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '../types';
import { apiRequest } from '../lib/api';
import { CreateTaskModal } from '../components/modals/CreateTaskModal';

export const AllTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [counts, setCounts] = useState({
    visible: 0,
    inProgress: 0,
    completed: 0,
    overdue: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  // Filters
  const [activeChip, setActiveChip] = useState<'All' | 'Visible' | 'In Progress' | 'Completed' | 'Overdue'>('Visible');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);
      if (priorityFilter !== 'ALL') params.append('priority', priorityFilter);
      if (activeChip !== 'All') params.append('filterChip', activeChip);

      const data = await apiRequest<{ tasks: Task[]; counts: any }>(`/tasks?${params.toString()}`);
      setTasks(data.tasks);
      if (data.counts) setCounts(data.counts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [search, statusFilter, priorityFilter, activeChip]);

  // Inline status update
  const handleInlineStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await apiRequest(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      });
      fetchTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Quick complete
  const handleQuickComplete = async (taskId: string) => {
    await handleInlineStatusChange(taskId, 'COMPLETED');
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      await apiRequest(`/tasks/${taskId}`, { method: 'DELETE' });
      fetchTasks();
    } catch (err: any) {
      alert(err.message || 'Failed to delete task');
    }
  };

  const openCreateModal = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">All Tasks</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track, assign, and monitor all employee tasks in one place.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="px-5 py-2.5 bg-[#123C73] hover:bg-[#0e2f5c] text-white rounded-xl text-xs font-bold shadow-md shadow-blue-900/20 transition-all flex items-center space-x-1.5 shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ Create Task</span>
        </button>
      </div>

      {/* Filter Chips Row matching reference */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setActiveChip('Visible')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-2 border ${
            activeChip === 'Visible'
              ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-slate-500" />
          <span>Visible {counts.visible}</span>
        </button>

        <button
          onClick={() => setActiveChip('In Progress')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-2 border ${
            activeChip === 'In Progress'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>In Progress {counts.inProgress}</span>
        </button>

        <button
          onClick={() => setActiveChip('Completed')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-2 border ${
            activeChip === 'Completed'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Completed {counts.completed}</span>
        </button>

        <button
          onClick={() => setActiveChip('Overdue')}
          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center space-x-2 border ${
            activeChip === 'Overdue'
              ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>Overdue {counts.overdue}</span>
        </button>
      </div>

      {/* Search & Dropdown Filters Bar */}
      <div className="custom-card p-4 flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search task name..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 bg-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full md:w-48 px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white cursor-pointer focus:outline-none"
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
          className="w-full md:w-48 px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 bg-white cursor-pointer focus:outline-none"
        >
          <option value="ALL">All Priority</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
        </select>
      </div>

      {/* Wide Horizontally Scrollable Table matching reference screenshots */}
      <div className="custom-card overflow-hidden shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap min-w-[1300px]">
            {/* Header Row with Dark Navy Background */}
            <thead className="bg-[#0B2A4A] text-white font-bold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4">Start Date</th>
                <th className="py-3.5 px-4">Due Status</th>
                <th className="py-3.5 px-4">Task Name</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4">Task Link/File</th>
                <th className="py-3.5 px-4">Assignee(s)</th>
                <th className="py-3.5 px-4">Completion Date</th>
                <th className="py-3.5 px-4">Notes / Remarks</th>
                <th className="py-3.5 px-4">Date Created</th>
                <th className="py-3.5 px-4 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400 font-medium">
                    Loading tasks...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400 font-medium">
                    No matching tasks found.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Priority Pill */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-4 py-1.5 rounded-lg text-xs font-bold text-white text-center w-24 shadow-xs ${
                          task.priority === 'HIGH'
                            ? 'bg-rose-500'
                            : task.priority === 'MEDIUM'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      >
                        {task.priority === 'LOW' ? 'Low' : task.priority === 'MEDIUM' ? 'Medium' : 'High'}
                      </span>
                    </td>

                    {/* Inline Editable Status Dropdown Pill */}
                    <td className="py-3 px-4">
                      <select
                        value={task.status}
                        onChange={(e) => handleInlineStatusChange(task.id, e.target.value as TaskStatus)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold text-white outline-none cursor-pointer shadow-xs border-none ${
                          task.status === 'COMPLETED'
                            ? 'bg-emerald-500'
                            : task.status === 'IN_PROGRESS'
                            ? 'bg-amber-500'
                            : task.status === 'ON_HOLD'
                            ? 'bg-purple-500'
                            : task.status === 'CANCELLED'
                            ? 'bg-slate-400'
                            : 'bg-slate-500'
                        }`}
                      >
                        <option value="NOT_STARTED" className="bg-white text-slate-800">Not Started</option>
                        <option value="IN_PROGRESS" className="bg-white text-slate-800">In Progress</option>
                        <option value="ON_HOLD" className="bg-white text-slate-800">On Hold</option>
                        <option value="COMPLETED" className="bg-white text-slate-800">Completed</option>
                        <option value="CANCELLED" className="bg-white text-slate-800">Cancelled</option>
                      </select>
                    </td>

                    {/* Due Date */}
                    <td className="py-3 px-4 font-semibold text-slate-600">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' }) : '—'}
                    </td>

                    {/* Start Date */}
                    <td className="py-3 px-4 font-semibold text-slate-500">
                      {task.startDate ? `${new Date(task.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })} : ${new Date(task.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '—'}
                    </td>

                    {/* Due Status Pill */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-4 py-1.5 rounded-lg text-xs font-bold text-white text-center w-24 shadow-xs ${
                          task.dueStatus === 'Overdue'
                            ? 'bg-rose-500'
                            : task.dueStatus === 'Due Soon'
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                      >
                        {task.dueStatus}
                      </span>
                    </td>

                    {/* Task Name */}
                    <td className="py-3 px-4 font-bold text-slate-800 max-w-[200px] truncate">
                      {task.name}
                    </td>

                    {/* Description */}
                    <td className="py-3 px-4 text-slate-600 font-normal max-w-[220px] truncate">
                      {task.description || '—'}
                    </td>

                    {/* Task Link / File */}
                    <td className="py-3 px-4 text-blue-600 font-medium">
                      {task.linkOrFile ? (
                        <a
                          href={task.linkOrFile}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center space-x-1 hover:underline"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="max-w-[120px] truncate">{task.linkOrFile}</span>
                        </a>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    {/* Assignee Stacked Avatars */}
                    <td className="py-3 px-4">
                      {task.assignees.length === 0 ? (
                        <span className="text-slate-400">—</span>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="flex -space-x-2 overflow-hidden">
                            {task.assignees.map((a) => (
                              <div
                                key={a.userId}
                                title={a.user.fullName}
                                className="inline-block h-7 w-7 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white"
                              >
                                {a.user.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                              </div>
                            ))}
                          </div>
                          <span className="font-semibold text-slate-700 text-xs">
                            {task.assignees.map((a) => a.user.fullName).join(', ')}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Completion Date */}
                    <td className="py-3 px-4 font-semibold text-slate-500">
                      {task.completionDate ? `${new Date(task.completionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })} : ${new Date(task.completionDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : '—'}
                    </td>

                    {/* Notes / Remarks */}
                    <td className="py-3 px-4 text-slate-600 font-normal max-w-[180px] truncate">
                      {task.notes || '—'}
                    </td>

                    {/* Date Created */}
                    <td className="py-3 px-4 font-semibold text-slate-500">
                      {new Date(task.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </td>

                    {/* Action Column matching screenshot icons */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center space-x-1.5">
                        <button
                          onClick={() => openEditModal(task)}
                          title="Edit Task"
                          className="w-8 h-8 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 flex items-center justify-center transition-colors border border-blue-200"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          title="Delete Task"
                          className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 flex items-center justify-center transition-colors border border-rose-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleQuickComplete(task.id)}
                          title="Mark Complete"
                          className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center transition-colors border border-emerald-200"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTasks}
        taskToEdit={taskToEdit}
      />
    </div>
  );
};
