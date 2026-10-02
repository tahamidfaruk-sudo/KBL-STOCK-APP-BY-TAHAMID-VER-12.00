import React from 'react';
import { X, Printer } from 'lucide-react';

interface DetailField {
  label: string;
  value: any;
  highlight?: boolean;
}

interface RecordDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  fields: DetailField[];
}

export const RecordDetailsModal: React.FC<RecordDetailsModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  fields,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            {icon && <div className="p-2 bg-sky-50 dark:bg-sky-950/50 rounded-xl">{icon}</div>}
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fields.map((field, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border ${
                  field.highlight
                    ? 'bg-sky-50/70 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/80'
                    : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  {field.label}
                </div>
                <div
                  className={`mt-1 text-xs font-bold ${
                    field.highlight
                      ? 'text-sky-700 dark:text-sky-300 text-sm'
                      : 'text-slate-800 dark:text-slate-100'
                  }`}
                >
                  {field.value !== undefined && field.value !== null && field.value !== ''
                    ? String(field.value)
                    : '-'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>PRINT</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 shadow-2xs transition-colors cursor-pointer uppercase"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
