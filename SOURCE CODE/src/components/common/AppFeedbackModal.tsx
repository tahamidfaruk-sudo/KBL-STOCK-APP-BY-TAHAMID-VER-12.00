import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, Info, Trash2, RotateCcw, X, ShieldAlert, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export interface AppFeedbackModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AppFeedbackModal: React.FC<AppFeedbackModalProps> = ({
  isOpen: propIsOpen,
  onClose: propOnClose,
}) => {
  const { feedbackDialog, closeFeedbackDialog } = useApp();

  const isOpen = propIsOpen !== undefined ? propIsOpen : (feedbackDialog?.isOpen ?? false);

  const handleClose = () => {
    if (propOnClose) {
      propOnClose();
    }
    if (feedbackDialog?.onCancel) {
      feedbackDialog.onCancel();
    }
    closeFeedbackDialog();
  };

  const handleConfirm = () => {
    if (feedbackDialog?.onConfirm) {
      feedbackDialog.onConfirm();
    }
    if (propOnClose) {
      propOnClose();
    }
    closeFeedbackDialog();
  };

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const {
    type = 'info',
    title = 'Notification',
    message = '',
    confirmText = 'CONFIRM',
    cancelText = 'CANCEL',
    isConfirmation = false,
  } = feedbackDialog || {};

  const isRestore = isConfirmation && (
    title.toLowerCase().includes('restore') || 
    message.toLowerCase().includes('restore') ||
    confirmText.toLowerCase().includes('restore')
  );

  const isDelete = isConfirmation && !isRestore;

  const getAccentConfig = () => {
    if (isRestore) {
      return {
        barGradient: 'from-sky-500 via-teal-400 to-emerald-500',
        badgeBg: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
        iconBg: 'bg-gradient-to-br from-sky-500/20 to-teal-500/20 border border-sky-500/40 text-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.25)]',
        confirmBtn: 'bg-gradient-to-r from-sky-600 to-teal-600 hover:from-sky-500 hover:to-teal-500 text-white shadow-lg shadow-sky-600/30',
        tag: 'RESTORE CONFIRMATION',
        icon: <RotateCcw className="w-6 h-6 stroke-[2.2]" />,
      };
    }
    if (isDelete) {
      return {
        barGradient: 'from-rose-500 via-red-500 to-amber-500',
        badgeBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        iconBg: 'bg-gradient-to-br from-rose-500/20 to-red-500/20 border border-rose-500/40 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.25)]',
        confirmBtn: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-600/30',
        tag: 'DELETION CONFIRMATION',
        icon: <Trash2 className="w-6 h-6 stroke-[2.2]" />,
      };
    }
    if (type === 'success') {
      return {
        barGradient: 'from-emerald-500 via-teal-400 to-cyan-500',
        badgeBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        iconBg: 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]',
        confirmBtn: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/30',
        tag: 'SUCCESSFUL OPERATION',
        icon: <CheckCircle2 className="w-6 h-6 stroke-[2.2]" />,
      };
    }
    if (type === 'warning') {
      return {
        barGradient: 'from-amber-500 via-orange-400 to-yellow-500',
        badgeBg: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        iconBg: 'bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)]',
        confirmBtn: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-600/30',
        tag: 'ATTENTION REQUIRED',
        icon: <AlertTriangle className="w-6 h-6 stroke-[2.2]" />,
      };
    }
    if (type === 'error') {
      return {
        barGradient: 'from-rose-600 to-red-600',
        badgeBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        iconBg: 'bg-gradient-to-br from-rose-500/20 to-red-500/20 border border-rose-500/40 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.25)]',
        confirmBtn: 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-600/30',
        tag: 'SYSTEM ERROR',
        icon: <ShieldAlert className="w-6 h-6 stroke-[2.2]" />,
      };
    }
    return {
      barGradient: 'from-sky-500 to-blue-600',
      badgeBg: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
      iconBg: 'bg-gradient-to-br from-sky-500/20 to-blue-500/20 border border-sky-500/40 text-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.25)]',
      confirmBtn: 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-600/30',
      tag: 'SYSTEM NOTIFICATION',
      icon: <Info className="w-6 h-6 stroke-[2.2]" />,
    };
  };

  const accent = getAccentConfig();

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-lg bg-slate-900/95 border border-slate-700/80 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] p-6 overflow-hidden cursor-default backdrop-blur-xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Accent Bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${accent.barGradient}`} />

        {/* Ambient Corner Glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-sky-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${accent.iconBg}`}>
              {accent.icon}
            </div>
            <div>
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border mb-1 ${accent.badgeBg}`}>
                {accent.tag}
              </span>
              <h3 className="font-nav-main text-base sm:text-lg font-black text-slate-100 uppercase tracking-wide">
                {title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-colors cursor-pointer"
            title="Close dialog"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Card */}
        <div className="my-4 text-xs sm:text-sm text-slate-200 leading-relaxed font-medium bg-slate-950/60 p-4 rounded-xl border border-slate-800 shadow-inner">
          {message}
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-3 pt-2 border-t border-slate-800/80">
          {isConfirmation ? (
            <>
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-xs font-black uppercase rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800/80 hover:text-white transition-all cursor-pointer tracking-wider"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className={`px-5 py-2 text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center gap-2 tracking-wider ${accent.confirmBtn}`}
              >
                {isRestore ? <RotateCcw className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{confirmText}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              className={`px-6 py-2 text-xs font-black uppercase rounded-xl transition-all cursor-pointer flex items-center gap-2 tracking-wider ${accent.confirmBtn}`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>OK</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
