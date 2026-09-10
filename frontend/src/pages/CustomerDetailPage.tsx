import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Plus,
  MessageSquare,
  FileCheck,
  CreditCard,
} from 'lucide-react';
import { customerService } from '../services/customer.service';
import { Customer, FollowUp } from '../types';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Loader } from '../components/common/Loader';
import { useToast } from '../hooks/useToast';
import { useAuth } from '../hooks/useAuth';
import { formatDate, formatDateTime } from '../utils/formatters';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const customerId = parseInt(id || '', 10);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Follow-up Note Modal
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const { success, error } = useToast();
  const { hasRole } = useAuth();
  const canAddFollowUp = hasRole('ADMIN', 'SALES');

  const loadCustomerData = useCallback(async () => {
    if (isNaN(customerId)) return;
    try {
      setLoading(true);
      const [cust, notes] = await Promise.all([
        customerService.getCustomerById(customerId),
        customerService.getFollowUps(customerId),
      ]);
      setCustomer(cust);
      setFollowUps(notes);
    } catch (err: any) {
      error('Failed to load customer profile.');
    } finally {
      setLoading(false);
    }
  }, [customerId, error]);

  useEffect(() => {
    loadCustomerData();
  }, [loadCustomerData]);

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) {
      error('Follow-up note cannot be empty.');
      return;
    }

    try {
      setSubmittingNote(true);
      await customerService.addFollowUp(
        customerId,
        newNote,
        nextFollowUpDate || null
      );
      success('Follow-up note recorded successfully!');
      setIsFollowUpModalOpen(false);
      setNewNote('');
      setNextFollowUpDate('');
      loadCustomerData();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to save follow-up.');
    } finally {
      setSubmittingNote(false);
    }
  };

  if (loading) {
    return <Loader message="Loading customer dossier..." />;
  }

  if (!customer) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
        <h3 className="text-lg font-bold text-slate-800">Customer Not Found</h3>
        <Link to="/customers" className="mt-4 inline-block">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Customers
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link to="/customers">
            <button className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900">{customer.customer_name}</h1>
              <Badge
                variant={
                  customer.status === 'Active'
                    ? 'success'
                    : customer.status === 'Lead'
                    ? 'warning'
                    : 'danger'
                }
              >
                {customer.status}
              </Badge>
              <Badge
                variant={
                  customer.customer_type === 'Distributor'
                    ? 'purple'
                    : customer.customer_type === 'Wholesale'
                    ? 'teal'
                    : 'neutral'
                }
              >
                {customer.customer_type}
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Customer ID #{customer.id} • Registered on {formatDate(customer.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canAddFollowUp && (
            <Button
              onClick={() => setIsFollowUpModalOpen(true)}
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add Follow-up Note
            </Button>
          )}
          {hasRole('ADMIN', 'SALES') && (
            <Link to={`/challans/new?customerId=${customer.id}`}>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<FileCheck className="w-4 h-4" />}
              >
                Create Challan
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Grid: Details Card & Follow-up Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer Dossier (1 Col) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
              Company & Contact Profile
            </h3>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-xs text-slate-400 block">Business Entity</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-4 h-4 text-slate-400" />
                  {customer.business_name || 'Individual / Unregistered'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Mobile Phone</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-4 h-4 text-slate-400" />
                  {customer.mobile}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Email Address</span>
                <span className="font-medium text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {customer.email || 'Not provided'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">GSTIN</span>
                <span className="font-mono text-xs font-semibold text-slate-800 flex items-center gap-1.5 mt-0.5">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  {customer.gst_number || 'Not registered'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 block">Dispatch / Billing Address</span>
                <span className="text-slate-700 flex items-start gap-1.5 mt-0.5 leading-relaxed">
                  <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
                  {customer.address || 'Address not on file'}
                </span>
              </div>
            </div>
          </div>

          {/* Follow-up Status Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 pb-2 border-b border-slate-100">
              Next Scheduled Action
            </h3>
            <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 flex items-center gap-3">
              <Calendar className="w-6 h-6 text-teal-600 flex-shrink-0" />
              <div>
                <span className="text-[11px] font-bold uppercase text-teal-700 tracking-wider block">
                  Next Follow-up Date
                </span>
                <span className="text-sm font-extrabold text-slate-900">
                  {customer.follow_up_date ? formatDate(customer.follow_up_date) : 'None scheduled'}
                </span>
              </div>
            </div>

            {customer.notes && (
              <div className="pt-2">
                <span className="text-xs text-slate-400 block mb-1">General Notes</span>
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200/70 leading-relaxed">
                  {customer.notes}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Follow-up Timeline (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-teal-600" />
                CRM Follow-up History & Logs
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Audit trail of conversations, proposals, and customer touches.
              </p>
            </div>
            <Badge variant="neutral" size="sm">
              {followUps.length} Logs
            </Badge>
          </div>

          {followUps.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Clock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-medium">No follow-up notes recorded yet.</p>
              {canAddFollowUp && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={() => setIsFollowUpModalOpen(true)}
                >
                  Log First Interaction
                </Button>
              )}
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
              {followUps.map((log) => (
                <div key={log.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[27px] top-1 w-3 h-3 rounded-full bg-teal-500 ring-4 ring-white" />

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 hover:border-teal-200 transition">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                      <span className="text-xs font-bold text-slate-800">
                        {log.created_by_name || 'Sales Representative'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {formatDateTime(log.created_at)}
                      </span>
                    </div>

                    <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                      {log.note}
                    </p>

                    {log.follow_up_date && (
                      <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center gap-1.5 text-xs text-teal-700 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Scheduled next review for: {formatDate(log.follow_up_date)}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Follow-up Note Modal */}
      <Modal
        isOpen={isFollowUpModalOpen}
        onClose={() => setIsFollowUpModalOpen(false)}
        title="Log Customer Interaction / Follow-up"
        maxWidth="md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFollowUpModalOpen(false)}
              disabled={submittingNote}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleAddFollowUp}
              isLoading={submittingNote}
            >
              Save Follow-up
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddFollowUp} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Discussion Notes & Remarks <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              placeholder="Detail the discussion points, pricing negotiated, customer objections, or delivery requirements..."
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500"
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
            />
          </div>

          <Input
            label="Next Scheduled Follow-up Date (Optional)"
            type="date"
            value={nextFollowUpDate}
            onChange={(e) => setNextFollowUpDate(e.target.value)}
          />
        </form>
      </Modal>
    </div>
  );
};
