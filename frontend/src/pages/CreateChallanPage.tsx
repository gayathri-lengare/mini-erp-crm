import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Package,
} from 'lucide-react';
import { customerService } from '../services/customer.service';
import { productService } from '../services/product.service';
import { challanService } from '../services/challan.service';
import { Customer, Product } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Loader } from '../components/common/Loader';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../hooks/useToast';
import { formatCurrency } from '../utils/formatters';

interface ChallanLineItem {
  id: string; // client-side unique id for key
  product_id: number;
  product?: Product;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export const CreateChallanPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialCustomerId = searchParams.get('customerId');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(initialCustomerId || '');
  const [items, setItems] = useState<ChallanLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Confirm Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const navigate = useNavigate();
  const { success, error } = useToast();

  useEffect(() => {
    async function loadMasterData() {
      try {
        setLoading(true);
        const [custRes, prodRes] = await Promise.all([
          customerService.getCustomers({ limit: 100 }),
          productService.getProducts({ limit: 100 }),
        ]);
        setCustomers(custRes.items);
        setProducts(prodRes.items);

        // Pre-add one empty product row
        if (prodRes.items.length > 0) {
          const firstProd = prodRes.items[0];
          setItems([
            {
              id: Math.random().toString(),
              product_id: firstProd.id,
              product: firstProd,
              quantity: 1,
              unit_price: Number(firstProd.unit_price),
              total_price: Number(firstProd.unit_price),
            },
          ]);
        }
      } catch (err) {
        error('Failed to load customers or products list.');
      } finally {
        setLoading(false);
      }
    }
    loadMasterData();
  }, [error]);

