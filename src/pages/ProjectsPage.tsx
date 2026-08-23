import React, { useState, useEffect } from 'react';
import { FolderKanban, Plus, ClipboardList } from 'lucide-react';
import { Project } from '../types';
import { apiRequest } from '../lib/api';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{ projects: Project[] }>('/domain/projects');
      setProjects(data.projects);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    try {
      await apiRequest('/domain/projects', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      setName('');
      fetchProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to create project');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Project Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize capital projects, renovations, and multi-step initiatives.
          </p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="custom-card p-5 border-l-4 border-l-blue-600 flex flex-col md:flex-row gap-4 items-end">
        <div className="flex-1 space-y-1">
          <label className="block text-xs font-bold text-slate-700">Project Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Lobby Renovation Q3"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium"
            required
          />
        </div>

        <button
          type="submit"
          className="px-5 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center space-x-1 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Project</span>
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((p) => (
          <div key={p.id} className="custom-card p-5 hover:shadow-md transition-all space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <FolderKanban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">{p.name}</h3>
                <p className="text-xs text-slate-500">{p.property?.name || 'General Project'}</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 font-medium">
              <div className="flex items-center space-x-1">
                <ClipboardList className="w-4 h-4 text-blue-600" />
                <span>{p.tasks?.length || 0} Tasks Linked</span>
              </div>
              <span className="text-[11px] text-slate-400">Created {new Date(p.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
