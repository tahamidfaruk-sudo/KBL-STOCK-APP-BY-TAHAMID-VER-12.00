import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Printer,
  Download,
  Settings2,
  FileSpreadsheet,
  Check,
  Maximize2,
  Minimize2,
  Columns,
  Layers,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { exportToPdf, exportToExcel, ExportColumn } from '../../utils/exportUtils';
import { formatDisplayDate } from '../../utils/dateUtils';

export interface PrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  documentTitle?: string;
  subtitle?: string;
  period?: string;
  children?: React.ReactNode;
  onConfirmPrint?: () => void;
  columns?: ExportColumn[] | any[];
  data?: any[];
  summaryItems?: { label: string; value: any; highlight?: boolean }[];
  filename?: string;
  orientation?: string;
}

export const PrintPreviewModal: React.FC<PrintPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  documentTitle,
  subtitle,
  period,
  children,
  onConfirmPrint,
  columns,
  data,
  summaryItems,
  filename,
  orientation: initialOrientation = 'landscape',
}) => {
  const { companySettings, currentUser, addToast } = useApp();
  const [isPrinting, setIsPrinting] = useState<boolean>(false);

  // Print customization states
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(() => {
    if (initialOrientation === 'p' || initialOrientation === 'portrait') return 'portrait';
    return 'landscape';
  });
  const [density, setDensity] = useState<'compact' | 'normal' | 'comfortable'>('compact');
  const [zebraStriping, setZebraStriping] = useState<boolean>(true);
  const [borderStyle, setBorderStyle] = useState<'grid' | 'minimal'>('grid');
  const [showSummary, setShowSummary] = useState<boolean>(true);

  if (!isOpen) return null;

  const displayTitle = documentTitle || title || 'OFFICIAL INVENTORY REPORT';
  const effectiveFileName = filename || displayTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_');

  // Trigger browser print with visible feedback
  const handlePrint = () => {
    setIsPrinting(true);
    addToast?.('Preparing document for print... Opening print dialog.', 'info');

    try {
      if (onConfirmPrint) {
        onConfirmPrint();
      } else {
        window.focus();
        window.print();
      }
    } catch (err: any) {
      console.error('Print trigger error:', err);
      addToast?.('Print dialogue blocked or unsupported. Use the PDF download button instead.', 'warning');
    }

    setTimeout(() => {
      setIsPrinting(false);
    }, 2500);
  };

  // Direct PDF Download
  const handleDownloadPdf = () => {
    if (columns && data && columns.length > 0 && data.length > 0) {
      exportToPdf(
        data,
        columns,
        effectiveFileName,
        displayTitle,
        companySettings,
        orientation === 'landscape' ? 'l' : 'p',
        subtitle,
        { summaryItems: showSummary ? summaryItems : undefined }
      );
    } else {
      // Fallback to browser print if raw children table
      window.print();
    }
  };

  // Direct Excel Download
  const handleDownloadExcel = () => {
    if (columns && data && columns.length > 0 && data.length > 0) {
      exportToExcel(
        data,
        columns,
        effectiveFileName,
        displayTitle,
        companySettings,
        subtitle
      );
    }
  };

  // Density styles for table cells
  const densityCellClass = {
    compact: 'py-1 px-2 text-[10px]',
    normal: 'py-1.5 px-3 text-[11px]',
    comfortable: 'py-2 px-3.5 text-xs',
  }[density];

  const densityHeaderClass = {
    compact: 'py-1.5 px-2 text-[10px]',
    normal: 'py-2 px-3 text-[11px]',
    comfortable: 'py-2.5 px-3.5 text-xs',
  }[density];

  // Legal registered address from application settings
  const legalAddress =
    companySettings?.legalAddress ||
    companySettings?.address ||
    'Corporate Head Office: House-12, Road-04, Block-F, Banani, Dhaka-1213, Bangladesh';

  const companyName = companySettings?.companyName || 'KISHAN BOTANIX LTD.';
  const fiscalYear = companySettings?.fiscalYear || '2024-2025';
  const printDateStr = formatDisplayDate(new Date().toISOString());
  const printTimeStr = new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Derive effective period string
  const effectivePeriod =
    period ||
    (subtitle?.includes('Period:')
      ? subtitle.split('Period:')[1].trim()
      : subtitle || 'All Time to Present');

  const currentUserName = currentUser
    ? `${currentUser.fullName || currentUser.username || 'Authorized User'}${currentUser.roleName ? ` (${currentUser.roleName})` : ''}`
    : 'System Administrator';

  return createPortal(
    <div
      id="printable-modal-root"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-xs printable-modal-wrapper overflow-y-auto"
    >
      <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95vh] printable-modal">
        {/* Modal Top Bar / Action Controls (NO-PRINT) - Compact Single Row */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/90 no-print min-w-0">
          <div className="flex items-center gap-1.5 min-w-0 shrink">
            <div className="p-1 rounded-md bg-sky-100 text-sky-600 dark:bg-sky-950/80 dark:text-sky-400 shrink-0">
              <Printer className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider truncate max-w-[130px] md:max-w-[180px] xl:max-w-[240px]">
              {displayTitle}
            </h3>
            <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 font-bold shrink-0 whitespace-nowrap">
              {orientation.toUpperCase()} • A4
            </span>
          </div>

          {/* Setup / Option Toggles - Single Row Flex without wrapping */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 flex-nowrap whitespace-nowrap overflow-x-auto text-[10px]">
            {/* Page Orientation */}
            <div className="inline-flex rounded-md border border-slate-300 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setOrientation('portrait')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                  orientation === 'portrait'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Portrait Page Setup"
              >
                Portrait
              </button>
              <button
                type="button"
                onClick={() => setOrientation('landscape')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                  orientation === 'landscape'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Landscape Page Setup"
              >
                Landscape
              </button>
            </div>

            {/* Density / Font Size */}
            <div className="inline-flex rounded-md border border-slate-300 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setDensity('compact')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                  density === 'compact'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Compact 8.5pt font"
              >
                Compact
              </button>
              <button
                type="button"
                onClick={() => setDensity('normal')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                  density === 'normal'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Standard 10pt font"
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setDensity('comfortable')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors cursor-pointer ${
                  density === 'comfortable'
                    ? 'bg-white dark:bg-slate-700 text-sky-600 dark:text-white shadow-2xs font-bold'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
                title="Comfortable 11pt font"
              >
                Comfort
              </button>
            </div>

            {/* Zebra Striping Toggle */}
            <button
              type="button"
              onClick={() => setZebraStriping(!zebraStriping)}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-semibold transition-colors cursor-pointer shrink-0 ${
                zebraStriping
                  ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-bold'
                  : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
              title="Toggle alternating zebra row background"
            >
              <Layers className="w-3 h-3" />
              <span>Zebra {zebraStriping ? 'ON' : 'OFF'}</span>
            </button>

            {/* Grid / Minimal Borders */}
            <button
              type="button"
              onClick={() => setBorderStyle(borderStyle === 'grid' ? 'minimal' : 'grid')}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[10px] font-semibold transition-colors cursor-pointer shrink-0 ${
                borderStyle === 'grid'
                  ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 font-bold'
                  : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
              title="Toggle grid borders vs clean horizontal lines"
            >
              <Columns className="w-3 h-3" />
              <span>{borderStyle === 'grid' ? 'Grid' : 'Lines'}</span>
            </button>

            {/* Print & Export Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {columns && data && columns.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={handleDownloadExcel}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 border border-emerald-300 dark:border-emerald-800 transition-colors cursor-pointer shrink-0"
                    title="Export formatted Excel file"
                  >
                    <FileSpreadsheet className="w-3 h-3" />
                    <span>EXCEL</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 border border-rose-300 dark:border-rose-800 transition-colors cursor-pointer shrink-0"
                    title="Export high-resolution PDF"
                  >
                    <Download className="w-3 h-3" />
                    <span>PDF</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={handlePrint}
                disabled={isPrinting}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black text-white bg-sky-600 hover:bg-sky-700 active:scale-95 shadow-xs cursor-pointer transition-all disabled:opacity-75 shrink-0"
                title="Send directly to printer or save as PDF"
              >
                <Printer className={`w-3 h-3 ${isPrinting ? 'animate-spin' : ''}`} />
                <span>{isPrinting ? 'PRINTING...' : 'PRINT NOW'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors cursor-pointer shrink-0 ml-0.5"
                title="Close preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Document Preview Viewport */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 bg-slate-100 dark:bg-slate-950">
          <div
            className={`mx-auto bg-white text-slate-900 shadow-xl border border-slate-300 rounded-lg p-6 sm:p-8 md:p-10 font-sans print:shadow-none print:border-none print:p-0 print:m-0 print:max-w-none transition-all ${
              orientation === 'landscape' ? 'max-w-5xl' : 'max-w-3xl'
            }`}
          >
            {/* Clean Official Corporate Header */}
            <div className="border-b-2 border-slate-900 pb-3 mb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  {companySettings?.logoUrl ? (
                    <img
                      src={companySettings.logoUrl}
                      alt={companyName}
                      className="w-12 h-12 rounded-xl object-contain border border-slate-200 p-1 bg-white shrink-0 shadow-2xs"
                    />
                  ) : null}
                  <div className="space-y-0.5">
                    <h1 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900 leading-tight">
                      {companyName}
                    </h1>
                    {/* Official Legal Address from Settings */}
                    <p className="text-xs text-slate-700 font-medium">
                      {legalAddress}
                    </p>
                    <p className="text-[11px] text-slate-600">
                      Phone: {companySettings?.phone || '+880 1711-234567'} | Email:{' '}
                      {companySettings?.email || 'info@kisanbotanix.com'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-extrabold uppercase text-sky-800 tracking-wide">
                    {displayTitle}
                  </div>
                  <div className="text-[11px] font-semibold text-slate-700 mt-0.5">
                    Fiscal Year: {fiscalYear}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    Printed: {printDateStr} {printTimeStr}
                  </div>
                  <div className="text-[10px] text-slate-700 font-bold mt-0.5">
                    Period: {effectivePeriod}
                  </div>
                  <div className="text-[10px] text-slate-600 font-medium mt-0.5">
                    Printed by: {currentUserName}
                  </div>
                </div>
              </div>
            </div>

            {/* Optional Summary Cards - Centered & Middle-Aligned Summary Boxes */}
            {showSummary && summaryItems && summaryItems.length > 0 && (
              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mb-5">
                {summaryItems.map((s, idx) => (
                  <div
                    key={idx}
                    className="flex-1 min-w-[150px] max-w-[240px] px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-center shadow-2xs print:bg-slate-50 print:border-slate-300"
                  >
                    <p className="text-[10.5px] font-bold text-slate-600 uppercase tracking-wider">
                      {s.label}
                    </p>
                    <p className="text-sm sm:text-base font-black text-slate-900 mt-1">
                      {s.value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Printable Content Body */}
            <div className="printable-document-body overflow-x-auto">
              {columns && data && columns.length > 0 ? (
                <table
                  className={`w-full text-left border-collapse border ${
                    borderStyle === 'grid' ? 'border-slate-300' : 'border-b border-t border-slate-300'
                  }`}
                >
                  <thead>
                    <tr className="bg-slate-200 text-slate-800 font-bold uppercase tracking-wider">
                      {columns.map((col, ci) => (
                        <th
                          key={ci}
                          className={`${densityHeaderClass} ${
                            borderStyle === 'grid' ? 'border border-slate-700' : 'border-b border-slate-700'
                          } ${
                            col.isNumeric || col.align === 'right'
                              ? 'text-right pr-3'
                              : 'text-left pl-3'
                          }`}
                        >
                          {col.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row, ri) => {
                      const isTotalRow =
                        row.isTotal ||
                        String(row[columns[0]?.key] || '').toUpperCase().includes('TOTAL') ||
                        Object.values(row).some((v) => String(v).toUpperCase() === 'TOTAL');

                      return (
                        <tr
                          key={ri}
                          className={`transition-colors ${
                            isTotalRow
                              ? 'table-total-row bg-slate-100 font-bold border-t-2 border-b-2 border-slate-400 text-slate-900'
                              : zebraStriping && ri % 2 === 1
                              ? 'bg-slate-50/80 hover:bg-sky-50/40'
                              : 'bg-white hover:bg-sky-50/40'
                          }`}
                        >
                          {columns.map((col, ci) => {
                            const val = row[col.key] !== undefined && row[col.key] !== null ? String(row[col.key]) : '';
                            const isTotalCell = isTotalRow && val.toUpperCase() === 'TOTAL';

                            return (
                              <td
                                key={ci}
                                className={`${densityCellClass} ${
                                  borderStyle === 'grid' ? 'border border-slate-200' : 'border-b border-slate-100'
                                } ${
                                  isTotalCell
                                    ? 'text-left pl-3 font-black uppercase tracking-wider'
                                    : col.isNumeric || col.align === 'right'
                                    ? 'text-right pr-3 font-semibold tabular-nums text-slate-800'
                                    : 'text-left pl-3'
                                } ${isTotalRow ? 'font-black' : ''}`}
                              >
                                {val}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                children || (
                  <div className="text-center py-10 text-slate-500 text-sm">
                    Document data ready for printing.
                  </div>
                )
              )}
            </div>

            {/* Print Footer with Printed by User & Timestamp */}
            <div className="mt-6 pt-3 border-t border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-1 text-[10px] text-slate-600 font-mono">
              <span>System Generated Official Inventory Record • {companyName}</span>
              <span>Printed by: {currentUserName} • Date: {printDateStr} {printTimeStr}</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
