import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Warehouse, LogIn, ShieldAlert, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { UserRole } from '../types';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!email || !password) {
      setFormError('Please enter both email and password.');
      return;
    }

    try {
      setIsLoading(true);
      const user = await login(email, password);
      success(`Welcome back, ${user.name} (${user.role})!`);
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setFormError(msg);
      error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string, role: UserRole) => {
    setEmail(demoEmail);
    setPassword('password123');
    setFormError(null);

    try {
      setIsLoading(true);
      const user = await login(demoEmail, 'password123');
      success(`Logged in as Demo ${role} (${user.name})`);
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Demo login failed.';
      setFormError(msg);
      error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-teal-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-400 mb-4 shadow-xl shadow-teal-500/10">
          <Warehouse className="w-8 h-8" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          ApexFlow Operations Portal
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Mini ERP + CRM for Wholesale & Distribution
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl shadow-2xl border border-slate-200/80">
          {formError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-sm">
              <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button
              type="submit"
              className="w-full mt-2"
              size="lg"
              isLoading={isLoading}
              leftIcon={<LogIn className="w-5 h-5" />}
            >
              Sign In to Portal
            </Button>
          </form>

          {/* Quick Demo Role Selector */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                One-Click Demo Roles
              </span>
              <span className="text-[11px] text-slate-400">password: password123</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@example.com', 'ADMIN')}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/80 text-purple-800 text-xs font-semibold transition text-left"
              >
                <UserCheck className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <div>
                  <div>Admin</div>
                  <div className="text-[10px] text-purple-600/70 font-normal truncate">Full Access</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('sales@example.com', 'SALES')}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-teal-200 bg-teal-50/60 hover:bg-teal-100/80 text-teal-800 text-xs font-semibold transition text-left"
              >
                <UserCheck className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <div>
                  <div>Sales Rep</div>
                  <div className="text-[10px] text-teal-600/70 font-normal truncate">CRM + Challans</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('warehouse@example.com', 'WAREHOUSE')}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/80 text-amber-800 text-xs font-semibold transition text-left"
              >
                <UserCheck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <div>
                  <div>Warehouse</div>
                  <div className="text-[10px] text-amber-600/70 font-normal truncate">Stock & Intake</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('accounts@example.com', 'ACCOUNTS')}
                className="flex items-center gap-2 p-2.5 rounded-xl border border-sky-200 bg-sky-50/60 hover:bg-sky-100/80 text-sky-800 text-xs font-semibold transition text-left"
              >
                <UserCheck className="w-4 h-4 text-sky-600 flex-shrink-0" />
                <div>
                  <div>Accounts</div>
                  <div className="text-[10px] text-sky-600/70 font-normal truncate">View Audit & Sales</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
