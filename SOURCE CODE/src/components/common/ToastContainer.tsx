import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ToastItem } from '../../types';

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: () => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onDismiss }) => {
  const [progress, setProgress] = useState(100);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (isHovered) return;
    const startTime = Date.now();
    const duration = 2000;
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [isHovered]);

  const getConfig = (type: ToastItem['type']) => {
    switch (type) {
      case 'success':
        return {
          icon: CheckCircle2,
          category: 'SUCCESS',
          iconBg: 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/30',
          borderRing: 'ring-1 ring-emerald-500/30 dark:ring-emerald-400/30',
          gradientBorder: 'border-l-4 border-l-emerald-500',
          glowShadow: 'shadow-lg shadow-emerald-500/10 dark:shadow-emerald-950/40',
          barColor: 'bg-gradient-to-r from-emerald-500 to-teal-400',
          dot: 'bg-emerald-400 animate-pulse',
          tagText: 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/25',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          category: 'ATTENTION',
          iconBg: 'bg-amber-500/15 text-amber-500 dark:text-amber-400 border border-amber-500/30',
          borderRing: 'ring-1 ring-amber-500/30 dark:ring-amber-400/30',
          gradientBorder: 'border-l-4 border-l-amber-500',
          glowShadow: 'shadow-lg shadow-amber-500/10 dark:shadow-amber-950/40',
          barColor: 'bg-gradient-to-r from-amber-500 to-orange-400',
          dot: 'bg-amber-400 animate-pulse',
          tagText: 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/25',
        };
      case 'error':
        return {
          icon: AlertCircle,
          category: 'ALERT',
          iconBg: 'bg-rose-500/15 text-rose-500 dark:text-rose-400 border border-rose-500/30',
          borderRing: 'ring-1 ring-rose-500/30 dark:ring-rose-400/30',
          gradientBorder: 'border-l-4 border-l-rose-500',
          glowShadow: 'shadow-lg shadow-rose-500/10 dark:shadow-rose-950/40',
          barColor: 'bg-gradient-to-r from-rose-500 to-pink-500',
          dot: 'bg-rose-400 animate-pulse',
          tagText: 'text-rose-700 dark:text-rose-300 bg-rose-500/10 border-rose-500/25',
        };
      default:
        return {
          icon: Info,
          category: 'SYSTEM UPDATE',
          iconBg: 'bg-sky-500/15 text-sky-500 dark:text-sky-400 border border-sky-500/30',
          borderRing: 'ring-1 ring-sky-500/30 dark:ring-sky-400/30',
          gradientBorder: 'border-l-4 border-l-sky-500',
          glowShadow: 'shadow-lg shadow-sky-500/10 dark:shadow-sky-950/40',
          barColor: 'bg-gradient-to-r from-sky-500 to-cyan-400',
          dot: 'bg-sky-400 animate-pulse',
          tagText: 'text-sky-700 dark:text-sky-300 bg-sky-500/10 border-sky-500/25',
        };
    }
  };

  const config = getConfig(toast.type);
  const Icon = config.icon;

  return (
    <div
      role="status"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onDismiss}
      className={`pointer-events-auto relative rounded-xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 ${config.gradientBorder} ${config.borderRing} ${config.glowShadow} backdrop-blur-xl transition-all duration-200 hover:scale-[1.02] cursor-pointer group animate-in slide-in-from-top-3 fade-in`}
      title="Click to dismiss notification"
    >
      <div className="flex items-start gap-3 p-3 sm:p-3.5">
        {/* Category Accent Icon */}
        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${config.iconBg} shadow-2xs mt-0.5`}>
          <Icon className="w-4 h-4 stroke-[2.2]" />
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-black tracking-wider uppercase border ${config.tagText}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
              <span>{config.category}</span>
            </span>
            <span className="text-[9.5px] font-mono text-slate-400 dark:text-slate-500">
              Just now
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-snug break-words">
            {toast.message}
          </p>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="shrink-0 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Real-time shrinking indicator bar */}
      <div className="w-full h-1 bg-slate-100 dark:bg-slate-800/80 overflow-hidden">
        <div
          className={`h-full ${config.barColor} transition-all duration-75 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast, clearToasts } = useApp();

  // Dismiss toast notification when clicking anywhere in the application
  useEffect(() => {
    if (!toasts || toasts.length === 0) return;

    let cleanupListeners: (() => void) | null = null;
    const timer = setTimeout(() => {
      const handleGlobalClick = () => {
        clearToasts();
      };

      window.addEventListener('click', handleGlobalClick);
      window.addEventListener('touchstart', handleGlobalClick);

      cleanupListeners = () => {
        window.removeEventListener('click', handleGlobalClick);
        window.removeEventListener('touchstart', handleGlobalClick);
      };
    }, 80);

    return () => {
      clearTimeout(timer);
      if (cleanupListeners) {
        cleanupListeners();
      }
    };
  }, [toasts.length, clearToasts]);

  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed top-4 sm:top-5 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none no-print px-3 sm:px-0"
    >
      {toasts.map((toast) => (
        <ToastCard
          key={toast.id}
          toast={toast}
          onDismiss={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};
