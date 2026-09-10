import React, { useEffect, useState, useCallback } from 'react';
import {
  ArrowLeftRight,
  Plus,
  TrendingDown,
  TrendingUp,
  Package,
} from 'lucide-react';
import { stockService } from '../services/stock.service';
import { productService } from '../services/product.service';
import { MovementType, PaginatedResult, Product, StockMovement } from '../types';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Pagination } from '../components/common/Pagination';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { formatDateTime } from '../utils/formatters';

export const StockMovementsPage: React.FC = () => {
  const [data, setData] = useState<PaginatedResult<StockMovement>>({
    items: [],
    pagination: { total: 0, page: 1, limit: 15, totalPages: 1 },
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedProduct, setSelectedProduct] = useState<string>('ALL');
  const [movementType, setMovementType] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Manual Adjustment Modal
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustFormData, setAdjustFormData] = useState({
    product_id: '',
    quantity: '1',
    movement_type: 'IN' as MovementType,
    reason: '',
  });
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  const { success, error } = useToast();
  const { hasRole } = useAuth();
  const canAdjust = hasRole('ADMIN', 'WAREHOUSE');

  const fetchMovements = useCallback(async () => {
    try {
      setLoading(true);
      const res = await stockService.getStockMovements({
        page,
        limit: 15,
        product_id: selectedProduct !== 'ALL' ? parseInt(selectedProduct, 10) : undefined,
        movement_type: movementType !== 'ALL' ? (movementType as MovementType) : undefined,
        start_date: startDate || undefined,
        end_date: endDate ? `${endDate}T23:59:59Z` : undefined,
      });
      setData(res);
    } catch (err: any) {
      error('Failed to load stock movements.');
    } finally {
      setLoading(false);
    }
  }, [page, selectedProduct, movementType, startDate, endDate, error]);

  useEffect(() => {
    productService
      .getProducts({ limit: 100 })
      .then((res) => setProducts(res.items))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustFormData.product_id) {
      error('Please select a product.');
      return;
    }
    const qty = parseInt(adjustFormData.quantity, 10);
    if (isNaN(qty) || qty <= 0) {
      error('Quantity must be greater than zero.');
      return;
    }
    if (!adjustFormData.reason.trim()) {
      error('Reason for inventory movement is required.');
      return;
    }

    try {
      setSubmittingAdjust(true);
      await stockService.adjustStock({
        product_id: parseInt(adjustFormData.product_id, 10),
        quantity: qty,
        movement_type: adjustFormData.movement_type,
        reason: adjustFormData.reason.trim(),
      });

      success('Inventory movement recorded and stock balance updated successfully!');
      setIsAdjustModalOpen(false);
      setAdjustFormData({
        product_id: '',
        quantity: '1',
        movement_type: 'IN',
        reason: '',
      });
      fetchMovements();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to adjust stock.');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-teal-600" />
            Stock Movement Audit Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time, immutable transaction log of all warehouse intake, returns, and sales dispatches.
          </p>
        </div>

        {canAdjust && (
          <Button
            onClick={() => {
              if (products.length > 0 && !adjustFormData.product_id) {
                setAdjustFormData((prev) => ({ ...prev, product_id: String(products[0].id) }));
              }
              setIsAdjustModalOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Manual Stock Intake / Adjustment
          </Button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Filter by Product */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Product
          </label>
          <select
            value={selectedProduct}
            onChange={(e) => {
              setSelectedProduct(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="ALL">All Products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.product_name} ({p.sku})
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Movement Type */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Movement Type
          </label>
          <select
            value={movementType}
            onChange={(e) => {
              setMovementType(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="ALL">All Types (IN & OUT)</option>
            <option value="IN">IN (Warehouse Intake)</option>
            <option value="OUT">OUT (Dispatched / Confirmed)</option>
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          />
        </div>
      </div>

      {/* Movements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <Loader message="Loading movement audit logs..." />
        ) : data.items.length === 0 ? (
          <EmptyState
            title="No stock movements found"
            description="No inventory transactions recorded matching your selected filters."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">SKU Code</th>
                  <th className="py-3.5 px-4 text-center">Type</th>
                  <th className="py-3.5 px-4 text-center">Quantity</th>
                  <th className="py-3.5 px-4">Reason / Reference</th>
                  <th className="py-3.5 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-500">
                      {formatDateTime(m.created_at)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">{m.product_name}</td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-600">
                      <span className="bg-slate-100 px-2 py-0.5 rounded">{m.sku}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge
                        variant={m.movement_type === 'IN' ? 'teal' : 'purple'}
                        size="sm"
                      >
                        {m.movement_type === 'IN' ? (
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3.5 h-3.5" /> IN
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <TrendingDown className="w-3.5 h-3.5" /> OUT
                          </span>
                        )}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-extrabold text-sm ${
                          m.movement_type === 'IN' ? 'text-teal-700' : 'text-purple-700'
                        }`}
                      >
                        {m.movement_type === 'IN' ? `+${m.quantity_changed}` : `-${m.quantity_changed}`}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700 max-w-xs">{m.reason}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500 font-medium">
                      {m.created_by_name || 'System'}
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

      {/* Manual Stock Adjustment Modal */}
      <Modal
        isOpen={isAdjustModalOpen}
        onClose={() => setIsAdjustModalOpen(false)}
        title="Record Stock Movement (Intake / Adjustment)"
        maxWidth="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdjustModalOpen(false)}
              disabled={submittingAdjust}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleAdjustSubmit} isLoading={submittingAdjust}>
              Record Movement
            </Button>
          </>
        }
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Select Product <span className="text-rose-500">*</span>
            </label>
            <select
              value={adjustFormData.product_id}
              onChange={(e) => setAdjustFormData({ ...adjustFormData, product_id: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500"
              required
            >
              <option value="">Select a product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.product_name} (Stock: {p.current_stock})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Movement Type"
              options={[
                { value: 'IN', label: 'IN (Receive Stock)' },
                { value: 'OUT', label: 'OUT (Write-off / Manual Deduction)' },
              ]}
              value={adjustFormData.movement_type}
              onChange={(e) =>
                setAdjustFormData({
                  ...adjustFormData,
                  movement_type: e.target.value as MovementType,
                })
              }
            />

            <Input
              label="Quantity"
              type="number"
              min="1"
              required
              value={adjustFormData.quantity}
              onChange={(e) => setAdjustFormData({ ...adjustFormData, quantity: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Reason / Memo <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              placeholder="e.g. Vendor delivery PO-889, physical count adjustment, damaged item write-off..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500"
              value={adjustFormData.reason}
              onChange={(e) => setAdjustFormData({ ...adjustFormData, reason: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
