import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  fullPage?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({
  message = 'Loading data...',
  size = 'md',
  fullPage = false,
}) => {
  const sizeMap = {
    sm: 'w-5 h-5',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const content = (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <Loader2 className={`${sizeMap[size]} text-teal-600 animate-spin`} />
      {message && <p className="text-sm font-medium text-slate-500">{message}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};
