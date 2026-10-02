import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TableDensity } from '../../types';
import {
  Search,
  RotateCcw,
  Calendar,
  X,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Zap,
} from 'lucide-react';
import { exportToExcel, exportToPdf, validateAndTriggerPrint } from '../../utils/exportUtils';
import { sortData } from '../../utils/sortUtils';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { ReportButtonGroup } from '../common/ReportButtonGroup';
import { SortIcon } from '../common/SortIcon';
import { matchesUniversalSearch } from '../../utils/searchUtils';
import { formatDisplayDate } from '../../utils/dateUtils';

export const AllItemClosingStockView: React.FC = () => {
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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [selectedVariety, setSelectedVariety] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'in_stock' | 'partial' | 'dispatched'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeDatePreset, setActiveDatePreset] = useState<string | null>(null);

  // Sorting & Pagination
  const [sortKey, setSortKey] = useState<string>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(15);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStorage('');
    setSelectedVariety('');
    setSelectedClass('');
    setSelectedGrade('');
    setSelectedStatus('all');
    setStartDate('');
    setEndDate('');
    setActiveDatePreset(null);
    setCurrentPage(1);
    addToast?.('All Stock Register filters reset successfully', 'info');
  };

  // Date Presets Handler
  const handleDatePreset = (preset: 'today' | '7days' | 'thisMonth' | 'season') => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const todayStr = formatDate(today);
      setStartDate(todayStr);
      setEndDate(todayStr);
      setActiveDatePreset('today');
    } else if (preset === '7days') {
      const d7 = new Date();
      d7.setDate(d7.getDate() - 7);
      setStartDate(formatDate(d7));
      setEndDate(formatDate(today));
      setActiveDatePreset('7days');
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(today));
      setActiveDatePreset('thisMonth');
    } else if (preset === 'season') {
      setStartDate('2024-01-01');
      setEndDate('2024-12-31');
      setActiveDatePreset('season');
    }
    setCurrentPage(1);
  };

  const activeFilterCount = [
    Boolean(searchQuery),
    Boolean(selectedStorage),
    Boolean(selectedVariety),
    Boolean(selectedClass),
    Boolean(selectedGrade),
    selectedStatus !== 'all',
    Boolean(startDate || endDate),
  ].filter(Boolean).length;

  // Format Helper: Clean Class Name
  const getCleanClassName = (className: string): string => {
    if (!className) return '-';
    return className.replace(/\s*\([^)]*\)/gi, '').trim().toUpperCase();
  };

  // Format Helper: Clean Grade Name
  const getCleanGradeName = (gradeName: string, gradeCode?: string): string => {
    if (gradeCode && ['A', 'B', 'C', 'OS', 'US'].includes(gradeCode.toUpperCase())) {
      return gradeCode.toUpperCase();
    }
    if (!gradeName || gradeName === '-') return '-';
    const upper = gradeName.toUpperCase();
    if (upper.includes('GRADE A') || upper.match(/\bA\b/)) return 'A';
    if (upper.includes('GRADE B') || upper.match(/\bB\b/)) return 'B';
    if (upper.includes('GRADE C') || upper.match(/\bC\b/)) return 'C';
    if (upper.includes('OVER SIZE') || upper.includes('OS')) return 'OS';
    if (upper.includes('UNDER SIZE') || upper.includes('US')) return 'US';
    return upper.replace(/\s*\([^)]*\)/gi, '').replace(/GRADE\s*/gi, '').trim() || upper;
  };

  // Process rows joining stock transactions with matching deliveries
  const processedRegisterRows = useMemo(() => {
    const deliveriesBySr: Record<string, { bags: number; kg: number }> = {};
    for (const d of deliveryTransactions) {
      const srKey = (d.srNo || d.deliveryReference || '').trim().toUpperCase();
      if (srKey) {
        if (!deliveriesBySr[srKey]) deliveriesBySr[srKey] = { bags: 0, kg: 0 };
        deliveriesBySr[srKey].bags += d.sackQuantity;
        deliveriesBySr[srKey].kg += d.totalKg || d.sackQuantity * (d.kgPerBag || 50);
      }
    }

    return stockTransactions.map((s) => {
      const kgPerBag = s.kgPerBag || 50;
      const totalKgIn = s.totalKg || s.sackQuantity * kgPerBag;
      const bagIn = s.sackQuantity;

      const srKey = (s.srNo || '').trim().toUpperCase();
      const matchedDelivery = srKey ? deliveriesBySr[srKey] : null;

      const bagOut = matchedDelivery ? Math.min(bagIn, matchedDelivery.bags) : 0;
      const totalKgOut = matchedDelivery ? Math.min(totalKgIn, matchedDelivery.kg) : 0;

      const closingBagQty = Math.max(0, bagIn - bagOut);
      const closingKg = Math.max(0, totalKgIn - totalKgOut);
      const closingMt = Number((closingKg / 1000).toFixed(3));

      let status = 'STOCK';
      if (closingBagQty === 0) {
        status = 'DISPATCHED';
      } else if (bagOut > 0) {
        status = 'PARTIAL';
      }

      const cs = coldStorages.find((c) => c.id === s.coldStorageId);
      const storageCode = cs?.code || (cs?.name ? cs.name.replace(/cold\s*storage/gi, '').trim() : '-');
      const storageName = cs?.name || '-';

      const v = varieties.find((item) => item.id === s.varietyId);
      const varietyName = (v?.name || '-').toUpperCase();

      const cls = seedClasses.find((c) => c.id === s.classId);
      const cleanClassName = getCleanClassName(cls?.name || '');

      const grd = grades.find((g) => g.id === s.gradeId);
      const cleanGrade = getCleanGradeName(grd?.name || '', grd?.code);

      return {
        id: s.id,
        date: s.date,
        kblChallanNo: s.kblChallanNo || '-',
        srNo: s.srNo || '-',
        storageCode,
        storageName,
        bagIn,
        totalKgIn,
        bagOut,
        totalKgOut,
        closingBagQty,
        weightPerBag: kgPerBag,
        closingKg,
        closingMt,
        varietyName,
        className: cleanClassName,
        gradeName: cleanGrade,
        status,
        rawTransaction: s,
      };
    });
  }, [stockTransactions, deliveryTransactions, coldStorages, varieties, seedClasses, grades]);

  // Filtered list
  const filteredList = useMemo(() => {
    return processedRegisterRows.filter((r) => {
      if (startDate && r.date < startDate) return false;
      if (endDate && r.date > endDate) return false;
      if (selectedStorage && r.rawTransaction.coldStorageId !== selectedStorage) return false;
      if (selectedVariety && r.rawTransaction.varietyId !== selectedVariety) return false;
      if (selectedClass && r.rawTransaction.classId !== selectedClass) return false;
      if (selectedGrade && r.rawTransaction.gradeId !== selectedGrade) return false;

      if (selectedStatus === 'in_stock' && r.status !== 'STOCK') return false;
      if (selectedStatus === 'partial' && r.status !== 'PARTIAL') return false;
      if (selectedStatus === 'dispatched' && r.status !== 'DISPATCHED') return false;

      if (
        !matchesUniversalSearch(r, searchQuery, [
          r.storageName,
          r.storageCode,
          r.varietyName,
          r.className,
          r.gradeName,
          r.kblChallanNo,
          r.srNo,
          r.status,
          r.date,
        ])
      ) {
        return false;
      }

      return true;
    });
  }, [
    processedRegisterRows,
    startDate,
    endDate,
    selectedStorage,
    selectedVariety,
    selectedClass,
    selectedGrade,
    selectedStatus,
    searchQuery,
  ]);

  // Sorted and cumulative calculations
  const sortedAndCumulativeList = useMemo(() => {
    const sorted = sortData(filteredList, sortKey, sortDir);

    let cumulativeInKg = 0;
    let cumulativeOutKg = 0;

    return sorted.map((row, index) => {
      cumulativeInKg += row.totalKgIn;
      cumulativeOutKg += row.totalKgOut;

      return {
        ...row,
        sl: index + 1,
        cumulativeTotalInKg: cumulativeInKg,
        cumulativeTotalOutKg: cumulativeOutKg,
      };
    });
  }, [filteredList, sortKey, sortDir]);

  // Totals
  const totals = useMemo(() => {
    const totalBagIn = sortedAndCumulativeList.reduce((acc, r) => acc + r.bagIn, 0);
    const totalKgIn = sortedAndCumulativeList.reduce((acc, r) => acc + r.totalKgIn, 0);
    const totalBagOut = sortedAndCumulativeList.reduce((acc, r) => acc + r.bagOut, 0);
    const totalKgOut = sortedAndCumulativeList.reduce((acc, r) => acc + r.totalKgOut, 0);
    const totalClosingBags = sortedAndCumulativeList.reduce((acc, r) => acc + r.closingBagQty, 0);
    const totalClosingKg = sortedAndCumulativeList.reduce((acc, r) => acc + r.closingKg, 0);
    const totalClosingMt = Number((totalClosingKg / 1000).toFixed(3));

    return {
      totalBagIn,
      totalKgIn,
      totalBagOut,
      totalKgOut,
      totalClosingBags,
      totalClosingKg,
      totalClosingMt,
    };
  }, [sortedAndCumulativeList]);

  // Paginated records
  const totalRecords = sortedAndCumulativeList.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalRecords / pageSize));
  const effectivePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = pageSize === -1 ? 0 : (effectivePage - 1) * pageSize;
  const endIndex = pageSize === -1 ? totalRecords : Math.min(startIndex + pageSize, totalRecords);
  const paginatedRows = pageSize === -1 ? sortedAndCumulativeList : sortedAndCumulativeList.slice(startIndex, endIndex);

  // Dynamic table density styles matching Stock In
  const densityStyles = {
    compact: {
      row: 'h-8 sm:h-8.5',
      cell: 'py-1 text-[9.5px]',
      th: 'py-1 text-[9px]',
      badge: 'px-1 py-0.2 text-[8px]',
      variety: 'text-[9.5px]',
      tfoot: 'py-1 text-[9.5px]',
    },
    normal: {
      row: 'h-9 sm:h-9.5',
      cell: 'py-1.2 text-[10px]',
      th: 'py-1.5 text-[9.5px]',
      badge: 'px-1.2 py-0.2 text-[8.5px]',
      variety: 'text-[10px]',
      tfoot: 'py-1.2 text-[10px]',
    },
    comfortable: {
      row: 'h-10 sm:h-11',
      cell: 'py-1.5 text-[10.5px]',
      th: 'py-2 text-[10px]',
      badge: 'px-1.5 py-0.5 text-[9px]',
      variety: 'text-[10.5px]',
      tfoot: 'py-1.5 text-[10.5px]',
    },
  }[density];

  const cellPadding = densityStyles.cell;
  const thPadding = densityStyles.th;

  // Excel Export
  const handleExportExcel = () => {
    const exportData: any[] = sortedAndCumulativeList.map((row) => ({
      date: row.date,
      challanNo: row.kblChallanNo,
      srNo: row.srNo,
      coldStorage: row.storageCode,
      variety: row.varietyName,
      classGrade: `${row.className} • ${row.gradeName}`,
      bagIn: row.bagIn,
      totalKgIn: row.totalKgIn,
      cumulativeIn: row.cumulativeTotalInKg,
      bagOut: row.bagOut,
      totalKgOut: row.totalKgOut,
      cumulativeOut: row.cumulativeTotalOutKg,
      cStockBagQty: row.closingBagQty,
      closingStockKg: row.closingKg,
      closingStockMt: row.closingMt,
      status: row.status,
    }));

    if (sortedAndCumulativeList.length > 0) {
      exportData.push({
        date: 'TOTAL',
        challanNo: '',
        srNo: '',
        coldStorage: '',
        variety: '',
        classGrade: '',
        bagIn: totals.totalBagIn,
        totalKgIn: totals.totalKgIn,
        cumulativeIn: totals.totalKgIn,
        bagOut: totals.totalBagOut,
        totalKgOut: totals.totalKgOut,
        cumulativeOut: totals.totalKgOut,
        cStockBagQty: totals.totalClosingBags,
        closingStockKg: totals.totalClosingKg,
        closingStockMt: totals.totalClosingMt,
        status: '',
      });
    }

    const columns = [
      { header: 'DATE', key: 'date', width: 13, align: 'left' as const },
      { header: 'CHALLAN NO', key: 'challanNo', width: 16, align: 'left' as const },
      { header: 'SR NO', key: 'srNo', width: 14, align: 'left' as const },
      { header: 'COLD STORAGE', key: 'coldStorage', width: 16, align: 'left' as const },
      { header: 'VARIETY', key: 'variety', width: 22, align: 'left' as const },
      { header: 'CLASS & GRADE', key: 'classGrade', width: 18, align: 'left' as const },
      { header: 'BAG IN', key: 'bagIn', width: 13, align: 'right' as const },
      { header: 'TOTAL KG IN', key: 'totalKgIn', width: 16, align: 'right' as const },
      { header: 'CUMULATIVE IN (KG)', key: 'cumulativeIn', width: 20, align: 'right' as const },
      { header: 'BAG OUT', key: 'bagOut', width: 13, align: 'right' as const },
      { header: 'TOTAL KG OUT', key: 'totalKgOut', width: 16, align: 'right' as const },
      { header: 'CUMULATIVE OUT (KG)', key: 'cumulativeOut', width: 20, align: 'right' as const },
      { header: 'CLOSING STOCK (BAG)', key: 'cStockBagQty', width: 18, align: 'right' as const },
      { header: 'CLOSING STOCK (KG)', key: 'closingStockKg', width: 18, align: 'right' as const },
      { header: 'CLOSING STOCK (MT)', key: 'closingStockMt', width: 18, align: 'right' as const },
      { header: 'STATUS', key: 'status', width: 14, align: 'left' as const },
    ];

    exportToExcel(
      exportData,
      columns,
      `STOCK_REGISTER_${companySettings?.fiscalYear || '2024'}`,
      'STOCK REGISTER REPORT',
      companySettings,
      `Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`
    );
    addToast?.('Stock Register exported to Excel successfully!', 'success');
  };

  // PDF Export
  const handleExportPdf = () => {
    const exportData: any[] = sortedAndCumulativeList.map((row) => ({
      date: row.date,
      challanNo: row.kblChallanNo,
      srNo: row.srNo,
      storage: row.storageCode,
      item: row.varietyName,
      bagIn: row.bagIn.toLocaleString(),
      kgIn: row.totalKgIn.toLocaleString(),
      bagOut: row.bagOut.toLocaleString(),
      kgOut: row.totalKgOut.toLocaleString(),
      cStockBagQty: row.closingBagQty.toLocaleString(),
      closingStockKg: row.closingKg.toLocaleString(),
      closingStockMt: row.closingMt.toFixed(3),
      status: row.status,
    }));

    if (sortedAndCumulativeList.length > 0) {
      exportData.push({
        date: 'TOTAL',
        challanNo: '',
        srNo: '',
        storage: '',
        item: '',
        bagIn: totals.totalBagIn.toLocaleString(),
        kgIn: totals.totalKgIn.toLocaleString(),
        bagOut: totals.totalBagOut.toLocaleString(),
        kgOut: totals.totalKgOut.toLocaleString(),
        cStockBagQty: totals.totalClosingBags.toLocaleString(),
        closingStockKg: totals.totalClosingKg.toLocaleString(),
        closingStockMt: totals.totalClosingMt.toFixed(3),
        status: '',
      });
    }

    const columns = [
      { header: 'DATE', key: 'date', align: 'left' as const },
      { header: 'CHALLAN', key: 'challanNo', align: 'left' as const },
      { header: 'SR NO', key: 'srNo', align: 'left' as const },
      { header: 'STORAGE', key: 'storage', align: 'left' as const },
      { header: 'VARIETY', key: 'item', align: 'left' as const },
      { header: 'BAG IN', key: 'bagIn', align: 'right' as const },
      { header: 'KG IN', key: 'kgIn', align: 'right' as const },
      { header: 'BAG OUT', key: 'bagOut', align: 'right' as const },
      { header: 'KG OUT', key: 'kgOut', align: 'right' as const },
      { header: 'CLOSING STOCK (BAG)', key: 'cStockBagQty', align: 'right' as const },
      { header: 'CLOSING STOCK (KG)', key: 'closingStockKg', align: 'right' as const },
      { header: 'CLOSING STOCK (MT)', key: 'closingStockMt', align: 'right' as const },
      { header: 'STATUS', key: 'status', align: 'left' as const },
    ];

    exportToPdf(
      exportData,
      columns,
      `STOCK_REGISTER_${companySettings?.fiscalYear || '2024'}`,
      'STOCK REGISTER REPORT',
      companySettings,
      `Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`
    );
    addToast?.('Stock Register exported as PDF!', 'success');
  };

  return (
    <div className="space-y-3">
      {/* Page Title Card matching Stock In and Delivery Report */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-sky-50 dark:bg-sky-950/40 text-slate-900 dark:text-white rounded-xl border border-sky-200 dark:border-sky-800/60 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 bg-sky-600 dark:bg-sky-500 rounded-xs shadow-xs" />
          <h2 className="text-xs sm:text-sm font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase">
            STOCK REGISTER
          </h2>
        </div>

        {/* Action Controls: Density & Exports */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Density Selector */}
          <div className="inline-flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                setDensity('compact');
                addToast?.('Table density set to COMPACT', 'info');
              }}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer uppercase font-bold ${
                density === 'compact'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              COMPACT
            </button>
            <button
              type="button"
              onClick={() => {
                setDensity('normal');
                addToast?.('Table density set to NORMAL', 'info');
              }}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer uppercase font-bold ${
                density === 'normal'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              NORMAL
            </button>
            <button
              type="button"
              onClick={() => {
                setDensity('comfortable');
                addToast?.('Table density set to COMFORTABLE', 'info');
              }}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-all cursor-pointer uppercase font-bold ${
                density === 'comfortable'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              COMFORTABLE
            </button>
          </div>

          {/* Export & Print */}
          <ReportButtonGroup
            iconOnly={true}
            onExportExcel={handleExportExcel}
            onExportPdf={handleExportPdf}
            onPrint={() => setIsPreviewOpen(true)}
          />
        </div>
      </div>

      {/* Filter Section matching Stock In layout */}
      <div className="bg-indigo-100 dark:bg-indigo-950/50 border border-indigo-300 dark:border-indigo-800 rounded-xl p-3 shadow-xs space-y-2.5 text-slate-800 dark:text-slate-100">
        {/* ROW 1: Search, Date Pickers, Quick Buttons, record counter & Icon-only Clear button */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left grouping */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative w-40 sm:w-48 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-7 py-1 text-xs rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 shadow-2xs transition-all font-medium"
                aria-label="Search records"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Date Pickers container matching filter section background */}
            <div className="flex items-center gap-1.5 shrink-0 bg-slate-100/90 dark:bg-slate-700/70 p-1 rounded-lg border border-slate-300 dark:border-slate-600 shadow-2xs">
              <div className="flex items-center gap-1 text-[10px] text-slate-600 dark:text-slate-300 font-semibold px-1 uppercase tracking-wider">
                <Calendar className="w-3 h-3 text-sky-600 dark:text-sky-400" />
                <span>Date:</span>
              </div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setActiveDatePreset(null);
                  setCurrentPage(1);
                }}
                className="px-2 py-0.5 text-xs rounded-md border border-slate-300 dark:border-slate-600 bg-slate-200/90 dark:bg-slate-600 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-2xs"
                title="From Date"
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setActiveDatePreset(null);
                  setCurrentPage(1);
                }}
                className="px-2 py-0.5 text-xs rounded-md border border-slate-300 dark:border-slate-600 bg-slate-200/90 dark:bg-slate-600 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-2xs"
                title="To Date"
              />
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setActiveDatePreset(null);
                    setCurrentPage(1);
                  }}
                  className="p-1 rounded text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors cursor-pointer"
                  title="Clear date filter"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Right grouping */}
          <div className="flex items-center gap-2 shrink-0 ml-auto flex-wrap">
            {/* Quick Date Presets */}
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-lg border border-slate-300 dark:border-slate-700 shadow-2xs text-xs font-semibold">
              <span className="inline-flex items-center gap-0.5 text-[9.5px] font-black uppercase text-slate-500 dark:text-slate-400 px-1 tracking-wider">
                <Zap className="w-2.5 h-2.5 text-amber-500" />
                <span>QUICK:</span>
              </span>

              <button
                type="button"
                onClick={() => handleDatePreset('today')}
                className={`px-2 py-0.5 text-[10px] rounded-md transition-all cursor-pointer uppercase ${
                  activeDatePreset === 'today'
                    ? 'bg-sky-600 text-white font-bold border border-sky-600 shadow-2xs'
                    : 'bg-white/90 dark:bg-slate-700/90 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-2xs font-semibold'
                }`}
                title="Filter by Today's Date"
              >
                TODAY
              </button>

              <button
                type="button"
                onClick={() => handleDatePreset('7days')}
                className={`px-2 py-0.5 text-[10px] rounded-md transition-all cursor-pointer uppercase ${
                  activeDatePreset === '7days'
                    ? 'bg-sky-600 text-white font-bold border border-sky-600 shadow-2xs'
                    : 'bg-white/90 dark:bg-slate-700/90 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-2xs font-semibold'
                }`}
                title="Filter by Last 7 Days"
              >
                7 DAY
              </button>

              <button
                type="button"
                onClick={() => handleDatePreset('thisMonth')}
                className={`px-2 py-0.5 text-[10px] rounded-md transition-all cursor-pointer uppercase ${
                  activeDatePreset === 'thisMonth'
                    ? 'bg-sky-600 text-white font-bold border border-sky-600 shadow-2xs'
                    : 'bg-white/90 dark:bg-slate-700/90 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-2xs font-semibold'
                }`}
                title="Filter by This Month"
              >
                THIS MONTH
              </button>

              <button
                type="button"
                onClick={() => handleDatePreset('season')}
                className={`px-2 py-0.5 text-[10px] rounded-md transition-all cursor-pointer uppercase ${
                  activeDatePreset === 'season'
                    ? 'bg-sky-600 text-white font-bold border border-sky-600 shadow-2xs'
                    : 'bg-white/90 dark:bg-slate-700/90 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-2xs font-semibold'
                }`}
                title="Filter by Season 2024"
              >
                SEASON
              </button>
            </div>

            <span className="text-[10.5px] font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
              <strong className="text-slate-800 dark:text-slate-200 font-semibold">{sortedAndCumulativeList.length}</strong> lots
            </span>

            {/* Clear Filter button with icon only */}
            <button
              type="button"
              onClick={resetFilters}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 border border-slate-300 dark:border-slate-600 shadow-2xs transition-colors cursor-pointer shrink-0 inline-flex items-center justify-center"
              title={`Clear all filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
              aria-label="Clear all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ROW 2: Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1 border-t border-slate-300 dark:border-slate-700">
          <div>
            <select
              value={selectedStorage}
              onChange={(e) => {
                setSelectedStorage(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-normal uppercase truncate shadow-2xs"
              title="FILTER BY COLD STORAGE"
            >
              <option value="" className="text-slate-500 dark:text-slate-400 font-normal">ALL STORAGES</option>
              {coldStorages.map((cs) => (
                <option key={cs.id} value={cs.id} className="text-slate-600 dark:text-slate-300 font-normal">
                  {cs.name.toUpperCase()} ({cs.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedVariety}
              onChange={(e) => {
                setSelectedVariety(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-normal uppercase truncate shadow-2xs"
              title="FILTER BY VARIETY"
            >
              <option value="" className="text-slate-500 dark:text-slate-400 font-normal">ALL VARIETIES</option>
              {varieties.map((v) => (
                <option key={v.id} value={v.id} className="text-slate-600 dark:text-slate-300 font-normal">
                  {v.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-normal uppercase truncate shadow-2xs"
              title="FILTER BY SEED CLASS"
            >
              <option value="" className="text-slate-500 dark:text-slate-400 font-normal">ALL SEED CLASSES</option>
              {seedClasses.map((c) => (
                <option key={c.id} value={c.id} className="text-slate-600 dark:text-slate-300 font-normal">
                  {c.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedGrade}
              onChange={(e) => {
                setSelectedGrade(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-normal uppercase truncate shadow-2xs"
              title="FILTER BY GRADE"
            >
              <option value="" className="text-slate-500 dark:text-slate-400 font-normal">ALL GRADES</option>
              {grades.map((g) => (
                <option key={g.id} value={g.id} className="text-slate-600 dark:text-slate-300 font-normal">
                  {g.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value as any);
                setCurrentPage(1);
              }}
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-normal uppercase truncate shadow-2xs"
              title="FILTER BY STATUS"
            >
              <option value="all">ALL STATUSES</option>
              <option value="in_stock">STOCK</option>
              <option value="partial">PARTIAL</option>
              <option value="dispatched">DISPATCHED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs bg-white dark:bg-slate-900 overflow-x-auto">
        <table className="w-full text-left border-collapse border border-slate-300 dark:border-slate-700">
          <colgroup>
            <col className="w-[9%]" />        {/* 1: DATE */}
            <col className="w-[10%]" />       {/* 2: CHALLAN */}
            <col className="w-[6.5%]" />      {/* 3: SR NO */}
            <col className="w-[5.5%]" />      {/* 4: STORAGE */}
            <col className="w-[12%]" />       {/* 5: VARIETY */}
            <col className="w-[11.5%]" />     {/* 6: CLASS & GRADE */}
            <col className="w-[8%]" />        {/* 7: KG IN */}
            <col className="w-[8%]" />        {/* 8: KG OUT */}
            <col className="w-[8%]" />        {/* 9: CLOSING STOCK (BAG) */}
            <col className="w-[8%]" />        {/* 10: CLOSING STOCK (KG) */}
            <col className="w-[8%]" />        {/* 11: CLOSING STOCK (MT) */}
            <col className="w-[5.5%]" />      {/* 12: STATUS */}
          </colgroup>
          <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-slate-700 text-[10px]">
            <tr>
              {/* DATE (9%) */}
              <th
                onClick={() => handleSort('date')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[9%] ${
                  sortKey === 'date'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center gap-0.5 w-full">
                  <span className="break-words">DATE</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="date" />
                </div>
              </th>

              {/* CHALLAN NO (10% - Increased for single row display) */}
              <th
                onClick={() => handleSort('kblChallanNo')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[10%] whitespace-nowrap ${
                  sortKey === 'kblChallanNo'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-start gap-0.5 w-full whitespace-nowrap">
                  <span className="whitespace-nowrap">CHALLAN</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="kblChallanNo" />
                </div>
              </th>

              {/* SR NO (6.5%) */}
              <th
                onClick={() => handleSort('srNo')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[6.5%] ${
                  sortKey === 'srNo'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="break-words">SR NO</span>
              </th>

              {/* COLD STORAGE (5.5%) */}
              <th
                onClick={() => handleSort('storageCode')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[5.5%] ${
                  sortKey === 'storageCode'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="break-words">STORAGE</span>
              </th>

              {/* VARIETY (12% - Decreased slightly to allocate space to Challan) */}
              <th
                onClick={() => handleSort('varietyName')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[12%] ${
                  sortKey === 'varietyName'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center gap-0.5 w-full">
                  <span className="break-words">VARIETY</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="varietyName" />
                </div>
              </th>

              {/* CLASS & GRADE (11.5%) */}
              <th
                onClick={() => handleSort('className')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[11.5%] ${
                  sortKey === 'className'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center gap-0.5 w-full">
                  <span className="break-words">CLASS & GRADE</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="className" />
                </div>
              </th>

              {/* KG IN (8%) */}
              <th
                onClick={() => handleSort('totalKgIn')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[8%] ${
                  sortKey === 'totalKgIn'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="break-words">KG IN</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="totalKgIn" />
                </div>
              </th>

              {/* KG OUT (8%) */}
              <th
                onClick={() => handleSort('totalKgOut')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[8%] ${
                  sortKey === 'totalKgOut'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="break-words">KG OUT</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="totalKgOut" />
                </div>
              </th>

              {/* CLOSING STOCK (BAG) (8%) */}
              <th
                onClick={() => handleSort('closingBagQty')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none uppercase w-[8%] ${
                  sortKey === 'closingBagQty'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Closing Stock (Bag)"
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="break-words">Closing Stock (Bag)</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="closingBagQty" />
                </div>
              </th>

              {/* CLOSING STOCK (KG) (8%) */}
              <th
                onClick={() => handleSort('closingKg')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none uppercase w-[8%] ${
                  sortKey === 'closingKg'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Closing Stock (KG)"
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="break-words">Closing Stock (KG)</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="closingKg" />
                </div>
              </th>

              {/* CLOSING STOCK (MT) (8%) */}
              <th
                onClick={() => handleSort('closingMt')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none uppercase w-[8%] ${
                  sortKey === 'closingMt'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Closing Stock (MT)"
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="break-words">Closing Stock (MT)</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="closingMt" />
                </div>
              </th>

              {/* STATUS (5.5%) */}
              <th
                onClick={() => handleSort('status')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[5.5%] ${
                  sortKey === 'status'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-start gap-0.5 w-full">
                  <span className="break-words">STATUS</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="status" />
                </div>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={12}
                  className="py-10 text-center text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 text-xs"
                >
                  <p className="font-medium">No matching Stock Register records found.</p>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="mt-1.5 text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                    >
                      Clear search query
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
                <tr
                  key={row.id}
                  className={`${densityStyles.row} transition-colors duration-150 ease-out hover:bg-sky-500/10 dark:hover:bg-sky-400/10 cursor-default`}
                >
                  {/* DATE */}
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium tabular-nums`}>
                    {formatDisplayDate(row.date)}
                  </td>

                  {/* CHALLAN */}
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 whitespace-nowrap`}>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border border-slate-300 dark:border-slate-650 text-slate-700 dark:text-slate-300 tabular-nums whitespace-nowrap shadow-2xs">
                      {row.kblChallanNo}
                    </span>
                  </td>

                  {/* SR NO */}
                  <td className={`${cellPadding} pl-3 text-left font-bold border border-slate-300 dark:border-slate-700`}>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border border-sky-400 dark:border-sky-500 text-sky-700 dark:text-sky-300 tabular-nums">
                      {row.srNo}
                    </span>
                  </td>

                  {/* COLD STORAGE */}
                  <td className={`${cellPadding} pl-3 text-left font-bold border border-slate-300 dark:border-slate-700`}>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border border-indigo-400 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300 uppercase">
                      {row.storageCode}
                    </span>
                  </td>

                  {/* VARIETY */}
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700`}>
                    <span className={`font-bold text-slate-800 dark:text-slate-100 break-words ${densityStyles.variety}`} title={row.varietyName}>
                      {row.varietyName}
                    </span>
                  </td>

                  {/* CLASS & GRADE */}
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700`}>
                    <div className="flex items-center gap-1 min-w-0">
                      <span className={`font-bold text-purple-900 dark:text-purple-200 break-words uppercase ${densityStyles.variety}`}>
                        {row.className}
                      </span>
                      <span className={`inline-flex items-center justify-center font-black uppercase border border-teal-500 text-teal-800 dark:text-teal-200 bg-teal-100/80 dark:bg-teal-950/50 rounded leading-none shrink-0 ${densityStyles.badge}`}>
                        {row.gradeName}
                      </span>
                    </div>
                  </td>

                  {/* TOTAL KG IN */}
                  <td className={`${cellPadding} pr-3 text-right font-semibold text-purple-700 dark:text-purple-400 border border-slate-300 dark:border-slate-700 tabular-nums`}>
                    {row.totalKgIn.toLocaleString()}
                  </td>

                  {/* TOTAL KG OUT */}
                  <td className={`${cellPadding} pr-3 text-right font-semibold text-amber-700 dark:text-amber-400 border border-slate-300 dark:border-slate-700 tabular-nums`}>
                    {row.totalKgOut > 0 ? row.totalKgOut.toLocaleString() : '-'}
                  </td>

                  {/* CLOSING STOCK (BAG) - With Border */}
                  <td className={`${cellPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 tabular-nums`}>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border border-sky-500 dark:border-sky-400 bg-transparent text-sky-800 dark:text-sky-300 tabular-nums shadow-2xs">
                      {row.closingBagQty.toLocaleString()}
                    </span>
                  </td>

                  {/* CLOSING STOCK (KG) - With Border */}
                  <td className={`${cellPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 tabular-nums`}>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border border-slate-400 dark:border-slate-500 bg-slate-50/80 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 tabular-nums shadow-2xs">
                      {row.closingKg.toLocaleString()}
                    </span>
                  </td>

                  {/* CLOSING STOCK (MT) - With Border */}
                  <td className={`${cellPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 tabular-nums`}>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-500 dark:border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 tabular-nums shadow-2xs">
                      {row.closingMt.toFixed(3)}
                    </span>
                  </td>

                  {/* STATUS */}
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700`}>
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[8.5px] font-bold uppercase tracking-wider ${
                        row.status === 'STOCK'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                          : row.status === 'PARTIAL'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Footer Total Row */}
          {sortedAndCumulativeList.length > 0 && (
            <tfoot className="bg-slate-100 dark:bg-slate-850 font-bold border-t-2 border-slate-400 dark:border-slate-600">
              <tr>
                <td
                  colSpan={6}
                  className="py-2 pl-3 text-left uppercase tracking-wider text-slate-900 dark:text-white bg-slate-200/90 dark:bg-slate-800 font-black border border-slate-300 dark:border-slate-700 shadow-2xs"
                >
                  <div className="flex items-center justify-start gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border border-slate-700 dark:border-slate-300 text-xs font-black tracking-widest uppercase shadow-xs">
                      <Layers className="w-3 h-3 text-amber-400 dark:text-amber-500" />
                      <span>TOTAL</span>
                    </span>
                  </div>
                </td>

                {/* Total KG IN */}
                <td className="py-2 pr-3 text-right font-black text-purple-700 dark:text-purple-300 border border-slate-300 dark:border-slate-700 tabular-nums text-[10.5px]">
                  {totals.totalKgIn.toLocaleString()}
                </td>

                {/* Total KG OUT */}
                <td className="py-2 pr-3 text-right font-black text-amber-700 dark:text-amber-300 border border-slate-300 dark:border-slate-700 tabular-nums text-[10.5px]">
                  {totals.totalKgOut.toLocaleString()}
                </td>

                {/* Total CLOSING BAGS */}
                <td className="py-2 pr-3 text-right font-black text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 tabular-nums text-[10.5px]">
                  {totals.totalClosingBags.toLocaleString()}
                </td>

                {/* Total CLOSING STOCK (KG) */}
                <td className="py-2 pr-3 text-right font-black text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 tabular-nums text-[10.5px]">
                  {totals.totalClosingKg.toLocaleString()}
                </td>

                {/* Total CLOSING STOCK (MT) */}
                <td className="py-2 pr-3 text-right font-black text-emerald-700 dark:text-emerald-300 border border-slate-300 dark:border-slate-700 tabular-nums text-[10.5px]">
                  {totals.totalClosingMt.toFixed(3)}
                </td>

                {/* Blank for status */}
                <td className="border border-slate-300 dark:border-slate-700"></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination Footer */}
      {totalRecords > 0 && (
        <div className="pt-2 px-1 border-t border-slate-200 dark:border-slate-750 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 select-none">
          {/* Left Side */}
          <div className="flex items-center flex-wrap gap-2">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px]">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-1.5 py-0.5 text-xs font-semibold rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500/50 shadow-2xs cursor-pointer font-bold"
                aria-label="Rows per page"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={-1}>All</option>
              </select>
            </div>

            <span className="text-slate-300 dark:text-slate-600">·</span>

            <span className="text-slate-600 dark:text-slate-400 text-[11px]">
              Showing <strong className="text-slate-900 dark:text-white font-bold">{startIndex + 1}</strong>–<strong className="text-slate-900 dark:text-white font-bold">{endIndex}</strong> of <strong className="text-slate-900 dark:text-white font-bold">{totalRecords}</strong> records
            </span>
          </div>

          {/* Right Side */}
          {pageSize !== -1 && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={effectivePage === 1}
                className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={effectivePage === 1}
                className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <div className="flex items-center gap-0.5 px-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, idx) => {
                  let pageNum = idx + 1;
                  if (totalPages > 5) {
                    if (effectivePage > 3 && effectivePage < totalPages - 2) {
                      pageNum = effectivePage - 2 + idx;
                    } else if (effectivePage >= totalPages - 2) {
                      pageNum = totalPages - 4 + idx;
                    }
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-6 h-6 px-1.5 text-[11px] rounded-md font-semibold transition-all cursor-pointer ${
                        effectivePage === pageNum
                          ? 'bg-sky-600 text-white font-bold shadow-2xs'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={effectivePage === totalPages}
                className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={effectivePage === totalPages}
                className="p-1 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                title="Last Page"
              >
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Print Preview Modal */}
      {isPreviewOpen && (
        <PrintPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="STOCK REGISTER"
          documentTitle="STOCK REGISTER REPORT"
          subtitle="Inbound, Outbound & Net Closing Stock Register"
          period={`Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`}
          columns={[
            { header: 'DATE', key: 'date' },
            { header: 'CHALLAN', key: 'kblChallanNo' },
            { header: 'SR NO', key: 'srNo' },
            { header: 'STORAGE', key: 'storageCode' },
            { header: 'VARIETY', key: 'varietyName' },
            { header: 'BAG IN', key: 'bagIn', align: 'right' },
            { header: 'KG IN', key: 'totalKgIn', align: 'right' },
            { header: 'BAG OUT', key: 'bagOut', align: 'right' },
            { header: 'KG OUT', key: 'totalKgOut', align: 'right' },
            { header: 'CLOSING STOCK (BAG)', key: 'closingBagQty', align: 'right' },
            { header: 'CLOSING STOCK (KG)', key: 'closingKg', align: 'right' },
            { header: 'CLOSING STOCK (MT)', key: 'closingMt', align: 'right' },
          ]}
          data={sortedAndCumulativeList.map((row) => ({
            ...row,
            bagIn: row.bagIn.toLocaleString(),
            totalKgIn: row.totalKgIn.toLocaleString(),
            bagOut: row.bagOut.toLocaleString(),
            totalKgOut: row.totalKgOut.toLocaleString(),
            closingBagQty: row.closingBagQty.toLocaleString(),
            closingKg: row.closingKg.toLocaleString(),
            closingMt: row.closingMt.toFixed(3),
          }))}
          summaryItems={[
            { label: 'Total Bag In', value: `${totals.totalBagIn.toLocaleString()} Bags` },
            { label: 'Total Bag Out', value: `${totals.totalBagOut.toLocaleString()} Bags` },
            { label: 'Closing Stock Bags', value: `${totals.totalClosingBags.toLocaleString()} Bags`, highlight: true },
            { label: 'Closing Stock (MT)', value: `${totals.totalClosingMt.toFixed(3)} MT` },
          ]}
          onConfirmPrint={() => {
            validateAndTriggerPrint();
            setIsPreviewOpen(false);
          }}
        />
      )}
    </div>
  );
};
