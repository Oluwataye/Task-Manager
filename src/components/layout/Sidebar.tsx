import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  Calendar,
  BarChart3,
  Users,
  Settings,
  Building2,
  FolderKanban,
  Wrench,
  Receipt,
  LogOut,
  Quote,
  Building,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Role } from '../../types';

interface SidebarProps {
  onOpenSettings?: () => void;
}

const quotes = [
  { text: 'Organized tasks create organized results.', author: 'Unknown' },
  { text: 'Efficiency is doing things right; effectiveness is doing the right things.', author: 'Peter Drucker' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
];

export const Sidebar: React.FC<SidebarProps> = ({ onOpenSettings }) => {
  const { user, company, logout } = useAuth();
  const navigate = useNavigate();
  const [quoteIndex] = useState(0);

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const role: Role = user.role;

  // Determine allowed menu items based on RBAC matrix
  const showAllTasks = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'PROPERTY_MANAGER', 'PROJECT_MANAGER', 'FACILITIES_MANAGER'].includes(role);
  const showReports = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'PROPERTY_MANAGER', 'PROJECT_MANAGER', 'FACILITIES_MANAGER', 'FINANCE_OFFICER'].includes(role);
  const showUsers = ['SUPER_ADMIN', 'COMPANY_ADMIN'].includes(role);
  const showSettings = ['SUPER_ADMIN', 'COMPANY_ADMIN'].includes(role);

  // Role-specific additional nav items
  const showProperties = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'PROPERTY_MANAGER'].includes(role);
  const showProjects = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'PROJECT_MANAGER'].includes(role);
  const showAssets = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'FACILITIES_MANAGER'].includes(role);
  const showInvoices = ['SUPER_ADMIN', 'COMPANY_ADMIN', 'FINANCE_OFFICER'].includes(role);

  return (
    <aside className="w-[230px] bg-sidebar-bg text-sidebar-text flex flex-col h-screen fixed left-0 top-0 z-30 select-none shadow-xl">
      {/* 1. Header Block: Company Logo + Name + System Subtitle */}
      <div className="p-4 flex items-center space-x-3 border-b border-slate-700/50 bg-[#071F38]">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center p-1 overflow-hidden shrink-0 shadow">
          {company?.logoUrl ? (
            <img src={company.logoUrl} alt="Logo" className="w-full h-full object-contain" />
          ) : (
            <Building2 className="w-6 h-6 text-sidebar-bg" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-white text-sm truncate leading-tight">
            {company?.name || 'Your Company Name'}
          </h1>
          <p className="text-[11px] text-slate-300 truncate font-medium">
            {company?.systemName || 'Task Monitoring System'}
          </p>
        </div>
      </div>

      {/* Navigation list */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {/* MAIN MENU */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
            Main Menu
          </div>
          <nav className="space-y-1">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-sidebar-active text-sidebar-text-active shadow-sm'
                    : 'text-sidebar-text hover:bg-slate-800/60 hover:text-white'
                }`
              }
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </NavLink>

            {showAllTasks && (
              <NavLink
                to="/all-tasks"
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-sidebar-active text-sidebar-text-active shadow-sm'
                      : 'text-sidebar-text hover:bg-slate-800/60 hover:text-white'
                  }`
                }
              >
                <ClipboardList className="w-4 h-4 shrink-0" />
                <span>All Tasks</span>
              </NavLink>
            )}

            <NavLink
              to="/my-tasks"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-sidebar-active text-sidebar-text-active shadow-sm'
                    : 'text-sidebar-text hover:bg-slate-800/60 hover:text-white'
                }`
              }
            >
              <CheckSquare className="w-4 h-4 shrink-0" />
              <span>My Tasks</span>
            </NavLink>

            <NavLink
              to="/calendar"
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-sidebar-active text-sidebar-text-active shadow-sm'
                    : 'text-sidebar-text hover:bg-slate-800/60 hover:text-white'
                }`
              }
            >
              <Calendar className="w-4 h-4 shrink-0" />
              <span>Calendar</span>
            </NavLink>

            {showReports && (
              <NavLink
                to="/reports"
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-sidebar-active text-sidebar-text-active shadow-sm'
                      : 'text-sidebar-text hover:bg-slate-800/60 hover:text-white'
                  }`
                }
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span>Reports</span>
              </NavLink>
            )}
          </nav>
        </div>

        {/* DOMAIN MODULES (Role-Specific) */}
        {(showProperties || showProjects || showAssets || showInvoices) && (
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              Domain Modules
            </div>
            <nav className="space-y-1">
              {showProperties && (
                <NavLink
                  to="/properties"
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-sidebar-active text-sidebar-text-active shadow-sm'
                        : 'text-sidebar-text hover:bg-slate-800/60 hover:text-white'
                    }`
                  }
                >
                  <Building className="w-4 h-4 shrink-0" />
                  <span>Properties</span>
                </NavLink>
              )}

              {showProjects && (
                <NavLink
                  to="/projects"
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-sidebar-active text-sidebar-text-active shadow-sm'
                        : 'text-sidebar-text hover:bg-slate-800/60 hover:text-white'
                    }`
                  }
                >
                  <FolderKanban className="w-4 h-4 shrink-0" />
                  <span>Projects</span>
                </NavLink>
              )}

              {showAssets && (
                <NavLink
                  to="/assets"
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-sidebar-active text-sidebar-text-active shadow-sm'
                        : 'text-sidebar-text hover:bg-slate-800/60 hover:text-white'
                    }`
                  }
                >
                  <Wrench className="w-4 h-4 shrink-0" />
                  <span>Assets</span>
                </NavLink>
              )}

              {showInvoices && (
                <NavLink
                  to="/invoices"
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-sidebar-active text-sidebar-text-active shadow-sm'
                        : 'text-sidebar-text hover:bg-slate-800/60 hover:text-white'
                    }`
                  }
                >
                  <Receipt className="w-4 h-4 shrink-0" />
                  <span>Invoices & Finance</span>
                </NavLink>
              )}
            </nav>
          </div>
        )}

        {/* SYSTEM MENU */}
        {(showUsers || showSettings) && (
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2">
              System
            </div>
            <nav className="space-y-1">
              {showUsers && (
                <NavLink
                  to="/users"
                  className={({ isActive }) =>
                    `flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-sidebar-active text-sidebar-text-active shadow-sm'
                        : 'text-sidebar-text hover:bg-slate-800/60 hover:text-white'
                    }`
                  }
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Users</span>
                </NavLink>
              )}

              {showSettings && (
                <button
                  type="button"
                  onClick={() => onOpenSettings && onOpenSettings()}
                  className="w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-xs font-semibold text-sidebar-text hover:bg-slate-800/60 hover:text-white transition-all text-left"
                >
                  <Settings className="w-4 h-4 shrink-0" />
                  <span>Settings</span>
                </button>
              )}
            </nav>
          </div>
        )}

        {/* Quote / Tip Card matching reference */}
        <div className="bg-[#13375e] p-3 rounded-xl border border-slate-700/60 mt-4">
          <Quote className="w-4 h-4 text-blue-300 mb-1 opacity-70" />
          <p className="text-[11px] text-slate-200 italic font-medium leading-relaxed">
            "{quotes[quoteIndex].text}"
          </p>
          <span className="text-[10px] text-slate-400 block mt-1 font-sans">
            — {quotes[quoteIndex].author}
          </span>
        </div>
      </div>

      {/* User Card Pinned to Bottom */}
      <div className="p-3 bg-[#071F38] border-t border-slate-700/50">
        <div className="flex items-center space-x-2.5 mb-2.5">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center border border-blue-400">
              {user.fullName.split(' ').map((n) => n[0]).join('').substring(0, 2)}
            </div>
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full absolute bottom-0 right-0 border-2 border-[#071F38]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-white truncate leading-tight">{user.fullName}</div>
            <div className="text-[10px] text-blue-300 truncate font-semibold uppercase tracking-wider">
              {user.role.replace('_', ' ')}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-1.5 py-1.5 bg-slate-800/80 hover:bg-rose-900/60 hover:text-rose-200 text-slate-300 rounded-md text-xs font-medium transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};
