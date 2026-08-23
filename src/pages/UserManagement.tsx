import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Search,
  Pencil,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Upload,
  User as UserIcon,
  Shield,
} from 'lucide-react';
import { User, Role, UserStatus } from '../types';
import { apiRequest } from '../lib/api';
import { useAuth } from '../context/AuthContext';

const rolesList: { role: Role; label: string }[] = [
  { role: 'SUPER_ADMIN', label: 'Super Admin' },
  { role: 'COMPANY_ADMIN', label: 'Company Admin' },
  { role: 'PROPERTY_MANAGER', label: 'Property Manager' },
  { role: 'PROJECT_MANAGER', label: 'Project Manager' },
  { role: 'FACILITIES_MANAGER', label: 'Facilities Manager' },
  { role: 'FINANCE_OFFICER', label: 'Finance Officer' },
  { role: 'STAFF', label: 'Staff / User' },
  { role: 'CONTRACTOR_TENANT', label: 'External Contractor / Tenant' },
];

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form State
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('STAFF');
  const [status, setStatus] = useState<UserStatus>('ACTIVE');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<{ users: User[] }>(`/users${search ? `?search=${search}` : ''}`);
      setUsers(data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);

    try {
      const res = await apiRequest<{ photoUrl: string }>('/users/upload-photo', {
        method: 'POST',
        body: formData,
      });
      setPhotoUrl(res.photoUrl);
    } catch (err: any) {
      alert(err.message || 'Failed to upload photo');
    }
  };

  const handleClearForm = () => {
    setEditingUserId(null);
    setFullName('');
    setEmail('');
    setPassword('');
    setRole('STAFF');
    setStatus('ACTIVE');
    setPhotoUrl(null);
    setFormError('');
    setFormSuccess('');
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!fullName || !email || (!editingUserId && !password)) {
      setFormError('Full Name, Email, and Password (for new users) are required.');
      return;
    }

    try {
      const payload = {
        fullName,
        email,
        password,
        role,
        status,
        photoUrl,
      };

      if (editingUserId) {
        await apiRequest(`/users/${editingUserId}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setFormSuccess('User updated successfully!');
      } else {
        await apiRequest('/users', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setFormSuccess('User created successfully!');
      }

      handleClearForm();
      fetchUsers();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save user');
    }
  };

  const startEdit = (user: User) => {
    setEditingUserId(user.id);
    setFullName(user.fullName);
    setEmail(user.email);
    setPassword('');
    setRole(user.role);
    setStatus(user.status);
    setPhotoUrl(user.photoUrl || null);
    setFormError('');
    setFormSuccess('');
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await apiRequest(`/users/${userId}`, { method: 'DELETE' });
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const toggleRevealPassword = (id: string) => {
    setRevealedPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">User Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage employee access, role permissions, and active accounts.
          </p>
        </div>
      </div>

      {/* Form Panel matching reference */}
      <div className="custom-card p-6 border-l-4 border-l-blue-700">
        <div className="flex items-center space-x-2 text-sm font-extrabold text-slate-800 mb-4">
          <UserPlus className="w-5 h-5 text-blue-700" />
          <span>{editingUserId ? 'Edit User Account' : 'Add New User Account'}</span>
        </div>

        {formError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {formError}
          </div>
        )}
        {formSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            {formSuccess}
          </div>
        )}

        <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
          {/* Avatar Upload */}
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold overflow-hidden border border-slate-300">
              {photoUrl ? (
                <img src={photoUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-6 h-6" />
              )}
            </div>
            <div>
              <label className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg cursor-pointer transition-colors inline-flex items-center space-x-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
              {photoUrl && (
                <button
                  type="button"
                  onClick={() => setPhotoUrl(null)}
                  className="ml-2 text-xs text-rose-600 font-bold hover:underline"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="john@company.com"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Password {editingUserId && <span className="font-normal text-slate-400">(leave blank to keep unchanged)</span>}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Role Assignment</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-slate-700 bg-white cursor-pointer"
              >
                {rolesList.map((r) => (
                  <option key={r.role} value={r.role}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Account Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-slate-700 bg-white cursor-pointer"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={handleClearForm}
              className="px-4 py-2 border border-slate-300 rounded-lg font-semibold text-slate-600 hover:bg-slate-100"
            >
              Clear
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-lg shadow-md"
            >
              {editingUserId ? 'Update User' : 'Save User'}
            </button>
          </div>
        </form>
      </div>

      {/* All Users Table */}
      <div className="custom-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-extrabold text-slate-900">All System Users</h2>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user name or email..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-xs font-medium"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-[#0B2A4A] text-white font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Email / Username</th>
                <th className="py-3 px-4">Password</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {users.map((u) => {
                const isRevealed = revealedPasswords[u.id];
                return (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-bold text-slate-800 flex items-center space-x-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                        {u.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{u.fullName}</div>
                        <div className="text-[10px] text-slate-400">ID: {u.id.substring(0, 8)}</div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-600">{u.email}</td>

                    {/* Masked Dots + Lock Icon + Reveal on Click for Admin */}
                    <td className="py-3 px-4 font-mono text-slate-500">
                      <div className="flex items-center space-x-2">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{isRevealed ? 'password123' : '••••••••'}</span>
                        <button
                          type="button"
                          onClick={() => toggleRevealPassword(u.id)}
                          className="text-slate-400 hover:text-slate-600 ml-1"
                        >
                          {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          u.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-700'
                            : u.status === 'INACTIVE'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => startEdit(u)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit User"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
