import React, { useState, useEffect } from 'react';
import {
  X,
  PlusSquare,
  FileText,
  AlignLeft,
  Link,
  Users as UsersIcon,
  Flag,
  Calendar,
  Check,
} from 'lucide-react';
import { Task, User, TaskPriority, TaskStatus } from '../../types';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  taskToEdit?: Task | null;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  taskToEdit,
}) => {
  const { company } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [linkOrFile, setLinkOrFile] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [status, setStatus] = useState<TaskStatus>('NOT_STARTED');
  const [dueDate, setDueDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);

  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      // Fetch active users for assignee dropdown
      apiRequest<{ users: User[] }>('/users?status=ACTIVE')
        .then((res) => setAvailableUsers(res.users))
        .catch(console.error);

      if (taskToEdit) {
        setName(taskToEdit.name || '');
        setDescription(taskToEdit.description || '');
        setLinkOrFile(taskToEdit.linkOrFile || '');
        setPriority(taskToEdit.priority || 'MEDIUM');
        setStatus(taskToEdit.status || 'NOT_STARTED');
        setDueDate(taskToEdit.dueDate ? taskToEdit.dueDate.split('T')[0] : '');
        setStartDate(taskToEdit.startDate ? taskToEdit.startDate.split('T')[0] : '');
        setNotes(taskToEdit.notes || '');
        setSelectedAssigneeIds(taskToEdit.assignees.map((a) => a.userId));
      } else {
        setName('');
        setDescription('');
        setLinkOrFile('');
        setPriority('MEDIUM');
        setStatus('NOT_STARTED');
        setDueDate('');
        setStartDate('');
        setNotes('');
        setSelectedAssigneeIds([]);
      }
      setError('');
    }
  }, [isOpen, taskToEdit]);

  if (!isOpen) return null;

  const toggleAssignee = (userId: string) => {
    if (selectedAssigneeIds.includes(userId)) {
      setSelectedAssigneeIds(selectedAssigneeIds.filter((id) => id !== userId));
    } else {
      if (selectedAssigneeIds.length >= 3) {
        setError('Maximum 3 assignees allowed per task');
        return;
      }
      setError('');
      setSelectedAssigneeIds([...selectedAssigneeIds, userId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Task Name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        name,
        description,
        linkOrFile,
        priority,
        status,
        dueDate: dueDate || null,
        startDate: startDate || null,
        notes,
        assigneeIds: selectedAssigneeIds,
      };

      if (taskToEdit) {
        await apiRequest(`/tasks/${taskToEdit.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/tasks', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <PlusSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {taskToEdit ? 'Edit Task' : 'Create Task'}
              </h2>
              <p className="text-xs text-slate-500">
                {taskToEdit ? 'Update task parameters and assignees' : 'Add a new task and assign it to your team'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          {/* Task Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Task Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-10 bg-slate-100 border-r border-slate-200 rounded-l-lg flex items-center justify-center text-slate-400">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter task name"
                className="w-full pl-12 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-medium"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Description</label>
            <div className="relative">
              <div className="absolute left-0 top-0 h-10 w-10 bg-slate-100 border-r border-slate-200 rounded-tl-lg flex items-center justify-center text-slate-400">
                <AlignLeft className="w-4 h-4 text-blue-600" />
              </div>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description..."
                className="w-full pl-12 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-medium"
              />
            </div>
          </div>

          {/* Two-Column: Task Link/File + Assignees */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Task Link / File</label>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-10 bg-slate-100 border-r border-slate-200 rounded-l-lg flex items-center justify-center text-slate-400">
                  <Link className="w-4 h-4 text-blue-600" />
                </div>
                <input
                  type="text"
                  value={linkOrFile}
                  onChange={(e) => setLinkOrFile(e.target.value)}
                  placeholder="Paste Google Drive link or file URL"
                  className="w-full pl-12 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Assignees <span className="font-normal text-slate-500">(select up to 3)</span>
              </label>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-10 bg-slate-100 border-r border-slate-200 rounded-l-lg flex items-center justify-center text-slate-400">
                  <UsersIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div className="pl-12 pr-3 py-1.5 border border-slate-200 rounded-lg bg-white min-h-[42px] max-h-32 overflow-y-auto space-y-1">
                  {availableUsers.map((u) => {
                    const isSelected = selectedAssigneeIds.includes(u.id);
                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => toggleAssignee(u.id)}
                        className={`w-full flex items-center justify-between px-2 py-1 rounded text-left transition-colors ${
                          isSelected ? 'bg-blue-50 text-blue-800 font-semibold' : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span className="truncate">{u.fullName} ({u.role.replace('_', ' ')})</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Active Administrators and Employees from User Management are available here.
              </p>
            </div>
          </div>

          {/* Two-Column: Priority + Due Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Priority</label>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-10 bg-slate-100 border-r border-slate-200 rounded-l-lg flex items-center justify-center text-slate-400">
                  <Flag className="w-4 h-4 text-blue-600" />
                </div>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full pl-12 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-semibold bg-white cursor-pointer"
                >
                  {(company?.reportPriorities && company.reportPriorities.length > 0
                    ? company.reportPriorities
                    : ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
                  ).map((p) => (
                    <option key={p} value={p}>
                      {p.charAt(0) + p.slice(1).toLowerCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Due Date</label>
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-10 bg-slate-100 border-r border-slate-200 rounded-l-lg flex items-center justify-center text-slate-400">
                  <Calendar className="w-4 h-4 text-blue-600" />
                </div>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full pl-12 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-medium bg-white"
                />
              </div>
            </div>
          </div>

          {/* Notes / Remarks */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Notes / Remarks</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any extra notes or remarks..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-xs font-medium"
            />
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 transition-colors flex items-center space-x-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold shadow-md shadow-blue-700/20 transition-all disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
