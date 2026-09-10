import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  User as UserIcon,
  Phone,
  FileSpreadsheet,
  XCircle,
} from 'lucide-react';
import { challanService } from '../services/challan.service';
import { Challan } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Loader } from '../components/common/Loader';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { formatCurrency, formatDateTime } from '../utils/formatters';

export const ChallanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const challanId = parseInt(id || '', 10);

  const [challan, setChallan] = useState<Challan | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Dialogs
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const { success, error } = useToast();
  const { hasRole } = useAuth();
  const canConfirm = hasRole('ADMIN', 'SALES');

  const fetchChallan = useCallback(async () => {
    if (isNaN(challanId)) return;
    try {
      setLoading(true);
      const data = await challanService.getChallanById(challanId);
      setChallan(data);
    } catch (err: any) {
      error('Failed to load challan details.');
    } finally {
      setLoading(false);
    }
  }, [challanId, error]);

  useEffect(() => {
    fetchChallan();
  }, [fetchChallan]);

  const handleConfirm = async () => {
    try {
      setActionLoading(true);
      const updated = await challanService.confirmChallan(challanId);
      setChallan(updated);
      setShowConfirmModal(false);
      success(
        `Challan ${updated.challan_number} confirmed successfully! Inventory deducted and OUT movement recorded.`
      );
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to confirm challan.';
      error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    try {
      setActionLoading(true);
      const updated = await challanService.cancelChallan(challanId);
      setChallan(updated);
      setShowCancelModal(false);
      success(`Challan ${updated.challan_number} has been cancelled.`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to cancel challan.';
      error(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <Loader message="Fetching delivery challan details..." />;
  }

  if (!challan) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">Challan Not Found</h3>
        <Link to="/challans" className="mt-4 inline-block">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Challans
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link to="/challans">
            <button className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{challan.challan_number}</h1>
              <Badge
                variant={
                  challan.status === 'CONFIRMED'
                    ? 'success'
                    : challan.status === 'DRAFT'
                    ? 'warning'
                    : 'danger'
                }
              >
                {challan.status}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Issued on {formatDateTime(challan.created_at)} by {challan.created_by_name || 'Staff'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Print Challan
          </Button>

          {canConfirm && challan.status === 'DRAFT' && (
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowCancelModal(true)}
              >
                Cancel Draft
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowConfirmModal(true)}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                Confirm & Deduct Stock
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Printable Challan Document */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-6 sm:p-10 space-y-8 print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start pb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold flex items-center justify-center text-sm">
                AF
              </div>
              <h2 className="text-xl font-extrabold text-slate-900">ApexFlow Distribution Pvt Ltd</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">Wholesale & Supply Chain Logistics</p>
            <p className="text-xs text-slate-500">Warehouse Central, Industrial Corridor, Mumbai</p>
            <p className="text-xs text-slate-500">GSTIN: 27AABCA9876Q1Z9</p>
          </div>

          <div className="sm:text-right">
            <span className="text-xs font-bold uppercase tracking-widest text-teal-700 bg-teal-50 px-2.5 py-1 rounded">
              Delivery Challan
            </span>
            <h3 className="text-xl font-bold font-mono text-slate-900 mt-2">{challan.challan_number}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Date: {formatDateTime(challan.created_at)}</p>
            <div className="mt-2">
              <Badge
                variant={
                  challan.status === 'CONFIRMED'
                    ? 'success'
                    : challan.status === 'DRAFT'
                    ? 'warning'
                    : 'danger'
                }
              >
                Status: {challan.status}
              </Badge>
            </div>
          </div>
        </div>

        {/* Consignee & Dispatch Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-slate-50/70 p-5 rounded-xl border border-slate-200/60">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Consignee / Customer Details
            </h4>
            <p className="text-sm font-bold text-slate-900">{challan.customer_name}</p>
            {challan.business_name && (
              <p className="text-xs text-slate-700 font-medium mt-0.5">{challan.business_name}</p>
            )}
            {challan.customer_mobile && (
              <p className="text-xs text-slate-600 mt-1">Mobile: {challan.customer_mobile}</p>
            )}
            {challan.gst_number && (
              <p className="text-xs font-mono text-slate-600">GSTIN: {challan.gst_number}</p>
            )}
            {challan.customer_address && (
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Address: {challan.customer_address}
              </p>
            )}
          </div>

          <div className="sm:text-right space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Dispatch Verification
            </h4>
            <p className="text-xs text-slate-600">
              Generated by: <strong className="text-slate-800">{challan.created_by_name || 'Sales Staff'}</strong>
            </p>
            <p className="text-xs text-slate-600">
              Transport Mode: <strong className="text-slate-800">Road Delivery / Carrier</strong>
            </p>
            <p className="text-xs text-slate-600">
              Stock Deducted: <strong className="text-slate-800">{challan.status === 'CONFIRMED' ? 'YES (Committed)' : 'NO (Pending)'}</strong>
            </p>
          </div>
        </div>

        {/* Product Line Items (Snapshot Information) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Dispatched Line Items (Captured Snapshot)
            </h4>
            <span className="text-[11px] text-slate-400">
              Original product prices & SKU frozen at creation
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-600">
                <tr>
                  <th className="py-3 px-4">#</th>
                  <th className="py-3 px-4">Product Name (Snapshot)</th>
                  <th className="py-3 px-4">SKU Code</th>
                  <th className="py-3 px-4 text-center">Quantity</th>
                  <th className="py-3 px-4 text-right">Unit Price</th>
                  <th className="py-3 px-4 text-right">Total Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(challan.items || []).map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-xs text-slate-400">{index + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {item.product_name_snapshot}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-600">
                      {item.sku_snapshot}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-900">
                      {item.quantity} pcs
                    </td>
                    <td className="py-3 px-4 text-right text-slate-700">
                      {formatCurrency(item.unit_price_snapshot)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(item.total_price)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t-2 border-slate-200 font-bold">
                <tr>
                  <td colSpan={3} className="py-3 px-4 text-slate-700 uppercase text-xs">
                    Grand Totals
                  </td>
                  <td className="py-3 px-4 text-center text-slate-900 font-extrabold">
                    {challan.total_quantity} pcs
                  </td>
                  <td className="py-3 px-4" />
                  <td className="py-3 px-4 text-right text-teal-700 text-base font-extrabold">
                    {formatCurrency(challan.total_amount)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Declarations & Signatures for delivery slip */}
        <div className="grid grid-cols-2 gap-8 pt-10 border-t border-slate-200 text-xs text-slate-600">
          <div>
            <p className="font-semibold text-slate-800 mb-1">Terms & Conditions:</p>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              1. Goods received in good condition and order.
              <br />
              2. Any discrepancies must be reported within 24 hours of delivery.
              <br />
              3. This is an operational delivery challan issued under commercial distribution guidelines.
            </p>
          </div>
          <div className="text-right flex flex-col justify-between">
            <div>
              <p className="font-semibold text-slate-800">Receiver's Signature / Stamp</p>
              <div className="mt-12 border-b border-slate-300 w-48 ml-auto" />
            </div>
            <p className="text-[10px] text-slate-400 mt-2">Authorized Signatory</p>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmDialog
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirm}
        title="Confirm Challan & Deduct Stock?"
        message={`Confirming ${challan.challan_number} will immediately deduct ${challan.total_quantity} items from warehouse inventory and log OUT stock movement records. This operation cannot be undone.`}
        confirmText="Confirm & Deduct Stock"
        variant="primary"
        isLoading={actionLoading}
      />

      {/* Cancel Modal */}
      <ConfirmDialog
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleCancel}
        title="Cancel Challan?"
        message={`Are you sure you want to cancel challan ${challan.challan_number}?`}
        confirmText="Yes, Cancel Challan"
        variant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
};
