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

export const DayWiseStockReportView: React.FC = () => {
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

  // Filtered raw transactions
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
          s.date,
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

  // Aggregate by Date (Day-wise total)
  const dayWiseList = useMemo(() => {
    const map = new Map<string, {
      date: string;
      noOfBagIn: number;
      totalKgIn: number;
      totalMtIn: number;
      varietyNames: Set<string>;
      classNames: Set<string>;
      gradeNames: Set<string>;
      blockNames: Set<string>;
      challans: Set<string>;
      storageCodes: Set<string>;
      srNos: Set<string>;
    }>();

    filteredList.forEach((s) => {
      const entry = map.get(s.date) || {
        date: s.date,
        noOfBagIn: 0,
        totalKgIn: 0,
        totalMtIn: 0,
        varietyNames: new Set<string>(),
        classNames: new Set<string>(),
        gradeNames: new Set<string>(),
        blockNames: new Set<string>(),
        challans: new Set<string>(),
        storageCodes: new Set<string>(),
        srNos: new Set<string>(),
      };

      const kgPerBag = s.kgPerBag || 50;
      const kg = s.totalKg || s.sackQuantity * kgPerBag;
      const mt = s.totalMt || Number((kg / 1000).toFixed(3));

      entry.noOfBagIn += s.sackQuantity;
      entry.totalKgIn += kg;
      entry.totalMtIn += mt;

      const v = varieties.find((item) => item.id === s.varietyId);
      if (v?.name) entry.varietyNames.add(v.name.toUpperCase());

      const cls = seedClasses.find((c) => c.id === s.classId);
      if (cls?.name) entry.classNames.add(cls.name.replace(/\s*\([^)]*\)/gi, '').trim().toUpperCase());

      const grd = grades.find((g) => g.id === s.gradeId);
      if (grd?.name) entry.gradeNames.add(grd.code || grd.name.toUpperCase());

      const b = productionBlocks.find((b) => b.id === s.productionBlockId) || s.farmBlock;
      if (typeof b === 'string' && b) entry.blockNames.add(b.toUpperCase());
      else if (b && (b as any).name) entry.blockNames.add((b as any).name.toUpperCase());

      if (s.kblChallanNo) entry.challans.add(s.kblChallanNo);

      const cs = coldStorages.find((c) => c.id === s.coldStorageId);
      if (cs) entry.storageCodes.add(cs.code || cs.name.replace(/cold\s*storage/gi, '').trim());

      if (s.srNo) entry.srNos.add(s.srNo);

      map.set(s.date, entry);
    });

    const dayRows = Array.from(map.values());
    const sorted = sortData(dayRows, sortKey, sortDir);

    let runningCumulativeKg = 0;
    return sorted.map((r, index) => {
      runningCumulativeKg += r.totalKgIn;

      const varietyStr = Array.from(r.varietyNames).slice(0, 2).join(', ') || 'SEED POTATO';
      const classStr = Array.from(r.classNames).slice(0, 1).join(', ') || '-';
      const gradeStr = Array.from(r.gradeNames).slice(0, 2).join(', ') || 'A';
      const blockStr = Array.from(r.blockNames).slice(0, 1).join(', ') || 'BLOCK';
      const challanStr = r.challans.size > 0 ? (r.challans.size === 1 ? Array.from(r.challans)[0] : `${r.challans.size} CHALLANS`) : '-';
      const storageStr = Array.from(r.storageCodes).join(', ') || '-';
      const srStr = r.srNos.size > 0 ? (r.srNos.size === 1 ? Array.from(r.srNos)[0] : `${r.srNos.size} SRs`) : '-';

      return {
        id: r.date,
        sl: index + 1,
        date: r.date,
        varietyName: varietyStr,
        className: classStr,
        gradeName: gradeStr,
        blockName: blockStr,
        kblChallanNo: challanStr,
        coldStorageCode: storageStr,
        srNo: srStr,
        noOfBagIn: r.noOfBagIn,
        totalKgIn: r.totalKgIn,
        totalMtIn: Number((r.totalKgIn / 1000).toFixed(3)),
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
    const totalBags = dayWiseList.reduce((acc, row) => acc + row.noOfBagIn, 0);
    const totalKg = dayWiseList.reduce((acc, row) => acc + row.totalKgIn, 0);
    const totalMt = Number((totalKg / 1000).toFixed(3));
    return {
      totalBags,
      totalKg,
      totalMt,
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
    const exportData: any[] = dayWiseList.map((row) => ({
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

    if (dayWiseList.length > 0) {
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
      });
    }

    const columns = [
      { header: 'DATE', key: 'date', width: 13, align: 'left' as const },
      { header: 'VARIETY', key: 'variety', width: 22, align: 'left' as const },
      { header: 'CLASS & GRADE', key: 'className', width: 18, align: 'left' as const },
      { header: 'BLOCK NAME', key: 'blockName', width: 16, align: 'left' as const },
      { header: 'CHALLAN NO', key: 'kblChallanNo', width: 16, align: 'left' as const },
      { header: 'COLD STORAGE', key: 'coldStorageCode', width: 16, align: 'left' as const },
      { header: 'SR NO.', key: 'srNo', width: 14, align: 'left' as const },
      { header: 'BAG IN', key: 'noOfBagIn', width: 14, align: 'right' as const },
      { header: 'STOK IN (KG)', key: 'totalKgIn', width: 18, align: 'right' as const },
      { header: 'STOK IN (MT)', key: 'totalMtIn', width: 16, align: 'right' as const },
      { header: 'CUMULATIVE (KG)', key: 'cumulativeTotalKg', width: 20, align: 'right' as const },
    ];

    exportToExcel(
      exportData,
      columns,
      `DAY_WISE_STOCK_IN_REPORT_${companySettings?.fiscalYear || '2024'}`,
      'DAY-WISE STOCK IN REPORT',
      companySettings,
      `Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`
    );
    addToast?.('Day-wise Stock In Report exported to Excel successfully!', 'success');
  };

  // PDF Export
  const handleExportPdf = () => {
    const exportData: any[] = dayWiseList.map((row) => ({
      date: formatDisplayDate(row.date),
      variety: row.varietyName,
      classGrade: `${row.className} • ${row.gradeName}`,
      blockName: row.blockName,
      kblChallanNo: row.kblChallanNo,
      coldStorageCode: row.coldStorageCode,
      srNo: row.srNo,
      noOfBagIn: row.noOfBagIn.toLocaleString(),
      totalKgIn: row.totalKgIn.toLocaleString(),
      totalMtIn: row.totalMtIn.toFixed(3),
      cumulativeTotalKg: row.cumulativeTotalKg.toLocaleString(),
    }));

    if (dayWiseList.length > 0) {
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
      });
    }

    const columns = [
      { header: 'DATE', key: 'date', align: 'left' as const },
      { header: 'VARIETY', key: 'variety', align: 'left' as const },
      { header: 'CLASS & GRADE', key: 'classGrade', align: 'left' as const },
      { header: 'BLOCK NAME', key: 'blockName', align: 'left' as const },
      { header: 'CHALLAN NO', key: 'kblChallanNo', align: 'left' as const },
      { header: 'COLD STORAGE', key: 'coldStorageCode', align: 'left' as const },
      { header: 'SR NO.', key: 'srNo', align: 'left' as const },
      { header: 'BAG IN', key: 'noOfBagIn', align: 'right' as const },
      { header: 'STOK IN (KG)', key: 'totalKgIn', align: 'right' as const },
      { header: 'STOK IN (MT)', key: 'totalMtIn', align: 'right' as const },
      { header: 'CUMULATIVE (KG)', key: 'cumulativeTotalKg', align: 'right' as const },
    ];

    exportToPdf(
      exportData,
      columns,
      `DAY_WISE_STOCK_IN_REPORT_${companySettings?.fiscalYear || '2024'}`,
      'DAY-WISE STOCK IN REPORT',
      companySettings,
      `Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`
    );
    addToast?.('Day-wise Stock In Report exported as PDF!', 'success');
  };

  return (
    <div className="space-y-3">
      {/* Page Title Card strictly matching Stock In layout */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-sky-50 dark:bg-sky-950/40 text-slate-900 dark:text-white rounded-xl border border-sky-200 dark:border-sky-800/60 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 bg-sky-600 dark:bg-sky-500 rounded-xs shadow-xs" />
          <h2 className="text-xs sm:text-sm font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase">
            DAY-WISE STOCK IN REPORT
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

      {/* Main Data Table - Exactly identical headers to Stock In */}
      <div className="border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs bg-white dark:bg-slate-900 overflow-x-auto">
        <table className="w-full text-left border-collapse border border-slate-300 dark:border-slate-700">
          <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-slate-700 text-[10px]">
            <tr>
              {/* 1. DATE (8%) */}
              <th
                onClick={() => handleSort('date')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[8%] ${
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

              {/* 2. VARIETY (9.5%) */}
              <th
                onClick={() => handleSort('varietyName')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[9.5%] ${
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

              {/* 3. CLASS & GRADE (11%) */}
              <th
                onClick={() => handleSort('className')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[11%] ${
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

              {/* 4. BLOCK NAME (12.5%) */}
              <th
                onClick={() => handleSort('blockName')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[12.5%] ${
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

              {/* 5. CHALLAN NO (9%) */}
              <th
                onClick={() => handleSort('kblChallanNo')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[9%] ${
                  sortKey === 'kblChallanNo'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-start gap-0.5 w-full">
                  <span className="break-words">CHALLAN NO</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="kblChallanNo" />
                </div>
              </th>

              {/* 6. COLD STORAGE (10%) */}
              <th
                onClick={() => handleSort('coldStorageCode')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[10%] ${
                  sortKey === 'coldStorageCode'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-start gap-0.5 w-full">
                  <span className="break-words">COLD STORAGE</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="coldStorageCode" />
                </div>
              </th>

              {/* 7. SR NO. (7%) */}
              <th
                onClick={() => handleSort('srNo')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[7%] ${
                  sortKey === 'srNo'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-start gap-0.5 w-full">
                  <span className="break-words">SR NO.</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="srNo" />
                </div>
              </th>

              {/* 8. NO OF BAG IN (8%) */}
              <th
                onClick={() => handleSort('noOfBagIn')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[8%] ${
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

              {/* 9. STOCK IN (KG) (8.5%) */}
              <th
                onClick={() => handleSort('totalKgIn')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[8.5%] ${
                  sortKey === 'totalKgIn'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="break-words">STOCK IN (KG)</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="totalKgIn" />
                </div>
              </th>

              {/* 10. STOCK IN (MT) (7.5%) */}
              <th
                onClick={() => handleSort('totalMtIn')}
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors w-[7.5%] ${
                  sortKey === 'totalMtIn'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center justify-end gap-0.5 w-full">
                  <span className="break-words">STOCK IN (MT)</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="totalMtIn" />
                </div>
              </th>

              {/* 11. STOCK IN CUMULATIVE (KG) (9%) */}
              <th
                className={`${thPadding} pr-3 text-right border border-slate-300 dark:border-slate-700 font-bold select-none text-cyan-700 dark:text-cyan-300 bg-cyan-50/50 dark:bg-cyan-950/20 w-[9%]`}
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
                  <p className="font-medium">No matching Day-wise Stock records found.</p>
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
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium whitespace-nowrap overflow-hidden text-ellipsis`} title={row.blockName}>
                    {row.blockName}
                  </td>

                  {/* 5. CHALLAN NO */}
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200`}>
                    <span className="inline-block px-1 py-0.5 rounded text-[10px] font-semibold border border-slate-300 dark:border-slate-650 text-slate-700 dark:text-slate-300 bg-transparent tabular-nums">
                      {row.kblChallanNo}
                    </span>
                  </td>

                  {/* 6. COLD STORAGE */}
                  <td className={`${cellPadding} pl-3 text-left font-bold border border-slate-300 dark:border-slate-700`}>
                    <span className="inline-block px-1 py-0.5 rounded text-[10px] font-bold border border-indigo-400 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300 uppercase tracking-wide bg-transparent shadow-2xs">
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

                  {/* 9. STOK IN (KG) */}
                  <td className={`${cellPadding} pr-3 text-right font-semibold text-purple-700 dark:text-purple-400 border border-slate-300 dark:border-slate-700 tabular-nums`}>
                    {row.totalKgIn > 0 ? row.totalKgIn.toLocaleString() : '-'}
                  </td>

                  {/* 10. STOK IN (MT) */}
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

          {/* Footer Total Row */}
          {dayWiseList.length > 0 && (
            <tfoot className="bg-slate-100 dark:bg-slate-850 font-bold border-t-2 border-slate-400 dark:border-slate-600">
              <tr>
                {/* Total label covering columns 1 to 7 */}
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

                {/* Total STOK IN (KG) */}
                <td className="py-2 pr-3 text-right font-black text-purple-700 dark:text-purple-300 bg-transparent border border-slate-300 dark:border-slate-700 tabular-nums text-[10.5px]">
                  {overallTotals.totalKg.toLocaleString()}
                </td>

                {/* Total STOK IN (MT) */}
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
          title="DAY-WISE STOCK IN REPORT"
          documentTitle="DAY-WISE STOCK IN REPORT"
          subtitle="Day-wise Inbound Potato Seed Stock Aggregation"
          period={`Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`}
          columns={[
            { header: 'DATE', key: 'date' },
            { header: 'VARIETY', key: 'varietyName' },
            { header: 'CLASS & GRADE', key: 'className' },
            { header: 'BLOCK NAME', key: 'blockName' },
            { header: 'CHALLAN NO', key: 'kblChallanNo' },
            { header: 'COLD STORAGE', key: 'coldStorageCode' },
            { header: 'SR NO.', key: 'srNo' },
            { header: 'BAG IN', key: 'noOfBagIn', align: 'right' },
            { header: 'STOK IN (KG)', key: 'totalKgIn', align: 'right' },
            { header: 'STOK IN (MT)', key: 'totalMtIn', align: 'right' },
            { header: 'CUMULATIVE (KG)', key: 'cumulativeTotalKg', align: 'right' },
          ]}
          data={dayWiseList.map((row) => ({
            ...row,
            noOfBagIn: row.noOfBagIn.toLocaleString(),
            totalKgIn: row.totalKgIn.toLocaleString(),
            totalMtIn: row.totalMtIn.toFixed(3),
            cumulativeTotalKg: row.cumulativeTotalKg.toLocaleString(),
          }))}
          summaryItems={[
            { label: 'Total Bag In', value: `${overallTotals.totalBags.toLocaleString()} Bags`, highlight: true },
            { label: 'Total Stock In (KG)', value: `${overallTotals.totalKg.toLocaleString()} KG` },
            { label: 'Total Stock In (MT)', value: `${overallTotals.totalMt.toFixed(3)} MT` },
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
