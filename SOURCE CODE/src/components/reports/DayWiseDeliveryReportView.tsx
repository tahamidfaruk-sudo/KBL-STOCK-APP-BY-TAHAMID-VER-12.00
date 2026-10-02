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
  TrendingDown,
  Percent,
} from 'lucide-react';
import { exportToExcel, exportToPdf, validateAndTriggerPrint } from '../../utils/exportUtils';
import { sortData } from '../../utils/sortUtils';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { ReportButtonGroup } from '../common/ReportButtonGroup';
import { SortIcon } from '../common/SortIcon';
import { formatDisplayDate } from '../../utils/dateUtils';
import { matchesUniversalSearch } from '../../utils/searchUtils';

export const DayWiseDeliveryReportView: React.FC = () => {
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
  const [selectedCustomer, setSelectedCustomer] = useState('');
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
    setSelectedCustomer('');
    setStartDate('');
    setEndDate('');
    setActiveDatePreset(null);
    setCurrentPage(1);
    addToast?.('All Day-wise Delivery Report filters reset successfully', 'info');
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
    Boolean(selectedCustomer),
    Boolean(startDate || endDate),
  ].filter(Boolean).length;

  // Unique customers for filter
  const uniqueCustomers = useMemo(() => {
    const set = new Set<string>();
    deliveryTransactions.forEach((d) => {
      const c = d.customerReceiver || d.clientReceiver;
      if (c && c.trim()) set.add(c.trim());
    });
    return Array.from(set).sort();
  }, [deliveryTransactions]);

  // Filter master datasets with user criteria
  const filteredStockIn = useMemo(() => {
    return stockTransactions.filter((s) => {
      if (s.status === 'rejected') return false;
      if (selectedStorage && s.coldStorageId !== selectedStorage) return false;
      if (selectedVariety && s.varietyId !== selectedVariety) return false;
      if (selectedClass && s.classId !== selectedClass) return false;
      if (selectedGrade && s.gradeId !== selectedGrade) return false;
      return true;
    });
  }, [stockTransactions, selectedStorage, selectedVariety, selectedClass, selectedGrade]);

  const filteredStockOut = useMemo(() => {
    return deliveryTransactions.filter((d) => {
      if (d.status === 'cancelled') return false;
      if (selectedStorage && d.coldStorageId !== selectedStorage) return false;
      if (selectedVariety && d.varietyId !== selectedVariety) return false;
      if (selectedClass && d.classId !== selectedClass) return false;
      if (selectedGrade && d.gradeId !== selectedGrade) return false;
      if (selectedCustomer && (d.customerReceiver || d.clientReceiver) !== selectedCustomer) return false;
      return true;
    });
  }, [deliveryTransactions, selectedStorage, selectedVariety, selectedClass, selectedGrade, selectedCustomer]);

  // Daily Delivery Ledger Computation
  // STRICT COLUMNS:
  // 1. DATE
  // 2. OPENING STOCK (MT)
  // 3. STOCK OUT (MT)
  // 4. CLOSING STOCK (MT)
  // 5. STOCK BAG QTY
  // 6. STOCK OUT %
  // 7. REMAINING STOCK %
  const dayWiseList = useMemo(() => {
    // Collect all dates that have deliveries or activity
    const deliveryDatesSet = new Set<string>();
    filteredStockOut.forEach((d) => {
      if (d.date) deliveryDatesSet.add(d.date);
    });

    let targetDates: string[] = Array.from(deliveryDatesSet).sort();

    // Date range filter
    if (startDate && endDate) {
      targetDates = targetDates.filter((d) => d >= startDate && d <= endDate);
    } else if (startDate) {
      targetDates = targetDates.filter((d) => d >= startDate);
    } else if (endDate) {
      targetDates = targetDates.filter((d) => d <= endDate);
    }

    if (targetDates.length === 0) {
      return [];
    }

    // Chronologically compute running stock ledger
    // Opening stock on date D = all stock in before D - all stock out before D
    const rows = targetDates.map((dateStr, idx) => {
      // Prior stock in before this date
      const priorInKg = filteredStockIn
        .filter((s) => s.date < dateStr)
        .reduce((sum, s) => sum + (s.totalKg || s.sackQuantity * (s.kgPerBag || 50)), 0);
      const priorInBags = filteredStockIn
        .filter((s) => s.date < dateStr)
        .reduce((sum, s) => sum + (s.sackQuantity || 0), 0);

      // Prior stock out before this date
      const priorOutKg = filteredStockOut
        .filter((d) => d.date < dateStr)
        .reduce((sum, d) => sum + (d.totalKg || d.sackQuantity * (d.kgPerBag || 50)), 0);
      const priorOutBags = filteredStockOut
        .filter((d) => d.date < dateStr)
        .reduce((sum, d) => sum + (d.sackQuantity || 0), 0);

      // Stock In on this specific date (if any)
      const dayInKg = filteredStockIn
        .filter((s) => s.date === dateStr)
        .reduce((sum, s) => sum + (s.totalKg || s.sackQuantity * (s.kgPerBag || 50)), 0);
      const dayInBags = filteredStockIn
        .filter((s) => s.date === dateStr)
        .reduce((sum, s) => sum + (s.sackQuantity || 0), 0);

      // Stock Out on this specific date
      const dayDeliveries = filteredStockOut.filter((d) => d.date === dateStr);
      const dayOutKg = dayDeliveries.reduce(
        (sum, d) => sum + (d.totalKg || d.sackQuantity * (d.kgPerBag || 50)),
        0
      );
      const dayOutBags = dayDeliveries.reduce((sum, d) => sum + (d.sackQuantity || 0), 0);

      // Opening stock at the beginning of the day (including any inward batches before dispatch)
      const openingStockKg = Math.max(0, priorInKg - priorOutKg + dayInKg);
      const openingStockBags = Math.max(0, priorInBags - priorOutBags + dayInBags);
      const openingStockMt = Number((openingStockKg / 1000).toFixed(3));

      // Stock Out on this day
      const stockOutKg = dayOutKg;
      const stockOutMt = Number((stockOutKg / 1000).toFixed(3));

      // Closing stock after today's dispatch
      const closingStockKg = Math.max(0, openingStockKg - stockOutKg);
      const closingStockMt = Number((closingStockKg / 1000).toFixed(3));
      const stockBagQty = Math.max(0, openingStockBags - dayOutBags);

      // Stock Out %: percentage of opening stock dispatched
      const stockOutPct =
        openingStockMt > 0 ? Math.min(100, Math.max(0, (stockOutMt / openingStockMt) * 100)) : 0;

      // Remaining Stock %: percentage of opening stock retained
      const remainingStockPct =
        openingStockMt > 0 ? Math.min(100, Math.max(0, (closingStockMt / openingStockMt) * 100)) : (closingStockMt > 0 ? 100 : 0);

      return {
        id: `day-del-${dateStr}`,
        sl: idx + 1,
        date: dateStr,
        openingStockMt,
        openingStockKg,
        stockOutMt,
        stockOutKg,
        stockOutBags: dayOutBags,
        closingStockMt,
        closingStockKg,
        stockBagQty,
        stockOutPct,
        remainingStockPct,
      };
    });

    // Universal Search filtering
    const searchFiltered = rows.filter((r) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        r.date.includes(q) ||
        formatDisplayDate(r.date).toLowerCase().includes(q) ||
        r.openingStockMt.toString().includes(q) ||
        r.stockOutMt.toString().includes(q) ||
        r.closingStockMt.toString().includes(q) ||
        r.stockBagQty.toString().includes(q) ||
        r.stockOutPct.toFixed(2).includes(q) ||
        r.remainingStockPct.toFixed(2).includes(q)
      );
    });

    return sortData(searchFiltered, sortKey, sortDir);
  }, [
    filteredStockIn,
    filteredStockOut,
    startDate,
    endDate,
    searchQuery,
    sortKey,
    sortDir,
  ]);

  // Overall Totals
  const overallTotals = useMemo(() => {
    const totalOutMt = dayWiseList.reduce((acc, row) => acc + row.stockOutMt, 0);
    const totalOutKg = dayWiseList.reduce((acc, row) => acc + row.stockOutKg, 0);
    const totalOutBags = dayWiseList.reduce((acc, row) => acc + row.stockOutBags, 0);

    const initialOpeningMt = dayWiseList.length > 0 ? dayWiseList[0].openingStockMt : 0;
    const latestClosingMt = dayWiseList.length > 0 ? dayWiseList[dayWiseList.length - 1].closingStockMt : 0;
    const latestClosingBags = dayWiseList.length > 0 ? dayWiseList[dayWiseList.length - 1].stockBagQty : 0;

    const overallOutPct =
      initialOpeningMt > 0 ? Math.min(100, Math.max(0, (totalOutMt / initialOpeningMt) * 100)) : 0;
    const overallRemainingPct =
      initialOpeningMt > 0 ? Math.min(100, Math.max(0, (latestClosingMt / initialOpeningMt) * 100)) : 0;

    return {
      initialOpeningMt,
      totalOutMt,
      totalOutKg,
      totalOutBags,
      latestClosingMt,
      latestClosingBags,
      overallOutPct,
      overallRemainingPct,
    };
  }, [dayWiseList]);

  // Paginated records
  const totalRecords = dayWiseList.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalRecords / pageSize));
  const effectivePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = pageSize === -1 ? 0 : (effectivePage - 1) * pageSize;
  const endIndex = pageSize === -1 ? totalRecords : Math.min(startIndex + pageSize, totalRecords);
  const paginatedRows = pageSize === -1 ? dayWiseList : dayWiseList.slice(startIndex, endIndex);

  // Dynamic table density styles matching Stock In
  const densityStyles = {
    compact: {
      row: 'h-8 sm:h-8.5',
      cell: 'py-1 text-[10px]',
      th: 'py-1 text-[9.5px]',
      badge: 'px-1 py-0.2 text-[8.5px]',
      tfoot: 'py-1 text-[10px]',
    },
    normal: {
      row: 'h-9 sm:h-9.5',
      cell: 'py-1.5 text-[11px]',
      th: 'py-1.5 text-[10px]',
      badge: 'px-1.5 py-0.5 text-[9px]',
      tfoot: 'py-1.5 text-[10.5px]',
    },
    comfortable: {
      row: 'h-10 sm:h-11',
      cell: 'py-2 sm:py-2.5 text-xs',
      th: 'py-2 sm:py-2.5 text-[10.5px]',
      badge: 'px-2 py-0.5 text-[10px]',
      tfoot: 'py-2 sm:py-2.5 text-xs',
    },
  }[density];

  const cellPadding = densityStyles.cell;
  const thPadding = densityStyles.th;

  // Excel Export: Exactly 7 columns
  const handleExportExcel = () => {
    const exportData: any[] = dayWiseList.map((row) => ({
      date: formatDisplayDate(row.date),
      openingStockMt: Number(row.openingStockMt.toFixed(3)),
      stockOutMt: Number(row.stockOutMt.toFixed(3)),
      closingStockMt: Number(row.closingStockMt.toFixed(3)),
      stockBagQty: row.stockBagQty,
      stockOutPct: `${row.stockOutPct.toFixed(2)}%`,
      remainingStockPct: `${row.remainingStockPct.toFixed(2)}%`,
    }));

    if (dayWiseList.length > 0) {
      exportData.push({
        date: 'TOTAL',
        openingStockMt: Number(overallTotals.initialOpeningMt.toFixed(3)),
        stockOutMt: Number(overallTotals.totalOutMt.toFixed(3)),
        closingStockMt: Number(overallTotals.latestClosingMt.toFixed(3)),
        stockBagQty: overallTotals.latestClosingBags,
        stockOutPct: `${overallTotals.overallOutPct.toFixed(2)}%`,
        remainingStockPct: `${overallTotals.overallRemainingPct.toFixed(2)}%`,
      });
    }

    const columns = [
      { header: 'DATE', key: 'date', width: 14 },
      { header: 'OPENING STOCK (MT)', key: 'openingStockMt', width: 22 },
      { header: 'STOCK OUT (MT)', key: 'stockOutMt', width: 20 },
      { header: 'CLOSING STOCK (MT)', key: 'closingStockMt', width: 22 },
      { header: 'STOCK BAG QTY', key: 'stockBagQty', width: 18 },
      { header: 'STOCK OUT %', key: 'stockOutPct', width: 16 },
      { header: 'REMAINING STOCK %', key: 'remainingStockPct', width: 20 },
    ];

    exportToExcel(
      exportData,
      columns,
      `DAY_WISE_DELIVERY_REPORT_${companySettings?.fiscalYear || '2024'}`,
      'DAY-WISE DELIVERY REPORT',
      companySettings,
      `Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`
    );
    addToast?.('Day-wise Delivery Report exported to Excel successfully!', 'success');
  };

  // PDF Export: Exactly 7 columns
  const handleExportPdf = () => {
    const exportData: any[] = dayWiseList.map((row) => ({
      date: formatDisplayDate(row.date),
      openingStockMt: row.openingStockMt.toFixed(3),
      stockOutMt: row.stockOutMt.toFixed(3),
      closingStockMt: row.closingStockMt.toFixed(3),
      stockBagQty: row.stockBagQty.toLocaleString(),
      stockOutPct: `${row.stockOutPct.toFixed(2)}%`,
      remainingStockPct: `${row.remainingStockPct.toFixed(2)}%`,
    }));

    if (dayWiseList.length > 0) {
      exportData.push({
        date: 'TOTAL',
        openingStockMt: overallTotals.initialOpeningMt.toFixed(3),
        stockOutMt: overallTotals.totalOutMt.toFixed(3),
        closingStockMt: overallTotals.latestClosingMt.toFixed(3),
        stockBagQty: overallTotals.latestClosingBags.toLocaleString(),
        stockOutPct: `${overallTotals.overallOutPct.toFixed(2)}%`,
        remainingStockPct: `${overallTotals.overallRemainingPct.toFixed(2)}%`,
      });
    }

    const columns = [
      { header: 'DATE', key: 'date' },
      { header: 'OPENING STOCK (MT)', key: 'openingStockMt' },
      { header: 'STOCK OUT (MT)', key: 'stockOutMt' },
      { header: 'CLOSING STOCK (MT)', key: 'closingStockMt' },
      { header: 'STOCK BAG QTY', key: 'stockBagQty' },
      { header: 'STOCK OUT %', key: 'stockOutPct' },
      { header: 'REMAINING STOCK %', key: 'remainingStockPct' },
    ];

    exportToPdf(
      exportData,
      columns,
      `DAY_WISE_DELIVERY_REPORT_${companySettings?.fiscalYear || '2024'}`,
      'DAY-WISE DELIVERY REPORT',
      companySettings,
      `Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`
    );
    addToast?.('Day-wise Delivery Report exported as PDF!', 'success');
  };

  return (
    <div className="space-y-3">
      {/* Page Title Card strictly matching Stock In layout */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-sky-50 dark:bg-sky-950/40 text-slate-900 dark:text-white rounded-xl border border-sky-200 dark:border-sky-800/60 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 bg-sky-600 dark:bg-sky-500 rounded-xs shadow-xs" />
          <h2 className="text-xs sm:text-sm font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase">
            DAY-WISE DELIVERY REPORT
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

      {/* Filter Section */}
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

            {/* Date Pickers container strictly matching Stock In page design */}
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
              <strong className="text-slate-800 dark:text-slate-200 font-semibold">{dayWiseList.length}</strong> days
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
              value={selectedCustomer}
              onChange={(e) => {
                setSelectedCustomer(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 text-slate-500 dark:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-normal uppercase truncate shadow-2xs"
              title="FILTER BY CUSTOMER"
            >
              <option value="" className="text-slate-500 dark:text-slate-400 font-normal">ALL CUSTOMERS</option>
              {uniqueCustomers.map((cust) => (
                <option key={cust} value={cust} className="text-slate-600 dark:text-slate-300 font-normal">
                  {cust.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Data Table: EXACT 7 COLUMNS AS REQUESTED */}
      <div className="border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs bg-white dark:bg-slate-900 overflow-x-auto">
        <table className="w-full text-left border-collapse border border-slate-300 dark:border-slate-700">
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
                <div className="inline-flex items-center gap-0.5 w-full">
                  <span className="break-words">DATE</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="date" />
                </div>
              </th>

              {/* 2. OPENING STOCK (MT) */}
              <th
                onClick={() => handleSort('openingStockMt')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[14%] ${
                  sortKey === 'openingStockMt'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="break-words">OPENING STOCK (MT)</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="openingStockMt" />
                </div>
              </th>

              {/* 3. STOCK OUT (MT) */}
              <th
                onClick={() => handleSort('stockOutMt')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[14%] ${
                  sortKey === 'stockOutMt'
                    ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="break-words">STOCK OUT (MT)</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="stockOutMt" />
                </div>
              </th>

              {/* 4. CLOSING STOCK (MT) */}
              <th
                onClick={() => handleSort('closingStockMt')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[14%] ${
                  sortKey === 'closingStockMt'
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="break-words">CLOSING STOCK (MT)</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="closingStockMt" />
                </div>
              </th>

              {/* 5. CLOSING STOCK BAG QUANTITY */}
              <th
                onClick={() => handleSort('stockBagQty')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[15%] ${
                  sortKey === 'stockBagQty'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="break-words">CLOSING STOCK BAG QUANTITY</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="stockBagQty" />
                </div>
              </th>

              {/* 6. STOCK OUT % */}
              <th
                onClick={() => handleSort('stockOutPct')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[14%] ${
                  sortKey === 'stockOutPct'
                    ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="break-words">STOCK OUT %</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="stockOutPct" />
                </div>
              </th>

              {/* 7. REMAINING STOCK % */}
              <th
                onClick={() => handleSort('remainingStockPct')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[14%] ${
                  sortKey === 'remainingStockPct'
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="break-words">REMAINING STOCK %</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="remainingStockPct" />
                </div>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-10 text-center text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 text-xs"
                >
                  <p className="font-medium">No matching Day-wise Delivery records found.</p>
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
                  {/* 1. DATE */}
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold tabular-nums`}>
                    {formatDisplayDate(row.date)}
                  </td>

                  {/* 2. OPENING STOCK (MT) */}
                  <td className={`${cellPadding} pr-3 text-right font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 tabular-nums`}>
                    {row.openingStockMt.toFixed(3)}
                  </td>

                  {/* 3. STOCK OUT (MT) */}
                  <td className={`${cellPadding} pr-3 text-right font-black text-rose-600 dark:text-rose-400 bg-rose-50/30 dark:bg-rose-950/20 border border-slate-300 dark:border-slate-700 tabular-nums`}>
                    {row.stockOutMt > 0 ? row.stockOutMt.toFixed(3) : '-'}
                  </td>

                  {/* 4. CLOSING STOCK (MT) */}
                  <td className={`${cellPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 tabular-nums`}>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border border-emerald-500 dark:border-emerald-600 bg-transparent text-emerald-800 dark:text-emerald-300 tabular-nums shadow-2xs">
                      {row.closingStockMt.toFixed(3)}
                    </span>
                  </td>

                  {/* 5. CLOSING STOCK BAG QUANTITY */}
                  <td className={`${cellPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 tabular-nums`}>
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border border-sky-500 dark:border-sky-400 bg-transparent text-sky-800 dark:text-sky-300 tabular-nums shadow-2xs">
                      {row.stockBagQty.toLocaleString()}
                    </span>
                  </td>

                  {/* 6. STOCK OUT % */}
                  <td className={`${cellPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 tabular-nums`}>
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                      {row.stockOutPct.toFixed(2)}%
                    </span>
                  </td>

                  {/* 7. REMAINING STOCK % */}
                  <td className={`${cellPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 tabular-nums`}>
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      {row.remainingStockPct.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Footer Total Row */}
          {dayWiseList.length > 0 && (
            <tfoot className="bg-slate-100 dark:bg-slate-850 font-bold border-t-2 border-slate-400 dark:border-slate-600">
              <tr>
                {/* 1. DATE: TOTAL */}
                <td className="py-2 pl-3 text-left uppercase tracking-wider text-slate-900 dark:text-white bg-slate-200/90 dark:bg-slate-800 font-black border border-slate-300 dark:border-slate-700 shadow-2xs">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border border-slate-700 dark:border-slate-300 text-xs font-black tracking-widest uppercase shadow-xs">
                      <Layers className="w-3 h-3 text-amber-400 dark:text-amber-500" />
                      <span>TOTAL</span>
                    </span>
                  </div>
                </td>

                {/* 2. OPENING STOCK (MT) */}
                <td className="py-2 pr-3 text-right font-black text-slate-800 dark:text-slate-200 bg-transparent border border-slate-300 dark:border-slate-700 tabular-nums text-[10.5px]">
                  {overallTotals.initialOpeningMt.toFixed(3)}
                </td>

                {/* 3. STOCK OUT (MT) */}
                <td className="py-2 pr-3 text-right font-black text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/30 border border-slate-300 dark:border-slate-700 tabular-nums text-[10.5px]">
                  {overallTotals.totalOutMt.toFixed(3)}
                </td>

                {/* 4. CLOSING STOCK (MT) */}
                <td className="py-2 pr-3 text-right border border-slate-300 dark:border-slate-700 tabular-nums text-[10.5px] font-black text-emerald-700 dark:text-emerald-300">
                  {overallTotals.latestClosingMt.toFixed(3)}
                </td>

                {/* 5. CLOSING STOCK BAG QUANTITY */}
                <td className="py-2 pr-3 text-right font-black text-sky-700 dark:text-sky-300 bg-transparent border border-slate-300 dark:border-slate-700 tabular-nums text-[10.5px]">
                  {overallTotals.latestClosingBags.toLocaleString()}
                </td>

                {/* 6. STOCK OUT % */}
                <td className="py-2 pr-3 text-right font-black text-rose-700 dark:text-rose-300 border border-slate-300 dark:border-slate-700 tabular-nums text-[10.5px]">
                  {overallTotals.overallOutPct.toFixed(2)}%
                </td>

                {/* 7. REMAINING STOCK % */}
                <td className="py-2 pr-3 text-right font-black text-emerald-700 dark:text-emerald-300 border border-slate-300 dark:border-slate-700 tabular-nums text-[10.5px]">
                  {overallTotals.overallRemainingPct.toFixed(2)}%
                </td>
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
              <span>Show</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="py-1 px-2 text-xs rounded-md bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-semibold shadow-2xs"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={-1}>All ({totalRecords})</option>
              </select>
              <span>entries per page</span>
            </div>

            <div className="h-3.5 w-px bg-slate-300 dark:bg-slate-700 hidden sm:block" />

            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Showing <span className="font-bold text-slate-800 dark:text-slate-200">{startIndex + 1}</span> to{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{endIndex}</span> of{' '}
              <span className="font-bold text-slate-800 dark:text-slate-200">{totalRecords}</span> days
            </div>
          </div>

          {/* Right Side: Page navigation */}
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

              <span className="px-2 py-0.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                {effectivePage} / {totalPages}
              </span>

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

      {/* Print Preview Modal: Exactly 7 columns */}
      {isPreviewOpen && (
        <PrintPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          title="DAY-WISE DELIVERY REPORT"
          documentTitle="DAY-WISE DELIVERY REPORT"
          subtitle="Day-wise Delivery & Stock Balance Ledger"
          period={`Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`}
          columns={[
            { header: 'DATE', key: 'date' },
            { header: 'OPENING STOCK (MT)', key: 'openingStockMt', align: 'right' },
            { header: 'STOCK OUT (MT)', key: 'stockOutMt', align: 'right' },
            { header: 'CLOSING STOCK (MT)', key: 'closingStockMt', align: 'right' },
            { header: 'STOCK BAG QTY', key: 'stockBagQty', align: 'right' },
            { header: 'STOCK OUT %', key: 'stockOutPct', align: 'right' },
            { header: 'REMAINING STOCK %', key: 'remainingStockPct', align: 'right' },
          ]}
          data={dayWiseList.map((row) => ({
            date: formatDisplayDate(row.date),
            openingStockMt: row.openingStockMt.toFixed(3),
            stockOutMt: row.stockOutMt.toFixed(3),
            closingStockMt: row.closingStockMt.toFixed(3),
            stockBagQty: row.stockBagQty.toLocaleString(),
            stockOutPct: `${row.stockOutPct.toFixed(2)}%`,
            remainingStockPct: `${row.remainingStockPct.toFixed(2)}%`,
          }))}
          summaryItems={[
            { label: 'Initial Opening Stock', value: `${overallTotals.initialOpeningMt.toFixed(3)} MT` },
            { label: 'Total Stock Out', value: `${overallTotals.totalOutMt.toFixed(3)} MT (${overallTotals.totalOutBags.toLocaleString()} Bags)` },
            { label: 'Current Closing Stock', value: `${overallTotals.latestClosingMt.toFixed(3)} MT (${overallTotals.latestClosingBags.toLocaleString()} Bags)`, highlight: true },
            { label: 'Overall Stock Out %', value: `${overallTotals.overallOutPct.toFixed(2)}%` },
            { label: 'Overall Remaining %', value: `${overallTotals.overallRemainingPct.toFixed(2)}%` },
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
