import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit2,
  Calendar,
  Building2,
  Phone,
  Mail,
  Filter,
} from 'lucide-react';
import { customerService } from '../services/customer.service';
import { Customer, CustomerStatus, CustomerType, PaginatedResult } from '../types';
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
import { formatDate } from '../utils/formatters';

export const CustomersPage: React.FC = () => {
  const [data, setData] = useState<PaginatedResult<Customer>>({
    items: [],
    pagination: { total: 0, page: 1, limit: 10, totalPages: 1 },
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    customer_name: '',
    mobile: '',
    email: '',
    business_name: '',
    gst_number: '',
    customer_type: 'Retail' as CustomerType,
    address: '',
    status: 'Lead' as CustomerStatus,
    follow_up_date: '',
    notes: '',
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const { success, error } = useToast();
  const { hasRole } = useAuth();
  const canModify = hasRole('ADMIN', 'SALES');

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await customerService.getCustomers({
        page,
        limit: 10,
        search: searchTerm,
        status: statusFilter,
        customer_type: typeFilter,
      });
      setData(res);
    } catch (err: any) {
      error('Failed to load customers.');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter, typeFilter, error]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleOpenCreateModal = () => {
    setModalMode('create');
    setSelectedCustomerId(null);
    setFormData({
      customer_name: '',
      mobile: '',
      email: '',
      business_name: '',
      gst_number: '',
      customer_type: 'Retail',
      address: '',
      status: 'Lead',
      follow_up_date: '',
      notes: '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (c: Customer) => {
    setModalMode('edit');
    setSelectedCustomerId(c.id);
    setFormData({
      customer_name: c.customer_name,
      mobile: c.mobile,
      email: c.email || '',
      business_name: c.business_name || '',
      gst_number: c.gst_number || '',
      customer_type: c.customer_type,
      address: c.address || '',
      status: c.status,
      follow_up_date: c.follow_up_date ? c.follow_up_date.split('T')[0] : '',
      notes: c.notes || '',
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.customer_name.trim()) errs.customer_name = 'Customer name is required';
    if (!formData.mobile.trim()) errs.mobile = 'Mobile number is required';
    if (formData.mobile.trim().length < 7) errs.mobile = 'Mobile must be at least 7 characters';
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Invalid email address';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      if (modalMode === 'create') {
        await customerService.createCustomer(formData);
        success('Customer created successfully!');
      } else if (selectedCustomerId) {
        await customerService.updateCustomer(selectedCustomerId, formData);
        success('Customer details updated successfully!');
      }
      setIsModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error saving customer.';
      error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Search and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-teal-600" />
            Customer Management (CRM)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Directory of retail buyers, distributors, and business prospects.
          </p>
        </div>

        {canModify && (
          <Button
            onClick={handleOpenCreateModal}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add New Customer
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
            placeholder="Search by customer name, business, mobile, or email..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="w-1/2 md:w-36">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="Lead">Lead</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="w-1/2 md:w-36">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 text-xs font-medium border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
            >
              <option value="ALL">All Types</option>
              <option value="Retail">Retail</option>
              <option value="Wholesale">Wholesale</option>
              <option value="Distributor">Distributor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customer Listing Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <Loader message="Loading customer directory..." />
        ) : data.items.length === 0 ? (
          <EmptyState
            title="No customers found"
            description="Try adjusting your search criteria or add your first customer."
            actionLabel={canModify ? 'Add Customer' : undefined}
            onAction={canModify ? handleOpenCreateModal : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Business & Mobile</th>
                  <th className="py-3.5 px-4 text-center">Type</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4">Follow-up Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <Link
                        to={`/customers/${c.id}`}
                        className="font-bold text-slate-900 hover:text-teal-600 transition block"
                      >
                        {c.customer_name}
                      </Link>
                      {c.email && (
                        <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Mail className="w-3 h-3 text-slate-400" /> {c.email}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{c.business_name || 'Individual'}</span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{c.mobile}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge
                        variant={
                          c.customer_type === 'Distributor'
                            ? 'purple'
                            : c.customer_type === 'Wholesale'
                            ? 'teal'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {c.customer_type}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge
                        variant={
                          c.status === 'Active'
                            ? 'success'
                            : c.status === 'Lead'
                            ? 'warning'
                            : 'danger'
                        }
                        size="sm"
                      >
                        {c.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      {c.follow_up_date ? (
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" />
                          <span>{formatDate(c.follow_up_date)}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Not scheduled</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link to={`/customers/${c.id}`}>
                          <button
                            title="View Customer & Follow-ups"
                            className="p-1.5 text-slate-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        {canModify && (
                          <button
                            title="Edit Customer"
                            onClick={() => handleOpenEditModal(c)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination footer */}
        <Pagination
          currentPage={data.pagination.page}
          totalPages={data.pagination.totalPages}
          totalItems={data.pagination.total}
          limit={data.pagination.limit}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>

      {/* Add / Edit Customer Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Add New Customer' : 'Edit Customer Details'}
        maxWidth="2xl"
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
            <Button
              size="sm"
              onClick={handleFormSubmit}
              isLoading={submitting}
            >
              {modalMode === 'create' ? 'Create Customer' : 'Save Changes'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Customer Name"
              required
              placeholder="e.g. Rajesh Sharma"
              value={formData.customer_name}
              onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
              error={formErrors.customer_name}
            />

            <Input
              label="Mobile Number"
              required
              placeholder="e.g. 9820011223"
              value={formData.mobile}
              onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
              error={formErrors.mobile}
            />

            <Input
              label="Email Address"
              type="email"
              placeholder="e.g. rajesh@apexstores.in"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              error={formErrors.email}
            />

            <Input
              label="Business Name"
              placeholder="e.g. Apex Retail Hub"
              value={formData.business_name}
              onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
            />

            <Input
              label="GST Number (Optional)"
              placeholder="e.g. 27AABCA1234F1Z5"
              value={formData.gst_number}
              onChange={(e) => setFormData({ ...formData, gst_number: e.target.value.toUpperCase() })}
            />

            <Select
              label="Customer Type"
              options={[
                { value: 'Retail', label: 'Retail' },
                { value: 'Wholesale', label: 'Wholesale' },
                { value: 'Distributor', label: 'Distributor' },
              ]}
              value={formData.customer_type}
              onChange={(e) =>
                setFormData({ ...formData, customer_type: e.target.value as CustomerType })
              }
            />

            <Select
              label="Status"
              options={[
                { value: 'Lead', label: 'Lead' },
                { value: 'Active', label: 'Active' },
                { value: 'Inactive', label: 'Inactive' },
              ]}
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as CustomerStatus })
              }
            />

            <Input
              label="Follow-up Date"
              type="date"
              value={formData.follow_up_date}
              onChange={(e) => setFormData({ ...formData, follow_up_date: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Billing / Shipping Address
            </label>
            <textarea
              rows={2}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500"
              placeholder="Street address, city, state, pin code..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Notes
            </label>
            <textarea
              rows={2}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-500"
              placeholder="Internal customer notes or requirement remarks..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
