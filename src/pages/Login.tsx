import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, Eye, EyeOff, ShieldCheck, Building2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';

const demoAccounts: { role: Role; title: string; email: string }[] = [
  { role: 'SUPER_ADMIN', title: 'Super Admin', email: 'superadmin@acme.com' },
  { role: 'COMPANY_ADMIN', title: 'Company Admin', email: 'admin@acme.com' },
  { role: 'PROPERTY_MANAGER', title: 'Property Manager', email: 'property@acme.com' },
  { role: 'PROJECT_MANAGER', title: 'Project Manager', email: 'project@acme.com' },
  { role: 'FACILITIES_MANAGER', title: 'Facilities Manager', email: 'facilities@acme.com' },
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
    <div className="min-h-screen flex bg-slate-100 font-sans">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0B2A4A] text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Soft Background circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="relative z-10 flex items-center space-x-3">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-lg">
            <Building2 className="w-7 h-7 text-[#0B2A4A]" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Your Company Name</h2>
            <p className="text-xs text-blue-200 font-medium">Task Monitoring System</p>
          </div>
        </div>

        <div className="relative z-10 my-auto max-w-lg space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-blue-500/20 rounded-full border border-blue-400/30 text-blue-200 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>Enterprise Multi-Role Platform</span>
          </div>

          <h1 className="text-4xl font-extrabold leading-tight text-white">
            Streamline Operations Across All Facilities & Projects
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed">
            Real-time multi-role task tracking, automated due status indicators, role-aware dashboards, and aggregated analytics designed for modern organizations.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">8 RBAC Roles</h4>
                <p className="text-[11px] text-slate-400">Strict server & client guards</p>
              </div>
            </div>

            <div className="p-3 bg-white/5 rounded-xl border border-white/10 flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Live Color Themes</h4>
                <p className="text-[11px] text-slate-400">White-label ready branding</p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400 border-t border-slate-700/50 pt-4">
          © 2026 Task Monitoring System • Production Replica Edition
        </div>
      </div>

      {/* Right Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12 bg-white">
        <div className="w-full max-w-md space-y-6">
          <div className="space-y-2">
            <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-full uppercase tracking-wider">
              Secure Access
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome Back
            </h2>
            <p className="text-xs text-slate-500">
              Sign in with your authorized credentials to access your dashboard.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Username or Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-medium"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-semibold"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[#123C73] hover:bg-[#0e2f5c] text-white rounded-lg font-bold text-sm shadow-lg shadow-blue-900/20 transition-all disabled:opacity-50 mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Demo Accounts Selection Box */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
              <span>Quick Demo Sign-In (Select Role):</span>
              <span className="text-slate-400 font-normal">Pass: password123</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickFill(acc.email)}
                  className={`text-left p-1.5 rounded text-[11px] font-semibold border transition-all ${
                    email === acc.email
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-300'
                  }`}
                >
                  <div className="truncate">{acc.title}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="text-center text-[11px] text-slate-400">
            Authorized personnel only • Secure access
          </div>
        </div>
      </div>
    </div>
  );
};
