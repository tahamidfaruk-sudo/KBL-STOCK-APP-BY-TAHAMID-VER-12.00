import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TableDensity } from '../../types';
import {
  CalendarRange,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { exportToExcel, exportToPdf, ExportColumn } from '../../utils/exportUtils';
import { TablePagination } from '../common/TablePagination';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { ReportButtonGroup } from '../common/ReportButtonGroup';
import { formatDisplayDate } from '../../utils/dateUtils';

export const DayWiseInOutStockReportView: React.FC = () => {
  const {
    stockTransactions,
    deliveryTransactions,
    coldStorages,
    companySettings,
    addToast,
  } = useApp();

  const [density, setDensity] = useState<TableDensity>('compact');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Month / Date Range State (Defaults to current active month)
  const today = new Date();
  const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  const [selectedMonth, setSelectedMonth] = useState<string>(currentYearMonth);
  const [selectedStorage, setSelectedStorage] = useState<string>('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(31);

  // Generate all days in the selected month
  const reportDays = useMemo(() => {
    let year = today.getFullYear();
    let month = today.getMonth() + 1;

    if (selectedMonth) {
      const [y, m] = selectedMonth.split('-').map(Number);
      if (y && m) {
        year = y;
        month = m;
      }
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const allDates: string[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      allDates.push(dStr);
    }

    // Filter approved transactions
    const stockIn = stockTransactions.filter((s) => {
      if (s.status !== 'approved') return false;
      if (selectedStorage && s.coldStorageId !== selectedStorage) return false;
      return true;
    });

    const deliveryOut = deliveryTransactions.filter((d) => {
      if (d.status !== 'approved' && d.status !== 'completed') return false;
      if (selectedStorage && d.coldStorageId !== selectedStorage) return false;
      return true;
    });

    // Calculate baseline prior to this month start
    const monthStartDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const priorInBags = stockIn
      .filter((s) => s.date < monthStartDate)
      .reduce((sum, s) => sum + s.sackQuantity, 0);
    const priorInKg = stockIn
      .filter((s) => s.date < monthStartDate)
      .reduce((sum, s) => sum + (s.totalKg || s.sackQuantity * (s.kgPerBag || 50)), 0);
    const priorOutBags = deliveryOut
      .filter((d) => d.date < monthStartDate)
      .reduce((sum, d) => sum + d.sackQuantity, 0);
    const priorOutKg = deliveryOut
      .filter((d) => d.date < monthStartDate)
      .reduce((sum, d) => sum + (d.totalKg || d.sackQuantity * (d.kgPerBag || 50)), 0);

    let runningClosingBags = priorInBags - priorOutBags;
    let runningClosingKg = priorInKg - priorOutKg;

    return allDates.map((dateStr, idx) => {
      const dayStock = stockIn.filter((s) => s.date === dateStr);
      const dayDel = deliveryOut.filter((d) => d.date === dateStr);

      const inBags = dayStock.reduce((sum, s) => sum + s.sackQuantity, 0);
      const inKg = dayStock.reduce((sum, s) => sum + (s.totalKg || s.sackQuantity * (s.kgPerBag || 50)), 0);
      const inMt = Number((inKg / 1000).toFixed(3));

      const outBags = dayDel.reduce((sum, d) => sum + d.sackQuantity, 0);
      const outKg = dayDel.reduce((sum, d) => sum + (d.totalKg || d.sackQuantity * (d.kgPerBag || 50)), 0);
      const outMt = Number((outKg / 1000).toFixed(3));

      runningClosingBags += inBags - outBags;
      runningClosingKg += inKg - outKg;
      const closingMt = Number((runningClosingKg / 1000).toFixed(3));

      const hasActivity = inBags > 0 || outBags > 0;

      return {
        sl: idx + 1,
        date: dateStr,
        hasActivity,
        // Raw values
        inBags,
        inKg,
        inMt,
        outBags,
        outKg,
        outMt,
        closingBags: runningClosingBags,
        closingKg: runningClosingKg,
        closingMt,
      };
    });
  }, [selectedMonth, selectedStorage, stockTransactions, deliveryTransactions, today]);

  const monthTotalInBags = useMemo(() => reportDays.reduce((sum, r) => sum + r.inBags, 0), [reportDays]);
  const monthTotalInMt = useMemo(() => reportDays.reduce((sum, r) => sum + r.inMt, 0), [reportDays]);
  const monthTotalOutBags = useMemo(() => reportDays.reduce((sum, r) => sum + r.outBags, 0), [reportDays]);
  const monthTotalOutMt = useMemo(() => reportDays.reduce((sum, r) => sum + r.outMt, 0), [reportDays]);
  const finalClosingBags = reportDays.length > 0 ? reportDays[reportDays.length - 1].closingBags : 0;
  const finalClosingMt = reportDays.length > 0 ? reportDays[reportDays.length - 1].closingMt : 0;

  const totalPages = Math.max(1, Math.ceil(reportDays.length / pageSize));
  const effectivePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedRows = reportDays.slice((effectivePage - 1) * pageSize, effectivePage * pageSize);

  const exportColumns: ExportColumn[] = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Stock In (Bags)', key: 'inBagsDisplay', width: 16, isNumeric: true },
    { header: 'Stock In (KG)', key: 'inKgDisplay', width: 16, isNumeric: true },
    { header: 'Stock In (MT)', key: 'inMtDisplay', width: 14, isNumeric: true },
    { header: 'Delivery (Bags)', key: 'outBagsDisplay', width: 16, isNumeric: true },
    { header: 'Delivery (KG)', key: 'outKgDisplay', width: 16, isNumeric: true },
    { header: 'Delivery (MT)', key: 'outMtDisplay', width: 14, isNumeric: true },
    { header: 'Closing Stock (Bags)', key: 'closingBagsDisplay', width: 18, isNumeric: true },
    { header: 'Closing Stock (MT)', key: 'closingMtDisplay', width: 16, isNumeric: true },
  ];

  const exportData = useMemo(() => {
    return reportDays.map((r) => ({
      ...r,
      inBagsDisplay: r.inBags > 0 ? r.inBags.toLocaleString() : '-',
      inKgDisplay: r.inKg > 0 ? r.inKg.toLocaleString() : '-',
      inMtDisplay: r.inMt > 0 ? r.inMt.toFixed(3) : '-',
      outBagsDisplay: r.outBags > 0 ? r.outBags.toLocaleString() : '-',
      outKgDisplay: r.outKg > 0 ? r.outKg.toLocaleString() : '-',
      outMtDisplay: r.outMt > 0 ? r.outMt.toFixed(3) : '-',
      closingBagsDisplay: r.closingBags.toLocaleString(),
      closingMtDisplay: r.closingMt.toFixed(3),
    }));
  }, [reportDays]);

  const handleExportExcel = () => {
    exportToExcel(
      exportData,
      exportColumns,
      `DAY_WISE_IN_OUT_STOCK_REPORT_${selectedMonth}`,
      'Day-wise In, Out & Closing Stock',
      companySettings,
      `Month: ${selectedMonth} | Total In: ${monthTotalInBags.toLocaleString()} Bags | Total Delivered: ${monthTotalOutBags.toLocaleString()} Bags | Ending Balance: ${finalClosingBags.toLocaleString()} Bags`
    );
    addToast('Day-wise In, Out & Stock Report exported to Excel!', 'success');
  };

  const handleExportPdf = () => {
    exportToPdf(
      exportData,
      exportColumns,
      `DAY_WISE_IN_OUT_STOCK_REPORT_${selectedMonth}`,
      'Day-wise Inbound, Outbound & Closing Stock Ledger',
      companySettings,
      'l',
      `Month: ${selectedMonth} | In: ${monthTotalInBags.toLocaleString()} Bags | Out: ${monthTotalOutBags.toLocaleString()} Bags | Balance: ${finalClosingBags.toLocaleString()} Bags`
    );
    addToast('Day-wise In, Out & Stock Report exported to PDF!', 'success');
  };

  return (
    <div className="space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-sky-50 dark:bg-sky-950/40 text-slate-900 dark:text-white rounded-xl border border-sky-200 dark:border-sky-800/60 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
            <CalendarRange className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase">
              DAY-WISE IN, OUT & STOCK REPORT
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Complete daily ledger tracking inbound receipts, outward deliveries, and end-of-day closing stock
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Density toggle buttons */}
          <div
            className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs text-xs font-semibold"
            role="group"
            aria-label="Table density toggle"
          >
            <button
              type="button"
              onClick={() => setDensity('compact')}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer uppercase ${
                density === 'compact'
                  ? 'bg-sky-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              COMPACT
            </button>
            <button
              type="button"
              onClick={() => setDensity('normal')}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer uppercase ${
                density === 'normal'
                  ? 'bg-sky-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              NORMAL
            </button>
            <button
              type="button"
              onClick={() => setDensity('comfortable')}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer uppercase ${
                density === 'comfortable'
                  ? 'bg-sky-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              COMFORTABLE
            </button>
          </div>

          <ReportButtonGroup
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            onPrint={() => setIsPreviewOpen(true)}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            MONTH TOTAL STOCK IN
          </span>
          <div className="mt-1 text-base font-black text-sky-600 dark:text-sky-400">
            {monthTotalInBags.toLocaleString()} <span className="text-xs font-bold text-slate-500">BAGS</span>
          </div>
          <div className="text-[11px] text-slate-500 font-semibold">{monthTotalInMt.toFixed(3)} MT</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            MONTH TOTAL DISPATCHED
          </span>
          <div className="mt-1 text-base font-black text-amber-600 dark:text-amber-400">
            {monthTotalOutBags.toLocaleString()} <span className="text-xs font-bold text-slate-500">BAGS</span>
          </div>
          <div className="text-[11px] text-slate-500 font-semibold">{monthTotalOutMt.toFixed(3)} MT</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
            FINAL CLOSING STOCK
          </span>
          <div className="mt-1 text-base font-black text-emerald-700 dark:text-emerald-300">
            {finalClosingBags.toLocaleString()} <span className="text-xs font-bold text-emerald-600">BAGS</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">{finalClosingMt.toFixed(3)} MT</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            SELECTED MONTH
          </span>
          <div className="mt-1 text-base font-black text-slate-800 dark:text-slate-100">
            {selectedMonth}
          </div>
          <div className="text-[11px] text-slate-500 font-semibold">{reportDays.length} Days in Period</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 bg-indigo-100 dark:bg-indigo-950/50 rounded-xl border border-indigo-300 dark:border-indigo-800 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
            SELECT MONTH:
          </span>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => {
              setSelectedMonth(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-slate-100"
          />

          <select
            value={selectedStorage}
            onChange={(e) => {
              setSelectedStorage(e.target.value);
              setCurrentPage(1);
            }}
            className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium"
          >
            <option value="">All Cold Storages</option>
            {coldStorages.map((cs) => (
              <option key={cs.id} value={cs.id}>
                {cs.name} ({cs.code})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => {
              setSelectedMonth(currentYearMonth);
              setSelectedStorage('');
            }}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-2xs"
            title="Reset to current month"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing all {reportDays.length} calendar days with activity indicators
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/90 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-700 text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider select-none">
                <th className="p-2.5 sm:px-3 text-left pl-3">
                  <span>DATE</span>
                </th>
                <th className="p-2.5 sm:px-3 text-right pr-3 text-blue-700 dark:text-blue-300">
                  <span>STOCK IN (BAGS)</span>
                </th>
                <th className="p-2.5 sm:px-3 text-right pr-3 text-purple-700 dark:text-purple-300">
                  <span>STOCK IN (KG)</span>
                </th>
                <th className="p-2.5 sm:px-3 text-right pr-3 text-emerald-700 dark:text-emerald-300">
                  <span>STOCK IN (MT)</span>
                </th>
                <th className="p-2.5 sm:px-3 text-right pr-3 text-amber-700 dark:text-amber-300">
                  <span>DELIVERY (BAGS)</span>
                </th>
                <th className="p-2.5 sm:px-3 text-right pr-3 text-purple-700 dark:text-purple-300">
                  <span>DELIVERY (KG)</span>
                </th>
                <th className="p-2.5 sm:px-3 text-right pr-3 text-emerald-700 dark:text-emerald-300">
                  <span>DELIVERY (MT)</span>
                </th>
                <th className="p-2.5 sm:px-3 text-right pr-3 text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 font-black">
                  <span>CLOSING STOCK (BAGS)</span>
                </th>
                <th className="p-2.5 sm:px-3 text-right pr-3 text-emerald-800 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 font-black">
                  <span>CLOSING (MT)</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedRows.map((row) => (
                <tr
                  key={row.date}
                  className={`hover:bg-sky-50/40 dark:hover:bg-sky-950/20 transition-colors ${
                    row.hasActivity ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-900/40'
                  } ${density === 'compact' ? 'py-1' : density === 'comfortable' ? 'py-2.5' : 'py-1.5'}`}
                >
                  <td className="p-2 sm:px-3 text-left pl-3 font-bold text-slate-800 dark:text-slate-100 tabular-nums">
                    <div className="flex items-center gap-1.5">
                      {row.hasActivity && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />}
                      <span>{formatDisplayDate(row.date)}</span>
                    </div>
                  </td>
                  <td className="p-2 sm:px-3 text-right pr-3 font-semibold text-blue-700 dark:text-blue-400 tabular-nums">
                    {row.inBags > 0 ? row.inBags.toLocaleString() : '-'}
                  </td>
                  <td className="p-2 sm:px-3 text-right pr-3 font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                    {row.inKg > 0 ? row.inKg.toLocaleString() : '-'}
                  </td>
                  <td className="p-2 sm:px-3 text-right pr-3 font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                    {row.inMt > 0 ? row.inMt.toFixed(3) : '-'}
                  </td>
                  <td className="p-2 sm:px-3 text-right pr-3 font-semibold text-amber-700 dark:text-amber-400 tabular-nums">
                    {row.outBags > 0 ? row.outBags.toLocaleString() : '-'}
                  </td>
                  <td className="p-2 sm:px-3 text-right pr-3 font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                    {row.outKg > 0 ? row.outKg.toLocaleString() : '-'}
                  </td>
                  <td className="p-2 sm:px-3 text-right pr-3 font-bold text-slate-800 dark:text-slate-200 tabular-nums">
                    {row.outMt > 0 ? row.outMt.toFixed(3) : '-'}
                  </td>
                  <td className="p-1.5 sm:px-3 text-right pr-3 border-l-2 border-emerald-500/70 dark:border-emerald-600/80 bg-emerald-50/60 dark:bg-emerald-950/25 tabular-nums">
                    <span className="inline-flex items-center justify-end px-1.5 py-0.5 rounded border border-emerald-500/60 dark:border-emerald-500/70 bg-white/90 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-100 font-bold shadow-2xs">
                      {row.closingBags.toLocaleString()}
                    </span>
                  </td>
                  <td className="p-1.5 sm:px-3 text-right pr-3 border-r-2 border-teal-500/70 dark:border-teal-600/80 bg-teal-50/60 dark:bg-teal-950/25 tabular-nums">
                    <span className="inline-flex items-center justify-end px-2 py-0.5 rounded border-2 border-teal-600 dark:border-teal-400 bg-teal-100/90 dark:bg-teal-950/80 text-teal-950 dark:text-teal-100 font-black shadow-2xs">
                      {row.closingMt.toFixed(3)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Footer Summary */}
            <tfoot>
              <tr className="bg-slate-100 dark:bg-slate-800/90 font-black text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                <td className="p-2.5 sm:px-3 text-left pl-3 uppercase tracking-wider">
                  MONTH TOTAL
                </td>
                <td className="p-2.5 sm:px-3 text-right pr-3 text-blue-700 dark:text-blue-300 tabular-nums text-sm">
                  {monthTotalInBags.toLocaleString()}
                </td>
                <td className="p-2.5 sm:px-3 text-right pr-3 tabular-nums text-sm">
                  {reportDays.reduce((s, r) => s + r.inKg, 0).toLocaleString()}
                </td>
                <td className="p-2.5 sm:px-3 text-right pr-3 tabular-nums text-sm">
                  {monthTotalInMt.toFixed(3)}
                </td>
                <td className="p-2.5 sm:px-3 text-right pr-3 text-amber-700 dark:text-amber-300 tabular-nums text-sm">
                  {monthTotalOutBags.toLocaleString()}
                </td>
                <td className="p-2.5 sm:px-3 text-right pr-3 tabular-nums text-sm">
                  {reportDays.reduce((s, r) => s + r.outKg, 0).toLocaleString()}
                </td>
                <td className="p-2.5 sm:px-3 text-right pr-3 tabular-nums text-sm">
                  {monthTotalOutMt.toFixed(3)}
                </td>
                <td className="p-2 sm:px-3 text-right pr-3 border-l-2 border-emerald-600 dark:border-emerald-500 bg-emerald-100/70 dark:bg-emerald-950/60 tabular-nums">
                  <span className="inline-flex items-center justify-end px-1.5 py-0.5 rounded border border-emerald-600/70 dark:border-emerald-500 bg-white/90 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100 font-black shadow-2xs">
                    {finalClosingBags.toLocaleString()}
                  </span>
                </td>
                <td className="p-2 sm:px-3 text-right pr-3 border-r-2 border-teal-600 dark:border-teal-500 bg-teal-100/70 dark:bg-teal-950/60 tabular-nums">
                  <span className="inline-flex items-center justify-end px-2 py-0.5 rounded border-2 border-teal-600 dark:border-teal-400 bg-teal-100 dark:bg-teal-950 text-teal-950 dark:text-teal-100 font-black shadow-2xs">
                    {finalClosingMt.toFixed(3)}
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Pagination if month exceeds 31 */}
        {reportDays.length > pageSize && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800">
            <TablePagination
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalRecords={reportDays.length}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        documentTitle="DAY-WISE IN, OUT & CLOSING STOCK REPORT"
        subtitle={`Month: ${selectedMonth}`}
        columns={exportColumns}
        data={exportData}
        summaryItems={[
          { label: 'Month Stock In (Bags)', value: monthTotalInBags.toLocaleString() },
          { label: 'Month Delivery (Bags)', value: monthTotalOutBags.toLocaleString() },
          { label: 'Ending Closing Stock', value: `${finalClosingBags.toLocaleString()} Bags` },
          { label: 'Ending Closing (MT)', value: `${finalClosingMt.toFixed(3)} MT` },
        ]}
      />
    </div>
  );
};
