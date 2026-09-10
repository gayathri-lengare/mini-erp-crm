import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  Search,
  Plus,
  Edit2,
  AlertTriangle,
  Building,
  CheckCircle2,
  Boxes,
} from 'lucide-react';
import { productService } from '../services/product.service';
import { PaginatedResult, Product } from '../types';
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
import { formatCurrency } from '../utils/formatters';

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialLowStock = searchParams.get('low_stock') === 'true';

  const [data, setData] = useState<PaginatedResult<Product>>({
    items: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [lowStockFilter, setLowStockFilter] = useState(initialLowStock);
  const [page, setPage] = useState(1);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    product_name: '',
    sku: '',
    category: '',
    unit_price: '',
    current_stock: '',
    minimum_stock: '',
    warehouse_location: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const { success, error } = useToast();
  const { hasRole } = useAuth();
  const canModify = hasRole('ADMIN', 'WAREHOUSE');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await productService.getProducts({
        page,
        limit: 10,
        search: searchTerm,
        category: categoryFilter,
        low_stock: lowStockFilter,
      });
      setData(res);
    } catch (err: any) {
      error('Failed to load products catalogue.');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, categoryFilter, lowStockFilter, error]);

  useEffect(() => {
    productService.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedProductId(null);
    setFormData({
      product_name: '',
      sku: '',
      category: categories[0] || 'Electronics',
      unit_price: '',
      current_stock: '0',
      minimum_stock: '5',
      warehouse_location: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setModalMode('edit');
    setSelectedProductId(p.id);
    setFormData({
      product_name: p.product_name,
      sku: p.sku,
      category: p.category,
      unit_price: String(p.unit_price),
      current_stock: String(p.current_stock),
      minimum_stock: String(p.minimum_stock),
      warehouse_location: p.warehouse_location || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.product_name.trim()) errs.product_name = 'Product name is required';
    if (!formData.sku.trim()) errs.sku = 'SKU is required';
    if (!formData.category.trim()) errs.category = 'Category is required';
    const price = parseFloat(formData.unit_price);
    if (isNaN(price) || price < 0) errs.unit_price = 'Price must be a valid non-negative number';
    const minStock = parseInt(formData.minimum_stock, 10);
    if (isNaN(minStock) || minStock < 0) errs.minimum_stock = 'Minimum stock must be 0 or higher';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      const payload: Partial<Product> = {
        product_name: formData.product_name.trim(),
        sku: formData.sku.trim().toUpperCase(),
        category: formData.category.trim(),
        unit_price: parseFloat(formData.unit_price),
        minimum_stock: parseInt(formData.minimum_stock, 10),
        warehouse_location: formData.warehouse_location.trim() || null,
      };

      if (modalMode === 'create') {
        payload.current_stock = parseInt(formData.current_stock, 10) || 0;
        await productService.createProduct(payload);
        success('Product registered in inventory successfully!');
      } else if (selectedProductId) {
        await productService.updateProduct(selectedProductId, payload);
        success('Product details updated successfully!');
      }

      setIsModalOpen(false);
      fetchProducts();
      productService.getCategories().then(setCategories).catch(() => {});
    } catch (err: any) {
      error(err.response?.data?.message || 'Error saving product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-teal-600" />
            Product Catalog & Inventory
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Centralized product master with live warehouse stock tracking and minimum reserve alerts.
          </p>
        </div>

        {canModify && (
          <Button onClick={handleOpenCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
            Register New Product
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by product name, SKU, category, or bay location..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-44">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Low Stock Toggle Pill */}
        <button
          onClick={() => {
            const next = !lowStockFilter;
            setLowStockFilter(next);
            setSearchParams(next ? { low_stock: 'true' } : {});
            setPage(1);
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
            lowStockFilter
              ? 'bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-200/50'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle className={`w-3.5 h-3.5 ${lowStockFilter ? 'text-rose-600' : 'text-slate-400'}`} />
          <span>Low Stock Alerts</span>
        </button>
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <Loader message="Querying live product inventory..." />
        ) : data.items.length === 0 ? (
          <EmptyState
            title="No products found"
            description="No items match your selected filter criteria."
            actionLabel={canModify ? 'Add Product' : undefined}
            onAction={canModify ? handleOpenCreateModal : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">SKU / Code</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-right">Unit Price</th>
                  <th className="py-3.5 px-4 text-center">Current Stock</th>
                  <th className="py-3.5 px-4 text-center">Min Stock</th>
                  <th className="py-3.5 px-4">Warehouse Location</th>
                  <th className="py-3.5 px-4 text-center">Stock Status</th>
                  {canModify && <th className="py-3.5 px-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((p) => {
                  const isLow = p.current_stock <= p.minimum_stock;
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 transition ${isLow ? 'bg-rose-50/20' : ''}`}
                    >
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 block">{p.product_name}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {p.sku}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-xs text-slate-600 font-medium">{p.category}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                        {formatCurrency(p.unit_price)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-base font-extrabold ${
                            isLow ? 'text-rose-600' : 'text-slate-800'
                          }`}
                        >
                          {p.current_stock}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center text-xs text-slate-500 font-medium">
                        {p.minimum_stock}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.warehouse_location || 'Unassigned'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isLow ? (
                          <Badge variant="danger" size="sm" className="gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm" className="gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Sufficient
                          </Badge>
                        )}
                      </td>
                      {canModify && (
                        <td className="py-3.5 px-4 text-right">
                          <button
                            title="Edit Product Details"
                            onClick={() => handleOpenEditModal(p)}
                            className="p-1.5 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
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

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Register New Product' : 'Edit Product Details'}
        maxWidth="lg"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleFormSubmit} isLoading={submitting}>
              {modalMode === 'create' ? 'Register Product' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Product Name"
            required
            placeholder="e.g. Industrial Barcode Scanner 2D"
            value={formData.product_name}
            onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
            error={formErrors.product_name}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="SKU Code"
              required
              placeholder="e.g. SCAN-2D-001"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
              error={formErrors.sku}
            />

            <Input
              label="Category"
              required
              placeholder="e.g. Electronics"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              error={formErrors.category}
            />

            <Input
              label="Unit Price (INR ₹)"
              required
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.unit_price}
              onChange={(e) => setFormData({ ...formData, unit_price: e.target.value })}
              error={formErrors.unit_price}
            />

            <Input
              label="Minimum Alert Quantity"
              required
              type="number"
              placeholder="5"
              value={formData.minimum_stock}
              onChange={(e) => setFormData({ ...formData, minimum_stock: e.target.value })}
              error={formErrors.minimum_stock}
            />

            {modalMode === 'create' && (
              <Input
                label="Initial Opening Stock"
                type="number"
                placeholder="0"
                value={formData.current_stock}
                onChange={(e) => setFormData({ ...formData, current_stock: e.target.value })}
                helperText="Initial stock intake movement will be automatically recorded."
              />
            )}

            <Input
              label="Warehouse / Bay Location"
              placeholder="e.g. Bay A-101"
              value={formData.warehouse_location}
              onChange={(e) => setFormData({ ...formData, warehouse_location: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
