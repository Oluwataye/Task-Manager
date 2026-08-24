import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { Task } from '../types';

// Ring stat card component
const RingCard: React.FC<{
  label: string;
  sublabel: string;
  value: number | string;
  color: string;
  ringColor: string;
  icon: React.ReactNode;
}> = ({ label, sublabel, value, color, icon }) => (
  <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center space-x-4">
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
      style={{ border: `4px solid ${color}`, background: `${color}15` }}
    >
      <span style={{ color }}>{icon}</span>
    </div>
    <div>
      <div className="text-2xl font-extrabold text-slate-900 leading-none">{value}</div>
      <div className="text-xs font-bold text-slate-700 mt-0.5">{label}</div>
      <div className="text-[11px] text-slate-400 mt-0.5">{sublabel}</div>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiRequest<{ tasks: Task[] }>('/tasks')
      .then((res) => setTasks(res.tasks))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const totalTasks = tasks.length;
  const activeTasks = tasks.filter((t) => ['NOT_STARTED', 'IN_PROGRESS', 'ON_HOLD'].includes(t.status)).length;
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const overdueTasks = tasks.filter((t) => t.dueStatus === 'Overdue').length;
  const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const notStarted = tasks.filter((t) => t.status === 'NOT_STARTED').length;
  const onHold = tasks.filter((t) => t.status === 'ON_HOLD').length;
  const cancelled = tasks.filter((t) => t.status === 'CANCELLED').length;
  const highPriority = tasks.filter((t) => t.priority === 'HIGH').length;
  const mediumPriority = tasks.filter((t) => t.priority === 'MEDIUM').length;
  const lowPriority = tasks.filter((t) => t.priority === 'LOW').length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const dueToday = tasks.filter((t) => {
    if (!t.dueDate || ['COMPLETED', 'CANCELLED'].includes(t.status)) return false;
    const d = new Date(t.dueDate);
    const n = new Date();
    return d.toDateString() === n.toDateString();
  }).length;
  const dueThisWeek = tasks.filter((t) => {
    if (!t.dueDate || ['COMPLETED', 'CANCELLED'].includes(t.status)) return false;
    const d = new Date(t.dueDate);
    const n = new Date();
    const diff = (d.getTime() - n.getTime()) / 86400000;
    return diff >= 0 && diff <= 7;
  }).length;
  const dueThisMonth = tasks.filter((t) => {
    if (!t.dueDate || ['COMPLETED', 'CANCELLED'].includes(t.status)) return false;
    const d = new Date(t.dueDate);
    const n = new Date();
    return d.getMonth() === n.getMonth() && d.getFullYear() === n.getFullYear();
  }).length;

  const statusData = [
    { name: 'Completed', value: completedTasks, color: '#16A34A' },
    { name: 'In Progress', value: inProgress, color: '#F59E0B' },
    { name: 'On Hold', value: onHold, color: '#8B5CF6' },
    { name: 'Not Started', value: notStarted, color: '#64748B' },
  ];
  const priorityData = [
    { name: 'High', value: highPriority, color: '#EF4444' },
    { name: 'Medium', value: mediumPriority, color: '#F59E0B' },
    { name: 'Low', value: lowPriority, color: '#16A34A' },
  ];

  const upcomingTasks = tasks
    .filter((t) => !['COMPLETED', 'CANCELLED'].includes(t.status) && t.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const newlyAddedTasks = [...tasks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const encouragement =
    completionRate >= 80
      ? 'Outstanding! Most tasks are completed.'
      : overdueTasks > 3
      ? 'Several tasks are overdue — action needed!'
      : "Keep going! You're making great progress.";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Welcome back, {user.fullName}!</h1>
          <p className="text-xs text-slate-500 mt-0.5">Track, assign, and monitor employee tasks in real-time.</p>
        </div>
        <Link
          to="/all-tasks"
          className="px-4 py-2 rounded-lg text-xs font-bold text-white transition-all"
          style={{ background: '#123C73' }}
        >
          View All Tasks →
        </Link>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <RingCard
          label="Total Tasks"
          sublabel="View all tasks"
          value={totalTasks}
          color="#16A34A"
          ringColor="#16A34A"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <RingCard
          label="Active Tasks"
          sublabel={`${totalTasks > 0 ? Math.round((activeTasks / totalTasks) * 100) : 0}% of total`}
          value={activeTasks}
          color="#F59E0B"
          ringColor="#F59E0B"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" /></svg>}
        />
        <RingCard
          label="Completed"
          sublabel={`${completionRate}% of total`}
          value={completedTasks}
          color="#3B82F6"
          ringColor="#3B82F6"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <RingCard
          label="Overdue Tasks"
          sublabel="Needs attention"
          value={overdueTasks}
          color="#EF4444"
          ringColor="#EF4444"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>}
        />
      </div>

      {/* Donut Charts + Tasks by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Task Completion donut */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">✓ Task Completion</h3>
            <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Current</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-32 h-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData.filter(d => d.value > 0).length > 0 ? statusData : [{ name: 'Empty', value: 1, color: '#e2e8f0' }]}
                    cx="50%" cy="50%" innerRadius={38} outerRadius={55} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                    {(statusData.filter(d => d.value > 0).length > 0 ? statusData : [{ color: '#e2e8f0' }]).map((e: any, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any, n: any) => [v, n]} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-extrabold text-slate-900">{completionRate}%</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Completed</span>
              </div>
            </div>
            <div className="space-y-1.5 flex-1">
              {statusData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Priority Distribution donut */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">⚑ Priority Distribution</h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-32 h-32 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={priorityData.filter(d => d.value > 0).length > 0 ? priorityData : [{ name: 'Empty', value: 1, color: '#e2e8f0' }]}
                    cx="50%" cy="50%" innerRadius={38} outerRadius={55} paddingAngle={3} dataKey="value" startAngle={90} endAngle={-270}>
                    {(priorityData.filter(d => d.value > 0).length > 0 ? priorityData : [{ color: '#e2e8f0' }]).map((e: any, i) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-extrabold text-slate-900">{totalTasks}</span>
                <span className="text-[9px] text-slate-400 font-bold uppercase">Total</span>
              </div>
            </div>
            <div className="space-y-1.5 flex-1">
              {priorityData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
                    <span className="text-slate-600">{item.name}</span>
                  </div>
                  <span className="font-bold text-slate-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tasks by Status list */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <h3 className="text-sm font-bold text-slate-800 mb-4">⊙ Tasks by Status</h3>
          <div className="space-y-3">
            {[
              { label: 'Not Started', count: notStarted, color: '#3B82F6' },
              { label: 'In Progress', count: inProgress, color: '#F59E0B' },
              { label: 'On Hold', count: onHold, color: '#8B5CF6' },
              { label: 'Completed', count: completedTasks, color: '#16A34A' },
              { label: 'Cancelled', count: cancelled, color: '#EF4444' },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                  <span className="font-medium text-slate-700">{s.label}</span>
                </div>
                <span className="font-bold text-slate-800">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming + Newly Added */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">⊟ Upcoming Tasks</h3>
            <Link to="/all-tasks" className="text-xs font-bold text-blue-600 hover:underline">View all</Link>
          </div>
          {upcomingTasks.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">No upcoming tasks scheduled.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase">
                  <th className="text-left pb-2">Task Name</th>
                  <th className="text-left pb-2">Assignee</th>
                  <th className="text-right pb-2">Due Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {upcomingTasks.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2 font-semibold text-slate-800 max-w-[140px] truncate">{t.name}</td>
                    <td className="py-2 text-slate-500">{t.assignees[0]?.user?.fullName || 'Unassigned'}</td>
                    <td className="py-2 text-right text-slate-600">{t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800">⊟ Newly Added Tasks</h3>
            <Link to="/all-tasks" className="text-xs font-bold text-blue-600 hover:underline">View all</Link>
          </div>
          {newlyAddedTasks.length === 0 ? (
            <p className="text-center text-xs text-slate-400 py-8">No tasks available.</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase">
                  <th className="text-left pb-2">Task Name</th>
                  <th className="text-left pb-2">Assignee</th>
                  <th className="text-right pb-2">Added On</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {newlyAddedTasks.map((t) => (
                  <tr key={t.id}>
                    <td className="py-2 font-semibold text-slate-800 max-w-[140px] truncate">{t.name}</td>
                    <td className="py-2">
                      {t.assignees[0]?.user ? (
                        <div className="flex items-center space-x-1.5">
                          <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                            {t.assignees[0].user.fullName.split(' ').map(n => n[0]).join('').substring(0, 2)}
                          </div>
                          <span className="text-slate-600 truncate">{t.assignees[0].user.fullName}</span>
                        </div>
                      ) : <span className="text-slate-400">Unassigned</span>}
                    </td>
                    <td className="py-2 text-right text-slate-500">{new Date(t.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Bottom Strip */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3 flex flex-wrap items-center gap-4">
        {[
          { label: 'Due Today', val: dueToday },
          { label: 'Overdue', val: overdueTasks },
          { label: 'Due This Week', val: dueThisWeek },
          { label: 'Due This Month', val: dueThisMonth },
        ].map((s) => (
          <div key={s.label} className="flex items-baseline space-x-1.5">
            <span className="text-xl font-extrabold text-slate-900">{s.val}</span>
            <span className="text-xs text-slate-500 font-medium">{s.label} tasks</span>
          </div>
        ))}
        <div className="ml-auto flex items-center space-x-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2">
          <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <div className="text-xs font-extrabold text-emerald-900">Keep going!</div>
            <div className="text-[10px] text-emerald-700">{encouragement}</div>
          </div>
        </div>
      </div>
    </div>
  );
};
