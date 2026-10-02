import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { TableDensity } from '../../types';
import { calculateLiveStockMatrix } from '../../utils/stockEngine';
import {
  Download,
  FileSpreadsheet,
  RotateCcw,
  Eye,
  EyeOff,
  Boxes,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  X,
  Layers,
  Calendar,
  Building2,
  Rows3,
  Rows4,
  FileText,
  Printer,
  CornerDownRight,
} from 'lucide-react';
import { ExportColumn, exportToExcel, exportToPdf, validateAndTriggerPrint } from '../../utils/exportUtils';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { SortIcon } from '../common/SortIcon';
import { formatDisplayDate } from '../../utils/dateUtils';

interface ColumnStyle {
  headerBg: string;
  headerText: string;
  headerBorder: string;
  cellBg: string;
  cellBorder: string;
  cellText: string;
  subtotalText: string;
  grandTotalBg: string;
  grandTotalBorder: string;
  grandTotalText: string;
}

const getVarietyColorStyle = (varietyKey: string): ColumnStyle => {
  const key = varietyKey.toUpperCase();
  if (key.includes('ASTERIX')) {
    return {
      headerBg: 'bg-rose-50/90 dark:bg-rose-950/40',
      headerText: 'text-rose-800 dark:text-rose-200',
      headerBorder: 'border-rose-300 dark:border-rose-800',
      cellBg: 'bg-rose-50/35 dark:bg-rose-950/15',
      cellBorder: 'border-rose-200 dark:border-rose-800/60',
      cellText: 'text-rose-950 dark:text-rose-100',
      subtotalText: 'text-rose-900 dark:text-rose-200',
      grandTotalBg: 'bg-rose-100/80 dark:bg-rose-900/40',
      grandTotalBorder: 'border-rose-400 dark:border-rose-700',
      grandTotalText: 'text-rose-900 dark:text-rose-100',
    };
  }
  if (key.includes('DIAMANT')) {
    return {
      headerBg: 'bg-sky-50/90 dark:bg-sky-950/40',
      headerText: 'text-sky-800 dark:text-sky-200',
      headerBorder: 'border-sky-300 dark:border-sky-800',
      cellBg: 'bg-sky-50/35 dark:bg-sky-950/15',
      cellBorder: 'border-sky-200 dark:border-sky-800/60',
      cellText: 'text-sky-950 dark:text-sky-100',
      subtotalText: 'text-sky-900 dark:text-sky-200',
      grandTotalBg: 'bg-sky-100/80 dark:bg-sky-900/40',
      grandTotalBorder: 'border-sky-400 dark:border-sky-700',
      grandTotalText: 'text-sky-900 dark:text-sky-100',
    };
  }
  if (key.includes('GRANOLA')) {
    return {
      headerBg: 'bg-amber-50/90 dark:bg-amber-950/40',
      headerText: 'text-amber-800 dark:text-amber-200',
      headerBorder: 'border-amber-300 dark:border-amber-800',
      cellBg: 'bg-amber-50/35 dark:bg-amber-950/15',
      cellBorder: 'border-amber-200 dark:border-amber-800/60',
      cellText: 'text-amber-950 dark:text-amber-100',
      subtotalText: 'text-amber-900 dark:text-amber-200',
      grandTotalBg: 'bg-amber-100/80 dark:bg-amber-900/40',
      grandTotalBorder: 'border-amber-400 dark:border-amber-700',
      grandTotalText: 'text-amber-900 dark:text-amber-100',
    };
  }
  if (key.includes('SUN') || key.includes('SHINE')) {
    return {
      headerBg: 'bg-orange-50/90 dark:bg-orange-950/40',
      headerText: 'text-orange-800 dark:text-orange-200',
      headerBorder: 'border-orange-300 dark:border-orange-800',
      cellBg: 'bg-orange-50/35 dark:bg-orange-950/15',
      cellBorder: 'border-orange-200 dark:border-orange-800/60',
      cellText: 'text-orange-950 dark:text-orange-100',
      subtotalText: 'text-orange-900 dark:text-orange-200',
      grandTotalBg: 'bg-orange-100/80 dark:bg-orange-900/40',
      grandTotalBorder: 'border-orange-400 dark:border-orange-700',
      grandTotalText: 'text-orange-900 dark:text-orange-100',
    };
  }
  // Total column
  if (key === 'TOTAL') {
    return {
      headerBg: 'bg-emerald-50/90 dark:bg-emerald-950/40',
      headerText: 'text-emerald-800 dark:text-emerald-200',
      headerBorder: 'border-emerald-300 dark:border-emerald-800',
      cellBg: 'bg-emerald-50/35 dark:bg-emerald-950/15',
      cellBorder: 'border-emerald-200 dark:border-emerald-800/60',
      cellText: 'text-emerald-950 dark:text-emerald-100',
      subtotalText: 'text-emerald-900 dark:text-emerald-200',
      grandTotalBg: 'bg-emerald-100/90 dark:bg-emerald-900/50',
      grandTotalBorder: 'border-emerald-400 dark:border-emerald-600',
      grandTotalText: 'text-emerald-950 dark:text-emerald-100',
    };
  }
  // Fallback for any other custom variety
  return {
    headerBg: 'bg-teal-50/90 dark:bg-teal-950/40',
    headerText: 'text-teal-800 dark:text-teal-200',
    headerBorder: 'border-teal-300 dark:border-teal-800',
    cellBg: 'bg-teal-50/35 dark:bg-teal-950/15',
    cellBorder: 'border-teal-200 dark:border-teal-800/60',
    cellText: 'text-teal-950 dark:text-teal-100',
    subtotalText: 'text-teal-900 dark:text-teal-200',
    grandTotalBg: 'bg-teal-100/80 dark:bg-teal-900/40',
    grandTotalBorder: 'border-teal-400 dark:border-teal-700',
    grandTotalText: 'text-teal-900 dark:text-teal-100',
  };
};

// Helpers for Class and Grade chips formatting in Item-Wise Stock Summary
export const parseClassAndGrade = (label: string) => {
  let upper = label.toUpperCase().trim();
  const isTotal = upper.startsWith('TOTAL');
  if (isTotal) {
    upper = upper.replace(/^TOTAL\s+/, '').trim();
  }

  let className = upper;
  let gradeName: string | null = null;
  let gradeType: 'A' | 'B' | 'US' | 'OS' | 'OTHER' | null = null;
  let classKey = 'OTHER';

  if (upper.startsWith('PRE-FOUNDATION')) {
    classKey = 'PRE-FOUNDATION';
    className = 'PRE-FOUNDATION';
    const rest = upper.replace('PRE-FOUNDATION', '').trim();
    if (rest === 'A' || rest === 'B' || rest === 'US') {
      gradeName = `GRADE ${rest}`;
      gradeType = rest as any;
    }
  } else if (upper.startsWith('FOUNDATION')) {
    classKey = 'FOUNDATION';
    className = 'FOUNDATION';
    const rest = upper.replace('FOUNDATION', '').trim();
    if (rest === 'A' || rest === 'B' || rest === 'US' || rest === 'OS') {
      gradeName = `GRADE ${rest}`;
      gradeType = rest as any;
    }
  } else if (upper.startsWith('CERTIFY')) {
    classKey = 'CERTIFY';
    className = 'CERTIFY';
    const rest = upper.replace('CERTIFY', '').trim();
    if (rest === 'A' || rest === 'B' || rest === 'US') {
      gradeName = `GRADE ${rest}`;
      gradeType = rest as any;
    }
  } else if (upper.startsWith('TLS')) {
    classKey = 'TLS';
    className = 'TLS';
    const rest = upper.replace('TLS', '').trim();
    if (rest === 'A' || rest === 'B') {
      gradeName = `GRADE ${rest}`;
      gradeType = rest as any;
    }
  } else if (upper.includes('MINI TUBER')) {
    classKey = 'MINI-TUBER';
    className = 'MINI TUBER';
  } else if (upper.includes('TABLE POTATO')) {
    classKey = 'TABLE-POTATO';
    className = 'TABLE POTATO (TP)';
  } else if (upper.includes('NON TRACEABLE')) {
    classKey = 'NON-TRACEABLE';
    className = 'NON TRACEABLE (SR)';
  }

  return { className, gradeName, gradeType, classKey, isTotal };
};

export const getClassBadgeBgAndBorder = (classKey: string) => {
  switch (classKey) {
    case 'PRE-FOUNDATION':
      return 'bg-sky-50 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800';
    case 'FOUNDATION':
      return 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-800';
    case 'CERTIFY':
      return 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800';
    case 'TLS':
      return 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800';
    case 'MINI-TUBER':
      return 'bg-purple-50 dark:bg-purple-950/40 border-purple-300 dark:border-purple-800';
    case 'TABLE-POTATO':
      return 'bg-orange-50 dark:bg-orange-950/40 border-orange-300 dark:border-orange-800';
    case 'NON-TRACEABLE':
      return 'bg-slate-100/90 dark:bg-slate-800 border-slate-300 dark:border-slate-700';
    default:
      return 'bg-slate-100/90 dark:bg-slate-800 border-slate-300 dark:border-slate-700';
  }
};

export const getGradeBadgeStyle = (gradeType: string | null) => {
  switch (gradeType) {
    case 'A':
      return 'bg-teal-50 dark:bg-teal-950/60 border-teal-300 dark:border-teal-700 text-teal-800 dark:text-teal-200';
    case 'B':
      return 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200';
    case 'US':
      return 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-700 text-purple-800 dark:text-purple-200';
    case 'OS':
      return 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200';
    default:
      return 'bg-slate-50 dark:bg-slate-800/80 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300';
  }
};

