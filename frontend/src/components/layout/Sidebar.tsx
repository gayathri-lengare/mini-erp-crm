import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Package,
  Boxes,
  ArrowLeftRight,
  FileSpreadsheet,
  UserCog,
  LogOut,
  X,
  Warehouse,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Badge } from '../common/Badge';

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { user, logout, hasRole } = useAuth();

  // Define navigation items with role restrictions
  const navItems = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      show: true, // Everyone can view dashboard
    },
    {
      label: 'Customers',
      path: '/customers',
      icon: Users,
      show: hasRole('ADMIN', 'SALES', 'ACCOUNTS'),
    },
    {
      label: 'Products',
      path: '/products',
      icon: Package,
      show: true, // Everyone can view products catalog
    },
    {
      label: 'Inventory Alerts',
      path: '/products?low_stock=true',
      icon: Boxes,
      show: hasRole('ADMIN', 'WAREHOUSE'),
    },
    {
      label: 'Stock Movements',
      path: '/stock-movements',
      icon: ArrowLeftRight,
      show: hasRole('ADMIN', 'WAREHOUSE'),
    },
    {
      label: 'Sales Challans',
      path: '/challans',
      icon: FileSpreadsheet,
      show: true, // ADMIN, SALES, WAREHOUSE, ACCOUNTS can view challans
    },
    {
      label: 'Portal Users',
      path: '/users',
      icon: UserCog,
      show: hasRole('ADMIN'),
    },
  ];

  const roleColorMap: Record<string, 'teal' | 'purple' | 'info' | 'warning' | 'neutral'> = {
    ADMIN: 'purple',
    SALES: 'teal',
    WAREHOUSE: 'warning',
    ACCOUNTS: 'info',
  };

  const content = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300 w-64 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-400 font-bold">
            <Warehouse className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-white text-base leading-tight">ApexFlow ERP</h1>
            <p className="text-[11px] text-slate-400 font-medium">Operations Portal</p>
          </div>
        </div>
        {/* Mobile close button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* User Mini Card */}
      {user && (
        <div className="px-4 py-3 m-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
          <div className="flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs font-semibold text-white truncate">{user.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          <div className="mt-2">
            <Badge variant={roleColorMap[user.role] || 'neutral'} size="sm">
              {user.role}
            </Badge>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Menu
        </div>
        {navItems
          .filter((item) => item.show)
          .map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-900/30'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
      </nav>

      {/* Logout Footer */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={() => {
            onCloseMobile();
            logout();
          }}
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-all"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden lg:flex lg:flex-shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative flex flex-col w-64 max-w-xs h-full z-10 shadow-2xl">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
