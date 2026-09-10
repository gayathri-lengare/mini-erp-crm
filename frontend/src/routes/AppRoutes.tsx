import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';

// Pages
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { CustomersPage } from '../pages/CustomersPage';
import { CustomerDetailPage } from '../pages/CustomerDetailPage';
import { ProductsPage } from '../pages/ProductsPage';
import { StockMovementsPage } from '../pages/StockMovementsPage';
import { ChallansPage } from '../pages/ChallansPage';
import { CreateChallanPage } from '../pages/CreateChallanPage';
import { ChallanDetailPage } from '../pages/ChallanDetailPage';
import { UsersPage } from '../pages/UsersPage';
import { UnauthorizedPage, NotFoundPage } from '../pages/UnauthorizedPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Protected Layout Routes */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Customer CRM Module */}
        <Route
          path="/customers"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']}>
              <CustomersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customers/:id"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'ACCOUNTS']}>
              <CustomerDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Product Catalog & Inventory */}
        <Route path="/products" element={<ProductsPage />} />

        {/* Stock Movements Audit Ledger */}
        <Route
          path="/stock-movements"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'WAREHOUSE']}>
              <StockMovementsPage />
            </ProtectedRoute>
          }
        />

        {/* Sales Challan Module */}
        <Route path="/challans" element={<ChallansPage />} />
        <Route
          path="/challans/new"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'SALES']}>
              <CreateChallanPage />
            </ProtectedRoute>
          }
        />
        <Route path="/challans/:id" element={<ChallanDetailPage />} />

        {/* User Administration (Admin Only) */}
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        {/* Access Denied */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* 404 Catch-all */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
