import React from 'react';
import { Printer, Download, FileText } from 'lucide-react';

interface ReportButtonGroupProps {
  onPrint?: () => void;
  onExportExcel?: () => void;
  onExportPdf?: () => void;
  disabled?: boolean;
  iconOnly?: boolean;
}

export const ReportButtonGroup: React.FC<ReportButtonGroupProps> = ({
  onPrint,
  onExportExcel,
  onExportPdf,
  disabled = false,
  iconOnly = false,
}) => {
  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      {onExportExcel && (
        <button
          type="button"
          onClick={onExportExcel}
          disabled={disabled}
          className={`${
            iconOnly ? 'p-1.5' : 'px-2.5 py-1'
          } inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg text-emerald-700 dark:text-emerald-400 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 border border-slate-300 dark:border-slate-600 shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none`}
          title="Export report data to Microsoft Excel"
          aria-label="Export to Excel"
        >
          <Download className="w-4 h-4" />
          {!iconOnly && <span className="uppercase text-[11px] font-bold">EXCEL</span>}
        </button>
      )}

      {onExportPdf && (
        <button
          type="button"
          onClick={onExportPdf}
          disabled={disabled}
          className={`${
            iconOnly ? 'p-1.5' : 'px-2.5 py-1'
          } inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg text-rose-700 dark:text-rose-400 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 border border-slate-300 dark:border-slate-600 shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none`}
          title="Export report document as PDF"
          aria-label="Export as PDF"
        >
          <FileText className="w-4 h-4" />
          {!iconOnly && <span className="uppercase text-[11px] font-bold">PDF</span>}
        </button>
      )}

      {onPrint && (
        <button
          type="button"
          onClick={onPrint}
          disabled={disabled}
          className={`${
            iconOnly ? 'p-1.5' : 'px-2.5 py-1'
          } inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 border border-slate-300 dark:border-slate-600 shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none`}
          title="Print preview and print report"
          aria-label="Print Report"
        >
          <Printer className="w-4 h-4" />
          {!iconOnly && <span className="uppercase text-[11px] font-bold">PRINT</span>}
        </button>
      )}
    </div>
  );
};
