import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Package,
  AlertTriangle,
  FileText,
  CheckCircle2,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Boxes,
  Plus,
} from 'lucide-react';
import { dashboardService } from '../services/dashboard.service';
import { DashboardStats } from '../types';
import { Loader } from '../components/common/Loader';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import { useAuth } from '../hooks/useAuth';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { hasRole } = useAuth();

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true);
        const data = await dashboardService.getStats();
        setStats(data);
      } catch (err: any) {
        setErrorMsg('Failed to load dashboard metrics.');
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  if (loading) {
    return <Loader message="Compiling executive metrics..." />;
  }

  if (errorMsg || !stats) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-rose-200 text-rose-700">
        <p className="font-semibold">{errorMsg || 'Unable to load dashboard'}</p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      link: '/customers',
      show: hasRole('ADMIN', 'SALES', 'ACCOUNTS'),
    },
    {
      title: 'Active Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      link: '/products',
      show: true,
    },
    {
      title: 'Low Stock Alerts',
      value: stats.lowStockProductsCount,
      icon: AlertTriangle,
      color: stats.lowStockProductsCount > 0 ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-700 border-slate-200',
      link: '/products?low_stock=true',
      show: hasRole('ADMIN', 'WAREHOUSE'),
    },
    {
      title: 'Draft Challans',
      value: stats.draftChallansCount,
      icon: FileText,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      link: '/challans?status=DRAFT',
      show: true,
    },
    {
      title: 'Confirmed Challans',
      value: stats.confirmedChallansCount,
      icon: CheckCircle2,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      link: '/challans?status=CONFIRMED',
      show: true,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner with Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-teal-900 to-slate-900 p-6 rounded-2xl text-white shadow-lg">
        <div>
          <h2 className="text-xl font-bold">Wholesale Operations Overview</h2>
          <p className="text-xs text-teal-200 mt-1">
            Real-time synchronization between CRM leads, inventory stock levels, and dispatch challans.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {hasRole('ADMIN', 'SALES') && (
            <Link to="/challans/new">
              <Button
                variant="primary"
                size="sm"
                className="bg-teal-500 hover:bg-teal-400 text-slate-900 font-semibold"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                New Challan
              </Button>
            </Link>
          )}
          {hasRole('ADMIN', 'SALES') && (
            <Link to="/customers">
              <Button
                variant="outline"
                size="sm"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20"
                leftIcon={<Users className="w-4 h-4" />}
              >
                CRM Leads
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* 5 Primary Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards
          .filter((c) => c.show)
          .map((card, idx) => {
            const Icon = card.icon;
            return (
              <Link
                key={idx}
                to={card.link}
                className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {card.title}
                  </span>
                  <div className={`p-2 rounded-xl border ${card.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {card.value}
                  </span>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-600 transform group-hover:translate-x-1 transition" />
                </div>
              </Link>
            );
          })}
      </div>

      {/* Main Grid: Recent Challans & Low Stock Alert */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Challans (2 columns) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Sales Challans</h3>
              <p className="text-xs text-slate-500">Latest wholesale orders and fulfillment status</p>
            </div>
            <Link
              to="/challans"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              View All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats.recentChallans.length === 0 ? (
            <p className="text-sm text-slate-400 py-6 text-center">No challans generated yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="pb-3">Challan #</th>
                    <th className="pb-3">Customer</th>
                    <th className="pb-3 text-center">Qty</th>
                    <th className="pb-3 text-right">Amount</th>
                    <th className="pb-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.recentChallans.map((ch) => (
                    <tr key={ch.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 font-semibold text-teal-700">
                        <Link to={`/challans/${ch.id}`}>{ch.challan_number}</Link>
                      </td>
                      <td className="py-3 text-slate-700 font-medium truncate max-w-[140px]">
                        {ch.customer_name}
                      </td>
                      <td className="py-3 text-center font-semibold text-slate-800">
                        {ch.total_quantity}
                      </td>
                      <td className="py-3 text-right font-medium text-slate-900">
                        {formatCurrency(ch.total_amount)}
                      </td>
                      <td className="py-3 text-center">
                        <Badge
                          variant={
                            ch.status === 'CONFIRMED'
                              ? 'success'
                              : ch.status === 'DRAFT'
                              ? 'warning'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {ch.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Low Stock Warning Box (1 column) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-bold text-slate-900">Low Stock Alert</h3>
              </div>
              <Badge variant="danger" size="sm">
                {stats.lowStockProducts.length} Items
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              Products at or below their defined minimum inventory threshold.
            </p>

            {stats.lowStockProducts.length === 0 ? (
              <div className="py-8 text-center text-emerald-600 bg-emerald-50 rounded-xl">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500" />
                <p className="text-xs font-semibold">Inventory levels healthy!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-xl border border-rose-100 bg-rose-50/40 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800 truncate max-w-[160px]">
                        {p.product_name}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        SKU: <span className="font-mono">{p.sku}</span> • {p.warehouse_location || 'Main Bay'}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-rose-600">
                        {p.current_stock}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        Min: {p.minimum_stock}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100">
            <Link to="/products?low_stock=true">
              <Button variant="outline" size="sm" className="w-full">
                View Full Inventory Status
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Stock Movements Audit Trail */}
      {hasRole('ADMIN', 'WAREHOUSE') && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Boxes className="w-5 h-5 text-teal-600" />
                Recent Stock Movements (Audit Ledger)
              </h3>
              <p className="text-xs text-slate-500">
                Immutable record of every IN and OUT transaction across all warehouse locations.
              </p>
            </div>
            <Link
              to="/stock-movements"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              Full Ledger <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Product</th>
                  <th className="pb-3">SKU</th>
                  <th className="pb-3 text-center">Type</th>
                  <th className="pb-3 text-center">Quantity</th>
                  <th className="pb-3">Reason</th>
                  <th className="pb-3">Logged By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stats.recentStockMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 text-xs text-slate-500">{formatDateTime(m.created_at)}</td>
                    <td className="py-3 font-medium text-slate-800">{m.product_name}</td>
                    <td className="py-3 font-mono text-xs text-slate-500">{m.sku}</td>
                    <td className="py-3 text-center">
                      <Badge
                        variant={m.movement_type === 'IN' ? 'teal' : 'purple'}
                        size="sm"
                      >
                        {m.movement_type === 'IN' ? (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> IN
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <TrendingDown className="w-3 h-3" /> OUT
                          </span>
                        )}
                      </Badge>
                    </td>
                    <td className="py-3 text-center font-bold text-slate-900">
                      {m.movement_type === 'IN' ? `+${m.quantity_changed}` : `-${m.quantity_changed}`}
                    </td>
                    <td className="py-3 text-xs text-slate-600 truncate max-w-[200px]">{m.reason}</td>
                    <td className="py-3 text-xs text-slate-500">{m.created_by_name || 'System'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
