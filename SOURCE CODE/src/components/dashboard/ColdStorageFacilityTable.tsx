import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TableDensity } from '../../types';
import {
  Building2,
  Download,
  FileText,
  Printer,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  X,
  Search,
  Layers,
  Sprout,
  CornerDownRight,
  Boxes,
} from 'lucide-react';
import { ColdStorageEmptyState } from '../coldStorage/ColdStorageEmptyState';
import { exportToExcel, exportToPdf, ExportColumn } from '../../utils/exportUtils';
import { PrintPreviewModal } from '../common/PrintPreviewModal';
import { SortIcon } from '../common/SortIcon';
import { getPotatoClassOrderRank, getGradeOrderRank } from '../../utils/stockEngine';

interface ColdStorageFacilityTableProps {
  onExportExcel?: () => void;
  onExportPdf?: () => void;
  onPrint?: () => void;
  density?: TableDensity;
}

// Visual color theme palettes for distinct cold storages
const COLD_STORAGE_ROW_PALETTE = [
  {
    bg: 'bg-sky-50/40 dark:bg-sky-950/20',
    hover: 'hover:bg-sky-100/75 dark:hover:bg-sky-900/50 hover:shadow-xs',
    highlight: 'bg-sky-100/90 dark:bg-sky-950/80 ring-1 ring-inset ring-sky-300 dark:ring-sky-700',
    borderLeft: 'border-l-[3px] border-l-sky-500',
    accentIndicator: 'bg-sky-500',
    badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/70 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
    remainingText: 'text-sky-700 dark:text-sky-300',
  },
  {
    bg: 'bg-emerald-50/40 dark:bg-emerald-950/20',
    hover: 'hover:bg-emerald-100/75 dark:hover:bg-emerald-900/50 hover:shadow-xs',
    highlight: 'bg-emerald-100/90 dark:bg-emerald-950/80 ring-1 ring-inset ring-emerald-300 dark:ring-emerald-700',
    borderLeft: 'border-l-[3px] border-l-emerald-500',
    accentIndicator: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    remainingText: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    bg: 'bg-amber-50/40 dark:bg-amber-950/20',
    hover: 'hover:bg-amber-100/75 dark:hover:bg-amber-900/50 hover:shadow-xs',
    highlight: 'bg-amber-100/90 dark:bg-amber-950/80 ring-1 ring-inset ring-amber-300 dark:ring-amber-700',
    borderLeft: 'border-l-[3px] border-l-amber-500',
    accentIndicator: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    remainingText: 'text-amber-700 dark:text-amber-300',
  },
  {
    bg: 'bg-purple-50/40 dark:bg-purple-950/20',
    hover: 'hover:bg-purple-100/75 dark:hover:bg-purple-900/50 hover:shadow-xs',
    highlight: 'bg-purple-100/90 dark:bg-purple-950/80 ring-1 ring-inset ring-purple-300 dark:ring-purple-700',
    borderLeft: 'border-l-[3px] border-l-purple-500',
    accentIndicator: 'bg-purple-500',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
    remainingText: 'text-purple-700 dark:text-purple-300',
  },
  {
    bg: 'bg-rose-50/40 dark:bg-rose-950/20',
    hover: 'hover:bg-rose-100/75 dark:hover:bg-rose-900/50 hover:shadow-xs',
    highlight: 'bg-rose-100/90 dark:bg-rose-950/80 ring-1 ring-inset ring-rose-300 dark:ring-rose-700',
    borderLeft: 'border-l-[3px] border-l-rose-500',
    accentIndicator: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
    remainingText: 'text-rose-700 dark:text-rose-300',
  },
  {
    bg: 'bg-teal-50/40 dark:bg-teal-950/20',
    hover: 'hover:bg-teal-100/75 dark:hover:bg-teal-900/50 hover:shadow-xs',
    highlight: 'bg-teal-100/90 dark:bg-teal-950/80 ring-1 ring-inset ring-teal-300 dark:ring-teal-700',
    borderLeft: 'border-l-[3px] border-l-teal-500',
    accentIndicator: 'bg-teal-500',
    badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/70 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
    remainingText: 'text-teal-700 dark:text-teal-300',
  },
];

// Visual color theme palettes for distinct potato varieties / items in Item-Wise View
const ITEM_ROW_PALETTES = [
  {
    bg: 'bg-rose-50/40 dark:bg-rose-950/20',
    hover: 'hover:bg-rose-100/75 dark:hover:bg-rose-900/50 hover:shadow-xs',
    highlight: 'bg-rose-100/90 dark:bg-rose-950/80 ring-1 ring-inset ring-rose-300 dark:ring-rose-700',
    borderLeft: 'border-l-[3px] border-l-rose-500',
    accentIndicator: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800',
    remainingText: 'text-rose-700 dark:text-rose-300',
  },
  {
    bg: 'bg-sky-50/40 dark:bg-sky-950/20',
    hover: 'hover:bg-sky-100/75 dark:hover:bg-sky-900/50 hover:shadow-xs',
    highlight: 'bg-sky-100/90 dark:bg-sky-950/80 ring-1 ring-inset ring-sky-300 dark:ring-sky-700',
    borderLeft: 'border-l-[3px] border-l-sky-500',
    accentIndicator: 'bg-sky-500',
    badge: 'bg-sky-100 text-sky-800 dark:bg-sky-900/70 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
    remainingText: 'text-sky-700 dark:text-sky-300',
  },
  {
    bg: 'bg-amber-50/40 dark:bg-amber-950/20',
    hover: 'hover:bg-amber-100/75 dark:hover:bg-amber-900/50 hover:shadow-xs',
    highlight: 'bg-amber-100/90 dark:bg-amber-950/80 ring-1 ring-inset ring-amber-300 dark:ring-amber-700',
    borderLeft: 'border-l-[3px] border-l-amber-500',
    accentIndicator: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/70 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    remainingText: 'text-amber-700 dark:text-amber-300',
  },
  {
    bg: 'bg-orange-50/40 dark:bg-orange-950/20',
    hover: 'hover:bg-orange-100/75 dark:hover:bg-orange-900/50 hover:shadow-xs',
    highlight: 'bg-orange-100/90 dark:bg-orange-950/80 ring-1 ring-inset ring-orange-300 dark:ring-orange-700',
    borderLeft: 'border-l-[3px] border-l-orange-500',
    accentIndicator: 'bg-orange-500',
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/70 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
    remainingText: 'text-orange-700 dark:text-orange-300',
  },
  {
    bg: 'bg-purple-50/40 dark:bg-purple-950/20',
    hover: 'hover:bg-purple-100/75 dark:hover:bg-purple-900/50 hover:shadow-xs',
    highlight: 'bg-purple-100/90 dark:bg-purple-950/80 ring-1 ring-inset ring-purple-300 dark:ring-purple-700',
    borderLeft: 'border-l-[3px] border-l-purple-500',
    accentIndicator: 'bg-purple-500',
    badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
    remainingText: 'text-purple-700 dark:text-purple-300',
  },
  {
    bg: 'bg-emerald-50/40 dark:bg-emerald-950/20',
    hover: 'hover:bg-emerald-100/75 dark:hover:bg-emerald-900/50 hover:shadow-xs',
    highlight: 'bg-emerald-100/90 dark:bg-emerald-950/80 ring-1 ring-inset ring-emerald-300 dark:ring-emerald-700',
    borderLeft: 'border-l-[3px] border-l-emerald-500',
    accentIndicator: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    remainingText: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    bg: 'bg-pink-50/40 dark:bg-pink-950/20',
    hover: 'hover:bg-pink-100/75 dark:hover:bg-pink-900/50 hover:shadow-xs',
    highlight: 'bg-pink-100/90 dark:bg-pink-950/80 ring-1 ring-inset ring-pink-300 dark:ring-pink-700',
    borderLeft: 'border-l-[3px] border-l-pink-500',
    accentIndicator: 'bg-pink-500',
    badge: 'bg-pink-100 text-pink-800 dark:bg-pink-900/70 dark:text-pink-300 border border-pink-200 dark:border-pink-800',
    remainingText: 'text-pink-700 dark:text-pink-300',
  },
  {
    bg: 'bg-teal-50/40 dark:bg-teal-950/20',
    hover: 'hover:bg-teal-100/75 dark:hover:bg-teal-900/50 hover:shadow-xs',
    highlight: 'bg-teal-100/90 dark:bg-teal-950/80 ring-1 ring-inset ring-teal-300 dark:ring-teal-700',
    borderLeft: 'border-l-[3px] border-l-teal-500',
    accentIndicator: 'bg-teal-500',
    badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/70 dark:text-teal-300 border border-teal-200 dark:border-teal-800',
    remainingText: 'text-teal-700 dark:text-teal-300',
  },
];

const getItemPalette = (name: string, index: number) => {
  const n = name.toUpperCase();
  if (n.includes('ASTERIX')) return ITEM_ROW_PALETTES[0];
  if (n.includes('DIAMANT')) return ITEM_ROW_PALETTES[1];
  if (n.includes('GRANOLA')) return ITEM_ROW_PALETTES[2];
  if (n.includes('SUN') || n.includes('SHINE')) return ITEM_ROW_PALETTES[3];
  if (n.includes('CARDINAL')) return ITEM_ROW_PALETTES[4];
  if (n.includes('COURAGE')) return ITEM_ROW_PALETTES[5];
  if (n.includes('ROSETTA') || n.includes('LADY')) return ITEM_ROW_PALETTES[6];
  return ITEM_ROW_PALETTES[index % ITEM_ROW_PALETTES.length];
};

interface GradeNode {
  id: string;
  gradeId: string;
  name: string;
  code?: string;
  stockInKg: number;
  stockOutKg: number;
  remainingBag: number;
  remainingKg: number;
  remainingMt: number;
  stockIn: number;
  stockOut: number;
  closingStock: number;
  occupancy: number;
}

