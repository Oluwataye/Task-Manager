import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Mail,
  ShieldCheck,
  Building,
  Key,
  Check,
  Save,
  Clock,
  Briefcase,
  Phone,
  CheckCircle2,
  AlertTriangle,
  FolderKanban,
  Wrench,
  Receipt,
  Building2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../lib/api';
import { Task } from '../types';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'roleDetails'>('profile');

  // Form states
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState('+1 (555) 234-5678');
  const [jobTitle, setJobTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [bio, setBio] = useState('');
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || '');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Stats / Tasks
  const [userTasks, setUserTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Status feedback
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setEmail(user.email);
      setPhotoUrl(user.photoUrl || '');

      // Set default title/department based on role
      const roleTitleMap: Record<string, { title: string; dept: string }> = {
        SUPER_ADMIN: { title: 'Senior Executive Lead', dept: 'Executive Operations' },
        COMPANY_ADMIN: { title: 'Head of Operations', dept: 'Corporate Administration' },
        PROPERTY_MANAGER: { title: 'Lead Property Manager', dept: 'Real Estate & Properties' },
        PROJECT_MANAGER: { title: 'Senior Project Director', dept: 'Project Management Office' },
        FACILITIES_MANAGER: { title: 'Chief Facilities Engineer', dept: 'Facilities & Asset Operations' },
        FINANCE_OFFICER: { title: 'Senior Financial Auditor', dept: 'Finance & Accounting' },
        STAFF: { title: 'Operations Specialist', dept: 'General Operations' },
        CONTRACTOR_TENANT: { title: 'External Services Lead', dept: 'Vendor & Tenant Logistics' },
      };

      const defaultData = roleTitleMap[user.role] || { title: 'Operations Specialist', dept: 'Operations' };
      setJobTitle(defaultData.title);
      setDepartment(defaultData.dept);
      setBio(`Managing task workflows, assigned property domain assets, and cross-functional operations as ${defaultData.title}.`);

      // Fetch user's assigned tasks
      apiRequest<{ tasks: Task[] }>('/tasks?myTasksOnly=true')
        .then((res) => setUserTasks(res.tasks))
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (!user) return null;

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await apiRequest(`/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          fullName,
          photoUrl: photoUrl || null,
        }),
      });

      await refreshUser();
      setMessage({ type: 'success', text: 'Profile details updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile details' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }

    setSaving(true);

    try {
      await apiRequest(`/users/${user.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          password: newPassword,
        }),
      });

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Password changed successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setSaving(false);
    }
  };

  // Role Metadata Specs
  const getRoleMetadata = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return {
          title: 'Super Administrator',
          color: 'bg-purple-600 text-white',
          border: 'border-purple-200',
          bgLight: 'bg-purple-50',
          icon: <ShieldCheck className="w-5 h-5 text-purple-600" />,
          description: 'Full system authorization with global multi-company oversight, user provisioning, system branding configuration, and audit access.',
          permissions: [
            'System Branding & Custom Themes',
            'Full User Provisioning & Password Resets',
            'Global Task Scoping & Deletions',
            'Financial Invoice & Billing Audits',
            'Property, Asset & Project Scoping',
          ],
        };
      case 'COMPANY_ADMIN':
        return {
          title: 'Company Administrator',
          color: 'bg-blue-600 text-white',
          border: 'border-blue-200',
          bgLight: 'bg-blue-50',
          icon: <Building2 className="w-5 h-5 text-blue-600" />,
          description: 'Organization administrator managing user onboarding, company branding settings, all domain modules, and reporting aggregation.',
          permissions: [
            'User Management & Role Assignment',
            'Company Settings & Logo Upload',
            'All Tasks & Reports Aggregation',
            'Full Domain Module Access',
          ],
        };
      case 'PROPERTY_MANAGER':
        return {
          title: 'Property Manager',
          color: 'bg-indigo-600 text-white',
          border: 'border-indigo-200',
          bgLight: 'bg-indigo-50',
          icon: <Building className="w-5 h-5 text-indigo-600" />,
          description: 'Manages real estate properties, tenant lease agreements, building maintenance, and facility compliance schedules.',
          permissions: [
            'Properties & Lease Scoping',
            'Building Work Orders & Inspection Tasks',
            'Tenant Communication & Workflows',
            'Property Performance Reports',
          ],
        };
      case 'PROJECT_MANAGER':
        return {
          title: 'Project Manager',
          color: 'bg-sky-600 text-white',
          border: 'border-sky-200',
          bgLight: 'bg-sky-50',
          icon: <FolderKanban className="w-5 h-5 text-sky-600" />,
          description: 'Oversees capital projects, architectural renovations, contractor assignments, and milestone burn-down tracking.',
          permissions: [
            'Project Scoping & Milestones',
            'Contractor Task Assignments',
            'Project Task Creation & Schedules',
            'Project Progress Analytics',
          ],
        };
      case 'FACILITIES_MANAGER':
        return {
          title: 'Facilities Manager',
          color: 'bg-teal-600 text-white',
          border: 'border-teal-200',
          bgLight: 'bg-teal-50',
          icon: <Wrench className="w-5 h-5 text-teal-600" />,
          description: 'Directs equipment maintenance, HVAC/Elevator safety servicing, asset logs, and emergency load testing.',
          permissions: [
            'Assets & Equipment Maintenance Logs',
            'Servicing Work Orders',
            'Facilities Task Scheduling',
            'Asset Health Audits',
          ],
        };
      case 'FINANCE_OFFICER':
        return {
          title: 'Finance Officer',
          color: 'bg-emerald-600 text-white',
          border: 'border-emerald-200',
          bgLight: 'bg-emerald-50',
          icon: <Receipt className="w-5 h-5 text-emerald-600" />,
          description: 'Handles financial task reviews, invoice approvals, vendor payments, lease deposit reconciliation, and tax filings.',
          permissions: [
            'Invoices & Payment Clearances',
            'Financial Tax & Audit Prep Tasks',
            'Vendor Bill Reconciliations',
            'Finance Performance Reports',
          ],
        };
      case 'STAFF':
        return {
          title: 'Staff / Employee',
          color: 'bg-slate-700 text-white',
          border: 'border-slate-200',
          bgLight: 'bg-slate-50',
          icon: <UserIcon className="w-5 h-5 text-slate-700" />,
          description: 'Executes assigned operational tasks, updates progress status, logs completion details, and requests assistance.',
          permissions: [
            'Assigned Task Execution & Progress Logs',
            'Calendar View Access',
            'Personal Activity History',
            'Inline Status Updates',
          ],
        };
      case 'CONTRACTOR_TENANT':
      default:
        return {
          title: 'Contractor / Tenant',
          color: 'bg-amber-600 text-white',
          border: 'border-amber-200',
          bgLight: 'bg-amber-50',
          icon: <Sparkles className="w-5 h-5 text-amber-600" />,
          description: 'External service provider or building tenant logging issue requests, viewing contractor work orders, and updating repair tickets.',
          permissions: [
            'Contractor Work Orders & Repair Logs',
            'Tenant Repair Request Submission',
            'Direct Ticket Status View',
          ],
        };
    }
  };

  const roleMeta = getRoleMetadata(user.role);

  // Compute Task Metrics
  const totalMyTasks = userTasks.length;
  const completedTasks = userTasks.filter((t) => t.status === 'COMPLETED').length;
  const inProgressTasks = userTasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const overdueTasks = userTasks.filter((t) => t.dueStatus === 'Overdue').length;
  const completionRate = totalMyTasks > 0 ? Math.round((completedTasks / totalMyTasks) * 100) : 100;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header Profile Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-blue-50/80 to-transparent pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center space-x-5">
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-[#123C73] text-white text-2xl font-extrabold flex items-center justify-center border-4 border-white shadow-md overflow-hidden">
                {photoUrl ? (
                  <img src={photoUrl} alt={user.fullName} className="w-full h-full object-cover" />
                ) : (
                  user.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
                )}
              </div>
              <span className="w-4 h-4 bg-emerald-500 rounded-full absolute bottom-1 right-1 border-2 border-white shadow" />
            </div>

            {/* Profile Meta info */}
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-extrabold text-slate-900">{user.fullName}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${roleMeta.color}`}>
                  {roleMeta.title}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-1 flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{user.email}</span>
                <span className="text-slate-300">•</span>
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                <span>{jobTitle}</span>
              </p>
              <p className="text-[11px] text-slate-400 font-semibold mt-1">
                Account Status: <span className="text-emerald-600 uppercase">ACTIVE</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics Badge */}
          <div className="flex items-center space-x-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200 shrink-0">
            <div className="text-center px-3 border-r border-slate-200">
              <div className="text-lg font-extrabold text-slate-900">{totalMyTasks}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Assigned Tasks</div>
            </div>
            <div className="text-center px-3 border-r border-slate-200">
              <div className="text-lg font-extrabold text-emerald-600">{completedTasks}</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Completed</div>
            </div>
            <div className="text-center px-3">
              <div className="text-lg font-extrabold text-blue-600">{completionRate}%</div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Efficiency</div>
            </div>
          </div>
        </div>
      </div>

      {/* Message Feedback */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center space-x-2 ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          {message.type === 'success' ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertTriangle className="w-4 h-4 text-rose-600" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* 2. Main Content Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Navigation Tabs & Role Capabilities */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-2 shadow-sm border border-slate-100 space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === 'profile' ? 'bg-[#123C73] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Personal Information</span>
            </button>

            <button
              onClick={() => setActiveTab('roleDetails')}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === 'roleDetails' ? 'bg-[#123C73] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Role & Permissions</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                activeTab === 'security' ? 'bg-[#123C73] text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Key className="w-4 h-4" />
              <span>Security & Password</span>
            </button>
          </div>

          {/* Role Capabilities Summary Box */}
          <div className={`rounded-2xl p-5 border ${roleMeta.border} ${roleMeta.bgLight} space-y-3`}>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-white shadow-sm">{roleMeta.icon}</div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900">{roleMeta.title}</h3>
                <p className="text-[10px] font-bold text-slate-500 uppercase">Access Scope</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">{roleMeta.description}</p>

            <div className="border-t border-slate-200/60 pt-3 space-y-2">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                Active Privileges:
              </span>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {roleMeta.permissions.map((perm, idx) => (
                  <li key={idx} className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{perm}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Right Col: Active Tab Body */}
        <div className="lg:col-span-2 space-y-6">
          {/* TAB 1: Personal Information Form */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Personal Information</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your display profile, job title, and contact details.
                </p>
              </div>

              <form onSubmit={handleProfileSave} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 font-medium cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Job Title</label>
                    <div className="relative">
                      <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Department</label>
                    <div className="relative">
                      <Building className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Profile Photo URL</label>
                    <input
                      type="url"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="https://example.com/avatar.jpg"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Professional Bio / Notes</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium text-xs"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-[#123C73] hover:bg-[#0e2f5c] text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Role Details & Activity */}
          {activeTab === 'roleDetails' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Role & Workload Overview</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Detailed analysis of tasks assigned to your role profile.
                </p>
              </div>

              {/* Task Activity Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <div className="text-xl font-extrabold text-slate-900">{totalMyTasks}</div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Assigned</div>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-center">
                  <div className="text-xl font-extrabold text-amber-700">{inProgressTasks}</div>
                  <div className="text-[10px] font-bold text-amber-600 uppercase mt-0.5">In Progress</div>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                  <div className="text-xl font-extrabold text-emerald-700">{completedTasks}</div>
                  <div className="text-[10px] font-bold text-emerald-600 uppercase mt-0.5">Completed</div>
                </div>
                <div className="p-4 bg-rose-50 rounded-xl border border-rose-200 text-center">
                  <div className="text-xl font-extrabold text-rose-700">{overdueTasks}</div>
                  <div className="text-[10px] font-bold text-rose-600 uppercase mt-0.5">Overdue</div>
                </div>
              </div>

              {/* Recent Assigned Tasks List */}
              <div className="space-y-3">
                <h3 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                  Assigned Operational Workload
                </h3>

                {userTasks.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                    No active tasks currently assigned to your profile.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userTasks.map((t) => (
                      <div
                        key={t.id}
                        className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">{t.name}</div>
                          <div className="text-[11px] text-slate-500 font-medium mt-0.5 flex items-center space-x-2">
                            <span>Priority: <strong className="text-slate-700">{t.priority}</strong></span>
                            <span>•</span>
                            <span>Due: {t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'N/A'}</span>
                          </div>
                        </div>
                        <span
                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                            t.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : t.status === 'IN_PROGRESS'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {t.status.replace('_', ' ')}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Security & Password Form */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-6">
              <div>
                <h2 className="text-base font-extrabold text-slate-900">Security & Password</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your authentication credentials securely.
                </p>
              </div>

              <form onSubmit={handlePasswordSave} className="space-y-4 text-xs max-w-md">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Current Password</label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">New Password</label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 bg-[#123C73] hover:bg-[#0e2f5c] text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center space-x-2 disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Updating Password...' : 'Update Password'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
