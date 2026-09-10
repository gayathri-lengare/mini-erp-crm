import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  Search,
  Plus,
  Eye,
  CheckCircle2,
  Clock,
  XCircle,
  Building2,
  Calendar,
} from 'lucide-react';
import { challanService } from '../services/challan.service';
import { Challan, PaginatedResult } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Pagination } from '../components/common/Pagination';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export const ChallansPage: React.FC = () => {
  const [data, setData] = useState<PaginatedResult<Challan>>({
    items: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const { error } = useToast();
  const { hasRole } = useAuth();
  const canCreate = hasRole('ADMIN', 'SALES');

  const fetchChallans = useCallback(async () => {
    try {
      setLoading(true);
      const res = await challanService.getChallans({
        page,
        limit: 10,
        search: searchTerm,
        status: statusFilter,
      });
      setData(res);
    } catch (err: any) {
      error('Failed to load challans.');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter, error]);

  useEffect(() => {
    fetchChallans();
  }, [fetchChallans]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileSpreadsheet className="w-6 h-6 text-teal-600" />
            Sales Challans & Dispatch
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Formal delivery challans, product snapshots, and inventory dispatch confirmations.
          </p>
        </div>

        {canCreate && (
          <Link to="/challans/new">
            <Button leftIcon={<Plus className="w-4 h-4" />}>Create New Challan</Button>
          </Link>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by challan number (e.g. CH-2026-0001), customer name, or business..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Status Filter */}
        <div className="w-full md:w-48">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">DRAFT (Inventory Reserved)</option>
            <option value="CONFIRMED">CONFIRMED (Stock Deducted)</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Challans Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <Loader message="Loading sales challans..." />
        ) : data.items.length === 0 ? (
          <EmptyState
            title="No challans found"
            description="Create your first sales challan to initiate order delivery and dispatch."
            actionLabel={canCreate ? 'Create Challan' : undefined}
            onAction={() => (window.location.href = '/challans/new')}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Challan Number</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4 text-center">Total Quantity</th>
                  <th className="py-3.5 px-4 text-right">Total Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Created By</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((ch) => (
                  <tr key={ch.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/challans/${ch.id}`}
                        className="font-bold text-teal-700 hover:text-teal-900 transition flex items-center gap-1.5"
                      >
                        {ch.challan_number}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block truncate max-w-[180px]">
                        {ch.customer_name}
                      </span>
                      {ch.business_name && (
                        <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 truncate max-w-[180px]">
                          <Building2 className="w-3 h-3 text-slate-400" /> {ch.business_name}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-md text-xs">
                        {ch.total_quantity} pcs
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(ch.total_amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
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
                        {ch.status === 'CONFIRMED' && <CheckCircle2 className="w-3 h-3 mr-1 inline" />}
                        {ch.status === 'DRAFT' && <Clock className="w-3 h-3 mr-1 inline" />}
                        {ch.status === 'CANCELLED' && <XCircle className="w-3 h-3 mr-1 inline" />}
                        {ch.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 font-medium">
                      {ch.created_by_name || 'Sales Staff'}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      {formatDateTime(ch.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link to={`/challans/${ch.id}`}>
                        <Button variant="outline" size="sm" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                          View
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={data.pagination.page}
          totalPages={data.pagination.totalPages}
          totalItems={data.pagination.total}
          limit={data.pagination.limit}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>
    </div>
  );
};
