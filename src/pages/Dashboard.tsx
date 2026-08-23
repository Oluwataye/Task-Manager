import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Building,
  FolderKanban,
  Wrench,
  Receipt,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { Task } from '../types';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ tasks: Task[] }>('/tasks')
      .then((res) => setTasks(res.tasks))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  // Compute stat totals
  const totalTasks = tasks.length;
  const activeTasks = tasks.filter((t) => ['NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD'].includes(t.status)).length;
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const overdueTasks = tasks.filter((t) => t.dueStatus === 'Overdue').length;

  const notStarted = tasks.filter((t) => t.status === 'NOT_STARTED').length;
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const onHold = tasks.filter((t) => t.status === 'ON_HOLD').length;
  const cancelled = tasks.filter((t) => t.status === 'CANCELLED').length;

  const highPriority = tasks.filter((t) => t.priority === 'HIGH').length;
  const mediumPriority = tasks.filter((t) => t.priority === 'MEDIUM').length;
  const lowPriority = tasks.filter((t) => t.priority === 'LOW').length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Donut chart datasets
  const statusData = [
    { name: 'Completed', value: completedTasks, color: '#16A34A' },
    { name: 'In Progress', value: inProgress, color: '#F59E0B' },
    { name: 'On Hold', value: onHold, color: '#8B5CF6' },
    { name: 'Not Started', value: notStarted, color: '#64748B' },
  ];

  const priorityData = [
    { name: 'High Priority', value: highPriority, color: '#EF4444' },
    { name: 'Medium Priority', value: mediumPriority, color: '#F59E0B' },
    { name: 'Low Priority', value: lowPriority, color: '#16A34A' },
  ];

  // Table lists
  const upcomingTasks = tasks
    .filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && t.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const newlyAddedTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Dynamic Encouragement Banner
  let bannerMessage = "Keep going! You're making great progress.";
  if (completionRate >= 80) bannerMessage = "Outstanding performance! The majority of tasks are completed.";
  else if (overdueTasks > 3) bannerMessage = "Attention needed: Several tasks are currently overdue.";

  return (
    <div className="space-y-6">
      {/* Header Greeting Banner */}
      <div className="bg-gradient-to-r from-[#0B2A4A] to-[#1B4B82] rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Welcome back, {user.fullName}!
          </h1>
          <p className="text-xs text-blue-200 mt-1 font-medium">
            Here's an overview of your task monitoring & performance analytics for your organization.
          </p>
        </div>
        <button
          onClick={() => navigate('/all-tasks')}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/20 flex items-center space-x-2 shrink-0"
        >
          <span>View All Tasks</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* 4 Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Tasks */}
        <div
          onClick={() => navigate('/all-tasks')}
          className="custom-card p-5 cursor-pointer hover:shadow-md transition-all border-l-4 border-l-blue-600"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-700 font-bold">
              <ClipboardList className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400">Total Scoped</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{totalTasks}</div>
            <div className="text-xs text-slate-500 font-medium">Total Tasks Recorded</div>
          </div>
        </div>

        {/* Active Tasks */}
        <div
          onClick={() => navigate('/all-tasks')}
          className="custom-card p-5 cursor-pointer hover:shadow-md transition-all border-l-4 border-l-amber-500"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-slate-400">In Motion</span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{activeTasks}</div>
            <div className="text-xs text-slate-500 font-medium">Active Tasks</div>
          </div>
        </div>

        {/* Completed */}
        <div
          onClick={() => navigate('/all-tasks')}
          className="custom-card p-5 cursor-pointer hover:shadow-md transition-all border-l-4 border-l-emerald-500"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
              {completionRate}% Rate
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{completedTasks}</div>
            <div className="text-xs text-slate-500 font-medium">Completed Tasks</div>
          </div>
        </div>

        {/* Overdue */}
        <div
          onClick={() => navigate('/all-tasks')}
          className="custom-card p-5 cursor-pointer hover:shadow-md transition-all border-l-4 border-l-rose-500"
        >
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 font-bold">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
              Action Req.
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-extrabold text-slate-900">{overdueTasks}</div>
            <div className="text-xs text-slate-500 font-medium">Overdue Tasks</div>
          </div>
        </div>
      </div>

      {/* Role-Specific Focus Card Banner */}
      {user.role === 'PROPERTY_MANAGER' && (
        <div className="custom-card p-4 border-l-4 border-l-indigo-600 bg-indigo-50/40 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Building className="w-6 h-6 text-indigo-700" />
            <div>
              <h3 className="text-xs font-bold text-indigo-900">Property Manager Focus View</h3>
              <p className="text-[11px] text-indigo-700">Tasks are currently scoped to property & tenant operations.</p>
            </div>
          </div>
          <Link to="/properties" className="text-xs font-bold text-indigo-700 hover:underline">Manage Properties →</Link>
        </div>
      )}

      {user.role === 'PROJECT_MANAGER' && (
        <div className="custom-card p-4 border-l-4 border-l-blue-600 bg-blue-50/40 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FolderKanban className="w-6 h-6 text-blue-700" />
            <div>
              <h3 className="text-xs font-bold text-blue-900">Project Timeline & Workload View</h3>
              <p className="text-[11px] text-blue-700">Track task burn-down rates across projects.</p>
            </div>
          </div>
          <Link to="/projects" className="text-xs font-bold text-blue-700 hover:underline">Manage Projects →</Link>
        </div>
      )}

      {user.role === 'FACILITIES_MANAGER' && (
        <div className="custom-card p-4 border-l-4 border-l-teal-600 bg-teal-50/40 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Wrench className="w-6 h-6 text-teal-700" />
            <div>
              <h3 className="text-xs font-bold text-teal-900">Facilities & Asset Maintenance View</h3>
              <p className="text-[11px] text-teal-700">Work orders and asset servicing schedules active.</p>
            </div>
          </div>
          <Link to="/assets" className="text-xs font-bold text-teal-700 hover:underline">Manage Assets →</Link>
        </div>
      )}

      {user.role === 'FINANCE_OFFICER' && (
        <div className="custom-card p-4 border-l-4 border-l-emerald-600 bg-emerald-50/40 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Receipt className="w-6 h-6 text-emerald-700" />
            <div>
              <h3 className="text-xs font-bold text-emerald-900">Finance & Billing Task Overview</h3>
              <p className="text-[11px] text-emerald-700">Tasks linked to invoice clearances and tax deadlines.</p>
            </div>
          </div>
          <Link to="/invoices" className="text-xs font-bold text-emerald-700 hover:underline">View Invoices →</Link>
        </div>
      )}

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Task Completion Donut */}
        <div className="custom-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-800">Task Completion Breakdown</h3>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">Current</span>
          </div>

          <div className="h-48 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <div className="text-xl font-extrabold text-slate-900">{completionRate}%</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Completed</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
            {statusData.map((item) => (
              <div key={item.name} className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 font-medium">{item.name}:</span>
                <span className="font-bold text-slate-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Priority Distribution Donut */}
        <div className="custom-card p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-slate-800">Priority Distribution</h3>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">All Priorities</span>
          </div>

          <div className="h-48 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={priorityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center">
              <div className="text-xl font-extrabold text-slate-900">{totalTasks}</div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-100 text-[11px] text-center">
            {priorityData.map((item) => (
              <div key={item.name} className="p-1 rounded bg-slate-50">
                <div className="font-bold text-slate-800">{item.value}</div>
                <div className="text-[10px] text-slate-500 font-medium truncate">{item.name.replace(' Priority', '')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks by Status Horizontal Bars */}
        <div className="custom-card p-5 space-y-3">
          <h3 className="text-xs font-bold text-slate-800 mb-2">Tasks by Status</h3>

          {[
            { label: 'Not Started', count: notStarted, color: 'bg-slate-500' },
            { label: 'In Progress', count: inProgress, color: 'bg-amber-500' },
            { label: 'On Hold', count: onHold, color: 'bg-purple-500' },
            { label: 'Completed', count: completedTasks, color: 'bg-emerald-500' },
            { label: 'Cancelled', count: cancelled, color: 'bg-rose-400' },
          ].map((st) => {
            const pct = totalTasks > 0 ? Math.round((st.count / totalTasks) * 100) : 0;
            return (
              <div key={st.label} className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-700">
                  <span>{st.label}</span>
                  <span>{st.count} ({pct}%)</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className={`h-full ${st.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-Column Tables: Upcoming Tasks / Newly Added Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <div className="custom-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-800">Upcoming Tasks</h3>
              <Link to="/all-tasks" className="text-xs font-bold text-blue-600 hover:underline">
                View all →
              </Link>
            </div>

            {upcomingTasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-medium">
                No upcoming tasks scheduled.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="pb-2">Task Name</th>
                      <th className="pb-2">Assignee</th>
                      <th className="pb-2 text-right">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {upcomingTasks.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 font-bold text-slate-800 max-w-[180px] truncate">{t.name}</td>
                        <td className="py-2.5 text-slate-600 font-medium">
                          {t.assignees[0]?.user.fullName || 'Unassigned'}
                        </td>
                        <td className="py-2.5 text-right font-semibold text-slate-700">
                          {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Newly Added Tasks */}
        <div className="custom-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-800">Newly Added Tasks</h3>
              <Link to="/all-tasks" className="text-xs font-bold text-blue-600 hover:underline">
                View all →
              </Link>
            </div>

            {newlyAddedTasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 font-medium">
                No tasks available.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                      <th className="pb-2">Task Name</th>
                      <th className="pb-2">Priority</th>
                      <th className="pb-2 text-right">Date Added</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {newlyAddedTasks.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80">
                        <td className="py-2.5 font-bold text-slate-800 max-w-[180px] truncate">{t.name}</td>
                        <td className="py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              t.priority === 'HIGH'
                                ? 'bg-rose-100 text-rose-700'
                                : t.priority === 'MEDIUM'
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {t.priority}
                          </span>
                        </td>
                        <td className="py-2.5 text-right font-semibold text-slate-500">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Encouragement Banner Strip */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-emerald-900 shadow-sm">
        <div className="flex items-center space-x-3">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-bold">{bannerMessage}</span>
        </div>
        <div className="text-xs font-bold text-emerald-700">
          Completion Rate: {completionRate}%
        </div>
      </div>
    </div>
  );
};
