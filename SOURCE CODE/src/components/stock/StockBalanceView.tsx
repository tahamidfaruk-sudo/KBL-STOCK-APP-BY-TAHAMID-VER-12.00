import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateStockBalanceMatrix, StockBalanceMatrixItem } from '../../utils/stockEngine';
import { sortData } from '../../utils/sortUtils';
import { exportToExcel, exportToPdf, ExportColumn } from '../../utils/exportUtils';
import { TablePagination } from '../common/TablePagination';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { ReportButtonGroup } from '../common/ReportButtonGroup';
import { SortIcon } from '../common/SortIcon';
import { TableDensity } from '../../types';
import { Scale, Search, Warehouse, Sprout, Filter, RotateCcw } from 'lucide-react';

export const StockBalanceView: React.FC = () => {
  const {
    stockTransactions,
    deliveryTransactions,
    coldStorages,
    varieties,
    seedClasses,
    grades,
    companySettings,
    addToast,
  } = useApp();

  const [density, setDensity] = useState<TableDensity>('compact');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [selectedVariety, setSelectedVariety] = useState('');
  const [sortKey, setSortKey] = useState<string>('coldStorageName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Compute live matrix
  const matrix = useMemo(() => {
    return calculateStockBalanceMatrix(
      stockTransactions,
      deliveryTransactions,
      coldStorages,
      varieties,
      seedClasses,
      grades
    );
  }, [stockTransactions, deliveryTransactions, coldStorages, varieties, seedClasses, grades]);

  // Filtered list
  const filteredList = useMemo(() => {
    return matrix.filter((item) => {
      if (selectedStorage && item.coldStorageId !== selectedStorage) return false;
      if (selectedVariety && item.varietyId !== selectedVariety) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.coldStorageName.toLowerCase().includes(q) ||
          item.varietyName.toLowerCase().includes(q) ||
          item.className.toLowerCase().includes(q) ||
          item.gradeName.toLowerCase().includes(q) ||
          (item.coldStorageCode && item.coldStorageCode.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [matrix, selectedStorage, selectedVariety, searchQuery]);

  // Sorted list
  const sortedList = useMemo(() => {
    return sortData(filteredList, sortKey, sortDir);
  }, [filteredList, sortKey, sortDir]);

  // Totals
  const totalInboundBags = useMemo(() => filteredList.reduce((acc, i) => acc + i.inboundBags, 0), [filteredList]);
  const totalInboundMt = useMemo(() => filteredList.reduce((acc, i) => acc + i.inboundMt, 0), [filteredList]);
  const totalDeliveredBags = useMemo(() => filteredList.reduce((acc, i) => acc + i.deliveredBags, 0), [filteredList]);
  const totalDeliveredMt = useMemo(() => filteredList.reduce((acc, i) => acc + i.deliveredMt, 0), [filteredList]);
  const totalBalanceBags = useMemo(() => filteredList.reduce((acc, i) => acc + i.balanceBags, 0), [filteredList]);
  const totalBalanceMt = useMemo(() => filteredList.reduce((acc, i) => acc + i.balanceMt, 0), [filteredList]);

  // Pagination
  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedList.slice(start, start + pageSize);
  }, [sortedList, currentPage, pageSize]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const exportColumns: ExportColumn[] = [
    { header: 'Cold Storage Facility', key: 'coldStorageName', width: 28, align: 'left' },
    { header: 'Code', key: 'coldStorageCode', width: 12, align: 'left' },
    { header: 'Potato Variety', key: 'varietyName', width: 18, align: 'left' },
    { header: 'Seed Class', key: 'className', width: 18, align: 'left' },
    { header: 'Grade', key: 'gradeName', width: 18, align: 'left' },
    { header: 'Stock In (Bags)', key: 'inboundBags', width: 16, isNumeric: true, align: 'right' },
    { header: 'Stock In (MT)', key: 'inboundMt', width: 14, isNumeric: true, align: 'right' },
    { header: 'Stock Out (Bags)', key: 'deliveredBags', width: 16, isNumeric: true, align: 'right' },
    { header: 'Stock Out (MT)', key: 'deliveredMt', width: 14, isNumeric: true, align: 'right' },
    { header: 'Current Balance (Bags)', key: 'balanceBags', width: 18, isNumeric: true, align: 'right' },
    { header: 'Balance (MT)', key: 'balanceMt', width: 14, isNumeric: true, align: 'right' },
  ];

  const handleExportExcel = () => {
    exportToExcel(
      filteredList,
      exportColumns,
      `STOCK_BALANCE_REPORT_${new Date().toISOString().split('T')[0]}`,
      'Stock Balance Ledger',
      companySettings,
      `Current Stock Inventory Balance - Total Remaining: ${totalBalanceBags.toLocaleString()} Bags (${totalBalanceMt.toFixed(2)} MT)`
    );
    addToast('Stock Balance exported to Excel successfully!', 'success');
  };

  const handleExportPdf = () => {
    exportToPdf(
      filteredList.map((item) => ({
        ...item,
        inboundBags: item.inboundBags.toLocaleString(),
        inboundMt: item.inboundMt.toFixed(2),
        deliveredBags: item.deliveredBags.toLocaleString(),
        deliveredMt: item.deliveredMt.toFixed(2),
        balanceBags: item.balanceBags.toLocaleString(),
        balanceMt: item.balanceMt.toFixed(2),
      })),
      exportColumns,
      `STOCK_BALANCE_REPORT_${new Date().toISOString().split('T')[0]}`,
      'Potato Seed Current Stock Balance Register',
      companySettings,
      'l',
      `Active Season | Total Bags: ${totalBalanceBags.toLocaleString()} | Total MT: ${totalBalanceMt.toFixed(2)}`
    );
    addToast('Stock Balance exported to PDF successfully!', 'success');
  };

  return (
    <div className="space-y-3.5">
      {/* Page Header Card */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-sky-50 dark:bg-sky-950/40 text-slate-900 dark:text-white rounded-xl border border-sky-200 dark:border-sky-800/60 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-sky-50 dark:bg-sky-950/50 rounded-xl text-sky-600 dark:text-sky-400">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase">
              CURRENT STOCK BALANCE REGISTER
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Live reconciliation of Stock In vs Delivery Out across cold storage facilities
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

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            TOTAL RECEIVED (STOCK IN)
          </span>
          <div className="mt-1 text-base font-black text-sky-600 dark:text-sky-400">
            {totalInboundBags.toLocaleString()} <span className="text-xs font-bold text-slate-500">BAGS</span>
          </div>
          <div className="text-[11px] text-slate-500 font-semibold">{totalInboundMt.toFixed(2)} MT</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            TOTAL DISPATCHED (DELIVERED)
          </span>
          <div className="mt-1 text-base font-black text-amber-600 dark:text-amber-400">
            {totalDeliveredBags.toLocaleString()} <span className="text-xs font-bold text-slate-500">BAGS</span>
          </div>
          <div className="text-[11px] text-slate-500 font-semibold">{totalDeliveredMt.toFixed(2)} MT</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
            CURRENT BALANCE (REMAINING)
          </span>
          <div className="mt-1 text-base font-black text-emerald-700 dark:text-emerald-300">
            {totalBalanceBags.toLocaleString()} <span className="text-xs font-bold text-emerald-600">BAGS</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">{totalBalanceMt.toFixed(2)} MT</div>
        </div>

        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
            ACTIVE BATCH COMBINATIONS
          </span>
          <div className="mt-1 text-base font-black text-slate-800 dark:text-slate-100">
            {filteredList.length} <span className="text-xs font-bold text-slate-500">LOTS</span>
          </div>
          <div className="text-[11px] text-slate-500 font-semibold">Across {coldStorages.length} Storages</div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-3 bg-indigo-100 dark:bg-indigo-950/50 rounded-xl border border-indigo-300 dark:border-indigo-800 shadow-xs space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex-1 min-w-[240px] relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
              aria-label="Search records"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedStorage}
              onChange={(e) => setSelectedStorage(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">All Cold Storages</option>
              {coldStorages.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {cs.name} ({cs.code})
                </option>
              ))}
            </select>

            <select
              value={selectedVariety}
              onChange={(e) => setSelectedVariety(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">All Varieties</option>
              {varieties.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>

            {(searchQuery || selectedStorage || selectedVariety) && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedStorage('');
                  setSelectedVariety('');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>RESET</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/80 text-[11px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider select-none">
                <th
                  onClick={() => handleSort('coldStorageName')}
                  className="py-2.5 pl-3 pr-2 text-left cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>COLD STORAGE</span>
                    <SortIcon field="coldStorageName" currentField={sortKey} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('varietyName')}
                  className="py-2.5 pl-3 pr-2 text-left cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>VARIETY</span>
                    <SortIcon field="varietyName" currentField={sortKey} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('className')}
                  className="py-2.5 pl-3 pr-2 text-left cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>SEED CLASS</span>
                    <SortIcon field="className" currentField={sortKey} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('gradeName')}
                  className="py-2.5 pl-3 pr-2 text-left cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <span>GRADE</span>
                    <SortIcon field="gradeName" currentField={sortKey} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('inboundBags')}
                  className="py-2.5 pl-2 pr-3 text-right cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>STOCK IN (BAGS)</span>
                    <SortIcon field="inboundBags" currentField={sortKey} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('deliveredBags')}
                  className="py-2.5 pl-2 pr-3 text-right cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span>DELIVERED (BAGS)</span>
                    <SortIcon field="deliveredBags" currentField={sortKey} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('balanceBags')}
                  className="py-2.5 pl-2 pr-3 text-right cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors bg-sky-50/50 dark:bg-sky-950/30"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-sky-700 dark:text-sky-300 font-black">BALANCE (BAGS)</span>
                    <SortIcon field="balanceBags" currentField={sortKey} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('balanceMt')}
                  className="py-2.5 pl-2 pr-3 text-right cursor-pointer hover:bg-slate-200/60 dark:hover:bg-slate-700/60 transition-colors bg-sky-50/50 dark:bg-sky-950/30"
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span className="text-sky-700 dark:text-sky-300 font-black">BALANCE (MT)</span>
                    <SortIcon field="balanceMt" currentField={sortKey} direction={sortDir} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {paginatedList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    No matching stock balance records found.
                  </td>
                </tr>
              ) : (
                paginatedList.map((item, idx) => (
                  <tr
                    key={`${item.coldStorageId}-${item.varietyId}-${item.classId}-${item.gradeId}-${idx}`}
                    className={`hover:bg-sky-50/30 dark:hover:bg-sky-950/20 transition-colors ${
                      density === 'compact' ? 'py-1' : density === 'comfortable' ? 'py-3' : 'py-2'
                    }`}
                  >
                    <td className="p-2.5 pl-3 sm:px-3 sm:pl-3 text-left font-bold text-slate-800 dark:text-slate-100">
                      <div>{item.coldStorageName}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{item.coldStorageCode}</span>
                    </td>
                    <td className="p-2.5 pl-3 sm:px-3 sm:pl-3 text-left font-semibold text-slate-700 dark:text-slate-200">
                      {item.varietyName}
                    </td>
                    <td className="p-2.5 pl-3 sm:px-3 sm:pl-3 text-left text-slate-600 dark:text-slate-300 font-medium">
                      {item.className}
                    </td>
                    <td className="p-2.5 pl-3 sm:px-3 sm:pl-3 text-left text-slate-600 dark:text-slate-300 font-medium">
                      {item.gradeName}
                    </td>
                    <td className="p-2.5 pr-3 sm:px-3 sm:pr-3 text-right font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                      {item.inboundBags.toLocaleString()}
                    </td>
                    <td className="p-2.5 pr-3 sm:px-3 sm:pr-3 text-right font-semibold text-amber-600 dark:text-amber-400 tabular-nums">
                      {item.deliveredBags > 0 ? item.deliveredBags.toLocaleString() : '-'}
                    </td>
                    <td className="p-2 pr-3 sm:px-3 sm:pr-3 text-right border-l-2 border-emerald-500/70 dark:border-emerald-600/80 bg-emerald-50/50 dark:bg-emerald-950/20 tabular-nums">
                      <span className="inline-flex items-center justify-end px-2 py-0.5 rounded border border-emerald-500/70 dark:border-emerald-500 bg-white/90 dark:bg-emerald-950/70 text-emerald-950 dark:text-emerald-100 font-black shadow-2xs">
                        {item.balanceBags.toLocaleString()}
                      </span>
                    </td>
                    <td className="p-2 pr-3 sm:px-3 sm:pr-3 text-right border-r-2 border-teal-500/70 dark:border-teal-600/80 bg-teal-50/50 dark:bg-teal-950/20 tabular-nums">
                      <span className="inline-flex items-center justify-end px-2 py-0.5 rounded border-2 border-teal-600 dark:border-teal-400 bg-teal-100/90 dark:bg-teal-950/80 text-teal-950 dark:text-teal-100 font-black shadow-2xs">
                        {item.balanceMt.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Table Summary Footer */}
            {sortedList.length > 0 && (
              <tfoot>
                <tr className="bg-slate-100 dark:bg-slate-800/90 font-black text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                  <td colSpan={4} className="p-2.5 pl-3 sm:px-3 sm:pl-3 text-left uppercase tracking-wider">
                    TOTAL ACCUMULATED BALANCE
                  </td>
                  <td className="p-2.5 pr-3 sm:px-3 sm:pr-3 text-right tabular-nums">
                    {totalInboundBags.toLocaleString()}
                  </td>
                  <td className="p-2.5 pr-3 sm:px-3 sm:pr-3 text-right text-amber-600 dark:text-amber-400 tabular-nums">
                    {totalDeliveredBags.toLocaleString()}
                  </td>
                  <td className="p-2.5 pr-3 sm:px-3 sm:pr-3 text-right border-l-2 border-emerald-600 dark:border-emerald-500 bg-emerald-100/70 dark:bg-emerald-950/60 tabular-nums text-sm">
                    <span className="inline-flex items-center justify-end px-2 py-0.5 rounded border border-emerald-600 dark:border-emerald-500 bg-white/90 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-100 font-black shadow-2xs">
                      {totalBalanceBags.toLocaleString()}
                    </span>
                  </td>
                  <td className="p-2.5 pr-3 sm:px-3 sm:pr-3 text-right border-r-2 border-teal-600 dark:border-teal-500 bg-teal-100/70 dark:bg-teal-950/60 tabular-nums text-sm">
                    <span className="inline-flex items-center justify-end px-2 py-0.5 rounded border-2 border-teal-600 dark:border-teal-400 bg-teal-100 dark:bg-teal-950 text-teal-950 dark:text-teal-100 font-black shadow-2xs">
                      {totalBalanceMt.toFixed(2)}
                    </span>
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination */}
        {sortedList.length > pageSize && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800">
            <TablePagination
              currentPage={currentPage}
              totalPages={Math.ceil(sortedList.length / pageSize)}
              pageSize={pageSize}
              totalRecords={sortedList.length}
              onPageChange={setCurrentPage}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setCurrentPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        documentTitle="POTATO SEED STOCK BALANCE REGISTER"
        subtitle="Live reconciliation of inbound receipts, delivery releases and chamber balances"
        columns={exportColumns}
        data={filteredList.map((item) => ({
          ...item,
          inboundBags: item.inboundBags.toLocaleString(),
          inboundMt: item.inboundMt.toFixed(2),
          deliveredBags: item.deliveredBags.toLocaleString(),
          deliveredMt: item.deliveredMt.toFixed(2),
          balanceBags: item.balanceBags.toLocaleString(),
          balanceMt: item.balanceMt.toFixed(2),
        }))}
        summaryItems={[
          { label: 'Total Received (Bags)', value: totalInboundBags.toLocaleString() },
          { label: 'Total Delivered (Bags)', value: totalDeliveredBags.toLocaleString() },
          { label: 'Current Balance (Bags)', value: totalBalanceBags.toLocaleString() },
          { label: 'Current Balance (MT)', value: `${totalBalanceMt.toFixed(2)} MT` },
        ]}
      />
    </div>
  );
};
