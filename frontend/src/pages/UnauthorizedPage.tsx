import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldX, Home } from 'lucide-react';
import { Button } from '../components/common/Button';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
        <ShieldX className="w-8 h-8" />
      </div>
      <h1 className="text-2xl font-extrabold text-slate-900">403 - Access Denied</h1>
      <p className="mt-2 text-sm text-slate-500 max-w-md">
        Your assigned user role does not have permission to access this module. If you believe this is an error, please contact your portal administrator.
      </p>
      <div className="mt-6">
        <Link to="/dashboard">
          <Button variant="primary" leftIcon={<Home className="w-4 h-4" />}>
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};

export const NotFoundPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
      <h1 className="text-4xl font-extrabold text-slate-900">404</h1>
      <h2 className="text-xl font-bold text-slate-700 mt-2">Page Not Found</h2>
      <p className="mt-2 text-sm text-slate-500 max-w-md">
        The requested URL was not found on this portal.
      </p>
      <div className="mt-6">
        <Link to="/dashboard">
          <Button variant="outline" leftIcon={<Home className="w-4 h-4" />}>
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
};
