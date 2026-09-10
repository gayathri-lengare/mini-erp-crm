import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | 'success'
    | 'danger'
    | 'warning'
    | 'info'
    | 'neutral'
    | 'purple'
    | 'teal';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] font-medium tracking-wide',
    md: 'px-2.5 py-1 text-xs font-semibold',
  };

  const variantStyles = {
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/60',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200/60',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200/60',
    info: 'bg-sky-50 text-sky-700 border border-sky-200/60',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200/60',
    teal: 'bg-teal-50 text-teal-700 border border-teal-200/60',
  };

  return (
    <span
      className={`inline-flex items-center rounded-md uppercase ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
