import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Bell, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

const allRoles: { role: Role; label: string }[] = [
  { role: 'SUPER_ADMIN', label: 'Super Admin' },
  { role: 'COMPANY_ADMIN', label: 'Company Admin' },
  { role: 'PROPERTY_MANAGER', label: 'Property Manager' },
  { role: 'PROJECT_MANAGER', label: 'Project Manager' },
  { role: 'FACILITIES_MANAGER', label: 'Facilities Manager' },
  { role: 'FINANCE_OFFICER', label: 'Finance Officer' },
  { role: 'STAFF', label: 'Staff / User' },
  { role: 'CONTRACTOR_TENANT', label: 'Contractor / Tenant' },
];

export const Topbar: React.FC = () => {
  const { user, switchRole } = useAuth();

  if (!user) return null;

  return (
    <header className="h-14 bg-white border-b border-slate-200 pl-[230px] pr-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      {/* Search Input */}
      <div className="relative w-72">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Global search tasks, users..."
          className="w-full pl-9 pr-3 py-1.5 bg-slate-100/80 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
        />
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-4">
        {/* Quick Demo Role Switcher */}
        <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
          <Shield className="w-3.5 h-3.5 text-blue-700" />
          <span className="text-[11px] font-bold text-slate-600 hidden sm:inline">Role View:</span>
          <select
            value={user.role}
            onChange={(e) => switchRole(e.target.value as Role)}
            className="bg-transparent text-xs font-bold text-blue-900 border-none outline-none cursor-pointer py-0.5"
          >
            {allRoles.map((r) => (
              <option key={r.role} value={r.role}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        {/* Notifications */}
        <button
          type="button"
          className="relative p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-all"
        >
          <Bell className="w-4 h-4" />
          <span className="w-2 h-2 bg-rose-500 rounded-full absolute top-1 right-1 ring-2 ring-white" />
        </button>

        {/* User Pill */}
        <Link
          to="/profile"
          className="flex items-center space-x-2 border-l pl-3 border-slate-200 hover:opacity-80 transition-opacity group cursor-pointer"
        >
          <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
            {user.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <span className="text-xs font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">
            {user.fullName}
          </span>
        </Link>
      </div>
    </header>
  );
};
