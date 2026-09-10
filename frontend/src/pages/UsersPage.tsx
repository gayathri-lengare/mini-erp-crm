import React, { useEffect, useState, useCallback } from 'react';
import { UserCog, Plus, ShieldCheck, Mail, Calendar, User as UserIcon } from 'lucide-react';
import { userService } from '../services/dashboard.service';
import { User, UserRole } from '../types';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { Loader } from '../components/common/Loader';
import { useToast } from '../hooks/useToast';
import { formatDate } from '../utils/formatters';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'SALES' as UserRole,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const { success, error } = useToast();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const list = await userService.getUsers();
      setUsers(list);
    } catch {
      error('Failed to load user list.');
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Full name is required';
    if (!formData.email.trim()) errs.email = 'Email address is required';
    if (!formData.password || formData.password.length < 6)
      errs.password = 'Password must be at least 6 characters';
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      setSubmitting(true);
      await userService.createUser(formData);
      success(`User ${formData.name} created successfully!`);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'SALES' });
      fetchUsers();
    } catch (err: any) {
      error(err.response?.data?.message || 'Failed to create user.');
    } finally {
      setSubmitting(false);
    }
  };

  const roleColorMap: Record<string, 'teal' | 'purple' | 'info' | 'warning' | 'neutral'> = {
    ADMIN: 'purple',
    SALES: 'teal',
    WAREHOUSE: 'warning',
    ACCOUNTS: 'info',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCog className="w-6 h-6 text-teal-600" />
            Portal User Management (Admin Only)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage authenticated staff members and configure Role-Based Access Control (RBAC).
          </p>
        </div>

        <Button onClick={() => setIsModalOpen(true)} leftIcon={<Plus className="w-4 h-4" />}>
          Register Portal User
        </Button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <Loader message="Loading portal users..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4 text-center">Assigned Role</th>
                  <th className="py-3.5 px-4">Member Since</th>
                  <th className="py-3.5 px-4 text-center">Permissions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <span>{u.name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" /> {u.email}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={roleColorMap[u.role] || 'neutral'} size="sm">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatDate(u.created_at)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs text-slate-600 font-medium">
                      {u.role === 'ADMIN' && 'Full Portal Control'}
                      {u.role === 'SALES' && 'CRM Leads, Products View, Create Challans'}
                      {u.role === 'WAREHOUSE' && 'Products Edit, Stock Intake & Audit'}
                      {u.role === 'ACCOUNTS' && 'View Audit, Customers & Sales'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Portal User"
        maxWidth="md"
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
            <Button size="sm" onClick={handleCreateUser} isLoading={submitting}>
              Create User
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <Input
            label="Full Name"
            required
            placeholder="e.g. Ramesh K"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            error={formErrors.name}
          />

          <Input
            label="Email Address"
            required
            type="email"
            placeholder="user@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={formErrors.email}
          />

          <Input
            label="Password"
            required
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={formErrors.password}
            helperText="Minimum 6 characters."
          />

          <Select
            label="Assign Role"
            options={[
              { value: 'SALES', label: 'SALES (CRM & Challans)' },
              { value: 'WAREHOUSE', label: 'WAREHOUSE (Inventory & Intake)' },
              { value: 'ACCOUNTS', label: 'ACCOUNTS (View Sales & Ledger)' },
              { value: 'ADMIN', label: 'ADMIN (Full Access)' },
            ]}
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
          />
        </form>
      </Modal>
    </div>
  );
};
