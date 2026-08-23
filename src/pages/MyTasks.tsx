import React, { useState, useEffect } from 'react';
import { Plus, Search, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Task } from '../types';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { CreateTaskModal } from '../components/modals/CreateTaskModal';

export const MyTasks: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{ tasks: Task[] }>(`/tasks?myTasksOnly=true${search ? `&search=${search}` : ''}`);
      setTasks(data.tasks);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyTasks();
  }, [search]);

  if (!user) return null;

  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const overdueCount = tasks.filter((t) => t.dueStatus === 'Overdue').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">My Tasks</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            View and manage tasks assigned specifically to you.
          </p>
        </div>

        {user.role === 'CONTRACTOR_TENANT' && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-[#123C73] hover:bg-[#0e2f5c] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Submit Maintenance Request</span>
          </button>
        )}
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="custom-card p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">{inProgressCount}</div>
            <div className="text-xs text-slate-500 font-medium">In Progress</div>
          </div>
        </div>

        <div className="custom-card p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">{completedCount}</div>
            <div className="text-xs text-slate-500 font-medium">Completed</div>
          </div>
        </div>

        <div className="custom-card p-4 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl font-extrabold text-slate-900">{overdueCount}</div>
            <div className="text-xs text-slate-500 font-medium">Overdue</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="custom-card p-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search my tasks..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Table */}
      <div className="custom-card overflow-hidden shadow-sm border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#0B2A4A] text-white font-bold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Due Status</th>
                <th className="py-3 px-4">Task Name</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    Loading my tasks...
                  </td>
                </tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    No assigned tasks found.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold">
                      <span
                        className={`px-3 py-1 rounded text-[10px] text-white font-bold ${
                          task.priority === 'HIGH' ? 'bg-rose-500' : task.priority === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-700">{task.status.replace('_', ' ')}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 rounded text-[10px] text-white font-bold ${
                          task.dueStatus === 'Overdue' ? 'bg-rose-500' : task.dueStatus === 'Due Soon' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                      >
                        {task.dueStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{task.name}</td>
                    <td className="py-3 px-4 font-semibold text-slate-600">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{task.notes || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchMyTasks}
      />
    </div>
  );
};
