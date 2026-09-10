import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  limit,
  onPageChange,
}) => {
  if (totalPages <= 1 && totalItems === 0) return null;

  const start = Math.min((currentPage - 1) * limit + 1, totalItems);
  const end = Math.min(currentPage * limit, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-white border-t border-slate-200 text-sm text-slate-600">
      <div>
        Showing <span className="font-semibold text-slate-900">{totalItems > 0 ? start : 0}</span> to{' '}
        <span className="font-semibold text-slate-900">{end}</span> of{' '}
        <span className="font-semibold text-slate-900">{totalItems}</span> results
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          Previous
        </Button>
        <span className="px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 rounded-md border border-slate-200">
          Page {currentPage} of {Math.max(1, totalPages)}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          rightIcon={<ChevronRight className="w-4 h-4" />}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
