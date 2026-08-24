import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Task, User } from '../types';
import { apiRequest } from '../lib/api';
import { CreateTaskModal } from '../components/modals/CreateTaskModal';

export const CalendarView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchCalendarTasks = async () => {
    try {
      const [tRes, uRes] = await Promise.all([
        apiRequest<{ tasks: Task[] }>('/tasks'),
        apiRequest<{ users: User[] }>('/users'),
      ]);
      setTasks(tRes.tasks);
      setUsers(uRes.users);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCalendarTasks();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    if (assigneeFilter !== 'ALL' && !t.assignees.some(a => a.userId === assigneeFilter)) return false;
    return true;
  });

  // Calculate calendar stats
  const tasksThisMonth = filteredTasks.filter((t) => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d.getFullYear() === year && d.getMonth() === month;
  }).length;

  const todayStr = new Date().toISOString().split('T')[0];
  const dueToday = filteredTasks.filter((t) => t.dueDate && t.dueDate.startsWith(todayStr)).length;
  const overdueCount = filteredTasks.filter((t) => t.dueStatus === 'Overdue').length;
  const upcomingCount = filteredTasks.filter((t) => {
    if (!t.dueDate || ['COMPLETED', 'CANCELLED'].includes(t.status)) return false;
    const diff = (new Date(t.dueDate).getTime() - Date.now()) / 86400000;
    return diff > 0 && diff <= 7;
  }).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Task Calendar</h1>
          <p className="text-xs text-slate-500 mt-0.5">See deadlines, upcoming work, and assigned tasks in one monthly view.</p>
        </div>
        <button
          onClick={() => { setSelectedTask(null); setIsModalOpen(true); }}
          className="px-4 py-2 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 shrink-0"
          style={{ background: '#123C73' }}
        >
          <Plus className="w-4 h-4" /><span>+ Add Task</span>
        </button>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Tasks This Month', val: tasksThisMonth, icon: '⊟', color: '#3B82F6', bg: '#EFF6FF' },
          { label: 'Due Today', val: dueToday, icon: '✓', color: '#16A34A', bg: '#F0FDF4' },
          { label: 'Upcoming', val: upcomingCount, icon: '→', color: '#F59E0B', bg: '#FFFBEB' },
          { label: 'Overdue', val: overdueCount, icon: '!', color: '#EF4444', bg: '#FEF2F2' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-extrabold shrink-0"
              style={{ background: s.bg, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <div className="text-xl font-extrabold text-slate-900 leading-none">{s.val}</div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar & Filters */}
      <div className="custom-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 border border-slate-200 rounded-lg bg-slate-50 p-1">
            <button
              onClick={prevMonth}
              className="p-1 hover:bg-white rounded text-slate-600 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={goToday}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-white rounded transition-colors"
            >
              Today
            </button>
            <button
              onClick={nextMonth}
              className="p-1 hover:bg-white rounded text-slate-600 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <h2 className="text-base font-extrabold text-slate-800">
            {monthNames[month]} {year}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white"
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
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white"
          >
            <option value="ALL">All Priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white"
          >
            <option value="ALL">All Assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.fullName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Month Calendar Grid */}
      <div className="custom-card overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center font-bold text-slate-600 text-xs py-2.5">
          <div>SUN</div>
          <div>MON</div>
          <div>TUE</div>
          <div>WED</div>
          <div>THU</div>
          <div>FRI</div>
          <div>SAT</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-200 bg-slate-100/50">
          {/* Empty lead-in cells */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] bg-slate-50/50 p-2" />
          ))}

          {/* Month day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const cellDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const isTodayCell = cellDateStr === todayStr;

            // Find tasks matching this date
            const dayTasks = filteredTasks.filter((t) => t.dueDate && t.dueDate.startsWith(cellDateStr));

            return (
              <div
                key={`day-${dayNum}`}
                className={`min-h-[100px] p-2 bg-white flex flex-col justify-start space-y-1 transition-colors hover:bg-blue-50/30 ${
                  isTodayCell ? 'ring-2 ring-blue-500/50 bg-blue-50/20' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isTodayCell ? 'bg-blue-600 text-white' : 'text-slate-700'
                    }`}
                  >
                    {dayNum}
                  </span>
                  {dayTasks.length > 0 && (
                    <span className="text-[10px] font-bold text-slate-400">
                      {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                    </span>
                  )}
                </div>

                {/* Render task chips */}
                <div className="space-y-1 overflow-y-auto max-h-24">
                  {dayTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => {
                        setSelectedTask(t);
                        setIsModalOpen(true);
                      }}
                      className={`px-2 py-1 rounded text-[11px] font-bold text-white cursor-pointer truncate shadow-2xs hover:opacity-90 ${
                        t.status === 'COMPLETED'
                          ? 'bg-emerald-600'
                          : t.dueStatus === 'Overdue'
                          ? 'bg-rose-600'
                          : t.priority === 'HIGH'
                          ? 'bg-rose-500'
                          : t.priority === 'MEDIUM'
                          ? 'bg-amber-500'
                          : 'bg-blue-600'
                      }`}
                      title={`${t.name} (${t.priority} priority, ${t.status})`}
                    >
                      {t.name}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CreateTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCalendarTasks}
        taskToEdit={selectedTask}
      />
    </div>
  );
};
