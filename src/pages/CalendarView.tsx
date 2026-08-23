import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { Task } from '../types';
import { apiRequest } from '../lib/api';
import { CreateTaskModal } from '../components/modals/CreateTaskModal';

export const CalendarView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const fetchCalendarTasks = async () => {
    try {
      const data = await apiRequest<{ tasks: Task[] }>('/tasks');
      setTasks(data.tasks);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Calendar</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Visualize task schedules, due dates, and deadlines across your organization.
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedTask(null);
            setIsModalOpen(true);
          }}
          className="px-5 py-2.5 bg-[#123C73] hover:bg-[#0e2f5c] text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Task</span>
        </button>
      </div>

      {/* 4 Stat Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="custom-card p-4 flex items-center space-x-3 border-l-4 border-l-blue-600">
          <CalendarIcon className="w-8 h-8 text-blue-600" />
          <div>
            <div className="text-xl font-extrabold text-slate-900">{tasksThisMonth}</div>
            <div className="text-xs text-slate-500 font-medium">Tasks This Month</div>
          </div>
        </div>

        <div className="custom-card p-4 flex items-center space-x-3 border-l-4 border-l-amber-500">
          <Clock className="w-8 h-8 text-amber-500" />
          <div>
            <div className="text-xl font-extrabold text-slate-900">{dueToday}</div>
            <div className="text-xs text-slate-500 font-medium">Due Today</div>
          </div>
        </div>

        <div className="custom-card p-4 flex items-center space-x-3 border-l-4 border-l-emerald-500">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          <div>
            <div className="text-xl font-extrabold text-slate-900">{filteredTasks.length}</div>
            <div className="text-xs text-slate-500 font-medium">Total Visible</div>
          </div>
        </div>

        <div className="custom-card p-4 flex items-center space-x-3 border-l-4 border-l-rose-500">
          <AlertTriangle className="w-8 h-8 text-rose-500" />
          <div>
            <div className="text-xl font-extrabold text-slate-900">{overdueCount}</div>
            <div className="text-xs text-slate-500 font-medium">Overdue</div>
          </div>
        </div>
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

        <div className="flex items-center space-x-3 w-full md:w-auto">
          {/* View switcher */}
          <div className="flex items-center border border-slate-200 rounded-lg p-1 bg-slate-50 text-xs font-bold">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded transition-all ${
                viewMode === 'month' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-500'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded transition-all ${
                viewMode === 'week' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-500'
              }`}
            >
              Week
            </button>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold bg-white"
          >
            <option value="ALL">All Status</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
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