  const handleProductChange = (lineId: string, productId: number) => {
    const selectedProd = products.find((p) => p.id === productId);
    if (!selectedProd) return;

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === lineId) {
          const unitPrice = Number(selectedProd.unit_price);
          return {
            ...item,
            product_id: productId,
            product: selectedProd,
            unit_price: unitPrice,
            total_price: unitPrice * item.quantity,
          };
        }
        return item;
      })
    );
  };

  const handleQuantityChange = (lineId: string, quantity: number) => {
    const qty = Math.max(1, isNaN(quantity) ? 1 : quantity);
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === lineId) {
          return {
            ...item,
            quantity: qty,
            total_price: item.unit_price * qty,
          };
        }
        return item;
      })
    );
  };

  const handleAddRow = () => {
    if (products.length === 0) return;
    const firstProd = products[0];
    const unitPrice = Number(firstProd.unit_price);
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        product_id: firstProd.id,
        product: firstProd,
        quantity: 1,
        unit_price: unitPrice,
        total_price: unitPrice,
      },
    ]);
  };

  const handleRemoveRow = (lineId: string) => {
    if (items.length <= 1) {
      error('Challan must have at least one product item.');
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== lineId));
  };

  // Calculations
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalAmount = items.reduce((sum, item) => sum + item.total_price, 0);

  const validateForm = () => {
    if (!selectedCustomerId) {
      error('Please select a customer for this challan.');
      return false;
    }
    if (items.length === 0) {
      error('Please add at least one product item.');
      return false;
    }
    for (const item of items) {
      if (!item.product_id) {
        error('Every line item must have a valid product selected.');
        return false;
      }
      if (item.quantity <= 0) {
        error('Every line item quantity must be greater than zero.');
        return false;
      }
    }
    return true;
  };

  const handleSaveChallan = async (status: 'DRAFT' | 'CONFIRMED') => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const payload = {
        customer_id: parseInt(selectedCustomerId, 10),
        status,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: i.quantity,
        })),
      };

      const result = await challanService.createChallan(payload);
      if (status === 'CONFIRMED') {
        success(`Challan ${result.challan_number} confirmed! Inventory deducted.`);
      } else {
        success(`Challan ${result.challan_number} saved as Draft.`);
      }
      setShowConfirmModal(false);
      navigate(`/challans/${result.id}`);
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        'Failed to process challan. Please check stock availability.';
      error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <Loader message="Preparing new sales challan..." />;
  }

  const selectedCustomerObj = customers.find((c) => c.id === parseInt(selectedCustomerId, 10));

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/challans">
            <button className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-6 h-6 text-teal-600" />
              Generate Delivery Challan
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Select wholesale customer, assign dispatch inventory, and choose Draft or Instant Confirmation.
            </p>
          </div>
        </div>
      </div>

      {/* Customer Selection Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-teal-600" />
            1. Select Consignee / Customer
          </h3>
          <span className="text-xs text-rose-500 font-semibold">* Mandatory</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Customer Account
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500"
              required
            >
              <option value="">Select customer...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.customer_name} {c.business_name ? `(${c.business_name})` : ''} - {c.mobile}
                </option>
              ))}
            </select>
          </div>

          {selectedCustomerObj && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">{selectedCustomerObj.customer_name}</span>
                <Badge variant="teal" size="sm">{selectedCustomerObj.customer_type}</Badge>
              </div>
              <p className="text-slate-600">Mobile: {selectedCustomerObj.mobile}</p>
              {selectedCustomerObj.gst_number && (
                <p className="font-mono text-slate-600">GST: {selectedCustomerObj.gst_number}</p>
              )}
              {selectedCustomerObj.address && (
                <p className="text-slate-500 truncate">Address: {selectedCustomerObj.address}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Product Line Items Card */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Package className="w-4 h-4 text-teal-600" />
            2. Line Items & Product Snapshot
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRow}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Line Item
          </Button>
        </div>

        {/* Dynamic Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3 px-3">Product Name</th>
                <th className="py-3 px-3">SKU</th>
                <th className="py-3 px-3 text-center">Available Stock</th>
                <th className="py-3 px-3 text-right">Unit Price</th>
                <th className="py-3 px-3 text-center w-28">Quantity</th>
                <th className="py-3 px-3 text-right">Subtotal</th>
                <th className="py-3 px-3 text-center w-12">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((line) => {
                const isShortStock = line.product && line.product.current_stock < line.quantity;
                return (
                  <tr key={line.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3 px-3 min-w-[220px]">
                      <select
                        value={line.product_id}
                        onChange={(e) =>
                          handleProductChange(line.id, parseInt(e.target.value, 10))
                        }
                        className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-1 focus:ring-teal-500"
                      >
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.product_name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-3 font-mono text-xs text-slate-500">
                      {line.product?.sku || '-'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded ${
                          isShortStock
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                      >
                        {line.product?.current_stock ?? 0} pcs
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-800">
                      {formatCurrency(line.unit_price)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) =>
                          handleQuantityChange(line.id, parseInt(e.target.value, 10))
                        }
                        className={`w-20 px-2 py-1 text-center text-xs font-bold rounded-lg border focus:outline-none focus:ring-1 ${
                          isShortStock
                            ? 'border-rose-400 focus:ring-rose-500 bg-rose-50'
                            : 'border-slate-300 focus:ring-teal-500'
                        }`}
                      />
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-900">
                      {formatCurrency(line.total_price)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveRow(line.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Totals Summary */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="text-xs text-slate-500 space-y-0.5">
            <p className="font-semibold text-slate-700">Stock Business Rules Reminder:</p>
            <p>• Saving as <strong className="text-slate-800">Draft</strong> creates the record without reducing stock.</p>
            <p>• Clicking <strong className="text-teal-700">Confirm</strong> executes an atomic database transaction and deducts live inventory.</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Total Quantity</span>
              <span className="text-lg font-extrabold text-slate-900">{totalQuantity} pcs</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div className="text-right">
              <span className="text-xs text-slate-500 block">Estimated Subtotal</span>
              <span className="text-xl font-extrabold text-teal-700">
                {formatCurrency(subtotalAmount)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Form Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
        <Link to="/challans">
          <Button variant="outline" size="md" disabled={submitting}>
            Cancel
          </Button>
        </Link>

        <Button
          variant="secondary"
          size="md"
          onClick={() => handleSaveChallan('DRAFT')}
          isLoading={submitting}
        >
          Save as Draft
        </Button>

        <Button
          variant="primary"
          size="md"
          onClick={() => {
            if (validateForm()) setShowConfirmModal(true);
          }}
          isLoading={submitting}
          leftIcon={<CheckCircle2 className="w-4 h-4" />}
        >
          Confirm Challan & Deduct Stock
        </Button>
      </div>

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => handleSaveChallan('CONFIRMED')}
        title="Confirm Sales Challan & Deduct Stock?"
        message={`Are you sure you want to confirm this challan for ${totalQuantity} items? This will immediately verify live inventory and deduct stock using a transaction.`}
        confirmText="Yes, Confirm & Deduct"
        variant="primary"
        isLoading={submitting}
      />
    </div>
  );
};
