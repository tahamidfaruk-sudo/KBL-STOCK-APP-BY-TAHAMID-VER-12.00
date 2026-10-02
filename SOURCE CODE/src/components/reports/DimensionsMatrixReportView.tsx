import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateStockBalanceMatrix } from '../../utils/stockEngine';
import { TableDensity } from '../../types';
import {
  Grid3X3,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Boxes,
  Truck,
  Layers,
} from 'lucide-react';
import { exportToExcel, exportToPdf } from '../../utils/exportUtils';
import { sortData } from '../../utils/sortUtils';
import { TablePagination } from '../common/TablePagination';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { ReportButtonGroup } from '../common/ReportButtonGroup';

export const DimensionsMatrixReportView: React.FC = () => {
  const {
    stockTransactions,
    deliveryTransactions,
    coldStorages,
    varieties,
    seedClasses,
    grades,
    companySettings,
  } = useApp();

  const [density, setDensity] = useState<TableDensity>('compact');
  const [dimensionFilter, setDimensionFilter] = useState<'variety' | 'class' | 'grade'>('variety');
  const [searchTerm, setSearchTerm] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [sortKey, setSortKey] = useState<string>('coldStorageName');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const matrix = useMemo(() => {
    return calculateStockBalanceMatrix(
      stockTransactions,
      deliveryTransactions,
      coldStorages,
      varieties,
      seedClasses,
      grades
    ).map((item, idx) => ({
      ...item,
      id: `${item.coldStorageId}-${item.varietyId}-${item.classId}-${item.gradeId}-${idx}`,
    }));
  }, [stockTransactions, deliveryTransactions, coldStorages, varieties, seedClasses, grades]);

  const filteredMatrix = useMemo(() => {
    return matrix.filter((item) => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const match =
          item.coldStorageName.toLowerCase().includes(q) ||
          item.varietyName.toLowerCase().includes(q) ||
          item.className.toLowerCase().includes(q) ||
          item.gradeName.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [matrix, searchTerm]);

  const sortedMatrix = useMemo(() => {
    return sortData(filteredMatrix, sortKey, sortDir);
  }, [filteredMatrix, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sortedMatrix.length / pageSize));
  const effectivePage = Math.min(Math.max(1, currentPage), totalPages);
  const paginatedMatrix = sortedMatrix.slice((effectivePage - 1) * pageSize, effectivePage * pageSize);

  const totalInboundBags = filteredMatrix.reduce((acc, i) => acc + i.inboundBags, 0);
  const totalInboundMt = filteredMatrix.reduce((acc, i) => acc + i.inboundMt, 0);
  const totalDeliveredBags = filteredMatrix.reduce((acc, i) => acc + i.deliveredBags, 0);
  const totalDeliveredMt = filteredMatrix.reduce((acc, i) => acc + i.deliveredMt, 0);
  const totalBalanceBags = filteredMatrix.reduce((acc, i) => acc + i.balanceBags, 0);
  const totalBalanceMt = filteredMatrix.reduce((acc, i) => acc + i.balanceMt, 0);

  const exportColumns = [
    { header: 'Cold Storage Facility', key: 'coldStorageName', width: 28, align: 'left' as const },
    { header: 'Potato Variety', key: 'varietyName', width: 18, align: 'left' as const },
    { header: 'Seed Class', key: 'className', width: 16, align: 'left' as const },
    { header: 'Grade', key: 'gradeName', width: 18, align: 'left' as const },
    { header: 'Inbound Bags', key: 'inboundBags', width: 14, align: 'right' as const },
    { header: 'Inbound MT', key: 'inboundMt', width: 14, align: 'right' as const },
    { header: 'Dispatched Bags', key: 'deliveredBags', width: 14, align: 'right' as const },
    { header: 'Dispatched MT', key: 'deliveredMt', width: 14, align: 'right' as const },
    { header: 'Vault Balance (Bags)', key: 'balanceBags', width: 16, align: 'right' as const },
    { header: 'Vault Balance (MT)', key: 'balanceMt', width: 16, align: 'right' as const },
  ];

  const handleExcel = () => {
    exportToExcel(
      filteredMatrix,
      exportColumns,
      'MultiDimensional_Matrix_Report_2024',
      'Multi-Dimensional Potato Seed Stock Matrix Report',
      companySettings,
      `Dimension: ${dimensionFilter.toUpperCase()} | Total Rows: ${filteredMatrix.length}`
    );
  };

  const handlePdf = () => {
    exportToPdf(
      filteredMatrix,
      exportColumns,
      'MultiDimensional_Matrix_Report_2024',
      'Multi-Dimensional Potato Seed Stock Matrix Report',
      companySettings,
      'l',
      `Dimension: ${dimensionFilter.toUpperCase()} | Total Combinations: ${filteredMatrix.length}`
    );
  };

  const thPadding = density === 'compact' ? 'py-1 px-2.5 text-[10.5px]' : density === 'comfortable' ? 'py-2.5 px-3.5 text-xs' : 'py-1.5 px-3 text-[11px]';
  const tdPadding = density === 'compact' ? 'py-1 px-2.5 text-[11px]' : density === 'comfortable' ? 'py-2.5 px-3.5 text-xs' : 'py-1.5 px-3 text-xs';

  const renderSortIndicator = (colKey: string) => {
    if (sortKey !== colKey) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400/70 group-hover:text-sky-300 inline ml-1" />;
    }
    return sortDir === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-sky-400 bg-sky-950/60 p-0.5 rounded inline ml-1" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-sky-400 bg-sky-950/60 p-0.5 rounded inline ml-1" />
    );
  };

  return (
    <div className="space-y-3 sm:space-y-3.5">
      {/* Page Title Card strictly matching Dashboard layout */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-sky-50 dark:bg-sky-950/40 text-slate-900 dark:text-white rounded-xl border border-sky-200 dark:border-sky-800/60 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 bg-sky-600 dark:bg-sky-500 rounded-xs shadow-xs" />
          <h2 className="text-xs sm:text-sm font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase">
            DIMENSIONS MATRIX REPORT
          </h2>
          <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            {filteredMatrix.length} COMBINATIONS
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Density Toggle */}
          <div
            className="inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs text-xs font-semibold"
            role="group"
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
            iconOnly={true}
            onPrint={() => setIsPreviewOpen(true)}
            onExportExcel={handleExcel}
            onExportPdf={handlePdf}
          />
        </div>
      </div>

      {/* Control Strip: Strictly matching Dashboard Cold Storage Wise Summary section colors & button styles */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-3 bg-indigo-100 dark:bg-indigo-950/50 border border-indigo-300 dark:border-indigo-800 rounded-xl shadow-xs text-slate-800 dark:text-slate-100 no-print">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white outline-none focus:ring-1 focus:ring-sky-500 font-medium shadow-2xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">PIVOT FOCUS:</span>
          <div className="inline-flex items-center p-0.5 bg-slate-200/90 dark:bg-slate-700/80 rounded-lg border border-slate-300 dark:border-slate-600 shadow-2xs text-xs font-semibold">
            <button
              type="button"
              onClick={() => setDimensionFilter('variety')}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-colors cursor-pointer uppercase ${
                dimensionFilter === 'variety'
                  ? 'bg-sky-600 text-white font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              BY VARIETY
            </button>
            <button
              type="button"
              onClick={() => setDimensionFilter('class')}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-colors cursor-pointer uppercase ${
                dimensionFilter === 'class'
                  ? 'bg-sky-600 text-white font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              BY CLASS
            </button>
            <button
              type="button"
              onClick={() => setDimensionFilter('grade')}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-colors cursor-pointer uppercase ${
                dimensionFilter === 'grade'
                  ? 'bg-sky-600 text-white font-bold shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              BY GRADE
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">COMBINATIONS</span>
            <Layers className="w-3.5 h-3.5 text-sky-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {filteredMatrix.length}
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">TOTAL INBOUND</span>
            <Boxes className="w-3.5 h-3.5 text-sky-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1 font-mono">
            {totalInboundBags.toLocaleString()} <span className="text-xs font-normal text-slate-500">Bags</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">TOTAL DISPATCHED</span>
            <Truck className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">
            {totalDeliveredBags.toLocaleString()} <span className="text-xs font-normal text-slate-500">Bags</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">VAULT BALANCE</span>
            <Grid3X3 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
            {totalBalanceBags.toLocaleString()} <span className="text-xs font-normal text-slate-500">Bags</span>
          </div>
        </div>
      </div>

      {/* Cross Tabulation Table */}
      <div className="bg-white dark:bg-slate-900 border border-sky-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-100 font-bold border-b border-slate-300 dark:border-slate-600 select-none">
              <tr>
                <th
                  onClick={() => handleSort('coldStorageName')}
                  className={`${thPadding} pl-3 text-left font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-100 cursor-pointer hover:bg-slate-300/70 dark:hover:bg-slate-600 transition-colors select-none`}
                >
                  COLD STORAGE {renderSortIndicator('coldStorageName')}
                </th>
                <th
                  onClick={() => handleSort('varietyName')}
                  className={`${thPadding} pl-3 text-left font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-100 cursor-pointer hover:bg-slate-300/70 dark:hover:bg-slate-600 transition-colors select-none`}
                >
                  VARIETY {renderSortIndicator('varietyName')}
                </th>
                <th
                  onClick={() => handleSort('className')}
                  className={`${thPadding} pl-3 text-left font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-100 cursor-pointer hover:bg-slate-300/70 dark:hover:bg-slate-600 transition-colors select-none`}
                >
                  CLASS {renderSortIndicator('className')}
                </th>
                <th
                  onClick={() => handleSort('gradeName')}
                  className={`${thPadding} pl-3 text-left font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-100 cursor-pointer hover:bg-slate-300/70 dark:hover:bg-slate-600 transition-colors select-none`}
                >
                  GRADE {renderSortIndicator('gradeName')}
                </th>
                <th
                  onClick={() => handleSort('inboundBags')}
                  className={`${thPadding} pr-3 text-right font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-100 cursor-pointer hover:bg-slate-300/70 dark:hover:bg-slate-600 transition-colors select-none`}
                >
                  INBOUND (BAGS) {renderSortIndicator('inboundBags')}
                </th>
                <th
                  onClick={() => handleSort('inboundMt')}
                  className={`${thPadding} pr-3 text-right font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-100 cursor-pointer hover:bg-slate-300/70 dark:hover:bg-slate-600 transition-colors select-none`}
                >
                  INBOUND (MT) {renderSortIndicator('inboundMt')}
                </th>
                <th
                  onClick={() => handleSort('deliveredBags')}
                  className={`${thPadding} pr-3 text-right font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-100 cursor-pointer hover:bg-slate-300/70 dark:hover:bg-slate-600 transition-colors select-none`}
                >
                  OUTBOUND (BAGS) {renderSortIndicator('deliveredBags')}
                </th>
                <th
                  onClick={() => handleSort('deliveredMt')}
                  className={`${thPadding} pr-3 text-right font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-100 cursor-pointer hover:bg-slate-300/70 dark:hover:bg-slate-600 transition-colors select-none`}
                >
                  OUTBOUND (MT) {renderSortIndicator('deliveredMt')}
                </th>
                <th
                  onClick={() => handleSort('balanceBags')}
                  className={`${thPadding} pr-3 text-right font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-100 cursor-pointer hover:bg-slate-300/70 dark:hover:bg-slate-600 transition-colors select-none`}
                >
                  BALANCE (BAGS) {renderSortIndicator('balanceBags')}
                </th>
                <th
                  onClick={() => handleSort('balanceMt')}
                  className={`${thPadding} pr-3 text-right font-semibold uppercase tracking-wider text-slate-800 dark:text-slate-100 cursor-pointer hover:bg-slate-300/70 dark:hover:bg-slate-600 transition-colors select-none`}
                >
                  BALANCE (MT) {renderSortIndicator('balanceMt')}
                </th>
              </tr>
            </thead>
            <tbody
              className={`divide-y divide-slate-100 dark:divide-slate-800/60 ${
                density === 'compact' ? 'text-xs' : density === 'normal' ? 'text-xs' : 'text-sm'
              }`}
            >
              {paginatedMatrix.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400 italic">
                    No matrix records found matching search filters.
                  </td>
                </tr>
              ) : (
                paginatedMatrix.map((item) => (
                  <tr
                    key={item.id}
                    className="odd:bg-white even:bg-slate-50/50 dark:odd:bg-slate-900 dark:even:bg-slate-850/40 hover:bg-sky-50/60 dark:hover:bg-sky-950/25 transition-colors group"
                  >
                    <td className={`font-semibold text-slate-800 dark:text-slate-200 pl-3 text-left ${tdPadding}`}>
                      {item.coldStorageName}
                    </td>
                    <td className={`font-bold text-slate-900 dark:text-white pl-3 text-left ${tdPadding}`}>
                      {item.varietyName}
                    </td>
                    <td className={`whitespace-nowrap pl-3 text-left ${tdPadding}`}>
                      <span className="px-1.5 py-0.5 rounded-sm text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {item.className}
                      </span>
                    </td>
                    <td className={`text-slate-600 dark:text-slate-300 pl-3 text-left ${tdPadding}`}>{item.gradeName}</td>
                    <td className={`text-right pr-3 font-medium text-slate-700 dark:text-slate-300 font-mono tabular-nums ${tdPadding}`}>
                      {item.inboundBags.toLocaleString()}
                    </td>
                    <td className={`text-right pr-3 text-slate-500 font-mono tabular-nums ${tdPadding}`}>
                      {item.inboundMt.toFixed(2)}
                    </td>
                    <td className={`text-right pr-3 font-medium text-amber-600 dark:text-amber-400 font-mono tabular-nums ${tdPadding}`}>
                      {item.deliveredBags.toLocaleString()}
                    </td>
                    <td className={`text-right pr-3 text-slate-500 font-mono tabular-nums ${tdPadding}`}>
                      {item.deliveredMt.toFixed(2)}
                    </td>
                    <td className={`text-right pr-3 font-bold text-sky-700 dark:text-sky-300 font-mono tabular-nums ${tdPadding}`}>
                      {item.balanceBags.toLocaleString()}
                    </td>
                    <td className={`text-right pr-3 font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums ${tdPadding}`}>
                      {item.balanceMt.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            {filteredMatrix.length > 0 && (
              <tfoot className="bg-slate-100 dark:bg-slate-800/90 font-black border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-xs select-none">
                <tr>
                  <td colSpan={4} className={`${tdPadding} pl-3 text-left uppercase tracking-wider`}>
                    TOTAL MATRIX BALANCE:
                  </td>
                  <td className={`${tdPadding} pr-3 text-right font-mono font-black`}>
                    {totalInboundBags.toLocaleString()}
                  </td>
                  <td className={`${tdPadding} pr-3 text-right font-mono text-slate-500`}>
                    {totalInboundMt.toFixed(2)}
                  </td>
                  <td className={`${tdPadding} pr-3 text-right font-mono text-amber-600 dark:text-amber-400 font-black`}>
                    {totalDeliveredBags.toLocaleString()}
                  </td>
                  <td className={`${tdPadding} pr-3 text-right font-mono text-slate-500`}>
                    {totalDeliveredMt.toFixed(2)}
                  </td>
                  <td className={`${tdPadding} pr-3 text-right font-mono text-sky-700 dark:text-sky-300 font-black`}>
                    {totalBalanceBags.toLocaleString()}
                  </td>
                  <td className={`${tdPadding} pr-3 text-right font-mono text-emerald-600 dark:text-emerald-400 font-black`}>
                    {totalBalanceMt.toFixed(2)} MT
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination */}
        {sortedMatrix.length > 0 && (
          <TablePagination
            currentPage={effectivePage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={sortedMatrix.length}
            pageSizeOptions={[10, 15, 25, 50, 100]}
            onPageChange={setCurrentPage}
            onPageSizeChange={(ps) => {
              setPageSize(ps);
              setCurrentPage(1);
            }}
          />
        )}
      </div>

      {/* Print Preview Modal */}
      {isPreviewOpen && (
        <PrintPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          documentTitle="Multi-Dimensional Potato Seed Stock Matrix Report"
          subtitle={`Total Combinations: ${filteredMatrix.length} | Generated: ${new Date().toLocaleDateString()}`}
          columns={exportColumns}
          data={filteredMatrix}
          summaryItems={[
            { label: 'Total Combinations', value: filteredMatrix.length },
            { label: 'Inbound Sacks', value: totalInboundBags.toLocaleString() },
            { label: 'Dispatched Sacks', value: totalDeliveredBags.toLocaleString() },
            { label: 'Vault Balance Sacks', value: totalBalanceBags.toLocaleString() },
            { label: 'Vault Balance MT', value: `${totalBalanceMt.toFixed(2)} MT` },
          ]}
          filename="Dimensions_Matrix_Report_2024"
        />
      )}
    </div>
  );
};
