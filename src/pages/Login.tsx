import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

const demoAccounts: { role: Role; title: string; email: string }[] = [
  { role: 'SUPER_ADMIN', title: 'Super Admin', email: 'superadmin@acme.com' },
  { role: 'COMPANY_ADMIN', title: 'Company Admin', email: 'admin@acme.com' },
  { role: 'PROPERTY_MANAGER', title: 'Property Mgr', email: 'property@acme.com' },
  { role: 'PROJECT_MANAGER', title: 'Project Mgr', email: 'project@acme.com' },
  { role: 'FACILITIES_MANAGER', title: 'Facilities Mgr', email: 'facilities@acme.com' },
  { role: 'FINANCE_OFFICER', title: 'Finance Officer', email: 'finance@acme.com' },
  { role: 'STAFF', title: 'Staff User', email: 'staff@acme.com' },
  { role: 'CONTRACTOR_TENANT', title: 'Contractor', email: 'contractor@acme.com' },
];

export const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@acme.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid login credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (accountEmail: string) => {
    setEmail(accountEmail);
    setPassword('password123');
  };

  return (
    <div className="min-h-screen flex font-sans" style={{ background: '#e8edf2' }}>
      {/* Left — Dark Brand Panel */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col items-center justify-center relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0B2A4A 0%, #123C73 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #60a5fa, transparent)' }} />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 rounded-full opacity-10"
          style={{ background: 'radial-gradient(circle, #93c5fd, transparent)' }} />

        <div className="relative z-10 flex flex-col items-center text-center px-10 space-y-6">
          {/* Company Logo Circle */}
          <div className="w-28 h-28 rounded-full bg-white flex items-center justify-center shadow-2xl border-4 border-white/30">
            <Building2 className="w-14 h-14 text-[#123C73]" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight">
              Task Monitoring System
            </h1>
            <p className="text-base font-bold text-blue-300 uppercase tracking-widest">
              Your Company Name
            </p>
            <p className="text-sm text-slate-300 leading-relaxed max-w-xs">
              Track, assign, and monitor employee tasks in real-time
            </p>
          </div>
        </div>
      </div>

      {/* Right — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white">
        <div className="w-full max-w-sm space-y-6">
          {/* Secure Access badge */}
          <div className="space-y-2">
            <div className="inline-block px-4 py-1.5 border border-slate-300 rounded-full text-[11px] font-bold text-slate-600 uppercase tracking-widest">
              Secure Access
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h2>
            <p className="text-sm text-slate-500">
              Sign in to continue to the Task Monitoring System.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username / Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Username / Email
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your username or email"
                  className="w-full pl-9 pr-3 py-3 border-2 border-blue-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-9 pr-14 py-3 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-blue-600 hover:text-blue-800"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-bold text-sm text-white transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(90deg, #123C73, #1B4B82)' }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo */}
          <div className="border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider flex justify-between">
              <span>Quick Demo Access</span>
              <span className="text-slate-400 font-normal">Pass: password123</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickFill(acc.email)}
                  className={`text-left px-2 py-1.5 rounded text-[11px] font-semibold border transition-all ${
                    email === acc.email
                      ? 'bg-[#123C73] text-white border-[#123C73]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                >
                  {acc.title}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 flex flex-col items-center justify-center space-y-1 text-center">
            <p className="text-[11px] text-slate-500 font-semibold">
              © T-Tech Solution
            </p>
            <p className="text-[10px] text-slate-400">
              Authorized personnel only • Secure Task Monitoring access
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
