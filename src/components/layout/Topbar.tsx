import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  Shield,
  User,
  LogOut,
  ChevronDown,
  CheckCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileText,
  Trash2,
  Check,
} from 'lucide-react';
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

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'status' | 'overdue' | 'assignment' | 'invoice' | 'system';
}

const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Task Status Updated',
    message: 'Quarterly HVAC Chiller Maintenance moved to In Progress.',
    time: '5 mins ago',
    read: false,
    type: 'status',
  },
  {
    id: 'notif-2',
    title: 'New Task Assignment',
    message: 'Fire Alarm System Annual Inspection assigned to your operational team.',
    time: '1 hour ago',
    read: false,
    type: 'assignment',
  },
  {
    id: 'notif-3',
    title: 'Overdue Task Alert',
    message: 'Elevator Safety Certificate Renewal is past due date and requires attention.',
    time: '3 hours ago',
    read: false,
    type: 'overdue',
  },
  {
    id: 'notif-4',
    title: 'Invoice Audit Requested',
    message: 'Q3 Facility Maintenance Invoice Audit (INV-2026-001) needs review.',
    time: 'Yesterday',
    read: true,
    type: 'invoice',
  },
  {
    id: 'notif-5',
    title: 'Access Audit Completed',
    message: 'Access Card Audit & Tenant Removal task completed successfully.',
    time: '2 days ago',
    read: true,
    type: 'system',
  },
];

export const Topbar: React.FC = () => {
  const { user, switchRole, logout } = useAuth();
  const navigate = useNavigate();

  // Profile Dropdown state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Notification Popover state
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);

  // Unread Count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close popovers on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
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

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getNotifIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      case 'status':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'assignment':
        return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
      case 'invoice':
        return <FileText className="w-4 h-4 text-emerald-600" />;
      case 'system':
      default:
        return <CheckCheck className="w-4 h-4 text-purple-600" />;
    }
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
        {/* Quick Demo Role Switcher - Restricted to SUPER_ADMIN only */}
        {user.role === 'SUPER_ADMIN' && (
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
        )}

        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => {
              setNotifOpen(!notifOpen);
              setDropdownOpen(false);
            }}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-all cursor-pointer"
            title="Activity Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="min-w-[16px] h-4 px-1 bg-rose-500 text-white font-extrabold text-[10px] rounded-full absolute -top-0.5 -right-0.5 flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Activity Notifications Panel */}
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              {/* Header */}
              <div className="px-4 pb-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xs font-extrabold text-slate-900">Activity Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-full">
                      {unreadCount} New
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-medium">
                    No activity notifications.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-start space-x-3 ${
                        !n.read ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                        {getNotifIcon(n.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{n.title}</h4>
                          <span className="text-[10px] font-medium text-slate-400 shrink-0 ml-2">{n.time}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-snug">{n.message}</p>
                      </div>

                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <button
                    onClick={clearAllNotifications}
                    className="text-slate-400 hover:text-rose-600 font-medium transition-colors flex items-center space-x-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear notifications</span>
                  </button>
                  <Link
                    to="/dashboard"
                    onClick={() => setNotifOpen(false)}
                    className="font-bold text-blue-600 hover:underline"
                  >
                    View dashboard →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Pill with Dropdown */}
        <div className="relative border-l pl-3 border-slate-200" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => {
              setDropdownOpen(!dropdownOpen);
              setNotifOpen(false);
            }}
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
