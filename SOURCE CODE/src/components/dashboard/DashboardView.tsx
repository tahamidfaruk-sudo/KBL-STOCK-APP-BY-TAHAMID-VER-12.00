import React from 'react';
import { RotateCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { TableDensity } from '../../types';
import { calculateOverallMetrics } from '../../utils/stockEngine';
import { exportToExcel, exportToPdf } from '../../utils/exportUtils';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { LiveStockItemwiseMatrix } from './LiveStockItemwiseMatrix';
import { ColdStorageFacilityTable } from './ColdStorageFacilityTable';
import { GlobalSkeletonLoader } from '../common/SkeletonLoader';

export const DashboardView: React.FC = () => {
  const [isPrintModalOpen, setIsPrintModalOpen] = React.useState(false);
  const [density, setDensity] = React.useState<TableDensity>('compact');
  const {
    stockTransactions,
    deliveryTransactions,
    coldStorages,
    filters,
    companySettings,
    addToast,
    isLoadingStock,
    refreshStockData,
  } = useApp();

  const metrics = calculateOverallMetrics(
    stockTransactions,
    deliveryTransactions,
    coldStorages,
    filters
  );

  const handleExportSummaryExcel = () => {
    const summaryData = coldStorages.map((cs) => {
      const csStock = stockTransactions
        .filter((s) => s.coldStorageId === cs.id)
        .reduce((acc, s) => acc + s.sackQuantity, 0);
      const csDel = deliveryTransactions
        .filter((d) => d.coldStorageId === cs.id)
        .reduce((acc, d) => acc + d.sackQuantity, 0);
      return {
        code: cs.code,
        name: cs.name,
        location: cs.location,
        capacity: cs.capacity === 0 ? '-' : cs.capacity,
        receivedBags: csStock === 0 ? '-' : csStock,
        deliveredBags: csDel === 0 ? '-' : csDel,
        remainingBags: (csStock - csDel) === 0 ? '-' : (csStock - csDel),
      };
    });

    exportToExcel(
      summaryData,
      [
        { header: 'Storage Code', key: 'code', width: 14 },
        { header: 'Facility Name', key: 'name', width: 30 },
        { header: 'Location', key: 'location', width: 22 },
        { header: 'Capacity (Bags)', key: 'capacity', width: 16 },
        { header: 'Received Bags', key: 'receivedBags', width: 16 },
        { header: 'Delivered Bags', key: 'deliveredBags', width: 16 },
        { header: 'Remaining Bags', key: 'remainingBags', width: 16 },
      ],
      'Potato_Stock_Executive_Summary_2024',
      'Potato Seed Stock Executive Summary',
      companySettings,
      'Active Season 2024'
    );
    addToast('Executive Inventory Summary exported to Excel successfully!', 'success');
  };

  const handleExportSummaryPdf = () => {
    const summaryData = coldStorages.map((cs) => {
      const csStock = stockTransactions
        .filter((s) => s.coldStorageId === cs.id)
        .reduce((acc, s) => acc + s.sackQuantity, 0);
      const csDel = deliveryTransactions
        .filter((d) => d.coldStorageId === cs.id)
        .reduce((acc, d) => acc + d.sackQuantity, 0);
      return {
        code: cs.code,
        name: cs.name,
        capacity: cs.capacity === 0 ? '-' : cs.capacity.toLocaleString(),
        receivedBags: csStock === 0 ? '-' : csStock.toLocaleString(),
        deliveredBags: csDel === 0 ? '-' : csDel.toLocaleString(),
        remainingBags: (csStock - csDel) === 0 ? '-' : (csStock - csDel).toLocaleString(),
      };
    });

    exportToPdf(
      summaryData,
      [
        { header: 'Code', key: 'code' },
        { header: 'Facility Name', key: 'name' },
        { header: 'Capacity (Bags)', key: 'capacity' },
        { header: 'Received Bags', key: 'receivedBags' },
        { header: 'Delivered Bags', key: 'deliveredBags' },
        { header: 'Remaining Bags', key: 'remainingBags' },
      ],
      'Potato_Stock_Executive_Summary_2024',
      'Potato Seed Stock & Storage Executive Report',
      companySettings,
      'l',
      'Active Season 2024'
    );
    addToast('Executive Inventory Summary exported to PDF successfully!', 'success');
  };

  return (
    <div className="space-y-3.5">
      {/* Header with Title - Clean Theme-aligned card distinct from Main Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-2.5 sm:px-4 py-2 sm:py-2.5 bg-sky-50 dark:bg-sky-950/40 text-slate-900 dark:text-white rounded-xl border border-sky-200 dark:border-sky-800/60 shadow-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-1.5 h-5 bg-sky-600 dark:bg-sky-500 rounded-xs shadow-xs" />
          <h2 className="text-xs sm:text-sm font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase">
            DASHBOARD
          </h2>
        </div>
        <div className="flex items-center flex-wrap justify-end gap-1.5 sm:gap-2">
          {/* Density toggle buttons: Compact, Normal, Comfortable */}
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
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
              title="Compact padding (denser view)"
              aria-label="Compact density"
            >
              COMPACT
            </button>
            <button
              type="button"
              onClick={() => setDensity('normal')}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer uppercase ${
                density === 'normal'
                  ? 'bg-sky-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
              title="Normal padding (standard view)"
              aria-label="Normal density"
            >
              NORMAL
            </button>
            <button
              type="button"
              onClick={() => setDensity('comfortable')}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer uppercase ${
                density === 'comfortable'
                  ? 'bg-sky-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
              }`}
              title="Comfortable padding (spacious view)"
              aria-label="Comfortable density"
            >
              COMFORTABLE
            </button>
          </div>

          <button
            type="button"
            onClick={() => refreshStockData()}
            disabled={isLoadingStock}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded-lg text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer shadow-2xs disabled:opacity-60 uppercase"
            title="Fetch and sync stock inventory data from backend"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoadingStock ? 'animate-spin text-sky-600 dark:text-sky-400' : 'text-sky-600 dark:text-sky-400'}`} />
            <span className="hidden sm:inline">SYNC STOCK DATA</span>
          </button>
        </div>
      </div>

      {/* Global Skeleton Loader when fetching stock data */}
      {isLoadingStock ? (
        <GlobalSkeletonLoader
          type="dashboard"
          message="Fetching latest cold storage stock and distribution data..."
        />
      ) : (
        <>
          {/* Print Company Header */}
          <div className="print-header hidden print:block mb-4">
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-3 mb-3">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
                  {companySettings.companyName || 'KISHAN BOTANIX LTD.'}
                </h1>
                <p className="text-xs font-semibold text-slate-700 mt-0.5">
                  {companySettings.companyTagline || companySettings.tagline || 'Certified Potato Seed Storage & Management'}
                </p>
                <p className="text-[11px] text-slate-600 mt-1">
                  {companySettings.legalAddress || companySettings.address} | Phone: {companySettings.phone} | Email: {companySettings.email}
                </p>
              </div>
              <div className="text-right">
                <span className="inline-block px-2.5 py-1 text-[11px] font-black uppercase tracking-wider bg-slate-100 border border-slate-300 rounded text-slate-900 mb-1">
                  DASHBOARD EXECUTIVE REPORT
                </span>
                <p className="text-[11px] text-slate-700 font-medium">
                  Fiscal Year: {companySettings.fiscalYear || '2024-2025'}
                </p>
                <p className="text-[10px] text-slate-500">
                  Print Date: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>

          {/* Cold Storage Facility Report Table */}
          <ColdStorageFacilityTable
            density={density}
            onExportExcel={handleExportSummaryExcel}
            onExportPdf={handleExportSummaryPdf}
            onPrint={() => setIsPrintModalOpen(true)}
          />

          {/* Live Stock Details (Item-wise) Spreadsheet Section */}
          <LiveStockItemwiseMatrix
            density={density}
            onDensityChange={setDensity}
          />
        </>
      )}

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        documentTitle="POTATO SEED STOCK & STORAGE EXECUTIVE REPORT"
        subtitle="Facility capacity, receipts, dispatches, and remaining bags"
        columns={[
          { header: 'Code', key: 'code' },
          { header: 'Facility Name', key: 'name' },
          { header: 'Capacity (Bags)', key: 'capacity' },
          { header: 'Received Bags', key: 'receivedBags' },
          { header: 'Delivered Bags', key: 'deliveredBags' },
          { header: 'Remaining Bags', key: 'remainingBags' },
        ]}
        data={coldStorages.map((cs) => {
          const csStock = stockTransactions
            .filter((s) => s.coldStorageId === cs.id)
            .reduce((acc, s) => acc + s.sackQuantity, 0);
          const csDel = deliveryTransactions
            .filter((d) => d.coldStorageId === cs.id)
            .reduce((acc, d) => acc + d.sackQuantity, 0);
          return {
            code: cs.code,
            name: cs.name,
            capacity: cs.capacity,
            receivedBags: csStock,
            deliveredBags: csDel,
            remainingBags: csStock - csDel,
          };
        })}
        summaryItems={[
          { label: 'Total Received', value: metrics.totalReceivedBags === 0 ? '-' : `${metrics.totalReceivedBags.toLocaleString()} Bags` },
          { label: 'Total Delivered', value: metrics.totalDeliveredBags === 0 ? '-' : `${metrics.totalDeliveredBags.toLocaleString()} Bags` },
          { label: 'Balance in Hand', value: metrics.remainingBags === 0 ? '-' : `${metrics.remainingBags.toLocaleString()} Bags` },
          { label: 'Total MT', value: metrics.remainingMt === 0 ? '-' : `${metrics.remainingMt} MT` },
        ]}
        filename="Potato_Stock_Executive_Report_2024"
        orientation="l"
      />
    </div>
  );
};