export interface LiveStockItemwiseMatrixProps {
  density?: TableDensity;
  onDensityChange?: (density: TableDensity) => void;
}

export const LiveStockItemwiseMatrix: React.FC<LiveStockItemwiseMatrixProps> = ({
  density: propDensity,
  onDensityChange,
}) => {
  const {
    stockTransactions,
    deliveryTransactions,
    varieties,
    seedClasses,
    grades,
    filters,
    setFilters,
    resetFilters,
    coldStorages,
    companySettings,
    currentUser,
    addToast,
  } = useApp();

  const [internalDensity, setInternalDensity] = useState<TableDensity>('compact');

  const density = propDensity || internalDensity;

  const setDensity = (newDensity: TableDensity) => {
    setInternalDensity(newDensity);
    try {
      localStorage.setItem('app_dashboard_table_density', newDensity);
    } catch {
      // ignore
    }
    if (onDensityChange) {
      onDensityChange(newDensity);
    }
  };

  const isCompact = density === 'compact';

  const densityStyles = {
    canvasPadding: density === 'compact' ? 'p-2 sm:p-2.5' : density === 'comfortable' ? 'py-3.5 px-4 sm:py-4 sm:px-6' : 'py-2 px-3 sm:py-2.5 sm:px-4',
    thCorner: density === 'compact' ? 'px-2 py-1 text-[9.5px] w-52' : density === 'comfortable' ? 'px-3 py-1.5 text-[10.5px] w-60' : 'px-2.5 py-1 text-[10px] w-56',
    thCol: density === 'compact' ? 'px-2 py-1 text-[9.5px] w-24' : density === 'comfortable' ? 'px-3 py-1.5 text-[10.5px] w-28' : 'px-2.5 py-1 text-[10px] w-26',
    gapHeight: 'hidden',
    grandTotalLabel: density === 'compact' ? 'py-1 px-2 text-[11px]' : density === 'comfortable' ? 'py-1.5 px-3 text-xs sm:text-[13px]' : 'py-1 px-2.5 text-xs',
    grandTotalCellTd: density === 'compact' ? 'p-0.5' : density === 'comfortable' ? 'py-1 px-0.5' : 'p-0.5',
    grandTotalCellBox: density === 'compact' ? 'py-0.5 px-1 text-[10.5px] tabular-nums' : density === 'comfortable' ? 'py-1 px-2 text-[11.5px] sm:text-xs tabular-nums' : 'py-0.5 px-1.5 text-[11px] tabular-nums',
    subtotalLabel: density === 'compact' ? 'py-1 px-2 text-[10.5px]' : density === 'comfortable' ? 'py-1.5 px-3 text-[11px] sm:text-[11.5px]' : 'py-1 px-2.5 text-[11px]',
    subtotalCell: density === 'compact' ? 'py-0.5 px-1 text-[10.5px] tabular-nums' : density === 'comfortable' ? 'py-1 px-2 text-[11px] sm:text-[11.5px] tabular-nums' : 'py-0.5 px-1.5 text-[11px] tabular-nums',
    singleLabel: density === 'compact' ? 'py-1 px-2 text-[10.5px]' : density === 'comfortable' ? 'py-1.5 px-3 text-[11px] sm:text-[11.5px]' : 'py-1 px-2.5 text-[11px]',
    singleCell: density === 'compact' ? 'py-0.5 px-1 text-[10.5px] tabular-nums' : density === 'comfortable' ? 'py-1 px-2 text-[11px] sm:text-[11.5px] tabular-nums' : 'py-0.5 px-1.5 text-[11px] tabular-nums',
    regularLabel: density === 'compact' ? 'py-0.5 px-2 text-[10px]' : density === 'comfortable' ? 'py-1 px-3 text-[10.5px] sm:text-[11px]' : 'py-0.5 px-2.5 text-[10.5px]',
    regularCell: density === 'compact' ? 'py-0.5 px-1 text-[10.5px] tabular-nums' : density === 'comfortable' ? 'py-1 px-2 text-[11px] tabular-nums' : 'py-0.5 px-1.5 text-[10.5px] tabular-nums',
    drawerTh: density === 'compact' ? 'px-2 py-1 text-[9.5px]' : density === 'comfortable' ? 'px-3 py-1.5 text-[10.5px]' : 'px-2.5 py-1 text-[10px]',
    drawerTd: density === 'compact' ? 'px-2 py-1 text-[10px] tabular-nums' : density === 'comfortable' ? 'px-3 py-1.5 text-[11px] tabular-nums' : 'px-2.5 py-1 text-[10.5px] tabular-nums',
  };

  const [showEmptyGrid, setShowEmptyGrid] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [selectedVarietyKey, setSelectedVarietyKey] = useState<string>('ALL');

  // By default, table data opens in collapsed state as requested.
  // When an item's collapse button is clicked, its grade rows are shown (uncollapsed).
  const [expandedItemGroups, setExpandedItemGroups] = useState<Set<string>>(new Set());

  const toggleGroupCollapse = (groupId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedItemGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  const expandAllGroups = () => {
    setExpandedItemGroups(
      new Set(['total-pre-foundation', 'total-foundation', 'total-certify', 'total-tls'])
    );
  };

  const collapseAllGroups = () => {
    setExpandedItemGroups(new Set());
  };

  const [printModalState, setPrintModalState] = useState<{
    isOpen: boolean;
    title: string;
    subtitle?: string;
    columns: ExportColumn[];
    data: Record<string, any>[];
    summaryItems?: { label: string; value: string | number }[];
  }>({
    isOpen: false,
    title: '',
    columns: [],
    data: [],
  });

  const matrixData = React.useMemo(() => {
    return calculateLiveStockMatrix(
      stockTransactions,
      deliveryTransactions,
      varieties,
      seedClasses,
      grades,
      filters
    );
  }, [
    stockTransactions,
    deliveryTransactions,
    varieties,
    seedClasses,
    grades,
    filters,
  ]);

  const activeStorage = React.useMemo(() => {
    if (!filters.coldStorageId) return 'ALL COLD STORAGES';
    const cs = coldStorages.find((c) => c.id === filters.coldStorageId);
    return cs ? cs.name.toUpperCase() : 'FILTERED COLD STORAGE';
  }, [filters.coldStorageId, coldStorages]);

  const hasZeroResults = matrixData.grandTotal === 0;

  const handleExportExcel = () => {
    const exportRows: any[] = [];
    matrixData.rows.forEach((r) => {
      if (r.type === 'gap') {
        exportRows.push({
          item: '',
          asterix: '',
          diamant: '',
          granola: '',
          sunshine: '',
          total: '',
        });
      } else {
        exportRows.push({
          item: r.label.toUpperCase(),
          asterix: r.values.ASTERIX === 0 ? '-' : r.values.ASTERIX || '-',
          diamant: r.values.DIAMANT === 0 ? '-' : r.values.DIAMANT || '-',
          granola: r.values.GRANOLA === 0 ? '-' : r.values.GRANOLA || '-',
          sunshine: r.values['SUN-SHINE'] === 0 ? '-' : r.values['SUN-SHINE'] || '-',
          total: r.total === 0 ? '-' : r.total || '-',
        });
      }
    });

    const printedByName = currentUser ? `${currentUser.fullName} (${currentUser.roleName})` : 'Authorized User';

    exportToExcel(
      exportRows,
      [
        { header: 'ITEM / CATEGORY', key: 'item', width: 28 },
        { header: 'ASTERIX', key: 'asterix', width: 14, isNumeric: true },
        { header: 'DIAMANT', key: 'diamant', width: 14, isNumeric: true },
        { header: 'GRANOLA', key: 'granola', width: 14, isNumeric: true },
        { header: 'SUN-SHINE', key: 'sunshine', width: 14, isNumeric: true },
        { header: 'TOTAL', key: 'total', width: 16, isNumeric: true },
      ],
      `LIVE_STOCK_ITEMWISE_${activeStorage.replace(/\s+/g, '_')}`,
      `LIVE STOCK DETAILS ITEM-WISE (${activeStorage})`,
      companySettings,
      `LIVE STOCK BREAKDOWN - ${new Date().toLocaleDateString()}`,
      { printedBy: printedByName, includeSummary: true }
    );
    addToast(`Live Stock Matrix (${activeStorage}) exported to Excel successfully!`, 'success');
  };

  const handleExportPdf = () => {
    const exportRows: any[] = [];
    matrixData.rows.forEach((r) => {
      if (r.type === 'gap') {
        exportRows.push({
          item: '',
          asterix: '',
          diamant: '',
          granola: '',
          sunshine: '',
          total: '',
        });
      } else {
        exportRows.push({
          item: r.label.toUpperCase(),
          asterix: r.values.ASTERIX === 0 ? '-' : r.values.ASTERIX || '-',
          diamant: r.values.DIAMANT === 0 ? '-' : r.values.DIAMANT || '-',
          granola: r.values.GRANOLA === 0 ? '-' : r.values.GRANOLA || '-',
          sunshine: r.values['SUN-SHINE'] === 0 ? '-' : r.values['SUN-SHINE'] || '-',
          total: r.total === 0 ? '-' : r.total || '-',
        });
      }
    });

    const printedByName = currentUser ? `${currentUser.fullName} (${currentUser.roleName})` : 'Authorized User';

    exportToPdf(
      exportRows,
      [
        { header: 'ITEM / CATEGORY', key: 'item' },
        { header: 'ASTERIX', key: 'asterix', isNumeric: true },
        { header: 'DIAMANT', key: 'diamant', isNumeric: true },
        { header: 'GRANOLA', key: 'granola', isNumeric: true },
        { header: 'SUN-SHINE', key: 'sunshine', isNumeric: true },
        { header: 'TOTAL', key: 'total', isNumeric: true },
      ],
      `ITEM_WISE_STOCK_SUMMARY_${activeStorage.replace(/\s+/g, '_')}`,
      `ITEM-WISE STOCK SUMMARY (${activeStorage})`,
      companySettings,
      'l',
      `Facility: ${activeStorage}`,
      { printedBy: printedByName, includeSummary: true }
    );
    addToast(`Item-Wise Stock Summary (${activeStorage}) exported to PDF successfully!`, 'success');
  };

  const handlePrint = () => {
    const previewRows: Record<string, any>[] = [];
    matrixData.rows.forEach((r) => {
      if (r.type === 'gap') {
        previewRows.push({
          item: '',
          asterix: '',
          diamant: '',
          granola: '',
          sunshine: '',
          total: '',
        });
      } else {
        previewRows.push({
          item: r.label.toUpperCase(),
          asterix: r.values.ASTERIX === 0 ? '-' : r.values.ASTERIX || '-',
          diamant: r.values.DIAMANT === 0 ? '-' : r.values.DIAMANT || '-',
          granola: r.values.GRANOLA === 0 ? '-' : r.values.GRANOLA || '-',
          sunshine: r.values['SUN-SHINE'] === 0 ? '-' : r.values['SUN-SHINE'] || '-',
          total: r.total === 0 ? '-' : r.total || '-',
        });
      }
    });

    setPrintModalState({
      isOpen: true,
      title: `LIVE STOCK MATRIX (${activeStorage.toUpperCase()})`,
      subtitle: `Facility: ${activeStorage} • Currency: ${companySettings.currency || 'BDT'}`,
      columns: [
        { header: 'ITEM / CATEGORY', key: 'item', width: 32, align: 'left' },
        { header: 'ASTERIX (BAGS)', key: 'asterix', width: 16, align: 'right', isNumeric: true },
        { header: 'DIAMANT (BAGS)', key: 'diamant', width: 16, align: 'right', isNumeric: true },
        { header: 'GRANOLA (BAGS)', key: 'granola', width: 16, align: 'right', isNumeric: true },
        { header: 'SUN-SHINE (BAGS)', key: 'sunshine', width: 16, align: 'right', isNumeric: true },
        { header: 'TOTAL (BAGS)', key: 'total', width: 18, align: 'right', isNumeric: true },
      ],
      data: previewRows,
      summaryItems: [
        { label: 'Facility', value: activeStorage },
        { label: 'Grand Total Bags', value: Number(matrixData.grandTotal || 0).toLocaleString() },
        { label: 'Active Items', value: matrixData.rows.filter(r => r.type !== 'gap').length },
      ],
    });
  };

  const renderCellValue = (val: number | undefined) => {
    if (val === undefined || val === null || val === 0) return '-';
    return val.toLocaleString();
  };

  const totalColStyle = getVarietyColorStyle('TOTAL');

  // Helper to get variety column key from variety ID
  const getVarietyColKey = (varietyId: string): string => {
    const v = varieties.find((item) => item.id === varietyId);
    const name = (v?.name || '').toUpperCase();
    const code = (v?.code || '').toUpperCase();
    if (code === 'AST' || name.includes('ASTERIX')) return 'ASTERIX';
    if (code === 'DIA' || name.includes('DIAMANT')) return 'DIAMANT';
    if (code === 'GRA' || name.includes('GRANOLA')) return 'GRANOLA';
    if (code === 'SUN' || name.includes('SUN-SHINE') || name.includes('SUNSHINE')) return 'SUN-SHINE';
    return 'OTHER';
  };

  // Helper to match row criteria
  const matchesRowCriteria = (rowId: string, classId: string, gradeId: string) => {
    const cls = seedClasses.find((c) => c.id === classId);
    const grd = grades.find((g) => g.id === gradeId);

    const className = (cls?.name || '').toLowerCase();
    const classCode = (cls?.code || '').toUpperCase();
    const gradeName = (grd?.name || '').toLowerCase();
    const gradeCode = (grd?.code || '').toUpperCase();

    switch (rowId) {
      case 'certify-a':
        return (classCode === 'CS' || className.includes('certif')) && (gradeCode === 'A' || gradeName === 'grade a');
      case 'certify-b':
        return (classCode === 'CS' || className.includes('certif')) && (gradeCode === 'B' || gradeName === 'grade b');
      case 'certify-us':
        return (classCode === 'CS' || className.includes('certif')) && (gradeCode === 'US' || gradeName.includes('under size') || gradeName.includes('us'));
      case 'total-certify':
        return classCode === 'CS' || className.includes('certif');

      case 'foundation-a':
        return (classCode === 'FS' || (className.includes('foundation') && !className.includes('pre'))) && (gradeCode === 'A' || gradeName === 'grade a');
      case 'foundation-b':
        return (classCode === 'FS' || (className.includes('foundation') && !className.includes('pre'))) && (gradeCode === 'B' || gradeName === 'grade b');
      case 'foundation-us':
        return (classCode === 'FS' || (className.includes('foundation') && !className.includes('pre'))) && (gradeCode === 'US' || gradeName.includes('under size') || gradeName.includes('us'));
      case 'foundation-os':
        return (classCode === 'FS' || (className.includes('foundation') && !className.includes('pre'))) && (gradeCode === 'OS' || gradeName.includes('over size') || gradeName.includes('os'));
      case 'total-foundation':
        return classCode === 'FS' || (className.includes('foundation') && !className.includes('pre'));

      case 'mini-tuber':
      case 'total-mini-tuber':
        return classCode === 'MT' || classCode === 'BRD' || className.includes('mini tuber') || className.includes('breeder');

      case 'table-potato':
      case 'total-table-potato':
        return gradeCode === 'TP' || gradeName.includes('tp');

      case 'pre-foundation-a':
        return (classCode === 'PF' || classCode === 'PFS' || className.includes('pre')) && (gradeCode === 'A' || gradeName === 'grade a');
      case 'pre-foundation-b':
        return (classCode === 'PF' || classCode === 'PFS' || className.includes('pre')) && (gradeCode === 'B' || gradeName === 'grade b');
      case 'pre-foundation-us':
        return (classCode === 'PF' || classCode === 'PFS' || className.includes('pre')) && (gradeCode === 'US' || gradeName.includes('under size') || gradeName.includes('us'));
      case 'total-pre-foundation':
        return classCode === 'PF' || classCode === 'PFS' || className.includes('pre');

      case 'tls-a':
        return (classCode === 'TLS' || className.includes('tls')) && (gradeCode === 'A' || gradeName === 'grade a');
      case 'tls-b':
        return (classCode === 'TLS' || className.includes('tls')) && (gradeCode === 'B' || gradeName === 'grade b');
      case 'total-tls':
        return classCode === 'TLS' || className.includes('tls');

      case 'non-traceable':
      case 'total-non-traceable':
        return classCode === 'NT' || className.includes('non traceable') || className.includes('non-traceable');
      case 'grand-total':
      default:
        return true;
    }
  };

  // Get live stock balance records per SR for expanded drawer (Stock In - Stock Out = Balance Stock)
  const getExpandedRowDetails = (rowId: string, varietyKey: string) => {
    const matchedStock = stockTransactions.filter((s) => {
      if (s.status !== 'approved') return false;
      if (filters.coldStorageId && s.coldStorageId !== filters.coldStorageId) return false;
      if (varietyKey !== 'ALL' && getVarietyColKey(s.varietyId) !== varietyKey) return false;
      return matchesRowCriteria(rowId, s.classId, s.gradeId);
    });

    const matchedDelivery = deliveryTransactions.filter((d) => {
      if (d.status !== 'approved' && d.status !== 'completed') return false;
      if (filters.coldStorageId && d.coldStorageId !== filters.coldStorageId) return false;
      if (varietyKey !== 'ALL' && getVarietyColKey(d.varietyId) !== varietyKey) return false;
      return matchesRowCriteria(rowId, d.classId, d.gradeId);
    });

    // We calculate the live remaining stock quantity for each SR (Stock In minus Stock Out = Balance Stock)
    const directDeliveryBySr: Record<string, number> = {};
    const unallocatedDeliveries: {
      coldStorageId: string;
      varietyId: string;
      classId: string;
      gradeId: string;
      remainingBags: number;
    }[] = [];

    matchedDelivery.forEach((d) => {
      const qty = d.sackQuantity || 0;
      if (qty <= 0) return;
      if (d.srNo) {
        const srKey = `${d.coldStorageId}|${d.varietyId}|${d.srNo}`;
        directDeliveryBySr[srKey] = (directDeliveryBySr[srKey] || 0) + qty;
      } else {
        unallocatedDeliveries.push({
          coldStorageId: d.coldStorageId,
          varietyId: d.varietyId,
          classId: d.classId,
          gradeId: d.gradeId,
          remainingBags: qty,
        });
      }
    });

    // Process stock records chronologically
    const sortedStocks = [...matchedStock].sort((a, b) => a.date.localeCompare(b.date));

    // First apply direct SR deductions
    const stockWorkList = sortedStocks.map((s) => {
      const srKey = `${s.coldStorageId}|${s.varietyId}|${s.srNo}`;
      const directDel = directDeliveryBySr[srKey] || 0;
      const deducted = Math.min(s.sackQuantity, directDel);
      directDeliveryBySr[srKey] = directDel - deducted;
      return {
        stock: s,
        remainingBags: s.sackQuantity - deducted,
      };
    });

    // Next, apply generic / unallocated deliveries FIFO
    unallocatedDeliveries.forEach((del) => {
      let needed = del.remainingBags;
      for (const item of stockWorkList) {
        if (needed <= 0) break;
        if (
          item.remainingBags > 0 &&
          item.stock.coldStorageId === del.coldStorageId &&
          item.stock.varietyId === del.varietyId &&
          item.stock.classId === del.classId &&
          item.stock.gradeId === del.gradeId
        ) {
          const take = Math.min(item.remainingBags, needed);
          item.remainingBags -= take;
          needed -= take;
        }
      }
    });

    // Also if any direct delivery SR had leftover quantity, deduct from same variety & storage
    Object.entries(directDeliveryBySr).forEach(([srKey, leftoverQty]) => {
      if (leftoverQty <= 0) return;
      const [csId, varId] = srKey.split('|');
      let needed = leftoverQty;
      for (const item of stockWorkList) {
        if (needed <= 0) break;
        if (
          item.remainingBags > 0 &&
          item.stock.coldStorageId === csId &&
          item.stock.varietyId === varId
        ) {
          const take = Math.min(item.remainingBags, needed);
          item.remainingBags -= take;
          needed -= take;
        }
      }
    });

    // Build final live stock rows for current stock quantity (Balance Stock > 0)
    const liveStockItems = stockWorkList
      .filter((item) => item.remainingBags > 0)
      .map((item) => {
        const s = item.stock;
        const cs = coldStorages.find((c) => c.id === s.coldStorageId);
        const v = varieties.find((varItem) => varItem.id === s.varietyId);
        const cls = seedClasses.find((c) => c.id === s.classId);
        const grd = grades.find((g) => g.id === s.gradeId);
        const kgPerBag = s.kgPerBag || 50;
        const totalKg = item.remainingBags * kgPerBag;
        const totalMt = Number((totalKg / 1000).toFixed(2));
        // Use only cold storage code name (e.g. CS-01) as requested
        const coldStorageCode = cs?.code || (cs?.name ? cs.name.replace(/cold\s*storage/gi, '').trim() : '-');

        return {
          id: s.id,
          date: s.date,
          srNo: s.srNo || '-',
          coldStorage: coldStorageCode,
          variety: v?.name || '-',
          className: cls?.name || '-',
          grade: grd?.name || '-',
          bag: item.remainingBags,
          totalKg,
          totalMt,
          kgPerBag,
          kblChallan: s.kblChallanNo || '-',
        };
      });

    const totalBags = liveStockItems.reduce((acc, row) => acc + row.bag, 0);
    const totalMt = liveStockItems.reduce((acc, row) => acc + row.totalMt, 0);

    return {
      items: liveStockItems,
      totalBags,
      totalMt,
    };
  };

  // Interface for detail drawer records: date, SR number, cold storage name, variety, class, grade, number of bags, total kg, total MT
  interface ExpandedBatchItem {
    id: string;
    date: string;
    srNo: string;
    coldStorage: string;
    variety: string;
    className: string;
    grade: string;
    bag: number;
    totalKg: number;
    totalMt: number;
    kgPerBag: number;
    kblChallan: string;
  }

  // Expanded detail drawer component with Search Bar, Pagination and Rows Per Page
  const ExpandedBatchDetailDrawer: React.FC<{
    row: (typeof matrixData.rows)[0];
    selectedVarietyKey: string;
    details: {
      items: ExpandedBatchItem[];
      totalBags: number;
      totalMt: number;
    };
    colSpan: number;
    densityStyles: {
      drawerTh: string;
      drawerTd: string;
    };
    onClose: () => void;
  }> = ({ row, selectedVarietyKey, details, colSpan, densityStyles, onClose }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10); // Default is 10 as requested
    const [sortField, setSortField] = useState<string>('date');
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

    const handleSort = (field: string) => {
      if (sortField === field) {
        setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortField(field);
        setSortDir('asc');
      }
    };

    // Filter items based on user search input
    const filteredItems = React.useMemo(() => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return details.items;

      return details.items.filter((item) => {
        return (
          item.date.toLowerCase().includes(q) ||
          item.coldStorage.toLowerCase().includes(q) ||
          item.srNo.toLowerCase().includes(q) ||
          item.kblChallan.toLowerCase().includes(q) ||
          item.variety.toLowerCase().includes(q) ||
          item.className.toLowerCase().includes(q) ||
          (item.grade && item.grade.toLowerCase().includes(q)) ||
          item.bag.toString().includes(q) ||
          item.kgPerBag.toString().includes(q) ||
          item.totalMt.toString().includes(q)
        );
      });
    }, [details.items, searchQuery]);

    // Sorted items
    const sortedItems = React.useMemo(() => {
      return [...filteredItems].sort((a, b) => {
        let valA: any = (a as any)[sortField];
        let valB: any = (b as any)[sortField];
        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();
        if (valA < valB) return sortDir === 'asc' ? -1 : 1;
        if (valA > valB) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }, [filteredItems, sortField, sortDir]);

    // Aggregate totals for the filtered set
    const filteredTotalBags = React.useMemo(() => {
      return filteredItems.reduce((acc, item) => acc + item.bag, 0);
    }, [filteredItems]);

    const filteredTotalKg = React.useMemo(() => {
      return filteredItems.reduce((acc, item) => acc + item.totalKg, 0);
    }, [filteredItems]);

    const filteredTotalMt = React.useMemo(() => {
      return filteredItems.reduce((acc, item) => acc + item.totalMt, 0);
    }, [filteredItems]);

    // Calculate pagination slices
    const totalItems = sortedItems.length;
    const totalPages = rowsPerPage === -1 ? 1 : Math.max(1, Math.ceil(totalItems / rowsPerPage));
    const effectivePage = Math.min(Math.max(1, currentPage), totalPages);

    const startIndex = rowsPerPage === -1 ? 0 : (effectivePage - 1) * rowsPerPage;
    const endIndex = rowsPerPage === -1 ? totalItems : Math.min(startIndex + rowsPerPage, totalItems);
    const paginatedItems = rowsPerPage === -1 ? sortedItems : sortedItems.slice(startIndex, endIndex);

    // Export handlers for this specific batch breakdown in requested column sequence:
    // date, SR number, cold storage name, variety, class, grade, number of bags, total kg, total MT
    const handleExportDrawerExcel = () => {
      if (filteredItems.length === 0) {
        addToast('No records available to export', 'error');
        return;
      }

      const exportData = filteredItems.map((item) => ({
        date: formatDisplayDate(item.date),
        srNo: item.srNo,
        coldStorage: item.coldStorage,
        variety: item.variety,
        className: item.className,
        grade: item.grade || '-',
        bag: item.bag,
        totalKg: item.totalKg,
        totalMt: item.totalMt,
      }));

      exportToExcel(
        exportData,
        [
          { header: 'Date', key: 'date', width: 14 },
          { header: 'SR Number', key: 'srNo', width: 14 },
          { header: 'Cold Storage', key: 'coldStorage', width: 16 },
          { header: 'Variety', key: 'variety', width: 16 },
          { header: 'Class', key: 'className', width: 16 },
          { header: 'Grade', key: 'grade', width: 12 },
          { header: 'Number of Bags', key: 'bag', width: 16, isNumeric: true },
          { header: 'Total KG', key: 'totalKg', width: 16, isNumeric: true },
          { header: 'Total MT', key: 'totalMt', width: 14, isNumeric: true },
        ],
        `LIVE_BATCH_DETAILS_${row.label.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}`,
        `Live Batch Details: ${row.label} (${activeStorage})`,
        companySettings,
        `Facility: ${activeStorage} | Total Records: ${filteredItems.length} | Total Bags: ${filteredTotalBags.toLocaleString()} | Total KG: ${filteredTotalKg.toLocaleString()} | Total MT: ${filteredTotalMt.toFixed(2)}`
      );
      addToast(`Batch records for ${row.label} exported to Excel!`, 'success');
    };

    const handleExportDrawerPdf = () => {
      if (filteredItems.length === 0) {
        addToast('No records available to export', 'error');
        return;
      }

      const exportRows = filteredItems.map((item) => ({
        date: formatDisplayDate(item.date),
        srNo: item.srNo,
        coldStorage: item.coldStorage,
        variety: item.variety,
        className: item.className,
        grade: item.grade || '-',
        bag: item.bag.toLocaleString(),
        totalKg: item.totalKg.toLocaleString(),
        totalMt: item.totalMt.toFixed(2),
      }));

      exportToPdf(
        exportRows,
        [
          { header: 'Date', key: 'date' },
          { header: 'SR Number', key: 'srNo' },
          { header: 'Cold Storage', key: 'coldStorage' },
          { header: 'Variety', key: 'variety' },
          { header: 'Class', key: 'className' },
          { header: 'Grade', key: 'grade' },
          { header: 'Number of Bags', key: 'bag' },
          { header: 'Total KG', key: 'totalKg' },
          { header: 'Total MT', key: 'totalMt' },
        ],
        `LIVE_BATCH_DETAILS_${row.label.replace(/\s+/g, '_')}`,
        `Live Batch Details: ${row.label} (${activeStorage})`,
        companySettings,
        'l',
        `Facility: ${activeStorage} | Total Bags: ${filteredTotalBags.toLocaleString()} | Total KG: ${filteredTotalKg.toLocaleString()} | Total MT: ${filteredTotalMt.toFixed(2)}`
      );
      addToast(`Batch records for ${row.label} exported to PDF!`, 'success');
    };

    const handleDrawerPrint = () => {
      if (filteredItems.length === 0) {
        addToast('No records available to print', 'error');
        return;
      }

      const previewRows = filteredItems.map((item, idx) => ({
        index: idx + 1,
        date: formatDisplayDate(item.date),
        srNo: item.srNo,
        coldStorage: item.coldStorage,
        variety: item.variety,
        className: item.className,
        grade: item.grade || '-',
        bag: item.bag,
        totalKg: item.totalKg,
        totalMt: item.totalMt,
      }));

      setPrintModalState({
        isOpen: true,
        title: `LIVE BATCH DETAILS: ${row.label.toUpperCase()} (${activeStorage})`,
        subtitle: `Facility: ${activeStorage} • Total Bags: ${filteredTotalBags.toLocaleString()} • Total KG: ${filteredTotalKg.toLocaleString()} • Total MT: ${filteredTotalMt.toFixed(2)}`,
        columns: [
          { header: '#', key: 'index', width: 6, align: 'center' },
          { header: 'Date', key: 'date', width: 12, align: 'left' },
          { header: 'SR Number', key: 'srNo', width: 14, align: 'left' },
          { header: 'Cold Storage', key: 'coldStorage', width: 14, align: 'left' },
          { header: 'Variety', key: 'variety', width: 14, align: 'left' },
          { header: 'Class', key: 'className', width: 14, align: 'left' },
          { header: 'Grade', key: 'grade', width: 10, align: 'left' },
          { header: 'Number of Bags', key: 'bag', width: 14, align: 'right', isNumeric: true },
          { header: 'Total KG', key: 'totalKg', width: 14, align: 'right', isNumeric: true },
          { header: 'Total MT', key: 'totalMt', width: 12, align: 'right', isNumeric: true },
        ],
        data: previewRows,
        summaryItems: [
          { label: 'Category', value: row.label },
          { label: 'Total Records', value: filteredItems.length },
          { label: 'Total Bags', value: filteredTotalBags.toLocaleString() },
          { label: 'Total KG', value: `${filteredTotalKg.toLocaleString()} KG` },
          { label: 'Total MT', value: `${filteredTotalMt.toFixed(2)} MT` },
        ],
      });
    };

    return (
      <tr key={`${row.id}-expanded`} className="bg-slate-50/90 dark:bg-slate-900/90 border-y-2 border-sky-500 dark:border-sky-400">
        <td colSpan={colSpan} className="p-1.5 sm:p-2.5">
          <div className="bg-white dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-750 px-3 py-2.5 sm:px-4 sm:py-3 shadow-md text-left">
            {/* Top Bar: Title on left, Search Bar (no placeholder) + Excel, PDF, Print, Close right-aligned */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 mb-2 border-b border-slate-200 dark:border-slate-750">
              {/* Left Side: Category / Variety Context Badge */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  {row.label.toUpperCase()} {selectedVarietyKey !== 'ALL' ? `(${selectedVarietyKey.toUpperCase()})` : ''} LIVE BATCH DETAILS
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  {sortedItems.length} {sortedItems.length === 1 ? 'RECORD' : 'RECORDS'}
                </span>
              </div>

              {/* Right Side: Search Bar (no placeholder) + Icon-only Action Buttons (Excel, PDF, Print) + Close */}
              <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 ml-auto">
                {/* Search Bar without placeholder */}
                <div className="relative w-44 sm:w-56">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full pl-8 pr-7 py-1 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 shadow-2xs transition-all font-medium"
                    aria-label="Search batch records"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setCurrentPage(1);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                      title="CLEAR SEARCH"
                      aria-label="CLEAR SEARCH"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Excel Export Button (Icon only) */}
                <button
                  type="button"
                  onClick={handleExportDrawerExcel}
                  className="p-1.5 text-emerald-600 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-200 dark:border-emerald-800/80 shadow-2xs transition-colors cursor-pointer"
                  title="EXPORT TO EXCEL"
                  aria-label="EXPORT TO EXCEL"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>

                {/* PDF Save Button (Icon only) */}
                <button
                  type="button"
                  onClick={handleExportDrawerPdf}
                  className="p-1.5 text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/60 rounded-lg border border-rose-200 dark:border-rose-800/80 shadow-2xs transition-colors cursor-pointer"
                  title="SAVE AS PDF"
                  aria-label="SAVE AS PDF"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>

                {/* Print Button (Icon only) */}
                <button
                  type="button"
                  onClick={handleDrawerPrint}
                  className="p-1.5 text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-lg border border-slate-200 dark:border-slate-750 shadow-2xs transition-colors cursor-pointer"
                  title="PRINT RECORDS"
                  aria-label="PRINT RECORDS"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700 shrink-0"
                  title="CLOSE BREAKDOWN"
                  aria-label="CLOSE BREAKDOWN"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Live Stock Table with current stock quantity */}
            <div className="overflow-x-auto border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs">
              <table className="w-full text-left border-collapse border border-slate-300 dark:border-slate-700">
                <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-slate-700 text-xs">
                  <tr>
                    <th
                      onClick={() => handleSort('date')}
                      className={`${densityStyles.drawerTh} text-left pl-3 border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors group whitespace-nowrap w-[105px] min-w-[105px] ${
                        sortField === 'date'
                          ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                          : 'hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span>DATE</span>
                        <SortIcon field="date" currentField={sortField} direction={sortDir} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('srNo')}
                      className={`${densityStyles.drawerTh} text-left pl-3 border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors group whitespace-nowrap w-24 ${
                        sortField === 'srNo'
                          ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                          : 'hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span>SR NUMBER</span>
                        <SortIcon field="srNo" currentField={sortField} direction={sortDir} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('coldStorage')}
                      className={`${densityStyles.drawerTh} text-left pl-3 border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors group whitespace-nowrap w-24 ${
                        sortField === 'coldStorage'
                          ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                          : 'hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span>COLD STORAGE</span>
                        <SortIcon field="coldStorage" currentField={sortField} direction={sortDir} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('variety')}
                      className={`${densityStyles.drawerTh} text-left pl-3 border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors group whitespace-nowrap w-28 ${
                        sortField === 'variety'
                          ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                          : 'hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span>VARIETY</span>
                        <SortIcon field="variety" currentField={sortField} direction={sortDir} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('className')}
                      className={`${densityStyles.drawerTh} text-left pl-3 border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors group whitespace-nowrap w-24 ${
                        sortField === 'className'
                          ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                          : 'hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span>CLASS</span>
                        <SortIcon field="className" currentField={sortField} direction={sortDir} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('grade')}
                      className={`${densityStyles.drawerTh} text-left pl-3 border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors group whitespace-nowrap w-20 ${
                        sortField === 'grade'
                          ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                          : 'hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span>GRADE</span>
                        <SortIcon field="grade" currentField={sortField} direction={sortDir} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('bag')}
                      className={`${densityStyles.drawerTh} text-right pr-3 border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors group whitespace-nowrap w-28 ${
                        sortField === 'bag'
                          ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                          : 'hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="inline-flex items-center justify-end gap-1">
                        <span>NUMBER OF BAGS</span>
                        <SortIcon field="bag" currentField={sortField} direction={sortDir} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('totalKg')}
                      className={`${densityStyles.drawerTh} text-right pr-3 border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors group whitespace-nowrap w-28 ${
                        sortField === 'totalKg'
                          ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                          : 'hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="inline-flex items-center justify-end gap-1">
                        <span>TOTAL KG</span>
                        <SortIcon field="totalKg" currentField={sortField} direction={sortDir} />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('totalMt')}
                      className={`${densityStyles.drawerTh} text-right pr-3 border border-slate-300 dark:border-slate-700 cursor-pointer select-none transition-colors group whitespace-nowrap w-24 ${
                        sortField === 'totalMt'
                          ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 font-bold'
                          : 'hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="inline-flex items-center justify-end gap-1">
                        <span>TOTAL MT</span>
                        <SortIcon field="totalMt" currentField={sortField} direction={sortDir} />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {paginatedItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700">
                        {searchQuery ? (
                          <div className="flex flex-col items-center justify-center gap-1.5">
                            <p className="text-xs">No records matching &ldquo;{searchQuery}&rdquo; found.</p>
                            <button
                              type="button"
                              onClick={() => setSearchQuery('')}
                              className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold cursor-pointer"
                            >
                              Clear search filter
                            </button>
                          </div>
                        ) : (
                          <p className="text-xs">No active stock remaining for this item.</p>
                        )}
                      </td>
                    </tr>
                  ) : (
                    paginatedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        {/* DATE: 1 line, uniform font size, text-left indent 1 */}
                        <td className={`${densityStyles.drawerTd} text-left pl-3 whitespace-nowrap font-mono font-bold text-xs border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200`}>
                          {formatDisplayDate(item.date)}
                        </td>
                        {/* SR NUMBER: uniform text-xs font, text-left indent 1 */}
                        <td className={`${densityStyles.drawerTd} text-left pl-3 border border-slate-300 dark:border-slate-700`}>
                          <span className="inline-block px-1.5 py-0.5 rounded bg-transparent border border-sky-400 dark:border-sky-500 text-sky-700 dark:text-sky-300 font-mono font-bold text-xs shadow-2xs">
                            {item.srNo}
                          </span>
                        </td>
                        {/* COLD STORAGE: uniform text-xs font, text-left indent 1 */}
                        <td className={`${densityStyles.drawerTd} text-left pl-3 border border-slate-300 dark:border-slate-700`}>
                          <span className="inline-block px-1.5 py-0.5 rounded bg-transparent border border-indigo-400 dark:border-indigo-500 text-indigo-700 dark:text-indigo-300 uppercase tracking-wide font-bold text-xs shadow-2xs">
                            {item.coldStorage}
                          </span>
                        </td>
                        {/* VARIETY: text border added, uniform text-xs font, text-left indent 1 */}
                        <td className={`${densityStyles.drawerTd} text-left pl-3 border border-slate-300 dark:border-slate-700`}>
                          <span className="inline-block px-1.5 py-0.5 rounded bg-transparent border border-amber-500 dark:border-amber-400 text-amber-800 dark:text-amber-200 font-bold text-xs uppercase tracking-wide shadow-2xs">
                            {item.variety}
                          </span>
                        </td>
                        {/* CLASS: uniform text-xs font, text-left indent 1 */}
                        <td className={`${densityStyles.drawerTd} text-left pl-3 border border-slate-300 dark:border-slate-700`}>
                          <span className="inline-block px-1.5 py-0.5 rounded-md border border-slate-400 dark:border-slate-600 bg-transparent text-slate-800 dark:text-slate-100 font-bold text-xs uppercase tracking-wider shadow-2xs">
                            {item.className}
                          </span>
                        </td>
                        {/* GRADE: uniform text-xs font, text-left indent 1 */}
                        <td className={`${densityStyles.drawerTd} text-left pl-3 border border-slate-300 dark:border-slate-700`}>
                          {item.grade && item.grade !== '-' ? (
                            <span className="inline-block px-1.5 py-0.5 rounded-md border border-teal-400 dark:border-teal-500 bg-transparent text-teal-700 dark:text-teal-300 font-semibold text-xs uppercase tracking-wider shadow-2xs">
                              {item.grade}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        {/* NUMBER OF BAGS: uniform text-xs font, text-right indent 1 */}
                        <td className={`${densityStyles.drawerTd} text-right pr-3 border border-slate-300 dark:border-slate-700 font-mono tabular-nums font-bold`}>
                          <span className="inline-block px-1.5 py-0.5 rounded bg-transparent border border-blue-400 dark:border-blue-500 text-blue-700 dark:text-blue-300 font-bold text-xs shadow-2xs">
                            {item.bag > 0 ? item.bag.toLocaleString() : '-'}
                          </span>
                        </td>
                        {/* TOTAL KG: uniform text-xs font, text-right indent 1 */}
                        <td className={`${densityStyles.drawerTd} text-right pr-3 border border-slate-300 dark:border-slate-700 font-mono tabular-nums font-bold`}>
                          <span className="inline-block px-1.5 py-0.5 rounded bg-transparent border border-purple-400 dark:border-purple-500 text-purple-700 dark:text-purple-300 font-bold text-xs shadow-2xs">
                            {item.totalKg > 0 ? item.totalKg.toLocaleString() : '-'}
                          </span>
                        </td>
                        {/* TOTAL MT: uniform text-xs font, text-right indent 1 */}
                        <td className={`${densityStyles.drawerTd} text-right pr-3 border border-slate-300 dark:border-slate-700 font-mono tabular-nums font-black`}>
                          <span className="inline-block px-1.5 py-0.5 rounded bg-transparent border border-emerald-400 dark:border-emerald-500 text-emerald-700 dark:text-emerald-300 font-black text-xs shadow-2xs">
                            {item.totalMt > 0 ? item.totalMt.toFixed(2) : '-'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredItems.length > 0 && (
                  <tfoot className="bg-slate-100 dark:bg-slate-850 font-black border-t-2 border-slate-400 dark:border-slate-600">
                    <tr>
                      {/* TOTAL Label Cell with TB color, clean border and design */}
                      <td
                        colSpan={6}
                        className={`${densityStyles.drawerTh} text-left pl-4 uppercase tracking-wider text-slate-900 dark:text-white bg-slate-200/90 dark:bg-slate-800 font-black border border-slate-300 dark:border-slate-700 shadow-2xs text-xs`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 border border-slate-700 dark:border-slate-300 text-xs font-black tracking-widest uppercase shadow-xs">
                            <Layers className="w-3.5 h-3.5 text-amber-400 dark:text-amber-500" />
                            <span>TOTAL</span>
                          </span>
                          {searchQuery && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                              (FILTERED {filteredItems.length} OF {details.items.length})
                            </span>
                          )}
                        </div>
                      </td>
                      <td className={`${densityStyles.drawerTh} text-right pr-3 font-mono tabular-nums font-black text-blue-700 dark:text-blue-300 bg-transparent border border-slate-300 dark:border-slate-700 text-xs`}>
                        <span className="inline-block px-1.5 py-0.5 rounded bg-transparent border border-blue-400 dark:border-blue-500 font-black">
                          {filteredTotalBags > 0 ? filteredTotalBags.toLocaleString() : '-'}
                        </span>
                      </td>
                      <td className={`${densityStyles.drawerTh} text-right pr-3 font-mono tabular-nums font-black text-purple-700 dark:text-purple-300 bg-transparent border border-slate-300 dark:border-slate-700 text-xs`}>
                        <span className="inline-block px-1.5 py-0.5 rounded bg-transparent border border-purple-400 dark:border-purple-500 font-black">
                          {filteredTotalKg > 0 ? filteredTotalKg.toLocaleString() : '-'}
                        </span>
                      </td>
                      <td className={`${densityStyles.drawerTh} text-right pr-3 font-mono tabular-nums font-black text-emerald-700 dark:text-emerald-300 bg-transparent border border-slate-300 dark:border-slate-700 text-xs`}>
                        <span className="inline-block px-1.5 py-0.5 rounded bg-transparent border border-emerald-400 dark:border-emerald-500 font-black">
                          {filteredTotalMt > 0 ? filteredTotalMt.toFixed(2) : '-'}
                        </span>
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            {/* Footer Pagination Bar */}
            {filteredItems.length > 0 && (
              <div className="pt-2.5 mt-2 border-t border-slate-200 dark:border-slate-750 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 select-none">
                {/* Left Side: Minimal Rows selector and item counter */}
                <div className="flex items-center flex-wrap gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-[11px] sm:text-xs">Rows:</span>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="px-1.5 py-0.5 text-xs font-semibold rounded-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500/50 shadow-2xs cursor-pointer"
                      aria-label="Rows per page"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={30}>30</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                      <option value={-1}>All</option>
                    </select>
                  </div>

                  <span className="text-slate-300 dark:text-slate-600">·</span>

                  <span className="font-medium text-slate-600 dark:text-slate-400 text-[11px] sm:text-xs">
                    {rowsPerPage === -1 ? (
                      `${totalItems}`
                    ) : (
                      `${totalItems === 0 ? 0 : startIndex + 1}–${endIndex} of ${totalItems}`
                    )}
                  </span>
                </div>

                {/* Right Side: Icon-only buttons for pagination */}
                <div className="flex items-center gap-1">
                  {/* First Page Button */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(1)}
                    disabled={effectivePage <= 1}
                    className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                    title="First page"
                    aria-label="First page"
                  >
                    <ChevronsLeft className="w-3.5 h-3.5" />
                  </button>

                  {/* Previous Button */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={effectivePage <= 1}
                    className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                    title="Previous page"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>

                  {/* Page Indicator */}
                  <div className="px-2 py-0.5 text-xs font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-2xs">
                    {effectivePage} / {totalPages}
                  </div>

                  {/* Next Button */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={effectivePage >= totalPages}
                    className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                    title="Next page"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Last Page Button */}
                  <button
                    type="button"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={effectivePage >= totalPages}
                    className="p-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-750 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-2xs"
                    title="Last page"
                    aria-label="Last page"
                  >
                    <ChevronsRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // Render expanded detail drawer for a selected row
  const renderExpandedDrawer = (row: (typeof matrixData.rows)[0]) => {
    const details = getExpandedRowDetails(row.id, selectedVarietyKey);

    return (
      <ExpandedBatchDetailDrawer
        key={`${row.id}-expanded`}
        row={row}
        selectedVarietyKey={selectedVarietyKey}
        details={details}
        colSpan={matrixData.columns.length + 2}
        densityStyles={densityStyles}
        onClose={() => setExpandedRowId(null)}
      />
    );
  };

  // Toggle row expansion or target specific variety
  const handleToggleRow = (rowId: string, varietyKey = 'ALL') => {
    if (expandedRowId === rowId && selectedVarietyKey === varietyKey) {
      setExpandedRowId(null);
    } else {
      setExpandedRowId(rowId);
      setSelectedVarietyKey(varietyKey);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs overflow-hidden transition-all">
      {/* Header bar: Matches the exact bg-slate-200/80 dark:bg-slate-800 header row of Cold Storage Wise Summary */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-2.5 px-2.5 sm:px-4 py-2 sm:py-2.5 border-b-2 border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-slate-800 dark:text-slate-100 shadow-xs print:bg-transparent print:border-b-2 print:border-slate-800">
        {/* Left side: Title + Cold Storage Dropdown + Reset Button + Expand/Collapse Button */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3.5">
          <div className="flex items-center gap-1.5 shrink-0 pr-1">
            <div className="p-1 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-2xs print:hidden">
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider whitespace-nowrap">
              ITEM-WISE STOCK SUMMARY
            </h3>
          </div>

          {/* Cold Storage Filter Dropdown: softer/lighter background, dark font, smaller size as requested */}
          <select
            value={filters.coldStorageId || ''}
            onChange={(e) => {
              setFilters((prev) => ({
                ...prev,
                coldStorageId: e.target.value || undefined,
              }));
            }}
            className="text-[10px] sm:text-[10.5px] font-semibold rounded-lg border border-slate-300 dark:border-slate-600 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 text-slate-800 dark:text-slate-100 px-2.5 py-1 focus:outline-none focus:ring-2 focus:ring-sky-500/50 shadow-2xs w-[165px] sm:w-[185px] cursor-pointer transition-colors uppercase"
            title="Filter by Cold Storage"
            aria-label="Filter by Cold Storage"
          >
            <option value="" className="bg-white text-slate-900 dark:bg-slate-800 dark:text-white font-bold">ALL COLD STORAGE</option>
            {coldStorages.map((cs) => (
              <option key={cs.id} value={cs.id} className="bg-white text-slate-800 dark:bg-slate-800 dark:text-white font-medium">
                {cs.name.toUpperCase()} ({cs.code})
              </option>
            ))}
          </select>

          {/* EXPAND ALL / COLLAPSE ALL Icon-only Button as requested */}
          <button
            type="button"
            onClick={() => {
              if (expandedItemGroups.size > 0) {
                collapseAllGroups();
              } else {
                expandAllGroups();
              }
            }}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 border border-slate-300 dark:border-slate-600 shadow-2xs transition-colors cursor-pointer inline-flex items-center justify-center no-print"
            title={expandedItemGroups.size > 0 ? "Collapse all grade rows" : "Expand all grade rows"}
            aria-label={expandedItemGroups.size > 0 ? "Collapse all grade rows" : "Expand all grade rows"}
          >
            {expandedItemGroups.size > 0 ? (
              <ChevronUp className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            )}
          </button>

          {/* RESET Icon-only Button: resets filters and collapses expanded data */}
          <button
            type="button"
            onClick={() => {
              setExpandedRowId(null);
              setSelectedVarietyKey('ALL');
              setExpandedItemGroups(new Set());
              setFilters((prev) => ({ ...prev, coldStorageId: undefined }));
              setShowEmptyGrid(false);
              addToast('Item-Wise Stock Summary reset to default', 'info');
            }}
            className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 border border-slate-300 dark:border-slate-600 shadow-2xs transition-colors cursor-pointer inline-flex items-center justify-center no-print"
            title="Reset all filters and collapse expanded data"
            aria-label="Reset to default state"
          >
            <RotateCcw className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        {/* Right side: Icon Action Buttons */}
        <div className="flex items-center flex-wrap gap-1.5 ml-auto no-print">
          {/* Export Matrix / Excel (Icon only) */}
          <button
            onClick={handleExportExcel}
            className="p-1.5 text-emerald-700 dark:text-emerald-400 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 rounded-lg border border-slate-300 dark:border-slate-600 transition-colors shadow-2xs cursor-pointer inline-flex items-center justify-center"
            title="Export Matrix to Excel"
            aria-label="Export Matrix to Excel"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Export PDF (Icon only) */}
          <button
            onClick={handleExportPdf}
            className="p-1.5 text-rose-700 dark:text-rose-400 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 rounded-lg border border-slate-300 dark:border-slate-600 transition-colors shadow-2xs cursor-pointer inline-flex items-center justify-center"
            title="Export Matrix to PDF"
            aria-label="Export Matrix to PDF"
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* Print (Icon only) */}
          <button
            onClick={handlePrint}
            className="p-1.5 text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 rounded-lg border border-slate-300 dark:border-slate-600 transition-colors shadow-2xs cursor-pointer inline-flex items-center justify-center"
            title="Print Matrix"
            aria-label="Print Matrix"
          >
            <Printer className="w-4 h-4" />
          </button>

          {/* Toggle Empty Grid (Icon only) */}
          {hasZeroResults && (
            <button
              onClick={() => setShowEmptyGrid(!showEmptyGrid)}
              className="p-1.5 text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 rounded-lg border border-slate-300 dark:border-slate-600 transition-colors shadow-2xs cursor-pointer inline-flex items-center justify-center"
              title={showEmptyGrid ? 'Show Empty Table Grid' : 'Hide Empty Grid'}
              aria-label={showEmptyGrid ? 'Show Empty Table Grid' : 'Hide Empty Grid'}
            >
              {showEmptyGrid ? (
                <EyeOff className="w-4 h-4 text-slate-400" />
              ) : (
                <Eye className="w-4 h-4 text-slate-400" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area: Zero-Results Placeholder or Full Spreadsheet Matrix */}
      {hasZeroResults && !showEmptyGrid ? (
        <div className="py-12 px-6 text-center select-none bg-slate-50/40 dark:bg-slate-900/40">
          <div className="max-w-md mx-auto space-y-4">
            {/* Custom Aesthetic Vector Illustration */}
            <div className="relative inline-flex items-center justify-center">
              <svg
                className="w-32 h-32 text-slate-300 dark:text-slate-700"
                viewBox="0 0 120 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Decorative concentric dashed circles */}
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  className="text-emerald-200 dark:text-emerald-900/40"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="42"
                  fill="currentColor"
                  className="text-emerald-50/60 dark:text-emerald-950/20"
                />

                {/* Warehouse pallet base */}
                <path
                  d="M32 78L60 90L88 78L60 66L32 78Z"
                  fill="currentColor"
                  className="text-amber-100 dark:text-amber-950/40"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M32 78V84L60 96V90L32 78Z"
                  fill="currentColor"
                  className="text-amber-200 dark:text-amber-900/60"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M88 78V84L60 96V90L88 78Z"
                  fill="currentColor"
                  className="text-amber-300 dark:text-amber-900/80"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />

                {/* Left seed potato sack */}
                <path
                  d="M40 56C40 48 45 42 52 42C59 42 64 48 64 56C64 68 62 76 52 76C42 76 40 68 40 56Z"
                  fill="currentColor"
                  className="text-rose-100 dark:text-rose-950/40"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M48 42L48 40C48 38 56 38 56 40L56 42"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {/* Right seed potato sack */}
                <path
                  d="M58 54C58 46 63 40 70 40C77 40 82 46 82 54C82 66 80 74 70 74C60 74 58 66 58 54Z"
                  fill="currentColor"
                  className="text-sky-100 dark:text-sky-950/40"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
                <path
                  d="M66 40L66 38C66 36 74 36 74 38L74 40"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />

                {/* Subtle leaf accent */}
                <path
                  d="M60 30C66 26 70 28 72 32C68 34 64 34 60 30Z"
                  fill="currentColor"
                  className="text-emerald-400 dark:text-emerald-500"
                />
              </svg>

              {/* Zero Stock Badge */}
              <div className="absolute -bottom-1 -right-1 px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full shadow-xs flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[11px] font-black tracking-wider text-slate-700 dark:text-slate-300 uppercase">
                  - BAGS
                </span>
              </div>
            </div>

            {/* Title and Explanation */}
            <div>
              <h4 className="text-base font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                NO LIVE STOCK AVAILABLE
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 uppercase font-medium leading-relaxed">
                NO ACTIVE INVENTORY BATCHES FOUND FOR <span className="font-bold text-slate-700 dark:text-slate-300">{activeStorage}</span>.
                ALL STORED LOTS HAVE BEEN DISPATCHED OR NO RECEIPT HAS BEEN REGISTERED UNDER THIS SCOPE.
              </p>
            </div>

            {/* Action Bar to Restore View */}
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl shadow-xs transition-all hover:shadow-md cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESET ALL FILTERS</span>
              </button>

              <button
                onClick={() => setShowEmptyGrid(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors shadow-2xs cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                <span>VIEW EMPTY SPREADSHEET MATRIX</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Spreadsheet Matrix Canvas - Expanded width with slight margin as requested */
        <div className={`${densityStyles.canvasPadding} overflow-x-auto transition-all`}>
          <div className="w-full mx-auto">
            <table className="w-full border-collapse select-text">
              <thead>
                <tr className="border-b border-slate-300 dark:border-slate-700">
                  <th className={`${densityStyles.thCorner} p-2 text-left font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800`}>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-[10.5px] font-bold">ITEM / CATEGORY</span>
                    </div>
                  </th>
                  {matrixData.columns.map((col) => {
                    const colStyle = getVarietyColorStyle(col.key);
                    return (
                      <th
                        key={col.key}
                        className={`${densityStyles.thCol} text-center font-bold text-[10px] sm:text-[10.5px] uppercase tracking-wider border border-slate-300 dark:border-slate-700 ${colStyle.headerBg} ${colStyle.headerText}`}
                      >
                        {col.label.toUpperCase()}
                      </th>
                    );
                  })}
                  <th
                    className={`${densityStyles.thCol} text-center font-bold text-[10px] sm:text-[10.5px] uppercase tracking-wider border border-slate-300 dark:border-slate-700 ${totalColStyle.headerBg} ${totalColStyle.headerText}`}
                  >
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody>
                {matrixData.rows.map((row) => {
                  const isExpanded = expandedRowId === row.id;

                  // Gap row
                  if (row.type === 'gap') {
                    if (row.parentId && !expandedItemGroups.has(row.parentId)) {
                      return null;
                    }
                    return (
                      <tr key={row.id} className={densityStyles.gapHeight}>
                        <td colSpan={matrixData.columns.length + 2} className="p-0 border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40" />
                      </tr>
                    );
                  }

                  // Grand total row
                  if (row.type === 'grandtotal') {
                    return (
                      <React.Fragment key={row.id}>
                        <tr key={row.id} className="table-total-row pt-2 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition-colors">
                          <td
                            onClick={() => handleToggleRow(row.id, 'ALL')}
                            className={`${densityStyles.grandTotalLabel} text-left font-black text-slate-900 dark:text-white uppercase tracking-widest cursor-pointer select-none border border-slate-300 dark:border-slate-700`}
                            title="Click to view total inventory movement logs"
                          >
                            <div className="flex items-center gap-2">
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              ) : (
                                <ChevronDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              )}
                              <span>{row.label.toUpperCase()}</span>
                            </div>
                          </td>
                          {matrixData.columns.map((col) => {
                            const cellVal = row.values[col.key] || 0;
                            const colStyle = getVarietyColorStyle(col.key);
                            return (
                              <td
                                key={col.key}
                                onClick={() => handleToggleRow(row.id, col.key)}
                                className={`${densityStyles.grandTotalCellTd} text-center cursor-pointer border border-slate-300 dark:border-slate-700`}
                                title={`Click to view logs for ${col.label}`}
                              >
                                <span
                                  className={`${colStyle.grandTotalText} ${densityStyles.grandTotalCellBox} font-black uppercase`}
                                >
                                  {renderCellValue(cellVal)}
                                </span>
                              </td>
                            );
                          })}
                          <td
                            onClick={() => handleToggleRow(row.id, 'ALL')}
                            className={`${densityStyles.grandTotalCellTd} text-center cursor-pointer border border-slate-300 dark:border-slate-700`}
                            title="Click to view logs for all varieties"
                          >
                            <span
                              className={`${totalColStyle.grandTotalText} ${densityStyles.grandTotalCellBox} font-black uppercase`}
                            >
                              {renderCellValue(row.total)}
                            </span>
                          </td>
                        </tr>
                        {isExpanded && renderExpandedDrawer(row)}
                      </React.Fragment>
                    );
                  }

                  // Subtotal rows: Class Section Header (Pre-Foundation, Foundation, Certify, TLS)
                  if (row.type === 'subtotal') {
                    const isGroupUncollapsed = expandedItemGroups.has(row.id);
                    return (
                      <React.Fragment key={row.id}>
                        <tr
                          key={row.id}
                          className="hover:brightness-98 transition-colors"
                        >
                          <td
                            onClick={() => toggleGroupCollapse(row.id)}
                            className={`${densityStyles.subtotalLabel} text-left font-bold cursor-pointer select-none bg-[#eaf5e9] dark:bg-emerald-950/45 border border-slate-300 dark:border-slate-700`}
                            title={isGroupUncollapsed ? "Click to collapse grade rows" : "Click to expand grade rows"}
                          >
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => toggleGroupCollapse(row.id, e)}
                                className={`p-1 rounded transition-all cursor-pointer shrink-0 ${
                                  isGroupUncollapsed
                                    ? 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600'
                                }`}
                                title={isGroupUncollapsed ? "Collapse grades" : "Expand grades"}
                              >
                                <ChevronRight
                                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                    isGroupUncollapsed ? 'transform rotate-90 text-emerald-800 dark:text-emerald-200' : ''
                                  }`}
                                />
                              </button>
                              <span className="font-bold text-[10.5px] sm:text-[11px] text-[#0a3560] dark:text-sky-300 uppercase tracking-wide">
                                {row.label.toUpperCase()}
                              </span>
                            </div>
                          </td>
                          {matrixData.columns.map((col) => {
                            const cellVal = row.values[col.key] || 0;
                            const colStyle = getVarietyColorStyle(col.key);
                            return (
                              <td
                                key={col.key}
                                onClick={() => handleToggleRow(row.id, col.key)}
                                className={`${densityStyles.subtotalCell} text-center font-bold uppercase cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-slate-300 dark:border-slate-700 ${colStyle.subtotalText} bg-[#eaf5e9]/50 dark:bg-emerald-950/20`}
                                title={`Click to view logs for ${col.label}`}
                              >
                                {renderCellValue(cellVal)}
                              </td>
                            );
                          })}
                          <td
                            onClick={() => handleToggleRow(row.id, 'ALL')}
                            className={`${densityStyles.subtotalCell} text-center font-black uppercase cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-slate-300 dark:border-slate-700 ${totalColStyle.subtotalText} bg-[#eaf5e9]/50 dark:bg-emerald-950/20`}
                            title="Click to view logs for all varieties"
                          >
                            {renderCellValue(row.total)}
                          </td>
                        </tr>
                        {isExpanded && renderExpandedDrawer(row)}
                      </React.Fragment>
                    );
                  }

                  // Single item row (MINI TUBER, TABLE POTATO (TP), NON TRACEABLE WITH SR)
                  if (row.type === 'single') {
                    return (
                      <React.Fragment key={row.id}>
                        <tr key={row.id} className="hover:brightness-98 transition-colors">
                          <td
                            onClick={() => handleToggleRow(row.id, 'ALL')}
                            className={`${densityStyles.singleLabel} text-left font-bold cursor-pointer select-none bg-[#eaf5e9] dark:bg-emerald-950/45 border border-slate-300 dark:border-slate-700`}
                            title="Click to view logs"
                          >
                            <div className="flex items-center gap-2">
                              <div className="p-0.5 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 shadow-2xs text-slate-700 dark:text-slate-300 shrink-0">
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </div>
                              <span className="font-bold text-[10.5px] sm:text-[11px] text-[#0a3560] dark:text-sky-300 uppercase tracking-wide">
                                {row.label.toUpperCase()}
                              </span>
                            </div>
                          </td>
                          {matrixData.columns.map((col) => {
                            const cellVal = row.values[col.key] || 0;
                            const colStyle = getVarietyColorStyle(col.key);
                            return (
                              <td
                                key={col.key}
                                onClick={() => handleToggleRow(row.id, col.key)}
                                className={`${densityStyles.singleCell} text-center font-bold uppercase cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-slate-300 dark:border-slate-700 ${colStyle.subtotalText} bg-[#eaf5e9]/50 dark:bg-emerald-950/20`}
                                title={`Click to view logs for ${col.label}`}
                              >
                                {renderCellValue(cellVal)}
                              </td>
                            );
                          })}
                          <td
                            onClick={() => handleToggleRow(row.id, 'ALL')}
                            className={`${densityStyles.singleCell} text-center font-black uppercase cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors border border-slate-300 dark:border-slate-700 ${totalColStyle.subtotalText} bg-[#eaf5e9]/50 dark:bg-emerald-950/20`}
                            title="Click to view logs for all varieties"
                          >
                            {renderCellValue(row.total)}
                          </td>
                        </tr>
                        {isExpanded && renderExpandedDrawer(row)}
                      </React.Fragment>
                    );
                  }

                  // Standard Data Row inside Boxed Group (Certify A/B/US, Foundation A/B/US/OS, Pre-Foundation A/B/US, TLS A/B)
                  // Hidden when parent is collapsed (default state)
                  if (row.parentId && !expandedItemGroups.has(row.parentId)) {
                    return null;
                  }

                  return (
                    <React.Fragment key={row.id}>
                      <tr key={row.id} className="hover:bg-amber-50/40 dark:hover:bg-amber-950/20 transition-colors">
                        {/* Grade label boxed in warm yellow background and indented with continuous border */}
                        <td
                          onClick={() => handleToggleRow(row.id, 'ALL')}
                          className="py-1 px-2 text-left cursor-pointer select-none border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                          title="Click to expand batch history & movement logs"
                        >
                          <div className="pl-6 sm:pl-8 flex items-center gap-1.5">
                            <CornerDownRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                            <div className="flex-1 py-1 px-3 text-center rounded-sm border border-[#fde68a] dark:border-amber-700/70 bg-[#fff9e6] dark:bg-amber-950/40 shadow-2xs font-bold text-xs text-[#0a3560] dark:text-amber-200 uppercase tracking-wide">
                              {row.label.toUpperCase()}
                            </div>
                          </div>
                        </td>

                        {/* Variety Columns with Box Border Grids and Light Thematic Colors */}
                        {matrixData.columns.map((col) => {
                          const cellVal = row.values[col.key] || 0;
                          const colStyle = getVarietyColorStyle(col.key);
                          return (
                            <td
                              key={col.key}
                              onClick={() => handleToggleRow(row.id, col.key)}
                              className={`border border-slate-300 dark:border-slate-700 ${colStyle.cellBg} ${colStyle.cellText} ${densityStyles.regularCell} text-center font-semibold uppercase cursor-pointer hover:brightness-95 active:scale-95 transition-all`}
                              title={`Click to view batch history & movement logs for ${col.label}`}
                            >
                              {renderCellValue(cellVal)}
                            </td>
                          );
                        })}

                        {/* Row Total cell */}
                        <td
                          onClick={() => handleToggleRow(row.id, 'ALL')}
                          className={`border border-slate-300 dark:border-slate-700 ${totalColStyle.cellBg} ${totalColStyle.cellText} ${densityStyles.regularCell} text-center font-bold uppercase cursor-pointer hover:brightness-95 active:scale-95 transition-all`}
                          title="Click to view all batch logs for this category"
                        >
                          {renderCellValue(row.total)}
                        </td>
                      </tr>
                      {isExpanded && renderExpandedDrawer(row)}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Live Stock Matrix / Batch Detail Print Preview Modal */}
      <PrintPreviewModal
        isOpen={printModalState.isOpen}
        onClose={() => setPrintModalState((prev) => ({ ...prev, isOpen: false }))}
        documentTitle={printModalState.title}
        subtitle={printModalState.subtitle}
        columns={printModalState.columns}
        data={printModalState.data}
        summaryItems={printModalState.summaryItems}
      />
    </div>
  );
};
