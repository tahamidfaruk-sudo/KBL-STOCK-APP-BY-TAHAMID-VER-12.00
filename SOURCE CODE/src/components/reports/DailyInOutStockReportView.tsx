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
import { exportToExcel, exportToPdf } from '../../utils/exportUtils';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { ReportButtonGroup } from '../common/ReportButtonGroup';
import { SortIcon } from '../common/SortIcon';
import { formatDisplayDate } from '../../utils/dateUtils';

export const DailyInOutStockReportView: React.FC = () => {
  const {
    stockTransactions,
    deliveryTransactions,
    coldStorages,
    varieties,
    seedClasses,
    grades,
    productionBlocks,
    companySettings,
    addToast,
  } = useApp();

  const [density, setDensity] = useState<TableDensity>('compact');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Filters strictly matching Overview & Reports Stock In view
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStorage, setSelectedStorage] = useState('');
  const [selectedVariety, setSelectedVariety] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('');
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
    setSelectedBlock('');
    setStartDate('');
    setEndDate('');
    setActiveDatePreset(null);
    setCurrentPage(1);
    addToast?.('All filters reset successfully', 'info');
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
    Boolean(selectedBlock),
    Boolean(startDate || endDate),
  ].filter(Boolean).length;

  // Filter master datasets for stock in and delivery based on global dropdown filters
  const filteredStockIn = useMemo(() => {
    return stockTransactions.filter((s) => {
      if (s.status === 'rejected') return false;
      if (selectedStorage && s.coldStorageId !== selectedStorage) return false;
      if (selectedVariety && s.varietyId !== selectedVariety) return false;
      if (selectedClass && s.classId !== selectedClass) return false;
      if (selectedGrade && s.gradeId !== selectedGrade) return false;
      if (selectedBlock && s.productionBlockId !== selectedBlock) return false;
      return true;
    });
  }, [
    stockTransactions,
    selectedStorage,
    selectedVariety,
    selectedClass,
    selectedGrade,
    selectedBlock,
  ]);

  const filteredStockOut = useMemo(() => {
    return deliveryTransactions.filter((d) => {
      if (d.status === 'cancelled') return false;
      if (selectedStorage && d.coldStorageId !== selectedStorage) return false;
      if (selectedVariety && d.varietyId !== selectedVariety) return false;
      if (selectedClass && d.classId !== selectedClass) return false;
      if (selectedGrade && d.gradeId !== selectedGrade) return false;
      if (selectedBlock && d.productionBlockId !== selectedBlock) return false;
      return true;
    });
  }, [
    deliveryTransactions,
    selectedStorage,
    selectedVariety,
    selectedClass,
    selectedGrade,
    selectedBlock,
  ]);

  // Daily Ledger Calculation with opening balance & chronological cumulative closing stock
  const dailyLedgerRecords = useMemo(() => {
    const dateSet = new Set<string>();
    filteredStockIn.forEach((s) => {
      if (s.date) dateSet.add(s.date);
    });
    filteredStockOut.forEach((d) => {
      if (d.date) dateSet.add(d.date);
    });

    const sortedAllDates = Array.from(dateSet).sort();
    if (sortedAllDates.length === 0 && !startDate) {
      return [];
    }

    const effectiveMinDate = sortedAllDates[0] || '2024-01-01';

    let datesToInclude = sortedAllDates;
    if (startDate && endDate) {
      const cur = new Date(startDate);
      const end = new Date(endDate);
      const rangeDates: string[] = [];
      while (cur <= end) {
        rangeDates.push(cur.toISOString().split('T')[0]);
        cur.setDate(cur.getDate() + 1);
      }
      datesToInclude = rangeDates;
    } else if (startDate) {
      datesToInclude = sortedAllDates.filter((d) => d >= startDate);
    } else if (endDate) {
      datesToInclude = sortedAllDates.filter((d) => d <= endDate);
    }

    const firstReportDate = datesToInclude[0] || effectiveMinDate;
    const priorInKg = filteredStockIn
      .filter((s) => s.date < firstReportDate)
      .reduce((sum, s) => sum + (s.totalKg || s.sackQuantity * (s.kgPerBag || 50)), 0);
    const priorInBags = filteredStockIn
      .filter((s) => s.date < firstReportDate)
      .reduce((sum, s) => sum + (s.sackQuantity || 0), 0);

    const priorOutKg = filteredStockOut
      .filter((d) => d.date < firstReportDate)
      .reduce((sum, d) => sum + (d.totalKg || d.sackQuantity * (d.kgPerBag || 50)), 0);
    const priorOutBags = filteredStockOut
      .filter((d) => d.date < firstReportDate)
      .reduce((sum, d) => sum + (d.sackQuantity || 0), 0);

    let runningClosingKg = priorInKg - priorOutKg;
    let runningClosingBags = priorInBags - priorOutBags;

    const rows = datesToInclude.map((dateStr, idx) => {
      const inItems = filteredStockIn.filter((s) => s.date === dateStr);
      const outItems = filteredStockOut.filter((d) => d.date === dateStr);

      const stockInKg = inItems.reduce(
        (sum, s) => sum + (s.totalKg || s.sackQuantity * (s.kgPerBag || 50)),
        0
      );
      const stockInBags = inItems.reduce((sum, s) => sum + (s.sackQuantity || 0), 0);

      const stockOutKg = outItems.reduce(
        (sum, d) => sum + (d.totalKg || d.sackQuantity * (d.kgPerBag || 50)),
        0
      );
      const stockOutBags = outItems.reduce((sum, d) => sum + (d.sackQuantity || 0), 0);

      runningClosingKg += stockInKg - stockOutKg;
      runningClosingBags += stockInBags - stockOutBags;
      const closingStockMt = Number((runningClosingKg / 1000).toFixed(3));

      return {
        sl: idx + 1,
        date: dateStr,
        stockInKg,
        stockInBags,
        stockOutKg,
        stockOutBags,
        closingStockKg: runningClosingKg,
        noOfBagClosingStock: runningClosingBags,
        closingStockMt,
        hasActivity: stockInKg > 0 || stockOutKg > 0,
      };
    });

    if (!startDate && !endDate) {
      return rows.filter((r) => r.hasActivity);
    }

    return rows;
  }, [filteredStockIn, filteredStockOut, startDate, endDate]);

  // Search filtering
  const searchFilteredList = useMemo(() => {
    if (!searchQuery.trim()) return dailyLedgerRecords;
    const query = searchQuery.trim().toLowerCase();
    return dailyLedgerRecords.filter((r) => {
      return (
        r.date.toLowerCase().includes(query) ||
        formatDisplayDate(r.date).toLowerCase().includes(query) ||
        r.stockInKg.toString().includes(query) ||
        r.stockOutKg.toString().includes(query) ||
        r.closingStockKg.toString().includes(query) ||
        r.noOfBagClosingStock.toString().includes(query) ||
        r.closingStockMt.toString().includes(query)
      );
    });
  }, [dailyLedgerRecords, searchQuery]);

  // Sorting
  const sortedList = useMemo(() => {
    const list = [...searchFilteredList];
    list.sort((a: any, b: any) => {
      let aVal = a[sortKey];
      let bVal = b[sortKey];
      if (typeof aVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return list;
  }, [searchFilteredList, sortKey, sortDir]);

  // Overall Totals
  const overallTotals = useMemo(() => {
    const totalInKg = sortedList.reduce((acc, row) => acc + row.stockInKg, 0);
    const totalOutKg = sortedList.reduce((acc, row) => acc + row.stockOutKg, 0);
    const lastRow = sortedList.length > 0 ? sortedList[sortedList.length - 1] : null;
    const latestClosingKg = lastRow ? lastRow.closingStockKg : 0;
    const latestClosingBags = lastRow ? lastRow.noOfBagClosingStock : 0;
    const latestClosingMt = lastRow ? lastRow.closingStockMt : 0;

    return {
      totalInKg,
      totalOutKg,
      latestClosingKg,
      latestClosingBags,
      latestClosingMt,
    };
  }, [sortedList]);

  // Paginated records
  const totalRecords = sortedList.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalRecords / pageSize));
  const effectivePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = pageSize === -1 ? 0 : (effectivePage - 1) * pageSize;
  const endIndex = pageSize === -1 ? totalRecords : Math.min(startIndex + pageSize, totalRecords);
  const paginatedRows = pageSize === -1 ? sortedList : sortedList.slice(startIndex, endIndex);

  // Dynamic table density styles matching Stock In page
  const densityStyles = {
    compact: {
      row: 'h-8 sm:h-8.5',
      cell: 'py-1 text-[9.5px]',
      th: 'py-1 text-[9px]',
      badge: 'px-1 py-0.2 text-[8px]',
      tfoot: 'py-1 text-[9.5px]',
    },
    normal: {
      row: 'h-9 sm:h-9.5',
      cell: 'py-1.2 text-[10px]',
      th: 'py-1.5 text-[9.5px]',
      badge: 'px-1.2 py-0.2 text-[8.5px]',
      tfoot: 'py-1.2 text-[10px]',
    },
    comfortable: {
      row: 'h-10 sm:h-11',
      cell: 'py-1.5 text-[10.5px]',
      th: 'py-2 text-[10px]',
      badge: 'px-1.5 py-0.5 text-[9px]',
      tfoot: 'py-1.5 text-[10.5px]',
    },
  }[density];

  const cellPadding = densityStyles.cell;
  const thPadding = densityStyles.th;

  // Excel Export matching exact 6 columns
  const handleExportExcel = () => {
    const exportData: any[] = sortedList.map((row) => ({
      date: formatDisplayDate(row.date),
      stockInKg: row.stockInKg,
      stockOutKg: row.stockOutKg,
      closingStockKg: row.closingStockKg,
      noOfBagClosingStock: row.noOfBagClosingStock,
      closingStockMt: row.closingStockMt,
    }));

    if (sortedList.length > 0) {
      exportData.push({
        date: 'TOTAL',
        stockInKg: overallTotals.totalInKg,
        stockOutKg: overallTotals.totalOutKg,
        closingStockKg: overallTotals.latestClosingKg,
        noOfBagClosingStock: overallTotals.latestClosingBags,
        closingStockMt: overallTotals.latestClosingMt,
        isTotal: true,
      });
    }

    const columns: any[] = [
      { header: 'DATE', key: 'date', width: 16, align: 'left' },
      { header: 'STOCK IN (KG)', key: 'stockInKg', width: 18, isNumeric: true },
      { header: 'STOCK OUT (KG)', key: 'stockOutKg', width: 18, isNumeric: true },
      { header: 'CLOSING STOCK (KG)', key: 'closingStockKg', width: 22, isNumeric: true },
      { header: 'NO OF BAG CLOSING STOCK', key: 'noOfBagClosingStock', width: 25, isNumeric: true },
      { header: 'CLOSING STOCK (MT)', key: 'closingStockMt', width: 20, isNumeric: true },
    ];

    exportToExcel(
      exportData,
      columns,
      `DAILY_IN_OUT_STOCK_REPORT_${companySettings?.fiscalYear || '2024'}`,
      'DAILY IN, OUT & STOCK REPORT',
      companySettings,
      `Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`
    );
    addToast?.('Daily In, Out & Stock report exported as Excel!', 'success');
  };

  // PDF Export
  const handleExportPdf = () => {
    const exportData: any[] = sortedList.map((row) => ({
      date: formatDisplayDate(row.date),
      stockInKg: row.stockInKg.toLocaleString(),
      stockOutKg: row.stockOutKg.toLocaleString(),
      closingStockKg: row.closingStockKg.toLocaleString(),
      noOfBagClosingStock: row.noOfBagClosingStock.toLocaleString(),
      closingStockMt: row.closingStockMt.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
    }));

    if (sortedList.length > 0) {
      exportData.push({
        date: 'TOTAL',
        stockInKg: overallTotals.totalInKg.toLocaleString(),
        stockOutKg: overallTotals.totalOutKg.toLocaleString(),
        closingStockKg: overallTotals.latestClosingKg.toLocaleString(),
        noOfBagClosingStock: overallTotals.latestClosingBags.toLocaleString(),
        closingStockMt: overallTotals.latestClosingMt.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 }),
        isTotal: true,
      });
    }

    const columns: any[] = [
      { header: 'DATE', key: 'date', align: 'left' },
      { header: 'STOCK IN (KG)', key: 'stockInKg', isNumeric: true },
      { header: 'STOCK OUT (KG)', key: 'stockOutKg', isNumeric: true },
      { header: 'CLOSING STOCK (KG)', key: 'closingStockKg', isNumeric: true },
      { header: 'NO OF BAG CLOSING STOCK', key: 'noOfBagClosingStock', isNumeric: true },
      { header: 'CLOSING STOCK (MT)', key: 'closingStockMt', isNumeric: true },
    ];

    exportToPdf(
      exportData,
      columns,
      `DAILY_IN_OUT_STOCK_REPORT_${companySettings?.fiscalYear || '2024'}`,
      'DAILY IN, OUT & STOCK REPORT',
      companySettings,
      'l',
      `Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`
    );
    addToast?.('Daily In, Out & Stock report exported as PDF!', 'success');
  };

  return (
    <div className="space-y-3">
      {/* Page Title Card strictly matching Overview & Reports layout */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-sky-50 dark:bg-sky-950/40 text-slate-900 dark:text-white rounded-xl border border-sky-200 dark:border-sky-800/60 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 bg-sky-600 dark:bg-sky-500 rounded-xs shadow-xs" />
          <h2 className="text-xs sm:text-sm font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase">
            DAILY IN, OUT & STOCK REPORT
          </h2>
        </div>

        {/* Action Controls: Density & Icon-Only Exports (Excel, PDF, Print) */}
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

      {/* Filter Section: Strictly matching Dashboard Cold Storage Wise Summary section colors & button styles */}
      <div className="bg-indigo-100 dark:bg-indigo-950/50 border border-indigo-300 dark:border-indigo-800 rounded-xl p-3 shadow-xs space-y-2.5 text-slate-800 dark:text-slate-100">
        {/* ROW 1: Search, Date Pickers, Quick Buttons, record counter & Icon-only Clear button */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Left grouping: Search + Date Pickers */}
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
                placeholder="Search..."
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

          {/* Right grouping: Quick Buttons + days counter + icon-only reset */}
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
              <strong className="text-slate-800 dark:text-slate-200 font-semibold">{sortedList.length}</strong> days
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

        {/* ROW 2: 5 Dropdown Filters matching Stock In page */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-1 border-t border-slate-300 dark:border-slate-700">
          {/* Cold Storage */}
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

          {/* Variety */}
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

          {/* Seed Class */}
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

          {/* Grade */}
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

          {/* Production Block */}
          <div>
            <select
              value={selectedBlock}
              onChange={(e) => {
                setSelectedBlock(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-normal uppercase truncate shadow-2xs"
              title="FILTER BY PRODUCTION BLOCK"
            >
              <option value="" className="text-slate-500 dark:text-slate-400 font-normal">ALL PRODUCTION BLOCKS</option>
              {productionBlocks.map((b) => (
                <option key={b.id} value={b.id} className="text-slate-600 dark:text-slate-300 font-normal">
                  {b.name.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Data Table - Configured with responsive wrapper, clean borders, and SortIcon */}
      <div className="border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs bg-white dark:bg-slate-900 overflow-x-auto">
        <table className="w-full text-left border-collapse border border-slate-300 dark:border-slate-700 select-text">
          {/* Header Rows: Clean Two-Tier Table Header matching Stock In design */}
          <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-slate-700 text-[10px]">
            <tr>
              {/* 1. DATE */}
              <th
                onClick={() => handleSort('date')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[15%] ${
                  sortKey === 'date'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-start gap-0.5 w-full">
                  <span className="break-words">DATE</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="date" />
                </div>
              </th>

              {/* 2. STOCK IN (KG) */}
              <th
                onClick={() => handleSort('stockInKg')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[17%] ${
                  sortKey === 'stockInKg'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="break-words">STOCK IN (KG)</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="stockInKg" />
                </div>
              </th>

              {/* 3. STOCK OUT (KG) */}
              <th
                onClick={() => handleSort('stockOutKg')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[17%] ${
                  sortKey === 'stockOutKg'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="break-words">STOCK OUT (KG)</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="stockOutKg" />
                </div>
              </th>

              {/* 4. CLOSING STOCK (KG) */}
              <th
                onClick={() => handleSort('closingStockKg')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[17%] ${
                  sortKey === 'closingStockKg'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="break-words">CLOSING STOCK (KG)</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="closingStockKg" />
                </div>
              </th>

              {/* 5. NO OF BAG CLOSING STOCK */}
              <th
                onClick={() => handleSort('noOfBagClosingStock')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[18%] ${
                  sortKey === 'noOfBagClosingStock'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="break-words">NO OF BAG CLOSING STOCK</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="noOfBagClosingStock" />
                </div>
              </th>

              {/* 6. CLOSING STOCK (MT) */}
              <th
                onClick={() => handleSort('closingStockMt')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[16%] ${
                  sortKey === 'closingStockMt'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="break-words">CLOSING STOCK (MT)</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="closingStockMt" />
                </div>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="py-10 text-center text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 text-xs"
                >
                  <p className="font-medium">No matching stock activity found.</p>
                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="mt-1.5 text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                    >
                      Reset all filters
                    </button>
                  )}
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
                <tr
                  key={row.date}
                  className={`${densityStyles.row} transition-colors duration-150 ease-out hover:bg-sky-500/10 dark:hover:bg-sky-400/10 cursor-default`}
                >
                  {/* DATE */}
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium tabular-nums`}>
                    {formatDisplayDate(row.date)}
                  </td>

                  {/* STOCK IN (KG) */}
                  <td className={`${cellPadding} pr-3 text-right tabular-nums border border-slate-300 dark:border-slate-700 font-bold text-sky-700 dark:text-sky-300`}>
                    {row.stockInKg > 0 ? row.stockInKg.toLocaleString() : '-'}
                  </td>

                  {/* STOCK OUT (KG) */}
                  <td className={`${cellPadding} pr-3 text-right tabular-nums border border-slate-300 dark:border-slate-700 font-bold text-amber-700 dark:text-amber-400`}>
                    {row.stockOutKg > 0 ? row.stockOutKg.toLocaleString() : '-'}
                  </td>

                  {/* CLOSING STOCK (KG) */}
                  <td className={`${cellPadding} pr-3 text-right tabular-nums border border-slate-300 dark:border-slate-700`}>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border border-slate-400 dark:border-slate-500 bg-transparent text-slate-800 dark:text-slate-100 tabular-nums shadow-2xs">
                      {row.closingStockKg.toLocaleString()}
                    </span>
                  </td>

                  {/* NO OF BAG CLOSING STOCK */}
                  <td className={`${cellPadding} pr-3 text-right tabular-nums border border-slate-300 dark:border-slate-700`}>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border border-indigo-400 dark:border-indigo-500 bg-transparent text-indigo-700 dark:text-indigo-300 tabular-nums shadow-2xs">
                      {row.noOfBagClosingStock.toLocaleString()}
                    </span>
                  </td>

                  {/* CLOSING STOCK (MT) */}
                  <td className={`${cellPadding} pr-3 text-right tabular-nums border border-slate-300 dark:border-slate-700`}>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-500 dark:border-emerald-600 bg-transparent text-emerald-700 dark:text-emerald-400 tabular-nums shadow-2xs">
                      {row.closingStockMt.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Footer Total Row: Matching Stock In styling with Layers TOTAL badge */}
          {sortedList.length > 0 && (
            <tfoot className="bg-slate-100 dark:bg-slate-850 font-bold border-t-2 border-slate-400 dark:border-slate-600">
              <tr>
                {/* Total label covering Date column */}
                <td className="py-2 pl-3 text-left uppercase tracking-wider text-slate-900 dark:text-white bg-slate-200/90 dark:bg-slate-800 font-black border border-slate-300 dark:border-slate-700 shadow-2xs">
                  <div className="flex items-center justify-start gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border border-slate-700 dark:border-slate-300 text-xs font-black tracking-widest uppercase shadow-xs">
                      <Layers className="w-3 h-3 text-amber-400 dark:text-amber-500" />
                      <span>TOTAL</span>
                    </span>
                  </div>
                </td>

                {/* Total STOCK IN (KG) */}
                <td className="py-2 pr-3 text-right font-black text-sky-700 dark:text-sky-300 bg-transparent border border-slate-300 dark:border-slate-700 tabular-nums text-[10.5px]">
                  {overallTotals.totalInKg.toLocaleString()}
                </td>

                {/* Total STOCK OUT (KG) */}
                <td className="py-2 pr-3 text-right font-black text-amber-700 dark:text-amber-400 bg-transparent border border-slate-300 dark:border-slate-700 tabular-nums text-[10.5px]">
                  {overallTotals.totalOutKg.toLocaleString()}
                </td>

                {/* Latest CLOSING STOCK (KG) */}
                <td className="py-2 pr-3 text-right font-black text-slate-900 dark:text-white bg-transparent border border-slate-300 dark:border-slate-700 tabular-nums text-[10.5px]">
                  {overallTotals.latestClosingKg.toLocaleString()}
                </td>

                {/* Latest NO OF BAG CLOSING STOCK */}
                <td className="py-2 pr-3 text-right font-black text-indigo-700 dark:text-indigo-300 bg-transparent border border-slate-300 dark:border-slate-700 tabular-nums text-[10.5px]">
                  {overallTotals.latestClosingBags.toLocaleString()}
                </td>

                {/* Latest CLOSING STOCK (MT) */}
                <td className="py-2 pr-3 text-right font-black text-emerald-700 dark:text-emerald-400 bg-transparent border border-slate-300 dark:border-slate-700 tabular-nums text-[10.5px]">
                  {overallTotals.latestClosingMt.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination Footer strictly matching Overview & Reports Stock In view */}
      {totalRecords > 0 && (
        <div className="pt-2 px-1 border-t border-slate-200 dark:border-slate-750 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 select-none">
          {/* Left Side: Rows Selector and Item Counter */}
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
              Showing <strong className="text-slate-900 dark:text-white font-bold">{startIndex + 1}</strong>–<strong className="text-slate-900 dark:text-white font-bold">{endIndex}</strong> of <strong className="text-slate-900 dark:text-white font-bold">{totalRecords}</strong> days
            </span>
          </div>

          {/* Right Side: Page Controls */}
          {pageSize !== -1 && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                disabled={effectivePage === 1}
                className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
                title="First Page"
                aria-label="First Page"
              >
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={effectivePage === 1}
                className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
                title="Previous Page"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {effectivePage} / {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={effectivePage === totalPages}
                className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
                title="Next Page"
                aria-label="Next Page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                disabled={effectivePage === totalPages}
                className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs"
                title="Last Page"
                aria-label="Last Page"
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
          title="DAILY IN, OUT & STOCK REPORT"
          subtitle={`Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`}
        >
          <div className="p-4 space-y-4 text-black bg-white">
            <div className="text-center pb-3 border-b border-black">
              <h1 className="text-lg font-black uppercase tracking-wide">
                {companySettings?.companyName || 'KISHAN BOTANIX LTD.'}
              </h1>
              <p className="text-xs uppercase tracking-wider font-semibold">DAILY IN, OUT & STOCK REPORT</p>
              <p className="text-[10px] text-gray-600">
                Period: {startDate || 'All Time'} to {endDate || 'Present'}
              </p>
            </div>

            <table className="w-full border-collapse border border-black text-[10px]">
              <thead>
                <tr className="bg-gray-200">
                  <th rowSpan={2} className="border border-black p-1 text-center">DATE</th>
                  <th rowSpan={2} className="border border-black p-1 text-right">STOCK IN (KG)</th>
                  <th rowSpan={2} className="border border-black p-1 text-right">STOCK OUT (KG)</th>
                  <th colSpan={3} className="border border-black p-1 text-center">CLOSING STOCK</th>
                </tr>
                <tr className="bg-gray-100">
                  <th className="border border-black p-1 text-right">CLOSING STOCK (KG)</th>
                  <th className="border border-black p-1 text-right">NO OF BAG CLOSING STOCK</th>
                  <th className="border border-black p-1 text-right">CLOSING STOCK (MT)</th>
                </tr>
              </thead>
              <tbody>
                {sortedList.map((r) => (
                  <tr key={r.date}>
                    <td className="border border-black p-1 text-center font-bold">{formatDisplayDate(r.date)}</td>
                    <td className="border border-black p-1 text-right">{r.stockInKg.toLocaleString()}</td>
                    <td className="border border-black p-1 text-right">{r.stockOutKg.toLocaleString()}</td>
                    <td className="border border-black p-1 text-right">{r.closingStockKg.toLocaleString()}</td>
                    <td className="border border-black p-1 text-right">{r.noOfBagClosingStock.toLocaleString()}</td>
                    <td className="border border-black p-1 text-right">{r.closingStockMt.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="font-bold bg-gray-200">
                <tr>
                  <td className="border border-black p-1 text-center">TOTAL</td>
                  <td className="border border-black p-1 text-right">{overallTotals.totalInKg.toLocaleString()}</td>
                  <td className="border border-black p-1 text-right">{overallTotals.totalOutKg.toLocaleString()}</td>
                  <td className="border border-black p-1 text-right">{overallTotals.latestClosingKg.toLocaleString()}</td>
                  <td className="border border-black p-1 text-right">{overallTotals.latestClosingBags.toLocaleString()}</td>
                  <td className="border border-black p-1 text-right">{overallTotals.latestClosingMt.toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </PrintPreviewModal>
      )}
    </div>
  );
};
