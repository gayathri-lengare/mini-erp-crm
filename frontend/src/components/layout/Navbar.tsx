import React from 'react';
import { Menu, Bell, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../common/Badge';

interface NavbarProps {
  onOpenMobileSidebar: () => void;
  pageTitle?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileSidebar, pageTitle }) => {
  const { user } = useAuth();

  const roleColorMap: Record<string, 'teal' | 'purple' | 'info' | 'warning' | 'neutral'> = {
    ADMIN: 'purple',
    SALES: 'teal',
    WAREHOUSE: 'warning',
    ACCOUNTS: 'info',
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile hamburger & title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight">
              {pageTitle || 'Operations Portal'}
            </h2>
          </div>
        </div>

        {/* Right: Notifications & User profile */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Notification bell */}
          <div className="relative p-2 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition cursor-pointer">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-teal-500 rounded-full ring-2 ring-white animate-pulse" />
          </div>

          <div className="h-6 w-px bg-slate-200 hidden sm:block" />

          {/* User profile pill */}
          {user && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="hidden sm:block text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-900 leading-none">
                    {user.name}
                  </span>
                  <Badge variant={roleColorMap[user.role] || 'neutral'} size="sm">
                    {user.role}
                  </Badge>
                </div>
                <span className="text-xs text-slate-500 block mt-0.5">{user.email}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
