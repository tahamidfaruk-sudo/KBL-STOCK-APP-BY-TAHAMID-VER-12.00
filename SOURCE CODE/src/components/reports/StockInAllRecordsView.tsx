import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { TableDensity } from '../../types';
import {
  Boxes,
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

export const StockInAllRecordsView: React.FC = () => {
  const {
    stockTransactions,
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

  // Filters
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

  // Format Helper: Clean Class Name (removes (FS), (CS) brackets)
  const getCleanClassName = (className: string): string => {
    if (!className) return '-';
    return className.replace(/\s*\([^)]*\)/gi, '').trim().toUpperCase();
  };

  // Format Helper: Clean Grade Name (only 'A', 'B', 'C', 'OS', 'US' without 'Grade' or sizes)
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

  // Filtered dataset
  const filteredList = useMemo(() => {
    return stockTransactions.filter((s) => {
      if (startDate && s.date < startDate) return false;
      if (endDate && s.date > endDate) return false;
      if (selectedStorage && s.coldStorageId !== selectedStorage) return false;
      if (selectedVariety && s.varietyId !== selectedVariety) return false;
      if (selectedClass && s.classId !== selectedClass) return false;
      if (selectedGrade && s.gradeId !== selectedGrade) return false;
      if (selectedBlock && s.productionBlockId !== selectedBlock) return false;

      const cs = coldStorages.find((c) => c.id === s.coldStorageId);
      const csName = cs?.name || '';
      const csCode = cs?.code || '';
      const vName = varieties.find((v) => v.id === s.varietyId)?.name || '';
      const cName = seedClasses.find((c) => c.id === s.classId)?.name || '';
      const gName = grades.find((g) => g.id === s.gradeId)?.name || '';
      const bName = productionBlocks.find((b) => b.id === s.productionBlockId)?.name || s.farmBlock || '';

      if (
        !matchesUniversalSearch(s, searchQuery, [
          csName,
          csCode,
          vName,
          cName,
          gName,
          bName,
          s.kblChallanNo || '',
          s.srNo || '',
        ])
      ) {
        return false;
      }

      return true;
    });
  }, [
    stockTransactions,
    startDate,
    endDate,
    selectedStorage,
    selectedVariety,
    selectedClass,
    selectedGrade,
    selectedBlock,
    searchQuery,
    coldStorages,
    varieties,
    seedClasses,
    grades,
    productionBlocks,
  ]);

  // Sort and calculate accurate running cumulative total in KG
  const sortedAndCumulativeList = useMemo(() => {
    const sorted = sortData(filteredList, sortKey, sortDir);

    let runningCumulativeKg = 0;
    return sorted.map((s, index) => {
      const kgPerBag = s.kgPerBag || 50;
      const totalKgIn = s.totalKg || s.sackQuantity * kgPerBag;
      const totalMtIn = s.totalMt || Number((totalKgIn / 1000).toFixed(3));
      const noOfBagIn = s.sackQuantity;

      runningCumulativeKg += totalKgIn;

      const cs = coldStorages.find((c) => c.id === s.coldStorageId);
      const coldStorageCode = cs?.code || (cs?.name ? cs.name.replace(/cold\s*storage/gi, '').trim() : '-');
      const coldStorageName = cs?.name || '-';

      const v = varieties.find((item) => item.id === s.varietyId);
      const varietyName = (v?.name || '-').toUpperCase();

      const cls = seedClasses.find((c) => c.id === s.classId);
      const cleanClassName = getCleanClassName(cls?.name || '');

      const grd = grades.find((g) => g.id === s.gradeId);
      const cleanGrade = getCleanGradeName(grd?.name || '', grd?.code);

      const blockName = (productionBlocks.find((b) => b.id === s.productionBlockId)?.name || s.farmBlock || '-').toUpperCase();

      return {
        ...s,
        sl: index + 1,
        date: s.date,
        varietyName,
        className: cleanClassName,
        gradeName: cleanGrade,
        blockName,
        kblChallanNo: s.kblChallanNo || '-',
        coldStorageCode,
        coldStorageName,
        srNo: s.srNo || '-',
        noOfBagIn,
        totalKgIn,
        totalMtIn,
        cumulativeTotalKg: runningCumulativeKg,
      };
    });
  }, [
    filteredList,
    sortKey,
    sortDir,
    coldStorages,
    varieties,
    seedClasses,
    grades,
    productionBlocks,
  ]);

  // Overall totals
  const overallTotals = useMemo(() => {
    const totalBags = sortedAndCumulativeList.reduce((acc, row) => acc + row.noOfBagIn, 0);
    const totalKg = sortedAndCumulativeList.reduce((acc, row) => acc + row.totalKgIn, 0);
    const totalMt = Number((totalKg / 1000).toFixed(3));
    return {
      totalBags,
      totalKg,
      totalMt,
    };
  }, [sortedAndCumulativeList]);

  // Paginated records
  const totalRecords = sortedAndCumulativeList.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalRecords / pageSize));
  const effectivePage = Math.min(Math.max(1, currentPage), totalPages);
  const startIndex = pageSize === -1 ? 0 : (effectivePage - 1) * pageSize;
  const endIndex = pageSize === -1 ? totalRecords : Math.min(startIndex + pageSize, totalRecords);
  const paginatedRows = pageSize === -1 ? sortedAndCumulativeList : sortedAndCumulativeList.slice(startIndex, endIndex);

  // Dynamic table density styles with pronounced row height, padding, and typography differences
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

  // Excel Export with rich ExcelJS styling, header banner, zebra rows & bold total row
  const handleExportExcel = () => {
    const exportData: any[] = sortedAndCumulativeList.map((row) => ({
      date: formatDisplayDate(row.date),
      variety: row.varietyName,
      className: row.className,
      gradeName: row.gradeName,
      blockName: row.blockName,
      kblChallanNo: row.kblChallanNo,
      coldStorageCode: row.coldStorageCode,
      srNo: row.srNo,
      noOfBagIn: row.noOfBagIn,
      totalKgIn: row.totalKgIn,
      totalMtIn: row.totalMtIn,
      cumulativeTotalKg: row.cumulativeTotalKg,
    }));

    // Append formatted TOTAL row
    if (sortedAndCumulativeList.length > 0) {
      exportData.push({
        date: 'TOTAL',
        variety: '',
        className: '',
        gradeName: '',
        blockName: '',
        kblChallanNo: '',
        coldStorageCode: '',
        srNo: '',
        noOfBagIn: overallTotals.totalBags,
        totalKgIn: overallTotals.totalKg,
        totalMtIn: overallTotals.totalMt,
        cumulativeTotalKg: overallTotals.totalKg,
        isTotal: true,
      });
    }

    const columns: any[] = [
      { header: 'DATE', key: 'date', width: 13, align: 'left' },
      { header: 'VARIETY', key: 'variety', width: 20, align: 'left' },
      { header: 'CLASS', key: 'className', width: 16, align: 'left' },
      { header: 'GRADE', key: 'gradeName', width: 10, align: 'left' },
      { header: 'BLOCK NAME', key: 'blockName', width: 20, align: 'left' },
      { header: 'CHALLAN NO', key: 'kblChallanNo', width: 16, align: 'left' },
      { header: 'COLD STORAGE', key: 'coldStorageCode', width: 16, align: 'left' },
      { header: 'SR NO.', key: 'srNo', width: 14, align: 'left' },
      { header: 'BAG IN', key: 'noOfBagIn', width: 15, isNumeric: true },
      { header: 'STOCK IN (KG)', key: 'totalKgIn', width: 17, isNumeric: true },
      { header: 'STOCK IN (MT)', key: 'totalMtIn', width: 15, isNumeric: true },
      { header: 'CUMULATIVE (KG)', key: 'cumulativeTotalKg', width: 22, isNumeric: true },
    ];

    exportToExcel(
      exportData,
      columns,
      `STOCK_IN_REPORT_${companySettings?.fiscalYear || '2024'}`,
      'STOCK IN REPORT',
      companySettings,
      `Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`
    );
    addToast?.('Stock In report exported to Excel successfully with full styling!', 'success');
  };

  // PDF Export
  const handleExportPdf = () => {
    const exportData: any[] = sortedAndCumulativeList.map((row) => ({
      date: formatDisplayDate(row.date),
      variety: row.varietyName,
      classGrade: `${row.className} - ${row.gradeName}`,
      blockName: row.blockName,
      kblChallanNo: row.kblChallanNo,
      coldStorageCode: row.coldStorageCode,
      srNo: row.srNo,
      noOfBagIn: row.noOfBagIn.toLocaleString(),
      totalKgIn: row.totalKgIn.toLocaleString(),
      totalMtIn: row.totalMtIn.toFixed(3),
      cumulativeTotalKg: row.cumulativeTotalKg.toLocaleString(),
    }));

    if (sortedAndCumulativeList.length > 0) {
      exportData.push({
        date: 'TOTAL',
        variety: '',
        classGrade: '',
        blockName: '',
        kblChallanNo: '',
        coldStorageCode: '',
        srNo: '',
        noOfBagIn: overallTotals.totalBags.toLocaleString(),
        totalKgIn: overallTotals.totalKg.toLocaleString(),
        totalMtIn: overallTotals.totalMt.toFixed(3),
        cumulativeTotalKg: overallTotals.totalKg.toLocaleString(),
        isTotal: true,
      });
    }

    const columns: any[] = [
      { header: 'DATE', key: 'date', align: 'left' },
      { header: 'VARIETY', key: 'variety', align: 'left' },
      { header: 'CLASS & GRADE', key: 'classGrade', align: 'left' },
      { header: 'BLOCK NAME', key: 'blockName', align: 'left' },
      { header: 'CHALLAN NO', key: 'kblChallanNo', align: 'left' },
      { header: 'COLD STORAGE', key: 'coldStorageCode', align: 'left' },
      { header: 'SR NO.', key: 'srNo', align: 'left' },
      { header: 'BAG IN', key: 'noOfBagIn', isNumeric: true },
      { header: 'STOCK IN (KG)', key: 'totalKgIn', isNumeric: true },
      { header: 'STOCK IN (MT)', key: 'totalMtIn', isNumeric: true },
      { header: 'CUMULATIVE (KG)', key: 'cumulativeTotalKg', isNumeric: true },
    ];

    exportToPdf(
      exportData,
      columns,
      `STOCK_IN_REPORT_${companySettings?.fiscalYear || '2024'}`,
      'STOCK IN REPORT',
      companySettings,
      'l',
      `Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`
    );
    addToast?.('Stock In report exported as PDF!', 'success');
  };

  return (
    <div className="space-y-3">
      {/* Page Title Card strictly matching Dashboard layout */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-sky-50 dark:bg-sky-950/40 text-slate-900 dark:text-white rounded-xl border border-sky-200 dark:border-sky-800/60 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 bg-sky-600 dark:bg-sky-500 rounded-xs shadow-xs" />
          <h2 className="text-xs sm:text-sm font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase">
            STOCK IN
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

          {/* Export & Print: Icon-only buttons with exact Cold Storage Summary styling */}
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

          {/* Right grouping: Quick Buttons styled as summary toggles + counter + icon-only reset */}
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

            {/* Clear Filter button with icon only matching Cold Storage Summary Reset */}
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

        {/* ROW 2: 6 Dropdown Filters with softer font colors and weights */}
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

      {/* Main Data Table - Configured with responsive wrapper, balanced column widths, and strict overflow protection */}
      <div className="border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs bg-white dark:bg-slate-900 overflow-x-auto">
        <table className="w-full text-left border-collapse border border-slate-300 dark:border-slate-700">
          {/* Header Row: PER BAG removed, 11 columns cleanly proportioned and overflow-proof */}
          <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-slate-700 text-[10px]">
            <tr>
              {/* 1. DATE (7%) */}
              <th
                onClick={() => handleSort('date')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[7%] ${
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

              {/* 2. VARIETY (10%) */}
              <th
                onClick={() => handleSort('varietyName')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[10%] ${
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

              {/* 3. CLASS & GRADE (10.5%) */}
              <th
                onClick={() => handleSort('className')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[10.5%] ${
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

              {/* 4. BLOCK NAME (9.5%) */}
              <th
                onClick={() => handleSort('blockName')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[9.5%] ${
                  sortKey === 'blockName'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center gap-0.5 w-full">
                  <span className="break-words">BLOCK NAME</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="blockName" />
                </div>
              </th>

              {/* 5. KBL CHALLAN NO (10.5%) */}
              <th
                onClick={() => handleSort('kblChallanNo')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[10.5%] whitespace-nowrap ${
                  sortKey === 'kblChallanNo'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center gap-0.5 w-full whitespace-nowrap">
                  <span className="break-words">CHALLAN NO</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="kblChallanNo" />
                </div>
              </th>

              {/* 6. COLD STORAGE (9%) */}
              <th
                onClick={() => handleSort('coldStorageCode')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[9%] ${
                  sortKey === 'coldStorageCode'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center gap-0.5 w-full">
                  <span className="break-words">COLD STORAGE</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="coldStorageCode" />
                </div>
              </th>

              {/* 7. SR NO. (6.5%) */}
              <th
                onClick={() => handleSort('srNo')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[6.5%] ${
                  sortKey === 'srNo'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center gap-0.5 w-full">
                  <span className="break-words">SR NO.</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="srNo" />
                </div>
              </th>

              {/* 8. NO OF BAG IN (7.5%) */}
              <th
                onClick={() => handleSort('noOfBagIn')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[7.5%] ${
                  sortKey === 'noOfBagIn'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="break-words">BAG IN</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="noOfBagIn" />
                </div>
              </th>

              {/* 9. STOCK IN (KG) (10%) */}
              <th
                onClick={() => handleSort('totalKgIn')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[10%] ${
                  sortKey === 'totalKgIn'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="break-words font-bold">STOCK IN (KG)</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="totalKgIn" />
                </div>
              </th>

              {/* 10. STOCK IN (MT) (9.5%) */}
              <th
                onClick={() => handleSort('totalMtIn')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[9.5%] ${
                  sortKey === 'totalMtIn'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="break-words font-bold">STOCK IN (MT)</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="totalMtIn" />
                </div>
              </th>

              {/* 11. STOCK IN CUMULATIVE (KG) (10%) */}
              <th
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 font-bold select-none text-cyan-700 dark:text-cyan-300 bg-cyan-50/50 dark:bg-cyan-950/20 w-[10%]`}
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="break-words">CUMULATIVE (KG)</span>
                </div>
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={11}
                  className="py-10 text-center text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 text-xs"
                >
                  <p className="font-medium">No matching Stock In records found.</p>
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
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium tabular-nums`}>
                    {formatDisplayDate(row.date)}
                  </td>

                  {/* 2. VARIETY */}
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700`}>
                    <span className={`font-bold text-slate-800 dark:text-slate-100 break-words tracking-tight ${densityStyles.variety}`} title={row.varietyName}>
                      {row.varietyName}
                    </span>
                  </td>

                  {/* 3. CLASS & GRADE */}
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700`}>
                    <div className="flex items-center gap-1.5 min-w-0" title={`${row.className} - Grade ${row.gradeName}`}>
                      <span className={`font-bold text-purple-900 dark:text-purple-200 break-words uppercase tracking-tight ${densityStyles.variety}`}>
                        {row.className}
                      </span>
                      <span className={`inline-flex items-center justify-center font-black uppercase border border-teal-500 text-teal-800 dark:text-teal-200 bg-teal-100/80 dark:bg-teal-950/50 rounded leading-none shadow-2xs shrink-0 ${densityStyles.badge}`}>
                        {row.gradeName}
                      </span>
                    </div>
                  </td>

                  {/* 4. BLOCK NAME */}
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium`} title={row.blockName}>
                    {row.blockName}
                  </td>

                  {/* 5. KBL CHALLAN NO */}
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 whitespace-nowrap`}>
                    <span className="inline-block px-1 py-0.5 rounded text-[10px] font-semibold border border-slate-300 dark:border-slate-650 text-slate-700 dark:text-slate-300 bg-transparent tabular-nums whitespace-nowrap">
                      {row.kblChallanNo}
                    </span>
                  </td>

                  {/* 6. COLD STORAGE */}
                  <td className={`${cellPadding} pl-3 text-left font-bold border border-slate-300 dark:border-slate-700`}>
                    <span className="inline-block px-1 py-0.5 rounded text-[10px] font-bold border border-indigo-400 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300 uppercase tracking-wide bg-transparent shadow-2xs" title={row.coldStorageName}>
                      {row.coldStorageCode}
                    </span>
                  </td>

                  {/* 7. SR NO. */}
                  <td className={`${cellPadding} pl-3 text-left font-bold border border-slate-300 dark:border-slate-700`}>
                    <span className="inline-block px-1 py-0.5 rounded text-[10px] font-semibold border border-sky-400 dark:border-sky-500 text-sky-700 dark:text-sky-300 bg-transparent shadow-2xs tabular-nums">
                      {row.srNo}
                    </span>
                  </td>

                  {/* 8. NO OF BAG IN */}
                  <td className={`${cellPadding} pr-3 text-right font-semibold text-blue-700 dark:text-blue-400 border border-slate-300 dark:border-slate-700 tabular-nums`}>
                    {row.noOfBagIn > 0 ? row.noOfBagIn.toLocaleString() : '-'}
                  </td>

                  {/* 9. STOCK IN (KG) */}
                  <td className={`${cellPadding} pr-3 text-right font-semibold text-purple-700 dark:text-purple-400 border border-slate-300 dark:border-slate-700 tabular-nums`}>
                    {row.totalKgIn > 0 ? row.totalKgIn.toLocaleString() : '-'}
                  </td>

                  {/* 10. STOCK IN (MT) */}
                  <td className={`${cellPadding} pr-3 text-right font-bold text-emerald-700 dark:text-emerald-400 border border-slate-300 dark:border-slate-700 tabular-nums`}>
                    {row.totalMtIn > 0 ? row.totalMtIn.toFixed(3) : '-'}
                  </td>

                  {/* 11. STOCK IN CUMULATIVE (KG) */}
                  <td className={`${cellPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 bg-cyan-50/20 dark:bg-cyan-950/10 tabular-nums`}>
                    {row.cumulativeTotalKg > 0 ? (
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border border-cyan-500 dark:border-cyan-600 bg-transparent text-cyan-800 dark:text-cyan-300 tabular-nums shadow-2xs">
                        {row.cumulativeTotalKg.toLocaleString()}
                      </span>
                    ) : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>

          {/* Footer Total Row: Clean tabular font, middle-aligned Total text */}
          {sortedAndCumulativeList.length > 0 && (
            <tfoot className="bg-slate-100 dark:bg-slate-850 font-bold border-t-2 border-slate-400 dark:border-slate-600">
              <tr>
                {/* Total label covering columns 1 to 7 - left-aligned indent 1 */}
                <td
                  colSpan={7}
                  className="py-2 pl-3 text-left uppercase tracking-wider text-slate-900 dark:text-white bg-slate-200/90 dark:bg-slate-800 font-black border border-slate-300 dark:border-slate-700 shadow-2xs"
                >
                  <div className="flex items-center justify-start gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border border-slate-700 dark:border-slate-300 text-xs font-black tracking-widest uppercase shadow-xs">
                      <Layers className="w-3 h-3 text-amber-400 dark:text-amber-500" />
                      <span>TOTAL</span>
                    </span>
                  </div>
                </td>

                {/* Total NO OF BAG IN */}
                <td className="py-2 pr-3 text-right font-black text-blue-700 dark:text-blue-300 bg-transparent border border-slate-300 dark:border-slate-700 tabular-nums text-[10.5px]">
                  {overallTotals.totalBags.toLocaleString()}
                </td>

                {/* Total STOCK IN (KG) */}
                <td className="py-2 pr-3 text-right font-black text-purple-700 dark:text-purple-300 bg-transparent border border-slate-300 dark:border-slate-700 tabular-nums text-[10.5px]">
                  {overallTotals.totalKg.toLocaleString()}
                </td>

                {/* Total STOCK IN (MT) */}
                <td className="py-2 pr-3 text-right font-black text-emerald-700 dark:text-emerald-300 bg-transparent border border-slate-300 dark:border-slate-700 tabular-nums text-[10.5px]">
                  {overallTotals.totalMt.toFixed(3)}
                </td>

                {/* STOCK IN CUMULATIVE (KG) final total */}
                <td className="py-2 pr-3 text-right font-black text-cyan-700 dark:text-cyan-300 bg-cyan-50/30 dark:bg-cyan-950/20 border border-slate-300 dark:border-slate-700 tabular-nums text-[10.5px]">
                  {overallTotals.totalKg.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* Pagination Footer */}
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
              Showing <strong className="text-slate-900 dark:text-white font-bold">{startIndex + 1}</strong>–<strong className="text-slate-900 dark:text-white font-bold">{endIndex}</strong> of <strong className="text-slate-900 dark:text-white font-bold">{totalRecords}</strong> records
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

      {/* Print Preview Modal without PER BAG column */}
      <PrintPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        documentTitle="STOCK IN REPORT"
        period={`${startDate || 'All Time'} to ${endDate || 'Present'}`}
        summaryItems={[
          { label: 'Total Inbound Bags', value: `${overallTotals.totalBags.toLocaleString()} Bags` },
          { label: 'Total Stock In (KG)', value: `${overallTotals.totalKg.toLocaleString()} KG` },
          { label: 'Total Stock In (MT)', value: `${overallTotals.totalMt.toFixed(3)} MT` },
        ]}
        columns={[
          { header: 'DATE', key: 'date', align: 'left' },
          { header: 'VARIETY', key: 'variety', align: 'left' },
          { header: 'CLASS & GRADE', key: 'classGrade', align: 'left' },
          { header: 'BLOCK NAME', key: 'blockName', align: 'left' },
          { header: 'CHALLAN NO', key: 'challanNo', align: 'center' },
          { header: 'COLD STORAGE', key: 'coldStorage', align: 'center' },
          { header: 'SR NO.', key: 'srNo', align: 'center' },
          { header: 'NO OF BAG IN', key: 'bagsIn', align: 'right', isNumeric: true },
          { header: 'STOCK IN (KG)', key: 'kgIn', align: 'right', isNumeric: true },
          { header: 'STOCK IN (MT)', key: 'mtIn', align: 'right', isNumeric: true },
          { header: 'CUMULATIVE (KG)', key: 'cumulativeKg', align: 'right', isNumeric: true },
        ]}
        data={sortedAndCumulativeList.map((row) => ({
          date: row.date,
          variety: row.varietyName,
          classGrade: `${row.className} - ${row.gradeName}`,
          blockName: row.blockName,
          challanNo: row.kblChallanNo,
          coldStorage: row.coldStorageCode,
          srNo: row.srNo,
          bagsIn: row.noOfBagIn.toLocaleString(),
          kgIn: row.totalKgIn.toLocaleString(),
          mtIn: row.totalMtIn.toFixed(3),
          cumulativeKg: row.cumulativeTotalKg.toLocaleString(),
        }))}
        onConfirmPrint={() => validateAndTriggerPrint()}
      >
        <div className="w-full overflow-x-auto">
          <table className="w-full text-[10px] border border-slate-300 border-collapse">
            <thead className="bg-slate-200 text-slate-800 font-bold uppercase tracking-wider text-[9.5px]">
              <tr>
                <th className="py-2 pl-3 pr-1 border border-slate-700 text-left w-[8%]">DATE</th>
                <th className="py-2 pl-3 pr-1 border border-slate-700 text-left w-[14%]">VARIETY</th>
                <th className="py-2 pl-3 pr-1 border border-slate-700 text-left w-[12%]">CLASS & GRADE</th>
                <th className="py-2 pl-3 pr-1 border border-slate-700 text-left w-[10%]">BLOCK NAME</th>
                <th className="py-2 px-1 border border-slate-700 text-center w-[8%]">CHALLAN NO</th>
                <th className="py-2 px-1 border border-slate-700 text-center w-[8%]">COLD STORAGE</th>
                <th className="py-2 px-1 border border-slate-700 text-center w-[7%]">SR NO.</th>
                <th className="py-2 pr-3 pl-1 border border-slate-700 text-right w-[8%]">NO OF BAG IN</th>
                <th className="py-2 pr-3 pl-1 border border-slate-700 text-right w-[9%]">STOCK IN (KG)</th>
                <th className="py-2 pr-3 pl-1 border border-slate-700 text-right w-[8%]">STOCK IN (MT)</th>
                <th className="py-2 pr-3 pl-1 border border-slate-700 text-right w-[8%]">CUMULATIVE (KG)</th>
              </tr>
            </thead>
            <tbody>
              {sortedAndCumulativeList.map((row, ri) => (
                <tr key={row.id} className={ri % 2 === 1 ? 'bg-slate-50/80 hover:bg-sky-50/40' : 'bg-white hover:bg-sky-50/40'}>
                  <td className="py-1.5 pl-3 pr-1 border border-slate-200 text-left tabular-nums overflow-hidden">{formatDisplayDate(row.date)}</td>
                  <td className="py-1.5 pl-3 pr-1 border border-slate-200 text-left font-bold text-slate-900">{row.varietyName}</td>
                  <td className="py-1.5 pl-3 pr-1 border border-slate-200 text-left">{row.className} - {row.gradeName}</td>
                  <td className="py-1.5 pl-3 pr-1 border border-slate-200 text-left">{row.blockName}</td>
                  <td className="py-1.5 px-1 border border-slate-200 font-bold text-center tabular-nums">{row.kblChallanNo}</td>
                  <td className="py-1.5 px-1 border border-slate-200 text-center font-bold">{row.coldStorageCode}</td>
                  <td className="py-1.5 px-1 border border-slate-200 text-center font-semibold tabular-nums">{row.srNo}</td>
                  <td className="py-1.5 pr-3 pl-1 border border-slate-200 text-right font-semibold text-slate-800 tabular-nums">{row.noOfBagIn.toLocaleString()}</td>
                  <td className="py-1.5 pr-3 pl-1 border border-slate-200 text-right font-semibold text-slate-800 tabular-nums">{row.totalKgIn.toLocaleString()}</td>
                  <td className="py-1.5 pr-3 pl-1 border border-slate-200 text-right font-semibold text-slate-800 tabular-nums">{row.totalMtIn.toFixed(3)}</td>
                  <td className="py-1.5 pr-3 pl-1 border border-slate-200 text-right font-bold text-slate-900 tabular-nums">{row.cumulativeTotalKg.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-bold border-t-2 border-b-2 border-slate-400">
              <tr>
                <td colSpan={7} className="py-2 px-2 border border-slate-300 font-black uppercase text-center tracking-wider text-slate-900">
                  TOTAL
                </td>
                <td className="py-2 pr-3 pl-1 border border-slate-300 text-right font-black text-slate-900 tabular-nums">
                  {overallTotals.totalBags.toLocaleString()}
                </td>
                <td className="py-2 pr-3 pl-1 border border-slate-300 text-right font-black text-slate-900 tabular-nums">
                  {overallTotals.totalKg.toLocaleString()}
                </td>
                <td className="py-2 pr-3 pl-1 border border-slate-300 text-right font-black text-slate-900 tabular-nums">
                  {overallTotals.totalMt.toFixed(3)}
                </td>
                <td className="py-2 pr-3 pl-1 border border-slate-300 text-right font-black text-slate-900 tabular-nums">
                  {overallTotals.totalKg.toLocaleString()}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </PrintPreviewModal>
    </div>
  );
};