interface ClassNode {
  id: string;
  classId: string;
  name: string;
  code?: string;
  stockInKg: number;
  stockOutKg: number;
  remainingBag: number;
  remainingKg: number;
  remainingMt: number;
  stockIn: number;
  stockOut: number;
  closingStock: number;
  occupancy: number;
  grades: GradeNode[];
}

interface VarietyNode {
  id: string;
  varietyId: string;
  name: string;
  code?: string;
  stockInKg: number;
  stockOutKg: number;
  remainingBag: number;
  remainingKg: number;
  remainingMt: number;
  stockIn: number;
  stockOut: number;
  closingStock: number;
  occupancy: number;
  classes: ClassNode[];
}

interface StorageNode {
  id: string;
  code: string;
  name: string;
  location: string;
  capacity: number;
  stockInKg: number;
  stockOutKg: number;
  remainingBag: number;
  remainingKg: number;
  remainingMt: number;
  stockIn: number;
  stockOut: number;
  closingStock: number;
  occupancy: number;
  varieties: VarietyNode[];
}

export const ColdStorageFacilityTable: React.FC<ColdStorageFacilityTableProps> = ({
  density = 'compact',
}) => {
  const {
    coldStorages,
    stockTransactions,
    deliveryTransactions,
    varieties,
    seedClasses,
    grades,
    companySettings,
    currentUser,
    addToast,
  } = useApp();

  // Mode: store-wise (default) or item-wise
  const [summaryViewMode, setSummaryViewMode] = useState<'store-wise' | 'item-wise'>('store-wise');

  // Expanded keys set for hierarchical tree rows
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Row highlight state
  const [highlightedRowId, setHighlightedRowId] = useState<string | null>(null);

  // Sorting state
  const [sortField, setSortField] = useState<
    'name' | 'stockIn' | 'stockOut' | 'closingStock' | 'occupancy' | 'stockInKg' | 'stockOutKg' | 'remainingBag' | 'remainingKg' | 'remainingMt'
  >('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Modal state for Print Preview
  const [printModalConfig, setPrintModalConfig] = useState<{
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

  const handleSort = (
    field:
      | 'name'
      | 'stockIn'
      | 'stockOut'
      | 'closingStock'
      | 'occupancy'
      | 'stockInKg'
      | 'stockOutKg'
      | 'remainingBag'
      | 'remainingKg'
      | 'remainingMt'
  ) => {
    if (sortField === field) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const toggleKey = (key: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Reset to default dashboard collapsed state
  const handleResetToDefault = () => {
    setExpandedKeys(new Set());
    setSearchQuery('');
    setSortField('name');
    setSortDir('asc');
    setSummaryViewMode('store-wise');
    setHighlightedRowId(null);
    addToast('Summary view reset to default collapsed state.', 'info');
  };

  // Helper to format grade display name (e.g. "Pre-Foundation A", "Foundation US", "TLS (A)")
  const formatGradeDisplayName = (className: string, gradeName: string, gradeCode?: string): string => {
    if (!gradeName || gradeName === '-' || gradeName === 'Standard') return 'Standard Grade';
    if (gradeName.toLowerCase().startsWith(className.toLowerCase())) {
      return gradeName;
    }
    const cleanCls = className.trim();
    const gLower = gradeName.toLowerCase();
    let suffix = gradeCode || '';
    if (!suffix) {
      if (gLower.includes('grade a')) suffix = 'A';
      else if (gLower.includes('grade b')) suffix = 'B';
      else if (gLower.includes('under size') || gLower.includes('us')) suffix = 'US';
      else if (gLower.includes('over size') || gLower.includes('os')) suffix = 'OS';
      else if (gLower.includes('table potato') || gLower.includes('tp')) suffix = '(TP)';
      else suffix = gradeName;
    }
    if (suffix.startsWith('(')) {
      return `${cleanCls} ${suffix}`;
    }
    return `${cleanCls} ${suffix}`;
  };

  // Build Store-Wise Data tree
  const storeWiseData = useMemo<StorageNode[]>(() => {
    type InOut = { inBags: number; outBags: number; inKg: number; outKg: number };
    const tree = new Map<string, Map<string, Map<string, Map<string, InOut>>>>();

    const getLeaf = (csId: string, vId: string, cId: string, gId: string): InOut => {
      if (!tree.has(csId)) tree.set(csId, new Map());
      const csMap = tree.get(csId)!;
      if (!csMap.has(vId)) csMap.set(vId, new Map());
      const vMap = csMap.get(vId)!;
      if (!vMap.has(cId)) vMap.set(cId, new Map());
      const cMap = vMap.get(cId)!;
      if (!cMap.has(gId)) cMap.set(gId, { inBags: 0, outBags: 0, inKg: 0, outKg: 0 });
      return cMap.get(gId)!;
    };

    // Stock in (approved)
    stockTransactions.forEach((s) => {
      if (s.status === 'approved') {
        const leaf = getLeaf(
          s.coldStorageId,
          s.varietyId,
          s.classId || 'default-class',
          s.gradeId || 'default-grade'
        );
        const kg = s.totalKg || (s.sackQuantity * (s.kgPerBag || 50));
        leaf.inBags += s.sackQuantity;
        leaf.inKg += kg;
      }
    });

    // Stock out (approved or completed)
    deliveryTransactions.forEach((d) => {
      if (d.status === 'approved' || d.status === 'completed') {
        const leaf = getLeaf(
          d.coldStorageId,
          d.varietyId,
          d.classId || 'default-class',
          d.gradeId || 'default-grade'
        );
        const kg = d.totalKg || (d.sackQuantity * (d.kgPerBag || 50));
        leaf.outBags += d.sackQuantity;
        leaf.outKg += kg;
      }
    });

    return coldStorages.map((cs) => {
      const csMap = tree.get(cs.id) || new Map();
      const varietyNodes: VarietyNode[] = [];

      for (const [vId, cMap] of csMap.entries()) {
        const vInfo = varieties.find((v) => v.id === vId);
        const vName = vInfo?.name || 'Unknown Variety';
        const classNodes: ClassNode[] = [];

        for (const [cId, gMap] of cMap.entries()) {
          const cInfo = seedClasses.find((c) => c.id === cId);
          const cName = cInfo?.name || 'Standard';
          const gradeNodes: GradeNode[] = [];

          for (const [gId, inOut] of gMap.entries()) {
            const gInfo = grades.find((g) => g.id === gId);
            const gRawName = gInfo?.name || 'Grade A';
            const gName = formatGradeDisplayName(cName, gRawName, gInfo?.code);
            const remainingBag = Math.max(0, inOut.inBags - inOut.outBags);
            const remainingKg = Math.max(0, inOut.inKg - inOut.outKg);
            const remainingMt = Number((remainingKg / 1000).toFixed(2));
            const occupancy = inOut.inBags > 0 ? (remainingBag / inOut.inBags) * 100 : 0;

            gradeNodes.push({
              id: `${cs.id}_${vId}_${cId}_${gId}`,
              gradeId: gId,
              name: gName,
              code: gInfo?.code,
              stockInKg: inOut.inKg,
              stockOutKg: inOut.outKg,
              remainingBag,
              remainingKg,
              remainingMt,
              stockIn: inOut.inKg,
              stockOut: inOut.outKg,
              closingStock: remainingBag,
              occupancy,
            });
          }

          gradeNodes.sort((a, b) => {
            const rankA = getGradeOrderRank(a.name, a.code);
            const rankB = getGradeOrderRank(b.name, b.code);
            if (rankA !== rankB) return rankA - rankB;
            return a.name.localeCompare(b.name);
          });

          const classStockInKg = gradeNodes.reduce((sum, g) => sum + g.stockInKg, 0);
          const classStockOutKg = gradeNodes.reduce((sum, g) => sum + g.stockOutKg, 0);
          const classRemainingBag = gradeNodes.reduce((sum, g) => sum + g.remainingBag, 0);
          const classRemainingKg = Math.max(0, classStockInKg - classStockOutKg);
          const classRemainingMt = Number((classRemainingKg / 1000).toFixed(2));
          const classOccupancy = classStockInKg > 0 ? (classRemainingKg / classStockInKg) * 100 : 0;

          classNodes.push({
            id: `${cs.id}_${vId}_${cId}`,
            classId: cId,
            name: cName,
            code: cInfo?.code,
            stockInKg: classStockInKg,
            stockOutKg: classStockOutKg,
            remainingBag: classRemainingBag,
            remainingKg: classRemainingKg,
            remainingMt: classRemainingMt,
            stockIn: classStockInKg,
            stockOut: classStockOutKg,
            closingStock: classRemainingBag,
            occupancy: classOccupancy,
            grades: gradeNodes,
          });
        }

        classNodes.sort((a, b) => {
          const rankA = getPotatoClassOrderRank(a.name, a.code);
          const rankB = getPotatoClassOrderRank(b.name, b.code);
          if (rankA !== rankB) return rankA - rankB;
          return a.name.localeCompare(b.name);
        });

        const varStockInKg = classNodes.reduce((sum, c) => sum + c.stockInKg, 0);
        const varStockOutKg = classNodes.reduce((sum, c) => sum + c.stockOutKg, 0);
        const varRemainingBag = classNodes.reduce((sum, c) => sum + c.remainingBag, 0);
        const varRemainingKg = Math.max(0, varStockInKg - varStockOutKg);
        const varRemainingMt = Number((varRemainingKg / 1000).toFixed(2));
        const varOccupancy = varStockInKg > 0 ? (varRemainingKg / varStockInKg) * 100 : 0;

        varietyNodes.push({
          id: `${cs.id}_${vId}`,
          varietyId: vId,
          name: vName,
          code: vInfo?.code,
          stockInKg: varStockInKg,
          stockOutKg: varStockOutKg,
          remainingBag: varRemainingBag,
          remainingKg: varRemainingKg,
          remainingMt: varRemainingMt,
          stockIn: varStockInKg,
          stockOut: varStockOutKg,
          closingStock: varRemainingBag,
          occupancy: varOccupancy,
          classes: classNodes,
        });
      }

      varietyNodes.sort((a, b) => a.name.localeCompare(b.name));

      const csStockInKg = varietyNodes.reduce((sum, v) => sum + v.stockInKg, 0);
      const csStockOutKg = varietyNodes.reduce((sum, v) => sum + v.stockOutKg, 0);
      const csRemainingBag = varietyNodes.reduce((sum, v) => sum + v.remainingBag, 0);
      const csRemainingKg = Math.max(0, csStockInKg - csStockOutKg);
      const csRemainingMt = Number((csRemainingKg / 1000).toFixed(2));
      const csOccupancy =
        cs.capacity > 0
          ? (csRemainingBag / cs.capacity) * 100
          : csStockInKg > 0
          ? (csRemainingKg / csStockInKg) * 100
          : 0;

      return {
        id: cs.id,
        code: cs.code,
        name: cs.name,
        location: cs.location || '-',
        capacity: cs.capacity || 0,
        stockInKg: csStockInKg,
        stockOutKg: csStockOutKg,
        remainingBag: csRemainingBag,
        remainingKg: csRemainingKg,
        remainingMt: csRemainingMt,
        stockIn: csStockInKg,
        stockOut: csStockOutKg,
        closingStock: csRemainingBag,
        occupancy: csOccupancy,
        varieties: varietyNodes,
      };
    });
  }, [coldStorages, stockTransactions, deliveryTransactions, varieties, seedClasses, grades]);

  // Build Item-Wise Data tree (aggregated across all cold storages)
  const itemWiseData = useMemo<VarietyNode[]>(() => {
    type InOut = { inBags: number; outBags: number; inKg: number; outKg: number };
    const tree = new Map<string, Map<string, Map<string, InOut>>>();

    const getLeaf = (vId: string, cId: string, gId: string): InOut => {
      if (!tree.has(vId)) tree.set(vId, new Map());
      const vMap = tree.get(vId)!;
      if (!vMap.has(cId)) vMap.set(cId, new Map());
      const cMap = vMap.get(cId)!;
      if (!cMap.has(gId)) cMap.set(gId, { inBags: 0, outBags: 0, inKg: 0, outKg: 0 });
      return cMap.get(gId)!;
    };

    stockTransactions.forEach((s) => {
      if (s.status === 'approved') {
        const leaf = getLeaf(
          s.varietyId,
          s.classId || 'default-class',
          s.gradeId || 'default-grade'
        );
        const kg = s.totalKg || (s.sackQuantity * (s.kgPerBag || 50));
        leaf.inBags += s.sackQuantity;
        leaf.inKg += kg;
      }
    });

    deliveryTransactions.forEach((d) => {
      if (d.status === 'approved' || d.status === 'completed') {
        const leaf = getLeaf(
          d.varietyId,
          d.classId || 'default-class',
          d.gradeId || 'default-grade'
        );
        const kg = d.totalKg || (d.sackQuantity * (d.kgPerBag || 50));
        leaf.outBags += d.sackQuantity;
        leaf.outKg += kg;
      }
    });

    varieties.forEach((v) => {
      if (!tree.has(v.id)) {
        tree.set(v.id, new Map());
      }
    });

    const result: VarietyNode[] = [];

    for (const [vId, cMap] of tree.entries()) {
      const vInfo = varieties.find((v) => v.id === vId);
      const vName = vInfo?.name || 'Unknown Variety';
      const classNodes: ClassNode[] = [];

      for (const [cId, gMap] of cMap.entries()) {
        const cInfo = seedClasses.find((c) => c.id === cId);
        const cName = cInfo?.name || 'Standard';
        const gradeNodes: GradeNode[] = [];

        for (const [gId, inOut] of gMap.entries()) {
          const gInfo = grades.find((g) => g.id === gId);
          const gRawName = gInfo?.name || 'Grade A';
          const gName = formatGradeDisplayName(cName, gRawName, gInfo?.code);
          const remainingBag = Math.max(0, inOut.inBags - inOut.outBags);
          const remainingKg = Math.max(0, inOut.inKg - inOut.outKg);
          const remainingMt = Number((remainingKg / 1000).toFixed(2));
          const occupancy = inOut.inBags > 0 ? (remainingBag / inOut.inBags) * 100 : 0;

          gradeNodes.push({
            id: `item_${vId}_${cId}_${gId}`,
            gradeId: gId,
            name: gName,
            code: gInfo?.code,
            stockInKg: inOut.inKg,
            stockOutKg: inOut.outKg,
            remainingBag,
            remainingKg,
            remainingMt,
            stockIn: inOut.inKg,
            stockOut: inOut.outKg,
            closingStock: remainingBag,
            occupancy,
          });
        }

        gradeNodes.sort((a, b) => {
          const rankA = getGradeOrderRank(a.name, a.code);
          const rankB = getGradeOrderRank(b.name, b.code);
          if (rankA !== rankB) return rankA - rankB;
          return a.name.localeCompare(b.name);
        });

        const classStockInKg = gradeNodes.reduce((sum, g) => sum + g.stockInKg, 0);
        const classStockOutKg = gradeNodes.reduce((sum, g) => sum + g.stockOutKg, 0);
        const classRemainingBag = gradeNodes.reduce((sum, g) => sum + g.remainingBag, 0);
        const classRemainingKg = Math.max(0, classStockInKg - classStockOutKg);
        const classRemainingMt = Number((classRemainingKg / 1000).toFixed(2));
        const classOccupancy = classStockInKg > 0 ? (classRemainingKg / classStockInKg) * 100 : 0;

        classNodes.push({
          id: `item_${vId}_${cId}`,
          classId: cId,
          name: cName,
          code: cInfo?.code,
          stockInKg: classStockInKg,
          stockOutKg: classStockOutKg,
          remainingBag: classRemainingBag,
          remainingKg: classRemainingKg,
          remainingMt: classRemainingMt,
          stockIn: classStockInKg,
          stockOut: classStockOutKg,
          closingStock: classRemainingBag,
          occupancy: classOccupancy,
          grades: gradeNodes,
        });
      }

      classNodes.sort((a, b) => {
        const rankA = getPotatoClassOrderRank(a.name, a.code);
        const rankB = getPotatoClassOrderRank(b.name, b.code);
        if (rankA !== rankB) return rankA - rankB;
        return a.name.localeCompare(b.name);
      });

      const varStockInKg = classNodes.reduce((sum, c) => sum + c.stockInKg, 0);
      const varStockOutKg = classNodes.reduce((sum, c) => sum + c.stockOutKg, 0);
      const varRemainingBag = classNodes.reduce((sum, c) => sum + c.remainingBag, 0);
      const varRemainingKg = Math.max(0, varStockInKg - varStockOutKg);
      const varRemainingMt = Number((varRemainingKg / 1000).toFixed(2));
      const varOccupancy = varStockInKg > 0 ? (varRemainingKg / varStockInKg) * 100 : 0;

      result.push({
        id: `item_${vId}`,
        varietyId: vId,
        name: vName,
        code: vInfo?.code,
        stockInKg: varStockInKg,
        stockOutKg: varStockOutKg,
        remainingBag: varRemainingBag,
        remainingKg: varRemainingKg,
        remainingMt: varRemainingMt,
        stockIn: varStockInKg,
        stockOut: varStockOutKg,
        closingStock: varRemainingBag,
        occupancy: varOccupancy,
        classes: classNodes,
      });
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [varieties, seedClasses, grades, stockTransactions, deliveryTransactions]);

  // Overall totals calculation
  const overallTotals = useMemo(() => {
    let totalStockInKg = 0;
    let totalStockOutKg = 0;
    let totalRemainingBag = 0;
    let totalRemainingKg = 0;

    if (summaryViewMode === 'store-wise') {
      storeWiseData.forEach((cs) => {
        totalStockInKg += cs.stockInKg;
        totalStockOutKg += cs.stockOutKg;
        totalRemainingBag += cs.remainingBag;
        totalRemainingKg += cs.remainingKg;
      });
    } else {
      itemWiseData.forEach((v) => {
        totalStockInKg += v.stockInKg;
        totalStockOutKg += v.stockOutKg;
        totalRemainingBag += v.remainingBag;
        totalRemainingKg += v.remainingKg;
      });
    }

    const totalRemainingMt = Number((totalRemainingKg / 1000).toFixed(2));
    const overallOccupancy = totalStockInKg > 0 ? (totalRemainingKg / totalStockInKg) * 100 : 0;

    return {
      totalStockInKg,
      totalStockOutKg,
      totalRemainingBag,
      totalRemainingKg,
      totalRemainingMt,
      overallOccupancy,
      // Backward compatibility aliases
      totalStockIn: totalStockInKg,
      totalStockOut: totalStockOutKg,
      totalClosing: totalRemainingBag,
    };
  }, [summaryViewMode, storeWiseData, itemWiseData]);

  // Sorting
  const sortedStoreWiseData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = q
      ? storeWiseData.filter(
          (cs) =>
            cs.name.toLowerCase().includes(q) ||
            cs.code.toLowerCase().includes(q) ||
            cs.varieties.some(
              (v) =>
                v.name.toLowerCase().includes(q) ||
                v.classes.some((c) => c.name.toLowerCase().includes(q) || c.grades.some((g) => g.name.toLowerCase().includes(q)))
            )
        )
      : storeWiseData;

    return [...filtered].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [storeWiseData, searchQuery, sortField, sortDir]);

  const sortedItemWiseData = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const filtered = q
      ? itemWiseData.filter(
          (v) =>
            v.name.toLowerCase().includes(q) ||
            v.classes.some((c) => c.name.toLowerCase().includes(q) || c.grades.some((g) => g.name.toLowerCase().includes(q)))
        )
      : itemWiseData;

    return [...filtered].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];
      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }
      if (valA < valB) return sortDir === 'asc' ? -1 : 1;
      if (valA > valB) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [itemWiseData, searchQuery, sortField, sortDir]);

  // Check if all rows are currently expanded
  const isAllExpanded = useMemo(() => {
    if (expandedKeys.size === 0) return false;
    if (summaryViewMode === 'store-wise') {
      return storeWiseData.every((cs) => expandedKeys.has(`cs_${cs.id}`));
    }
    return itemWiseData.every((v) => expandedKeys.has(`v_${v.varietyId}`));
  }, [expandedKeys, summaryViewMode, storeWiseData, itemWiseData]);

  // Toggle all expand/collapse
  const toggleAllExpanded = () => {
    if (isAllExpanded || expandedKeys.size > 0) {
      setExpandedKeys(new Set());
    } else {
      const next = new Set<string>();
      if (summaryViewMode === 'store-wise') {
        storeWiseData.forEach((cs) => {
          next.add(`cs_${cs.id}`);
          cs.varieties.forEach((v) => {
            next.add(`v_${cs.id}_${v.varietyId}`);
            v.classes.forEach((c) => {
              next.add(`c_${cs.id}_${v.varietyId}_${c.classId}`);
            });
          });
        });
      } else {
        itemWiseData.forEach((v) => {
          next.add(`v_${v.varietyId}`);
          v.classes.forEach((c) => {
            next.add(`c_${v.varietyId}_${c.classId}`);
          });
        });
      }
      setExpandedKeys(next);
    }
  };

  // Occupancy badge color helper
  const getOccupancyBadgeColor = (pct: number) => {
    if (pct >= 90) {
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800';
    }
    if (pct >= 70) {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800';
    }
    if (pct >= 40) {
      return 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300 border border-sky-300 dark:border-sky-800';
    }
    return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800';
  };

  // Extract exactly the visible rows based on CURRENT collapse/expand state for export
  const getVisibleExportRows = (isPdfOrPrint: boolean = false) => {
    const isStoreWise = summaryViewMode === 'store-wise';
    const exportRows: Record<string, any>[] = [];

    if (isStoreWise) {
      sortedStoreWiseData.forEach((cs) => {
        const isCsExpanded = expandedKeys.has(`cs_${cs.id}`);
        exportRows.push({
          itemName: cs.name,
          level: 'Facility',
          stockInKg: isPdfOrPrint ? cs.stockInKg.toLocaleString() : cs.stockInKg,
          stockOutKg: isPdfOrPrint ? cs.stockOutKg.toLocaleString() : cs.stockOutKg,
          remainingBag: isPdfOrPrint ? cs.remainingBag.toLocaleString() : cs.remainingBag,
          remainingKg: isPdfOrPrint ? cs.remainingKg.toLocaleString() : cs.remainingKg,
          remainingMt: isPdfOrPrint ? cs.remainingMt.toFixed(2) : cs.remainingMt,
          occupancy: `${cs.occupancy.toFixed(1)}%`,
        });

        if (isCsExpanded) {
          cs.varieties.forEach((v) => {
            const isVarExpanded = expandedKeys.has(`v_${cs.id}_${v.varietyId}`);
            exportRows.push({
              itemName: `  • ${v.name.toUpperCase()}`,
              level: 'Variety',
              stockInKg: isPdfOrPrint ? v.stockInKg.toLocaleString() : v.stockInKg,
              stockOutKg: isPdfOrPrint ? v.stockOutKg.toLocaleString() : v.stockOutKg,
              remainingBag: isPdfOrPrint ? v.remainingBag.toLocaleString() : v.remainingBag,
              remainingKg: isPdfOrPrint ? v.remainingKg.toLocaleString() : v.remainingKg,
              remainingMt: isPdfOrPrint ? v.remainingMt.toFixed(2) : v.remainingMt,
              occupancy: `${v.occupancy.toFixed(1)}%`,
            });

            if (isVarExpanded) {
              v.classes.forEach((c) => {
                const isClassExpanded = expandedKeys.has(`c_${cs.id}_${v.varietyId}_${c.classId}`);
                exportRows.push({
                  itemName: `    - TOTAL ${c.name.toUpperCase()}`,
                  level: 'Class',
                  stockInKg: isPdfOrPrint ? c.stockInKg.toLocaleString() : c.stockInKg,
                  stockOutKg: isPdfOrPrint ? c.stockOutKg.toLocaleString() : c.stockOutKg,
                  remainingBag: isPdfOrPrint ? c.remainingBag.toLocaleString() : c.remainingBag,
                  remainingKg: isPdfOrPrint ? c.remainingKg.toLocaleString() : c.remainingKg,
                  remainingMt: isPdfOrPrint ? c.remainingMt.toFixed(2) : c.remainingMt,
                  occupancy: `${c.occupancy.toFixed(1)}%`,
                });

                if (isClassExpanded) {
                  c.grades.forEach((g) => {
                    exportRows.push({
                      itemName: `      ↳ ${g.name}`,
                      level: 'Grade',
                      stockInKg: isPdfOrPrint ? g.stockInKg.toLocaleString() : g.stockInKg,
                      stockOutKg: isPdfOrPrint ? g.stockOutKg.toLocaleString() : g.stockOutKg,
                      remainingBag: isPdfOrPrint ? g.remainingBag.toLocaleString() : g.remainingBag,
                      remainingKg: isPdfOrPrint ? g.remainingKg.toLocaleString() : g.remainingKg,
                      remainingMt: isPdfOrPrint ? g.remainingMt.toFixed(2) : g.remainingMt,
                      occupancy: `${g.occupancy.toFixed(1)}%`,
                    });
                  });
                }
              });
            }
          });
        }
      });
    } else {
      // Item-Wise View
      sortedItemWiseData.forEach((v) => {
        const isVarExpanded = expandedKeys.has(`v_${v.varietyId}`);
        exportRows.push({
          itemName: v.name.toUpperCase(),
          level: 'Variety',
          stockInKg: isPdfOrPrint ? v.stockInKg.toLocaleString() : v.stockInKg,
          stockOutKg: isPdfOrPrint ? v.stockOutKg.toLocaleString() : v.stockOutKg,
          remainingBag: isPdfOrPrint ? v.remainingBag.toLocaleString() : v.remainingBag,
          remainingKg: isPdfOrPrint ? v.remainingKg.toLocaleString() : v.remainingKg,
          remainingMt: isPdfOrPrint ? v.remainingMt.toFixed(2) : v.remainingMt,
          occupancy: `${v.occupancy.toFixed(1)}%`,
        });

        if (isVarExpanded) {
          v.classes.forEach((c) => {
            const isClassExpanded = expandedKeys.has(`c_${v.varietyId}_${c.classId}`);
            exportRows.push({
              itemName: `  - TOTAL ${c.name.toUpperCase()}`,
              level: 'Class',
              stockInKg: isPdfOrPrint ? c.stockInKg.toLocaleString() : c.stockInKg,
              stockOutKg: isPdfOrPrint ? c.stockOutKg.toLocaleString() : c.stockOutKg,
              remainingBag: isPdfOrPrint ? c.remainingBag.toLocaleString() : c.remainingBag,
              remainingKg: isPdfOrPrint ? c.remainingKg.toLocaleString() : c.remainingKg,
              remainingMt: isPdfOrPrint ? c.remainingMt.toFixed(2) : c.remainingMt,
              occupancy: `${c.occupancy.toFixed(1)}%`,
            });

            if (isClassExpanded) {
              c.grades.forEach((g) => {
                exportRows.push({
                  itemName: `    ↳ ${g.name}`,
                  level: 'Grade',
                  stockInKg: isPdfOrPrint ? g.stockInKg.toLocaleString() : g.stockInKg,
                  stockOutKg: isPdfOrPrint ? g.stockOutKg.toLocaleString() : g.stockOutKg,
                  remainingBag: isPdfOrPrint ? g.remainingBag.toLocaleString() : g.remainingBag,
                  remainingKg: isPdfOrPrint ? g.remainingKg.toLocaleString() : g.remainingKg,
                  remainingMt: isPdfOrPrint ? g.remainingMt.toFixed(2) : g.remainingMt,
                  occupancy: `${g.occupancy.toFixed(1)}%`,
                });
              });
            }
          });
        }
      });
    }

    return exportRows;
  };

  // Export to Excel based on current collapse/expand state
  const handleExportTableExcel = async () => {
    const isStoreWise = summaryViewMode === 'store-wise';
    const exportColumns: ExportColumn[] = [
      { header: isStoreWise ? 'COLD STORAGE / ITEM' : 'ITEM / VARIETY / CLASS / GRADE', key: 'itemName', width: 34 },
      { header: 'LEVEL', key: 'level', width: 14 },
      { header: 'STOCK IN (KG)', key: 'stockInKg', width: 18, align: 'right', isNumeric: true },
      { header: 'STOCK OUT (KG)', key: 'stockOutKg', width: 18, align: 'right', isNumeric: true },
      { header: 'CLOSING STOCK BAG', key: 'remainingBag', width: 18, align: 'right', isNumeric: true },
      { header: 'CLOSING STOCK (KG)', key: 'remainingKg', width: 18, align: 'right', isNumeric: true },
      { header: 'CLOSING STOCK (MT)', key: 'remainingMt', width: 16, align: 'right', isNumeric: true },
      { header: 'OCCUPANCY (%)', key: 'occupancy', width: 16, align: 'center' },
    ];

    const exportRows = getVisibleExportRows(false);
    const printedByName = currentUser ? `${currentUser.fullName} (${currentUser.roleName})` : 'Authorized User';

    await exportToExcel(
      exportRows,
      exportColumns,
      isStoreWise ? 'Cold_Storage_Wise_Summary.xlsx' : 'Item_Wise_Summary.xlsx',
      isStoreWise ? 'COLD STORAGE WISE SUMMARY' : 'ITEM WISE SUMMARY',
      companySettings,
      isStoreWise
        ? `Cold Storage Facility Summary (${expandedKeys.size > 0 ? 'Expanded View' : 'Collapsed View'})`
        : `Item Wise Stock Summary (${expandedKeys.size > 0 ? 'Expanded View' : 'Collapsed View'})`,
      { printedBy: printedByName, includeSummary: true }
    );
    addToast('Current view exported to Excel successfully!', 'success');
  };

  // Export to PDF based on current collapse/expand state
  const handleExportTablePdf = () => {
    const isStoreWise = summaryViewMode === 'store-wise';
    const exportColumns: ExportColumn[] = [
      { header: isStoreWise ? 'COLD STORAGE / ITEM' : 'ITEM / VARIETY / CLASS / GRADE', key: 'itemName', width: 32 },
      { header: 'LEVEL', key: 'level', width: 12 },
      { header: 'STOCK IN (KG)', key: 'stockInKg', width: 15, align: 'right', isNumeric: true },
      { header: 'STOCK OUT (KG)', key: 'stockOutKg', width: 15, align: 'right', isNumeric: true },
      { header: 'CLOSING STOCK BAG', key: 'remainingBag', width: 14, align: 'right', isNumeric: true },
      { header: 'CLOSING STOCK (KG)', key: 'remainingKg', width: 14, align: 'right', isNumeric: true },
      { header: 'CLOSING STOCK (MT)', key: 'remainingMt', width: 12, align: 'right', isNumeric: true },
      { header: 'OCCUPANCY', key: 'occupancy', width: 14, align: 'center' },
    ];

    const exportRows = getVisibleExportRows(true);

    exportToPdf(
      exportRows,
      exportColumns,
      isStoreWise ? 'Cold_Storage_Wise_Summary' : 'Item_Wise_Summary',
      isStoreWise ? 'COLD STORAGE WISE SUMMARY' : 'ITEM WISE SUMMARY',
      companySettings,
      'l',
      `Active Season ${companySettings.fiscalYear || '2024-2025'} (${expandedKeys.size > 0 ? 'Expanded View' : 'Collapsed View'})`
    );
    addToast('Current view exported to PDF successfully!', 'success');
  };

  // Open Print Preview Modal based on current collapse/expand state
  const handlePrintModalOpen = () => {
    const isStoreWise = summaryViewMode === 'store-wise';
    const columns: ExportColumn[] = [
      { header: isStoreWise ? 'COLD STORAGE / ITEM' : 'ITEM / VARIETY / CLASS / GRADE', key: 'itemName', width: 32 },
      { header: 'LEVEL', key: 'level', width: 12 },
      { header: 'STOCK IN (KG)', key: 'stockInKg', width: 16, align: 'right', isNumeric: true },
      { header: 'STOCK OUT (KG)', key: 'stockOutKg', width: 16, align: 'right', isNumeric: true },
      { header: 'CLOSING STOCK BAG', key: 'remainingBag', width: 16, align: 'right', isNumeric: true },
      { header: 'CLOSING STOCK (KG)', key: 'remainingKg', width: 16, align: 'right', isNumeric: true },
      { header: 'CLOSING STOCK (MT)', key: 'remainingMt', width: 14, align: 'right', isNumeric: true },
      { header: 'OCCUPANCY', key: 'occupancy', width: 14, align: 'center' },
    ];

    const dataRows = getVisibleExportRows(true);

    setPrintModalConfig({
      isOpen: true,
      title: isStoreWise ? 'COLD STORAGE WISE SUMMARY' : 'ITEM WISE SUMMARY',
      subtitle: `${isStoreWise ? 'Facility-wise' : 'Item-wise'} inventory summary (${
        expandedKeys.size > 0 ? 'Current Expanded State' : 'Collapsed Overview'
      })`,
      columns,
      data: dataRows,
      summaryItems: [
        { label: 'Total Stock In (KG)', value: `${overallTotals.totalStockInKg.toLocaleString()} KG` },
        { label: 'Total Stock Out (KG)', value: `${overallTotals.totalStockOutKg.toLocaleString()} KG` },
        { label: 'Total Closing Stock Bag', value: `${overallTotals.totalRemainingBag.toLocaleString()} Bags` },
        { label: 'Total Closing Stock KG', value: `${overallTotals.totalRemainingKg.toLocaleString()} KG` },
        { label: 'Total Closing Stock MT', value: `${overallTotals.totalRemainingMt.toFixed(2)} MT` },
        { label: 'Overall Occupancy', value: `${overallTotals.overallOccupancy.toFixed(1)}%` },
      ],
    });
  };

  // Density padding classes - refined header width & compact padding as requested
  const thPadding =
    density === 'compact'
      ? 'py-1 px-1.5 text-[9.5px]'
      : density === 'comfortable'
      ? 'py-1.5 px-2 text-[10.5px]'
      : 'py-1 px-1.5 text-[10px]';
  const tdPadding =
    density === 'compact'
      ? 'py-1 px-2 text-[10.5px] tabular-nums'
      : density === 'comfortable'
      ? 'py-1.5 px-2.5 text-xs tabular-nums'
      : 'py-1 px-2 text-[11px] tabular-nums';
  const badgePadding =
    density === 'compact'
      ? 'text-[10px] px-1.5 py-0.5'
      : density === 'comfortable'
      ? 'text-xs px-2.5 py-1'
      : 'text-[11px] px-2 py-0.5';
  const totalPadding =
    density === 'compact'
      ? 'py-1 px-2 text-[10.5px] tabular-nums'
      : density === 'comfortable'
      ? 'py-1.5 px-2.5 text-xs tabular-nums'
      : 'py-1 px-2 text-[11px] tabular-nums';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden print:overflow-visible print:border-none print:shadow-none">
      {/* Section Header */}
      <div className="px-2.5 sm:px-4 py-2 sm:py-2.5 border-b-2 border-indigo-300 dark:border-indigo-800 bg-indigo-100 dark:bg-indigo-950/50 text-slate-800 dark:text-slate-100 shadow-xs print:bg-transparent print:border-b-2 print:border-slate-800 space-y-1.5">
        <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="p-1 rounded-md bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shadow-2xs print:hidden">
                {summaryViewMode === 'store-wise' ? (
                  <Building2 className="w-3.5 h-3.5" />
                ) : (
                  <Boxes className="w-3.5 h-3.5" />
                )}
              </div>
              <h3 className="text-[11px] sm:text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider whitespace-nowrap">
                {summaryViewMode === 'store-wise' ? 'COLD STORAGE WISE SUMMARY' : 'ITEM WISE SUMMARY'}
              </h3>
            </div>

            <div className="relative max-w-40 w-32 sm:w-40 no-print shrink-0">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-7 pr-6 py-1 text-xs rounded-lg bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500/50 shadow-2xs transition-all font-medium"
                aria-label="Filter summary records"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            <div
              className="inline-flex items-center p-0.5 bg-slate-200/90 dark:bg-slate-700/80 rounded-lg border border-slate-300 dark:border-slate-600 shadow-2xs text-xs font-semibold no-print shrink-0"
              role="group"
              aria-label="Summary view mode toggle"
            >
              <button
                type="button"
                onClick={() => {
                  setSummaryViewMode('store-wise');
                  setExpandedKeys(new Set());
                }}
                className={`px-2 py-1 text-[10px] sm:text-[11px] rounded-md transition-all cursor-pointer uppercase whitespace-nowrap ${
                  summaryViewMode === 'store-wise'
                    ? 'bg-sky-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="View store wise summary"
              >
                STORE WISE VIEW
              </button>
              <button
                type="button"
                onClick={() => {
                  setSummaryViewMode('item-wise');
                  setExpandedKeys(new Set());
                }}
                className={`px-2 py-1 text-[10px] sm:text-[11px] rounded-md transition-all cursor-pointer uppercase whitespace-nowrap ${
                  summaryViewMode === 'item-wise'
                    ? 'bg-sky-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="View item wise summary"
              >
                ITEM WISE VIEW
              </button>
            </div>

            <button
              type="button"
              onClick={toggleAllExpanded}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 border border-slate-300 dark:border-slate-600 shadow-2xs transition-colors cursor-pointer inline-flex items-center justify-center no-print shrink-0"
              title={isAllExpanded ? 'Collapse all items' : 'Expand all hierarchical items'}
              aria-label={isAllExpanded ? 'Collapse all items' : 'Expand all hierarchical items'}
            >
              {isAllExpanded ? (
                <ChevronUp className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              )}
            </button>

            <button
              type="button"
              onClick={handleResetToDefault}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 border border-slate-300 dark:border-slate-600 shadow-2xs transition-colors cursor-pointer inline-flex items-center justify-center no-print shrink-0"
              title="Reset summary to default collapsed mode"
              aria-label="Reset summary to default mode"
            >
              <RotateCcw className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            </button>
          </div>

          {/* Right: Excel, PDF, Print stay on the far right */}
          <div className="flex items-center gap-1.5 no-print shrink-0 ml-auto">
            <button
              type="button"
              onClick={handleExportTableExcel}
              className="p-1.5 rounded-lg text-emerald-700 dark:text-emerald-400 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 border border-slate-300 dark:border-slate-600 transition-colors shadow-2xs cursor-pointer inline-flex items-center justify-center"
              title="Export current view to Excel"
              aria-label="Export to Excel"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleExportTablePdf}
              className="p-1.5 rounded-lg text-rose-700 dark:text-rose-400 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 border border-slate-300 dark:border-slate-600 transition-colors shadow-2xs cursor-pointer inline-flex items-center justify-center"
              title="Export current view to PDF"
              aria-label="Export to PDF"
            >
              <FileText className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handlePrintModalOpen}
              className="p-1.5 rounded-lg text-slate-700 dark:text-slate-200 bg-white hover:bg-slate-50 dark:bg-slate-700 dark:hover:bg-slate-650 border border-slate-300 dark:border-slate-600 transition-colors shadow-2xs cursor-pointer inline-flex items-center justify-center"
              title="Print current view"
              aria-label="Print current view"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content: Empty state or Table */}
      {summaryViewMode === 'store-wise' && coldStorages.length === 0 ? (
        <ColdStorageEmptyState />
      ) : (
        <div className="overflow-x-auto print:overflow-visible -mx-0">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 font-bold border-b border-slate-300 dark:border-slate-700 print:bg-slate-100 print:text-black">
              <tr>
                <th
                  onClick={() => handleSort('name')}
                  className={`border border-slate-300 dark:border-slate-700 ${thPadding} font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 cursor-pointer select-none transition-colors group align-middle ${
                    sortField === 'name' ? 'bg-slate-200 dark:bg-slate-700 text-sky-700 dark:text-sky-300' : 'hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{summaryViewMode === 'store-wise' ? 'COLD STORAGE NAME' : 'ITEM NAME'}</span>
                    <SortIcon field="name" currentField={sortField} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('stockInKg')}
                  className={`border border-slate-300 dark:border-slate-700 ${thPadding} text-right font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 cursor-pointer select-none transition-colors group align-middle ${
                    sortField === 'stockInKg' ? 'bg-slate-200 dark:bg-slate-700 text-sky-700 dark:text-sky-300' : 'hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <span>STOCK IN (KG)</span>
                    <SortIcon field="stockInKg" currentField={sortField} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('stockOutKg')}
                  className={`border border-slate-300 dark:border-slate-700 ${thPadding} text-right font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 cursor-pointer select-none transition-colors group align-middle ${
                    sortField === 'stockOutKg' ? 'bg-slate-200 dark:bg-slate-700 text-sky-700 dark:text-sky-300' : 'hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <span>STOCK OUT (KG)</span>
                    <SortIcon field="stockOutKg" currentField={sortField} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('remainingBag')}
                  className={`border border-slate-300 dark:border-slate-700 ${thPadding} text-right font-bold uppercase tracking-wider text-sky-900 dark:text-sky-200 cursor-pointer select-none transition-colors group align-middle ${
                    sortField === 'remainingBag' ? 'bg-sky-200/90 dark:bg-sky-900/80' : 'hover:bg-sky-100/60 dark:hover:bg-sky-900/40'
                  }`}
                >
                  <div className="inline-flex items-center justify-end gap-1">
                    <span>CLOSING STOCK BAG</span>
                    <SortIcon field="remainingBag" currentField={sortField} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('remainingKg')}
                  className={`border border-slate-300 dark:border-slate-700 ${thPadding} text-right font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-200 cursor-pointer select-none transition-colors group align-middle ${
                    sortField === 'remainingKg' ? 'bg-indigo-200/90 dark:bg-indigo-900/80' : 'hover:bg-indigo-100/60 dark:hover:bg-indigo-900/40'
                  }`}
                >
                  <div className="inline-flex items-center justify-end gap-1">
                    <span>CLOSING STOCK (KG)</span>
                    <SortIcon field="remainingKg" currentField={sortField} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('remainingMt')}
                  className={`border border-slate-300 dark:border-slate-700 ${thPadding} text-right font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-200 cursor-pointer select-none transition-colors group align-middle ${
                    sortField === 'remainingMt' ? 'bg-emerald-200/90 dark:bg-emerald-900/80' : 'hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40'
                  }`}
                >
                  <div className="inline-flex items-center justify-end gap-1">
                    <span>CLOSING STOCK (MT)</span>
                    <SortIcon field="remainingMt" currentField={sortField} direction={sortDir} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('occupancy')}
                  className={`border border-slate-300 dark:border-slate-700 ${thPadding} text-center font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 cursor-pointer select-none transition-colors group align-middle ${
                    sortField === 'occupancy' ? 'bg-slate-200 dark:bg-slate-700 text-sky-700 dark:text-sky-300' : 'hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
                  }`}
                >
                  <div className="inline-flex items-center justify-center gap-1.5">
                    <span>OCCUPANCY</span>
                    <SortIcon field="occupancy" currentField={sortField} direction={sortDir} />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800">
              {/* STORE WISE VIEW RENDERING */}
              {summaryViewMode === 'store-wise' &&
                sortedStoreWiseData.map((f, idx) => {
                  const isCsExpanded = expandedKeys.has(`cs_${f.id}`);
                  const isHighlighted = highlightedRowId === f.id;
                  const palette = COLD_STORAGE_ROW_PALETTE[idx % COLD_STORAGE_ROW_PALETTE.length];

                  return (
                    <React.Fragment key={f.id}>
                      {/* LEVEL 0: Cold Storage Row */}
                      <tr
                        onClick={() => {
                          setHighlightedRowId(isHighlighted ? null : f.id);
                          toggleKey(`cs_${f.id}`);
                        }}
                        className={`group relative cursor-pointer transition-colors duration-200 select-none ${palette.borderLeft} ${
                          isHighlighted ? palette.highlight : `${palette.bg} ${palette.hover}`
                        } print:hover:bg-transparent`}
                      >
                        <td className={`relative ${tdPadding} font-semibold text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700`}>
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-200 rounded-r ${
                              isHighlighted
                                ? `${palette.accentIndicator} opacity-100`
                                : `${palette.accentIndicator} opacity-0 group-hover:opacity-100`
                            } print:hidden`}
                          />
                          <div className="flex items-center gap-1.5 pl-0.5">
                            {/* Chevron collapse/expand button */}
                            <button
                              type="button"
                              onClick={(e) => toggleKey(`cs_${f.id}`, e)}
                              className={`p-1 rounded-md transition-all duration-150 cursor-pointer shrink-0 ${
                                isCsExpanded
                                  ? 'bg-sky-200/90 dark:bg-sky-900/80 text-sky-800 dark:text-sky-200 shadow-2xs'
                                  : 'hover:bg-slate-200/70 dark:hover:bg-slate-700/60 text-slate-500 dark:text-slate-400'
                              }`}
                              title={isCsExpanded ? 'Collapse facility varieties' : 'Expand facility varieties'}
                              aria-label={isCsExpanded ? 'Collapse facility varieties' : 'Expand facility varieties'}
                            >
                              <ChevronRight
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                  isCsExpanded ? 'transform rotate-90 text-sky-700 dark:text-sky-300' : ''
                                }`}
                              />
                            </button>
                            <span
                              className={`inline-block font-semibold rounded-md transition-all shadow-2xs group-hover:shadow-xs group-hover:translate-x-0.5 whitespace-normal ${badgePadding} ${palette.badge}`}
                            >
                              {f.name}
                            </span>
                          </div>
                        </td>
                        <td className={`${tdPadding} text-right font-medium text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700`}>
                          {f.stockInKg > 0 ? f.stockInKg.toLocaleString() : '-'}
                        </td>
                        <td className={`${tdPadding} text-right font-medium text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700`}>
                          {f.stockOutKg > 0 ? f.stockOutKg.toLocaleString() : '-'}
                        </td>
                        <td className={`${tdPadding} text-right font-bold text-sky-700 dark:text-sky-300 bg-sky-50/40 dark:bg-sky-950/25 border border-slate-300 dark:border-slate-700`}>
                          <span className="inline-block group-hover:scale-105 transition-transform duration-150 origin-right">
                            {f.remainingBag > 0 ? f.remainingBag.toLocaleString() : '-'}
                          </span>
                        </td>
                        <td className={`${tdPadding} text-right font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50/40 dark:bg-indigo-950/25 border border-slate-300 dark:border-slate-700`}>
                          {f.remainingKg > 0 ? f.remainingKg.toLocaleString() : '-'}
                        </td>
                        <td className={`${tdPadding} text-right font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/25 border border-slate-300 dark:border-slate-700`}>
                          {f.remainingMt > 0 ? f.remainingMt.toFixed(2) : '-'}
                        </td>
                        <td className={`${tdPadding} text-center border border-slate-300 dark:border-slate-700`}>
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${getOccupancyBadgeColor(
                              f.occupancy
                            )}`}
                          >
                            {f.occupancy.toFixed(1)}%
                          </span>
                        </td>
                      </tr>

                      {/* LEVEL 1: Potato Varieties (when Storage is expanded) */}
                      {isCsExpanded &&
                        f.varieties.map((v, vIdx) => {
                          const isVarExpanded = expandedKeys.has(`v_${f.id}_${v.varietyId}`);
                          const vPalette = getItemPalette(v.name, vIdx);

                          return (
                            <React.Fragment key={v.id}>
                              <tr
                                onClick={() => toggleKey(`v_${f.id}_${v.varietyId}`)}
                                className={`group cursor-pointer ${vPalette.bg} ${vPalette.hover} transition-colors select-none ${vPalette.borderLeft}`}
                              >
                                <td className={`${tdPadding} font-medium text-slate-800 dark:text-slate-200 pl-6 sm:pl-8 border border-slate-300 dark:border-slate-700`}>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={(e) => toggleKey(`v_${f.id}_${v.varietyId}`, e)}
                                      className={`p-0.5 rounded transition-all cursor-pointer shrink-0 ${
                                        isVarExpanded
                                          ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                                          : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                      }`}
                                      title={isVarExpanded ? 'Collapse variety classes' : 'Expand variety classes'}
                                    >
                                      <ChevronRight
                                        className={`w-3 h-3 transition-transform duration-200 ${
                                          isVarExpanded ? 'transform rotate-90 text-sky-600 dark:text-sky-400' : ''
                                        }`}
                                      />
                                    </button>
                                    <span
                                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${vPalette.badge} font-bold shadow-2xs`}
                                    >
                                      <Sprout className="w-3 h-3 shrink-0" />
                                      <span className="whitespace-nowrap">{v.name.toUpperCase()}</span>
                                    </span>
                                  </div>
                                </td>
                                <td className={`${tdPadding} text-right font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700`}>
                                  {v.stockInKg > 0 ? v.stockInKg.toLocaleString() : '-'}
                                </td>
                                <td className={`${tdPadding} text-right font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700`}>
                                  {v.stockOutKg > 0 ? v.stockOutKg.toLocaleString() : '-'}
                                </td>
                                <td className={`${tdPadding} text-right font-bold text-sky-700 dark:text-sky-300 bg-sky-50/40 dark:bg-sky-950/25 border border-slate-300 dark:border-slate-700`}>
                                  {v.remainingBag > 0 ? v.remainingBag.toLocaleString() : '-'}
                                </td>
                                <td className={`${tdPadding} text-right font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50/40 dark:bg-indigo-950/25 border border-slate-300 dark:border-slate-700`}>
                                  {v.remainingKg > 0 ? v.remainingKg.toLocaleString() : '-'}
                                </td>
                                <td className={`${tdPadding} text-right font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/25 border border-slate-300 dark:border-slate-700`}>
                                  {v.remainingMt > 0 ? v.remainingMt.toFixed(2) : '-'}
                                </td>
                                <td className={`${tdPadding} text-center border border-slate-300 dark:border-slate-700`}>
                                  <span
                                    className={`inline-block px-2 py-0.2 rounded-full text-[10px] font-bold ${getOccupancyBadgeColor(
                                      v.occupancy
                                    )}`}
                                  >
                                    {v.occupancy.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>

                              {/* LEVEL 2: Potato Class Total Row (Placed on top of its grades) */}
                              {isVarExpanded &&
                                v.classes.map((cls) => {
                                  const isClassExpanded = expandedKeys.has(`c_${f.id}_${v.varietyId}_${cls.classId}`);
                                  const hasGrades = cls.grades.length > 0;

                                  return (
                                    <React.Fragment key={cls.id}>
                                      <tr
                                        onClick={() => hasGrades && toggleKey(`c_${f.id}_${v.varietyId}_${cls.classId}`)}
                                        className={`group transition-colors select-none bg-slate-100/60 dark:bg-slate-800/50 hover:bg-amber-50/50 dark:hover:bg-slate-800/70 border-l-2 border-l-amber-500 dark:border-l-amber-500 ${
                                          hasGrades ? 'cursor-pointer' : ''
                                        }`}
                                      >
                                        <td className={`${tdPadding} font-medium text-slate-800 dark:text-slate-200 pl-11 sm:pl-14 border border-slate-300 dark:border-slate-700`}>
                                          <div className="flex items-center gap-1.5">
                                            {hasGrades ? (
                                              <button
                                                type="button"
                                                onClick={(e) => toggleKey(`c_${f.id}_${v.varietyId}_${cls.classId}`, e)}
                                                className={`p-0.5 rounded transition-all cursor-pointer shrink-0 ${
                                                  isClassExpanded
                                                    ? 'bg-amber-200/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
                                                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                                }`}
                                                title={isClassExpanded ? 'Collapse class grades' : 'Expand class grades'}
                                              >
                                                <ChevronRight
                                                  className={`w-3 h-3 transition-transform duration-200 ${
                                                    isClassExpanded ? 'transform rotate-90 text-amber-700 dark:text-amber-300' : ''
                                                  }`}
                                                />
                                              </button>
                                            ) : (
                                              <span className="w-3.5" />
                                            )}
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100/90 text-amber-950 dark:bg-amber-950/70 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-bold text-[11px] shadow-2xs whitespace-nowrap">
                                              <Layers className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                              <span className="whitespace-nowrap">TOTAL {cls.name.toUpperCase()}</span>
                                            </span>
                                          </div>
                                        </td>
                                        <td className={`${tdPadding} text-right font-bold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700`}>
                                          {cls.stockInKg > 0 ? cls.stockInKg.toLocaleString() : '-'}
                                        </td>
                                        <td className={`${tdPadding} text-right font-bold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700`}>
                                          {cls.stockOutKg > 0 ? cls.stockOutKg.toLocaleString() : '-'}
                                        </td>
                                        <td className={`${tdPadding} text-right font-bold text-sky-700 dark:text-sky-300 bg-sky-50/40 dark:bg-sky-950/25 border border-slate-300 dark:border-slate-700`}>
                                          {cls.remainingBag > 0 ? cls.remainingBag.toLocaleString() : '-'}
                                        </td>
                                        <td className={`${tdPadding} text-right font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50/40 dark:bg-indigo-950/25 border border-slate-300 dark:border-slate-700`}>
                                          {cls.remainingKg > 0 ? cls.remainingKg.toLocaleString() : '-'}
                                        </td>
                                        <td className={`${tdPadding} text-right font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/25 border border-slate-300 dark:border-slate-700`}>
                                          {cls.remainingMt > 0 ? cls.remainingMt.toFixed(2) : '-'}
                                        </td>
                                        <td className={`${tdPadding} text-center border border-slate-300 dark:border-slate-700`}>
                                          <span
                                            className={`inline-block px-2 py-0.2 rounded-full text-[10px] font-bold ${getOccupancyBadgeColor(
                                              cls.occupancy
                                            )}`}
                                          >
                                            {cls.occupancy.toFixed(1)}%
                                          </span>
                                        </td>
                                      </tr>

                                      {/* LEVEL 3: Potato Grades (Directly below their Class Total row) */}
                                      {isClassExpanded &&
                                        cls.grades.map((grd) => (
                                          <tr
                                            key={grd.id}
                                            className="bg-white/90 dark:bg-slate-900/60 hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors border-l-2 border-l-emerald-400 dark:border-l-emerald-600"
                                          >
                                            <td className={`${tdPadding} text-slate-600 dark:text-slate-300 pl-16 sm:pl-20 border border-slate-300 dark:border-slate-700`}>
                                              <div className="flex items-center gap-1.5">
                                                <CornerDownRight className="w-3 h-3 text-slate-400 shrink-0" />
                                                <span className="inline-flex items-center px-2 py-0.5 rounded border border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 font-semibold text-[10px] uppercase tracking-wider shadow-2xs">
                                                  {grd.name}
                                                </span>
                                              </div>
                                            </td>
                                            <td className={`${tdPadding} text-right font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700`}>
                                              {grd.stockInKg > 0 ? grd.stockInKg.toLocaleString() : '-'}
                                            </td>
                                            <td className={`${tdPadding} text-right font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700`}>
                                              {grd.stockOutKg > 0 ? grd.stockOutKg.toLocaleString() : '-'}
                                            </td>
                                            <td className={`${tdPadding} text-right font-semibold text-sky-700 dark:text-sky-300 bg-sky-50/40 dark:bg-sky-950/25 border border-slate-300 dark:border-slate-700`}>
                                              {grd.remainingBag > 0 ? grd.remainingBag.toLocaleString() : '-'}
                                            </td>
                                            <td className={`${tdPadding} text-right font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50/40 dark:bg-indigo-950/25 border border-slate-300 dark:border-slate-700`}>
                                              {grd.remainingKg > 0 ? grd.remainingKg.toLocaleString() : '-'}
                                            </td>
                                            <td className={`${tdPadding} text-right font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/25 border border-slate-300 dark:border-slate-700`}>
                                              {grd.remainingMt > 0 ? grd.remainingMt.toFixed(2) : '-'}
                                            </td>
                                            <td className={`${tdPadding} text-center border border-slate-300 dark:border-slate-700`}>
                                              <span
                                                className={`inline-block px-2 py-0.2 rounded-full text-[9.5px] font-bold ${getOccupancyBadgeColor(
                                                  grd.occupancy
                                                )}`}
                                              >
                                                {grd.occupancy.toFixed(1)}%
                                              </span>
                                            </td>
                                          </tr>
                                        ))}
                                    </React.Fragment>
                                  );
                                })}
                            </React.Fragment>
                          );
                        })}
                    </React.Fragment>
                  );
                })}

              {/* ITEM WISE VIEW RENDERING */}
              {summaryViewMode === 'item-wise' &&
                sortedItemWiseData.map((v, vIdx) => {
                  const isVarExpanded = expandedKeys.has(`v_${v.varietyId}`);
                  const palette = getItemPalette(v.name, vIdx);
                  const isHighlighted = highlightedRowId === v.id;

                  return (
                    <React.Fragment key={v.id}>
                      {/* LEVEL 0: Potato Variety Row - Distinct vibrant palette per item */}
                      <tr
                        onClick={() => {
                          setHighlightedRowId(isHighlighted ? null : v.id);
                          toggleKey(`v_${v.varietyId}`);
                        }}
                        className={`group relative cursor-pointer transition-colors duration-200 select-none ${palette.borderLeft} ${
                          isHighlighted ? palette.highlight : `${palette.bg} ${palette.hover}`
                        } print:hover:bg-transparent`}
                      >
                        <td className={`relative ${tdPadding} font-semibold text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700`}>
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-200 rounded-r ${
                              isHighlighted
                                ? `${palette.accentIndicator} opacity-100`
                                : `${palette.accentIndicator} opacity-0 group-hover:opacity-100`
                            } print:hidden`}
                          />
                          <div className="flex items-center gap-1.5 pl-0.5">
                            <button
                              type="button"
                              onClick={(e) => toggleKey(`v_${v.varietyId}`, e)}
                              className={`p-1 rounded-md transition-all duration-150 cursor-pointer shrink-0 ${
                                isVarExpanded
                                  ? 'bg-sky-200/90 dark:bg-sky-900/80 text-sky-800 dark:text-sky-200 shadow-2xs'
                                  : 'hover:bg-slate-200/70 dark:hover:bg-slate-700/60 text-slate-500 dark:text-slate-400'
                              }`}
                              title={isVarExpanded ? 'Collapse variety classes' : 'Expand variety classes'}
                            >
                              <ChevronRight
                                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                                  isVarExpanded ? 'transform rotate-90 text-sky-700 dark:text-sky-300' : ''
                                }`}
                              />
                            </button>
                            <span
                              className={`inline-block font-semibold rounded-md transition-all shadow-2xs group-hover:shadow-xs group-hover:translate-x-0.5 whitespace-nowrap ${badgePadding} ${palette.badge}`}
                            >
                              {v.name.toUpperCase()}
                            </span>
                          </div>
                        </td>
                        <td className={`${tdPadding} text-right font-medium text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700`}>
                          {v.stockInKg > 0 ? v.stockInKg.toLocaleString() : '-'}
                        </td>
                        <td className={`${tdPadding} text-right font-medium text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700`}>
                          {v.stockOutKg > 0 ? v.stockOutKg.toLocaleString() : '-'}
                        </td>
                        <td className={`${tdPadding} text-right font-bold text-sky-700 dark:text-sky-300 bg-sky-50/40 dark:bg-sky-950/25 border border-slate-300 dark:border-slate-700`}>
                          <span className="inline-block group-hover:scale-105 transition-transform duration-150 origin-right">
                            {v.remainingBag > 0 ? v.remainingBag.toLocaleString() : '-'}
                          </span>
                        </td>
                        <td className={`${tdPadding} text-right font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50/40 dark:bg-indigo-950/25 border border-slate-300 dark:border-slate-700`}>
                          {v.remainingKg > 0 ? v.remainingKg.toLocaleString() : '-'}
                        </td>
                        <td className={`${tdPadding} text-right font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/25 border border-slate-300 dark:border-slate-700`}>
                          {v.remainingMt > 0 ? v.remainingMt.toFixed(2) : '-'}
                        </td>
                        <td className={`${tdPadding} text-center border border-slate-300 dark:border-slate-700`}>
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-bold ${getOccupancyBadgeColor(
                              v.occupancy
                            )}`}
                          >
                            {v.occupancy.toFixed(1)}%
                          </span>
                        </td>
                      </tr>

                      {/* LEVEL 1: Potato Class Total Row (Placed on top of its grades) */}
                      {isVarExpanded &&
                        v.classes.map((cls) => {
                          const isClassExpanded = expandedKeys.has(`c_${v.varietyId}_${cls.classId}`);
                          const hasGrades = cls.grades.length > 0;

                          return (
                            <React.Fragment key={cls.id}>
                              <tr
                                onClick={() => hasGrades && toggleKey(`c_${v.varietyId}_${cls.classId}`)}
                                className={`group transition-colors select-none bg-slate-100/60 dark:bg-slate-800/50 hover:bg-amber-50/50 dark:hover:bg-slate-800/70 border-l-2 border-l-amber-500 dark:border-l-amber-500 ${
                                  hasGrades ? 'cursor-pointer' : ''
                                }`}
                              >
                                <td className={`${tdPadding} font-medium text-slate-800 dark:text-slate-200 pl-7 sm:pl-9 border border-slate-300 dark:border-slate-700`}>
                                  <div className="flex items-center gap-1.5">
                                    {hasGrades ? (
                                      <button
                                        type="button"
                                        onClick={(e) => toggleKey(`c_${v.varietyId}_${cls.classId}`, e)}
                                        className={`p-0.5 rounded transition-all cursor-pointer shrink-0 ${
                                          isClassExpanded
                                            ? 'bg-amber-200/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
                                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                        }`}
                                        title={isClassExpanded ? 'Collapse class grades' : 'Expand class grades'}
                                      >
                                        <ChevronRight
                                          className={`w-3 h-3 transition-transform duration-200 ${
                                            isClassExpanded ? 'transform rotate-90 text-amber-700 dark:text-amber-300' : ''
                                          }`}
                                        />
                                      </button>
                                    ) : (
                                      <span className="w-3.5" />
                                    )}
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100/90 text-amber-950 dark:bg-amber-950/70 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-bold text-[11px] shadow-2xs whitespace-nowrap">
                                      <Layers className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                                      <span className="whitespace-nowrap">TOTAL {cls.name.toUpperCase()}</span>
                                    </span>
                                  </div>
                                </td>
                                <td className={`${tdPadding} text-right font-bold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700`}>
                                  {cls.stockInKg > 0 ? cls.stockInKg.toLocaleString() : '-'}
                                </td>
                                <td className={`${tdPadding} text-right font-bold text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700`}>
                                  {cls.stockOutKg > 0 ? cls.stockOutKg.toLocaleString() : '-'}
                                </td>
                                <td className={`${tdPadding} text-right font-bold text-sky-700 dark:text-sky-300 bg-sky-50/40 dark:bg-sky-950/25 border border-slate-300 dark:border-slate-700`}>
                                  {cls.remainingBag > 0 ? cls.remainingBag.toLocaleString() : '-'}
                                </td>
                                <td className={`${tdPadding} text-right font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50/40 dark:bg-indigo-950/25 border border-slate-300 dark:border-slate-700`}>
                                  {cls.remainingKg > 0 ? cls.remainingKg.toLocaleString() : '-'}
                                </td>
                                <td className={`${tdPadding} text-right font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/25 border border-slate-300 dark:border-slate-700`}>
                                  {cls.remainingMt > 0 ? cls.remainingMt.toFixed(2) : '-'}
                                </td>
                                <td className={`${tdPadding} text-center border border-slate-300 dark:border-slate-700`}>
                                  <span
                                    className={`inline-block px-2 py-0.2 rounded-full text-[10px] font-bold ${getOccupancyBadgeColor(
                                      cls.occupancy
                                    )}`}
                                  >
                                    {cls.occupancy.toFixed(1)}%
                                  </span>
                                </td>
                              </tr>

                              {/* LEVEL 2: Potato Grades (Directly below their Class Total row) */}
                              {isClassExpanded &&
                                cls.grades.map((grd) => (
                                  <tr
                                    key={grd.id}
                                    className="bg-white/90 dark:bg-slate-900/60 hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors border-l-2 border-l-emerald-400 dark:border-l-emerald-600"
                                  >
                                    <td className={`${tdPadding} text-slate-600 dark:text-slate-300 pl-14 sm:pl-16 border border-slate-300 dark:border-slate-700`}>
                                      <div className="flex items-center gap-1.5">
                                        <CornerDownRight className="w-3 h-3 text-slate-400 shrink-0" />
                                        <span className="inline-flex items-center px-2 py-0.5 rounded border border-teal-300 dark:border-teal-700 bg-teal-50 dark:bg-teal-950/50 text-teal-800 dark:text-teal-200 font-semibold text-[10px] uppercase tracking-wider shadow-2xs">
                                          {grd.name}
                                        </span>
                                      </div>
                                    </td>
                                    <td className={`${tdPadding} text-right font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700`}>
                                      {grd.stockInKg > 0 ? grd.stockInKg.toLocaleString() : '-'}
                                    </td>
                                    <td className={`${tdPadding} text-right font-medium text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700`}>
                                      {grd.stockOutKg > 0 ? grd.stockOutKg.toLocaleString() : '-'}
                                    </td>
                                    <td className={`${tdPadding} text-right font-semibold text-sky-700 dark:text-sky-300 bg-sky-50/40 dark:bg-sky-950/25 border border-slate-300 dark:border-slate-700`}>
                                      {grd.remainingBag > 0 ? grd.remainingBag.toLocaleString() : '-'}
                                    </td>
                                    <td className={`${tdPadding} text-right font-medium text-indigo-700 dark:text-indigo-300 bg-indigo-50/40 dark:bg-indigo-950/25 border border-slate-300 dark:border-slate-700`}>
                                      {grd.remainingKg > 0 ? grd.remainingKg.toLocaleString() : '-'}
                                    </td>
                                    <td className={`${tdPadding} text-right font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/25 border border-slate-300 dark:border-slate-700`}>
                                      {grd.remainingMt > 0 ? grd.remainingMt.toFixed(2) : '-'}
                                    </td>
                                    <td className={`${tdPadding} text-center border border-slate-300 dark:border-slate-700`}>
                                      <span
                                        className={`inline-block px-2 py-0.2 rounded-full text-[9.5px] font-bold ${getOccupancyBadgeColor(
                                          grd.occupancy
                                        )}`}
                                      >
                                        {grd.occupancy.toFixed(1)}%
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                            </React.Fragment>
                          );
                        })}
                    </React.Fragment>
                  );
                })}
            </tbody>

            {/* Table Footer: TOTAL */}
            <tfoot className="bg-slate-100 dark:bg-slate-850 font-black border-t-2 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white print:bg-slate-100 print:text-black text-xs">
              <tr>
                <td className={`${totalPadding} pl-3 text-left uppercase tracking-wider font-black border border-slate-300 dark:border-slate-700`}>
                  TOTAL
                </td>
                <td className={`${totalPadding} pr-3 text-right font-black border border-slate-300 dark:border-slate-700`}>
                  {overallTotals.totalStockInKg > 0 ? overallTotals.totalStockInKg.toLocaleString() : '-'}
                </td>
                <td className={`${totalPadding} pr-3 text-right font-black border border-slate-300 dark:border-slate-700`}>
                  {overallTotals.totalStockOutKg > 0 ? overallTotals.totalStockOutKg.toLocaleString() : '-'}
                </td>
                <td className={`${totalPadding} pr-3 text-right text-sky-700 dark:text-sky-300 font-black bg-sky-50/50 dark:bg-sky-950/30 border border-slate-300 dark:border-slate-700`}>
                  {overallTotals.totalRemainingBag > 0 ? overallTotals.totalRemainingBag.toLocaleString() : '-'}
                </td>
                <td className={`${totalPadding} pr-3 text-right font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50/50 dark:bg-indigo-950/30 border border-slate-300 dark:border-slate-700`}>
                  {overallTotals.totalRemainingKg > 0 ? overallTotals.totalRemainingKg.toLocaleString() : '-'}
                </td>
                <td className={`${totalPadding} pr-3 text-right font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/30 border border-slate-300 dark:border-slate-700`}>
                  {overallTotals.totalRemainingMt > 0 ? overallTotals.totalRemainingMt.toFixed(2) : '-'}
                </td>
                <td className={`${totalPadding} text-center border border-slate-300 dark:border-slate-700`}>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10.5px] font-black ${getOccupancyBadgeColor(
                      overallTotals.overallOccupancy
                    )}`}
                  >
                    {overallTotals.overallOccupancy.toFixed(1)}%
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={printModalConfig.isOpen}
        onClose={() => setPrintModalConfig((prev) => ({ ...prev, isOpen: false }))}
        documentTitle={printModalConfig.title}
        subtitle={printModalConfig.subtitle}
        columns={printModalConfig.columns}
        data={printModalConfig.data}
        summaryItems={printModalConfig.summaryItems}
      />
    </div>
  );
};
