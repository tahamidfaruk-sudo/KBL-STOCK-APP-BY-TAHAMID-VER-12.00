import React, { useState } from 'react';
import {
  Search,
  RotateCcw,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar,
  Zap,
  X,
  AlertTriangle,
  Trash2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { matchesUniversalSearch } from '../../utils/searchUtils';
import { TableDensity } from '../../types';
import { sortData } from '../../utils/sortUtils';
import { SortIcon } from '../common/SortIcon';
import { exportToExcel, exportToPdf } from '../../utils/exportUtils';
import { ReportButtonGroup } from '../common/ReportButtonGroup';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { formatDisplayDate, formatDisplayDateTime } from '../../utils/dateUtils';

export const AuditLogsView: React.FC = () => {
  const { auditLogs, clearAuditLogs, companySettings, addToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeDatePreset, setActiveDatePreset] = useState<string | null>(null);
  const [density, setDensity] = useState<TableDensity>('compact');
  const [sortKey, setSortKey] = useState<string>('timestamp');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isClearLogsModalOpen, setIsClearLogsModalOpen] = useState(false);

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedModule('');
    setSelectedAction('');
    setStartDate('');
    setEndDate('');
    setActiveDatePreset(null);
    setCurrentPage(1);
    addToast('Audit log filters reset', 'info');
  };

  const handleDatePreset = (preset: 'today' | '7days' | 'thisMonth' | 'season') => {
    const today = new Date();
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (preset === 'today') {
      const d = formatDate(today);
      setStartDate(d);
      setEndDate(d);
      setActiveDatePreset('today');
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setStartDate(formatDate(past));
      setEndDate(formatDate(today));
      setActiveDatePreset('7days');
    } else if (preset === 'thisMonth') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      setStartDate(formatDate(firstDay));
      setEndDate(formatDate(today));
      setActiveDatePreset('thisMonth');
    } else if (preset === 'season') {
      setStartDate('2024-01-01');
      setEndDate(formatDate(today));
      setActiveDatePreset('season');
    }
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const densityStyles = {
    compact: {
      row: 'h-8 sm:h-8.5',
      cell: 'py-1 text-[9.5px]',
      th: 'py-1 text-[9px]',
      badge: 'px-1 py-0.2 text-[8px]',
    },
    normal: {
      row: 'h-9 sm:h-9.5',
      cell: 'py-1.2 text-[10px]',
      th: 'py-1.5 text-[9.5px]',
      badge: 'px-1.2 py-0.2 text-[8.5px]',
    },
    comfortable: {
      row: 'h-10 sm:h-11',
      cell: 'py-1.5 text-[10.5px]',
      th: 'py-2 text-[10px]',
      badge: 'px-1.5 py-0.5 text-[9px]',
    },
  }[density];

  const cellPadding = densityStyles.cell;
  const thPadding = densityStyles.th;

  const uniqueModules = Array.from(
    new Set(auditLogs.map((l) => l.module || l.entity || 'INVENTORY').filter(Boolean))
  );
  const uniqueActions = Array.from(new Set(auditLogs.map((l) => l.action).filter(Boolean)));

  const filtered = auditLogs.filter((l) => {
    const matchesSearch = matchesUniversalSearch(l, searchTerm, [
      l.action,
      l.userName,
      l.userEmail,
      l.module,
      l.details,
      l.timestamp,
    ]);
    const matchesModule = selectedModule ? (l.module || l.entity || 'INVENTORY') === selectedModule : true;
    const matchesAction = selectedAction ? l.action === selectedAction : true;

    let matchesDate = true;
    if (startDate || endDate) {
      const logDateStr = new Date(l.timestamp).toISOString().split('T')[0];
      if (startDate && logDateStr < startDate) matchesDate = false;
      if (endDate && logDateStr > endDate) matchesDate = false;
    }

    return matchesSearch && matchesModule && matchesAction && matchesDate;
  });

  const tableRows = filtered.map((log) => ({
    ...log,
    moduleLabel: log.module || log.entity || 'INVENTORY',
    timestampLabel: formatDisplayDateTime(log.timestamp),
  }));

  const sortedList = sortData(tableRows, sortKey, sortDir);
  const totalRecords = sortedList.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalRecords / pageSize));
  const effectivePage = Math.min(currentPage, totalPages);
  const startIndex = pageSize === -1 ? 0 : (effectivePage - 1) * pageSize;
  const endIndex = pageSize === -1 ? totalRecords : Math.min(startIndex + pageSize, totalRecords);
  const paginatedRows = pageSize === -1 ? sortedList : sortedList.slice(startIndex, endIndex);

  // Export handlers
  const handleExportExcel = () => {
    const exportData = sortedList.map((log, i) => ({
      sl: i + 1,
      timestamp: log.timestampLabel,
      userName: log.userName,
      userEmail: log.userEmail || '-',
      action: log.action,
      module: log.moduleLabel,
      details: log.details,
    }));
    const columns = [
      { header: '#', key: 'sl', isNumeric: true, align: 'right' as const },
      { header: 'TIMESTAMP', key: 'timestamp', align: 'left' as const },
      { header: 'USER', key: 'userName', align: 'left' as const },
      { header: 'EMAIL', key: 'userEmail', align: 'left' as const },
      { header: 'ACTION', key: 'action', align: 'left' as const },
      { header: 'MODULE', key: 'module', align: 'left' as const },
      { header: 'DETAILS', key: 'details', align: 'left' as const },
    ];
    exportToExcel(
      exportData,
      columns,
      `AUDIT_LOGS_${companySettings?.fiscalYear || '2024'}`,
      'AUDIT LOGS & SYSTEM TRAIL',
      companySettings,
      `Generated on ${formatDisplayDate(new Date().toISOString())}`
    );
    addToast('Audit logs exported to Excel!', 'success');
  };

  const handleExportPdf = () => {
    const exportData = sortedList.map((log, i) => ({
      sl: String(i + 1),
      timestamp: log.timestampLabel,
      userName: log.userName,
      action: log.action,
      module: log.moduleLabel,
      details: log.details,
    }));
    const columns = [
      { header: '#', key: 'sl', align: 'right', isNumeric: true },
      { header: 'TIMESTAMP', key: 'timestamp', align: 'left' },
      { header: 'USER', key: 'userName', align: 'left' },
      { header: 'ACTION', key: 'action', align: 'left' },
      { header: 'MODULE', key: 'module', align: 'left' },
      { header: 'DETAILS', key: 'details', align: 'left' },
    ];
    exportToPdf(
      exportData,
      columns,
      `AUDIT_LOGS_${companySettings?.fiscalYear || '2024'}`,
      'AUDIT LOGS & SYSTEM TRAIL',
      companySettings,
      'l',
      `Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`
    );
    addToast('Audit logs exported as PDF!', 'success');
  };

  const handleConfirmClearLogs = () => {
    clearAuditLogs();
    setIsClearLogsModalOpen(false);
    addToast('All audit logs have been purged.', 'info');
  };

  return (
    <div className="space-y-3.5">
      {/* 1. Page Title Card strictly matching Dashboard layout */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-sky-50 dark:bg-sky-950/40 text-slate-900 dark:text-white rounded-xl border border-sky-200 dark:border-sky-800/60 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-5 bg-sky-600 dark:bg-sky-500 rounded-xs shadow-xs" />
          <h2 className="text-xs sm:text-sm font-black tracking-wider text-slate-800 dark:text-slate-100 uppercase">
            AUDIT LOGS
          </h2>
          <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300 border border-sky-200 dark:border-sky-800 uppercase font-mono">
            {filtered.length} RECORDS
          </span>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          {/* Table Density Selector - ONLY density controls in top card as requested */}
          <div className="inline-flex items-center p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-xs shadow-2xs">
            <button
              type="button"
              onClick={() => {
                setDensity('compact');
                addToast('Table density set to COMPACT', 'info');
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
                addToast('Table density set to NORMAL', 'info');
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
                addToast('Table density set to COMFORTABLE', 'info');
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
        </div>
      </div>

      {/* 2. Filter Section strictly matching Stock In filter section */}
      <div className="bg-indigo-100 dark:bg-indigo-950/50 border border-indigo-300 dark:border-indigo-800 rounded-xl p-3 shadow-xs space-y-2.5 text-slate-800 dark:text-slate-100 no-print">
        {/* ROW 1: Search, Date Pickers, Quick Buttons, counter & reset */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Search Box */}
            <div className="relative w-40 sm:w-48 shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-7 py-1 text-xs rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 shadow-2xs transition-all font-medium"
                aria-label="Search audit records"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('');
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

            {/* Date Pickers container */}
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

          {/* Quick Date Presets & Counter & Reset */}
          <div className="flex items-center gap-2 shrink-0 ml-auto flex-wrap">
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
                title="Filter by Today"
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
              <strong className="text-slate-800 dark:text-slate-200 font-semibold">{filtered.length}</strong> events
            </span>

            {/* Icon-only Reset Button */}
            <button
              type="button"
              onClick={resetFilters}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 border border-slate-300 dark:border-slate-600 shadow-2xs transition-colors cursor-pointer shrink-0 inline-flex items-center justify-center"
              title="Reset search and filters"
              aria-label="Reset search and filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ROW 2: Dropdown Filters on left, Actions (Clear Logs, Excel, PDF, Print) on right */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1.5 border-t border-slate-300 dark:border-slate-700">
          <div className="flex flex-wrap items-center gap-2">
            <div className="w-36 sm:w-44">
              <select
                value={selectedModule}
                onChange={(e) => {
                  setSelectedModule(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-bold uppercase truncate shadow-2xs"
              >
                <option value="">ALL MODULES</option>
                {uniqueModules.map((m) => (
                  <option key={m} value={m}>
                    {m.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-36 sm:w-44">
              <select
                value={selectedAction}
                onChange={(e) => {
                  setSelectedAction(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full py-1 px-1.5 text-[10.5px] rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700/80 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer font-bold uppercase truncate shadow-2xs"
              >
                <option value="">ALL ACTIONS</option>
                {uniqueActions.map((a) => (
                  <option key={a} value={a}>
                    {a.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Right side: Clear Logs -> Excel -> PDF -> Print sequence as requested */}
          <div className="flex items-center gap-1.5 shrink-0 ml-auto flex-wrap">
            <button
              type="button"
              onClick={() => setIsClearLogsModalOpen(true)}
              disabled={auditLogs.length === 0}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-xs transition-all cursor-pointer uppercase active:scale-95"
              title="Purge all audit logs"
            >
              <Trash2 className="w-3 h-3" />
              <span>CLEAR LOGS</span>
            </button>

            <ReportButtonGroup
              iconOnly={false}
              onExportExcel={handleExportExcel}
              onExportPdf={handleExportPdf}
              onPrint={() => setIsPreviewOpen(true)}
            />
          </div>
        </div>
      </div>

      <div className="border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs bg-white dark:bg-slate-900 overflow-x-auto">
        <table className="w-full text-left border-collapse border border-slate-300 dark:border-slate-700">
          <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-slate-700 text-[10px]">
            <tr>
              <th
                onClick={() => handleSort('timestamp')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors ${
                  sortKey === 'timestamp'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center gap-0.5 w-full">
                  <span className="break-words">TIMESTAMP</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="timestamp" />
                </div>
              </th>
              <th
                onClick={() => handleSort('userName')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors ${
                  sortKey === 'userName'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center gap-0.5 w-full">
                  <span className="break-words">USER</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="userName" />
                </div>
              </th>
              <th
                onClick={() => handleSort('action')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors ${
                  sortKey === 'action'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center gap-0.5 w-full">
                  <span className="break-words">ACTION</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="action" />
                </div>
              </th>
              <th
                onClick={() => handleSort('moduleLabel')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors ${
                  sortKey === 'moduleLabel'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center gap-0.5 w-full">
                  <span className="break-words">MODULE</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="moduleLabel" />
                </div>
              </th>
              <th
                onClick={() => handleSort('details')}
                className={`${thPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors ${
                  sortKey === 'details'
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                    : 'hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="inline-flex items-center gap-0.5 w-full">
                  <span className="break-words">DETAILS</span>
                  <SortIcon sortKey={sortKey} sortDir={sortDir} columnKey="details" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-10 text-center text-slate-400 dark:text-slate-500 border border-slate-300 dark:border-slate-700 text-xs"
                >
                  <p className="font-medium">No matching audit records found.</p>
                </td>
              </tr>
            ) : (
              paginatedRows.map((log) => (
                <tr
                  key={log.id}
                  className={`${densityStyles.row} transition-colors duration-150 ease-out hover:bg-sky-500/10 dark:hover:bg-sky-400/10 cursor-default`}
                >
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 font-mono text-slate-700 dark:text-slate-300 tabular-nums font-bold`}>
                    {log.timestampLabel}
                  </td>
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700`}>
                    <span className="font-bold text-slate-800 dark:text-slate-100 break-words tracking-tight uppercase">
                      {log.userName}
                    </span>
                    {log.userEmail && (
                      <span className="block font-mono text-slate-500 dark:text-slate-400 text-[10px]">{log.userEmail}</span>
                    )}
                  </td>
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700`}>
                    <span className={`inline-block px-1 py-0.5 rounded font-bold uppercase tracking-wide border border-sky-400 dark:border-sky-500 text-sky-700 dark:text-sky-300 bg-transparent shadow-2xs ${densityStyles.badge}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-semibold uppercase`}>
                    {log.moduleLabel}
                  </td>
                  <td className={`${cellPadding} pl-3 text-left border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium`}>
                    {log.details}
                  </td>
                </tr>
              ))
            )}
          </tbody>
          {sortedList.length > 0 && (
            <tfoot className="bg-slate-100 dark:bg-slate-850 font-bold border-t-2 border-slate-400 dark:border-slate-600">
              <tr>
                <td
                  colSpan={5}
                  className="py-2 pl-3 text-left uppercase tracking-wider text-slate-900 dark:text-white bg-slate-200/90 dark:bg-slate-800 font-black border border-slate-300 dark:border-slate-700 shadow-2xs"
                >
                  <div className="flex items-center justify-start gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border border-slate-700 dark:border-slate-300 text-xs font-black tracking-widest uppercase shadow-xs">
                      <Layers className="w-3 h-3 text-amber-400 dark:text-amber-500" />
                      <span>TOTAL {sortedList.length} RECORD{sortedList.length === 1 ? '' : 'S'}</span>
                    </span>
                  </div>
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {totalRecords > 0 && (
        <div className="pt-2 px-1 border-t border-slate-200 dark:border-slate-750 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 select-none">
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
          {pageSize !== -1 && totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setCurrentPage(1)} disabled={effectivePage === 1} className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs" title="First Page">
                <ChevronsLeft className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={effectivePage === 1} className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs" title="Previous Page">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 py-0.5 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                {effectivePage} / {totalPages}
              </span>
              <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={effectivePage === totalPages} className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs" title="Next Page">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => setCurrentPage(totalPages)} disabled={effectivePage === totalPages} className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer shadow-2xs" title="Last Page">
                <ChevronsRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Clear Logs Confirmation Modal */}
      {isClearLogsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-sm w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  CLEAR AUDIT LOGS
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Are you sure you want to permanently clear all <strong className="text-slate-800 dark:text-slate-200">{auditLogs.length}</strong> audit log entries?
                </p>
                <p className="text-[11px] text-rose-500 mt-1">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setIsClearLogsModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold uppercase transition-colors cursor-pointer"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={handleConfirmClearLogs}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold uppercase shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>CONFIRM CLEAR</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="AUDIT LOGS & SYSTEM TRAIL"
        documentTitle="AUDIT LOGS & SYSTEM TRAIL"
        period={`Period: ${startDate || 'All Time'} to ${endDate || 'Present'}`}
        columns={[
          { header: '#', key: 'sl', align: 'right' },
          { header: 'TIMESTAMP', key: 'timestamp', align: 'left' },
          { header: 'USER', key: 'userName', align: 'left' },
          { header: 'ACTION', key: 'action', align: 'left' },
          { header: 'MODULE', key: 'module', align: 'left' },
          { header: 'DETAILS', key: 'details', align: 'left' },
        ]}
        data={sortedList.map((log, i) => ({
          sl: String(i + 1),
          timestamp: log.timestampLabel,
          userName: log.userName,
          action: log.action,
          module: log.moduleLabel,
          details: log.details,
        }))}
      />
    </div>
  );
};
