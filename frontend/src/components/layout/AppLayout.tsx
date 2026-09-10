import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

export const AppLayout: React.FC = () => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = (pathname: string): string => {
    if (pathname === '/dashboard') return 'Executive Dashboard';
    if (pathname.startsWith('/customers')) return 'Customer CRM & Follow-ups';
    if (pathname.startsWith('/products')) return 'Product Catalog & Inventory';
    if (pathname.startsWith('/stock-movements')) return 'Stock Movement Audit Ledger';
    if (pathname.startsWith('/challans/new')) return 'Create Sales Challan';
    if (pathname.startsWith('/challans')) return 'Sales Challans & Dispatch';
    if (pathname.startsWith('/users')) return 'System User Administration';
    return 'Operations Portal';
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-y-auto">
        <Navbar
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          pageTitle={getPageTitle(location.pathname)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
