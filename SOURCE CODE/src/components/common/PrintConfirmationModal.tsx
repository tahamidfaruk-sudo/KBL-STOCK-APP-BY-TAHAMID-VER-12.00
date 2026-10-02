import React, { useEffect } from 'react';
import { Printer, X, AlertCircle } from 'lucide-react';

interface PrintConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentPageName?: string;
}

export const PrintConfirmationModal: React.FC<PrintConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentPageName,
}) => {
  // Listen for Enter (Confirm) and Escape (Cancel)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onConfirm]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150 cursor-pointer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-dialog-title"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden cursor-default animate-in zoom-in-95 duration-150 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Decorative Gradient Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 shrink-0" />

        {/* Modal Header */}
        <div className="flex items-start justify-between px-5 pt-4 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 flex items-center justify-center text-sky-600 dark:text-sky-400 shrink-0 shadow-xs">
              <Printer className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="inline-block px-2 py-0.5 rounded-md text-[9.5px] font-black uppercase tracking-wider bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700/60 mb-0.5">
                SHORTCUT: CTRL + P
              </span>
              <h3
                id="print-dialog-title"
                className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight"
              >
                CONFIRM PRINT
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Cancel and close dialog (Esc)"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="px-5 py-3 space-y-3">
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            You activated the print command using the <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono text-[11px] font-bold text-sky-600 dark:text-sky-400">Ctrl + P</kbd> shortcut. Are you sure you want to trigger the print function?
          </p>

          {currentPageName && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/70 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 shrink-0">
                ACTIVE DOCUMENT:
              </span>
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate uppercase">
                {currentPageName}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>This confirmation prevents accidental or unwanted print jobs.</span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 mt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl transition-all cursor-pointer uppercase tracking-wider shadow-2xs"
          >
            CANCEL <span className="opacity-60 text-[10px] font-mono">(ESC)</span>
          </button>

          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            className="px-4 py-2 text-xs font-black text-white bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-xl shadow-md shadow-sky-600/25 transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wider"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PROCEED TO PRINT</span>
            <span className="opacity-75 text-[10px] font-mono ml-0.5">(↵)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
