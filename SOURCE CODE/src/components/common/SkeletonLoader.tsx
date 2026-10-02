import React from 'react';
import { Loader2 } from 'lucide-react';

interface SkeletonLoaderProps {
  type?: 'dashboard' | 'table' | 'cards' | 'generic';
  message?: string;
  rows?: number;
}

export const GlobalSkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  type = 'generic',
  message = 'Loading data, please wait...',
  rows = 5,
}) => {
  return (
    <div className="w-full space-y-4 animate-pulse p-4 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <Loader2 className="w-5 h-5 text-sky-600 dark:text-sky-400 animate-spin" />
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
          {message}
        </span>
      </div>

      {type === 'dashboard' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          ))}
        </div>
      )}

      <div className="space-y-2.5">
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-full" />
        {Array.from({ length: rows }).map((_, idx) => (
          <div key={idx} className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded w-full" />
        ))}
      </div>
    </div>
  );
};

export default GlobalSkeletonLoader;
