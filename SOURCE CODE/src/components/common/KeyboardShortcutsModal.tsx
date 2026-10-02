import React from 'react';
import { X, Command, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl + N / ⌘ + N', action: 'New Stock Receiving Entry (Stock In)' },
    { key: 'Ctrl + D / ⌘ + D', action: 'New Delivery Dispatch Entry (Stock Out)' },
    { key: 'Ctrl + P / ⌘ + P', action: 'Quick Print Document (With Confirmation)' },
    { key: 'Ctrl + I / ⌘ + I', action: 'Excel Spreadsheet Data Import' },
    { key: 'Ctrl + Shift + R', action: 'Open Recycle Bin & Restore Items' },
    { key: 'Ctrl + B / ⌘ + B', action: 'Toggle Sidebar Navigation Drawer' },
    { key: 'Alt + ↑', action: 'Smooth Scroll Back to Top' },
    { key: 'Ctrl + 1', action: 'Jump to Dashboard' },
    { key: 'Ctrl + 2', action: 'Jump to Stock In Register' },
    { key: 'Ctrl + 3', action: 'Jump to Delivery Register' },
    { key: 'Ctrl + 4', action: 'Jump to Cold Storage Inward Report' },
    { key: 'Ctrl + 5', action: 'Jump to Closing Stock Report' },
    { key: 'Ctrl + 6', action: 'Jump to Dimensions Matrix Report' },
    { key: 'Ctrl + 7', action: 'Jump to Cold Storage Facilities' },
    { key: 'Shift + ? / F1', action: 'Open Keyboard Shortcuts Guide' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-50 dark:bg-sky-950/50 rounded-xl text-sky-600 dark:text-sky-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                KEYBOARD SHORTCUTS
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Speed up workflows with fast hotkeys
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="p-5 overflow-y-auto space-y-2">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-xs"
            >
              <span className="text-slate-700 dark:text-slate-300 font-medium">
                {sc.action}
              </span>
              <kbd className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md font-mono text-[11px] font-bold text-sky-600 dark:text-sky-400 shadow-2xs shrink-0">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer uppercase"
          >
            DISMISS
          </button>
        </div>
      </div>
    </div>
  );
};
