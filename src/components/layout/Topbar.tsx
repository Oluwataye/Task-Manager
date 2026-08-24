import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Shield, User, LogOut, ChevronDown } from 'lucide-react';
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
  const { user, switchRole, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  const initials = user.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <header className="h-14 bg-white border-b border-slate-200 pl-[230px] pr-6 flex items-center justify-between sticky top-0 z-20 shadow-sm select-none">
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

        {/* User Pill with Dropdown */}
        <div className="relative border-l pl-3 border-slate-200" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 py-1 px-2 rounded-lg hover:bg-slate-100 transition-all cursor-pointer group"
          >
            <div className="w-7 h-7 rounded-full bg-[#123C73] text-white font-bold text-xs flex items-center justify-center shadow-xs overflow-hidden shrink-0">
              {user.photoUrl ? (
                <img src={user.photoUrl} alt={user.fullName} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-900 transition-colors">
              {user.fullName}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Profile Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header Info */}
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">{user.fullName}</p>
                <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full uppercase tracking-wider">
                  {user.role.replace('_', ' ')}
                </span>
              </div>

              {/* Links */}
              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-800 transition-colors"
                >
                  <User className="w-4 h-4 text-blue-600" />
                  <span>My Profile</span>
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
