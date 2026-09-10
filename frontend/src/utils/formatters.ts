/**
 * Formats a number or numeric string as Indian Rupee or standard currency
 */
export function formatCurrency(amount: number | string | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(Number(amount))) {
    return '₹0.00';
  }
  const val = Number(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(val);
}

/**
 * Formats ISO date string to readable format (e.g. 10 Sep 2026, 02:45 PM)
 */
export function formatDateTime(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Formats ISO date string to simple date format (e.g. 10 Sep 2026)
 */
export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
